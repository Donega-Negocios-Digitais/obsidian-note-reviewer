/**
 * Save Location Hook
 *
 * Manages save location preference for annotations.
 */

import { useState, useCallback } from 'react';

export type SaveLocation = 'vault' | 'cloud' | 'both';

export interface SaveLocationOptions {
  vaultPath?: string;
  cloudEnabled?: boolean;
}

export interface UseSaveLocationReturn {
  location: SaveLocation;
  setLocation: (location: SaveLocation) => void;
  shouldSaveToVault: boolean;
  shouldSaveToCloud: boolean;
  vaultPath?: string;
  setVaultPath: (path: string) => void;
}

const STORAGE_KEY = 'obsreview-save-location';
const VAULT_PATH_KEY = 'obsreview-vault-path';

const DEFAULT_LOCATION: SaveLocation = 'vault';

/**
 * Hook for managing save location preference
 */
export function useSaveLocation(): UseSaveLocationReturn {
  const [location, setLocationState] = useState<SaveLocation>(() => {
    if (typeof window === 'undefined') return DEFAULT_LOCATION;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && ['vault', 'cloud', 'both'].includes(stored)) {
        return stored as SaveLocation;
      }
    } catch (e) {
      console.warn('Could not read save location from localStorage:', e);
    }

    return DEFAULT_LOCATION;
  });

  const [vaultPath, setVaultPathState] = useState<string>(() => {
    if (typeof window === 'undefined') return '';

    try {
      return localStorage.getItem(VAULT_PATH_KEY) || '';
    } catch (e) {
      console.warn('Could not read vault path from localStorage:', e);
      return '';
    }
  });

  /**
   * Set location and persist to localStorage
   */
  const setLocation = useCallback((newLocation: SaveLocation) => {
    setLocationState(newLocation);

    try {
      localStorage.setItem(STORAGE_KEY, newLocation);
    } catch (e) {
      console.warn('Could not save location to localStorage:', e);
    }
  }, []);

  /**
   * Set vault path and persist
   */
  const setVaultPath = useCallback((path: string) => {
    setVaultPathState(path);

    try {
      localStorage.setItem(VAULT_PATH_KEY, path);
    } catch (e) {
      console.warn('Could not save vault path to localStorage:', e);
    }
  }, []);

  /**
   * Determine if should save to vault
   */
  const shouldSaveToVault = location === 'vault' || location === 'both';

  /**
   * Determine if should save to cloud
   */
  const shouldSaveToCloud = location === 'cloud' || location === 'both';

  return {
    location,
    setLocation,
    shouldSaveToVault,
    shouldSaveToCloud,
    vaultPath,
    setVaultPath,
  };
}

/**
 * Save annotations based on location preference
 */
export async function saveAnnotations(
  location: SaveLocation,
  vaultPath: string,
  annotations: any[],
  cloudSave?: (annotations: any[]) => Promise<void>,
  vaultSave?: (path: string, annotations: any[]) => Promise<void>
): Promise<{ vault: boolean; cloud: boolean }> {
  const result = { vault: false, cloud: false };

  const shouldSaveToVault = location === 'vault' || location === 'both';
  const shouldSaveToCloud = location === 'cloud' || location === 'both';

  if (shouldSaveToVault && vaultSave && vaultPath) {
    try {
      await vaultSave(vaultPath, annotations);
      result.vault = true;
    } catch (e) {
      console.error('Failed to save to vault:', e);
    }
  }

  if (shouldSaveToCloud && cloudSave) {
    try {
      await cloudSave(annotations);
      result.cloud = true;
    } catch (e) {
      console.error('Failed to save to cloud:', e);
    }
  }

  return result;
}

export default useSaveLocation;
