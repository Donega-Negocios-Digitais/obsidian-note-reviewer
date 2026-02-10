import React from 'react';
import { useTheme } from './ThemeProvider';

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;

  // Alterna entre light e dark diretamente
  const toggleTheme = () => {
    const newTheme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <button
      onClick={toggleTheme}
      className="relative p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none overflow-hidden transition-colors"
      title={resolvedTheme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      aria-label={resolvedTheme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
    >
      <div className="relative w-4 h-4">
        {/* Sol - mostrado quando está em dark (para mudar para light) */}
        <svg
          className={`w-4 h-4 transition-all duration-300 ease-in-out ${
            resolvedTheme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-75'
          } absolute top-0 left-0`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>

        {/* Lua - mostrada quando está em light (para mudar para dark) */}
        <svg
          className={`w-4 h-4 transition-all duration-300 ease-in-out ${
            resolvedTheme === 'light' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-75'
          } absolute top-0 left-0`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </div>
    </button>
  );
}
