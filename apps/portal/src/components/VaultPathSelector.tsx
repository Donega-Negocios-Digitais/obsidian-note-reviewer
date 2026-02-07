/**
 * Vault Path Selector Component
 *
 * UI for selecting and managing Obsidian vault path using File System Access API.
 */

import { useObsidianVault } from '@/hooks/useObsidianVault';

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
  const { vault, config, isOpening, error, supported, open, clear } = useObsidianVault();

  const handleOpenVault = async () => {
    const vaultHandle = await open();
    if (vaultHandle && onVaultSelected) {
      onVaultSelected(vaultHandle.path);
    }
  };

  const handleClear = () => {
    clear();
    onVaultSelected?.('');
  };

  if (!supported) {
    return (
      <div className={`vault-path-selector space-y-4 ${className}`}>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Vault do Obsidian
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Selecione seu vault do Obsidian para acessar arquivos locais e preservar links.
          </p>
        </div>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                Acesso a arquivos locais não suportado
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                Seu navegador não suporta acesso a arquivos locais. Use Chrome ou Edge no macOS, Windows, ou Linux.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`vault-path-selector space-y-4 ${className}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Vault do Obsidian
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Selecione seu vault do Obsidian para acessar arquivos locais e preservar links.
        </p>
      </div>

      {config ? (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
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
              className="text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Remover
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center">
          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Nenhum vault selecionado
          </p>
          <button
            onClick={handleOpenVault}
            disabled={isOpening}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isOpening ? 'Abrindo...' : 'Selecionar Vault'}
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-800 dark:text-blue-300">
          <strong>Nota:</strong> Os arquivos são lidos diretamente do seu computador. Nada é enviado para servidores externos. Os arquivos ficam salvos localmente no seu vault.
        </p>
      </div>
    </div>
  );
}

export default VaultPathSelector;
