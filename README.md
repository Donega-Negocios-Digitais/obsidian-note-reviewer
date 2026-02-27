<p align="center">
  <img src="apps/marketing/public/og-image.webp" alt="obsidian-note-reviewer" width="80%" />
</p>

# obsidian-note-reviewer

Revisão interativa de planos e notas com UI visual, integrada ao Claude Code.

## Guia rápido (passo a passo)

Este guia é para quem vai testar no **Claude Code**.

## Antes de começar (muito importante)

Existem 3 lugares diferentes:

1. `PowerShell/Terminal` (fora do Claude Code): instalar o binário.
2. `Chat do Claude Code`: instalar plugin com `/plugin ...`.
3. `Pasta de trabalho do projeto`: onde você pede o plano para abrir a UI.

Se rodar no lugar errado (ex.: `C:\Windows\System32`), pode não funcionar.

## Passo 1 - Instalar o binário `obsreview` (GLOBAL no sistema)

Rode no **PowerShell**:

**Windows (PowerShell):**

```powershell
irm https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.ps1 | iex
```

**macOS / Linux / WSL:**

```bash
curl -fsSL https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.sh | bash
```

## Passo 2 - Validar se o binário instalou

No mesmo terminal:

```powershell
obsreview --version
```

Se aparecer versão, o binário está OK.

## Passo 3 - Abrir Claude Code na pasta correta

Não teste em `System32`.

Use uma pasta de projeto, por exemplo:

```powershell
cd F:\obsidian-note-reviewer
```

Depois abra o Claude Code nessa pasta.

## Passo 4 - Instalar plugin no Claude Code (um comando por vez)

No **chat do Claude Code**, rode primeiro:

```text
/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer
```

Depois rode:

```text
/plugin install obsreview@obsidian-note-reviewer
```

## Passo 5 - Reiniciar Claude Code

Depois da instalação do plugin, reinicie o Claude Code para carregar hooks e comandos.

## Passo 6 - Teste guiado (abre a UI)

No Claude Code, envie:

```text
Crie/atualize o arquivo /.claude/plans/teste-chefe.md com um plano de 3 passos para melhorar a interface, sem implementar.
```

## Passo 7 - Como saber se funcionou

Tem que acontecer isso:

1. Claude cria/atualiza `/.claude/plans/teste-chefe.md`.
2. A UI web abre automaticamente.
3. Você consegue clicar em `Enviar alterações` e `Aprovar nota`.
4. O Claude recebe o retorno e continua o fluxo.

## Quando a UI abre (importante)

A UI de revisão só abre quando o agente faz `Write`, `Edit` ou `MultiEdit` em arquivo alvo.
Se o agente responder só no chat (sem escrever arquivo), a UI não abre.

## Global vs Local (explicação simples)

- `obsreview` (binário): **global** na máquina (fica no PATH do sistema).
- Plugin `/plugin install`: fica instalado no **Claude Code do usuário naquela máquina**.
- Teste do hook: depende da **pasta que você abriu** no Claude Code.

## Se não funcionar, envie este checklist

1. Saída do comando:

```powershell
obsreview --version
```

2. Pasta atual no terminal:

```powershell
pwd
```

3. Últimas linhas dos logs (na raiz do projeto):

```powershell
Get-Content .\.logs\plan-live-hook.log -Tail 80
Get-Content .\.logs\plan-live-session.log -Tail 80
```

4. Print da tela do Claude Code após o prompt de teste.

Com isso, dá para diagnosticar rápido.

## Documentação útil

- Guia detalhado de instalação: [INSTALACAO-PLUGIN.md](./INSTALACAO-PLUGIN.md)
- Instalação manual de hooks e comandos: [apps/hook/README.md](apps/hook/README.md)
- Regras dos agentes/CLIs: [AGENTS.md](AGENTS.md)

## Licença

**Copyright (c) 2025 backnotprop.**

Licenciado sob **Business Source License 1.1 (BSL)**.
