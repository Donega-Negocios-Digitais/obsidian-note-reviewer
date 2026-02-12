import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  buildAffiliateLink,
  clearLogoutThanksSnapshot,
  readLogoutThanksSnapshot,
} from '../lib/referral';

function formatCurrencyFromCents(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format((value || 0) / 100);
}

export function LogoutThanks() {
  const navigate = useNavigate();
  const [snapshot] = useState(() => readLogoutThanksSnapshot());
  const [copied, setCopied] = useState(false);

  const referralLink = useMemo(() => {
    if (!snapshot?.affiliateCode) return '';
    return buildAffiliateLink(snapshot.affiliateCode);
  }, [snapshot?.affiliateCode]);

  const commissionRate = Math.round((snapshot?.commissionRate ?? 0.6) * 100);
  const totalCommission = snapshot ? formatCurrencyFromCents(snapshot.totalCommissionCents) : formatCurrencyFromCents(0);

  const handleCopy = async () => {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch (error) {
      console.error('Falha ao copiar link de indicação:', error);
    }
  };

  const handleGoToLogin = () => {
    clearLogoutThanksSnapshot();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Obrigado por usar o sistema!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sua sessão foi encerrada com sucesso. Se quiser, você ainda pode ganhar comissões indicando a ferramenta.
          </p>
        </div>

        <div className="rounded-xl p-5 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold">Programa de Indicação</h2>
            <span className="px-3 py-1 text-xs font-semibold rounded-full bg-white/20">
              {commissionRate}% de comissão
            </span>
          </div>
          <p className="text-sm text-blue-100">
            Você recebe {commissionRate}% quando alguém comprar usando seu link de indicação.
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-6">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Seu link de indicação</p>
          {referralLink ? (
            <>
              <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all mb-3">{referralLink}</p>
              <button
                onClick={handleCopy}
                className="w-full px-4 py-2 text-sm font-medium text-white bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {copied ? 'Link copiado' : 'Copiar link'}
              </button>
            </>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Não foi possível carregar seu link de indicação nesta sessão.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Comissão acumulada</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{totalCommission}</p>
          </div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white/60 dark:bg-gray-800/60">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Indicados ativos</p>
            <p className="text-xl font-semibold text-gray-900 dark:text-white">{snapshot?.referredBuyersCount ?? 0}</p>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <p className="text-sm font-medium text-gray-900 dark:text-white">Como funciona</p>
          <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold">1</span>
            <span>Compartilhe seu link de indicação.</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold">2</span>
            <span>Quando houver compra pelo link, a comissão é registrada automaticamente.</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
            <span className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-semibold">3</span>
            <span>Você acompanha o saldo acumulado no sistema.</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={handleGoToLogin}
            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl transition-all"
          >
            Ir para Login
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="px-4 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors"
          >
            Ver Planos
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogoutThanks;
