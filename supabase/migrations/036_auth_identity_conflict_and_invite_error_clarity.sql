-- Add auth identity conflict detection to support mandatory account linking UX.
-- Improve invite errors so frontend can distinguish "document not found" vs "read-only access".

CREATE OR REPLACE FUNCTION public.detect_auth_identity_conflict()
RETURNS TABLE (
  has_conflict BOOLEAN,
  current_auth_user_id UUID,
  primary_auth_user_id UUID,
  email TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_current_user_id UUID;
  v_email TEXT;
  v_primary_user_id UUID;
BEGIN
  v_current_user_id := auth.uid();

  IF v_current_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::TEXT;
    RETURN;
  END IF;

  SELECT LOWER(au.email)
  INTO v_email
  FROM auth.users au
  WHERE au.id = v_current_user_id
  LIMIT 1;

  IF v_email IS NULL OR v_email = '' THEN
    RETURN QUERY SELECT FALSE, v_current_user_id, v_current_user_id, NULL::TEXT;
    RETURN;
  END IF;

  SELECT au.id
  INTO v_primary_user_id
  FROM auth.users au
  WHERE LOWER(au.email) = v_email
  ORDER BY au.created_at ASC, au.id ASC
  LIMIT 1;

  IF v_primary_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, v_current_user_id, v_current_user_id, v_email;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    v_primary_user_id <> v_current_user_id,
    v_current_user_id,
    v_primary_user_id,
    v_email;
END;
$$;

GRANT EXECUTE ON FUNCTION public.detect_auth_identity_conflict() TO authenticated;

COMMENT ON FUNCTION public.detect_auth_identity_conflict IS
  'Returns whether current auth user conflicts with another auth.users row for the same email.';

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
  note_exists BOOLEAN;
  caller_has_access BOOLEAN;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  linked_user_id := public.ensure_public_user_linked(caller_id);
  IF linked_user_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve current user profile';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.id = note_uuid
      AND n.deleted_at IS NULL
  )
  INTO note_exists;

  IF NOT note_exists THEN
    RAISE EXCEPTION 'Document not found';
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
    caller_has_access := public.has_note_access(note_uuid, linked_user_id);
    IF caller_has_access THEN
      RAISE EXCEPTION 'You only have read permission on this document';
    END IF;

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

NOTIFY pgrst, 'reload schema';
