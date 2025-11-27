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
        imageSource: require('../assets/images/recipes/frango_abobrinha.png'),
        prepTime: '20 min',
        difficulty: 'Fácil',
        category: 'Almoço',
        macros: { calories: 350, protein: 35, carbs: 10, fats: 8 },
        ingredients: [
            { name: 'Peito de Frango', quantity: '150g', icon: '🍗' },
            { name: 'Abobrinha', quantity: '1 un', icon: '🥒' },
            { name: 'Limão', quantity: '1/2 un', icon: '🍋' }
        ],
        instructions: ['Tempere o frango.', 'Grelhe com a abobrinha.', 'Finalize com limão.'],
        substitutions: [],
        healthTips: 'Baixa caloria.',
        tags: ['Low Carb', 'Rápido'],
        createdAt: Date.now()
    },
    {
        id: 'lw_3',
        name: 'Salada de Atum com Grão de Bico',
        description: 'Refeição fria, prática e rica em fibras.',
        imageSource: require('../assets/images/recipes/salada_atum.png'),
        prepTime: '10 min',
        difficulty: 'Fácil',
        category: 'Jantar',
        macros: { calories: 380, protein: 30, carbs: 25, fats: 10 },
        ingredients: [
            { name: 'Atum em água', quantity: '1 lata', icon: '🐟' },
            { name: 'Grão de Bico', quantity: '1/2 xícara', icon: '🫘' },
            { name: 'Tomate', quantity: '1 un', icon: '🍅' }
        ],
        instructions: ['Misture tudo.', 'Tempere com azeite e sal.'],
        substitutions: [],
        healthTips: 'Ômega-3 e fibras.',
        tags: ['Sem Fogão', 'Prático'],
        createdAt: Date.now()
    },
    {
        id: 'lw_4',
        name: 'Espaguete de Abobrinha à Bolonhesa',
        description: 'Substituição inteligente de massa por vegetal.',
        imageSource: require('../assets/images/recipes/espaguete_abobrinha.png'),
        prepTime: '25 min',
        difficulty: 'Médio',
        category: 'Jantar',
        macros: { calories: 320, protein: 25, carbs: 15, fats: 12 },
        ingredients: [
            { name: 'Abobrinha', quantity: '2 un', icon: '🥒' },
            { name: 'Carne Moída', quantity: '150g', icon: '🥩' },
            { name: 'Molho de Tomate', quantity: '1/2 xícara', icon: '🍅' }
        ],
        instructions: ['Faça fios de abobrinha.', 'Refogue a carne com molho.', 'Sirva por cima.'],
        substitutions: [],
        healthTips: 'Volume alto, caloria baixa.',
        tags: ['Low Carb', 'Conforto'],
        createdAt: Date.now()
    },
    {
        id: 'lw_5',
        name: 'Smoothie Verde Detox',
        description: 'Bebida densa em nutrientes para desinchar.',
        imageSource: require('../assets/images/recipes/smoothie_verde.png'),
        prepTime: '5 min',
        difficulty: 'Fácil',
        category: 'Lanches',
        macros: { calories: 180, protein: 5, carbs: 30, fats: 2 },
        ingredients: [
            { name: 'Couve', quantity: '1 folha', icon: '🥬' },
            { name: 'Maçã', quantity: '1 un', icon: '🍎' },
            { name: 'Gengibre', quantity: 'a gosto', icon: '🫚' }
        ],
        instructions: ['Bata tudo no liquidificador com gelo.'],
        substitutions: [],
        healthTips: 'Anti-inflamatório.',
        tags: ['Detox', 'Vegano'],
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
        name: 'Salmão ao Molho de Maracujá',
        description: 'Sofisticado, saudável e cheio de gorduras boas.',
        imageSource: require('../assets/images/recipes/bowl.png'), // Placeholder
        prepTime: '25 min',
        difficulty: 'Médio',
        category: 'Jantar',
        macros: { calories: 450, protein: 30, carbs: 15, fats: 25 },
        ingredients: [
            { name: 'Salmão', quantity: '150g', icon: '🐟' },
            { name: 'Maracujá', quantity: '1 un', icon: '🍈' },
            { name: 'Mel', quantity: '1 colher', icon: '🍯' }
        ],
        instructions: ['Grelhe o salmão.', 'Faça uma redução com maracujá e mel.', 'Sirva por cima.'],
        substitutions: [],
        healthTips: 'Calmante natural.',
        tags: ['Jantar', 'Sofisticado'],
        createdAt: Date.now()
    },
    {
        id: 'h_3',
        name: 'Wrap de Couve com Frango e Ricota',
        description: 'Substitua o pão pela couve para mais nutrientes.',
        imageSource: require('../assets/images/recipes/smoothie_verde.png'), // Placeholder
        prepTime: '15 min',
        difficulty: 'Fácil',
        category: 'Lanches',
        macros: { calories: 200, protein: 20, carbs: 5, fats: 10 },
        ingredients: [
            { name: 'Folha de Couve', quantity: '2 un', icon: '🥬' },
            { name: 'Frango Desfiado', quantity: '100g', icon: '🍗' },
            { name: 'Ricota', quantity: '2 colheres', icon: '🧀' }
        ],
        instructions: ['Branqueie a couve.', 'Recheie e enrole.'],
        substitutions: [],
        healthTips: 'Low carb total.',
        tags: ['Lanche', 'Leve'],
        createdAt: Date.now()
    },
    {
        id: 'h_4',
        name: 'Risoto de Quinoa com Cogumelos',
        description: 'Falso risoto rico em proteínas vegetais.',
        imageSource: require('../assets/images/recipes/omelete.png'), // Placeholder
        prepTime: '30 min',
        difficulty: 'Médio',
        category: 'Jantar',
        macros: { calories: 350, protein: 15, carbs: 45, fats: 10 },
        ingredients: [
            { name: 'Quinoa', quantity: '1 xícara', icon: '🌾' },
            { name: 'Cogumelos variados', quantity: '1 xícara', icon: '🍄' },
            { name: 'Caldo de legumes', quantity: '500ml', icon: '🥘' }
        ],
        instructions: ['Cozinhe a quinoa no caldo.', 'Refogue cogumelos e misture.'],
        substitutions: [],
        healthTips: 'Substituto perfeito do arroz.',
        tags: ['Vegano', 'Jantar'],
        createdAt: Date.now()
    },
    {
        id: 'h_5',
        name: 'Tacos de Alface com Carne Desfiada',
        description: 'Diversão para comer com as mãos, sem farinha.',
        imageSource: require('../assets/images/recipes/salada_atum.png'), // Placeholder
        prepTime: '20 min',
        difficulty: 'Fácil',
        category: 'Jantar',
        macros: { calories: 280, protein: 25, carbs: 5, fats: 15 },
        ingredients: [
            { name: 'Alface Americana', quantity: 'Folhas', icon: '🥬' },
            { name: 'Carne Desfiada', quantity: '150g', icon: '🥩' },
            { name: 'Vinagrete', quantity: 'a gosto', icon: '🍅' }
        ],
        instructions: ['Use a folha de alface como concha.', 'Recheie com carne e vinagrete.'],
        substitutions: [],
        healthTips: 'Zero glúten.',
        tags: ['Keto', 'Divertido'],
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
