import {
    getInfoAsync,
    makeDirectoryAsync,
    downloadAsync,
    documentDirectory,
    cacheDirectory,
    writeAsStringAsync,
    EncodingType
} from 'expo-file-system/legacy';

import * as Crypto from 'expo-crypto';
import { GOOGLE_API_KEY } from './config';

const BASE_DIR = documentDirectory || cacheDirectory;
const IMAGE_DIR = `${BASE_DIR}images/`;

const ensureDirExists = async () => {
    try {
        const dirInfo = await getInfoAsync(IMAGE_DIR);
        if (!dirInfo.exists) {
            await makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
        }
    } catch (err) {
        console.error("Error creating image directory:", err);
    }
};

export const generateAndSaveImage = async (prompt: string): Promise<string | null> => {
    try {
        await ensureDirExists();

        const enhancedPrompt = `
            professional food photography of ${prompt},
            close-up, mouth-watering, steam rising, highly detailed texture,
            studio lighting, vibrant and fresh ingredients,
            michelin star plating, elegant presentation,
            subtle lime green accents in background or garnish (branding style),
            modern, clean, 8k resolution, culinary masterpiece
        `;

        console.log("Generating image using Google Gemini (Imagen 4)...");

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview-06-06:predict?key=${GOOGLE_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                instances: [
                    {
                        prompt: {
                            text: enhancedPrompt
                        }
                    }
                ],
                parameters: {
                    aspectRatio: "1:1",
                    sampleCount: 1
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Gemini error: ${response.status} - ${err}`);
        }

        const json = await response.json();

        // Response format: { predictions: [ { bytesBase64Encoded: "..." } ] }
        const b64 = json.predictions?.[0]?.bytesBase64Encoded;

        if (!b64 || b64.length < 10000) {
            throw new Error("Invalid base64 image received from Gemini");
        }

        const filename = `${Crypto.randomUUID()}.jpg`;
        const fileUri = IMAGE_DIR + filename;

        await writeAsStringAsync(fileUri, b64, { encoding: EncodingType.Base64 });

        console.log("Image saved to:", fileUri);
        return fileUri;

    } catch (error: any) {
        console.warn("Primary generation failed → fallback:", error.message);

        try {
            const seed = Math.floor(Math.random() * 999999);
            const fallbackUrl =
                `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=1024&height=1024&nologo=true`;

            const filename = `${Crypto.randomUUID()}.jpg`;
            const fileUri = IMAGE_DIR + filename;

            const { uri } = await downloadAsync(fallbackUrl, fileUri);
            return uri;

        } catch (fallbackError) {
            console.error("Fallback failed:", fallbackError);
            return null;
        }
    }
};

export const getImageUrl = (prompt: string): string => {
    const seed = Math.floor(Math.random() * 999999);
    return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?seed=${seed}&width=1024&height=1024&nologo=true`;
};
