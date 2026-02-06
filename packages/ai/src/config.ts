/**
 * AI Configuration Management
 *
 * Manages AI feature configuration with localStorage persistence.
 * Handles API keys, suggestion settings, and user preferences.
 */

import type { SuggestionConfig } from './types';

const STORAGE_KEY = 'obsreview-ai-config';

const DEFAULT_CONFIG: SuggestionConfig = {
  enabled: true,
  sensitivity: 'medium',
  maxSuggestions: 10,
  suggestionTypes: ['replacement', 'comment'],
};

/**
 * Get the current AI configuration from localStorage
 *
 * @returns Current configuration with defaults applied
 */
export function getAIConfig(): SuggestionConfig {
  if (typeof window === 'undefined') return DEFAULT_CONFIG;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Update AI configuration with partial updates
 *
 * @param updates - Partial configuration to update
 * @returns Updated complete configuration
 */
export function updateAIConfig(updates: Partial<SuggestionConfig>): SuggestionConfig {
  const current = getAIConfig();
  const updated = { ...current, ...updates };

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }

  return updated;
}

/**
 * Set the Anthropic API key
 *
 * @param apiKey - The API key to store
 */
export function setAPIKey(apiKey: string): void {
  updateAIConfig({ apiKey });
}

/**
 * Get the stored Anthropic API key
 *
 * @returns The API key or undefined if not set
 */
export function getAPIKey(): string | undefined {
  return getAIConfig().apiKey;
}

/**
 * Clear the stored API key
 *
 * Useful for logout or security purposes
 */
export function clearAPIKey(): void {
  const config = getAIConfig();
  delete config.apiKey;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  }
}

/**
 * Reset AI configuration to defaults
 *
 * Clears all user settings and returns to default state
 */
export function resetAIConfig(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
  }
}

/**
 * Check if AI features are enabled
 *
 * @returns true if AI suggestions are enabled
 */
export function isAIEnabled(): boolean {
  return getAIConfig().enabled;
}

/**
 * Enable or disable AI features
 *
 * @param enabled - Whether to enable AI features
 */
export function setAIEnabled(enabled: boolean): void {
  updateAIConfig({ enabled });
}
