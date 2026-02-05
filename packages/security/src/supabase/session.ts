/**
 * Session utilities for Supabase authentication
 *
 * Provides helper functions for session management, validation,
 * and timeout handling in Vite SPA
 */

import type { Session } from '@supabase/supabase-js'

/**
 * Get time until session expires in milliseconds
 *
 * @param session - Supabase session object
 * @returns Milliseconds until expiry, or 0 if session is invalid/expired
 *
 * @example
 * ```ts
 * const msUntilExpiry = getTimeUntilSessionExpiry(session)
 * if (msUntilExpiry < 300000) { // Less than 5 minutes
 *   // Show warning or refresh
 * }
 * ```
 */
export function getTimeUntilSessionExpiry(session: Session | null): number {
  if (!session) {
    return 0
  }

  const expiresAt = session.expires_at
  if (!expiresAt) {
    // Session doesn't expire (shouldn't happen with Supabase)
    return Number.MAX_SAFE_INTEGER
  }

  const now = Math.floor(Date.now() / 1000)
  const secondsUntilExpiry = expiresAt - now

  return Math.max(0, secondsUntilExpiry * 1000)
}

/**
 * Check if session is valid and not expired
 *
 * @param session - Supabase session object
 * @returns true if session is valid and not expired
 *
 * @example
 * ```ts
 * if (isSessionValid(session)) {
 *   // Session is active
 * }
 * ```
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) {
    return false
  }

  const expiresAt = session.expires_at
  if (!expiresAt) {
    // Session without expiry is considered valid
    return true
  }

  const now = Math.floor(Date.now() / 1000)
  return expiresAt > now
}

/**
 * Get session age in milliseconds
 *
 * @param session - Supabase session object
 * @returns Age of session in milliseconds, or 0 if session is invalid
 *
 * @example
 * ```ts
 * const age = getSessionAge(session)
 * console.log(`Session is ${age / 1000 / 60} minutes old`)
 * ```
 */
export function getSessionAge(session: Session | null): number {
  if (!session) {
    return 0
  }

  const createdAt = session.user?.created_at || session.user?.updated_at
  if (!createdAt) {
    return 0
  }

  const createdTime = new Date(createdAt).getTime()
  return Date.now() - createdTime
}

/**
 * Check if session is nearing expiry
 *
 * @param session - Supabase session object
 * @param warningMinutes - Minutes before expiry to consider "nearing" (default: 5)
 * @returns true if session will expire within warning window
 *
 * @example
 * ```ts
 * if (isSessionNearingExpiry(session, 5)) {
 *   // Show "session expiring soon" warning
 * }
 * ```
 */
export function isSessionNearingExpiry(
  session: Session | null,
  warningMinutes: number = 5
): boolean {
  const msUntilExpiry = getTimeUntilSessionExpiry(session)
  const warningMs = warningMinutes * 60 * 1000

  return msUntilExpiry > 0 && msUntilExpiry <= warningMs
}

/**
 * Format session expiry time for display
 *
 * @param session - Supabase session object
 * @returns Formatted expiry time or "Invalid session"
 *
 * @example
 * ```ts
 * console.log(formatSessionExpiry(session)) // "Expires in 2h 34m"
 * ```
 */
export function formatSessionExpiry(session: Session | null): string {
  if (!session) {
    return 'Invalid session'
  }

  const msUntilExpiry = getTimeUntilSessionExpiry(session)

  if (msUntilExpiry === 0) {
    return 'Expired'
  }

  if (msUntilExpiry === Number.MAX_SAFE_INTEGER) {
    return 'Never expires'
  }

  const hours = Math.floor(msUntilExpiry / (1000 * 60 * 60))
  const minutes = Math.floor((msUntilExpiry % (1000 * 60 * 60)) / (1000 * 60))

  if (hours > 0) {
    return `Expires in ${hours}h ${minutes}m`
  }
  return `Expires in ${minutes}m`
}

/**
 * Session info object for debugging
 */
export interface SessionInfo {
  isValid: boolean
  isNearingExpiry: boolean
  expiresAt: Date | null
  msUntilExpiry: number
  age: number
  formattedExpiry: string
}

/**
 * Get comprehensive session information
 *
 * @param session - Supabase session object
 * @param warningMinutes - Minutes before expiry to consider "nearing" (default: 5)
 * @returns Session info object with all details
 *
 * @example
 * ```ts
 * const info = getSessionInfo(session)
 * console.log('Session valid:', info.isValid)
 * console.log('Expires:', info.formattedExpiry)
 * ```
 */
export function getSessionInfo(
  session: Session | null,
  warningMinutes: number = 5
): SessionInfo {
  const msUntilExpiry = getTimeUntilSessionExpiry(session)
  const expiresAt = session?.expires_at
    ? new Date(session.expires_at * 1000)
    : null

  return {
    isValid: isSessionValid(session),
    isNearingExpiry: isSessionNearingExpiry(session, warningMinutes),
    expiresAt,
    msUntilExpiry,
    age: getSessionAge(session),
    formattedExpiry: formatSessionExpiry(session),
  }
}

/**
 * Calculate refresh interval based on session expiry
 *
 * Returns an interval that will refresh the token before it expires,
 * ensuring a buffer for network delays
 *
 * @param session - Supabase session object
 * @param bufferMinutes - Buffer time before expiry in minutes (default: 5)
 * @returns Refresh interval in milliseconds, or null if session is invalid
 *
 * @example
 * ```ts
 * const interval = getRefreshInterval(session)
 * if (interval) {
 *   setTimeout(() => refreshSession(), interval)
 * }
 * ```
 */
export function getRefreshInterval(
  session: Session | null,
  bufferMinutes: number = 5
): number | null {
  const msUntilExpiry = getTimeUntilSessionExpiry(session)

  if (msUntilExpiry === 0) {
    return null // Session expired
  }

  // Refresh before expiry with buffer
  const bufferMs = bufferMinutes * 60 * 1000
  const refreshAt = msUntilExpiry - bufferMs

  // Refresh immediately if less than buffer time remaining
  return Math.max(0, refreshAt)
}
