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
export type InviteErrorCode =
  | 'auth_required'
  | 'permission_denied'
  | 'document_not_found'
  | 'already_collaborator'
  | 'invite_exists'
  | 'database_outdated'
  | 'unknown';

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
  errorCode?: InviteErrorCode;
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

function isCollaboratorStatus(value: unknown): value is CollaboratorStatus {
  return value === 'active' || value === 'pending' || value === 'inactive';
}

function hasInviteManagementCapability(value: unknown): boolean {
  const capabilities = normalizeCapabilities(value);
  return capabilities.invite || capabilities.manage_permissions;
}

function normalizeCollaboratorDisplayEmail(email: unknown, userId: string): string {
  const normalized = typeof email === 'string' ? email.trim() : '';
  if (normalized.length > 0) {
    return normalized;
  }

  return `colaborador-${userId.slice(0, 8)}@indisponivel.local`;
}

function normalizeCollaboratorDisplayName(
  name: unknown,
  email: string,
  userId: string,
): string {
  const normalized = typeof name === 'string' ? name.trim() : '';
  if (normalized.length > 0) {
    return normalized;
  }

  if (email.includes('@')) {
    return email.split('@')[0];
  }

  return `Colaborador ${userId.slice(0, 8)}`;
}

function mapCollaboratorRecord(record: Record<string, unknown>): Collaborator {
  const userId = String(record.user_id || '');
  const createdAt = typeof record.created_at === 'string' ? record.created_at : new Date().toISOString();
  const invitedAt = typeof record.invited_at === 'string' ? record.invited_at : createdAt;
  const updatedAt = typeof record.updated_at === 'string' ? record.updated_at : createdAt;
  const roleValue = record.role;
  const statusValue = record.status;
  const role = isCollaboratorRole(roleValue) ? roleValue : 'viewer';
  const status = isCollaboratorStatus(statusValue) ? statusValue : 'inactive';
  const email = normalizeCollaboratorDisplayEmail(record.email, userId);
  const name = normalizeCollaboratorDisplayName(record.name, email, userId);
  const avatarUrl = typeof record.avatar_url === 'string' ? record.avatar_url : undefined;

  return {
    id: String(record.collaborator_id || record.id || userId),
    noteId: String(record.note_id || ''),
    userId,
    role,
    status,
    capabilities: normalizeCapabilities(record.capabilities),
    invitedBy: typeof record.invited_by === 'string' ? record.invited_by : undefined,
    invitedAt,
    acceptedAt: typeof record.accepted_at === 'string' ? record.accepted_at : undefined,
    createdAt,
    updatedAt,
    user: {
      id: userId,
      email,
      name,
      avatarUrl,
    },
  };
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

type RpcErrorLike = {
  code?: string;
  message?: string;
  details?: string;
};

function parseRpcError(error: unknown): RpcErrorLike {
  return (error && typeof error === 'object' ? error : {}) as RpcErrorLike;
}

function isDocumentCollaboratorUserForeignKeyError(error: unknown): boolean {
  const rpcError = parseRpcError(error);
  const message = String(rpcError.message || '').toLowerCase();
  const details = String(rpcError.details || '').toLowerCase();

  if (rpcError.code === '23503' && message.includes('document_collaborators_user_id_fkey')) {
    return true;
  }

  return (
    message.includes('violates foreign key constraint')
    && (message.includes('document_collaborators_user_id_fkey') || details.includes('document_collaborators_user_id_fkey'))
  );
}

function isProfileSyncError(error: unknown): boolean {
  const rpcError = parseRpcError(error);
  const message = String(rpcError.message || '').toLowerCase();
  return (
    message.includes('unable to resolve current user profile')
    || message.includes('user not found')
    || message.includes('perfil')
  );
}

function mapInviteError(error: unknown): { message: string; code: InviteErrorCode } {
  const rpcError = parseRpcError(error);
  const message = String(rpcError.message || '').trim();
  const normalizedMessage = message.toLowerCase();
  const details = String(rpcError.details || '').toLowerCase();

  if (normalizedMessage.includes('authentication required')) {
    return { message: message || 'Authentication required', code: 'auth_required' };
  }

  if (
    normalizedMessage.includes('you only have read permission on this document')
    || normalizedMessage.includes('you do not have permission to invite collaborators')
  ) {
    return { message: message || 'You do not have permission to invite collaborators', code: 'permission_denied' };
  }

  if (normalizedMessage.includes('document not found')) {
    return { message: message || 'Document not found', code: 'document_not_found' };
  }

  if (normalizedMessage.includes('this user already has access to the document')) {
    return { message: message || 'This user already has access to the document', code: 'already_collaborator' };
  }

  if (normalizedMessage.includes('a pending invite already exists for this email')) {
    return { message: message || 'A pending invite already exists for this email', code: 'invite_exists' };
  }

  if (isMissingRpcFunction(rpcError, 'create_document_invite') || isMissingRpcFunction(rpcError, 'invite_to_document')) {
    return {
      message: 'Banco desatualizado. Rode as migrations de colaboração e recarregue o schema cache do Supabase.',
      code: 'database_outdated',
    };
  }

  if (isMissingDatabaseFunction(rpcError, 'can_manage_collaborators')) {
    return {
      message: 'Banco desatualizado. Rode as migrations de colaboração e recarregue o schema cache do Supabase.',
      code: 'database_outdated',
    };
  }

  if (normalizedMessage.includes('violates foreign key constraint') && details.includes('document_collaborators_user_id_fkey')) {
    return {
      message: 'Perfil da conta ainda não sincronizado. Saia e entre novamente para concluir o convite.',
      code: 'auth_required',
    };
  }

  return { message: message || 'Failed to send invite', code: 'unknown' };
}

async function getInviteNoteIdByToken(token: string): Promise<string | null> {
  const { data: inviteRow } = await supabase
    .from('document_invites')
    .select('note_id')
    .eq('token', token)
    .maybeSingle();

  return typeof inviteRow?.note_id === 'string' ? inviteRow.note_id : null;
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
      errorCode: 'auth_required',
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
        errorCode: 'database_outdated',
      };
    }

    const mapped = mapInviteError(error);
    return { success: false, error: mapped.message, errorCode: mapped.code };
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

  const noteIdFromInvite = await getInviteNoteIdByToken(token);
  let linkedUserId = userId;

  try {
    const { data: linkedData } = await supabase.rpc('ensure_public_user_linked', {
      p_auth_user_id: userId,
    });

    if (typeof linkedData === 'string' && linkedData.length > 0) {
      linkedUserId = linkedData;
    } else if (Array.isArray(linkedData) && typeof linkedData[0] === 'string' && linkedData[0].length > 0) {
      linkedUserId = linkedData[0];
    }
  } catch {
    // Best-effort only; legacy path keeps previous behavior if relink RPC is unavailable.
  }

  const { data, error } = await supabase.rpc('accept_document_invite', {
    invite_token: token,
    user_uuid: linkedUserId,
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

async function revokePublicSharingAfterRemoval(noteId: string): Promise<void> {
  const { error } = await supabase
    .from('notes')
    .update({
      is_public: false,
      share_hash: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId);

  if (error) {
    // Best-effort fallback: backend migration enforces this consistently.
    console.warn('Failed to revoke public sharing after collaborator removal:', error);
  }
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
  const { data: rpcData, error: rpcError } = await supabase.rpc(
    'get_document_collaborators_with_identity',
    {
      note_uuid: noteId,
      include_inactive: includeInactive,
    },
  );

  if (!rpcError && Array.isArray(rpcData)) {
    return rpcData.map((row: any) => mapCollaboratorRecord(row as Record<string, unknown>));
  }

  if (rpcError && !isMissingRpcFunction(rpcError, 'get_document_collaborators_with_identity')) {
    console.warn('get_document_collaborators_with_identity failed, falling back to legacy query:', rpcError);
  }

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

  return (data || []).map((collab: any) =>
    mapCollaboratorRecord({
      collaborator_id: collab.id,
      note_id: collab.note_id,
      user_id: collab.user_id,
      role: collab.role,
      status: collab.status,
      capabilities: collab.capabilities,
      invited_by: collab.invited_by,
      invited_at: collab.invited_at,
      accepted_at: collab.accepted_at,
      created_at: collab.created_at,
      updated_at: collab.updated_at,
      email: collab.user?.email,
      name: collab.user?.name,
      avatar_url: collab.user?.avatar_url,
    }),
  );
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

      const mapped = mapInviteError(error);
      return { success: false, error: mapped.message, errorCode: mapped.code };
    }

    return mapInviteResult(data);
  } catch (error: any) {
    const mapped = mapInviteError(error);
    return { success: false, error: mapped.message, errorCode: mapped.code };
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
    await revokePublicSharingAfterRemoval(noteId);
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
      await revokePublicSharingAfterRemoval(noteId);
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
 * Get pending invites addressed to the current authenticated user's email.
 */
export async function getMyPendingInvites(): Promise<DocumentInvite[]> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const email = authData?.user?.email?.trim().toLowerCase();

  if (authError || !email) {
    return [];
  }

  const { data, error } = await supabase
    .from('document_invites')
    .select('*')
    .eq('status', 'pending')
    .eq('email', email)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching current user invites:', error);
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

    if (isDocumentCollaboratorUserForeignKeyError(error) || isProfileSyncError(error)) {
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      if (userId) {
        try {
          await supabase.rpc('ensure_public_user_linked', { p_auth_user_id: userId });

          const retry = await supabase.rpc('accept_document_invite', {
            invite_token: token,
          });

          if (!retry.error) {
            if (typeof retry.data === 'string' && retry.data.length > 0) {
              return retry.data;
            }

            if (retry.data === true) {
              return getInviteNoteIdByToken(token);
            }
          }
        } catch {
          // Fall through to generic error handling below.
        }
      }
    }

    console.error('Error accepting invite:', error);
    return null;
  }

  if (typeof data === 'string' && data.length > 0) {
    return data;
  }

  if (data === true) {
    return getInviteNoteIdByToken(token);
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

/**
 * Check whether current authenticated user can invite collaborators on a document.
 * Uses RPC when available and falls back to role/capability lookup for drifted schemas.
 */
export async function canInviteCollaborators(noteId: string): Promise<boolean> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  const userId = authData?.user?.id;

  if (authError || !userId) {
    return false;
  }

  const { data, error } = await supabase.rpc('can_manage_collaborators', {
    note_uuid: noteId,
    user_uuid: userId,
  });

  if (!error && typeof data === 'boolean') {
    return data;
  }

  // Fallback for missing functions or RPC resolution issues.
  if (
    error
    && (
      isMissingRpcFunction(error, 'can_manage_collaborators')
      || isMissingDatabaseFunction(error, 'can_manage_collaborators')
    )
  ) {
    const role = await getUserDocumentRole(noteId, userId);
    if (role === 'owner') {
      return true;
    }

    if (role === 'none') {
      return false;
    }

    const { data: collaborator } = await supabase
      .from('document_collaborators')
      .select('status,capabilities')
      .eq('note_id', noteId)
      .eq('user_id', userId)
      .maybeSingle();

    return collaborator?.status === 'active' && hasInviteManagementCapability(collaborator?.capabilities);
  }

  return false;
}
