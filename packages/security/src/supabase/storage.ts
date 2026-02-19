/**
 * Supabase Storage utilities for avatar upload
 *
 * Handles avatar upload to Supabase Storage with user-isolated folders
 * and public URL generation for profile images.
 */

import { supabase } from './client.js'

/**
 * Upload avatar to Supabase Storage
 *
 * Uploads an avatar image to the user's isolated folder in the avatars bucket.
 * Generates a unique filename to prevent conflicts and returns the public URL.
 *
 * @param userId - User ID for folder isolation
 * @param file - File object to upload (max 2MB)
 * @returns Public URL of the uploaded avatar
 * @throws Error if upload fails
 *
 * @example
 * ```ts
 * try {
 *   const avatarUrl = await uploadAvatar(user.id, file)
 *   console.log('Avatar uploaded:', avatarUrl)
 * } catch (error) {
 *   console.error('Upload failed:', error.message)
 * }
 * ```
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  // Keep a stable path per user to simplify cache invalidation and profile sync.
  const filePath = `${userId}.png`

  // Upload to avatars bucket in user-isolated folder
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    })

  if (uploadError) {
    throw new Error(`Failed to upload avatar: ${uploadError.message}`)
  }

  // Get public URL for the uploaded file
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath)

  return data.publicUrl
}

/**
 * Update user's avatar URL in metadata
 *
 * Stores the avatar URL in the user's metadata for quick access
 * without additional storage queries.
 *
 * @param avatarUrl - Public URL of the avatar
 * @throws Error if update fails
 *
 * @example
 * ```ts
 * await updateAvatarUrl('https://.../avatars/user123/abc.jpg')
 * ```
 */
export async function updateAvatarUrl(avatarUrl: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  })

  if (error) {
    throw new Error(`Failed to update avatar URL: ${error.message}`)
  }
}

/**
 * Get avatar URL from user metadata
 *
 * Extracts the avatar URL from the user's metadata.
 * Returns null if no avatar is set.
 *
 * @param user - Supabase user object
 * @returns Avatar URL or null
 *
 * @example
 * ```ts
 * const avatarUrl = getAvatarUrl(user)
 * if (avatarUrl) {
 *   return <img src={avatarUrl} alt="Avatar" />
 * }
 * ```
 */
export function getAvatarUrl(user: { user_metadata?: { avatar_url?: string } } | null): string | null {
  return user?.user_metadata?.avatar_url || null
}

/**
 * Delete user's avatar from storage
 *
 * Removes the avatar file from Supabase Storage.
 * Useful when user wants to remove their avatar.
 *
 * @param avatarUrl - Public URL of the avatar to delete
 * @throws Error if deletion fails
 *
 * @example
 * ```ts
 * await deleteAvatar(user.user_metadata?.avatar_url)
 * await updateAvatarUrl('') // Clear metadata
 * ```
 */
export async function deleteAvatar(avatarUrl: string): Promise<void> {
  // Extract file path from URL
  // URL format: https://xxx.supabase.co/storage/v1/object/public/avatars/user123/file.jpg
  try {
    const url = new URL(avatarUrl)
    const pathParts = url.pathname.split('/avatars/')
    if (pathParts.length < 2) {
      throw new Error('Invalid avatar URL format')
    }
    const filePath = pathParts[1]

    const { error } = await supabase.storage
      .from('avatars')
      .remove([filePath])

    if (error) {
      throw new Error(`Failed to delete avatar: ${error.message}`)
    }
  } catch (error) {
    throw new Error(`Failed to parse avatar URL: ${error}`)
  }
}
