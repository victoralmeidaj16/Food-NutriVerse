# 🌍 Guia: Configurar App Store Connect com Localização em Inglês

Este guia detalha o passo a passo para adicionar suporte a inglês no App Store Connect para o NutriVerse.

---

## 📋 Pré-requisitos

- [ ] Acesso à conta Apple Developer
- [ ] App já publicado ou em desenvolvimento no App Store Connect
- [ ] Screenshots do app em inglês (6.7", 6.5", 5.5" para iPhones)
- [ ] Build do app com suporte a inglês já enviada

---

## 🔐 Passo 1: Acessar o App Store Connect

1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Faça login com seu Apple ID
3. Clique em **"My Apps"** (Meus Apps)
4. Selecione **"NutriVerse"**

---

## 🌐 Passo 2: Adicionar Localização em Inglês

1. Na página do app, vá para a aba **"App Information"** (Informações do App)
2. No menu lateral esquerdo, localize **"Localizable Information"**
3. Clique no botão **"+"** ao lado de "Localizations"
4. Selecione **"English (U.S.)"** ou **"English (UK)"**
5. Clique em **"Add"**

---

## 📝 Passo 3: Preencher Informações em Inglês

### 3.1 App Name (Nome do App)
```
NutriVerse - AI Fitness Recipes
```

### 3.2 Subtitle (Subtítulo)
```
Smart Meal Planning with AI
```

### 3.3 Privacy Policy URL
```
https://nutriverse.app/privacy (ou seu URL de política de privacidade)
```

---

## 📱 Passo 4: Configurar App Store Listing em Inglês

Vá para **"App Store"** > **"iOS App"** > Selecione a versão

### 4.1 Promotional Text (Texto Promocional) - 170 caracteres
```
🔥 Transform any dish into a healthy version! AI-powered recipes tailored to your fitness goals. Scan your pantry and cook smart!
```

### 4.2 Description (Descrição) - Até 4000 caracteres
```
NutriVerse is your AI-powered nutrition companion that transforms the way you eat. Whether you want to lose weight, build muscle, or simply eat healthier, we've got you covered!

🥗 SMART RECIPE TRANSFORMATION
Enter any dish you're craving - pizza, burger, lasagna - and our AI instantly creates a healthy, fitness-friendly version with complete nutritional information.

📸 PANTRY SCANNER
Take a photo of your fridge or pantry, and we'll suggest delicious recipes using exactly what you have. No more food waste!

📅 WEEKLY MEAL PLANNING
Get a personalized 7-day meal plan based on your goals, dietary restrictions, and preferences. Shopping list included!

💪 PERSONALIZED FOR YOUR GOALS
- Lose Weight: Calorie-deficit recipes
- Build Muscle: High-protein meals
- Maintain: Balanced nutrition
- Eat Healthy: Wholesome ingredients

✨ KEY FEATURES:
• AI-powered recipe generation
• Complete macro breakdown (calories, protein, carbs, fats)
• Smart ingredient substitutions (FitSwap)
• Dietary restriction support (vegetarian, vegan, gluten-free, etc.)
• Step-by-step cooking mode
• Save and organize your favorite recipes
• No ads with premium subscription

🏆 JOIN 12,000+ USERS
"Finally managed to stick to a diet! The recipes are so easy!" - Mariana S.
"The pantry scanner is magic! I save so much time and money." - Carlos E.

Download NutriVerse and start your healthy eating journey today!
```

### 4.3 Keywords (Palavras-chave) - 100 caracteres
```
fitness,recipes,meal plan,healthy,diet,AI,nutrition,weight loss,muscle,cooking,food,macros
```

### 4.4 Support URL
```
https://nutriverse.app/support (ou email de suporte)
```

### 4.5 Marketing URL (Opcional)
```
https://nutriverse.app
```

---

## 🖼️ Passo 5: Adicionar Screenshots em Inglês

### Tamanhos Necessários:

| Dispositivo | Dimensões | Obrigatório |
|-------------|-----------|-------------|
| iPhone 6.7" | 1290 x 2796 px | ✅ Sim |
| iPhone 6.5" | 1284 x 2778 px | ✅ Sim |
| iPhone 5.5" | 1242 x 2208 px | ✅ Sim |
| iPad Pro 12.9" | 2048 x 2732 px | Se suportar iPad |

### Como Gerar Screenshots:

1. **No Simulador Xcode:**
   - Abra o Simulator
   - Mude o idioma do dispositivo para English
   - `Device > Language > English`
   - Navegue pelo app e tire screenshots com `Cmd + S`

2. **Cada screenshot deve mostrar:**
   - Screenshot 1: Tela inicial / Hero
   - Screenshot 2: Geração de receita
   - Screenshot 3: Scanner de despensa
   - Screenshot 4: Planejamento semanal
   - Screenshot 5: Detalhes da receita
   - Screenshot 6: Modo cozinhar (opcional)

### Upload das Screenshots:

1. Vá para **"App Store"** > **"iOS App"**
2. Selecione **"English (U.S.)"** no dropdown de idioma
3. Role até **"Screenshots"**
4. Arraste as imagens para cada tamanho de dispositivo

---

## 🎬 Passo 6: App Preview Video (Opcional)

Se quiser adicionar um vídeo de preview:

- **Duração:** 15-30 segundos
- **Formato:** H.264, .mov ou .mp4
- **Resolução:** Mesma do dispositivo (ex: 1290 x 2796 para 6.7")
- **Sem áudio com copyright**

---

## ✅ Passo 7: Revisar e Salvar

1. Revise todas as informações em inglês
2. Verifique se não há erros de ortografia
3. Clique em **"Save"** no canto superior direito
4. Repita para todas as seções necessárias

---

## 📤 Passo 8: Submeter para Revisão

1. Certifique-se de que a build com suporte a inglês foi enviada
2. Vá para **"App Store"** > **"iOS App"**
3. Selecione a versão atual
4. Preencha **"What's New in This Version"** em inglês:
   ```
   🌍 NEW: English language support!
   
   - Full app translation to English
   - Improved recipe generation
   - Bug fixes and performance improvements
   ```
5. Clique em **"Add for Review"**
6. Responda às perguntas de compliance
7. Clique em **"Submit for Review"**

---

## 📊 Passo 9: Configurar Pricing (Preços)

Se você tem In-App Purchases:

1. Vá para **"Features"** > **"In-App Purchases"**
2. Selecione cada produto (Monthly, Yearly)
3. Clique em **"Localizations"**
4. Adicione **English (U.S.)**
5. Preencha:
   - **Display Name:** "NutriVerse Pro Monthly" / "NutriVerse Pro Yearly"
   - **Description:** "Unlimited recipes, meal planning, and no ads"

### Preços Sugeridos (USD):

| Plano | Preço BR (BRL) | Preço US (USD) |
|-------|----------------|----------------|
| Mensal | R$ 19,90 | $4.99 |
| Anual | R$ 79,90 | $29.99 |

---

## 🌎 Passo 10: Configurar Disponibilidade por País

1. Vá para **"Pricing and Availability"**
2. Em **"Availability"**, clique em **"Edit"**
3. Marque os países onde deseja disponibilizar:
   - [x] United States
   - [x] United Kingdom
   - [x] Canada
   - [x] Australia
   - [x] Ireland
   - [x] (outros países de língua inglesa)
4. Salve as alterações

---

## 📧 Contato e Suporte

Configure informações de contato para usuários internacionais:

1. Vá para **"App Information"**
2. Em **"Contact Information"**:
   - Email em inglês ou email genérico
   - Phone (opcional, formato internacional)
3. Em **"Age Rating"**, confirme que está correto

---

## ✨ Checklist Final

Antes de submeter, confirme:

- [ ] Nome do app em inglês
- [ ] Subtítulo em inglês
- [ ] Descrição completa em inglês
- [ ] Keywords em inglês
- [ ] Screenshots em inglês (todos os tamanhos)
- [ ] What's New em inglês
- [ ] In-App Purchases localizados
- [ ] Países de disponibilidade configurados
- [ ] Build com suporte a idiomas enviada

---

## 🕐 Tempo de Revisão

- **Primeira submissão:** 24-48 horas
- **Atualizações:** 24 horas em média
- **Expedited Review:** Disponível para casos urgentes

---

## 📞 Suporte Apple

Se tiver problemas:
- [App Store Connect Help](https://help.apple.com/app-store-connect/)
- [Developer Support](https://developer.apple.com/contact/)

---

**Última atualização:** Dezembro 2024
