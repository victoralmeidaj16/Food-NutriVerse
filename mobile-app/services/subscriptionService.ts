import { UserProfile, SubscriptionPlan, UserUsageStats } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'user_profile';

export const SubscriptionService = {
    // Limits
    LIMITS: {
        FREE: {
            RECIPES_PER_DAY: 1,
            DESIRES_PER_DAY: 1,
            SAVED_RECIPES: 1,
            PANTRY_SCANS_PER_WEEK: 2,
            WEEKLY_PLANS_PER_WEEK: 1,
        }
    },

    // Checkers
    canGenerateRecipe: (profile: UserProfile): boolean => {
        if (profile.isPro) return true;

        const today = new Date().toISOString().split('T')[0];
        const lastDate = profile.usageStats.lastGenerationDate.split('T')[0];

        if (today !== lastDate) return true; // New day, reset implicitly
        return profile.usageStats.recipesGeneratedToday < SubscriptionService.LIMITS.FREE.RECIPES_PER_DAY;
    },

    canTransformDesire: (profile: UserProfile): boolean => {
        if (profile.isPro) return true;

        const today = new Date().toISOString().split('T')[0];
        const lastDate = profile.usageStats.lastDesireDate.split('T')[0];

        if (today !== lastDate) return true;
        return profile.usageStats.desiresTransformedToday < SubscriptionService.LIMITS.FREE.DESIRES_PER_DAY;
    },

    canSaveRecipe: (profile: UserProfile): boolean => {
        if (profile.isPro) return true;
        return profile.usageStats.savedRecipesCount < SubscriptionService.LIMITS.FREE.SAVED_RECIPES;
    },

    canScanPantry: (profile: UserProfile): boolean => {
        if (profile.isPro) return true;

        // Simple week check: if last scan was > 7 days ago, reset
        const now = new Date();
        const lastScan = new Date(profile.usageStats.lastScanDate);
        const diffTime = Math.abs(now.getTime() - lastScan.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) return true;
        return profile.usageStats.pantryScansThisWeek < SubscriptionService.LIMITS.FREE.PANTRY_SCANS_PER_WEEK;
    },

    canGenerateWeeklyPlan: (profile: UserProfile): boolean => {
        if (profile.isPro) return true;

        const now = new Date();
        const lastGen = new Date(profile.usageStats.lastPlanGenerationDate || '2000-01-01');
        const diffTime = Math.abs(now.getTime() - lastGen.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) return true;
        return (profile.usageStats.weeklyPlansGeneratedThisWeek || 0) < SubscriptionService.LIMITS.FREE.WEEKLY_PLANS_PER_WEEK;
    },

    // Actions (Return updated profile)
    incrementRecipeCount: (profile: UserProfile): UserProfile => {
        if (profile.isPro) return profile;

        const today = new Date().toISOString();
        const todayDate = today.split('T')[0];
        const lastDate = profile.usageStats.lastGenerationDate.split('T')[0];

        let newCount = profile.usageStats.recipesGeneratedToday + 1;
        if (todayDate !== lastDate) {
            newCount = 1;
        }

        return {
            ...profile,
            usageStats: {
                ...profile.usageStats,
                recipesGeneratedToday: newCount,
                lastGenerationDate: today
            }
        };
    },

    incrementDesireCount: (profile: UserProfile): UserProfile => {
        if (profile.isPro) return profile;

        const today = new Date().toISOString();
        const todayDate = today.split('T')[0];
        const lastDate = profile.usageStats.lastDesireDate.split('T')[0];

        let newCount = profile.usageStats.desiresTransformedToday + 1;
        if (todayDate !== lastDate) {
            newCount = 1;
        }

        return {
            ...profile,
            usageStats: {
                ...profile.usageStats,
                desiresTransformedToday: newCount,
                lastDesireDate: today
            }
        };
    },

    incrementSavedRecipes: (profile: UserProfile): UserProfile => {
        if (profile.isPro) return profile;
        return {
            ...profile,
            usageStats: {
                ...profile.usageStats,
                savedRecipesCount: profile.usageStats.savedRecipesCount + 1
            }
        };
    },

    incrementPantryScan: (profile: UserProfile): UserProfile => {
        if (profile.isPro) return profile;

        const now = new Date();
        const lastScan = new Date(profile.usageStats.lastScanDate);
        const diffTime = Math.abs(now.getTime() - lastScan.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let newCount = profile.usageStats.pantryScansThisWeek + 1;
        if (diffDays > 7) {
            newCount = 1;
        }

        return {
            ...profile,
            usageStats: {
                ...profile.usageStats,
                pantryScansThisWeek: newCount,
                lastScanDate: now.toISOString()
            }
        };
    },

    incrementWeeklyPlanCount: (profile: UserProfile): UserProfile => {
        if (profile.isPro) return profile;

        const now = new Date();
        const lastGen = new Date(profile.usageStats.lastPlanGenerationDate || '2000-01-01');
        const diffTime = Math.abs(now.getTime() - lastGen.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let newCount = (profile.usageStats.weeklyPlansGeneratedThisWeek || 0) + 1;
        if (diffDays > 7) {
            newCount = 1;
        }

        return {
            ...profile,
            usageStats: {
                ...profile.usageStats,
                weeklyPlansGeneratedThisWeek: newCount,
                lastPlanGenerationDate: now.toISOString()
            }
        };
    },

    upgradeToPro: async (profile: UserProfile, plan: SubscriptionPlan.MONTHLY | SubscriptionPlan.YEARLY): Promise<UserProfile> => {
        // Import IAP service
        const { iapService, PRODUCT_IDS } = require('./iapService');

        // Map plan to product ID
        const productId = plan === SubscriptionPlan.MONTHLY
            ? PRODUCT_IDS.MONTHLY
            : PRODUCT_IDS.YEARLY;

        try {
            // Initialize IAP if not already
            await iapService.initialize();

            // Attempt purchase
            const result = await iapService.purchaseProduct(productId);

            if (result.success) {
                // Calculate expiry based on plan
                const now = new Date();
                const expiryDate = plan === SubscriptionPlan.MONTHLY
                    ? new Date(now.setMonth(now.getMonth() + 1))
                    : new Date(now.setFullYear(now.getFullYear() + 1));

                return {
                    ...profile,
                    plan: plan,
                    isPro: true,
                    subscriptionExpiry: expiryDate.toISOString(),
                    transactionReceipt: result.transactionReceipt
                };
            } else {
                // Purchase failed or was cancelled
                console.error('Purchase failed:', result.error);
                throw new Error(result.error || 'Falha na compra');
            }
        } catch (error: any) {
            console.error('upgradeToPro error:', error);
            throw error;
        }
    }
};
