/**
 * Subscription Hook
 *
 * Manages user subscription state and tier checking.
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type {
  SubscriptionTier,
  UserSubscription,
  TierLimits,
} from '@obsidian-note-reviewer/collaboration/types/tier';
import {
  TIER_LIMITS,
  canAddCollaborators as checkCanAddCollaborators,
} from '@obsidian-note-reviewer/collaboration/types/tier';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || '',
  import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

export interface UseSubscriptionReturn {
  subscription: UserSubscription | null;
  tier: SubscriptionTier;
  isPro: boolean;
  isFree: boolean;
  isActive: boolean;
  canAddCollaborators: boolean;
  limits: TierLimits;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing user subscription state
 */
export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch subscription from database
   */
  const fetchSubscription = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSubscription(null);
        setLoading(false);
        return;
      }

      // Fetch from subscriptions table
      const { data, error: fetchError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        // Table might not exist yet, default to free tier
        console.warn('Subscription table not found, defaulting to free tier');
        setSubscription(null);
        return;
      }

      setSubscription(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
      console.error('Subscription fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Refresh subscription data
   */
  const refresh = useCallback(async () => {
    await fetchSubscription();
  }, [fetchSubscription]);

  /**
   * Initial fetch
   */
  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  /**
   * Real-time subscription updates
   */
  useEffect(() => {
    const channel = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            setSubscription(payload.new as UserSubscription);
          } else if (payload.eventType === 'DELETE') {
            setSubscription(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  /**
   * Computed values
   */
  const tier = subscription?.tier || 'free';
  const isPro = tier === 'pro';
  const isFree = tier === 'free';
  const isActive = subscription?.status === 'active' || !subscription;
  const canAddCollabs = checkCanAddCollaborators(subscription);
  const limits = TIER_LIMITS[tier];

  return {
    subscription,
    tier,
    isPro,
    isFree,
    isActive,
    canAddCollaborators: canAddCollabs,
    limits,
    loading,
    error,
    refresh,
  };
}

/**
 * Check if user has specific permission
 */
export function useHasPermission(
  feature: keyof TierLimits
): boolean | null {
  const { limits, loading } = useSubscription();

  if (loading) return null;
  return limits[feature];
}

/**
 * Check if user can perform collaboration action
 */
export function useCanCollaborate(): { canCollaborate: boolean; reason?: string } {
  const { canAddCollaborators, isPro, isActive, subscription } = useSubscription();

  if (!subscription) {
    return { canCollaborate: false, reason: 'Faça login para colaborar' };
  }

  if (!isActive) {
    return { canCollaborate: false, reason: 'Sua assinatura está inativa' };
  }

  if (!isPro) {
    return { canCollaborate: false, reason: 'A colaboração é um recurso Pro' };
  }

  if (!canAddCollaborators) {
    return { canCollaborate: false, reason: 'Você atingiu o limite de colaboradores' };
  }

  return { canCollaborate: true };
}

export default useSubscription;
