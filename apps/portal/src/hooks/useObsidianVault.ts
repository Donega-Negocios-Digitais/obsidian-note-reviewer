/**
 * Obsidian Vault Hook
 *
 * React hook for managing Obsidian vault state.
 */

import { useState, useEffect } from 'react';
import {
  openVault,
  getVaultConfig,
  clearVaultConfig,
  isSupported,
  type VaultHandle,
  type VaultConfig,
} from '@/lib/vaultIntegration';

export function useObsidianVault() {
  const [vault, setVault] = useState<VaultHandle | null>(null);
  const [config, setConfig] = useState<VaultConfig | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Check API support
    setSupported(isSupported());

    // Load saved config
    const savedConfig = getVaultConfig();
    if (savedConfig) {
      setConfig(savedConfig);
    }
  }, []);

  const open = async () => {
    if (!supported) {
      setError('Seu navegador não suporta acesso a arquivos locais. Use Chrome ou Edge.');
      return null;
    }

    setIsOpening(true);
    setError(null);

    try {
      const vaultHandle = await openVault();
      if (vaultHandle) {
        setVault(vaultHandle);
        setConfig({
          path: vaultHandle.path,
          lastAccess: new Date().toISOString(),
        });
        return vaultHandle;
      }
      return null;
    } catch (err) {
      setError('Falha ao abrir vault. Tente novamente.');
      console.error(err);
      return null;
    } finally {
      setIsOpening(false);
    }
  };

  const clear = () => {
    clearVaultConfig();
    setVault(null);
    setConfig(null);
  };

  return {
    vault,
    config,
    isOpening,
    error,
    supported,
    open,
    clear,
  };
}
