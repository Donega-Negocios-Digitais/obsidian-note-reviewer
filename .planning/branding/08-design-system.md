# Sistema de Design
## Design System Documentation

---

## 📐 Visão Geral

O Design System do **obsreview** é baseado em princípios de clareza, eficiência e acessibilidade. Ele fornece componentes reutilizáveis, tokens de design e diretrizes para garantir consistência em todas as touchpoints.

### Pilares

1. **Clareza**: Componentes óbvios e previsíveis
2. **Eficiência**: Workflow rápido, sem fricção
3. **Acessibilidade**: Inclusivo por padrão
4. **Consistência**: Coeso em todas as plataformas

---

## 🎨 Design Tokens

### O que são Design Tokens?

Design tokens são as variáveis visuais fundamentais do sistema (cores, espaçamento, tipografia) que podem ser reutilizadas em qualquer plataforma.

### Estrutura de Tokens

```
tokens/
├── color/
│   ├── primary.json      # Marca principal
│   ├── semantic.json     # Cores semânticas
│   └── neutral.json      # Cores neutras
├── typography/
│   ├── font-families.json
│   ├── font-sizes.json
│   └── font-weights.json
├── spacing/
│   └── scale.json
├── borders/
│   ├── radius.json
│   └── width.json
├── shadows/
│   └── elevation.json
└── motion/
    ├── duration.json
    └── easing.json
```

### Tokens de Cor (JSON)

```json
{
  "color": {
    "primary": {
      "purple": {
        "50": { "value": "#F5F3FF", "type": "color" },
        "500": { "value": "#8B5CF6", "type": "color" },
        "600": { "value": "#7C3AED", "type": "color" },
        "700": { "value": "#6D28D9", "type": "color" }
      }
    },
    "semantic": {
      "success": { "value": "#10B981", "type": "color" },
      "warning": { "value": "#F59E0B", "type": "color" },
      "error": { "value": "#EF4444", "type": "color" },
      "info": { "value": "#3B82F6", "type": "color" }
    }
  }
}
```

### Tokens de Tipografia

```json
{
  "font": {
    "family": {
      "sans": { "value": "'Inter', sans-serif", "type": "fontFamily" },
      "mono": { "value": "'JetBrains Mono', monospace", "type": "fontFamily" }
    },
    "size": {
      "xs": { "value": "12px", "type": "fontSize" },
      "sm": { "value": "14px", "type": "fontSize" },
      "base": { "value": "16px", "type": "fontSize" },
      "lg": { "value": "18px", "type": "fontSize" },
      "xl": { "value": "20px", "type": "fontSize" },
      "2xl": { "value": "24px", "type": "fontSize" },
      "3xl": { "value": "30px", "type": "fontSize" },
      "4xl": { "value": "36px", "type": "fontSize" }
    },
    "weight": {
      "regular": { "value": "400", "type": "fontWeight" },
      "medium": { "value": "500", "type": "fontWeight" },
      "semibold": { "value": "600", "type": "fontWeight" },
      "bold": { "value": "700", "type": "fontWeight" }
    }
  }
}
```

### Tokens de Espaçamento

```json
{
  "spacing": {
    "0": { "value": "0", "type": "dimension" },
    "1": { "value": "4px", "type": "dimension" },
    "2": { "value": "8px", "type": "dimension" },
    "3": { "value": "12px", "type": "dimension" },
    "4": { "value": "16px", "type": "dimension" },
    "5": { "value": "20px", "type": "dimension" },
    "6": { "value": "24px", "type": "dimension" },
    "8": { "value": "32px", "type": "dimension" },
    "10": { "value": "40px", "type": "dimension" },
    "12": { "value": "48px", "type": "dimension" },
    "16": { "value": "64px", "type": "dimension" }
  }
}
```

### Tokens de Bordas

```json
{
  "border": {
    "radius": {
      "none": { "value": "0", "type": "borderRadius" },
      "sm": { "value": "4px", "type": "borderRadius" },
      "md": { "value": "8px", "type": "borderRadius" },
      "lg": { "value": "12px", "type": "borderRadius" },
      "xl": { "value": "16px", "type": "borderRadius" },
      "full": { "value": "9999px", "type": "borderRadius" }
    },
    "width": {
      "0": { "value": "0", "type": "borderWidth" },
      "1": { "value": "1px", "type": "borderWidth" },
      "2": { "value": "2px", "type": "borderWidth" }
    }
  }
}
```

---

## 🧩 Componentes

### Botões (Buttons)

#### Primary Button

```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
}

// Variantes
const variants = {
  primary: 'bg-purple-600 text-white hover:bg-purple-700',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
};

// Tamanhos
const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
};
```

#### Estados do Button

| Estado | Aparência |
|--------|-----------|
| **Default** | Cor primária, borda sutil |
| **Hover** | 20% mais escuro |
| **Active** | Leve scale (0.98) |
| **Focus** | Anel de foco (2px) |
| **Disabled** | Opacidade 50%, cursor not-allowed |
| **Loading** | Spinner no lugar do texto |

### Inputs

#### Text Input

```tsx
interface InputProps {
  type?: 'text' | 'email' | 'password' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

// Estados
const states = {
  default: 'border-gray-300 focus:border-purple-500 focus:ring-purple-500',
  error: 'border-red-500 focus:border-red-500 focus:ring-red-500',
  disabled: 'bg-gray-100 cursor-not-allowed',
};
```

#### Textarea

```tsx
interface TextareaProps extends InputProps {
  rows?: number;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}
```

### Cards

```tsx
interface CardProps {
  variant?: 'default' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const variants = {
  default: 'bg-white',
  bordered: 'bg-white border border-gray-200',
  elevated: 'bg-white shadow-md',
};

const paddings = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};
```

### Badges

```tsx
interface BadgeProps {
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  children: React.ReactNode;
}

const variants = {
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
  neutral: 'bg-gray-100 text-gray-800',
};
```

### Modals

```tsx
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Estrutura
<Modal open={open} onClose={onClose} title="Título">
  <Modal.Header>
    <h2>{title}</h2>
    <button onClick={onClose}><X /></button>
  </Modal.Header>
  <Modal.Body>
    {children}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={onClose}>
      Cancelar
    </Button>
    <Button variant="primary" onClick={onConfirm}>
      Confirmar
    </Button>
  </Modal.Footer>
</Modal>
```

### Toasts/Notifications

```tsx
interface ToastProps {
  variant?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose?: () => void;
}

// Variantes visuais
const variants = {
  success: { icon: Check, color: 'green' },
  error: { icon: AlertCircle, color: 'red' },
  warning: { icon: AlertTriangle, color: 'yellow' },
  info: { icon: Info, color: 'blue' },
};
```

---

## 📋 Padrões de UI

### Listas de Itens

```tsx
interface ListItemProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  onClick?: () => void;
}

// Renderização
<div className="list-item">
  <div className="list-item-icon">{icon}</div>
  <div className="list-item-content">
    <div className="list-item-title">{title}</div>
    {description && (
      <div className="list-item-description">{description}</div>
    )}
  </div>
  <div className="list-item-actions">{actions}</div>
</div>
```

### Tabelas

```tsx
interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  sortable?: boolean;
  onSort?: (column: string) => void;
}

// Estrutura
<table>
  <thead>
    <tr>
      {columns.map(col => (
        <th key={col.key}>
          {col.label}
          {sortable && <SortIcon />}
        </th>
      ))}
    </tr>
  </thead>
  <tbody>
    {data.map((row, i) => (
      <tr key={i}>
        {columns.map(col => (
          <td key={col.key}>{col.render(row[col.key], row)}</td>
        ))}
      </tr>
    ))}
  </tbody>
</table>
```

### Tabs

```tsx
interface TabsProps {
  tabs: Array<{ id: string; label: string; icon?: React.ReactNode }>;
  activeTab: string;
  onChange: (tabId: string) => void;
}

// Estrutura
<div className="tabs">
  <div className="tab-list">
    {tabs.map(tab => (
      <button
        key={tab.id}
        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
        onClick={() => onChange(tab.id)}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </div>
  <div className="tab-content">
    {children}
  </div>
</div>
```

---

## 🎭 Componentes Específicos (obsreview)

### Diff Viewer

Visualizador de diferenças para revisão de planos.

```tsx
interface DiffViewerProps {
  original: string;
  modified: string;
  language?: string;
  inline?: boolean;
}

// Variantes
const modes = {
  split: 'side-by-side',
  unified: 'inline unified',
};
```

### Annotation Toolbar

Barra de ferramentas para anotações visuais.

```tsx
interface AnnotationToolbarProps {
  onApprove?: () => void;
  onReject?: () => void;
  onComment?: () => void;
  onInsert?: () => void;
  onReplace?: () => void;
}

// Botões
const actions = [
  { icon: Check, label: 'Aprovar', variant: 'success' },
  { icon: X, label: 'Rejeitar', variant: 'danger' },
  { icon: MessageSquare, label: 'Comentar', variant: 'neutral' },
  { icon: Plus, label: 'Inserir', variant: 'primary' },
  { icon: Replace, label: 'Substituir', variant: 'primary' },
];
```

### Markdown Preview

Preview renderizado de Markdown.

```tsx
interface MarkdownPreviewProps {
  content: string;
  theme?: 'light' | 'dark';
  sanitize?: boolean;
}

// Suporte
const features = [
  'Headings (h1-h6)',
  'Bold, italic, strikethrough',
  'Lists (ordered, unordered)',
  'Code blocks com syntax highlighting',
  'Tables',
  'Callouts',
  'Mermaid diagrams',
  'Links e imagens',
  'Blockquotes',
];
```

---

## 🧪 Testes de Componentes

### Testes Visuais (Storybook)

```tsx
// stories/Button.stories.tsx
export default {
  title: 'Components/Button',
  component: Button,
};

export const Primary = () => <Button variant="primary">Primary</Button>;
export const Secondary = () => <Button variant="secondary">Secondary</Button>;
export const Disabled = () => <Button disabled>Disabled</Button>;
export const Loading = () => <Button loading>Loading</Button>;
```

### Testes Acessibilidade

```tsx
import { axe } from 'jest-axe';

describe('Button', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## 📦 Distribuição

### npm Package

```bash
# Publicar no npm
npm publish

# Usar em projetos
npm install @obsreview/design-system
```

### CDN

```html
<!-- CSS -->
<link rel="stylesheet" href="https://cdn.obsreview.app/design-system.css">

<!-- JS -->
<script src="https://cdn.obsreview.app/design-system.js"></script>
```

### Figma

Design tokens e componentes disponíveis em:
```
https://figma.com/file/obsreview-design-system
```

---

## 🔄 Versionamento

**Versão Atual**: 1.0.0

**Changelog**:
- 1.0.0 (2026-02-08): Lançamento inicial

**Próximas versões**:
- 1.1.0: Dark mode tokens
- 1.2.0: Animation tokens
- 2.0.0: Component library (React)

---

**Última atualização**: 2026-02-08
**Responsável**: Design System Team
