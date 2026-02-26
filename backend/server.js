const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;

// Initialize Gemini (new SDK)
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Root route - API Documentation/Status
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Fitswap API',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        documentation: 'https://github.com/victoralmeidaj16/Food-NutriVerse'
    });
});

// Detailed status check
app.get('/api/status', (req, res) => {
    const geminiKeyConfigured = !!process.env.GOOGLE_API_KEY;
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        config: {
            gemini_configured: geminiKeyConfigured
        }
    });
});

app.post('/api/generate-recipe', async (req, res) => {
    try {
        const { contents, model: modelName, config } = req.body;

        if (!process.env.GOOGLE_API_KEY) {
            console.error('GOOGLE_API_KEY is missing');
            return res.status(500).json({ error: 'API Key not configured on server' });
        }

        if (!contents) {
            console.error('Missing contents');
            return res.status(400).json({ error: 'contents is required' });
        }

        // Normalize contents: accept string or array
        let normalizedContents;
        if (typeof contents === 'string') {
            normalizedContents = contents;
        } else if (Array.isArray(contents)) {
            normalizedContents = contents;
        } else {
            normalizedContents = contents;
        }

        // Use gemini-2.0-flash as default (gemini-2.0-flash-exp is deprecated)
        const resolvedModel = (modelName || 'gemini-2.0-flash')
            .replace('gemini-2.0-flash-exp', 'gemini-2.0-flash')
            .replace('gemini-2.5-flash', 'gemini-2.0-flash');

        console.log(`Generating with model: ${resolvedModel}`);

        // Build generation config
        const generationConfig = {};
        if (config) {
            if (config.temperature !== undefined) generationConfig.temperature = config.temperature;
            if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
            if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;
        }

        const response = await genAI.models.generateContent({
            model: resolvedModel,
            contents: normalizedContents,
            config: Object.keys(generationConfig).length > 0 ? generationConfig : undefined
        });

        const text = response.text;
        res.json({ text });

    } catch (error) {
        console.error('Error generating content:', error);
        res.status(500).json({
            error: 'Failed to generate content',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Image generation endpoint - keeps API key secure on server
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!process.env.GOOGLE_API_KEY) {
            console.error('GOOGLE_API_KEY is missing');
            return res.status(500).json({ error: 'API Key not configured on server' });
        }

        if (!prompt) {
            return res.status(400).json({ error: 'prompt is required' });
        }

        console.log(`Generating image for prompt: ${prompt.substring(0, 50)}...`);

        const enhancedPrompt = `
            ${prompt}, professional food photography,
            highly detailed, appetizing, elegant plating,
            clean white background with subtle lime green accents,
            soft studio lighting, 4k resolution, culinary magazine style,
            minimalist and modern presentation
        `;

        const response = await genAI.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: enhancedPrompt,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                    aspectRatio: '1:1',
                    imageSize: '1K',
                },
            },
        });

        let b64 = null;
        if (response.candidates && response.candidates[0].content.parts) {
            const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
            if (imagePart) {
                b64 = imagePart.inlineData.data;
            }
        }

        if (!b64 || b64.length < 10000) {
            console.error('Invalid base64 image received');
            const seed = Math.floor(Math.random() * 999999);
            const fallbackUrl = `https://image.pollinations.ai/prompt/professional%20food%20photography%20of%20${encodeURIComponent(prompt)}%20clean%20white%20background%20elegant%20plating?seed=${seed}&width=1024&height=1024&nologo=true`;
            return res.json({ imageUrl: fallbackUrl, fallback: true });
        }

        console.log('Image generated successfully');
        res.json({ imageBase64: b64 });

    } catch (error) {
        console.error('Error generating image:', error);
        // Return fallback URL on error
        const seed = Math.floor(Math.random() * 999999);
        const fallbackUrl = `https://image.pollinations.ai/prompt/professional%20food%20photography%20of%20${encodeURIComponent(req.body?.prompt || 'food')}%20clean%20white%20background%20elegant%20plating?seed=${seed}&width=1024&height=1024&nologo=true`;
        res.json({ imageUrl: fallbackUrl, fallback: true });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
