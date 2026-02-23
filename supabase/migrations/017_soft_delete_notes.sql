-- Migration: Add soft delete support for notes
-- Adds deleted_at column and updates RLS policies to filter deleted notes

-- Add deleted_at column
ALTER TABLE notes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Partial index for efficient trash queries
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at
  ON notes(deleted_at)
  WHERE deleted_at IS NOT NULL;

-- Update the existing SELECT policy to exclude soft-deleted notes by default
DROP POLICY IF EXISTS "Users can view notes in their org" ON notes;
CREATE POLICY "Users can view notes in their org"
  ON notes FOR SELECT
  USING (
    deleted_at IS NULL
    AND org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Separate policy for viewing trashed notes (soft-deleted)
CREATE POLICY "Users can view trashed notes in their org"
  ON notes FOR SELECT
  USING (
    deleted_at IS NOT NULL
    AND org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  );

-- Ensure UPDATE policy allows setting deleted_at (soft delete/restore)
DROP POLICY IF EXISTS "Users can update notes in their org" ON notes;
CREATE POLICY "Users can update notes in their org"
  ON notes FOR UPDATE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));

-- Ensure DELETE policy exists for hard delete (purge)
DROP POLICY IF EXISTS "Users can delete notes in their org" ON notes;
CREATE POLICY "Users can delete notes in their org"
  ON notes FOR DELETE
  USING (org_id IN (SELECT org_id FROM users WHERE id = auth.uid()));
