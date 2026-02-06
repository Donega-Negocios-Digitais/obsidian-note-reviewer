/**
 * Stripe Configuration
 *
 * Stripe keys and price IDs for checkout.
 */

export const STRIPE_CONFIG = {
  publishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  prices: {
    proMonthly: import.meta.env.VITE_STRIPE_PRICE_PRO_MONTHLY || '',
    proYearly: import.meta.env.VITE_STRIPE_PRICE_PRO_YEARLY || '',
    lifetime: import.meta.env.VITE_STRIPE_PRICE_LIFETIME || '',
  },
};

/**
 * Pricing display configuration
 */
export const PRICING_DISPLAY = {
  monthly: {
    name: 'Pro Mensal',
    price: 29,
    period: 'mês',
    description: 'Para uso flexível',
    features: [
      'Colaboradores ilimitados',
      'Documentos ilimitados',
      'Colaboração em tempo real',
      'Sugestões de IA',
      'Histórico de versões',
      'Cancelamento a qualquer momento',
    ],
  },
  yearly: {
    name: 'Pro Anual',
    price: 290,
    period: 'ano',
    description: 'Economize 2 meses',
    savings: 'Economize R$ 58/ano',
    features: [
      'Colaboradores ilimitados',
      'Documentos ilimitados',
      'Colaboração em tempo real',
      'Sugestões de IA',
      'Histórico de versões',
      'Suporte prioritário',
    ],
  },
  lifetime: {
    name: 'Vitalício',
    price: 599,
    period: 'único',
    description: 'A melhor opção',
    badge: 'Mais Popular',
    features: [
      'Acesso vitalício ao Pro',
      'Pagamento único',
      'Sem mensalidades',
      'Todas as futuras atualizações',
      'Suporte prioritário',
      'Retorno em 20 meses',
    ],
  },
  free: {
    name: 'Gratuito',
    price: 0,
    period: 'para sempre',
    description: 'Para uso individual',
    features: [
      'Anotações ilimitadas',
      'Documentos ilimitados',
      'Histórico de versões',
      'Exportação em Markdown',
      'Integração com Claude Code',
    ],
  },
};

/**
 * Calculate breakeven point for lifetime vs monthly
 */
export function calculateBreakeven(lifetimePrice: number, monthlyPrice: number): number {
  return Math.ceil(lifetimePrice / monthlyPrice);
}

/**
 * Calculate savings for yearly vs monthly
 */
export function calculateYearlySavings(yearlyPrice: number, monthlyPrice: number): number {
  const annualMonthly = monthlyPrice * 12;
  return annualMonthly - yearlyPrice;
}

export default STRIPE_CONFIG;
