# Template Management System Documentation

**Last Updated:** 2026-02-08
**Status:** ✅ Fully Implemented

## Overview

The Template Management System allows users to create custom note templates and categories that integrate with the Claude Code `nota-obsidian` skill for seamless note creation workflows.

## Features

### Custom Templates
- Create unlimited custom note templates
- Define template name, content, and category
- Visual card-based UI for template management
- Delete templates with confirmation dialog

### Custom Categories
- Create custom categories for organizing templates
- CRUD operations (Create, Read, Update, Delete)
- Integrates with built-in categories

### Storage
- localStorage-based persistence
- Schema validation for type safety
- Export/import functionality (via storage.ts utilities)

## Components

### CategoryManager
**Location:** `packages/ui/components/CategoryManager.tsx`

**Features:**
- List all categories (built-in + custom)
- Add new category with name input
- Delete custom categories (built-in protected)
- Visual distinction between built-in and custom

**Props:** None (uses internal state + storage)

**State:**
```typescript
{
  categories: CustomCategory[];
  newCategoryName: string;
  showDeleteDialog: boolean;
  categoryToDelete: string | null;
}
```

### NewTemplateModal
**Location:** `packages/ui/components/NewTemplateModal.tsx`

**Features:**
- Modal form for creating templates
- Template name input
- Category selection (built-in + custom)
- Template content textarea
- Save and Cancel actions

**Props:**
```typescript
interface NewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: CustomTemplate) => void;
}
```

## Data Structures

### CustomTemplate
```typescript
interface CustomTemplate {
  id: string;        // Unique ID (timestamp-based)
  name: string;      // Template display name
  category: string;  // Category ID (built-in or custom)
  content: string;   // Template content (markdown)
  createdAt: number; // Creation timestamp
}
```

### CustomCategory
```typescript
interface CustomCategory {
  id: string;        // Unique ID (timestamp-based)
  name: string;      // Category display name
  createdAt: number; // Creation timestamp
}
```

## Storage Functions

### Template Operations
```typescript
// Get all custom templates
getCustomTemplates(): CustomTemplate[]

// Save custom templates (replaces all)
saveCustomTemplates(templates: CustomTemplate[]): void

// Delete a specific template
deleteCustomTemplate(templateId: string): void
```

### Category Operations
```typescript
// Get all custom categories
getCustomCategories(): CustomCategory[]

// Save custom categories (replaces all)
saveCustomCategories(categories: CustomCategory[]): void

// Delete a specific category
deleteCustomCategory(categoryId: string): void
```

### Built-in Categories
```typescript
getBuiltInCategories(): Category[]
// Returns default categories that cannot be deleted
```

### All Categories
```typescript
getAllCategories(): Category[]
// Returns built-in + custom categories combined
```

## Usage in Settings Panel

### Location
Settings Panel → "Caminhos" tab

### UI Flow
1. User opens Settings Panel
2. Clicks "Caminhos" tab
3. Sees "Templates" section with custom template cards
4. Clicks "Novo Template" button to open modal
5. Fills in template details and saves
6. Template appears as a card in the list
7. Can delete template via trash icon

## Integration with nota-obsidian Skill

### How It Works
1. User runs `/nota-obsidian` in Claude Code
2. Skill loads templates from localStorage
3. User selects template from list (built-in + custom)
4. Template content is used for note creation
5. Note is saved with the selected template

### Template Selection
The skill reads:
- Built-in templates from `config.json`
- Custom templates from `localStorage` (key: `customTemplates`)
- Categories from both sources

## Built-in Categories

The following categories are built-in and cannot be deleted:
- **conceito** - Concept notes
- **pessoa** - Person profiles
- **livro** - Book summaries
- **vídeo** - Video notes
- **artigo** - Article summaries
- **podcast** - Podcast notes
- **palestra** - Talk/presentation notes
- **entrevista** - Interview notes
- **tutorial** - Tutorial notes
- **framework** - Framework documentation
- **projeto** - Project notes
- **dashboard** - Dashboard notes
- **checklist** - Checklist notes
- **jornada** - Journey/customer journey notes
- **newsletter** - Newsletter summaries
- **github** - GitHub-related notes
- **issues** - Issue tracking
- **karakeep** - Karakeep integration notes
- **citação** - Quote notes
- **prompt** - Prompt templates

## Example Templates

### Simple Template
```markdown
# {{titulo}}

**Data:** {{data}}
**Tipo:** {{tipo}}

## Resumo

{{conteudo}}

## Referências

- [Link original]({{link}})
```

### Complex Template
```markdown
# {{titulo}}

> {{citacao}}

**Autor:** {{autor}}
**Fonte:** {{fonte}}
**Data:** {{data}}

## Análise

{{analise}}

## Conexões

- Relacionado a: [[conexo]]
- Categoria: {{categoria}}
```

## Best Practices

1. **Use clear template names** - "Resumo de Livro" vs "Template 1"
2. **Organize by category** - Group related templates
3. **Include placeholders** - Use {{variable}} format for dynamic content
4. **Keep templates focused** - One purpose per template
5. **Test templates** - Create notes with templates before publishing
6. **Document placeholders** - List required variables in template description

## Translation Keys

All template-related UI text is translatable:

```json
{
  "newTemplate": {
    "title": "Novo Template",
    "name": "Nome do Template",
    "category": "Categoria",
    "content": "Conteúdo",
    "save": "Salvar",
    "cancel": "Cancelar"
  },
  "categoryManager": {
    "title": "Gerenciar Categorias",
    "add": "Nova Categoria",
    "delete": "Excluir",
    "builtInProtected": "Categorias embutidas não podem ser excluídas"
  }
}
```

## Troubleshooting

**Templates not appearing?**
- Check localStorage for `customTemplates` key
- Verify templates array structure matches CustomTemplate interface
- Check browser console for errors

**Categories not saving?**
- Verify CustomCategory interface compliance
- Check localStorage quota (may be full)
- Look for duplicate IDs

**Templates not showing in nota-obsidian?**
- Ensure templates are saved in correct localStorage key
- Check that skill has access to localStorage
- Verify template ID uniqueness

## Related Files

- `packages/ui/components/CategoryManager.tsx` - Category management UI
- `packages/ui/components/NewTemplateModal.tsx` - Template creation modal
- `packages/ui/utils/storage.ts` - Storage functions
- `packages/ui/utils/notePaths.ts` - Path and category utilities
- `packages/ui/components/SettingsPanel.tsx` - Settings panel integration

---

*For more information on templates, see the nota-obsidian skill documentation.*
