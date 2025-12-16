import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking, SafeAreaView } from 'react-native';
import { ArrowLeftIcon, ExternalLinkIcon } from './Icons';
import { HEALTH_REFERENCES, HealthReference, getReferencesByCategory } from '../services/healthReferences';
import { useLanguage } from '../context/LanguageContext';

interface SourcesScreenProps {
    onBack: () => void;
}

export const SourcesScreen: React.FC<SourcesScreenProps> = ({ onBack }) => {
    const [selectedCategory, setSelectedCategory] = useState<HealthReference['category'] | 'all'>('all');
    const { language } = useLanguage();

    const categories = language === 'en' ? [
        { id: 'all' as const, label: 'All' },
        { id: 'macros' as const, label: 'Macronutrients' },
        { id: 'health_tips' as const, label: 'Health Tips' },
        { id: 'dietary_restrictions' as const, label: 'Restrictions' },
        { id: 'general' as const, label: 'General' },
    ] : [
        { id: 'all' as const, label: 'Todas' },
        { id: 'macros' as const, label: 'Macronutrientes' },
        { id: 'health_tips' as const, label: 'Dicas de Saúde' },
        { id: 'dietary_restrictions' as const, label: 'Restrições' },
        { id: 'general' as const, label: 'Geral' },
    ];

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

    const getFilteredReferences = (): HealthReference[] => {
        if (selectedCategory === 'all') {
            return Object.values(HEALTH_REFERENCES);
        }
        return getReferencesByCategory(selectedCategory);
    };

    const filteredReferences = getFilteredReferences();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.backButton}>
                    <ArrowLeftIcon size={24} color="#111827" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {language === 'en' ? 'Sources & References' : 'Fontes e Referências'}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.intro}>
                    <Text style={styles.introTitle}>
                        {language === 'en' ? 'Scientific Transparency' : 'Transparência Científica'}
                    </Text>
                    <Text style={styles.introText}>
                        {language === 'en'
                            ? 'All nutritional and health information provided by Food NutriVerse is based on research and guidelines from globally recognized institutions.'
                            : 'Todas as informações nutricionais e de saúde fornecidas pelo Food NutriVerse são baseadas em pesquisas e diretrizes de instituições reconhecidas mundialmente.'}
                    </Text>
                </View>

                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.filterContainer}
                    contentContainerStyle={styles.filterContent}
                >
                    {categories.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            onPress={() => setSelectedCategory(cat.id)}
                            style={[
                                styles.filterChip,
                                selectedCategory === cat.id && styles.filterChipActive
                            ]}
                        >
                            <Text style={[
                                styles.filterChipText,
                                selectedCategory === cat.id && styles.filterChipTextActive
                            ]}>
                                {cat.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style={styles.referencesContainer}>
                    <Text style={styles.sectionTitle}>
                        {filteredReferences.length} {language === 'en'
                            ? (filteredReferences.length === 1 ? 'Source' : 'Sources')
                            : (filteredReferences.length === 1 ? 'Fonte' : 'Fontes')}
                    </Text>

                    {filteredReferences.map((ref, index) => (
                        <View key={ref.id} style={styles.referenceCard}>
                            <View style={styles.referenceHeader}>
                                <View style={styles.numberBadge}>
                                    <Text style={styles.numberText}>{index + 1}</Text>
                                </View>
                                <View style={styles.referenceHeaderInfo}>
                                    <Text style={styles.referenceSource}>{ref.source}</Text>
                                    <Text style={styles.referenceCategory}>
                                        {categories.find(c => c.id === ref.category)?.label || ref.category}
                                    </Text>
                                </View>
                            </View>

                            <Text style={styles.referenceTitle}>{ref.title}</Text>
                            <Text style={styles.referenceSummary}>{ref.summary}</Text>

                            <TouchableOpacity
                                onPress={() => handleOpenLink(ref.url)}
                                style={styles.linkButton}
                            >
                                <ExternalLinkIcon size={18} color="#a6f000" />
                                <Text style={styles.linkButtonText}>
                                    {language === 'en' ? 'Access full source' : 'Acessar fonte completa'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>

                <View style={styles.footer}>
                    <View style={styles.disclaimerBox}>
                        <Text style={styles.disclaimerTitle}>
                            {language === 'en' ? '⚕️ Important Notice' : '⚕️ Aviso Importante'}
                        </Text>
                        <Text style={styles.disclaimerText}>
                            {language === 'en'
                                ? 'The information provided is for educational purposes and does not replace professional medical or nutritional advice. Always consult a qualified health professional for personalized recommendations.'
                                : 'As informações fornecidas são para fins educacionais e não substituem orientação médica ou nutricional profissional. Consulte sempre um profissional de saúde qualificado para recomendações personalizadas.'}
                        </Text>
                    </View>

                    <View style={styles.institutionsBox}>
                        <Text style={styles.institutionsTitle}>
                            {language === 'en' ? 'Institutions Consulted' : 'Instituições Consultadas'}
                        </Text>
                        <Text style={styles.institutionsText}>
                            • Harvard Medical School{'\n'}
                            • World Health Organization (WHO){'\n'}
                            • Mayo Clinic{'\n'}
                            • National Institutes of Health (NIH){'\n'}
                            • Centers for Disease Control and Prevention (CDC){'\n'}
                            • American Heart Association{'\n'}
                            • Academy of Nutrition and Dietetics
                        </Text>
                    </View>

                    <Text style={styles.footerText}>
                        {language === 'en' ? 'Last updated: December 2025' : 'Última atualização: Dezembro 2025'}
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111827',
    },
    content: {
        flex: 1,
    },
    intro: {
        padding: 24,
        backgroundColor: '#FFFFFF',
        marginBottom: 16,
    },
    introTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    introText: {
        fontSize: 15,
        color: '#6B7280',
        lineHeight: 22,
    },
    filterContainer: {
        marginBottom: 16,
    },
    filterContent: {
        paddingHorizontal: 24,
        gap: 8,
    },
    filterChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    filterChipActive: {
        backgroundColor: '#a6f000',
        borderColor: '#a6f000',
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
    },
    filterChipTextActive: {
        color: '#000000',
    },
    referencesContainer: {
        paddingHorizontal: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    referenceCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    referenceHeader: {
        flexDirection: 'row',
        marginBottom: 12,
        gap: 12,
    },
    numberBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#a6f000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    numberText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#000000',
    },
    referenceHeaderInfo: {
        flex: 1,
    },
    referenceSource: {
        fontSize: 13,
        fontWeight: '700',
        color: '#a6f000',
        marginBottom: 2,
    },
    referenceCategory: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
        textTransform: 'uppercase',
    },
    referenceTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 8,
    },
    referenceSummary: {
        fontSize: 14,
        color: '#4B5563',
        lineHeight: 20,
        marginBottom: 16,
    },
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 8,
    },
    linkButtonText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#a6f000',
    },
    footer: {
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 40,
    },
    disclaimerBox: {
        backgroundColor: '#FEF3C7',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#F59E0B',
    },
    disclaimerTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#92400E',
        marginBottom: 8,
    },
    disclaimerText: {
        fontSize: 14,
        color: '#78350F',
        lineHeight: 20,
    },
    institutionsBox: {
        backgroundColor: '#F0FDF4',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#a6f000',
    },
    institutionsTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#166534',
        marginBottom: 12,
    },
    institutionsText: {
        fontSize: 13,
        color: '#166534',
        lineHeight: 20,
    },
    footerText: {
        fontSize: 12,
        color: '#9CA3AF',
        textAlign: 'center',
    },
});
