// Health References Database
// Centralized source for all health and nutrition citations used in the app

export interface HealthReference {
    id: string;
    title: string;
    url: string;
    category: 'macros' | 'health_tips' | 'substitutions' | 'dietary_restrictions' | 'general';
    summary: string;
    source: string; // Organization/Institution name
}

export const HEALTH_REFERENCES: Record<string, HealthReference> = {
    // Macronutrients
    'protein-muscle': {
        id: 'protein-muscle',
        title: 'Papel da Proteína na Síntese Muscular',
        url: 'https://www.health.harvard.edu/nutrition/when-it-comes-to-protein-how-much-is-too-much',
        category: 'macros',
        summary: 'A proteína é essencial para construção e reparação muscular. Estudos mostram que consumo adequado é crucial para hipertrofia.',
        source: 'Harvard Medical School'
    },

    'protein-satiety': {
        id: 'protein-satiety',
        title: 'Proteína e Saciedade',
        url: 'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC524030/',
        category: 'macros',
        summary: 'Proteína promove maior saciedade comparada a carboidratos e gorduras, auxiliando no controle de peso.',
        source: 'National Institutes of Health (NIH)'
    },

    'omega3-health': {
        id: 'omega3-health',
        title: 'Benefícios do Ômega-3',
        url: 'https://www.heart.org/en/healthy-living/healthy-eating/eat-smart/fats/fish-and-omega-3-fatty-acids',
        category: 'health_tips',
        summary: 'Ácidos graxos Ômega-3 são anti-inflamatórios naturais e essenciais para saúde cardiovascular.',
        source: 'American Heart Association'
    },

    'choline-brain': {
        id: 'choline-brain',
        title: 'Colina e Função Cerebral',
        url: 'https://ods.od.nih.gov/factsheets/Choline-HealthProfessional/',
        category: 'health_tips',
        summary: 'Colina é essencial para a produção de acetilcolina, neurotransmissor importante para memória e função cognitiva.',
        source: 'NIH Office of Dietary Supplements'
    },

    'fiber-digestion': {
        id: 'fiber-digestion',
        title: 'Fibras e Saúde Digestiva',
        url: 'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/fiber/art-20043983',
        category: 'health_tips',
        summary: 'Fibras alimentares melhoram a digestão, reduzem colesterol e auxiliam no controle glicêmico.',
        source: 'Mayo Clinic'
    },

    'carbs-energy': {
        id: 'carbs-energy',
        title: 'Carboidratos Complexos como Fonte de Energia',
        url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
        category: 'macros',
        summary: 'Carboidratos complexos fornecem energia sustentada e são preferíveis a açúcares simples para saúde metabólica.',
        source: 'World Health Organization (WHO)'
    },

    'calorie-deficit': {
        id: 'calorie-deficit',
        title: 'Déficit Calórico e Perda de Peso',
        url: 'https://www.cdc.gov/healthyweight/losing_weight/index.html',
        category: 'general',
        summary: 'Perda de peso sustentável requer déficit calórico moderado combinado com atividade física.',
        source: 'Centers for Disease Control and Prevention (CDC)'
    },

    'vitamin-a': {
        id: 'vitamin-a',
        title: 'Vitamina A e Saúde Ocular',
        url: 'https://ods.od.nih.gov/factsheets/VitaminA-HealthProfessional/',
        category: 'health_tips',
        summary: 'Vitamina A é essencial para visão, sistema imunológico e função celular adequada.',
        source: 'NIH Office of Dietary Supplements'
    },

    'iron-absorption': {
        id: 'iron-absorption',
        title: 'Ferro e Anemia',
        url: 'https://www.who.int/health-topics/anaemia',
        category: 'health_tips',
        summary: 'Ferro é crucial para produção de hemoglobina. Deficiência causa anemia e fadiga.',
        source: 'World Health Organization (WHO)'
    },

    'low-carb': {
        id: 'low-carb',
        title: 'Dietas Low Carb',
        url: 'https://www.health.harvard.edu/staying-healthy/should-you-try-the-keto-diet',
        category: 'dietary_restrictions',
        summary: 'Dietas com restrição de carboidratos podem auxiliar na perda de peso, mas devem ser bem planejadas.',
        source: 'Harvard Medical School'
    },

    'gluten-free': {
        id: 'gluten-free',
        title: 'Dieta Sem Glúten',
        url: 'https://www.mayoclinic.org/healthy-lifestyle/nutrition-and-healthy-eating/in-depth/gluten-free-diet/art-20048530',
        category: 'dietary_restrictions',
        summary: 'Essencial para pessoas com doença celíaca. Não há benefícios comprovados para população geral.',
        source: 'Mayo Clinic'
    },

    'lactose-intolerance': {
        id: 'lactose-intolerance',
        title: 'Intolerância à Lactose',
        url: 'https://www.niddk.nih.gov/health-information/digestive-diseases/lactose-intolerance',
        category: 'dietary_restrictions',
        summary: 'Condição em que o corpo não produz lactase suficiente para digerir lactose do leite.',
        source: 'National Institute of Diabetes and Digestive and Kidney Diseases'
    },

    'vegan-nutrition': {
        id: 'vegan-nutrition',
        title: 'Nutrição Vegana Adequada',
        url: 'https://www.eatright.org/food/nutrition/vegetarian-and-special-diets/vegetarianism-the-basic-facts',
        category: 'dietary_restrictions',
        summary: 'Dietas veganas bem planejadas podem fornecer todos os nutrientes necessários.',
        source: 'Academy of Nutrition and Dietetics'
    },

    'metabolism': {
        id: 'metabolism',
        title: 'Como o Metabolismo Funciona',
        url: 'https://www.mayoclinic.org/healthy-lifestyle/weight-loss/in-depth/metabolism/art-20046508',
        category: 'general',
        summary: 'Metabolismo envolve todos os processos químicos que convertem alimentos em energia.',
        source: 'Mayo Clinic'
    },

    'hydration': {
        id: 'hydration',
        title: 'Importância da Hidratação',
        url: 'https://www.cdc.gov/healthywater/drinking/nutrition/index.html',
        category: 'health_tips',
        summary: 'Hidratação adequada é essencial para todas as funções corporais e performance física.',
        source: 'Centers for Disease Control and Prevention (CDC)'
    },

    'meal-timing': {
        id: 'meal-timing',
        title: 'Frequência de Refeições',
        url: 'https://www.health.harvard.edu/diet-and-weight-loss/eating-frequency-and-weight-loss',
        category: 'general',
        summary: 'Total calórico diário é mais importante que frequência de refeições para controle de peso.',
        source: 'Harvard Medical School'
    },

    'whole-foods': {
        id: 'whole-foods',
        title: 'Benefícios de Alimentos Integrais',
        url: 'https://www.hsph.harvard.edu/nutritionsource/what-should-you-eat/whole-grains/',
        category: 'health_tips',
        summary: 'Alimentos minimamente processados contêm mais nutrientes e fibras que versões refinadas.',
        source: 'Harvard School of Public Health'
    },

    'antioxidants': {
        id: 'antioxidants',
        title: 'Antioxidantes e Saúde Celular',
        url: 'https://www.hsph.harvard.edu/nutritionsource/antioxidants/',
        category: 'health_tips',
        summary: 'Antioxidantes protegem células contra danos de radicais livres.',
        source: 'Harvard School of Public Health'
    },

    'balanced-diet': {
        id: 'balanced-diet',
        title: 'Princípios de uma Dieta Balanceada',
        url: 'https://www.who.int/news-room/fact-sheets/detail/healthy-diet',
        category: 'general',
        summary: 'Dieta saudável inclui variedade de alimentos de todos os grupos alimentares em quantidades adequadas.',
        source: 'World Health Organization (WHO)'
    },

    'portion-control': {
        id: 'portion-control',
        title: 'Controle de Porções',
        url: 'https://www.cdc.gov/healthyweight/healthy_eating/portion_size.html',
        category: 'general',
        summary: 'Controlar tamanho de porções ajuda a gerenciar ingestão calórica e manter peso saudável.',
        source: 'Centers for Disease Control and Prevention (CDC)'
    },

    // General disclaimer reference
    'nutrition-disclaimer': {
        id: 'nutrition-disclaimer',
        title: 'Informações Nutricionais Gerais',
        url: 'https://www.health.harvard.edu/staying-healthy/healthy-eating-plate',
        category: 'general',
        summary: 'As informações nutricionais são baseadas em diretrizes de instituições de saúde reconhecidas. Para orientação personalizada, consulte um profissional de saúde.',
        source: 'Harvard Medical School'
    }
};

// Helper function to get references by category
export const getReferencesByCategory = (category: HealthReference['category']): HealthReference[] => {
    return Object.values(HEALTH_REFERENCES).filter(ref => ref.category === category);
};

// Helper function to get reference by ID
export const getReferenceById = (id: string): HealthReference | undefined => {
    return HEALTH_REFERENCES[id];
};

// Helper function to get references by IDs
export const getReferencesByIds = (ids: string[]): HealthReference[] => {
    return ids.map(id => HEALTH_REFERENCES[id]).filter(Boolean);
};

// Map common health tips to reference IDs
export const mapHealthTipToReference = (healthTip: string): string[] => {
    const lowerTip = healthTip.toLowerCase();
    const references: string[] = [];

    // Basic mapping based on keywords
    if (lowerTip.includes('proteína') || lowerTip.includes('protein')) {
        references.push('protein-muscle', 'protein-satiety');
    }
    if (lowerTip.includes('ômega-3') || lowerTip.includes('omega')) {
        references.push('omega3-health');
    }
    if (lowerTip.includes('colina') || lowerTip.includes('choline')) {
        references.push('choline-brain');
    }
    if (lowerTip.includes('fibra') || lowerTip.includes('fiber')) {
        references.push('fiber-digestion');
    }
    if (lowerTip.includes('vitamina a') || lowerTip.includes('vitamin a')) {
        references.push('vitamin-a');
    }
    if (lowerTip.includes('ferro') || lowerTip.includes('iron')) {
        references.push('iron-absorption');
    }
    if (lowerTip.includes('carboidrato') || lowerTip.includes('carb')) {
        references.push('carbs-energy');
    }
    if (lowerTip.includes('caloria') || lowerTip.includes('calorie')) {
        references.push('calorie-deficit');
    }
    if (lowerTip.includes('metabolismo') || lowerTip.includes('metabolism')) {
        references.push('metabolism');
    }
    if (lowerTip.includes('antioxidante') || lowerTip.includes('antioxidant')) {
        references.push('antioxidants');
    }
    if (lowerTip.includes('hidrata') || lowerTip.includes('água') || lowerTip.includes('water')) {
        references.push('hydration');
    }

    // If no specific match, add general disclaimer
    if (references.length === 0) {
        references.push('nutrition-disclaimer');
    }

    return references;
};
