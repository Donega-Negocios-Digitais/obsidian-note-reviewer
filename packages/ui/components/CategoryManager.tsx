/* eslint-disable security/detect-object-injection, @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { ConfirmationDialog } from './ConfirmationDialog';
import { BaseModal } from './BaseModal';
import {
  getCustomCategories,
  saveCustomCategories,
  getCustomTemplates,
  saveCustomTemplates,
  type CustomCategory,
} from '../utils/storage';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoriesChange?: () => void;
  onDeleteCategory?: (categoryId: string) => void;
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
  onDeleteCategory,
}) => {
  const { t } = useTranslation();
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(getCustomCategories());
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('Briefcase');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Drag and drop states
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setCustomCategories(getCustomCategories());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDragStart = (index: number) => {
    setDraggingIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (index: number) => {
    if (draggingIndex === null || draggingIndex === index) return;

    const updated = [...customCategories];
    const [draggedItem] = updated.splice(draggingIndex, 1);
    updated.splice(index, 0, draggedItem);

    setCustomCategories(updated);
    saveCustomCategories(updated);
    onCategoriesChange?.();

    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingIndex(null);
    setDragOverIndex(null);
  };

  // Touch support for mobile devices
  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    const touch = e.touches[0];
    setTouchStartY(touch.clientY);
    setDraggingIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggingIndex !== null) {
      e.preventDefault(); // Prevent scroll during drag
    }
  };

  const handleTouchEnd = (e: React.TouchEvent, index: number) => {
    if (touchStartY === null || draggingIndex === null || draggingIndex === index) {
      setTouchStartY(null);
      setDraggingIndex(null);
      return;
    }

    const touch = e.changedTouches[0];
    const deltaY = Math.abs(touch.clientY - (touchStartY || 0));

    // Only reorder if vertical movement was minimal (tap/short drag)
    if (deltaY < 50) {
      const updated = [...customCategories];
      const [draggedItem] = updated.splice(draggingIndex, 1);
      updated.splice(index, 0, draggedItem);

      setCustomCategories(updated);
      saveCustomCategories(updated);
      onCategoriesChange?.();
    }

    setTouchStartY(null);
    setDraggingIndex(null);
  };

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
        isSeed: false,
        createdBy: 'user',
      };
      updated = [...customCategories, newCat];
    }

    setCustomCategories(updated);
    saveCustomCategories(updated);
    onCategoriesChange?.();
    resetForm();
  };

  const handleEdit = (cat: { id: string; name: string; icon: string }) => {
    setEditingId(cat.id);
    setFormName(cat.name);
    setFormIcon(cat.icon);
    setShowForm(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;

    if (onDeleteCategory) {
      onDeleteCategory(deleteId);
      setCustomCategories((prev) => prev.filter((category) => category.id !== deleteId));
      onCategoriesChange?.();
      setDeleteId(null);
      return;
    }

    const updated = customCategories.filter(c => c.id !== deleteId);
    setCustomCategories(updated);
    saveCustomCategories(updated);

    const templates = getCustomTemplates();
    let changed = false;
    const normalizedTemplates = templates.map((template) => {
      if (template.category === deleteId) {
        changed = true;
        return { ...template, category: '__sem_categoria__' };
      }
      return template;
    });

    if (changed) {
      saveCustomTemplates(normalizedTemplates);
    }

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
    <BaseModal
      isOpen={isOpen}
      onRequestClose={onClose}
      closeOnBackdropClick={false}
      overlayClassName="z-[70]"
      contentClassName="bg-card border border-border rounded-xl shadow-xl w-full max-w-3xl h-[80vh] max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('settings.categoryManager.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('settings.categoryManager.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-4">
          {/* Custom categories list */}
          <div>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Categorias ({customCategories.length})
            </h4>
            {customCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground/60 text-center py-4">
                {t('settings.categoryManager.emptyCustom')}
              </p>
            ) : (
              <div data-testid="category-list-scroll" className="h-[min(42vh,420px)] overflow-y-auto pr-1 grid grid-cols-1 md:grid-cols-2 gap-2">
                {customCategories.map((cat, index) => {
                  const IconComp = getLucideIcon(cat.icon);
                  const isDragging = draggingIndex === index;
                  const isDragOver = dragOverIndex === index;

                  return (
                    <div
                      key={cat.id}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={() => handleDrop(index)}
                      onDragEnd={handleDragEnd}
                      onTouchStart={(e) => handleTouchStart(e, index)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={(e) => handleTouchEnd(e, index)}
                      className={`min-h-[96px] flex items-start gap-3 p-3 rounded-lg bg-card/50 border transition-all duration-200 cursor-grab select-none ${
                        isDragging
                          ? 'opacity-50 scale-95 ring-2 ring-primary/40 cursor-grabbing shadow-lg'
                          : 'border-border/50 hover:border-border/80 hover:shadow-sm'
                      } ${isDragOver && !isDragging ? 'ring-2 ring-primary/30 bg-primary/5' : ''}`}
                    >
                      {/* Drag handle */}
                      <div className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground">
                        <GripVertical className="w-4 h-4" />
                      </div>

                      {/* Reorder buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Mover para cima"
                        >
                          <LucideIcons.ChevronUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(index)}
                          disabled={index === customCategories.length - 1}
                          className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Mover para baixo"
                        >
                          <LucideIcons.ChevronDown className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Icon */}
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <IconComp className="w-4 h-4" />
                      </div>

                      {/* Name */}
                      <div className="flex-1 min-w-0 self-center">
                        <p
                          className="text-sm font-medium text-foreground leading-snug break-words"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '2.5rem',
                          }}
                        >
                          {cat.name}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {/* Edit button */}
                        <button
                          onClick={() => handleEdit(cat)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => setDeleteId(cat.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
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
                {editingId
                  ? t('settings.categoryManager.editCategory')
                  : t('settings.categoryManager.addCategory')}
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
          ) : null}
        </div>

        {/* Footer */}
        <div data-testid="category-manager-footer" className="flex gap-3 p-5 border-t border-border shrink-0">
          <button
            onClick={() => setShowForm(true)}
            className="flex-1 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Categoria
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
          >
            {t('settings.actions.close')}
          </button>
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
    </BaseModal>
  );
};
