import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Linking, SafeAreaView } from 'react-native';
import { ExternalLinkIcon, XIcon, InfoIcon } from './Icons';
import { HealthReference } from '../services/healthReferences';
import { useLanguage } from '../context/LanguageContext';

interface CitationBadgeProps {
    references: HealthReference[];
    size?: 'small' | 'medium';
    showLabel?: boolean;
}

export const CitationBadge: React.FC<CitationBadgeProps> = ({
    references,
    size = 'small',
    showLabel = false
}) => {
    const [modalVisible, setModalVisible] = useState(false);
    const { language } = useLanguage();

    console.log('🔍 CitationBadge received references:', references);

    if (!references || references.length === 0) return null;

    const handleOpenLink = async (url: string) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            }
        } catch (error) {
            console.error('Error opening link:', error);
        }
    };

    const iconSize = size === 'small' ? 14 : 18;
    const containerPadding = size === 'small' ? 4 : 6;

    return (
        <>
            <TouchableOpacity
                onPress={() => setModalVisible(true)}
                style={[styles.badge, { padding: containerPadding }]}
                activeOpacity={0.7}
            >
                <InfoIcon size={iconSize} color="#6B7280" />
                {showLabel && (
                    <Text style={styles.badgeLabel}>
                        {language === 'en' ? 'Source' : 'Fonte'}
                    </Text>
                )}
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {language === 'en'
                                    ? (references.length === 1 ? 'Scientific Source' : 'Scientific Sources')
                                    : (references.length === 1 ? 'Fonte Científica' : 'Fontes Científicas')}
                            </Text>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <XIcon size={24} color="#111827" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.scrollView}
                            contentContainerStyle={{ paddingBottom: 40 }}
                            showsVerticalScrollIndicator={false}
                        >
                            {references.map((ref, index) => (
                                <View key={ref.id} style={styles.referenceCard}>
                                    <View style={styles.referenceHeader}>
                                        <Text style={styles.referenceNumber}>{index + 1}</Text>
                                        <View style={styles.referenceInfo}>
                                            <Text style={styles.referenceSource}>{ref.source}</Text>
                                            <Text style={styles.referenceTitle}>{ref.title}</Text>
                                        </View>
                                    </View>

                                    <Text style={styles.referenceSummary}>{ref.summary}</Text>

                                    <TouchableOpacity
                                        onPress={() => handleOpenLink(ref.url)}
                                        style={styles.linkButton}
                                    >
                                        <ExternalLinkIcon size={16} color="#a6f000" />
                                        <Text style={styles.linkText}>
                                            {language === 'en' ? 'Access source' : 'Acessar fonte'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ))}

                            <View style={styles.disclaimer}>
                                <Text style={styles.disclaimerText}>
                                    {language === 'en'
                                        ? '💡 Nutritional information provided is based on guidelines from recognized health institutions. For personalized guidance, consult a health professional.'
                                        : '💡 As informações nutricionais fornecidas são baseadas em diretrizes de instituições de saúde reconhecidas. Para orientação personalizada, consulte um profissional de saúde.'}
                                </Text>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    badge: {
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    badgeLabel: {
        fontSize: 11,
        color: '#6B7280',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '60%', // Fixed height to ensure visibility
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#111827',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 24,
    },
    referenceCard: {
        marginTop: 20,
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    referenceHeader: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 12,
    },
    referenceNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#a6f000',
        color: '#000',
        fontSize: 14,
        fontWeight: '800',
        textAlign: 'center',
        lineHeight: 28,
    },
    referenceInfo: {
        flex: 1,
    },
    referenceSource: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
        marginBottom: 4,
    },
    referenceTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
    },
    referenceSummary: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 12,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    linkText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#a6f000',
    },
    disclaimer: {
        marginTop: 24,
        marginBottom: 32,
        padding: 16,
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    disclaimerText: {
        fontSize: 13,
        color: '#78350F',
        lineHeight: 18,
    },
});
