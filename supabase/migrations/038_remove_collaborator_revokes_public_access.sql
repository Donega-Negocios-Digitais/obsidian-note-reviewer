-- Ensure collaborator removal revokes every access path.
-- Requirement: once removed, the user must not keep viewer access through public share links.

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

  -- Security rule: removing a collaborator also disables public sharing.
  -- This guarantees the removed user does not keep access as implicit viewer.
  UPDATE public.notes
  SET is_public = FALSE,
      share_hash = NULL,
      updated_at = NOW()
  WHERE id = note_uuid;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_document_collaborator(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.remove_document_collaborator IS
  'Removes collaborator and revokes public sharing to fully remove access paths.';
