# Obsidian Note Reviewer

## What This Is

Ferramenta de revisão visual de notas do Obsidian e planos para agentes de IA com integração Claude Code. Usuários podem revisar visualmente conteúdo (notas, planos), fazer anotações (edições, comentários, exclusões, marcações) e enviar feedback estruturado de volta para o Claude Code ou colaboradores.

## Core Value

**Usuários podem revisar visualmente notas e planos, com integração perfeita com Claude Code e colaboração em tempo real.**

Se isso não funcionar, nada mais importa.

## Requirements

### Validated

<!-- Recursos existentes que funcionam -->

- ✓ Interface de revisão visual com markdown rendering — existing
- ✓ Sistema de anotações (destaques, comentários, edições) — existing
- ✓ Estrutura monorepo com apps hook/portal/marketing — existing
- ✓ Stack TypeScript + React + Vite + Bun — existing
- ✓ Sanitização de conteúdo com DOMPurify — existing
- ✓ Path validation para segurança (path traversal) — existing

### Active

<!-- O que precisamos construir/evoluir -->

**Integração Claude Code:**
- [ ] Hook que abre o reviewer automaticamente ao criar nota no Obsidian
- [ ] Hook que abre o reviewer automaticamente ao ativar plan mode no Claude Code
- [ ] Envio de anotações estruturadas de volta ao Claude Code (edições, comentários globais/individuais, exclusões, marcações)
- [ ] Prompt fixo automático que formata as revisões para o Claude Code
- [ ] Campo editável para customizar o prompt antes de enviar

**Autenticação e Usuários:**
- [ ] Sistema de cadastro/login de usuários
- [ ] Gerenciamento de sessões com JWT
- [ ] Perfis de usuário com configurações

**Compartilhamento e Colaboração:**
- [ ] Compartilhamento de reviews com URL amigável (slug-based: r.alexdonega.com.br/plan/nome-do-plano)
- [ ] Multi-usuário podem ver e revisar planos compartilhados
- [ ] Controle de permissões (criador vs colaborador)
- [ ] Atividade em tempo real (edições, comentários)

**Configurações (DENTRO do editor):**
- [ ] Painel de configurações integrado no editor (não é página separada /settings)
- [ ] Autenticação (conta, login, cadastro, logout) dentro do editor
- [ ] Preferências (theme dark/light, notificações) acessíveis via modal/sidebar no editor
- [ ] Integrações (chaves de API do Obsidian/Claude) configuradas no editor
- [ ] Local para salvar notas (vault Obsidian vs nuvem vs ambos)
- [ ] Prompt customizável para integração Claude Code
- [ ] **IMPORTANTE:** Não existe página /settings nem /dashboard — tudo fica no editor

**Monetização (Stripe):**
- [ ] Modelo freemium funcional
- [ ] Plano free: uso individual sem colaboradores
- [ ] Plano pago: colaboradores + recursos avançados + suporte
- [ ] Assinatura lifetime disponível
- [ ] Configuração completa do Stripe (webhooks, checkout, billing)

**Deploy e Domínio:**
- [ ] Deploy na Vercel com domínio r.alexdonega.com.br
- [ ] Configuração de subdomínio e DNS
- [ ] URLs amigáveis com slug para compartilhamento
- [ ] Ambiente de produção configurado

**Design e UX:**
- [ ] Design minimalista estilo Apple/macOS
- [ ] Theme system (dark/light mode automático)
- [ ] Cores personalizáveis
- [ ] UX focada em usabilidade
- [ ] Responsivo para mobile

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

- **Aplicativo mobile nativo** — web-first, mobile responsive é suficiente para v1
- **Edição colaborativa em tempo real (tipo Google Docs)** — complexidade alta, não é core
- **Exportação para múltiplos formatos (PDF, DOCX)** — JSON é suficiente para v1
- **Sistema de permissões granulares** — simples (criador vs colaborador) é suficiente
- **Integração com outras ferramentas além de Claude Code/Obsidian** — foco nestes dois
- **Páginas separadas de configurações (/settings, /dashboard)** — todas as configurações ficam DENTRO do editor

## Context

**O que existe hoje:**
- Código base funcional com interface de revisão visual
- Sistema de anotações implementado (mas não integrado com Claude Code)
- Estrutura monorepo com apps e pacotes
- Stack moderna (TypeScript, React, Vite, Bun, Supabase)
- Hooks parciais (PostToolUse, Write) para trigger automático

**Problemas conhecidos:**
- App só funciona em localhost, não está configurado para domínio
- Hook do plan mode não abre o reviewer
- Anotações não são enviadas de forma estruturada para o Claude Code
- Console logs em produção
- Mixed language UI (português hardcoded em componentes)
- Componentes grandes (Viewer.tsx com 1,449 linhas)
- Sistema single-user atualmente

**Usuário alvo:**
- Desenvolvedores que usam Claude Code e querem revisar planos visualmente
- Usuários de Obsidian que querem workflow de revisão visual
- Equipes que colaboram em documentação e planos

## Constraints

- **Tech Stack**: TypeScript + React + Vite + Bun (mantido do código existente)
- **Hospedagem**: Vercel (plano free excelente, fácil deploy)
- **Database**: Supabase (PostgreSQL) — já configurado
- **Auth**: Supabase Auth ou Clerk (verificar qual está melhor integrado)
- **Domínio**: r.alexdonega.com.br (já configurado, precisa apontar para Vercel)
- **Monetização**: Stripe Freemium (free sem colaboradores, pago com lifetime)
- **Design**: Minimalista estilo Apple, dark/light mode

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Manter stack atual (TS/React/Vite/Bun) | Código já existe, é moderno e funcional | — Pending |
| Vercel para hospedagem | Plano free generoso, deploy fácil, bom para Next.js/React | — Pending |
| Subdomínio r.alexdonega.com.br | Domínio já existe, profissional e curto | — Pending |
| Freemium com lifetime | Atrai usuários, receita recorrente + option lifetime | — Pending |
| URLs com slug | Mais amigável e SEO-friendly que IDs/hashes | — Pending |
| Prompt fixo automático + campo editável | Conveniência para maioria, flexibilidade para avançados | — Pending |
| Design estilo Apple/macOS | UX minimalista focada em usabilidade | — Pending |
| **Configurações dentro do editor** | O editor é a página principal, sem /settings nem /dashboard separados. Melhor UX, menos navegação. | ✓ Good |

---
*Last updated: 2026-02-06 after decision to move all settings into editor (no /settings or /dashboard pages)*
