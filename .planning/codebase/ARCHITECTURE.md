# Architecture

**Analysis Date:** 2025-02-08

## Pattern Overview

**Overall:** Bun Monorepo with Workspace Packages Architecture

**Key Characteristics:**
- Bun workspaces structure for code sharing
- TypeScript-based with Vite as build tool
- Three main applications: hook (Claude Code integration), portal (web dashboard), marketing (landing pages)
- Shared packages for common functionality (ui, editor, security, ai, collaboration)
- Multi-platform support (web, desktop via Bun server)

## Layers

**Hook Layer (Claude Code Integration):**
- Purpose: Provides PostToolUse hook integration for Claude Code
- Location: `C:\dev\tools\obsidian-note-reviewer\apps\hook\`
- Contains: Bun server, single-page React app, plugin hooks
- Depends on: @obsidian-note-reviewer/editor, @obsidian-note-reviewer/ui, @obsidian-note-reviewer/security
- Used by: Claude Code via PostToolUse hook

**Portal Layer (Web Dashboard):**
- Purpose: Web-based dashboard for managing reviews and notes
- Location: `C:\dev\tools\obsidian-note-reviewer\apps\portal\`
- Contains: React application (src/), dev server (dev-server.ts)
- Depends on: @obsidian-note-reviewer/editor, @obsidian-note-reviewer/ui, @obsidian-note-reviewer/security, @obsidian-note-reviewer/collaboration
- Used by: Users for web-based note management and collaboration

**Marketing Layer:**
- Purpose: Landing pages and sales content
- Location: `C:\dev\tools\obsidian-note-reviewer\apps\marketing\`
- Contains: Static pages (index.pt-br.html, sales-v2.html)
- Depends on: @obsidian-note-reviewer/ui, @obsidian-note-reviewer/editor
- Used by: Prospective customers

**UI Layer:**
- Purpose: Shared React components and design system
- Location: `C:\dev\tools\obsidian-note-reviewer\packages\ui\`
- Contains: Reusable components (AnnotationPanel, DiffViewer, CommentInput, etc.)
- Export patterns: `./components/*`, `./markdown`, `./hooks/*`
- Used by: All apps

**Editor Layer:**
- Purpose: Note editing functionality and main App component
- Location: `C:\dev\tools\obsidian-note-reviewer\packages\editor\`
- Contains: App.tsx, styles (index.css)
- Export: `.` (App.tsx), `./styles`
- Used by: Hook, Portal, Marketing apps

**Security Layer:**
- Purpose: Authentication and CSP configuration
- Location: `C:\dev\tools\obsidian-note-reviewer\packages\security\`
- Contains: Supabase client (src/supabase/), auth context (src/auth/), CSP plugins
- Exports: `./supabase/client`, `./auth/context`, `./vite-plugin-csp`
- Used by: All apps for auth and security headers

**AI Layer:**
- Purpose: AI-powered suggestions and content analysis
- Location: `C:\dev\tools\obsidian-note-reviewer\packages\ai\`
- Contains: Suggester (src/suggester.ts), summarizer, vault parser
- Exports: `./suggester`, `./summarizer`, `./vaultParser`
- Used by: Hook app for AI suggestions

**Collaboration Layer:**
- Purpose: Real-time collaboration with Liveblocks
- Location: `C:\dev\tools\obsidian-note-reviewer\packages\collaboration\`
- Contains: Liveblocks client setup, shareable links, vault integration
- Exports: `.`, `./shareableLinks`, `./vaultIntegration`
- Used by: Portal app

**Shared Layer:**
- Purpose: Common utilities and pricing configuration
- Location: `C:\dev\tools\obsidian-note-reviewer\packages\shared\`
- Contains: Pricing tiers (pricing.ts)
- Note: No package.json, utilities directly in packages/shared/

## Data Flow

**Claude Code Hook Workflow:**
1. Claude Code writes note to temp directory via Write tool
2. PostToolUse hook triggers Bun server (`apps/hook/server/index.ts`)
3. Server spawns ephemeral web server and opens browser
4. React app (`apps/hook/index.tsx`) loads with note content
5. User annotates and approves/denies via UI
6. Server sends JSON output to stdout for Claude Code
7. Hook exits with approval status

**Portal Authentication Flow:**
1. User visits portal, Supabase auth checks session
2. If not authenticated, redirect to auth page
3. Supabase OAuth handles login
4. Session stored in localStorage
5. AuthProvider context exposes session to app

**Real-time Collaboration Flow:**
1. User joins room via Liveblocks RoomProvider
2. Presence tracked with useMyPresence hook
3. Other users' cursors rendered via useOthers
4. Storage changes synced via Liveblocks storage

**State Management:**
- Frontend: Zustand for local state (where used)
- Server: Bun.serve for hook app, Vite dev server for portal
- Database: Supabase PostgreSQL with RLS
- Real-time: Liveblocks Yjs/storage

## Key Abstractions

**Note Abstraction:**
- Purpose: Represents a note with annotations
- Database: Supabase notes table with org_id, slug, content, markdown
- Frontend: Note data passed to editor App component
- Pattern: Multi-tenant with organization isolation

**Annotation Abstraction:**
- Purpose: User feedback on note content
- Types: comment, highlight, delete, insert, replace
- Storage: annotations table linked to notes
- UI: AnnotationPanel, AnnotationMarker components

**Auth Abstraction:**
- Purpose: User authentication and session management
- Provider: Supabase Auth (not Clerk)
- Context: AuthProvider in packages/security/src/auth/context.tsx
- Pattern: React context with localStorage persistence

**AI Suggestion Abstraction:**
- Purpose: AI-powered improvement suggestions
- Implementation: Anthropic Claude API via @anthropic-ai/sdk
- Output: Structured suggestions with type, targetText, suggestedText, reason, confidence
- Location: packages/ai/src/suggester.ts

## Entry Points

**Hook Application:**
- Location: `C:\dev\tools\obsidian-note-reviewer\apps\hook\server\index.ts`
- Triggers: PostToolUse hook after Write tool
- Responsibilities: Spawn server, serve HTML, handle API routes, return decision

**Portal Application:**
- Location: `C:\dev\tools\obsidian-note-reviewer\apps\portal\src\App.tsx`
- Triggers: Web application load
- Responsibilities: Dashboard rendering, auth handling, routing

**Marketing Application:**
- Location: `C:\dev\tools\obsidian-note-reviewer\apps\marketing\`
- Triggers: Static page requests
- Responsibilities: Landing page rendering

**Dev Server:**
- Location: `C:\dev\tools\obsidian-note-reviewer\apps\portal\dev-server.ts`
- Triggers: bun run dev:server
- Responsibilities: Liveblocks auth endpoint, API proxy

## Error Handling

**Strategy:** Centralized error handling with Sentry integration

**Patterns:**
- ErrorBoundary: `C:\dev\tools\obsidian-note-reviewer\packages\ui\components\ErrorBoundary.tsx`
- Sentry integration: `C:\dev\tools\obsidian-note-reviewer\packages\ui\lib\sentry.ts`
- Server errors: JSON responses with error messages
- Path validation: `C:\dev\tools\obsidian-note-reviewer\apps\hook\server\pathValidation.ts`

## Cross-Cutting Concerns

**Logging:**
- Tool: Pino with pino-pretty
- Console.error for debug output (hook server)
- Structured logging in edge functions

**Validation:**
- Approach: Manual validation functions (Zod not detected)
- Path validation: validatePath, validatePathWithAllowedDirs
- Mass assignment protection: filterAllowedFields in edge functions

**Authentication:**
- Provider: Supabase Auth (not Clerk)
- Session: localStorage with auto-refresh
- RLS: Row Level Security in PostgreSQL

**Security:**
- CSP headers: Custom Vite plugin per app
- Path traversal protection: validatePath functions
- Mass assignment protection: Field whitelisting in batch operations
- HTML sanitization: DOMPurify

---

*Architecture analysis: 2025-02-08*
