/**
 * Settings Layout Component
 *
 * Apple-style settings layout with sidebar navigation.
 */

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export interface SettingsSection {
  id: string;
  title: string;
  icon: string;
  description?: string;
}

export interface SettingsLayoutProps {
  sections: SettingsSection[];
  children: React.ReactNode;
}

const DEFAULT_SECTIONS: SettingsSection[] = [
  { id: 'general', title: 'Geral', icon: '⚙️' },
  { id: 'appearance', title: 'Aparência', icon: '🎨' },
  { id: 'annotations', title: 'Anotações', icon: '📝' },
  { id: 'integration', title: 'Integração', icon: '🔗' },
  { id: 'about', title: 'Sobre', icon: 'ℹ️' },
];

/**
 * Apple-style settings layout with sidebar
 */
export function SettingsLayout({
  sections = DEFAULT_SECTIONS,
  children,
}: SettingsLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Get current section from URL path
  const currentSection = location.pathname.split('/').pop() || 'general';

  return (
    <div className="settings-layout min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Configurações
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="flex">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
            <nav className="p-4 space-y-1">
              {sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => navigate(`/settings/${section.id}`)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-left transition-colors
                    ${currentSection === section.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <span className="text-xl flex-shrink-0">{section.icon}</span>
                  <span className="truncate">{section.title}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact settings header for mobile
 */
export interface SettingsHeaderProps {
  title: string;
  description?: string;
  onBack?: () => void;
}

export function SettingsHeader({ title, description, onBack }: SettingsHeaderProps) {
  return (
    <div className="mb-8">
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Voltar
        </button>
      )}
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
    </div>
  );
}

export default SettingsLayout;
