// In-App Purchase Service
// Handles StoreKit integration for iOS subscriptions
// Auto-detects environment: Mock mode for Expo/Dev, Real IAP for Production

import Constants from 'expo-constants';
import { Platform } from 'react-native';
import type * as IAPTypes from 'expo-in-app-purchases';

// Conditional import - only when not in Expo Go
let InAppPurchases: any = null;
try {
    InAppPurchases = require('expo-in-app-purchases');
} catch (e) {
    console.log('📱 IAP: Running in Expo Go - using mock mode');
}

// Product IDs - MUST match exactly what's configured in App Store Connect
// ⚠️ These match the existing configuration in App Store Connect
export const PRODUCT_IDS = {
    MONTHLY: 'Plano_Pro_Nutriverse',  // Match App Store Connect: Plano Pro - Mensal
    YEARLY: 'Plano_Pro_Anual',        // Match App Store Connect: Plano Pro - Anual
};

export interface PurchaseResult {
    success: boolean;
    productId?: string;
    transactionReceipt?: string;
    error?: string;
}

// Mock products for development
const MOCK_PRODUCTS: any[] = [
    {
        productId: PRODUCT_IDS.MONTHLY,
        title: 'Plano Pro - Mensal',
        description: 'Acesso ilimitado a todas as funcionalidades por 1 mês',
        price: 'R$ 19,90',
        type: 'SUBSCRIPTION',
        subscriptionPeriodIOS: 'P1M'
    },
    {
        productId: PRODUCT_IDS.YEARLY,
        title: 'Plano Pro - Anual',
        description: 'Acesso ilimitado a todas as funcionalidades por 1 ano (economize 50%)',
        price: 'R$ 179,90',
        type: 'SUBSCRIPTION',
        subscriptionPeriodIOS: 'P1Y'
    }
];

class IAPService {
    private isInitialized = false;
    private products: any[] = [];
    private useMockMode = false;

    /**
     * Initialize IAP connection
     * Call this once when app starts
     */
    async initialize(): Promise<boolean> {
        try {
            // Detect environment
            const isExpoGo = Constants.appOwnership === 'expo' || !InAppPurchases;
            const isDevelopment = __DEV__;
            this.useMockMode = isExpoGo || isDevelopment;

            if (this.useMockMode) {
                console.log('🎭 IAP: Using MOCK mode (Expo Go or Development)');
                this.products = MOCK_PRODUCTS;
                this.isInitialized = true;
                return true;
            }

            // Only initialize for iOS in production
            if (Platform.OS !== 'ios') {
                console.log('IAP: Skipping initialization - not iOS');
                return false;
            }

            // Connect to store (production only)
            console.log('💳 IAP: Connecting to REAL App Store...');
            await InAppPurchases.connectAsync();
            this.isInitialized = true;
            console.log('✅ IAP: Successfully connected to App Store');

            // Load products
            await this.loadProducts();

            // Set up purchase listener
            this.setupPurchaseListener();

            return true;
        } catch (error) {
            console.error('IAP: Failed to initialize', error);
            return false;
        }
    }

    /**
     * Load available products from App Store
     */
    private async loadProducts(): Promise<void> {
        try {
            const { results, responseCode } = await InAppPurchases.getProductsAsync(
                Object.values(PRODUCT_IDS)
            );

            if (responseCode === InAppPurchases.IAPResponseCode.OK) {
                this.products = results || [];
                console.log('IAP: Loaded products:', this.products.map(p => p.productId));
            } else {
                console.warn('IAP: Failed to load products, code:', responseCode);
            }
        } catch (error) {
            console.error('IAP: Error loading products', error);
        }
    }

    /**
     * Get product details
     */
    getProduct(productId: string): IAPTypes.IAPItemDetails | undefined {
        return this.products.find(p => p.productId === productId);
    }

    /**
     * Get all available products
     */
    getAllProducts(): IAPTypes.IAPItemDetails[] {
        return this.products;
    }

    /**
     * Purchase a subscription
     */
    async purchaseProduct(productId: string): Promise<PurchaseResult> {
        if (!this.isInitialized) {
            return {
                success: false,
                error: 'IAP not initialized. Please restart the app.'
            };
        }

        // Mock purchase for development
        if (this.useMockMode) {
            console.log('🎭 IAP: MOCK purchase for', productId);
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        success: true,
                        productId,
                        transactionReceipt: `MOCK_RECEIPT_${Date.now()}_${productId}`
                    });
                }, 1500); // Simulate network delay
            });
        }

        try {
            console.log('💳 IAP: Starting REAL purchase for', productId);

            // Start the purchase
            await InAppPurchases.purchaseItemAsync(productId);

            // The actual result will come through the listener
            // Return pending status
            return {
                success: true,
                productId: productId
            };

        } catch (error: any) {
            console.error('IAP: Purchase failed', error);

            // Handle user cancellation
            if (error?.code === 'E_USER_CANCELLED') {
                return {
                    success: false,
                    error: 'Compra cancelada pelo usuário'
                };
            }

            return {
                success: false,
                error: error?.message || 'Erro ao processar compra'
            };
        }
    }

    /**
     * Restore previous purchases
     * Important for users who reinstall the app
     */
    async restorePurchases(): Promise<PurchaseResult> {
        if (!this.isInitialized) {
            return {
                success: false,
                error: 'IAP not initialized'
            };
        }

        // Mock restore for development
        if (this.useMockMode) {
            console.log('🎭 IAP: MOCK restore - no purchases');
            return {
                success: false,
                error: 'Nenhuma compra anterior encontrada (Modo de Desenvolvimento)'
            };
        }

        try {
            console.log('💳 IAP: Restoring REAL purchases');

            const { results } = await InAppPurchases.getPurchaseHistoryAsync();

            if (!results || results.length === 0) {
                return {
                    success: false,
                    error: 'Nenhuma compra anterior encontrada'
                };
            }

            // Find the most recent valid subscription
            const validPurchases = results
                .filter((p: any) => p.acknowledged)
                .sort((a: any, b: any) => b.purchaseTime - a.purchaseTime);

            if (validPurchases.length > 0) {
                const latestPurchase = validPurchases[0];
                return {
                    success: true,
                    productId: latestPurchase.productId,
                    transactionReceipt: latestPurchase.transactionReceipt
                };
            }

            return {
                success: false,
                error: 'Nenhuma assinatura ativa encontrada'
            };

        } catch (error: any) {
            console.error('IAP: Restore failed', error);
            return {
                success: false,
                error: error?.message || 'Erro ao restaurar compras'
            };
        }
    }

    /**
     * Set up listener for purchase events
     */
    private setupPurchaseListener(): void {
        InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }: { responseCode: number, results: IAPTypes.InAppPurchase[], errorCode: any }) => {
            console.log('IAP: Purchase update', { responseCode, errorCode });

            if (responseCode === InAppPurchases.IAPResponseCode.OK && results) {
                for (const purchase of results) {
                    console.log('IAP: Purchase successful', purchase.productId);

                    // Finish the transaction
                    this.finishTransaction(purchase);
                }
            } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
                console.log('IAP: User canceled purchase');
            } else if (responseCode === InAppPurchases.IAPResponseCode.ERROR) {
                console.error('IAP: Purchase error', errorCode);
            }
        });
    }

    /**
     * Finish a transaction (acknowledge the purchase)
     */
    private async finishTransaction(purchase: IAPTypes.InAppPurchase): Promise<void> {
        try {
            await InAppPurchases.finishTransactionAsync(purchase, true);
            console.log('IAP: Transaction finished', purchase.productId);
        } catch (error) {
            console.error('IAP: Failed to finish transaction', error);
        }
    }

    /**
     * Check if user has active subscription
     * This should be called on app startup and after purchases
     */
    async checkSubscriptionStatus(): Promise<{
        isActive: boolean;
        productId?: string;
        expiryDate?: number;
    }> {
        if (this.useMockMode) {
            // In mock mode, we currently don't persist state, so we always return inactive 
            // unless we want to simulate a pro user for testing.
            // For now, let's keep it safe and return inactive, 
            // but you can uncomment the lines below to test "Pro" state in dev.
            /*
            return {
                isActive: true,
                productId: PRODUCT_IDS.YEARLY,
                expiryDate: Date.now() + 1000000000
            };
            */
            return { isActive: false };
        }

        try {
            // Get transaction history
            const { results } = await InAppPurchases.getPurchaseHistoryAsync();

            if (!results || results.length === 0) {
                return { isActive: false };
            }

            // Sort purchases by time (newest first) to check the most recent renewal/purchase
            const sortedPurchases = results.sort((a: any, b: any) => b.purchaseTime - a.purchaseTime);

            const now = Date.now();

            for (const purchase of sortedPurchases) {
                // Must be acknowledged
                if (!purchase.acknowledged) continue;

                // Determine duration based on product ID
                let durationMs = 0;
                if (purchase.productId === PRODUCT_IDS.MONTHLY) {
                    // approximately 31 days to be safe for monthly renewals
                    durationMs = 31 * 24 * 60 * 60 * 1000;
                } else if (purchase.productId === PRODUCT_IDS.YEARLY) {
                    // 366 days for leap year safety
                    durationMs = 366 * 24 * 60 * 60 * 1000;
                } else {
                    // Unknown product, skip
                    continue;
                }

                // Check expiration
                // Note: On iOS, for a robust check, you should ideally validate 'transactionReceipt' 
                // with the App Store Server API. This local check assumes 'purchaseTime' 
                // is updated for renewals, which typically happens when 'getPurchaseHistoryAsync' is called.
                const purchaseTime = purchase.purchaseTime;
                const expirationTime = purchaseTime + durationMs;

                if (expirationTime > now) {
                    // Found a valid, non-expired subscription
                    return {
                        isActive: true,
                        productId: purchase.productId,
                        expiryDate: expirationTime
                    };
                }
            }

            // No active subscription found
            return { isActive: false };

        } catch (error) {
            console.error('IAP: Failed to check subscription status', error);
            return { isActive: false };
        }
    }

    /**
     * Check if running in mock mode
     */
    isInMockMode(): boolean {
        return this.useMockMode;
    }

    /**
     * Get environment description
     */
    getEnvironmentInfo(): string {
        if (this.useMockMode) {
            return '🎭 Modo de Desenvolvimento (Compras Simuladas)';
        }
        return '💳 Modo Produção (Compras Reais - App Store)';
    }

    /**
     * Disconnect from the store
     * Call this when app is closed
     */
    async disconnect(): Promise<void> {
        if (this.isInitialized && !this.useMockMode) {
            await InAppPurchases.disconnectAsync();
            this.isInitialized = false;
            console.log('IAP: Disconnected from App Store');
        }
    }

    /**
     * Format price for display
     */
    formatPrice(productId: string): string {
        const product = this.getProduct(productId);
        if (!product) return 'Carregando...';

        // expo-in-app-purchases provides formatted price
        return product.price || 'R$ 0,00';
    }

    /**
     * Get product title
     */
    getProductTitle(productId: string): string {
        const product = this.getProduct(productId);
        return product?.title || 'Plano Premium';
    }
}

// Export singleton instance
export const iapService = new IAPService();
