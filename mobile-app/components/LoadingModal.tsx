import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Animated, Dimensions, Easing } from 'react-native';
import { BlurView } from 'expo-blur';
import { ChefHat, Sparkles, Camera, BrainCircuit } from 'lucide-react-native';

const { width } = Dimensions.get('window');

interface LoadingModalProps {
    visible: boolean;
    progress: number; // 0 to 1
    status: string; // "Conectando...", "Analisando..."
}

const TIPS = [
    "💡 Sabia que proteínas aumentam a saciedade por mais tempo?",
    "🥑 Gorduras boas como abacate ajudam na absorção de vitaminas.",
    "💧 Beber água antes das refeições pode ajudar na digestão.",
    "🥦 Vegetais verde-escuros são ricos em ferro e cálcio.",
    "🍎 Frutas com casca têm mais fibras e nutrientes.",
    "🍳 Ovos são uma das melhores fontes de proteína natural.",
    "🏃‍♂️ Comer carboidratos antes do treino dá mais energia.",
    "⏰ Primeira vez gerando? O servidor pode demorar até 1 minuto para acordar.",
    "☕ A receita perfeita vale a espera! Estamos trabalhando nisso...",
    "🌙 Nosso servidor dorme quando não está em uso para economizar recursos.",
];

export const LoadingModal: React.FC<LoadingModalProps> = ({ visible, progress, status }) => {
    const [tipIndex, setTipIndex] = useState(0);
    const progressAnim = useRef(new Animated.Value(0)).current;
    const iconAnim = useRef(new Animated.Value(0)).current;

    // Smooth progress bar animation
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: progress,
            duration: 500,
            useNativeDriver: false,
            easing: Easing.out(Easing.ease)
        }).start();
    }, [progress]);

    // Bouncing icon animation
    useEffect(() => {
        if (visible) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(iconAnim, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease)
                    }),
                    Animated.timing(iconAnim, {
                        toValue: 0,
                        duration: 1000,
                        useNativeDriver: true,
                        easing: Easing.inOut(Easing.ease)
                    })
                ])
            ).start();

            // Rotate tips every 4 seconds
            const interval = setInterval(() => {
                setTipIndex(prev => (prev + 1) % TIPS.length);
            }, 4000);

            return () => clearInterval(interval);
        } else {
            iconAnim.setValue(0);
        }
    }, [visible]);

    const iconTranslateY = iconAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -15]
    });

    const getIcon = () => {
        if (progress < 0.3) return <ChefHat size={48} color="#4CAF50" />;
        if (progress < 0.6) return <BrainCircuit size={48} color="#4CAF50" />;
        if (progress < 0.9) return <Camera size={48} color="#4CAF50" />;
        return <Sparkles size={48} color="#4CAF50" />;
    };

    return (
        <Modal transparent visible={visible} animationType="fade">
            <BlurView intensity={40} tint="dark" style={styles.container}>
                <View style={styles.card}>
                    <Animated.View style={{ transform: [{ translateY: iconTranslateY }] }}>
                        {getIcon()}
                    </Animated.View>

                    <Text style={styles.statusText}>{status}</Text>

                    <View style={styles.progressContainer}>
                        <Animated.View
                            style={[
                                styles.progressBar,
                                {
                                    width: progressAnim.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ['0%', '100%']
                                    })
                                }
                            ]}
                        />
                    </View>
                    <Text style={styles.percentageText}>{Math.round(progress * 100)}%</Text>

                    <View style={styles.tipContainer}>
                        <Text style={styles.tipTitle}>Dica NutriVerse:</Text>
                        <Text style={styles.tipText}>{TIPS[tipIndex]}</Text>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    card: {
        width: width * 0.85,
        backgroundColor: '#1E1E1E',
        borderRadius: 20,
        padding: 30,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        borderWidth: 1,
        borderColor: '#333'
    },
    statusText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 20,
        textAlign: 'center'
    },
    progressContainer: {
        width: '100%',
        height: 8,
        backgroundColor: '#333',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#4CAF50',
        borderRadius: 4
    },
    percentageText: {
        color: '#888',
        fontSize: 12,
        marginBottom: 30
    },
    tipContainer: {
        backgroundColor: '#2A2A2A',
        padding: 15,
        borderRadius: 12,
        width: '100%'
    },
    tipTitle: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 5,
        textTransform: 'uppercase'
    },
    tipText: {
        color: '#DDD',
        fontSize: 14,
        lineHeight: 20,
        fontStyle: 'italic'
    }
});
