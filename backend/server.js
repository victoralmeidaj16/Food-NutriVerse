const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize Gemini
// Note: In production (Render), ensure GEMINI_API_KEY is set in Environment Variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    const geminiKeyConfigured = !!process.env.GEMINI_API_KEY;
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

        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is missing');
            return res.status(500).json({ error: 'API Key not configured on server' });
        }

        console.log(`Generating recipe with model: ${modelName || "gemini-1.5-flash"}`);

        // Use the requested model or default to flash
        const model = genAI.getGenerativeModel({
            model: modelName || "gemini-1.5-flash",
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

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
