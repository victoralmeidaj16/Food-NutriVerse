const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { GoogleGenAI } = require('@google/genai');
const { loadTrustedAppleRoots, verifyAndDecodeAppleJws } = require('./appleSignedDataVerifier');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;
const APPLE_ENVIRONMENTS = {
    production: 'https://api.storekit.itunes.apple.com',
    sandbox: 'https://api.storekit-sandbox.itunes.apple.com',
};

const normalizePrivateKey = (key) => (key || '').replace(/\\n/g, '\n').trim();

const base64UrlEncode = (value) =>
    Buffer.from(value)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');

const getAppleApiConfig = () => {
    const issuerId = process.env.APPLE_ISSUER_ID;
    const keyId = process.env.APPLE_KEY_ID;
    const bundleId = process.env.APPLE_BUNDLE_ID;
    const privateKey = normalizePrivateKey(process.env.APPLE_PRIVATE_KEY);
    const preferredEnvironment = (process.env.APPLE_SERVER_ENVIRONMENT || 'production').toLowerCase();
    const appAppleId = process.env.APPLE_APP_ID ? Number(process.env.APPLE_APP_ID) : undefined;

    if (!issuerId || !keyId || !bundleId || !privateKey) {
        return null;
    }

    return {
        issuerId,
        keyId,
        bundleId,
        privateKey,
        appAppleId,
        preferredEnvironment: preferredEnvironment === 'sandbox' ? 'sandbox' : 'production',
    };
};

const createAppleBearerToken = (config) => {
    const now = Math.floor(Date.now() / 1000);
    const header = {
        alg: 'ES256',
        kid: config.keyId,
        typ: 'JWT',
    };
    const payload = {
        iss: config.issuerId,
        iat: now,
        exp: now + 300,
        aud: 'appstoreconnect-v1',
        bid: config.bundleId,
    };

    const encodedHeader = base64UrlEncode(JSON.stringify(header));
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signingInput = `${encodedHeader}.${encodedPayload}`;
    const signature = crypto.sign('sha256', Buffer.from(signingInput), {
        key: config.privateKey,
        dsaEncoding: 'ieee-p1363',
    });

    return `${signingInput}.${base64UrlEncode(signature)}`;
};

const buildEnvironmentAttemptOrder = (preferredEnvironment) => {
    return preferredEnvironment === 'sandbox'
        ? ['sandbox', 'production']
        : ['production', 'sandbox'];
};

const fetchAppleSubscriptionStatus = async ({ transactionId, environment, bearerToken }) => {
    const baseUrl = APPLE_ENVIRONMENTS[environment];
    const response = await fetch(`${baseUrl}/inApps/v1/subscriptions/${encodeURIComponent(transactionId)}`, {
        method: 'GET',
        headers: {
            Authorization: `Bearer ${bearerToken}`,
            Accept: 'application/json',
        },
    });

    const text = await response.text();
    let data = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch (error) {
        console.error('Failed to parse Apple response', error);
    }

    return {
        ok: response.ok,
        status: response.status,
        data,
        environment,
    };
};

const resolveSubscriptionFromAppleResponse = (responseData, appleConfig) => {
    if (!responseData?.data || !Array.isArray(responseData.data)) {
        return null;
    }

    const candidates = [];
    for (const group of responseData.data) {
        for (const item of group.lastTransactions || []) {
            let transactionInfo;
            let renewalInfo;

            try {
                transactionInfo = verifyAndDecodeAppleJws(item.signedTransactionInfo, {
                    expectedBundleId: appleConfig.bundleId,
                }).payload;
            } catch (error) {
                console.error('Failed to verify signedTransactionInfo from Apple response', error);
                continue;
            }

            try {
                renewalInfo = item.signedRenewalInfo
                    ? verifyAndDecodeAppleJws(item.signedRenewalInfo, {
                        expectedBundleId: appleConfig.bundleId,
                    }).payload
                    : null;
            } catch (error) {
                console.error('Failed to verify signedRenewalInfo from Apple response', error);
                continue;
            }

            if (!transactionInfo) continue;

            const expiresDate = Number(transactionInfo.expiresDate || 0) || undefined;
            const gracePeriodExpiresDate = Number(renewalInfo?.gracePeriodExpiresDate || 0) || undefined;
            const revocationDate = Number(transactionInfo.revocationDate || 0) || undefined;
            const statusCode = Number(item.status || 0) || undefined;
            const now = Date.now();
            const isInGracePeriod = !!gracePeriodExpiresDate && gracePeriodExpiresDate > now;
            const isNotExpired = !!expiresDate && expiresDate > now;
            const isRevoked = !!revocationDate;
            const isActive = !isRevoked && (isNotExpired || isInGracePeriod);

            candidates.push({
                isActive,
                productId: transactionInfo.productId,
                expiryDate: expiresDate,
                gracePeriodExpiresDate,
                transactionId: transactionInfo.transactionId || transactionInfo.webOrderLineItemId,
                originalTransactionId: transactionInfo.originalTransactionId,
                environment: transactionInfo.environment || responseData.environment,
                statusCode,
                autoRenewStatus: renewalInfo?.autoRenewStatus,
                signedTransactionInfo: item.signedTransactionInfo,
                signedRenewalInfo: item.signedRenewalInfo,
                sortDate: Math.max(expiresDate || 0, gracePeriodExpiresDate || 0, Number(transactionInfo.purchaseDate || 0) || 0),
            });
        }
    }

    if (candidates.length === 0) {
        return null;
    }

    candidates.sort((a, b) => b.sortDate - a.sortDate);
    return candidates[0];
};

// Initialize Gemini (new SDK)
const genAI = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

// Root route - API Documentation/Status
app.get('/', (req, res) => {
    res.json({
        status: 'ok',
        service: 'Fitswap API',
        environment: process.env.NODE_ENV || 'development',
        version: process.env.npm_package_version || '1.0.0',
        timestamp: new Date().toISOString(),
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        documentation: 'https://github.com/victoralmeidaj16/Food-NutriVerse'
    });
});

// Detailed status check
app.get('/api/status', (req, res) => {
    const geminiKeyConfigured = !!process.env.GOOGLE_API_KEY;
    const appleConfig = getAppleApiConfig();
    const appleRootsConfigured = loadTrustedAppleRoots().length > 0;
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        config: {
            gemini_configured: geminiKeyConfigured,
            apple_subscription_validation_configured: !!appleConfig,
            apple_roots_configured: appleRootsConfigured,
            apple_environment: appleConfig?.preferredEnvironment || null,
        }
    });
});

app.post('/api/apple/validate-subscription', async (req, res) => {
    try {
        const { transactionId, originalTransactionId } = req.body || {};
        const lookupTransactionId = transactionId || originalTransactionId;

        if (!lookupTransactionId) {
            return res.status(400).json({ error: 'transactionId or originalTransactionId is required' });
        }

        const appleConfig = getAppleApiConfig();
        if (!appleConfig) {
            return res.status(500).json({ error: 'Apple subscription validation is not configured on the server' });
        }

        const bearerToken = createAppleBearerToken(appleConfig);
        const attempts = buildEnvironmentAttemptOrder(appleConfig.preferredEnvironment);

        let resolved = null;
        let lastAppleError = null;

        for (const environment of attempts) {
            const appleResponse = await fetchAppleSubscriptionStatus({
                transactionId: lookupTransactionId,
                environment,
                bearerToken,
            });

            if (!appleResponse.ok) {
                lastAppleError = appleResponse;
                continue;
            }

            const subscription = resolveSubscriptionFromAppleResponse(appleResponse.data, appleConfig);
            if (subscription) {
                resolved = {
                    ...subscription,
                    environment,
                    source: 'app_store_server_api',
                };
                break;
            }

            lastAppleError = appleResponse;
        }

        if (!resolved) {
            return res.json({
                isActive: false,
                transactionId: transactionId || null,
                originalTransactionId: originalTransactionId || null,
                source: 'app_store_server_api',
                checkedAt: new Date().toISOString(),
                appleStatus: lastAppleError?.status || null,
            });
        }

        return res.json({
            isActive: resolved.isActive,
            productId: resolved.productId,
            expiryDate: resolved.expiryDate,
            gracePeriodExpiresDate: resolved.gracePeriodExpiresDate,
            transactionId: resolved.transactionId || transactionId || null,
            originalTransactionId: resolved.originalTransactionId || originalTransactionId || null,
            environment: resolved.environment,
            source: resolved.source,
            statusCode: resolved.statusCode,
            autoRenewStatus: resolved.autoRenewStatus,
            checkedAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error('Apple subscription validation failed:', error);
        res.status(500).json({
            error: 'Failed to validate Apple subscription',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.post('/api/apple/notifications', async (req, res) => {
    try {
        const { signedPayload } = req.body || {};
        if (!signedPayload) {
            return res.status(400).json({ error: 'signedPayload is required' });
        }

        const appleConfig = getAppleApiConfig();
        if (!appleConfig) {
            return res.status(500).json({ error: 'Apple subscription validation is not configured on the server' });
        }

        const notificationPayload = verifyAndDecodeAppleJws(signedPayload, {
            expectedBundleId: appleConfig.bundleId,
            expectedAppAppleId: appleConfig.appAppleId,
        }).payload;

        const signedTransactionInfo = notificationPayload?.data?.signedTransactionInfo;
        const signedRenewalInfo = notificationPayload?.data?.signedRenewalInfo;

        const transactionInfo = signedTransactionInfo
            ? verifyAndDecodeAppleJws(signedTransactionInfo, {
                expectedBundleId: appleConfig.bundleId,
                expectedEnvironment: notificationPayload.data?.environment,
            }).payload
            : null;

        const renewalInfo = signedRenewalInfo
            ? verifyAndDecodeAppleJws(signedRenewalInfo, {
                expectedBundleId: appleConfig.bundleId,
                expectedEnvironment: notificationPayload.data?.environment,
            }).payload
            : null;

        console.log('Apple notification received', {
            notificationType: notificationPayload.notificationType,
            subtype: notificationPayload.subtype,
            environment: notificationPayload.data?.environment,
            transactionId: transactionInfo?.transactionId,
            originalTransactionId: transactionInfo?.originalTransactionId,
            autoRenewProductId: renewalInfo?.autoRenewProductId,
        });

        return res.status(200).json({
            received: true,
            notificationType: notificationPayload.notificationType,
            subtype: notificationPayload.subtype || null,
        });
    } catch (error) {
        console.error('Apple notification verification failed:', error);
        return res.status(400).json({
            error: 'Invalid Apple notification payload',
            details: error.message,
        });
    }
});

app.post('/api/generate-recipe', async (req, res) => {
    try {
        const { contents, model: modelName, config } = req.body;

        if (!process.env.GOOGLE_API_KEY) {
            console.error('GOOGLE_API_KEY is missing');
            return res.status(500).json({ error: 'API Key not configured on server' });
        }

        if (!contents) {
            console.error('Missing contents');
            return res.status(400).json({ error: 'contents is required' });
        }

        // Normalize contents: accept string or array
        let normalizedContents;
        if (typeof contents === 'string') {
            normalizedContents = contents;
        } else if (Array.isArray(contents)) {
            normalizedContents = contents;
        } else {
            normalizedContents = contents;
        }

        // Keep older clients working after Gemini 2.0 Flash was removed.
        const resolvedModel = (modelName || 'gemini-2.5-flash')
            .replace('gemini-2.0-flash-exp', 'gemini-2.5-flash')
            .replace('gemini-2.0-flash', 'gemini-2.5-flash');

        console.log(`Generating with model: ${resolvedModel}`);

        // Build generation config
        const generationConfig = {};
        if (config) {
            if (config.temperature !== undefined) generationConfig.temperature = config.temperature;
            if (config.responseMimeType) generationConfig.responseMimeType = config.responseMimeType;
            if (config.responseSchema) generationConfig.responseSchema = config.responseSchema;
        }

        const response = await genAI.models.generateContent({
            model: resolvedModel,
            contents: normalizedContents,
            config: Object.keys(generationConfig).length > 0 ? generationConfig : undefined
        });

        const text = response.text;
        res.json({ text });

    } catch (error) {
        console.error('Error generating content:', error);
        res.status(500).json({
            error: 'Failed to generate content',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// Image generation endpoint - keeps API key secure on server
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt } = req.body;

        if (!process.env.GOOGLE_API_KEY) {
            console.error('GOOGLE_API_KEY is missing');
            return res.status(500).json({ error: 'API Key not configured on server' });
        }

        if (!prompt) {
            return res.status(400).json({ error: 'prompt is required' });
        }

        console.log(`Generating image for prompt: ${prompt.substring(0, 50)}...`);

        const enhancedPrompt = `
            ${prompt}, professional food photography,
            highly detailed, appetizing, elegant plating,
            clean white background with subtle lime green accents,
            soft studio lighting, 4k resolution, culinary magazine style,
            minimalist and modern presentation
        `;

        const response = await genAI.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: enhancedPrompt,
            config: {
                responseModalities: ['TEXT', 'IMAGE'],
                imageConfig: {
                    aspectRatio: '1:1',
                    imageSize: '1K',
                },
            },
        });

        let b64 = null;
        if (response.candidates && response.candidates[0].content.parts) {
            const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
            if (imagePart) {
                b64 = imagePart.inlineData.data;
            }
        }

        if (!b64 || b64.length < 10000) {
            console.error('Invalid base64 image received');
            const seed = Math.floor(Math.random() * 999999);
            const fallbackUrl = `https://image.pollinations.ai/prompt/professional%20food%20photography%20of%20${encodeURIComponent(prompt)}%20clean%20white%20background%20elegant%20plating?seed=${seed}&width=1024&height=1024&nologo=true`;
            return res.json({ imageUrl: fallbackUrl, fallback: true });
        }

        console.log('Image generated successfully');
        res.json({ imageBase64: b64 });

    } catch (error) {
        console.error('Error generating image:', error);
        // Return fallback URL on error
        const seed = Math.floor(Math.random() * 999999);
        const fallbackUrl = `https://image.pollinations.ai/prompt/professional%20food%20photography%20of%20${encodeURIComponent(req.body?.prompt || 'food')}%20clean%20white%20background%20elegant%20plating?seed=${seed}&width=1024&height=1024&nologo=true`;
        res.json({ imageUrl: fallbackUrl, fallback: true });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Only start a long-running server when executed directly (local dev / Render).
// On Vercel the app is imported as a serverless handler, so we just export it.
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

module.exports = app;
