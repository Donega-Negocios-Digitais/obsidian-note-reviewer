/**
 * User Menu Component
 *
 * Dropdown menu showing user avatar, display name, and navigation options.
 * Displays when user is authenticated, hides when logged out.
 *
 * @example
 * ```tsx
 * <UserMenu />
 * ```
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@obsidian-note-reviewer/security/auth'
import { getAvatarUrl } from '@obsidian-note-reviewer/security/supabase/storage'
import { LogoutButton } from './LogoutButton'

/**
 * Get display name from user metadata
 * Falls back to email username if no name is set
 */
function getDisplayName(user: { email?: string | null; user_metadata?: Record<string, unknown> }): string {
  const fullName = user.user_metadata?.full_name as string | undefined
  const displayName = user.user_metadata?.display_name as string | undefined
  const name = user.user_metadata?.name as string | undefined

  return fullName || displayName || name || user.email?.split('@')[0] || 'Usuário'
}

/**
 * Get initial letter from display name for avatar fallback
 */
function getAvatarInitial(displayName: string): string {
  return displayName.charAt(0).toUpperCase()
}

export function UserMenu(): React.ReactElement | null {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  // Don't render if user is not authenticated
  if (!user) {
    return null
  }

  const displayName = getDisplayName(user)
  const avatarUrl = getAvatarUrl(user)
  const email = user.email

  const handleNavigate = (path: string) => {
    setIsOpen(false)
    navigate(path)
  }

  return (
    <div className="relative">
      {/* Trigger button - avatar and display name */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
        aria-label="Menu do usuário"
        aria-expanded={isOpen}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={`Avatar de ${displayName}`}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {getAvatarInitial(displayName)}
            </span>
          </div>
        )}
        <span className="text-sm font-medium hidden sm:inline">{displayName}</span>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          {/* Backdrop - closes menu when clicked */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu content */}
          <div
            className="absolute right-0 mt-2 w-56 bg-card border rounded-md shadow-lg z-20"
            role="menu"
            aria-label="Opções do usuário"
          >
            {/* User Info Section */}
            <div className="px-4 py-3 border-b">
              <p className="text-sm font-medium">{displayName}</p>
              {email && (
                <p className="text-xs text-muted-foreground truncate" title={email}>
                  {email}
                </p>
              )}
            </div>

            {/* Navigation Items */}
            <div className="py-1" role="none">
              <button
                onClick={() => handleNavigate('/editor')}
                className="block w-full text-left px-4 py-2 text-sm hover:bg-accent transition-colors"
                role="menuitem"
              >
                Editor
              </button>
            </div>

            {/* Logout Section */}
            <div className="px-4 py-3 border-t">
              <LogoutButton className="w-full" variant="default">
                Sair
              </LogoutButton>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
