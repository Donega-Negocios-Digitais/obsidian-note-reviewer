-- Fix RLS recursion on public.users by removing self-referential policy subquery.
-- The previous policy queried public.users inside the users SELECT policy itself,
-- which can raise "infinite recursion detected in policy for relation users".

CREATE OR REPLACE FUNCTION public.current_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT org_id
  FROM public.users
  WHERE id = auth.uid()
  LIMIT 1;
$$;

DROP POLICY IF EXISTS "Users can view org users" ON public.users;
CREATE POLICY "Users can view org users"
  ON public.users
  FOR SELECT
  USING (
    id = auth.uid()
    OR org_id = public.current_user_org_id()
  );
