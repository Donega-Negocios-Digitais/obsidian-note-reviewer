-- Hardening: owner resolution for note mutations + friendly/consistent RLS behavior

CREATE OR REPLACE FUNCTION public.is_note_owner(
  note_uuid UUID,
  user_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.id = note_uuid
      AND (
        n.created_by = COALESCE(user_uuid, auth.uid())
        OR EXISTS (
          SELECT 1
          FROM public.document_collaborators dc
          WHERE dc.note_id = n.id
            AND dc.user_id = COALESCE(user_uuid, auth.uid())
            AND dc.status = 'active'
            AND dc.role = 'owner'
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_trashed_note(
  note_uuid UUID,
  user_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.id = note_uuid
      AND n.deleted_at IS NOT NULL
      AND public.is_note_owner(n.id, COALESCE(user_uuid, auth.uid()))
  );
$$;

CREATE OR REPLACE FUNCTION public.enforce_note_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_is_owner BOOLEAN;
BEGIN
  caller_id := auth.uid();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  caller_is_owner := public.is_note_owner(OLD.id, caller_id);

  IF NEW.created_by IS DISTINCT FROM OLD.created_by AND NOT caller_is_owner THEN
    RAISE EXCEPTION 'Only owner can reassign document ownership';
  END IF;

  IF NEW.org_id IS DISTINCT FROM OLD.org_id AND NOT caller_is_owner THEN
    RAISE EXCEPTION 'Only owner can move document organization';
  END IF;

  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at AND NOT caller_is_owner THEN
    RAISE EXCEPTION 'Only owner can delete or restore document';
  END IF;

  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Owners can update notes" ON public.notes;
DROP POLICY IF EXISTS "Owners can delete notes permanently" ON public.notes;

CREATE POLICY "Owners can update notes"
  ON public.notes FOR UPDATE
  USING (public.is_note_owner(id, (SELECT auth.uid())))
  WITH CHECK (public.is_note_owner(id, (SELECT auth.uid())));

CREATE POLICY "Owners can delete notes permanently"
  ON public.notes FOR DELETE
  USING (public.is_note_owner(id, (SELECT auth.uid())));

GRANT EXECUTE ON FUNCTION public.is_note_owner(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_trashed_note(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.is_note_owner IS 'Returns whether the user is owner of a note (created_by or owner collaborator role).';
COMMENT ON FUNCTION public.can_access_trashed_note IS 'Returns whether the user can access a trashed note (owner only).';

NOTIFY pgrst, 'reload schema';
