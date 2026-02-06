/**
 * Cross References Hook
 *
 * Detects and manages cross-references between open documents.
 */

import { useMemo, useCallback } from 'react';
import type { DocumentTab } from './useDocumentTabs';

export interface CrossReference {
  sourceTabId: string;
  sourceTitle: string;
  targetTabId: string;
  targetTitle: string;
  linkType: 'wiki' | 'markdown' | 'external';
  context?: string; // Surrounding text for context
  line?: number;
}

export interface DocumentReferences {
  inbound: CrossReference[]; // References to this document
  outbound: CrossReference[]; // References from this document
}

export interface UseCrossReferencesOptions {
  tabs: DocumentTab[];
  activeTabId: string | null;
}

export interface UseCrossReferencesReturn {
  getReferences: (tabId: string) => DocumentReferences;
  getAllReferences: () => CrossReference[];
  getGraphEdges: () => Array<{ from: string; to: string; type: string }>;
  findReferencedTabs: (tabId: string) => string[];
}

// Wiki link pattern: [[Document Title]] or [[Document Title|Alias]]
const WIKI_LINK_REGEX = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;

// Markdown link pattern: [text](url or path)
const MD_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Parse markdown content for links
 */
function parseLinks(content: string, tabId: string, tabTitle: string): CrossReference[] {
  const refs: CrossReference[] = [];
  const lines = content.split('\n');

  lines.forEach((line, lineIndex) => {
    // Check wiki links
    let match;
    while ((match = WIKI_LINK_REGEX.exec(line)) !== null) {
      const targetTitle = match[1].trim();
      refs.push({
        sourceTabId: tabId,
        sourceTitle: tabTitle,
        targetTabId: '', // Will be resolved by caller
        targetTitle,
        linkType: 'wiki',
        context: line.trim().substring(0, 50),
        line: lineIndex + 1,
      });
    }

    // Reset regex for next iteration
    WIKI_LINK_REGEX.lastIndex = 0;

    // Check markdown links (only for .md files)
    while ((match = MD_LINK_REGEX.exec(line)) !== null) {
      const url = match[2];
      // Only include relative markdown links
      if (url.endsWith('.md') || url.startsWith('./') || url.startsWith('../')) {
        const targetTitle = url.replace(/\.md$/, '').split('/').pop() || url;
        refs.push({
          sourceTabId: tabId,
          sourceTitle: tabTitle,
          targetTabId: '',
          targetTitle,
          linkType: 'markdown',
          context: match[1],
          line: lineIndex + 1,
        });
      }
    }

    MD_LINK_REGEX.lastIndex = 0;
  });

  return refs;
}

/**
 * Normalize title for matching (case-insensitive, ignore special chars)
 */
function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Check if two titles match (fuzzy matching)
 */
function titlesMatch(a: string, b: string): boolean {
  const normA = normalizeTitle(a);
  const normB = normalizeTitle(b);

  // Direct match
  if (normA === normB) return true;

  // Check if one contains the other (for aliases)
  if (normA.includes(normB) || normB.includes(normA)) {
    return Math.abs(normA.length - normB.length) < 10; // Reasonable length difference
  }

  return false;
}

/**
 * Hook for detecting cross-references between open documents
 */
export function useCrossReferences({
  tabs,
  activeTabId,
}: UseCrossReferencesOptions): UseCrossReferencesReturn {
  // Build title to tabId mapping
  const titleToTabId = useMemo(() => {
    const map = new Map<string, string>();
    tabs.forEach((tab) => {
      map.set(normalizeTitle(tab.title), tab.id);
      // Also store with common variations
      const withoutExt = tab.title.replace(/\.md$/, '');
      map.set(normalizeTitle(withoutExt), tab.id);
    });
    return map;
  }, [tabs]);

  // Parse all links from all tabs
  const allLinks = useMemo(() => {
    const links: CrossReference[] = [];

    tabs.forEach((tab) => {
      if (tab.content) {
        const parsed = parseLinks(tab.content, tab.id, tab.title);
        links.push(...parsed);
      }
    });

    return links;
  }, [tabs]);

  // Resolve links to actual tab IDs
  const resolvedLinks = useMemo(() => {
    return allLinks
      .map((link) => {
        // Try to find matching tab
        for (const [normTitle, tabId] of titleToTabId.entries()) {
          if (titlesMatch(link.targetTitle, normTitle)) {
            return { ...link, targetTabId: tabId };
          }
        }
        return null;
      })
      .filter((link): link is CrossReference => link !== null && link.targetTabId !== '');
  }, [allLinks, titleToTabId]);

  /**
   * Get all references for a specific tab
   */
  const getReferences = useCallback((tabId: string): DocumentReferences => {
    const inbound = resolvedLinks.filter((ref) => ref.targetTabId === tabId);
    const outbound = resolvedLinks.filter((ref) => ref.sourceTabId === tabId);

    return { inbound, outbound };
  }, [resolvedLinks]);

  /**
   * Get all references in the workspace
   */
  const getAllReferences = useCallback((): CrossReference[] => {
    return resolvedLinks;
  }, [resolvedLinks]);

  /**
   * Get graph edges for visualization
   */
  const getGraphEdges = useCallback(() => {
    return resolvedLinks.map((ref) => ({
      from: ref.sourceTabId,
      to: ref.targetTabId,
      type: ref.linkType,
    }));
  }, [resolvedLinks]);

  /**
   * Find all tab IDs that reference the given tab
   */
  const findReferencedTabs = useCallback((tabId: string): string[] => {
    const refs = resolvedLinks.filter((ref) => ref.targetTabId === tabId);
    return [...new Set(refs.map((ref) => ref.sourceTabId))];
  }, [resolvedLinks]);

  return {
    getReferences,
    getAllReferences,
    getGraphEdges,
    findReferencedTabs,
  };
}

export default useCrossReferences;
