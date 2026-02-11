# Status de Entrega e Pendencias (2026-02-11)

## Snapshot validado agora

1. Build do portal: OK
- comando: `bun run --cwd apps/portal build`
- resultado: concluido sem erro

2. Typecheck do portal/monorepo: com falhas conhecidas
- comando: `bunx tsc -p apps/portal/tsconfig.json --noEmit`
- resultado: falha em multiplos pacotes
- grupos de erro mais frequentes:
  - modulos/tipos ausentes (`bun:test`, `@vercel/node`, aliases de workspace)
  - incompatibilidades de tipos em componentes/hooks
  - uso de APIs/assinaturas desatualizadas (Liveblocks, Stripe, exports internos)

## O que ja foi concluido

1. Banco Supabase alinhado com migracoes e hardening principal (`001` a `009`).
2. Fluxo de compartilhamento alinhado para `notes.is_public` + `notes.share_hash`.
3. Ajustes de rotas/autenticacao e fluxo de assinatura nos arquivos principais do portal.
4. Build/deploy ajustado:
- `apps/portal/package.json` com `@stripe/stripe-js`
- `apps/portal/tsconfig.json` e `apps/portal/vite.config.ts` com aliases corrigidos
- `vercel.json` com `buildCommand: "bun run build:portal"`
5. Perfil/Senha ajustado para OAuth em `packages/ui/components/ProfileSettings.tsx`.

## Pendencias tecnicas (ainda por codigo)

1. Limpar erros de TypeScript por prioridade sem alterar regra de negocio.
2. Criar smoke test automatizado para login, salvar nota e compartilhar.
3. Investigar "Not Found" no compartilhamento em producao via logs de deploy/runtime.

## O que depende de chefe/infra

1. Publicar/redeploy no Vercel com variaveis corretas de ambiente.
2. Validar ambiente de producao:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- chaves Stripe de producao (se checkout ativo)
3. Liberar/fornecer acesso de logs para RCA de erro em producao.
4. Concluir integracoes externas (Telegram/WhatsApp/Notion) com credenciais oficiais.

## Checklist de release da branch

1. `git status --short` revisado.
2. `bun run --cwd apps/portal build` OK.
3. `bunx tsc -p apps/portal/tsconfig.json --noEmit` executado e status documentado (ainda falha).
4. Docs de handoff atualizadas:
- `docs/status-entrega-e-pendencias.md`
- `docs/plano-auditoria-banco-rotas-fluxos.md`
5. QA manual minimo executado:
- login
- criar/salvar nota
- abrir link compartilhado
- editar perfil (nome/foto/senha)

## Arquivos de referencia desta etapa

- `packages/ui/components/ProfileSettings.tsx`
- `apps/portal/package.json`
- `apps/portal/tsconfig.json`
- `apps/portal/vite.config.ts`
- `vercel.json`

