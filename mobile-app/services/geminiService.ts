import { randomUUID } from 'expo-crypto';
import { UserGoal, Recipe, UserProfile, WeeklyPlan, ShoppingList, ShoppingItem } from "../types";
import { generateAndSaveImage, getImageUrl } from './imageService';
import { BACKEND_URL } from './config';
import { mapHealthTipToReference } from './healthReferences';

// Language type for i18n support
export type SupportedLanguage = 'en' | 'pt';

// Bilingual constants for AI prompts
const AI_PROMPTS = {
    en: {
        role: "Act as Chef Fitswap, expert in sports nutrition and functional gastronomy.",
        categories: ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Pre-Workout', 'Dessert'] as const,
        difficulties: ['Easy', 'Medium', 'Hard'] as const,
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const,
        timeSlots: ['Breakfast', 'Lunch', 'Snack', 'Dinner', 'Supper'] as const,
        goals: {
            [UserGoal.LOSE_WEIGHT]: "focus on caloric deficit, high satiety and low simple carbs",
            [UserGoal.GAIN_MUSCLE]: "focus on clean surplus, high protein and complex carbs for energy",
            [UserGoal.EAT_HEALTHY]: "focus on nutritional density, natural ingredients and macro balance",
            [UserGoal.MAINTAIN]: "focus on weight maintenance, macro balance and natural ingredients"
        },
        noRestrictions: "None",
        progress: {
            connecting: "🌟 Connecting to AI Chef...",
            coldStart: "⏰ Waking up the server... (this may take up to 1 minute the first time)",
            sendingImage: "Sending image to AI Chef...",
            identifying: "Identifying ingredients...",
            done: "Done!",
            analyzing: "Analyzing ingredients and goals...",
            creatingRecipe: "🍳 Creating your recipe...",
            calculating: "Calculating ideal calories...",
            addingMacros: "Adding nutritional macros...",
            finalizing: "Finalizing recipe..."
        },
        errors: {
            timeout: 'The server took too long to respond. Please try again in a moment.',
            timeoutDev: 'Timeout. Check if the backend is running.',
            imageFailed: 'Failed to analyze image'
        }
    },
    pt: {
        role: "Atue como o Chef Fitswap, especialista em nutrição esportiva e gastronomia funcional.",
        categories: ['Café da Manhã', 'Almoço', 'Jantar', 'Lanches', 'Pré-Treino', 'Sobremesa'] as const,
        difficulties: ['Fácil', 'Médio', 'Difícil'] as const,
        days: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'] as const,
        timeSlots: ['Café da Manhã', 'Almoço', 'Lanche', 'Jantar', 'Ceia'] as const,
        goals: {
            [UserGoal.LOSE_WEIGHT]: "foco em déficit calórico, alta saciedade e baixo carboidrato simples",
            [UserGoal.GAIN_MUSCLE]: "foco em superávit limpo, alta proteína e carboidratos complexos para energia",
            [UserGoal.EAT_HEALTHY]: "foco em densidade nutricional, ingredientes naturais e equilíbrio de macros",
            [UserGoal.MAINTAIN]: "foco em manutenção de peso, equilíbrio de macros e ingredientes naturais"
        },
        noRestrictions: "Nenhuma",
        progress: {
            connecting: "🌟 Conectando ao Chef IA...",
            coldStart: "⏰ Despertando o servidor... (isso pode levar até 1 minuto na primeira vez)",
            sendingImage: "Enviando imagem para o Chef IA...",
            identifying: "Identificando ingredientes...",
            done: "Concluído!",
            analyzing: "Analisando ingredientes e objetivos...",
            creatingRecipe: "🍳 Criando sua receita...",
            calculating: "Calculando calorias ideais...",
            addingMacros: "Adicionando macros nutricionais...",
            finalizing: "Finalizando receita..."
        },
        errors: {
            timeout: 'O servidor demorou muito para responder. Tente novamente em alguns instantes.',
            timeoutDev: 'Tempo limite excedido. Verifique se o backend está rodando.',
            imageFailed: 'Falha ao analisar imagem'
        }
    }
};

// Helper to call backend with timeout (handles Render cold starts)
const callBackend = async (
    endpoint: string,
    body: any,
    onProgress?: (status: string, progress: number) => void,
    language: SupportedLanguage = 'pt'
) => {
    console.log(`Calling backend: ${BACKEND_URL}${endpoint}`);
    const lang = AI_PROMPTS[language];

    const isProduction = !BACKEND_URL.includes('localhost') && !BACKEND_URL.includes('192.168');

    try {
        // Create abort controller for timeout
        // Production (Render free tier): 120s to handle cold starts (can take up to 50-60s)
        // Development: 60s
        const timeoutDuration = isProduction ? 120000 : 60000;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

        // Show cold start message if in production
        if (isProduction && onProgress) {
            onProgress(lang.progress.connecting, 0.05);

            // After 5 seconds, show cold start message
            setTimeout(() => {
                onProgress(lang.progress.coldStart, 0.1);
            }, 5000);
        }

        const response = await fetch(`${BACKEND_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Backend error ${response.status}: ${errorText}`);
            throw new Error(`Backend error: ${response.status}`);
        }

        const data = await response.json();
        return data; // Expected { text: "..." }
    } catch (error: any) {
        console.error("Backend call failed:", error);

        // Provide helpful error messages
        if (error.name === 'AbortError') {
            throw new Error(isProduction
                ? 'O servidor demorou muito para responder. Tente novamente em alguns instantes.'
                : 'Tempo limite excedido. Verifique se o backend está rodando.');
        }

        throw error;
    }
};

// Helper function for exponential backoff
const retryOperation = async <T>(
    operation: () => Promise<T>,
    retries: number = 3,
    delay: number = 2000
): Promise<T> => {
    try {
        return await operation();
    } catch (error: any) {
        // Check for 503 or specific overload messages
        const isOverloaded = error?.status === 503 || error?.code === 503 || error?.message?.includes('overloaded');
        // Also retry on timeout errors (cold start issues)
        const isTimeout = error?.name === 'AbortError' || error?.message?.includes('demorou muito');

        if (retries > 0 && (isOverloaded || isTimeout)) {
            console.warn(`Server unavailable/timeout. Retrying in ${delay}ms... (Attempts left: ${retries})`);
            await new Promise((resolve) => setTimeout(resolve, delay));
            return retryOperation(operation, retries - 1, delay * 1.5); // Less aggressive backoff for cold starts
        }
        throw error;
    }
};

// Define types locally to avoid SDK dependency
enum Type {
    OBJECT = "OBJECT",
    ARRAY = "ARRAY",
    STRING = "STRING",
    NUMBER = "NUMBER",
    BOOLEAN = "BOOLEAN"
}

interface Schema {
    type: Type;
    properties?: Record<string, Schema>;
    items?: Schema;
    enum?: string[];
    required?: string[];
    description?: string;
}

export const identifyIngredientsFromImage = async (
    base64Image: string,
    onProgress?: (status: string, progress: number) => void,
    language: SupportedLanguage = 'pt'
): Promise<string[]> => {
    const lang = AI_PROMPTS[language];

    const ingredientSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: language === 'en' ? "List of identified ingredients in English" : "Lista de ingredientes identificados em português"
            }
        },
        required: ["ingredients"]
    };

    const promptText = language === 'en'
        ? "Analyze this image and identify all visible food ingredients (fruits, vegetables, packages, etc). List only the names in English, generically (e.g. 'Milk' instead of 'Skim Milk Brand X'). If no food is visible, return an empty list."
        : "Analise esta imagem e identifique todos os ingredientes alimentícios visíveis (frutas, vegetais, embalagens, etc). Liste apenas os nomes em português, de forma genérica (ex: 'Leite' em vez de 'Leite Desnatado Marca X'). Se não houver alimentos visíveis, retorne uma lista vazia.";

    console.log('🖼️ identifyIngredientsFromImage called, base64 length:', base64Image.length);

    try {
        onProgress?.(lang.progress.sendingImage, 0.2);
        const response = await retryOperation(() => callBackend('/api/generate-recipe', {
            model: "gemini-2.0-flash",
            contents: [{
                parts: [
                    {
                        inlineData: {
                            mimeType: 'image/jpeg',
                            data: base64Image
                        }
                    },
                    {
                        text: promptText
                    }
                ]
            }],
            config: {
                responseMimeType: "application/json",
                responseSchema: ingredientSchema,
                temperature: 0.5,
            }
        }, onProgress, language));

        console.log('📥 Backend response received:', response);

        const text = response.text;
        if (!text) {
            console.warn('⚠️ Empty response from backend');
            return [];
        }

        onProgress?.(lang.progress.identifying, 0.8);
        const data = JSON.parse(text);
        console.log('🍎 Parsed ingredients:', data.ingredients);
        onProgress?.(lang.progress.done, 1.0);
        return data.ingredients || [];

    } catch (error: any) {
        console.error("❌ Error identifying ingredients:", error);
        throw new Error(`${lang.errors.imageFailed}: ${error.message || (language === 'en' ? 'Unknown error' : 'Erro desconhecido')}`);
    }
};

// Dynamic recipe schema that supports bilingual categories and difficulties
const getRecipeSchema = (language: SupportedLanguage = 'pt'): Schema => {
    const lang = AI_PROMPTS[language];

    return {
        type: Type.OBJECT,
        properties: {
            name: { type: Type.STRING, description: language === 'en' ? "Creative and appetizing name for the fitness version" : "Nome criativo e apetitoso da versão fitness" },
            originalName: { type: Type.STRING, description: language === 'en' ? "Original dish name (if applicable, otherwise empty)" : "Nome do prato original (se aplicável, senão deixe vazio)" },
            description: { type: Type.STRING, description: language === 'en' ? "Short compelling description (max 150 chars)" : "Descrição curta e vendedora do prato (max 150 caracteres)" },
            prepTime: { type: Type.STRING, description: language === 'en' ? "Total time (e.g. 20 min)" : "Tempo total (ex: 20 min)" },
            difficulty: { type: Type.STRING, enum: [...lang.difficulties] },
            category: { type: Type.STRING, enum: [...lang.categories] },
            macros: {
                type: Type.OBJECT,
                properties: {
                    calories: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fats: { type: Type.NUMBER },
                },
                required: ["calories", "protein", "carbs", "fats"],
            },
            ingredients: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING, description: language === 'en' ? "Ingredient name" : "Nome do ingrediente" },
                        quantity: { type: Type.STRING, description: language === 'en' ? "Quantity (e.g. 200g, 1 cup, 2 units)" : "Quantidade (ex: 200g, 1 xícara, 2 unidades)" },
                        icon: { type: Type.STRING, description: language === 'en' ? "Single emoji representing this ingredient" : "Um único emoji representando este ingrediente" }
                    },
                    required: ["name", "quantity", "icon"]
                },
                description: language === 'en' ? "Structured list of ingredients" : "Lista estruturada de ingredientes",
            },
            substitutions: {
                type: Type.ARRAY,
                description: language === 'en' ? "List of smart substitutions made" : "Lista de trocas inteligentes realizadas",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        original: { type: Type.STRING, description: language === 'en' ? "Original/caloric ingredient" : "Ingrediente calórico/original" },
                        replacement: { type: Type.STRING, description: language === 'en' ? "Fitness ingredient chosen" : "Ingrediente fitness escolhido" },
                        reason: { type: Type.STRING, description: language === 'en' ? "Nutritional benefit (e.g. Lower glycemic index)" : "Benefício nutricional da troca (ex: Menos índice glicêmico)" },
                    }
                }
            },
            instructions: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: language === 'en' ? "Clear, numbered step-by-step instructions" : "Passo a passo numerado, claro e direto",
            },
            healthTips: { type: Type.STRING, description: language === 'en' ? "Why this version helps with the user's goal?" : "Por que essa versão ajuda no objetivo do usuário?" },
            tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: language === 'en' ? "3-4 short tags (e.g. High Protein, Keto)" : "3-4 tags curtas (ex: High Protein, Keto)" },
        },
        required: ["name", "description", "prepTime", "difficulty", "category", "macros", "ingredients", "instructions", "substitutions", "healthTips", "tags"],
    };
};

export const generateFitnessRecipe = async (
    input: string | string[], // Can be a dish name (string) or ingredients list (string[])
    goal: UserGoal,
    restrictions: string[] = [],
    dislikes: string[] = [],
    onProgress?: (status: string, progress: number) => void,
    language: SupportedLanguage = 'pt'
): Promise<Recipe | null> => {

    const lang = AI_PROMPTS[language];
    onProgress?.(lang.progress.connecting, 0.1);

    const isPantryMode = Array.isArray(input);

    // Bilingual core instruction
    let coreInstruction = "";
    if (language === 'en') {
        if (isPantryMode) {
            coreInstruction = `
          The user has a list of ingredients at home: "${(input as string[]).join(", ")}".
          Create a delicious and coherent fitness recipe using MAINLY these ingredients. 
          You can add basic seasonings (salt, pepper, olive oil, herbs) or very common ingredients (water, eggs) if needed, but try to stick to what was listed.
        `;
        } else {
            coreInstruction = `
          The user wants to eat: "${input}".
          Create a "fitness" version (FitSwap) of this dish. Keep the essence of the original flavor, but replace caloric or processed ingredients with functional options aligned to the goal.
          IMPORTANT: Explicitly list the substitutions made in the 'substitutions' array.
        `;
        }
    } else {
        if (isPantryMode) {
            coreInstruction = `
          O usuário enviou uma lista de ingredientes disponíveis em casa: "${(input as string[]).join(", ")}".
          Crie uma receita fitness deliciosa e coerente usando PRINCIPALMENTE esses ingredientes. 
          Você pode adicionar temperos básicos (sal, pimenta, azeite, ervas) ou ingredientes muito comuns (água, ovos) se necessário para dar liga, mas tente se ater ao que foi listado.
        `;
        } else {
            coreInstruction = `
          O usuário tem desejo de comer: "${input}".
          Crie uma versão "fitness" (FitSwap) desse prato. Mantenha a essência do sabor original, mas substitua ingredientes calóricos ou processados por opções funcionais alinhadas ao objetivo.
          IMPORTANTE: Liste explicitamente quais trocas foram feitas no array 'substitutions'.
        `;
        }
    }

    // Bilingual prompt
    const prompt = language === 'en' ? `
    ${lang.role}
    
    User Goal: ${lang.goals[goal]}.
    Restrictions/Allergies: ${restrictions.join(", ") || lang.noRestrictions}.
    Dislikes (DO NOT USE): ${dislikes.join(", ") || lang.noRestrictions}.

    ${coreInstruction}

    Rules:
    1. If Pantry Mode, create a creative and appetizing recipe name (NEVER leave empty).
    2. If Transform Mode (specific dish), use the original name in 'originalName' field.
    3. Calculate estimated macros accurately.
    4. Classify the recipe in one of these exact categories: ${lang.categories.join(', ')}.
    5. Fill the 'substitutions' array explaining what was swapped and why (e.g. Sugar -> Xylitol). If Pantry Mode with no direct swap, leave empty or list the key ingredient.
    6. For ingredients, ALWAYS separate name, quantity and choose a representative emoji. List ALL required ingredients.
    7. In instructions, be DETAILED. Explain step by step with clarity, cooking times and visual cues (e.g. "until golden", "about 10 min").
    
    Generate a strict JSON response following the provided schema. Ensure all required fields are filled with rich content.
    ALL TEXT CONTENT MUST BE IN ENGLISH.
  ` : `
    ${lang.role}
    
    Objetivo do Usuário: ${lang.goals[goal]}.
    Restrições/Alergias: ${restrictions.join(", ") || lang.noRestrictions}.
    Aversões (NÃO USAR): ${dislikes.join(", ") || lang.noRestrictions}.

    ${coreInstruction}

    Regras:
    1. Se for Pantry Mode, invente um nome criativo e apetitoso para a receita (NUNCA deixe vazio).
    2. Se for Transform Mode (prato específico), use o nome original no campo 'originalName'.
    3. Calcule macros estimados com precisão.
    4. Classifique a receita em uma destas categorias exatas: ${lang.categories.join(', ')}.
    5. Preencha o array 'substitutions' explicando o que foi trocado e por quê (ex: Açúcar -> Xilitol). Se for Pantry Mode e não houver troca direta, deixe vazio ou liste o ingrediente chave.
    6. Para os ingredientes, separe OBRIGATORIAMENTE o nome, a quantidade e escolha um emoji representativo. Liste TODOS os ingredientes necessários.
    7. No Modo de Preparo (instructions), seja DETALHADO. Explique o passo a passo com clareza, tempos de cozimento e dicas visuais (ex: "até dourar", "cerca de 10 min"). Evite instruções muito curtas.
    
    Gere uma resposta JSON estrita seguindo o schema fornecido. Certifique-se de que todos os campos obrigatórios estejam preenchidos com conteúdo rico.
  `;

    try {
        onProgress?.(lang.progress.analyzing, 0.3);
        const response = await retryOperation(() => callBackend('/api/generate-recipe', {
            model: "gemini-2.0-flash",
            contents: [{ text: prompt }],
            config: {
                responseMimeType: "application/json",
                responseSchema: getRecipeSchema(language),
                temperature: 0.7,
            },
        }, onProgress, language));

        const text = response.text;
        if (!text) throw new Error("Empty response from Gemini");

        const data = JSON.parse(text);

        // Generate AI Image and save locally
        onProgress?.(language === 'en' ? "Creating dish photo..." : "Criando fotografia do prato...", 0.7);
        let localImageUri = null;
        try {
            localImageUri = await generateAndSaveImage(data.name);
        } catch (e) {
            console.warn("Failed to generate image, using fallback URL");
        }

        onProgress?.(lang.progress.finalizing, 0.9);

        // Auto-assign citations based on health tips
        const citations = mapHealthTipToReference(data.healthTips || "");

        return {
            ...data,
            id: randomUUID(),
            createdAt: Date.now(),
            imageUrl: localImageUri || getImageUrl(data.name),
            citations: citations
        } as Recipe;

    } catch (error) {
        console.error("Error generating recipe:", error);
        return null;
    }
};

// --- Weekly Planning Services ---

export const generateWeeklyPlan = async (
    userProfile: UserProfile,
    preference: string, // "Cheap", "Fast", "Varied", etc.
    mealsCount: number = 3,
    allowRepeats: boolean = false,
    language: SupportedLanguage = 'pt'
): Promise<WeeklyPlan | null> => {
    const lang = AI_PROMPTS[language];

    const repeatInstruction = language === 'en'
        ? (allowRepeats
            ? "The user PREFERS to repeat meals for practicality (e.g. Monday's dinner becomes Tuesday's lunch). Repeat dishes strategically."
            : "The user prefers maximum variety. Avoid repeating the same dish.")
        : (allowRepeats
            ? "O usuário PREFERE repetir refeições para praticidade (ex: jantar de segunda vira almoço de terça). Repita pratos estrategicamente."
            : "O usuário prefere variedade máxima. Evite repetir o mesmo prato.");

    const prompt = language === 'en' ? `
      Create a weekly meal plan (Monday to Sunday) for a user with the following profile:
      Goal: ${userProfile.goal}
      Meals per day: ${mealsCount} (Generate exactly this amount of slots per day)
      Restrictions: ${userProfile.dietaryRestrictions.join(', ') || 'None'}
      Dislikes: ${userProfile.dislikes.join(', ') || 'None'}
      Week preference: ${preference}
      
      Repetition Strategy: ${repeatInstruction}

      Generate a simplified but complete recipe for each meal of each day.
      ALL TEXT CONTENT MUST BE IN ENGLISH.
    ` : `
      Crie um plano alimentar semanal (Segunda a Domingo) para um usuário com o seguinte perfil:
      Objetivo: ${userProfile.goal}
      Refeições por dia: ${mealsCount} (Gere exatamente essa quantidade de slots por dia)
      Restrições: ${userProfile.dietaryRestrictions.join(', ') || 'Nenhuma'}
      Aversões: ${userProfile.dislikes.join(', ') || 'Nenhuma'}
      Preferência da semana: ${preference}
      
      Estratégia de Repetição: ${repeatInstruction}

      Gere uma receita simplificada mas completa para cada refeição de cada dia.
    `;

    const planSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            days: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        dayName: { type: Type.STRING, enum: [...lang.days] },
                        meals: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    timeSlot: { type: Type.STRING, enum: [...lang.timeSlots] },
                                    recipe: getRecipeSchema(language)
                                },
                                required: ["timeSlot", "recipe"]
                            }
                        }
                    },
                    required: ["dayName", "meals"]
                }
            }
        },
        required: ["days"]
    };

    try {
        const response = await retryOperation(() => callBackend('/api/generate-recipe', {
            model: "gemini-2.0-flash",
            contents: [{ text: prompt }],
            config: {
                responseMimeType: "application/json",
                responseSchema: planSchema,
                temperature: 0.7,
            }
        }, undefined, language));

        const text = response.text;
        if (!text) throw new Error("Empty response");

        const data = JSON.parse(text);

        // Post-process to add IDs and Images
        const days = data.days.map((day: any) => ({
            ...day,
            meals: day.meals.map((meal: any) => ({
                id: randomUUID(),
                timeSlot: meal.timeSlot,
                recipe: meal.recipe ? {
                    ...meal.recipe,
                    id: randomUUID(),
                    createdAt: Date.now(),
                    imageUrl: getImageUrl(meal.recipe.name)
                } : null
            }))
        }));

        return {
            id: randomUUID(),
            startDate: Date.now(),
            days
        } as WeeklyPlan;

    } catch (error) {
        console.error("Error generating weekly plan:", error);
        return null;
    }
};

export const generateShoppingList = async (
    plan: WeeklyPlan,
    language: SupportedLanguage = 'pt'
): Promise<ShoppingList | null> => {
    // Extract all ingredients into a flat string list for the prompt
    const allIngredients = plan.days.flatMap(d =>
        d.meals.flatMap(m =>
            m.recipe?.ingredients?.map(i => `${i.quantity} ${i.name}`) || []
        )
    ).join('; ');

    const categories = language === 'en'
        ? ['Produce', 'Proteins', 'Dairy', 'Grocery', 'Other'] as const
        : ['Hortifruti', 'Proteínas', 'Laticínios', 'Mercearia', 'Outros'] as const;

    const prompt = language === 'en' ? `
        Analyze this raw list of ingredients from all meals of a week:
        "${allIngredients}"

        Your task is:
        1. Consolidate repeated items (e.g. sum the quantities of "Chicken" or "Eggs").
        2. Categorize each item in: ${categories.join(', ')}.
        3. Format quantities in a human-friendly way for shopping (e.g. "500g" instead of "0.5kg", "1 dozen" instead of "12 eggs").

        Generate a JSON.
        ALL TEXT CONTENT MUST BE IN ENGLISH.
    ` : `
        Analise esta lista crua de ingredientes de todas as refeições de uma semana:
        "${allIngredients}"

        Sua tarefa é:
        1. Consolidar itens repetidos (ex: some as quantidades de "Frango" ou "Ovos").
        2. Categorizar cada item em: ${categories.join(', ')}.
        3. Formatar as quantidades de forma humana e lógica para compras (ex: "500g" em vez de "0.5kg", "1 dúzia" em vez de "12 ovos").

        Gere um JSON.
    `;

    const listSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            items: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        quantity: { type: Type.STRING },
                        category: { type: Type.STRING, enum: [...categories] }
                    },
                    required: ["name", "quantity", "category"]
                }
            }
        },
        required: ["items"]
    };

    try {
        const response = await retryOperation(() => callBackend('/api/generate-recipe', {
            model: "gemini-2.0-flash",
            contents: [{ text: prompt }],
            config: {
                responseMimeType: "application/json",
                responseSchema: listSchema
            }
        }, undefined, language));

        const text = response.text;
        if (!text) return null;

        const data = JSON.parse(text);

        return {
            items: data.items.map((i: any) => ({ ...i, id: randomUUID(), checked: false }))
        } as ShoppingList;

    } catch (error) {
        console.error("Error generating shopping list", error);
        return null;
    }
}
