import { Annotation, AnnotationType } from '@obsidian-note-reviewer/ui/types';

export interface DocumentRecord {
  id: string;
  title: string;
  markdown: string;
  content: string;
  sourcePath: string | null;
  updatedAt: string;
  createdAt: string;
  isArchived: boolean;
  isPublic: boolean;
  createdBy: string | null;
  orgId: string | null;
}

export interface OpenDocumentResult {
  document: DocumentRecord;
  annotations: Annotation[];
}

type SupabaseClientLike = {
  auth: {
    getUser: () => Promise<{ data?: { user?: any | null } }>;
  };
  from: (table: string) => any;
  rpc: (fn: string, args?: Record<string, unknown>) => Promise<{ data?: any; error?: any }>;
};

type NoteRow = {
  id: string;
  title: string;
  markdown: string | null;
  content: string | null;
  source_path: string | null;
  updated_at: string;
  created_at: string;
  is_archived: boolean | null;
  is_public: boolean | null;
  created_by: string | null;
  org_id: string | null;
};

type AnnotationRow = {
  id: string;
  block_id: string;
  start_offset: number;
  end_offset: number;
  type: string;
  text: string | null;
  original_text: string | null;
  metadata: Record<string, unknown> | null;
  deleted_at?: string | null;
  created_at: string;
};

type ThreadRow = {
  id: string;
  annotation_id: string;
};

type CommentRow = {
  id: string;
  thread_id: string;
  content: string;
  author_name: string;
  author_avatar: string | null;
  created_at: string;
  parent_id: string | null;
  deleted_at?: string | null;
};

export interface ResolvedWorkspaceProfile {
  orgId: string | null;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
}

function normalizeResolvedWorkspaceProfile(data: unknown): ResolvedWorkspaceProfile | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') return null;

  const record = row as Record<string, unknown>;
  const orgId = typeof record.org_id === 'string' ? record.org_id : null;
  const email = typeof record.email === 'string' ? record.email : null;
  const name = typeof record.name === 'string' ? record.name : null;
  const avatarUrl = typeof record.avatar_url === 'string' ? record.avatar_url : null;

  return { orgId, email, name, avatarUrl };
}

export async function resolveCurrentWorkspaceProfile(
  client: SupabaseClientLike,
): Promise<ResolvedWorkspaceProfile | null> {
  let rpcProfile: ResolvedWorkspaceProfile | null = null;

  try {
    const { data, error } = await client.rpc('resolve_current_user_profile');
    if (!error) {
      const normalized = normalizeResolvedWorkspaceProfile(data);
      if (normalized) {
        rpcProfile = normalized;
        if (normalized.orgId) return normalized;
      }
    }
  } catch {
    // fallback below
  }

  const { data: authData } = await client.auth.getUser();
  const user = authData?.user;
  if (!user?.id) return null;

  const { data: profile } = await client
    .from('users')
    .select('org_id,email,name,avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  const fallbackOrgId = typeof profile?.org_id === 'string' ? profile.org_id : null;
  const fallbackEmail =
    typeof profile?.email === 'string'
      ? profile.email
      : rpcProfile?.email || (typeof user.email === 'string' ? user.email : null);
  const fallbackName =
    typeof profile?.name === 'string'
      ? profile.name
      : rpcProfile?.name ||
        (typeof user.user_metadata?.full_name === 'string'
          ? user.user_metadata.full_name
          : (typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null));
  const fallbackAvatar =
    typeof profile?.avatar_url === 'string'
      ? profile.avatar_url
      : rpcProfile?.avatarUrl || (typeof user.user_metadata?.avatar_url === 'string' ? user.user_metadata.avatar_url : null);

  if (fallbackOrgId) {
    return {
      orgId: fallbackOrgId,
      email: fallbackEmail,
      name: fallbackName,
      avatarUrl: fallbackAvatar,
    };
  }

  try {
    const { data: orgIdByRpc, error: orgIdError } = await client.rpc('current_user_org_id');
    if (!orgIdError && typeof orgIdByRpc === 'string' && orgIdByRpc) {
      return {
        orgId: orgIdByRpc,
        email: fallbackEmail,
        name: fallbackName,
        avatarUrl: fallbackAvatar,
      };
    }
  } catch {
    // no-op
  }

  return {
    orgId: rpcProfile?.orgId || null,
    email: fallbackEmail,
    name: fallbackName,
    avatarUrl: fallbackAvatar,
  };
}

function toDocumentRecord(row: NoteRow): DocumentRecord {
  return {
    id: row.id,
    title: row.title,
    markdown: row.markdown || row.content || '',
    content: row.content || row.markdown || '',
    sourcePath: row.source_path,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    isArchived: row.is_archived === true,
    isPublic: row.is_public === true,
    createdBy: row.created_by,
    orgId: row.org_id,
  };
}

function toEpoch(value: string | null | undefined): number | undefined {
  if (!value) return undefined;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? undefined : timestamp;
}

function parseType(rawType: string): AnnotationType {
  const normalized = String(rawType || '').trim();
  if (!normalized) return AnnotationType.COMMENT;

  if ((Object.values(AnnotationType) as string[]).includes(normalized)) {
    return normalized as AnnotationType;
  }

  if ((normalized as keyof typeof AnnotationType) in AnnotationType) {
    return AnnotationType[normalized as keyof typeof AnnotationType];
  }

  return AnnotationType.COMMENT;
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const SHARE_SLUG_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';

function createLegacyShareSlug(length = 10): string {
  let slug = '';
  for (let index = 0; index < length; index += 1) {
    const randomIndex = Math.floor(Math.random() * SHARE_SLUG_CHARS.length);
    slug += SHARE_SLUG_CHARS[randomIndex];
  }
  return slug;
}

export async function ensurePublicShareLink(
  client: SupabaseClientLike,
  noteId: string,
  baseUrl?: string,
): Promise<string> {
  const { data: noteRow, error: noteError } = await client
    .from('notes')
    .select('id,share_hash,is_public')
    .eq('id', noteId)
    .maybeSingle();

  if (noteError || !noteRow) {
    throw new Error(noteError?.message || 'Documento não encontrado para compartilhamento');
  }

  let slug = typeof noteRow.share_hash === 'string' && noteRow.share_hash.trim().length > 0
    ? noteRow.share_hash.trim()
    : null;

  if (!slug) {
    let attempts = 0;
    while (attempts < 12 && !slug) {
      attempts += 1;
      const candidate = createLegacyShareSlug(10);
      const { data: existingRow, error: existingError } = await client
        .from('notes')
        .select('id')
        .eq('share_hash', candidate)
        .maybeSingle();

      if (existingError) {
        throw new Error(existingError.message || 'Falha ao verificar slug de compartilhamento');
      }

      if (!existingRow) {
        slug = candidate;
      }
    }
  }

  if (!slug) {
    throw new Error('Falha ao gerar link público único');
  }

  const needsUpdate = noteRow.is_public !== true || noteRow.share_hash !== slug;
  if (needsUpdate) {
    const { error: updateError } = await client
      .from('notes')
      .update({
        is_public: true,
        share_hash: slug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', noteId);

    if (updateError) {
      throw new Error(updateError.message || 'Falha ao publicar documento');
    }
  }

  const origin = (baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  if (!origin) {
    throw new Error('Base URL indisponível para gerar link público');
  }

  return `${origin}/shared/${slug}`;
}

function mapAnnotation(
  row: AnnotationRow,
  linkedComment?: CommentRow,
): Annotation {
  const metadata = row.metadata || {};
  const persistedId = row.id;
  const localId = typeof metadata.client_id === 'string' ? metadata.client_id : persistedId;

  return {
    id: localId,
    persistedId,
    blockId: row.block_id,
    startOffset: row.start_offset,
    endOffset: row.end_offset,
    type: parseType(row.type),
    text: linkedComment?.content || row.text || undefined,
    originalText: row.original_text || '',
    createdA: toEpoch(row.created_at) || Date.now(),
    author: linkedComment?.author_name || (typeof metadata.author === 'string' ? metadata.author : undefined),
    isGlobal: metadata.is_global === true,
    threadId: typeof metadata.thread_id === 'string' ? metadata.thread_id : linkedComment?.thread_id,
    commentId: typeof metadata.comment_id === 'string' ? metadata.comment_id : linkedComment?.id,
    deletedAt: toEpoch(row.deleted_at || (typeof metadata.deleted_at === 'string' ? metadata.deleted_at : undefined)),
    status: typeof metadata.status === 'string' ? (metadata.status as any) : undefined,
    resolvedAt: toEpoch(typeof metadata.resolved_at === 'string' ? metadata.resolved_at : undefined),
    resolvedBy: typeof metadata.resolved_by === 'string' ? metadata.resolved_by : undefined,
    imageId: typeof metadata.image_id === 'string' ? metadata.image_id : undefined,
    imageStrokes: Array.isArray(metadata.image_strokes)
      ? (metadata.image_strokes as any[])
      : (Array.isArray(metadata.data_json) ? (metadata.data_json as any[]) : undefined),
    renderedImageUrl: typeof metadata.rendered_image_url === 'string' ? metadata.rendered_image_url : undefined,
  };
}

function pickTopComment(comments: CommentRow[]): CommentRow | undefined {
  const visible = comments.filter((comment) => !comment.deleted_at);
  if (visible.length === 0) return undefined;
  return visible.find((comment) => !comment.parent_id) || visible[0];
}

export async function listAccessibleDocuments(client: SupabaseClientLike): Promise<DocumentRecord[]> {
  // Try with deleted_at filter (requires migration 017)
  const { data, error } = await client
    .from('notes')
    .select('id,title,markdown,content,source_path,updated_at,created_at,is_archived,is_public,created_by,org_id')
    .eq('is_archived', false)
    .is('deleted_at', null)
    .order('updated_at', { ascending: false });

  if (error) {
    // Fallback: if deleted_at column doesn't exist yet, query without it
    if (error.message?.includes('deleted_at') || error.code === '42703') {
      const fallback = await client
        .from('notes')
        .select('id,title,markdown,content,source_path,updated_at,created_at,is_archived,is_public,created_by,org_id')
        .eq('is_archived', false)
        .order('updated_at', { ascending: false });

      if (fallback.error) {
        throw new Error(fallback.error.message || 'Falha ao carregar documentos');
      }
      return (fallback.data || []).map((row: NoteRow) => toDocumentRecord(row));
    }
    throw new Error(error.message || 'Falha ao carregar documentos');
  }

  return (data || []).map((row: NoteRow) => toDocumentRecord(row));
}

export async function softDeleteDocument(
  client: SupabaseClientLike,
  noteId: string,
): Promise<void> {
  const { error } = await client
    .from('notes')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', noteId);

  if (error) {
    throw new Error(error.message || 'Falha ao excluir documento');
  }
}

export async function restoreDocument(
  client: SupabaseClientLike,
  noteId: string,
): Promise<void> {
  const { error } = await client
    .from('notes')
    .update({ deleted_at: null })
    .eq('id', noteId);

  if (error) {
    throw new Error(error.message || 'Falha ao restaurar documento');
  }
}

export async function permanentDeleteDocument(
  client: SupabaseClientLike,
  noteId: string,
): Promise<void> {
  const { error } = await client
    .from('notes')
    .delete()
    .eq('id', noteId);

  if (error) {
    throw new Error(error.message || 'Falha ao excluir permanentemente');
  }
}

export interface TrashDocumentRecord {
  id: string;
  title: string;
  deletedAt: string;
  expiresInDays: number;
}

export async function listTrashDocuments(client: SupabaseClientLike): Promise<TrashDocumentRecord[]> {
  const { data, error } = await client
    .from('notes')
    .select('id,title,deleted_at')
    .not('deleted_at', 'is', null)
    .order('deleted_at', { ascending: false });

  if (error) {
    throw new Error(error.message || 'Falha ao carregar lixeira');
  }

  const TRASH_RETENTION_DAYS = 30;
  const now = Date.now();

  return (data || []).map((row: { id: string; title: string; deleted_at: string }) => {
    const deletedMs = new Date(row.deleted_at).getTime();
    const elapsedDays = (now - deletedMs) / (1000 * 60 * 60 * 24);
    const expiresInDays = Math.max(0, Math.ceil(TRASH_RETENTION_DAYS - elapsedDays));
    return {
      id: row.id,
      title: row.title,
      deletedAt: row.deleted_at,
      expiresInDays,
    };
  });
}

export async function purgeExpiredDocuments(
  client: SupabaseClientLike,
  daysThreshold = 30,
): Promise<number> {
  const cutoff = new Date(Date.now() - daysThreshold * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await client
    .from('notes')
    .delete()
    .not('deleted_at', 'is', null)
    .lt('deleted_at', cutoff)
    .select('id');

  if (error) {
    throw new Error(error.message || 'Falha ao limpar documentos expirados');
  }

  return data?.length || 0;
}

export async function createDocument(
  client: SupabaseClientLike,
  params?: { title?: string; markdown?: string },
): Promise<DocumentRecord> {
  const { data: authData } = await client.auth.getUser();
  const user = authData?.user;
  if (!user?.id) {
    throw new Error('Usuário não autenticado');
  }

  const resolvedProfile = await resolveCurrentWorkspaceProfile(client);
  const orgId = resolvedProfile?.orgId || null;

  if (!orgId) {
    throw new Error('Não foi possível resolver a organização do usuário');
  }

  const title = (params?.title || 'Documento sem título').trim();
  const markdown = params?.markdown || '# Documento sem título\n\n';
  const baseSlug = slugify(title) || 'documento';
  const slug = `${baseSlug}-${Date.now().toString(36)}`;
  const sourcePath = `cloud/${slug}.md`;

  const { data: inserted, error } = await client
    .from('notes')
    .insert({
      org_id: orgId,
      slug,
      title,
      content: markdown,
      markdown,
      source_path: sourcePath,
      created_by: user.id,
      updated_by: user.id,
      is_archived: false,
    })
    .select('id,title,markdown,content,source_path,updated_at,created_at,is_archived,is_public,created_by,org_id')
    .single();

  if (error || !inserted) {
    throw new Error(error?.message || 'Falha ao criar documento');
  }

  return toDocumentRecord(inserted as NoteRow);
}

export async function openDocument(
  client: SupabaseClientLike,
  noteId: string,
): Promise<OpenDocumentResult> {
  const { data: noteData, error: noteError } = await client
    .from('notes')
    .select('id,title,markdown,content,source_path,updated_at,created_at,is_archived,is_public,created_by,org_id')
    .eq('id', noteId)
    .single();

  if (noteError || !noteData) {
    throw new Error(noteError?.message || 'Documento não encontrado');
  }

  const { data: annotationData, error: annotationError } = await client
    .from('annotations')
    .select('id,block_id,start_offset,end_offset,type,text,original_text,metadata,deleted_at,created_at')
    .eq('note_id', noteId)
    .order('created_at', { ascending: true });

  if (annotationError) {
    throw new Error(annotationError.message || 'Falha ao carregar anotações');
  }

  const annotationRows = (annotationData || []) as AnnotationRow[];
  const annotationIds = annotationRows.map((row) => row.id);

  let threadRows: ThreadRow[] = [];
  let commentRows: CommentRow[] = [];

  if (annotationIds.length > 0) {
    const { data: threadData } = await client
      .from('comment_threads')
      .select('id,annotation_id')
      .in('annotation_id', annotationIds);

    threadRows = (threadData || []) as ThreadRow[];

    const threadIds = threadRows.map((row) => row.id);
    if (threadIds.length > 0) {
      const { data: commentData } = await client
        .from('comments')
        .select('id,thread_id,content,author_name,author_avatar,created_at,parent_id,deleted_at')
        .in('thread_id', threadIds)
        .order('created_at', { ascending: true });

      commentRows = (commentData || []) as CommentRow[];
    }
  }

  const commentsByThread = new Map<string, CommentRow[]>();
  for (const comment of commentRows) {
    if (!commentsByThread.has(comment.thread_id)) {
      commentsByThread.set(comment.thread_id, []);
    }
    commentsByThread.get(comment.thread_id)!.push(comment);
  }

  const primaryCommentByAnnotation = new Map<string, CommentRow>();
  for (const thread of threadRows) {
    const topComment = pickTopComment(commentsByThread.get(thread.id) || []);
    if (topComment) {
      primaryCommentByAnnotation.set(thread.annotation_id, topComment);
    }
  }

  const annotations = annotationRows.map((row) => mapAnnotation(row, primaryCommentByAnnotation.get(row.id)));

  return {
    document: toDocumentRecord(noteData as NoteRow),
    annotations,
  };
}

export async function renameDocument(
  client: SupabaseClientLike,
  noteId: string,
  title: string,
): Promise<DocumentRecord> {
  const normalizedTitle = title.trim();
  if (!normalizedTitle) {
    throw new Error('Título inválido');
  }

  const { data, error } = await client
    .from('notes')
    .update({
      title: normalizedTitle,
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId)
    .select('id,title,markdown,content,source_path,updated_at,created_at,is_archived,is_public,created_by,org_id')
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Falha ao renomear documento');
  }

  return toDocumentRecord(data as NoteRow);
}

export async function archiveDocument(
  client: SupabaseClientLike,
  noteId: string,
): Promise<void> {
  const { error } = await client
    .from('notes')
    .update({
      is_archived: true,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', noteId);

  if (error) {
    throw new Error(error.message || 'Falha ao arquivar documento');
  }
}
