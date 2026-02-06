/**
 * Share Dialog Component
 *
 * Modal dialog for generating and copying shareable links.
 */

import React, { useState, useEffect } from 'react';
import { generateUniqueSlug, validateSlug, getShareableUrl } from '@obsidian-note-reviewer/collaboration/shareableLinks';

export interface ShareDialogProps {
  documentId: string;
  documentTitle: string;
  onClose: () => void;
  onShareCreated?: (slug: string) => void;
}

/**
 * Modal dialog for sharing documents with custom slugs
 */
export function ShareDialog({ documentId, documentTitle, onClose, onShareCreated }: ShareDialogProps) {
  const [slug, setSlug] = useState('');
  const [validation, setValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });
  const [copied, setCopied] = useState(false);

  // Generate initial slug from title
  useEffect(() => {
    const generated = generateUniqueSlug(documentTitle, []);
    setSlug(generated);
  }, [documentTitle]);

  const shareUrl = getShareableUrl(slug);

  const handleSlugChange = (value: string) => {
    setSlug(value);
    const result = validateSlug(value);
    setValidation({ valid: result.valid, error: result.error });
  };

  const handleCopy = async () => {
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

  const handleShare = () => {
    if (!validation.valid || !slug) return;

    // TODO: Save to backend when API is ready
    console.log('Creating share link:', { documentId, slug });

    onShareCreated?.(slug);
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
          Crie um link personalizado para compartilhar este documento com outras pessoas.
        </p>

        {/* Slug Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Link personalizado
          </label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
              r.alexdonega.com.br/shared/
            </span>
            <input
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className={`flex-1 px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                !validation.valid ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="meu-plano"
            />
          </div>
          {!validation.valid && validation.error && (
            <p className="mt-1 text-xs text-red-600 dark:text-red-400">{validation.error}</p>
          )}
        </div>

        {/* Share URL */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Link de compartilhamento
          </label>
          <div className="flex items-center gap-2 p-3 bg-gray-100 dark:bg-gray-900 rounded-lg">
            <code className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
              {shareUrl}
            </code>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors whitespace-nowrap"
            >
              {copied ? 'Copiado!' : 'Copiar'}
            </button>
          </div>
        </div>

        {/* Info note */}
        <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Qualquer pessoa com o link poderá visualizar este documento.
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleShare}
            disabled={!validation.valid || !slug}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            Criar Link
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareDialog;
