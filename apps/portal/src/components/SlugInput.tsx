/**
 * Slug Input Component
 *
 * Input field for entering document slug with validation.
 */

import React, { useState, useEffect } from 'react';
import { generateSlug, validateSlug } from '../hooks/useSlugRouting';

export interface SlugInputProps {
  value: string;
  onChange: (slug: string) => void;
  title: string;
  existingSlugs?: string[];
  readOnly?: boolean;
  autoFocus?: boolean;
}

export function SlugInput({
  value,
  onChange,
  title,
  existingSlugs = [],
  readOnly = false,
  autoFocus = false,
}: SlugInputProps) {
  const [validation, setValidation] = useState<{
    isValid: boolean;
    isAvailable: boolean;
    error?: string;
  }>({ isValid: true, isAvailable: true });

  const [touched, setTouched] = useState(false);

  // Validate when value changes
  useEffect(() => {
    if (!value) {
      setValidation({ isValid: true, isAvailable: true });
      return;
    }

    const result = validateSlug(value, existingSlugs);
    setValidation(result);
  }, [value, existingSlugs]);

  // Auto-generate from title on mount
  useEffect(() => {
    if (!value && title && !readOnly) {
      const generated = generateSlug(title);
      onChange(generated);
    }
  }, [title, value, onChange, readOnly]);

  const getStatusColor = () => {
    if (!value || !touched) return 'gray';
    if (!validation.isValid) return 'red';
    if (!validation.isAvailable) return 'orange';
    return 'green';
  };

  const statusColor = getStatusColor();

  return (
    <div className="slug-input">
      <div className="flex items-center gap-2 mb-2">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Link personalizado
        </label>
        {validation.error && touched && (
          <span className="text-xs text-red-600 dark:text-red-400">
            {validation.error}
          </span>
        )}
        {validation.isAvailable && value && touched && (
          <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Disponível
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="text-gray-500 dark:text-gray-400 text-sm">
          r.alexdonega.com.br/shared/
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setTouched(true)}
          readOnly={readOnly}
          autoFocus={autoFocus}
          placeholder={readOnly ? '' : 'gerado-automaticamente'}
          className={`
            flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900
            border border-gray-300 dark:border-gray-600 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${readOnly ? 'cursor-not-allowed opacity-70' : ''}
            ${!validation.isValid && touched ? 'border-red-500' : ''}
            ${validation.isAvailable && value && touched ? 'border-green-500' : ''}
          `}
        />
      </div>

      {value && (
        <div className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
            Link completo:
          </p>
          <code className="text-xs text-gray-900 dark:text-gray-100 break-all">
            r.alexdonega.com.br/shared/{value}
          </code>
        </div>
      )}
    </div>
  );
}

export default SlugInput;
