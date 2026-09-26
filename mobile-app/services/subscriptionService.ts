import { UserProfile } from '../types';

// --- Usage window helpers (mirror the reset logic used by the incrementX functions) ---

const dayKey = (iso?: string): string => (iso || '').split('T')[0];

const daysSince = (iso?: string): number => {
    if (!iso) return Infinity;
    const diff = Math.abs(Date.now() - new Date(iso).getTime());
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

// Daily counter: resets when the stored date is not today.
const effectiveDailyCount = (count: number, lastDate?: string): number =>
    dayKey(lastDate) === dayKey(new Date().toISOString()) ? count : 0;

// Weekly counter: resets after 7 days (matches `diffDays > 7` in incrementX).
const effectiveWeeklyCount = (count: number, lastDate?: string): number =>
    daysSince(lastDate) > 7 ? 0 : count;

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

    // Shared with the usage UI so remaining allowances follow enforcement windows.
    getRemainingUsage: (profile: UserProfile, savedRecipesCount: number) => {
        const stats = profile.usageStats;
        const limits = SubscriptionService.LIMITS.FREE;
        const remaining = (limit: number, used: number) => Math.max(0, limit - used);
        return {
            recipes: remaining(limits.RECIPES_PER_DAY, effectiveDailyCount(stats.recipesGeneratedToday, stats.lastGenerationDate)),
            desires: remaining(limits.DESIRES_PER_DAY, effectiveDailyCount(stats.desiresTransformedToday, stats.lastDesireDate)),
            pantry: remaining(limits.PANTRY_SCANS_PER_WEEK, effectiveWeeklyCount(stats.pantryScansThisWeek, stats.lastScanDate)),
            plans: remaining(limits.WEEKLY_PLANS_PER_WEEK, effectiveWeeklyCount(stats.weeklyPlansGeneratedThisWeek || 0, stats.lastPlanGenerationDate)),
            saved: remaining(limits.SAVED_RECIPES, savedRecipesCount),
        };
    },

    // Checkers — free users are allowed until they hit the LIMITS.FREE quota.
    canGenerateRecipe: (profile: UserProfile): boolean => {
        if (profile.isPro) return true;
        return effectiveDailyCount(
            profile.usageStats.recipesGeneratedToday,
            profile.usageStats.lastGenerationDate
        ) < SubscriptionService.LIMITS.FREE.RECIPES_PER_DAY;
    },

    canTransformDesire: (profile: UserProfile): boolean => {
        if (profile.isPro) return true;
        return effectiveDailyCount(
            profile.usageStats.desiresTransformedToday,
            profile.usageStats.lastDesireDate
        ) < SubscriptionService.LIMITS.FREE.DESIRES_PER_DAY;
    },

    canSaveRecipe: (profile: UserProfile): boolean => {
        if (profile.isPro) return true;
        return profile.usageStats.savedRecipesCount < SubscriptionService.LIMITS.FREE.SAVED_RECIPES;
    },

    canScanPantry: (profile: UserProfile): boolean => {
        if (profile.isPro) return true;
        return effectiveWeeklyCount(
            profile.usageStats.pantryScansThisWeek,
            profile.usageStats.lastScanDate
        ) < SubscriptionService.LIMITS.FREE.PANTRY_SCANS_PER_WEEK;
    },

    canGenerateWeeklyPlan: (profile: UserProfile): boolean => {
        if (profile.isPro) return true;
        return effectiveWeeklyCount(
            profile.usageStats.weeklyPlansGeneratedThisWeek || 0,
            profile.usageStats.lastPlanGenerationDate
        ) < SubscriptionService.LIMITS.FREE.WEEKLY_PLANS_PER_WEEK;
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
    }
};
