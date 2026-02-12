/* eslint-disable security/detect-object-injection, @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as LucideIcons from 'lucide-react';
import { getCustomCategories, getCustomTemplates, saveCustomTemplates, type CustomTemplate } from '../utils/storage';
import { BaseModal } from './BaseModal';

interface NewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTemplate?: CustomTemplate | null;
  initialCategory?: string;
  onTemplateCreated?: (template: CustomTemplate) => void;
  showSuccessToast?: (message: string) => void;
}

const ICON_OPTIONS = [
  'FileText', 'File', 'Notebook', 'BookOpen', 'PenTool', 'Edit',
  'Video', 'Mic', 'Music', 'Camera', 'Image', 'Code',
  'GraduationCap', 'Briefcase', 'Lightbulb', 'Target', 'Rocket', 'Star',
];

function getLucideIcon(iconName: string): React.ComponentType<{ className?: string }> {
  const componentName = iconName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  const Icon = (LucideIcons as any)[componentName];
  return Icon || LucideIcons.Circle;
}

export const NewTemplateModal: React.FC<NewTemplateModalProps> = ({
  isOpen,
  onClose,
  initialTemplate,
  initialCategory,
  onTemplateCreated,
  showSuccessToast,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('FileText');
  const [templatePath, setTemplatePath] = useState('');
  const [destinationPath, setDestinationPath] = useState('');

  const customCategories = getCustomCategories();
  const allCategories = customCategories;

  useEffect(() => {
    if (!isOpen) return;

    if (initialTemplate) {
      setName(initialTemplate.label);
      setCategory(initialTemplate.category);
      setIcon(initialTemplate.icon || 'FileText');
      setTemplatePath(initialTemplate.templatePath || '');
      setDestinationPath(initialTemplate.destinationPath || '');
      return;
    }

    setName('');
    setCategory(initialCategory || '__sem_categoria__');
    setIcon('FileText');
    setTemplatePath('');
    setDestinationPath('');
  }, [isOpen, initialTemplate, initialCategory]);

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim() || !destinationPath.trim()) return;

    const baseTemplate: CustomTemplate = {
      id: initialTemplate?.id || `custom_${Date.now()}`,
      category: category || '__sem_categoria__',
      label: name.trim(),
      icon,
      templatePath: templatePath.trim(),
      destinationPath: destinationPath.trim(),
      isSeed: false,
      createdBy: 'user',
    };

    const existing = getCustomTemplates();
    const updatedTemplates = initialTemplate
      ? existing.map((template) => template.id === initialTemplate.id ? baseTemplate : template)
      : [...existing, baseTemplate];

    saveCustomTemplates(updatedTemplates);
    onTemplateCreated?.(baseTemplate);

    // Show success feedback
    showSuccessToast?.(initialTemplate ? 'Template atualizado com sucesso!' : t('settings.newTemplate.created'));

    resetAndClose();
  };

  const resetAndClose = () => {
    setName('');
    setCategory('');
    setIcon('FileText');
    setTemplatePath('');
    setDestinationPath('');
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onRequestClose={resetAndClose}
      closeOnBackdropClick={false}
      overlayClassName="z-[70]"
      contentClassName="bg-card border border-border rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div
        className="h-full flex flex-col"
        onKeyDown={(event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
            event.preventDefault();
            handleCreate();
          }
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('settings.newTemplate.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('settings.newTemplate.subtitle')}</p>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors rounded-md"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Template name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('settings.newTemplate.templateName')}
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('settings.newTemplate.templateNamePlaceholder')}
              className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
              autoFocus
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('settings.newTemplate.category')}
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm"
            >
              <option value="__sem_categoria__">Sem categoria</option>
              {allCategories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('settings.newTemplate.icon')}
            </label>
            <div className="grid grid-cols-9 gap-1">
              {ICON_OPTIONS.map(iconName => {
                const IconComp = getLucideIcon(iconName);
                return (
                  <button
                    key={iconName}
                    type="button"
                    onClick={() => setIcon(iconName)}
                    className={`p-2 rounded-lg transition-colors ${
                      icon === iconName
                        ? 'bg-primary/20 text-primary border border-primary/50'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted/50 border border-transparent'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Template file path */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('settings.newTemplate.templateFile')}
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground/60">
                {t('settings.paths.templateOptionalFull')}
              </span>
            </label>
            <input
              type="text"
              value={templatePath}
              onChange={e => setTemplatePath(e.target.value)}
              placeholder={t('settings.newTemplate.templateFilePlaceholder')}
              className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm font-mono"
            />
          </div>

          {/* Destination */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              {t('settings.newTemplate.destination')}
              <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500/80">
                {t('settings.paths.destinationRequiredFull')}
              </span>
            </label>
            <input
              type="text"
              value={destinationPath}
              onChange={e => setDestinationPath(e.target.value)}
              placeholder={t('settings.newTemplate.destinationPlaceholder')}
              className="w-full p-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm font-mono"
            />
          </div>
        </div>

        {/* Keyboard shortcuts hint */}
        <div className="px-5 pb-4 pt-2 border-t border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted/60 text-[10px] font-medium">Esc</kbd>
              <span>para cancelar</span>
            </span>
            <span className="mx-2 text-muted-foreground/40">|</span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-muted/60 text-[10px] font-medium">Ctrl+Enter</kbd>
              <span>para salvar</span>
            </span>
          </p>
        </div>
      </div>
    </BaseModal>
  );
};
