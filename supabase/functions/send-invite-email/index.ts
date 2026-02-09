/**
 * Supabase Edge Function - Send Invite Email
 *
 * Sends collaboration invite emails via Resend.
 * Endpoint: /functions/v1/send-invite-email
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

type InviteRole = 'viewer' | 'editor';

interface InvitePayload {
  email: string;
  role: InviteRole;
  inviterName: string;
  documentTitle: string;
  inviteUrl: string;
}

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getInviteHtml(payload: InvitePayload): string {
  const inviter = escapeHtml(payload.inviterName);
  const docTitle = escapeHtml(payload.documentTitle);
  const inviteUrl = escapeHtml(payload.inviteUrl);
  const isEditor = payload.role === 'editor';

  return `
<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  </head>
  <body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
      <tr>
        <td align="center">
          <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
            <tr>
              <td style="padding:40px 48px 32px;">
                <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#111827;">
                  ${isEditor ? 'Você foi convidado para colaborar' : 'Você foi convidado para visualizar'}
                </h1>
                <p style="margin:0 0 24px;font-size:16px;color:#6b7280;">
                  <strong style="color:#111827;">${inviter}</strong>
                  convidou você para ${isEditor ? 'anotar e comentar em' : 'visualizar o documento'}
                  <strong style="color:#111827;">"${docTitle}"</strong>.
                </p>
                <p style="margin:0 0 32px;font-size:14px;color:#6b7280;">
                  ${isEditor
                    ? 'Como editor, você poderá adicionar anotações, comentários e sugestões ao documento.'
                    : 'Como visualizador, você poderá ler o documento e acompanhar as anotações.'}
                </p>
                <a href="${inviteUrl}" style="display:inline-block;padding:14px 28px;background:#111827;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
                  ${isEditor ? 'Começar a Colaborar' : 'Ver Documento'}
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 48px;border-top:1px solid #f3f4f6;">
                <p style="margin:0;font-size:12px;color:#9ca3af;">
                  Se você não esperava este convite, pode ignorar este email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function isValidPayload(payload: InvitePayload): boolean {
  if (!payload.email || !payload.inviterName || !payload.documentTitle || !payload.inviteUrl) {
    return false;
  }

  if (payload.role !== 'viewer' && payload.role !== 'editor') {
    return false;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(payload.email)) {
    return false;
  }

  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const payload = await req.json() as InvitePayload;
    if (!isValidPayload(payload)) {
      return new Response(
        JSON.stringify({ error: 'Payload de convite inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const subject = payload.role === 'editor'
      ? `Você foi convidado para colaborar em "${payload.documentTitle}"`
      : `Você foi convidado para visualizar "${payload.documentTitle}"`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Note Reviewer <onboarding@resend.dev>',
        to: payload.email,
        subject,
        html: getInviteHtml(payload),
      }),
    });

    const resendData = await resendResponse.json() as ResendResponse;

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({
          error: resendData.message || resendData.name || 'Erro ao enviar email',
        }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: 'Erro interno',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
