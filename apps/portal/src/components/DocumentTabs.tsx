/**
 * Document Tabs Component
 *
 * Tab bar for multiple open documents with drag reordering support.
 */

import React, { useRef } from 'react';
import type { DocumentTab } from '../hooks/useDocumentTabs';

export interface DocumentTabsProps {
  tabs: DocumentTab[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onTabMove?: (tabId: string, newPosition: number) => void;
}

/**
 * Tab bar component with drag reordering
 *
 * Displays all open documents as tabs with close buttons.
 */
export function DocumentTabs({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onTabMove,
}: DocumentTabsProps) {
  const dragSourceId = useRef<string | null>(null);

  const handleDragStart = (e: React.DragEvent, tabId: string) => {
    dragSourceId.current = tabId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', tabId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetTabId: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (!dragSourceId.current || !onTabMove) return;

    const sourceIndex = tabs.findIndex((t) => t.id === dragSourceId.current);
    const targetIndex = tabs.findIndex((t) => t.id === targetTabId);

    if (sourceIndex !== targetIndex && sourceIndex !== -1 && targetIndex !== -1) {
      onTabMove(dragSourceId.current, targetIndex);
    }

    dragSourceId.current = null;
  };

  return (
    <div className="document-tabs flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {tabs.map((tab) => (
        <Tab
          key={tab.id}
          tab={tab}
          isActive={tab.id === activeTabId}
          onClick={() => onTabClick(tab.id)}
          onClose={() => onTabClose(tab.id)}
          onDragStart={(e) => handleDragStart(e, tab.id)}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, tab.id)}
        />
      ))}

      {/* New tab button */}
      <button
        className="flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors flex-shrink-0"
        title="Nova aba (Ctrl+T)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
  );
}

interface TabProps {
  tab: DocumentTab;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}

/**
 * Individual tab component with close button
 */
function Tab({ tab, isActive, onClick, onClose, onDragStart, onDragOver, onDrop }: TabProps) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onClick}
      className={`
        group flex items-center gap-2 px-3 py-2 rounded-t-lg border-b-2 cursor-pointer transition-colors min-w-0 max-w-[200px] select-none
        ${
          isActive
            ? 'bg-white dark:bg-gray-900 border-blue-600 text-gray-900 dark:text-white'
            : 'bg-transparent border-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
        }
      `}
    >
      {/* Document title */}
      <span className="flex-1 truncate text-sm font-medium">
        {tab.title}
      </span>

      {/* Modified indicator */}
      {tab.modified && (
        <span className="w-2 h-2 rounded-full bg-blue-600 flex-shrink-0" title="Modificado" />
      )}

      {/* Close button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-all focus:opacity-100"
        title="Fechar (Ctrl+W)"
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * Compact tab variant for smaller spaces
 */
export interface DocumentTabsCompactProps {
  tabs: DocumentTab[];
  activeTabId: string | null;
  onTabClick: (tabId: string) => void;
}

export function DocumentTabsCompact({ tabs, activeTabId, onTabClick }: DocumentTabsCompactProps) {
  return (
    <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabClick(tab.id)}
          className={`
            px-3 py-1.5 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap
            ${
              tab.id === activeTabId
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white border-b-2 border-blue-600 -mb-px'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            }
          `}
        >
          {tab.title}
          {tab.modified && <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-blue-600" />}
        </button>
      ))}
    </div>
  );
}

export default DocumentTabs;
