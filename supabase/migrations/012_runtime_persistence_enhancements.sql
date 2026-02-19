-- Runtime persistence enhancements
-- - stable note identity by source path
-- - soft delete support for annotations/comments
-- - image annotation payload columns
-- - client-side annotation identity mapping

-- ---------------------------------------------------------------------------
-- Notes: stable identity by source path
-- ---------------------------------------------------------------------------
ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS source_path TEXT;

UPDATE notes
SET source_path = slug
WHERE source_path IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notes_org_source_path_unique
  ON notes(org_id, source_path)
  WHERE source_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notes_source_path
  ON notes(source_path);

-- ---------------------------------------------------------------------------
-- Annotations: soft delete + image payload + client identity
-- ---------------------------------------------------------------------------
ALTER TABLE annotations
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE annotations
  ADD COLUMN IF NOT EXISTS data_json JSONB;

ALTER TABLE annotations
  ADD COLUMN IF NOT EXISTS rendered_image_url TEXT;

ALTER TABLE annotations
  ADD COLUMN IF NOT EXISTS client_id TEXT;

CREATE INDEX IF NOT EXISTS idx_annotations_note_created_at
  ON annotations(note_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_annotations_deleted_at
  ON annotations(deleted_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_annotations_note_client_id_unique
  ON annotations(note_id, client_id)
  WHERE client_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Comments: soft delete
-- ---------------------------------------------------------------------------
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_comments_thread_created_at
  ON comments(thread_id, created_at);

CREATE INDEX IF NOT EXISTS idx_comments_deleted_at
  ON comments(deleted_at);

-- ---------------------------------------------------------------------------
-- Storage buckets
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT
  'avatars',
  'avatars',
  TRUE,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'avatars'
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT
  'notes-images',
  'notes-images',
  TRUE,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'notes-images'
);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT
  'annotated',
  'annotated',
  TRUE,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/webp']
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'annotated'
);
