/**
 * Liveblocks Room Provider Wrapper
 *
 * Provides Liveblocks real-time collaboration context to the app.
 * Wraps the Liveblocks RoomProvider with application-specific configuration.
 */

import { ReactNode } from "react";
import { RoomProvider as LiveblocksRoomProvider } from "@liveblocks/react";

/**
 * Initial presence structure for users in the room
 */
export interface UserPresence {
  name: string;
  avatar?: string;
  color: string;
  cursor?: { x: number; y: number };
  isTyping?: boolean;
}

/**
 * Props for the collaboration room provider
 */
export interface CollaborationRoomProps {
  children: ReactNode;
  documentId: string;
  initialPresence?: UserPresence;
}

/**
 * Room provider wrapper for Liveblocks collaboration
 *
 * Creates a Liveblocks room for the document with the given ID.
 * All children will have access to Liveblocks hooks for presence,
 * cursors, and real-time updates.
 *
 * Room IDs follow the pattern: doc-{documentId}
 *
 * @example
 * ```tsx
 * <CollaborationRoom documentId="note-123">
 *   <YourApp />
 * </CollaborationRoom>
 * ```
 */
export function CollaborationRoom({
  children,
  documentId,
  initialPresence = {
    name: "Anonymous",
    color: "#3B82F6",
  },
}: CollaborationRoomProps) {
  const roomId = `doc-${documentId}`;

  return (
    <LiveblocksRoomProvider
      id={roomId}
      initialPresence={initialPresence}
    >
      {children}
    </LiveblocksRoomProvider>
  );
}

/**
 * Hook to get the current room ID for a document
 *
 * Useful for linking to shared documents or debugging.
 *
 * @param documentId - The document ID
 * @returns The Liveblocks room ID
 */
export function getRoomId(documentId: string): string {
  return `doc-${documentId}`;
}
