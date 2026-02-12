/* eslint-disable security/detect-object-injection, @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as LucideIcons from 'lucide-react';
import type { CustomTemplate } from '../utils/storage';
import { getBuiltInCategories } from '../utils/notePaths';
import { BaseModal } from './BaseModal';

export interface BuiltInTemplateItem {
  tipo: string;
  label: string;
  icon: string;
  category: string;
  categoryLabel: string;
  isConfigured: boolean;
  destinationPath?: string;
  templatePath?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  icon: string;
}

interface TemplateManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  builtInTemplates: BuiltInTemplateItem[];
  customTemplates: CustomTemplate[];
  customCategories: CategoryItem[];
  templateActiveStates: Record<string, boolean>;
  onToggleTemplateActive: (templateId: string) => void;
  onOpenBuiltIn: (tipo: string, label: string, icon: string) => void;
  onOpenCustom: (template: CustomTemplate) => void;
  onMoveBuiltIn: (tipo: string, direction: 'up' | 'down') => void;
  onMoveCustom: (templateId: string, direction: 'up' | 'down') => void;
  onDeleteBuiltIn: (tipo: string, label: string) => void;
  onDeleteCustom: (templateId: string, label: string) => void;
}

function getLucideIcon(iconName: string): React.ComponentType<{ className?: string }> {
  const componentName = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const Icon = (LucideIcons as any)[componentName];
  return Icon || LucideIcons.Circle;
}

function matchesQuery(query: string, ...values: Array<string | undefined>): boolean {
  if (!query) return true;
  return values.some((value) => (value || '').toLowerCase().includes(query));
}

export const TemplateManagerModal: React.FC<TemplateManagerModalProps> = ({
  isOpen,
  onClose,
  builtInTemplates,
  customTemplates,
  customCategories,
  templateActiveStates,
  onToggleTemplateActive,
  onOpenBuiltIn,
  onOpenCustom,
  onMoveBuiltIn,
  onMoveCustom,
  onDeleteBuiltIn,
  onDeleteCustom,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');

  // Drag and drop states
  const [draggingItem, setDraggingItem] = useState<{ kind: 'builtIn' | 'custom'; id: string; category: string; index: number } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const categoryLookup = useMemo(() => {
    const map = new Map<string, CategoryItem>();
    getBuiltInCategories().forEach((category) => {
      map.set(category.id, { id: category.id, name: category.name, icon: category.icon });
    });
    customCategories.forEach((category) => {
      map.set(category.id, category);
    });
    return map;
  }, [customCategories]);

  const sortedCategories = useMemo(() => {
    const builtInOrder = ['terceiros', 'atomica', 'organizacional', 'alex'];
    const usedCategoryIds = new Set<string>();
    builtInTemplates.forEach((item) => {
      usedCategoryIds.add(item.category);
    });
    customTemplates.forEach((template) => {
      const category = template.category || '__sem_categoria__';
      if (category !== '__sem_categoria__') {
        usedCategoryIds.add(category);
      }
    });

    const sections: CategoryItem[] = [];

    builtInOrder.forEach((id) => {
      if (!usedCategoryIds.has(id)) return;
      const match = categoryLookup.get(id);
      if (match) sections.push(match);
    });

    customCategories.forEach((category) => {
      if (!builtInOrder.includes(category.id) && usedCategoryIds.has(category.id)) {
        sections.push(category);
      }
    });

    return sections;
  }, [builtInTemplates, customTemplates, categoryLookup, customCategories]);

  const builtInByCategory = useMemo(() => {
    const map = new Map<string, BuiltInTemplateItem[]>();
    builtInTemplates.forEach((item) => {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    });
    return map;
  }, [builtInTemplates]);

  const customByCategory = useMemo(() => {
    const map = new Map<string, CustomTemplate[]>();
    customTemplates.forEach((template) => {
      const category = template.category || '__sem_categoria__';
      const list = map.get(category) || [];
      list.push(template);
      map.set(category, list);
    });
    return map;
  }, [customTemplates]);

  const unknownCategoryTemplates = useMemo(
    () =>
      customTemplates.filter((template) => {
        const category = template.category || '__sem_categoria__';
        if (category === '__sem_categoria__') return true;
        return !categoryLookup.has(category);
      }),
    [customTemplates, categoryLookup],
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredSections = useMemo(() => {
    return sortedCategories
      .filter((category) => selectedCategory === 'all' || selectedCategory === category.id)
      .map((category) => {
        const builtInItems = (builtInByCategory.get(category.id) || []).filter((item) =>
          matchesQuery(normalizedQuery, item.label, item.destinationPath, item.templatePath, category.name),
        );
        const customItems = (customByCategory.get(category.id) || []).filter((template) =>
          matchesQuery(normalizedQuery, template.label, template.destinationPath, template.templatePath, category.name),
        );
        return { category, builtInItems, customItems };
      });
  }, [sortedCategories, selectedCategory, builtInByCategory, customByCategory, normalizedQuery]);

  const filteredUnknownTemplates = useMemo(() => {
    if (selectedCategory !== 'all' && selectedCategory !== '__sem_categoria__') {
      return [];
    }
    return unknownCategoryTemplates.filter((template) =>
      matchesQuery(normalizedQuery, template.label, template.destinationPath, template.templatePath, 'Sem categoria'),
    );
  }, [unknownCategoryTemplates, selectedCategory, normalizedQuery]);

  const hasQueryResults = useMemo(() => {
    if (!normalizedQuery) return true;
    return (
      filteredSections.some((section) => section.builtInItems.length > 0 || section.customItems.length > 0) ||
      filteredUnknownTemplates.length > 0
    );
  }, [normalizedQuery, filteredSections, filteredUnknownTemplates]);

  const hasVisibleTemplates = useMemo(
    () =>
      filteredSections.some((section) => section.builtInItems.length > 0 || section.customItems.length > 0) ||
      filteredUnknownTemplates.length > 0,
    [filteredSections, filteredUnknownTemplates],
  );

  // Drag handlers
  const handleDragStart = (kind: 'builtIn' | 'custom', id: string, category: string, index: number) => () => {
    setDraggingItem({ kind, id, category, index });
  };

  const handleDragOver = (kind: 'builtIn' | 'custom', category: string, index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggingItem) return;
    if (draggingItem.kind !== kind) return;
    if (draggingItem.category !== category) return;
    setDragOverIndex(index);
  };

  const handleDrop = (kind: 'builtIn' | 'custom', id: string, category: string, targetIndex: number) => () => {
    if (!draggingItem) return;
    if (draggingItem.kind !== kind) return;
    if (draggingItem.category !== category) return;
    if (draggingItem.index === targetIndex) return;

    const sourceIndex = draggingItem.index;
    const direction = targetIndex > sourceIndex ? 'down' : 'up';

    // Call the appropriate move callback for each step
    const steps = Math.abs(targetIndex - sourceIndex);
    for (let i = 0; i < steps; i++) {
      if (kind === 'builtIn') {
        onMoveBuiltIn(draggingItem.id, direction);
      } else {
        onMoveCustom(draggingItem.id, direction);
      }
    }

    setDraggingItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggingItem(null);
    setDragOverIndex(null);
  };

  if (!isOpen) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onRequestClose={onClose}
      closeOnBackdropClick={false}
      overlayClassName="z-[70]"
      contentClassName="bg-card border border-border rounded-xl shadow-xl w-full max-w-6xl h-[80vh] max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Gerenciar Templates</h3>
            <p className="text-sm text-muted-foreground">
              {builtInTemplates.length} templates padrão e {customTemplates.length} customizados
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
            aria-label="Fechar gerenciador de templates"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div data-testid="template-manager-scroll" className="min-h-0 flex-1 overflow-y-auto p-5 space-y-6">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-2">
              <div className="relative">
                <LucideIcons.Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Filtrar por nome, caminho ou categoria"
                  className="w-full h-9 rounded-md border border-border bg-background px-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded"
                    aria-label="Limpar busca"
                  >
                    <LucideIcons.X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="h-9 rounded-md border border-border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="all">Todas as categorias</option>
                {sortedCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                <option value="__sem_categoria__">Sem categoria</option>
              </select>

            </div>
          </div>

          {filteredSections.map(({ category, builtInItems, customItems }) => {
            const CategoryIcon = getLucideIcon(category.icon);

            return (
              <section key={category.id} className="space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <CategoryIcon className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">{category.name}</h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                    {builtInItems.length + customItems.length}
                  </span>
                </div>
                </div>

                {builtInItems.length === 0 && customItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                    Nenhum template nesta categoria ainda.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {builtInItems.map((item, index) => {
                      const IconComp = getLucideIcon(item.icon);
                      const isDragging = draggingItem?.kind === 'builtIn' && draggingItem.id === item.tipo;
                      const isDragOver = dragOverIndex === index;
                      const isActive = templateActiveStates[item.tipo] ?? true;

                      return (
                        <div
                          key={item.tipo}
                          draggable
                          onDragStart={handleDragStart('builtIn', item.tipo, category.id, index)}
                          onDragOver={handleDragOver('builtIn', category.id, index)}
                          onDrop={handleDrop('builtIn', item.tipo, category.id, index)}
                          onDragEnd={handleDragEnd}
                          className={`w-full p-3 rounded-lg border transition-all cursor-grab ${
                            isDragging
                              ? 'opacity-50 ring-2 ring-primary/40 cursor-grabbing shadow-lg border-primary/40'
                              : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                          } ${isDragOver && !isDragging ? 'ring-2 ring-primary/30 bg-primary/5' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Drag handle */}
                            <div className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground flex-shrink-0">
                              <LucideIcons.GripVertical className="w-4 h-4" />
                            </div>

                            <button
                              type="button"
                              onClick={() => onOpenBuiltIn(item.tipo, item.label, item.icon)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{item.label}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {item.destinationPath || 'Destino não configurado'}
                                </p>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveBuiltIn(item.tipo, 'up')}
                              disabled={index === 0}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Mover para cima"
                            >
                              <LucideIcons.ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveBuiltIn(item.tipo, 'down')}
                              disabled={index === builtInItems.length - 1}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Mover para baixo"
                            >
                              <LucideIcons.ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteBuiltIn(item.tipo, item.label)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Excluir"
                            >
                              <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onToggleTemplateActive(item.tipo);
                              }}
                              className={`text-[11px] px-2 py-1 rounded-full flex-shrink-0 inline-flex items-center gap-1.5 font-medium ${
                                isActive
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}
                              title={isActive ? 'Inativar template' : 'Ativar template'}
                            >
                              <LucideIcons.Power className="w-3 h-3" />
                              {isActive ? 'Ativado' : 'Inativado'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {customItems.map((template, index) => {
                      const IconComp = getLucideIcon(template.icon);
                      const isDragging = draggingItem?.kind === 'custom' && draggingItem.id === template.id;
                      const isDragOver = dragOverIndex === index;
                      const isActive = templateActiveStates[template.id] ?? true;

                      return (
                        <div
                          key={template.id}
                          draggable
                          onDragStart={handleDragStart('custom', template.id, category.id, index)}
                          onDragOver={handleDragOver('custom', category.id, index)}
                          onDrop={handleDrop('custom', template.id, category.id, index)}
                          onDragEnd={handleDragEnd}
                          className={`w-full p-3 rounded-lg border transition-all cursor-grab ${
                            isDragging
                              ? 'opacity-50 ring-2 ring-primary/40 cursor-grabbing shadow-lg border-primary/40'
                              : 'border-border/60 hover:border-primary/40 hover:bg-muted/30'
                          } ${isDragOver && !isDragging ? 'ring-2 ring-primary/30 bg-primary/5' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Drag handle */}
                            <div className="cursor-grab text-muted-foreground/50 hover:text-muted-foreground flex-shrink-0">
                              <LucideIcons.GripVertical className="w-4 h-4" />
                            </div>

                            <button
                              type="button"
                              onClick={() => onOpenCustom(template)}
                              className="flex items-center gap-3 flex-1 min-w-0 text-left"
                            >
                              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{template.label}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {template.destinationPath || 'Destino não configurado'}
                                </p>
                              </div>
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveCustom(template.id, 'up')}
                              disabled={index === 0}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Mover para cima"
                            >
                              <LucideIcons.ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveCustom(template.id, 'down')}
                              disabled={index === customItems.length - 1}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Mover para baixo"
                            >
                              <LucideIcons.ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteCustom(template.id, template.label)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                              title="Excluir"
                            >
                              <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                onToggleTemplateActive(template.id);
                              }}
                              className={`text-[11px] px-2 py-1 rounded-full flex-shrink-0 inline-flex items-center gap-1.5 font-medium ${
                                isActive
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                  : 'bg-red-500/10 text-red-600 dark:text-red-400'
                              }`}
                              title={isActive ? 'Inativar template' : 'Ativar template'}
                            >
                              <LucideIcons.Power className="w-3 h-3" />
                              {isActive ? 'Ativado' : 'Inativado'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}

          {(selectedCategory === 'all' || selectedCategory === '__sem_categoria__') &&
            (filteredUnknownTemplates.length > 0 || selectedCategory === '__sem_categoria__') && (
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <LucideIcons.FolderX className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Sem categoria</h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                    {filteredUnknownTemplates.length}
                  </span>
                </div>
              </div>

              {filteredUnknownTemplates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                  Nenhum template sem categoria no momento.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUnknownTemplates.map((template) => {
                    const IconComp = getLucideIcon(template.icon);
                    const isActive = templateActiveStates[template.id] ?? true;
                    return (
                      <div
                        key={template.id}
                        className="w-full p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => onOpenCustom(template)}
                            className="flex items-center gap-3 flex-1 min-w-0 text-left"
                          >
                            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                              <IconComp className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{template.label}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {template.destinationPath || 'Destino não configurado'}
                              </p>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteCustom(template.id, template.label)}
                            className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title="Excluir"
                          >
                            <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onToggleTemplateActive(template.id);
                            }}
                            className={`text-[11px] px-2 py-1 rounded-full flex-shrink-0 inline-flex items-center gap-1.5 font-medium ${
                              isActive
                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                : 'bg-red-500/10 text-red-600 dark:text-red-400'
                            }`}
                            title={isActive ? 'Inativar template' : 'Ativar template'}
                          >
                            <LucideIcons.Power className="w-3 h-3" />
                            {isActive ? 'Ativado' : 'Inativado'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {!normalizedQuery && !hasVisibleTemplates && (
            <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground text-center">
              Nenhum template cadastrado ainda.
            </div>
          )}

          {!hasQueryResults && (
            <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground text-center">
              Nenhum template encontrado para o filtro aplicado.
            </div>
          )}
        </div>

        {/* Footer */}
        <div data-testid="template-manager-footer" className="flex gap-3 p-5 border-t border-border shrink-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
          >
            {t('settings.actions.close')}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};
