import React, { useState, useEffect } from 'react';
import { AppState, AppStateStatus, StyleSheet, View, StatusBar, ActivityIndicator } from 'react-native';
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
import { UserProfile, UserGoal, ActivityLevel, AppUsageMode, SubscriptionPlan, Recipe, WeeklyPlan, UserList } from './types';
import { storageService } from './services/storage';
import { LanguageProvider } from './context/LanguageContext';
import { iapService, PRODUCT_IDS, PurchaseResult } from './services/iapService';
import { validateSubscriptionWithBackend } from './services/subscriptionValidationService';

// --- Types ---
type Screen = 'LOGIN' | 'SIGNUP' | 'ONBOARDING' | 'MAIN' | 'RECIPE_DETAIL' | 'PAYWALL' | 'RECIPE_PACK';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LOGIN');
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [fullSavedRecipes, setFullSavedRecipes] = useState<Recipe[]>([]);
  const [userLists, setUserLists] = useState<UserList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
  const [signupMessage, setSignupMessage] = useState<string>('');

  const getPlanFromProductId = (productId?: string): SubscriptionPlan => {
    if (productId === PRODUCT_IDS.MONTHLY) return SubscriptionPlan.MONTHLY;
    if (productId === PRODUCT_IDS.YEARLY) return SubscriptionPlan.YEARLY;
    return SubscriptionPlan.FREE;
  };

  const getExpiryFromPlan = (plan: SubscriptionPlan, timestamp = Date.now()): string | undefined => {
    const expiryDate = new Date(timestamp);

    if (plan === SubscriptionPlan.MONTHLY) {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
      return expiryDate.toISOString();
    }

    if (plan === SubscriptionPlan.YEARLY) {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      return expiryDate.toISOString();
    }

    return undefined;
  };

  const applySubscriptionToProfile = (
    profile: UserProfile,
    productId?: string,
    transactionReceipt?: string,
    expiryTimestamp?: number,
    transactionId?: string,
    originalTransactionId?: string
  ): UserProfile => {
    const plan = getPlanFromProductId(productId);
    if (plan === SubscriptionPlan.FREE) {
      return profile;
    }

    return {
      ...profile,
      plan,
      isPro: true,
      subscriptionExpiry: expiryTimestamp
        ? new Date(expiryTimestamp).toISOString()
        : getExpiryFromPlan(plan),
      transactionReceipt: transactionReceipt || profile.transactionReceipt,
      subscriptionTransactionId: transactionId || profile.subscriptionTransactionId,
      subscriptionOriginalTransactionId: originalTransactionId || profile.subscriptionOriginalTransactionId
    };
  };

  const removeSubscriptionFromProfile = (profile: UserProfile): UserProfile => ({
    ...profile,
    plan: SubscriptionPlan.FREE,
    isPro: false,
    subscriptionExpiry: undefined,
    transactionReceipt: undefined,
    subscriptionTransactionId: undefined,
    subscriptionOriginalTransactionId: undefined
  });

  const reconcileAppleSubscription = async (uid: string, profile: UserProfile | null): Promise<UserProfile | null> => {
    try {
      await iapService.initialize();
      const localStatus = await iapService.checkSubscriptionStatus();

      const baseProfile = profile || {
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

      const applyAndPersistResolvedSubscription = async (
        productId: string,
        transactionReceipt?: string,
        expiryDate?: number,
        transactionId?: string,
        originalTransactionId?: string
      ): Promise<UserProfile> => {
        const resolvedProfile = applySubscriptionToProfile(
          baseProfile,
          productId,
          transactionReceipt,
          expiryDate,
          transactionId,
          originalTransactionId
        );
        const needsUpdate =
          !profile?.isPro ||
          profile.plan !== resolvedProfile.plan ||
          profile.subscriptionExpiry !== resolvedProfile.subscriptionExpiry ||
          profile.transactionReceipt !== resolvedProfile.transactionReceipt ||
          profile.subscriptionTransactionId !== resolvedProfile.subscriptionTransactionId ||
          profile.subscriptionOriginalTransactionId !== resolvedProfile.subscriptionOriginalTransactionId;

        if (needsUpdate) {
          await updateUserProfile(uid, {
            isPro: resolvedProfile.isPro,
            plan: resolvedProfile.plan,
            subscriptionExpiry: resolvedProfile.subscriptionExpiry,
            transactionReceipt: resolvedProfile.transactionReceipt,
            subscriptionTransactionId: resolvedProfile.subscriptionTransactionId,
            subscriptionOriginalTransactionId: resolvedProfile.subscriptionOriginalTransactionId
          });
          await storageService.saveProfile(resolvedProfile);
          setUserProfile(resolvedProfile);
          setUser({ name: resolvedProfile.name });
        }

        return resolvedProfile;
      };

      const validation = await validateSubscriptionWithBackend({
        transactionId: profile?.subscriptionTransactionId || localStatus.transactionId,
        originalTransactionId: profile?.subscriptionOriginalTransactionId || localStatus.originalTransactionId
      });

      if (!validation.ok) {
        console.warn('Subscription validation skipped:', validation.error);
        if (localStatus.isActive && localStatus.productId) {
          return await applyAndPersistResolvedSubscription(
            localStatus.productId,
            localStatus.transactionReceipt,
            localStatus.expiryDate,
            localStatus.transactionId,
            localStatus.originalTransactionId
          );
        }

        return profile || baseProfile;
      }

      if (!validation.isActive || !validation.productId) {
        if (localStatus.isActive && localStatus.productId) {
          return await applyAndPersistResolvedSubscription(
            localStatus.productId,
            localStatus.transactionReceipt,
            localStatus.expiryDate,
            localStatus.transactionId,
            localStatus.originalTransactionId
          );
        }

        if (!profile?.isPro) {
          return baseProfile;
        }

        const downgradedProfile = removeSubscriptionFromProfile(baseProfile);
        await updateUserProfile(uid, {
          isPro: false,
          plan: SubscriptionPlan.FREE,
          subscriptionExpiry: undefined,
          transactionReceipt: undefined,
          subscriptionTransactionId: undefined,
          subscriptionOriginalTransactionId: undefined
        });
        await storageService.saveProfile(downgradedProfile);
        setUserProfile(downgradedProfile);
        setUser({ name: downgradedProfile.name });
        return downgradedProfile;
      }

      return await applyAndPersistResolvedSubscription(
        validation.productId,
        baseProfile.transactionReceipt,
        validation.expiryDate,
        validation.transactionId,
        validation.originalTransactionId
      );
    } catch (error) {
      console.error('Error reconciling Apple subscription:', error);
      return profile;
    }
  };

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

      const plan = await storageService.loadWeeklyPlan();

      // Sync from Firestore if available
      if (profile) {
        if (profile.recipeHistory) {
          setGeneratedRecipes(profile.recipeHistory);
          await storageService.saveHistory(profile.recipeHistory);
        } else {
          const history = await storageService.loadHistory();
          setGeneratedRecipes(history);
        }

        if (profile.savedRecipes) {
          setSavedRecipes(new Set(profile.savedRecipes));
          await storageService.saveSavedRecipes(profile.savedRecipes);
        } else {
          const saved = await storageService.loadSavedRecipes();
          setSavedRecipes(new Set(saved));
        }

        if (profile.userLists) {
          setUserLists(profile.userLists);
          await storageService.saveUserLists(profile.userLists);
        } else {
          const lists = await storageService.loadUserLists();
          setUserLists(lists);
        }

        if (profile.weeklyPlan) {
          setWeeklyPlan(profile.weeklyPlan);
          await storageService.saveWeeklyPlan(profile.weeklyPlan);
        } else if (plan) {
          setWeeklyPlan(plan);
        }
      } else {
        // Fallback to local storage if no profile in Firestore
        const history = await storageService.loadHistory();
        setGeneratedRecipes(history);
        const saved = await storageService.loadSavedRecipes();
        setSavedRecipes(new Set(saved));
        const lists = await storageService.loadUserLists();
        setUserLists(lists);
        if (plan) setWeeklyPlan(plan);
        else setWeeklyPlan(null);
      }

      const fullSaved = await storageService.loadFullSavedRecipes();
      setFullSavedRecipes(fullSaved);

      return finalProfile;

    } catch (error) {
      console.error("Error loading user specific data:", error);
      return null;
    }
  };

  // Monitor Auth State
  useEffect(() => {
    void iapService.initialize();

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
        const effectiveProfile = await reconcileAppleSubscription(currentUser.uid, loadedProfile);

        if (effectiveProfile?.isPro) {
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
        setFullSavedRecipes([]);
        setUserLists([]);
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

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && firebaseUser) {
        void reconcileAppleSubscription(firebaseUser.uid, userProfile);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [firebaseUser, userProfile]);

  // ... (keep initIAP) ...

  // ... (keep wakeUpServer) ...


  const handleOnboardingComplete = (profile: UserProfile) => {
    setPendingProfile(profile);
    setSignupMessage('');
    // User finished onboarding. Show Paywall BEFORE Sign Up.
    setCurrentScreen('PAYWALL');
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    const newSavedIds = new Set(savedRecipes);
    let newFullRecipes = [...fullSavedRecipes];

    if (newSavedIds.has(recipe.id)) {
      newSavedIds.delete(recipe.id);
      newFullRecipes = newFullRecipes.filter(r => r.id !== recipe.id);
    } else {
      newSavedIds.add(recipe.id);
      // Only add if not already there
      if (!newFullRecipes.find(r => r.id === recipe.id)) {
        newFullRecipes.push(recipe);
      }
    }

    setSavedRecipes(newSavedIds);
    setFullSavedRecipes(newFullRecipes);

    await storageService.saveSavedRecipes(Array.from(newSavedIds));
    await storageService.saveFullSavedRecipes(newFullRecipes);

    if (userProfile && firebaseUser) {
      await updateUserProfile(firebaseUser.uid, { savedRecipes: Array.from(newSavedIds) });
    }
  };

  const handleUpdateHistory = async (recipes: Recipe[]) => {
    setGeneratedRecipes(recipes);
    await storageService.saveHistory(recipes);
    if (firebaseUser) {
      await updateUserProfile(firebaseUser.uid, { recipeHistory: recipes });
    }
  };

  const handleUpdateLists = async (lists: UserList[]) => {
    setUserLists(lists);
    await storageService.saveUserLists(lists);
    if (firebaseUser) {
      await updateUserProfile(firebaseUser.uid, { userLists: lists });
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
    if (firebaseUser) {
      await updateUserProfile(firebaseUser.uid, { weeklyPlan: newPlan });
    }
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'ONBOARDING':
        return <OnboardingScreen onComplete={handleOnboardingComplete} onLogin={() => setCurrentScreen('LOGIN')} />;
      case 'LOGIN':
        return (
          <LoginScreen
            onNavigateToSignUp={() => setCurrentScreen('ONBOARDING')}
            onLogin={async () => {
              if (auth.currentUser) {
                const loadedProfile = await loadUserSpecificData(auth.currentUser.uid);
                const effectiveProfile = await reconcileAppleSubscription(auth.currentUser.uid, loadedProfile);
                if (effectiveProfile?.isPro || auth.currentUser.email === '123indiozinhos@gmail.com') {
                  setCurrentScreen('MAIN');
                } else {
                  setCurrentScreen('PAYWALL');
                }
              }
            }}
          />
        );
      case 'SIGNUP':
        return <SignUpScreen onNavigateToLogin={() => setCurrentScreen('LOGIN')} initialProfile={pendingProfile} welcomeMessage={signupMessage} />;
      case 'PAYWALL':
        return (
          <PaywallScreen
            onPurchase={async (purchaseResult: PurchaseResult) => {
              const subscribedProfile = applySubscriptionToProfile(
                pendingProfile || userProfile || {
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
                },
                purchaseResult.productId,
                purchaseResult.transactionReceipt,
                undefined,
                purchaseResult.transactionId,
                purchaseResult.originalTransactionId
              );

              setPendingProfile(subscribedProfile);

              if (firebaseUser) {
                setUserProfile(subscribedProfile);
                await updateUserProfile(firebaseUser.uid, {
                  isPro: subscribedProfile.isPro,
                  plan: subscribedProfile.plan,
                  subscriptionExpiry: subscribedProfile.subscriptionExpiry,
                  transactionReceipt: subscribedProfile.transactionReceipt,
                  subscriptionTransactionId: subscribedProfile.subscriptionTransactionId,
                  subscriptionOriginalTransactionId: subscribedProfile.subscriptionOriginalTransactionId
                });
                await storageService.saveProfile(subscribedProfile);
                const verifiedProfile = await reconcileAppleSubscription(firebaseUser.uid, subscribedProfile);
                setCurrentScreen(verifiedProfile?.isPro ? 'MAIN' : 'PAYWALL');
                return;
              }

              setSignupMessage('Plano ativado! Finalize seu cadastro:');
              setCurrentScreen('SIGNUP');
            }}
            onRestore={async (purchaseResult: PurchaseResult) => {
              if (firebaseUser && userProfile) {
                const restoredProfile = applySubscriptionToProfile(
                  userProfile,
                  purchaseResult.productId,
                  purchaseResult.transactionReceipt,
                  undefined,
                  purchaseResult.transactionId,
                  purchaseResult.originalTransactionId
                );
                setUserProfile(restoredProfile);
                await updateUserProfile(firebaseUser.uid, {
                  isPro: restoredProfile.isPro,
                  plan: restoredProfile.plan,
                  subscriptionExpiry: restoredProfile.subscriptionExpiry,
                  transactionReceipt: restoredProfile.transactionReceipt,
                  subscriptionTransactionId: restoredProfile.subscriptionTransactionId,
                  subscriptionOriginalTransactionId: restoredProfile.subscriptionOriginalTransactionId
                });
                await storageService.saveProfile(restoredProfile);
                const verifiedProfile = await reconcileAppleSubscription(firebaseUser.uid, restoredProfile);
                setCurrentScreen(verifiedProfile?.isPro ? 'MAIN' : 'PAYWALL');
                return;
              }

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
            fullSavedRecipes={fullSavedRecipes}
            userLists={userLists}
            onUpdateLists={handleUpdateLists}
            onToggleSave={handleSaveRecipe}
            onUpdateProfile={handleUpdateProfile}
            onUpdateHistory={handleUpdateHistory}
            generatedRecipes={generatedRecipes}
            onShowPaywall={() => setCurrentScreen('PAYWALL')}
            onOpenRecipePack={() => setCurrentScreen('RECIPE_PACK')}
            weeklyPlan={weeklyPlan}
            setWeeklyPlan={async (plan) => {
              setWeeklyPlan(plan);
              await storageService.saveWeeklyPlan(plan);
              if (firebaseUser) {
                await updateUserProfile(firebaseUser.uid, { weeklyPlan: plan || undefined });
              }
            }}
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
            userLists={userLists}
            onUpdateLists={handleUpdateLists}
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
