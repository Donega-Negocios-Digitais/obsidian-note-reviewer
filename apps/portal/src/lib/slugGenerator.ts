/**
 * Slug Generator
 *
 * URL-friendly unique ID generation using NanoID.
 * Per COLL-03: "Plan owner can generate unique, friendly URL for sharing"
 */

import { nanoid } from "nanoid";

const SLUG_LENGTH = 10; // 10 chars = ~4.5 billion combinations
const SLUG_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

/**
 * Generate unique shareable slug
 * Format: /shared/{slug} where slug is 10-char URL-friendly string
 */
export function generateSlug(): string {
  return nanoid(SLUG_LENGTH);
}

/**
 * Validate slug format (for security)
 */
export function isSlugValid(slug: string): boolean {
  return /^[a-zA-Z0-9]{10}$/.test(slug);
}

/**
 * Generate full share URL
 */
export function getShareUrl(slug: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/shared/${slug}`;
}
