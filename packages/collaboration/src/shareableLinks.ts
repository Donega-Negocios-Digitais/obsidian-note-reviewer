/**
 * Shareable Links Utilities
 *
 * Generate, validate, and manage URL-friendly slugs for document sharing.
 */

import type { ShareableLink, SlugValidation } from './types';

// Reserved slugs that cannot be used
const RESERVED_SLUGS = [
  'api', 'www', 'admin', 'dashboard', 'settings', 'auth',
  'login', 'logout', 'signup', 'register', 'shared', 'share',
  'docs', 'help', 'support', 'about', 'home', 'index',
];

/**
 * Generate a URL-friendly slug from a title
 *
 * Converts title to lowercase, removes accents and special characters,
 * replaces spaces with hyphens, and limits length.
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^\w\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Spaces to hyphens
    .replace(/-+/g, '-') // Collapse multiple hyphens
    .replace(/^-+|-+$/g, '') // Trim leading/trailing hyphens
    .slice(0, 50); // Max length
}

/**
 * Generate a unique slug with random suffix if needed
 *
 * Checks against existing slugs and adds numeric suffix if base is taken.
 */
export function generateUniqueSlug(title: string, existingSlugs: string[]): string {
  const baseSlug = generateSlug(title);

  // If base slug is available, use it
  if (!isSlugTaken(baseSlug, existingSlugs)) {
    return baseSlug;
  }

  // Try with numeric suffix
  let suffix = 2;
  let uniqueSlug;
  do {
    uniqueSlug = `${baseSlug}-${suffix}`;
    suffix++;
  } while (isSlugTaken(uniqueSlug, existingSlugs) && suffix < 100);

  return uniqueSlug || `${baseSlug}-${Date.now().toString(36)}`;
}

/**
 * Validate slug format
 *
 * Checks length, format, and reserved words.
 */
export function validateSlug(slug: string): SlugValidation {
  // Check length
  if (slug.length < 3) {
    return {
      valid: false,
      available: false,
      error: 'Slug deve ter pelo menos 3 caracteres',
    };
  }

  if (slug.length > 50) {
    return {
      valid: false,
      available: false,
      error: 'Slug deve ter no máximo 50 caracteres',
    };
  }

  // Check format (only lowercase, numbers, hyphens)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      valid: false,
      available: false,
      error: 'Slug deve conter apenas letras minúsculas, números e hífens',
    };
  }

  // Check for reserved slugs
  if (RESERVED_SLUGS.includes(slug)) {
    return {
      valid: false,
      available: false,
      error: 'Este slug é reservado e não pode ser usado',
    };
  }

  return {
    valid: true,
    available: true, // Will be checked separately
  };
}

/**
 * Check if slug is already taken
 */
export function isSlugTaken(slug: string, existingSlugs: string[]): boolean {
  return existingSlugs.includes(slug);
}

/**
 * Generate full shareable URL
 *
 * Combines base URL with slug for complete shareable link.
 */
export function getShareableUrl(slug: string, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  return `${base}/shared/${slug}`;
}

/**
 * Extract slug from shareable URL
 *
 * Parses URL and extracts the slug segment.
 */
export function extractSlugFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/^\/shared\/([a-z0-9-]+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Check if slug matches the reserved pattern
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug);
}

// Export types
export type { ShareableLink, SlugValidation };
