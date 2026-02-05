/**
 * Protected Route Component
 *
 * Wraps routes that require authentication.
 * Redirects to login if user is not authenticated.
 *
 * @example
 * ```tsx
 * <ProtectedRoute>
 *   <Dashboard />
 * </ProtectedRoute>
 * ```
 */

import React from 'react'
import { useAuth } from '@obsidian-note-reviewer/security/auth'

export interface ProtectedRouteProps {
  children: React.ReactNode
  /**
   * Fallback to show when not authenticated
   * If not provided, shows a default login prompt
   */
  fallback?: React.ReactNode
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps): React.ReactElement {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    )
  }

  if (!user) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-semibold">Autenticação Necessária</h1>
          <p className="text-muted-foreground">
            Você precisa fazer login para acessar esta página.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
