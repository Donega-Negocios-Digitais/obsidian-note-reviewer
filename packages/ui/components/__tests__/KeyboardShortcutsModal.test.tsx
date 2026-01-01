import { describe, test, expect, mock } from 'bun:test';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutsModal } from '../KeyboardShortcutsModal';
import { SHORTCUTS, CATEGORY_LABELS } from '../../utils/shortcuts';

describe('KeyboardShortcutsModal', () => {
  test('renderiza modal quando isOpen é true', () => {
    const mockOnClose = mock(() => {});

    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('Atalhos de Teclado')).toBeDefined();
  });

  test('não renderiza modal quando isOpen é false', () => {
    const mockOnClose = mock(() => {});

    render(<KeyboardShortcutsModal isOpen={false} onClose={mockOnClose} />);

    expect(screen.queryByText('Atalhos de Teclado')).toBeNull();
  });

  test('fecha modal ao pressionar Escape', () => {
    const mockOnClose = mock(() => {});

    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('fecha modal ao clicar no botão de fechar', () => {
    const mockOnClose = mock(() => {});

    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByTitle('Fechar (Esc)');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('fecha modal ao clicar no backdrop', () => {
    const mockOnClose = mock(() => {});

    const { container } = render(
      <KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />
    );

    // Find the backdrop (the outermost fixed div)
    const backdrop = container.querySelector('.fixed.inset-0');
    expect(backdrop).toBeDefined();

    fireEvent.click(backdrop!);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('não fecha modal ao clicar no conteúdo do modal', () => {
    const mockOnClose = mock(() => {});

    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    // Click on the modal content (the card)
    const modalContent = screen.getByText('Atalhos de Teclado').closest('.bg-card');
    expect(modalContent).toBeDefined();

    fireEvent.click(modalContent!);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('renderiza lista de atalhos definidos', () => {
    const mockOnClose = mock(() => {});

    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    // Check that all shortcuts are rendered
    for (const shortcut of SHORTCUTS) {
      expect(screen.getByText(shortcut.label)).toBeDefined();
      expect(screen.getByText(shortcut.description)).toBeDefined();
    }
  });

  test('renderiza categorias dos atalhos', () => {
    const mockOnClose = mock(() => {});

    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    // Check that categories with shortcuts are rendered
    const categoriesWithShortcuts = new Set(SHORTCUTS.map(s => s.category));

    for (const category of categoriesWithShortcuts) {
      expect(screen.getByText(CATEGORY_LABELS[category])).toBeDefined();
    }
  });

  test('mostra dica de fechar com Esc no footer', () => {
    const mockOnClose = mock(() => {});

    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText(/Pressione/)).toBeDefined();
    expect(screen.getByText(/para fechar/)).toBeDefined();
  });

  test('tem acessibilidade com título correto', () => {
    const mockOnClose = mock(() => {});

    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    // Check for the modal title heading
    const title = screen.getByText('Atalhos de Teclado');
    expect(title.tagName.toLowerCase()).toBe('h3');
  });

  test('botão de fechar tem título acessível', () => {
    const mockOnClose = mock(() => {});

    render(<KeyboardShortcutsModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByTitle('Fechar (Esc)');
    expect(closeButton).toBeDefined();
  });

  test('não adiciona listener quando modal está fechado', () => {
    const mockOnClose = mock(() => {});

    render(<KeyboardShortcutsModal isOpen={false} onClose={mockOnClose} />);

    // Press Escape when modal is closed - should not call onClose
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
