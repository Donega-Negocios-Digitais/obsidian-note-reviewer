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

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { generateSummary, formatForPrompt, exportForClaude } from '@obsidian-note-reviewer/ui/utils/claudeExport'
import type { ClaudeAnnotation, ClaudeAnnotationExport } from '@obsidian-note-reviewer/ui/types/claude'
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
  /** Optional callback when prompt is sent successfully */
  onSendSuccess?: () => void
  /** Optional callback when send fails */
  onSendError?: (error: Error) => void
  /** Optional callback for close action (Escape key) */
  onClose?: () => void
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

export function PromptEditor({ annotations, onTemplateChange, onSendSuccess, onSendError, onClose }: PromptEditorProps) {
  // Load custom template from localStorage on mount
  const [template, setTemplate] = useState(DEFAULT_PROMPT)
  const [isCustom, setIsCustom] = useState(false)

  // Send functionality state
  const [isSending, setIsSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  })

  // Auto-hide status messages after 5 seconds
  useEffect(() => {
    if (sendStatus.type) {
      const timer = setTimeout(() => {
        setSendStatus({ type: null, message: '' })
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [sendStatus])

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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Escape - Close/dismiss (if onClose provided)
      if (event.key === 'Escape' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        // Don't trigger if user is typing in textarea
        const target = event.target as HTMLElement
        if (target.tagName !== 'TEXTAREA' && target.tagName !== 'INPUT') {
          onClose?.()
        }
        return
      }

      // Check for Ctrl/Cmd modifier for other shortcuts
      const isModKey = event.ctrlKey || event.metaKey
      if (!isModKey) return

      // Don't trigger most shortcuts if user is typing in textarea
      const target = event.target as HTMLElement
      const isTyping = target.tagName === 'TEXTAREA' || target.tagName === 'INPUT'

      // Allow Ctrl+Enter even in textarea for send
      if (event.key === 'Enter') {
        event.preventDefault()
        handleSend()
        return
      }

      // Other shortcuts only work when not typing
      if (isTyping) return

      // Ctrl/Cmd + R - Reset template
      if (event.key === 'r' || event.key === 'R') {
        event.preventDefault()
        handleReset()
      }
    }

    // Add event listener
    window.addEventListener('keydown', handleKeyDown)

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleSend, handleReset, onClose])

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

  const handleReset = useCallback(() => {
    setTemplate(DEFAULT_PROMPT)
    setIsCustom(false)

    // Clear from localStorage
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to remove template from localStorage:', error)
    }

    onTemplateChange?.(DEFAULT_PROMPT)
  }, [onTemplateChange])

  /**
   * Validate that prompt is not empty and contains required content
   */
  const validatePrompt = useCallback((): { valid: boolean; error?: string } => {
    // Check if there are annotations
    if (claudeAnnotations.length === 0) {
      return { valid: false, error: 'Não há anotações para enviar' }
    }

    // Check if formatted prompt has meaningful content
    const trimmedPrompt = formattedPrompt.trim()
    if (!trimmedPrompt || trimmedPrompt === '<Sem anotações para preview>') {
      return { valid: false, error: 'Prompt vazio ou sem conteúdo válido' }
    }

    // Check minimum length
    if (trimmedPrompt.length < 20) {
      return { valid: false, error: 'Prompt muito curto, verifique o template' }
    }

    return { valid: true }
  }, [claudeAnnotations, formattedPrompt])

  /**
   * Handle sending prompt to Claude Code
   */
  const handleSend = useCallback(async () => {
    // Validate prompt before sending
    const validation = validatePrompt()
    if (!validation.valid) {
      setSendStatus({ type: 'error', message: validation.error || 'Validação falhou' })
      onSendError?.(new Error(validation.error))
      return
    }

    setIsSending(true)
    setSendStatus({ type: null, message: '' })

    try {
      // Prepare the request body
      const exportData: ClaudeAnnotationExport = exportForClaude(annotations)

      // VALIDATION LOGGING: Log annotation counts by type before sending
      console.log('[PromptEditor] Sending annotations to Claude Code:')
      console.log(`  Total count: ${exportData.totalCount}`)
      console.log('  Types breakdown:', exportData.metadata.types)
      console.log('  Coverage:', exportData.metadata.coverage)

      // Assert count matches (catch filtering bugs)
      if (exportData.totalCount !== annotations.length) {
        console.warn(
          `[PromptEditor] WARNING: totalCount (${exportData.totalCount}) != input array length (${annotations.length})`
        )
      }

      const requestBody = {
        prompt: formattedPrompt,
        annotations: exportData,
      }

      // Make API call to send annotations endpoint
      const response = await fetch('/api/send-annotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
        throw new Error(errorData.error || `Erro no servidor: ${response.status}`)
      }

      const result = await response.json()

      // Show success message
      setSendStatus({
        type: 'success',
        message: result.message || 'Prompt enviado com sucesso!',
      })

      // Trigger success callback
      onSendSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao enviar prompt'
      console.error('Error sending prompt:', error)

      setSendStatus({
        type: 'error',
        message: errorMessage,
      })

      // Trigger error callback
      onSendError?.(error instanceof Error ? error : new Error(errorMessage))
    } finally {
      setIsSending(false)
    }
  }, [annotations, formattedPrompt, validatePrompt, onSendSuccess, onSendError])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Modelo de Prompt</h3>
          <div className="text-xs text-muted-foreground space-x-3">
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted border rounded">Ctrl</kbd> +{' '}
              <kbd className="px-1.5 py-0.5 bg-muted border rounded">Enter</kbd> para enviar
            </span>
            <span>
              <kbd className="px-1.5 py-0.5 bg-muted border rounded">Ctrl</kbd> +{' '}
              <kbd className="px-1.5 py-0.5 bg-muted border rounded">R</kbd> para resetar
            </span>
            {onClose && (
              <span>
                <kbd className="px-1.5 py-0.5 bg-muted border rounded">Esc</kbd> para fechar
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Personalize o template usado para gerar o prompt para Claude Code.
          Use {'{summary}'}, {'{annotations}'}, e {'{totalCount}'} como placeholders.
        </p>
      </div>

      {/* Status Messages */}
      {sendStatus.type && (
        <div
          className={`p-4 rounded-md border ${
            sendStatus.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300'
              : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-start gap-2">
            <span>{sendStatus.type === 'success' ? '✓' : '✕'}</span>
            <p className="text-sm font-medium">{sendStatus.message}</p>
          </div>
        </div>
      )}

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

      {/* Send Button */}
      <div className="flex items-center gap-4 pt-2">
        <button
          type="button"
          onClick={handleSend}
          disabled={isSending || claudeAnnotations.length === 0}
          className={`px-6 py-2.5 rounded-md font-medium text-sm transition-all ${
            isSending || claudeAnnotations.length === 0
              ? 'bg-muted text-muted-foreground cursor-not-allowed'
              : 'bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]'
          }`}
        >
          {isSending ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            'Enviar para Claude Code'
          )}
        </button>
        <div className="text-xs text-muted-foreground">
          {claudeAnnotations.length} anotaç{claudeAnnotations.length === 1 ? 'ão' : 'ões'} selecionada
          {claudeAnnotations.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}

export default PromptEditor
