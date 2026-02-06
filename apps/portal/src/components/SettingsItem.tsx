/**
 * Settings Item Component
 *
 * Individual setting items following Apple design patterns.
 */

import React from 'react';

export interface SettingsItemProps {
  title: string;
  description?: string;
  icon?: string;
  action?: React.ReactNode;
  onClick?: () => void;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Base settings item with title, description, and action
 */
export function SettingsItem({
  title,
  description,
  icon,
  action,
  onClick,
  children,
  className = '',
}: SettingsItemProps) {
  const content = (
    <div className="flex items-start gap-4 flex-1">
      {icon && (
        <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
      )}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        )}
        {children}
      </div>
      {action && (
        <div className="flex-shrink-0 ml-4">
          {action}
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`
        bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700
        ${onClick ? 'cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 transition-colors' : ''}
        ${className}
      `}
      onClick={onClick}
    >
      <div className="p-4">
        {content}
      </div>
    </div>
  );
}

/**
 * Toggle switch for boolean settings
 */
export interface SettingsToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  icon?: string;
}

export function SettingsToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
  icon,
}: SettingsToggleProps) {
  return (
    <SettingsItem
      title={label}
      description={description}
      icon={icon}
      action={
        <button
          onClick={() => onChange(!checked)}
          disabled={disabled}
          className={`
            relative inline-flex h-7 w-12 items-center rounded-full transition-colors
            ${checked ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          <span
            className={`
              inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform
              ${checked ? 'translate-x-6' : 'translate-x-1'}
            `}
          />
        </button>
      }
    />
  );
}

/**
 * Select dropdown for enum settings
 */
export interface SettingsSelectProps {
  label: string;
  description?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  icon?: string;
}

export function SettingsSelect({
  label,
  description,
  value,
  options,
  icon,
}: SettingsSelectProps) {
  return (
    <SettingsItem
      title={label}
      description={description}
      icon={icon}
      action={
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      }
    />
  );
}

/**
 * Text input for string settings
 */
export interface SettingsTextInputProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: 'text' | 'email' | 'password';
  icon?: string;
}

export function SettingsTextInput({
  label,
  description,
  value,
  onChange,
  placeholder,
  type = 'text',
  icon,
}: SettingsTextInputProps) {
  return (
    <SettingsItem
      title={label}
      description={description}
      icon={icon}
      action={
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="px-3 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 w-48"
        />
      }
    />
  );
}

/**
 * Settings section container
 */
export interface SettingsSectionProps {
  title?: string;
  children: React.ReactNode;
}

export function SettingsSection({ title, children }: SettingsSectionProps) {
  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          {title}
        </h3>
      )}
      <div className="space-y-3">
        {children}
      </div>
    </div>
  );
}

export default SettingsItem;
