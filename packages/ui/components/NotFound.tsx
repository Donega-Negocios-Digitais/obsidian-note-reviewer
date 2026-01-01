import React from 'react';
import { ThemeProvider } from './ThemeProvider';
import { ModeToggle } from './ModeToggle';

export const NotFound: React.FC = () => {
  return (
    <ThemeProvider defaultTheme="dark">
      <div className="h-screen flex flex-col bg-background overflow-hidden">
        {/* Header */}
        <header className="h-12 flex items-center justify-between px-2 md:px-4 border-b border-border/50 bg-card/50 backdrop-blur-xl z-50">
          <div className="flex items-center gap-2 md:gap-3">
            <a
              href="/"
              className="flex items-center gap-1.5 md:gap-2 hover:opacity-80 transition-opacity"
            >
              <span className="text-sm font-semibold tracking-tight">Obsidian Note Reviewer</span>
            </a>
          </div>
          <ModeToggle />
        </header>

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center bg-grid p-4">
          <div className="max-w-2xl w-full">
            <article className="bg-card border border-border/50 rounded-xl shadow-xl p-8 md:p-12">
              {/* Error Icon */}
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-destructive"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
              </div>

              {/* Error Code */}
              <div className="text-center mb-6">
                <h1 className="text-6xl md:text-7xl font-bold text-foreground/20 mb-2">404</h1>
                <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-3">
                  Página Não Encontrada
                </h2>
                <p className="text-muted-foreground text-sm md:text-base">
                  A página que você está procurando não existe ou foi movida.
                </p>
              </div>

              {/* Error Details */}
              <div className="bg-muted/30 border border-border/30 rounded-lg p-4 mb-6">
                <div className="text-xs font-mono space-y-1 text-muted-foreground">
                  <div>
                    <span className="text-foreground/70">Code:</span> NOT_FOUND
                  </div>
                  <div>
                    <span className="text-foreground/70">Status:</span> 404
                  </div>
                  <div>
                    <span className="text-foreground/70">URL:</span> {window.location.pathname}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="/"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Voltar para Início
                </a>
                <button
                  onClick={() => window.history.back()}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Voltar
                </button>
              </div>

              {/* Help Section */}
              <div className="mt-8 pt-6 border-t border-border/30">
                <p className="text-sm text-muted-foreground text-center">
                  Precisa de ajuda? Consulte a{' '}
                  <a
                    href="https://github.com/alexdonega/obsidian-note-reviewer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    documentação
                  </a>
                  {' '}ou reporte um problema no{' '}
                  <a
                    href="https://github.com/alexdonega/obsidian-note-reviewer/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2 hover:text-primary/80"
                  >
                    GitHub
                  </a>
                  .
                </p>
              </div>
            </article>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
};
