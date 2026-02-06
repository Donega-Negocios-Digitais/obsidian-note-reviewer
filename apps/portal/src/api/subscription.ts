/**
 * Subscription API Functions
 *
 * CRUD operations for subscriptions in Supabase.
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
  subscriptionType?: SubscriptionType;
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
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }

  return data as UserSubscription | null;
}

/**
 * Create or update user subscription
 */
export async function upsertSubscription(
  params: CreateSubscriptionParams
): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: params.userId,
      tier: params.tier,
      subscription_type: params.subscriptionType,
      stripe_customer_id: params.stripeCustomerId,
      stripe_subscription_id: params.stripeSubscriptionId,
      status: params.status || 'active',
      current_period_start: params.currentPeriodStart,
      current_period_end: params.currentPeriodEnd,
      cancel_at_period_end: params.cancelAtPeriodEnd || false,
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting subscription:', error);
    return null;
  }

  return data as UserSubscription;
}

/**
 * Update user subscription
 */
export async function updateUserSubscription(
  userId: string,
  updates: UpdateSubscriptionParams
): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating subscription:', error);
    return null;
  }

  return data as UserSubscription;
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
  // Get current subscription
  const current = await getUserSubscription(userId);
  const fromTier = current?.tier || 'free';

  // Update subscription
  const updated = await updateUserSubscription(userId, {
    tier: 'pro',
    subscriptionType,
    stripeCustomerId,
    stripeSubscriptionId,
    status: 'active',
    currentPeriodEnd,
  });

  // Record in history
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
  // Get current subscription
  const current = await getUserSubscription(userId);
  const fromTier = current?.tier;

  // Update subscription
  const updated = await updateUserSubscription(userId, {
    tier: 'free',
    subscriptionType: null,
    status: 'active',
    stripeSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  });

  // Record in history
  if (updated && fromTier) {
    await recordSubscriptionHistory(userId, fromTier, 'free', 'canceled', undefined, { reason });
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
 * Check if user has active Pro subscription
 */
export async function isUserPro(userId: string): Promise<boolean> {
  const subscription = await getUserSubscription(userId);

  if (!subscription) return false;
  if (subscription.tier !== 'pro') return false;
  if (subscription.status !== 'active') return false;

  return true;
}

/**
 * Get all Pro users (admin function)
 */
export async function getAllProUsers(): Promise<UserSubscription[]> {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('tier', 'pro')
    .eq('status', 'active');

  if (error) {
    console.error('Error fetching Pro users:', error);
    return [];
  }

  return (data as UserSubscription[]) || [];
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
  // Get current subscription
  const current = await getUserSubscription(targetUserId);
  const fromTier = current?.tier || 'free';

  // Update subscription
  const updated = await updateUserSubscription(targetUserId, {
    tier: newTier,
    status: 'active',
  });

  // Record in history
  if (updated) {
    const eventType = newTier === 'pro' ? 'upgraded' : 'downgraded';
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
