/**
 * Breadcrumbs Component
 *
 * Navigation breadcrumb trail for showing page hierarchy.
 */

import React from 'react';
import { cn } from '@obsidian-note-reviewer/ui/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center space-x-1 text-sm', className)}>
      <ol className="flex items-center space-x-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center">
            {index > 0 && (
              <svg
                className="w-4 h-4 text-gray-400 dark:text-gray-600 mx-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {item.href && !item.current ? (
              <a
                href={item.href}
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
              >
                {item.label}
              </a>
            ) : (
              <span
                className={cn(
                  'font-medium',
                  item.current
                    ? 'text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400'
                )}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Breadcrumb item for manual construction
 */
export interface BreadcrumbProps {
  children: React.ReactNode;
  href?: string;
  current?: boolean;
  className?: string;
}

export function Breadcrumb({ children, href, current, className }: BreadcrumbProps) {
  return (
    <li className="flex items-center">
      {href && !current ? (
        <a
          href={href}
          className={cn(
            'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors text-sm',
            className
          )}
        >
          {children}
        </a>
      ) : (
        <span
          className={cn(
            'font-medium text-sm',
            current ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400',
            className
          )}
          aria-current={current ? 'page' : undefined}
        >
          {children}
        </span>
      )}
    </li>
  );
}

/**
 * Breadcrumb separator
 */
export interface BreadcrumbSeparatorProps {
  className?: string;
}

export function BreadcrumbSeparator({ className }: BreadcrumbSeparatorProps) {
  return (
    <svg
      className={cn('w-4 h-4 text-gray-400 dark:text-gray-600 mx-2', className)}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

/**
 * Breadcrumb list for manual construction
 */
export interface BreadcrumbListProps {
  children: React.ReactNode;
  className?: string;
}

export function BreadcrumbList({ children, className }: BreadcrumbListProps) {
  return (
    <ol className={cn('flex items-center space-x-2', className)}>
      {children}
    </ol>
  );
}

export default Breadcrumbs;
