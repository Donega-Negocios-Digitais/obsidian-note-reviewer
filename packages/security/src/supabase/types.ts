/**
 * Authentication types for Supabase integration
 *
 * Extends Supabase types with application-specific auth types
 */

import type { User, Session, AuthError } from '@supabase/supabase-js'

/**
 * OAuth provider types supported
 */
export type OAuthProvider = 'github' | 'google'

/**
 * Authentication state in the application
 */
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: AuthError | null
}

/**
 * OAuth login options
 */
export interface OAuthLoginOptions {
  /**
   * Where to redirect after OAuth flow
   * Defaults to current page
   */
  redirectTo?: string

  /**
   * Additional scopes to request
   */
  scopes?: string

  /**
   * Whether to show OAuth provider selection screen
   */
  skipBrowserRedirect?: boolean
}

/**
 * Email/password signup options
 */
export interface EmailSignUpOptions {
  email: string
  password: string
  displayName?: string
}

/**
 * Profile data (user metadata)
 */
export interface UserProfile {
  display_name: string
  avatar_url?: string
  full_name?: string
}

/**
 * Auth context type for React provider
 */
export interface AuthContextValue extends AuthState {
  /**
   * Sign in with OAuth provider
   */
  signInWithOAuth: (provider: OAuthProvider, options?: OAuthLoginOptions) => Promise<void>

  /**
   * Sign in with email and password
   */
  signInWithEmail: (email: string, password: string) => Promise<void>

  /**
   * Sign up with email and password
   */
  signUpWithEmail: (options: EmailSignUpOptions) => Promise<void>

  /**
   * Sign out current user
   */
  signOut: () => Promise<void>

  /**
   * Update user profile
   */
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>

  /**
   * Refresh the session
   */
  refreshSession: () => Promise<void>
}
