# Phase 8: Configuration System - Research

**Researched:** 2026-02-06
**Domain:** React in-editor configuration panels, drawer/sidebar patterns, i18n, settings persistence
**Confidence:** HIGH

## Summary

This phase focuses on redesigning the existing in-editor settings panel (`SettingsPanel.tsx`) with Apple-style design and adding language selection (i18n). The project already has a working settings panel with 8 categories, but it needs visual improvements and the addition of a 9th category for language selection.

**Key findings:**
1. **Existing implementation**: A functional `SettingsPanel` component already exists with 8 categories, using tab-based navigation and localStorage persistence
2. **Standard stack**: No additional libraries needed - existing React + Tailwind CSS + localStorage is sufficient
3. **Apple-style patterns**: Use proper spacing (16-24px), subtle shadows, smooth transitions, SF Pro-like typography (already in project)
4. **i18n approach**: `react-i18next` is the standard library for React internationalization in 2026
5. **Route removal**: React Router v7 uses `<Navigate />` component for redirects - old `/settings` routes should redirect to editor

**Primary recommendation:** Redesign the existing `SettingsPanel` component with improved visual design following Apple's Human Interface Guidelines, add a 9th category for language selection using `react-i18next`, and remove the standalone `/settings` route by redirecting it to `/editor` with settings open.

## User Constraints (from STATE.md)

### Locked Decisions
- **Configurações dentro do editor** - O editor é a página principal, sem /settings nem /dashboard separados. Melhor UX, menos navegação. Status: Confirmed
- Remover rotas /settings e /dashboard - Não existem páginas de configuração separadas — tudo fica integrado ao editor. Status: Pending implementation

### Claude's Discretion
- None specified - research should provide recommendations for implementation approach

### Deferred Ideas (OUT OF SCOPE)
- None specified

## Standard Stack

The project already has all necessary libraries. No additional installations required.

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x | UI framework | Project standard |
| React Router DOM | 7.13.0 | Routing, redirect removal | Latest v7 with `<Navigate />` for redirects |
| Tailwind CSS | 4.x | Styling, animations | Project standard, ideal for slide-over panels |
| Supabase JS | 2.89.0 | Per-user settings storage | Already integrated for authentication |
| Zustand | 5.0.9 | State management | Already in project for global state |

### To Add (NEW for this phase)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react-i18next | Latest | Internationalization for language selection | Adding 9th settings category for pt-BR/en-US |
| i18next | Latest | i18n core (peer dependency) | Required by react-i18next |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-i18next | react-intl | react-i18next has simpler API, better ecosystem support, smaller bundle size |
| Existing SettingsPanel | shadcn/ui Sheet/Drawer | shadcn/ui components are excellent but require additional setup - current custom implementation is sufficient |
| Custom slide-over | Radix UI Dialog/Sheet | Radix is powerful but overkill for this use case |

**Installation:**
```bash
bun add react-i18next i18next
```

## Architecture Patterns

### Current Project Structure
```
apps/portal/src/
├── pages/
│   └── settings.tsx          # STANDALONE PAGE TO BE REMOVED
├── components/
│   ├── SettingsLayout.tsx    # Apple-style layout (can be reused)
│   └── SettingsItem.tsx      # Reusable setting items (can be reused)
└── App.tsx                   # Contains /settings route (to be removed)

packages/editor/
└── App.tsx                   # Main editor app
    └── Uses SettingsPanel from packages/ui

packages/ui/components/
├── SettingsPanel.tsx         # EXISTING IN-EDITOR SETTINGS (to be redesigned)
└── [other panel components]

packages/ui/utils/
├── storage.ts               # Settings persistence (localStorage)
└── [existing utilities]
```

### Pattern 1: In-Editor Settings Panel (Existing)
**What:** The existing `SettingsPanel` component is a full-screen overlay within the editor that shows settings using tab-based navigation.

**When to use:** The editor is the main application - settings should be accessible without leaving the editor context.

**Current implementation:**
```tsx
// From packages/editor/App.tsx
const [isSettingsPanelOpen, setIsSettingsPanelOpen] = useState(false);

// Settings panel replaces entire editor view when open
{isSettingsPanelOpen ? (
  <SettingsPanel
    isOpen={isSettingsPanelOpen}
    onClose={() => {
      setIsSettingsPanelOpen(false);
      setShowStickyBar(false);
    }}
    // ... other props
  />
) : (
  // Normal editor view
)}
```

**Improvement needed:** Instead of replacing entire view, make it a right sidebar slide-over panel that allows viewing the document while editing settings.

### Pattern 2: Slide-Over Panel (Apple-Style)
**What:** A panel that slides in from the right side of the screen, overlaying content partially rather than replacing it entirely. This is the macOS System Preferences pattern.

**When to use:** For settings panels, inspectors, and configuration views that should provide context to the main content.

**Example implementation (Tailwind CSS):**
```tsx
// Apple-style slide-over panel
<div className={`
  fixed inset-y-0 right-0 w-full md:w-[480px] bg-background
  shadow-2xl transform transition-transform duration-300 ease-in-out
  ${isOpen ? 'translate-x-0' : 'translate-x-full'}
  z-50
`}>
  {/* Panel content */}
</div>
```

### Pattern 3: Settings Persistence (Hybrid Approach)
**What:** Use localStorage for local-only settings and Supabase `user_profiles` table for per-user settings that sync across devices.

**When to use:**
- **localStorage**: UI preferences (theme, panel state), local-only configurations
- **Supabase**: User identity, preferences that sync across devices, collaborative settings

**Example:**
```tsx
// Local-only setting
const [theme, setTheme] = useState(() =>
  localStorage.getItem('theme') || 'dark'
);
useEffect(() => {
  localStorage.setItem('theme', theme);
}, [theme]);

// Per-user setting (syncs across devices)
const { data: { user } } = useSupabaseClient().auth.getUser();
const { data: profile } = useSupabaseClient()
  .from('user_profiles')
  .select('*')
  .eq('user_id', user?.id)
  .single();
```

### Pattern 4: Language Selection with i18next
**What:** Using react-i18next to provide language switching (pt-BR, en-US).

**When to use:** When adding internationalization support to the application.

**Example:**
```tsx
import { useTranslation } from 'react-i18next';
import i18n from 'i18next';

function LanguageSelector() {
  const { t } = useTranslation();

  return (
    <select
      value={i18n.language}
      onChange={(e) => i18n.changeLanguage(e.target.value)}
    >
      <option value="pt-BR">Português (Brasil)</option>
      <option value="en-US">English (US)</option>
    </select>
  );
}
```

### Anti-Patterns to Avoid
- **Separate settings page**: Don't navigate away from the editor to change settings - it breaks context and workflow
- **Settings in URL**: Don't use `/settings/theme` routes - use state-based panel instead
- **Blocking overlay**: Don't block the entire UI when showing settings - use slide-over panel
- **Custom slide animations**: Don't build custom animations - use Tailwind's transition utilities

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Slide-over panel animation | Custom CSS animations | Tailwind `transition-transform translate-x` | Browser-optimized, consistent with project |
| Internationalization | Custom translation system | react-i18next | Handles pluralization, interpolation, namespaces; industry standard |
| Settings form state | Custom form handling | React useState with useEffect | Sufficient for simple settings; no need for heavy form libraries |
| Toggle switches | Custom toggle component | Existing pattern in SettingsItem.tsx | Already implemented and tested |

**Key insight:** For this phase, the existing infrastructure is largely sufficient. The main work is visual redesign and adding the language selector - not building new functionality from scratch.

## Common Pitfalls

### Pitfall 1: Replacing Editor View with Settings
**What goes wrong:** When settings panel opens, it completely replaces the editor view, making it impossible to see the document being edited while changing settings.

**Why it happens:** The current implementation uses a ternary that shows either settings OR editor, not both.

**How to avoid:** Use a slide-over panel pattern with z-index layering instead of conditional rendering:

```tsx
// BAD: Current approach
{isSettingsPanelOpen ? <SettingsPanel /> : <Editor />}

// GOOD: Slide-over approach
<>
  <Editor />
  {isSettingsPanelOpen && (
    <div className="fixed inset-y-0 right-0 z-50">
      <SettingsPanel />
    </div>
  )}
</>
```

**Warning signs:** Can't see document content while settings are open; settings take up full screen.

### Pitfall 2: Not Persisting Settings Immediately
**What goes wrong:** User changes settings but they're lost on refresh or navigate away.

**Why it happens:** Settings are stored in component state only, without syncing to localStorage or Supabase.

**How to avoid:** Use useEffect to persist settings on change:

```tsx
useEffect(() => {
  localStorage.setItem('theme', theme);
  supabase
    .from('user_profiles')
    .update({ theme })
    .eq('user_id', user.id);
}, [theme, user.id]);
```

**Warning signs:** Settings reset on page refresh; changes don't sync across devices.

### Pitfall 3: Hardcoded Redirects After Route Removal
**What goes wrong:** After removing `/settings` route, old links/bookmarks break with 404 errors.

**Why it happens:** Routes are removed without handling legacy URLs.

**How to avoid:** Add redirect route that opens settings in editor:

```tsx
// In App.tsx
<Route
  path="/settings"
  element={<Navigate to="/editor" state={{ openSettings: true }} replace />}
/>

// In Editor component
const location = useLocation();
useEffect(() => {
  if (location.state?.openSettings) {
    setIsSettingsPanelOpen(true);
  }
}, [location.state]);
```

**Warning signs:** Old bookmarks show 404; direct links to /settings break.

### Pitfall 4: Loading Translations Synchronously
**What goes wrong:** App shows untranslated text or "loading" while translations load.

**Why it happens:** i18next resources are loaded synchronously on the client side.

**How to avoid:** Use i18next's built-in loading state and preload resources:

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, ready } = useTranslation();

  if (!ready) {
    return <div>Loading...</div>;
  }

  return <div>{t('welcome')}</div>;
}
```

**Warning signs:** Flash of untranslated text; "key" strings shown instead of translated text.

### Pitfall 5: Mobile Responsiveness
**What goes wrong:** Settings panel unusable on mobile - too wide, wrong touch targets.

**Why it happens:** Desktop-first design without mobile considerations.

**How to avoid:** Use responsive width and full-screen on mobile:

```tsx
<div className={`
  fixed inset-y-0 right-0
  w-full md:w-[480px] lg:w-[560px]  // Responsive width
  bg-background shadow-2xl
  ${isOpen ? 'translate-x-0' : 'translate-x-full'}
`}>
  {/* Content with min touch targets (44px) */}
</div>
```

**Warning signs:** Horizontal scroll on mobile; buttons too small to tap.

## Code Examples

Verified patterns from official sources:

### Slide-Over Panel Animation
```tsx
// Source: Tailwind CSS transition utilities
// https://tailwindcss.com/docs/transition

interface SlideOverPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function SlideOverPanel({ isOpen, onClose, children }: SlideOverPanelProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/50 backdrop-blur-sm z-40
          transition-opacity duration-300
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed inset-y-0 right-0
          w-full md:w-[480px] bg-background
          shadow-2xl z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">Configurações</h2>
            <button onClick={onClose} className="p-2 hover:bg-muted rounded">
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
```

### i18next Setup
```tsx
// Source: react-i18next documentation
// https://react.i18next.com/getting-started

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  'pt-BR': {
    translation: {
      'settings.title': 'Configurações',
      'settings.theme': 'Tema',
      'settings.language': 'Idioma',
    }
  },
  'en-US': {
    translation: {
      'settings.title': 'Settings',
      'settings.theme': 'Theme',
      'settings.language': 'Language',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt-BR', // Default language
    fallbackLng: 'en-US',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
```

### Language Selector Component
```tsx
// Source: Pattern from react-i18next best practices
// https://react.i18next.com/guides/multi-language-app

import { useTranslation } from 'react-i18next';

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
    { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  ];

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">🌐</span>
      <select
        value={i18n.language}
        onChange={(e) => i18n.changeLanguage(e.target.value)}
        className="px-3 py-2 bg-background rounded-md text-sm border border-border focus:border-primary focus:outline-none"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}
```

### Settings Persistence with Supabase
```tsx
// Source: Supabase documentation + React best practices
// https://supabase.com/docs/guides/auth/server-side/rendering

import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

export function useSettings() {
  const supabase = useSupabaseClient();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load settings from Supabase
    async function loadSettings() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setSettings(data);
      setLoading(false);
    }

    loadSettings();
  }, [supabase]);

  const updateSetting = async (key: string, value: any) => {
    // Update local state
    setSettings(prev => ({ ...prev, [key]: value }));

    // Update Supabase
    const { data: { user } } = await supabase.auth.getUser();
    await supabase
      .from('user_profiles')
      .update({ [key]: value })
      .eq('user_id', user.id);
  };

  return { settings, loading, updateSetting };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Separate /settings page | In-editor slide-over panel | This phase | Better UX, less navigation |
| Hardcoded Portuguese text | i18next with pt-BR/en-US | This phase | Internationalization support |
| Route-based navigation | State-based panel | This phase | No URL pollution, faster transitions |
| Custom toggle switches | Standardized components | Already implemented | Consistent UI across app |

**Deprecated/outdated:**
- **<Redirect /> component**: Replaced with `<Navigate />` in React Router v6+ - use `<Navigate to="/editor" />` instead
- **Separate settings pages**: Anti-pattern in modern editor apps - all settings should be in-editor
- **URL-based settings state**: Don't use query params for panel state - use React state instead

## Open Questions

1. **Migration strategy for existing users with /settings bookmarks**
   - What we know: Some users may have bookmarked `/settings` URL
   - What's unclear: Whether analytics exist showing how many users access /settings directly
   - Recommendation: Add redirect route that opens editor with settings panel; monitor usage before removing

2. **Supabase user_profiles table schema**
   - What we know: Supabase is already set up for authentication
   - What's unclear: Exact schema of user_profiles table and what settings columns exist
   - Recommendation: Check migration files in `/supabase/migrations` before implementing persistence

3. **i18n resource file organization**
   - What we know: react-i18next needs resource files for translations
   - What's unclear: How to organize translation files (single file vs. namespaces per feature)
   - Recommendation: Start with single `translation.json` namespace; refactor to multiple namespaces if it grows large

## Sources

### Primary (HIGH confidence)
- [Tailwind CSS Transitions & Animation](https://tailwindcss.com/docs/animation) - Official documentation for slide-over animations
- [Tailwind CSS Drawers](https://tailwindcss.com/plus/ui-blocks/application-ui/overlays/drawers) - Official drawer component patterns
- [React Router v7 Documentation](https://reactrouter.com) - Current version using `<Navigate />` for redirects
- [Supabase Documentation](https://supabase.com/docs) - User profiles and storage patterns
- [Existing codebase](C:/dev/tools/obsidian-note-reviewer) - Current implementation analysis

### Secondary (MEDIUM confidence)
- [15 Best React UI Libraries for 2026](https://www.builder.io/blog/react-component-libraries-2026) - Industry trends for UI components
- [react-i18next vs react-intl 2026](https://intlpull.com/blog/react-i18next-vs-react-intl-comparison-2026) - i18n library comparison
- [Internationalization in React: Complete Guide 2026](https://www.glorywebs.com/blog/internationalization-in-react) - React i18n implementation patterns
- [How to Use React for State Persistence](https://www.uxpin.com/studio/blog/how-to-use-react-for-state-persistence/) - localStorage vs database patterns
- [Shadcn UI Sheet Component](https://ui.shadcn.com/docs/components/radix/sheet) - Slide-over panel reference implementation

### Tertiary (LOW confidence)
- [Stack Overflow: Make sidebar slide in from the left](https://stackoverflow.com/questions/69944010) - Community implementation examples
- [GitHub: react-sliding-side-panel](https://github.com/BenedicteGiraud/react-sliding-side-panel) - Alternative library (not using, but good reference)
- [YouTube: Build an Animated Sidebar with React and Tailwind CSS](https://www.youtube.com/watch?v=Pe1Vo2N3Z2c) - Video tutorial patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Existing project infrastructure is sufficient
- Architecture patterns: HIGH - Patterns verified with official documentation and current codebase
- i18n implementation: HIGH - react-i18next is industry standard with clear documentation
- Route removal: HIGH - React Router v7 patterns are well-documented
- Visual design: MEDIUM - Apple design patterns are documented but implementation will require iteration

**Research date:** 2026-02-06
**Valid until:** 2026-03-06 (30 days - React ecosystem moves quickly but these fundamentals are stable)
