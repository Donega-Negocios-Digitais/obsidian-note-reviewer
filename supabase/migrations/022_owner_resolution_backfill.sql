-- Fix legacy ownership resolution for document RBAC.
-- Some older notes can be accessible but not recognized as owner in strict RLS checks.

ALTER TABLE public.document_collaborators
  ADD COLUMN IF NOT EXISTS capabilities JSONB NOT NULL DEFAULT '{"hooks":false,"integrations":false,"automations":false,"invite":false,"manage_permissions":false}'::jsonb;

-- 1) If a note has created_by but the owner collaborator row is missing/inactive, enforce it.
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
  COALESCE(n.created_at, NOW()),
  '{"hooks":true,"integrations":true,"automations":true,"invite":true,"manage_permissions":true}'::jsonb
FROM public.notes n
LEFT JOIN public.document_collaborators dc
  ON dc.note_id = n.id
 AND dc.user_id = n.created_by
WHERE n.created_by IS NOT NULL
  AND dc.user_id IS NULL
ON CONFLICT (note_id, user_id)
DO UPDATE SET
  role = 'owner',
  status = 'active',
  accepted_at = COALESCE(public.document_collaborators.accepted_at, EXCLUDED.accepted_at),
  capabilities = '{"hooks":true,"integrations":true,"automations":true,"invite":true,"manage_permissions":true}'::jsonb,
  updated_at = NOW();

-- 2) If created_by is null but there is already an active owner collaborator, backfill created_by.
WITH owner_candidates AS (
  SELECT DISTINCT ON (dc.note_id)
    dc.note_id,
    dc.user_id
  FROM public.document_collaborators dc
  JOIN public.notes n ON n.id = dc.note_id
  WHERE n.created_by IS NULL
    AND dc.status = 'active'
    AND dc.role = 'owner'
  ORDER BY dc.note_id, COALESCE(dc.accepted_at, dc.created_at, NOW())
)
UPDATE public.notes n
SET created_by = oc.user_id
FROM owner_candidates oc
WHERE n.id = oc.note_id
  AND n.created_by IS NULL;

-- 3) If created_by is still null, elect an owner from active collaborators (owner > editor > viewer).
WITH ranked_candidates AS (
  SELECT DISTINCT ON (dc.note_id)
    dc.note_id,
    dc.user_id
  FROM public.document_collaborators dc
  JOIN public.notes n ON n.id = dc.note_id
  WHERE n.created_by IS NULL
    AND dc.status = 'active'
  ORDER BY
    dc.note_id,
    CASE dc.role
      WHEN 'owner' THEN 0
      WHEN 'editor' THEN 1
      ELSE 2
    END,
    COALESCE(dc.accepted_at, dc.created_at, NOW())
)
UPDATE public.notes n
SET created_by = rc.user_id
FROM ranked_candidates rc
WHERE n.id = rc.note_id
  AND n.created_by IS NULL;

-- 4) Ensure the created_by user is persisted as active owner collaborator.
UPDATE public.document_collaborators dc
SET
  role = 'owner',
  status = 'active',
  accepted_at = COALESCE(dc.accepted_at, NOW()),
  capabilities = '{"hooks":true,"integrations":true,"automations":true,"invite":true,"manage_permissions":true}'::jsonb,
  updated_at = NOW()
FROM public.notes n
WHERE n.created_by IS NOT NULL
  AND dc.note_id = n.id
  AND dc.user_id = n.created_by
  AND (
    dc.role <> 'owner'
    OR dc.status <> 'active'
    OR dc.capabilities IS DISTINCT FROM '{"hooks":true,"integrations":true,"automations":true,"invite":true,"manage_permissions":true}'::jsonb
  );

-- 5) Recreate role resolver so collaborator role still works even when legacy rows had null created_by.
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
  note_owner UUID;
  is_public_note BOOLEAN;
  note_deleted_at TIMESTAMPTZ;
BEGIN
  resolved_user := COALESCE(user_uuid, auth.uid());

  SELECT n.created_by, n.is_public, n.deleted_at
  INTO note_owner, is_public_note, note_deleted_at
  FROM public.notes n
  WHERE n.id = note_uuid
  LIMIT 1;

  IF note_deleted_at IS NOT NULL THEN
    RETURN 'none';
  END IF;

  IF resolved_user IS NOT NULL THEN
    IF note_owner = resolved_user THEN
      RETURN 'owner';
    END IF;

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

  IF COALESCE(is_public_note, FALSE) THEN
    RETURN 'viewer';
  END IF;

  RETURN 'none';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_note_role(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_note_role(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.get_note_role IS 'Returns role for the user in a note: owner/editor/viewer/none, respecting soft-delete.';

NOTIFY pgrst, 'reload schema';
