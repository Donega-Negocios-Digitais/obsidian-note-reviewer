/**
 * Slug Routing Hook
 *
 * Manages slug generation and validation for shared documents.
 */

import { useState, useCallback } from 'react';

export interface SlugValidation {
  isValid: boolean;
  isAvailable: boolean;
  error?: string;
}

export interface UseSlugRoutingOptions {
  existingSlugs?: string[];
  minLength?: number;
  maxLength?: number;
}

export interface UseSlugRoutingReturn {
  slug: string;
  setSlug: (slug: string) => void;
  generateSlug: (title: string) => string;
  validateSlug: (slug: string) => SlugValidation;
  generateUniqueSlug: (title: string) => string;
  slugToUrl: (slug: string, baseUrl?: string) => string;
}

const DEFAULT_OPTIONS = {
  minLength: 3,
  maxLength: 50,
};

/**
 * Convert title to URL-friendly slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    // Remove accents
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace spaces and special chars with hyphens
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Check if slug is valid format
 */
function isValidSlugFormat(slug: string): boolean {
  // Only lowercase letters, numbers, hyphens
  return /^[a-z0-9-]+$/.test(slug) && slug.length > 0;
}

/**
 * Hook for slug routing management
 */
export function useSlugRouting(options: UseSlugRoutingOptions = {}): UseSlugRoutingReturn {
  const { existingSlugs = [], minLength = 3, maxLength = 50 } = options;

  const [slug, setSlugState] = useState<string>('');

  /**
   * Set slug and validate
   */
  const setSlug = useCallback((newSlug: string) => {
    setSlugState(newSlug);
  }, []);

  /**
   * Validate slug
   */
  const validateSlug = useCallback((slugToCheck: string): SlugValidation => {
    // Check format
    if (!isValidSlugFormat(slugToCheck)) {
      return {
        isValid: false,
        isAvailable: false,
        error: 'Use apenas letras, números e hífens',
      };
    }

    // Check length
    if (slugToCheck.length < minLength) {
      return {
        isValid: false,
        isAvailable: false,
        error: `Mínimo de ${minLength} caracteres`,
      };
    }

    if (slugToCheck.length > maxLength) {
      return {
        isValid: false,
        isAvailable: false,
        error: `Máximo de ${maxLength} caracteres`,
      };
    }

    // Check availability
    const isAvailable = !existingSlugs.includes(slugToCheck);

    return {
      isValid: true,
      isAvailable,
      error: isAvailable ? undefined : 'Este nome já está em uso',
    };
  }, [existingSlugs, minLength, maxLength]);

  /**
   * Generate unique slug from title
   */
  const generateUniqueSlug = useCallback((title: string): string => {
    let baseSlug = generateSlug(title);
    let uniqueSlug = baseSlug;
    let counter = 1;

    // Find available slug
    while (existingSlugs.includes(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter}`;
      counter++;
    }

    return uniqueSlug;
  }, [existingSlugs]);

  /**
   * Convert slug to full URL
   */
  const slugToUrl = useCallback((slugValue: string, baseUrl = window.location.origin): string => {
    return `${baseUrl}/shared/${slugValue}`;
  }, []);

  return {
    slug,
    setSlug,
    generateSlug,
    validateSlug,
    generateUniqueSlug,
    slugToUrl,
  };
}

export default useSlugRouting;
