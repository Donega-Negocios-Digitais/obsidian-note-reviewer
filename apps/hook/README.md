# Plannotator Claude Code Plugin

This directory contains the Claude Code plugin configuration for Plannotator.

## Prerequisites

Install the `plannotator` command so Claude Code can use it:

**macOS / Linux / WSL:**
```bash
curl -fsSL https://plannotator.ai/install.sh | bash
```

**Windows PowerShell:**
```powershell
irm https://plannotator.ai/install.ps1 | iex
```

**Windows CMD:**
```cmd
curl -fsSL https://plannotator.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
```

---

[Plugin Installation](#plugin-installation) · [Manual Installation (Hooks)](#manual-installation-hooks)

---

## Plugin Installation

In Claude Code:

```
/plugin marketplace add backnotprop/plannotator
/plugin install plannotator@plannotator
```

**Important:** Restart Claude Code after installing the plugin for the hooks to take effect.

## Manual Installation (Hooks)

If you prefer not to use the plugin system, add this to your `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PermissionRequest": [
      {
        "matcher": "ExitPlanMode",
        "hooks": [
          {
            "type": "command",
            "command": "plannotator",
            "timeout": 1800
          }
        ]
      }
    ]
  }
}
```

## How It Works

When Claude Code calls `ExitPlanMode`, this hook intercepts and:

1. Opens Plannotator UI in your browser
2. Lets you annotate the plan visually
3. Approve → Claude proceeds with implementation
4. Request changes → Your annotations are sent back to Claude

## Security

The `/api/save` endpoint includes protection against **path traversal attacks** (CWE-22). All file paths are validated before save operations.

### Optional: Restrict Save Locations

For defense-in-depth, set the `ALLOWED_SAVE_PATHS` environment variable to restrict saves to specific directories:

```bash
# Single vault
export ALLOWED_SAVE_PATHS="/path/to/your/obsidian/vault"

# Multiple vaults (comma-separated)
export ALLOWED_SAVE_PATHS="/vault1,/vault2"
```

See [CONFIGURACAO.md](../../CONFIGURACAO.md) for detailed security documentation.