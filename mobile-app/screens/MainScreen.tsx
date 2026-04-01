import React, { useState, useRef, useEffect } from 'react';
// ... imports

// ... MainScreen component ...


import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, Dimensions, ActivityIndicator, Alert, SafeAreaView, Modal, LayoutAnimation, Platform, UIManager, Animated, Linking, KeyboardAvoidingView, Keyboard } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { deleteUser } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile, Recipe, Tab, WeeklyPlan, ShoppingList, UserGoal, RECIPE_CATEGORIES, UserList } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import {
    HomeIcon, SearchIcon, CalendarIcon, UserIcon, CameraIcon, ActivityIcon,
    ChefHatIcon, SparklesIcon, ArrowRightIcon, PlusIcon, CheckIcon,
    CloseIcon, BookHeartIcon, ShoppingBagIcon, TrashIcon, TimerIcon, FlameIcon, CopyIcon, RefreshIcon, SettingsIcon,
    FileTextIcon, HelpCircleIcon, LockIcon
} from '../components/Icons';
import { MOCK_RECIPES } from '../services/mockData';
import { generateFitnessRecipe, identifyIngredientsFromImage, generateWeeklyPlan, generateShoppingList, SupportedLanguage, generateQuickDecision, analyzeRoutine, analyzeMealImage } from '../services/geminiService';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { LoadingModal } from '../components/LoadingModal';
import { PlanningWizard } from '../components/PlanningWizard';
import { RoutineMeal, QuickDecision, MapaAlimentarResult, RoutineDiagnostic } from '../types';
// DailyTipCard removed
import { EditProfileModal } from '../components/EditProfileModal';
import { SubscriptionService } from '../services/subscriptionService';
import { CopyMealModal } from '../components/CopyMealModal';
import { WeeklyPlanIntro } from '../components/WeeklyPlanIntro';
import { PantryImagePreview } from '../components/PantryImagePreview';

const { width } = Dimensions.get('window');

import { storageService } from '../services/storage';
import { deleteUserData } from '../services/userService';
import { auth } from '../services/firebaseConfig';
import { useLanguage } from '../context/LanguageContext';
import { SourcesScreen } from '../components/SourcesScreen';
import { getRecipeCategories } from '../types'; // Import getRecipeCategories

export const MainScreen = ({
    user,
    userProfile,
    onRecipeClick,
    onLogout,
    generatedRecipes,
    onUpdateHistory,
    savedRecipes,
    fullSavedRecipes,
    userLists,
    onUpdateLists,
    onToggleSave,
    onUpdateProfile,
    onShowPaywall,
    onOpenRecipePack,
    weeklyPlan,
    setWeeklyPlan
}: {
    user: { name: string } | null,
    userProfile: UserProfile | null,
    onRecipeClick: (r: Recipe) => void,
    onLogout: () => void,
    generatedRecipes: Recipe[],
    onUpdateHistory: (recipes: Recipe[]) => void,
    savedRecipes: Set<string>,
    fullSavedRecipes: Recipe[],
    userLists?: UserList[],
    onUpdateLists?: (lists: UserList[]) => void,
    onToggleSave: (r: Recipe) => void,
    onUpdateProfile: (p: UserProfile) => void,
    onShowPaywall: () => void,
    onOpenRecipePack: () => void,
    weeklyPlan: WeeklyPlan | null,
    setWeeklyPlan: (plan: WeeklyPlan | null) => void | Promise<void>
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('HOME');
    const fabScale = useRef(new Animated.Value(1)).current;
    const fabRotate = useRef(new Animated.Value(0)).current;
    const fabRipple = useRef(new Animated.Value(0)).current;
    const [exploreMode, setExploreMode] = useState<'TEXT' | 'PANTRY'>('TEXT');
    const [dishInput, setDishInput] = useState('');
    const [desireImages, setDesireImages] = useState<string[]>([]); // Up to 2 URIs for Desejo mode
    const [pantryIngredients, setPantryIngredients] = useState<string[]>([]);
    const [manualIngredient, setManualIngredient] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Planning State
    // weeklyPlan is now a prop
    const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
    const [activePlanningDay, setActivePlanningDay] = useState(0);
    const [showPlanningWizard, setShowPlanningWizard] = useState(false);
    const [showShoppingList, setShowShoppingList] = useState(false);
    // DailyTip state removed
    const [showEditProfile, setShowEditProfile] = useState(false);

    const [copyMealModalVisible, setCopyMealModalVisible] = useState(false);
    const [selectedMealToCopy, setSelectedMealToCopy] = useState<{ dayIndex: number, mealIndex: number, recipe: Recipe } | null>(null);
    const [regeneratingMeal, setRegeneratingMeal] = useState<{ dayIndex: number, mealIndex: number } | null>(null);

    // Pantry Image Preview
    const [showPantryPreview, setShowPantryPreview] = useState(false);
    const [pantryImages, setPantryImages] = useState<string[]>([]);
    const [showSourcesScreen, setShowSourcesScreen] = useState(false);

    // Mapa Alimentar & Decision Killer State
    const [quickDecision, setQuickDecision] = useState<QuickDecision | null>(null);
    const [mapaMeals, setMapaMeals] = useState<RoutineMeal[]>([]);
    const [mapaAnalysis, setMapaAnalysis] = useState<MapaAlimentarResult | null>(null);
    const [isAnalyzingMapa, setIsAnalyzingMapa] = useState(false);
    const [dailyLoop, setDailyLoop] = useState({ morning: false, lunch: false, evening: false });

    // Toast
    const [toastMessage, setToastMessage] = useState('');
    const toastAnim = useRef(new Animated.Value(0)).current;
    const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showToast = (message: string) => {
        if (toastTimeout.current) clearTimeout(toastTimeout.current);
        setToastMessage(message);
        toastAnim.setValue(0);
        Animated.sequence([
            Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            Animated.delay(1800),
            Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
        toastTimeout.current = setTimeout(() => setToastMessage(''), 2200);
    };

    // --- Animation Refs ---
    const bgScale = useRef(new Animated.Value(1)).current;
    const bgOpacity = useRef(new Animated.Value(1)).current;
    const tabAnim = useRef(new Animated.Value(1)).current;

    // Helper for micro-animations
    const createButtonScale = () => new Animated.Value(1);
    const animateButtonPress = (val: Animated.Value) => {
        Animated.spring(val, {
            toValue: 0.95,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4
        }).start();
    };
    const animateButtonRelease = (val: Animated.Value) => {
        Animated.spring(val, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4
        }).start();
    };

    const searchBtnScale = useRef(new Animated.Value(1)).current;
    const generateBtnScale = useRef(new Animated.Value(1)).current;
    const decisionBtnScale = useRef(new Animated.Value(1)).current;
    const ctaScale = useRef(new Animated.Value(1)).current;
    const sendBtnScale = useRef(new Animated.Value(1)).current;

    // Background Animation Effect
    useEffect(() => {
        const isModalActive = showPlanningWizard || showEditProfile || showShoppingList || showPantryPreview || copyMealModalVisible || !!mapaAnalysis;

        Animated.parallel([
            Animated.spring(bgScale, {
                toValue: isModalActive ? 0.94 : 1,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }),
            Animated.timing(bgOpacity, {
                toValue: isModalActive ? 0.7 : 1,
                duration: 300,
                useNativeDriver: true,
            })
        ]).start();
    }, [showPlanningWizard, showEditProfile, showShoppingList, showPantryPreview, copyMealModalVisible, mapaAnalysis]);


    // Enable LayoutAnimation for Android
    useEffect(() => {
        if (Platform.OS === 'android') {
            if (UIManager.setLayoutAnimationEnabledExperimental) {
                UIManager.setLayoutAnimationEnabledExperimental(true);
            }
        }
    }, []);
    const [showAllRecipes, setShowAllRecipes] = useState(false);
    const { t, language, setLanguage } = useLanguage();
    const exploreScrollRef = useRef<ScrollView>(null);
    const exploreFieldPositions = useRef<Record<'dishInput' | 'manualIngredient', number>>({
        dishInput: 0,
        manualIngredient: 0,
    });
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // Enable LayoutAnimation on Android
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    // Load Planning Data & History (Plan is loaded in App.tsx)
    useEffect(() => {
        const loadData = async () => {
            const list = await storageService.loadShoppingList();
            if (list) setShoppingList(list);
        };
        loadData();
    }, []);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => setIsKeyboardVisible(true));
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setIsKeyboardVisible(false));

        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);

    // --- Handlers ---

    const changeTab = (tab: Tab) => {
        if (activeTab === tab) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        // Reset and trigger spring animation for content
        tabAnim.setValue(0.95);
        setActiveTab(tab);

        Animated.spring(tabAnim, {
            toValue: 1,
            tension: 60,
            friction: 7,
            useNativeDriver: true,
        }).start();
    };

    const changeExploreMode = (mode: 'TEXT' | 'PANTRY') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExploreMode(mode);
    };

    const scrollExploreFieldIntoView = (field: 'dishInput' | 'manualIngredient') => {
        requestAnimationFrame(() => {
            const targetY = Math.max(exploreFieldPositions.current[field] - 140, 0);
            exploreScrollRef.current?.scrollTo({ y: targetY, animated: true });
        });
    };

    const playSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../assets/sounds/pop.mp3')
            ).catch(() => ({ sound: null }));

            if (!sound) return;

            await sound.playAsync();
        } catch (error) {
            console.log('Error playing sound', error);
        }
    };

    const handleExplorePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        playSound();

        // Reset rotation and ripple
        fabRotate.setValue(0);
        fabRipple.setValue(0);

        Animated.parallel([
            // Scale "Jump"
            Animated.sequence([
                Animated.timing(fabScale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
                Animated.timing(fabScale, { toValue: 1, duration: 150, useNativeDriver: true })
            ]),
            // Rotate 360
            Animated.timing(fabRotate, { toValue: 1, duration: 600, useNativeDriver: true }),
            // Ripple Effect
            Animated.timing(fabRipple, { toValue: 1, duration: 600, useNativeDriver: true })
        ]).start();

        changeTab('EXPLORE');
    };

    const spin = fabRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const rippleScale = fabRipple.interpolate({
        inputRange: [0, 1],
        outputRange: [0.5, 2]
    });

    const rippleOpacity = fabRipple.interpolate({
        inputRange: [0, 1],
        outputRange: [0.6, 0]
    });

    const pickImage = async () => {
        if (!userProfile) return;

        // Check Subscription Limit
        if (!SubscriptionService.canScanPantry(userProfile)) {
            onShowPaywall();
            return;
        }

        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert(t('permissions.required'), t('permissions.galleryAccess'));
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: false,
            quality: 0.3,
        });

        if (!result.canceled && result.assets[0].uri) {
            setPantryImages(prev => [...prev, result.assets[0].uri]);
            setShowPantryPreview(true);

            // Increment usage removed
            // const updatedProfile = SubscriptionService.incrementPantryScan(userProfile);
            // onUpdateProfile(updatedProfile);
        }
    };

    const pickDesireImage = async (source: 'camera' | 'gallery') => {
        if (desireImages.length >= 2) {
            Alert.alert(language === 'en' ? 'Limit reached' : 'Limite atingido', language === 'en' ? 'You can attach up to 2 images.' : 'Você pode anexar até 2 imagens.');
            return;
        }

        let result;
        if (source === 'camera') {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
                Alert.alert(t('permissions.required'), t('permissions.cameraAccess'));
                return;
            }
            result = await ImagePicker.launchCameraAsync({ allowsEditing: true, aspect: [4, 3], quality: 0.5 });
        } else {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!perm.granted) {
                Alert.alert(t('permissions.required'), t('permissions.galleryAccess'));
                return;
            }
            result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [4, 3], quality: 0.5 });
        }

        if (!result.canceled && result.assets[0].uri) {
            setDesireImages(prev => [...prev, result!.assets[0].uri]);
        }
    };

    const removeDesireImage = (index: number) => {
        setDesireImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleTakePhoto = async () => {
        if (!userProfile) return;

        // Check Subscription Limit (same as pickImage)
        if (!SubscriptionService.canScanPantry(userProfile)) {
            onShowPaywall();
            return;
        }

        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert(t('permissions.required'), t('permissions.cameraAccess'));
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.3,
        });

        if (!result.canceled && result.assets[0].uri) {
            setPantryImages(prev => [...prev, result.assets[0].uri]);
            setShowPantryPreview(true);
        }
    };

    const handleRemovePantryImage = (index: number) => {
        setPantryImages(prev => prev.filter((_, i) => i !== index));
    };

    const analyzeImage = async (base64: string) => {
        setLoading(true);
        setLoadingMsg("Analisando despensa...");
        setLoadingStatus("Enviando imagem...");
        setLoadingProgress(0);

        try {
            const detected = await identifyIngredientsFromImage(base64, (status, progress) => {
                setLoadingStatus(status);
                setLoadingProgress(progress);
            }, language as SupportedLanguage);
            setPantryIngredients(prev => [...new Set([...prev, ...detected])]);
        } catch (error) {
            Alert.alert(t('common.error'), t('errors.imageAnalysisFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzePantryImages = async (manualIngredients: string[]) => {
        console.log('🔍 handleAnalyzePantryImages started', { imagesCount: pantryImages.length, manualIngredients });
        setShowPantryPreview(false);

        setLoading(true);
        setLoadingMsg(t('loading.analyzingPantry'));
        setLoadingStatus(t('explore.processingImages'));
        setLoadingProgress(0);

        const allIngredients: string[] = [...manualIngredients];

        try {
            // Convert URIs to base64 and analyze
            for (const uri of pantryImages) {
                console.log('📷 Processing image:', uri.substring(0, 50) + '...');
                const response = await fetch(uri);
                const blob = await response.blob();
                console.log('📦 Blob size:', blob.size, 'bytes');
                const reader = new FileReader();

                const base64 = await new Promise<string>((resolve) => {
                    reader.onloadend = () => {
                        const base64data = reader.result as string;
                        resolve(base64data.split(',')[1]);
                    };
                    reader.readAsDataURL(blob);
                });

                console.log('📤 Base64 length:', base64.length, 'characters');

                const detected = await identifyIngredientsFromImage(base64, (status, progress) => {
                    setLoadingStatus(status);
                    setLoadingProgress(progress * 0.7); // 70% for analysis
                }, language as SupportedLanguage);

                console.log('✅ Detected ingredients:', detected);
                allIngredients.push(...detected);
            }

            // Remove duplicates
            const uniqueIngredients = [...new Set(allIngredients)];
            console.log('🥗 Final ingredients list:', uniqueIngredients);
            setPantryIngredients(uniqueIngredients);

            // Clear images after analysis
            setPantryImages([]);

            // Check if we found any ingredients
            if (uniqueIngredients.length === 0) {
                Alert.alert(
                    t('messages.noIngredientsFound'),
                    t('messages.noIngredientsFoundDesc'),
                    [{ text: t('common.ok') }]
                );
                return;
            }

            // Auto-generate recipe with these ingredients
            setLoadingStatus(t('explore.creatingRecipe'));
            setLoadingProgress(0.8);

            const recipe = await generateFitnessRecipe(
                uniqueIngredients,
                userProfile?.goal || ('WEIGHT_LOSS' as UserGoal),
                userProfile?.dietaryRestrictions || [],
                userProfile?.dislikes || [],
                userProfile?.tasteProfile,
                (status, progress) => {
                    setLoadingStatus(status);
                    setLoadingProgress(0.8 + (progress * 0.2)); // 80-100%
                },
                language as SupportedLanguage
            );

            if (recipe) {
                console.log('🍽️ Recipe generated:', recipe.name);
                onUpdateHistory([recipe, ...generatedRecipes].slice(0, 100));
                setActiveTab('EXPLORE');
                // Auto-open the recipe details
                setLoading(false);
                setTimeout(() => onRecipeClick(recipe), 300);
                return; // Don't hit the finally block setLoading(false) again
            } else {
                Alert.alert(t('common.error'), t('errors.recipeGenerationFailed'));
            }
        } catch (error: any) {
            console.error('❌ Pantry analysis error:', error);
            Alert.alert(t('common.error'), `${t('errors.couldNotProcess')}: ${error.message || t('errors.unknownError')}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddMorePantryImages = () => {
        setShowPantryPreview(false);
        // Trigger image picker again
        setTimeout(() => pickImage(), 100);
    };

    const handleAddManuallyFromPreview = () => {
        setShowPantryPreview(false);
        // Focus on manual input (scroll to it if needed)
    };

    const addManualIngredient = () => {
        if (manualIngredient.trim()) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
            setPantryIngredients([...pantryIngredients, manualIngredient.trim()]);
            setManualIngredient('');
        }
    };

    const removeIngredient = (index: number) => {
        setPantryIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const handleSaveRecipe = async (recipe: Recipe) => {
        if (!userProfile) return;

        // Check Subscription Limit
        if (!SubscriptionService.canSaveRecipe(userProfile)) {
            onShowPaywall();
            return;
        }

        // Proceed with saving
        onToggleSave(recipe);

        // Increment usage removed
        // const updatedProfile = SubscriptionService.incrementSavedRecipes(userProfile);
        // onUpdateProfile(updatedProfile);

        showToast(t('messages.recipeSaved'));
    };
    const handleGenerateRecipe = async (overrideInput?: string | any) => {
        // overrideInput may be an event object if called directly from onPress without an arrow function, so we check if it's a string
        const explicitInput = typeof overrideInput === 'string' ? overrideInput : undefined;
        console.log('🔥 handleGenerateRecipe called!', { userProfile: !!userProfile, exploreMode, dishInput, explicitInput });

        // Create a default profile if missing (for Expo Go development)
        const profile: UserProfile = userProfile || {
            name: 'Dev User',
            goal: 'WEIGHT_LOSS' as UserGoal,
            dietaryRestrictions: [],
            dislikes: [],
            isPro: false,
            activityLevel: 'MODERATE' as any,
            mealsPerDay: 3,
            mealSlots: [],
            usageModes: ['RECIPES'] as any,
            usageStats: {
                recipesGenerated: 0,
                weeklyPlansCreated: 0,
                pantryScans: 0,
                lastGenerationDate: new Date().toISOString(),
                recipesGeneratedToday: 0,
                lastDesireDate: new Date().toISOString(),
                desiresTransformedToday: 0,
                savedRecipesCount: 0,
                lastScanDate: new Date().toISOString(),
                pantryScansThisWeek: 0
            } as any,
            plan: 'FREE' as any
        };

        // Check Subscription Limit
        console.log('✅ Profile created:', profile);
        if (!SubscriptionService.canGenerateRecipe(profile)) {
            console.log('❌ Subscription limit reached');
            onShowPaywall();
            return;
        }
        console.log('✅ Subscription check passed');

        // The original logic for input validation and setting loading message
        const input = explicitInput || (exploreMode === 'TEXT' ? dishInput : pantryIngredients);
        console.log('📝 Input:', input);

        if (exploreMode === 'TEXT' && !explicitInput && !dishInput.trim() && desireImages.length === 0) {
            Alert.alert(t('common.oops'), language === 'en' ? 'Type a dish name or attach an image.' : 'Digite o nome do prato ou anexe uma imagem.');
            return;
        }
        if (exploreMode === 'PANTRY' && !explicitInput && pantryIngredients.length === 0) {
            Alert.alert(t('common.oops'), t('messages.addIngredientsFirst'));
            return;
        }

        console.log('✅ Validation passed, starting generation...');
        setLoadingMsg(exploreMode === 'TEXT' || explicitInput ? t('loading.generatingRecipe') : t('explore.creatingRecipe'));
        setLoadingStatus(t('loading.connectingAI'));
        setLoadingProgress(0);
        setLoading(true);

        try {
            console.log('🚀 Calling generateFitnessRecipe...');

            // Convert local URIs to base64 for image-aware requests
            let base64Images: string[] = [];
            if (exploreMode === 'TEXT' && desireImages.length > 0) {
                for (const uri of desireImages) {
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    const base64 = await new Promise<string>((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
                        reader.readAsDataURL(blob);
                    });
                    base64Images.push(base64);
                }
            }

            const result = await generateFitnessRecipe(
                input,
                profile.goal,
                profile.dietaryRestrictions,
                profile.dislikes || [],
                profile.tasteProfile,
                (status, progress) => {
                    setLoadingStatus(status);
                    setLoadingProgress(progress);
                },
                language as SupportedLanguage,
                base64Images.length > 0 ? base64Images : undefined
            );
            if (result) {
                const newList = [result, ...generatedRecipes].slice(0, 100); // Keep last 100 recipes in history
                onUpdateHistory(newList);

                // Automatically save to user's library
                onToggleSave(result);

                onRecipeClick(result); // Open immediately
                setDishInput('');
                setDesireImages([]);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert(t('common.error'), t('errors.recipeGenerationFailed'));
            }
        } catch (e: any) {
            console.error('❌ Recipe generation error:', e);
            Alert.alert(t('common.error'), e?.message || t('errors.aiConnectionFailed'));
        } finally {
            setLoading(false);
        }
    };

    // --- Planning Handlers ---

    const handleGeneratePlan = async (preference: string, mealsCount: number, allowRepeats: boolean) => {
        if (!userProfile) return;

        // Check Subscription Limit
        if (!SubscriptionService.canGenerateWeeklyPlan(userProfile)) {
            onShowPaywall();
            return;
        }

        setShowPlanningWizard(false);
        setLoading(true);
        setLoadingMsg(t('loading.generatingPlan'));

        try {
            const plan = await generateWeeklyPlan(userProfile, preference, mealsCount, allowRepeats, language as SupportedLanguage);
            if (plan) {
                setWeeklyPlan(plan);

                // Increment usage removed
                // const updatedProfile = SubscriptionService.incrementWeeklyPlanCount(userProfile);
                // onUpdateProfile(updatedProfile);
                setActivePlanningDay(0);
            } else {
                Alert.alert(t('common.error'), t('errors.planGenerationFailed'));
            }
        } catch (e: any) {
            console.error(e);
            Alert.alert(t('common.error'), e?.message || t('errors.planGenerationFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShoppingList = async () => {
        if (!weeklyPlan) return;
        setLoading(true);
        setLoadingMsg(t('loading.calculatingList'));
        try {
            const list = await generateShoppingList(weeklyPlan, language as SupportedLanguage);
            if (list) {
                setShoppingList(list);
                storageService.saveShoppingList(list); // Save
                setShowShoppingList(true);
            }
        } catch (e: any) {
            console.error(e);
            Alert.alert(t('common.error'), e?.message || t('errors.generic'));
        } finally {
            setLoading(false);
        }
    };

    const toggleShoppingItem = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!shoppingList) return;
        const updatedItems = shoppingList.items.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        );
        const newList = { ...shoppingList, items: updatedItems };
        setShoppingList(newList);
        storageService.saveShoppingList(newList); // Save
    };

    const handleOpenCopyModal = (dayIndex: number, mealIndex: number, recipe: Recipe) => {
        setSelectedMealToCopy({ dayIndex, mealIndex, recipe });
        setCopyMealModalVisible(true);
    };

    const handleCopyMeal = async (targetDayIndex: number, targetSlotIndex: number) => {
        if (!weeklyPlan || !selectedMealToCopy) return;

        const newPlan = { ...weeklyPlan };
        const targetMeal = newPlan.days[targetDayIndex].meals[targetSlotIndex];

        // Copy recipe details to target
        targetMeal.recipe = {
            ...selectedMealToCopy.recipe,
            id: Math.random().toString(36).substr(2, 9), // New ID to avoid reference issues
        };

        setWeeklyPlan(newPlan);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(t('common.success'), t('messages.mealCopied'));
        setCopyMealModalVisible(false);
    };

    const handleRegenerateMeal = async (dayIndex: number, mealIndex: number) => {
        if (!weeklyPlan || !userProfile) return;

        const mealSlot = weeklyPlan.days[dayIndex].meals[mealIndex];

        Alert.alert(
            t('planning.regenerateMeal'),
            `${t('planning.regenerateMealDesc')} ${mealSlot.timeSlot}?`,
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('planning.swap'),
                    onPress: async () => {
                        setRegeneratingMeal({ dayIndex, mealIndex });
                        try {
                            const newRecipe = await generateFitnessRecipe(
                                mealSlot.timeSlot,
                                userProfile.goal,
                                userProfile.dietaryRestrictions,
                                userProfile.dislikes || [],
                                userProfile.tasteProfile,
                                undefined,
                                language as SupportedLanguage
                            );

                            if (newRecipe) {
                                const newPlan = { ...weeklyPlan };
                                newPlan.days[dayIndex].meals[mealIndex].recipe = newRecipe;
                                setWeeklyPlan(newPlan);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            } else {
                                Alert.alert(t('common.error'), t('errors.regenerateFailed'));
                            }
                        } catch (error: any) {
                            console.error(error);
                            Alert.alert(t('common.error'), error?.message || t('errors.regenerateFailed'));
                        } finally {
                            setRegeneratingMeal(null);
                        }
                    }
                }
            ]
        );
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t('profile.deleteAccountConfirm'),
            t('profile.deleteAccountDesc'),
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('profile.deleteAccountButton'),
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        setLoadingMsg(t('common.loading'));
                        try {
                            if (auth.currentUser) {
                                await deleteUserData(auth.currentUser.uid);
                                await deleteUser(auth.currentUser);
                                // Auth listener will handle navigation
                            }
                        } catch (error) {
                            console.error(error);
                            Alert.alert(t('common.error'), t('errors.deleteAccountFailed'));
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // --- Mapa Alimentar & Quick Decision Handlers ---

    const handleGetQuickDecision = async () => {
        if (!userProfile) return;
        setLoading(true);
        setLoadingMsg(language === 'en' ? "Thinking..." : "Pensando...");
        try {
            const decision = await generateQuickDecision(userProfile, language as SupportedLanguage);
            if (decision) {
                setQuickDecision(decision);
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert(t('common.error'), error?.message || t('errors.generic'));
        } finally {
            setLoading(false);
        }
    };

    const handleAddMealToMapa = async (source: 'camera' | 'library') => {
        const permission = source === 'camera'
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission.granted) {
            Alert.alert("Permission required");
            return;
        }

        const result = source === 'camera'
            ? await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true })
            : await ImagePicker.launchImageLibraryAsync({ quality: 0.5, base64: true, allowsMultipleSelection: true });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setLoading(true);
            setLoadingMsg(language === 'en' ? "Analyzing meal(s)..." : "Analisando refeição...");
            try {
                const newMeals: RoutineMeal[] = [];
                for (const asset of result.assets) {
                    if (asset.base64) {
                        const analysis = await analyzeMealImage(asset.base64, language as SupportedLanguage);
                        if (analysis && analysis.name && analysis.calories && analysis.macros) {
                            newMeals.push({
                                id: Math.random().toString(36).substr(2, 9),
                                name: analysis.name,
                                calories: analysis.calories,
                                macros: analysis.macros as any,
                                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                imageUrl: asset.uri
                            });
                        }
                    }
                }
                if (newMeals.length > 0) {
                    setMapaMeals(prev => [...prev, ...newMeals]);
                }
            } catch (error: any) {
                console.error(error);
                Alert.alert(t('common.error'), error?.message || "Error analyzing image(s)");
            } finally {
                setLoading(false);
            }
        }
    };

    const handleAnalyzeRoutine = async () => {
        if (mapaMeals.length === 0) return;
        setIsAnalyzingMapa(true);
        setLoading(true);
        setLoadingMsg(language === 'en' ? "Analyzing your day..." : "Analisando seu dia...");
        try {
            const result = await analyzeRoutine(mapaMeals, userProfile!, language as SupportedLanguage);
            if (result) {
                setMapaAnalysis(result);
                setActiveTab('MAPA');
            }
        } catch (error: any) {
            console.error(error);
            Alert.alert(t('common.error'), error?.message || "Error analyzing routine");
        } finally {
            setLoading(false);
            setIsAnalyzingMapa(false);
        }
    };

    // --- Render Content ---

    const renderHome = () => {
        const displayRecipes = selectedCategory
            ? [...generatedRecipes, ...MOCK_RECIPES].filter(r => r.category === selectedCategory)
            : [...generatedRecipes, ...MOCK_RECIPES];

        const visibleRecipes = showAllRecipes ? displayRecipes : displayRecipes.slice(0, 4);

        const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

        return (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Olá, {userProfile?.name?.split(' ')[0] || 'Atleta'}!</Text>
                        <Text style={styles.subGreeting}>{userProfile?.goal === UserGoal.LOSE_WEIGHT ? 'Foco: Perder Peso' : 'Foco: Saúde'}</Text>
                    </View>
                    <TouchableOpacity onPress={() => changeTab('PROFILE')} style={styles.avatarContainer}>
                        {userProfile?.profilePicture ? (
                            <Image source={{ uri: userProfile.profilePicture }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <UserIcon size={20} color="#6B7280" />
                            </View>
                        )}
                        </TouchableOpacity>
                </View>


                {/* Decision Killer Card */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('home.decisionKiller')}</Text>
                </View>
                <LinearGradient
                    colors={['#111827', '#1F2937']}
                    style={[styles.decisionCard, { marginBottom: 16, padding: 16, borderRadius: 24 }]}
                >
                    {/* Taste Profile mini display */}
                    {userProfile?.tasteProfile?.favoriteFoods?.length || userProfile?.tasteProfile?.favoriteDish ? (
                        <View style={styles.tasteMiniRow}>
                            <SparklesIcon size={12} color="#a6f000" />
                            <Text style={[styles.tasteMiniLabel, { color: '#9CA3AF' }]}>
                                {language === 'en' ? 'Based on your taste:' : 'Baseado no seu gosto:'}
                            </Text>
                            {[
                                ...(userProfile?.tasteProfile?.favoriteFoods || []).slice(0, 3),
                                ...(userProfile?.tasteProfile?.favoriteDish ? [userProfile.tasteProfile.favoriteDish] : []),
                            ].slice(0, 3).map((food, i) => (
                                <View key={i} style={[styles.tasteMiniChip, { backgroundColor: 'rgba(166, 240, 0, 0.1)' }]}>
                                    <Text style={[styles.tasteMiniChipText, { color: '#a6f000' }]}>{food}</Text>
                                </View>
                            ))}
                            <TouchableOpacity onPress={() => setShowEditProfile(true)}>
                                <Text style={styles.tasteEditLink}>✏️</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={styles.tasteSetupRow} onPress={() => setShowEditProfile(true)}>
                            <SparklesIcon size={14} color="#a6f000" />
                            <Text style={[styles.tasteSetupText, { color: '#a6f000', fontWeight: 'bold' }]}>
                                {language === 'en' ? 'Set your taste → better suggestions' : 'Configure seu gosto → sugestões melhores'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {!quickDecision ? (
                        <View style={styles.decisionPlaceholder}>
                            <Text style={[styles.decisionText, { color: 'white', textAlign: 'center', marginBottom: 16, fontSize: 16 }]}>
                                {t('home.decisionKillerDesc')}
                            </Text>
                            <Animated.View style={{ transform: [{ scale: decisionBtnScale }], width: '100%' }}>
                                <TouchableOpacity
                                    style={[styles.decisionButton, { justifyContent: 'center', opacity: (userProfile?.tasteProfile?.favoriteFoods?.length || userProfile?.tasteProfile?.favoriteDish) ? 1 : 0.4 }]}
                                    activeOpacity={0.8}
                                    disabled={!(userProfile?.tasteProfile?.favoriteFoods?.length || userProfile?.tasteProfile?.favoriteDish)}
                                    onPressIn={() => animateButtonPress(decisionBtnScale)}
                                    onPressOut={() => animateButtonRelease(decisionBtnScale)}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                        handleGetQuickDecision();
                                    }}
                                >
                                    <SparklesIcon size={18} color="black" />
                                    <Text style={styles.decisionButtonText}>{t('home.suggestSomething')}</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    ) : (
                        <View style={styles.decisionResult}>
                            <View style={styles.decisionHeader}>
                                <Text style={[styles.decisionTitle, { color: 'white' }]}>{quickDecision.dishName}</Text>
                                <TouchableOpacity onPress={() => setQuickDecision(null)}>
                                    <RefreshIcon size={16} color="#9CA3AF" />
                                </TouchableOpacity>
                            </View>
                            <Text style={[styles.decisionReason, { color: '#D1D5DB' }]}>{quickDecision.reason}</Text>
                            <View style={[styles.decisionFooter, { borderTopColor: 'rgba(255, 255, 255, 0.1)' }]}>
                                <View style={styles.decisionMeta}>
                                    <FlameIcon size={14} color="#9CA3AF" />
                                    <Text style={[styles.decisionMetaText, { color: '#9CA3AF' }]}>{quickDecision.calories} kcal</Text>
                                </View>
                                <TouchableOpacity
                                    style={[styles.decisionAction, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setDishInput(quickDecision.dishName);
                                        changeTab('EXPLORE');
                                        changeExploreMode('TEXT');
                                        setTimeout(() => {
                                            handleGenerateRecipe(quickDecision.dishName);
                                        }, 400); // Wait for transition
                                    }}
                                >
                                    <Text style={[styles.decisionActionText, { color: 'white' }]}>{t('home.getRecipe')}</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </LinearGradient>



                {/* Premium CTA */}
                <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
                    <TouchableOpacity
                        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); changeTab('EXPLORE'); changeExploreMode('TEXT'); }}
                        onPressIn={() => animateButtonPress(ctaScale)}
                        onPressOut={() => animateButtonRelease(ctaScale)}
                        activeOpacity={0.9}
                        style={styles.ctaWrapper}
                    >
                        <LinearGradient
                            colors={['#111827', '#374151']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.ctaGradient}
                        >
                            <View style={styles.ctaContent}>
                                <View style={styles.ctaIconBox}>
                                    <SparklesIcon size={24} color="#a6f000" />
                                </View>
                                <View style={styles.ctaTextContainer}>
                                    <Text style={styles.ctaTitle}>{t('home.fitMyRecipe')}</Text>
                                    <Text style={styles.ctaDesc}>{t('home.fitMyRecipeDesc')}</Text>
                                </View>
                            </View>
                            <View style={styles.ctaArrow}>
                                <ArrowRightIcon size={20} color="#a6f000" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </Animated.View>

                {/* Recipe Pack Card */}
                <TouchableOpacity
                    style={styles.packCard}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenRecipePack(); }}
                >
                    <Image
                        source={
                            userProfile?.goal === UserGoal.LOSE_WEIGHT ? require('../assets/images/recipes/omelete.png') :
                                userProfile?.goal === UserGoal.GAIN_MUSCLE ? require('../assets/images/recipes/frango.png') :
                                    require('../assets/images/recipes/bowl.png')
                        }
                        style={styles.packCardBackground}
                        resizeMode="cover"
                    />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.packCardOverlay}
                    >
                        <View style={styles.packContent}>
                            <View style={styles.packTextContainer}>
                                <Text style={styles.packTitleLight}>
                                    {language === 'en'
                                        ? (userProfile?.goal === UserGoal.LOSE_WEIGHT ? '5 Recipes for Weight Loss' :
                                            userProfile?.goal === UserGoal.GAIN_MUSCLE ? '5 Recipes for Muscle Gain' : '5 Healthy Recipes')
                                        : (userProfile?.goal === UserGoal.LOSE_WEIGHT ? '5 Receitas para Perda de Peso' :
                                            userProfile?.goal === UserGoal.GAIN_MUSCLE ? '5 Receitas para Ganho de Massa' : '5 Receitas Saudáveis')}
                                </Text>
                                <Text style={styles.packSubtitleLight}>
                                    {language === 'en' ? 'Selected for your goal' : 'Selecionadas para seu objetivo'}
                                </Text>
                            </View>
                            <View style={styles.packArrowLight}>
                                <ArrowRightIcon size={20} color="black" />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Categories */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>{t('home.categories')}</Text>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesList}
                >
                    {getRecipeCategories(language).map(cat => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => { Haptics.selectionAsync(); setSelectedCategory(isSelected ? null : cat.id); }}
                                style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                            >
                                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                <Text style={[styles.categoryLabel, isSelected && styles.categoryLabelSelected]}>{cat.label}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Feed */}
                <View style={styles.feedHeader}>
                    <Text style={styles.sectionTitle}>
                        {selectedCategory
                            ? (language === 'en'
                                ? `${getRecipeCategories(language).find(c => c.id === selectedCategory)?.label} Recipes`
                                : `Receitas de ${getRecipeCategories(language).find(c => c.id === selectedCategory)?.label}`)
                            : (language === 'en' ? 'Highlights' : 'Destaques')}
                    </Text>
                    {selectedCategory ? (
                        <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                            <Text style={styles.clearFilter}>{language === 'en' ? 'Clear' : 'Limpar'}</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity onPress={() => changeTab('MAPA')} style={styles.libraryLink}>
                            <ActivityIcon size={14} color="#a6f000" />
                            <Text style={styles.libraryLinkText}>{language === 'en' ? 'Food Map' : 'Mapa Alimentar'}</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={[styles.recipesList, !showAllRecipes && { paddingBottom: 0 }]}>
                    {visibleRecipes.map((recipe, index) => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            onPress={() => onRecipeClick(recipe)}
                        />
                    ))}
                    {!showAllRecipes && displayRecipes.length > 3 && (
                        <LinearGradient
                            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,1)']}
                            style={styles.seeMoreGradient}
                        >
                            <TouchableOpacity onPress={() => setShowAllRecipes(true)} style={styles.seeMoreButton}>
                                <Text style={styles.seeMoreText}>{language === 'en' ? 'See more' : 'Ver mais'}</Text>
                                <ArrowRightIcon size={16} color="#000" />
                            </TouchableOpacity>
                        </LinearGradient>
                    )}
                </View>
            </ScrollView >
        );
    };

    const renderExplore = () => (
        <ScrollView
            ref={exploreScrollRef}
            contentContainerStyle={[
                styles.scrollContent,
                isKeyboardVisible && styles.scrollContentKeyboardOpen
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
        >
            <View style={styles.exploreHeader}>
                <Text style={styles.pageTitle}>{language === 'en' ? 'Explore' : 'Explorar'}</Text>
                <Text style={styles.pageSubtitle}>
                    {language === 'en' ? 'Discover recipes or use what you have at home.' : 'Descubra receitas ou use o que tem em casa.'}
                </Text>
            </View>

            {/* Mode Switch */}
            <View style={styles.modeSwitchContainer}>
                <View style={styles.modeSwitch}>
                    <TouchableOpacity
                        onPress={() => changeExploreMode('TEXT')}
                        style={[styles.modeButton, exploreMode === 'TEXT' && styles.modeButtonActive]}
                    >
                        <Text style={[styles.modeText, exploreMode === 'TEXT' && styles.modeTextActive]}>
                            {language === 'en' ? 'Craving' : 'Desejo'}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => changeExploreMode('PANTRY')}
                        style={[styles.modeButton, exploreMode === 'PANTRY' && styles.modeButtonActive]}
                    >
                        <Text style={[styles.modeText, exploreMode === 'PANTRY' && styles.modeTextActive]}>
                            {language === 'en' ? 'Pantry' : 'Despensa'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {exploreMode === 'TEXT' ? (
                <View style={styles.exploreContainer}>
                    <View style={styles.magicCard}>
                        <View style={styles.magicHeader}>
                            <SparklesIcon size={32} color="#a6f000" />
                            <Text style={styles.magicTitle}>
                                {language === 'en' ? 'Magic Transformation' : 'Transformação Mágica'}
                            </Text>
                        </View>
                        <Text style={styles.magicDesc}>
                            {language === 'en'
                                ? 'Type the name or attach a photo of the dish — the AI will create a healthy version for you.'
                                : 'Digite o nome ou anexe uma foto do prato — a IA cria a versão saudável para você.'}
                        </Text>

                        {/* Image Previews */}
                        {desireImages.length > 0 && (
                            <View style={styles.desireImagesRow}>
                                {desireImages.map((uri, idx) => (
                                    <View key={idx} style={styles.desireImageWrapper}>
                                        <Image source={{ uri }} style={styles.desireImageThumb} />
                                        <TouchableOpacity
                                            style={styles.desireImageRemove}
                                            onPress={() => removeDesireImage(idx)}
                                        >
                                            <Text style={styles.desireImageRemoveText}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                ))}
                                {desireImages.length < 2 && (
                                    <TouchableOpacity
                                        style={styles.desireImageAdd}
                                        onPress={() => pickDesireImage('gallery')}
                                    >
                                        <Text style={styles.desireImageAddIcon}>＋</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Image Attachment Buttons (shown when no images yet) */}
                        {desireImages.length === 0 && (
                            <View style={styles.desireAttachRow}>
                                <TouchableOpacity
                                    style={styles.desireAttachBtn}
                                    onPress={() => pickDesireImage('camera')}
                                >
                                    <CameraIcon size={16} color="#a6f000" />
                                    <Text style={styles.desireAttachText}>
                                        {language === 'en' ? 'Camera' : 'Câmera'}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.desireAttachBtn}
                                    onPress={() => pickDesireImage('gallery')}
                                >
                                    <Text style={{ fontSize: 16 }}>🖼️</Text>
                                    <Text style={styles.desireAttachText}>
                                        {language === 'en' ? 'Gallery' : 'Galeria'}
                                    </Text>
                                </TouchableOpacity>
                                <Text style={styles.desireAttachHint}>
                                    {language === 'en' ? 'Up to 2 images' : 'Até 2 imagens'}
                                </Text>
                            </View>
                        )}

                        {/* Text Input + Send Button row */}
                        <View
                            style={styles.inputRow}
                            onLayout={({ nativeEvent }) => {
                                exploreFieldPositions.current.dishInput = nativeEvent.layout.y;
                            }}
                        >
                            <TextInput
                                style={styles.textInputFlex}
                                placeholder={language === 'en' ? 'E.g. Pizza, Lasagna, Brownie...' : 'Ex: Pizza, Lasanha, Brigadeiro...'}
                                value={dishInput}
                                onChangeText={setDishInput}
                                placeholderTextColor="#9CA3AF"
                                onFocus={() => scrollExploreFieldIntoView('dishInput')}
                            />
                            <Animated.View style={{ transform: [{ scale: sendBtnScale }] }}>
                                <TouchableOpacity
                                    onPress={handleGenerateRecipe}
                                    onPressIn={() => animateButtonPress(sendBtnScale)}
                                    onPressOut={() => animateButtonRelease(sendBtnScale)}
                                    disabled={!dishInput.trim() && desireImages.length === 0}
                                    style={[styles.sendBtnFixed, (!dishInput.trim() && desireImages.length === 0) && styles.sendButtonDisabled]}
                                >
                                    <ArrowRightIcon size={22} color={(dishInput.trim() || desireImages.length > 0) ? "#111827" : "#9CA3AF"} />
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    </View>

                    <View style={styles.suggestionsContainer}>
                        <Text style={styles.sectionTitle}>
                            {language === 'en' ? 'Popular Suggestions' : 'Sugestões Populares'}
                        </Text>
                        <View style={styles.tagsRow}>
                            {["Pizza Fit", "Hambúrguer", "Lasanha de Berinjela", "Brownie Low Carb", "Strogonoff Light"].map((s, i) => (
                                <TouchableOpacity key={i} onPress={() => setDishInput(s)} style={styles.suggestionTag}>
                                    <Text style={styles.suggestionText}>{s}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.exploreContainer}>
                    <View style={styles.scannerCard}>
                        <View style={styles.scannerHeader}>
                            <CameraIcon size={32} color="#a6f000" />
                            <Text style={styles.scannerTitle}>
                                {language === 'en' ? 'Pantry Scanner' : 'Scanner de Despensa'}
                            </Text>
                        </View>
                        <Text style={styles.scannerDesc}>
                            Tire uma foto dos seus ingredientes ou adicione manualmente.
                        </Text>

                        <TouchableOpacity onPress={handleTakePhoto} style={styles.cameraButtonLarge}>
                            <CameraIcon size={24} color="black" />
                            <Text style={styles.cameraButtonTextLarge}>Abrir Câmera</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={pickImage} style={styles.galleryLink}>
                            <Text style={styles.galleryLinkText}>ou escolha da galeria</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.manualInputSection}>
                        <Text style={styles.sectionTitle}>
                            {language === 'en' ? 'Add Manually' : 'Adicionar Manualmente'}
                        </Text>
                        <View
                            style={styles.miniInputRow}
                            onLayout={({ nativeEvent }) => {
                                exploreFieldPositions.current.manualIngredient = nativeEvent.layout.y;
                            }}
                        >
                            <TextInput
                                style={styles.miniInput}
                                placeholder="Ex: Frango, Batata Doce..."
                                value={manualIngredient}
                                onChangeText={setManualIngredient}
                                onSubmitEditing={addManualIngredient}
                                onFocus={() => scrollExploreFieldIntoView('manualIngredient')}
                            />
                            <TouchableOpacity onPress={addManualIngredient} style={styles.miniAddBtn}>
                                <PlusIcon size={20} color="black" />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {pantryIngredients.length > 0 && (
                        <View style={styles.ingredientsBox}>
                            <View style={styles.ingredientsHeader}>
                                <Text style={styles.ingCount}>{pantryIngredients.length} ingredientes</Text>
                                <TouchableOpacity onPress={() => setPantryIngredients([])}>
                                    <Text style={styles.clearText}>Limpar tudo</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.tagsRow}>
                                {pantryIngredients.map((ing, i) => (
                                    <View key={i} style={styles.ingTag}>
                                        <Text style={styles.ingText}>{ing}</Text>
                                        <TouchableOpacity onPress={() => removeIngredient(i)} style={styles.removeIngBtn}>
                                            <CloseIcon size={12} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                            <Animated.View style={{ transform: [{ scale: generateBtnScale }], width: '100%' }}>
                                <TouchableOpacity
                                    onPress={handleGenerateRecipe}
                                    activeOpacity={0.8}
                                    onPressIn={() => animateButtonPress(generateBtnScale)}
                                    onPressOut={() => animateButtonRelease(generateBtnScale)}
                                    style={styles.generateBtn}
                                >
                                    <ChefHatIcon size={20} color="black" />
                                    <Text style={styles.generateBtnText}>Criar Receita Agora</Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );

    const handleDeletePlan = () => {
        Alert.alert(
            t('planning.deletePlan') || "Delete Plan",
            t('planning.deletePlanDesc') || "Are you sure? You will need to generate a new plan.",
            [
                { text: t('common.cancel'), style: "cancel" },
                {
                    text: t('common.delete'),
                    style: "destructive",
                    onPress: async () => {
                        setWeeklyPlan(null);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                }
            ]
        );
    };

    const renderPlanning = () => (
        <View style={styles.content}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>Sua Semana</Text>
                    {weeklyPlan && (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                onPress={handleDeletePlan}
                                style={[styles.shoppingListBtn, { backgroundColor: '#FEE2E2' }]}
                            >
                                <TrashIcon size={16} color="#EF4444" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleCreateShoppingList}
                                style={styles.shoppingListBtn}
                            >
                                <ShoppingBagIcon size={16} color="#a6f000" />
                                <Text style={styles.shoppingListBtnText}>Lista</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {!weeklyPlan ? (
                    <WeeklyPlanIntro onStart={() => setShowPlanningWizard(true)} />
                ) : (
                    <View>
                        {/* Day Selector */}
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysRow}>
                            {weeklyPlan.days.map((day, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => setActivePlanningDay(idx)}
                                    style={[styles.dayCard, activePlanningDay === idx && styles.dayCardActive]}
                                >
                                    <Text style={[styles.dayName, activePlanningDay === idx && styles.dayNameActive]}>
                                        {day.dayName.substring(0, 3)}
                                    </Text>
                                    <Text style={[styles.dayNumber, activePlanningDay === idx && styles.dayNumberActive]}>
                                        {idx + 1}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        {/* Loading Modal removed from here, now global at the root */}

                        {/* Modals */}
                        {/* Meals List */}
                        <View style={styles.mealsList}>
                            {weeklyPlan.days[activePlanningDay].meals.map((meal, idx) => (
                                <View key={meal.id} style={styles.mealCard}>
                                    {meal.recipe ? (
                                        <TouchableOpacity onPress={() => onRecipeClick(meal.recipe!)}>
                                            <Image source={{ uri: meal.recipe.imageUrl || 'https://via.placeholder.com/150' }} style={styles.mealImage} />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={[styles.mealImage, { backgroundColor: '#E5E7EB' }]} />
                                    )}
                                    <View style={styles.mealInfo}>
                                        <View style={styles.mealHeader}>
                                            <View style={styles.timeSlotBadge}>
                                                <Text style={styles.timeSlotText}>{meal.timeSlot}</Text>
                                            </View>
                                            <View style={styles.mealActions}>
                                                {meal.recipe && (
                                                    <TouchableOpacity
                                                        onPress={() => handleOpenCopyModal(activePlanningDay, idx, meal.recipe!)}
                                                        style={styles.actionBtn}
                                                    >
                                                        <CopyIcon size={16} color="#6B7280" />
                                                    </TouchableOpacity>
                                                )}
                                                <TouchableOpacity
                                                    onPress={() => handleRegenerateMeal(activePlanningDay, idx)}
                                                    style={styles.actionBtn}
                                                    disabled={regeneratingMeal?.dayIndex === activePlanningDay && regeneratingMeal?.mealIndex === idx}
                                                >
                                                    {regeneratingMeal?.dayIndex === activePlanningDay && regeneratingMeal?.mealIndex === idx ? (
                                                        <ActivityIndicator size="small" color="#a6f000" />
                                                    ) : (
                                                        <RefreshIcon size={16} color="#6B7280" />
                                                    )}
                                                </TouchableOpacity>
                                            </View>
                                        </View>
                                        <TouchableOpacity onPress={() => meal.recipe && onRecipeClick(meal.recipe)}>
                                            <Text numberOfLines={2} style={styles.mealName}>{meal.recipe?.name}</Text>
                                        </TouchableOpacity>
                                        <View style={styles.mealMeta}>
                                            <View style={styles.metaItem}>
                                                <TimerIcon size={12} color="#6B7280" />
                                                <Text style={styles.metaText}>{meal.recipe?.prepTime}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <FlameIcon size={12} color="#6B7280" />
                                                <Text style={styles.metaText}>{meal.recipe?.macros.calories} kcal</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>

                        <TouchableOpacity onPress={() => setShowPlanningWizard(true)} style={styles.secondaryBtn}>
                            <Text style={styles.secondaryBtnText}>Refazer semana inteira</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            {weeklyPlan && (
                <CopyMealModal
                    visible={copyMealModalVisible}
                    onClose={() => setCopyMealModalVisible(false)}
                    onCopy={handleCopyMeal}
                    plan={weeklyPlan}
                />
            )}

            {/* Shopping List Modal */}
            <Modal visible={showShoppingList} animationType="slide" presentationStyle="pageSheet">
                <View style={styles.modalContainer}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Lista de Compras</Text>
                        <TouchableOpacity onPress={() => setShowShoppingList(false)} style={styles.closeBtn}>
                            <CloseIcon size={24} color="#1F2937" />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={styles.modalContent}>
                        {shoppingList?.items.map(item => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => toggleShoppingItem(item.id)}
                                style={[styles.shoppingItem, item.checked && styles.shoppingItemChecked]}
                            >
                                <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
                                    {item.checked && <CheckIcon size={12} color="white" />}
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.itemName, item.checked && styles.itemNameChecked]}>{item.name}</Text>
                                    <Text style={styles.itemCat}>{item.category}</Text>
                                </View>
                                <Text style={styles.itemQty}>{item.quantity}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
            </Modal>
        </View>
    );

    const renderLibrary = () => {
        // No longer need complex filter, we use the persistent fullSavedRecipes


        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>{language === 'en' ? 'Library' : 'Biblioteca'}</Text>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{savedRecipes.size}</Text>
                        <Text style={styles.statLabel}>{language === 'en' ? 'Saved' : 'Salvas'}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{userLists?.length || 0}</Text>
                        <Text style={styles.statLabel}>{language === 'en' ? 'Lists' : 'Listas'}</Text>
                    </View>
                </View>

                {/* My Lists Section */}
                <Text style={styles.sectionTitle}>{language === 'en' ? 'My Lists' : 'Minhas Listas'}</Text>
                {userLists && userLists.length > 0 ? (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                        {userLists.map(list => (
                            <TouchableOpacity
                                key={list.id}
                                style={styles.listCardCompact}
                                onPress={() => {
                                    // Open a list view (could be a simple filter or a new modal)
                                    // For now, let's keep it simple and filter the main list?
                                    // Or just show them they exist.
                                    Alert.alert(list.name, `${list.recipeIds.length} ${language === 'en' ? 'recipes' : 'receitas'}`);
                                }}
                            >
                                <View style={styles.listIconBox}>
                                    <FileTextIcon size={20} color="#a6f000" />
                                </View>
                                <Text style={styles.listCardName} numberOfLines={1}>{list.name}</Text>
                                <Text style={styles.listCardCount}>{list.recipeIds.length} {language === 'en' ? 'items' : 'itens'}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                ) : (
                    <View style={styles.emptySmall}>
                        <Text style={styles.emptySmallText}>{language === 'en' ? 'No lists yet' : 'Nenhuma lista criada'}</Text>
                    </View>
                )}

                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>{language === 'en' ? 'Saved Recipes' : 'Receitas Salvas'}</Text>
                {fullSavedRecipes.length > 0 ? (
                    <View style={styles.recipesList}>
                        {fullSavedRecipes.map(recipe => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                onPress={() => onRecipeClick(recipe)}
                                onSave={onToggleSave}
                                isSaved={savedRecipes.has(recipe.id)}
                                userDislikes={userProfile?.dislikes || []}
                            />
                        ))}
                    </View>
                ) : (
                    <View style={styles.emptyState}>
                        <BookHeartIcon size={40} color="#D1D5DB" />
                        <Text style={[styles.emptyTitle, { marginTop: 16 }]}>Nenhuma receita salva</Text>
                        <Text style={styles.emptyDesc}>Suas receitas favoritas aparecerão aqui.</Text>
                    </View>
                )}

                <View style={[styles.sectionHeader, { marginTop: 32 }]}>
                    <Text style={styles.sectionTitle}>Histórico Recente</Text>
                </View>
                <View style={styles.historyList}>
                    {generatedRecipes.filter((r: Recipe) => !savedRecipes.has(r.id)).length > 0 ? (
                        generatedRecipes.filter((r: Recipe) => !savedRecipes.has(r.id)).map((recipe: Recipe) => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                onPress={() => onRecipeClick(recipe)}
                                compact={true}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyHistoryText}>Nenhum histórico disponível além das salvas.</Text>
                    )}
                </View>
            </ScrollView>
        );
    };

    const renderProfile = () => {
        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>{language === 'en' ? 'Profile' : 'Perfil'}</Text>
                    <TouchableOpacity onPress={() => setShowEditProfile(true)}>
                        <Text style={styles.editProfileText}>{language === 'en' ? 'Edit' : 'Editar'}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.profileCard}>
                    <View style={styles.profileImageContainer}>
                        {userProfile?.profilePicture ? (
                            <Image source={{ uri: userProfile.profilePicture }} style={styles.profileImage} />
                        ) : (
                            <UserIcon size={48} color="#D1D5DB" />
                        )}
                    </View>
                    <Text style={styles.profileName}>{userProfile?.name}</Text>
                    <Text style={styles.profileGoal}>
                        {language === 'en'
                            ? (userProfile?.goal === UserGoal.LOSE_WEIGHT ? 'Burn Fat' :
                                userProfile?.goal === UserGoal.GAIN_MUSCLE ? 'Build Muscle' : 'Healthy')
                            : (userProfile?.goal === UserGoal.LOSE_WEIGHT ? 'Queimar Gordura' :
                                userProfile?.goal === UserGoal.GAIN_MUSCLE ? 'Ganhar Massa' : 'Saudável')}
                    </Text>
                    <TouchableOpacity onPress={() => setShowEditProfile(true)} style={{ marginTop: 10 }}>
                        <Text style={{ color: '#a6f000', fontWeight: '600' }}>
                            {language === 'en' ? 'Edit Profile' : 'Editar Perfil'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{userProfile?.dietaryRestrictions.length || 0}</Text>
                        <Text style={styles.statLabel}>{language === 'en' ? 'Restrictions' : 'Restrições'}</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{userProfile?.dislikes.length || 0}</Text>
                        <Text style={styles.statLabel}>{language === 'en' ? 'Dislikes' : 'Não Gosta'}</Text>
                    </View>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.menuTitle}>{language === 'en' ? 'Support & Legal' : 'Suporte & Legal'}</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Linking.openURL('https://victoralmeidaj16.github.io/Food-NutriVerse/support.html')}
                    >
                        <View style={styles.menuIconBox}>
                            <HelpCircleIcon size={20} color="#4B5563" />
                        </View>
                        <Text style={styles.menuItemText}>{language === 'en' ? 'Contact Us' : 'Fale Conosco'}</Text>
                        <ArrowRightIcon size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Linking.openURL('https://victoralmeidaj16.github.io/Food-NutriVerse/terms.html')}
                    >
                        <View style={styles.menuIconBox}>
                            <FileTextIcon size={20} color="#4B5563" />
                        </View>
                        <Text style={styles.menuItemText}>{language === 'en' ? 'Terms of Use' : 'Termos de Uso'}</Text>
                        <ArrowRightIcon size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Linking.openURL('https://victoralmeidaj16.github.io/Food-NutriVerse/privacy.html')}
                    >
                        <View style={styles.menuIconBox}>
                            <LockIcon size={20} color="#4B5563" />
                        </View>
                        <Text style={styles.menuItemText}>{language === 'en' ? 'Privacy Policy' : 'Política de Privacidade'}</Text>
                        <ArrowRightIcon size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setShowSourcesScreen(true)}
                    >
                        <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
                            <FileTextIcon size={20} color="#0369A1" />
                        </View>
                        <Text style={styles.menuItemText}>{language === 'en' ? 'Sources & References' : 'Fontes e Referências'}</Text>
                        <ArrowRightIcon size={16} color="#9CA3AF" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    style={styles.menuItem}
                    onPress={() => setLanguage(language === 'pt' ? 'en' : 'pt')}
                >
                    <View style={[styles.menuIconBox, { backgroundColor: '#EEF2FF' }]}>
                        <Text style={{ fontSize: 16 }}>🌐</Text>
                    </View>
                    <Text style={styles.menuItemText}>{t('profile.changeLanguage')}</Text>
                    <Text style={{ color: '#6B7280', fontWeight: '600' }}>{language.toUpperCase()}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                    <Text style={styles.logoutText}>{t('profile.logout')}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteAccountButton}>
                    <Text style={styles.deleteAccountText}>
                        {language === 'en' ? 'Delete my account' : 'Excluir minha conta'}
                    </Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    const renderMapaAlimentar = () => {
        return (
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Hero Section */}
                <View style={styles.mapaHero}>
                    <View style={styles.mapaHeroContent}>
                        <Text style={styles.mapaHeroTitle}>{t('mapa.title')}</Text>
                        <Text style={styles.mapaHeroSubtitle}>{t('mapa.subtitle')}</Text>
                    </View>
                    <View style={styles.mapaHeroIcon}>
                        <CameraIcon size={32} color="#a6f000" />
                    </View>
                </View>

                {/* Input Section */}
                {!mapaAnalysis ? (
                    <View style={styles.mapaInputSection}>
                        <Text style={styles.mapaSectionTitle}>{t('mapa.todayMeals')}</Text>

                        {mapaMeals.length === 0 ? (
                            <View style={styles.mapaEmptyState}>
                                <Text style={styles.mapaEmptyText}>{t('mapa.emptyMeals')}</Text>
                            </View>
                        ) : (
                            <View style={styles.mapaMealsList}>
                                {mapaMeals.map((meal) => (
                                    <View key={meal.id} style={styles.mapaMealItem}>
                                        {meal.imageUrl && (
                                            <Image source={{ uri: meal.imageUrl }} style={{ width: 44, height: 44, borderRadius: 8, marginRight: 12 }} />
                                        )}
                                        <View style={[styles.mapaMealInfo, { flex: 1 }]}>
                                            <Text style={styles.mapaMealTime}>{meal.time}</Text>
                                            <Text style={styles.mapaMealName}>{meal.name}</Text>
                                        </View>
                                        <View style={styles.mapaMealVisualMeta}>
                                            <Text style={styles.mapaMealCal}>{meal.calories} {t('mapa.calories')}</Text>
                                            <TouchableOpacity onPress={() => setMapaMeals(prev => prev.filter(m => m.id !== meal.id))}>
                                                <TrashIcon size={18} color="#EF4444" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}

                        <View style={styles.mapaActionRow}>
                            <TouchableOpacity
                                style={[styles.mapaAddBtn, { backgroundColor: '#111827' }]}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleAddMealToMapa('camera'); }}
                            >
                                <CameraIcon size={20} color="#a6f000" />
                                <Text style={[styles.mapaAddBtnText, { color: '#a6f000' }]}>{t('mapa.photo')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.mapaAddBtn, { backgroundColor: '#F3F4F6' }]}
                                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); handleAddMealToMapa('library'); }}
                            >
                                <PlusIcon size={20} color="#111827" />
                                <Text style={[styles.mapaAddBtnText, { color: '#111827' }]}>{t('mapa.gallery')}</Text>
                            </TouchableOpacity>
                        </View>

                        {mapaMeals.length > 0 && (
                            <TouchableOpacity
                                style={styles.mapaAnalyzeBtn}
                                onPress={handleAnalyzeRoutine}
                                disabled={isAnalyzingMapa}
                            >
                                {isAnalyzingMapa ? (
                                    <ActivityIndicator color="black" />
                                ) : (
                                    <>
                                        <SparklesIcon size={20} color="black" />
                                        <Text style={styles.mapaAnalyzeBtnText}>{t('mapa.analyzeRoutine')}</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={styles.mapaResultOverlay}>
                        {/* Score Section */}
                        <View style={styles.mapaScoreCard}>
                            <View style={styles.mapaScoreCircle}>
                                <Text style={styles.mapaScoreValue}>{mapaAnalysis.diagnostic.score}%</Text>
                                <Text style={styles.mapaScoreLabel}>{t('mapa.adherence')}</Text>
                            </View>
                            <View style={styles.mapaScoreInfo}>
                                <Text style={styles.mapaScoreTitle}>{t('mapa.analysisDay')}</Text>
                                <Text style={styles.mapaScoreDesc}>{mapaAnalysis.diagnostic.summary}</Text>
                            </View>
                        </View>

                        {/* Micro-Swaps */}
                        <Text style={styles.mapaSectionTitle}>{t('mapa.microSwaps')}</Text>
                        {mapaAnalysis.microSwaps.map((swap, idx) => (
                            <View key={idx} style={styles.mapaSwapCard}>
                                <View style={styles.mapaSwapCompare}>
                                    <View style={styles.mapaSwapFrom}>
                                        <Text style={styles.mapaSwapLabel}>{t('mapa.insteadOf')}</Text>
                                        <Text style={styles.mapaSwapValue}>{swap.from}</Text>
                                    </View>
                                    <ArrowRightIcon size={20} color="#9CA3AF" />
                                    <View style={styles.mapaSwapTo}>
                                        <Text style={[styles.mapaSwapLabel, { color: '#059669' }]}>{t('mapa.tryInstead')}</Text>
                                        <Text style={[styles.mapaSwapValue, { color: '#059669' }]}>{swap.to}</Text>
                                    </View>
                                </View>
                                <View style={styles.mapaSwapReason}>
                                    <Text style={styles.mapaSwapReasonText}>💡 {swap.reason}</Text>
                                </View>
                            </View>
                        ))}

                        <TouchableOpacity
                            style={styles.mapaResetBtn}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setMapaAnalysis(null);
                                setMapaMeals([]);
                            }}
                        >
                            <Text style={styles.mapaResetBtnText}>{language === 'en' ? 'New Analysis' : 'Nova Análise'}</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 40}
            >
                <Animated.View style={[
                    styles.content,
                    {
                        transform: [{ scale: bgScale }],
                        opacity: bgOpacity,
                        borderRadius: bgScale.interpolate({
                            inputRange: [0.94, 1],
                            outputRange: [32, 0]
                        }),
                        overflow: 'hidden'
                    }
                ]}>
                    <Animated.View style={{ flex: 1, opacity: tabAnim, transform: [{ scale: tabAnim }] }}>
                        {activeTab === 'HOME' && renderHome()}
                        {activeTab === 'EXPLORE' && renderExplore()}
                        {activeTab === 'MAPA' && renderMapaAlimentar()}
                        {activeTab === 'LIBRARY' && renderLibrary()}
                        {activeTab === 'PLANNING' && renderPlanning()}
                        {activeTab === 'PROFILE' && renderProfile()}
                    </Animated.View>
                </Animated.View>
            </KeyboardAvoidingView>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity onPress={() => changeTab('HOME')} style={styles.navItem}>
                    <HomeIcon size={24} color={activeTab === 'HOME' ? '#a6f000' : '#9CA3AF'} fill={activeTab === 'HOME' ? '#a6f000' : 'none'} />
                    <Text style={[styles.navLabel, activeTab === 'HOME' && styles.navLabelActive]}>
                        {language === 'en' ? 'Home' : 'Início'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeTab('LIBRARY')} style={styles.navItem}>
                    <BookHeartIcon size={24} color={activeTab === 'LIBRARY' ? '#a6f000' : '#9CA3AF'} />
                    <Text style={[styles.navLabel, activeTab === 'LIBRARY' && styles.navLabelActive]}>
                        {language === 'en' ? 'Library' : 'Biblioteca'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={handleExplorePress} style={styles.fabContainer} activeOpacity={1}>
                    <Animated.View style={[
                        styles.fabRipple,
                        { transform: [{ scale: rippleScale }], opacity: rippleOpacity }
                    ]} />
                    <Animated.View style={[styles.fab, { transform: [{ scale: fabScale }, { rotate: spin }] }]}>
                        <ChefHatIcon size={28} color="#a6f000" />
                    </Animated.View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeTab('PLANNING')} style={styles.navItem}>
                    <CalendarIcon size={24} color={activeTab === 'PLANNING' ? '#a6f000' : '#9CA3AF'} />
                    <Text style={[styles.navLabel, activeTab === 'PLANNING' && styles.navLabelActive]}>
                        {language === 'en' ? 'Plan' : 'Plano'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeTab('PROFILE')} style={styles.navItem}>
                    <UserIcon size={24} color={activeTab === 'PROFILE' ? '#a6f000' : '#9CA3AF'} fill={activeTab === 'PROFILE' ? '#a6f000' : 'none'} />
                    <Text style={[styles.navLabel, activeTab === 'PROFILE' && styles.navLabelActive]}>
                        {language === 'en' ? 'Profile' : 'Perfil'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Toast */}
            {toastMessage !== '' && (
                <Animated.View style={[styles.toast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }] }]}>
                    <CheckIcon size={16} color="white" />
                    <Text style={styles.toastText}>{toastMessage}</Text>
                </Animated.View>
            )}

            {/* Global Loading Modal */}
            <LoadingModal
                visible={loading}
                progress={loadingProgress}
                status={loadingStatus || loadingMsg}
                personalizationText={
                    userProfile?.goal === 'LOSE_WEIGHT' ? (language === 'en' ? 'Adapting to: Weight Loss' : 'Adaptando para: Emagrecimento') :
                    userProfile?.goal === 'GAIN_MUSCLE' ? (language === 'en' ? 'Goal: High Protein' : 'Meta: Alta Proteína') :
                    (language === 'en' ? 'Adapting to: Healthy Lifestyle' : 'Adaptando para: Vida Saudável')
                }
            />
            {showPlanningWizard && (
                <PlanningWizard
                    onClose={() => setShowPlanningWizard(false)}
                    onGenerate={handleGeneratePlan}
                />
            )}

            {showEditProfile && userProfile && (
                <EditProfileModal
                    profile={userProfile}
                    onClose={() => setShowEditProfile(false)}
                    onSave={(updated) => {
                        onUpdateProfile(updated);
                        setShowEditProfile(false);
                    }}
                />
            )}

            <PantryImagePreview
                visible={showPantryPreview}
                images={pantryImages}
                onAddMore={handleAddMorePantryImages}
                onAddManually={handleAddManuallyFromPreview}
                onAnalyze={handleAnalyzePantryImages}
                onRemoveImage={handleRemovePantryImage}
                onClose={() => {
                    setShowPantryPreview(false);
                    setPantryImages([]);
                }}
            />

            {showSourcesScreen && (
                <Modal visible={showSourcesScreen} animationType="slide" presentationStyle="fullScreen">
                    <SourcesScreen onBack={() => setShowSourcesScreen(false)} />
                </Modal>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    toast: {
        position: 'absolute',
        bottom: 120,
        alignSelf: 'center',
        backgroundColor: '#111827',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 40,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 6,
        zIndex: 999,
    },
    toastText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 140, // Increased for floating nav
    },
    scrollContentKeyboardOpen: {
        paddingBottom: 260,
    },
    center: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 8,
    },
    dateText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 4,
    },
    greeting: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        letterSpacing: -0.5,
    },
    avatarContainer: {
        position: 'relative',
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    notificationDot: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#EF4444',
        borderWidth: 2,
        borderColor: 'white',
    },
    ctaWrapper: {
        marginBottom: 40,
        borderRadius: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 10,
    },
    ctaGradient: {
        borderRadius: 28,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    ctaContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    ctaIconBox: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaTextContainer: {
        flex: 1,
    },
    ctaTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: 'white',
        marginBottom: 4,
    },
    ctaDesc: {
        fontSize: 13,
        color: '#D1D5DB',
        lineHeight: 18,
    },
    ctaArrow: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    categoriesList: {
        gap: 12,
        paddingBottom: 32,
        paddingHorizontal: 4,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB', // Darker border
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2, // Android shadow
    },
    categoryCardSelected: {
        backgroundColor: '#111827',
        borderColor: '#111827',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    categoryIcon: {
        fontSize: 18,
    },
    categoryLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    categoryLabelSelected: {
        color: 'white',
    },
    feedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    clearFilter: {
        fontSize: 12,
        color: '#EF4444',
        fontWeight: '700',
    },
    libraryLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    libraryLinkText: {
        fontSize: 13,
        color: '#a6f000',
        fontWeight: '700',
    },
    recipesList: {
        gap: 16,
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: 'white',
        paddingVertical: 12, // Reduced height
        paddingHorizontal: 24,
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        bottom: 32,
        left: 24,
        right: 24,
        borderRadius: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    navItem: {
        alignItems: 'center',
        gap: 4,
    },
    navLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    navLabelActive: {
        color: '#1F2937',
    },
    fabContainer: {
        top: -24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabRipple: {
        position: 'absolute',
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(166, 240, 0, 0.6)',
        zIndex: -1,
    },
    fab: {
        width: 56,
        height: 56,
        backgroundColor: 'black',
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
        borderWidth: 4,
        borderColor: '#FAFAFA',
    },
    pageTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 24,
    },
    modeSwitch: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 4,
        borderRadius: 16,
        marginBottom: 32,
    },
    modeButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    modeButtonActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    modeText: {
        fontWeight: '700',
        color: '#9CA3AF',
    },
    modeTextActive: {
        color: '#1F2937',
    },
    exploreContainer: {
        alignItems: 'center',
    },
    magicCard: {
        backgroundColor: '#111827',
        borderRadius: 32,
        padding: 32, // Increased padding
        paddingVertical: 48, // Increased vertical padding for taller look
        marginHorizontal: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    magicHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
        justifyContent: 'center',
    },
    magicIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(166, 240, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    magicTitle: {
        fontSize: 26, // Increased font size
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    magicDesc: {
        fontSize: 15,
        color: '#9CA3AF',
        marginBottom: 20,
        lineHeight: 22,
        textAlign: 'center',
    },
    // Image attachment row
    desireImagesRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 16,
        alignItems: 'center',
    },
    desireImageWrapper: {
        position: 'relative',
        width: 80,
        height: 80,
        borderRadius: 12,
        overflow: 'visible',
    },
    desireImageThumb: {
        width: 80,
        height: 80,
        borderRadius: 12,
    },
    desireImageRemove: {
        position: 'absolute',
        top: -8,
        right: -8,
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#EF4444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    desireImageRemoveText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '700',
    },
    desireImageAdd: {
        width: 80,
        height: 80,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(166,240,0,0.4)',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    desireImageAddIcon: {
        fontSize: 28,
        color: '#a6f000',
    },
    desireAttachRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    desireAttachBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(166,240,0,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(166,240,0,0.3)',
        borderRadius: 20,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    desireAttachText: {
        color: '#a6f000',
        fontSize: 13,
        fontWeight: '600',
    },
    desireAttachHint: {
        color: '#6B7280',
        fontSize: 12,
        marginLeft: 'auto' as any,
    },
    // Input row with send button (flex, not absolute)
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    textInputFlex: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 14,
        fontSize: 16,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sendBtnFixed: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#a6f000',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 5,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        position: 'relative',
    },
    textInput: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 16,
        paddingRight: 60,
        fontSize: 16,
        color: '#1F2937',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    sendButton: {
        position: 'absolute',
        right: 8,
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#a6f000',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    sendButtonDisabled: {
        backgroundColor: '#E5E7EB',
        shadowOpacity: 0,
        elevation: 0,
    },
    iconCircle: {
        width: 64,
        height: 64,
        backgroundColor: 'rgba(21, 128, 61, 0.1)',
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    exploreTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    exploreSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
    },
    pantryActions: {
        flexDirection: 'row',
        gap: 16,
        width: '100%',
        marginBottom: 24,
    },
    cameraButton: {
        flex: 1,
        height: 120,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: '#a6f000',
        borderStyle: 'dashed',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    cameraButtonText: {
        fontWeight: '700',
        color: '#1F2937',
    },
    manualInputBox: {
        flex: 1,
        height: 120,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 24,
        padding: 16,
        justifyContent: 'center',
    },
    miniInputRow: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        padding: 6,
        paddingLeft: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    miniInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
        height: 48,
    },
    miniAddBtn: {
        width: 40,
        height: 40,
        backgroundColor: 'black',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ingredientsBox: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    ingredientsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    ingCount: {
        fontWeight: '700',
        color: '#1F2937',
    },
    clearText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '700',
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    ingTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#F9FAFB',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    ingText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#4B5563',
    },
    generateBtn: {
        backgroundColor: '#a6f000',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    generateBtnText: {
        fontWeight: '800',
        color: 'black',
        fontSize: 16,
    },
    profileCard: {
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 32,
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 24,
    },
    profileImageContainer: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    profileName: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    profileGoal: {
        fontSize: 14,
        color: '#6B7280',
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    statsContainer: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 32,
    },
    statBox: {
        flex: 1,
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    statValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        textTransform: 'uppercase',
        fontWeight: '700',
    },
    logoutButton: {
        width: '100%',
        padding: 20,
        backgroundColor: '#FEF2F2',
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    logoutText: {
        color: '#EF4444',
        fontWeight: '700',
    },
    deleteAccountButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 12,
    },
    deleteAccountText: {
        color: '#9CA3AF',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    menuSection: {
        marginBottom: 24,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    menuIconBox: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuItemText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    // Planning Styles
    emptyState: {
        alignItems: 'center',
        padding: 32,
        backgroundColor: 'white',
        borderRadius: 32,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginTop: 24,
    },
    emptyIcon: {
        width: 80,
        height: 80,
        backgroundColor: 'rgba(166, 240, 0, 0.1)',
        borderRadius: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 8,
    },
    emptyDesc: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 20,
    },
    primaryBtn: {
        backgroundColor: '#a6f000',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 8,
    },
    primaryBtnText: {
        fontWeight: '800',
        color: 'black',
        fontSize: 16,
    },
    shoppingListBtn: {
        backgroundColor: 'black',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    shoppingListBtnText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 12,
    },
    daysRow: {
        gap: 8,
        paddingBottom: 24,
    },
    dayCard: {
        width: 64,
        height: 80,
        backgroundColor: 'white',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    dayCardActive: {
        backgroundColor: 'black',
        borderColor: 'black',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    dayName: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    dayNameActive: {
        color: '#a6f000',
    },
    subGreeting: {
        fontSize: 14,
        color: '#6B7280',
        marginTop: 2,
    },
    packCard: {
        height: 160,
        borderRadius: 24,
        marginBottom: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    packCardBackground: {
        width: '100%',
        height: '100%',
        position: 'absolute',
    },
    packCardOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        padding: 20,
    },
    packContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    packTextContainer: {
        flex: 1,
        marginRight: 16,
    },
    packTitleLight: {
        fontSize: 20,
        fontWeight: '800',
        color: 'white',
        marginBottom: 4,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    packSubtitleLight: {
        fontSize: 14,
        color: '#E5E7EB',
        fontWeight: '500',
    },
    packArrowLight: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#a6f000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayNumber: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
    },
    dayNumberActive: {
        color: 'white',
    },
    mealsList: {
        gap: 16,
        paddingBottom: 24,
    },
    mealCard: {
        flexDirection: 'row',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 16,
    },
    mealImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
    },
    mealInfo: {
        flex: 1,
        justifyContent: 'space-between',
        paddingVertical: 4,
    },
    mealHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    mealActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        padding: 6,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    timeSlotBadge: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
    },
    timeSlotText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    mealName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    mealMeta: {
        flexDirection: 'row',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
    },
    secondaryBtn: {
        alignItems: 'center',
        padding: 16,
    },
    secondaryBtnText: {
        color: '#9CA3AF',
        fontWeight: '700',
        fontSize: 14,
    },
    editProfileText: {
        color: '#a6f000',
        fontWeight: '700',
        fontSize: 16,
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    modalContent: {
        padding: 24,
        gap: 12,
    },
    shoppingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        gap: 16,
    },
    shoppingItemChecked: {
        opacity: 0.5,
        backgroundColor: '#F9FAFB',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: '#a6f000',
        borderColor: '#a6f000',
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
    },
    itemNameChecked: {
        textDecorationLine: 'line-through',
        color: '#9CA3AF',
    },
    itemCat: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    itemQty: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    // New Explore Styles
    exploreHeader: {
        marginBottom: 24,
    },
    pageSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        marginTop: 4,
    },
    modeSwitchContainer: {
        marginBottom: 24,
    },
    suggestionsContainer: {
        marginBottom: 32,
    },
    suggestionTag: {
        backgroundColor: 'white',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    suggestionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    scannerCard: {
        backgroundColor: 'white',
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#D1D5DB',
        marginBottom: 32,
        borderStyle: 'dashed',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 4,
    },
    scannerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    scannerTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
    },
    scannerDesc: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 24,
    },
    cameraButtonLarge: {
        backgroundColor: '#a6f000',
        paddingHorizontal: 32,
        paddingVertical: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 16,
        width: '100%',
        justifyContent: 'center',
    },
    cameraButtonTextLarge: {
        fontSize: 16,
        fontWeight: '800',
        color: 'black',
    },
    galleryLink: {
        padding: 8,
    },
    galleryLinkText: {
        fontSize: 14,
        color: '#6B7280',
        textDecorationLine: 'underline',
    },
    manualInputSection: {
        marginBottom: 24,
    },
    removeIngBtn: {
        padding: 4,
        backgroundColor: '#FEF2F2',
        borderRadius: 8,
    },
    seeMoreGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 250, // Covers the 4th card
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: 40,
    },
    seeMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
        gap: 8,
    },
    seeMoreText: {
        fontWeight: '700',
        color: '#000',
        fontSize: 14,
    },
    historyList: {
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    emptyHistoryText: {
        textAlign: 'center',
        color: '#9CA3AF',
        marginTop: 20,
        marginBottom: 20,
        fontStyle: 'italic',
    },
    analysisContainer: {
        marginTop: 24,
        gap: 24,
    },
    analysisScoreCard: {
        backgroundColor: '#111827',
        padding: 24,
        borderRadius: 24,
        alignItems: 'center',
    },
    analysisScoreLabel: {
        color: '#9CA3AF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    // Decision Killer
    decisionCard: {
        shadowColor: 'rgba(0,0,0,0.3)',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
    },
    decisionPlaceholder: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    decisionText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 24,
        lineHeight: 26,
    },
    decisionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#a6f000',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 16,
        gap: 8,
    },
    decisionButtonText: {
        fontSize: 14,
        fontWeight: '800',
        color: 'black',
    },
    decisionResult: {
        gap: 12,
    },
    decisionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    decisionTitle: {
        fontSize: 20,
        fontWeight: '900',
        color: '#111827',
    },
    decisionReason: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    decisionFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    decisionMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    decisionMetaText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#6B7280',
    },
    decisionAction: {
        backgroundColor: '#F3F4F6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    decisionActionText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#111827',
    },
    // Mapa Alimentar
    mapaHero: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#111827',
        padding: 24,
        borderRadius: 28,
        marginBottom: 32,
    },
    mapaHeroContent: {
        flex: 1,
    },
    mapaHeroTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: 'white',
        marginBottom: 4,
    },
    mapaHeroSubtitle: {
        fontSize: 14,
        color: '#9CA3AF',
    },
    mapaHeroIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: 'rgba(166, 240, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapaInputSection: {
        gap: 16,
    },
    mapaSectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 8,
    },
    mapaEmptyState: {
        padding: 32,
        backgroundColor: 'white',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        alignItems: 'center',
    },
    mapaEmptyText: {
        textAlign: 'center',
        color: '#6B7280',
        fontSize: 14,
        lineHeight: 20,
    },
    mapaMealsList: {
        gap: 12,
    },
    mapaMealItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    mapaMealInfo: {
        flex: 1,
    },
    mapaMealTime: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 2,
    },
    mapaMealName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    // Library Styles
    horizontalScroll: {
        paddingRight: 24,
        gap: 12,
        paddingBottom: 8,
    },
    listCardCompact: {
        width: 140,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    listIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    listCardName: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 2,
    },
    listCardCount: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    emptySmall: {
        backgroundColor: '#F9FAFB',
        padding: 24,
        borderRadius: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    emptySmallText: {
        color: '#9CA3AF',
        fontSize: 13,
        fontWeight: '600',
    },
    mapaMealVisualMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    mapaMealCal: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4B5563',
    },
    mapaActionRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    mapaAddBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        gap: 8,
    },
    mapaAddBtnText: {
        fontWeight: '800',
        fontSize: 15,
    },
    mapaAnalyzeBtn: {
        backgroundColor: '#a6f000',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 18,
        borderRadius: 20,
        gap: 10,
        marginTop: 12,
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 8,
    },
    mapaAnalyzeBtnText: {
        fontWeight: '900',
        color: 'black',
        fontSize: 16,
    },
    mapaResultOverlay: {
        gap: 24,
    },
    mapaScoreCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 24,
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 20,
    },
    mapaScoreCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#111827',
        alignItems: 'center',
        justifyContent: 'center',
    },
    mapaScoreValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#a6f000',
    },
    mapaScoreLabel: {
        fontSize: 10,
        color: 'white',
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    mapaScoreInfo: {
        flex: 1,
    },
    mapaScoreTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 4,
    },
    mapaScoreDesc: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
    },
    mapaSwapCard: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 16,
    },
    mapaSwapCompare: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    mapaSwapFrom: {
        flex: 1,
    },
    mapaSwapTo: {
        flex: 1,
        alignItems: 'flex-end',
    },
    mapaSwapLabel: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: '#6B7280',
        marginBottom: 4,
    },
    mapaSwapValue: {
        fontSize: 15,
        fontWeight: '800',
        color: '#111827',
    },
    mapaSwapReason: {
        backgroundColor: '#F9FAFB',
        padding: 12,
        borderRadius: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#a6f000',
    },
    mapaSwapReasonText: {
        fontSize: 13,
        color: '#4B5563',
        lineHeight: 18,
        fontWeight: '500',
    },
    mapaResetBtn: {
        alignItems: 'center',
        padding: 20,
        marginTop: 8,
    },
    mapaResetBtnText: {
        color: '#6B7280',
        fontWeight: '700',
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    primaryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#a6f000',
        paddingVertical: 16,
        borderRadius: 20,
        gap: 10,
        marginTop: 20,
    },
    primaryButtonText: {
        fontSize: 16,
        fontWeight: '800',
        color: 'black',
    },
    buttonDisabled: {
        opacity: 0.5,
        backgroundColor: '#D1D5DB',
    },
    // Habits Styles
    habitsSection: {
        backgroundColor: 'white',
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    habitsHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    habitsTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#111827',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    streakBadge: {
        backgroundColor: 'rgba(166, 240, 0, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    streakText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#65a30d',
    },
    habitsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    habitCard: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        padding: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    habitCardActive: {
        backgroundColor: 'rgba(166, 240, 0, 0.15)',
        borderColor: '#a6f000',
    },
    habitEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    habitLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
    },
    habitLabelActive: {
        color: '#15803d',
    },
    // ——— Taste Mini styles (Decision Killer card) ———
    tasteMiniRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        flexWrap: 'wrap' as const,
        gap: 6,
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        padding: 8,
        borderRadius: 12,
    },
    tasteMiniLabel: {
        fontSize: 11,
        color: '#9CA3AF',
        fontWeight: '600' as const,
    },
    tasteMiniChip: {
        backgroundColor: 'rgba(166, 240, 0, 0.1)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    tasteMiniChipText: {
        fontSize: 10,
        color: '#a6f000',
        fontWeight: '700' as const,
    },
    tasteEditLink: {
        fontSize: 12,
        marginLeft: 4,
    },
    tasteSetupRow: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 8,
        marginBottom: 20,
        backgroundColor: 'rgba(166, 240, 0, 0.05)',
        padding: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(166, 240, 0, 0.1)',
    },
    tasteSetupText: {
        fontSize: 13,
        fontWeight: '700' as const,
        color: '#a6f000',
    },

});
