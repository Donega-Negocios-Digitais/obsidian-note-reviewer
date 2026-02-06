/**
 * Vault Path Selector Component
 *
 * UI for selecting and managing Obsidian vault path using File System Access API.
 */

import React, { useState, useEffect } from 'react';
import {
  openVault,
  getVaultConfig,
  isSupported,
  clearVaultConfig,
  hasVaultConfig,
  getCompatibilityMessage,
  type VaultConfig,
} from '@obsidian-note-reviewer/collaboration/vaultIntegration';

export interface VaultPathSelectorProps {
  onVaultSelected?: (vaultPath: string) => void;
  className?: string;
}

/**
 * Component for selecting Obsidian vault folder
 *
 * Shows current vault status and allows selecting a new vault.
 */
export function VaultPathSelector({ onVaultSelected, className = '' }: VaultPathSelectorProps) {
  const [config, setConfig] = useState<VaultConfig | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfig(getVaultConfig());
  }, []);

  const handleOpenVault = async () => {
    // Check compatibility first
    const compatibilityError = getCompatibilityMessage();
    if (compatibilityError) {
      setError(compatibilityError);
      return;
    }

    setIsOpening(true);
    setError(null);

    try {
      const vault = await openVault();
      if (vault) {
        setConfig({ path: vault.path, lastAccess: new Date().toISOString() });
        onVaultSelected?.(vault.path);
      }
    } catch (err) {
      setError('Falha ao abrir vault. Verifique as permissões e tente novamente.');
      console.error('Vault open error:', err);
    } finally {
      setIsOpening(false);
    }
  };

  const handleClear = () => {
    clearVaultConfig();
    setConfig(null);
    onVaultSelected?.('');
  };

  // Show compatibility message if API not supported
  const compatibilityMessage = getCompatibilityMessage();

  return (
    <div className={`vault-path-selector space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Vault do Obsidian
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Selecione seu vault do Obsidian para acessar arquivos locais e preservar links e grafo.
        </p>
      </div>

      {/* Connected State */}
      {config ? (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {config.path}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Conectado em {new Date(config.lastAccess).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <button
              onClick={handleClear}
              className="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        /* Disconnected State */
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
          <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
            Nenhum vault selecionado
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">
            {compatibilityMessage || 'Selecione a pasta do seu vault Obsidian'}
          </p>
          <button
            onClick={handleOpenVault}
            disabled={isOpening || !isSupported()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isOpening ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Abrindo...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Selecionar Vault
              </>
            )}
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Info Note */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-xs text-blue-800 dark:text-blue-300">
            <p className="font-medium mb-1">Privacidade e Segurança</p>
            <p>
              Os arquivos são lidos <strong>diretamente do seu computador</strong>.
              Nada é enviado para servidores externos. O acesso é revogado quando você fecha o navegador.
            </p>
          </div>
        </div>
      </div>

      {/* Browser Compatibility Info */}
      {!isSupported() && (
        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-xs text-amber-800 dark:text-amber-300">
              <p className="font-medium mb-1">Compatibilidade de Navegador</p>
              <p>
                Esta funcionalidade requer <strong>Chrome, Edge ou Opera</strong>.
                Firefox e Safari não suportam acesso a arquivos locais.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Compact variant for settings panels
 */
export interface VaultPathSelectorCompactProps {
  onVaultSelected?: (vaultPath: string) => void;
}

export function VaultPathSelectorCompact({ onVaultSelected }: VaultPathSelectorCompactProps) {
  const [config, setConfig] = useState<VaultConfig | null>(null);

  useEffect(() => {
    setConfig(getVaultConfig());
  }, []);

  const handleOpenVault = async () => {
    try {
      const vault = await openVault();
      if (vault) {
        setConfig({ path: vault.path, lastAccess: new Date().toISOString() });
        onVaultSelected?.(vault.path);
      }
    } catch (err) {
      console.error('Failed to open vault:', err);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className="flex items-center gap-3">
        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-white">
            {config ? config.path : 'Nenhum vault selecionado'}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {config ? 'Vault conectado' : 'Chrome/Edge requerido'}
          </p>
        </div>
      </div>

      <button
        onClick={handleOpenVault}
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        {config ? 'Alterar' : 'Selecionar'}
      </button>
    </div>
  );
}

export default VaultPathSelector;
