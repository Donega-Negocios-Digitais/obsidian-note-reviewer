import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { BookOpen, FolderOpen, User, Keyboard, Globe, Download, Upload, RotateCcw, Lightbulb, UserCircle, Users, Edit, Trash2 } from 'lucide-react';
// import { ProfileSettings } from './ProfileSettings';
// import { CollaborationSettings } from './CollaborationSettings';

const BoxingGloveIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
    <g transform="rotate(-90, 256, 256)">
      <path d="M141.977 56.943q-.952.005-1.905.053c-2.903.145-5.805.58-8.7 1.326c-28.33 7.294-56.425 29.248-77.058 57.844c-20.632 28.596-33.67 63.593-33.554 95.455c.06 16.533 6.94 27.84 18.886 36.927c7.29 5.544 16.59 9.97 27.032 13.23c-1.023-14.32-.482-29.776 3.957-42.71l16.844 5.783c-15.886 57.862 18.713 102.134 69.65 142.007c-2.305-28.866 2.355-59.986 15.7-91.345c-1.265-7.76-1.14-16.392.57-25.664c4.65-25.21 20.01-56.115 49.88-93.414l14.59 11.68c-28.65 35.777-42.302 64.575-46.09 85.122c-3.79 20.548 1.342 31.848 10.048 38.176s23.24 8.047 40.315 2.526c17.073-5.522 36.13-18.136 52.42-38.405c40.154-49.957 56.8-91.026 58.064-120.484c1.265-29.46-11.115-47.414-32.752-56.937C276.602 59.067 191.21 80.82 119.7 162.938l-14.095-12.272c26.81-30.786 55.632-54.11 84.143-70.29c-15.18-14.578-31.464-23.538-47.77-23.433zm230.76 85.89c-.65-.005-1.303.005-1.956.01c-3.553 34.283-22.66 75.888-61.65 124.397c-18.358 22.844-40.163 37.666-61.237 44.48c-21.075 6.816-41.974 5.77-57.053-5.19a42 42 0 0 1-7.387-6.887c-20.753 63.805-2.12 122.793 34.906 158.587c25.613 24.76 60.005 38.354 97.472 34.727s78.5-24.527 116.943-70.998c84.462-102.102 71.214-199.61 19.823-247.646c-21.08-19.702-48.703-31.302-79.862-31.482z" />
    </g>
  </svg>
);
import { getIdentity, getAnonymousIdentity, regenerateIdentity, updateDisplayName } from '../utils/identity';
import { getDisplayName } from '../utils/storage';
import { ModeToggle } from './ModeToggle';
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
  getAllNoteTypeTemplates
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
}

type CategoryTab = 'caminhos' | 'regras' | 'identidade' | 'idioma' | 'atalhos' | 'hooks'; // 'perfil' | 'colaboracao' - temporarily disabled

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
  onNotePathChange
}) => {
  const { t, i18n } = useTranslation();
  const [identity, setIdentity] = useState('');
  const [displayName, setDisplayNameState] = useState('');
  const [anonymousIdentity, setAnonymousIdentity] = useState('');
  const [notePaths, setNotePaths] = useState<Record<string, string>>({});
  const [noteTemplates, setNoteTemplates] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<CategoryTab>('caminhos');
  const [savedField, setSavedField] = useState<string | null>(null);
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({});
  const [saveSuccess, setSaveSuccess] = useState<Record<string, boolean>>({});
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
  const [showAddHookModal, setShowAddHookModal] = useState(false);
  const [newHook, setNewHook] = useState({ name: '', description: '', trigger: '' });

  // Edit hook modal state
  const [showEditHookModal, setShowEditHookModal] = useState(false);
  const [editingHook, setEditingHook] = useState<Hook | null>(null);
  const [editHookData, setEditHookData] = useState({
    name: '',
    description: '',
    trigger: '',
  });

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
    if (confirm('Tem certeza que deseja excluir este hook?')) {
      const updatedHooks = hooks.filter(h => h.id !== id);
      setHooks(updatedHooks);
      localStorage.setItem('obsreview-hooks', JSON.stringify(updatedHooks));
    }
  };

  const noteTypes = getNoteTypesByCategory();

  const tabs: Array<{ id: CategoryTab; Icon: React.ComponentType<{ className?: string }>; label: string }> = [
    { id: 'caminhos', Icon: FolderOpen, label: t('settings.tabs.caminhos') },
    { id: 'regras', Icon: BookOpen, label: t('settings.tabs.regras') },
    { id: 'identidade', Icon: User, label: t('settings.tabs.identidade') },
    { id: 'idioma', Icon: Globe, label: t('settings.tabs.idioma') },
    { id: 'atalhos', Icon: Keyboard, label: t('settings.tabs.atalhos') },
    { id: 'hooks', Icon: BoxingGloveIcon, label: t('settings.tabs.hooks') },
    // { id: 'perfil', Icon: UserCircle, label: 'Perfil' }, // temporarily disabled
    // { id: 'colaboracao', Icon: Users, label: 'Colaboração' }, // temporarily disabled
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

  // New component for unified paths and templates with 3-column grid
  const AllPathsAndTemplates = () => {
    const categoryOrder: Array<{ key: keyof typeof noteTypes; icon: string; label: string }> = [
      { key: 'terceiros', icon: 'BookOpen', label: t('settings.categories.terceiros') },
      { key: 'atomica', icon: 'Atom', label: t('settings.categories.atomica') },
      { key: 'organizacional', icon: 'Map', label: t('settings.categories.organizacional') },
      { key: 'alex', icon: 'PenTool', label: t('settings.categories.alex') },
    ];

    return (
      <div className="p-5 space-y-6 overflow-y-auto">
        {/* Header */}
        <div className="mb-4">
          <h4 className="text-base font-semibold text-foreground">{t('settings.paths.title')}</h4>
          <p className="text-sm text-muted-foreground/90">{t('settings.paths.subtitle')}</p>
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

              {/* 3-column grid for cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map(({ tipo, icon: itemIcon, label: itemLabel }) => {
                  const ItemIcon = getLucideIcon(itemIcon);
                  return (
                    <div
                      key={tipo}
                      className="bg-card/50 rounded-xl border border-border/50 p-4 hover:border-border/80 transition-all hover:shadow-sm"
                    >
                      {/* Item header - compact */}
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                          <ItemIcon className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm font-semibold text-foreground truncate">{itemLabel}</h4>
                      </div>

                      {/* Form fields - more compact */}
                      <div className="space-y-2">
                        {/* Template field */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                            <span>{t('settings.paths.template')}</span>
                            <span className="text-[9px] px-1 py-0.5 rounded bg-muted/50 text-muted-foreground/60">
                              {t('settings.paths.templateOptional')}
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={noteTemplates[tipo] || ''}
                              onChange={(e) => handleTemplateChange(tipo, e.target.value)}
                              placeholder={t('settings.paths.templatePlaceholder')}
                              className={`w-full px-2.5 py-1.5 pr-8 bg-background rounded-lg text-xs border focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono transition-all placeholder:text-muted-foreground/50 ${
                                saveErrors[`${tipo}-template`]
                                  ? 'border-red-500'
                                  : saveSuccess[`${tipo}-template`]
                                  ? 'border-green-500'
                                  : 'border-border focus:border-primary'
                              }`}
                            />
                            {saveSuccess[`${tipo}-template`] && !saveErrors[`${tipo}-template`] && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            {saveErrors[`${tipo}-template`] && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Destination field */}
                        <div className="space-y-1">
                          <label className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                            <span>{t('settings.paths.destination')}</span>
                            <span className="text-[9px] px-1 py-0.5 rounded bg-primary/10 text-primary">
                              {t('settings.paths.destinationRequired')}
                            </span>
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={notePaths[tipo] || ''}
                              onChange={(e) => handlePathChange(tipo, e.target.value)}
                              placeholder={t('settings.paths.destinationPlaceholder')}
                              className={`w-full px-2.5 py-1.5 pr-8 bg-background rounded-lg text-xs border focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono transition-all placeholder:text-muted-foreground/50 ${
                                saveErrors[`${tipo}-path`]
                                  ? 'border-red-500'
                                  : saveSuccess[`${tipo}-path`]
                                  ? 'border-green-500'
                                  : 'border-border focus:border-primary'
                              }`}
                            />
                            {saveSuccess[`${tipo}-path`] && !saveErrors[`${tipo}-path`] && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              </div>
                            )}
                            {saveErrors[`${tipo}-path`] && (
                              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

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

      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">{t('settings.title')}</h3>
          <div className="flex items-center gap-2">
            <ModeToggle />
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
          className={`${activeTab === 'regras' || activeTab === 'caminhos' || activeTab === 'identidade' || activeTab === 'atalhos' || activeTab === 'hooks' || activeTab === 'idioma' ? '' : 'p-5'} overflow-y-auto flex-1`}
        >
        {activeTab === 'caminhos' ? (
          <AllPathsAndTemplates />
        ) : activeTab === 'regras' ? (
          <div className="flex flex-col h-full">
            <ConfigEditor />
          </div>
        ) : activeTab === 'identidade' ? (
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="mb-2">
              <h4 className="text-base font-semibold text-foreground">{t('settings.identity.title')}</h4>
              <p className="text-sm text-muted-foreground/90">{t('settings.identity.subtitle')}</p>
            </div>

            {/* 3-column grid for identity cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Profile Section */}
              <div className="bg-card/50 rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{t('settings.identity.profile')}</h4>
                    <p className="text-[10px] text-muted-foreground">{t('settings.identity.profileDescription')}</p>
                  </div>
                </div>

                {/* Display Name */}
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => handleDisplayNameChange(e.target.value)}
                      placeholder={t('settings.identity.displayNamePlaceholder')}
                      className={`w-full px-2.5 py-2 pr-8 bg-background rounded-lg text-xs border focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all ${
                        saveErrors['display-name']
                          ? 'border-red-500'
                          : saveSuccess['display-name']
                          ? 'border-green-500'
                          : 'border-border focus:border-primary'
                      }`}
                    />
                    {saveSuccess['display-name'] && !saveErrors['display-name'] && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <svg className="w-3.5 h-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                    {saveErrors['display-name'] && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <svg className="w-3.5 h-3.5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {saveErrors['display-name'] && (
                    <p className="text-[9px] text-red-500">
                      {saveErrors['display-name']}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70">
                    {t('settings.identity.displayNameDescription')}
                  </p>
                </div>
              </div>

              {/* Current Identity Section */}
              <div className="bg-card/50 rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground">
                    <LucideIcons.IdCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{t('settings.identity.currentIdentity')}</h4>
                    <p className="text-[10px] text-muted-foreground">{t('settings.identity.currentIdentityDescription')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-medium text-muted-foreground block mb-1">
                      {t('settings.identity.mainIdentity')}
                    </label>
                    <div className="px-2 py-1.5 bg-muted rounded-lg text-[10px] font-mono text-muted-foreground break-all">
                      {identity?.slice(0, 16)}...
                    </div>
                  </div>

                  {displayName.trim() && (
                    <div>
                      <label className="text-[10px] font-medium text-muted-foreground/60 block mb-1">
                        {t('settings.identity.anonymousBackup')}
                      </label>
                      <div className="px-2 py-1.5 bg-muted/50 rounded-lg text-[9px] font-mono text-muted-foreground/50 break-all">
                        {anonymousIdentity?.slice(0, 16)}...
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Section */}
              <div className="bg-card/50 rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent-foreground">
                    <LucideIcons.Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{t('settings.identity.actions')}</h4>
                    <p className="text-[10px] text-muted-foreground">{t('settings.identity.actionsDescription')}</p>
                  </div>
                </div>

                <button
                  onClick={handleRegenerateIdentity}
                  className="w-full px-3 py-2 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {t('settings.identity.regenerateShort')}
                </button>
                <p className="text-[9px] text-muted-foreground/60 text-center mt-2">
                  {t('settings.identity.regenerateDescription')}
                </p>
              </div>
            </div>
          </div>
        ) : activeTab === 'idioma' ? (
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">{t('settings.language.title')}</h4>
              <p className="text-xs text-muted-foreground">{t('settings.language.subtitle')}</p>
            </div>

            {/* Language options */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {[
                { code: 'pt-BR', name: t('settings.language.portugueseFull'), flag: '🇧🇷', native: t('settings.language.portuguese') },
                { code: 'en-US', name: t('settings.language.englishFull'), flag: '🇺🇸', native: t('settings.language.english') },
                { code: 'es-ES', name: t('settings.language.spanishFull'), flag: '🇪🇸', native: t('settings.language.spanish') },
                { code: 'zh-CN', name: t('settings.language.chineseFull'), flag: '🇨🇳', native: t('settings.language.chinese') },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setCurrentLanguage(lang.code);
                    i18n.changeLanguage(lang.code);
                  }}
                  className={`
                    relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all
                    ${currentLanguage === lang.code
                      ? 'border-green-500/50 bg-green-500/5'
                      : 'border-border/50 bg-card/30 hover:border-border/80'
                    }
                  `}
                >
                  {/* Selected indicator */}
                  {currentLanguage === lang.code && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                      <svg className="w-3 h-3 text-green-500 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}

                  {/* Flag */}
                  <div className="text-2xl">{lang.flag}</div>

                  {/* Language info */}
                  <div className="text-center">
                    <div className="text-xs font-medium text-foreground">{lang.native}</div>
                    <div className="text-[10px] text-muted-foreground">{lang.name}</div>
                  </div>
                </button>
              ))}
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
                          const newKey = prompt(`${t('settings.shortcuts.pressKey')} "${shortcut.label}"`, shortcut.key);
                          if (newKey && newKey !== shortcut.key) {
                            updateShortcut(category, shortcut.id, newKey);
                            window.location.reload();
                          }
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
            <div className="mb-3">
              <h4 className="text-base font-semibold text-foreground">{t('settings.hooks.title')}</h4>
              <p className="text-sm text-muted-foreground/90">{t('settings.hooks.subtitle')}</p>
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
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground">
                      {hook.id === 'plan-mode' ? t('settings.hooks.planMode.name') : 
                       hook.id === 'obsidian-note' ? t('settings.hooks.obsidianNote.name') : 
                       hook.name}
                    </h3>
                    {hook.enabled ? (
                      <span className="px-2 py-0.5 text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 rounded-full font-medium">
                        {t('settings.hooks.active')}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-[10px] bg-muted/50 text-muted-foreground rounded-full font-medium">
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
                    <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <code className="text-[10px] font-mono text-muted-foreground">
                      {hook.trigger}
                    </code>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50">
                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleHook(hook.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors overflow-hidden ${
                        hook.enabled ? 'bg-green-500' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                          hook.enabled ? 'translate-x-6' : 'translate-x-0'
                        }`}
                      />
                    </button>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-1">
                      {/* Test Button */}
                      <button
                        onClick={() => {
                          // Simulate testing the hook
                          const hookName = hook.id === 'plan-mode' ? t('settings.hooks.planMode.name') :
                                           hook.id === 'obsidian-note' ? t('settings.hooks.obsidianNote.name') :
                                           hook.name;
                          alert(`${t('settings.hooks.testMessage')}: ${hookName}\n\n${t('settings.hooks.trigger')}: ${hook.trigger}`);
                        }}
                        className="px-2 py-1.5 text-xs font-medium text-foreground bg-primary/10 hover:bg-primary/20 rounded-md transition-colors"
                      >
                        {t('settings.hooks.test')}
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

            {/* Add new hook button */}
            <div
              onClick={() => setShowAddHookModal(true)}
              className="p-4 rounded-xl border-2 border-dashed border-border/50 text-center
                         hover:border-primary/50 hover:bg-primary/10 hover:shadow-md
                         cursor-pointer group transition-all duration-200"
            >
              <svg className="w-6 h-6 mx-auto text-muted-foreground/50 group-hover:text-primary transition-colors mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-xs text-muted-foreground/60 group-hover:text-primary transition-colors font-medium">
                {t('settings.hooks.addHook')}
              </p>
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
    </div>
  );
};
