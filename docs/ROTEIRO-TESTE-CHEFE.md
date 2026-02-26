# Roteiro de teste para validação (chefe)

Objetivo: validar em máquina limpa que o plugin e o fluxo de revisão funcionam ponta a ponta.

1. Instale o binário do projeto (Windows PowerShell):
`irm https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.ps1 | iex`

2. Abra o Claude Code e instale o plugin:
`/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer`
`/plugin install obsreview@obsidian-note-reviewer`

3. No Claude Code, peça um plano para forçar escrita em `/.claude/plans/`:
`Crie um plano de 3 passos para melhorar a interface, sem implementar.`

4. Validação esperada:
- a tela web de revisão abre automaticamente antes da execução
- o arquivo é criado em `.claude/plans/`
- ao clicar em **Enviar alterações**, o Claude recebe feedback e reescreve o plano
- ao clicar em **Aprovar nota**, o Claude segue normalmente

5. Se precisar depurar, abrir estes arquivos:
- `.claude/plans/<arquivo-gerado>.md`
- `.logs/plan-live-hook.log`
- `.logs/plan-live-session.log`

6. Critério de sucesso final:
- fluxo completo funciona sem intervenção manual extra
- revisão contínua abre, recebe feedback e atualiza
- aprovação final destrava o Claude para continuar o trabalho
