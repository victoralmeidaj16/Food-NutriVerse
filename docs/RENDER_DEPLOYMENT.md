# 🚀 Deploy do Backend na Vercel (Serverless)

Este guia mostra como fazer o deploy do backend do **Food NutriVerse** na **Vercel** como funções serverless, eliminando o problema de *cold start* (hibernação de 30-60 segundos) que existia no plano gratuito do Render.com.

---

## ⚡ Por que Vercel?

- **Sem hibernação de 15 min**: Ao contrário do Render Free, as funções serverless da Vercel respondem imediatamente sob demanda.
- **Melhor tempo de resposta**: Menos latência geral para as requisições enviadas ao Gemini.
- **Deploy automático integrado**: Cada `git push` gera um novo deploy/preview na Vercel.

---

## ✅ Pré-requisitos

1. ✅ Conta no GitHub (onde o repositório está hospedado)
2. ✅ Conta na [Vercel](https://vercel.com) (plano Hobby/gratuito)
3. ✅ Chave da API do Google Gemini (`GOOGLE_API_KEY`)
4. ✅ [Vercel CLI](https://vercel.com/cli) instalada localmente (opcional, para deploys manuais via linha de comando)

---

## 📋 Passo a Passo do Deploy

### **1. Estrutura do Projeto**

O backend já está preparado para a Vercel com os seguintes arquivos na pasta `/backend`:
- [vercel.json](file:///Users/victoralmeidaj16/Downloads/Food-NutriVerse/backend/vercel.json): Configura a duração máxima das funções (`maxDuration: 300` para chamadas longas de IA) e o roteamento das APIs.
- [api/index.js](file:///Users/victoralmeidaj16/Downloads/Food-NutriVerse/backend/api/index.js): Entrypoint serverless que expõe o aplicativo Express.

### **2. Configuração no Painel da Vercel**

1. Acesse o [Dashboard da Vercel](https://vercel.com/dashboard)
2. Clique em **"Add New..."** → **"Project"**
3. Importe o repositório **`victoralmeidaj16/Food-NutriVerse`**
4. Configure as seguintes opções de projeto:
   - **Framework Preset**: `Other` (ou deixe Vercel detectar automaticamente)
   - **Root Directory**: Clique em *Edit* e selecione a pasta **`backend`**
5. Abra a seção **"Environment Variables"** e adicione as seguintes variáveis de ambiente:

| Key | Value | Escopo / Observação |
|-----|-------|---------------------|
| `GOOGLE_API_KEY` | `AIzaSyBD4...` | ✅ **Obrigatória** (Sua chave do Gemini) |
| `NODE_ENV` | `production` | Recomendado |

6. Clique em **"Deploy"**.

---

## 🔗 URL de Produção

Após a conclusão do build, a Vercel gerará domínios automáticos, como por exemplo:
```
https://food-nutriverse-backend.vercel.app
```

Você pode testar se o serviço está no ar acessando as rotas de status em seu navegador ou via curl:
```bash
curl https://food-nutriverse-backend.vercel.app/health
# Esperado: {"status":"ok"} ou {"status":"online"...}
```

---

## 📱 Configuração do Aplicativo Mobile

O aplicativo está configurado em [config.ts](file:///Users/victoralmeidaj16/Downloads/Food-NutriVerse/mobile-app/services/config.ts) para apontar por padrão para a Vercel em produção.

Caso precise alterar manualmente ou usar uma URL customizada de staging/teste, configure a variável de ambiente no seu arquivo local ou no painel do EAS Build:

```bash
EXPO_PUBLIC_BACKEND_URL=https://sua-url-da-vercel.vercel.app
```

O helper `IS_VERCEL_BACKEND` detecta automaticamente se a API está rodando na Vercel e **desativa automaticamente** a rotina de warmup do Render, economizando bateria e requisições desnecessárias.

---

## 🔄 Atualizações Automáticas (CI/CD)

- Qualquer alteração enviada para o ramo `main` do GitHub disparará automaticamente um deploy de produção na Vercel.
- Pull requests criam deploys de **Preview** para testes isolados antes do merge.

---

## 🐛 Troubleshooting & Monitoramento

### **Duração das Requisições**
- A geração do cardápio semanal foi otimizada para ser executada em blocos diários de ~6 segundos para evitar atingir o limite de timeout da Vercel (10 segundos no plano Hobby padrão, estendido para até 300 segundos via `vercel.json` se suportado pelo plano).

### **Logs de Erro**
- Acesse a aba **"Logs"** do seu projeto no painel da Vercel para visualizar erros de execução e timeouts.
- Confirme se a `GOOGLE_API_KEY` está configurada corretamente na aba **Settings → Environment Variables** caso as receitas retornem erro de autenticação.
