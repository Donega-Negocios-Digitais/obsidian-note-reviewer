import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Annotation, AnnotationStatus } from '../types';
import { supabase } from '../lib/supabase';
import { exportForClaude } from '../utils/claudeExport';
import type { ClaudeAnnotationExport } from '../types/claude';

interface AnnotationState {
  annotations: Annotation[];
  selectedId: string | null;
  selectedIds: string[]; // For bulk selection operations
  history: string[];

  addAnnotation: (annotation: Annotation) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  undo: () => void;
  clear: () => void;
  setAnnotations: (annotations: Annotation[]) => void;

  // Bulk selection actions
  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  getSelectedCount: () => number;
  deleteSelected: () => void;

  // Status tracking actions
  updateAnnotationStatus: (id: string, status: AnnotationStatus, userId: string) => Promise<void>;
  updateAnnotationStatusSync: (id: string, status: AnnotationStatus, userId: string) => void;

  // Claude Code export
  exportForClaude: () => ClaudeAnnotationExport;
}

export const useAnnotationStore = create<AnnotationState>()(
  devtools(
    persist(
      (set, get) => ({
        annotations: [],
        selectedId: null,
        selectedIds: [],
        history: [],

        addAnnotation: (annotation) => set((state) => ({
          annotations: [...state.annotations, annotation],
          history: [...state.history, annotation.id],
          selectedId: annotation.id
        })),

        deleteAnnotation: (id) => set((state) => ({
          annotations: state.annotations.filter(a => a.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
          selectedIds: state.selectedIds.filter(sid => sid !== id)
        })),

        selectAnnotation: (id) => set({ selectedId: id }),

        undo: () => {
          const { history, annotations, selectedIds } = get();
          if (history.length === 0) return;

          const lastId = history[history.length - 1];
          set({
            annotations: annotations.filter(a => a.id !== lastId),
            history: history.slice(0, -1),
            selectedId: null,
            selectedIds: selectedIds.filter(id => id !== lastId)
          });
        },

        clear: () => set({ annotations: [], selectedId: null, selectedIds: [], history: [] }),

        setAnnotations: (annotations) => set({ annotations, selectedIds: [], history: annotations.map(a => a.id) }),

        // Bulk selection actions
        toggleSelection: (id) => set((state) => ({
          selectedIds: state.selectedIds.includes(id)
            ? state.selectedIds.filter(sid => sid !== id)
            : [...state.selectedIds, id]
        })),

        selectAll: () => set((state) => ({
          selectedIds: state.annotations.map(a => a.id)
        })),

        clearSelection: () => set({ selectedIds: [] }),

        getSelectedCount: () => get().selectedIds.length,

        deleteSelected: () => set((state) => {
          const selectedSet = new Set(state.selectedIds);
          return {
            annotations: state.annotations.filter(a => !selectedSet.has(a.id)),
            selectedIds: [],
            selectedId: selectedSet.has(state.selectedId ?? '') ? null : state.selectedId
          };
        }),

        // Status tracking actions
        updateAnnotationStatusSync: (id, status, userId) => set((state) => {
          const now = Date.now();
          const isResolved = status === AnnotationStatus.RESOLVED;

          return {
            annotations: state.annotations.map((annotation) =>
              annotation.id === id
                ? {
                    ...annotation,
                    status,
                    ...(isResolved ? { resolvedAt: now, resolvedBy: userId } : { resolvedAt: undefined, resolvedBy: undefined }),
                  }
                : annotation
            ),
          };
        }),

        updateAnnotationStatus: async (id, status, userId) => {
          const now = Date.now();
          const isResolved = status === AnnotationStatus.RESOLVED;

          // Update local state immediately (optimistic update)
          const updatedAnnotation = {
            status,
            ...(isResolved ? { resolvedAt: now, resolvedBy: userId } : { resolvedAt: null, resolvedBy: null }),
            updated_at: new Date().toISOString(),
          };

          // Update local store
          set((state) => ({
            annotations: state.annotations.map((annotation) =>
              annotation.id === id
                ? {
                    ...annotation,
                    status,
                    ...(isResolved ? { resolvedAt: now, resolvedBy: userId } : { resolvedAt: undefined, resolvedBy: undefined }),
                  }
                : annotation
            ),
          }));

          // Persist to Supabase
          try {
            const { error } = await supabase
              .from('annotations')
              .update({
                metadata: updatedAnnotation,
                updated_at: new Date().toISOString(),
              })
              .eq('id', id);

            if (error) {
              console.error('Failed to update annotation status:', error);
              // Rollback on error (optional - you might want to keep the optimistic update)
            }
          } catch (err) {
            console.error('Error updating annotation status:', err);
          }
        },

        // Claude Code export
        exportForClaude: () => {
          const annotations = get().annotations;
          return exportForClaude(annotations);
        },
      }),
      { name: 'annotation-store' }
    )
  )
);
