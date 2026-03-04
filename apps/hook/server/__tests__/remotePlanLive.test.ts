import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  buildWindowsStartArgs,
  getPlanLiveReviewTarget,
  resolveReviewTarget,
  getReviewAppBaseUrl,
  shouldFallbackToLocalReviewTarget,
  shouldOpenReviewBrowser,
} from "../remotePlanLive";

const originalTarget = process.env.OBSREVIEW_REVIEW_TARGET;
const originalFallback = process.env.OBSREVIEW_REMOTE_FALLBACK_LOCAL;
const originalReviewUrl = process.env.OBSREVIEW_REVIEW_APP_URL;
const originalHealthTimeout = process.env.OBSREVIEW_REMOTE_HEALTH_TIMEOUT_MS;
const originalReopenIdle = process.env.OBSREVIEW_REMOTE_REOPEN_IDLE_MS;
const originalFetch = globalThis.fetch;

describe("remotePlanLive config", () => {
  beforeEach(() => {
    delete process.env.OBSREVIEW_REVIEW_TARGET;
    delete process.env.OBSREVIEW_REMOTE_FALLBACK_LOCAL;
    delete process.env.OBSREVIEW_REVIEW_APP_URL;
  });

  afterEach(() => {
    if (typeof originalTarget === "string") {
      process.env.OBSREVIEW_REVIEW_TARGET = originalTarget;
    } else {
      delete process.env.OBSREVIEW_REVIEW_TARGET;
    }

    if (typeof originalFallback === "string") {
      process.env.OBSREVIEW_REMOTE_FALLBACK_LOCAL = originalFallback;
    } else {
      delete process.env.OBSREVIEW_REMOTE_FALLBACK_LOCAL;
    }

    if (typeof originalReviewUrl === "string") {
      process.env.OBSREVIEW_REVIEW_APP_URL = originalReviewUrl;
    } else {
      delete process.env.OBSREVIEW_REVIEW_APP_URL;
    }

    if (typeof originalHealthTimeout === "string") {
      process.env.OBSREVIEW_REMOTE_HEALTH_TIMEOUT_MS = originalHealthTimeout;
    } else {
      delete process.env.OBSREVIEW_REMOTE_HEALTH_TIMEOUT_MS;
    }

    if (typeof originalReopenIdle === "string") {
      process.env.OBSREVIEW_REMOTE_REOPEN_IDLE_MS = originalReopenIdle;
    } else {
      delete process.env.OBSREVIEW_REMOTE_REOPEN_IDLE_MS;
    }

    globalThis.fetch = originalFetch;
  });

  test("defaults to auto target", () => {
    expect(getPlanLiveReviewTarget()).toBe("auto");
  });

  test("supports local override", () => {
    process.env.OBSREVIEW_REVIEW_TARGET = "local";
    expect(getPlanLiveReviewTarget()).toBe("local");
  });

  test("supports remote override", () => {
    process.env.OBSREVIEW_REVIEW_TARGET = "remote";
    expect(getPlanLiveReviewTarget()).toBe("remote");
  });

  test("enables local fallback by default", () => {
    expect(shouldFallbackToLocalReviewTarget()).toBe(true);
  });

  test("supports disabling local fallback", () => {
    process.env.OBSREVIEW_REMOTE_FALLBACK_LOCAL = "false";
    expect(shouldFallbackToLocalReviewTarget()).toBe(false);
  });

  test("normalizes review app url", () => {
    process.env.OBSREVIEW_REVIEW_APP_URL = "https://example.com/";
    expect(getReviewAppBaseUrl()).toBe("https://example.com");
  });

  test("auto target uses remote when health is 200", async () => {
    process.env.OBSREVIEW_REVIEW_TARGET = "auto";
    const calls: string[] = [];
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return new Response(JSON.stringify({ status: "ok" }), { status: 200 });
    }) as typeof fetch;

    const resolved = await resolveReviewTarget();
    expect(resolved.target).toBe("remote");
    expect(resolved.reason).toBe("remote_healthy");
    expect(resolved.remoteStatus).toBe(200);
    expect(calls[0]).toContain("/api/hook-review/health");
  });

  test("auto target uses local when health endpoint returns non-200", async () => {
    process.env.OBSREVIEW_REVIEW_TARGET = "auto";
    globalThis.fetch = (async () =>
      new Response(JSON.stringify({ status: "fail" }), { status: 404 })) as typeof fetch;

    const resolved = await resolveReviewTarget();
    expect(resolved.target).toBe("local");
    expect(resolved.reason).toBe("remote_unhealthy");
    expect(resolved.remoteStatus).toBe(404);
  });

  test("auto target uses local when health probe times out", async () => {
    process.env.OBSREVIEW_REVIEW_TARGET = "auto";
    process.env.OBSREVIEW_REMOTE_HEALTH_TIMEOUT_MS = "500";
    globalThis.fetch = (async () => {
      throw new Error("request timed out");
    }) as typeof fetch;

    const resolved = await resolveReviewTarget();
    expect(resolved.target).toBe("local");
    expect(resolved.reason).toBe("remote_timeout");
    expect(resolved.remoteStatus).toBeNull();
  });

  test("forced local bypasses remote probe", async () => {
    process.env.OBSREVIEW_REVIEW_TARGET = "local";
    let called = false;
    globalThis.fetch = (async () => {
      called = true;
      return new Response(null, { status: 200 });
    }) as typeof fetch;

    const resolved = await resolveReviewTarget();
    expect(resolved.target).toBe("local");
    expect(resolved.reason).toBe("forced_local");
    expect(called).toBe(false);
  });

  test("does not reopen browser only because revision changed", () => {
    const decision = shouldOpenReviewBrowser({
      lastOpenedAt: new Date().toISOString(),
      lastOpenedRevisionId: "rev-1",
      revisionId: "rev-2",
      lastOpenedReviewUrl:
        "https://example.com/hook-review?sessionId=a&reviewKey=k1&revisionId=rev-1&mode=plan-live-review",
      reviewUrl:
        "https://example.com/hook-review?sessionId=a&reviewKey=k1&revisionId=rev-2&mode=plan-live-review",
    });
    expect(decision.shouldOpen).toBe(false);
    expect(decision.reason).toBe("same_session_recently_opened_skip");
  });

  test("opens browser when review URL changes", () => {
    const decision = shouldOpenReviewBrowser({
      lastOpenedAt: new Date().toISOString(),
      lastOpenedRevisionId: "rev-1",
      revisionId: "rev-1",
      lastOpenedReviewUrl: "https://example.com/hook-review?sessionId=a",
      reviewUrl: "https://example.com/hook-review?sessionId=b",
    });
    expect(decision.shouldOpen).toBe(true);
    expect(decision.reason).toBe("session_changed");
  });

  test("can skip reopen when same revision/url and last open is fresh", () => {
    const decision = shouldOpenReviewBrowser({
      lastOpenedAt: new Date().toISOString(),
      lastOpenedRevisionId: "rev-1",
      revisionId: "rev-1",
      lastOpenedReviewUrl: "https://example.com/hook-review?sessionId=a",
      reviewUrl: "https://example.com/hook-review?sessionId=a",
    });
    expect(decision.shouldOpen).toBe(false);
    expect(decision.reason).toBe("same_session_recently_opened_skip");
  });

  test("reopens browser for same session when last open is stale", () => {
    process.env.OBSREVIEW_REMOTE_REOPEN_IDLE_MS = "60000";
    const stale = new Date(Date.now() - 60_000).toISOString();
    const decision = shouldOpenReviewBrowser({
      lastOpenedAt: stale,
      lastOpenedRevisionId: "rev-1",
      revisionId: "rev-2",
      lastOpenedReviewUrl:
        "https://example.com/hook-review?sessionId=a&reviewKey=k1&revisionId=rev-1&mode=plan-live-review",
      reviewUrl:
        "https://example.com/hook-review?sessionId=a&reviewKey=k1&revisionId=rev-2&mode=plan-live-review",
    });
    expect(decision.shouldOpen).toBe(true);
    expect(decision.reason).toBe("same_session_idle_reopen");
    expect(typeof decision.elapsedMs).toBe("number");
  });

  test("uses first_open when no previous URL exists", () => {
    const decision = shouldOpenReviewBrowser({
      revisionId: "rev-1",
      reviewUrl:
        "https://example.com/hook-review?sessionId=a&reviewKey=k1&revisionId=rev-1&mode=plan-live-review",
    });
    expect(decision.shouldOpen).toBe(true);
    expect(decision.reason).toBe("first_open");
  });

  test("buildWindowsStartArgs keeps URL quoted to preserve query params", () => {
    const url =
      "https://obsidian-note-reviewer-hook.vercel.app/hook-review?sessionId=s1&reviewKey=k1&mode=plan-live-review";
    const args = buildWindowsStartArgs(url);
    expect(args).toEqual([
      "/c",
      "start",
      "",
      `"${url}"`,
    ]);
  });
});
