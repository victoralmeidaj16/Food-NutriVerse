import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, ActivityIndicator } from 'react-native';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './services/firebaseConfig';
import { getUserProfile, saveUserProfile, updateUserProfile } from './services/userService';
import { MOCK_RECIPES } from './services/mockData';
import { RecipeDetailScreen } from './screens/RecipeDetailScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { PaywallScreen } from './screens/PaywallScreen';
import { RecipePackScreen } from './screens/RecipePackScreen';
import { MainScreen } from './screens/MainScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { UserProfile, UserGoal, ActivityLevel, AppUsageMode, SubscriptionPlan, Recipe, WeeklyPlan } from './types';
import { storageService } from './services/storage';
import { LanguageProvider } from './context/LanguageContext';
import { iapService } from './services/iapService';

// --- Types ---
type Screen = 'LOGIN' | 'SIGNUP' | 'ONBOARDING' | 'MAIN' | 'RECIPE_DETAIL' | 'PAYWALL' | 'RECIPE_PACK';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('ONBOARDING');
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);

  const loadUserProfile = async (uid: string) => {
    try {
      const profile = await getUserProfile(uid);
      if (profile) {
        setUserProfile(profile);
        setUser({ name: profile.name });
        await storageService.saveProfile(profile); // Save to local storage
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const loadUserSpecificData = async (uid: string) => {
    try {
      // Load profile from Firestore first, then local storage
      const profile = await getUserProfile(uid);
      if (profile) {
        setUserProfile(profile);
        setUser({ name: profile.name });
        await storageService.saveProfile(profile);
      } else {
        // If no profile in Firestore, check local storage
        const localProfile = await storageService.loadProfile();
        if (localProfile) {
          setUserProfile(localProfile);
          setUser({ name: localProfile.name });
          // Optionally, save this local profile to Firestore if it's missing there
          await saveUserProfile(uid, localProfile);
        } else {
          // If no profile anywhere, create a default one
          const defaultProfile: UserProfile = {
            name: 'Usuário',
            goal: UserGoal.LOSE_WEIGHT,
            activityLevel: ActivityLevel.MEDIUM,
            mealsPerDay: 3,
            mealSlots: ['Café', 'Almoço', 'Jantar'],
            dietaryRestrictions: [],
            dislikes: [],
            usageModes: [AppUsageMode.FIT_SWAP],
            plan: SubscriptionPlan.FREE,
            isPro: false,
            usageStats: {
              recipesGeneratedToday: 0,
              lastGenerationDate: new Date().toISOString(),
              desiresTransformedToday: 0,
              lastDesireDate: new Date().toISOString(),
              pantryScansThisWeek: 0,
              lastScanDate: new Date().toISOString(),
              savedRecipesCount: 0
            }
          };
          await saveUserProfile(uid, defaultProfile);
          await storageService.saveProfile(defaultProfile);
          setUserProfile(defaultProfile);
          setUser({ name: defaultProfile.name });
        }
      }

      const saved = await storageService.loadSavedRecipes();
      setSavedRecipes(new Set(saved));

      const plan = await storageService.loadWeeklyPlan();
      if (plan) setWeeklyPlan(plan);
      if (plan) setWeeklyPlan(plan);
      else setWeeklyPlan(null);

    } catch (error) {
      console.error("Error loading user specific data:", error);
    }
  };

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        await loadUserSpecificData(currentUser.uid);
        setCurrentScreen('MAIN');
      } else {
        setUser(null);
        setUserProfile(null);
        setSavedRecipes(new Set());
        setWeeklyPlan(null); // Clear weekly plan on logout
        // If we just logged out, go to ONBOARDING (or LOGIN? User asked for Onboarding first)
        setCurrentScreen('ONBOARDING');
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Initialize IAP on app start
  useEffect(() => {
    const initIAP = async () => {
      const initialized = await iapService.initialize();
      if (initialized) {
        console.log('App: IAP initialized successfully');

        // Check if user has active subscription
        const subStatus = await iapService.checkSubscriptionStatus();
        if (subStatus.isActive && userProfile && firebaseUser) {
          // Update user profile to reflect active subscription
          const updatedProfile = {
            ...userProfile,
            isPro: true,
            plan: subStatus.productId?.includes('yearly') ? SubscriptionPlan.YEARLY : SubscriptionPlan.MONTHLY,
            subscriptionExpiry: new Date(subStatus.expiryDate || 0).toISOString()
          };
          await updateUserProfile(firebaseUser.uid, updatedProfile);
          setUserProfile(updatedProfile);
        }
      }
    };

    initIAP();

    // Cleanup on unmount
    return () => {
      iapService.disconnect();
    };
  }, []);


  const handleOnboardingComplete = (profile: UserProfile) => {
    setPendingProfile(profile);
    setCurrentScreen('SIGNUP');
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    const newSaved = new Set(savedRecipes);
    if (newSaved.has(recipe.id)) {
      newSaved.delete(recipe.id);
    } else {
      newSaved.add(recipe.id);
    }
    setSavedRecipes(newSaved);
    await storageService.saveSavedRecipes(Array.from(newSaved));

    if (userProfile && firebaseUser) {
      const updatedProfile = { ...userProfile };
      setUserProfile(updatedProfile);
      // savedRecipes is no longer part of UserProfile, so we don't save it here.
      // It should be handled via SubscriptionService or a separate collection if needed.
      // For now, we just update the local state to reflect the UI change (if any).
      await updateUserProfile(firebaseUser.uid, {});
    }
  };

  const handleUpdateProfile = async (profile: UserProfile) => {
    setUserProfile(profile);
    setUser({ name: profile.name });
    if (firebaseUser) {
      await updateUserProfile(firebaseUser.uid, profile);
      await storageService.saveProfile(profile);
    }
  };

  const handleLogout = async () => {
    try {
      await storageService.clearAll(); // Clear local storage
      await signOut(auth);
      // State listener will handle navigation
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const handleAddToPlan = async (recipe: Recipe, dayIndex: number, slotIndex: number) => {
    if (!weeklyPlan) return;

    const newPlan = { ...weeklyPlan };
    // Generate a new ID for the recipe instance to avoid conflicts
    const recipeInstance = { ...recipe, id: Math.random().toString(36).substr(2, 9) };
    newPlan.days[dayIndex].meals[slotIndex].recipe = recipeInstance;

    setWeeklyPlan(newPlan);
    await storageService.saveWeeklyPlan(newPlan);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#a6f000" />
      </View>
    );
  }

  // If selectedRecipe is set, show detail screen overlay
  if (selectedRecipe) {
    return (
      <RecipeDetailScreen
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onSave={handleSaveRecipe}
        isSaved={savedRecipes.has(selectedRecipe.id)}
        userDislikes={userProfile?.dislikes || []}
        weeklyPlan={weeklyPlan}
        onAddToPlan={handleAddToPlan}
      />
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'ONBOARDING':
        return <OnboardingScreen onComplete={handleOnboardingComplete} onLogin={() => setCurrentScreen('LOGIN')} />;
      case 'LOGIN':
        return <LoginScreen onNavigateToSignUp={() => setCurrentScreen('ONBOARDING')} />;
      case 'SIGNUP':
        return <SignUpScreen onNavigateToLogin={() => setCurrentScreen('LOGIN')} initialProfile={pendingProfile} />;
      case 'PAYWALL':
        return (
          <PaywallScreen
            onPurchase={() => {
              // Refresh profile to get PRO status
              if (firebaseUser) {
                loadUserProfile(firebaseUser.uid);
              }
              setCurrentScreen('MAIN');
            }}
            onRestore={() => {
              if (firebaseUser) {
                loadUserProfile(firebaseUser.uid);
              }
              setCurrentScreen('MAIN');
            }}
            onClose={() => setCurrentScreen('MAIN')}
          />
        );
      case 'RECIPE_PACK':
        return (
          <RecipePackScreen
            goal={userProfile?.goal || UserGoal.LOSE_WEIGHT}
            onBack={() => setCurrentScreen('MAIN')}
            onRecipeClick={handleRecipeClick}
          />
        );
      case 'MAIN':
        return (
          <MainScreen
            user={user}
            userProfile={userProfile}
            onRecipeClick={handleRecipeClick}
            onLogout={handleLogout}
            savedRecipes={savedRecipes}
            onToggleSave={handleSaveRecipe}
            onUpdateProfile={handleUpdateProfile}
            onShowPaywall={() => setCurrentScreen('PAYWALL')}
            onOpenRecipePack={() => setCurrentScreen('RECIPE_PACK')}
            weeklyPlan={weeklyPlan}
            setWeeklyPlan={setWeeklyPlan}
          />
        );
      default:
        return <OnboardingScreen onComplete={handleOnboardingComplete} onLogin={() => setCurrentScreen('LOGIN')} />;
    }
  };

  return (
    <LanguageProvider>
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" />
        {renderScreen()}
      </View>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
});
