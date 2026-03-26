// In-App Purchase Service
// Handles StoreKit integration for iOS subscriptions using react-native-iap
// Auto-detects environment: Mock mode for Expo Go/Dev, Real IAP for Production

import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import * as RNIAP from 'react-native-iap';

// Product IDs - MUST match exactly what's configured in App Store Connect
export const PRODUCT_IDS = {
    MONTHLY: 'Plano_Pro_Nutriverse',  // Match App Store Connect: Plano Pro - Mensal
    YEARLY: 'Plano_Pro_Anual',        // Match App Store Connect: Plano Pro - Anual
};

export interface PurchaseResult {
    success: boolean;
    productId?: string;
    transactionReceipt?: string;
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

// Mock products for development (used when RNIAP fails or in Expo Go)
const MOCK_PRODUCTS: any[] = [
    {
        productId: PRODUCT_IDS.MONTHLY,
        title: 'Plano Pro - Mensal',
        description: 'Acesso ilimitado a todas as funcionalidades por 1 mês',
        localizedPrice: 'R$ 19,90',
        type: 'subs'
    },
    {
        productId: PRODUCT_IDS.YEARLY,
        title: 'Plano Pro - Anual',
        description: 'Acesso ilimitado a todas as funcionalidades por 1 ano (economize 50%)',
        localizedPrice: 'R$ 179,90',
        type: 'subs'
    }
];

class IAPService {
    private isInitialized = false;
    private initializingPromise: Promise<boolean> | null = null;
    private products: RNIAP.Product[] = [];
    private useMockMode = false;
    private purchaseUpdateSubscription: any = null;
    private purchaseErrorSubscription: any = null;
    private pendingPurchasePromise: { resolve: (res: PurchaseResult) => void, productId: string } | null = null;

    /**
     * Initialize IAP connection
     */
    async initialize(): Promise<boolean> {
        if (this.isInitialized) return true;
        // Prevent concurrent initializations
        if (this.initializingPromise) return this.initializingPromise;
        this.initializingPromise = this._doInitialize();
        const result = await this.initializingPromise;
        this.initializingPromise = null;
        return result;
    }

    private async _doInitialize(): Promise<boolean> {
        try {
            if (this.isInitialized) return true;

            const isExpoGo =
                Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
                Constants.appOwnership === 'expo';
            this.useMockMode = isExpoGo;

            if (isExpoGo) {
                console.log('🎭 IAP: Running in Expo Go - Using Mock Mode');
                this.isInitialized = true;
                return true;
            }

            console.log('💳 IAP: Initializing react-native-iap...');
            await RNIAP.initConnection();
            
            // Setup Listeners
            this.setupListeners();
            
            this.isInitialized = true;
            await this.loadProducts();
            
            return true;
        } catch (error) {
            console.error('IAP: Failed to initialize', error);
            this.useMockMode = true; // Fallback to mock if init fails (likely development)
            return false;
        }
    }

    private setupListeners() {
        if (this.purchaseUpdateSubscription) return;

        this.purchaseUpdateSubscription = RNIAP.purchaseUpdatedListener(async (purchase: RNIAP.Purchase) => {
            console.log('IAP: Purchase updated', purchase.productId || (purchase as any).productIds?.[0]);
            
            const receipt = (purchase as any).transactionReceipt || purchase.transactionId;
            const normalizedTransactionId = purchase.transactionId ?? undefined;
            const normalizedOriginalTransactionId =
                (purchase as any).originalTransactionIdIOS ?? purchase.transactionId ?? undefined;
            if (receipt) {
                try {
                    // Tell the store that we have delivered what has been paid for
                    await RNIAP.finishTransaction({ purchase, isConsumable: false });
                    
                    if (this.pendingPurchasePromise && this.pendingPurchasePromise.productId === (purchase.productId || (purchase as any).productIds?.[0])) {
                        this.pendingPurchasePromise.resolve({
                            success: true,
                            productId: purchase.productId || (purchase as any).productIds?.[0],
                            transactionReceipt: receipt,
                            transactionId: normalizedTransactionId,
                            originalTransactionId: normalizedOriginalTransactionId
                        });
                        this.pendingPurchasePromise = null;
                    }
                } catch (ackErr) {
                    console.warn('IAP: Ack Error', ackErr);
                }
            }
        });

        this.purchaseErrorSubscription = RNIAP.purchaseErrorListener((error: RNIAP.PurchaseError) => {
            console.warn('IAP: Purchase error', error);
            if (this.pendingPurchasePromise) {
                this.pendingPurchasePromise.resolve({
                    success: false,
                    error: error.message || 'Erro ao processar compra'
                });
                this.pendingPurchasePromise = null;
            }
        });
    }

    async loadProducts(): Promise<void> {
        if (this.useMockMode) {
            this.products = MOCK_PRODUCTS as any;
            return;
        }

        try {
            const skus = Object.values(PRODUCT_IDS);
            const items = await RNIAP.fetchProducts({ skus, type: 'subs' }) || [];
            this.products = items as any;
            console.log('IAP: Loaded products:', items.map((i: any) => i.productId || i.id));
        } catch (err) {
            console.error('IAP: Error loading products', err);
        }
    }

    async purchaseProduct(productId: string): Promise<PurchaseResult> {
        if (!this.isInitialized) await this.initialize();

        if (this.useMockMode) {
            console.log('🎭 IAP: Mock purchase starting for', productId);
            return new Promise(resolve => setTimeout(() => resolve({
                success: true,
                productId,
                transactionReceipt: 'MOCK_RECEIPT',
                transactionId: 'MOCK_ID'
            }), 1000));
        }

        const PURCHASE_TIMEOUT_MS = 60_000;

        return new Promise(async (resolve) => {
            this.pendingPurchasePromise = { resolve, productId };

            const timeout = setTimeout(() => {
                if (this.pendingPurchasePromise?.productId === productId) {
                    this.pendingPurchasePromise = null;
                    resolve({ success: false, error: 'Tempo limite excedido. Tente novamente.' });
                }
            }, PURCHASE_TIMEOUT_MS);

            const resolveOnce = (result: PurchaseResult) => {
                clearTimeout(timeout);
                resolve(result);
            };

            // Replace the resolve in pendingPurchasePromise so the listener uses resolveOnce
            this.pendingPurchasePromise = { resolve: resolveOnce, productId };

            try {
                await RNIAP.requestPurchase({
                    type: 'subs',
                    request: {
                        ios: { sku: productId },
                        android: { skus: [productId] }
                    }
                });
            } catch (err: any) {
                clearTimeout(timeout);
                this.pendingPurchasePromise = null;
                resolve({ success: false, error: err.message });
            }
        });
    }

    async checkSubscriptionStatus(): Promise<SubscriptionStatusResult> {
        if (this.useMockMode) return { isActive: false, verificationState: 'verified_inactive' };

        try {
            const purchases = await RNIAP.getAvailablePurchases();

            for (const purchase of purchases) {
                if (purchase.productId === PRODUCT_IDS.MONTHLY || purchase.productId === PRODUCT_IDS.YEARLY) {
                    return {
                        isActive: true,
                        productId: (purchase as any).productId || (purchase as any).productIds?.[0],
                        transactionId: purchase.transactionId ?? undefined,
                        originalTransactionId: (purchase as any).originalTransactionIdIOS ?? purchase.transactionId ?? undefined,
                        transactionReceipt: (purchase as any).transactionReceipt || purchase.transactionId || undefined,
                        verificationState: 'verified_active'
                    };
                }
            }
            return { isActive: false, verificationState: 'verified_inactive' };
        } catch (err) {
            console.error('IAP: Check status error', err);
            return { isActive: false, verificationState: 'unknown' };
        }
    }

    async restorePurchases(): Promise<PurchaseResult> {
        if (!this.isInitialized) await this.initialize();
        const status = await this.checkSubscriptionStatus();
        if (status.isActive) {
            return {
                success: true,
                productId: status.productId,
                transactionReceipt: status.transactionReceipt,
                transactionId: status.transactionId
            };
        }
        return { success: false, error: 'Nenhuma assinatura ativa encontrada' };
    }

    getAllProducts() { return this.products; }
    
    formatPrice(productId: string): string {
        const p = this.products.find((i: any) => (i.productId === productId || i.id === productId));
        return p ? (p as any).localizedPrice || (p as any).displayPrice || 'R$ 0,00' : 'Carregando...';
    }

    async disconnect() {
        if (this.purchaseUpdateSubscription) {
            this.purchaseUpdateSubscription.remove();
            this.purchaseUpdateSubscription = null;
        }
        if (this.purchaseErrorSubscription) {
            this.purchaseErrorSubscription.remove();
            this.purchaseErrorSubscription = null;
        }
        if (!this.useMockMode) {
            await RNIAP.endConnection();
        }
        this.isInitialized = false;
    }
}

export const iapService = new IAPService();
