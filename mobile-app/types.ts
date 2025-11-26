
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
}

export interface UserProfile {
    name: string; // Captured implicitly or defaults to "Usuário" if strictly following the 7 screens which doesn't explicitly ask for name in the prompt descriptions provided, but we can keep it or derive it.
    goal: UserGoal;
    activityLevel: ActivityLevel;
    mealsPerDay: number;
    mealSlots: string[]; // e.g., 'morning', 'lunch'
    dietaryRestrictions: string[];
    dislikes: string[]; // Changed to array
    usageModes: AppUsageMode[];
    profilePicture?: string;
    height?: number;
    weight?: number;
    age?: number;
    painPoints?: string[];
    routine?: {
        cookingTime: 'FAST' | 'ELABORATE';
        useMicrowave: boolean;
        repeatMeals: boolean;
    };
    savedRecipes?: string[];
}

export type Tab = 'HOME' | 'EXPLORE' | 'PLANNING' | 'LIBRARY' | 'PROFILE';

// --- Planning Feature Types ---

export interface MealSlot {
    id: string;
    timeSlot: 'Café da Manhã' | 'Almoço' | 'Lanche' | 'Jantar' | 'Ceia';
    recipe: Recipe;
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

export const RESTRICTION_OPTIONS = [
    "Sem Glúten",
    "Sem Lactose",
    "Vegano",
    "Vegetariano",
    "Low Carb",
    "Sem Açúcar",
    "Diabético"
];

export const RECIPE_CATEGORIES = [
    { id: 'Café da Manhã', icon: '☕', label: 'Café' },
    { id: 'Almoço', icon: '🍲', label: 'Almoço' },
    { id: 'Lanches', icon: '🍎', label: 'Lanches' },
    { id: 'Jantar', icon: '🍽️', label: 'Jantar' },
    { id: 'Pré-Treino', icon: '⚡', label: 'Pré-Treino' },
    { id: 'Sobremesa', icon: '🍫', label: 'Doces Fit' },
];
