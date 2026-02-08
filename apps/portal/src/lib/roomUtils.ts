/**
 * Room Utilities
 *
 * Generate consistent room IDs for Liveblocks collaboration.
 */

/**
 * Get room ID for a document
 * Format: doc-{documentId}
 */
export function getRoomId(documentId: string): string {
  return `doc-${documentId}`;
}

/**
 * Extract document ID from room ID
 * Format: doc-{documentId} -> {documentId}
 */
export function getDocumentIdFromRoom(roomId: string): string | null {
  const match = roomId.match(/^doc-(.+)$/);
  return match ? match[1] : null;
}
