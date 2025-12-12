import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput } from 'react-native';
import { CameraIcon, PlusIcon, CheckIcon, CloseIcon } from './Icons';
import { LinearGradient } from 'expo-linear-gradient';

interface PantryImagePreviewProps {
    visible: boolean;
    images: string[];
    onAddMore: () => void;
    onAddManually: () => void;
    onAnalyze: (manualIngredients: string[]) => void;
    onClose: () => void;
    onRemoveImage?: (index: number) => void;
}

export const PantryImagePreview = ({
    visible,
    images,
    onAddMore,
    onAddManually,
    onAnalyze,
    onClose,
    onRemoveImage
}: PantryImagePreviewProps) => {
    const [showManualInput, setShowManualInput] = useState(false);
    const [manualIngredients, setManualIngredients] = useState<string[]>([]);
    const [currentInput, setCurrentInput] = useState('');

    const handleAddManual = () => {
        if (currentInput.trim()) {
            setManualIngredients(prev => [...prev, currentInput.trim()]);
            setCurrentInput('');
        }
    };

    const handleRemoveIngredient = (index: number) => {
        setManualIngredients(prev => prev.filter((_, i) => i !== index));
    };

    const handleAnalyze = () => {
        onAnalyze(manualIngredients);
        // Reset state
        setManualIngredients([]);
        setCurrentInput('');
        setShowManualInput(false);
    };

    const handleToggleManualInput = () => {
        setShowManualInput(!showManualInput);
        // Don't call onAddManually() - we want to stay on this page
    };

    const handleRemoveImage = (index: number) => {
        if (onRemoveImage) {
            onRemoveImage(index);
        }
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={false}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Fotos da Despensa</Text>
                    <Text style={styles.subtitle}>
                        {images.length} {images.length === 1 ? 'foto' : 'fotos'}
                        {manualIngredients.length > 0 && ` • ${manualIngredients.length} manual`}
                    </Text>
                </View>

                {/* Images Grid */}
                <ScrollView contentContainerStyle={styles.imagesContainer}>
                    {images.map((uri, index) => (
                        <View key={index} style={styles.imageWrapper}>
                            <Image
                                source={{ uri }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                            {/* Delete button */}
                            <TouchableOpacity
                                style={styles.deleteImageBtn}
                                onPress={() => handleRemoveImage(index)}
                            >
                                <CloseIcon size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        </View>
                    ))}
                </ScrollView>

                {/* Manual Ingredients Section */}
                {showManualInput && (
                    <View style={styles.manualSection}>
                        <Text style={styles.manualTitle}>Ingredientes Manuais</Text>

                        {/* Input Row */}
                        <View style={styles.inputRow}>
                            <TextInput
                                style={styles.input}
                                placeholder="Ex: Tomate, Cebola..."
                                value={currentInput}
                                onChangeText={setCurrentInput}
                                onSubmitEditing={handleAddManual}
                                returnKeyType="done"
                            />
                            <TouchableOpacity onPress={handleAddManual} style={styles.addBtn}>
                                <PlusIcon size={20} color="black" />
                            </TouchableOpacity>
                        </View>

                        {/* Manual Ingredients List */}
                        {manualIngredients.length > 0 && (
                            <View style={styles.tagsList}>
                                {manualIngredients.map((ingredient, index) => (
                                    <View key={index} style={styles.tag}>
                                        <Text style={styles.tagText}>{ingredient}</Text>
                                        <TouchableOpacity
                                            onPress={() => handleRemoveIngredient(index)}
                                            style={styles.removeBtn}
                                        >
                                            <CloseIcon size={14} color="#EF4444" />
                                        </TouchableOpacity>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                )}

                {/* Actions */}
                <View style={styles.actions}>
                    {/* Add More Photos */}
                    <TouchableOpacity
                        onPress={onAddMore}
                        style={styles.actionButton}
                    >
                        <View style={styles.iconCircle}>
                            <CameraIcon size={24} color="#a6f000" />
                        </View>
                        <Text style={styles.actionText}>Adicionar Mais</Text>
                    </TouchableOpacity>

                    {/* Add Manually */}
                    <TouchableOpacity
                        onPress={handleToggleManualInput}
                        style={[styles.actionButton, showManualInput && styles.actionButtonActive]}
                    >
                        <View style={styles.iconCircle}>
                            <PlusIcon size={24} color="#a6f000" />
                        </View>
                        <Text style={styles.actionText}>
                            {showManualInput ? 'Ocultar' : 'Adicionar Manual'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Analyze Button */}
                <TouchableOpacity
                    onPress={handleAnalyze}
                    style={styles.analyzeButtonContainer}
                >
                    <LinearGradient
                        colors={['#a6f000', '#8ACC00']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.analyzeButton}
                    >
                        <CheckIcon size={24} color="black" />
                        <Text style={styles.analyzeText}>Analisar Ingredientes</Text>
                    </LinearGradient>
                </TouchableOpacity>

                {/* Cancel */}
                <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
                    <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingTop: 60,
        paddingHorizontal: 24,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: '#6B7280',
    },
    imagesContainer: {
        padding: 16,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    imageWrapper: {
        width: '47%',
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    deleteImageBtn: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },
    actions: {
        flexDirection: 'row',
        paddingHorizontal: 24,
        gap: 16,
        marginTop: 8,
    },
    actionButton: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    actionButtonActive: {
        backgroundColor: 'rgba(166, 240, 0, 0.1)',
        borderColor: '#a6f000',
    },
    iconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(166, 240, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F2937',
    },
    manualSection: {
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: '#F9FAFB',
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
    },
    manualTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
    },
    inputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    addBtn: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#a6f000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    tagsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 12,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        paddingLeft: 12,
        paddingRight: 8,
        paddingVertical: 6,
        gap: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    tagText: {
        fontSize: 14,
        color: '#1F2937',
        fontWeight: '500',
    },
    removeBtn: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FEE2E2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    analyzeButtonContainer: {
        marginHorizontal: 24,
        marginTop: 24,
        marginBottom: 12,
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    analyzeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 8,
    },
    analyzeText: {
        fontSize: 18,
        fontWeight: '800',
        color: 'black',
    },
    cancelButton: {
        alignItems: 'center',
        paddingVertical: 16,
        marginBottom: 24,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
    },
});
