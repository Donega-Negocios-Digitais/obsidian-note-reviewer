<p align="center">
  <img src="apps/marketing/public/og-image.webp" alt="obsidian-note-reviewer" width="80%" />
</p>

# obsidian-note-reviewer

Revisao interativa de planos e notas com UI visual, integrada ao Claude Code.

## Guia de instalacao e teste (passo a passo)

Este guia mostra exatamente:
- onde rodar cada comando;
- o que e global e o que e local;
- como validar que esta funcionando;
- o que enviar de feedback se der erro.

## Mapa rapido: onde executar cada coisa

| Acao | Onde executar |
|---|---|
| Instalar `obsreview` | PowerShell/Terminal (fora do Claude Code) |
| Instalar plugin | Chat do Claude Code (`/plugin ...`) |
| Testar abertura da UI | Claude Code aberto em uma pasta de trabalho (projeto) |

## Global vs local (explicacao simples)

- `obsreview` (binario CLI): instalacao **global** na maquina (fica no PATH).
- plugin do Claude Code: instalacao **local do Claude Code daquele usuario/maquina**.
- hooks funcionando: depende da **pasta de trabalho aberta** no Claude Code.

## Passo 1 - Instalar o binario `obsreview` (global)

### Windows (PowerShell)

```powershell
irm https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.ps1 | iex
```

### macOS / Linux / WSL

```bash
curl -fsSL https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.sh | bash
```

### Validacao do passo 1

```powershell
obsreview --version
```

Saida esperada:
- aparece uma versao (ex.: `0.x.x`).
- se comando nao for encontrado, o binario nao entrou no PATH.

## Passo 2 - Abrir Claude Code em uma pasta de trabalho

Abra o Claude Code em uma pasta onde voce possa criar arquivos.

Exemplo no Windows:

```powershell
cd F:\obsidian-note-reviewer
```

## Passo 3 - Instalar plugin no Claude Code (um por vez)

No chat do Claude Code, rode primeiro:

```text
/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer
```

Depois rode:

```text
/plugin install obsreview@obsidian-note-reviewer
```

Saida esperada:
- mensagem de sucesso no add do marketplace;
- mensagem de sucesso na instalacao do plugin.

## Passo 4 - Reiniciar Claude Code

Depois da instalacao do plugin, reinicie o Claude Code.

Sem reiniciar, hooks e comandos podem nao carregar.

## Passo 5 - Teste funcional (abre a UI)

No chat do Claude Code, envie este prompt:

```text
Crie/atualize o arquivo /.claude/plans/teste-chefe.md com um plano de 3 passos para melhorar a interface, sem implementar.
```

Saida esperada:
1. o arquivo `/.claude/plans/teste-chefe.md` e criado/atualizado;
2. a UI web abre automaticamente;
3. voce consegue clicar em `Enviar alteracoes` e `Aprovar nota`;
4. o Claude recebe a decisao e continua o fluxo.

## Quando a UI abre (regra importante)

A UI abre quando o agente faz `Write`, `Edit` ou `MultiEdit` em arquivo alvo.

Se o agente responder so no chat (sem escrever/editar arquivo), a UI nao abre.

## Checklist rapido de validacao (para qualquer usuario)

- [ ] `obsreview --version` funciona no terminal
- [ ] plugin instalado com sucesso no Claude Code
- [ ] Claude Code reiniciado apos instalacao
- [ ] teste criou arquivo em `/.claude/plans/`
- [ ] UI abriu automaticamente
- [ ] botao `Enviar alteracoes` funcionou
- [ ] botao `Aprovar nota` funcionou

## Se nao funcionar, enviar este pacote de diagnostico

No terminal (na pasta do projeto), executar:

```powershell
obsreview --version
pwd
Get-Content .\.logs\plan-live-hook.log -Tail 80
Get-Content .\.logs\plan-live-session.log -Tail 80
```

Tambem enviar:
- print da tela do Claude Code;
- print da tela da UI de review (se abriu);
- prompt usado no teste.

Com isso, o diagnostico fica rapido e objetivo.

## Documentacao util

- Guia detalhado de instalacao: [INSTALACAO-PLUGIN.md](./INSTALACAO-PLUGIN.md)
- Instalacao manual de hooks/comandos: [apps/hook/README.md](apps/hook/README.md)
- Regras dos agentes/CLIs: [AGENTS.md](AGENTS.md)

## Licenca

**Copyright (c) 2025 backnotprop.**

Licenciado sob **Business Source License 1.1 (BSL)**.
