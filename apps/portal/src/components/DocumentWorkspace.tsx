/**
 * Document Workspace Component
 *
 * Main workspace container with tabs and document content display.
 * Now includes real-time collaboration with Liveblocks.
 */

import React, { useEffect, useCallback, useState } from 'react';
import { DocumentTabs, DocumentTabsCompact } from './DocumentTabs';
import { useDocumentTabs, type DocumentTab } from '../hooks/useDocumentTabs';
import { useResponsive } from '../hooks/useResponsive';
import { useCrossReferences } from '../hooks/useCrossReferences';
import { CrossReferencePanel, ReferenceCountBadge } from './CrossReferencePanel';
import { BreakpointPreview } from './BreakpointPreview';
import { MarkdownRenderer } from '@obsidian-note-reviewer/ui/markdown';
import { AnnotationExport } from '@obsidian-note-reviewer/ui/annotation';
import type { Annotation } from '@obsidian-note-reviewer/ui/types';
import { ShareButton } from '@/components/ShareButton';
import { CollaborationRoom } from '@/components/collaboration/RoomProvider';
import { PresenceList } from '@/components/collaboration/PresenceList';
import { LiveCursors } from '@/components/collaboration/LiveCursors';
import { useCursorTracking, useSelectionTracking } from '@/hooks/useCursorTracking';
import { getRoomId } from '@/lib/roomUtils';
import { useCurrentUser } from '@obsidian-note-reviewer/security/auth';
import { getCursorColor } from '@/lib/cursor-colors';

export interface Document {
  id: string;
  title: string;
  content: string;
  annotations?: Annotation[];
}

export interface DocumentWorkspaceProps {
  initialDocuments?: Document[];
  onDocumentChange?: (document: Document) => void;
  onAnnotationUpdate?: (tabId: string, annotations: Annotation[]) => void;
  compactTabs?: boolean;
  className?: string;
}

/**
 * Full workspace component with tabs and document viewer
 *
 * Manages multiple open documents with tab navigation.
 * Includes real-time collaboration features for the active document.
 */
export function DocumentWorkspace({
  initialDocuments = [],
  onDocumentChange,
  onAnnotationUpdate,
  compactTabs = false,
  className = '',
}: DocumentWorkspaceProps) {
  const {
    tabs,
    activeTab,
    activeTabId,
    addTab,
    closeTab,
    setActiveTab,
    moveTab,
    updateTab,
  } = useDocumentTabs();

  // Get current user for collaboration presence
  const currentUser = useCurrentUser();

  // Enable cursor and selection tracking for real-time collaboration
  useCursorTracking();
  useSelectionTracking();

  // Cross-reference panel state
  const [showReferences, setShowReferences] = useState(false);

  // Responsive hook
  const { isMobile, isTablet } = useResponsive();

  // Cross-references hook
  const { getReferences, getAllReferences } = useCrossReferences({
    tabs,
    activeTabId: activeTab?.id || null,
  });

  // Store annotations per tab
  const [tabAnnotations, setTabAnnotations] = React.useState<Record<string, Annotation[]>>({});

  // Open initial documents on mount
  useEffect(() => {
    initialDocuments.forEach((doc) => {
      addTab({
        documentId: doc.id,
        title: doc.title,
        content: doc.content,
        modified: false,
      });

      // Initialize annotations if provided
      if (doc.annotations) {
        setTabAnnotations((prev) => ({
          ...prev,
          [`tab-${doc.id}`]: doc.annotations,
        }));
      }
    });
  }, [initialDocuments, addTab]);

  // Open a new document
  const handleOpenDocument = useCallback(
    (document: Document) => {
      addTab({
        documentId: document.id,
        title: document.title,
        content: document.content,
        modified: false,
      });

      // Initialize annotations if provided
      if (document.annotations) {
        setTabAnnotations((prev) => ({
          ...prev,
          [`tab-${document.id}`]: document.annotations,
        }));
      }
    },
    [addTab]
  );

  // Handle annotation updates
  const handleAnnotationUpdate = useCallback(
    (annotations: Annotation[]) => {
      if (!activeTabId) return;

      setTabAnnotations((prev) => ({
        ...prev,
        [activeTabId]: annotations,
      }));

      // Mark tab as modified
      updateTab(activeTabId, { modified: true });

      // Notify parent
      if (onAnnotationUpdate && activeTab) {
        onAnnotationUpdate(activeTabId, annotations);
      }
    },
    [activeTabId, updateTab, onAnnotationUpdate]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+W / Cmd+W: Close current tab
      if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
        e.preventDefault();
        if (activeTabId) {
          closeTab(activeTabId);
        }
      }

      // Ctrl+T / Cmd+T: Could open new tab (requires document picker)
      // Ctrl+Tab / Ctrl+Shift+Tab: Switch tabs (could be added)

      // Ctrl+1-9: Switch to specific tab
      if ((e.ctrlKey || e.metaKey) && /^[1-9]$/.test(e.key)) {
        const index = parseInt(e.key) - 1;
        if (index >= 0 && index < tabs.length) {
          e.preventDefault();
          setActiveTab(tabs[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId, tabs, closeTab, setActiveTab]);

  const TabsComponent = compactTabs ? DocumentTabsCompact : DocumentTabs;

  // Prepare user presence for Liveblocks
  const userName = currentUser?.user_metadata?.name || currentUser?.email || 'Usuário';
  const userColor = getCursorColor(userName);

  // Only wrap with CollaborationRoom when there's an active document
  const workspaceContent = (
    <div className={`document-workspace flex flex-col h-full ${className}`}>
      <BreakpointPreview>
        {/* Tab Bar */}
        <TabsComponent
          tabs={tabs}
          activeTabId={activeTabId}
          onTabClick={setActiveTab}
          onTabClose={closeTab}
          onTabMove={moveTab}
        />

      {/* Content Area */}
      <div className="flex-1 overflow-auto relative">
        {activeTab ? (
          <div className={`
            grid gap-4 h-full
            ${isMobile
              ? 'grid-cols-1'
              : isTablet || !showReferences
                ? 'grid-cols-1 lg:grid-cols-2'
                : 'grid-cols-1 lg:grid-cols-[2fr_1fr_20rem]'
            }
          `}>
            {/* Document Content */}
            <div className={`${isMobile ? 'p-4' : 'p-6'} ${!isMobile && !showReferences ? 'lg:col-span-2' : ''} relative`}>
              <div className="max-w-3xl mx-auto">
                {/* Document Header */}
                <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {activeTab.title}
                      </h1>
                      <ReferenceCountBadge
                        count={getReferences(activeTab.id).inbound.length}
                        onClick={() => setShowReferences(!showReferences)}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Presence List - shows active users in this document */}
                      <PresenceList className="mr-2" />
                      <ShareButton
                        documentId={activeTab.documentId}
                        documentTitle={activeTab.title}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {activeTab.modified && (
                      <span className="text-blue-600 dark:text-blue-400">
                        • Modificado
                      </span>
                    )}
                  </p>
                </div>

                {/* Live Cursors Overlay - renders other users' cursors */}
                <LiveCursors />

                {/* Markdown Content */}
                <MarkdownRenderer content={activeTab.content} />
              </div>
            </div>

            {/* Annotations Panel */}
            <div className={`${isMobile ? 'p-4' : 'p-6'}`}>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 sticky top-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Anotações ({tabAnnotations[activeTabId]?.length || 0})
                </h2>

                <AnnotationExport
                  annotations={tabAnnotations[activeTabId] || []}
                  onUpdate={handleAnnotationUpdate}
                />
              </div>
            </div>

            {/* Cross-Reference Panel */}
            {showReferences && !isMobile && (
              <div className="h-full">
                <CrossReferencePanel
                  references={getReferences(activeTab.id)}
                  currentTabId={activeTab.id}
                  onNavigateToTab={setActiveTab}
                  onClose={() => setShowReferences(false)}
                />
              </div>
            )}
          </div>
        ) : (
          // Empty State
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <svg
                className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-lg font-medium mb-2">Nenhum documento aberto</p>
              <p className="text-sm">
                Use Ctrl+T para abrir uma nova aba ou selecione um documento
              </p>

              {/* Keyboard shortcuts hint */}
              <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg text-left">
                <p className="text-xs font-medium mb-2">Atalhos de teclado:</p>
                <ul className="text-xs space-y-1">
                  <li><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">Ctrl+T</kbd> - Nova aba</li>
                  <li><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">Ctrl+W</kbd> - Fechar aba</li>
                  <li><kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">Ctrl+1-9</kbd> - Alternar abas</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      </BreakpointPreview>
    </div>
  );

  // Wrap with CollaborationRoom only when there's an active document
  // This ensures the room is properly scoped to the current document
  if (activeTab) {
    return (
      <CollaborationRoom
        documentId={activeTab.documentId}
        initialPresence={{
          name: userName,
          color: userColor,
        }}
      >
        {workspaceContent}
      </CollaborationRoom>
    );
  }

  return workspaceContent;
}

export default DocumentWorkspace;
