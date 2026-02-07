# Phase 8: Configuration System - In-Editor Design

**Status**: 📋 Planning
**Updated**: 2026-02-06

## Goal

Users can customize all preferences through an Apple-style settings panel WITHIN the editor interface — no separate pages.

## Key Decision

**CRITICAL:** This phase completely removes `/settings` and `/dashboard` routes. All configuration happens inside the editor via sidebar/modal/drawer.

## Depends On

- Phase 1: Authentication (user authentication for per-user settings)
- Phase 2: Annotation System (editor is functional)

## Success Criteria (What must be TRUE)

1. ✅ User can access settings panel from within the editor (gear icon → sidebar/modal, NOT a separate route)
2. ✅ User can configure theme preference (dark/light mode automatic) from editor
3. ✅ User can configure save location preference (Obsidian vault, cloud, or both) from editor
4. ✅ User can customize Claude Code integration prompt template from editor
5. ✅ **No `/settings` or `/dashboard` routes exist** — all removed
6. ✅ Settings panel has Apple-style design consistent with editor

## Requirements Coverage

- **CONF-01**: User can access settings interface from editor
- **CONF-02**: Theme configuration (dark/light mode automatic)
- **CONF-03**: Save location preference (vault/cloud/both)
- **CONF-04**: Customizable prompt template for Claude Code integration

## Plans (5 plans in sequence)

### 08-01: Design and build Apple-style settings panel/sidebar within editor UI

**Goal**: Create the settings panel component that lives inside the editor

**Tasks**:
1. Design settings panel as a right sidebar or modal drawer that slides in from the right
2. Use Apple-style design: clean, minimal, proper spacing, subtle shadows
3. Add settings gear icon to editor header/top bar
4. Panel should overlay editor content (not navigate away)
5. Add close button and ESC key to dismiss

**Acceptance Criteria**:
- Clicking gear icon opens settings panel overlay (no route change)
- Panel has Apple-style visual design (matches editor aesthetic)
- Close button and ESC key dismiss the panel
- Editor remains visible underneath with dimmed background

**Estimated Time**: 20 minutes

---

### 08-02: Implement theme configuration with automatic dark/light mode switching

**Goal**: Theme toggle accessible from settings panel

**Tasks**:
1. Add "Aparência" section to settings panel
2. Create theme toggle: Light / Dark / Automático
3. Implement automatic theme switching based on system preference
4. Apply theme immediately (no save button needed)
5. Persist theme preference to user settings

**Acceptance Criteria**:
- Settings panel has "Aparência" section
- Theme toggle shows current setting (Light/Dark/Automático)
- Selecting "Automático" follows system preference
- Theme changes immediately when selected
- Preference persists across sessions

**Estimated Time**: 15 minutes

---

### 08-03: Create save location preference system accessible from editor

**Goal**: Configure where notes are saved (vault/cloud/both)

**Tasks**:
1. Add "Salvar" section to settings panel
2. Create radio buttons: "Vault do Obsidian" / "Nuvem" / "Ambos"
3. Explain each option with helper text
4. Save preference to user settings
5. Update note saving logic to respect preference

**Acceptance Criteria**:
- Settings panel has "Salvar" section with clear options
- Each option has helper text explaining what it means
- Selected option persists across sessions
- Note saving behavior respects the selected preference

**Estimated Time**: 15 minutes

---

### 08-04: Build customizable prompt template editor for Claude Code integration within editor

**Goal**: Allow users to customize the Claude Code prompt template

**Tasks**:
1. Add "Claude Code" section to settings panel
2. Create textarea with default prompt template
3. Add "Resetar para padrão" button
4. Save custom template to user settings
5. Use saved template when sending feedback to Claude Code

**Acceptance Criteria**:
- Settings panel has "Claude Code" section
- Textarea shows current prompt template (editable)
- "Resetar para padrão" restores default template
- Custom template persists across sessions
- Claude Code integration uses the custom template

**Estimated Time**: 15 minutes

---

### 08-05: Remove /settings and /dashboard routes and pages entirely

**Goal**: Clean up any existing separate configuration pages

**Tasks**:
1. Search codebase for `/settings` and `/dashboard` routes
2. Remove route definitions from router config
3. Remove page components (SettingsPage.tsx, DashboardPage.tsx, etc.)
4. Remove any navigation links to these routes
5. Test that these routes return 404

**Acceptance Criteria**:
- No `/settings` route exists (404 when accessed)
- No `/dashboard` route exists (404 when accessed)
- No navigation links point to these routes
- All configuration is only accessible via editor settings panel
- App functions normally without these routes

**Estimated Time**: 10 minutes

---

## Wave Structure (Sequential Execution)

**Wave 1**: 08-01 (Settings panel UI) → 08-02 (Theme config)
**Wave 2**: 08-03 (Save location) → 08-04 (Prompt template)
**Wave 3**: 08-05 (Remove old routes)

**Total Estimated Time**: ~75 minutes

## Dependencies

- Must complete Wave 1 before Wave 2 (panel UI needed for settings)
- Must complete Wave 2 before Wave 3 (ensure new settings work before removing old routes)

## Definition of Done

- [ ] All 5 plans completed
- [ ] All success criteria met
- [ ] No `/settings` or `/dashboard` routes exist
- [ ] All configuration accessible from editor
- [ ] Apple-style design consistent with editor
- [ ] All preferences persist across sessions
- [ ] Manual testing passes: configure each setting, close/reopen, verify persisted

## Notes

- **IMPORTANT**: The editor is the single-page app. No navigation away from editor for settings.
- Settings panel is an overlay/drawer, not a separate page or route
- All user preferences stored in Supabase user_profiles table or localStorage
- Design should match Apple System Preferences / macOS Settings aesthetic
