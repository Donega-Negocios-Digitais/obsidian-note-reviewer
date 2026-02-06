/**
 * Theme Hook
 *
 * Convenience hook for accessing theme context.
 */

import { useTheme as useThemeContext } from '../components/ThemeProvider';

// Re-export for easier importing
export { useTheme as useThemeContext } from '../components/ThemeProvider';

/**
 * Hook for accessing theme state
 *
 * Provides theme mode, dark status, and control functions.
 */
export function useTheme() {
  return useThemeContext();
}

export default useTheme;
