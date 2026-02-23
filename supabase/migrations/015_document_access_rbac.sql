-- Document-level RBAC hardening, invite workflow and per-collaborator capabilities

-- ---------------------------------------------------------------------------
-- Users profile extension
-- ---------------------------------------------------------------------------
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone TEXT;

-- ---------------------------------------------------------------------------
-- Collaborators table hardening
-- ---------------------------------------------------------------------------
ALTER TABLE public.document_collaborators
  ADD COLUMN IF NOT EXISTS capabilities JSONB NOT NULL DEFAULT '{"hooks":false,"integrations":false,"automations":false,"invite":false,"manage_permissions":false}'::jsonb;

UPDATE public.document_collaborators
SET status = 'inactive'
WHERE status = 'removed';

ALTER TABLE public.document_collaborators
  DROP CONSTRAINT IF EXISTS document_collaborators_role_check;

ALTER TABLE public.document_collaborators
  ADD CONSTRAINT document_collaborators_role_check
  CHECK (role IN ('owner', 'editor', 'viewer'));

ALTER TABLE public.document_collaborators
  DROP CONSTRAINT IF EXISTS document_collaborators_status_check;

ALTER TABLE public.document_collaborators
  ADD CONSTRAINT document_collaborators_status_check
  CHECK (status IN ('active', 'pending', 'inactive'));

ALTER TABLE public.document_invites
  DROP CONSTRAINT IF EXISTS document_invites_role_check;

ALTER TABLE public.document_invites
  ADD CONSTRAINT document_invites_role_check
  CHECK (role IN ('editor', 'viewer'));

ALTER TABLE public.document_invites
  DROP CONSTRAINT IF EXISTS document_invites_status_check;

ALTER TABLE public.document_invites
  ADD CONSTRAINT document_invites_status_check
  CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'));

UPDATE public.document_collaborators
SET capabilities = CASE
  WHEN role = 'owner' THEN '{"hooks":true,"integrations":true,"automations":true,"invite":true,"manage_permissions":true}'::jsonb
  ELSE COALESCE(capabilities, '{"hooks":false,"integrations":false,"automations":false,"invite":false,"manage_permissions":false}'::jsonb)
END;

-- Keep owner collaborator row in sync for every owned note
CREATE OR REPLACE FUNCTION public.ensure_owner_collaborator()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.document_collaborators (
    note_id,
    user_id,
    role,
    status,
    invited_by,
    accepted_at,
    capabilities
  )
  VALUES (
    NEW.id,
    NEW.created_by,
    'owner',
    'active',
    NEW.created_by,
    NOW(),
    '{"hooks":true,"integrations":true,"automations":true,"invite":true,"manage_permissions":true}'::jsonb
  )
  ON CONFLICT (note_id, user_id)
  DO UPDATE SET
    role = 'owner',
    status = 'active',
    capabilities = '{"hooks":true,"integrations":true,"automations":true,"invite":true,"manage_permissions":true}'::jsonb,
    accepted_at = COALESCE(public.document_collaborators.accepted_at, NOW()),
    updated_at = NOW();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ensure_owner_collaborator_on_note_insert ON public.notes;
CREATE TRIGGER ensure_owner_collaborator_on_note_insert
  AFTER INSERT ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_owner_collaborator();

INSERT INTO public.document_collaborators (
  note_id,
  user_id,
  role,
  status,
  invited_by,
  accepted_at,
  capabilities
)
SELECT
  n.id,
  n.created_by,
  'owner',
  'active',
  n.created_by,
  n.created_at,
  '{"hooks":true,"integrations":true,"automations":true,"invite":true,"manage_permissions":true}'::jsonb
FROM public.notes n
WHERE n.created_by IS NOT NULL
ON CONFLICT (note_id, user_id)
DO UPDATE SET
  role = 'owner',
  status = 'active',
  capabilities = '{"hooks":true,"integrations":true,"automations":true,"invite":true,"manage_permissions":true}'::jsonb,
  accepted_at = COALESCE(public.document_collaborators.accepted_at, EXCLUDED.accepted_at),
  updated_at = NOW();

-- ---------------------------------------------------------------------------
-- Authorization helpers
-- ---------------------------------------------------------------------------
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
  role_name TEXT;
  caps JSONB;
BEGIN
  IF user_uuid IS NULL OR capability_key IS NULL THEN
    RETURN FALSE;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.id = note_uuid
      AND n.created_by = user_uuid
  ) THEN
    RETURN TRUE;
  END IF;

  SELECT dc.role, dc.capabilities
  INTO role_name, caps
  FROM public.document_collaborators dc
  WHERE dc.note_id = note_uuid
    AND dc.user_id = user_uuid
    AND dc.status = 'active'
  LIMIT 1;

  IF role_name IS NULL THEN
    RETURN FALSE;
  END IF;

  IF role_name = 'owner' THEN
    RETURN TRUE;
  END IF;

  RETURN COALESCE((caps ->> capability_key)::BOOLEAN, FALSE);
END;
$$;

CREATE OR REPLACE FUNCTION public.has_note_access(
  note_uuid UUID,
  user_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_user UUID;
BEGIN
  resolved_user := COALESCE(user_uuid, auth.uid());

  RETURN EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.id = note_uuid
      AND (
        n.is_public = TRUE
        OR (
          resolved_user IS NOT NULL
          AND (
            n.created_by = resolved_user
            OR EXISTS (
              SELECT 1
              FROM public.document_collaborators dc
              WHERE dc.note_id = n.id
                AND dc.user_id = resolved_user
                AND dc.status = 'active'
            )
          )
        )
      )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_note_role(
  note_uuid UUID,
  user_uuid UUID
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_user UUID;
  collaborator_role TEXT;
  is_public_note BOOLEAN;
BEGIN
  resolved_user := COALESCE(user_uuid, auth.uid());

  IF resolved_user IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.id = note_uuid
      AND n.created_by = resolved_user
  ) THEN
    RETURN 'owner';
  END IF;

  IF resolved_user IS NOT NULL THEN
    SELECT dc.role
    INTO collaborator_role
    FROM public.document_collaborators dc
    WHERE dc.note_id = note_uuid
      AND dc.user_id = resolved_user
      AND dc.status = 'active'
    LIMIT 1;

    IF collaborator_role IS NOT NULL THEN
      RETURN collaborator_role;
    END IF;
  END IF;

  SELECT n.is_public
  INTO is_public_note
  FROM public.notes n
  WHERE n.id = note_uuid
  LIMIT 1;

  IF COALESCE(is_public_note, FALSE) THEN
    RETURN 'viewer';
  END IF;

  RETURN 'none';
END;
$$;

CREATE OR REPLACE FUNCTION public.can_edit_note(
  note_uuid UUID,
  user_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_note_role(note_uuid, user_uuid) IN ('owner', 'editor');
$$;

CREATE OR REPLACE FUNCTION public.can_comment_note(
  note_uuid UUID,
  user_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_note_access(note_uuid, user_uuid)
    AND public.get_note_role(note_uuid, user_uuid) IN ('owner', 'editor', 'viewer');
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

CREATE OR REPLACE FUNCTION public.can_manage_feature(
  note_uuid UUID,
  feature_name TEXT,
  user_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_feature TEXT;
BEGIN
  normalized_feature := LOWER(COALESCE(feature_name, ''));

  IF normalized_feature NOT IN ('hooks', 'integrations', 'automations') THEN
    RETURN FALSE;
  END IF;

  RETURN
    public.get_note_role(note_uuid, user_uuid) = 'owner'
    OR public.has_collaborator_capability(note_uuid, user_uuid, normalized_feature)
    OR public.has_collaborator_capability(note_uuid, user_uuid, 'manage_permissions');
END;
$$;

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

-- ---------------------------------------------------------------------------
-- Invite and collaborator RPCs
-- ---------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.accept_document_invite(TEXT, UUID);
DROP FUNCTION IF EXISTS public.accept_document_invite(UUID, UUID);

CREATE OR REPLACE FUNCTION public.create_document_invite(
  note_uuid UUID,
  invite_email TEXT,
  invite_role TEXT DEFAULT 'viewer'
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
  invite_record public.document_invites%ROWTYPE;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  normalized_email := LOWER(TRIM(invite_email));
  normalized_role := LOWER(COALESCE(invite_role, 'viewer'));

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

  INSERT INTO public.document_invites (
    note_id,
    email,
    role,
    invited_by,
    status,
    expires_at
  )
  VALUES (
    note_uuid,
    normalized_email,
    normalized_role,
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
  default_caps JSONB;
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

  default_caps := CASE
    WHEN normalized_role = 'owner' THEN '{"hooks":true,"integrations":true,"automations":true,"invite":true,"manage_permissions":true}'::jsonb
    ELSE '{"hooks":false,"integrations":false,"automations":false,"invite":false,"manage_permissions":false}'::jsonb
  END;

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
    default_caps
  )
  ON CONFLICT (note_id, user_id)
  DO UPDATE SET
    role = EXCLUDED.role,
    status = 'active',
    invited_by = EXCLUDED.invited_by,
    accepted_at = NOW(),
    capabilities = CASE
      WHEN EXCLUDED.role = 'owner' THEN '{"hooks":true,"integrations":true,"automations":true,"invite":true,"manage_permissions":true}'::jsonb
      ELSE public.document_collaborators.capabilities
    END,
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
  IF caller_email = '' OR caller_email <> LOWER(invite_record.email) THEN
    RAISE EXCEPTION 'Invite email does not match current account';
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
  caller_can_manage_permissions BOOLEAN;
  target_role TEXT;
  normalized_role TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  normalized_role := LOWER(COALESCE(new_role, ''));
  IF normalized_role NOT IN ('owner', 'editor', 'viewer') THEN
    RAISE EXCEPTION 'Invalid collaborator role';
  END IF;

  caller_can_manage_permissions :=
    public.get_note_role(note_uuid, caller_id) = 'owner'
    OR public.has_collaborator_capability(note_uuid, caller_id, 'manage_permissions');

  IF NOT caller_can_manage_permissions THEN
    RAISE EXCEPTION 'You do not have permission to manage collaborator roles';
  END IF;

  SELECT role
  INTO target_role
  FROM public.document_collaborators
  WHERE note_id = note_uuid
    AND user_id = collaborator_uuid
  LIMIT 1;

  IF target_role IS NULL THEN
    RETURN FALSE;
  END IF;

  IF target_role = 'owner' AND normalized_role <> 'owner' THEN
    RAISE EXCEPTION 'Owner role cannot be reassigned from this operation';
  END IF;

  IF normalized_role = 'owner' AND target_role <> 'owner' THEN
    RAISE EXCEPTION 'Only existing owner can remain owner';
  END IF;

  UPDATE public.document_collaborators
  SET role = normalized_role,
      updated_at = NOW()
  WHERE note_id = note_uuid
    AND user_id = collaborator_uuid;

  RETURN TRUE;
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
  target_role TEXT;
  normalized_key TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT (
    public.get_note_role(note_uuid, caller_id) = 'owner'
    OR public.has_collaborator_capability(note_uuid, caller_id, 'manage_permissions')
  ) THEN
    RAISE EXCEPTION 'You do not have permission to manage collaborator capabilities';
  END IF;

  normalized_key := LOWER(COALESCE(capability_key, ''));
  IF normalized_key NOT IN ('hooks', 'integrations', 'automations', 'invite', 'manage_permissions') THEN
    RAISE EXCEPTION 'Invalid capability key';
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
    RETURN TRUE;
  END IF;

  UPDATE public.document_collaborators
  SET capabilities = jsonb_set(
        COALESCE(capabilities, '{}'::jsonb),
        ARRAY[normalized_key],
        to_jsonb(COALESCE(enabled, FALSE)),
        TRUE
      ),
      updated_at = NOW()
  WHERE note_id = note_uuid
    AND user_id = collaborator_uuid;

  RETURN TRUE;
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

  IF NOT (
    public.get_note_role(note_uuid, caller_id) = 'owner'
    OR public.has_collaborator_capability(note_uuid, caller_id, 'manage_permissions')
  ) THEN
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

-- Backward compatibility function
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

-- ---------------------------------------------------------------------------
-- RLS policies (document-aware)
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view org notes or public notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert notes in their org" ON public.notes;
DROP POLICY IF EXISTS "Users can update notes in their org" ON public.notes;
DROP POLICY IF EXISTS "Users can delete notes in their org" ON public.notes;

CREATE POLICY "Users can view notes with document access"
  ON public.notes FOR SELECT
  USING (public.has_note_access(id, (SELECT auth.uid())));

CREATE POLICY "Users can insert notes in own org"
  ON public.notes FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND org_id = public.current_user_org_id()
  );

CREATE POLICY "Users can update notes they can edit"
  ON public.notes FOR UPDATE
  USING (public.can_edit_note(id, (SELECT auth.uid())))
  WITH CHECK (public.can_edit_note(id, (SELECT auth.uid())));

CREATE POLICY "Owners can delete notes"
  ON public.notes FOR DELETE
  USING (public.get_note_role(id, (SELECT auth.uid())) = 'owner');

DROP POLICY IF EXISTS "Users can view annotations on accessible notes" ON public.annotations;
DROP POLICY IF EXISTS "Users can create annotations on accessible notes" ON public.annotations;
DROP POLICY IF EXISTS "Users can update own annotations" ON public.annotations;
DROP POLICY IF EXISTS "Users can delete own annotations" ON public.annotations;

CREATE POLICY "Users can view annotations on accessible notes"
  ON public.annotations FOR SELECT
  USING (public.has_note_access(note_id, (SELECT auth.uid())));

CREATE POLICY "Users can insert annotations with comment or edit access"
  ON public.annotations FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND CASE
      WHEN LOWER(COALESCE(type, '')) IN ('comment', 'global_comment')
        THEN public.can_comment_note(note_id, (SELECT auth.uid()))
      ELSE public.can_edit_note(note_id, (SELECT auth.uid()))
    END
  );

CREATE POLICY "Users can update annotations with document permissions"
  ON public.annotations FOR UPDATE
  USING (
    user_id = (SELECT auth.uid())
    OR public.can_edit_note(note_id, (SELECT auth.uid()))
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR public.can_edit_note(note_id, (SELECT auth.uid()))
  );

CREATE POLICY "Users can delete annotations with document permissions"
  ON public.annotations FOR DELETE
  USING (
    user_id = (SELECT auth.uid())
    OR public.can_edit_note(note_id, (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Users can view versions for accessible notes" ON public.document_versions;
DROP POLICY IF EXISTS "Users can create versions for accessible notes" ON public.document_versions;
DROP POLICY IF EXISTS "Users can update own versions" ON public.document_versions;
DROP POLICY IF EXISTS "Users can delete own versions" ON public.document_versions;

CREATE POLICY "Users can view versions for accessible notes"
  ON public.document_versions FOR SELECT
  USING (public.has_note_access(document_id, (SELECT auth.uid())));

CREATE POLICY "Users can create versions for editable notes"
  ON public.document_versions FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND public.can_edit_note(document_id, (SELECT auth.uid()))
  );

CREATE POLICY "Users can update own versions"
  ON public.document_versions FOR UPDATE
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Users can delete own versions"
  ON public.document_versions FOR DELETE
  USING (created_by = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can view comment threads on accessible notes" ON public.comment_threads;
DROP POLICY IF EXISTS "Users can create comment threads on accessible notes" ON public.comment_threads;
DROP POLICY IF EXISTS "Users can update own comment threads" ON public.comment_threads;
DROP POLICY IF EXISTS "Users can delete own comment threads" ON public.comment_threads;

CREATE POLICY "Users can view comment threads on accessible notes"
  ON public.comment_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.annotations a
      WHERE a.id = comment_threads.annotation_id
        AND public.has_note_access(a.note_id, (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can create comment threads with comment access"
  ON public.comment_threads FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.annotations a
      WHERE a.id = comment_threads.annotation_id
        AND public.can_comment_note(a.note_id, (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can update own or editable comment threads"
  ON public.comment_threads FOR UPDATE
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.annotations a
      WHERE a.id = comment_threads.annotation_id
        AND public.can_edit_note(a.note_id, (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.annotations a
      WHERE a.id = comment_threads.annotation_id
        AND public.can_edit_note(a.note_id, (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can delete own or editable comment threads"
  ON public.comment_threads FOR DELETE
  USING (
    created_by = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.annotations a
      WHERE a.id = comment_threads.annotation_id
        AND public.can_edit_note(a.note_id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can view comments on accessible notes" ON public.comments;
DROP POLICY IF EXISTS "Users can create comments on accessible notes" ON public.comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

CREATE POLICY "Users can view comments on accessible notes"
  ON public.comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.comment_threads ct
      JOIN public.annotations a ON a.id = ct.annotation_id
      WHERE ct.id = comments.thread_id
        AND public.has_note_access(a.note_id, (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can create comments with comment access"
  ON public.comments FOR INSERT
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.comment_threads ct
      JOIN public.annotations a ON a.id = ct.annotation_id
      WHERE ct.id = comments.thread_id
        AND public.can_comment_note(a.note_id, (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can update own or editable comments"
  ON public.comments FOR UPDATE
  USING (
    author_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.comment_threads ct
      JOIN public.annotations a ON a.id = ct.annotation_id
      WHERE ct.id = comments.thread_id
        AND public.can_edit_note(a.note_id, (SELECT auth.uid()))
    )
  )
  WITH CHECK (
    author_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.comment_threads ct
      JOIN public.annotations a ON a.id = ct.annotation_id
      WHERE ct.id = comments.thread_id
        AND public.can_edit_note(a.note_id, (SELECT auth.uid()))
    )
  );

CREATE POLICY "Users can delete own or editable comments"
  ON public.comments FOR DELETE
  USING (
    author_id = (SELECT auth.uid())
    OR EXISTS (
      SELECT 1
      FROM public.comment_threads ct
      JOIN public.annotations a ON a.id = ct.annotation_id
      WHERE ct.id = comments.thread_id
        AND public.can_edit_note(a.note_id, (SELECT auth.uid()))
    )
  );

DROP POLICY IF EXISTS "Users can view collaborators on accessible notes" ON public.document_collaborators;
DROP POLICY IF EXISTS "Users can insert collaborators for notes they own" ON public.document_collaborators;
DROP POLICY IF EXISTS "Users can update collaborators they invited" ON public.document_collaborators;
DROP POLICY IF EXISTS "Users can remove collaborators they invited" ON public.document_collaborators;

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

-- ---------------------------------------------------------------------------
-- Grants and docs
-- ---------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.has_collaborator_capability(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_note_access(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.has_note_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_note_role(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_note_role(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_edit_note(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_comment_note(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_collaborators(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_feature(UUID, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_email() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_document_invite(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_document_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decline_document_invite(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_document_collaborator_role(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_document_collaborator_capability(UUID, UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_document_collaborator(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.invite_to_document(UUID, TEXT, TEXT, UUID) TO authenticated;

COMMENT ON FUNCTION public.has_note_access IS 'Checks if user can access note (owner/collaborator/public).';
COMMENT ON FUNCTION public.get_note_role IS 'Returns role for the user in a note: owner/editor/viewer/none.';
COMMENT ON FUNCTION public.can_edit_note IS 'Returns whether user can edit note content.';
COMMENT ON FUNCTION public.can_comment_note IS 'Returns whether user can comment on note.';
COMMENT ON FUNCTION public.can_manage_collaborators IS 'Returns whether user can invite/manage collaborators.';
COMMENT ON FUNCTION public.can_manage_feature IS 'Returns whether user can configure a feature on note (hooks/integrations/automations).';
COMMENT ON FUNCTION public.create_document_invite IS 'Creates invite token for authenticated collaborator flow.';
COMMENT ON FUNCTION public.accept_document_invite IS 'Accepts invite by token for current authenticated user and returns note_id.';
COMMENT ON FUNCTION public.decline_document_invite IS 'Declines invite token for current authenticated user.';
COMMENT ON FUNCTION public.set_document_collaborator_role IS 'Updates collaborator role for note if caller can manage permissions.';
COMMENT ON FUNCTION public.set_document_collaborator_capability IS 'Updates collaborator capability (hooks/integrations/automations/invite/manage_permissions).';
COMMENT ON FUNCTION public.remove_document_collaborator IS 'Removes collaborator from note if caller can manage permissions.';
