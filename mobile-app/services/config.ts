import Constants from 'expo-constants';

// Access environment variables defined in app.json (extra) or .env files
const extra = Constants.expoConfig?.extra || {};

export const API_KEY = extra.apiKey || 'AIzaSyBqSlX3_TMiH8vZpwPIN16k5IX2kgxbdEA'; // Fallback for dev if env not set
export const OPENAI_API_KEY = extra.openaiApiKey || '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';
export const GOOGLE_API_KEY = extra.googleApiKey || 'AIzaSyA8J3Z1hD14NgMCoTJKzz3MMf0IG5WiAEE';

// Dynamic Backend URL:
// - In Development: Use localhost (or machine IP for physical devices)
// - In Production: Use the Render URL
export const BACKEND_URL = __DEV__
    ? 'http://localhost:3000'
    : 'https://food-nutriverse.onrender.com';
