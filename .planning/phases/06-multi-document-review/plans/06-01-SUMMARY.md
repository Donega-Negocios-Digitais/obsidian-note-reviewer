---
phase: 06-multi-document-review
plan: 01
subsystem: tabbed-interface
tags: [tabs, multi-document, drag-drop, keyboard-shortcuts]

# Dependency graph
requires: []
provides:
  - Tabbed interface for multiple documents
  - Tab state management hook
  - Drag reordering support
  - Keyboard shortcuts (Ctrl+W, Ctrl+1-9)
  - Tab persistence in localStorage
affects: [mult-01-complete, phase-06-progress]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Tab state with activeTabId tracking"
    - "Drag and drop with HTML5 draggable API"
    - "localStorage for tab order persistence"
    - "Keyboard shortcuts for power users"
    - "Modified indicator for unsaved changes"
    - "Max tabs limit (10) with reuse on existing"

key-files:
  created:
    - apps/portal/src/hooks/useDocumentTabs.ts
    - apps/portal/src/components/DocumentTabs.tsx
    - apps/portal/src/components/DocumentWorkspace.tsx
  modified: []

key-decisions:
  - "Max 10 tabs to prevent overwhelming UI"
  - "Reuse existing tab if document already open"
  - "Active tab switches when closing current tab"
  - "Tab content includes markdown + annotations panel"
  - "Close button only visible on hover (except compact variant)"
  - "Keyboard shortcuts: Ctrl+W close, Ctrl+1-9 switch"
  - "Compact variant available for smaller spaces"

patterns-established:
  - "Tab activation: click → setActiveTab → re-render content"
  - "Tab closing: remove → update active if needed → re-render"
  - "Drag reorder: dragStart → dragOver → drop → moveTab"
  - "Tab persistence: save on add/close → load on mount"

# Metrics
duration: 20min
completed: 2026-02-06
---

# Phase 6 Plan 01: Tabbed Interface Summary

**Complete tabbed interface for viewing multiple documents simultaneously**

## Performance

- **Duration:** 20 min
- **Started:** 2026-02-06T14:50:00Z
- **Completed:** 2026-02-06T15:10:00Z
- **Tasks:** 3
- **Files created:** 3
- **Total lines:** ~606

## Accomplishments

- Created useDocumentTabs hook with full state management
- Implemented addTab, closeTab, setActiveTab, moveTab, updateTab
- Added localStorage persistence for tab order
- Created DocumentTabs component with drag reordering
- Created DocumentTabsCompact variant
- Built DocumentWorkspace container component
- Added keyboard shortcuts (Ctrl+W, Ctrl+1-9)
- Integrated MarkdownRenderer and AnnotationExport per tab
- Empty state with keyboard shortcuts hint

## Task Commits

1. **useDocumentTabs Hook** - `apps/portal/src/hooks/useDocumentTabs.ts` (145 lines)
   - DocumentTab interface (id, documentId, title, content, modified, position)
   - addTab() - Create new tab or switch to existing
   - closeTab() - Remove tab and update active
   - setActiveTab() - Set active tab
   - moveTab() - Reorder tabs
   - updateTab() - Update tab properties
   - generateTabId() utility
   - localStorage persistence
   - Max tabs limit (10)

2. **DocumentTabs Component** - `apps/portal/src/components/DocumentTabs.tsx` (183 lines)
   - Full tab bar with drag reordering
   - Individual tab component with close button
   - Modified indicator (blue dot)
   - New tab button
   - DocumentTabsCompact variant
   - Active state styling
   - Hover effects for close button

3. **DocumentWorkspace Component** - `apps/portal/src/components/DocumentWorkspace.tsx` (278 lines)
   - Tab bar integration
   - Content area with markdown renderer
   - Annotations panel per tab
   - Grid layout (2:1 on desktop)
   - Empty state with shortcuts hint
   - Keyboard event handling
   - Annotation updates per tab

## Files Created

### apps/portal/src/hooks/useDocumentTabs.ts (145 lines)

**Interface:**
```typescript
interface DocumentTab {
  id: string;
  documentId: string;
  title: string;
  content: string;
  modified: boolean;
  position: number;
}
```

**Functions:**

| Function | Description |
|----------|-------------|
| `addTab(document)` | Add tab or switch to existing (max 10) |
| `closeTab(tabId)` | Close tab, update active if needed |
| `setActiveTab(tabId)` | Set active tab |
| `moveTab(tabId, newPos)` | Reorder tabs |
| `updateTab(tabId, updates)` | Update tab properties |

**Persistence:**
- Key: `obsreview-doc-tabs`
- Stores: documentId, title, position (no content for security)
- Loads on mount

### apps/portal/src/components/DocumentTabs.tsx (183 lines)

**Features:**
- Drag reordering with HTML5 API
- Active tab highlighting (blue border)
- Modified indicator (blue dot)
- Close button on hover
- New tab button (+)
- Max-width truncation for long titles
- Dark mode support

**States:**
| State | Style |
|-------|-------|
| Active | White bg, blue border, dark text |
| Inactive | Transparent, gray text |
| Hover | Gray background |

### apps/portal/src/components/DocumentWorkspace.tsx (278 lines)

**Layout:**
```
┌─────────────────────────────────┐
│ Tab1 │ Tab2 │ Tab3 │ + │         │
├───────────────────┬─────────────┤
│ Document Content  │ Annotations │
│ (MarkdownRenderer) │  (AnnotationExport)│
│                     │             │
└─────────────────────┴─────────────┘
```

**Keyboard Shortcuts:**
| Shortcut | Action |
|----------|--------|
| Ctrl+W | Close current tab |
| Ctrl+1-9 | Switch to tab 1-9 |
| Ctrl+T | Could open new tab (future) |

## Tab Behaviors

**Adding a tab:**
- Check if document already open (reuse if yes)
- Check max tabs limit (10)
- Generate unique ID: `tab-{timestamp}-{random}`
- Set as active tab
- Persist to localStorage

**Closing a tab:**
- Remove from tabs array
- If closing active tab, switch to right or left neighbor
- If no tabs left, activeTabId becomes null
- Update localStorage

**Reordering:**
- Drag tab to new position
- Reorder array and recalculate positions
- Active tab remains active after reorder

## Deviations from Plan

None - implementation followed plan exactly.

## Issues Encountered

None - all tasks completed successfully.

## Success Criteria Achievement

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Users can open multiple documents in tabs | ✅ | addTab with max 10 |
| Tabs show document titles | ✅ | Tab title display |
| Active tab visually highlighted | ✅ | Blue border + white bg |
| Tabs can be reordered | ✅ | Drag and drop support |

## Next Steps

Phase 6 Plan 02: Implement annotation state persistence across tab switches

---

*Phase: 06-multi-document-review*
*Plan: 01*
*Completed: 2026-02-06*
*Status: ✅ COMPLETE*
