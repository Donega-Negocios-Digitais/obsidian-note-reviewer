# Instalacao do Plugin (passo a passo)

Guia para qualquer usuario instalar e testar.

## Passo 0 - Se ja tinha instalado antes, atualize primeiro

Para garantir que nao esta no fluxo antigo/cache antigo:

1. Atualize o binario `obsreview` rodando novamente o instalador do seu sistema (Passo 1).
2. No chat do Claude Code, rode novamente:
```text
/plugin install obsreview@obsidian-note-reviewer
```
3. Reinicie o Claude Code.

## Passo 1 - Instalar o binario `obsreview` (terminal do sistema)

### Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.ps1 | iex
```

### Windows (CMD)
```cmd
curl -fsSL https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.cmd -o install.cmd && install.cmd && del install.cmd
```

### macOS / Linux / WSL
```bash
curl -fsSL https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.sh | bash
```

## Passo 2 - Validar binario

```powershell
obsreview --version
obsreview --help
obsreview doctor
```

Sinal de sucesso:
- `--version` mostra versao;
- `--help` mostra os comandos;
- `doctor` mostra checks locais.

Se falhar, pare aqui e corrija antes de instalar plugin.

## Passo 3 - Abrir Claude Code na pasta certa

Abra uma pasta de projeto com escrita.

Nao use pasta de sistema (exemplo: `System32`).

## Passo 4 - Instalar plugin no chat do Claude Code (um comando por vez)

Primeiro comando:

```text
/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer
```

Espere terminar, depois rode o segundo:

```text
/plugin install obsreview@obsidian-note-reviewer
```

Se o Claude perguntar escopo, selecione:
- **Global (Recommended)**.

## Passo 5 - Reiniciar Claude Code

Feche e abra o Claude Code para recarregar hooks e slash commands.

## Passo 6 - Testar abertura da UI

Peça no chat:

```text
Crie um plano de 2 passos para criar uma mini apresentacao, sem implementar.
```

Esperado:
- Claude escreve em `/.claude/plans/...`;
- UI abre automaticamente para revisao;
- `Enviar alteracoes` devolve feedback para o Claude;
- `Aprovar nota` conclui fluxo (no remoto, salva em Meus Documentos).

No fluxo remoto novo, a URL deve conter:
- `/hook-review`
- `sessionId=...`
- `reviewKey=...`
- `revisionId=...`
- `mode=plan-live-review`

Se abrir a aplicacao sem esses parametros, ainda esta usando cache/versao antiga.

## Mensagens esperadas (comando -> sinal -> proximo passo)

| Comando | Sinal de sucesso | Proximo passo |
|---|---|---|
| `obsreview --version` | Mostra numero da versao | Rodar `obsreview --help` |
| `/plugin marketplace add ...` | Marketplace adicionado | Rodar `/plugin install ...` |
| `/plugin install ...` | Plugin instalado | Reiniciar Claude Code |
| Prompt de teste | UI abriu para revisar plano | Testar enviar/aprovar |

## Modo de revisao (novo padrao)

- `OBSREVIEW_REVIEW_TARGET=auto` (padrao):
  - testa `GET /api/hook-review/health` na app remota;
  - se remoto saudavel -> abre revisao em producao;
  - se remoto indisponivel/timeout -> usa localhost automaticamente.
- `OBSREVIEW_REVIEW_TARGET=remote`: forca app web de producao (login obrigatorio para enviar/aprovar).
- `OBSREVIEW_REVIEW_TARGET=local`: forca comportamento legado em localhost (sem login por padrao).
- no modo remoto (`/hook-review`):
  - `Aprovar nota` tenta salvar no app antes de aprovar no Claude;
  - se o save falhar, a aprovacao e bloqueada com erro claro para tentar novamente.
- `OBSREVIEW_REMOTE_FALLBACK_LOCAL=true` (padrao): fallback local em falha de inicializacao remota.
- `OBSREVIEW_REMOTE_HEALTH_TIMEOUT_MS=2000`: timeout do probe remoto em modo `auto`.

## Regras importantes

1. Nao precisa clonar repositorio para uso normal.
2. Nao rode `bun install` dentro de `~/.claude/plugins/cache/...`.
3. Runtime oficial do plugin e o binario global `obsreview`.

## Troubleshooting rapido

1. Rode no terminal:
```powershell
obsreview doctor
```

2. Verifique logs:
- `.logs/plan-live-hook.log`
- `.logs/plan-live-session.log`

3. Confirme:
- plugin instalado;
- Claude reiniciado;
- prompt realmente gerou `Write/Edit/MultiEdit` em `/.claude/plans/...`;
- se `Write` falhar por politica da ferramenta, fallback via `Bash` tambem e aceito pelo hook.

## Para quem usa repositorio local (desenvolvimento)

Se seus hooks apontam para `apps/hook/dist/index.js` no disco local:

1. Sempre rode build apos atualizar o projeto:
```powershell
cd apps/hook
bun run build
```
2. Reinicie o Claude Code.

Sem build novo, o hook pode continuar executando codigo antigo.
