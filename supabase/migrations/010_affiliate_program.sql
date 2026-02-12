-- Affiliate program: profile, attribution and commission tracking

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'affiliate_commission_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.affiliate_commission_status AS ENUM (
      'accrued',
      'under_review',
      'paid',
      'canceled'
    );
  END IF;
END;
$$;

CREATE TABLE IF NOT EXISTS public.affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.6000,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliate_profiles_commission_rate_check CHECK (commission_rate >= 0 AND commission_rate <= 1)
);

CREATE TABLE IF NOT EXISTS public.affiliate_attributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'link',
  first_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliate_attributions_no_self_referral CHECK (buyer_user_id <> referrer_user_id)
);

CREATE TABLE IF NOT EXISTS public.affiliate_subscription_links (
  stripe_subscription_id TEXT PRIMARY KEY,
  buyer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  affiliate_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  buyer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL,
  commission_rate NUMERIC(5,4) NOT NULL DEFAULT 0.6000,
  gross_amount_cents BIGINT NOT NULL,
  commission_amount_cents BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'brl',
  status public.affiliate_commission_status NOT NULL DEFAULT 'accrued',
  source_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  review_reason TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT affiliate_commissions_non_negative CHECK (gross_amount_cents >= 0 AND commission_amount_cents >= 0),
  CONSTRAINT affiliate_commissions_source_unique UNIQUE (source_type, source_id, referrer_user_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_profiles_code ON public.affiliate_profiles(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliate_attributions_referrer ON public.affiliate_attributions(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referrer_status ON public.affiliate_commissions(referrer_user_id, status);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_source ON public.affiliate_commissions(source_type, source_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_subscription ON public.affiliate_commissions(stripe_subscription_id);

ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_subscription_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own affiliate profile" ON public.affiliate_profiles;
CREATE POLICY "Users can view own affiliate profile"
  ON public.affiliate_profiles FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own affiliate profile" ON public.affiliate_profiles;
CREATE POLICY "Users can insert own affiliate profile"
  ON public.affiliate_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own affiliate profile" ON public.affiliate_profiles;
CREATE POLICY "Users can update own affiliate profile"
  ON public.affiliate_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view related attributions" ON public.affiliate_attributions;
CREATE POLICY "Users can view related attributions"
  ON public.affiliate_attributions FOR SELECT
  USING (auth.uid() = buyer_user_id OR auth.uid() = referrer_user_id);

DROP POLICY IF EXISTS "Service role manages attributions" ON public.affiliate_attributions;
CREATE POLICY "Service role manages attributions"
  ON public.affiliate_attributions FOR ALL
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Service role manages subscription links" ON public.affiliate_subscription_links;
CREATE POLICY "Service role manages subscription links"
  ON public.affiliate_subscription_links FOR ALL
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

DROP POLICY IF EXISTS "Referrer can view own commissions" ON public.affiliate_commissions;
CREATE POLICY "Referrer can view own commissions"
  ON public.affiliate_commissions FOR SELECT
  USING (auth.uid() = referrer_user_id);

DROP POLICY IF EXISTS "Service role manages commissions" ON public.affiliate_commissions;
CREATE POLICY "Service role manages commissions"
  ON public.affiliate_commissions FOR ALL
  USING ((SELECT auth.role()) = 'service_role')
  WITH CHECK ((SELECT auth.role()) = 'service_role');

DROP TRIGGER IF EXISTS update_affiliate_profiles_updated_at ON public.affiliate_profiles;
CREATE TRIGGER update_affiliate_profiles_updated_at
  BEFORE UPDATE ON public.affiliate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliate_attributions_updated_at ON public.affiliate_attributions;
CREATE TRIGGER update_affiliate_attributions_updated_at
  BEFORE UPDATE ON public.affiliate_attributions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliate_subscription_links_updated_at ON public.affiliate_subscription_links;
CREATE TRIGGER update_affiliate_subscription_links_updated_at
  BEFORE UPDATE ON public.affiliate_subscription_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_affiliate_commissions_updated_at ON public.affiliate_commissions;
CREATE TRIGGER update_affiliate_commissions_updated_at
  BEFORE UPDATE ON public.affiliate_commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.ensure_affiliate_profile()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_code TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT affiliate_code INTO v_code
  FROM public.affiliate_profiles
  WHERE user_id = v_user_id;

  IF v_code IS NOT NULL THEN
    RETURN v_code;
  END IF;

  v_code := LOWER('ref-' || REPLACE(v_user_id::TEXT, '-', ''));

  BEGIN
    INSERT INTO public.affiliate_profiles (user_id, affiliate_code, commission_rate)
    VALUES (v_user_id, v_code, 0.6000)
    ON CONFLICT (user_id)
    DO UPDATE SET updated_at = NOW()
    RETURNING affiliate_code INTO v_code;
  EXCEPTION
    WHEN unique_violation THEN
      v_code := LOWER('ref-' || REPLACE(gen_random_uuid()::TEXT, '-', ''));
      INSERT INTO public.affiliate_profiles (user_id, affiliate_code, commission_rate)
      VALUES (v_user_id, v_code, 0.6000)
      ON CONFLICT (user_id)
      DO UPDATE SET updated_at = NOW()
      RETURNING affiliate_code INTO v_code;
  END;

  RETURN v_code;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_affiliate_summary()
RETURNS TABLE (
  affiliate_code TEXT,
  commission_rate NUMERIC,
  total_commission_cents BIGINT,
  total_under_review_cents BIGINT,
  total_accrued_cents BIGINT,
  referred_buyers_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  PERFORM public.ensure_affiliate_profile();

  RETURN QUERY
  SELECT
    p.affiliate_code,
    p.commission_rate,
    COALESCE(SUM(c.commission_amount_cents) FILTER (WHERE c.status <> 'canceled'), 0)::BIGINT AS total_commission_cents,
    COALESCE(SUM(c.commission_amount_cents) FILTER (WHERE c.status = 'under_review'), 0)::BIGINT AS total_under_review_cents,
    COALESCE(SUM(c.commission_amount_cents) FILTER (WHERE c.status = 'accrued'), 0)::BIGINT AS total_accrued_cents,
    COALESCE(COUNT(DISTINCT a.buyer_user_id), 0)::BIGINT AS referred_buyers_count
  FROM public.affiliate_profiles p
  LEFT JOIN public.affiliate_commissions c ON c.referrer_user_id = p.user_id
  LEFT JOIN public.affiliate_attributions a ON a.referrer_user_id = p.user_id
  WHERE p.user_id = v_user_id
  GROUP BY p.affiliate_code, p.commission_rate;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_affiliate_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_affiliate_summary() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_affiliate_webhook_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_object JSONB := COALESCE(NEW.data->'object', '{}'::JSONB);
  v_client_ref TEXT;
  v_buyer_text TEXT;
  v_buyer_user_id UUID;
  v_ref_code TEXT;
  v_referrer_user_id UUID;
  v_subscription_id TEXT;
  v_mode TEXT;
  v_rate NUMERIC(5,4);
  v_gross BIGINT;
  v_commission BIGINT;
  v_currency TEXT;
  v_invoice_id TEXT;
BEGIN
  IF NEW.type = 'checkout.session.completed' THEN
    v_client_ref := NULLIF(v_object->>'client_reference_id', '');

    IF v_client_ref IS NOT NULL THEN
      IF POSITION('|ref=' IN v_client_ref) > 0 THEN
        v_buyer_text := SPLIT_PART(v_client_ref, '|ref=', 1);
        v_ref_code := LOWER(NULLIF(SPLIT_PART(v_client_ref, '|ref=', 2), ''));
      ELSE
        v_buyer_text := v_client_ref;
      END IF;

      IF v_buyer_text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN
        v_buyer_user_id := v_buyer_text::UUID;
      END IF;
    END IF;

    IF v_buyer_user_id IS NOT NULL THEN
      IF v_ref_code IS NOT NULL THEN
        SELECT user_id INTO v_referrer_user_id
        FROM public.affiliate_profiles
        WHERE affiliate_code = v_ref_code
          AND active = TRUE
        LIMIT 1;

        IF v_referrer_user_id = v_buyer_user_id THEN
          v_referrer_user_id := NULL;
          v_ref_code := NULL;
        END IF;

        IF v_referrer_user_id IS NOT NULL THEN
          INSERT INTO public.affiliate_attributions (
            buyer_user_id,
            referrer_user_id,
            affiliate_code,
            source,
            first_at,
            last_at
          ) VALUES (
            v_buyer_user_id,
            v_referrer_user_id,
            v_ref_code,
            'checkout',
            NOW(),
            NOW()
          )
          ON CONFLICT (buyer_user_id)
          DO UPDATE SET
            last_at = EXCLUDED.last_at,
            updated_at = NOW()
          WHERE public.affiliate_attributions.referrer_user_id = EXCLUDED.referrer_user_id;
        END IF;
      END IF;

      -- Keep attribution sticky for future purchases by the same buyer.
      IF v_referrer_user_id IS NULL THEN
        SELECT referrer_user_id, affiliate_code
        INTO v_referrer_user_id, v_ref_code
        FROM public.affiliate_attributions
        WHERE buyer_user_id = v_buyer_user_id
        LIMIT 1;
      END IF;

      v_subscription_id := NULLIF(v_object->>'subscription', '');
      IF v_subscription_id IS NOT NULL AND v_referrer_user_id IS NOT NULL THEN
        INSERT INTO public.affiliate_subscription_links (
          stripe_subscription_id,
          buyer_user_id,
          referrer_user_id,
          affiliate_code
        ) VALUES (
          v_subscription_id,
          v_buyer_user_id,
          v_referrer_user_id,
          v_ref_code
        )
        ON CONFLICT (stripe_subscription_id)
        DO UPDATE SET
          buyer_user_id = EXCLUDED.buyer_user_id,
          referrer_user_id = EXCLUDED.referrer_user_id,
          affiliate_code = EXCLUDED.affiliate_code,
          updated_at = NOW();
      END IF;

      v_mode := COALESCE(v_object->>'mode', '');
      IF v_mode = 'payment' AND v_referrer_user_id IS NOT NULL THEN
        SELECT commission_rate INTO v_rate
        FROM public.affiliate_profiles
        WHERE user_id = v_referrer_user_id;

        v_rate := COALESCE(v_rate, 0.6000);
        v_gross := GREATEST(
          COALESCE(NULLIF(v_object->>'amount_subtotal', '')::BIGINT, NULLIF(v_object->>'amount_total', '')::BIGINT, 0),
          0
        );
        v_commission := ROUND(v_gross * v_rate)::BIGINT;
        v_currency := COALESCE(NULLIF(LOWER(v_object->>'currency'), ''), 'brl');

        INSERT INTO public.affiliate_commissions (
          referrer_user_id,
          buyer_user_id,
          affiliate_code,
          commission_rate,
          gross_amount_cents,
          commission_amount_cents,
          currency,
          status,
          source_type,
          source_id,
          stripe_subscription_id,
          metadata
        ) VALUES (
          v_referrer_user_id,
          v_buyer_user_id,
          COALESCE(v_ref_code, ''),
          v_rate,
          v_gross,
          v_commission,
          v_currency,
          'accrued',
          'checkout_payment',
          COALESCE(NULLIF(v_object->>'id', ''), NEW.stripe_event_id),
          NULL,
          jsonb_build_object('webhook_event_id', NEW.stripe_event_id)
        )
        ON CONFLICT (source_type, source_id, referrer_user_id)
        DO NOTHING;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.type = 'invoice.paid' THEN
    v_invoice_id := NULLIF(v_object->>'id', '');
    v_subscription_id := NULLIF(v_object->>'subscription', '');

    IF v_subscription_id IS NOT NULL AND v_invoice_id IS NOT NULL THEN
      SELECT
        buyer_user_id,
        referrer_user_id,
        affiliate_code
      INTO
        v_buyer_user_id,
        v_referrer_user_id,
        v_ref_code
      FROM public.affiliate_subscription_links
      WHERE stripe_subscription_id = v_subscription_id
      LIMIT 1;

      IF v_buyer_user_id IS NULL THEN
        SELECT user_id
        INTO v_buyer_user_id
        FROM public.subscriptions
        WHERE stripe_subscription_id = v_subscription_id
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_buyer_user_id IS NOT NULL THEN
          SELECT
            referrer_user_id,
            affiliate_code
          INTO
            v_referrer_user_id,
            v_ref_code
          FROM public.affiliate_attributions
          WHERE buyer_user_id = v_buyer_user_id
          LIMIT 1;
        END IF;
      END IF;

      IF v_buyer_user_id IS NOT NULL AND v_referrer_user_id IS NOT NULL THEN
        SELECT commission_rate INTO v_rate
        FROM public.affiliate_profiles
        WHERE user_id = v_referrer_user_id;

        v_rate := COALESCE(v_rate, 0.6000);
        v_gross := GREATEST(
          COALESCE(
            NULLIF(v_object->>'subtotal', '')::BIGINT,
            NULLIF(v_object->>'amount_paid', '')::BIGINT,
            NULLIF(v_object->>'amount_due', '')::BIGINT,
            0
          ),
          0
        );
        v_commission := ROUND(v_gross * v_rate)::BIGINT;
        v_currency := COALESCE(NULLIF(LOWER(v_object->>'currency'), ''), 'brl');

        INSERT INTO public.affiliate_commissions (
          referrer_user_id,
          buyer_user_id,
          affiliate_code,
          commission_rate,
          gross_amount_cents,
          commission_amount_cents,
          currency,
          status,
          source_type,
          source_id,
          stripe_subscription_id,
          metadata
        ) VALUES (
          v_referrer_user_id,
          v_buyer_user_id,
          COALESCE(v_ref_code, ''),
          v_rate,
          v_gross,
          v_commission,
          v_currency,
          'accrued',
          'invoice_paid',
          v_invoice_id,
          v_subscription_id,
          jsonb_build_object('webhook_event_id', NEW.stripe_event_id)
        )
        ON CONFLICT (source_type, source_id, referrer_user_id)
        DO NOTHING;
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.type = 'charge.refunded' THEN
    v_invoice_id := NULLIF(v_object->>'invoice', '');

    IF v_invoice_id IS NOT NULL THEN
      UPDATE public.affiliate_commissions
      SET
        status = 'under_review',
        review_reason = 'Refund detected in Stripe webhook: charge.refunded',
        updated_at = NOW()
      WHERE source_type = 'invoice_paid'
        AND source_id = v_invoice_id
        AND status IN ('accrued', 'paid');
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.type = 'invoice.payment_failed' THEN
    v_invoice_id := NULLIF(v_object->>'id', '');

    IF v_invoice_id IS NOT NULL THEN
      UPDATE public.affiliate_commissions
      SET
        status = 'under_review',
        review_reason = 'Payment failure detected in Stripe webhook: invoice.payment_failed',
        updated_at = NOW()
      WHERE source_type = 'invoice_paid'
        AND source_id = v_invoice_id
        AND status IN ('accrued', 'paid');
    END IF;

    RETURN NEW;
  END IF;

  IF NEW.type = 'customer.subscription.deleted' THEN
    v_subscription_id := NULLIF(v_object->>'id', '');

    IF v_subscription_id IS NOT NULL THEN
      UPDATE public.affiliate_commissions
      SET
        status = 'under_review',
        review_reason = 'Subscription canceled in Stripe webhook: customer.subscription.deleted',
        updated_at = NOW()
      WHERE stripe_subscription_id = v_subscription_id
        AND status IN ('accrued', 'paid');
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_affiliate_webhook_event ON public.stripe_webhook_events;
CREATE TRIGGER trg_affiliate_webhook_event
  AFTER INSERT ON public.stripe_webhook_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_affiliate_webhook_event();

COMMENT ON TABLE public.affiliate_profiles IS 'Affiliate identity data for each user and commission rate.';
COMMENT ON TABLE public.affiliate_attributions IS 'Tracks buyer-to-referrer attribution based on referral links.';
COMMENT ON TABLE public.affiliate_subscription_links IS 'Maps Stripe subscription IDs to affiliate attribution for recurring commissions.';
COMMENT ON TABLE public.affiliate_commissions IS 'Commission ledger entries generated from Stripe webhook events.';
