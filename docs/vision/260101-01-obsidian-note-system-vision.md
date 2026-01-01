# Vision: Sistema Elegante de Criacao e Revisao de Notas Obsidian

**Status:** Strategic Vision
**Date:** 2026-01-01
**Time Investment:** 15 minutes

## The Real Problem

O problema NAO e "como conectar skill + reviewer + Claude". O problema REAL e: **o ciclo de feedback entre Claude e usuario e fragmentado e manual**. O usuario precisa copiar/colar, abrir apps, fechar apps, re-solicitar mudancas. O que deveria ser um fluxo continuo de "pensar -> revisar -> refinar -> salvar" esta quebrado em passos desconexos.

A questao central: **Como tornar a criacao de notas tao fluida que o usuario nem percebe que ha multiplos sistemas envolvidos?**

## Assumptions Challenged

- **"Preciso de uma skill separada do reviewer"** -> NAO. A skill deve ser o ORQUESTRADOR que unifica tudo. Ela nao "usa" o reviewer, ela E o ponto de entrada que gerencia o ciclo completo.

- **"O app precisa abrir e fechar para comunicar com Claude"** -> NAO. O sistema de hooks do Claude Code ja resolve isso. O hook `ExitPlanMode` permite que a UI sirva como interface de revisao SEM interromper o fluxo.

- **"Preciso persistir estado entre ciclos"** -> PARCIALMENTE. O estado JA ESTA no arquivo markdown sendo criado. Nao precisa de banco de dados separado - o proprio arquivo e a fonte de verdade.

- **"Templates devem estar no vault Obsidian"** -> QUESTIONAVEL. Templates de GERACAO devem estar na skill (perto do orquestrador). Templates do VAULT sao para uso manual do usuario.

## Approaches Explored

### Approach 1: File-Based Communication (Atual + Refinado)
**Core Concept:** Usar arquivos `.md` como contrato de comunicacao, mantendo o hook system existente.

**Strengths:**
- Ja funciona parcialmente (infraestrutura existente)
- Simples de debugar (arquivos sao legives)
- Compativel 100% com Obsidian

**Weaknesses:**
- Skill e Reviewer sao projetos separados (duplicacao de regras)
- Usuario precisa configurar caminhos manualmente
- Nao ha feedback loop automatico

**Scores:** Simplicity 7/10, Power 5/10, Maintainability 6/10, Scalability 5/10, Beauty 5/10

### Approach 2: Skill como Wrapper do Reviewer (Skill-Centric)
**Core Concept:** Skill le regras/templates DO reviewer e orquestra todo o ciclo. Reviewer vira "biblioteca" da skill.

**Strengths:**
- Skill tem controle total do fluxo
- Regras centralizadas no reviewer
- Usuario interage apenas com Claude

**Weaknesses:**
- Skill precisa "entender" estrutura do reviewer
- Acoplamento forte entre skill e reviewer
- Manutencao em dois lugares

**Scores:** Simplicity 6/10, Power 7/10, Maintainability 5/10, Scalability 6/10, Beauty 6/10

### Approach 3: Unified System - Skill IS the Orchestrator
**Core Concept:** A skill NAO e um wrapper - ela e o CEREBRO. O reviewer e apenas a UI. A skill contem TODAS as regras, templates e logica. O reviewer e stateless - recebe nota, coleta feedback, devolve.

**Strengths:**
- Uma unica fonte de verdade (skill)
- Reviewer pode ser generico e reutilizavel
- Claude tem acesso direto a toda logica
- Zero duplicacao

**Weaknesses:**
- Requer refatorar estrutura atual do reviewer
- Templates precisam migrar para skill

**Scores:** Simplicity 9/10, Power 9/10, Maintainability 9/10, Scalability 8/10, Beauty 9/10

## The Inevitable Solution

**Chosen Approach:** Unified System - Skill IS the Orchestrator

**Why This is The Only Solution That Makes Sense:**

Quando olhamos para o problema de longe, a resposta e obvia: o Claude e quem CRIA a nota. O usuario e quem REVISA. O Obsidian e onde ela VIVE. Cada componente tem UM papel:

1. **Skill** = Cerebro (regras, templates, deteccao de tipo, geracao)
2. **Reviewer** = Interface (coleta feedback visual, zero logica de negocio)
3. **Obsidian** = Storage (onde a nota final mora)

O fluxo inevitavel:
```
User pede nota
    -> Skill detecta tipo, carrega template, gera conteudo
    -> Skill salva draft em temp file
    -> Skill abre Reviewer via hook (passa path do draft)
    -> User revisa no Reviewer
    -> User faz anotacoes/exclusoes
    -> User clica "Solicitar Alteracoes" ou "Salvar no Obsidian"
    -> Reviewer fecha, devolve feedback para Claude
    -> SE alteracoes: Claude edita, reabre Reviewer (loop)
    -> SE salvar: Move draft para vault, entrega link obsidian://
```

A beleza esta na SEPARACAO DE RESPONSABILIDADES. A skill nao precisa "entender" o reviewer. O reviewer nao precisa "entender" as regras. Cada um faz UMA coisa perfeitamente.

**Trade-offs Accepted:**
- Templates migram do vault para a skill (mas isso e CORRETO - templates de geracao != templates de usuario)
- Reviewer perde endpoints de template/extract (viram responsabilidade da skill)

**What Makes This Insanely Great:**
- Usuario fala com Claude, Claude faz tudo, usuario so revisa e aprova
- Zero configuracao manual de caminhos (skill ja sabe onde salvar)
- Ciclo de revisao VISUAL sem sair do terminal (hook abre browser automaticamente)
- Uma unica fonte de verdade para TODAS as regras de notas

## Reality Check

- [x] Does this ACTUALLY simplify the codebase? **Yes - remove duplicacao skill<->reviewer, centraliza logica**
- [x] Can we ship this in reasonable time? **Yes - 2-3 dias de refatoracao**
- [x] Is the elegance worth the effort? **Yes - simplifica MUITO a manutencao futura**
- [x] If we did the obvious thing, what would we lose? **Perderiamos a duplicacao de regras e a friccao de configuracao**

## For application-architect Agent

**Technical Guidance:**

### 1. Estrutura da Skill (Orquestrador)

```
C:\Users\Alex\.claude\skills\nota-obsidian\
├── SKILL.md                    # Instrucoes principais (manter atual)
├── templates/                  # MOVER templates de geracao para ca
│   ├── content/               # Templates para conteudo terceiros
│   │   ├── video-youtube.md
│   │   ├── artigo.md
│   │   ├── livro.md
│   │   └── ...
│   └── work/                  # Templates para conteudo proprio
│       ├── projeto.md
│       ├── tutorial.md
│       └── ...
├── references/                # Manter workflows (ja existe)
│   ├── workflow-youtube.md
│   ├── workflow-web.md
│   └── ...
├── scripts/                   # Manter extractors (ja existe)
│   ├── extrator-youtube.py
│   └── extrator-gdrive.py
└── config.json               # NOVO: configuracao centralizada
    {
      "vault_path": "C:/dev/obsidian-alexdonega",
      "reviewer_exe": "C:/dev/obsidian-note-reviewer/obsidian-note-reviewer.exe",
      "temp_dir": "C:/dev/obsidian-note-reviewer/.temp"
    }
```

### 2. Estrutura do Reviewer (UI Pura)

```
C:\dev\obsidian-note-reviewer\
├── apps/hook/                 # Manter estrutura atual
│   └── server/index.ts       # SIMPLIFICAR: remover /api/template, /api/extract
├── packages/                  # Manter estrutura atual
├── references/               # MOVER para skill (ou manter como fallback)
└── obsidian-note-reviewer.exe
```

**Endpoints do Reviewer (simplificados):**
- `GET /api/plan` - Retorna nota para revisao
- `POST /api/approve` - Aprova sem alteracoes
- `POST /api/deny` - Retorna feedback/anotacoes
- `POST /api/save` - Salva no filesystem (vault)

### 3. Fluxo de Dados

```
[Skill SKILL.md]
       |
       | 1. User: "cria nota do video X"
       v
[Claude detecta tipo, carrega template da skill]
       |
       | 2. Claude gera nota markdown
       v
[Salva em .temp/draft-{timestamp}.md]
       |
       | 3. Claude executa: obsidian-note-reviewer.exe --file draft.md
       v
[Reviewer abre, user revisa]
       |
       | 4. User anota e clica "Fazer Alteracoes"
       v
[Reviewer retorna feedback via stdout JSON]
       |
       | 5. Claude le feedback, edita nota
       v
[Loop para step 3 ate user clicar "Salvar"]
       |
       | 6. Reviewer chama /api/save com path do vault
       v
[Nota salva em C:/dev/obsidian-alexdonega/Atlas/.../nota.md]
       |
       | 7. Claude retorna link obsidian://
       v
[Done]
```

### 4. Comunicacao Claude <-> Reviewer

**Opcao Recomendada: Stdin/Stdout + Temp Files**

```typescript
// apps/hook/server/index.ts - ENTRADA
const event = await Bun.stdin.text();  // Hook event com tool_input
const draftPath = event.tool_input.draftPath;  // Path do draft
const content = await Bun.file(draftPath).text();  // Le conteudo

// apps/hook/server/index.ts - SAIDA
console.log(JSON.stringify({
  hookSpecificOutput: {
    decision: { behavior: "deny", message: feedback }
  }
}));
```

**Formato de Feedback (JSON):**
```json
{
  "action": "request_changes",
  "annotations": [
    {
      "type": "DELETION",
      "originalText": "texto a remover",
      "context": "## Secao X"
    },
    {
      "type": "COMMENT",
      "originalText": "texto anotado",
      "text": "Sugestao do usuario"
    }
  ]
}
```

### 5. Mudancas Necessarias

**No Reviewer:**
1. Remover /api/template, /api/extract, /api/config/* (responsabilidade da skill)
2. Simplificar App.tsx para receber nota via /api/plan apenas
3. Manter /api/save para salvar no vault
4. Retornar feedback estruturado (JSON) no deny

**Na Skill:**
1. Criar pasta `templates/` com todos os templates de geracao
2. Criar `config.json` com paths fixos
3. Atualizar SKILL.md para usar novo fluxo
4. Adicionar instrucao para abrir reviewer e processar feedback

**Implementation Priorities:**
1. Migrar templates para skill
2. Simplificar server do reviewer
3. Testar fluxo completo com video YouTube

**Success Criteria:**
- Usuario pede nota, Claude gera, abre reviewer, usuario revisa, loop funciona, nota salva no vault
- Zero configuracao manual pelo usuario
- Uma unica fonte de regras (skill)
- Reviewer 100% stateless e reutilizavel
