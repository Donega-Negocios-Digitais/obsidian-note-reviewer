# Technology Stack

**Domain:** Visual Markdown Review/Edit Tools with Claude Code Integration
**Researched:** 2026-02-04
**Overall Confidence:** MEDIUM

## Executive Summary

This stack builds upon the existing TypeScript + React + Vite + Bun + Supabase foundation, adding capabilities for real-time collaboration, Claude Code integration, and Stripe monetization. The existing stack is solid and modern for 2025/2026 - we're extending it, not replacing it.

**Key architectural decisions:**
- **Keep existing stack** - No migration needed, build on what works
- **Add specialized collaboration layer** - Liveblocks for real-time features (not Supabase Realtime, which isn't designed for multiplayer text editing)
- **Use MCP for Claude Code integration** - Standard protocol for AI-tool integration
- **Monetization via Stripe** - Industry standard with excellent React/TypeScript support
- **Vercel for deployment** - Seamless integration with existing stack

## Recommended Stack

### Core Framework (Preserve Existing)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| TypeScript | 5.x | Type safety | Industry standard; prevents runtime errors in collaborative apps |
| React | 18.x | UI framework | Wait for 19.x - editor ecosystem still catching up (see React 19 Compatibility section) |
| Vite | Latest | Build tool | Fast dev experience; excellent HMR for editor development |
| Bun | Latest | Runtime/package manager | 10-20x faster than npm; modern alternative to Node.js |
| Supabase | Latest | Backend/auth | Excellent auth + RLS; keep as persistent storage layer |

**Confidence:** HIGH - Existing stack is proven and current

### Real-Time Collaboration (NEW)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Liveblocks** | 3.13.2+ | Real-time collaboration platform | Complete solution: presence, cursors, storage, Yjs integration; enterprise-ready |
| **Yjs** | 13.6.29+ | CRDT engine for conflict resolution | Industry standard for collaborative editing; Liveblocks uses it under the hood |
| @liveblocks/react | 3.13.2+ | React hooks for Liveblocks | Official React bindings; actively maintained |
| @liveblocks/react-lexical | 3.10.1+ | Lexical editor integration | Pre-built collaborative Lexical components |

**Why NOT Supabase Realtime:** Supabase Realtime is primarily for database synchronization, not complex collaborative text editing. For multiplayer text editors, you need specialized CRDT-based solutions like Yjs or Liveblocks that handle operational transformation and conflict resolution.

**Confidence:** HIGH - Liveblocks + Yjs is the established pattern for 2025 collaborative editors

### Visual Markdown Editor (NEW)

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| **Lexical** | 0.39.0 | Rich text editor framework | Most extensible; Meta/Facebook-backed; excellent markdown support |
| @lexical/react | 0.39.0 | React components for Lexical | Required for React integration |
| @lexical/yjs | 0.38.2 | Yjs CRDT integration | Enables collaborative editing via Liveblocks |
| @lexical/markdown | Latest | Markdown import/export | Seamless markdown conversion |

**Alternative (Simpler):** @uiw/react-md-editor - If you don't need rich collaborative features and want a simpler markdown-only editor.

**Confidence:** MEDIUM - Lexical is powerful but complex; verify team has capacity for custom editor work

### Claude Code Integration (NEW)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **MCP (Model Context Protocol)** | Latest | Claude Code integration standard | Official Anthropic open standard; enables tool/data source connections |
| MCP Server SDK | Latest | Build custom MCP servers | Exposes your app's features to Claude Code |
| @anthropic-ai/sdk | Latest | Direct Anthropic API calls | For features beyond MCP capabilities |

**Integration Pattern:**
1. Build an MCP server that exposes note review capabilities
2. Package as a Claude Code plugin/skill
3. Users install plugin to connect Claude Code to your app

**Confidence:** HIGH - MCP is the official standard; documented by Anthropic

### Authentication & Security (Preserve + Extend)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Supabase Auth** | Latest | Authentication | Already in stack; excellent RLS support |
| **Row Level Security (RLS)** | Latest | Data authorization | Defense in depth; proven pattern for multi-tenant apps |
| Clerk Auth | Latest | Alternative to Supabase Auth | Consider if you need more complex auth flows; Supabase Auth is sufficient for most cases |

**Confidence:** HIGH - Supabase Auth + RLS is battle-tested for 2025

### Stripe Monetization (NEW)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| @stripe/stripe-js | 8.7.0+ | Stripe.js loading utility | Official Stripe SDK for browser |
| @stripe/react-stripe-js | 5.6.0+ | React components | Official React wrapper around Stripe Elements |
| stripe (Node SDK) | Latest | Server-side Stripe API | For webhook handling and subscription management |
| @types/stripe | Latest | TypeScript types | Type safety for Stripe API |

**Implementation Pattern:**
- Vercel Edge Functions for webhook endpoints
- Supabase for subscription state persistence
- Stripe Customer Portal for self-service plan management

**Confidence:** HIGH - Stripe's React SDK is mature and well-documented

### Security (Preserve Existing)

| Technology | Version | Purpose | When to Use |
|------------|---------|---------|-------------|
| **DOMPurify** | 3.3.1+ | XSS sanitization | Already in stack; essential for user-generated content |
| @types/dompurify | 3.2.0 | TypeScript types | Required for type safety |

**Confidence:** HIGH - DOMPurify is the industry standard for XSS prevention

### Logging (Preserve Existing)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| **Pino** | 10.3.0+ | JSON logging | Already in stack; fastest logger for Node.js |
| pino-http | Latest | HTTP request logging | Automatic request/response logging |

**Confidence:** HIGH - Pino remains the fastest Node.js logger in 2025

### Development Tools (Preserve Existing)

| Tool | Purpose | Notes |
|------|---------|-------|
| Bun | Package manager/runtime | Use `bun install` instead of `npm install` |
| ESLint | Linting | Configure for React + TypeScript |
| Prettier | Code formatting | Standard formatter |
| Vitest | Testing | Built for Vite; faster than Jest |

### Deployment (NEW)

| Technology | Purpose | Why Recommended |
|------------|---------|-----------------|
| **Vercel** | Frontend deployment | Best-in-class DX; automatic previews; Edge Functions for Stripe webhooks |
| Vercel Marketplace - Supabase | Supabase integration | Auto-configure environment variables for preview deployments |
| Vercel Marketplace - Stripe | Stripe sandbox | Test payments in Vercel preview deployments |

**Custom Domains:**
- Configure via Vercel project settings
- DNS A records point to Vercel
- Automatic SSL/TLS certificates

**Confidence:** HIGH - Vercel + Supabase integration is official and mature

## Installation

```bash
# Core (already installed)
# TypeScript, React, Vite, Bun, Supabase, DOMPurify, Pino

# Real-time collaboration
bun add @liveblocks/react @liveblocks/react-lexical yjs

# Visual markdown editor
bun add @lexical/react @lexical/yjs @lexical/markdown @lexical/list @lexical/link @lexical/rich-text lexical

# Stripe integration
bun add @stripe/stripe-js @stripe/react-stripe-js
bun add -D @types/stripe stripe

# Claude Code MCP integration
bun add @anthropic-ai/sdk
# MCP server implementation typically uses Node.js standard library

# Deployment (no install needed - Vercel handles)
```

## Alternatives Considered

### Real-Time Collaboration

| Recommended | Alternative | Why Not Recommended |
|-------------|-------------|---------------------|
| Liveblocks | Supabase Realtime only | Not designed for multiplayer text editing; lacks conflict resolution |
| Liveblocks | Yjs only | More infrastructure to build; Liveblocks provides managed Yjs + features |
| Liveblocks | Hocuspocus + Yjs | More self-hosted complexity; Liveblocks is fully managed |

**Use Yjs only if:** You need complete self-hosting and have DevOps capacity for managing infrastructure.

### Visual Markdown Editor

| Recommended | Alternative | Why Not Recommended |
|-------------|-------------|---------------------|
| Lexical | Slate.js | Slate is more flexible but requires more custom code; Lexical has better React integration |
| Lexical | @uiw/react-md-editor | Simpler but less extensible; harder to add collaborative features |
| Lexical | TipTap | Excellent option if you prefer ProseMirror over Lexical; both are valid choices |
| Lexical | Draft.js | Deprecated by Meta; use Lexical instead |

**Use @uiw/react-md-editor if:** You want simple markdown editing without rich text features or collaboration.

### Authentication

| Recommended | Alternative | Why Not Recommended |
|-------------|-------------|---------------------|
| Supabase Auth | Clerk Auth | Supabase is already in stack; Clerk is better only for complex auth flows (SSO, MFA) |
| Supabase Auth | Auth0 | Overkill for current scope; expensive; Supabase is sufficient |

**Use Clerk if:** You need enterprise auth features like SAML, advanced MFA, or complex user management.

### Deployment

| Recommended | Alternative | Why Not Recommended |
|-------------|-------------|---------------------|
| Vercel | Netlify | Vercel has better Next.js/React integration and Supabase marketplace |
| Vercel | Cloudflare Pages | Less mature Edge Functions; fewer integration options |
| Vercel | Self-hosted | More DevOps overhead; Vercel's free tier is sufficient for MVP |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| react-stripe-elements | Deprecated; replaced by @stripe/react-stripe-js | @stripe/react-stripe-js |
| Draft.js | Deprecated by Meta in favor of Lexical | Lexical |
| Supabase Realtime for text editing | Not designed for CRDT-based conflict resolution | Liveblocks or Yjs |
| Socket.io for collaboration | Reinventing the wheel; more infrastructure to manage | Liveblocks (managed Yjs infrastructure) |
| Zustand/Jotai for global state | For collaborative docs, state must sync with CRDT; avoid separate state layer | Liveblocks room storage + Yjs document |
| React 19 immediately | Editor ecosystem still catching up; some packages report issues | React 18.x until editor ecosystem matures |

## React 19 Compatibility (Important)

As of February 2026, React 19 is relatively new and the markdown editor ecosystem is still catching up:

**Confirmed React 19 Compatible:**
- @abnahid/ab-markdown-editor
- Syncfusion React Rich Text Editor

**Known Issues:**
- uiwjs/react-markdown-editor - Custom HTML tags throw console errors with React 19
- Some Lexical integrations may need verification

**Recommendation:** Stick with React 18.x until the editor ecosystem fully validates React 19 compatibility. The migration path will be straightforward when ready.

## Stack Patterns by Variant

### If prioritizing simplicity over custom editor:
- Use @uiw/react-md-editor instead of Lexical
- Use Liveblocks presence + comments, skip full document collaboration
- Result: Faster MVP, less custom code

### If prioritizing complete customizability:
- Use Yjs directly without Liveblocks
- Build own collaboration infrastructure (self-hosted WebSocket server)
- Result: Maximum control, more DevOps overhead

### If building for enterprise from day one:
- Use Clerk Auth instead of Supabase Auth
- Add Stripe Tax for automatic tax calculation
- Use Vercel Enterprise for compliance features
- Result: Enterprise-ready, higher monthly costs

## Version Compatibility

| Package A | Compatible With | Notes |
|-----------|-----------------|-------|
| @liveblocks/react 3.13.x | React 17+ | Official requirement |
| Lexical 0.39.x | React 17+ | Verify with React 19 before upgrading |
| @stripe/react-stripe-js 5.6.x | React 16.8+ | Hooks requirement |
| Supabase Client 2.x | React 18+ | Modern client SDK |

## Integration Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Vercel Edge                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                 Frontend (React)                      │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │  │
│  │  │   Lexical   │  │  Liveblocks │  │   Stripe     │  │  │
│  │  │   Editor    │  │ Collaboration│  │   Elements   │  │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                           ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Vercel Edge Functions                        │  │
│  │  ┌─────────────┐  ┌─────────────┐                    │  │
│  │  │ Stripe      │  │ Custom API  │                    │  │
│  │  │ Webhooks    │  │ Endpoints   │                    │  │
│  │  └─────────────┘  └─────────────┘                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      Supabase                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Auth + RLS  │  │ PostgreSQL  │  │     Storage         │ │
│  │             │  │             │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server (Separate)                    │
│  Exposes note review capabilities to Claude Code            │
└─────────────────────────────────────────────────────────────┘
```

## Sources

### Visual Markdown Editing
- [Build Full-Featured Rich Text Editors in React (Lexical) - Dev.to (Sep 2025)](https://dev.to/codeideal/build-full-featured-rich-text-editors-in-react-lexical-lexkit--4p18) - MEDIUM confidence
- [Lexical + React Documentation - Official](https://lexical.dev/docs/react/) - HIGH confidence
- [Lexical Markdown Documentation - Official](https://lexical.dev/docs/packages/lexical-markdown) - HIGH confidence
- [5 Best Markdown Editors for React Compared - Strapi](https://strapi.io/blog/top-5-markdown-editors-for-react) - MEDIUM confidence
- [React 19 Compatibility Discussion - Reddit](https://www.reddit.com/r/reactjs/comments/1l1auqm/which_rich_text_editor_is_compatible_with_react_19/) - MEDIUM confidence

### Real-Time Collaboration
- [Which rich text editor framework should you choose in 2025? - Liveblocks Blog (Feb 2025)](https://liveblocks.io/blog/which-rich-text-editor-framework-should-you-choose-in-2025) - HIGH confidence
- [Building Real-Time Collab Editors with Next.js 15 & Yjs - ReactLibraries.com (Nov 2025)](https://www.reactlibraries.com/tutorials/building-real-time-collab-editors-with-next-js-15-yjs) - MEDIUM confidence
- [Liveblocks vs Yjs Comparison - LibHunt](https://www.libhunt.com/compare/yjs-vs-liveblocks) - MEDIUM confidence
- [Supabase Realtime vs Yjs/Liveblocks Discussion - Reddit](https://www.reddit.com/r/Supabase/) - MEDIUM confidence (community consensus)

### Claude Code Integration
- [Connect Claude Code to tools via MCP - Official Claude Code Docs](https://code.claude.com/docs/en/mcp) - HIGH confidence
- [Introducing the Model Context Protocol - Anthropic (Nov 2024)](https://www.anthropic.com/news/model-context-protocol) - HIGH confidence
- [Code execution with MCP - Anthropic Engineering (Nov 2025)](https://www.anthropic.com/engineering/code-execution-with-mcp) - HIGH confidence
- [What is the Model Context Protocol? - Official MCP Site](https://modelcontextprotocol.io/) - HIGH confidence
- [Creating an API generator plugin for Claude Code - Dev.to (Oct 2025)](https://dev.to/claudye/creating-an-api-generator-plugin-for-claude-code-256e) - MEDIUM confidence

### Stripe Integration
- [Integrate a SaaS business on Stripe - Official Stripe Docs](https://docs.stripe.com/saas) - HIGH confidence
- [React Stripe.js reference - Official Stripe Docs](https://docs.stripe.com/sdks/stripejs-react) - HIGH confidence
- [Stripe.js versioning and support policy - Official Stripe Docs](https://docs.stripe.com/sdks/stripejs-versioning) - HIGH confidence
- [@stripe/stripe-js NPM - Version 8.7.0](https://www.npmjs.com/package/@stripe/stripe-js) - HIGH confidence
- [@stripe/react-stripe-js NPM - Version 5.6.0](https://www.npmjs.com/package/@stripe/react-stripe-js) - HIGH confidence

### Vercel Deployment
- [Adding & Configuring a Custom Domain - Vercel Docs (Updated Sep 2025)](https://vercel.com/docs/domains/working-with-domains/add-a-domain) - HIGH confidence
- [Working with Domains - Vercel Docs (Updated Nov 2025)](https://vercel.com/docs/domains/working-with-domains) - HIGH confidence
- [Vercel vs Supabase: What's the Difference in 2025? - UI Bakery (Jun 2025)](https://uibakery.io/blog/vercel-vs-supabase) - MEDIUM confidence
- [Deploy a Scalable Backend for Free (Supabase + Vercel Edge) - Medium (2025)](https://medium.com/@atnoforwebdev/deploy-a-scalable-backend-for-free-in-2025-supabase-vercel-edge-9ea05e9559f4) - MEDIUM confidence
- [Stripe for Vercel - Vercel Marketplace](https://vercel.com/marketplace/stripe) - HIGH confidence
- [Supabase for Vercel - Vercel Marketplace](https://vercel.com/marketplace/supabase) - HIGH confidence
- [How to Configure Stripe Webhooks for Your Serverless SaaS - ScaleToZero (Jun 2025)](https://scaletozeroaws.com/blog/stripe-webhooks-serverless-saas) - MEDIUM confidence

### Existing Stack Components
- [The Ultimate React Stack for 2025 - JavaScript Plain English (Aug 2025)](https://javascript.plainenglish.io/the-ultimate-react-stack-for-2025-a-developer-guide-f8082bb508af) - MEDIUM confidence
- [Complete Guide to Setting Up React with TypeScript and Vite 2025 - Medium](https://medium.com/@robinviktorsson/complete-guide-to-setting-up-react-with-typescript-and-vite-2025-468f6556aaf2) - MEDIUM confidence
- [Building React Apps with Bun: Modern Development Experience - Telerik (Aug 2025)](https://www.telerik.com/blogs/building-react-apps-bun-modern-development-experience) - MEDIUM confidence
- [Supabase Security Retro: 2025 - Official Supabase Blog (Jan 2026)](https://supabase.com/blog/supabase-security-2025-retro) - HIGH confidence
- [RLS Performance and Best Practices - Supabase Docs (Apr 2025)](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) - HIGH confidence
- [Row Level Security - Supabase Docs](https://supabase.com/docs/guides/database/postgres/row-level-security) - HIGH confidence
- [DOMPurify NPM - Version 3.3.1](https://www.npmjs.com/package/dompurify) - HIGH confidence
- [Pino NPM - Version 10.3.0](https://www.npmjs.com/package/pino) - HIGH confidence

### Package Versions Verified
- [@liveblocks/react NPM - Version 3.13.2](https://www.npmjs.com/package/@liveblocks/react) - HIGH confidence
- [yjs NPM - Version 13.6.29](https://www.npmjs.com/package/yjs) - HIGH confidence
- [@lexical/react NPM - Version 0.39.0](https://www.npmjs.com/package/@lexical/react) - HIGH confidence
- [GitHub Releases: facebook/lexical](https://github.com/facebook/lexical/releases) - HIGH confidence

---

*Stack research for: Obsidian Note Reviewer with Claude Code Integration*
*Researched: 2026-02-04*
*Confidence: MEDIUM (Stack components verified via official docs, integration patterns based on 2025 ecosystem research)*
