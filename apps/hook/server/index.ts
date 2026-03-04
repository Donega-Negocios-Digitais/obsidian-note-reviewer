/**
 * Obsidian Note Reviewer CLI Entry Point
 *
 * Supports:
 * - `obsreview` / `obsreview plan`      -> ExitPlanMode hook flow (fallback)
 * - `obsreview plan-live`               -> Continuous pre-execution plan review flow
 * - `obsreview plan-stop-guard`         -> Stop hook guard to enforce Write for plan prompts
 * - `obsreview obsidian`                -> PostToolUse/Write Obsidian flow
 * - `obsreview annotate <file.md>`      -> Open markdown in annotation UI
 * - `obsreview nota <file.md>`          -> Alias for annotate
 * - `obsreview doctor [--json]`         -> Local diagnostics
 *
 * Legacy compatibility:
 * - `obsidian-note-reviewer`            -> Alias of `obsreview`
 */

import { $ } from "bun";
import { spawn } from "node:child_process";
import packageJson from "../package.json" with { type: "json" };
import { getHookCSP } from "@obsidian-note-reviewer/security/csp";
import {
  getInteractivePayloadHint,
  getUsageText,
  normalizeCommand,
  shouldRefuseInteractiveHookCommand,
  type Command,
} from "./cli";
import { runDoctorCommand } from "./doctor";
import { validatePath } from "./pathValidation";
import { handleSaveEndpoint } from "./saveEndpoint";

// Embed the built HTML at compile time
import indexHtml from "../dist/index.html" with { type: "text" };

interface AnnotateResult {
  feedback: string;
}

const cspHeader = getHookCSP(false);
const CLI_VERSION =
  typeof packageJson.version === "string" ? packageJson.version : "0.0.0";

function getSecurityHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": cspHeader,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

function extractFeedbackFromBody(body: unknown): string {
  if (!body || typeof body !== "object") return "No feedback provided.";

  const typedBody = body as {
    feedback?: unknown;
    annotations?: {
      summary?: unknown;
    };
    prompt?: unknown;
  };

  if (typeof typedBody.feedback === "string" && typedBody.feedback.trim()) {
    return typedBody.feedback.trim();
  }

  if (
    typedBody.annotations &&
    typeof typedBody.annotations.summary === "string" &&
    typedBody.annotations.summary.trim()
  ) {
    return typedBody.annotations.summary.trim();
  }

  if (typeof typedBody.prompt === "string" && typedBody.prompt.trim()) {
    return typedBody.prompt.trim();
  }

  return "No feedback provided.";
}

async function openBrowser(url: string): Promise<void> {
  try {
    const platform = process.platform;
    if (platform === "win32") {
      const child = spawn("cmd", ["/c", "start", "", url], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
      child.unref();
    } else if (platform === "darwin") {
      await $`open ${url}`.quiet();
    } else {
      await $`xdg-open ${url}`.quiet();
    }
  } catch {
    console.error(`[Annotate] Open browser manually: ${url}`);
  }
}

async function runAnnotateMode(rawPath: string | undefined): Promise<void> {
  if (!rawPath) {
    console.error("Usage: obsreview annotate <file.md>");
    process.exit(1);
  }

  const pathValidation = validatePath(rawPath);
  if (!pathValidation.valid) {
    console.error(`[Annotate] Invalid file path: ${pathValidation.error}`);
    process.exit(1);
  }

  const safePath = pathValidation.normalizedPath || rawPath;
  const fs = await import("fs/promises");

  let markdown = "";
  try {
    markdown = await fs.readFile(safePath, "utf-8");
  } catch (error) {
    console.error(`[Annotate] Failed to read file: ${safePath}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  let resolveResult: (value: AnnotateResult) => void = () => {};
  const decisionPromise = new Promise<AnnotateResult>((resolve) => {
    resolveResult = resolve;
  });

  const server = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);

      if (url.pathname === "/api/plan" || url.pathname === "/api/content") {
        return Response.json(
          {
            plan: markdown,
            content: markdown,
            mode: "annotate",
            filePath: safePath,
            origin: "claude-code",
          },
          { headers: getSecurityHeaders() }
        );
      }

      if (url.pathname === "/api/save" && req.method === "POST") {
        return handleSaveEndpoint(req, getSecurityHeaders());
      }

      if (
        (url.pathname === "/api/feedback" || url.pathname === "/api/deny") &&
        req.method === "POST"
      ) {
        try {
          const body = await req.json();
          resolveResult({ feedback: extractFeedbackFromBody(body) });
        } catch {
          resolveResult({ feedback: "No feedback provided." });
        }

        return Response.json({ ok: true }, { headers: getSecurityHeaders() });
      }

      if (url.pathname === "/api/send-annotations" && req.method === "POST") {
        try {
          const body = await req.json();
          resolveResult({ feedback: extractFeedbackFromBody(body) });
        } catch {
          resolveResult({ feedback: "No feedback provided." });
        }

        return Response.json({ ok: true }, { headers: getSecurityHeaders() });
      }

      return new Response(indexHtml, {
        headers: {
          "Content-Type": "text/html",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          ...getSecurityHeaders(),
        },
      });
    },
  });

  const url = `http://localhost:${server.port}`;
  console.error(`[Annotate] Reviewer running on ${url}`);
  await openBrowser(url);

  const result = await decisionPromise;
  await Bun.sleep(750);
  server.stop();

  console.log(result.feedback);
}

async function runPlanMode(): Promise<void> {
  await import("./planModeHook.js");
}

async function runObsidianMode(): Promise<void> {
  await import("./obsidianHook.js");
}

async function runPlanLiveMode(): Promise<void> {
  const module = await import("./planLiveHook.js");
  if (typeof module.runPlanLiveHook === "function") {
    await module.runPlanLiveHook();
    return;
  }

  console.error("Error: plan-live hook entrypoint not found.");
  process.exit(1);
}

async function runPlanStopGuardMode(): Promise<void> {
  const module = await import("./planStopGuard.js");
  if (typeof module.runPlanStopGuard === "function") {
    await module.runPlanStopGuard();
    return;
  }

  console.error("Error: plan-stop-guard hook entrypoint not found.");
  process.exit(1);
}

function isInteractiveStdin(): boolean {
  return Boolean(process.stdin?.isTTY);
}

function printHelp(): void {
  console.log(getUsageText());
}

function printVersion(): void {
  console.log(CLI_VERSION);
}

async function runHookCommand(command: Command): Promise<void> {
  switch (command) {
    case "plan":
      await runPlanMode();
      return;
    case "plan-live":
      await runPlanLiveMode();
      return;
    case "plan-stop-guard":
      await runPlanStopGuardMode();
      return;
    case "obsidian":
      await runObsidianMode();
      return;
    default:
      return;
  }
}

export async function main(
  args: string[] = process.argv.slice(2),
  stdinIsTTY: boolean = isInteractiveStdin()
): Promise<number> {
  const command = normalizeCommand(args[0]);

  if (command === "help") {
    printHelp();
    return 0;
  }

  if (command === "version") {
    printVersion();
    return 0;
  }

  if (command === "unknown") {
    console.error(`Unknown subcommand: ${args[0]}`);
    console.error(getUsageText());
    return 1;
  }

  if (command === "doctor") {
    return runDoctorCommand(args.slice(1), {
      version: CLI_VERSION,
      usage: getUsageText(),
    });
  }

  if (shouldRefuseInteractiveHookCommand(command, stdinIsTTY)) {
    console.error(getInteractivePayloadHint(command));
    console.error("");
    console.error(getUsageText());
    return 1;
  }

  if (command === "annotate" || command === "nota") {
    await runAnnotateMode(args[1]);
    return 0;
  }

  await runHookCommand(command);
  return 0;
}

if (import.meta.main) {
  const exitCode = await main();
  process.exit(exitCode);
}
