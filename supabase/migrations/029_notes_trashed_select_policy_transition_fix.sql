-- Fix soft-delete UPDATE failing with:
-- "new row violates row-level security policy for table notes".
--
-- Root cause:
-- The SELECT policy for trashed notes used can_access_trashed_note(), which
-- queries notes with deleted_at IS NOT NULL. During UPDATE (active -> trashed),
-- RLS checks evaluate against the transition row and this helper can evaluate
-- against pre-update visibility, causing WITH CHECK failure.

DROP POLICY IF EXISTS "Owners can view trashed notes" ON public.notes;

CREATE POLICY "Owners can view trashed notes"
  ON public.notes FOR SELECT
  USING (
    deleted_at IS NOT NULL
    AND public.is_note_owner(id, (SELECT auth.uid()))
  );

NOTIFY pgrst, 'reload schema';
