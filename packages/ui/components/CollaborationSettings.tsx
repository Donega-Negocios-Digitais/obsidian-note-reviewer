/**
 * Collaboration Settings Component
 *
 * Allows users to manage collaboration features including:
 * - View and manage collaborators
 * - Invite new collaborators via email
 * - Set permissions (owner, editor, viewer)
 * - Shareable link with permissions
 */

import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@obsidian-note-reviewer/security/auth'
import {
  getDocumentCollaborators,
  inviteCollaborator,
  removeCollaborator,
  deactivateCollaborator,
  reactivateCollaborator,
  type CollaboratorRole,
} from '@obsidian-note-reviewer/collaboration'
import {
  Users,
  UserPlus,
  Mail,
  Check,
  Trash2,
  Eye,
  Edit3,
  Crown,
  Loader2,
  Ban,
  Power,
  AlertCircle,
  Info
} from 'lucide-react'
import { BaseModal } from './BaseModal'

interface Collaborator {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role: CollaboratorRole
  status: 'active' | 'pending' | 'inactive'
  invited_at?: string
}

interface InviteEmailPayload {
  email: string
  role: 'editor' | 'viewer'
  inviterName: string
  documentTitle: string
  inviteUrl: string
}

async function sendInviteEmail(payload: InviteEmailPayload): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  const endpoint = supabaseUrl
    ? `${supabaseUrl}/functions/v1/send-invite-email`
    : 'http://localhost:54321/functions/v1/send-invite-email'

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (supabaseUrl && supabaseAnonKey) {
    headers['Authorization'] = `Bearer ${supabaseAnonKey}`
    headers['apikey'] = supabaseAnonKey
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`Invite email request failed with status ${response.status}`)
  }
}

interface CollaborationSettingsProps {
  documentId?: string
  onCollaboratorsChange?: (collaborators: Collaborator[]) => void
}

type PermissionRole = 'viewer' | 'editor' | 'owner'

export function CollaborationSettings({
  documentId,
  onCollaboratorsChange
}: CollaborationSettingsProps): React.ReactElement {
  const { t } = useTranslation()
  const { user } = useAuth()

  // State
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading, setLoading] = useState(true)
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('viewer')
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null)
  const [editRole, setEditRole] = useState<'viewer' | 'editor'>('viewer')

  // Confirmation modal state
  const [confirmAction, setConfirmAction] = useState<{
    type: 'remove' | 'activate' | 'deactivate'
    collaborator: Collaborator
  } | null>(null)

  // Success toast state
  const [successToast, setSuccessToast] = useState<string | null>(null)

  // Auto-hide success toast after 3 seconds
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successToast])

  // Persistência do modal de convite
  useEffect(() => {
    if (showInviteForm) {
      localStorage.setItem('obsreview-showInviteForm', 'true')
      localStorage.setItem('obsreview-inviteEmail', inviteEmail)
      localStorage.setItem('obsreview-inviteRole', inviteRole)
      localStorage.setItem('obsreview-inviteError', inviteError || '')
    } else {
      localStorage.removeItem('obsreview-showInviteForm')
      localStorage.removeItem('obsreview-inviteEmail')
      localStorage.removeItem('obsreview-inviteRole')
      localStorage.removeItem('obsreview-inviteError')
    }
  }, [showInviteForm, inviteEmail, inviteRole, inviteError])

  // Persistência do modal de edição
  useEffect(() => {
    if (editingCollaborator) {
      localStorage.setItem('obsreview-editingCollaborator', JSON.stringify(editingCollaborator))
      localStorage.setItem('obsreview-editRole', editRole)
    } else {
      localStorage.removeItem('obsreview-editingCollaborator')
      localStorage.removeItem('obsreview-editRole')
    }
  }, [editingCollaborator, editRole])

  // Restaurar estado ao montar
  useEffect(() => {
    const savedShowInvite = localStorage.getItem('obsreview-showInviteForm')
    if (savedShowInvite === 'true') {
      const savedEmail = localStorage.getItem('obsreview-inviteEmail') || ''
      const savedRole = (localStorage.getItem('obsreview-inviteRole') as 'viewer' | 'editor') || 'viewer'
      const savedError = localStorage.getItem('obsreview-inviteError') || null
      setShowInviteForm(true)
      setInviteEmail(savedEmail)
      setInviteRole(savedRole)
      setInviteError(savedError)
    }

    const savedEditing = localStorage.getItem('obsreview-editingCollaborator')
    if (savedEditing) {
      try {
        const collab = JSON.parse(savedEditing) as Collaborator
        const savedRole = (localStorage.getItem('obsreview-editRole') as 'viewer' | 'editor') || 'viewer'
        setEditingCollaborator(collab)
        setEditRole(savedRole)
      } catch {
        localStorage.removeItem('obsreview-editingCollaborator')
        localStorage.removeItem('obsreview-editRole')
      }
    }
  }, [])

  // Load collaborators
  useEffect(() => {
    loadCollaborators()
  }, [documentId])


  const loadCollaborators = async () => {
    if (!documentId) {
      // Mock data for development when no documentId is provided
      setCollaborators([
        {
          id: user?.id || 'owner',
          email: user?.email || 'owner@example.com',
          name: user?.user_metadata?.full_name || 'Você',
          avatar_url: user?.user_metadata?.avatar_url as string | undefined,
          role: 'owner',
          status: 'active',
        },
        {
          id: 'mock-collaborator-1',
          email: 'alexdonega@hotmail.com',
          name: 'Alex Teste',
          role: 'editor',
          status: 'pending',
          invited_at: new Date().toISOString(),
        },
        {
          id: 'mock-collaborator-2',
          email: 'atendimento.doface@gmail.com',
          name: 'Atendimento DoFace',
          role: 'viewer',
          status: 'active',
        },
        {
          id: 'mock-collaborator-3',
          email: 'desativado@example.com',
          name: 'Usuário Desativado',
          role: 'viewer',
          status: 'inactive',
        },
      ])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const apiCollaborators = await getDocumentCollaborators(documentId)

      // Transform API data to component format
      const collaborators: Collaborator[] = apiCollaborators.map((collab) => ({
        id: collab.userId,
        email: collab.user?.email || '',
        name: collab.user?.name,
        avatar_url: collab.user?.avatarUrl,
        role: collab.role,
        status: collab.status,
        invited_at: collab.invitedAt,
      }))

      setCollaborators(collaborators)
    } catch (error) {
      console.error('Failed to load collaborators:', error)
      // Fall back to owner-only list
      setCollaborators([
        {
          id: user?.id || 'owner',
          email: user?.email || 'owner@example.com',
          name: user?.user_metadata?.full_name || 'Você',
          avatar_url: user?.user_metadata?.avatar_url as string | undefined,
          role: 'owner',
          status: 'active',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail.trim()) {
      setInviteError(t('settings.collaboration.email') + ' é obrigatório')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      setInviteError(t('settings.collaboration.email') + ' inválido')
      return
    }

    // Check if user is already a collaborator
    const exists = collaborators.some(c => c.email === inviteEmail)
    if (exists) {
      setInviteError('Este usuário já é um colaborador')
      return
    }

    setInviting(true)
    setInviteError(null)

    try {
      if (!documentId) {
        setInviteError('ID do documento não encontrado')
        setInviting(false)
        return
      }

      const result = await inviteCollaborator(
        documentId,
        inviteEmail,
        inviteRole,
        user?.id || ''
      )

      if (result.success) {
        // Send invite email via edge function (non-blocking).
        sendInviteEmail({
          email: inviteEmail,
          role: inviteRole,
          inviterName: user?.user_metadata?.full_name || user?.email || 'Alguém',
          documentTitle: documentId ? `Documento ${documentId.slice(0, 8)}` : 'Documento',
          inviteUrl: typeof window !== 'undefined' ? window.location.href : '',
        }).catch(err => console.warn('Email invite failed (non-critical):', err))

        // Show success toast and close modal
        setSuccessToast(`Convite enviado para ${inviteEmail}!`)
        setInviteEmail('')
        setShowInviteForm(false)
        // Reload collaborators to show the new one
        await loadCollaborators()
        onCollaboratorsChange?.(collaborators)
      } else {
        setInviteError(result.error || 'Erro ao enviar convite')
      }
    } catch (error: any) {
      setInviteError(error.message || 'Erro ao enviar convite')
    } finally {
      setInviting(false)
    }
  }

  const closeInviteForm = () => {
    setShowInviteForm(false)
    setInviteEmail('')
    setInviteError(null)
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (collaboratorId === user?.id) {
      return // Cannot remove owner
    }

    const collaborator = collaborators.find(c => c.id === collaboratorId)
    if (!collaborator) return

    // Open confirmation modal
    setConfirmAction({ type: 'remove', collaborator })
  }

  const confirmRemoveCollaborator = async () => {
    if (!confirmAction) return

    const { collaborator } = confirmAction

    try {
      if (!documentId) return

      const result = await removeCollaborator(documentId, collaborator.id)

      if (result.success) {
        setCollaborators(collaborators.filter(c => c.id !== collaborator.id))
        onCollaboratorsChange?.(collaborators.filter(c => c.id !== collaborator.id))
      } else {
        console.error('Failed to remove collaborator:', result.error)
      }
    } catch (error) {
      console.error('Failed to remove collaborator:', error)
    } finally {
      setConfirmAction(null)
    }
  }

  const handleToggleStatus = async (collaboratorId: string) => {
    if (!documentId) return

    const collaborator = collaborators.find(c => c.id === collaboratorId)
    if (!collaborator) return

    // Lógica de status:
    // - Pendente -> Ativo (quando usuário aceita o convite - não permitido manualmente)
    // - Ativo -> Inativo (desativação manual)
    // - Inativo -> Ativo (reativação manual)
    if (collaborator.status === 'pending') {
      // Pendente não pode ser ativado manualmente - usuário precisa aceitar o convite
      return
    }

    // Open confirmation modal
    const actionType = collaborator.status === 'active' ? 'deactivate' : 'activate'
    setConfirmAction({ type: actionType, collaborator })
  }

  const confirmToggleStatus = async () => {
    if (!confirmAction || !documentId) return

    const { collaborator, type } = confirmAction

    try {
      let result
      if (type === 'deactivate') {
        // Desativar colaborador
        result = await deactivateCollaborator(documentId, collaborator.id)
      } else {
        // Reativar colaborador
        result = await reactivateCollaborator(documentId, collaborator.id)
      }

      if (result.success) {
        // Atualizar estado local
        setCollaborators(collaborators.map(c => {
          if (c.id === collaborator.id) {
            return {
              ...c,
              status: c.status === 'active' ? 'inactive' : 'active'
            }
          }
          return c
        }))
      } else {
        console.error('Failed to toggle collaborator status:', result.error)
      }
    } catch (error) {
      console.error('Failed to toggle collaborator status:', error)
    } finally {
      setConfirmAction(null)
    }
  }

  const getStatusBadge = (status: 'active' | 'pending' | 'inactive') => {
    switch (status) {
      case 'pending':
        return (
          <span className="text-xs px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center gap-1 whitespace-nowrap">
            ⏳ {t('settings.collaboration.statusPending')}
          </span>
        )
      case 'active':
        return (
          <span className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-1 whitespace-nowrap">
            ✓ {t('settings.collaboration.statusActive')}
          </span>
        )
      case 'inactive':
        return (
          <span className="text-xs px-2 py-0.5 rounded-md bg-gray-500/10 text-gray-600 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap">
            <Ban className="w-3 h-3" />
            {t('settings.collaboration.statusInactive')}
          </span>
        )
    }
  }

  const getActionButton = (collaborator: Collaborator) => {
    // Não mostrar botão de ação para owner ou para pendente (precisa aceitar o convite)
    if (collaborator.id === user?.id || collaborator.role === 'owner' || collaborator.status === 'pending') {
      return null
    }

    const isActive = collaborator.status === 'active'
    return (
      <button
        onClick={() => handleToggleStatus(collaborator.id)}
        className={`p-2 rounded-md transition-colors ${
          isActive
            ? 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            : 'text-green-600 hover:text-green-700 hover:bg-green-500/10'
        }`}
        title={isActive ? t('settings.collaboration.deactivate') : t('settings.collaboration.activate')}
        aria-label={isActive ? t('settings.collaboration.deactivate') : t('settings.collaboration.activate')}
      >
        <Power className="w-4 h-4" />
      </button>
    )
  }

  const handleEditCollaborator = (collaborator: Collaborator) => {
    setEditingCollaborator(collaborator)
    setEditRole(collaborator.role as 'viewer' | 'editor')
  }

  const handleSaveEdit = () => {
    if (!editingCollaborator) return

    setCollaborators(collaborators.map(c => {
      if (c.id === editingCollaborator.id) {
        return {
          ...c,
          role: editRole
        }
      }
      return c
    }))

    setEditingCollaborator(null)
  }

  const closeEditCollaboratorModal = () => {
    setEditingCollaborator(null)
  }

  const closeConfirmModal = () => {
    setConfirmAction(null)
  }


  const getRoleIcon = (role: PermissionRole) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'editor':
        return <Edit3 className="w-4 h-4 text-blue-500" />
      case 'viewer':
        return <Eye className="w-4 h-4 text-gray-500" />
    }
  }

  const getRoleLabel = (role: PermissionRole) => {
    switch (role) {
      case 'owner':
        return t('settings.collaboration.owner')
      case 'editor':
        return t('settings.collaboration.permissionLevels').includes('Permission') ? 'Editor' : t('settings.collaboration.editor')
      case 'viewer':
        return t('settings.collaboration.permissionLevels').includes('Permission') ? 'Viewer' : t('settings.collaboration.viewer')
    }
  }

  const getRoleDescription = (role: PermissionRole) => {
    switch (role) {
      case 'owner':
        return t('settings.collaboration.ownerDesc')
      case 'editor':
        return t('settings.collaboration.editorDesc')
      case 'viewer':
        return t('settings.collaboration.viewerDesc')
    }
  }

  const getAvatar = (collaborator: Collaborator) => {
    if (collaborator.avatar_url) {
      return (
        <img
          src={collaborator.avatar_url}
          alt={collaborator.name || collaborator.email}
          className="w-8 h-8 rounded-full object-cover"
        />
      )
    }
    const initial = (collaborator.name || collaborator.email)?.charAt(0).toUpperCase()
    return (
      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
        <span className="text-sm font-medium text-primary">{initial}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Collaborators Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-medium">{t('settings.collaboration.title')}</h3>
            <span className="text-sm text-muted-foreground">
              ({collaborators.length})
            </span>
          </div>
          <button
            onClick={() => setShowInviteForm(!showInviteForm)}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            {t('settings.collaboration.invite')}
          </button>
        </div>

        {/* Invite Form Modal */}
        {showInviteForm && (
          <BaseModal
            isOpen={showInviteForm}
            onRequestClose={closeInviteForm}
            closeOnBackdropClick={false}
            overlayClassName="z-[70]"
            contentClassName="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            <div>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">
                    {t('settings.collaboration.inviteNew')}
                  </h3>
                </div>
                <button
                  onClick={closeInviteForm}
                  className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors rounded-md"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Error message */}
              {inviteError && (
                <div className="mb-4 p-3 rounded-md bg-destructive/15 text-destructive text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {inviteError}
                </div>
              )}

              {/* Form */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="inviteEmail" className="block text-sm font-medium text-foreground mb-1.5">
                    {t('settings.collaboration.email')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>
                  <input
                    id="inviteEmail"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                    placeholder={t('settings.collaboration.emailPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    {t('settings.collaboration.permission')}
                    <span className="text-red-500 ml-1">*</span>
                  </label>

                  {/* Segmented Control - Permissões */}
                  <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setInviteRole('viewer')}
                      className={`flex flex-col items-center gap-2 py-3 px-4 rounded-lg transition-all ${
                        inviteRole === 'viewer'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card'
                      }`}
                    >
                      <Eye className={`w-5 h-5 ${inviteRole === 'viewer' ? 'text-primary-foreground' : 'text-gray-500'}`} />
                      <span className="text-sm font-medium">{t('settings.collaboration.viewer')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteRole('editor')}
                      className={`flex flex-col items-center gap-2 py-3 px-4 rounded-lg transition-all ${
                        inviteRole === 'editor'
                          ? 'bg-primary text-primary-foreground shadow-md'
                          : 'bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card'
                      }`}
                    >
                      <Edit3 className={`w-5 h-5 ${inviteRole === 'editor' ? 'text-primary-foreground' : 'text-blue-500'}`} />
                      <span className="text-sm font-medium">{t('settings.collaboration.editor')}</span>
                    </button>
                  </div>

                  {/* Descrição da permissão selecionada */}
                  <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                    <p className="text-xs text-muted-foreground flex items-start gap-2">
                      <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {getRoleDescription(inviteRole)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeInviteForm}
                  className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
                >
                  {t('settings.actions.cancel')}
                </button>
                <button
                  onClick={handleInvite}
                  disabled={inviting}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {inviting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {t('settings.collaboration.sending')}
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      {t('settings.collaboration.sendInvite')}
                    </>
                  )}
                </button>
              </div>
            </div>
          </BaseModal>
        )}

        {/* Collaborators List */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : collaborators.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>{t('settings.collaboration.noneYet')}</p>
            <p className="text-sm">{t('settings.collaboration.invitePeople')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                onClick={() => handleEditCollaborator(collaborator)}
                className="bg-card/50 rounded-xl border border-border/50 p-5 transition-all hover:border-primary/30 hover:bg-accent/30 flex flex-col gap-4 cursor-pointer"
              >
                {/* Header: Nome + Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-semibold text-base text-foreground">
                    {collaborator.name || collaborator.email.split('@')[0]}
                  </h4>
                  {getStatusBadge(collaborator.status)}
                </div>

                {/* Descrição: Email */}
                <p className="text-sm text-muted-foreground -mt-2">
                  {collaborator.email}
                </p>

                {/* Role Badge (estilo código) */}
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/50 w-fit font-mono text-xs">
                  {getRoleIcon(collaborator.role)}
                  <span className="text-muted-foreground">{getRoleLabel(collaborator.role)}</span>
                </div>

                {/* Footer: Avatar + Ações */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
                  {/* Avatar */}
                  {collaborator.id === user?.id || collaborator.role === 'owner' ? (
                    <div className="flex items-center gap-2">
                      {getAvatar(collaborator)}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">
                      {collaborator.status === 'pending' && t('settings.collaboration.pending')}
                    </div>
                  )}

                  {/* Botões de ação */}
                  {collaborator.id !== user?.id && collaborator.role !== 'owner' && (
                    <div className="flex items-center gap-1">
                      {getActionButton(collaborator)}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveCollaborator(collaborator.id);
                        }}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                        aria-label={t('settings.collaboration.removeCollaborator')}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Collaborator Modal */}
      {editingCollaborator && (
        <BaseModal
          isOpen={!!editingCollaborator}
          onRequestClose={closeEditCollaboratorModal}
          closeOnBackdropClick={false}
          overlayClassName="z-[70]"
          contentClassName="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{t('settings.collaboration.editCollaborator')}</h3>
              <button
                onClick={closeEditCollaboratorModal}
                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors rounded-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t('common.name')}</label>
                <p className="text-sm text-muted-foreground">{editingCollaborator.name || editingCollaborator.email}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t('common.email')}</label>
                <p className="text-sm text-muted-foreground">{editingCollaborator.email}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">
                  {t('common.permission')}
                </label>

                {/* Segmented Control - Permissões */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-muted/30 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setEditRole('viewer')}
                    className={`flex flex-col items-center gap-2 py-3 px-4 rounded-lg transition-all ${
                      editRole === 'viewer'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card'
                    }`}
                  >
                    <Eye className={`w-5 h-5 ${editRole === 'viewer' ? 'text-primary-foreground' : 'text-gray-500'}`} />
                    <span className="text-sm font-medium">{t('settings.collaboration.viewer')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRole('editor')}
                    className={`flex flex-col items-center gap-2 py-3 px-4 rounded-lg transition-all ${
                      editRole === 'editor'
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'bg-card/50 text-muted-foreground hover:text-foreground hover:bg-card'
                    }`}
                  >
                    <Edit3 className={`w-5 h-5 ${editRole === 'editor' ? 'text-primary-foreground' : 'text-blue-500'}`} />
                    <span className="text-sm font-medium">{t('settings.collaboration.editor')}</span>
                  </button>
                </div>

                {/* Descrição da permissão selecionada */}
                <div className="mt-3 p-3 bg-muted/30 rounded-lg border border-border/50">
                  <p className="text-xs text-muted-foreground flex items-start gap-2">
                    <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {getRoleDescription(editRole)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {t('common.save')}
              </button>
              <button
                onClick={closeEditCollaboratorModal}
                className="flex-1 px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <BaseModal
          isOpen={!!confirmAction}
          onRequestClose={closeConfirmModal}
          closeOnBackdropClick={false}
          overlayClassName="z-[70]"
          contentClassName="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div>
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                confirmAction.type === 'remove'
                  ? 'bg-destructive/10'
                  : confirmAction.type === 'deactivate'
                  ? 'bg-orange-500/10'
                  : 'bg-green-500/10'
              }`}>
                {confirmAction.type === 'remove' ? (
                  <Trash2 className="w-5 h-5 text-destructive" />
                ) : confirmAction.type === 'deactivate' ? (
                  <Power className="w-5 h-5 text-orange-500" />
                ) : (
                  <Power className="w-5 h-5 text-green-500" />
                )}
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                {confirmAction.type === 'remove'
                  ? t('settings.collaboration.removeCollaborator')
                  : confirmAction.type === 'deactivate'
                  ? t('settings.collaboration.deactivate')
                  : t('settings.collaboration.activate')}
              </h3>
            </div>

            {/* Message */}
            <p className="text-sm text-muted-foreground mb-6">
              {confirmAction.type === 'remove'
                ? `${t('annotationPanel.deleteConfirm')} ${confirmAction.collaborator.name || confirmAction.collaborator.email}?`
                : confirmAction.type === 'deactivate'
                ? `${t('settings.collaboration.deactivate')} ${confirmAction.collaborator.name || confirmAction.collaborator.email}?`
                : `${t('settings.collaboration.activate')} ${confirmAction.collaborator.name || confirmAction.collaborator.email}?`
              }
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={closeConfirmModal}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
              >
                {t('settings.actions.cancel')}
              </button>
              <button
                onClick={confirmAction.type === 'remove' ? confirmRemoveCollaborator : confirmToggleStatus}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${
                  confirmAction.type === 'remove'
                    ? 'bg-destructive hover:bg-destructive/90'
                    : confirmAction.type === 'deactivate'
                    ? 'bg-orange-500 hover:bg-orange-600'
                    : 'bg-green-500 hover:bg-green-600'
                }`}
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-4 right-4 z-[80] bg-green-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
          <Check className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{successToast}</p>
        </div>
      )}
    </div>
  )
}
