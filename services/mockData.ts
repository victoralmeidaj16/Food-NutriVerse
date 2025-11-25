
import { Recipe, UserGoal } from "../types";

export const MOCK_RECIPES: Recipe[] = [
  // --- Café da Manhã ---
  {
    id: 'mock-1',
    name: 'Panqueca de Banana e Aveia',
    description: 'Energia limpa para começar o dia, rica em fibras e potássio.',
    imageUrl: 'https://images.unsplash.com/photo-1506084868230-bb9d95c24759?q=80&w=600&auto=format&fit=crop',
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
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414395d8?q=80&w=600&auto=format&fit=crop',
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
        'Mexa sempre para não secar.',
        'Adicione o requeijão no final para cremosidade.'
    ],
    substitutions: [],
    healthTips: 'Café da manhã low carb ideal.',
    tags: ['Low Carb', 'Proteico'],
    createdAt: Date.now()
  },
  {
    id: 'mock-3',
    name: 'Overnight Oats de Frutas Vermelhas',
    description: 'Prático para deixar pronto na noite anterior.',
    imageUrl: 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?q=80&w=600&auto=format&fit=crop',
    prepTime: '5 min',
    difficulty: 'Fácil',
    category: 'Café da Manhã',
    macros: { calories: 280, protein: 10, carbs: 40, fats: 6 },
    ingredients: [
        { name: 'Aveia', quantity: '1/2 xícara', icon: '🌾' },
        { name: 'Leite desnatado', quantity: '1/2 xícara', icon: '🥛' },
        { name: 'Frutas vermelhas', quantity: '1/4 xícara', icon: '🍓' },
        { name: 'Chia', quantity: '1 colher chá', icon: '🌱' }
    ],
    instructions: [
        'Misture aveia, chia e leite em um pote.',
        'Adicione as frutas por cima.',
        'Deixe na geladeira durante a noite.',
        'Coma frio pela manhã.'
    ],
    substitutions: [],
    healthTips: 'Rico em antioxidantes e fibras.',
    tags: ['Frio', 'Prático'],
    createdAt: Date.now()
  },

  // --- Almoço ---
  {
    id: 'mock-4',
    name: 'Frango Grelhado com Batata Doce',
    description: 'O clássico fit. Simples, eficiente e nutritivo.',
    imageUrl: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=600&auto=format&fit=crop',
    prepTime: '25 min',
    difficulty: 'Fácil',
    category: 'Almoço',
    macros: { calories: 450, protein: 40, carbs: 50, fats: 8 },
    ingredients: [
      { name: 'Peito de Frango', quantity: '150g', icon: '🍗' },
      { name: 'Batata Doce', quantity: '150g', icon: '🥔' },
      { name: 'Brócolis', quantity: '100g', icon: '🥦' }
    ],
    instructions: [
        'Tempere o frango com limão e sal.',
        'Cozinhe a batata doce no vapor ou água.',
        'Grelhe o frango até dourar.',
        'Sirva com o brócolis cozido.'
    ],
    substitutions: [],
    healthTips: 'Padrão ouro para ganho de massa magra.',
    tags: ['Hipertrofia', 'Clássico'],
    createdAt: Date.now()
  },
  {
    id: 'mock-5',
    name: 'Bowl de Salmão e Quinoa',
    description: 'Rico em ômega-3 e proteínas de alta qualidade.',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=600&auto=format&fit=crop',
    prepTime: '20 min',
    difficulty: 'Médio',
    category: 'Almoço',
    macros: { calories: 520, protein: 35, carbs: 45, fats: 20 },
    ingredients: [
        { name: 'Salmão', quantity: '120g', icon: '🐟' },
        { name: 'Quinoa cozida', quantity: '1 xícara', icon: '🌾' },
        { name: 'Abacate', quantity: '1/4 unidade', icon: '🥑' }
    ],
    instructions: [
        'Grelhe o salmão.',
        'Monte o bowl com a quinoa como base.',
        'Adicione o salmão e fatias de abacate.',
        'Tempere com azeite e limão.'
    ],
    substitutions: [
        { original: 'Arroz Branco', replacement: 'Quinoa', reason: 'Mais proteína e menor índice glicêmico' }
    ],
    healthTips: 'Gorduras boas para o cérebro e coração.',
    tags: ['Ômega-3', 'Bowl'],
    createdAt: Date.now()
  },
  {
    id: 'mock-6',
    name: 'Escondidinho de Patinho e Abóbora',
    description: 'Confort food em versão leve e low carb.',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=600&auto=format&fit=crop', // Generic healthy food
    prepTime: '40 min',
    difficulty: 'Médio',
    category: 'Almoço',
    macros: { calories: 380, protein: 30, carbs: 25, fats: 12 },
    ingredients: [
        { name: 'Patinho moído', quantity: '150g', icon: '🥩' },
        { name: 'Abóbora Cabotiá', quantity: '200g', icon: '🎃' },
        { name: 'Queijo Cottage', quantity: '1 colher', icon: '🧀' }
    ],
    instructions: [
        'Refogue a carne moída com temperos.',
        'Cozinhe a abóbora e faça um purê.',
        'Em um refratário, coloque a carne e cubra com o purê.',
        'Leve ao forno para gratinar.'
    ],
    substitutions: [
        { original: 'Batata Inglesa', replacement: 'Abóbora', reason: 'Menos calorias e carboidratos' }
    ],
    healthTips: 'Baixa densidade calórica, pode comer um volume maior.',
    tags: ['Confort Food', 'Low Carb'],
    createdAt: Date.now()
  },

  // --- Lanches ---
  {
    id: 'mock-7',
    name: 'Crepioca de Frango',
    description: 'O lanche proteico mais famoso do Brasil.',
    imageUrl: 'https://images.unsplash.com/photo-1626809712716-24d9c724772b?q=80&w=600&auto=format&fit=crop', // Tapioca visual
    prepTime: '10 min',
    difficulty: 'Fácil',
    category: 'Lanches',
    macros: { calories: 250, protein: 15, carbs: 20, fats: 8 },
    ingredients: [
        { name: 'Ovo', quantity: '1 unidade', icon: '🥚' },
        { name: 'Goma de Tapioca', quantity: '1 colher', icon: '⚪' },
        { name: 'Frango desfiado', quantity: '2 colheres', icon: '🍗' }
    ],
    instructions: [
        'Misture o ovo e a tapioca.',
        'Coloque na frigideira como uma panqueca.',
        'Quando firmar, adicione o frango e dobre.',
        'Deixe dourar.'
    ],
    substitutions: [
        { original: 'Pão Francês', replacement: 'Crepioca', reason: 'Sem glúten e mais proteína' }
    ],
    healthTips: 'Ótimo pós-treino rápido.',
    tags: ['Sem Glúten', 'Prático'],
    createdAt: Date.now()
  },
  {
    id: 'mock-8',
    name: 'Iogurte com Whey e Frutas',
    description: 'Sobremesa ou lanche anabólico.',
    imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a029177b?q=80&w=600&auto=format&fit=crop',
    prepTime: '2 min',
    difficulty: 'Fácil',
    category: 'Lanches',
    macros: { calories: 180, protein: 25, carbs: 15, fats: 2 },
    ingredients: [
        { name: 'Iogurte Desnatado', quantity: '1 potinho', icon: '🥛' },
        { name: 'Whey Protein', quantity: '1 scoop', icon: '💪' },
        { name: 'Morango', quantity: '5 unidades', icon: '🍓' }
    ],
    instructions: [
        'Misture o Whey no iogurte até dissolver.',
        'Pique os morangos e coloque por cima.'
    ],
    substitutions: [],
    healthTips: 'Mata a vontade de doce com muita proteína.',
    tags: ['Doce Fit', 'Rápido'],
    createdAt: Date.now()
  },
  {
    id: 'mock-9',
    name: 'Chips de Coco',
    description: 'Gorduras boas para saciedade.',
    imageUrl: 'https://images.unsplash.com/photo-1599580227318-687f8d689626?q=80&w=600&auto=format&fit=crop', // Coconut
    prepTime: '5 min',
    difficulty: 'Fácil',
    category: 'Lanches',
    macros: { calories: 200, protein: 2, carbs: 5, fats: 18 },
    ingredients: [
        { name: 'Coco seco em lâminas', quantity: '50g', icon: '🥥' }
    ],
    instructions: [
        'Compre pronto ou asse lâminas de coco até dourar.',
        'Ótimo para levar na bolsa.'
    ],
    substitutions: [],
    healthTips: 'Fonte de energia rápida (TCM).',
    tags: ['Keto', 'Vegano'],
    createdAt: Date.now()
  },

  // --- Jantar ---
  {
    id: 'mock-10',
    name: 'Omelete de Forno com Vegetais',
    description: 'Jantar leve para dormir bem.',
    imageUrl: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?q=80&w=600&auto=format&fit=crop',
    prepTime: '20 min',
    difficulty: 'Fácil',
    category: 'Jantar',
    macros: { calories: 220, protein: 16, carbs: 8, fats: 12 },
    ingredients: [
        { name: 'Ovos', quantity: '2 unidades', icon: '🥚' },
        { name: 'Espinafre', quantity: '1 xícara', icon: '🌿' },
        { name: 'Tomate cereja', quantity: '5 unidades', icon: '🍅' }
    ],
    instructions: [
        'Bata os ovos com sal e pimenta.',
        'Misture os vegetais picados.',
        'Coloque em forminhas de silicone.',
        'Asse por 15 min ou até firmar.'
    ],
    substitutions: [],
    healthTips: 'Fácil digestão à noite.',
    tags: ['Low Carb', 'Leve'],
    createdAt: Date.now()
  },
  {
    id: 'mock-11',
    name: 'Sopa de Abóbora com Gengibre',
    description: 'Termogênica e reconfortante.',
    imageUrl: 'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2b?q=80&w=600&auto=format&fit=crop',
    prepTime: '30 min',
    difficulty: 'Médio',
    category: 'Jantar',
    macros: { calories: 150, protein: 4, carbs: 25, fats: 2 },
    ingredients: [
        { name: 'Abóbora', quantity: '300g', icon: '🎃' },
        { name: 'Gengibre', quantity: '1 pedaço', icon: '🫚' },
        { name: 'Caldo de legumes', quantity: '500ml', icon: '🥘' }
    ],
    instructions: [
        'Cozinhe a abóbora no caldo.',
        'Bata no liquidificador com o gengibre.',
        'Aqueça e sirva.'
    ],
    substitutions: [],
    healthTips: 'Baixa caloria, ideal para emagrecimento.',
    tags: ['Detox', 'Vegano'],
    createdAt: Date.now()
  },
  {
    id: 'mock-12',
    name: 'Salada Caesar com Iogurte',
    description: 'Versão leve do clássico molho.',
    imageUrl: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=600&auto=format&fit=crop',
    prepTime: '15 min',
    difficulty: 'Fácil',
    category: 'Jantar',
    macros: { calories: 300, protein: 25, carbs: 10, fats: 15 },
    ingredients: [
        { name: 'Alface Americana', quantity: '1/2 maço', icon: '🥬' },
        { name: 'Tiras de frango', quantity: '100g', icon: '🍗' },
        { name: 'Molho de Iogurte', quantity: '2 colheres', icon: '🥣' }
    ],
    instructions: [
        'Misture iogurte, limão e mostarda para o molho.',
        'Rasgue a alface e adicione o frango.',
        'Misture o molho na hora de servir.'
    ],
    substitutions: [
        { original: 'Maionese', replacement: 'Iogurte Natural', reason: 'Menos gordura saturada' }
    ],
    healthTips: 'Jantar fresco e proteico.',
    tags: ['Salada', 'Fresco'],
    createdAt: Date.now()
  }
];
