
import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { UserGoal, Recipe } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    
    if (retries > 0 && isOverloaded) {
      console.warn(`Model overloaded. Retrying in ${delay}ms... (Attempts left: ${retries})`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const identifyIngredientsFromImage = async (base64Image: string): Promise<string[]> => {
  try {
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming JPEG, can be made dynamic
              data: base64Image
            }
          },
          {
            text: "Identifique todos os ingredientes alimentícios visíveis nesta imagem (geladeira, despensa ou mesa). Liste apenas os nomes dos ingredientes em português, separados por vírgula. Exemplo: Arroz, Feijão, Cenoura."
          }
        ]
      },
    }));

    const text = response.text;
    if (!text) return [];
    
    return text.split(',').map(i => i.trim()).filter(i => i.length > 0);
  } catch (error) {
    console.error("Error identifying ingredients:", error);
    return [];
  }
};

export const generateFitnessRecipe = async (
  input: string | string[], // Can be a dish name (string) or ingredients list (string[])
  goal: UserGoal,
  restrictions: string[] = []
): Promise<Recipe | null> => {
  
  const goalPromptMap = {
    [UserGoal.LOSE_WEIGHT]: "foco em déficit calórico, alta saciedade e baixo carboidrato simples",
    [UserGoal.GAIN_MUSCLE]: "foco em superávit limpo, alta proteína e carboidratos complexos para energia",
    [UserGoal.EAT_HEALTHY]: "foco em densidade nutricional, ingredientes naturais e equilíbrio de macros",
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
    Restrições/Alergias: ${restrictions.join(", ") || "Nenhuma"}.

    ${coreInstruction}

    Regras:
    1. Se for Pantry Mode, invente um nome criativo para a receita.
    2. Se for Transform Mode (prato específico), use o nome original no campo 'originalName'.
    3. Calcule macros estimados com precisão.
    4. Classifique a receita em uma destas categorias exatas: 'Café da Manhã', 'Almoço', 'Jantar', 'Lanches', 'Pré-Treino', 'Sobremesa'.
    5. Preencha o array 'substitutions' explicando o que foi trocado e por quê (ex: Açúcar -> Xilitol). Se for Pantry Mode e não houver troca direta, deixe vazio ou liste o ingrediente chave.
    6. Para os ingredientes, separe OBRIGATORIAMENTE o nome, a quantidade e escolha um emoji representativo.
    
    Gere uma resposta JSON estrita seguindo o schema fornecido.
  `;

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

  try {
    const response = await retryOperation<GenerateContentResponse>(() => ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: recipeSchema,
        temperature: 0.7,
      },
    }));

    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");

    const data = JSON.parse(text);
    
    return {
      ...data,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.name)}/600/400`
    } as Recipe;

  } catch (error) {
    console.error("Error generating recipe:", error);
    return null;
  }
};
