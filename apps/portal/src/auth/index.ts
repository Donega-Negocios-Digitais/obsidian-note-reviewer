/**
 * Auth utilities barrel
 *
 * Re-exports auth utilities from security package
 * for convenient importing in Portal app
 */

export {
  AuthProvider,
  useAuth,
  useCurrentUser,
  useIsAuthenticated,
  withAuth,
} from '@obsidian-note-reviewer/security/auth'

export type {
  AuthState,
  AuthContextValue,
  OAuthLoginOptions,
  EmailSignUpOptions,
  UserProfile,
} from '@obsidian-note-reviewer/security/supabase/types'

export { supabase } from '@obsidian-note-reviewer/security/supabase/client'

export {
  signInWithOAuth,
  handleOAuthCallback,
  getCurrentOAuthProvider,
  linkOAuthProvider,
  unlinkOAuthProvider,
} from '@obsidian-note-reviewer/security/supabase/oauth'
