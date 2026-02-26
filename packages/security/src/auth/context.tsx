/**
 * React Auth Context for Supabase authentication
 *
 * Provides authentication state and methods throughout the app
 * Uses React Context API for global auth state management
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type {
  User,
  Session,
  AuthError,
} from '@supabase/supabase-js'
import {
  supabase,
} from '../supabase/client'
import { signInWithOAuth } from '../supabase/oauth'
import type {
  AuthState,
  AuthContextValue,
  OAuthProvider,
  OAuthLoginOptions,
  EmailSignUpOptions,
  UserProfile,
} from '../supabase/types'

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type ProviderPolicyRow = {
  email?: string | null
  allowed_providers?: string[] | null
  current_provider?: string | null
  is_allowed?: boolean | null
}

class AuthProviderPolicyError extends Error {
  code = 'AUTH_PROVIDER_NOT_ALLOWED'
  allowedProviders: string[]
  currentProvider: string

  constructor(currentProvider: string, allowedProviders: string[]) {
    const allowedLabel = formatProviderListPtBr(allowedProviders)
    const useLabel = allowedProviders.length === 1
      ? providerLabelPtBr(allowedProviders[0])
      : `um destes métodos: ${allowedLabel}`

    super(`Este e-mail está vinculado ao método ${allowedLabel}. Entre usando ${useLabel}.`)
    this.name = 'AuthProviderPolicyError'
    this.allowedProviders = allowedProviders
    this.currentProvider = currentProvider
  }
}

function providerLabelPtBr(provider: string): string {
  const normalized = (provider || '').trim().toLowerCase()
  if (normalized === 'google') return 'Google'
  if (normalized === 'github') return 'GitHub'
  return 'E-mail e senha'
}

function formatProviderListPtBr(providers: string[]): string {
  const labels = providers.map(providerLabelPtBr).filter(Boolean)
  if (labels.length === 0) return 'E-mail e senha'
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} ou ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')} ou ${labels[labels.length - 1]}`
}

function isMissingProviderPolicyRpc(error: unknown): boolean {
  const code = String((error as any)?.code || '').toUpperCase()
  const message = String((error as any)?.message || '').toLowerCase()
  const details = String((error as any)?.details || '').toLowerCase()

  if (code === 'PGRST202') return true

  if (code === '42883') {
    return message.includes('enforce_auth_provider_policy') || details.includes('enforce_auth_provider_policy')
  }

  return (
    (message.includes('could not find the function') || details.includes('could not find the function'))
    && (message.includes('enforce_auth_provider_policy') || details.includes('enforce_auth_provider_policy'))
  )
}

function parseProviderPolicyRow(data: unknown): ProviderPolicyRow | null {
  if (!data) return null
  const row = Array.isArray(data) ? data[0] : data
  if (!row || typeof row !== 'object') return null
  return row as ProviderPolicyRow
}

function isProviderPolicyViolation(error: unknown): error is AuthProviderPolicyError {
  return error instanceof AuthProviderPolicyError
}

async function enforceAuthProviderPolicyForCurrentSession(): Promise<void> {
  const { data, error } = await supabase.rpc('enforce_auth_provider_policy')

  if (error) {
    if (isMissingProviderPolicyRpc(error)) {
      // Keep backward compatibility while migration is rolling out.
      return
    }
    throw error
  }

  const row = parseProviderPolicyRow(data)
  if (!row || row.is_allowed !== false) {
    return
  }

  const currentProvider = String(row.current_provider || 'email').toLowerCase()
  const allowedProviders = Array.isArray(row.allowed_providers)
    ? row.allowed_providers.filter((provider): provider is string => typeof provider === 'string' && provider.length > 0)
    : ['email']

  throw new AuthProviderPolicyError(currentProvider, allowedProviders)
}

/**
 * Auth Provider Props
 */
export interface AuthProviderProps {
  children: React.ReactNode
}

/**
 * Auth Provider Component
 *
 * Wraps the app to provide authentication state and methods
 *
 * @example
 * ```tsx
 * <AuthProvider>
 *   <App />
 * </AuthProvider>
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps): React.ReactElement {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  })

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const ensureWorkspaceProfile = async () => {
      try {
        await supabase.rpc('resolve_current_user_profile')
      } catch {
        // Best-effort self-healing; auth flow must continue.
      }
    }

    async function initializeAuth() {
      try {
        console.log('🔐 [Auth] Inicializando auth...')
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession()

        console.log('🔐 [Auth] Sessão inicial:', !!session, 'Usuário:', session?.user?.email || 'nenhum', 'Erro:', error)

        if (session?.user) {
          try {
            await enforceAuthProviderPolicyForCurrentSession()
          } catch (providerError) {
            if (isProviderPolicyViolation(providerError)) {
              console.warn('⚠️ [Auth] Política de provedor bloqueou sessão inicial:', providerError)
              await supabase.auth.signOut({ scope: 'local' })
              if (mounted) {
                setState((prev) => ({
                  ...prev,
                  user: null,
                  session: null,
                  loading: false,
                  error: providerError as AuthError,
                }))
              }
              return
            }

            // Fail-open for transient migration/schema/runtime errors.
            console.warn('⚠️ [Auth] Falha técnica ao validar política de provedor (ignorado):', providerError)
          }
        }

        if (mounted) {
          setState((prev) => ({
            ...prev,
            user: session?.user ?? null,
            session,
            loading: false,
            error,
          }))
        }

        if (session?.user) {
          void ensureWorkspaceProfile()
        }
      } catch (error) {
        console.error('❌ [Auth] Erro ao inicializar:', error)
        if (mounted) {
          setState((prev) => ({
            ...prev,
            loading: false,
            error: error as AuthError,
          }))
        }
      }
    }

    initializeAuth()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔄 [Auth] Estado mudou:', event, 'Usuário:', session?.user?.email || 'nenhum')

      const applyAuthState = async () => {
        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          try {
            await enforceAuthProviderPolicyForCurrentSession()
          } catch (providerError) {
            if (isProviderPolicyViolation(providerError)) {
              console.warn('⚠️ [Auth] Sessão bloqueada por política de provedor:', providerError)
              await supabase.auth.signOut({ scope: 'local' })
              if (mounted) {
                setState((prev) => ({
                  ...prev,
                  user: null,
                  session: null,
                  loading: false,
                  error: providerError as AuthError,
                }))
              }
              return
            }

            // Fail-open for transient migration/schema/runtime errors.
            console.warn('⚠️ [Auth] Falha técnica ao validar política de provedor (ignorado):', providerError)
          }
        }

        if (mounted) {
          setState((prev) => ({
            ...prev,
            user: session?.user ?? null,
            session,
            loading: false,
          }))
        }

        if (session?.user && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
          void ensureWorkspaceProfile()
        }
      }

      void applyAuthState()
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Sign in with OAuth
  const handleSignInWithOAuth = useCallback(async (provider: OAuthProvider, options?: OAuthLoginOptions) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      await signInWithOAuth(provider, options)
      // State will be updated by onAuthStateChange listener
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as AuthError,
      }))
      throw error
    }
  }, [])

  // Sign in with email
  const handleSignInWithEmail = useCallback(async (email: string, password: string) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      try {
        await enforceAuthProviderPolicyForCurrentSession()
      } catch (providerError) {
        if (isProviderPolicyViolation(providerError)) {
          await supabase.auth.signOut({ scope: 'local' })
          throw providerError
        }

        // Fail-open for transient migration/schema/runtime errors.
        console.warn('⚠️ [Auth] Falha técnica ao validar política de provedor no login por e-mail (ignorado):', providerError)
      }

      setState((prev) => ({
        ...prev,
        user: data.user,
        session: data.session,
        loading: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as AuthError,
      }))
      throw error
    }
  }, [])

  // Sign up with email
  const handleSignUpWithEmail = useCallback(async (options: EmailSignUpOptions) => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const { email, password, displayName } = options

      console.log('🔐 [Auth] Tentando criar conta:', email)

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      })

      console.log('🔐 [Auth] Signup response:', { data, error })

      if (error) throw error

      setState((prev) => ({
        ...prev,
        user: data.user,
        session: data.session,
        loading: false,
      }))
    } catch (error) {
      console.error('❌ [Auth] Signup error:', error)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as AuthError,
      }))
      throw error
    }
  }, [])

  // Sign out
  const handleSignOut = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }))
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' })

      if (error) throw error

      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
      })
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as AuthError,
      }))
      throw error
    }
  }, [])

  // Update profile
  const handleUpdateProfile = useCallback(async (profile: Partial<UserProfile>) => {
    setState((prev) => ({ ...prev, error: null }))
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: profile,
      })

      if (error) throw error

      setState((prev) => ({
        ...prev,
        user: data.user ?? prev.user,
        session: prev.session,
        error: null,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error as AuthError,
      }))
      throw error
    }
  }, [])

  // Refresh session
  const handleRefreshSession = useCallback(async () => {
    setState((prev) => ({ ...prev, error: null }))
    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) throw error

      setState((prev) => ({
        ...prev,
        user: data.user,
        session: data.session,
        loading: false,
      }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error as AuthError,
      }))
      throw error
    }
  }, [])

  // Set up periodic session refresh (every 15 minutes)
  useEffect(() => {
    if (!state.session) {
      return
    }

    // Refresh every 15 minutes (Supabase tokens last 1 hour by default)
    const interval = setInterval(() => {
      handleRefreshSession().catch((error) => {
        console.warn('Periodic session refresh failed:', error.message)
      })
    }, 15 * 60 * 1000)

    return () => clearInterval(interval)
  }, [state.session, handleRefreshSession])

  const value: AuthContextValue = {
    ...state,
    signInWithOAuth: handleSignInWithOAuth,
    signInWithEmail: handleSignInWithEmail,
    signUpWithEmail: handleSignUpWithEmail,
    signOut: handleSignOut,
    updateProfile: handleUpdateProfile,
    refreshSession: handleRefreshSession,
  }

  return React.createElement(AuthContext.Provider, { value }, children)
}

/**
 * Hook to use auth context
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, signInWithOAuth, signOut } = useAuth()
 *
 *   if (!user) {
 *     return <button onClick={() => signInWithOAuth('google')}>Sign in</button>
 *   }
 *
 *   return <div>Welcome, {user.email} <button onClick={signOut}>Sign out</button></div>
 * }
 * ```
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}

/**
 * Hook to access auth context when available.
 * Returns null instead of throwing when used outside AuthProvider.
 */
export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext) ?? null
}

/**
 * Hook to get current user (shorthand)
 *
 * @example
 * ```tsx
 * function Profile() {
 *   const user = useCurrentUser()
 *   return user ? <div>{user.email}</div> : <div>Not logged in</div>
 * }
 * ```
 */
export function useCurrentUser(): User | null {
  const { user } = useAuth()
  return user
}

/**
 * Hook to check if user is authenticated (shorthand)
 *
 * @example
 * ```tsx
 * function ProtectedRoute() {
 *   const isAuthenticated = useIsAuthenticated()
 *
 *   if (!isAuthenticated) {
 *     return <Navigate to="/login" />
 *   }
 *
 *   return <Outlet />
 * }
 * ```
 */
export function useIsAuthenticated(): boolean {
  const { user, loading } = useAuth()
  return !loading && user !== null
}

/**
 * Higher-order component to protect routes
 *
 * @example
 * ```tsx
 * const ProtectedDashboard = withAuth(Dashboard)
 * ```
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function AuthProtectedComponent(props: P) {
    const isAuthenticated = useIsAuthenticated()

    if (!isAuthenticated) {
      // You could redirect here, but for simplicity we just return null
      // In a real app, you'd use react-router-dom's Navigate component
      return null
    }

    return React.createElement(Component, props)
  }
}
