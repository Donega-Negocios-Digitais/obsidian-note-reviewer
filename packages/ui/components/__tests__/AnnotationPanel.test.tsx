import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { AnnotationPanel } from '../AnnotationPanel';
import { Annotation, AnnotationType } from '../../types';

mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockWriteText = mock(() => Promise.resolve());

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: mockWriteText,
    },
    configurable: true,
    writable: true,
  });
  mockWriteText.mockClear();
});

afterEach(() => {
  cleanup();
});

function createAnnotation(overrides: Partial<Annotation> = {}): Annotation {
  return {
    id: 'ann-1',
    blockId: 'block-1',
    startOffset: 0,
    endOffset: 5,
    type: AnnotationType.COMMENT,
    originalText: 'texto',
    text: 'comentario',
    createdA: Date.now(),
    author: 'tester',
    ...overrides,
  };
}

describe('AnnotationPanel', () => {
  test('renders annotation content and author', () => {
    render(
      <AnnotationPanel
        isOpen={true}
        annotations={[createAnnotation()]}
        blocks={[]}
        onSelect={mock(() => {})}
        onDelete={mock(() => {})}
        selectedId={null}
      />,
    );

    expect(screen.getByText('comentario')).toBeDefined();
    expect(screen.getByText('tester')).toBeDefined();
  });

  test('deletes annotation when delete button is clicked', () => {
    const onDelete = mock(() => {});

    const { container } = render(
      <AnnotationPanel
        isOpen={true}
        annotations={[createAnnotation()]}
        blocks={[]}
        onSelect={mock(() => {})}
        onDelete={onDelete}
        selectedId={null}
      />,
    );

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(1);
    fireEvent.click(buttons[0]);
    expect(onDelete).toHaveBeenCalledWith('ann-1');
  });

  test('shows restore action when deleted items exist', () => {
    const onRestore = mock(() => {});

    render(
      <AnnotationPanel
        isOpen={true}
        annotations={[createAnnotation()]}
        blocks={[]}
        onSelect={mock(() => {})}
        onDelete={mock(() => {})}
        onRestoreLastDeleted={onRestore}
        deletedCount={1}
        selectedId={null}
      />,
    );

    const restoreButton = screen.getByRole('button', { name: /annotationPanel\.restore|Restaurar/i });
    fireEvent.click(restoreButton);
    expect(onRestore).toHaveBeenCalledTimes(1);
  });

  test('quick-share copies share URL', async () => {
    render(
      <AnnotationPanel
        isOpen={true}
        annotations={[createAnnotation()]}
        blocks={[]}
        onSelect={mock(() => {})}
        onDelete={mock(() => {})}
        selectedId={null}
        shareUrl="https://example.com/#hash"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'annotationPanel.share' }));

    await waitFor(() => {
      expect(mockWriteText).toHaveBeenCalledWith('https://example.com/#hash');
    });
  });
});
