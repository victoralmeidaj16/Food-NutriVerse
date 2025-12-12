
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, Recipe, WeeklyPlan, ShoppingList, UserList } from '../types';

const KEYS = {
    USER_PROFILE: '@food_nutriverse_profile',
    SAVED_RECIPES: '@food_nutriverse_saved_recipes',
    WEEKLY_PLAN: '@food_nutriverse_weekly_plan',
    SHOPPING_LIST: '@food_nutriverse_shopping_list',
    RECIPE_HISTORY: '@food_nutriverse_recipe_history',
    USER_LISTS: '@food_nutriverse_user_lists',
};

export const storageService = {
    // --- User Lists ---
    saveUserLists: async (lists: UserList[]) => {
        try {
            await AsyncStorage.setItem(KEYS.USER_LISTS, JSON.stringify(lists));
        } catch (e) {
            console.error('Failed to save user lists', e);
        }
    },

    loadUserLists: async (): Promise<UserList[]> => {
        try {
            const json = await AsyncStorage.getItem(KEYS.USER_LISTS);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('Failed to load user lists', e);
            return [];
        }
    },

    // --- Recipe History ---
    saveHistory: async (recipes: Recipe[]) => {
        try {
            console.log(`💾 Saving history: ${recipes.length} recipes`);
            await AsyncStorage.setItem(KEYS.RECIPE_HISTORY, JSON.stringify(recipes));
            console.log('✅ History saved to storage');
        } catch (e) {
            console.error('❌ Failed to save history', e);
        }
    },

    loadHistory: async (): Promise<Recipe[]> => {
        try {
            const json = await AsyncStorage.getItem(KEYS.RECIPE_HISTORY);
            console.log(`📂 Loaded history: ${json ? 'Found data' : 'Empty'}`);
            const data = json ? JSON.parse(json) : [];
            console.log(`📊 Parsed history: ${data.length} recipes`);
            return data;
        } catch (e) {
            console.error('❌ Failed to load history', e);
            return [];
        }
    },

    // --- User Profile ---
    saveProfile: async (profile: UserProfile) => {
        try {
            await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
        } catch (e) {
            console.error('Failed to save profile', e);
        }
    },

    loadProfile: async (): Promise<UserProfile | null> => {
        try {
            const json = await AsyncStorage.getItem(KEYS.USER_PROFILE);
            return json ? JSON.parse(json) : null;
        } catch (e) {
            console.error('Failed to load profile', e);
            return null;
        }
    },

    // --- Saved Recipes ---
    saveSavedRecipes: async (recipeIds: string[]) => {
        try {
            await AsyncStorage.setItem(KEYS.SAVED_RECIPES, JSON.stringify(recipeIds));
        } catch (e) {
            console.error('Failed to save recipes', e);
        }
    },

    loadSavedRecipes: async (): Promise<string[]> => {
        try {
            const json = await AsyncStorage.getItem(KEYS.SAVED_RECIPES);
            return json ? JSON.parse(json) : [];
        } catch (e) {
            console.error('Failed to load recipes', e);
            return [];
        }
    },

    // --- Weekly Plan ---
    saveWeeklyPlan: async (plan: WeeklyPlan | null) => {
        try {
            if (plan) {
                await AsyncStorage.setItem(KEYS.WEEKLY_PLAN, JSON.stringify(plan));
            } else {
                await AsyncStorage.removeItem(KEYS.WEEKLY_PLAN);
            }
        } catch (e) {
            console.error('Failed to save weekly plan', e);
        }
    },

    loadWeeklyPlan: async (): Promise<WeeklyPlan | null> => {
        try {
            const json = await AsyncStorage.getItem(KEYS.WEEKLY_PLAN);
            return json ? JSON.parse(json) : null;
        } catch (e) {
            console.error('Failed to load weekly plan', e);
            return null;
        }
    },

    // --- Shopping List ---
    saveShoppingList: async (list: ShoppingList) => {
        try {
            await AsyncStorage.setItem(KEYS.SHOPPING_LIST, JSON.stringify(list));
        } catch (e) {
            console.error('Failed to save shopping list', e);
        }
    },

    loadShoppingList: async (): Promise<ShoppingList | null> => {
        try {
            const json = await AsyncStorage.getItem(KEYS.SHOPPING_LIST);
            return json ? JSON.parse(json) : null;
        } catch (e) {
            console.error('Failed to load shopping list', e);
            return null;
        }
    },

    // --- Clear All (Logout) ---
    clearAll: async () => {
        try {
            await AsyncStorage.multiRemove(Object.values(KEYS));
        } catch (e) {
            console.error('Failed to clear data', e);
        }
    }
};
