-- Fix Postgres volatility error:
-- "UPDATE is not allowed in a non-volatile function"
--
-- Rule:
-- - current_user_org_id() must be read-only (STABLE) because it is used in RLS.
-- - Any repair/bootstrap writes must happen in VOLATILE functions.

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  resolved_org_id UUID;
  resolved_email TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Primary path: org by exact public.users id
  SELECT u.org_id
  INTO resolved_org_id
  FROM public.users u
  WHERE u.id = caller_id
  LIMIT 1;

  IF resolved_org_id IS NOT NULL THEN
    RETURN resolved_org_id;
  END IF;

  -- Read-only fallback by JWT email for legacy rows
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
    AND u.org_id IS NOT NULL
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
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  linked_user_id UUID;
  resolved_org_id UUID;
  resolved_email TEXT;
  fallback_name TEXT;
  fallback_avatar_url TEXT;
  fallback_slug TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  linked_user_id := public.ensure_public_user_linked(caller_id);

  IF linked_user_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível resolver o perfil do usuário no workspace';
  END IF;

  SELECT u.org_id, u.email, u.name, u.avatar_url
  INTO resolved_org_id, resolved_email, fallback_name, fallback_avatar_url
  FROM public.users u
  WHERE u.id = linked_user_id
  LIMIT 1;

  -- If org is missing, first try to reattach via legacy email row.
  IF resolved_org_id IS NULL THEN
    IF resolved_email IS NOT NULL AND resolved_email <> '' THEN
      SELECT u.org_id
      INTO resolved_org_id
      FROM public.users u
      WHERE LOWER(u.email) = LOWER(resolved_email)
        AND u.org_id IS NOT NULL
      LIMIT 1;

      IF resolved_org_id IS NOT NULL THEN
        UPDATE public.users
        SET org_id = resolved_org_id, updated_at = NOW()
        WHERE id = linked_user_id
          AND org_id IS NULL;
      END IF;
    END IF;
  END IF;

  -- Last resort: bootstrap a personal workspace and attach it.
  IF resolved_org_id IS NULL THEN
    SELECT
      COALESCE(
        au.raw_user_meta_data->>'full_name',
        au.raw_user_meta_data->>'name',
        split_part(COALESCE(au.email, linked_user_id::text), '@', 1),
        fallback_name,
        'User'
      ),
      COALESCE(
        au.raw_user_meta_data->>'avatar_url',
        au.raw_user_meta_data->>'picture',
        fallback_avatar_url
      )
    INTO fallback_name, fallback_avatar_url
    FROM auth.users au
    WHERE au.id = caller_id
    LIMIT 1;

    fallback_slug := 'org-' || substring(replace(linked_user_id::text, '-', '') from 1 for 12);

    INSERT INTO public.organizations (name, slug, plan)
    VALUES (COALESCE(fallback_name, 'User') || ' Workspace', fallback_slug, 'free')
    ON CONFLICT (slug) DO UPDATE
      SET name = EXCLUDED.name
    RETURNING id INTO resolved_org_id;

    IF resolved_org_id IS NULL THEN
      SELECT o.id
      INTO resolved_org_id
      FROM public.organizations o
      WHERE o.slug = fallback_slug
      LIMIT 1;
    END IF;

    IF resolved_org_id IS NOT NULL THEN
      UPDATE public.users
      SET org_id = resolved_org_id, updated_at = NOW()
      WHERE id = linked_user_id;
    END IF;
  END IF;

  RETURN QUERY
  SELECT u.org_id, u.email, u.name, u.avatar_url
  FROM public.users u
  WHERE u.id = linked_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Não foi possível resolver o perfil do usuário no workspace';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.current_user_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_current_user_profile() TO authenticated;

COMMENT ON FUNCTION public.current_user_org_id IS 'Read-only org resolver for RLS. No writes allowed.';
COMMENT ON FUNCTION public.resolve_current_user_profile IS 'Volatile workspace/profile resolver with auth/public relink and workspace bootstrap.';

NOTIFY pgrst, 'reload schema';
