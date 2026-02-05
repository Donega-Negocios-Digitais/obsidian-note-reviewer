/**
 * Annotation Export Component
 *
 * Displays annotations grouped by type with status badges and collapsible sections.
 * Provides a readable preview before sending to Claude Code.
 *
 * @example
 * ```tsx
 * <AnnotationExport annotations={annotations} />
 * ```
 */

import React, { useState } from 'react'
import { transformAnnotation, generateSummary } from '@obsidian-note-reviewer/ui/utils/claudeExport'
import type { Annotation } from '@obsidian-note-reviewer/ui/types'
import type { ClaudeAnnotation, ClaudeAnnotationType, ClaudeAnnotationStatus } from '@obsidian-note-reviewer/ui/types/claude'

export interface AnnotationExportProps {
  /** Annotations to display */
  annotations: Annotation[]
}

/**
 * Type labels in Portuguese with icons
 */
const TYPE_LABELS: Record<ClaudeAnnotationType, string> = {
  edit: '📝 Edições',
  comment_global: '💬 Comentários Globais',
  comment_individual: '💭 Comentários Individuais',
  deletion: '🗑️ Exclusões',
  highlight: '🎨 Destaques',
}

/**
 * Status labels with colors
 */
const STATUS_CONFIG: Record<ClaudeAnnotationStatus, { label: string; className: string }> = {
  open: { label: 'Aberto', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' },
  in_progress: { label: 'Em Progresso', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' },
  resolved: { label: 'Resolvido', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' },
}

/**
 * Groups annotations by type
 */
function groupByType(annotations: ClaudeAnnotation[]): Record<ClaudeAnnotationType, ClaudeAnnotation[]> {
  const groups: Record<ClaudeAnnotationType, ClaudeAnnotation[]> = {
    edit: [],
    comment_global: [],
    comment_individual: [],
    deletion: [],
    highlight: [],
  }

  for (const ann of annotations) {
    groups[ann.type].push(ann)
  }

  return groups
}

/**
 * Collapsible section component
 */
function CollapsibleSection({
  title,
  count,
  children,
  defaultOpen = true,
}: {
  title: string
  count: number
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between text-left"
      >
        <span className="font-medium text-sm">
          {title} <span className="text-muted-foreground">({count})</span>
        </span>
        <span className="text-muted-foreground">
          {isOpen ? '▼' : '▶'}
        </span>
      </button>
      {isOpen && (
        <div className="p-4 space-y-3">
          {children}
        </div>
      )}
    </div>
  )
}

/**
 * Single annotation display component
 */
function AnnotationItem({ annotation }: { annotation: ClaudeAnnotation }) {
  const [showRaw, setShowRaw] = useState(false)

  const statusBadge = annotation.status ? (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STATUS_CONFIG[annotation.status].className}`}>
      {STATUS_CONFIG[annotation.status].label}
    </span>
  ) : null

  if (showRaw) {
    return (
      <div className="p-3 bg-muted/50 rounded border space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-muted-foreground">JSON</span>
          <button
            type="button"
            onClick={() => setShowRaw(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Fechar
          </button>
        </div>
        <pre className="text-xs font-mono overflow-x-auto">
          {JSON.stringify(annotation, null, 2)}
        </pre>
      </div>
    )
  }

  return (
    <div className="p-3 bg-background border rounded-md space-y-2">
      {/* Header with type and status */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{annotation.type}</span>
        <div className="flex items-center gap-2">
          {statusBadge}
          <button
            type="button"
            onClick={() => setShowRaw(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            title="Ver JSON"
          >
            {'{}'}
          </button>
        </div>
      </div>

      {/* Author */}
      {annotation.author && (
        <div className="text-xs text-muted-foreground">
          Por: {annotation.author}
        </div>
      )}

      {/* Content based on type */}
      {annotation.originalText && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Original:</div>
          <div className="text-sm bg-muted/50 p-2 rounded font-mono">
            {annotation.originalText}
          </div>
        </div>
      )}

      {annotation.text && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Texto:</div>
          <div className="text-sm bg-muted/50 p-2 rounded font-mono">
            {annotation.text}
          </div>
        </div>
      )}

      {annotation.comment && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Comentário:</div>
          <div className="text-sm bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            {annotation.comment}
          </div>
        </div>
      )}

      {/* Line number if available */}
      {annotation.lineNumber && (
        <div className="text-xs text-muted-foreground">
          Linha: {annotation.lineNumber}
        </div>
      )}
    </div>
  )
}

export function AnnotationExport({ annotations }: AnnotationExportProps) {
  // Transform annotations to Claude format
  const claudeAnnotations: ClaudeAnnotation[] = annotations.map(transformAnnotation)

  // Group by type
  const grouped = groupByType(claudeAnnotations)

  // Generate summary
  const summary = generateSummary(claudeAnnotations)

  // Copy to clipboard function
  const handleCopyJson = () => {
    const data = JSON.stringify(claudeAnnotations, null, 2)
    navigator.clipboard.writeText(data).catch(() => {
      console.warn('Failed to copy to clipboard')
    })
  }

  // Type order for display
  const typeOrder: ClaudeAnnotationType[] = [
    'edit',
    'deletion',
    'comment_individual',
    'comment_global',
    'highlight',
  ]

  return (
    <div className="space-y-6">
      {/* Header with summary and copy button */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Anotações</h3>
          {claudeAnnotations.length > 0 && (
            <button
              type="button"
              onClick={handleCopyJson}
              className="text-xs px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Copiar JSON
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{summary}</p>
      </div>

      {/* No annotations state */}
      {claudeAnnotations.length === 0 && (
        <div className="p-8 text-center text-muted-foreground border rounded-md">
          Nenhuma anotação para exibir
        </div>
      )}

      {/* Grouped annotations by type */}
      {claudeAnnotations.length > 0 && (
        <div className="space-y-4">
          {typeOrder.map((type) => {
            const items = grouped[type]
            if (items.length === 0) return null

            return (
              <CollapsibleSection
                key={type}
                title={TYPE_LABELS[type]}
                count={items.length}
                defaultOpen={type === 'edit' || type === 'comment_individual'}
              >
                <div className="space-y-2">
                  {items.map((annotation, index) => (
                    <AnnotationItem
                      key={`${annotation.type}-${annotation.lineNumber || index}`}
                      annotation={annotation}
                    />
                  ))}
                </div>
              </CollapsibleSection>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default AnnotationExport
