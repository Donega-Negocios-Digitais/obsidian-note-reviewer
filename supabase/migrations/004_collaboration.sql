-- Collaboration Schema for Obsidian Note Reviewer
-- Adds document-level collaboration and invite management

-- Document Collaborators Table
-- Manages who has access to each document and their role
CREATE TABLE document_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'viewer', -- owner, editor, viewer
  status TEXT NOT NULL DEFAULT 'active', -- active, pending, removed
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(note_id, user_id)
);

-- Document Invites Table
-- Manages pending invites for documents
CREATE TABLE document_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer', -- editor, viewer
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, expired, cancelled
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_document_collaborators_note_id ON document_collaborators(note_id);
CREATE INDEX idx_document_collaborators_user_id ON document_collaborators(user_id);
CREATE INDEX idx_document_collaborators_status ON document_collaborators(status);
CREATE INDEX idx_document_invites_note_id ON document_invites(note_id);
CREATE INDEX idx_document_invites_token ON document_invites(token);
CREATE INDEX idx_document_invites_status ON document_invites(status);
CREATE INDEX idx_document_invites_email ON document_invites(email);

-- Enable Row Level Security
ALTER TABLE document_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_invites ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Document Collaborators
CREATE POLICY "Users can view collaborators on accessible notes"
  ON document_collaborators FOR SELECT
  USING (
    note_id IN (
      SELECT id FROM notes
      WHERE org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
         OR is_public = true
    )
  );

CREATE POLICY "Users can insert collaborators for notes they own"
  ON document_collaborators FOR INSERT
  WITH CHECK (
    note_id IN (
      SELECT id FROM notes
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update collaborators they invited"
  ON document_collaborators FOR UPDATE
  USING (
    invited_by = auth.uid()
    OR note_id IN (SELECT id FROM notes WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can remove collaborators they invited"
  ON document_collaborators FOR DELETE
  USING (
    invited_by = auth.uid()
    OR note_id IN (SELECT id FROM notes WHERE created_by = auth.uid())
  );

-- RLS Policies for Document Invites
CREATE POLICY "Users can view invites for notes they own"
  ON document_invites FOR SELECT
  USING (
    note_id IN (
      SELECT id FROM notes
      WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Users can create invites for notes they own"
  ON document_invites FOR INSERT
  WITH CHECK (
    invited_by = auth.uid()
    AND note_id IN (SELECT id FROM notes WHERE created_by = auth.uid())
  );

CREATE POLICY "Users can update invites they created"
  ON document_invites FOR UPDATE
  USING (invited_by = auth.uid());

CREATE POLICY "Users can delete invites they created"
  ON document_invites FOR DELETE
  USING (invited_by = auth.uid());

-- Function to check if user has access to a note
CREATE OR REPLACE FUNCTION has_note_access(note_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  is_owner BOOLEAN;
  is_collaborator BOOLEAN;
  is_public BOOLEAN;
BEGIN
  -- Check if user created the note
  SELECT EXISTS(
    SELECT 1 FROM notes WHERE id = note_uuid AND created_by = user_uuid
  ) INTO is_owner;

  -- Check if user is a collaborator
  SELECT EXISTS(
    SELECT 1 FROM document_collaborators
    WHERE note_id = note_uuid AND user_id = user_uuid AND status = 'active'
  ) INTO is_collaborator;

  -- Check if note is public
  SELECT is_public FROM notes WHERE id = note_uuid INTO is_public;

  RETURN COALESCE(is_owner, FALSE) OR COALESCE(is_collaborator, FALSE) OR COALESCE(is_public, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's role on a note
CREATE OR REPLACE FUNCTION get_note_role(note_uuid UUID, user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  note_role TEXT;
BEGIN
  -- Check if user is the creator
  IF EXISTS(SELECT 1 FROM notes WHERE id = note_uuid AND created_by = user_uuid) THEN
    RETURN 'owner';
  END IF;

  -- Check collaborator role
  SELECT role INTO note_role
  FROM document_collaborators
  WHERE note_id = note_uuid AND user_id = user_uuid AND status = 'active';

  RETURN COALESCE(note_role, 'none');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to invite user to a document
CREATE OR REPLACE FUNCTION invite_to_document(
  note_uuid UUID,
  invite_email TEXT,
  invite_role TEXT,
  inviter_uuid UUID
)
RETURNS UUID AS $$
DECLARE
  new_invite_id UUID;
  user_exists BOOLEAN;
  existing_user_id UUID;
BEGIN
  -- Check if inviter has permission (owner or can invite)
  IF NOT has_note_access(note_uuid, inviter_uuid) THEN
    RAISE EXCEPTION 'You do not have permission to invite users to this document';
  END IF;

  -- Check if user already exists
  SELECT id, EXISTS(SELECT 1 FROM users WHERE email = invite_email)
  INTO existing_user_id, user_exists
  FROM users WHERE email = invite_email LIMIT 1;

  -- Create invite
  INSERT INTO document_invites (note_id, email, role, invited_by)
  VALUES (note_uuid, invite_email, invite_role, inviter_uuid)
  RETURNING id INTO new_invite_id;

  -- If user exists, add them as collaborator directly
  IF user_exists AND existing_user_id IS NOT NULL THEN
    INSERT INTO document_collaborators (note_id, user_id, role, invited_by, status)
    VALUES (note_uuid, existing_user_id, invite_role, inviter_uuid, 'active')
    ON CONFLICT (note_id, user_id) DO UPDATE SET
      role = EXCLUDED.role,
      status = 'active',
      updated_at = NOW();

    -- Mark invite as accepted
    UPDATE document_invites
    SET status = 'accepted', accepted_at = NOW()
    WHERE id = new_invite_id;
  END IF;

  RETURN new_invite_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept an invite
CREATE OR REPLACE FUNCTION accept_document_invite(invite_token UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  invite_record RECORD;
  user_record RECORD;
BEGIN
  -- Get invite
  SELECT * INTO invite_record
  FROM document_invites
  WHERE token = invite_token AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or already processed';
  END IF;

  -- Check if expired
  IF invite_record.expires_at < NOW() THEN
    UPDATE document_invites SET status = 'expired' WHERE id = invite_record.id;
    RAISE EXCEPTION 'Invite has expired';
  END IF;

  -- Get or create user
  SELECT * INTO user_record FROM users WHERE id = user_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Verify email matches
  IF user_record.email != invite_record.email THEN
    RAISE EXCEPTION 'Invite email does not match your email';
  END IF;

  -- Add as collaborator
  INSERT INTO document_collaborators (note_id, user_id, role, invited_by, status, accepted_at)
  VALUES (
    invite_record.note_id,
    user_uuid,
    invite_record.role,
    invite_record.invited_by,
    'active',
    NOW()
  )
  ON CONFLICT (note_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = 'active',
    accepted_at = NOW(),
    updated_at = NOW();

  -- Mark invite as accepted
  UPDATE document_invites
  SET status = 'accepted', accepted_at = NOW()
  WHERE id = invite_record.id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at
CREATE TRIGGER update_document_collaborators_updated_at
  BEFORE UPDATE ON document_collaborators
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_invites_updated_at
  BEFORE UPDATE ON document_invites
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant usage on functions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON FUNCTION has_note_access TO authenticated;
GRANT EXECUTE ON FUNCTION get_note_role TO authenticated;
GRANT EXECUTE ON FUNCTION invite_to_document TO authenticated;
GRANT EXECUTE ON FUNCTION accept_document_invite TO authenticated;

-- Comments for documentation
COMMENT ON TABLE document_collaborators IS 'Manages collaborators on documents with their roles and status';
COMMENT ON TABLE document_invites IS 'Manages pending invites for document collaboration';
COMMENT ON FUNCTION has_note_access IS 'Checks if a user has access to a note (owner, collaborator, or public)';
COMMENT ON FUNCTION get_note_role IS 'Returns the user role on a note (owner, editor, viewer, or none)';
COMMENT ON FUNCTION invite_to_document IS 'Creates an invite for a user to collaborate on a document';
COMMENT ON FUNCTION accept_document_invite IS 'Accepts a pending invite and adds user as collaborator';
