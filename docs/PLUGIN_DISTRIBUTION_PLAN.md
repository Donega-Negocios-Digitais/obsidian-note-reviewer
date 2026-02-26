# Plano de Plugin e Distribuicao (Producao)

## 1. Consolidar contrato de agentes (multi-CLI)

- `AGENTS.md` como fonte unica de instrucoes de agentes.
- `CLAUDE.md` apenas referenciando `AGENTS.md`.
- Para novas CLIs (OpenCode/CDS/etc.), criar apenas adaptadores leves apontando para o mesmo contrato.

## 2. Publicar plugin Claude Code no repositorio

- Marketplace no root: `.claude-plugin/marketplace.json`.
- Plugin em `apps/hook/.claude-plugin/plugin.json`.
- Comandos e hooks versionados em `apps/hook/commands` e `apps/hook/hooks`.

Comandos de instalacao:

```text
/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer
/plugin install obsreview@obsidian-note-reviewer
```

## 3. Padronizar distribuicao do binario

- Instalar via `scripts/install.sh`, `scripts/install.ps1`, `scripts/install.cmd`.
- Todos os scripts usam o mesmo repositorio de release por padrao.
- Override opcional por ambiente: `OBSREVIEW_RELEASE_REPO`.

## 4. Preparar colaboracao em producao

- Definir variaveis de ambiente do backend cloud (ex.: Supabase) no deploy.
- Validar fluxo local sem cloud (fallback) e fluxo cloud com colaboracao real.
- Confirmar permissao de escrita dos caminhos monitorados (`Plans/`, etc.).

## 5. Checklist de release

1. Build: `bun run build:hook`
2. Testes: `bun test apps/hook/server/__tests__/pathValidation.test.ts` e `bun test apps/hook/server/__tests__/save.test.ts`
3. Publicar release com binarios (`obsreview-*.exe`, `obsreview-*`, checksums)
4. Testar instalacao limpa em Windows/macOS/Linux
5. Testar plugin em Claude Code (plan + obsidian + annotate)
