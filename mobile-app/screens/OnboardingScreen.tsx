import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Dimensions, KeyboardAvoidingView, Platform, LayoutAnimation, UIManager, Image, Animated, Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { UserProfile, UserGoal, ActivityLevel, AppUsageMode, RESTRICTION_OPTIONS, SubscriptionPlan } from '../types';
import { ArrowRightIcon, CheckIcon, StarIcon, TimerIcon, FlameIcon } from '../components/Icons';
import { PaywallScreen } from './PaywallScreen';
import { useLanguage } from '../context/LanguageContext';

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
    const { t, language } = useLanguage();
    const [step, setStep] = useState(0);

    // Pain points - translated
    const PAIN_POINTS = language === 'en' ? [
        "I don't know what to cook.",
        "I start diets but can't stick to them.",
        "I have leftover ingredients.",
        "I spend too much time planning."
    ] : [
        "Não sei o que cozinhar no dia a dia.",
        "Começo dietas e não consigo seguir.",
        "Tenho ingredientes sobrando.",
        "Gasto tempo demais planejando."
    ];

    // Form State
    const [painPoints, setPainPoints] = useState<string[]>([]);
    const [goal, setGoal] = useState<UserGoal>(UserGoal.LOSE_WEIGHT);

    // Biometrics
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [age, setAge] = useState('');
    const [activity, setActivity] = useState<ActivityLevel>(ActivityLevel.MEDIUM);
    const [restrictions, setRestrictions] = useState<string[]>([]);
    const [showCustomRestriction, setShowCustomRestriction] = useState(false);
    const [customRestriction, setCustomRestriction] = useState('');

    // Routine
    const [mealsPerDay, setMealsPerDay] = useState(3);
    const [cookingTime, setCookingTime] = useState<'FAST' | 'ELABORATE'>('FAST');
    const [useMicrowave, setUseMicrowave] = useState(true);
    const [repeatMeals, setRepeatMeals] = useState(true);

    // Animation for Result
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const [showPlanPreview, setShowPlanPreview] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [loadingMessage, setLoadingMessage] = useState('');

    const totalSteps = 9; // 0 to 8 (Paywall is 8)

    const handleNext = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setStep(prev => prev + 1);
    };

    const handleFinish = () => {
        const profile: UserProfile = {
            name: 'Atleta', // Default, can be updated later
            goal,
            activityLevel: activity,
            mealsPerDay,
            mealSlots: mealsPerDay === 3 ? ['Café', 'Almoço', 'Jantar'] : ['Café', 'Almoço', 'Lanche', 'Jantar'],
            dietaryRestrictions: restrictions,
            dislikes: [],
            usageModes: [AppUsageMode.FIT_SWAP],
            height: Number(height),
            weight: Number(weight),
            age: Number(age),
            painPoints,
            routine: {
                cookingTime,
                useMicrowave,
                repeatMeals
            },
            plan: SubscriptionPlan.FREE,
            isPro: false,
            usageStats: {
                recipesGeneratedToday: 0,
                lastGenerationDate: new Date().toISOString(),
                desiresTransformedToday: 0,
                lastDesireDate: new Date().toISOString(),
                pantryScansThisWeek: 0,
                lastScanDate: new Date().toISOString(),
                savedRecipesCount: 0,
                weeklyPlansGeneratedThisWeek: 0,
                lastPlanGenerationDate: new Date().toISOString()
            }
        };
        onComplete(profile);
    };

    const toggleSelection = (list: string[], item: string, setter: (l: string[]) => void) => {
        if (list.includes(item)) {
            setter(list.filter(i => i !== item));
        } else {
            setter([...list, item]);
        }
    };

    // --- Steps Rendering ---

    const renderHero = () => (
        <View style={styles.centerStep}>
            <View style={styles.heroImagePlaceholder}>
                <Text style={{ fontSize: 60 }}>🥗</Text>
            </View>
            <Text style={styles.heroTitle}>{t('onboarding.heroTitle')}</Text>
            <Text style={styles.heroSubtitle}>
                {t('onboarding.heroSubtitle')}
            </Text>
            <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                <Text style={styles.primaryButtonText}>{t('common.start')}</Text>
                <ArrowRightIcon size={20} color="black" />
            </TouchableOpacity>
            <TouchableOpacity onPress={onLogin} style={{ marginTop: 20 }}>
                <Text style={styles.loginLink}>{t('onboarding.loginLink')}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderPainPoints = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.title}>{language === 'en' ? 'Which of these sounds like you?' : 'Qual dessas situações parece com você?'}</Text>
            <View style={styles.optionsList}>
                {PAIN_POINTS.map((point, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => toggleSelection(painPoints, point, setPainPoints)}
                        style={[styles.optionCard, painPoints.includes(point) && styles.optionCardSelected]}
                    >
                        <View style={[styles.checkbox, painPoints.includes(point) && styles.checkboxSelected]}>
                            {painPoints.includes(point) && <CheckIcon size={12} color="black" />}
                        </View>
                        <Text style={styles.optionText}>{point}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity
                style={[styles.primaryButton, painPoints.length === 0 && styles.buttonDisabled]}
                onPress={handleNext}
                disabled={painPoints.length === 0}
            >
                <Text style={styles.primaryButtonText}>{t('common.continue')}</Text>
            </TouchableOpacity>
        </View>
    );

    const renderGoal = () => {
        const goalOptions = language === 'en' ? [
            { id: UserGoal.LOSE_WEIGHT, icon: '🔥', label: 'Lose weight' },
            { id: UserGoal.GAIN_MUSCLE, icon: '💪', label: 'Build muscle' },
            { id: UserGoal.MAINTAIN, icon: '⚖️', label: 'Maintain weight' },
            { id: UserGoal.EAT_HEALTHY, icon: '🥗', label: 'Eat healthier' },
        ] : [
            { id: UserGoal.LOSE_WEIGHT, icon: '🔥', label: 'Perder peso' },
            { id: UserGoal.GAIN_MUSCLE, icon: '💪', label: 'Ganhar massa magra' },
            { id: UserGoal.MAINTAIN, icon: '⚖️', label: 'Manter peso' },
            { id: UserGoal.EAT_HEALTHY, icon: '🥗', label: 'Comer mais saudável' },
        ];

        return (
            <View style={styles.stepContainer}>
                <Text style={styles.title}>{language === 'en' ? 'What\'s your main goal?' : 'Qual seu objetivo principal?'}</Text>
                <View style={styles.optionsList}>
                    {goalOptions.map((opt) => (
                        <TouchableOpacity
                            key={opt.id}
                            onPress={() => { setGoal(opt.id); handleNext(); }}
                            style={[styles.optionCard, goal === opt.id && styles.optionCardSelected]}
                        >
                            <Text style={{ fontSize: 24, marginRight: 12 }}>{opt.icon}</Text>
                            <Text style={styles.optionText}>{opt.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const renderProfile = () => {
        const activityOptions = language === 'en' ? [
            { id: ActivityLevel.LOW, label: 'Sedentary' },
            { id: ActivityLevel.MEDIUM, label: 'Moderate' },
            { id: ActivityLevel.HIGH, label: 'Active' },
        ] : [
            { id: ActivityLevel.LOW, label: 'Sedentário' },
            { id: ActivityLevel.MEDIUM, label: 'Moderado' },
            { id: ActivityLevel.HIGH, label: 'Intenso' },
        ];

        return (
            <ScrollView contentContainerStyle={styles.scrollStepContainer} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>{language === 'en' ? 'Your Nutritional Profile' : 'Seu Perfil Nutricional'}</Text>
                <Text style={styles.subtitle}>{language === 'en' ? 'To calculate your ideal calories.' : 'Para calcularmos suas calorias exatas.'}</Text>

                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{language === 'en' ? 'Height (cm)' : 'Altura (cm)'}</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="175"
                        value={height}
                        onChangeText={setHeight}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{language === 'en' ? 'Weight (kg)' : 'Peso (kg)'}</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="70"
                        value={weight}
                        onChangeText={setWeight}
                    />
                </View>
                <View style={styles.inputGroup}>
                    <Text style={styles.label}>{language === 'en' ? 'Age' : 'Idade'}</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        placeholder="25"
                        value={age}
                        onChangeText={setAge}
                    />
                </View>

                <Text style={[styles.label, { marginTop: 16 }]}>{language === 'en' ? 'Activity Level' : 'Nível de Atividade'}</Text>
                <View style={styles.rowOptions}>
                    {activityOptions.map(opt => (
                        <TouchableOpacity
                            key={opt.id}
                            onPress={() => setActivity(opt.id)}
                            style={[styles.smallOption, activity === opt.id && styles.smallOptionSelected]}
                        >
                            <Text style={[styles.smallOptionText, activity === opt.id && styles.smallOptionTextSelected]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <TouchableOpacity
                    style={[styles.primaryButton, (!height || !weight || !age) && styles.buttonDisabled]}
                    onPress={handleNext}
                    disabled={!height || !weight || !age}
                >
                    <Text style={styles.primaryButtonText}>{t('common.continue')}</Text>
                </TouchableOpacity>
            </ScrollView>
        );

        const renderRestrictions = () => (
            <ScrollView contentContainerStyle={styles.scrollStepContainer} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Restrições Alimentares</Text>
                <Text style={styles.subtitle}>Selecione suas restrições ou preferências alimentares (opcional).</Text>

                <View style={styles.tagsContainer}>
                    {RESTRICTION_OPTIONS.map(opt => (
                        <TouchableOpacity
                            key={opt}
                            onPress={() => toggleSelection(restrictions, opt, setRestrictions)}
                            style={[styles.tag, restrictions.includes(opt) && styles.tagSelected]}
                        >
                            <Text style={[styles.tagText, restrictions.includes(opt) && styles.tagTextSelected]}>{opt}</Text>
                        </TouchableOpacity>
                    ))}
                    <TouchableOpacity
                        onPress={() => setShowCustomRestriction(!showCustomRestriction)}
                        style={[styles.tag, showCustomRestriction && styles.tagSelected]}
                    >
                        <Text style={[styles.tagText, showCustomRestriction && styles.tagTextSelected]}>Outros</Text>
                    </TouchableOpacity>
                </View>

                {showCustomRestriction && (
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Digite sua restrição personalizada</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Ex: Intolerância à lactose"
                            value={customRestriction}
                            onChangeText={setCustomRestriction}
                            onSubmitEditing={() => {
                                if (customRestriction.trim()) {
                                    setRestrictions([...restrictions, customRestriction.trim()]);
                                    setCustomRestriction('');
                                    setShowCustomRestriction(false);
                                }
                            }}
                        />
                        {customRestriction.trim() && (
                            <TouchableOpacity
                                style={[styles.primaryButton, { marginTop: 12 }]}
                                onPress={() => {
                                    setRestrictions([...restrictions, customRestriction.trim()]);
                                    setCustomRestriction('');
                                    setShowCustomRestriction(false);
                                }}
                            >
                                <Text style={styles.primaryButtonText}>Adicionar</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleNext}
                >
                    <Text style={styles.primaryButtonText}>Continuar</Text>
                </TouchableOpacity>
            </ScrollView>
        );

        const renderRoutine = () => (
            <ScrollView contentContainerStyle={styles.scrollStepContainer} keyboardShouldPersistTaps="handled">
                <Text style={styles.title}>Rotina e Preferências</Text>

                <Text style={styles.label}>Refeições por dia</Text>
                <View style={styles.rowOptions}>
                    {[3, 4, 5, 6].map(num => (
                        <TouchableOpacity
                            key={num}
                            onPress={() => setMealsPerDay(num)}
                            style={[styles.circleOption, mealsPerDay === num && styles.circleOptionSelected]}
                        >
                            <Text style={[styles.circleText, mealsPerDay === num && styles.circleTextSelected]}>{num}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { marginTop: 24 }]}>Tempo para cozinhar</Text>
                <View style={styles.optionsList}>
                    <TouchableOpacity
                        onPress={() => setCookingTime('FAST')}
                        style={[styles.optionCard, cookingTime === 'FAST' && styles.optionCardSelected]}
                    >
                        <Text style={{ fontSize: 20, marginRight: 12 }}>⚡</Text>
                        <Text style={styles.optionText}>Rápidas (até 20min)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => setCookingTime('ELABORATE')}
                        style={[styles.optionCard, cookingTime === 'ELABORATE' && styles.optionCardSelected]}
                    >
                        <Text style={{ fontSize: 20, marginRight: 12 }}>👨‍🍳</Text>
                        <Text style={styles.optionText}>Elaboradas</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>Usa micro-ondas?</Text>
                    <TouchableOpacity
                        onPress={() => setUseMicrowave(!useMicrowave)}
                        style={[styles.switch, useMicrowave && styles.switchActive]}
                    >
                        <View style={[styles.switchThumb, useMicrowave && styles.switchThumbActive]} />
                    </TouchableOpacity>
                </View>

                <View style={styles.switchRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.switchLabel}>Repetir receitas na semana?</Text>
                        <Text style={styles.switchDescription}>Facilita o preparo de marmitas para a semana</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setRepeatMeals(!repeatMeals)}
                        style={[styles.switch, repeatMeals && styles.switchActive]}
                    >
                        <View style={[styles.switchThumb, repeatMeals && styles.switchThumbActive]} />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                    <Text style={styles.primaryButtonText}>Gerar meu plano</Text>
                </TouchableOpacity>
            </ScrollView>
        );

        useEffect(() => {
            if (step === 6) {
                // Reset states
                setLoadingProgress(0);
                setShowPlanPreview(false);

                const loadingSteps = [
                    { progress: 15, message: 'Analisando seu perfil nutricional...', delay: 0 },
                    { progress: 35, message: `Calculando suas calorias ideais (${height}cm, ${weight}kg)...`, delay: 800 },
                    { progress: 55, message: `Buscando receitas para ${mealsPerDay} refeições/dia...`, delay: 1600 },
                    { progress: 75, message: restrictions.length > 0 ? `Filtrando por: ${restrictions.slice(0, 2).join(', ')}...` : 'Selecionando ingredientes frescos...', delay: 2400 },
                    { progress: 90, message: cookingTime === 'FAST' ? 'Priorizando receitas rápidas...' : 'Incluindo receitas elaboradas...', delay: 3400 },
                    { progress: 100, message: 'Finalizando seu plano personalizado!', delay: 4600 }
                ];

                loadingSteps.forEach(({ progress, message, delay }) => {
                    setTimeout(() => {
                        setLoadingProgress(progress);
                        setLoadingMessage(message);
                    }, delay);
                });

                setTimeout(() => {
                    setShowPlanPreview(true);
                    Animated.timing(fadeAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true
                    }).start();
                }, 5500);
            }
        }, [step, height, weight, mealsPerDay, restrictions, cookingTime]);

        const renderResult = () => {
            if (!showPlanPreview) {
                return (
                    <View style={styles.centerStep}>
                        <Text style={{ fontSize: 60, marginBottom: 20 }}>🥕</Text>
                        <Text style={styles.title}>Criando sua estratégia...</Text>
                        <Text style={styles.subtitle}>A IA está personalizando tudo para você.</Text>

                        <View style={styles.progressContainer}>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${loadingProgress}%` }]} />
                            </View>
                            <Text style={styles.progressText}>{loadingProgress}%</Text>
                        </View>

                        {loadingMessage ? (
                            <Text style={styles.loadingMessage}>{loadingMessage}</Text>
                        ) : null}
                    </View>
                );
            }

            // Calculate personalized calories based on user data
            const calculateCalories = () => {
                const weightNum = Number(weight) || 70;
                const heightNum = Number(height) || 170;
                const ageNum = Number(age) || 25;

                // BMR calculation (Mifflin-St Jeor)
                let bmr = (10 * weightNum) + (6.25 * heightNum) - (5 * ageNum) + 5;

                // Activity multiplier
                const activityMultiplier = {
                    [ActivityLevel.LOW]: 1.2,
                    [ActivityLevel.MEDIUM]: 1.55,
                    [ActivityLevel.HIGH]: 1.9
                }[activity] || 1.55;

                let tdee = bmr * activityMultiplier;

                // Adjust for goal
                if (goal === UserGoal.LOSE_WEIGHT) tdee -= 500;
                else if (goal === UserGoal.GAIN_MUSCLE) tdee += 300;

                return Math.round(tdee / 100) * 100; // Round to nearest 100
            };

            // Get personalized meals based on goal and preferences
            const getMealSuggestions = () => {
                const isVegetarian = restrictions.includes('Vegetariano');
                const isVegan = restrictions.includes('Vegano');
                const isFast = cookingTime === 'FAST';

                const breakfastOptions = {
                    [UserGoal.LOSE_WEIGHT]: isFast ? 'Omelete Proteico Light' : 'Panqueca de Aveia com Frutas',
                    [UserGoal.GAIN_MUSCLE]: isFast ? 'Ovos Mexidos com Abacate' : 'Tapioca Recheada Proteica',
                    [UserGoal.MAINTAIN]: isFast ? 'Iogurte com Granola' : 'Pão Integral com Pasta de Amendoim',
                    [UserGoal.EAT_HEALTHY]: isFast ? 'Smoothie Bowl Verde' : 'Overnight Oats de Frutas Vermelhas'
                };

                const lunchOptions = {
                    [UserGoal.LOSE_WEIGHT]: isVegetarian ? 'Salada Completa com Grão-de-Bico' : (isFast ? 'Frango Grelhado e Legumes' : 'Peixe Assado com Quinoa'),
                    [UserGoal.GAIN_MUSCLE]: isVegetarian ? 'Buddha Bowl Proteico' : (isFast ? 'Filé com Batata Doce' : 'Carne Moída com Arroz Integral'),
                    [UserGoal.MAINTAIN]: isVegetarian ? 'Wrap de Hummus' : (isFast ? 'Strogonoff Fitness' : 'Risoto de Frango'),
                    [UserGoal.EAT_HEALTHY]: isVegetarian ? 'Bowl Mediterrâneo' : (isFast ? 'Salmão com Brócolis' : 'Frango Curry com Legumes')
                };

                const dinnerOptions = {
                    [UserGoal.LOSE_WEIGHT]: isFast ? 'Sopa Detox' : 'Omelete de Claras com Salada',
                    [UserGoal.GAIN_MUSCLE]: isFast ? 'Wrap de Frango' : 'Carne com Legumes Assados',
                    [UserGoal.MAINTAIN]: isFast ? 'Sanduiche Natural' : 'Macarrão Integral ao Molho',
                    [UserGoal.EAT_HEALTHY]: isFast ? 'Salada Caesar' : 'Poke Bowl de Atum'
                };

                if (isVegan) {
                    return [
                        'Smoothie de Banana com Aveia',
                        'Tofu Grelhado com Quinoa',
                        'Hamburguer de Grão-de-Bico'
                    ];
                }

                return [
                    breakfastOptions[goal] || breakfastOptions[UserGoal.EAT_HEALTHY],
                    lunchOptions[goal] || lunchOptions[UserGoal.EAT_HEALTHY],
                    dinnerOptions[goal] || dinnerOptions[UserGoal.EAT_HEALTHY]
                ];
            };

            const calories = calculateCalories();
            const meals = getMealSuggestions();
            const goalText = {
                [UserGoal.LOSE_WEIGHT]: 'perder peso',
                [UserGoal.GAIN_MUSCLE]: 'ganhar massa magra',
                [UserGoal.MAINTAIN]: 'manter o peso',
                [UserGoal.EAT_HEALTHY]: 'se alimentar melhor'
            }[goal] || 'seu objetivo';

            return (
                <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.title}>Seu Plano NutriVerse está pronto 🎉</Text>
                    <Text style={styles.subtitle}>100% personalizado para {goalText}.</Text>

                    <View style={styles.previewCard}>
                        <View style={styles.dayHeader}>
                            <Text style={styles.dayTitle}>Dia 1</Text>
                            <Text style={styles.calText}>~{calories} kcal</Text>
                        </View>
                        {meals.slice(0, mealsPerDay).map((meal, idx) => (
                            <View key={idx} style={styles.mealRow}>
                                <View style={styles.dot} />
                                <Text style={styles.mealText}>{meal}</Text>
                            </View>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                        <Text style={styles.primaryButtonText}>Ver plano completo</Text>
                    </TouchableOpacity>
                </Animated.View>
            );
        };

        const renderSocialProof = () => (
            <View style={styles.stepContainer}>
                <Text style={styles.title}>Junte-se a +12.000 pessoas</Text>
                <Text style={styles.subtitle}>Veja o que estão falando sobre o NutriVerse.</Text>

                <View style={styles.testimonialCard}>
                    <Text style={styles.testimonialText}>"Finalmente consegui seguir uma dieta! As receitas são muito fáceis e uso tudo que tenho na geladeira."</Text>
                    <View style={styles.userRow}>
                        <View style={styles.avatar}><Text>👩</Text></View>
                        <Text style={styles.userName}>Mariana S., perdeu 5kg</Text>
                    </View>
                </View>

                <View style={styles.testimonialCard}>
                    <Text style={styles.testimonialText}>"O scanner de despensa é bruxaria! Economizo muito tempo e dinheiro."</Text>
                    <View style={styles.userRow}>
                        <View style={styles.avatar}><Text>👨</Text></View>
                        <Text style={styles.userName}>Carlos E., ganhou massa</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.primaryButton} onPress={handleNext}>
                    <Text style={styles.primaryButtonText}>Liberar meu acesso</Text>
                </TouchableOpacity>
            </View>
        );

        if (step === 8) {
            return <PaywallScreen onPurchase={handleFinish} onRestore={handleFinish} onClose={handleFinish} />;
        }

        return (
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                    {step > 0 && (
                        <View style={styles.progressBarContainer}>
                            <View style={styles.progressBarTrack}>
                                <View style={[styles.progressBarFill, { width: `${(step / 8) * 100}%` }]} />
                            </View>
                        </View>
                    )}

                    <View style={styles.content}>
                        {step === 0 && renderHero()}
                        {step === 1 && renderPainPoints()}
                        {step === 2 && renderGoal()}
                        {step === 3 && renderProfile()}
                        {step === 4 && renderRestrictions()}
                        {step === 5 && renderRoutine()}
                        {step === 6 && renderResult()}
                        {step === 7 && renderSocialProof()}
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
        content: {
            flex: 1,
            padding: 24,
        },
        centerStep: {
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
        },
        stepContainer: {
            flex: 1,
            paddingTop: 20,
        },
        scrollStepContainer: {
            flexGrow: 1,
            paddingTop: 20,
            paddingBottom: 40,
        },
        heroImagePlaceholder: {
            width: 120,
            height: 120,
            borderRadius: 60,
            backgroundColor: '#a6f000',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 32,
        },
        heroTitle: {
            fontSize: 36,
            fontWeight: '800',
            color: '#111827',
            textAlign: 'center',
            marginBottom: 16,
            lineHeight: 42,
        },
        heroSubtitle: {
            fontSize: 18,
            color: '#6B7280',
            textAlign: 'center',
            marginBottom: 40,
            lineHeight: 26,
        },
        title: {
            fontSize: 28,
            fontWeight: '800',
            color: '#111827',
            marginBottom: 12,
        },
        subtitle: {
            fontSize: 16,
            color: '#6B7280',
            marginBottom: 32,
        },
        primaryButton: {
            backgroundColor: '#a6f000',
            width: '100%',
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
            marginBottom: 16,
        },
        primaryButtonText: {
            fontSize: 18,
            fontWeight: '800',
            color: 'black',
        },
        buttonDisabled: {
            backgroundColor: '#E5E7EB',
            shadowOpacity: 0,
        },
        loginLink: {
            fontSize: 16,
            fontWeight: '700',
            color: '#111827',
        },
        optionsList: {
            gap: 12,
            marginBottom: 32,
        },
        optionCard: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 16,
            borderWidth: 2,
            borderColor: 'transparent',
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
        checkbox: {
            width: 24,
            height: 24,
            borderRadius: 6,
            borderWidth: 2,
            borderColor: '#E5E7EB',
            marginRight: 16,
            alignItems: 'center',
            justifyContent: 'center',
        },
        checkboxSelected: {
            borderColor: '#a6f000',
            backgroundColor: '#a6f000',
        },
        optionText: {
            fontSize: 16,
            fontWeight: '600',
            color: '#1F2937',
            flex: 1,
        },
        inputGroup: {
            marginBottom: 20,
        },
        label: {
            fontSize: 14,
            fontWeight: '700',
            color: '#374151',
            marginBottom: 8,
        },
        input: {
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            borderRadius: 16,
            padding: 16,
            fontSize: 16,
            color: '#1F2937',
        },
        rowOptions: {
            flexDirection: 'row',
            gap: 8,
            flexWrap: 'wrap',
        },
        smallOption: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#E5E7EB',
        },
        smallOptionSelected: {
            backgroundColor: 'black',
            borderColor: 'black',
        },
        smallOptionText: {
            fontWeight: '600',
            color: '#374151',
        },
        smallOptionTextSelected: {
            color: 'white',
        },
        tagsContainer: {
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 32,
        },
        tag: {
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#E5E7EB',
        },
        tagSelected: {
            backgroundColor: '#a6f000',
            borderColor: '#a6f000',
        },
        tagText: {
            fontWeight: '600',
            color: '#374151',
        },
        tagTextSelected: {
            color: 'black',
        },
        circleOption: {
            width: 50,
            height: 50,
            borderRadius: 25,
            backgroundColor: 'white',
            borderWidth: 1,
            borderColor: '#E5E7EB',
            alignItems: 'center',
            justifyContent: 'center',
        },
        circleOptionSelected: {
            backgroundColor: 'black',
            borderColor: 'black',
        },
        circleText: {
            fontSize: 18,
            fontWeight: '700',
            color: '#374151',
        },
        circleTextSelected: {
            color: 'white',
        },
        switchRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24,
            backgroundColor: 'white',
            padding: 16,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#E5E7EB',
        },
        switchLabel: {
            fontSize: 16,
            fontWeight: '600',
            color: '#1F2937',
        },
        switchDescription: {
            fontSize: 13,
            fontWeight: '400',
            color: '#6B7280',
            marginTop: 4,
        },
        switch: {
            width: 50,
            height: 30,
            borderRadius: 15,
            backgroundColor: '#E5E7EB',
            padding: 2,
        },
        switchActive: {
            backgroundColor: '#a6f000',
        },
        switchThumb: {
            width: 26,
            height: 26,
            borderRadius: 13,
            backgroundColor: 'white',
        },
        switchThumbActive: {
            transform: [{ translateX: 20 }],
        },
        previewCard: {
            backgroundColor: 'white',
            borderRadius: 24,
            padding: 24,
            marginBottom: 32,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 5,
            borderWidth: 1,
            borderColor: '#F3F4F6',
        },
        dayHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 16,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
        },
        dayTitle: {
            fontSize: 18,
            fontWeight: '800',
            color: '#111827',
        },
        calText: {
            color: '#6B7280',
            fontWeight: '600',
        },
        mealRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 12,
            gap: 12,
        },
        dot: {
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: '#a6f000',
        },
        mealText: {
            fontSize: 16,
            color: '#374151',
        },
        testimonialCard: {
            backgroundColor: 'white',
            padding: 20,
            borderRadius: 20,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: '#F3F4F6',
        },
        testimonialText: {
            fontSize: 16,
            fontStyle: 'italic',
            color: '#374151',
            marginBottom: 12,
            lineHeight: 24,
        },
        userRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
        },
        avatar: {
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: '#F3F4F6',
            alignItems: 'center',
            justifyContent: 'center',
        },
        userName: {
            fontSize: 14,
            fontWeight: '700',
            color: '#111827',
        },
        progressBarContainer: {
            paddingHorizontal: 24,
            paddingTop: 12,
            paddingBottom: 12,
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
        progressContainer: {
            width: '100%',
            marginTop: 40,
            marginBottom: 20,
        },
        progressBar: {
            height: 8,
            backgroundColor: '#E5E7EB',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 12,
        },
        progressFill: {
            height: '100%',
            backgroundColor: '#a6f000',
            borderRadius: 4,
        },
        progressText: {
            fontSize: 18,
            fontWeight: '700',
            color: '#111827',
            textAlign: 'center',
        },
        loadingMessage: {
            fontSize: 15,
            fontWeight: '500',
            color: '#6B7280',
            textAlign: 'center',
            marginTop: 24,
            paddingHorizontal: 32,
        },
    });
