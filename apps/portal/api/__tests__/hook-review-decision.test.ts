import { describe, expect, test } from "bun:test";
import { createDecisionHandler } from "../hook-review/decision";

function createMockRequest(options: {
  method?: string;
  origin?: string;
  body?: Record<string, unknown>;
}) {
  return {
    method: options.method || "POST",
    headers: {
      origin: options.origin || "https://r.alexdonega.com.br",
    },
    body: options.body || {},
  } as any;
}

function createMockResponse() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let jsonBody: unknown = null;

  const response = {
    headers,
    setHeader(name: string, value: string) {
      headers[name] = value;
      return response;
    },
    status(code: number) {
      statusCode = code;
      return response;
    },
    json(payload: unknown) {
      jsonBody = payload;
      return response;
    },
    get statusCode() {
      return statusCode;
    },
    get jsonBody() {
      return jsonBody;
    },
  };

  return response as any;
}

describe("hook-review decision API", () => {
  test("approve saves note before decision and returns save metadata", async () => {
    const calls = {
      saveDecision: 0,
      saveApprovedNote: 0,
    };
    const handler = createDecisionHandler({
      purgeExpiredHookReviewSessions: async () => {},
      resolveAuthenticatedUser: async () => ({
        id: "user-1",
        email: "user@acme.com",
        accessToken: "token-1",
      }),
      getSessionBySessionIdAndKey: async () =>
        ({
          id: "session-ref-1",
          session_id: "session-1",
          review_key_hash: "hash",
          workspace_hash: "workspace",
          status: "active",
          expires_at: new Date(Date.now() + 60_000).toISOString(),
        }),
      getHookReviewRevision: async () =>
        ({
          session_ref: "session-ref-1",
          revision_id: "revision-1",
          file_path: "/tmp/plan.md",
          content: "# Plano\n\nConteúdo",
          created_at: new Date().toISOString(),
        }),
      resolveHookReviewUserOrg: async () => "org-1",
      upsertHookReviewApprovedNote: async () => {
        calls.saveApprovedNote += 1;
        return {
          noteId: "note-1",
          title: "Plano",
          savedAt: "2026-03-03T00:00:00.000Z",
        };
      },
      saveHookReviewDecision: async () => {
        calls.saveDecision += 1;
      },
    });

    const req = createMockRequest({
      body: {
        sessionId: "session-1",
        reviewKey: "review-key",
        revisionId: "revision-1",
        decision: "approve",
        feedback: "",
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect((res.jsonBody as any).ok).toBe(true);
    expect((res.jsonBody as any).savedToApp).toBe(true);
    expect((res.jsonBody as any).savedNoteId).toBe("note-1");
    expect(calls.saveApprovedNote).toBe(1);
    expect(calls.saveDecision).toBe(1);
  });

  test("request_changes does not trigger app auto-save", async () => {
    const calls = {
      saveDecision: 0,
      saveApprovedNote: 0,
    };
    const handler = createDecisionHandler({
      purgeExpiredHookReviewSessions: async () => {},
      resolveAuthenticatedUser: async () => ({
        id: "user-1",
        email: "user@acme.com",
        accessToken: "token-1",
      }),
      getSessionBySessionIdAndKey: async () =>
        ({
          id: "session-ref-1",
          session_id: "session-1",
          review_key_hash: "hash",
          workspace_hash: "workspace",
          status: "active",
          expires_at: new Date(Date.now() + 60_000).toISOString(),
        }),
      getHookReviewRevision: async () => null,
      resolveHookReviewUserOrg: async () => "org-1",
      upsertHookReviewApprovedNote: async () => {
        calls.saveApprovedNote += 1;
        return {
          noteId: "note-1",
          title: "Plano",
          savedAt: "2026-03-03T00:00:00.000Z",
        };
      },
      saveHookReviewDecision: async () => {
        calls.saveDecision += 1;
      },
    });

    const req = createMockRequest({
      body: {
        sessionId: "session-1",
        reviewKey: "review-key",
        revisionId: "revision-1",
        decision: "request_changes",
        feedback: "ajustar",
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(200);
    expect((res.jsonBody as any).decision).toBe("request_changes");
    expect((res.jsonBody as any).savedToApp).toBeUndefined();
    expect(calls.saveApprovedNote).toBe(0);
    expect(calls.saveDecision).toBe(1);
  });

  test("approve returns conflict and does not persist decision when save fails", async () => {
    const calls = {
      saveDecision: 0,
    };
    const handler = createDecisionHandler({
      purgeExpiredHookReviewSessions: async () => {},
      resolveAuthenticatedUser: async () => ({
        id: "user-1",
        email: "user@acme.com",
        accessToken: "token-1",
      }),
      getSessionBySessionIdAndKey: async () =>
        ({
          id: "session-ref-1",
          session_id: "session-1",
          review_key_hash: "hash",
          workspace_hash: "workspace",
          status: "active",
          expires_at: new Date(Date.now() + 60_000).toISOString(),
        }),
      getHookReviewRevision: async () =>
        ({
          session_ref: "session-ref-1",
          revision_id: "revision-1",
          file_path: "/tmp/plan.md",
          content: "# Plano\n\nConteúdo",
          created_at: new Date().toISOString(),
        }),
      resolveHookReviewUserOrg: async () => "org-1",
      upsertHookReviewApprovedNote: async () => {
        throw new Error("DB unavailable");
      },
      saveHookReviewDecision: async () => {
        calls.saveDecision += 1;
      },
    });

    const req = createMockRequest({
      body: {
        sessionId: "session-1",
        reviewKey: "review-key",
        revisionId: "revision-1",
        decision: "approve",
        feedback: "",
      },
    });
    const res = createMockResponse();

    await handler(req, res);

    expect(res.statusCode).toBe(409);
    expect((res.jsonBody as any).ok).toBe(false);
    expect((res.jsonBody as any).error).toContain("Falha ao salvar nota aprovada no app");
    expect(calls.saveDecision).toBe(0);
  });
});

