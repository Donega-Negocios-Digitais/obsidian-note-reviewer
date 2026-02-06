/**
 * Collaborative Annotation Panel Component
 *
 * Displays annotations with author information and real-time updates.
 */

import React from 'react';
import type { SharedAnnotation } from '../hooks/useSharedAnnotations';

export interface CollaborativeAnnotationPanelProps {
  annotations: SharedAnnotation[];
  currentUserId?: string;
  onAddAnnotation?: (content: string, target?: string) => void;
  onUpdateAnnotation?: (id: string, updates: any) => void;
  onDeleteAnnotation?: (id: string) => void;
  onResolveAnnotation?: (id: string, status: 'open' | 'in-progress' | 'resolved') => void;
}

export function CollaborativeAnnotationPanel({
  annotations,
  currentUserId,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  onResolveAnnotation,
}: CollaborativeAnnotationPanelProps) {
  const [filter, setFilter] = React.useState<'all' | 'mine' | 'open'>('all');

  // Filter annotations
  const filteredAnnotations = React.useMemo(() => {
    switch (filter) {
      case 'mine':
        return annotations.filter((a) => a.authorId === currentUserId);
      case 'open':
        return annotations.filter((a) => a.status === 'open');
      default:
        return annotations;
    }
  }, [annotations, filter, currentUserId]);

  // Group by status
  const grouped = React.useMemo(() => ({
    open: filteredAnnotations.filter((a) => a.status === 'open'),
    inProgress: filteredAnnotations.filter((a) => a.status === 'in-progress'),
    resolved: filteredAnnotations.filter((a) => a.status === 'resolved'),
  }), [filteredAnnotations]);

  return (
    <div className="collaborative-annotation-panel">
      {/* Header with filter */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          Anotações ({annotations.length})
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('mine')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === 'mine'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Minhas
          </button>
          <button
            onClick={() => setFilter('open')}
            className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
              filter === 'open'
                ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            Abertas
          </button>
        </div>
      </div>

      {/* Annotations by status */}
      <div className="space-y-6">
        <AnnotationGroup
          title="Abertas"
          annotations={grouped.open}
          currentUserId={currentUserId}
          onUpdate={onUpdateAnnotation}
          onDelete={onDeleteAnnotation}
          onResolve={onResolveAnnotation}
        />
        <AnnotationGroup
          title="Em Progresso"
          annotations={grouped.inProgress}
          currentUserId={currentUserId}
          onUpdate={onUpdateAnnotation}
          onDelete={onDeleteAnnotation}
          onResolve={onResolveAnnotation}
        />
        <AnnotationGroup
          title="Resolvidas"
          annotations={grouped.resolved}
          currentUserId={currentUserId}
          onUpdate={onUpdateAnnotation}
          onDelete={onDeleteAnnotation}
          onResolve={onResolveAnnotation}
        />
      </div>
    </div>
  );
}

interface AnnotationGroupProps {
  title: string;
  annotations: SharedAnnotation[];
  currentUserId?: string;
  onUpdate?: (id: string, updates: any) => void;
  onDelete?: (id: string) => void;
  onResolve?: (id: string, status: 'open' | 'in-progress' | 'resolved') => void;
}

function AnnotationGroup({
  title,
  annotations,
  currentUserId,
  onUpdate,
  onDelete,
  onResolve,
}: AnnotationGroupProps) {
  if (annotations.length === 0) return null;

  return (
    <div>
      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
        {title} ({annotations.length})
      </h3>
      <div className="space-y-3">
        {annotations.map((annotation) => (
          <CollaborativeAnnotationCard
            key={annotation.id}
            annotation={annotation}
            isOwner={annotation.authorId === currentUserId}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onResolve={onResolve}
          />
        ))}
      </div>
    </div>
  );
}

interface CollaborativeAnnotationCardProps {
  annotation: SharedAnnotation;
  isOwner: boolean;
  onUpdate?: (id: string, updates: any) => void;
  onDelete?: (id: string) => void;
  onResolve?: (id: string, status: 'open' | 'in-progress' | 'resolved') => void;
}

function CollaborativeAnnotationCard({
  annotation,
  isOwner,
  onUpdate,
  onDelete,
  onResolve,
}: CollaborativeAnnotationCardProps) {
  const statusColors = {
    open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
    resolved: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="flex items-start gap-3">
        {/* Author avatar */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
          style={{ backgroundColor: annotation.authorColor || '#6366f1' }}
        >
          {annotation.authorName.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {annotation.authorName}
            </span>
            <span className={`
              px-2 py-0.5 text-xs font-medium rounded-full
              ${statusColors[annotation.status || 'open']}
            `}>
              {annotation.status === 'open' ? 'Aberta' : annotation.status === 'in-progress' ? 'Em Progresso' : 'Resolvida'}
            </span>
          </div>

          {/* Content */}
          {annotation.content && (
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {annotation.content}
            </p>
          )}

          {/* Target reference */}
          {annotation.target && (
            <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-600 dark:text-gray-400">
              {annotation.target}
            </code>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {new Date(annotation.createdAt).toLocaleString('pt-BR')}
          </p>
        </div>

        {/* Actions for owner */}
        {isOwner && (
          <div className="flex flex-col gap-1">
            {onResolve && annotation.status !== 'resolved' && (
              <button
                onClick={() => onResolve(annotation.id, 'resolved')}
                className="text-xs text-green-600 dark:text-green-400 hover:underline"
                title="Marcar como resolvida"
              >
                ✓
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(annotation.id)}
                className="text-xs text-red-600 dark:text-red-400 hover:underline"
                title="Excluir"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default CollaborativeAnnotationPanel;
