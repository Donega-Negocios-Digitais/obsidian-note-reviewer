-- Repair collaboration RBAC functions/policies for environments with partial migration drift.
-- Fixes errors like:
--   function public.can_manage_collaborators(uuid, uuid) does not exist
-- and restores collaborator invite/remove management flows.

ALTER TABLE public.document_invites
  ADD COLUMN IF NOT EXISTS capabilities JSONB NOT NULL DEFAULT '{"hooks":false,"integrations":false,"automations":false,"invite":false,"manage_permissions":false}'::jsonb;

CREATE OR REPLACE FUNCTION public.current_user_email()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT LOWER(
    COALESCE(
      (
        SELECT email
        FROM public.users
        WHERE id = auth.uid()
        LIMIT 1
      ),
      NULLIF(auth.jwt() ->> 'email', ''),
      NULLIF(auth.jwt() -> 'user_metadata' ->> 'email', '')
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.has_collaborator_capability(
  note_uuid UUID,
  user_uuid UUID,
  capability_key TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_user UUID;
  normalized_capability TEXT;
BEGIN
  resolved_user := COALESCE(user_uuid, auth.uid());
  normalized_capability := LOWER(COALESCE(capability_key, ''));

  IF resolved_user IS NULL THEN
    RETURN FALSE;
  END IF;

  IF normalized_capability NOT IN ('hooks', 'integrations', 'automations', 'invite', 'manage_permissions') THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1
    FROM public.document_collaborators dc
    WHERE dc.note_id = note_uuid
      AND dc.user_id = resolved_user
      AND dc.status = 'active'
      AND COALESCE((dc.capabilities ->> normalized_capability)::BOOLEAN, FALSE)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_collaborators(
  note_uuid UUID,
  user_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.get_note_role(note_uuid, user_uuid) = 'owner'
    OR public.has_collaborator_capability(note_uuid, user_uuid, 'invite')
    OR public.has_collaborator_capability(note_uuid, user_uuid, 'manage_permissions');
$$;

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
  normalized_email TEXT;
  normalized_role TEXT;
  normalized_capabilities JSONB;
  invite_record public.document_invites%ROWTYPE;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
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

  IF NOT public.can_manage_collaborators(note_uuid, caller_id) THEN
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
    caller_id,
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
  caller_email TEXT;
  invite_record public.document_invites%ROWTYPE;
  normalized_role TEXT;
  normalized_capabilities JSONB;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
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
    caller_id,
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

CREATE OR REPLACE FUNCTION public.decline_document_invite(
  invite_token TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_email TEXT;
  invite_record public.document_invites%ROWTYPE;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT *
  INTO invite_record
  FROM public.document_invites di
  WHERE di.token = invite_token
    AND di.status = 'pending'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  caller_email := LOWER(COALESCE(public.current_user_email(), ''));
  IF NOT (
    public.can_manage_collaborators(invite_record.note_id, caller_id)
    OR caller_email = LOWER(invite_record.email)
  ) THEN
    RAISE EXCEPTION 'You do not have permission to decline this invite';
  END IF;

  UPDATE public.document_invites
  SET status = 'cancelled', updated_at = NOW()
  WHERE id = invite_record.id;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_document_collaborator_role(
  note_uuid UUID,
  collaborator_uuid UUID,
  new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  normalized_role TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  normalized_role := LOWER(COALESCE(new_role, ''));
  IF normalized_role NOT IN ('editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid role. Allowed roles: editor, viewer';
  END IF;

  IF NOT (
    public.get_note_role(note_uuid, caller_id) = 'owner'
    OR public.has_collaborator_capability(note_uuid, caller_id, 'manage_permissions')
  ) THEN
    RAISE EXCEPTION 'You do not have permission to update collaborator roles';
  END IF;

  UPDATE public.document_collaborators
  SET role = normalized_role, updated_at = NOW()
  WHERE note_id = note_uuid
    AND user_id = collaborator_uuid
    AND role <> 'owner';

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_document_collaborator_capability(
  note_uuid UUID,
  collaborator_uuid UUID,
  capability_key TEXT,
  enabled BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  normalized_capability TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  normalized_capability := LOWER(COALESCE(capability_key, ''));
  IF normalized_capability NOT IN ('hooks', 'integrations', 'automations', 'invite', 'manage_permissions') THEN
    RAISE EXCEPTION 'Invalid capability key';
  END IF;

  IF NOT (
    public.get_note_role(note_uuid, caller_id) = 'owner'
    OR public.has_collaborator_capability(note_uuid, caller_id, 'manage_permissions')
  ) THEN
    RAISE EXCEPTION 'You do not have permission to update collaborator capabilities';
  END IF;

  UPDATE public.document_collaborators
  SET capabilities = jsonb_set(
      COALESCE(capabilities, '{}'::jsonb),
      ARRAY[normalized_capability],
      to_jsonb(COALESCE(enabled, FALSE)),
      TRUE
    ),
    updated_at = NOW()
  WHERE note_id = note_uuid
    AND user_id = collaborator_uuid
    AND role <> 'owner';

  RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.remove_document_collaborator(
  note_uuid UUID,
  collaborator_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  target_role TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.can_manage_collaborators(note_uuid, caller_id) THEN
    RAISE EXCEPTION 'You do not have permission to remove collaborators';
  END IF;

  SELECT role
  INTO target_role
  FROM public.document_collaborators dc
  WHERE dc.note_id = note_uuid
    AND dc.user_id = collaborator_uuid
  LIMIT 1;

  IF target_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF target_role = 'owner' THEN
    RAISE EXCEPTION 'Owner cannot be removed';
  END IF;

  DELETE FROM public.document_collaborators
  WHERE note_id = note_uuid
    AND user_id = collaborator_uuid;

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.invite_to_document(
  note_uuid UUID,
  invite_email TEXT,
  invite_role TEXT,
  inviter_uuid UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  created_invite RECORD;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL OR inviter_uuid IS NULL OR caller_id <> inviter_uuid THEN
    RAISE EXCEPTION 'Invalid inviter';
  END IF;

  SELECT *
  INTO created_invite
  FROM public.create_document_invite(note_uuid, invite_email, invite_role)
  LIMIT 1;

  RETURN created_invite.invite_id;
END;
$$;

DROP POLICY IF EXISTS "Users can view collaborators on accessible notes" ON public.document_collaborators;
DROP POLICY IF EXISTS "Users can insert collaborators for notes they own" ON public.document_collaborators;
DROP POLICY IF EXISTS "Users can update collaborators they invited" ON public.document_collaborators;
DROP POLICY IF EXISTS "Users can remove collaborators they invited" ON public.document_collaborators;
DROP POLICY IF EXISTS "Users can insert collaborators with collaborator manage access" ON public.document_collaborators;
DROP POLICY IF EXISTS "Users can update collaborators with collaborator manage access" ON public.document_collaborators;
DROP POLICY IF EXISTS "Users can delete collaborators with collaborator manage access" ON public.document_collaborators;

CREATE POLICY "Users can view collaborators on accessible notes"
  ON public.document_collaborators FOR SELECT
  USING (public.has_note_access(note_id, (SELECT auth.uid())));

CREATE POLICY "Users can insert collaborators with collaborator manage access"
  ON public.document_collaborators FOR INSERT
  WITH CHECK (
    invited_by = (SELECT auth.uid())
    AND public.can_manage_collaborators(note_id, (SELECT auth.uid()))
  );

CREATE POLICY "Users can update collaborators with collaborator manage access"
  ON public.document_collaborators FOR UPDATE
  USING (public.can_manage_collaborators(note_id, (SELECT auth.uid())))
  WITH CHECK (public.can_manage_collaborators(note_id, (SELECT auth.uid())));

CREATE POLICY "Users can delete collaborators with collaborator manage access"
  ON public.document_collaborators FOR DELETE
  USING (public.can_manage_collaborators(note_id, (SELECT auth.uid())));

DROP POLICY IF EXISTS "Users can view invites for notes they own" ON public.document_invites;
DROP POLICY IF EXISTS "Users can create invites for notes they own" ON public.document_invites;
DROP POLICY IF EXISTS "Users can update invites they created" ON public.document_invites;
DROP POLICY IF EXISTS "Users can delete invites they created" ON public.document_invites;
DROP POLICY IF EXISTS "Users can view invites they own or received" ON public.document_invites;
DROP POLICY IF EXISTS "Users can create invites with collaborator manage access" ON public.document_invites;
DROP POLICY IF EXISTS "Users can update invites they can manage or receive" ON public.document_invites;
DROP POLICY IF EXISTS "Users can delete invites they can manage" ON public.document_invites;

CREATE POLICY "Users can view invites they own or received"
  ON public.document_invites FOR SELECT
  USING (
    public.can_manage_collaborators(note_id, (SELECT auth.uid()))
    OR LOWER(email) = LOWER(COALESCE(public.current_user_email(), ''))
  );

CREATE POLICY "Users can create invites with collaborator manage access"
  ON public.document_invites FOR INSERT
  WITH CHECK (
    invited_by = (SELECT auth.uid())
    AND public.can_manage_collaborators(note_id, (SELECT auth.uid()))
  );

CREATE POLICY "Users can update invites they can manage or receive"
  ON public.document_invites FOR UPDATE
  USING (
    public.can_manage_collaborators(note_id, (SELECT auth.uid()))
    OR LOWER(email) = LOWER(COALESCE(public.current_user_email(), ''))
  )
  WITH CHECK (
    public.can_manage_collaborators(note_id, (SELECT auth.uid()))
    OR LOWER(email) = LOWER(COALESCE(public.current_user_email(), ''))
  );

CREATE POLICY "Users can delete invites they can manage"
  ON public.document_invites FOR DELETE
  USING (public.can_manage_collaborators(note_id, (SELECT auth.uid())));

GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_collaborator_capability(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_collaborators(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_document_invite(UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_document_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_document_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_document_collaborator_role(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_document_collaborator_capability(UUID, UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_document_collaborator(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_to_document(UUID, TEXT, TEXT, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';
