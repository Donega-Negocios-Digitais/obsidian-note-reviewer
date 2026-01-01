# Plano Arquitetural: Sistema Unificado Ultrathink (nota-obsidian + reviewer)

**Status:** Implementation Ready
**Date:** 2026-01-01
**Version:** 01a
**Estimated Time:** 2-3 days

---

## Executive Summary

Implementar o sistema unificado onde:
- **Skill (nota-obsidian)** = Única fonte de verdade (regras, templates, lógica de detecção)
- **Reviewer (obsidian-note-reviewer)** = UI stateless (apenas coleta feedback visual)
- **Comunicação** = stdin/stdout JSON + temp files (já funciona via hooks do Claude Code)

### Princípio Central
A skill NÃO é um "wrapper" do reviewer. A skill É o cérebro. O reviewer é apenas uma interface visual para coletar feedback. Separação radical de responsabilidades.

### Impacto na Experiência do Usuário
**Antes:** User → copia/cola → abre app → fecha app → re-solicita no terminal
**Depois:** User → "crie nota do vídeo X" → Claude gera → abre reviewer automaticamente → user revisa visualmente → clica botão → Claude edita → loop até "salvar no Obsidian"

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER (Terminal)                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE + SKILL                           │
│  C:\Users\Alex\.claude\skills\nota-obsidian\                    │
│                                                                  │
│  ┌────────────────┐  ┌─────────────┐  ┌──────────────┐         │
│  │   SKILL.md     │  │ templates/  │  │  scripts/    │         │
│  │  (orquestrador)│  │ (geração)   │  │ (extração)   │         │
│  └────────────────┘  └─────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              config.json (paths fixos)                    │  │
│  │  {                                                        │  │
│  │    "vault_path": "C:/dev/obsidian-alexdonega",           │  │
│  │    "temp_dir": "C:/dev/obsidian-note-reviewer/.temp"     │  │
│  │  }                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ 1. Gera nota markdown
                           │ 2. Salva em .temp/draft-{timestamp}.md
                           │ 3. Executa hook ExitPlanMode
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    REVIEWER (UI Stateless)                       │
│  C:\dev\obsidian-note-reviewer\                                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  apps/hook/server/index.ts                             │    │
│  │  - Recebe nota via stdin (hook event)                  │    │
│  │  - Serve UI em porta aleatória                         │    │
│  │  - Abre browser automaticamente                        │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  packages/editor/App.tsx                               │    │
│  │  - Exibe nota markdown renderizado                     │    │
│  │  - Permite anotações visuais (highlights, comments)    │    │
│  │  - Botão "Fazer Alterações" (se anotações)             │    │
│  │  - Botão "Salvar no Obsidian" (se sem anotações)       │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                  │
│  API Simplificada:                                              │
│  - GET  /api/plan        → retorna nota (do hook event)         │
│  - POST /api/deny        → retorna feedback + anotações         │
│  - POST /api/approve     → retorna sucesso                      │
│  - POST /api/save        → salva no vault                       │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           │ 4. User clica botão
                           │ 5. Reviewer retorna JSON via stdout
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CLAUDE CODE (recebe feedback)                │
│  - Parse JSON do reviewer                                       │
│  - Se "deny": edita nota com base em anotações                  │
│  - Se "approve": salva no vault via /api/save                   │
│  - Loop: reabre reviewer até user salvar                        │
└─────────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    OBSIDIAN VAULT (destino final)                │
│  C:\dev\obsidian-alexdonega\Atlas\Conteudos\...                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 1. Estrutura da Skill (nota-obsidian/)

### 1.1 Arquivos e Pastas

```
C:\Users\Alex\.claude\skills\nota-obsidian\
├── SKILL.md                      # Orquestrador principal (ATUALIZAR)
├── config.json                   # NOVO: Configuração centralizada
├── templates/                    # NOVO: Templates migrados do vault
│   ├── content/                  # Templates para conteúdo terceiros
│   │   ├── video-youtube.md
│   │   ├── artigo.md
│   │   ├── newsletter.md
│   │   ├── livro.md
│   │   ├── curso.md
│   │   ├── aula.md
│   │   ├── podcast.md
│   │   ├── palestra.md
│   │   ├── entrevista.md
│   │   ├── atomica.md
│   │   ├── framework.md
│   │   ├── pessoa.md
│   │   ├── citacao.md
│   │   ├── moc.md
│   │   └── dashboard.md
│   └── work/                     # Templates para conteúdo próprio (Alex)
│       ├── artigo-alex.md
│       ├── video-youtube-alex.md
│       ├── projeto.md
│       ├── tutorial.md
│       ├── conteudo-mestre.md
│       └── roteiro.md
├── references/                   # Workflows existentes (MANTER)
│   ├── workflow-youtube.md
│   ├── workflow-web.md
│   ├── workflow-educacional.md
│   ├── workflow-conceito.md
│   ├── workflow-organizacional.md
│   ├── troubleshooting.md
│   ├── lexico.md
│   └── anti-patterns.md
└── scripts/                      # Extractors existentes (MANTER)
    ├── extrator-youtube.py
    └── extrator-gdrive.py
```

### 1.2 config.json (NOVO ARQUIVO)

**Path:** `C:\Users\Alex\.claude\skills\nota-obsidian\config.json`

```json
{
  "vault_path": "C:/dev/obsidian-alexdonega",
  "temp_dir": "C:/dev/obsidian-note-reviewer/.temp",
  "reviewer_hook": "ExitPlanMode",
  "note_paths": {
    "video_youtube": "Atlas/Conteudos/Video Youtube",
    "artigo": "Atlas/Conteudos/Artigos",
    "newsletter": "Atlas/Conteudos/Newsletters",
    "livro": "Atlas/Conteudos/Livros",
    "curso": "Atlas/Conteudos/Cursos",
    "aula": "Atlas/Conteudos/Aulas",
    "podcast": "Atlas/Conteudos/Podcasts",
    "palestra": "Atlas/Conteudos/Palestras",
    "entrevista": "Atlas/Conteudos/Entrevistas",
    "atomica": "Atlas/Atomos/Conceitos",
    "framework": "Atlas/Atomos/Frameworks",
    "pessoa": "Atlas/Atomos/Pessoas",
    "citacao": "Atlas/Atomos/Citacoes",
    "moc": "Atlas/Mapas",
    "dashboard": "Atlas/Mapas/Dashboards",
    "artigo_alex": "Work/Conteudos Mestre",
    "video_alex": "Work/Videos",
    "projeto": "Work/Projetos",
    "tutorial": "Work/Tutoriais",
    "conteudo_mestre": "Work/Conteudos Mestre",
    "roteiro": "Work/Roteiros"
  }
}
```

**Propósito:**
- Centralizar TODOS os paths (sem hardcode no SKILL.md)
- Claude lê este arquivo para saber onde salvar notas
- Facilita mudanças futuras (user só edita um lugar)

### 1.3 SKILL.md (ATUALIZAR)

**Mudanças necessárias:**

1. **Adicionar seção "FASE 4: REVIEW" (NOVO)**
   - Após gerar nota, salvar em temp file
   - Executar tool_use para chamar ExitPlanMode hook
   - Aguardar feedback do reviewer
   - Se feedback = alterações: editar nota e repetir FASE 4
   - Se feedback = aprovado: executar FASE 5 (salvar no vault)

2. **Atualizar FASE 3: SAVE → FASE 5: FINALIZE**
   - Renomear para "FINALIZE" (save agora é responsabilidade do reviewer)
   - Claude apenas move arquivo de .temp/ para vault path
   - Retorna link obsidian://

3. **Adicionar leitura de config.json**
   ```markdown
   ## Configuração

   Ao iniciar, SEMPRE ler:
   ```bash
   cat C:\Users\Alex\.claude\skills\nota-obsidian\config.json
   ```

   Use os paths de `config.json` para:
   - Determinar pasta de destino (note_paths[tipo])
   - Salvar temp file (temp_dir)
   - Construir path final (vault_path + note_paths[tipo])
   ```

4. **Adicionar instruções de hook**
   ```markdown
   ## FASE 4: REVIEW (NOVO)

   Após gerar nota markdown:

   1. Salvar draft:
      - Path: `{temp_dir}/draft-{timestamp}.md`
      - Timestamp: `YYYYMMDD-HHMMSS` (ex: 20260101-143052)

   2. Executar tool_use:
      ```
      ExitPlanMode({
        "plan": "{conteúdo da nota completo em markdown}"
      })
      ```

   3. Aguardar resposta do hook:
      - Se behavior = "deny": Editar nota com base em `message` (feedback)
      - Se behavior = "allow": Ir para FASE 5 (finalize)

   4. Loop de revisão:
      - Se user fez anotações → deny → Claude edita → reabre reviewer
      - Repetir até user aprovar (behavior = allow)
   ```

### 1.4 Templates (MIGRAÇÃO)

**Ação:** Copiar templates do vault para skill

**De:** `C:\dev\obsidian-alexdonega\Sistema\Templates\Templates de notas conteúdo\`
**Para:** `C:\Users\Alex\.claude\skills\nota-obsidian\templates\content\`

**Renomear arquivos:**
- `template-video-youtube.md` → `video-youtube.md`
- `template-artigo.md` → `artigo.md`
- etc.

**Manter no vault:**
- Templates para USO MANUAL do usuário
- Templates de skill são APENAS para geração via Claude

**Atualização nos templates:**
- Remover bloco `<gerador-nota-*>` (mover para SKILL.md)
- Template deve ser APENAS a estrutura markdown (frontmatter + seções)
- Instruções de geração ficam no SKILL.md

**Exemplo de template limpo:**

```markdown
---
titulo:
pai:
colecao:
area:
projeto:
pessoa:
relacionado:
tipo_nota: video_youtube
data_criado:
data_atualizado:
cssclasses:
status: nao_iniciado
tags:
url_video:
duracao:
data_publicacao:
---

> [!info]+ Detalhes do Vídeo do Youtube
> **🔗 Assistir:** {url_video}
> **⏱️ Duração:** {duracao}
> **👤 Mentor:** {pessoa}
> **📺 Canal:** {canal}
> **📆 Publicado:** {data_publicacao}

> [!tip]- Léxico

> [!target]- Principais Pontos do Vídeo

> [!file-text]- Transcrição Completa do Vídeo

---
## Resumo

---
## Mapa de Conceitos

---
## Explicação Detalhada

---
## Como aplicar

---
## Insights Pessoais

---
## Ações / Próximos Passos
```

---

## 2. Estrutura do Reviewer (obsidian-note-reviewer/)

### 2.1 Tech Stack (MANTER ATUAL)

**Runtime:** Bun
**Framework:** React 19 + TypeScript
**Build:** Vite + vite-plugin-singlefile
**Styling:** TailwindCSS 4
**Servidor:** Bun serve (ephemeral, porta aleatória)

**Motivo:** Já funciona perfeitamente. Zero necessidade de Electron/Tauri.

### 2.2 Estrutura de Pastas (SIMPLIFICAR)

**Antes:**
```
C:\dev\obsidian-note-reviewer\
├── apps/hook/
│   ├── server/index.ts         # API com MUITOS endpoints
│   └── dist/index.html         # UI compilada
├── packages/
│   ├── editor/App.tsx          # UI principal
│   └── ui/                     # Componentes compartilhados
└── references/                 # DUPLICADO da skill
```

**Depois:**
```
C:\dev\obsidian-note-reviewer\
├── apps/hook/
│   ├── server/index.ts         # API SIMPLIFICADA (4 endpoints)
│   └── dist/index.html         # UI compilada (sem mudanças)
├── packages/
│   ├── editor/App.tsx          # UI com lógica de botões atualizada
│   └── ui/                     # Componentes (sem mudanças)
└── .temp/                      # NOVO: Draft files temporários
    └── draft-{timestamp}.md
```

**Remover:**
- `references/` (agora vive na skill)
- Endpoints `/api/template`, `/api/extract`, `/api/config/*` (responsabilidade da skill)

### 2.3 API Endpoints (SIMPLIFICADA)

**apps/hook/server/index.ts - Manter APENAS:**

```typescript
// 1. GET /api/plan
// Retorna nota que foi passada via hook event stdin
if (url.pathname === "/api/plan") {
  return Response.json({ plan: planContent });
}

// 2. POST /api/approve
// User aprovou sem alterações
if (url.pathname === "/api/approve" && req.method === "POST") {
  resolveDecision({ approved: true });
  return Response.json({ ok: true });
}

// 3. POST /api/deny
// User solicitou alterações (com feedback)
if (url.pathname === "/api/deny" && req.method === "POST") {
  const body = await req.json() as { feedback?: string };
  resolveDecision({
    approved: false,
    feedback: body.feedback || "Plan rejected by user"
  });
  return Response.json({ ok: true });
}

// 4. POST /api/save
// Salva nota no vault do Obsidian
if (url.pathname === "/api/save" && req.method === "POST") {
  const body = await req.json() as { content: string; path: string };
  const fs = await import("fs/promises");
  const pathModule = await import("path");

  const dir = pathModule.dirname(body.path);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(body.path, body.content, "utf-8");

  return Response.json({ ok: true, message: "Nota salva com sucesso" });
}
```

**REMOVER endpoints:**
- `/api/template` (skill tem os templates)
- `/api/extract` (skill executa scripts Python)
- `/api/config/list`, `/api/config/read`, `/api/config/save` (config.json na skill)
- `/api/validate`, `/api/validate-paths` (skill valida paths)
- `/api/load` (não usado - nota vem via hook event)

### 2.4 Comunicação Claude ↔ Reviewer

**Protocolo:** stdin/stdout + Hook System do Claude Code

#### Input (Claude → Reviewer)

**Via stdin (hook event):**
```json
{
  "hookEventName": "ExitPlanMode",
  "tool_use": {
    "type": "tool_use",
    "name": "ExitPlanMode",
    "tool_input": {
      "plan": "---\ntitulo: Minha Nota\n---\n\n## Conteúdo..."
    }
  }
}
```

**Como funciona:**
1. Claude executa tool_use `ExitPlanMode`
2. Hook system do Claude Code chama `bun run apps/hook/server/index.ts`
3. Server lê stdin (JSON acima)
4. Extrai `tool_input.plan` (conteúdo da nota)
5. Serve UI com a nota

#### Output (Reviewer → Claude)

**Via stdout (JSON):**

**Caso 1: User aprovou (sem anotações)**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow"
    }
  }
}
```

**Caso 2: User solicitou alterações (com anotações)**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "deny",
      "message": "SOLICITAÇÃO DE ALTERAÇÕES:\n\n## Linha 45\n❌ DELETAR: 'Este trecho está incorreto'\n\n## Linha 67\n💬 COMENTÁRIO: 'Adicionar exemplo de código aqui'\n\n..."
    }
  }
}
```

**Como funciona:**
1. User clica "Fazer Alterações" ou "Salvar no Obsidian"
2. Se anotações existem → POST /api/deny com feedback
3. Se sem anotações → POST /api/approve
4. Server escreve JSON no stdout
5. Hook system retorna para Claude
6. Claude parse o JSON e age:
   - `allow` → vai para FASE 5 (finalize)
   - `deny` → edita nota com base em `message` → reabre reviewer

### 2.5 Formato de Feedback (Anotações → Texto)

**Função:** Converter anotações visuais em instruções textuais para Claude

**Implementação em App.tsx:**

```typescript
// packages/editor/App.tsx

function formatFeedbackFromAnnotations(annotations: Annotation[], blocks: Block[]): string {
  if (annotations.length === 0) {
    return "Nota aprovada sem alterações";
  }

  const feedback: string[] = ["SOLICITAÇÃO DE ALTERAÇÕES:\n"];

  annotations.forEach(ann => {
    // Encontrar linha aproximada
    const blockIndex = blocks.findIndex(b => b.content.includes(ann.selectedText));
    const lineNumber = blockIndex >= 0 ? `Linha ${blockIndex + 1}` : "Localização";

    if (ann.type === 'DELETION') {
      feedback.push(`## ${lineNumber}`);
      feedback.push(`❌ DELETAR: "${ann.selectedText}"`);
      feedback.push("");
    } else if (ann.type === 'COMMENT') {
      feedback.push(`## ${lineNumber}`);
      feedback.push(`💬 COMENTÁRIO sobre: "${ann.selectedText}"`);
      feedback.push(`Sugestão: ${ann.text}`);
      feedback.push("");
    }
  });

  return feedback.join("\n");
}

// Uso no handleDeny
const handleDeny = async () => {
  const feedbackText = formatFeedbackFromAnnotations(annotations, blocks);

  await fetch('/api/deny', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feedback: feedbackText })
  });
};
```

**Exemplo de feedback gerado:**

```
SOLICITAÇÃO DE ALTERAÇÕES:

## Linha 45
❌ DELETAR: "Este conceito está errado porque..."

## Linha 67
💬 COMENTÁRIO sobre: "A implementação do algoritmo"
Sugestão: Adicionar exemplo de código mostrando o uso prático

## Linha 102
💬 COMENTÁRIO sobre: "Mapa de Conceitos"
Sugestão: Incluir conexão entre X e Y no diagrama Mermaid
```

### 2.6 Lógica de Botões (App.tsx)

**Estado atual:** Botão "Salvar no Obsidian" sempre visível

**Estado desejado:** Botão CONDICIONAL baseado em anotações

```typescript
// packages/editor/App.tsx - handleSaveToVault

const handleSaveToVault = async () => {
  // CASO 1: TEM ANOTAÇÕES → Fazer Alterações (deny com feedback)
  if (annotations.length > 0) {
    console.log('🟠 Solicitando alterações com', annotations.length, 'anotações');

    const feedbackText = formatFeedbackFromAnnotations(annotations, blocks);

    await fetch('/api/deny', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ feedback: feedbackText })
    });

    setSubmitted('denied');
    return;
  }

  // CASO 2: SEM ANOTAÇÕES → Salvar no Obsidian e Aprovar
  console.log('🟣 Salvando nota no Obsidian...');

  const content = reconstructMarkdownFromBlocks(blocks);
  const response = await fetch('/api/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      path: savePath  // vem de config via props
    })
  });

  if (!response.ok) {
    throw new Error('Erro ao salvar');
  }

  console.log('✅ Nota salva:', savePath);

  // Aprovar automaticamente
  await fetch('/api/approve', { method: 'POST' });
  setSubmitted('approved');
};
```

**Visual do botão:**

```tsx
<button
  onClick={handleSaveToVault}
  className={annotations.length > 0
    ? 'bg-orange-500 text-white'  // Laranja se tem anotações
    : 'bg-purple-500 text-white'  // Roxo se sem anotações
  }
>
  {annotations.length > 0
    ? '✏️ Fazer Alterações'
    : '💾 Salvar no Obsidian'}
</button>
```

### 2.7 Path Configuration (Como reviewer descobre onde salvar)

**Problema:** Reviewer precisa saber path do vault

**Solução:** Claude passa path via query string quando abre URL

```typescript
// apps/hook/server/index.ts - ao abrir browser

// Ler config.json da skill
const skillConfig = JSON.parse(
  await Bun.file("C:/Users/Alex/.claude/skills/nota-obsidian/config.json").text()
);

const vaultPath = skillConfig.vault_path;
const notePath = skillConfig.note_paths[noteType]; // ex: "Atlas/Conteudos/Video Youtube"
const fullPath = `${vaultPath}/${notePath}/${filename}.md`;

const url = `http://localhost:${server.port}?savePath=${encodeURIComponent(fullPath)}`;

// Abre browser com path
await $`cmd /c start ${url}`.quiet();
```

**App.tsx recebe via query string:**

```typescript
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const path = params.get('savePath');
  if (path) {
    setSavePath(path);
  }
}, []);
```

---

## 3. Protocolo de Comunicação Completo

### 3.1 Formato JSON: Claude → Reviewer

**Via stdin (hook event ExitPlanMode):**

```json
{
  "hookEventName": "ExitPlanMode",
  "tool_use": {
    "type": "tool_use",
    "id": "toolu_01ABC123",
    "name": "ExitPlanMode",
    "tool_input": {
      "plan": "---\ntitulo: Como Criar APIs REST com Node.js - Fireship\npai: [[Dashboard de Estudos]]\ncolecao: tecnologia\narea:\nprojeto:\npessoa: [[Fireship]]\nrelacionado:\n  - \"\"\ntipo_nota: video_youtube\ndata_criado: 2026-01-01\ndata_atualizado: 2026-01-01\ncssclasses: normal\nstatus: concluido\ntags:\n  - video\n  - youtube\n  - nodejs\n  - api\nurl_video: https://www.youtube.com/watch?v=...\nduracao: 12:34\ncanal: Fireship\ndata_publicacao: 2025-12-20\n---\n\n> [!info]+ Detalhes do Vídeo\n...(resto da nota)..."
    }
  },
  "timestamp": "2026-01-01T14:30:52.123Z"
}
```

### 3.2 Formato JSON: Reviewer → Claude

**Via stdout (hook response):**

**Sucesso (aprovado):**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow"
    }
  }
}
```

**Alterações solicitadas:**
```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "deny",
      "message": "SOLICITAÇÃO DE ALTERAÇÕES:\n\n## Linha 45\n❌ DELETAR: 'Conceito X está incorreto'\n\n## Linha 67\n💬 COMENTÁRIO: 'Adicionar diagrama mostrando fluxo'\nSugestão: Usar Mermaid para ilustrar o processo\n\n## Linha 102\n❌ DELETAR: 'Este parágrafo está redundante'"
    }
  }
}
```

### 3.3 Como Claude "Abre" o Reviewer

**Não há comando explícito.** O hook system do Claude Code faz automaticamente:

1. Claude executa `ExitPlanMode` tool_use
2. Claude Code detecta hook configurado para `ExitPlanMode`
3. Claude Code executa: `bun run C:\dev\obsidian-note-reviewer\apps\hook\server\index.ts`
4. Server lê stdin (hook event com nota)
5. Server abre browser automaticamente
6. Server aguarda decisão (approve/deny)
7. Server retorna JSON no stdout
8. Claude recebe resposta e continua

**Skill apenas precisa executar tool_use:**
```
ExitPlanMode({ "plan": "{nota markdown}" })
```

### 3.4 Arquivos Temporários

**Local:** `C:\dev\obsidian-note-reviewer\.temp\`

**Propósito:**
- Guardar drafts enquanto user está revisando
- Permitir múltiplos ciclos de revisão
- Facilitar debug (ver versões anteriores)

**Nomenclatura:**
```
draft-{timestamp}-{revision}.md

Exemplos:
draft-20260101-143052-v1.md  # Primeira versão
draft-20260101-143052-v2.md  # Após primeira edição
draft-20260101-143052-v3.md  # Após segunda edição
```

**Limpeza:**
- Arquivos são deletados após salvamento bem-sucedido no vault
- Ou mantidos por 24h para debug (opcional)

---

## 4. Fluxo de Execução Passo-a-Passo (DETALHADO)

### 4.1 Fluxo Completo: Video YouTube

```
┌─────────────────────────────────────────────────────────────┐
│ PASSO 1: User solicita nota                                 │
└─────────────────────────────────────────────────────────────┘

User: "crie uma nota do vídeo https://www.youtube.com/watch?v=ABC123"

┌─────────────────────────────────────────────────────────────┐
│ PASSO 2: Claude ativa skill                                 │
└─────────────────────────────────────────────────────────────┘

Claude detecta:
- Keyword: "nota"
- URL pattern: youtube.com
- Ativa skill: nota-obsidian
- Carrega: SKILL.md

┌─────────────────────────────────────────────────────────────┐
│ PASSO 3: FASE 1 - DETECT                                    │
└─────────────────────────────────────────────────────────────┘

Claude executa:
1. Identifica tipo: "video_youtube" (via URL pattern)
2. Identifica autoria: "terceiros" (default, sem palavra "meu")
3. Consulta workflow: references/workflow-youtube.md

Resultado:
- tipo: video_youtube
- autoria: terceiros
- workflow: workflow-youtube.md

┌─────────────────────────────────────────────────────────────┐
│ PASSO 4: FASE 2 - EXTRACT                                   │
└─────────────────────────────────────────────────────────────┘

Claude executa Python script:
```bash
python "C:\Users\Alex\.claude\skills\nota-obsidian\scripts\extrator-youtube.py" "https://www.youtube.com/watch?v=ABC123"
```

Script retorna:
```
Titulo: Como Criar APIs REST com Node.js
Canal: Fireship
Data: 2025-12-20
Duracao: 12:34
Views: 123,456
Likes: 5,432

Descricao:
Aprenda a criar APIs REST profissionais com Node.js e Express...

==================================================
TRANSCRICAO COMPLETA
==================================================

00:00 - 00:15
  Olá, hoje vamos aprender a criar APIs REST

00:15 - 00:30
  Primeiro, vamos instalar o Node.js...

(continua)
```

Claude extrai:
- titulo: "Como Criar APIs REST com Node.js"
- canal: "Fireship"
- data_publicacao: "2025-12-20"
- duracao: "12:34"
- descricao: "..."
- transcricao: "..."

┌─────────────────────────────────────────────────────────────┐
│ PASSO 5: FASE 3 - GENERATE                                  │
└─────────────────────────────────────────────────────────────┘

Claude lê config:
```bash
cat C:\Users\Alex\.claude\skills\nota-obsidian\config.json
```

Obtém:
- vault_path: "C:/dev/obsidian-alexdonega"
- temp_dir: "C:/dev/obsidian-note-reviewer/.temp"
- note_paths.video_youtube: "Atlas/Conteudos/Video Youtube"

Claude carrega template:
```bash
cat C:\Users\Alex\.claude\skills\nota-obsidian\templates\content\video-youtube.md
```

Claude preenche template:
- Frontmatter: titulo, canal, data_publicacao, duracao, etc.
- Resumo: gera síntese em 3-5 linhas
- Léxico: extrai conceitos da transcrição
- Mapa de Conceitos: cria diagrama Mermaid
- Explicação Detalhada: estrutura passo-a-passo
- Como Aplicar: extrai ações práticas
- Transcrição: copia transcrição completa

Resultado: nota markdown COMPLETA (500+ linhas)

┌─────────────────────────────────────────────────────────────┐
│ PASSO 6: FASE 4 - REVIEW (ciclo pode repetir)               │
└─────────────────────────────────────────────────────────────┘

Claude executa tool_use:
```
ExitPlanMode({
  "plan": "---\ntitulo: Como Criar APIs REST...\n(nota completa)"
})
```

Hook system do Claude Code:
1. Detecta ExitPlanMode
2. Executa: bun run apps/hook/server/index.ts
3. Passa stdin: { "tool_input": { "plan": "..." } }

Server (apps/hook/server/index.ts):
1. Lê stdin
2. Extrai planContent = event.tool_input.plan
3. Inicia servidor HTTP em porta aleatória (ex: 3847)
4. Abre browser: http://localhost:3847?savePath=C:/dev/obsidian-alexdonega/Atlas/Conteudos/Video%20Youtube/como-criar-apis-rest-fireship.md

Browser abre → App.tsx carrega:
1. Fetch /api/plan → retorna nota
2. Parse markdown → blocos
3. Renderiza nota com syntax highlighting
4. Exibe painel de anotações (vazio inicialmente)

User revisa nota:
- Lê o conteúdo
- Seleciona texto: "Este conceito está incorreto"
- Clica "Delete" → anotação tipo DELETION criada
- Seleciona outro texto: "Adicionar exemplo aqui"
- Adiciona comentário: "Incluir código mostrando POST request"
- Anotação tipo COMMENT criada

User clica botão:
- Botão mostra: "✏️ Fazer Alterações" (laranja, pois tem 2 anotações)

App.tsx handleSaveToVault():
1. Detecta annotations.length > 0
2. Formata feedback:
   ```
   SOLICITAÇÃO DE ALTERAÇÕES:

   ## Linha 45
   ❌ DELETAR: "Este conceito está incorreto"

   ## Linha 67
   💬 COMENTÁRIO sobre: "Adicionar exemplo aqui"
   Sugestão: Incluir código mostrando POST request
   ```

3. POST /api/deny com feedback
4. Server recebe, resolve promise:
   ```javascript
   resolveDecision({
     approved: false,
     feedback: feedbackText
   })
   ```

5. Server escreve stdout:
   ```json
   {
     "hookSpecificOutput": {
       "decision": {
         "behavior": "deny",
         "message": "SOLICITAÇÃO DE ALTERAÇÕES:\n\n..."
       }
     }
   }
   ```

6. Server fecha
7. Browser mostra overlay: "Alterações Solicitadas - Retorne ao terminal"

Claude recebe resposta:
- Parse JSON
- Extrai message (feedback)
- Analisa feedback:
  - "Linha 45: DELETAR ..." → remove parágrafo
  - "Linha 67: COMENTÁRIO ..." → adiciona código de exemplo

Claude edita nota:
- Remove trecho incorreto
- Adiciona exemplo de código POST

Claude executa NOVAMENTE:
```
ExitPlanMode({
  "plan": "(nota editada com mudanças aplicadas)"
})
```

Reviewer abre novamente → user revisa → desta vez aprova

┌─────────────────────────────────────────────────────────────┐
│ PASSO 7: User aprova (sem mais anotações)                   │
└─────────────────────────────────────────────────────────────┘

User:
- Lê nota editada
- Satisfeito com as mudanças
- NÃO faz novas anotações
- Clica botão: "💾 Salvar no Obsidian" (roxo, sem anotações)

App.tsx handleSaveToVault():
1. Detecta annotations.length === 0
2. Reconstrói markdown dos blocos (inclui edições de frontmatter)
3. POST /api/save:
   ```json
   {
     "content": "---\ntitulo: ...\n(nota completa)",
     "path": "C:/dev/obsidian-alexdonega/Atlas/Conteudos/Video Youtube/como-criar-apis-rest-fireship.md"
   }
   ```

Server /api/save:
1. Cria diretório (se não existe)
2. Escreve arquivo no vault
3. Retorna sucesso

App.tsx:
4. POST /api/approve (aprovação automática)

Server:
5. resolve({ approved: true })
6. Escreve stdout:
   ```json
   {
     "hookSpecificOutput": {
       "decision": { "behavior": "allow" }
     }
   }
   ```
7. Fecha servidor

Browser mostra overlay: "Nota Aprovada - Retorne ao terminal"

┌─────────────────────────────────────────────────────────────┐
│ PASSO 8: Claude finaliza                                    │
└─────────────────────────────────────────────────────────────┘

Claude recebe: behavior = "allow"

Claude executa FASE 5 - FINALIZE:
1. Lê config.json → vault_path + note_paths[video_youtube]
2. Constrói path final:
   "C:/dev/obsidian-alexdonega/Atlas/Conteudos/Video Youtube/como-criar-apis-rest-fireship.md"
3. Nota JÁ foi salva pelo reviewer (via /api/save)
4. Claude apenas confirma e retorna link

Claude exibe para user:
```
✅ Nota salva com sucesso!

📄 Arquivo: como-criar-apis-rest-fireship.md
📂 Local: Atlas/Conteudos/Video Youtube/

🔗 Abrir no Obsidian:
obsidian://open?vault=obsidian-alexdonega&file=Atlas%2FConteudos%2FVideo%20Youtube%2Fcomo-criar-apis-rest-fireship.md
```

User clica link → Obsidian abre a nota

DONE ✅
```

### 4.2 Casos Especiais

**Caso A: User cancela no reviewer**
- Server timeout (5 min)
- Retorna behavior: "deny", message: "Timeout - user não respondeu"
- Claude exibe: "Revisão cancelada. Execute novamente quando quiser continuar."

**Caso B: Erro na extração (YouTube sem legendas)**
- Python script retorna: "Transcricao nao disponivel"
- Claude detecta erro
- Pede ao user: "Cole a transcrição manualmente ou use outro vídeo"

**Caso C: User edita frontmatter no reviewer**
- User clica "Editar" no bloco YAML
- Altera status: "nao_iniciado" → "em_andamento"
- Clica "Salvar no Obsidian"
- Frontmatter editado é salvo no arquivo

---

## 5. Plano de Migração

### 5.1 Estado Atual dos Projetos

**Skill (nota-obsidian):**
- ✅ SKILL.md funcionando (DETECT + EXTRACT + SAVE)
- ✅ Scripts Python funcionando (extrator-youtube.py, extrator-gdrive.py)
- ✅ Workflows documentados (references/)
- ❌ Não tem config.json
- ❌ Não tem pasta templates/
- ❌ Não tem FASE 4 (REVIEW)

**Reviewer (obsidian-note-reviewer):**
- ✅ Hook system funcionando (stdin/stdout)
- ✅ UI funcionando (anotações, highlights)
- ✅ Endpoints /api/plan, /api/approve, /api/deny funcionando
- ✅ Endpoint /api/save funcionando
- ⚠️ Tem endpoints extras desnecessários (/api/template, /api/extract, /api/config/*)
- ⚠️ Lógica de botão não é condicional (sempre mostra "Salvar")
- ❌ Não tem formatação de feedback (anotações → texto)

### 5.2 O Que Precisa Ser Criado do Zero

1. **config.json na skill**
   - Arquivo novo
   - Formato JSON definido
   - Paths centralizados

2. **templates/ na skill**
   - Copiar do vault
   - Renomear arquivos
   - Limpar blocos `<gerador-nota-*>`

3. **FASE 4 no SKILL.md**
   - Adicionar instruções de review
   - Adicionar lógica de loop
   - Adicionar parse de feedback

4. **Formatação de feedback no App.tsx**
   - Função `formatFeedbackFromAnnotations()`
   - Converter anotações em texto estruturado

### 5.3 O Que Precisa Ser Refatorado

1. **apps/hook/server/index.ts**
   - Remover endpoints: /api/template, /api/extract, /api/config/*
   - Simplificar código (de 583 linhas para ~150)
   - Manter apenas: /api/plan, /api/approve, /api/deny, /api/save

2. **packages/editor/App.tsx**
   - Atualizar handleSaveToVault (lógica condicional)
   - Adicionar formatFeedbackFromAnnotations
   - Atualizar visual do botão (laranja/roxo)

3. **SKILL.md**
   - Renomear FASE 3: SAVE → FASE 5: FINALIZE
   - Adicionar FASE 4: REVIEW
   - Adicionar leitura de config.json
   - Atualizar links de templates (skill em vez de vault)

### 5.4 Ordem de Implementação

**Dia 1: Setup da Skill**
- [ ] 1.1 Criar config.json na skill
- [ ] 1.2 Criar pasta templates/content/ e templates/work/
- [ ] 1.3 Copiar templates do vault para skill
- [ ] 1.4 Renomear templates (remover "template-" prefix)
- [ ] 1.5 Limpar blocos `<gerador-nota-*>` dos templates
- [ ] 1.6 Atualizar SKILL.md:
  - [ ] Adicionar seção de leitura de config.json
  - [ ] Adicionar FASE 4: REVIEW
  - [ ] Renomear FASE 3 → FASE 5
  - [ ] Atualizar paths de templates
- [ ] 1.7 Testar leitura de config (cat config.json)

**Dia 2: Simplificar Reviewer**
- [ ] 2.1 Backup de apps/hook/server/index.ts
- [ ] 2.2 Remover endpoints desnecessários
- [ ] 2.3 Simplificar código (remover imports não usados)
- [ ] 2.4 Testar endpoints restantes:
  - [ ] GET /api/plan
  - [ ] POST /api/approve
  - [ ] POST /api/deny
  - [ ] POST /api/save
- [ ] 2.5 Atualizar App.tsx:
  - [ ] Implementar formatFeedbackFromAnnotations()
  - [ ] Atualizar handleSaveToVault (lógica condicional)
  - [ ] Atualizar visual do botão (laranja/roxo)
- [ ] 2.6 Testar UI:
  - [ ] Botão muda cor quando adiciona anotações
  - [ ] Feedback é gerado corretamente
  - [ ] POST /api/deny recebe feedback

**Dia 3: Integração e Testes**
- [ ] 3.1 Testar fluxo completo: vídeo YouTube
  - [ ] User: "crie nota do vídeo X"
  - [ ] Claude detecta tipo
  - [ ] Claude executa Python
  - [ ] Claude gera nota
  - [ ] Reviewer abre automaticamente
  - [ ] User faz anotações
  - [ ] User clica "Fazer Alterações"
  - [ ] Claude edita nota
  - [ ] Reviewer reabre
  - [ ] User aprova
  - [ ] Nota salva no vault
  - [ ] Link obsidian:// retornado
- [ ] 3.2 Testar outros tipos de nota:
  - [ ] Artigo (WebFetch)
  - [ ] Livro (input manual)
  - [ ] Conceito (input + pesquisa)
- [ ] 3.3 Testar casos especiais:
  - [ ] Vídeo sem legendas
  - [ ] User cancela reviewer
  - [ ] User edita frontmatter
  - [ ] Múltiplos ciclos de revisão (3+ vezes)
- [ ] 3.4 Documentar em CLAUDE.md do reviewer:
  - [ ] Como funciona a integração
  - [ ] Endpoints da API
  - [ ] Formato de feedback
- [ ] 3.5 Atualizar troubleshooting.md da skill:
  - [ ] Erros comuns
  - [ ] Como debugar hook

### 5.5 Rollback Plan

**Se algo der errado:**

1. **Skill:** Manter SKILL.md antigo em `SKILL.md.bak`
2. **Reviewer:** Git commit antes de mudanças (tag: `pre-ultrathink`)
3. **Templates:** Vault mantém templates originais (não deletar)

**Comando de rollback:**
```bash
# Reviewer
cd C:\dev\obsidian-note-reviewer
git reset --hard pre-ultrathink

# Skill
cd C:\Users\Alex\.claude\skills\nota-obsidian
cp SKILL.md.bak SKILL.md
```

---

## 6. Configuração e DX (Developer Experience)

### 6.1 Como User Configura Vault do Obsidian

**Passo 1:** Editar config.json da skill

```bash
# Abrir arquivo
notepad C:\Users\Alex\.claude\skills\nota-obsidian\config.json

# Editar paths
{
  "vault_path": "C:/Users/MeuNome/Documents/MeuVault",
  "temp_dir": "C:/dev/obsidian-note-reviewer/.temp",
  ...
}
```

**Passo 2:** Validar paths

```bash
# Verificar se vault existe
ls "C:/Users/MeuNome/Documents/MeuVault"

# Verificar se pastas de destino existem
ls "C:/Users/MeuNome/Documents/MeuVault/Atlas/Conteudos/Video Youtube"
```

**Passo 3:** Testar com nota simples

```
User: "crie uma nota de conceito sobre REST API"
Claude: (gera nota) → abre reviewer → user aprova → salvo no vault
```

**Se der erro:** Verificar troubleshooting.md

### 6.2 Como User Instala/Atualiza o Reviewer

**Instalação inicial:**

```bash
# Clonar repositório
git clone https://github.com/alexdonega/obsidian-note-reviewer.git
cd obsidian-note-reviewer

# Instalar dependências
bun install

# Build
bun run build:hook

# Testar servidor
bun run apps/hook/server/index.ts
```

**Configurar hook no Claude Code:**

Criar `.claude/hooks/exit-plan-mode.json`:

```json
{
  "hookName": "ExitPlanMode",
  "command": "bun",
  "args": ["run", "C:/dev/obsidian-note-reviewer/apps/hook/server/index.ts"],
  "blocking": true,
  "inputMode": "stdin"
}
```

**Atualização:**

```bash
cd C:\dev\obsidian-note-reviewer
git pull
bun install
bun run build:hook
```

### 6.3 Como Skill Encontra o Executável do Reviewer

**Não precisa.** A skill NÃO executa o reviewer diretamente.

**Fluxo:**
1. Skill executa tool_use: `ExitPlanMode({ plan: "..." })`
2. Claude Code (não a skill) detecta hook configurado
3. Claude Code executa comando do hook: `bun run apps/hook/server/index.ts`

**Responsabilidade:**
- Skill: apenas chamar tool_use
- Claude Code: executar hook
- User: configurar hook uma única vez

### 6.4 Onde Ficam os Logs para Debug

**Logs da Skill:**
- Terminal do Claude Code (stdout)
- Claude exibe erros automaticamente

**Logs do Reviewer:**
```
C:\dev\obsidian-note-reviewer\apps\hook\server\index.ts

console.log() → stdout (capturado pelo Claude Code)
console.error() → stderr (exibido no terminal)
```

**Logs do Browser (App.tsx):**
```
F12 → Console

Logs úteis:
- "✅ Nota carregada"
- "🟠 Solicitando alterações com X anotações"
- "🟣 Salvando nota no Obsidian..."
- "✅ Nota salva: {path}"
```

**Debug de feedback:**
```typescript
// App.tsx - adicionar log
const feedbackText = formatFeedbackFromAnnotations(annotations, blocks);
console.log('📤 Feedback gerado:', feedbackText);
```

**Arquivos de debug:**
```
C:\dev\obsidian-note-reviewer\.temp\
- draft-20260101-143052-v1.md  # Primeira versão
- draft-20260101-143052-v2.md  # Após edição 1
- draft-20260101-143052-v3.md  # Após edição 2

Deletados após salvamento bem-sucedido
```

---

## 7. Casos de Uso e Fluxos Alternativos

### 7.1 Caso de Uso: Artigo Web

```
User: "crie uma nota do artigo https://example.com/post"

Claude:
1. DETECT → tipo: artigo, autoria: terceiros
2. EXTRACT → WebFetch (sem Python)
3. GENERATE → usa template artigo.md
4. REVIEW → abre reviewer
5. User revisa → aprova
6. FINALIZE → salva em Atlas/Conteudos/Artigos/
```

### 7.2 Caso de Uso: Conceito (sem URL)

```
User: "crie uma nota de conceito sobre Design Patterns"

Claude:
1. DETECT → tipo: atomica, autoria: terceiros
2. EXTRACT → input do user + pesquisa web
3. GENERATE → usa template atomica.md
4. REVIEW → abre reviewer
5. User adiciona anotações: "incluir exemplo de Singleton"
6. Claude edita → adiciona exemplo
7. REVIEW novamente → user aprova
8. FINALIZE → salva em Atlas/Atomos/Conceitos/
```

### 7.3 Caso de Uso: Projeto Próprio

```
User: "crie uma nota do meu projeto IA Tutor"

Claude:
1. DETECT → tipo: projeto, autoria: alex (palavra "meu")
2. EXTRACT → input do user (perguntas: objetivo, tecnologias, status)
3. GENERATE → usa templates/work/projeto.md
4. REVIEW → abre reviewer
5. User aprova
6. FINALIZE → salva em Work/Projetos/
```

---

## 8. Métricas de Sucesso

**Antes do ultrathink:**
- Tempo médio: ~5 min (gerar nota → copiar → abrir app → colar → revisar → fechar)
- Ciclos de revisão: 1 (difícil iterar)
- Fricção: Alta (muitos passos manuais)

**Depois do ultrathink:**
- Tempo médio: ~2 min (solicitar → revisar visualmente → aprovar)
- Ciclos de revisão: 2-3 (fácil iterar)
- Fricção: Baixa (zero copiar/colar)

**Indicadores técnicos:**
- ✅ Zero duplicação de regras (skill tem tudo)
- ✅ Zero configuração manual de paths (config.json)
- ✅ Reviewer 100% stateless (pode ser destruído e recriado)
- ✅ Fluxo contínuo (não quebra contexto do terminal)

---

## 9. Próximos Passos (Pós-Implementação)

**Melhorias futuras (não prioritárias):**

1. **Cache de templates** (skill carrega uma vez)
2. **Validação de YAML** (checar frontmatter antes de salvar)
3. **Preview Mermaid** (renderizar diagramas no reviewer)
4. **Diff visual** (mostrar mudanças entre versões)
5. **Suporte a imagens** (copiar screenshots para vault)
6. **Multi-vault** (permitir múltiplos vaults em config.json)

**Não fazer agora:**
- ❌ Sistema de plugins para reviewer (premature abstraction)
- ❌ Modo offline (web é requisito)
- ❌ Sync com Obsidian Sync (out of scope)

---

## 10. Checklist de Validação Pré-Launch

**Antes de considerar "pronto":**

### Funcional
- [ ] Fluxo completo funciona: video YouTube → revisar → editar → salvar
- [ ] Feedback de anotações é claro para Claude
- [ ] Loop de revisão funciona (3+ ciclos)
- [ ] Salvamento no vault funciona (arquivo criado corretamente)
- [ ] Link obsidian:// abre nota no Obsidian

### Técnico
- [ ] Endpoints desnecessários removidos
- [ ] Código simplificado (server.ts < 200 linhas)
- [ ] config.json carregado corretamente
- [ ] Templates carregados da skill (não do vault)
- [ ] Logs úteis em lugares certos

### UX
- [ ] Botão muda cor baseado em anotações
- [ ] Overlay de "alterações solicitadas" aparece
- [ ] Overlay de "nota aprovada" aparece
- [ ] User não precisa configurar nada manualmente (paths fixos)

### Documentação
- [ ] README.md do reviewer atualizado
- [ ] SKILL.md da skill atualizado
- [ ] troubleshooting.md cobre erros comuns
- [ ] CLAUDE.md documenta API e hooks

---

## Apêndices

### A. Estrutura Completa de Arquivos (Pós-Migração)

```
C:\Users\Alex\.claude\skills\nota-obsidian\
├── SKILL.md                      # Orquestrador (ATUALIZADO)
├── config.json                   # NOVO
├── templates/                    # NOVO
│   ├── content/
│   │   ├── video-youtube.md
│   │   ├── artigo.md
│   │   ├── newsletter.md
│   │   ├── livro.md
│   │   ├── curso.md
│   │   ├── aula.md
│   │   ├── podcast.md
│   │   ├── palestra.md
│   │   ├── entrevista.md
│   │   ├── atomica.md
│   │   ├── framework.md
│   │   ├── pessoa.md
│   │   ├── citacao.md
│   │   ├── moc.md
│   │   └── dashboard.md
│   └── work/
│       ├── artigo-alex.md
│       ├── video-youtube-alex.md
│       ├── projeto.md
│       ├── tutorial.md
│       ├── conteudo-mestre.md
│       └── roteiro.md
├── references/
│   ├── workflow-youtube.md
│   ├── workflow-web.md
│   ├── workflow-educacional.md
│   ├── workflow-conceito.md
│   ├── workflow-organizacional.md
│   ├── troubleshooting.md
│   ├── lexico.md
│   └── anti-patterns.md
└── scripts/
    ├── extrator-youtube.py
    └── extrator-gdrive.py

C:\dev\obsidian-note-reviewer\
├── apps/
│   └── hook/
│       ├── server/
│       │   └── index.ts          # SIMPLIFICADO (~150 linhas)
│       ├── dist/
│       │   └── index.html
│       ├── package.json
│       └── vite.config.ts
├── packages/
│   ├── editor/
│   │   ├── App.tsx               # ATUALIZADO (botão condicional)
│   │   └── package.json
│   └── ui/
│       └── (sem mudanças)
├── .temp/                        # NOVO (drafts temporários)
│   └── draft-*.md
├── docs/
│   ├── plans/
│   │   └── 260101-01a-spec-ultrathink-unified-system.md  # ESTE ARQUIVO
│   └── vision/
│       └── 260101-01-obsidian-note-system-vision.md
├── package.json
├── README.md
└── CLAUDE.md
```

### B. Mapeamento de Responsabilidades

| Responsabilidade | Onde Vive | Quem Executa |
|:-----------------|:----------|:-------------|
| Detectar tipo de nota | SKILL.md | Claude |
| Carregar template | templates/ (skill) | Claude |
| Extrair conteúdo (YouTube) | scripts/extrator-youtube.py | Claude (via Python) |
| Gerar nota markdown | SKILL.md + templates | Claude |
| Abrir reviewer | Hook ExitPlanMode | Claude Code |
| Exibir nota visualmente | App.tsx | Browser |
| Coletar anotações | App.tsx | User |
| Formatar feedback | App.tsx | Browser |
| Editar nota com feedback | SKILL.md | Claude |
| Salvar no vault | /api/save (server.ts) | Reviewer |
| Construir link obsidian:// | SKILL.md | Claude |
| Configurar paths | config.json | User (uma vez) |

### C. Glossário

- **Skill:** Pasta em `.claude/skills/` com SKILL.md e recursos
- **Reviewer:** App web (obsidian-note-reviewer) para revisar notas
- **Hook:** Sistema do Claude Code para interceptar tool_use e executar código externo
- **ExitPlanMode:** Hook específico que abre o reviewer
- **Tool_use:** Comando do Claude para executar ferramentas (Read, Write, ExitPlanMode, etc.)
- **stdin/stdout:** Input/output padrão do Unix (usado para comunicação hook)
- **Stateless:** Sem estado persistente; cada execução é independente
- **Draft:** Versão temporária da nota durante revisão
- **Vault:** Diretório raiz do Obsidian
- **Frontmatter:** Metadados YAML no topo do arquivo markdown

---

## Conclusão

Este plano define EXATAMENTE como implementar o sistema ultrathink:

1. **Skill = Cérebro** (regras, templates, lógica)
2. **Reviewer = Interface** (apenas UI e feedback)
3. **Zero duplicação** (uma fonte de verdade)
4. **Fluxo contínuo** (user nunca sai do terminal)

**Próxima ação:** Seguir ordem de implementação (Dia 1 → Dia 2 → Dia 3)

**Critério de sucesso:** User digita "crie nota do vídeo X" → 2 minutos depois, nota está no Obsidian com zero fricção.

---

**END OF PLAN**
