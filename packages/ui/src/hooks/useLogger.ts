/**
 * useLogger Hook
 *
 * Hook for component-scoped logging.
 */

import { useMemo } from 'react';
import { createLogger } from '@obsidian-note-reviewer/core/logger';

export interface UseLoggerReturn {
  debug: (message: string, data?: unknown) => void;
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, error?: Error | unknown) => void;
}

/**
 * Hook for creating a scoped logger for a component
 */
export function useLogger(component: string): UseLoggerReturn {
  const logger = useMemo(() => createLogger(component), [component]);

  return {
    debug: logger.debug,
    info: logger.info,
    warn: logger.warn,
    error: logger.error,
  };
}

export default useLogger;
