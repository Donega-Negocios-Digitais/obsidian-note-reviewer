# Instalação do Plugin (Passo a Passo)

Este guia mostra como qualquer usuário instala e ativa o plugin no Claude Code.

## 1. Instalar o binário `obsreview`

### Windows (PowerShell)
```powershell
irm https://obsreview.ai/install.ps1 | iex
```

### Windows (CMD)
```cmd
curl -fsSL https://obsreview.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

### macOS / Linux / WSL
```bash
curl -fsSL https://obsreview.ai/install.sh | bash
```

## 2. Instalar o plugin no Claude Code

No Claude Code, execute:

```text
/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer
/plugin install obsreview@obsidian-note-reviewer
```

## 3. Reiniciar o Claude Code

Feche e abra o Claude Code para carregar hooks e slash commands.

## 4. Validar se está funcionando

Peça um plano para o agente que gere escrita em `/.claude/plans/...`.

Exemplo:

```text
Crie um plano de 3 passos para melhorar X, sem implementar.
```

Se estiver correto:
- a UI de revisão abre automaticamente;
- você consegue `Enviar alterações` e `Aprovar nota`.

## 5. Solução rápida de problemas

- Se o comando `obsreview` não for encontrado:
  - reinicie o terminal;
  - confirme se `~/.local/bin` (Linux/macOS) ou `%USERPROFILE%\\.local\\bin` (Windows) está no `PATH`.
- Se o plugin não aparecer:
  - rode novamente os dois comandos `/plugin ...`;
  - reinicie o Claude Code.
- Se a UI não abrir:
  - confirme que houve `Write/Edit/MultiEdit` em arquivo de plano (`/.claude/plans/...`).
