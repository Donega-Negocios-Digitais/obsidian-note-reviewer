/**
 * Spinner Component
 *
 * Loading spinner for async operations.
 */

import React from 'react';
import { cn } from '@obsidian-note-reviewer/ui/lib/utils';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  xs: 'w-3 h-3 border-2',
  sm: 'w-4 h-4 border-2',
  md: 'w-6 h-6 border-2',
  lg: 'w-8 h-8 border-3',
  xl: 'w-12 h-12 border-4',
};

/**
 * Spinner component for loading states
 */
export function Spinner({ size = 'md', className }: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-gray-300 dark:border-gray-700',
        'border-t-blue-600 dark:border-t-blue-400',
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Carregando"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
}

/**
 * Full-screen spinner overlay
 */
export interface SpinnerOverlayProps {
  visible: boolean;
  message?: string;
}

export function SpinnerOverlay({ visible, message }: SpinnerOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="xl" />
        {message && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Inline spinner with text
 */
export interface SpinnerWithTextProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SpinnerWithText({ text = 'Carregando...', size = 'md', className }: SpinnerWithTextProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Spinner size={size === 'lg' ? 'md' : size === 'sm' ? 'sm' : 'sm'} />
      <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
    </div>
  );
}

/**
 * Button with loading state
 */
export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
}

export function LoadingButton({
  loading = false,
  loadingText = 'Carregando...',
  children,
  disabled,
  className,
  ...props
}: LoadingButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium rounded-lg',
        'bg-blue-600 text-white hover:bg-blue-700',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'transition-colors',
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" />}
      {loading ? loadingText : children}
    </button>
  );
}

/**
 * Skeleton loader for content placeholders
 */
export interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  width,
  height,
}: SkeletonProps) {
  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-md',
  };

  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 dark:bg-gray-700',
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

/**
 * Skeleton for card content
 */
export interface CardSkeletonProps {
  showAvatar?: boolean;
  lines?: number;
  className?: string;
}

export function CardSkeleton({ showAvatar = true, lines = 3, className }: CardSkeletonProps) {
  return (
    <div className={cn('p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700', className)}>
      <div className="flex items-start gap-3">
        {showAvatar && (
          <Skeleton variant="circular" width={32} height={32} className="flex-shrink-0" />
        )}
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} />
          {Array.from({ length: lines }).map((_, i) => (
            <Skeleton key={i} width={i === lines - 1 ? '80%' : '100%'} height={12} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default Spinner;
