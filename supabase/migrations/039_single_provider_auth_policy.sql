-- Enforce single-provider authentication per account (email).
-- Legacy accounts with multiple providers remain compatible by preserving current providers on backfill.

CREATE TABLE IF NOT EXISTS public.auth_provider_policies (
  email TEXT PRIMARY KEY,
  allowed_providers TEXT[] NOT NULL,
  locked BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_provider_policies_email_lower CHECK (email = LOWER(email)),
  CONSTRAINT auth_provider_policies_non_empty CHECK (cardinality(allowed_providers) > 0)
);

ALTER TABLE public.auth_provider_policies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own auth provider policy" ON public.auth_provider_policies;
CREATE POLICY "Users can read own auth provider policy"
  ON public.auth_provider_policies FOR SELECT
  TO authenticated
  USING (email = LOWER(COALESCE(public.current_user_email(), '')));

CREATE OR REPLACE FUNCTION public.normalize_auth_provider(raw_provider TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  normalized TEXT;
BEGIN
  normalized := LOWER(TRIM(COALESCE(raw_provider, '')));

  IF normalized IN ('email', 'password') THEN
    RETURN 'email';
  END IF;

  IF normalized IN ('google', 'github') THEN
    RETURN normalized;
  END IF;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.extract_supported_auth_providers(raw_app_meta JSONB)
RETURNS TEXT[]
LANGUAGE sql
IMMUTABLE
AS $$
  WITH raw_candidates AS (
    SELECT public.normalize_auth_provider(raw_app_meta ->> 'provider') AS provider
    UNION ALL
    SELECT public.normalize_auth_provider(value)
    FROM jsonb_array_elements_text(
      CASE
        WHEN jsonb_typeof(raw_app_meta -> 'providers') = 'array' THEN raw_app_meta -> 'providers'
        ELSE '[]'::jsonb
      END
    ) AS value
  ),
  normalized AS (
    SELECT DISTINCT provider
    FROM raw_candidates
    WHERE provider IS NOT NULL
  )
  SELECT COALESCE(array_agg(provider ORDER BY provider), ARRAY[]::TEXT[])
  FROM normalized;
$$;

CREATE OR REPLACE FUNCTION public.list_auth_user_providers(auth_user_id UUID DEFAULT auth.uid())
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  providers TEXT[];
BEGIN
  IF auth_user_id IS NULL THEN
    RETURN ARRAY[]::TEXT[];
  END IF;

  SELECT public.extract_supported_auth_providers(au.raw_app_meta_data)
  INTO providers
  FROM auth.users au
  WHERE au.id = auth_user_id
  LIMIT 1;

  RETURN COALESCE(providers, ARRAY[]::TEXT[]);
END;
$$;

CREATE OR REPLACE FUNCTION public.current_auth_provider()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_id UUID;
  jwt_provider TEXT;
  db_provider TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RETURN NULL;
  END IF;

  jwt_provider := public.normalize_auth_provider(
    COALESCE(
      NULLIF(auth.jwt() -> 'app_metadata' ->> 'provider', ''),
      NULLIF(auth.jwt() ->> 'provider', '')
    )
  );

  IF jwt_provider IS NOT NULL THEN
    RETURN jwt_provider;
  END IF;

  SELECT public.normalize_auth_provider(au.raw_app_meta_data ->> 'provider')
  INTO db_provider
  FROM auth.users au
  WHERE au.id = caller_id
  LIMIT 1;

  RETURN COALESCE(db_provider, 'email');
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_auth_provider_policy()
RETURNS TABLE (
  email TEXT,
  allowed_providers TEXT[],
  current_provider TEXT,
  is_allowed BOOLEAN
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  caller_id UUID;
  linked_user_id UUID;
  caller_email TEXT;
  derived_providers TEXT[];
  resolved_allowed_providers TEXT[];
  resolved_current_provider TEXT;
BEGIN
  caller_id := auth.uid();
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  linked_user_id := public.ensure_public_user_linked(caller_id);
  IF linked_user_id IS NULL THEN
    RAISE EXCEPTION 'Unable to resolve current user profile';
  END IF;

  SELECT LOWER(au.email)
  INTO caller_email
  FROM auth.users au
  WHERE au.id = caller_id
  LIMIT 1;

  IF caller_email IS NULL OR caller_email = '' THEN
    RAISE EXCEPTION 'Unable to resolve current auth email';
  END IF;

  resolved_current_provider := COALESCE(public.current_auth_provider(), 'email');
  derived_providers := public.list_auth_user_providers(caller_id);

  IF derived_providers IS NULL OR cardinality(derived_providers) = 0 THEN
    derived_providers := ARRAY[resolved_current_provider];
  END IF;

  IF NOT (resolved_current_provider = ANY(derived_providers)) THEN
    derived_providers := ARRAY(
      SELECT DISTINCT provider
      FROM unnest(array_append(derived_providers, resolved_current_provider)) AS provider
      ORDER BY provider
    );
  END IF;

  INSERT INTO public.auth_provider_policies (email, allowed_providers, locked)
  VALUES (caller_email, derived_providers, TRUE)
  ON CONFLICT (email) DO NOTHING;

  SELECT app.allowed_providers
  INTO resolved_allowed_providers
  FROM public.auth_provider_policies app
  WHERE app.email = caller_email
  LIMIT 1;

  IF resolved_allowed_providers IS NULL OR cardinality(resolved_allowed_providers) = 0 THEN
    resolved_allowed_providers := derived_providers;
    UPDATE public.auth_provider_policies
    SET allowed_providers = resolved_allowed_providers,
        updated_at = NOW()
    WHERE email = caller_email;
  END IF;

  RETURN QUERY
  SELECT
    caller_email,
    resolved_allowed_providers,
    resolved_current_provider,
    resolved_current_provider = ANY(resolved_allowed_providers);
END;
$$;

DROP TRIGGER IF EXISTS update_auth_provider_policies_updated_at ON public.auth_provider_policies;
CREATE TRIGGER update_auth_provider_policies_updated_at
  BEFORE UPDATE ON public.auth_provider_policies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

WITH auth_emails AS (
  SELECT
    LOWER(au.email) AS email,
    public.extract_supported_auth_providers(au.raw_app_meta_data) AS providers
  FROM auth.users au
  WHERE au.email IS NOT NULL
),
provider_rows AS (
  SELECT
    ae.email,
    provider_row.provider
  FROM auth_emails ae
  LEFT JOIN LATERAL unnest(ae.providers) AS provider_row(provider) ON TRUE
),
grouped AS (
  SELECT
    pr.email,
    COALESCE(
      array_agg(DISTINCT pr.provider ORDER BY pr.provider) FILTER (WHERE pr.provider IS NOT NULL),
      ARRAY['email']::TEXT[]
    ) AS allowed_providers
  FROM provider_rows pr
  GROUP BY pr.email
)
INSERT INTO public.auth_provider_policies (email, allowed_providers, locked)
SELECT g.email, g.allowed_providers, TRUE
FROM grouped g
ON CONFLICT (email) DO UPDATE
SET allowed_providers = CASE
      WHEN cardinality(public.auth_provider_policies.allowed_providers) = 0
        THEN EXCLUDED.allowed_providers
      ELSE public.auth_provider_policies.allowed_providers
    END,
    updated_at = NOW();

GRANT EXECUTE ON FUNCTION public.list_auth_user_providers(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_auth_provider() TO authenticated;
GRANT EXECUTE ON FUNCTION public.enforce_auth_provider_policy() TO authenticated;

COMMENT ON TABLE public.auth_provider_policies IS
  'Authentication policy by account email. Enforces allowed login providers.';

COMMENT ON FUNCTION public.enforce_auth_provider_policy IS
  'Initializes and validates provider policy for current authenticated user.';

NOTIFY pgrst, 'reload schema';
