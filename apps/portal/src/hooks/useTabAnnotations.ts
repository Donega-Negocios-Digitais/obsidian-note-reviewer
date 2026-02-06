/**
 * Tab Annotations Hook
 *
 * Manages annotation state per tab with dirty tracking and persistence.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { Annotation } from '@obsidian-note-reviewer/ui/types';

export interface TabAnnotationState {
  tabId: string;
  annotations: Annotation[];
  originalAnnotations: Annotation[];
  isDirty: boolean;
  lastModified: string;
}

export interface UseTabAnnotationsOptions {
  persistKey?: string;
}

export interface UseTabAnnotationsReturn {
  initializeTab: (tabId: string, initialAnnotations: Annotation[]) => void;
  getTabAnnotations: (tabId: string) => Annotation[];
  setTabAnnotations: (tabId: string, annotations: Annotation[]) => void;
  markTabClean: (tabId: string) => void;
  removeTab: (tabId: string) => void;
  isTabDirty: (tabId: string) => boolean;
  getDirtyTabCount: () => number;
  getDirtyTabIds: () => string[];
  hasUnsavedChanges: () => boolean;
}

const PERSIST_KEY = 'obsreview-tab-annotations';

/**
 * Hook for managing per-tab annotation state
 *
 * Tracks original annotations to detect unsaved changes.
 */
export function useTabAnnotations(options: UseTabAnnotationsOptions = {}): UseTabAnnotationsReturn {
  const { persistKey = PERSIST_KEY } = options;

  // Store annotation state per tab (using Map for efficient lookups)
  const [tabStates, setTabStates] = useState<Map<string, TabAnnotationState>>(new Map());

  // Track current active tab
  const activeTabRef = useRef<string | null>(null);

  /**
   * Load saved state from sessionStorage on mount
   */
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(persistKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Record<string, {
          annotations: Annotation[];
          originalAnnotations: Annotation[];
          lastModified: string;
        }>;

        const restoredMap = new Map<string, TabAnnotationState>();

        for (const [tabId, data] of Object.entries(parsed)) {
          restoredMap.set(tabId, {
            tabId,
            annotations: data.annotations,
            originalAnnotations: data.originalAnnotations,
            isDirty: JSON.stringify(data.annotations) !== JSON.stringify(data.originalAnnotations),
            lastModified: data.lastModified,
          });
        }

        setTabStates(restoredMap);
      }
    } catch (e) {
      // SessionStorage might be unavailable or corrupted
      console.warn('Could not restore tab annotations:', e);
    }
  }, [persistKey]);

  /**
   * Initialize annotations for a tab
   */
  const initializeTab = useCallback((tabId: string, initialAnnotations: Annotation[]) => {
    setTabStates((prev) => {
      // Don't overwrite if already exists
      if (prev.has(tabId)) {
        return prev;
      }

      const newMap = new Map(prev);
      newMap.set(tabId, {
        tabId,
        annotations: [...initialAnnotations],
        originalAnnotations: [...initialAnnotations],
        isDirty: false,
        lastModified: new Date().toISOString(),
      });

      return newMap;
    });
  }, []);

  /**
   * Get annotations for a specific tab
   */
  const getTabAnnotations = useCallback((tabId: string): Annotation[] => {
    return tabStates.get(tabId)?.annotations || [];
  }, [tabStates]);

  /**
   * Update annotations for a tab and mark as dirty if changed
   */
  const setTabAnnotations = useCallback((tabId: string, annotations: Annotation[]) => {
    setTabStates((prev) => {
      const newMap = new Map(prev);
      const state = newMap.get(tabId);

      if (state) {
        // Check if annotations actually changed from original
        const isDirty = JSON.stringify(annotations) !== JSON.stringify(state.originalAnnotations);

        newMap.set(tabId, {
          ...state,
          annotations,
          isDirty,
          lastModified: new Date().toISOString(),
        });
      }

      // Persist to sessionStorage for recovery
      try {
        const toPersist = Object.fromEntries(
          Array.from(newMap.entries()).map(([key, value]) => [
            key,
            {
              annotations: value.annotations,
              originalAnnotations: value.originalAnnotations,
              lastModified: value.lastModified,
            },
          ])
        );
        sessionStorage.setItem(persistKey, JSON.stringify(toPersist));
      } catch (e) {
        // SessionStorage might be full or unavailable
        console.warn('Could not persist tab annotations:', e);
      }

      return newMap;
    });
  }, [persistKey]);

  /**
   * Mark a tab as clean (saved) - updates original annotations
   */
  const markTabClean = useCallback((tabId: string) => {
    setTabStates((prev) => {
      const newMap = new Map(prev);
      const state = newMap.get(tabId);

      if (state) {
        newMap.set(tabId, {
          ...state,
          originalAnnotations: [...state.annotations],
          isDirty: false,
          lastModified: new Date().toISOString(),
        });
      }

      // Update persisted state
      try {
        const toPersist = Object.fromEntries(
          Array.from(newMap.entries()).map(([key, value]) => [
            key,
            {
              annotations: value.annotations,
              originalAnnotations: value.originalAnnotations,
              lastModified: value.lastModified,
            },
          ])
        );
        sessionStorage.setItem(persistKey, JSON.stringify(toPersist));
      } catch (e) {
        console.warn('Could not persist tab annotations:', e);
      }

      return newMap;
    });
  }, [persistKey]);

  /**
   * Remove a tab's state (cleanup when tab is closed)
   */
  const removeTab = useCallback((tabId: string) => {
    setTabStates((prev) => {
      const newMap = new Map(prev);
      newMap.delete(tabId);

      // Update persisted state
      try {
        const toPersist = Object.fromEntries(
          Array.from(newMap.entries()).map(([key, value]) => [
            key,
            {
              annotations: value.annotations,
              originalAnnotations: value.originalAnnotations,
              lastModified: value.lastModified,
            },
          ])
        );
        if (Object.keys(toPersist).length === 0) {
          sessionStorage.removeItem(persistKey);
        } else {
          sessionStorage.setItem(persistKey, JSON.stringify(toPersist));
        }
      } catch (e) {
        console.warn('Could not persist tab annotations:', e);
      }

      return newMap;
    });
  }, [persistKey]);

  /**
   * Check if a tab has unsaved changes
   */
  const isTabDirty = useCallback((tabId: string): boolean => {
    return tabStates.get(tabId)?.isDirty || false;
  }, [tabStates]);

  /**
   * Get count of tabs with unsaved changes
   */
  const getDirtyTabCount = useCallback((): number => {
    let count = 0;
    for (const state of tabStates.values()) {
      if (state.isDirty) count++;
    }
    return count;
  }, [tabStates]);

  /**
   * Get list of tab IDs with unsaved changes
   */
  const getDirtyTabIds = useCallback((): string[] => {
    const dirty: string[] = [];
    for (const [tabId, state] of tabStates.entries()) {
      if (state.isDirty) {
        dirty.push(tabId);
      }
    }
    return dirty;
  }, [tabStates]);

  /**
   * Check if any tab has unsaved changes
   */
  const hasUnsavedChanges = useCallback((): boolean => {
    return getDirtyTabCount() > 0;
  }, [getDirtyTabCount]);

  return {
    initializeTab,
    getTabAnnotations,
    setTabAnnotations,
    markTabClean,
    removeTab,
    isTabDirty,
    getDirtyTabCount,
    getDirtyTabIds,
    hasUnsavedChanges,
    tabStates,
  };
}

/**
 * Utility to compare if annotations are equal
 */
export function annotationsEqual(a: Annotation[], b: Annotation[]): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
