/**
 * Obsidian Note Reviewer - Plan Live Hook Handler
 *
 * Triggered by PostToolUse/Write and designed for Claude internal plan files.
 * Keeps review in the same browser session across plan rewrites.
 */

import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { closeSync, existsSync, openSync } from "node:fs";
import { appendFile, mkdir, readFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { $ } from "bun";
import { validatePath } from "./pathValidation";

const START_TIMEOUT_MS = 12_000;
const DECISION_TIMEOUT_MS = 25 * 60 * 1000;
const DECISION_POLL_INTERVAL_MS = 1_000;
const DECISION_POLL_REQUEST_TIMEOUT_MS = 5_000;
const DECISION_MAX_CONSECUTIVE_TRANSPORT_ERRORS = 6;
const EXPECTED_SESSION_SERVER_VERSION = 2;
const BROWSER_NUDGE_DELAY_MS = 4_000;

export interface PlanLiveHookEvent {
  tool_name?: string;
  tool_input?: {
    file_path?: string;
    filePath?: string;
    path?: string;
    content?: string;
    plan?: string;
    text?: string;
  };
  [key: string]: unknown;
}

export interface ParsedPlanLiveEvent {
  filePath: string;
  content: string;
}

export interface SessionMetadata {
  sessionId: string;
  port: number;
  url: string;
  pid: number;
  serverVersion?: number;
  mode?: string;
}

export interface WaitDecisionResult {
  ok: boolean;
  timeout?: boolean;
  decision?: "approve" | "request_changes";
  feedback?: string;
}

function pickFirstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }
  return "";
}

function normalizePathForMatch(input: string): string {
  return input.replace(/\\/g, "/").toLowerCase();
}

export function isClaudePlanPath(filePath: string): boolean {
  const normalized = normalizePathForMatch(filePath);
  return (
    normalized.includes("/.claude/plans/") ||
    normalized.startsWith(".claude/plans/") ||
    normalized.startsWith("./.claude/plans/")
  );
}

export function parsePlanLiveEvent(eventJson: string): ParsedPlanLiveEvent | null {
  try {
    const parsed = JSON.parse(eventJson) as PlanLiveHookEvent;
    const input = parsed.tool_input || {};

    const filePath = pickFirstString(input.file_path, input.filePath, input.path);
    if (!filePath || !isClaudePlanPath(filePath)) {
      return null;
    }

    return {
      filePath,
      content: pickFirstString(input.content, input.plan, input.text),
    };
  } catch {
    return null;
  }
}

async function logPlanLiveDebugEvent(reason: string, eventJson: string): Promise<void> {
  try {
    const logPath = resolve(process.cwd(), ".logs", "plan-live-debug.log");
    await mkdir(dirname(logPath), { recursive: true });
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      reason,
      raw: eventJson,
    });
    await appendFile(logPath, `${line}\n`, "utf-8");
  } catch {
    // ignore debug logging errors
  }
}

export function buildApprovedHookOutput(args: {
  filePath: string;
  sessionId: string;
  revisionId: string;
}): string {
  return JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      result: "PLAN_LIVE_APPROVED",
      filePath: args.filePath,
      sessionId: args.sessionId,
      revisionId: args.revisionId,
      additionalContext: `Plan review approved for ${args.filePath}.`,
    },
  });
}

export function buildBlockedHookOutput(args: {
  filePath: string;
  sessionId: string;
  revisionId: string;
  feedback: string;
  timeout?: boolean;
}): string {
  const baseReason = args.timeout
    ? `Plan live review timed out for ${args.filePath}.`
    : `Plan review requested changes for ${args.filePath}.`;

  return JSON.stringify({
    decision: "block",
    reason: baseReason,
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      result: args.timeout ? "PLAN_LIVE_TIMEOUT" : "PLAN_LIVE_CHANGES_REQUESTED",
      filePath: args.filePath,
      sessionId: args.sessionId,
      revisionId: args.revisionId,
      feedback: args.feedback,
      additionalContext:
        `User requested updates in plan live review for ${args.filePath}\n\n` +
        `Feedback:\n${args.feedback}\n\n` +
        "Rewrite rules (mandatory):\n" +
        "1. Rewrite the SAME file as clean final markdown.\n" +
        "2. When changing text, replace in place and remove superseded text.\n" +
        "3. Do not keep old and new text side-by-side.\n" +
        "4. Do not output diff markers or strike-through edits (~~, +/-, <<<<<<, >>>>>>).\n" +
        "5. For COMMENT suggestions, rewrite the referenced passage in place instead of appending text.\n",
    },
  });
}

function getSessionFilePath(): string {
  return resolve(process.cwd(), ".temp", "plan-live-session.json");
}

function getSessionLogPath(): string {
  return resolve(process.cwd(), ".logs", "plan-live-session.log");
}

function getHookLogPath(): string {
  return resolve(process.cwd(), ".logs", "plan-live-hook.log");
}

async function logHookEvent(
  event: string,
  extra: Record<string, unknown>
): Promise<void> {
  const logPath = getHookLogPath();
  await mkdir(dirname(logPath), { recursive: true });
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    event,
    ...extra,
  });
  await appendFile(logPath, `${line}\n`, "utf-8");
}

export async function logPlanLiveHookEvent(
  event: string,
  extra: Record<string, unknown>
): Promise<void> {
  await logHookEvent(event, extra);
}

async function readSessionMetadata(sessionFile: string): Promise<SessionMetadata | null> {
  try {
    const raw = await readFile(sessionFile, "utf-8");
    const parsed = JSON.parse(raw) as SessionMetadata;
    if (!parsed || typeof parsed.port !== "number" || !parsed.url || !parsed.sessionId) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function isSessionHealthy(metadata: SessionMetadata): Promise<boolean> {
  try {
    const response = await fetch(`${metadata.url}/health`, {
      signal: AbortSignal.timeout(1200),
    });
    return response.ok;
  } catch {
    return false;
  }
}

function isCompatibleSessionVersion(metadata: SessionMetadata): boolean {
  return metadata.serverVersion === EXPECTED_SESSION_SERVER_VERSION;
}

async function stopSessionDaemon(metadata: SessionMetadata): Promise<void> {
  if (!metadata.pid || metadata.pid <= 0) {
    return;
  }
  try {
    process.kill(metadata.pid);
  } catch {
    // ignore errors when process no longer exists or cannot be killed
  }
}

function resolveSessionScriptPath(): string {
  const builtPath = fileURLToPath(new URL("./planLiveSession.js", import.meta.url));
  if (existsSync(builtPath)) {
    return builtPath;
  }

  const sourcePath = fileURLToPath(new URL("./planLiveSession.ts", import.meta.url));
  return sourcePath;
}

export function resolveBunExecutablePath(execPath: string = process.execPath): string {
  const execName = basename(execPath || "").toLowerCase();
  if (execName.includes("bun")) {
    return execPath;
  }
  return "bun";
}

async function openBrowser(url: string): Promise<void> {
  try {
    if (process.platform === "win32") {
      const child = spawn("cmd", ["/c", "start", "", url], {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
      child.unref();
      return;
    }
    if (process.platform === "darwin") {
      await $`open ${url}`.quiet();
      return;
    }
    await $`xdg-open ${url}`.quiet();
  } catch {
    // best-effort browser open only
  }
}

function scheduleBrowserNudge(args: {
  metadata: SessionMetadata;
  revisionId: string;
  filePath: string;
}): () => void {
  const timer = setTimeout(async () => {
    try {
      const statusResponse = await fetch(`${args.metadata.url}/api/session/status`, {
        signal: AbortSignal.timeout(2_000),
      });
      if (statusResponse.ok) {
        const status = (await statusResponse.json()) as {
          hasRecentClientActivity?: boolean;
          revisionId?: string | null;
        };

        if (status.hasRecentClientActivity && status.revisionId === args.revisionId) {
          await logHookEvent("browser_nudge_skipped_active_client", {
            filePath: args.filePath,
            sessionId: args.metadata.sessionId,
            revisionId: args.revisionId,
            decision: null,
            latency_ms: 0,
            timeout: false,
          });
          return;
        }
      }
    } catch (error) {
      await logHookEvent("browser_nudge_status_error", {
        filePath: args.filePath,
        sessionId: args.metadata.sessionId,
        revisionId: args.revisionId,
        decision: null,
        latency_ms: 0,
        timeout: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await openBrowser(args.metadata.url);
    await logHookEvent("browser_nudge_opened", {
      filePath: args.filePath,
      sessionId: args.metadata.sessionId,
      revisionId: args.revisionId,
      decision: null,
      latency_ms: 0,
      timeout: false,
      url: args.metadata.url,
    });
  }, BROWSER_NUDGE_DELAY_MS);

  return () => clearTimeout(timer);
}

async function startSessionDaemon(sessionFile: string): Promise<void> {
  const sessionScriptPath = resolveSessionScriptPath();
  const bunExecutable = resolveBunExecutablePath();
  const logFile = getSessionLogPath();
  await mkdir(dirname(logFile), { recursive: true });

  const logFd = openSync(logFile, "a");
  try {
    const child = spawn(
      bunExecutable,
      [sessionScriptPath, "--session-file", sessionFile],
      {
        cwd: process.cwd(),
        detached: true,
        stdio: ["ignore", logFd, logFd],
        windowsHide: true,
      }
    );
    child.unref();
  } finally {
    closeSync(logFd);
  }
}

async function ensureSessionServer(sessionFile: string): Promise<SessionMetadata> {
  const existing = await readSessionMetadata(sessionFile);
  if (existing) {
    const healthy = await isSessionHealthy(existing);
    if (healthy && isCompatibleSessionVersion(existing)) {
      return existing;
    }
    await stopSessionDaemon(existing);
  }

  await startSessionDaemon(sessionFile);
  const deadline = Date.now() + START_TIMEOUT_MS;

  while (Date.now() < deadline) {
    const metadata = await readSessionMetadata(sessionFile);
    if (metadata && (await isSessionHealthy(metadata))) {
      return metadata;
    }
    await Bun.sleep(250);
  }

  throw new Error("Failed to start plan live session server");
}

export async function ensurePlanLiveSessionServer(): Promise<SessionMetadata> {
  const sessionFile = getSessionFilePath();
  await mkdir(dirname(sessionFile), { recursive: true });
  return ensureSessionServer(sessionFile);
}

async function waitDecision(
  metadata: SessionMetadata,
  revisionId: string
): Promise<WaitDecisionResult> {
  const deadline = Date.now() + DECISION_TIMEOUT_MS;
  let consecutiveTransportErrors = 0;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(
        `${metadata.url}/api/session/decision?revisionId=${encodeURIComponent(revisionId)}`,
        {
          signal: AbortSignal.timeout(DECISION_POLL_REQUEST_TIMEOUT_MS),
          cache: "no-store",
        }
      );

      if (response.status === 204) {
        consecutiveTransportErrors = 0;
        await Bun.sleep(DECISION_POLL_INTERVAL_MS);
        continue;
      }

      if (!response.ok) {
        throw new Error(`decision poll failed with status ${response.status}`);
      }

      const payload = (await response.json()) as WaitDecisionResult;
      if (payload.ok && (payload.decision === "approve" || payload.decision === "request_changes")) {
        return payload;
      }
      consecutiveTransportErrors = 0;
    } catch (error) {
      consecutiveTransportErrors += 1;
      if (consecutiveTransportErrors >= DECISION_MAX_CONSECUTIVE_TRANSPORT_ERRORS) {
        throw new Error(
          `Session connection lost while waiting for decision (attempts=${consecutiveTransportErrors}): ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
      if (Date.now() + DECISION_POLL_INTERVAL_MS >= deadline) {
        throw error;
      }
      await Bun.sleep(DECISION_POLL_INTERVAL_MS);
      continue;
    }
  }

  return { ok: false, timeout: true };
}

export async function publishPlanLiveRevision(
  metadata: SessionMetadata,
  revision: {
    revisionId: string;
    content: string;
    filePath: string;
  }
): Promise<Response> {
  return fetch(`${metadata.url}/api/session/revision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(revision),
    signal: AbortSignal.timeout(10_000),
  });
}

export async function waitForPlanLiveDecision(
  metadata: SessionMetadata,
  revisionId: string
): Promise<WaitDecisionResult> {
  return waitDecision(metadata, revisionId);
}

export async function runPlanLiveHook(): Promise<void> {
  const reviewMode = (process.env.OBSREVIEW_PLAN_REVIEW_MODE || "live").toLowerCase();
  if (reviewMode === "exitplan") {
    process.exit(0);
  }

  const eventJson = await Bun.stdin.text();
  const parsedEvent = parsePlanLiveEvent(eventJson);
  if (!parsedEvent) {
    await logPlanLiveDebugEvent("parse_or_match_failed", eventJson);
    process.exit(0);
  }
  await logHookEvent("plan_candidate_detected", {
    filePath: parsedEvent.filePath,
    sessionId: null,
    revisionId: null,
    decision: null,
    latency_ms: 0,
    timeout: false,
  });

  const pathValidation = validatePath(parsedEvent.filePath);
  if (!pathValidation.valid) {
    console.error(`[PlanLiveHook] Invalid plan file path: ${pathValidation.error}`);
    process.exit(0);
  }

  const safePath = pathValidation.normalizedPath || parsedEvent.filePath;
  let content = parsedEvent.content;

  if (!content.trim()) {
    try {
      content = await readFile(safePath, "utf-8");
    } catch (error) {
      console.error(`[PlanLiveHook] Failed to read plan file: ${safePath}`);
      console.error(error instanceof Error ? error.message : String(error));
      process.exit(0);
    }
  }

  if (!content.trim()) {
    console.error("[PlanLiveHook] Empty plan content, skipping.");
    process.exit(0);
  }

  const revisionId = randomUUID();
  const sessionFile = getSessionFilePath();
  await mkdir(dirname(sessionFile), { recursive: true });

  let metadata: SessionMetadata;
  try {
    metadata = await ensureSessionServer(sessionFile);
  } catch (error) {
    console.error(
      `[PlanLiveHook] Could not initialize session server: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    console.log(
      buildBlockedHookOutput({
        filePath: safePath,
        sessionId: "unavailable",
        revisionId,
        feedback: "Plan live review session failed to start. Please retry.",
      })
    );
    process.exit(0);
    return;
  }
  await logHookEvent("session_ready", {
    filePath: safePath,
    sessionId: metadata.sessionId,
    revisionId,
    decision: null,
    latency_ms: 0,
    timeout: false,
  });

  let publishResponse: Response;
  try {
    publishResponse = await fetch(`${metadata.url}/api/session/revision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        revisionId,
        content,
        filePath: safePath,
      }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch (error) {
    await logHookEvent("publish_request_error", {
      filePath: safePath,
      sessionId: metadata.sessionId,
      revisionId,
      decision: null,
      latency_ms: 0,
      timeout: false,
      error: error instanceof Error ? error.message : String(error),
    });
    console.log(
      buildBlockedHookOutput({
        filePath: safePath,
        sessionId: metadata.sessionId,
        revisionId,
        feedback: "Plan live review publish failed. Please retry.",
      })
    );
    process.exit(0);
    return;
  }

  if (!publishResponse.ok) {
    console.error(
      `[PlanLiveHook] Failed to publish revision: status=${publishResponse.status}`
    );
    await logHookEvent("publish_failed", {
      filePath: safePath,
      sessionId: metadata.sessionId,
      revisionId,
      decision: null,
      latency_ms: 0,
      timeout: false,
      status: publishResponse.status,
    });
    console.log(
      buildBlockedHookOutput({
        filePath: safePath,
        sessionId: metadata.sessionId,
        revisionId,
        feedback: "Plan live review publish failed. Please retry.",
      })
    );
    process.exit(0);
    return;
  }
  await logHookEvent("revision_published", {
    filePath: safePath,
    sessionId: metadata.sessionId,
    revisionId,
    decision: null,
    latency_ms: 0,
    timeout: false,
  });
  console.error(
    `[PlanLiveHook] Review session ready at ${metadata.url} (revision: ${revisionId})`
  );

  let decisionResult: WaitDecisionResult;
  const cancelInitialBrowserNudge = scheduleBrowserNudge({
    metadata,
    revisionId,
    filePath: safePath,
  });
  const waitStart = Date.now();
  try {
    decisionResult = await waitDecision(metadata, revisionId);
  } catch (error) {
    const waitError = error instanceof Error ? error.message : String(error);
    await logHookEvent("wait_connection_error", {
      filePath: safePath,
      sessionId: metadata.sessionId,
      revisionId,
      decision: null,
      latency_ms: Date.now() - waitStart,
      timeout: false,
      error: waitError,
    });

    // Recovery path: restart/reuse healthy session server and republish same revision.
    try {
      const recovered = await ensureSessionServer(sessionFile);
      metadata = recovered;
      await logHookEvent("session_recovered", {
        filePath: safePath,
        sessionId: metadata.sessionId,
        revisionId,
        decision: null,
        latency_ms: Date.now() - waitStart,
        timeout: false,
      });

      const republish = await publishPlanLiveRevision(metadata, {
        revisionId,
        content,
        filePath: safePath,
      });
      if (!republish.ok) {
        throw new Error(`Republish failed with status ${republish.status}`);
      }

      await logHookEvent("revision_republished", {
        filePath: safePath,
        sessionId: metadata.sessionId,
        revisionId,
        decision: null,
        latency_ms: Date.now() - waitStart,
        timeout: false,
      });

      const cancelRecoveryBrowserNudge = scheduleBrowserNudge({
        metadata,
        revisionId,
        filePath: safePath,
      });
      try {
        decisionResult = await waitDecision(metadata, revisionId);
      } finally {
        cancelRecoveryBrowserNudge();
      }
    } catch (recoverError) {
      console.error(
        `[PlanLiveHook] Failed while waiting for decision: ${waitError}`
      );
      console.error(
        `[PlanLiveHook] Recovery failed: ${
          recoverError instanceof Error ? recoverError.message : String(recoverError)
        }`
      );
      console.log(
        buildBlockedHookOutput({
          filePath: safePath,
          sessionId: metadata.sessionId,
          revisionId,
          feedback:
            "Plan live review connection failed while waiting for decision. Please run the request again.",
        })
      );
      process.exit(0);
      return;
    }
  } finally {
    cancelInitialBrowserNudge();
  }

  if (decisionResult.ok && decisionResult.decision === "approve") {
    await logHookEvent("decision_approved", {
      filePath: safePath,
      sessionId: metadata.sessionId,
      revisionId,
      decision: "approve",
      latency_ms: Date.now() - waitStart,
      timeout: false,
    });
    console.log(
      buildApprovedHookOutput({
        filePath: safePath,
        sessionId: metadata.sessionId,
        revisionId,
      })
    );
    process.exit(0);
  }

  const feedback =
    typeof decisionResult.feedback === "string" && decisionResult.feedback.trim()
      ? decisionResult.feedback.trim()
      : decisionResult.timeout
      ? "Plan review session timed out without approval."
      : "Changes requested in plan review.";

  await logHookEvent("decision_blocked", {
    filePath: safePath,
    sessionId: metadata.sessionId,
    revisionId,
    decision: decisionResult.timeout ? "timeout" : "request_changes",
    latency_ms: Date.now() - waitStart,
    timeout: Boolean(decisionResult.timeout),
  });

  console.log(
    buildBlockedHookOutput({
      filePath: safePath,
      sessionId: metadata.sessionId,
      revisionId,
      feedback,
      timeout: Boolean(decisionResult.timeout),
    })
  );

  process.exit(0);
}

if (import.meta.main) {
  await runPlanLiveHook();
}
