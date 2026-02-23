import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@obsidian-note-reviewer/security/auth';
import { acceptInvite } from '@obsidian-note-reviewer/collaboration';

const PENDING_INVITE_TOKEN_KEY = 'obsreview-pending-invite-token';

type InviteState = 'loading' | 'requires-auth' | 'processing' | 'error';

export function AcceptInvite() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [state, setState] = useState<InviteState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const token = useMemo(() => {
    const fromUrl = new URLSearchParams(location.search).get('token');
    if (fromUrl) return fromUrl;
    if (typeof window === 'undefined') return null;
    return window.sessionStorage.getItem(PENDING_INVITE_TOKEN_KEY);
  }, [location.search]);

  useEffect(() => {
    if (!token) {
      setState('error');
      setErrorMessage('Token de convite ausente ou inválido.');
      return;
    }

    if (loading) {
      setState('loading');
      return;
    }

    if (!user) {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(PENDING_INVITE_TOKEN_KEY, token);
      }
      setState('requires-auth');
      return;
    }

    let cancelled = false;
    setState('processing');

    acceptInvite(token)
      .then((noteId) => {
        if (cancelled) return;

        if (!noteId) {
          setState('error');
          setErrorMessage('Não foi possível aceitar o convite. Verifique se ele ainda está válido.');
          return;
        }

        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem(PENDING_INVITE_TOKEN_KEY);
        }

        navigate(`/editor?document=${encodeURIComponent(noteId)}`, { replace: true });
      })
      .catch((error: any) => {
        if (cancelled) return;
        setState('error');
        setErrorMessage(error?.message || 'Falha ao aceitar convite.');
      });

    return () => {
      cancelled = true;
    };
  }, [token, user, loading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md rounded-2xl border border-border/60 bg-card/95 p-6 shadow-xl">
        <h1 className="text-xl font-semibold text-foreground">Aceitar convite</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Convites exigem autenticação e validação do e-mail da conta.
        </p>

        {state === 'loading' && (
          <p className="mt-6 text-sm text-muted-foreground">Validando sessão...</p>
        )}

        {state === 'processing' && (
          <p className="mt-6 text-sm text-muted-foreground">Processando aceite do convite...</p>
        )}

        {state === 'requires-auth' && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-muted-foreground">
              Faça login para concluir o aceite deste convite.
            </p>
            <Link
              to="/auth/login"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Entrar para aceitar
            </Link>
          </div>
        )}

        {state === 'error' && (
          <div className="mt-6 space-y-3">
            <p className="text-sm text-destructive">{errorMessage}</p>
            <Link
              to="/editor"
              className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
            >
              Ir para o editor
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
