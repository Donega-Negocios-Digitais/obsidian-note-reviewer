import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { storage } from '../utils/storage';

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: 'dark',
  setTheme: () => null,
});

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'obsidian-reviewer-theme',
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(
    () => (storage.getItem(storageKey) as Theme) || defaultTheme
  );
  const transitionTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const root = window.document.documentElement;

    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: light)').matches
        ? 'light'
        : 'dark';
    }

    root.classList.toggle('light', effectiveTheme === 'light');
    root.setAttribute('data-theme', effectiveTheme);
  }, [theme]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    const handleChange = () => {
      const root = window.document.documentElement;
      root.classList.toggle('light', mediaQuery.matches);
      root.setAttribute('data-theme', mediaQuery.matches ? 'light' : 'dark');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme: (newTheme: Theme) => {
      storage.setItem(storageKey, newTheme);

      const root = window.document.documentElement;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const supportsViewTransition =
        typeof document !== 'undefined' &&
        'startViewTransition' in document &&
        !prefersReducedMotion;

      if (supportsViewTransition) {
        const doc = document as Document & {
          startViewTransition?: (updateCallback: () => void) => { finished: Promise<void> };
        };

        try {
          const transition = doc.startViewTransition?.(() => {
            flushSync(() => setThemeState(newTheme));
          });
          if (transition) {
            return;
          }
        } catch (error) {
          console.warn('Theme transition failed, applying theme directly:', error);
        }
      }

      if (!prefersReducedMotion) {
        root.classList.add('theme-switching');
        if (transitionTimeoutRef.current) {
          window.clearTimeout(transitionTimeoutRef.current);
        }
        transitionTimeoutRef.current = window.setTimeout(() => {
          root.classList.remove('theme-switching');
          transitionTimeoutRef.current = null;
        }, 220);
      }

      setThemeState(newTheme);
    },
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
