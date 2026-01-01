/**
 * Focus Trap Hook for Modal Dialogs
 *
 * Provides accessibility features for modal dialogs:
 * - Traps focus within the modal container
 * - Cycles Tab/Shift+Tab through focusable elements
 * - Handles Escape key to close the modal
 * - Restores focus to the previously focused element on close
 */

import { RefObject, useEffect } from 'react';

/**
 * Selector for all potentially focusable elements
 * Includes: buttons, links, inputs, textareas, selects, and elements with tabindex
 */
const FOCUSABLE_SELECTOR = [
  'button',
  'a[href]',
  'input',
  'textarea',
  'select',
  '[tabindex]',
].join(',');

/**
 * Get all focusable elements within a container
 *
 * Filters out:
 * - Disabled elements
 * - Elements with tabindex="-1"
 * - Hidden elements (display: none, visibility: hidden)
 * - Elements inside hidden containers
 *
 * @param container - The container element to search within
 * @returns Array of focusable HTMLElements in DOM order
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);

  return Array.from(elements).filter((element) => {
    // Skip disabled elements
    if (
      element instanceof HTMLButtonElement ||
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      if (element.disabled) {
        return false;
      }
    }

    // Skip elements with negative tabindex (explicitly removed from tab order)
    const tabindex = element.getAttribute('tabindex');
    if (tabindex !== null && parseInt(tabindex, 10) < 0) {
      return false;
    }

    // Skip hidden elements
    const style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden') {
      return false;
    }

    // Check if any ancestor is hidden (element inside collapsed container, etc.)
    let parent = element.parentElement;
    while (parent && parent !== container) {
      const parentStyle = window.getComputedStyle(parent);
      if (parentStyle.display === 'none' || parentStyle.visibility === 'hidden') {
        return false;
      }
      parent = parent.parentElement;
    }

    return true;
  });
}

interface UseFocusTrapOptions {
  /** Ref to the modal container element */
  containerRef: RefObject<HTMLElement>;
  /** Whether the modal is currently open */
  isOpen: boolean;
  /** Callback to close the modal (called on Escape key) */
  onClose: () => void;
}

/**
 * Hook to trap focus within a modal dialog
 *
 * @param options - Configuration options for the focus trap
 *
 * @example
 * ```tsx
 * const modalRef = useRef<HTMLDivElement>(null);
 *
 * useFocusTrap({
 *   containerRef: modalRef,
 *   isOpen: isModalOpen,
 *   onClose: handleClose,
 * });
 *
 * return (
 *   <div ref={modalRef} role="dialog" aria-modal="true">
 *     ...modal content...
 *   </div>
 * );
 * ```
 */
export function useFocusTrap(options: UseFocusTrapOptions): void {
  const { containerRef, isOpen, onClose } = options;

  useEffect(() => {
    if (!isOpen || !containerRef.current) {
      return;
    }

    const container = containerRef.current;

    // Placeholder for focus trap implementation
    // Subtasks 1.2-1.5 will implement:
    // - Focusable element detection
    // - Tab key cycling
    // - Escape key handling
    // - Focus restoration

    const handleKeyDown = (event: KeyboardEvent) => {
      // Will be implemented in subtasks 1.3 and 1.4
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, containerRef, onClose]);
}
