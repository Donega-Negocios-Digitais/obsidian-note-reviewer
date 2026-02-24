-- Add capabilities column to document_invites table
-- Allows specifying detailed permissions when inviting collaborators

-- Step 1: Add capabilities column to document_invites
ALTER TABLE public.document_invites
ADD COLUMN IF NOT EXISTS capabilities JSONB NOT NULL DEFAULT '{"hooks":false,"integrations":false,"automations":false,"invite":false,"manage_permissions":false}'::jsonb;

-- Step 2: Update create_document_invite function to accept capabilities parameter
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
  
  -- Normalize capabilities: ensure valid JSONB with all keys
  normalized_capabilities := COALESCE(invite_capabilities, '{}'::jsonb);
  
  -- Ensure all capability keys exist with boolean values
  normalized_capabilities := jsonb_build_object(
    'hooks', COALESCE(normalized_capabilities->>'hooks', 'false')::boolean,
    'integrations', COALESCE(normalized_capabilities->>'integrations', 'false')::boolean,
    'automations', COALESCE(normalized_capabilities->>'automations', 'false')::boolean,
    'invite', COALESCE(normalized_capabilities->>'invite', 'false')::boolean,
    'manage_permissions', COALESCE(normalized_capabilities->>'manage_permissions', 'false')::boolean
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

-- Step 3: Grant execute permission on updated function
GRANT EXECUTE ON FUNCTION public.create_document_invite(UUID, TEXT, TEXT, JSONB) TO authenticated;

-- Step 4: Comment for documentation
COMMENT ON COLUMN public.document_invites.capabilities IS 'JSON object storing detailed permissions: hooks, integrations, automations, invite, manage_permissions';
COMMENT ON FUNCTION public.create_document_invite IS 'Creates invite token for authenticated collaborator flow. Accepts optional capabilities JSONB parameter.';
