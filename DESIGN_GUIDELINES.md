# Fitswap - Diretrizes de Design e Branding

## 🎨 Identidade Visual

O **Fitswap** adota uma estética **moderna, energética e limpa**. A marca combina a vibração do "fitness" com a tecnologia da IA. O design é minimalista, utilizando muito espaço em branco (white space) para dar destaque às imagens dos alimentos e à cor de destaque vibrante.

### Paleta de Cores

| Nome | Cor Hex | Uso |
| :--- | :--- | :--- |
| **Neon Lime** | `#a6f000` | **Cor Primária**. Botões de ação principal (CTA), ícones ativos, destaques. Representa energia e frescor. |
| **Pure Black** | `#000000` | Botões secundários, ícones em fundos claros, contraste máximo. |
| **Dark Gray** | `#111827` | Títulos, textos principais. (Tailwind Gray-900) |
| **Medium Gray** | `#6B7280` | Subtítulos, textos de apoio, ícones inativos. (Tailwind Gray-500) |
| **Light Gray** | `#F3F4F6` | Fundos de cards, inputs, áreas secundárias. (Tailwind Gray-100) |
| **White** | `#FFFFFF` | Fundo principal do app, cards elevados. |
| **Error Red** | `#EF4444` | Mensagens de erro, botões destrutivos (Sair, Excluir). |

---

## 🔤 Tipografia

O aplicativo utiliza as fontes do sistema nativo (San Francisco no iOS, Roboto no Android) para garantir legibilidade e familiaridade, mas com pesos específicos para criar hierarquia.

*   **Títulos (Headings):** `FontWeight: 800` (ExtraBold). Usado em saudações e cabeçalhos de seção.
*   **Subtítulos:** `FontWeight: 600` ou `700` (SemiBold/Bold). Usado em nomes de receitas e categorias.
*   **Corpo (Body):** `FontWeight: 400` (Regular). Textos descritivos.
*   **Rótulos (Labels):** `FontWeight: 700` (Bold), geralmente em caixa alta (Uppercase) para pequenos badges.

---

## 🖼️ Iconografia

Utilizamos a biblioteca **Lucide React Native**.
*   **Estilo:** Linhas (Stroke), sem preenchimento (exceto quando ativo).
*   **Espessura:** Padrão (2px).
*   **Tamanho Padrão:** 24px para navegação, 20px para ações secundárias.

---

## 🧩 Componentes de UI

### Botões (Buttons)

1.  **Primário (CTA):**
    *   Fundo: `#a6f000` (Neon Lime) ou `#000000` (Black) dependendo do contexto.
    *   Texto: Contraste alto (Preto no Lime, Branco no Preto).
    *   Borda: `BorderRadius: 16` ou `20`.
    *   Sombra: Suave (`ShadowOpacity: 0.1`).

2.  **Secundário / Outline:**
    *   Fundo: Transparente ou `#F9FAFB`.
    *   Borda: 1px `#E5E7EB`.
    *   Texto: Dark Gray.

### Cards

*   **Estilo:** Clean, com bordas arredondadas (`BorderRadius: 16` a `24`).
*   **Elevação:** Sombra sutil para dar profundidade (`Elevation: 2` a `4`).
*   **Bordas:** Frequentemente usamos uma borda fina (`BorderWidth: 1`, `#F3F4F6`) para definição extra.

### Inputs

*   **Estilo:** Arredondados (`BorderRadius: 16`+), fundo branco ou cinza muito claro.
*   **Foco:** Borda ou ícone colorido para indicar atividade.

---

## 📐 Espaçamento e Layout

*   **Grid:** Baseado em múltiplos de **4px** (4, 8, 12, 16, 24, 32).
*   **Margens Padrão:** `24px` nas laterais da tela para garantir respiro.
*   **Safe Area:** O design respeita as áreas seguras (notch, home indicator) nativamente.
