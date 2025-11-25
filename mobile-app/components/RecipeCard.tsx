
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Recipe } from '../types';
import { TimerIcon, FlameIcon } from './Icons';

const { width } = Dimensions.get('window');

export const RecipeCard = ({ recipe, onPress }: { recipe: Recipe; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.card} activeOpacity={0.95}>
        <View style={styles.imageContainer}>
            <Image source={{ uri: recipe.imageUrl }} style={styles.image} />
            <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{recipe.category}</Text>
            </View>
            <View style={styles.timeBadge}>
                <TimerIcon size={12} color="white" />
                <Text style={styles.timeText}>{recipe.prepTime}</Text>
            </View>
        </View>

        <View style={styles.content}>
            <Text style={styles.title} numberOfLines={2}>{recipe.name}</Text>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <FlameIcon size={14} color="#F97316" />
                    <Text style={styles.metaText}>{recipe.macros.calories} kcal</Text>
                </View>
                <View style={styles.metaItem}>
                    <View style={[styles.dot, { backgroundColor: '#22C55E' }]} />
                    <Text style={styles.metaText}>{recipe.difficulty}</Text>
                </View>
            </View>

            <View style={styles.tagsRow}>
                {recipe.tags.slice(0, 3).map(tag => (
                    <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                    </View>
                ))}
            </View>
        </View>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 24,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
        overflow: 'hidden',
    },
    imageContainer: {
        height: 192,
        backgroundColor: '#F3F4F6',
        position: 'relative',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    categoryBadge: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    categoryText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#000',
    },
    timeBadge: {
        position: 'absolute',
        bottom: 12,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    timeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
    },
    content: {
        padding: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 8,
        lineHeight: 24,
    },
    metaRow: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 12,
    },
    metaItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    metaText: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '500',
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#F3F4F6',
        borderRadius: 8,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#6B7280',
        textTransform: 'uppercase',
    },
});
