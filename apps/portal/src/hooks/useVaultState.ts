/**
 * Vault State Hook
 *
 * Global state for Obsidian vault configuration.
 * Allows DocumentWorkspace and other components to access vault state.
 */

import { useState, useEffect } from 'react';
import { getVaultConfig, type VaultConfig } from '@/lib/vaultIntegration';

export interface VaultState {
  vaultPath: string | null;
  isConnected: boolean;
}

// Global state singleton
let globalVaultState: VaultState = {
  vaultPath: null,
  isConnected: false,
};

// Listener set for state updates
const listeners = new Set<(state: VaultState) => void>();

/**
 * Notify all listeners of state changes
 */
function notifyListeners() {
  const stateSnapshot = { ...globalVaultState };
  listeners.forEach(listener => listener(stateSnapshot));
}

/**
 * Hook to access and subscribe to vault state
 *
 * Components using this hook will receive vault state updates
 * whenever the vault configuration changes.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const vaultState = useVaultState();
 *   return vaultState.isConnected ? <VaultContent /> : <ConnectVault />;
 * }
 * ```
 */
export function useVaultState(): VaultState {
  const [state, setState] = useState<VaultState>({ ...globalVaultState });

  useEffect(() => {
    // Load initial state from localStorage
    const config = getVaultConfig();
    if (config) {
      globalVaultState = {
        vaultPath: config.path,
        isConnected: true,
      };
      setState({ ...globalVaultState });
    }

    // Subscribe to state changes
    listeners.add(setState);

    // Cleanup on unmount
    return () => {
      listeners.delete(setState);
    };
  }, []);

  return state;
}

/**
 * Update global vault state
 *
 * Call this function when vault configuration changes to notify
 * all subscribed components.
 *
 * @param vaultPath - The new vault path, or null to disconnect
 *
 * @example
 * ```tsx
 * // After user selects a vault
 * updateVaultState('/path/to/vault');
 *
 * // After user clears vault
 * updateVaultState(null);
 * ```
 */
export function updateVaultState(vaultPath: string | null): void {
  if (vaultPath) {
    globalVaultState = {
      vaultPath,
      isConnected: true,
    };
  } else {
    globalVaultState = {
      vaultPath: null,
      isConnected: false,
    };
  }
  notifyListeners();
}

/**
 * Get current vault state without subscribing
 *
 * Use this for non-reactive access to the current state.
 *
 * @returns Current vault state snapshot
 */
export function getVaultState(): VaultState {
  return { ...globalVaultState };
}
