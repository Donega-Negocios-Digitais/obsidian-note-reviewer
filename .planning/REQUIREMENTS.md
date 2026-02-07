# Requirements: Obsidian Note Reviewer

**Defined:** 2025-02-04
**Updated:** 2026-02-07 (removed AI, Multi-Document, Mobile)
**Core Value:** Usuários podem revisar visualmente notas e planos, com integração perfeita com Claude Code e colaboração em tempo real.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Autenticação ✓

- [x] **AUTH-01**: User pode criar conta com email e senha ✓
- [x] **AUTH-02**: User pode fazer login com email/senha ou OAuth (GitHub/Google) ✓
- [x] **AUTH-03**: User session persiste across browser refresh ✓
- [x] **AUTH-04**: User pode fazer logout de qualquer página ✓
- [x] **AUTH-05**: User profile com display name e avatar ✓

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

**Status:** ✅ 90% Complete (gaps conhecidos)

---

### Claude Code Integration ✓

- [x] **CLAU-01**: Hook abre reviewer automaticamente ao criar nota no Obsidian ✓
- [x] **CLAU-02**: Hook abre reviewer automaticamente ao ativar plan mode no Claude Code ✓
- [x] **CLAU-03**: Anotações são enviadas de volta ao Claude Code em formato estruturado ✓
- [x] **CLAU-04**: Prompt fixo automático formata as revisões para o Claude Code ✓
- [x] **CLAU-05**: Campo editável permite customizar o prompt antes de enviar ✓
- [x] **CLAU-06**: Todas as anotações são incluídas: edições, comentários globais, comentários individuais, exclusões, marcações ✓

**Status:** ✅ 100% Complete (2026-02-05)

---

### ~~IA Avançada~~ ❌ **REMOVIDA**

- ~~**AI-01**: IA sugere anotações proativamente~~
- ~~**AI-02**: IA entende contexto do vault Obsidian (backlinks, graph)~~
- ~~**AI-03**: IA gera sumários executivos de documentos anotados~~

**Removida:** Recursos de IA avançada não são prioridade no momento.

---

### Colaboração

- [ ] **COLL-01**: User pode ver indicadores de presença de outros usuários
- [ ] **COLL-02**: User pode ver avatares/cursor de usuários ativos no documento
- [ ] **COLL-03**: User pode compartilhar review via link amigável (slug-based)
- [ ] **COLL-04**: Guest access permite visualizar reviews sem login
- [ ] **COLL-05**: Workflow nativo com Obsidian vault (acesso local)

**Status:** ❌ 0% Complete

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

**Status:** ✅ 100% Complete (2026-02-07)

---

### Compartilhamento e URLs

- [x] **SHAR-01**: URLs amigáveis com slug (r.alexdonega.com.br/plan/nome-do-plano) ✓ (SharedDocument.tsx)
- [ ] **SHAR-02**: Slug é único e validado
- [ ] **SHAR-03**: Multi-usuário podem ver e revisar planos compartilhados

**Status:** ⚠️ 33% Complete

---

### Monetização

- [ ] **MONY-01**: Sistema de freemium funcional (plano free vs pago)
- [ ] **MONY-02**: Plano free limita colaboradores (uso individual)
- [ ] **MONY-03**: Plano pago permite colaboradores ilimitados
- [x] **MONY-04**: Stripe subscriptions processam pagamentos ✓ (Pricing.tsx)
- [x] **MONY-05**: Assinatura lifetime disponível como opção ✓ (Pricing.tsx)
- [ ] **MONY-06**: Webhooks do Stripe são verificados com signature

**Status:** ⚠️ 40% Complete

---

### Deploy e Domínio

- [ ] **DEPL-01**: App faz deploy na Vercel
- [ ] **DEPL-02**: Domínio r.alexdonega.com.br configurado
- [ ] **DEPL-03**: Subdomínio r. aponta para Vercel
- [ ] **DEPL-04**: Environment variables configuradas corretamente

**Status:** ❌ 0% Complete

---

### Design e UX

- [x] **DSGN-01**: Design minimalista estilo Apple/macOS ✓
- [x] **DSGN-02**: Theme system com dark/light mode automático ✓
- [ ] **DSGN-03**: Cores personalizáveis
- [ ] **DSGN-04**: UX focada em usabilidade

**Status:** ⚠️ 50% Complete

---

### Qualidade e Estabilidade

- [ ] **QUAL-01**: Console.logs removidos de produção
- [ ] **QUAL-02**: Sistema de logging apropriado (Pino)
- [ ] **QUAL-03**: Tratamento de erros robusto
- [ ] **QUAL-04**: Sistema de undo/redo para anotações
- [ ] **QUAL-05**: Testes automatizados para features críticas
- [ ] **QUAL-06**: Performance otimizada (sem memory leaks)

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

Which phases cover which requirements. Updated after roadmap renumbering (13 → 10 phases).

| Requirement | Phase | Status |
|-------------|-------|--------|
| **AUTH-01** | Phase 1 | ✅ Complete |
| **AUTH-02** | Phase 1 | ✅ Complete |
| **AUTH-03** | Phase 1 | ✅ Complete |
| **AUTH-04** | Phase 1 | ✅ Complete |
| **AUTH-05** | Phase 1 | ✅ Complete |
| **ANNO-01** | Phase 2 | ✅ Complete |
| **ANNO-02** | Phase 2 | ✅ Complete |
| **ANNO-03** | Phase 2 | ✅ Complete |
| **ANNO-04** | Phase 2 | ✅ Complete |
| **ANNO-05** | Phase 2 | ✅ Complete |
| **ANNO-06** | Phase 2 | ✅ Complete |
| **ANNO-07** | Phase 2 | ✅ Complete |
| **CLAU-01** | Phase 3 | ✅ Complete |
| **CLAU-02** | Phase 3 | ✅ Complete |
| **CLAU-03** | Phase 3 | ✅ Complete |
| **CLAU-04** | Phase 3 | ✅ Complete |
| **CLAU-05** | Phase 3 | ✅ Complete |
| **CLAU-06** | Phase 3 | ✅ Complete |
| ~~**AI-01**~~ | ~~Phase 4~~ | ❌ **REMOVIDA** |
| ~~**AI-02**~~ | ~~Phase 4~~ | ❌ **REMOVIDA** |
| ~~**AI-03**~~ | ~~Phase 4~~ | ❌ **REMOVIDA** |
| **COLL-01** | Phase 4 | Pending |
| **COLL-02** | Phase 4 | Pending |
| **COLL-03** | Phase 4 | Pending |
| **COLL-04** | Phase 4 | Pending |
| **COLL-05** | Phase 4 | Pending |
| ~~**MULT-01**~~ | ~~Phase 6~~ | ❌ **REMOVIDA** |
| ~~**MULT-02**~~ | ~~Phase 6~~ | ❌ **REMOVIDA** |
| ~~**MULT-03**~~ | ~~Phase 6~~ | ❌ **REMOVIDA** |
| ~~**MOBL-01**~~ | ~~Phase 7~~ | ❌ **REMOVIDA** |
| ~~**MOBL-02**~~ | ~~Phase 7~~ | ❌ **REMOVIDA** |
| **CONF-01** | Phase 5 | ✅ Complete |
| **CONF-02** | Phase 5 | ✅ Complete |
| **CONF-03** | Phase 5 | ✅ Complete |
| **CONF-04** | Phase 5 | ✅ Complete |
| **SHAR-01** | Phase 6 | ✅ Complete |
| **SHAR-02** | Phase 6 | Pending |
| **SHAR-03** | Phase 6 | Pending |
| **MONY-01** | Phase 7 | Pending |
| **MONY-02** | Phase 7 | Pending |
| **MONY-03** | Phase 7 | Pending |
| **MONY-04** | Phase 7 | ✅ Complete |
| **MONY-05** | Phase 7 | ✅ Complete |
| **MONY-06** | Phase 7 | Pending |
| **DEPL-01** | Phase 8 | Pending |
| **DEPL-02** | Phase 8 | Pending |
| **DEPL-03** | Phase 8 | Pending |
| **DEPL-04** | Phase 8 | Pending |
| **DSGN-01** | Phase 9 | ✅ Complete |
| **DSGN-02** | Phase 9 | ✅ Complete |
| **DSGN-03** | Phase 9 | Pending |
| **DSGN-04** | Phase 9 | Pending |
| **QUAL-01** | Phase 10 | Pending |
| **QUAL-02** | Phase 10 | Pending |
| **QUAL-03** | Phase 10 | Pending |
| **QUAL-04** | Phase 10 | Pending |
| **QUAL-05** | Phase 10 | Pending |
| **QUAL-06** | Phase 10 | Pending |

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
*Last updated: 2026-02-07 after removing Advanced AI, Multi-Document Review, and Mobile Support*
