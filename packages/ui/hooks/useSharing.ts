/**
 * Hook for URL-based state sharing in Obsidian Note Reviewer
 *
 * Handles:
 * - Loading shared state from URL hash on mount
 * - Generating shareable URLs
 * - Tracking whether current session is from a shared link
 */

import { useState, useEffect, useCallback } from 'react';
import { Annotation } from '../types';
import {
  parseShareHash,
  generateShareUrl,
  fromShareable,
  formatUrlSize,
} from '../utils/sharing';

interface UseSharingResult {
  /** Whether the current session was loaded from a shared URL */
  isSharedSession: boolean;

  /** Whether we're currently loading from a shared URL */
  isLoadingShared: boolean;

  /** The current shareable URL (updates when annotations change) */
  shareUrl: string;

  /** Human-readable size of the share URL */
  shareUrlSize: string;

  /** Error message when URL generation fails */
  shareError: string | null;

  /** Annotations loaded from share that need to be applied to DOM */
  pendingSharedAnnotations: Annotation[] | null;

  /** Call after applying shared annotations to clear the pending state */
  clearPendingSharedAnnotations: () => void;

  /** Manually trigger share URL generation */
  refreshShareUrl: () => Promise<void>;
}

type ShareUrlResolver = () => Promise<string | null>;

export function useSharing(
  markdown: string,
  annotations: Annotation[],
  setMarkdown: (m: string) => void,
  setAnnotations: (a: Annotation[]) => void,
  onSharedLoad?: () => void,
  enabled: boolean = true,
  resolveShareUrl?: ShareUrlResolver,
): UseSharingResult {
  const [isSharedSession, setIsSharedSession] = useState(false);
  const [isLoadingShared, setIsLoadingShared] = useState(true);
  const [shareUrl, setShareUrl] = useState('');
  const [shareUrlSize, setShareUrlSize] = useState('');
  const [shareError, setShareError] = useState<string | null>(null);
  const [pendingSharedAnnotations, setPendingSharedAnnotations] = useState<Annotation[] | null>(null);

  const clearPendingSharedAnnotations = useCallback(() => {
    setPendingSharedAnnotations(null);
  }, []);

  // Load shared state from URL hash
  const loadFromHash = useCallback(async () => {
    if (!enabled) {
      return false;
    }

    try {
      const payload = await parseShareHash();

      if (payload) {
        // Set plan content
        setMarkdown(payload.p);

        // Convert shareable annotations to full annotations
        const restoredAnnotations = fromShareable(payload.a);
        setAnnotations(restoredAnnotations);

        // Store for later application to DOM
        setPendingSharedAnnotations(restoredAnnotations);

        setIsSharedSession(true);

        // Notify parent that we loaded from a share
        onSharedLoad?.();

        // Clear the hash from URL to prevent re-loading on refresh
        // but keep the state in memory
        window.history.replaceState(
          {},
          '',
          window.location.pathname
        );

        return true;
      }
      return false;
    } catch (e) {
      console.error('Failed to load from share hash:', e);
      return false;
    }
  }, [setMarkdown, setAnnotations, onSharedLoad, enabled]);

  // Load from hash on mount
  useEffect(() => {
    if (!enabled) {
      setIsLoadingShared(false);
      return;
    }

    loadFromHash().finally(() => setIsLoadingShared(false));
  }, [enabled]); // Only run on mount

  // Listen for hash changes (when user pastes a new share URL)
  useEffect(() => {
    if (!enabled) return;

    const handleHashChange = () => {
      if (window.location.hash.length > 1) {
        loadFromHash();
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [loadFromHash, enabled]);

  const refreshLegacyShareUrl = useCallback(async () => {
    if (!enabled) {
      setShareUrl('');
      setShareUrlSize('');
      setShareError(null);
      return;
    }

    try {
      const url = await generateShareUrl(markdown, annotations);
      setShareUrl(url);
      setShareUrlSize(formatUrlSize(url));
      setShareError(null);
    } catch (e) {
      console.error('Failed to generate share URL:', e);
      setShareUrl('');
      setShareUrlSize('');
      setShareError('Não foi possível gerar o link de compartilhamento.');
    }
  }, [markdown, annotations, enabled]);

  const refreshResolvedShareUrl = useCallback(async () => {
    if (!enabled) {
      setShareUrl('');
      setShareUrlSize('');
      setShareError(null);
      return;
    }

    if (!resolveShareUrl) {
      return;
    }

    try {
      const url = await resolveShareUrl();
      if (!url) {
        setShareUrl('');
        setShareUrlSize('');
        setShareError(null);
        return;
      }

      setShareUrl(url);
      setShareUrlSize(formatUrlSize(url));
      setShareError(null);
    } catch (e) {
      console.error('Failed to resolve public share URL:', e);
      setShareUrl('');
      setShareUrlSize('');
      setShareError('Não foi possível gerar o link público de compartilhamento.');
    }
  }, [enabled, resolveShareUrl]);

  const refreshShareUrl = useCallback(async () => {
    if (resolveShareUrl) {
      await refreshResolvedShareUrl();
      return;
    }

    await refreshLegacyShareUrl();
  }, [resolveShareUrl, refreshLegacyShareUrl, refreshResolvedShareUrl]);

  // Auto-refresh public share URL when resolver changes
  useEffect(() => {
    if (!resolveShareUrl) return;
    refreshResolvedShareUrl();
  }, [resolveShareUrl, refreshResolvedShareUrl]);

  // Auto-refresh legacy share URL when content changes
  useEffect(() => {
    if (resolveShareUrl) return;
    refreshLegacyShareUrl();
  }, [resolveShareUrl, refreshLegacyShareUrl]);

  return {
    isSharedSession,
    isLoadingShared,
    shareUrl,
    shareUrlSize,
    shareError,
    pendingSharedAnnotations,
    clearPendingSharedAnnotations,
    refreshShareUrl,
  };
}
