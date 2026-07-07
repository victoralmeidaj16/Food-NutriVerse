import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesOffering, CustomerInfo } from 'react-native-purchases';
import Constants, { ExecutionEnvironment } from 'expo-constants';

// Configurações e Identificadores do RevenueCat
export const REVENUECAT_API_KEYS = {
    IOS: 'appl_CDZEKMCNJiwTmzQcwHBmvqWHIta',
    ANDROID: 'appl_CDZEKMCNJiwTmzQcwHBmvqWHIta' // Substitua pela Android API Key se for lançar na Play Store
};

// Entitlements definidos no Painel do RevenueCat
export const ENTITLEMENTS = {
    PRO: 'Fitswap Pro'
};

// IDs dos Produtos que devem bater com o App Store Connect / Play Store e RevenueCat
export const PRODUCT_IDS = {
    MONTHLY: 'monthly',
    YEARLY: 'yearly'
};

export interface PurchaseResult {
    success: boolean;
    productId?: string;
    transactionReceipt?: string; // RevenueCat abstracts this, but kept for compatibility
    transactionId?: string;
    originalTransactionId?: string;
    error?: string;
}

export interface SubscriptionStatusResult {
    isActive: boolean;
    productId?: string;
    expiryDate?: number;
    transactionReceipt?: string;
    transactionId?: string;
    originalTransactionId?: string;
    verificationState: 'verified_active' | 'verified_inactive' | 'unknown';
}

class RevenueCatService {
    private isInitialized = false;
    private useMockMode = false;

    /**
     * Inicializa o RevenueCat SDK
     */
    async initialize(userId?: string): Promise<boolean> {
        if (this.isInitialized) return true;

        try {
            // Verifica se está rodando em Expo Go (Mock) ou Build Nativa (Produção/Dev Client)
            const isExpoGo =
                Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
                Constants.appOwnership === 'expo';
            this.useMockMode = isExpoGo;

            if (isExpoGo) {
                console.log('🎭 RevenueCat: Executando em Expo Go - Modo Mock Ativo');
                this.isInitialized = true;
                return true;
            }

            // Habilita logs detalhados em desenvolvimento
            if (__DEV__) {
                Purchases.setLogLevel(LOG_LEVEL.VERBOSE);
            } else {
                Purchases.setLogLevel(LOG_LEVEL.ERROR);
            }

            const apiKey = Platform.select({
                ios: REVENUECAT_API_KEYS.IOS,
                android: REVENUECAT_API_KEYS.ANDROID,
                default: ''
            });

            if (!apiKey) {
                console.warn('RevenueCat: Chave de API não configurada para esta plataforma.');
                return false;
            }

            // Configura o SDK
            Purchases.configure({ apiKey, appUserID: userId });
            console.log(`💳 RevenueCat: Inicializado com sucesso para o usuário: ${userId || 'Anonimo'}`);
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('RevenueCat: Falha ao inicializar o SDK', error);
            this.useMockMode = true; // Fallback mock em caso de erro crítico
            return false;
        }
    }

    /**
     * Faz login do usuário (essencial para sincronizar compras e rastreamento de afiliados)
     */
    async login(userId: string): Promise<CustomerInfo | null> {
        if (this.useMockMode) return null;
        if (!this.isInitialized) await this.initialize();
        try {
            const { customerInfo } = await Purchases.logIn(userId);
            return customerInfo;
        } catch (error) {
            console.error('RevenueCat: Erro ao fazer login do usuário', error);
            return null;
        }
    }

    /**
     * Faz logout
     */
    async logout(): Promise<void> {
        if (this.useMockMode) return;
        try {
            await Purchases.logOut();
        } catch (error) {
            console.error('RevenueCat: Erro ao efetuar logout', error);
        }
    }

    /**
     * Retorna a oferta ativa (Offerings) contendo os pacotes configurados
     */
    async getActiveOffering(): Promise<PurchasesOffering | null> {
        if (this.useMockMode) return null;
        if (!this.isInitialized) await this.initialize();
        try {
            const offerings = await Purchases.getOfferings();
            return offerings.current;
        } catch (error) {
            console.error('RevenueCat: Erro ao buscar ofertas disponíveis', error);
            return null;
        }
    }

    /**
     * Compra um pacote do RevenueCat
     */
    async purchasePackage(pack: any): Promise<PurchaseResult> {
        if (this.useMockMode) {
            console.log('🎭 RevenueCat: Mock de compra iniciado para', pack.product?.identifier);
            return new Promise(resolve => setTimeout(() => resolve({
                success: true,
                productId: pack.product?.identifier || PRODUCT_IDS.YEARLY,
                transactionReceipt: 'MOCK_RC_RECEIPT',
                transactionId: 'MOCK_RC_TX_ID',
                originalTransactionId: 'MOCK_RC_ORIG_TX_ID'
            }), 1000));
        }

        try {
            const { customerInfo, transaction } = await Purchases.purchasePackage(pack);
            const isPro = customerInfo.entitlements.active[ENTITLEMENTS.PRO] !== undefined;

            if (isPro) {
                return {
                    success: true,
                    productId: transaction.productIdentifier,
                    transactionId: transaction.transactionIdentifier,
                    originalTransactionId: transaction.transactionIdentifier, // RC normaliza IDs
                    transactionReceipt: 'REVENUECAT_MANAGED'
                };
            }
            return { success: false, error: 'Compra concluída mas o acesso premium não foi ativado.' };
        } catch (error: any) {
            if (error.userCancelled) {
                return { success: false, error: 'Compra cancelada pelo usuário.' };
            }
            console.error('RevenueCat: Erro na compra do pacote', error);
            return { success: false, error: error.message || 'Erro ao realizar transação.' };
        }
    }

    /**
     * Verifica o status da assinatura ativa do usuário
     */
    async checkSubscriptionStatus(): Promise<SubscriptionStatusResult> {
        if (this.useMockMode) {
            return { isActive: false, verificationState: 'verified_inactive' };
        }

        try {
            if (!this.isInitialized) await this.initialize();
            const customerInfo = await Purchases.getCustomerInfo();
            const entitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];

            if (entitlement) {
                const expiryDate = entitlement.expirationDate ? new Date(entitlement.expirationDate).getTime() : undefined;
                return {
                    isActive: true,
                    productId: entitlement.productIdentifier,
                    expiryDate,
                    transactionId: entitlement.latestPurchaseDate, // Use data ou id correspondente
                    originalTransactionId: entitlement.originalPurchaseDate,
                    transactionReceipt: 'REVENUECAT_MANAGED',
                    verificationState: 'verified_active'
                };
            }

            return { isActive: false, verificationState: 'verified_inactive' };
        } catch (error) {
            console.error('RevenueCat: Erro ao verificar status da assinatura', error);
            return { isActive: false, verificationState: 'unknown' };
        }
    }

    /**
     * Restaura compras anteriores
     */
    async restorePurchases(): Promise<PurchaseResult> {
        if (this.useMockMode) {
            return { success: false, error: 'Funcionalidade indisponível no simulador Expo Go.' };
        }

        try {
            if (!this.isInitialized) await this.initialize();
            const customerInfo = await Purchases.restorePurchases();
            const entitlement = customerInfo.entitlements.active[ENTITLEMENTS.PRO];

            if (entitlement) {
                return {
                    success: true,
                    productId: entitlement.productIdentifier,
                    transactionReceipt: 'REVENUECAT_MANAGED',
                    transactionId: entitlement.latestPurchaseDate
                };
            }
            return { success: false, error: 'Nenhuma assinatura ativa foi encontrada para restaurar.' };
        } catch (error: any) {
            console.error('RevenueCat: Erro ao restaurar compras', error);
            return { success: false, error: error.message || 'Falha ao restaurar compras.' };
        }
    }

    /**
     * Sincroniza informações de compras com o Firebase/Backend do app
     */
    async getCustomerInfo(): Promise<CustomerInfo | null> {
        if (this.useMockMode) return null;
        try {
            if (!this.isInitialized) await this.initialize();
            return await Purchases.getCustomerInfo();
        } catch (error) {
            console.error('RevenueCat: Erro ao buscar informações do cliente', error);
            return null;
        }
    }

    /**
     * Exibe o Customer Center nativo (Gestão de Assinatura, Cancelamentos e Reclamações)
     */
    presentCustomerCenter(): void {
        if (this.useMockMode) {
            console.log('🎭 RevenueCat: Mock do Customer Center exibido');
            return;
        }
        try {
            // Importação dinâmica para não travar builds antigas
            const { PurchasesCustomerCenter } = require('react-native-purchases-ui');
            PurchasesCustomerCenter.presentCustomerCenter();
        } catch (error) {
            console.error('RevenueCat: Falha ao abrir o Customer Center', error);
        }
    }
}

export const iapService = new RevenueCatService();
export default iapService;
