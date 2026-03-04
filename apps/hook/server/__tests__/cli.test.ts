import { describe, expect, test } from "bun:test";
import {
  commandRequiresHookPayload,
  getUsageText,
  normalizeCommand,
  shouldRefuseInteractiveHookCommand,
} from "../cli";

describe("cli command parsing", () => {
  test("supports meta commands", () => {
    expect(normalizeCommand("--help")).toBe("help");
    expect(normalizeCommand("--version")).toBe("version");
    expect(normalizeCommand("doctor")).toBe("doctor");
  });

  test("defaults to plan when no command is provided", () => {
    expect(normalizeCommand(undefined)).toBe("plan");
  });

  test("returns unknown for unsupported command", () => {
    expect(normalizeCommand("random-command")).toBe("unknown");
  });
});

describe("interactive hook payload guard", () => {
  test("flags hook commands in TTY mode", () => {
    expect(commandRequiresHookPayload("plan")).toBe(true);
    expect(commandRequiresHookPayload("plan-live")).toBe(true);
    expect(commandRequiresHookPayload("obsidian")).toBe(true);
    expect(shouldRefuseInteractiveHookCommand("plan", true)).toBe(true);
  });

  test("does not flag annotate/doctor/help in TTY mode", () => {
    expect(commandRequiresHookPayload("annotate")).toBe(false);
    expect(commandRequiresHookPayload("doctor")).toBe(false);
    expect(shouldRefuseInteractiveHookCommand("annotate", true)).toBe(false);
    expect(shouldRefuseInteractiveHookCommand("doctor", true)).toBe(false);
    expect(shouldRefuseInteractiveHookCommand("help", true)).toBe(false);
  });
});

describe("usage text", () => {
  test("mentions doctor and hook commands", () => {
    const usage = getUsageText();
    expect(usage).toContain("obsreview doctor");
    expect(usage).toContain("plan-live");
    expect(usage).toContain("annotate");
  });
});

