import { beforeEach, describe, expect, test } from 'bun:test';
import {
  cleanupSeedDemoContent,
  getCustomCategories,
  getCustomTemplates,
  saveCustomCategories,
  saveCustomTemplates,
  type CustomCategory,
  type CustomTemplate,
} from '../storage';

describe('seed/demo cleanup migration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('perfil novo inicia sem categorias/templates', () => {
    const result = cleanupSeedDemoContent();

    expect(result.categories).toEqual([]);
    expect(result.templates).toEqual([]);
    expect(result.removedCategoryIds).toEqual([]);
    expect(result.removedTemplateIds).toEqual([]);
    expect(getCustomCategories()).toEqual([]);
    expect(getCustomTemplates()).toEqual([]);
  });

  test('remove apenas itens marcados como seed/system e preserva dados do usuario', () => {
    const categories: CustomCategory[] = [
      {
        id: 'seed_category',
        name: 'Categoria Seed',
        icon: 'BookOpen',
        isBuiltIn: false,
        isSeed: true,
        createdBy: 'system',
      },
      {
        id: 'user_category',
        name: 'Categoria Usuario',
        icon: 'Briefcase',
        isBuiltIn: false,
        isSeed: false,
        createdBy: 'user',
      },
    ];

    const templates: CustomTemplate[] = [
      {
        id: 'seed_template',
        category: 'seed_category',
        label: 'Template Seed',
        icon: 'FileText',
        templatePath: '/seed/template.md',
        destinationPath: '/seed/destino',
        isSeed: true,
        createdBy: 'system',
      },
      {
        id: 'user_in_seed_category',
        category: 'seed_category',
        label: 'Template Usuario em Seed',
        icon: 'FileText',
        templatePath: '/user/template.md',
        destinationPath: '/user/destino',
        isSeed: false,
        createdBy: 'user',
      },
      {
        id: 'user_template',
        category: 'user_category',
        label: 'Template Usuario',
        icon: 'FileText',
        templatePath: '/user/template-2.md',
        destinationPath: '/user/destino-2',
        isSeed: false,
        createdBy: 'user',
      },
    ];

    saveCustomCategories(categories);
    saveCustomTemplates(templates);

    const result = cleanupSeedDemoContent();

    expect(result.removedCategoryIds).toEqual(['seed_category']);
    expect(result.removedTemplateIds).toEqual(['seed_template']);

    const remainingCategories = getCustomCategories();
    expect(remainingCategories).toHaveLength(1);
    expect(remainingCategories[0].id).toBe('user_category');

    const remainingTemplates = getCustomTemplates();
    expect(remainingTemplates.map((template) => template.id)).toEqual([
      'user_in_seed_category',
      'user_template',
    ]);

    const recategorized = remainingTemplates.find((template) => template.id === 'user_in_seed_category');
    expect(recategorized?.category).toBe('__sem_categoria__');
  });
});
