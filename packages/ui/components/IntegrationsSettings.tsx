import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit, Check, AlertCircle, Power, Zap } from 'lucide-react';
import { getIntegrations, saveIntegrations, type IntegrationConfig } from '../utils/storage';

// Ícone customizado do Notion
const NotionIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="currentColor" d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z"/>
  </svg>
);

// Ícone customizado do Obsidian
const ObsidianIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path fill="currentColor" d="M19.355 18.538a68.967 68.959 0 0 0 1.858-2.954.81.81 0 0 0-.062-.9c-.516-.685-1.504-2.075-2.042-3.362-.553-1.321-.636-3.375-.64-4.377a1.707 1.707 0 0 0-.358-1.05l-3.198-4.064a3.744 3.744 0 0 1-.076.543c-.106.503-.307 1.004-.536 1.5-.134.29-.29.6-.446.914l-.31.626c-.516 1.068-.997 2.227-1.132 3.59-.124 1.26.046 2.73.815 4.481.128.011.257.025.386.044a6.363 6.363 0 0 1 3.326 1.505c.916.79 1.744 1.922 2.415 3.5zM8.199 22.569c.073.012.146.02.22.02.78.024 2.095.092 3.16.29.87.16 2.593.64 4.01 1.055 1.083.316 2.198-.548 2.355-1.664.114-.814.33-1.735.725-2.58l-.01.005c-.67-1.87-1.522-3.078-2.416-3.849a5.295 5.295 0 0 0-2.778-1.257c-1.54-.216-2.952.19-3.84.45.532 2.218.368 4.829-1.425 7.531zM5.533 9.938c-.023.1-.056.197-.098.29L2.82 16.059a1.602 1.602 0 0 0 .313 1.772l4.116 4.24c2.103-3.101 1.796-6.02.836-8.3-.728-1.73-1.832-3.081-2.55-3.831zM9.32 14.01c.615-.183 1.606-.465 2.745-.534-.683-1.725-.848-3.233-.716-4.577.154-1.552.7-2.847 1.235-3.95.113-.235.223-.454.328-.664.149-.297.288-.577.419-.86.217-.47.379-.885.46-1.27.08-.38.08-.72-.014-1.043-.095-.325-.297-.675-.68-1.06a1.6 1.6 0 0 0-1.475.36l-4.95 4.452a1.602 1.602 0 0 0-.513.952l-.427 2.83c.672.59 2.328 2.316 3.335 4.711.09.21.175.43.253.653z"/>
  </svg>
);

// Ícone customizado do WhatsApp
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

// Ícone customizado do Telegram
const TelegramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 11.944 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
  </svg>
);

interface Hook {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
}

interface IntegrationsSettingsProps {
  hooks?: Hook[];
  onTestConnection?: (type: IntegrationConfig['type'], target: string) => Promise<{ success: boolean; error?: string }>;
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

export const IntegrationsSettings: React.FC<IntegrationsSettingsProps> = ({ hooks = [], onTestConnection }) => {
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

  const testConnection = async (id: string) => {
    const integration = integrations.find(i => i.id === id);
    if (!integration?.config.target) {
      setTestStatus(prev => ({ ...prev, [id]: 'error' }));
      setTimeout(() => setTestStatus(prev => ({ ...prev, [id]: null })), 3000);
      return;
    }

    setTestStatus(prev => ({ ...prev, [id]: null }));

    if (onTestConnection) {
      try {
        const result = await onTestConnection(integration.type, integration.config.target);
        setTestStatus(prev => ({ ...prev, [id]: result.success ? 'success' : 'error' }));
      } catch {
        setTestStatus(prev => ({ ...prev, [id]: 'error' }));
      }
    } else {
      // Fallback: basic validation if no callback provided
      setTestStatus(prev => ({ ...prev, [id]: integration.config.target ? 'success' : 'error' }));
    }

    setTimeout(() => setTestStatus(prev => ({ ...prev, [id]: null })), 3000);
  };

  const getIntegrationIcon = (type: IntegrationConfig['type']) => {
    switch (type) {
      case 'whatsapp': return WhatsAppIcon;
      case 'telegram': return TelegramIcon;
      case 'notion': return NotionIcon;
      case 'obsidian': return ObsidianIcon;
      default: return Edit;
    }
  };

  const getIntegrationLabel = (type: IntegrationConfig['type']) => {
    switch (type) {
      case 'whatsapp': return t('settings.integrations.whatsapp');
      case 'telegram': return t('settings.integrations.telegram');
      case 'notion': return 'Notion';
      case 'obsidian': return 'Obsidian';
      default: return type;
    }
  };

  const getIntegrationDesc = (type: IntegrationConfig['type']) => {
    switch (type) {
      case 'whatsapp': return t('settings.integrations.whatsappDesc');
      case 'telegram': return t('settings.integrations.telegramDesc');
      case 'notion': return 'Exportar notas para o Notion';
      case 'obsidian': return 'Sincronizar com vault do Obsidian';
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
                    integration.type === 'whatsapp' ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
                    integration.type === 'telegram' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                    integration.type === 'notion' ? 'bg-gray-700/10 text-gray-700 dark:text-gray-300 dark:bg-gray-300/10' :
                    integration.type === 'obsidian' ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' :
                    'bg-blue-500/10 text-blue-600 dark:text-blue-400'
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
                  status === 'success' ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'
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
                className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/15 transition-colors rounded-md"
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
                    ? 'API Key'
                    : integrations.find(i => i.id === configuring)?.type === 'obsidian'
                    ? 'Vault Path'
                    : t('settings.integrations.chatId')}
                  <span className="text-red-500 ml-1">*</span>
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
                    ? 'Ex: secret_...'
                    : integrations.find(i => i.id === configuring)?.type === 'obsidian'
                    ? 'Ex: /Users/username/Documents/Vault'
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
