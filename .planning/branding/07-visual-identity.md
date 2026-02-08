# Identidade Visual
## Visual Identity Guidelines

---

## 📐 Logotipo

### Versão Primária

O logotipo do **obsreview** combina elementos visuais que representam:

- **Obsidian**: O cristal roxo/escuro (referência ao jogo)
- **Revisão**: Símbolo de checkmark/olho
- **Preview**: Símbolo de visualização

#### Construção do Logo

```
┌─────────────────────────────────────────┐
│                                         │
│         ┌─────────┐                    │
│         │  ⬡ ⬢   │   Icone + Texto     │
│         │   ✓     │   (Horizontal)      │
│         └─────────┘                    │
│                                         │
│         obsreview                       │
│         ────────                        │
│                                         │
└─────────────────────────────────────────┘

Especificações Técnicas:
- Formato: SVG (vetorial)
- Altura mínima: 24px
- Espaçamento: 1x altura do logo (clear space)
```

### Variações

| Variação | Uso | Formato |
|----------|-----|---------|
| **Logo horizontal (cor)** | Aplicações principais | SVG, PNG |
| **Logo horizontal (mono)** | Impresso P&B, gravata | SVG, PNG |
| **Icone only** | Avatar, favicon, app icon | SVG, PNG |
| **Logomarca only** | Contextos restritos | SVG, PNG |

### Cores do Logo

| Parte | Cor | HEX | RGB | Uso |
|------|-----|-----|-----|-----|
| **Icone principal** | Obsidian Purple | `#7C3AED` | `rgb(124, 58, 237)` | Fill |
| **Icone secundário** | Review Green | `#10B981` | `rgb(16, 185, 129)` | Acento |
| **Texto principal** | Dark Gray | `#1F2937` | `rgb(31, 41, 55)` | Fill |
| **Texto claro** | Light Gray | `#F9FAFB` | `rgb(249, 250, 251)` | Dark mode |

### Tamanhos Mínimos

| Aplicação | Tamanho Mínimo |
|-----------|----------------|
| Digital | 120px largura |
| Impresso | 25mm largura |
| Favicon | 32x32px |
| App Icon | 512x512px |

### Clear Space (Espaçamento Mínimo)

```
┌───────────────────────────────────┐
│                                   │
│    ↕                              │
│  ←  obsreview  →                 │
│    ↕                              │
│                                   │
│  X = altura da letra "o"          │
│  Clear space = 2X em todas as    │
│  direções                         │
└───────────────────────────────────┘
```

---

## 🎨 Paleta de Cores

### Cores Primárias

#### Brand Purple (Referência ao Obsidian)

| Nome | HEX | RGB | HSL | Uso |
|------|-----|-----|-----|-----|
| **Purple 600** | `#7C3AED` | `rgb(124, 58, 237)` | `hsl(263, 81%, 58%)` | Marca principal |
| **Purple 700** | `#6D28D9` | `rgb(109, 40, 217)` | `hsl(263, 71%, 50%)` | Hover, dark |
| **Purple 500** | `#8B5CF6` | `rgb(139, 92, 246)` | `hsl(263, 90%, 67%)` | Light, gradient |
| **Purple 50** | `#F5F3FF` | `rgb(245, 243, 255)` | `hsl(263, 100%, 98%)` | Background |

#### Review Green (Ação de aprovação)

| Nome | HEX | RGB | HSL | Uso |
|------|-----|-----|-----|-----|
| **Green 600** | `#10B981` | `rgb(16, 185, 129)` | `hsl(160, 84%, 39%)` | Aprovação, sucesso |
| **Green 700** | `#059669` | `rgb(5, 150, 105)` | `hsl(160, 93%, 30%)` | Hover |
| **Green 50** | `#ECFDF5` | `rgb(236, 253, 245)` | `hsl(160, 73%, 96%)` | Background |

### Cores Semânticas

| Estado | HEX | RGB | Uso |
|--------|-----|-----|-----|
| **Success** | `#10B981` | `rgb(16, 185, 129)` | Aprovação, concluído |
| **Warning** | `#F59E0B` | `rgb(245, 158, 11)` | Atenção, pendente |
| **Error** | `#EF4444` | `rgb(239, 68, 68)` | Erro, rejeição |
| **Info** | `#3B82F6` | `rgb(59, 130, 246)` | Informação |

### Cores Neutras

| Nome | HEX | RGB | Uso |
|------|-----|-----|-----|
| **Gray 900** | `#111827` | Texto principal (dark) |
| **Gray 700** | `#374151` | Texto secundário |
| **Gray 500** | `#6B7280` | Texto terciário, borders |
| **Gray 300** | `#D1D5DB` | Dividers, disabled |
| **Gray 100** | `#F3F4F6` | Background claro |
| **Gray 50** | `#F9FAFB` | Background principal |
| **White** | `#FFFFFF` | Background branco |

### Dark Mode

| Nome | HEX | RGB | Uso |
|------|-----|-----|-----|
| **Dark 900** | `#0F172A` | Background principal |
| **Dark 800** | `#1E293B` | Background secundário |
| **Dark 700** | `#334155` | Borders, dividers |
| **Dark 100** | `#F1F5F9` | Texto principal |

### Tokens CSS

```css
:root {
  /* Brand Colors */
  --color-purple-600: #7C3AED;
  --color-purple-700: #6D28D9;
  --color-purple-500: #8B5CF6;
  --color-purple-50: #F5F3FF;

  /* Semantic Colors */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;

  /* Neutral Colors */
  --color-gray-900: #111827;
  --color-gray-700: #374151;
  --color-gray-500: #6B7280;
  --color-gray-300: #D1D5DB;
  --color-gray-100: #F3F4F6;
  --color-gray-50: #F9FAFB;

  /* Dark Mode */
  --color-dark-900: #0F172A;
  --color-dark-800: #1E293B;
  --color-dark-700: #334155;
}

[data-theme="dark"] {
  --color-bg-primary: var(--color-dark-900);
  --color-bg-secondary: var(--color-dark-800);
  --color-text-primary: var(--color-dark-100);
  --color-border: var(--color-dark-700);
}
```

---

## 🔤 Tipografia

### Fontes Primárias

#### UI Text
**Fonte**: Inter (Google Fonts)

| Uso | Peso | Tamanho | Line-height |
|-----|------|---------|-------------|
| **H1** | 700 (Bold) | 36px | 1.2 |
| **H2** | 600 (Semi) | 30px | 1.3 |
| **H3** | 600 (Semi) | 24px | 1.4 |
| **H4** | 600 (Semi) | 20px | 1.5 |
| **Body** | 400 (Regular) | 16px | 1.6 |
| **Small** | 400 (Regular) | 14px | 1.5 |
| **Caption** | 400 (Regular) | 12px | 1.4 |

#### Code/Monospace
**Fonte**: JetBrains Mono (Google Fonts)

| Uso | Tamanho | Line-height |
|-----|---------|-------------|
| **Code inline** | 14px | 1.4 |
| **Code block** | 14px | 1.6 |
| **Terminal** | 13px | 1.5 |

### Hierarquia Tipográfica

```markdown
# Heading 1 - Título Principal
Use: Títulos de página, h1

## Heading 2 - Seções Principais
Use: Divisões principais de conteúdo

### Heading 3 - Subseções
Use: Subdivisões de conteúdo

#### Heading 4 - Títulos Menores
Use: Subtítulos dentro de seções

Body text - Texto de corpo com **negrito** e *itálico*
Use: Conteúdo principal, parágrafos

[Small text](link)
Use: Meta informações, notas de rodapé

CAPTION
Use: Legendas, timestamps, labels pequenos
```

### Importação de Fontes

```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

```css
/* CSS */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
```

---

## 🎯 Ícones

### Sistema de Ícones

**Fonte de Ícones**: [Lucide Icons](https://lucide.dev/) (recomendado)

Alternativas:
- [Heroicons](https://heroicons.com/)
- [Phosphor Icons](https://phosphoricons.com/)

### Ícones Principais

| Ícone | Nome | Uso |
|-------|------|-----|
| ✓ | `check` | Aprovar, confirmar |
| ✗ | `x` | Rejeitar, deletar |
| 👁 | `eye` | Visualizar, preview |
| ✏ | `edit` | Editar, modificar |
| 💾 | `save` | Salvar |
| ↗ | `arrow-up-right` | Link externo |
| ⚙ | `settings` | Configurações |
| ⬡ | `hexagon` | Obsidian (marca) |

### Uso de Ícones

```javascript
// React / Vue
import { Check, X, Eye, Edit, Save } from 'lucide-react';

// Tamanhos
<Check size={16} />  // small
<Check size={24} />  // medium (default)
<Check size={32} />  // large

// Cores
<Check className="text-green-600" />
<X className="text-red-600" />
```

---

## 📐 Layout e Grid

### Sistema de Grid

**Framework recomendado**: Tailwind CSS

```
┌─────────────────────────────────────────────┐
│  Container: max-width 1280px, centered     │
│  ┌─────────┬─────────┬─────────┬─────────┐ │
│  │  12 col │  12 col │  12 col │  12 col │ │
│  │   grid  │   grid  │   grid  │   grid  │ │
│  └─────────┴─────────┴─────────┴─────────┘ │
│                                             │
│  Gap: 1rem (16px)                           │
│  Padding: 1.5rem (24px)                     │
└─────────────────────────────────────────────┘
```

### Espaçamento (Spacing Scale)

| Token | Valor | Uso |
|-------|-------|-----|
| `space-1` | 4px | Micro espaçamento |
| `space-2` | 8px | Small gaps |
| `space-3` | 12px | Compact spacing |
| `space-4` | 16px | Default spacing |
| `space-6` | 24px | Comfortable spacing |
| `space-8` | 32px | Section spacing |
| `space-12` | 48px | Large sections |

---

## 🌗 Dark Mode

### Princípios

1. **Padrão, não opcional**: Dark mode é primeira classe
2. **Respeitar preferências do sistema**: `prefers-color-scheme`
3. **Contraste adequado**: Mínimo WCAG AA (4.5:1)
4. **Cores ajustadas**: Não apenas invertidas

### Implementação

```javascript
// Detectar preferência
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

// Aplicar tema
document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');

// Alternar
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}
```

---

## 📱 Responsividade

### Breakpoints

| Nome | Largura | Dispositivos |
|------|---------|--------------|
| **sm** | 640px | Mobile grande |
| **md** | 768px | Tablet |
| **lg** | 1024px | Desktop pequeno |
| **xl** | 1280px | Desktop padrão |
| **2xl** | 1536px | Desktop grande |

### Mobile-First

```css
/* Base: Mobile (320px+) */
.component { padding: 1rem; }

/* sm: 640px+ */
@media (min-width: 640px) {
  .component { padding: 1.5rem; }
}

/* md: 768px+ */
@media (min-width: 768px) {
  .component { padding: 2rem; }
}
```

---

## 🎬 Animações

### Princípios

1. **Propósito**: Animações devem ter função, não apenas decorativa
2. **Sutileza**: Preferir transições suaves
3. **Performance**: Usar transform e opacity (GPU-accelerated)

### Timing Functions

```css
/* Padrão */
--ease-default: cubic-bezier(0.4, 0, 0.2, 1);

/* Entrada */
--ease-in: cubic-bezier(0.4, 0, 1, 1);

/* Saída */
--ease-out: cubic-bezier(0, 0, 0.2, 1);

/* Suave */
--ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);
```

### Durações

| Tipo | Duração |
|------|---------|
| **Fast** | 150ms |
| **Default** | 250ms |
| **Slow** | 350ms |

---

## ♿ Acessibilidade

### WCAG 2.1 AA (Mínimo)

| Requisito | Padrão |
|-----------|--------|
| **Contraste texto** | 4.5:1 |
| **Contraste UI** | 3:1 |
| **Tamanho foco** | 2px |
| **Texto zoom** | 200% |

### Labels Semânticos

```html
<!-- Bom -->
<button aria-label="Aprovar alterações">
  <Check />
</button>

<!-- Ruim -->
<button>
  <Check />
</button>
```

---

**Última atualização**: 2026-02-08
**Próxima revisão**: 2026-03-08
