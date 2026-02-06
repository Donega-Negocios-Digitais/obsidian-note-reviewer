/**
 * Shared Annotations Hook
 *
 * Manages annotations for shared documents with multi-user support.
 */

import { useState, useCallback, useEffect } from 'react';
import type { Annotation } from '@obsidian-note-reviewer/ui/types';
import type { User } from '@obsidian-note-reviewer/collaboration/types';

export interface SharedAnnotation extends Annotation {
  id: string;
  documentId: string;
  authorId: string;
  authorName: string;
  authorColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UseSharedAnnotationsOptions {
  documentId: string;
  initialAnnotations?: SharedAnnotation[];
  roomId?: string;
}

export interface UseSharedAnnotationsReturn {
  annotations: SharedAnnotation[];
  addAnnotation: (annotation: Omit<SharedAnnotation, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAnnotation: (id: string, updates: Partial<SharedAnnotation>) => void;
  deleteAnnotation: (id: string) => void;
  resolveAnnotation: (id: string, status: 'open' | 'in-progress' | 'resolved') => void;
  getUserAnnotations: (userId: string) => SharedAnnotation[];
  getAnnotationsByStatus: (status: 'open' | 'in-progress' | 'resolved') => SharedAnnotation[];
}

/**
 * Hook for managing shared document annotations
 */
export function useSharedAnnotations({
  documentId,
  initialAnnotations = [],
  roomId,
}: UseSharedAnnotationsOptions): UseSharedAnnotationsReturn {
  const [annotations, setAnnotations] = useState<SharedAnnotation[]>(initialAnnotations);

  /**
   * Add new annotation
   */
  const addAnnotation = useCallback((
    annotation: Omit<SharedAnnotation, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const newAnnotation: SharedAnnotation = {
      ...annotation,
      id: `anno-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      documentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setAnnotations((prev) => [...prev, newAnnotation]);

    // Broadcast to Liveblocks room if available
    if (roomId && typeof window !== 'undefined') {
      // @ts-ignore - Liveblocks integration
      window.broadcastEvent?.({
        type: 'annotation-added',
        annotation: newAnnotation,
      });
    }

    return newAnnotation.id;
  }, [documentId, roomId]);

  /**
   * Update existing annotation
   */
  const updateAnnotation = useCallback((id: string, updates: Partial<SharedAnnotation>) => {
    setAnnotations((prev) =>
      prev.map((anno) =>
        anno.id === id
          ? { ...anno, ...updates, updatedAt: new Date().toISOString() }
          : anno
      )
    );
  }, [roomId]);

  /**
   * Delete annotation
   */
  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((anno) => anno.id !== id));
  }, []);

  /**
   * Resolve annotation (change status)
   */
  const resolveAnnotation = useCallback((
    id: string,
    status: 'open' | 'in-progress' | 'resolved'
  ) => {
    setAnnotations((prev) =>
      prev.map((anno) =>
        anno.id === id
          ? { ...anno, status, updatedAt: new Date().toISOString() }
          : anno
      )
    );
  }, []);

  /**
   * Get annotations by user
   */
  const getUserAnnotations = useCallback((userId: string): SharedAnnotation[] => {
    return annotations.filter((anno) => anno.authorId === userId);
  }, [annotations]);

  /**
   * Get annotations by status
   */
  const getAnnotationsByStatus = useCallback((
    status: 'open' | 'in-progress' | 'resolved'
  ): SharedAnnotation[] => {
    return annotations.filter((anno) => anno.status === status);
  }, [annotations]);

  return {
    annotations,
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    resolveAnnotation,
    getUserAnnotations,
    getAnnotationsByStatus,
  };
}

/**
 * Transform local annotation to shared annotation
 */
export function toSharedAnnotation(
  annotation: Annotation,
  user: Pick<User, 'id' | 'name' | 'color'>
): Omit<SharedAnnotation, 'id' | 'documentId' | 'createdAt' | 'updatedAt'> {
  return {
    ...annotation,
    authorId: user.id,
    authorName: user.name,
    authorColor: user.color,
  };
}

/**
 * Transform shared annotation to local format
 */
export function fromSharedAnnotation(shared: SharedAnnotation): Annotation {
  const { authorId, authorName, authorColor, documentId, createdAt, updatedAt, ...annotation } = shared;
  return annotation as Annotation;
}

export default useSharedAnnotations;
