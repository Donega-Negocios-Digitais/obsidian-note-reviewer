# Technology Stack

**Analysis Date:** 2025-02-08

## Languages

**Primary:**
- TypeScript 5.8.2 - 5.9.3 - All apps and packages
- JavaScript - Utility scripts and Supabase Edge Functions

**Secondary:**
- SQL - PostgreSQL database migrations in `C:\dev\tools\obsidian-note-reviewer\supabase\migrations\`
- Shell/PowerShell - Installation scripts, hooks

## Runtime

**Environment:**
- Bun 1.x (latest) - Primary package manager and runtime
- Node.js 20 - Fallback for some tools, GitHub Actions environment

**Package Manager:**
- Bun - `bun install` with isolated linking
- Lockfile: `bun.lock` present

**Development Server:**
- Vite 6.2.0 - Dev server for all apps
- Bun native server (`Bun.serve`) - Hook app server in `C:\dev\tools\obsidian-note-reviewer\apps\hook\server\index.ts`

## Frameworks

**Core:**
- React 19.2.3 - UI library for all applications
- React DOM 19.2.3 - DOM rendering
- Vite 6.2.0 - Build tool and dev server
- Tailwind CSS 4.1.18 - Styling with `@tailwindcss/vite` plugin

**Testing:**
- Bun Test - Built-in test runner (`bun test`)
- Vitest - Alternative test runner with config in `C:\dev\tools\obsidian-note-reviewer\vitest.config.ts`
- Happy DOM 20.0.11 - JSDOM alternative for testing
- Testing Library - `@testing-library/react` 16.3.1, `@testing-library/user-event` 14.6.1

**Build/Dev:**
- TypeScript 5.8.2 - 5.9.3 - Type checking
- ESLint 9.39.2 - Linting with config in `C:\dev\tools\obsidian-note-reviewer\eslint.config.cjs`
- Vite Plugin Singlefile 2.0.3 - Single HTML bundle for hook app

## Key Dependencies

**Critical:**
- @anthropic-ai/sdk 0.32.0 - Claude API integration for AI suggestions in `C:\dev\tools\obsidian-note-reviewer\packages\ai\src\suggester.ts`
- @supabase/supabase-js 2.89.0 - Database and auth client
- @liveblocks/client 3.13.4 - Real-time collaboration
- @liveblocks/react 3.13.4 - React hooks for Liveblocks
- @liveblocks/node 3.13.4 - Server-side Liveblocks

**Infrastructure:**
- @upstash/redis 1.36.0 - Redis caching and rate limiting
- @upstash/ratelimit 2.0.7 - Rate limiting for Supabase Edge Functions in `C:\dev\tools\obsidian-note-reviewer\supabase\functions\_shared\rate-limiter.ts`
- @sentry/react 10.32.1 - Error tracking in `C:\dev\tools\obsidian-note-reviewer\packages\ui\lib\sentry.ts`
- pino 10.1.0 - Structured logging
- pino-pretty 13.1.3 - Pretty log output

**UI Components:**
- lucide-react 0.460.0 - Icon library
- react-diff-viewer-continued 4.1.0 - Diff visualization
- react-markdown 10.1.0 - Markdown rendering
- react-syntax-highlighter 16.1.0 - Code syntax highlighting
- remark-gfm 4.0.1 - GitHub Flavored Markdown
- mermaid 11.12.2 - Diagram rendering
- react-mentions 4.4.10 - @mention functionality
- web-highlighter 0.7.4 - Text highlighting
- perfect-freehand 1.2.2 - Freehand drawing
- diff 8.0.3 - Text diffing

**Utilities:**
- date-fns 4.1.0 - Date formatting
- idb 8.0.3 - IndexedDB wrapper
- js-yaml 4.1.1 - YAML parsing
- nanoid 5.0.9 - Unique ID generation
- color-hash 2.0.2 - Color from string
- unique-username-generator 1.5.1 - Username generation
- dompurify 3.3.1 - HTML sanitization
- isomorphic-dompurify 2.22.0 - Isomorphic DOMPurify
- zustand 5.0.9 - State management
- react-router-dom 7.11.0 - 7.13.0 - Routing
- i18next 25.8.4 - Internationalization
- react-i18next 16.5.4 - React i18n bindings
- web-vitals 5.1.0 - Performance metrics

## Configuration

**Environment:**
- Frontend (portal): `apps/portal/.env.local` or `apps/portal/.env` (gitignored)
- Workspace template: `.env.example` (without secrets)
- Edge template: `supabase/functions/.env.example` (without secrets)
- Vite frontend variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Server-only variables must not use `VITE_` (example: `SUPABASE_SERVICE_ROLE_KEY`)
- Supabase Edge Functions use `Deno.env.get()`
- Security policy: never share a real `.env` via WhatsApp; share `.env.example` and send secrets through a secure channel
- Canonical references: `.planning/ENVIRONMENT.md`, `.planning/SETUP.md`

**Build:**
- Vite configs: `apps/*/vite.config.ts`
- Tailwind CSS via `@tailwindcss/vite` plugin (no separate config)
- TypeScript configs in `apps/*/tsconfig.json`
- Custom CSP plugin in `C:\dev\tools\obsidian-note-reviewer\packages\security\vite-plugin-csp.ts`

**Monorepo:**
- Bun workspaces in `C:\dev\tools\obsidian-note-reviewer\package.json`
- Workspace references: `"workspace:*"`

## Platform Requirements

**Development:**
- Bun 1.x (latest) - Primary runtime
- Node.js 20+ - For some tools and CI
- Git - For version control and hooks

**Production:**
- **Frontend:** Vercel (config in `C:\dev\tools\obsidian-note-reviewer\vercel.json`)
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Static Assets:** AWS S3 + CloudFront (for marketing site)
- **Real-time:** Liveblocks
- **Caching:** Upstash Redis
- **Monitoring:** Sentry

---

*Stack analysis: 2025-02-08*
