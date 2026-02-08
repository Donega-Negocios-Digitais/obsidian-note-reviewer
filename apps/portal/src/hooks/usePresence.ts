/**
 * Presence Hook
 *
 * React hook for real-time presence state using Liveblocks.
 */

import { useEffect, useState, useRef } from 'react';
import type { PresenceUser } from '@obsidian-note-reviewer/collaboration';

export interface UsePresenceOptions {
  roomId: string;
  enabled?: boolean;
}

export interface PresenceState {
  others: PresenceUser[];
  connected: boolean;
}

/**
 * React hook for real-time presence in a room
 *
 * @param options - Room ID and enable flag
 * @returns Presence state with others and connected status
 */
export function usePresence({ roomId, enabled = true }: UsePresenceOptions) {
  const [state, setState] = useState<PresenceState>({
    others: [],
    connected: false,
  });

  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!enabled || !roomId) {
      // Cleanup if disabled
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      setState({ others: [], connected: false });
      return;
    }

    let mounted = true;

    const initPresence = async () => {
      try {
        // Dynamic import to avoid SSR issues and load on demand
        const { enterRoom, leaveRoom } = await import('@obsidian-note-reviewer/collaboration');

        const room = enterRoom(roomId);

        // Subscribe to presence updates
        const unsubscribe = room.subscribe('others', (others) => {
          if (!mounted) return;

          const othersList = others.map((other: any) => other.presence).filter(Boolean);

          setState({
            others: othersList,
            connected: true,
          });
        });

        // Also subscribe to connection status
        const unsubscribeStatus = room.subscribe('status', (status) => {
          if (!mounted) return;

          setState((prev) => ({
            ...prev,
            connected: status === 'connected',
          }));
        });

        cleanupRef.current = () => {
          unsubscribe();
          unsubscribeStatus();
          leaveRoom(roomId);
        };
      } catch (error) {
        console.error('Failed to initialize presence:', error);
        if (mounted) {
          setState((prev) => ({ ...prev, connected: false }));
        }
      }
    };

    initPresence();

    return () => {
      mounted = false;
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [roomId, enabled]);

  return state;
}

/**
 * Hook to get current user info
 */
export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<PresenceUser | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { getCurrentUser } = await import('@obsidian-note-reviewer/collaboration');
        setCurrentUser(getCurrentUser());
      } catch (error) {
        console.error('Failed to get current user:', error);
      }
    };

    getUser();
  }, []);

  return currentUser;
}
