import { describe, expect, test } from "bun:test";
import { PlanLiveState } from "../planLiveState";

describe("PlanLiveState", () => {
  test("stores and returns the latest revision", () => {
    const state = new PlanLiveState();
    state.setRevision({
      revisionId: "rev-1",
      content: "# Plano\n\n1. Passo",
      filePath: "/repo/.claude/plans/test.md",
      createdAt: new Date().toISOString(),
      sessionId: "session-1",
    });

    const revision = state.getRevision();
    expect(revision).not.toBeNull();
    expect(revision?.revisionId).toBe("rev-1");
    expect(revision?.filePath).toContain(".claude/plans");
  });

  test("returns an existing decision immediately", async () => {
    const state = new PlanLiveState();
    state.setDecision({
      revisionId: "rev-2",
      decision: "approve",
    });

    const decision = await state.waitForDecision("rev-2", 500);
    expect(decision).not.toBeNull();
    expect(decision?.decision).toBe("approve");
  });

  test("waits until a decision is posted", async () => {
    const state = new PlanLiveState();
    const waitPromise = state.waitForDecision("rev-3", 1000);

    setTimeout(() => {
      state.setDecision({
        revisionId: "rev-3",
        decision: "request_changes",
        feedback: "Ajustar passo 2",
      });
    }, 100);

    const decision = await waitPromise;
    expect(decision).not.toBeNull();
    expect(decision?.decision).toBe("request_changes");
    expect(decision?.feedback).toContain("passo 2");
  });

  test("returns null on timeout without decision", async () => {
    const state = new PlanLiveState();
    const decision = await state.waitForDecision("rev-timeout", 120);
    expect(decision).toBeNull();
  });
});
