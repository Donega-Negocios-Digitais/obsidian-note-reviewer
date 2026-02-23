/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any, security/detect-object-injection, no-alert */
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FolderOpen, User, Keyboard, Globe, Download, Upload, RotateCcw, Lightbulb, UserCircle, Users, Edit, Trash2, Plug, Power, FileText, Zap, Terminal, Check, X, Info, ToggleRight, LogOut } from 'lucide-react';
import { useAuth } from '@obsidian-note-reviewer/security/auth';
import { supabase } from '@obsidian-note-reviewer/security/supabase/client';
import { ProfileSettings } from './ProfileSettings';
import { CollaborationSettings } from './CollaborationSettings';
import { IntegrationsSettings } from './IntegrationsSettings';
import { CategoryManager } from './CategoryManager';
import { TemplateManagerModal } from './TemplateManagerModal';
import { NewTemplateModal } from './NewTemplateModal';
import { TrashModal } from './TrashModal';
import { ConfirmModal } from './ConfirmModal';
import { BaseModal } from './BaseModal';
import { testTelegramConnection } from '../../api/telegram';

import { getIdentity, getAnonymousIdentity, regenerateIdentity, updateDisplayName } from '../utils/identity';
import { getDisplayName } from '../utils/storage';
import { CATEGORY_ORDER, CATEGORY_LABELS, getShortcutsByCategory, formatShortcutKey, resetShortcuts, updateShortcut, type Shortcut, type ShortcutCategory } from '../utils/shortcuts';
import { EditShortcutModal, type EditingState } from './EditShortcutModal';
import {
  getNoteTypePath,
  setNoteTypePath,
  getNoteTypeTemplate,
  setNoteTypeTemplate,
  getNotePath,
  setNotePath,
  exportAllSettings,
  validateSettingsImport,
  importAllSettings,
  getAllNoteTypePaths,
  getAllNoteTypeTemplates,
  getCustomTemplates,
  saveCustomTemplates,
  getCustomCategories,
  saveCustomCategories,
  cleanupSeedDemoContent,
  getTrashedTemplates,
  getTrashedCategories,
  addToTrash,
  addCategoryToTrash,
  restoreFromTrash,
  restoreManyFromTrash,
  restoreCategoryFromTrash,
  permanentlyDeleteFromTrash,
  permanentlyDeleteCategoryFromTrash,
  isTemplateInTrash,
  getHiddenNoteTypes,
  saveHiddenNoteTypes,
  getTemplateActiveStates,
  saveTemplateActiveStates,
  setTemplateActive,
  type CustomTemplate,
  type CustomCategory,
  type TrashedTemplate,
  type TrashedCategory,
} from '../utils/storage';
import {
  getNoteTypesByCategory,
  getDefaultConfigs,
  getBuiltInCategories,
  type TipoNota
} from '../utils/notePaths';
import { ConfigEditor } from './ConfigEditor';
import * as LucideIcons from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  onIdentityChange?: (oldIdentity: string, newIdentity: string) => void;
  onNoteTypeChange?: (tipo: TipoNota) => void;
  onNoteNameChange?: (name: string) => void;
  onNotePathChange?: (path: string) => void;
  activeDocumentId?: string;
  initialTab?: CategoryTab;
  onTabChange?: (tab: CategoryTab) => void;
}

type CategoryTab = 'caminhos' | 'regras' | 'idioma' | 'atalhos' | 'hooks' | 'perfil' | 'colaboracao' | 'integracoes';

// Helper to get Lucide icon component from icon name
function getLucideIcon(iconName: string): React.ComponentType<{ className?: string }> {
  const componentName = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  
  const Icon = (LucideIcons as any)[componentName];
  return Icon || LucideIcons.Circle;
}

const BUILT_IN_CATEGORY_ORDER = ['terceiros', 'atomica', 'organizacional', 'alex'] as const;
const BUILT_IN_ORDER_STORAGE_KEY = 'obsreview-built-in-template-order';
type TemplateDragPayload = {
  kind: 'builtIn' | 'custom';
  id: string;
  category: string;
};

const SETTINGS_MODAL_KEYS = {
  showCategoryManager: 'obsreview-settings-showCategoryManager',
  showTemplateManager: 'obsreview-settings-showTemplateManager',
  showNewTemplateModal: 'obsreview-settings-showNewTemplateModal',
  editingCustomTemplate: 'obsreview-settings-editingCustomTemplate',
  newTemplateInitialCategory: 'obsreview-settings-newTemplateInitialCategory',
  showTrashModal: 'obsreview-settings-showTrashModal',
  showEditPathModal: 'obsreview-settings-showEditPathModal',
  editingPath: 'obsreview-settings-editingPath',
  editPathData: 'obsreview-settings-editPathData',
  showDeleteConfirm: 'obsreview-settings-showDeleteConfirm',
  deleteTarget: 'obsreview-settings-deleteTarget',
} as const;

function readLocalFlag(key: string): boolean {
  try {
    return localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function writeLocalFlag(key: string, value: boolean): void {
  try {
    if (value) {
      localStorage.setItem(key, '1');
    } else {
      localStorage.removeItem(key);
    }
  } catch {
    // ignore persistence errors
  }
}

function readLocalJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function writeLocalJSON(key: string, value: unknown | null | undefined): void {
  try {
    if (value === null || value === undefined) {
      localStorage.removeItem(key);
      return;
    }
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore persistence errors
  }
}

const LOGOUT_THANKS_SNAPSHOT_KEY = 'obsreview-logout-thanks-snapshot';

type AffiliateSummaryRow = {
  affiliate_code?: string;
  commission_rate?: number | string;
  total_commission_cents?: number | string;
  total_under_review_cents?: number | string;
  referred_buyers_count?: number | string;
};

function toSafeNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function buildFallbackAffiliateCode(userId: string): string {
  return `ref-${userId.replace(/-/g, '').toLowerCase()}`;
}

async function prepareLogoutThanksSnapshot(
  user: { id: string } | null | undefined,
  supabaseClient: typeof supabase,
): Promise<void> {
  if (!user) return;

  let affiliateCode = buildFallbackAffiliateCode(user.id);
  let commissionRate = 0.6;
  let totalCommissionCents = 0;
  let totalUnderReviewCents = 0;
  let referredBuyersCount = 0;

  try {
    const { data: ensuredCode } = await supabaseClient.rpc('ensure_affiliate_profile');
    if (typeof ensuredCode === 'string' && ensuredCode.trim()) {
      affiliateCode = ensuredCode.trim().toLowerCase();
    }
  } catch (error) {
    console.warn('[SettingsPanel] Failed to ensure affiliate profile before logout:', error);
  }

  try {
    const { data: summaryData } = await supabaseClient.rpc('get_affiliate_summary');
    const summary = (Array.isArray(summaryData) ? summaryData[0] : summaryData) as AffiliateSummaryRow | null;

    if (summary) {
      if (typeof summary.affiliate_code === 'string' && summary.affiliate_code.trim()) {
        affiliateCode = summary.affiliate_code.trim().toLowerCase();
      }
      commissionRate = toSafeNumber(summary.commission_rate, 0.6);
      totalCommissionCents = Math.round(toSafeNumber(summary.total_commission_cents, 0));
      totalUnderReviewCents = Math.round(toSafeNumber(summary.total_under_review_cents, 0));
      referredBuyersCount = Math.max(0, Math.round(toSafeNumber(summary.referred_buyers_count, 0)));
    }
  } catch (error) {
    console.warn('[SettingsPanel] Failed to fetch affiliate summary before logout:', error);
  }

  sessionStorage.setItem(LOGOUT_THANKS_SNAPSHOT_KEY, JSON.stringify({
    affiliateCode,
    commissionRate,
    totalCommissionCents,
    totalUnderReviewCents,
    referredBuyersCount,
    generatedAt: new Date().toISOString(),
  }));
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onIdentityChange,
  onNotePathChange,
  activeDocumentId,
  initialTab,
  onTabChange,
}) => {
  const { t, i18n } = useTranslation();
  const { user, signOut } = useAuth();
  const [identity, setIdentity] = useState('');
  const [displayName, setDisplayNameState] = useState('');
  const [anonymousIdentity, setAnonymousIdentity] = useState('');
  const [notePaths, setNotePaths] = useState<Record<string, string>>({});
  const [noteTemplates, setNoteTemplates] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<CategoryTab>(initialTab || 'caminhos');
  const [savedField, setSavedField] = useState<string | null>(null);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado para templates ativos/desativados (agora usa templateActiveStates)

  // Auto-hide save feedback after 2 seconds
  useEffect(() => {
    if (savedField) {
      const timer = setTimeout(() => setSavedField(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [savedField]);

  // Auto-hide success indicators after 2 seconds
  useEffect(() => {
    const entries = Object.entries(saveSuccess);
    if (entries.length > 0) {
      const timer = setTimeout(() => {
        setSaveSuccess({});
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Update active tab when initialTab changes
  useEffect(() => {
    if (initialTab && isOpen) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen) {
      onTabChange?.(activeTab);
    }
  }, [activeTab, isOpen, onTabChange]);

  // Hooks state
  interface Hook {
    id: string
    name: string
    description: string
    trigger: string
    enabled: boolean
  }
  const [hooks, setHooks] = useState<Hook[]>([
    {
      id: 'plan-mode',
      name: 'Plan Mode',
      description: '',
      trigger: '/plan',
      enabled: true,
    },
    {
      id: 'obsidian-note',
      name: 'Create Obsidian Note',
      description: '',
      trigger: 'nota-obsidian',
      enabled: true,
    },
  ]);

  // Templates and categories state
  const [showCategoryManager, setShowCategoryManager] = useState(() => readLocalFlag(SETTINGS_MODAL_KEYS.showCategoryManager));
  const [showTemplateManager, setShowTemplateManager] = useState(() => readLocalFlag(SETTINGS_MODAL_KEYS.showTemplateManager));
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(() => readLocalFlag(SETTINGS_MODAL_KEYS.showNewTemplateModal));
  const [editingCustomTemplate, setEditingCustomTemplate] = useState<CustomTemplate | null>(() =>
    readLocalJSON<CustomTemplate>(SETTINGS_MODAL_KEYS.editingCustomTemplate),
  );
  const [newTemplateInitialCategory, setNewTemplateInitialCategory] = useState<string | undefined>(() =>
    readLocalJSON<string>(SETTINGS_MODAL_KEYS.newTemplateInitialCategory) || undefined,
  );
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>(() => getCustomCategories());
  const [templateActiveStates, setTemplateActiveStates] = useState<Record<string, boolean>>(() => getTemplateActiveStates());
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<'all' | string>('all');
  const [builtInTemplateOrder, setBuiltInTemplateOrder] = useState<Record<string, number>>(() => {
    const raw = localStorage.getItem(BUILT_IN_ORDER_STORAGE_KEY);
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw) as Record<string, number>;
      return typeof parsed === 'object' && parsed !== null ? parsed : {};
    } catch {
      return {};
    }
  });
  const [draggingTemplate, setDraggingTemplate] = useState<TemplateDragPayload | null>(null);
  const [dragOverTemplateId, setDragOverTemplateId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(BUILT_IN_ORDER_STORAGE_KEY, JSON.stringify(builtInTemplateOrder));
  }, [builtInTemplateOrder]);

  // Add hook modal state
  const [editingShortcut, setEditingShortcut] = useState<EditingState | null>(null);
  const [shortcutsVersion, setShortcutsVersion] = useState(0);
  const [showAddHookModal, setShowAddHookModal] = useState(false);
  const [newHook, setNewHook] = useState({ name: '', description: '', trigger: '', enabled: true });
  const [sidebarLoggingOut, setSidebarLoggingOut] = useState(false);
  const [sidebarLogoutConfirm, setSidebarLogoutConfirm] = useState(false);

  // Persistência do modal de adicionar hook
  useEffect(() => {
    if (showAddHookModal) {
      // Salvar estado ao abrir
      localStorage.setItem('obsreview-addHookModal', 'true');
      localStorage.setItem('obsreview-newHook', JSON.stringify(newHook));
    } else {
      // Limpar ao fechar
      localStorage.removeItem('obsreview-addHookModal');
      localStorage.removeItem('obsreview-newHook');
    }
  }, [showAddHookModal, newHook]);

  useEffect(() => {
    // Restaurar estado ao montar
    const savedModal = localStorage.getItem('obsreview-addHookModal');
    const savedHook = localStorage.getItem('obsreview-newHook');
    if (savedModal === 'true' && savedHook) {
      try {
        setShowAddHookModal(true);
        setNewHook(JSON.parse(savedHook));
      } catch {
        localStorage.removeItem('obsreview-addHookModal');
        localStorage.removeItem('obsreview-newHook');
      }
    }

    localStorage.removeItem('obsreview-editHookModal');
    localStorage.removeItem('obsreview-editingHook');
    localStorage.removeItem('obsreview-editHookData');
  }, []);

  // Edit template/path modal state
  const [showEditPathModal, setShowEditPathModal] = useState(() => readLocalFlag(SETTINGS_MODAL_KEYS.showEditPathModal));
  const [editingPath, setEditingPath] = useState<{ tipo: string; label: string; icon: string } | null>(() =>
    readLocalJSON<{ tipo: string; label: string; icon: string }>(SETTINGS_MODAL_KEYS.editingPath),
  );
  const [editPathData, setEditPathData] = useState(() => {
    const saved = readLocalJSON<{ template?: string; path?: string }>(SETTINGS_MODAL_KEYS.editPathData);
    return {
      template: saved?.template || '',
      path: saved?.path || '',
    };
  });

  // Edit hook modal state (unified with add hook modal)
  const [editingHook, setEditingHook] = useState<Hook | null>(null);

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(() => readLocalFlag(SETTINGS_MODAL_KEYS.showDeleteConfirm));
  const [deleteTarget, setDeleteTarget] = useState<{ tipo: string; label: string } | null>(() =>
    readLocalJSON<{ tipo: string; label: string }>(SETTINGS_MODAL_KEYS.deleteTarget),
  );
  const [showTrashModal, setShowTrashModal] = useState(() => readLocalFlag(SETTINGS_MODAL_KEYS.showTrashModal));
  const [trashedTemplates, setTrashedTemplates] = useState(() => getTrashedTemplates());
  const [trashedCategories, setTrashedCategories] = useState(() => getTrashedCategories());
  const [hiddenNoteTypes, setHiddenNoteTypes] = useState<string[]>(() => getHiddenNoteTypes());

  // Persistência dos modais de templates/categorias para sobreviver a troca de janela/reload
  useEffect(() => {
    writeLocalFlag(SETTINGS_MODAL_KEYS.showCategoryManager, showCategoryManager);
    writeLocalFlag(SETTINGS_MODAL_KEYS.showTemplateManager, showTemplateManager);
    writeLocalFlag(SETTINGS_MODAL_KEYS.showNewTemplateModal, showNewTemplateModal);
    writeLocalJSON(SETTINGS_MODAL_KEYS.editingCustomTemplate, editingCustomTemplate);
    writeLocalJSON(SETTINGS_MODAL_KEYS.newTemplateInitialCategory, newTemplateInitialCategory);
    writeLocalFlag(SETTINGS_MODAL_KEYS.showTrashModal, showTrashModal);
    writeLocalFlag(SETTINGS_MODAL_KEYS.showEditPathModal, showEditPathModal);
    writeLocalJSON(SETTINGS_MODAL_KEYS.editingPath, editingPath);
    writeLocalJSON(SETTINGS_MODAL_KEYS.editPathData, editPathData);
    writeLocalFlag(SETTINGS_MODAL_KEYS.showDeleteConfirm, showDeleteConfirm);
    writeLocalJSON(SETTINGS_MODAL_KEYS.deleteTarget, deleteTarget);
  }, [
    showCategoryManager,
    showTemplateManager,
    showNewTemplateModal,
    editingCustomTemplate,
    newTemplateInitialCategory,
    showTrashModal,
    showEditPathModal,
    editingPath,
    editPathData,
    showDeleteConfirm,
    deleteTarget,
  ]);

  // Language state
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return i18n.resolvedLanguage || i18n.language || localStorage.getItem('app-language') || 'pt-BR';
  });

  useEffect(() => {
    const syncLanguage = (lng: string) => setCurrentLanguage(lng);
    i18n.on('languageChanged', syncLanguage);
    return () => {
      i18n.off('languageChanged', syncLanguage);
    };
  }, [i18n]);

  const removeTemplateStateLinks = (templateIds: string[]) => {
    if (templateIds.length === 0) return;
    setTemplateActiveStates((prev) => {
      const next = { ...prev };
      templateIds.forEach((templateId) => {
        delete next[templateId];
      });
      saveTemplateActiveStates(next);
      return next;
    });
  };

  const isTemplateWithoutNotes = (template: CustomTemplate): boolean => {
    const destination = (template.destinationPath || '').trim();
    const sourceTemplate = (template.templatePath || '').trim();
    return destination === '' && sourceTemplate === '';
  };

  const normalizeCustomTemplateForRestore = (template: CustomTemplate): CustomTemplate => {
    const categoryExists = customCategories.some((category) => category.id === template.category);
    if (categoryExists) return template;
    return { ...template, category: '__sem_categoria__' };
  };

  const syncCustomTemplatesWithCleanup = (templates: CustomTemplate[]): CustomTemplate[] => {
    const emptyTemplateIds = templates
      .filter(isTemplateWithoutNotes)
      .map((template) => template.id);

    if (emptyTemplateIds.length === 0) {
      setCustomTemplates(templates);
      return templates;
    }

    const validTemplates = templates.filter((template) => !emptyTemplateIds.includes(template.id));
    saveCustomTemplates(validTemplates);
    setCustomTemplates(validTemplates);
    removeTemplateStateLinks(emptyTemplateIds);
    return validTemplates;
  };

  const refreshCustomTemplates = () => {
    const templates = getCustomTemplates();
    return syncCustomTemplatesWithCleanup(templates);
  };

  // Load saved configuration on mount and when panel opens
  useEffect(() => {
    if (isOpen) {
      try {
        // Load identity with fallback
        setIdentity(getIdentity() || '');
        setDisplayNameState(getDisplayName() || '');
        setAnonymousIdentity(getAnonymousIdentity() || '');

        // Load all saved paths and templates
        const noteTypes = getNoteTypesByCategory();
        const paths: Record<string, string> = {};
        const templates: Record<string, string> = {};

        [...noteTypes.terceiros, ...noteTypes.atomica, ...noteTypes.organizacional, ...noteTypes.alex].forEach(({ tipo }) => {
          try {
            paths[tipo] = getNoteTypePath(tipo) || '';
            templates[tipo] = getNoteTypeTemplate(tipo) || '';
          } catch (error) {
            console.error(`Failed to load settings for ${tipo}:`, error);
            paths[tipo] = '';
            templates[tipo] = '';
          }
        });

        setNotePaths(paths);
        setNoteTemplates(templates);

        // If there's no general note path set, use the first available path
        const currentNotePath = getNotePath();
        if (!currentNotePath || currentNotePath.trim() === '') {
          const firstPath = Object.values(paths).find(p => p.trim() !== '');
          if (firstPath) {
            setNotePath(firstPath);
            onNotePathChange?.(firstPath);
          }
        }

        // Run seed/demo cleanup migration before loading template/category data.
        const cleanupResult = cleanupSeedDemoContent();
        if (cleanupResult.removedTemplateIds.length > 0) {
          removeTemplateStateLinks(cleanupResult.removedTemplateIds);
        }

        // Load custom templates and remove empty entries automatically
        const loadedCustomTemplates = cleanupResult.templates;
        const emptyTemplateIds = loadedCustomTemplates
          .filter(isTemplateWithoutNotes)
          .map((template) => template.id);
        const validCustomTemplates = loadedCustomTemplates.filter((template) => !emptyTemplateIds.includes(template.id));
        if (emptyTemplateIds.length > 0) {
          saveCustomTemplates(validCustomTemplates);
          removeTemplateStateLinks(emptyTemplateIds);
        }
        setCustomTemplates(validCustomTemplates);
        setCustomCategories(cleanupResult.categories);
        setTemplateActiveStates(getTemplateActiveStates());
        setTrashedTemplates(getTrashedTemplates());
        setTrashedCategories(getTrashedCategories());

        const defaultOrder: Record<string, number> = {};
        let orderIndex = 0;
        [...noteTypes.terceiros, ...noteTypes.atomica, ...noteTypes.organizacional, ...noteTypes.alex].forEach(({ tipo }) => {
          defaultOrder[tipo] = orderIndex;
          orderIndex += 1;
        });

        setBuiltInTemplateOrder((prev) => {
          const merged = { ...defaultOrder, ...prev };
          localStorage.setItem(BUILT_IN_ORDER_STORAGE_KEY, JSON.stringify(merged));
          return merged;
        });

        // Load language preference
        const savedLang = i18n.resolvedLanguage || i18n.language || localStorage.getItem('app-language') || 'pt-BR';
        setCurrentLanguage(savedLang);

      } catch (error) {
        console.error('Failed to load settings:', error);
        // Set defaults if loading fails
        setNotePaths({});
        setNoteTemplates({});
      }
    }
  }, [isOpen, onNotePathChange]);

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const loadHooksConfig = async () => {
      if (!activeDocumentId) {
        const savedHooks = localStorage.getItem('obsreview-hooks');
        if (!savedHooks) return;
        try {
          const parsedHooks = JSON.parse(savedHooks);
          if (!cancelled && Array.isArray(parsedHooks)) {
            setHooks(parsedHooks);
          }
        } catch (error) {
          console.error('Failed to load hooks from local storage:', error);
        }
        return;
      }

      const { data, error } = await supabase
        .from('document_feature_configs')
        .select('config')
        .eq('note_id', activeDocumentId)
        .eq('feature_type', 'hooks')
        .maybeSingle();

      if (cancelled) return;

      if (error || !data?.config) {
        const defaultHooks: Hook[] = [
          {
            id: 'plan-mode',
            name: 'Plan Mode',
            description: '',
            trigger: '/plan',
            enabled: true,
          },
          {
            id: 'obsidian-note',
            name: 'Create Obsidian Note',
            description: '',
            trigger: 'nota-obsidian',
            enabled: true,
          },
        ];

        const savedHooks = localStorage.getItem('obsreview-hooks');
        if (savedHooks) {
          try {
            const parsedHooks = JSON.parse(savedHooks);
            if (Array.isArray(parsedHooks)) {
              const migratedHooks = parsedHooks as Hook[];
              setHooks(migratedHooks);
              if (activeDocumentId && user?.id) {
                await supabase
                  .from('document_feature_configs')
                  .upsert({
                    note_id: activeDocumentId,
                    feature_type: 'hooks',
                    config: { hooks: migratedHooks },
                    updated_by: user.id,
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'note_id,feature_type' });
              }
              return;
            }
          } catch {
            // ignore invalid saved hooks payload
          }
        }

        setHooks(defaultHooks);
        return;
      }

      const config = data.config as Record<string, unknown>;
      if (Array.isArray(config.hooks)) {
        setHooks(config.hooks as Hook[]);
      }
    };

    loadHooksConfig();

    return () => {
      cancelled = true;
    };
  }, [isOpen, activeDocumentId, user?.id]);

  const persistHooks = async (nextHooks: Hook[]) => {
    setHooks(nextHooks);
    localStorage.setItem('obsreview-hooks', JSON.stringify(nextHooks));

    if (!activeDocumentId || !user?.id) {
      return;
    }

    const { error } = await supabase
      .from('document_feature_configs')
      .upsert({
        note_id: activeDocumentId,
        feature_type: 'hooks',
        config: { hooks: nextHooks },
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'note_id,feature_type' });

    if (error) {
      console.error('Failed to persist hooks in cloud:', error);
    }
  };

  const handleRegenerateIdentity = () => {
    const oldIdentity = identity;
    const newIdentity = regenerateIdentity();
    setAnonymousIdentity(newIdentity);
    // If no display name is set, the identity changes
    if (!displayName.trim()) {
      setIdentity(newIdentity);
      onIdentityChange?.(oldIdentity, newIdentity);
    }
  };

  const handleDisplayNameChange = (name: string) => {
    const oldIdentity = identity;
    setDisplayNameState(name);

    // Save with error handling
    const result = updateDisplayName(name);
    const fieldKey = 'display-name';

    if (!result.success) {
      setSaveErrors(prev => ({
        ...prev,
        [fieldKey]: result.error || t('settings.errors.displayNameError')
      }));
    } else {
      setSaveErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
      setSaveSuccess(prev => ({ ...prev, [fieldKey]: true }));
    }

    // Update displayed identity
    const newIdentity = name.trim() || anonymousIdentity;
    setIdentity(newIdentity);
    if (oldIdentity !== newIdentity) {
      onIdentityChange?.(oldIdentity, newIdentity);
    }
  };

  const handlePathChange = (tipo: string, path: string) => {
    setNotePaths(prev => ({ ...prev, [tipo]: path }));

    // Save to localStorage with error handling
    const result = setNoteTypePath(tipo, path);
    const fieldKey = `${tipo}-path`;

    if (result.success) {
      // Show success feedback
      setSaveSuccess(prev => ({ ...prev, [fieldKey]: true }));
      setSaveErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });

      // Also update the general note path for the save button
      setNotePath(path);
      // Notify App.tsx to update savePath
      onNotePathChange?.(path);
      // Show save feedback for backward compatibility
      setSavedField(fieldKey);
    } else {
      // Show error
      setSaveSuccess(prev => {
        const newSuccess = { ...prev };
        delete newSuccess[fieldKey];
        return newSuccess;
      });
      setSaveErrors(prev => ({
        ...prev,
        [fieldKey]: result.error || t('settings.errors.genericError')
      }));
    }
  };

  const handleTemplateChange = (tipo: string, templatePath: string) => {
    setNoteTemplates(prev => ({ ...prev, [tipo]: templatePath }));

    // Save to localStorage with error handling
    const result = setNoteTypeTemplate(tipo, templatePath);
    const fieldKey = `${tipo}-template`;

    if (result.success) {
      // Show success feedback
      setSaveSuccess(prev => ({ ...prev, [fieldKey]: true }));
      setSaveErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldKey];
        return newErrors;
      });
      // Show save feedback for backward compatibility
      setSavedField(fieldKey);
    } else {
      // Show error
      setSaveSuccess(prev => {
        const newSuccess = { ...prev };
        delete newSuccess[fieldKey];
        return newSuccess;
      });
      setSaveErrors(prev => ({
        ...prev,
        [fieldKey]: result.error || t('settings.errors.genericError')
      }));
    }
  };

  const handleLoadDefaults = () => {
    const { templates, paths } = getDefaultConfigs();

    // Atualizar estados locais
    setNoteTemplates(templates);
    setNotePaths(paths);

    // Salvar no storage
    Object.entries(templates).forEach(([tipo, templatePath]) => {
      setNoteTypeTemplate(tipo, templatePath);
    });

    Object.entries(paths).forEach(([tipo, path]) => {
      setNoteTypePath(tipo, path);
    });

    // Update general note path with the first path available
    const firstPath = Object.values(paths)[0];
    if (firstPath) {
      setNotePath(firstPath);
      onNotePathChange?.(firstPath);
    }
  };

  const handleExportSettings = () => {
    const settings = exportAllSettings();
    const json = JSON.stringify(settings, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'note-reviewer-settings.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);

        // Validate the imported settings
        const validation = validateSettingsImport(data);
        if (!validation.valid) {
          alert(`${t('settings.errors.importError')}: ${validation.error}`);
          return;
        }

        // Apply the settings
        const result = importAllSettings(data);

        // Refresh local state from storage
        setIdentity(getIdentity());
        setNotePaths(getAllNoteTypePaths());
        setNoteTemplates(getAllNoteTypeTemplates());

        // Update general note path with the first path available
        const paths = getAllNoteTypePaths();
        const firstPath = Object.values(paths)[0];
        if (firstPath) {
          setNotePath(firstPath);
          onNotePathChange?.(firstPath);
        }

        if (result.success) {
          alert(t('settings.success.importSuccess'));
        } else {
          alert(t('settings.errors.partialImport', { imported: result.imported, failed: result.failed }) + '\n\nErros:\n' + result.errors.join('\n'));
        }
      } catch (err) {
        alert(t('settings.errors.invalidJson'));
      }
    };

    reader.onerror = () => {
      alert(t('settings.errors.readError'));
    };

    reader.readAsText(file);

    // Clear the file input to allow re-selecting the same file
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const toggleHook = (id: string) => {
    const enabledHooks = hooks.map(h => h.id === id ? { ...h, enabled: !h.enabled } : h);
    persistHooks(enabledHooks);
  };

  const addHook = () => {
    if (!newHook.name || !newHook.description || !newHook.trigger) return;

    const hook: Hook = {
      id: `hook-${Date.now()}`,
      name: newHook.name,
      description: newHook.description,
      trigger: newHook.trigger,
      enabled: newHook.enabled ?? true,
    };

    const updatedHooks = [...hooks, hook];
    persistHooks(updatedHooks);

    setShowAddHookModal(false);
    setNewHook({ name: '', description: '', trigger: '', enabled: true });
    localStorage.removeItem('obsreview-addHookModal');
    localStorage.removeItem('obsreview-newHook');
  };

  const openEditHookModal = (hook: Hook) => {
    setEditingHook(hook);
    setNewHook({ name: hook.name, description: hook.description, trigger: hook.trigger, enabled: hook.enabled });
    setShowAddHookModal(true);
  };

  const updateHook = () => {
    if (!editingHook || !newHook.name || !newHook.description || !newHook.trigger) return;
    const updatedHooks = hooks.map(h =>
      h.id === editingHook.id
        ? { ...h, name: newHook.name, description: newHook.description, trigger: newHook.trigger, enabled: newHook.enabled }
        : h
    );
    persistHooks(updatedHooks);
    setShowAddHookModal(false);
    setEditingHook(null);
    setNewHook({ name: '', description: '', trigger: '', enabled: true });
    localStorage.removeItem('obsreview-addHookModal');
    localStorage.removeItem('obsreview-newHook');
  };

  const deleteHook = (id: string) => {
    const hook = hooks.find(h => h.id === id);
    if (hook) {
      setDeleteTarget({ tipo: id, label: hook.name });
      setShowDeleteConfirm(true);
    }
  };

  const handleSidebarLogout = async () => {
    setSidebarLoggingOut(true);
    try {
      // Prepare affiliate snapshot before logout
      await prepareLogoutThanksSnapshot(user, supabase);
      sessionStorage.setItem('obsreview-post-logout-redirect', '/logout-thanks');
      await signOut();
      window.location.assign('/logout-thanks');
    } catch {
      // ignore
    } finally {
      setSidebarLoggingOut(false);
      setSidebarLogoutConfirm(false);
    }
  };

  // Funções para editar template/caminho
  const openEditPathModal = (tipo: string, label: string, icon: string) => {
    setEditingPath({ tipo, label, icon });
    setEditPathData({
      template: noteTemplates[tipo] || '',
      path: notePaths[tipo] || '',
    });
    setShowEditPathModal(true);
  };

  const savePathEdit = () => {
    if (editingPath) {
      // Salvar template
      if (editPathData.template !== noteTemplates[editingPath.tipo]) {
        handleTemplateChange(editingPath.tipo, editPathData.template);
      }
      // Salvar path
      if (editPathData.path !== notePaths[editingPath.tipo]) {
        handlePathChange(editingPath.tipo, editPathData.path);
      }
      setShowEditPathModal(false);
      setEditingPath(null);
      showSuccessToast(t('settings.paths.configurationSaved'));
    }
  };

  const deactivatePath = (tipo: string, label: string) => {
    setDeleteTarget({ tipo, label });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;

    const TRASH_TEMPLATE_PREFIX = '__trash_template__:';
    const TRASH_CATEGORY_PREFIX = '__trash_category__:';

    if (deleteTarget.tipo.startsWith(TRASH_TEMPLATE_PREFIX)) {
      const templateId = deleteTarget.tipo.slice(TRASH_TEMPLATE_PREFIX.length);
      permanentlyDeleteFromTrash(templateId);
      setTrashedTemplates(getTrashedTemplates());
      showSuccessToast(t('settings.trash.templateDeletedPermanentlyFromTrash', { name: deleteTarget.label }));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      return;
    }

    if (deleteTarget.tipo.startsWith(TRASH_CATEGORY_PREFIX)) {
      const categoryId = deleteTarget.tipo.slice(TRASH_CATEGORY_PREFIX.length);
      permanentlyDeleteCategoryFromTrash(categoryId);
      setTrashedCategories(getTrashedCategories());
      showSuccessToast(t('settings.trash.categoryDeletedPermanentlyFromTrash', { name: deleteTarget.label }));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      return;
    }

    // Se estiver na lixeira antiga (compatibilidade), deleta permanentemente
    if (isTemplateInTrash(deleteTarget.tipo)) {
      permanentlyDeleteFromTrash(deleteTarget.tipo);
      setTrashedTemplates(getTrashedTemplates());
      showSuccessToast(t('settings.trash.itemDeletedPermanently', { name: deleteTarget.label }));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      return;
    }

    // Hook customizado
    if (deleteTarget.tipo.startsWith('hook-')) {
      const updatedHooks = hooks.filter((hook) => hook.id !== deleteTarget.tipo);
      persistHooks(updatedHooks);
      showSuccessToast(t('settings.common.itemDeleted', { name: deleteTarget.label }));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      return;
    }

    // Template customizado -> mover para lixeira de templates
    if (deleteTarget.tipo.startsWith('custom_')) {
      const templates = getCustomTemplates();
      const targetTemplate = templates.find((template) => template.id === deleteTarget.tipo);
      const updatedTemplates = templates.filter((template) => template.id !== deleteTarget.tipo);
      saveCustomTemplates(updatedTemplates);
      setCustomTemplates(updatedTemplates);
      removeTemplateStateLinks([deleteTarget.tipo]);

      if (targetTemplate) {
        addToTrash({
          tipo: targetTemplate.id,
          label: targetTemplate.label,
          icon: targetTemplate.icon || 'FileText',
          deletedAt: new Date().toISOString(),
          path: targetTemplate.destinationPath || '',
          template: targetTemplate.templatePath || '',
          isCustom: true,
          customTemplate: targetTemplate,
          sourceCategoryId: targetTemplate.category,
          sourceCategoryName: getCategoryLabel(targetTemplate.category),
        });
      }

      setTrashedTemplates(getTrashedTemplates());
      showSuccessToast(t('settings.trash.itemMovedToTrash', { name: deleteTarget.label }));
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      return;
    }

    // Template built-in -> mover para lixeira de templates
    const builtInIcon = noteTypes[Object.keys(noteTypes).find((key) =>
      (noteTypes as any)[key]?.some((item: any) => item.tipo === deleteTarget.tipo),
    )]?.find((item: any) => item.tipo === deleteTarget.tipo)?.icon || 'File';

    addToTrash({
      tipo: deleteTarget.tipo,
      label: deleteTarget.label,
      icon: builtInIcon,
      deletedAt: new Date().toISOString(),
      path: notePaths[deleteTarget.tipo] || '',
      template: noteTemplates[deleteTarget.tipo] || '',
      isCustom: false,
    });
    setTrashedTemplates(getTrashedTemplates());

    // Oculta o card da lista principal
    const updatedHidden = [...hiddenNoteTypes, deleteTarget.tipo];
    setHiddenNoteTypes(updatedHidden);
    saveHiddenNoteTypes(updatedHidden);

    // Limpa os paths
    setNotePaths((prev) => ({ ...prev, [deleteTarget.tipo]: '' }));
    setNoteTemplates((prev) => ({ ...prev, [deleteTarget.tipo]: '' }));
    setNoteTypePath(deleteTarget.tipo, '');
    setNoteTypeTemplate(deleteTarget.tipo, '');

    showSuccessToast(t('settings.trash.itemMovedToTrash', { name: deleteTarget.label }));
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
  };

  const handleRestoreTemplate = (item: TrashedTemplate) => {
    restoreFromTrash(item.tipo);
    setTrashedTemplates(getTrashedTemplates());

    if (item.isCustom && item.customTemplate) {
      const currentTemplates = getCustomTemplates();
      const restoredTemplate = normalizeCustomTemplateForRestore(item.customTemplate);
      const existingIndex = currentTemplates.findIndex((template) => template.id === restoredTemplate.id);
      const mergedTemplates =
        existingIndex === -1
          ? [...currentTemplates, restoredTemplate]
          : currentTemplates.map((template) => (template.id === restoredTemplate.id ? restoredTemplate : template));

      syncCustomTemplatesWithCleanup(mergedTemplates);
      showSuccessToast(t('settings.trash.itemRestored', { name: item.label }));
      return;
    }

    if (item.path) setNoteTypePath(item.tipo, item.path);
    if (item.template) setNoteTypeTemplate(item.tipo, item.template);
    setNotePaths(prev => ({ ...prev, [item.tipo]: item.path || '' }));
    setNoteTemplates(prev => ({ ...prev, [item.tipo]: item.template || '' }));

    // Fix: remove from hiddenNoteTypes so restored card is visible
    const updatedHidden = hiddenNoteTypes.filter(t => t !== item.tipo);
    setHiddenNoteTypes(updatedHidden);
    saveHiddenNoteTypes(updatedHidden);

    showSuccessToast(t('settings.trash.itemRestored', { name: item.label }));
  };

  const handleRestoreCategory = (category: TrashedCategory) => {
    const categoryExists = customCategories.some((item) => item.id === category.id);
    if (!categoryExists) {
      const updatedCategories = [
        ...customCategories,
        {
          id: category.id,
          name: category.name,
          icon: category.icon,
          isBuiltIn: false,
        },
      ];
      saveCustomCategories(updatedCategories);
      setCustomCategories(updatedCategories);
    }

    const categoryTemplates = (category.templates || []).map((template) => ({
      ...template,
      category: category.id,
    }));

    if (categoryTemplates.length > 0) {
      const currentTemplates = getCustomTemplates();
      const currentTemplateIds = new Set(currentTemplates.map((template) => template.id));
      const templatesToRestore = categoryTemplates.filter((template) => !currentTemplateIds.has(template.id));
      const mergedTemplates = [...currentTemplates, ...templatesToRestore];
      syncCustomTemplatesWithCleanup(mergedTemplates);
      restoreManyFromTrash(categoryTemplates.map((template) => template.id));
      setTrashedTemplates(getTrashedTemplates());
    }

    restoreCategoryFromTrash(category.id);
    setTrashedCategories(getTrashedCategories());
    showSuccessToast(t('settings.trash.categoryRestored', { name: category.name }));
  };

  // Função para ativar/desativar template
  const handleToggleTemplateActive = (tipo: string) => {
    setTemplateActiveStates((prev) => {
      const currentState = prev[tipo] ?? true;
      const newState = !currentState;
      setTemplateActive(tipo, newState);
      return { ...prev, [tipo]: newState };
    });
  };

  // Funções para templates customizados
  const deleteCustomTemplate = (id: string, label: string) => {
    setDeleteTarget({ tipo: id, label });
    setShowDeleteConfirm(true);
  };

  const openCreateTemplateModal = (categoryId?: string) => {
    setEditingCustomTemplate(null);
    setNewTemplateInitialCategory(categoryId);
    setShowNewTemplateModal(true);
  };

  const editCustomTemplate = (ct: CustomTemplate) => {
    setEditingCustomTemplate(ct);
    setNewTemplateInitialCategory(undefined);
    setShowNewTemplateModal(true);
  };

  const moveCustomTemplate = (templateId: string, direction: 'up' | 'down') => {
    setCustomTemplates((prev) => {
      const currentIndex = prev.findIndex((template) => template.id === templateId);
      if (currentIndex === -1) return prev;

      const currentTemplate = prev[currentIndex];
      const category = currentTemplate.category || '__sem_categoria__';
      const sameCategoryIndexes = prev
        .map((template, index) => ({ templateCategory: template.category || '__sem_categoria__', index }))
        .filter((item) => item.templateCategory === category)
        .map((item) => item.index);

      const positionInCategory = sameCategoryIndexes.indexOf(currentIndex);
      if (positionInCategory === -1) return prev;

      const targetPosition = direction === 'up' ? positionInCategory - 1 : positionInCategory + 1;
      if (targetPosition < 0 || targetPosition >= sameCategoryIndexes.length) return prev;

      const targetIndex = sameCategoryIndexes[targetPosition];

      const reordered = [...prev];
      const [moved] = reordered.splice(currentIndex, 1);
      const insertIndex = targetIndex > currentIndex ? targetIndex - 1 : targetIndex;
      reordered.splice(insertIndex, 0, moved);
      saveCustomTemplates(reordered);
      return reordered;
    });
  };

  const noteTypes = getNoteTypesByCategory();
  const hasUserConfiguredBuiltInTemplate = (tipo: string) => {
    const destinationPath = (notePaths[tipo] || '').trim();
    const templatePath = (noteTemplates[tipo] || '').trim();
    return destinationPath !== '' || templatePath !== '';
  };

  const visibleBuiltInTemplates = [
    ...noteTypes.terceiros,
    ...noteTypes.atomica,
    ...noteTypes.organizacional,
    ...noteTypes.alex,
  ].filter(
    ({ tipo }) =>
      hasUserConfiguredBuiltInTemplate(tipo) && !isTemplateInTrash(tipo) && !hiddenNoteTypes.includes(tipo),
  );

  const customCategoryMap = new Map(customCategories.map((category) => [category.id, category]));
  const builtInCategoryMap = new Map(getBuiltInCategories().map((category) => [category.id, category]));

  const getCategoryLabel = (categoryId: string) => {
    const builtInCategory = builtInCategoryMap.get(categoryId);
    if (builtInCategory) return builtInCategory.name;
    if (categoryId === '__sem_categoria__') return t('settings.paths.uncategorized');
    return customCategoryMap.get(categoryId)?.name || categoryId;
  };

  const getCategoryIcon = (categoryId: string) => {
    const builtInCategory = builtInCategoryMap.get(categoryId);
    if (builtInCategory) return builtInCategory.icon;
    if (categoryId === '__sem_categoria__') return 'FolderX';
    return customCategoryMap.get(categoryId)?.icon || 'Folder';
  };

  const moveBuiltInTemplate = (tipo: string, direction: 'up' | 'down') => {
    const sourceTemplate = visibleBuiltInTemplates.find((item) => item.tipo === tipo);
    if (!sourceTemplate) return;

    const sameCategoryItems = visibleBuiltInTemplates
      .filter((item) => item.category === sourceTemplate.category)
      .sort((a, b) => (builtInTemplateOrder[a.tipo] ?? Number.MAX_SAFE_INTEGER) - (builtInTemplateOrder[b.tipo] ?? Number.MAX_SAFE_INTEGER));

    const currentIndex = sameCategoryItems.findIndex((item) => item.tipo === tipo);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sameCategoryItems.length) return;

    const targetTemplate = sameCategoryItems[targetIndex];
    setBuiltInTemplateOrder((prev) => {
      const next = { ...prev };
      const sourceOrder = next[tipo] ?? currentIndex;
      const targetOrder = next[targetTemplate.tipo] ?? targetIndex;
      next[tipo] = targetOrder;
      next[targetTemplate.tipo] = sourceOrder;
      return next;
    });
  };

  const reorderBuiltInTemplate = (sourceTipo: string, targetTipo: string) => {
    if (sourceTipo === targetTipo) return;

    const sourceTemplate = visibleBuiltInTemplates.find((item) => item.tipo === sourceTipo);
    const targetTemplate = visibleBuiltInTemplates.find((item) => item.tipo === targetTipo);
    if (!sourceTemplate || !targetTemplate) return;
    if (sourceTemplate.category !== targetTemplate.category) return;

    const sameCategoryItems = visibleBuiltInTemplates
      .filter((item) => item.category === sourceTemplate.category)
      .sort((a, b) => (builtInTemplateOrder[a.tipo] ?? Number.MAX_SAFE_INTEGER) - (builtInTemplateOrder[b.tipo] ?? Number.MAX_SAFE_INTEGER));

    const sourceIndex = sameCategoryItems.findIndex((item) => item.tipo === sourceTipo);
    const targetIndex = sameCategoryItems.findIndex((item) => item.tipo === targetTipo);
    if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) return;

    const reordered = [...sameCategoryItems];
    const [moved] = reordered.splice(sourceIndex, 1);
    const insertIndex = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
    reordered.splice(insertIndex, 0, moved);

    setBuiltInTemplateOrder((prev) => {
      const next = { ...prev };
      reordered.forEach((item, index) => {
        next[item.tipo] = index;
      });
      return next;
    });
  };

  const reorderCustomTemplate = (sourceTemplateId: string, targetTemplateId: string) => {
    if (sourceTemplateId === targetTemplateId) return;

    setCustomTemplates((prev) => {
      const sourceIndex = prev.findIndex((template) => template.id === sourceTemplateId);
      const targetIndex = prev.findIndex((template) => template.id === targetTemplateId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;

      const normalizeCategory = (value: string | undefined) => {
        const rawCategory = value || '__sem_categoria__';
        if (rawCategory === '__sem_categoria__') return rawCategory;
        if (BUILT_IN_CATEGORY_ORDER.includes(rawCategory as typeof BUILT_IN_CATEGORY_ORDER[number])) return rawCategory;
        if (customCategoryMap.has(rawCategory)) return rawCategory;
        return '__sem_categoria__';
      };

      const sourceCategory = normalizeCategory(prev[sourceIndex].category);
      const targetCategory = normalizeCategory(prev[targetIndex].category);
      if (sourceCategory !== targetCategory) return prev;

      const reordered = [...prev];
      const [moved] = reordered.splice(sourceIndex, 1);
      const insertIndex = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex;
      reordered.splice(insertIndex, 0, moved);
      saveCustomTemplates(reordered);
      return reordered;
    });
  };

  const handleTemplateDragStart = (payload: TemplateDragPayload) => (event: React.DragEvent<HTMLDivElement>) => {
    setDraggingTemplate(payload);
    setDragOverTemplateId(null);
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', payload.id);
  };

  const handleTemplateDragOver = (target: TemplateDragPayload) => (event: React.DragEvent<HTMLDivElement>) => {
    if (!draggingTemplate) return;
    if (draggingTemplate.kind !== target.kind) return;
    if (draggingTemplate.category !== target.category) return;
    if (draggingTemplate.id === target.id) return;

    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
    setDragOverTemplateId(target.id);
  };

  const handleTemplateDrop = (target: TemplateDragPayload) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!draggingTemplate) return;

    const isValidDrop =
      draggingTemplate.kind === target.kind &&
      draggingTemplate.category === target.category &&
      draggingTemplate.id !== target.id;

    if (!isValidDrop) {
      setDraggingTemplate(null);
      setDragOverTemplateId(null);
      return;
    }

    if (target.kind === 'builtIn') {
      reorderBuiltInTemplate(draggingTemplate.id, target.id);
    } else {
      reorderCustomTemplate(draggingTemplate.id, target.id);
    }

    setDraggingTemplate(null);
    setDragOverTemplateId(null);
  };

  const handleTemplateDragEnd = () => {
    setDraggingTemplate(null);
    setDragOverTemplateId(null);
  };

  const deleteCategory = (categoryId: string) => {
    const category = customCategoryMap.get(categoryId);
    if (!category) return;

    const relatedTemplates = customTemplates.filter((template) => template.category === categoryId);
    const deletedAt = new Date().toISOString();

    relatedTemplates.forEach((template) => {
      addToTrash({
        tipo: template.id,
        label: template.label,
        icon: template.icon || 'FileText',
        deletedAt,
        path: template.destinationPath || '',
        template: template.templatePath || '',
        isCustom: true,
        customTemplate: template,
        sourceCategoryId: categoryId,
        sourceCategoryName: category.name,
      });
    });

    addCategoryToTrash({
      id: category.id,
      name: category.name,
      icon: category.icon,
      deletedAt,
      templates: relatedTemplates,
    });

    const updatedCategories = customCategories.filter((category) => category.id !== categoryId);
    saveCustomCategories(updatedCategories);
    setCustomCategories(updatedCategories);

    const updatedTemplates = customTemplates.filter((template) => template.category !== categoryId);
    saveCustomTemplates(updatedTemplates);
    setCustomTemplates(updatedTemplates);
    removeTemplateStateLinks(relatedTemplates.map((template) => template.id));
    setTrashedTemplates(getTrashedTemplates());
    setTrashedCategories(getTrashedCategories());

    if (relatedTemplates.length === 0) {
      showSuccessToast(t('settings.trash.categoryMovedToTrash', { name: category.name }));
      return;
    }

    showSuccessToast(
      t('settings.trash.categoryMovedToTrashWithTemplates', {
        name: category.name,
        count: relatedTemplates.length,
      }),
    );
  };

  const builtInTemplatesForManager = visibleBuiltInTemplates
    .slice()
    .sort((a, b) => {
      const categoryRankA = BUILT_IN_CATEGORY_ORDER.indexOf(a.category as typeof BUILT_IN_CATEGORY_ORDER[number]);
      const categoryRankB = BUILT_IN_CATEGORY_ORDER.indexOf(b.category as typeof BUILT_IN_CATEGORY_ORDER[number]);
      if (categoryRankA !== categoryRankB) {
        return categoryRankA - categoryRankB;
      }
      return (builtInTemplateOrder[a.tipo] ?? Number.MAX_SAFE_INTEGER) - (builtInTemplateOrder[b.tipo] ?? Number.MAX_SAFE_INTEGER);
    })
    .map((item) => ({
      tipo: item.tipo,
      label: item.label,
      icon: item.icon,
      category: item.category,
      categoryLabel: getCategoryLabel(item.category),
      isConfigured: Boolean((notePaths[item.tipo] || '').trim() && (noteTemplates[item.tipo] || '').trim()),
      destinationPath: notePaths[item.tipo] || '',
      templatePath: noteTemplates[item.tipo] || '',
    }));

  const tabs: Array<{ id: CategoryTab; Icon: React.ComponentType<{ className?: string }>; label: string }> = [
    { id: 'perfil', Icon: UserCircle, label: t('settings.tabs.perfil') },
    { id: 'idioma', Icon: Globe, label: t('settings.tabs.idioma') },
    { id: 'caminhos', Icon: FolderOpen, label: t('settings.tabs.caminhos') },
    { id: 'atalhos', Icon: Keyboard, label: t('settings.tabs.atalhos') },
    { id: 'hooks', Icon: Terminal, label: t('settings.tabs.hooks') },
    { id: 'colaboracao', Icon: Users, label: t('settings.tabs.colaboracao') },
    { id: 'integracoes', Icon: Plug, label: t('settings.integrations.title') },
  ];

  const CategoryContent = ({ category }: { category: CategoryTab }) => {
    const items = noteTypes[category];

    return (
      <div>
        {items.map(({ tipo, icon, label }) => {
          const IconComponent = getLucideIcon(icon);
          return (
            <div key={tipo} className="mb-4 last:mb-0">
              <div className="bg-card/50 rounded-xl border border-border/50 p-5 hover:border-border/80 transition-colors">
                {/* Header with icon and title */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                    <p className="text-xs text-muted-foreground">{t('settings.paths.configurePath')}</p>
                  </div>
                </div>

                {/* Form fields with better spacing */}
                <div className="space-y-4">
                  {/* Template field */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <span>{t('settings.paths.template')}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/60">
                        {t('settings.paths.templateOptionalFull')}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={noteTemplates[tipo] || ''}
                        onChange={(e) => handleTemplateChange(tipo, e.target.value)}
                        placeholder={t('settings.paths.templatePlaceholder')}
                        className={`w-full px-3 py-2.5 pr-10 bg-background rounded-lg text-sm border focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono transition-all placeholder:text-muted-foreground/50 ${
                          saveErrors[`${tipo}-template`]
                            ? 'border-red-500'
                            : saveSuccess[`${tipo}-template`]
                            ? 'border-green-500'
                            : 'border-border focus:border-primary'
                        }`}
                      />
                      {saveSuccess[`${tipo}-template`] && !saveErrors[`${tipo}-template`] && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {saveErrors[`${tipo}-template`] && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {saveErrors[`${tipo}-template`] && (
                      <p className="text-[10px] text-red-500 mt-1">
                        {saveErrors[`${tipo}-template`]}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground/70">
                      {t('settings.paths.templatePathDescription')}
                    </p>
                  </div>

                  {/* Destination field */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                      <span>{t('settings.paths.destination')}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                        {t('settings.paths.destinationRequiredFull')}
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={notePaths[tipo] || ''}
                        onChange={(e) => handlePathChange(tipo, e.target.value)}
                        placeholder={t('settings.paths.destinationPlaceholder')}
                        className={`w-full px-3 py-2.5 pr-10 bg-background rounded-lg text-sm border focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono transition-all placeholder:text-muted-foreground/50 ${
                          saveErrors[`${tipo}-path`]
                            ? 'border-red-500'
                            : saveSuccess[`${tipo}-path`]
                            ? 'border-green-500'
                            : 'border-border focus:border-primary'
                        }`}
                      />
                      {saveSuccess[`${tipo}-path`] && !saveErrors[`${tipo}-path`] && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                      {saveErrors[`${tipo}-path`] && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                      )}
                    </div>
                    {saveErrors[`${tipo}-path`] && (
                      <p className="text-[10px] text-red-500 mt-1">
                        {saveErrors[`${tipo}-path`]}
                      </p>
                    )}
                    <p className="text-[11px] text-muted-foreground/70">
                      {t('settings.paths.destinationPathDescription')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // New component for unified paths and templates with 3-column grid (same design as Collaborators)
  const AllPathsAndTemplates = () => {
    const builtInTemplateCountByCategory = builtInTemplatesForManager.reduce<Record<string, number>>((acc, template) => {
      acc[template.category] = (acc[template.category] || 0) + 1;
      return acc;
    }, {});

    const builtInSections = getBuiltInCategories()
      .filter((category) => BUILT_IN_CATEGORY_ORDER.includes(category.id as typeof BUILT_IN_CATEGORY_ORDER[number]))
      .filter((category) => (builtInTemplateCountByCategory[category.id] || 0) > 0)
      .sort(
        (a, b) =>
          BUILT_IN_CATEGORY_ORDER.indexOf(a.id as typeof BUILT_IN_CATEGORY_ORDER[number]) -
          BUILT_IN_CATEGORY_ORDER.indexOf(b.id as typeof BUILT_IN_CATEGORY_ORDER[number]),
      )
      .map((category) => ({
        id: category.id,
        icon: category.icon,
        label: category.name,
        canDelete: false,
      }));

    const customSections = customCategories
      .filter((category) => !BUILT_IN_CATEGORY_ORDER.includes(category.id as typeof BUILT_IN_CATEGORY_ORDER[number]))
      .map((category) => ({
        id: category.id,
        icon: category.icon,
        label: category.name,
        canDelete: true,
      }));

    const knownCategoryIds = new Set([
      ...builtInSections.map((section) => section.id),
      ...customCategories.map((category) => category.id),
      '__sem_categoria__',
    ]);

    const uncategorizedCustomTemplates = customTemplates.filter((template) => {
      const category = template.category || '__sem_categoria__';
      return category === '__sem_categoria__' || !knownCategoryIds.has(category);
    });

    const sectionList = [...builtInSections, ...customSections];
    if (uncategorizedCustomTemplates.length > 0) {
      sectionList.push({
        id: '__sem_categoria__',
        icon: getCategoryIcon('__sem_categoria__'),
        label: getCategoryLabel('__sem_categoria__'),
        canDelete: false,
      });
    }

    const getItemsForSection = (sectionId: string) => {
      const builtInItems =
        sectionId === '__sem_categoria__'
          ? []
          : builtInTemplatesForManager.filter((item) => item.category === sectionId);
      const customItems =
        sectionId === '__sem_categoria__'
          ? uncategorizedCustomTemplates
          : customTemplates.filter((template) => template.category === sectionId);
      return { builtInItems, customItems };
    };

    const availableCategoryIds = new Set(['all', ...sectionList.map((section) => section.id)]);
    const normalizedCategoryFilter = availableCategoryIds.has(templateCategoryFilter) ? templateCategoryFilter : 'all';
    const filteredSectionList =
      normalizedCategoryFilter === 'all'
        ? sectionList
        : sectionList.filter((section) => section.id === normalizedCategoryFilter);

    return (
      <div className="p-5 space-y-6 overflow-y-auto">
        {/* Header with action buttons */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h4 className="text-base font-semibold text-foreground">{t('settings.paths.title')}</h4>
            <p className="text-sm text-muted-foreground/90">{t('settings.paths.subtitle')}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTemplateManager(true)}
              className="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity"
            >
              {t('settings.paths.manageTemplates')}
            </button>
            <button
              onClick={() => setShowCategoryManager(true)}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
            >
              {t('settings.paths.manageCategories')}
            </button>
            <button
              onClick={() => setShowTrashModal(true)}
              className="relative px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
            >
              <LucideIcons.Trash2 className="w-3.5 h-3.5 inline-block mr-1.5" />
              {t('settings.paths.trash')}
              {trashedTemplates.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {trashedTemplates.length}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-muted/20 p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t('settings.paths.categories')}
            </p>
            <span className="text-[11px] text-muted-foreground">
              {t('settings.paths.filteredCount', { filtered: filteredSectionList.length, total: sectionList.length })}
            </span>
          </div>
          <div className="overflow-x-auto pb-1">
            <div className="inline-flex min-w-full sm:min-w-0 gap-2">
              <button
                onClick={() => setTemplateCategoryFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                  normalizedCategoryFilter === 'all'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {t('common.all')}
              </button>
              {sectionList.map((section) => {
                const { builtInItems, customItems } = getItemsForSection(section.id);
                return (
                  <button
                    key={`filter-${section.id}`}
                    onClick={() => setTemplateCategoryFilter(section.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${
                      normalizedCategoryFilter === section.id
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {section.label} ({builtInItems.length + customItems.length})
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {filteredSectionList.map((section) => {
          const CategoryIcon = getLucideIcon(section.icon);
          const { builtInItems, customItems } = getItemsForSection(section.id);

          return (
            <div key={section.id} className="space-y-4">
              {/* Category header */}
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <CategoryIcon className="w-5 h-5 text-primary" />
                  <h5 className="text-sm font-semibold text-foreground">{section.label}</h5>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                    {builtInItems.length + customItems.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {section.canDelete && (
                    <button
                      onClick={() => deleteCategory(section.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      title={t('settings.paths.deleteCategory')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => openCreateTemplateModal(section.canDelete ? section.id : undefined)}
                    className="px-2.5 py-1 text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity"
                  >
                    {t('settings.newTemplate.newTemplate')}
                  </button>
                </div>
              </div>

              {/* 3-column grid for cards - MINIMALIST DESIGN */}
              {builtInItems.length === 0 && customItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/60 p-4 text-xs text-muted-foreground">
                  {t('settings.paths.noTemplatesInCategory')}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {builtInItems.map(({ tipo, icon: itemIcon, label: itemLabel }) => {
                  const ItemIcon = getLucideIcon(itemIcon);
                  const dragPayload: TemplateDragPayload = { kind: 'builtIn', id: tipo, category: section.id };
                  const isDragging = draggingTemplate?.kind === 'builtIn' && draggingTemplate.id === tipo;
                  const isDragOver = dragOverTemplateId === tipo;
                  const isActive = templateActiveStates[tipo] ?? true;

                  return (
                    <div
                      key={tipo}
                      draggable
                      onDragStart={handleTemplateDragStart(dragPayload)}
                      onDragOver={handleTemplateDragOver(dragPayload)}
                      onDrop={handleTemplateDrop(dragPayload)}
                      onDragEnd={handleTemplateDragEnd}
                      onClick={() => openEditPathModal(tipo, itemLabel, itemIcon)}
                      className={`bg-card/50 rounded-xl border border-border/50 p-4 transition-all hover:border-primary/30 hover:bg-accent/30 cursor-grab ${
                        isDragging ? 'opacity-50 ring-2 ring-primary/30 cursor-grabbing' : ''
                      } ${isDragOver ? 'border-primary/70 bg-primary/5' : ''}`}
                    >
                      {/* Linha superior: ícone + título + toggle */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <h4 className="font-semibold text-sm text-foreground truncate">
                            {itemLabel}
                          </h4>
                        </div>

                        {/* Toggle Ativado/Inativado */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTemplateActive(tipo);
                          }}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${
                            isActive
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                          }`}
                          title={isActive ? t('settings.hooks.deactivate') : t('settings.hooks.activate')}
                        >
                          <Power className="w-3 h-3" />
                          {isActive ? t('settings.hooks.active') : t('settings.hooks.inactive')}
                        </button>
                      </div>

                      {/* Divisor */}
                      <div className="border-t border-border/30 my-3"></div>

                      {/* Linha inferior: ícones de ação */}
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-1">
                          {/* Botão Deletar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deactivatePath(tipo, itemLabel);
                            }}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Botão Editar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditPathModal(tipo, itemLabel, itemIcon);
                            }}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                            title={t('settings.paths.editConfiguration')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {customItems.map((ct) => {
                  const CtIcon = getLucideIcon(ct.icon);
                  const sectionCategory = section.id === '__sem_categoria__' ? '__sem_categoria__' : section.id;
                  const dragPayload: TemplateDragPayload = { kind: 'custom', id: ct.id, category: sectionCategory };
                  const isDragging = draggingTemplate?.kind === 'custom' && draggingTemplate.id === ct.id;
                  const isDragOver = dragOverTemplateId === ct.id;
                  const isActive = templateActiveStates[ct.id] ?? true;

                  return (
                    <div
                      key={ct.id}
                      draggable
                      onDragStart={handleTemplateDragStart(dragPayload)}
                      onDragOver={handleTemplateDragOver(dragPayload)}
                      onDrop={handleTemplateDrop(dragPayload)}
                      onDragEnd={handleTemplateDragEnd}
                      onClick={() => editCustomTemplate(ct)}
                      className={`bg-card/50 rounded-xl border border-border/50 p-4 transition-all hover:border-primary/30 hover:bg-accent/30 cursor-grab ${
                        isDragging ? 'opacity-50 ring-2 ring-primary/30 cursor-grabbing' : ''
                      } ${isDragOver ? 'border-primary/70 bg-primary/5' : ''}`}
                    >
                      {/* Linha superior: ícone + título + toggle */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <CtIcon className="w-4 h-4" />
                          </div>
                          <h4 className="font-semibold text-sm text-foreground truncate">
                            {ct.label}
                          </h4>
                        </div>

                        {/* Toggle Ativado/Inativado */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleTemplateActive(ct.id);
                          }}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[11px] font-medium transition-colors ${
                            isActive
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-500/20'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20'
                          }`}
                          title={isActive ? t('settings.hooks.deactivate') : t('settings.hooks.activate')}
                        >
                          <Power className="w-3 h-3" />
                          {isActive ? t('settings.hooks.active') : t('settings.hooks.inactive')}
                        </button>
                      </div>

                      {/* Divisor */}
                      <div className="border-t border-border/30 my-3"></div>

                      {/* Linha inferior: ícones de ação */}
                      <div className="flex items-center justify-end gap-3">
                        <div className="flex items-center gap-1">
                          {/* Botão Deletar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteCustomTemplate(ct.id, ct.label);
                            }}
                            className="p-2 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>

                          {/* Botão Editar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editCustomTemplate(ct);
                            }}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                            title={t('settings.paths.editConfiguration')}
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                </div>
              )}
            </div>
          );
        })}

        {filteredSectionList.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 p-4 text-sm text-muted-foreground text-center">
            {t('settings.paths.noCategoriesForFilter')}
          </div>
        )}

        {/* Info tip */}
        <div className="p-3 rounded-xl bg-muted/30">
          <p className="text-xs text-muted-foreground">
            {t('settings.paths.tip')}
          </p>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="w-full h-full bg-background flex flex-col overflow-hidden">
      {/* Global error toast */}
      {Object.values(saveErrors).some(e => e) && (
        <div className="fixed bottom-4 right-4 z-[60] bg-red-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium">{t('settings.errors.saveError')}</p>
            <p className="text-xs opacity-90">{t('settings.errors.checkStorage')}</p>
          </div>
        </div>
      )}

      {/* Success toast */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-[60] bg-green-500 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 animate-in slide-in-from-bottom-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <p className="text-sm font-medium">{toastMessage}</p>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">{t('settings.title')}</h3>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                title={t('settings.aria.closeSettings')}
                aria-label={t('settings.aria.closeSettings')}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground/80">{t('settings.subtitle')}</p>
      </div>

      {/* Body: sidebar + content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tabs Navigation */}
        <div
          role="tablist"
          aria-label={t('settings.aria.categoryTabs')}
          className="flex flex-col p-2 border-r border-border bg-muted/20 min-w-[44px] overflow-y-auto"
        >
          <div className="flex flex-col gap-0.5 flex-1">
            {/* Group: Conta */}
            <p className="hidden lg:block px-2 pt-1 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Conta</p>
            {tabs.filter(({ id }) => ['perfil'].includes(id)).map(({ id, Icon, label }) => (
              <button
                key={id}
                id={`settings-panel-tab-${id}`}
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`settings-panel-content-${id}`}
                onClick={() => setActiveTab(id)}
                title={label}
                className={`
                  flex items-center gap-2 px-2 py-2 text-xs font-medium transition-all relative whitespace-nowrap rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none w-full
                  ${activeTab === id
                    ? 'text-primary bg-primary/10 border-l-2 border-primary pl-[6px]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}

            {/* Group: Preferências */}
            <p className="hidden lg:block px-2 pt-3 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{t('settings.groups.preferences')}</p>
            {tabs.filter(({ id }) => ['idioma', 'atalhos', 'caminhos'].includes(id)).map(({ id, Icon, label }) => (
              <button
                key={id}
                id={`settings-panel-tab-${id}`}
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`settings-panel-content-${id}`}
                onClick={() => setActiveTab(id)}
                title={label}
                className={`
                  flex items-center gap-2 px-2 py-2 text-xs font-medium transition-all relative whitespace-nowrap rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none w-full
                  ${activeTab === id
                    ? 'text-primary bg-primary/10 border-l-2 border-primary pl-[6px]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}

            {/* Group: Automação */}
            <p className="hidden lg:block px-2 pt-3 pb-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">{t('settings.groups.automation')}</p>
            {tabs.filter(({ id }) => ['hooks', 'colaboracao', 'integracoes'].includes(id)).map(({ id, Icon, label }) => (
              <button
                key={id}
                id={`settings-panel-tab-${id}`}
                role="tab"
                aria-selected={activeTab === id}
                aria-controls={`settings-panel-content-${id}`}
                onClick={() => setActiveTab(id)}
                title={label}
                className={`
                  flex items-center gap-2 px-2 py-2 text-xs font-medium transition-all relative whitespace-nowrap rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none w-full
                  ${activeTab === id
                    ? 'text-primary bg-primary/10 border-l-2 border-primary pl-[6px]'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                  }
                `}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="hidden lg:inline">{label}</span>
              </button>
            ))}
          </div>
          {/* Logout button at the very bottom */}
          <div className="pt-2 mt-2 border-t border-border/50">
            <button
              onClick={() => setSidebarLogoutConfirm(true)}
              disabled={sidebarLoggingOut}
              title={t('settings.session.logoutAccount')}
              className="flex items-center gap-2 px-2 py-2 text-xs font-medium transition-all whitespace-nowrap rounded-md w-full text-destructive hover:bg-destructive/10 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:inline">
                {sidebarLoggingOut ? t('settings.session.loggingOut') : t('settings.session.logoutAccount')}
              </span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div
          id={`settings-panel-content-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`settings-panel-tab-${activeTab}`}
          className={`${activeTab === 'caminhos' || activeTab === 'atalhos' || activeTab === 'hooks' || activeTab === 'idioma' || activeTab === 'perfil' || activeTab === 'colaboracao' || activeTab === 'integracoes' ? '' : 'p-5'} overflow-y-auto flex-1`}
        >
        {activeTab === 'caminhos' ? (
          <AllPathsAndTemplates />
        ) : activeTab === 'regras' ? (
          <div className="flex flex-col h-full">
            <ConfigEditor />
          </div>
        ) : activeTab === 'idioma' ? (
          <div className="p-5 space-y-6 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-muted-foreground" />
                <h3 className="font-medium">{t('settings.language.title')}</h3>
              </div>
            </div>

            {/* Language options - 3 columns like collaborators */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { code: 'pt-BR', name: t('settings.language.portugueseFull'), flag: '🇧🇷', native: t('settings.language.portuguese') },
                { code: 'en-US', name: t('settings.language.englishFull'), flag: '🇺🇸', native: t('settings.language.english') },
                { code: 'es-ES', name: t('settings.language.spanishFull'), flag: '🇪🇸', native: t('settings.language.spanish') },
                { code: 'zh-CN', name: t('settings.language.chineseFull'), flag: '🇨🇳', native: t('settings.language.chinese') },
              ].map((lang) => {
                const isSelected = currentLanguage === lang.code;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setCurrentLanguage(lang.code);
                      i18n.changeLanguage(lang.code);
                    }}
                    className="bg-card/50 rounded-xl border border-border/50 p-4 transition-all hover:bg-card/80 flex flex-col gap-3 relative"
                  >
                    {/* Status Badge (top-right) */}
                    {isSelected && (
                      <span className="absolute top-3 right-3 text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-1 whitespace-nowrap border border-green-500/20">
                        <Check className="w-3 h-3" />
                        {t('settings.collaboration.statusActive')}
                      </span>
                    )}

                    {/* Flag + Name */}
                    <div className="flex items-center gap-3">
                      <span className="text-3xl" role="img" aria-label={`${lang.native} flag`}>
                        {lang.flag}
                      </span>
                      <div className="text-left">
                        <h4 className="font-semibold text-base text-foreground">
                          {lang.native}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {lang.name}
                        </p>
                      </div>
                    </div>

                    {/* Language Code Badge */}
                    <div className="self-start px-2 py-1 rounded-md bg-muted/50 font-mono text-xs text-muted-foreground w-fit">
                      {lang.code}
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="absolute bottom-3 right-3 w-2 h-2 rounded-full bg-green-500" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Info note */}
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                {t('settings.language.comingSoon')}
              </p>
            </div>
          </div>
        ) : activeTab === 'atalhos' ? (
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-base font-semibold text-foreground">{t('settings.shortcuts.title')}</h4>
                <p className="text-sm text-muted-foreground/90">{t('settings.shortcuts.subtitle')}</p>
              </div>
              <button
                onClick={() => {
                  resetShortcuts();
                  window.location.reload();
                }}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
              >
                {t('settings.shortcuts.restoreDefaults')}
              </button>
            </div>

            {/* Shortcuts by category - 3 columns for category cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {CATEGORY_ORDER.filter(category => {
                const shortcuts = getShortcutsByCategory()[category];
                return shortcuts && shortcuts.length > 0;
              }).map(category => (
                <div key={category} className="bg-card/50 rounded-xl border border-border/50 p-4">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    {CATEGORY_LABELS[category]}
                  </h5>
                  <div className="space-y-1.5">
                    {getShortcutsByCategory()[category].map(shortcut => (
                      <div
                        key={shortcut.id}
                        className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors group cursor-pointer"
                        onClick={() => {
                          setEditingShortcut({
                            shortcut,
                            category,
                            newKey: shortcut.key,
                            newModCtrl: shortcut.modCtrl || false,
                            newModShift: shortcut.modShift || false,
                            newModAlt: shortcut.modAlt || false,
                          });
                        }}
                      >
                        <span className="text-xs font-medium text-foreground truncate">
                          {shortcut.label}
                        </span>
                        <kbd className="ml-2 px-2 py-1 text-xs font-mono bg-muted border border-border rounded-md text-muted-foreground group-hover:border-accent/50 group-hover:text-accent transition-colors flex-shrink-0">
                          {formatShortcutKey(shortcut)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Info tip */}
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">
                {t('settings.shortcuts.tip')}
              </p>
            </div>
          </div>
        ) : activeTab === 'hooks' ? (
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-base font-semibold text-foreground">{t('settings.hooks.title')}</h4>
                <p className="text-sm text-muted-foreground/90">{t('settings.hooks.subtitle')}</p>
              </div>
              <button
                onClick={() => setShowAddHookModal(true)}
                className="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                {t('settings.hooks.addHook')}
              </button>
            </div>

            {/* Hooks grid - 3 columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {hooks.map((hook) => (
                <div
                  key={hook.id}
                  className={`
                    bg-card/50 rounded-xl border p-4 transition-all flex flex-col
                    ${hook.enabled
                      ? 'border-primary/50 bg-primary/5'
                      : 'border-red-500/20 bg-red-500/5'
                    }
                  `}
                >
                  {/* Header with status */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {hook.id === 'plan-mode' ? t('settings.hooks.planMode.name') :
                       hook.id === 'obsidian-note' ? t('settings.hooks.obsidianNote.name') :
                       hook.name}
                    </h3>
                    {hook.enabled ? (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex-shrink-0">
                        {t('settings.hooks.active')}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 dark:text-red-400 flex-shrink-0">
                        {t('settings.hooks.inactive')}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-muted-foreground mb-2 flex-1">
                    {hook.id === 'plan-mode' ? t('settings.hooks.planMode.description') :
                     hook.id === 'obsidian-note' ? t('settings.hooks.obsidianNote.description') :
                     hook.description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                    {/* Trigger badge */}
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md">
                      <Terminal className="w-3 h-3 text-muted-foreground" />
                      <code className="text-[10px] font-mono text-muted-foreground">
                        {hook.trigger}
                      </code>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {/* Power Button - Activate/Deactivate */}
                      <button
                        onClick={() => toggleHook(hook.id)}
                        className={`p-1.5 rounded-md transition-all ${
                          hook.enabled
                            ? 'text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 hover:bg-green-500/10'
                            : 'text-muted-foreground hover:text-red-500 hover:bg-red-500/10'
                        }`}
                        title={hook.enabled ? t('settings.hooks.deactivate') : t('settings.hooks.activate')}
                      >
                        <Power className="w-3.5 h-3.5" fill="none" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => openEditHookModal(hook)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                        title={t('common.edit')}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button - only for custom hooks */}
                      {hook.id.startsWith('hook-') && (
                        <button
                          onClick={() => deleteHook(hook.id)}
                          className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Hook Modal */}
            {showAddHookModal && (
              <BaseModal
                isOpen={showAddHookModal}
                onRequestClose={() => {
                  setShowAddHookModal(false);
                  setEditingHook(null);
                  setNewHook({ name: '', description: '', trigger: '', enabled: true });
                  localStorage.removeItem('obsreview-addHookModal');
                  localStorage.removeItem('obsreview-newHook');
                }}
                closeOnBackdropClick={false}
                overlayClassName="z-[70]"
                contentClassName="bg-card border border-border rounded-xl shadow-xl w-full max-w-lg animate-in fade-in slide-in-from-bottom-4 duration-200 max-h-[90vh] overflow-y-auto"
              >
                <div>
                  {/* Header */}
                  <div className="sticky top-0 bg-card border-b border-border px-6 py-4 z-10">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Zap className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{editingHook ? t('settings.hooks.editHook') : t('settings.hooks.addHook')}</h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            {t('settings.hooks.configureAutomations')}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setShowAddHookModal(false);
                          setEditingHook(null);
                          setNewHook({ name: '', description: '', trigger: '', enabled: true });
                          localStorage.removeItem('obsreview-addHookModal');
                          localStorage.removeItem('obsreview-newHook');
                        }}
                        className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors rounded-md"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Bloco 1: Nome do Hook */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <Edit className="w-4 h-4 text-primary" />
                        {t('settings.hooks.hookName')} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={newHook.name}
                        onChange={(e) => setNewHook({ ...newHook, name: e.target.value })}
                        placeholder={t('settings.hooks.hookNamePlaceholder')}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </div>

                    {/* Bloco 2: Descrição */}
                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary" />
                        {t('settings.hooks.description')} <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={newHook.description}
                        onChange={(e) => setNewHook({ ...newHook, description: e.target.value })}
                        placeholder={t('settings.hooks.descriptionPlaceholder')}
                        rows={2}
                        className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none transition-all"
                      />
                    </div>

                    {/* Separador */}
                    <div className="border-t border-border" />

                    {/* Bloco 3: TRIGGER - Quando isso acontece */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Terminal className="w-4 h-4 text-amber-500" />
                        <h4 className="text-sm font-semibold text-foreground">{t('settings.hooks.whenThisHappens')}</h4>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                        <label className="block text-xs font-medium text-muted-foreground mb-2">
                          {t('settings.hooks.triggerCommand')} <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={newHook.trigger}
                            onChange={(e) => setNewHook({ ...newHook, trigger: e.target.value })}
                            placeholder={t('settings.hooks.triggerPlaceholder')}
                            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono text-sm transition-all"
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5 text-primary" />
                          {t('settings.hooks.triggerHelp')}
                        </p>
                      </div>
                    </div>

                    {/* Bloco 4: AÇÃO - Então isso será executado */}
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-green-500" />
                        <h4 className="text-sm font-semibold text-foreground">{t('settings.hooks.thenThisRuns')}</h4>
                      </div>

                      <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
                        <p className="text-sm text-muted-foreground">
                          {t('settings.hooks.autoRunDescription')}
                        </p>
                      </div>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-border" />

                    {/* Bloco 5: Status */}
                    <div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Power className="w-4 h-4 text-primary" />
                          <label className="text-sm font-semibold text-foreground">{t('settings.hooks.status')}</label>
                        </div>
                        <button
                          onClick={() => setNewHook({ ...newHook, enabled: !newHook.enabled })}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                            newHook.enabled
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20'
                              : 'bg-muted/50 text-muted-foreground border border-border'
                          }`}
                        >
                          <ToggleRight className={`w-5 h-5 ${newHook.enabled ? 'text-green-600 dark:text-green-400' : ''}`} />
                          <span className="text-sm font-medium">{newHook.enabled ? t('settings.hooks.active') : t('settings.hooks.inactive')}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé */}
                  <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4">
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setShowAddHookModal(false);
                          setEditingHook(null);
                          setNewHook({ name: '', description: '', trigger: '', enabled: true });
                          localStorage.removeItem('obsreview-addHookModal');
                          localStorage.removeItem('obsreview-newHook');
                        }}
                        className="flex-1 px-4 py-3 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        {t('common.cancel')}
                      </button>
                      <button
                        onClick={editingHook ? updateHook : addHook}
                        disabled={!newHook.name || !newHook.description || !newHook.trigger}
                        className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Check className="w-4 h-4" />
                        {editingHook ? t('settings.hooks.saveChanges') : t('settings.hooks.saveHook')}
                      </button>
                    </div>
                  </div>
                </div>
              </BaseModal>
            )}

          </div>
        ) : activeTab === 'perfil' ? (
          <div className="p-5 overflow-y-auto">
            <div className="mb-4">
              <h4 className="text-base font-semibold text-foreground">{t('settings.profile.title')}</h4>
              <p className="text-sm text-muted-foreground/90">{t('settings.profile.subtitle')}</p>
            </div>
            <ProfileSettings
              onSave={(payload) => {
                const nextName = payload?.newDisplayName?.trim();
                const previousName = payload?.oldDisplayName?.trim();

                if (!nextName) return;

                setDisplayNameState(nextName);
                setIdentity(nextName || anonymousIdentity);

                const oldIdentity = previousName || identity;
                if (oldIdentity && oldIdentity !== nextName) {
                  onIdentityChange?.(oldIdentity, nextName);
                }
              }}
            />
          </div>
        ) : activeTab === 'colaboracao' ? (
          <div className="p-5 overflow-y-auto">
            <div className="mb-4">
              <h4 className="text-base font-semibold text-foreground">{t('settings.collaboration.title')}</h4>
              <p className="text-sm text-muted-foreground/90">{t('settings.integrations.subtitle')}</p>
            </div>
            <CollaborationSettings documentId={activeDocumentId} />
          </div>
        ) : activeTab === 'integracoes' ? (
          <IntegrationsSettings
            documentId={activeDocumentId}
            hooks={hooks}
            onTestConnection={async (type, target) => {
              if (type === 'telegram') {
                return testTelegramConnection(target);
              }
              return { success: !!target };
            }}
          />
        ) : (
          <>
            <CategoryContent category={activeTab} />
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">
                {t('settings.paths.tip')}
              </p>
            </div>
          </>
        )}
        </div>
      </div>

      {/* Shortcut Edit Modal */}
      <EditShortcutModal
        editing={editingShortcut}
        setEditing={(value) => {
          setEditingShortcut(value);
          setShortcutsVersion((v) => v + 1);
        }}
        onSave={() => {
          if (!editingShortcut) return;
          updateShortcut(editingShortcut.category, editingShortcut.shortcut.id, {
            key: editingShortcut.newKey,
            modCtrl: editingShortcut.newModCtrl,
            modShift: editingShortcut.newModShift,
            modAlt: editingShortcut.newModAlt,
          });
          setEditingShortcut(null);
          setShortcutsVersion((v) => v + 1);
        }}
      />

      {/* Template Manager Modal */}

      {/* Template Manager Modal */}
      <TemplateManagerModal
        isOpen={showTemplateManager}
        onClose={() => setShowTemplateManager(false)}
        builtInTemplates={builtInTemplatesForManager}
        customTemplates={customTemplates}
        customCategories={customCategories}
        templateActiveStates={templateActiveStates}
        onToggleTemplateActive={handleToggleTemplateActive}
        onOpenBuiltIn={(tipo, label, icon) => {
          setShowTemplateManager(false);
          openEditPathModal(tipo, label, icon);
        }}
        onOpenCustom={(template) => {
          setShowTemplateManager(false);
          editCustomTemplate(template);
        }}
        onMoveBuiltIn={moveBuiltInTemplate}
        onMoveCustom={moveCustomTemplate}
        onDeleteBuiltIn={(tipo, label) => {
          setShowTemplateManager(false);
          deactivatePath(tipo, label);
        }}
        onDeleteCustom={(templateId, label) => {
          setShowTemplateManager(false);
          deleteCustomTemplate(templateId, label);
        }}
      />

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onDeleteCategory={deleteCategory}
        onCategoriesChange={() => {
          setCustomCategories(getCustomCategories());
          refreshCustomTemplates();
          setTrashedTemplates(getTrashedTemplates());
          setTrashedCategories(getTrashedCategories());
        }}
      />

      {/* New Template Modal */}
      <NewTemplateModal
        isOpen={showNewTemplateModal}
        onClose={() => {
          setShowNewTemplateModal(false);
          setEditingCustomTemplate(null);
          setNewTemplateInitialCategory(undefined);
        }}
        initialTemplate={editingCustomTemplate}
        initialCategory={newTemplateInitialCategory}
        onTemplateCreated={() => {
          refreshCustomTemplates();
          setCustomCategories(getCustomCategories());
          setTrashedTemplates(getTrashedTemplates());
          setTrashedCategories(getTrashedCategories());
        }}
        showSuccessToast={showSuccessToast}
      />

      {/* Trash Modal */}
      <TrashModal
        isOpen={showTrashModal}
        onClose={() => setShowTrashModal(false)}
        trashedTemplates={trashedTemplates}
        trashedCategories={trashedCategories}
        onRestoreTemplate={handleRestoreTemplate}
        onRestoreCategory={handleRestoreCategory}
        onPermanentDeleteTemplate={(tipo, label) => {
          setDeleteTarget({ tipo: `__trash_template__:${tipo}`, label });
          setShowDeleteConfirm(true);
        }}
        onPermanentDeleteCategory={(categoryId, label) => {
          setDeleteTarget({ tipo: `__trash_category__:${categoryId}`, label });
          setShowDeleteConfirm(true);
        }}
      />

      {/* Edit Path/Template Modal */}
      {showEditPathModal && editingPath && (
        <BaseModal
          isOpen={showEditPathModal && !!editingPath}
          onRequestClose={() => {
            setShowEditPathModal(false);
            setEditingPath(null);
          }}
          closeOnBackdropClick={false}
          overlayClassName="z-[70]"
          contentClassName="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">{t('settings.paths.editConfiguration')}</h3>
              <button
                onClick={() => {
                  setShowEditPathModal(false);
                  setEditingPath(null);
                }}
                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors rounded-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Info do tipo */}
            <div className="flex items-center gap-2 mb-4 p-3 bg-muted/30 rounded-lg">
              {(() => {
                const Icon = getLucideIcon(editingPath.icon);
                return <Icon className="w-5 h-5 text-primary" />;
              })()}
              <div>
                <p className="text-sm font-medium text-foreground">{editingPath.label}</p>
                <p className="text-xs text-muted-foreground font-mono">{editingPath.tipo}</p>
              </div>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Template field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('settings.paths.template')}
                  <span className="text-xs text-muted-foreground ml-2">({t('settings.paths.templateOptionalFull').toLowerCase()})</span>
                </label>
                <input
                  type="text"
                  value={editPathData.template}
                  onChange={(e) => setEditPathData({ ...editPathData, template: e.target.value })}
                  placeholder={t('settings.paths.templatePlaceholder')}
                  className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono text-sm"
                />
              </div>

              {/* Path field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('settings.paths.destination')}
                  <span className="text-xs text-primary ml-2">*</span>
                </label>
                <input
                  type="text"
                  value={editPathData.path}
                  onChange={(e) => setEditPathData({ ...editPathData, path: e.target.value })}
                  placeholder={t('settings.paths.destinationPlaceholder')}
                  className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditPathModal(false);
                  setEditingPath(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={savePathEdit}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
              >
                {t('common.save')}
              </button>
            </div>
          </div>
        </BaseModal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        title={t('settings.templateDelete.title')}
        message={deleteTarget ? t('settings.templateDelete.message', { name: deleteTarget.label }) : ''}
        type="delete"
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
      />

      {/* Sidebar Logout Confirmation Modal */}
      {sidebarLogoutConfirm && (
        <BaseModal
          isOpen={sidebarLogoutConfirm}
          onRequestClose={() => setSidebarLogoutConfirm(false)}
          closeOnBackdropClick={false}
          overlayClassName="z-[80] bg-black/50"
          contentClassName="w-full max-w-sm rounded-xl border border-border bg-card p-5 shadow-xl"
        >
          <div>
            <h4 className="text-base font-semibold text-foreground mb-2">{t('settings.session.logoutConfirmTitle')}</h4>
            <p className="text-sm text-muted-foreground mb-5">
              {t('settings.session.logoutConfirmDescription')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setSidebarLogoutConfirm(false)}
                disabled={sidebarLoggingOut}
                className="flex-1 px-4 py-2 rounded-md border border-input hover:bg-accent transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSidebarLogout}
                disabled={sidebarLoggingOut}
                className="flex-1 px-4 py-2 rounded-md bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {sidebarLoggingOut ? t('settings.session.loggingOut') : t('settings.session.logoutShort')}
              </button>
            </div>
          </div>
        </BaseModal>
      )}
    </div>
  );
};
