import React, { useState, useEffect } from 'react';
import { StyleSheet, View, StatusBar, ActivityIndicator } from 'react-native';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from './services/firebaseConfig';
import { getUserProfile, saveUserProfile, updateUserProfile } from './services/userService';
import { MOCK_RECIPES } from './services/mockData';
import { RecipeDetailScreen } from './screens/RecipeDetailScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { MainScreen } from './screens/MainScreen';
import { LoginScreen } from './screens/LoginScreen';
import { SignUpScreen } from './screens/SignUpScreen';
import { UserProfile, Recipe } from './types';

// --- Types ---
type Screen = 'LOGIN' | 'SIGNUP' | 'ONBOARDING' | 'MAIN' | 'RECIPE_DETAIL';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('ONBOARDING');
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [pendingProfile, setPendingProfile] = useState<UserProfile | null>(null);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setFirebaseUser(currentUser);
      if (currentUser) {
        try {
          const profile = await getUserProfile(currentUser.uid);
          if (profile) {
            setUserProfile(profile);
            setUser({ name: profile.name });
            setSavedRecipes(new Set(profile.savedRecipes || []));
            setCurrentScreen('MAIN');
          } else {
            // If logged in but no profile, go to Onboarding (edge case)
            // Or maybe we should just let them create one?
            // For now, if they are logged in, we assume they should be in MAIN or creating a profile.
            // If we have a pending profile, we might want to save it?
            // But usually this happens inside SignUp.
            setCurrentScreen('ONBOARDING');
          }
        } catch (error) {
          console.error("Error loading profile:", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
        setSavedRecipes(new Set());
        // If we just logged out, go to ONBOARDING (or LOGIN? User asked for Onboarding first)
        setCurrentScreen('ONBOARDING');
      }
      setIsLoading(false);
    });

    return unsubscribe;
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

    if (userProfile && firebaseUser) {
      const updatedProfile = { ...userProfile, savedRecipes: Array.from(newSaved) };
      setUserProfile(updatedProfile);
      await updateUserProfile(firebaseUser.uid, { savedRecipes: Array.from(newSaved) });
    }
  };

  const handleUpdateProfile = async (profile: UserProfile) => {
    setUserProfile(profile);
    setUser({ name: profile.name });
    if (firebaseUser) {
      await updateUserProfile(firebaseUser.uid, profile);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // State listener will handle navigation
    } catch (error) {
      console.error("Error signing out: ", error);
    }
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
          />
        );
      default:
        return <OnboardingScreen onComplete={handleOnboardingComplete} onLogin={() => setCurrentScreen('LOGIN')} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderScreen()}
    </View>
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
