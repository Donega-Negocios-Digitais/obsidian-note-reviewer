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
