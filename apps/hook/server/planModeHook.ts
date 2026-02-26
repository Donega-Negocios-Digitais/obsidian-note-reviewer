/**
 * Obsidian Note Reviewer - Plan Mode Hook Handler
 *
 * Triggered by PermissionRequest hook on ExitPlanMode event.
 * When user activates plan mode in Claude Code, this hook:
 * 1. Reads the plan content from the hook event
 * 2. Spawns an ephemeral server with the reviewer UI
 * 3. Opens browser automatically for user review
 * 4. Waits for user decision (approve/deny/feedback)
 * 5. Outputs structured JSON to stdout for Claude Code context
 *
 * API Endpoints:
 * - GET  /api/plan    - Returns plan content and context (primary)
 * - GET  /api/content - Legacy alias for compatibility
 * - POST /api/approve - User approved the plan
 * - POST /api/deny - User requested changes with feedback
 * - POST /api/send-annotations - Send annotations to Claude Code (CLAU-06)
 */

import { $ } from "bun";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { getHookCSP } from "@obsidian-note-reviewer/security/csp";
import {
  ensurePlanLiveSessionServer,
  logPlanLiveHookEvent,
  publishPlanLiveRevision,
  waitForPlanLiveDecision,
} from "./planLiveHook";
import { validatePath } from "./pathValidation";
import { handleSaveEndpoint } from "./saveEndpoint";

// Embed the built HTML at compile time
import indexHtml from "../dist/index.html" with { type: "text" };

// CSP header for all responses
const cspHeader = getHookCSP(false);

function getSecurityHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": cspHeader,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

// Timeout configuration (25 minutes to stay within 30-minute hook timeout)
const INACTIVITY_TIMEOUT_MS = 25 * 60 * 1000; // 25 minutes
const WARNING_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes (warning before timeout)

const planReviewMode = (
  process.env.OBSREVIEW_PLAN_REVIEW_MODE || "live"
).toLowerCase();

/**
 * Check if the PostToolUse Write hook (obsidianHook) is already active.
 *
 * This implements a simple heuristic: if another obsidian-note-reviewer server
 * is running, the Write hook likely already opened a viewer.
 *
 * Priority system: Write hook (PostToolUse) takes precedence over ExitPlanMode hook.
 * When creating a plan file in Obsidian, both hooks may fire. We want only ONE viewer.
 *
 * @returns true if Write hook is detected as active, false otherwise
 */
export async function checkWriteHookStatus(): Promise<boolean> {
  if (process.platform === "win32") {
    // `ps` isn't reliably available on Windows shells; skip this best-effort heuristic.
    return false;
  }

  try {
    // Check for running Bun serve processes from our hook
    // This is a simple heuristic - we look for bun processes with our server patterns
    const result = Bun.spawn(["ps", "aux"], {
      stdout: "pipe",
      stderr: "pipe",
    });

    const output = await new Response(result.stdout).text();
    await result.exited;

    // Look for bun processes that might be our hook servers
    // We check for obsidianHook or planModeHook patterns in process args
    const hasOtherHookServer = output.includes("obsidianHook") ||
                                output.includes("planModeHook") ||
                                output.includes("obsreview");

    if (hasOtherHookServer) {
      console.error("[PlanModeHook] Priority check: Write hook appears active, skipping viewer launch");
      return true;
    }

    console.error("[PlanModeHook] Priority check: No Write hook detected, proceeding with viewer");
    return false;
  } catch (error) {
    // If ps check fails, log but continue (don't block on heuristic failure)
    console.error(`[PlanModeHook] Priority check failed: ${error}`);
    return false;
  }
}

/**
 * Handle inactivity timeout with warning system.
 * Uses setTimeout pattern (not setInterval) for cleaner timeout management.
 *
 * @param resolveCallback - Function to call when timeout occurs
 * @param lastActivityTime - Reference to last activity timestamp
 */
export function handleInactivityTimeout(
  resolveCallback: (result: { approved: boolean; feedback?: string }) => void,
  lastActivityTimeRef: { value: number }
): { clear: () => void; reset: () => void } {
  let warningTimer: NodeJS.Timeout | null = null;
  let timeoutTimer: NodeJS.Timeout | null = null;
  let timeoutWarningShown = false;

  function clearAllTimers(): void {
    if (warningTimer) {
      clearTimeout(warningTimer);
      warningTimer = null;
    }
    if (timeoutTimer) {
      clearTimeout(timeoutTimer);
      timeoutTimer = null;
    }
  }

  function reset(): void {
    lastActivityTimeRef.value = Date.now();
    clearAllTimers();

    // Set warning timer (20 minutes)
    warningTimer = setTimeout(() => {
      const elapsed = Date.now() - lastActivityTimeRef.value;
      if (elapsed >= WARNING_TIMEOUT_MS && !timeoutWarningShown) {
        const remainingMinutes = Math.round((INACTIVITY_TIMEOUT_MS - elapsed) / 60000);
        console.error(`[PlanModeHook] ⚠️ Warning: Review will timeout in ${remainingMinutes} minutes of inactivity`);
        timeoutWarningShown = true;
      }
    }, WARNING_TIMEOUT_MS);

    // Set hard timeout timer (25 minutes)
    timeoutTimer = setTimeout(() => {
      const elapsed = Date.now() - lastActivityTimeRef.value;
      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        console.error("[PlanModeHook] Inactivity timeout reached, closing reviewer");
        resolveCallback({ approved: false, feedback: "Session timed out due to inactivity" });
      }
    }, INACTIVITY_TIMEOUT_MS);
  }

  // Initialize timer on startup
  reset();

  return {
    clear: clearAllTimers,
    reset
  };
}

interface PlanModeEvent {
  tool_input?: {
    file_path?: string;
    filePath?: string;
    content?: string;
    plan?: string;
    text?: string;
    plan_name?: string;
    planName?: string;
  };
  file_path?: string;
  filePath?: string;
  content?: string;
  plan?: string;
  plan_name?: string;
  planName?: string;
  [key: string]: unknown;
}

interface PlanContent {
  content: string;
  filePath?: string;
  planName?: string;
}

function buildPlaceholderPlanContent(rawEventJson?: string): string {
  const lines = [
    "# Plano (fallback automático)",
    "",
    "Não consegui extrair o plano completo do payload do hook `ExitPlanMode`.",
    "A revisão foi aberta para não quebrar o fluxo.",
    "",
    "## Próximo passo recomendado",
    "1. Solicitar ao agente que persista o plano em `/.claude/plans/<nome>.md` usando `Write`.",
    "2. Reabrir a revisão e validar a versão final.",
  ];

  if (rawEventJson && rawEventJson.trim()) {
    const compact = rawEventJson.trim().slice(0, 1200);
    lines.push("", "## Payload bruto (recorte)", "```json", compact, "```");
  }

  return lines.join("\n");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function pickFirstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function collectDeepStrings(
  value: unknown,
  keyHints: string[],
  acc: string[],
  depth = 0
): void {
  if (depth > 6 || value == null) return;

  if (typeof value === "string") {
    acc.push(value);
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectDeepStrings(item, keyHints, acc, depth + 1);
    }
    return;
  }

  if (!isRecord(value)) return;
  for (const [key, nested] of Object.entries(value)) {
    if (typeof nested === "string" && keyHints.includes(key.toLowerCase())) {
      acc.push(nested);
    } else {
      collectDeepStrings(nested, keyHints, acc, depth + 1);
    }
  }
}

function extractPlanLikeText(event: unknown): string {
  const candidates: string[] = [];
  collectDeepStrings(
    event,
    [
      "plan",
      "content",
      "text",
      "output",
      "message",
      "response",
      "assistant",
      "markdown",
    ],
    candidates
  );

  for (const text of candidates) {
    const trimmed = text.trim();
    if (!trimmed) continue;
    if (trimmed.includes("\n") || trimmed.includes("##") || trimmed.includes("1.")) {
      return trimmed;
    }
  }

  return "";
}

async function logPlanModeDebugEvent(eventJson: string, reason: string): Promise<void> {
  try {
    const logPath = resolve(process.cwd(), ".logs", "plan-hook-debug.log");
    await mkdir(dirname(logPath), { recursive: true });
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      reason,
      event: eventJson,
    });
    await appendFile(logPath, `${line}\n`, "utf-8");
  } catch {
    // ignore debug logging errors
  }
}

function buildFallbackPlanPath(planName?: string, existingFilePath?: string): string {
  if (existingFilePath && existingFilePath.trim()) {
    return existingFilePath.trim();
  }

  const safeBaseName =
    (planName || "exitplan")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "exitplan";

  return `.claude/plans/${safeBaseName}.md`;
}

async function runLiveExitPlanReview(plan: PlanContent): Promise<void> {
  const rawPath = buildFallbackPlanPath(plan.planName, plan.filePath);
  const pathValidation = validatePath(rawPath);
  const safePath = pathValidation.valid ? pathValidation.normalizedPath || rawPath : rawPath;
  const revisionId = randomUUID();

  await logPlanLiveHookEvent("exitplan_fallback_detected", {
    filePath: safePath,
    sessionId: null,
    revisionId,
    decision: null,
    latency_ms: 0,
    timeout: false,
  });

  let metadata: Awaited<ReturnType<typeof ensurePlanLiveSessionServer>>;
  try {
    metadata = await ensurePlanLiveSessionServer();
  } catch (error) {
    console.error(
      `[PlanModeHook] Failed to initialize plan-live session: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(0);
    return;
  }

  let publishResponse: Response;
  try {
    publishResponse = await publishPlanLiveRevision(metadata, {
      revisionId,
      content: plan.content,
      filePath: safePath,
    });
  } catch (error) {
    console.error(
      `[PlanModeHook] Failed to publish fallback revision: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(0);
    return;
  }

  if (!publishResponse.ok) {
    console.error(
      `[PlanModeHook] Failed to publish fallback revision: status=${publishResponse.status}`
    );
    process.exit(0);
    return;
  }

  const waitStart = Date.now();
  let decisionResult: Awaited<ReturnType<typeof waitForPlanLiveDecision>>;
  try {
    decisionResult = await waitForPlanLiveDecision(metadata, revisionId);
  } catch (error) {
    const fallbackFeedback =
      "Plan review UI connection failed while waiting for decision. Please retry.";
    await logPlanLiveHookEvent("exitplan_fallback_wait_error", {
      filePath: safePath,
      sessionId: metadata.sessionId,
      revisionId,
      decision: "request_changes",
      latency_ms: Date.now() - waitStart,
      timeout: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PermissionRequest",
          result: "PLAN_REVIEW_CHANGES_REQUESTED",
          feedback: fallbackFeedback,
        },
      })
    );
    process.exit(0);
    return;
  }

  if (decisionResult.ok && decisionResult.decision === "approve") {
    await logPlanLiveHookEvent("exitplan_fallback_approved", {
      filePath: safePath,
      sessionId: metadata.sessionId,
      revisionId,
      decision: "approve",
      latency_ms: Date.now() - waitStart,
      timeout: false,
    });
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PermissionRequest",
          result: "PLAN_REVIEW_APPROVED",
        },
      })
    );
    process.exit(0);
    return;
  }

  const feedback =
    typeof decisionResult.feedback === "string" && decisionResult.feedback.trim()
      ? decisionResult.feedback.trim()
      : decisionResult.timeout
      ? "Plan review session timed out without approval."
      : "Changes requested in plan review.";

  await logPlanLiveHookEvent("exitplan_fallback_blocked", {
    filePath: safePath,
    sessionId: metadata.sessionId,
    revisionId,
    decision: decisionResult.timeout ? "timeout" : "request_changes",
    latency_ms: Date.now() - waitStart,
    timeout: Boolean(decisionResult.timeout),
  });
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PermissionRequest",
        result: "PLAN_REVIEW_CHANGES_REQUESTED",
        feedback,
      },
    })
  );
  process.exit(0);
}

// Read PermissionRequest ExitPlanMode hook event from stdin
const eventJson = await Bun.stdin.text();

let planContent: PlanContent = {
  content: "",
  filePath: "",
  planName: ""
};

try {
  const event = JSON.parse(eventJson) as PlanModeEvent;
  const toolInput = event.tool_input ?? {};

  // PermissionRequest ExitPlanMode payload varies by CLI/version.
  planContent.content = pickFirstString(
    toolInput.content,
    toolInput.plan,
    toolInput.text,
    event.content,
    event.plan
  );
  planContent.filePath = pickFirstString(
    toolInput.file_path,
    toolInput.filePath,
    event.file_path,
    event.filePath
  );
  planContent.planName = pickFirstString(
    toolInput.plan_name,
    toolInput.planName,
    event.plan_name,
    event.planName
  );

  if (!planContent.content) {
    planContent.content = extractPlanLikeText(event);
  }

  // If no content in event, try reading from file path
  if (!planContent.content && planContent.filePath) {
    const pathValidation = validatePath(planContent.filePath);
    if (pathValidation.valid && pathValidation.normalizedPath) {
      try {
        const fs = await import("fs/promises");
        planContent.content = await fs.readFile(pathValidation.normalizedPath, "utf-8");
      } catch (error) {
        console.error(`[PlanModeHook] Failed to read plan file: ${error}`);
        // Continue with empty content - user can still provide feedback
      }
    }
  }
} catch (error) {
  console.error(`[PlanModeHook] Failed to parse event JSON: ${error}`);
  await logPlanModeDebugEvent(eventJson, "parse_error");
  // Exit silently if invalid JSON
  process.exit(0);
}

// Never exit silently on ExitPlanMode.
// If content is missing, use a placeholder so the review UI still opens.
if (!planContent.content && !planContent.filePath) {
  console.error("[PlanModeHook] Missing plan content/filePath, using fallback placeholder");
  await logPlanModeDebugEvent(eventJson, "missing_content_and_file_fallback_used");
  planContent.content = buildPlaceholderPlanContent(eventJson);
  planContent.filePath = ".claude/plans/exitplan-fallback.md";
  planContent.planName = "exitplan-fallback";
}

if (planReviewMode !== "exitplan") {
  await runLiveExitPlanReview(planContent);
}

// PRIORITY CHECK: If Write hook is already active, skip this hook
// This prevents double-opening when both PostToolUse Write and ExitPlanMode hooks fire
if (await checkWriteHookStatus()) {
  console.error("[PlanModeHook] Write hook already handled this event, exiting");
  process.exit(0);
}

// Promise that resolves when user makes a decision
let resolveDecision: (result: { approved: boolean; feedback?: string }) => void;
const decisionPromise = new Promise<{ approved: boolean; feedback?: string }>(
  (resolve) => { resolveDecision = resolve; }
);

// Inactivity timeout tracking (uses exported handler for testability)
const lastActivityRef = { value: Date.now() };
const timeoutHandler = handleInactivityTimeout(
  (result) => resolveDecision(result),
  lastActivityRef
);

// Reset activity timer on any API call
function resetActivity(): void {
  lastActivityRef.value = Date.now();
  timeoutHandler.reset();
}

const server = Bun.serve({
  port: 0, // Random available port

  async fetch(req) {
    const url = new URL(req.url);

    // Reset activity on any request
    resetActivity();

    // Keep stdout reserved for final hookSpecificOutput JSON only.
    console.error(`[PlanModeHook] ${req.method} ${url.pathname}`);

    // API: Get plan content
    if (url.pathname === "/api/plan" || url.pathname === "/api/content") {
      return Response.json(
        {
          plan: planContent.content,
          content: planContent.content,
          filePath: planContent.filePath,
          planName: planContent.planName,
          mode: "plan-review",
          origin: "claude-code"
        },
        { headers: getSecurityHeaders() }
      );
    }

    if (url.pathname === "/api/save" && req.method === "POST") {
      return handleSaveEndpoint(req, getSecurityHeaders());
    }

    // API: Approve plan
    if (url.pathname === "/api/approve" && req.method === "POST") {
      resolveDecision({ approved: true });
      return Response.json({ ok: true }, { headers: getSecurityHeaders() });
    }

    // API: Deny with feedback
    if (url.pathname === "/api/deny" && req.method === "POST") {
      try {
        const body = await req.json() as { feedback?: string };
        resolveDecision({
          approved: false,
          feedback: body.feedback || "Changes requested"
        });
      } catch {
        resolveDecision({ approved: false, feedback: "Changes requested" });
      }
      return Response.json({ ok: true }, { headers: getSecurityHeaders() });
    }

    // API: Send annotations to Claude Code (CLAU-06)
    if (url.pathname === "/api/send-annotations" && req.method === "POST") {
      try {
        const body = await req.json() as {
          prompt?: string;
          annotations: {
            summary: string;
            annotations: unknown[];
            totalCount: number;
            metadata: {
              exportDate: string;
              types: Record<string, number>;
              coverage?: string[];
            };
          };
        };

        // Validate structure
        if (!body.annotations || !Array.isArray(body.annotations.annotations)) {
          console.error("[PlanModeHook] Invalid annotations format");
          return Response.json(
            { ok: false, error: "Formato de anotações inválido" },
            { status: 400, headers: getSecurityHeaders() }
          );
        }

        const { annotations: exportData } = body;

        // Log for debugging
        console.error(`[PlanModeHook] Received ${exportData.totalCount} annotations`);
        console.error("[PlanModeHook] Types breakdown:", exportData.metadata.types);
        if (exportData.metadata.coverage) {
          console.error("[PlanModeHook] Coverage:", exportData.metadata.coverage);
        }

        // Output to stdout as hookSpecificOutput for Claude Code
        console.log(JSON.stringify({
          hookSpecificOutput: {
            hookEventName: "PermissionRequest",
            result: "ANNOTATIONS_EXPORTED",
            summary: exportData.summary,
            totalCount: exportData.totalCount,
            types: exportData.metadata.types,
            coverage: exportData.metadata.coverage || [],
            annotations: exportData.annotations,
            prompt: body.prompt || "",
          }
        }));

        // Schedule server shutdown after sending
        setTimeout(() => {
          console.error("[PlanModeHook] Shutting down after sending annotations");
          server.stop();
        }, 500);

        return Response.json(
          { ok: true, message: "Anotações enviadas com sucesso" },
          { headers: getSecurityHeaders() }
        );
      } catch (error) {
        console.error("[PlanModeHook] Error processing annotations:", error);
        return Response.json(
          { ok: false, error: error instanceof Error ? error.message : "Erro ao processar anotações" },
          { status: 500, headers: getSecurityHeaders() }
        );
      }
    }

    // Serve embedded HTML for all other routes (SPA)
    return new Response(indexHtml, {
      headers: {
        "Content-Type": "text/html",
        "Cache-Control": "no-store, no-cache, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
        ...getSecurityHeaders(),
      }
    });
  },
});

// Open browser automatically
const url = `http://localhost:${server.port}`;
console.error(`[PlanModeHook] Plan reviewer running on ${url}`);

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
  console.error(`[PlanModeHook] Failed to open browser automatically`);
  console.error(`[PlanModeHook] Please open manually: ${url}`);
}

// Wait for user decision (blocks until approve/deny or timeout)
const result = await decisionPromise;

// Clear inactivity timer
timeoutHandler.clear();

// Give browser time to receive response
await Bun.sleep(1500);

// Cleanup
server.stop();

// Output structured JSON for PermissionRequest ExitPlanMode hook
// This output becomes additional context for Claude after plan mode activation
if (result.approved) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PermissionRequest",
      result: "PLAN_REVIEW_APPROVED"
    }
  }));
} else {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PermissionRequest",
      result: "PLAN_REVIEW_CHANGES_REQUESTED",
      feedback: result.feedback
    }
  }));
}

process.exit(0);

/**
 * Export the handler function for testing purposes
 */
export function handlePlanModeHook(eventJson: string): Promise<{ approved: boolean; feedback?: string }> {
  // This function allows the handler to be tested without running as a script
  // In production, the script reads from stdin directly
  return Promise.resolve({ approved: true });
}
