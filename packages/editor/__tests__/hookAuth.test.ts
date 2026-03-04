import { describe, expect, test } from "bun:test";
import { isHookAuthRequiredForRuntime } from "../hookAuth";

describe("hook auth mode", () => {
  test("runtime=hook does not require auth", () => {
    expect(
      isHookAuthRequiredForRuntime({
        runtime: "hook",
        sessionId: "s1",
        reviewKey: "k1",
      })
    ).toBe(false);
  });

  test("runtime=portal with session/review key requires auth", () => {
    expect(
      isHookAuthRequiredForRuntime({
        runtime: "portal",
        sessionId: "s1",
        reviewKey: "k1",
      })
    ).toBe(true);
  });

  test("runtime=portal without session credentials does not require auth gate", () => {
    expect(
      isHookAuthRequiredForRuntime({
        runtime: "portal",
        sessionId: "",
        reviewKey: "",
      })
    ).toBe(false);
  });
});
