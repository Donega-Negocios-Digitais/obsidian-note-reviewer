-- Supabase Migration: Subscription Tables
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro')),
  subscription_type TEXT CHECK (subscription_type IN ('monthly', 'yearly', 'lifetime')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'incomplete', 'trialing')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Subscription history for audit trail
CREATE TABLE IF NOT EXISTS subscription_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  from_tier TEXT CHECK (from_tier IN ('free', 'pro')),
  to_tier TEXT NOT NULL CHECK (to_tier IN ('free', 'pro')),
  event_type TEXT NOT NULL CHECK (event_type IN ('upgraded', 'downgraded', 'canceled', 'renewed', 'created')),
  stripe_event_id TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_history_created ON subscription_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_subscriptions_history_event_type ON subscription_history(event_type);

-- Enable Row Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subscriptions
-- Users can read their own subscription
CREATE POLICY "Users can read own subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything
CREATE POLICY "Service role can manage subscriptions"
  ON subscriptions FOR ALL
  USING (auth.role() = 'service_role');

-- Allow authenticated users to insert (for initial free tier creation)
CREATE POLICY "Users can insert own subscription"
  ON subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own subscription metadata (not tier/status)
CREATE POLICY "Users can update own subscription metadata"
  ON subscriptions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id AND
    -- Prevent direct tier/status changes (should be done via webhook)
    tier = (SELECT tier FROM subscriptions WHERE id = subscriptions.id) AND
    status = (SELECT status FROM subscriptions WHERE id = subscriptions.id)
  );

-- RLS Policies for subscription_history
-- Users can read their own history
CREATE POLICY "Users can read own history"
  ON subscription_history FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can insert history
CREATE POLICY "Service role can insert history"
  ON subscription_history FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Service role can read all history
CREATE POLICY "Service role can read all history"
  ON subscription_history FOR SELECT
  USING (auth.role() = 'service_role');

-- Function to create default free tier subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO subscriptions (user_id, tier, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  -- Record in history
  INSERT INTO subscription_history (user_id, from_tier, to_tier, event_type)
  VALUES (NEW.id, NULL, 'free', 'created');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create subscription on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_subscription_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscription_updated_at();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON subscriptions TO service_role;
GRANT SELECT ON subscriptions TO authenticated;
GRANT ALL ON subscription_history TO service_role;
GRANT SELECT ON subscription_history TO authenticated;

-- Create view for subscription status (easier querying)
CREATE OR REPLACE VIEW user_subscription_view AS
SELECT
  u.id as user_id,
  u.email,
  s.tier,
  s.subscription_type,
  s.status,
  s.current_period_start,
  s.current_period_end,
  s.cancel_at_period_end,
  s.created_at as subscribed_at,
  s.updated_at as subscription_updated
FROM auth.users u
LEFT JOIN subscriptions s ON u.id = s.user_id;

-- Grant view permissions
GRANT SELECT ON user_subscription_view TO authenticated;
