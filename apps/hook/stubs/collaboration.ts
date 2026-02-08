/**
 * Stub for @obsidian-note-reviewer/collaboration
 * Used in hook app where collaboration features are not available
 */

export type CollaboratorRole = 'owner' | 'editor' | 'viewer';

export interface Collaborator {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  role: CollaboratorRole;
  status: 'active' | 'pending' | 'expired';
}

export async function getDocumentCollaborators(_documentId: string): Promise<Collaborator[]> {
  return [];
}

export async function inviteCollaborator(_opts: any): Promise<void> {}

export async function removeCollaborator(_opts: any): Promise<void> {}
