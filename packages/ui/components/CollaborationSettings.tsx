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
  type Collaborator as ApiCollaborator,
  type CollaboratorRole,
} from '@obsidian-note-reviewer/collaboration'
import {
  Users,
  UserPlus,
  Mail,
  Check,
  Trash2,
  Shield,
  Eye,
  Edit3,
  Crown,
  Loader2
} from 'lucide-react'

interface Collaborator {
  id: string
  email: string
  name?: string
  avatar_url?: string
  role: CollaboratorRole
  status: 'active' | 'pending' | 'expired'
  invited_at?: string
}

interface Invite {
  email: string
  role: 'editor' | 'viewer'
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
  const [inviteSuccess, setInviteSuccess] = useState(false)

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
        // Send invite email via Resend (non-blocking)
        fetch('/api/invite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: inviteEmail,
            role: inviteRole,
            inviterName: user?.user_metadata?.full_name || user?.email || 'Alguém',
            documentTitle: documentId ? `Documento ${documentId.slice(0, 8)}` : 'Documento',
            inviteUrl: typeof window !== 'undefined' ? window.location.href : '',
          }),
        }).catch(err => console.warn('Email invite failed (non-critical):', err))

        setInviteSuccess(true)
        setInviteEmail('')
        setShowInviteForm(false)
        // Reload collaborators to show the new one
        await loadCollaborators()
        onCollaboratorsChange?.(collaborators)
        // Auto-hide success message
        setTimeout(() => setInviteSuccess(false), 3000)
      } else {
        setInviteError(result.error || 'Erro ao enviar convite')
      }
    } catch (error: any) {
      setInviteError(error.message || 'Erro ao enviar convite')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorId: string) => {
    if (collaboratorId === user?.id) {
      return // Cannot remove owner
    }

    try {
      if (!documentId) return

      const result = await removeCollaborator(documentId, collaboratorId)

      if (result.success) {
        setCollaborators(collaborators.filter(c => c.id !== collaboratorId))
        onCollaboratorsChange?.(collaborators.filter(c => c.id !== collaboratorId))
      } else {
        console.error('Failed to remove collaborator:', result.error)
      }
    } catch (error) {
      console.error('Failed to remove collaborator:', error)
    }
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
        return 'Controle total do documento'
      case 'editor':
        return 'Pode adicionar anotações e comentários'
      case 'viewer':
        return 'Apenas visualização'
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

        {/* Invite Form */}
        {showInviteForm && (
          <div className="p-4 border rounded-lg space-y-4 bg-card">
            <h4 className="font-medium flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {t('settings.collaboration.inviteNew')}
            </h4>

            {inviteError && (
              <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
                {inviteError}
              </div>
            )}

            {inviteSuccess && (
              <div className="p-3 rounded-md bg-green-500/15 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Convite enviado com sucesso!
              </div>
            )}

            <div>
              <label htmlFor="inviteEmail" className="block text-sm font-medium mb-1.5">
                {t('settings.collaboration.email')}
              </label>
              <input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                placeholder={t('settings.collaboration.emailPlaceholder')}
              />
            </div>

            <div>
              <label htmlFor="inviteRole" className="block text-sm font-medium mb-1.5">
                {t('settings.collaboration.permission')}
              </label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as 'viewer' | 'editor')}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
              >
                <option value="viewer">{t('settings.collaboration.viewer')}</option>
                <option value="editor">{t('settings.collaboration.editor')}</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {getRoleDescription(inviteRole)}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleInvite}
                disabled={inviting}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
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
              <button
                onClick={() => {
                  setShowInviteForm(false)
                  setInviteEmail('')
                  setInviteError(null)
                }}
                className="px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors"
              >
                {t('settings.actions.cancel')}
              </button>
            </div>
          </div>
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
          <div className="space-y-2">
            {collaborators.map((collaborator) => (
              <div
                key={collaborator.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getAvatar(collaborator)}
                  <div>
                    <p className="font-medium">
                      {collaborator.name || collaborator.email}
                    </p>
                    <p className="text-xs text-muted-foreground">{collaborator.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted">
                    {getRoleIcon(collaborator.role)}
                    <span className="text-xs font-medium">{getRoleLabel(collaborator.role)}</span>
                  </div>

                  {collaborator.status === 'pending' && (
                    <span className="text-xs text-muted-foreground">Pendente</span>
                  )}

                  {collaborator.id !== user?.id && collaborator.role !== 'owner' && (
                    <button
                      onClick={() => handleRemoveCollaborator(collaborator.id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                      aria-label="Remover colaborador"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Permissions Legend */}
      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          {t('settings.collaboration.permissionLevels')}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-start gap-2">
            <Crown className="w-4 h-4 text-yellow-500 mt-0.5" />
            <div>
              <span className="font-medium">{t('settings.collaboration.owner')}:</span>
              <span className="text-muted-foreground ml-1">{t('settings.collaboration.ownerDesc')}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Edit3 className="w-4 h-4 text-blue-500 mt-0.5" />
            <div>
              <span className="font-medium">Editor:</span>
              <span className="text-muted-foreground ml-1">{t('settings.collaboration.editorDesc')}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Eye className="w-4 h-4 text-gray-500 mt-0.5" />
            <div>
              <span className="font-medium">{t('settings.collaboration.viewer')}:</span>
              <span className="text-muted-foreground ml-1">{t('settings.collaboration.viewerDesc')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
