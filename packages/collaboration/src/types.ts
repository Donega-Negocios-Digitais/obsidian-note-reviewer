/**
 * Real-time collaboration types
 *
 * Type definitions for Liveblocks-based presence and cursor tracking.
 */

export interface LiveblocksConfig {
  publicKey: string;
  baseUrl?: string;
}

export interface PresenceUser {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
}

export interface RoomInfo {
  id: string;
  documentId: string;
}

export interface PresenceState {
  users: PresenceUser[];
  connected: boolean;
}

// ============================================
// Shareable Links Types (05-02)
// ============================================

export interface ShareableLink {
  id: string;
  documentId: string;
  slug: string;
  createdBy: string;
  createdAt: Date;
  expiresAt?: Date;
  accessCount: number;
}

export interface SlugValidation {
  valid: boolean;
  available: boolean;
  error?: string;
}
