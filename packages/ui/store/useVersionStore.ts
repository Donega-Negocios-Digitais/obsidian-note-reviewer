/**
 * Zustand store for document version management
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  DocumentVersion,
  CreateVersionRequest,
  VersionDiff,
  VersionListResponse,
} from '../types/version';
import { supabase } from '../lib/supabase';

interface VersionState {
  versions: DocumentVersion[];
  currentVersionId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createVersion: (request: CreateVersionRequest) => Promise<DocumentVersion | null>;
  getVersionsForDocument: (documentId: string, page?: number, limit?: number) => Promise<VersionListResponse>;
  getVersion: (versionId: string) => Promise<DocumentVersion | null>;
  restoreVersion: (versionId: string, documentId: string) => Promise<string | null>;
  compareVersions: (versionId1: string, versionId2: string) => Promise<VersionDiff | null>;
  deleteVersion: (versionId: string) => Promise<boolean>;
  clearVersions: () => void;
  setError: (error: string | null) => void;
}

const MAX_VERSIONS_PER_DOCUMENT = 50;

export const useVersionStore = create<VersionState>()(
  devtools(
    (set, get) => ({
      versions: [],
      currentVersionId: null,
      isLoading: false,
      error: null,

      createVersion: async (request: CreateVersionRequest) => {
        set({ isLoading: true, error: null });

        try {
          // First, check if we need to apply retention policy
          const { data: existingVersions, error: countError } = await supabase
            .from('document_versions')
            .select('id, created_at')
            .eq('document_id', request.documentId)
            .order('created_at', { ascending: false })
            .limit(MAX_VERSIONS_PER_DOCUMENT + 1);

          if (countError) {
            console.error('Error checking version count:', countError);
          }

          // If we have more than MAX_VERSIONS, delete the oldest ones
          if (existingVersions && existingVersions.length > MAX_VERSIONS_PER_DOCUMENT) {
            const versionsToDelete = existingVersions.slice(MAX_VERSIONS_PER_DOCUMENT);
            for (const version of versionsToDelete) {
              await supabase
                .from('document_versions')
                .update({ deleted: true })
                .eq('id', version.id);
            }
          }

          // Get the next version number
          const { count: versionCount } = await supabase
            .from('document_versions')
            .select('*', { count: 'exact', head: true })
            .eq('document_id', request.documentId)
            .eq('deleted', false);

          const versionNumber = (versionCount || 0) + 1;

          // Create the new version
          const { data, error } = await supabase
            .from('document_versions')
            .insert({
              document_id: request.documentId,
              content: request.content,
              created_by: request.userId,
              change_description: request.description,
              annotation_ids: request.annotationIds,
              version_number: versionNumber,
              metadata: request.metadata || {},
              deleted: false,
            })
            .select()
            .single();

          if (error) {
            throw error;
          }

          if (!data) {
            throw new Error('Failed to create version: No data returned');
          }

          const newVersion: DocumentVersion = {
            id: data.id,
            documentId: data.document_id,
            content: data.content,
            createdAt: new Date(data.created_at).getTime(),
            createdBy: data.created_by,
            changeDescription: data.change_description || undefined,
            annotationIds: data.annotation_ids || [],
            versionNumber: data.version_number,
            metadata: (data.metadata as DocumentVersion['metadata']) || undefined,
          };

          // Add to local state
          set((state) => ({
            versions: [newVersion, ...state.versions],
            currentVersionId: newVersion.id,
            isLoading: false,
          }));

          return newVersion;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create version';
          set({ error: errorMessage, isLoading: false });
          console.error('Error creating version:', error);
          return null;
        }
      },

      getVersionsForDocument: async (
        documentId: string,
        page: number = 1,
        limit: number = 20
      ): Promise<VersionListResponse> => {
        set({ isLoading: true, error: null });

        try {
          const from = (page - 1) * limit;
          const to = from + limit - 1;

          const { data, error, count } = await supabase
            .from('document_versions')
            .select('*', { count: 'exact' })
            .eq('document_id', documentId)
            .eq('deleted', false)
            .order('created_at', { ascending: false })
            .range(from, to);

          if (error) {
            throw error;
          }

          const versions: DocumentVersion[] = (data || []).map((v) => ({
            id: v.id,
            documentId: v.document_id,
            content: v.content,
            createdAt: new Date(v.created_at).getTime(),
            createdBy: v.created_by,
            changeDescription: v.change_description || undefined,
            annotationIds: v.annotation_ids || [],
            versionNumber: v.version_number,
            metadata: (v.metadata as DocumentVersion['metadata']) || undefined,
          }));

          const total = count || 0;
          const hasMore = from + limit < total;

          set({ versions, isLoading: false });

          return {
            versions,
            total,
            hasMore,
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch versions';
          set({ error: errorMessage, isLoading: false, versions: [] });
          console.error('Error fetching versions:', error);
          return { versions: [], total: 0, hasMore: false };
        }
      },

      getVersion: async (versionId: string): Promise<DocumentVersion | null> => {
        set({ isLoading: true, error: null });

        try {
          const { data, error } = await supabase
            .from('document_versions')
            .select('*')
            .eq('id', versionId)
            .eq('deleted', false)
            .single();

          if (error) {
            throw error;
          }

          if (!data) {
            set({ isLoading: false });
            return null;
          }

          const version: DocumentVersion = {
            id: data.id,
            documentId: data.document_id,
            content: data.content,
            createdAt: new Date(data.created_at).getTime(),
            createdBy: data.created_by,
            changeDescription: data.change_description || undefined,
            annotationIds: data.annotation_ids || [],
            versionNumber: data.version_number,
            metadata: (data.metadata as DocumentVersion['metadata']) || undefined,
          };

          set({ isLoading: false });
          return version;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch version';
          set({ error: errorMessage, isLoading: false });
          console.error('Error fetching version:', error);
          return null;
        }
      },

      restoreVersion: async (versionId: string, documentId: string): Promise<string | null> => {
        set({ isLoading: true, error: null });

        try {
          // First get the version to restore
          const { data: version, error: versionError } = await supabase
            .from('document_versions')
            .select('*')
            .eq('id', versionId)
            .eq('deleted', false)
            .single();

          if (versionError || !version) {
            throw versionError || new Error('Version not found');
          }

          // Update the document with the restored content
          // Assuming documents are stored in 'notes' table
          const { error: updateError } = await supabase
            .from('notes')
            .update({
              markdown: version.content,
              updated_at: new Date().toISOString(),
            })
            .eq('id', documentId);

          if (updateError) {
            throw updateError;
          }

          // Create a new version for the restore action
          const restoreDescription = `Restored from version ${version.version_number}`;

          // Create the restore version
          const { data: newVersion, error: createError } = await supabase
            .from('document_versions')
            .insert({
              document_id: documentId,
              content: version.content,
              created_by: version.created_by,
              change_description: restoreDescription,
              annotation_ids: version.annotation_ids,
              version_number: version.version_number + 1,
              metadata: {
                ...version.metadata,
                restoredFrom: versionId,
              },
              deleted: false,
            })
            .select()
            .single();

          if (createError) {
            throw createError;
          }

          set({ isLoading: false });
          return newVersion.id;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to restore version';
          set({ error: errorMessage, isLoading: false });
          console.error('Error restoring version:', error);
          return null;
        }
      },

      compareVersions: async (versionId1: string, versionId2: string): Promise<VersionDiff | null> => {
        set({ isLoading: true, error: null });

        try {
          // Fetch both versions
          const [v1Result, v2Result] = await Promise.all([
            supabase.from('document_versions').select('*').eq('id', versionId1).eq('deleted', false).single(),
            supabase.from('document_versions').select('*').eq('id', versionId2).eq('deleted', false).single(),
          ]);

          if (v1Result.error || v2Result.error || !v1Result.data || !v2Result.data) {
            throw new Error('Failed to fetch versions for comparison');
          }

          // Generate diff using the diffGenerator utility
          const { generateDiff } = await import('../utils/diffGenerator');
          const changes = generateDiff(v1Result.data.content, v2Result.data.content);

          const diff: VersionDiff = {
            oldVersionId: versionId1,
            newVersionId: versionId2,
            changes,
            createdAt: Date.now(),
          };

          set({ isLoading: false });
          return diff;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to compare versions';
          set({ error: errorMessage, isLoading: false });
          console.error('Error comparing versions:', error);
          return null;
        }
      },

      deleteVersion: async (versionId: string): Promise<boolean> => {
        set({ isLoading: true, error: null });

        try {
          // Soft delete
          const { error } = await supabase
            .from('document_versions')
            .update({ deleted: true })
            .eq('id', versionId);

          if (error) {
            throw error;
          }

          // Remove from local state
          set((state) => ({
            versions: state.versions.filter((v) => v.id !== versionId),
            isLoading: false,
          }));

          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to delete version';
          set({ error: errorMessage, isLoading: false });
          console.error('Error deleting version:', error);
          return false;
        }
      },

      clearVersions: () => {
        set({ versions: [], currentVersionId: null, error: null });
      },

      setError: (error: string | null) => {
        set({ error });
      },
    }),
    { name: 'version-store' }
  )
);
