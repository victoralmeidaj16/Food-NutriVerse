import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView, Dimensions, Animated, Alert, ActivityIndicator } from 'react-native';
import { CheckIcon, SparklesIcon, LockIcon } from '../components/Icons';
import { LinearGradient } from 'expo-linear-gradient';
import { iapService, PRODUCT_IDS } from '../services/iapService';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

export const PaywallScreen = ({ onPurchase, onRestore, onClose }: { onPurchase: () => void, onRestore: () => void, onClose: () => void }) => {
    const { t, language } = useLanguage();
    const [selectedPlan, setSelectedPlan] = useState<'YEARLY' | 'MONTHLY'>('YEARLY');
    const closeButtonOpacity = useRef(new Animated.Value(0)).current;
    const [loading, setLoading] = useState(false);
    const [productsLoaded, setProductsLoaded] = useState(false);

    // Benefits list - translated
    const benefits = language === 'en' ? [
        "Personalized weekly planning",
        "Unlimited AI recipes",
        "Pantry Scanner",
        "Cravings Transformation",
        "Smart shopping list",
        "No ads",
        "Immediate access to your plan"
    ] : [
        "Planejamento semanal personalizado",
        "Receitas ilimitadas com IA",
        "Scanner de Despensa",
        "Transformação de Desejos",
        "Lista de compras inteligente",
        "Sem anúncios",
        "Acesso imediato ao seu plano"
    ];

    useEffect(() => {
        // Fade in close button after 4 seconds
        const timer = setTimeout(() => {
            Animated.timing(closeButtonOpacity, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }).start();
        }, 4000);

        // Check if products are loaded
        const checkProducts = () => {
            const products = iapService.getAllProducts();
            if (products.length > 0) {
                setProductsLoaded(true);
            }
        };

        checkProducts();
        const interval = setInterval(checkProducts, 1000);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    const handlePurchase = async () => {
        setLoading(true);

        try {
            const productId = selectedPlan === 'YEARLY' ? PRODUCT_IDS.YEARLY : PRODUCT_IDS.MONTHLY;

            const result = await iapService.purchaseProduct(productId);

            if (result.success) {
                Alert.alert(
                    t('paywall.purchaseSuccess'),
                    t('paywall.welcomePro'),
                    [
                        {
                            text: t('common.ok'),
                            onPress: () => onPurchase()
                        }
                    ]
                );
            } else if (result.error && !result.error.includes('cancelada') && !result.error.includes('cancelled')) {
                Alert.alert(t('common.error'), result.error);
            }
        } catch (error) {
            console.error('Purchase error:', error);
            Alert.alert(t('common.error'), t('errors.purchaseFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setLoading(true);

        try {
            const result = await iapService.restorePurchases();

            if (result.success) {
                Alert.alert(
                    t('paywall.subscriptionRestored'),
                    t('paywall.welcomeBack'),
                    [
                        {
                            text: t('common.ok'),
                            onPress: () => onRestore()
                        }
                    ]
                );
            } else {
                Alert.alert(t('common.warning'), result.error || t('messages.noPreviousPurchases'));
            }
        } catch (error) {
            console.error('Restore error:', error);
            Alert.alert(t('common.error'), t('errors.restoreFailed'));
        } finally {
            setLoading(false);
        }
    };

    // Get formatted prices from IAP
    const yearlyPrice = productsLoaded ? iapService.formatPrice(PRODUCT_IDS.YEARLY) : (language === 'en' ? '$29.99' : 'R$ 79,90');
    const monthlyPrice = productsLoaded ? iapService.formatPrice(PRODUCT_IDS.MONTHLY) : (language === 'en' ? '$4.99' : 'R$ 19,90');

    const paywallTitle = language === 'en'
        ? "Eat well every day. Without thinking."
        : "Alimente-se bem todos os dias. Sem pensar.";

    const ctaText = language === 'en' ? "Start Now" : "Começar Agora";
    const restoreText = language === 'en' ? "Restore purchases" : "Restaurar compras";
    const continueText = language === 'en' ? "Continue with limited version" : "Continuar com versão limitada";
    const loadingText = language === 'en' ? "Loading payment options..." : "Carregando opções de pagamento...";
    const disclaimerText = language === 'en'
        ? "Subscription renews automatically. Cancel anytime in store settings."
        : "A assinatura é renovada automaticamente. Cancele a qualquer momento nas configurações da loja.";
    const bestChoiceText = language === 'en' ? "BEST CHOICE" : "MELHOR ESCOLHA";
    const saveText = language === 'en' ? "Save 70%" : "Economize 70%";
    const yearlyLabel = language === 'en' ? "Yearly" : "Anual";
    const monthlyLabel = language === 'en' ? "Monthly" : "Mensal";
    const perYear = language === 'en' ? "/year" : "/ano";
    const perMonth = language === 'en' ? "/month" : "/mês";
    const equivalentText = language === 'en' ? "Equivalent to $2.50/month" : "Equivalente a R$ 6,66/mês";

    return (
        <SafeAreaView style={styles.container}>
            <Animated.View style={[styles.closeButtonContainer, { opacity: closeButtonOpacity }]}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
            </Animated.View>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <View style={styles.iconContainer}>
                        <SparklesIcon size={40} color="#a6f000" />
                    </View>
                    <Text style={styles.title}>{paywallTitle}</Text>
                </View>

                <View style={styles.benefitsContainer}>
                    {benefits.map((benefit, index) => (
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
                                <Text style={styles.bestValueText}>{bestChoiceText}</Text>
                            </View>
                        )}
                        <View style={styles.planHeader}>
                            <Text style={styles.planTitle}>{yearlyLabel}</Text>
                            <Text style={styles.planSave}>{saveText}</Text>
                        </View>
                        <Text style={styles.planPrice}>{yearlyPrice}<Text style={styles.planPerMonth}>{perYear}</Text></Text>
                        <Text style={styles.planBilled}>{equivalentText}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => setSelectedPlan('MONTHLY')}
                        style={[styles.planCard, selectedPlan === 'MONTHLY' && styles.planCardSelected]}
                    >
                        <View style={styles.planHeader}>
                            <Text style={styles.planTitle}>{monthlyLabel}</Text>
                        </View>
                        <Text style={styles.planPrice}>{monthlyPrice}<Text style={styles.planPerMonth}>{perMonth}</Text></Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    onPress={handlePurchase}
                    style={[styles.ctaButton, loading && styles.ctaButtonDisabled]}
                    disabled={loading || !productsLoaded}
                >
                    {loading ? (
                        <ActivityIndicator color="black" />
                    ) : (
                        <Text style={styles.ctaText}>{ctaText}</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.footer}>
                    <TouchableOpacity onPress={handleRestore} disabled={loading}>
                        <Text style={styles.footerLink}>{restoreText}</Text>
                    </TouchableOpacity>
                    <Text style={styles.footerDivider}>•</Text>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.footerLink}>{continueText}</Text>
                    </TouchableOpacity>
                </View>

                {!productsLoaded && (
                    <View style={{ alignItems: 'center', marginTop: 12 }}>
                        <ActivityIndicator size="small" color="#6B7280" />
                        <Text style={{ fontSize: 12, color: '#9CA3AF', marginTop: 4 }}>
                            {loadingText}
                        </Text>
                    </View>
                )}

                <Text style={styles.disclaimer}>
                    {disclaimerText}
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF', // White background
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
        color: '#1F2937', // Dark text
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
        color: '#4B5563', // Dark gray text
        fontWeight: '500',
    },
    plansContainer: {
        gap: 16,
        marginBottom: 32,
    },
    planCard: {
        backgroundColor: '#F3F4F6', // Light gray card
        borderRadius: 16,
        padding: 20,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    planCardSelected: {
        borderColor: '#a6f000',
        backgroundColor: '#F9FAFB', // Slightly lighter when selected
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
        color: '#1F2937', // Dark text
    },
    planSave: {
        fontSize: 14,
        fontWeight: '700',
        color: '#65A30D', // Darker green for contrast on white
    },
    planPrice: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937', // Dark text
    },
    planPerMonth: {
        fontSize: 16,
        color: '#6B7280', // Gray text
        fontWeight: '500',
    },
    planBilled: {
        fontSize: 12,
        color: '#6B7280', // Gray text
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
    ctaButtonDisabled: {
        backgroundColor: '#E5E7EB',
        shadowOpacity: 0,
        elevation: 0,
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
        color: '#6B7280', // Gray text
        fontWeight: '600',
    },
    footerDivider: {
        color: '#9CA3AF',
    },
    disclaimer: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 16,
    },
    closeButtonContainer: {
        position: 'absolute',
        top: 60,
        right: 24,
        zIndex: 10,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#F3F4F6', // Light gray
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        color: '#4B5563',
        fontWeight: '600',
    },
});
