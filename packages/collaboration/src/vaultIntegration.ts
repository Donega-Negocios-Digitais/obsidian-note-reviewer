/**
 * Obsidian Vault Integration
 *
 * File System Access API utilities for local vault access.
 * Allows reading local Obsidian vaults directly in the browser.
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
 *
 * Prompts user to select a directory and returns a handle.
 */
export async function openVault(): Promise<VaultHandle | null> {
  // Check if API is supported
  if (!isSupported()) {
    throw new Error('File System Access API não é suportado neste navegador. Use Chrome ou Edge.');
  }

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
      // User cancelled - not an error
      return null;
    }
    console.error('Failed to open vault:', error);
    throw error;
  }
}

/**
 * List all markdown files in vault
 *
 * Recursively scans the vault directory for .md files.
 */
export async function listVaultFiles(vault: VaultHandle): Promise<VaultFile[]> {
  const files: VaultFile[] = await scanDirectory(vault.handle, '');

  // Filter to only markdown files
  return files.filter((f) => f.name.endsWith('.md'));
}

/**
 * Recursively scan directory for files
 *
 * Skips hidden directories (.obsidian, .git, node_modules, etc.)
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
      // Skip hidden and common exclusion directories
      if (shouldSkipDirectory(entry.name)) {
        continue;
      }

      try {
        const subFiles = await scanDirectory(
          entry as FileSystemDirectoryHandle,
          entryPath
        );
        files.push(...subFiles);
      } catch (error) {
        // Some directories may not be readable (system folders, etc.)
        console.warn(`Skipping directory ${entry.name}:`, error);
      }
    }
  }

  return files;
}

/**
 * Check if a directory should be skipped during scanning
 */
function shouldSkipDirectory(name: string): boolean {
  const skipPatterns = [
    '.', // Hidden directories
    '__',
    'node_modules',
    '.git',
    '.obsidian',
    '.github',
    'dist',
    'build',
    'out',
    'coverage',
    '.vscode',
    '.idea',
  ];

  return skipPatterns.some((pattern) => name.startsWith(pattern));
}

/**
 * Read a file from vault
 *
 * Returns the file content as a string.
 */
export async function readVaultFile(file: VaultFile): Promise<string> {
  const fileData = await file.handle.getFile();
  const text = await fileData.text();
  return text;
}

/**
 * Read a file by path from vault
 *
 * Convenience function that finds a file by path and reads it.
 */
export async function readVaultFileByPath(
  vault: VaultHandle,
  filePath: string
): Promise<string | null> {
  const files = await listVaultFiles(vault);
  const file = files.find((f) => f.path === filePath || f.name === filePath);

  if (!file) {
    return null;
  }

  return readVaultFile(file);
}

/**
 * Get saved vault config from localStorage
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
  return typeof window !== 'undefined' && 'showDirectoryPicker' in window;
}

/**
 * Get browser compatibility message
 */
export function getCompatibilityMessage(): string | null {
  if (typeof window === 'undefined') {
    return 'API de arquivo não disponível neste ambiente.';
  }

  if (!isSupported()) {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Firefox')) {
      return 'Firefox não suporta acesso a arquivos locais. Use Chrome ou Edge para esta funcionalidade.';
    }
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'Safari não suporta acesso a arquivos locais. Use Chrome ou Edge para esta funcionalidade.';
    }
    return 'Seu navegador não suporta acesso a arquivos locais. Use Chrome, Edge ou Opera.';
  }

  return null;
}

/**
 * Clear saved vault config
 */
export function clearVaultConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Check if a vault config is stored
 */
export function hasVaultConfig(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== null;
}

// Export types
export type { VaultHandle, VaultFile, VaultConfig };
