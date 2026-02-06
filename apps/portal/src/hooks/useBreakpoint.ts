/**
 * Breakpoint Utility Hook
 *
 * Utilities for breakpoint-based rendering.
 */

import { useResponsive } from './useResponsive';

export type BreakpointValue<T> = T | {
  mobile?: T;
  tablet?: T;
  desktop?: T;
};

/**
 * Get value based on current breakpoint
 */
function getValueForBreakpoint<T>(
  values: BreakpointValue<T>,
  breakpoint: 'mobile' | 'tablet' | 'desktop'
): T {
  if (typeof values === 'object' && values !== null && !Array.isArray(values)) {
    // It's a breakpoint object
    return values[breakpoint] ?? values.desktop ?? values.tablet ?? values.mobile ?? (values as any);
  }
  // It's a single value
  return values;
}

/**
 * Hook for responsive values
 *
 * Pass different values for different breakpoints.
 */
export function useBreakpoint<T>(values: BreakpointValue<T>): T {
  const { breakpoint } = useResponsive();
  return getValueForBreakpoint(values, breakpoint);
}

/**
 * Hook for conditional rendering based on breakpoint
 */
export function useBreakpointHide(options: {
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
}): boolean {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  if (options.hideOnMobile && isMobile) return true;
  if (options.hideOnTablet && isTablet) return true;
  if (options.hideOnDesktop && isDesktop) return true;

  return false;
}

/**
 * Hook for showing only on specific breakpoints
 */
export function useBreakpointShow(options: {
  showOnMobile?: boolean;
  showOnTablet?: boolean;
  showOnDesktop?: boolean;
}): boolean {
  const { isMobile, isTablet, isDesktop } = useResponsive();

  if (options.showOnMobile && isMobile) return true;
  if (options.showOnTablet && isTablet) return true;
  if (options.showOnDesktop && isDesktop) return true;

  return false;
}

export default useBreakpoint;
