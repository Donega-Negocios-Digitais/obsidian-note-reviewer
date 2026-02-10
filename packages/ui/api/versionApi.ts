/**
 * API functions for document version CRUD operations
 */

import { supabase } from '../lib/supabase';
import type {
  DocumentVersion,
  CreateVersionRequest,
  VersionListResponse,
} from '../types/version';

const MAX_VERSIONS_PER_DOCUMENT = 50;

/**
 * Creates a new document version
 *
 * @param request - Version creation request
 * @returns The created version or null if failed
 */
export async function createVersion(request: CreateVersionRequest): Promise<DocumentVersion | null> {
  try {
    // Apply retention policy before creating new version
    await applyRetentionPolicy(request.documentId);

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

    return {
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
  } catch (error) {
    console.error('Error creating version:', error);
    return null;
  }
}

/**
 * Fetches versions for a document with pagination
 *
 * @param documentId - Document ID
 * @param page - Page number (1-indexed)
 * @param limit - Number of versions per page
 * @returns Version list response
 */
export async function getVersions(
  documentId: string,
  page: number = 1,
  limit: number = 20
): Promise<VersionListResponse> {
  try {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    const { data, error, count } = await supabase
      .from('document_versions')
      .select('*', { count: 'exact' })
      .eq('document_id', documentId)
      .eq('deleted', false)
      .order('version_number', { ascending: false })
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

    return {
      versions,
      total,
      hasMore,
    };
  } catch (error) {
    console.error('Error fetching versions:', error);
    return { versions: [], total: 0, hasMore: false };
  }
}

/**
 * Fetches a single version by ID
 *
 * @param versionId - Version ID
 * @returns The version or null if not found
 */
export async function getVersion(versionId: string): Promise<DocumentVersion | null> {
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
      return null;
    }

    return {
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
  } catch (error) {
    console.error('Error fetching version:', error);
    return null;
  }
}

/**
 * Soft deletes a version (marks as deleted)
 *
 * @param versionId - Version ID
 * @returns True if successful, false otherwise
 */
export async function deleteVersion(versionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('document_versions')
      .update({ deleted: true })
      .eq('id', versionId);

    if (error) {
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error deleting version:', error);
    return false;
  }
}

/**
 * Restores a document to a previous version
 *
 * @param versionId - Version ID to restore
 * @param documentId - Document ID to restore to
 * @param userId - User ID performing the restore
 * @returns The new version ID created after restore, or null if failed
 */
export async function restoreVersion(
  versionId: string,
  documentId: string,
  userId: string
): Promise<string | null> {
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

    // Get the next version number
    const { count: versionCount } = await supabase
      .from('document_versions')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', documentId)
      .eq('deleted', false);

    // Create a new version for the restore action
    const restoreDescription = `Restored from version ${version.version_number}`;

    const { data: newVersion, error: createError } = await supabase
      .from('document_versions')
      .insert({
        document_id: documentId,
        content: version.content,
        created_by: userId,
        change_description: restoreDescription,
        annotation_ids: version.annotation_ids,
        version_number: (versionCount || 0) + 1,
        metadata: {
          ...(version.metadata as Record<string, unknown> | undefined),
          restoredFrom: versionId,
        },
        deleted: false,
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    return newVersion?.id || null;
  } catch (error) {
    console.error('Error restoring version:', error);
    return null;
  }
}

/**
 * Applies retention policy by soft-deleting old versions beyond MAX_VERSIONS_PER_DOCUMENT
 *
 * @param documentId - Document ID
 * @returns Number of versions deleted
 */
async function applyRetentionPolicy(documentId: string): Promise<number> {
  try {
    // Get all versions, ordered by creation date (newest first)
    const { data: existingVersions, error } = await supabase
      .from('document_versions')
      .select('id, created_at')
      .eq('document_id', documentId)
      .eq('deleted', false)
      .order('version_number', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(MAX_VERSIONS_PER_DOCUMENT + 1);

    if (error) {
      console.error('Error checking version count for retention:', error);
      return 0;
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

      return versionsToDelete.length;
    }

    return 0;
  } catch (error) {
    console.error('Error applying retention policy:', error);
    return 0;
  }
}

/**
 * Gets version statistics for a document
 *
 * @param documentId - Document ID
 * @returns Version count and latest version info
 */
export async function getVersionStats(documentId: string): Promise<{
  count: number;
  latestVersion: DocumentVersion | null;
}> {
  try {
    const { data, count } = await supabase
      .from('document_versions')
      .select('*', { count: 'exact' })
      .eq('document_id', documentId)
      .eq('deleted', false)
      .order('version_number', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1);

    const latestVersion = data && data.length > 0 ? {
      id: data[0].id,
      documentId: data[0].document_id,
      content: data[0].content,
      createdAt: new Date(data[0].created_at).getTime(),
      createdBy: data[0].created_by,
      changeDescription: data[0].change_description || undefined,
      annotationIds: data[0].annotation_ids || [],
      versionNumber: data[0].version_number,
      metadata: (data[0].metadata as DocumentVersion['metadata']) || undefined,
    } : null;

    return {
      count: count || 0,
      latestVersion,
    };
  } catch (error) {
    console.error('Error getting version stats:', error);
    return { count: 0, latestVersion: null };
  }
}
