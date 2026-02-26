<p align="center">
  <img src="apps/marketing/public/og-image.webp" alt="obsidian-note-reviewer" width="80%" />
</p>

# obsidian-note-reviewer

Revisão interativa de planos e notas com UI visual, integrada ao Claude Code.

## Instalação rápida (Claude Code)

### 1) Instalar o binário `obsreview`

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.ps1 | iex
```

**macOS / Linux / WSL:**

```bash
curl -fsSL https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.sh | bash
```

### 2) Instalar o plugin no Claude Code

```text
/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer
/plugin install obsreview@obsidian-note-reviewer
```

### 3) Reiniciar o Claude Code

Depois da instalação do plugin, reinicie o Claude Code para carregar hooks e comandos.

## Teste rápido (1 minuto)

No Claude Code, envie:

```text
Crie um plano de 3 passos para melhorar a interface, sem implementar.
```

Resultado esperado:
- Claude grava um arquivo em `/.claude/plans/...`
- a UI de revisão abre automaticamente
- você pode usar `Enviar alterações` ou `Aprovar nota`

## Quando a UI abre (importante)

A UI de revisão só abre quando o agente faz `Write`, `Edit` ou `MultiEdit` em arquivo alvo.
Se o agente responder só no chat (sem escrever arquivo), a UI não abre.

## Modos de uso

| Modo | Precisa instalar plugin local | Precisa login | Uso principal |
|---|---|---|---|
| Portal Web (`apps/portal`) | Não | Sim (`/editor` protegido) | Salvar no app (`Meus Documentos`) |
| Hook/CLI (`apps/hook`) | Sim (`obsreview` + hooks) | Não (fluxo local) | Revisar plano/nota e enviar feedback ao Claude |

## Salvamento de notas (3 destinos independentes)

1. `Salvar no app`
   - salva no banco da aplicação
   - aparece em `Meus Documentos`

2. `Salvar no Obsidian`
   - usa `POST /api/save` no servidor local
   - grava markdown no vault com validação de caminho

3. `Enviar para Claude`
   - envia feedback no fluxo de revisão via hook
   - não bloqueia os outros dois destinos

## Documentação útil

- Guia detalhado de instalação: [INSTALACAO-PLUGIN.md](./INSTALACAO-PLUGIN.md)
- Instalação manual de hooks e comandos: [apps/hook/README.md](apps/hook/README.md)
- Regras dos agentes/CLIs: [AGENTS.md](AGENTS.md)

## Licença

**Copyright (c) 2025 backnotprop.**

Licenciado sob **Business Source License 1.1 (BSL)**.
