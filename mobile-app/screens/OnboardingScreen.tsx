
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Dimensions, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager } from 'react-native';
import * as Haptics from 'expo-haptics';
import { UserProfile, UserGoal, ActivityLevel, AppUsageMode, RESTRICTION_OPTIONS } from '../types';
import { ArrowRightIcon } from '../components/Icons';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const OnboardingScreen = ({
    onComplete,
    onLogin
}: {
    onComplete: (profile: UserProfile) => void;
    onLogin: () => void
}) => {
    const [step, setStep] = useState(0);
    const [name, setName] = useState('');
    const [goal, setGoal] = useState<UserGoal>(UserGoal.LOSE_WEIGHT);
    const [activity, setActivity] = useState<ActivityLevel>(ActivityLevel.MEDIUM);
    const [restrictions, setRestrictions] = useState<string[]>([]);

    const totalSteps = 4;

    const handleNext = () => {
        if (step === 0 && !name.trim()) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

        if (step < totalSteps - 1) {
            setStep(step + 1);
        } else {
            // Complete
            const profile: UserProfile = {
                name: name || 'Atleta',
                goal,
                activityLevel: activity,
                mealsPerDay: 3, // Default
                mealSlots: ['Café da Manhã', 'Almoço', 'Jantar'],
                dietaryRestrictions: restrictions,
                dislikes: [],
                usageModes: [AppUsageMode.FIT_SWAP],
                profilePicture: undefined
            };
            onComplete(profile);
        }
    };

    const handleOptionSelect = (setter: any, value: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setter(value);
    };

    const toggleRestriction = (r: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (restrictions.includes(r)) {
            setRestrictions(restrictions.filter(i => i !== r));
        } else {
            setRestrictions([...restrictions, r]);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarTrack}>
                        <View style={[styles.progressBarFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
                    </View>
                </View>

                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
                    {step === 0 && (
                        <View style={styles.stepContainer}>
                            <View style={styles.logoCircle}>
                                <Text style={styles.logoEmoji}>👋</Text>
                            </View>
                            <Text style={styles.title}>Bem-vindo ao NutriVerse</Text>
                            <Text style={styles.subtitle}>Sua jornada para uma alimentação inteligente e sem esforço começa agora.</Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Como podemos te chamar?"
                                value={name}
                                onChangeText={setName}
                                placeholderTextColor="#9CA3AF"
                                autoFocus
                            />

                            <View style={styles.loginRow}>
                                <Text style={styles.loginText}>Já tem uma conta?</Text>
                                <TouchableOpacity onPress={onLogin}>
                                    <Text style={styles.loginLink}>Fazer Login</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {step === 1 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.title}>Qual seu objetivo principal?</Text>
                            <Text style={styles.subtitle}>Vamos personalizar tudo para você chegar lá.</Text>

                            <View style={styles.optionsList}>
                                {[
                                    { id: UserGoal.LOSE_WEIGHT, icon: '🔥', label: 'Queimar gordura', desc: 'Definição e perda de peso' },
                                    { id: UserGoal.GAIN_MUSCLE, icon: '💪', label: 'Ganhar massa', desc: 'Hipertrofia e força' },
                                    { id: UserGoal.EAT_HEALTHY, icon: '🥗', label: 'Comer melhor', desc: 'Reeducação alimentar' },
                                ].map((opt) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        onPress={() => handleOptionSelect(setGoal, opt.id)}
                                        style={[styles.optionCard, goal === opt.id && styles.optionCardSelected]}
                                    >
                                        <View style={styles.optionIcon}>
                                            <Text style={{ fontSize: 24 }}>{opt.icon}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.optionLabel}>{opt.label}</Text>
                                            <Text style={styles.optionDesc}>{opt.desc}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {step === 2 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.title}>Nível de Atividade</Text>
                            <Text style={styles.subtitle}>Para calcularmos suas calorias ideais.</Text>

                            <View style={styles.optionsList}>
                                {[
                                    { id: ActivityLevel.LOW, icon: '🪑', label: 'Leve', desc: 'Trabalho sentado, pouco exercício' },
                                    { id: ActivityLevel.MEDIUM, icon: '🚶', label: 'Moderado', desc: 'Caminhadas, exercícios 2-3x/sem' },
                                    { id: ActivityLevel.HIGH, icon: '⚡', label: 'Intenso', desc: 'Treinos diários ou trabalho físico' },
                                ].map((opt) => (
                                    <TouchableOpacity
                                        key={opt.id}
                                        onPress={() => handleOptionSelect(setActivity, opt.id)}
                                        style={[styles.optionCard, activity === opt.id && styles.optionCardSelected]}
                                    >
                                        <View style={styles.optionIcon}>
                                            <Text style={{ fontSize: 24 }}>{opt.icon}</Text>
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.optionLabel}>{opt.label}</Text>
                                            <Text style={styles.optionDesc}>{opt.desc}</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {step === 3 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.title}>Alguma restrição?</Text>
                            <Text style={styles.subtitle}>Seleciona o que você NÃO pode comer.</Text>

                            <View style={styles.tagsContainer}>
                                {RESTRICTION_OPTIONS.map((opt) => {
                                    const isSelected = restrictions.includes(opt);
                                    return (
                                        <TouchableOpacity
                                            key={opt}
                                            onPress={() => toggleRestriction(opt)}
                                            style={[styles.tag, isSelected && styles.tagSelected]}
                                        >
                                            <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>{opt}</Text>
                                        </TouchableOpacity>
                                    )
                                })}
                            </View>
                        </View>
                    )}
                </ScrollView>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.button, (step === 0 && !name.trim()) && styles.buttonDisabled]}
                        onPress={handleNext}
                        disabled={step === 0 && !name.trim()}
                    >
                        <Text style={[styles.buttonText, (step === 0 && !name.trim()) && styles.buttonTextDisabled]}>
                            {step === totalSteps - 1 ? 'Começar Jornada' : 'Continuar'}
                        </Text>
                        <ArrowRightIcon size={20} color={step === 0 && !name.trim() ? "#9CA3AF" : "black"} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    progressBarContainer: {
        paddingHorizontal: 24,
        paddingTop: 12,
        paddingBottom: 24,
    },
    progressBarTrack: {
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: '#a6f000',
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 24,
    },
    stepContainer: {
        flex: 1,
        alignItems: 'center',
        paddingTop: 20,
    },
    logoCircle: {
        width: 96,
        height: 96,
        borderRadius: 32,
        backgroundColor: '#a6f000',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 32,
        transform: [{ rotate: '3deg' }],
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
    },
    logoEmoji: {
        fontSize: 48,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#1F2937',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    input: {
        width: '100%',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 20,
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        color: '#1F2937',
        marginBottom: 32,
    },
    loginRow: {
        flexDirection: 'row',
        gap: 4,
    },
    loginText: {
        color: '#6B7280',
    },
    loginLink: {
        fontWeight: '700',
        color: 'black',
    },
    optionsList: {
        width: '100%',
        gap: 12,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    optionCardSelected: {
        borderColor: '#a6f000',
        backgroundColor: 'rgba(166, 240, 0, 0.05)',
    },
    optionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FAFAFA',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    optionLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    optionDesc: {
        fontSize: 14,
        color: '#6B7280',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    tag: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    tagSelected: {
        backgroundColor: 'black',
        borderColor: 'black',
    },
    tagText: {
        fontWeight: '700',
        color: '#6B7280',
    },
    tagTextSelected: {
        color: 'white',
    },
    footer: {
        padding: 24,
    },
    button: {
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
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '800',
        color: 'black',
    },
    buttonDisabled: {
        backgroundColor: '#F3F4F6',
        shadowOpacity: 0,
        elevation: 0,
    },
    buttonTextDisabled: {
        color: '#9CA3AF',
    },
});
