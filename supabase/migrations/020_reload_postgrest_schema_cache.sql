-- Force PostgREST to reload schema cache after structural migration changes
NOTIFY pgrst, 'reload schema';
