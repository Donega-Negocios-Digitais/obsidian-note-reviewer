/**
 * AI Package Types
 *
 * Type definitions for AI-powered features including
 * suggestions, summarization, and vault context understanding.
 */

import type { Annotation } from '@obsidian-note-reviewer/ui/types';

// ============================================
// AI Suggestion Types (04-01)
// ============================================

export interface AISuggestion {
  id: string;
  type: 'deletion' | 'replacement' | 'comment';
  confidence: number; // 0-1
  reason: string; // Why AI suggested this
  targetText: string;
  suggestedText?: string; // For replacements
  lineStart?: number;
  lineEnd?: number;
}

export interface SuggestionConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  maxSuggestions: number;
  suggestionTypes: Array<'deletion' | 'replacement' | 'comment'>;
  apiKey?: string;
}

export interface SuggestionResult {
  suggestions: AISuggestion[];
  model: string;
  tokensUsed: number;
}

// ============================================
// Vault Context Types (04-02)
// ============================================

export interface ObsidianNote {
  path: string;
  title: string;
  content: string;
  tags: string[];
  frontmatter: Record<string, any>;
  links: InternalLink[];
  backlinks: InternalLink[];
  created: Date;
  modified: Date;
}

export interface InternalLink {
  target: string; // Note path or [[alias]]
  type: 'wiki' | 'markdown' | 'embed';
  position?: { line: number; col: number };
}

export interface GraphNode {
  id: string; // Note path
  label: string; // Note title
  connections: number; // Number of links
  cluster?: string; // For grouped nodes
}

export interface GraphEdge {
  source: string; // From note path
  target: string; // To note path
  type: 'link' | 'backlink' | 'embed';
}

export interface VaultGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters?: Record<string, string[]>; // Grouped nodes
}

export interface DataviewQuery {
  type: 'TABLE' | 'LIST' | 'TASK' | 'CALENDAR';
  query: string;
  fields: string[];
  filters: DataviewFilter[];
  sort?: DataviewSort[];
}

export interface DataviewFilter {
  field: string;
  operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'and' | 'or';
  value: any;
}

export interface DataviewSort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DataviewResult {
  rows: Record<string, any>[];
  metadata: {
    totalRows: number;
    queryTime: number;
  };
}

export interface VaultContext {
  currentNote: ObsidianNote;
  backlinks: ObsidianNote[];
  forwardLinks: ObsidianNote[];
  graph: VaultGraph;
  dataviewResults?: DataviewResult[];
}

// ============================================
// AI Summarization Types (04-03)
// ============================================

export interface SummaryRequest {
  documentContent: string;
  annotations: Annotation[];
  includeAnnotations: boolean;
  maxLength?: number;
  style: 'executive' | 'detailed' | 'bullet-points';
}

export interface DocumentSummary {
  title: string;
  overview: string;
  keyPoints: string[];
  annotationHighlights: AnnotationHighlight[];
  recommendation?: string;
  metadata: SummaryMetadata;
}

export interface AnnotationHighlight {
  count: number;
  byType: Record<string, number>;
  criticalIssues: string[];
  suggestedImprovements: string[];
  questionsRaised: string[];
}

export interface SummaryMetadata {
  generatedAt: string;
  documentLength: number;
  annotationCount: number;
  model: string;
  tokensUsed: number;
}

export type SummaryFormat = 'text' | 'markdown' | 'json';

export interface SummaryExport {
  format: SummaryFormat;
  content: string;
  filename: string;
}
