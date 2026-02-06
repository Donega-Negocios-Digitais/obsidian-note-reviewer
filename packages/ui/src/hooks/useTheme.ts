/**
 * useTheme Hook
 *
 * Hook for managing theme with system preference detection and persistence.
 */

import { useState, useEffect, useCallback } from 'react';
import type { Theme, ThemePreference } from '../theme/tokens';
import { getThemeCSSVariables } from '../theme/tokens';

const THEME_STORAGE_KEY = 'obsreview-theme';
const ACCENT_COLOR_KEY = 'obsreview-accent-color';

export interface UseThemeReturn {
  theme: ThemePreference;
  resolvedTheme: Theme;
  accentColor: string;
  setTheme: (theme: ThemePreference) => void;
  setAccentColor: (color: string) => void;
  toggleTheme: () => void;
}

/**
 * Detect system theme preference
 */
function getSystemTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Resolve theme preference to actual theme
 */
function resolveThemePreference(preference: ThemePreference): Theme {
  if (preference === 'system') {
    return getSystemTheme();
  }
  return preference;
}

/**
 * Hook for theme management
 */
export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<ThemePreference>(() => {
    if (typeof window === 'undefined') return 'system';

    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored && (stored === 'light' || stored === 'dark' || stored === 'system')) {
      return stored as ThemePreference;
    }
    return 'system';
  });

  const [accentColor, setAccentColorState] = useState<string>(() => {
    if (typeof window === 'undefined') return '#3b82f6';

    const stored = localStorage.getItem(ACCENT_COLOR_KEY);
    return stored || '#3b82f6';
  });

  const [resolvedTheme, setResolvedTheme] = useState<Theme>(() => {
    return resolveThemePreference(theme);
  });

  /**
   * Apply theme to DOM
   */
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;
    const variables = getThemeCSSVariables(newTheme);

    // Apply theme class
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);

    // Apply CSS variables
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, []);

  /**
   * Apply accent color to DOM
   */
  const applyAccentColor = useCallback((color: string) => {
    if (typeof document === 'undefined') return;

    const root = document.documentElement;

    // Convert hex to HSL for CSS variable
    const hsl = hexToHSL(color);
    root.style.setProperty('--primary', hsl);
    root.style.setProperty('--ring', hsl);
  }, []);

  /**
   * Set theme preference
   */
  const setTheme = useCallback((newTheme: ThemePreference) => {
    setThemeState(newTheme);
    localStorage.setItem(THEME_STORAGE_KEY, newTheme);

    const resolved = resolveThemePreference(newTheme);
    setResolvedTheme(resolved);
    applyTheme(resolved);
  }, [applyTheme]);

  /**
   * Set accent color
   */
  const setAccentColor = useCallback((color: string) => {
    setAccentColorState(color);
    localStorage.setItem(ACCENT_COLOR_KEY, color);
    applyAccentColor(color);
  }, [applyAccentColor]);

  /**
   * Toggle between light and dark
   */
  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
  }, [resolvedTheme, setTheme]);

  /**
   * Listen for system theme changes
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (theme === 'system') {
        const newResolved = getSystemTheme();
        setResolvedTheme(newResolved);
        applyTheme(newResolved);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, applyTheme]);

  /**
   * Apply theme on mount
   */
  useEffect(() => {
    applyTheme(resolvedTheme);
    applyAccentColor(accentColor);
  }, []); // Only on mount

  return {
    theme,
    resolvedTheme,
    accentColor,
    setTheme,
    setAccentColor,
    toggleTheme,
  };
}

/**
 * Convert hex color to HSL string
 */
function hexToHSL(hex: string): string {
  // Remove hash
  hex = hex.replace('#', '');

  // Parse hex to RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default useTheme;
