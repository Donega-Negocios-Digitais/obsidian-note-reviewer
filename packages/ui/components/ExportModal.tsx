/**
 * Export Modal with tabs for Share and Raw Diff
 *
 * Share tab (default): Shows shareable URL with copy button
 * Raw Diff tab: Shows human-readable diff output with copy/download
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCopyFeedback } from '../hooks/useCopyFeedback';
import { BaseModal } from './BaseModal';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  shareUrl: string;
  shareUrlSize: string;
  shareError?: string | null;
  initialTab?: Tab;
  diffOutput: string;
  annotationCount: number;
  taterSprite?: React.ReactNode;
}

type Tab = 'share' | 'diff';

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  shareUrl,
  shareUrlSize,
  shareError = null,
  initialTab = 'share',
  diffOutput,
  annotationCount,
  taterSprite,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);

  // Copy URL feedback (share tab)
  const {
    copied: urlCopied,
    handleCopy: handleCopyUrl,
    animationClass: urlAnimationClass,
    buttonClass: urlButtonClass,
    iconClass: urlIconClass,
  } = useCopyFeedback();

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  // Copy diff feedback (diff tab)
  const {
    copied: diffCopied,
    handleCopy: handleCopyDiff,
    animationClass: diffAnimationClass,
    buttonClass: diffButtonClass,
  } = useCopyFeedback();

  if (!isOpen) return null;

  const handleDownloadDiff = () => {
    const blob = new Blob([diffOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'annotations-revisao.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getAnnotationsLabel = () => {
    if (annotationCount === 1) {
      return t('exportModal.annotationsCount_one', { count: annotationCount });
    }
    return t('exportModal.annotationsCount', { count: annotationCount });
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onRequestClose={onClose}
      closeOnBackdropClick={false}
      overlayClassName="z-50"
      contentClassName="bg-card border border-border rounded-xl w-full max-w-2xl flex flex-col max-h-[80vh] shadow-2xl relative"
      contentProps={{
        role: 'dialog',
        'aria-modal': true,
        'aria-labelledby': 'export-modal-title',
      }}
    >
      <div className="h-full flex flex-col">
        {taterSprite}

        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex justify-between items-center">
            <h3 id="export-modal-title" className="font-semibold text-sm">{t('exportModal.title')}</h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {getAnnotationsLabel()}
              </span>
              <button
                onClick={onClose}
                className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto p-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-muted rounded-lg p-1 mb-4">
            <button
              onClick={() => setActiveTab('share')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'share'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t('exportModal.share')}
            </button>
            <button
              onClick={() => setActiveTab('diff')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeTab === 'diff'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Relatório de Revisão
            </button>
          </div>

          {/* Tab content */}
          {activeTab === 'share' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-2">
                  {t('exportModal.shareableUrl')}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    className="flex-1 bg-muted rounded-lg px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-accent/50 min-w-0"
                    onClick={e => (e.target as HTMLInputElement).select()}
                  />
                  <button
                    onClick={() => handleCopyUrl(shareUrl)}
                    disabled={!shareUrl || !!shareError}
                    className={`px-3 py-2 rounded-lg text-xs font-medium bg-background hover:bg-muted border border-border transition-colors flex items-center gap-1.5 flex-shrink-0 ${urlAnimationClass} ${urlButtonClass}`}
                  >
                    {urlCopied ? (
                      <>
                        <svg className={`w-3 h-3 copy-check-animated ${urlIconClass}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        {t('exportModal.copied')}
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        {t('exportModal.copy')}
                      </>
                    )}
                  </button>
                </div>
                {shareError ? (
                  <p className="text-[10px] text-destructive mt-1.5">{shareError}</p>
                ) : (
                  <p className="text-[10px] text-muted-foreground mt-1.5">{shareUrlSize}</p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                {t('exportModal.urlDescription')}
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-muted-foreground mb-3">
                Resumo das alterações solicitadas, pronto para copiar e enviar ao autor
              </p>
              <pre className="bg-muted rounded-lg p-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre-wrap">
                {diffOutput}
              </pre>
            </>
          )}
        </div>

        {/* Footer actions - only show for Raw Diff tab */}
        {activeTab === 'diff' && (
          <div className="p-4 border-t border-border flex justify-end gap-2">
            <button
              onClick={() => handleCopyDiff(diffOutput)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium bg-muted hover:bg-muted/80 transition-colors ${diffAnimationClass} ${diffButtonClass}`}
            >
              {diffCopied ? t('exportModal.copied') : t('exportModal.copy')}
            </button>
            <button
              onClick={handleDownloadDiff}
              className="px-3 py-1.5 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            >
              Baixar Relatório
            </button>
          </div>
        )}
      </div>
    </BaseModal>
  );
};
