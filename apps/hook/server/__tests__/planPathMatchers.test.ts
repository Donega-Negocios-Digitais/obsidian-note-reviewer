import { describe, expect, test } from "bun:test";
import {
  isClaudeInternalPlanPath,
  isObsidianPlanPath,
  normalizePathForMatch,
} from "../planPathMatchers";

describe("planPathMatchers", () => {
  test("normalizes windows path separators", () => {
    expect(normalizePathForMatch("F:\\Repo\\.claude\\plans\\x.md")).toBe(
      "f:/repo/.claude/plans/x.md"
    );
  });

  test("detects claude internal plan paths in unix/windows/relative formats", () => {
    expect(isClaudeInternalPlanPath("/repo/.claude/plans/test.md")).toBe(true);
    expect(isClaudeInternalPlanPath("F:\\repo\\.claude\\plans\\test.md")).toBe(true);
    expect(isClaudeInternalPlanPath(".claude/plans/test.md")).toBe(true);
    expect(isClaudeInternalPlanPath(".claude\\plans\\test.md")).toBe(true);
  });

  test("does not detect non-claude plan paths as internal", () => {
    expect(isClaudeInternalPlanPath("/repo/Plans/test.md")).toBe(false);
    expect(isClaudeInternalPlanPath("/repo/.obsidian/plans/test.md")).toBe(false);
  });

  test("matches obsidian plan directories by segment (not substring)", () => {
    const planDirs = [".obsidian/plans", "Plans", "plan"];

    expect(isObsidianPlanPath("/vault/Plans/my-plan.md", planDirs)).toBe(true);
    expect(isObsidianPlanPath("/vault/.obsidian/plans/setup.md", planDirs)).toBe(true);
    expect(isObsidianPlanPath("/vault/plan/today.md", planDirs)).toBe(true);
    expect(isObsidianPlanPath("/vault/planning/today.md", planDirs)).toBe(false);
  });

  test("never routes .claude/plans files to obsidian matcher", () => {
    const planDirs = [".obsidian/plans", "Plans", "plan"];
    expect(isObsidianPlanPath("F:\\repo\\.claude\\plans\\internal.md", planDirs)).toBe(false);
    expect(isObsidianPlanPath(".claude/plans/internal.md", planDirs)).toBe(false);
  });
});
