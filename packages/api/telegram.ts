/**
 * Telegram API Client
 *
 * Client for sending notifications via Telegram Bot API
 * through Supabase Edge Functions
 */

// ========================================
// Types
// ========================================

export interface TelegramSendParams {
  /** Telegram chat ID (user, group, or channel) */
  chatId: string;
  /** Message text to send */
  message: string;
  /** Parse mode for formatting (default: HTML) */
  parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
}

export interface TelegramSendSuccess {
  success: true;
  messageId: number;
  chatId: number;
}

export interface TelegramSendError {
  success: false;
  error: string;
  errorCode?: number;
}

export type TelegramSendResult = TelegramSendSuccess | TelegramSendError;

// ========================================
// Error Types
// ========================================

export class TelegramApiError extends Error {
  constructor(
    message: string,
    public readonly code?: number,
    public readonly originalError?: unknown
  ) {
    super(message);
    this.name = 'TelegramApiError';
  }
}

export class TelegramNetworkError extends Error {
  constructor(message: string, public readonly originalError?: unknown) {
    super(message);
    this.name = 'TelegramNetworkError';
  }
}

// ========================================
// Configuration
// ========================================

/**
 * Get Supabase function URL for Telegram
 * Falls back to environment variable or localhost
 */
function getTelegramFunctionUrl(): string {
  // Try Vite environment variable first
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (supabaseUrl) {
    // Convert client URL to functions URL
    // https://project.supabase.co -> https://project.supabase.co/functions/v1
    return `${supabaseUrl}/functions/v1/send-telegram`;
  }

  // Fallback for development
  console.warn('VITE_SUPABASE_URL not set, using localhost fallback');
  return 'http://localhost:54321/functions/v1/send-telegram';
}

/**
 * Get Supabase anon key for authentication
 */
function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
}

// ========================================
// Telegram API Client
// ========================================

/**
 * Send a message via Telegram Bot API through Supabase Edge Function
 *
 * @param params - Telegram send parameters
 * @returns Promise with send result
 *
 * @example
 * ```ts
 * const result = await sendTelegramNotification({
 *   chatId: '123456789',
 *   message: '<b>Hello!</b> from Telegram',
 *   parseMode: 'HTML'
 * });
 *
 * if (result.success) {
 *   console.log('Message sent:', result.messageId);
 * }
 * ```
 */
export async function sendTelegramNotification(
  params: TelegramSendParams
): Promise<TelegramSendResult> {
  const { chatId, message, parseMode = 'HTML' } = params;

  // Validate input
  if (!chatId || chatId.trim().length === 0) {
    return {
      success: false,
      error: 'chatId is required',
    };
  }

  if (!message || message.trim().length === 0) {
    return {
      success: false,
      error: 'message is required and cannot be empty',
    };
  }

  try {
    const functionUrl = getTelegramFunctionUrl();
    const anonKey = getSupabaseAnonKey();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Add Supabase auth if available
    if (anonKey) {
      headers['Authorization'] = `Bearer ${anonKey}`;
      headers['apikey'] = anonKey;
    }

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        chatId: chatId.trim(),
        message: message.trim(),
        parseMode,
      }),
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      const text = await response.text();
      throw new TelegramNetworkError(
        `Unexpected response format: ${contentType}`,
        { response: { status: response.status, body: text } }
      );
    }

    const data = await response.json();

    // Handle API errors
    if (!response.ok || !data.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to send Telegram message',
        errorCode: data.error_code || response.status,
      };
    }

    // Success
    return {
      success: true,
      messageId: data.messageId,
      chatId: data.chatId,
    };
  } catch (error) {
    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        success: false,
        error: 'Network error: Unable to reach Telegram service',
        errorCode: 0,
      };
    }

    // Our custom errors
    if (error instanceof TelegramApiError || error instanceof TelegramNetworkError) {
      return {
        success: false,
        error: error.message,
        errorCode: error instanceof TelegramApiError ? error.code : undefined,
      };
    }

    // Unknown errors
    return {
      success: false,
      error:
        error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Test connection to Telegram by sending a simple test message
 *
 * @param chatId - Chat ID to send test message to
 * @returns Promise with test result
 */
export async function testTelegramConnection(
  chatId: string
): Promise<TelegramSendResult> {
  return sendTelegramNotification({
    chatId,
    message: `✅ <b>Conexão Telegram funcionando!</b>\n\nObsidian Note Reviewer está conectado com sucesso.\n\n🕐 ${new Date().toLocaleString('pt-BR')}`,
    parseMode: 'HTML',
  });
}

/**
 * Format a Telegram notification message with placeholders
 *
 * Supported placeholders:
 * - {title} - Note title
 * - {url} - Note URL
 * - {noteType} - Type of note
 * - {timestamp} - Current timestamp
 * - {emoji} - Random emoji
 */
export interface TelegramMessageTemplate {
  template: string;
  variables: {
    title?: string;
    url?: string;
    noteType?: string;
    timestamp?: string;
    emoji?: string;
  };
}

export function formatTelegramMessage(
  template: string,
  variables: TelegramMessageTemplate['variables'] = {}
): string {
  const emoji = variables.emoji || getRandomNoteEmoji();
  const timestamp = variables.timestamp || new Date().toLocaleString('pt-BR');

  return template
    .replace('{emoji}', emoji)
    .replace('{title}', variables.title || 'Sem título')
    .replace('{url}', variables.url || '')
    .replace('{noteType}', variables.noteType || 'nota')
    .replace('{timestamp}', timestamp);
}

/**
 * Get a random emoji for notifications
 */
function getRandomNoteEmoji(): string {
  const emojis = ['📝', '📄', '📋', '📌', '📎', '🗂️', '📁', '✨', '🚀', '💡'];
  return emojis[Math.floor(Math.random() * emojis.length)];
}

/**
 * Default message template for Telegram notifications
 */
export const DEFAULT_TELEGRAM_TEMPLATE =
  '{emoji} <b>{title}</b>\n\n📝 {noteType}\n🔗 {url}\n\n🕐 {timestamp}';

/**
 * Validate Telegram chat ID format
 *
 * Chat IDs can be:
 * - User: 123456789 (positive integer)
 * - Group: -100123456789 (negative integer starting with -100)
 * - Channel: @channelname (username format)
 */
export function isValidChatId(chatId: string): boolean {
  if (!chatId || chatId.trim().length === 0) {
    return false;
  }

  const trimmed = chatId.trim();

  // Username format (@channelname)
  if (trimmed.startsWith('@')) {
    return /^@[a-zA-Z0-9_]{5,32}$/.test(trimmed);
  }

  // Numeric format (user or group)
  if (/^-?\d+$/.test(trimmed)) {
    const num = parseInt(trimmed, 10);
    // User IDs are positive, group/channel IDs are negative
    return num !== 0;
  }

  return false;
}

/**
 * Extract chat ID from various input formats
 */
export function normalizeChatId(input: string): string {
  return input.trim();
}
