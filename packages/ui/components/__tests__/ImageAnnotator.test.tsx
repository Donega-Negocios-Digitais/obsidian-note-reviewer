import { describe, test, expect } from 'bun:test';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ImageAnnotator } from '../ImageAnnotator';

describe('ImageAnnotator', () => {
  test('renders canvas overlay for annotation layer', () => {
    render(
      <ImageAnnotator
        src="https://example.com/image.png"
        alt="Imagem de teste"
      />,
    );

    const canvas = screen.getByTestId('image-annotator-canvas');
    expect(canvas).toBeDefined();
  });

  test('keeps drawing disabled when enabled is false', async () => {
    const { container } = render(
      <ImageAnnotator
        src="https://example.com/image.png"
        alt="Imagem de teste"
        enabled={false}
      />,
    );

    const wrapper = container.querySelector('.image-annotator');
    const image = container.querySelector('img') as HTMLImageElement;
    const canvas = screen.getByTestId('image-annotator-canvas') as HTMLCanvasElement;

    fireEvent.load(image);

    await waitFor(() => {
      expect(canvas.style.pointerEvents).toBe('none');
    });

    expect(wrapper?.getAttribute('data-drawing-enabled')).toBe('false');
    expect(screen.queryByTitle(/passe o mouse/i)).toBeNull();
  });

  test('enables drawing and toolbar in edit mode after image load', async () => {
    const { container } = render(
      <ImageAnnotator
        src="https://example.com/image.png"
        alt="Imagem de teste"
        enabled={true}
      />,
    );

    const image = container.querySelector('img') as HTMLImageElement;
    const canvas = screen.getByTestId('image-annotator-canvas') as HTMLCanvasElement;

    expect(screen.getByTitle(/passe o mouse/i)).toBeDefined();

    fireEvent.load(image);

    await waitFor(() => {
      expect(canvas.style.pointerEvents).toBe('auto');
      expect(canvas.style.opacity).toBe('1');
    });
  });
});
