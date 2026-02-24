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
export type CollaboratorCapability = 'hooks' | 'integrations' | 'automations' | 'invite' | 'manage_permissions';

export interface CollaboratorCapabilities {
  hooks: boolean;
  integrations: boolean;
  automations: boolean;
  invite: boolean;
  manage_permissions: boolean;
}

export interface Collaborator {
  id: string;
  noteId: string;
  userId: string;
  role: CollaboratorRole;
  status: CollaboratorStatus;
  capabilities: CollaboratorCapabilities;
  invitedBy?: string;
  invitedAt: string;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  token?: string;
  noteId?: string;
  expiresAt?: string;
  error?: string;
}

export interface RemoveCollaboratorResult {
  success: boolean;
  error?: string;
}

const DEFAULT_CAPABILITIES: CollaboratorCapabilities = {
  hooks: false,
  integrations: false,
  automations: false,
  invite: false,
  manage_permissions: false,
};

function normalizeCapabilities(value: unknown): CollaboratorCapabilities {
  if (!value || typeof value !== 'object') {
    return DEFAULT_CAPABILITIES;
  }

  const source = value as Record<string, unknown>;
  return {
    hooks: source.hooks === true,
    integrations: source.integrations === true,
    automations: source.automations === true,
    invite: source.invite === true,
    manage_permissions: source.manage_permissions === true,
  };
}

function isCollaboratorRole(value: unknown): value is CollaboratorRole {
  return value === 'owner' || value === 'editor' || value === 'viewer';
}

async function getUserDocumentRoleFallback(
  noteId: string,
  userId: string,
): Promise<CollaboratorRole | 'none'> {
  const { data: noteData } = await supabase
    .from('notes')
    .select('created_by,is_public')
    .eq('id', noteId)
    .maybeSingle();

  if (noteData?.created_by === userId) {
    return 'owner';
  }

  const { data: collaboratorData } = await supabase
    .from('document_collaborators')
    .select('role,status')
    .eq('note_id', noteId)
    .eq('user_id', userId)
    .maybeSingle();

  if (collaboratorData?.status === 'active' && isCollaboratorRole(collaboratorData.role)) {
    return collaboratorData.role;
  }

  if (noteData?.is_public === true) {
    return 'viewer';
  }

  return 'none';
}

function isMissingRpcFunction(error: unknown, functionName: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const rpcError = error as { code?: string; message?: string; details?: string };
  const message = String(rpcError.message || '').toLowerCase();
  const details = String(rpcError.details || '').toLowerCase();
  const missingMessage = message.includes('could not find the function') || details.includes('could not find the function');
  const expected = `public.${functionName}`.toLowerCase();

  if (rpcError.code === 'PGRST202') {
    return true;
  }

  return missingMessage && (message.includes(expected) || details.includes(expected));
}

function isMissingDatabaseFunction(error: unknown, functionName: string): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const rpcError = error as { code?: string; message?: string; details?: string };
  const message = String(rpcError.message || '').toLowerCase();
  const details = String(rpcError.details || '').toLowerCase();
  const expected = `function public.${functionName}`.toLowerCase();
  const signature = `${functionName}(`.toLowerCase();
  const missingFunction = message.includes('does not exist') || details.includes('does not exist');

  if (rpcError.code === '42883') {
    return message.includes(expected) || details.includes(expected) || message.includes(signature) || details.includes(signature);
  }

  return missingFunction && (message.includes(expected) || details.includes(expected) || message.includes(signature) || details.includes(signature));
}

function mapInviteResult(data: unknown): InviteResult {
  const row = Array.isArray(data) ? data[0] : data;
  const record = row && typeof row === 'object' ? (row as Record<string, unknown>) : {};

  return {
    success: true,
    inviteId: typeof record.invite_id === 'string' ? record.invite_id : undefined,
    token: typeof record.invite_token === 'string' ? record.invite_token : undefined,
    noteId: typeof record.note_id === 'string' ? record.note_id : undefined,
    expiresAt: typeof record.expires_at === 'string' ? record.expires_at : undefined,
  };
}

async function inviteCollaboratorLegacy(
  noteId: string,
  email: string,
  role: 'editor' | 'viewer'
): Promise<InviteResult> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const inviterId = authData?.user?.id;

  if (authError || !inviterId) {
    return {
      success: false,
      error: authError?.message || 'Authentication required to send invite',
    };
  }

  const { data: inviteIdData, error } = await supabase.rpc('invite_to_document', {
    note_uuid: noteId,
    invite_email: email,
    invite_role: role,
    inviter_uuid: inviterId,
  });

  if (error) {
    if (isMissingRpcFunction(error, 'invite_to_document')) {
      return {
        success: false,
        error: 'Banco desatualizado. Rode as migrations de colaboração e recarregue o schema cache do Supabase.',
      };
    }

    return { success: false, error: error.message };
  }

  const inviteId = typeof inviteIdData === 'string' ? inviteIdData : undefined;

  if (!inviteId) {
    return { success: true };
  }

  const { data: inviteRow } = await supabase
    .from('document_invites')
    .select('id, token, note_id, expires_at')
    .eq('id', inviteId)
    .maybeSingle();

  return {
    success: true,
    inviteId,
    token: typeof inviteRow?.token === 'string' ? inviteRow.token : undefined,
    noteId: typeof inviteRow?.note_id === 'string' ? inviteRow.note_id : noteId,
    expiresAt: typeof inviteRow?.expires_at === 'string' ? inviteRow.expires_at : undefined,
  };
}

async function acceptInviteLegacy(token: string): Promise<string | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  if (authError || !userId) {
    return null;
  }

  let noteIdFromInvite: string | null = null;
  const { data: inviteRow } = await supabase
    .from('document_invites')
    .select('note_id')
    .eq('token', token)
    .maybeSingle();

  if (typeof inviteRow?.note_id === 'string') {
    noteIdFromInvite = inviteRow.note_id;
  }

  const { data, error } = await supabase.rpc('accept_document_invite', {
    invite_token: token,
    user_uuid: userId,
  });

  if (error) {
    console.error('Error accepting legacy invite:', error);
    return null;
  }

  if (typeof data === 'string' && data.length > 0) {
    return data;
  }

  if (data === true) {
    return noteIdFromInvite;
  }

  return noteIdFromInvite;
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

  if (!includeInactive) {
    query.eq('status', 'active');
  } else {
    query.in('status', ['active', 'inactive', 'pending']);
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
    capabilities: normalizeCapabilities(collab.capabilities),
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
  role: 'editor' | 'viewer',
  capabilities?: CollaboratorCapabilities
): Promise<InviteResult> {
  const defaultCapabilities: CollaboratorCapabilities = {
    hooks: false,
    integrations: false,
    automations: false,
    invite: false,
    manage_permissions: false,
  };

  const inviteCapabilities = capabilities || defaultCapabilities;

  try {
    const { data, error } = await supabase.rpc('create_document_invite', {
      note_uuid: noteId,
      invite_email: email,
      invite_role: role,
      invite_capabilities: inviteCapabilities,
    });

    if (error) {
      if (
        isMissingRpcFunction(error, 'create_document_invite')
        || isMissingDatabaseFunction(error, 'can_manage_collaborators')
      ) {
        return inviteCollaboratorLegacy(noteId, email, role);
      }

      return { success: false, error: error.message };
    }

    return mapInviteResult(data);
  } catch (error: any) {
    return { success: false, error: error?.message || 'Failed to send invite' };
  }
}

/**
 * Remove a collaborator permanently from a document
 */
export async function removeCollaborator(
  noteId: string,
  userId: string
): Promise<RemoveCollaboratorResult> {
  const { data, error } = await supabase.rpc('remove_document_collaborator', {
    note_uuid: noteId,
    collaborator_uuid: userId,
  });

  if (!error && data === true) {
    return { success: true };
  }

  if (
    error
    && (
      isMissingRpcFunction(error, 'remove_document_collaborator')
      || isMissingDatabaseFunction(error, 'remove_document_collaborator')
      || isMissingDatabaseFunction(error, 'can_manage_collaborators')
    )
  ) {
    const { error: fallbackError } = await supabase
      .from('document_collaborators')
      .delete()
      .eq('note_id', noteId)
      .eq('user_id', userId);

    if (!fallbackError) {
      return { success: true };
    }

    return { success: false, error: fallbackError.message || 'Failed to remove collaborator' };
  }

  return { success: false, error: error?.message || 'Failed to remove collaborator' };
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
  const { data, error } = await supabase.rpc('set_document_collaborator_role', {
    note_uuid: noteId,
    collaborator_uuid: userId,
    new_role: role,
  });

  if (error || data !== true) {
    return { success: false, error: error?.message || 'Failed to update collaborator role' };
  }

  return { success: true };
}

/**
 * Update a collaborator capability
 */
export async function updateCollaboratorCapability(
  noteId: string,
  userId: string,
  capability: CollaboratorCapability,
  enabled: boolean
): Promise<RemoveCollaboratorResult> {
  const { data, error } = await supabase.rpc('set_document_collaborator_capability', {
    note_uuid: noteId,
    collaborator_uuid: userId,
    capability_key: capability,
    enabled,
  });

  if (error || data !== true) {
    return { success: false, error: error?.message || 'Failed to update collaborator capability' };
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
 * Accept a document invite and return note id
 */
export async function acceptInvite(token: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('accept_document_invite', {
    invite_token: token,
  });

  if (error) {
    if (isMissingRpcFunction(error, 'accept_document_invite')) {
      return acceptInviteLegacy(token);
    }

    console.error('Error accepting invite:', error);
    return null;
  }

  if (typeof data === 'string' && data.length > 0) {
    return data;
  }

  if (data === true) {
    const { data: inviteRow } = await supabase
      .from('document_invites')
      .select('note_id')
      .eq('token', token)
      .maybeSingle();

    return typeof inviteRow?.note_id === 'string' ? inviteRow.note_id : null;
  }

  return null;
}

/**
 * Decline a document invite
 */
export async function declineInvite(token: string): Promise<boolean> {
  const { data, error } = await supabase.rpc('decline_document_invite', {
    invite_token: token,
  });

  if (error) {
    console.error('Error declining invite:', error);
    return false;
  }

  return data === true;
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
  const { data, error } = await supabase.rpc('get_note_role', {
    note_uuid: noteId,
    user_uuid: userId,
  });

  if (!error && (data === 'none' || isCollaboratorRole(data))) {
    return data;
  }

  if (error) {
    console.warn('get_note_role RPC failed, using fallback role resolution:', error);
  }

  return getUserDocumentRoleFallback(noteId, userId);
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
