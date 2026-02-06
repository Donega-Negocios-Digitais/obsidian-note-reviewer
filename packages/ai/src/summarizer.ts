/**
 * AI Summarization with Annotation Awareness
 *
 * Generates executive summaries from annotated documents using Claude API.
 * Incorporates annotation context to highlight critical feedback and suggestions.
 */

import Anthropic from '@anthropic-ai/sdk';
import { exportForClaude } from '@obsidian-note-reviewer/ui/utils/claudeExport';
import type { Annotation } from '@obsidian-note-reviewer/ui/types';
import type {
  SummaryRequest,
  DocumentSummary,
  AnnotationHighlight,
  SummaryMetadata,
  SummaryExport,
  SummaryFormat,
} from './types';
import { getAIConfig } from './config';

const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Generate an AI-powered summary of a document with annotation context
 *
 * @param request - Summary request with document content and annotations
 * @returns Generated document summary
 */
export async function generateSummary(
  request: SummaryRequest
): Promise<DocumentSummary> {
  const config = getAIConfig();
  if (!config.apiKey) {
    throw new Error('Anthropic API key required. Please configure in settings.');
  }

  const anthropic = new Anthropic({ apiKey: config.apiKey });

  // Get annotation context
  const annotationContext = request.includeAnnotations
    ? buildAnnotationContext(request.annotations)
    : null;

  // Build prompt
  const systemPrompt = buildSummarySystemPrompt(request.style);
  const userPrompt = buildSummaryUserPrompt(
    request.documentContent,
    annotationContext,
    request.maxLength
  );

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    max_tokens: 4096,
    temperature: 0.5,
  });

  const summaryText = response.content[0].type === 'text'
    ? response.content[0].text
    : '';

  const summary = parseSummaryResponse(summaryText, request);

  return {
    ...summary,
    annotationHighlights: buildAnnotationHighlights(request.annotations),
    metadata: {
      generatedAt: new Date().toISOString(),
      documentLength: request.documentContent.length,
      annotationCount: request.annotations.length,
      model: response.model,
      tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
    },
  };
}

/**
 * Build annotation context string from annotations
 *
 * Uses exportForClaude to get formatted annotation data.
 */
function buildAnnotationContext(annotations: Annotation[]): string {
  if (annotations.length === 0) {
    return '';
  }

  const exportData = exportForClaude(annotations);

  const keyAnnotations = exportData.annotations.slice(0, 10).map(a => {
    let text = `- ${a.type}`;
    if (a.comment) text += `: ${a.comment}`;
    if (a.originalText) text += ` ("${a.originalText.slice(0, 50)}${a.originalText.length > 50 ? '...' : ''}")`;
    return text;
  }).join('\n');

  return `
Contexto de Anotações:
- Total: ${exportData.totalCount}
- Tipos: ${Object.entries(exportData.metadata.types)
    .filter(([_, count]) => count > 0)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ')}

Principais anotações:
${keyAnnotations}${annotations.length > 10 ? `\n... e mais ${annotations.length - 10} anotações` : ''}
  `.trim();
}

/**
 * Build system prompt based on summary style
 */
function buildSummarySystemPrompt(style: SummaryRequest['style']): string {
  const basePrompt = 'Você é um especialista em análise e sumarização de documentos técnicos.';

  const styleInstructions: Record<SummaryRequest['style'], string> = {
    executive: 'Crie um resumo executivo conciso (2-3 parágrafos no máximo) focado nos principais insights e itens acionáveis.',
    detailed: 'Crie um resumo detalhado com análise abrangente seção por seção, incluindo contexto e implicações.',
    'bullet-points': 'Crie um resumo estruturado usando bullet points para fácil leitura e escaneamento.',
  };

  return `${basePrompt}\n\n${styleInstructions[style]}\n\nResponda em formato JSON com a seguinte estrutura:\n{\n  "title": "título do resumo",\n  "overview": "visão geral em 2-3 parágrafos",\n  "keyPoints": ["ponto chave 1", "ponto chave 2", ...],\n  "recommendation": "recomendação opcional"\n}\n\nSe anotações forem fornecidas, incorpore-as no resumo e destaque áreas críticas.`;
}

/**
 * Build user prompt with document content and annotation context
 */
function buildSummaryUserPrompt(
  content: string,
  annotationContext: string | null,
  maxLength?: number
): string {
  let prompt = `Por favor, analise e resuma o seguinte documento:\n\n${content}`;

  if (annotationContext) {
    prompt += `\n\n${annotationContext}\n\nCertifique-se de que o resumo reflita o feedback e as problemas levantados nestas anotações. Destaque questões críticas e sugestões de melhoria.`;
  }

  if (maxLength) {
    prompt += `\n\nMantenha o resumo abaixo de ${maxLength} caracteres.`;
  }

  return prompt;
}

/**
 * Parse Claude response into DocumentSummary structure
 */
function parseSummaryResponse(
  text: string,
  request: SummaryRequest
): Omit<DocumentSummary, 'metadata' | 'annotationHighlights'> {
  // Try to extract JSON from markdown code block or direct JSON
  const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) ||
                   text.match(/\{[\s\S]*\}/);

  if (!jsonMatch) {
    // Fallback to plain text
    return {
      title: 'Resumo do Documento',
      overview: text.slice(0, 500),
      keyPoints: [],
    };
  }

  try {
    const jsonContent = jsonMatch[1] || jsonMatch[0];
    const parsed = JSON.parse(jsonContent);
    return {
      title: parsed.title || 'Resumo do Documento',
      overview: parsed.overview || text.slice(0, 500),
      keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints : [],
      recommendation: parsed.recommendation,
    };
  } catch {
    return {
      title: 'Resumo do Documento',
      overview: text.slice(0, 500),
      keyPoints: [],
    };
  }
}

/**
 * Build annotation highlights from annotations
 *
 * Categorizes annotations by type and extracts key insights.
 */
function buildAnnotationHighlights(annotations: Annotation[]): AnnotationHighlight {
  const byType: Record<string, number> = {};
  const criticalIssues: string[] = [];
  const suggestedImprovements: string[] = [];
  const questionsRaised: string[] = [];

  for (const ann of annotations) {
    // Count by type
    const typeName = ann.type;
    byType[typeName] = (byType[typeName] || 0) + 1;

    // Categorize by type and status
    if (ann.type === 'DELETION' || ann.status === 'open') {
      if (ann.text && criticalIssues.length < 5) {
        criticalIssues.push(ann.text);
      }
    } else if (ann.type === 'REPLACEMENT' || ann.type === 'INSERTION') {
      if (ann.text && suggestedImprovements.length < 5) {
        suggestedImprovements.push(ann.text);
      }
    } else if (ann.type === 'COMMENT' || ann.type === 'GLOBAL_COMMENT') {
      if (ann.text && questionsRaised.length < 5) {
        questionsRaised.push(ann.text);
      }
    }
  }

  return {
    count: annotations.length,
    byType,
    criticalIssues,
    suggestedImprovements,
    questionsRaised,
  };
}

/**
 * Export summary in specified format
 *
 * @param summary - Document summary to export
 * @param format - Export format (text, markdown, or json)
 * @returns Export data with content and filename
 */
export function exportSummary(
  summary: DocumentSummary,
  format: SummaryFormat
): SummaryExport {
  const filename = `summary-${Date.now()}`;
  let content: string;

  switch (format) {
    case 'markdown':
      content = formatAsMarkdown(summary);
      return {
        format,
        content,
        filename: `${filename}.md`,
      };

    case 'json':
      content = JSON.stringify(summary, null, 2);
      return {
        format,
        content,
        filename: `${filename}.json`,
      };

    case 'text':
    default:
      content = formatAsText(summary);
      return {
        format,
        content,
        filename: `${filename}.txt`,
      };
  }
}

/**
 * Format summary as Markdown
 */
function formatAsMarkdown(summary: DocumentSummary): string {
  const lines: string[] = [];

  lines.push(`# ${summary.title}\n`);
  lines.push(`*Gerado em: ${new Date(summary.metadata.generatedAt).toLocaleString('pt-BR')}*`);
  lines.push(`*Modelo: ${summary.metadata.model} | Tokens: ${summary.metadata.tokensUsed}*\n`);

  lines.push('## Visão Geral\n');
  lines.push(summary.overview);

  if (summary.keyPoints.length > 0) {
    lines.push('\n## Pontos Chave\n');
    for (const point of summary.keyPoints) {
      lines.push(`- ${point}`);
    }
  }

  if (summary.annotationHighlights.count > 0) {
    const h = summary.annotationHighlights;
    lines.push('\n## Destaques das Anotações\n');
    lines.push(`- **Total de anotações:** ${h.count}`);

    if (Object.keys(h.byType).length > 0) {
      lines.push('- **Por tipo:**');
      for (const [type, count] of Object.entries(h.byType)) {
        lines.push(`  - ${type}: ${count}`);
      }
    }

    if (h.criticalIssues.length > 0) {
      lines.push('\n### Issues Críticas');
      for (const issue of h.criticalIssues) {
        lines.push(`- ${issue}`);
      }
    }

    if (h.suggestedImprovements.length > 0) {
      lines.push('\n### Sugestões de Melhoria');
      for (const imp of h.suggestedImprovements) {
        lines.push(`- ${imp}`);
      }
    }

    if (h.questionsRaised.length > 0) {
      lines.push('\n### Questões Levantadas');
      for (const question of h.questionsRaised) {
        lines.push(`- ${question}`);
      }
    }
  }

  if (summary.recommendation) {
    lines.push('\n## Recomendação\n');
    lines.push(summary.recommendation);
  }

  return lines.join('\n');
}

/**
 * Format summary as plain text
 */
function formatAsText(summary: DocumentSummary): string {
  const lines: string[] = [];

  lines.push(summary.title.toUpperCase());
  lines.push('='.repeat(summary.title.length));
  lines.push('');
  lines.push(summary.overview);
  lines.push('');

  if (summary.keyPoints.length > 0) {
    lines.push('PONTOS CHAVE:');
    for (const point of summary.keyPoints) {
      lines.push(`  • ${point}`);
    }
    lines.push('');
  }

  if (summary.annotationHighlights.count > 0) {
    lines.push(`ANOTAÇÕES: ${summary.annotationHighlights.count} total`);

    const h = summary.annotationHighlights;
    if (h.criticalIssues.length > 0) {
      lines.push('Issues Críticas:');
      h.criticalIssues.forEach(i => lines.push(`  - ${i}`));
    }
    if (h.suggestedImprovements.length > 0) {
      lines.push('Sugestões de Melhoria:');
      h.suggestedImprovements.forEach(i => lines.push(`  - ${i}`));
    }
    lines.push('');
  }

  if (summary.recommendation) {
    lines.push(`RECOMENDAÇÃO:\n  ${summary.recommendation}`);
  }

  lines.push('');
  lines.push(`---`);
  lines.push(`Gerado: ${new Date(summary.metadata.generatedAt).toLocaleString('pt-BR')}`);
  lines.push(`Modelo: ${summary.metadata.model} | Tokens: ${summary.metadata.tokensUsed}`);

  return lines.join('\n');
}
