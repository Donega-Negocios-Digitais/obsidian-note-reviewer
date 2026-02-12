# Setup Local

Este guia cobre o setup mínimo para subir o app e validar conexão com Supabase sem expor segredos.

## 1. Pré-requisitos

- Bun 1.x
- Node.js 20+ (fallback/CI/tooling)
- Conta e projeto Supabase

## 2. Instalar dependências

```powershell
bun install
```

## 3. Criar arquivos de ambiente

Frontend (portal):

```powershell
Copy-Item apps/portal/.env.example apps/portal/.env.local
```

Template global (opcional para referência local):

```powershell
Copy-Item .env.example .env
```

Edge Functions (template de referência):

```powershell
Copy-Item supabase/functions/.env.example supabase/functions/.env.local
```

## 4. Preencher variáveis mínimas (Supabase frontend)

Em `apps/portal/.env.local`:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

Observação:

- Não usar `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- `SUPABASE_SERVICE_ROLE_KEY` é somente backend/edge.

## 5. Rodar aplicação

```powershell
bun run dev
```

## 6. Reiniciar após mudar env

Sempre reinicie o processo do Vite/dev server ao criar ou alterar `.env`/`.env.local`.

## 7. Troubleshooting rápido (Supabase)

Se Supabase não funciona, verificar nesta ordem:

1. `.env`/`.env.local` não está sendo carregado
2. Nome de variável incorreto (ex.: usar `SUPABASE_URL` em vez de `VITE_SUPABASE_URL` no frontend)
3. Aplicação não foi reiniciada após alterar variáveis
4. `SUPABASE_SERVICE_ROLE_KEY` foi usado no lugar errado (frontend)

## 8. Entrega segura para outra pessoa

1. Envie somente `*.env.example` e instruções.
2. Envie segredos por canal seguro (gerenciador de senhas preferencialmente).
3. Confirme que a pessoa criou arquivo exatamente como `.env`/`.env.local` e reiniciou o app.

