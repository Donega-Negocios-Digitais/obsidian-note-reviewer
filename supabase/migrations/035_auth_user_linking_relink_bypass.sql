-- Allow controlled ownership relink updates during ensure_public_user_linked.
-- This avoids trigger failures while rewiring legacy user IDs in notes.

CREATE OR REPLACE FUNCTION public.enforce_note_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
  caller_is_owner BOOLEAN;
  relink_bypass_enabled BOOLEAN;
BEGIN
  relink_bypass_enabled := COALESCE(current_setting('app.user_relink', true), '') = 'on';
  IF relink_bypass_enabled THEN
    RETURN NEW;
  END IF;

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
  placeholder_email TEXT;
  fallback_org_id UUID;
  fallback_role TEXT;
  fallback_phone TEXT;
  legacy_record RECORD;
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

  IF NOT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE LOWER(u.email) = LOWER(v_email)
      AND u.id <> p_auth_user_id
  ) THEN
    PERFORM public.ensure_public_user(p_auth_user_id);

    IF EXISTS (SELECT 1 FROM public.users u WHERE u.id = p_auth_user_id) THEN
      RETURN p_auth_user_id;
    END IF;

    RAISE EXCEPTION 'Unable to create public.users row for auth user %', p_auth_user_id;
  END IF;

  placeholder_email := p_auth_user_id::TEXT || '@relink.local';

  INSERT INTO public.users (
    id,
    email,
    name,
    role,
    avatar_url
  )
  VALUES (
    p_auth_user_id,
    placeholder_email,
    COALESCE(NULLIF(v_name, ''), 'User'),
    'member',
    NULLIF(v_avatar_url, '')
  )
  ON CONFLICT (id) DO NOTHING;

  -- Enable controlled trigger bypass for this transaction while rewiring legacy references.
  PERFORM set_config('app.user_relink', 'on', true);

  FOR legacy_record IN
    SELECT
      u.id,
      u.org_id,
      u.role,
      u.avatar_url,
      u.name,
      u.phone
    FROM public.users u
    WHERE LOWER(u.email) = LOWER(v_email)
      AND u.id <> p_auth_user_id
    ORDER BY u.created_at
  LOOP
    fallback_org_id := COALESCE(fallback_org_id, legacy_record.org_id);
    fallback_role := COALESCE(fallback_role, legacy_record.role);
    fallback_phone := COALESCE(fallback_phone, legacy_record.phone);

    IF (v_avatar_url IS NULL OR v_avatar_url = '') AND legacy_record.avatar_url IS NOT NULL THEN
      v_avatar_url := legacy_record.avatar_url;
    END IF;

    IF (v_name IS NULL OR v_name = '') AND legacy_record.name IS NOT NULL THEN
      v_name := legacy_record.name;
    END IF;

    DELETE FROM public.document_collaborators dc_old
    USING public.document_collaborators dc_new
    WHERE dc_old.note_id = dc_new.note_id
      AND dc_old.user_id = legacy_record.id
      AND dc_new.user_id = p_auth_user_id;

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
      USING p_auth_user_id, legacy_record.id;
    END LOOP;

    DELETE FROM public.users
    WHERE id = legacy_record.id;
  END LOOP;

  UPDATE public.users
  SET
    org_id = COALESCE(fallback_org_id, org_id),
    email = v_email,
    name = COALESCE(NULLIF(v_name, ''), name, 'User'),
    role = COALESCE(NULLIF(fallback_role, ''), role, 'member'),
    avatar_url = COALESCE(NULLIF(v_avatar_url, ''), avatar_url),
    phone = COALESCE(fallback_phone, phone),
    updated_at = NOW()
  WHERE id = p_auth_user_id;

  RETURN p_auth_user_id;
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

NOTIFY pgrst, 'reload schema';
