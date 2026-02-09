# Email Integration Documentation (Resend)

**Last Updated:** 2026-02-08
**Status:** ✅ Fully Implemented

## Overview

The Email Integration system allows users to send invites to collaborators via email using the Resend API. Supports both Viewer and Editor roles with customizable HTML templates.

## Features

- **Send Email Invites** - Invite users to collaborate on shared notes
- **Role-Based Templates** - Different templates for Viewer and Editor roles
- **Dynamic Variables** - Customize emails with document-specific information
- **HTML Templates** - Rich, styled email templates
- **API Integration** - Direct integration with Resend API

## Setup

### Environment Variables

Add to `.env` file:
```bash
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

Add to `.env.example`:
```bash
# Resend API Key for email invites
RESEND_API_KEY=your_resend_api_key_here
```

### Resend API Setup

1. Sign up at https://resend.com/
2. Create an API key
3. Add API key to `.env` file
4. Verify domain (if using custom domain)

## API Endpoint

### Location
`apps/portal/api/invite.ts`

### Method
POST

### Request Body
```typescript
interface InviteRequest {
  email: string;        // Recipient email address
  role: 'viewer' | 'editor';  // Collaborator role
  documentTitle: string;      // Document/note title
  documentSlug: string;       // Document slug for URL
  senderName: string;         // Sender's display name
}
```

### Response
```typescript
interface InviteResponse {
  success: boolean;
  message?: string;
  error?: string;
  messageId?: string;  // Resend message ID
}
```

## Email Templates

### Viewer Template
Used when inviting users with view-only access.

**Subject:** `{{senderName}} compartilhou uma nota com você`

**Content:**
- Welcome message
- Document title
- View-only access notice
- Link to view document
- Sender signature

### Editor Template
Used when inviting users with edit access.

**Subject:** `{{senderName}} convidou você para editar uma nota`

**Content:**
- Welcome message
- Document title
- Editor access notice
- Link to edit document
- Sender signature

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{senderName}}` | Sender's display name | "Alex Donega" |
| `{{documentTitle}}` | Document/note title | "My Project Plan" |
| `{{documentUrl}}` | URL to shared document | "https://r.alexdonega.com.br/plan/my-plan" |
| `{{role}}` | Access role (Viewer/Editor) | "Editor" |

## Usage in Collaboration Settings

### UI Location
Settings Panel → "Colaboração" tab

### Flow
1. User opens Collaboration Settings
2. Clicks "Enviar Convite" button
3. Fills in:
   - Email address
   - Role (Viewer/Editor)
4. Clicks "Enviar"
5. API call to `/api/invite`
6. Success/error message displayed
7. Invitee receives email with link

## Template Functions

### getViewerTemplate()
Generates HTML for viewer role invites.

```typescript
function getViewerTemplate(
  senderName: string,
  documentTitle: string,
  documentUrl: string
): string
```

**Template Features:**
- Professional design
- Responsive layout
- Call-to-action button
- View-only permissions notice

### getEditorTemplate()
Generates HTML for editor role invites.

```typescript
function getEditorTemplate(
  senderName: string,
  documentTitle: string,
  documentUrl: string
): string
```

**Template Features:**
- Professional design
- Responsive layout
- Call-to-action button
- Editor permissions notice

## Implementation Details

### API Handler
```typescript
// apps/portal/api/invite.ts

export async function POST(request: Request) {
  try {
    const { email, role, documentTitle, documentSlug, senderName } = await request.json();

    // Validate email
    if (!email || !isValidEmail(email)) {
      return Response.json({ error: 'Invalid email' }, { status: 400 });
    }

    // Select template based on role
    const template = role === 'editor'
      ? getEditorTemplate(senderName, documentTitle, documentUrl)
      : getViewerTemplate(senderName, documentTitle, documentUrl);

    // Send via Resend
    const data = await resend.emails.send({
      from: 'noreply@alexdonega.com.br',
      to: [email],
      subject: `{{senderName}} compartilhou uma nota com você`,
      html: template,
    });

    return Response.json({ success: true, messageId: data.id });
  } catch (error) {
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
```

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Missing API Key | RESEND_API_KEY not set | Add to .env file |
| Invalid Email | Email format incorrect | Validate before sending |
| Domain Not Verified | Custom domain not verified | Verify domain in Resend |
| Rate Limit | Too many emails sent | Wait before retrying |
| Template Error | HTML syntax error | Check template syntax |

### Error Responses
```typescript
// Missing API Key
{ error: 'RESEND_API_KEY not configured' }

// Invalid email
{ error: 'Invalid email address' }

// Resend API error
{ error: 'Failed to send email: <error message>' }
```

## Best Practices

1. **Validate email input** - Check format before sending
2. **Handle errors gracefully** - Show user-friendly messages
3. **Log API responses** - Track message IDs for debugging
4. **Rate limiting** - Prevent abuse (implement if needed)
5. **Template consistency** - Maintain brand guidelines
6. **Test before sending** - Use Resend's test mode

## Customization

### Modify Email Templates

Edit the template functions in `apps/portal/api/invite.ts`:

```typescript
function getViewerTemplate(
  senderName: string,
  documentTitle: string,
  documentUrl: string
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        /* Your custom styles */
      </style>
    </head>
    <body>
      <!-- Your custom HTML -->
    </body>
    </html>
  `;
}
```

### Change Sender Email

Modify the `from` field in the Resend API call:

```typescript
from: 'your-email@yourdomain.com',  // Change this
```

### Add Custom Variables

Add variables to template functions and use in HTML:

```typescript
function getViewerTemplate(
  senderName: string,
  documentTitle: string,
  documentUrl: string,
  customVar: string  // New variable
): string {
  return `
    <!-- HTML with {{customVar}} -->
  `;
}
```

## Translation Keys

Email-related UI text is translatable:

```json
{
  "collaboration": {
    "sendInvite": "Enviar Convite",
    "inviteEmail": "Email",
    "inviteRole": "Função",
    "inviteViewer": "Visualizador",
    "inviteEditor": "Editor",
    "inviteSent": "Convite enviado com sucesso!",
    "inviteError": "Erro ao enviar convite"
  }
}
```

## Security Considerations

1. **API Key Protection** - Never expose RESEND_API_KEY in client code
2. **Email Validation** - Validate email format on server
3. **Rate Limiting** - Implement to prevent spam
4. **Access Control** - Only authenticated users can send invites
5. **Domain Verification** - Verify sending domain in Resend

## Related Files

- `apps/portal/api/invite.ts` - API endpoint and templates
- `packages/ui/components/CollaborationSettings.tsx` - UI component
- `.env`, `.env.example` - Environment variables
- `packages/collaboration/src/collaborators.ts` - Collaborator management

## Troubleshooting

**Emails not sending?**
- Verify RESEND_API_KEY is set correctly
- Check Resend dashboard for API errors
- Ensure domain is verified (if using custom domain)

**Template not rendering?**
- Check HTML syntax
- Verify CSS is inline (email client limitation)
- Test in different email clients

**Invites not received?**
- Check spam/junk folder
- Verify recipient email address
- Check Resend dashboard delivery status

---

*For more information, see the Resend API documentation: https://resend.com/docs/api-reference*
