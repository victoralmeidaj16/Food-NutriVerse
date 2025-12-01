require('dotenv').config();

module.exports = {
    expo: {
        name: "Food NutriVerse",
        slug: "mobile-app",
        version: "1.0.0",
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
            buildNumber: "1",
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
            versionCode: 1,
            edgeToEdgeEnabled: true,
            predictiveBackGestureEnabled: false
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
            googleApiKey: process.env.GOOGLE_API_KEY
        },
        description: "Food NutriVerse: Transforme seus ingredientes em receitas fitness deliciosas com IA. Escaneie alimentos, gere planos semanais e listas de compras personalizadas.",
        privacy: "https://victoralmeidaj16.github.io/Food-NutriVerse/privacy-policy.html",
        primaryColor: "#4CAF50"
    }
};
