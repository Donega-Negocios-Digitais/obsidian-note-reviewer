/**
 * Settings Panel Component
 *
 * Modal/panel settings UI with categories including Obsidian vault configuration.
 * Designed to be used within the editor/document workspace.
 */

import React, { useState } from 'react';
import { VaultPathSelector } from '@/components/VaultPathSelector';
import { updateVaultState } from '@/hooks/useVaultState';

export interface SettingsPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
  className?: string;
}

interface SettingsCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
}

/**
 * Settings categories configuration
 */
const SETTINGS_CATEGORIES: SettingsCategory[] = [
  {
    id: 'general',
    title: 'General',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    description: 'General application settings',
  },
  {
    id: 'vault',
    title: 'Obsidian Vault',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>
    ),
    description: 'Configure local Obsidian vault for file access',
  },
  {
    id: 'appearance',
    title: 'Appearance',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    description: 'Theme and visual preferences',
  },
];

/**
 * Settings Panel with category navigation
 *
 * Modal-style settings panel that can be opened from the editor.
 */
export function SettingsPanel({ isOpen = true, onClose, className = '' }: SettingsPanelProps) {
  const [activeCategory, setActiveCategory] = useState<string>('vault');

  const handleVaultSelected = (vaultPath: string) => {
    console.log('Vault selected:', vaultPath);
    // Update global vault state for other components
    updateVaultState(vaultPath || null);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={`settings-panel ${className}`}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Configure your application preferences
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Close settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row">
          {/* Sidebar - Categories */}
          <aside className="w-full md:w-56 bg-gray-50 dark:bg-gray-900/50 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700">
            <nav className="p-2 space-y-1">
              {SETTINGS_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors
                    ${activeCategory === category.id
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <span className="flex-shrink-0">{category.icon}</span>
                  <span className="truncate text-sm">{category.title}</span>
                </button>
              ))}
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1 p-6">
            {/* Vault Category */}
            {activeCategory === 'vault' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Obsidian Vault
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Connect your Obsidian vault to access local markdown files directly in the editor.
                  </p>
                </div>

                <VaultPathSelector onVaultSelected={handleVaultSelected} />

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                    About Vault Integration
                  </h4>
                  <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1">
                    <li>• Access local Obsidian markdown files directly</li>
                    <li>• Preserves Obsidian links and graph structure</li>
                    <li>• Files are read from your computer (not uploaded)</li>
                    <li>• Requires Chrome or Edge browser</li>
                  </ul>
                </div>
              </div>
            )}

            {/* General Category */}
            {activeCategory === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    General Settings
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Configure general application preferences.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    More settings coming soon...
                  </p>
                </div>
              </div>
            )}

            {/* Appearance Category */}
            {activeCategory === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Appearance
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Customize the look and feel of the application.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Theme settings coming soon...
                  </p>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
