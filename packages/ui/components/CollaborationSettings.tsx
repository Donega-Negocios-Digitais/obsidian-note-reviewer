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
  getDocumentInvites,
  getCurrentUserRole,
  canInviteCollaborators,
  inviteCollaborator,
  cancelInvite,
  removeCollaborator,
  deactivateCollaborator,
  reactivateCollaborator,
  updateCollaboratorRole,
  updateCollaboratorCapability,
  type DocumentInvite,
  type InviteErrorCode,
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
  Info,
  ShieldCheck,
  Link2,
  RotateCcw,
  X
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
  const [sendEmailNotifications, setSendEmailNotifications] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [pendingInvites, setPendingInvites] = useState<DocumentInvite[]>([])
  const [canInvite, setCanInvite] = useState(false)
  const [invitesLoading, setInvitesLoading] = useState(false)
  const [inviteActionId, setInviteActionId] = useState<string | null>(null)
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
      localStorage.setItem('obsreview-sendInviteEmail', sendEmailNotifications ? 'true' : 'false')
      localStorage.setItem('obsreview-inviteError', inviteError || '')
    } else {
      localStorage.removeItem('obsreview-showInviteForm')
      localStorage.removeItem('obsreview-inviteEmail')
      localStorage.removeItem('obsreview-inviteRole')
      localStorage.removeItem('obsreview-inviteCapabilities')
      localStorage.removeItem('obsreview-sendInviteEmail')
      localStorage.removeItem('obsreview-inviteError')
    }
  }, [showInviteForm, inviteEmail, inviteRole, inviteCapabilities, sendEmailNotifications, inviteError])

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
      const savedSendInviteEmail = localStorage.getItem('obsreview-sendInviteEmail') === 'true'
      const savedError = localStorage.getItem('obsreview-inviteError') || null
      setShowInviteForm(true)
      setInviteEmail(savedEmail)
      setInviteRole(savedRole)
      setInviteCapabilities(savedCapabilities)
      setSendEmailNotifications(savedSendInviteEmail)
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
      setPendingInvites([])
      setCanInvite(false)
      onCollaboratorsChange?.(ownerOnly)
      setLoading(false)
      setInvitesLoading(false)
      return
    }

    setLoading(true)
    setInvitesLoading(true)
    try {
      const [apiCollaborators, currentRole, invites, canManageInvites] = await Promise.all([
        getDocumentCollaborators(documentId),
        getCurrentUserRole(documentId),
        getDocumentInvites(documentId),
        canInviteCollaborators(documentId),
      ])

      const nextCollaborators: Collaborator[] = apiCollaborators.map((collab) => ({
        id: collab.userId,
        email: (() => {
          const normalized = (collab.user?.email || '').trim()
          if (normalized.length > 0) return normalized
          return `colaborador-${collab.userId.slice(0, 8)}@indisponivel.local`
        })(),
        name: (() => {
          const normalizedName = (collab.user?.name || '').trim()
          if (normalizedName.length > 0) return normalizedName
          const normalizedEmail = (collab.user?.email || '').trim()
          if (normalizedEmail.length > 0) return normalizedEmail.split('@')[0]
          return `Colaborador ${collab.userId.slice(0, 8)}`
        })(),
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
      setPendingInvites(invites)
      setCanInvite(canManageInvites || currentRole === 'owner')
      onCollaboratorsChange?.(resolvedCollaborators)
    } catch (error) {
      console.error('Failed to load collaborators:', error)
      setCollaborators(ownerOnly)
      setPendingInvites([])
      setCanInvite(false)
      onCollaboratorsChange?.(ownerOnly)
    } finally {
      setLoading(false)
      setInvitesLoading(false)
    }
  }

  const mapInviteFailureReason = (reason: string, code?: InviteErrorCode): string => {
    if (code === 'document_not_found') {
      return 'Documento não encontrado. Salve ou selecione um documento válido antes de convidar.'
    }

    if (code === 'permission_denied') {
      return 'Você não tem permissão para convidar pessoas neste documento.'
    }

    if (code === 'auth_required') {
      return 'Sua sessão expirou ou a conta ainda está sincronizando. Faça login novamente.'
    }

    const normalized = reason.toLowerCase()

    if (normalized.includes('you do not have permission to invite collaborators')) {
      return 'Você não tem permissão para convidar pessoas neste documento.'
    }

    if (normalized.includes('this user already has access to the document')) {
      return 'Este usuário já tem acesso ao documento.'
    }

    if (normalized.includes('a pending invite already exists for this email')) {
      return 'Já existe um convite pendente para este e-mail.'
    }

    if (normalized.includes('authentication required')) {
      return 'Sua sessão expirou. Faça login novamente para convidar colaboradores.'
    }

    return reason
  }

  const buildInviteUrl = (token?: string): string => {
    if (typeof window === 'undefined') return ''
    if (!token) return window.location.href
    return `${window.location.origin}/invites/accept?token=${encodeURIComponent(token)}`
  }

  const getInviteDocumentLabel = (): string => {
    if (!documentId) return 'Documento'
    return `Documento ${documentId.slice(0, 8)}`
  }

  const handleInvite = async () => {
    if (!documentId) {
      setInviteError('Documento ainda não carregado. Salve ou selecione um documento antes de convidar.')
      return
    }

    if (!canInvite) {
      setInviteError('Você não tem permissão para convidar pessoas neste documento. Seu acesso é somente leitura.')
      return
    }

    const emailToInvite = inviteEmail.trim()
    if (!emailToInvite) {
      setInviteError(`${t('settings.collaboration.email')} é obrigatório`)
      return
    }

    if (/[\n,;,]/.test(emailToInvite)) {
      setInviteError('Convide apenas 1 colaborador por vez.')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(emailToInvite)) {
      setInviteError('E-mail inválido. Digite um endereço de e-mail válido.')
      return
    }

    const normalizedEmail = emailToInvite.toLowerCase()
    const alreadyCollaborator = collaborators.some((collaborator) => collaborator.email.trim().toLowerCase() === normalizedEmail)
    if (alreadyCollaborator) {
      setInviteError('Este e-mail já é colaborador deste documento.')
      return
    }

    setInviting(true)
    setInviteError(null)

    try {
      const result = await inviteCollaborator(
        documentId,
        emailToInvite,
        inviteRole,
        inviteCapabilities,
      )

      if (!result.success) {
        const reason = mapInviteFailureReason(result.error || 'Erro ao enviar convite', result.errorCode)
        setInviteError(`Falha ao convidar ${emailToInvite}: ${reason}`)
        return
      }

      const inviteUrl = buildInviteUrl(result.token)
      let emailMessage = ' Convite salvo no app com link compartilhável em Convites pendentes.'

      if (sendEmailNotifications) {
        try {
          await sendInviteEmail({
            email: emailToInvite,
            role: inviteRole,
            inviterName: user?.user_metadata?.full_name || user?.email || 'Alguém',
            documentTitle: getInviteDocumentLabel(),
            inviteUrl,
          })
          emailMessage = ' E-mail de notificação enviado com sucesso.'
        } catch (error) {
          console.warn('Email invite failed (non-critical):', error)
          emailMessage = ' Convite salvo no app. E-mail não enviado, use o link em Convites pendentes.'
        }
      }

      setSuccessToast(`Convite criado no app para ${emailToInvite}.${emailMessage}`)
      setInviteEmail('')
      setShowInviteForm(false)
      await loadCollaborators()
    } catch (error: any) {
      setInviteError(mapInviteFailureReason(error?.message || 'Erro ao enviar convite'))
    } finally {
      setInviting(false)
    }
  }

  const closeInviteForm = () => {
    setShowInviteForm(false)
    setInviteEmail('')
    setInviteRole('editor')
    setInviteCapabilities(DEFAULT_CAPABILITIES)
    setSendEmailNotifications(false)
    setInviteError(null)
  }

  const handleCopyInviteLink = async (invite: DocumentInvite) => {
    try {
      const inviteUrl = buildInviteUrl(invite.token)
      await navigator.clipboard.writeText(inviteUrl)
      setSuccessToast(`Link de convite copiado para ${invite.email}.`)
    } catch {
      setInviteError('Não foi possível copiar o link do convite.')
    }
  }

  const handleResendInviteEmail = async (invite: DocumentInvite) => {
    if (!canInvite) {
      setInviteError('Você não tem permissão para reenviar convites neste documento.')
      return
    }

    setInviteActionId(`resend:${invite.id}`)
    try {
      await sendInviteEmail({
        email: invite.email,
        role: invite.role === 'editor' ? 'editor' : 'viewer',
        inviterName: user?.user_metadata?.full_name || user?.email || 'Alguém',
        documentTitle: getInviteDocumentLabel(),
        inviteUrl: buildInviteUrl(invite.token),
      })
      setSuccessToast(`E-mail reenviado para ${invite.email}.`)
    } catch {
      setInviteError(`Não foi possível reenviar o e-mail para ${invite.email}.`)
    } finally {
      setInviteActionId(null)
    }
  }

  const handleCancelPendingInvite = async (invite: DocumentInvite) => {
    if (!canInvite) {
      setInviteError('Você não tem permissão para cancelar convites neste documento.')
      return
    }

    setInviteActionId(`cancel:${invite.id}`)
    try {
      const cancelled = await cancelInvite(invite.id)
      if (!cancelled) {
        setInviteError(`Não foi possível cancelar o convite para ${invite.email}.`)
        return
      }

      setPendingInvites((current) => current.filter((item) => item.id !== invite.id))
      setSuccessToast(`Convite cancelado para ${invite.email}.`)
    } finally {
      setInviteActionId(null)
    }
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
          onClick={() => {
            if (!documentId) return
            if (!canInvite) {
              setInviteError('Você não tem permissão para convidar pessoas neste documento. Seu acesso é somente leitura.')
              return
            }
            setShowInviteForm(!showInviteForm)
          }}
          disabled={!documentId || !canInvite}
          className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          title={
            !documentId
              ? 'Selecione um documento para convidar colaboradores'
              : !canInvite
                ? 'Você tem permissão somente de leitura neste documento'
                : t('settings.collaboration.invite')
          }
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

      {documentId && !canInvite && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-4 text-sm text-amber-700 dark:text-amber-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>Você tem permissão somente para leitura neste documento. Peça ao proprietário para liberar convites.</span>
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
            contentClassName="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex flex-col">
              {/* Header with gradient - matching edit modal */}
              <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Novo Colaborador
                  </h3>
                  <button
                    onClick={closeInviteForm}
                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors rounded-lg"
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

              <div className="px-6 py-5 space-y-4">
                {inviteError && (
                  <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {inviteError}
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-5 items-start">
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="inviteEmail" className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 block">
                        {t('settings.collaboration.email')}
                      </label>
                      <input
                        type="email"
                        autoComplete="email"
                        id="inviteEmail"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="w-full h-11 px-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                        placeholder={t('settings.collaboration.emailPlaceholder')}
                      />
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Convide apenas 1 colaborador por vez.
                      </p>
                    </div>

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

                    <div className="rounded-xl border border-border/60 bg-muted/20 p-3 space-y-2">
                      <label className="flex items-center gap-2 text-sm text-foreground">
                        <input
                          type="checkbox"
                          checked={sendEmailNotifications}
                          onChange={(event) => setSendEmailNotifications(event.target.checked)}
                          className="h-4 w-4 rounded border-border text-primary focus:ring-primary/50"
                        />
                        Enviar também notificação por e-mail (opcional)
                      </label>
                      <p className="text-[11px] text-muted-foreground">
                        O convite sempre fica salvo no app. O e-mail é apenas uma notificação extra.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                      Permissões
                    </label>
                    <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.04] p-4">
                      <div className="flex items-start gap-2 mb-3">
                        <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold text-foreground">Permissões detalhadas</p>
                          <p className="text-xs text-muted-foreground">Defina exatamente o que este colaborador pode fazer.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {capabilityOptions.map((option) => (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => toggleInviteCapability(option.key)}
                            className={`w-full rounded-xl border px-3 py-2.5 transition-all ${
                              inviteCapabilities[option.key]
                                ? 'border-primary/50 bg-primary/10 shadow-sm'
                                : 'border-border/60 bg-background hover:border-border hover:bg-muted/20'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 text-left min-w-0">
                                <p className="text-sm font-medium text-foreground">{option.label}</p>
                                <p className="text-[11px] text-muted-foreground leading-tight">{option.description}</p>
                              </div>
                              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                inviteCapabilities[option.key] ? 'text-primary' : 'text-muted-foreground'
                              }`}>
                                {inviteCapabilities[option.key] ? 'ativo' : 'desativado'}
                              </span>
                            </div>
                            <div className="mt-2 flex justify-end">
                              <div className={`relative w-10 h-6 rounded-full transition-colors ${
                                inviteCapabilities[option.key]
                                  ? 'bg-primary'
                                  : 'bg-muted-foreground/20'
                              }`}>
                                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                                  inviteCapabilities[option.key] ? 'left-[18px]' : 'left-0.5'
                                }`} />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
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

        {/* Collaborators List */}
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="h-full rounded-2xl border border-border/60 bg-card/70 px-4 py-3.5 hover:bg-card hover:border-border hover:shadow-sm transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">{getAvatar(collaborator, 'lg')}</div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground max-w-[16rem]">
                        {collaborator.name || collaborator.email.split('@')[0]}
                      </p>
                      {collaborator.id === user?.id && (
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          você
                        </span>
                      )}
                      {collaborator.role === 'owner' && collaborator.id !== user?.id && (
                        <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400">
                          {t('settings.collaboration.owner')}
                        </span>
                      )}
                      {getStatusBadge(collaborator.status)}
                    </div>
                    <p className="mt-1 truncate text-sm text-muted-foreground">{collaborator.email}</p>
                    <div className="mt-1 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      {getRoleIcon(collaborator.role)}
                      <span className="font-medium">{getRoleLabel(collaborator.role)}</span>
                    </div>
                  </div>

                  {collaborator.id !== user?.id && collaborator.role !== 'owner' && (
                    <div className="flex items-center gap-1 self-center">
                      <button
                        onClick={() => handleEditCollaborator(collaborator)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        aria-label={t('common.edit')}
                        title={t('common.edit')}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      {getActionButton(collaborator)}
                      <button
                        onClick={() => handleRemoveCollaborator(collaborator.id)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                        aria-label={t('settings.collaboration.removeCollaborator')}
                        title={t('settings.collaboration.removeCollaborator')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {documentId && canInvite && (
          <div className="rounded-2xl border border-border/60 bg-card/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Convites pendentes</h4>
                <p className="text-xs text-muted-foreground">
                  {invitesLoading ? 'Carregando convites...' : `${pendingInvites.length} pendente(s)`}
                </p>
              </div>
            </div>

            {invitesLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Atualizando lista de convites...
              </div>
            ) : pendingInvites.length === 0 ? (
              <p className="text-xs text-muted-foreground">
                Nenhum convite pendente no momento.
              </p>
            ) : (
              <div className="space-y-2">
                {pendingInvites.map((invite) => (
                  <div
                    key={invite.id}
                    className="rounded-xl border border-border/50 bg-background/70 px-3 py-2 flex items-start justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{invite.email}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {invite.role === 'editor' ? 'Editor' : 'Visualizador'} • expira em {new Date(invite.expiresAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyInviteLink(invite)}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        title="Copiar link do convite"
                        aria-label="Copiar link do convite"
                      >
                        <Link2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleResendInviteEmail(invite)}
                        disabled={inviteActionId === `resend:${invite.id}`}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Reenviar e-mail"
                        aria-label="Reenviar e-mail"
                      >
                        {inviteActionId === `resend:${invite.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleCancelPendingInvite(invite)}
                        disabled={inviteActionId === `cancel:${invite.id}`}
                        className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Cancelar convite"
                        aria-label="Cancelar convite"
                      >
                        {inviteActionId === `cancel:${invite.id}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
          contentClassName="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex flex-col">
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

            <div className="px-6 py-5">
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.2fr] gap-5 items-start">
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

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 block">
                    Permissões
                  </label>
                  <div className="rounded-2xl border-2 border-primary/20 bg-primary/[0.04] p-4">
                    <div className="flex items-start gap-2 mb-3">
                      <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Permissões detalhadas</p>
                        <p className="text-xs text-muted-foreground">Ajuste o que este colaborador pode acessar neste documento.</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {capabilityOptions.map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => toggleEditCapability(option.key)}
                          className={`w-full rounded-xl border px-3 py-2.5 transition-all ${
                            editCapabilities[option.key]
                              ? 'border-primary/50 bg-primary/10 shadow-sm'
                              : 'border-border/60 bg-background hover:border-border hover:bg-muted/20'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 text-left min-w-0">
                              <p className="text-sm font-medium text-foreground">{option.label}</p>
                              <p className="text-[11px] text-muted-foreground leading-tight">{option.description}</p>
                            </div>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${
                              editCapabilities[option.key] ? 'text-primary' : 'text-muted-foreground'
                            }`}>
                              {editCapabilities[option.key] ? 'ativo' : 'desativado'}
                            </span>
                          </div>
                          <div className="mt-2 flex justify-end">
                            <div className={`relative w-10 h-6 rounded-full transition-colors ${
                              editCapabilities[option.key]
                                ? 'bg-primary'
                                : 'bg-muted-foreground/20'
                            }`}>
                              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                                editCapabilities[option.key] ? 'left-[18px]' : 'left-0.5'
                              }`} />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
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
