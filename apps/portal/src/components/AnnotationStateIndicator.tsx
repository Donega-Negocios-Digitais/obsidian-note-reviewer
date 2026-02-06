/**
 * Annotation State Indicator Component
 *
 * Visual indicator for unsaved annotation changes in tabs.
 */

import React from 'react';

export interface AnnotationStateIndicatorProps {
  dirty: boolean;
  count: number;
  onSave?: () => void;
  className?: string;
}

/**
 * Display annotation state with save prompt when dirty
 */
export function AnnotationStateIndicator({
  dirty,
  count,
  onSave,
  className = '',
}: AnnotationStateIndicatorProps) {
  // Clean state - show normal indicator
  if (!dirty) {
    return (
      <div className={`flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 ${className}`}>
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{count} anotaç{count === 1 ? 'ão' : 'ões'}</span>
      </div>
    );
  }

  // Dirty state - show warning with save prompt
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg ${className}`}>
      <svg className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="text-xs font-medium text-amber-800 dark:text-amber-300">
        {count} anotaç{count === 1 ? 'ão' : 'ões'} não salvas
      </span>
      {onSave && (
        <button
          onClick={onSave}
          className="text-xs text-amber-700 dark:text-amber-400 hover:text-amber-900 dark:hover:text-amber-200 underline font-medium transition-colors"
        >
          Salvar agora
        </button>
      )}
    </div>
  );
}

/**
 * Compact dot indicator for tab titles
 */
export interface AnnotationStateDotProps {
  dirty: boolean;
  count?: number;
}

/**
 * Small dot indicator showing modified state
 */
export function AnnotationStateDot({ dirty, count }: AnnotationStateDotProps) {
  if (!dirty) return null;

  return (
    <span
      className="inline-block w-2 h-2 rounded-full bg-blue-600 flex-shrink-0"
      title={`${count || 0} anotaç${(count || 0) === 1 ? 'ão' : 'ões'} não salvas`}
    />
  );
}

/**
 * Badge with count for toolbar display
 */
export interface AnnotationStateBadgeProps {
  dirtyCount: number;
  totalCount: number;
  onClick?: () => void;
}

export function AnnotationStateBadge({ dirtyCount, totalCount, onClick }: AnnotationStateBadgeProps) {
  if (dirtyCount === 0) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4m5 1v4a2 2 0 002 2h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm0 0v6a2 2 0 002 2h6a2 2 0 002-2V8a2 2 0 00-2-2H9a2 2 0 00-2 2z" />
        </svg>
        <span>{totalCount}</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2 py-1 text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span className="font-medium">{dirtyCount}/{totalCount}</span>
    </button>
  );
}

/**
 * Unsaved changes warning dialog
 */
export interface UnsavedChangesWarningProps {
  dirtyTabCount: number;
  onDiscard?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export function UnsavedChangesWarning({
  dirtyTabCount,
  onDiscard,
  onSave,
  onCancel,
}: UnsavedChangesWarningProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
        {/* Icon */}
        <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        {/* Message */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
          Alterações não salvas
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
          {dirtyTabCount === 1
            ? 'Você tem 1 aba com alterações não salvas.'
            : `Você tem ${dirtyTabCount} abas com alterações não salvas.`
          }
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          {onCancel && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            >
              Cancelar
            </button>
          )}
          {onDiscard && (
            <button
              onClick={onDiscard}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Descartar
            </button>
          )}
          {onSave && (
            <button
              onClick={onSave}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Salvar Tudo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnnotationStateIndicator;
