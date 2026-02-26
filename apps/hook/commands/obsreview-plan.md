---
description: Gerar plano e abrir revisão interativa (força persistência em .claude/plans)
allowed-tools: Write, Edit, MultiEdit
---

## Plano com revisão obrigatória

Você deve seguir esta ordem:

1. Gere o plano solicitado.
2. Antes de responder no chat, persista o plano com `Write` em:
   `/.claude/plans/<nome-do-plano>.md`
3. Só depois resuma o plano no chat.

Objetivo: garantir disparo do hook `plan-live` e abertura automática da UI de revisão.

