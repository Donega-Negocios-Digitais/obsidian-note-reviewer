/**
 * Cookie-based storage utility
 *
 * Uses cookies instead of localStorage so settings persist across
 * different ports (each hook invocation uses a random port).
 * Cookies are scoped by domain, not port, so localhost:54321 and
 * localhost:54322 share the same cookies.
 */

import { safeJsonParseOrNull, type JsonValidator } from './safeJson';

/**
 * Note configuration type stored in cookies
 */
export interface NoteConfig {
  tipo: string;
  noteName: string;
  vaultPath?: string;
  notePath?: string;
}

const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;

/**
 * Check if we're in a secure context (HTTPS or localhost)
 */
export function isSecureContext(): boolean {
  try {
    return window.isSecureContext ?? false;
  } catch {
    return false;
  }
}

/**
 * Safe set operation result
 */
export interface SafeSetResult {
  success: boolean;
  error?: string;
}

/**
 * Safe get operation result
 */
export interface SafeGetResult<T = string> {
  success: boolean;
  value?: T;
  error?: string;
}

/**
 * Set a value in cookie storage with error handling
 */
export function safeSetItem(key: string, value: string): SafeSetResult {
  try {
    const encoded = encodeURIComponent(value);
    document.cookie = `${key}=${encoded}; path=/; max-age=${ONE_YEAR_SECONDS}; SameSite=Lax`;
    return { success: true };
  } catch (error) {
    console.error(`Failed to save ${key}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get a value from cookie storage with error handling
 */
export function safeGetItem(key: string): SafeGetResult<string> {
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${escapeRegex(key)}=([^;]*)`));
    const value = match ? decodeURIComponent(match[1]) : null;
    return { success: true, value: value || undefined };
  } catch (error) {
    console.error(`Failed to load ${key}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get a value from cookie storage (legacy, for backward compatibility)
 */
export function getItem(key: string): string | null {
  const result = safeGetItem(key);
  return result.value ?? null;
}

/**
 * Set a value in cookie storage (legacy, for backward compatibility)
 */
export function setItem(key: string, value: string): void {
  safeSetItem(key, value);
}

/**
 * Remove a value from cookie storage
 */
export function removeItem(key: string): void {
  try {
    document.cookie = `${key}=; path=/; max-age=0`;
  } catch (e) {
    // Cookie not available
  }
}

/**
 * Escape special regex characters in a string
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Storage object with localStorage-like API
 */
export const storage = {
  getItem,
  setItem,
  removeItem,
};

// Helper function to get cookie value (uses existing getItem)
function getCookie(key: string): string | null {
  return getItem(key);
}

// Helper function to set cookie value (uses existing setItem)
function setCookie(key: string, value: string): void {
  setItem(key, value);
}

/**
 * Get vault path from storage
 */
export function getVaultPath(): string {
  return getCookie('vaultPath') ?? '';
}

/**
 * Set vault path in storage
 */
export function setVaultPath(path: string): SafeSetResult {
  return safeSetItem('vaultPath', path);
}

/**
 * Get note path from storage
 */
export function getNotePath(): string {
  return getCookie('notePath') ?? '';
}

/**
 * Set note path in storage
 */
export function setNotePath(path: string): SafeSetResult {
  return safeSetItem('notePath', path);
}

/**
 * Get note type from storage
 */
export function getNoteType(): string | null {
  return getCookie('noteType');
}

/**
 * Set note type in storage
 */
export function setNoteType(tipo: string): SafeSetResult {
  return safeSetItem('noteType', tipo);
}

/**
 * Get note name from storage
 */
export function getNoteName(): string {
  return getCookie('noteName') ?? '';
}

/**
 * Set note name in storage
 */
export function setNoteName(name: string): SafeSetResult {
  return safeSetItem('noteName', name);
}

/**
 * Get last used template from storage
 */
export function getLastUsedTemplate(): string | null {
  return getCookie('lastTemplate');
}

/**
 * Set last used template in storage
 */
export function setLastUsedTemplate(template: string): SafeSetResult {
  return safeSetItem('lastTemplate', template);
}

/**
 * Validator for NoteConfig structure
 * Ensures the parsed data has the required fields with correct types
 */
const isValidNoteConfig: JsonValidator<NoteConfig> = (data): data is NoteConfig => {
  if (typeof data !== 'object' || data === null) {
    return false;
  }
  const obj = data as Record<string, unknown>;
  // Required fields
  if (typeof obj.tipo !== 'string' || typeof obj.noteName !== 'string') {
    return false;
  }
  // Optional fields - if present, must be strings
  if (obj.vaultPath !== undefined && typeof obj.vaultPath !== 'string') {
    return false;
  }
  if (obj.notePath !== undefined && typeof obj.notePath !== 'string') {
    return false;
  }
  return true;
};

/**
 * Save complete note configuration
 */
export function saveNoteConfig(config: NoteConfig): SafeSetResult {
  try {
    const json = JSON.stringify(config);
    return safeSetItem('noteConfig', json);
  } catch (error) {
    console.error('Failed to save note config:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get saved note configuration
 *
 * Uses safeJsonParseOrNull with validation to ensure proper error handling
 * and type safety when parsing cookie data.
 *
 * Security note: Cookie data is same-origin only, making this lower risk
 * than URL-based shares, but validation ensures data integrity even if
 * cookies are corrupted or manually modified.
 */
export function getNoteConfig(): NoteConfig | null {
  const config = getCookie('noteConfig');
  if (!config) {
    return null;
  }
  return safeJsonParseOrNull<NoteConfig>(config, isValidNoteConfig);
}

/**
 * Get path for a specific note type
 */
export function getNoteTypePath(tipo: string): string {
  return getCookie(`notePath_${tipo}`) ?? '';
}

/**
 * Set path for a specific note type
 */
export function setNoteTypePath(tipo: string, path: string): SafeSetResult {
  const key = `notePath_${tipo}`;
  const result = safeSetItem(key, path);

  // Even if setting the individual cookie failed, try to update the general paths object
  // This provides a fallback mechanism
  if (result.success) {
    try {
      const paths = getAllNoteTypePaths();
      paths[tipo] = path;
      // Store the paths object as a single cookie
      safeSetItem('noteTypePaths', JSON.stringify(paths));
    } catch (e) {
      // Non-critical: the individual cookie was set successfully
      console.warn('Failed to update noteTypePaths cache:', e);
    }
  }

  return result;
}

/**
 * Get all configured note type paths
 */
export function getAllNoteTypePaths(): Record<string, string> {
  const paths: Record<string, string> = {};
  // Parse all cookies to find notePath_* entries
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key && key.startsWith('notePath_') && value) {
        const tipo = key.replace('notePath_', '');
        try {
          paths[tipo] = decodeURIComponent(value);
        } catch {
          paths[tipo] = value;
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse cookies for paths:', e);
  }
  return paths;
}

/**
 * Get template path for a specific note type
 */
export function getNoteTypeTemplate(tipo: string): string {
  return getCookie(`noteTemplate_${tipo}`) ?? '';
}

/**
 * Set template path for a specific note type
 */
export function setNoteTypeTemplate(tipo: string, templatePath: string): SafeSetResult {
  const key = `noteTemplate_${tipo}`;
  const result = safeSetItem(key, templatePath);

  // Even if setting the individual cookie failed, try to update the general templates object
  if (result.success) {
    try {
      const templates = getAllNoteTypeTemplates();
      templates[tipo] = templatePath;
      // Store the templates object as a single cookie
      safeSetItem('noteTypeTemplates', JSON.stringify(templates));
    } catch (e) {
      // Non-critical: the individual cookie was set successfully
      console.warn('Failed to update noteTypeTemplates cache:', e);
    }
  }

  return result;
}

/**
 * Get all configured note type template paths
 */
export function getAllNoteTypeTemplates(): Record<string, string> {
  const templates: Record<string, string> = {};
  // Parse all cookies to find noteTemplate_* entries
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key.startsWith('noteTemplate_')) {
      const tipo = key.replace('noteTemplate_', '');
      templates[tipo] = decodeURIComponent(value);
    }
  }
  return templates;
}

/**
 * Export all settings as a JSON-serializable object
 */
export function exportAllSettings(): Record<string, unknown> {
  return {
    vaultPath: getVaultPath(),
    notePath: getNotePath(),
    noteType: getNoteType(),
    noteName: getNoteName(),
    lastUsedTemplate: getLastUsedTemplate(),
    noteConfig: getNoteConfig(),
    noteTypePaths: getAllNoteTypePaths(),
    noteTypeTemplates: getAllNoteTypeTemplates(),
  };
}

/**
 * Validate imported settings
 */
export function validateSettingsImport(data: unknown): { valid: boolean; error?: string } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Dados inválidos' };
  }
  return { valid: true };
}

/**
 * Import all settings from a JSON object
 * Returns the number of successfully imported settings and any errors
 */
export interface ImportSettingsResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

export function importAllSettings(data: Record<string, unknown>): ImportSettingsResult {
  const errors: string[] = [];
  let imported = 0;
  let failed = 0;

  const trySet = <T extends (...args: any[]) => SafeSetResult>(
    fn: T,
    value: Parameters<T>[0],
    name: string
  ) => {
    const result = fn(value);
    if (result.success) {
      imported++;
    } else {
      failed++;
      errors.push(`${name}: ${result.error || 'Unknown error'}`);
    }
  };

  if (data.vaultPath && typeof data.vaultPath === 'string') {
    trySet(setVaultPath, data.vaultPath, 'vaultPath');
  }
  if (data.notePath && typeof data.notePath === 'string') {
    trySet(setNotePath, data.notePath, 'notePath');
  }
  if (data.noteType && typeof data.noteType === 'string') {
    trySet(setNoteType, data.noteType, 'noteType');
  }
  if (data.noteName && typeof data.noteName === 'string') {
    trySet(setNoteName, data.noteName, 'noteName');
  }
  if (data.lastUsedTemplate && typeof data.lastUsedTemplate === 'string') {
    trySet(setLastUsedTemplate, data.lastUsedTemplate, 'lastUsedTemplate');
  }
  if (data.noteTypePaths && typeof data.noteTypePaths === 'object') {
    for (const [tipo, path] of Object.entries(data.noteTypePaths as Record<string, string>)) {
      trySet(setNoteTypePath, path, `noteTypePath_${tipo}`);
    }
  }
  if (data.noteTypeTemplates && typeof data.noteTypeTemplates === 'object') {
    for (const [tipo, template] of Object.entries(data.noteTypeTemplates as Record<string, string>)) {
      trySet(setNoteTypeTemplate, template, `noteTypeTemplate_${tipo}`);
    }
  }

  return {
    success: failed === 0,
    imported,
    failed,
    errors
  };
}

// =====================================
// localStorage Safe Operations
// =====================================

/**
 * Safe set operation result for localStorage
 */
export interface SafeLocalStorageSetResult {
  success: boolean;
  error?: string;
}

/**
 * Safe get operation result for localStorage
 */
export interface SafeLocalStorageGetResult<T = string> {
  success: boolean;
  value?: T;
  error?: string;
}

/**
 * Safely set an item in localStorage
 */
export function safeLocalStorageSetItem(key: string, value: string): SafeLocalStorageSetResult {
  try {
    localStorage.setItem(key, value);
    return { success: true };
  } catch (error) {
    console.error(`Failed to save ${key} to localStorage:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Safely get an item from localStorage
 */
export function safeLocalStorageGetItem(key: string): SafeLocalStorageGetResult<string> {
  try {
    const value = localStorage.getItem(key);
    return { success: true, value: value || undefined };
  } catch (error) {
    console.error(`Failed to load ${key} from localStorage:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Safely remove an item from localStorage
 */
export function safeLocalStorageRemoveItem(key: string): SafeLocalStorageSetResult {
  try {
    localStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    console.error(`Failed to remove ${key} from localStorage:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// =====================================
// Annotation Persistence (localStorage)
// =====================================

/**
 * Generate a simple hash for the markdown content to use as storage key
 */
function generateContentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < Math.min(content.length, 1000); i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `note_${Math.abs(hash).toString(36)}`;
}

/**
 * Save annotations to localStorage with error handling
 */
export function saveAnnotations(markdown: string, annotations: unknown[]): SafeLocalStorageSetResult {
  try {
    const hash = generateContentHash(markdown);
    const result1 = safeLocalStorageSetItem(`annotations_${hash}`, JSON.stringify(annotations));
    if (!result1.success) return result1;

    // Also save the current hash so we can check if content changed
    return safeLocalStorageSetItem('current_note_hash', hash);
  } catch (e) {
    console.warn('Failed to save annotations to localStorage:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error'
    };
  }
}

/**
 * Load annotations from localStorage with error handling
 */
export function loadAnnotations(markdown: string): SafeLocalStorageGetResult<unknown[]> {
  try {
    const hash = generateContentHash(markdown);
    const result = safeLocalStorageGetItem(`annotations_${hash}`);
    if (!result.success || !result.value) {
      return { success: true, value: undefined };
    }
    const parsed = JSON.parse(result.value);
    return { success: true, value: parsed };
  } catch (e) {
    console.warn('Failed to load annotations from localStorage:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error'
    };
  }
}

/**
 * Clear annotations from localStorage with error handling
 */
export function clearAnnotations(markdown: string): SafeLocalStorageSetResult {
  try {
    const hash = generateContentHash(markdown);
    return safeLocalStorageRemoveItem(`annotations_${hash}`);
  } catch (e) {
    console.warn('Failed to clear annotations from localStorage:', e);
    return {
      success: false,
      error: e instanceof Error ? e.message : 'Unknown error'
    };
  }
}

// =====================================
// Display Name (User Preference)
// =====================================

const DISPLAY_NAME_KEY = 'obsidian-reviewer-display-name';

/**
 * Get display name from storage
 */
export function getDisplayName(): string {
  return getItem(DISPLAY_NAME_KEY) ?? '';
}

/**
 * Set display name in storage
 */
export function setDisplayName(name: string): SafeSetResult {
  return safeSetItem(DISPLAY_NAME_KEY, name);
}
