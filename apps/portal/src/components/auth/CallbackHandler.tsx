import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '@obsidian-note-reviewer/security/supabase/client'

/**
 * OAuth Callback Handler
 *
 * This component handles the OAuth callback from Supabase.
 * Manually processes the session from URL hash tokens.
 *
 * Redirect behavior:
 * - OAuth success → /editor (or redirectTo when explicitly provided)
 * - OAuth failed/cancelled → /auth/login
 */
export function CallbackHandler() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  // Get redirect target from URL params (for flexibility)
  const next = searchParams.get('next') ?? null
  const redirectTo = searchParams.get('redirectTo') ?? next

  const providerLabel = (provider: string): string => {
    const normalized = provider.trim().toLowerCase()
    if (normalized === 'google') return 'Google'
    if (normalized === 'github') return 'GitHub'
    return 'E-mail e senha'
  }

  const formatProviderList = (providers: string[]): string => {
    const labels = providers.map(providerLabel).filter(Boolean)
    if (labels.length === 0) return 'E-mail e senha'
    if (labels.length === 1) return labels[0]
    if (labels.length === 2) return `${labels[0]} ou ${labels[1]}`
    return `${labels.slice(0, -1).join(', ')} ou ${labels[labels.length - 1]}`
  }

  const isMissingProviderPolicyRpc = (error: unknown): boolean => {
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

  const enforceProviderPolicy = async (): Promise<string | null> => {
    const { data, error } = await supabase.rpc('enforce_auth_provider_policy')

    if (error) {
      if (isMissingProviderPolicyRpc(error)) {
        return null
      }
      console.error('❌ [Callback] Falha ao validar política de provedor:', error)
      return null
    }

    const row = Array.isArray(data) ? data[0] : data
    if (!row || row.is_allowed !== false) {
      return null
    }

    const allowedProviders = Array.isArray(row.allowed_providers)
      ? row.allowed_providers.filter((provider: unknown): provider is string => typeof provider === 'string' && provider.length > 0)
      : ['email']

    const allowedLabel = formatProviderList(allowedProviders)
    const preferredLabel = allowedProviders.length === 1
      ? providerLabel(allowedProviders[0])
      : `um destes métodos: ${allowedLabel}`

    await supabase.auth.signOut({ scope: 'local' })
    return `Este e-mail está vinculado ao método ${allowedLabel}. Entre usando ${preferredLabel}.`
  }

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
            if (mounted) navigate('/auth/login')
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
            const providerPolicyError = await enforceProviderPolicy()
            if (providerPolicyError) {
              setError(providerPolicyError)
              setTimeout(() => {
                if (mounted) navigate('/auth/login', { replace: true })
              }, 3500)
              return
            }

            console.log('✅ [Callback] Sessão configurada! Usuário:', sessionData.session.user.email)
            const targetPath = redirectTo || '/editor'
            console.log('✅ [Callback] Redirecionando automaticamente para:', targetPath, '(caminho: setSession)')
            navigate(targetPath, { replace: true })
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
          const providerPolicyError = await enforceProviderPolicy()
          if (providerPolicyError) {
            setError(providerPolicyError)
            setTimeout(() => {
              if (mounted) navigate('/auth/login', { replace: true })
            }, 3500)
            return
          }

          console.log('✅ [Callback] Sessão encontrada! Usuário:', session.user.email)
          const targetPath = redirectTo || '/editor'
          console.log('✅ [Callback] Redirecionando automaticamente para:', targetPath, '(caminho: getSession)')
          navigate(targetPath, { replace: true })
        } else {
          console.error('❌ [Callback] Nenhuma sessão encontrada após 10 tentativas')
          console.log('🔍 [Callback] LocalStorage keys:', Object.keys(localStorage).filter(k => k.startsWith('sb-')))

          // Show error message and redirect
          setError('Não foi possível completar a autenticação. Tente novamente.')
          setTimeout(() => {
            if (mounted) {
              navigate('/auth/login')
            }
          }, 5000)
        }
      } catch (err) {
        console.error('❌ [Callback] Erro:', err)
        if (mounted) {
          setError('Erro ao processar autenticação')
          setTimeout(() => {
            navigate('/auth/login')
          }, 3000)
        }
      }
    }

    processOAuthCallback()

    return () => {
      mounted = false
    }
  }, [navigate, searchParams, redirectTo])

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
