/**
 * Stub for @obsidian-note-reviewer/security/supabase/storage
 * Used in hook app where Supabase storage is not available
 */

export async function uploadAvatar(_userId: string, _file: File): Promise<string> {
  return '';
}

export function getAvatarUrl(_user: any): string | null {
  return null;
}
