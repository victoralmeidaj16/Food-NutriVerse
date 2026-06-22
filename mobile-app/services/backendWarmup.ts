import { BACKEND_URL, IS_VERCEL_BACKEND } from './config';

const WARMUP_INTERVAL_MS = 10 * 60 * 1000;
const WARMUP_TIMEOUT_MS = 15000;

let lastWarmupAt = 0;

export const warmBackendIfNeeded = async () => {
    // Vercel functions have no server-wide spin-down, so there is nothing to
    // warm up — skip the ping entirely once we're off Render.
    if (IS_VERCEL_BACKEND) {
        return;
    }

    const now = Date.now();
    if (now - lastWarmupAt < WARMUP_INTERVAL_MS) {
        return;
    }

    lastWarmupAt = now;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), WARMUP_TIMEOUT_MS);

    try {
        await fetch(`${BACKEND_URL}/health`, {
            method: 'GET',
            signal: controller.signal,
        });
        console.log('Backend warmup completed');
    } catch (error: any) {
        console.warn('Backend warmup failed:', error?.message || error);
    } finally {
        clearTimeout(timeoutId);
    }
};
