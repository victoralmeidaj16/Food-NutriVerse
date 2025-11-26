const { GoogleGenerativeAI } = require("@google/generative-ai");

async function run() {
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBqSlX3_TMiH8vZpwPIN16k5IX2kgxbdEA');
        const data = await response.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}
run();
