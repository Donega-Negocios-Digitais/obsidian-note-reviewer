/**
 * Share Dialog Component
 *
 * Modal dialog for generating and copying shareable links.
 * Uses NanoID-based unique slugs with Supabase storage.
 */

import React, { useState, useEffect } from 'react';
import { createSharedLink, getExistingShare, getDocumentBySlug } from '@/lib/supabase/sharing';
import { getShareUrl } from '@/lib/slugGenerator';

export interface ShareDialogProps {
  documentId: string;
  documentTitle: string;
  onClose: () => void;
  onShareCreated?: (slug: string) => void;
}

/**
 * Modal dialog for sharing documents with NanoID-generated slugs
 */
export function ShareDialog({ documentId, documentTitle, onClose, onShareCreated }: ShareDialogProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Check for existing share or create new one on mount
  useEffect(() => {
    const loadOrCreateShare = async () => {
      try {
        setLoading(true);

        // Check if already shared
        const existingSlug = await getExistingShare(documentId);

        if (existingSlug) {
          setSlug(existingSlug);
          setShareUrl(getShareUrl(existingSlug));
        } else {
          // Auto-create a new share link with NanoID
          setCreating(true);
          const result = await createSharedLink(documentId);
          setSlug(result.slug);
          setShareUrl(result.url);
          onShareCreated?.(result.slug);
        }
      } catch (error) {
        console.error('Failed to load share:', error);
      } finally {
        setLoading(false);
        setCreating(false);
      }
    };

    loadOrCreateShare();
  }, [documentId, onShareCreated]);

  const handleCopy = async () => {
    if (!shareUrl) return;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Compartilhar Documento
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          {loading || creating ? 'Gerando link de compartilhamento...' : 'Copie o link abaixo para compartilhar este documento.'}
        </p>

        {/* Share URL */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Link de compartilhamento
          </label>
          {loading || creating ? (
            <div className="flex items-center justify-center p-6 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
              <code className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                {shareUrl || 'Carregando...'}
              </code>
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
              >
                {copied ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          )}
        </div>

        {/* Info note */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Qualquer pessoa com o link poderá visualizar este documento. O link é único e não expira.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading || creating}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareDialog;
