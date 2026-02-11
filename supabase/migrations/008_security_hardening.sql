-- Security hardening and lint remediation

-- ---------------------------------------------------------------------------
-- Enable RLS for stripe webhook storage
-- ---------------------------------------------------------------------------
ALTER TABLE IF EXISTS public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage webhook events" ON public.stripe_webhook_events;
CREATE POLICY "Service role can manage webhook events"
  ON public.stripe_webhook_events
  FOR ALL
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

-- ---------------------------------------------------------------------------
-- Restrict materialized view exposure via Data API
-- ---------------------------------------------------------------------------
REVOKE ALL ON TABLE public.org_stats FROM anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fix mutable search_path warnings for functions
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  BEGIN
    ALTER FUNCTION public.update_updated_at_column() SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.analyze_index_usage() SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.find_missing_indexes() SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_active_subscription(UUID) SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_current_usage(UUID, TEXT) SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.check_usage_limit(UUID, TEXT, BIGINT) SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.record_usage(UUID, TEXT, BIGINT) SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_subscription_summary(UUID) SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.has_note_access(UUID, UUID) SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.get_note_role(UUID, UUID) SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.invite_to_document(UUID, TEXT, TEXT, UUID) SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.accept_document_invite(TEXT, UUID) SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.accept_document_invite(UUID, UUID) SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.ensure_public_user(UUID) SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;

  BEGIN
    ALTER FUNCTION public.handle_new_auth_user() SET search_path = public;
  EXCEPTION WHEN undefined_function THEN NULL;
  END;
END;
$$;
