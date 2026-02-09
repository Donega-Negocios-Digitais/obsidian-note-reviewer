/**
 * Hook: useTelegramNotification
 *
 * Hook for sending Telegram notifications based on user configuration
 */

import { useCallback, useMemo, useState } from 'react';
import {
  sendTelegramNotification,
  testTelegramConnection,
  formatTelegramMessage,
  DEFAULT_TELEGRAM_TEMPLATE,
  type TelegramSendResult,
} from '../../../../packages/api/telegram';
import { getIntegrations, type IntegrationConfig } from '../../../../packages/ui/utils/storage';

// ========================================
// Types
// ========================================

export interface TelegramNotificationParams {
  /** Note title */
  title: string;
  /** Note URL (for sharing) */
  url: string;
  /** Note type (template name) */
  noteType?: string;
  /** Custom message template (optional, uses config if not provided) */
  customMessage?: string;
}

export interface TelegramNotificationState {
  isSending: boolean;
  lastResult: TelegramSendResult | null;
  error: string | null;
}

export interface UseTelegramNotificationReturn {
  /** Send notification to Telegram */
  sendNotification: (params: TelegramNotificationParams) => Promise<TelegramSendResult>;
  /** Test Telegram connection */
  testConnection: () => Promise<TelegramSendResult>;
  /** Current state */
  state: TelegramNotificationState;
  /** Check if Telegram is configured */
  isConfigured: boolean;
  /** Get Telegram configuration */
  config: IntegrationConfig | null;
}

// ========================================
// Hook
// ========================================

/**
 * Hook for sending Telegram notifications
 *
 * @example
 * ```tsx
 * const { sendNotification, isConfigured, state } = useTelegramNotification();
 *
 * await sendNotification({
 *   title: 'My Plan',
 *   url: 'https://r.alexdonega.com.br/plan/my-plan',
 *   noteType: 'plan'
 * });
 * ```
 */
export function useTelegramNotification(): UseTelegramNotificationReturn {
  const logger = useMemo(
    () => ({
      debug: (...args: unknown[]) => console.debug(...args),
      info: (...args: unknown[]) => console.info(...args),
      warn: (...args: unknown[]) => console.warn(...args),
      error: (...args: unknown[]) => console.error(...args),
    }),
    []
  );
  const [state, setState] = useState<TelegramNotificationState>({
    isSending: false,
    lastResult: null,
    error: null,
  });

  // Get Telegram configuration from storage
  const getConfig = useCallback((): IntegrationConfig | null => {
    const integrations = getIntegrations();
    return integrations.find((i) => i.type === 'telegram') || null;
  }, []);

  // Check if Telegram is configured and enabled
  const isConfigured = Boolean(
    getConfig()?.enabled && getConfig()?.config.target
  );

  const config = getConfig();

  /**
   * Send notification to Telegram
   */
  const sendNotification = useCallback(
    async (params: TelegramNotificationParams): Promise<TelegramSendResult> => {
      const telegramConfig = getConfig();

      // Check if Telegram is enabled
      if (!telegramConfig?.enabled) {
        logger.debug('Telegram integration is disabled');
        return {
          success: false,
          error: 'Telegram integration is not enabled',
        };
      }

      // Check if chat ID is configured
      const chatId = telegramConfig.config.target;
      if (!chatId || chatId.trim().length === 0) {
        logger.warn('Telegram chatId not configured');
        return {
          success: false,
          error: 'Telegram chat ID is not configured',
        };
      }

      setState((prev) => ({ ...prev, isSending: true, error: null }));

      try {
        // Use custom message from params or from config
        const template =
          params.customMessage ||
          telegramConfig.config.customMessage ||
          DEFAULT_TELEGRAM_TEMPLATE;

        // Format message with variables
        const message = formatTelegramMessage(template, {
          title: params.title,
          url: params.url,
          noteType: params.noteType || 'nota',
          timestamp: new Date().toLocaleString('pt-BR'),
        });

        // Check autoSendLink setting
        if (!telegramConfig.config.autoSendLink) {
          logger.debug('Telegram autoSendLink is disabled, skipping notification');
          setState((prev) => ({ ...prev, isSending: false }));
          return {
            success: false,
            error: 'Auto-send is disabled in settings',
          };
        }

        // Send notification
        logger.info('Sending Telegram notification', { chatId, title: params.title });
        const result = await sendTelegramNotification({
          chatId,
          message,
        });

        setState((prev) => ({
          ...prev,
          isSending: false,
          lastResult: result,
          error: result.success ? null : result.error,
        }));

        if (result.success) {
          logger.info('Telegram notification sent successfully', {
            messageId: result.messageId,
          });
        } else {
          logger.warn('Failed to send Telegram notification', {
            error: result.error,
            errorCode: result.errorCode,
          });
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        logger.error('Unexpected error sending Telegram notification', {
          error: errorMessage,
        });

        setState((prev) => ({
          ...prev,
          isSending: false,
          error: errorMessage,
        }));

        return {
          success: false,
          error: errorMessage,
        };
      }
    },
    [getConfig, logger]
  );

  /**
   * Test Telegram connection
   */
  const testConnection = useCallback(async (): Promise<TelegramSendResult> => {
    const telegramConfig = getConfig();

    if (!telegramConfig?.config.target) {
      return {
        success: false,
        error: 'Telegram chat ID is not configured',
      };
    }

    setState((prev) => ({ ...prev, isSending: true, error: null }));

    try {
      logger.info('Testing Telegram connection', {
        chatId: telegramConfig.config.target,
      });

      const result = await testTelegramConnection(telegramConfig.config.target);

      setState((prev) => ({
        ...prev,
        isSending: false,
        lastResult: result,
        error: result.success ? null : result.error,
      }));

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      logger.error('Unexpected error testing Telegram connection', {
        error: errorMessage,
      });

      setState((prev) => ({
        ...prev,
        isSending: false,
        error: errorMessage,
      }));

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, [getConfig, logger]);

  return {
    sendNotification,
    testConnection,
    state,
    isConfigured,
    config,
  };
}

// ========================================
// Utility Functions
// ========================================

/**
 * Check if user has Telegram configured
 */
export function hasTelegramConfigured(): boolean {
  const integrations = getIntegrations();
  const telegram = integrations.find((i) => i.type === 'telegram');
  return Boolean(telegram?.enabled && telegram?.config.target);
}

/**
 * Get Telegram chat ID
 */
export function getTelegramChatId(): string | null {
  const integrations = getIntegrations();
  const telegram = integrations.find((i) => i.type === 'telegram');
  return telegram?.config.target || null;
}
