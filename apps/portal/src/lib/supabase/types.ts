/**
 * Supabase Types
 *
 * Type definitions for Supabase tables.
 */

export interface SharedDocument {
  id: string;
  document_id: string;
  slug: string;
  is_public: boolean;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  annotations?: any[];
  created_at?: string;
}
