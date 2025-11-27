import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import { Recipe } from '../types';
import { TimerIcon, FlameIcon, BookHeartIcon } from './Icons';

const { width } = Dimensions.get('window');

export const RecipeCard = ({
    recipe,
    onPress,
    onSave,
    isSaved,
    userDislikes = []
}: {
    recipe: Recipe;
    onPress: () => void;
    onSave?: (r: Recipe) => void;
    isSaved?: boolean;
    userDislikes?: string[];
}) => {
    const hasConflict = userDislikes.some(dislike =>
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(dislike.toLowerCase()))
    );

    return (
        <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.95}>
            <View style={styles.imageContainer}>
                <Image
                    source={recipe.imageSource ? recipe.imageSource : { uri: recipe.imageUrl }}
                    style={styles.image}
                    onError={(e) => console.log('Error loading image:', recipe.name, e.nativeEvent.error)}
                />
                <View style={styles.overlay} />

                <View style={styles.topRow}>
                    <View style={styles.categoryBadge}>
                        <Text style={styles.categoryText}>{recipe.category}</Text>
                    </View>
                    {onSave && (
                        <TouchableOpacity onPress={() => onSave(recipe)} style={styles.saveBadge}>
                            <BookHeartIcon size={16} color={isSaved ? "#a6f000" : "white"} fill={isSaved ? "#a6f000" : "none"} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.bottomRow}>
                    <View style={styles.timeBadge}>
                        <TimerIcon size={12} color="white" />
                        <Text style={styles.timeText}>{recipe.prepTime}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <View style={styles.headerRow}>
                    <Text style={styles.title} numberOfLines={2}>{recipe.name}</Text>
                    {hasConflict && (
                        <View style={styles.warningBadge}>
                            <Text style={styles.warningText}>⚠️</Text>
                        </View>
                    )}
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <FlameIcon size={14} color="#F97316" />
                        <Text style={styles.metaText}>{recipe.macros.calories} kcal</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.metaItem}>
                        <View style={[styles.dot, { backgroundColor: getDifficultyColor(recipe.difficulty) }]} />
                        <Text style={styles.metaText}>{recipe.difficulty}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const getDifficultyColor = (diff: string) => {
    switch (diff) {
        case 'Fácil': return '#22C55E';
        case 'Médio': return '#EAB308';
        case 'Difícil': return '#EF4444';
        default: return '#22C55E';
    }
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12, // Increased from 0.08
        shadowRadius: 16,
        elevation: 6, // Increased from 4
        borderWidth: 1,
        borderColor: '#E5E7EB', // Stronger border
        overflow: 'hidden',
    },
    imageContainer: {
        height: 220,
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },
    topRow: {
        position: 'absolute',
        top: 16,
        left: 16,
        right: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    bottomRow: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        flexDirection: 'row',
    },
    categoryBadge: {
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    saveBadge: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timeBadge: {
        backgroundColor: 'rgba(0,0,0,0.75)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    content: {
        padding: 20,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
        gap: 12,
    },
    title: {
        flex: 1,
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
        lineHeight: 26,
        letterSpacing: -0.5,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#D97706',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    metaText: {
        fontSize: 13,
        color: '#6B7280',
        fontWeight: '600',
    },
    divider: {
        width: 1,
        height: 12,
        backgroundColor: '#E5E7EB',
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    warningBadge: {
        backgroundColor: '#FEF2F2',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#FECACA',
    },
    warningText: {
        fontSize: 12,
    },
});
