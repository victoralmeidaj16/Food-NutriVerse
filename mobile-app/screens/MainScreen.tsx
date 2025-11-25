
import React, { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Image, StyleSheet, Dimensions, ActivityIndicator, Alert, SafeAreaView, Modal } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile, Recipe, Tab, WeeklyPlan, ShoppingList, UserGoal, RECIPE_CATEGORIES } from '../types';
import { RecipeCard } from '../components/RecipeCard';
import {
    HomeIcon, SearchIcon, CalendarIcon, UserIcon, CameraIcon,
    ChefHatIcon, SparklesIcon, ArrowRightIcon, PlusIcon, CheckIcon,
    CloseIcon, BookHeartIcon, ShoppingBagIcon, TrashIcon, TimerIcon, FlameIcon, CopyIcon, RefreshIcon
} from '../components/Icons';
import { MOCK_RECIPES } from '../services/mockData';
import { generateFitnessRecipe, identifyIngredientsFromImage, generateWeeklyPlan, generateShoppingList } from '../services/geminiService';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { PlanningWizard } from '../components/PlanningWizard';

const { width } = Dimensions.get('window');

export const MainScreen = ({
    user,
    userProfile,
    onRecipeClick,
    onLogout
}: {
    user: { name: string } | null,
    userProfile: UserProfile | null,
    onRecipeClick: (r: Recipe) => void,
    onLogout: () => void
}) => {
    const [activeTab, setActiveTab] = useState<Tab>('HOME');
    const [exploreMode, setExploreMode] = useState<'TEXT' | 'PANTRY'>('TEXT');
    const [dishInput, setDishInput] = useState('');
    const [pantryIngredients, setPantryIngredients] = useState<string[]>([]);
    const [manualIngredient, setManualIngredient] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingMsg, setLoadingMsg] = useState('');
    const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    // Planning State
    const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan | null>(null);
    const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
    const [activePlanningDay, setActivePlanningDay] = useState(0);
    const [showPlanningWizard, setShowPlanningWizard] = useState(false);
    const [showShoppingList, setShowShoppingList] = useState(false);

    // --- Handlers ---

    const handlePickImage = async () => {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permissão necessária", "Precisamos de acesso à galeria para analisar sua despensa.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            analyzeImage(result.assets[0].base64);
        }
    };

    const handleTakePhoto = async () => {
        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

        if (permissionResult.granted === false) {
            Alert.alert("Permissão necessária", "Precisamos de acesso à câmera.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled && result.assets[0].base64) {
            analyzeImage(result.assets[0].base64);
        }
    };

    const analyzeImage = async (base64: string) => {
        setLoading(true);
        setLoadingMsg("Analisando despensa...");
        try {
            const detected = await identifyIngredientsFromImage(base64);
            setPantryIngredients(prev => [...new Set([...prev, ...detected])]);
        } catch (error) {
            Alert.alert("Erro", "Não foi possível identificar os ingredientes.");
        } finally {
            setLoading(false);
        }
    };

    const addManualIngredient = () => {
        if (manualIngredient.trim()) {
            setPantryIngredients(prev => [...prev, manualIngredient.trim()]);
            setManualIngredient('');
        }
    };

    const removeIngredient = (index: number) => {
        setPantryIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerateRecipe = async () => {
        if (!userProfile) return;

        const input = exploreMode === 'TEXT' ? dishInput : pantryIngredients;

        if (exploreMode === 'TEXT' && !dishInput.trim()) {
            Alert.alert("Ops", "Digite o nome de um prato.");
            return;
        }
        if (exploreMode === 'PANTRY' && pantryIngredients.length === 0) {
            Alert.alert("Ops", "Adicione ingredientes primeiro.");
            return;
        }

        setLoading(true);
        setLoadingMsg(exploreMode === 'TEXT' ? "Fitzando receita..." : "Criando com o que você tem...");

        try {
            const result = await generateFitnessRecipe(input, userProfile.goal, userProfile.dietaryRestrictions);
            if (result) {
                setGeneratedRecipes(prev => [result, ...prev]);
                onRecipeClick(result); // Open immediately
                setDishInput('');
            } else {
                Alert.alert("Erro", "Não foi possível gerar a receita. Tente novamente.");
            }
        } catch (e) {
            console.error(e);
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
                setShowShoppingList(true);
            }
        } catch (e) {
            Alert.alert("Erro", "Falha ao criar lista.");
        } finally {
            setLoading(false);
        }
    };

    const toggleShoppingItem = (id: string) => {
        if (!shoppingList) return;
        const updatedItems = shoppingList.items.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        );
        setShoppingList({ ...shoppingList, items: updatedItems });
    };

    // --- Render Content ---

    const renderHome = () => {
        const displayRecipes = selectedCategory
            ? [...generatedRecipes, ...MOCK_RECIPES].filter(r => r.category === selectedCategory)
            : [...generatedRecipes, ...MOCK_RECIPES];

        return (
            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <View>
                        <Text style={styles.greeting}>Olá, {userProfile?.name?.split(' ')[0] || 'Atleta'}</Text>
                        <Text style={styles.subGreeting}>O que vamos cozinhar hoje?</Text>
                    </View>
                    <TouchableOpacity onPress={() => setActiveTab('PROFILE')} style={styles.avatar}>
                        <UserIcon size={24} color="#6B7280" />
                    </TouchableOpacity>
                </View>

                {/* CTA */}
                <TouchableOpacity
                    onPress={() => { setActiveTab('EXPLORE'); setExploreMode('TEXT'); }}
                    style={styles.ctaCard}
                    activeOpacity={0.9}
                >
                    <View style={styles.ctaContent}>
                        <View style={styles.ctaIconBox}>
                            <SparklesIcon size={24} color="#a6f000" />
                        </View>
                        <Text style={styles.ctaTitle}>Fitzar Receita</Text>
                        <Text style={styles.ctaDesc}>Transforme qualquer prato em versão saudável.</Text>
                    </View>
                    <View style={styles.ctaArrow}>
                        <ArrowRightIcon size={24} color="black" />
                    </View>
                </TouchableOpacity>

                {/* Categories */}
                <Text style={styles.sectionTitle}>Categorias</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesList}>
                    {RECIPE_CATEGORIES.map(cat => {
                        const isSelected = selectedCategory === cat.id;
                        return (
                            <TouchableOpacity
                                key={cat.id}
                                onPress={() => setSelectedCategory(isSelected ? null : cat.id)}
                                style={[styles.categoryCard, isSelected && styles.categoryCardSelected]}
                            >
                                <Text style={{ fontSize: 24, marginBottom: 4 }}>{cat.icon}</Text>
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

                <View style={styles.recipesList}>
                    {displayRecipes.map(recipe => (
                        <RecipeCard
                            key={recipe.id}
                            recipe={recipe}
                            onPress={() => onRecipeClick(recipe)}
                        />
                    ))}
                </View>
            </ScrollView>
        );
    };

    const renderExplore = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.pageTitle}>Explorar</Text>

            {/* Mode Switch */}
            <View style={styles.modeSwitch}>
                <TouchableOpacity
                    onPress={() => setExploreMode('TEXT')}
                    style={[styles.modeButton, exploreMode === 'TEXT' && styles.modeButtonActive]}
                >
                    <Text style={[styles.modeText, exploreMode === 'TEXT' && styles.modeTextActive]}>Desejo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => setExploreMode('PANTRY')}
                    style={[styles.modeButton, exploreMode === 'PANTRY' && styles.modeButtonActive]}
                >
                    <Text style={[styles.modeText, exploreMode === 'PANTRY' && styles.modeTextActive]}>Despensa</Text>
                </TouchableOpacity>
            </View>

            {exploreMode === 'TEXT' ? (
                <View style={styles.exploreContainer}>
                    <View style={styles.iconCircle}>
                        <SparklesIcon size={32} color="#15803d" />
                    </View>
                    <Text style={styles.exploreTitle}>O que quer comer?</Text>
                    <Text style={styles.exploreSubtitle}>Digite qualquer prato e faremos a versão fit.</Text>

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
                            <ArrowRightIcon size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            ) : (
                <View style={styles.exploreContainer}>
                    <Text style={styles.exploreTitle}>Escaneie sua cozinha</Text>
                    <Text style={styles.exploreSubtitle}>Tire uma foto ou adicione ingredientes.</Text>

                    <View style={styles.pantryActions}>
                        <TouchableOpacity onPress={handleTakePhoto} style={styles.cameraButton}>
                            <CameraIcon size={32} color="black" />
                            <Text style={styles.cameraButtonText}>Câmera</Text>
                        </TouchableOpacity>

                        <View style={styles.manualInputBox}>
                            <View style={styles.miniInputRow}>
                                <TextInput
                                    style={styles.miniInput}
                                    placeholder="Add item..."
                                    value={manualIngredient}
                                    onChangeText={setManualIngredient}
                                    onSubmitEditing={addManualIngredient}
                                />
                                <TouchableOpacity onPress={addManualIngredient} style={styles.miniAddBtn}>
                                    <PlusIcon size={16} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {pantryIngredients.length > 0 && (
                        <View style={styles.ingredientsBox}>
                            <View style={styles.ingredientsHeader}>
                                <Text style={styles.ingCount}>{pantryIngredients.length} itens detectados</Text>
                                <TouchableOpacity onPress={() => setPantryIngredients([])}>
                                    <Text style={styles.clearText}>Limpar</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.tagsRow}>
                                {pantryIngredients.map((ing, i) => (
                                    <View key={i} style={styles.ingTag}>
                                        <Text style={styles.ingText}>{ing}</Text>
                                        <TouchableOpacity onPress={() => removeIngredient(i)}>
                                            <CloseIcon size={12} color="#9CA3AF" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                            <TouchableOpacity onPress={handleGenerateRecipe} style={styles.generateBtn}>
                                <ChefHatIcon size={20} color="black" />
                                <Text style={styles.generateBtnText}>Criar Receita</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            )}
        </ScrollView>
    );

    const renderPlanning = () => (
        <View style={styles.content}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.pageTitle}>Sua Semana</Text>
                    {weeklyPlan && (
                        <TouchableOpacity
                            onPress={handleCreateShoppingList}
                            style={styles.shoppingListBtn}
                        >
                            <ShoppingBagIcon size={16} color="#a6f000" />
                            <Text style={styles.shoppingListBtnText}>Lista</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {!weeklyPlan ? (
                    <View style={styles.emptyState}>
                        <View style={styles.emptyIcon}>
                            <CalendarIcon size={40} color="#a6f000" />
                        </View>
                        <Text style={styles.emptyTitle}>Semana não planejada</Text>
                        <Text style={styles.emptyDesc}>
                            Transforme sua alimentação com um clique. Economize tempo e coma melhor.
                        </Text>
                        <TouchableOpacity
                            onPress={() => setShowPlanningWizard(true)}
                            style={styles.primaryBtn}
                        >
                            <Text style={styles.primaryBtnText}>Gerar Plano Mágico</Text>
                        </TouchableOpacity>
                    </View>
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

                        {/* Meals List */}
                        <View style={styles.mealsList}>
                            {weeklyPlan.days[activePlanningDay].meals.map((meal, idx) => (
                                <TouchableOpacity
                                    key={meal.id}
                                    onPress={() => onRecipeClick(meal.recipe)}
                                    style={styles.mealCard}
                                >
                                    <Image source={{ uri: meal.recipe.imageUrl }} style={styles.mealImage} />
                                    <View style={styles.mealInfo}>
                                        <View style={styles.mealHeader}>
                                            <View style={styles.timeSlotBadge}>
                                                <Text style={styles.timeSlotText}>{meal.timeSlot}</Text>
                                            </View>
                                        </View>
                                        <Text numberOfLines={1} style={styles.mealName}>{meal.recipe.name}</Text>
                                        <View style={styles.mealMeta}>
                                            <View style={styles.metaItem}>
                                                <TimerIcon size={12} color="#6B7280" />
                                                <Text style={styles.metaText}>{meal.recipe.prepTime}</Text>
                                            </View>
                                            <View style={styles.metaItem}>
                                                <FlameIcon size={12} color="#FB923C" />
                                                <Text style={styles.metaText}>{meal.recipe.macros.calories} kcal</Text>
                                            </View>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity onPress={() => setShowPlanningWizard(true)} style={styles.secondaryBtn}>
                            <Text style={styles.secondaryBtnText}>Refazer semana inteira</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

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

    const renderProfile = () => (
        <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.pageTitle}>Perfil</Text>

            <View style={styles.profileCard}>
                <View style={styles.profileImageContainer}>
                    <UserIcon size={48} color="#D1D5DB" />
                </View>
                <Text style={styles.profileName}>{userProfile?.name}</Text>
                <Text style={styles.profileGoal}>
                    {userProfile?.goal === UserGoal.LOSE_WEIGHT ? 'Queimar Gordura' :
                        userProfile?.goal === UserGoal.GAIN_MUSCLE ? 'Ganhar Massa' : 'Saudável'}
                </Text>
            </View>

            <View style={styles.statsContainer}>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{userProfile?.dietaryRestrictions.length || 0}</Text>
                    <Text style={styles.statLabel}>Restrições</Text>
                </View>
                <View style={styles.statBox}>
                    <Text style={styles.statValue}>{generatedRecipes.length}</Text>
                    <Text style={styles.statLabel}>Receitas Criadas</Text>
                </View>
            </View>

            <TouchableOpacity onPress={onLogout} style={styles.logoutButton}>
                <Text style={styles.logoutText}>Sair da conta</Text>
            </TouchableOpacity>
        </ScrollView>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {activeTab === 'HOME' && renderHome()}
                {activeTab === 'EXPLORE' && renderExplore()}
                {activeTab === 'PLANNING' && renderPlanning()}
                {activeTab === 'PROFILE' && renderProfile()}
            </View>

            {/* Bottom Nav */}
            <View style={styles.bottomNav}>
                <TouchableOpacity onPress={() => setActiveTab('HOME')} style={styles.navItem}>
                    <HomeIcon size={24} color={activeTab === 'HOME' ? '#a6f000' : '#9CA3AF'} fill={activeTab === 'HOME' ? '#a6f000' : 'none'} />
                    <Text style={[styles.navLabel, activeTab === 'HOME' && styles.navLabelActive]}>Início</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveTab('EXPLORE')} style={styles.navItem}>
                    <SearchIcon size={24} color={activeTab === 'EXPLORE' ? '#a6f000' : '#9CA3AF'} />
                    <Text style={[styles.navLabel, activeTab === 'EXPLORE' && styles.navLabelActive]}>Explorar</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setActiveTab('EXPLORE'); setExploreMode('PANTRY'); }} style={styles.fabContainer}>
                    <View style={styles.fab}>
                        <CameraIcon size={24} color="#a6f000" />
                    </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveTab('PLANNING')} style={styles.navItem}>
                    <CalendarIcon size={24} color={activeTab === 'PLANNING' ? '#a6f000' : '#9CA3AF'} />
                    <Text style={[styles.navLabel, activeTab === 'PLANNING' && styles.navLabelActive]}>Agenda</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setActiveTab('PROFILE')} style={styles.navItem}>
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
        paddingBottom: 100,
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
        marginBottom: 24,
    },
    greeting: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
    },
    subGreeting: {
        fontSize: 14,
        color: '#6B7280',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'white',
    },
    ctaCard: {
        backgroundColor: 'black',
        borderRadius: 24,
        padding: 24,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 8,
    },
    ctaContent: {
        flex: 1,
        marginRight: 16,
    },
    ctaIconBox: {
        width: 48,
        height: 48,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    ctaTitle: {
        color: 'white',
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 4,
    },
    ctaDesc: {
        color: '#9CA3AF',
        fontSize: 12,
    },
    ctaArrow: {
        width: 40,
        height: 40,
        backgroundColor: '#a6f000',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 16,
    },
    categoriesList: {
        gap: 12,
        paddingBottom: 24,
    },
    categoryCard: {
        width: 80,
        height: 80,
        backgroundColor: 'white',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        marginRight: 12,
    },
    categoryCardSelected: {
        backgroundColor: 'black',
        borderColor: 'black',
    },
    categoryLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
    },
    categoryLabelSelected: {
        color: '#a6f000',
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
        paddingBottom: 24,
        paddingTop: 12,
        paddingHorizontal: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        justifyContent: 'space-between',
        alignItems: 'center',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
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
    inputWrapper: {
        width: '100%',
        position: 'relative',
    },
    textInput: {
        width: '100%',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 24,
        padding: 20,
        paddingRight: 60,
        fontSize: 16,
        color: '#1F2937',
    },
    sendButton: {
        position: 'absolute',
        right: 8,
        top: 8,
        bottom: 8,
        width: 48,
        backgroundColor: 'black',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    sendButtonDisabled: {
        backgroundColor: '#E5E7EB',
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
        flexDirection: 'row',
        gap: 8,
    },
    miniInput: {
        flex: 1,
        backgroundColor: '#F9FAFB',
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        fontSize: 12,
    },
    miniAddBtn: {
        width: 32,
        height: 32,
        backgroundColor: 'black',
        borderRadius: 8,
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
});
