# 🌍 Guia de Lançamento do App em Inglês (EUA e Outros Países)

Este documento descreve todas as etapas necessárias para disponibilizar o NutriVerse para o público de língua inglesa, incluindo a App Store dos Estados Unidos.

---

## 📋 Resumo das Etapas

1. **Preparação do Código** - Internacionalização (i18n)
2. **Tradução de Conteúdo** - Textos, prompts de IA, etc.
3. **App Store Connect** - Configuração de localização
4. **Metadados da App Store** - Descrição, screenshots, palavras-chave
5. **Build e Submissão**

---

## 1. 🛠️ Preparação do Código (Internacionalização)

### Status Atual
O app já possui uma estrutura básica de internacionalização:
- `mobile-app/context/LanguageContext.tsx` - Contexto de idioma
- `mobile-app/translations/` - Arquivos de tradução

### O Que Fazer

#### 1.1 Verificar/Criar Arquivo de Traduções em Inglês
```
mobile-app/translations/en.ts
```

Deve conter todas as strings traduzidas. Exemplo:
```typescript
export const en = {
  common: {
    start: 'Get Started',
    continue: 'Continue',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    loading: 'Loading...',
  },
  onboarding: {
    heroTitle: 'Smart Recipes with AI',
    heroSubtitle: 'Transform your eating habits with personalized recipes',
    loginLink: 'Already have an account? Login',
  },
  // ... todas as outras strings
};
```

#### 1.2 Strings Hardcoded
Procurar e substituir todas as strings em português que estão diretamente no código:
```bash
# Buscar strings em português nos componentes
grep -r "Erro\|Sucesso\|Carregando\|Salvar" mobile-app/screens/
grep -r "Erro\|Sucesso\|Carregando\|Salvar" mobile-app/components/
```

Substituir por chamadas ao sistema de tradução:
```typescript
// Antes
Alert.alert("Erro", "Não foi possível gerar a receita.");

// Depois
Alert.alert(t('errors.title'), t('errors.recipeGenerationFailed'));
```

#### 1.3 Prompts da IA (Crítico!)
Os prompts enviados para a API Gemini estão em português. Para suportar inglês:

**Opção A (Recomendada):** Manter prompts em português, traduzir resposta
- Menos trabalho
- IA entende português bem

**Opção B:** Traduzir prompts baseado no idioma do usuário
- Melhor qualidade para usuários em inglês
- Requer duplicar prompts no `geminiService.ts`

#### 1.4 Detecção Automática de Idioma
Usar `expo-localization`:
```typescript
import * as Localization from 'expo-localization';

const deviceLanguage = Localization.locale.split('-')[0]; // 'en', 'pt', etc.
```

---

## 2. 📝 Conteúdo a Traduzir

### Prioridade Alta (Obrigatório)
| Arquivo/Local | Descrição |
|---------------|-----------|
| `translations/en.ts` | Todas as strings da UI |
| `OnboardingScreen.tsx` | Textos de boas-vindas |
| `PaywallScreen.tsx` | Descrição dos planos |
| `MainScreen.tsx` | Mensagens de erro e sucesso |
| Alerts e Modais | Todas as mensagens |

### Prioridade Média
| Arquivo/Local | Descrição |
|---------------|-----------|
| `geminiService.ts` | Prompts da IA (opcional) |
| `healthReferences.ts` | Referências científicas |
| Receitas mockadas | Se houver dados de exemplo |

### Prioridade Baixa
| Item | Descrição |
|------|-----------|
| Comments no código | Não afeta usuário |
| Logs de debug | Não afeta usuário |

---

## 3. 🍎 Configurações no App Store Connect

### 3.1 Adicionar Localização (Inglês)

1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Vá para: **Apps** → **NutriVerse** → **App Store** → **App Information**
3. Em **Localizations**, clique em **"+"**
4. Selecione **"English (U.S.)"** ou **"English (U.K.)"**
5. Clique em **"Add"**

### 3.2 Preencher Metadados em Inglês

Para cada localização adicionada, você precisará fornecer:

#### Informações Básicas
| Campo | Exemplo em Inglês |
|-------|-------------------|
| **App Name** | NutriVerse - AI Recipes |
| **Subtitle** | Smart Healthy Eating |
| **Privacy Policy URL** | (mesmo URL, ou versão em inglês) |

#### Descrição da App Store
```
Transform your eating with AI-powered recipes! 🥗

NutriVerse uses artificial intelligence to create personalized, healthy recipes based on your goals, restrictions, and available ingredients.

✨ KEY FEATURES:

🔄 FIT SWAP - Transform any craving into a healthy version
📸 PANTRY SCAN - Take a photo of your fridge and get recipe suggestions
📅 WEEKLY PLANNER - AI-generated meal plans for the entire week
🛒 SHOPPING LIST - Automatic shopping list from your meal plan

🎯 PERSONALIZED FOR YOU:
• Weight loss, muscle gain, or maintenance goals
• Dietary restrictions (gluten-free, vegan, lactose-free, etc.)
• Cooking time preferences
• Foods you dislike

💪 BACKED BY SCIENCE:
All recommendations are based on nutritional science from trusted sources like WHO, Harvard, and more.

Download now and start your healthy eating journey!
```

#### Palavras-chave (Keywords)
```
recipes,healthy,AI,meal plan,diet,fitness,nutrition,cooking,weight loss,vegan
```
*(Máximo 100 caracteres, separados por vírgula)*

#### What's New (Novidades)
```
• English language support
• Improved recipe generation
• Bug fixes and performance improvements
```

### 3.3 Screenshots em Inglês

Você precisará de screenshots com a interface em inglês:
- **iPhone 6.7"** (iPhone 14 Pro Max) - Obrigatório
- **iPhone 6.5"** (iPhone 11 Pro Max) - Obrigatório
- **iPhone 5.5"** (iPhone 8 Plus) - Opcional
- **iPad 12.9"** - Se suportar iPad

**Dica:** Use o simulador iOS com idioma configurado para inglês.

---

## 4. 🌐 Disponibilidade por País

### 4.1 Adicionar Estados Unidos

1. No App Store Connect, vá para: **Pricing and Availability**
2. Em **App Availability**, clique em **"Edit"**
3. Marque **"United States"** (e outros países desejados)
4. Clique em **"Save"**

### 4.2 Países Recomendados (Língua Inglesa)
- 🇺🇸 United States
- 🇬🇧 United Kingdom
- 🇨🇦 Canada
- 🇦🇺 Australia
- 🇳🇿 New Zealand
- 🇮🇪 Ireland
- 🇿🇦 South Africa
- 🇸🇬 Singapore (inglês como língua oficial)

### 4.3 Preços em Dólares

Se seu app tem compras in-app (assinaturas), configure preços em USD:

1. Vá para **Subscriptions** ou **In-App Purchases**
2. Para cada produto, defina o preço em **USD**
3. O sistema pode auto-calcular preços equivalentes, ou você pode definir manualmente

| Plano | BRL | USD (sugerido) |
|-------|-----|----------------|
| Mensal | R$ 9,90 | $1.99 |
| Anual | R$ 59,90 | $9.99 |

---

## 5. 📱 Configuração no app.config.js / app.json

### 5.1 Adicionar Idiomas Suportados

```json
{
  "expo": {
    "locales": {
      "en": "./locales/en.json",
      "pt": "./locales/pt.json"
    },
    "ios": {
      "infoPlist": {
        "CFBundleLocalizations": ["en", "pt-BR"],
        "CFBundleDevelopmentRegion": "en"
      }
    }
  }
}
```

### 5.2 Arquivo de Localização iOS

Criar `mobile-app/locales/en.json`:
```json
{
  "CFBundleDisplayName": "NutriVerse",
  "NSCameraUsageDescription": "We need camera access to scan your pantry ingredients",
  "NSPhotoLibraryUsageDescription": "We need photo library access to select ingredient photos"
}
```

---

## 6. 🔨 Build e Submissão

### 6.1 Fazer Build de Produção
```bash
cd mobile-app
npx eas-cli build --platform ios --profile production
```

### 6.2 Submeter para Revisão
```bash
npx eas-cli submit --platform ios --latest
```

### 6.3 Notas para Revisão (Review Notes)

Ao submeter, inclua:
```
This update adds English language support for international users.
The app automatically detects the device language and displays content accordingly.
All core functionality remains the same.

Test Account (if needed):
Email: reviewer@example.com
Password: TestPassword123
```

---

## 7. ✅ Checklist Final

### Código
- [ ] Arquivo `translations/en.ts` completo
- [ ] Todas as strings hardcoded substituídas por `t('key')`
- [ ] Detecção automática de idioma funcionando
- [ ] Testado com idioma do dispositivo em inglês

### App Store Connect
- [ ] Localização "English (U.S.)" adicionada
- [ ] Nome do app em inglês definido
- [ ] Descrição em inglês completa
- [ ] Palavras-chave em inglês definidas
- [ ] Screenshots em inglês enviados
- [ ] Estados Unidos adicionado aos países disponíveis
- [ ] Preços em USD configurados

### Teste
- [ ] App testado no simulador com idioma inglês
- [ ] Fluxo completo testado (onboarding → receitas → plano)
- [ ] Compras in-app testadas em sandbox

---

## 8. 📅 Cronograma Sugerido

| Etapa | Tempo Estimado |
|-------|----------------|
| Tradução de strings | 2-3 dias |
| Ajustes no código | 1-2 dias |
| Screenshots em inglês | 1 dia |
| Configuração App Store | 1 hora |
| Testes | 1-2 dias |
| Submissão e revisão | 1-3 dias (Apple) |

**Total estimado:** 1-2 semanas

---

## 9. 💡 Dicas Importantes

1. **Não traduza nomes de marcas** - "NutriVerse" permanece igual
2. **Use inglês americano** - "color" não "colour", "organize" não "organise"
3. **Mantenha consistência** - Use os mesmos termos em toda a app
4. **Teste com nativos** - Se possível, peça para um falante nativo revisar
5. **App Preview Video** - Considere criar um vídeo promocional em inglês

---

## 📞 Suporte

Se precisar de ajuda com qualquer etapa, os recursos úteis são:
- [Apple App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Expo Localization Docs](https://docs.expo.dev/guides/localization/)
- [i18n Best Practices](https://react.i18next.com/)
