/**
 * Claude Code export type definitions
 *
 * Enables exporting internal annotations to Claude Code format for review workflows.
 * Supports CLAU-03 (annotation transformation) and CLAU-06 (complete type coverage).
 */

/**
 * Annotation type codes used by Claude Code
 * Maps from internal AnnotationType enum values
 */
export enum ClaudeAnnotationType {
  /** Text edit (insertion or replacement) */
  EDIT = 'edit',
  /** Comment not tied to specific text (document-level) */
  COMMENT_GLOBAL = 'comment_global',
  /** Comment on specific text selection */
  COMMENT_INDIVIDUAL = 'comment_individual',
  /** Text deletion */
  DELETION = 'deletion',
  /** Text highlight for reference */
  HIGHLIGHT = 'highlight',
}

/**
 * Status of annotation resolution workflow
 */
export enum ClaudeAnnotationStatus {
  /** Open - no action taken */
  OPEN = 'open',
  /** In progress - being addressed */
  IN_PROGRESS = 'in_progress',
  /** Resolved - completed */
  RESOLVED = 'resolved',
}

/**
 * Single annotation in Claude Code format
 */
export interface ClaudeAnnotation {
  /** Type of annotation */
  type: ClaudeAnnotationType;
  /** Replacement text for edits */
  text?: string;
  /** Original text being modified */
  originalText?: string;
  /** Comment content for comment types */
  comment?: string;
  /** Resolution status */
  status?: ClaudeAnnotationStatus;
  /** Approximate line number reference */
  lineNumber?: number;
  /** Author identifier */
  author?: string;
}

/**
 * Complete export of annotations for Claude Code review
 */
export interface ClaudeAnnotationExport {
  /** Human-readable summary of changes */
  summary: string;
  /** All annotations transformed to Claude format */
  annotations: ClaudeAnnotation[];
  /** Total count of annotations */
  totalCount: number;
  /** Export metadata */
  metadata: {
    /** ISO timestamp of export */
    exportDate: string;
    /** Count of annotations by type */
    types: Record<ClaudeAnnotationType, number>;
  };
}
