import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, SafeAreaView } from 'react-native';
import { Recipe, UserGoal } from '../types';
import { RECIPE_PACKS } from '../services/recipePacks';
import { ArrowLeftIcon, ClockIcon, FlameIcon, ChefHatIcon } from '../components/Icons';

export const RecipePackScreen = ({
    goal,
    onBack,
    onRecipeClick
}: {
    goal: UserGoal;
    onBack: () => void;
    onRecipeClick: (recipe: Recipe) => void;
}) => {
    const pack = RECIPE_PACKS[goal] || RECIPE_PACKS[UserGoal.EAT_HEALTHY];

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ArrowLeftIcon size={24} color="#1F2937" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Pack de Receitas</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroSection}>
                    <View style={styles.iconContainer}>
                        <Text style={{ fontSize: 40 }}>
                            {goal === UserGoal.LOSE_WEIGHT ? '🍏' :
                                goal === UserGoal.GAIN_MUSCLE ? '💪' : '🥑'}
                        </Text>
                    </View>
                    <Text style={styles.title}>{pack.title}</Text>
                    <Text style={styles.description}>{pack.description}</Text>
                </View>

                <View style={styles.listContainer}>
                    {pack.recipes.map((recipe, index) => (
                        <TouchableOpacity
                            key={recipe.id}
                            style={styles.recipeCard}
                            onPress={() => onRecipeClick(recipe)}
                        >
                            <View style={styles.recipeNumber}>
                                <Text style={styles.numberText}>{index + 1}</Text>
                            </View>
                            {recipe.imageSource && (
                                <Image source={recipe.imageSource} style={styles.recipeImage} />
                            )}
                            <View style={styles.recipeInfo}>
                                <Text style={styles.recipeName}>{recipe.name}</Text>
                                <View style={styles.metaRow}>
                                    <View style={styles.metaItem}>
                                        <ClockIcon size={14} color="#6B7280" />
                                        <Text style={styles.metaText}>{recipe.prepTime}</Text>
                                    </View>
                                    <View style={styles.metaItem}>
                                        <FlameIcon size={14} color="#6B7280" />
                                        <Text style={styles.metaText}>{recipe.macros.calories} kcal</Text>
                                    </View>
                                </View>
                            </View>
                            <View style={styles.arrowContainer}>
                                <Text style={{ fontSize: 20, color: '#a6f000' }}>→</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
        backgroundColor: 'white',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
    },
    content: {
        padding: 24,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    listContainer: {
        gap: 16,
    },
    recipeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    recipeNumber: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#a6f000',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    numberText: {
        fontWeight: '700',
        color: 'black',
    },
    recipeImage: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 16,
    },
    recipeInfo: {
        flex: 1,
    },
    recipeName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    metaRow: {
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
    arrowContainer: {
        paddingLeft: 16,
    }
});
