/* eslint-disable security/detect-object-injection, @typescript-eslint/no-explicit-any */
import React, { useMemo, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import type { CustomTemplate } from '../utils/storage';
import { getBuiltInCategories } from '../utils/notePaths';

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
  onCreateNew: (categoryId?: string) => void;
  onOpenBuiltIn: (tipo: string, label: string, icon: string) => void;
  onOpenCustom: (template: CustomTemplate) => void;
  onMoveBuiltIn: (tipo: string, direction: 'up' | 'down') => void;
  onMoveCustom: (templateId: string, direction: 'up' | 'down') => void;
  onDeleteBuiltIn: (tipo: string, label: string) => void;
  onDeleteCustom: (templateId: string, label: string) => void;
  onManageCategories: () => void;
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
  onCreateNew,
  onOpenBuiltIn,
  onOpenCustom,
  onMoveBuiltIn,
  onMoveCustom,
  onDeleteBuiltIn,
  onDeleteCustom,
  onManageCategories,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | string>('all');

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
    const sections: CategoryItem[] = [];

    builtInOrder.forEach((id) => {
      const match = categoryLookup.get(id);
      if (match) sections.push(match);
    });

    customCategories.forEach((category) => {
      if (!builtInOrder.includes(category.id)) {
        sections.push(category);
      }
    });

    return sections;
  }, [categoryLookup, customCategories]);

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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-6xl max-h-[92vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Gerenciar Templates</h3>
            <p className="text-sm text-muted-foreground">
              {builtInTemplates.length} templates padrão e {customTemplates.length} customizados
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
            aria-label="Fechar gerenciador de templates"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          <div className="rounded-lg border border-border/50 bg-muted/20 p-3 space-y-3">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px_auto] gap-2">
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

              <button
                type="button"
                onClick={onManageCategories}
                className="h-9 px-3 text-xs font-medium rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors"
              >
                Gerenciar Categorias
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Dica: a ordenação por arrastar está disponível na tela principal de Templates.
            </p>
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
                  <button
                    type="button"
                    onClick={() => onCreateNew(category.id)}
                    className="px-2.5 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5"
                  >
                    <LucideIcons.Plus className="w-3.5 h-3.5" />
                    Novo
                  </button>
                </div>

                {builtInItems.length === 0 && customItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                    Nenhum template nesta categoria ainda. Clique em <strong>Novo</strong> para adicionar.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {builtInItems.map((item, index) => {
                      const IconComp = getLucideIcon(item.icon);
                      return (
                        <div
                          key={item.tipo}
                          className="w-full p-3 rounded-lg border border-border/60 hover:border-primary/40 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-3">
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
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Mover para cima"
                            >
                              <LucideIcons.ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveBuiltIn(item.tipo, 'down')}
                              disabled={index === builtInItems.length - 1}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Mover para baixo"
                            >
                              <LucideIcons.ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteBuiltIn(item.tipo, item.label)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                              title="Excluir"
                            >
                              <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span
                              className={`text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 ${
                                item.isConfigured
                                  ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                  : 'bg-muted/60 text-muted-foreground'
                              }`}
                            >
                              {item.isConfigured ? 'Configurado' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {customItems.map((template, index) => {
                      const IconComp = getLucideIcon(template.icon);
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
                              onClick={() => onMoveCustom(template.id, 'up')}
                              disabled={index === 0}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Mover para cima"
                            >
                              <LucideIcons.ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onMoveCustom(template.id, 'down')}
                              disabled={index === customItems.length - 1}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                              title="Mover para baixo"
                            >
                              <LucideIcons.ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteCustom(template.id, template.label)}
                              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                              title="Excluir"
                            >
                              <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[11px] px-2 py-0.5 rounded-full flex-shrink-0 bg-primary/10 text-primary">
                              Custom
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}

          {(selectedCategory === 'all' || selectedCategory === '__sem_categoria__') && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-2 border-b border-border/50 pb-2">
                <div className="flex items-center gap-2">
                  <LucideIcons.FolderX className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">Sem categoria</h4>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                    {filteredUnknownTemplates.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onCreateNew()}
                  className="px-2.5 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center gap-1.5"
                >
                  <LucideIcons.Plus className="w-3.5 h-3.5" />
                  Novo
                </button>
              </div>

              {filteredUnknownTemplates.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border/60 p-3 text-xs text-muted-foreground">
                  Nenhum template sem categoria no momento.
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUnknownTemplates.map((template) => {
                    const IconComp = getLucideIcon(template.icon);
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
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                            title="Excluir"
                          >
                            <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {!hasQueryResults && (
            <div className="rounded-lg border border-dashed border-border/60 p-4 text-sm text-muted-foreground text-center">
              Nenhum template encontrado para o filtro aplicado.
            </div>
          )}
        </div>

        <div className="p-5 border-t border-border flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
          >
            Fechar
          </button>
          <button
            onClick={() => onCreateNew()}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Novo Template
          </button>
        </div>
      </div>
    </div>
  );
};
