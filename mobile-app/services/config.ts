import Constants from 'expo-constants';

// Access environment variables defined in app.json (extra) or .env files
const extra = Constants.expoConfig?.extra || {};

// API keys should be set via environment variables, not hardcoded
// These are only used for local development and should be set in .env
export const API_KEY = extra.apiKey || '';
export const OPENAI_API_KEY = extra.openaiApiKey || '';
export const GOOGLE_API_KEY = extra.googleApiKey || '';

// Dynamic Backend URL:
// ┌─────────────────────────────────────────────────────────────────────┐
// │ CUTOVER: after deploying the backend to Vercel, switch the line below │
// │ to the Vercel URL. Render can stay as a fallback during the rollout.  │
// └─────────────────────────────────────────────────────────────────────┘
const RENDER_BACKEND_URL = 'https://food-nutriverse.onrender.com';
// const VERCEL_BACKEND_URL = 'https://<your-project>.vercel.app';

export const BACKEND_URL = RENDER_BACKEND_URL;

// True once we are off Render (Vercel has no 30-60s cold start, so the warmup
// ping and the long cold-start timeout/messages can be relaxed).
export const IS_VERCEL_BACKEND = BACKEND_URL.includes('vercel.app');
