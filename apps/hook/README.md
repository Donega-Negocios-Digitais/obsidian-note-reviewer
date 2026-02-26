# Obsidian Note Reviewer Claude Code Plugin

This directory contains the Claude Code plugin configuration for Obsidian Note Reviewer.

## Prerequisites

Install the `obsreview` command so Claude Code can execute local hooks:

**macOS / Linux / WSL:**
```bash
curl -fsSL https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.sh | bash
```

**Windows PowerShell:**
```powershell
irm https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.ps1 | iex
```

**Windows CMD:**
```cmd
curl -fsSL https://raw.githubusercontent.com/Donega-Negocios-Digitais/obsidian-note-reviewer/main/scripts/install.cmd -o install.cmd && install.cmd && del install.cmd
```

---

[Plugin Installation](#plugin-installation) · [Manual Installation (Hooks)](#manual-installation-hooks) · [Commands](#commands)

---

## Plugin Installation

In Claude Code:

```text
/plugin marketplace add Donega-Negocios-Digitais/obsidian-note-reviewer
/plugin install obsreview@obsidian-note-reviewer
```

Restart Claude Code after install so hooks and slash commands are loaded.

## Manual Installation (Hooks)

The official format is the modern `hooks.matcher/hooks` contract.
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
      }
    ]
  }
}
```

## How It Works

Primary flow (`plan-live`):
1. Claude writes a plan in `/.claude/plans/...`
2. `PostToolUse/Write` triggers `obsreview plan-live`
3. Review UI opens before `Ready to code`
4. Request changes keeps the same tab/session alive
5. Approve lets Claude continue to `Ready to code`

Fallback flow (`plan`):
1. `PermissionRequest/ExitPlanMode` triggers `obsreview plan`
2. Used only when `OBSREVIEW_PLAN_REVIEW_MODE=exitplan`

Obsidian flow:
1. `PostToolUse/Write` triggers `obsreview obsidian`
2. It handles vault plan files (`Plans/`, `.obsidian/plans/`, `plan/`)
3. It ignores `/.claude/plans/` to avoid conflicts with `plan-live`

## Commands

- `obsreview` -> defaults to `obsreview plan`
- `obsreview plan-live` -> continuous pre-execution plan review
- `obsreview plan` -> ExitPlanMode fallback review
- `obsreview obsidian` -> PostToolUse/Write Obsidian review
- `obsreview annotate <arquivo.md>` -> annotate markdown manually
- `obsreview nota <arquivo.md>` -> alias of `annotate`
- `obsidian-note-reviewer ...` -> legacy CLI alias of `obsreview ...`

Slash commands included in this plugin:
- `/obsreview-plan`
- `/obsreview-plano`
- `/obsreview-annotate`
- `/obsreview-nota`

Recommended for reliable plan review opening:
- Use `/obsreview-plan` (or `/obsreview-plano`) when requesting plans.
- These commands force `Write` into `/.claude/plans/...` before chat response, guaranteeing `plan-live` trigger.

## Legacy Format (when/then)

If you still use older docs/configs with `when/then`, map them like this:

- `when: ExitPlanMode` -> `hooks.PermissionRequest[].matcher: "ExitPlanMode"`
- `when: Write` -> `hooks.PostToolUse[].matcher: "Write"`
- `then.command: obsreview ...` -> `hooks[].hooks[].command: "obsreview ..."`

Prefer the modern format for all new setups.

## Environment Flags

- `OBSREVIEW_PLAN_REVIEW_MODE=live` (default): uses `plan-live`
- `OBSREVIEW_PLAN_REVIEW_MODE=exitplan`: disables `plan-live` and keeps only ExitPlanMode fallback

## Logs

- `.logs/plan-live-hook.log`
- `.logs/plan-live-session.log`
- `.logs/obsidian-hook.log`

## Security

The `/api/save` endpoint includes protection against path traversal attacks (CWE-22). All file paths are validated before save operations.

Optional defense-in-depth:

```bash
# Single vault
export ALLOWED_SAVE_PATHS="/path/to/your/obsidian/vault"

# Multiple vaults
export ALLOWED_SAVE_PATHS="/vault1,/vault2"
```

See [CONFIGURACAO.md](../../CONFIGURACAO.md) for security details.
