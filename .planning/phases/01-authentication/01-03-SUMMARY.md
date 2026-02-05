---
phase: 01-authentication
plan: 03
subsystem: auth-ui
tags: react, react-router, tailwindcss, oauth, supabase

# Dependency graph
requires:
  - phase: 01-authentication
    provides: 01-01 (Vite SPA Auth Infrastructure), 01-02 (Session Management)
provides:
  - Split-screen auth layout component (AuthLayout)
  - Email/password login form with OAuth buttons (LoginForm)
  - Email/password signup form with confirmation (SignupForm)
  - OAuth callback handler component (CallbackHandler)
  - Login page route at /auth/login
  - Signup page route at /auth/signup
  - Callback page route at /auth/callback
  - Protected route wrapper for authenticated pages
  - Public route wrapper for auth pages (redirects if already logged in)
affects: 01-04 (Protected Routes), 02-01 (Dashboard UI)

# Tech tracking
tech-stack:
  added: react-router-dom v7.11.0 (router, Routes, Route, Navigate)
  patterns: ProtectedRoute wrapper, PublicRoute wrapper, split-screen layout, OAuth button ordering

key-files:
  created:
    - apps/portal/src/components/auth/AuthLayout.tsx
    - apps/portal/src/components/auth/LoginForm.tsx
    - apps/portal/src/components/auth/SignupForm.tsx
    - apps/portal/src/components/auth/CallbackHandler.tsx
    - apps/portal/src/pages/login.tsx
    - apps/portal/src/pages/signup.tsx
    - apps/portal/src/pages/callback.tsx
  modified:
    - apps/portal/src/App.tsx

key-decisions:
  - "OAuth button text: 'Entrar com Google' and 'Entrar com GitHub' (per locked decision)"
  - "Google is primary OAuth provider (first button) per locked decision"
  - "Login/signup are dedicated pages (/auth/login, /auth/signup) not modals per locked decision"
  - "Split-screen layout: branding left, form right - hidden on mobile"
  - "Email validation handled by browser (type='email')"
  - "Password minimum 6 characters enforced client-side"
  - "Password confirmation required on signup"
  - "Error state displayed inline in forms (not toast notifications - simpler for SPA)"

patterns-established:
  - "Pattern: Split-screen auth layout with hidden mobile branding"
  - "Pattern: ProtectedRoute wrapper checks auth state and redirects"
  - "Pattern: PublicRoute wrapper redirects authenticated users to dashboard"
  - "Pattern: OAuth buttons appear before email/password form"
  - "Pattern: Error state displayed inline with destructive color"

# Metrics
duration: 8min
completed: 2026-02-05
---

# Phase 1 Plan 3: Auth UI Summary

**Split-screen login/signup pages with Google (primary) and GitHub OAuth, email/password forms with client-side validation, and protected route wrappers**

## Performance

- **Duration:** 8 min
- **Started:** 2026-02-05T02:15:00Z
- **Completed:** 2026-02-05T02:23:00Z
- **Tasks:** 6
- **Files modified:** 11 (7 created, 1 modified)

## Accomplishments

- Created split-screen AuthLayout component with branding panel (hidden on mobile)
- Implemented LoginForm with email/password and OAuth buttons (Google first per locked decision)
- Implemented SignupForm with password confirmation and OAuth buttons
- Created OAuth callback handler for Supabase redirect handling
- Set up login and signup page routes at /auth/login and /auth/signup
- Configured ProtectedRoute and PublicRoute wrappers in App.tsx

## Task Commits

Each task was committed atomically:

1. **Task 1: Create split-screen AuthLayout** - `bbc5885` (feat)
2. **Task 2: Create LoginForm with email/password and OAuth** - `41a14a4` (feat)
3. **Task 3: Create SignupForm with email/password and OAuth** - `7edb084` (feat)
4. **Task 4: Create OAuth callback handler** - `5000e1f` (feat)
5. **Task 5: Create auth page components** - `4e8657c` (feat)
6. **Task 6: Create router configuration** - `a7e5662` (feat)

**Plan metadata:** (pending - will be created after SUMMARY.md)

## Files Created/Modified

### Created
- `apps/portal/src/components/auth/AuthLayout.tsx` - Split-screen layout with branding (left) and form (right), responsive (hidden on mobile)
- `apps/portal/src/components/auth/LoginForm.tsx` - Email/password login form with OAuth buttons (Google first), redirects to /dashboard on success
- `apps/portal/src/components/auth/SignupForm.tsx` - Email/password signup with password confirmation, redirects to /welcome on success
- `apps/portal/src/components/auth/CallbackHandler.tsx` - OAuth callback handler that redirects to /dashboard or /auth/login based on auth state
- `apps/portal/src/pages/login.tsx` - Login page using AuthLayout + LoginForm
- `apps/portal/src/pages/signup.tsx` - Signup page using AuthLayout + SignupForm
- `apps/portal/src/pages/callback.tsx` - Callback page using CallbackHandler

### Modified
- `apps/portal/src/App.tsx` - Added BrowserRouter with Routes, ProtectedRoute wrapper, PublicRoute wrapper, and all auth routes

## Decisions Made

All decisions followed locked decisions from phase context:

1. **Dedicated pages, not modals** - Login/signup are at /auth/login and /auth/signup (not modal overlays)
2. **Split-screen layout** - Branding panel on left, form on right (responsive - hidden on mobile)
3. **Google is primary OAuth** - Google button appears before GitHub button in both forms
4. **OAuth button text** - "Entrar com Google" and "Entrar com GitHub" (Portuguese per project requirements)
5. **Toggle via links** - "Não tem conta? Cadastre-se" and "Já tem conta? Faça login"
6. **Inline error display** - Errors shown in form (not toast notifications) for simpler SPA UX

## Deviations from Plan

None - plan executed exactly as written. All 6 tasks completed as specified with no auto-fixes or architectural changes required.

## Issues Encountered

None - execution was smooth with all tasks completing successfully.

## User Setup Required

None - no external service configuration required. OAuth providers (Google/GitHub) are already configured in Supabase from earlier phases.

## Next Phase Readiness

**Ready for next plan (01-04):**
- Auth UI components complete and tested
- Protected route wrapper pattern established
- Public route wrapper prevents logged-in users from accessing auth pages
- OAuth callback flow handles redirects correctly

**Note:** The next plan (01-04) should implement the protected routes middleware and route guards that build on the ProtectedRoute pattern established here.

**Potential enhancements for future:**
- Forgot password flow (link exists but page not implemented)
- Remember me checkbox
- Social account linking (connect Google to existing email account)
- Password strength indicator
- Email verification flow (if required)

---
*Phase: 01-authentication*
*Plan: 03*
*Completed: 2026-02-05*
