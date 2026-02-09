# Telegram Integration Setup

This guide explains how to set up Telegram integration for Obsidian Note Reviewer.

## Overview

The Telegram integration allows you to receive notifications when notes are created or reviewed. Messages are sent via a Telegram Bot through the Bot API.

## Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────┐
│  Frontend       │      │  Supabase Edge   │      │  Telegram    │
│  (Integrations) │─────▶│  Function        │─────▶│  Bot API     │
│  SettingsPanel  │      │  /send-telegram  │      │              │
└─────────────────┘      └──────────────────┘      └──────────────┘
```

## Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow the prompts to:
   - Choose a name for your bot (e.g., "Note Reviewer Bot")
   - Choose a username (e.g., `my_note_reviewer_bot`)
4. BotFather will give you a **Bot Token** - save it!

Example token format:
```
123456789:ABCdefGHIjklMNOpqrsTUVwxyz
```

## Step 2: Get Your Chat ID

You need to obtain your Telegram Chat ID to send messages to yourself.

### Option A: Using a simple bot (easiest)

1. Search for **@userinfobot** in Telegram
2. Send any message (e.g., `/start`)
3. The bot will reply with your **ID** - this is your Chat ID

### Option B: Using the Bot API

1. Open your browser and visit:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
   Replace `<YOUR_BOT_TOKEN>` with your actual token.

2. Send a message to your bot in Telegram (any message like `/start`)

3. Refresh the browser URL - you'll see JSON with your chat ID:
   ```json
   {
     "message": {
       "chat": {
         "id": 123456789,
         "first_name": "Your Name"
       }
     }
   }
   ```

### Chat ID Formats

| Type | Format | Example |
|------|--------|---------|
| Personal chat | Positive integer | `123456789` |
| Group | Negative starting with -100 | `-1001234567890` |
| Channel/username | @username | `@mychannel` |

## Step 3: Configure in Supabase

Set your bot token as an environment variable in Supabase:

### Using Supabase CLI:
```bash
supabase secrets set TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### Using Supabase Dashboard:
1. Go to your project settings
2. Navigate to "Edge Functions"
3. Add a new secret:
   - Name: `TELEGRAM_BOT_TOKEN`
   - Value: your bot token from Step 1

## Step 4: Deploy the Edge Function

The edge function is already created at:
```
supabase/functions/send-telegram/index.ts
```

Deploy it:
```bash
supabase functions deploy send-telegram
```

## Step 5: Configure in the App

1. Open Obsidian Note Reviewer
2. Go to **Settings** → **Integrations**
3. Find the **Telegram** card
4. Click the **Settings (⚙️)** icon
5. Configure:
   - **Chat ID**: Enter your chat ID from Step 2
   - **Custom Message** (optional): Customize the notification message
   - **Auto Send Link**: Enable to automatically send notifications
6. Click **Save**
7. Enable the integration with the toggle
8. Click **Test** to verify it works

## Testing

After configuration, click the **Test** button in the Telegram integration card. You should receive a message like:

```
✅ Conexão Telegram funcionando!

Obsidian Note Reviewer está conectado com sucesso.

🕐 08/02/2026 14:30:00
```

## Custom Message Templates

You can customize the notification message using these placeholders:

| Placeholder | Description |
|------------|-------------|
| `{emoji}` | Random note emoji |
| `{title}` | Note title |
| `{url}` | Note URL |
| `{noteType}` | Type of note |
| `{timestamp}` | Current timestamp |

### Default Template:
```
{emoji} {title}

📝 {noteType}
🔗 {url}

🕐 {timestamp}
```

### Example Custom Template:
```
📄 Nova nota: {title}

Tipo: {noteType}
Link: {url}

Acesse para revisar!
```

## Troubleshooting

### "Chat not found" error
- Make sure you've started a conversation with your bot (send `/start`)
- Double-check your Chat ID is correct
- For groups/channels, make sure the bot is added as an admin

### "Bot was blocked by the user" error
- You may have blocked the bot - unblock it in Telegram
- Start a new conversation with `/start`

### No message received
- Check that the integration is enabled
- Verify `autoSendLink` is turned on
- Check browser console for errors
- Verify Supabase Edge Function is deployed

### Edge Function not working
- Verify `TELEGRAM_BOT_TOKEN` is set in Supabase secrets
- Check Edge Function logs in Supabase dashboard
- Ensure the function is deployed: `supabase functions list`

## Security Notes

- **Never share your Bot Token publicly** - it gives full control of your bot
- Store the token as an environment variable, not in code
- The Bot Token should only be used server-side (Edge Functions)
- Chat IDs are not sensitive - they can be shared in logs

## API Reference

### Edge Function: `/send-telegram`

**Endpoint:** `POST /functions/v1/send-telegram`

**Request Body:**
```json
{
  "chatId": "123456789",
  "message": "Your message here",
  "parseMode": "HTML"
}
```

**Response (Success):**
```json
{
  "success": true,
  "messageId": 1234,
  "chatId": 123456789
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Error description",
  "error_code": 400
}
```

## Next Steps

- Configure Webhook for real-time updates (optional)
- Add support for sending images/files
- Implement command handling from Telegram to the app

## Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots#botfather)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
