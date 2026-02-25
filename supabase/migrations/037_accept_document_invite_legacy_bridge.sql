-- Bridge legacy accept_document_invite(invite_token, user_uuid) callers to the
-- linked-safe flow to avoid document_collaborators_user_id_fkey errors.

CREATE OR REPLACE FUNCTION public.accept_document_invite(
  invite_token TEXT,
  user_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  linked_user_id UUID;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  linked_user_id := public.ensure_public_user_linked(caller_id);
  IF linked_user_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve current user profile';
  END IF;

  IF user_uuid IS NOT NULL AND user_uuid <> linked_user_id THEN
    RAISE EXCEPTION 'User mismatch for invite acceptance';
  END IF;

  PERFORM public.accept_document_invite(invite_token);
  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.accept_document_invite(TEXT, UUID) IS
  'Legacy compatibility wrapper. Delegates to accept_document_invite(invite_token) with linked user checks.';

GRANT EXECUTE ON FUNCTION public.accept_document_invite(TEXT, UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

