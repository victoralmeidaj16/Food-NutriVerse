
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, SafeAreaView, StatusBar, ActivityIndicator, Image, Alert } from 'react-native';
import { MOCK_RECIPES } from './services/mockData';
import { RecipeCard } from './components/RecipeCard';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon, UserIcon } from './components/Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RecipeDetailScreen } from './screens/RecipeDetailScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { MainScreen } from './screens/MainScreen';
import { UserProfile, UserGoal, ActivityLevel, AppUsageMode, Recipe } from './types';

// --- Types ---
type Screen = 'LOGIN' | 'SIGNUP' | 'ONBOARDING' | 'MAIN' | 'RECIPE_DETAIL';

import { storageService } from './services/storage';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('LOGIN');
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Load data on startup
  useEffect(() => {
    const loadData = async () => {
      const profile = await storageService.loadProfile();
      const savedIds = await storageService.loadSavedRecipes();

      if (profile) {
        setUserProfile(profile);
        setUser({ name: profile.name });
        setSavedRecipes(new Set(savedIds));
        setCurrentScreen('MAIN');
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleLogin = (name: string) => {
    // In a real app, you'd verify credentials. 
    // Here we just check if we have a profile for this "user" or create a mock one if coming from login screen without onboarding

    // If we already loaded a profile in useEffect, we are good.
    // If not, and we are logging in, we might need to fetch or create one.

    setUser({ name });

    if (!userProfile) {
      // If no profile exists (e.g. fresh install, skipped onboarding?), create a default one
      // Ideally, Login should fetch the profile.
      // For this demo, if they login, we assume they might be a returning user but we don't have a backend.
      // So we'll just check if we have one in memory (we don't).
      // Let's just create a default one if it's missing, or redirect to Onboarding?
      // Let's redirect to Onboarding if no profile is found, or create a default one.
      // Given the flow, let's create a default one to allow "Login" to work for demo purposes.

      const newProfile: UserProfile = {
        name: name,
        goal: UserGoal.EAT_HEALTHY,
        activityLevel: ActivityLevel.MEDIUM,
        mealsPerDay: 3,
        mealSlots: ['Café da Manhã', 'Almoço', 'Jantar'],
        dietaryRestrictions: [],
        dislikes: [],
        usageModes: [AppUsageMode.FIT_SWAP],
      };
      setUserProfile(newProfile);
      storageService.saveProfile(newProfile);
    }
    setCurrentScreen('MAIN');
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    storageService.saveProfile(profile);
    setCurrentScreen('SIGNUP');
  };

  const handleRecipeClick = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    const newSaved = new Set(savedRecipes);
    if (newSaved.has(recipe.id)) {
      newSaved.delete(recipe.id);
    } else {
      newSaved.add(recipe.id);
    }
    setSavedRecipes(newSaved);
    storageService.saveSavedRecipes(Array.from(newSaved));
  };

  const handleUpdateProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    storageService.saveProfile(profile);
  };

  const handleLogout = async () => {
    await storageService.clearAll();
    setUser(null);
    setUserProfile(null);
    setSavedRecipes(new Set());
    setCurrentScreen('LOGIN');
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
        return <LoginScreen onNavigateToSignUp={() => setCurrentScreen('SIGNUP')} onLoginSuccess={handleLogin} />;
      case 'SIGNUP':
        return <SignUpScreen onNavigateToLogin={() => setCurrentScreen('LOGIN')} onSignUpSuccess={handleLogin} />;
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
        return <LoginScreen onNavigateToSignUp={() => setCurrentScreen('SIGNUP')} onLoginSuccess={handleLogin} />;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {renderScreen()}
    </View>
  );
}

// --- Screens (Auth) ---

const LoginScreen = ({ onNavigateToSignUp, onLoginSuccess }: { onNavigateToSignUp: () => void, onLoginSuccess: (name: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onLoginSuccess("Usuário Demo");
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <View style={styles.authContent}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>N</Text>
          </View>
          <Text style={styles.authTitle}>Bem-vindo de volta</Text>
          <Text style={styles.authSubtitle}>Para salvar seu plano, entre na sua conta</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MailIcon size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <LockIcon size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? <EyeOffIcon size={20} color="#9CA3AF" /> : <EyeIcon size={20} color="#9CA3AF" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.primaryButtonText}>Entrar</Text>
                <ArrowRightIcon size={20} color="white" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Não tem uma conta?</Text>
          <TouchableOpacity onPress={onNavigateToSignUp}>
            <Text style={styles.linkText}>Criar conta gratuita</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const SignUpScreen = ({ onNavigateToLogin, onSignUpSuccess }: { onNavigateToLogin: () => void, onSignUpSuccess: (name: string) => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = () => {
    if (!name || !email || !password) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSignUpSuccess(name);
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.authContainer}>
      <View style={styles.authContent}>
        <View style={styles.logoContainer}>
          <Text style={styles.authTitle}>Crie sua conta</Text>
          <Text style={styles.authSubtitle}>Salve seu plano NutriVerse</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <UserIcon size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Nome completo"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputContainer}>
            <MailIcon size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <LockIcon size={20} color="#9CA3AF" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Senha (min. 6 caracteres)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              {showPassword ? <EyeOffIcon size={20} color="#9CA3AF" /> : <EyeIcon size={20} color="#9CA3AF" />}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#a6f000' }]}
            onPress={handleSignUp}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="black" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={[styles.primaryButtonText, { color: 'black' }]}>Criar conta</Text>
                <ArrowRightIcon size={20} color="black" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Já tem uma conta?</Text>
          <TouchableOpacity onPress={onNavigateToLogin}>
            <Text style={[styles.linkText, { color: 'black' }]}>Fazer login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  authContainer: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    justifyContent: 'center',
  },
  authContent: {
    padding: 24,
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#a6f000',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: 'rgba(166, 240, 0, 0.2)',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
  },
  authTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  authSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  eyeIcon: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: 'black',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
    marginBottom: 4,
  },
  linkText: {
    color: '#a6f000',
    fontSize: 16,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAFAFA',
  },
});

