# 📘 Fitswap - Documentação de Produto & Design System

**Versão:** 1.0.0  
**Data:** 26 de Novembro de 2025  
**Status:** Em Desenvolvimento  

---

## 1. Resumo do App

O **Fitswap** é um assistente nutricional inteligente de bolso. Ele utiliza Inteligência Artificial Generativa (Google Gemini) para eliminar a fricção do planejamento alimentar. Ao contrário de apps tradicionais que exigem que o usuário busque receitas, o Fitswap **cria** soluções personalizadas baseadas no contexto imediato do usuário: o que ele tem na geladeira (Scanner de Despensa) ou o que ele está com vontade de comer (Transformação de Desejos).

## 2. Objetivos Principais

1.  **Eliminar a Indecisão Culinária:** Acabar com a dúvida do "o que comer hoje?" facilitando a escolha de refeições deliciosas com o que o usuário já possui em casa.
2.  **Hiper-Personalização de Sabor:** Garantir que cada prato esteja alinhado não apenas aos objetivos e restrições, mas também aos hábitos, preferências e paladar do usuário.
3.  **Nutrição de Elite Acessível:** Oferecer a experiência de um nutricionista e chef particular, adaptando planos para perda de peso ou definição com sofisticação. Oferecendo planos alimentares adaptados a objetivos (perda de peso, hipertrofia, saudável) e restrições sem o custo de um nutricionista particular.
4.  **Prazer sem Culpa:** Transformar desejos e pratos favoritos em versões saudáveis e macro-compatíveis, garantindo adesão pelo sabor.Transformando pratos "proibidos" (ex: pizza, hambúrguer) em versões saudáveis e macro-compatíveis.

## 3. Público-Alvo

*   **Mulheres em Busca de Excelência:** Mulheres com alto poder aquisitivo que buscam um corpo fitness, magro e admirável, valorizando saúde e estética.
*   **O "Busy Achiever":** Pessoas ocupadas que querem comer bem mas não têm tempo para planejar cardápios. Profissionais de sucesso que desejam otimizar seu tempo sem abrir mão de uma alimentação de alta qualidade
*   **O Entusiasta Fitness:** Praticantes de atividades físicas, musculação/esportes que buscam performance e resultados estéticos através da precisão nutricional.
*   **Lifestyle Premium:** Pessoas que buscam exclusividade e personalização em sua jornada de bem-estar.
*   **Restrições Alimentares:** Veganos, celíacos ou intolerantes à lactose que têm dificuldade em encontrar receitas variadas.

---

## 4. Lista de Funcionalidades (Detalhamento Técnico)

### 4.1. Autenticação & Perfil (Core)
*   **Descrição:** Sistema de gestão de identidade e preferências do usuário.
*   **Comportamento:** Login via Email/Senha. Onboarding coleta dados biométricos (peso, altura), objetivos e restrições.
*   **Dependências:** Firebase Auth, Firebase Firestore.
*   **Edge Cases:** Usuário sem conexão (persistência local necessária), falha na validação de email.

### 4.2. IA Chef ("Fitzar Receita")
*   **Descrição:** Motor de geração de receitas on-demand.
*   **Input:** Texto livre (nome do prato) ou Lista de Ingredientes (texto/imagem).
*   **Processamento:** Prompt engineering via Gemini API para estruturar receita (ingredientes, modo de preparo, macros).
*   **Output:** Objeto JSON estruturado renderizado como Card de Receita.

### 4.3. Scanner de Despensa
*   **Descrição:** Reconhecimento visual de ingredientes.
*   **Fluxo:** Usuário tira foto -> App envia imagem (base64) para Gemini Vision -> Retorna lista de strings -> Usuário confirma/edita -> IA gera receita.
*   **Regras:** Limite de tamanho de imagem, tratamento de imagens escuras/indistinguíveis.

### 4.4. Planejador Semanal (Weekly Planner)
*   **Descrição:** Geração de grade de refeições para 7 dias.
*   **Lógica:** Algoritmo que combina preferências do usuário com variedade nutricional. Evita repetição excessiva (configurável).
*   **Persistência:** Dados salvos localmente (AsyncStorage) e sincronizados no Firestore.

### 4.5. Lista de Compras Inteligente
*   **Descrição:** Agregação de ingredientes do plano semanal.
*   **Funcionalidade:** Consolida quantidades (ex: 2 receitas usam 2 ovos -> Lista pede 4 ovos). Categoriza itens (Hortifruti, Mercearia).
*   **Interação:** Checkbox com feedback háptico.

---

## 5. Arquitetura de Páginas do App

### 5.1. Onboarding & Auth
*   **Objetivo:** Converter o usuário e configurar o perfil inicial.
*   **Páginas:** `OnboardingScreen`, `LoginScreen`, `SignUpScreen`.
*   **Fluxo:** Splash -> Onboarding (Carrossel) -> Login/Cadastro -> Coleta de Dados -> MainScreen.

### 5.2. Home (Dashboard)
*   **Objetivo:** Visão geral e acesso rápido.
*   **Componentes:**
    *   `Header`: Saudação + Data + Avatar.
    *   `DailyTipCard`: Dica rotativa (dispensável).
    *   `CategoryList`: Carrossel horizontal de filtros.
    *   `RecipeFeed`: Lista vertical de receitas (Destaques ou Filtradas).
    *   `RecipePacks`: Pacotes curados de receitas por objetivo (ex: "Queima de Gordura", "Hipertrofia").
*   **Regras:** Feed atualiza baseado no horário do dia (manhã mostra café, noite mostra jantar).

### 5.3. Explorar (Hub de Criação)
*   **Objetivo:** Ferramenta principal de interação com a IA.
*   **Modos:**
    1.  **Texto (Desejo):** Input grande + Sugestões (Tags).
    2.  **Despensa (Scanner):** Botão de Câmera + Lista de Ingredientes + Botão "Gerar".
*   **Feedback:** LoadingOverlay com mensagens divertidas durante a geração.

### 5.4. Biblioteca (Library)
*   **Objetivo:** Centralizar o conhecimento culinário do usuário.
*   **Seções:**
    *   **Receitas Salvas:** Favoritos manuais.
    *   **Histórico:** Log automático de todas as receitas geradas pela IA.
*   **Interação:** Cards compactos com acesso rápido aos detalhes.

### 5.5. Agenda (Planning)
*   **Objetivo:** Gestão da rotina alimentar.
*   **Componentes:**
    *   `DaySelector`: Faixa horizontal de dias.
    *   `MealList`: Lista cronológica do dia selecionado.
    *   `ShoppingListModal`: Modal full-screen com checklist.
*   **Ações:** "Regenerar Refeição" (troca única), "Copiar Refeição".

### 5.6. Perfil
*   **Objetivo:** Gestão de conta e configurações.
*   **Seções:**
    *   Info do Usuário (Foto, Nome, Meta).
    *   Estatísticas (Contador de restrições).
    *   **Suporte & Legal:** Links para Webview/Browser (Docs GitHub Pages).
    *   Zona de Perigo: Logout, Excluir Conta.

---

## 6. Diretrizes de Branding & Design

### 6.1. Cores
A paleta transmite **energia, tecnologia e frescor**.

*   **Primary (Neon Lime):** `#a6f000`
    *   *Uso:* CTAs principais, ícones ativos, highlights.
*   **Surface (White):** `#FFFFFF`
    *   *Uso:* Fundo de cards, fundo da tela (Clean look).
*   **Text Primary (Dark Gray):** `#111827`
    *   *Uso:* Títulos, texto corrido de alto contraste.
*   **Text Secondary (Medium Gray):** `#6B7280`
    *   *Uso:* Legendas, ícones inativos, placeholders.
*   **Error:** `#EF4444`
    *   *Uso:* Mensagens de erro, ações destrutivas.

### 6.2. Tipografia
Família tipográfica do sistema (**San Francisco** no iOS, **Roboto** no Android) para natividade e performance, complementada por **Inter** (Google Fonts) se necessário para web.

*   **Display:** Bold / ExtraBold (Títulos de impacto).
*   **Body:** Regular / Medium (Leitura confortável).
*   **Button:** Bold (Chamada para ação).

### 6.3. Iconografia
Biblioteca: **Lucide React Native**.
*   **Estilo:** Outline (traço), espessura 2px.
*   **Consistência:** Cantos arredondados, visual geométrico e moderno.

### 6.4. Voz e Tom
*   **Motivador:** "Vamos atingir essa meta!", "Ótima escolha!".
*   **Direto:** Sem jargões técnicos complexos.
*   **Empático:** Entende que dieta é difícil. "Transforme seu desejo em saúde".

---

## 7. Design System (Resumo)

### Botões
*   **Primary:** Fundo `#000000` (ou Lime), Texto Branco (ou Preto), Radius `16px`, Altura `56px`.
*   **Secondary:** Fundo Transparente, Borda `#E5E7EB`, Texto `#111827`.
*   **Ghost:** Apenas texto ou ícone, sem borda/fundo.

### Cards
*   **Container:** Fundo Branco, Radius `20px` ou `24px`.
*   **Sombra:** `ShadowColor: #000`, `Offset: {0, 4}`, `Opacity: 0.05` (Sutil).
*   **Borda:** Opcional `1px solid #F3F4F6` para definição.

### Inputs
*   **Field:** Fundo Branco, Borda `#E5E7EB`, Radius `16px`, Padding `16px`.
*   **Focus:** Borda `#a6f000` ou Preto.

---

## 8. Boas Práticas de Navegação e Consistência

1.  **Feedback Háptico:** Usar `Haptics.impactAsync` em todas as interações significativas (troca de aba, check na lista, botão de gerar).
2.  **Transições:** Animações suaves (`LayoutAnimation`) ao expandir cards ou trocar modos de visualização.
3.  **Loading States:** Nunca deixar a tela congelada. Usar Skeletons ou o `LoadingOverlay` com mensagens de progresso para operações de IA (>2s).
4.  **Empty States:** Sempre oferecer uma ação quando uma lista estiver vazia (ex: "Sua despensa está vazia. Que tal adicionar um item?").
5.  **Acessibilidade:** Garantir contraste mínimo entre texto e fundo. Áreas de toque mínimas de 44x44px.

---

## 9. Considerações Finais

Este documento serve como a **fonte da verdade** para o desenvolvimento do Fitswap. Qualquer nova funcionalidade deve ser validada contra os objetivos principais e seguir as diretrizes de design aqui estabelecidas.

*   **Para Devs:** Sigam a arquitetura de componentes e serviços. Mantenham a lógica de negócio separada da UI.
*   **Para Design:** Mantenham a consistência visual. O "Neon Lime" é poderoso, use com moderação para destacar, não para cansar.
*   **Para Produto:** O foco é a **mágica da IA**. Tudo deve convergir para facilitar a geração e consumo das receitas inteligentes.
