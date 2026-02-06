/**
 * Error Display Component
 *
 * User-friendly error display with retry functionality.
 */

import React from 'react';
import { useLogger } from '@obsidian-note-reviewer/ui/hooks/useLogger';
import { cn } from '@obsidian-note-reviewer/ui/lib/utils';

export interface AppErrorProps {
  message: string;
  code?: string;
  retryable?: boolean;
}

export interface ErrorDisplayProps {
  error: AppErrorProps | Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * User-friendly error display component
 */
export function ErrorDisplay({ error, onRetry, onDismiss, className }: ErrorDisplayProps) {
  const { debug } = useLogger('ErrorDisplay');

  debug('Rendering error display', error);

  const errorMessage = error instanceof Error ? error.message : (error as AppErrorProps).message;
  const isRetryable = (error as AppErrorProps).retryable;

  return (
    <div className={cn(
      'p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-red-900 dark:text-red-300">
            Erro
          </h4>
          <p className="text-sm text-red-700 dark:text-red-400 mt-1">
            {errorMessage}
          </p>
          {isRetryable && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
            >
              Tentar Novamente
            </button>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Inline error message (smaller footprint)
 */
export interface InlineErrorProps {
  message: string;
  className?: string;
}

export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div className={cn('flex items-center gap-2 text-sm text-red-600 dark:text-red-400', className)}>
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

/**
 * Form field error (for validation errors)
 */
export interface FieldErrorProps {
  message: string;
  className?: string;
}

export function FieldError({ message, className }: FieldErrorProps) {
  return (
    <p className={cn('text-xs text-red-600 dark:text-red-400 mt-1', className)}>
      {message}
    </p>
  );
}

/**
 * Alert banner for page-level errors
 */
export interface ErrorAlertProps {
  title: string;
  message?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
  onDismiss?: () => void;
  className?: string;
}

export function ErrorAlert({ title, message, actions, onDismiss, className }: ErrorAlertProps) {
  return (
    <div className={cn(
      'p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl',
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-900 dark:text-red-300">
            {title}
          </h3>
          {message && (
            <p className="text-sm text-red-700 dark:text-red-400 mt-1">
              {message}
            </p>
          )}
          {actions && actions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {actions.map((action, index) => (
                <button
                  key={index}
                  onClick={action.onClick}
                  className={cn(
                    'px-3 py-1.5 text-sm font-medium rounded-lg transition-colors',
                    action.variant === 'primary'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
                  )}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors flex-shrink-0"
            aria-label="Fechar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default ErrorDisplay;
