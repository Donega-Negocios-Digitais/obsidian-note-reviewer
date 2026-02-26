<p align="center">
  <img src="apps/marketing/public/og-image.webp" alt="obsidian-note-reviewer" width="80%" />
</p>

# obsidian-note-reviewer

## 🚀 Instalação Rápida do Plugin

👉 Guia visível e completo: [INSTALACAO-PLUGIN.md](./INSTALACAO-PLUGIN.md)

Interactive Plan Review for AI Coding Agents. Mark up and refine your plans using a visual UI, share for team collaboration, and seamlessly integrate with **Claude Code**.

<p align="center">
<a href="https://www.youtube.com/watch?v=bCkCWnmAD-o">
<img src="apps/marketing/public/youtube.png" alt="Claude Code Demo" width="60%" />
</a>
<br />
<a href="https://www.youtube.com/watch?v=bCkCWnmAD-o">Watch Demo</a>
</p>

---

## Install for Claude Code

**Install the `obsidian-note-reviewer` command:**

**macOS / Linux / WSL:**

```bash
curl -fsSL https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.sh | bash
```

**Windows PowerShell:**

```powershell
irm https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.ps1 | iex
```

**Then in Claude Code:**

```
/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer
/plugin install obsreview@obsidian-note-reviewer

# IMPORTANT: Restart Claude Code after plugin install
```

See [apps/hook/README.md](apps/hook/README.md) for detailed installation instructions including a `manual hook` approach.
Agent/CLI instructions are centralized in [AGENTS.md](AGENTS.md).

---

## Onboarding by Mode

| Mode | Local plugin install | Login required | Primary usage |
|---|---|---|---|
| Portal Web (`apps/portal`) | No | Yes (`/editor` is protected) | Save notes to app database (`Meus Documentos`) |
| Hook/CLI (`apps/hook`) | Yes (`obsreview` + Claude hooks) | No (local flow) | Review plans/notes and send feedback to Claude |

Notes:
- If the user is not authenticated in Portal Web, access is redirected to `/auth/login`.
- Hook UI opens only when Claude performs `Write/Edit/MultiEdit` on matched files.
- Chat-only answers (no file write/edit) do not trigger review UI.

---

## How It Works

For Claude plan review, obsidian-note-reviewer runs a continuous pre-execution flow:

1. Claude writes plan files in `/.claude/plans/...`
2. The UI opens before `Ready to code`
3. **Request changes** keeps the same session/tab and sends structured feedback
4. Claude rewrites the plan and the same UI updates
5. **Approve** releases execution and Claude proceeds

### Hook Trigger Behavior

- The review UI opens only when there is a `Write`, `Edit`, or `MultiEdit` that targets a plan file under `/.claude/plans/...`.
- If the agent answers only in chat (without writing/editing a plan file), no hook UI is opened.
- Repeated `GET /api/plan` and `GET /api/session/decision` logs are expected polling in live review mode.

---

## Note Saving (3 Independent Actions)

The product now treats note actions explicitly and independently:

1. `Salvar no app`  
   - Available in Portal Web runtime.
   - Persists markdown in app database and keeps it in `Meus Documentos`.

2. `Salvar no Obsidian`  
   - Uses local hook server endpoint `POST /api/save`.
   - Writes UTF-8 markdown to disk, creates missing folders, and validates paths against traversal.
   - Optional hardening via `ALLOWED_SAVE_PATHS`.

3. `Enviar para Claude`  
   - Hook/CLI runtime only.
   - Sends feedback decisions through review endpoints without blocking app/vault persistence.

---

## Recent UI Updates (2026-02-10)

- Header action updated: primary sharing action is now exposed as **Compartilhar** (using export flow under the hood).
- Theme toggle behavior simplified: single-click **Light/Dark** switch (no theme dropdown).
- Theme transition improved for smoother visual switching.
- Integration cards now use branded SVG logos for **Notion** and **Obsidian**.

---

## License

**Copyright (c) 2025 backnotprop.**

This project is licensed under the **Business Source License 1.1 (BSL)**.

<!-- teste plannotator -->
