import { describe, expect, test } from "bun:test";
import healthHandler from "../hook-review/health";
import waitDecisionHandler from "../hook-review/wait-decision";

function createMockRequest(options: {
  method?: string;
  origin?: string;
  query?: Record<string, string>;
  body?: Record<string, unknown>;
}) {
  return {
    method: options.method || "GET",
    headers: {
      origin: options.origin || "https://r.alexdonega.com.br",
    },
    query: options.query || {},
    body: options.body || {},
  } as any;
}

function createMockResponse() {
  const headers: Record<string, string> = {};
  let statusCode = 200;
  let jsonBody: unknown = null;
  let ended = false;

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
    end() {
      ended = true;
      return response;
    },
    get statusCode() {
      return statusCode;
    },
    get jsonBody() {
      return jsonBody;
    },
    get ended() {
      return ended;
    },
  };

  return response as any;
}

describe("hook-review API", () => {
  test("GET /api/hook-review/health returns status ok", () => {
    const req = createMockRequest({ method: "GET" });
    const res = createMockResponse();

    healthHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect((res.jsonBody as any).status).toBe("ok");
    expect((res.jsonBody as any).mode).toBe("hook-review-remote");
  });

  test("wait-decision rejects invalid method", async () => {
    const req = createMockRequest({ method: "POST" });
    const res = createMockResponse();

    await waitDecisionHandler(req, res);

    expect(res.statusCode).toBe(405);
    expect((res.jsonBody as any).ok).toBe(false);
  });
});
