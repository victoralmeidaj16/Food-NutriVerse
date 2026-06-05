import { BACKEND_URL } from './config';

const WARMUP_INTERVAL_MS = 10 * 60 * 1000;
const WARMUP_TIMEOUT_MS = 15000;

let lastWarmupAt = 0;

export const warmBackendIfNeeded = async () => {
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
