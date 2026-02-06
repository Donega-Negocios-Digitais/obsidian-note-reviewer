/**
 * Document Tabs Hook
 *
 * Manages state for multiple open document tabs with reordering and persistence.
 */

import { useState, useCallback, useEffect } from 'react';

export interface DocumentTab {
  id: string;
  documentId: string;
  title: string;
  content: string;
  modified: boolean;
  position: number;
}

export interface UseDocumentTabsOptions {
  maxTabs?: number;
  persistKey?: string;
}

export interface UseDocumentTabsReturn {
  tabs: DocumentTab[];
  activeTab: DocumentTab | null;
  activeTabId: string | null;
  addTab: (document: Omit<DocumentTab, 'id' | 'position'>) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  moveTab: (tabId: string, newPosition: number) => void;
  updateTab: (tabId: string, updates: Partial<DocumentTab>) => void;
}

const PERSIST_KEY = 'obsreview-doc-tabs';

/**
 * Hook for managing multiple document tabs
 *
 * @param options - Configuration options
 * @returns Tab state and manipulation functions
 */
export function useDocumentTabs(options: UseDocumentTabsOptions = {}): UseDocumentTabsReturn {
  const { maxTabs = 10, persistKey = PERSIST_KEY } = options;

  const [tabs, setTabs] = useState<DocumentTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Load tabs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(persistKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Array<{
          documentId: string;
          title: string;
          position: number;
        }>;

        // Note: We can't restore content from localStorage for security reasons
        // This is just for remembering which documents were open
        // The actual content would need to be fetched from the API
      }
    } catch {
      // Ignore storage errors
    }
  }, [persistKey]);

  /**
   * Add a new tab or switch to existing one
   */
  const addTab = useCallback((document: Omit<DocumentTab, 'id' | 'position'>) => {
    setTabs((prev) => {
      // Check if document is already open
      const existing = prev.find((t) => t.documentId === document.documentId);
      if (existing) {
        setActiveTabId(existing.id);
        return prev;
      }

      // Check max tabs limit
      if (prev.length >= maxTabs) {
        return prev;
      }

      const newTab: DocumentTab = {
        ...document,
        id: `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        position: prev.length,
      };

      const updated = [...prev, newTab];
      setActiveTabId(newTab.id);

      // Persist to localStorage (without content)
      if (persistKey) {
        const toPersist = updated.map((t) => ({
          documentId: t.documentId,
          title: t.title,
          position: t.position,
        }));
        localStorage.setItem(persistKey, JSON.stringify(toPersist));
      }

      return updated;
    });
  }, [maxTabs, persistKey]);

  /**
   * Close a tab and update active tab if needed
   */
  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      const updated = prev.filter((t) => t.id !== tabId);

      // Update active tab if closing the active one
      if (activeTabId === tabId) {
        const index = prev.findIndex((t) => t.id === tabId);
        // Try to select the tab to the right, or to the left
        const nextTab = updated[index] || updated[index - 1] || null;
        setActiveTabId(nextTab?.id || null);
      }

      // Clear storage if no tabs left
      if (persistKey && updated.length === 0) {
        localStorage.removeItem(persistKey);
      }

      return updated;
    });
  }, [activeTabId, persistKey]);

  /**
   * Set the active tab
   */
  const setActiveTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
  }, []);

  /**
   * Move a tab to a new position (drag reordering)
   */
  const moveTab = useCallback((tabId: string, newPosition: number) => {
    setTabs((prev) => {
      const tab = prev.find((t) => t.id === tabId);
      if (!tab) return prev;

      const sourceIndex = prev.findIndex((t) => t.id === tabId);
      if (sourceIndex === newPosition) return prev;

      const withoutTab = prev.filter((t) => t.id !== tabId);

      // Insert at new position
      const updated = [
        ...withoutTab.slice(0, newPosition),
        { ...tab, position: newPosition },
        ...withoutTab.slice(newPosition),
      ];

      // Recalculate all positions
      return updated.map((t, i) => ({ ...t, position: i }));
    });
  }, []);

  /**
   * Update a tab's properties (e.g., title, modified status)
   */
  const updateTab = useCallback((tabId: string, updates: Partial<DocumentTab>) => {
    setTabs((prev) =>
      prev.map((t) => (t.id === tabId ? { ...t, ...updates } : t))
    );
  }, []);

  const activeTab = tabs.find((t) => t.id === activeTabId) || null;

  return {
    tabs,
    activeTab,
    activeTabId,
    addTab,
    closeTab,
    setActiveTab,
    moveTab,
    updateTab,
  };
}

/**
 * Utility to generate a unique tab ID
 */
export function generateTabId(): string {
  return `tab-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
