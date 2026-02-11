# Plano Curto de Fechamento Tecnico (Banco + Rotas + Fluxos)

## Resumo

Este plano foi reduzido para execucao rapida antes do merge da branch.  
Foco: estabilidade de build, transparencia de risco (typecheck), e handoff claro para infra/gestao.

## Estado atual confirmado

1. Banco/Supabase: migracoes estruturais aplicadas e alinhadas (`001` a `009`).
2. Build portal: OK (`bun run --cwd apps/portal build`).
3. Typecheck: ainda falha em multiplos pacotes (`bunx tsc -p apps/portal/tsconfig.json --noEmit`).
4. Fluxos ja ajustados por codigo:
- compartilhamento por `notes.share_hash` + `notes.is_public`
- rota/base de deploy para portal no `vercel.json`
- perfil/senha com suporte correto para login OAuth

## Plano de execucao por prioridade

### P0 - Obrigatorio para estabilizar engenharia

1. Limpar erros de TypeScript por lotes sem mudar regra de negocio.
2. Priorizar primeiro:
- imports/aliases quebrados de workspace
- tipos de libs externas (Liveblocks/Stripe/Bun/Vercel)
- inconsistencias de tipos em hooks/componentes centrais do portal
3. Criterio de pronto:
- `bunx tsc -p apps/portal/tsconfig.json --noEmit` sem erros

### P1 - Confianca de fluxo do produto

1. Criar smoke test automatizado dos fluxos minimos:
- login
- criar/salvar nota
- compartilhar e abrir link
2. Revisar erro "Not Found" de compartilhamento em producao com logs (deploy/runtime).
3. Criterio de pronto:
- checklist automatizado rodando local/CI
- causa raiz do "Not Found" documentada

### P2 - Endurecimento e governanca

1. Revisar advisors de seguranca/performance no Supabase e fechar pendencias restantes.
2. Consolidar trilha de migracoes como fonte unica em `supabase/migrations`.
3. Criterio de pronto:
- sem alerta critico pendente de seguranca
- sem drift de migracao entre local e remoto

## Testes e validacao

1. Build: `bun run --cwd apps/portal build`.
2. Typecheck: `bunx tsc -p apps/portal/tsconfig.json --noEmit`.
3. Smoke manual minimo:
- login
- salvar nota e reabrir
- compartilhar e abrir `/shared/:slug`
- perfil: nome/foto/senha

## Assumptions e defaults

1. Entidade canonica de conteudo compartilhado: `notes`.
2. Compartilhamento canonico: `share_hash` + `is_public`.
3. Nao sera feito refactor amplo nesta rodada; foco em estabilizacao e release.

## Dependencias externas (nao-codigo)

1. Redeploy e variaveis de ambiente de producao no Vercel.
2. Acesso aos logs de producao para RCA.
3. Credenciais oficiais para integracoes externas.
