# Phase 1: Authentication - Context

**Gathered:** 2025-02-04
**Status:** Ready for planning

## Phase Boundary

Sistema de autenticação multi-usuário que permite criar conta, fazer login, gerenciar sessões e profile. Fundação para todos os recursos colaborativos. Inclui email/password + OAuth (GitHub e Google), persistência de sessão, logout e profile com display name e avatar.

## Implementation Decisions

### OAuth Providers
- Ambos GitHub e Google disponíveis no v1
- Google é primário (primeiro botão, prioridade visual)
- Texto dos botões: "Entrar com Google" / "Entrar com GitHub"
- Email é marcado como "não verificado" mas funcional (sem bloqueio)

### Onboarding Flow
- **Signup → Welcome page** com tutorial introdutório
- **Primeiro login → Dashboard direto** (sem onboarding repetido)
- Welcome page tem botão "Pular" disponível
- Display name e avatar são **obrigatórios** durante onboarding
- Email verification: marcar como "não verificado" mas não bloquear funcionalidades

### Auth UI/UX
- Login/Signup são **páginas dedicadas** (/login, /signup), não modais
- Alternar entre login/signup via **links separados** ("Não tem conta? Cadastre-se")
- Layout **split screen**: metade tela form, metade imagem/branding
- Logout **requer confirmação** (dialog "Tem certeza?")
- Estilo: minimalista, alinhado com design system Apple que será definido

### Profile Management
- Profile editável após signup
- Display name e avatar obrigatórios no cadastro
- Avatar: upload de imagem ou gravatar (você decide na implementação)

### Claude's Discretion
- Implementação exata de avatar upload (gravatar vs upload direto)
- Design específico da welcome page (layout, conteúdo)
- Tratamento de erros de OAuth (usuário cancela, credentials inválidas)
- Texto exato das mensagens de erro
- Duração da sessão JWT (token expiration)
- Implementação de reset de senha (fluxo não discutido, mas padrão esperado)

## Specific Ideas

- "Quero que o Google seja primário porque mais pessoas têm conta Google"
- "Welcome page deve mostrar o valor principal da ferramenta - revisão visual"
- "Split screen com branding ao lado fica mais profissional"

## Deferred Ideas

- Tutorial interativo detalhado — v2 ou após validação
- SSO enterprise (SAML, Okta) — fase posterior
- 2FA / autenticação de dois fatores — v2
- Multiple OAuth providers (Microsoft, etc.) — v2

---

*Phase: 01-authentication*
*Context gathered: 2025-02-04*
