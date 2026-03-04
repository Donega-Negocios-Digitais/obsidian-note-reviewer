<p align="center">
  <img src="apps/marketing/public/og-image.webp" alt="obsidian-note-reviewer" width="80%" />
</p>

# obsidian-note-reviewer

Revisao interativa de planos e notas com UI visual, integrada ao Claude Code.

## Instalacao oficial

Guia para usuario final instalar e usar.

## Passo 0 - Se voce ja instalou antes, atualize tudo primeiro

Se ja tinha versao antiga instalada, rode novamente:

1. Atualize o binario `obsreview` com o mesmo instalador do seu sistema (Passo 1).
2. No Claude Code, rode novamente:
```text
/plugin install obsreview@obsidian-note-reviewer
```
3. Reinicie o Claude Code.

Objetivo: evitar cache antigo de plugin/hook.

## Passo 1 - Instalar o binario `obsreview` (terminal do sistema)

Rode **apenas um** comando, de acordo com seu sistema:

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

## Passo 2 - Validar que o binario instalou

No terminal:

```powershell
obsreview --version
obsreview --help
obsreview doctor
```

Sinal de sucesso:
- `--version` mostra um numero de versao;
- `--help` mostra lista de comandos;
- `doctor` mostra checks locais.

## Passo 3 - Abrir Claude Code na pasta certa

Abra o Claude Code em uma pasta de projeto com escrita.

Nao use pasta de sistema (exemplo: `System32`).

## Passo 4 - Instalar plugin no Claude Code (um comando por vez)

No chat do Claude Code:

1. Rode:
```text
/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer
```
Espere terminar.

2. Depois rode:
```text
/plugin install obsreview@obsidian-note-reviewer
```

Se o Claude perguntar escopo, selecione:
- **Global (Recommended)**.

## Passo 5 - Reiniciar Claude Code

Feche e abra o Claude Code novamente para carregar hooks e slash commands.

## Passo 6 - Teste real do fluxo

No chat do Claude Code:

```text
Crie um plano de 2 passos para criar uma mini apresentacao, sem implementar.
```

Resultado esperado:
1. Claude persiste o plano em `/.claude/plans/...`;
2. UI abre automaticamente para revisao;
3. `Enviar alteracoes` devolve feedback para o Claude;
4. `Aprovar nota` conclui o fluxo (no modo remoto, salva em Meus Documentos).

No fluxo remoto novo, a URL aberta deve conter:
- `/hook-review`
- `sessionId=...`
- `reviewKey=...`
- `revisionId=...`
- `mode=plan-live-review`

Se abrir a app sem esses parametros, voce ainda esta em versao antiga/cache antigo.

## Mensagens esperadas (guia rapido)

| Comando | Sinal de sucesso | Proximo passo |
|---|---|---|
| `obsreview --version` | Mostra numero de versao | Rodar `obsreview --help` |
| `/plugin marketplace add ...` | Marketplace adicionado | Rodar `/plugin install ...` |
| `/plugin install ...` | Plugin instalado | Reiniciar Claude Code |
| Prompt de teste | UI abriu para revisar plano | Testar `Enviar alteracoes` e `Aprovar nota` |

## Verificacao opcional (usuario)

Se quiser confirmar rapidamente que esta tudo certo no seu computador:

```powershell
obsreview --version
obsreview --help
obsreview doctor
```

## Problemas comuns

1. Plugin instalado, mas nada abre:
- reinicie o Claude Code;
- rode `obsreview doctor`;
- confira se o plano foi salvo em `/.claude/plans/...`.

2. Abre a app, mas sem o documento de revisao:
- atualize binario + plugin (Passo 0);
- reinicie o Claude Code;
- rode o prompt de teste novamente;
- confirme se a URL aberta tem `reviewKey` e `revisionId`.

3. Duvida sobre cache do plugin:
- nao rode `bun install` dentro de `~/.claude/plugins/cache/...`;
- runtime oficial e o binario global `obsreview`.

4. Login no modo hook:
- remoto pode exigir login;
- local funciona sem login por padrao.

5. Abriu no navegador errado (ex.: Chrome em vez de Brave):
- por padrao, o `obsreview` abre no navegador padrao do sistema;
- para forcar Brave, configure a variavel:
```powershell
$env:OBSREVIEW_BROWSER_EXE='C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe'
```
- depois reinicie o Claude Code.

## Documentacao util

- Guia detalhado de instalacao: [INSTALACAO-PLUGIN.md](./INSTALACAO-PLUGIN.md)
- Instalacao manual de hooks/comandos: [apps/hook/README.md](apps/hook/README.md)
- Regras dos agentes/CLIs: [AGENTS.md](AGENTS.md)

## Licenca

**Copyright (c) 2025 backnotprop.**

Licenciado sob **Business Source License 1.1 (BSL)**.
