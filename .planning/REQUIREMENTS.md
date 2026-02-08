# Requirements: Obsidian Note Reviewer

**Defined:** 2025-02-04
**Updated:** 2026-02-08 (full codebase analysis)
**Core Value:** Usuários podem revisar visualmente notas e planos, com integração perfeita com Claude Code e colaboração em tempo real.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Autenticação ✓

- [x] **AUTH-01**: User pode criar conta com email e senha ✓
- [x] **AUTH-02**: User pode fazer login com email/senha ou OAuth (GitHub/Google) ✓
- [x] **AUTH-03**: User session persiste across browser refresh ✓
- [x] **AUTH-04**: User pode fazer logout de qualquer página ✓
- [x] **AUTH-05**: User profile com display name e avatar ✓

**Implementation:**
- Supabase Auth via `packages/security/src/supabase/client.ts`
- OAuth em `packages/security/src/supabase/oauth.ts`
- Session persistence em localStorage
- Avatar upload via Supabase Storage (`packages/security/src/supabase/storage.ts`)

**Status:** ✅ 100% Complete (2026-02-07)

---

### Anotações e Revisão ✓

- [x] **ANNO-01**: User pode adicionar anotações visuais em elementos específicos do markdown ✓
- [x] **ANNO-02**: User pode criar threads de comentários com @mentions ✓
- [x] **ANNO-03**: User pode responder a comentários existentes ✓
- [x] **ANNO-04**: User pode definir status das anotações (open/in-progress/resolved) ✓
- [x] **ANNO-05**: User pode ver histórico de versões do documento ✓
- [x] **ANNO-06**: User pode restaurar versões anteriores do documento ✓
- [x] **ANNO-07**: Markdown rendering suporta sintaxe padrão com code blocks e imagens ✓

**Implementation:**
- `packages/ui/components/AnnotationPanel.tsx` (14KB)
- `packages/ui/components/CommentThread.tsx` (14KB)
- `packages/ui/components/CommentInput.tsx` (9KB)
- `packages/ui/components/AnnotationStatusControls.tsx` (4KB)
- `packages/ui/components/VersionHistory.tsx` (14KB)
- `packages/ui/components/DiffViewer.tsx` (6KB)
- `packages/ui/components/MarkdownRenderer.tsx` (5KB)
- `packages/ui/components/CodeBlock.tsx` (6KB) - syntax highlighting
- `packages/ui/components/MentionsInput.tsx` - @mentions
- Annotation types: DELETION, INSERTION, REPLACEMENT, COMMENT, GLOBAL_COMMENT, IMAGE_COMMENT

**Status:** ✅ 90% Complete (gaps conhecidos: undo/redo, performance em documentos grandes)

---

### Claude Code Integration ✓

- [x] **CLAU-01**: Hook abre reviewer automaticamente ao criar nota no Obsidian ✓
- [x] **CLAU-02**: Hook abre reviewer automaticamente ao ativar plan mode no Claude Code ✓
- [x] **CLAU-03**: Anotações são enviadas de volta ao Claude Code em formato estruturado ✓
- [x] **CLAU-04**: Prompt fixo automático formata as revisões para o Claude Code ✓
- [x] **CLAU-05**: Campo editável permite customizar o prompt antes de enviar ✓
- [x] **CLAU-06**: Todas as anotações são incluídas: edições, comentários globais, comentários individuais, exclusões, marcações ✓

**Implementation:**
- `apps/hook/server/obsidianHook.ts` (324 lines) - PostToolUse hook
- `apps/hook/server/planModeHook.ts` - ExitPlanMode hook
- `apps/hook/bin/obsreview-obsidian.ts` - CLI for Obsidian
- `apps/hook/bin/obsreview-plan.ts` - CLI for plan mode
- `apps/portal/src/components/PromptEditor.tsx` (14KB) - prompt editing
- `apps/portal/src/components/AnnotationExport.tsx` (9KB) - export format
- `packages/ui/utils/claudeExport.ts` (9KB) - structured export format

**Hook Output Format:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "result": "OBSIDIAN_PLAN_APPROVED" | "OBSIDIAN_PLAN_CHANGES_REQUESTED",
    "filePath": "...",
    "feedback": "..."
  }
}
```

**Status:** ✅ 100% Complete (2026-02-05)

---

### ~~IA Avançada~~ ❌ **REMOVIDA**

- ~~**AI-01**: IA sugere anotações proativamente~~
- ~~**AI-02**: IA entende contexto do vault Obsidian (backlinks, graph)~~
- ~~**AI-03**: IA gera sumários executivos de documentos anotados~~

**Removida:** Recursos de IA avançada não são prioridade no momento.

**Note:** Implementação básica existe em `packages/ai/src/` (suggester.ts, summarizer.ts, vaultParser.ts) mas não é prioridade para v1.

---

### Colaboração

- [ ] **COLL-01**: User pode ver indicadores de presença de outros usuários
- [ ] **COLL-02**: User pode ver avatares/cursor de usuários ativos no documento
- [ ] **COLL-03**: User pode compartilhar review via link amigável (slug-based)
- [ ] **COLL-04**: Guest access permite visualizar reviews sem login
- [ ] **COLL-05**: Workflow nativo com Obsidian vault (acesso local)

**Existing Implementation (Partial):**
- Liveblocks client configured: `apps/portal/src/lib/liveblocks.ts`
- Liveblocks auth endpoint: `apps/portal/dev-server.ts`
- Shared document with slug: `apps/portal/src/pages/SharedDocument.tsx`
- Shareable links utilities: `packages/collaboration/src/shareableLinks.ts`
- Vault integration: `apps/portal/src/lib/vaultIntegration.ts` (File System Access API)
- Presence components exist: `packages/ui/components/LiveCursors.tsx`, `packages/ui/components/ActivityFeed.tsx`

**Status:** ❌ 0% Complete (infrastructure exists but not integrated)

---

### ~~Multi-Document~~ ❌ **REMOVIDA**

- ~~**MULT-01**: User pode revisar múltiplos documentos simultaneamente~~
- ~~**MULT-02**: User pode navegar entre documentos com tabs~~
- ~~**MULT-03**: User pode ver referências cruzadas entre documentos~~

**Removida:** Multi-document review não é prioridade no momento.

---

### ~~Mobile~~ ❌ **REMOVIDA**

- ~~**MOBL-01**: Interface funciona em dispositivos mobile~~
- ~~**MOBL-02**: User pode comparar views mobile/tablet/desktop (breakpoint comparison)~~

**Removida:** Mobile support básico (responsivo) já existe. Breakpoint comparison não é prioridade.

---

### Configurações ✓

- [x] **CONF-01**: User pode configurar preferências (theme dark/light automático) ✓
- [x] **CONF-02**: User pode configurar local de salvamento (vault Obsidian, nuvem, ambos) ✓
- [x] **CONF-03**: User pode customizar prompt de integração Claude Code ✓
- [x] **CONF-04**: Painel de configurações fica DENTRO do editor (não página separada) ✓

**Implementation:**
- `packages/ui/components/SettingsPanel.tsx` (52KB) - all settings inside editor
- `packages/ui/components/ConfigEditor.tsx` (16KB) - config file editing
- `packages/ui/components/ModeToggle.tsx` (3KB) - theme toggle
- `packages/ui/components/FrontmatterEditor.tsx` (4KB) - note frontmatter
- ThemeProvider with dark/light/system modes
- Prompt customization via PromptEditor

**Status:** ✅ 100% Complete (2026-02-07)

---

### Compartilhamento e URLs

- [x] **SHAR-01**: URLs amigáveis com slug (r.alexdonega.com.br/plan/nome-do-plano) ✓ (SharedDocument.tsx)
- [ ] **SHAR-02**: Slug é único e validado
- [ ] **SHAR-03**: Multi-usuário podem ver e revisar planos compartilhados

**Implementation:**
- `apps/portal/src/pages/SharedDocument.tsx` - public shared document page
- `apps/portal/src/components/ShareDialog.tsx` (6KB) - share UI
- `packages/ui/utils/sharing.ts` (12KB) - sharing utilities
- Route: `/shared/:slug` - guest access without auth

**Status:** ⚠️ 33% Complete

---

### Monetização

- [ ] **MONY-01**: Sistema de freemium funcional (plano free vs pago)
- [ ] **MONY-02**: Plano free limita colaboradores (uso individual)
- [ ] **MONY-03**: Plano pago permite colaboradores ilimitados
- [x] **MONY-04**: Stripe subscriptions processam pagamentos ✓ (Pricing.tsx)
- [x] **MONY-05**: Assinatura lifetime disponível como opção ✓ (Pricing.tsx)
- [ ] **MONY-06**: Webhooks do Stripe são verificados com signature

**Implementation:**
- `apps/portal/src/pages/Pricing.tsx` - pricing page with tiers
- `apps/portal/src/pages/BillingSettings.tsx` - billing management
- `packages/api/lib/stripe.ts` (547 lines) - core Stripe service
- `packages/api/routes/webhooks/stripe.ts` (491 lines) - webhook handlers
- `packages/shared/pricing.ts` - plan definitions
- `apps/portal/src/hooks/useStripeCheckout.ts` - checkout flow
- `apps/portal/src/hooks/useSubscription.ts` - subscription management

**Database Tables:**
- `subscriptions` - active subscriptions
- `invoices` - payment invoices
- `payment_methods` - stored methods
- `stripe_webhook_events` - event log
- `subscription_history` - audit trail

**Status:** ⚠️ 40% Complete

---

### Deploy e Domínio

- [ ] **DEPL-01**: App faz deploy na Vercel
- [ ] **DEPL-02**: Domínio r.alexdonega.com.br configurado
- [ ] **DEPL-03**: Subdomínio r. aponta para Vercel
- [ ] **DEPL-04**: Environment variables configuradas corretamente

**Existing:**
- `vercel.json` - Vercel configuration
- `apps/portal/vite.config.ts` - build config
- `apps/marketing/vite.config.ts` - marketing build config
- `apps/hook/vite.config.ts` - hook single-file build

**Status:** ❌ 0% Complete

---

### Design e UX

- [x] **DSGN-01**: Design minimalista estilo Apple/macOS ✓
- [x] **DSGN-02**: Theme system com dark/light mode automático ✓
- [ ] **DSGN-03**: Cores personalizáveis
- [ ] **DSGN-04**: UX focada em usabilidade

**Implementation:**
- Tailwind CSS v4 with oklch color space
- CSS variables for theming
- Automatic theme switching (dark by default, light with .light class)
- Minimalist UI with clean borders and spacing

**Status:** ⚠️ 50% Complete

---

### Qualidade e Estabilidade

- [ ] **QUAL-01**: Console.logs removidos de produção
- [ ] **QUAL-02**: Sistema de logging apropriado (Pino)
- [ ] **QUAL-03**: Tratamento de erros robusto
- [ ] **QUAL-04**: Sistema de undo/redo para anotações
- [ ] **QUAL-05**: Testes automatizados para features críticas
- [ ] **QUAL-06**: Performance otimizada (sem memory leaks)

**Existing Issues:**
- Console logs em produção (hook server, auth context)
- Pino logger configured but not consistently used
- No undo/redo system
- Limited test coverage (26 test files, mostly unit)
- Large components without React.memo (Viewer.tsx 1,493 lines)
- Memory leaks from timers not cleaned up
- TypeScript any type usage throughout

**Status:** ❌ 0% Complete

---

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Integrações

- **INTG-01**: Exportar reviews para PDF
- **INTG-02**: Sync com ferramentas de projeto (Jira, Linear, ClickUp)
- **INTG-03**: Webhooks customizados para integrações

### Features Avançadas

- **ADV-01**: Approval workflows com multi-stage sign-off
- **ADV-02**: Real-time collaborative editing (CRDT-based)
- **ADV-03**: Offline mode com sync automático
- **ADV-04**: Native mobile apps (iOS/Android)

---

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| **IA Avançada** (AI-suggested annotations, vault context, summarization) | Não é prioridade no momento |
| **Multi-Document Review** (tabbed interface) | Não é prioridade no momento |
| **Mobile Support avançado** (breakpoint comparison, touch optimization) | Responsivo básico já existe |
| Real-time collaborative editing (Notion-style) | Muito complexo (CRDT/OT), conflita com Obsidian local-first |
| Full chat/DM system | Slack/Discord já existem; distração do core value |
| Native mobile apps | PWA suficiente inicialmente; alta manutenção |
| Custom branding/white-label completo | Feature creep; logo/cores custom é suficiente |
| Advanced permissions (ACLs granulares) | Simple roles (owner/editor/viewer) é suficiente |
| Video/voice calling integrado | Zoom/Meet existem; embed via iframe |
| Blockchain/crypto features | Sem valor real; adiciona complexidade |
| Social features (likes, follows) | Distração do core value |

---

## Traceability

Which phases cover which requirements. Updated after full codebase analysis.

| Requirement | Phase | Status | Implementation Files |
|-------------|-------|--------|---------------------|
| **AUTH-01** | Phase 1 | ✅ Complete | packages/security/src/supabase/ |
| **AUTH-02** | Phase 1 | ✅ Complete | packages/security/src/supabase/oauth.ts |
| **AUTH-03** | Phase 1 | ✅ Complete | packages/security/src/supabase/session.ts |
| **AUTH-04** | Phase 1 | ✅ Complete | packages/security/src/auth/context.tsx |
| **AUTH-05** | Phase 1 | ✅ Complete | packages/security/src/supabase/storage.ts |
| **ANNO-01** | Phase 2 | ✅ Complete | packages/ui/components/AnnotationPanel.tsx |
| **ANNO-02** | Phase 2 | ✅ Complete | packages/ui/components/CommentThread.tsx |
| **ANNO-03** | Phase 2 | ✅ Complete | packages/ui/components/CommentInput.tsx |
| **ANNO-04** | Phase 2 | ✅ Complete | packages/ui/components/AnnotationStatusControls.tsx |
| **ANNO-05** | Phase 2 | ✅ Complete | packages/ui/components/VersionHistory.tsx |
| **ANNO-06** | Phase 2 | ✅ Complete | packages/ui/components/DiffViewer.tsx |
| **ANNO-07** | Phase 2 | ✅ Complete | packages/ui/components/MarkdownRenderer.tsx |
| **CLAU-01** | Phase 3 | ✅ Complete | apps/hook/server/obsidianHook.ts |
| **CLAU-02** | Phase 3 | ✅ Complete | apps/hook/server/planModeHook.ts |
| **CLAU-03** | Phase 3 | ✅ Complete | packages/ui/utils/claudeExport.ts |
| **CLAU-04** | Phase 3 | ✅ Complete | apps/portal/src/components/PromptEditor.tsx |
| **CLAU-05** | Phase 3 | ✅ Complete | apps/portal/src/components/PromptEditor.tsx |
| **CLAU-06** | Phase 3 | ✅ Complete | apps/portal/src/components/AnnotationExport.tsx |
| ~~**AI-01**~~ | ~~Phase 4~~ | ❌ **REMOVIDA** | packages/ai/src/suggester.ts (não prioritário) |
| ~~**AI-02**~~ | ~~Phase 4~~ | ❌ **REMOVIDA** | packages/ai/src/vaultParser.ts (não prioritário) |
| ~~**AI-03**~~ | ~~Phase 4~~ | ❌ **REMOVIDA** | packages/ai/src/summarizer.ts (não prioritário) |
| **COLL-01** | Phase 4 | Pending | packages/ui/components/LiveCursors.tsx (existe, não integrado) |
| **COLL-02** | Phase 4 | Pending | packages/ui/components/LiveCursors.tsx (existe, não integrado) |
| **COLL-03** | Phase 4 | Pending | packages/collaboration/src/shareableLinks.ts |
| **COLL-04** | Phase 4 | Pending | apps/portal/src/components/GuestBanner.tsx (existe, não usado) |
| **COLL-05** | Phase 4 | Pending | apps/portal/src/lib/vaultIntegration.ts |
| **CONF-01** | Phase 5 | ✅ Complete | packages/ui/components/ModeToggle.tsx |
| **CONF-02** | Phase 5 | ✅ Complete | packages/ui/components/ConfigEditor.tsx |
| **CONF-03** | Phase 5 | ✅ Complete | apps/portal/src/components/PromptEditor.tsx |
| **CONF-04** | Phase 5 | ✅ Complete | packages/ui/components/SettingsPanel.tsx |
| **SHAR-01** | Phase 6 | ✅ Complete | apps/portal/src/pages/SharedDocument.tsx |
| **SHAR-02** | Phase 6 | Pending | - |
| **SHAR-03** | Phase 6 | Pending | - |
| **MONY-01** | Phase 7 | Pending | packages/shared/pricing.ts |
| **MONY-02** | Phase 7 | Pending | packages/api/lib/stripe.ts |
| **MONY-03** | Phase 7 | Pending | packages/api/lib/stripe.ts |
| **MONY-04** | Phase 7 | ✅ Complete | apps/portal/src/pages/Pricing.tsx |
| **MONY-05** | Phase 7 | ✅ Complete | apps/portal/src/pages/Pricing.tsx |
| **MONY-06** | Phase 7 | Pending | packages/api/routes/webhooks/stripe.ts |
| **DEPL-01** | Phase 8 | Pending | vercel.json |
| **DEPL-02** | Phase 8 | Pending | - |
| **DEPL-03** | Phase 8 | Pending | - |
| **DEPL-04** | Phase 8 | Pending | - |
| **DSGN-01** | Phase 9 | ✅ Complete | packages/editor/index.css |
| **DSGN-02** | Phase 9 | ✅ Complete | packages/ui/components/ThemeProvider.tsx |
| **DSGN-03** | Phase 9 | Pending | - |
| **DSGN-04** | Phase 9 | Pending | - |
| **QUAL-01** | Phase 10 | Pending | - |
| **QUAL-02** | Phase 10 | Pending | packages/core/src/logger/ |
| **QUAL-03** | Phase 10 | Pending | - |
| **QUAL-04** | Phase 10 | Pending | - |
| **QUAL-05** | Phase 10 | Pending | - |
| **QUAL-06** | Phase 10 | Pending | - |

**Coverage:**
- v1 requirements: **45 total** (após remoção de AI, Multi-Document, Mobile)
- Mapped to phases: 45
- Unmapped: 0

**Requirements Delivered:**
- Phase 1 (AUTH): 5/5 ✅
- Phase 2 (ANNO): 7/7 ✅
- Phase 3 (CLAU): 6/6 ✅
- Phase 5 (CONF): 4/4 ✅
- Phase 6 (SHAR): 1/3 ⚠️
- Phase 7 (MONY): 2/6 ⚠️
- Phase 9 (DSGN): 2/4 ⚠️

**Total: 30/45 requirements (66.7%)**

---

*Requirements defined: 2025-02-04*
*Last updated: 2026-02-08 after full codebase analysis*
