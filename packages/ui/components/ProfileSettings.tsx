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
import { updateDisplayName } from '../utils/identity'
import { Camera, Key, User, Check, X, Mail, ImagePlus } from 'lucide-react'

interface ProfileSettingsProps {
  onSave?: (payload?: {
    oldDisplayName?: string
    newDisplayName?: string
    avatarUrl?: string | null
    phone?: string
  }) => void
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

function getInitials(name: string): string {
  if (!name.trim()) return '?'
  return name.trim().split(/\s+/).map(w => w[0].toUpperCase()).slice(0, 2).join('')
}

function isMissingPhoneColumnError(error: unknown): boolean {
  const message = String((error as any)?.message || '').toLowerCase()
  const details = String((error as any)?.details || '').toLowerCase()
  return (
    message.includes('column') && message.includes('phone')
  ) || (
    details.includes('column') && details.includes('phone')
  )
}


export function ProfileSettings({ onSave }: ProfileSettingsProps): React.ReactElement {
  const { t } = useTranslation()
  const { user, updateProfile } = useAuth()
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
  const [phone, setPhone] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [lastSavedDisplayName, setLastSavedDisplayName] = useState('')
  const [lastSavedPhone, setLastSavedPhone] = useState('')

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


  // General state
  const [savedField, setSavedField] = useState<string | null>(null)

  // Load existing user data on mount
  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    const loadProfile = async () => {
      const existingName = user.user_metadata?.full_name || user.user_metadata?.name || ''
      const existingAvatar = getAvatarUrl(user)
      const existingPhone = typeof user.user_metadata?.phone === 'string' ? user.user_metadata.phone : ''

      setDisplayName(existingName)
      setLastSavedDisplayName(existingName)
      setAvatarUrl(existingAvatar)
      setPhone(existingPhone)
      setLastSavedPhone(existingPhone)

      try {
        const { data, error } = await supabase
          .from('users')
          .select('name, avatar_url, phone')
          .eq('id', user.id)
          .single()

        if (cancelled || error || !data) return

        if (typeof data.name === 'string' && data.name.trim().length > 0) {
          setDisplayName(data.name)
          setLastSavedDisplayName(data.name)
        }
        if (typeof data.avatar_url === 'string' && data.avatar_url.trim().length > 0) {
          setAvatarUrl(data.avatar_url)
        }
        if (typeof data.phone === 'string') {
          setPhone(data.phone)
          setLastSavedPhone(data.phone)
        }
      } catch {
        try {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('users')
            .select('name, avatar_url')
            .eq('id', user.id)
            .single()

          if (cancelled || fallbackError || !fallbackData) return

          if (typeof fallbackData.name === 'string' && fallbackData.name.trim().length > 0) {
            setDisplayName(fallbackData.name)
            setLastSavedDisplayName(fallbackData.name)
          }
          if (typeof fallbackData.avatar_url === 'string' && fallbackData.avatar_url.trim().length > 0) {
            setAvatarUrl(fallbackData.avatar_url)
          }
        } catch {
          // metadata fallback already applied
        }
      }
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Auto-hide save feedback
  useEffect(() => {
    if (savedField) {
      const timer = setTimeout(() => setSavedField(null), 2000)
      return () => clearTimeout(timer)
    }
  }, [savedField])

  const updateUsersTableProfile = async (params: {
    userId: string
    name: string
    avatarUrl: string | null
    phone: string
  }) => {
    const basePayload = {
      name: params.name,
      avatar_url: params.avatarUrl,
      updated_at: new Date().toISOString(),
    }

    const withPhonePayload = {
      ...basePayload,
      phone: params.phone || null,
    }

    const { error } = await supabase
      .from('users')
      .update(withPhonePayload)
      .eq('id', params.userId)

    if (!error) return

    if (!isMissingPhoneColumnError(error)) {
      throw new Error(error.message || t('settings.profile.errors.profileUpdate'))
    }

    const { error: fallbackError } = await supabase
      .from('users')
      .update(basePayload)
      .eq('id', params.userId)

    if (fallbackError) {
      throw new Error(fallbackError.message || t('settings.profile.errors.profileUpdate'))
    }
  }


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!user) return

    if (!file.type.startsWith('image/')) {
      setPasswordErrors({ general: t('settings.profile.errors.invalidImage') })
      return
    }

    if (file.size > 2 * 1024 * 1024) {
      setPasswordErrors({ general: t('settings.profile.errors.maxImageSize') })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    setUploading(true)
    setPasswordErrors({})
    try {
      const publicUrl = await uploadAvatar(user!.id, file)
      setAvatarUrl(publicUrl)
      await updateProfile({ avatar_url: publicUrl })
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', user!.id)
      if (userUpdateError) {
        throw new Error(userUpdateError.message || t('settings.profile.errors.avatarUpdate'))
      }
      setSavedField('avatar')
      onSave?.({ avatarUrl: publicUrl })
    } catch (error: any) {
      setPasswordErrors({ general: error.message || t('settings.profile.errors.avatarUpload') })
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      setPasswordErrors({ general: t('settings.profile.errors.emptyDisplayName') })
      return
    }
    if (!user) return

    setSavingProfile(true)
    setPasswordErrors({})

    try {
      const nextName = displayName.trim()
      const nextPhone = phone.trim()
      const previousName =
        (lastSavedDisplayName || user.user_metadata?.full_name || user.user_metadata?.name || '').trim()

      await updateProfile({
        full_name: nextName,
        avatar_url: avatarUrl,
        phone: nextPhone,
      })
      await updateUsersTableProfile({
        userId: user.id,
        name: nextName,
        avatarUrl,
        phone: nextPhone,
      })

      // Best-effort backfill so historical comments show latest profile name/avatar.
      await supabase
        .from('comments')
        .update({
          author_name: nextName,
          author_avatar: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('author_id', user!.id)

      updateDisplayName(nextName)
      setLastSavedDisplayName(nextName)
      setLastSavedPhone(nextPhone)
      setSavedField('profile')
      onSave?.({
        oldDisplayName: previousName || undefined,
        newDisplayName: nextName,
        avatarUrl,
        phone: nextPhone,
      })
    } catch (error: any) {
      setPasswordErrors({ general: error.message || t('settings.profile.errors.profileUpdateGeneral') })
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSavePhone = async () => {
    if (!user) return

    setSavingProfile(true)
    setPasswordErrors({})

    try {
      const nextPhone = phone.trim()
      const nextName = displayName.trim() || lastSavedDisplayName || user.user_metadata?.full_name || user.user_metadata?.name || ''

      await updateProfile({ phone: nextPhone })
      await updateUsersTableProfile({
        userId: user.id,
        name: nextName,
        avatarUrl,
        phone: nextPhone,
      })

      setLastSavedPhone(nextPhone)
      setSavedField('phone')
      onSave?.({ phone: nextPhone })
    } catch (error: any) {
      setPasswordErrors({ general: error.message || t('settings.profile.errors.profileUpdateGeneral') })
    } finally {
      setSavingProfile(false)
    }
  }

  const validatePassword = (): boolean => {
    const errors: PasswordErrors = {}

    if (!isOAuthUser && !passwordForm.currentPassword) {
      errors.current = t('settings.profile.errors.currentPasswordRequired')
    }

    if (!passwordForm.newPassword) {
      errors.new = t('settings.profile.errors.newPasswordRequired')
    } else if (passwordForm.newPassword.length < 6) {
      errors.new = t('settings.profile.errors.passwordMinLength')
    }

    if (!passwordForm.confirmPassword) {
      errors.confirm = t('settings.profile.errors.confirmPasswordRequired')
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirm = t('settings.profile.errors.passwordMismatch')
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
        setPasswordErrors({ general: t('settings.profile.errors.invalidUser') })
        return
      }

      if (!isOAuthUser) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: passwordForm.currentPassword,
        })

        if (signInError) {
          setPasswordErrors({ current: t('settings.profile.errors.currentPasswordInvalid') })
          return
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      })

      if (updateError) {
        setPasswordErrors({ general: updateError.message || t('settings.profile.errors.passwordUpdate') })
      } else {
        setPasswordSuccess(true)
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
        setTimeout(() => setPasswordSuccess(false), 3000)
      }
    } catch (error: any) {
      setPasswordErrors({ general: error.message || t('settings.profile.errors.passwordUpdate') })
    } finally {
      setSavingPassword(false)
    }
  }

  const displayAvatar = previewUrl || avatarUrl

  return (
    <div className="space-y-6">

      {/* ── Two-column: Conta | Segurança ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* ── CONTA ──────────────────────────── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t('settings.profile.accountSection')}</p>
          <div className="rounded-xl border border-border bg-card overflow-hidden">

            {/* Avatar section */}
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => !uploading && fileInputRef.current?.click()}
                  disabled={uploading}
                  className="relative group flex-shrink-0 focus:outline-none"
                  aria-label={t('settings.profile.changePhoto')}
                >
                  {displayAvatar ? (
                    <img
                      src={displayAvatar}
                      alt={t('settings.profile.avatarAlt')}
                      className="w-20 h-20 rounded-full object-cover ring-2 ring-border ring-offset-2 ring-offset-background"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center ring-2 ring-border ring-offset-2 ring-offset-background">
                      {displayName.trim() ? (
                        <span className="text-lg font-semibold text-muted-foreground">{getInitials(displayName)}</span>
                      ) : (
                        <User className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                  )}
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  {uploading && (
                    <div className="absolute inset-0 rounded-full bg-background/80 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                    </div>
                  )}
                </button>

                <div className="flex flex-col gap-1.5">
                  <p className="text-sm font-medium text-foreground">
                    {displayName.trim() || t('settings.profile.noName')}
                  </p>
                  <button
                    onClick={() => !uploading && fileInputRef.current?.click()}
                    disabled={uploading}
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary/80 transition-colors disabled:opacity-40"
                  >
                    <ImagePlus className="w-3.5 h-3.5" />
                    {uploading ? t('settings.profile.uploading') : t('settings.profile.changePhoto')}
                  </button>
                  {savedField === 'avatar' && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <Check className="w-3 h-3" />
                      {t('settings.profile.photoUpdated')}
                    </span>
                  )}
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Display name */}
            <div className="px-5 py-4">
              <label htmlFor="displayName" className="block text-xs font-medium text-foreground mb-1">
                {t('settings.profile.displayName')}
              </label>
              <p className="text-[11px] text-muted-foreground/70 mb-2">{t('settings.profile.publicNameHint')}</p>
              <div className="flex items-center gap-2">
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                  className="flex-1 text-sm bg-background border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
                  placeholder={t('settings.profile.displayNamePlaceholder')}
                />
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile || uploading}
                  className="flex-shrink-0 px-3 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5 min-w-[80px] justify-center"
                >
                  {savingProfile ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary-foreground" />
                  ) : savedField === 'profile' ? (
                    <><Check className="w-3.5 h-3.5" /> {t('settings.profile.saved')}</>
                  ) : (
                    t('settings.profile.saveName')
                  )}
                </button>
              </div>
            </div>

            <div className="px-5 pb-4">
              <label htmlFor="phone" className="block text-xs font-medium text-foreground mb-1">
                Telefone
              </label>
              <p className="text-[11px] text-muted-foreground/70 mb-2">
                Opcional. Usado para integrações e automações futuras.
              </p>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveProfile()}
                className="w-full text-sm bg-background border border-input rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground/50"
                placeholder="+55 11 99999-9999"
              />
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={handleSavePhone}
                  disabled={savingProfile || uploading || phone.trim() === (lastSavedPhone || '').trim()}
                  className="flex-shrink-0 px-3 py-2 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 flex items-center gap-1.5 min-w-[120px] justify-center"
                >
                  {savingProfile ? (
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-primary-foreground" />
                  ) : savedField === 'phone' ? (
                    <><Check className="w-3.5 h-3.5" /> Salvo</>
                  ) : (
                    'Salvar telefone'
                  )}
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-border" />

            {/* Email — secondary/read-only */}
            <div className="px-5 py-3.5">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60 mb-1">{t('common.email')}</p>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0" />
                <p className="text-sm text-muted-foreground truncate">{user?.email || '—'}</p>
                {isOAuthUser && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground/70 flex-shrink-0 ml-auto">
                    via {authProviderLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── SEGURANÇA ──────────────────────── */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">{t('settings.profile.securitySection')}</p>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                <Key className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <p className="text-sm font-medium">
                {isOAuthUser ? t('settings.profile.setPassword') : t('settings.profile.changePassword')}
              </p>
            </div>

            <div className="p-4 space-y-3">
              {isOAuthUser && (
                <div className="p-3 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs border border-blue-100 dark:border-transparent">
                  {t('settings.profile.oauthInfo', { provider: authProviderLabel })}
                </div>
              )}

              {passwordSuccess && (
                <div className="p-2.5 rounded-md bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 text-xs flex items-center gap-2 border border-green-100 dark:border-transparent">
                  <Check className="w-3.5 h-3.5 flex-shrink-0" />
                  {t('settings.profile.passwordUpdated')}
                </div>
              )}

              {!isOAuthUser && (
                <div>
                  <label htmlFor="currentPassword" className="block text-xs font-medium text-foreground mb-1.5">
                    {t('settings.profile.currentPassword')}
                  </label>
                  <div className="relative">
                    <input
                      id="currentPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className={`w-full px-3 py-2 pr-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-sm ${
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
                        <X className="w-4 h-4" />
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <label htmlFor="newPassword" className="block text-xs font-medium text-foreground mb-1.5">
                  {t('settings.profile.newPassword')}
                </label>
                <input
                  id="newPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-sm ${
                    passwordErrors.new ? 'border-destructive' : 'border-input'
                  }`}
                  placeholder={t('settings.profile.newPasswordPlaceholder')}
                />
                {passwordErrors.new && (
                  <p className="text-xs text-destructive mt-1">{passwordErrors.new}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-xs font-medium text-foreground mb-1.5">
                  {t('settings.profile.confirmPassword')}
                </label>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring bg-background text-sm ${
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
                className="w-full px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                {savingPassword ? t('settings.profile.updating') : t('settings.profile.changePassword')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* General error */}
      {passwordErrors.general && (
        <div className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {passwordErrors.general}
        </div>
      )}

    </div>
  )
}
