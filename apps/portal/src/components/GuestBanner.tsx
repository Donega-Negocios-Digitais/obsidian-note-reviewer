/**
 * Guest Banner Component
 *
 * Banner shown to guest users encouraging them to sign up.
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

export interface GuestBannerProps {
  className?: string;
}

/**
 * Gradient banner displayed to guest users with signup call-to-action
 */
export function GuestBanner({ className = '' }: GuestBannerProps) {
  const navigate = useNavigate();

  return (
    <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 ${className}`}>
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <svg className="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <div>
            <p className="font-medium">Visualizando como visitante</p>
            <p className="text-sm text-blue-100">
              Crie uma conta gratuita para anotar, comentar e colaborar
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/auth/signup')}
          className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors whitespace-nowrap text-sm"
        >
          Criar Conta Grátis
        </button>
      </div>
    </div>
  );
}

/**
 * Compact variant for smaller spaces
 */
export interface GuestBannerCompactProps {
  onClose?: () => void;
}

export function GuestBannerCompact({ onClose }: GuestBannerCompactProps) {
  const navigate = useNavigate();

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Você está visualizando como visitante. <button onClick={() => navigate('/auth/signup')} className="font-medium underline hover:text-blue-900 dark:hover:text-blue-200">Entre</button> ou <button onClick={() => navigate('/auth/signup')} className="font-medium underline hover:text-blue-900 dark:hover:text-blue-200">crie uma conta</button> para colaborar.
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}

export default GuestBanner;
