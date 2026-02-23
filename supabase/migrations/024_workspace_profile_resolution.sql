-- Workspace profile/org resolution hardening for users missing in public.users.
-- This avoids cloud workspace boot failures ("Não foi possível resolver a organização do usuário")
-- and makes org resolution resilient to legacy email-linked rows.

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_org_id UUID;
  resolved_email TEXT;
BEGIN
  SELECT u.org_id
  INTO resolved_org_id
  FROM public.users u
  WHERE u.id = auth.uid()
  LIMIT 1;

  IF resolved_org_id IS NOT NULL THEN
    RETURN resolved_org_id;
  END IF;

  resolved_email := LOWER(
    COALESCE(
      NULLIF(auth.jwt() ->> 'email', ''),
      NULLIF(auth.jwt() -> 'user_metadata' ->> 'email', '')
    )
  );

  IF resolved_email IS NULL OR resolved_email = '' THEN
    RETURN NULL;
  END IF;

  SELECT u.org_id
  INTO resolved_org_id
  FROM public.users u
  WHERE LOWER(u.email) = resolved_email
  LIMIT 1;

  RETURN resolved_org_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_current_user_profile()
RETURNS TABLE (
  org_id UUID,
  email TEXT,
  name TEXT,
  avatar_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_email TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  BEGIN
    PERFORM public.ensure_public_user(caller_id);
  EXCEPTION
    WHEN undefined_function THEN
      NULL;
    WHEN OTHERS THEN
      NULL;
  END;

  RETURN QUERY
  SELECT u.org_id, u.email, u.name, u.avatar_url
  FROM public.users u
  WHERE u.id = caller_id
  LIMIT 1;

  IF FOUND THEN
    RETURN;
  END IF;

  caller_email := LOWER(
    COALESCE(
      NULLIF(auth.jwt() ->> 'email', ''),
      NULLIF(auth.jwt() -> 'user_metadata' ->> 'email', '')
    )
  );

  IF caller_email IS NOT NULL AND caller_email <> '' THEN
    RETURN QUERY
    SELECT u.org_id, u.email, u.name, u.avatar_url
    FROM public.users u
    WHERE LOWER(u.email) = caller_email
    LIMIT 1;

    IF FOUND THEN
      RETURN;
    END IF;
  END IF;

  RAISE EXCEPTION 'Não foi possível resolver o perfil do usuário no workspace';
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_current_user_profile() TO authenticated;

COMMENT ON FUNCTION public.current_user_org_id IS 'Returns current user org_id; falls back to JWT email match when public.users row by id is missing.';
COMMENT ON FUNCTION public.resolve_current_user_profile IS 'Best-effort resolver for workspace profile/org_id (id first, then JWT email fallback).';

NOTIFY pgrst, 'reload schema';
