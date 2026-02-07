/**
 * Obsidian Vault Integration
 *
 * File System Access API utilities for local vault access.
 * Allows reading local Obsidian vaults in the browser.
 *
 * Per RESEARCH.md: Only works in HTTPS (or localhost), Chrome/Edge only
 */

export interface VaultHandle {
  handle: FileSystemDirectoryHandle;
  path: string;
  name: string;
}

export interface VaultFile {
  name: string;
  path: string;
  handle: FileSystemFileHandle;
}

export interface VaultConfig {
  path: string;
  lastAccess: string;
}

const STORAGE_KEY = 'obsreview-vault-config';

/**
 * Open Obsidian vault using File System Access API
 */
export async function openVault(): Promise<VaultHandle | null> {
  try {
    const handle = await window.showDirectoryPicker({
      mode: 'read',
      startIn: 'documents',
    });

    const vaultHandle: VaultHandle = {
      handle,
      path: handle.name,
      name: handle.name,
    };

    // Save to localStorage
    const config: VaultConfig = {
      path: handle.name,
      lastAccess: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));

    return vaultHandle;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      // User cancelled
      return null;
    }
    console.error('Failed to open vault:', error);
    throw error;
  }
}

/**
 * List all markdown files in vault
 */
export async function listVaultFiles(vault: VaultHandle): Promise<VaultFile[]> {
  const files: VaultFile[] = await scanDirectory(vault.handle, '');

  return files.filter((f) => f.name.endsWith('.md'));
}

/**
 * Recursively scan directory for files
 */
async function scanDirectory(
  dirHandle: FileSystemDirectoryHandle,
  path: string
): Promise<VaultFile[]> {
  const files: VaultFile[] = [];

  for await (const entry of dirHandle.values()) {
    const entryPath = path ? `${path}/${entry.name}` : entry.name;

    if (entry.kind === 'file') {
      files.push({
        name: entry.name,
        path: entryPath,
        handle: entry as FileSystemFileHandle,
      });
    } else if (entry.kind === 'directory') {
      // Skip .obsidian and hidden directories
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      const subFiles = await scanDirectory(
        entry as FileSystemDirectoryHandle,
        entryPath
      );
      files.push(...subFiles);
    }
  }

  return files;
}

/**
 * Read a file from vault
 */
export async function readVaultFile(file: VaultFile): Promise<string> {
  const fileData = await file.handle.getFile();
  const text = await fileData.text();
  return text;
}

/**
 * Get saved vault config
 */
export function getVaultConfig(): VaultConfig | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Check if File System Access API is supported
 */
export function isSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

/**
 * Clear saved vault config
 */
export function clearVaultConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Generate obsidian:// URI for a file
 * Per RESEARCH.md: Format is obsidian://vault/path/to/file
 */
export function getObsidianUri(vaultName: string, filePath: string): string {
  return `obsidian://${encodeURIComponent(vaultName)}/${encodeURIComponent(filePath)}`;
}

// Export types
export type { VaultHandle, VaultFile, VaultConfig };
