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

  // Modal state for adding new hook
  const [showAddHookModal, setShowAddHookModal] = useState(false)
  const [newHook, setNewHook] = useState({
    name: '',
    description: '',
    trigger: '',
  })

  const toggleHook = (id: string) => {
    setHooks(hooks.map(hook =>
      hook.id === id ? { ...hook, enabled: !hook.enabled } : hook
    ))
  }

  const addHook = () => {
    if (newHook.name && newHook.description && newHook.trigger) {
      const hook: Hook = {
        id: `custom-${Date.now()}`,
        name: newHook.name,
        description: newHook.description,
        trigger: newHook.trigger,
        enabled: true,
      }
      setHooks([...hooks, hook])
      setNewHook({ name: '', description: '', trigger: '' })
      setShowAddHookModal(false)
    }
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
            <div className="mb-4">
              <h2 className="text-lg font-semibold">Hooks</h2>
              <p className="text-sm text-muted-foreground">
                Configure quais ações disparam o Note Reviewer automaticamente
              </p>
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

              {/* + Hook Button - positioned after the last card */}
              <button
                onClick={() => setShowAddHookModal(true)}
                className="w-full p-4 rounded-lg border-2 border-dashed border-border/50
                           bg-muted/20 hover:bg-primary/10 hover:border-primary/50
                           text-muted-foreground hover:text-primary
                           transition-all duration-200
                           flex items-center justify-center gap-2 group
                           cursor-pointer hover:shadow-md"
              >
                <span className="text-2xl font-light transition-transform group-hover:scale-110">+</span>
                <span className="text-sm font-medium">Adicionar Hook</span>
              </button>
            </div>
          </div>

          {/* Add Hook Modal */}
          {showAddHookModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
              <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Cadastrar Novo Hook</h3>
                  <button
                    onClick={() => setShowAddHookModal(false)}
                    className="p-1 text-destructive hover:text-destructive/80 rounded-md transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1.5">Nome do Hook</label>
                    <input
                      type="text"
                      value={newHook.name}
                      onChange={(e) => setNewHook({ ...newHook, name: e.target.value })}
                      placeholder="Ex: Meu Hook Personalizado"
                      className="w-full p-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Descrição</label>
                    <textarea
                      value={newHook.description}
                      onChange={(e) => setNewHook({ ...newHook, description: e.target.value })}
                      placeholder="Descreva quando este hook deve ser ativado..."
                      rows={3}
                      className="w-full p-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1.5">Trigger (comando)</label>
                    <input
                      type="text"
                      value={newHook.trigger}
                      onChange={(e) => setNewHook({ ...newHook, trigger: e.target.value })}
                      placeholder="Ex: /meu-comando"
                      className="w-full p-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowAddHookModal(false)
                      setNewHook({ name: '', description: '', trigger: '' })
                    }}
                    className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={addHook}
                    disabled={!newHook.name || !newHook.description || !newHook.trigger}
                    className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Adicionar Hook
                  </button>
                </div>
              </div>
            </div>
          )}

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
