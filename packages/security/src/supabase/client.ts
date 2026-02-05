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

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  )
}

export const createClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Store session in localStorage (default for browser client)
      storage: window.localStorage,
      // Auto-refresh token before it expires
      autoRefreshToken: true,
      // Detect session changes across tabs
      detectSessionInUrl: true,
      // Persist session
      persistSession: true,
    },
  })
}

/**
 * Singleton instance for use throughout the app
 * Use this in most cases instead of creating new clients
 */
export const supabase = createClient()
