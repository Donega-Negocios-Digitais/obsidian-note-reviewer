# Prompt para Claude Code - Integração Telegram Bot API

---

Copia e cola este prompt na extensão Claude Code para implementar a integração com Telegram:

---

## Implementar integração com Telegram Bot API

Quero implementar envio de notificações para o Telegram quando notas são criadas/revisadas no Obsidian Note Reviewer.

### Contexto do Projeto

**Monorepo structure:**
- `apps/portal/` - Frontend React (porta 3001)
- `apps/hook/` - Servidor local para Claude Code integration (porta 3000)
- `packages/ui/` - Componentes compartilhados
- `supabase/` - Edge Functions + Migrations

**Stack:** TypeScript + React + Vite + Bun + Supabase

**O que já existe:**
- ✅ `packages/ui/components/IntegrationsSettings.tsx` - UI para configurar Telegram (chat_id, customMessage, etc.)
- ✅ `packages/ui/utils/storage.ts` - Salva configurações no localStorage
- ✅ `apps/portal/src/hooks/useSubscription.ts` - Hook de Stripe
- ✅ Supabase configurado com Edge Functions

**O que falta implementar:**
- ❌ Edge Function para enviar mensagens ao Telegram
- ❌ Integração real (o teste atual é simulado)
- ❌ Trigger automático ao criar/revisar notas

---

### Requisitos

1. **Edge Function `/send-telegram`** em `supabase/functions/send-telegram/index.ts`
   - Recebe: `{ chatId, message, parseMode? }`
   - Usa: `TELEGRAM_BOT_TOKEN` das secrets do Supabase
   - Envia via Telegram Bot API: `https://api.telegram.org/bot<token>/sendMessage`
   - Retorna: sucesso/erro com status apropriado

2. **Cliente de envio** em `packages/api/telegram.ts`
   - Função `sendTelegramNotification(params)` que chama a Edge Function
   - Types TypeScript para request/response
   - Error handling

3. **Hook `useTelegramNotification`** em `apps/portal/src/hooks/useTelegramNotification.ts`
   - Lê configurações do `storage.ts` (getIntegrations)
   - Formata mensagem com customMessage + placeholders
   - Chama cliente se Telegram estiver enabled
   - Suporta placeholders: `{title}`, `{url}`, `{noteType}`, `{timestamp}`

4. **Integração no fluxo de criação de notas**
   - Chamar notificação após criação/revisão bem-sucedida
   - Respeitar flag `autoSendLink`
   - Não bloquear fluxo principal em caso de erro

5. **Teste real** em `IntegrationsSettings.tsx`
   - Substituir `testConnection` simulado por chamada real
   - Enviar mensagem de teste: "✅ Conexão Telegram funcionando!"

---

### Environment Variables

Adicionar ao Supabase (dashboard ou CLI):
```bash
supabase secrets set TELEGRAM_BOT_TOKEN=<token_do_botfather>
```

O frontend já tem estrutura para configurar:
- `target` → chat_id do usuário
- `customMessage` → mensagem customizada
- `autoSendLink` → boolean

---

### Fluxo Esperado

```
1. Usuário cria bot via @BotFather
2. Usuário inicia bot e obtém chat_id
3. Usuário configura chat_id nas Integrações Settings
4. Ao criar/revisar nota → useTelegramNotification envia mensagem
```

---

### Estrutura de Arquivos

```
supabase/
└── functions/
    └── send-telegram/
        └── index.ts          # NOVO - Edge Function

packages/
├── api/
│   └── telegram.ts           # NOVO - Cliente + Types
└── ui/
    └── components/
        └── IntegrationsSettings.tsx  # MODIFICAR - testConnection real

apps/portal/src/
├── hooks/
│   └── useTelegramNotification.ts    # NOVO - Hook de envio
└── services/
    └── notificationService.ts        # NOVO - Orquestrador
```

---

### Importante

- Manter padrão de código existente (TypeScript strict, error handling)
- Usar i18n para mensagens de erro/sucesso
- Logs via Pino (não console.log)
- Testes unitários para edge function e cliente
- Documentar como obter chat_id do Telegram

---

Começa implementando a Edge Function primeiro, depois o cliente e hook.
