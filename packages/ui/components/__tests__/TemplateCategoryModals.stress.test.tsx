import React from 'react';
import { afterEach, describe, expect, mock, test } from 'bun:test';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CategoryManager } from '../CategoryManager';
import { TemplateManagerModal, type BuiltInTemplateItem } from '../TemplateManagerModal';
import { saveCustomCategories, type CustomCategory, type CustomTemplate } from '../../utils/storage';

const baseBuiltInTemplate: BuiltInTemplateItem = {
  tipo: 'builtin_template',
  label: 'Template Padrão',
  icon: 'FileText',
  category: 'terceiros',
  categoryLabel: 'Terceiros',
  isConfigured: true,
  destinationPath: '/destino/padrao',
  templatePath: '/template/padrao',
};

function buildCustomTemplates(count: number): CustomTemplate[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `custom_${index + 1}`,
    category: 'custom_docs',
    label: `Template Custom ${index + 1}`,
    icon: 'FileText',
    destinationPath: `/destino/custom/${index + 1}`,
    templatePath: `/template/custom/${index + 1}`,
  }));
}

function buildCustomCategories(count: number): CustomCategory[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `categoria_${index + 1}`,
    name: `Categoria ${index + 1}`,
    icon: 'Briefcase',
    isBuiltIn: false,
  }));
}

afterEach(() => {
  cleanup();
  saveCustomCategories([]);
});

describe('TemplateManagerModal - status e layout', () => {
  test('novo perfil inicia sem templates pre-criados', () => {
    render(
      <TemplateManagerModal
        isOpen
        onClose={mock(() => {})}
        builtInTemplates={[]}
        customTemplates={[]}
        customCategories={[]}
        templateActiveStates={{}}
        onToggleTemplateActive={mock(() => {})}
        onOpenBuiltIn={mock(() => {})}
        onOpenCustom={mock(() => {})}
        onMoveBuiltIn={mock(() => {})}
        onMoveCustom={mock(() => {})}
        onDeleteBuiltIn={mock(() => {})}
        onDeleteCustom={mock(() => {})}
      />,
    );

    expect(screen.getByText('Nenhum template cadastrado ainda.')).toBeDefined();
    expect(screen.queryByText('Conteúdo de Terceiros')).toBeNull();
    expect(screen.queryByText('Notas Atômicas')).toBeNull();
    expect(screen.queryByText('Conteúdo Próprio')).toBeNull();
  });

  test('usa o mesmo estado de ativacao da tela principal', () => {
    const customTemplates = buildCustomTemplates(1);

    render(
      <TemplateManagerModal
        isOpen
        onClose={mock(() => {})}
        builtInTemplates={[baseBuiltInTemplate]}
        customTemplates={customTemplates}
        customCategories={[{ id: 'custom_docs', name: 'Documentos', icon: 'BookOpen' }]}
        templateActiveStates={{
          builtin_template: false,
          custom_1: true,
        }}
        onToggleTemplateActive={mock(() => {})}
        onOpenBuiltIn={mock(() => {})}
        onOpenCustom={mock(() => {})}
        onMoveBuiltIn={mock(() => {})}
        onMoveCustom={mock(() => {})}
        onDeleteBuiltIn={mock(() => {})}
        onDeleteCustom={mock(() => {})}
      />,
    );

    expect(screen.getAllByText('Inativado').length).toBe(1);
    expect(screen.getAllByText('Ativado').length).toBe(1);

    const inactiveBadge = screen.getByText('Inativado').closest('button');
    const activeBadge = screen.getByText('Ativado').closest('button');
    expect(inactiveBadge?.querySelector('svg')).toBeTruthy();
    expect(activeBadge?.querySelector('svg')).toBeTruthy();
  });

  test('mantem scroll interno e rodape visivel para listas grandes', () => {
    for (const count of [1, 5, 10, 20]) {
      const customTemplates = buildCustomTemplates(count);
      const templateActiveStates: Record<string, boolean> = { builtin_template: true };
      customTemplates.forEach((template, index) => {
        templateActiveStates[template.id] = index % 2 === 0;
      });

      const { unmount } = render(
        <TemplateManagerModal
          isOpen
          onClose={mock(() => {})}
          builtInTemplates={[baseBuiltInTemplate]}
          customTemplates={customTemplates}
          customCategories={[{ id: 'custom_docs', name: 'Documentos', icon: 'BookOpen' }]}
          templateActiveStates={templateActiveStates}
          onToggleTemplateActive={mock(() => {})}
          onOpenBuiltIn={mock(() => {})}
          onOpenCustom={mock(() => {})}
          onMoveBuiltIn={mock(() => {})}
          onMoveCustom={mock(() => {})}
          onDeleteBuiltIn={mock(() => {})}
          onDeleteCustom={mock(() => {})}
        />,
      );

      expect(screen.getByText('Gerenciar Templates')).toBeDefined();
      expect(screen.getByTestId('template-manager-scroll').className).toContain('overflow-y-auto');
      const footer = screen.getByTestId('template-manager-footer');
      expect(footer).toBeDefined();
      expect(footer.querySelector('button')).toBeTruthy();

      unmount();
    }
  });
});

describe('CategoryManager - stress de categorias', () => {
  test('permanece estavel com 1, 5, 10 e 20 categorias', () => {
    for (const count of [1, 5, 10, 20]) {
      saveCustomCategories(buildCustomCategories(count));

      const { unmount } = render(
        <CategoryManager
          isOpen
          onClose={mock(() => {})}
          onCategoriesChange={mock(() => {})}
        />,
      );

      expect(screen.getByText(`Categorias (${count})`)).toBeDefined();
      expect(screen.getByTestId('category-list-scroll').className).toContain('overflow-y-auto');
      expect(screen.getByTestId('category-manager-footer')).toBeDefined();

      fireEvent.click(screen.getByRole('button', { name: /Nova Categoria/i }));
      expect(screen.getByRole('button', { name: /Salvar|Save/i })).toBeDefined();
      expect(screen.getByTestId('category-manager-footer')).toBeDefined();
      expect(screen.getByTestId('category-list-scroll').className).toContain('overflow-y-auto');

      unmount();
      saveCustomCategories([]);
    }
  });
});
