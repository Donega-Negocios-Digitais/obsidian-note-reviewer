import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@obsidian-note-reviewer/security/auth'

/**
 * OAuth Callback Handler
 *
 * This component handles the OAuth callback from Supabase.
 * Supabase automatically detects the session in the URL and updates the auth state.
 * We just need to listen for the state change and redirect.
 */
export function CallbackHandler() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // If not loading and user is authenticated, redirect to dashboard
    if (!loading && user) {
      navigate('/dashboard')
    }
    // If not loading and no user, redirect to login (OAuth failed or was cancelled)
    else if (!loading && !user) {
      navigate('/auth/login')
    }
  }, [loading, user, navigate])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        <p className="text-muted-foreground">Autenticando...</p>
      </div>
    </div>
  )
}
