import { describe, test, expect } from "bun:test";
import {
  buildApprovedHookOutput,
  buildBlockedHookOutput,
  isClaudePlanPath,
  parsePlanLiveEvent,
  resolveBunExecutablePath,
} from "../planLiveHook";

describe("planLiveHook", () => {
  describe("isClaudePlanPath", () => {
    test("detects unix .claude/plans path", () => {
      expect(isClaudePlanPath("/repo/.claude/plans/test.md")).toBe(true);
    });

    test("detects windows .claude/plans path", () => {
      expect(
        isClaudePlanPath("F:\\repo\\.claude\\plans\\test.md")
      ).toBe(true);
    });

    test("detects relative .claude/plans path", () => {
      expect(isClaudePlanPath(".claude\\plans\\test.md")).toBe(true);
      expect(isClaudePlanPath(".claude/plans/test.md")).toBe(true);
    });

    test("ignores non-claude plan paths", () => {
      expect(isClaudePlanPath("/repo/Plans/test.md")).toBe(false);
      expect(isClaudePlanPath("/repo/.obsidian/plans/test.md")).toBe(false);
    });
  });

  describe("parsePlanLiveEvent", () => {
    test("parses valid write event", () => {
      const parsed = parsePlanLiveEvent(
        JSON.stringify({
          tool_name: "Write",
          tool_input: {
            file_path: "/repo/.claude/plans/feature.md",
            content: "# Plano\n\n1. A",
          },
        })
      );

      expect(parsed).not.toBeNull();
      expect(parsed?.filePath).toBe("/repo/.claude/plans/feature.md");
      expect(parsed?.content).toContain("# Plano");
    });

    test("returns null for other writes", () => {
      const parsed = parsePlanLiveEvent(
        JSON.stringify({
          tool_name: "Write",
          tool_input: {
            file_path: "/repo/Plans/feature.md",
            content: "# Plano",
          },
        })
      );

      expect(parsed).toBeNull();
    });
  });

  describe("hook output builders", () => {
    test("buildApprovedHookOutput returns PostToolUse approved payload", () => {
      const payload = JSON.parse(
        buildApprovedHookOutput({
          filePath: "/repo/.claude/plans/test.md",
          sessionId: "sess-1",
          revisionId: "rev-1",
        })
      ) as {
        hookSpecificOutput: {
          result: string;
          hookEventName: string;
        };
      };

      expect(payload.hookSpecificOutput.hookEventName).toBe("PostToolUse");
      expect(payload.hookSpecificOutput.result).toBe("PLAN_LIVE_APPROVED");
    });

    test("buildBlockedHookOutput returns block payload with feedback", () => {
      const payload = JSON.parse(
        buildBlockedHookOutput({
          filePath: "/repo/.claude/plans/test.md",
          sessionId: "sess-1",
          revisionId: "rev-1",
          feedback: "Atualize o passo 2",
        })
      ) as {
        decision: string;
        hookSpecificOutput: {
          result: string;
          feedback: string;
        };
      };

      expect(payload.decision).toBe("block");
      expect(payload.hookSpecificOutput.result).toBe(
        "PLAN_LIVE_CHANGES_REQUESTED"
      );
      expect(payload.hookSpecificOutput.feedback).toContain("passo 2");
    });
  });

  describe("resolveBunExecutablePath", () => {
    test("uses process.execPath when it points to bun.exe", () => {
      expect(resolveBunExecutablePath("C:\\Program Files\\Bun\\bun.exe")).toBe(
        "C:\\Program Files\\Bun\\bun.exe"
      );
    });

    test("falls back to bun command when execPath is not bun", () => {
      expect(resolveBunExecutablePath("C:\\Program Files\\nodejs\\node.exe")).toBe(
        "bun"
      );
    });
  });
});
