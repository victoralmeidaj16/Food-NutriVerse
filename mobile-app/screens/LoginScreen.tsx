import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { MailIcon, LockIcon, EyeIcon, EyeOffIcon, ArrowRightIcon } from '../components/Icons';
import { useLanguage } from '../context/LanguageContext';

export const LoginScreen = ({ onNavigateToSignUp }: { onNavigateToSignUp: () => void }) => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert(t('common.error'), t('errors.fillAllFields'));
            return;
        }

        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email.trim(), password);
            // Auth state listener in App.tsx will handle navigation
        } catch (error: any) {
            console.error(error);
            let msg = t('errors.generic');
            if (error.code === 'auth/invalid-email') msg = t('errors.invalidEmail') || "Invalid email.";
            if (error.code === 'auth/user-not-found') msg = t('errors.userNotFound') || "User not found.";
            if (error.code === 'auth/wrong-password') msg = t('errors.wrongPassword') || "Incorrect password.";
            if (error.code === 'auth/invalid-credential') msg = t('errors.invalidCredentials') || "Invalid credentials.";
            Alert.alert(t('common.error'), msg);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) {
            Alert.alert(t('common.error'), t('messages.enterEmailForRecovery'));
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email.trim());
            Alert.alert(t('common.success'), t('messages.passwordResetSent'));
        } catch (error: any) {
            console.error(error);
            let msg = t('errors.generic');
            if (error.code === 'auth/invalid-email') msg = t('errors.invalidEmail') || "Invalid email.";
            if (error.code === 'auth/user-not-found') msg = t('errors.userNotFound') || "User not found.";
            Alert.alert(t('common.error'), msg);
        }
    };

    return (
        <SafeAreaView style={styles.authContainer}>
            <View style={styles.authContent}>
                <View style={styles.logoContainer}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>N</Text>
                    </View>
                    <Text style={styles.authTitle}>{t('auth.welcomeBack')}</Text>
                    <Text style={styles.authSubtitle}>{t('auth.loginSubtitle')}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <MailIcon size={20} color="#9CA3AF" style={styles.inputIcon} />
                        <TextInput
                            style={styles.input}
                            placeholder={t('auth.emailPlaceholder')}
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
                            placeholder={t('auth.passwordPlaceholder')}
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                            {showPassword ? <EyeOffIcon size={20} color="#9CA3AF" /> : <EyeIcon size={20} color="#9CA3AF" />}
                        </TouchableOpacity>
                    </View>

                    <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotPasswordBtn}>
                        <Text style={styles.forgotPasswordText}>{t('auth.forgotPassword')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <View style={styles.buttonContent}>
                                <Text style={styles.primaryButtonText}>{t('auth.loginButton')}</Text>
                                <ArrowRightIcon size={20} color="white" />
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>{t('auth.noAccount')}</Text>
                    <TouchableOpacity onPress={onNavigateToSignUp}>
                        <Text style={styles.linkText}>{t('auth.createAccount')}</Text>
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
    logoCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#a6f000',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 3,
        borderColor: 'rgba(166, 240, 0, 0.2)',
    },
    logoText: {
        fontSize: 32,
        fontWeight: '800',
        color: 'white',
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
    forgotPasswordBtn: {
        alignSelf: 'flex-end',
        marginTop: -8,
    },
    forgotPasswordText: {
        color: '#6B7280',
        fontSize: 14,
        fontWeight: '500',
    },
});
