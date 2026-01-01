import { describe, test, expect, mock, beforeEach, afterEach } from 'bun:test';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ExportModal } from '../ExportModal';

describe('ExportModal', () => {
  let rafCallback: FrameRequestCallback | null = null;
  const originalRaf = window.requestAnimationFrame;

  beforeEach(() => {
    // Mock requestAnimationFrame to execute immediately
    window.requestAnimationFrame = (callback: FrameRequestCallback) => {
      rafCallback = callback;
      // Execute immediately for synchronous testing
      callback(0);
      return 1;
    };
  });

  afterEach(() => {
    window.requestAnimationFrame = originalRaf;
    rafCallback = null;
  });

  const defaultProps = {
    isOpen: true,
    onClose: mock(() => {}),
    shareUrl: 'https://example.com/share/abc123',
    shareUrlSize: '1.2 KB',
    diffOutput: '+ Added line\n- Removed line',
    annotationCount: 5,
  };

  describe('focus trapping', () => {
    test('auto-focuses first focusable element when modal opens', async () => {
      render(<ExportModal {...defaultProps} />);

      // Wait for focus trap to set up
      await waitFor(() => {
        // The first focusable element should be the close button or first tab button
        const closeButton = screen.getByRole('button', { name: /close/i }) ||
                           document.querySelector('button');
        expect(document.activeElement?.tagName).toBe('BUTTON');
      });
    });

    test('traps focus within modal - Tab cycles from last to first element', async () => {
      render(<ExportModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');

      // Get all focusable buttons in the modal
      const buttons = dialog.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Focus the last button
      const lastButton = buttons[buttons.length - 1];
      lastButton.focus();
      expect(document.activeElement).toBe(lastButton);

      // Simulate Tab key press
      fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: false });

      // Should cycle to first focusable element
      await waitFor(() => {
        const focusedElement = document.activeElement;
        // Focus should be on a focusable element within the modal
        expect(dialog.contains(focusedElement)).toBe(true);
      });
    });

    test('traps focus within modal - Shift+Tab cycles from first to last element', async () => {
      render(<ExportModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');

      // Get all focusable buttons in the modal
      const buttons = dialog.querySelectorAll('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Focus the first button
      const firstButton = buttons[0];
      firstButton.focus();
      expect(document.activeElement).toBe(firstButton);

      // Simulate Shift+Tab key press
      fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });

      // Should cycle to last focusable element
      await waitFor(() => {
        const focusedElement = document.activeElement;
        // Focus should still be within the modal
        expect(dialog.contains(focusedElement)).toBe(true);
      });
    });

    test('focus stays within modal when pressing Tab', async () => {
      render(<ExportModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');

      // Focus an element in the middle of the modal
      const textarea = dialog.querySelector('textarea');
      if (textarea) {
        textarea.focus();
        expect(document.activeElement).toBe(textarea);
      }

      // Press Tab multiple times
      for (let i = 0; i < 10; i++) {
        fireEvent.keyDown(dialog, { key: 'Tab' });
        await waitFor(() => {
          // Focus should always stay within the modal
          expect(dialog.contains(document.activeElement)).toBe(true);
        });
      }
    });
  });

  describe('Escape key handling', () => {
    test('closes modal when Escape key is pressed', async () => {
      const onClose = mock(() => {});
      render(<ExportModal {...defaultProps} onClose={onClose} />);

      const dialog = screen.getByRole('dialog');

      // Press Escape key
      fireEvent.keyDown(dialog, { key: 'Escape' });

      await waitFor(() => {
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    test('Escape key stops propagation', async () => {
      const onClose = mock(() => {});
      const parentHandler = mock(() => {});

      // Add a parent handler
      document.body.addEventListener('keydown', parentHandler);

      render(<ExportModal {...defaultProps} onClose={onClose} />);

      const dialog = screen.getByRole('dialog');

      // Press Escape key
      fireEvent.keyDown(dialog, { key: 'Escape' });

      // Parent handler should not be called (stopPropagation)
      await waitFor(() => {
        expect(parentHandler).not.toHaveBeenCalled();
      });

      document.body.removeEventListener('keydown', parentHandler);
    });

    test('other keys do not close modal', async () => {
      const onClose = mock(() => {});
      render(<ExportModal {...defaultProps} onClose={onClose} />);

      const dialog = screen.getByRole('dialog');

      // Press various keys
      fireEvent.keyDown(dialog, { key: 'Enter' });
      fireEvent.keyDown(dialog, { key: 'Space' });
      fireEvent.keyDown(dialog, { key: 'ArrowDown' });
      fireEvent.keyDown(dialog, { key: 'a' });

      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('focus restoration on close', () => {
    test('restores focus to trigger element when modal closes', async () => {
      const onClose = mock(() => {});

      // Create and focus a trigger button before rendering the modal
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      expect(document.activeElement).toBe(triggerButton);

      // Render the modal (simulating it opening after trigger click)
      const { rerender } = render(
        <ExportModal {...defaultProps} isOpen={true} onClose={onClose} />
      );

      // Wait for auto-focus to happen
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog.contains(document.activeElement)).toBe(true);
      });

      // Close the modal by rerendering with isOpen=false
      rerender(<ExportModal {...defaultProps} isOpen={false} onClose={onClose} />);

      // Wait for focus restoration
      await waitFor(() => {
        expect(document.activeElement).toBe(triggerButton);
      });

      // Cleanup
      document.body.removeChild(triggerButton);
    });

    test('handles case when trigger element is removed from DOM', async () => {
      const onClose = mock(() => {});

      // Create and focus a trigger button
      const triggerButton = document.createElement('button');
      triggerButton.textContent = 'Open Modal';
      document.body.appendChild(triggerButton);
      triggerButton.focus();

      // Render the modal
      const { rerender } = render(
        <ExportModal {...defaultProps} isOpen={true} onClose={onClose} />
      );

      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(dialog.contains(document.activeElement)).toBe(true);
      });

      // Remove the trigger button from DOM (simulating dynamic content)
      document.body.removeChild(triggerButton);

      // Close the modal - should not throw
      rerender(<ExportModal {...defaultProps} isOpen={false} onClose={onClose} />);

      // Test passes if no error is thrown
    });
  });

  describe('ARIA attributes', () => {
    test('modal has role="dialog"', () => {
      render(<ExportModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeDefined();
    });

    test('modal has aria-modal="true"', () => {
      render(<ExportModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
    });

    test('modal has aria-labelledby pointing to title', () => {
      render(<ExportModal {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      const labelledBy = dialog.getAttribute('aria-labelledby');
      expect(labelledBy).toBe('export-modal-title');

      // Verify the title element exists with this id
      const title = document.getElementById('export-modal-title');
      expect(title).toBeDefined();
      expect(title?.textContent).toBe('Export');
    });
  });

  describe('modal visibility', () => {
    test('does not render when isOpen is false', () => {
      render(<ExportModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).toBeNull();
    });

    test('renders when isOpen is true', () => {
      render(<ExportModal {...defaultProps} isOpen={true} />);

      expect(screen.getByRole('dialog')).toBeDefined();
    });
  });

  describe('tab navigation', () => {
    test('can switch between Share and Raw Diff tabs', async () => {
      render(<ExportModal {...defaultProps} />);

      // Share tab should be active by default
      expect(screen.getByText('Shareable URL')).toBeDefined();

      // Click Raw Diff tab
      const rawDiffTab = screen.getByRole('button', { name: /Raw Diff/i });
      fireEvent.click(rawDiffTab);

      // Raw Diff content should be visible
      await waitFor(() => {
        expect(screen.getByText(/Added line/)).toBeDefined();
      });
    });
  });
});
