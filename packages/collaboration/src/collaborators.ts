/**
 * Collaboration API Functions
 *
 * Functions for managing document collaborators and invites via Supabase.
 */

import { supabase } from '@obsidian-note-reviewer/security/supabase/client';

// ============================================
// Types
// ============================================

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';
export type CollaboratorStatus = 'active' | 'pending' | 'inactive';
export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface Collaborator {
  id: string;
  noteId: string;
  userId: string;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  invitedBy?: string;
  invitedAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Joined user data
  user?: {
    id: string;
    email: string;
    name?: string;
    avatarUrl?: string;
  };
}

export interface DocumentInvite {
  id: string;
  noteId: string;
  email: string;
  role: CollaboratorRole;
  token: string;
  invitedBy: string;
  status: InviteStatus;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
}

export interface InviteResult {
  success: boolean;
  inviteId?: string;
  error?: string;
}

export interface RemoveCollaboratorResult {
  success: boolean;
  error?: string;
}

// ============================================
// API Functions
// ============================================

/**
 * Get all collaborators for a document
 */
export async function getDocumentCollaborators(
  noteId: string,
  includeInactive: boolean = true
): Promise<Collaborator[]> {
  const query = supabase
    .from('document_collaborators')
    .select(`
      *,
      user:user_id (
        id,
        email,
        name,
        avatar_url
      )
    `)
    .eq('note_id', noteId);

  // Se não incluir inativos, busca apenas ativos
  if (!includeInactive) {
    query.eq('status', 'active');
  } else {
    // Incluir ativos e inativos (mas não 'removed')
    query.in('status', ['active', 'inactive']);
  }

  const { data, error } = await query.order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching collaborators:', error);
    return [];
  }

  return (data || []).map((collab: any) => ({
    id: collab.id,
    noteId: collab.note_id,
    userId: collab.user_id,
    role: collab.role,
    status: collab.status,
    invitedBy: collab.invited_by,
    invitedAt: collab.invited_at,
    acceptedAt: collab.accepted_at,
    createdAt: collab.created_at,
    updatedAt: collab.updated_at,
    user: collab.user ? {
      id: collab.user.id,
      email: collab.user.email,
      name: collab.user.name,
      avatarUrl: collab.user.avatar_url,
    } : undefined,
  }));
}

/**
 * Invite a user to collaborate on a document
 */
export async function inviteCollaborator(
  noteId: string,
  email: string,
  role: CollaboratorRole,
  invitedBy: string
): Promise<InviteResult> {
  try {
    const { data, error } = await supabase.rpc('invite_to_document', {
      note_uuid: noteId,
      invite_email: email,
      invite_role: role,
      inviter_uuid: invitedBy,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, inviteId: data as string };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to send invite' };
  }
}

/**
 * Remove a collaborator permanently from a document (hard delete)
 */
export async function removeCollaborator(
  noteId: string,
  userId: string
): Promise<RemoveCollaboratorResult> {
  const { error } = await supabase
    .from('document_collaborators')
    .delete()
    .eq('note_id', noteId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Deactivate a collaborator (soft delete - sets status to inactive)
 */
export async function deactivateCollaborator(
  noteId: string,
  userId: string
): Promise<RemoveCollaboratorResult> {
  const { error } = await supabase
    .from('document_collaborators')
    .update({ status: 'inactive', updated_at: new Date().toISOString() })
    .eq('note_id', noteId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Reactivate a collaborator (sets status back to active)
 */
export async function reactivateCollaborator(
  noteId: string,
  userId: string
): Promise<RemoveCollaboratorResult> {
  const { error } = await supabase
    .from('document_collaborators')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .eq('note_id', noteId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Update collaborator role
 */
export async function updateCollaboratorRole(
  noteId: string,
  userId: string,
  role: CollaboratorRole
): Promise<RemoveCollaboratorResult> {
  const { error } = await supabase
    .from('document_collaborators')
    .update({ role, updated_at: new Date().toISOString() })
    .eq('note_id', noteId)
    .eq('user_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Get pending invites for a document
 */
export async function getDocumentInvites(
  noteId: string
): Promise<DocumentInvite[]> {
  const { data, error } = await supabase
    .from('document_invites')
    .select('*')
    .eq('note_id', noteId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invites:', error);
    return [];
  }

  return (data || []).map((invite: any) => ({
    id: invite.id,
    noteId: invite.note_id,
    email: invite.email,
    role: invite.role,
    token: invite.token,
    invitedBy: invite.invited_by,
    status: invite.status,
    expiresAt: invite.expires_at,
    createdAt: invite.created_at,
    updatedAt: invite.updated_at,
    acceptedAt: invite.accepted_at,
  }));
}

/**
 * Accept a document invite
 */
export async function acceptInvite(token: string, userId: string): Promise<boolean> {
  const { error } = await supabase.rpc('accept_document_invite', {
    invite_token: token,
    user_uuid: userId,
  });

  if (error) {
    console.error('Error accepting invite:', error);
    return false;
  }

  return true;
}

/**
 * Cancel a pending invite
 */
export async function cancelInvite(inviteId: string): Promise<boolean> {
  const { error } = await supabase
    .from('document_invites')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', inviteId);

  if (error) {
    console.error('Error cancelling invite:', error);
    return false;
  }

  return true;
}

/**
 * Check if user has access to a document
 */
export async function checkDocumentAccess(
  noteId: string,
  userId: string
): Promise<boolean> {
  const { data } = await supabase.rpc('has_note_access', {
    note_uuid: noteId,
    user_uuid: userId,
  });

  return data || false;
}

/**
 * Get user's role on a document
 */
export async function getUserDocumentRole(
  noteId: string,
  userId: string
): Promise<CollaboratorRole | 'none'> {
  const { data } = await supabase.rpc('get_note_role', {
    note_uuid: noteId,
    user_uuid: userId,
  });

  return (data as CollaboratorRole | 'none') || 'none';
}

/**
 * Get current user's role on a document (uses auth session)
 */
export async function getCurrentUserRole(noteId: string): Promise<CollaboratorRole | 'none'> {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return 'none';
  }

  return getUserDocumentRole(noteId, user.id);
}
