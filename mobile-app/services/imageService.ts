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
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { BACKEND_URL } from './config';

const BASE_DIR = documentDirectory || cacheDirectory;
const IMAGE_DIR = `${BASE_DIR}images/`;

/**
 * Resize + compress a local image and return its base64 (JPEG, without the
 * `data:` prefix). Keeps upload payloads well under the backend's request-size
 * limit (Vercel rejects bodies > 4.5MB) and makes Gemini vision calls faster.
 */
export const uriToCompressedBase64 = async (
    uri: string,
    maxWidth: number = 1024,
    compress: number = 0.6
): Promise<string> => {
    const result = await manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }],
        { compress, format: SaveFormat.JPEG, base64: true }
    );
    if (!result.base64) {
        throw new Error('Failed to encode image to base64');
    }
    return result.base64;
};

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

        console.log("Generating image via backend...");

        // Call backend endpoint (API key is secure on server)
        const response = await fetch(`${BACKEND_URL}/api/generate-image`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            throw new Error(`Backend error: ${response.status}`);
        }

        const data = await response.json();
        const filename = `${Crypto.randomUUID()}.jpg`;
        const fileUri = IMAGE_DIR + filename;

        if (data.imageBase64) {
            // Backend returned base64 image from Imagen API
            await writeAsStringAsync(fileUri, data.imageBase64, { encoding: EncodingType.Base64 });
            console.log("Image saved from Imagen:", fileUri);
            return fileUri;
        } else if (data.imageUrl) {
            // Backend returned fallback URL
            console.log("Using fallback image URL");
            const { uri } = await downloadAsync(data.imageUrl, fileUri);
            return uri;
        }

        throw new Error("No image data received");

    } catch (error: any) {
        console.warn("Backend image generation failed, using direct fallback:", error.message);

        // Direct fallback if backend is down
        try {
            await ensureDirExists();
            const seed = Math.floor(Math.random() * 999999);
            const enhancedPrompt = `professional food photography of ${prompt} clean white background elegant plating`;
            const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(enhancedPrompt)}?seed=${seed}&width=1024&height=1024&nologo=true`;

            const filename = `${Crypto.randomUUID()}.jpg`;
            const fileUri = IMAGE_DIR + filename;
            const { uri } = await downloadAsync(imageUrl, fileUri);
            return uri;
        } catch (fallbackError) {
            console.error("All image generation failed:", fallbackError);
            return null;
        }
    }
};

export const getImageUrl = (prompt: string): string => {
    const seed = Math.floor(Math.random() * 999999);
    return `https://image.pollinations.ai/prompt/professional%20food%20photography%20of%20${encodeURIComponent(prompt)}%20clean%20white%20background%20with%20subtle%20lime%20green%20details%20elegant%20plating?seed=${seed}&width=1024&height=1024&nologo=true`;
};
