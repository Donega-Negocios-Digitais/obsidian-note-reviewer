-- Relink auth.users <-> public.users by ID to avoid workspace/RLS failures.
-- Symptoms fixed:
-- - 406 on /users?id=eq.<auth_uid>
-- - "new row violates row-level security policy for table notes"

CREATE OR REPLACE FUNCTION public.ensure_public_user_linked(
  p_auth_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name TEXT;
  v_avatar_url TEXT;
  legacy_user_id UUID;
  fk_record RECORD;
BEGIN
  IF p_auth_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT
    COALESCE(au.email, p_auth_user_id::text || '@local.invalid'),
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name',
      split_part(COALESCE(au.email, p_auth_user_id::text), '@', 1),
      'User'
    ),
    COALESCE(
      au.raw_user_meta_data->>'avatar_url',
      au.raw_user_meta_data->>'picture'
    )
  INTO v_email, v_name, v_avatar_url
  FROM auth.users au
  WHERE au.id = p_auth_user_id
  LIMIT 1;

  IF v_email IS NULL THEN
    RETURN NULL;
  END IF;

  IF EXISTS (SELECT 1 FROM public.users u WHERE u.id = p_auth_user_id) THEN
    UPDATE public.users
    SET
      email = v_email,
      name = COALESCE(NULLIF(v_name, ''), name),
      avatar_url = COALESCE(NULLIF(v_avatar_url, ''), avatar_url),
      updated_at = NOW()
    WHERE id = p_auth_user_id;

    RETURN p_auth_user_id;
  END IF;

  SELECT u.id
  INTO legacy_user_id
  FROM public.users u
  WHERE LOWER(u.email) = LOWER(v_email)
  LIMIT 1;

  IF legacy_user_id IS NULL THEN
    PERFORM public.ensure_public_user(p_auth_user_id);

    IF EXISTS (SELECT 1 FROM public.users u WHERE u.id = p_auth_user_id) THEN
      RETURN p_auth_user_id;
    END IF;

    RAISE EXCEPTION 'Unable to create public.users row for auth user %', p_auth_user_id;
  END IF;

  IF legacy_user_id = p_auth_user_id THEN
    RETURN p_auth_user_id;
  END IF;

  -- Avoid unique collisions on (note_id, user_id) while rekeying collaborator ownership.
  DELETE FROM public.document_collaborators dc_old
  USING public.document_collaborators dc_new
  WHERE dc_old.note_id = dc_new.note_id
    AND dc_old.user_id = legacy_user_id
    AND dc_new.user_id = p_auth_user_id;

  -- Re-point every FK column that references public.users(id).
  FOR fk_record IN
    SELECT
      n.nspname AS schema_name,
      cls.relname AS table_name,
      att.attname AS column_name
    FROM pg_constraint c
    JOIN pg_class cls ON cls.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = cls.relnamespace
    JOIN unnest(c.conkey) WITH ORDINALITY ck(attnum, ord) ON TRUE
    JOIN unnest(c.confkey) WITH ORDINALITY fk(attnum, ord) USING (ord)
    JOIN pg_attribute att ON att.attrelid = c.conrelid AND att.attnum = ck.attnum
    JOIN pg_attribute ref_att ON ref_att.attrelid = c.confrelid AND ref_att.attnum = fk.attnum
    WHERE c.contype = 'f'
      AND c.confrelid = 'public.users'::regclass
      AND ref_att.attname = 'id'
  LOOP
    EXECUTE format(
      'UPDATE %I.%I SET %I = $1 WHERE %I = $2',
      fk_record.schema_name,
      fk_record.table_name,
      fk_record.column_name,
      fk_record.column_name
    )
    USING p_auth_user_id, legacy_user_id;
  END LOOP;

  UPDATE public.users
  SET
    id = p_auth_user_id,
    email = v_email,
    name = COALESCE(NULLIF(v_name, ''), name),
    avatar_url = COALESCE(NULLIF(v_avatar_url, ''), avatar_url),
    updated_at = NOW()
  WHERE id = legacy_user_id;

  RETURN p_auth_user_id;
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
  linked_user_id UUID;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  linked_user_id := public.ensure_public_user_linked(caller_id);

  IF linked_user_id IS NULL THEN
    RAISE EXCEPTION 'Não foi possível resolver o perfil do usuário no workspace';
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

DO $$
DECLARE
  auth_row RECORD;
BEGIN
  FOR auth_row IN
    SELECT au.id
    FROM auth.users au
  LOOP
    BEGIN
      PERFORM public.ensure_public_user_linked(auth_row.id);
    EXCEPTION
      WHEN OTHERS THEN
        RAISE WARNING 'Failed to relink auth user %: %', auth_row.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_public_user_linked(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_current_user_profile() TO authenticated;

COMMENT ON FUNCTION public.ensure_public_user_linked IS 'Ensures current auth user is linked to public.users by id, remapping legacy email-linked rows when needed.';
COMMENT ON FUNCTION public.resolve_current_user_profile IS 'Returns current user workspace profile after forcing auth/public user relink.';

NOTIFY pgrst, 'reload schema';
