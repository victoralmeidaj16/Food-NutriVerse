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
    userDislikes = [],
    compact = false
}: {
    recipe: Recipe;
    onPress: () => void;
    onSave?: (r: Recipe) => void;
    isSaved?: boolean;
    userDislikes?: string[];
    compact?: boolean;
}) => {
    const hasConflict = userDislikes.some(dislike =>
        recipe.ingredients.some(ing => ing.name.toLowerCase().includes(dislike.toLowerCase()))
    );

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[styles.card, compact && styles.cardCompact]}
            activeOpacity={0.95}
        >
            <View style={[styles.imageContainer, compact && styles.imageContainerCompact]}>
                <Image
                    source={recipe.imageSource ? recipe.imageSource : { uri: recipe.imageUrl }}
                    style={styles.image}
                    onError={(e) => console.log('Error loading image:', recipe.name, e.nativeEvent.error)}
                />
                <View style={styles.overlay} />

                <View style={styles.topRow}>
                    <View style={[styles.categoryBadge, compact && styles.categoryBadgeCompact]}>
                        <Text style={[styles.categoryText, compact && styles.categoryTextCompact]}>{recipe.category}</Text>
                    </View>
                    {onSave && (
                        <TouchableOpacity onPress={() => onSave(recipe)} style={[styles.saveBadge, compact && styles.saveBadgeCompact]}>
                            <BookHeartIcon size={compact ? 12 : 16} color={isSaved ? "#a6f000" : "white"} fill={isSaved ? "#a6f000" : "none"} />
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.bottomRow}>
                    <View style={[styles.timeBadge, compact && styles.timeBadgeCompact]}>
                        <TimerIcon size={compact ? 10 : 12} color="white" />
                        <Text style={[styles.timeText, compact && styles.timeTextCompact]}>{recipe.prepTime}</Text>
                    </View>
                </View>
            </View>

            <View style={[styles.content, compact && styles.contentCompact]}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>{recipe.name}</Text>
                    {hasConflict && (
                        <View style={styles.warningBadge}>
                            <Text style={styles.warningText}>⚠️</Text>
                        </View>
                    )}
                </View>

                <View style={styles.metaRow}>
                    <View style={styles.metaItem}>
                        <FlameIcon size={compact ? 12 : 14} color="#F97316" />
                        <Text style={[styles.metaText, compact && styles.metaTextCompact]}>{recipe.macros.calories} kcal</Text>
                    </View>
                    {!compact && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.metaItem}>
                                <View style={[styles.dot, { backgroundColor: getDifficultyColor(recipe.difficulty) }]} />
                                <Text style={styles.metaText}>{recipe.difficulty}</Text>
                            </View>
                        </>
                    )}
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
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        overflow: 'hidden',
    },
    cardCompact: {
        borderRadius: 16,
        marginBottom: 12,
        shadowRadius: 8,
        elevation: 3,
    },
    imageContainer: {
        height: 220,
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    imageContainerCompact: {
        height: 120, // ~45% smaller
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
    categoryBadgeCompact: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#000',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    categoryTextCompact: {
        fontSize: 9,
    },
    saveBadge: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveBadgeCompact: {
        width: 28,
        height: 28,
        borderRadius: 14,
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
    timeBadgeCompact: {
        paddingHorizontal: 6,
        paddingVertical: 4,
        borderRadius: 6,
        gap: 4,
    },
    timeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: '700',
    },
    timeTextCompact: {
        fontSize: 9,
    },
    content: {
        padding: 20,
    },
    contentCompact: {
        padding: 12,
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
    titleCompact: {
        fontSize: 14,
        lineHeight: 18,
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
    metaTextCompact: {
        fontSize: 11,
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
