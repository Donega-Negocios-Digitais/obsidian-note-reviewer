import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BaseModal } from './BaseModal';

const BULK_DELETE_MODAL_KEY = 'obsreview-bulk-delete-confirm-open';

function readLocalFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeLocalFlag(key: string, value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(key, '1');
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore persistence errors
  }
}

export interface BulkActionsBarProps {
  selectedCount: number;
  onDeleteSelected: () => void;
  onExportSelected: () => void;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onDeleteSelected,
  onExportSelected,
}) => {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(() => readLocalFlag(BULK_DELETE_MODAL_KEY));

  React.useEffect(() => {
    if (selectedCount === 0 && showDeleteConfirm) {
      setShowDeleteConfirm(false);
    }
  }, [selectedCount, showDeleteConfirm]);

  React.useEffect(() => {
    writeLocalFlag(BULK_DELETE_MODAL_KEY, showDeleteConfirm);
  }, [showDeleteConfirm]);

  // Don't render if nothing is selected
  if (selectedCount === 0) {
    return null;
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDeleteSelected();
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div
        className="absolute bottom-0 left-0 right-0 p-2 border-t border-border/50 bg-card/95 backdrop-blur-sm animate-in slide-in-from-bottom-2 fade-in duration-200"
      >
        <div className="flex items-center justify-between gap-2">
          {/* Selection count */}
          <span className="text-[10px] font-mono bg-primary/20 px-1.5 py-0.5 rounded text-primary flex-shrink-0">
            {selectedCount} {selectedCount === 1 ? t('common.selected_one') : t('common.selected')}
          </span>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            {/* Export Selected */}
            <button
              onClick={onExportSelected}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border/50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {t('annotationPanel.exportSelected')}
            </button>

            {/* Delete Selected */}
            <button
              onClick={handleDeleteClick}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all bg-destructive/10 text-destructive hover:bg-destructive/20 border border-destructive/30 hover:border-destructive/50"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              {t('annotationPanel.deleteSelected')}
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <BaseModal
          isOpen={showDeleteConfirm}
          onRequestClose={handleCancelDelete}
          closeOnBackdropClick={true}
          overlayClassName="z-[100]"
          contentClassName="bg-card border border-border rounded-xl w-full max-w-sm shadow-2xl p-6"
        >
          <div>
            {/* Dialog Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-destructive/10">
                <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="font-semibold text-base text-foreground">{t('annotationPanel.deleteAnnotations')}</h3>
            </div>

            {/* Dialog Content */}
            <p className="text-sm text-muted-foreground mb-6">
              {t('annotationPanel.deleteConfirm')}{' '}
              <span className="font-semibold text-foreground">
                {selectedCount} {selectedCount === 1 ? t('annotationPanel.annotation_one') : t('annotationPanel.annotations')}
              </span>
              ? {t('annotationPanel.cannotUndo')}
            </p>

            {/* Dialog Actions */}
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive hover:bg-destructive/90 rounded-md transition-colors"
              >
                {t('annotationPanel.deleteSelected')}
              </button>
            </div>
          </div>
        </BaseModal>
      )}
    </>
  );
};
