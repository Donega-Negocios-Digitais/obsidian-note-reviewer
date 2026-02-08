# Codebase Structure

**Analysis Date:** 2025-02-08

## Directory Layout

```
obsidian-note-reviewer/
├── apps/                    # Application entry points
│   ├── hook/               # Claude Code hook integration (CLI)
│   ├── marketing/          # Landing page and sales site
│   └── portal/             # Main web application
├── packages/               # Shared workspace packages
│   ├── ai/                 # AI integration (Claude, suggestions)
│   ├── api/                # API routes and integrations
│   ├── collaboration/      # Real-time collaboration features
│   ├── core/               # Core utilities and logger
│   ├── editor/             # Main editor application component
│   ├── security/           # Security (CSP, auth, validation)
│   ├── shared/             # Shared pricing and types
│   └── ui/                 # Shared UI components library
├── supabase/               # Supabase Edge Functions and migrations
├── scripts/                # Build and installation scripts
├── docs/                   # Project documentation
├── .planning/              # GSD planning phases
├── .context/               # Claude Code context and skills
└── .auto-claude/           # Auto-claude specs and roadmaps
```

## Directory Purposes

**apps/hook/**
- Purpose: Claude Code hook integration for plan review
- Contains: CLI tools, ephemeral server, Obsidian integration
- Key files: `server/obsidianHook.ts`, `server/planModeHook.ts`, `bin/obsreview-*.ts`
- Port: 3000
- Build: Single-file HTML for embedding in Claude Code context

**apps/marketing/**
- Purpose: Public landing page and sales site
- Contains: Sales pages, pricing information, signup CTAs
- Key files: `SalesPageV1.tsx`, `index.pt-br.html`, `sales-v2.html`
- Port: 3002
- Languages: Portuguese (pt-BR) primary, English support

**apps/portal/**
- Purpose: Main web application for document review and collaboration
- Contains: Auth flows, document workspace, settings, billing
- Key files: `src/App.tsx`, `src/pages/*`, `dev-server.ts`
- Port: 3001 (Vite dev server), 3002 (API proxy via dev-server)

**packages/ui/**
- Purpose: Shared React component library
- Contains: All UI components, hooks, utilities, stores
- Key files: `components/Viewer.tsx`, `components/AnnotationPanel.tsx`, `utils/parser.ts`
- Exports: Components, hooks, utilities via path aliases
- Features: Markdown rendering, annotations, comments, version history

**packages/editor/**
- Purpose: Main editor application entry point
- Contains: Editor App component, styles
- Key files: `App.tsx`, `index.css`
- Used by: Hook and Portal apps

**packages/ai/**
- Purpose: AI integration features
- Contains: Summarization, suggestions, vault parsing
- Key files: `src/summarizer.ts`, `src/suggester.ts`, `src/vaultParser.ts`
- Features: Content analysis, annotation suggestions

**packages/security/**
- Purpose: Security utilities and configurations
- Contains: CSP policies, auth providers, validation
- Key files: `csp.ts`, `src/supabase/client.ts`, `vite-plugin-csp.ts`
- Features: Content Security Policy, path validation, Supabase auth

**packages/collaboration/**
- Purpose: Real-time collaboration features
- Contains: Shareable links, Liveblocks integration, permissions
- Key files: `src/shareableLinks.ts`, `src/vaultIntegration.ts`
- Features: Document sharing, presence tracking

**packages/api/**
- Purpose: API route handlers
- Contains: Stripe integration, subscription management, webhooks
- Key files: `routes/subscriptions.ts`, `routes/webhooks/stripe.ts`, `lib/stripe.ts`

**packages/core/**
- Purpose: Core utilities and logging
- Contains: Logger implementation, shared utilities
- Key files: `src/logger/index.ts`, `src/lib/utils.test.ts`

**packages/shared/**
- Purpose: Shared types and configurations
- Contains: Pricing plans, subscription tiers
- Key files: `pricing.ts`
- Features: Plan definitions, feature flags

**supabase/**
- Purpose: Supabase Edge Functions and database migrations
- Contains: Serverless functions, migration files
- Key functions: `batch-operations/`, `process-note/`
- Migrations: Database schema changes

## Key File Locations

**Entry Points:**
- `apps/hook/index.tsx`: Hook app main component
- `apps/hook/server/obsidianHook.ts`: Write hook server (plan file detection via PostToolUse)
- `apps/hook/server/planModeHook.ts`: ExitPlanMode hook server
- `apps/hook/bin/obsreview-obsidian.ts`: CLI for Obsidian hook
- `apps/hook/bin/obsreview-plan.ts`: CLI for plan mode hook
- `apps/portal/src/App.tsx`: Portal app routing and auth wrapper
- `apps/marketing/SalesPageV1.tsx`: Main sales page (pt-BR)
- `packages/editor/App.tsx`: Editor application component

**Configuration:**
- `package.json`: Root workspace configuration (Bun workspaces)
- `apps/hook/vite.config.ts`: Hook app build config (port 3000, single-file build)
- `apps/portal/vite.config.ts`: Portal app build config (port 3001, API proxy to 3002)
- `apps/marketing/vite.config.ts`: Marketing app build config (port 3002)
- `apps/portal/dev-server.ts`: Portal development API server (port 3002)
- `apps/portal/.env.example`: Environment variables template
- `packages/security/csp.ts`: Content Security Policy configuration
- `eslint.config.cjs`: ESLint configuration
- `vitest.config.ts`: Vitest test configuration

**Core Logic:**
- `packages/ui/components/Viewer.tsx`: Main document viewer component (53KB)
- `packages/ui/components/AnnotationPanel.tsx`: Annotation sidebar component (14KB)
- `packages/ui/components/SettingsPanel.tsx`: Settings panel component (52KB)
- `packages/ui/components/ExportModal.tsx`: Annotation export modal (8KB)
- `packages/ui/components/CommentThread.tsx`: Comment thread component (14KB)
- `packages/ui/components/ImageAnnotator.tsx`: Image annotation component (15KB)
- `packages/ui/utils/parser.ts`: Markdown parser and block extraction (9KB)
- `packages/ui/utils/storage.ts`: Browser storage utilities for annotations (17KB)
- `packages/ui/store/useAnnotationStore.ts`: Annotation state management (6KB)
- `packages/ui/store/useCommentStore.ts`: Comment thread state management (13KB)
- `packages/ui/store/useVersionStore.ts`: Version history state management (13KB)

**Authentication:**
- `apps/portal/src/auth/index.ts`: Auth context and providers
- `apps/portal/src/components/auth/LoginForm.tsx`: Login form component
- `apps/portal/src/components/auth/SignupForm.tsx`: Signup form component
- `apps/portal/src/components/auth/CallbackHandler.tsx`: OAuth callback handler
- `apps/portal/src/components/auth/UserMenu.tsx`: User menu component
- `packages/security/src/supabase/client.ts`: Supabase client initialization
- `packages/security/src/supabase/oauth.ts`: OAuth flow handlers
- `packages/security/src/supabase/session.ts`: Session management
- `packages/security/src/supabase/storage.ts`: Storage utilities
- `packages/security/src/auth/useSessionDebug.ts`: Session debugging hook

**Collaboration:**
- `apps/portal/src/lib/liveblocks.ts`: Liveblocks client configuration
- `apps/portal/src/lib/liveblocks-auth.ts`: Liveblocks auth endpoint
- `apps/portal/src/lib/supabase/sharing.ts`: Document sharing utilities
- `apps/portal/src/lib/roomUtils.ts`: Room management utilities
- `apps/portal/src/components/collaboration/RoomProvider.tsx`: Liveblocks room provider
- `apps/portal/src/components/collaboration/LiveCursors.tsx`: Live cursor display
- `apps/portal/src/components/collaboration/PresenceList.tsx`: User presence list
- `apps/portal/src/components/collaboration/Cursor.tsx`: Individual cursor component
- `packages/collaboration/src/shareableLinks.ts`: Shareable link generation
- `packages/collaboration/src/vaultIntegration.ts`: Vault integration utilities

**Portal Pages:**
- `apps/portal/src/pages/login.tsx`: Login page
- `apps/portal/src/pages/signup.tsx`: Signup page
- `apps/portal/src/pages/dashboard.tsx`: User dashboard (mock data)
- `apps/portal/src/pages/settings.tsx`: Settings page (mock data)
- `apps/portal/src/pages/Pricing.tsx`: Pricing and plans page
- `apps/portal/src/pages/welcome.tsx`: Welcome/onboarding page
- `apps/portal/src/pages/SharedDocument.tsx`: Public shared document page
- `apps/portal/src/pages/forgot-password.tsx`: Forgot password page
- `apps/portal/src/pages/reset-password.tsx`: Reset password page
- `apps/portal/src/pages/CheckoutSuccess.tsx`: Checkout success page
- `apps/portal/src/pages/CheckoutCancel.tsx`: Checkout cancel page
- `apps/portal/src/pages/preview/CollaborationPreview.tsx`: Collaboration preview page

**Portal Components:**
- `apps/portal/src/components/DocumentWorkspace.tsx`: Main workspace component (12KB)
- `apps/portal/src/components/SettingsPanel.tsx`: Settings panel (9KB)
- `apps/portal/src/components/SummaryPanel.tsx`: Document summary panel (12KB)
- `apps/portal/src/components/AnnotationExport.tsx`: Annotation export (9KB)
- `apps/portal/src/components/VaultContextPanel.tsx`: Vault context panel (11KB)
- `apps/portal/src/components/PromptEditor.tsx`: Prompt editor (14KB)
- `apps/portal/src/components/CollaborativeAnnotationPanel.tsx`: Collaborative annotations (8KB)
- `apps/portal/src/components/ShareDialog.tsx`: Share dialog (6KB)
- `apps/portal/src/components/GuestBanner.tsx`: Guest access banner (3KB)
- `apps/portal/src/components/UpgradePrompt.tsx`: Upgrade prompt (10KB)

**Portal Hooks:**
- `apps/portal/src/hooks/useSubscription.ts`: Subscription management hook
- `apps/portal/src/hooks/useStripeCheckout.ts`: Stripe checkout hook
- `apps/portal/src/hooks/useObsidianVault.ts`: Obsidian vault integration
- `apps/portal/src/hooks/useDocumentPermissions.ts`: Document permissions
- `apps/portal/src/hooks/useSharedAnnotations.ts`: Shared annotations
- `apps/portal/src/hooks/usePresence.ts`: Liveblocks presence
- `apps/portal/src/hooks/useCursorTracking.ts`: Cursor tracking
- `apps/portal/src/hooks/useDocumentTabs.ts`: Document tab management
- `apps/portal/src/hooks/useTheme.ts`: Theme management
- `apps/portal/src/hooks/useDarkMode.ts`: Dark mode toggle
- `apps/portal/src/hooks/useVaultState.ts`: Vault state management
- `apps/portal/src/hooks/useCrossReferences.ts`: Cross-reference detection
- `apps/portal/src/hooks/useBreakpoint.ts`: Responsive breakpoints
- `apps/portal/src/hooks/useResponsive.ts`: Responsive utilities
- `apps/portal/src/hooks/useSlugRouting.ts`: Slug-based routing

**UI Package Components:**
- `packages/ui/components/DecisionBar.tsx`: Approve/deny decision bar (5KB)
- `packages/ui/components/Toolbar.tsx`: Annotation toolbar (7KB)
- `packages/ui/components/KeyboardShortcutsModal.tsx`: Keyboard shortcuts (6KB)
- `packages/ui/components/VersionHistory.tsx`: Version history display (14KB)
- `packages/ui/components/DiffViewer.tsx`: Diff visualization (6KB)
- `packages/ui/components/MarkdownRenderer.tsx`: Markdown rendering (5KB)
- `packages/ui/components/CodeBlock.tsx`: Code block display (6KB)
- `packages/ui/components/AnnotationMarker.tsx`: Annotation markers (3KB)
- `packages/ui/components/AnnotationOverlay.tsx`: Annotation overlay (7KB)
- `packages/ui/components/AnnotationStatistics.tsx`: Statistics display (7KB)
- `packages/ui/components/AnnotationSidebar.tsx`: Sidebar variant (8KB)
- `packages/ui/components/AnnotationStatusControls.tsx`: Status controls (4KB)
- `packages/ui/components/GlobalCommentInput.tsx`: Global comment input (6KB)
- `packages/ui/components/CommentInput.tsx`: Thread comment input (9KB)
- `packages/ui/components/BulkActionsBar.tsx`: Bulk selection actions (5KB)
- `packages/ui/components/SortSelector.tsx`: Annotation sorting (3KB)
- `packages/ui/components/StatusBadge.tsx`: Status badge display (3KB)
- `packages/ui/components/Skeleton.tsx`: Loading skeleton (4KB)
- `packages/ui/components/VirtualList.tsx`: Virtual scrolling (7KB)
- `packages/ui/components/ModeSwitcher.tsx`: Editor mode switcher (4KB)
- `packages/ui/components/ModeToggle.tsx`: Theme toggle (3KB)
- `packages/ui/components/ConfigEditor.tsx`: Configuration editor (16KB)
- `packages/ui/components/FrontmatterEditor.tsx`: Frontmatter editor (4KB)

**UI Package Utils:**
- `packages/ui/utils/storage.ts`: Browser storage (IndexedDB, localStorage) (17KB)
- `packages/ui/utils/parser.ts`: Markdown parser to blocks (9KB)
- `packages/ui/utils/annotationSort.ts`: Annotation sorting algorithms (3KB)
- `packages/ui/utils/annotationStats.ts`: Annotation statistics (4KB)
- `packages/ui/utils/annotationTypeConfig.tsx`: Type configuration (3KB)
- `packages/ui/utils/claudeExport.ts`: Export format for Claude Code (9KB)
- `packages/ui/utils/diffGenerator.ts`: Diff generation utilities (5KB)
- `packages/ui/utils/markdownSanitizer.ts`: Markdown sanitization (7KB)
- `packages/ui/utils/sanitize.ts`: HTML sanitization (5KB)
- `packages/ui/utils/sharing.ts`: Sharing utilities (12KB)
- `packages/ui/utils/shortcuts.ts`: Keyboard shortcuts (8KB)
- `packages/ui/utils/drawing.ts`: Drawing/annotation utilities (7KB)
- `packages/ui/utils/elementSelector.ts`: CSS element selection (9KB)
- `packages/ui/utils/callouts.ts`: Callout block parsing (3KB)
- `packages/ui/utils/notePaths.ts`: Note path utilities (12KB)
- `packages/ui/utils/safeJson.ts`: Safe JSON parsing (5KB)
- `packages/ui/utils/statusHelpers.ts`: Status helpers (5KB)
- `packages/ui/utils/threadHelpers.ts`: Comment thread helpers (9KB)
- `packages/ui/utils/identity.ts`: User identity generation (3KB)

**UI Package Hooks:**
- `packages/ui/hooks/useAnnotationTargeting.ts`: Annotation targeting (9KB)
- `packages/ui/hooks/useFocusTrap.ts`: Focus trap for modals (7KB)
- `packages/ui/hooks/useCopyFeedback.ts`: Copy feedback animation (5KB)
- `packages/ui/hooks/usePrefersReducedMotion.ts`: Reduced motion detection (3KB)
- `packages/ui/hooks/useSharing.ts`: Sharing functionality (4KB)

**AI Package:**
- `packages/ai/src/summarizer.ts`: Content summarization (11KB)
- `packages/ai/src/suggester.ts`: Annotation suggestions (6KB)
- `packages/ai/src/vaultParser.ts`: Obsidian vault parsing (10KB)
- `packages/ai/src/config.ts`: AI configuration (3KB)
- `packages/ai/src/types.ts`: AI types (4KB)

**Security Package:**
- `packages/security/csp.ts`: CSP policy generation and configuration
- `packages/security/vite-plugin-csp.ts`: Vite plugin for CSP injection
- `packages/security/src/supabase/client.ts`: Supabase client
- `packages/security/src/supabase/oauth.ts`: OAuth handlers
- `packages/security/src/supabase/session.ts`: Session management
- `packages/security/src/supabase/storage.ts`: Storage utilities
- `packages/security/src/supabase/types.ts`: Supabase types
- `packages/security/src/auth/useSessionDebug.ts`: Session debugging

**API Package:**
- `packages/api/routes/subscriptions.ts`: Subscription management routes
- `packages/api/routes/webhooks/stripe.ts`: Stripe webhook handler
- `packages/api/lib/stripe.ts`: Stripe client configuration

**Testing:**
- `apps/hook/server/__tests__/`: Hook server tests
  - `pathValidation.test.ts`: Path validation tests
  - `save.test.ts`: Save operation tests
- `apps/portal/api/__tests__/`: Portal API tests
  - `notes.test.ts`: Notes API tests
- `apps/portal/utils/__tests__/`: Portal utility tests
- `packages/ui/components/__tests__/`: UI component tests
  - `AnnotationPanel.test.tsx`: Annotation panel tests
  - `DecisionBar.test.tsx`: Decision bar tests
- `packages/ui/utils/__tests__/`: Utility function tests
  - `parser.test.ts`: Parser tests
  - `storage.test.ts`: Storage tests
  - `annotationSort.test.ts`: Sorting tests
  - `annotationStats.test.ts`: Statistics tests
  - `annotationTypeConfig.test.tsx`: Type config tests
- `packages/ui/hooks/__tests__/`: Hook tests
  - `useAnnotationTargeting.test.ts`: Targeting tests
  - `useFocusTrap.test.ts`: Focus trap tests
- `packages/security/__tests__/`: Security tests
  - `csp.test.ts`: CSP policy tests

**Infrastructure:**
- `supabase/migrations/`: Database schema migrations
  - `20260207_create_shared_documents.sql`: Shared documents table
- `supabase/functions/_shared/`: Shared Edge Function code
- `supabase/functions/batch-operations/`: Batch operation handler
- `supabase/functions/process-note/`: Note processing handler
- `scripts/install.sh`: Unix installation script
- `scripts/install.ps1`: Windows PowerShell installation script
- `scripts/install.cmd`: Windows CMD installation script
- `scripts/verify-security-headers.sh`: Security header verification

## Naming Conventions

**Files:**
- Components: PascalCase (e.g., `AnnotationPanel.tsx`, `DocumentWorkspace.tsx`, `CollaborativeAnnotationPanel.tsx`)
- Hooks: camelCase with `use` prefix (e.g., `useAnnotationStore.ts`, `useDarkMode.ts`, `useSubscription.ts`)
- Utilities: camelCase (e.g., `parser.ts`, `storage.ts`, `sharing.ts`, `annotationSort.ts`)
- Types: camelCase (e.g., `types.ts`, `tier.ts`, `claude.ts`)
- Pages: camelCase (e.g., `dashboard.tsx`, `settings.tsx`, `login.tsx`, `SharedDocument.tsx`)
- Tests: `[Component].test.ts` or `[Component].test.tsx` (e.g., `AnnotationPanel.test.tsx`)

**Directories:**
- `components/`: React components
- `hooks/`: Custom React hooks
- `utils/`: Utility functions
- `lib/`: Library code
- `store/`: State management (Zustand)
- `types/`: TypeScript type definitions
- `api/`: API handlers
- `pages/`: Page components (file-based routing)
- `src/`: Source files (when mixed with build output)
- `__tests__/`: Test files co-located with source
- `routes/`: API route handlers
- `migrations/`: Database migrations

**Package Structure:**
- Each package has its own `package.json` with workspace dependency references
- Packages export via `exports` field in `package.json`
- Workspace packages use `@obsidian-note-reviewer/*` naming convention
- Dependencies between packages use `workspace:*` version

**TypeScript:**
- Interfaces: PascalCase (e.g., `Annotation`, `Block`, `CommentThread`)
- Enums: PascalCase (e.g., `AnnotationType`, `AnnotationStatus`)
- Type aliases: PascalCase (e.g., `EditorMode`, `SortOption`)
- Generic types: PascalCase with T prefix (e.g., `TAnnotation`, `TBlock`)

## Where to Add New Code

**New Feature (Portal):**
- Primary code: `apps/portal/src/components/[FeatureName].tsx`
- Hooks: `apps/portal/src/hooks/use[FeatureName].ts`
- Pages: `apps/portal/src/pages/[feature-name].tsx` or `[FeatureName].tsx`
- Tests: `apps/portal/src/components/__tests__/[FeatureName].test.tsx`
- Lib utilities: `apps/portal/src/lib/[featureName].ts`

**New Feature (Editor/UI):**
- Implementation: `packages/ui/components/[ComponentName].tsx`
- Utilities: `packages/ui/utils/[featureName].ts`
- Store: `packages/ui/store/use[FeatureName]Store.ts`
- Types: `packages/ui/types/[featureName].ts`
- Hooks: `packages/ui/hooks/use[FeatureName].ts`
- Tests: `packages/ui/components/__tests__/[ComponentName].test.tsx`

**New API Route:**
- Route handler: `packages/api/routes/[routeName].ts`
- Edge Function: `supabase/functions/[function-name]/index.ts`
- Tests: `apps/portal/api/__tests__/[routeName].test.ts`
- Client hook: `apps/portal/src/hooks/use[ApiName].ts`

**New Integration:**
- Client config: `packages/security/src/[service]/client.ts`
- API wrapper: `packages/api/lib/[service].ts`
- Types: `packages/security/src/[service]/types.ts`
- Auth provider: `packages/security/src/[service]/oauth.ts`

**New Shared Component:**
- Component: `packages/ui/components/[ComponentName].tsx`
- Hooks: `packages/ui/hooks/use[FeatureName].ts`
- Export: Add to `packages/ui/package.json` exports field
- Tests: `packages/ui/components/__tests__/[ComponentName].test.tsx`

**Utilities:**
- Shared helpers: `packages/ui/utils/[utilityName].ts`
- Core utilities: `packages/core/src/lib/[utilityName].ts`
- Portal-specific: `apps/portal/src/utils/[utilityName].ts`

**AI Features:**
- Implementation: `packages/ai/src/[featureName].ts`
- Types: `packages/ai/src/types.ts` (extend existing)
- Integration: Hook into `packages/ai/src/summarizer.ts` or `suggester.ts`

**Collaboration Features:**
- Implementation: `packages/collaboration/src/[featureName].ts`
- Portal integration: `apps/portal/src/components/collaboration/[ComponentName].tsx`
- Liveblocks: Update `apps/portal/src/lib/liveblocks.ts`

## Portal App Routes

**Public Routes (No Auth Required):**
- `/` - Redirects to `/editor`
- `/auth/login` - Login page
- `/auth/signup` - Signup page
- `/auth/forgot-password` - Forgot password
- `/auth/reset-password` - Reset password (with token)
- `/auth/callback` - OAuth callback handler
- `/shared/:slug` - Public shared document (guest access, no auth)

**Protected Routes (Auth Required - Currently Disabled):**
- `/editor` - Main editor workspace (DocumentWorkspace)
- `/welcome` - Welcome/onboarding page
- `/dashboard` - User dashboard (redirects to `/editor`)
- `/settings` - Settings page (redirects to `/editor`)

**Preview Routes (UI Testing):**
- `/preview/collaboration` - Collaboration features preview

**API Endpoints (via dev-server.ts on :3002):**
- `GET /api/config/list` - List configuration files
- `GET /api/config/read` - Read configuration file
- `POST /api/config/save` - Save configuration file
- `GET /api/liveblocks-auth` - Liveblocks authentication
- `POST /api/subscription` - Subscription management
- Stripe webhook endpoints (handled by Supabase Edge Functions)

**Legacy Routes (Redirected):**
- `/dashboard` -> `/editor`
- `/settings` -> `/editor`

## Special Directories

**apps/hook/dist/**
- Purpose: Build output for hook app (single-file HTML)
- Generated: Yes (via `vite build` + `bun build`)
- Committed: Yes (for embedding in Claude Code context)
- Contains: `index.html`, `redline.html`, `obsidianHook.js`, `planModeHook.js`

**apps/portal/dist/**
- Purpose: Build output for portal app
- Generated: Yes (via `vite build`)
- Committed: No (in .gitignore)

**apps/marketing/dist/**
- Purpose: Build output for marketing app
- Generated: Yes (via `vite build`)
- Committed: No (in .gitignore)

**packages/ui/node_modules/**
- Purpose: UI package dependencies
- Generated: Yes (via `bun install`)
- Committed: No

**supabase/functions/**
- Purpose: Supabase Edge Functions (serverless)
- Generated: No (source code)
- Committed: Yes
- Deployed: To Supabase project via CLI
- Contains: `_shared/`, `batch-operations/`, `process-note/`

**supabase/migrations/**
- Purpose: Database schema migrations
- Generated: No (manually created)
- Committed: Yes
- Applied: Via Supabase CLI or dashboard

**.planning/phases/**
- Purpose: GSD implementation phase plans
- Generated: Yes (by `/gsd:plan-phase`)
- Committed: Yes
- Contains: `01-authentication/`, `02-annotation-system/`, etc.

**.context/skills/**
- Purpose: Claude Code skill definitions
- Generated: No (manually created)
- Committed: Yes
- Contains: `bug-investigation/`, `code-review/`, `commit-message/`, `pr-review/`

**.auto-claude/specs/**
- Purpose: Auto-claude feature specifications
- Generated: Yes (by auto-claude)
- Committed: Yes
- Contains: 070+ spec directories for individual features

**node_modules/ (root)/**
- Purpose: Root workspace dependencies
- Generated: Yes (via `bun install`)
- Committed: No
- Contains: Bun-installed packages

**.git/**
- Purpose: Git repository metadata
- Generated: Yes (by git init/clone)
- Committed: N/A (git metadata)

**.turbo/** (if present)/**
- Purpose: Turborepo cache
- Generated: Yes (by Turborepo)
- Committed: No

---

*Structure analysis: 2025-02-08*
