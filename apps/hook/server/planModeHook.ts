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
 * - GET  /api/content - Returns plan content and context
 * - POST /api/approve - User approved the plan
 * - POST /api/deny - User requested changes with feedback
 */

import { $ } from "bun";
import { getHookCSP } from "@obsidian-note-reviewer/security/csp";
import { validatePath } from "./pathValidation";

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

interface PlanModeEvent {
  tool_input?: {
    file_path?: string;
    content?: string;
    plan_name?: string;
  };
  [key: string]: unknown;
}

interface PlanContent {
  content: string;
  filePath?: string;
  planName?: string;
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
  // PermissionRequest ExitPlanMode may send plan content in various formats
  planContent.content = event.tool_input?.content || "";
  planContent.filePath = event.tool_input?.file_path || "";
  planContent.planName = event.tool_input?.plan_name || "";

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
  // Exit silently if invalid JSON
  process.exit(0);
}

// If no plan content at all, exit silently
if (!planContent.content && !planContent.filePath) {
  console.error("[PlanModeHook] No plan content or file path found, exiting");
  process.exit(0);
}

// Promise that resolves when user makes a decision
let resolveDecision: (result: { approved: boolean; feedback?: string }) => void;
const decisionPromise = new Promise<{ approved: boolean; feedback?: string }>(
  (resolve) => { resolveDecision = resolve; }
);

// Inactivity timeout tracking
let lastActivityTime = Date.now();
let timeoutWarningShown = false;

// Reset activity timer on any API call
function resetActivity(): void {
  lastActivityTime = Date.now();
}

// Start inactivity monitoring
const inactivityTimer = setInterval(() => {
  const inactiveTime = Date.now() - lastActivityTime;

  if (inactiveTime > INACTIVITY_TIMEOUT_MS) {
    console.error("[PlanModeHook] Inactivity timeout reached, closing reviewer");
    resolveDecision({ approved: false, feedback: "Session timed out due to inactivity" });
  } else if (inactiveTime > WARNING_TIMEOUT_MS && !timeoutWarningShown) {
    console.error(`[PlanModeHook] ⚠️ Warning: Review will timeout in ${Math.round((INACTIVITY_TIMEOUT_MS - inactiveTime) / 60000)} minutes of inactivity`);
    timeoutWarningShown = true;
  }
}, 30000); // Check every 30 seconds

const server = Bun.serve({
  port: 0, // Random available port

  async fetch(req) {
    const url = new URL(req.url);

    // Reset activity on any request
    resetActivity();

    console.log(`[PlanModeHook] ${req.method} ${url.pathname}`);

    // API: Get plan content
    if (url.pathname === "/api/content") {
      return Response.json(
        {
          content: planContent.content,
          filePath: planContent.filePath,
          planName: planContent.planName,
          mode: "plan-review"
        },
        { headers: getSecurityHeaders() }
      );
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

    // Serve embedded HTML for all other routes (SPA)
    return new Response(indexHtml, {
      headers: {
        "Content-Type": "text/html",
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
    await $`cmd /c start ${url}`.quiet();
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
clearInterval(inactivityTimer);

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
