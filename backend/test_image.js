const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

// Manually set the key to the new one to be sure
const API_KEY = "AIzaSyBD4B1V8GeGMYTfyviHVWcJaNfufpu4dr8";

async function testImageGen() {
    console.log("Testing Imagen with key:", API_KEY);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-preview-06-06:predict?key=${API_KEY}`;

    const body = {
        instances: [
            {
                prompt: "a delicious fitness lasagna"
            }
        ],
        parameters: {
            aspectRatio: "1:1",
            sampleCount: 1
        }
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Error:", response.status, text);
        } else {
            const json = await response.json();
            console.log("Success! Received response length:", JSON.stringify(json).length);
            if (json.predictions && json.predictions[0].bytesBase64Encoded) {
                console.log("Image data received.");
            } else {
                console.log("No image data in response:", json);
            }
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testImageGen();
