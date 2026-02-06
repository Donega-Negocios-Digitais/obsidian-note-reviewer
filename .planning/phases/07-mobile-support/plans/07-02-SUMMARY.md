---
phase: 07-mobile-support
plan: 02
subsystem: breakpoint-preview
tags: [breakpoint, preview, comparison, visualization]

# Dependency graph
requires:
  - phase: 07-mobile-support
    plan: 01
    provides: Responsive design foundation
provides:
  - Breakpoint preview state management
  - Single/split/all preview modes
  - Floating preview toggle button
  - Side-by-side breakpoint comparison
affects: [mobl-02-complete, phase-07-progress]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useState for preview mode and active breakpoint"
    - "useMemo for computed visible breakpoints"
    - "Fixed positioning for full-screen overlay"
    - "Iframe-style containment with explicit sizing"
    - "Floating action button for toggle"

key-files:
  created:
    - apps/portal/src/hooks/useBreakpointPreview.ts
    - apps/portal/src/components/BreakpointPreview.tsx
  modified:
    - apps/portal/src/components/DocumentWorkspace.tsx

key-decisions:
  - "Preview modes: single (one), split (mobile+desktop), all (three)"
  - "Breakpoint sizes: 375x667 (mobile), 768x1024 (tablet), 1440x900 (desktop)"
  - "Full-screen fixed overlay with z-50"
  - "Floating toggle button fixed bottom-right"
  - "Explicit width/height styling for accurate preview"
  - "Labels show on 'all' mode only for cleaner look"

patterns-established:
  - "Preview flow: click toggle → overlay opens → select mode → see previews"
  - "Mode cycling: single → split → all → single"
  - "Breakpoint cycling: mobile → tablet → desktop → mobile"
  - "Close button exits preview mode"

# Metrics
duration: 15min
completed: 2026-02-06
---

# Phase 7 Plan 02: Breakpoint Comparison Tool Summary

**Build breakpoint comparison tool for viewing content across different device sizes**

## Performance

- **Duration:** 15 min
- **Started:** 2026-02-06T16:14:00Z
- **Completed:** 2026-02-06T16:29:00Z
- **Tasks:** 3
- **Files created:** 2
- **Files modified:** 1
- **Total lines:** ~430

## Accomplishments

- Created useBreakpointPreview hook for state management
- Created BreakpointPreview component with toolbar
- Implemented single/split/all preview modes
- Added floating preview toggle button
- Integrated into DocumentWorkspace

## Task Commits

1. **useBreakpointPreview Hook** - `apps/portal/src/hooks/useBreakpointPreview.ts` (135 lines)
   - Mode management (single/split/all)
   - Active breakpoint state
   - Visible breakpoints computation
   - Preview activation/deactivation
   - Cycle functions for mode/breakpoint

2. **BreakpointPreview Components** - `apps/portal/src/components/BreakpointPreview.tsx` (280 lines)
   - BreakpointPreview - Full-screen overlay with toolbar
   - BreakpointFrame - Individual preview frame
   - ModeButton - Mode toggle button
   - BreakpointButton - Breakpoint selector
   - PreviewToggleButton - Floating action button

3. **DocumentWorkspace Integration** - `apps/portal/src/components/DocumentWorkspace.tsx`
   - Wrapped content with BreakpointPreview
   - Toggle button appears in bottom-right corner

## Files Created

### apps/portal/src/hooks/useBreakpointPreview.ts (135 lines)

**Interface:**
```typescript
interface UseBreakpointPreviewReturn {
  mode: 'single' | 'split' | 'all';
  setMode: (mode: PreviewMode) => void;
  activeBreakpoint: 'mobile' | 'tablet' | 'desktop' | 'all';
  setActiveBreakpoint: (breakpoint: ActiveBreakpoint) => void;
  visibleBreakpoints: BreakpointSize[];
  toggleMode: () => void;
  cycleBreakpoint: () => void;
  isPreviewActive: boolean;
  activatePreview: () => void;
  deactivatePreview: () => void;
}
```

**Breakpoint Sizes:**
| Name | Width | Height | Icon |
|------|-------|--------|------|
| Mobile | 375px | 667px | 📱 |
| Tablet | 768px | 1024px | 📱 |
| Desktop | 1440px | 900px | 🖥️ |

### apps/portal/src/components/BreakpointPreview.tsx (280 lines)

**Toolbar Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ Breakpoint Preview  [Single|Split|All]  [📱Mobile|📱Tablet|🖥️]  [Cycle] [Close] │
└──────────────────────────────────────────────────────────────┘
```

**Preview Modes:**

| Mode | Visible Breakpoints | Layout |
|------|---------------------|--------|
| Single | 1 (selected) | Centered |
| Split | 2 (mobile + desktop) | Side by side |
| All | 3 (all) | Flex wrap |

**Toggle Button:**
```
      ┌─────────────────┐
      │  🖥️  Preview    │  ← Fixed bottom-right
      └─────────────────┘
```

## User Flow

```
1. User sees floating "Preview" button in bottom-right
2. Click button → full-screen overlay opens
3. Default mode: single (desktop shown)
4. Click "Split" → see mobile + desktop side-by-side
5. Click "All" → see all three breakpoints
6. Click breakpoint buttons → change which breakpoint(s) shown
7. Click "Cycle" → cycle through breakpoints
8. Click "Close" → exit preview mode
```

## Frame Rendering

Each breakpoint frame uses explicit sizing:
```typescript
<div
  style={{
    width: breakpoint.width,  // e.g., 375px
    height: breakpoint.height, // e.g., 667px
    maxWidth: '100%',          // Responsive on small screens
  }}
>
  {children}
</div>
```

This ensures accurate preview of how content will render at each size.

## Mode Behavior

**Single Mode:**
- Shows one breakpoint frame
- Defaults to active breakpoint
- Use breakpoint buttons to switch

**Split Mode:**
- Shows mobile + desktop by default
- Good for comparing mobile vs desktop
- 2 columns, flex wrap

**All Mode:**
- Shows all three breakpoints
- Full comparison across all sizes
- Labels show breakpoint name + dimensions

## Deviations from Plan

None - implementation followed plan exactly.

## Issues Encountered

None - all tasks completed successfully.

## Success Criteria Achievement

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Compare views across breakpoints | ✅ | Side-by-side preview |
| Toggle between single/split/all | ✅ | Mode buttons in toolbar |
| Accurate rendering at each breakpoint | ✅ | Explicit width/height frames |

## Next Steps

Plan 07-03: Optimize touch interactions for mobile annotation workflow.

---

*Phase: 07-mobile-support*
*Plan: 02*
*Completed: 2026-02-06*
*Status: ✅ COMPLETE*
