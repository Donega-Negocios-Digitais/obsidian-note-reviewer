/**
 * AI Suggestion Engine
 *
 * Generates annotation suggestions using Claude API.
 * Analyzes document content for potential improvements,
 * errors, and areas needing clarification.
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AISuggestion, SuggestionConfig, SuggestionResult } from './types';

const DEFAULT_MODEL = 'claude-3-5-sonnet-20241022';

/**
 * Generate AI-powered annotation suggestions for a document
 *
 * @param content - The document content to analyze
 * @param config - AI configuration including API key and settings
 * @returns Suggestion results with generated suggestions and metadata
 */
export async function generateSuggestions(
  content: string,
  config: SuggestionConfig
): Promise<SuggestionResult> {
  if (!config.apiKey) {
    throw new Error('Anthropic API key required. Set it using setAPIKey().');
  }

  const anthropic = new Anthropic({ apiKey: config.apiKey });

  const systemPrompt = buildSystemPrompt(config);
  const userPrompt = buildUserPrompt(content, config);

  const response = await anthropic.messages.create({
    model: DEFAULT_MODEL,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
    max_tokens: 4096,
    temperature: 0.3, // Lower for more consistent suggestions
  });

  const responseText =
    response.content[0].type === 'text' ? response.content[0].text : '';

  const suggestions = parseSuggestions(responseText);

  return {
    suggestions: suggestions.slice(0, config.maxSuggestions),
    model: response.model,
    tokensUsed: response.usage.input_tokens + response.usage.output_tokens,
  };
}

/**
 * Build system prompt based on configuration
 */
function buildSystemPrompt(config: SuggestionConfig): string {
  const enabledTypes = config.suggestionTypes.join(', ');
  const sensitivity = config.sensitivity;

  const sensitivityInstructions = {
    low: 'Only suggest clear, obvious issues. Be conservative and avoid nitpicking.',
    medium:
      'Suggest meaningful improvements and issues. Balance between thoroughness and practicality.',
    high: 'Be very thorough and suggest even minor improvements. Analyze every detail.',
  };

  return `You are an expert code and document reviewer specializing in identifying improvements, potential issues, and areas needing clarification.

Suggestion types to provide: ${enabledTypes}
Sensitivity level: ${sensitivity}

${sensitivityInstructions[sensitivity]}

For each suggestion, provide:
- type: (deletion|replacement|comment)
- targetText: exact text from the document that needs attention
- suggestedText: the replacement text (for deletions and replacements)
- reason: a clear explanation of why this change is recommended
- confidence: a score from 0.0 to 1.0 indicating how certain you are

IMPORTANT: Respond ONLY with a valid JSON array. No markdown formatting, no code blocks, just the raw JSON array.

Example response format:
[
  {
    "type": "replacement",
    "targetText": "text to replace",
    "suggestedText": "better text",
    "reason": "This wording is clearer",
    "confidence": 0.8
  }
]`;
}

/**
 * Build user prompt with document content
 */
function buildUserPrompt(content: string, config: SuggestionConfig): string {
  const types = config.suggestionTypes.join(', ');

  return `Please analyze this document and suggest improvements.

Focus on these types of suggestions: ${types}

Document content:
\`\`\`
${content}
\`\`\`

Respond with a JSON array of suggestions.`;
}

/**
 * Parse AI response into AISuggestion objects
 */
function parseSuggestions(text: string): AISuggestion[] {
  // Try to extract JSON from response
  let jsonText = text.trim();

  // Remove markdown code blocks if present
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1];
  }

  // Try to find JSON array
  const arrayMatch = jsonText.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    jsonText = arrayMatch[0];
  }

  try {
    const parsed = JSON.parse(jsonText);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((s: any, i: number) => ({
      id: `ai-sugg-${Date.now()}-${i}`,
      type: validateType(s.type),
      confidence: Math.min(1, Math.max(0, s.confidence ?? 0.7)),
      reason: s.reason || 'No explanation provided',
      targetText: s.targetText || '',
      suggestedText: s.suggestedText,
    }));
  } catch (error) {
    console.error('Failed to parse AI suggestions:', error);
    return [];
  }
}

/**
 * Validate and normalize suggestion type
 */
function validateType(type: string): 'deletion' | 'replacement' | 'comment' {
  const validTypes = ['deletion', 'replacement', 'comment'];
  if (validTypes.includes(type)) {
    return type as 'deletion' | 'replacement' | 'comment';
  }
  // Default to 'comment' if invalid
  return 'comment';
}

/**
 * Apply an accepted suggestion to content (for future use)
 *
 * @param suggestion - The suggestion to apply
 * @param content - The original content
 * @returns Modified content with suggestion applied
 */
export async function acceptSuggestion(
  suggestion: AISuggestion,
  content: string
): Promise<string> {
  let result = content;

  if (suggestion.type === 'deletion') {
    // Remove the target text
    result = content.replace(suggestion.targetText, '');
  } else if (suggestion.type === 'replacement') {
    // Replace target text with suggested text
    result = content.replace(suggestion.targetText, suggestion.suggestedText || '');
  }
  // For 'comment' type, we don't modify content

  return result;
}

/**
 * Log a rejected suggestion (for future learning)
 *
 * @param suggestionId - ID of the rejected suggestion
 */
export async function rejectSuggestion(suggestionId: string): Promise<void> {
  // TODO: Implement logging for future learning/feedback
  console.log(`Suggestion ${suggestionId} rejected`);
}

/**
 * Get confidence label for display
 *
 * @param confidence - Confidence score (0-1)
 * @returns Human-readable label
 */
export function getConfidenceLabel(confidence: number): string {
  if (confidence >= 0.8) return 'Alta';
  if (confidence >= 0.5) return 'Média';
  return 'Baixa';
}
