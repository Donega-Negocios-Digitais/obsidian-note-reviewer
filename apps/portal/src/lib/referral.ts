export interface ReferralAttribution {
  code: string;
  capturedAt: string;
  expiresAt: string;
  sourcePath: string;
}

export interface LogoutThanksSnapshot {
  affiliateCode: string;
  commissionRate: number;
  totalCommissionCents: number;
  totalUnderReviewCents: number;
  referredBuyersCount: number;
  generatedAt: string;
}

export const REFERRAL_PARAM = 'ref';
export const REFERRAL_STORAGE_KEY = 'obsreview-referral-attribution';
export const LOGOUT_THANKS_SNAPSHOT_KEY = 'obsreview-logout-thanks-snapshot';
export const POST_LOGOUT_REDIRECT_KEY = 'obsreview-post-logout-redirect';

const REFERRAL_TTL_DAYS = 30;
const REFERRAL_CODE_REGEX = /^[a-z0-9][a-z0-9_-]{2,63}$/i;

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isExpired(expiresAt: string): boolean {
  const expiry = Date.parse(expiresAt);
  if (Number.isNaN(expiry)) return true;
  return Date.now() > expiry;
}

export function sanitizeReferralCode(value: string | null | undefined): string | null {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!REFERRAL_CODE_REGEX.test(trimmed)) return null;

  return trimmed.toLowerCase();
}

export function captureReferralFromSearch(search: string, sourcePath: string): string | null {
  const params = new URLSearchParams(search);
  const code = sanitizeReferralCode(params.get(REFERRAL_PARAM));

  if (!code) return null;

  const now = new Date();
  const expiresAt = new Date(now.getTime() + REFERRAL_TTL_DAYS * 24 * 60 * 60 * 1000);

  const attribution: ReferralAttribution = {
    code,
    capturedAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
    sourcePath,
  };

  localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(attribution));
  return code;
}

export function getStoredReferralAttribution(): ReferralAttribution | null {
  const attribution = safeParse<ReferralAttribution>(localStorage.getItem(REFERRAL_STORAGE_KEY));
  if (!attribution) return null;

  if (!attribution.code || isExpired(attribution.expiresAt)) {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    return null;
  }

  if (!REFERRAL_CODE_REGEX.test(attribution.code)) {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    return null;
  }

  return {
    ...attribution,
    code: attribution.code.toLowerCase(),
  };
}

export function getStoredReferralCode(): string | null {
  return getStoredReferralAttribution()?.code || null;
}

export function clearStoredReferralCode(): void {
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
}

export function encodeCheckoutClientReferenceId(userId: string, affiliateCode?: string | null): string {
  const safeUserId = userId.trim();
  const normalizedCode = sanitizeReferralCode(affiliateCode);

  if (!normalizedCode) {
    return safeUserId;
  }

  return `${safeUserId}|ref=${normalizedCode}`;
}

export function buildAffiliateLink(affiliateCode: string, origin = window.location.origin): string {
  const code = sanitizeReferralCode(affiliateCode);
  if (!code) return origin;

  return `${origin}/pricing?${REFERRAL_PARAM}=${encodeURIComponent(code)}`;
}

export function readLogoutThanksSnapshot(): LogoutThanksSnapshot | null {
  const snapshot = safeParse<LogoutThanksSnapshot>(sessionStorage.getItem(LOGOUT_THANKS_SNAPSHOT_KEY));
  if (!snapshot) return null;

  if (!snapshot.affiliateCode || typeof snapshot.totalCommissionCents !== 'number') {
    sessionStorage.removeItem(LOGOUT_THANKS_SNAPSHOT_KEY);
    return null;
  }

  return snapshot;
}

export function writeLogoutThanksSnapshot(snapshot: LogoutThanksSnapshot): void {
  sessionStorage.setItem(LOGOUT_THANKS_SNAPSHOT_KEY, JSON.stringify(snapshot));
}

export function clearLogoutThanksSnapshot(): void {
  sessionStorage.removeItem(LOGOUT_THANKS_SNAPSHOT_KEY);
}

export function setPostLogoutRedirect(path: string): void {
  const normalized = path.trim();
  if (!normalized.startsWith('/')) return;

  sessionStorage.setItem(POST_LOGOUT_REDIRECT_KEY, normalized);
}

export function readPostLogoutRedirect(): string | null {
  const value = sessionStorage.getItem(POST_LOGOUT_REDIRECT_KEY);
  if (!value) return null;

  const normalized = value.trim();
  if (!normalized.startsWith('/')) {
    sessionStorage.removeItem(POST_LOGOUT_REDIRECT_KEY);
    return null;
  }

  return normalized;
}

export function clearPostLogoutRedirect(): void {
  sessionStorage.removeItem(POST_LOGOUT_REDIRECT_KEY);
}
