import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { CheckIcon, SparklesIcon, LockIcon } from '../components/Icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export const PaywallScreen = ({ onPurchase, onRestore, onClose }: { onPurchase: () => void, onRestore: () => void, onClose: () => void }) => {
    const [selectedPlan, setSelectedPlan] = useState<'YEARLY' | 'MONTHLY'>('YEARLY');

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <SparklesIcon size={40} color="#a6f000" />
                    </View>
                    <Text style={styles.title}>Alimente-se bem todos os dias. Sem pensar.</Text>
                </View>

                <View style={styles.benefitsContainer}>
                    {[
                        "Planejamento semanal personalizado",
                        "Receitas ilimitadas com IA",
                        "Scanner de Despensa",
                        "Transformação de Desejos",
                        "Lista de compras inteligente",
                        "Sem anúncios",
                        "Acesso imediato ao seu plano"
                    ].map((benefit, index) => (
                        <View key={index} style={styles.benefitRow}>
                            <View style={styles.checkCircle}>
                                <CheckIcon size={12} color="black" />
                            </View>
                            <Text style={styles.benefitText}>{benefit}</Text>
                        </View>
                    ))}
                </View>

                <View style={styles.plansContainer}>
                    <TouchableOpacity
                        onPress={() => setSelectedPlan('YEARLY')}
                        style={[styles.planCard, selectedPlan === 'YEARLY' && styles.planCardSelected]}
                    >
                        {selectedPlan === 'YEARLY' && (
                            <View style={styles.bestValueBadge}>
                                <Text style={styles.bestValueText}>MELHOR ESCOLHA</Text>
                            </View>
                        )}
                        <View style={styles.planHeader}>
                            <Text style={styles.planTitle}>Anual</Text>
                            <Text style={styles.planSave}>Economize 58%</Text>
                        </View>
                        <Text style={styles.planPrice}>R$ 19,90<Text style={styles.planPerMonth}>/mês</Text></Text>
                        <Text style={styles.planBilled}>Cobrado R$ 238,80 anualmente</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setSelectedPlan('MONTHLY')}
                        style={[styles.planCard, selectedPlan === 'MONTHLY' && styles.planCardSelected]}
                    >
                        <View style={styles.planHeader}>
                            <Text style={styles.planTitle}>Mensal</Text>
                        </View>
                        <Text style={styles.planPrice}>R$ 39,90<Text style={styles.planPerMonth}>/mês</Text></Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={onPurchase} style={styles.ctaButton}>
                    <Text style={styles.ctaText}>Começar Agora</Text>
                </TouchableOpacity>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={onRestore}>
                        <Text style={styles.footerLink}>Restaurar compras</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerDivider}>•</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.footerLink}>Continuar com versão limitada</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.disclaimer}>
                    A assinatura é renovada automaticamente. Cancele a qualquer momento nas configurações da loja.
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#111827', // Dark theme for high impact
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 20,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(166, 240, 0, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#a6f000',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: 'white',
        textAlign: 'center',
        lineHeight: 38,
    },
    benefitsContainer: {
        gap: 16,
        marginBottom: 40,
    },
    benefitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    checkCircle: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#a6f000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    benefitText: {
        fontSize: 16,
        color: '#E5E7EB',
        fontWeight: '500',
    },
    plansContainer: {
        gap: 16,
        marginBottom: 32,
    },
    planCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    planCardSelected: {
        borderColor: '#a6f000',
        backgroundColor: 'rgba(166, 240, 0, 0.05)',
    },
    bestValueBadge: {
        position: 'absolute',
        top: -12,
        right: 16,
        backgroundColor: '#a6f000',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    bestValueText: {
        fontSize: 10,
        fontWeight: '800',
        color: 'black',
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    planTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: 'white',
    },
    planSave: {
        fontSize: 14,
        fontWeight: '700',
        color: '#a6f000',
    },
    planPrice: {
        fontSize: 28,
        fontWeight: '800',
        color: 'white',
    },
    planPerMonth: {
        fontSize: 16,
        color: '#9CA3AF',
        fontWeight: '500',
    },
    planBilled: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 4,
    },
    ctaButton: {
        backgroundColor: '#a6f000',
        paddingVertical: 20,
        borderRadius: 20,
        alignItems: 'center',
        marginBottom: 24,
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    },
    ctaText: {
        fontSize: 18,
        fontWeight: '800',
        color: 'black',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 24,
    },
    footerLink: {
        fontSize: 12,
        color: '#9CA3AF',
        fontWeight: '600',
    },
    footerDivider: {
        color: '#4B5563',
    },
    disclaimer: {
        fontSize: 11,
        color: '#4B5563',
        textAlign: 'center',
        lineHeight: 16,
    },
});
