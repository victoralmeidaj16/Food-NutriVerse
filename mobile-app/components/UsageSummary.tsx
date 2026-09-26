import React, { useEffect, useState } from 'react';
import { AppState, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { UserProfile } from '../types';
import { SubscriptionService } from '../services/subscriptionService';
import { useLanguage } from '../context/LanguageContext';

type Props = {
    profile: UserProfile;
    savedRecipesCount: number;
    onShowPaywall: () => void;
};

export const UsageSummary = ({ profile, savedRecipesCount, onShowPaywall }: Props) => {
    const { language } = useLanguage();
    const en = language === 'en';
    const [expanded, setExpanded] = useState(false);
    const [, refresh] = useState(0);

    // Keep allowances current when returning to the app or crossing a daily reset.
    useEffect(() => {
        const update = () => refresh(value => value + 1);
        const timer = setInterval(update, 60000);
        const listener = AppState.addEventListener('change', state => {
            if (state === 'active') update();
        });
        return () => { clearInterval(timer); listener.remove(); };
    }, []);

    const remaining = SubscriptionService.getRemainingUsage(profile, savedRecipesCount);
    const limits = SubscriptionService.LIMITS.FREE;
    const rows = [
        { label: en ? 'Recipes · today' : 'Receitas · hoje', value: remaining.recipes, total: limits.RECIPES_PER_DAY },
        { label: en ? 'Photo transformations · today' : 'Desejos com foto · hoje', value: remaining.desires, total: limits.DESIRES_PER_DAY },
        { label: en ? 'Pantry scans · 7 days' : 'Scans da despensa · 7 dias', value: remaining.pantry, total: limits.PANTRY_SCANS_PER_WEEK },
        { label: en ? 'Meal plans · 7 days' : 'Planos alimentares · 7 dias', value: remaining.plans, total: limits.WEEKLY_PLANS_PER_WEEK },
        { label: en ? 'Space for saved recipes' : 'Espaço para receitas salvas', value: remaining.saved, total: limits.SAVED_RECIPES },
    ];

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.header}
                activeOpacity={0.65}
                accessibilityRole="button"
                accessibilityLabel={en ? 'View plan and usage' : 'Ver plano e utilização'}
                accessibilityState={{ expanded }}
                onPress={() => setExpanded(value => !value)}
            >
                <View style={styles.plan}>
                    <View style={[styles.dot, profile.isPro && styles.proDot]} />
                    <Text style={styles.planText}>{profile.isPro ? 'Fitswap Pro' : en ? 'Free plan' : 'Plano gratuito'}</Text>
                </View>
                <Text style={styles.toggle}>{en ? 'My usage' : 'Meu uso'}  {expanded ? '−' : '+'}</Text>
            </TouchableOpacity>
            {expanded && (
                <View style={styles.details}>
                    {profile.isPro ? (
                        <Text style={styles.note}>{en ? 'Your Pro plan includes unlimited use of these features.' : 'Seu plano Pro inclui uso ilimitado destes recursos.'}</Text>
                    ) : (
                        <>
                            <Text style={styles.eyebrow}>{en ? 'AVAILABLE' : 'DISPONÍVEL'}</Text>
                            {rows.map(row => (
                                <View key={row.label} style={styles.row}>
                                    <Text style={styles.label}>{row.label}</Text>
                                    <Text style={styles.value}>{row.value}<Text style={styles.total}> / {row.total}</Text></Text>
                                </View>
                            ))}
                            <Text style={styles.note}>{en
                                ? 'Daily allowances renew at 00:00 UTC. The 7-day window resets after 7 days since the last use of each feature.'
                                : 'As cotas diárias renovam à 0h UTC. O período de 7 dias reinicia após 7 dias do último uso de cada recurso.'}</Text>
                            <TouchableOpacity accessibilityRole="button" onPress={onShowPaywall} style={styles.upgrade} activeOpacity={0.65}>
                                <Text style={styles.upgradeText}>{en ? 'Explore Fitswap Pro' : 'Conhecer o Fitswap Pro'}  ↗</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginTop: -8, marginBottom: 20, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E5E7EB' },
    header: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 8 },
    plan: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
    dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#9CA3AF' },
    proDot: { backgroundColor: '#65852B' },
    planText: { fontSize: 12, fontWeight: '500', color: '#6B7280', flexShrink: 1 },
    toggle: { fontSize: 12, fontWeight: '500', color: '#6B7280' },
    details: { paddingTop: 10, paddingBottom: 12 },
    eyebrow: { fontSize: 10, fontWeight: '600', letterSpacing: 1.4, color: '#6B7280', marginBottom: 12 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16, paddingVertical: 7 },
    label: { fontSize: 13, color: '#6B7280', flex: 1 },
    value: { fontSize: 13, fontWeight: '600', fontVariant: ['tabular-nums'], color: '#374151' },
    total: { fontWeight: '400', color: '#6B7280' },
    note: { fontSize: 11, lineHeight: 17, color: '#6B7280', marginTop: 10 },
    upgrade: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start', marginTop: 4 },
    upgradeText: { fontSize: 12, fontWeight: '600', color: '#4B5563' },
});
