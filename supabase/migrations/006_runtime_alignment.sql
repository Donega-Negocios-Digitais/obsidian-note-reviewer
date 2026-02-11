-- Runtime alignment for collaboration, comments, activity feed and subscription history

-- ---------------------------------------------------------------------------
-- Document versions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  change_description TEXT,
  annotation_ids TEXT[] NOT NULL DEFAULT '{}',
  version_number INTEGER NOT NULL DEFAULT 1,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_document_versions_document_id
  ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_document_version
  ON document_versions(document_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_by
  ON document_versions(created_by);
CREATE INDEX IF NOT EXISTS idx_document_versions_deleted
  ON document_versions(deleted);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view versions for accessible notes" ON document_versions;
CREATE POLICY "Users can view versions for accessible notes"
  ON document_versions FOR SELECT
  USING (has_note_access(document_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can create versions for accessible notes" ON document_versions;
CREATE POLICY "Users can create versions for accessible notes"
  ON document_versions FOR INSERT
  WITH CHECK (has_note_access(document_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can update own versions" ON document_versions;
CREATE POLICY "Users can update own versions"
  ON document_versions FOR UPDATE
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own versions" ON document_versions;
CREATE POLICY "Users can delete own versions"
  ON document_versions FOR DELETE
  USING (created_by = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- Comment threads and comments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS comment_threads (
  id TEXT PRIMARY KEY,
  annotation_id UUID NOT NULL REFERENCES annotations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'OPEN',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  thread_id TEXT NOT NULL REFERENCES comment_threads(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  content TEXT NOT NULL,
  mentions TEXT[] NOT NULL DEFAULT '{}',
  parent_id TEXT REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comment_threads_annotation_id
  ON comment_threads(annotation_id);
CREATE INDEX IF NOT EXISTS idx_comment_threads_created_by
  ON comment_threads(created_by);
CREATE INDEX IF NOT EXISTS idx_comments_thread_id
  ON comments(thread_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id
  ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id
  ON comments(parent_id);

ALTER TABLE comment_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view comment threads on accessible notes" ON comment_threads;
CREATE POLICY "Users can view comment threads on accessible notes"
  ON comment_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM annotations a
      JOIN notes n ON n.id = a.note_id
      WHERE a.id = comment_threads.annotation_id
        AND has_note_access(n.id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can create comment threads on accessible notes" ON comment_threads;
CREATE POLICY "Users can create comment threads on accessible notes"
  ON comment_threads FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM annotations a
      JOIN notes n ON n.id = a.note_id
      WHERE a.id = comment_threads.annotation_id
        AND has_note_access(n.id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update own comment threads" ON comment_threads;
CREATE POLICY "Users can update own comment threads"
  ON comment_threads FOR UPDATE
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comment threads" ON comment_threads;
CREATE POLICY "Users can delete own comment threads"
  ON comment_threads FOR DELETE
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view comments on accessible notes" ON comments;
CREATE POLICY "Users can view comments on accessible notes"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM comment_threads ct
      JOIN annotations a ON a.id = ct.annotation_id
      JOIN notes n ON n.id = a.note_id
      WHERE ct.id = comments.thread_id
        AND has_note_access(n.id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can create comments on accessible notes" ON comments;
CREATE POLICY "Users can create comments on accessible notes"
  ON comments FOR INSERT
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM comment_threads ct
      JOIN annotations a ON a.id = ct.annotation_id
      JOIN notes n ON n.id = a.note_id
      WHERE ct.id = comments.thread_id
        AND has_note_access(n.id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments"
  ON comments FOR UPDATE
  USING (author_id = (SELECT auth.uid()))
  WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (author_id = (SELECT auth.uid()));

DROP TRIGGER IF EXISTS update_comment_threads_updated_at ON comment_threads;
CREATE TRIGGER update_comment_threads_updated_at
  BEFORE UPDATE ON comment_threads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Activities
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_avatar TEXT,
  target_id UUID,
  target_title TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activities_org_timestamp
  ON activities(org_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_target
  ON activities(target_id);
CREATE INDEX IF NOT EXISTS idx_activities_user
  ON activities(user_id);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org activities" ON activities;
CREATE POLICY "Users can view org activities"
  ON activities FOR SELECT
  USING (
    org_id IN (
      SELECT u.org_id
      FROM users u
      WHERE u.id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can create org activities" ON activities;
CREATE POLICY "Users can create org activities"
  ON activities FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND org_id IN (
      SELECT u.org_id
      FROM users u
      WHERE u.id = (SELECT auth.uid())
    )
  );

-- ---------------------------------------------------------------------------
-- Subscription history
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_tier plan_tier,
  to_tier plan_tier NOT NULL,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_created
  ON subscription_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscription_history_event_type
  ON subscription_history(event_type);

ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription history" ON subscription_history;
CREATE POLICY "Users can view own subscription history"
  ON subscription_history FOR SELECT
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own subscription history" ON subscription_history;
CREATE POLICY "Users can insert own subscription history"
  ON subscription_history FOR INSERT
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ---------------------------------------------------------------------------
-- Index missing from advisor
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notes_updated_by
  ON notes(updated_by);

