import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@obsidian-note-reviewer/security/supabase'
import { AuthLayout } from '../components/auth/AuthLayout'

export function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Check if user has a valid reset token
    const checkSession = async () => {
      const { data, error } = await supabase.auth.getUser()

      if (error || !data.user) {
        setError('Link inválido ou expirado. Solicite uma nova recuperação de senha.')
        setIsValidToken(false)
        // Redirect to forgot-password after a delay
        const timer = setTimeout(() => {
          navigate('/auth/forgot-password', { replace: true })
        }, 3000)
        return () => clearTimeout(timer)
      }

      setIsValidToken(true)
    }

    checkSession()
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Client-side validation
    if (password !== confirmPassword) {
      setError('As senhas não coincidem')
      return
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      })

      if (error) throw error

      // Password updated successfully, redirect to login
      navigate('/auth/login', { replace: true })
    } catch (error: any) {
      setError(error.message || 'Erro ao redefinir senha. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Loading state while checking token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="text-muted-foreground">Verificando link...</p>
        </div>
      </div>
    )
  }

  // Invalid token state
  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
            <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Link inválido ou expirado</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          <p className="text-muted-foreground text-sm">Redirecionando...</p>
        </div>
      </div>
    )
  }

  // Valid token - show reset form
  return (
    <AuthLayout
      title="Redefinir senha"
      description="Digite sua nova senha abaixo."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error display */}
        {error && (
          <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            Nova senha
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            placeholder="Mínimo 6 caracteres"
          />
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
            Confirmar nova senha
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
            placeholder="Digite a senha novamente"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !password || !confirmPassword}
          className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Redefinindo...' : 'Redefinir senha'}
        </button>

        <p className="text-center text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate('/auth/login')}
            className="text-primary hover:underline"
          >
            Voltar ao login
          </button>
        </p>
      </form>
    </AuthLayout>
  )
}
