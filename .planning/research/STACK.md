# Technology Stack (Implementado)

**Analysis Date:** 2026-02-08
**Status:** Stack já implementada no código

## Stack Atual (Implementado)

### Core Framework

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| TypeScript | 5.8-5.9 | Type safety | ✅ Implementado |
| React | 19.2.3 | UI framework | ✅ Implementado |
| Vite | 6.2.0 | Build tool | ✅ Implementado |
| Bun | 1.x | Runtime/package manager | ✅ Implementado |
| Tailwind CSS | 4.1.18 | Styling | ✅ Implementado |

**Confidence:** HIGH - Stack está em produção e funcionando

### Backend & Database

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| **Supabase** | Latest | Backend completo (PostgreSQL + Auth + Storage + Edge Functions) | ✅ Implementado |
| Supabase Auth | Latest | Authentication (email/password + OAuth) | ✅ Implementado |
| PostgreSQL | Latest | Database com Row Level Security (RLS) | ✅ Implementado |
| Supabase Storage | Latest | File storage (avatars) | ✅ Implementado |
| Deno | Latest | Runtime para Edge Functions | ✅ Implementado |

**Implementation:**
- `packages/security/src/supabase/client.ts` - Supabase client
- `packages/security/src/supabase/oauth.ts` - GitHub/Google OAuth
- `packages/security/src/supabase/storage.ts` - Avatar upload
- `supabase/migrations/` - Database schema
- `supabase/functions/` - Edge Functions

### Real-time Collaboration (Configurado, Não Integrado)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| **Liveblocks** | 3.13.4 | Real-time collaboration platform | ⚠️ Configurado, não integrado |
| @liveblocks/react | 3.13.4 | React hooks | ⚠️ Configurado, não integrado |
| @liveblocks/node | 3.13.4 | Server SDK | ⚠️ Configurado, não integrado |

**Implementation:**
- `apps/portal/src/lib/liveblocks.ts` - Client configured
- `apps/portal/src/lib/liveblocks-auth.ts` - Auth utilities
- `apps/portal/dev-server.ts` - Dev auth endpoint
- `packages/collaboration/src/` - Integration utilities

**Missing:** Room provider integration, presence tracking, cursor sync

### AI Integration (Básico)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| @anthropic-ai/sdk | 0.32.0 | Claude API | ✅ Implementado (básico) |

**Implementation:**
- `packages/ai/src/suggester.ts` - Annotation suggestions
- `packages/ai/src/summarizer.ts` - Content summarization
- `packages/ai/src/vaultParser.ts` - Obsidian vault parsing

**Note:** AI features não são prioridade para v1, mas implementação básica existe

### Payments (Parcial)

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| **Stripe** | Latest | Payment processing | ⚠️ 40% Complete |
| stripe (Node SDK) | Latest | Server-side API | ✅ Implementado |
| @stripe/stripe-js | 8.7.0+ | Browser SDK | ✅ Implementado |
| @stripe/react-stripe-js | 5.6.0+ | React components | ✅ Implementado |

**Implementation:**
- `packages/api/lib/stripe.ts` (547 lines) - Core Stripe service
- `packages/api/routes/webhooks/stripe.ts` (491 lines) - Webhook handlers
- `apps/portal/src/pages/Pricing.tsx` - Pricing page
- `apps/portal/src/hooks/useStripeCheckout.ts` - Checkout flow
- `apps/portal/src/hooks/useSubscription.ts` - Subscription management

**Missing:** Webhook signature verification, freemium enforcement

### Security

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| **DOMPurify** | 3.3.1 | XSS sanitization | ✅ Implementado |
| isomorphic-dompurify | 2.22.0 | Universal DOMPurify | ✅ Implementado |
| Custom CSP plugin | - | Content Security Policy | ✅ Implementado |

**Implementation:**
- `packages/ui/utils/sanitize.ts` - HTML sanitization
- `packages/security/csp.ts` - CSP policy generation
- `packages/security/vite-plugin-csp.ts` - Vite CSP plugin

### Logging

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| **Pino** | 10.1.0 | Structured logging | ⚠️ Configurado, não usado consistentemente |
| pino-pretty | 13.1.3 | Pretty log output | ✅ Implementado |

**Implementation:**
- `packages/core/src/logger/` - Logger implementation
- Console.log ainda usado em produção (needs cleanup)

### Rate Limiting

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| **Upstash Redis** | 1.36.0 | Rate limiting cache | ✅ Implementado |
| @upstash/ratelimit | 2.0.7 | Rate limiting algorithm | ✅ Implementado |

**Implementation:**
- `supabase/functions/_shared/rate-limiter.ts` (222 lines)
- Used by Edge Functions (batch-operations, process-note)

### Error Tracking

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| **Sentry** | 10.32.1 | Error tracking | ⚠️ Configurado (Vite plugin) |

**Implementation:**
- `packages/ui/lib/sentry.ts` - Sentry integration
- Vite plugin configured

### Development Tools

| Tool | Purpose | Status |
|------|---------|--------|
| Bun | Package manager/runtime | ✅ Implementado |
| ESLint | Linting (TypeScript + React) | ✅ Implementado |
| Vitest | Testing | ✅ Implementado |
| Happy DOM | Test environment | ✅ Implementado |
| Testing Library | React testing | ✅ Implementado |

### Deployment (Configurado, Não Deployado)

| Technology | Purpose | Status |
|------------|---------|--------|
| **Vercel** | Frontend deployment | ⚠️ Configurado, não deployado |
| Vercel.json | Deployment config | ✅ Implementado |

**Implementation:**
- `vercel.json` - Deployment configuration
- `apps/portal/vite.config.ts` - Build config
- `apps/marketing/vite.config.ts` - Marketing build
- `apps/hook/vite.config.ts` - Single-file build

**Missing:** Deploy realizado, domínio configurado

## UI Components

### Markdown & Rendering

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| react-markdown | 10.1.0 | Markdown rendering | ✅ Implementado |
| react-syntax-highlighter | 16.1.0 | Code highlighting | ✅ Implementado |
| remark-gfm | 4.0.1 | GitHub Flavored Markdown | ✅ Implementado |
| mermaid | 11.12.2 | Diagram rendering | ✅ Implementado |

### Annotation & Editing

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| web-highlighter | 0.7.4 | Text annotations | ✅ Implementado |
| perfect-freehand | 1.2.2 | Freehand drawing | ✅ Implementado |
| react-mentions | 4.4.10 | @mentions | ✅ Implementado |
| diff | 8.0.3 | Text diffing | ✅ Implementado |
| react-diff-viewer-continued | 4.1.0 | Diff visualization | ✅ Implementado |

### Utilities

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| date-fns | 4.1.0 | Date formatting | ✅ Implementado |
| idb | 8.0.3 | IndexedDB wrapper | ✅ Implementado |
| js-yaml | 4.1.1 | YAML parsing | ✅ Implementado |
| nanoid | 5.0.9 | Unique ID generation | ✅ Implementado |
| color-hash | 2.0.2 | Color from string | ✅ Implementado |
| unique-username-generator | 1.5.1 | Username generation | ✅ Implementado |
| zustand | 5.0.9 | State management | ✅ Implementado |
| react-router-dom | 7.11.0-7.13.0 | Routing | ✅ Implementado |
| i18next | 25.8.4 | Internationalization | ⚠️ Configurado, não usado |
| react-i18next | 16.5.4 | React i18n bindings | ⚠️ Configurado, não usado |
| web-vitals | 5.1.0 | Performance metrics | ✅ Implementado |

### Icons

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| lucide-react | 0.460.0 | Icon library | ✅ Implementado |

## Monorepo Structure

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

## Environment Variables

**Required:**
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

## Installation

```bash
# Clone repository
git clone <repo-url>
cd obsidian-note-reviewer

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your values

# Run development servers
bun run dev          # All apps
bun run dev:hook     # Hook app only (port 3000)
bun run dev:portal   # Portal app only (port 3001)
bun run dev:marketing # Marketing app only (port 3002)
```

## Build & Deploy

```bash
# Build for production
bun run build

# Run tests
bun test
bun test --coverage

# Deploy to Vercel (requires setup)
vercel deploy
```

## Version Compatibility

| Package | Version | Notes |
|---------|---------|-------|
| React | 19.2.3 | Latest, stable for production |
| Vite | 6.2.0 | Latest stable |
| Bun | 1.x | Latest 1.x |
| Supabase Client | 2.89.0 | Modern v2 client |
| Liveblocks | 3.13.4 | Latest stable |
| Stripe SDK | Latest (API 2024-11-20.acacia) | Current API version |
| TypeScript | 5.8-5.9 | Latest stable |

## Known Issues

1. **React 19 Compatibility:** Some editor packages may have issues, but current stack is stable
2. **Liveblocks Integration:** Configured but not fully integrated in the UI
3. **i18n:** Configured but not used (hardcoded Portuguese strings)
4. **Logging:** Pino configured but console.log still used in production
5. **Testing:** Test coverage exists (26 files) but gaps remain

## Migration Notes

**No migrations needed** - Current stack is modern and stable. Future considerations:
- Monitor React 19 ecosystem maturity for editor packages
- Evaluate Liveblocks alternatives if integration issues arise
- Consider upgrading to Supabase v3 when available (breaking changes)

---

*Stack analysis: 2026-02-08*
*Based on full codebase audit*
