# Phase 8: Configuration System - In-Editor Redesign

**Status**: 📋 Planning
**Updated**: 2026-02-06

## Goal

Redesign the existing in-editor settings panel with Apple-style design, ensuring all configuration categories work beautifully within the editor interface — no separate `/settings` or `/dashboard` pages.

## Key Decision

**CRITICAL:** All configuration happens inside the editor via the existing settings panel. The existing `/settings` route (if any) will be removed or redirected to the editor's settings panel.

## Existing Configuration Categories

The editor already has these settings categories (to be redesigned/improved):

| Ícone | Categoria | Descrição |
|-------|-----------|-----------|
| 📋 | Regras e Workflows | Configuração de regras de conteúdo e workflows |
| 📚 | Conteúdo de Terceiros | Template e regras para conteúdo de terceiros |
| ⚛️ | Notas Atômicas | Configurações para notas conceito/atômicas |
| 🗺️ | Notas Organizacionais | Configurações para MOCs e notas organizacionais |
| ✍️ | Conteúdo Próprio | Configurações para conteúdo próprio |
| 👤 | Identidade do Revisor | Personalização do perfil do revisor |
| ⌨️ | Atalhos de Teclado | Configuração de atalhos personalizados |
| 🔗 | Hooks | Configuração de hooks do sistema |
| 🌐 | Idioma | **NOVO** — Seleção de idioma da interface |

## Depends On

- Phase 1: Authentication (user authentication for per-user settings)
- Phase 2: Annotation System (editor is functional)

## Success Criteria (What must be TRUE)

1. ✅ All 9 configuration categories accessible from within the editor
2. ✅ Settings panel has Apple-style design (clean, minimal, beautiful)
3. ✅ Each category has proper icon, clear label, and organized content
4. ✅ Settings panel opens as sidebar/modal overlay (not separate route)
5. ✅ **No `/settings` or `/dashboard` routes exist** (or they redirect to editor)
6. ✅ Language selection (pt-BR, en-US) works and persists
7. ✅ All configuration changes persist across sessions

## Requirements Coverage

- **CONF-01**: User can access all settings from editor (9 categories)
- **CONF-02**: Apple-style design for settings panel
- **CONF-03**: Each category properly organized and functional
- **CONF-04**: Language selection added and working
- **CONF-05**: No separate settings/dashboard pages

## Plans (7 plans in sequence)

### 08-01: Analyze existing settings implementation and components

**Goal**: Understand current settings structure before redesign

**Tasks**:
1. Locate existing settings panel component in codebase
2. Document all 8 existing categories and their current implementation
3. Identify which categories need redesign vs minor improvements
4. Check if `/settings` route exists and what it does
5. Map current configuration storage (localStorage, Supabase, etc.)

**Acceptance Criteria**:
- Current settings component location documented
- All 8 categories analyzed and documented
- Storage mechanism identified
- Existing issues/gaps noted

**Estimated Time**: 10 minutes

---

### 08-02: Redesign settings panel with Apple-style design

**Goal**: Create beautiful Apple-style settings panel

**Tasks**:
1. Design settings panel as right sidebar that slides in (Apple System Preferences style)
2. Use clean Apple design: proper spacing (16-24px), subtle shadows, SF Pro-like font
3. Left sidebar: category list with icons (📋📚⚛️🗺️✍️👤⌨️🔗🌐)
4. Right panel: selected category's settings
5. Add settings gear icon to editor header (top right)
6. Smooth animations for open/close transitions
7. Close button (X) and ESC key to dismiss

**Acceptance Criteria**:
- Settings panel has Apple-style visual design
- Category sidebar shows all 9 categories with icons
- Clicking category shows its settings in right panel
- Smooth animations for open/close
- Works on desktop (right sidebar) and mobile (bottom sheet or full screen)

**Estimated Time**: 25 minutes

---

### 08-03: Redesign individual category settings (Regras, Workflows, Conteúdo)

**Goal**: Improve content-related categories with better UX

**Categories**:
- 📋 Regras e Workflows
- 📚 Conteúdo de Terceiros
- ⚛️ Notas Atômicas
- 🗺️ Notas Organizacionais
- ✍️ Conteúdo Próprio

**Tasks**:
1. Redesign each category's settings form with proper labels and inputs
2. Use consistent form components (text fields, selects, toggles)
3. Add helper text where needed (explaining what each setting does)
4. Group related settings with section headers
5. Add visual feedback when settings change
6. Ensure each category saves properly

**Acceptance Criteria**:
- All 5 content categories redesigned with Apple-style forms
- Each setting has clear label and helper text
- Settings save immediately or with clear "Save" button
- Changes persist across sessions
- Visual feedback for successful saves

**Estimated Time**: 20 minutes

---

### 08-04: Redesign reviewer identity and keyboard shortcuts

**Goal**: Improve personalization and productivity settings

**Categories**:
- 👤 Identidade do Revisor
- ⌨️ Atalhos de Teclado

**Tasks**:
1. **Identidade**: Add fields for name, avatar, bio, signature
2. **Atalhos**: Create keyboard shortcut editor (click to reassign)
3. Show current shortcuts with clear labels
4. Allow adding custom shortcuts
5. Add reset button to restore defaults
6. Save preferences properly

**Acceptance Criteria**:
- Identity category has form fields for personalization
- Keyboard shortcuts show current assignments
- Can reassign shortcuts by clicking and pressing new key
- Custom shortcuts can be added
- Reset button restores defaults
- All changes persist

**Estimated Time**: 15 minutes

---

### 08-05: Improve hooks configuration and add language selection

**Goal**: Enhance system settings and add internationalization

**Categories**:
- 🔗 Hooks
- 🌐 Idioma (NEW)

**Tasks**:
1. **Hooks**: Improve hooks configuration UI with clear labels
2. **Hooks**: Add test button for each hook
3. **Hooks**: Show hook status (active/inactive/error)
4. **Idioma**: Add language selector (pt-BR, en-US)
5. **Idioma**: Integrate with i18n system (from Phase 13)
6. **Idioma**: Apply language change immediately
7. **Idioma**: Persist language preference

**Acceptance Criteria**:
- Hooks show clear configuration options and status
- Can test hooks directly from settings
- Language selector shows available languages
- Changing language updates interface immediately
- Language preference persists
- All settings in these categories work correctly

**Estimated Time**: 15 minutes

---

### 08-06: Ensure all settings persist properly across sessions

**Goal**: Robust settings storage and retrieval

**Tasks**:
1. Audit all settings storage locations (localStorage vs Supabase)
2. Ensure per-user settings stored in Supabase user_profiles
3. Ensure local-only settings stored in localStorage
4. Add proper error handling for save failures
5. Show visual feedback when settings save (success/error toast)
6. Load settings on app startup and apply immediately
7. Handle settings sync for logged-in users

**Acceptance Criteria**:
- All user settings persist across browser sessions
- Logged-in users see same settings on different devices
- Local-only settings persist per device
- Save failures show clear error message
- Settings load and apply on startup
- No settings are lost on refresh

**Estimated Time**: 15 minutes

---

### 08-07: Remove /settings and /dashboard routes (if they exist)

**Goal**: Clean up any separate configuration pages

**Tasks**:
1. Search codebase for `/settings` and `/dashboard` routes
2. If found, remove route definitions from router config
3. Remove page components (SettingsPage.tsx, DashboardPage.tsx, etc.)
4. Remove any navigation links to these routes
5. If users might have bookmarks, add redirect to editor with settings open
6. Test that old routes redirect properly
7. Verify all settings are only accessible via editor panel

**Acceptance Criteria**:
- `/settings` and `/dashboard` routes redirect to editor or return 404
- No navigation links point to separate settings pages
- All configuration is only accessible via editor settings panel
- App functions normally without these routes
- Old bookmarks redirect to editor with settings open

**Estimated Time**: 10 minutes

---

## Wave Structure (Parallel Execution)

**Wave 1**: 08-01 (Analysis) — must complete first
**Wave 2**: 08-02 (Panel redesign) — builds on analysis
**Wave 3**: 08-03, 08-04, 08-05 (Category redesigns) — can run in parallel
**Wave 4**: 08-06 (Storage/ Persistence) — ensures all changes save
**Wave 5**: 08-07 (Remove old routes) — cleanup

**Total Estimated Time**: ~110 minutes (1h 50min)

## Dependencies

- 08-01 must complete before any redesign work
- 08-02 (panel UI) must complete before category redesigns
- All category redesigns should complete before 08-06
- 08-07 is final cleanup after everything works

## Settings Categories Summary

| # | Categoria | Ícone | Prioridade |
|---|-----------|-------|------------|
| 1 | Regras e Workflows | 📋 | Alta |
| 2 | Conteúdo de Terceiros | 📚 | Alta |
| 3 | Notas Atômicas | ⚛️ | Média |
| 4 | Notas Organizacionais | 🗺️ | Média |
| 5 | Conteúdo Próprio | ✍️ | Alta |
| 6 | Identidade do Revisor | 👤 | Média |
| 7 | Atalhos de Teclado | ⌨️ | Baixa |
| 8 | Hooks | 🔗 | Alta |
| 9 | Idioma | 🌐 | **NOVO** - Alta |

## Definition of Done

- [ ] All 7 plans completed
- [ ] All 9 categories accessible from editor settings panel
- [ ] Apple-style design implemented throughout
- [ ] Language selection (pt-BR, en-US) working
- [ ] No separate `/settings` or `/dashboard` routes
- [ ] All settings persist across sessions
- [ ] Visual feedback for all save operations
- [ ] Manual testing passes for each category

## Notes

- **IMPORTANT**: The editor is the single-page app. Settings are an overlay/sidebar, not a separate page.
- Apple System Preferences / macOS Settings is the design reference
- Per-user settings stored in Supabase, local-only in localStorage
- Language selector integrates with i18n system (Phase 13)
- All icons match the existing category icons (📋📚⚛️🗺️✍️👤⌨️🔗🌐)
