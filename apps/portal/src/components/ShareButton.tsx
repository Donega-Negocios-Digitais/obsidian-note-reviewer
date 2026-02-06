/**
 * Share Button Component
 *
 * Opens share dialog for generating shareable links.
 */

import React, { useState } from 'react';

export interface ShareButtonProps {
  documentId: string;
  documentTitle: string;
  onShareCreated?: (slug: string) => void;
}

/**
 * Button that opens the share dialog for creating shareable links
 */
export function ShareButton({ documentId, documentTitle, onShareCreated }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
        Compartilhar
      </button>

      {isOpen && (
        <ShareDialog
          documentId={documentId}
          documentTitle={documentTitle}
          onClose={() => setIsOpen(false)}
          onShareCreated={(slug) => {
            onShareCreated?.(slug);
            setIsOpen(false);
          }}
        />
      )}
    </>
  );
}

// Import ShareDialog at bottom to avoid circular dependency
import { ShareDialog } from './ShareDialog';

export default ShareButton;
