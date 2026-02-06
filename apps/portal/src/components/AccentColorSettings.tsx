/**
 * Accent Color Settings Component
 *
 * UI for selecting and customizing accent colors.
 */

import React from 'react';
import { useTheme } from '@obsidian-note-reviewer/ui/hooks/useTheme';
import { accentColors } from '@obsidian-note-reviewer/ui/theme/tokens';
import { cn } from '@obsidian-note-reviewer/ui/lib/utils';

export interface AccentColorSettingsProps {
  className?: string;
}

export function AccentColorSettings({ className }: AccentColorSettingsProps) {
  const { accentColor, setAccentColor } = useTheme();
  const [isCustom, setIsCustom] = React.useState(!accentColors.find(c => c.value === accentColor));

  const handleColorSelect = (color: string) => {
    setAccentColor(color);
    setIsCustom(!accentColors.find(c => c.value === color));
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Preset colors */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Cor de destaque
        </h4>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {accentColors.map((color) => (
            <button
              key={color.value}
              onClick={() => handleColorSelect(color.value)}
              className={cn(
                'w-10 h-10 rounded-full transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900',
                accentColor === color.value && 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-gray-900'
              )}
              style={{
                backgroundColor: color.value,
                ringColor: accentColor === color.value ? color.value : undefined,
              }}
              title={color.name}
              aria-label={`Selecionar cor ${color.name}`}
            />
          ))}
        </div>
      </div>

      {/* Custom color picker */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Cor personalizada
        </h4>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={accentColor}
            onChange={(e) => handleColorSelect(e.target.value)}
            className={cn(
              'w-12 h-12 rounded-lg cursor-pointer border-2',
              'border-gray-300 dark:border-gray-600',
              'hover:border-gray-400 dark:hover:border-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500'
            )}
            aria-label="Selecionar cor personalizada"
          />
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              Cor hexadecimal
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {accentColor.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Pré-visualização
        </p>
        <div className="flex gap-2">
          <button
            className="px-4 py-2 text-sm font-medium text-white rounded-lg"
            style={{ backgroundColor: accentColor }}
          >
            Primário
          </button>
          <button
            className="px-4 py-2 text-sm font-medium rounded-lg border-2"
            style={{
              borderColor: accentColor,
              color: accentColor,
            }}
          >
            Secundário
          </button>
          <div
            className="px-4 py-2 text-sm font-medium rounded-full text-white"
            style={{ backgroundColor: accentColor }}
          >
            Badge
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact color selector for settings sidebar
 */
export interface AccentColorSelectorProps {
  onChange?: (color: string) => void;
  className?: string;
}

export function AccentColorSelector({ onChange, className }: AccentColorSelectorProps) {
  const { accentColor, setAccentColor } = useTheme();

  const handleChange = (color: string) => {
    setAccentColor(color);
    onChange?.(color);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="text-sm text-gray-600 dark:text-gray-400">
                Cor:
              </span>
      <div className="flex gap-1">
        {accentColors.slice(0, 6).map((color) => (
          <button
            key={color.value}
            onClick={() => handleChange(color.value)}
            className={cn(
              'w-6 h-6 rounded-full transition-transform hover:scale-110',
              accentColor === color.value && 'ring-1 ring-offset-1 ring-offset-white dark:ring-offset-gray-900'
            )}
            style={{
              backgroundColor: color.value,
              ringColor: accentColor === color.value ? color.value : undefined,
            }}
            title={color.name}
            aria-label={`Selecionar ${color.name}`}
          />
        ))}
      </div>
    </div>
  );
}

export default AccentColorSettings;
