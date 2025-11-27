
import { Recipe, UserGoal } from "../types";
import { getImageUrl } from "./imageService";

export const MOCK_RECIPES: Recipe[] = [
    // --- Café da Manhã ---
    {
        id: 'mock-1',
        name: 'Panqueca de Banana e Aveia',
        description: 'Energia limpa para começar o dia, rica em fibras e potássio.',
        imageUrl: getImageUrl('Panqueca de Banana e Aveia'),
        prepTime: '15 min',
        difficulty: 'Fácil',
        category: 'Café da Manhã',
        macros: { calories: 320, protein: 12, carbs: 45, fats: 8 },
        ingredients: [
            { name: 'Banana madura', quantity: '1 unidade', icon: '🍌' },
            { name: 'Aveia em flocos', quantity: '1/2 xícara', icon: '🌾' },
            { name: 'Ovo', quantity: '1 unidade', icon: '🥚' },
            { name: 'Canela', quantity: 'a gosto', icon: '🧂' }
        ],
        instructions: [
            'Amasse a banana em uma tigela.',
            'Misture o ovo e a aveia até ficar homogêneo.',
            'Aqueça uma frigideira antiaderente.',
            'Despeje a massa e doure dos dois lados.',
            'Sirva com um fio de mel se desejar.'
        ],
        substitutions: [
            { original: 'Farinha de Trigo', replacement: 'Aveia', reason: 'Mais fibras e menor índice glicêmico' }
        ],
        healthTips: 'Ótima fonte de carboidratos complexos pré-treino.',
        tags: ['Vegetariano', 'Fibras'],
        createdAt: Date.now()
    },
    {
        id: 'mock-2',
        name: 'Ovos Mexidos Cremosos',
        description: 'Proteína pura com cremosidade sem excesso de gordura.',
        imageUrl: getImageUrl('Ovos Mexidos Cremosos'),
        prepTime: '10 min',
        difficulty: 'Fácil',
        category: 'Café da Manhã',
        macros: { calories: 210, protein: 18, carbs: 2, fats: 14 },
        ingredients: [
            { name: 'Ovos', quantity: '3 unidades', icon: '🥚' },
            { name: 'Requeijão Light', quantity: '1 colher', icon: '🥛' },
            { name: 'Cebolinha', quantity: 'a gosto', icon: '🌿' }
        ],
        instructions: [
            'Bata os ovos levemente.',
            'Coloque na frigideira em fogo baixo.',
            'Coloque na frigideira fria com a manteiga.',
            'Ligue o fogo baixo e mexa sem parar.',
            'Tire do fogo antes de secar totalmente.'
        ],
        substitutions: [],
        healthTips: 'Rico em colina, essencial para o cérebro.',
        tags: ['Keto', 'Proteico'],
        createdAt: Date.now()
    },
    {
        id: '3',
        name: 'Bowl de Salmão e Quinoa',
        description: 'Refeição completa com proteínas de alto valor biológico.',
        imageSource: require('../assets/images/recipes/bowl.png'),
        prepTime: '25 min',
        difficulty: 'Médio',
        category: 'Almoço',
        macros: { calories: 450, protein: 35, carbs: 40, fats: 15 },
        ingredients: [
            { name: 'Filé de Salmão', quantity: '150g', icon: '🐟' },
            { name: 'Quinoa cozida', quantity: '1 xícara', icon: '🌾' },
            { name: 'Abacate', quantity: '1/4 un', icon: '🥑' },
            { name: 'Pepino', quantity: '1/2 un', icon: '🥒' }
        ],
        instructions: [
            'Grelhe o salmão temperado com limão.',
            'Monte o bowl com a quinoa como base.',
            'Adicione os vegetais e o salmão.',
            'Finalize com azeite.'
        ],
        substitutions: [
            { original: 'Ovo', replacement: 'Linhaça hidratada', reason: 'Vegano' },
            { original: 'Aveia', replacement: 'Farinha de amêndoas', reason: 'Low carb' }
        ],
        healthTips: 'Rico em Ômega-3, anti-inflamatório natural.',
        tags: ['Pescatariano', 'Superfood'],
        createdAt: Date.now()
    },
    {
        id: '4',
        name: 'Escondidinho de Patinho e Abóbora',
        description: 'Confort food em versão fit e low carb.',
        imageSource: require('../assets/images/recipes/frango.png'), // Placeholder
        prepTime: '40 min',
        difficulty: 'Médio',
        category: 'Almoço',
        macros: { calories: 380, protein: 40, carbs: 25, fats: 12 },
        ingredients: [
            { name: 'Patinho moído', quantity: '150g', icon: '🥩' },
            { name: 'Abóbora Cabotiá', quantity: '200g', icon: '🎃' },
            { name: 'Queijo Cottage', quantity: '2 colheres', icon: '🧀' }
        ],
        instructions: [
            'Refogue a carne com temperos.',
            'Cozinhe a abóbora e faça um purê.',
            'Monte camadas e gratine.'
        ],
        substitutions: [],
        healthTips: 'A abóbora é rica em vitamina A e baixa em calorias.',
        tags: ['Low Carb', 'Congelável'],
        createdAt: Date.now()
    },
    {
        id: '5',
        name: 'Crepioca de Frango',
        description: 'Lanche proteico prático para levar.',
        imageSource: require('../assets/images/recipes/frango_abobrinha.png'),
        prepTime: '15 min',
        difficulty: 'Fácil',
        category: 'Lanches',
        macros: { calories: 300, protein: 25, carbs: 20, fats: 10 },
        ingredients: [
            { name: 'Ovo', quantity: '1 un', icon: '🥚' },
            { name: 'Goma de Tapioca', quantity: '2 colheres', icon: '⚪' },
            { name: 'Frango Desfiado', quantity: '100g', icon: '🍗' }
        ],
        instructions: [
            'Misture ovo e tapioca.',
            'Faça o disco na frigideira.',
            'Recheie com frango e dobre.'
        ],
        substitutions: [],
        healthTips: 'Sem glúten e alta saciedade.',
        tags: ['Sem Glúten', 'Lanche'],
        createdAt: Date.now()
    },
    {
        id: '6',
        name: 'Iogurte com Whey e Frutas',
        description: 'Pós-treino rápido e refrescante.',
        imageSource: require('../assets/images/recipes/smoothie_verde.png'), // Placeholder
        prepTime: '5 min',
        difficulty: 'Fácil',
        category: 'Lanches',
        macros: { calories: 250, protein: 25, carbs: 30, fats: 2 },
        ingredients: [
            { name: 'Iogurte Desnatado', quantity: '1 pote', icon: '🥛' },
            { name: 'Whey Protein', quantity: '1 scoop', icon: '💪' },
            { name: 'Morango', quantity: '5 un', icon: '🍓' }
        ],
        instructions: [
            'Misture o whey no iogurte até dissolver.',
            'Adicione as frutas picadas.'
        ],
        substitutions: [],
        healthTips: 'Recuperação muscular imediata.',
        tags: ['Rápido', 'Proteico'],
        createdAt: Date.now()
    },
    {
        id: '7',
        name: 'Chips de Coco',
        description: 'Snack crocante rico em gorduras boas.',
        imageSource: require('../assets/images/recipes/bowl.png'), // Placeholder
        prepTime: '20 min',
        difficulty: 'Fácil',
        category: 'Lanches',
        macros: { calories: 150, protein: 2, carbs: 5, fats: 14 },
        ingredients: [
            { name: 'Coco em lâminas', quantity: '50g', icon: '🥥' },
            { name: 'Canela', quantity: 'a gosto', icon: '🧂' }
        ],
        instructions: [
            'Espalhe o coco numa assadeira.',
            'Polvilhe canela.',
            'Asse em fogo baixo até dourar.'
        ],
        substitutions: [],
        healthTips: 'Gorduras TCM que dão energia rápida.',
        tags: ['Keto', 'Vegano'],
        createdAt: Date.now()
    },
    {
        id: '8',
        name: 'Omelete de Forno com Vegetais',
        description: 'Jantar leve para aproveitar sobras de vegetais.',
        imageSource: require('../assets/images/recipes/omelete.png'),
        prepTime: '25 min',
        difficulty: 'Fácil',
        category: 'Jantar',
        macros: { calories: 220, protein: 15, carbs: 8, fats: 12 },

        ingredients: [
            { name: 'Ovos', quantity: '3 un', icon: '🥚' },
            { name: 'Espinafre', quantity: '1 xícara', icon: '🥬' },
            { name: 'Tomate', quantity: '1 un', icon: '🍅' }
        ],
        instructions: [
            'Bata os ovos com temperos.',
            'Misture os vegetais picados.',
            'Asse em forminhas de muffin.'
        ],
        substitutions: [],
        healthTips: 'Baixa caloria e alta densidade nutricional.',
        tags: ['Low Carb', 'Vegetariano'],
        createdAt: Date.now()
    },
    {
        id: '9',
        name: 'Sopa de Abóbora com Gengibre',
        description: 'Jantar leve e termogênico.',
        imageSource: require('../assets/images/recipes/bowl.png'), // Placeholder
        prepTime: '30 min',
        difficulty: 'Fácil',
        category: 'Jantar',
        macros: { calories: 180, protein: 5, carbs: 30, fats: 4 },
        ingredients: [
            { name: 'Abóbora', quantity: '300g', icon: '🎃' },
            { name: 'Gengibre', quantity: '1 pedaço', icon: '🫚' },
            { name: 'Cebola', quantity: '1/2 un', icon: '🧅' }
        ],
        instructions: [
            'Cozinhe a abóbora com cebola.',
            'Bata no liquidificador com gengibre.',
            'Aqueça e sirva.'
        ],
        substitutions: [],
        healthTips: 'Gengibre acelera o metabolismo.',
        tags: ['Detox', 'Vegano'],
        createdAt: Date.now()
    },
    {
        id: '10',
        name: 'Salada Caesar com Iogurte',
        description: 'Versão leve do clássico, sem maionese.',
        imageSource: require('../assets/images/recipes/salada_atum.png'), // Placeholder
        prepTime: '15 min',
        difficulty: 'Fácil',
        category: 'Jantar',
        macros: { calories: 350, protein: 30, carbs: 10, fats: 15 },
        ingredients: [
            { name: 'Alface Romana', quantity: '1 maço', icon: '🥬' },
            { name: 'Peito de Frango', quantity: '150g', icon: '🍗' },
            { name: 'Iogurte Natural', quantity: '1 pote', icon: '🥛' },
            { name: 'Parmesão', quantity: '1 colher', icon: '🧀' }
        ],
        instructions: [
            'Grelhe o frango em tiras.',
            'Faça o molho com iogurte, limão e parmesão.',
            'Misture com a alface.'
        ],
        substitutions: [],
        healthTips: 'Probióticos do iogurte.',
        tags: ['Salada', 'Clássico'],
        createdAt: Date.now()
    }
];
