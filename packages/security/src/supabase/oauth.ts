/**
 * OAuth helper functions for GitHub and Google authentication
 *
 * Uses PKCE flow (not implicit) for better security
 */

import type { OAuthProvider, OAuthLoginOptions } from './types.js'
import { supabase } from './client.js'

/**
 * OAuth provider configurations
 */
const OAUTH_PROVIDERS: Record<OAuthProvider, string> = {
  github: 'github',
  google: 'google',
}

/**
 * Sign in with OAuth provider (GitHub or Google)
 *
 * @param provider - 'github' or 'google'
 * @param options - OAuth options including redirect URL
 *
 * @example
 * ```ts
 * // Basic OAuth login
 * await signInWithOAuth('google')
 *
 * // With custom redirect
 * await signInWithOAuth('github', { redirectTo: '/dashboard' })
 *
 * // With additional scopes
 * await signInWithOAuth('github', { scopes: 'read:user user:email' })
 * ```
 */
export async function signInWithOAuth(
  provider: OAuthProvider,
  options: OAuthLoginOptions = {}
): Promise<void> {
  const { redirectTo, scopes, skipBrowserRedirect } = options

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: OAUTH_PROVIDERS[provider],
    options: {
      redirectTo: redirectTo || `${getWindowOrigin()}/auth/callback`,
      scopes,
      skipBrowserRedirect,
    },
  })

  if (error) {
    throw new Error(`OAuth sign in failed: ${error.message}`)
  }

  // If not skipping browser redirect, Supabase will handle the redirect
  return data?.provider
}

/**
 * Get current window origin for redirect
 * Falls back to localhost if origin cannot be determined
 */
function getWindowOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin
  }
  return 'http://localhost:5173'
}

/**
 * Handle OAuth callback (called after redirect back from OAuth provider)
 *
 * This is typically called in a useEffect on the callback page
 *
 * @example
 * ```tsx
 * useEffect(() => {
 *   handleOAuthCallback().then(({ session, user }) => {
 *     // Handle successful authentication
 *   })
 * }, [])
 * ```
 */
export async function handleOAuthCallback() {
  const { data, error } = await supabase.auth.getSession()

  if (error) {
    throw new Error(`OAuth callback failed: ${error.message}`)
  }

  return {
    session: data.session,
    user: data.session?.user ?? null,
  }
}

/**
 * Get the current OAuth provider for the user
 *
 * @returns The OAuth provider name or null if not logged in with OAuth
 */
export async function getCurrentOAuthProvider(): Promise<OAuthProvider | null> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    return null
  }

  // Check if user has an identity from an OAuth provider
  const identities = session.user.identities ?? []
  if (identities.length === 0) {
    return null
  }

  const provider = identities[0].provider as OAuthProvider

  // Validate it's a supported provider
  if (provider === 'github' || provider === 'google') {
    return provider
  }

  return null
}

/**
 * Link an OAuth provider to the current user
 *
 * Useful for adding GitHub login to an email account, etc.
 *
 * @param provider - 'github' or 'google'
 */
export async function linkOAuthProvider(provider: OAuthProvider): Promise<void> {
  const { data, error } = await supabase.auth.linkIdentity({
    provider: OAUTH_PROVIDERS[provider],
  })

  if (error) {
    throw new Error(`Failed to link ${provider}: ${error.message}`)
  }

  return data
}

/**
 * Unlink an OAuth provider from the current user
 *
 * @param provider - 'github' or 'google'
 */
export async function unlinkOAuthProvider(provider: OAuthProvider): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    throw new Error('No user session found')
  }

  // Find the identity for this provider
  const identity = session.user.identities?.find(
    (id) => id.provider === OAUTH_PROVIDERS[provider]
  )

  if (!identity) {
    throw new Error(`No ${provider} identity found for this user`)
  }

  const { error } = await supabase.auth.unlinkIdentity(identity)

  if (error) {
    throw new Error(`Failed to unlink ${provider}: ${error.message}`)
  }
}
