/**
 * Subscription Tier Types
 *
 * Defines subscription tiers and their limits for freemium model.
 */

export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

export type SubscriptionType = 'month' | 'year' | 'monthly' | 'yearly' | 'lifetime';

export type SubscriptionStatus =
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'trialing'
  | 'unpaid'
  | 'incomplete_expired'
  | 'paused';

export interface TierLimits {
  maxCollaborators: number;
  maxSharedDocuments: number;
  hasAdvancedFeatures: boolean;
  hasRealtimeCollaboration: boolean;
  hasVersionHistory: boolean;
  hasAiSuggestions: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  subscriptionType: SubscriptionType | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Tier limits configuration
 * -1 means unlimited
 */
export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    maxCollaborators: 0,
    maxSharedDocuments: 0,
    hasAdvancedFeatures: false,
    hasRealtimeCollaboration: false,
    hasVersionHistory: true,
    hasAiSuggestions: false,
  },
  pro: {
    maxCollaborators: -1, // unlimited
    maxSharedDocuments: -1, // unlimited
    hasAdvancedFeatures: true,
    hasRealtimeCollaboration: true,
    hasVersionHistory: true,
    hasAiSuggestions: true,
  },
  enterprise: {
    maxCollaborators: -1,
    maxSharedDocuments: -1,
    hasAdvancedFeatures: true,
    hasRealtimeCollaboration: true,
    hasVersionHistory: true,
    hasAiSuggestions: true,
  },
};

/**
 * Check if tier has permission for feature
 */
export function hasTierFeature(
  tier: SubscriptionTier,
  feature: keyof TierLimits
): boolean {
  return TIER_LIMITS[tier][feature];
}

/**
 * Check if user can add collaborators
 */
export function canAddCollaborators(subscription: UserSubscription | null): boolean {
  if (!subscription) return false;
  if (subscription.tier === 'free') return false;
  if (subscription.status !== 'active') return false;

  const limits = TIER_LIMITS[subscription.tier];
  return limits.maxCollaborators === -1 || limits.maxCollaborators > 0;
}

/**
 * Get display name for tier
 */
export function getTierDisplayName(tier: SubscriptionTier): string {
  const names: Record<SubscriptionTier, string> = {
    free: 'Gratuito',
    pro: 'Pro',
    enterprise: 'Enterprise',
  };
  return names[tier];
}

/**
 * Get display name for subscription type
 */
export function getSubscriptionTypeDisplayName(type: SubscriptionType | null): string {
  if (!type) return '-';
  const names: Record<SubscriptionType, string> = {
    month: 'Mensal',
    year: 'Anual',
    monthly: 'Mensal',
    yearly: 'Anual',
    lifetime: 'Vitalício',
  };
  return names[type];
}

/**
 * Get display name for subscription status
 */
export function getStatusDisplayName(status: SubscriptionStatus): string {
  const names: Record<SubscriptionStatus, string> = {
    active: 'Ativo',
    past_due: 'Pagamento Pendente',
    canceled: 'Cancelado',
    incomplete: 'Incompleto',
    trialing: 'Teste Gratuito',
    unpaid: 'Nao Pago',
    incomplete_expired: 'Expirado',
    paused: 'Pausado',
  };
  return names[status];
}

export default TIER_LIMITS;
