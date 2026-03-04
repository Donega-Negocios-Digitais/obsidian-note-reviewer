import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handlePreflightRequest, setCorsHeaders } from "../../utils/cors";
import {
  getLatestHookReviewRevision,
  getSessionBySessionIdAndKey,
  purgeExpiredHookReviewSessions,
  resolveAuthenticatedUser,
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

    const user = await resolveAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({ ok: false, error: "Authentication required" });
      return;
    }

    const sessionId = pickQueryString(req.query.sessionId);
    const reviewKey = pickQueryString(req.query.reviewKey);
    const sinceRevision = pickQueryString(req.query.sinceRevision);

    if (!sessionId || !reviewKey) {
      res.status(400).json({ ok: false, error: "sessionId and reviewKey are required" });
      return;
    }

    const session = await getSessionBySessionIdAndKey({ sessionId, reviewKey });
    if (!session) {
      res.status(404).json({ ok: false, error: "Review session not found" });
      return;
    }

    const revision = await getLatestHookReviewRevision({ sessionRef: session.id });
    if (!revision) {
      res.status(204).end();
      return;
    }

    if (sinceRevision && sinceRevision === revision.revision_id) {
      res.status(204).end();
      return;
    }

    res.status(200).json({
      plan: revision.content,
      content: revision.content,
      filePath: revision.file_path,
      mode: "plan-live-review",
      origin: "claude-code",
      sessionId: session.session_id,
      revisionId: revision.revision_id,
      updatedAt: revision.created_at,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
}
