# Guia de Operação: Cadastrar Afiliados e Liberar Acesso

Este guia descreve os passos necessários para que você (administrador) possa cadastrar um novo afiliado no painel, gerar seu link exclusivo e instruí-lo a acessar o painel dele para ver os dados da parceria.

---

## 🔑 Passo 1: Acessar o Painel Administrativo
1. Acesse o link público do painel: `https://afiliados-app.vercel.app` (ou o domínio personalizado configurado).
2. Na caixa de texto de acesso, insira a sua credencial secreta de administrador (configurada como `ADMIN_SECRET` nas variáveis de ambiente da Vercel).
3. Pressione **Acessar meu painel**. Você será redirecionado para a tela administrativa do sistema.

---

## 👥 Passo 2: Cadastrar o Novo Afiliado
1. No painel de administração, clique na aba **Creators** no cabeçalho ou menu.
2. Clique no botão azul **+ Novo Creator**.
3. Preencha os campos solicitados no formulário:
   *   **App**: Selecione o aplicativo correspondente à parceria (ex: **Fitswap**).
   *   **Nome**: Nome completo ou nome artístico do afiliado (ex: `Mariana Silva`).
   *   **Email**: E-mail do afiliado para contato e registro.
   *   **Código de Indicação**: Escolha um cupom curto, simples e em letras maiúsculas (ex: `MARI10`, `FITMARI`). **Este código será utilizado no login do afiliado.**
   *   **Comissão (%)**: A porcentagem de ganho dele sobre cada assinatura indicada (ex: `20` para 20%).
   *   **Mínimo payout (USD)**: Valor mínimo acumulado que o afiliado precisa atingir para solicitar o saque (ex: `50` para $50.00).
4. Clique em **Criar**. O afiliado já estará cadastrado e ativo.

---

## 🔗 Passo 3: Obter o Link Exclusivo do Afiliado
1. Na lista de criadores que aparece na tela de **Creators**, localize o afiliado recém-criado.
2. O sistema gera automaticamente um link baseado no código que você escolheu. O formato padrão é:
   `https://afiliados-app.vercel.app/join/CODIGO_DO_AFILIADO` (ex: `https://afiliados-app.vercel.app/join/MARI10`)
3. Copie este link para enviar ao afiliado.

---

## ✉️ Passo 4: Enviar Credenciais e Instruções ao Afiliado
Você pode copiar o modelo abaixo para enviar ao seu novo afiliado por e-mail ou WhatsApp:

> "Olá, **[Nome do Afiliado]**! Seja muito bem-vindo(a) ao nosso programa de afiliados do **Fitswap**! 💫
>
> Já configuramos a sua parceria e você pode começar a divulgar e acompanhar seus resultados hoje mesmo.
>
> 🔗 **Seu Link de Divulgação**: 
> `https://afiliados-app.vercel.app/join/SEU_CODIGO`
> 
> 💡 *Dica: Coloque este link na bio do seu Instagram, TikTok ou divulgue nos seus Stories!*
>
> ---
>
> 📊 **Como acessar o seu Painel de Resultados**:
> Para acompanhar em tempo real quantos usuários instalaram o app pelo seu link, quantas assinaturas ativas você gerou e o seu saldo acumulado para saque:
>
> 1. Acesse: https://afiliados-app.vercel.app
> 2. No campo **ID ou código de afiliado**, digite exatamente o seu código: **`SEU_CODIGO`**
> 3. Clique em **Acessar meu painel**.
>
> Qualquer dúvida ou solicitação de suporte, nossa equipe está à disposição. Boas vendas!"
