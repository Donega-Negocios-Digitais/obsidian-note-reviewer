import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ReceivedInviteItem {
  id: string;
  noteId: string;
  email: string;
  role: 'owner' | 'editor' | 'viewer';
  token: string;
  expiresAt: string;
  documentTitle: string;
}

interface ReceivedInvitesModalProps {
  isOpen: boolean;
  loading?: boolean;
  invites: ReceivedInviteItem[];
  actionState: { inviteId: string; action: 'accept' | 'decline' } | null;
  onClose: () => void;
  onAccept: (invite: ReceivedInviteItem) => Promise<void>;
  onDecline: (invite: ReceivedInviteItem) => Promise<void>;
}

function formatExpiry(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

function roleLabel(role: 'owner' | 'editor' | 'viewer'): string {
  if (role === 'editor') return 'Editor';
  if (role === 'owner') return 'Proprietário';
  return 'Visualizador';
}

export function ReceivedInvitesModal({
  isOpen,
  loading,
  invites,
  actionState,
  onClose,
  onAccept,
  onDecline,
}: ReceivedInvitesModalProps): React.ReactElement | null {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredInvites = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return invites;
    return invites.filter((invite) =>
      invite.documentTitle.toLowerCase().includes(normalizedQuery)
      || invite.email.toLowerCase().includes(normalizedQuery)
      || invite.noteId.toLowerCase().includes(normalizedQuery),
    );
  }, [invites, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (selectedIndex >= filteredInvites.length) {
      setSelectedIndex(Math.max(0, filteredInvites.length - 1));
    }
  }, [filteredInvites.length, selectedIndex]);

  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-invite-item]');
    const target = items[selectedIndex] as HTMLElement | undefined;
    target?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [selectedIndex]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) =>
            filteredInvites.length === 0 ? 0 : (prev + 1) % filteredInvites.length,
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) =>
            filteredInvites.length === 0 ? 0 : prev <= 0 ? filteredInvites.length - 1 : prev - 1,
          );
          break;
        case 'Enter': {
          event.preventDefault();
          const invite = filteredInvites[selectedIndex];
          if (invite) {
            void onAccept(invite);
          }
          break;
        }
        case 'Delete': {
          event.preventDefault();
          const invite = filteredInvites[selectedIndex];
          if (invite) {
            void onDecline(invite);
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, filteredInvites, selectedIndex, onClose, onAccept, onDecline]);

  if (!isOpen) return null;

  const modal = (
    <div className="rc-overlay" onClick={onClose}>
      <div className="rc-modal" onClick={(event) => event.stopPropagation()}>

        {/* ---- Header ---- */}
        <div className="rc-header">
          <div className="rc-header-content">
            <svg className="rc-header-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <div className="rc-header-text">
              <h3 className="rc-header-title">Convites recebidos</h3>
              <p className="rc-header-subtitle">Aceite ou recuse sem sair do editor</p>
            </div>
          </div>
          <span className="rc-header-badge">
            {filteredInvites.length} {filteredInvites.length === 1 ? 'convite' : 'convites'}
          </span>
        </div>

        {/* ---- Search ---- */}
        <div className="rc-search">
          <svg className="rc-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar convite…"
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
              <span>Carregando convites…</span>
            </div>
          ) : filteredInvites.length === 0 ? (
            <div className="rc-empty">
              <svg className="w-8 h-8 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>{query ? 'Nenhum convite encontrado.' : 'Sem convites pendentes.'}</span>
            </div>
          ) : (
            <>
              <div className="rc-section-label">Convites</div>
              {filteredInvites.map((invite, index) => {
                const isSelected = index === selectedIndex;
                const isAccepting = actionState?.inviteId === invite.id && actionState.action === 'accept';
                const isDeclining = actionState?.inviteId === invite.id && actionState.action === 'decline';
                const isBusy = isAccepting || isDeclining;

                return (
                  <div
                    key={invite.id}
                    data-invite-item
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`rc-item ${isSelected ? 'rc-item--selected' : ''}`}
                  >
                    {/* Icon */}
                    <svg className="rc-item-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    </svg>

                    {/* Content */}
                    <div className="rc-item-content">
                      <span className="rc-item-title">{invite.documentTitle || 'Sem título'}</span>
                      <span className="rc-item-meta-text">
                        {roleLabel(invite.role)} • expira em {formatExpiry(invite.expiresAt)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="rc-item-actions">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void onDecline(invite);
                        }}
                        disabled={isBusy}
                        className="rc-action-btn rc-action-btn--secondary"
                      >
                        {isDeclining ? 'Recusando...' : 'Recusar'}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          void onAccept(invite);
                        }}
                        disabled={isBusy}
                        className="rc-action-btn rc-action-btn--primary"
                      >
                        {isAccepting ? 'Aceitando...' : 'Aceitar'}
                      </button>
                    </div>
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
            <span><kbd>↵</kbd> aceitar</span>
            <span><kbd>Del</kbd> recusar</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rc-footer-btn"
          >
            Fechar
          </button>
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

          /* Header */
          .rc-header {
            display: flex; align-items: center; justify-content: space-between;
            padding: 16px 20px;
            border-bottom: 1px solid var(--border);
            background: linear-gradient(to bottom right, color-mix(in oklch, var(--primary) 10%, transparent), color-mix(in oklch, var(--primary) 5%, transparent));
          }
          .rc-header-content {
            display: flex; align-items: center; gap: 12px;
          }
          .rc-header-icon {
            width: 20px; height: 20px;
            color: var(--primary);
            flex-shrink: 0;
          }
          .rc-header-text {
            display: flex; flex-direction: column;
          }
          .rc-header-title {
            font-size: 15px; font-weight: 600;
            color: var(--foreground);
            letter-spacing: -0.01em;
          }
          .rc-header-subtitle {
            font-size: 12px;
            color: var(--muted-foreground);
          }
          .rc-header-badge {
            font-size: 11px; font-weight: 600;
            padding: 4px 10px; border-radius: 20px;
            background: color-mix(in oklch, var(--primary) 15%, transparent);
            color: var(--primary);
            white-space: nowrap;
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
              linear-gradient(var(--card) 30%, transparent) center top,
              linear-gradient(transparent, var(--card) 70%) center bottom,
              linear-gradient(color-mix(in oklch, var(--foreground) 8%, transparent), transparent) center top,
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
            padding: 8px 10px;
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
          .rc-item-content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
          .rc-item-title {
            display: block;
            font-size: 13px; font-weight: 450;
            color: var(--foreground);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            letter-spacing: -0.01em;
            opacity: 0.8;
          }
          .rc-item--selected .rc-item-title { opacity: 1; font-weight: 500; }
          .rc-item-meta-text {
            font-size: 11px;
            color: var(--muted-foreground);
          }

          /* Action buttons */
          .rc-item-actions {
            display: flex; gap: 4px;
            flex-shrink: 0;
          }
          .rc-action-btn {
            font-size: 11px; font-weight: 500; border: none; cursor: pointer;
            padding: 4px 10px; border-radius: 6px; transition: all 80ms;
          }
          .rc-action-btn--secondary {
            background: transparent;
            color: var(--muted-foreground);
          }
          .rc-action-btn--secondary:hover {
            background: color-mix(in oklch, var(--destructive) 12%, transparent);
            color: var(--destructive);
          }
          .rc-action-btn--primary {
            background: var(--primary);
            color: var(--primary-foreground);
          }
          .rc-action-btn--primary:hover {
            background: color-mix(in oklch, var(--primary) 90%, black);
          }
          .rc-action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
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
          .rc-footer-btn {
            display: flex; align-items: center;
            padding: 4px 10px; border-radius: 5px;
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
    </div>
  );

  return createPortal(modal, document.body);
}
