import { describe, test, expect, mock } from 'bun:test';
import { render, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import type { Annotation, Block } from '../../types';

mock.module('web-highlighter', () => {
  class MockHighlighter {
    static event = {
      CREATE: 'CREATE',
      CLICK: 'CLICK',
    };

    constructor() {}
    on() {}
    run() {}
    dispose() {}
    getDoms() {
      return [];
    }
    remove() {}
    addClass() {}
  }

  return {
    default: MockHighlighter,
  };
});

mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

mock.module('highlight.js', () => ({
  default: {
    highlightElement: () => {},
  },
}));

mock.module('mermaid', () => ({
  default: {
    initialize: () => {},
    render: async () => ({ svg: '<svg></svg>' }),
  },
}));

mock.module('dompurify', () => ({
  default: {
    sanitize: (value: string) => value,
  },
}));

import { Viewer } from '../Viewer';

describe('Viewer image edit mode', () => {
  const blocks: Block[] = [
    {
      id: 'block-1',
      type: 'blockquote',
      content: '![Exemplo](https://example.com/image.png)',
      order: 0,
      startLine: 1,
    },
  ];

  const annotations: Annotation[] = [];

  test('toggles drawing enabled flag based on mode', async () => {
    const baseProps = {
      blocks,
      markdown: blocks[0].content,
      annotations,
      onAddAnnotation: () => {},
      onUpdateAnnotation: () => {},
      onSelectAnnotation: () => {},
      selectedAnnotationId: null,
      onBlockChange: () => {},
    };

    const { container, rerender } = render(
      <Viewer
        {...baseProps}
        mode="selection"
      />,
    );

    const image = container.querySelector('img') as HTMLImageElement;
    fireEvent.load(image);

    await waitFor(() => {
      const annotator = container.querySelector('.image-annotator');
      expect(annotator?.getAttribute('data-drawing-enabled')).toBe('false');
    });

    rerender(
      <Viewer
        {...baseProps}
        mode="edit"
      />,
    );

    const imageAfterRerender = container.querySelector('img') as HTMLImageElement;
    fireEvent.load(imageAfterRerender);

    await waitFor(() => {
      const annotator = container.querySelector('.image-annotator');
      expect(annotator?.getAttribute('data-drawing-enabled')).toBe('true');
    });
  });
});
