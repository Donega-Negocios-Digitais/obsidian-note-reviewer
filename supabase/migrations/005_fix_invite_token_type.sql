-- Fix: accept_document_invite parameter type mismatch
-- The token column in document_invites is TEXT (hex-encoded 64 chars),
-- but the function parameter was declared as UUID, causing silent comparison failures.
-- This recreates the function with the correct TEXT parameter type.

CREATE OR REPLACE FUNCTION accept_document_invite(invite_token TEXT, user_uuid UUID)
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
