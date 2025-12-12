import { randomUUID } from 'expo-crypto';
import { UserGoal, Recipe, UserProfile, WeeklyPlan, ShoppingList, ShoppingItem } from "../types";
import { generateAndSaveImage, getImageUrl } from './imageService';
import { BACKEND_URL } from './config';
import { mapHealthTipToReference } from './healthReferences';

// Helper to call backend with timeout (handles Render cold starts)
const callBackend = async (endpoint: string, body: any, onProgress?: (status: string, progress: number) => void) => {
    console.log(`Calling backend: ${BACKEND_URL}${endpoint}`);

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
            onProgress("🌟 Conectando ao Chef IA...", 0.05);

            // After 5 seconds, show cold start message
            setTimeout(() => {
                onProgress("⏰ Despertando o servidor... (isso pode levar até 1 minuto na primeira vez)", 0.1);
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

export const identifyIngredientsFromImage = async (base64Image: string, onProgress?: (status: string, progress: number) => void): Promise<string[]> => {
    const ingredientSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            ingredients: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "Lista de ingredientes identificados em português"
            }
        },
        required: ["ingredients"]
    };

    console.log('🖼️ identifyIngredientsFromImage called, base64 length:', base64Image.length);

    try {
        onProgress?.("Enviando imagem para o Chef IA...", 0.2);
        const response = await retryOperation(() => callBackend('/api/generate-recipe', {
            model: "gemini-2.0-flash",
            contents: [
                {
                    inlineData: {
                        mimeType: 'image/jpeg',
                        data: base64Image
                    }
                },
                {
                    text: "Analise esta imagem e identifique todos os ingredientes alimentícios visíveis (frutas, vegetais, embalagens, etc). Liste apenas os nomes em português, de forma genérica (ex: 'Leite' em vez de 'Leite Desnatado Marca X'). Se não houver alimentos visíveis, retorne uma lista vazia."
                }
            ],
            config: {
                responseMimeType: "application/json",
                responseSchema: ingredientSchema,
                temperature: 0.5,
            }
        }, onProgress));

        console.log('📥 Backend response received:', response);

        const text = response.text;
        if (!text) {
            console.warn('⚠️ Empty response from backend');
            return [];
        }

        onProgress?.("Identificando ingredientes...", 0.8);
        const data = JSON.parse(text);
        console.log('🍎 Parsed ingredients:', data.ingredients);
        onProgress?.("Concluído!", 1.0);
        return data.ingredients || [];

    } catch (error: any) {
        console.error("❌ Error identifying ingredients:", error);
        // Re-throw the error so the UI can handle it
        throw new Error(`Falha ao analisar imagem: ${error.message || 'Erro desconhecido'}`);
    }
};

const recipeSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "Nome criativo e apetitoso da versão fitness" },
        originalName: { type: Type.STRING, description: "Nome do prato original (se aplicável, senão deixe vazio)" },
        description: { type: Type.STRING, description: "Descrição curta e vendedora do prato (max 150 caracteres)" },
        prepTime: { type: Type.STRING, description: "Tempo total (ex: 20 min)" },
        difficulty: { type: Type.STRING, enum: ["Fácil", "Médio", "Difícil"] },
        category: { type: Type.STRING, enum: ['Café da Manhã', 'Almoço', 'Jantar', 'Lanches', 'Pré-Treino', 'Sobremesa'] },
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
                    name: { type: Type.STRING, description: "Nome do ingrediente" },
                    quantity: { type: Type.STRING, description: "Quantidade (ex: 200g, 1 xícara, 2 unidades)" },
                    icon: { type: Type.STRING, description: "Um único emoji representando este ingrediente" }
                },
                required: ["name", "quantity", "icon"]
            },
            description: "Lista estruturada de ingredientes",
        },
        substitutions: {
            type: Type.ARRAY,
            description: "Lista de trocas inteligentes realizadas",
            items: {
                type: Type.OBJECT,
                properties: {
                    original: { type: Type.STRING, description: "Ingrediente calórico/original" },
                    replacement: { type: Type.STRING, description: "Ingrediente fitness escolhido" },
                    reason: { type: Type.STRING, description: "Benefício nutricional da troca (ex: Menos índice glicêmico)" },
                }
            }
        },
        instructions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Passo a passo numerado, claro e direto",
        },
        healthTips: { type: Type.STRING, description: "Por que essa versão ajuda no objetivo do usuário?" },
        tags: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3-4 tags curtas (ex: High Protein, Keto)" },
    },
    required: ["name", "description", "prepTime", "difficulty", "category", "macros", "ingredients", "instructions", "substitutions", "healthTips", "tags"],
};

export const generateFitnessRecipe = async (
    input: string | string[], // Can be a dish name (string) or ingredients list (string[])
    goal: UserGoal,
    restrictions: string[] = [],
    dislikes: string[] = [],
    onProgress?: (status: string, progress: number) => void
): Promise<Recipe | null> => {

    onProgress?.("Conectando ao Chef IA...", 0.1);

    const goalPromptMap = {
        [UserGoal.LOSE_WEIGHT]: "foco em déficit calórico, alta saciedade e baixo carboidrato simples",
        [UserGoal.GAIN_MUSCLE]: "foco em superávit limpo, alta proteína e carboidratos complexos para energia",
        [UserGoal.EAT_HEALTHY]: "foco em densidade nutricional, ingredientes naturais e equilíbrio de macros",
        [UserGoal.MAINTAIN]: "foco em manutenção de peso, equilíbrio de macros e ingredientes naturais"
    };

    const isPantryMode = Array.isArray(input);

    let coreInstruction = "";
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

    const prompt = `
    Atue como o Chef NutriVerse, especialista em nutrição esportiva e gastronomia funcional.
    
    Objetivo do Usuário: ${goalPromptMap[goal]}.
    Objetivo do Usuário: ${goalPromptMap[goal]}.
    Restrições/Alergias: ${restrictions.join(", ") || "Nenhuma"}.
    Aversões (NÃO USAR): ${dislikes.join(", ") || "Nenhuma"}.

    ${coreInstruction}

    Regras:
    1. Se for Pantry Mode, invente um nome criativo e apetitoso para a receita (NUNCA deixe vazio).
    2. Se for Transform Mode (prato específico), use o nome original no campo 'originalName'.
    3. Calcule macros estimados com precisão.
    4. Classifique a receita em uma destas categorias exatas: 'Café da Manhã', 'Almoço', 'Jantar', 'Lanches', 'Pré-Treino', 'Sobremesa'.
    5. Preencha o array 'substitutions' explicando o que foi trocado e por quê (ex: Açúcar -> Xilitol). Se for Pantry Mode e não houver troca direta, deixe vazio ou liste o ingrediente chave.
    6. Para os ingredientes, separe OBRIGATORIAMENTE o nome, a quantidade e escolha um emoji representativo. Liste TODOS os ingredientes necessários.
    7. No Modo de Preparo (instructions), seja DETALHADO. Explique o passo a passo com clareza, tempos de cozimento e dicas visuais (ex: "até dourar", "cerca de 10 min"). Evite instruções muito curtas.
    
    Gere uma resposta JSON estrita seguindo o schema fornecido. Certifique-se de que todos os campos obrigatórios estejam preenchidos com conteúdo rico.
  `;

    try {
        onProgress?.("Analisando ingredientes e objetivos...", 0.3);
        const response = await retryOperation(() => callBackend('/api/generate-recipe', {
            model: "gemini-2.0-flash-exp",
            contents: [{ text: prompt }],
            config: {
                responseMimeType: "application/json",
                responseSchema: recipeSchema,
                temperature: 0.7,
            },
        }, onProgress));

        const text = response.text;
        if (!text) throw new Error("Empty response from Gemini");

        const data = JSON.parse(text);

        // Generate AI Image and save locally
        onProgress?.("Criando fotografia do prato...", 0.7);
        let localImageUri = null;
        try {
            localImageUri = await generateAndSaveImage(data.name);
        } catch (e) {
            console.warn("Failed to generate image, using fallback URL");
        }

        onProgress?.("Finalizando receita...", 0.9);

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
    allowRepeats: boolean = false
): Promise<WeeklyPlan | null> => {
    const repeatInstruction = allowRepeats
        ? "O usuário PREFERE repetir refeições para praticidade (ex: jantar de segunda vira almoço de terça). Repita pratos estrategicamente."
        : "O usuário prefere variedade máxima. Evite repetir o mesmo prato.";

    const prompt = `
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
                        dayName: { type: Type.STRING, enum: ["Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"] },
                        meals: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    timeSlot: { type: Type.STRING, enum: ["Café da Manhã", "Almoço", "Lanche", "Jantar", "Ceia"] },
                                    recipe: recipeSchema // Reusing the full recipe schema
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
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: planSchema,
                temperature: 0.7,
            }
        }));

        const text = response.text;
        if (!text) throw new Error("Empty response");

        const data = JSON.parse(text);

        // Post-process to add IDs and Images
        const days = data.days.map((day: any) => ({
            ...day,
            meals: day.meals.map((meal: any) => ({
                id: randomUUID(),
                timeSlot: meal.timeSlot,
                recipe: {
                    ...meal.recipe,
                    id: randomUUID(),
                    createdAt: Date.now(),
                    imageUrl: getImageUrl(meal.recipe.name)
                }
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

export const generateShoppingList = async (plan: WeeklyPlan): Promise<ShoppingList | null> => {
    // Extract all ingredients into a flat string list for the prompt
    const allIngredients = plan.days.flatMap(d =>
        d.meals.flatMap(m =>
            m.recipe.ingredients.map(i => `${i.quantity} ${i.name}`)
        )
    ).join('; ');

    const prompt = `
        Analise esta lista crua de ingredientes de todas as refeições de uma semana:
        "${allIngredients}"

        Sua tarefa é:
        1. Consolidar itens repetidos (ex: some as quantidades de "Frango" ou "Ovos").
        2. Categorizar cada item em: 'Hortifruti', 'Proteínas', 'Laticínios', 'Mercearia', 'Outros'.
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
                        category: { type: Type.STRING, enum: ['Hortifruti', 'Proteínas', 'Laticínios', 'Mercearia', 'Outros'] }
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
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: listSchema
            }
        }));

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
