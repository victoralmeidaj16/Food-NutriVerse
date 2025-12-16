import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { CloseIcon, CheckIcon, CalendarIcon } from './Icons';
import { WeeklyPlan } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface CopyMealModalProps {
    visible: boolean;
    onClose: () => void;
    onCopy: (targetDayIndex: number, targetSlotIndex: number) => void;
    plan: WeeklyPlan;
}

export const CopyMealModal = ({ visible, onClose, onCopy, plan }: CopyMealModalProps) => {
    const [selectedDay, setSelectedDay] = useState<number | null>(null);
    const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
    const { language } = useLanguage();

    const handleConfirm = () => {
        if (selectedDay !== null && selectedSlot !== null) {
            onCopy(selectedDay, selectedSlot);
            onClose();
        }
    };

    return (
        <Modal animationType="slide" transparent={true} visible={visible} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{language === 'en' ? 'Copy to...' : 'Copiar para...'}</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <CloseIcon size={24} color="#1F2937" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.content}>
                        <Text style={styles.sectionTitle}>{language === 'en' ? 'Choose Day' : 'Escolha o Dia'}</Text>
                        <View style={styles.grid}>
                            {plan.days.map((day, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={[styles.optionBtn, selectedDay === index && styles.optionBtnSelected]}
                                    onPress={() => {
                                        setSelectedDay(index);
                                        setSelectedSlot(null); // Reset slot when day changes
                                    }}
                                >
                                    <Text style={[styles.optionText, selectedDay === index && styles.optionTextSelected]}>
                                        {day.dayName}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {selectedDay !== null && (
                            <>
                                <Text style={styles.sectionTitle}>{language === 'en' ? 'Choose Meal' : 'Escolha a Refeição'}</Text>
                                <View style={styles.list}>
                                    {plan.days[selectedDay].meals.map((meal, index) => (
                                        <TouchableOpacity
                                            key={index}
                                            style={[styles.slotBtn, selectedSlot === index && styles.slotBtnSelected]}
                                            onPress={() => setSelectedSlot(index)}
                                        >
                                            <Text style={[styles.slotText, selectedSlot === index && styles.slotTextSelected]}>
                                                {meal.timeSlot}
                                            </Text>
                                            {meal.recipe && (
                                                <Text style={styles.existingRecipeText} numberOfLines={1}>
                                                    ({language === 'en' ? 'Replace' : 'Substituir'}: {meal.recipe.name})
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}
                    </ScrollView>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.confirmBtn, (selectedDay === null || selectedSlot === null) && styles.confirmBtnDisabled]}
                            onPress={handleConfirm}
                            disabled={selectedDay === null || selectedSlot === null}
                        >
                            <Text style={styles.confirmBtnText}>{language === 'en' ? 'Confirm Copy' : 'Confirmar Cópia'}</Text>
                            <CheckIcon size={20} color={selectedDay === null || selectedSlot === null ? "#9CA3AF" : "black"} />
                        </TouchableOpacity>
                    </View>
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
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 24,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#1F2937',
    },
    closeBtn: {
        padding: 8,
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
    },
    content: {
        padding: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 12,
        marginTop: 12,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    optionBtn: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        minWidth: '30%',
        alignItems: 'center',
    },
    optionBtnSelected: {
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
    list: {
        gap: 8,
    },
    slotBtn: {
        padding: 16,
        borderRadius: 16,
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    slotBtnSelected: {
        borderColor: '#a6f000',
        backgroundColor: 'rgba(166, 240, 0, 0.1)',
    },
    slotText: {
        fontWeight: '700',
        color: '#1F2937',
        fontSize: 16,
    },
    slotTextSelected: {
        color: '#1F2937',
    },
    existingRecipeText: {
        fontSize: 12,
        color: '#6B7280',
        marginTop: 4,
    },
    footer: {
        padding: 24,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingBottom: 40,
    },
    confirmBtn: {
        backgroundColor: '#a6f000',
        height: 56,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    confirmBtnDisabled: {
        backgroundColor: '#F3F4F6',
    },
    confirmBtnText: {
        fontSize: 16,
        fontWeight: '800',
        color: 'black',
    },
});
