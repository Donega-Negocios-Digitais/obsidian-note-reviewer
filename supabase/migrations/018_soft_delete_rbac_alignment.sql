-- Hardening: align soft-delete lifecycle with document-level RBAC
-- - deleted notes are inaccessible through document access helpers
-- - trash access is owner-only
-- - purge > N days is performed in DB with pg_cron

ALTER TABLE public.notes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_notes_deleted_at
  ON public.notes(deleted_at)
  WHERE deleted_at IS NOT NULL;

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
      AND n.created_by = COALESCE(user_uuid, auth.uid())
  );
$$;

CREATE OR REPLACE FUNCTION public.has_note_access(
  note_uuid UUID,
  user_uuid UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_user UUID;
BEGIN
  resolved_user := COALESCE(user_uuid, auth.uid());

  RETURN EXISTS (
    SELECT 1
    FROM public.notes n
    WHERE n.id = note_uuid
      AND n.deleted_at IS NULL
      AND (
        n.is_public = TRUE
        OR (
          resolved_user IS NOT NULL
          AND (
            n.created_by = resolved_user
            OR EXISTS (
              SELECT 1
              FROM public.document_collaborators dc
              WHERE dc.note_id = n.id
                AND dc.user_id = resolved_user
                AND dc.status = 'active'
            )
          )
        )
      )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_note_role(
  note_uuid UUID,
  user_uuid UUID
)
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_user UUID;
  collaborator_role TEXT;
  note_owner UUID;
  is_public_note BOOLEAN;
  note_deleted_at TIMESTAMPTZ;
BEGIN
  resolved_user := COALESCE(user_uuid, auth.uid());

  SELECT n.created_by, n.is_public, n.deleted_at
  INTO note_owner, is_public_note, note_deleted_at
  FROM public.notes n
  WHERE n.id = note_uuid
  LIMIT 1;

  IF note_owner IS NULL THEN
    RETURN 'none';
  END IF;

  IF note_deleted_at IS NOT NULL THEN
    RETURN 'none';
  END IF;

  IF resolved_user IS NOT NULL AND note_owner = resolved_user THEN
    RETURN 'owner';
  END IF;

  IF resolved_user IS NOT NULL THEN
    SELECT dc.role
    INTO collaborator_role
    FROM public.document_collaborators dc
    WHERE dc.note_id = note_uuid
      AND dc.user_id = resolved_user
      AND dc.status = 'active'
    LIMIT 1;

    IF collaborator_role IS NOT NULL THEN
      RETURN collaborator_role;
    END IF;
  END IF;

  IF COALESCE(is_public_note, FALSE) THEN
    RETURN 'viewer';
  END IF;

  RETURN 'none';
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_deleted_notes_older_than(
  days_threshold INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  effective_days INTEGER;
  deleted_count INTEGER := 0;
BEGIN
  effective_days := COALESCE(days_threshold, 30);
  IF effective_days < 1 THEN
    effective_days := 30;
  END IF;

  WITH purged AS (
    DELETE FROM public.notes n
    WHERE n.deleted_at IS NOT NULL
      AND n.deleted_at < NOW() - make_interval(days => effective_days)
    RETURNING n.id
  )
  SELECT COUNT(*) INTO deleted_count
  FROM purged;

  RETURN deleted_count;
END;
$$;

-- Protect sensitive fields during updates:
-- editors can edit content/title, but cannot soft-delete/restore or mutate ownership.
CREATE OR REPLACE FUNCTION public.enforce_note_sensitive_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id UUID;
BEGIN
  caller_id := auth.uid();

  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NEW.created_by IS DISTINCT FROM OLD.created_by AND caller_id <> OLD.created_by THEN
    RAISE EXCEPTION 'Only owner can reassign document ownership';
  END IF;

  IF NEW.org_id IS DISTINCT FROM OLD.org_id AND caller_id <> OLD.created_by THEN
    RAISE EXCEPTION 'Only owner can move document organization';
  END IF;

  IF NEW.deleted_at IS DISTINCT FROM OLD.deleted_at AND caller_id <> OLD.created_by THEN
    RAISE EXCEPTION 'Only owner can delete or restore document';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_note_sensitive_fields ON public.notes;
CREATE TRIGGER enforce_note_sensitive_fields
  BEFORE UPDATE ON public.notes
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_note_sensitive_fields();

DROP POLICY IF EXISTS "Users can view notes with document access" ON public.notes;
DROP POLICY IF EXISTS "Users can insert notes in own org" ON public.notes;
DROP POLICY IF EXISTS "Users can update notes they can edit" ON public.notes;
DROP POLICY IF EXISTS "Owners can delete notes" ON public.notes;
DROP POLICY IF EXISTS "Users can view notes in their org" ON public.notes;
DROP POLICY IF EXISTS "Users can view trashed notes in their org" ON public.notes;
DROP POLICY IF EXISTS "Users can update notes in their org" ON public.notes;
DROP POLICY IF EXISTS "Users can delete notes in their org" ON public.notes;
DROP POLICY IF EXISTS "Users can view org notes or public notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert notes in their org" ON public.notes;

CREATE POLICY "Users can view active notes with document access"
  ON public.notes FOR SELECT
  USING (
    deleted_at IS NULL
    AND public.has_note_access(id, (SELECT auth.uid()))
  );

CREATE POLICY "Owners can view trashed notes"
  ON public.notes FOR SELECT
  USING (public.can_access_trashed_note(id, (SELECT auth.uid())));

CREATE POLICY "Users can insert notes in own org"
  ON public.notes FOR INSERT
  WITH CHECK (
    created_by = (SELECT auth.uid())
    AND org_id = public.current_user_org_id()
  );

CREATE POLICY "Owners can update notes"
  ON public.notes FOR UPDATE
  USING (created_by = (SELECT auth.uid()))
  WITH CHECK (created_by = (SELECT auth.uid()));

CREATE POLICY "Editors can update active notes"
  ON public.notes FOR UPDATE
  USING (
    deleted_at IS NULL
    AND public.get_note_role(id, (SELECT auth.uid())) IN ('owner', 'editor')
  )
  WITH CHECK (
    deleted_at IS NULL
    AND public.get_note_role(id, (SELECT auth.uid())) IN ('owner', 'editor')
  );

CREATE POLICY "Owners can delete notes permanently"
  ON public.notes FOR DELETE
  USING (created_by = (SELECT auth.uid()));

-- Keep permissions of dependent policies coherent via has_note_access/get_note_role replacement.

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;

DO $$
DECLARE
  existing_job_id BIGINT;
BEGIN
  BEGIN
    SELECT jobid
    INTO existing_job_id
    FROM cron.job
    WHERE jobname = 'purge_deleted_notes_daily'
    LIMIT 1;

    IF existing_job_id IS NOT NULL THEN
      PERFORM cron.unschedule(existing_job_id);
    END IF;

    PERFORM cron.schedule(
      'purge_deleted_notes_daily',
      '15 3 * * *',
      $cron$SELECT public.purge_deleted_notes_older_than(30);$cron$
    );
  EXCEPTION
    WHEN undefined_table OR undefined_function THEN
      RAISE NOTICE 'pg_cron unavailable in this environment; skipping schedule.';
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'Insufficient privilege to manage pg_cron schedule.';
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_access_trashed_note(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.purge_deleted_notes_older_than(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.has_note_access(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.has_note_access(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_note_role(UUID, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_note_role(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION public.can_access_trashed_note IS 'Returns whether the current/target user can access a trashed note (owner only).';
COMMENT ON FUNCTION public.purge_deleted_notes_older_than IS 'Permanently removes notes in trash older than the retention threshold.';
COMMENT ON FUNCTION public.enforce_note_sensitive_fields IS 'Protects ownership/org and soft-delete state from non-owner mutations.';
