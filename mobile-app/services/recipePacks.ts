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
        description: 'Comece o dia com energia total! Esta omelete é uma bomba de nutrientes, combinando a leveza do espinafre com o sabor terroso dos cogumelos.',
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
        instructions: ['Bata os ovos vigorosamente.', 'Refogue o espinafre e os cogumelos até murcharem.', 'Despeje os ovos e cozinhe em fogo baixo até firmar.'],
        substitutions: [],
        healthTips: 'O espinafre é rico em ferro e fibras, ajudando na saciedade.',
        tags: ['Low Carb', 'Proteico'],
        createdAt: Date.now()
    },
    {
        id: 'lw_2',
        name: 'Frango Grelhado com Abobrinha e Limão',
        description: 'Simplicidade que funciona. O limão traz um frescor incrível ao frango, enquanto a abobrinha garante volume ao prato sem adicionar calorias extras.',
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
        instructions: ['Tempere o frango com limão e ervas.', 'Grelhe o frango até dourar.', 'Refogue a abobrinha na mesma frigideira para pegar o sabor.'],
        substitutions: [],
        healthTips: 'Excelente fonte de proteína magra para manutenção muscular.',
        tags: ['Low Carb', 'Rápido'],
        createdAt: Date.now()
    },
    {
        id: 'lw_3',
        name: 'Salada de Atum com Grão de Bico',
        description: 'Praticidade em forma de refeição. Uma salada robusta que não te deixa com fome 1 hora depois, graças à combinação de fibras e proteínas.',
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
        instructions: ['Drene o atum e o grão de bico.', 'Misture todos os ingredientes em uma tigela.', 'Tempere com azeite, sal e limão a gosto.'],
        substitutions: [],
        healthTips: 'Rico em Ômega-3, essencial para a saúde cardiovascular.',
        tags: ['Sem Fogão', 'Prático'],
        createdAt: Date.now()
    },
    {
        id: 'lw_4',
        name: 'Espaguete de Abobrinha à Bolonhesa',
        description: 'Sinta o prazer de comer uma macarronada sem a culpa dos carboidratos. O molho à bolonhesa caseiro transforma a abobrinha em um prato de chef.',
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
        instructions: ['Use um espiralizador ou descascador para fazer fios de abobrinha.', 'Refogue a carne moída e adicione o molho.', 'Sirva o molho quente sobre a abobrinha crua ou levemente refogada.'],
        substitutions: [],
        healthTips: 'Reduz drasticamente as calorias comparado à massa tradicional.',
        tags: ['Low Carb', 'Conforto'],
        createdAt: Date.now()
    },
    {
        id: 'lw_5',
        name: 'Smoothie Verde Detox',
        description: 'O botão de reset para o seu corpo. Ideal para desinchar e começar o dia leve, mas nutrido.',
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
        instructions: ['Lave bem os ingredientes.', 'Bata tudo no liquidificador com água e gelo até ficar homogêneo.'],
        substitutions: [],
        healthTips: 'O gengibre acelera o metabolismo e a couve é anti-inflamatória.',
        tags: ['Detox', 'Vegano'],
        createdAt: Date.now()
    }
];

const GAIN_MUSCLE_RECIPES: Recipe[] = [
    {
        id: 'gm_1',
        name: 'Frango Cremoso com Cottage',
        description: 'A cremosidade que você ama, com a proteína que você precisa. O queijo cottage eleva o teor proteico deste prato sem adicionar gorduras pesadas.',
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
        instructions: ['Tempere e grelhe os filés de frango.', 'Adicione o cottage sobre o frango quente para derreter levemente.', 'Sirva acompanhado do arroz integral soltinho.'],
        substitutions: [],
        healthTips: 'O cottage é uma das melhores fontes de caseína, proteína de lenta absorção.',
        tags: ['Hipertrofia', 'Almoço'],
        createdAt: Date.now()
    },
    {
        id: 'gm_2',
        name: 'Panqueca Proteica de Banana',
        description: 'O café da manhã dos campeões. Doce na medida certa, fofinha e carregada de energia para destruir no treino.',
        prepTime: '15 min',
        difficulty: 'Fácil',
        category: 'Café da Manhã',
        macros: { calories: 450, protein: 25, carbs: 50, fats: 12 },
        ingredients: [
            { name: 'Banana', quantity: '1 un', icon: '🍌' },
            { name: 'Ovos', quantity: '2 un', icon: '🥚' },
            { name: 'Pasta de Amendoim', quantity: '1 colher', icon: '🥜' }
        ],
        instructions: ['Amasse bem a banana com um garfo.', 'Misture os ovos até ficar homogêneo.', 'Frite em frigideira antiaderente e finalize com a pasta de amendoim.'],
        substitutions: [],
        healthTips: 'O potássio da banana ajuda a prevenir cãibras musculares.',
        tags: ['Pré-Treino', 'Doce'],
        createdAt: Date.now()
    },
    {
        id: 'gm_3',
        name: 'Macarrão com Carne Moída Magra',
        description: 'O clássico que nunca falha. Uma refeição densa, perfeita para pós-treino, repondo glicogênio e reparando as fibras musculares.',
        prepTime: '20 min',
        difficulty: 'Fácil',
        category: 'Almoço',
        macros: { calories: 650, protein: 40, carbs: 70, fats: 18 },
        ingredients: [
            { name: 'Macarrão Integral', quantity: '100g', icon: '🍝' },
            { name: 'Carne Moída', quantity: '150g', icon: '🥩' },
            { name: 'Espinafre', quantity: '1 punhado', icon: '🌿' }
        ],
        instructions: ['Cozinhe o macarrão al dente.', 'Refogue a carne moída com temperos a gosto.', 'Misture o espinafre no final para murchar e incorpore tudo.'],
        substitutions: [],
        healthTips: 'Prefira cortes magros como patinho para manter a gordura controlada.',
        tags: ['Bulking', 'Clássico'],
        createdAt: Date.now()
    },
    {
        id: 'gm_4',
        name: 'Smoothie Hipercalórico Clean',
        description: 'Calorias limpas em um copo. A solução perfeita para quem tem dificuldade em bater a meta calórica comendo comida sólida.',
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
        instructions: ['Coloque todos os ingredientes no liquidificador.', 'Bata até ficar bem cremoso.', 'Beba imediatamente.'],
        substitutions: [],
        healthTips: 'A aveia fornece carboidratos de liberação lenta, mantendo a energia estável.',
        tags: ['Lanche', 'Rápido'],
        createdAt: Date.now()
    },
    {
        id: 'gm_5',
        name: 'Salmão Grelhado com Purê',
        description: 'Jantar de rei. O ômega-3 do salmão combate a inflamação muscular, enquanto o purê garante o sono anabólico perfeito.',
        prepTime: '30 min',
        difficulty: 'Médio',
        category: 'Jantar',
        macros: { calories: 600, protein: 35, carbs: 40, fats: 25 },
        ingredients: [
            { name: 'Salmão', quantity: '150g', icon: '🐟' },
            { name: 'Batata Doce', quantity: '150g', icon: '🍠' }
        ],
        instructions: ['Cozinhe a batata e amasse para fazer o purê.', 'Grelhe o salmão com a pele para baixo até ficar crocante.', 'Sirva juntos.'],
        substitutions: [],
        healthTips: 'Gorduras boas são essenciais para a produção de testosterona.',
        tags: ['Jantar', 'Saudável'],
        createdAt: Date.now()
    }
];

const HEALTHY_RECIPES: Recipe[] = [
    {
        id: 'h_1',
        name: 'Buddha Bowl Colorido',
        description: 'Um arco-íris no seu prato. Cada cor representa um nutriente diferente, garantindo uma refeição completa, vibrante e cheia de vida.',
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
        instructions: ['Cozinhe a quinoa.', 'Disponha os ingredientes lado a lado em uma tigela funda.', 'Regue com azeite e limão.'],
        substitutions: [],
        healthTips: 'Rico em gorduras monoinsaturadas e fibras para a saúde do coração.',
        tags: ['Vegano', 'Saudável'],
        createdAt: Date.now()
    },
    {
        id: 'h_2',
        name: 'Salmão ao Molho de Maracujá',
        description: 'Elegância e saúde. O azedinho do maracujá corta a gordura do salmão, criando um equilíbrio de sabores digno de restaurante.',
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
        instructions: ['Grelhe o salmão.', 'Em uma panela, reduza a polpa do maracujá com o mel.', 'Sirva o molho sobre o peixe.'],
        substitutions: [],
        healthTips: 'O maracujá possui propriedades calmantes naturais.',
        tags: ['Jantar', 'Sofisticado'],
        createdAt: Date.now()
    },
    {
        id: 'h_3',
        name: 'Wrap de Couve com Frango e Ricota',
        description: 'Leveza absoluta. Substituímos a massa pela folha de couve crocante, criando um wrap refrescante e ultra nutritivo.',
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
        instructions: ['Passe a folha de couve rapidamente na água quente (branqueamento).', 'Recheie com frango e ricota.', 'Enrole como um charuto.'],
        substitutions: [],
        healthTips: 'Uma das melhores formas de consumir vegetais crus/semi-crus.',
        tags: ['Lanche', 'Leve'],
        createdAt: Date.now()
    },
    {
        id: 'h_4',
        name: 'Risoto de Quinoa com Cogumelos',
        description: 'Cremosidade sem culpa. A quinoa traz uma textura incrível e muito mais proteína que o arroz arbóreo tradicional.',
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
        instructions: ['Refogue os cogumelos.', 'Adicione a quinoa e vá colocando o caldo aos poucos, mexendo sempre.', 'Finalize quando estiver cremoso.'],
        substitutions: [],
        healthTips: 'A quinoa é um dos poucos vegetais que contém todos os aminoácidos essenciais.',
        tags: ['Vegano', 'Jantar'],
        createdAt: Date.now()
    },
    {
        id: 'h_5',
        name: 'Tacos de Alface com Carne Desfiada',
        description: 'Diversão na hora de comer. Crocante, saboroso e perfeito para compartilhar, sem a farinha das tortillas tradicionais.',
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
        instructions: ['Lave e seque bem as folhas de alface para ficarem crocantes.', 'Use-as como concha.', 'Recheie com a carne quente e o vinagrete frio.'],
        substitutions: [],
        healthTips: 'Ideal para dietas cetogênicas e low carb.',
        tags: ['Keto', 'Divertido'],
        createdAt: Date.now()
    }
];

export const RECIPE_PACKS: Record<string, RecipePack> = {
    [UserGoal.LOSE_WEIGHT]: {
        id: 'pack_lose_weight',
        goal: UserGoal.LOSE_WEIGHT,
        title: 'Queima de Gordura Acelerada',
        description: 'Receitas estrategicamente selecionadas com baixa densidade calórica e alto poder de saciedade para você secar sem passar fome.',
        recipes: LOSE_WEIGHT_RECIPES
    },
    [UserGoal.GAIN_MUSCLE]: {
        id: 'pack_gain_muscle',
        goal: UserGoal.GAIN_MUSCLE,
        title: 'Hipertrofia Máxima',
        description: 'Combustível premium para seus músculos. Pratos ricos em proteínas de alto valor biológico e carboidratos complexos para recuperação e crescimento.',
        recipes: GAIN_MUSCLE_RECIPES
    },
    [UserGoal.EAT_HEALTHY]: {
        id: 'pack_healthy',
        goal: UserGoal.EAT_HEALTHY,
        title: 'Vitalidade & Equilíbrio',
        description: 'Nutrição celular completa. Uma seleção de pratos vibrantes, ricos em micronutrientes e antioxidantes para sua melhor versão.',
        recipes: HEALTHY_RECIPES
    },
    // Fallback for MAINTAIN
    [UserGoal.MAINTAIN]: {
        id: 'pack_maintain',
        goal: UserGoal.MAINTAIN,
        title: 'Vitalidade & Equilíbrio',
        description: 'Nutrição celular completa. Uma seleção de pratos vibrantes, ricos em micronutrientes e antioxidantes para sua melhor versão.',
        recipes: HEALTHY_RECIPES
    }
};
