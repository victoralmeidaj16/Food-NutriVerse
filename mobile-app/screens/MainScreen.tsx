import React, { useState, useRef, useEffect } from 'react';
// ... imports

// ... MainScreen component ...


import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, Dimensions, ActivityIndicator, Alert, SafeAreaView, Modal, LayoutAnimation, Platform, UIManager, Animated, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { deleteUser } from 'firebase/auth';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile, Recipe, Tab, WeeklyPlan, ShoppingList, UserGoal, RECIPE_CATEGORIES } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import {
    HomeIcon, SearchIcon, CalendarIcon, UserIcon, CameraIcon,
    ChefHatIcon, SparklesIcon, ArrowRightIcon, PlusIcon, CheckIcon,
    CloseIcon, BookHeartIcon, ShoppingBagIcon, TrashIcon, TimerIcon, FlameIcon, CopyIcon, RefreshIcon, SettingsIcon,
    FileTextIcon, HelpCircleIcon, LockIcon
} from '../components/Icons';
import { MOCK_RECIPES } from '../services/mockData';
import { generateFitnessRecipe, identifyIngredientsFromImage, generateWeeklyPlan, generateShoppingList } from '../services/geminiService';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { LoadingModal } from '../components/LoadingModal';
import { PlanningWizard } from '../components/PlanningWizard';
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

export const MainScreen = ({
    user,
    userProfile,
    onRecipeClick,
    onLogout,
    savedRecipes,
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
    savedRecipes: Set<string>,
    onToggleSave: (r: Recipe) => void,
    onUpdateProfile: (p: UserProfile) => void,
    onShowPaywall: () => void,
    onOpenRecipePack: () => void,
    weeklyPlan: WeeklyPlan | null,
    setWeeklyPlan: (plan: WeeklyPlan | null) => void
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('HOME');
    const fabScale = useRef(new Animated.Value(1)).current;
    const fabRotate = useRef(new Animated.Value(0)).current;
    const fabRipple = useRef(new Animated.Value(0)).current;
    const [exploreMode, setExploreMode] = useState<'TEXT' | 'PANTRY'>('TEXT');
    const [dishInput, setDishInput] = useState('');
    const [pantryIngredients, setPantryIngredients] = useState<string[]>([]);
    const [manualIngredient, setManualIngredient] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingStatus, setLoadingStatus] = useState('');
    const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
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

    // Enable LayoutAnimation on Android
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }

    // Load Planning Data & History
    useEffect(() => {
        const loadData = async () => {
            // Plan is loaded in App.tsx
            const list = await storageService.loadShoppingList();
            if (list) setShoppingList(list);

            const history = await storageService.loadHistory();
            if (history.length > 0) {
                setGeneratedRecipes(history);
            }
        };
        loadData();
    }, []);

    // --- Handlers ---

    const changeTab = (tab: Tab) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setActiveTab(tab);
    };

    const changeExploreMode = (mode: 'TEXT' | 'PANTRY') => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExploreMode(mode);
    };

    const playSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('../assets/sounds/pop.mp3') // Assuming we will add this, or use a URI
            ).catch(() => ({ sound: null }));

            // Fallback to a remote URL if local file doesn't exist (for this demo)
            if (!sound) {
                const { sound: remoteSound } = await Audio.Sound.createAsync(
                    { uri: 'https://www.soundjay.com/buttons/sounds/button-09.mp3' }
                );
                await remoteSound.playAsync();
                return;
            }

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
            Alert.alert("Permissão necessária", "Precisamos de acesso à galeria para escanear ingredientes.");
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

            // Update Usage Stats
            const updatedProfile = SubscriptionService.incrementPantryScan(userProfile);
            onUpdateProfile(updatedProfile);
        }
    };
    const handleTakePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permissão necessária", "Precisamos de acesso à câmera.");
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
            });
            setPantryIngredients(prev => [...new Set([...prev, ...detected])]);
        } catch (error) {
            Alert.alert("Erro", "Não foi possível identificar os ingredientes.");
        } finally {
            setLoading(false);
        }
    };

    const handleAnalyzePantryImages = async (manualIngredients: string[]) => {
        console.log('🔍 handleAnalyzePantryImages started', { imagesCount: pantryImages.length, manualIngredients });
        setShowPantryPreview(false);

        setLoading(true);
        setLoadingMsg("Analisando despensa...");
        setLoadingStatus("Processando imagens...");
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
                });

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
                    "Nenhum ingrediente encontrado",
                    "Não foi possível identificar ingredientes na imagem. Tente uma foto mais clara com alimentos visíveis, ou adicione ingredientes manualmente.",
                    [{ text: "OK" }]
                );
                return;
            }

            // Auto-generate recipe with these ingredients
            setLoadingStatus("Criando receita com esses ingredientes...");
            setLoadingProgress(0.8);

            const recipe = await generateFitnessRecipe(
                uniqueIngredients,
                userProfile?.goal || ('WEIGHT_LOSS' as UserGoal),
                userProfile?.dietaryRestrictions || [],
                userProfile?.dislikes || [],
                (status, progress) => {
                    setLoadingStatus(status);
                    setLoadingProgress(0.8 + (progress * 0.2)); // 80-100%
                }
            );

            if (recipe) {
                console.log('🍽️ Recipe generated:', recipe.name);
                setGeneratedRecipes([recipe]);
                setActiveTab('EXPLORE');
                // Auto-open the recipe details
                setLoading(false);
                setTimeout(() => onRecipeClick(recipe), 300);
                return; // Don't hit the finally block setLoading(false) again
            } else {
                Alert.alert("Erro", "Não foi possível gerar a receita. Tente novamente.");
            }
        } catch (error: any) {
            console.error('❌ Pantry analysis error:', error);
            Alert.alert("Erro", `Não foi possível processar: ${error.message || 'Erro desconhecido'}`);
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

        // Update Usage Stats
        const updatedProfile = SubscriptionService.incrementSavedRecipes(userProfile);
        onUpdateProfile(updatedProfile);

        Alert.alert('Sucesso', 'Receita salva com sucesso!');
    };
    const handleGenerateRecipe = async () => {
        console.log('🔥 handleGenerateRecipe called!', { userProfile: !!userProfile, exploreMode, dishInput });

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
        const input = exploreMode === 'TEXT' ? dishInput : pantryIngredients;
        console.log('📝 Input:', input);

        if (exploreMode === 'TEXT' && !dishInput.trim()) {
            Alert.alert("Ops", "Digite o nome de um prato.");
            return;
        }
        if (exploreMode === 'PANTRY' && pantryIngredients.length === 0) {
            Alert.alert("Ops", "Adicione ingredientes primeiro.");
            return;
        }

        console.log('✅ Validation passed, starting generation...');
        setLoadingMsg(exploreMode === 'TEXT' ? "Fitzando receita..." : "Criando com o que você tem...");
        setLoadingStatus("Iniciando...");
        setLoadingProgress(0);
        setLoading(true);

        try {
            console.log('🚀 Calling generateFitnessRecipe...');
            const result = await generateFitnessRecipe(
                input,
                profile.goal,
                profile.dietaryRestrictions,
                profile.dislikes || [],
                (status, progress) => {
                    setLoadingStatus(status);
                    setLoadingProgress(progress);
                }
            );
            if (result) {
                setGeneratedRecipes(prev => {
                    const newList = [result, ...prev].slice(0, 20); // Keep last 20
                    storageService.saveHistory(newList);
                    return newList;
                });

                // Automatically save to user's library
                onToggleSave(result);

                onRecipeClick(result); // Open immediately
                setDishInput('');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
                Alert.alert("Erro", "Não foi possível gerar a receita. Tente novamente.");
            }
        } catch (e) {
            console.error('❌ Recipe generation error:', e);
            Alert.alert("Erro", "Falha na conexão com a IA.");
        } finally {
            setLoading(false);
        }
    };

    // --- Planning Handlers ---

    const handleGeneratePlan = async (preference: string, mealsCount: number, allowRepeats: boolean) => {
        if (!userProfile) return;
        setShowPlanningWizard(false);
        setLoading(true);
        setLoadingMsg("A IA está montando sua semana...");

        try {
            const plan = await generateWeeklyPlan(userProfile, preference, mealsCount, allowRepeats);
            if (plan) {
                setWeeklyPlan(plan);
                storageService.saveWeeklyPlan(plan); // Save
                setActivePlanningDay(0);
            } else {
                Alert.alert("Erro", "Não foi possível criar o plano. Tente novamente.");
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Erro", "Falha ao gerar plano.");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateShoppingList = async () => {
        if (!weeklyPlan) return;
        setLoading(true);
        setLoadingMsg("Calculando lista de compras...");
        try {
            const list = await generateShoppingList(weeklyPlan);
            if (list) {
                setShoppingList(list);
                storageService.saveShoppingList(list); // Save
                setShowShoppingList(true);
            }
        } catch (e) {
            Alert.alert("Erro", "Falha ao criar lista.");
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
        await storageService.saveWeeklyPlan(newPlan);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Sucesso", "Refeição copiada com sucesso!");
        setCopyMealModalVisible(false);
    };

    const handleRegenerateMeal = async (dayIndex: number, mealIndex: number) => {
        if (!weeklyPlan || !userProfile) return;

        const mealSlot = weeklyPlan.days[dayIndex].meals[mealIndex];

        Alert.alert(
            "Regenerar Refeição",
            `Deseja criar uma nova opção para ${mealSlot.timeSlot}?`,
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Sim, trocar",
                    onPress: async () => {
                        setRegeneratingMeal({ dayIndex, mealIndex });
                        try {
                            const newRecipe = await generateFitnessRecipe(
                                mealSlot.timeSlot,
                                userProfile.goal,
                                userProfile.dietaryRestrictions,
                                userProfile.dislikes || []
                            );

                            if (newRecipe) {
                                const newPlan = { ...weeklyPlan };
                                newPlan.days[dayIndex].meals[mealIndex].recipe = newRecipe;
                                setWeeklyPlan(newPlan);
                                await storageService.saveWeeklyPlan(newPlan);
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            } else {
                                Alert.alert("Erro", "Não foi possível gerar uma nova receita. Tente novamente.");
                            }
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Erro", "Falha ao regenerar receita.");
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
            "Excluir Conta",
            "Tem certeza? Essa ação é irreversível e apagará todos os seus dados.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        setLoading(true);
                        setLoadingMsg("Excluindo conta...");
                        try {
                            if (auth.currentUser) {
                                await deleteUserData(auth.currentUser.uid);
                                await deleteUser(auth.currentUser);
                                // Auth listener will handle navigation
                            }
                        } catch (error) {
                            console.error(error);
                            Alert.alert("Erro", "Falha ao excluir conta. Talvez seja necessário fazer login novamente.");
                        } finally {
                            setLoading(false);
                        }
                    }
                }
            ]
        );
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
                        <View style={styles.avatarPlaceholder}>
                            <UserIcon size={20} color="#6B7280" />
                        </View>
                        <View style={styles.notificationDot} />
                    </TouchableOpacity>
                </View>



                {/* Premium CTA */}
                <TouchableOpacity
                    onPress={() => { changeTab('EXPLORE'); changeExploreMode('TEXT'); }}
                    activeOpacity={0.95}
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
                                <Text style={styles.ctaTitle}>Fitzar Receita</Text>
                                <Text style={styles.ctaDesc}>Transforme qualquer prato em versão saudável.</Text>
                            </View>
                        </View>
                        <View style={styles.ctaArrow}>
                            <ArrowRightIcon size={20} color="#a6f000" />
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Recipe Pack Card */}
                <TouchableOpacity
                    style={styles.packCard}
                    onPress={onOpenRecipePack}
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
                                    {userProfile?.goal === UserGoal.LOSE_WEIGHT ? '5 Receitas para Perda de Peso' :
                                        userProfile?.goal === UserGoal.GAIN_MUSCLE ? '5 Receitas para Ganho de Massa' : '5 Receitas Saudáveis'}
                                </Text>
                                <Text style={styles.packSubtitleLight}>Selecionadas para seu objetivo</Text>
                            </View>
                            <View style={styles.packArrowLight}>
                                <ArrowRightIcon size={20} color="black" />
                            </View>
                        </View>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Categories */}
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Categorias</Text>
                </View>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.categoriesList}
                >
                    {RECIPE_CATEGORIES.map(cat => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCategory(isSelected ? null : cat.id)}
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
                        {selectedCategory ? `Receitas de ${RECIPE_CATEGORIES.find(c => c.id === selectedCategory)?.label}` : 'Destaques'}
                    </Text>
                    {selectedCategory && (
                        <TouchableOpacity onPress={() => setSelectedCategory(null)}>
                            <Text style={styles.clearFilter}>Limpar</Text>
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
                                <Text style={styles.seeMoreText}>Ver mais</Text>
                                <ArrowRightIcon size={16} color="#000" />
                            </TouchableOpacity>
                        </LinearGradient>
                    )}
                </View>
            </ScrollView>
        );
    };

    const renderExplore = () => (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.exploreHeader}>
                <Text style={styles.pageTitle}>Explorar</Text>
                <Text style={styles.pageSubtitle}>Descubra receitas ou use o que tem em casa.</Text>
            </View>

            {/* Mode Switch */}
            <View style={styles.modeSwitchContainer}>
                <View style={styles.modeSwitch}>
                    <TouchableOpacity
                        onPress={() => changeExploreMode('TEXT')}
                        style={[styles.modeButton, exploreMode === 'TEXT' && styles.modeButtonActive]}
                    >
                        <Text style={[styles.modeText, exploreMode === 'TEXT' && styles.modeTextActive]}>Desejo</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => changeExploreMode('PANTRY')}
                        style={[styles.modeButton, exploreMode === 'PANTRY' && styles.modeButtonActive]}
                    >
                        <Text style={[styles.modeText, exploreMode === 'PANTRY' && styles.modeTextActive]}>Despensa</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {exploreMode === 'TEXT' ? (
                <View style={styles.exploreContainer}>
                    <View style={styles.magicCard}>
                        <View style={styles.magicHeader}>
                            <SparklesIcon size={32} color="#a6f000" />
                            <Text style={styles.magicTitle}>Transformação Mágica</Text>
                        </View>
                        <Text style={styles.magicDesc}>
                            Digite o nome de qualquer prato "gordo" e a IA criará uma versão saudável e deliciosa para você.
                        </Text>

                        <View style={styles.inputWrapper}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Ex: Pizza, Lasanha, Brigadeiro..."
                                value={dishInput}
                                onChangeText={setDishInput}
                                placeholderTextColor="#9CA3AF"
                            />
                            <TouchableOpacity
                                onPress={handleGenerateRecipe}
                                disabled={!dishInput.trim()}
                                style={[styles.sendButton, !dishInput.trim() && styles.sendButtonDisabled]}
                            >
                                <ArrowRightIcon size={24} color={dishInput.trim() ? "#a6f000" : "#9CA3AF"} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={styles.suggestionsContainer}>
                        <Text style={styles.sectionTitle}>Sugestões Populares</Text>
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
                            <Text style={styles.scannerTitle}>Scanner de Despensa</Text>
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
                        <Text style={styles.sectionTitle}>Adicionar Manualmente</Text>
                        <View style={styles.miniInputRow}>
                            <TextInput
                                style={styles.miniInput}
                                placeholder="Ex: Frango, Batata Doce..."
                                value={manualIngredient}
                                onChangeText={setManualIngredient}
                                onSubmitEditing={addManualIngredient}
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
                            <TouchableOpacity onPress={handleGenerateRecipe} style={styles.generateBtn}>
                                <ChefHatIcon size={20} color="black" />
                                <Text style={styles.generateBtnText}>Criar Receita Agora</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );

    const handleDeletePlan = () => {
        Alert.alert(
            "Excluir Plano",
            "Tem certeza? Você terá que gerar um novo plano.",
            [
                { text: "Cancelar", style: "cancel" },
                {
                    text: "Excluir",
                    style: "destructive",
                    onPress: async () => {
                        setWeeklyPlan(null);
                        await storageService.saveWeeklyPlan(null);
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

                        {/* Loading Modal */}
                        <LoadingModal
                            visible={loading}
                            progress={loadingProgress}
                            status={loadingStatus || loadingMsg}
                        />

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
        const savedList = [...MOCK_RECIPES, ...generatedRecipes].filter(r => savedRecipes.has(r.id));

        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>Biblioteca</Text>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{savedRecipes.size}</Text>
                        <Text style={styles.statLabel}>Salvas</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{generatedRecipes.length}</Text>
                        <Text style={styles.statLabel}>Criadas</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>Receitas Salvas</Text>
                {savedList.length > 0 ? (
                    <View style={styles.recipesList}>
                        {savedList.map(recipe => (
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
                    <Text style={styles.sectionTitle}>Histórico</Text>
                </View>
                <View style={styles.historyList}>
                    {generatedRecipes.length > 0 ? (
                        generatedRecipes.map(recipe => (
                            <RecipeCard
                                key={recipe.id}
                                recipe={recipe}
                                onPress={() => onRecipeClick(recipe)}
                                compact={true}
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyHistoryText}>Nenhuma receita gerada ainda.</Text>
                    )}
                </View>
            </ScrollView>
        );
    };

    const renderProfile = () => {
        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>Perfil</Text>
                    <TouchableOpacity onPress={() => setShowEditProfile(true)}>
                        <Text style={styles.editProfileText}>Editar</Text>
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
                        {userProfile?.goal === UserGoal.LOSE_WEIGHT ? 'Queimar Gordura' :
                            userProfile?.goal === UserGoal.GAIN_MUSCLE ? 'Ganhar Massa' : 'Saudável'}
                    </Text>
                    <TouchableOpacity onPress={() => setShowEditProfile(true)} style={{ marginTop: 10 }}>
                        <Text style={{ color: '#a6f000', fontWeight: '600' }}>Editar Perfil</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.statsContainer}>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{userProfile?.dietaryRestrictions.length || 0}</Text>
                        <Text style={styles.statLabel}>Restrições</Text>
                    </View>
                    <View style={styles.statBox}>
                        <Text style={styles.statValue}>{userProfile?.dislikes.length || 0}</Text>
                        <Text style={styles.statLabel}>Não Gosta</Text>
                    </View>
                </View>

                <View style={styles.menuSection}>
                    <Text style={styles.menuTitle}>Suporte & Legal</Text>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Linking.openURL('https://victoralmeidaj16.github.io/Food-NutriVerse/support.html')}
                    >
                        <View style={styles.menuIconBox}>
                            <HelpCircleIcon size={20} color="#4B5563" />
                        </View>
                        <Text style={styles.menuItemText}>Fale Conosco</Text>
                        <ArrowRightIcon size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Linking.openURL('https://victoralmeidaj16.github.io/Food-NutriVerse/terms.html')}
                    >
                        <View style={styles.menuIconBox}>
                            <FileTextIcon size={20} color="#4B5563" />
                        </View>
                        <Text style={styles.menuItemText}>Termos de Uso</Text>
                        <ArrowRightIcon size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => Linking.openURL('https://victoralmeidaj16.github.io/Food-NutriVerse/privacy.html')}
                    >
                        <View style={styles.menuIconBox}>
                            <LockIcon size={20} color="#4B5563" />
                        </View>
                        <Text style={styles.menuItemText}>Política de Privacidade</Text>
                        <ArrowRightIcon size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.menuItem}
                        onPress={() => setShowSourcesScreen(true)}
                    >
                        <View style={[styles.menuIconBox, { backgroundColor: '#E0F2FE' }]}>
                            <FileTextIcon size={20} color="#0369A1" />
                        </View>
                        <Text style={styles.menuItemText}>Fontes e Referências</Text>
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
                    <Text style={styles.deleteAccountText}>Excluir minha conta</Text>
                </TouchableOpacity>
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {activeTab === 'HOME' && renderHome()}
                {activeTab === 'EXPLORE' && renderExplore()}
                {activeTab === 'LIBRARY' && renderLibrary()}
                {activeTab === 'PLANNING' && renderPlanning()}
                {activeTab === 'PROFILE' && renderProfile()}
            </View>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity onPress={() => changeTab('HOME')} style={styles.navItem}>
                    <HomeIcon size={24} color={activeTab === 'HOME' ? '#a6f000' : '#9CA3AF'} fill={activeTab === 'HOME' ? '#a6f000' : 'none'} />
                    <Text style={[styles.navLabel, activeTab === 'HOME' && styles.navLabelActive]}>Início</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeTab('LIBRARY')} style={styles.navItem}>
                    <BookHeartIcon size={24} color={activeTab === 'LIBRARY' ? '#a6f000' : '#9CA3AF'} />
                    <Text style={[styles.navLabel, activeTab === 'LIBRARY' && styles.navLabelActive]}>Biblioteca</Text>
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
                    <Text style={[styles.navLabel, activeTab === 'PLANNING' && styles.navLabelActive]}>Agenda</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => changeTab('PROFILE')} style={styles.navItem}>
                    <UserIcon size={24} color={activeTab === 'PROFILE' ? '#a6f000' : '#9CA3AF'} fill={activeTab === 'PROFILE' ? '#a6f000' : 'none'} />
                    <Text style={[styles.navLabel, activeTab === 'PROFILE' && styles.navLabelActive]}>Perfil</Text>
                </TouchableOpacity>
            </View>

            {loading && <LoadingOverlay message={loadingMsg} />}
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
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
        paddingBottom: 140, // Increased for floating nav
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
        padding: 28,
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
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
    },
    magicDesc: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 20,
        lineHeight: 20,
        textAlign: 'center',
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
});
