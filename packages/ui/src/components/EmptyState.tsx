/**
 * Empty State Component
 *
 * Displayed when there's no content to show with helpful messaging.
 */

import React from 'react';
import { cn } from '@obsidian-note-reviewer/ui/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'ghost';
  };
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      {icon && (
        <div className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-600 flex items-center justify-center">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-md">
          {description}
        </p>
      )}

      {action && (
        <button
          onClick={action.onClick}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
            action.variant === 'primary' &&
              'bg-blue-600 text-white hover:bg-blue-700',
            action.variant === 'secondary' &&
              'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600',
            (!action.variant || action.variant === 'ghost') &&
              'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
          )}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

/**
 * Predefined empty states with icons
 */
export const EmptyStates = {
  noDocuments: (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      }
      title="Nenhum documento ainda"
      description="Crie seu primeiro documento para começar a revisar"
      action={{ label: 'Criar Documento', onClick: () => {} }}
    />
  ),

  noAnnotations: (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
        </svg>
      }
      title="Nenhuma anotação"
      description="Adicione anotações ao documento para começar a revisar"
    />
  ),

  noSearchResults: (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="Nenhum resultado encontrado"
      description="Tente buscar com outros termos ou filtros"
    />
  ),

  noCollaborators: (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      }
      title="Nenhum colaborador"
      description="Convide pessoas para colaborar neste documento"
      action={{ label: 'Convidar', onClick: () => {}, variant: 'primary' }}
    />
  ),

  error: (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      }
      title="Algo deu errado"
      description="Ocorreu um erro ao carregar o conteúdo. Tente novamente."
      action={{ label: 'Tentar Novamente', onClick: () => {}, variant: 'secondary' }}
    />
  ),

  notFound: (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      }
      title="Página não encontrada"
      description="A página que você está procurando não existe ou foi removida."
      action={{ label: 'Voltar ao Início', onClick: () => {}, variant: 'secondary' }}
    />
  ),
};

export default EmptyState;
