/**
 * Edit Shortcut Modal
 *
 * Reusable modal for editing keyboard shortcuts.
 * Used by both KeyboardShortcutsModal and SettingsPanel.
 */

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { type Shortcut, type ShortcutCategory } from '../utils/shortcuts';
import { BaseModal } from './BaseModal';

export interface EditingState {
  shortcut: Shortcut;
  category: ShortcutCategory;
  newKey: string;
  newModCtrl: boolean;
  newModShift: boolean;
  newModAlt: boolean;
}

interface EditShortcutModalProps {
  editing: EditingState | null;
  setEditing: React.Dispatch<React.SetStateAction<EditingState | null>>;
  onSave: () => void;
}

export const EditShortcutModal: React.FC<EditShortcutModalProps> = ({
  editing,
  setEditing,
  onSave,
}) => {
  const { t } = useTranslation();

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
  }, [editing, setEditing]);

  const handleSave = onSave;

  const handleClearKey = () => {
    if (!editing) return;
    setEditing({ ...editing, newKey: '', newModCtrl: false, newModShift: false, newModAlt: false });
  };

  if (!editing) return null;

  // Format the current editing shortcut
  const formatEditingShortcut = () => {
    const parts: string[] = [];
    if (editing.newModCtrl) parts.push('Ctrl');
    if (editing.newModAlt) parts.push('Alt');
    if (editing.newModShift) parts.push('Shift');
    if (editing.newKey) parts.push(editing.newKey);
    return parts.join('+') || t('keyboardShortcutsModal.pressKey') || 'Pressione uma tecla...';
  };

  return (
    <BaseModal
      isOpen={!!editing}
      onRequestClose={() => setEditing(null)}
      closeOnBackdropClick={true}
      overlayClassName="z-[110] bg-background/60"
      contentClassName="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl"
    >
      <div>
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
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 rounded-lg transition-opacity"
          >
            Salvar
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
