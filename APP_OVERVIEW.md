# Food NutriVerse - Visão Geral do Aplicativo

## 📱 O que é o Food NutriVerse?

O **Food NutriVerse** é um aplicativo móvel inovador que utiliza Inteligência Artificial para transformar a jornada de alimentação saudável dos usuários. Diferente de apps de receitas tradicionais, ele atua como um "Nutricionista e Chef de Bolso", criando receitas personalizadas com base no que o usuário tem em casa (despensa) ou transformando desejos "gordos" em versões fitness.

## 🚀 Funcionalidades Principais

### 1. IA Chef & "Fitzar" Receita
*   **Transformação Mágica:** O usuário digita o nome de um prato calórico (ex: "Pizza", "Lasanha") e a IA gera uma versão saudável, ajustada aos objetivos nutricionais do usuário.
*   **Scanner de Despensa:** Utiliza a câmera para identificar ingredientes reais ou permite entrada manual. A IA então cria uma receita exclusiva utilizando apenas esses itens.

### 2. Planejamento Semanal Inteligente
*   **Geração Automática:** Cria um plano de refeições completo para a semana (café, almoço, jantar, lanches) com um clique, respeitando restrições alimentares e objetivos (perda de peso, ganho de massa).
*   **Flexibilidade:** Permite regenerar refeições específicas ou editar o plano.

### 3. Lista de Compras Automática
*   Gera uma lista de compras organizada por categorias (Hortifruti, Carnes, etc.) baseada inteiramente no plano semanal gerado.

### 4. Perfil Personalizado
*   Armazena dados biométricos, objetivos (Emagrecer, Hipertrofia, Saúde), restrições alimentares (Vegano, Sem Glúten, etc.) e alimentos que o usuário não gosta.

## 🗺️ Estrutura do App (Telas)

### 1. Fluxo Inicial
*   **Onboarding:** Apresentação das funcionalidades e coleta inicial de dados do usuário.
*   **Autenticação:** Telas de Login e Cadastro (Email/Senha) integradas ao Firebase Auth.

### 2. Navegação Principal (Abas)

#### 🏠 Início (Home)
*   **Dashboard:** Saudação personalizada e data.
*   **Dica do Dia:** Card com dicas nutricionais rápidas.
*   **Categorias:** Filtros rápidos (Café da manhã, Low Carb, Vegano, etc.).
*   **Feed:** Lista de receitas geradas e sugestões populares.

#### 🔍 Explorar
*   **Modo Desejo:** Campo de texto para "fitzar" receitas.
*   **Modo Despensa:** Interface para tirar foto dos ingredientes ou adicionar manualmente. Botão para gerar receita com os itens listados.

#### 📚 Biblioteca
*   **Receitas Salvas:** Coleção de todas as receitas favoritas do usuário.
*   **Histórico:** Acesso rápido às receitas geradas pela IA.

#### 📅 Agenda (Planning)
*   **Visualização Semanal:** Navegação entre os dias da semana.
*   **Refeições do Dia:** Lista cronológica (Café, Almoço, Jantar) com detalhes macro (calorias, tempo).
*   **Ações:** Botões para regenerar uma refeição específica ou copiar uma refeição para outro dia.
*   **Lista de Compras:** Acesso rápido à lista gerada.

#### 👤 Perfil
*   **Dados do Usuário:** Foto, nome e objetivo atual.
*   **Estatísticas:** Resumo de restrições e preferências.
*   **Suporte & Legal:** Links para Fale Conosco, Termos de Uso e Política de Privacidade (Hospedados no GitHub Pages).
*   **Gestão de Conta:** Opções para Editar Perfil, Sair (Logout) e Excluir Conta.

## 🛠️ Tecnologias Utilizadas

*   **Frontend:** React Native (Expo) com TypeScript.
*   **Estilização:** Estilo próprio via StyleSheet (sem frameworks pesados de UI).
*   **Backend/Serviços:**
    *   **Firebase Auth:** Gerenciamento de usuários.
    *   **Firebase Firestore:** Banco de dados para perfis e planos.
    *   **Google Gemini AI:** Motor de inteligência para geração de receitas e reconhecimento de imagem.
