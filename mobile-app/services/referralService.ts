import AsyncStorage from '@react-native-async-storage/async-storage';
import { randomUUID } from 'expo-crypto';
import { auth } from './firebaseConfig';
import { AFFILIATES_API_URL } from './config';

export interface CreatorInfo {
    id: string;
    name: string;
    referral_code: string;
    app_id?: string;
}

const STORAGE_KEYS = {
    REFERRAL_CODE: '@fitswap_referral_code',
    PENDING_OWNER: '@fitswap_referral_pending_owner',
    DEVICE_ID: '@fitswap_device_id',
    ATTRIBUTED_UID: '@fitswap_attributed_uid_v2',
    CREATOR_INFO: '@fitswap_creator_info',
};

class ReferralService {
    private cachedDeviceId: string | null = null;

    /**
     * Retorna ou gera um identificador único persistente para este dispositivo
     */
    async getDeviceId(): Promise<string> {
        if (this.cachedDeviceId) return this.cachedDeviceId;

        try {
            let deviceId = await AsyncStorage.getItem(STORAGE_KEYS.DEVICE_ID);
            if (!deviceId) {
                deviceId = randomUUID();
                await AsyncStorage.setItem(STORAGE_KEYS.DEVICE_ID, deviceId);
            }
            this.cachedDeviceId = deviceId;
            return deviceId;
        } catch (error) {
            console.error('❌ [ReferralService] Erro ao obter device_id:', error);
            const fallbackId = randomUUID();
            this.cachedDeviceId = fallbackId;
            return fallbackId;
        }
    }

    /**
     * Extrai o código de indicação a partir de URLs de deep link ou web link
     * Suporta:
     * - fitswap://join/MARI10
     * - fitswap://referral/MARI10
     * - fitswap://?ref=MARI10 ou fitswap://?code=MARI10
     * - https://afiliados-app.vercel.app/join/MARI10
     * - https://afiliados-app.vercel.app/?code=MARI10
     */
    parseReferralCodeFromUrl(url: string): string | null {
        if (!url) return null;

        try {
            const cleanUrl = url.trim();

            // 1. URLs com path: /join/CODIGO ou /referral/CODIGO
            const matchPath = cleanUrl.match(/(?:\/join\/|\/referral\/)([A-Za-z0-9_\-]+)/i);
            if (matchPath && matchPath[1]) {
                return matchPath[1].toUpperCase().trim();
            }

            // 2. URLs com query params: ?code=CODIGO ou ?ref=CODIGO
            const matchParam = cleanUrl.match(/[?&](?:code|ref|referral)=([A-Za-z0-9_\-]+)/i);
            if (matchParam && matchParam[1]) {
                return matchParam[1].toUpperCase().trim();
            }

            // 3. Scheme direto se passar apenas o código (ex: fitswap://CODIGO)
            const schemeMatch = cleanUrl.match(/^fitswap:\/\/([A-Za-z0-9_\-]+)$/i);
            if (schemeMatch && schemeMatch[1] && !['join', 'referral', 'main', 'paywall'].includes(schemeMatch[1].toLowerCase())) {
                return schemeMatch[1].toUpperCase().trim();
            }

            return null;
        } catch (err) {
            console.error('❌ [ReferralService] Erro ao processar URL:', err);
            return null;
        }
    }

    /**
     * Obtém o código de indicação salvo localmente
     */
    async getStoredReferralCode(): Promise<string | null> {
        try {
            const owner = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_OWNER);
            if (owner && owner !== auth.currentUser?.uid) return null;
            return await AsyncStorage.getItem(STORAGE_KEYS.REFERRAL_CODE);
        } catch (error) {
            console.error('❌ [ReferralService] Erro ao carregar referral_code:', error);
            return null;
        }
    }

    /**
     * Obtém as informações do criador salvas localmente
     */
    async getStoredCreatorInfo(): Promise<CreatorInfo | null> {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEYS.CREATOR_INFO);
            return raw ? JSON.parse(raw) : null;
        } catch (error) {
            console.error('❌ [ReferralService] Erro ao carregar creator_info:', error);
            return null;
        }
    }

    /**
     * Salva o código de indicação no storage local
     */
    async setStoredReferralCode(code: string, creatorInfo?: CreatorInfo): Promise<void> {
        const cleanCode = code.toUpperCase().trim();
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.REFERRAL_CODE, cleanCode);
            await AsyncStorage.setItem(STORAGE_KEYS.PENDING_OWNER, auth.currentUser?.uid ?? '');
            if (creatorInfo) {
                await AsyncStorage.setItem(STORAGE_KEYS.CREATOR_INFO, JSON.stringify(creatorInfo));
            }
            console.log(`✅ [ReferralService] Código de indicação armazenado: ${cleanCode}`);
        } catch (error) {
            console.error('❌ [ReferralService] Erro ao salvar referral_code:', error);
        }
    }

    /**
     * Valida um código de afiliado na API
     */
    async validateReferralCode(code: string): Promise<{ valid: boolean; creator?: CreatorInfo; error?: string }> {
        const cleanCode = code.toUpperCase().trim();
        if (!cleanCode) {
            return { valid: false, error: 'Código vazio' };
        }

        try {
            const url = `${AFFILIATES_API_URL}/api/referral/track?code=${encodeURIComponent(cleanCode)}&app_id=fitswap`;
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
            });

            const json = await response.json().catch(() => null);

            if (response.ok && json?.success && json?.data) {
                const creator: CreatorInfo = {
                    id: json.data.id,
                    name: json.data.name,
                    referral_code: json.data.referral_code,
                    app_id: json.data.app_id,
                };
                return { valid: true, creator };
            }

            return { valid: false, error: json?.error || 'Código inválido ou inexistente' };
        } catch (error) {
            console.warn('⚠️ [ReferralService] Erro de rede ao validar código:', error);
            // A validação permanece pendente até o servidor responder.
            return { valid: false, error: 'validation_pending' };
        }
    }

    /**
     * Dispara a atribuição para a API de Afiliados
     */
    async attributeUser(
        userId?: string,
        codeOverride?: string,
        source: 'deep_link' | 'referral_code' | 'first_launch' = 'deep_link'
    ): Promise<{ success: boolean; data?: any; error?: string }> {
        try {
            const currentUser = auth.currentUser;
            if (!currentUser || !userId || currentUser.uid !== userId) return { success: false, error: 'login_required' };
            const referralCode = codeOverride || await this.getStoredReferralCode();
            if (!referralCode) {
                return { success: false, error: 'no_referral_code' };
            }

            // Evitar re-enviar atribuição se este usuário já foi atribuído
            if (userId) {
                const attributedUid = await AsyncStorage.getItem(STORAGE_KEYS.ATTRIBUTED_UID);
                if (attributedUid === userId) {
                    return { success: true, data: { already_attributed: true } };
                }
            }

            const deviceId = await this.getDeviceId();

            console.log(`📡 [ReferralService] Enviando atribuição: code=${referralCode}, userId=${userId || 'none'}, source=${source}`);

            const response = await fetch(`${AFFILIATES_API_URL}/api/referral/track`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${await currentUser.getIdToken()}`,
                },
                body: JSON.stringify({
                    device_id: deviceId,
                    referral_code: referralCode,
                    source,
                    revenuecat_user_id: currentUser.uid,
                    app_id: 'fitswap',
                }),
            });

            const result = await response.json().catch(() => null);

            if (response.ok && result?.success && (result.data?.attributed || result.data?.already_attributed)) {
                console.log('🎉 [ReferralService] Atribuição realizada com sucesso:', result.data);

                if (userId) {
                    await AsyncStorage.setItem(STORAGE_KEYS.ATTRIBUTED_UID, userId);
                    await AsyncStorage.multiRemove([STORAGE_KEYS.REFERRAL_CODE, STORAGE_KEYS.PENDING_OWNER]);
                }

                if (result.data?.creator_name) {
                    const creatorInfo: CreatorInfo = {
                        id: result.data.creator_id,
                        name: result.data.creator_name,
                        referral_code: referralCode,
                        app_id: result.data.app_id || 'fitswap',
                    };
                    await AsyncStorage.setItem(STORAGE_KEYS.CREATOR_INFO, JSON.stringify(creatorInfo));
                }

                return { success: true, data: result.data };
            }

            console.warn('⚠️ [ReferralService] Resposta da API de atribuição:', result);
            return { success: false, error: result?.error || 'Erro na atribuição' };
        } catch (error: any) {
            console.error('❌ [ReferralService] Falha ao enviar requisição de atribuição:', error);
            return { success: false, error: error?.message || 'Falha de conexão' };
        }
    }

    /**
     * Processa um link recebido ao abrir o app
     */
    async handleIncomingUrl(url: string, currentUserId?: string): Promise<string | null> {
        const code = this.parseReferralCodeFromUrl(url);
        if (!code) return null;

        return this.handleReferralCode(code, currentUserId);
    }

    /**
     * Handles a referral received from a verified deep-link provider such as
     * Branch. The code is never displayed or requested from the user.
     */
    async handleReferralCode(code: string, currentUserId?: string): Promise<string | null> {
        const cleanCode = code.trim().toUpperCase();
        if (!/^[A-Z0-9_-]{1,64}$/.test(cleanCode)) return null;

        console.log(`🔗 [ReferralService] Indicação recebida por deep link`);

        // Salvar código localmente
        await this.setStoredReferralCode(cleanCode);

        // Validar e tentar atribuir
        const validation = await this.validateReferralCode(cleanCode);
        if (validation.valid && validation.creator) {
            await this.setStoredReferralCode(cleanCode, validation.creator);
        }

        // Se houver usuário logado, atribui com revenuecat_user_id imediatamente
        await this.attributeUser(currentUserId, cleanCode, 'deep_link');

        return cleanCode;
    }

    /**
     * Verifica e dispara atribuição pendente para um usuário recém-autenticado
     */
    async checkPendingAttribution(userId: string): Promise<void> {
        if (!userId) return;

        const storedCode = await this.getStoredReferralCode();
        if (!storedCode) return;

        const attributedUid = await AsyncStorage.getItem(STORAGE_KEYS.ATTRIBUTED_UID);
        if (attributedUid === userId) return;

        console.log(`🔄 [ReferralService] Verificando atribuição pendente para o usuário: ${userId}`);
        await this.attributeUser(userId, storedCode, 'deep_link');
    }
}

export const referralService = new ReferralService();
