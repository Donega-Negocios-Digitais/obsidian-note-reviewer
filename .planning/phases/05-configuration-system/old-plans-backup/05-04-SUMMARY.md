---
phase: 05-configuration-system
plan: 04
subsystem: prompt-template-editor
tags: [prompt-template, claude-code, editor]

# Dependency graph
requires:
  - phase: 05-configuration-system
    plan: 01
    provides: Settings page foundation
provides:
  - Prompt template editor component
  - Variable placeholder support
  - Template preview rendering
  - Variable insertion at cursor
  - Template persistence
affects: [conf-04-complete, phase-08-complete]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Textarea for template editing"
    - "Regex-based variable replacement"
    - "useMemo for preview optimization"
    - "Cursor position tracking"
    - "Variable suggestions panel"

key-files:
  created:
    - apps/portal/src/components/PromptTemplateEditor.tsx

key-decisions:
  - "Default variables: {{content}}, {{annotations}}, {{title}}, {{context}}"
  - "Variable insertion at cursor position"
  - "Preview shows template with example values"
  - "Collapsible variable suggestions panel"
  - "Edit/Save workflow for settings"
  - "localStorage key: obsreview-prompt-template"

patterns-established:
  - "Editor flow: type → toggle variables → insert → preview updates"
  - "Variable replacement: regex replace all occurrences"
  - "Cursor tracking: onSelect event → selectionStart"
  - "Preview: useMemo with template + variables dependency"

# Metrics
duration: 18min
completed: 2026-02-06
---

# Phase 8 Plan 04: Prompt Template Editor Summary

**Build customizable prompt template editor for Claude Code integration**

## Performance

- **Duration:** 18 min
- **Started:** 2026-02-06T17:39:00Z
- **Completed:** 2026-02-06T17:57:00Z
- **Tasks:** 2
- **Files created:** 1
- **Total lines:** ~240

## Accomplishments

- Created PromptTemplateEditor component
- Implemented variable placeholder system
- Added variable suggestions panel
- Created template preview rendering
- Added cursor position tracking
- Implemented variable insertion at cursor

## Task Commits

1. **PromptTemplateEditor Components** - `apps/portal/src/components/PromptTemplateEditor.tsx` (240 lines)
   - PromptTemplateEditor - Full editor with toolbar and preview
   - PromptTemplateViewer - Compact read-only viewer
   - Variable suggestions with insert buttons
   - Template preview with example values
   - Variable reference list

## Files Created

### apps/portal/src/components/PromptTemplateEditor.tsx (240 lines)

**Default Variables:**

| Variable | Description | Example |
|----------|-------------|---------|
| `{{content}}` | Conteúdo do documento | Markdown content... |
| `{{annotations}}` | Anotações atuais | - Issue on line 5 |
| `{{title}}` | Título do documento | My Document.md |
| `{{context}}` | Contexto adicional | Project notes |

**Editor Layout:**
```
┌─────────────────────────────────────────────────┐
│ Template do Prompt      [Variáveis] [Salvar]   │
├─────────────────────────────────────────────────┤
│ [Variables Panel - collapsible]                 │
│ Clique para inserir variável:                   │
│ [{{content}}] [{{annotations}}] [{{title}}]    │
├─────────────────────────────────────────────────┤
│                                                 │
│ [Textarea - Template editor]                    │
│ Por favor, revise o seguinte documento:        │
│                                                 │
├─────────────────────────────────────────────────┤
│ Variáveis disponíveis:                          │
│ • {{content}} - Conteúdo do documento           │
│ • {{annotations}} - Anotações atuais            │
│                                                 │
├─────────────────────────────────────────────────┤
│ Preview:                                        │
│ [Rendered template with example values]        │
└─────────────────────────────────────────────────┘
```

**PromptTemplateViewer (Compact):**
```
┌─────────────────────────────────────────────────┐
│ Template Atual                        [Editar]   │
│ ┌─────────────────────────────────────────────┐ │
│ │ Por favor, revise o seguinte...           │ │
│ └─────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

## Variable System

**Variable Format:**
```typescript
interface TemplateVariable {
  name: string;        // e.g., '{{content}}'
  description: string;  // e.g., 'Conteúdo do documento'
  example: string;      // e.g., 'Markdown content...'
}
```

**Insertion Logic:**
```typescript
const insertVariable = (variable: string) => {
  const before = template.substring(0, cursorPosition);
  const after = template.substring(cursorPosition);
  onChange(before + variable + after);
  setShowVariables(false); // Close panel
};
```

**Preview Rendering:**
```typescript
function renderPreview(template: string, variables: TemplateVariable[]): string {
  let preview = template;

  variables.forEach((variable) => {
    preview = preview.replace(
      new RegExp(variable.name, 'g'),
      variable.example
    );
  });

  return preview;
}
```

**Cursor Tracking:**
```typescript
const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  onChange(e.target.value);
  setCursorPosition(e.target.selectionStart);
};

// In textarea:
<select
  onSelect={(e) => setCursorPosition(e.target.selectionStart)}
  ...
/>
```

## Settings Integration

**IntegrationSettings Component:**
```typescript
const [promptTemplate, setPromptTemplate] = useState(DEFAULT);
const [isEditingPrompt, setIsEditingPrompt] = useState(false);

const handleSavePrompt = () => {
  localStorage.setItem('obsreview-prompt-template', promptTemplate);
  setIsEditingPrompt(false);
};

// Conditional rendering:
{isEditingPrompt ? (
  <PromptTemplateEditor
    template={promptTemplate}
    onChange={setPromptTemplate}
    onSave={handleSavePrompt}
  />
) : (
  <SettingsItem
    title="Template personalizado"
    description="Customizar o prompt enviado ao Claude Code"
    icon="📝"
    action={<button onClick={() => setIsEditingPrompt(true)}>Editar</button>}
  >
    <div>{promptTemplate}</div>
  </SettingsItem>
)}
```

## Default Template

```typescript
const DEFAULT_PROMPT_TEMPLATE = `Por favor, revise o seguinte documento:

Título: {{title}}
{{content}}

Anotações existentes:
{{annotations}}

{{context}}

Por favor, forneça feedback construtivo e sugestões de melhoria.`;
```

## Template Persistence

**localStorage:**
- Key: `obsreview-prompt-template`
- Type: string (full template)
- Default: DEFAULT_PROMPT_TEMPLATE

**Load on Mount:**
```typescript
const [promptTemplate, setPromptTemplate] = useState(() => {
  const saved = localStorage.getItem('obsreview-prompt-template');
  return saved || DEFAULT_PROMPT_TEMPLATE;
});
```

## User Flow

```
1. User opens Integration settings
2. Sees current template preview
3. Clicks "Editar" button
4. Editor opens with textarea
5. User types/edits template
6. Clicks "Variáveis" to see available variables
7. Clicks variable to insert at cursor
8. Preview updates automatically
9. Clicks "Salvar" to persist
10. Returns to compact view
```

## Deviations from Plan

None - implementation followed plan exactly.

## Issues Encountered

None - all tasks completed successfully.

## Success Criteria Achievement

| Criterion | Status | Evidence |
|-----------|--------|----------|
| Prompt template customizable | ✅ | Full editor with textarea |
| Variable placeholders supported | ✅ | {{var}} syntax with replacement |
| Template persists across sessions | ✅ | localStorage integration |
| Preview shows rendered output | ✅ | useMemo-based preview |

## Phase 8 Complete

With plan 08-04 complete, **Phase 8: Configuration System** is now **100% complete**.

**Plans Completed:**
- 08-01: ✅ Apple-style settings page UI
- 08-02: ✅ Theme configuration with dark/light mode
- 08-03: ✅ Save location preference system
- 08-04: ✅ Prompt template editor

**Requirements Satisfied:**
- CONF-01: Settings page with modern Apple-style design ✅
- CONF-02: Theme preference with automatic mode ✅
- CONF-03: Save location preference ✅
- CONF-04: Customizable prompt template ✅

## Next Steps

Phase 9: Sharing Infrastructure
- 09-01: Implement slug-based URL routing with validation
- 09-02: Build multi-user annotation system
- 09-03: Create permission system for shared plans

---

*Phase: 05-configuration-system*
*Plan: 04*
*Completed: 2026-02-06*
*Status: ✅ COMPLETE*
