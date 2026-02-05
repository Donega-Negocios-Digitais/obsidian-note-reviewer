import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { Comment, CommentThread, AnnotationStatus } from '../types';
import { supabase } from '../lib/supabase';

interface CommentState {
  threads: CommentThread[];
  loading: boolean;
  error: string | null;

  // Thread actions
  addThread: (thread: Omit<CommentThread, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>;
  updateThreadStatus: (threadId: string, status: AnnotationStatus) => Promise<void>;
  getThreadForAnnotation: (annotationId: string) => CommentThread | undefined;

  // Comment actions
  addComment: (comment: Omit<Comment, 'id' | 'createdAt'>) => Promise<string>;
  updateComment: (commentId: string, content: string, mentions: string[]) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;

  // Data loading
  loadThreadsForNote: (noteId: string) => Promise<void>;
  loadThread: (threadId: string) => Promise<void>;
  clearThreads: () => void;
}

export const useCommentStore = create<CommentState>()(
  devtools(
    persist(
      (set, get) => ({
        threads: [],
        loading: false,
        error: null,

        addThread: async (threadData) => {
          const now = Date.now();
          const threadId = `thread_${now}_${Math.random().toString(36).substr(2, 9)}`;

          const newThread: CommentThread = {
            ...threadData,
            id: threadId,
            createdAt: now,
            updatedAt: now,
          };

          // Update local state (optimistic)
          set((state) => ({
            threads: [...state.threads, newThread],
          }));

          // Persist to Supabase
          try {
            const { data, error } = await supabase
              .from('comment_threads')
              .insert({
                id: threadId,
                annotation_id: threadData.annotationId,
                status: threadData.status,
                created_by: threadData.createdBy,
                created_at: new Date(now).toISOString(),
                updated_at: new Date(now).toISOString(),
              })
              .select()
              .single();

            if (error) throw error;

            return threadId;
          } catch (err) {
            console.error('Failed to create thread:', err);
            set((state) => ({
              threads: state.threads.filter(t => t.id !== threadId),
              error: 'Failed to create thread',
            }));
            throw err;
          }
        },

        updateThreadStatus: async (threadId, status) => {
          const now = Date.now();

          // Update local state (optimistic)
          set((state) => ({
            threads: state.threads.map((thread) =>
              thread.id === threadId
                ? { ...thread, status, updatedAt: now }
                : thread
            ),
          }));

          // Persist to Supabase
          try {
            const { error } = await supabase
              .from('comment_threads')
              .update({
                status,
                updated_at: new Date(now).toISOString(),
              })
              .eq('id', threadId);

            if (error) throw error;
          } catch (err) {
            console.error('Failed to update thread status:', err);
            set({ error: 'Failed to update thread status' });
            throw err;
          }
        },

        getThreadForAnnotation: (annotationId) => {
          return get().threads.find(t => t.annotationId === annotationId);
        },

        addComment: async (commentData) => {
          const now = Date.now();
          const commentId = `comment_${now}_${Math.random().toString(36).substr(2, 9)}`;

          const newComment: Comment = {
            ...commentData,
            id: commentId,
            createdAt: now,
          };

          // Update local state (optimistic)
          set((state) => ({
            threads: state.threads.map((thread) =>
              thread.id === commentData.threadId
                ? {
                    ...thread,
                    comments: [...thread.comments, newComment],
                    updatedAt: now,
                  }
                : thread
            ),
          }));

          // Persist to Supabase
          try {
            const { error } = await supabase
              .from('comments')
              .insert({
                id: commentId,
                thread_id: commentData.threadId,
                author_id: commentData.authorId,
                author_name: commentData.authorName,
                author_avatar: commentData.authorAvatar || null,
                content: commentData.content,
                mentions: commentData.mentions,
                parent_id: commentData.parentId || null,
                created_at: new Date(now).toISOString(),
                updated_at: new Date(now).toISOString(),
              });

            if (error) throw error;

            return commentId;
          } catch (err) {
            console.error('Failed to create comment:', err);
            // Rollback local state
            set((state) => ({
              threads: state.threads.map((thread) =>
                thread.id === commentData.threadId
                  ? {
                      ...thread,
                      comments: thread.comments.filter(c => c.id !== commentId),
                    }
                  : thread
              ),
              error: 'Failed to create comment',
            }));
            throw err;
          }
        },

        updateComment: async (commentId, content, mentions) => {
          const now = Date.now();

          // Update local state (optimistic)
          set((state) => ({
            threads: state.threads.map((thread) => ({
              ...thread,
              comments: thread.comments.map((comment) =>
                comment.id === commentId
                  ? { ...comment, content, mentions, updatedAt: now }
                  : comment
              ),
              updatedAt: thread.comments.some(c => c.id === commentId) ? now : thread.updatedAt,
            })),
          }));

          // Persist to Supabase
          try {
            const { error } = await supabase
              .from('comments')
              .update({
                content,
                mentions,
                updated_at: new Date(now).toISOString(),
              })
              .eq('id', commentId);

            if (error) throw error;
          } catch (err) {
            console.error('Failed to update comment:', err);
            set({ error: 'Failed to update comment' });
            throw err;
          }
        },

        deleteComment: async (commentId) => {
          const threadId = get().threads.find(t =>
            t.comments.some(c => c.id === commentId)
          )?.id;

          // Update local state (optimistic)
          set((state) => ({
            threads: state.threads.map((thread) => ({
              ...thread,
              comments: thread.comments.filter(c => c.id !== commentId),
            })),
          }));

          // Persist to Supabase
          try {
            const { error } = await supabase
              .from('comments')
              .delete()
              .eq('id', commentId);

            if (error) throw error;
          } catch (err) {
            console.error('Failed to delete comment:', err);
            set({ error: 'Failed to delete comment' });
            throw err;
          }
        },

        loadThreadsForNote: async (noteId) => {
          set({ loading: true, error: null });

          try {
            // First, get all threads for annotations belonging to this note
            const { data: annotationData, error: annotationError } = await supabase
              .from('annotations')
              .select('id')
              .eq('note_id', noteId);

            if (annotationError) throw annotationError;

            const annotationIds = annotationData?.map(a => a.id) || [];
            if (annotationIds.length === 0) {
              set({ threads: [], loading: false });
              return;
            }

            // Get threads for these annotations
            const { data: threadsData, error: threadsError } = await supabase
              .from('comment_threads')
              .select('*')
              .in('annotation_id', annotationIds)
              .order('created_at', { ascending: false });

            if (threadsError) throw threadsError;

            // Get comments for all threads
            const threadIds = threadsData?.map(t => t.id) || [];
            const { data: commentsData, error: commentsError } = await supabase
              .from('comments')
              .select('*')
              .in('thread_id', threadIds)
              .order('created_at', { ascending: true });

            if (commentsError) throw commentsError;

            // Transform and combine data
            const threads: CommentThread[] = (threadsData || []).map((thread: any) => ({
              id: thread.id,
              annotationId: thread.annotation_id,
              status: thread.status as AnnotationStatus,
              createdAt: new Date(thread.created_at).getTime(),
              updatedAt: new Date(thread.updated_at).getTime(),
              createdBy: thread.created_by,
              comments: (commentsData || [])
                .filter((c: any) => c.thread_id === thread.id)
                .map((comment: any) => ({
                  id: comment.id,
                  threadId: comment.thread_id,
                  authorId: comment.author_id,
                  authorName: comment.author_name,
                  authorAvatar: comment.author_avatar || undefined,
                  content: comment.content,
                  mentions: comment.mentions || [],
                  createdAt: new Date(comment.created_at).getTime(),
                  updatedAt: comment.updated_at ? new Date(comment.updated_at).getTime() : undefined,
                  parentId: comment.parent_id || undefined,
                })),
            }));

            set({ threads, loading: false });
          } catch (err) {
            console.error('Failed to load threads:', err);
            set({ error: 'Failed to load threads', loading: false });
          }
        },

        loadThread: async (threadId) => {
          set({ loading: true, error: null });

          try {
            const { data: threadData, error: threadError } = await supabase
              .from('comment_threads')
              .select('*')
              .eq('id', threadId)
              .single();

            if (threadError) throw threadError;

            const { data: commentsData, error: commentsError } = await supabase
              .from('comments')
              .select('*')
              .eq('thread_id', threadId)
              .order('created_at', { ascending: true });

            if (commentsError) throw commentsError;

            const thread: CommentThread = {
              id: threadData.id,
              annotationId: threadData.annotation_id,
              status: threadData.status as AnnotationStatus,
              createdAt: new Date(threadData.created_at).getTime(),
              updatedAt: new Date(threadData.updated_at).getTime(),
              createdBy: threadData.created_by,
              comments: (commentsData || []).map((comment: any) => ({
                id: comment.id,
                threadId: comment.thread_id,
                authorId: comment.author_id,
                authorName: comment.author_name,
                authorAvatar: comment.author_avatar || undefined,
                content: comment.content,
                mentions: comment.mentions || [],
                createdAt: new Date(comment.created_at).getTime(),
                updatedAt: comment.updated_at ? new Date(comment.updated_at).getTime() : undefined,
                parentId: comment.parent_id || undefined,
              })),
            };

            set((state) => {
              const existingIndex = state.threads.findIndex(t => t.id === threadId);
              if (existingIndex >= 0) {
                const updated = [...state.threads];
                updated[existingIndex] = thread;
                return { threads: updated, loading: false };
              }
              return { threads: [...state.threads, thread], loading: false };
            });
          } catch (err) {
            console.error('Failed to load thread:', err);
            set({ error: 'Failed to load thread', loading: false });
          }
        },

        clearThreads: () => set({ threads: [], error: null }),
      }),
      { name: 'comment-store' }
    )
  )
);
