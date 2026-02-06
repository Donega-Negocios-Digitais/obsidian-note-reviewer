/**
 * Checkout Cancel Page
 *
 * Displayed when user cancels or payment fails.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStripeCheckout } from '../hooks/useStripeCheckout';

export function CheckoutCancel() {
  const navigate = useNavigate();
  const { subscribeMonthly, subscribeYearly, purchaseLifetime } = useStripeCheckout();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        {/* Cancel Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
            <svg className="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Pagamento Cancelado
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            O pagamento foi cancelado. Você pode tentar novamente a qualquer momento.
          </p>
        </div>

        {/* Retry Options */}
        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-900 dark:text-white text-center">
            Escolha um plano para tentar novamente:
          </p>

          <button
            onClick={() => subscribeYearly()}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-xl transition-all"
          >
            Pro Anual (Melhor Valor) - R$ 290/ano
          </button>

          <button
            onClick={() => subscribeMonthly()}
            className="w-full px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
          >
            Pro Mensal - R$ 29/mês
          </button>

          <button
            onClick={() => purchaseLifetime()}
            className="w-full px-4 py-3 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 rounded-xl transition-colors"
          >
            Vitalício - R$ 599 único
          </button>
        </div>

        {/* Other Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/pricing')}
            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
          >
            Ver Planos
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-3 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>

        {/* Help */}
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Precisa de ajuda? Entre em contato com o{' '}
            <a href="mailto:suporte@alexdonega.com.br" className="text-blue-600 dark:text-blue-400 hover:underline">
              suporte
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CheckoutCancel;
