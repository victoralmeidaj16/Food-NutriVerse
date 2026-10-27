import {iapService} from './iapService';
import {referralService,type AttributionAttempt} from './referralService';

export type PurchaseReadinessResult =
    | {status:'ready'}
    | {status:'ready_without_referral'}
    | {status:'retryable_error';message:string}
    | {status:'invalid_referral';message:string};

interface PurchaseServices {
    iap: Pick<typeof iapService,'initialize'|'login'>;
    referrals: Pick<typeof referralService,'checkPendingAttribution'>;
}

export function createPurchaseReadiness({iap,referrals}:PurchaseServices) {
    return async (userId:string):Promise<PurchaseReadinessResult> => {
        if (!userId) return {status:'retryable_error',message:'Entre na sua conta antes de continuar.'};
        if (!await iap.initialize(userId)) return {status:'retryable_error',message:'Não foi possível preparar o pagamento. Tente novamente.'};
        if (!await iap.login(userId)) return {status:'retryable_error',message:'Não foi possível identificar sua conta de pagamento. Tente novamente.'};
        const attribution:AttributionAttempt=await referrals.checkPendingAttribution(userId);
        if (attribution.status==='no_referral') return {status:'ready_without_referral'};
        if (attribution.status==='attributed'||attribution.status==='already_attributed') return {status:'ready'};
        return {status:attribution.status,message:attribution.error};
    };
}

export const preparePurchaseIdentity=createPurchaseReadiness({iap:iapService,referrals:referralService});

export function resolveOnboardingDestination(authenticated:boolean):'SIGNUP'|'AFFILIATE_SETUP' {
    return authenticated?'AFFILIATE_SETUP':'SIGNUP';
}
