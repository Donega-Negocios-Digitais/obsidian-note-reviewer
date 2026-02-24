import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { TrashDocumentRecord } from '../documentService';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface TrashDocumentsModalProps {
  isOpen: boolean;
  loading?: boolean;
  documents: TrashDocumentRecord[];
  onClose: () => void;
  onRestore: (documentId: string) => void;
  onPermanentDelete: (documentId: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function formatDeletedDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function expiryBadgeColor(days: number): string {
  if (days <= 3) return 'bg-destructive/15 text-destructive';
  if (days <= 7) return 'bg-yellow-500/15 text-yellow-600 dark:text-yellow-400';
  return 'bg-muted text-muted-foreground';
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function TrashDocumentsModal({
  isOpen,
  loading,
  documents,
  onClose,
  onRestore,
  onPermanentDelete,
}: TrashDocumentsModalProps): React.ReactElement | null {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmPurgeId, setConfirmPurgeId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredDocs = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((d) => d.title.toLowerCase().includes(q));
  }, [documents, query]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(0);
      setConfirmPurgeId(null);
      setQuery('');
      return;
    }
    const t = setTimeout(() => {
      inputRef.current?.focus();
    }, 30);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (selectedIndex >= filteredDocs.length) {
      setSelectedIndex(Math.max(0, filteredDocs.length - 1));
    }
  }, [filteredDocs.length, selectedIndex]);

  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-trash-item]');
    const target = items[selectedIndex] as HTMLElement | undefined;
    target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (confirmPurgeId) {
        if (e.key === 'Escape' || e.key.toLowerCase() === 'n') {
          e.preventDefault();
          setConfirmPurgeId(null);
        }
        if (e.key === 'Enter' || e.key.toLowerCase() === 'y') {
          e.preventDefault();
          onPermanentDelete(confirmPurgeId);
          setConfirmPurgeId(null);
        }
        return;
      }

      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((p) =>
            filteredDocs.length === 0 ? 0 : (p + 1) % filteredDocs.length,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((p) =>
            filteredDocs.length === 0 ? 0 : p <= 0 ? filteredDocs.length - 1 : p - 1,
          );
          break;
        case 'Enter': {
          e.preventDefault();
          const doc = filteredDocs[selectedIndex];
          if (doc) onRestore(doc.id);
          break;
        }
        case 'Delete': {
          e.preventDefault();
          const doc = filteredDocs[selectedIndex];
          if (doc) setConfirmPurgeId(doc.id);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmPurgeId, filteredDocs, selectedIndex, onClose, onRestore, onPermanentDelete]);

  if (!isOpen) return null;

  const modal = (
    <div
      className="fixed inset-0 z-[500] flex items-start justify-center"
      onClick={onClose}
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      <div
        className="mt-[12vh] w-full max-w-[560px] overflow-hidden rounded-2xl border border-border/40 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'raycast-in 150ms cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Header with gradient - matching invite modal style */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-5 py-4 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/15 flex items-center justify-center">
                <svg
                  className="h-5 w-5 shrink-0 text-destructive"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Lixeira</h3>
                <p className="text-sm text-muted-foreground">Documentos deletados</p>
              </div>
            </div>
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-destructive/15 text-destructive">
              {filteredDocs.length} {filteredDocs.length === 1 ? 'item' : 'itens'}
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-3 border-b border-border/40 px-4 py-2 bg-muted/20">
          <svg
            className="h-4 w-4 shrink-0 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar na lixeira…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>

        {/* List */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto overscroll-contain py-1" style={{ scrollbarWidth: 'thin' }}>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Carregando…
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              {query ? 'Nenhum resultado.' : 'Lixeira vazia.'}
            </div>
          ) : (
            filteredDocs.map((doc, index) => {
              const isSelected = index === selectedIndex;
              const isConfirming = confirmPurgeId === doc.id;

              return (
                <div
                  key={doc.id}
                  data-trash-item
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`group mx-1 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-75 ${
                    isSelected ? 'bg-primary/10 text-foreground' : 'text-foreground/80 hover:bg-muted/40'
                  }`}
                >
                  {/* Icon */}
                  <svg
                    className={`h-4 w-4 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  </svg>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    {isConfirming ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-destructive font-medium">Excluir permanentemente?</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPermanentDelete(doc.id);
                            setConfirmPurgeId(null);
                          }}
                          className="rounded bg-destructive/90 px-2 py-0.5 text-xs font-medium text-destructive-foreground hover:bg-destructive transition-colors"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setConfirmPurgeId(null);
                          }}
                          className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <>
                        <p className="truncate text-sm font-medium">{doc.title || 'Sem título'}</p>
                        <p className="text-xs text-muted-foreground">Excluído em {formatDeletedDate(doc.deletedAt)}</p>
                      </>
                    )}
                  </div>

                  {/* Right: expiry badge + actions */}
                  {!isConfirming && (
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${expiryBadgeColor(doc.expiresInDays)}`}>
                        {doc.expiresInDays}d
                      </span>

                      {/* Restore */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRestore(doc.id);
                        }}
                        className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
                        title="Restaurar (Enter)"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                          <path d="M3 3v5h5" />
                        </svg>
                      </button>

                      {/* Permanent delete */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmPurgeId(doc.id);
                        }}
                        className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                        title="Excluir permanentemente (Del)"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          <line x1="10" x2="10" y1="11" y2="17" />
                          <line x1="14" x2="14" y1="11" y2="17" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-border/40 px-4 py-2">
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span><kbd className="inline-flex h-4 items-center rounded border border-border/60 bg-muted/50 px-1 text-[10px] font-medium">↵</kbd> restaurar</span>
            <span><kbd className="inline-flex h-4 items-center rounded border border-border/60 bg-muted/50 px-1 text-[10px] font-medium">Del</kbd> excluir permanente</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Voltar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes raycast-in {
          from { opacity: 0; transform: scale(0.96) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
}
