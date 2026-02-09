/**
 * Notification Service
 *
 * Orchestrates sending notifications to various platforms (Telegram, etc.)
 * based on user configuration.
 */

import {
  sendTelegramNotification,
  formatTelegramMessage,
  DEFAULT_TELEGRAM_TEMPLATE,
} from '../../../../packages/api/telegram';
import { getIntegrations } from '../../../../packages/ui/utils/storage';

// ========================================
// Types
// ========================================

export interface NotificationPayload {
  /** Title of the note/document */
  title: string;
  /** URL to share */
  url: string;
  /** Type of note */
  noteType?: string;
  /** Custom message template (overrides default) */
  customMessage?: string;
}

export interface NotificationResult {
  platform: string;
  success: boolean;
  error?: string;
}

// ========================================
// Notification Service
// ========================================

/**
 * Send notifications to all enabled platforms
 *
 * @param payload - Notification data
 * @returns Promise with results for each platform
 */
export async function sendNotifications(
  payload: NotificationPayload
): Promise<NotificationResult[]> {
  const integrations = getIntegrations();
  const results: NotificationResult[] = [];

  // Process each enabled integration
  for (const integration of integrations) {
    if (!integration.enabled || !integration.config.autoSendLink) {
      continue;
    }

    // Skip if no target configured
    if (!integration.config.target || integration.config.target.trim().length === 0) {
      continue;
    }

    try {
      switch (integration.type) {
        case 'telegram': {
          const telegramResult = await sendTelegramNotification({
            chatId: integration.config.target,
            message: formatTelegramMessage(
              integration.config.customMessage || DEFAULT_TELEGRAM_TEMPLATE,
              {
                title: payload.title,
                url: payload.url,
                noteType: payload.noteType || 'note',
                timestamp: new Date().toLocaleString('pt-BR'),
              }
            ),
          });

          results.push({
            platform: 'telegram',
            success: telegramResult.success,
            error: telegramResult.success ? undefined : telegramResult.error,
          });
          break;
        }

        case 'whatsapp':
          // TODO: Implement WhatsApp integration
          // Currently skipped - will be implemented separately
          break;

        default:
          console.warn(`Unknown integration type: ${integration.type}`);
      }
    } catch (error) {
      results.push({
        platform: integration.type,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * Send notification to a specific platform
 *
 * @param platform - Platform name ('telegram' or 'whatsapp')
 * @param payload - Notification data
 * @returns Promise with result
 */
export async function sendNotificationToPlatform(
  platform: 'telegram' | 'whatsapp',
  payload: NotificationPayload
): Promise<NotificationResult> {
  const integrations = getIntegrations();
  const integration = integrations.find((i) => i.type === platform);

  if (!integration?.enabled) {
    return {
      platform,
      success: false,
      error: `${platform} integration is not enabled`,
    };
  }

  if (!integration.config.target || integration.config.target.trim().length === 0) {
    return {
      platform,
      success: false,
      error: `${platform} target is not configured`,
    };
  }

  if (!integration.config.autoSendLink) {
    return {
      platform,
      success: false,
      error: `${platform} auto-send is disabled`,
    };
  }

  switch (platform) {
    case 'telegram': {
      const result = await sendTelegramNotification({
        chatId: integration.config.target,
        message: formatTelegramMessage(
          integration.config.customMessage || DEFAULT_TELEGRAM_TEMPLATE,
          {
            title: payload.title,
            url: payload.url,
            noteType: payload.noteType || 'note',
            timestamp: new Date().toLocaleString('pt-BR'),
          }
        ),
      });

      return {
        platform: 'telegram',
        success: result.success,
        error: result.success ? undefined : result.error,
      };
    }

    case 'whatsapp':
      return {
        platform: 'whatsapp',
        success: false,
        error: 'WhatsApp integration not yet implemented',
      };

    default:
      return {
        platform,
        success: false,
        error: `Unknown platform: ${platform}`,
      };
  }
}

/**
 * Check if any notification platform is configured and enabled
 */
export function hasAnyNotificationEnabled(): boolean {
  const integrations = getIntegrations();
  return integrations.some(
    (i) => i.enabled && i.config.autoSendLink && i.config.target
  );
}

/**
 * Get list of enabled notification platforms
 */
export function getEnabledPlatforms(): string[] {
  const integrations = getIntegrations();
  return integrations
    .filter((i) => i.enabled && i.config.autoSendLink && i.config.target)
    .map((i) => i.type);
}
