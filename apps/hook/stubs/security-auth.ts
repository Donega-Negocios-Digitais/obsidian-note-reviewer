/**
 * Stub for @obsidian-note-reviewer/security/auth
 * Used in hook app where Supabase auth is not available
 */

export function useAuth() {
  return {
    user: null,
    session: null,
    loading: false,
    signIn: async () => {},
    signOut: async () => {},
    updateProfile: async () => {},
  };
}
