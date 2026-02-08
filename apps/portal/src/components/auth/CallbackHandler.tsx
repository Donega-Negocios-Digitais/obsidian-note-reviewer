import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@obsidian-note-reviewer/security/supabase/client'
import type { User } from '@supabase/supabase-js'

/**
 * OAuth Callback Handler
 *
 * This component handles the OAuth callback from Supabase.
 * Manually processes the session from URL hash tokens.
 *
 * Redirect behavior:
 * - New users (created_at == now) → /welcome
 * - Returning users → /dashboard
 * - OAuth failed/cancelled → /auth/login
 */
export function CallbackHandler() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [targetUrl, setTargetUrl] = useState<string | null>(null)

  // Get redirect target from URL params (for flexibility)
  const next = searchParams.get('next') ?? null
  const redirectTo = searchParams.get('redirectTo') ?? next

  useEffect(() => {
    let mounted = true

    async function processOAuthCallback() {
      try {
        console.log('🔍 [Callback] URL atual:', window.location.href)
        console.log('🔍 [Callback] Hash URL:', window.location.hash)

        // Check for OAuth errors in URL first
        const error_code = searchParams.get('error')
        const error_description = searchParams.get('error_description')

        if (error_code) {
          console.error('❌ [Callback] OAuth error:', error_code, error_description)
          setError(error_description || error_code)
          setTimeout(() => {
            if (mounted) window.location.href = '/auth/login'
          }, 3000)
          return
        }

        // Check if we have tokens in the URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')

        console.log('🔍 [Callback] access_token presente:', !!accessToken)
        console.log('🔍 [Callback] refresh_token presente:', !!refreshToken)

        // If we have tokens, try to set session manually
        if (accessToken && refreshToken) {
          console.log('🔍 [Callback] Tentando configurar sessão manualmente...')

          const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          console.log('🔍 [Callback] setSession result:', !!sessionData.session, 'error:', sessionError)

          if (sessionError) {
            console.error('❌ [Callback] Erro ao configurar sessão:', sessionError)
          }

          if (sessionData?.session?.user) {
            console.log('✅ [Callback] Sessão configurada! Usuário:', sessionData.session.user.email)

            // Check if new user
            const createdAt = new Date(sessionData.session.user.created_at)
            const now = new Date()
            const isNewUser = (now.getTime() - createdAt.getTime()) < 30000 // 30 seconds

            const targetPath = redirectTo || (isNewUser ? '/welcome' : '/editor')
            console.log('✅ [Callback] Redirecionando para:', targetPath, '(novo usuário:', isNewUser, ')')

            setProcessing(false)
            setUser(sessionData.session.user)
            setTargetUrl(targetPath)
            return
          }
        }

        // Fallback: try multiple times to get the session
        console.log('🔍 [Callback] Tentando detectar sessão automaticamente...')
        let session = null
        for (let i = 0; i < 10; i++) {
          const { data } = await supabase.auth.getSession()
          console.log(`🔍 [Callback] Tentativa ${i + 1}: Sessão =`, !!data.session?.user)
          if (data.session?.user) {
            session = data.session
            break
          }
          await new Promise(resolve => setTimeout(resolve, 1000))
        }

        if (session?.user) {
          console.log('✅ [Callback] Sessão encontrada! Usuário:', session.user.email)

          // Check if new user
          const createdAt = new Date(session.user.created_at)
          const now = new Date()
          const isNewUser = (now.getTime() - createdAt.getTime()) < 30000 // 30 seconds

          const targetPath = redirectTo || (isNewUser ? '/welcome' : '/dashboard')
          console.log('✅ [Callback] Redirecionando para:', targetPath, '(novo usuário:', isNewUser, ')')

          setProcessing(false)
          setUser(session.user)
          setTargetUrl(targetPath)
        } else {
          console.error('❌ [Callback] Nenhuma sessão encontrada após 10 tentativas')
          console.log('🔍 [Callback] LocalStorage keys:', Object.keys(localStorage).filter(k => k.startsWith('sb-')))
          setProcessing(false)

          // Show error message and redirect
          setError('Não foi possível completar a autenticação. Tente novamente.')
          setTimeout(() => {
            if (mounted) {
              window.location.href = '/auth/login'
            }
          }, 5000)
        }
      } catch (err) {
        console.error('❌ [Callback] Erro:', err)
        if (mounted) {
          setError('Erro ao processar autenticação')
          setTimeout(() => {
            window.location.href = '/auth/login'
          }, 3000)
        }
      }
    }

    processOAuthCallback()

    return () => {
      mounted = false
    }
  }, [searchParams, redirectTo])

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15">
            <svg className="h-6 w-6 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Erro na autenticação</h2>
          <p className="text-muted-foreground text-sm">{error}</p>
          <p className="text-muted-foreground text-sm">Redirecionando para o login...</p>
        </div>
      </div>
    )
  }

  // Success state - mostra info e não redireciona automaticamente
  if (!processing && user && targetUrl) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-4 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-500/15">
            <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Login realizado com sucesso!</h2>
          <p className="text-muted-foreground text-sm">Usuário: {user.email}</p>
          <p className="text-muted-foreground text-sm">Redirecionar para: {targetUrl}</p>
          <button
            onClick={() => window.location.href = targetUrl}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Continuar
          </button>
          <p className="text-xs text-muted-foreground mt-4">
            Abra o console (F12) e copie os logs para enviar ao desenvolvedor
          </p>
        </div>
      </div>
    )
  }

  // Loading state
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md space-y-4 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
        <p className="text-muted-foreground">Autenticando...</p>
        <p className="text-xs text-muted-foreground">Processando callback do Google...</p>
      </div>
    </div>
  )
}
