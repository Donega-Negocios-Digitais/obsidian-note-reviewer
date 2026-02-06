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
