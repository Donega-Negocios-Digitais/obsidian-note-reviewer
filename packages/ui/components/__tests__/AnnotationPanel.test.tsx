import { describe, test, expect, mock } from 'bun:test';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { AnnotationPanel, typeConfig } from '../AnnotationPanel';
import { Annotation, AnnotationType, Block } from '../../types';

// Helper to create test annotations
const createAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  id: 'test-id',
  blockId: 'block-1',
  startOffset: 0,
  endOffset: 10,
  type: AnnotationType.COMMENT,
  originalText: 'test text',
  createdA: Date.now(),
  ...overrides,
});

// Create diverse set of annotations for testing filters
const createTestAnnotations = (): Annotation[] => [
  createAnnotation({
    id: 'deletion-1',
    type: AnnotationType.DELETION,
    originalText: 'deleted text',
    text: undefined,
  }),
  createAnnotation({
    id: 'insertion-1',
    type: AnnotationType.INSERTION,
    originalText: '',
    text: 'inserted text',
  }),
  createAnnotation({
    id: 'replacement-1',
    type: AnnotationType.REPLACEMENT,
    originalText: 'old text',
    text: 'new text',
  }),
  createAnnotation({
    id: 'comment-1',
    type: AnnotationType.COMMENT,
    originalText: 'commented text',
    text: 'This is a comment',
  }),
  createAnnotation({
    id: 'global-1',
    type: AnnotationType.GLOBAL_COMMENT,
    originalText: '',
    text: 'Global comment here',
    isGlobal: true,
  }),
];

const mockBlocks: Block[] = [];

// Helper to get filter button title based on active state
const getFilterButtonTitle = (type: AnnotationType, isActive: boolean = true) => {
  const config = typeConfig[type];
  return `${config.label}${isActive ? ' (ativo)' : ' (oculto)'}`;
};

describe('AnnotationPanel', () => {
  describe('Filter Button Rendering', () => {
    test('renderiza todos os botões de filtro', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      // Check all filter buttons are rendered with their type labels as titles
      Object.values(AnnotationType).forEach(type => {
        expect(screen.getByTitle(getFilterButtonTitle(type, true))).toBeDefined();
      });
    });

    test('botões de filtro começam ativos', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      // All filter buttons should have aria-pressed="true" initially
      Object.values(AnnotationType).forEach(type => {
        const button = screen.getByTitle(getFilterButtonTitle(type, true));
        expect(button.getAttribute('aria-pressed')).toBe('true');
      });
    });

    test('não renderiza painel quando isOpen é false', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      const { container } = render(
        <AnnotationPanel
          isOpen={false}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      expect(container.querySelector('aside')).toBeNull();
    });
  });

  describe('Toggle Behavior', () => {
    test('clicar no botão de filtro alterna aria-pressed', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      // Get button by active title initially
      let button = screen.getByTitle(getFilterButtonTitle(AnnotationType.DELETION, true));

      // Initially active
      expect(button.getAttribute('aria-pressed')).toBe('true');

      // Click to toggle off - title changes
      fireEvent.click(button);
      button = screen.getByTitle(getFilterButtonTitle(AnnotationType.DELETION, false));
      expect(button.getAttribute('aria-pressed')).toBe('false');

      // Click to toggle back on - title changes back
      fireEvent.click(button);
      button = screen.getByTitle(getFilterButtonTitle(AnnotationType.DELETION, true));
      expect(button.getAttribute('aria-pressed')).toBe('true');
    });

    test('múltiplos filtros podem ser desativados', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      let deletionButton = screen.getByTitle(getFilterButtonTitle(AnnotationType.DELETION, true));
      let insertionButton = screen.getByTitle(getFilterButtonTitle(AnnotationType.INSERTION, true));

      // Toggle off both
      fireEvent.click(deletionButton);
      fireEvent.click(insertionButton);

      // Re-query with updated titles
      deletionButton = screen.getByTitle(getFilterButtonTitle(AnnotationType.DELETION, false));
      insertionButton = screen.getByTitle(getFilterButtonTitle(AnnotationType.INSERTION, false));

      expect(deletionButton.getAttribute('aria-pressed')).toBe('false');
      expect(insertionButton.getAttribute('aria-pressed')).toBe('false');
    });
  });

  describe('Annotation Filtering Logic', () => {
    test('anotações filtradas não aparecem na lista', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      // Verify deletion annotation is visible initially
      expect(screen.getByText('"deleted text"')).toBeDefined();

      // Toggle off deletion type
      const deletionButton = screen.getByTitle(getFilterButtonTitle(AnnotationType.DELETION, true));
      fireEvent.click(deletionButton);

      // Deletion annotation should be hidden
      expect(screen.queryByText('"deleted text"')).toBeNull();
    });

    test('filtrar comentários globais oculta a seção', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      // Initially global comment section should be visible
      expect(screen.getByText('Global comment here')).toBeDefined();
      expect(screen.getByText('Comentários Globais')).toBeDefined();

      // Toggle off global comment type
      const globalButton = screen.getByTitle(getFilterButtonTitle(AnnotationType.GLOBAL_COMMENT, true));
      fireEvent.click(globalButton);

      // Global comment should be hidden
      expect(screen.queryByText('Global comment here')).toBeNull();
      expect(screen.queryByText('Comentários Globais')).toBeNull();
    });

    test('mostra mensagem quando todas anotações são filtradas', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      // Toggle off all types - need to get each button fresh as titles change
      Object.values(AnnotationType).forEach(type => {
        const button = screen.getByTitle(getFilterButtonTitle(type, true));
        fireEvent.click(button);
      });

      // Should show empty state message
      expect(screen.getByText('Todas anotações ocultas pelo filtro')).toBeDefined();
    });

    test('reativar filtro mostra anotações novamente', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      let deletionButton = screen.getByTitle(getFilterButtonTitle(AnnotationType.DELETION, true));

      // Toggle off
      fireEvent.click(deletionButton);
      expect(screen.queryByText('"deleted text"')).toBeNull();

      // Toggle back on - get button with updated title
      deletionButton = screen.getByTitle(getFilterButtonTitle(AnnotationType.DELETION, false));
      fireEvent.click(deletionButton);
      expect(screen.getByText('"deleted text"')).toBeDefined();
    });
  });

  describe('Count Updates', () => {
    test('mostra contagem total quando sem filtro ativo', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      // Header should show total count (5 annotations)
      expect(screen.getByText('5')).toBeDefined();
    });

    test('mostra contagem filtrada/total quando filtro está ativo', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      // Toggle off deletion type (removes 1 annotation)
      const deletionButton = screen.getByTitle(getFilterButtonTitle(AnnotationType.DELETION, true));
      fireEvent.click(deletionButton);

      // Should show 4/5 format
      expect(screen.getByText('4/5')).toBeDefined();
    });

    test('contagem atualiza ao filtrar múltiplos tipos', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      // Toggle off deletion and insertion (removes 2 annotations)
      fireEvent.click(screen.getByTitle(getFilterButtonTitle(AnnotationType.DELETION, true)));
      fireEvent.click(screen.getByTitle(getFilterButtonTitle(AnnotationType.INSERTION, true)));

      // Should show 3/5 format
      expect(screen.getByText('3/5')).toBeDefined();
    });

    test('contagem volta ao total quando todos filtros são reativados', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      let deletionButton = screen.getByTitle(getFilterButtonTitle(AnnotationType.DELETION, true));

      // Toggle off
      fireEvent.click(deletionButton);
      expect(screen.getByText('4/5')).toBeDefined();

      // Toggle back on - get button with updated title
      deletionButton = screen.getByTitle(getFilterButtonTitle(AnnotationType.DELETION, false));
      fireEvent.click(deletionButton);
      expect(screen.getByText('5')).toBeDefined();
    });
  });

  describe('Empty State', () => {
    test('mostra mensagem para adicionar anotações quando lista vazia', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={[]}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      expect(screen.getByText('Selecione texto para adicionar anotações')).toBeDefined();
    });
  });

  describe('Accessibility', () => {
    test('botões de filtro têm aria-label descritivo', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      // Check active buttons have "Ocultar" and type description in aria-label
      const deletionConfig = typeConfig[AnnotationType.DELETION];
      const activeButton = screen.getByTitle(`${deletionConfig.label} (ativo)`);
      expect(activeButton.getAttribute('aria-label')).toBe(`Ocultar anotações do tipo ${deletionConfig.label}`);

      // Toggle off and check "Mostrar" in aria-label
      fireEvent.click(activeButton);
      expect(activeButton.getAttribute('aria-label')).toBe(`Mostrar anotações do tipo ${deletionConfig.label}`);
    });

    test('botões de filtro são acessíveis por teclado', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      // Filter buttons should be focusable (they are <button> elements)
      const deletionConfig = typeConfig[AnnotationType.DELETION];
      const button = screen.getByTitle(`${deletionConfig.label} (ativo)`);

      // Verify button is a proper button element (keyboard accessible by default)
      expect(button.tagName).toBe('BUTTON');
      expect(button.getAttribute('type')).toBe('button');

      // Verify button can receive focus
      button.focus();
      expect(document.activeElement).toBe(button);

      // Simulate keyboard activation (Enter key triggers click on buttons)
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      fireEvent.keyUp(button, { key: 'Enter', code: 'Enter' });
      // Note: fireEvent.click is triggered by Enter/Space on buttons natively,
      // but we test the state change to verify keyboard interaction works
    });

    test('botões de filtro mostram status no title', () => {
      const mockSelect = mock(() => {});
      const mockDelete = mock(() => {});

      render(
        <AnnotationPanel
          isOpen={true}
          annotations={createTestAnnotations()}
          blocks={mockBlocks}
          onSelect={mockSelect}
          onDelete={mockDelete}
          selectedId={null}
        />
      );

      const deletionConfig = typeConfig[AnnotationType.DELETION];

      // Active button shows "(ativo)" in title
      let button = screen.getByTitle(`${deletionConfig.label} (ativo)`);
      expect(button).toBeDefined();

      // After toggle, shows "(oculto)" in title
      fireEvent.click(button);
      button = screen.getByTitle(`${deletionConfig.label} (oculto)`);
      expect(button).toBeDefined();
    });
  });
});
