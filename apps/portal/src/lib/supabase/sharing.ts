/**
 * Sharing Functions
 *
 * Supabase operations for shareable links.
 * Stores share_hash (slug) and marks documents as public.
 */

import { supabase } from "@obsidian-note-reviewer/security/supabase/client";
import { generateSlug, isSlugValid, getShareUrl } from "@/lib/slugGenerator";
import type { SharedDocument } from "./types";

/**
 * Shared document result with document data
 */
export interface SharedDocumentResult {
  id: string;
  document_id: string;
  slug: string;
  is_public: boolean;
  created_at: string;
  document?: {
    id: string;
    title: string;
    content: string;
    annotations?: any[];
  };
}

/**
 * Create shareable link for a document
 * Returns: slug for the shared document
 */
export async function createSharedLink(documentId: string): Promise<{ slug: string; url: string }> {
  // Generate unique slug
  const slug = generateSlug();

  // Check if slug already exists (collision handling)
  const { data: existing } = await supabase
    .from("shared_documents")
    .select("slug")
    .eq("slug", slug)
    .single();

  if (existing) {
    // Retry with new slug (extremely rare collision)
    return createSharedLink(documentId);
  }

  // Create shared document record
  const { error } = await supabase
    .from("shared_documents")
    .insert({
      document_id: documentId,
      slug: slug,
      is_public: true,
      created_at: new Date().toISOString(),
    });

  if (error) {
    console.error("Failed to create shared link:", error);
    throw new Error("Could not create shareable link");
  }

  return {
    slug,
    url: getShareUrl(slug),
  };
}

/**
 * Get document by slug (for SharedDocument page)
 */
export async function getDocumentBySlug(slug: string): Promise<SharedDocumentResult> {
  if (!isSlugValid(slug)) {
    throw new Error("Invalid slug format");
  }

  const { data, error } = await supabase
    .from("shared_documents")
    .select(`
      *,
      document:documents(*)
    `)
    .eq("slug", slug)
    .eq("is_public", true)
    .single();

  if (error || !data) {
    throw new Error("Document not found or link expired");
  }

  return data as SharedDocumentResult;
}

/**
 * Check if document is already shared
 */
export async function getExistingShare(documentId: string): Promise<string | null> {
  const { data } = await supabase
    .from("shared_documents")
    .select("slug")
    .eq("document_id", documentId)
    .eq("is_public", true)
    .single();

  return data?.slug || null;
}
