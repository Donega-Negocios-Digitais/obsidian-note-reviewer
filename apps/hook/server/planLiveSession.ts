/**
 * Obsidian Note Reviewer - Plan Live Session Server
 *
 * Persistent local session for pre-execution plan review.
 * It keeps one browser tab alive and updates the same UI across revisions.
 */

import { $ } from "bun";
import { spawn } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { getHookCSP } from "@obsidian-note-reviewer/security/csp";
import {
  PlanLiveState,
  type PlanLiveRevision,
} from "./planLiveState";
import { handleSaveEndpoint } from "./saveEndpoint";

import indexHtml from "../dist/index.html" with { type: "text" };

const DEFAULT_DECISION_TIMEOUT_MS = 25 * 60 * 1000;
const CLIENT_ACTIVITY_STALE_MS = 5_000;
const SESSION_SERVER_VERSION = 2;
const cspHeader = getHookCSP(false);

function getSecurityHeaders(): Record<string, string> {
  return {
    "Content-Security-Policy": cspHeader,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

function parseArgs(): { sessionFile: string } {
  const argv = process.argv.slice(2);
  const sessionFileIndex = argv.findIndex((arg) => arg === "--session-file");
  const sessionFile =
    sessionFileIndex >= 0 && argv[sessionFileIndex + 1]
      ? argv[sessionFileIndex + 1]
      : resolve(process.cwd(), ".temp", "plan-live-session.json");

  return { sessionFile: resolve(sessionFile) };
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
    console.error(`[PlanLiveSession] Open browser manually: ${url}`);
  }
}

export async function runPlanLiveSession(): Promise<void> {
  const { sessionFile } = parseArgs();
  const sessionState = new PlanLiveState();
  const startedAt = Date.now();
  const sessionId = createHash("sha1")
    .update(process.cwd())
    .digest("hex")
    .slice(0, 16);
  const sessionLogFile = resolve(process.cwd(), ".logs", "plan-live-session.log");
  let browserOpened = false;
  let lastClientActivityAt = 0;
  let lastDecisionAt: number | null = null;
  let lastRevisionAt: number | null = null;
  let lastDecisionRevisionId: string | null = null;

  await mkdir(dirname(sessionFile), { recursive: true });
  await mkdir(dirname(sessionLogFile), { recursive: true });

  async function logSessionEvent(
    event: string,
    extra: Record<string, unknown> = {}
  ): Promise<void> {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      event,
      sessionId,
      revisionId: null,
      decision: null,
      latency_ms: 0,
      timeout: false,
      ...extra,
    });
    await appendFile(sessionLogFile, `${line}\n`, "utf-8");
  }

  function markClientActivity(): void {
    lastClientActivityAt = Date.now();
  }

  function shouldReopenBrowser(): boolean {
    if (!browserOpened) {
      return true;
    }
    return Date.now() - lastClientActivityAt > CLIENT_ACTIVITY_STALE_MS;
  }

  const server = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url);
      console.error(`[PlanLiveSession] ${req.method} ${url.pathname}`);

      if (url.pathname === "/health" && req.method === "GET") {
        const current = sessionState.getRevision();
        return Response.json(
          {
            status: "ok",
            mode: "plan-live-review",
            sessionId,
            revisionId: current?.revisionId || null,
            uptime: Math.floor((Date.now() - startedAt) / 1000),
            timestamp: new Date().toISOString(),
          },
          { headers: getSecurityHeaders() }
        );
      }

      if (url.pathname === "/api/session/revision" && req.method === "POST") {
        try {
          const body = (await req.json()) as {
            revisionId?: string;
            content?: string;
            filePath?: string;
          };

          if (!body || typeof body.content !== "string" || !body.content.trim()) {
            return Response.json(
              { ok: false, error: "Missing revision content" },
              { status: 400, headers: getSecurityHeaders() }
            );
          }

          if (!body.filePath || typeof body.filePath !== "string") {
            return Response.json(
              { ok: false, error: "Missing filePath" },
              { status: 400, headers: getSecurityHeaders() }
            );
          }

          const revision: PlanLiveRevision = {
            revisionId:
              body.revisionId && body.revisionId.trim()
                ? body.revisionId.trim()
                : randomUUID(),
            content: body.content,
            filePath: body.filePath,
            createdAt: new Date().toISOString(),
            sessionId,
          };

          sessionState.setRevision(revision);
          const publishedAt = Date.now();
          const decisionToRevisionLatencyMs =
            lastDecisionAt &&
            lastDecisionRevisionId &&
            lastDecisionRevisionId !== revision.revisionId
              ? publishedAt - lastDecisionAt
              : null;
          lastRevisionAt = publishedAt;
          await logSessionEvent("revision_published", {
            revisionId: revision.revisionId,
            filePath: revision.filePath,
            latency_ms: decisionToRevisionLatencyMs ?? 0,
            decision_to_next_revision_latency_ms: decisionToRevisionLatencyMs,
          });

          if (shouldReopenBrowser()) {
            browserOpened = true;
            await openBrowser(`http://localhost:${server.port}`);
            await logSessionEvent("browser_opened", {
              url: `http://localhost:${server.port}`,
              reason:
                lastClientActivityAt === 0 ? "first_revision" : "client_activity_stale",
            });
          }

          return Response.json(
            { ok: true, sessionId, revisionId: revision.revisionId },
            { headers: getSecurityHeaders() }
          );
        } catch (error) {
          return Response.json(
            {
              ok: false,
              error: error instanceof Error ? error.message : "Invalid payload",
            },
            { status: 500, headers: getSecurityHeaders() }
          );
        }
      }

      if (url.pathname === "/api/save" && req.method === "POST") {
        markClientActivity();
        return handleSaveEndpoint(req, getSecurityHeaders());
      }

      if (
        (url.pathname === "/api/plan" || url.pathname === "/api/content") &&
        req.method === "GET"
      ) {
        markClientActivity();
        const revision = sessionState.getRevision();
        if (!revision) {
          return new Response(null, { status: 204, headers: getSecurityHeaders() });
        }

        const sinceRevision = url.searchParams.get("sinceRevision");
        if (sinceRevision && sinceRevision === revision.revisionId) {
          return new Response(null, { status: 204, headers: getSecurityHeaders() });
        }

        return Response.json(
          {
            plan: revision.content,
            content: revision.content,
            filePath: revision.filePath,
            mode: "plan-live-review",
            origin: "claude-code",
            sessionId,
            revisionId: revision.revisionId,
            updatedAt: revision.createdAt,
          },
          { headers: getSecurityHeaders() }
        );
      }

      if (url.pathname === "/api/session/wait-decision" && req.method === "GET") {
        const revisionId = url.searchParams.get("revisionId");
        if (!revisionId) {
          return Response.json(
            { ok: false, error: "revisionId is required" },
            { status: 400, headers: getSecurityHeaders() }
          );
        }

        const timeoutParam = Number(url.searchParams.get("timeoutMs") || "");
        const timeoutMs = Number.isFinite(timeoutParam)
          ? Math.max(1000, Math.min(timeoutParam, DEFAULT_DECISION_TIMEOUT_MS))
          : DEFAULT_DECISION_TIMEOUT_MS;
        const waitStart = Date.now();

        const decision = await sessionState.waitForDecision(revisionId, timeoutMs);
        if (!decision) {
          await logSessionEvent("decision_timeout", {
            revisionId,
            latency_ms: Date.now() - waitStart,
            timeout: true,
          });
          return Response.json(
            {
              ok: false,
              timeout: true,
              revisionId,
              message: "Timed out waiting for plan decision",
            },
            { status: 408, headers: getSecurityHeaders() }
          );
        }

        await logSessionEvent("decision_delivered", {
          revisionId: decision.revisionId,
          decision: decision.decision,
          latency_ms: Date.now() - waitStart,
          timeout: false,
        });

        return Response.json(
          {
            ok: true,
            revisionId: decision.revisionId,
            decision: decision.decision,
            feedback: decision.feedback,
          },
          { headers: getSecurityHeaders() }
        );
      }

      if (url.pathname === "/api/session/decision" && req.method === "GET") {
        const revisionId = url.searchParams.get("revisionId");
        if (!revisionId) {
          return Response.json(
            { ok: false, error: "revisionId is required" },
            { status: 400, headers: getSecurityHeaders() }
          );
        }

        const decision = sessionState.getDecision(revisionId);
        if (!decision) {
          return new Response(null, { status: 204, headers: getSecurityHeaders() });
        }

        return Response.json(
          {
            ok: true,
            revisionId: decision.revisionId,
            decision: decision.decision,
            feedback: decision.feedback,
          },
          { headers: getSecurityHeaders() }
        );
      }

      if (url.pathname === "/api/session/decision" && req.method === "POST") {
        markClientActivity();
        try {
          const body = (await req.json()) as {
            revisionId?: string;
            decision?: string;
            feedback?: string;
          };
          const currentRevision = sessionState.getRevision();
          const revisionId =
            body.revisionId?.trim() || currentRevision?.revisionId || "";

          if (!revisionId) {
            return Response.json(
              { ok: false, error: "No active revision to decide" },
              { status: 400, headers: getSecurityHeaders() }
            );
          }

          if (body.decision !== "approve" && body.decision !== "request_changes") {
            return Response.json(
              { ok: false, error: "decision must be approve or request_changes" },
              { status: 400, headers: getSecurityHeaders() }
            );
          }

          const decision = sessionState.setDecision({
            revisionId,
            decision: body.decision,
            feedback: body.feedback,
          });
          lastDecisionAt = Date.now();
          lastDecisionRevisionId = decision.revisionId;
          await logSessionEvent("decision_received", {
            revisionId: decision.revisionId,
            decision: decision.decision,
            latency_ms: 0,
            timeout: false,
          });

          return Response.json(
            { ok: true, revisionId: decision.revisionId, decision: decision.decision },
            { headers: getSecurityHeaders() }
          );
        } catch (error) {
          return Response.json(
            {
              ok: false,
              error: error instanceof Error ? error.message : "Invalid payload",
            },
            { status: 500, headers: getSecurityHeaders() }
          );
        }
      }

      if (url.pathname === "/api/session/status" && req.method === "GET") {
        const revision = sessionState.getRevision();
        const now = Date.now();
        const idleMs = lastClientActivityAt > 0 ? now - lastClientActivityAt : null;
        const hasRecentClientActivity =
          typeof idleMs === "number" && idleMs <= CLIENT_ACTIVITY_STALE_MS;

        return Response.json(
          {
            ok: true,
            sessionId,
            hasRevision: Boolean(revision),
            currentRevisionId: revision?.revisionId || null,
            revisionId: revision?.revisionId || null,
            browserOpened,
            lastClientActivityAt: lastClientActivityAt || null,
            lastDecisionAt: lastDecisionAt ? new Date(lastDecisionAt).toISOString() : null,
            lastRevisionAt: lastRevisionAt ? new Date(lastRevisionAt).toISOString() : null,
            idleMs,
            hasRecentClientActivity,
          },
          { headers: getSecurityHeaders() }
        );
      }

      if (url.pathname === "/api/approve" && req.method === "POST") {
        markClientActivity();
        const revision = sessionState.getRevision();
        if (!revision) {
          return Response.json(
            { ok: false, error: "No active revision" },
            { status: 400, headers: getSecurityHeaders() }
          );
        }

        sessionState.setDecision({
          revisionId: revision.revisionId,
          decision: "approve",
          feedback: "",
        });
        lastDecisionAt = Date.now();
        lastDecisionRevisionId = revision.revisionId;
        await logSessionEvent("decision_received", {
          revisionId: revision.revisionId,
          decision: "approve",
          latency_ms: 0,
          timeout: false,
        });
        return Response.json({ ok: true }, { headers: getSecurityHeaders() });
      }

      if (
        (url.pathname === "/api/deny" || url.pathname === "/api/feedback") &&
        req.method === "POST"
      ) {
        markClientActivity();
        const revision = sessionState.getRevision();
        if (!revision) {
          return Response.json(
            { ok: false, error: "No active revision" },
            { status: 400, headers: getSecurityHeaders() }
          );
        }

        let feedback = "Changes requested";
        try {
          const body = (await req.json()) as { feedback?: unknown };
          if (typeof body.feedback === "string" && body.feedback.trim()) {
            feedback = body.feedback.trim();
          }
        } catch {
          // keep default feedback
        }

        sessionState.setDecision({
          revisionId: revision.revisionId,
          decision: "request_changes",
          feedback,
        });
        lastDecisionAt = Date.now();
        lastDecisionRevisionId = revision.revisionId;
        await logSessionEvent("decision_received", {
          revisionId: revision.revisionId,
          decision: "request_changes",
          latency_ms: 0,
          timeout: false,
        });
        return Response.json({ ok: true }, { headers: getSecurityHeaders() });
      }

      if (req.method === "GET") {
        markClientActivity();
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

  const sessionMetadata = {
    sessionId,
    pid: process.pid,
    serverVersion: SESSION_SERVER_VERSION,
    port: server.port,
    url: `http://localhost:${server.port}`,
    sessionFile,
    startedAt: new Date(startedAt).toISOString(),
    updatedAt: new Date().toISOString(),
    mode: "plan-live-review",
  };

  await writeFile(sessionFile, JSON.stringify(sessionMetadata, null, 2), "utf-8");
  await logSessionEvent("session_started", {
    revisionId: null,
    decision: null,
    latency_ms: 0,
    timeout: false,
    port: server.port,
    sessionFile,
  });
  console.error(`[PlanLiveSession] Running on ${sessionMetadata.url}`);

  async function cleanupAndExit(code: number): Promise<void> {
    try {
      await rm(sessionFile, { force: true });
    } catch {
      // ignore cleanup errors
    }
    process.exit(code);
  }

  process.on("SIGTERM", () => {
    void cleanupAndExit(0);
  });
  process.on("SIGINT", () => {
    void cleanupAndExit(0);
  });
}

if (import.meta.main) {
  await runPlanLiveSession();
}
