interface InvitePayload {
  email: string;
  role: 'viewer' | 'editor';
  inviterName: string;
  documentTitle: string;
  inviteUrl: string;
}

function getViewerTemplate(inviterName: string, documentTitle: string, inviteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="padding:40px 48px 32px;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#111827;">Você foi convidado para visualizar</h1>
          <p style="margin:0 0 24px;font-size:16px;color:#6b7280;">
            <strong style="color:#111827;">${inviterName}</strong> convidou você para visualizar o documento
            <strong style="color:#111827;">"${documentTitle}"</strong>.
          </p>
          <p style="margin:0 0 32px;font-size:14px;color:#6b7280;">
            Como visualizador, você poderá ler o documento e acompanhar as anotações.
          </p>
          <a href="${inviteUrl}" style="display:inline-block;padding:14px 28px;background:#111827;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
            Ver Documento
          </a>
        </td></tr>
        <tr><td style="padding:24px 48px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Se você não esperava este convite, pode ignorar este email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function getEditorTemplate(inviterName: string, documentTitle: string, inviteUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="padding:40px 48px 32px;">
          <h1 style="margin:0 0 8px;font-size:24px;font-weight:600;color:#111827;">Você foi convidado para colaborar</h1>
          <p style="margin:0 0 24px;font-size:16px;color:#6b7280;">
            <strong style="color:#111827;">${inviterName}</strong> convidou você para anotar e comentar em
            <strong style="color:#111827;">"${documentTitle}"</strong>.
          </p>
          <p style="margin:0 0 32px;font-size:14px;color:#6b7280;">
            Como editor, você poderá adicionar anotações, comentários e sugestões ao documento.
          </p>
          <a href="${inviteUrl}" style="display:inline-block;padding:14px 28px;background:#111827;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px;">
            Começar a Colaborar
          </a>
        </td></tr>
        <tr><td style="padding:24px 48px;border-top:1px solid #f3f4f6;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">
            Se você não esperava este convite, pode ignorar este email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json() as InvitePayload;
    const { email, role, inviterName, documentTitle, inviteUrl } = body;

    if (!email || !role || !inviterName || !documentTitle || !inviteUrl) {
      return Response.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return Response.json({ error: 'RESEND_API_KEY não configurada' }, { status: 500 });
    }

    const subject = role === 'editor'
      ? `Você foi convidado para colaborar em "${documentTitle}"`
      : `Você foi convidado para visualizar "${documentTitle}"`;

    const html = role === 'editor'
      ? getEditorTemplate(inviterName, documentTitle, inviteUrl)
      : getViewerTemplate(inviterName, documentTitle, inviteUrl);

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Note Reviewer <onboarding@resend.dev>',
        to: email,
        subject,
        html,
      }),
    });

    const data = await res.json() as { id?: string; name?: string; message?: string };

    if (!res.ok) {
      console.error('Resend error:', data);
      return Response.json({ error: data.message || 'Erro ao enviar email' }, { status: 500 });
    }

    return Response.json({ success: true, id: data.id });
  } catch (err) {
    console.error('Invite endpoint error:', err);
    return Response.json({ error: 'Erro interno' }, { status: 500 });
  }
}
