# Conceitos Básicos de Desenvolvimento Fullstack

## Aula 1: O Que Você Precisa Saber Antes de Tudo

Antes de mergulhar no código, vamos entender os conceitos fundamentais. Vou explicar tudo como se você nunca tivesse visto nada disso!

---

## 1. Frontend vs Backend

Imagine um restaurante:

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   RESTAURANTE = APLICAÇÃO WEB                                  │
│                                                                │
│   ┌─────────────────────┐    ┌─────────────────────┐          │
│   │     SALÃO           │    │      COZINHA        │          │
│   │   (FRONTEND)        │    │     (BACKEND)       │          │
│   │                     │    │                     │          │
│   │ - O que o cliente   │    │ - Onde a comida é   │          │
│   │   vê                │    │   preparada         │          │
│   │ - O cardápio        │    │ - Receitas secretas │          │
│   │ - A decoração       │    │ - Ingredientes      │          │
│   │ - O garçom          │    │ - Logística         │          │
│   └─────────────────────┘    └─────────────────────┘          │
│                                                                │
│   O GARÇOM = API (leva pedidos e traz comida)                 │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### No Plannotator:

| Parte | O Que É | Exemplo no Projeto |
|-------|---------|-------------------|
| **Frontend** | O que você vê e clica | React, Tailwind, componentes visuais |
| **Backend** | O que processa dados | Supabase, APIs, servidores |
| **API** | Como eles conversam | Endpoints em `/api/` |

---

## 2. O Que é React?

**React** é uma biblioteca JavaScript para criar interfaces de usuário.

### Conceito Chave: Componentes

Pense em LEGO! Cada peça de LEGO é um **componente**. Você junta várias peças para criar algo maior.

```
┌─────────────────────────────────────────────────────────────┐
│                    PÁGINA DO PLANNOTATOR                     │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  COMPONENTE: Header (Cabeçalho)                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ┌──────────────────────┐  ┌──────────────────────────┐   │
│  │                      │  │                          │   │
│  │  COMPONENTE:         │  │  COMPONENTE:             │   │
│  │  Viewer              │  │  AnnotationPanel         │   │
│  │  (Visualizador)      │  │  (Painel de Anotações)   │   │
│  │                      │  │                          │   │
│  │  Mostra o documento  │  │  Lista as anotações      │   │
│  │                      │  │                          │   │
│  └──────────────────────┘  └──────────────────────────┘   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  COMPONENTE: DecisionBar (Barra de Decisão)         │   │
│  │  [Aprovar] [Rejeitar] [Pedir Mudanças]              │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Exemplo Real do Projeto

O arquivo `packages/ui/components/AnnotationPanel.tsx` é um componente React:

```tsx
// Isso é um COMPONENTE React
function AnnotationPanel({ annotations, onDelete }) {
  return (
    <div className="panel">
      {annotations.map(annotation => (
        <AnnotationCard key={annotation.id} data={annotation} />
      ))}
    </div>
  );
}
```

**Traduzindo:**
- `function AnnotationPanel` = Estou criando um componente chamado "AnnotationPanel"
- `{ annotations, onDelete }` = Ele recebe dados (props) de fora
- `return (...)` = Retorna o que deve aparecer na tela
- `annotations.map(...)` = Para cada anotação, mostra um card

---

## 3. O Que é TypeScript?

**TypeScript** = JavaScript + Tipos

### Por Que Tipos São Importantes?

```javascript
// JavaScript normal - PODE DAR PROBLEMA
function soma(a, b) {
  return a + b;
}

soma(5, 3);      // Retorna 8 ✓
soma("5", 3);    // Retorna "53" 😱 (concatenou strings!)
```

```typescript
// TypeScript - MAIS SEGURO
function soma(a: number, b: number): number {
  return a + b;
}

soma(5, 3);      // Retorna 8 ✓
soma("5", 3);    // ERRO! TypeScript avisa que "5" não é número
```

### No Plannotator:

Olha o arquivo `packages/ui/types.ts`:

```typescript
// Define exatamente o que uma Anotação deve ter
interface Annotation {
  id: string;           // Identificador único (texto)
  blockId: string;      // ID do bloco onde está
  type: AnnotationType; // Tipo: DELETION, INSERTION, etc
  text?: string;        // Texto (opcional - o ? indica isso)
  originalText: string; // Texto original
  createdAt: number;    // Data de criação (número timestamp)
  author?: string;      // Autor (opcional)
}
```

**Por que isso é bom?**
- Se você tentar criar uma anotação sem `id`, o TypeScript avisa
- Você sabe exatamente o que cada dado deve conter
- Menos bugs em produção!

---

## 4. O Que é CSS / Tailwind CSS?

**CSS** = Como as coisas ficam bonitas (cores, tamanhos, posições)

**Tailwind CSS** = CSS com "atalhos" (classes utilitárias)

### Comparação:

```css
/* CSS TRADICIONAL */
.botao-azul {
  background-color: blue;
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
}
```

```html
<!-- TAILWIND CSS -->
<button class="bg-blue-500 text-white px-4 py-2 rounded">
  Clique aqui
</button>
```

### Tradução das Classes Tailwind:

| Classe | Significado |
|--------|-------------|
| `bg-blue-500` | Background azul (intensidade 500) |
| `text-white` | Texto branco |
| `px-4` | Padding horizontal de 1rem |
| `py-2` | Padding vertical de 0.5rem |
| `rounded` | Bordas arredondadas |
| `flex` | Display flexbox |
| `items-center` | Alinhar itens ao centro |
| `hover:bg-blue-600` | No hover, fundo azul mais escuro |

### Exemplo Real do Projeto:

```tsx
// De packages/ui/components/DecisionBar.tsx
<button
  className="px-4 py-2 bg-green-600 text-white rounded-lg
             hover:bg-green-700 transition-colors"
>
  Aprovar
</button>
```

---

## 5. O Que é uma API?

**API** = Application Programming Interface (Interface de Programação)

É o "garçom" que leva pedidos e traz respostas entre frontend e backend.

### Como Funciona:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  FRONTEND                          BACKEND                  │
│  (Navegador)                       (Servidor)               │
│                                                             │
│  ┌─────────┐   "Quero o plano"    ┌─────────┐              │
│  │         │ ────────────────────→ │         │              │
│  │  React  │   GET /api/plan       │  API    │              │
│  │   App   │                       │ Server  │              │
│  │         │ ←──────────────────── │         │              │
│  └─────────┘   { conteúdo... }     └─────────┘              │
│                                                             │
│  REQUISIÇÃO (Request)    RESPOSTA (Response)                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tipos de Requisições (Métodos HTTP):

| Método | Para Que Serve | Exemplo no Plannotator |
|--------|---------------|------------------------|
| **GET** | Buscar dados | `GET /api/plan` - Buscar um plano |
| **POST** | Criar/enviar dados | `POST /api/save` - Salvar nota |
| **PUT** | Atualizar dados | Atualizar uma anotação |
| **DELETE** | Deletar dados | Deletar uma anotação |

### Exemplo Real do Projeto:

```typescript
// No Hook app, quando você clica em "Aprovar":

// 1. Frontend faz a requisição
const response = await fetch('/api/approve', {
  method: 'POST',
  body: JSON.stringify({ planId: '123', approved: true })
});

// 2. Backend processa e responde
// O servidor em apps/hook/server/ recebe e processa

// 3. Frontend recebe a resposta
const result = await response.json();
// { success: true, message: "Plano aprovado!" }
```

---

## 6. O Que é JSON?

**JSON** = JavaScript Object Notation

É o "idioma" que frontend e backend usam para conversar.

### Exemplo:

```json
{
  "id": "anotacao-123",
  "type": "COMMENT",
  "text": "Isso precisa ser revisado",
  "author": "Alex",
  "createdAt": 1704067200000
}
```

**Regras do JSON:**
- Chaves sempre entre aspas duplas: `"nome"`
- Strings entre aspas duplas: `"valor"`
- Números sem aspas: `123`
- Booleanos: `true` ou `false`
- Arrays com colchetes: `[1, 2, 3]`
- Objetos com chaves: `{ "a": 1 }`

---

## 7. O Que é State (Estado)?

**Estado** = Dados que podem mudar durante o uso da aplicação.

### Exemplo Visual:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  ESTADO DA APLICAÇÃO:                                       │
│                                                             │
│  {                                                          │
│    annotations: [lista de anotações],  ← Muda quando você   │
│    currentMode: "reviewer",             ← anota algo        │
│    isLoading: false,                                        │
│    selectedAnnotation: null                                 │
│  }                                                          │
│                                                             │
│  QUANDO O ESTADO MUDA → A TELA ATUALIZA AUTOMATICAMENTE    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### No Plannotator (usando Zustand):

```typescript
// packages/ui/store/useAnnotationStore.ts

const useAnnotationStore = create((set) => ({
  // ESTADO INICIAL
  annotations: [],

  // AÇÃO: adicionar anotação
  addAnnotation: (annotation) => set((state) => ({
    annotations: [...state.annotations, annotation]
  })),

  // AÇÃO: remover anotação
  removeAnnotation: (id) => set((state) => ({
    annotations: state.annotations.filter(a => a.id !== id)
  }))
}));
```

**Traduzindo:**
- `create(...)` = Cria uma "loja" de estado
- `annotations: []` = Começa com lista vazia
- `addAnnotation` = Função para adicionar
- `set(...)` = Atualiza o estado
- Quando o estado muda, todos os componentes que usam esse estado atualizam!

---

## 8. O Que é Build/Compilação?

Seu código precisa ser **transformado** antes de ir para produção.

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  CÓDIGO FONTE                      CÓDIGO DE PRODUÇÃO       │
│  (O que você escreve)              (O que vai pro servidor) │
│                                                             │
│  ├── App.tsx                       ├── index.html           │
│  ├── styles.css          BUILD     ├── main.js (minificado) │
│  ├── utils.ts           ──────→    └── styles.css (otimiz.) │
│  └── components/                                            │
│                                                             │
│  - TypeScript → JavaScript                                  │
│  - JSX → JavaScript puro                                    │
│  - Vários arquivos → Poucos arquivos                        │
│  - Código legível → Código minificado                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Comandos no Plannotator:

```bash
# Desenvolvimento (código fonte, hot reload)
bun run dev:hook

# Produção (código otimizado)
bun run build:hook
```

---

## 9. O Que são Dependências?

**Dependências** = Código que outras pessoas escreveram e você usa.

### package.json:

```json
{
  "dependencies": {
    "react": "^19.2.3",           // Facebook criou
    "tailwindcss": "^4.1.18",     // Tailwind Labs criou
    "zustand": "^5.0.9"           // Comunidade criou
  }
}
```

**Por que usar?**
- Não reinventar a roda
- Código testado por milhares de pessoas
- Atualizações de segurança
- Economia de tempo

---

## 10. Resumo: Glossário Rápido

| Termo | Significado Simples |
|-------|---------------------|
| **Frontend** | Parte visual que o usuário vê |
| **Backend** | Parte que processa dados no servidor |
| **API** | Como frontend e backend conversam |
| **React** | Biblioteca para criar interfaces |
| **TypeScript** | JavaScript com tipos (mais seguro) |
| **Componente** | Peça de LEGO reutilizável |
| **Estado** | Dados que mudam durante o uso |
| **Props** | Dados passados de pai para filho |
| **JSON** | Formato de dados para comunicação |
| **Build** | Processo de preparar código para produção |
| **Dependência** | Código externo que você usa |

---

## Exercício Mental

Olhe para o Plannotator e identifique:

1. **Frontend**: As telas que você vê (editor, painel de anotações)
2. **Backend**: Supabase guardando dados
3. **Componentes**: Cada "pedaço" da interface
4. **Estado**: Lista de anotações, modo atual, usuário logado
5. **API**: `/api/save`, `/api/approve`, etc.

---

## Próximo Passo

Agora que você entende os conceitos, vamos ver como eles se aplicam na **estrutura real do projeto**.

➡️ Continue em: `02-ESTRUTURA-MONOREPO.md`

---

*"A melhor forma de aprender é entender o PORQUÊ antes do COMO"*
