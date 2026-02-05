/**
 * Prompt Editor Component
 *
 * Provides an editable prompt template for Claude Code integration.
 * Supports variable substitution with {summary}, {annotations}, and {totalCount} placeholders.
 * Custom templates persist to localStorage for user convenience.
 *
 * @example
 * ```tsx
 * <PromptEditor annotations={annotations} />
 * ```
 */

import React, { useState, useEffect, useMemo } from 'react'
import { generateSummary, formatForPrompt, exportForClaude } from '@obsidian-note-reviewer/ui/utils/claudeExport'
import type { ClaudeAnnotation } from '@obsidian-note-reviewer/ui/types/claude'
import type { Annotation } from '@obsidian-note-reviewer/ui/types'

const STORAGE_KEY = 'obsreview-prompt-template'

/**
 * Default Portuguese prompt template with variable placeholders
 */
const DEFAULT_PROMPT = `Aqui estão as revisões do plano:

{summary}

## Anotações Detalhadas

{annotations}

Total: {totalCount} anotações.

Por favor, revise e implemente estas mudanças.`

export interface PromptEditorProps {
  /** Annotations to include in the prompt */
  annotations: Annotation[]
  /** Optional callback when template changes */
  onTemplateChange?: (template: string) => void
}

/**
 * Formats a template by replacing placeholders with actual values
 */
function formatPrompt(template: string, annotations: ClaudeAnnotation[]): string {
  const summary = generateSummary(annotations)
  const formattedAnnotations = formatForPrompt({
    annotations,
    totalCount: annotations.length,
    summary,
  })

  return template
    .replace('{summary}', summary)
    .replace('{annotations}', formattedAnnotations)
    .replace('{totalCount}', String(annotations.length))
}

/**
 * Validates that required placeholders exist in template
 */
function validatePlaceholders(template: string): { valid: boolean; missing: string[] } {
  const required = ['{summary}', '{annotations}', '{totalCount}']
  const missing = required.filter(p => !template.includes(p))

  return {
    valid: missing.length === 0,
    missing,
  }
}

export function PromptEditor({ annotations, onTemplateChange }: PromptEditorProps) {
  // Load custom template from localStorage on mount
  const [template, setTemplate] = useState(DEFAULT_PROMPT)
  const [isCustom, setIsCustom] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        setTemplate(saved)
        setIsCustom(true)
      }
    } catch (error) {
      // localStorage may be disabled
      console.warn('Failed to load template from localStorage:', error)
    }
  }, [])

  // Transform annotations for Claude format
  const claudeAnnotations = useMemo(() => {
    return exportForClaude(annotations).annotations
  }, [annotations])

  // Format the prompt with current annotations
  const formattedPrompt = useMemo(() => {
    return formatPrompt(template, claudeAnnotations)
  }, [template, claudeAnnotations])

  // Validate placeholders
  const validation = useMemo(() => {
    return validatePlaceholders(template)
  }, [template])

  const handleTemplateChange = (value: string) => {
    setTemplate(value)
    setIsCustom(value !== DEFAULT_PROMPT)

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, value)
    } catch (error) {
      console.warn('Failed to save template to localStorage:', error)
    }

    onTemplateChange?.(value)
  }

  const handleReset = () => {
    setTemplate(DEFAULT_PROMPT)
    setIsCustom(false)

    // Clear from localStorage
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to remove template from localStorage:', error)
    }

    onTemplateChange?.(DEFAULT_PROMPT)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Modelo de Prompt</h3>
        <p className="text-sm text-muted-foreground">
          Personalize o template usado para gerar o prompt para Claude Code.
          Use {'{summary}'}, {'{annotations}'}, e {'{totalCount}'} como placeholders.
        </p>
      </div>

      {/* Template Editor */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Template</label>
          {isCustom && (
            <button
              type="button"
              onClick={handleReset}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Restaurar padrão
            </button>
          )}
        </div>
        <textarea
          value={template}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full min-h-[150px] p-3 text-sm font-mono border rounded-md bg-background resize-y focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder={DEFAULT_PROMPT}
        />
      </div>

      {/* Validation Warning */}
      {!validation.valid && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">
            Placeholders ausentes: {validation.missing.join(', ')}
          </p>
        </div>
      )}

      {/* Preview */}
      <div className="space-y-3">
        <label className="text-sm font-medium">Preview</label>
        <div className="p-4 bg-muted rounded-md border">
          <pre className="text-xs font-mono whitespace-pre-wrap break-words">
            {formattedPrompt || '<Sem anotações para preview>'}
          </pre>
        </div>
      </div>
    </div>
  )
}

export default PromptEditor
