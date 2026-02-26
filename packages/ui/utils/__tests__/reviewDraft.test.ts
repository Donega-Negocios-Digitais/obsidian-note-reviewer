import { beforeEach, describe, expect, test } from "bun:test";
import {
  buildReviewDraftKey,
  clearReviewDraft,
  loadReviewDraft,
  saveReviewDraft,
} from "../reviewDraft";

describe("reviewDraft", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("builds a stable key for the same revision and file", () => {
    const key1 = buildReviewDraftKey({
      revisionId: "rev-1",
      filePath: "/.claude/plans/a.md",
      workspaceId: "workspace-a",
    });
    const key2 = buildReviewDraftKey({
      revisionId: "rev-1",
      filePath: "/.claude/plans/a.md",
      workspaceId: "workspace-a",
    });
    expect(key1).toBeTruthy();
    expect(key1).toBe(key2);
  });

  test("saves and restores a draft payload", () => {
    const saved = saveReviewDraft({
      revisionId: "rev-2",
      filePath: "/.claude/plans/health.md",
      workspaceId: "workspace-b",
      content: "# Plano atualizado",
    });
    expect(saved).toBe(true);

    const restored = loadReviewDraft({
      revisionId: "rev-2",
      filePath: "/.claude/plans/health.md",
      workspaceId: "workspace-b",
    });

    expect(restored).not.toBeNull();
    expect(restored?.revisionId).toBe("rev-2");
    expect(restored?.filePath).toBe("/.claude/plans/health.md");
    expect(restored?.content).toBe("# Plano atualizado");
  });

  test("isolates drafts by revision id", () => {
    saveReviewDraft({
      revisionId: "rev-3-a",
      filePath: "/.claude/plans/health.md",
      workspaceId: "workspace-c",
      content: "A",
    });
    saveReviewDraft({
      revisionId: "rev-3-b",
      filePath: "/.claude/plans/health.md",
      workspaceId: "workspace-c",
      content: "B",
    });

    const draftA = loadReviewDraft({
      revisionId: "rev-3-a",
      filePath: "/.claude/plans/health.md",
      workspaceId: "workspace-c",
    });
    const draftB = loadReviewDraft({
      revisionId: "rev-3-b",
      filePath: "/.claude/plans/health.md",
      workspaceId: "workspace-c",
    });

    expect(draftA?.content).toBe("A");
    expect(draftB?.content).toBe("B");
  });

  test("clears a saved draft", () => {
    saveReviewDraft({
      revisionId: "rev-4",
      filePath: "/.claude/plans/cleanup.md",
      workspaceId: "workspace-d",
      content: "temp",
    });

    clearReviewDraft({
      revisionId: "rev-4",
      filePath: "/.claude/plans/cleanup.md",
      workspaceId: "workspace-d",
    });

    const restored = loadReviewDraft({
      revisionId: "rev-4",
      filePath: "/.claude/plans/cleanup.md",
      workspaceId: "workspace-d",
    });

    expect(restored).toBeNull();
  });
});

