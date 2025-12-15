
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { ArrowRightIcon, CloseIcon } from './Icons';

export const PlanningWizard = ({
    onClose,
    onGenerate
}: {
    onClose: () => void;
    onGenerate: (pref: string, meals: number, repeats: boolean) => void
}) => {
    const [preference, setPreference] = useState('Variada e equilibrada');
    const [mealsCount, setMealsCount] = useState(3);
    const [allowRepeats, setAllowRepeats] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            await onGenerate(preference, mealsCount, allowRepeats);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Modal animationType="slide" transparent={true} visible={true}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Planejar Semana</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} disabled={isGenerating}>
                            <CloseIcon size={24} color="#1F2937" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.label}>Preferência de Cardápio</Text>
                        <View style={styles.optionsRow}>
                            {['Variada', 'Low Carb', 'Vegetariana', 'Econômica'].map(opt => (
                                <TouchableOpacity
                                    key={opt}
                                    onPress={() => setPreference(opt)}
                                    style={[styles.optionChip, preference === opt && styles.optionChipSelected]}
                                    disabled={isGenerating}
                                >
                                    <Text style={[styles.optionText, preference === opt && styles.optionTextSelected]}>{opt}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.label}>Refeições por dia</Text>
                        <View style={styles.counterRow}>
                            <TouchableOpacity
                                onPress={() => setMealsCount(Math.max(1, mealsCount - 1))}
                                style={styles.counterBtn}
                                disabled={isGenerating}
                            >
                                <Text style={styles.counterBtnText}>-</Text>
                            </TouchableOpacity>
                            <Text style={styles.counterValue}>{mealsCount}</Text>
                            <TouchableOpacity
                                onPress={() => setMealsCount(Math.min(6, mealsCount + 1))}
                                style={styles.counterBtn}
                                disabled={isGenerating}
                            >
                                <Text style={styles.counterBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.label}>Repetição de Pratos</Text>
                        <View style={styles.switchRow}>
                            <TouchableOpacity
                                onPress={() => setAllowRepeats(true)}
                                style={[styles.switchOption, allowRepeats && styles.switchActive]}
                                disabled={isGenerating}
                            >
                                <Text style={[styles.switchText, allowRepeats && styles.switchTextActive]}>Pode repetir</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setAllowRepeats(false)}
                                style={[styles.switchOption, !allowRepeats && styles.switchActive]}
                                disabled={isGenerating}
                            >
                                <Text style={[styles.switchText, !allowRepeats && styles.switchTextActive]}>Sempre diferente</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>

                    <TouchableOpacity
                        onPress={handleGenerate}
                        style={[styles.generateBtn, isGenerating && styles.generateBtnLoading]}
                        disabled={isGenerating}
                    >
                        {isGenerating ? (
                            <>
                                <ActivityIndicator size="small" color="black" />
                                <Text style={styles.generateBtnText}>Gerando...</Text>
                            </>
                        ) : (
                            <>
                                <Text style={styles.generateBtnText}>Gerar Plano Mágico</Text>
                                <ArrowRightIcon size={20} color="black" />
                            </>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        height: '70%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    content: {
        paddingBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        marginTop: 8,
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 24,
    },
    optionChip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    optionChipSelected: {
        backgroundColor: 'black',
        borderColor: 'black',
    },
    optionText: {
        fontWeight: '600',
        color: '#4B5563',
    },
    optionTextSelected: {
        color: 'white',
    },
    counterRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 24,
        marginBottom: 24,
    },
    counterBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    counterBtnText: {
        fontSize: 24,
        fontWeight: '600',
        color: '#1F2937',
    },
    counterValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#1F2937',
    },
    switchRow: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        padding: 4,
        borderRadius: 16,
        marginBottom: 24,
    },
    switchOption: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
    },
    switchActive: {
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    switchText: {
        fontWeight: '600',
        color: '#9CA3AF',
    },
    switchTextActive: {
        color: '#1F2937',
    },
    generateBtn: {
        backgroundColor: '#a6f000',
        height: 64,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
        marginBottom: 24,
    },
    generateBtnText: {
        fontSize: 18,
        fontWeight: '800',
        color: 'black',
    },
    generateBtnLoading: {
        opacity: 0.8,
    },
});
