const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        // There is no direct listModels on the instance, but we can try to use the model to see if it works or just print the key
        console.log("Testing model connection...");
        const result = await model.generateContent("Hello");
        console.log("Model works:", result.response.text());
    } catch (error) {
        console.error("Error:", error.message);
    }
}

listModels();
