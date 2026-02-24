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
  getCurrentUserRole,
  inviteCollaborator,
  removeCollaborator,
  deactivateCollaborator,
  reactivateCollaborator,
  updateCollaboratorRole,
  updateCollaboratorCapability,
  type CollaboratorCapability,
  type CollaboratorCapabilities,
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
  capabilities: CollaboratorCapabilities
  invited_at?: string
}

const DEFAULT_CAPABILITIES: CollaboratorCapabilities = {
  hooks: false,
  integrations: false,
  automations: false,
  invite: false,
  manage_permissions: false,
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
  const [inviteRole, setInviteRole] = useState<'viewer' | 'editor'>('editor')
  const [inviteCapabilities, setInviteCapabilities] = useState<CollaboratorCapabilities>(DEFAULT_CAPABILITIES)
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null)
  const [editRole, setEditRole] = useState<'viewer' | 'editor'>('viewer')
  const [editCapabilities, setEditCapabilities] = useState<CollaboratorCapabilities>(DEFAULT_CAPABILITIES)

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
      localStorage.setItem('obsreview-inviteCapabilities', JSON.stringify(inviteCapabilities))
      localStorage.setItem('obsreview-inviteError', inviteError || '')
    } else {
      localStorage.removeItem('obsreview-showInviteForm')
      localStorage.removeItem('obsreview-inviteEmail')
      localStorage.removeItem('obsreview-inviteRole')
      localStorage.removeItem('obsreview-inviteCapabilities')
      localStorage.removeItem('obsreview-inviteError')
    }
  }, [showInviteForm, inviteEmail, inviteRole, inviteCapabilities, inviteError])

  // Persistência do modal de edição
  useEffect(() => {
    if (editingCollaborator) {
      localStorage.setItem('obsreview-editingCollaborator', JSON.stringify(editingCollaborator))
      localStorage.setItem('obsreview-editRole', editRole)
      localStorage.setItem('obsreview-editCapabilities', JSON.stringify(editCapabilities))
    } else {
      localStorage.removeItem('obsreview-editingCollaborator')
      localStorage.removeItem('obsreview-editRole')
      localStorage.removeItem('obsreview-editCapabilities')
    }
  }, [editingCollaborator, editRole, editCapabilities])

  // Restaurar estado ao montar
  useEffect(() => {
    const savedShowInvite = localStorage.getItem('obsreview-showInviteForm')
    if (savedShowInvite === 'true') {
      const savedEmail = localStorage.getItem('obsreview-inviteEmail') || ''
      const savedRole = (localStorage.getItem('obsreview-inviteRole') as 'viewer' | 'editor') || 'editor'
      const savedCapabilitiesRaw = localStorage.getItem('obsreview-inviteCapabilities')
      const savedCapabilities = savedCapabilitiesRaw
        ? { ...DEFAULT_CAPABILITIES, ...(JSON.parse(savedCapabilitiesRaw) as Partial<CollaboratorCapabilities>) }
        : DEFAULT_CAPABILITIES
      const savedError = localStorage.getItem('obsreview-inviteError') || null
      setShowInviteForm(true)
      setInviteEmail(savedEmail)
      setInviteRole(savedRole)
      setInviteCapabilities(savedCapabilities)
      setInviteError(savedError)
    }

    const savedEditing = localStorage.getItem('obsreview-editingCollaborator')
    if (savedEditing) {
      try {
        const collab = JSON.parse(savedEditing) as Collaborator
        const hydratedCollaborator: Collaborator = {
          ...collab,
          capabilities: collab.capabilities || DEFAULT_CAPABILITIES,
        }
        const savedRole = (localStorage.getItem('obsreview-editRole') as 'viewer' | 'editor') || 'viewer'
        const savedCapabilitiesRaw = localStorage.getItem('obsreview-editCapabilities')
        const savedCapabilities = savedCapabilitiesRaw
          ? { ...DEFAULT_CAPABILITIES, ...(JSON.parse(savedCapabilitiesRaw) as Partial<CollaboratorCapabilities>) }
          : DEFAULT_CAPABILITIES
        setEditingCollaborator(hydratedCollaborator)
        setEditRole(savedRole)
        setEditCapabilities(savedCapabilities)
      } catch {
        localStorage.removeItem('obsreview-editingCollaborator')
        localStorage.removeItem('obsreview-editRole')
        localStorage.removeItem('obsreview-editCapabilities')
      }
    }
  }, [])

  // Load collaborators
  useEffect(() => {
    loadCollaborators()
  }, [documentId])

  // Sync capabilities when role changes to viewer
  useEffect(() => {
    if (inviteRole === 'viewer') {
      setInviteCapabilities(DEFAULT_CAPABILITIES)
    }
  }, [inviteRole])


  const loadCollaborators = async () => {
    const ownerOnly: Collaborator[] = user ? [
      {
        id: user.id,
        email: user.email || 'owner@example.com',
        name: (user.user_metadata?.full_name as string | undefined) || 'Você',
        avatar_url: user.user_metadata?.avatar_url as string | undefined,
        role: 'owner',
        status: 'active',
        capabilities: {
          hooks: true,
          integrations: true,
          automations: true,
          invite: true,
          manage_permissions: true,
        },
      },
    ] : []

    if (!documentId) {
      setCollaborators(ownerOnly)
      onCollaboratorsChange?.(ownerOnly)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const [apiCollaborators, currentRole] = await Promise.all([
        getDocumentCollaborators(documentId),
        getCurrentUserRole(documentId),
      ])

      const nextCollaborators: Collaborator[] = apiCollaborators.map((collab) => ({
        id: collab.userId,
        email: collab.user?.email || '',
        name: collab.user?.name,
        avatar_url: collab.user?.avatarUrl,
        role: collab.role,
        status: collab.status,
        invited_at: collab.invitedAt,
        capabilities: collab.capabilities || DEFAULT_CAPABILITIES,
      }))

      const hasCurrentUser = user?.id
        ? nextCollaborators.some((collab) => collab.id === user.id)
        : false

      if (user?.id && !hasCurrentUser && currentRole !== 'none') {
        nextCollaborators.unshift({
          id: user.id,
          email: user.email || 'owner@example.com',
          name: (user.user_metadata?.full_name as string | undefined) || 'Você',
          avatar_url: user.user_metadata?.avatar_url as string | undefined,
          role: currentRole,
          status: 'active',
          capabilities: currentRole === 'owner'
            ? {
              hooks: true,
              integrations: true,
              automations: true,
              invite: true,
              manage_permissions: true,
            }
            : DEFAULT_CAPABILITIES,
        })
      }

      const resolvedCollaborators = nextCollaborators.length > 0 ? nextCollaborators : ownerOnly
      setCollaborators(resolvedCollaborators)
      onCollaboratorsChange?.(resolvedCollaborators)
    } catch (error) {
      console.error('Failed to load collaborators:', error)
      setCollaborators(ownerOnly)
      onCollaboratorsChange?.(ownerOnly)
    } finally {
      setLoading(false)
    }
  }

  const parseInviteEmails = (rawValue: string): string[] => {
    return rawValue
      .split(/[\n,;]+/)
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
  }

  const dedupeInviteEmails = (emails: string[]): string[] => {
    const seen = new Set<string>()
    const unique: string[] = []
    for (const email of emails) {
      const normalized = email.toLowerCase()
      if (seen.has(normalized)) continue
      seen.add(normalized)
      unique.push(email)
    }
    return unique
  }

  const handleInvite = async () => {
    const parsedEmails = dedupeInviteEmails(parseInviteEmails(inviteEmail))
    if (parsedEmails.length === 0) {
      setInviteError(`${t('settings.collaboration.email')} é obrigatório`)
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const invalidEmails = parsedEmails.filter((email) => !emailRegex.test(email))
    if (invalidEmails.length > 0) {
      const preview = invalidEmails.slice(0, 3).join(', ')
      const suffix = invalidEmails.length > 3 ? ` +${invalidEmails.length - 3}` : ''
      setInviteError(`Emails inválidos: ${preview}${suffix}`)
      return
    }

    const collaboratorEmails = new Set(collaborators.map((c) => c.email.trim().toLowerCase()))
    const existingEmails = parsedEmails.filter((email) => collaboratorEmails.has(email.toLowerCase()))
    const emailsToInvite = parsedEmails.filter((email) => !collaboratorEmails.has(email.toLowerCase()))

    if (emailsToInvite.length === 0) {
      setInviteError('Todos os emails informados já são colaboradores.')
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

      const successfulEmails: string[] = []
      const failedInvites: Array<{ email: string; reason: string }> = []

      for (const emailToInvite of emailsToInvite) {
        const result = await inviteCollaborator(
          documentId,
          emailToInvite,
          inviteRole,
          inviteCapabilities,
        )

        if (result.success) {
          successfulEmails.push(emailToInvite)

          const inviteUrl = result.token && typeof window !== 'undefined'
            ? `${window.location.origin}/invites/accept?token=${encodeURIComponent(result.token)}`
            : (typeof window !== 'undefined' ? window.location.href : '')

          // Send invite email via edge function (non-blocking).
          sendInviteEmail({
            email: emailToInvite,
            role: inviteRole,
            inviterName: user?.user_metadata?.full_name || user?.email || 'Alguém',
            documentTitle: documentId ? `Documento ${documentId.slice(0, 8)}` : 'Documento',
            inviteUrl,
          }).catch(err => console.warn('Email invite failed (non-critical):', err))
        } else {
          failedInvites.push({
            email: emailToInvite,
            reason: result.error || 'Erro ao enviar convite',
          })
        }
      }

      if (successfulEmails.length > 0) {
        setSuccessToast(
          successfulEmails.length === 1
            ? `Convite enviado para ${successfulEmails[0]}!`
            : `${successfulEmails.length} convites enviados com sucesso!`,
        )
        await loadCollaborators()
      }

      if (failedInvites.length === 0 && existingEmails.length === 0) {
        setInviteEmail('')
        setShowInviteForm(false)
      } else if (failedInvites.length > 0) {
        const preview = failedInvites
          .slice(0, 3)
          .map((invite) => `${invite.email} (${invite.reason})`)
          .join(', ')
        const suffix = failedInvites.length > 3 ? ` +${failedInvites.length - 3}` : ''
        setInviteError(`Falha em ${failedInvites.length} convite(s): ${preview}${suffix}`)

        const remainingEmails = failedInvites.map((invite) => invite.email)
        setInviteEmail(remainingEmails.join('\n'))
      }

      if (existingEmails.length > 0) {
        const preview = existingEmails.slice(0, 3).join(', ')
        const suffix = existingEmails.length > 3 ? ` +${existingEmails.length - 3}` : ''
        setInviteError((current) => {
          const base = current ? `${current} ` : ''
          return `${base}Já colaboradores: ${preview}${suffix}`.trim()
        })
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
    setInviteRole('editor')
    setInviteCapabilities(DEFAULT_CAPABILITIES)
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
        const updated = collaborators.filter(c => c.id !== collaborator.id)
        setCollaborators(updated)
        onCollaboratorsChange?.(updated)
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
        const updated = collaborators.map(c => {
          if (c.id === collaborator.id) {
            return {
              ...c,
              status: c.status === 'active' ? 'inactive' : 'active'
            }
          }
          return c
        })
        setCollaborators(updated)
        onCollaboratorsChange?.(updated)
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
        className={`rounded-md p-1.5 transition-colors ${
          isActive
            ? 'text-muted-foreground hover:text-orange-500 hover:bg-orange-500/10'
            : 'text-green-500 bg-green-500/10 hover:text-green-600 hover:bg-green-500/20'
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
    setEditCapabilities(collaborator.capabilities || DEFAULT_CAPABILITIES)
  }

  const handleSaveEdit = async () => {
    if (!editingCollaborator || !documentId) return

    const previous = collaborators.find((c) => c.id === editingCollaborator.id)
    if (!previous) return

    const roleChanged = previous.role !== editRole

    if (roleChanged) {
      const roleResult = await updateCollaboratorRole(documentId, editingCollaborator.id, editRole)
      if (!roleResult.success) {
        setInviteError(roleResult.error || 'Erro ao salvar permissões do colaborador')
        return
      }
    }

    const capabilityKeys: CollaboratorCapability[] = ['hooks', 'integrations', 'automations', 'invite', 'manage_permissions']
    for (const capability of capabilityKeys) {
      const previousValue = previous.capabilities?.[capability] === true
      const nextValue = editCapabilities?.[capability] === true
      if (previousValue === nextValue) continue

      const capabilityResult = await updateCollaboratorCapability(
        documentId,
        editingCollaborator.id,
        capability,
        nextValue,
      )

      if (!capabilityResult.success) {
        setInviteError(capabilityResult.error || 'Erro ao salvar capabilities do colaborador')
        return
      }
    }

    const updatedCollaborators = collaborators.map(c => {
      if (c.id === editingCollaborator.id) {
        return {
          ...c,
          role: editRole,
          capabilities: { ...editCapabilities },
        }
      }
      return c
    })

    setCollaborators(updatedCollaborators)
    onCollaboratorsChange?.(updatedCollaborators)
    setEditingCollaborator(null)
  }

  const closeEditCollaboratorModal = () => {
    setEditingCollaborator(null)
    setEditCapabilities(DEFAULT_CAPABILITIES)
  }

  const closeConfirmModal = () => {
    setConfirmAction(null)
  }

  const capabilityOptions: Array<{ key: CollaboratorCapability; label: string; description: string }> = [
    { key: 'hooks', label: 'Hooks', description: 'Pode configurar hooks deste documento' },
    { key: 'integrations', label: 'Integrações', description: 'Pode configurar integrações deste documento' },
    { key: 'automations', label: 'Automações', description: 'Pode configurar automações deste documento' },
    { key: 'invite', label: 'Convites', description: 'Pode convidar novos colaboradores' },
    { key: 'manage_permissions', label: 'Permissões', description: 'Pode alterar papéis e capabilities' },
  ]

  const toggleEditCapability = (capability: CollaboratorCapability) => {
    setEditCapabilities((prev) => ({
      ...prev,
      [capability]: !prev[capability],
    }))
  }

  const toggleInviteCapability = (capability: CollaboratorCapability) => {
    setInviteCapabilities((prev) => ({
      ...prev,
      [capability]: !prev[capability],
    }))
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

  const getAvatar = (collaborator: Collaborator, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10'
    const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-lg' : 'text-sm'
    if (collaborator.avatar_url) {
      return (
        <img
          src={collaborator.avatar_url}
          alt={collaborator.name || collaborator.email}
          className={`${sizeClasses} rounded-full object-cover ring-2 ring-border/30`}
        />
      )
    }
    const initial = (collaborator.name || collaborator.email)?.charAt(0).toUpperCase()
    return (
      <div className={`${sizeClasses} rounded-full bg-primary/15 flex items-center justify-center ring-2 ring-primary/20`}>
        <span className={`${textSize} font-semibold text-primary`}>{initial}</span>
      </div>
    )
  }

  const getStatusAccentColor = (status: 'active' | 'pending' | 'inactive') => {
    switch (status) {
      case 'active': return 'bg-green-500'
      case 'pending': return 'bg-yellow-500'
      case 'inactive': return 'bg-gray-400 dark:bg-gray-600'
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">{t('settings.collaboration.title')}</h3>
            <p className="text-xs text-muted-foreground">
              {collaborators.length} {collaborators.length === 1 ? 'membro' : 'membros'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          disabled={!documentId}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          title={!documentId ? 'Selecione um documento para convidar colaboradores' : t('settings.collaboration.invite')}
        >
          <UserPlus className="w-4 h-4" />
          {t('settings.collaboration.invite')}
        </button>
      </div>

      {!documentId && (
        <div className="rounded-xl bg-muted/30 p-4 text-sm text-muted-foreground flex items-center gap-3">
          <Info className="w-5 h-5 text-muted-foreground/60 flex-shrink-0" />
          Selecione um documento ativo para convidar colaboradores.
        </div>
      )}

      <div className="space-y-4">

        {/* Invite Form Modal */}
        {showInviteForm && (
          <BaseModal
            isOpen={showInviteForm}
            onRequestClose={closeInviteForm}
            closeOnBackdropClick={false}
            overlayClassName="z-[70]"
            contentClassName="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex flex-col max-h-[90vh]">
              {/* Header with gradient - matching edit modal */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Novo Colaborador
                  </h3>
                  <button
                    onClick={closeInviteForm}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors rounded-lg"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center ring-2 ring-primary/20">
                    <UserPlus className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">
                      {t('settings.collaboration.inviteNew')}
                    </p>
                    <p className="text-sm text-muted-foreground">Envie um convite por e-mail</p>
                  </div>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                {/* Error message */}
                {inviteError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {inviteError}
                  </div>
                )}

                {/* Email */}
                <div>
                  <label htmlFor="inviteEmail" className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                    {t('settings.collaboration.email')}
                  </label>
                  <textarea
                    id="inviteEmail"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full min-h-[96px] p-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm resize-y"
                    placeholder={`${t('settings.collaboration.emailPlaceholder')}\nuser2@example.com`}
                  />
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Separe múltiplos emails com vírgula, ponto e vírgula ou quebra de linha.
                  </p>
                </div>

                {/* Role - matching edit modal style */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                    Papel
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setInviteRole('viewer')}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        inviteRole === 'viewer'
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/50 hover:border-border hover:bg-muted/30'
                      }`}
                    >
                      <Eye className={`w-5 h-5 flex-shrink-0 ${inviteRole === 'viewer' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${inviteRole === 'viewer' ? 'text-primary' : 'text-foreground'}`}>
                          {t('settings.collaboration.viewer')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Somente leitura</p>
                      </div>
                      {inviteRole === 'viewer' && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setInviteRole('editor')}
                      className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                        inviteRole === 'editor'
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border/50 hover:border-border hover:bg-muted/30'
                      }`}
                    >
                      <Edit3 className={`w-5 h-5 flex-shrink-0 ${inviteRole === 'editor' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${inviteRole === 'editor' ? 'text-primary' : 'text-foreground'}`}>
                          {t('settings.collaboration.editor')}
                        </p>
                        <p className="text-[10px] text-muted-foreground">Leitura e escrita</p>
                      </div>
                      {inviteRole === 'editor' && (
                        <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  </div>
                  <div className="mt-3 p-3 bg-muted/20 rounded-xl">
                    <p className="text-[11px] text-muted-foreground flex items-start gap-2">
                      <Info className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {getRoleDescription(inviteRole)}
                    </p>
                  </div>
                </div>

                {/* Capabilities Section with Toggle Switches - same as edit modal */}
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                    Permissões
                  </label>
                  <div className="space-y-1">
                    {capabilityOptions.map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => toggleInviteCapability(option.key)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors group/cap"
                      >
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium text-foreground">{option.label}</p>
                          <p className="text-[11px] text-muted-foreground leading-tight">{option.description}</p>
                        </div>
                        {/* Toggle switch visual */}
                        <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                          inviteCapabilities[option.key]
                            ? 'bg-primary'
                            : 'bg-muted-foreground/20'
                        }`}>
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                            inviteCapabilities[option.key] ? 'left-[18px]' : 'left-0.5'
                          }`} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer - matching edit modal */}
              <div className="border-t border-border/50 px-6 py-4 bg-card">
                <div className="flex gap-3">
                  <button
                    onClick={closeInviteForm}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
                  >
                    {t('settings.actions.cancel')}
                  </button>
                  <button
                    onClick={handleInvite}
                    disabled={inviting}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
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
            </div>
          </BaseModal>
        )}

        {/* Collaborators Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-primary/60" />
            <p className="text-xs text-muted-foreground">Carregando membros...</p>
          </div>
        ) : collaborators.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center">
              <Users className="w-7 h-7 opacity-40" />
            </div>
            <p className="text-sm font-medium">{t('settings.collaboration.noneYet')}</p>
            <p className="text-xs">{t('settings.collaboration.invitePeople')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="group relative rounded-2xl border border-border/50 bg-card/60 hover:bg-card hover:border-border hover:shadow-md transition-all duration-200 p-4 flex flex-col"
              >
                {/* Status dot - top right */}
                <div className={`absolute top-3 right-3 w-2.5 h-2.5 rounded-full ring-2 ring-card ${getStatusAccentColor(collaborator.status)}`} />

                {/* Avatar centered */}
                <div className="flex justify-center mb-3">
                  {getAvatar(collaborator, 'lg')}
                </div>

                {/* Name + role */}
                <div className="text-center min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {collaborator.name || collaborator.email.split('@')[0]}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground mt-0.5">{collaborator.email}</p>
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <div className="inline-flex items-center gap-1 text-[11px]">
                      {getRoleIcon(collaborator.role)}
                      <span className="text-muted-foreground font-medium">{getRoleLabel(collaborator.role)}</span>
                    </div>
                  </div>
                  {collaborator.id === user?.id && (
                    <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      você
                    </span>
                  )}
                  {collaborator.role === 'owner' && collaborator.id !== user?.id && (
                    <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-widest text-yellow-600 dark:text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded-full">
                      {t('settings.collaboration.owner')}
                    </span>
                  )}
                </div>

                {/* Action buttons - bottom */}
                {collaborator.id !== user?.id && collaborator.role !== 'owner' && (
                  <div className="flex items-center justify-center gap-1 mt-3 pt-3 border-t border-border/30 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleEditCollaborator(collaborator)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                      aria-label={t('common.edit')}
                      title={t('common.edit')}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    {getActionButton(collaborator)}
                    <button
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                      className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                      aria-label={t('settings.collaboration.removeCollaborator')}
                      title={t('settings.collaboration.removeCollaborator')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
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
          contentClassName="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex flex-col max-h-[90vh]">
            {/* Profile header card */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Editar Colaborador
                </h3>
                <button
                  onClick={closeEditCollaboratorModal}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-background/50 transition-colors rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center gap-4">
                {getAvatar(editingCollaborator, 'lg')}
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-foreground truncate">
                    {editingCollaborator.name || editingCollaborator.email.split('@')[0]}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{editingCollaborator.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    {getStatusBadge(editingCollaborator.status)}
                  </div>
                </div>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {/* Role Section */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                  Papel
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditRole('viewer')}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      editRole === 'viewer'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/50 hover:border-border hover:bg-muted/30'
                    }`}
                  >
                    <Eye className={`w-5 h-5 flex-shrink-0 ${editRole === 'viewer' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${editRole === 'viewer' ? 'text-primary' : 'text-foreground'}`}>
                        {t('settings.collaboration.viewer')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Somente leitura</p>
                    </div>
                    {editRole === 'viewer' && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditRole('editor')}
                    className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                      editRole === 'editor'
                        ? 'border-primary bg-primary/5 shadow-sm'
                        : 'border-border/50 hover:border-border hover:bg-muted/30'
                    }`}
                  >
                    <Edit3 className={`w-5 h-5 flex-shrink-0 ${editRole === 'editor' ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="text-left">
                      <p className={`text-sm font-semibold ${editRole === 'editor' ? 'text-primary' : 'text-foreground'}`}>
                        {t('settings.collaboration.editor')}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Leitura e escrita</p>
                    </div>
                    {editRole === 'editor' && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </button>
                </div>
              </div>

              {/* Capabilities Section with Toggle Switches */}
              <div>
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                  Permissões
                </label>
                <div className="space-y-1">
                  {capabilityOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => toggleEditCapability(option.key)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors group/cap"
                    >
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium text-foreground">{option.label}</p>
                        <p className="text-[11px] text-muted-foreground leading-tight">{option.description}</p>
                      </div>
                      {/* Toggle switch visual */}
                      <div className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                        editCapabilities[option.key]
                          ? 'bg-primary'
                          : 'bg-muted-foreground/20'
                      }`}>
                        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                          editCapabilities[option.key] ? 'left-[18px]' : 'left-0.5'
                        }`} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-border/50 px-6 py-4 bg-card">
              <div className="flex gap-3">
                <button
                  onClick={closeEditCollaboratorModal}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium flex items-center justify-center gap-2 shadow-sm"
                >
                  <Check className="w-4 h-4" />
                  {t('common.save')}
                </button>
              </div>
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
          contentClassName="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
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
