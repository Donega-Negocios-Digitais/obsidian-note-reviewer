-- Return collaborators with identity fields using a security-definer function.
-- This avoids UI cards with blank name/email when relation joins are filtered by RLS.

CREATE OR REPLACE FUNCTION public.get_document_collaborators_with_identity(
  note_uuid UUID,
  include_inactive BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
  collaborator_id UUID,
  note_id UUID,
  user_id UUID,
  role TEXT,
  status TEXT,
  capabilities JSONB,
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  email TEXT,
  name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
BEGIN
  caller_id := auth.uid();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF note_uuid IS NULL THEN
    RAISE EXCEPTION 'Document id is required';
  END IF;

  IF NOT public.has_note_access(note_uuid, caller_id) THEN
    RAISE EXCEPTION 'You do not have access to this document';
  END IF;

  RETURN QUERY
  SELECT
    dc.id AS collaborator_id,
    dc.note_id,
    dc.user_id,
    dc.role,
    dc.status,
    COALESCE(
      dc.capabilities,
      '{"hooks":false,"integrations":false,"automations":false,"invite":false,"manage_permissions":false}'::jsonb
    ) AS capabilities,
    dc.invited_by,
    dc.invited_at,
    dc.accepted_at,
    dc.created_at,
    dc.updated_at,
    u.email,
    COALESCE(
      NULLIF(u.name, ''),
      split_part(COALESCE(u.email, dc.user_id::text), '@', 1)
    ) AS name,
    u.avatar_url
  FROM public.document_collaborators dc
  LEFT JOIN public.users u
    ON u.id = dc.user_id
  WHERE dc.note_id = note_uuid
    AND dc.status IN ('active', 'pending', 'inactive')
    AND (include_inactive OR dc.status = 'active')
  ORDER BY dc.created_at ASC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_document_collaborators_with_identity(UUID, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';

