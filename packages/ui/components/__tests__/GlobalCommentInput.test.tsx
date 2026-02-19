import { describe, test, expect, mock, afterEach } from 'bun:test';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';

mock.module('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

mock.module('../../utils/identity', () => ({
  getIdentity: () => 'identity-fallback',
}));

import { GlobalCommentInput } from '../GlobalCommentInput';

afterEach(() => {
  cleanup();
});

describe('GlobalCommentInput', () => {
  test('does not render when closed', () => {
    render(
      <GlobalCommentInput
        isOpen={false}
        onClose={mock(() => {})}
        onSubmit={mock(() => {})}
      />,
    );

    expect(screen.queryByRole('dialog')).toBeNull();
  });

  test('prefills author from defaultAuthor', () => {
    render(
      <GlobalCommentInput
        isOpen={true}
        onClose={mock(() => {})}
        onSubmit={mock(() => {})}
        defaultAuthor="Alex"
      />,
    );

    const authorInput = screen.getByLabelText('globalCommentInput.author') as HTMLInputElement;
    expect(authorInput.value).toBe('Alex');
  });

  test('submit button is disabled when comment is empty', () => {
    render(
      <GlobalCommentInput
        isOpen={true}
        onClose={mock(() => {})}
        onSubmit={mock(() => {})}
      />,
    );

    const submitButton = screen.getByRole('button', { name: 'globalCommentInput.addComment' }) as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  test('submits with Ctrl+Enter', async () => {
    const onSubmit = mock(() => {});
    const onClose = mock(() => {});

    render(
      <GlobalCommentInput
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        defaultAuthor="Alex"
      />,
    );

    const textarea = screen.getByLabelText('globalCommentInput.commentLabel') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'Comentário global' } });
    fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true });

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith('Comentário global', 'Alex');
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
