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
            ${prompt}, ${prompt}, professional food photography,
            highly detailed, appetizing, elegant plating,
            clean white background with subtle lime green accents,
            soft studio lighting, 4k resolution, culinary magazine style,
            minimalist and modern presentation
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
                        prompt: enhancedPrompt
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
                `https://image.pollinations.ai/prompt/professional%20food%20photography%20of%20${encodeURIComponent(prompt)}%20clean%20white%20background%20with%20subtle%20lime%20green%20details%20elegant%20plating?seed=${seed}&width=1024&height=1024&nologo=true`;

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
    return `https://image.pollinations.ai/prompt/professional%20food%20photography%20of%20${encodeURIComponent(prompt)}%20clean%20white%20background%20with%20subtle%20lime%20green%20details%20elegant%20plating?seed=${seed}&width=1024&height=1024&nologo=true`;
};
