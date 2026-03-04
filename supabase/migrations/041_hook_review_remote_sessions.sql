-- Remote hook-review session persistence for production plan-live flow.

CREATE TABLE IF NOT EXISTS public.hook_review_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT NOT NULL UNIQUE,
  review_key_hash TEXT NOT NULL,
  workspace_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hook_review_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_ref UUID NOT NULL REFERENCES public.hook_review_sessions(id) ON DELETE CASCADE,
  revision_id TEXT NOT NULL UNIQUE,
  file_path TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.hook_review_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_ref UUID NOT NULL REFERENCES public.hook_review_sessions(id) ON DELETE CASCADE,
  revision_id TEXT NOT NULL UNIQUE,
  decision TEXT NOT NULL CHECK (decision IN ('approve', 'request_changes')),
  feedback TEXT,
  decided_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hook_review_sessions_expires_at
  ON public.hook_review_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_hook_review_revisions_session_created
  ON public.hook_review_revisions(session_ref, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hook_review_decisions_session_revision
  ON public.hook_review_decisions(session_ref, revision_id);

ALTER TABLE public.hook_review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hook_review_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hook_review_decisions ENABLE ROW LEVEL SECURITY;

-- No RLS policies are granted for anon/authenticated clients.
-- Access is intentionally restricted to server-side API using service role key.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.hook_review_sessions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hook_review_revisions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hook_review_decisions TO service_role;

CREATE TRIGGER update_hook_review_sessions_updated_at
  BEFORE UPDATE ON public.hook_review_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.hook_review_sessions IS
  'Session registry for remote production hook review flow.';

COMMENT ON TABLE public.hook_review_revisions IS
  'Plan revisions published by CLI hook into production review sessions.';

COMMENT ON TABLE public.hook_review_decisions IS
  'Approve/request_changes decisions sent from authenticated production UI.';
