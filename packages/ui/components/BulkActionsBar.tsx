import React from 'react';

export interface BulkActionsBarProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  onExportSelected: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onDeleteSelected,
  onExportSelected,
}) => {
  // Don't render if nothing is selected
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div
      className="absolute bottom-0 left-0 right-0 p-2 border-t border-border/50 bg-card/95 backdrop-blur-sm animate-in slide-in-from-bottom-2 fade-in duration-200"
    >
      <div className="flex items-center justify-between gap-2">
        {/* Selection count */}
        <span className="text-[10px] font-mono bg-primary/20 px-1.5 py-0.5 rounded text-primary flex-shrink-0">
          {selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}
        </span>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {/* Export Selected */}
          <button
            onClick={onExportSelected}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Exportar
          </button>

          {/* Delete Selected */}
          <button
            onClick={onDeleteSelected}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 hover:border-destructive/50"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Excluir
          </button>
        </div>
      </div>
    </div>
  );
};
