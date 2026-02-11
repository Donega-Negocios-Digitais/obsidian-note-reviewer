/**
 * Subscription API Functions
 *
 * CRUD operations for subscriptions in Supabase.
 * This module maps DB snake_case fields to the app's camelCase subscription model.
 */

import { createClient } from '@supabase/supabase-js';
import type {
  SubscriptionTier,
  SubscriptionType,
  SubscriptionStatus,
  UserSubscription,
} from '@obsidian-note-reviewer/collaboration/types/tier';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

type BillingInterval = 'month' | 'year';

type SubscriptionRow = {
  id: string;
  user_id: string;
  plan_tier: SubscriptionTier;
  billing_interval: BillingInterval | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string;
};

export interface CreateSubscriptionParams {
  userId: string;
  tier: SubscriptionTier;
  subscriptionType?: SubscriptionType;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status?: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface UpdateSubscriptionParams {
  tier?: SubscriptionTier;
  subscriptionType?: SubscriptionType | null;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string | null;
  status?: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Get user subscription
 */
export async function getUserSubscription(
  userId: string
): Promise<UserSubscription | null> {
  const row = await getLatestSubscriptionRow(userId);
  return row ? toUserSubscription(row) : null;
}

/**
 * Create or update user subscription
 */
export async function upsertSubscription(
  params: CreateSubscriptionParams
): Promise<UserSubscription | null> {
  const existing = await getLatestSubscriptionRow(params.userId);

  const payload = {
    user_id: params.userId,
    plan_tier: params.tier,
    billing_interval: toBillingInterval(params.subscriptionType),
    stripe_customer_id: params.stripeCustomerId || existing?.stripe_customer_id || `local_${params.userId}`,
    stripe_subscription_id: params.stripeSubscriptionId || existing?.stripe_subscription_id || null,
    status: params.status || 'active',
    current_period_start: params.currentPeriodStart || existing?.current_period_start || null,
    current_period_end: params.currentPeriodEnd || existing?.current_period_end || null,
    cancel_at: params.cancelAtPeriodEnd
      ? (params.currentPeriodEnd || existing?.current_period_end || new Date().toISOString())
      : null,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    const { data, error } = await supabase
      .from('subscriptions')
      .update(payload)
      .eq('id', existing.id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Error updating subscription:', error);
      return null;
    }

    return toUserSubscription(data as SubscriptionRow);
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .insert(payload)
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error creating subscription:', error);
    return null;
  }

  return toUserSubscription(data as SubscriptionRow);
}

/**
 * Update user subscription
 */
export async function updateUserSubscription(
  userId: string,
  updates: UpdateSubscriptionParams
): Promise<UserSubscription | null> {
  const existing = await getLatestSubscriptionRow(userId);
  if (!existing) {
    return null;
  }

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.tier !== undefined) updatePayload.plan_tier = updates.tier;
  if (updates.subscriptionType !== undefined) updatePayload.billing_interval = toBillingInterval(updates.subscriptionType);
  if (updates.stripeCustomerId !== undefined) updatePayload.stripe_customer_id = updates.stripeCustomerId;
  if (updates.stripeSubscriptionId !== undefined) updatePayload.stripe_subscription_id = updates.stripeSubscriptionId;
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.currentPeriodStart !== undefined) updatePayload.current_period_start = updates.currentPeriodStart;
  if (updates.currentPeriodEnd !== undefined) updatePayload.current_period_end = updates.currentPeriodEnd;

  if (updates.cancelAtPeriodEnd === true) {
    updatePayload.cancel_at = updates.currentPeriodEnd || existing.current_period_end || new Date().toISOString();
  }
  if (updates.cancelAtPeriodEnd === false) {
    updatePayload.cancel_at = null;
  }

  if (updates.metadata !== undefined) {
    updatePayload.metadata = updates.metadata;
  }

  const { data, error } = await supabase
    .from('subscriptions')
    .update(updatePayload)
    .eq('id', existing.id)
    .select('*')
    .single();

  if (error || !data) {
    console.error('Error updating subscription:', error);
    return null;
  }

  return toUserSubscription(data as SubscriptionRow);
}

/**
 * Upgrade user to Pro
 */
export async function upgradeUserToPro(
  userId: string,
  stripeCustomerId: string,
  stripeSubscriptionId: string,
  subscriptionType: SubscriptionType,
  currentPeriodEnd?: string
): Promise<UserSubscription | null> {
  const current = await getUserSubscription(userId);
  const fromTier = current?.tier || 'free';

  const updated = await updateUserSubscription(userId, {
    tier: 'pro',
    subscriptionType,
    stripeCustomerId,
    stripeSubscriptionId,
    status: 'active',
    currentPeriodEnd,
  });

  if (updated) {
    await recordSubscriptionHistory(
      userId,
      fromTier,
      'pro',
      'upgraded',
      stripeSubscriptionId
    );
  }

  return updated;
}

/**
 * Downgrade user to Free
 */
export async function downgradeUserToFree(
  userId: string,
  reason?: string
): Promise<UserSubscription | null> {
  const current = await getUserSubscription(userId);
  const fromTier = current?.tier || null;

  const updated = await updateUserSubscription(userId, {
    tier: 'free',
    subscriptionType: null,
    status: 'active',
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });

  if (updated && fromTier) {
    await recordSubscriptionHistory(
      userId,
      fromTier,
      'free',
      'canceled',
      undefined,
      { reason }
    );
  }

  return updated;
}

/**
 * Cancel subscription at period end
 */
export async function cancelSubscriptionAtPeriodEnd(
  userId: string
): Promise<UserSubscription | null> {
  return updateUserSubscription(userId, {
    cancelAtPeriodEnd: true,
  });
}

/**
 * Record subscription history event
 */
export async function recordSubscriptionHistory(
  userId: string,
  fromTier: SubscriptionTier | null,
  toTier: SubscriptionTier,
  eventType: 'upgraded' | 'downgraded' | 'canceled' | 'renewed' | 'created',
  stripeEventId?: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase
    .from('subscription_history')
    .insert({
      user_id: userId,
      from_tier: fromTier,
      to_tier: toTier,
      event_type: eventType,
      stripe_event_id: stripeEventId,
      metadata: metadata || {},
    });

  if (error) {
    console.error('Error recording subscription history:', error);
  }
}

/**
 * Get subscription history for user
 */
export async function getSubscriptionHistory(
  userId: string,
  limit = 20
): Promise<unknown[]> {
  const { data, error } = await supabase
    .from('subscription_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching subscription history:', error);
    return [];
  }

  return data || [];
}

/**
 * Check if user has active paid subscription
 */
export async function isUserPro(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) return false;
  if (subscription.tier !== 'pro' && subscription.tier !== 'enterprise') return false;
  if (subscription.status !== 'active' && subscription.status !== 'trialing') return false;

  return true;
}

/**
 * Get all paid users (admin function)
 */
export async function getAllProUsers(): Promise<UserSubscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .in('plan_tier', ['pro', 'enterprise'])
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching paid users:', error);
    return [];
  }

  return (data || []).map((row) => toUserSubscription(row as SubscriptionRow));
}

/**
 * Manually update subscription tier (admin function)
 */
export async function manuallyUpdateTier(
  adminUserId: string,
  targetUserId: string,
  newTier: SubscriptionTier,
  reason: string
): Promise<UserSubscription | null> {
  const current = await getUserSubscription(targetUserId);
  const fromTier = current?.tier || 'free';

  const updated = await updateUserSubscription(targetUserId, {
    tier: newTier,
    status: 'active',
  });

  if (updated) {
    const eventType = newTier === 'free' ? 'downgraded' : 'upgraded';
    await recordSubscriptionHistory(
      targetUserId,
      fromTier,
      newTier,
      eventType,
      undefined,
      { reason, admin: adminUserId, manual_update: true }
    );
  }

  return updated;
}

export default {
  getUserSubscription,
  upsertSubscription,
  updateUserSubscription,
  upgradeUserToPro,
  downgradeUserToFree,
  cancelSubscriptionAtPeriodEnd,
  recordSubscriptionHistory,
  getSubscriptionHistory,
  isUserPro,
  getAllProUsers,
  manuallyUpdateTier,
};

async function getLatestSubscriptionRow(userId: string): Promise<SubscriptionRow | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return (data as SubscriptionRow | null) || null;
}

function toBillingInterval(type?: SubscriptionType | null): BillingInterval | null {
  if (!type) return null;
  if (type === 'month' || type === 'monthly') return 'month';
  if (type === 'year' || type === 'yearly') return 'year';
  return null;
}

function fromBillingInterval(interval: BillingInterval | null): SubscriptionType | null {
  if (interval === 'month') return 'monthly';
  if (interval === 'year') return 'yearly';
  return null;
}

function toUserSubscription(row: SubscriptionRow): UserSubscription {
  return {
    id: row.id,
    userId: row.user_id,
    tier: row.plan_tier,
    subscriptionType: fromBillingInterval(row.billing_interval),
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    currentPeriodStart: row.current_period_start || row.created_at,
    currentPeriodEnd: row.current_period_end,
    cancelAtPeriodEnd: Boolean(row.cancel_at),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
