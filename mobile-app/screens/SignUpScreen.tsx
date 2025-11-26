import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { saveUserProfile } from '../services/userService';
import { UserProfile, UserGoal, ActivityLevel, AppUsageMode, SubscriptionPlan } from '../types';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon, UserIcon } from '../components/Icons';

export const SignUpScreen = ({ onNavigateToLogin, initialProfile }: { onNavigateToLogin: () => void, initialProfile?: UserProfile | null }) => {
    const [name, setName] = useState(initialProfile?.name === 'Atleta' ? '' : (initialProfile?.name || ''));
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            Alert.alert('Erro', 'Preencha todos os campos');
            return;
        }

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const uid = userCredential.user.uid;

            // Use initialProfile if available, otherwise create default
            const baseProfile: UserProfile = initialProfile || {
                name: name,
                email: email,
                goal: UserGoal.LOSE_WEIGHT,
                activityLevel: ActivityLevel.MEDIUM,
                mealsPerDay: 3,
                mealSlots: ['Café', 'Almoço', 'Jantar'],
                dietaryRestrictions: [],
                dislikes: [],
                usageModes: [AppUsageMode.FIT_SWAP],
                plan: SubscriptionPlan.FREE,
                isPro: false,
                usageStats: {
                    recipesGeneratedToday: 0,
                    lastGenerationDate: new Date().toISOString(),
                    desiresTransformedToday: 0,
                    lastDesireDate: new Date().toISOString(),
                    pantryScansThisWeek: 0,
                    lastScanDate: new Date().toISOString(),
                    savedRecipesCount: 0
                }
            };

            // Sanitize profile to remove undefined values (Firestore doesn't like them)
            const newProfile: UserProfile = {
                ...baseProfile,
                name: name, // Use the name from input
            };

            // Ensure no undefined values
            const cleanProfile = JSON.parse(JSON.stringify(newProfile));

            await saveUserProfile(uid, cleanProfile);
            // Auth state listener in App.tsx will handle navigation
        } catch (error: any) {
            console.error(error);
            let msg = "Falha ao criar conta.";
            if (error.code === 'auth/email-already-in-use') msg = "Email já está em uso.";
            if (error.code === 'auth/invalid-email') msg = "Email inválido.";
            if (error.code === 'auth/weak-password') msg = "Senha muito fraca (min. 6 caracteres).";
            Alert.alert('Erro', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.authContainer}>
            <View style={styles.authContent}>
                <View style={styles.logoContainer}>
                    <Text style={styles.authTitle}>Crie sua conta</Text>
                    <Text style={styles.authSubtitle}>
                        {initialProfile ? `Quase lá! Salve seu plano.` : 'Comece sua jornada saudável'}
                    </Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <UserIcon size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Nome completo"
                            value={name}
                            onChangeText={setName}
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <MailIcon size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                    </View>

                    <View style={styles.inputContainer}>
                        <LockIcon size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder="Senha (min. 6 caracteres)"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            {showPassword ? <EyeOffIcon size={20} color="#9CA3AF" /> : <EyeIcon size={20} color="#9CA3AF" />}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: '#a6f000' }]}
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="black" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <Text style={[styles.primaryButtonText, { color: 'black' }]}>Criar conta</Text>
                                <ArrowRightIcon size={20} color="black" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Já tem uma conta?</Text>
                    <TouchableOpacity onPress={onNavigateToLogin}>
                        <Text style={[styles.linkText, { color: 'black' }]}>Fazer login</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    authContainer: {
        flex: 1,
        backgroundColor: '#FAFAFA',
        justifyContent: 'center',
    },
    authContent: {
        padding: 24,
        width: '100%',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    authTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1F2937',
        marginBottom: 8,
        textAlign: 'center',
    },
    authSubtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
    },
    form: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 56,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#1F2937',
    },
    eyeIcon: {
        padding: 4,
    },
    primaryButton: {
        backgroundColor: 'black',
        height: 56,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    buttonContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    primaryButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
    footer: {
        marginTop: 32,
        alignItems: 'center',
    },
    footerText: {
        color: '#6B7280',
        fontSize: 14,
        marginBottom: 4,
    },
    linkText: {
        color: '#a6f000',
        fontSize: 16,
        fontWeight: '700',
    },
});
