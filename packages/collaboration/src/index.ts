/**
 * Liveblocks Integration
 *
 * Real-time presence and cursor tracking for collaborative reviews.
 */

import { createClient } from '@liveblocks/client';
import type { LiveblocksConfig, PresenceUser, RoomInfo, PresenceState } from './types';

let liveblocksClient: ReturnType<typeof createClient> | null = null;
let currentUser: PresenceUser | null = null;

/**
 * Get or create Liveblocks client
 */
export function createLiveblocksClient(config: LiveblocksConfig) {
  if (liveblocksClient) {
    return liveblocksClient;
  }

  liveblocksClient = createClient({
    publicKey: config.publicKey,
    baseUrl: config.baseUrl,
  });

  return liveblocksClient;
}

/**
 * Generate a consistent color for user based on their ID
 */
export function getUserColor(userId: string): string {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

/**
 * Get current user info from auth or generate anonymous user
 */
export function getCurrentUser(): PresenceUser {
  if (currentUser) {
    return currentUser;
  }

  // Try to get from Supabase session
  const supabase = (window as any)?.supabase;
  if (supabase?.auth?.user?.()) {
    const user = supabase.auth.user();
    currentUser = {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anônimo',
      avatar: user.user_metadata?.avatar_url,
      color: getUserColor(user.id),
    };
    return currentUser;
  }

  // Try localStorage for guest users
  const stored = localStorage.getItem('obsreview-user');
  if (stored) {
    const parsed = JSON.parse(stored);
    currentUser = {
      id: parsed.id || 'anonymous',
      name: parsed.name || 'Visitante',
      avatar: parsed.avatar,
      color: getUserColor(parsed.id || 'anonymous'),
    };
    return currentUser;
  }

  // Generate new anonymous user
  const anonId = `anon-${Math.random().toString(36).slice(2, 8)}`;
  currentUser = {
    id: anonId,
    name: 'Visitante',
    color: getUserColor(anonId),
  };

  localStorage.setItem('obsreview-user', JSON.stringify({
    id: anonId,
    name: 'Visitante',
  }));

  return currentUser;
}

/**
 * Enter a collaboration room
 */
export function enterRoom(roomId: string) {
  const client = createLiveblocksClient({
    publicKey: getPublicKey(),
  });

  return client.enterRoom(roomId, {
    initialPresence: getCurrentUser(),
  });
}

/**
 * Leave current room
 */
export function leaveRoom(roomId: string) {
  if (!liveblocksClient) return null;

  return liveblocksClient.leaveRoom(roomId);
}

/**
 * Get Liveblocks public key from env or use dev key
 */
function getPublicKey(): string {
  // Vite env vars are available on import.meta.env
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LIVEBLOCKS_PUBLIC_KEY) {
    return import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY;
  }

  // Fallback for development
  return 'pk-dev_Ns3kq1LMvJY7xKL7q3qIWRj8';
}

// Export types
export type { LiveblocksConfig, PresenceUser, RoomInfo, PresenceState };

// Export collaborators API
export {
  getDocumentCollaborators,
  inviteCollaborator,
  removeCollaborator,
  deactivateCollaborator,
  reactivateCollaborator,
  updateCollaboratorRole,
  updateCollaboratorCapability,
  getDocumentInvites,
  acceptInvite,
  declineInvite,
  cancelInvite,
  checkDocumentAccess,
  getUserDocumentRole,
  getCurrentUserRole,
} from './collaborators';

export type {
  Collaborator,
  CollaboratorRole,
  CollaboratorCapability,
  CollaboratorCapabilities,
  CollaboratorStatus,
  DocumentInvite,
  InviteStatus,
  InviteResult,
  RemoveCollaboratorResult,
} from './collaborators';

// Export React hooks
export {
  useDocumentPresence,
  useCursorTracking,
} from './hooks';

export type {
  UseDocumentPresenceReturn,
} from './hooks';
