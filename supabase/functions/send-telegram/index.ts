/**
 * Supabase Edge Function - Send Telegram Message
 *
 * Sends messages to Telegram via Bot API
 * Endpoint: /functions/v1/send-telegram
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

// Types for Telegram API
interface TelegramMessageRequest {
  chatId: string;
  message: string;
  parseMode?: 'Markdown' | 'MarkdownV2' | 'HTML';
}

interface TelegramSendResponse {
  ok: boolean;
  result?: {
    message_id: number;
    chat: {
      id: number;
      type: string;
    };
    date: number;
    text: string;
  };
  error_code?: number;
  description?: string;
}

interface TelegramError {
  error_code: number;
  description: string;
}

serve(async (req) => {
  // CORS headers from shared allowlist
  const corsHeaders = getCorsHeaders(req);

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  try {
    // Parse request body
    const { chatId, message, parseMode = 'HTML' }: TelegramMessageRequest =
      await req.json();

    // Validation
    if (!chatId) {
      return new Response(
        JSON.stringify({ error: 'chatId is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!message || message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'message is required and cannot be empty' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get bot token from environment
    const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Telegram bot not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Send message to Telegram Bot API
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const telegramPayload = {
      chat_id: chatId,
      text: message,
      parse_mode: parseMode,
      disable_web_page_preview: false,
    };

    const response = await fetch(telegramUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(telegramPayload),
    });

    const data: TelegramSendResponse = await response.json();

    if (!data.ok) {
      const errorMsg = data.description || 'Unknown Telegram API error';
      console.error('Telegram API error:', {
        error_code: data.error_code,
        description: errorMsg,
        chatId,
      });

      return new Response(
        JSON.stringify({
          error: errorMsg,
          error_code: data.error_code,
        }),
        {
          status: response.status || 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Success response
    return new Response(
      JSON.stringify({
        success: true,
        messageId: data.result?.message_id,
        chatId: data.result?.chat.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Unexpected error in send-telegram:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
