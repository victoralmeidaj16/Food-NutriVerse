
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export const LoadingOverlay = ({ message }: { message: string }) => (
    <View style={styles.container}>
        <View style={styles.card}>
            <ActivityIndicator size="large" color="#a6f000" style={styles.spinner} />
            <Text style={styles.text}>{message}</Text>
        </View>
    </View>
);

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
    },
    card: {
        backgroundColor: 'white',
        padding: 32,
        borderRadius: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
        elevation: 10,
    },
    spinner: {
        marginBottom: 16,
    },
    text: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F2937',
        textAlign: 'center',
    },
});
