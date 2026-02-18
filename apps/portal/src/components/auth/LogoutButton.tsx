/**
 * Logout Button Component
 *
 * Button that signs out the user with confirmation dialog.
 * Per locked decision: REQUIRES confirmation before signing out.
 *
 * @example
 * ```tsx
 * <LogoutButton variant="default" />
 * ```
 */

import React, { useState } from 'react'
import { useAuth } from '@obsidian-note-reviewer/security/auth'
import { supabase } from '@obsidian-note-reviewer/security/supabase/client'
import { useNavigate } from 'react-router-dom'
import {
  clearPostLogoutRedirect,
  setPostLogoutRedirect,
  writeLogoutThanksSnapshot,
} from '../../lib/referral'

export interface LogoutButtonProps {
  /**
   * Visual variant for the button
   * - default: outlined button with border
   * - destructive: red background for emphasis
   */
  variant?: 'default' | 'destructive'

  /**
   * Additional CSS classes to apply
   */
  className?: string

  /**
   * Button text (default: "Sair")
   */
  children?: React.ReactNode
}

export function LogoutButton({
  variant = 'default',
  className = '',
  children = 'Sair'
}: LogoutButtonProps): React.ReactElement {
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const { signOut, user } = useAuth()
  const navigate = useNavigate()

  const toSafeNumber = (value: unknown, fallback = 0) => {
    if (typeof value === 'number' && Number.isFinite(value)) return value
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value)
      if (Number.isFinite(parsed)) return parsed
    }
    return fallback
  }

  const buildFallbackAffiliateCode = (userId: string) => `ref-${userId.replace(/-/g, '').toLowerCase()}`

  const prepareLogoutThanksSnapshot = async () => {
    if (!user?.id) return

    let affiliateCode = buildFallbackAffiliateCode(user.id)
    let commissionRate = 0.6
    let totalCommissionCents = 0
    let totalUnderReviewCents = 0
    let referredBuyersCount = 0

    try {
      const { data: ensuredCode } = await supabase.rpc('ensure_affiliate_profile')
      if (typeof ensuredCode === 'string' && ensuredCode.trim()) {
        affiliateCode = ensuredCode.trim().toLowerCase()
      }
    } catch (error) {
      console.warn('[LogoutButton] Failed to ensure affiliate profile before logout:', error)
    }

    try {
      const { data: summaryData } = await supabase.rpc('get_affiliate_summary')
      const summary = (Array.isArray(summaryData) ? summaryData[0] : summaryData) as {
        affiliate_code?: string
        commission_rate?: number | string
        total_commission_cents?: number | string
        total_under_review_cents?: number | string
        referred_buyers_count?: number | string
      } | null

      if (summary) {
        if (typeof summary.affiliate_code === 'string' && summary.affiliate_code.trim()) {
          affiliateCode = summary.affiliate_code.trim().toLowerCase()
        }
        commissionRate = toSafeNumber(summary.commission_rate, 0.6)
        totalCommissionCents = Math.round(toSafeNumber(summary.total_commission_cents, 0))
        totalUnderReviewCents = Math.round(toSafeNumber(summary.total_under_review_cents, 0))
        referredBuyersCount = Math.max(0, Math.round(toSafeNumber(summary.referred_buyers_count, 0)))
      }
    } catch (error) {
      console.warn('[LogoutButton] Failed to fetch affiliate summary before logout:', error)
    }

    writeLogoutThanksSnapshot({
      affiliateCode,
      commissionRate,
      totalCommissionCents,
      totalUnderReviewCents,
      referredBuyersCount,
      generatedAt: new Date().toISOString(),
    })
  }

  const handleLogout = async () => {
    setLoading(true)

    try {
      await prepareLogoutThanksSnapshot()
      setPostLogoutRedirect('/logout-thanks')
      await signOut()
      navigate('/logout-thanks')
    } catch (error: any) {
      clearPostLogoutRedirect()
      console.error('Logout error:', error)
      // Show inline error (toast not used per SPA pattern from 01-03)
      setLoading(false)
      setShowConfirm(false)
    }
  }

  // Confirmation state - show dialog
  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Tem certeza?</span>
        <button
          onClick={handleLogout}
          disabled={loading}
          className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Confirmar logout"
        >
          {loading ? 'Saindo...' : 'Sim, sair'}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          disabled={loading}
          className="px-3 py-1 text-sm border border-input rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Cancelar logout"
        >
          Cancelar
        </button>
      </div>
    )
  }

  // Default state - show logout button
  const variantClasses = variant === 'destructive'
    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
    : 'border border-input hover:bg-accent'

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className={`px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClasses} ${className}`}
      aria-label="Sair da conta"
    >
      {children}
    </button>
  )
}
