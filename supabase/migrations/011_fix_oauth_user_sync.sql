-- Fix ensure_public_user to handle email conflicts and prevent login blocks
-- This replaces the function from 007_auth_user_sync.sql

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
  -- 1. Check if user already exists in public.users by ID
  IF EXISTS (SELECT 1 FROM public.users WHERE id = p_auth_user_id) THEN
    RETURN;
  END IF;

  -- 2. Get auth user details
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

  -- 3. Check if email already exists in public.users (linked to another auth_id?)
  -- If we find a user with this email but different ID, we effectively have a conflict.
  -- Ideally, Supabase Auth handles linking, but if we get here with a new ID but existing email in public.user,
  -- it means we have a desync. We can't easily "merge" without risking security.
  -- For now, we will TRY to insert/update, but wrap in exception block to ensure we don't block auth.

  BEGIN
    -- Create Org
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

    -- Upsert User
    -- We match on ID. If email conflict happens (unique constraint), we catch it below.
    INSERT INTO public.users (id, org_id, email, name, role, avatar_url)
    VALUES (p_auth_user_id, v_org_id, v_email, v_name, 'owner', v_avatar_url)
    ON CONFLICT (id) DO UPDATE SET
      org_id = EXCLUDED.org_id,
      email = EXCLUDED.email,
      name = EXCLUDED.name,
      avatar_url = EXCLUDED.avatar_url,
      updated_at = NOW();
      
  EXCEPTION WHEN OTHERS THEN
    -- Log error but allow auth to proceed (if possible)
    -- In a real scenario, we might want to log this to a table
    RAISE WARNING 'Error in ensure_public_user: %', SQLERRM;
    -- We do NOT re-raise, so the trigger success completes, and Supabase Auth succeeds.
    -- The user will exist in Auth but might be missing in public.users if this fails.
    -- The app should handle "missing profile" gracefully or retry.
  END;

END;
$$;
