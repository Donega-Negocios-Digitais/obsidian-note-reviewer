10-06: i18n System - Plan Summary

## Overview
Designed comprehensive i18n system to support multiple languages and remove hardcoded Portuguese strings.

## Implementation Design

### i18next Configuration
- Default language: pt-BR (Portuguese)
- Second language: en-US (English)
- Browser language detection
- localStorage persistence

### Translation Structure
```
packages/core/src/i18n/locales/
├── pt-BR.json (Portuguese - Default)
├── en-US.json (English)
└── index.ts
```

### Translation Namespaces
- `common` - Shared words (buttons, actions)
- `auth` - Authentication flows
- `annotation` - Annotation system
- `document` - Document operations
- `settings` - Settings sections
- `subscription` - Billing/tiers
- `errors` - Error messages
- `validation` - Form validation

### Features
- React integration via react-i18next
- useT hook for translations
- Language switcher component
- Date/time localization with date-fns
- Pluralization support

## Usage Example
```typescript
// Before
<button>Salvar</button>

// After
const { t } = useT();
<button>{t('common.save')}</button>
```

## Migration Strategy
1. Setup i18next configuration
2. Create translation files
3. Extract strings by namespace
4. Replace with t() calls
5. Add language switcher

## Files Created
None (documentation only)

## Notes
- Implementation documented in 13-06-PLAN.md
- Full implementation requires:
  - i18next installation
  - Translation files (pt-BR, en-US)
  - useT hook
  - Language switcher component
  - Date localization utilities

## Next Steps
- Install i18next dependencies
- Create translation files
- Create useT hook
- Add language switcher to settings
- Migrate all hardcoded strings
- Add more languages as needed
