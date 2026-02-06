/**
 * Prompt Template Editor Component
 *
 * Editor for customizing Claude Code prompt template.
 */

import React, { useState, useCallback, useMemo } from 'react';

export interface TemplateVariable {
  name: string;
  description: string;
  example: string;
}

export interface PromptTemplateEditorProps {
  template: string;
  onChange: (template: string) => void;
  variables?: TemplateVariable[];
  onSave?: () => void;
  readOnly?: boolean;
}

const DEFAULT_VARIABLES: TemplateVariable[] = [
  { name: '{{content}}', description: 'Conteúdo do documento', example: 'Markdown content...' },
  { name: '{{annotations}}', description: 'Anotações atuais', example: '- Issue on line 5' },
  { name: '{{title}}', description: 'Título do documento', example: 'My Document.md' },
  { name: '{{context}}', description: 'Contexto adicional', example: 'Project notes' },
];

/**
 * Render template with sample values for preview
 */
function renderPreview(template: string, variables: TemplateVariable[]): string {
  let preview = template;

  variables.forEach((variable) => {
    preview = preview.replace(new RegExp(variable.name, 'g'), variable.example);
  });

  return preview;
}

/**
 * Prompt template editor with variable suggestions
 */
export function PromptTemplateEditor({
  template,
  onChange,
  variables = DEFAULT_VARIABLES,
  onSave,
  readOnly = false,
}: PromptTemplateEditorProps) {
  const [showVariables, setShowVariables] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);

  // Calculate line count
  const lineCount = template.split('\n').length;

  // Render preview
  const preview = useMemo(() => renderPreview(template, variables), [template, variables]);

  /**
   * Insert variable at cursor position
   */
  const insertVariable = useCallback((variable: string) => {
    const before = template.substring(0, cursorPosition);
    const after = template.substring(cursorPosition);
    onChange(before + variable + after);
    setShowVariables(false);
  }, [template, cursorPosition, onChange]);

  /**
   * Handle textarea input and track cursor
   */
  const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    setCursorPosition(e.target.selectionStart);
  }, [onChange]);

  return (
    <div className="prompt-template-editor space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Template do Prompt
          </label>
          <button
            onClick={() => setShowVariables(!showVariables)}
            className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-700 dark:text-gray-300 transition-colors"
          >
            {showVariables ? 'Ocultar' : 'Variáveis'}
          </button>
        </div>
        {onSave && (
          <button
            onClick={onSave}
            className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Salvar
          </button>
        )}
      </div>

      {/* Variable suggestions */}
      {showVariables && (
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs font-medium text-blue-800 dark:text-blue-300 mb-2">
            Clique para inserir variável:
          </p>
          <div className="flex flex-wrap gap-2">
            {variables.map((variable) => (
              <button
                key={variable.name}
                onClick={() => insertVariable(variable.name)}
                className="px-2 py-1 text-xs bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-700 rounded text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                title={variable.description}
              >
                {variable.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="relative">
        <textarea
          value={template}
          onChange={handleInput}
          onSelect={(e) => setCursorPosition(e.target.selectionStart)}
          readOnly={readOnly}
          rows={Math.max(lineCount, 8)}
          className={`
            w-full px-4 py-3 font-mono text-sm bg-gray-50 dark:bg-gray-900
            border border-gray-300 dark:border-gray-600 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-transparent
            ${readOnly ? 'cursor-not-allowed opacity-70' : ''}
          `}
          placeholder="Digite seu template de prompt aqui..."
        />
      </div>

      {/* Variable reference */}
      <div className="text-xs text-gray-500 dark:text-gray-400">
        <p className="font-medium mb-1">Variáveis disponíveis:</p>
        <ul className="space-y-1">
          {variables.map((variable) => (
            <li key={variable.name}>
              <code className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                {variable.name}
              </code>
              <span className="ml-1">- {variable.description}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Preview */}
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Preview:
        </p>
        <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans">
            {preview || '(seu template aparecerá aqui)'}
          </pre>
        </div>
      </div>
    </div>
  );
}

/**
 * Compact prompt template viewer
 */
export interface PromptTemplateViewerProps {
  template: string;
  onEdit?: () => void;
}

export function PromptTemplateViewer({ template, onEdit }: PromptTemplateViewerProps) {
  const preview = useMemo(() => renderPreview(template, DEFAULT_VARIABLES), [template]);

  return (
    <div className="prompt-template-viewer">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Template Atual
        </h4>
        {onEdit && (
          <button
            onClick={onEdit}
            className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
          >
            Editar
          </button>
        )}
      </div>
      <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-sans max-h-32 overflow-auto">
          {template}
        </pre>
      </div>
    </div>
  );
}

export default PromptTemplateEditor;
