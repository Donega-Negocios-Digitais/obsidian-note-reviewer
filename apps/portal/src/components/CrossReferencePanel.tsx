/**
 * Cross Reference Panel Component
 *
 * Shows inbound and outbound references for the current document.
 */

import React from 'react';
import type { CrossReference, DocumentReferences } from '../hooks/useCrossReferences';

export interface CrossReferencePanelProps {
  references: DocumentReferences;
  currentTabId: string;
  onNavigateToTab?: (tabId: string) => void;
  onClose?: () => void;
}

/**
 * Panel showing document relationships
 */
export function CrossReferencePanel({
  references,
  currentTabId,
  onNavigateToTab,
  onClose,
}: CrossReferencePanelProps) {
  const { inbound, outbound } = references;
  const hasRefs = inbound.length > 0 || outbound.length > 0;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          Referências
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors"
            title="Fechar painel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {!hasRefs ? (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Nenhuma referência encontrada
            </p>
          </div>
        ) : (
          <>
            {/* Inbound References */}
            {inbound.length > 0 && (
              <ReferenceSection
                title="Referenciado por"
                references={inbound}
                direction="inbound"
                onNavigate={onNavigateToTab}
                currentTabId={currentTabId}
              />
            )}

            {/* Outbound References */}
            {outbound.length > 0 && (
              <ReferenceSection
                title="Referencia"
                references={outbound}
                direction="outbound"
                onNavigate={onNavigateToTab}
                currentTabId={currentTabId}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface ReferenceSectionProps {
  title: string;
  references: CrossReference[];
  direction: 'inbound' | 'outbound';
  onNavigate?: (tabId: string) => void;
  currentTabId: string;
}

function ReferenceSection({
  title,
  references,
  direction,
  onNavigate,
  currentTabId,
}: ReferenceSectionProps) {
  // Group by source/target tab
  const grouped = references.reduce((acc, ref) => {
    const key = direction === 'inbound' ? ref.sourceTabId : ref.targetTabId;
    const title = direction === 'inbound' ? ref.sourceTitle : ref.targetTitle;

    if (!acc[key]) {
      acc[key] = { title, refs: [] };
    }
    acc[key].refs.push(ref);
    return acc;
  }, {} as Record<string, { title: string; refs: CrossReference[] }>);

  return (
    <div>
      <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        {title} ({Object.keys(grouped).length})
      </h4>
      <div className="space-y-2">
        {Object.entries(grouped).map(([tabId, { title, refs }]) => (
          <ReferenceCard
            key={tabId}
            tabId={tabId}
            title={title}
            references={refs}
            direction={direction}
            onNavigate={onNavigate}
            isActive={tabId === currentTabId}
          />
        ))}
      </div>
    </div>
  );
}

interface ReferenceCardProps {
  tabId: string;
  title: string;
  references: CrossReference[];
  direction: 'inbound' | 'outbound';
  onNavigate?: (tabId: string) => void;
  isActive: boolean;
}

function ReferenceCard({
  tabId,
  title,
  references,
  direction,
  onNavigate,
  isActive,
}: ReferenceCardProps) {
  const linkTypeIcon = references[0]?.linkType === 'wiki' ? (
    <svg className="w-3.5 h-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  ) : (
    <svg className="w-3.5 h-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
    </svg>
  );

  return (
    <button
      onClick={() => onNavigate?.(tabId)}
      className={`
        w-full text-left p-3 rounded-lg border transition-all
        ${isActive
          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
          : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-750'
        }
      `}
    >
      <div className="flex items-start gap-2">
        {linkTypeIcon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {title}
          </p>
          {references.length > 1 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {references.length} {references.length === 1 ? 'link' : 'links'}
            </p>
          )}
          {references[0]?.context && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {references[0].context}
            </p>
          )}
        </div>
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

/**
 * Compact indicator showing reference count
 */
export interface ReferenceCountBadgeProps {
  count: number;
  onClick?: () => void;
}

export function ReferenceCountBadge({ count, onClick }: ReferenceCountBadgeProps) {
  if (count === 0) return null;

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 text-xs bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
      <span className="font-medium">{count}</span>
    </button>
  );
}

export default CrossReferencePanel;
