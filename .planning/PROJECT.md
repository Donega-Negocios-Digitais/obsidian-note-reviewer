# Obsidian Note Reviewer

## What This Is

Ferramenta de revisão visual de notas do Obsidian e planos para agentes de IA com integração Claude Code. Usuários podem revisar visualmente conteúdo (notas, planos), fazer anotações (edições, comentários, exclusões, marcações) e enviar feedback estruturado de volta para o Claude Code ou colaboradores.

## Core Value

**Usuários podem revisar visualmente notas e planos, com integração perfeita com Claude Code e colaboração em tempo real.**

Se isso não funcionar, nada mais importa.

## Requirements

### Validated (✅ Complete)

<!-- Recursos existentes que funcionam -->

- ✓ Interface de revisão visual com markdown rendering — existing
- ✓ Sistema de anotações (destaques, comentários, edições) — existing
- ✓ Estrutura monorepo com apps hook/portal/marketing — existing
- ✓ Stack TypeScript + React + Vite + Bun — existing
- ✓ Sanitização de conteúdo com DOMPurify — existing
- ✓ Path validation para segurança (path traversal) — existing
- ✓ **Autenticação completa** (Supabase Auth, login/signup, OAuth) — ✅ 2026-02-07
- ✓ **Integração Claude Code completa** (hooks, export, prompt editor) — ✅ 2026-02-05
- ✓ **Configurações dentro do editor** (SettingsPanel, sem /settings ou /dashboard) — ✅ 2026-02-07
- ✓ **Theme system** (dark/light mode automático) — existing

### Active (⚠️ In Progress)

<!-- O que precisamos construir/evoluir -->

**Colaboração em Tempo Real:**
- [ ] Indicadores de presença de outros usuários
- [ ] Cursores e avatares em tempo real (Liveblocks)
- [ ] Multi-usuário podem ver e revisar planos compartilhados
- [ ] Guest access permite visualizar reviews sem login
- [ ] Workflow nativo com Obsidian vault (acesso local)

**Compartilhamento (Parcial):**
- [x] URLs amigáveis com slug (SharedDocument.tsx existe) — ✅ 2026-02-07
- [ ] Multi-usuário podem ver e revisar planos compartilhados
- [ ] Controle de permissões (criador vs colaborador)
- [ ] Atividade em tempo real (edições, comentários)

**Monetização Stripe (Parcial):**
- [ ] Modelo freemium funcional
- [ ] Plano free: uso individual sem colaboradores
- [ ] Plano pago: colaboradores + recursos avançados + suporte
- [x] Assinatura lifetime disponível (Pricing.tsx) — ✅ 2026-02-07
- [x] Configuração Stripe checkout (useStripeCheckout) — ✅ 2026-02-07
- [ ] Webhooks do Stripe com signature verification
- [ ] Sistema de freemium com limites de colaboradores

**Deploy e Domínio:**
- [ ] Deploy na Vercel
- [ ] Domínio r.alexdonega.com.br configurado
- [ ] Configuração de subdomínio e DNS
- [ ] Ambiente de produção configurado

**Design e UX (Parcial):**
- [x] Design minimalista estilo Apple/macOS — existing
- [x] Theme system (dark/light mode automático) — ✅ 2026-02-07
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

<!-- O que não vamos fazer agora -->

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

**O que existe hoje:**
- ✓ Código base funcional com interface de revisão visual
- ✓ Sistema de anotações implementado e integrado
- ✓ Estrutura monorepo com apps e pacotes
- ✓ Stack moderna (TypeScript, React, Vite, Bun, Supabase)
- ✓ Hooks completos (PostToolUse, Write) para trigger automático
- ✓ Autenticação completa com Supabase
- ✓ Configurações integradas no editor
- ✓ Theme system com dark/light mode

**Problemas conhecidos:**
- App só funciona em localhost, não está configurado para domínio
- Colaboração em tempo real não implementada
- Sistema de freemium não implementado
- Console logs em produção
- Mixed language UI (português hardcoded em componentes)
- Componentes grandes (Viewer.tsx com 1,449 linhas)

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

---
*Last updated: 2026-02-07 after removing Advanced AI, Multi-Document Review, and Mobile Support from roadmap*
