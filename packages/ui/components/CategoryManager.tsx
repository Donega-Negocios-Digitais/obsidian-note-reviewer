import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, FolderOpen, Tag, ArrowUp, ArrowDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ConfirmationDialog } from './ConfirmationDialog';
import { getCustomCategories, saveCustomCategories, type CustomCategory } from '../utils/storage';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChange?: () => void;
}

const ICON_OPTIONS = [
  'BookOpen', 'Atom', 'Map', 'PenTool', 'Briefcase', 'GraduationCap',
  'Heart', 'Star', 'Lightbulb', 'Code', 'Music', 'Camera',
  'Globe', 'Rocket', 'Target', 'Compass', 'Layers', 'Cpu',
];

function getLucideIcon(iconName: string): React.ComponentType<{ className?: string }> {
  const componentName = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const Icon = (LucideIcons as any)[componentName];
  return Icon || LucideIcons.Circle;
}

export const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
  onCategoriesChange,
}) => {
  const { t } = useTranslation();
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(getCustomCategories());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('Briefcase');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...customCategories];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setCustomCategories(updated);
    saveCustomCategories(updated);
    onCategoriesChange?.();
  };

  const handleMoveDown = (index: number) => {
    if (index === customCategories.length - 1) return;
    const updated = [...customCategories];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setCustomCategories(updated);
    saveCustomCategories(updated);
    onCategoriesChange?.();
  };

  const handleSave = () => {
    if (!formName.trim()) return;

    let updated: CustomCategory[];
    if (editingId) {
      updated = customCategories.map(c =>
        c.id === editingId ? { ...c, name: formName.trim(), icon: formIcon } : c
      );
    } else {
      const newCat: CustomCategory = {
        id: `custom_${Date.now()}`,
        name: formName.trim(),
        icon: formIcon,
        isBuiltIn: false,
      };
      updated = [...customCategories, newCat];
    }

    setCustomCategories(updated);
    saveCustomCategories(updated);
    onCategoriesChange?.();
    resetForm();
  };

  const handleEdit = (cat: CustomCategory) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormIcon(cat.icon);
    setShowForm(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    const updated = customCategories.filter(c => c.id !== deleteId);
    setCustomCategories(updated);
    saveCustomCategories(updated);
    onCategoriesChange?.();
    setDeleteId(null);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormName('');
    setFormIcon('Briefcase');
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('settings.categoryManager.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('settings.categoryManager.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Categories List */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Categorias ({customCategories.length})
            </h4>
            {customCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 text-center py-4">
                {t('settings.categoryManager.emptyCustom')}
              </p>
            ) : (
              <div className="space-y-2">
                {customCategories.map((cat, index) => {
                  const IconComp = getLucideIcon(cat.icon);
                  return (
                    <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50 hover:border-border/80 transition-colors">
                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Mover para cima"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === customCategories.length - 1}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Mover para baixo"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <IconComp className="w-4 h-4" />
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{cat.name}</p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteId(cat.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          title="Deletar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Add/Edit form */}
          {showForm ? (
            <div className="p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
              <h4 className="text-sm font-semibold text-foreground">
                {editingId ? t('settings.categoryManager.editCategory') : t('settings.categoryManager.addCategory')}
              </h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {t('settings.categoryManager.categoryName')}
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder={t('settings.categoryManager.categoryNamePlaceholder')}
                    className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1.5">
                    {t('settings.categoryManager.categoryIcon')}
                  </label>
                  <div className="grid grid-cols-9 gap-1">
                    {ICON_OPTIONS.map(iconName => {
                      const IconComp = getLucideIcon(iconName);
                      return (
                        <button
                          key={iconName}
                          onClick={() => setFormIcon(iconName)}
                          className={`p-2 rounded-lg transition-colors ${
                            formIcon === iconName
                              ? 'bg-primary/20 text-primary border border-primary/50'
                              : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent'
                          }`}
                        >
                          <IconComp className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={resetForm}
                  className="flex-1 px-3 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted text-sm transition-colors"
                >
                  {t('settings.actions.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!formName.trim()}
                  className="flex-1 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {t('settings.actions.save')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full p-3 rounded-xl border-2 border-dashed border-border/50 text-center hover:border-primary/50 hover:bg-primary/5 cursor-pointer group transition-all"
            >
              <Plus className="w-5 h-5 mx-auto text-muted-foreground/50 group-hover:text-primary transition-colors mb-1" />
              <p className="text-xs text-muted-foreground/60 group-hover:text-primary transition-colors font-medium">
                {t('settings.categoryManager.addCategory')}
              </p>
            </button>
          )}
        </div>
      </div>

      {/* Delete confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title={t('settings.categoryManager.deleteCategory')}
        message={t('settings.categoryManager.deleteConfirm')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('settings.actions.cancel')}
        destructive
      />
    </div>
  );
};
