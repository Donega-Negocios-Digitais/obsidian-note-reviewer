# Obsidian Note Reviewer

## What This Is

Ferramenta de revisão visual de notas do Obsidian e planos para agentes de IA com integração Claude Code. Usuários podem revisar visualmente conteúdo (notas, planos), fazer anotações (edições, comentários, exclusões, marcações) e enviar feedback estruturado de volta para o Claude Code ou colaboradores.

## Core Value

**Usuários podem revisar visualmente notas e planos, com integração perfeita com Claude Code e colaboração em tempo real.**

Se isso não funcionar, nada mais importa.

## Project Status (2026-02-08)

**Overall Progress:** 66.7% (30/45 requirements delivered)

### Recently Completed ✅

- **Autenticação completa** (Supabase Auth, login/signup, OAuth) — 2026-02-07
- **Integração Claude Code completa** (hooks, export, prompt editor) — 2026-02-05
- **Configurações dentro do editor** (SettingsPanel, sem /settings ou /dashboard) — 2026-02-07
- **Theme system** (dark/light mode automático) — 2026-02-07
- **URLs amigáveis com slug** (SharedDocument.tsx) — 2026-02-07
- **Configuração Stripe checkout** (useStripeCheckout) — 2026-02-07

### Currently Active ⚠️

**Colaboração em Tempo Real (0%):**
- Indicadores de presença de outros usuários
- Cursores e avatares em tempo real (Liveblocks)
- Multi-usuário podem ver e revisar planos compartilhados
- Guest access permite visualizar reviews sem login
- Workflow nativo com Obsidian vault (acesso local)

**Monetização Stripe (40%):**
- Modelo freemium funcional (PENDENTE)
- Plano free: uso individual sem colaboradores (PENDENTE)
- Plano pago: colaboradores + recursos avançados + suporte (PENDENTE)
- Assinatura lifetime disponível (Pricing.tsx) ✅
- Configuração Stripe checkout (useStripeCheckout) ✅
- Webhooks do Stripe com signature verification (PENDENTE)
- Sistema de freemium com limites de colaboradores (PENDENTE)

**Deploy e Domínio (0%):**
- Deploy na Vercel (PENDENTE)
- Domínio r.alexdonega.com.br configurado (PENDENTE)
- Configuração de subdomínio e DNS (PENDENTE)
- Ambiente de produção configurado (PENDENTE)

## Requirements

### Validated (✅ Complete)

- ✓ Interface de revisão visual com markdown rendering
- ✓ Sistema de anotações (destaques, comentários, edições)
- ✓ Estrutura monorepo com apps hook/portal/marketing
- ✓ Stack TypeScript + React + Vite + Bun
- ✓ Sanitização de conteúdo com DOMPurify
- ✓ Path validation para segurança (path traversal)
- ✓ Autenticação completa (Supabase Auth, login/signup, OAuth)
- ✓ Integração Claude Code completa (hooks, export, prompt editor)
- ✓ Configurações dentro do editor (SettingsPanel, sem /settings ou /dashboard)
- ✓ Theme system (dark/light mode automático)

### Active (⚠️ In Progress)

**Colaboração em Tempo Real:**
- [ ] Indicadores de presença de outros usuários
- [ ] Cursores e avatares em tempo real (Liveblocks)
- [ ] Multi-usuário podem ver e revisar planos compartilhados
- [ ] Guest access permite visualizar reviews sem login
- [ ] Workflow nativo com Obsidian vault (acesso local)

**Compartilhamento (Parcial):**
- [x] URLs amigáveis com slug (SharedDocument.tsx existe)
- [ ] Multi-usuário podem ver e revisar planos compartilhados
- [ ] Controle de permissões (criador vs colaborador)
- [ ] Atividade em tempo real (edições, comentários)

**Monetização Stripe (Parcial):**
- [ ] Modelo freemium funcional
- [ ] Plano free: uso individual sem colaboradores
- [ ] Plano pago: colaboradores + recursos avançados + suporte
- [x] Assinatura lifetime disponível (Pricing.tsx)
- [x] Configuração Stripe checkout (useStripeCheckout)
- [ ] Webhooks do Stripe com signature verification
- [ ] Sistema de freemium com limites de colaboradores

**Deploy e Domínio:**
- [ ] Deploy na Vercel
- [ ] Domínio r.alexdonega.com.br configurado
- [ ] Configuração de subdomínio e DNS
- [ ] Ambiente de produção configurado

**Design e UX (Parcial):**
- [x] Design minimalista estilo Apple/macOS
- [x] Theme system (dark/light mode automático)
- [ ] Cores personalizáveis pelo usuário
- [ ] Auditoria UX completa

**Qualidade e Estabilidade:**
- [ ] Remover todos os console.logs de produção
- [ ] Sistema de logging apropriado (Pino)
- [ ] Tratamento de erros robusto
- [ ] Testes automatizados para features críticas
- [ ] Performance otimizada (sem memory leaks)
- [ ] Sistema de undo/redo para anotações
- [ ] Sistema i18n (separar português de hardcoded strings)

### Out of Scope

- **IA Avançada** — AI-suggested annotations, vault context understanding, summarization
- **Multi-Document Review** — Tabbed interface para múltiplos documentos simultâneos
- **Mobile Support avançado** — Breakpoint comparison, touch optimization (responsivo básico já existe)
- **Aplicativo mobile nativo** — web-first, mobile responsive é suficiente para v1
- **Edição colaborativa em tempo real (tipo Google Docs)** — complexidade alta, não é core
- **Exportação para múltiplos formatos (PDF, DOCX)** — JSON é suficiente para v1
- **Sistema de permissões granulares** — simples (criador vs colaborador) é suficiente
- **Integração com outras ferramentas além de Claude Code/Obsidian** — foco nestes dois
- **Páginas separadas de configurações (/settings, /dashboard)** — todas as configurações ficam DENTRO do editor ✅

## Context

**Stack Tecnológica Atual:**
- TypeScript 5.8-5.9
- React 19.2.3
- Vite 6.2.0
- Bun 1.x (runtime e package manager)
- Tailwind CSS 4.1.18
- Supabase (PostgreSQL + Auth + Edge Functions)
- Liveblocks 3.13.4 (colaboração em tempo real)
- Stripe (pagamentos e assinaturas)
- Anthropic Claude SDK 0.32.0 (integração AI)

**Arquitetura Monorepo:**
```
obsidian-note-reviewer/
├── apps/
│   ├── hook/          # Claude Code integration (port 3000)
│   ├── portal/        # Web dashboard (port 3001)
│   └── marketing/     # Landing page (port 3002)
├── packages/
│   ├── ui/            # Component library (40+ componentes)
│   ├── editor/        # Main editor App component
│   ├── security/      # Auth + CSP + Supabase client
│   ├── ai/            # Claude integration (suggestions)
│   ├── collaboration/ # Liveblocks + sharing
│   ├── api/           # Stripe + webhooks
│   ├── core/          # Logger + utilities
│   └── shared/        # Pricing + types
└── supabase/          # Migrations + Edge Functions
```

**O que existe hoje:**
- ✓ Código base funcional com interface de revisão visual
- ✓ Sistema de anotações implementado e integrado
- ✓ Estrutura monorepo com apps e pacotes
- ✓ Stack moderna (TypeScript, React, Vite, Bun, Supabase)
- ✓ Hooks completos (PostToolUse, Write) para trigger automático
- ✓ Autenticação completa com Supabase
- ✓ Configurações integradas no editor
- ✓ Theme system com dark/light mode
- ✓ Integração Stripe parcial (checkout sem webhooks)
- ✓ URLs amigáveis com slug

**Problemas conhecidos:**
- App só funciona em localhost, não está configurado para domínio
- Colaboração em tempo real não implementada
- Sistema de freemium não implementado
- Console logs em produção
- Mixed language UI (português hardcoded em componentes)
- Componentes grandes (Viewer.tsx com 1,493 linhas)
- TypeScript any type usage em vários arquivos
- Falta de otimização React (memo, useMemo, useCallback)
- Sistema de undo/redo não implementado

**Usuário alvo:**
- Desenvolvedores que usam Claude Code e querem revisar planos visualmente
- Usuários de Obsidian que querem workflow de revisão visual
- Equipes que colaboram em documentação e planos

## Constraints

- **Tech Stack**: TypeScript + React + Vite + Bun (mantido do código existente)
- **Hospedagem**: Vercel (plano free excelente, fácil deploy)
- **Database**: Supabase (PostgreSQL) — já configurado
- **Auth**: Supabase Auth — já implementado ✅
- **Domínio**: r.alexdonega.com.br (já configurado, precisa apontar para Vercel)
- **Monetização**: Stripe Freemium (free sem colaboradores, pago com lifetime)
- **Design**: Minimalista estilo Apple, dark/light mode ✅

## Key Decisions

| Decision | Rationale | Status |
|----------|-----------|--------|
| Manter stack atual (TS/React/Vite/Bun) | Código já existe, é moderno e funcional | ✓ Confirmed |
| Vercel para hospedagem | Plano free generoso, deploy fácil | — Pending |
| Subdomínio r.alexdonega.com.br | Domínio já existe, profissional e curto | — Pending |
| Freemium com lifetime | Atrai usuários, receita recorrente + option lifetime | — Pending |
| URLs com slug | Mais amigável e SEO-friendly que IDs/hashes | ✓ Partial (SharedDocument) |
| Prompt fixo automático + campo editável | Conveniência para maioria, flexibilidade para avançados | ✓ Complete |
| Design estilo Apple/macOS | UX minimalista focada em usabilidade | ✓ Complete |
| **Configurações dentro do editor** | O editor é a página principal, sem /settings nem /dashboard separados | ✓ Complete |
| **Remover IA Avançada, Multi-Document, Mobile avançado** | Não são prioridades no momento | ✓ Confirmed |

## Development Environment

**Ports:**
- Hook app: 3000 (Claude Code integration)
- Portal app: 3001 (main web app)
- Marketing app: 3002 (landing page)
- Portal API proxy: 3002 (via dev-server.ts)

**Environment Variables Required:**
```bash
# Supabase (Primary Backend)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Liveblocks (Real-time Collaboration)
VITE_LIVEBLOCKS_PUBLIC_KEY=
LIVEBLOCKS_SECRET_KEY=

# Stripe (Payments)
VITE_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
VITE_STRIPE_PRICE_PRO_MONTHLY=
VITE_STRIPE_PRICE_PRO_YEARLY=
VITE_STRIPE_PRICE_LIFETIME=

# Upstash (Rate Limiting - Production)
UPSTASH_REDIS_URL=
UPSTASH_REDIS_TOKEN=

# Supabase Edge Functions
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_PROJECT_REF=
SUPABASE_ACCESS_TOKEN=

# Optional
OBSIDIAN_PLAN_DIRS=
ALLOWED_ORIGINS=
```

## Next Steps Priority

**High Priority (Blocking Production):**
1. Deploy na Vercel com domínio configurado
2. Implementar webhooks do Stripe com signature verification
3. Sistema de freemium com limites de colaboradores
4. Remover console.logs e implementar logging apropriado

**Medium Priority (User Experience):**
1. Implementar colaboração em tempo real (Liveblocks)
2. Guest access para visualizar reviews sem login
3. Sistema de undo/redo para anotações
4. Sistema i18n (separar português de hardcoded strings)

**Low Priority (Future):**
1. Cores personalizáveis pelo usuário
2. Auditoria UX completa
3. Testes automatizados para features críticas
4. Performance otimizada (React.memo, virtual scrolling)

---
*Last updated: 2026-02-08*
*Overall progress: 66.7% (30/45 requirements)*
