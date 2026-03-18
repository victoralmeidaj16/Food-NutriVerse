import { BACKEND_URL } from './config';

export interface BackendSubscriptionValidationResult {
    ok: boolean;
    isActive: boolean;
    productId?: string;
    expiryDate?: number;
    transactionId?: string;
    originalTransactionId?: string;
    environment?: string;
    source?: string;
    statusCode?: number;
    gracePeriodExpiresDate?: number;
    autoRenewStatus?: number;
    checkedAt?: string;
    error?: string;
}

export const validateSubscriptionWithBackend = async (params: {
    transactionId?: string;
    originalTransactionId?: string;
}): Promise<BackendSubscriptionValidationResult> => {
    if (!params.transactionId && !params.originalTransactionId) {
        return {
            ok: false,
            isActive: false,
            error: 'Missing transaction identifiers'
        };
    }

    try {
        const response = await fetch(`${BACKEND_URL}/api/apple/validate-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                ok: false,
                isActive: false,
                error: data?.error || `Backend error: ${response.status}`
            };
        }

        return {
            ok: true,
            isActive: !!data?.isActive,
            productId: data?.productId,
            expiryDate: data?.expiryDate,
            transactionId: data?.transactionId,
            originalTransactionId: data?.originalTransactionId,
            environment: data?.environment,
            source: data?.source,
            statusCode: data?.statusCode,
            gracePeriodExpiresDate: data?.gracePeriodExpiresDate,
            autoRenewStatus: data?.autoRenewStatus,
            checkedAt: data?.checkedAt
        };
    } catch (error: any) {
        console.error('Backend subscription validation failed:', error);
        return {
            ok: false,
            isActive: false,
            error: error?.message || 'Failed to validate subscription'
        };
    }
};
