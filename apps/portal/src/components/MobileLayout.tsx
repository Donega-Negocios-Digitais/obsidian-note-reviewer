/**
 * Mobile Layout Component
 *
 * Mobile-optimized layout with responsive behavior.
 */

import React, { useState } from 'react';
import { useResponsive, type Breakpoint } from '../hooks/useResponsive';

export interface MobileLayoutProps {
  children: React.ReactNode;
  header?: React.ReactNode;
  sidebar?: React.ReactNode;
  className?: string;
}

/**
 * Responsive layout wrapper
 */
export function MobileLayout({
  children,
  header,
  sidebar,
  className = '',
}: MobileLayoutProps) {
  const { isMobile } = useResponsive();

  return (
    <div className={`mobile-layout flex flex-col h-full ${className}`}>
      {header && (
        <div className="flex-shrink-0">
          {header}
        </div>
      )}
      <div className={`flex flex-1 overflow-hidden ${isMobile ? 'flex-col' : 'flex-row'}`}>
        {sidebar && (
          <aside className={`
            ${isMobile
              ? 'w-full border-b border-gray-200 dark:border-gray-700 overflow-y-auto'
              : 'w-64 border-r border-gray-200 dark:border-gray-700 overflow-y-auto'
            }
          `}>
            {sidebar}
          </aside>
        )}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

/**
 * Mobile-optimized header with hamburger menu
 */
export interface MobileHeaderProps {
  title: string;
  onMenuToggle?: () => void;
  menuOpen?: boolean;
  actions?: React.ReactNode;
}

export function MobileHeader({
  title,
  onMenuToggle,
  menuOpen,
  actions,
}: MobileHeaderProps) {
  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          )}
          <h1 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {title}
          </h1>
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

/**
 * Mobile bottom navigation bar
 */
export interface MobileNavProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileNav({ children, className = '' }: MobileNavProps) {
  const { isMobile } = useResponsive();

  if (!isMobile) return null;

  return (
    <nav className={`
      flex-shrink-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700
      ${className}
    `}>
      <div className="flex items-center justify-around py-2">
        {children}
      </div>
    </nav>
  );
}

/**
 * Mobile navigation item
 */
export interface MobileNavItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

export function MobileNavItem({ icon, label, active, onClick }: MobileNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors min-w-0 min-h-[56px]
        ${active
          ? 'text-blue-600 dark:text-blue-400'
          : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
        }
      `}
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs font-medium truncate">{label}</span>
    </button>
  );
}

/**
 * Responsive container that changes padding based on breakpoint
 */
export interface ResponsiveContainerProps {
  children: React.ReactNode;
  mobile?: React.ReactNode;
  className?: string;
}

export function ResponsiveContainer({
  children,
  mobile,
  className = '',
}: ResponsiveContainerProps) {
  const { isMobile } = useResponsive();

  return (
    <div className={`responsive-container ${isMobile ? 'px-4 py-3' : 'px-6 py-4'} ${className}`}>
      {isMobile && mobile ? mobile : children}
    </div>
  );
}

export default MobileLayout;
