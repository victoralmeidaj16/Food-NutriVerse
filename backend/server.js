const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/generate-recipe', async (req, res) => {
    try {
        const { contents, model: modelName, config } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: 'API Key not configured on server' });
        }

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
        res.status(500).json({ error: 'Failed to generate content', details: error.message });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
