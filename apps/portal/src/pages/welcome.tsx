/**
 * Welcome/Onboarding Page
 *
 * Shown to users after first signup.
 * Checks if user already completed onboarding and redirects returning users to dashboard.
 * Displays personalized greeting with profile completion form.
 */

import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@obsidian-note-reviewer/security/auth'
import { ProfileForm } from '../components/auth/ProfileForm'

export function WelcomePage() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      navigate('/auth/login', { replace: true })
      return
    }

    // Check if user already completed onboarding
    // If user has full_name in metadata, they've been here before
    if (!loading && user?.user_metadata?.full_name) {
      console.log('🔍 [Welcome] Usuário com full_name, redirecionando para /editor')
      // Redirect to editor to avoid repeated onboarding
      navigate('/editor', { replace: true })
    }
  }, [user, loading, navigate])

  // Show loading while checking auth state
  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  // Extract display name for personalized greeting
  // Priority: full_name > name > email prefix > fallback
  const displayName = user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split('@')[0]
    || 'aí'

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md space-y-8">
        {/* Hero Section with personalized greeting */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight">
            Bem-vindo{displayName !== 'aí' ? `, ${displayName}` : ''}!
          </h1>
          <p className="text-lg text-muted-foreground">
            Vamos configurar seu perfil para começar.
          </p>
        </div>

        {/* Profile Form */}
        <div className="bg-card p-6 rounded-lg border shadow-sm">
          <ProfileForm
            onComplete={() => navigate('/editor', { replace: true })}
          />
        </div>

        {/* Value Proposition */}
        <div className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Com o Obsidian Note Reviewer você pode:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Revisar visualmente suas notas markdown</li>
            <li>• Colaborar em tempo real com sua equipe</li>
            <li>• Integrar perfeitamente com o Claude Code</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
