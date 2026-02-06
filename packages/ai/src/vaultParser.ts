/**
 * Obsidian Vault Parser
 *
 * Parses Obsidian markdown vaults to extract backlinks,
 * graph relationships, and dataview queries.
 * Understands wiki-style [[links]] and Obsidian's frontmatter.
 */

import { readFile, readdir, stat } from 'fs/promises';
import { join, dirname, basename } from 'path';
import { parse as parseYAML } from 'js-yaml';

import type {
  ObsidianNote,
  InternalLink,
  GraphNode,
  GraphEdge,
  VaultGraph,
  DataviewQuery,
  DataviewResult,
  VaultContext,
} from './types';

// Regex patterns for Obsidian syntax
const WIKI_LINK_REGEX = /\[\[([^\]]+)\](?:\|[^\]]+)?\]/g;
const MD_LINK_REGEX = /\[([^\]]+)\]\(([^)]+)\)/g;
const TAG_REGEX = /#([\w-]+)/g;
const EMBED_REGEX = /!\[\[([^\]]+)\](?:\|[^\]]+)?\]/g;
const FRONTMATTER_REGEX = /^---\s*\n([\s\S]*?)\n---\s*\n/;

/**
 * Parse an Obsidian vault and extract context for a specific note
 *
 * @param vaultPath - Path to the Obsidian vault
 * @param currentNotePath - Path to the current note (relative to vault)
 * @returns Complete vault context with backlinks, forward links, and graph
 */
export async function parseVault(
  vaultPath: string,
  currentNotePath: string
): Promise<VaultContext> {
  // Normalize paths
  const normalizedVault = vaultPath.replace(/\\/g, '/');
  const normalizedNote = currentNotePath.replace(/\\/g, '/');

  // Get all markdown files in vault
  const notes = await getAllMarkdownFiles(normalizedVault);

  // Find and parse current note
  const currentNoteFull = join(normalizedVault, normalizedNote);
  const currentNote = await parseNote(currentNoteFull, notes);

  // Build complete graph from all notes
  const graph = buildGraph(notes);

  // Get backlinks (notes that link TO current note)
  const backlinks = notes.filter((note) =>
    note.links.some(
      (link) =>
        link.target === currentNote.title || link.target === normalizedNote
    )
  );

  // Get forward links (notes linked FROM current note)
  const forwardLinks = await Promise.all(
    currentNote.links
      .filter((link) => link.type !== 'embed')
      .map((link) => resolveLink(link, normalizedVault, notes))
  );

  return {
    currentNote,
    backlinks,
    forwardLinks,
    graph,
  };
}

/**
 * Get all markdown files in the vault recursively
 */
async function getAllMarkdownFiles(vaultPath: string): Promise<ObsidianNote[]> {
  const notes: ObsidianNote[] = [];

  async function traverse(dir: string) {
    try {
      const entries = await readdir(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dir, entry.name);

        // Skip hidden directories (.obsidian, .git, etc.)
        if (entry.isDirectory() && entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          await traverse(fullPath);
        } else if (entry.name.endsWith('.md')) {
          try {
            const note = await parseNote(fullPath, []);
            notes.push(note);
          } catch (error) {
            // Skip files that can't be parsed
            console.warn(`Failed to parse ${fullPath}:`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to read directory ${dir}:`, error);
    }
  }

  await traverse(vaultPath);
  return notes;
}

/**
 * Parse a single markdown file into an ObsidianNote
 */
async function parseNote(
  filePath: string,
  allNotes: ObsidianNote[]
): Promise<ObsidianNote> {
  const content = await readFile(filePath, 'utf-8');
  const lines = content.split('\n');

  // Extract and parse frontmatter
  let frontmatter: Record<string, any> = {};
  let contentStart = 0;

  const frontmatterMatch = content.match(FRONTMATTER_REGEX);
  if (frontmatterMatch) {
    try {
      frontmatter = parseYAML(frontmatterMatch[1]) as Record<string, any>;
    } catch {
      // Invalid YAML, use empty object
    }
    contentStart = frontmatterMatch[0].split('\n').length;
  }

  // Extract content without frontmatter
  const noteContent = lines.slice(contentStart).join('\n');

  // Extract links
  const links: InternalLink[] = [];
  let match;

  // Wiki-style links [[note]] or [[note|alias]]
  while ((match = WIKI_LINK_REGEX.exec(noteContent)) !== null) {
    const target = match[1];
    const [path, alias] = target.split('|');

    links.push({
      target: path.trim(),
      type: 'wiki',
      position: { line: 0, col: match.index },
    });
  }

  // Markdown links [text](path.md)
  while ((match = MD_LINK_REGEX.exec(noteContent)) !== null) {
    const target = match[2];
    if (target.endsWith('.md')) {
      links.push({
        target,
        type: 'markdown',
      });
    }
  }

  // Embeds ![[note]]
  while ((match = EMBED_REGEX.exec(noteContent)) !== null) {
    links.push({
      target: match[1],
      type: 'embed',
    });
  }

  // Extract tags
  const tags: string[] = [];
  while ((match = TAG_REGEX.exec(noteContent)) !== null) {
    tags.push(match[1]);
  }

  // Get file stats
  const stats = await stat(filePath);

  return {
    path: filePath,
    title: basename(filePath, '.md'),
    content: noteContent,
    tags,
    frontmatter,
    links,
    backlinks: [], // Populated later
    created: stats.birthtime,
    modified: stats.mtime,
  };
}

/**
 * Build a graph from all notes
 */
function buildGraph(notes: ObsidianNote[]): VaultGraph {
  const nodes: GraphNode[] = notes.map((note) => ({
    id: note.path,
    label: note.title,
    connections: note.links.length,
  }));

  const edges: GraphEdge[] = [];

  for (const note of notes) {
    for (const link of note.links) {
      // Find target note
      const target = notes.find(
        (n) => n.title === link.target || n.path.endsWith(link.target)
      );

      if (target) {
        edges.push({
          source: note.path,
          target: target.path,
          type: link.type === 'embed' ? 'embed' : 'link',
        });
      }
    }
  }

  return { nodes, edges };
}

/**
 * Resolve a link to its target note
 */
async function resolveLink(
  link: InternalLink,
  vaultPath: string,
  notes: ObsidianNote[]
): Promise<ObsidianNote> {
  const note = notes.find(
    (n) => n.title === link.target || n.path.endsWith(link.target)
  );

  if (!note) {
    throw new Error(`Note not found: ${link.target}`);
  }

  return note;
}

/**
 * Get backlinks for the current note
 */
export function getBacklinks(context: VaultContext): ObsidianNote[] {
  return context.backlinks;
}

/**
 * Get the vault graph
 */
export function getGraph(context: VaultContext): VaultGraph {
  return context.graph;
}

/**
 * Parse a dataview query string
 */
export function parseDataview(query: string): DataviewQuery {
  const trimmed = query.trim().toUpperCase();

  // Determine query type
  let type: DataviewQuery['type'] = 'TABLE';
  if (trimmed.startsWith('LIST')) type = 'LIST';
  if (trimmed.startsWith('TASK')) type = 'TASK';
  if (trimmed.startsWith('CALENDAR')) type = 'CALENDAR';

  // Extract fields (simplified parsing)
  const fieldsMatch = query.match(/(?:TABLE|LIST)\s+([^FROM]+)/i);
  const fields = fieldsMatch
    ? fieldsMatch[1]
        .split(',')
        .map((f) => f.trim())
        .filter((f) => f.length > 0)
    : ['file.name'];

  return {
    type,
    query,
    fields,
    filters: [],
  };
}

/**
 * Execute a dataview query against vault context
 */
export async function executeDataview(
  query: DataviewQuery,
  context: VaultContext
): Promise<DataviewResult> {
  const start = Date.now();

  // Very basic execution - just return current note's frontmatter
  let rows = context.currentNote.frontmatter
    ? [context.currentNote.frontmatter]
    : [];

  // Add file metadata
  if (rows.length > 0) {
    rows = rows.map((row) => ({
      ...row,
      file: {
        name: context.currentNote.title,
        path: context.currentNote.path,
        tags: context.currentNote.tags,
      },
    }));
  }

  return {
    rows,
    metadata: {
      totalRows: rows.length,
      queryTime: Date.now() - start,
    },
  };
}

/**
 * Get notes by tag
 */
export function getNotesByTag(
  context: VaultContext,
  tag: string
): ObsidianNote[] {
  const allNotes = [context.currentNote, ...context.backlinks, ...context.forwardLinks];
  return allNotes.filter((note) => note.tags.includes(tag));
}

/**
 * Search notes by content
 */
export function searchNotes(
  context: VaultContext,
  searchTerm: string
): ObsidianNote[] {
  const allNotes = [context.currentNote, ...context.backlinks, ...context.forwardLinks];
  const term = searchTerm.toLowerCase();

  return allNotes.filter((note) =>
    note.content.toLowerCase().includes(term) || note.title.toLowerCase().includes(term)
  );
}

/**
 * Get connected notes (friends of friends)
 */
export function getConnectedNotes(
  context: VaultContext,
  depth: number = 1
): ObsidianNote[] {
  const visited = new Set<string>([context.currentNote.path]);
  const result: ObsidianNote[] = [context.currentNote];

  function traverse(notes: ObsidianNote[], currentDepth: number) {
    if (currentDepth >= depth) return;

    for (const note of notes) {
      if (visited.has(note.path)) continue;

      visited.add(note.path);
      result.push(note);

      // Get linked notes
      const linked = note.links
        .map((link) =>
          context.graph.nodes.find((n) => n.label === link.target || n.id.endsWith(link.target))
        )
        .filter((n): n is GraphNode => !!n);

      const linkedNotes = linked.map((node) =>
        [context.currentNote, ...context.backlinks, ...context.forwardLinks].find(
          (n) => n.path === node.id
        )
      );

      traverse(linkedNotes.filter((n): n is ObsidianNote => !!n), currentDepth + 1);
    }
  }

  traverse(context.forwardLinks, 0);
  return result;
}
