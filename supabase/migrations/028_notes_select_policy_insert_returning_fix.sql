-- Fix RLS for INSERT ... RETURNING on public.notes.
-- PostgREST uses RETURNING when the client calls insert(...).select(...).
-- We must allow owners to see the freshly inserted row directly in the SELECT policy.

DROP POLICY IF EXISTS "Users can view active notes with document access" ON public.notes;

CREATE POLICY "Users can view active notes with document access"
  ON public.notes FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      created_by = (SELECT auth.uid())
      OR public.has_note_access(id, (SELECT auth.uid()))
    )
  );

NOTIFY pgrst, 'reload schema';
