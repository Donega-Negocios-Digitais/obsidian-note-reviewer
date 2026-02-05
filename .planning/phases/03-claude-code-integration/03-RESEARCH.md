# Phase 3: Claude Code Integration - Research

**Researched:** 2026-02-05
**Domain:** Claude Code Hooks Integration + Obsidian Plugin API + Inter-Process Communication
**Confidence:** MEDIUM

## Summary

This phase focuses on integrating the Obsidian Note Reviewer with Claude Code through hooks, enabling seamless AI-assisted plan review. The research covered Claude Code's hook system (PostToolUse, PermissionRequest), Obsidian's plugin API events (onLayoutReady, metadataCache), inter-process communication patterns (local REST API, URI schemes), and structured annotation export formats for AI feedback.

**Primary recommendation:** Extend the existing PostToolUse hook to support both ExitPlanMode (for opening reviewer from Claude Code plan mode) and Write (for Obsidian note creation). Build a structured annotation export system that transforms the Phase 2 annotation data into Claude Code-compatible prompts with an editable customization field.

**Standard Stack:**
- **Hooks:** Claude Code PostToolUse (Write), PermissionRequest (ExitPlanMode)
- **Obsidian Events:** onLayoutReady, metadataCache.on('changed')
- **Communication:** Local REST API (Bun.serve) + obsidian:// URI scheme
- **Annotation Export:** TypeScript type transformations from Phase 2 Annotation types
- **Prompt Template:** Editable React component with textarea for customization

## User Constraints (from CONTEXT.md)

No CONTEXT.md exists for Phase 3. All implementation choices are at Claude's discretion within the requirements constraints.

### Requirements Locked In

**CLAU-01:** Hook abre reviewer automaticamente ao criar nota no Obsidian
**CLAU-02:** Hook abre reviewer automaticamente ao ativar plan mode no Claude Code
**CLAU-03:** Anotacoes sao enviadas de volta ao Claude Code em formato estruturado
**CLAU-04:** Prompt fixo automatico formata as revisoes para o Claude Code
**CLAU-05:** Campo editavel permite customizar o prompt antes de enviar
**CLAU-06:** Todas as anotacoes sao incluidas: edicoes, comentarios globais, comentarios individuais, exclusoes, marcacoes

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| **Bun.serve** | latest (via Bun runtime) | Local HTTP server for hook ephemeral UI | Already used in apps/hook/server/index.ts - proven pattern |
| **Zustand** | ^5.0.9 | State management for annotation export | Existing useAnnotationStore from Phase 2 - consistent architecture |
| **React** | ^18 | UI for prompt customization field | Existing React app in apps/portal - maintain consistency |
| **TypeScript** | ^5 | Type-safe annotation transformation | Existing codebase - enables structured export format |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| **date-fns** | ^4.1.0 | Timestamp formatting in Claude Code feedback | When including timestamps in exported annotations |
| **Obsidian Plugin API** | latest | onLayoutReady, metadataCache events for Obsidian-side hooks | When building Obsidian plugin for CLAU-01 (automatic opening on note creation) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Bun.serve | Node.js http, Express | Bun is lighter and already used - no npm dependencies |
| PostToolUse hook | PreToolUse hook | PreToolUse runs before tool execution (can't see file content) |
| Local REST API | WebSocket, IPC file | REST is simpler for request/response pattern; WebSocket overkill |

**Installation:**
```bash
# No new packages needed - all dependencies already in package.json
# Existing: zustand, react, date-fns, @supabase/supabase-js
```

## Architecture Patterns

### Recommended Project Structure

```
apps/hook/
├── hooks/
│   ├── hooks.json           # Claude Code hook configuration (existing)
│   └── claude-hooks.json    # New: ExitPlanMode hook configuration
├── server/
│   ├── index.ts             # Existing: PostToolUse Write handler
│   ├── planModeHook.ts      # New: ExitPlanMode handler
│   └── annotationExport.ts  # New: Structured export utilities
├── client/                  # New: Hook UI components
│   ├── PromptEditor.tsx     # Editable prompt customization field
│   └── AnnotationExport.tsx # Preview of annotations to send
└── dist/                    # Built HTML for hook UI

packages/ui/
├── utils/
│   └── claudeExport.ts      # New: Annotation → Claude Code prompt transformer
└── types/
    └── claude.ts            # New: Claude Code feedback types

obsidian-plugin/             # New: Obsidian plugin for CLAU-01
├── main.ts                  # Plugin entry point
├── events.ts                # onLayoutReady, metadataCache handlers
└── manifest.json            # Plugin manifest
```

### Pattern 1: Claude Code Hook Flow

**What:** Hook lifecycle for ExitPlanMode → Reviewer → Claude Code feedback

**When to use:** When user activates plan mode in Claude Code (ExitPlanMode permission request)

**Example:**
```typescript
// Source: apps/hook/hooks/claude-hooks.json (new file)
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [
          {
            "type": "command",
            "command": "obsreview-plan",
            "timeout": 1800
          }
        ]
      }
    ]
  }
}
```

**Flow:**
1. User runs `/plan` command in Claude Code
2. ExitPlanMode permission request triggers
3. `obsreview-plan` command spawns Bun server
4. Server opens reviewer UI in browser
5. User creates annotations, clicks "Send to Claude Code"
6. Server outputs structured JSON to stdout
7. Claude Code receives JSON as additional context

### Pattern 2: Annotation Export Format

**What:** Transform Phase 2 annotations into Claude Code-readable prompt

**When to use:** When user clicks "Send to Claude Code" button

**Example:**
```typescript
// Source: packages/ui/utils/claudeExport.ts (new file)
import { Annotation, AnnotationType, AnnotationStatus } from '../types';

export interface ClaudeAnnotation {
  type: 'edit' | 'comment_global' | 'comment_individual' | 'deletion' | 'highlight';
  text?: string;
  originalText?: string;
  comment?: string;
  status?: 'open' | 'in_progress' | 'resolved';
  lineNumber?: number;
}

export function exportForClaude(annotations: Annotation[]): {
  summary: string;
  annotations: ClaudeAnnotation[];
  totalCount: number;
} {
  return {
    summary: `${annotations.length} anotações na revisão`,
    annotations: annotations.map(transformAnnotation),
    totalCount: annotations.length
  };
}

function transformAnnotation(a: Annotation): ClaudeAnnotation {
  switch (a.type) {
    case AnnotationType.DELETION:
      return { type: 'deletion', originalText: a.originalText };
    case AnnotationType.COMMENT:
      return { type: 'comment_individual', text: a.originalText, comment: a.text };
    case AnnotationType.GLOBAL_COMMENT:
      return { type: 'comment_global', comment: a.text };
    case AnnotationType.INSERTION:
      return { type: 'edit', text: a.text, originalText: a.originalText };
    case AnnotationType.REPLACEMENT:
      return { type: 'edit', text: a.text, originalText: a.originalText };
  }
}
```

### Pattern 3: Editable Prompt Template

**What:** React component with textarea for prompt customization

**When to use:** On reviewer UI before sending annotations to Claude Code

**Example:**
```typescript
// Source: apps/hook/client/PromptEditor.tsx (new file)
import { useState } from 'react';

const DEFAULT_PROMPT = `Aqui estão as revisões do plano:

{summary}

## Anotações Detalhadas

{annotations}

Por favor, revise e implemente estas mudanças.`;

export function PromptEditor({ annotations }: { annotations: ClaudeAnnotation[] }) {
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);

  const formattedAnnotations = annotations.map(a => formatAnnotation(a)).join('\n');

  const finalPrompt = prompt
    .replace('{summary}', `${annotations.length} anotações`)
    .replace('{annotations}', formattedAnnotations);

  return (
    <div className="prompt-editor">
      <label>Prompt para Claude Code (editável):</label>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={6}
      />
      <button onClick={() => sendToClaude(finalPrompt)}>
        Enviar para Claude Code
      </button>
    </div>
  );
}
```

### Anti-Patterns to Avoid

- **Hardcoded prompts without customization:** Users need to adjust the prompt context
- **Only sending approved annotations:** All annotation types (deletions, highlights, global comments) must be included per CLAU-06
- **Synchronous hook processing:** Hooks must spawn async server and wait for user decision (timeout: 1800)
- **Ignoring annotation status:** Include status (open/in-progress/resolved) in export for Claude context

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Local HTTP server | Custom Node http, Express | Bun.serve | Already used in apps/hook/server/index.ts - proven pattern |
| Obsidian URI opening | Manual browser launch, deep linking | obsidian://open?vault=&file= | Standard URI scheme Obsidian supports |
| Hook JSON parsing | Custom regex, string splitting | JSON.parse(event.tool_input) | PostToolUse provides structured JSON input |
| Path validation for vault save | Manual path checks | Existing pathValidation.ts | Already has CWE-22 protection |
| Annotation state management | Custom Context API, Redux | Zustand useAnnotationStore | Phase 2 already uses Zustand - consistency |

**Key insight:** The PostToolUse hook pattern is already implemented (apps/hook/server/index.ts). Extend this proven pattern rather than building new hook infrastructure.

## Common Pitfalls

### Pitfall 1: Hook Timeout Exceeded

**What goes wrong:** Hook server runs longer than configured timeout (1800s = 30 min), Claude Code kills the process

**Why it happens:** User walks away during review, server keeps running

**How to avoid:**
- Implement inactivity timeout (e.g., close server after 25 minutes of no API calls)
- Show countdown timer in UI
- Add explicit "Cancel Review" button that closes server

**Warning signs:** Hook occasionally fails with no output, inconsistent behavior

### Pitfall 2: Missing Annotation Types in Export

**What goes wrong:** Only some annotations (comments) sent to Claude Code, missing deletions/highlights

**Why it happens:** Export function only handles COMMENT type, ignores DELETION, GLOBAL_COMMENT

**How to avoid:**
- Map ALL AnnotationType enum values to ClaudeAnnotation types
- Write test cases for each annotation type
- Validate export includes all types: DELETION, INSERTION, REPLACEMENT, COMMENT, GLOBAL_COMMENT

**Warning signs:** Claude Code asks "Where are the deletions?", incomplete feedback

### Pitfall 3: Obsidian Plugin Event Timing Issues

**What goes wrong:** Plugin fires hook before file fully written, reviewer opens with empty content

**Why it happens:** Using immediate event instead of waiting for metadata cache update

**How to avoid:**
```typescript
// CORRECT: Wait for metadata cache to update
app.metadataCache.on('changed', (file) => {
  if (file.path.startsWith('.obsidian/plans/')) {
    openReviewer(file);
  }
});

// WRONG: Opens immediately, file may not be written yet
app.vault.on('create', (file) => {
  openReviewer(file); // File might be empty
});
```

**Warning signs:** Reviewer opens with blank content, intermittent failures

### Pitfall 4: Hook Output Not Parsed by Claude Code

**What goes wrong:** Hook outputs JSON but Claude Code doesn't include it in context

**Why it happens:** Hook outputs to console.log instead of stdout, or JSON format incorrect

**How to avoid:**
```typescript
// CORRECT: Output to stdout, structured JSON
console.log(JSON.stringify({
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    result: "ANNOTATIONS_EXPORTED",
    annotations: claudeAnnotations
  }
}));

// WRONG: console.error goes to stderr, not captured
console.error(JSON.stringify({ annotations }));
```

**Warning signs:** Claude Code doesn't mention annotations in next response, context missing

## Code Examples

Verified patterns from official sources:

### Claude Code Hook Configuration

```typescript
// Source: C:\dev\tools\obsidian-note-reviewer\apps\hook\README.md
// Existing hook pattern for ExitPlanMode

{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [
          {
            "type": "command",
            "command": "obsreview",
            "timeout": 1800
          }
        ]
      }
    ]
  }
}
```

### Bun.serve Ephemeral Server Pattern

```typescript
// Source: C:\dev\tools\obsidian-note-reviewer\apps\hook\server\index.ts
// Existing pattern for PostToolUse Write hook

import { $ } from "bun";

const server = Bun.serve({
  port: 0, // Random available port
  async fetch(req) {
    const url = new URL(req.url);
    if (url.pathname === "/api/export" && req.method === "POST") {
      const body = await req.json();
      // Process annotation export
      return Response.json({ ok: true });
    }
  },
});

// Open browser
const url = `http://localhost:${server.port}`;
await $`cmd /c start ${url}`.quiet();

// Wait for user decision (blocking)
const result = await decisionPromise;

// Output for Claude Code
console.log(JSON.stringify({ hookSpecificOutput: { result } }));
```

### Annotation Type Transformation

```typescript
// Source: C:\dev\tools\obsidian-note-reviewer\packages\ui\types.ts
// Existing AnnotationType enum from Phase 2

export enum AnnotationType {
  DELETION = 'DELETION',
  INSERTION = 'INSERTION',
  REPLACEMENT = 'REPLACEMENT',
  COMMENT = 'COMMENT',
  GLOBAL_COMMENT = 'GLOBAL_COMMENT',
}

export enum AnnotationStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
}
```

```typescript
// NEW: Transform Phase 2 types to Claude Code format
function transformToClaudeFormat(annotation: Annotation): ClaudeAnnotation {
  const typeMap: Record<AnnotationType, ClaudeAnnotation['type']> = {
    [AnnotationType.DELETION]: 'deletion',
    [AnnotationType.INSERTION]: 'edit',
    [AnnotationType.REPLACEMENT]: 'edit',
    [AnnotationType.COMMENT]: 'comment_individual',
    [AnnotationType.GLOBAL_COMMENT]: 'comment_global',
  };

  return {
    type: typeMap[annotation.type],
    text: annotation.text,
    originalText: annotation.originalText,
    comment: annotation.text, // For COMMENT type
    status: annotation.status?.toLowerCase() as any,
    lineNumber: annotation.startOffset, // Approximate line reference
  };
}
```

### Obsidian Plugin Event Hook

```typescript
// Source: Obsidian Plugin API documentation
// Pattern for detecting plan file creation

import { Plugin } from 'obsidian';

export default class PlanReviewerPlugin extends Plugin {
  async onload() {
    // Wait for Obsidian to fully load
    this.app.workspace.onLayoutReady(() => {
      console.log('PlanReviewerPlugin loaded');
    });

    // Detect file changes in plans directory
    this.registerEvent(
      this.app.metadataCache.on('changed', (file) => {
        if (file.path.startsWith('Plans/')) {
          this.openReviewer(file);
        }
      })
    );
  }

  async openReviewer(file: TFile) {
    const content = await this.app.vault.read(file);
    // Open reviewer URL with file content
    window.open(`http://localhost:3000/review?content=${encodeURIComponent(content)}`);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual copy-paste of annotations | Hook-triggered automatic export | 2024-2025 (Claude Code hooks) | Seamless integration, no manual steps |
| Static prompt templates | Editable prompt field with variable substitution | Phase 3 (this phase) | User control over AI context |
| Single hook type (Write) | Multiple hooks (Write + ExitPlanMode) | Phase 3 (this phase) | Coverage for both note creation and plan mode |

**Deprecated/outdated:**
- PreToolUse hook for file creation: Use PostToolUse instead (has access to file content)
- Clipboard-based export: Use stdout JSON output for Claude Code integration
- Manual Obsidian URI construction: Use obsidian://open?vault=&file= standard scheme

## Open Questions

1. **Obsidian Plugin Distribution**
   - What we know: Obsidian plugins need manifest.json, main.ts, and must be installed by user
   - What's unclear: Whether to publish plugin to Obsidian community plugins or distribute as manual install
   - Recommendation: Start with manual install (instructions in README), consider community plugin submission after v1 stable

2. **Claude Code Hook Activation Order**
   - What we know: Both PostToolUse (Write) and PermissionRequest (ExitPlanMode) can trigger reviewer
   - What's unclear: What happens when both hooks fire simultaneously (e.g., Write during plan mode)
   - Recommendation: Implement hook priority - ExitPlanMode takes precedence (plan review context), Write hook checks if plan mode active and skips if true

3. **Annotation Export Size Limits**
   - What we know: Claude Code context window is large but not infinite
   - What's unclear: Maximum annotation count before export becomes unwieldy for Claude
   - Recommendation: Implement pagination for export (show first 50 annotations, add "export remaining" link), monitor在实际使用中的表现

## Sources

### Primary (HIGH confidence)

- `C:\dev\tools\obsidian-note-reviewer\apps\hook\server\index.ts` - Existing PostToolUse Write hook implementation (Bun.serve pattern, JSON stdout output)
- `C:\dev\tools\obsidian-note-reviewer\apps\hook\README.md` - Claude Code plugin documentation (ExitPlanMode hook configuration example)
- `C:\dev\tools\obsidian-note-reviewer\apps\hook\hooks\hooks.json` - Current hook configuration (PostToolUse → Write → obsreview)
- `C:\dev\tools\obsidian-note-reviewer\packages\ui\types.ts` - Phase 2 Annotation types (AnnotationType enum, AnnotationStatus enum, Annotation interface)
- `C:\dev\tools\obsidian-note-reviewer\packages\ui\store\useAnnotationStore.ts` - Phase 2 Zustand store (annotation state management patterns)
- `C:\dev\tools\obsidian-note-reviewer\.planning\ROADMAP.md` - Phase 3 requirements and success criteria (CLAU-01 through CLAU-06)

### Secondary (MEDIUM confidence)

- Obsidian Plugin API Documentation (https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin) - Plugin lifecycle events (onLayoutReady, metadataCache.on)
- Obsidian URI Scheme Documentation (https://help.obsidian.md/Advanced+topics/Using+obsidian+URI) - obsidian://open?vault=&file= format
- WebSearch results for "Claude Code hooks PostToolUse ExitPlanMode 2026" - Hook configuration patterns

### Tertiary (LOW confidence)

- WebSearch results for "Obsidian plugin automatic file open hook" - Indicates metadataCache.on('changed') is standard pattern (needs official docs verification)
- WebSearch results for "annotation export to AI prompt format" - General patterns (no specific source for Claude Code format)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in codebase, existing hook pattern proven
- Architecture: MEDIUM - Hook flow verified, Obsidian plugin pattern needs implementation testing
- Pitfalls: MEDIUM - Based on common async/hook issues, some specific to Obsidian need validation

**Research date:** 2026-02-05
**Valid until:** 2026-03-05 (30 days - Claude Code hooks and Obsidian API are relatively stable, but verify before planning if research is >30 days old)
