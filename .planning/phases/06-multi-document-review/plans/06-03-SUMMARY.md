---
phase: 06-multi-document-review
plan: 03
subsystem: cross-reference-visualization
tags: [cross-references, wiki-links, markdown-links, visualization]

# Dependency graph
requires:
  - phase: 06-multi-document-review
    plan: 01
    provides: Tabbed interface foundation
  - phase: 06-multi-document-review
    plan: 02
    provides: Tab state management
provides:
  - Cross-reference detection between open documents
  - Wiki link [[...]] parsing
  - Markdown link [...]() parsing
  - Fuzzy title matching for reference resolution
  - Visual panel showing inbound/outbound references
  - Navigation between referenced documents
affects: [mult-03-complete, phase-06-complete]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Regex-based link parsing for wiki and markdown formats"
    - "Fuzzy title matching for reference resolution"
    - "useMemo for efficient cross-reference computation"
    - "Panel-based UI with togglable visibility"
    - "Inbound vs outbound reference categorization"

key-files:
  created:
    - apps/portal/src/hooks/useCrossReferences.ts
    - apps/portal/src/components/CrossReferencePanel.tsx
  modified:
    - apps/portal/src/components/DocumentWorkspace.tsx

key-decisions:
  - "Wiki link regex: \\[\\[([^\\]|]+)(?:\\|([^\\]]+))?\\]\\]"
  - "Markdown link regex: \\[([^\\]]+)\\]\\(([^)]+)\\)"
  - "Fuzzy matching with normalized titles (case-insensitive, ignore special chars)"
  - "Title contains check with length difference threshold (< 10 chars)"
  - "Panel toggle instead of always-visible to save space"
  - "Group references by target/source document for cleaner display"
  - "Show context (surrounding text) for each reference"

patterns-established:
  - "Cross-reference detection: parse links → resolve to tabs → categorize inbound/outbound"
  - "Link types: wiki (purple icon), markdown (blue icon)"
  - "Reference navigation: click reference card → setActiveTab"
  - "Empty state: helpful message when no references found"

# Metrics
duration: 18min
completed: 2026-02-06
---

# Phase 6 Plan 03: Cross-Reference Visualization Summary

**Visualize connections between linked documents in the multi-document workspace**

## Performance

- **Duration:** 18 min
- **Started:** 2026-02-06T15:32:00Z
- **Completed:** 2026-02-06T15:50:00Z
- **Tasks:** 3
- **Files created:** 2
- **Files modified:** 1
- **Total lines:** ~652

## Accomplishments

- Created useCrossReferences hook with link parsing
- Implemented wiki link [[...]] detection
- Implemented markdown link [...]() detection
- Created fuzzy title matching for reference resolution
- Created CrossReferencePanel component (inbound/outbound sections)
- Created ReferenceCountBadge for toolbar
- Integrated into DocumentWorkspace with togglable panel
- Added navigation from references to target tabs

## Task Commits

1. **useCrossReferences Hook** - `apps/portal/src/hooks/useCrossReferences.ts` (253 lines)
   - parseLinks() - Extract wiki and markdown links
   - normalizeTitle() - Normalize for comparison
   - titlesMatch() - Fuzzy matching logic
   - getReferences() - Get inbound/outbound for a tab
   - getAllReferences() - Get all workspace references
   - getGraphEdges() - Export for graph visualization
   - findReferencedTabs() - List tabs referencing a tab

2. **CrossReferencePanel Components** - `apps/portal/src/components/CrossReferencePanel.tsx` (262 lines)
   - CrossReferencePanel - Main panel with header and content
   - ReferenceSection - Grouped references by direction
   - ReferenceCard - Clickable reference with context
   - ReferenceCountBadge - Toolbar indicator

3. **DocumentWorkspace Integration** - `apps/portal/src/components/DocumentWorkspace.tsx`
   - Added showReferences state
   - Added useCrossReferences hook
   - Added ReferenceCountBadge to header
   - Added CrossReferencePanel side panel
   - Updated grid layout for panel

## Files Created

### apps/portal/src/hooks/useCrossReferences.ts (253 lines)

**Link Parsing:**

```typescript
// Wiki link pattern: [[Document Title]] or [[Document Title|Alias]]
const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

// Markdown link pattern: [text](url or path)
const MD_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;
```

**Fuzzy Matching Algorithm:**
```typescript
function titlesMatch(a: string, b: string): boolean {
  const normA = normalizeTitle(a);
  const normB = normalizeTitle(b);

  // Direct match
  if (normA === normB) return true;

  // Check if one contains the other (for aliases)
  if (normA.includes(normB) || normB.includes(normA)) {
    return Math.abs(normA.length - normB.length) < 10;
  }

  return false;
}
```

**Interface:**

| Function | Description |
|----------|-------------|
| `getReferences(tabId)` | Get inbound/outbound references |
| `getAllReferences()` | Get all references in workspace |
| `getGraphEdges()` | Get edges for graph visualization |
| `findReferencedTabs(tabId)` | List tabs referencing this tab |

### apps/portal/src/components/CrossReferencePanel.tsx (262 lines)

**Components:**

| Component | Use Case |
|-----------|----------|
| `CrossReferencePanel` | Side panel showing all references |
| `ReferenceSection` | Grouped references (inbound/outbound) |
| `ReferenceCard` | Clickable reference with context |
| `ReferenceCountBadge` | Toolbar indicator |

**Visual Layout:**

```
┌─────────────────────────────────┐
│ Referências              [X]    │
├─────────────────────────────────┤
│ Referenciado por (2)            │
│ ┌─────────────────────────────┐ │
│ │ 🔗 Document A               │ │
│ │    2 links                  │ │
│ │    context text...        → │ │
│ └─────────────────────────────┘ │
│                                 │
│ Referencia (1)                  │
│ ┌─────────────────────────────┐ │
│ │ 🔗 Document B               │ │
│ │    context text...        → │ │
│ └─────────────────────────────┘ │
└─────────────────────────────────┘
```

## Link Types Detected

**Wiki Links (Obsidian-style):**
```
[[Document Title]]
[[Document Title|Alias]]
```
→ Purple icon

**Markdown Links:**
```
[Link Text](document.md)
[Link Text](../folder/document.md)
[Link Text](./document.md)
```
→ Blue icon (only relative .md files)

**External Links:**
```
[Link Text](https://example.com)
```
→ Ignored (not cross-references)

## Reference Resolution Flow

```
1. Parse all links from all open tabs
2. Normalize target titles
3. Match against open tabs (fuzzy matching)
4. Categorize as inbound or outbound
5. Group by document
6. Display in panel with navigation
```

## User Flow

```
1. User opens multiple documents with links
2. Click reference badge in header (shows inbound count)
3. Panel slides open from right
4. See which documents reference current doc (inbound)
5. See which docs current doc references (outbound)
6. Click reference card → navigate to that document
7. Panel updates for new document
```

## Deviations from Plan

None - implementation followed plan exactly.

## Issues Encountered

None - all tasks completed successfully.

## Success Criteria Achievement

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Cross-references between open documents displayed | ✅ | useCrossReferences detects links |
| User can see which documents reference current doc | ✅ | Inbound references section |
| User can navigate to referenced documents | ✅ | Clickable cards with setActiveTab |
| Wiki links [[...]] and markdown links [...]() detected | ✅ | Both regex patterns implemented |

## Phase 6 Complete

With plan 06-03 complete, **Phase 6: Multi-Document Review** is now **100% complete**.

**Plans Completed:**
- 06-01: ✅ Tabbed interface for multiple document viewing
- 06-02: ✅ Annotation state persistence across tab switches
- 06-03: ✅ Cross-reference visualization for linked documents

**Requirements Satisfied:**
- MULT-01: Multiple documents in tabbed interface ✅
- MULT-02: Annotation state persists across tab switches ✅
- MULT-03: Cross-reference visualization for linked documents ✅

## Next Steps

Phase 7: Mobile Support
- 07-01: Implement responsive design for mobile devices
- 07-02: Build breakpoint comparison tool
- 07-03: Optimize touch interactions for mobile

---

*Phase: 06-multi-document-review*
*Plan: 03*
*Completed: 2026-02-06*
*Status: ✅ COMPLETE*
