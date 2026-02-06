/**
 * Theme Provider Component
 *
 * Provides theme context to React tree.
 */

import React, { useEffect } from 'react';
import { useDarkMode } from '../hooks/useDarkMode';

export interface ThemeProviderProps {
  children: React.ReactNode;
}

const ThemeContext = React.createContext<{
  mode: 'light' | 'dark' | 'system';
  isDark: boolean;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggle: () => void;
} | null>(null);

/**
 * Theme provider component
 *
 * Wraps the app and provides theme context to all children.
 * Also applies dark mode class to document element.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  const { mode, isDark, setMode, toggle } = useDarkMode();

  // Apply dark mode class to document
  useEffect(() => {
    const root = document.documentElement;

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Set color-scheme for native elements
    root.style.colorScheme = isDark ? 'dark' : 'light';
  }, [isDark]);

  const contextValue = React.useMemo(
    () => ({ mode, isDark, setMode, toggle }),
    [mode, isDark, setMode, toggle]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Hook to access theme context
 */
export function useTheme() {
  const context = React.useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return context;
}

export default ThemeProvider;
