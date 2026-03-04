import type { VercelRequest, VercelResponse } from "@vercel/node";
import { handlePreflightRequest, setCorsHeaders } from "../../utils/cors.js";
import {
  getSessionBySessionIdAndKey,
  getHookReviewRevision,
  purgeExpiredHookReviewSessions,
  resolveAuthenticatedUser,
  resolveHookReviewUserOrg,
  saveHookReviewDecision,
  upsertHookReviewApprovedNote,
  type HookReviewDecision,
} from "../_lib/hookReviewStore.js";

function pickString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function isValidDecision(value: string): value is HookReviewDecision {
  return value === "approve" || value === "request_changes";
}

type AuthenticatedUser = {
  id: string;
  email: string | null;
};

type HookReviewDecisionDeps = {
  purgeExpiredHookReviewSessions: typeof purgeExpiredHookReviewSessions;
  resolveAuthenticatedUser: (
    req: VercelRequest
  ) => Promise<AuthenticatedUser | null>;
  getSessionBySessionIdAndKey: typeof getSessionBySessionIdAndKey;
  getHookReviewRevision: typeof getHookReviewRevision;
  resolveHookReviewUserOrg: typeof resolveHookReviewUserOrg;
  upsertHookReviewApprovedNote: typeof upsertHookReviewApprovedNote;
  saveHookReviewDecision: typeof saveHookReviewDecision;
};

const defaultDeps: HookReviewDecisionDeps = {
  purgeExpiredHookReviewSessions,
  resolveAuthenticatedUser,
  getSessionBySessionIdAndKey,
  getHookReviewRevision,
  resolveHookReviewUserOrg,
  upsertHookReviewApprovedNote,
  saveHookReviewDecision,
};

export function createDecisionHandler(deps: HookReviewDecisionDeps) {
  return async function handler(
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
      await deps.purgeExpiredHookReviewSessions();

      const user = await deps.resolveAuthenticatedUser(req);
      if (!user) {
        res.status(401).json({ ok: false, error: "Authentication required" });
        return;
      }

      const sessionId = pickString(req.body?.sessionId);
      const reviewKey = pickString(req.body?.reviewKey);
      const revisionId = pickString(req.body?.revisionId);
      const decision = pickString(req.body?.decision);
      const feedback = pickString(req.body?.feedback);

      if (!sessionId || !reviewKey || !revisionId || !isValidDecision(decision)) {
        res.status(400).json({
          ok: false,
          error: "Missing required fields or invalid decision",
        });
        return;
      }

      const session = await deps.getSessionBySessionIdAndKey({ sessionId, reviewKey });
      if (!session) {
        res.status(404).json({ ok: false, error: "Review session not found" });
        return;
      }

      let savedNote:
        | { noteId: string; title: string; savedAt: string }
        | null = null;
      if (decision === "approve") {
        try {
          console.info(
            "[HookReviewDecision] approve_save_started",
            JSON.stringify({ sessionId, revisionId })
          );
          const orgId = await deps.resolveHookReviewUserOrg({
            userId: user.id,
            email: user.email,
          });

          const revision = await deps.getHookReviewRevision({
            sessionRef: session.id,
            revisionId,
          });
          if (!revision) {
            res.status(409).json({
              ok: false,
              error: "Revision not found for save",
            });
            return;
          }

          savedNote = await deps.upsertHookReviewApprovedNote({
            sessionId,
            sessionRef: session.id,
            revisionId,
            userId: user.id,
            orgId,
          });
          console.info(
            "[HookReviewDecision] approve_save_succeeded",
            JSON.stringify({
              sessionId,
              revisionId,
              savedNoteId: savedNote.noteId,
            })
          );
        } catch (saveError) {
          const message =
            saveError instanceof Error
              ? saveError.message
              : "Failed to save approved note";
          console.error(
            "[HookReviewDecision] approve_save_failed",
            JSON.stringify({ sessionId, revisionId, error: message })
          );
          res.status(409).json({
            ok: false,
            error: `Falha ao salvar nota aprovada no app: ${message}`,
          });
          return;
        }
      }

      await deps.saveHookReviewDecision({
        sessionRef: session.id,
        revisionId,
        decision,
        feedback,
        decidedBy: user.id,
      });

      res.status(200).json({
        ok: true,
        sessionId,
        revisionId,
        decision,
        ...(savedNote
          ? {
              savedToApp: true,
              savedNoteId: savedNote.noteId,
              savedNoteTitle: savedNote.title,
              savedAt: savedNote.savedAt,
            }
          : {}),
      });
    } catch (error) {
      res.status(500).json({
        ok: false,
        error: error instanceof Error ? error.message : "Unexpected error",
      });
    }
  };
}

const handler = createDecisionHandler(defaultDeps);

export default handler;
