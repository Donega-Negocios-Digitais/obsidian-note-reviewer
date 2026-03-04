export type Command =
  | "plan"
  | "plan-live"
  | "plan-stop-guard"
  | "obsidian"
  | "annotate"
  | "nota"
  | "doctor";

export type MetaCommand = "help" | "version" | "unknown";

const HELP_ALIASES = new Set(["help", "-h", "--help"]);
const VERSION_ALIASES = new Set(["version", "-v", "--version"]);

export function normalizeCommand(raw: string | undefined): Command | MetaCommand {
  if (!raw || raw === "plan") return "plan";
  if (HELP_ALIASES.has(raw)) return "help";
  if (VERSION_ALIASES.has(raw)) return "version";
  if (raw === "plan-live") return "plan-live";
  if (raw === "plan-stop-guard") return "plan-stop-guard";
  if (raw === "obsidian") return "obsidian";
  if (raw === "annotate") return "annotate";
  if (raw === "nota") return "nota";
  if (raw === "doctor") return "doctor";
  return "unknown";
}

export function commandRequiresHookPayload(
  command: Command | MetaCommand
): boolean {
  return (
    command === "plan" ||
    command === "plan-live" ||
    command === "plan-stop-guard" ||
    command === "obsidian"
  );
}

export function shouldRefuseInteractiveHookCommand(
  command: Command | MetaCommand,
  stdinIsTTY: boolean
): boolean {
  return stdinIsTTY && commandRequiresHookPayload(command);
}

export function getUsageText(): string {
  return [
    "Usage:",
    "  obsreview --help",
    "  obsreview --version",
    "  obsreview doctor [--json]",
    "  obsreview [plan|plan-live|plan-stop-guard|obsidian|annotate|nota] [file.md]",
  ].join("\n");
}

export function getInteractivePayloadHint(command: Command): string {
  const commandLabel = command === "plan" ? "obsreview (plan)" : `obsreview ${command}`;
  return [
    `${commandLabel} expects hook payload on stdin.`,
    "Run this command via Claude Code hooks, or pipe JSON input manually.",
    "",
    "Example:",
    "  echo '{\"tool_input\":{\"plan\":\"# Test Plan\"}}' | obsreview",
  ].join("\n");
}
