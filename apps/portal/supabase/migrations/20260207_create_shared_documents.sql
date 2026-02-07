-- Migration: Create shared_documents table for NanoID-based sharing
-- Created: 2026-02-07
-- Description: Enables shareable links with NanoID slugs (COLL-03)

-- Create shared_documents table
CREATE TABLE IF NOT EXISTS shared_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_shared_documents_slug ON shared_documents(slug);
CREATE INDEX IF NOT EXISTS idx_shared_documents_document_id ON shared_documents(document_id);

-- Enable Row Level Security (optional - can be enabled later for per-document permissions)
-- ALTER TABLE shared_documents ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access to shared documents
-- CREATE POLICY "Public documents are viewable by everyone"
--   ON shared_documents FOR SELECT
--   USING (is_public = true);

-- Create policy for authenticated users to create shares
-- CREATE POLICY "Authenticated users can create shares"
--   ON shared_documents FOR INSERT
--   WITH CHECK (auth.uid() IS NOT NULL);
