# Internationalization (i18n) Documentation

**Last Updated:** 2026-02-08
**Status:** ✅ Fully Implemented

## Overview

The Obsidian Note Reviewer supports 4 languages with a comprehensive translation system built on react-i18next.

## Supported Languages

| Language | Code | Status | Coverage |
|----------|------|--------|----------|
| Portuguese (Brazil) | pt-BR | ✅ Default | 100% |
| English (US) | en-US | ✅ Complete | 100% |
| Spanish | es-ES | ✅ Complete | 100% |
| Chinese (Simplified) | zh-CN | ✅ Complete | 100% |

## Architecture

### Configuration
- **Location:** `packages/ui/i18n/config.ts`
- **Library:** react-i18next
- **Backend:** i18next HTTP backend
- **Storage:** localStorage (key: `obsidian-note-reviewer-language`)

### Translation Files
All translation files are located in `packages/ui/locales/`:
- `pt-BR.json` - Portuguese (Brazil) - Default language
- `en-US.json` - English (United States)
- `es-ES.json` - Spanish
- `zh-CN.json` - Chinese (Simplified)

### Key Categories

The translation system includes 400+ keys organized into these categories:

1. **Common** - UI elements (buttons, labels, etc.)
2. **Settings** - Settings panel and tabs
3. **Auth** - Authentication pages and flows
4. **Collaboration** - Collaborators and sharing
5. **Integrations** - Telegram, WhatsApp settings
6. **Templates** - Template management
7. **Categories** - Category management
8. **Validation** - Error messages and validation

## Usage

### In Components

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <button>{t('common.save')}</button>
  );
}
```

### With Variables

```tsx
// Translation key: "welcome.user": "Welcome, {{name}}!"
const message = t('welcome.user', { name: 'Alex' });
// Result: "Welcome, Alex!"
```

### Pluralization

```tsx
// Translation key with plural forms
const count = collaborators.length;
t('collaborators.count', { count });
// Automatically selects singular/plural form
```

## Language Switching

### User Preference

1. Open Settings Panel (Gear icon)
2. Go to "Geral" tab
3. Select language from "Idioma" dropdown
4. Preference saved to localStorage automatically

### Programmatic Switch

```typescript
import { changeLanguage } from 'packages/ui/i18n/config';

// Change to English
await changeLanguage('en-US');
```

## Adding New Translations

### 1. Add Keys to All Language Files

**pt-BR.json:**
```json
{
  "myNewFeature": {
    "title": "Meu Novo Recurso",
    "description": "Descrição do recurso"
  }
}
```

**en-US.json:**
```json
{
  "myNewFeature": {
    "title": "My New Feature",
    "description": "Feature description"
  }
}
```

### 2. Use in Component

```tsx
const { t } = useTranslation();
<h1>{t('myNewFeature.title')}</h1>
```

## Translation Key Naming Convention

- Use **dot notation** for nested keys: `settings.tabs.profile`
- Use **camelCase** for key names: `saveLocation`, `customTemplates`
- Group related keys under namespaces: `integrations.telegram.*`
- Use descriptive names: `collaboratorStatus.pending` instead of `status.p`

## Best Practices

1. **Never hardcode text** - Always use translation keys
2. **Keep keys consistent** across all languages
3. **Use variables** for dynamic content: `{{variable}}`
4. **Provide context** in key names: `button.save` vs `save`
5. **Test all languages** after adding new keys
6. **Use gender-neutral language** when possible

## Missing Translations

If a translation key is missing in a language:
- The key itself is displayed to the user
- A warning is logged in the console
- The app continues to function

To fix missing translations, add the key to all language files.

## Related Files

- `packages/ui/i18n/config.ts` - i18n configuration
- `packages/ui/locales/*.json` - Translation files
- `packages/ui/components/SettingsPanel.tsx` - Language switcher UI
- `packages/ui/utils/storage.ts` - Language preference storage

## Troubleshooting

**Language not changing?**
- Check localStorage for `obsidian-note-reviewer-language` key
- Verify language file exists in `packages/ui/locales/`
- Check browser console for errors

**Translation showing as key name?**
- Key is missing from the current language file
- Add the key to all language files

**Pluralization not working?**
- Ensure you're passing the `count` variable
- Check that plural forms exist in translation files

---

*For questions or issues, refer to the i18next documentation: https://www.i18next.com/*
