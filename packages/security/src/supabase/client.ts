import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Supabase browser client for Vite SPA
 *
 * Uses standard @supabase/supabase-js (not @supabase/ssr which is for Next.js SSR)
 * Session is persisted in localStorage by default
 *
 * Environment variables (Vite convention):
 * - VITE_SUPABASE_URL: Supabase project URL
 * - VITE_SUPABASE_ANON_KEY: Supabase anonymous key
 */

const envSupabaseUrl = import.meta.env.VITE_SUPABASE_URL
const envSupabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Hook runtime (local annotate/review) doesn't require Supabase.
 * Avoid crashing the entire UI when env vars are missing and only enable
 * cloud features when properly configured.
 */
export const isSupabaseConfigured = Boolean(envSupabaseUrl && envSupabaseAnonKey)

const FALLBACK_SUPABASE_URL = 'https://placeholder.supabase.co'
const FALLBACK_SUPABASE_ANON_KEY = 'sb_publishable_placeholder_key'

if (!isSupabaseConfigured && typeof window !== 'undefined') {
  console.warn(
    '[Supabase] Missing VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY. Cloud features are disabled in this session.'
  )
}

const supabaseUrl = envSupabaseUrl || FALLBACK_SUPABASE_URL
const supabaseAnonKey = envSupabaseAnonKey || FALLBACK_SUPABASE_ANON_KEY

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Store session in localStorage (default for browser client)
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      // Auto-refresh token before it expires
      autoRefreshToken: typeof window !== 'undefined',
      // Detect session changes across tabs
      detectSessionInUrl: typeof window !== 'undefined',
      // Persist session
      persistSession: typeof window !== 'undefined',
    },
  })
}

/**
 * Singleton instance for use throughout the app
 * Use this in most cases instead of creating new clients
 */
export const supabase = createClient()
