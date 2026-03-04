import { describe, expect, test } from "bun:test";
import {
  canFallbackToLegacyDecision,
  resolvePlanLiveApproveNotice,
  resolvePlanLiveApproveRedirect,
  shouldTrySessionDecision,
} from "../decisionRouting";

describe("decision routing", () => {
  test("tries session decision in plan-live mode", () => {
    expect(
      shouldTrySessionDecision({
        isApiMode: true,
        isAnnotateMode: false,
        isPlanLiveMode: true,
        revisionId: null,
      })
    ).toBe(true);
  });

  test("tries session decision in API mode when revisionId exists", () => {
    expect(
      shouldTrySessionDecision({
        isApiMode: true,
        isAnnotateMode: false,
        isPlanLiveMode: false,
        revisionId: "rev-1",
      })
    ).toBe(true);
  });

  test("does not try session decision for annotate mode", () => {
    expect(
      shouldTrySessionDecision({
        isApiMode: true,
        isAnnotateMode: true,
        isPlanLiveMode: false,
        revisionId: "rev-1",
      })
    ).toBe(false);
  });

  test("legacy fallback only for 404/405", () => {
    expect(canFallbackToLegacyDecision(404)).toBe(true);
    expect(canFallbackToLegacyDecision(405)).toBe(true);
    expect(canFallbackToLegacyDecision(400)).toBe(false);
    expect(canFallbackToLegacyDecision(null)).toBe(false);
  });

  test("remote approve notice confirms save when payload indicates persistence", () => {
    expect(
      resolvePlanLiveApproveNotice({
        isRemoteHookReview: true,
        response: { savedToApp: true },
      })
    ).toBe("Aprovação enviada e nota salva em Meus Documentos.");
  });

  test("local approve notice remains generic", () => {
    expect(
      resolvePlanLiveApproveNotice({
        isRemoteHookReview: false,
        response: { savedToApp: true },
      })
    ).toBe("Aprovação enviada para o Claude.");
  });

  test("remote approve redirects to saved note when id exists", () => {
    expect(
      resolvePlanLiveApproveRedirect({
        isRemoteHookReview: true,
        response: { savedNoteId: "note-123" },
      })
    ).toBe("/editor?document=note-123");
  });

  test("remote approve redirects to editor when note id is missing", () => {
    expect(
      resolvePlanLiveApproveRedirect({
        isRemoteHookReview: true,
        response: null,
      })
    ).toBe("/editor");
  });

  test("local approve has no redirect", () => {
    expect(
      resolvePlanLiveApproveRedirect({
        isRemoteHookReview: false,
        response: { savedNoteId: "note-123" },
      })
    ).toBeNull();
  });
});
