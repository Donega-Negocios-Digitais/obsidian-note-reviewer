/**
 * Dashboard Page
 *
 * TEMPORARILY DISABLED AUTH - shows mock data
 */

import React from 'react'

export function DashboardPage(): React.ReactElement {
  // Mock user data for development
  const displayName = 'Desenvolvedor'
  const email = 'dev@example.com'

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
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-2xl font-medium text-primary">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="font-medium">{displayName}</p>
                <p className="text-sm text-muted-foreground">{email}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/editor"
                className="p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <h3 className="font-semibold mb-1">Editor de Notas</h3>
                <p className="text-sm text-muted-foreground">Crie e edite notas markdown</p>
              </a>
              <a
                href="/settings"
                className="p-4 rounded-lg border hover:bg-muted transition-colors"
              >
                <h3 className="font-semibold mb-1">Configurações</h3>
                <p className="text-sm text-muted-foreground">Personalize o sistema</p>
              </a>
            </div>
          </div>

          {/* Status */}
          <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
            <h2 className="text-lg font-semibold mb-2">Modo Desenvolvimento</h2>
            <p className="text-sm text-muted-foreground">
              Autenticação temporariamente desativada. Configure o Supabase para ativar login/registro.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPage
