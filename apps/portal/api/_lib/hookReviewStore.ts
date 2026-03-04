import type { VercelRequest } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

export type HookReviewDecision = "approve" | "request_changes";

export interface HookReviewRevisionPayload {
  sessionId: string;
  reviewKey: string;
  workspaceHash: string;
  revisionId: string;
  filePath: string;
  content: string;
}

export interface HookReviewSessionRecord {
  id: string;
  session_id: string;
  review_key_hash: string;
  workspace_hash: string;
  status: string;
  expires_at: string;
}

export interface HookReviewRevisionRecord {
  session_ref: string;
  revision_id: string;
  file_path: string;
  content: string;
  created_at: string;
}

interface HookReviewDecisionRow {
  session_ref: string;
  revision_id: string;
  decision: HookReviewDecision;
  feedback: string | null;
  decided_by: string | null;
  created_at: string;
}

interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
}

const SESSION_TTL_HOURS = Number(process.env.HOOK_REVIEW_SESSION_TTL_HOURS || "24");
const HOOK_REVIEW_NOTE_PREFIX = "hook-review-session";

let cachedConfig: SupabaseConfig | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function addHoursIso(hours: number): string {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}

function hashValue(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function sanitizeToken(value: string): string {
  const normalized = value.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-");
  return normalized.replace(/-+/g, "-").replace(/^-|-$/g, "") || "session";
}

function titleFromMarkdown(content: string, filePath: string): string {
  const heading = content.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;

  const fileName = filePath
    .replace(/\\/g, "/")
    .split("/")
    .filter(Boolean)
    .pop();
  const fallbackName = fileName ? fileName.replace(/\.md$/i, "") : "";
  return fallbackName || "Revisão de Plano";
}

function buildHookReviewSourcePath(sessionId: string): string {
  return `hook-review/session-${sanitizeToken(sessionId)}.md`;
}

function buildHookReviewSlug(sessionId: string): string {
  return `${HOOK_REVIEW_NOTE_PREFIX}-${sanitizeToken(sessionId)}`;
}

function readSupabaseConfig(): SupabaseConfig {
  if (cachedConfig) return cachedConfig;

  const url =
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    "";
  const anonKey =
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    "";
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "";

  if (!url || !anonKey || !serviceRoleKey) {
    throw new Error(
      "Missing Supabase config for hook-review API (SUPABASE_URL/VITE_SUPABASE_URL, SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY)."
    );
  }

  cachedConfig = { url, anonKey, serviceRoleKey };
  return cachedConfig;
}

function getClients() {
  const cfg = readSupabaseConfig();
  const service = createClient(cfg.url, cfg.serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const anon = createClient(cfg.url, cfg.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return { service, anon };
}

function extractBearerToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== "string") return null;
  const [scheme, token] = authHeader.split(" ");
  if (!scheme || !token) return null;
  if (scheme.toLowerCase() !== "bearer") return null;
  return token.trim() || null;
}

export async function resolveAuthenticatedUser(req: VercelRequest): Promise<{
  id: string;
  email: string | null;
} | null> {
  const token = extractBearerToken(req);
  if (!token) return null;

  const { anon } = getClients();
  const { data, error } = await anon.auth.getUser(token);
  if (error || !data.user) return null;

  return {
    id: data.user.id,
    email: data.user.email || null,
  };
}

export function resolveReviewAppBaseUrl(req: VercelRequest): string {
  const configured = process.env.OBSREVIEW_REVIEW_APP_URL || process.env.VITE_APP_URL;
  if (configured && configured.trim()) {
    return configured.trim().replace(/\/$/, "");
  }

  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || "https";
  if (typeof host === "string" && host.trim()) {
    return `${proto}://${host}`.replace(/\/$/, "");
  }
  return "https://r.alexdonega.com.br";
}

export async function purgeExpiredHookReviewSessions(): Promise<void> {
  const { service } = getClients();
  await service
    .from("hook_review_sessions")
    .delete()
    .lt("expires_at", nowIso());
}

async function upsertSession(args: {
  sessionId: string;
  reviewKey: string;
  workspaceHash: string;
}): Promise<HookReviewSessionRecord> {
  const { service } = getClients();
  const record = {
    session_id: args.sessionId,
    review_key_hash: hashValue(args.reviewKey),
    workspace_hash: args.workspaceHash,
    status: "active",
    expires_at: addHoursIso(SESSION_TTL_HOURS),
    updated_at: nowIso(),
  };

  const { data, error } = await service
    .from("hook_review_sessions")
    .upsert(record, { onConflict: "session_id" })
    .select("id,session_id,review_key_hash,workspace_hash,status,expires_at")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "Failed to upsert hook review session");
  }

  return data as HookReviewSessionRecord;
}

export async function getSessionBySessionIdAndKey(args: {
  sessionId: string;
  reviewKey: string;
}): Promise<HookReviewSessionRecord | null> {
  const { service } = getClients();
  const reviewKeyHash = hashValue(args.reviewKey);

  const { data, error } = await service
    .from("hook_review_sessions")
    .select("id,session_id,review_key_hash,workspace_hash,status,expires_at")
    .eq("session_id", args.sessionId)
    .eq("review_key_hash", reviewKeyHash)
    .maybeSingle();

  if (error || !data) return null;
  if (!data.expires_at || Date.parse(data.expires_at) < Date.now()) return null;
  return data as HookReviewSessionRecord;
}

export async function upsertHookReviewRevision(
  payload: HookReviewRevisionPayload
): Promise<{
  sessionId: string;
  revisionId: string;
  reviewUrl: string;
}> {
  const session = await upsertSession({
    sessionId: payload.sessionId,
    reviewKey: payload.reviewKey,
    workspaceHash: payload.workspaceHash,
  });
  const { service } = getClients();
  const now = nowIso();

  const revisionRecord = {
    session_ref: session.id,
    revision_id: payload.revisionId,
    file_path: payload.filePath,
    content: payload.content,
    created_at: now,
  };

  const { error } = await service
    .from("hook_review_revisions")
    .upsert(revisionRecord, { onConflict: "revision_id" });
  if (error) {
    throw new Error(error.message || "Failed to upsert hook review revision");
  }

  await service
    .from("hook_review_sessions")
    .update({
      updated_at: now,
      expires_at: addHoursIso(SESSION_TTL_HOURS),
      status: "active",
    })
    .eq("id", session.id);

  return {
    sessionId: session.session_id,
    revisionId: payload.revisionId,
    reviewUrl: "",
  };
}

export async function getLatestHookReviewRevision(args: {
  sessionRef: string;
}): Promise<HookReviewRevisionRecord | null> {
  const { service } = getClients();
  const { data, error } = await service
    .from("hook_review_revisions")
    .select("session_ref,revision_id,file_path,content,created_at")
    .eq("session_ref", args.sessionRef)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;
  return data as HookReviewRevisionRecord;
}

export async function getHookReviewRevision(args: {
  sessionRef: string;
  revisionId: string;
}): Promise<HookReviewRevisionRecord | null> {
  const { service } = getClients();
  const { data, error } = await service
    .from("hook_review_revisions")
    .select("session_ref,revision_id,file_path,content,created_at")
    .eq("session_ref", args.sessionRef)
    .eq("revision_id", args.revisionId)
    .maybeSingle();

  if (error || !data) return null;
  return data as HookReviewRevisionRecord;
}

export async function resolveHookReviewUserOrg(args: {
  userId: string;
  email: string | null;
}): Promise<string> {
  const { service } = getClients();

  const { data: byId, error: byIdError } = await service
    .from("users")
    .select("org_id,email")
    .eq("id", args.userId)
    .maybeSingle();

  if (byIdError) {
    throw new Error(byIdError.message || "Failed to resolve user organization");
  }

  if (typeof byId?.org_id === "string" && byId.org_id.trim().length > 0) {
    return byId.org_id;
  }

  const fallbackEmail = (args.email || byId?.email || "").trim().toLowerCase();
  if (!fallbackEmail) {
    throw new Error("Authenticated user is missing organization");
  }

  const { data: byEmail, error: byEmailError } = await service
    .from("users")
    .select("org_id")
    .eq("email", fallbackEmail)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (byEmailError) {
    throw new Error(byEmailError.message || "Failed to resolve user organization");
  }

  const row = Array.isArray(byEmail) && byEmail.length > 0 ? byEmail[0] : null;
  if (typeof row?.org_id === "string" && row.org_id.trim().length > 0) {
    return row.org_id;
  }

  throw new Error("Authenticated user is missing organization");
}

export interface HookReviewApprovedNoteResult {
  noteId: string;
  title: string;
  savedAt: string;
}

export async function upsertHookReviewApprovedNote(args: {
  sessionId: string;
  sessionRef: string;
  revisionId: string;
  userId: string;
  orgId: string;
}): Promise<HookReviewApprovedNoteResult> {
  const { service } = getClients();
  const revision = await getHookReviewRevision({
    sessionRef: args.sessionRef,
    revisionId: args.revisionId,
  });
  if (!revision) {
    throw new Error("Revision not found for the provided session");
  }

  const sourcePath = buildHookReviewSourcePath(args.sessionId);
  const slug = buildHookReviewSlug(args.sessionId);
  const title = titleFromMarkdown(revision.content, revision.file_path);
  const savedAt = nowIso();

  const { data: existingNote, error: existingNoteError } = await service
    .from("notes")
    .select("id,title")
    .eq("org_id", args.orgId)
    .eq("source_path", sourcePath)
    .maybeSingle();
  if (existingNoteError) {
    throw new Error(existingNoteError.message || "Failed to query existing review note");
  }

  if (existingNote?.id) {
    const { data: updated, error: updateError } = await service
      .from("notes")
      .update({
        title,
        content: revision.content,
        markdown: revision.content,
        updated_by: args.userId,
        updated_at: savedAt,
        deleted_at: null,
        is_archived: false,
      })
      .eq("id", existingNote.id)
      .select("id,title,updated_at")
      .single();

    if (updateError || !updated) {
      throw new Error(updateError?.message || "Failed to update review note");
    }

    return {
      noteId: updated.id as string,
      title: (updated.title as string) || title,
      savedAt: (updated.updated_at as string) || savedAt,
    };
  }

  const { data: inserted, error: insertError } = await service
    .from("notes")
    .insert({
      org_id: args.orgId,
      slug,
      title,
      content: revision.content,
      markdown: revision.content,
      source_path: sourcePath,
      created_by: args.userId,
      updated_by: args.userId,
      is_archived: false,
      deleted_at: null,
    })
    .select("id,title,updated_at")
    .single();

  if (insertError || !inserted) {
    throw new Error(insertError?.message || "Failed to insert review note");
  }

  return {
    noteId: inserted.id as string,
    title: (inserted.title as string) || title,
    savedAt: (inserted.updated_at as string) || savedAt,
  };
}

export async function saveHookReviewDecision(args: {
  sessionRef: string;
  revisionId: string;
  decision: HookReviewDecision;
  feedback: string;
  decidedBy: string;
}): Promise<void> {
  const { service } = getClients();

  const { data: revisionRow, error: revisionError } = await service
    .from("hook_review_revisions")
    .select("session_ref,revision_id")
    .eq("session_ref", args.sessionRef)
    .eq("revision_id", args.revisionId)
    .maybeSingle();

  if (revisionError || !revisionRow) {
    throw new Error("Revision not found for the provided session");
  }

  const decisionRecord = {
    session_ref: args.sessionRef,
    revision_id: args.revisionId,
    decision: args.decision,
    feedback: args.feedback,
    decided_by: args.decidedBy,
    created_at: nowIso(),
  };
  const { error } = await service
    .from("hook_review_decisions")
    .upsert(decisionRecord, { onConflict: "revision_id" });
  if (error) {
    throw new Error(error.message || "Failed to save decision");
  }

  await service
    .from("hook_review_sessions")
    .update({
      updated_at: nowIso(),
      expires_at: addHoursIso(SESSION_TTL_HOURS),
    })
    .eq("id", args.sessionRef);
}

export async function getHookReviewDecision(args: {
  sessionRef: string;
  revisionId: string;
}): Promise<HookReviewDecisionRow | null> {
  const { service } = getClients();
  const { data, error } = await service
    .from("hook_review_decisions")
    .select("session_ref,revision_id,decision,feedback,decided_by,created_at")
    .eq("session_ref", args.sessionRef)
    .eq("revision_id", args.revisionId)
    .maybeSingle();

  if (error || !data) return null;
  return data as HookReviewDecisionRow;
}
