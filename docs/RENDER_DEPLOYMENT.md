# 🚀 Deploy do Backend no Render.com

Este guia mostra como fazer o deploy do backend Food NutriVerse no Render.com para que o app funcione em produção.

## ✅ Pré-requisitos

1. ✅ Conta no GitHub (para conectar ao Render)
2. ✅ Conta no [Render.com](https://render.com) (plano gratuito funciona)
3. ✅ Chave da API do Google Gemini

---

## 📋 Passo a Passo

### **1. Preparar o Repositório GitHub**

Certifique-se de que o código está commitado e enviado para o GitHub:

```bash
cd /Users/victoralmeidaj16/Downloads/Food-NutriVerse-1
git add .
git commit -m "Prepare backend for Render deployment"
git push origin main
```

### **2. Criar Web Service no Render**

1. Acesse [https://dashboard.render.com/](https://dashboard.render.com/)
2. Clique em **"New +"** → **"Web Service"**
3. Conecte sua conta GitHub se ainda não conectou
4. Selecione o repositório: **`victoralmeidaj16/Food-NutriVerse`**
5. Clique em **"Connect"**

### **3. Configurar o Web Service**

Preencha os campos conforme abaixo:

| Campo | Valor |
|-------|-------|
| **Name** | `food-nutriverse-backend` |
| **Region** | `Oregon (US West)` ou mais próximo do Brasil |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### **4. Adicionar Variável de Ambiente**

Na seção **"Environment Variables"**, clique em **"Add Environment Variable"** e adicione:

| Key | Value |
|-----|-------|
| `GOOGLE_API_KEY` | `AIzaSyBD4B1V8GeGMYTfyviHVWcJaNfufpu4dr8` |
| `NODE_ENV` | `production` |

> ⚠️ **Importante**: Use a chave GOOGLE_API_KEY do seu projeto. A chave acima é um exemplo.

### **5. Deploy**

1. Clique em **"Create Web Service"**
2. O Render começará a fazer o deploy automaticamente
3. Aguarde 5-10 minutos para o primeiro deploy completar
4. Você verá logs na tela mostrando o progresso

### **6. Verificar URL de Produção**

Após o deploy, o Render fornecerá uma URL pública:

```
https://food-nutriverse-backend.onrender.com
```

ou similar (o nome pode variar se `food-nutriverse-backend` já estiver em uso).

### **7. Testar o Backend**

Abra o navegador ou use curl para testar:

```bash
curl https://food-nutriverse-backend.onrender.com/
```

Você deve ver uma resposta JSON:

```json
{
  "status": "online",
  "service": "Food NutriVerse API",
  "version": "1.0.0",
  "endpoints": {
    "generate": "POST /api/generate-recipe",
    "health": "GET /health",
    "status": "GET /api/status"
  }
}
```

### **8. Atualizar o App Mobile**

Atualize o arquivo `mobile-app/services/config.ts` com a URL correta:

```typescript
export const BACKEND_URL = __DEV__
    ? 'http://192.168.1.107:3000'
    : 'https://food-nutriverse-backend.onrender.com'; // Sua URL do Render
```

---

## ⚠️ Importante sobre o Plano Gratuito do Render

### **Comportamento do Free Tier:**

- O serviço **"hiberna" após 15 minutos de inatividade**
- A primeira requisição após hibernar pode demorar 30-60 segundos (cold start)
- Após "acordar", responde normalmente

### **Soluções:**

#### **Opção 1: Aceitar o Cold Start (Gratuito)**
- Adicione um loading state mais longo no app
- Mostre mensagem: "Aguarde, despertando o Chef IA..."

#### **Opção 2: Usar Cron Job (Gratuito)**
- Use um serviço como [cron-job.org](https://cron-job.org) para fazer ping a cada 14 minutos
- URL do ping: `https://food-nutriverse-backend.onrender.com/health`
- Mantém o serviço sempre ativo

#### **Opção 3: Upgrade para Paid Plan ($7/mês)**
- Sem hibernação
- Mais recursos
- Melhor performance

---

## 🔄 Atualizações Automáticas

O Render faz **deploy automático** sempre que você fizer push para a branch `main`:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

---

## 🐛 Troubleshooting

### Backend não responde?

1. Verifique os logs no Dashboard do Render
2. Confirme que `GOOGLE_API_KEY` está configurada
3. Teste a rota `/health` primeiro

### Erro 503?

- Provavelmente o serviço está "acordando" do sleep
- Aguarde 30-60 segundos e tente novamente

### App não conecta?

- Verifique se a URL no `config.ts` está correta
- Confirme que o app está buildado para produção (não development)

---

## 📞 Links Úteis

- [Dashboard Render](https://dashboard.render.com/)
- [Documentação Render - Node.js](https://render.com/docs/deploy-node-express-app)
- [Render Status](https://status.render.com/)

---

## ✅ Checklist Final

Antes de enviar para a App Store:

- [ ] Backend deployado no Render
- [ ] Variável `GOOGLE_API_KEY` configurada
- [ ] URL de produção atualizada no `config.ts`
- [ ] App testado em modo Release (não Debug)
- [ ] Backend respondendo em 100% dos testes
- [ ] Documentação legal (Privacy Policy, Terms) publicada no GitHub Pages

---

## 🎯 Próximos Passos

Após deploy bem-sucedido:

1. Teste todas as funcionalidades do app com o backend de produção
2. Verifique os limites de quota da API Gemini
3. Configure monitoramento de erros (opcional: Sentry)
4. Prepare o build final para a App Store

**Sucesso! 🎉**
