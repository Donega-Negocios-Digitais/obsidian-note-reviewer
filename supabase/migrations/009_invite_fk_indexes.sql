-- Covering indexes for invited_by foreign keys

CREATE INDEX IF NOT EXISTS idx_document_collaborators_invited_by
  ON document_collaborators(invited_by);

CREATE INDEX IF NOT EXISTS idx_document_invites_invited_by
  ON document_invites(invited_by);

