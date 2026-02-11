-- Sync auth.users with public.users/public.organizations for RLS compatibility

CREATE OR REPLACE FUNCTION public.ensure_public_user(p_auth_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name TEXT;
  v_avatar_url TEXT;
  v_slug TEXT;
  v_org_id UUID;
BEGIN
  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_auth_user_id) THEN
    RETURN;
  END IF;

  SELECT
    COALESCE(au.email, p_auth_user_id::text || '@local.invalid'),
    COALESCE(
      au.raw_user_meta_data->>'full_name',
      au.raw_user_meta_data->>'name',
      split_part(COALESCE(au.email, p_auth_user_id::text), '@', 1),
      'User'
    ),
    au.raw_user_meta_data->>'avatar_url'
  INTO v_email, v_name, v_avatar_url
  FROM auth.users au
  WHERE au.id = p_auth_user_id;

  IF v_email IS NULL THEN
    RETURN;
  END IF;

  v_slug := 'org-' || substring(replace(p_auth_user_id::text, '-', '') from 1 for 12);

  INSERT INTO public.organizations (name, slug, plan)
  VALUES (v_name || ' Workspace', v_slug, 'free')
  ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name
  RETURNING id INTO v_org_id;

  IF v_org_id IS NULL THEN
    SELECT o.id INTO v_org_id
    FROM public.organizations o
    WHERE o.slug = v_slug
    LIMIT 1;
  END IF;

  INSERT INTO public.users (id, org_id, email, name, role, avatar_url)
  VALUES (p_auth_user_id, v_org_id, v_email, v_name, 'owner', v_avatar_url)
  ON CONFLICT (id) DO UPDATE SET
    org_id = EXCLUDED.org_id,
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.ensure_public_user(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- Backfill existing auth users
SELECT public.ensure_public_user(au.id)
FROM auth.users au;

