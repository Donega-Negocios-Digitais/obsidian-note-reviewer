---
phase: "02"
plan: "02"
subsystem: "Annotation System - Threaded Comments"
tags:
  - react-mentions
  - supabase
  - zustand
  - comments
  - threads
  - mentions
  - recursive-rendering
---

# Phase 2 Plan 2: Build Threaded Comment System Summary

Implemented a threaded comment system with @mentions functionality for annotation discussions. Users can now have structured conversations about annotations with nested replies, user tagging, and real-time Supabase persistence.

## One-Liner

Threaded comment system with recursive nesting, @mentions autocomplete via react-mentions, Supabase persistence, and Portuguese timestamp formatting.

## Dependency Graph

**requires:**
- Phase 1 (Auth Infrastructure) - user authentication for comment authors
- Phase 2 Plan 1 (Enhanced Annotation System) - annotation targets for comment threads

**provides:**
- CommentThread component for displaying threaded discussions
- MentionsInput component for @mention autocomplete
- CommentInput component for comment submission
- useCommentStore for comment state management
- threadHelpers utilities for comment operations

**affects:**
- Phase 2 Plan 4 (Integration tasks) - will integrate with AnnotationPanel
- Phase 5 (Notification System) - can use mentions array for notifications

## Tech Stack

**Added:**
- `react-mentions` (4.4.10) - @mention autocomplete library
- `@types/react-mentions` (4.4.1) - TypeScript definitions
- `date-fns` (4.1.0) - Timestamp formatting with Portuguese locale

**Patterns:**
- Recursive component rendering for nested comment trees
- Optimistic updates with Supabase persistence rollback
- Mention markup format: `@__userId__` for storage
- Depth-based visual indentation (ml-4, ml-6)

## Key Files

**Created:**

| File | Description |
|------|-------------|
| `packages/ui/components/MentionsInput.tsx` | Textarea with @mention autocomplete, user search from Supabase |
| `packages/ui/components/CommentThread.tsx` | Threaded display with recursive nesting, edit/delete support |
| `packages/ui/components/CommentInput.tsx` | Form component with submit/cancel, keyboard shortcuts |
| `packages/ui/utils/threadHelpers.ts` | Utilities for thread operations, mention parsing, validation |
| `packages/ui/types.ts` | Comment, CommentThread, Mention interfaces (extended) |
| `packages/ui/store/useCommentStore.ts` | Zustand store for comment state with Supabase sync |

**Modified:**

| File | Changes |
|------|---------|
| `packages/ui/package.json` | Added react-mentions, @types/react-mentions, date-fns dependencies |
| `package.json` | Root package lockfile updated |
| `bun.lock` | Dependency lockfile updated |

## Decisions Made

1. **Mention markup format**: Using `@__userId__` format for storage (different from display `@displayName`) to handle username changes and allow efficient queries

2. **Recursive rendering**: CommentThread uses recursive CommentThreadItem component for nested replies with configurable maxDepth (default: 5)

3. **Portuguese localization**: All UI labels and timestamps use Portuguese (pt-BR locale) per project requirements

4. **Optimistic updates**: Comments appear immediately in UI with Supabase sync in background; rollback on error

5. **Component separation**: Created both CommentInput (full form with cancel) and QuickCommentInput (lightweight variant) for different use cases

## Deviations from Plan

None - plan executed exactly as written.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Define comment and thread types | 7fb4517 | packages/ui/types.ts |
| 2 | Create useCommentStore | dcb430b | packages/ui/store/useCommentStore.ts |
| 3 | Create MentionsInput component | 71e3fed | packages/ui/components/MentionsInput.tsx |
| 4 | Build CommentThread component | 5486ddb | packages/ui/components/CommentThread.tsx |
| 5 | Create CommentInput component | c0c3a57 | packages/ui/components/CommentInput.tsx |
| 6 | Create thread helper utilities | 8c5f376 | packages/ui/utils/threadHelpers.ts |

## Verification

- [x] Comments display in threaded format with visual hierarchy (ml-4, ml-6 indentation)
- [x] @mentions autocomplete shows user list with avatars from Supabase users table
- [x] Replies nest under parent comments with depth-based indentation
- [x] Mentioned users are stored in comment.mentions array
- [x] Comment input supports @trigger for mentions

## Next Phase Readiness

**Ready for integration:**
- CommentThread component can be integrated into AnnotationPanel
- useCommentStore provides all necessary actions (addThread, addComment, etc.)
- MentionsInput can be used in other contexts (global comments, notes)

**Requires:**
- AnnotationPanel integration to connect threads to annotations
- CSS styling for mention-highlight class (currently inline styles)
- Error handling refinement for Supabase edge cases

**Future enhancements:**
- Real-time subscription for new comments (Supabase realtime)
- Comment editing/deletion permissions (currently: owner only)
- Thread status management (open/closed/archived)
- Mention notifications (Phase 5)

## Duration

- **Start:** 2026-02-05
- **End:** 2026-02-05
- **Duration:** ~10 minutes

## Authentication Gates

None - Supabase client already authenticated from Phase 1.
