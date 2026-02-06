/**
 * Stripe Webhook Utilities
 *
 * Signature verification and webhook event handling.
 */

import type { SubscriptionTier, SubscriptionType } from '@obsidian-note-reviewer/collaboration/types/tier';

export type StripeWebhookEvent =
  | 'checkout.session.completed'
  | 'customer.subscription.created'
  | 'customer.subscription.updated'
  | 'customer.subscription.deleted'
  | 'invoice.paid'
  | 'invoice.payment_failed'
  | 'invoice.payment_required';

export interface StripeWebhookPayload {
  id: string;
  type: StripeWebhookEvent;
  data: {
    object: Record<string, unknown>;
  };
}

export interface CheckoutSessionData {
  id: string;
  customer: string;
  subscription?: string;
  payment_intent?: string;
  mode: 'subscription' | 'payment';
  amount_total?: number;
  currency?: string;
  status: string;
  metadata?: {
    userId?: string;
    tier?: SubscriptionTier;
    subscriptionType?: SubscriptionType;
  };
}

export interface SubscriptionData {
  id: string;
  customer: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  items: {
    data: Array<{
      price: {
        id: string;
        nickname?: string;
        unit_amount: number;
      };
    }>;
  };
}

export interface InvoiceData {
  id: string;
  subscription: string;
  customer: string;
  status: string;
  amount_paid: number;
  currency: string;
}

/**
 * Verify Stripe webhook signature
 * NOTE: This is a client-side implementation for reference.
 * Actual verification should be done server-side.
 */
export function verifyStripeSignature(
  payload: string,
  signature: string,
  webhookSecret: string
): { valid: boolean; error?: string } {
  try {
    // In a real implementation, this would use crypto.timingSafeEqual
    // For now, this is a placeholder
    // Server-side verification is required for security

    const parts = signature.split(',');
    const timestamp = parts.find((part) => part.startsWith('t='));
    const signatureHash = parts.find((part) => part.startsWith('v1='));

    if (!timestamp || !signatureHash) {
      return { valid: false, error: 'Invalid signature format' };
    }

    // TODO: Implement proper signature verification server-side
    // This requires the raw payload and Stripe webhook secret
    return { valid: true };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Signature verification failed',
    };
  }
}

/**
 * Extract subscription type from price ID
 */
export function getSubscriptionTypeFromPrice(priceId: string): SubscriptionType {
  // This would normally check against actual Stripe price IDs
  if (priceId.includes('lifetime')) {
    return 'lifetime';
  } else if (priceId.includes('yearly') || priceId.includes('annual')) {
    return 'yearly';
  }
  return 'monthly';
}

/**
 * Map Stripe subscription status to our status
 */
export function mapStripeStatus(status: string): 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing' {
  switch (status) {
    case 'active':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    case 'incomplete':
      return 'incomplete';
    case 'trialing':
      return 'trialing';
    default:
      return 'incomplete';
  }
}

/**
 * Determine tier from checkout session
 */
export function getTierFromSession(session: CheckoutSessionData): SubscriptionTier {
  if (session.mode === 'payment') {
    return 'pro'; // Lifetime purchase
  }
  return 'pro'; // Subscription
}

/**
 * Calculate period end timestamp
 */
export function calculatePeriodEnd(subscription: SubscriptionData): string {
  return new Date(subscription.current_period_end * 1000).toISOString();
}

/**
 * Calculate period start timestamp
 */
export function calculatePeriodStart(subscription: SubscriptionData): string {
  return new Date(subscription.current_period_start * 1000).toISOString();
}

/**
 * Webhook event handlers (to be implemented server-side)
 */
export const webhookHandlers = {
  'checkout.session.completed': async (data: CheckoutSessionData) => {
    // Create or update subscription record
    // Upgrade user to Pro tier
    console.log('Checkout completed:', data);
  },

  'customer.subscription.created': async (data: SubscriptionData) => {
    // Store subscription details
    console.log('Subscription created:', data);
  },

  'customer.subscription.updated': async (data: SubscriptionData) => {
    // Update subscription details
    console.log('Subscription updated:', data);
  },

  'customer.subscription.deleted': async (data: SubscriptionData) => {
    // Downgrade user to Free tier
    console.log('Subscription deleted:', data);
  },

  'invoice.paid': async (data: InvoiceData) => {
    // Extend access if needed
    console.log('Invoice paid:', data);
  },

  'invoice.payment_failed': async (data: InvoiceData) => {
    // Send warning email
    console.log('Invoice payment failed:', data);
  },

  'invoice.payment_required': async (data: InvoiceData) => {
    // Final warning before cancellation
    console.log('Invoice payment required:', data);
  },
};

export default verifyStripeSignature;
