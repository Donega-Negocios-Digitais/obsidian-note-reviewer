import { describe, test, expect, mock } from 'bun:test';
import { fireEvent, render, screen } from '@testing-library/react';
import { BaseModal } from '../BaseModal';

describe('BaseModal', () => {
  test('does not close on window blur', () => {
    const onClose = mock(() => {});

    render(
      <BaseModal
        isOpen={true}
        onRequestClose={onClose}
        closeOnBackdropClick={false}
      >
        <div>Persistent modal</div>
      </BaseModal>,
    );

    window.dispatchEvent(new Event('blur'));

    expect(onClose).toHaveBeenCalledTimes(0);
    expect(screen.getByText('Persistent modal')).toBeDefined();
  });

  test('does not close on document visibilitychange', () => {
    const onClose = mock(() => {});

    render(
      <BaseModal
        isOpen={true}
        onRequestClose={onClose}
        closeOnBackdropClick={false}
      >
        <div>Still open</div>
      </BaseModal>,
    );

    document.dispatchEvent(new Event('visibilitychange'));

    expect(onClose).toHaveBeenCalledTimes(0);
    expect(screen.getByText('Still open')).toBeDefined();
  });

  test('closes only on explicit backdrop click when enabled', () => {
    const onClose = mock(() => {});

    render(
      <BaseModal
        isOpen={true}
        onRequestClose={onClose}
        closeOnBackdropClick={true}
      >
        <div>Dialog body</div>
      </BaseModal>,
    );

    const backdrop = document.querySelector('.fixed');
    if (!backdrop) throw new Error('Backdrop not found');

    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
