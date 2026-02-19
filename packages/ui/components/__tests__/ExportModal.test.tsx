import { describe, test, expect, mock, afterEach } from 'bun:test';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import React from 'react';
import { ExportModal } from '../ExportModal';

mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const baseProps = {
  isOpen: true,
  onClose: mock(() => {}),
  shareUrl: 'https://example.com/share/abc123',
  shareUrlSize: '1.2 KB',
  diffOutput: '+ Added line\n- Removed line',
  annotationCount: 3,
};

afterEach(() => {
  cleanup();
});

describe('ExportModal', () => {
  test('does not render when closed', () => {
    render(<ExportModal {...baseProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('opens in share tab by default', () => {
    render(<ExportModal {...baseProps} />);
    const input = screen.getByDisplayValue('https://example.com/share/abc123') as HTMLInputElement;
    expect(input.value).toBe('https://example.com/share/abc123');
  });

  test('supports opening directly in diff tab', () => {
    render(<ExportModal {...baseProps} initialTab="diff" />);
    expect(screen.getByText(/Added line/)).toBeDefined();
  });

  test('switches to diff tab when clicked', () => {
    render(<ExportModal {...baseProps} />);
    fireEvent.click(screen.getByRole('button', { name: 'Relatório de Revisão' }));
    expect(screen.getByText(/Removed line/)).toBeDefined();
  });

  test('shows share error and disables copy button', () => {
    render(
      <ExportModal
        {...baseProps}
        shareUrl=""
        shareUrlSize=""
        shareError="Falha ao gerar link"
      />,
    );

    expect(screen.getByText('Falha ao gerar link')).toBeDefined();
    const copyButton = screen.getByRole('button', { name: 'exportModal.copy' }) as HTMLButtonElement;
    expect(copyButton.disabled).toBe(true);
  });
});
