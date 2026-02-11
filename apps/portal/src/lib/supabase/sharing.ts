/**
 * Sharing Functions
 *
 * Supabase operations for shareable links.
 * Uses notes.share_hash (slug) and notes.is_public.
 */

import { supabase } from "@obsidian-note-reviewer/security/supabase/client";
import { generateSlug, isSlugValid, getShareUrl } from "@/lib/slugGenerator";

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
  const existingShare = await getExistingShare(documentId);
  if (existingShare) {
    return {
      slug: existingShare,
      url: getShareUrl(existingShare),
    };
  }

  // Generate unique slug
  const slug = await generateUniqueSlug();

  // Store sharing state on notes table (canonical sharing model)
  const { error } = await supabase
    .from("notes")
    .update({
      is_public: true,
      share_hash: slug,
      updated_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .select("id")
    .single();

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

  const { data: note, error } = await supabase
    .from("notes")
    .select("id, title, content, is_public, share_hash, created_at")
    .eq("share_hash", slug)
    .eq("is_public", true)
    .maybeSingle();

  if (error || !note) {
    throw new Error("Document not found or link expired");
  }

  const { data: annotations } = await supabase
    .from("annotations")
    .select("*")
    .eq("note_id", note.id)
    .order("created_at", { ascending: true });

  return {
    id: note.id,
    document_id: note.id,
    slug: note.share_hash || slug,
    is_public: note.is_public,
    created_at: note.created_at,
    document: {
      id: note.id,
      title: note.title,
      content: note.content,
      annotations: annotations || [],
    },
  };
}

/**
 * Check if document is already shared
 */
export async function getExistingShare(documentId: string): Promise<string | null> {
  const { data } = await supabase
    .from("notes")
    .select("share_hash, is_public")
    .eq("id", documentId)
    .eq("is_public", true)
    .not("share_hash", "is", null)
    .maybeSingle();

  return data?.share_hash || null;
}

async function generateUniqueSlug(attempts = 5): Promise<string> {
  if (attempts <= 0) {
    throw new Error("Could not generate a unique share slug");
  }

  const slug = generateSlug();
  const { data } = await supabase
    .from("notes")
    .select("id")
    .eq("share_hash", slug)
    .maybeSingle();

  if (data) {
    return generateUniqueSlug(attempts - 1);
  }

  return slug;
}
