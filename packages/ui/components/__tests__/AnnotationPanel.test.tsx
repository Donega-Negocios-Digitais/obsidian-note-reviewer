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
        const config = typeConfig[type];
        expect(screen.getByTitle(config.label)).toBeDefined();
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
        const config = typeConfig[type];
        const button = screen.getByTitle(config.label);
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

      const deletionConfig = typeConfig[AnnotationType.DELETION];
      const button = screen.getByTitle(deletionConfig.label);

      // Initially active
      expect(button.getAttribute('aria-pressed')).toBe('true');

      // Click to toggle off
      fireEvent.click(button);
      expect(button.getAttribute('aria-pressed')).toBe('false');

      // Click to toggle back on
      fireEvent.click(button);
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

      const deletionButton = screen.getByTitle(typeConfig[AnnotationType.DELETION].label);
      const insertionButton = screen.getByTitle(typeConfig[AnnotationType.INSERTION].label);

      // Toggle off both
      fireEvent.click(deletionButton);
      fireEvent.click(insertionButton);

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
      const deletionButton = screen.getByTitle(typeConfig[AnnotationType.DELETION].label);
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
      const globalButton = screen.getByTitle(typeConfig[AnnotationType.GLOBAL_COMMENT].label);
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

      // Toggle off all types
      Object.values(AnnotationType).forEach(type => {
        const button = screen.getByTitle(typeConfig[type].label);
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

      const deletionButton = screen.getByTitle(typeConfig[AnnotationType.DELETION].label);

      // Toggle off
      fireEvent.click(deletionButton);
      expect(screen.queryByText('"deleted text"')).toBeNull();

      // Toggle back on
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
      const deletionButton = screen.getByTitle(typeConfig[AnnotationType.DELETION].label);
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
      fireEvent.click(screen.getByTitle(typeConfig[AnnotationType.DELETION].label));
      fireEvent.click(screen.getByTitle(typeConfig[AnnotationType.INSERTION].label));

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

      const deletionButton = screen.getByTitle(typeConfig[AnnotationType.DELETION].label);

      // Toggle off
      fireEvent.click(deletionButton);
      expect(screen.getByText('4/5')).toBeDefined();

      // Toggle back on
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

      // Check active buttons have "Ocultar" in aria-label
      const activeButton = screen.getByTitle(typeConfig[AnnotationType.DELETION].label);
      expect(activeButton.getAttribute('aria-label')).toContain('Ocultar');

      // Toggle off and check "Mostrar" in aria-label
      fireEvent.click(activeButton);
      expect(activeButton.getAttribute('aria-label')).toContain('Mostrar');
    });
  });
});
