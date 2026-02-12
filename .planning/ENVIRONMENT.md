# Environment and Secrets Policy

Documento canônico para variáveis de ambiente e segurança de segredos neste projeto.

## Regra Global

- Nunca compartilhar `.env` real com chaves por WhatsApp.
- Compartilhar somente `.env.example` (sem segredos).
- Cada pessoa cria seus arquivos locais com os próprios valores.

## Nomenclatura Oficial (usar os nomes reais do código)

### Frontend (Vite)

Use variáveis `VITE_*`:

```bash
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_URL=http://localhost:3001
```

### Server / Edge Functions

Use variáveis sem `VITE_`:

```bash
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Regra crítica:

- `SUPABASE_SERVICE_ROLE_KEY` nunca pode ir para frontend/desktop bundle.
- Use service role somente em backend/edge functions.

## Onde Configurar

- `apps/portal/.env.example` -> template do frontend portal
- `.env.example` -> template global de referência
- `supabase/functions/.env.example` -> template para edge functions
- Produção -> variáveis no provedor (ex.: Vercel) e secrets no Supabase

## Entrega Segura de Configuração

1. Envie `.env.example` + instruções.
2. Compartilhe segredos por canal seguro (gerenciador de senhas, cofre de secrets, etc.).
3. Evite copiar todas as chaves em uma única mensagem de chat.
4. Peça confirmação de criação do arquivo com nome correto (`.env` / `.env.local` sem `.txt`).
5. Confirme reinício da aplicação após configurar env.

## Causas Mais Comuns de Falha (Supabase)

1. Arquivo de env não carregado no processo correto
2. Nome da variável diferente do esperado pelo código
3. App não reiniciado após criar/editar env
4. Uso indevido de `SUPABASE_SERVICE_ROLE_KEY` no frontend

## Checklist de Revisão de Docs

- Variáveis listadas sem valores reais
- Prefixos corretos (`VITE_*` no frontend)
- Service role marcado como server-only
- Passo de reinício da aplicação presente
- Orientação explícita de compartilhamento seguro presente

