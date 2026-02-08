/**
 * Keyboard Shortcuts Registry
 *
 * Centralized configuration for all keyboard shortcuts in the application.
 * Used for displaying in the shortcuts modal and for actual keyboard handlers.
 *
 * Features:
 * - Platform-aware display (Cmd vs Ctrl)
 * - Key combination, label, and description
 * - Category grouping
 * - Helper functions for tooltip formatting
 */

/**
 * Shortcut category for organizing shortcuts in the modal
 */
export type ShortcutCategory = 'modes' | 'actions' | 'editing' | 'navigation' | 'general';

/**
 * Shortcut definition
 */
export interface Shortcut {
  /** Unique identifier for the shortcut */
  id: string;
  /** Key code(s) that trigger the shortcut */
  key: string;
  /** Whether Ctrl (Windows/Linux) or Cmd (Mac) is required */
  modCtrl?: boolean;
  /** Whether Shift is required */
  modShift?: boolean;
  /** Whether Alt is required */
  modAlt?: boolean;
  /** Short label for the action (Portuguese) */
  label: string;
  /** Longer description of what the shortcut does (Portuguese) */
  description: string;
  /** Category for grouping in the modal */
  category: ShortcutCategory;
}

/**
 * Detect if the user is on a Mac
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform);
}

/**
 * Get the modifier key symbol for the current platform
 */
export function getModifierKey(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

/**
 * All registered keyboard shortcuts
 */
export const SHORTCUTS: Shortcut[] = [
  // Mode shortcuts
  {
    id: 'mode-selection',
    key: '1',
    label: 'Modo Seleção',
    description: 'Ativa o modo de seleção para adicionar anotações',
    category: 'modes',
  },
  {
    id: 'mode-edit',
    key: '2',
    label: 'Editar Nota',
    description: 'Ativa o modo de edição inline por bloco',
    category: 'modes',
  },
  {
    id: 'mode-edit-md',
    key: '3',
    label: 'Editar MD',
    description: 'Abre o editor markdown completo',
    category: 'modes',
  },
  {
    id: 'mode-redline',
    key: '4',
    label: 'Modo Exclusão',
    description: 'Ativa o modo de exclusão para remover texto',
    category: 'modes',
  },

  // Action shortcuts
  {
    id: 'global-comment',
    key: 'C',
    label: 'Comentário Global',
    description: 'Adiciona um comentário geral à nota',
    category: 'actions',
  },
  {
    id: 'save-vault',
    key: 'S',
    modCtrl: true,
    label: 'Salvar no Obsidian',
    description: 'Salva as alterações no vault do Obsidian',
    category: 'actions',
  },
  {
    id: 'export',
    key: 'E',
    label: 'Exportar',
    description: 'Abre o popup de exportação da nota',
    category: 'actions',
  },
  {
    id: 'share',
    key: 'L',
    modCtrl: true,
    label: 'Compartilhar',
    description: 'Copia o link de compartilhamento',
    category: 'actions',
  },

  // Editing shortcuts
  {
    id: 'undo-annotation',
    key: 'Z',
    modCtrl: true,
    label: 'Desfazer Anotação',
    description: 'Desfaz a última anotação adicionada',
    category: 'editing',
  },

  // General shortcuts
  {
    id: 'toggle-theme',
    key: 'D',
    label: 'Alternar Tema',
    description: 'Alterna entre modo claro e escuro',
    category: 'general',
  },
  {
    id: 'show-shortcuts',
    key: '?',
    label: 'Configurações',
    description: 'Abre o painel de configurações',
    category: 'general',
  },
];

/**
 * Category labels for display in the modal (Portuguese)
 */
export const CATEGORY_LABELS: Record<ShortcutCategory, string> = {
  modes: 'Modos',
  actions: 'Ações',
  editing: 'Edição',
  navigation: 'Navegação',
  general: 'Geral',
};

/**
 * Category order for display in the modal
 */
export const CATEGORY_ORDER: ShortcutCategory[] = ['modes', 'actions', 'editing', 'general', 'navigation'];

/**
 * Get shortcuts grouped by category (from localStorage if customized)
 */
export function getShortcutsByCategory(): Record<ShortcutCategory, Shortcut[]> {
  const grouped: Record<ShortcutCategory, Shortcut[]> = {
    modes: [],
    actions: [],
    editing: [],
    navigation: [],
    general: [],
  };

  // Check localStorage for custom shortcuts
  const stored = localStorage.getItem('obsreview-shortcuts');
  if (stored) {
    try {
      const customShortcuts = JSON.parse(stored);
      // Merge custom shortcuts with defaults
      for (const category of Object.keys(grouped)) {
        if (customShortcuts[category]) {
          grouped[category as ShortcutCategory] = customShortcuts[category];
        }
      }
      return grouped;
    } catch {
      // Fall through to defaults
    }
  }

  // Use defaults
  for (const shortcut of SHORTCUTS) {
    grouped[shortcut.category].push(shortcut);
  }

  return grouped;
}

/**
 * Format a shortcut's key combination for display
 * @param shortcut The shortcut to format
 * @returns Formatted key combination string (e.g., "Ctrl+Z" or "⌘Z")
 */
export function formatShortcutKey(shortcut: Shortcut): string {
  const parts: string[] = [];

  if (shortcut.modCtrl) {
    parts.push(getModifierKey());
  }
  if (shortcut.modAlt) {
    parts.push(isMac() ? '⌥' : 'Alt');
  }
  if (shortcut.modShift) {
    parts.push(isMac() ? '⇧' : 'Shift');
  }

  parts.push(shortcut.key);

  // Use + separator for Windows, no separator for Mac symbols
  return isMac() ? parts.join('') : parts.join('+');
}

/**
 * Format a tooltip with shortcut hint
 * @param label The base label for the tooltip
 * @param shortcutId The shortcut ID to include as a hint
 * @returns Formatted tooltip string (e.g., "Desfazer (Ctrl+Z)")
 */
export function formatTooltipWithShortcut(label: string, shortcutId: string): string {
  const shortcut = SHORTCUTS.find(s => s.id === shortcutId);
  if (!shortcut) return label;

  const keyCombo = formatShortcutKey(shortcut);
  return `${label} (${keyCombo})`;
}

/**
 * Get a shortcut by its ID (from localStorage if customized, otherwise from defaults)
 */
export function getShortcutById(id: string): Shortcut | undefined {
  // First check localStorage for custom shortcuts
  const stored = localStorage.getItem('obsreview-shortcuts');
  if (stored) {
    try {
      const customShortcuts = JSON.parse(stored);
      for (const category of Object.values(customShortcuts)) {
        const found = (category as Shortcut[]).find((s: Shortcut) => s.id === id);
        if (found) return found;
      }
    } catch {
      // Fall through to defaults
    }
  }
  return SHORTCUTS.find(s => s.id === id);
}

/**
 * Check if a keyboard event matches a shortcut
 * @param event The keyboard event to check
 * @param shortcut The shortcut to match against
 * @returns true if the event matches the shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: Shortcut): boolean {
  const ctrlMatch = shortcut.modCtrl ? (event.ctrlKey || event.metaKey) : true;
  const shiftMatch = shortcut.modShift ? event.shiftKey : true;
  const altMatch = shortcut.modAlt ? event.altKey : true;

  // For the key match, handle special cases
  const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                   event.key === shortcut.key;

  return ctrlMatch && shiftMatch && altMatch && keyMatch;
}

/**
 * Check if the active element is an input that should prevent shortcut handling
 */
export function isInputFocused(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  const isInput = tagName === 'input' || tagName === 'textarea';
  const isEditable = activeElement.hasAttribute('contenteditable');

  return isInput || isEditable;
}

/**
 * Get all shortcuts from localStorage or return defaults
 */
export function getAllShortcuts(): Record<string, Shortcut[]> {
  const stored = localStorage.getItem('obsreview-shortcuts');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return getShortcutsByCategory();
    }
  }
  return getShortcutsByCategory();
}

/**
 * Reset shortcuts to default values
 */
export function resetShortcuts(): void {
  localStorage.removeItem('obsreview-shortcuts');
}

/**
 * Update a specific shortcut's key combination
 */
export function updateShortcut(
  category: string,
  shortcutId: string,
  updates: { key: string; modCtrl?: boolean; modShift?: boolean; modAlt?: boolean }
): void {
  const shortcuts = getAllShortcuts();
  const categoryShortcuts = shortcuts[category];
  const shortcut = categoryShortcuts?.find((s: Shortcut) => s.id === shortcutId);
  if (shortcut) {
    shortcut.key = updates.key;
    if (updates.modCtrl !== undefined) shortcut.modCtrl = updates.modCtrl;
    if (updates.modShift !== undefined) shortcut.modShift = updates.modShift;
    if (updates.modAlt !== undefined) shortcut.modAlt = updates.modAlt;
    localStorage.setItem('obsreview-shortcuts', JSON.stringify(shortcuts));
  }
}
