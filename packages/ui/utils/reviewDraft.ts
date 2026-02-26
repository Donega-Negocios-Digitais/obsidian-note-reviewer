export interface ReviewDraftRecord {
  revisionId: string;
  filePath: string;
  workspaceId: string;
  content: string;
  updatedAt: string;
}

interface ReviewDraftKeyInput {
  revisionId: string | null;
  filePath?: string | null;
  workspaceId?: string | null;
}

const REVIEW_DRAFT_PREFIX = "obsreview-review-draft-v1";

function resolveWorkspaceId(workspaceId?: string | null): string {
  if (typeof workspaceId === "string" && workspaceId.trim()) {
    return workspaceId.trim();
  }

  if (typeof window === "undefined") {
    return "server";
  }

  return `${window.location.origin}${window.location.pathname}`;
}

function resolveFilePath(filePath?: string | null): string {
  if (typeof filePath === "string" && filePath.trim()) {
    return filePath.trim();
  }
  return "unknown-file";
}

export function buildReviewDraftKey(input: ReviewDraftKeyInput): string | null {
  if (!input.revisionId || !input.revisionId.trim()) {
    return null;
  }

  const workspace = encodeURIComponent(resolveWorkspaceId(input.workspaceId));
  const filePath = encodeURIComponent(resolveFilePath(input.filePath));
  const revisionId = encodeURIComponent(input.revisionId.trim());

  return `${REVIEW_DRAFT_PREFIX}:${workspace}:${filePath}:${revisionId}`;
}

export function saveReviewDraft(
  input: ReviewDraftKeyInput & { content: string }
): boolean {
  const key = buildReviewDraftKey(input);
  if (!key || typeof window === "undefined") return false;

  try {
    const payload: ReviewDraftRecord = {
      revisionId: input.revisionId as string,
      filePath: resolveFilePath(input.filePath),
      workspaceId: resolveWorkspaceId(input.workspaceId),
      content: input.content,
      updatedAt: new Date().toISOString(),
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
    return true;
  } catch {
    return false;
  }
}

export function loadReviewDraft(input: ReviewDraftKeyInput): ReviewDraftRecord | null {
  const key = buildReviewDraftKey(input);
  if (!key || typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ReviewDraftRecord>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      typeof parsed.content !== "string" ||
      typeof parsed.revisionId !== "string"
    ) {
      return null;
    }

    return {
      revisionId: parsed.revisionId,
      filePath: resolveFilePath(parsed.filePath),
      workspaceId: resolveWorkspaceId(parsed.workspaceId),
      content: parsed.content,
      updatedAt:
        typeof parsed.updatedAt === "string"
          ? parsed.updatedAt
          : new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function clearReviewDraft(input: ReviewDraftKeyInput): void {
  const key = buildReviewDraftKey(input);
  if (!key || typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore persistence errors
  }
}

