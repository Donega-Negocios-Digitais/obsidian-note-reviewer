import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, FolderOpen, User, Keyboard, Globe, Download, Upload, RotateCcw, Lightbulb, UserCircle, Users, Edit, Trash2, Plug, Power, Ban, Eye, FileText, Zap } from 'lucide-react';
import { ProfileSettings } from './ProfileSettings';
import { CollaborationSettings } from './CollaborationSettings';
import { IntegrationsSettings } from './IntegrationsSettings';
import { CategoryManager } from './CategoryManager';
import { NewTemplateModal } from './NewTemplateModal';
import { ConfirmModal } from './ConfirmModal';

const BoxingGloveIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
    <g transform="rotate(-90, 256, 256)">
      <path d="M141.977 56.943q-.952.005-1.905.053c-2.903.145-5.805.58-8.7 1.326c-28.33 7.294-56.425 29.248-77.058 57.844c-20.632 28.596-33.67 63.593-33.554 95.455c.06 16.533 6.94 27.84 18.886 36.927c7.29 5.544 16.59 9.97 27.032 13.23c-1.023-14.32-.482-29.776 3.957-42.71l16.844 5.783c-15.886 57.862 18.713 102.134 69.65 142.007c-2.305-28.866 2.355-59.986 15.7-91.345c-1.265-7.76-1.14-16.392.57-25.664c4.65-25.21 20.01-56.115 49.88-93.414l14.59 11.68c-28.65 35.777-42.302 64.575-46.09 85.122c-3.79 20.548 1.342 31.848 10.048 38.176s23.24 8.047 40.315 2.526c17.073-5.522 36.13-18.136 52.42-38.405c40.154-49.957 56.8-91.026 58.064-120.484c1.265-29.46-11.115-47.414-32.752-56.937C276.602 59.067 191.21 80.82 119.7 162.938l-14.095-12.272c26.81-30.786 55.632-54.11 84.143-70.29c-15.18-14.578-31.464-23.538-47.77-23.433zm230.76 85.89c-.65-.005-1.303.005-1.956.01c-3.553 34.283-22.66 75.888-61.65 124.397c-18.358 22.844-40.163 37.666-61.237 44.48c-21.075 6.816-41.974 5.77-57.053-5.19a42 42 0 0 1-7.387-6.887c-20.753 63.805-2.12 122.793 34.906 158.587c25.613 24.76 60.005 38.354 97.472 34.727s78.5-24.527 116.943-70.998c84.462-102.102 71.214-199.61 19.823-247.646c-21.08-19.702-48.703-31.302-79.862-31.482z" />
    </g>
  </svg>
);
import { getIdentity, getAnonymousIdentity, regenerateIdentity, updateDisplayName } from '../utils/identity';
import { getDisplayName } from '../utils/storage';
import { CATEGORY_ORDER, CATEGORY_LABELS, getShortcutsByCategory, formatShortcutKey, resetShortcuts, updateShortcut } from '../utils/shortcuts';
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
  type CustomTemplate
} from '../utils/storage';
import {
  getNoteTypesByCategory,
  getDefaultConfigs,
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
  initialTab?: CategoryTab;
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

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onIdentityChange,
  onNotePathChange,
  initialTab
}) => {
  const { t, i18n } = useTranslation();
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

  // Add hook modal state
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showNewTemplateModal, setShowNewTemplateModal] = useState(false);
  const [customTemplates, setCustomTemplates] = useState<CustomTemplate[]>([]);
  const [showShortcutModal, setShowShortcutModal] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<{ category: string; id: string; label: string; key: string } | null>(null);
  const [newShortcutKey, setNewShortcutKey] = useState('');
  const [showAddHookModal, setShowAddHookModal] = useState(false);
  const [newHook, setNewHook] = useState({ name: '', description: '', trigger: '' });

  // Edit template/path modal state
  const [showEditPathModal, setShowEditPathModal] = useState(false);
  const [editingPath, setEditingPath] = useState<{ tipo: string; label: string; icon: string } | null>(null);
  const [editPathData, setEditPathData] = useState({
    template: '',
    path: '',
  });

  // Edit hook modal state
  const [showEditHookModal, setShowEditHookModal] = useState(false);
  const [editingHook, setEditingHook] = useState<Hook | null>(null);
  const [editHookData, setEditHookData] = useState({
    name: '',
    description: '',
    trigger: '',
  });

  // Delete confirmation modal state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ tipo: string; label: string } | null>(null);

  // Language state
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('app-language') || 'pt-BR';
  });

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

        // Load custom templates
        setCustomTemplates(getCustomTemplates());

        // Load language preference
        const savedLang = localStorage.getItem('app-language') || 'pt-BR';
        setCurrentLanguage(savedLang);
        // In full implementation, this would call i18n.changeLanguage(savedLang);

        // Load hooks from localStorage
        const savedHooks = localStorage.getItem('obsreview-hooks');
        if (savedHooks) {
          try {
            const parsedHooks = JSON.parse(savedHooks);
            if (Array.isArray(parsedHooks)) {
              setHooks(parsedHooks);
            }
          } catch (error) {
            console.error('Failed to load hooks:', error);
            // Keep default hooks if loading fails
          }
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Set defaults if loading fails
        setNotePaths({});
        setNoteTemplates({});
      }
    }
  }, [isOpen, onNotePathChange]);

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
    setHooks(hooks.map(hook =>
      hook.id === id ? { ...hook, enabled: !hook.enabled } : hook
    ));
    // TODO: Salvar no localStorage
    const enabledHooks = hooks.map(h => h.id === id ? { ...h, enabled: !h.enabled } : h);
    localStorage.setItem('obsreview-hooks', JSON.stringify(enabledHooks));
  };

  const addHook = () => {
    if (!newHook.name || !newHook.description || !newHook.trigger) return;
    
    const hook: Hook = {
      id: `hook-${Date.now()}`,
      name: newHook.name,
      description: newHook.description,
      trigger: newHook.trigger,
      enabled: true,
    };
    
    const updatedHooks = [...hooks, hook];
    setHooks(updatedHooks);
    localStorage.setItem('obsreview-hooks', JSON.stringify(updatedHooks));

    setShowAddHookModal(false);
    setNewHook({ name: '', description: '', trigger: '' });
  };

  const openEditHookModal = (hook: Hook) => {
    setEditingHook(hook);
    setEditHookData({
      name: hook.name,
      description: hook.description,
      trigger: hook.trigger,
    });
    setShowEditHookModal(true);
  };

  const updateHook = () => {
    if (editingHook && editHookData.name && editHookData.description && editHookData.trigger) {
      const updatedHooks = hooks.map(h =>
        h.id === editingHook.id
          ? { ...h, name: editHookData.name, description: editHookData.description, trigger: editHookData.trigger }
          : h
      );
      setHooks(updatedHooks);
      localStorage.setItem('obsreview-hooks', JSON.stringify(updatedHooks));
      setShowEditHookModal(false);
      setEditingHook(null);
      setEditHookData({ name: '', description: '', trigger: '' });
    }
  };

  const deleteHook = (id: string) => {
    const hook = hooks.find(h => h.id === id);
    if (hook) {
      setDeleteTarget({ tipo: id, label: hook.name });
      setShowDeleteConfirm(true);
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
      showSuccessToast('Configuração salva com sucesso!');
    }
  };

  const deactivatePath = (tipo: string, label: string) => {
    setDeleteTarget({ tipo, label });
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (deleteTarget) {
      // Check if it's a hook (id starts with 'hook-')
      if (deleteTarget.tipo.startsWith('hook-')) {
        const updatedHooks = hooks.filter(h => h.id !== deleteTarget.tipo);
        setHooks(updatedHooks);
        localStorage.setItem('obsreview-hooks', JSON.stringify(updatedHooks));
      }
      // Check if it's a custom template (id starts with 'custom_')
      else if (deleteTarget.tipo.startsWith('custom_')) {
        const templates = getCustomTemplates();
        const updatedTemplates = templates.filter(t => t.id !== deleteTarget.tipo);
        localStorage.setItem('obsreview-custom-templates', JSON.stringify(updatedTemplates));
        setCustomTemplates(updatedTemplates);
      }
      // Built-in template - just clear the paths
      else {
        setNotePaths(prev => ({ ...prev, [deleteTarget.tipo]: '' }));
        setNoteTemplates(prev => ({ ...prev, [deleteTarget.tipo]: '' }));
        setNoteTypePath(deleteTarget.tipo, '');
        setNoteTypeTemplate(deleteTarget.tipo, '');
      }

      showSuccessToast(`"${deleteTarget.label}" deletado com sucesso!`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const showSuccessToast = (message: string) => {
    setToastMessage(message);
  };

  // Funções para templates customizados
  const deleteCustomTemplate = (id: string, label: string) => {
    setDeleteTarget({ tipo: id, label });
    setShowDeleteConfirm(true);
  };

  const editCustomTemplate = (ct: CustomTemplate) => {
    // Para custom templates, vamos abrir o modal de novo template com os dados preenchidos
    // Por enquanto, apenas mostramos um toast
    showSuccessToast(`Editar template customizado: ${ct.label}`);
    // TODO: Implementar modal de edição completo
  };

  const noteTypes = getNoteTypesByCategory();

  const tabs: Array<{ id: CategoryTab; Icon: React.ComponentType<{ className?: string }>; label: string }> = [
    { id: 'perfil', Icon: UserCircle, label: t('settings.tabs.perfil') },
    { id: 'idioma', Icon: Globe, label: t('settings.tabs.idioma') },
    { id: 'caminhos', Icon: FolderOpen, label: 'Templates' },
    { id: 'atalhos', Icon: Keyboard, label: t('settings.tabs.atalhos') },
    { id: 'regras', Icon: BookOpen, label: t('settings.tabs.regras') },
    { id: 'hooks', Icon: BoxingGloveIcon, label: t('settings.tabs.hooks') },
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
    const categoryOrder: Array<{ key: keyof typeof noteTypes; icon: string; label: string }> = [
      { key: 'terceiros', icon: 'BookOpen', label: t('settings.categories.terceiros') },
      { key: 'atomica', icon: 'Atom', label: t('settings.categories.atomica') },
      { key: 'organizacional', icon: 'Map', label: t('settings.categories.organizacional') },
      { key: 'alex', icon: 'PenTool', label: t('settings.categories.alex') },
    ];

    // Helper para status badge baseado em campos preenchidos (mesmo estilo que colaboradores)
    const getPathStatusBadge = (tipo: string) => {
      const hasPath = notePaths[tipo] && notePaths[tipo].trim() !== '';
      const hasTemplate = noteTemplates[tipo] && noteTemplates[tipo].trim() !== '';

      if (hasPath && hasTemplate) {
        return (
          <span className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-1 whitespace-nowrap">
            ✓ Completo
          </span>
        );
      } else if (hasPath) {
        return (
          <span className="text-xs px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center gap-1 whitespace-nowrap">
            ⏳ Sem Template
          </span>
        );
      } else {
        return (
          <span className="text-xs px-2 py-0.5 rounded-md bg-gray-500/10 text-gray-600 dark:text-gray-400 flex items-center gap-1 whitespace-nowrap">
            <Ban className="w-3 h-3" />
            Incompleto
          </span>
        );
      }
    };

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
              onClick={() => setShowCategoryManager(true)}
              className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
            >
              {t('settings.categoryManager.manageCategories')}
            </button>
            <button
              onClick={() => setShowNewTemplateModal(true)}
              className="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:opacity-90 rounded-lg transition-opacity"
            >
              {t('settings.newTemplate.newTemplate')}
            </button>
          </div>
        </div>

        {categoryOrder.map(({ key, icon, label }) => {
          const items = noteTypes[key];
          if (!items || items.length === 0) return null;
          const CategoryIcon = getLucideIcon(icon);

          return (
            <div key={key} className="space-y-4">
              {/* Category header */}
              <div className="flex items-center gap-2 pb-2 border-b border-border/50">
                <CategoryIcon className="w-5 h-5 text-primary" />
                <h5 className="text-sm font-semibold text-foreground">{label}</h5>
              </div>

              {/* 3-column grid for cards - MINIMALIST DESIGN */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(({ tipo, icon: itemIcon, label: itemLabel }) => {
                  const ItemIcon = getLucideIcon(itemIcon);
                  const hasPath = notePaths[tipo] && notePaths[tipo].trim() !== '';
                  const hasTemplate = noteTemplates[tipo] && noteTemplates[tipo].trim() !== '';
                  const isActive = hasPath && hasTemplate;

                  return (
                    <div
                      key={tipo}
                      className="bg-card/50 rounded-xl border border-border/50 p-4 transition-all hover:border-primary/30 hover:bg-accent/30"
                    >
                      {/* Linha superior: ícone + título + status */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <h4 className="font-semibold text-sm text-foreground truncate">
                            {itemLabel}
                          </h4>
                        </div>
                        {isActive ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex-shrink-0">
                            Ativado
                          </span>
                        ) : hasPath ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex-shrink-0">
                            Incompleto
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-600 dark:text-gray-400 flex-shrink-0">
                            Inativo
                          </span>
                        )}
                      </div>

                      {/* Divisor */}
                      <div className="border-t border-border/30 my-3"></div>

                      {/* Linha inferior: ícones de ação */}
                      <div className="flex items-center justify-end gap-3">
                        {/* Ícones de ação */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              if (notePaths[tipo]) {
                                showSuccessToast(`Caminho: ${notePaths[tipo]}`);
                              } else if (noteTemplates[tipo]) {
                                showSuccessToast(`Template: ${noteTemplates[tipo]}`);
                              } else {
                                showSuccessToast('Configure o caminho e template primeiro');
                              }
                            }}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                            title="Ver configuração"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deactivatePath(tipo, itemLabel)}
                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                            title="Deletar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditPathModal(tipo, itemLabel, itemIcon)}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                            title="Editar configuração"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Custom templates */}
        {customTemplates.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <LucideIcons.Plus className="w-5 h-5 text-primary" />
              <h5 className="text-sm font-semibold text-foreground">Templates Customizados</h5>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customTemplates.map((ct) => {
                const CtIcon = getLucideIcon(ct.icon);
                return (
                  <div key={ct.id} className="bg-card/50 rounded-xl border border-border/50 p-4 transition-all hover:border-primary/30 hover:bg-accent/30">
                    {/* Linha superior: ícone + título + status */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <CtIcon className="w-4 h-4" />
                        </div>
                        <h4 className="font-semibold text-sm text-foreground truncate">
                          {ct.label}
                        </h4>
                      </div>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex-shrink-0">
                        Ativado
                      </span>
                    </div>

                    {/* Divisor */}
                    <div className="border-t border-border/30 my-3"></div>

                    {/* Linha inferior: ícones de ação */}
                    <div className="flex items-center justify-end gap-3">
                      {/* Ícones de ação */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            const info = [
                              ct.templatePath && `Template: ${ct.templatePath}`,
                              ct.destinationPath && `Caminho: ${ct.destinationPath}`
                            ].filter(Boolean).join('\n');
                            showSuccessToast(info || 'Template sem configuração');
                          }}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                          title="Ver configuração"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCustomTemplate(ct.id, ct.label)}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => editCustomTemplate(ct)}
                          className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
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
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition-colors rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
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
          className="flex flex-col gap-0.5 p-2 border-r border-border bg-muted/20 min-w-[44px] overflow-y-auto"
        >
          {tabs.map(({ id, Icon, label }) => (
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

          {/* Sidebar Actions */}
          <div className="mt-auto pt-2 border-t border-border flex flex-col gap-0.5">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="hidden"
            />
            <button
              onClick={handleExportSettings}
              title={t('settings.actions.export')}
              className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-md transition-colors w-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Download className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:inline">{t('settings.actions.export')}</span>
            </button>
            <button
              onClick={handleImportClick}
              title={t('settings.actions.import')}
              className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-md transition-colors w-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Upload className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:inline">{t('settings.actions.import')}</span>
            </button>
            <button
              onClick={handleLoadDefaults}
              title={t('settings.actions.defaults')}
              aria-label={t('settings.actions.defaults')}
              className="flex items-center gap-2 px-2 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-md transition-colors w-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <RotateCcw className="w-4 h-4 flex-shrink-0" />
              <span className="hidden lg:inline">{t('settings.actions.defaults')}</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div
          id={`settings-panel-content-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`settings-panel-tab-${activeTab}`}
          className={`${activeTab === 'regras' || activeTab === 'caminhos' || activeTab === 'atalhos' || activeTab === 'hooks' || activeTab === 'idioma' || activeTab === 'perfil' || activeTab === 'colaboracao' || activeTab === 'integracoes' ? '' : 'p-5'} overflow-y-auto flex-1`}
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
                    className="bg-card/50 rounded-xl border border-border/50 p-5 transition-all hover:border-primary/30 hover:bg-accent/30 flex flex-col gap-4"
                  >
                    {/* Header: Nome + Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-base text-foreground">
                        {lang.native}
                      </h4>
                      {isSelected && (
                        <span className="text-xs px-2 py-0.5 rounded-md bg-green-500/10 text-green-600 dark:text-green-400 flex items-center gap-1 whitespace-nowrap">
                          ✓ {t('settings.collaboration.statusActive')}
                        </span>
                      )}
                    </div>

                    {/* Descrição: Nome completo */}
                    <p className="text-sm text-muted-foreground -mt-2">
                      {lang.name}
                    </p>

                    {/* Bandeira + código (estilo role badge) */}
                    <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-muted/50 w-fit font-mono text-xs">
                      <span className="text-lg">{lang.flag}</span>
                      <span className="text-muted-foreground">{lang.code}</span>
                    </div>

                    {/* Footer: ícone de status */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border/30">
                      <div className="text-xs text-muted-foreground">
                        {/* Espaço reservado */}
                      </div>

                      <div className="flex items-center gap-1">
                        {isSelected ? (
                          <div className="p-1.5 rounded-md bg-green-500/10 text-green-600">
                            <Power className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-md text-muted-foreground">
                            <Ban className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
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
                          setEditingShortcut({ category, id: shortcut.id, label: shortcut.label, key: shortcut.key });
                          setNewShortcutKey(shortcut.key);
                          setShowShortcutModal(true);
                        }}
                      >
                        <span className="text-xs font-medium text-foreground truncate">
                          {shortcut.label}
                        </span>
                        <kbd className="ml-2 px-2 py-1 text-[10px] font-mono bg-muted border border-border rounded text-muted-foreground group-hover:border-primary/50 transition-colors flex-shrink-0">
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
                      : 'border-border/50 bg-muted/30'
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
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-600 dark:text-gray-400 flex-shrink-0">
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

                  {/* Trigger badge */}
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md mb-3">
                    <BoxingGloveIcon className="w-3 h-3 text-muted-foreground" />
                    <code className="text-[10px] font-mono text-muted-foreground">
                      {hook.trigger}
                    </code>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                    <div className="text-xs text-muted-foreground"></div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {/* Power Button - Activate/Deactivate */}
                      <button
                        onClick={() => toggleHook(hook.id)}
                        className={`p-1.5 rounded-md transition-colors ${
                          hook.enabled
                            ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                            : 'text-green-600 hover:text-green-700 hover:bg-green-500/10'
                        }`}
                        title={hook.enabled ? t('settings.collaboration.deactivate') : t('settings.collaboration.activate')}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>

                      {/* Edit Button */}
                      <button
                        onClick={() => openEditHookModal(hook)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                        title="Editar hook"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button - only for custom hooks */}
                      {hook.id.startsWith('hook-') && (
                        <button
                          onClick={() => deleteHook(hook.id)}
                          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                          title="Excluir hook"
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
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Cadastrar Novo Hook</h3>
                    <button
                      onClick={() => {
                        setShowAddHookModal(false);
                        setNewHook({ name: '', description: '', trigger: '' });
                      }}
                      className="p-1 text-destructive hover:text-destructive/80 rounded-md transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Nome do Hook</label>
                      <input
                        type="text"
                        value={newHook.name}
                        onChange={(e) => setNewHook({ ...newHook, name: e.target.value })}
                        placeholder="Ex: Meu Hook Personalizado"
                        className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Descrição</label>
                      <textarea
                        value={newHook.description}
                        onChange={(e) => setNewHook({ ...newHook, description: e.target.value })}
                        placeholder="Descreva quando este hook deve ser ativado..."
                        rows={3}
                        className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Trigger (comando)</label>
                      <input
                        type="text"
                        value={newHook.trigger}
                        onChange={(e) => setNewHook({ ...newHook, trigger: e.target.value })}
                        placeholder="Ex: /meu-comando"
                        className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowAddHookModal(false);
                        setNewHook({ name: '', description: '', trigger: '' });
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
                    >
                      {t('settings.actions.cancel')}
                    </button>
                    <button
                      onClick={addHook}
                      disabled={!newHook.name || !newHook.description || !newHook.trigger}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('settings.actions.create')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Hook Modal */}
            {showEditHookModal && editingHook && (
              <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
                <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-foreground">Editar Hook</h3>
                    <button
                      onClick={() => {
                        setShowEditHookModal(false);
                        setEditingHook(null);
                        setEditHookData({ name: '', description: '', trigger: '' });
                      }}
                      className="p-1 text-destructive hover:text-destructive/80 rounded-md transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Nome do Hook</label>
                      <input
                        type="text"
                        value={editHookData.name}
                        onChange={(e) => setEditHookData({ ...editHookData, name: e.target.value })}
                        placeholder="Ex: Meu Hook Personalizado"
                        className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Descrição</label>
                      <textarea
                        value={editHookData.description}
                        onChange={(e) => setEditHookData({ ...editHookData, description: e.target.value })}
                        placeholder="Descreva quando este hook deve ser ativado..."
                        rows={3}
                        className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Trigger (comando)</label>
                      <input
                        type="text"
                        value={editHookData.trigger}
                        onChange={(e) => setEditHookData({ ...editHookData, trigger: e.target.value })}
                        placeholder="Ex: /meu-comando"
                        className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono text-sm"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => {
                        setShowEditHookModal(false);
                        setEditingHook(null);
                        setEditHookData({ name: '', description: '', trigger: '' });
                      }}
                      className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
                    >
                      {t('settings.actions.cancel')}
                    </button>
                    <button
                      onClick={updateHook}
                      disabled={!editHookData.name || !editHookData.description || !editHookData.trigger}
                      className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Salvar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'perfil' ? (
          <div className="p-5 overflow-y-auto">
            <div className="mb-4">
              <h4 className="text-base font-semibold text-foreground">{t('settings.profile.title')}</h4>
              <p className="text-sm text-muted-foreground/90">{t('settings.profile.subtitle')}</p>
            </div>
            <ProfileSettings />
          </div>
        ) : activeTab === 'colaboracao' ? (
          <div className="p-5 overflow-y-auto">
            <div className="mb-4">
              <h4 className="text-base font-semibold text-foreground">{t('settings.collaboration.title')}</h4>
              <p className="text-sm text-muted-foreground/90">{t('settings.integrations.subtitle')}</p>
            </div>
            <CollaborationSettings />
          </div>
        ) : activeTab === 'integracoes' ? (
          <IntegrationsSettings hooks={hooks} />
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

      {/* Shortcut Redefine Modal */}
      {showShortcutModal && editingShortcut && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-semibold text-foreground">{t('settings.shortcuts.promptTitle')}</h3>
              <button
                onClick={() => { setShowShortcutModal(false); setEditingShortcut(null); }}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {t('settings.shortcuts.pressKey')} <strong>"{editingShortcut.label}"</strong>
            </p>
            <input
              autoFocus
              type="text"
              value={newShortcutKey}
              readOnly
              onKeyDown={(e) => {
                e.preventDefault();
                setNewShortcutKey(e.key);
              }}
              placeholder="Pressione uma tecla..."
              className="w-full px-3 py-2 text-sm font-mono border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setShowShortcutModal(false); setEditingShortcut(null); }}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
              >
                {t('settings.actions.cancel')}
              </button>
              <button
                onClick={() => {
                  if (newShortcutKey && newShortcutKey !== editingShortcut.key) {
                    updateShortcut(editingShortcut.category, editingShortcut.id, newShortcutKey);
                  }
                  setShowShortcutModal(false);
                  setEditingShortcut(null);
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
              >
                {t('common.confirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Manager Modal */}
      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
        onCategoriesChange={() => {}}
      />

      {/* New Template Modal */}
      <NewTemplateModal
        isOpen={showNewTemplateModal}
        onClose={() => setShowNewTemplateModal(false)}
        onTemplateCreated={() => setCustomTemplates(getCustomTemplates())}
        showSuccessToast={showSuccessToast}
      />

      {/* Edit Path/Template Modal */}
      {showEditPathModal && editingPath && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Editar Configuração</h3>
              <button
                onClick={() => {
                  setShowEditPathModal(false);
                  setEditingPath(null);
                }}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
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
                  Template
                  <span className="text-xs text-muted-foreground ml-2">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={editPathData.template}
                  onChange={(e) => setEditPathData({ ...editPathData, template: e.target.value })}
                  placeholder="Ex: Templates/Nota.md"
                  className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary font-mono text-sm"
                />
              </div>

              {/* Path field */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Caminho de destino
                  <span className="text-xs text-primary ml-2">*</span>
                </label>
                <input
                  type="text"
                  value={editPathData.path}
                  onChange={(e) => setEditPathData({ ...editPathData, path: e.target.value })}
                  placeholder="Ex: YouTube/Transcrições"
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
                Cancelar
              </button>
              <button
                onClick={savePathEdit}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onConfirm={confirmDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setDeleteTarget(null);
        }}
        title="Deletar Template"
        message={deleteTarget ? `Tem certeza que deseja deletar "${deleteTarget.label}"? Esta ação não pode ser desfeita.` : ''}
        type="delete"
        confirmLabel="Deletar"
        cancelLabel="Cancelar"
      />
    </div>
  );
};
