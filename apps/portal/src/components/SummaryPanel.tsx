/**
 * AI Summary Panel Component
 *
 * Displays AI-generated summaries with annotation awareness.
 * Supports multiple summary styles and export formats.
 */

import React, { useState } from 'react';
import { generateSummary, exportSummary } from '@obsidian-note-reviewer/ai/summarizer';
import type { DocumentSummary, SummaryFormat } from '@obsidian-note-reviewer/ai/types';
import type { Annotation } from '@obsidian-note-reviewer/ui/types';

export interface SummaryPanelProps {
  documentContent: string;
  annotations: Annotation[];
}

type SummaryStyle = 'executive' | 'detailed' | 'bullet-points';

export function SummaryPanel({ documentContent, annotations }: SummaryPanelProps) {
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [style, setStyle] = useState<SummaryStyle>('executive');

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await generateSummary({
        documentContent,
        annotations,
        includeAnnotations: true,
        style,
      });
      setSummary(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Falha ao gerar resumo';
      setError(message);
      console.error('Failed to generate summary:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format: SummaryFormat) => {
    if (!summary) return;

    const exported = exportSummary(summary, format);

    // Trigger download
    const blob = new Blob([exported.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exported.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasAnnotations = annotations.length > 0;

  return (
    <div className="summary-panel bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Resumo com IA
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hasAnnotations
              ? `${annotations.length} anotaç${annotations.length > 1 ? 'ões' : 'ão'} será${annotations.length > 1 ? 'ão' : ''} incorporada${annotations.length > 1 ? 's' : ''}`
              : 'Sem anotações no documento'}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value as SummaryStyle)}
            className="border border-gray-300 dark:border-gray-600 rounded px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="executive">Executivo</option>
            <option value="detailed">Detalhado</option>
            <option value="bullet-points">Bullet Points</option>
          </select>

          <button
            onClick={handleGenerate}
            disabled={loading || !documentContent}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Gerando...' : 'Gerar Resumo'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <p className="text-xs text-red-500 dark:text-red-500 mt-1">
            Configure a chave da API Anthropic nas configurações.
          </p>
        </div>
      )}

      {/* Summary Content */}
      {summary && <SummaryContent summary={summary} />}

      {/* Empty State */}
      {!summary && !loading && !error && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg
            className="mx-auto h-12 w-12 mb-3 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          <p className="text-sm">Clique em "Gerar Resumo" para criar um resumo com IA</p>
        </div>
      )}
    </div>
  );
}

interface SummaryContentProps {
  summary: DocumentSummary;
}

function SummaryContent({ summary }: SummaryContentProps) {
  const [exportFormat, setExportFormat] = React.useState<SummaryFormat>('markdown');

  const handleExport = () => {
    const exported = exportSummary(summary, exportFormat);

    const blob = new Blob([exported.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = exported.filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
          {summary.title}
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Gerado em {new Date(summary.metadata.generatedAt).toLocaleString('pt-BR')}
        </p>
      </div>

      {/* Overview */}
      <div>
        <h5 className="font-medium text-gray-900 dark:text-white mb-2">Visão Geral</h5>
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {summary.overview}
        </p>
      </div>

      {/* Key Points */}
      {summary.keyPoints.length > 0 && (
        <div>
          <h5 className="font-medium text-gray-900 dark:text-white mb-3">Pontos Chave</h5>
          <ul className="space-y-2">
            {summary.keyPoints.map((point, i) => (
              <li
                key={i}
                className="flex items-start text-sm text-gray-700 dark:text-gray-300"
              >
                <span className="text-blue-600 dark:text-blue-400 mr-2 mt-0.5">•</span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Annotation Highlights */}
      {summary.annotationHighlights.count > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 dark:text-white mb-3">
            Destaques das Anotações
          </h5>

          <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
            <strong>{summary.annotationHighlights.count}</strong> anotaç
            {summary.annotationHighlights.count > 1 ? 'ões' : 'ão'}
          </p>

          {/* By Type */}
          {Object.keys(summary.annotationHighlights.byType).length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Por tipo:
              </p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(summary.annotationHighlights.byType).map(([type, count]) => (
                  <span
                    key={type}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300"
                  >
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Critical Issues */}
          {summary.annotationHighlights.criticalIssues.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2">
                Issues Críticas:
              </p>
              <ul className="space-y-1">
                {summary.annotationHighlights.criticalIssues.map((issue, i) => (
                  <li
                    key={i}
                    className="flex items-start text-xs text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-red-500 dark:text-red-400 mr-1">⚠</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Improvements */}
          {summary.annotationHighlights.suggestedImprovements.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">
                Sugestões de Melhoria:
              </p>
              <ul className="space-y-1">
                {summary.annotationHighlights.suggestedImprovements.map((imp, i) => (
                  <li
                    key={i}
                    className="flex items-start text-xs text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-green-500 dark:text-green-400 mr-1">✓</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions Raised */}
          {summary.annotationHighlights.questionsRaised.length > 0 && (
            <div>
              <p className="text-xs font-medium text-purple-600 dark:text-purple-400 mb-2">
                Questões Levantadas:
              </p>
              <ul className="space-y-1">
                {summary.annotationHighlights.questionsRaised.map((question, i) => (
                  <li
                    key={i}
                    className="flex items-start text-xs text-gray-700 dark:text-gray-300"
                  >
                    <span className="text-purple-500 dark:text-purple-400 mr-1">?</span>
                    <span>{question}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Recommendation */}
      {summary.recommendation && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Recomendação</h5>
          <p className="text-sm text-gray-700 dark:text-gray-300">{summary.recommendation}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span>Modelo: {summary.metadata.model}</span>
        <span>Tokens: {summary.metadata.tokensUsed}</span>
        <span>
          Documento: {summary.metadata.documentLength} caracteres
        </span>
      </div>

      {/* Export Section */}
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-sm text-gray-600 dark:text-gray-400">Exportar como:</span>

        <div className="flex gap-1">
          {(['markdown', 'json', 'text'] as SummaryFormat[]).map((format) => (
            <button
              key={format}
              onClick={() => handleExport()}
              className={`px-3 py-1 text-sm rounded transition-colors ${
                exportFormat === format
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              {format === 'markdown' ? 'MD' : format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SummaryPanel;
