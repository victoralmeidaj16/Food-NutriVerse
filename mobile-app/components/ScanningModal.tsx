import React, { useEffect, useRef, useState } from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Modal,
    Animated,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CloseIcon } from './Icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = Math.round(CARD_WIDTH * 0.75); // 4:3 ratio

interface ScanningModalProps {
    visible: boolean;
    images: string[];
    onCancel?: () => void;
    status?: string;
    language?: string;
}

export const ScanningModal = ({ visible, images, onCancel, status, language = 'pt' }: ScanningModalProps) => {
    const scanAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(0.6)).current;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const imageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Scan line animation
    useEffect(() => {
        if (!visible) return;

        scanAnim.setValue(0);
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(scanAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(scanAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        );
        loop.start();

        return () => loop.stop();
    }, [visible]);

    // Pulse animation for status text
    useEffect(() => {
        if (!visible) return;

        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
            ])
        );
        pulse.start();

        return () => pulse.stop();
    }, [visible]);

    // Cycle through multiple images
    useEffect(() => {
        if (!visible || images.length <= 1) {
            setCurrentImageIndex(0);
            return;
        }

        setCurrentImageIndex(0);
        imageTimerRef.current = setInterval(() => {
            setCurrentImageIndex(prev => (prev + 1) % images.length);
        }, 2500);

        return () => {
            if (imageTimerRef.current) clearInterval(imageTimerRef.current);
        };
    }, [visible, images.length]);

    const scanLineY = scanAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, CARD_HEIGHT - 6],
    });

    const defaultStatus = language === 'en' ? 'Scanning image...' : 'Analisando imagem...';
    const displayStatus = status || defaultStatus;

    return (
        <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
            <View style={styles.overlay}>
                <View style={styles.container}>

                    {/* Cancel button */}
                    {onCancel && (
                        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
                            <CloseIcon size={20} color="#fff" />
                        </TouchableOpacity>
                    )}

                    {/* Image card with scan line */}
                    <View style={styles.card}>
                        {images.length > 0 ? (
                            <Image
                                source={{ uri: images[currentImageIndex] }}
                                style={styles.image}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.imagePlaceholder} />
                        )}

                        {/* Dark overlay tint */}
                        <View style={styles.imageTint} />

                        {/* Scan line */}
                        <Animated.View
                            style={[
                                styles.scanLine,
                                { transform: [{ translateY: scanLineY }] },
                            ]}
                        >
                            {/* Trailing gradient below the line */}
                            <LinearGradient
                                colors={['rgba(166,240,0,0.4)', 'transparent']}
                                style={styles.scanTrail}
                            />
                        </Animated.View>

                        {/* Corner markers */}
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />
                    </View>

                    {/* Image dots indicator */}
                    {images.length > 1 && (
                        <View style={styles.dotsContainer}>
                            {images.map((_, i) => (
                                <View
                                    key={i}
                                    style={[styles.dot, i === currentImageIndex && styles.dotActive]}
                                />
                            ))}
                        </View>
                    )}

                    {/* Status text */}
                    <Animated.Text style={[styles.statusText, { opacity: pulseAnim }]}>
                        {displayStatus}
                    </Animated.Text>

                    {/* Image counter */}
                    {images.length > 1 && (
                        <Text style={styles.counterText}>
                            {currentImageIndex + 1}/{images.length}
                        </Text>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.88)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        alignItems: 'center',
        width: CARD_WIDTH,
    },
    cancelButton: {
        alignSelf: 'flex-end',
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    card: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#111',
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 12,
    },
    image: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        flex: 1,
        backgroundColor: '#1a1a1a',
    },
    imageTint: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    scanLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 6,
        backgroundColor: '#a6f000',
        shadowColor: '#a6f000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 12,
        elevation: 10,
    },
    scanTrail: {
        position: 'absolute',
        top: 6,
        left: 0,
        right: 0,
        height: 50,
    },
    corner: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderColor: '#a6f000',
        borderWidth: 0,
    },
    cornerTL: {
        top: 12,
        left: 12,
        borderTopWidth: 3,
        borderLeftWidth: 3,
        borderTopLeftRadius: 4,
    },
    cornerTR: {
        top: 12,
        right: 12,
        borderTopWidth: 3,
        borderRightWidth: 3,
        borderTopRightRadius: 4,
    },
    cornerBL: {
        bottom: 12,
        left: 12,
        borderBottomWidth: 3,
        borderLeftWidth: 3,
        borderBottomLeftRadius: 4,
    },
    cornerBR: {
        bottom: 12,
        right: 12,
        borderBottomWidth: 3,
        borderRightWidth: 3,
        borderBottomRightRadius: 4,
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 16,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    dotActive: {
        backgroundColor: '#a6f000',
        width: 18,
    },
    statusText: {
        marginTop: 20,
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        letterSpacing: 0.3,
    },
    counterText: {
        marginTop: 6,
        fontSize: 12,
        color: 'rgba(255,255,255,0.4)',
    },
});
