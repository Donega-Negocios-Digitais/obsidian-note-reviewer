import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { TrashedTemplate } from '../utils/storage';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  trashedTemplates: TrashedTemplate[];
  onRestore: (item: TrashedTemplate) => void;
  onPermanentDelete: (tipo: string, label: string) => void;
}

function getLucideIcon(iconName: string): React.ComponentType<{ className?: string }> {
  const componentName = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const Icon = (LucideIcons as any)[componentName];
  return Icon || LucideIcons.Circle;
}

function getDaysLeft(deletedAt: string): number {
  const deletedDate = new Date(deletedAt);
  return 30 - Math.floor((Date.now() - deletedDate.getTime()) / (24 * 60 * 60 * 1000));
}

function getDaysBadgeClass(daysLeft: number): string {
  if (daysLeft > 15) return 'bg-muted/50 text-muted-foreground';
  if (daysLeft >= 7) return 'bg-muted/50 text-muted-foreground';
  return 'bg-muted/50 text-muted-foreground';
}

export const TrashModal: React.FC<TrashModalProps> = ({
  isOpen,
  onClose,
  trashedTemplates,
  onRestore,
  onPermanentDelete,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div
        className="bg-card border border-border rounded-lg shadow-lg w-full max-w-lg max-h-[75vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground flex-shrink-0 mt-0.5">
              <LucideIcons.Trash2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-foreground">Lixeira</h3>
                {trashedTemplates.length > 0 && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-muted/50 text-muted-foreground">
                    {trashedTemplates.length}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Templates deletados são removidos automaticamente após 30 dias
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-md"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4">
          {trashedTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <LucideIcons.Trash2 className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Nenhum template na lixeira</p>
              <p className="text-xs text-muted-foreground">Templates deletados aparecem aqui por 30 dias</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {trashedTemplates.map((tt) => {
                const Icon = getLucideIcon(tt.icon);
                const deletedDate = new Date(tt.deletedAt);
                const daysLeft = getDaysLeft(tt.deletedAt);
                const badgeClass = getDaysBadgeClass(daysLeft);

                return (
                  <div
                    key={tt.tipo}
                    className="bg-muted/30 rounded-lg border border-border/50 p-3"
                  >
                    {/* Row 1: icon + name + days badge */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground flex-shrink-0">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <h4 className="font-medium text-sm text-foreground truncate">{tt.label}</h4>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${badgeClass}`}>
                        {daysLeft}d
                      </span>
                    </div>

                    {/* Deleted date */}
                    <p className="text-xs text-muted-foreground mb-2">
                      Deletado em {deletedDate.toLocaleDateString('pt-BR')}
                    </p>

                    {/* Divider */}
                    <div className="border-t border-border/30 mb-2" />

                    {/* Row 2: action buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onRestore(tt)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                      >
                        <LucideIcons.RotateCcw className="w-3.5 h-3.5" />
                        Restaurar
                      </button>
                      <button
                        onClick={() => onPermanentDelete(tt.tipo, tt.label)}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                      >
                        <LucideIcons.Trash2 className="w-3.5 h-3.5" />
                        Deletar agora
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/20">
          <p className="text-[11px] text-muted-foreground">
            Items são removidos automaticamente após 30 dias sem restauração
          </p>
        </div>
      </div>
    </div>
  );
};
