/**
 * Profile Settings Component
 *
 * Allows users to edit their profile information including:
 * - Avatar upload
 * - Display name
 * - Password change
 */

import React, { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@obsidian-note-reviewer/security/auth'
import { supabase } from '@obsidian-note-reviewer/security/supabase/client'
import { uploadAvatar, getAvatarUrl } from '@obsidian-note-reviewer/security/supabase/storage'
import { Camera, Key, User, Check, X, LogOut } from 'lucide-react'
import { BaseModal } from './BaseModal'

interface ProfileSettingsProps {
  onSave?: () => void
}

type PasswordForm = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

type PasswordErrors = {
  current?: string
  new?: string
  confirm?: string
  general?: string
}

const LOGOUT_THANKS_SNAPSHOT_KEY = 'obsreview-logout-thanks-snapshot'
const POST_LOGOUT_REDIRECT_KEY = 'obsreview-post-logout-redirect'
const LEGACY_LOGOUT_CONFIRM_OPEN_KEY = 'obsreview-profile-logout-confirm-open'

type AffiliateSummaryRow = {
  affiliate_code?: string
  commission_rate?: number | string
  total_commission_cents?: number | string
  total_under_review_cents?: number | string
  referred_buyers_count?: number | string
}

function getInitials(name: string): string {
  if (!name.trim()) return '?'
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('')
}

function toSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function buildFallbackAffiliateCode(userId: string): string {
  return `ref-${userId.replace(/-/g, '').toLowerCase()}`
}

export function ProfileSettings({ onSave }: ProfileSettingsProps): React.ReactElement {
  const { t } = useTranslation()
  const { user, updateProfile, signOut } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const authProvider = (user?.app_metadata?.provider as string | undefined) || 'email'
  const isOAuthUser = authProvider !== 'email'
  const authProviderLabel =
    authProvider === 'google'
      ? 'Google'
      : authProvider === 'github'
        ? 'GitHub'
        : 'OAuth'

  // Profile state
  const [displayName, setDisplayName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  // Password state
  const [passwordForm, setPasswordForm] = useState<PasswordForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({})
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // General state
  const [savedField, setSavedField] = useState<string | null>(null)

  // Load existing user data on mount
  useEffect(() => {
    if (user) {
      const existingName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      setDisplayName(existingName)
      const existingAvatar = getAvatarUrl(user)
      setAvatarUrl(existingAvatar)
    }
  }, [user])

  // Auto-hide save feedback
  useEffect(() => {
    if (savedField) {
      const timer = setTimeout(() => setSavedField(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [savedField])

  useEffect(() => {
    try {
      localStorage.removeItem(LEGACY_LOGOUT_CONFIRM_OPEN_KEY)
    } catch {
      // ignore persistence errors
    }
  }, [])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setPasswordErrors({ general: 'Por favor, selecione um arquivo de imagem válido.' })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setPasswordErrors({ general: 'A imagem deve ter no máximo 2MB.' })
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload avatar
    setUploading(true)
    setPasswordErrors({})
    try {
      const publicUrl = await uploadAvatar(user!.id, file)
      setAvatarUrl(publicUrl)
      // Auto-save avatar
      await updateProfile({ avatar_url: publicUrl })
      setSavedField('avatar')
    } catch (error: any) {
      setPasswordErrors({ general: error.message || 'Erro ao enviar avatar.' })
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      setPasswordErrors({ general: 'Por favor, insira seu nome de exibição.' })
      return
    }

    setSavingProfile(true)
    setPasswordErrors({})

    try {
      await updateProfile({
        full_name: displayName.trim(),
        avatar_url: avatarUrl,
      })
      setSavedField('profile')
      onSave?.()
    } catch (error: any) {
      setPasswordErrors({ general: error.message || 'Erro ao atualizar perfil.' })
    } finally {
      setSavingProfile(false)
    }
  }

  const validatePassword = (): boolean => {
    const errors: PasswordErrors = {}

    if (!isOAuthUser && !passwordForm.currentPassword) {
      errors.current = 'Senha atual é obrigatória'
    }

    if (!passwordForm.newPassword) {
      errors.new = 'Nova senha é obrigatória'
    } else if (passwordForm.newPassword.length < 6) {
      errors.new = 'A senha deve ter pelo menos 6 caracteres'
    }

    if (!passwordForm.confirmPassword) {
      errors.confirm = 'Confirmação de senha é obrigatória'
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirm = 'As senhas não coincidem'
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleChangePassword = async () => {
    setPasswordSuccess(false)
    if (!validatePassword()) return

    setSavingPassword(true)
    setPasswordErrors({})

    try {
      if (!user?.email) {
        setPasswordErrors({ general: 'Usuário inválido para alteração de senha.' })
        return
      }

      if (!isOAuthUser) {
        // Verify current password for email/password users.
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: passwordForm.currentPassword,
        })

        if (signInError) {
          setPasswordErrors({ current: 'Senha atual incorreta' })
          return
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (updateError) {
        setPasswordErrors({ general: updateError.message || 'Erro ao atualizar senha.' })
      } else {
        setPasswordSuccess(true)
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
        // Auto-hide success message
        setTimeout(() => setPasswordSuccess(false), 3000)
      }
    } catch (error: any) {
      setPasswordErrors({ general: error.message || 'Erro ao atualizar senha.' })
    } finally {
      setSavingPassword(false)
    }
  }

  const displayAvatar = previewUrl || avatarUrl

  const prepareLogoutThanksSnapshot = async () => {
    if (!user) return

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
      console.warn('[ProfileSettings] Failed to ensure affiliate profile before logout:', error)
    }

    try {
      const { data: summaryData } = await supabase.rpc('get_affiliate_summary')
      const summary = (Array.isArray(summaryData) ? summaryData[0] : summaryData) as AffiliateSummaryRow | null

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
      console.warn('[ProfileSettings] Failed to fetch affiliate summary before logout:', error)
    }

    sessionStorage.setItem(LOGOUT_THANKS_SNAPSHOT_KEY, JSON.stringify({
      affiliateCode,
      commissionRate,
      totalCommissionCents,
      totalUnderReviewCents,
      referredBuyersCount,
      generatedAt: new Date().toISOString(),
    }))
  }

  const handleLogout = async () => {
    setLoggingOut(true)
    setPasswordErrors({})

    try {
      await prepareLogoutThanksSnapshot()
      sessionStorage.setItem(POST_LOGOUT_REDIRECT_KEY, '/logout-thanks')
      await signOut()
      window.location.assign('/logout-thanks')
    } catch (error: any) {
      sessionStorage.removeItem(POST_LOGOUT_REDIRECT_KEY)
      setPasswordErrors({ general: error?.message || 'Erro ao deslogar da conta.' })
    } finally {
      setLoggingOut(false)
      setLogoutConfirmOpen(false)
    }
  }

  return (
    <div className="space-y-8 lg:space-y-0">
      {/* Desktop: Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Avatar + Display Name + Account Info */}
        <div className="flex-1 space-y-6">
          {/* Avatar Section - centered on mobile, left-aligned on desktop */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-6 border-b">
            <div className="relative group cursor-pointer flex-shrink-0" onClick={() => !uploading && fileInputRef.current?.click()}>
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt="Avatar"
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                  {displayName.trim() ? (
                    <span className="text-2xl font-semibold text-muted-foreground">{getInitials(displayName)}</span>
                  ) : (
                    <User className="w-12 h-12 text-muted-foreground" />
                  )}
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <Camera className="w-6 h-6 text-white" />
              </div>
              {uploading && (
                <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 hover:scale-110 hover:shadow-lg transition-all disabled:opacity-50 disabled:hover:scale-100"
                aria-label="Alterar foto"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />

            <div className="text-center sm:text-left space-y-1">
              {savedField === 'avatar' && (
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  {t('settings.profile.photoUpdated')}
                </span>
              )}
              <p className="text-xs text-muted-foreground">{t('settings.profile.maxSize')}</p>
            </div>
          </div>

          {/* Display Name Section */}
          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium mb-2 flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('settings.profile.displayName')}
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                placeholder={t('settings.profile.displayNamePlaceholder')}
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile || uploading}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {savingProfile ? (
                <>{t('settings.profile.saving')}</>
              ) : savedField === 'profile' ? (
                <>
                  <Check className="w-4 h-4" />
                  {t('settings.profile.saved')}
                </>
              ) : (
                t('settings.profile.saveName')
              )}
            </button>
          </div>

        </div>

        {/* Right Column: Password Change */}
        <div className="flex-1 space-y-6">
          {/* Password Change Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Key className="w-4 h-4" />
              {t('settings.profile.changePassword')}
            </h3>

            {isOAuthUser && (
              <div className="p-3 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs">
                Você entrou com {authProviderLabel}. Aqui você pode definir uma senha para entrar também com e-mail/senha.
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 rounded-md bg-green-500/15 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Senha atualizada com sucesso
              </div>
            )}

            {!isOAuthUser && (
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium mb-1.5">
                  {t('settings.profile.currentPassword')}
                </label>
                <div className="relative">
                  <input
                    id="currentPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background ${
                      passwordErrors.current ? 'border-destructive' : 'border-input'
                    }`}
                    placeholder={t('settings.profile.currentPasswordPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <X className="w-5 h-5" />
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
                {passwordErrors.current && (
                  <p className="text-xs text-destructive mt-1">{passwordErrors.current}</p>
                )}
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium mb-1.5">
                {t('settings.profile.newPassword')}
              </label>
              <input
                id="newPassword"
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background ${
                  passwordErrors.new ? 'border-destructive' : 'border-input'
                }`}
                placeholder={t('settings.profile.newPasswordPlaceholder')}
              />
              {passwordErrors.new && (
                <p className="text-xs text-destructive mt-1">{passwordErrors.new}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1.5">
                {t('settings.profile.confirmPassword')}
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background ${
                  passwordErrors.confirm ? 'border-destructive' : 'border-input'
                }`}
                placeholder={t('settings.profile.confirmPasswordPlaceholder')}
              />
              {passwordErrors.confirm && (
                <p className="text-xs text-destructive mt-1">{passwordErrors.confirm}</p>
              )}
            </div>

            <button
              onClick={handleChangePassword}
              disabled={savingPassword}
              className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingPassword ? t('settings.profile.updating') : t('settings.profile.changePassword')}
            </button>
          </div>

          {/* Account Security Section */}
          <div className="pt-6 border-t">
            <h3 className="text-sm font-medium mb-2">Conta e segurança</h3>
            <p className="text-xs text-muted-foreground mb-3">
              Encerrar sessão neste dispositivo e voltar para a tela de acesso.
            </p>
            <button
              onClick={() => setLogoutConfirmOpen(true)}
              disabled={loggingOut}
              className="w-full px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              {loggingOut ? 'Deslogando...' : 'Deslogar'}
            </button>
          </div>
        </div>
      </div>

      {/* General error */}
      {passwordErrors.general && (
        <div className="p-3 rounded-md bg-destructive/15 text-destructive text-sm">
          {passwordErrors.general}
        </div>
      )}

      {/* Logout confirmation modal */}
      {logoutConfirmOpen && (
        <BaseModal
          isOpen={logoutConfirmOpen}
          onRequestClose={() => setLogoutConfirmOpen(false)}
          closeOnBackdropClick={false}
          overlayClassName="z-[80] bg-black/50"
          contentClassName="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl"
          contentProps={{
            role: 'dialog',
            'aria-modal': true,
          }}
        >
          <div>
            <h4 className="text-base font-semibold text-foreground mb-2">Deseja sair da conta?</h4>
            <p className="text-sm text-muted-foreground mb-5">
              Você será redirecionado para uma tela de agradecimento e poderá acessar novamente quando quiser.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLogoutConfirmOpen(false)}
                disabled={loggingOut}
                className="flex-1 px-4 py-2 rounded-md border border-input hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex-1 px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loggingOut ? 'Deslogando...' : 'Deslogar'}
              </button>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  )
}
