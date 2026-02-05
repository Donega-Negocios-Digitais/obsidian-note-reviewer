import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@obsidian-note-reviewer/security/auth'

/**
 * OAuth Callback Handler
 *
 * This component handles the OAuth callback from Supabase.
 * Supabase automatically detects the session in the URL (PKCE flow) and updates the auth state.
 *
 * Redirect behavior:
 * - New users (created_at == now) → /welcome
 * - Returning users → /dashboard
 * - OAuth failed/cancelled → /auth/login
 */
export function CallbackHandler() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  // Get redirect target from URL params (for flexibility)
  const next = searchParams.get('next') ?? null
  const redirectTo = searchParams.get('redirectTo') ?? next

  useEffect(() => {
    // Check for OAuth errors in URL
    const error_code = searchParams.get('error')
    const error_description = searchParams.get('error_description')

    if (error_code) {
      setError(error_description || error_code)
      // Redirect to login with error after a short delay
      const timer = setTimeout(() => {
        navigate('/auth/login', { replace: true })
      }, 3000)
      return () => clearTimeout(timer)
    }

    // If not loading and user is authenticated, determine redirect
    if (!loading && user) {
      // Check if user is new (created within last 30 seconds)
      const createdAt = new Date(user.created_at)
      const now = new Date()
      const isNewUser = (now.getTime() - createdAt.getTime()) < 30000 // 30 seconds

      // New users go to welcome, returning users to dashboard
      // Unless a specific redirect was requested
      const targetPath = redirectTo || (isNewUser ? '/welcome' : '/dashboard')
      navigate(targetPath, { replace: true })
    }
    // If not loading and no user after a delay, redirect to login (OAuth failed or was cancelled)
    else if (!loading && !user) {
      const timer = setTimeout(() => {
        navigate('/auth/login', { replace: true })
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [loading, user, navigate, redirectTo, searchParams])

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
            <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Erro na autenticação</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          <p className="text-muted-foreground text-sm">Redirecionando para o login...</p>
        </div>
      </div>
    )
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        <p className="text-muted-foreground">Autenticando...</p>
      </div>
    </div>
  )
}
