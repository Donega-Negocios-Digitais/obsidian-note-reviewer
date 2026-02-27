<p align="center">
  <img src="apps/marketing/public/og-image.webp" alt="obsidian-note-reviewer" width="80%" />
</p>

# obsidian-note-reviewer

Revisao interativa de planos e notas com UI visual, integrada ao Claude Code.

## Guia super detalhado (passo a passo)

Este guia e para qualquer pessoa instalar e testar sem adivinhar nada.

## Regra simples: cada comando no lugar certo

1. `PowerShell/Terminal` (fora do Claude Code):
   aqui voce instala o comando `obsreview`.
2. `Chat do Claude Code`:
   aqui voce roda comandos `/plugin ...`.
3. `Pasta de trabalho` no Claude Code:
   aqui voce pede o plano para abrir a tela de revisao.

## Passo 0 - Fechar o Claude Code (se ja estiver aberto)

Se o Claude Code estiver aberto, feche ele antes da instalacao.

## Passo 1 - Instalar o comando `obsreview`

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.ps1 | iex
```

### macOS / Linux / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.sh | bash
```

## Passo 2 - Verificar se instalou

No terminal, rode:

```powershell
obsreview --version
```

Resultado esperado:
- aparece um numero de versao (exemplo: `0.x.x`).

Se nao aparecer versao, a instalacao do binario ainda nao terminou corretamente.

## Passo 3 - Abrir o Claude Code e abrir uma pasta de trabalho

Abra o Claude Code.

Depois abra uma pasta de projeto sua (qualquer pasta de trabalho normal, com permissoes de escrita).

## Passo 4 - Instalar plugin no Claude Code (um por vez)

No chat do Claude Code, rode primeiro:

```text
/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer
```

Depois rode:

```text
/plugin install obsreview@obsidian-note-reviewer
```

Importante:
- rode um comando por vez;
- espere terminar o primeiro para rodar o segundo.

## Passo 5 - Reiniciar o Claude Code

Feche o Claude Code.

Abra novamente.

Abra novamente sua pasta de trabalho.

## Passo 6 - Fazer o teste de verdade

No chat do Claude Code, envie:

```text
Crie um plano de 3 passos para melhorar a interface, sem implementar.
```

## Passo 7 - Como saber se deu certo

Tem que acontecer isto:

1. O Claude gera o plano.
2. A tela web de revisao abre automaticamente.
3. Voce consegue clicar em `Enviar alteracoes` e `Aprovar nota`.
4. O Claude recebe sua acao e continua o fluxo.

## Quando aparece opcao "global" ou "local"

Se aparecer essa duvida em algum instalador:

- Para o comando `obsreview`, use **global** (vale para todo o sistema).
- Para plugin, instale no **Claude Code** da maquina do usuario.

## Se nao funcionar, envie este pacote de diagnostico

No terminal, dentro da pasta de trabalho, rode:

```powershell
obsreview --version
pwd
Get-Content .\.logs\plan-live-hook.log -Tail 80
Get-Content .\.logs\plan-live-session.log -Tail 80
```

E envie junto:

1. print do chat do Claude Code;
2. print da tela web (se abriu);
3. o prompt exato usado no teste.

## Checklist final rapido

- [ ] `obsreview --version` funciona
- [ ] plugin instalado no Claude Code
- [ ] Claude Code foi reiniciado depois da instalacao
- [ ] teste de plano abriu a UI
- [ ] `Enviar alteracoes` funcionou
- [ ] `Aprovar nota` funcionou

## Documentacao util

- Guia detalhado de instalacao: [INSTALACAO-PLUGIN.md](./INSTALACAO-PLUGIN.md)
- Instalacao manual de hooks/comandos: [apps/hook/README.md](apps/hook/README.md)
- Regras dos agentes/CLIs: [AGENTS.md](AGENTS.md)

## Licenca

**Copyright (c) 2025 backnotprop.**

Licenciado sob **Business Source License 1.1 (BSL)**.
