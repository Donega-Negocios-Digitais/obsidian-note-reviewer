/**
 * Stripe Checkout Hook
 *
 * Manages Stripe checkout flow for subscriptions and one-time payments.
 */

import { useCallback } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@obsidian-note-reviewer/security/auth';
import { STRIPE_CONFIG } from '../config/stripe';
import { encodeCheckoutClientReferenceId, getStoredReferralCode } from '../lib/referral';

let stripePromise: Promise<Stripe | null>;

/**
 * Load Stripe instance
 */
function getStripe(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_CONFIG.publishableKey);
  }
  return stripePromise;
}

export type CheckoutMode = 'subscription' | 'payment';

export interface CheckoutOptions {
  mode: CheckoutMode;
  priceId: string;
  successUrl?: string;
  cancelUrl?: string;
  metadata?: Record<string, string>;
}

export interface UseStripeCheckoutReturn {
  redirectToCheckout: (options: CheckoutOptions) => Promise<boolean>;
  subscribeMonthly: () => Promise<boolean>;
  subscribeYearly: () => Promise<boolean>;
  purchaseLifetime: () => Promise<boolean>;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook for Stripe checkout
 */
export function useStripeCheckout(): UseStripeCheckoutReturn {
  const { user } = useAuth();
  const navigate = useNavigate();

  const redirectToCheckout = useCallback(async (options: CheckoutOptions): Promise<boolean> => {
    try {
      const buyerUserId = options.metadata?.userId || user?.id;
      if (!buyerUserId) {
        navigate('/auth/login');
        return false;
      }

      const stripe = await getStripe();

      if (!stripe) {
        throw new Error('Failed to load Stripe');
      }

      const referralCode = getStoredReferralCode();
      const clientReferenceId = encodeCheckoutClientReferenceId(buyerUserId, referralCode);
      const successUrl = options.successUrl || `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = options.cancelUrl || `${window.location.origin}/checkout/cancel`;

      const { error } = await stripe.redirectToCheckout({
        mode: options.mode,
        lineItems: [{ price: options.priceId, quantity: 1 }],
        successUrl,
        cancelUrl,
        clientReferenceId,
      });

      if (error) {
        console.error('Stripe checkout error:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Checkout error:', err);
      return false;
    }
  }, [navigate, user?.id]);

  /**
   * Redirect to monthly subscription checkout
   */
  const subscribeMonthly = useCallback(async () => {
    return redirectToCheckout({
      mode: 'subscription',
      priceId: STRIPE_CONFIG.prices.proMonthly,
    });
  }, [redirectToCheckout]);

  /**
   * Redirect to yearly subscription checkout
   */
  const subscribeYearly = useCallback(async () => {
    return redirectToCheckout({
      mode: 'subscription',
      priceId: STRIPE_CONFIG.prices.proYearly,
    });
  }, [redirectToCheckout]);

  /**
   * Redirect to lifetime purchase checkout
   */
  const purchaseLifetime = useCallback(async () => {
    return redirectToCheckout({
      mode: 'payment',
      priceId: STRIPE_CONFIG.prices.lifetime,
    });
  }, [redirectToCheckout]);

  return {
    redirectToCheckout,
    subscribeMonthly,
    subscribeYearly,
    purchaseLifetime,
    isLoading: false,
    error: null,
  };
}

/**
 * Helper to get price ID from plan type
 */
export function getPriceIdForPlan(plan: 'monthly' | 'yearly' | 'lifetime'): string {
  switch (plan) {
    case 'monthly':
      return STRIPE_CONFIG.prices.proMonthly;
    case 'yearly':
      return STRIPE_CONFIG.prices.proYearly;
    case 'lifetime':
      return STRIPE_CONFIG.prices.lifetime;
  }
}

/**
 * Helper to get checkout mode from plan type
 */
export function getCheckoutModeForPlan(plan: 'monthly' | 'yearly' | 'lifetime'): CheckoutMode {
  return plan === 'lifetime' ? 'payment' : 'subscription';
}

export default useStripeCheckout;
