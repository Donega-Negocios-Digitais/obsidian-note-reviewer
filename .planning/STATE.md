# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2025-02-04)

**Core value:** Usuários podem revisar visualmente notas e planos, com integração perfeita com Claude Code e colaboração em tempo real.
**Current focus:** Phase 1 - Authentication

## Current Position

Phase: 1 of 13 (Authentication)
Plan: 3 of 6 in current phase
Status: In progress
Last activity: 2026-02-05 — Completed Plan 01-03: Auth UI with split-screen layout and OAuth buttons

Progress: [███░░░░░░░░] 50%

## Performance Metrics

**Velocity:**
- Total plans completed: 3
- Average duration: 7 min
- Total execution time: 0.3 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01    | 3     | 6     | 7 min    |

**Recent Trend:**
- Last 5 plans: 01-01 (6 min), 01-02 (7 min), 01-03 (8 min)
- Trend: Fast execution, clean build

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

**From 01-01 (Vite SPA Auth Infrastructure):**
- Use @supabase/supabase-js browser client (NOT @supabase/ssr for Next.js)
- Session persisted in localStorage (not httpOnly cookies - SPA pattern)
- Vite env var convention (VITE_* prefix) instead of Next.js (NEXT_PUBLIC_*)
- Auth utilities placed in Security package per existing architecture
- AuthProvider wraps entire Portal app for global auth context

**From 01-02 (Session Management):**
- Window focus listener refreshes session when user returns to tab
- Periodic session refresh every 15 minutes (Supabase tokens last 1 hour)
- Session utilities provide proactive expiry warnings and validation
- Debug hooks verify localStorage persistence works correctly

**From 01-03 (Auth UI):**
- Split-screen layout: branding left, form right (hidden on mobile)
- Google is primary OAuth provider (button appears first)
- OAuth button text: "Entrar com Google" and "Entrar com GitHub"
- Dedicated auth pages at /auth/login and /auth/signup (not modals)
- Toggle between login/signup via links ("Não tem conta? Cadastre-se" / "Já tem conta? Faça login")
- ProtectedRoute wrapper redirects unauthenticated users to /auth/login
- PublicRoute wrapper redirects authenticated users to /dashboard
- Inline error display (not toast notifications) for simpler SPA UX

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-05 02:23
Stopped at: Completed 01-03 - Auth UI with split-screen layout and OAuth buttons
Resume file: None
