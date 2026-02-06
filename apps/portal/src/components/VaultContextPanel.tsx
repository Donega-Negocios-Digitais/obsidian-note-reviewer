/**
 * Vault Context Panel Component
 *
 * Displays Obsidian vault context including backlinks,
 * graph information, and connected notes.
 */

import React, { useState, useEffect } from 'react';
import {
  parseVault,
  getBacklinks,
  getGraph,
  getNotesByTag,
  searchNotes,
} from '@obsidian-note-reviewer/ai/vaultParser';
import type { VaultContext, ObsidianNote, VaultGraph } from '@obsidian-note-reviewer/ai/types';

export interface VaultContextPanelProps {
  vaultPath: string;
  currentNotePath: string;
}

export function VaultContextPanel({
  vaultPath,
  currentNotePath,
}: VaultContextPanelProps) {
  const [context, setContext] = useState<VaultContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'backlinks' | 'graph' | 'search'>('backlinks');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ObsidianNote[]>([]);

  useEffect(() => {
    setLoading(true);
    parseVault(vaultPath, currentNotePath)
      .then(setContext)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [vaultPath, currentNotePath]);

  if (loading) {
    return (
      <div className="vault-context-panel p-4">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vault-context-panel p-4">
        <div className="bg-red-50 border border-red-200 rounded p-3">
          <p className="text-sm text-red-600">Erro ao carregar contexto: {error}</p>
          <p className="text-xs text-gray-500 mt-1">
            Verifique se o caminho do vault está correto.
          </p>
        </div>
      </div>
    );
  }

  if (!context) {
    return null;
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = searchNotes(context, searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    }
  };

  return (
    <div className="vault-context-panel border rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b bg-gray-50">
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'backlinks'
              ? 'border-b-2 border-blue-500 bg-white text-blue-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('backlinks')}
        >
          Backlinks ({context.backlinks.length})
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'graph'
              ? 'border-b-2 border-blue-500 bg-white text-blue-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('graph')}
        >
          Graph ({context.graph.nodes.length})
        </button>
        <button
          className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'search'
              ? 'border-b-2 border-blue-500 bg-white text-blue-600'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          onClick={() => setActiveTab('search')}
        >
          Search
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'backlinks' && (
          <BacklinksList
            backlinks={context.backlinks}
            currentNote={context.currentNote}
          />
        )}

        {activeTab === 'graph' && <GraphView graph={context.graph} />}

        {activeTab === 'search' && (
          <SearchView
            context={context}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            searchResults={searchResults}
            onSearch={handleSearch}
          />
        )}
      </div>
    </div>
  );
}

interface BacklinksListProps {
  backlinks: ObsidianNote[];
  currentNote: ObsidianNote;
}

function BacklinksList({ backlinks, currentNote }: BacklinksListProps) {
  if (backlinks.length === 0) {
    return (
      <div className="text-center py-8">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
          />
        </svg>
        <p className="mt-2 text-sm text-gray-500">Nenhuma nota linka para "{currentNote.title}"</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        Notas que linkam para "{currentNote.title}"
      </h4>
      <ul className="space-y-2">
        {backlinks.map((note) => (
          <BacklinkItem key={note.path} note={note} />
        ))}
      </ul>
    </div>
  );
}

function BacklinkItem({ note }: { note: ObsidianNote }) {
  const openInObsidian = () => {
    window.open(`obsidian://open?vault=${note.path}`, '_blank');
  };

  return (
    <li className="flex items-start justify-between p-2 rounded hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <button
          onClick={openInObsidian}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block"
        >
          {note.title}
        </button>
        <div className="flex items-center gap-2 mt-1">
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
            >
              #{tag}
            </span>
          ))}
        </div>
        {note.frontmatter.description && (
          <p className="text-xs text-gray-500 mt-1 truncate">{note.frontmatter.description}</p>
        )}
      </div>
      <svg
        className="h-4 w-4 text-gray-400 ml-2 flex-shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
        />
      </svg>
    </li>
  );
}

interface GraphViewProps {
  graph: VaultGraph;
}

function GraphView({ graph }: GraphViewProps) {
  const totalLinks = graph.edges.length;
  const mostConnected = [...graph.nodes]
    .sort((a, b) => b.connections - a.connections)
    .slice(0, 5);

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">Estatísticas do Grafo</h4>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-2xl font-bold text-blue-600">{graph.nodes.length}</p>
          <p className="text-xs text-blue-700">Notas</p>
        </div>
        <div className="bg-green-50 p-3 rounded">
          <p className="text-2xl font-bold text-green-600">{totalLinks}</p>
          <p className="text-xs text-green-700">Links</p>
        </div>
      </div>

      {mostConnected.length > 0 && (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-2">Mais conectadas:</p>
          <ul className="space-y-1">
            {mostConnected.map((node) => (
              <li key={node.id} className="text-xs flex justify-between">
                <span className="truncate">{node.label}</span>
                <span className="text-gray-500">{node.connections} links</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-4">
        Visualização de grafo em desenvolvimento...
      </p>
    </div>
  );
}

interface SearchViewProps {
  context: VaultContext;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: ObsidianNote[];
  onSearch: () => void;
}

function SearchView({
  context,
  searchQuery,
  setSearchQuery,
  searchResults,
  onSearch,
}: SearchViewProps) {
  return (
    <div>
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && onSearch()}
          placeholder="Buscar no vault..."
          className="flex-1 px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={onSearch}
          className="px-4 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
        >
          Buscar
        </button>
      </div>

      {searchQuery && searchResults.length === 0 && (
        <p className="text-sm text-gray-500 text-center py-4">Nenhum resultado encontrado</p>
      )}

      {searchResults.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">{searchResults.length} resultados</p>
          <ul className="space-y-2">
            {searchResults.map((note) => (
              <BacklinkItem key={note.path} note={note} />
            ))}
          </ul>
        </div>
      )}

      {!searchQuery && (
        <div className="text-center py-8">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-500">Digite para buscar no vault</p>
        </div>
      )}
    </div>
  );
}
