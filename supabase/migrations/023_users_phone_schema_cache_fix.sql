-- Ensure users.phone exists in remote schema and refresh PostgREST cache.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS phone TEXT;

NOTIFY pgrst, 'reload schema';
