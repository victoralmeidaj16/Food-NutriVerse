
import React, { useState, useEffect } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, StyleSheet, Dimensions, StatusBar, Modal, SafeAreaView } from 'react-native';
import { Recipe } from '../types';
import { ArrowRightIcon, BookHeartIcon, TimerIcon, FlameIcon, ExchangeIcon, LightbulbIcon, CheckIcon, CloseIcon, ChefHatIcon } from '../components/Icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const RecipeDetailScreen = ({
    recipe,
    onClose,
    onSave,
    isSaved
}: {
    recipe: Recipe;
    onClose: () => void;
    onSave: (r: Recipe) => void;
    isSaved: boolean
}) => {
    const [cookingMode, setCookingMode] = useState(false);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                {/* Header Image */}
                <View style={styles.imageContainer}>
                    <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.8)']}
                        style={styles.gradient}
                    />

                    {/* Top Buttons */}
                    <View style={styles.topButtons}>
                        <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                            <ArrowRightIcon size={24} color="white" style={{ transform: [{ rotate: '180deg' }] }} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onSave(recipe)}
                            style={[styles.iconButton, isSaved && styles.savedButton]}
                        >
                            <BookHeartIcon size={24} color={isSaved ? "black" : "white"} fill={isSaved ? "black" : "none"} />
                        </TouchableOpacity>
                    </View>

                    {/* Title & Info */}
                    <View style={styles.headerInfo}>
                        <View style={styles.categoryTag}>
                            <Text style={styles.categoryText}>{recipe.category}</Text>
                        </View>
                        <Text style={styles.title}>{recipe.name}</Text>
                        <View style={styles.metaRow}>
                            <View style={styles.metaItem}>
                                <TimerIcon size={16} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.metaText}>{recipe.prepTime}</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <FlameIcon size={16} color="rgba(255,255,255,0.8)" />
                                <Text style={styles.metaText}>{recipe.macros.calories} kcal</Text>
                            </View>
                            <View style={styles.metaItem}>
                                <Text style={styles.metaText}>{recipe.difficulty}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Content Body */}
                <View style={styles.body}>

                    <Text style={styles.description}>{recipe.description}</Text>

                    {/* Macros Grid */}
                    <View style={styles.macrosGrid}>
                        {Object.entries(recipe.macros).map(([key, val]) => (
                            <View key={key} style={styles.macroCard}>
                                <Text style={styles.macroLabel}>
                                    {key === 'protein' ? 'Prot' : key === 'carbs' ? 'Carb' : key === 'fats' ? 'Gord' : 'Cal'}
                                </Text>
                                <Text style={styles.macroValue}>{val}</Text>
                                <Text style={styles.macroUnit}>{key === 'calories' ? '' : 'g'}</Text>
                            </View>
                        ))}
                    </View>

                    <Text style={styles.sectionTitle}>Ingredientes</Text>
                    <View style={styles.ingredientsList}>
                        {recipe.ingredients.map((ing, i) => (
                            <View key={i} style={styles.ingredientItem}>
                                <View style={styles.ingredientIcon}>
                                    <Text style={{ fontSize: 20 }}>{ing.icon}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.ingredientName}>{ing.name}</Text>
                                    <Text style={styles.ingredientQty}>{ing.quantity}</Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    {recipe.substitutions && recipe.substitutions.length > 0 && (
                        <View style={styles.fitSwap}>
                            <View style={styles.fitSwapHeader}>
                                <ExchangeIcon size={20} color="#15803d" />
                                <Text style={styles.fitSwapTitle}>FitSwap (Trocas)</Text>
                            </View>
                            {recipe.substitutions.map((sub, i) => (
                                <View key={i} style={styles.substitutionItem}>
                                    <View style={styles.subRow}>
                                        <Text style={styles.subOriginal}>{sub.original}</Text>
                                        <ArrowRightIcon size={14} color="#16a34a" />
                                        <Text style={styles.subReplacement}>{sub.replacement}</Text>
                                    </View>
                                    <Text style={styles.subReason}>"{sub.reason}"</Text>
                                </View>
                            ))}
                        </View>
                    )}

                    <Text style={[styles.sectionTitle, { marginTop: 32 }]}>Modo de Preparo</Text>
                    <View style={styles.instructionsList}>
                        {recipe.instructions.map((step, i) => (
                            <View key={i} style={styles.stepItem}>
                                <View style={styles.stepNumber}>
                                    <Text style={styles.stepNumberText}>{i + 1}</Text>
                                </View>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        ))}
                    </View>

                    <View style={styles.chefTip}>
                        <View style={styles.chefTipHeader}>
                            <LightbulbIcon size={20} color="#1e40af" />
                            <Text style={styles.chefTipTitle}>Dica do Chef</Text>
                        </View>
                        <Text style={styles.chefTipText}>{recipe.healthTips}</Text>
                    </View>

                    {/* Cooking Mode Entry Point */}
                    <View style={styles.cookingModeEntry}>
                        <TouchableOpacity
                            onPress={() => setCookingMode(true)}
                            style={styles.startCookingBtn}
                        >
                            <ChefHatIcon size={24} color="black" />
                            <Text style={styles.startCookingText}>Modo Cozinhar</Text>
                            <ArrowRightIcon size={24} color="black" />
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>

            {/* Cooking Mode Modal */}
            <Modal visible={cookingMode} animationType="slide" presentationStyle="fullScreen">
                <CookingMode recipe={recipe} onClose={() => setCookingMode(false)} />
            </Modal>
        </View>
    );
};

const CookingMode = ({ recipe, onClose }: { recipe: Recipe, onClose: () => void }) => {
    const [step, setStep] = useState(0); // 0 = Ingredients Check, 1+ = Instructions
    const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());

    const toggleIngredient = (index: number) => {
        const newSet = new Set(checkedIngredients);
        if (newSet.has(index)) {
            newSet.delete(index);
        } else {
            newSet.add(index);
        }
        setCheckedIngredients(newSet);
    };

    const selectAll = () => {
        const allIndices = recipe.ingredients.map((_, i) => i);
        setCheckedIngredients(new Set(allIndices));
    };

    useEffect(() => {
        if (step === 0 && checkedIngredients.size === recipe.ingredients.length && recipe.ingredients.length > 0) {
            // Auto advance after short delay
            const timer = setTimeout(() => {
                setStep(1);
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [checkedIngredients, step, recipe.ingredients.length]);

    const currentInstructionIndex = step - 1;
    const totalSteps = recipe.instructions.length;

    return (
        <SafeAreaView style={styles.cookingContainer}>
            {/* Header */}
            <View style={styles.cookingHeader}>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                    <CloseIcon size={24} color="#1F2937" />
                </TouchableOpacity>
                <View style={styles.progressBar}>
                    <View
                        style={[
                            styles.progressFill,
                            { width: `${(step / (totalSteps + 1)) * 100}%` }
                        ]}
                    />
                </View>
                <Text style={styles.stepIndicator}>
                    {step === 0 ? 'Prep' : `${step}/${totalSteps}`}
                </Text>
            </View>

            <View style={styles.cookingContent}>
                {step === 0 ? (
                    <View style={{ flex: 1 }}>
                        <View style={styles.checkHeader}>
                            <Text style={styles.cookingTitle}>Separe os ingredientes</Text>
                            <TouchableOpacity onPress={selectAll}>
                                <Text style={styles.selectAllText}>Marcar todos</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView contentContainerStyle={styles.checkList}>
                            {recipe.ingredients.map((ing, i) => {
                                const isChecked = checkedIngredients.has(i);
                                return (
                                    <TouchableOpacity
                                        key={i}
                                        onPress={() => toggleIngredient(i)}
                                        style={[styles.checkItem, isChecked && styles.checkItemActive]}
                                    >
                                        <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
                                            {isChecked && <CheckIcon size={16} color="white" />}
                                        </View>
                                        <Text style={[styles.checkName, isChecked && styles.checkNameActive]}>
                                            {ing.quantity} {ing.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>
                        <TouchableOpacity
                            onPress={() => setStep(1)}
                            style={[styles.nextBtn, checkedIngredients.size === 0 && styles.nextBtnDisabled]}
                            disabled={checkedIngredients.size === 0}
                        >
                            <Text style={styles.nextBtnText}>Começar Receita</Text>
                            <ArrowRightIcon size={20} color="black" />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={{ flex: 1, justifyContent: 'space-between' }}>
                        <View style={{ flex: 1, justifyContent: 'center' }}>
                            <Text style={styles.stepLabel}>PASSO {step}</Text>
                            <Text style={styles.instructionText}>
                                {recipe.instructions[currentInstructionIndex]}
                            </Text>
                        </View>

                        <View style={styles.navButtons}>
                            <TouchableOpacity
                                onPress={() => setStep(step - 1)}
                                style={styles.prevBtn}
                            >
                                <Text style={styles.prevBtnText}>Anterior</Text>
                            </TouchableOpacity>

                            {step < totalSteps ? (
                                <TouchableOpacity
                                    onPress={() => setStep(step + 1)}
                                    style={styles.nextBtn}
                                >
                                    <Text style={styles.nextBtnText}>Próximo Passo</Text>
                                    <ArrowRightIcon size={20} color="black" />
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={[styles.nextBtn, { backgroundColor: '#15803d' }]}
                                >
                                    <Text style={[styles.nextBtnText, { color: 'white' }]}>Concluir</Text>
                                    <CheckIcon size={20} color="white" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    imageContainer: {
        height: 300,
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        height: 200,
    },
    topButtons: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        zIndex: 10,
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        // backdropFilter: 'blur(10px)', 
    },
    savedButton: {
        backgroundColor: '#a6f000',
    },
    headerInfo: {
        position: 'absolute',
        bottom: 24,
        left: 24,
        right: 24,
    },
    categoryTag: {
        backgroundColor: '#a6f000',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 8,
    },
    categoryText: {
        color: 'black',
        fontWeight: '700',
        fontSize: 12,
        textTransform: 'uppercase',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
        marginBottom: 8,
        lineHeight: 32,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 16,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        fontWeight: '600',
    },
    body: {
        backgroundColor: '#FAFAFA',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginTop: -24,
        paddingTop: 32,
        paddingHorizontal: 24,
        minHeight: 500,
    },
    description: {
        fontSize: 16,
        color: '#4B5563',
        marginBottom: 24,
        lineHeight: 24,
    },
    macrosGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 32,
    },
    macroCard: {
        flex: 1,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    macroLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#9CA3AF',
        textTransform: 'uppercase',
        marginBottom: 4,
    },
    macroValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#1F2937',
    },
    macroUnit: {
        fontSize: 10,
        color: '#9CA3AF',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    ingredientsList: {
        gap: 12,
        marginBottom: 24,
    },
    ingredientItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: 'white',
        padding: 12,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    ingredientIcon: {
        width: 40,
        height: 40,
        backgroundColor: 'rgba(166, 240, 0, 0.1)',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ingredientName: {
        fontWeight: '700',
        color: '#1F2937',
        fontSize: 16,
    },
    ingredientQty: {
        color: '#6B7280',
        fontSize: 14,
    },
    fitSwap: {
        backgroundColor: '#f0fdf4',
        borderWidth: 1,
        borderColor: '#dcfce7',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    fitSwapHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    fitSwapTitle: {
        fontWeight: '700',
        color: '#166534',
        fontSize: 16,
    },
    substitutionItem: {
        marginBottom: 12,
    },
    subRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    subOriginal: {
        color: '#f87171',
        textDecorationLine: 'line-through',
        fontSize: 14,
    },
    subReplacement: {
        color: '#15803d',
        fontWeight: '700',
        fontSize: 14,
    },
    subReason: {
        color: '#16a34a',
        fontSize: 12,
        fontStyle: 'italic',
    },
    instructionsList: {
        gap: 24,
        marginBottom: 24,
    },
    stepItem: {
        flexDirection: 'row',
        gap: 16,
    },
    stepNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepNumberText: {
        color: 'white',
        fontWeight: '700',
    },
    stepText: {
        flex: 1,
        fontSize: 16,
        color: '#4B5563',
        lineHeight: 24,
    },
    chefTip: {
        backgroundColor: '#eff6ff',
        borderWidth: 1,
        borderColor: '#dbeafe',
        borderRadius: 16,
        padding: 20,
        marginTop: 8,
        marginBottom: 32,
    },
    chefTipHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    chefTipTitle: {
        fontWeight: '700',
        color: '#1e40af',
    },
    chefTipText: {
        color: '#1d4ed8',
        fontSize: 14,
        lineHeight: 20,
    },
    cookingModeEntry: {
        marginTop: 16,
        marginBottom: 40,
    },
    startCookingBtn: {
        backgroundColor: '#a6f000',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    startCookingText: {
        fontSize: 18,
        fontWeight: '800',
        color: 'black',
    },
    // Cooking Mode Styles
    cookingContainer: {
        flex: 1,
        backgroundColor: 'white',
    },
    cookingHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        gap: 16,
    },
    closeBtn: {
        padding: 8,
    },
    progressBar: {
        flex: 1,
        height: 4,
        backgroundColor: '#F3F4F6',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#a6f000',
    },
    stepIndicator: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1F2937',
        width: 40,
        textAlign: 'right',
    },
    cookingContent: {
        flex: 1,
        padding: 24,
    },
    checkHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    cookingTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
    },
    selectAllText: {
        color: '#a6f000',
        fontWeight: '700',
        fontSize: 14,
    },
    checkList: {
        gap: 12,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#FAFAFA',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        gap: 16,
    },
    checkItemActive: {
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxActive: {
        backgroundColor: '#16a34a',
        borderColor: '#16a34a',
    },
    checkName: {
        fontSize: 16,
        color: '#4B5563',
        fontWeight: '600',
    },
    checkNameActive: {
        color: '#15803d',
        textDecorationLine: 'line-through',
    },
    stepLabel: {
        fontSize: 14,
        fontWeight: '800',
        color: '#a6f000',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 16,
    },
    instructionText: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F2937',
        lineHeight: 36,
    },
    navButtons: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 32,
    },
    prevBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    prevBtnText: {
        fontWeight: '700',
        color: '#4B5563',
        fontSize: 16,
    },
    nextBtn: {
        flex: 2,
        height: 56,
        borderRadius: 16,
        backgroundColor: 'black',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        gap: 8,
    },
    nextBtnDisabled: {
        backgroundColor: '#E5E7EB',
    },
    nextBtnText: {
        fontWeight: '700',
        color: '#a6f000',
        fontSize: 16,
    },
});
