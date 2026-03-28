import { useRef } from 'react';
import { updateUserProfile } from '../services/userService';
import { storageService } from '../services/storage';
import { iapService } from '../services/iapService';
import { validateSubscriptionWithBackend } from '../services/subscriptionValidationService';
import { UserProfile, SubscriptionPlan } from '../types';
import { PRODUCT_IDS } from '../services/iapService';

// --- Pure helpers ---

export const getPlanFromProductId = (productId?: string): SubscriptionPlan => {
    if (productId === PRODUCT_IDS.MONTHLY) return SubscriptionPlan.MONTHLY;
    if (productId === PRODUCT_IDS.YEARLY) return SubscriptionPlan.YEARLY;
    return SubscriptionPlan.FREE;
};

export const getExpiryFromPlan = (plan: SubscriptionPlan, timestamp = Date.now()): string | undefined => {
    const d = new Date(timestamp);
    if (plan === SubscriptionPlan.MONTHLY) { d.setMonth(d.getMonth() + 1); return d.toISOString(); }
    if (plan === SubscriptionPlan.YEARLY) { d.setFullYear(d.getFullYear() + 1); return d.toISOString(); }
    return undefined;
};

export const applySubscriptionToProfile = (
    profile: UserProfile,
    productId?: string,
    transactionReceipt?: string,
    expiryTimestamp?: number,
    transactionId?: string,
    originalTransactionId?: string
): UserProfile => {
    const plan = getPlanFromProductId(productId);
    if (plan === SubscriptionPlan.FREE) return profile;
    return {
        ...profile,
        plan,
        isPro: true,
        subscriptionExpiry: expiryTimestamp ? new Date(expiryTimestamp).toISOString() : getExpiryFromPlan(plan),
        transactionReceipt: transactionReceipt || profile.transactionReceipt,
        subscriptionTransactionId: transactionId || profile.subscriptionTransactionId,
        subscriptionOriginalTransactionId: originalTransactionId || profile.subscriptionOriginalTransactionId,
    };
};

export const removeSubscriptionFromProfile = (profile: UserProfile): UserProfile => ({
    ...profile,
    plan: SubscriptionPlan.FREE,
    isPro: false,
    subscriptionExpiry: undefined,
    transactionReceipt: undefined,
    subscriptionTransactionId: undefined,
    subscriptionOriginalTransactionId: undefined,
});

// --- Hook ---

export function useSubscription(
    setUserProfile: (p: UserProfile) => void,
    setUser: (u: { name: string }) => void
) {
    const pendingProfileRef = useRef<UserProfile | null>(null);
    const signupFlowActiveRef = useRef(false);
    const userProfileRef = useRef<UserProfile | null>(null);

    const persistSubscriptionForUser = async (uid: string, profile: UserProfile) => {
        try {
            await updateUserProfile(uid, {
                isPro: profile.isPro,
                plan: profile.plan,
                subscriptionExpiry: profile.subscriptionExpiry,
                transactionReceipt: profile.transactionReceipt,
                subscriptionTransactionId: profile.subscriptionTransactionId,
                subscriptionOriginalTransactionId: profile.subscriptionOriginalTransactionId,
            });
        } catch (error) {
            console.error('Error persisting subscribed profile:', error);
        }
        // Reconciliation intentionally skipped here to avoid silent downgrade
        // when Apple's receipt validation hasn't propagated yet.
    };

    const reconcileAppleSubscription = async (
        uid: string,
        profile: UserProfile | null,
        baseProfileFallback: UserProfile
    ): Promise<UserProfile | null> => {
        try {
            await iapService.initialize();
            const localStatus = await iapService.checkSubscriptionStatus();
            const baseProfile = profile || baseProfileFallback;

            const applyAndPersist = async (
                productId: string,
                transactionReceipt?: string,
                expiryDate?: number,
                transactionId?: string,
                originalTransactionId?: string
            ): Promise<UserProfile> => {
                const resolved = applySubscriptionToProfile(
                    baseProfile, productId, transactionReceipt, expiryDate, transactionId, originalTransactionId
                );
                const needsUpdate =
                    !profile?.isPro ||
                    profile.plan !== resolved.plan ||
                    profile.subscriptionExpiry !== resolved.subscriptionExpiry ||
                    profile.transactionReceipt !== resolved.transactionReceipt ||
                    profile.subscriptionTransactionId !== resolved.subscriptionTransactionId ||
                    profile.subscriptionOriginalTransactionId !== resolved.subscriptionOriginalTransactionId;

                if (needsUpdate) {
                    await updateUserProfile(uid, {
                        isPro: resolved.isPro,
                        plan: resolved.plan,
                        subscriptionExpiry: resolved.subscriptionExpiry,
                        transactionReceipt: resolved.transactionReceipt,
                        subscriptionTransactionId: resolved.subscriptionTransactionId,
                        subscriptionOriginalTransactionId: resolved.subscriptionOriginalTransactionId,
                    });
                    await storageService.saveProfile(resolved);
                    setUserProfile(resolved);
                    setUser({ name: resolved.name });
                }
                return resolved;
            };

            const validation = await validateSubscriptionWithBackend({
                transactionId: profile?.subscriptionTransactionId || localStatus.transactionId,
                originalTransactionId: profile?.subscriptionOriginalTransactionId || localStatus.originalTransactionId,
            });

            if (!validation.ok) {
                console.warn('Subscription validation skipped:', validation.error);
                if (localStatus.isActive && localStatus.productId) {
                    return await applyAndPersist(
                        localStatus.productId, localStatus.transactionReceipt,
                        localStatus.expiryDate, localStatus.transactionId, localStatus.originalTransactionId
                    );
                }
                return profile || baseProfile;
            }

            if (!validation.isActive || !validation.productId) {
                if (localStatus.isActive && localStatus.productId) {
                    return await applyAndPersist(
                        localStatus.productId, localStatus.transactionReceipt,
                        localStatus.expiryDate, localStatus.transactionId, localStatus.originalTransactionId
                    );
                }
                if (!profile?.isPro) return baseProfile;

                const downgraded = removeSubscriptionFromProfile(baseProfile);
                await updateUserProfile(uid, {
                    isPro: false, plan: SubscriptionPlan.FREE,
                    subscriptionExpiry: undefined, transactionReceipt: undefined,
                    subscriptionTransactionId: undefined, subscriptionOriginalTransactionId: undefined,
                });
                await storageService.saveProfile(downgraded);
                setUserProfile(downgraded);
                setUser({ name: downgraded.name });
                return downgraded;
            }

            return await applyAndPersist(
                validation.productId, baseProfile.transactionReceipt,
                validation.expiryDate, validation.transactionId, validation.originalTransactionId
            );
        } catch (error) {
            console.error('Error reconciling Apple subscription:', error);
            return profile;
        }
    };

    return {
        pendingProfileRef,
        signupFlowActiveRef,
        userProfileRef,
        persistSubscriptionForUser,
        reconcileAppleSubscription,
    };
}
