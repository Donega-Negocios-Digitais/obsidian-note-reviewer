import React, { useState } from 'react';
import { useOptionalAuth } from '@obsidian-note-reviewer/security/auth';

interface HookAuthGateProps {
  missingSupabaseConfig?: boolean;
}

export const HookAuthGate: React.FC<HookAuthGateProps> = ({
  missingSupabaseConfig = false,
}) => {
  const auth = useOptionalAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (missingSupabaseConfig) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold mb-2">Configuração de login ausente</h1>
          <p className="text-sm text-muted-foreground mb-3">
            O modo Hook está configurado para exigir usuário autenticado.
          </p>
          <p className="text-sm text-muted-foreground mb-2">
            Configure as variáveis abaixo e gere o build novamente:
          </p>
          <ul className="text-sm font-mono bg-muted/40 rounded-md p-3 space-y-1">
            <li>VITE_SUPABASE_URL</li>
            <li>VITE_SUPABASE_ANON_KEY</li>
          </ul>
        </div>
      </div>
    );
  }

  if (!auth) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
        <div className="max-w-xl w-full rounded-xl border border-border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold mb-2">Autenticação indisponível</h1>
          <p className="text-sm text-muted-foreground">
            O AuthProvider não foi inicializado no runtime atual.
          </p>
        </div>
      </div>
    );
  }

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;

    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedName = displayName.trim();

    if (!trimmedEmail || !trimmedPassword) {
      setError('Informe e-mail e senha para continuar.');
      return;
    }

    setSubmitting(true);
    try {
      if (mode === 'signup') {
        await auth.signUpWithEmail({
          email: trimmedEmail,
          password: trimmedPassword,
          displayName: trimmedName || trimmedEmail.split('@')[0] || 'Usuário',
        });
        setInfo('Conta criada. Se necessário, confirme o e-mail e depois faça login.');
        setMode('signin');
      } else {
        await auth.signInWithEmail(trimmedEmail, trimmedPassword);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Falha ao autenticar.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-lg font-semibold mb-2">Entre para revisar e salvar</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Para usar o fluxo do Hook e salvar notas na sua conta, faça login.
        </p>

        <form onSubmit={submit} className="space-y-3">
          {mode === 'signup' && (
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground" htmlFor="hook-auth-name">
                Nome
              </label>
              <input
                id="hook-auth-name"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="hook-auth-email">
              E-mail
            </label>
            <input
              id="hook-auth-email"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@empresa.com"
              autoComplete="email"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground" htmlFor="hook-auth-password">
              Senha
            </label>
            <input
              id="hook-auth-password"
              type="password"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}

          {info && (
            <p className="text-xs text-emerald-600">{info}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-primary text-primary-foreground py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting
              ? 'Processando...'
              : mode === 'signup'
                ? 'Criar conta'
                : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 text-xs text-muted-foreground">
          {mode === 'signin' ? 'Não tem conta?' : 'Já possui conta?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError(null);
              setInfo(null);
            }}
            className="text-primary font-medium hover:underline"
          >
            {mode === 'signin' ? 'Criar agora' : 'Fazer login'}
          </button>
        </div>
      </div>
    </div>
  );
};

