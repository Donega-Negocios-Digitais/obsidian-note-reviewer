/**
 * HowItWorksModal
 *
 * Shows a tutorial video from YouTube.
 */

import React from 'react';

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowItWorksModal: React.FC<HowItWorksModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const videoUrl = 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE?autoplay=1&mute=1&rel=0&modestbranding=1';
  const youtubeWatchUrl = 'https://www.youtube.com/watch?v=M7lc1UVf-VE';

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-2xl relative"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-video-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 id="help-video-title" className="font-semibold text-sm">Como o Obsidian Note Reviewer Funciona</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="relative w-full bg-black/50" style={{ paddingTop: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={videoUrl}
            title="Como o Obsidian Note Reviewer Funciona"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            loading="lazy"
          />
        </div>

        <div className="flex items-center justify-end gap-2 p-3 border-t border-border">
          <a
            href={youtubeWatchUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 text-xs rounded-md bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            Abrir no YouTube
          </a>
        </div>
      </div>
    </div>
  );
};
