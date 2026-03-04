import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handlePreflightRequest, setCorsHeaders } from "../../../utils/cors.js";
import {
  purgeExpiredHookReviewSessions,
  resolveReviewAppBaseUrl,
  upsertHookReviewRevision,
} from "../../_lib/hookReviewStore.js";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  const origin = req.headers.origin;
  setCorsHeaders(res, origin);
  if (handlePreflightRequest(req.method, res)) return;

  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  try {
    await purgeExpiredHookReviewSessions();

    const sessionId = pickString(req.body?.sessionId);
    const reviewKey = pickString(req.body?.reviewKey);
    const workspaceHash = pickString(req.body?.workspaceHash);
    const revisionId = pickString(req.body?.revisionId);
    const filePath = pickString(req.body?.filePath);
    const content = pickString(req.body?.content);

    if (!sessionId || !reviewKey || !workspaceHash || !revisionId || !filePath || !content) {
      res.status(400).json({
        ok: false,
        error:
          "Missing required fields: sessionId, reviewKey, workspaceHash, revisionId, filePath, content",
      });
      return;
    }

    await upsertHookReviewRevision({
      sessionId,
      reviewKey,
      workspaceHash,
      revisionId,
      filePath,
      content,
    });

    const appBaseUrl = resolveReviewAppBaseUrl(req);
    const reviewUrl = `${appBaseUrl}/hook-review?${new URLSearchParams({
      sessionId,
      reviewKey,
      mode: "plan-live-review",
    }).toString()}`;

    res.status(200).json({
      ok: true,
      sessionId,
      revisionId,
      reviewUrl,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: error instanceof Error ? error.message : "Unexpected error",
    });
  }
}
