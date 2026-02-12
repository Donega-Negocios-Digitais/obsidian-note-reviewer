/**
 * VersionHistory component for displaying document version timeline
 */

import React, { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  History,
  Clock,
  User,
  FileText,
  GitCompare,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useVersionStore } from '../store/useVersionStore';
import type { DocumentVersion } from '../types/version';
import DiffViewer from './DiffViewer';
import { ConfirmationDialog } from './ConfirmationDialog';
import { BaseModal } from './BaseModal';

interface VersionHistoryProps {
  /** Document ID to fetch versions for */
  documentId: string;
  /** Current user ID */
  userId: string;
  /** Callback when version is restored */
  onVersionRestored?: (versionId: string, content: string) => void;
  /** Extra CSS classes */
  className?: string;
}

interface CompareState {
  isOpen: boolean;
  version1: DocumentVersion | null;
  version2: DocumentVersion | null;
}

/**
 * Formats a timestamp in Portuguese locale
 */
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);

  if (diffInHours < 1) {
    const minutes = Math.floor(diffInMs / (1000 * 60));
    return `${minutes} min${minutes !== 1 ? 's' : ''} atrás`;
  }

  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return `${hours}h atrás`;
  }

  if (diffInMs < 7 * 24 * 60 * 60 * 1000) {
    const days = Math.floor(diffInHours / 24);
    return `${days} dia${days !== 1 ? 's' : ''} atrás`;
  }

  return format(date, "dd 'de' MMM 'de' yyyy", { locale: ptBR });
}

/**
 * Version card component for displaying a single version
 */
function VersionCard({
  version,
  isSelected,
  isCurrent,
  onCompare,
  onRestore,
}: {
  version: DocumentVersion;
  isSelected: boolean;
  isCurrent: boolean;
  onCompare: (version: DocumentVersion) => void;
  onRestore: (version: DocumentVersion) => void;
}) {
  return (
    <div
      className={`
        p-4 rounded-lg border transition-all
        ${isSelected
          ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        }
        ${isCurrent ? 'ring-2 ring-green-500/30' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Version header */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
              v{version.versionNumber}
            </span>
            {isCurrent && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                Atual
              </span>
            )}
          </div>

          {/* Description */}
          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
            {version.changeDescription || 'Sem descrição'}
          </h4>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimestamp(version.createdAt)}</span>
            </div>

            {version.metadata?.authorName && (
              <div className="flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>{version.metadata.authorName}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              <span>
                {version.annotationIds?.length || 0} anotação
                {(version.annotationIds?.length || 0) !== 1 ? 'ões' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        {!isCurrent && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onCompare(version)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Comparar com versão atual"
            >
              <GitCompare className="w-4 h-4" />
            </button>
            <button
              onClick={() => onRestore(version)}
              className="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
              title="Restaurar esta versão"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Empty state component
 */
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <History className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        Nenhuma versão salva
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        As versões do documento serão salvas automaticamente quando você fizer
        alterações significativas.
      </p>
    </div>
  );
}

/**
 * Comparison modal for viewing diff between two versions
 */
function ComparisonModal({
  isOpen,
  onClose,
  version1,
  version2,
}: {
  isOpen: boolean;
  onClose: () => void;
  version1: DocumentVersion | null;
  version2: DocumentVersion | null;
}) {
  if (!isOpen || !version1 || !version2) return null;

  return (
    <BaseModal
      isOpen={isOpen}
      onRequestClose={onClose}
      closeOnBackdropClick={false}
      overlayClassName="z-50 bg-black/50"
      contentClassName="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col"
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Comparar Versões
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              v{version1.versionNumber} {'\u2192'} v{version2.versionNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded hover:bg-red-500/10 text-gray-500 dark:text-gray-400 hover:text-red-500"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Diff viewer */}
        <div className="flex-1 overflow-auto p-4">
          <DiffViewer
            oldContent={version1.content}
            newContent={version2.content}
            oldTitle={`v${version1.versionNumber} - ${version1.changeDescription || 'Sem descrição'}`}
            newTitle={`v${version2.versionNumber} - ${version2.changeDescription || 'Sem descrição'}`}
            splitView={true}
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </BaseModal>
  );
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({
  documentId,
  userId: _userId,
  onVersionRestored,
  className = '',
}) => {
  const [page, setPage] = useState(1);
  const [selectedVersion] = useState<DocumentVersion | null>(null);
  const [compareState, setCompareState] = useState<CompareState>({
    isOpen: false,
    version1: null,
    version2: null,
  });
  const [restoreDialog, setRestoreDialog] = useState<{
    isOpen: boolean;
    version: DocumentVersion | null;
  }>({ isOpen: false, version: null });

  const {
    versions,
    isLoading,
    error,
    getVersionsForDocument,
    restoreVersion,
  } = useVersionStore();

  // Load versions when documentId changes
  useEffect(() => {
    if (documentId) {
      setPage(1);
      getVersionsForDocument(documentId, 1, 20);
    }
  }, [documentId, getVersionsForDocument]);

  // Handle compare button click
  const handleCompare = (version: DocumentVersion) => {
    const currentVersion = versions[0]; // First version is the most recent
    setCompareState({
      isOpen: true,
      version1: version,
      version2: currentVersion,
    });
  };

  // Handle restore button click
  const handleRestore = (version: DocumentVersion) => {
    setRestoreDialog({ isOpen: true, version });
  };

  // Confirm restore
  const confirmRestore = async () => {
    if (!restoreDialog.version) return;

    const success = await restoreVersion(restoreDialog.version.id, documentId);

    if (success) {
      onVersionRestored?.(restoreDialog.version.id, restoreDialog.version.content);
    }

    setRestoreDialog({ isOpen: false, version: null });
  };

  // Pagination
  const handleNextPage = () => {
    const newPage = page + 1;
    setPage(newPage);
    getVersionsForDocument(documentId, newPage, 20);
  };

  const handlePrevPage = () => {
    if (page > 1) {
      const newPage = page - 1;
      setPage(newPage);
      getVersionsForDocument(documentId, newPage, 20);
    }
  };

  // Current version is the first one (most recent)
  const currentVersion = versions[0];

  return (
    <div className={`version-history ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <History className="w-5 h-5" />
          Histórico de Versões
        </h3>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && versions.length === 0 && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
            Carregando versões...
          </span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && versions.length === 0 && <EmptyState />}

      {/* Version list */}
      {!isLoading && versions.length > 0 && (
        <>
          <div className="space-y-3">
            {versions.map((version) => (
              <VersionCard
                key={version.id}
                version={version}
                isSelected={selectedVersion?.id === version.id}
                isCurrent={currentVersion?.id === version.id}
                onCompare={handleCompare}
                onRestore={handleRestore}
              />
            ))}
          </div>

          {/* Pagination */}
          {versions.length >= 20 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handlePrevPage}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Anterior
              </button>

              <span className="text-sm text-gray-500 dark:text-gray-400">
                Página {page}
              </span>

              <button
                onClick={handleNextPage}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Próxima
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Comparison modal */}
      <ComparisonModal
        isOpen={compareState.isOpen}
        onClose={() => setCompareState({ isOpen: false, version1: null, version2: null })}
        version1={compareState.version1}
        version2={compareState.version2}
      />

      {/* Restore confirmation dialog */}
      <ConfirmationDialog
        isOpen={restoreDialog.isOpen}
        title="Restaurar Versão"
        message={`Tem certeza que deseja restaurar o documento para a versão ${restoreDialog.version?.versionNumber || ''}? Uma nova versão será criada para registrar esta restauração.`}
        confirmLabel="Restaurar"
        cancelLabel="Cancelar"
        variant="warning"
        onConfirm={confirmRestore}
        onCancel={() => setRestoreDialog({ isOpen: false, version: null })}
      />
    </div>
  );
};

export default VersionHistory;
