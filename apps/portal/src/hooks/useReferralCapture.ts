import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { captureReferralFromSearch, getStoredReferralAttribution } from '../lib/referral';

/**
 * Captures referral code from URL (?ref=code) and stores it for checkout attribution.
 */
export function useReferralCapture(): void {
  const location = useLocation();

  useEffect(() => {
    captureReferralFromSearch(location.search, `${location.pathname}${location.search}`);
    // Touch stored attribution to purge expired state.
    getStoredReferralAttribution();
  }, [location.pathname, location.search]);
}

export default useReferralCapture;
