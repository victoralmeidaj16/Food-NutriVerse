# Migração do Backend: Render → Vercel

> **Branch:** `feat/vercel-migration`
> **Objetivo:** sair do Render (free tier) por causa do *cold start* de 30-60s e
> rodar o backend como funções serverless no **Vercel (plano Hobby/grátis)**, que
> não hiberna como um Web Service gratuito do Render.

---

## 1. Por que migrar

- **Render free** = servidor sempre-ligado que **dorme após 15 min** de inatividade.
  O primeiro acesso depois disso leva **20-60s** para acordar ("acordar o servidor").
- **Vercel Hobby** = funções serverless **sob demanda**, sem spin-down do servidor.
  Pode existir inicialização de função, mas não o cold start longo de hibernação do Render.
  Como o backend é só um *proxy stateless* para o
  Google Gemini (sem banco, sem sessão), é um caso quase ideal para serverless.

## 2. Restrições do Vercel Hobby (e como tratamos cada uma)

| Restrição do plano grátis | Impacto no app | Solução aplicada |
|---|---|---|
| **Duração máxima configurável por função** | Chamadas de IA podem demorar, principalmente plano semanal e imagens | `maxDuration: 300` no `vercel.json` **+** geração quebrada em 1 chamada por dia para reduzir risco e melhorar recuperação |
| **4.5MB por requisição** | Upload de fotos em base64 podia estourar | Resize/compressão das imagens antes do envio (`expo-image-manipulator`) |
| Sem servidor persistente | `app.listen()` não roda no Vercel | `server.js` exporta o app; `api/index.js` é o entrypoint serverless |

---

## 3. O que JÁ foi feito ✅

Preparado na branch `feat/vercel-migration`. **A produção atual no Render
continua intacta** — o app ainda aponta para o Render enquanto
`EXPO_PUBLIC_BACKEND_URL` não for configurada com a URL da Vercel no build.

### Backend (pronto para Vercel, ainda compatível com Render)
- `backend/server.js` — `app.listen()` só roda em execução direta (dev local /
  Render); em produção serverless o app é **exportado** como handler. O Gemini
  agora é inicializado de forma lazy, então `/health` e `/api/status` funcionam
  mesmo antes de configurar `GOOGLE_API_KEY` na Vercel.
- `backend/api/index.js` *(novo)* — entrypoint serverless que re-exporta o Express.
  ✅ testado localmente: responde `200` em `/health`.
- `backend/vercel.json` *(novo)* — roteia todas as rotas para a função **e** define
  `maxDuration: 300` para dar folga às chamadas de IA.
- `backend/public/.gitkeep` *(novo)* — mantém um output estático vazio para a
  Vercel concluir o build do projeto API-only.

### App — limite de 4.5MB (resize de imagem)
- Adicionado `expo-image-manipulator` (~14.0.8, compatível com Expo SDK 54).
- Novo helper `uriToCompressedBase64()` em `mobile-app/services/imageService.ts`
  (resize para 1024px de largura + JPEG qualidade 0.6).
- Aplicado nos **3** pontos de upload em `mobile-app/screens/MainScreen.tsx`:
  - modo **Desejo** (até 2 imagens)
  - **scan da despensa**
  - **análise de refeição** (Mapa Alimentar)
  - removidas as conversões antigas via `fetch().blob()` / `FileReader`.

### App — risco de timeout em chamadas longas (plano semanal)
- `generateWeeklyPlan()` em `mobile-app/services/geminiService.ts` refatorado:
  em vez de **1 chamada de ~44s**, agora faz **1 chamada por dia** (~6s cada),
  sequencial, passando os pratos já usados adiante para manter a variedade.
- **Mesma assinatura** da função → nenhum caller precisou mudar
  (`MainScreen.tsx` e `App.tsx` continuam iguais).
- Cada requisição fica menor e mais fácil de recuperar em caso de erro/transiente.

### App — cutover limpo
- `mobile-app/app.config.js` + `mobile-app/services/config.ts` — `BACKEND_URL`
  agora pode vir de `EXPO_PUBLIC_BACKEND_URL`; se a variável não existir, cai
  no fallback do Render.
- Timeout e mensagem de "cold start" agora condicionais:
  **120s em produção**, com mensagem de cold start só no Render (`geminiService.ts`).
- O **warmup** (`backendWarmup.ts`) se **auto-desativa** quando a URL for do Vercel.

### Verificações
- ✅ `tsc --noEmit` do `mobile-app` — **sem erros**.
- ✅ `backend/server.js` carrega localmente como handler Express.
- ✅ Projeto Vercel criado/linkado: `food-nutriverse-backend`.
- ✅ Deploy de produção publicado:
  `https://food-nutriverse-backend.vercel.app`.
- ✅ `/health` em produção responde `{"status":"ok"}`.
- ⚠️ `/api/status` em produção responde `gemini_configured: false` até
  `GOOGLE_API_KEY` ser cadastrada no ambiente Production da Vercel.

---

## 4. O que FALTA fazer ⏳ (cutover manual)

> Deixado de propósito para não quebrar a produção atual no Render.

- [x] **1. Deploy no Vercel**
  - Projeto: `food-nutriverse-backend`.
  - URL de produção: `https://food-nutriverse-backend.vercel.app`.
  - Diretório local linkado: `backend`.

- [ ] **2. Variáveis de ambiente** (Settings → Environment Variables, escopo *Production*)

  | Variável | Obrigatória | Observação |
  |---|---|---|
  | `GOOGLE_API_KEY` | ✅ Sim | sem ela receita/imagem não funcionam |
  | `NODE_ENV` | recomendado | `production` |
  | `APPLE_ISSUER_ID`, `APPLE_KEY_ID`, `APPLE_BUNDLE_ID`, `APPLE_PRIVATE_KEY` | só p/ validação Apple | hoje desativado no Render |
  | `APPLE_APP_ID`, `APPLE_ROOT_CA_PEMS`, `APPLE_SERVER_ENVIRONMENT` | idem | `APPLE_PRIVATE_KEY` aceita `\n` literais (o código já trata) |

- [ ] **3. Testar a URL nova** (ex.: `https://seu-projeto.vercel.app`)
  ```bash
  curl https://food-nutriverse-backend.vercel.app/health
  curl https://food-nutriverse-backend.vercel.app/api/status   # deve mostrar gemini_configured: true depois da env
  ```

- [ ] **4. Cutover no app**
  - Preferido: configurar `EXPO_PUBLIC_BACKEND_URL=https://seu-projeto.vercel.app`
    no ambiente do build EAS/CI.
  - Alternativa: alterar o fallback em `mobile-app/services/config.ts`.
    O warmup se ajusta sozinho via `IS_VERCEL_BACKEND`.
  - **Novo build EAS** — obrigatório porque `expo-image-manipulator` é módulo
    **nativo** (não basta OTA update).

- [ ] **5. Validar em produção** (gerar receita, plano semanal, upload de foto).

- [ ] **6. Desligar o Render** após alguns dias de fallback estável.

---

## 5. Pós-cutover (opcional / melhorias futuras)

- Remover de vez o `backendWarmup.ts` e suas chamadas (já é no-op no Vercel).
- Considerar geração de dias do plano **em paralelo** (mais rápido) — abre mão da
  deduplicação sequencial de pratos; avaliar trade-off.
- Monitorar uso do plano grátis do Vercel (invocações / tempo de execução).

---

## 6. Rollback

Se algo der errado no Vercel, o rollback é **trivial**: remover ou trocar
`EXPO_PUBLIC_BACKEND_URL` para a URL do Render e publicar um novo build. O
backend no Render permanece de pé durante toda a transição.

---

*Última atualização: documento gerado durante a preparação da migração
(branch `feat/vercel-migration`, antes do cutover).*


