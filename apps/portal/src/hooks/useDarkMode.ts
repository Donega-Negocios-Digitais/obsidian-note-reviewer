/**
 * Dark Mode Hook
 *
 * Detects and manages dark mode preference.
 */

import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export interface DarkModeState {
  mode: ThemeMode;
  isDark: boolean;
}

export interface UseDarkModeReturn {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

const STORAGE_KEY = 'obsreview-theme-mode';
const DEFAULT_MODE: ThemeMode = 'system';

/**
 * Get system dark mode preference
 */
function getSystemDarkMode(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * Get effective dark mode based on theme mode setting
 */
function getEffectiveDarkMode(mode: ThemeMode): boolean {
  if (mode === 'system') {
    return getSystemDarkMode();
  }
  return mode === 'dark';
}

/**
 * Hook for managing dark mode
 */
export function useDarkMode(): UseDarkModeReturn {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return DEFAULT_MODE;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['light', 'dark', 'system'].includes(stored)) {
        return stored as ThemeMode;
      }
    } catch (e) {
      console.warn('Could not read theme mode from localStorage:', e);
    }

    return DEFAULT_MODE;
  });

  const [isDark, setIsDark] = useState(() => getEffectiveDarkMode(mode));

  // Update dark mode when mode changes or system preference changes
  useEffect(() => {
    const updateDarkMode = () => {
      setIsDark(getEffectiveDarkMode(mode));
    };

    updateDarkMode();

    if (mode === 'system') {
      // Listen for system preference changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateDarkMode);
      return () => mediaQuery.removeEventListener('change', updateDarkMode);
    }
  }, [mode]);

  // Set mode and persist to localStorage
  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    setIsDark(getEffectiveDarkMode(newMode));

    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch (e) {
      console.warn('Could not save theme mode to localStorage:', e);
    }
  }, []);

  // Toggle between light and dark (ignores system)
  const toggle = useCallback(() => {
    setMode(mode === 'dark' ? 'light' : 'dark');
  }, [mode, setMode]);

  return {
    mode,
    isDark,
    setMode,
    toggle,
  };
}

export default useDarkMode;
