import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface RaycastDocumentItem {
  id: string;
  title: string;
  updatedAt: string;
}

interface RaycastDocumentsModalProps {
  isOpen: boolean;
  loading?: boolean;
  documents: RaycastDocumentItem[];
  activeDocumentId?: string | null;
  onClose: () => void;
  onSelectDocument: (documentId: string) => void;
  onCreateDocument: () => void;
  onDeleteDocument: (documentId: string) => void;
  onRenameDocument: (documentId: string, newTitle: string) => void;
  onOpenTrash: () => void;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function relativeTime(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'agora';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHour < 24) return `${diffHour}h`;
  if (diffDay === 1) return 'ontem';
  if (diffDay < 30) return `${diffDay}d`;

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'short',
  }).format(date);
}

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export function RaycastDocumentsModal({
  isOpen,
  loading,
  documents,
  activeDocumentId,
  onClose,
  onSelectDocument,
  onCreateDocument,
  onDeleteDocument,
  onRenameDocument,
  onOpenTrash,
}: RaycastDocumentsModalProps): React.ReactElement | null {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredDocuments = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return documents;
    return documents.filter((doc: RaycastDocumentItem) => doc.title.toLowerCase().includes(q));
  }, [documents, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setConfirmDeleteId(null);
      setRenamingId(null);
      return;
    }
    const activeIdx = filteredDocuments.findIndex((d: RaycastDocumentItem) => d.id === activeDocumentId);
    setSelectedIndex(activeIdx >= 0 ? activeIdx : 0);
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 30);
    return () => clearTimeout(t);
  }, [isOpen]);

  useEffect(() => {
    if (renamingId) {
      const t = setTimeout(() => {
        renameInputRef.current?.focus();
        renameInputRef.current?.select();
      }, 30);
      return () => clearTimeout(t);
    }
  }, [renamingId]);

  useEffect(() => {
    if (selectedIndex >= filteredDocuments.length) {
      setSelectedIndex(Math.max(0, filteredDocuments.length - 1));
    }
  }, [filteredDocuments.length, selectedIndex]);

  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-doc-item]');
    const target = items[selectedIndex] as HTMLElement | undefined;
    target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  const commitRename = useCallback(() => {
    if (!renamingId) return;
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== documents.find((d: RaycastDocumentItem) => d.id === renamingId)?.title) {
      onRenameDocument(renamingId, trimmed);
    }
    setRenamingId(null);
    setRenameValue('');
    inputRef.current?.focus();
  }, [renamingId, renameValue, documents, onRenameDocument]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (renamingId) {
        if (e.key === 'Escape') { e.preventDefault(); setRenamingId(null); setRenameValue(''); inputRef.current?.focus(); }
        if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
        return;
      }

      if (confirmDeleteId) {
        if (e.key === 'Escape' || e.key.toLowerCase() === 'n') { e.preventDefault(); setConfirmDeleteId(null); }
        if (e.key === 'Enter' || e.key.toLowerCase() === 'y') { e.preventDefault(); onDeleteDocument(confirmDeleteId); setConfirmDeleteId(null); }
        return;
      }

      switch (e.key) {
        case 'Escape': e.preventDefault(); onClose(); break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((p: number) => filteredDocuments.length === 0 ? 0 : (p + 1) % filteredDocuments.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((p: number) => filteredDocuments.length === 0 ? 0 : p <= 0 ? filteredDocuments.length - 1 : p - 1);
          break;
        case 'Enter': {
          e.preventDefault();
          const doc = filteredDocuments[selectedIndex];
          if (doc) { onSelectDocument(doc.id); onClose(); }
          break;
        }
        case 'Delete': {
          e.preventDefault();
          const doc = filteredDocuments[selectedIndex];
          if (doc && doc.id !== activeDocumentId) setConfirmDeleteId(doc.id);
          break;
        }
        case 'F2': {
          e.preventDefault();
          const doc = filteredDocuments[selectedIndex];
          if (doc) { setRenamingId(doc.id); setRenameValue(doc.title); }
          break;
        }
        default:
          if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') { e.preventDefault(); onCreateDocument(); }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, renamingId, confirmDeleteId, filteredDocuments, selectedIndex, activeDocumentId, onClose, onSelectDocument, onCreateDocument, onDeleteDocument, commitRename]);

  if (!isOpen) return null;

  const modal = (
    <div className="rc-overlay" onClick={onClose}>
      <div className="rc-modal" onClick={(e: React.MouseEvent) => e.stopPropagation()}>

        {/* ---- Search ---- */}
        <div className="rc-search">
          <svg className="rc-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
            placeholder="Buscar documentos…"
            className="rc-search-input"
            spellCheck={false}
          />
          {query && (
            <button className="rc-search-clear" onClick={() => { setQuery(''); inputRef.current?.focus(); }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* ---- List ---- */}
        <div ref={listRef} className="rc-list">
          {loading ? (
            <div className="rc-empty">
              <div className="rc-spinner" />
              <span>Carregando documentos…</span>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="rc-empty">
              <svg className="w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              </svg>
              <span>{query ? 'Nenhum resultado.' : 'Nenhum documento.'}</span>
            </div>
          ) : (
            <>
              <div className="rc-section-label">Documentos</div>
              {filteredDocuments.map((doc: RaycastDocumentItem, index: number) => {
                const isSelected = index === selectedIndex;
                const isActive = doc.id === activeDocumentId;
                const isConfirmingDelete = confirmDeleteId === doc.id;
                const isRenaming = renamingId === doc.id;

                return (
                  <div
                    key={doc.id}
                    data-doc-item
                    onMouseEnter={() => setSelectedIndex(index)}
                    onClick={() => {
                      if (isRenaming || isConfirmingDelete) return;
                      onSelectDocument(doc.id);
                      onClose();
                    }}
                    className={`rc-item ${isSelected ? 'rc-item--selected' : ''}`}
                  >
                    {/* Icon */}
                    <svg className="rc-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                      <path d="M10 13h4" />
                      <path d="M10 17h4" />
                    </svg>

                    {/* Content */}
                    <div className="rc-item-content">
                      {isRenaming ? (
                        <input
                          ref={renameInputRef}
                          value={renameValue}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRenameValue(e.target.value)}
                          onBlur={commitRename}
                          onKeyDown={(e: React.KeyboardEvent) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') { e.preventDefault(); commitRename(); }
                            if (e.key === 'Escape') { e.preventDefault(); setRenamingId(null); setRenameValue(''); inputRef.current?.focus(); }
                          }}
                          className="rc-rename-input"
                          onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          spellCheck={false}
                        />
                      ) : (
                        <span
                          className="rc-item-title"
                          onClick={(event: React.MouseEvent) => event.stopPropagation()}
                          onDoubleClick={(event: React.MouseEvent) => {
                            event.stopPropagation();
                            if (isConfirmingDelete) return;
                            setRenamingId(doc.id);
                            setRenameValue(doc.title);
                          }}
                          title="Duplo clique para renomear"
                        >
                          {doc.title || 'Sem título'}
                        </span>
                      )}
                    </div>

                    {/* Right side */}
                    {!isRenaming && (
                      <div className="rc-item-meta">
                        {!isConfirmingDelete && (
                          <>
                            <span className="rc-item-date">{relativeTime(doc.updatedAt)}</span>
                            {isActive && <span className="rc-badge">ativo</span>}
                          </>
                        )}

                        {isConfirmingDelete ? (
                          <div className="rc-confirm-row">
                            <span className="rc-confirm-text">Excluir?</span>
                            <button className="rc-confirm-no" onClick={(e: React.MouseEvent) => { e.stopPropagation(); setConfirmDeleteId(null); }}>
                              Não
                            </button>
                            <button className="rc-confirm-yes" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onDeleteDocument(doc.id); setConfirmDeleteId(null); }}>
                              Sim
                            </button>
                          </div>
                        ) : (
                          <div className="rc-item-actions">
                            <button
                              className="rc-action-btn"
                              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setRenamingId(doc.id); setRenameValue(doc.title); }}
                              title="Renomear (F2)"
                            >
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
                              </svg>
                            </button>
                            {!isActive && (
                              <button
                                className="rc-action-btn rc-action-btn--danger"
                                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setConfirmDeleteId(doc.id); }}
                                title="Excluir (Del)"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* ---- Footer ---- */}
        <div className="rc-footer">
          <div className="rc-footer-hints">
            <span><kbd>↑↓</kbd> navegar</span>
            <span><kbd>↵</kbd> abrir</span>
            <span><kbd>F2</kbd> renomear</span>
            <span><kbd>Del</kbd> excluir</span>
          </div>
          <div className="rc-footer-actions">
            <button className="rc-footer-btn rc-footer-btn--trash" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onOpenTrash(); }}>
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              Lixeira
            </button>
            <button className="rc-footer-btn rc-footer-btn--new" onClick={(e: React.MouseEvent) => { e.stopPropagation(); onCreateDocument(); }}>
              + Novo
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* ---- Raycast Command Palette ---- */
        .rc-overlay {
          position: fixed; inset: 0; z-index: 200;
          display: flex; align-items: flex-start; justify-content: center;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
          animation: rc-fade-in 120ms ease-out;
        }
        .rc-modal {
          margin-top: 13vh;
          width: 100%; max-width: 580px;
          border-radius: 12px;
          overflow: hidden;
          background: var(--card);
          border: 1px solid var(--border);
          box-shadow: 0 25px 60px -12px rgba(0,0,0,0.35),
                      0 0 0 1px color-mix(in oklch, var(--border) 50%, transparent);
          animation: rc-pop-in 150ms cubic-bezier(0.16,1,0.3,1);
          display: flex; flex-direction: column;
          max-height: 70vh;
        }

        /* Search */
        .rc-search {
          display: flex; align-items: center; gap: 10px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
        }
        .rc-search-icon {
          width: 16px; height: 16px; flex-shrink: 0;
          color: var(--muted-foreground); opacity: 0.7;
        }
        .rc-search-input {
          flex: 1; background: transparent; border: none; outline: none;
          font-size: 14px; color: var(--foreground);
          font-weight: 400; letter-spacing: -0.01em;
        }
        .rc-search-input::placeholder { color: var(--muted-foreground); }
        .rc-search-clear {
          display: flex; align-items: center; justify-content: center;
          width: 18px; height: 18px; border-radius: 4px;
          background: var(--muted); border: none; cursor: pointer;
          color: var(--muted-foreground);
          transition: opacity 100ms;
        }
        .rc-search-clear:hover { color: var(--foreground); }

        /* List — with scroll shadows */
        .rc-list {
          flex: 1; overflow-y: auto; overscroll-behavior: contain;
          padding: 4px 6px;
          scrollbar-width: thin;
          scrollbar-color: color-mix(in oklch, var(--muted-foreground) 30%, transparent) transparent;
          background:
            /* shadow top */
            linear-gradient(var(--card) 30%, transparent) center top,
            /* shadow bottom */
            linear-gradient(transparent, var(--card) 70%) center bottom,
            /* shadow cover top */
            linear-gradient(color-mix(in oklch, var(--foreground) 8%, transparent), transparent) center top,
            /* shadow cover bottom */
            linear-gradient(transparent, color-mix(in oklch, var(--foreground) 8%, transparent)) center bottom;
          background-size: 100% 20px, 100% 20px, 100% 8px, 100% 8px;
          background-repeat: no-repeat;
          background-attachment: local, local, scroll, scroll;
        }
        .rc-list::-webkit-scrollbar { width: 6px; }
        .rc-list::-webkit-scrollbar-track { background: transparent; }
        .rc-list::-webkit-scrollbar-thumb {
          background: color-mix(in oklch, var(--muted-foreground) 25%, transparent);
          border-radius: 3px;
        }
        .rc-list::-webkit-scrollbar-thumb:hover {
          background: color-mix(in oklch, var(--muted-foreground) 45%, transparent);
        }

        .rc-section-label {
          padding: 6px 10px 4px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.04em;
          color: var(--muted-foreground);
          text-transform: uppercase;
        }

        /* Item */
        .rc-item {
          display: flex; align-items: center; gap: 10px;
          padding: 7px 10px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 60ms ease;
          position: relative;
        }
        .rc-item--selected {
          background: color-mix(in oklch, var(--foreground) 8%, transparent);
        }
        .rc-item-icon {
          width: 16px; height: 16px; flex-shrink: 0;
          color: var(--muted-foreground);
          opacity: 0.6;
        }
        .rc-item--selected .rc-item-icon { opacity: 0.9; }
        .rc-item-content { flex: 1; min-width: 0; }
        .rc-item-title {
          display: block;
          font-size: 13px; font-weight: 450;
          color: var(--foreground);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          letter-spacing: -0.01em;
          opacity: 0.8;
        }
        .rc-item--selected .rc-item-title { opacity: 1; font-weight: 500; }

        /* Meta (right side) */
        .rc-item-meta {
          display: flex; align-items: center; gap: 6px;
          flex-shrink: 0;
        }
        .rc-item-date {
          font-size: 11px; color: var(--muted-foreground);
          font-variant-numeric: tabular-nums;
        }
        .rc-badge {
          font-size: 10px; font-weight: 600;
          padding: 1px 5px; border-radius: 4px;
          background: color-mix(in oklch, oklch(0.72 0.19 142) 15%, transparent);
          color: oklch(0.72 0.19 142);
          text-transform: uppercase; letter-spacing: 0.04em;
        }

        /* Action buttons */
        .rc-item-actions {
          display: flex; gap: 2px;
          opacity: 0; transition: opacity 100ms;
        }
        .rc-item--selected .rc-item-actions,
        .rc-item:hover .rc-item-actions { opacity: 1; }
        .rc-action-btn {
          display: flex; align-items: center; justify-content: center;
          width: 24px; height: 24px; border-radius: 6px;
          border: none; cursor: pointer;
          background: transparent;
          color: var(--muted-foreground);
          transition: all 80ms;
        }
        .rc-action-btn svg { width: 13px; height: 13px; }
        .rc-action-btn:hover {
          background: color-mix(in oklch, var(--primary) 15%, transparent);
          color: var(--primary);
        }
        .rc-action-btn--danger:hover {
          background: color-mix(in oklch, var(--destructive) 15%, transparent);
          color: var(--destructive);
        }

        /* Rename input */
        .rc-rename-input {
          width: 100%; border: none; outline: none;
          background: var(--background);
          border-radius: 4px; padding: 2px 6px;
          font-size: 13px; font-weight: 450;
          color: var(--foreground);
          box-shadow: 0 0 0 1px var(--border);
        }

        /* Confirm row */
        .rc-confirm-row { display: flex; align-items: center; gap: 6px; }
        .rc-confirm-text { font-size: 12px; font-weight: 500; color: var(--destructive); }
        .rc-confirm-yes, .rc-confirm-no {
          font-size: 11px; font-weight: 500; border: none; cursor: pointer;
          padding: 2px 8px; border-radius: 4px; transition: all 80ms;
        }
        .rc-confirm-yes {
          background: color-mix(in oklch, var(--destructive) 15%, transparent);
          color: var(--destructive);
        }
        .rc-confirm-yes:hover {
          background: color-mix(in oklch, var(--destructive) 25%, transparent);
        }
        .rc-confirm-no {
          background: var(--muted);
          color: var(--muted-foreground);
        }
        .rc-confirm-no:hover {
          background: color-mix(in oklch, var(--foreground) 10%, transparent);
        }

        /* Empty */
        .rc-empty {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 8px; padding: 40px 16px;
          color: var(--muted-foreground);
          font-size: 13px;
        }
        .rc-spinner {
          width: 16px; height: 16px;
          border: 2px solid var(--border);
          border-top-color: var(--muted-foreground);
          border-radius: 50%;
          animation: rc-spin 600ms linear infinite;
        }

        /* Footer */
        .rc-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 12px;
          border-top: 1px solid var(--border);
        }
        .rc-footer-hints {
          display: flex; gap: 10px;
          font-size: 11px; color: var(--muted-foreground);
          opacity: 0.75;
        }
        .rc-footer-hints kbd {
          display: inline-flex; align-items: center;
          height: 16px; padding: 0 4px;
          border-radius: 3px; margin-right: 2px;
          font-size: 10px; font-family: inherit; font-weight: 500;
          background: var(--muted);
          border: 1px solid var(--border);
          color: var(--muted-foreground);
        }
        .rc-footer-actions { display: flex; gap: 4px; }
        .rc-footer-btn {
          display: flex; align-items: center; gap: 4px;
          padding: 3px 8px; border-radius: 5px;
          font-size: 11px; font-weight: 500;
          border: none; cursor: pointer;
          background: transparent;
          color: var(--muted-foreground);
          transition: all 80ms;
        }
        .rc-footer-btn:hover {
          background: color-mix(in oklch, var(--foreground) 8%, transparent);
          color: var(--foreground);
        }
        .rc-footer-btn--trash:hover {
          background: color-mix(in oklch, var(--destructive) 15%, transparent);
          color: var(--destructive);
        }
        .rc-footer-btn--new {
          background: color-mix(in oklch, var(--primary) 10%, transparent);
          color: var(--primary);
        }
        .rc-footer-btn--new:hover {
          background: color-mix(in oklch, var(--primary) 18%, transparent);
        }

        /* Animations */
        @keyframes rc-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes rc-pop-in {
          from { opacity: 0; transform: scale(0.97) translateY(-6px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes rc-spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 640px) {
          .rc-modal { margin-top: 8vh; max-width: calc(100% - 24px); max-height: 80vh; }
          .rc-footer-hints { display: none; }
        }
      `}</style>
    </div>
  );

  return createPortal(modal, document.body);
}
