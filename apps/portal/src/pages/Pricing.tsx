/**
 * Pricing Page
 *
 * Display subscription tiers and checkout options.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { PRICING_DISPLAY, calculateBreakeven, calculateYearlySavings } from '../config/stripe';
import { useSubscription } from '../hooks/useSubscription';

export function Pricing() {
  const navigate = useNavigate();
  const { redirectToCheckout, subscribeMonthly, subscribeYearly, purchaseLifetime } = useStripeCheckout();
  const { isPro, subscription } = useSubscription();

  const handleCheckout = async (plan: 'monthly' | 'yearly' | 'lifetime') => {
    let success = false;

    switch (plan) {
      case 'monthly':
        success = await subscribeMonthly();
        break;
      case 'yearly':
        success = await subscribeYearly();
        break;
      case 'lifetime':
        success = await purchaseLifetime();
        break;
    }

    if (!success) {
      console.error('Checkout failed');
    }
  };

  const yearlySavings = calculateYearlySavings(PRICING_DISPLAY.yearly.price, PRICING_DISPLAY.monthly.price);
  const lifetimeBreakeven = calculateBreakeven(PRICING_DISPLAY.lifetime.price, PRICING_DISPLAY.monthly.price);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Planos e Preços
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Escolha o plano ideal para você
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Tier */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {PRICING_DISPLAY.free.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {PRICING_DISPLAY.free.description}
              </p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                R$ {PRICING_DISPLAY.free.price}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">
                /{PRICING_DISPLAY.free.period}
              </span>
            </div>

            <ul className="space-y-3 mb-8">
              {PRICING_DISPLAY.free.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled
              className="w-full px-4 py-3 text-sm font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-xl cursor-not-allowed"
            >
              Plano Atual
            </button>
          </div>

          {/* Yearly Tier - Highlighted */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 border-blue-600 dark:border-blue-500 p-8 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-3 py-1 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-full">
                Mais Popular
              </span>
            </div>

            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {PRICING_DISPLAY.yearly.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {PRICING_DISPLAY.yearly.description}
              </p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                R$ {PRICING_DISPLAY.yearly.price}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">
                /{PRICING_DISPLAY.yearly.period}
              </span>
              <div className="mt-2">
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {PRICING_DISPLAY.yearly.savings}
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {PRICING_DISPLAY.yearly.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <button
                disabled
                className="w-full px-4 py-3 text-sm font-medium text-white bg-gray-400 dark:bg-gray-600 rounded-xl cursor-not-allowed"
              >
                Já é Pro
              </button>
            ) : (
              <button
                onClick={() => handleCheckout('yearly')}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all shadow-md hover:shadow-lg"
              >
                Assinar Agora
              </button>
            )}
          </div>

          {/* Lifetime Tier */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {PRICING_DISPLAY.lifetime.name}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {PRICING_DISPLAY.lifetime.description}
              </p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold text-gray-900 dark:text-white">
                R$ {PRICING_DISPLAY.lifetime.price}
              </span>
              <span className="text-gray-500 dark:text-gray-400 ml-2">
                pagamento único
              </span>
              <div className="mt-2">
                <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Retorno em {lifetimeBreakeven} meses
                </span>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {PRICING_DISPLAY.lifetime.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{feature}</span>
                </li>
              ))}
            </ul>

            {isPro ? (
              <button
                disabled
                className="w-full px-4 py-3 text-sm font-medium text-white bg-gray-400 dark:bg-gray-600 rounded-xl cursor-not-allowed"
              >
                Já é Pro
              </button>
            ) : (
              <button
                onClick={() => handleCheckout('lifetime')}
                className="w-full px-4 py-3 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 rounded-xl transition-colors"
              >
                Comprar Agora
              </button>
            )}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
            Perguntas Frequentes
          </h2>

          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sim! Você pode cancelar sua assinatura a qualquer momento. Continuará com acesso Pro até o final do período atual.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Qual a diferença entre os planos?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                O plano Gratuito é para uso individual sem colaboradores. O plano Pro permite colaboradores ilimitados, compartilhamento, colaboração em tempo real e sugestões de IA.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                O plano vitalício vale a pena?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Se planeja usar por mais de {lifetimeBreakeven} meses, o plano vitalício é mais econômico. Você paga uma vez e tem acesso para sempre.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Quais formas de pagamento aceitas?
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aceitamos cartões de crédito, débito e PIX através do Stripe. Todas as transações são seguras e criptografadas.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Pricing;
