import React, { useState, useEffect, useRef, Component } from 'react';
import { AppState, AppStateStatus, StyleSheet, View, StatusBar, Text, TouchableOpacity } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './services/firebaseConfig';
import { getUserProfile } from './services/userService';
import { storageService } from './services/storage';
import { RecipeDetailScreen } from './screens/RecipeDetailScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { PaywallScreen } from './screens/PaywallScreen';
import { RecipePackScreen } from './screens/RecipePackScreen';
import { MainScreen } from './screens/MainScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { UserProfile, UserGoal, SubscriptionPlan, Recipe } from './types';
import { LanguageProvider } from './context/LanguageContext';
import { iapService, PurchaseResult } from './services/iapService';
import { useUserData, DEFAULT_PROFILE } from './hooks/useUserData';
import { useSubscription, applySubscriptionToProfile } from './hooks/useSubscription';

// --- Types ---
type Screen = 'LOGIN' | 'SIGNUP' | 'ONBOARDING' | 'MAIN' | 'RECIPE_DETAIL' | 'PAYWALL' | 'RECIPE_PACK';

// --- ErrorBoundary ---
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    componentDidCatch(error: Error) { console.error('ErrorBoundary caught:', error); }
    render() {
        if (this.state.hasError) {
            return (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
                    <Text style={{ fontSize: 16, color: '#1F2937', textAlign: 'center' }}>
                        Algo deu errado. Feche e abra o app novamente.
                    </Text>
                    <TouchableOpacity
                        onPress={() => this.setState({ hasError: false })}
                        style={{ backgroundColor: '#a6f000', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 }}
                    >
                        <Text style={{ fontWeight: '700', color: '#000' }}>Tentar novamente</Text>
                    </TouchableOpacity>
                </View>
            );
        }
        return this.props.children;
    }
}

export default function App() {
    const [currentScreen, setCurrentScreen] = useState<Screen>('LOGIN');
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);
    const [signupMessage, setSignupMessage] = useState('');
    // Prevents reconciliation from running mid-purchase (race condition guard)
    const isPurchasingRef = useRef(false);

    const {
        userProfile, setUserProfile,
        user, setUser,
        savedRecipes, fullSavedRecipes, userLists, generatedRecipes, weeklyPlan,
        loadUserSpecificData,
        handleSaveRecipe, handleUpdateHistory, handleUpdateLists,
        handleUpdateProfile, handleAddToPlan, setWeeklyPlan,
        handleLogout, clearUserData,
    } = useUserData();

    const {
        pendingProfileRef, signupFlowActiveRef, userProfileRef,
        persistSubscriptionForUser, reconcileAppleSubscription,
    } = useSubscription(setUserProfile, setUser);

    const getAuthenticatedUser = () => auth.currentUser || firebaseUser;

    const unlockProAccess = async (profile: UserProfile) => {
        const authenticatedUser = getAuthenticatedUser();
        pendingProfileRef.current = null;
        userProfileRef.current = profile;
        setPendingProfile(null);
        setSignupMessage('');
        setUserProfile(profile);
        setUser({ name: profile.name });
        await storageService.saveProfile(profile);
        setCurrentScreen('MAIN');
        if (authenticatedUser) {
            void persistSubscriptionForUser(authenticatedUser.uid, profile);
        }
    };

    // Monitor Auth State
    useEffect(() => {
        void iapService.initialize();

        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            try {
                setFirebaseUser(currentUser);

                if (currentUser) {
                    // Test account — grant PRO directly
                    if (currentUser.email === '123indiozinhos@gmail.com') {
                        const profile = await getUserProfile(currentUser.uid);
                        const testProfile = {
                            ...(profile || {}),
                            name: profile?.name || 'Tester',
                            email: currentUser.email,
                            isPro: true,
                            plan: SubscriptionPlan.YEARLY,
                            subscriptionExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
                        } as UserProfile;
                        setUserProfile(testProfile);
                        setUser({ name: testProfile.name });
                        setCurrentScreen('MAIN');
                        return;
                    }

                    const loadedProfile = await loadUserSpecificData(currentUser.uid);
                    const isFreshSignup = signupFlowActiveRef.current || !!pendingProfileRef.current;

                    if (isFreshSignup) {
                        const completedPurchaseProfile =
                            pendingProfileRef.current?.isPro ? pendingProfileRef.current :
                            userProfileRef.current?.isPro ? userProfileRef.current :
                            loadedProfile?.isPro ? loadedProfile : null;

                        if (completedPurchaseProfile) {
                            await unlockProAccess(completedPurchaseProfile);
                            return;
                        }

                        if (loadedProfile) {
                            userProfileRef.current = loadedProfile;
                            setUserProfile(loadedProfile);
                            setUser({ name: loadedProfile.name });
                        }
                        signupFlowActiveRef.current = false;
                        pendingProfileRef.current = null;
                        setPendingProfile(null);
                        setSignupMessage('');
                        setCurrentScreen('PAYWALL');
                        return;
                    }

                    const effectiveProfile = await reconcileAppleSubscription(
                        currentUser.uid, loadedProfile, DEFAULT_PROFILE
                    );
                    setPendingProfile(null);
                    setSignupMessage('');
                    setCurrentScreen(effectiveProfile?.isPro ? 'MAIN' : 'PAYWALL');
                } else {
                    clearUserData();
                    setPendingProfile(null);
                    setSignupMessage('');
                    signupFlowActiveRef.current = false;
                    setCurrentScreen('ONBOARDING');
                }
            } catch (err) {
                console.error('onAuthStateChanged error:', err);
            }
        });

        return unsubscribe;
    }, []);

    // Reconcile on app resume — skipped if a purchase is in progress to avoid race condition
    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
            if (nextState === 'active' && firebaseUser && userProfile && !isPurchasingRef.current) {
                void reconcileAppleSubscription(firebaseUser.uid, userProfile, DEFAULT_PROFILE);
            }
        });
        return () => subscription.remove();
    }, [firebaseUser, userProfile]);

    const handleOnboardingComplete = (profile: UserProfile) => {
        pendingProfileRef.current = profile;
        signupFlowActiveRef.current = true;
        setPendingProfile(profile);
        setSignupMessage('Crie sua conta para salvar seu plano!');
        setCurrentScreen('SIGNUP');
    };

    const renderScreen = () => {
        const uid = firebaseUser?.uid;

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
                                const effectiveProfile = await reconcileAppleSubscription(
                                    auth.currentUser.uid, loadedProfile, DEFAULT_PROFILE
                                );
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
                return (
                    <SignUpScreen
                        onNavigateToLogin={() => setCurrentScreen('LOGIN')}
                        onSignUpSuccess={() => setSignupMessage('Conta criada. Carregando pagamento...')}
                        initialProfile={pendingProfile}
                        welcomeMessage={signupMessage}
                    />
                );

            case 'PAYWALL':
                return (
                    <PaywallScreen
                        onPurchase={async (purchaseResult: PurchaseResult) => {
                            isPurchasingRef.current = true;
                            try {
                                const authenticatedUser = getAuthenticatedUser();
                                const base = userProfile || pendingProfile || DEFAULT_PROFILE;
                                const subscribedProfile = applySubscriptionToProfile(
                                    base,
                                    purchaseResult.productId,
                                    purchaseResult.transactionReceipt,
                                    undefined,
                                    purchaseResult.transactionId,
                                    purchaseResult.originalTransactionId
                                );

                                if (authenticatedUser) {
                                    await unlockProAccess(subscribedProfile);
                                    return;
                                }

                                pendingProfileRef.current = subscribedProfile;
                                setPendingProfile(subscribedProfile);
                                setCurrentScreen('SIGNUP');
                            } finally {
                                isPurchasingRef.current = false;
                            }
                        }}
                        onRestore={async (purchaseResult: PurchaseResult) => {
                            const authenticatedUser = getAuthenticatedUser();
                            if (authenticatedUser && userProfile) {
                                const restoredProfile = applySubscriptionToProfile(
                                    userProfile,
                                    purchaseResult.productId,
                                    purchaseResult.transactionReceipt,
                                    undefined,
                                    purchaseResult.transactionId,
                                    purchaseResult.originalTransactionId
                                );
                                await unlockProAccess(restoredProfile);
                                return;
                            }
                            setCurrentScreen('LOGIN');
                        }}
                        onClose={() => console.log('Paywall closed')}
                        onLogin={() => setCurrentScreen('LOGIN')}
                    />
                );

            case 'RECIPE_PACK':
                return (
                    <RecipePackScreen
                        goal={userProfile?.goal || UserGoal.LOSE_WEIGHT}
                        onBack={() => setCurrentScreen('MAIN')}
                        onRecipeClick={setSelectedRecipe}
                    />
                );

            case 'MAIN':
                return (
                    <MainScreen
                        user={user}
                        userProfile={userProfile}
                        onRecipeClick={setSelectedRecipe}
                        onLogout={handleLogout}
                        savedRecipes={savedRecipes}
                        fullSavedRecipes={fullSavedRecipes}
                        userLists={userLists}
                        onUpdateLists={(lists) => handleUpdateLists(lists, uid)}
                        onToggleSave={(recipe) => handleSaveRecipe(recipe, uid)}
                        onUpdateProfile={(profile) => handleUpdateProfile(profile, uid)}
                        onUpdateHistory={(recipes) => handleUpdateHistory(recipes, uid)}
                        generatedRecipes={generatedRecipes}
                        onShowPaywall={() => setCurrentScreen('PAYWALL')}
                        onOpenRecipePack={() => setCurrentScreen('RECIPE_PACK')}
                        weeklyPlan={weeklyPlan}
                        setWeeklyPlan={(plan) => setWeeklyPlan(plan, uid)}
                    />
                );

            default:
                return <OnboardingScreen onComplete={handleOnboardingComplete} onLogin={() => setCurrentScreen('LOGIN')} />;
        }
    };

    return (
        <ErrorBoundary>
            <LanguageProvider>
                <View style={styles.container}>
                    <StatusBar barStyle="dark-content" />
                    {selectedRecipe ? (
                        <RecipeDetailScreen
                            recipe={selectedRecipe}
                            onClose={() => setSelectedRecipe(null)}
                            onSave={(recipe) => handleSaveRecipe(recipe, firebaseUser?.uid)}
                            isSaved={savedRecipes.has(selectedRecipe.id)}
                            userLists={userLists}
                            onUpdateLists={(lists) => handleUpdateLists(lists, firebaseUser?.uid)}
                            userDislikes={userProfile?.dislikes || []}
                            weeklyPlan={weeklyPlan}
                            onAddToPlan={(recipe, day, slot) => handleAddToPlan(recipe, day, slot, firebaseUser?.uid)}
                        />
                    ) : (
                        renderScreen()
                    )}
                </View>
            </LanguageProvider>
        </ErrorBoundary>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
});
