# Fitswap - Documentação de Produto & Design System

**Versão:** 1.4.6 (Build 37)
**Última atualização:** 13 de Abril de 2026
**Status:** Produção (App Store / TestFlight)

---

## 1. Resumo do App

O **Fitswap** é um assistente nutricional inteligente de bolso. Ele utiliza Inteligência Artificial Generativa (Google Gemini 2.0 Flash) para eliminar a fricção do planejamento alimentar. Ao contrário de apps tradicionais que exigem que o usuário busque receitas, o Fitswap **cria** soluções personalizadas baseadas no contexto imediato do usuário: o que ele tem na geladeira (Scanner de Despensa), o que ele está com vontade de comer (Transformação de Desejos), ou um plano semanal completo alinhado ao seu perfil e gosto pessoal.

---

## 2. Objetivos Principais

1. **Hiper-Personalização de Sabor:** Garantir que cada prato esteja alinhado não apenas aos objetivos e restrições, mas também aos hábitos, preferências e paladar do usuário.
2. **Nutrição de Elite Acessível:** Oferecer a experiência de um nutricionista e chef particular, adaptando planos para perda de peso, hipertrofia ou vida saudável — sem o custo de um profissional.
3. **Prazer sem Culpa:** Transformar desejos e pratos favoritos em versões saudáveis e macro-compatíveis, garantindo adesão pelo sabor.
4. **Planejamento Sem Esforço:** Gerar planos semanais completos — com visão geral, lista de compras categorizada e slots geráveis individualmente — em segundos.

---

## 3. Público-Alvo

- **Mulheres em Busca de Excelência:** Alto poder aquisitivo que buscam um corpo fitness, valorizando saúde e estética.
- **O "Busy Achiever":** Profissionais ocupados que querem comer bem sem tempo para planejar cardápios.
- **O Entusiasta Fitness:** Praticantes de musculação/esportes que buscam performance e resultados estéticos via precisão nutricional.
- **Lifestyle Premium:** Pessoas que buscam exclusividade e personalização em sua jornada de bem-estar.
- **Restrições Alimentares:** Veganos, celíacos ou intolerantes à lactose com dificuldade de encontrar receitas variadas.

---

## 4. Lista de Funcionalidades

### 4.1. Autenticação & Perfil (Core)
- **Descrição:** Sistema de gestão de identidade e preferências do usuário.
- **Comportamento:** Login via Email/Senha. Onboarding coleta dados biométricos (peso, altura), objetivos e restrições alimentares.
- **Dependências:** Firebase Auth, Firebase Firestore.
- **Edge Cases:** Usuário sem conexão (persistência local), falha na validação de email.

### 4.2. Gosto do Usuário (Taste Profile)
- **Descrição:** Perfil de preferências alimentares usado para personalizar todas as gerações de IA.
- **Campos:** Alimentos favoritos (tags), hábitos alimentares do dia a dia (texto livre).
- **Uso pela IA:** Injetado no prompt de geração do plano semanal para garantir receitas que o usuário realmente aprecia.
- **Acesso:** Modal de edição de perfil, seção "Meu Gosto".

### 4.3. IA Chef ("Fitzar Receita" / Explorar)
- **Descrição:** Motor de geração de receitas on-demand.
- **Input:** Texto livre (desejo/prato) ou lista de ingredientes digitada/fotografada.
- **Suporte a imagens:** Upload múltiplo de fotos de ingredientes (galeria) ou captura direta por câmera.
- **Processamento:** Prompt engineering via Gemini 2.0 Flash para estruturar receita (ingredientes, modo de preparo, macros).
- **Output:** Objeto JSON renderizado como Card de Receita com macros, tempo de preparo e instruções passo a passo.

### 4.4. Scanner de Despensa
- **Descrição:** Reconhecimento visual de ingredientes via câmera ou galeria.
- **Fluxo:** Usuário tira/seleciona foto(s) → `ScanningModal` com animação de scan em tempo real → Gemini Vision retorna lista de ingredientes → Usuário confirma/edita → IA gera receita.
- **ScanningModal:** Overlay animado com linha de scan (LinearGradient), status em tempo real do processamento e card de imagem com proporção 4:3.
- **Regras:** Suporte a múltiplas imagens, tratamento de imagens escuras/indistinguíveis.

### 4.5. Planejador Semanal (Weekly Planner)
- **Descrição:** Geração de grade de refeições para 7 dias personalizada ao perfil do usuário.
- **Personalização:** Usa `tasteProfile` (alimentos favoritos, hábitos) e objetivo do usuário (emagrecer, hipertrofiar, saudável) no prompt de geração.
- **Loading:** Progresso simulado de 0→95% em ~30s com easing ease-out, mantendo 95% até a conclusão real.
- **Visão Geral da Semana:** Grid horizontal de 7 dias com indicador de preenchimento (dot verde/cinza) e total de kcal do dia.
- **Slot Vazio:** Refeições sem receita exibem botão `+` para gerar receita individualmente no slot.
- **Regeneração:** Botão de troca para qualquer refeição já preenchida.
- **Persistência:** Dados salvos no Firestore por usuário.

### 4.6. Lista de Compras Inteligente
- **Descrição:** Agregação de ingredientes do plano semanal com agrupamento visual por categoria.
- **Categorias:** Hortifruti (🥦), Carnes & Proteínas (🥩), Laticínios & Ovos (🥛), Mercearia (🛒), Outros (📦).
- **Header de categoria:** Ícone + nome da seção + contagem de itens.
- **Interação:** Checkbox por item com feedback visual.

### 4.7. Biblioteca de Receitas
- **Descrição:** Centraliza o histórico e favoritos do usuário.
- **Seções:** Receitas salvas (favoritos manuais) e histórico automático de receitas geradas pela IA.
- **Interação:** Cards compactos com acesso rápido aos detalhes.

---

## 5. Arquitetura de Telas

### 5.1. Onboarding & Auth
- **Objetivo:** Converter o usuário e configurar o perfil inicial.
- **Telas:** `OnboardingScreen`, `LoginScreen`, `SignUpScreen`.
- **Fluxo:** Splash → Onboarding (carrossel) → Login/Cadastro → Coleta de dados → `MainScreen`.

### 5.2. Home (Dashboard)
- **Objetivo:** Visão geral e acesso rápido às funcionalidades.
- **Componentes:**
  - `Header`: Saudação + data + avatar.
  - `DailyTipCard`: Dica rotativa (dispensável).
  - `CategoryList`: Carrossel horizontal de filtros.
  - `RecipeFeed`: Lista vertical de receitas (destaques ou filtradas).
  - `RecipePacks`: Pacotes curados por objetivo (ex: "Queima de Gordura", "Hipertrofia").
- **Regras:** Feed adapta-se ao horário do dia.

### 5.3. Explorar (Hub de Criação)
- **Objetivo:** Ferramenta principal de interação com a IA.
- **Modos:**
  1. **Texto (Desejo):** Input grande + tags de sugestão + botão de upload de imagem referência (`UploadIcon`) + botão de câmera (`CameraIcon`).
  2. **Despensa (Scanner):** Botão de câmera + botão de galeria + lista de ingredientes + botão "Gerar".
- **Feedback:** `ScanningModal` durante análise de imagens; `LoadingOverlay` durante geração de texto.

### 5.4. Agenda (Planejador)
- **Objetivo:** Gestão da rotina alimentar semanal.
- **Componentes:**
  - `WeekOverviewGrid`: Grid de 7 dias com dot de preenchimento e kcal.
  - `DaySelector`: Faixa horizontal de seleção de dia.
  - `MealList`: Lista cronológica do dia selecionado (Café, Almoço, Lanche, Jantar).
  - `ShoppingListModal`: Modal full-screen com checklist categorizado por seção.
- **Ações:** Gerar slot vazio, regenerar refeição existente, copiar refeição.

### 5.5. Biblioteca
- **Objetivo:** Centralizar o acervo pessoal de receitas.
- **Seções:** Favoritos, Histórico.

### 5.6. Perfil
- **Objetivo:** Gestão de conta e personalização.
- **Layout:** Card centralizado com foto, nome, meta e estatísticas.
- **Seções via modal:**
  - Dados pessoais (nome, email, biométricos, objetivo, restrições).
  - **Meu Gosto:** Alimentos favoritos (tags) e hábitos alimentares do dia a dia.
  - Configurações de notificação.
- **Zona de perigo:** Logout, excluir conta.
- **Suporte & Legal:** Links para política de privacidade e suporte.

---

## 6. Diretrizes de Branding & Design

### 6.1. Cores
A paleta transmite **energia, tecnologia e frescor**.

| Token | Hex | Uso |
|---|---|---|
| Primary (Neon Lime) | `#a6f000` | CTAs, ícones ativos, highlights |
| Surface (White) | `#FFFFFF` | Fundo de cards, telas |
| Text Primary | `#111827` | Títulos, texto de alto contraste |
| Text Secondary | `#6B7280` | Legendas, ícones inativos, placeholders |
| Error | `#EF4444` | Erros, ações destrutivas |
| Background | `#F9FAFB` | Fundo geral das telas |

### 6.2. Tipografia
Família do sistema (**San Francisco** no iOS) para natividade e performance.

- **Display:** Bold / ExtraBold — títulos de impacto.
- **Body:** Regular / Medium — leitura confortável.
- **Button:** SemiBold / Bold — chamada para ação.
- **Label:** Regular uppercase gray — rótulos de seção.

### 6.3. Iconografia
Biblioteca: **Lucide React Native** (via `mobile-app/components/Icons.tsx`).
- **Estilo:** Outline, espessura 2px, cantos arredondados.
- **Nunca usar emojis como ícones de ação** — sempre usar componentes Lucide.

### 6.4. Animações
- **Scan line:** `Animated.loop` com `Animated.sequence` (vai e volta) — `ScanningModal`.
- **Progress bar:** Ease-out simulado via `setInterval` (0→95% em 30s) — geração do plano semanal.
- **LinearGradient:** `expo-linear-gradient` para trail do scanner e destaques visuais.

### 6.5. Voz e Tom
- **Motivador:** "Vamos atingir essa meta!", "Ótima escolha!".
- **Direto:** Sem jargões técnicos.
- **Empático:** "Transforme seu desejo em saúde".

---

## 7. Design System

### Botões
- **Primary:** Fundo `#000000` (ou Lime), texto branco/preto, radius `16px`, altura `56px`.
- **Secondary:** Fundo transparente, borda `#E5E7EB`, texto `#111827`.
- **Ghost:** Apenas texto ou ícone, sem borda/fundo.

### Cards
- **Container:** Fundo branco, radius `20px`–`24px`.
- **Sombra:** `shadowOpacity: 0.05`–`0.10` (sutil).
- **Borda:** Opcional `1px solid #F3F4F6`.

### Inputs
- **Field:** Fundo branco, borda `#E5E7EB`, radius `16px`, padding `16px`.
- **Focus:** Borda `#a6f000` ou preta.

### Modais
- **Full-screen:** `SafeAreaView` com header próprio e botão de fechar `XIcon`.
- **Overlay parcial:** `LoadingOverlay` com card centralizado, `ActivityIndicator` Lime e mensagem.
- **ScanningModal:** Full-screen com imagem 4:3, linha de scan animada e status em tempo real.

---

## 8. Arquitetura Técnica

### Stack
- **Framework:** React Native (Expo SDK)
- **Plataforma:** iOS (primário), Android (secundário)
- **Linguagem:** TypeScript (strict)
- **Navegação:** React Navigation (Bottom Tabs + Stack)
- **Backend/DB:** Firebase Auth + Firestore
- **IA:** Google Gemini 2.0 Flash (via backend Render)
- **Imagens:** `expo-image-picker` (câmera + galeria, múltiplas seleções)
- **Gradientes:** `expo-linear-gradient`
- **Ícones:** `lucide-react-native`

### Serviços principais
| Arquivo | Responsabilidade |
|---|---|
| `services/geminiService.ts` | Toda comunicação com a API Gemini; geração de receitas, plano semanal, análise de imagens |
| `services/firebaseService.ts` | CRUD Firestore, persistência de perfil e planos |
| `hooks/useSubscription.ts` | Estado de assinatura IAP |
| `hooks/useUserData.ts` | Dados do usuário em tempo real |

### Componentes chave
| Componente | Descrição |
|---|---|
| `ScanningModal` | Overlay de scan com animação e status em tempo real |
| `LoadingOverlay` | Overlay simples de loading com mensagem e prop `visible` |
| `EditProfileModal` | Modal completo de edição de perfil (dados + gosto) |
| `Icons.tsx` | Re-exports centralizados de todos os ícones Lucide |

---

## 9. Boas Práticas

1. **Feedback Háptico:** `Haptics.impactAsync` em interações significativas.
2. **Loading States:** Nunca congelar a tela. `ScanningModal` para análise de imagens; `LoadingOverlay` para geração de texto.
3. **Progress Simulation:** Para operações longas (>5s), simular progresso ease-out para não iludir o usuário com 95% imediato.
4. **Empty States:** Sempre oferecer ação quando lista vazia (ex: slot vazio com botão `+`).
5. **Acessibilidade:** Contraste mínimo entre texto e fundo; áreas de toque mínimas de 44×44px.
6. **TypeScript:** Manter `npx tsc --noEmit` sem erros antes de qualquer commit.
7. **Ícones:** Nunca usar emojis como ícones de ação — usar componentes Lucide via `Icons.tsx`.

---

## 10. Histórico de Versões

| Versão | Build | Destaques |
|---|---|---|
| 1.4.6 | 37 | Plano semanal com gosto do usuário, visão geral da semana, lista de compras categorizada, scanner animado, perfil simplificado, ícones SVG no Explorer |
| 1.4.5 | 36 | ScanningModal com animação, upload múltiplo de alimentos, redesign do perfil |
| 1.4.4 | 35 | Mapa alimentar com upload múltiplo, loading screen premium |
| 1.4.2 | 33 | Plano semanal com schema leve, limite de tokens |
| 1.4.1 | 32 | Modularização de hooks de assinatura e dados do usuário |
