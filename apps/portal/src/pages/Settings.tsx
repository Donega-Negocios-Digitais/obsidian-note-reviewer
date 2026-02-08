/**
 * Settings Page
 *
 * TEMPORARILY DISABLED AUTH - shows mock settings
 */

import React, { useState } from 'react'

interface Hook {
  id: string
  name: string
  description: string
  trigger: string
  enabled: boolean
}

export function SettingsPage(): React.ReactElement {
  const [theme, setTheme] = useState('dark')
  const [vaultPath, setVaultPath] = useState('C:\\Users\\Alex\\ObsidianVault')

  // Hooks configuration
  const [hooks, setHooks] = useState<Hook[]>([
    {
      id: 'plan-mode',
      name: 'Plan Mode',
      description: 'Ativa automaticamente o Note Reviewer quando o Claude Code entra em modo de planejamento',
      trigger: '/plan',
      enabled: true,
    },
    {
      id: 'obsidian-note',
      name: 'Criar Nota Obsidian',
      description: 'Abre o Note Reviewer quando você usa a skill para criar notas no Obsidian',
      trigger: 'nota-obsidian',
      enabled: true,
    },
  ])

  const toggleHook = (id: string) => {
    setHooks(hooks.map(hook =>
      hook.id === id ? { ...hook, enabled: !hook.enabled } : hook
    ))
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Configurações
            </h1>
            <p className="text-muted-foreground">
              Personalize sua experiência
            </p>
          </div>

          {/* Appearance */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Aparência</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tema</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full p-2 rounded-lg border bg-background"
                >
                  <option value="dark">Escuro</option>
                  <option value="light">Claro</option>
                  <option value="system">Sistema</option>
                </select>
              </div>
            </div>
          </div>

          {/* Hooks Configuration */}
          <div className="bg-card p-6 rounded-lg border">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Hooks</h2>
                <p className="text-sm text-muted-foreground">
                  Configure quais ações disparam o Note Reviewer automaticamente
                </p>
              </div>
              <button className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-lg hover:bg-primary/20 transition-colors">
                + Adicionar Hook
              </button>
            </div>

            <div className="space-y-3">
              {hooks.map((hook) => (
                <div
                  key={hook.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    hook.enabled
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-border/50 bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{hook.name}</h3>
                        {hook.enabled && (
                          <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-600 dark:text-green-400 rounded-full">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {hook.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-muted rounded-md font-mono">
                          Trigger: {hook.trigger}
                        </span>
                      </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleHook(hook.id)}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        hook.enabled ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                          hook.enabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              ))}

              {/* Empty state / Add new hook hint */}
              <div className="p-4 rounded-lg border border-dashed border-border/50 text-center">
                <p className="text-sm text-muted-foreground">
                  Mais hooks serão adicionados em breve
                </p>
              </div>
            </div>
          </div>

          {/* Obsidian Settings */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Obsidian</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Caminho do Vault</label>
                <input
                  type="text"
                  value={vaultPath}
                  onChange={(e) => setVaultPath(e.target.value)}
                  className="w-full p-2 rounded-lg border bg-background"
                  placeholder="C:\Users\SeuUsuario\ObsidianVault"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Caminho onde suas notas do Obsidian estão salvas
                </p>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-card p-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Sobre</h2>
            <div className="space-y-2 text-sm">
              <p><strong>Produto:</strong> Obsidian Note Reviewer</p>
              <p><strong>Versão:</strong> 0.2.1</p>
              <p><strong>Licença:</strong> BSL-1.1</p>
              <p className="text-muted-foreground mt-4">
                Desenvolvido por Alex Donega
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="bg-primary/10 p-6 rounded-lg border border-primary/20">
            <h2 className="text-lg font-semibold mb-2">Modo Desenvolvimento</h2>
            <p className="text-sm text-muted-foreground">
              As configurações são apenas visuais. Configure o Supabase para persistir dados.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsPage
