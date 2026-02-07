import React, { useState, useEffect, useRef } from 'react';
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

interface SettingsPanelProps {
  isOpen: boolean;
  onClose?: () => void;
  onIdentityChange?: (oldIdentity: string, newIdentity: string) => void;
  onNoteTypeChange?: (tipo: TipoNota) => void;
  onNoteNameChange?: (name: string) => void;
  onNotePathChange?: (path: string) => void;
}

type CategoryTab = 'atomica' | 'terceiros' | 'organizacional' | 'alex' | 'regras' | 'identidade' | 'atalhos' | 'hooks' | 'idioma';

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  isOpen,
  onClose,
  onIdentityChange,
  onNotePathChange
}) => {
  const [identity, setIdentity] = useState('');
  const [displayName, setDisplayNameState] = useState('');
  const [anonymousIdentity, setAnonymousIdentity] = useState('');
  const [notePaths, setNotePaths] = useState<Record<string, string>>({});
  const [noteTemplates, setNoteTemplates] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<CategoryTab>('regras');
  const [savedField, setSavedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-hide save feedback after 2 seconds
  useEffect(() => {
    if (savedField) {
      const timer = setTimeout(() => setSavedField(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [savedField]);

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
      description: 'Ativa automaticamente o Note Reviewer quando o Claude Code entra em modo de planejamento',
      trigger: '/plan',
      enabled: true,
    },
    {
      id: 'obsidian-note',
      name: 'Criar Nota Obsidian',
      description: 'Abre o Note Reviewer quando você usa a skill para criar notas no Obsidian',
      trigger: 'nota-obsidian',
      enabled: true,
    },
  ]);

  // Language state
  const [currentLanguage, setCurrentLanguage] = useState(() => {
    return localStorage.getItem('app-language') || 'pt-BR';
  });

  // Load saved configuration on mount and when panel opens
  useEffect(() => {
    if (isOpen) {
      setIdentity(getIdentity());
      setDisplayNameState(getDisplayName());
      setAnonymousIdentity(getAnonymousIdentity());

      // Load all saved paths and templates
      const noteTypes = getNoteTypesByCategory();
      const paths: Record<string, string> = {};
      const templates: Record<string, string> = {};

      [...noteTypes.terceiros, ...noteTypes.atomica, ...noteTypes.organizacional, ...noteTypes.alex].forEach(({ tipo }) => {
        paths[tipo] = getNoteTypePath(tipo);
        templates[tipo] = getNoteTypeTemplate(tipo);
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
    updateDisplayName(name);
    // Update displayed identity
    const newIdentity = name.trim() || anonymousIdentity;
    setIdentity(newIdentity);
    if (oldIdentity !== newIdentity) {
      onIdentityChange?.(oldIdentity, newIdentity);
    }
  };

  const handlePathChange = (tipo: string, path: string) => {
    setNotePaths(prev => ({ ...prev, [tipo]: path }));
    setNoteTypePath(tipo, path);
    // Also update the general note path for the save button
    setNotePath(path);
    // Notify App.tsx to update savePath
    onNotePathChange?.(path);
    // Show save feedback
    setSavedField(`${tipo}-path`);
  };

  const handleTemplateChange = (tipo: string, templatePath: string) => {
    setNoteTemplates(prev => ({ ...prev, [tipo]: templatePath }));
    setNoteTypeTemplate(tipo, templatePath);
    // Show save feedback
    setSavedField(`${tipo}-template`);
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
          alert(`Erro ao importar configurações: ${validation.error}`);
          return;
        }

        // Apply the settings
        importAllSettings(data);

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

        alert('Configurações importadas com sucesso!');
      } catch (err) {
        alert('Erro ao importar configurações: arquivo JSON inválido');
      }
    };

    reader.onerror = () => {
      alert('Erro ao ler o arquivo');
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

  const noteTypes = getNoteTypesByCategory();

  const tabs: Array<{ id: CategoryTab; emoji: string; label: string }> = [
    { id: 'regras', emoji: '📋', label: 'Regras e Workflows' },
    { id: 'terceiros', emoji: '📚', label: 'Conteúdo de Terceiros' },
    { id: 'atomica', emoji: '⚛️', label: 'Notas Atômicas' },
    { id: 'organizacional', emoji: '🗺️', label: 'Notas Organizacionais' },
    { id: 'alex', emoji: '✍️', label: 'Conteúdo Próprio' },
    { id: 'identidade', emoji: '👤', label: 'Identidade do Revisor' },
    { id: 'atalhos', emoji: '⌨️', label: 'Atalhos de Teclado' },
    { id: 'hooks', emoji: '🔗', label: 'Hooks' },
    { id: 'idioma', emoji: '🌐', label: 'Idioma' },
  ];

  const CategoryContent = ({ category }: { category: CategoryTab }) => {
    const items = noteTypes[category];

    return (
      <div>
        {items.map(({ tipo, emoji, label }) => (
          <div key={tipo} className="mb-4 last:mb-0">
            <div className="bg-card/50 rounded-xl border border-border/50 p-5 hover:border-border/80 transition-colors">
              {/* Header with emoji and title */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                  {emoji}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">{label}</h4>
                  <p className="text-xs text-muted-foreground">Configure caminho e template</p>
                </div>
              </div>

              {/* Form fields with better spacing */}
              <div className="space-y-4">
                {/* Template field */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <span>Template</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/60">
                      Opcional
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={noteTemplates[tipo] || ''}
                      onChange={(e) => handleTemplateChange(tipo, e.target.value)}
                      placeholder="C:/caminho/para/template.md"
                      className={`w-full px-3 py-2.5 pr-10 bg-background rounded-lg text-sm border focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono transition-all placeholder:text-muted-foreground/50 ${
                        savedField === `${tipo}-template` ? 'border-green-500' : 'border-border focus:border-primary'
                      }`}
                    />
                    {savedField === `${tipo}-template` && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">
                    Caminho para o arquivo de template usado para criar este tipo de nota
                  </p>
                </div>

                {/* Destination field */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
                    <span>Destino</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      Obrigatório
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={notePaths[tipo] || ''}
                      onChange={(e) => handlePathChange(tipo, e.target.value)}
                      placeholder="C:/caminho/para/pasta/destino"
                      className={`w-full px-3 py-2.5 pr-10 bg-background rounded-lg text-sm border focus:ring-2 focus:ring-primary/20 focus:outline-none font-mono transition-all placeholder:text-muted-foreground/50 ${
                        savedField === `${tipo}-path` ? 'border-green-500' : 'border-border focus:border-primary'
                      }`}
                    />
                    {savedField === `${tipo}-path` && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <svg className="w-4 h-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground/70">
                    Pasta onde as notas deste tipo serão salvas
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full h-full bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-foreground">Configurações</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportSettings}
              className="px-2 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors flex items-center gap-1"
              title="Exportar configurações"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Exportar
            </button>
            <button
              onClick={handleImportClick}
              className="px-2 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors flex items-center gap-1"
              title="Importar configurações"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m4-8l-4-4m0 0l-4 4m4-4v12" />
              </svg>
              Importar
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportSettings}
              className="hidden"
            />
            <button
              onClick={handleLoadDefaults}
              className="px-2 py-1 text-xs font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-md transition-colors flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              title="Carregar valores padrão"
              aria-label="Carregar valores padrão"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Padrões
            </button>
            <ModeToggle />
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition-colors rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                title="Fechar configurações"
                aria-label="Fechar configurações"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">Configure caminhos e templates</p>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-border bg-muted/20 overflow-x-auto">
        <div role="tablist" aria-label="Categorias de tipos de nota" className="flex px-2 min-w-max">
          {tabs.map(({ id, emoji, label }) => (
            <button
              key={id}
              id={`settings-panel-tab-${id}`}
              role="tab"
              aria-selected={activeTab === id}
              aria-controls={`settings-panel-content-${id}`}
              onClick={() => setActiveTab(id)}
              className={`
                flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all relative whitespace-nowrap rounded-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none
                ${activeTab === id
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
                }
              `}
            >
              <span className="text-sm">{emoji}</span>
              <span className="hidden md:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div
        id={`settings-panel-content-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`settings-panel-tab-${activeTab}`}
        className={`${activeTab === 'regras' || activeTab === 'identidade' || activeTab === 'atalhos' || activeTab === 'hooks' || activeTab === 'idioma' ? '' : 'p-5'} overflow-y-auto flex-1`}
      >
        {activeTab === 'regras' ? (
          <div className="flex flex-col h-full">
            <ConfigEditor />
          </div>
        ) : activeTab === 'identidade' ? (
          <div className="p-5 space-y-5 overflow-y-auto">
            {/* Profile Section */}
            <div className="bg-card/50 rounded-xl border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xl">
                  👤
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Perfil do Revisor</h4>
                  <p className="text-xs text-muted-foreground">Personalize sua identidade nas anotações</p>
                </div>
              </div>

              {/* Display Name */}
              <div className="space-y-3">
                <label className="text-xs font-medium text-muted-foreground">
                  Nome de Exibição
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => handleDisplayNameChange(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full px-3 py-2.5 bg-background rounded-lg text-sm border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
                />
                <p className="text-[11px] text-muted-foreground/70">
                  Este nome será exibido em suas anotações. Deixe em branco para usar identidade anônima.
                </p>
              </div>
            </div>

            {/* Current Identity Section */}
            <div className="bg-card/50 rounded-xl border border-border/50 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-muted/50 flex items-center justify-center text-xl">
                  🪪
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Identidade Ativa</h4>
                  <p className="text-xs text-muted-foreground">Usada para identificar suas anotações</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1.5">
                    Identidade Principal
                  </label>
                  <div className="px-3 py-2 bg-muted rounded-lg text-xs font-mono text-muted-foreground break-all">
                    {identity}
                  </div>
                </div>

                {displayName.trim() && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground/60 block mb-1.5">
                      Backup Anônimo
                    </label>
                    <div className="px-3 py-2 bg-muted/50 rounded-lg text-[11px] font-mono text-muted-foreground/50 break-all">
                      {anonymousIdentity}
                    </div>
                    <p className="text-[10px] text-muted-foreground/50 mt-1">
                      Salvo caso você remova o nome de exibição
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Section */}
            <div className="bg-card/50 rounded-xl border border-border/50 p-5">
              <button
                onClick={handleRegenerateIdentity}
                className="w-full px-4 py-2.5 text-sm font-medium text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Gerar Nova Identidade
              </button>
              <p className="text-[11px] text-muted-foreground/60 text-center mt-2">
                Isso criará uma nova identidade anônima para suas anotações
              </p>
            </div>
          </div>
        ) : activeTab === 'atalhos' ? (
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-foreground">Atalhos de Teclado</h4>
                <p className="text-xs text-muted-foreground">Clique para redefinir</p>
              </div>
              <button
                onClick={() => {
                  resetShortcuts();
                  window.location.reload();
                }}
                className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-lg transition-colors"
              >
                Restaurar Padrões
              </button>
            </div>

            {/* Shortcuts by category */}
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
                        const newKey = prompt(`Pressione a nova tecla para "${shortcut.label}"`, shortcut.key);
                        if (newKey && newKey !== shortcut.key) {
                          updateShortcut(category, shortcut.id, newKey);
                          window.location.reload();
                        }
                      }}
                    >
                      <span className="text-xs font-medium text-foreground">
                        {shortcut.label}
                      </span>
                      <kbd className="ml-2 px-2 py-1 text-[10px] font-mono bg-muted border border-border rounded text-muted-foreground group-hover:border-primary/50 transition-colors">
                        {formatShortcutKey(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Info tip */}
            <div className="p-3 rounded-lg bg-muted/30 text-center">
              <p className="text-xs text-muted-foreground">
                💡 Clique em qualquer atalho para redefinir a tecla
              </p>
            </div>
          </div>
        ) : activeTab === 'hooks' ? (
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Hooks do Sistema</h4>
              <p className="text-xs text-muted-foreground">Configure integrações automáticas</p>
            </div>

            {/* Hooks list */}
            {hooks.map((hook) => (
              <div
                key={hook.id}
                className={`
                  bg-card/50 rounded-xl border-2 p-4 transition-all
                  ${hook.enabled
                    ? 'border-primary/50 bg-primary/5'
                    : 'border-border/50 bg-muted/30'
                  }
                `}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Header with status */}
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-foreground">{hook.name}</h3>
                      {hook.enabled ? (
                        <span className="px-2 py-0.5 text-[10px] bg-green-500/20 text-green-600 dark:text-green-400 rounded-full font-medium">
                          ✓ Ativo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-[10px] bg-muted/50 text-muted-foreground rounded-full font-medium">
                          Inativo
                        </span>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground mb-2">
                      {hook.description}
                    </p>

                    {/* Trigger badge */}
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md">
                      <svg className="w-3 h-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      <code className="text-[10px] font-mono text-muted-foreground">
                        {hook.trigger}
                      </code>
                    </div>
                  </div>

                  {/* Actions column */}
                  <div className="flex flex-col gap-2">
                    {/* Toggle Switch */}
                    <button
                      onClick={() => toggleHook(hook.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        hook.enabled ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${
                          hook.enabled ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>

                    {/* Test Button */}
                    <button
                      onClick={() => {
                        // Simulate testing the hook
                        alert(`Hook "${hook.name}" test would run here.\n\nThis would trigger: ${hook.trigger}`);
                      }}
                      className="px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-foreground bg-muted/30 hover:bg-muted/50 rounded-md transition-colors"
                    >
                      Testar
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Add new hook placeholder */}
            <div className="p-4 rounded-xl border-2 border-dashed border-border/50 text-center hover:border-border/80 transition-colors cursor-pointer group">
              <svg className="w-6 h-6 mx-auto text-muted-foreground/50 group-hover:text-muted-foreground transition-colors mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              <p className="text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
                Mais hooks serão adicionados em breve
              </p>
            </div>
          </div>
        ) : activeTab === 'idioma' ? (
          <div className="p-5 space-y-4 overflow-y-auto">
            {/* Header */}
            <div className="mb-2">
              <h4 className="text-sm font-semibold text-foreground">Idioma da Interface</h4>
              <p className="text-xs text-muted-foreground">Selecione seu idioma preferido</p>
            </div>

            {/* Language options */}
            <div className="space-y-2">
              {[
                { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷', native: 'Português' },
                { code: 'en-US', name: 'English (United States)', flag: '🇺🇸', native: 'English' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setCurrentLanguage(lang.code);
                    localStorage.setItem('app-language', lang.code);
                    // In full implementation, this would call i18n.changeLanguage(lang.code);
                    // For now, just store the preference
                  }}
                  className={`
                    w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                    ${currentLanguage === lang.code
                      ? 'border-primary bg-primary/5'
                      : 'border-border/50 bg-card/30 hover:border-border/80'
                    }
                  `}
                >
                  {/* Flag */}
                  <div className="text-3xl">{lang.flag}</div>

                  {/* Language info */}
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-foreground">
                      {lang.native}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {lang.name}
                    </div>
                  </div>

                  {/* Selected indicator */}
                  {currentLanguage === lang.code && (
                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                      <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* Info note */}
            <div className="p-3 rounded-xl bg-muted/30">
              <p className="text-xs text-muted-foreground text-center">
                💡 A tradução completa será implementada em uma fase futura. Por enquanto, esta configuração salva sua preferência.
              </p>
            </div>
          </div>
        ) : (
          <>
            <CategoryContent category={activeTab} />
            <div className="mt-4 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>💡 Dica:</strong> Você pode usar URLs do Obsidian (obsidian://...) ou caminhos completos de arquivo
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
