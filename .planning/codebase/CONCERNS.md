# Codebase Concerns

**Analysis Date:** 2026-02-08

## Tech Debt

**Large Component Files:**
- Issue: `packages/ui/components/Viewer.tsx` (1,493 lines) violates single responsibility principle
- Files: `packages/ui/components/Viewer.tsx`, `packages/ui/components/SettingsPanel.tsx` (1,120 lines)
- Impact: Difficult to maintain, test, and understand; contains multiple concerns (markdown rendering, annotations, toolbar, code highlighting, mermaid diagrams)
- Fix approach: Split into smaller focused components (MarkdownRenderer, AnnotationRenderer, CodeBlockRenderer, ViewerToolbar, MermaidDiagram)

**TypeScript Any Type Usage:**
- Issue: Extensive use of `any` type throughout codebase bypasses type safety
- Files: `packages/ui/components/Viewer.tsx`, `packages/ai/src/types.ts`, `packages/collaboration/src/index.ts`
- Impact: Loss of TypeScript benefits, runtime errors, reduced IDE support
- Fix approach: Define proper interfaces for `Record<string, any>`, `event: any`, `source: any` patterns

**Non-optimized React Components:**
- Issue: Major components lack React.memo, useMemo, useCallback optimizations
- Files: `packages/ui/components/Viewer.tsx` (no memoization found), `packages/editor/App.tsx`
- Impact: Unnecessary re-renders, performance degradation on larger notes
- Fix approach: Add React.memo to component exports, memoize expensive computations, use useCallback for event handlers

**Mixed Language UI Text:**
- Issue: Portuguese and English mixed throughout UI components without proper i18n
- Files: `packages/ui/components/DecisionBar.tsx`, `packages/ui/components/ConfigEditor.tsx`, `packages/editor/App.tsx`
- Impact: Inconsistent user experience, maintenance difficulty, incomplete internationalization
- Fix approach: Consolidate all strings into i18n system, remove hardcoded Portuguese text

**Empty Return Pattern:**
- Issue: Extensive use of defensive `return null` and `return []` statements
- Files: `packages/api/lib/stripe.ts` (10+ instances), `packages/collaboration/src/vaultIntegration.ts`, `packages/ui/components/` (20+ instances)
- Impact: Silent failures, difficult debugging, unclear error states
- Fix approach: Use Result types, proper error handling, or explicit Option types

## Known Bugs

**Character Encoding Issues:**
- Issue: Portuguese UI text shows encoding errors in some components
- Files: `packages/ui/components/DecisionBar.tsx`, `packages/ui/components/ConfigEditor.tsx`
- Symptoms: Accented characters display incorrectly
- Trigger: Certain character combinations in markdown content, UTF-8 BOM issues
- Workaround: Force UTF-8 encoding in all text rendering

**CSP unsafe-inline in Production:**
- Issue: Content Security Policy includes `'unsafe-inline'` for scripts even in production
- Files: `packages/security/csp.ts` (line 113), `packages/security/csp.ts` (line 68 for styles)
- Symptoms: Reduced XSS protection, CSP violations in browser console
- Trigger: Any script injection attempt
- Workaround: None currently deployed
- Fix: Implement nonce-based CSP for production builds

**TypeScript Suppression in Production:**
- Issue: `@ts-ignore` used for Liveblocks integration
- Files: `apps/portal/src/hooks/useSharedAnnotations.ts:65`
- Symptoms: Type errors suppressed, potential runtime issues
- Trigger: Liveblocks API usage
- Workaround: None

## Security Considerations

**XSS via dangerouslySetInnerHTML:**
- Risk: SVG and markdown rendering uses `dangerouslySetInnerHTML` in multiple locations
- Files: `packages/ui/components/Viewer.tsx:954` (mermaid), `packages/ui/components/DecisionBar.tsx:79`
- Current mitigation: DOMPurify sanitization with strict SVG config in `packages/ui/utils/sanitize.ts`
- Current gaps: DecisionBar uses unsanitized i18n HTML, ReactMarkdown in callouts may not be sanitized
- Recommendations: Audit all dangerouslySetInnerHTML usage, add DOMPurify to DecisionBar, implement CSP nonces

**Environment Variable Exposure:**
- Risk: Sensitive values hardcoded with fallback defaults
- Files: `packages/shared/pricing.ts:65-74` (Stripe product/price IDs with fallbacks)
- Current mitigation: Environment variable override
- Recommendations: Remove hardcoded fallbacks for production, fail fast on missing credentials

**Browser Storage of Sensitive Data:**
- Risk: Authentication tokens and user data stored in localStorage
- Files: `packages/security/src/supabase/client.ts:27`, `packages/collaboration/src/index.ts:90`, `packages/ai/src/config.ts:28`
- Current mitigation: Same-origin policy, HTTPS requirement
- Recommendations: Evaluate session-only storage, implement token refresh rotation, consider HttpOnly cookies

**CSP unsafe-eval in Development:**
- Risk: Development mode allows `'unsafe-eval'` for Vite HMR
- Files: `packages/security/csp.ts:107`
- Current mitigation: Only enabled in development (`isDev` flag)
- Recommendations: Document security implications, ensure production builds never include unsafe-eval

**Webhook Signature Verification:**
- Risk: Stripe webhook endpoint uses `!` assertion on env var
- Files: `packages/api/routes/webhooks/stripe.ts:12`
- Current mitigation: Stripe signature verification
- Recommendations: Add graceful failure if webhook secret missing, log configuration errors

**Row Level Security Gaps:**
- Risk: RLS policies may have edge cases in multi-tenant scenarios
- Files: `supabase/migrations/001_initial_schema.sql:75-139`
- Current mitigation: Comprehensive RLS policies on all tables
- Recommendations: Regular security audits, test policy bypass attempts

## Performance Bottlenecks

**Unoptimized Viewer Component:**
- Problem: 1,493-line component re-renders on every annotation change
- Files: `packages/ui/components/Viewer.tsx`
- Cause: No React.memo, useState at component level, frequent useEffect hooks (13+ useEffect calls)
- Impact: Lag on large notes (>5000 words), poor scrolling performance
- Improvement path: Split into sub-components, add virtual scrolling for long documents, memoize block rendering

**Multiple useEffect Hooks:**
- Problem: Viewer component has 13+ useEffect hooks running on various dependencies
- Files: `packages/ui/components/Viewer.tsx:82, 86, 91, 151, 432, 478, 784, 896, 1045, 1049, 1296, 1358, 1363`
- Cause: Concerns not separated, side effects scattered
- Impact: Unnecessary re-renders, memory allocation
- Improvement path: Consolidate related effects, use custom hooks, reduce dependency arrays

**LocalStorage Operations:**
- Problem: Synchronous localStorage operations on main thread
- Files: `packages/ai/src/config.ts:28,46,80`, `packages/collaboration/src/vaultIntegration.ts:55,178`
- Cause: No caching or debouncing
- Impact: UI blocking on large datasets
- Improvement path: Implement IndexedDB wrapper, add read caching, batch writes

**Mermaid Diagram Rendering:**
- Problem: Mermaid render operations block UI
- Files: `packages/ui/components/Viewer.tsx:944-956`
- Cause: Synchronous mermaid.render() call
- Impact: UI freeze on complex diagrams
- Improvement path: Web Worker for rendering, progressive loading, diagram caching

**Memory Leaks from Timers:**
- Problem: setTimeout/setInterval not always cleaned up on unmount
- Files: `packages/ui/components/Viewer.tsx:629,632,672,674`, `packages/editor/App.tsx:472,493`
- Cause: Incomplete cleanup in useEffect returns
- Impact: Memory growth over time
- Improvement path: Audit all timers, ensure cleanup functions, use useRef for timer IDs

## Fragile Areas

**Annotation Positioning:**
- Files: `packages/ui/components/AnnotationOverlay.tsx`, `packages/ui/components/Viewer.tsx`
- Why fragile: DOM-based position calculations break on layout changes, scroll events, window resize
- Safe modification: Use ResizeObserver, MutationObserver, debounced position updates
- Test coverage: Limited tests for edge cases (overlapping annotations, wrapped text)

**Markdown Parsing:**
- Files: `packages/ui/utils/parser.ts`, `packages/editor/App.tsx`
- Why fragile: Custom parser, edge cases in Obsidian-specific syntax, callout parsing
- Safe modification: Add comprehensive test fixtures, use established markdown library
- Test coverage: Basic tests present, missing edge case coverage

**File Path Handling:**
- Files: `apps/hook/server/pathValidation.ts`, `packages/collaboration/src/vaultIntegration.ts`
- Why fragile: Multiple OS path formats (Windows backslash, Unix forward slash), URL encoding issues
- Safe modification: Use path library consistently, test all scenarios, normalize paths early
- Test coverage: Comprehensive security tests exist in `apps/hook/server/__tests__/manual-security-test.ts`

**State Management:**
- Files: `packages/editor/App.tsx` (local state), `packages/ui/lib/cache.ts` (Upstash), `packages/security/src/auth/context.tsx` (Supabase)
- Why fragile: Multiple state sources not synchronized, race conditions possible
- Safe modification: Consolidate to single state management solution, implement optimistic updates
- Test coverage: Limited integration tests

## Scaling Limits

**Supabase RLS Performance:**
- Current capacity: Tested with <1000 rows per table
- Limit: RLS policies add query overhead, subquery-based policies
- Scaling path: Add database indexes, consider policy simplification, cache user permissions

**Client-Side Cache:**
- Current capacity: In-memory state, limited localStorage
- Limit: Data loss on refresh, no offline support
- Scaling path: Implement IndexedDB, service worker cache, background sync

**Webhook Processing:**
- Current capacity: Single-threaded processing in `packages/api/routes/webhooks/stripe.ts`
- Limit: Synchronous processing blocks event loop
- Scaling path: Queue-based processing, idempotency keys, retry mechanism

**Concurrent Annotation Editing:**
- Current capacity: Single-user design, localStorage persistence
- Limit: No conflict resolution, last-write-wins
- Scaling path: Implement CRDT-based collaboration, operational transformation

**Large File Handling:**
- Current capacity: Viewer loads entire document into memory
- Limit: Browser tab crashes on very large files (>10MB markdown)
- Scaling path: Virtual scrolling, progressive rendering, chunked loading

## Dependencies at Risk

**Bun.js Runtime:**
- Risk: Less mature than Node.js, potential compatibility issues
- Impact: Production deployment may encounter edge cases
- Migration plan: Test thoroughly in production-like environment, have Node.js fallback ready

**Mermaid.js:**
- Risk: Heavy library for diagrams, security-sensitive (SVG rendering)
- Impact: Bundle size, XSS surface area
- Migration plan: Consider server-side rendering, implement stricter CSP, evaluate lighter alternatives

**@supabase/supabase-js:**
- Risk: Version 2.x breaking changes possible
- Impact: Authentication, database queries
- Migration plan: Pin major version, monitor changelog, implement feature detection

**Liveblocks Collaboration:**
- Risk: Third-party service dependency, requires TypeScript suppression
- Files: `apps/portal/src/hooks/useSharedAnnotations.ts:65` (@ts-ignore)
- Impact: Real-time collaboration features
- Migration plan: Create proper type definitions, evaluate alternatives (Yjs, Automerge)

**DOMPurify:**
- Risk: Must stay updated for new XSS vectors
- Files: `packages/ui/utils/sanitize.ts`
- Impact: SVG sanitization security
- Migration plan: Automated dependency updates, security scanning in CI

## Missing Critical Features

**Undo/Redo System:**
- Problem: No history management for annotations or content edits
- Files: `packages/ui/components/Viewer.tsx`, `packages/editor/App.tsx`
- Blocks: Complex annotation editing workflows, user errors difficult to recover
- Priority: High

**Conflict Resolution:**
- Problem: No handling for concurrent edits
- Files: `packages/collaboration/src/`, `packages/ui/lib/collaborative-editing.ts`
- Blocks: Multi-user scenarios, offline sync
- Priority: High

**Export Formats:**
- Problem: Limited export options (JSON primarily, some markdown export)
- Files: `packages/ui/utils/parser.ts` (exportDiff function)
- Blocks: Integration with other tools, user workflows
- Priority: Medium

**Search Functionality:**
- Problem: No full-text search across notes
- Files: Not implemented
- Blocks: Large vault navigation, content discovery
- Priority: Medium

**Offline Mode:**
- Problem: No service worker, offline not supported
- Files: `packages/ui/lib/offline-sync.ts` (partial implementation)
- Blocks: Mobile usage, poor connectivity scenarios
- Priority: Low

## Test Coverage Gaps

**Integration Testing:**
- What's not tested: Full user flows (note creation to export), auth flows, payment flows
- Files: `apps/portal/`, `packages/editor/`
- Risk: Broken user journeys, regressions in critical paths
- Priority: High
- Existing: 26 test files (good coverage), but mostly unit tests

**E2E Testing:**
- What's not tested: Browser automation tests, cross-browser compatibility
- Files: None found
- Risk: Browser-specific bugs, production issues
- Priority: Medium

**Visual Regression:**
- What's not tested: UI appearance, responsive design, dark/light mode
- Files: `packages/ui/components/`
- Risk: CSS breaks, layout shifts
- Priority: Low

**Load Testing:**
- What's not tested: Concurrent user scenarios, large dataset performance
- Files: None found
- Risk: Performance degradation in production
- Priority: Medium

**Security Testing:**
- What's not tested: Automated XSS attempts, injection attacks, auth bypass
- Files: `apps/hook/server/__tests__/manual-security-test.ts` (manual tests only)
- Risk: Vulnerability exploitation
- Priority: Critical
- Existing: Manual security test script for path traversal (needs automation)

**Edge Case Testing:**
- What's not tested: Malformed markdown, special characters, Unicode edge cases
- Files: `packages/ui/components/Viewer.tsx`, `packages/ui/utils/parser.ts`
- Risk: Rendering errors, crashes, data corruption
- Priority: High

**Accessibility Testing:**
- What's not tested: Screen reader compatibility, keyboard navigation, ARIA labels
- Files: `packages/ui/components/`
- Risk: Non-compliance with WCAG, exclusion of users
- Priority: Medium

---

*Concerns audit: 2026-02-08*
