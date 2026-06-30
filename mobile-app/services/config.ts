import Constants from 'expo-constants';

// Access environment variables defined in app.json (extra) or .env files
const extra = Constants.expoConfig?.extra || {};

// API keys should be set via environment variables, not hardcoded
// These are only used for local development and should be set in .env
export const API_KEY = extra.apiKey || '';
export const OPENAI_API_KEY = extra.openaiApiKey || '';
export const GOOGLE_API_KEY = extra.googleApiKey || '';

// Dynamic Backend URL. EXPO_PUBLIC_BACKEND_URL can still override this for
// emergency rollback or staging builds, but production now defaults to Vercel.
const VERCEL_BACKEND_URL = 'https://food-nutriverse-backend.vercel.app';

const configuredBackendUrl = extra.backendUrl || '';

export const BACKEND_URL = configuredBackendUrl || VERCEL_BACKEND_URL;

// True once we are off Render (Vercel has no Render-style server sleep, so the
// warmup ping and cold-start copy can be skipped).
export const IS_VERCEL_BACKEND = BACKEND_URL.includes('vercel.app');
