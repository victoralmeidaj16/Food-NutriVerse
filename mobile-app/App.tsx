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
  const [signupMessage, setSignupMessage] = useState<string>('');

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

  const loadUserSpecificData = async (uid: string): Promise<UserProfile | null> => {
    try {
      let finalProfile: UserProfile | null = null;
      // Load profile from Firestore first, then local storage
      const profile = await getUserProfile(uid);
      if (profile) {
        setUserProfile(profile);
        setUser({ name: profile.name });
        await storageService.saveProfile(profile);
        finalProfile = profile;
      } else {
        // If no profile in Firestore, check local storage
        const localProfile = await storageService.loadProfile();
        if (localProfile) {
          setUserProfile(localProfile);
          setUser({ name: localProfile.name });
          // Optionally, save this local profile to Firestore if it's missing there
          await saveUserProfile(uid, localProfile);
          finalProfile = localProfile;
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
              savedRecipesCount: 0,
              weeklyPlansGeneratedThisWeek: 0,
              lastPlanGenerationDate: new Date().toISOString()
            }
          };
          await saveUserProfile(uid, defaultProfile);
          await storageService.saveProfile(defaultProfile);
          setUserProfile(defaultProfile);
          setUser({ name: defaultProfile.name });
          finalProfile = defaultProfile;
        }
      }

      const saved = await storageService.loadSavedRecipes();
      setSavedRecipes(new Set(saved));

      const plan = await storageService.loadWeeklyPlan();
      if (plan) setWeeklyPlan(plan);
      else setWeeklyPlan(null);

      return finalProfile;

    } catch (error) {
      console.error("Error loading user specific data:", error);
      return null;
    }
  };

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        // Test Account Logic
        if (currentUser.email === '123indiozinhos@gmail.com') {
          console.log("🌟 Test Account Detected: Granting PRO Access");
          const profile = await getUserProfile(currentUser.uid);
          const testProfile = {
            ...(profile || {}),
            name: profile?.name || 'Tester',
            email: currentUser.email,
            isPro: true,
            plan: SubscriptionPlan.YEARLY,
            subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          } as UserProfile;

          // Ensure we update it in potential local state too if needed, 
          // but mainly just set it here for the session
          setUserProfile(testProfile);
          setUser({ name: testProfile.name });
          setCurrentScreen('MAIN');
          setIsLoading(false);
          return;
        }

        const loadedProfile = await loadUserSpecificData(currentUser.uid);
        if (loadedProfile?.isPro) {
          setCurrentScreen('MAIN');
        } else {
          // Check if we are already in the main flow or just logged in
          // If just logged in and not pro, what do we do?
          // The request says "Paywall before login". 
          // If they login and are NOT pro, they should probably see the paywall again 
          // OR if they just came from the paywall (which is now before login), 
          // maybe they shouldn't be here if they didn't pay?
          // BUT invalidating the "Paywall before Login" logic: 
          // If I pay, THEN I sign up.
          // If I login (existing user), I might be Free or Pro.
          // If Free, I should see Paywall? Yes, standard behavior.
          setCurrentScreen('PAYWALL');
        }

      } else {
        setUser(null);
        setUserProfile(null);
        setSavedRecipes(new Set());
        setWeeklyPlan(null); // Clear weekly plan on logout
        // Initial screen is now ONBOARDING
        // currentScreen will be managed by components mostly, 
        // but on logout we go to Onboarding
        setCurrentScreen('ONBOARDING');
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // ... (keep initIAP) ...

  // ... (keep wakeUpServer) ...


  const handleOnboardingComplete = (profile: UserProfile) => {
    setPendingProfile(profile);
    // User finished onboarding. Show Paywall BEFORE Sign Up.
    setCurrentScreen('PAYWALL');
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

  const renderScreen = () => {
    switch (currentScreen) {
      case 'ONBOARDING':
        return <OnboardingScreen onComplete={handleOnboardingComplete} onLogin={() => setCurrentScreen('LOGIN')} />;
      case 'LOGIN':
        return <LoginScreen onNavigateToSignUp={() => setCurrentScreen('ONBOARDING')} />; // Or back to Paywall? Standard flow usually Login -> Main or Paywall
      case 'SIGNUP':
        return <SignUpScreen onNavigateToLogin={() => setCurrentScreen('LOGIN')} initialProfile={pendingProfile} welcomeMessage={signupMessage} />;
      case 'PAYWALL':
        return (
          <PaywallScreen
            onPurchase={() => {
              // User bought the plan. Now let them create an account.
              setSignupMessage('Plano ativado! Finalize seu cadastro:');
              setCurrentScreen('SIGNUP');
            }}
            onRestore={() => {
              // If restore is successful, we probably want them to login too? 
              // Or if they restored, they might not have an account yet if it's device based?
              // Usually restore implies an existing account.
              // Let's send them to Login to link/restore account data.
              setCurrentScreen('LOGIN');
            }}
            onClose={() => {
              // Explicitly removed close button, but if added back:
              // For "Trial" maybe go to Signup?
              // For now, no-op or maybe Login?
              console.log('Paywall closed');
            }}
            onLogin={() => {
              setCurrentScreen('LOGIN');
            }}
          />
        );
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
        {selectedRecipe ? (
          <RecipeDetailScreen
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            onSave={handleSaveRecipe}
            isSaved={savedRecipes.has(selectedRecipe.id)}
            userDislikes={userProfile?.dislikes || []}
            weeklyPlan={weeklyPlan}
            onAddToPlan={handleAddToPlan}
          />
        ) : (
          renderScreen()
        )}
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
