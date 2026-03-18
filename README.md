<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1UbufQ0qu05wyr-ewIMajanbvmQhB_eD-

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
## 📱 Links Importantes (App Store Compliance)

*   **Política de Privacidade:** [Privacy Policy](https://victoralmeidaj16.github.io/Food-NutriVerse/privacy.html)
*   **Termos de Uso:** [Terms of Use](https://victoralmeidaj16.github.io/Food-NutriVerse/terms.html)
*   **Suporte:** [Support Page](https://victoralmeidaj16.github.io/Food-NutriVerse/support.html)

## 🍎 Build para iOS (App Store)

1.  **Pré-requisitos:**
    *   Conta Apple Developer
    *   EAS CLI instalado (`npm install -g eas-cli`)
    *   Login no EAS (`eas login`)

2.  **Gerar Build:**
    ```bash
    cd mobile-app
    eas build --platform ios
    ```

3.  **Submeter:**
    *   Baixe o `.ipa` gerado
    *   Use o Transporter app (macOS) para enviar para o App Store Connect

## 🤖 Build para Android

1.  **Gerar APK/Bundle:**
    ```bash
    cd mobile-app
    eas build --platform android
    ```
3. Run the app:
   `npm run dev`

## Apple Subscription Validation

O backend agora suporta validação de assinatura via App Store Server API no endpoint `/api/apple/validate-subscription`.
Também existe o endpoint `/api/apple/notifications` para receber App Store Server Notifications V2.

Variáveis de ambiente necessárias no backend:

- `APPLE_ISSUER_ID`
- `APPLE_KEY_ID`
- `APPLE_BUNDLE_ID`
- `APPLE_APP_ID`
- `APPLE_PRIVATE_KEY`
- `APPLE_ROOT_CA_PEMS`
- `APPLE_SERVER_ENVIRONMENT` (`production` ou `sandbox`)
