
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LightbulbIcon, CloseIcon } from './Icons';

export const DailyTipCard = ({ onClose }: { onClose: () => void }) => {
    return (
        <View style={styles.container}>
            <View style={styles.iconContainer}>
                <LightbulbIcon size={24} color="#ca8a04" />
            </View>
            <View style={styles.content}>
                <Text style={styles.title}>Dica do Dia</Text>
                <Text style={styles.text}>
                    Beber água 30min antes das refeições ajuda na digestão e saciedade.
                </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <CloseIcon size={16} color="#A16207" />
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#FEF9C3',
        borderRadius: 20,
        padding: 16,
        marginBottom: 24,
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#FEF08A',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(253, 224, 71, 0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    title: {
        fontSize: 14,
        fontWeight: '800',
        color: '#854D0E',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    text: {
        fontSize: 14,
        color: '#A16207',
        lineHeight: 20,
    },
    closeBtn: {
        padding: 4,
    },
});
