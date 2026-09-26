require('dotenv').config();

const branchKey = process.env.BRANCH_API_KEY;
const branchDomains = [process.env.BRANCH_DOMAIN_LINK, process.env.BRANCH_DOMAIN_LINK_ALT].filter(Boolean);
if (process.env.EAS_BUILD_PROFILE === 'production' && (!branchKey || branchDomains.length !== 2 || !process.env.EXPO_PUBLIC_AFFILIATES_API_URL)) {
    throw new Error('Production requires BRANCH_API_KEY, both Branch domains and EXPO_PUBLIC_AFFILIATES_API_URL.');
}
const branchPlugin = branchKey && branchDomains.length
    ? [[
        '@config-plugins/react-native-branch',
        { apiKey: branchKey, iosUniversalLinkDomains: branchDomains },
    ]]
    : [];

module.exports = {
    expo: {
        name: "Fitswap",
        slug: "mobile-app",
        scheme: "fitswap",
        version: "1.6.6",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        newArchEnabled: true,
        splash: {
            image: "./assets/splash-icon.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        ios: {
            supportsTablet: true,
            bundleIdentifier: "com.victoralmeidaj16.foodnutriverse",
            appleTeamId: "NT62CSCP9D",
            buildNumber: "60",
            associatedDomains: ["applinks:afiliados-app.vercel.app", ...branchDomains.map((domain) => `applinks:${domain}`)],
            infoPlist: {
                NSCameraUsageDescription: "Precisamos de acesso à câmera para você escanear ingredientes e gerar receitas personalizadas.",
                NSPhotoLibraryUsageDescription: "Precisamos de acesso à galeria para você escolher fotos de ingredientes para análise.",
                ITSAppUsesNonExemptEncryption: false
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            },
            package: "com.victoralmeidaj16.foodnutriverse",
            versionCode: 60,
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false,
            permissions: [
                "CAMERA",
                "READ_EXTERNAL_STORAGE",
                "WRITE_EXTERNAL_STORAGE",
                "com.google.android.gms.permission.AD_ID",
                "com.android.vending.INSTALL_REFERRER"
            ],
            intentFilters: branchDomains.map((host) => ({
                action: 'VIEW',
                autoVerify: true,
                category: ['BROWSABLE', 'DEFAULT'],
                data: [{ scheme: 'https', host }],
            })),
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            eas: {
                projectId: "fed4e9a4-ad21-43af-bfb6-e76330a74e2e"
            },
            apiKey: process.env.API_KEY,
            openaiApiKey: process.env.OPENAI_API_KEY,
            googleApiKey: process.env.GOOGLE_API_KEY,
            backendUrl: process.env.EXPO_PUBLIC_BACKEND_URL,
            affiliatesApiUrl: process.env.EXPO_PUBLIC_AFFILIATES_API_URL,
        },
        plugins: ["expo-localization", ...branchPlugin, ...(branchKey ? ['./plugins/withBranchNativeLink'] : [])],
        description: "Fitswap: Transforme seus ingredientes em receitas fitness deliciosas com IA. Escaneie alimentos, gere planos semanais e listas de compras personalizadas.",
        privacy: "https://victoralmeidaj16.github.io/Food-NutriVerse/privacy-policy.html",
        primaryColor: "#4CAF50"
    }
};
