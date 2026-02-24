-- Harden collaboration invite flows for accounts that still need auth/public user relinking.
-- Fixes FK errors such as:
--   insert or update on table "document_collaborators" violates foreign key constraint "document_collaborators_user_id_fkey"

CREATE OR REPLACE FUNCTION public.create_document_invite(
  note_uuid UUID,
  invite_email TEXT,
  invite_role TEXT DEFAULT 'viewer',
  invite_capabilities JSONB DEFAULT '{"hooks":false,"integrations":false,"automations":false,"invite":false,"manage_permissions":false}'::jsonb
)
RETURNS TABLE (
  invite_id UUID,
  invite_token TEXT,
  note_id UUID,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  linked_user_id UUID;
  normalized_email TEXT;
  normalized_role TEXT;
  normalized_capabilities JSONB;
  invite_record public.document_invites%ROWTYPE;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  linked_user_id := public.ensure_public_user_linked(caller_id);
  IF linked_user_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve current user profile';
  END IF;

  normalized_email := LOWER(TRIM(invite_email));
  normalized_role := LOWER(COALESCE(invite_role, 'viewer'));
  normalized_capabilities := COALESCE(invite_capabilities, '{}'::jsonb);

  normalized_capabilities := jsonb_build_object(
    'hooks', COALESCE(normalized_capabilities ->> 'hooks', 'false')::BOOLEAN,
    'integrations', COALESCE(normalized_capabilities ->> 'integrations', 'false')::BOOLEAN,
    'automations', COALESCE(normalized_capabilities ->> 'automations', 'false')::BOOLEAN,
    'invite', COALESCE(normalized_capabilities ->> 'invite', 'false')::BOOLEAN,
    'manage_permissions', COALESCE(normalized_capabilities ->> 'manage_permissions', 'false')::BOOLEAN
  );

  IF normalized_email IS NULL OR normalized_email = '' THEN
    RAISE EXCEPTION 'Invite email is required';
  END IF;

  IF normalized_role NOT IN ('editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role. Allowed roles: editor, viewer';
  END IF;

  IF NOT public.can_manage_collaborators(note_uuid, linked_user_id) THEN
    RAISE EXCEPTION 'You do not have permission to invite collaborators';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.document_collaborators dc
    JOIN public.users u ON u.id = dc.user_id
    WHERE dc.note_id = note_uuid
      AND dc.status = 'active'
      AND LOWER(u.email) = normalized_email
  ) THEN
    RAISE EXCEPTION 'This user already has access to the document';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.document_invites di
    WHERE di.note_id = note_uuid
      AND LOWER(di.email) = normalized_email
      AND di.status = 'pending'
  ) THEN
    RAISE EXCEPTION 'A pending invite already exists for this email';
  END IF;

  INSERT INTO public.document_invites (
    note_id,
    email,
    role,
    capabilities,
    invited_by,
    status,
    expires_at
  )
  VALUES (
    note_uuid,
    normalized_email,
    normalized_role,
    normalized_capabilities,
    linked_user_id,
    'pending',
    NOW() + INTERVAL '7 days'
  )
  RETURNING * INTO invite_record;

  RETURN QUERY
  SELECT
    invite_record.id,
    invite_record.token,
    invite_record.note_id,
    invite_record.expires_at;
END;
$$;

CREATE OR REPLACE FUNCTION public.accept_document_invite(
  invite_token TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  linked_user_id UUID;
  caller_email TEXT;
  invite_record public.document_invites%ROWTYPE;
  normalized_role TEXT;
  normalized_capabilities JSONB;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  linked_user_id := public.ensure_public_user_linked(caller_id);
  IF linked_user_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve current user profile';
  END IF;

  SELECT *
  INTO invite_record
  FROM public.document_invites di
  WHERE di.token = invite_token
    AND di.status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite not found or already processed';
  END IF;

  IF invite_record.expires_at < NOW() THEN
    UPDATE public.document_invites
    SET status = 'expired', updated_at = NOW()
    WHERE id = invite_record.id;

    RAISE EXCEPTION 'Invite has expired';
  END IF;

  caller_email := LOWER(COALESCE(public.current_user_email(), ''));
  IF caller_email = '' OR caller_email <> LOWER(invite_record.email) THEN
    RAISE EXCEPTION 'Invite email does not match current account';
  END IF;

  normalized_role := LOWER(invite_record.role);
  IF normalized_role = 'owner' THEN
    normalized_role := 'editor';
  END IF;

  normalized_capabilities := COALESCE(invite_record.capabilities, '{}'::jsonb);
  normalized_capabilities := jsonb_build_object(
    'hooks', COALESCE(normalized_capabilities ->> 'hooks', 'false')::BOOLEAN,
    'integrations', COALESCE(normalized_capabilities ->> 'integrations', 'false')::BOOLEAN,
    'automations', COALESCE(normalized_capabilities ->> 'automations', 'false')::BOOLEAN,
    'invite', COALESCE(normalized_capabilities ->> 'invite', 'false')::BOOLEAN,
    'manage_permissions', COALESCE(normalized_capabilities ->> 'manage_permissions', 'false')::BOOLEAN
  );

  INSERT INTO public.document_collaborators (
    note_id,
    user_id,
    role,
    status,
    invited_by,
    invited_at,
    accepted_at,
    capabilities
  )
  VALUES (
    invite_record.note_id,
    linked_user_id,
    normalized_role,
    'active',
    invite_record.invited_by,
    invite_record.created_at,
    NOW(),
    normalized_capabilities
  )
  ON CONFLICT (note_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    status = 'active',
    invited_by = EXCLUDED.invited_by,
    accepted_at = NOW(),
    capabilities = EXCLUDED.capabilities,
    updated_at = NOW();

  UPDATE public.document_invites
  SET status = 'accepted', accepted_at = NOW(), updated_at = NOW()
  WHERE id = invite_record.id;

  RETURN invite_record.note_id;
END;
$$;

NOTIFY pgrst, 'reload schema';
