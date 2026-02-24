-- Harden auth -> public user linking to avoid notes_created_by_fkey failures
-- for newly created accounts when public.users row is missing/desynced.

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    -- Preferred path: relink by auth ID (handles legacy email-linked rows too).
    PERFORM public.ensure_public_user_linked(NEW.id);
  EXCEPTION
    WHEN undefined_function THEN
      -- Backward compatibility for older schemas.
      PERFORM public.ensure_public_user(NEW.id);
    WHEN OTHERS THEN
      -- Last-resort fallback to keep auth flow resilient.
      BEGIN
        PERFORM public.ensure_public_user(NEW.id);
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'handle_new_auth_user fallback failed for %: %', NEW.id, SQLERRM;
      END;
  END;

  RETURN NEW;
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
        RAISE WARNING 'Failed to relink auth user % during hardening backfill: %', auth_row.id, SQLERRM;
    END;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.handle_new_auth_user IS 'Ensures each auth.users row is linked to public.users by id with relink fallback.';

NOTIFY pgrst, 'reload schema';
