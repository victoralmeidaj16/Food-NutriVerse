import { useState } from 'react';
import { getUserProfile, saveUserProfile, updateUserProfile, deleteUserData } from '../services/userService';
import { storageService } from '../services/storage';
import { signOut } from 'firebase/auth';
import { auth } from '../services/firebaseConfig';
import { UserProfile, Recipe, WeeklyPlan, UserList, UserGoal, ActivityLevel, AppUsageMode, SubscriptionPlan } from '../types';

export const DEFAULT_PROFILE: UserProfile = {
    name: 'Usuário',
    goal: UserGoal.LOSE_WEIGHT,
    activityLevel: ActivityLevel.MEDIUM,
    mealsPerDay: 3,
    mealSlots: ['Café', 'Almoço', 'Jantar'],
    dietaryRestrictions: [],
    dislikes: [],
    usageModes: [AppUsageMode.FIT_SWAP],
    plan: SubscriptionPlan.FREE,
    isPro: false,
    usageStats: {
        recipesGeneratedToday: 0,
        lastGenerationDate: new Date().toISOString(),
        desiresTransformedToday: 0,
        lastDesireDate: new Date().toISOString(),
        pantryScansThisWeek: 0,
        lastScanDate: new Date().toISOString(),
        savedRecipesCount: 0,
        weeklyPlansGeneratedThisWeek: 0,
        lastPlanGenerationDate: new Date().toISOString(),
    },
};

export function useUserData() {
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [user, setUser] = useState<{ name: string } | null>(null);
    const [savedRecipes, setSavedRecipes] = useState<Set<string>>(new Set());
    const [fullSavedRecipes, setFullSavedRecipes] = useState<Recipe[]>([]);
    const [userLists, setUserLists] = useState<UserList[]>([]);
    const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
    const [weeklyPlan, setWeeklyPlanState] = useState<WeeklyPlan | null>(null);

    const loadUserSpecificData = async (uid: string): Promise<UserProfile | null> => {
        try {
            let finalProfile: UserProfile | null = null;
            const profile = await getUserProfile(uid);

            if (profile) {
                setUserProfile(profile);
                setUser({ name: profile.name });
                await storageService.saveProfile(profile);
                finalProfile = profile;
            } else {
                const localProfile = await storageService.loadProfile();
                if (localProfile) {
                    setUserProfile(localProfile);
                    setUser({ name: localProfile.name });
                    await saveUserProfile(uid, localProfile);
                    finalProfile = localProfile;
                } else {
                    await saveUserProfile(uid, DEFAULT_PROFILE);
                    await storageService.saveProfile(DEFAULT_PROFILE);
                    setUserProfile(DEFAULT_PROFILE);
                    setUser({ name: DEFAULT_PROFILE.name });
                    finalProfile = DEFAULT_PROFILE;
                }
            }

            const plan = await storageService.loadWeeklyPlan();

            if (profile) {
                if (profile.recipeHistory) {
                    setGeneratedRecipes(profile.recipeHistory);
                    await storageService.saveHistory(profile.recipeHistory);
                } else {
                    setGeneratedRecipes(await storageService.loadHistory());
                }

                if (profile.savedRecipes) {
                    setSavedRecipes(new Set(profile.savedRecipes));
                    await storageService.saveSavedRecipes(profile.savedRecipes);
                } else {
                    setSavedRecipes(new Set(await storageService.loadSavedRecipes()));
                }

                if (profile.userLists) {
                    setUserLists(profile.userLists);
                    await storageService.saveUserLists(profile.userLists);
                } else {
                    setUserLists(await storageService.loadUserLists());
                }

                if (profile.weeklyPlan) {
                    setWeeklyPlanState(profile.weeklyPlan);
                    await storageService.saveWeeklyPlan(profile.weeklyPlan);
                } else if (plan) {
                    setWeeklyPlanState(plan);
                }
            } else {
                setGeneratedRecipes(await storageService.loadHistory());
                setSavedRecipes(new Set(await storageService.loadSavedRecipes()));
                setUserLists(await storageService.loadUserLists());
                setWeeklyPlanState(plan ?? null);
            }

            setFullSavedRecipes(await storageService.loadFullSavedRecipes());
            return finalProfile;
        } catch (error) {
            console.error('Error loading user specific data:', error);
            return null;
        }
    };

    const handleSaveRecipe = async (recipe: Recipe, firebaseUid?: string) => {
        const newSavedIds = new Set(savedRecipes);
        let newFullRecipes = [...fullSavedRecipes];

        if (newSavedIds.has(recipe.id)) {
            newSavedIds.delete(recipe.id);
            newFullRecipes = newFullRecipes.filter(r => r.id !== recipe.id);
        } else {
            newSavedIds.add(recipe.id);
            if (!newFullRecipes.find(r => r.id === recipe.id)) {
                newFullRecipes.push(recipe);
            }
        }

        setSavedRecipes(newSavedIds);
        setFullSavedRecipes(newFullRecipes);
        await storageService.saveSavedRecipes(Array.from(newSavedIds));
        await storageService.saveFullSavedRecipes(newFullRecipes);

        if (userProfile && firebaseUid) {
            await updateUserProfile(firebaseUid, { savedRecipes: Array.from(newSavedIds) });
        }
    };

    const handleUpdateHistory = async (recipes: Recipe[], firebaseUid?: string) => {
        setGeneratedRecipes(recipes);
        await storageService.saveHistory(recipes);
        if (firebaseUid) {
            await updateUserProfile(firebaseUid, { recipeHistory: recipes });
        }
    };

    const handleUpdateLists = async (lists: UserList[], firebaseUid?: string) => {
        setUserLists(lists);
        await storageService.saveUserLists(lists);
        if (firebaseUid) {
            await updateUserProfile(firebaseUid, { userLists: lists });
        }
    };

    const handleUpdateProfile = async (profile: UserProfile, firebaseUid?: string) => {
        setUserProfile(profile);
        setUser({ name: profile.name });
        if (firebaseUid) {
            await updateUserProfile(firebaseUid, profile);
            await storageService.saveProfile(profile);
        }
    };

    const handleAddToPlan = async (recipe: Recipe, dayIndex: number, slotIndex: number, firebaseUid?: string) => {
        if (!weeklyPlan) return;
        const newPlan = { ...weeklyPlan };
        const recipeInstance = { ...recipe, id: Math.random().toString(36).substr(2, 9) };
        newPlan.days[dayIndex].meals[slotIndex].recipe = recipeInstance;
        setWeeklyPlanState(newPlan);
        await storageService.saveWeeklyPlan(newPlan);
        if (firebaseUid) {
            await updateUserProfile(firebaseUid, { weeklyPlan: newPlan });
        }
    };

    const setWeeklyPlan = async (plan: WeeklyPlan | null, firebaseUid?: string) => {
        setWeeklyPlanState(plan);
        await storageService.saveWeeklyPlan(plan);
        if (firebaseUid) {
            await updateUserProfile(firebaseUid, { weeklyPlan: plan || undefined });
        }
    };

    const handleLogout = async () => {
        try {
            await storageService.clearAll();
            await signOut(auth);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const clearUserData = () => {
        setUser(null);
        setUserProfile(null);
        setSavedRecipes(new Set());
        setFullSavedRecipes([]);
        setUserLists([]);
        setWeeklyPlanState(null);
        setGeneratedRecipes([]);
    };

    return {
        userProfile, setUserProfile,
        user, setUser,
        savedRecipes,
        fullSavedRecipes,
        userLists,
        generatedRecipes,
        weeklyPlan,
        loadUserSpecificData,
        handleSaveRecipe,
        handleUpdateHistory,
        handleUpdateLists,
        handleUpdateProfile,
        handleAddToPlan,
        setWeeklyPlan,
        handleLogout,
        clearUserData,
    };
}
