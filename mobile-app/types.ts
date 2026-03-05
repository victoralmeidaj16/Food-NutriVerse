
export enum UserGoal {
    LOSE_WEIGHT = 'LOSE_WEIGHT',
    GAIN_MUSCLE = 'GAIN_MUSCLE',
    EAT_HEALTHY = 'EAT_HEALTHY',
    MAINTAIN = 'MAINTAIN', // Added based on Onboarding specs
}

export enum ActivityLevel {
    LOW = 'LOW',     // "Fico mais sentado(a)"
    MEDIUM = 'MEDIUM', // "Me mexo durante o dia"
    HIGH = 'HIGH',   // "Treino quase todos os dias"
}

export enum AppUsageMode {
    PANTRY = 'PANTRY',
    FIT_SWAP = 'FIT_SWAP',
    PLANNING = 'PLANNING',
    MENUS = 'MENUS',
    SNACKS = 'SNACKS',
}

export interface Macros {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

export interface Substitution {
    original: string;
    replacement: string;
    reason: string;
}

export interface Ingredient {
    name: string;
    quantity: string;
    icon: string;
}

export interface Recipe {
    id: string;
    name: string;
    originalName?: string; // Optional, might not exist in Pantry mode
    description: string;
    imageUrl?: string;
    imageSource?: any; // For local assets
    prepTime: string;
    difficulty: 'Fácil' | 'Médio' | 'Difícil';
    category: string;
    macros: Macros;
    ingredients: Ingredient[]; // Changed from string[] to Ingredient[]
    instructions: string[];
    substitutions: Substitution[];
    healthTips: string;
    tags: string[];
    createdAt: number;
    citations?: string[]; // Reference IDs from healthReferences.ts
}

export interface TasteProfile {
    favoriteDish: string;
    favoriteFastFood: string;
    favoriteSweet: string;
}


export enum SubscriptionPlan {
    FREE = 'FREE',
    MONTHLY = 'MONTHLY',
    YEARLY = 'YEARLY'
}

export interface UserUsageStats {
    recipesGeneratedToday: number;
    lastGenerationDate: string; // ISO Date string
    desiresTransformedToday: number;
    lastDesireDate: string;
    pantryScansThisWeek: number;
    lastScanDate: string;
    savedRecipesCount: number;
    weeklyPlansGeneratedThisWeek: number;
    lastPlanGenerationDate: string;
}

export interface UserProfile {
    id?: string;
    name: string;
    email?: string;
    profilePicture?: string;
    goal: UserGoal;
    activityLevel: ActivityLevel;
    mealsPerDay: number;
    mealSlots: string[];
    dietaryRestrictions: string[];
    dislikes: string[];
    usageModes: AppUsageMode[];

    // Biometrics
    height?: number; // cm
    weight?: number; // kg
    age?: number;

    // Onboarding Data
    painPoints?: string[];
    routine?: {
        cookingTime: 'FAST' | 'ELABORATE';
        useMicrowave: boolean;
        repeatMeals: boolean;
    };

    // Subscription & Usage
    plan: SubscriptionPlan;
    isPro: boolean;
    subscriptionExpiry?: string;
    transactionReceipt?: string; // IAP receipt for validation
    usageStats: UserUsageStats;
    tasteProfile?: TasteProfile;
}

// --- New Features Interfaces ---

export interface QuickDecision {
    dishName: string;
    reason: string;
    calories: number;
}

export interface RoutineMeal {
    id: string;
    name: string;
    time: string;
    calories: number;
    macros: {
        protein: number;
        carbs: number;
        fat: number;
    };
}

export interface RoutineDiagnostic {
    summary: string;
    score: number;
}

export interface MicroSwap {
    from: string;
    to: string;
    reason: string;
}

export interface MapaAlimentarResult {
    diagnostic: RoutineDiagnostic;
    microSwaps: MicroSwap[];
}

export type Tab = 'HOME' | 'EXPLORE' | 'PLANNING' | 'LIBRARY' | 'MAPA' | 'PROFILE';

// --- Planning Feature Types ---

export interface MealSlot {
    id: string;
    timeSlot: 'Café da Manhã' | 'Almoço' | 'Lanche' | 'Jantar' | 'Ceia';
    recipe: Recipe | null;
}

export interface DayPlan {
    dayName: string; // e.g., "Segunda", "Terça"
    meals: MealSlot[];
}

export interface WeeklyPlan {
    id: string;
    startDate: number;
    days: DayPlan[];
}

export interface ShoppingItem {
    id: string;
    name: string;
    quantity: string;
    category: 'Hortifruti' | 'Proteínas' | 'Laticínios' | 'Mercearia' | 'Outros';
    checked: boolean;
}

export interface ShoppingList {
    items: ShoppingItem[];
}

export interface UserList {
    id: string;
    name: string;
    recipeIds: string[];
    createdAt: number;
}

export const RESTRICTION_OPTIONS = [
    "Sem Glúten",
    "Sem Lactose",
    "Vegano",
    "Vegetariano",
    "Low Carb",
    "Sem Açúcar",
    "Diabético"
];

// Bilingual restriction options
export const getRestrictionOptions = (language: 'en' | 'pt' = 'pt') => {
    return language === 'en' ? [
        "Gluten-Free",
        "Lactose-Free",
        "Vegan",
        "Vegetarian",
        "Low Carb",
        "Sugar-Free",
        "Diabetic"
    ] : RESTRICTION_OPTIONS;
};

export const RECIPE_CATEGORIES = [
    { id: 'Café da Manhã', icon: '☕', label: 'Café' },
    { id: 'Almoço', icon: '🍲', label: 'Almoço' },
    { id: 'Lanches', icon: '🍎', label: 'Lanches' },
    { id: 'Jantar', icon: '🍽️', label: 'Jantar' },
    { id: 'Pré-Treino', icon: '⚡', label: 'Pré-Treino' },
    { id: 'Sobremesa', icon: '🍫', label: 'Doces Fit' },
];

// Bilingual recipe categories
export const getRecipeCategories = (language: 'en' | 'pt' = 'pt') => {
    return language === 'en' ? [
        { id: 'Breakfast', icon: '☕', label: 'Breakfast' },
        { id: 'Lunch', icon: '🍲', label: 'Lunch' },
        { id: 'Snacks', icon: '🍎', label: 'Snacks' },
        { id: 'Dinner', icon: '🍽️', label: 'Dinner' },
        { id: 'Pre-Workout', icon: '⚡', label: 'Pre-Workout' },
        { id: 'Dessert', icon: '🍫', label: 'Fit Sweets' },
    ] : RECIPE_CATEGORIES;
};
