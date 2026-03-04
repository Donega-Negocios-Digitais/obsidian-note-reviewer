import { describe, expect, test } from "bun:test";
import { analyzeTranscriptForMissingPlanWrite } from "../planStopGuard";

function buildJsonl(lines: unknown[]): string {
  return lines.map((line) => JSON.stringify(line)).join("\n");
}

describe("planStopGuard", () => {
  test("blocks plan prompt without Write in /.claude/plans", () => {
    const transcript = buildJsonl([
      {
        type: "user",
        uuid: "u1",
        isMeta: false,
        message: {
          role: "user",
          content: "Crie um plano de 2 passos para X, sem implementar.",
        },
      },
      {
        type: "assistant",
        uuid: "a1",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Plano em 2 passos..." }],
        },
      },
    ]);

    const result = analyzeTranscriptForMissingPlanWrite(transcript);
    expect(result.isPlanPrompt).toBe(true);
    expect(result.hasPlanWrite).toBe(false);
    expect(result.shouldBlock).toBe(true);
  });

  test("allows when plan Write was used in /.claude/plans", () => {
    const transcript = buildJsonl([
      {
        type: "user",
        uuid: "u2",
        isMeta: false,
        message: {
          role: "user",
          content: "Create a 3-step plan without implementing.",
        },
      },
      {
        type: "assistant",
        uuid: "a2",
        message: {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "tool-write-ok",
              name: "Write",
              input: {
                file_path: "F:/repo/.claude/plans/test-plan.md",
                content: "# Plan",
              },
            },
          ],
        },
      },
      {
        type: "user",
        uuid: "u2r",
        message: {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "tool-write-ok",
              is_error: false,
              content: "Wrote file",
            },
          ],
        },
      },
      {
        type: "assistant",
        uuid: "a3",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Saved plan and summarized." }],
        },
      },
    ]);

    const result = analyzeTranscriptForMissingPlanWrite(transcript);
    expect(result.isPlanPrompt).toBe(true);
    expect(result.hasPlanWrite).toBe(true);
    expect(result.shouldBlock).toBe(false);
  });

  test("blocks when Write exists but failed", () => {
    const transcript = buildJsonl([
      {
        type: "user",
        uuid: "u4",
        isMeta: false,
        message: {
          role: "user",
          content: "Crie um plano de 2 passos sem implementar.",
        },
      },
      {
        type: "assistant",
        uuid: "a4",
        message: {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "tool-write-fail",
              name: "Write",
              input: {
                file_path: "F:/repo/.claude/plans/falha.md",
                content: "# Plano",
              },
            },
          ],
        },
      },
      {
        type: "user",
        uuid: "u4r",
        message: {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "tool-write-fail",
              is_error: true,
              content: "<tool_use_error>fail</tool_use_error>",
            },
          ],
        },
      },
    ]);

    const result = analyzeTranscriptForMissingPlanWrite(transcript);
    expect(result.isPlanPrompt).toBe(true);
    expect(result.hasPlanWrite).toBe(false);
    expect(result.shouldBlock).toBe(true);
  });

  test("allows when Bash writes to .claude/plans successfully", () => {
    const transcript = buildJsonl([
      {
        type: "user",
        uuid: "u5",
        isMeta: false,
        message: {
          role: "user",
          content: "Crie um plano de 2 passos sem implementar.",
        },
      },
      {
        type: "assistant",
        uuid: "a5",
        message: {
          role: "assistant",
          content: [
            {
              type: "tool_use",
              id: "tool-bash-ok",
              name: "Bash",
              input: {
                command:
                  "cat > \"F:/repo/.claude/plans/ok.md\" << 'EOF'\n# Plano\nEOF",
              },
            },
          ],
        },
      },
      {
        type: "user",
        uuid: "u5r",
        message: {
          role: "user",
          content: [
            {
              type: "tool_result",
              tool_use_id: "tool-bash-ok",
              is_error: false,
              content: "ok",
            },
          ],
        },
      },
    ]);

    const result = analyzeTranscriptForMissingPlanWrite(transcript);
    expect(result.isPlanPrompt).toBe(true);
    expect(result.hasPlanWrite).toBe(true);
    expect(result.shouldBlock).toBe(false);
  });

  test("does not block non-plan prompts", () => {
    const transcript = buildJsonl([
      {
        type: "user",
        uuid: "u3",
        isMeta: false,
        message: {
          role: "user",
          content: "Explique esse erro de build.",
        },
      },
      {
        type: "assistant",
        uuid: "a4",
        message: {
          role: "assistant",
          content: [{ type: "text", text: "Aqui esta a explicacao..." }],
        },
      },
    ]);

    const result = analyzeTranscriptForMissingPlanWrite(transcript);
    expect(result.isPlanPrompt).toBe(false);
    expect(result.shouldBlock).toBe(false);
  });
});
