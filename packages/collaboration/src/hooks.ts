/**
 * React hooks for real-time collaboration with Liveblocks
 *
 * Provides presence tracking and cursor sharing functionality.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@obsidian-note-reviewer/security/auth'
import type {
  PresenceUser,
  RoomInfo,
  PresenceState,
} from '@obsidian-note-reviewer/collaboration'

/**
 * Hook for real-time presence in a document
 *
 * Tracks which users are currently viewing/editing a document
 * and provides their cursor positions.
 */
export function useDocumentPresence(documentId: string) {
  const { user } = useAuth()
  const [presence, setPresence] = useState<PresenceState>({
    users: [],
    connected: false,
  })
  const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null)
  const liveblocksRef = useRef<any>(null)

  // Initialize Liveblocks connection
  useEffect(() => {
    if (!documentId || !user) {
      return
    }

    let mounted = true
    let room: any = null

    async function connect() {
      try {
        // Dynamically import Liveblocks to avoid SSR issues
        const { createClient } = await import('@liveblocks/client')
        const LiveblocksClient = createClient({
          publicKey: getLiveblocksKey(),
        })

        // Get current user info
        const currentUser: PresenceUser = {
          id: user.id,
          name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Anônimo',
          avatar: user.user_metadata?.avatar_url,
          color: getUserColor(user.id),
        }

        // Enter the room
        room = LiveblocksClient.enterRoom(`doc-${documentId}`, {
          initialPresence: {
            ...currentUser,
            cursor: null,
          },
        })

        if (!mounted) return

        liveblocksRef.current = { client: LiveblocksClient, room }

        // Subscribe to presence updates
        const { unsubscribe } = room.subscribe('presence', (presence: any) => {
          if (!mounted) return

          const users = Object.values(presence).filter((p: any) => p.userId !== user.id) as PresenceUser[]

          setPresence({
            users,
            connected: true,
          })

          setRoomInfo({
            id: `doc-${documentId}`,
            documentId,
          })
        })

        // Cleanup on unmount
        return () => {
          unsubscribe()
          if (room) {
            LiveblocksClient.leaveRoom(`doc-${documentId}`)
          }
        }
      } catch (error) {
        console.error('Failed to connect to Liveblocks:', error)
        setPresence({
          users: [],
          connected: false,
        })
      }
    }

    connect()

    return () => {
      mounted = false
      if (liveblocksRef.current?.room) {
        liveblocksRef.current.room.unsubscribe()
      }
    }
  }, [documentId, user])

  /**
   * Update current user's cursor position
   */
  const updateCursor = useCallback((x: number, y: number) => {
    if (!liveblocksRef.current?.room || !user) return

    liveblocksRef.current.room.updatePresence({
      cursor: { x, y },
    })
  }, [user])

  /**
   * Clear current user's cursor
   */
  const clearCursor = useCallback(() => {
    if (!liveblocksRef.current?.room || !user) return

    liveblocksRef.current.room.updatePresence({
      cursor: null,
    })
  }, [user])

  /**
   * Disconnect from the room
   */
  const disconnect = useCallback(() => {
    if (!liveblocksRef.current) return

    const { client, room } = liveblocksRef.current
    room.unsubscribe()
    client.leaveRoom(`doc-${documentId}`)
    liveblocksRef.current = null

    setPresence({
      users: [],
      connected: false,
    })
    setRoomInfo(null)
  }, [documentId])

  return {
    presence,
    roomInfo,
    updateCursor,
    clearCursor,
    disconnect,
  }
}

/**
 * Hook for tracking cursor position on mouse move
 *
 * Automatically updates cursor position when mouse moves over a container
 */
export function useCursorTracking(
  containerRef: React.RefObject<HTMLElement>,
  updateCursor: (x: number, y: number) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    let rafId: number | null = null

    const handleMouseMove = (e: MouseEvent) => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }

      rafId = requestAnimationFrame(() => {
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        // Only update if cursor is within container
        if (x >= 0 && y >= 0 && x <= rect.width && y <= rect.height) {
          updateCursor(x, y)
        }

        rafId = null
      })
    }

    const handleMouseLeave = () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      updateCursor(-1, -1) // Special value for "out of bounds"
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [containerRef, updateCursor, enabled])
}

// Helper functions

function getLiveblocksKey(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_LIVEBLOCKS_PUBLIC_KEY) {
    return import.meta.env.VITE_LIVEBLOCKS_PUBLIC_KEY
  }

  // Fallback for development
  return 'pk-dev_Ns3kq1LMvJY7xKL7q3qIWRj8'
}

function getUserColor(userId: string): string {
  const colors = [
    '#EF4444', '#F97316', '#F59E0B', '#EAB308',
    '#84CC16', '#22C55E', '#10B981', '#14B8A6',
    '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
    '#8B5CF6', '#A855F7', '#D946EF', '#EC4899',
  ]

  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }

  return colors[Math.abs(hash) % colors.length]
}

// Types
export interface UseDocumentPresenceReturn {
  presence: PresenceState
  roomInfo: RoomInfo | null
  updateCursor: (x: number, y: number) => void
  clearCursor: () => void
  disconnect: () => void
}
