# UI Changes - 2026-02-10

## Scope

This update refines theme interaction and integration visuals in the editor UI.

## Implemented

1. Theme toggle UX
- `ModeToggle` now performs direct `light <-> dark` toggle on click.
- Dropdown behavior for theme selection was removed from this control.
- Icon behavior is contextual:
  - In dark mode, shows **sun** (switch to light).
  - In light mode, shows **moon** (switch to dark).

2. Theme transition smoothness
- Theme animation is now applied only during actual theme switching (`html.theme-switching`).
- Removed heavy global transition behavior that affected all interactions continuously.
- Added reduced-motion respect during theme switch handling.

3. Integration brand icons
- Updated `Notion` integration card icon to branded SVG style.
- Updated `Obsidian` integration card icon to branded SVG style.
- Removed unused duplicated icon declarations from `SettingsPanel`.

## Files changed

- `packages/ui/components/ModeToggle.tsx`
- `packages/ui/components/ThemeProvider.tsx`
- `packages/editor/index.css`
- `packages/ui/components/IntegrationsSettings.tsx`
- `packages/ui/components/SettingsPanel.tsx`

