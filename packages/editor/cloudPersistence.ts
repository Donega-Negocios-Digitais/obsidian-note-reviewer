import { Annotation, AnnotationType } from '@obsidian-note-reviewer/ui/types';
import { getDisplayName } from '@obsidian-note-reviewer/ui/utils/storage';

type SupabaseClientLike = {
  auth: {
    getUser: () => Promise<{ data?: { user?: any | null } }>;
  };
  from: (table: string) => any;
};

interface CloudProfile {
  id: string;
  orgId: string | null;
  name: string;
  avatarUrl: string | null;
}

interface CloudNote {
  id: string;
}

export interface CommentFeedItem {
  annotationId: string;
  threadId: string;
  commentId: string;
  text: string;
  authorName: string;
  authorAvatar: string | null;
  createdAt: string;
}

export interface LoadedCloudState {
  profile: CloudProfile | null;
  note: CloudNote | null;
  annotations: Annotation[];
  comments: CommentFeedItem[];
}

const COMMENT_TYPES = new Set<AnnotationType>([AnnotationType.COMMENT, AnnotationType.GLOBAL_COMMENT]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function safeDateToEpoch(value: unknown): number | undefined {
  if (!value) return undefined;
  const date = new Date(String(value));
  const epoch = date.getTime();
  return Number.isNaN(epoch) ? undefined : epoch;
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(36);
}

function sanitizeSlug(value: string): string {
  const slug = value
    .replace(/\\/g, '/')
    .replace(/[^a-zA-Z0-9/_-]/g, '-')
    .replace(/\/+/g, '/')
    .replace(/\/|_/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  return slug || 'note';
}

function buildSlugFromPath(sourcePath: string): string {
  const normalized = sanitizeSlug(sourcePath);
  const suffix = hashString(sourcePath);
  const prefix = normalized.slice(0, 90);
  return `${prefix}-${suffix}`;
}

function extractTitle(markdown: string, sourcePath: string): string {
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1]?.trim();
  if (heading) return heading;

  const name = sourcePath.split('/').pop() || sourcePath;
  return name.replace(/\.md$/i, '') || 'Nota';
}

function isMissingColumnError(error: unknown, column: string): boolean {
  const message = String((error as any)?.message || '').toLowerCase();
  return message.includes('column') && message.includes(column.toLowerCase()) && message.includes('does not exist');
}

function isOnConflictConstraintError(error: unknown): boolean {
  const message = String((error as any)?.message || '').toLowerCase();
  return message.includes('on conflict') && message.includes('constraint');
}

function buildThreadId(): string {
  return `thread_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function buildCommentId(): string {
  return `comment_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function metadataFromAnnotation(annotation: Annotation): Record<string, unknown> {
  const deletedAtIso = annotation.deletedAt ? new Date(annotation.deletedAt).toISOString() : null;
  return {
    client_id: annotation.id,
    author: annotation.author ?? null,
    is_global: annotation.isGlobal ?? annotation.type === AnnotationType.GLOBAL_COMMENT,
    image_id: annotation.imageId ?? null,
    image_strokes: annotation.imageStrokes ?? null,
    thread_id: annotation.threadId ?? null,
    comment_id: annotation.commentId ?? null,
    status: annotation.status ?? null,
    resolved_at: annotation.resolvedAt ? new Date(annotation.resolvedAt).toISOString() : null,
    resolved_by: annotation.resolvedBy ?? null,
    deleted_at: deletedAtIso,
    data_json: annotation.imageStrokes ?? null,
    rendered_image_url: annotation.renderedImageUrl ?? null,
  };
}

function parseType(value: unknown): AnnotationType {
  if (typeof value !== 'string') return AnnotationType.COMMENT;
  if (value in AnnotationType) {
    return AnnotationType[value as keyof typeof AnnotationType];
  }
  if ((Object.values(AnnotationType) as string[]).includes(value)) {
    return value as AnnotationType;
  }
  return AnnotationType.COMMENT;
}

export function normalizeNoteSourcePath(notePath: string): string {
  return notePath
    .replace(/\\/g, '/')
    .replace(/\/+/g, '/')
    .trim();
}

async function resolveCloudProfile(client: SupabaseClientLike): Promise<CloudProfile | null> {
  const authResponse = await client.auth.getUser();
  const user = authResponse?.data?.user;
  if (!user?.id) return null;

  let tableProfile: Record<string, unknown> | null = null;
  try {
    const { data, error } = await client
      .from('users')
      .select('id, org_id, name, avatar_url')
      .eq('id', user.id)
      .single();

    if (!error) {
      tableProfile = data as Record<string, unknown>;
    }
  } catch {
    // silent fallback to auth metadata
  }

  const fallbackName =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    getDisplayName() ||
    user.email?.split('@')[0] ||
    'Anônimo';

  return {
    id: user.id,
    orgId: (tableProfile?.org_id as string | undefined) ?? null,
    name: (tableProfile?.name as string | undefined) || fallbackName,
    avatarUrl: (tableProfile?.avatar_url as string | undefined) || (user.user_metadata?.avatar_url as string | undefined) || null,
  };
}

async function resolveNote(
  client: SupabaseClientLike,
  profile: CloudProfile,
  sourcePath: string,
  markdown: string,
): Promise<CloudNote | null> {
  if (!profile.orgId) return null;

  const slug = buildSlugFromPath(sourcePath);
  const title = extractTitle(markdown, sourcePath);
  const payload = {
    org_id: profile.orgId,
    slug,
    title,
    content: markdown,
    markdown,
    created_by: profile.id,
    updated_by: profile.id,
    source_path: sourcePath,
  };

  const sourcePathUpsert = await client
    .from('notes')
    .upsert(payload, { onConflict: 'org_id,source_path' })
    .select('id')
    .single();

  if (!sourcePathUpsert.error && sourcePathUpsert.data?.id) {
    return { id: sourcePathUpsert.data.id as string };
  }

  if (
    !isMissingColumnError(sourcePathUpsert.error, 'source_path') &&
    !isOnConflictConstraintError(sourcePathUpsert.error)
  ) {
    throw new Error(sourcePathUpsert.error?.message || 'Failed to resolve note');
  }

  const fallbackPayload = {
    org_id: profile.orgId,
    slug,
    title,
    content: markdown,
    markdown,
    created_by: profile.id,
    updated_by: profile.id,
  };

  const fallbackUpsert = await client
    .from('notes')
    .upsert(fallbackPayload, { onConflict: 'org_id,slug' })
    .select('id')
    .single();

  if (fallbackUpsert.error || !fallbackUpsert.data?.id) {
    throw new Error(fallbackUpsert.error?.message || 'Failed to resolve note');
  }

  return { id: fallbackUpsert.data.id as string };
}

type CommentRow = {
  id: string;
  thread_id: string;
  author_name: string;
  author_avatar: string | null;
  content: string;
  created_at: string;
  parent_id: string | null;
  deleted_at?: string | null;
};

type ThreadRow = {
  id: string;
  annotation_id: string;
};

function selectTopLevelComment(rows: CommentRow[]): CommentRow | null {
  const visible = rows.filter((comment) => !comment.deleted_at);
  if (visible.length === 0) return null;
  const topLevel = visible.filter((comment) => !comment.parent_id);
  return (topLevel[0] || visible[0]) ?? null;
}

function mapRowToAnnotation(row: Record<string, unknown>, threadComment?: CommentFeedItem): Annotation {
  const metadata = isRecord(row.metadata) ? row.metadata : {};
  const persistedId = String(row.id);
  const localId = typeof metadata.client_id === 'string' && metadata.client_id.trim().length > 0
    ? metadata.client_id
    : persistedId;
  const deletedAt =
    safeDateToEpoch(row.deleted_at) ??
    safeDateToEpoch(metadata.deleted_at) ??
    undefined;

  const type = parseType(row.type);
  const isGlobalMeta = metadata.is_global === true;

  return {
    id: localId,
    persistedId,
    blockId: String(row.block_id ?? ''),
    startOffset: Number(row.start_offset ?? 0),
    endOffset: Number(row.end_offset ?? 0),
    type,
    text: threadComment?.text ?? (typeof row.text === 'string' ? row.text : undefined),
    originalText: String(row.original_text ?? ''),
    createdA: safeDateToEpoch(row.created_at) ?? Date.now(),
    author: threadComment?.authorName || (typeof metadata.author === 'string' ? metadata.author : undefined),
    isGlobal: isGlobalMeta || type === AnnotationType.GLOBAL_COMMENT,
    imageId: typeof metadata.image_id === 'string' ? metadata.image_id : undefined,
    imageStrokes: Array.isArray(metadata.image_strokes)
      ? (metadata.image_strokes as any[])
      : Array.isArray(metadata.data_json)
        ? (metadata.data_json as any[])
        : undefined,
    renderedImageUrl: typeof metadata.rendered_image_url === 'string' ? metadata.rendered_image_url : undefined,
    status: typeof metadata.status === 'string' ? (metadata.status as any) : undefined,
    resolvedAt: safeDateToEpoch(metadata.resolved_at),
    resolvedBy: typeof metadata.resolved_by === 'string' ? metadata.resolved_by : undefined,
    threadId: threadComment?.threadId || (typeof metadata.thread_id === 'string' ? metadata.thread_id : undefined),
    commentId: threadComment?.commentId || (typeof metadata.comment_id === 'string' ? metadata.comment_id : undefined),
    deletedAt,
  };
}

function mergeAnnotations(local: Annotation[], cloud: Annotation[]): Annotation[] {
  const merged = new Map<string, Annotation>();

  for (const annotation of cloud) {
    const key = annotation.persistedId || annotation.id;
    merged.set(key, annotation);
  }

  for (const annotation of local) {
    const key = annotation.persistedId || annotation.id;
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, annotation);
      continue;
    }

    merged.set(key, {
      ...annotation,
      ...existing,
      startMeta: existing.startMeta ?? annotation.startMeta,
      endMeta: existing.endMeta ?? annotation.endMeta,
      markerPosition: existing.markerPosition ?? annotation.markerPosition,
      markerColor: existing.markerColor ?? annotation.markerColor,
      targetSelector: existing.targetSelector ?? annotation.targetSelector,
    });
  }

  return [...merged.values()].sort((a, b) => a.createdA - b.createdA);
}

export async function loadCloudState(
  client: SupabaseClientLike,
  sourcePath: string,
  markdown: string,
  localAnnotations: Annotation[],
): Promise<LoadedCloudState> {
  const profile = await resolveCloudProfile(client);
  if (!profile) {
    return { profile: null, note: null, annotations: localAnnotations, comments: [] };
  }

  const note = await resolveNote(client, profile, sourcePath, markdown);
  if (!note) {
    return { profile, note: null, annotations: localAnnotations, comments: [] };
  }

  const annotationQuery = await client
    .from('annotations')
    .select('*')
    .eq('note_id', note.id)
    .order('created_at', { ascending: true });

  if (annotationQuery.error) {
    throw new Error(annotationQuery.error.message || 'Failed to load annotations');
  }

  const annotationRows = (annotationQuery.data || []) as Record<string, unknown>[];
  const annotationIds = annotationRows.map((row) => String(row.id));

  let threadRows: ThreadRow[] = [];
  let commentRows: CommentRow[] = [];

  if (annotationIds.length > 0) {
    const threadQuery = await client
      .from('comment_threads')
      .select('id, annotation_id')
      .in('annotation_id', annotationIds);

    if (!threadQuery.error) {
      threadRows = (threadQuery.data || []) as ThreadRow[];
    }

    const threadIds = threadRows.map((thread) => thread.id);
    if (threadIds.length > 0) {
      const commentQuery = await client
        .from('comments')
        .select('id, thread_id, author_name, author_avatar, content, created_at, parent_id, deleted_at')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: true });

      if (!commentQuery.error) {
        commentRows = (commentQuery.data || []) as CommentRow[];
      }
    }
  }

  const commentsByThread = new Map<string, CommentRow[]>();
  for (const row of commentRows) {
    if (!commentsByThread.has(row.thread_id)) {
      commentsByThread.set(row.thread_id, []);
    }
    commentsByThread.get(row.thread_id)!.push(row);
  }

  const commentsByAnnotation = new Map<string, CommentFeedItem>();
  for (const thread of threadRows) {
    const primaryComment = selectTopLevelComment(commentsByThread.get(thread.id) || []);
    if (!primaryComment) continue;

    commentsByAnnotation.set(thread.annotation_id, {
      annotationId: thread.annotation_id,
      threadId: thread.id,
      commentId: primaryComment.id,
      text: primaryComment.content,
      authorName: primaryComment.author_name,
      authorAvatar: primaryComment.author_avatar || null,
      createdAt: primaryComment.created_at,
    });
  }

  const comments = [...commentsByAnnotation.values()];
  const cloudAnnotations = annotationRows.map((row) =>
    mapRowToAnnotation(row, commentsByAnnotation.get(String(row.id))),
  );

  return {
    profile,
    note,
    comments,
    annotations: mergeAnnotations(localAnnotations, cloudAnnotations),
  };
}

function toAnnotationRow(
  annotation: Annotation,
  noteId: string,
  userId: string,
  includeDeletedColumn: boolean,
  includeImageColumns: boolean,
): Record<string, unknown> {
  const metadata = metadataFromAnnotation(annotation);
  const payload: Record<string, unknown> = {
    id: annotation.persistedId,
    note_id: noteId,
    user_id: userId,
    block_id: annotation.blockId || '',
    start_offset: annotation.startOffset || 0,
    end_offset: annotation.endOffset || 0,
    type: annotation.type,
    text: annotation.text ?? null,
    original_text: annotation.originalText ?? '',
    metadata,
    updated_at: new Date().toISOString(),
  };

  if (includeDeletedColumn) {
    payload.deleted_at = annotation.deletedAt ? new Date(annotation.deletedAt).toISOString() : null;
  }

  if (includeImageColumns) {
    payload.data_json = annotation.imageStrokes ?? null;
    payload.rendered_image_url = annotation.renderedImageUrl ?? null;
  }

  return payload;
}

async function upsertAnnotationRows(
  client: SupabaseClientLike,
  annotations: Annotation[],
  noteId: string,
  userId: string,
): Promise<void> {
  if (annotations.length === 0) return;

  let includeDeletedColumn = true;
  let includeImageColumns = true;

  while (true) {
    const rows = annotations.map((annotation) =>
      toAnnotationRow(annotation, noteId, userId, includeDeletedColumn, includeImageColumns),
    );

    const { error } = await client
      .from('annotations')
      .upsert(rows, { onConflict: 'id' });

    if (!error) return;

    if (includeDeletedColumn && isMissingColumnError(error, 'deleted_at')) {
      includeDeletedColumn = false;
      continue;
    }

    if (includeImageColumns && (isMissingColumnError(error, 'data_json') || isMissingColumnError(error, 'rendered_image_url'))) {
      includeImageColumns = false;
      continue;
    }

    throw new Error(error.message || 'Failed to sync annotations');
  }
}

async function ensureCommentThread(
  client: SupabaseClientLike,
  annotation: Annotation,
  profile: CloudProfile,
): Promise<Annotation> {
  if (!annotation.persistedId || !COMMENT_TYPES.has(annotation.type)) {
    return annotation;
  }

  const text = annotation.text?.trim();
  if (!text) return annotation;

  if (annotation.deletedAt && annotation.commentId) {
    const deletedAtIso = new Date(annotation.deletedAt).toISOString();
    const updateResponse = await client
      .from('comments')
      .update({ deleted_at: deletedAtIso, updated_at: new Date().toISOString() })
      .eq('id', annotation.commentId);

    if (updateResponse.error && isMissingColumnError(updateResponse.error, 'deleted_at')) {
      await client
        .from('comments')
        .delete()
        .eq('id', annotation.commentId);
    }

    return annotation;
  }

  if (annotation.threadId && annotation.commentId) {
    await client
      .from('comments')
      .update({
        content: text,
        author_name: profile.name,
        author_avatar: profile.avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', annotation.commentId);

    return annotation;
  }

  const threadId = annotation.threadId || buildThreadId();
  const commentId = buildCommentId();

  const threadResponse = await client
    .from('comment_threads')
    .upsert({
      id: threadId,
      annotation_id: annotation.persistedId,
      status: 'OPEN',
      created_by: profile.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'id' });

  if (threadResponse.error) {
    throw new Error(threadResponse.error.message || 'Failed to create comment thread');
  }

  const commentResponse = await client
    .from('comments')
    .upsert({
      id: commentId,
      thread_id: threadId,
      author_id: profile.id,
      author_name: profile.name,
      author_avatar: profile.avatarUrl,
      content: text,
      mentions: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      parent_id: null,
    }, { onConflict: 'id' });

  if (commentResponse.error) {
    throw new Error(commentResponse.error.message || 'Failed to create comment');
  }

  return {
    ...annotation,
    threadId,
    commentId,
  };
}

async function patchAnnotationMetadata(client: SupabaseClientLike, annotation: Annotation): Promise<void> {
  if (!annotation.persistedId) return;

  await client
    .from('annotations')
    .update({
      metadata: metadataFromAnnotation(annotation),
      updated_at: new Date().toISOString(),
    })
    .eq('id', annotation.persistedId);
}

export async function syncCloudAnnotations(
  client: SupabaseClientLike,
  noteId: string,
  profile: CloudProfile,
  annotations: Annotation[],
): Promise<Annotation[]> {
  const hydrated = annotations.map((annotation) => ({
    ...annotation,
    persistedId: annotation.persistedId || crypto.randomUUID(),
    author: annotation.author || profile.name,
  }));

  await upsertAnnotationRows(client, hydrated, noteId, profile.id);

  const next: Annotation[] = [];
  for (const annotation of hydrated) {
    const withThread = await ensureCommentThread(client, annotation, profile);
    if (withThread.threadId !== annotation.threadId || withThread.commentId !== annotation.commentId) {
      await patchAnnotationMetadata(client, withThread);
    }
    next.push(withThread);
  }

  return next;
}

export async function tryLoadCloudState(
  client: SupabaseClientLike | null,
  sourcePath: string,
  markdown: string,
  localAnnotations: Annotation[],
): Promise<LoadedCloudState | null> {
  if (!client) return null;
  try {
    return await loadCloudState(client, sourcePath, markdown, localAnnotations);
  } catch (error) {
    return null;
  }
}

export async function trySyncCloudAnnotations(
  client: SupabaseClientLike | null,
  noteId: string | null,
  profile: CloudProfile | null,
  annotations: Annotation[],
): Promise<Annotation[] | null> {
  if (!client || !noteId || !profile) return null;
  try {
    return await syncCloudAnnotations(client, noteId, profile, annotations);
  } catch {
    return null;
  }
}
