---
phase: 05-configuration-system
plan: 03
subsystem: save-location-preferences
tags: [save-location, vault, cloud, annotations]

# Dependency graph
requires:
  - phase: 05-configuration-system
    plan: 01
    provides: Settings page foundation
provides:
  - Save location preference management
  - Vault path configuration
  - Cloud save option
  - Both locations option
  - Helper function for conditional saving
affects: [conf-03-complete, phase-08-progress]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "localStorage for preference persistence"
    - "Boolean flags for save destinations"
    - "Conditional save based on location setting"
    - "Async save with error handling"
    - "Result object indicating save success"

key-files:
  created:
    - apps/portal/src/hooks/useSaveLocation.ts

key-decisions:
  - "Three options: vault, cloud, both"
  - "Separate vault path storage"
  - "Boolean flags: shouldSaveToVault, shouldSaveToCloud"
  - "Helper function returns { vault, cloud } success"
  - "localStorage keys: obsreview-save-location, obsreview-vault-path"

patterns-established:
  - "Location flow: setLocation → localStorage → update flags"
  - "Save flow: check flags → save to destinations → return results"
  - "Vault path: setVaultPath → localStorage → available in hook"
  - "Error handling: try/catch with console.error for each destination"

# Metrics
duration: 12min
completed: 2026-02-06
---

# Phase 8 Plan 03: Save Location Preferences Summary

**Create save location preference system (vault/cloud/both)**

## Performance

- **Duration:** 12 min
- **Started:** 2026-02-06T17:26:00Z
- **Completed:** 2026-02-06T17:38:00Z
- **Tasks:** 2
- **Files created:** 1
- **Total lines:** ~140

## Accomplishments

- Created useSaveLocation hook
- Implemented three location options (vault/cloud/both)
- Added vault path configuration
- Created saveAnnotations helper function
- Added localStorage persistence

## Task Commits

1. **useSaveLocation Hook** - `apps/portal/src/hooks/useSaveLocation.ts` (140 lines)
   - Location state: vault/cloud/both
   - Vault path storage
   - setLocation and setVaultPath functions
   - Boolean flags: shouldSaveToVault, shouldSaveToCloud
   - saveAnnotations helper function

## Files Created

### apps/portal/src/hooks/useSaveLocation.ts (140 lines)

**Interface:**
```typescript
interface UseSaveLocationReturn {
  location: SaveLocation;              // 'vault' | 'cloud' | 'both'
  setLocation: (location) => void;      // Change location
  shouldSaveToVault: boolean;          // Save to vault?
  shouldSaveToCloud: boolean;          // Save to cloud?
  vaultPath?: string;                  // Configured vault path
  setVaultPath: (path: string) => void; // Set vault path
}
```

**Location Behavior:**

| Location | shouldSaveToVault | shouldSaveToCloud |
|----------|-------------------|-------------------|
| vault | true | false |
| cloud | false | true |
| both | true | true |

**localStorage Keys:**
- `obsreview-save-location`: 'vault' | 'cloud' | 'both'
- `obsreview-vault-path`: string (path to Obsidian vault)

## Save Function

**Helper Function:**
```typescript
async function saveAnnotations(
  location: SaveLocation,
  vaultPath: string,
  annotations: any[],
  cloudSave?: (annotations: any[]) => Promise<void>,
  vaultSave?: (path: string, annotations: any[]) => Promise<void>
): Promise<{ vault: boolean; cloud: boolean }>
```

**Return Value:**
```typescript
{
  vault: true,   // Successfully saved to vault
  cloud: false   // Failed to save to cloud (or not attempted)
}
```

**Save Logic:**
```
1. Check location setting
2. Determine which destinations to use
3. Save to vault (if enabled and path exists)
4. Save to cloud (if enabled and function exists)
5. Return success for each destination
6. Log errors without throwing
```

## Settings Integration

**In AnnotationsSettings section:**
```typescript
const { location, setLocation, vaultPath, setVaultPath } = useSaveLocation();

<SettingsSelect
  label="Salvar em"
  value={location}
  options={[
    { value: 'vault', label: 'Vault do Obsidian' },
    { value: 'cloud', label: 'Nuvem (Supabase)' },
    { value: 'both', label: 'Ambos' },
  ]}
  onChange={setLocation}
/>

{(location === 'vault' || location === 'both') && (
  <SettingsItem
    title="Caminho do Vault"
    action={<button onClick={() => setVaultPath(prompt('Path:'))}>
      {vaultPath || 'Selecionar...'}
    </button>}
  />
)}
```

## Usage Example

```typescript
function SaveButton() {
  const { location, vaultPath } = useSaveLocation();

  const handleSave = async () => {
    const result = await saveAnnotations(
      location,
      vaultPath,
      annotations,
      cloudSaveFn,  // Supabase save
      vaultSaveFn   // Local file save
    );

    if (result.vault) {
      showToast('Salvo no vault!');
    }
    if (result.cloud) {
      showToast('Salvo na nuvem!');
    }
    if (!result.vault && !result.cloud) {
      showToast('Falha ao salvar!', 'error');
    }
  };
}
```

## Error Handling

**Individual Destination Errors:**
```typescript
try {
  await vaultSave(vaultPath, annotations);
  result.vault = true;
} catch (e) {
  console.error('Failed to save to vault:', e);
  // Don't throw - continue with other destinations
}
```

This allows partial success (e.g., cloud succeeds even if vault fails).

## localStorage Persistence

**Read on Initialization:**
```typescript
const [location, setLocationState] = useState(() => {
  const stored = localStorage.getItem('obsreview-save-location');
  return stored || 'vault';
});
```

**Write on Change:**
```typescript
const setLocation = (newLocation: SaveLocation) => {
  setLocationState(newLocation);
  localStorage.setItem('obsreview-save-location', newLocation);
};
```

## Vault Path Configuration

**Path Storage:**
- Key: `obsreview-vault-path`
- Type: string
- Default: empty string

**Usage:**
```typescript
const { vaultPath, setVaultPath } = useSaveLocation();

// Set path
setVaultPath('/Users/alex/Obsidian');

// Get path
console.log(vaultPath); // '/Users/alex/Obsidian'
```

## Deviations from Plan

None - implementation followed plan exactly.

## Issues Encountered

None - all tasks completed successfully.

## Success Criteria Achievement

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Save location configurable | ✅ | Three options available |
| Vault/cloud/both options | ✅ | All three implemented |
| Preference persists | ✅ | localStorage integration |
| Save logic respects setting | ✅ | Boolean flags drive save |

## Next Steps

Plan 08-04: Build customizable prompt template editor for Claude Code integration.

---

*Phase: 05-configuration-system*
*Plan: 03*
*Completed: 2026-02-06*
*Status: ✅ COMPLETE*
