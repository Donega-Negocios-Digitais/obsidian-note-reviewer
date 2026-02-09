import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Send, Edit, Check, AlertCircle, Power, Zap, BookOpen, FileCode } from 'lucide-react';
import { getIntegrations, saveIntegrations, type IntegrationConfig } from '../utils/storage';

interface Hook {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
}

interface IntegrationsSettingsProps {
  hooks?: Hook[];
}

const DEFAULT_INTEGRATIONS: IntegrationConfig[] = [
  {
    id: 'whatsapp',
    type: 'whatsapp',
    enabled: false,
    config: {
      target: '',
      associatedHooks: [],
      customMessage: '',
      autoSendLink: false,
    },
  },
  {
    id: 'telegram',
    type: 'telegram',
    enabled: false,
    config: {
      target: '',
      associatedHooks: [],
      customMessage: '',
      autoSendLink: false,
    },
  },
  {
    id: 'notion',
    type: 'notion',
    enabled: false,
    config: {
      target: '',
      associatedHooks: [],
      customMessage: '',
      autoSendLink: false,
    },
  },
  {
    id: 'obsidian',
    type: 'obsidian',
    enabled: false,
    config: {
      target: '',
      associatedHooks: [],
      customMessage: '',
      autoSendLink: false,
    },
  },
];

export const IntegrationsSettings: React.FC<IntegrationsSettingsProps> = ({ hooks = [] }) => {
  const { t } = useTranslation();
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [configuring, setConfiguring] = useState<string | null>(null);
  const [configForm, setConfigForm] = useState<{
    target: string;
    associatedHooks: string[];
    customMessage: string;
    autoSendLink: boolean;
  }>({
    target: '',
    associatedHooks: [],
    customMessage: '',
    autoSendLink: false,
  });
  const [testStatus, setTestStatus] = useState<Record<string, 'success' | 'error' | null>>({});

  useEffect(() => {
    const saved = getIntegrations();
    if (saved.length > 0) {
      // Merge saved with defaults to ensure all integrations exist
      const merged = DEFAULT_INTEGRATIONS.map(def => {
        const existing = saved.find(s => s.id === def.id);
        return existing || def;
      });
      setIntegrations(merged);
    } else {
      setIntegrations(DEFAULT_INTEGRATIONS);
    }
  }, []);

  const toggleIntegration = (id: string) => {
    const updated = integrations.map(i =>
      i.id === id ? { ...i, enabled: !i.enabled } : i
    );
    setIntegrations(updated);
    saveIntegrations(updated);
  };

  const openConfig = (integration: IntegrationConfig) => {
    setConfiguring(integration.id);
    setConfigForm({
      target: integration.config.target || '',
      associatedHooks: integration.config.associatedHooks || [],
      customMessage: integration.config.customMessage || '',
      autoSendLink: integration.config.autoSendLink || false,
    });
  };

  const saveConfig = () => {
    if (!configuring) return;
    const updated = integrations.map(i =>
      i.id === configuring ? {
        ...i,
        config: {
          target: configForm.target,
          associatedHooks: configForm.associatedHooks,
          customMessage: configForm.customMessage,
          autoSendLink: configForm.autoSendLink,
        }
      } : i
    );
    setIntegrations(updated);
    saveIntegrations(updated);
    setConfiguring(null);
  };

  const testConnection = (id: string) => {
    setTestStatus(prev => ({ ...prev, [id]: null }));
    setTimeout(() => {
      const integration = integrations.find(i => i.id === id);
      if (integration?.config.target) {
        setTestStatus(prev => ({ ...prev, [id]: 'success' }));
      } else {
        setTestStatus(prev => ({ ...prev, [id]: 'error' }));
      }
      setTimeout(() => {
        setTestStatus(prev => ({ ...prev, [id]: null }));
      }, 3000);
    }, 500);
  };

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'whatsapp': return MessageCircle;
      case 'telegram': return Send;
      case 'notion': return BookOpen;
      case 'obsidian': return FileCode;
      default: return Edit;
    }
  };

  const getIntegrationLabel = (type: string) => {
    switch (type) {
      case 'whatsapp': return t('settings.integrations.whatsapp');
      case 'telegram': return t('settings.integrations.telegram');
      case 'notion': return 'Notion';
      case 'obsidian': return 'Obsidian';
      default: return type;
    }
  };

  const getIntegrationDesc = (type: string) => {
    switch (type) {
      case 'whatsapp': return t('settings.integrations.whatsappDesc');
      case 'telegram': return t('settings.integrations.telegramDesc');
      case 'notion': return 'Sincronize notas e documentos com o Notion';
      case 'obsidian': return 'Integração direta com seu vault do Obsidian';
      default: return '';
    }
  };

  return (
    <div className="p-5 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="mb-3">
        <h4 className="text-base font-semibold text-foreground">{t('settings.integrations.title')}</h4>
        <p className="text-sm text-muted-foreground/90">{t('settings.integrations.subtitle')}</p>
      </div>

      {/* Integration cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map(integration => {
          const Icon = getIntegrationIcon(integration.type);
          const status = testStatus[integration.id];

          return (
            <div
              key={integration.id}
              className={`bg-card/50 rounded-xl border p-4 transition-all flex flex-col ${
                integration.enabled
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border/50 bg-muted/30'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    integration.type === 'whatsapp' ? 'bg-green-500/10 text-green-500' :
                    integration.type === 'telegram' ? 'bg-blue-500/10 text-blue-500' :
                    integration.type === 'notion' ? 'bg-gray-800/10 text-gray-800 dark:text-gray-200' :
                    integration.type === 'obsidian' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-blue-500/10 text-blue-500'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {getIntegrationLabel(integration.type)}
                  </h3>
                </div>
                {integration.enabled ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 flex-shrink-0">
                    {t('settings.integrations.enabled')}
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-600 dark:text-gray-400 flex-shrink-0">
                    {t('settings.integrations.disabled')}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground mb-3 flex-1">
                {getIntegrationDesc(integration.type)}
              </p>

              {/* Target preview */}
              {integration.config.target && (
                <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md mb-3">
                  <code className="text-[10px] font-mono text-muted-foreground truncate">
                    {integration.config.target}
                  </code>
                </div>
              )}

              {/* Test status */}
              {status && (
                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md mb-3 text-xs ${
                  status === 'success' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'
                }`}>
                  {status === 'success' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                  {status === 'success' ? t('settings.integrations.testSuccess') : t('settings.integrations.testError')}
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                <div className="text-xs text-muted-foreground"></div>

                <div className="flex items-center gap-1">
                  {/* Power Button - Activate/Deactivate */}
                  <button
                    onClick={() => toggleIntegration(integration.id)}
                    className={`p-1.5 rounded-md transition-colors ${
                      integration.enabled
                        ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                        : 'text-green-600 hover:text-green-700 hover:bg-green-500/10'
                    }`}
                    title={integration.enabled ? t('settings.collaboration.deactivate') : t('settings.collaboration.activate')}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => testConnection(integration.id)}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                    title={t('settings.actions.test')}
                  >
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => openConfig(integration)}
                    title={t('settings.integrations.configure')}
                    aria-label={t('settings.integrations.configure')}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Configuration Modal */}
      {configuring && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div
            className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md p-6 animate-in fade-in slide-in-from-bottom-4 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                {t('settings.integrations.configure')} — {getIntegrationLabel(integrations.find(i => i.id === configuring)?.type || '')}
              </h3>
              <button
                onClick={() => setConfiguring(null)}
                className="p-1 text-muted-foreground hover:text-foreground rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <div className="space-y-4">
              {/* Target (phone or chat ID) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {integrations.find(i => i.id === configuring)?.type === 'whatsapp'
                    ? t('settings.integrations.phoneNumber')
                    : integrations.find(i => i.id === configuring)?.type === 'telegram'
                    ? t('settings.integrations.chatId')
                    : integrations.find(i => i.id === configuring)?.type === 'notion'
                    ? 'API Key ou Token'
                    : integrations.find(i => i.id === configuring)?.type === 'obsidian'
                    ? 'Caminho do Vault'
                    : t('settings.integrations.chatId')}
                </label>
                <input
                  type="text"
                  value={configForm.target}
                  onChange={e => setConfigForm({ ...configForm, target: e.target.value })}
                  placeholder={integrations.find(i => i.id === configuring)?.type === 'whatsapp'
                    ? t('settings.integrations.phoneNumberPlaceholder')
                    : integrations.find(i => i.id === configuring)?.type === 'telegram'
                    ? t('settings.integrations.chatIdPlaceholder')
                    : integrations.find(i => i.id === configuring)?.type === 'notion'
                    ? 'secret_xxxxxxxx'
                    : integrations.find(i => i.id === configuring)?.type === 'obsidian'
                    ? 'C:/Users/SeuUsuario/Documents/ObsidianVault'
                    : t('settings.integrations.chatIdPlaceholder')}
                  className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
                />
              </div>

              {/* Associated hooks */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('settings.integrations.associatedHook')} (múltiplos)
                </label>
                <div className="space-y-2 max-h-32 overflow-y-auto border border-border rounded-lg p-2 bg-background">
                  {hooks.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">
                      Nenhum hook disponível
                    </p>
                  ) : (
                    hooks.map(hook => (
                      <label
                        key={hook.id}
                        className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={configForm.associatedHooks.includes(hook.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setConfigForm({
                                ...configForm,
                                associatedHooks: [...configForm.associatedHooks, hook.id]
                              });
                            } else {
                              setConfigForm({
                                ...configForm,
                                associatedHooks: configForm.associatedHooks.filter(h => h !== hook.id)
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                        />
                        <span className="text-sm text-foreground">{hook.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Custom message */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  {t('settings.integrations.customMessage')}
                </label>
                <div className="relative">
                  <textarea
                    ref={el => {
                      if (el && configuring && !document.querySelector(`[data-textarea-ref="${configuring}"]`)) {
                        el.dataset.textareaRef = configuring;
                      }
                    }}
                    value={configForm.customMessage}
                    onChange={e => setConfigForm({ ...configForm, customMessage: e.target.value })}
                    placeholder={t('settings.integrations.customMessagePlaceholder')}
                    rows={3}
                    className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm resize-none"
                  />
                </div>
                {/* Variable tags */}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="text-xs text-muted-foreground/70 mr-1 self-center">
                    {t('settings.integrations.customMessageVariables')}:
                  </span>
                  {[
                    { key: '{emoji}', label: t('settings.integrations.variableEmoji') },
                    { key: '{titulo}', label: t('settings.integrations.variableTitle') },
                    { key: '{tipo}', label: t('settings.integrations.variableType') },
                    { key: '{link}', label: t('settings.integrations.variableLink') },
                    { key: '{timestamp}', label: t('settings.integrations.variableTimestamp') },
                  ].map(variable => (
                    <button
                      key={variable.key}
                      onClick={() => {
                        const textarea = document.querySelector(`[data-textarea-ref="${configuring}"]`) as HTMLTextAreaElement;
                        if (textarea) {
                          const start = textarea.selectionStart;
                          const end = textarea.selectionEnd;
                          const text = configForm.customMessage;
                          const before = text.substring(0, start);
                          const after = text.substring(end);
                          const newText = before + variable.key + after;
                          setConfigForm({ ...configForm, customMessage: newText });
                          // Set cursor position after inserted variable
                          setTimeout(() => {
                            textarea.focus();
                            textarea.setSelectionRange(start + variable.key.length, start + variable.key.length);
                          }, 0);
                        }
                      }}
                      className="px-2 py-0.5 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer border border-primary/20"
                      title={variable.key}
                    >
                      {variable.key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto send link */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={configForm.autoSendLink}
                  onChange={e => setConfigForm({ ...configForm, autoSendLink: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                />
                <span className="text-sm text-foreground">
                  {t('settings.integrations.autoSendLink')}
                </span>
              </label>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfiguring(null)}
                className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
              >
                {t('settings.actions.cancel')}
              </button>
              <button
                onClick={saveConfig}
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium"
              >
                {t('settings.actions.save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
