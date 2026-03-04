import { $ } from "bun";
import { spawn } from "node:child_process";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type PlanLiveReviewTarget = "auto" | "remote" | "local";
export type ResolvedPlanLiveReviewTarget = "remote" | "local";
export type PlanLiveTargetReason =
  | "forced_remote"
  | "forced_local"
  | "remote_healthy"
  | "remote_unhealthy"
  | "remote_timeout";

export interface ResolvedPlanLiveTarget {
  target: ResolvedPlanLiveReviewTarget;
  configuredTarget: PlanLiveReviewTarget;
  reason: PlanLiveTargetReason;
  remoteStatus: number | null;
  remoteError: string | null;
}

export interface RemoteWaitDecisionResult {
  ok: boolean;
  timeout?: boolean;
  decision?: "approve" | "request_changes";
  feedback?: string;
}

interface RemoteSessionFileState {
  sessionId: string;
  reviewKey: string;
  workspaceHash: string;
  updatedAt: string;
  lastOpenedAt?: string;
  lastOpenedRevisionId?: string;
  lastOpenedReviewUrl?: string;
}

interface RemoteRevisionPublishResponse {
  ok?: boolean;
  reviewUrl?: string;
}

interface RemoteSessionCredentials {
  sessionId: string;
  reviewKey: string;
  workspaceHash: string;
  lastOpenedAt?: string;
  lastOpenedRevisionId?: string;
  lastOpenedReviewUrl?: string;
}

function quoteForWindowsStart(url: string): string {
  // Prevent cmd.exe from splitting query params on '&' when invoking `start`.
  return `"${url.replace(/"/g, "")}"`;
}

export function buildWindowsStartArgs(url: string): string[] {
  return ["/c", "start", "", quoteForWindowsStart(url)];
}

function getConfiguredBrowserExecutable(): string | null {
  const configured = process.env.OBSREVIEW_BROWSER_EXE?.trim();
  return configured ? configured : null;
}

function parseExecutableFromCommand(command: string): string | null {
  const trimmed = command.trim();
  if (!trimmed) return null;
  const quoted = trimmed.match(/^"([^"]+?\.exe)"/i);
  if (quoted?.[1]) {
    return quoted[1];
  }
  const unquoted = trimmed.match(/^([^\s]+?\.exe)\b/i);
  if (unquoted?.[1]) {
    return unquoted[1];
  }
  return null;
}

function resolveWindowsDefaultBrowserExecutable(): string | null {
  try {
    const userChoice = spawnSync(
      "reg",
      [
        "query",
        "HKCU\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\https\\UserChoice",
        "/v",
        "ProgId",
      ],
      { encoding: "utf-8", windowsHide: true }
    );
    if (userChoice.status !== 0 || !userChoice.stdout) {
      return null;
    }

    const progIdMatch = userChoice.stdout.match(/ProgId\s+REG_SZ\s+([^\r\n]+)/i);
    const progId = progIdMatch?.[1]?.trim();
    if (!progId) {
      return null;
    }

    const openCommand = spawnSync(
      "reg",
      ["query", `HKCR\\${progId}\\shell\\open\\command`, "/ve"],
      { encoding: "utf-8", windowsHide: true }
    );
    if (openCommand.status !== 0 || !openCommand.stdout) {
      return null;
    }

    const commandMatch = openCommand.stdout.match(/REG_SZ\s+([^\r\n]+)/i);
    const command = commandMatch?.[1];
    if (!command) {
      return null;
    }
    return parseExecutableFromCommand(command);
  } catch {
    return null;
  }
}

interface RunRemotePlanLiveReviewArgs {
  revisionId: string;
  filePath: string;
  content: string;
  logEvent?: (event: string, extra: Record<string, unknown>) => Promise<void>;
}

interface RunRemotePlanLiveReviewResult {
  sessionId: string;
  reviewUrl: string;
  decision: RemoteWaitDecisionResult;
}

const REVIEW_APP_DEFAULT_URL = "https://obsidian-note-reviewer-hook.vercel.app";
const DECISION_TIMEOUT_MS = 25 * 60 * 1000;
const DECISION_POLL_INTERVAL_MS = 1_000;
const DECISION_POLL_REQUEST_TIMEOUT_MS = 5_000;
const DECISION_MAX_CONSECUTIVE_TRANSPORT_ERRORS = 6;
const REMOTE_HEALTH_TIMEOUT_DEFAULT_MS = 2_000;
const REMOTE_HEALTH_TIMEOUT_MIN_MS = 300;
const REMOTE_HEALTH_TIMEOUT_MAX_MS = 15_000;

export class RemotePlanLiveError extends Error {
  public readonly stage: "init" | "wait_decision";
  public readonly sessionId: string;

  constructor(args: {
    stage: "init" | "wait_decision";
    sessionId: string;
    message: string;
  }) {
    super(args.message);
    this.name = "RemotePlanLiveError";
    this.stage = args.stage;
    this.sessionId = args.sessionId;
  }
}

export interface ReviewBrowserOpenDecisionArgs {
  lastOpenedAt?: string;
  lastOpenedRevisionId?: string;
  lastOpenedReviewUrl?: string;
  revisionId: string;
  reviewUrl: string;
}

function normalizeUrl(url: string): string {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

function toBooleanEnv(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  const normalized = value.trim().toLowerCase();
  if (normalized === "1" || normalized === "true" || normalized === "yes") return true;
  if (normalized === "0" || normalized === "false" || normalized === "no") return false;
  return defaultValue;
}

export function getPlanLiveReviewTarget(): PlanLiveReviewTarget {
  const raw = (process.env.OBSREVIEW_REVIEW_TARGET || "auto").trim().toLowerCase();
  if (raw === "auto") return "auto";
  return raw === "local" ? "local" : "remote";
}

export function shouldFallbackToLocalReviewTarget(): boolean {
  return toBooleanEnv(process.env.OBSREVIEW_REMOTE_FALLBACK_LOCAL, true);
}

export function getReviewAppBaseUrl(): string {
  const configured = process.env.OBSREVIEW_REVIEW_APP_URL?.trim();
  return normalizeUrl(configured || REVIEW_APP_DEFAULT_URL);
}

function getRemoteApiBaseUrl(): string {
  return `${getReviewAppBaseUrl()}/api/hook-review`;
}

function getRemoteHealthTimeoutMs(): number {
  const raw = process.env.OBSREVIEW_REMOTE_HEALTH_TIMEOUT_MS?.trim();
  const parsed = raw ? Number.parseInt(raw, 10) : NaN;
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return REMOTE_HEALTH_TIMEOUT_DEFAULT_MS;
  }
  return Math.min(
    REMOTE_HEALTH_TIMEOUT_MAX_MS,
    Math.max(REMOTE_HEALTH_TIMEOUT_MIN_MS, parsed)
  );
}

function isTimeoutLikeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const typedError = error as { name?: unknown; message?: unknown };
  const name = typeof typedError.name === "string" ? typedError.name.toLowerCase() : "";
  const message =
    typeof typedError.message === "string" ? typedError.message.toLowerCase() : "";

  return (
    name.includes("timeout") ||
    name.includes("abort") ||
    message.includes("timeout") ||
    message.includes("timed out") ||
    message.includes("abort")
  );
}

async function probeRemoteHealth(fetchFn: typeof fetch): Promise<{
  healthy: boolean;
  status: number | null;
  reason: PlanLiveTargetReason;
  error: string | null;
}> {
  const timeoutMs = getRemoteHealthTimeoutMs();
  const url = `${getRemoteApiBaseUrl()}/health`;

  try {
    const response = await fetchFn(url, {
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (response.ok) {
      return {
        healthy: true,
        status: response.status,
        reason: "remote_healthy",
        error: null,
      };
    }
    return {
      healthy: false,
      status: response.status,
      reason: "remote_unhealthy",
      error: `Health probe returned ${response.status}`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      healthy: false,
      status: null,
      reason: isTimeoutLikeError(error) ? "remote_timeout" : "remote_unhealthy",
      error: message,
    };
  }
}

export async function resolveReviewTarget(
  fetchFn: typeof fetch = fetch
): Promise<ResolvedPlanLiveTarget> {
  const configuredTarget = getPlanLiveReviewTarget();

  if (configuredTarget === "remote") {
    return {
      target: "remote",
      configuredTarget,
      reason: "forced_remote",
      remoteStatus: null,
      remoteError: null,
    };
  }

  if (configuredTarget === "local") {
    return {
      target: "local",
      configuredTarget,
      reason: "forced_local",
      remoteStatus: null,
      remoteError: null,
    };
  }

  const probe = await probeRemoteHealth(fetchFn);
  return {
    target: probe.healthy ? "remote" : "local",
    configuredTarget,
    reason: probe.reason,
    remoteStatus: probe.status,
    remoteError: probe.error,
  };
}

function getRemoteSessionFilePath(): string {
  return resolve(process.cwd(), ".temp", "plan-live-remote-session.json");
}

function buildSessionId(workspacePath: string): string {
  return createHash("sha1").update(workspacePath).digest("hex").slice(0, 16);
}

function buildWorkspaceHash(workspacePath: string): string {
  return createHash("sha256").update(workspacePath).digest("hex");
}

async function loadRemoteSessionState(
  sessionFile: string
): Promise<RemoteSessionFileState | null> {
  try {
    const raw = await readFile(sessionFile, "utf-8");
    const parsed = JSON.parse(raw) as RemoteSessionFileState;
    if (
      !parsed ||
      typeof parsed.sessionId !== "string" ||
      !parsed.sessionId.trim() ||
      typeof parsed.reviewKey !== "string" ||
      !parsed.reviewKey.trim() ||
      typeof parsed.workspaceHash !== "string" ||
      !parsed.workspaceHash.trim()
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function saveRemoteSessionState(
  sessionFile: string,
  state: RemoteSessionFileState
): Promise<void> {
  await mkdir(dirname(sessionFile), { recursive: true });
  await writeFile(sessionFile, JSON.stringify(state, null, 2), "utf-8");
}

async function ensureRemoteSessionCredentials(): Promise<RemoteSessionCredentials> {
  const sessionFile = getRemoteSessionFilePath();
  const workspaceHash = buildWorkspaceHash(process.cwd());
  const expectedSessionId = buildSessionId(process.cwd());
  const existing = await loadRemoteSessionState(sessionFile);

  if (
    existing &&
    existing.workspaceHash === workspaceHash &&
    existing.sessionId === expectedSessionId &&
    existing.reviewKey
  ) {
    return {
      sessionId: existing.sessionId,
      reviewKey: existing.reviewKey,
      workspaceHash: existing.workspaceHash,
      lastOpenedAt: existing.lastOpenedAt,
      lastOpenedRevisionId: existing.lastOpenedRevisionId,
      lastOpenedReviewUrl: existing.lastOpenedReviewUrl,
    };
  }

  const nextState: RemoteSessionFileState = {
    sessionId: expectedSessionId,
    reviewKey: randomUUID().replace(/-/g, ""),
    workspaceHash,
    updatedAt: new Date().toISOString(),
  };
  await saveRemoteSessionState(sessionFile, nextState);

  return {
    sessionId: nextState.sessionId,
    reviewKey: nextState.reviewKey,
    workspaceHash: nextState.workspaceHash,
  };
}

export function shouldOpenReviewBrowser(args: ReviewBrowserOpenDecisionArgs): boolean {
  const normalizeSessionReviewUrl = (value: string): string => {
    try {
      const parsed = new URL(value);
      parsed.searchParams.delete("revisionId");
      return parsed.toString();
    } catch {
      return value;
    }
  };

  if (!args.lastOpenedReviewUrl) {
    return true;
  }

  return (
    normalizeSessionReviewUrl(args.lastOpenedReviewUrl) !==
    normalizeSessionReviewUrl(args.reviewUrl)
  );
}

async function markBrowserOpened(args: {
  revisionId: string;
  reviewUrl: string;
}): Promise<void> {
  const sessionFile = getRemoteSessionFilePath();
  const existing = await loadRemoteSessionState(sessionFile);
  if (!existing) return;
  existing.lastOpenedAt = new Date().toISOString();
  existing.lastOpenedRevisionId = args.revisionId;
  existing.lastOpenedReviewUrl = args.reviewUrl;
  existing.updatedAt = new Date().toISOString();
  await saveRemoteSessionState(sessionFile, existing);
}

async function openBrowser(
  url: string
): Promise<{ opened: boolean; method: string; error?: string }> {
  try {
    const configuredBrowser = getConfiguredBrowserExecutable();
    if (configuredBrowser) {
      const child = spawn(configuredBrowser, [url], {
        detached: true,
        stdio: "ignore",
        windowsHide: process.platform === "win32",
      });
      child.unref();
      return { opened: true, method: "configured_exe" };
    }

    if (process.platform === "win32") {
      const defaultBrowserExe = resolveWindowsDefaultBrowserExecutable();
      if (defaultBrowserExe) {
        try {
          const child = spawn(defaultBrowserExe, [url], {
            detached: true,
            stdio: "ignore",
            windowsHide: true,
          });
          child.unref();
          return { opened: true, method: "windows_default_browser_exe" };
        } catch {
          // keep fallback chain below
        }
      }

      const child = spawn("cmd", buildWindowsStartArgs(url), {
        detached: true,
        stdio: "ignore",
        windowsHide: true,
      });
      child.unref();
      return { opened: true, method: "windows_cmd_start" };
    }
    if (process.platform === "darwin") {
      await $`open ${url}`.quiet();
      return { opened: true, method: "mac_open" };
    }
    await $`xdg-open ${url}`.quiet();
    return { opened: true, method: "linux_xdg_open" };
  } catch {
    // best effort only
  }

  if (process.platform === "win32") {
    try {
      const child = spawn(
        "powershell",
        ["-NoProfile", "-Command", `Start-Process "${url.replace(/"/g, "")}"`],
        {
          detached: true,
          stdio: "ignore",
          windowsHide: true,
        }
      );
      child.unref();
      return { opened: true, method: "windows_powershell_start_process" };
    } catch (error) {
      return {
        opened: false,
        method: "windows_fallback_failed",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  return { opened: false, method: "open_failed", error: "Unknown open failure" };
}

async function publishRemoteRevision(args: {
  apiBaseUrl: string;
  sessionId: string;
  reviewKey: string;
  workspaceHash: string;
  revisionId: string;
  filePath: string;
  content: string;
}): Promise<RemoteRevisionPublishResponse> {
  const response = await fetch(`${args.apiBaseUrl}/session/revision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId: args.sessionId,
      reviewKey: args.reviewKey,
      workspaceHash: args.workspaceHash,
      revisionId: args.revisionId,
      filePath: args.filePath,
      content: args.content,
      mode: "plan-live-review",
    }),
    signal: AbortSignal.timeout(15_000),
  });

  if (!response.ok) {
    throw new Error(`Remote publish failed with status ${response.status}`);
  }

  const payload = (await response.json()) as RemoteRevisionPublishResponse;
  return payload;
}

async function waitRemoteDecision(args: {
  apiBaseUrl: string;
  sessionId: string;
  reviewKey: string;
  revisionId: string;
}): Promise<RemoteWaitDecisionResult> {
  const deadline = Date.now() + DECISION_TIMEOUT_MS;
  let consecutiveTransportErrors = 0;

  while (Date.now() < deadline) {
    const query = new URLSearchParams({
      sessionId: args.sessionId,
      reviewKey: args.reviewKey,
      revisionId: args.revisionId,
    });
    try {
      const response = await fetch(`${args.apiBaseUrl}/wait-decision?${query.toString()}`, {
        signal: AbortSignal.timeout(DECISION_POLL_REQUEST_TIMEOUT_MS),
        cache: "no-store",
      });

      if (response.status === 204) {
        consecutiveTransportErrors = 0;
        await Bun.sleep(DECISION_POLL_INTERVAL_MS);
        continue;
      }

      if (!response.ok) {
        throw new Error(`Remote wait failed with status ${response.status}`);
      }

      const payload = (await response.json()) as RemoteWaitDecisionResult;
      if (payload.ok && (payload.decision === "approve" || payload.decision === "request_changes")) {
        return payload;
      }

      if (payload.timeout) {
        return { ok: false, timeout: true };
      }

      consecutiveTransportErrors = 0;
    } catch (error) {
      consecutiveTransportErrors += 1;
      if (consecutiveTransportErrors >= DECISION_MAX_CONSECUTIVE_TRANSPORT_ERRORS) {
        throw new Error(
          `Remote decision polling connection lost (attempts=${consecutiveTransportErrors}): ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
      await Bun.sleep(DECISION_POLL_INTERVAL_MS);
    }
  }

  return { ok: false, timeout: true };
}

export async function runRemotePlanLiveReview(
  args: RunRemotePlanLiveReviewArgs
): Promise<RunRemotePlanLiveReviewResult> {
  const credentials = await ensureRemoteSessionCredentials();
  const apiBaseUrl = getRemoteApiBaseUrl();
  const log = args.logEvent;

  if (log) {
    await log("remote_session_ready", {
      filePath: args.filePath,
      sessionId: credentials.sessionId,
      revisionId: args.revisionId,
      decision: null,
      latency_ms: 0,
      timeout: false,
      apiBaseUrl,
    });
  }

  let publishPayload: RemoteRevisionPublishResponse;
  try {
    publishPayload = await publishRemoteRevision({
      apiBaseUrl,
      sessionId: credentials.sessionId,
      reviewKey: credentials.reviewKey,
      workspaceHash: credentials.workspaceHash,
      revisionId: args.revisionId,
      filePath: args.filePath,
      content: args.content,
    });
  } catch (error) {
    throw new RemotePlanLiveError({
      stage: "init",
      sessionId: credentials.sessionId,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  const reviewUrl = `${getReviewAppBaseUrl()}/hook-review?${new URLSearchParams({
    sessionId: credentials.sessionId,
    reviewKey: credentials.reviewKey,
    revisionId: args.revisionId,
    mode: "plan-live-review",
  }).toString()}`;

  const shouldOpen = shouldOpenReviewBrowser({
    lastOpenedAt: credentials.lastOpenedAt,
    lastOpenedRevisionId: credentials.lastOpenedRevisionId,
    lastOpenedReviewUrl: credentials.lastOpenedReviewUrl,
    revisionId: args.revisionId,
    reviewUrl,
  });

  if (shouldOpen) {
    const browserResult = await openBrowser(reviewUrl);

    if (log) {
      await log("remote_browser_open", {
        filePath: args.filePath,
        sessionId: credentials.sessionId,
        revisionId: args.revisionId,
        decision: null,
        latency_ms: 0,
        timeout: false,
        method: browserResult.method,
        opened: browserResult.opened,
        error: browserResult.error || null,
        url: reviewUrl,
      });
    }

    await markBrowserOpened({
      revisionId: args.revisionId,
      reviewUrl,
    });
  } else if (log) {
    await log("remote_browser_open_skipped", {
      filePath: args.filePath,
      sessionId: credentials.sessionId,
      revisionId: args.revisionId,
      decision: null,
      latency_ms: 0,
      timeout: false,
      reason: "same_session_already_opened",
      url: reviewUrl,
    });
  }

  if (log) {
    await log("remote_revision_published", {
      filePath: args.filePath,
      sessionId: credentials.sessionId,
      revisionId: args.revisionId,
      decision: null,
      latency_ms: 0,
      timeout: false,
      reviewUrl,
      apiReviewUrl: publishPayload.reviewUrl || null,
    });
  }

  let decision: RemoteWaitDecisionResult;
  try {
    decision = await waitRemoteDecision({
      apiBaseUrl,
      sessionId: credentials.sessionId,
      reviewKey: credentials.reviewKey,
      revisionId: args.revisionId,
    });
  } catch (error) {
    throw new RemotePlanLiveError({
      stage: "wait_decision",
      sessionId: credentials.sessionId,
      message: error instanceof Error ? error.message : String(error),
    });
  }

  return {
    sessionId: credentials.sessionId,
    reviewUrl,
    decision,
  };
}
