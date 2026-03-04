-- Hook review endpoints are called by the CLI (unauthenticated) to publish/wait revisions.
-- These tables are isolated and protected by session_id + review_key_hash at the API layer.

grant select, insert, update, delete on table public.hook_review_sessions to anon, authenticated;
grant select, insert, update, delete on table public.hook_review_revisions to anon, authenticated;
grant select, insert, update, delete on table public.hook_review_decisions to anon, authenticated;

drop policy if exists "Hook review sessions public rw" on public.hook_review_sessions;
create policy "Hook review sessions public rw"
on public.hook_review_sessions
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Hook review revisions public rw" on public.hook_review_revisions;
create policy "Hook review revisions public rw"
on public.hook_review_revisions
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "Hook review decisions public rw" on public.hook_review_decisions;
create policy "Hook review decisions public rw"
on public.hook_review_decisions
for all
to anon, authenticated
using (true)
with check (true);
