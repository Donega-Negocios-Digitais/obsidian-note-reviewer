/**
 * Keyboard Shortcuts Modal
 *
 * Modal that displays all available keyboard shortcuts organized by category.
 * Triggered by pressing '?' key or via the help button.
 * Now supports editing shortcuts by clicking on them.
 */

import React, { useEffect, useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  getShortcutsByCategory,
  formatShortcutKey,
  updateShortcut,
  resetShortcuts,
  type Shortcut,
  type ShortcutCategory,
} from '../utils/shortcuts';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface EditingState {
  shortcut: Shortcut;
  category: ShortcutCategory;
  newKey: string;
  newModCtrl: boolean;
  newModShift: boolean;
  newModAlt: boolean;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [shortcutsVersion, setShortcutsVersion] = useState(0);

  // Handle Escape key to close
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (editing) {
          setEditing(null);
        } else {
          onClose();
        }
      }
    },
    [onClose, editing]
  );

  // Handle key capture when editing
  useEffect(() => {
    if (!editing) return;

    const handleKeyCapture = (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Ignore modifier-only keys
      if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;

      setEditing((prev) =>
        prev
          ? {
              ...prev,
              newKey: e.key.toUpperCase(),
              newModCtrl: e.ctrlKey || e.metaKey,
              newModShift: e.shiftKey,
              newModAlt: e.altKey,
            }
          : null
      );
    };

    window.addEventListener('keydown', handleKeyCapture, true);
    return () => window.removeEventListener('keydown', handleKeyCapture, true);
  }, [editing]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  const handleStartEditing = (shortcut: Shortcut, category: ShortcutCategory) => {
    setEditing({
      shortcut,
      category,
      newKey: shortcut.key,
      newModCtrl: shortcut.modCtrl || false,
      newModShift: shortcut.modShift || false,
      newModAlt: shortcut.modAlt || false,
    });
  };

  const handleSave = () => {
    if (!editing) return;

    updateShortcut(editing.category, editing.shortcut.id, {
      key: editing.newKey,
      modCtrl: editing.newModCtrl,
      modShift: editing.newModShift,
      modAlt: editing.newModAlt,
    });

    setEditing(null);
    setShortcutsVersion((v) => v + 1);
  };

  const handleResetAll = () => {
    if (confirm(t('keyboardShortcutsModal.resetConfirm') || 'Restaurar todos os atalhos padrão?')) {
      resetShortcuts();
      setShortcutsVersion((v) => v + 1);
    }
  };

  const handleClearKey = () => {
    if (!editing) return;
    setEditing({ ...editing, newKey: '', newModCtrl: false, newModShift: false, newModAlt: false });
  };

  if (!isOpen) return null;

  const shortcutsByCategory = getShortcutsByCategory();

  // Filter out empty categories
  const activeCategories = CATEGORY_ORDER.filter(
    (category) => shortcutsByCategory[category].length > 0
  );

  // Format the current editing shortcut
  const formatEditingShortcut = () => {
    if (!editing) return '';
    const parts: string[] = [];
    if (editing.newModCtrl) parts.push('Ctrl');
    if (editing.newModAlt) parts.push('Alt');
    if (editing.newModShift) parts.push('Shift');
    if (editing.newKey) parts.push(editing.newKey);
    return parts.join('+') || t('keyboardShortcutsModal.pressKey') || 'Pressione uma tecla...';
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-accent"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-sm">{t('keyboardShortcutsModal.title')}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetAll}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted"
                title={t('keyboardShortcutsModal.resetAll') || 'Restaurar padrão'}
              >
                {t('keyboardShortcutsModal.resetAll') || 'Restaurar'}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                title={t('keyboardShortcutsModal.close')}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 max-h-[60vh] overflow-auto">
          {activeCategories.map((category) => (
            <div key={category}>
              {/* Category header */}
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                {CATEGORY_LABELS[category]}
              </h4>

              {/* Shortcuts list */}
              <div className="space-y-1">
                {shortcutsByCategory[category].map((shortcut) => (
                  <button
                    key={shortcut.id}
                    onClick={() => handleStartEditing(shortcut, category)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                    title={t('keyboardShortcutsModal.clickToEdit') || 'Clique para editar'}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground">
                        {shortcut.label}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {shortcut.description}
                      </div>
                    </div>
                    <kbd className="ml-3 px-2 py-1 text-xs font-mono bg-muted border border-border rounded-md text-muted-foreground shrink-0 group-hover:border-accent/50 group-hover:text-accent transition-colors">
                      {formatShortcutKey(shortcut)}
                    </kbd>
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Empty state */}
          {activeCategories.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {t('keyboardShortcutsModal.noShortcuts')}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            💡 {t('keyboardShortcutsModal.clickToEdit') || 'Clique em qualquer atalho para redefinir a tecla'}
          </p>
        </div>
      </div>

      {/* Edit Shortcut Modal */}
      {editing && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-background/60 backdrop-blur-sm p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-sm">
                {t('keyboardShortcutsModal.editTitle') || 'Editar Atalho'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                {editing.shortcut.label}
              </p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Key display */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-3">
                  {t('keyboardShortcutsModal.pressNewKey') || 'Pressione a nova combinação de teclas'}
                </p>
                <div
                  className="inline-flex items-center gap-2 px-6 py-3 bg-muted border-2 border-accent/30 rounded-lg min-h-[3rem] justify-center"
                >
                  {formatEditingShortcut() ? (
                    <kbd className="text-lg font-mono font-bold text-accent">
                      {formatEditingShortcut()}
                    </kbd>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {t('keyboardShortcutsModal.waitingForKey') || 'Aguardando...'}
                    </span>
                  )}
                </div>
              </div>

              {/* Modifier toggles */}
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setEditing({ ...editing, newModCtrl: !editing.newModCtrl })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    editing.newModCtrl
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Ctrl
                </button>
                <button
                  onClick={() => setEditing({ ...editing, newModAlt: !editing.newModAlt })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    editing.newModAlt
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Alt
                </button>
                <button
                  onClick={() => setEditing({ ...editing, newModShift: !editing.newModShift })}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    editing.newModShift
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  Shift
                </button>
              </div>

              {/* Clear button */}
              <button
                onClick={handleClearKey}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
              >
                {t('keyboardShortcutsModal.clearKey') || 'Limpar tecla'}
              </button>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border flex justify-end gap-2">
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-lg transition-colors"
              >
                {t('common.cancel') || 'Cancelar'}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-opacity"
              >
                {t('common.save') || 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
