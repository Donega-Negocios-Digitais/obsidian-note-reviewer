import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handlePreflightRequest, setCorsHeaders } from "../../utils/cors";
import {
  getHookReviewDecision,
  getSessionBySessionIdAndKey,
  purgeExpiredHookReviewSessions,
} from "../_lib/hookReviewStore";

function pickQueryString(value: string | string[] | undefined): string {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return (value[0] || "").trim();
  return "";
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const origin = req.headers.origin;
  setCorsHeaders(res, origin);
  if (handlePreflightRequest(req.method, res)) return;

  if (req.method !== "GET") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    await purgeExpiredHookReviewSessions();

    const sessionId = pickQueryString(req.query.sessionId);
    const reviewKey = pickQueryString(req.query.reviewKey);
    const revisionId = pickQueryString(req.query.revisionId);

    if (!sessionId || !reviewKey || !revisionId) {
      res.status(400).json({
        ok: false,
        error: "sessionId, reviewKey and revisionId are required",
      });
      return;
    }

    const session = await getSessionBySessionIdAndKey({ sessionId, reviewKey });
    if (!session) {
      res.status(404).json({ ok: false, error: "Review session not found" });
      return;
    }

    const decision = await getHookReviewDecision({
      sessionRef: session.id,
      revisionId,
    });
    if (!decision) {
      res.status(204).end();
      return;
    }

    res.status(200).json({
      ok: true,
      revisionId: decision.revision_id,
      decision: decision.decision,
      feedback: decision.feedback || "",
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
}
