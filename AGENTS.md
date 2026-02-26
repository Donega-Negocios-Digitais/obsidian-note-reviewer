# AGENTS.md

Este arquivo e a fonte de verdade para o comportamento dos agentes neste repositorio.
Use este documento como base para Claude Code, OpenCode, Codex CLI e outras CLIs.

## Objetivo

Padronizar o fluxo de revisao de planos/notas com UI interativa e hooks.

## Fluxo padrao de hooks

1. `PostToolUse` + `Write` chama `obsreview plan-live` para arquivos `/.claude/plans/` (fluxo principal, continuo, antes do `Ready to code`).
2. `PostToolUse` + `Write` chama `obsreview obsidian` para notas de plano no vault (`Plans/`, `.obsidian/plans/`, `plan/`), com exclusao de `/.claude/plans/`.
3. `PermissionRequest` + `ExitPlanMode` chama `obsreview plan` apenas como fallback.
4. Revisao manual de markdown usa `obsreview annotate <arquivo.md>` (ou `obsreview nota <arquivo.md>`).

## Regra obrigatoria para planos

- Sempre que o agente gerar um plano, ele deve primeiro persistir o plano com `Write` em `/.claude/plans/<nome-do-plano>.md`.
- Depois de persistir, ele pode resumir o plano no chat.
- Objetivo: garantir disparo automatico do hook `plan-live` sem depender de instrucao manual do usuario.
- Se o agente responder apenas no chat (sem `Write`/`Edit`/`MultiEdit` no arquivo de plano), a UI de review nao abre.
- Para maior confiabilidade operacional, prefira `/obsreview-plan` (ou `/obsreview-plano`) ao solicitar planos.

## Observabilidade local

- Logs repetidos em `GET /api/plan` e `GET /api/session/decision` durante revisao ao vivo sao esperados (polling normal do fluxo continuo).

## Onboarding por contexto de uso

1. **Portal Web (`apps/portal`)**
- Nao exige instalacao de plugin local.
- Exige login para usar `/editor` (rota protegida).
- Acao principal de persistencia: `Salvar no app` (banco / Meus Documentos).

2. **Hook/CLI (`apps/hook`)**
- Exige instalacao do binario `obsreview` + hooks no Claude Code.
- Nao exige login para fluxo local.
- Acoes principais: `Enviar para Claude` (revisao) e `Salvar no Obsidian` (vault local).

## Contrato de salvamento de notas (3 niveis independentes)

1. `Salvar no app`: persiste no banco da aplicacao.
2. `Salvar no Obsidian`: grava markdown local via `POST /api/save`.
3. `Enviar para Claude`: envia feedback no fluxo de review de hooks.

Regras:
- Falha em um destino nao pode bloquear os outros destinos.
- `Enviar para Claude` nao deve aparecer no portal nesta fase.
- `Salvar no Obsidian` deve validar path e bloquear traversal.

## Contrato de distribuicao

- Marketplace Claude Code: [`.claude-plugin/marketplace.json`](./.claude-plugin/marketplace.json)
- Metadados do plugin: [`apps/hook/.claude-plugin/plugin.json`](./apps/hook/.claude-plugin/plugin.json)
- Hooks: [`apps/hook/hooks`](./apps/hook/hooks)
- Slash commands: [`apps/hook/commands`](./apps/hook/commands)
- Instaladores de CLI: [`scripts/install.sh`](./scripts/install.sh), [`scripts/install.ps1`](./scripts/install.ps1), [`scripts/install.cmd`](./scripts/install.cmd)

## Instalacao padrao (Claude Code)

```text
/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer
/plugin install obsreview@obsidian-note-reviewer
```

## Producao e colaboracao

- O binario `obsreview` deve estar publicado em GitHub Releases.
- A revisao colaborativa em nuvem exige variaveis de ambiente de backend (ex.: Supabase) no ambiente de deploy.
- Sem essas variaveis, o app continua funcional em modo local (hooks + feedback local).

## Multi-CLI

- `CLAUDE.md` deve apenas apontar para este arquivo.
- Para novas CLIs, criar um arquivo de entrada leve que referencie `AGENTS.md` sem duplicar regras.

## Compatibilidade e rollback

- Alias legado de CLI: `obsidian-note-reviewer` mapeia para os mesmos subcomandos de `obsreview`.
- Flag de rollback: `OBSREVIEW_PLAN_REVIEW_MODE=exitplan` desativa `plan-live` e volta ao fluxo de `ExitPlanMode`.
