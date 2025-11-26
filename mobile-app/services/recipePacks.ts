import { Recipe, UserGoal } from '../types';

export interface RecipePack {
    id: string;
    goal: UserGoal;
    title: string;
    description: string;
    recipes: Recipe[];
}

const LOSE_WEIGHT_RECIPES: Recipe[] = [
    {
        id: 'lw_1',
        name: 'Omelete Proteico de Espinafre e Cogumelos',
        description: 'Leve, rico em fibras e proteína; sustenta por horas.',
        imageSource: require('../assets/images/recipes/omelete.png'),
        prepTime: '15 min',
        difficulty: 'Fácil',
        category: 'Café da Manhã',
        macros: { calories: 220, protein: 18, carbs: 5, fats: 12 },
        ingredients: [
            { name: 'Ovos', quantity: '2 un', icon: '🥚' },
            { name: 'Espinafre', quantity: '1 xícara', icon: '🌿' },
            { name: 'Cogumelos', quantity: '1/2 xícara', icon: '🍄' }
        ],
        instructions: ['Bata os ovos.', 'Refogue espinafre e cogumelos.', 'Misture e cozinhe.'],
        substitutions: [],
        healthTips: 'Rico em ferro.',
        tags: ['Low Carb', 'Proteico'],
        createdAt: Date.now()
    },
    {
        id: 'lw_2',
        name: 'Frango Grelhado com Abobrinha e Limão',
        description: 'Prato básico e delicioso; abobrinha dá volume e saciedade.',
        // imageSource: require('../assets/images/recipes/frango.png'), // Using placeholder for now
        prepTime: '20 min',
        difficulty: 'Fácil',
        category: 'Almoço',
        macros: { calories: 280, protein: 30, carbs: 8, fats: 10 },
        ingredients: [
            { name: 'Peito de Frango', quantity: '150g', icon: '🍗' },
            { name: 'Abobrinha', quantity: '1 un', icon: '🥒' },
            { name: 'Limão Siciliano', quantity: '1/2 un', icon: '🍋' }
        ],
        instructions: ['Grelhe o frango.', 'Refogue a abobrinha.', 'Tempere com limão.'],
        substitutions: [],
        healthTips: 'Vitamina C e fibras.',
        tags: ['Low Carb', 'Leve'],
        createdAt: Date.now()
    },
    {
        id: 'lw_3',
        name: 'Salada Morna de Grão-de-Bico',
        description: 'Grão-de-bico dá saciedade, tahine traz cremosidade sem exagero.',
        prepTime: '15 min',
        difficulty: 'Fácil',
        category: 'Jantar',
        macros: { calories: 320, protein: 12, carbs: 40, fats: 10 },
        ingredients: [
            { name: 'Grão-de-bico', quantity: '1 xícara', icon: '🥘' },
            { name: 'Pimentão', quantity: '1/2 un', icon: '🌶️' },
            { name: 'Tahine', quantity: '1 colher', icon: '🥜' }
        ],
        instructions: ['Misture tudo.', 'Sirva morno.'],
        substitutions: [],
        healthTips: 'Fibras e proteína vegetal.',
        tags: ['Vegano', 'Fibras'],
        createdAt: Date.now()
    },
    {
        id: 'lw_4',
        name: 'Sopa Detox de Abóbora com Gengibre',
        description: 'Baixa caloria, anti-inflamatória e perfeita para refeições rápidas.',
        prepTime: '30 min',
        difficulty: 'Médio',
        category: 'Jantar',
        macros: { calories: 200, protein: 5, carbs: 35, fats: 4 },
        ingredients: [
            { name: 'Abóbora', quantity: '200g', icon: '🎃' },
            { name: 'Gengibre', quantity: '1 pedaço', icon: '🫚' }
        ],
        instructions: ['Cozinhe a abóbora.', 'Bata com gengibre.', 'Sirva.'],
        substitutions: [],
        healthTips: 'Anti-inflamatório.',
        tags: ['Detox', 'Leve'],
        createdAt: Date.now()
    },
    {
        id: 'lw_5',
        name: 'Wrap de Atum Fit',
        description: 'Substitui maionese por iogurte e usa tortilla integral.',
        prepTime: '10 min',
        difficulty: 'Fácil',
        category: 'Lanches',
        macros: { calories: 250, protein: 20, carbs: 25, fats: 6 },
        ingredients: [
            { name: 'Atum', quantity: '1 lata', icon: '🐟' },
            { name: 'Tortilla Integral', quantity: '1 un', icon: '🌮' },
            { name: 'Iogurte Natural', quantity: '1 colher', icon: '🥛' }
        ],
        instructions: ['Misture atum e iogurte.', 'Recheie a tortilla.'],
        substitutions: [],
        healthTips: 'Ômega-3.',
        tags: ['Prático', 'Proteico'],
        createdAt: Date.now()
    }
];

const GAIN_MUSCLE_RECIPES: Recipe[] = [
    {
        id: 'gm_1',
        name: 'Frango Cremoso com Cottage',
        description: 'Cottage aumenta proteína sem pesar no sabor.',
        imageSource: require('../assets/images/recipes/frango.png'),
        prepTime: '25 min',
        difficulty: 'Médio',
        category: 'Almoço',
        macros: { calories: 600, protein: 50, carbs: 45, fats: 15 },
        ingredients: [
            { name: 'Frango', quantity: '200g', icon: '🍗' },
            { name: 'Queijo Cottage', quantity: '2 colheres', icon: '🧀' },
            { name: 'Arroz Integral', quantity: '1 xícara', icon: '🍚' }
        ],
        instructions: ['Grelhe o frango.', 'Misture cottage.', 'Sirva com arroz.'],
        substitutions: [],
        healthTips: 'Alta proteína.',
        tags: ['Hipertrofia', 'Almoço'],
        createdAt: Date.now()
    },
    {
        id: 'gm_2',
        name: 'Panqueca Proteica de Banana',
        description: 'Perfeita para pré-treino ou café reforçado.',
        prepTime: '15 min',
        difficulty: 'Fácil',
        category: 'Café da Manhã',
        macros: { calories: 450, protein: 25, carbs: 50, fats: 12 },
        ingredients: [
            { name: 'Banana', quantity: '1 un', icon: '🍌' },
            { name: 'Ovos', quantity: '2 un', icon: '🥚' },
            { name: 'Pasta de Amendoim', quantity: '1 colher', icon: '🥜' }
        ],
        instructions: ['Amasse a banana.', 'Misture ovos.', 'Frite e recheie.'],
        substitutions: [],
        healthTips: 'Energia rápida.',
        tags: ['Pré-Treino', 'Doce'],
        createdAt: Date.now()
    },
    {
        id: 'gm_3',
        name: 'Macarrão com Carne Moída Magra',
        description: 'Clássico, fácil e muito eficiente para bulking limpo.',
        prepTime: '20 min',
        difficulty: 'Fácil',
        category: 'Almoço',
        macros: { calories: 650, protein: 40, carbs: 70, fats: 18 },
        ingredients: [
            { name: 'Macarrão Integral', quantity: '100g', icon: '🍝' },
            { name: 'Carne Moída', quantity: '150g', icon: '🥩' },
            { name: 'Espinafre', quantity: '1 punhado', icon: '🌿' }
        ],
        instructions: ['Cozinhe o macarrão.', 'Refogue a carne.', 'Misture.'],
        substitutions: [],
        healthTips: 'Carboidrato complexo.',
        tags: ['Bulking', 'Clássico'],
        createdAt: Date.now()
    },
    {
        id: 'gm_4',
        name: 'Smoothie Hipercalórico Clean',
        description: 'Rápido, barato e extremamente prático.',
        prepTime: '5 min',
        difficulty: 'Fácil',
        category: 'Lanches',
        macros: { calories: 550, protein: 30, carbs: 60, fats: 20 },
        ingredients: [
            { name: 'Leite', quantity: '200ml', icon: '🥛' },
            { name: 'Whey Protein', quantity: '1 scoop', icon: '💪' },
            { name: 'Aveia', quantity: '2 colheres', icon: '🌾' },
            { name: 'Pasta de Amendoim', quantity: '1 colher', icon: '🥜' }
        ],
        instructions: ['Bata tudo no liquidificador.'],
        substitutions: [],
        healthTips: 'Calorias fáceis.',
        tags: ['Lanche', 'Rápido'],
        createdAt: Date.now()
    },
    {
        id: 'gm_5',
        name: 'Salmão Grelhado com Purê',
        description: 'Altamente nutritivo, rico em ômega-3 e energia.',
        prepTime: '30 min',
        difficulty: 'Médio',
        category: 'Jantar',
        macros: { calories: 600, protein: 35, carbs: 40, fats: 25 },
        ingredients: [
            { name: 'Salmão', quantity: '150g', icon: '🐟' },
            { name: 'Batata Doce', quantity: '150g', icon: '🍠' }
        ],
        instructions: ['Grelhe o salmão.', 'Faça o purê.', 'Sirva.'],
        substitutions: [],
        healthTips: 'Gorduras boas.',
        tags: ['Jantar', 'Saudável'],
        createdAt: Date.now()
    }
];

const HEALTHY_RECIPES: Recipe[] = [
    {
        id: 'h_1',
        name: 'Buddha Bowl Colorido',
        description: 'Perfeito para saúde geral; prato completo em nutrientes.',
        imageSource: require('../assets/images/recipes/bowl.png'),
        prepTime: '20 min',
        difficulty: 'Fácil',
        category: 'Almoço',
        macros: { calories: 400, protein: 15, carbs: 50, fats: 18 },
        ingredients: [
            { name: 'Quinoa', quantity: '1/2 xícara', icon: '🌾' },
            { name: 'Abacate', quantity: '1/4 un', icon: '🥑' },
            { name: 'Grão-de-bico', quantity: '1/2 xícara', icon: '🥘' }
        ],
        instructions: ['Monte tudo em uma tigela.'],
        substitutions: [],
        healthTips: 'Antioxidantes.',
        tags: ['Vegano', 'Saudável'],
        createdAt: Date.now()
    },
    {
        id: 'h_2',
        name: 'Stir-fry de Legumes com Frango',
        description: 'Leve, crocante e muito rápido de fazer.',
        prepTime: '15 min',
        difficulty: 'Fácil',
        category: 'Jantar',
        macros: { calories: 350, protein: 25, carbs: 20, fats: 12 },
        ingredients: [
            { name: 'Frango', quantity: '150g', icon: '🍗' },
            { name: 'Legumes Variados', quantity: '2 xícaras', icon: '🥦' },
            { name: 'Gergelim', quantity: '1 colher', icon: '🌰' }
        ],
        instructions: ['Refogue frango e legumes.', 'Finalize com gergelim.'],
        substitutions: [],
        healthTips: 'Fibras e vitaminas.',
        tags: ['Rápido', 'Leve'],
        createdAt: Date.now()
    },
    {
        id: 'h_3',
        name: 'Tilápia ao Forno com Ervas',
        description: 'Proteína magra e digestão leve.',
        prepTime: '25 min',
        difficulty: 'Fácil',
        category: 'Almoço',
        macros: { calories: 300, protein: 30, carbs: 10, fats: 8 },
        ingredients: [
            { name: 'Tilápia', quantity: '150g', icon: '🐟' },
            { name: 'Ervas', quantity: 'a gosto', icon: '🌿' },
            { name: 'Vegetais', quantity: '1 xícara', icon: '🥕' }
        ],
        instructions: ['Asse o peixe com ervas e vegetais.'],
        substitutions: [],
        healthTips: 'Proteína magra.',
        tags: ['Leve', 'Almoço'],
        createdAt: Date.now()
    },
    {
        id: 'h_4',
        name: 'Tapioca Recheada',
        description: 'Ótimo para café ou lanche saudável.',
        prepTime: '10 min',
        difficulty: 'Fácil',
        category: 'Café da Manhã',
        macros: { calories: 350, protein: 12, carbs: 45, fats: 10 },
        ingredients: [
            { name: 'Goma de Tapioca', quantity: '3 colheres', icon: '⚪' },
            { name: 'Ovo', quantity: '1 un', icon: '🥚' },
            { name: 'Queijo Branco', quantity: '1 fatia', icon: '🧀' }
        ],
        instructions: ['Faça a tapioca.', 'Recheie com ovo e queijo.'],
        substitutions: [],
        healthTips: 'Sem glúten.',
        tags: ['Café', 'Rápido'],
        createdAt: Date.now()
    },
    {
        id: 'h_5',
        name: 'Iogurte com Chia e Frutas',
        description: 'Lanche saudável, antioxidante e com boa saciedade.',
        prepTime: '5 min',
        difficulty: 'Fácil',
        category: 'Lanches',
        macros: { calories: 200, protein: 8, carbs: 25, fats: 6 },
        ingredients: [
            { name: 'Iogurte Natural', quantity: '1 pote', icon: '🥛' },
            { name: 'Chia', quantity: '1 colher', icon: '🌱' },
            { name: 'Morango', quantity: '5 un', icon: '🍓' }
        ],
        instructions: ['Misture tudo.'],
        substitutions: [],
        healthTips: 'Probióticos.',
        tags: ['Lanche', 'Fresco'],
        createdAt: Date.now()
    }
];

export const RECIPE_PACKS: Record<string, RecipePack> = {
    [UserGoal.LOSE_WEIGHT]: {
        id: 'pack_lose_weight',
        goal: UserGoal.LOSE_WEIGHT,
        title: '5 Receitas para Perda de Peso',
        description: 'Low-kcal, saciedade alta e muito sabor.',
        recipes: LOSE_WEIGHT_RECIPES
    },
    [UserGoal.GAIN_MUSCLE]: {
        id: 'pack_gain_muscle',
        goal: UserGoal.GAIN_MUSCLE,
        title: '5 Receitas para Ganho de Massa',
        description: 'Alta proteína e energia para seus treinos.',
        recipes: GAIN_MUSCLE_RECIPES
    },
    [UserGoal.EAT_HEALTHY]: {
        id: 'pack_healthy',
        goal: UserGoal.EAT_HEALTHY,
        title: '5 Receitas Saudáveis',
        description: 'Equilíbrio, micronutrientes e sabor.',
        recipes: HEALTHY_RECIPES
    },
    // Fallback for MAINTAIN
    [UserGoal.MAINTAIN]: {
        id: 'pack_maintain',
        goal: UserGoal.MAINTAIN,
        title: '5 Receitas Saudáveis',
        description: 'Equilíbrio, micronutrientes e sabor.',
        recipes: HEALTHY_RECIPES
    }
};
