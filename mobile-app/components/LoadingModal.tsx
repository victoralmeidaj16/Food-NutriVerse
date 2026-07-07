import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Dimensions, Easing, Image, AccessibilityInfo } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useLanguage } from '../context/LanguageContext';
import { SparklesIcon, ActivityIcon, FileTextIcon, LightbulbIcon, ChefHatIcon } from './Icons';

// Marcos de conclusão de cada etapa (alinhados aos thresholds do checklist)
const STEP_THRESHOLDS = [0.25, 0.55, 0.85, 0.98];

const { width, height } = Dimensions.get('window');

interface LoadingModalProps {
    visible: boolean;
    progress: number; // 0 to 1
    status: string; // "Conectando...", "Analisando..."
    personalizationText?: string;
}

export const LoadingModal: React.FC<LoadingModalProps> = ({ visible, progress, status, personalizationText }) => {
    const { language } = useLanguage();

    const progressAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const spinAnim = useRef(new Animated.Value(0)).current;
    const shimmerAnim = useRef(new Animated.Value(-1)).current;

    // Motion refs para as transições da Parte 2
    const statusOpacity = useRef(new Animated.Value(1)).current;   // cross-fade do texto de status
    const statusTranslate = useRef(new Animated.Value(0)).current; // slide sutil no cross-fade
    const stepScales = useRef([0, 1, 2, 3].map(() => new Animated.Value(1))).current; // "pop" ao concluir etapa
    const milestoneGlow = useRef(new Animated.Value(0)).current;   // flash orgânico na barra a cada marco
    const coreScale = useRef(new Animated.Value(1)).current;       // celebração de conclusão no core

    const reduceMotionRef = useRef(false);   // respeita Reduce Motion do sistema
    const prevCompletedRef = useRef(0);      // quantas etapas já haviam completado

    const [animatedProgress, setAnimatedProgress] = useState(0);
    const [displayedStatus, setDisplayedStatus] = useState(status); // status atualmente visível (troca via cross-fade)

    // Smooth fake progress bar animation
    useEffect(() => {
        setAnimatedProgress(progress);

        const fakeProgressInterval = setInterval(() => {
            setAnimatedProgress(prev => {
                if (progress >= 1) return 1;
                if (prev >= 0.95) return prev;
                return Math.min(0.95, prev + (Math.random() * 0.03 + 0.01));
            });
        }, 1200);

        return () => clearInterval(fakeProgressInterval);
    }, [progress]);

    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: animatedProgress,
            duration: 800,
            useNativeDriver: false, // width doesn't support true
            easing: Easing.out(Easing.ease)
        }).start();
    }, [animatedProgress]);

    // Detecta (e observa) a preferência de Reduce Motion do sistema
    useEffect(() => {
        let mounted = true;
        AccessibilityInfo.isReduceMotionEnabled().then(v => { if (mounted) reduceMotionRef.current = v; });
        const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', v => { reduceMotionRef.current = v; });
        return () => { mounted = false; sub?.remove?.(); };
    }, []);

    // Cross-fade + slide sutil na troca do texto de status (nunca corte seco)
    useEffect(() => {
        if (status === displayedStatus) return;
        if (reduceMotionRef.current) { setDisplayedStatus(status); return; }

        Animated.parallel([
            Animated.timing(statusOpacity, { toValue: 0, duration: 160, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
            Animated.timing(statusTranslate, { toValue: -6, duration: 160, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
        ]).start(({ finished }) => {
            if (!finished) return;
            setDisplayedStatus(status);
            statusTranslate.setValue(6); // entra por baixo
            Animated.parallel([
                Animated.timing(statusOpacity, { toValue: 1, duration: 240, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
                Animated.timing(statusTranslate, { toValue: 0, duration: 240, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
            ]).start();
        });
    }, [status]);

    // Marcos: haptic leve + "pop" da etapa + glow orgânico na barra + celebração final
    useEffect(() => {
        const completed = STEP_THRESHOLDS.filter(t => animatedProgress >= t).length;

        if (completed > prevCompletedRef.current) {
            const justFinished = completed - 1; // índice da etapa recém-concluída
            const isFinal = completed >= STEP_THRESHOLDS.length;

            // Haptic com parcimônia: toque leve nos marcos, sucesso ao finalizar
            if (isFinal) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            } else {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }

            if (!reduceMotionRef.current) {
                // "pop" spring no indicador da etapa concluída (~250ms, físico)
                if (stepScales[justFinished]) {
                    stepScales[justFinished].setValue(0.5);
                    Animated.spring(stepScales[justFinished], {
                        toValue: 1, useNativeDriver: true, tension: 140, friction: 6,
                    }).start();
                }

                // Glow "respirando" na barra ao fechar a etapa (700ms)
                milestoneGlow.setValue(1);
                Animated.timing(milestoneGlow, {
                    toValue: 0, duration: 700, useNativeDriver: true, easing: Easing.out(Easing.ease),
                }).start();

                // Celebração de conclusão: leve bump no core antes do handoff para a receita
                if (isFinal) {
                    Animated.sequence([
                        Animated.spring(coreScale, { toValue: 1.08, useNativeDriver: true, tension: 120, friction: 5 }),
                        Animated.spring(coreScale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 6 }),
                    ]).start();
                }
            }
        }

        prevCompletedRef.current = completed;
    }, [animatedProgress]);

    // Looping animations
    useEffect(() => {
        if (visible) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.25,
                        duration: 1500,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease)
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 1500,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease)
                    })
                ])
            ).start();

            Animated.loop(
                Animated.timing(spinAnim, {
                    toValue: 1,
                    duration: 10000,
                    useNativeDriver: true,
                    easing: Easing.linear
                })
            ).start();

            Animated.loop(
                Animated.timing(shimmerAnim, {
                    toValue: 2,
                    duration: 1500,
                    useNativeDriver: false, // Must be false for left/width positioning if used directly, though we use it with absolute positioning
                })
            ).start();
        } else {
            pulseAnim.setValue(1);
            spinAnim.setValue(0);
            shimmerAnim.setValue(-1);
            setAnimatedProgress(0); // Reset when hidden
            progressAnim.setValue(0);

            // Reset das animações da Parte 2
            statusOpacity.setValue(1);
            statusTranslate.setValue(0);
            milestoneGlow.setValue(0);
            coreScale.setValue(1);
            stepScales.forEach(s => s.setValue(1));
            prevCompletedRef.current = 0;
            setDisplayedStatus(status);
        }
    }, [visible]);

    const spinRotate = spinAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    const displayPercentage = Math.min(100, Math.round(animatedProgress * 100));

    const steps = [
        {
            key: 1,
            title: language === 'en' ? 'Goal identified' : 'Objetivo identificado',
            description: language === 'en' ? 'Adjusting to your current focus' : 'Ajustando ao seu foco atual',
            icon: <ActivityIcon size={16} color={animatedProgress >= 0.25 ? "#a6f000" : "#4B5563"} />,
            completed: animatedProgress >= 0.25,
            active: animatedProgress < 0.25,
        },
        {
            key: 2,
            title: language === 'en' ? 'Recipe analyzed' : 'Receita analisada',
            description: language === 'en' ? 'Understanding taste, ingredients, and prep' : 'Entendendo sabor, ingredientes e preparo',
            icon: <FileTextIcon size={16} color={animatedProgress >= 0.55 ? "#a6f000" : (animatedProgress >= 0.25 ? "#000" : "#4B5563")} />,
            completed: animatedProgress >= 0.55,
            active: animatedProgress >= 0.25 && animatedProgress < 0.55,
        },
        {
            key: 3,
            title: language === 'en' ? 'Smart version' : 'Versão inteligente',
            description: language === 'en' ? 'Adapting for balance and results' : 'Adaptando para equilíbrio e resultado',
            icon: <LightbulbIcon size={16} color={animatedProgress >= 0.85 ? "#a6f000" : (animatedProgress >= 0.55 ? "#000" : "#4B5563")} />,
            completed: animatedProgress >= 0.85,
            active: animatedProgress >= 0.55 && animatedProgress < 0.85,
        },
        {
            key: 4,
            title: language === 'en' ? 'Finalizing' : 'Finalizando',
            description: language === 'en' ? 'Organizing everything into a simple recipe' : 'Organizando tudo em uma receita simples',
            icon: <ChefHatIcon size={16} color={animatedProgress >= 0.98 ? "#a6f000" : (animatedProgress >= 0.85 ? "#000" : "#4B5563")} />,
            completed: animatedProgress >= 0.98,
            active: animatedProgress >= 0.85 && animatedProgress < 0.98,
        },
    ];

    return (
        <Modal transparent visible={visible} animationType="fade">
            <View style={styles.container}>
                {/* Background Decoratives */}
                <Animated.View style={[styles.bgCircle, { top: -100, right: -100, backgroundColor: 'rgba(166,240,0,0.06)', transform: [{ scale: pulseAnim }] }]} />
                <Animated.View style={[styles.bgCircle, { bottom: -100, left: -100, backgroundColor: 'rgba(0,0,0,0.03)', transform: [{ scale: pulseAnim }] }]} />

                <View style={styles.content}>
                    {/* Preparation Section */}
                    {animatedProgress < 0.05 && (
                        <View style={styles.prepContainer}>
                            <Text style={styles.prepTitle}>FitSwap AI</Text>
                            <Text style={styles.prepSubtitle}>{language === 'en' ? 'Preparing your intelligent transformation...' : 'Preparando sua transformação inteligente...'}</Text>
                        </View>
                    )}

                    {/* Visual AI Core */}
                    <Animated.View style={[styles.coreContainer, { opacity: animatedProgress >= 0.05 ? 1 : 0, transform: [{ scale: coreScale }] }]}>
                        {/* Shadow/Glow */}
                        <Animated.View style={[
                            styles.glow,
                            { transform: [{ scale: pulseAnim }] }
                        ]} />

                        {/* Main Core Container */}
                        <View style={styles.coreCircle}>
                            <Animated.View style={[
                                styles.dashedBorder,
                                { transform: [{ rotate: spinRotate }] }
                            ]} />

                            {/* Orbiting Particles */}
                            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate: spinRotate }] }]}>
                                <View style={[styles.particle, { top: -3, left: '50%', transform: [{ translateX: -3 }] }]} />
                                <View style={[styles.particle, { bottom: 15, left: 15 }]} />
                                <View style={[styles.particle, { bottom: 15, right: 15 }]} />
                            </Animated.View>
                            
                            {/* Logo */}
                            <Image
                                source={require('../assets/fitswap-logo.png')}
                                style={styles.logo}
                                resizeMode="contain"
                            />
                        </View>
                    </Animated.View>

                    {/* Animated Percentage */}
                    <View style={[styles.percentageRow, { opacity: animatedProgress >= 0.05 ? 1 : 0 }]}>
                        <Text style={styles.percentageNum}>{displayPercentage}</Text>
                        <Text style={styles.percentageSym}>%</Text>
                    </View>

                    {/* Status Display (cross-fade + slide na troca) */}
                    <View style={[styles.statusBox, { opacity: animatedProgress >= 0.05 ? 1 : 0 }]}>
                        <Animated.Text style={[
                            styles.statusText,
                            { opacity: statusOpacity, transform: [{ translateY: statusTranslate }] }
                        ]}>
                            {displayedStatus.toUpperCase()}
                        </Animated.Text>
                    </View>

                    {/* Checklist Timeline */}
                    <View style={[styles.timelineContainer, { opacity: animatedProgress >= 0.05 ? 1 : 0 }]}>
                        {/* Connective Line */}
                        <View style={styles.timelineLine} />
                        
                        {steps.map((stepItem, index) => {
                            return (
                                <View key={stepItem.key} style={styles.timelineRow}>
                                    {/* Left Circle Icon */}
                                    <View style={[
                                        styles.iconCircle,
                                        stepItem.active && styles.iconCircleActive,
                                        stepItem.completed && styles.iconCircleCompleted
                                    ]}>
                                        {stepItem.icon}
                                    </View>
                                    
                                    {/* Text Info */}
                                    <View style={styles.textContainer}>
                                        <Text style={[
                                            styles.stepTitle,
                                            stepItem.completed && styles.stepTextCompleted,
                                            stepItem.active && styles.stepTextActive
                                        ]}>
                                            {stepItem.title}
                                        </Text>
                                        <Text style={styles.stepDesc}>
                                            {stepItem.description}
                                        </Text>
                                    </View>
                                    
                                    {/* Right Indicator Status ("pop" spring ao concluir) */}
                                    <Animated.View style={[styles.indicatorContainer, { transform: [{ scale: stepScales[index] }] }]}>
                                        {stepItem.completed ? (
                                            <View style={styles.greenCheckCircle}>
                                                <Text style={styles.checkMark}>✓</Text>
                                            </View>
                                        ) : stepItem.active ? (
                                            <View style={styles.activeDot} />
                                        ) : (
                                            <View style={styles.inactiveDot} />
                                        )}
                                    </Animated.View>
                                </View>
                            );
                        })}
                    </View>

                    {/* Progress Bar */}
                    <View style={[styles.progressTrack, { opacity: animatedProgress >= 0.05 ? 1 : 0 }]}>
                        <Animated.View 
                            style={[
                                styles.progressFill,
                                {
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    })
                                }
                            ]}
                        >
                            <Animated.View style={[styles.shimmer, {
                                left: shimmerAnim.interpolate({
                                    inputRange: [-1, 2],
                                    outputRange: ['-100%', '200%']
                                })
                            }]} />
                            {/* Flash orgânico ao concluir cada etapa */}
                            <Animated.View
                                pointerEvents="none"
                                style={[StyleSheet.absoluteFill, {
                                    backgroundColor: '#FFFFFF',
                                    opacity: milestoneGlow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] })
                                }]}
                            />
                        </Animated.View>
                    </View>

                    {/* Personalization Info */}
                    {personalizationText && (
                        <View style={[styles.persBox, { opacity: animatedProgress >= 0.05 ? 1 : 0 }]}>
                            <SparklesIcon size={14} color="#a6f000" />
                            <Text style={styles.persText}>{personalizationText}</Text>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bgCircle: {
        position: 'absolute',
        width: height * 0.4,
        height: height * 0.4,
        borderRadius: height * 0.2,
    },
    content: {
        width: '100%',
        maxWidth: 320,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    prepContainer: {
        position: 'absolute',
        top: 100,
        alignItems: 'center',
        width: '100%',
        zIndex: 50,
    },
    prepTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 8,
    },
    prepSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    coreContainer: {
        position: 'relative',
        marginBottom: 48,
        alignItems: 'center',
        justifyContent: 'center',
        width: 160,
        height: 160,
    },
    glow: {
        position: 'absolute',
        width: 144,
        height: 144,
        borderRadius: 72,
        backgroundColor: 'rgba(166, 240, 0, 0.2)',
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 8,
    },
    coreCircle: {
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    dashedBorder: {
        position: 'absolute',
        width: 110,
        height: 110,
        borderRadius: 55,
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        borderStyle: 'dashed',
    },
    logo: {
        width: 90,
        height: 90,
    },
    percentageRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 24,
    },
    percentageNum: {
        fontSize: 56,
        fontWeight: '900',
        color: '#111827',
        fontVariant: ['tabular-nums'],
        letterSpacing: -2,
    },
    percentageSym: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#a6f000',
        marginLeft: 4,
    },
    statusBox: {
        minHeight: 48,
        justifyContent: 'center',
        marginBottom: 32,
        paddingHorizontal: 12,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: 1.5,
        textAlign: 'center',
        lineHeight: 18,
    },
    progressTrack: {
        width: '100%',
        height: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#a6f000',
        borderRadius: 5,
        position: 'relative',
        overflow: 'hidden',
    },
    shimmer: {
        width: '40%',
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.4)',
        position: 'absolute',
        transform: [{ skewX: '-20deg' }],
    },
    particle: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#a6f000',
        position: 'absolute',
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    },
    persBox: {
        marginTop: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: '#F3F4F6',
        borderRadius: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    persText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#374151',
    },
    timelineContainer: {
        width: '100%',
        paddingHorizontal: 8,
        marginBottom: 28,
        position: 'relative',
    },
    timelineLine: {
        position: 'absolute',
        left: 27,
        top: 20,
        bottom: 20,
        width: 2,
        backgroundColor: '#E5E7EB',
    },
    timelineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    iconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: 'white',
        borderWidth: 1.5,
        borderColor: '#E5E7EB',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    iconCircleActive: {
        borderColor: '#a6f000',
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    iconCircleCompleted: {
        borderColor: '#E5E7EB',
    },
    textContainer: {
        flex: 1,
        paddingLeft: 12,
    },
    stepTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#9CA3AF',
    },
    stepTextCompleted: {
        color: '#1F2937',
    },
    stepTextActive: {
        color: '#000000',
    },
    stepDesc: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    indicatorContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 24,
    },
    greenCheckCircle: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: '#a6f000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkMark: {
        color: 'black',
        fontSize: 12,
        fontWeight: 'bold',
    },
    activeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#a6f000',
    },
    inactiveDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#E5E7EB',
    }
});
