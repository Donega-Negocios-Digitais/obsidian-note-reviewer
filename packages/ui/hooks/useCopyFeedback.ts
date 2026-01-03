/**
 * Hook for managing copy-to-clipboard functionality with animation feedback
 *
 * Provides:
 * - Clipboard write with error handling
 * - Copy state management (idle, copying, copied)
 * - Animation class names for visual feedback
 * - Configurable success display duration
 * - Reduced motion preference awareness
 *
 * Accessibility:
 * CSS animations are automatically disabled via @media (prefers-reduced-motion: reduce)
 * in index.css. The visual feedback (color changes, icon swaps) remains functional
 * without motion to ensure all users receive confirmation of the copy action.
 */

import { useState, useCallback, useRef } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';

export type CopyState = 'idle' | 'copying' | 'copied';

export interface CopyFeedbackOptions {
  /** Duration to show success state in milliseconds (default: 2000) */
  successDuration?: number;
  /** Callback when copy succeeds */
  onSuccess?: () => void;
  /** Callback when copy fails */
  onError?: (error: Error) => void;
}

export interface UseCopyFeedbackResult {
  /** Whether the copy was successful (shows success state) */
  copied: boolean;
  /** Whether a copy operation is in progress */
  copying: boolean;
  /** Current state of the copy operation */
  state: CopyState;
  /** Handler to trigger copy - pass the text to copy */
  handleCopy: (text: string) => Promise<void>;
  /** CSS class names to apply for animation feedback */
  animationClass: string;
  /** CSS class for the button itself (includes success styling) */
  buttonClass: string;
  /** CSS class for the icon (enter/exit transitions) */
  iconClass: string;
  /** Reset state back to idle */
  reset: () => void;
  /** Whether the user prefers reduced motion (from system settings) */
  prefersReducedMotion: boolean;
}

/**
 * Custom hook for copy-to-clipboard with micro-animation feedback
 *
 * @example
 * ```tsx
 * const { copied, handleCopy, animationClass, buttonClass } = useCopyFeedback();
 *
 * return (
 *   <button
 *     onClick={() => handleCopy(textToCopy)}
 *     className={`base-styles ${animationClass} ${buttonClass}`}
 *   >
 *     {copied ? 'Copied!' : 'Copy'}
 *   </button>
 * );
 * ```
 */
export function useCopyFeedback(options: CopyFeedbackOptions = {}): UseCopyFeedbackResult {
  const { successDuration = 2000, onSuccess, onError } = options;

  const [state, setState] = useState<CopyState>('idle');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();

  // Clear any existing timeout
  const clearExistingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Reset state back to idle
  const reset = useCallback(() => {
    clearExistingTimeout();
    setState('idle');
  }, [clearExistingTimeout]);

  // Main copy handler
  const handleCopy = useCallback(
    async (text: string) => {
      // Clear any existing timeout from previous copy
      clearExistingTimeout();

      // Set copying state
      setState('copying');

      try {
        await navigator.clipboard.writeText(text);

        // Success - show copied state
        setState('copied');
        onSuccess?.();

        // Reset to idle after duration
        timeoutRef.current = setTimeout(() => {
          setState('idle');
          timeoutRef.current = null;
        }, successDuration);
      } catch (error) {
        // Failed - reset to idle and call error handler
        setState('idle');
        const err = error instanceof Error ? error : new Error('Failed to copy to clipboard');
        onError?.(err);
      }
    },
    [successDuration, onSuccess, onError, clearExistingTimeout]
  );

  // Derive boolean states
  const copied = state === 'copied';
  const copying = state === 'copying';

  // Build animation class names based on state
  // Only apply animation class on the transition to copied state
  const animationClass = copied ? 'copy-success' : '';

  // Button success styling class
  const buttonClass = copied ? 'copy-button-success' : '';

  // Icon transition classes
  const iconClass = copied ? 'copy-icon-enter' : '';

  return {
    copied,
    copying,
    state,
    handleCopy,
    animationClass,
    buttonClass,
    iconClass,
    reset,
    prefersReducedMotion,
  };
}
