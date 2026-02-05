/**
 * Dashboard Page
 *
 * Protected page showing user information and dashboard content.
 * Displays user's display name, avatar, and email.
 *
 * @example
 * ```tsx
 * <Route path="/dashboard" element={<DashboardPage />} />
 * ```
 */

import React from 'react'
import { useAuth } from '@obsidian-note-reviewer/security/auth'
import { getAvatarUrl } from '@obsidian-note-reviewer/security/supabase/storage'

/**
 * Get display name from user metadata
 * Falls back to email username if no name is set
 */
function getDisplayName(user: { email?: string | null; user_metadata?: Record<string, unknown> }): string {
  const fullName = user.user_metadata?.full_name as string | undefined
  const displayName = user.user_metadata?.display_name as string | undefined
  const name = user.user_metadata?.name as string | undefined

  return fullName || displayName || name || user.email?.split('@')[0] || 'Usuário'
}

/**
 * Get initial letter from display name for avatar fallback
 */
function getAvatarInitial(displayName: string): string {
  return displayName.charAt(0).toUpperCase()
}

export function DashboardPage(): React.ReactElement {
  const { user } = useAuth()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  const displayName = getDisplayName(user)
  const avatarUrl = getAvatarUrl(user)
  const email = user.email

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Olá, {displayName}!
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo ao seu dashboard.
            </p>
          </div>

          {/* User Info Card */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Seu Perfil</h2>
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={`Avatar de ${displayName}`}
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-2xl font-medium text-primary">
                    {getAvatarInitial(displayName)}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium">{displayName}</p>
                {email && (
                  <p className="text-sm text-muted-foreground">{email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Placeholder for future content */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
            <p className="text-muted-foreground">
              Mais recursos serão adicionados em breve.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
