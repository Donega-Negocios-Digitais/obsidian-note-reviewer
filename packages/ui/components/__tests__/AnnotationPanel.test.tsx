import { describe, test, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnnotationPanel } from '../AnnotationPanel';
import { Annotation, AnnotationType } from '../../types';

// Helper to create test annotations
const createAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  id: crypto.randomUUID(),
  blockId: 'block-1',
  startOffset: 0,
  endOffset: 10,
  type: AnnotationType.COMMENT,
  originalText: 'test text',
  text: 'test comment',
  createdA: Date.now(),
  author: 'TestUser',
  isGlobal: false,
  ...overrides,
});

const defaultProps = {
  isOpen: true,
  blocks: [],
  onSelect: mock(() => {}),
  onDelete: mock(() => {}),
  selectedId: null,
};

describe('AnnotationPanel', () => {
  describe('Search Input', () => {
    test('renderiza campo de busca', () => {
      render(
        <AnnotationPanel
          {...defaultProps}
          annotations={[createAnnotation()]}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      expect(searchInput).toBeDefined();
      expect(searchInput.getAttribute('aria-label')).toBe('Buscar anotações');
    });

    test('filtra por originalText', () => {
      const annotations = [
        createAnnotation({ id: '1', originalText: 'primeiro texto' }),
        createAnnotation({ id: '2', originalText: 'segundo texto' }),
        createAnnotation({ id: '3', originalText: 'outro conteudo' }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'primeiro' } });

      // Should show filtered count
      expect(screen.getByText('1 / 3')).toBeDefined();
    });

    test('filtra por texto do comentário', () => {
      const annotations = [
        createAnnotation({ id: '1', text: 'corrigir ortografia' }),
        createAnnotation({ id: '2', text: 'adicionar vírgula' }),
        createAnnotation({ id: '3', text: 'remover palavra' }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'ortografia' } });

      expect(screen.getByText('1 / 3')).toBeDefined();
    });

    test('filtra por autor', () => {
      const annotations = [
        createAnnotation({ id: '1', author: 'Maria' }),
        createAnnotation({ id: '2', author: 'João' }),
        createAnnotation({ id: '3', author: 'Maria' }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'Maria' } });

      expect(screen.getByText('2 / 3')).toBeDefined();
    });

    test('filtra por label do tipo (Excluir)', () => {
      const annotations = [
        createAnnotation({ id: '1', type: AnnotationType.DELETION }),
        createAnnotation({ id: '2', type: AnnotationType.INSERTION }),
        createAnnotation({ id: '3', type: AnnotationType.REPLACEMENT }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'excluir' } });

      expect(screen.getByText('1 / 3')).toBeDefined();
    });

    test('filtra por label do tipo (Inserir)', () => {
      const annotations = [
        createAnnotation({ id: '1', type: AnnotationType.DELETION }),
        createAnnotation({ id: '2', type: AnnotationType.INSERTION }),
        createAnnotation({ id: '3', type: AnnotationType.INSERTION }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'inserir' } });

      expect(screen.getByText('2 / 3')).toBeDefined();
    });

    test('filtra por label do tipo (Substituir)', () => {
      const annotations = [
        createAnnotation({ id: '1', type: AnnotationType.REPLACEMENT }),
        createAnnotation({ id: '2', type: AnnotationType.COMMENT }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'substituir' } });

      expect(screen.getByText('1 / 2')).toBeDefined();
    });

    test('filtra por label do tipo (Comentario)', () => {
      const annotations = [
        createAnnotation({ id: '1', type: AnnotationType.COMMENT }),
        createAnnotation({ id: '2', type: AnnotationType.COMMENT }),
        createAnnotation({ id: '3', type: AnnotationType.DELETION }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'comentario' } });

      expect(screen.getByText('2 / 3')).toBeDefined();
    });

    test('filtra por label do tipo (Global)', () => {
      const annotations = [
        createAnnotation({ id: '1', type: AnnotationType.GLOBAL_COMMENT, isGlobal: true }),
        createAnnotation({ id: '2', type: AnnotationType.COMMENT }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'global' } });

      expect(screen.getByText('1 / 2')).toBeDefined();
    });

    test('busca é case-insensitive', () => {
      const annotations = [
        createAnnotation({ id: '1', originalText: 'TESTE MAIUSCULO' }),
        createAnnotation({ id: '2', originalText: 'teste minusculo' }),
        createAnnotation({ id: '3', originalText: 'TeSte MiXaDo' }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');

      // Search lowercase
      fireEvent.change(searchInput, { target: { value: 'teste' } });
      expect(screen.getByText('3 / 3')).toBeDefined();

      // Search uppercase
      fireEvent.change(searchInput, { target: { value: 'TESTE' } });
      expect(screen.getByText('3 / 3')).toBeDefined();

      // Search mixed
      fireEvent.change(searchInput, { target: { value: 'TeSte' } });
      expect(screen.getByText('3 / 3')).toBeDefined();
    });

    test('query vazia mostra todas as anotações', () => {
      const annotations = [
        createAnnotation({ id: '1' }),
        createAnnotation({ id: '2' }),
        createAnnotation({ id: '3' }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      // Initially shows total count (no search active)
      expect(screen.getByText('3')).toBeDefined();

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');

      // Type something
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Clear the search
      fireEvent.change(searchInput, { target: { value: '' } });

      // Should show total count again (no filtered format)
      expect(screen.getByText('3')).toBeDefined();
    });

    test('query com espaços é tratada corretamente', () => {
      const annotations = [
        createAnnotation({ id: '1', originalText: 'primeiro texto' }),
        createAnnotation({ id: '2', originalText: 'segundo texto' }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');

      // Query with leading/trailing spaces should be trimmed
      fireEvent.change(searchInput, { target: { value: '  primeiro  ' } });
      expect(screen.getByText('1 / 2')).toBeDefined();
    });

    test('mostra mensagem quando busca não retorna resultados', () => {
      const annotations = [
        createAnnotation({ id: '1', originalText: 'texto existente' }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'inexistente' } });

      expect(screen.getByText('Nenhuma anotação encontrada')).toBeDefined();
      expect(screen.getByText('Tente uma busca diferente')).toBeDefined();
    });

    test('mostra mensagem diferente quando não há anotações', () => {
      render(<AnnotationPanel {...defaultProps} annotations={[]} />);

      expect(screen.getByText('Selecione texto para adicionar anotações')).toBeDefined();
    });

    test('botão de limpar aparece quando há texto', () => {
      render(
        <AnnotationPanel
          {...defaultProps}
          annotations={[createAnnotation()]}
        />
      );

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');

      // Clear button should not exist initially
      expect(screen.queryByLabelText('Limpar busca')).toBeNull();

      // Type something
      fireEvent.change(searchInput, { target: { value: 'test' } });

      // Clear button should appear
      expect(screen.getByLabelText('Limpar busca')).toBeDefined();
    });

    test('botão de limpar funciona corretamente', () => {
      const annotations = [
        createAnnotation({ id: '1', originalText: 'primeiro' }),
        createAnnotation({ id: '2', originalText: 'segundo' }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');

      // Type to filter
      fireEvent.change(searchInput, { target: { value: 'primeiro' } });
      expect(screen.getByText('1 / 2')).toBeDefined();

      // Click clear button
      const clearButton = screen.getByLabelText('Limpar busca');
      fireEvent.click(clearButton);

      // Should show all annotations again
      expect(screen.getByText('2')).toBeDefined();
      expect((searchInput as HTMLInputElement).value).toBe('');
    });
  });

  describe('Panel States', () => {
    test('não renderiza quando isOpen é false', () => {
      const { container } = render(
        <AnnotationPanel
          {...defaultProps}
          isOpen={false}
          annotations={[createAnnotation()]}
        />
      );

      expect(container.innerHTML).toBe('');
    });

    test('mostra contador total quando não há busca ativa', () => {
      const annotations = [
        createAnnotation({ id: '1' }),
        createAnnotation({ id: '2' }),
        createAnnotation({ id: '3' }),
        createAnnotation({ id: '4' }),
        createAnnotation({ id: '5' }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      expect(screen.getByText('5')).toBeDefined();
    });

    test('mostra contador filtrado/total quando busca está ativa', () => {
      const annotations = [
        createAnnotation({ id: '1', originalText: 'match' }),
        createAnnotation({ id: '2', originalText: 'match' }),
        createAnnotation({ id: '3', originalText: 'other' }),
      ];

      render(<AnnotationPanel {...defaultProps} annotations={annotations} />);

      const searchInput = screen.getByPlaceholderText('Buscar anotações...');
      fireEvent.change(searchInput, { target: { value: 'match' } });

      expect(screen.getByText('2 / 3')).toBeDefined();
    });
  });
});
