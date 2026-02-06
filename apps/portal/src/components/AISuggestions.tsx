/**
 * AI Suggestions Component
 *
 * Displays AI-generated annotation suggestions with accept/reject controls.
 * Integrates with Claude API for real-time suggestion generation.
 */

import React, { useState, useEffect } from 'react';
import {
  generateSuggestions,
  acceptSuggestion,
  rejectSuggestion,
  getConfidenceLabel,
} from '@obsidian-note-reviewer/ai/suggester';
import { getAIConfig, updateAIConfig } from '@obsidian-note-reviewer/ai/config';
import type { AISuggestion } from '@obsidian-note-reviewer/ai/types';
import type { Annotation } from '@obsidian-note-reviewer/ui/types';
import { AnnotationType } from '@obsidian-note-reviewer/ui/types';

export interface AISuggestionsProps {
  content: string;
  onAcceptSuggestion: (annotation: Annotation) => void;
}

export function AISuggestions({ content, onAcceptSuggestion }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [config, setConfig] = useState(getAIConfig());

  // Check for API key on mount
  useEffect(() => {
    const apiKey = config.apiKey;
    setHasApiKey(!!apiKey);
  }, [config.apiKey]);

  // Generate suggestions when content changes
  useEffect(() => {
    if (!config.enabled || !config.apiKey || !content) return;

    setLoading(true);
    setError(null);

    generateSuggestions(content, config)
      .then((result) => {
        setSuggestions(result.suggestions);
      })
      .catch((err) => {
        setError(err.message || 'Failed to generate suggestions');
        console.error('AI suggestion error:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [content, config.enabled]);

  const handleRegenerate = () => {
    setLoading(true);
    setError(null);

    generateSuggestions(content, config)
      .then((result) => {
        setSuggestions(result.suggestions);
      })
      .catch((err) => {
        setError(err.message || 'Failed to generate suggestions');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleAccept = (suggestion: AISuggestion) => {
    // Convert to Annotation
    const annotation: Annotation = {
      id: `ai-${suggestion.id}`,
      blockId: '',
      createdA: Date.now(),
      type: mapToAnnotationType(suggestion.type),
      text: suggestion.suggestedText || suggestion.reason,
      originalText: suggestion.targetText,
      status: 'open' as any,
    };

    onAcceptSuggestion(annotation);

    // Remove from list
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
  };

  const handleReject = (suggestion: AISuggestion) => {
    rejectSuggestion(suggestion.id);
    setSuggestions((prev) => prev.filter((s) => s.id !== suggestion.id));
  };

  if (!config.enabled) {
    return (
      <div className="ai-suggestions p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">
          AI suggestions are disabled. Enable them in settings.
        </p>
      </div>
    );
  }

  if (!hasApiKey) {
    return (
      <div className="ai-suggestions p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <h4 className="font-semibold text-sm mb-2">API Key Required</h4>
        <p className="text-xs text-gray-600 mb-3">
          Enter your Anthropic API key to enable AI suggestions.
        </p>
        <input
          type="password"
          placeholder="sk-ant-..."
          className="w-full px-3 py-2 border rounded text-sm"
          onChange={(e) => {
            const key = e.target.value;
            updateAIConfig({ apiKey: key });
            setConfig(getAIConfig());
            setHasApiKey(!!key);
          }}
        />
      </div>
    );
  }

  return (
    <div className="ai-suggestions">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm">
          AI Suggestions
          {suggestions.length > 0 && ` (${suggestions.length})`}
        </h3>
        <button
          onClick={handleRegenerate}
          disabled={loading}
          className="text-xs text-blue-600 hover:underline disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Regenerate'}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded mb-3">
          <p className="text-xs text-red-600">{error}</p>
        </div>
      )}

      {loading && suggestions.length === 0 && (
        <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
          <p className="text-sm text-gray-500">AI is analyzing your document...</p>
        </div>
      )}

      {!loading && suggestions.length === 0 && !error && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">No suggestions generated.</p>
        </div>
      )}

      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <SuggestionItem
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={() => handleAccept(suggestion)}
            onReject={() => handleReject(suggestion)}
          />
        ))}
      </div>
    </div>
  );
}

interface SuggestionItemProps {
  suggestion: AISuggestion;
  onAccept: () => void;
  onReject: () => void;
}

function SuggestionItem({ suggestion, onAccept, onReject }: SuggestionItemProps) {
  const typeLabels = {
    deletion: { label: 'Excluir', color: 'red' },
    replacement: { label: 'Substituir', color: 'blue' },
    comment: { label: 'Comentário', color: 'green' },
  };

  const typeInfo = typeLabels[suggestion.type];

  return (
    <div className="suggestion-item border-l-4 border-blue-500 bg-white p-3 rounded shadow-sm">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`text-xs uppercase font-medium px-2 py-0.5 rounded bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}
            >
              {typeInfo.label}
            </span>
            <span className="text-xs text-gray-500">
              Confiança: {getConfidenceLabel(suggestion.confidence)} ({Math.round(suggestion.confidence * 100)}%)
            </span>
          </div>

          <p className="text-sm mb-2">{suggestion.reason}</p>

          {suggestion.targetText && (
            <div className="mb-1">
              <span className="text-xs text-gray-500">Original:</span>
              <code className="block text-xs bg-red-50 text-red-800 p-1 rounded mt-1 overflow-x-auto">
                {suggestion.targetText}
              </code>
            </div>
          )}

          {suggestion.suggestedText && (
            <div>
              <span className="text-xs text-gray-500">Sugerido:</span>
              <code className="block text-xs bg-green-50 text-green-800 p-1 rounded mt-1 overflow-x-auto">
                {suggestion.suggestedText}
              </code>
            </div>
          )}
        </div>

        <div className="flex gap-2 ml-3">
          <button
            onClick={onAccept}
            className="w-8 h-8 flex items-center justify-center bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            title="Aceitar sugestão"
          >
            ✓
          </button>
          <button
            onClick={onReject}
            className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            title="Rejeitar sugestão"
          >
            ✗
          </button>
        </div>
      </div>
    </div>
  );
}

function mapToAnnotationType(type: string): AnnotationType {
  switch (type) {
    case 'deletion':
      return AnnotationType.DELETION;
    case 'replacement':
      return AnnotationType.REPLACEMENT;
    case 'comment':
    default:
      return AnnotationType.COMMENT;
  }
}
