import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { SparklesIcon, CheckIcon, ArrowRightIcon, CalendarIcon } from './Icons';
import { LinearGradient } from 'expo-linear-gradient';

export const WeeklyPlanIntro = ({ onStart }: { onStart: () => void }) => {
    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
                <View style={styles.iconContainer}>
                    <CalendarIcon size={48} color="#a6f000" />
                </View>
                <Text style={styles.title}>Sua Semana, Organizada.</Text>
                <Text style={styles.subtitle}>
                    Deixe a IA planejar suas refeições com base nos seus objetivos e preferências.
                </Text>
            </View>

            <View style={styles.benefitsContainer}>
                <View style={styles.benefitCard}>
                    <View style={styles.benefitIcon}>
                        <SparklesIcon size={24} color="#a6f000" />
                    </View>
                    <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Personalizado para você</Text>
                        <Text style={styles.benefitDesc}>
                            Cardápios adaptados ao seu objetivo (perda de peso, ganho de massa, etc).
                        </Text>
                    </View>
                </View>

                <View style={styles.benefitCard}>
                    <View style={styles.benefitIcon}>
                        <CheckIcon size={24} color="#a6f000" />
                    </View>
                    <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Lista de Compras Automática</Text>
                        <Text style={styles.benefitDesc}>
                            Gere a lista de compras completa com um clique.
                        </Text>
                    </View>
                </View>

                <View style={styles.benefitCard}>
                    <View style={styles.benefitIcon}>
                        <CheckIcon size={24} color="#a6f000" />
                    </View>
                    <View style={styles.benefitContent}>
                        <Text style={styles.benefitTitle}>Economize Tempo</Text>
                        <Text style={styles.benefitDesc}>
                            Não perca mais tempo pensando no que comer.
                        </Text>
                    </View>
                </View>
            </View>

            <TouchableOpacity onPress={onStart} style={styles.ctaButton}>
                <Text style={styles.ctaText}>Gerar Plano Mágico</Text>
                <ArrowRightIcon size={20} color="black" />
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
                Você pode regenerar ou editar o plano a qualquer momento.
            </Text>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(166, 240, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#a6f000',
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 20,
    },
    benefitsContainer: {
        width: '100%',
        gap: 16,
        marginBottom: 40,
    },
    benefitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F9FAFB',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    benefitIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(166, 240, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    benefitContent: {
        flex: 1,
    },
    benefitTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    benefitDesc: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    ctaButton: {
        backgroundColor: '#a6f000',
        width: '100%',
        paddingVertical: 20,
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
        marginBottom: 16,
    },
    ctaText: {
        fontSize: 18,
        fontWeight: '800',
        color: 'black',
    },
    disclaimer: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});
