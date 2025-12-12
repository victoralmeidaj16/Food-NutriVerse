import Constants from 'expo-constants';

// Access environment variables defined in app.json (extra) or .env files
const extra = Constants.expoConfig?.extra || {};

// API keys should be set via environment variables, not hardcoded
// These are only used for local development and should be set in .env
export const API_KEY = extra.apiKey || '';
export const OPENAI_API_KEY = extra.openaiApiKey || '';
export const GOOGLE_API_KEY = extra.googleApiKey || '';

// Dynamic Backend URL:
// Production backend on Render
export const BACKEND_URL = 'https://food-nutriverse.onrender.com';
