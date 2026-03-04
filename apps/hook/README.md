# Obsidian Note Reviewer Claude Code Plugin

This folder contains the Claude Code plugin config for hook flows.

## Official runtime model

For normal users:
1. Install global CLI binary (`obsreview`).
2. Install plugin in Claude Code (`/plugin ...`).

No repo clone is required for normal usage.

Do not run `bun install` inside `~/.claude/plugins/cache/...`.
The official runtime is the global `obsreview` binary.

## Prerequisites

Install `obsreview` so Claude Code can execute local hooks:

**macOS / Linux / WSL**
```bash
curl -fsSL https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.sh | bash
```

**Windows PowerShell**
```powershell
irm https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.ps1 | iex
```

**Windows CMD**
```cmd
curl -fsSL https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.cmd -o install.cmd && install.cmd && del install.cmd
```

Validate:
```bash
obsreview --version
obsreview --help
obsreview doctor
```

---

[Plugin Installation](#plugin-installation) · [Manual Installation (Hooks)](#manual-installation-hooks) · [Commands](#commands)

---

## Plugin Installation

No chat do Claude Code, rode **um comando por vez**.

1) Primeiro:

```text
/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer
```

Espere finalizar.

2) Depois:

```text
/plugin install obsreview@obsidian-note-reviewer
```

Se Claude perguntar escopo de instalacao, selecione:
- **Global (Recommended)**

3) Reinicie o Claude Code.

Sinais de sucesso:
- marketplace adicionado;
- plugin instalado;
- apos reiniciar, hooks/slash commands carregados.

## Manual Installation (Hooks)

The official format is `hooks.matcher/hooks`.
Add this to `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [
          {
            "type": "command",
            "command": "obsreview plan",
            "timeout": 1800
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write",
        "hooks": [
          {
            "type": "command",
            "command": "obsreview plan-live",
            "timeout": 1800
          },
          {
            "type": "command",
            "command": "obsreview obsidian",
            "timeout": 1800
          }
        ]
      },
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "obsreview plan-live",
            "timeout": 1800
          }
        ]
      }
    ]
  }
}
```

## How it works

Primary flow (`plan-live`):
1. Claude writes a plan in `/.claude/plans/...`
2. `PostToolUse/Write` triggers `obsreview plan-live`
3. If `Write` fails and Claude falls back to `Bash`, `PostToolUse/Bash` also triggers `obsreview plan-live`
4. Review UI opens in production app (`/hook-review`) before `Ready to code`
5. Request changes keeps the same browser tab/session
6. In remote mode, approve auto-saves the final note in app (`Meus Documentos`) and then lets Claude continue

Fallback flow (`plan`):
1. `PermissionRequest/ExitPlanMode` triggers `obsreview plan`
2. Used only when `OBSREVIEW_PLAN_REVIEW_MODE=exitplan`

Obsidian flow:
1. `PostToolUse/Write` triggers `obsreview obsidian`
2. Handles vault plan files (`Plans/`, `.obsidian/plans/`, `plan/`)
3. Ignores `/.claude/plans/` to avoid conflict with `plan-live`

## Commands

- `obsreview` -> defaults to `obsreview plan` (hook stdin expected)
- `obsreview --help` -> usage info
- `obsreview --version` -> CLI version
- `obsreview doctor [--json]` -> local diagnostics
- `obsreview plan-live` -> continuous pre-execution plan review
- `obsreview plan` -> ExitPlanMode fallback review
- `obsreview obsidian` -> PostToolUse/Write Obsidian review
- `obsreview annotate <arquivo.md>` -> annotate markdown manually
- `obsreview nota <arquivo.md>` -> alias of `annotate`
- `obsidian-note-reviewer ...` -> legacy alias of `obsreview ...`

Slash commands included:
- `/obsreview-plan`
- `/obsreview-plano`
- `/obsreview-annotate`
- `/obsreview-nota`

## Hook auth mode

Hook auth behavior:
- remote review (`OBSREVIEW_REVIEW_TARGET=remote`): login required to review/approve
- local hook flow: auth is opt-in (`VITE_HOOK_REQUIRE_AUTH=true`)

## Legacy format (when/then)

If old configs still use `when/then`, map:
- `when: ExitPlanMode` -> `hooks.PermissionRequest[].matcher: "ExitPlanMode"`
- `when: Write` -> `hooks.PostToolUse[].matcher: "Write"`
- `then.command: obsreview ...` -> `hooks[].hooks[].command: "obsreview ..."`

Prefer modern format for new setups.

## Environment flags

- `OBSREVIEW_REVIEW_TARGET=auto` (default, remote when healthy; local when remote fails)
- `OBSREVIEW_REVIEW_TARGET=remote` (forces production app)
- `OBSREVIEW_REVIEW_TARGET=local` (forces localhost legacy review)
- `OBSREVIEW_REVIEW_APP_URL=https://obsidian-note-reviewer-hook.vercel.app` (default)
- `OBSREVIEW_REMOTE_FALLBACK_LOCAL=true` (default)
- `OBSREVIEW_REMOTE_HEALTH_TIMEOUT_MS=2000` (default)
- `OBSREVIEW_PLAN_REVIEW_MODE=live` (default)
- `OBSREVIEW_PLAN_REVIEW_MODE=exitplan` (rollback)

## Logs

- `.logs/plan-live-hook.log`
- `.logs/plan-live-session.log`
- `.logs/obsidian-hook.log`

## Security

`/api/save` includes path traversal protection (CWE-22).

Optional defense-in-depth:

```bash
# Single vault
export ALLOWED_SAVE_PATHS="/path/to/your/obsidian/vault"

# Multiple vaults
export ALLOWED_SAVE_PATHS="/vault1,/vault2"
```

See [CONFIGURACAO.md](../../CONFIGURACAO.md) for details.
