-- Hardening: keep org resolution resilient so note inserts don't fail for valid owners.
-- Fixes cases where profile rows are partially linked and current_user_org_id() returns null.

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
  caller_email TEXT;
  fallback_name TEXT;
  fallback_slug TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN NULL;
  END IF;

  BEGIN
    PERFORM public.ensure_public_user_linked(caller_id);
  EXCEPTION
    WHEN undefined_function THEN
      BEGIN
        PERFORM public.ensure_public_user(caller_id);
      EXCEPTION
        WHEN OTHERS THEN
          NULL;
      END;
    WHEN OTHERS THEN
      NULL;
  END;

  SELECT u.org_id
  INTO resolved_org_id
  FROM public.users u
  WHERE u.id = caller_id
  LIMIT 1;

  IF resolved_org_id IS NOT NULL THEN
    RETURN resolved_org_id;
  END IF;

  caller_email := LOWER(
    COALESCE(
      NULLIF(auth.jwt() ->> 'email', ''),
      NULLIF(auth.jwt() -> 'user_metadata' ->> 'email', '')
    )
  );

  IF caller_email IS NOT NULL AND caller_email <> '' THEN
    SELECT u.org_id
    INTO resolved_org_id
    FROM public.users u
    WHERE LOWER(u.email) = caller_email
      AND u.org_id IS NOT NULL
    LIMIT 1;

    IF resolved_org_id IS NOT NULL THEN
      UPDATE public.users
      SET org_id = resolved_org_id, updated_at = NOW()
      WHERE id = caller_id
        AND org_id IS NULL;

      RETURN resolved_org_id;
    END IF;
  END IF;

  SELECT
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name',
      split_part(COALESCE(au.email, caller_id::text), '@', 1),
      'User'
    )
  INTO fallback_name
  FROM auth.users au
  WHERE au.id = caller_id
  LIMIT 1;

  fallback_slug := 'org-' || substring(replace(caller_id::text, '-', '') from 1 for 12);

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
    WHERE id = caller_id;
  END IF;

  RETURN resolved_org_id;
END;
$$;

DROP POLICY IF EXISTS "Users can insert notes in own org" ON public.notes;
CREATE POLICY "Users can insert notes in own org"
  ON public.notes FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND org_id IS NOT DISTINCT FROM public.current_user_org_id()
  );

GRANT EXECUTE ON FUNCTION public.current_user_org_id() TO authenticated;

COMMENT ON FUNCTION public.current_user_org_id IS 'Resolves current org_id with auth/public relink fallback and workspace bootstrap when needed.';

NOTIFY pgrst, 'reload schema';
