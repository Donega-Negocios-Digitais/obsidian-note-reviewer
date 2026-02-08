import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import * as LucideIcons from 'lucide-react';
import { getCustomCategories, getCustomTemplates, saveCustomTemplates, type CustomTemplate } from '../utils/storage';
import { getBuiltInCategories } from '../utils/notePaths';

interface NewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  onTemplateCreated,
  showSuccessToast,
}) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [icon, setIcon] = useState('FileText');
  const [templatePath, setTemplatePath] = useState('');
  const [destinationPath, setDestinationPath] = useState('');

  const builtInCategories = getBuiltInCategories();
  const customCategories = getCustomCategories();
  const allCategories = [...builtInCategories, ...customCategories];

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!name.trim() || !category || !destinationPath.trim()) return;

    const newTemplate: CustomTemplate = {
      id: `custom_${Date.now()}`,
      category,
      label: name.trim(),
      icon,
      templatePath: templatePath.trim(),
      destinationPath: destinationPath.trim(),
    };

    const existing = getCustomTemplates();
    saveCustomTemplates([...existing, newTemplate]);
    onTemplateCreated?.(newTemplate);

    // Show success feedback
    showSuccessToast?.(t('settings.newTemplate.created'));

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

  const isValid = name.trim() && category && destinationPath.trim();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div
        className="bg-card border border-border rounded-xl shadow-xl w-full max-w-md max-h-[85vh] flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{t('settings.newTemplate.title')}</h3>
            <p className="text-sm text-muted-foreground">{t('settings.newTemplate.subtitle')}</p>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md transition-colors"
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
              <option value="">{t('settings.newTemplate.selectCategory')}</option>
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

        {/* Footer */}
        <div className="flex gap-3 p-5 border-t border-border">
          <button
            onClick={resetAndClose}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors text-sm font-medium"
          >
            {t('settings.actions.cancel')}
          </button>
          <button
            onClick={handleCreate}
            disabled={!isValid}
            className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('settings.actions.create')}
          </button>
        </div>
      </div>
    </div>
  );
};
