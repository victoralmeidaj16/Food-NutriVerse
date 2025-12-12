const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;

// Initialize Gemini
// Note: In production (Render), ensure GOOGLE_API_KEY is set in Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Root route - API Documentation/Status
app.get('/', (req, res) => {
    res.json({
        status: 'online',
        service: 'Food NutriVerse API',
        version: '1.0.0',
        endpoints: {
            generate: 'POST /api/generate-recipe',
            health: 'GET /health',
            status: 'GET /api/status'
        },
        documentation: 'https://github.com/victoralmeidaj16/Food-NutriVerse' // Replace with actual docs URL if available
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

        if (!contents || !Array.isArray(contents)) {
            console.error('Invalid contents:', contents);
            return res.status(400).json({ error: 'contents must be an array' });
        }

        console.log(`Generating recipe with model: ${modelName || "gemini-2.0-flash-exp"}`);
        console.log(`Contents length: ${contents.length}`);

        // Use the requested model or default to flash-exp
        const model = genAI.getGenerativeModel({
            model: modelName || "gemini-2.0-flash-exp",
            generationConfig: config
        });

        const result = await model.generateContent(contents);
        const response = await result.response;
        const text = response.text();

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

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview-06-06:predict?key=${process.env.GOOGLE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                instances: [{ prompt: enhancedPrompt }],
                parameters: {
                    aspectRatio: '1:1',
                    sampleCount: 1
                }
            })
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Imagen API error:', err);
            // Return fallback URL instead of error
            const seed = Math.floor(Math.random() * 999999);
            const fallbackUrl = `https://image.pollinations.ai/prompt/professional%20food%20photography%20of%20${encodeURIComponent(prompt)}%20clean%20white%20background%20elegant%20plating?seed=${seed}&width=1024&height=1024&nologo=true`;
            return res.json({ imageUrl: fallbackUrl, fallback: true });
        }

        const json = await response.json();
        const b64 = json.predictions?.[0]?.bytesBase64Encoded;

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
    console.log(`Access from iOS Simulator: http://192.168.1.107:${PORT}`);
});
