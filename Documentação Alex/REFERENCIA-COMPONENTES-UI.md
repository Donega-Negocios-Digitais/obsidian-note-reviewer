# Referência de Componentes UI - Obsidian Note Reviewer

**Data:** 2026-02-08 (Atualizado)
**Objetivo:** Documentar todos os nomes dos componentes e elementos da UI para fácil referência.

---

## 📋 Índice

1. [Componentes Principais do Editor](#componentes-principais-do-editor)
2. [Componentes de Anotação](#componentes-de-anotação)
3. [Componentes de Colaboração](#componentes-de-colaboração)
4. [Componentes de Configuração](#componentes-de-configuração)
5. [Componentes de Autenticação](#componentes-de-autenticação)
6. [Componentes de Compartilhamento](#componentes-de-compartilhamento)
7. [Componentes de Utilidade](#componentes-de-utilidade)
8. [Páginas do Portal](#paginas-do-portal)
9. [Páginas de Marketing](#paginas-de-marketing)
10. [Hooks Customizados](#hooks-customizados)

---

## 🎨 Componentes Principais do Editor

### `EditorApp` ou `App.tsx`
**Localização:** `packages/editor/App.tsx`

**O que é:** O componente principal que gerencia toda a aplicação do editor.

**Elementos filhos importantes:**
- `Viewer` - Visualizador de markdown
- `AnnotationPanel` - Painel lateral de anotações
- `GlobalCommentInput` - Input para comentários globais
- `ExportModal` - Modal de exportação
- `SettingsPanel` - Painel de configurações (slide-over)
- `ModeToggle` - Botão toggle dark/light mode
- `ModeSwitcher` - Seletor de modo (edit/review)
- `DecisionBar` - Barra de decisão (aceitar/rejeitar mudanças)

---

### `Viewer`
**Localização:** `packages/ui/components/Viewer.tsx`

**O que é:** Componente que renderiza o markdown e permite seleção de texto para anotação.

**Elementos importantes:**
- `MarkdownRenderer` - Renderiza markdown para HTML
- `CodeBlock` - Renderiza blocos de código com syntax highlighting
- `DiffViewer` - Mostra diffs entre versões
- `VersionHistory` - Histórico de versões
- `AnnotationOverlay` - Camada sobreposta com marcadores de anotação
- `AnnotationMarker` - Marcador visual de anotação no texto

---

## 🖍️ Componentes de Anotação

### `Toolbar` (Toolbar Flutuante)
**Localização:** `packages/ui/components/Toolbar.tsx`

**O que é:** Toolbar flutuante que aparece quando você seleciona texto. Contém botões de anotação.

**Botões disponíveis:**
- ✏️ **Edit** - Marcar texto para edição
- 💬 **Comment** - Adicionar comentário
- ❌ **Delete** - Marcar para exclusão
- ⭐ **Highlight** - Destacar texto
- ❓ **Question** - Marcar dúvida

**Como aparece:**
```
┌─────────────────────────────────┐
│  [✏️] [💬] [❌] [⭐] [❓]        │  ← aparece acima do texto selecionado
└─────────────────────────────────┘
     texto selecionado aqui
```

---

### `AnnotationPanel` (Painel Lateral de Anotações)
**Localização:** `packages/ui/components/AnnotationPanel.tsx`

**O que é:** Painel lateral (sidebar) que lista todas as anotações do documento.

**Seções e sub-componentes:**
- `AnnotationStatistics` - Estatísticas (quantas anotações de cada tipo)
- `AnnotationStatusControls` - Controles de status das anotações
- `BulkActionsBar` - Barra de ações em lote
- `BulkSelectionBar` - Barra de seleção em lote
- `CollapsibleSection` - Seções colapsáveis por tipo
- `SortSelector` - Seletor de ordenação
- `StatusBadge` - Badge de status (open/in-progress/resolved)

---

### `AnnotationSidebar` (Sidebar Alternativa)
**Localização:** `packages/ui/components/AnnotationSidebar.tsx`

**O que é:** Sidebar alternativa para anotações (versão mais compacta).

---

### `ImageAnnotator` (Anotador de Imagem)
**Localização:** `packages/ui/components/ImageAnnotator.tsx`

**O que é:** Componente que permite desenhar sobre imagens.

**Ferramentas de desenho:**
- 🖊️ **Pen** - Caneta livre
- ↕️ **Arrow** - Seta
- ⭕ **Circle** - Círculo
- ⬜ **Rectangle** - Retângulo

**Cores disponíveis:** Vermelho, Azul, Verde, Amarelo, Preto

**Tamanhos:** Pequeno, Médio, Grande

**Controles:**
- `Undo` - Desfazer último traço
- `Clear` - Limpar todos os traços
- `Export` - Exportar imagem anotada

---

### `CommentThread` (Thread de Comentários)
**Localização:** `packages/ui/components/CommentThread.tsx`

**O que é:** Componente que mostra uma thread de comentários com respostas.

**Elementos:**
- `CommentInput` - Input para novo comentário
- `MentionsInput` - Input com suporte a @menções
- Avatar do usuário
- Timestamp
- Botões de ação (reply, edit, delete)

---

### `CommentInput` (Input de Comentário Individual)
**Localização:** `packages/ui/components/CommentInput.tsx`

**O que é:** Input para adicionar um comentário individual.

---

### `MentionsInput` (Input com Menções)
**Localização:** `packages/ui/components/MentionsInput.tsx`

**O que é:** Input com suporte a @menções de usuários.

---

### `GlobalCommentInput` (Input de Comentário Global)
**Localização:** `packages/ui/components/GlobalCommentInput.tsx`

**O que é:** Input na parte inferior para adicionar comentários gerais (não vinculados a texto específico).

---

### `AnnotationMarker` (Marcador de Anotação)
**Localização:** `packages/ui/components/AnnotationMarker.tsx`

**O que é:** Marcador visual que aparece no texto onde há anotações.

---

### `AnnotationOverlay` (Overlay de Anotações)
**Localização:** `packages/ui/components/AnnotationOverlay.tsx`

**O que é:** Camada sobreposta que renderiza os marcadores de anotação no documento.

---

### `AnnotationExport`
**Localização:** `apps/portal/src/components/AnnotationExport.tsx`

**O que é:** Componente para exportar anotações em vários formatos.

---

### `AnnotationStateIndicator`
**Localização:** `apps/portal/src/components/AnnotationStateIndicator.tsx`

**O que é:** Indicador visual do estado das anotações.

---

### `CollaborativeAnnotationPanel`
**Localização:** `apps/portal/src/components/CollaborativeAnnotationPanel.tsx`

**O que é:** Painel de anotações com suporte a múltiplos usuários.

---

## 👥 Componentes de Colaboração

### `CollaborationRoom` / `RoomProvider`
**Localização:** `apps/portal/src/components/collaboration/RoomProvider.tsx`

**O que é:** Provider do Liveblocks que gerencia a sala de colaboração em tempo real.

---

### `PresenceList` (Lista de Presença)
**Localização:** `apps/portal/src/components/collaboration/PresenceList.tsx`

**O que é:** Componente que mostra os usuários ativos no documento.

**Visual:**
```
┌──────────────────┐
│ 👤 João  👤 Maria │  ← avatares dos usuários online
└──────────────────┘
```

---

### `LiveCursors` (Cursores em Tempo Real)
**Localização:**
- `apps/portal/src/components/collaboration/LiveCursors.tsx`
- `packages/ui/components/LiveCursors.tsx` (versão alternativa)

**O que é:** Overlay que mostra os cursores dos outros usuários em tempo real.

**Elementos:**
- `Cursor` - Cursor individual com nome e cor
- Tooltip com nome do usuário
- Cor baseada no hash do nome

---

### `Cursor`
**Localização:** `apps/portal/src/components/collaboration/Cursor.tsx`

**O que é:** Componente individual que representa o cursor de um usuário remoto.

---

### `PresenceIndicator`
**Localização:** `apps/portal/src/components/PresenceIndicator.tsx`

**O que é:** Indicador de presença de usuários (versão simplificada).

---

### `ActivityFeed`
**Localização:** `packages/ui/components/ActivityFeed.tsx`

**O que é:** Feed de atividades mostrando ações recentes dos usuários.

---

## ⚙️ Componentes de Configuração

### `SettingsPanel` (Painel de Configurações)
**Localização:**
- `packages/ui/components/SettingsPanel.tsx`
- `apps/portal/src/components/SettingsPanel.tsx`

**O que é:** Painel de configurações que desliza sobre o editor (slide-over/drawer).

**Categorias de configuração:**
- `GeneralSettings` - Configurações gerais
- `AppearanceSettings` - Aparência e tema
- `AnnotationSettings` - Configurações de anotação
- `IntegrationSettings` - Integrações (Claude Code, Obsidian)
- `ShortcutsSettings` - Atalhos de teclado
- `AboutSettings` - Sobre o aplicativo

**Características:**
- Fica DENTRO do editor (não é página separada)
- Slide-over style (Apple)
- Estado persiste via cookies

---

### `Settings` (Configurações Alternativas)
**Localização:** `packages/ui/components/Settings.tsx`

**O que é:** Componente alternativo de configurações.

---

### `SettingsLayout`
**Localização:** `apps/portal/src/components/SettingsLayout.tsx`

**O que é:** Layout para páginas de configurações (usado em rotas antigas).

---

### `SettingsItem`
**Localização:** `apps/portal/src/components/SettingsItem.tsx`

**O que é:** Item individual de configuração com toggle, input, etc.

---

### `ModeToggle` (Toggle Dark/Light)
**Localização:** `packages/ui/components/ModeToggle.tsx`

**O que é:** Botão para alternar entre modo claro e escuro.

---

### `ModeSwitcher` (Seletor de Modo)
**Localização:** `packages/ui/components/ModeSwitcher.tsx`

**O que é:** Seletor para alternar entre modos (Edit/Review/Presentation).

---

### `ThemeProvider`
**Localização:**
- `packages/ui/components/ThemeProvider.tsx`
- `apps/portal/src/components/ThemeProvider.tsx`

**O que é:** Provider que gerencia o tema (dark/light/system) da aplicação.

---

### `KeyboardShortcutsModal`
**Localização:** `packages/ui/components/KeyboardShortcutsModal.tsx`

**O que é:** Modal que mostra todos os atalhos de teclado disponíveis.

---

### `AccentColorSettings`
**Localização:** `apps/portal/src/components/AccentColorSettings.tsx`

**O que é:** Componente para personalizar cores de destaque da interface.

---

### `PermissionSettings`
**Localização:** `apps/portal/src/components/PermissionSettings.tsx`

**O que é:** Componente para configurar permissões de compartilhamento.

---

### `ConfigEditor`
**Localização:** `packages/ui/components/ConfigEditor.tsx`

**O que é:** Editor para configurações avançadas.

---

## 🔐 Componentes de Autenticação

### `AuthProvider`
**Localização:** `@obsidian-note-reviewer/security/auth`

**O que é:** Provider de autenticação Supabase com email/password e OAuth.

---

### `LoginForm`
**Localização:**
- `apps/portal/src/components/auth/LoginForm.tsx`
- `packages/ui/components/LoginForm.tsx`

**O que é:** Formulário de login com email/senha e botões OAuth (GitHub, Google).

---

### `SignupForm`
**Localização:**
- `apps/portal/src/components/auth/SignupForm.tsx`
- `packages/ui/components/SignupForm.tsx`

**O que é:** Formulário de cadastro de novo usuário.

---

### `CallbackHandler`
**Localização:** `apps/portal/src/components/auth/CallbackHandler.tsx`

**O que é:** Handler para callbacks OAuth (GitHub/Google).

---

### `LogoutButton`
**Localização:** `apps/portal/src/components/auth/LogoutButton.tsx`

**O que é:** Botão para fazer logout.

---

### `UserMenu`
**Localização:** `apps/portal/src/components/auth/UserMenu.tsx`

**O que é:** Menu dropdown do usuário com avatar e opções de perfil.

---

### `ProfileForm`
**Localização:** `apps/portal/src/components/auth/ProfileForm.tsx`

**O que é:** Formulário para editar perfil (nome, avatar).

---

### `AuthLayout`
**Localização:** `apps/portal/src/components/auth/AuthLayout.tsx`

**O que é:** Layout para páginas de autenticação (login, signup).

---

### `ProtectedRoute`
**Localização:**
- `apps/portal/src/components/ProtectedRoute.tsx`
- `packages/ui/components/ProtectedRoute.tsx`

**O que é:** Rota protegida que exige autenticação para acessar.

---

## 📤 Componentes de Compartilhamento

### `ShareButton` (Botão de Compartilhar)
**Localização:** `apps/portal/src/components/ShareButton.tsx`

**O que é:** Botão na toolbar para compartilhar o documento.

**Visual:**
```
┌──────────────────┐
│   🔗 Share       │  ← botão na toolbar do editor
└──────────────────┘
```

---

### `ShareDialog` (Dialog de Compartilhamento)
**Localização:** `apps/portal/src/components/ShareDialog.tsx`

**O que é:** Dialog/modal com opções de compartilhamento.

**Elementos:**
- `SlugInput` - Input para slug personalizado
- Preview do link completo
- Botões de copiar link
- Opções de permissão

---

### `SlugInput`
**Localização:** `apps/portal/src/components/SlugInput.tsx`

**O que é:** Input para criar slug personalizado para link compartilhável.

**Validações:**
- Formato URL-safe (letras, números, hífens)
- Validação de unicidade
- Preview do link completo

---

### `GuestBanner`
**Localização:** `apps/portal/src/components/GuestBanner.tsx`

**O que é:** Banner mostrado para usuários não-autenticados (guests).

---

### `useSharing` (Hook de Compartilhamento)
**Localização:** `packages/ui/hooks/useSharing.ts`

**O que é:** Hook customizado para gerenciar compartilhamento de documentos.

---

## 🛠️ Componentes de Utilidade

### `DocumentWorkspace` (Espaço de Trabalho)
**Localização:** `apps/portal/src/components/DocumentWorkspace.tsx`

**O que é:** Container principal do workspace com abas e conteúdo.

**Elementos:**
- `DocumentTabs` - Abas dos documentos abertos
- `DocumentTabsCompact` - Versão compacta das abas
- `CrossReferencePanel` - Painel de referências cruzadas
- `ReferenceCountBadge` - Badge com contador de referências
- `BreakpointPreview` - Preview de breakpoints responsivos

---

### `DocumentTabs` / `DocumentTabsCompact` (Abas de Documento)
**Localização:** `apps/portal/src/components/DocumentTabs.tsx`

**O que é:** Componente de abas para múltiplos documentos abertos.

**Features:**
- Drag & drop para reordenar
- Botão de fechar em cada aba
- Atalhos (Ctrl+W, Ctrl+Tab)
- Indicador de modificação

---

### `CrossReferencePanel` (Painel de Referências)
**Localização:** `apps/portal/src/components/CrossReferencePanel.tsx`

**O que é:** Painel que mostra referências entre documentos (links wiki do Obsidian).

---

### `ReferenceCountBadge` (Badge de Referências)
**O que é:** Badge que mostra a contagem de referências do documento.

---

### `VaultPathSelector` (Seletor de Vault)
**Localização:** `apps/portal/src/components/VaultPathSelector.tsx`

**O que é:** Componente para selecionar o caminho do vault Obsidian.

---

### `VaultContextPanel` (Painel de Contexto do Vault)
**Localização:** `apps/portal/src/components/VaultContextPanel.tsx`

**O que é:** Painel que mostra contexto e informações do vault.

---

### `SummaryPanel`
**Localização:** `apps/portal/src/components/SummaryPanel.tsx`

**O que é:** Painel que mostra resumo das anotações.

---

### `AISuggestions`
**Localização:** `apps/portal/src/components/AISuggestions.tsx`

**O que é:** Componente que mostra sugestões de IA.

---

### `PromptEditor` / `PromptTemplateEditor`
**Localização:**
- `apps/portal/src/components/PromptEditor.tsx`
- `apps/portal/src/components/PromptTemplateEditor.tsx`

**O que é:** Editor de prompt para integração com Claude Code.

---

### `UpgradePrompt`
**Localização:** `apps/portal/src/components/UpgradePrompt.tsx`

**O que é:** Prompt para upgrade para plano pago.

---

### `ExportModal`
**Localização:** `packages/ui/components/ExportModal.tsx`

**O que é:** Modal para exportar documento/anotações.

**Formatos disponíveis:**
- Markdown
- JSON
- PDF (via impressão)

---

### `DecisionBar`
**Localização:** `packages/ui/components/DecisionBar.tsx`

**O que é:** Barra inferior com botões de decisão (Aceitar Todas / Rejeitar Todas).

---

### `ConfirmationDialog`
**Localização:** `packages/ui/components/ConfirmationDialog.tsx`

**O que é:** Dialog genérico para confirmações (sim/não).

---

### `Skeleton` / `ViewerSkeleton`
**Localização:**
- `packages/ui/components/Skeleton.tsx`
- `packages/ui/components/ViewerSkeleton.tsx`

**O que é:** Componente de loading (placeholder esqueletal).

---

### `AnimatedCheckmark`
**Localização:** `packages/ui/components/AnimatedCheckmark.tsx`

**O que é:** Checkmark animado para feedback visual de sucesso.

---

### `StatusBadge`
**Localização:** `packages/ui/components/StatusBadge.tsx`

**O que é:** Badge colorido para status (open, in-progress, resolved).

---

### `CollapsibleSection`
**Localização:** `packages/ui/components/CollapsibleSection.tsx`

**O que é:** Seção colapsável genérica.

---

### `AnnotationStatistics`
**Localização:** `packages/ui/components/AnnotationStatistics.tsx`

**O que é:** Estatísticas e contadores de anotações.

---

### `SortSelector`
**Localização:** `packages/ui/components/SortSelector.tsx`

**O que é:** Seletor para ordenar anotações.

---

### `BulkActionsBar`
**Localização:** `packages/ui/components/BulkActionsBar.tsx`

**O que é:** Barra de ações em lote para anotações.

---

### `BulkSelectionBar`
**Localização:** `packages/ui/components/BulkSelectionBar.tsx`

**O que é:** Barra de seleção em lote de anotações.

---

### `TouchButton`
**Localização:** `apps/portal/src/components/TouchButton.tsx`

**O que é:** Botão otimizado para touch/mobile.

---

### `MobileLayout`
**Localização:** `apps/portal/src/components/MobileLayout.tsx`

**O que é:** Layout específico para dispositivos móveis.

---

### `BreakpointPreview`
**Localização:** `apps/portal/src/components/BreakpointPreview.tsx`

**O que é:** Componente para preview de breakpoints responsivos.

---

### `Layout`
**Localização:** `apps/portal/src/components/Layout.tsx`

**O que é:** Layout principal da aplicação portal.

---

### `NotFound`
**Localização:** `packages/ui/components/NotFound.tsx`

**O que é:** Página 404 (não encontrado).

---

### `ErrorBoundary`
**Localização:** `packages/ui/components/ErrorBoundary.tsx`

**O que é:** Boundary para capturar erros React e mostrar fallback.

---

### `SEO`
**Localização:** `packages/ui/components/SEO.tsx`

**O que é:** Componente para meta tags SEO.

---

### `ResourceHints`
**Localização:** `packages/ui/components/ResourceHints.tsx`

**O que é:** Hints para pré-carregamento de recursos.

---

### `OptimizedImage`
**Localização:** `packages/ui/components/OptimizedImage.tsx`

**O que é:** Componente de imagem otimizada com lazy loading.

---

### `VirtualList`
**Localização:** `packages/ui/components/VirtualList.tsx`

**O que é:** Lista virtualizada para performance com grandes listas.

---

### `FrontmatterEditor`
**Localização:** `packages/ui/components/FrontmatterEditor.tsx`

**O que é:** Editor para frontmatter YAML de documentos.

---

### `MarkdownRenderer`
**Localização:** `packages/ui/components/MarkdownRenderer.tsx`

**O que é:** Renderiza markdown para HTML com suporte a sintaxe completa.

---

### `CodeBlock`
**Localização:** `packages/ui/components/CodeBlock.tsx`

**O que é:** Renderiza blocos de código com syntax highlighting.

---

### `DiffViewer`
**Localização:** `packages/ui/components/DiffViewer.tsx`

**O que é:** Mostra diffs lado a lado entre versões.

---

### `VersionHistory`
**Localização:** `packages/ui/components/VersionHistory.tsx`

**O que é:** Componente para visualizar histórico de versões.

---

## 📄 Páginas do Portal

### Páginas de Autenticação
**Localização:** `apps/portal/src/pages/`

| Página | Arquivo | Descrição |
|--------|---------|-----------|
| Login | `login.tsx` | Página de login |
| Cadastro | `signup.tsx` | Página de cadastro |
| Callback OAuth | `callback.tsx` | Callback para OAuth |
| Esqueci Senha | `forgot-password.tsx` | Recuperação de senha |
| Resetar Senha | `reset-password.tsx` | Reset de senha |

---

### Páginas Principais
| Página | Arquivo | Descrição |
|--------|---------|-----------|
| Dashboard | `dashboard.tsx` | Dashboard do usuário |
| Settings | `settings.tsx` | Configurações (redireciona) |
| Welcome | `welcome.tsx` | Página de boas-vindas |
| SharedDocument | `SharedDocument.tsx` | Documento compartilhado |

---

### Páginas de Pagamento
| Página | Arquivo | Descrição |
|--------|---------|-----------|
| Pricing | `Pricing.tsx` | Planos e preços |
| CheckoutSuccess | `CheckoutSuccess.tsx` | Checkout sucedido |
| CheckoutCancel | `CheckoutCancel.tsx` | Checkout cancelado |
| BillingSettings | `packages/ui/pages/BillingSettings.tsx` | Configurações de cobrança |

---

## 🛒 Páginas de Marketing

### SalesPageV1
**Localização:** `apps/marketing/SalesPageV1.tsx`

**O que é:** Primeira versão da página de vendas/marketing.

---

### SalesPageV2 / sales-v2
**Localização:**
- `apps/marketing/SalesPageV2.tsx`
- `apps/marketing/sales-v2.tsx`

**O que é:** Segunda versão da página de vendas.

---

### index.pt-br
**Localização:** `apps/marketing/index.pt-br.tsx`

**O que é:** Página inicial em português do Brasil.

---

## 🎣 Hooks Customizados

**Localização:** `packages/ui/hooks/`

| Hook | Descrição |
|------|-----------|
| `useSharing` | Gerencia compartilhamento de documentos |
| `useFocusTrap` | Trap de foco para modais/dialogs |
| `useCopyFeedback` | Feedback visual de cópia |
| `usePrefersReducedMotion` | Detecta preferência de movimento reduzido |
| `useAnnotationTargeting` | Gerencia targeting de anotações |

---

## 🎨 Componentes Decorativos (Sprites)

**Localização:** `packages/ui/components/`

| Componente | Descrição |
|------------|-----------|
| `TaterSpritePullup.tsx` | Sprite de "pullup" |
| `TaterSpriteRunning.tsx` | Sprite correndo |
| `TaterSpriteSitting.tsx` | Sprite sentado |

---

## 🎯 Tipos de Anotação (AnnotationType)

**Localização:** `packages/ui/types/index.ts`

```typescript
enum AnnotationType {
  EDIT = 'edit',        // Texto para editar
  COMMENT = 'comment',  // Comentário
  DELETE = 'delete',    // Texto para deletar
  HIGHLIGHT = 'highlight', // Destaque
  QUESTION = 'question'  // Dúvida
}
```

## 🎨 Status de Anotação

```typescript
enum AnnotationStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in-progress',
  RESOLVED = 'resolved'
}
```

## 📱 Modos do Editor (EditorMode)

```typescript
enum EditorMode {
  EDIT = 'edit',       // Modo de edição
  REVIEW = 'review',   // Modo de revisão
  PRESENTATION = 'presentation' // Modo apresentação
}
```

---

## 🗂️ Estrutura de Arquivos

```
packages/
├── editor/
│   └── App.tsx                    ← Editor principal
├── ui/
│   ├── components/
│   │   ├── Viewer.tsx              ← Visualizador markdown
│   │   ├── Toolbar.tsx             ← Toolbar flutuante
│   │   ├── ImageAnnotator.tsx      ← Anotador de imagem
│   │   ├── AnnotationPanel.tsx     ← Painel de anotações
│   │   ├── CommentThread.tsx       ← Thread de comentários
│   │   ├── ExportModal.tsx         ← Modal de exportação
│   │   ├── SettingsPanel.tsx       ← Painel de configurações
│   │   └── ...
│   ├── hooks/                      ← Hooks customizados
│   └── pages/                      ← Páginas compartilhadas
│       ├── Pricing.tsx
│       └── BillingSettings.tsx

apps/
├── portal/src/
│   ├── components/
│   │   ├── auth/                   ← Autenticação
│   │   ├── collaboration/          ← Colaboração (Liveblocks)
│   │   ├── DocumentWorkspace.tsx   ← Workspace principal
│   │   ├── ShareDialog.tsx         ← Dialog de share
│   │   ├── SettingsPanel.tsx       ← Configurações
│   │   └── ...
│   └── pages/                      ← Páginas do portal
│       ├── login.tsx, signup.tsx...
│       ├── dashboard.tsx
│       ├── SharedDocument.tsx
│       └── Pricing.tsx...
└── marketing/                       ← Páginas de marketing
    ├── SalesPageV1.tsx
    ├── SalesPageV2.tsx
    └── index.pt-br.tsx
```

---

*Atualizado em: 2026-02-08*
*Total: 100+ componentes documentados*
