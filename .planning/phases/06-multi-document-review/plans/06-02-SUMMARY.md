---
phase: 06-multi-document-review
plan: 02
subsystem: annotation-state-persistence
tags: [persistence, state-management, dirty-tracking, sessionStorage]

# Dependency graph
requires:
  - phase: 06-multi-document-review
    plan: 01
    provides: Tabbed interface foundation
provides:
  - Per-tab annotation state management
  - Dirty tracking (unsaved changes detection)
  - sessionStorage persistence for recovery
  - Visual indicators for unsaved changes
  - Unsaved changes warning dialog
affects: [mult-02-complete, phase-06-progress]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Map-based state storage for O(1) lookups"
    - "JSON comparison for dirty detection"
    - "sessionStorage for session-scoped persistence"
    - "Ref-based tab identification"
    - "Component composition for state indicators"

key-files:
  created:
    - apps/portal/src/hooks/useTabAnnotations.ts
    - apps/portal/src/components/AnnotationStateIndicator.tsx
  modified:
    - apps/portal/src/components/DocumentTabs.tsx

key-decisions:
  - "sessionStorage for persistence (survives page reload, cleared on close)"
  - "Map instead of array for O(1) tab lookups"
  - "Dirty detection by comparing with original annotations"
  - "markTabClean updates originalAnnotations (not current state)"
  - "Multiple indicator components for different contexts"
  - "Warning dialog for unsaved changes before close"

patterns-established:
  - "Per-tab state: initialize → modify → mark clean or discard"
  - "Persistence: save to sessionStorage on every change"
  - "Dirty check: JSON.stringify(current) !== JSON.stringify(original)"
  - "Cleanup: removeTab clears state and updates storage"

# Metrics
duration: 16min
completed: 2026-02-06
---

# Phase 6 Plan 02: Annotation State Persistence Summary

**Complete annotation state persistence across tab switches with unsaved changes tracking**

## Performance

- **Duration:** 16 min
- **Started:** 2026-02-06T15:15:00Z
- **Completed:** 2026-02-06T15:31:00Z
- **Tasks:** 3
- **Files created:** 2
- **Files modified:** 1
- **Total lines:** ~469

## Accomplishments

- Created useTabAnnotations hook with per-tab state management
- Implemented dirty tracking (original vs current annotations)
- Added sessionStorage persistence for tab recovery
- Created AnnotationStateIndicator component (clean/dirty states)
- Created AnnotationStateDot for compact tab indicators
- Created AnnotationStateBadge for toolbar display
- Created UnsavedChangesWarning dialog
- Integrated AnnotationStateDot into DocumentTabs

## Task Commits

1. **useTabAnnotations Hook** - `apps/portal/src/hooks/useTabAnnotations.ts` (188 lines)
   - initializeTab() - Set up initial annotations for a tab
   - getTabAnnotations() - Retrieve annotations for a tab
   - setTabAnnotations() - Update and mark dirty if changed
   - markTabClean() - Mark tab as saved (updates originals)
   - removeTab() - Cleanup when tab is closed
   - isTabDirty() - Check if tab has unsaved changes
   - getDirtyTabCount() - Count dirty tabs
   - getDirtyTabIds() - List dirty tab IDs
   - hasUnsavedChanges() - Check if any tab is dirty
   - sessionStorage persistence
   - annotationsEqual() utility

2. **AnnotationStateIndicator Components** - `apps/portal/src/components/AnnotationStateIndicator.tsx` (214 lines)
   - AnnotationStateIndicator - Full indicator with save prompt
   - AnnotationStateDot - Compact dot for tabs
   - AnnotationStateBadge - Badge for toolbar
   - UnsavedChangesWarning - Modal dialog

3. **DocumentTabs Integration** - `apps/portal/src/components/DocumentTabs.tsx`
   - Replaced simple dot with AnnotationStateDot component
   - Shows modified indicator with tooltip

## Files Created

### apps/portal/src/hooks/useTabAnnotations.ts (188 lines)

**Interface:**
```typescript
interface TabAnnotationState {
  tabId: string;
  annotations: Annotation[];
  originalAnnotations: Annotation[]; // For dirty detection
  isDirty: boolean;
  lastModified: string;
}
```

**Key Functions:**

| Function | Description |
|----------|-------------|
| `initializeTab(tabId, annotations)` | Set up initial state for new tab |
| `getTabAnnotations(tabId)` | Get current annotations for tab |
| `setTabAnnotations(tabId, annotations)` | Update and track dirty |
| `markTabClean(tabId)` | Mark as saved (update originals) |
| `removeTab(tabId)` | Clean up tab state |
| `isTabDirty(tabId)` | Check if tab has unsaved changes |
| `getDirtyTabCount()` | Count of dirty tabs |
| `getDirtyTabIds()` | List of dirty tab IDs |
| `hasUnsavedChanges()` | Check if any tab is dirty |

**Persistence:**
- Uses sessionStorage (survives page reload)
- Key: `obsreview-tab-annotations`
- Stores: annotations, originalAnnotations, lastModified
- Updated on every setTabAnnotations and markTabClean

### apps/portal/src/components/AnnotationStateIndicator.tsx (214 lines)

**Components:**

| Component | Use Case |
|-----------|----------|
| `AnnotationStateIndicator` | Header/panel display |
| `AnnotationStateDot` | Tab title (compact) |
| `AnnotationStateBadge` | Toolbar badge |
| `UnsavedChangesWarning` | Modal dialog |

**State Displays:**

**Clean State:**
```
○ 5 anotações
```

**Dirty State:**
```
⚠ 3 anotações não salvas [Salvar agora]
```

## Dirty Detection Algorithm

```typescript
// Check if current annotations differ from original
const isDirty = JSON.stringify(current) !== JSON.stringify(original);
```

Works because:
- JSON.stringify ensures consistent ordering
- Deep comparison of annotation objects
- Efficient enough for typical annotation counts

## Persistence Format

**sessionStorage:**
```json
{
  "tab-123": {
    "annotations": [...],
    "originalAnnotations": [...],
    "lastModified": "2026-02-06T15:30:00.000Z"
  },
  "tab-456": { ... }
}
```

**Note:** Content not stored (for security), only structure and metadata.

## User Flow

```
1. User opens document in tab
2. initializeTab() called with document's annotations
3. User adds/edits annotations
4. setTabAnnotations() called → isDirty becomes true
5. Blue dot appears in tab title
6. User switches to another tab
7. Original tab's annotations preserved in state
8. User switches back → annotations restored from state
9. User saves → markTabClean() → blue dot disappears
```

## Unsaved Changes Warning

The `UnsavedChangesWarning` dialog can be shown before:
- Closing a dirty tab
- Closing the browser window
- Navigating away from the page

**Options:**
- **Cancel** - Abort the action
- **Descartar** - Lose changes
- **Salvar Tudo** - Save all dirty tabs

## Deviations from Plan

None - implementation followed plan exactly.

## Issues Encountered

None - all tasks completed successfully.

## Success Criteria Achievement

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Annotations persist when switching tabs | ✅ | Map-based per-tab storage |
| Each tab maintains its own state | ✅ | Unique tabId as key |
| Modified indicator shows unsaved changes | ✅ | AnnotationStateDot in tab |
| State persists across page refresh | ✅ | sessionStorage persistence |

## Next Steps

Phase 6 Plan 03: Create cross-reference visualization for linked documents

---

*Phase: 06-multi-document-review*
*Plan: 02*
*Completed: 2026-02-06*
*Status: ✅ COMPLETE*
