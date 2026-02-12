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

// =====================================
// Integrations (localStorage)
// =====================================

export interface IntegrationConfig {
  id: string;
  type: 'whatsapp' | 'telegram' | 'notion' | 'obsidian';
  enabled: boolean;
  config: {
    target: string;
    associatedHooks: string[];
    customMessage: string;
    autoSendLink: boolean;
  };
}

const INTEGRATIONS_KEY = 'obsidian-reviewer-integrations';

export function getIntegrations(): IntegrationConfig[] {
  const result = safeLocalStorageGetItem(INTEGRATIONS_KEY);
  if (!result.success || !result.value) return [];
  try {
    return JSON.parse(result.value) as IntegrationConfig[];
  } catch {
    return [];
  }
}

export function saveIntegrations(integrations: IntegrationConfig[]): SafeLocalStorageSetResult {
  return safeLocalStorageSetItem(INTEGRATIONS_KEY, JSON.stringify(integrations));
}

// =====================================
// Hidden Note Types (localStorage)
// =====================================

const HIDDEN_NOTE_TYPES_KEY = 'obsreview-hidden-note-types';

export function getHiddenNoteTypes(): string[] {
  const result = safeLocalStorageGetItem(HIDDEN_NOTE_TYPES_KEY);
  if (!result.success || !result.value) return [];
  try { return JSON.parse(result.value) as string[]; } catch { return []; }
}

export function saveHiddenNoteTypes(types: string[]): void {
  safeLocalStorageSetItem(HIDDEN_NOTE_TYPES_KEY, JSON.stringify(types));
}

// =====================================
// Lixeira de Templates (localStorage)
// =====================================

const TRASH_KEY = 'obsreview-template-trash';
const CATEGORY_TRASH_KEY = 'obsreview-category-trash';

export interface TrashedTemplate {
  tipo: string;
  label: string;
  icon: string;
  deletedAt: string; // ISO timestamp
  path?: string;
  template?: string;
  isCustom?: boolean;
  customTemplate?: CustomTemplate;
  sourceCategoryId?: string;
  sourceCategoryName?: string;
}

export interface TrashedCategory {
  id: string;
  name: string;
  icon: string;
  deletedAt: string; // ISO timestamp
  templates?: CustomTemplate[];
}

export function getTrashedTemplates(): TrashedTemplate[] {
  const result = safeLocalStorageGetItem(TRASH_KEY);
  if (!result.success || !result.value) return [];

  try {
    const trashed = JSON.parse(result.value) as TrashedTemplate[];
    // Filtra templates com mais de 30 dias (automatically cleaned)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return trashed.filter(t => new Date(t.deletedAt) > thirtyDaysAgo);
  } catch {
    return [];
  }
}

export function addToTrash(template: TrashedTemplate): void {
  const trashed = getTrashedTemplates();
  const updated = trashed.filter((item) => item.tipo !== template.tipo);
  updated.push(template);
  safeLocalStorageSetItem(TRASH_KEY, JSON.stringify(updated));
}

export function restoreFromTrash(tipo: string): void {
  const trashed = getTrashedTemplates();
  const updated = trashed.filter(t => t.tipo !== tipo);
  safeLocalStorageSetItem(TRASH_KEY, JSON.stringify(updated));

  // REMOVER de hiddenNoteTypes para o template voltar a aparecer
  const hiddenTypes = getHiddenNoteTypes();
  const updatedHidden = hiddenTypes.filter(t => t !== tipo);
  safeLocalStorageSetItem(HIDDEN_NOTE_TYPES_KEY, JSON.stringify(updatedHidden));
}

export function permanentlyDeleteFromTrash(tipo: string): void {
  restoreFromTrash(tipo); // Same implementation - removes from trash
}

export function restoreManyFromTrash(tipos: string[]): void {
  if (tipos.length === 0) return;
  const tipoSet = new Set(tipos);
  const trashed = getTrashedTemplates();
  const updated = trashed.filter((item) => !tipoSet.has(item.tipo));
  safeLocalStorageSetItem(TRASH_KEY, JSON.stringify(updated));

  const hiddenTypes = getHiddenNoteTypes();
  const updatedHidden = hiddenTypes.filter((tipo) => !tipoSet.has(tipo));
  safeLocalStorageSetItem(HIDDEN_NOTE_TYPES_KEY, JSON.stringify(updatedHidden));
}

export function isTemplateInTrash(tipo: string): boolean {
  const trashed = getTrashedTemplates();
  return trashed.some(t => t.tipo === tipo);
}

export function getTrashedCategories(): TrashedCategory[] {
  const result = safeLocalStorageGetItem(CATEGORY_TRASH_KEY);
  if (!result.success || !result.value) return [];

  try {
    const trashed = JSON.parse(result.value) as TrashedCategory[];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    return trashed.filter((category) => new Date(category.deletedAt) > thirtyDaysAgo);
  } catch {
    return [];
  }
}

export function addCategoryToTrash(category: TrashedCategory): void {
  const trashed = getTrashedCategories();
  const updated = trashed.filter((item) => item.id !== category.id);
  updated.push(category);
  safeLocalStorageSetItem(CATEGORY_TRASH_KEY, JSON.stringify(updated));
}

export function restoreCategoryFromTrash(categoryId: string): void {
  const trashed = getTrashedCategories();
  const updated = trashed.filter((category) => category.id !== categoryId);
  safeLocalStorageSetItem(CATEGORY_TRASH_KEY, JSON.stringify(updated));
}

export function permanentlyDeleteCategoryFromTrash(categoryId: string): void {
  restoreCategoryFromTrash(categoryId);
}

export function isCategoryInTrash(categoryId: string): boolean {
  const trashed = getTrashedCategories();
  return trashed.some((category) => category.id === categoryId);
}

export type TemplateCatalogOrigin = 'system' | 'user';

// =====================================
// Custom Categories (localStorage)
// =====================================

export interface CustomCategory {
  id: string;
  name: string;
  icon: string;
  isBuiltIn: boolean;
  active?: boolean; // Category activation state
  isSeed?: boolean;
  createdBy?: TemplateCatalogOrigin;
}

const CUSTOM_CATEGORIES_KEY = 'obsidian-reviewer-custom-categories';

interface ParsedCollection<T> {
  items: T[];
  hadSource: boolean;
  wasNormalized: boolean;
}

function isSeedDemoEntry(entry: { isSeed?: boolean; createdBy?: TemplateCatalogOrigin | string }): boolean {
  return entry.isSeed === true || entry.createdBy === 'system';
}

function normalizeCustomCategory(raw: unknown, index: number): CustomCategory | null {
  if (!raw || typeof raw !== 'object') return null;

  const value = raw as Record<string, unknown>;
  const id = typeof value.id === 'string' && value.id.trim() ? value.id.trim() : `custom_category_legacy_${index}`;
  const name = typeof value.name === 'string' && value.name.trim() ? value.name.trim() : `Categoria ${index + 1}`;
  const icon = typeof value.icon === 'string' && value.icon.trim() ? value.icon.trim() : 'Briefcase';
  const isBuiltIn = value.isBuiltIn === true;
  const active = typeof value.active === 'boolean' ? value.active : undefined;
  const isSeed = value.isSeed === true;
  const createdBy = value.createdBy === 'system' || value.createdBy === 'user'
    ? value.createdBy
    : undefined;

  return {
    id,
    name,
    icon,
    isBuiltIn,
    active,
    isSeed,
    createdBy,
  };
}

function parseCustomCategories(): ParsedCollection<CustomCategory> {
  const result = safeLocalStorageGetItem(CUSTOM_CATEGORIES_KEY);
  if (!result.success || !result.value) {
    return { items: [], hadSource: false, wasNormalized: false };
  }

  try {
    const parsed = JSON.parse(result.value) as unknown;
    if (!Array.isArray(parsed)) {
      return { items: [], hadSource: true, wasNormalized: true };
    }

    const normalized = parsed
      .map((item, index) => normalizeCustomCategory(item, index))
      .filter((item): item is CustomCategory => item !== null);
    const wasNormalized = JSON.stringify(parsed) !== JSON.stringify(normalized);

    return { items: normalized, hadSource: true, wasNormalized };
  } catch {
    return { items: [], hadSource: true, wasNormalized: true };
  }
}

interface ParsedTemplateCollection extends ParsedCollection<CustomTemplate> {
  sourceIsLegacy: boolean;
}

export interface SeedDemoCleanupResult {
  categories: CustomCategory[];
  templates: CustomTemplate[];
  removedCategoryIds: string[];
  removedTemplateIds: string[];
}

function cleanupSeedDemoContentInternal(): SeedDemoCleanupResult {
  const parsedCategories = parseCustomCategories();
  const parsedTemplates = parseCustomTemplates();

  const seedCategoryIds = new Set(
    parsedCategories.items
      .filter(isSeedDemoEntry)
      .map((category) => category.id),
  );

  const categories = parsedCategories.items.filter((category) => !seedCategoryIds.has(category.id));
  const removedCategoryIds = parsedCategories.items
    .filter((category) => seedCategoryIds.has(category.id))
    .map((category) => category.id);

  const removedTemplateIds: string[] = [];
  let templatesChanged = false;
  const templates = parsedTemplates.items
    .map((template) => {
      if (isSeedDemoEntry(template)) {
        removedTemplateIds.push(template.id);
        templatesChanged = true;
        return null;
      }

      if (seedCategoryIds.has(template.category)) {
        templatesChanged = true;
        return { ...template, category: '__sem_categoria__' };
      }

      return template;
    })
    .filter((template): template is CustomTemplate => template !== null);

  const shouldPersistCategories = parsedCategories.hadSource && (parsedCategories.wasNormalized || removedCategoryIds.length > 0);
  const shouldPersistTemplates =
    (parsedTemplates.hadSource && (parsedTemplates.wasNormalized || templatesChanged)) || parsedTemplates.sourceIsLegacy;

  if (shouldPersistCategories) {
    safeLocalStorageSetItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(categories));
  }

  if (shouldPersistTemplates) {
    safeLocalStorageSetItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
    safeLocalStorageRemoveItem(LEGACY_CUSTOM_TEMPLATES_KEY);
  }

  return {
    categories,
    templates,
    removedCategoryIds,
    removedTemplateIds,
  };
}

export function cleanupSeedDemoContent(): SeedDemoCleanupResult {
  return cleanupSeedDemoContentInternal();
}

export function getCustomCategories(): CustomCategory[] {
  return cleanupSeedDemoContentInternal().categories;
}

export function saveCustomCategories(categories: CustomCategory[]): SafeLocalStorageSetResult {
  const normalized = categories
    .map((category, index) => normalizeCustomCategory(category, index))
    .filter((item): item is CustomCategory => item !== null);

  return safeLocalStorageSetItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(normalized));
}

// =====================================
// Category Active State (localStorage)
// =====================================

const CATEGORY_ACTIVE_STATE_KEY = 'obsidian-reviewer-category-active-states';

export function getCategoryActiveStates(): Record<string, boolean> {
  const result = safeLocalStorageGetItem(CATEGORY_ACTIVE_STATE_KEY);
  if (!result.success || !result.value) return {};
  try {
    return JSON.parse(result.value) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function saveCategoryActiveStates(states: Record<string, boolean>): SafeLocalStorageSetResult {
  return safeLocalStorageSetItem(CATEGORY_ACTIVE_STATE_KEY, JSON.stringify(states));
}

export function isCategoryActive(categoryId: string): boolean {
  const states = getCategoryActiveStates();
  return states[categoryId] ?? true; // Default to active
}

export function setCategoryActive(categoryId: string, active: boolean): SafeLocalStorageSetResult {
  const states = getCategoryActiveStates();
  states[categoryId] = active;
  return saveCategoryActiveStates(states);
}

// =====================================
// Built-in Category Overrides (localStorage)
// =====================================

const BUILT_IN_CATEGORY_OVERRIDES_KEY = 'obsidian-reviewer-built-in-category-overrides';

export type BuiltInCategoryId = 'terceiros' | 'atomica' | 'organizacional' | 'alex';

export interface BuiltInCategoryOverride {
  id: BuiltInCategoryId;
  name: string;
  icon: string;
}

type BuiltInCategoryOverridesMap = Partial<Record<BuiltInCategoryId, { name: string; icon: string }>>;

function isBuiltInCategoryId(value: string): value is BuiltInCategoryId {
  return value === 'terceiros' || value === 'atomica' || value === 'organizacional' || value === 'alex';
}

function normalizeBuiltInCategoryOverrides(raw: unknown): BuiltInCategoryOverridesMap {
  if (!raw || typeof raw !== 'object') return {};

  const output: BuiltInCategoryOverridesMap = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!isBuiltInCategoryId(key)) continue;
    if (!value || typeof value !== 'object') continue;
    const override = value as Record<string, unknown>;
    if (typeof override.name !== 'string' || typeof override.icon !== 'string') continue;
    const name = override.name.trim();
    const icon = override.icon.trim();
    if (!name || !icon) continue;
    output[key] = { name, icon };
  }
  return output;
}

export function getBuiltInCategoryOverrides(): BuiltInCategoryOverridesMap {
  const result = safeLocalStorageGetItem(BUILT_IN_CATEGORY_OVERRIDES_KEY);
  if (!result.success || !result.value) return {};

  try {
    const parsed = JSON.parse(result.value) as unknown;
    return normalizeBuiltInCategoryOverrides(parsed);
  } catch {
    return {};
  }
}

export function saveBuiltInCategoryOverrides(overrides: BuiltInCategoryOverridesMap): SafeLocalStorageSetResult {
  const normalized = normalizeBuiltInCategoryOverrides(overrides);
  return safeLocalStorageSetItem(BUILT_IN_CATEGORY_OVERRIDES_KEY, JSON.stringify(normalized));
}

export function setBuiltInCategoryOverride(id: BuiltInCategoryId, name: string, icon: string): SafeLocalStorageSetResult {
  const current = getBuiltInCategoryOverrides();
  current[id] = { name: name.trim(), icon: icon.trim() };
  return saveBuiltInCategoryOverrides(current);
}

export function clearBuiltInCategoryOverride(id: BuiltInCategoryId): SafeLocalStorageSetResult {
  const current = getBuiltInCategoryOverrides();
  delete current[id];
  return saveBuiltInCategoryOverrides(current);
}

// =====================================
// Custom Templates (localStorage)
// =====================================

export interface CustomTemplate {
  id: string;
  category: string;
  label: string;
  icon: string;
  templatePath: string;
  destinationPath: string;
  isSeed?: boolean;
  createdBy?: TemplateCatalogOrigin;
}

const CUSTOM_TEMPLATES_KEY = 'obsidian-reviewer-custom-templates';
const LEGACY_CUSTOM_TEMPLATES_KEY = 'obsreview-custom-templates';

function normalizeCustomTemplate(raw: unknown, index: number): CustomTemplate | null {
  if (!raw || typeof raw !== 'object') return null;

  const value = raw as Record<string, unknown>;
  const id = typeof value.id === 'string' && value.id.trim() ? value.id.trim() : `custom_legacy_${index}`;
  const category = typeof value.category === 'string' && value.category.trim() ? value.category.trim() : '__sem_categoria__';
  const label = typeof value.label === 'string' && value.label.trim() ? value.label.trim() : `Template ${index + 1}`;
  const icon = typeof value.icon === 'string' && value.icon.trim() ? value.icon.trim() : 'FileText';
  const isSeed = value.isSeed === true;
  const createdBy = value.createdBy === 'system' || value.createdBy === 'user'
    ? value.createdBy
    : undefined;

  // Backward compatibility:
  // - current shape: templatePath/destinationPath
  // - legacy shape: template/path
  const templatePath = typeof value.templatePath === 'string'
    ? value.templatePath
    : typeof value.template === 'string'
      ? value.template
      : '';

  const destinationPath = typeof value.destinationPath === 'string'
    ? value.destinationPath
    : typeof value.path === 'string'
      ? value.path
      : '';

  return {
    id,
    category,
    label,
    icon,
    templatePath,
    destinationPath,
    isSeed,
    createdBy,
  };
}

function parseCustomTemplates(): ParsedTemplateCollection {
  const primaryResult = safeLocalStorageGetItem(CUSTOM_TEMPLATES_KEY);
  const legacyResult = safeLocalStorageGetItem(LEGACY_CUSTOM_TEMPLATES_KEY);
  const sourceValue = primaryResult.value || legacyResult.value;

  if (!sourceValue) {
    return { items: [], hadSource: false, wasNormalized: false, sourceIsLegacy: false };
  }

  try {
    const parsed = JSON.parse(sourceValue) as unknown;
    if (!Array.isArray(parsed)) {
      return { items: [], hadSource: true, wasNormalized: true, sourceIsLegacy: false };
    }
    const normalized = parsed
      .map((item, index) => normalizeCustomTemplate(item, index))
      .filter((item): item is CustomTemplate => item !== null);

    const sourceIsLegacy = !primaryResult.value && !!legacyResult.value;
    const wasNormalized = JSON.stringify(parsed) !== JSON.stringify(normalized);

    return {
      items: normalized,
      hadSource: true,
      wasNormalized,
      sourceIsLegacy,
    };
  } catch {
    return { items: [], hadSource: true, wasNormalized: true, sourceIsLegacy: false };
  }
}

export function getCustomTemplates(): CustomTemplate[] {
  return cleanupSeedDemoContentInternal().templates;
}

export function saveCustomTemplates(templates: CustomTemplate[]): SafeLocalStorageSetResult {
  const normalized = templates
    .map((template, index) => normalizeCustomTemplate(template, index))
    .filter((item): item is CustomTemplate => item !== null);

  const result = safeLocalStorageSetItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(normalized));
  if (result.success) {
    safeLocalStorageRemoveItem(LEGACY_CUSTOM_TEMPLATES_KEY);
  }
  return result;
}

// =====================================
// Template Active State (localStorage)
// =====================================

const TEMPLATE_ACTIVE_STATE_KEY = 'obsidian-reviewer-template-active-states';

export function getTemplateActiveStates(): Record<string, boolean> {
  const result = safeLocalStorageGetItem(TEMPLATE_ACTIVE_STATE_KEY);
  if (!result.success || !result.value) return {};
  try {
    return JSON.parse(result.value) as Record<string, boolean>;
  } catch {
    return {};
  }
}

export function saveTemplateActiveStates(states: Record<string, boolean>): SafeLocalStorageSetResult {
  return safeLocalStorageSetItem(TEMPLATE_ACTIVE_STATE_KEY, JSON.stringify(states));
}

export function isTemplateActive(templateId: string): boolean {
  const states = getTemplateActiveStates();
  return states[templateId] ?? true; // Default to active
}

export function setTemplateActive(templateId: string, active: boolean): SafeLocalStorageSetResult {
  const states = getTemplateActiveStates();
  states[templateId] = active;
  return saveTemplateActiveStates(states);
}
