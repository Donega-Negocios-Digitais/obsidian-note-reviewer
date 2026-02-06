/**
 * Responsive Hook
 *
 * Provides responsive breakpoint detection for React components.
 */

import { useState, useEffect } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface ResponsiveValues {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: Breakpoint;
  width: number;
  height: number;
}

export interface ResponsiveOptions {
  mobileBreakpoint?: number;
  tabletBreakpoint?: number;
}

const DEFAULT_BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
};

/**
 * Get current breakpoint from window width
 */
function getBreakpoint(width: number, options: ResponsiveOptions): Breakpoint {
  const mobileBreakpoint = options.mobileBreakpoint ?? DEFAULT_BREAKPOINTS.mobile;
  const tabletBreakpoint = options.tabletBreakpoint ?? DEFAULT_BREAKPOINTS.tablet;

  if (width < mobileBreakpoint) return 'mobile';
  if (width < tabletBreakpoint) return 'tablet';
  return 'desktop';
}

/**
 * Hook for responsive breakpoint detection
 *
 * Updates on window resize and provides convenient breakpoint checks.
 */
export function useResponsive(options: ResponsiveOptions = {}): ResponsiveValues {
  const [dimensions, setDimensions] = useState(() => {
    if (typeof window === 'undefined') {
      return { width: 1024, height: 768 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  });

  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() =>
    getBreakpoint(dimensions.width, options)
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;

      setDimensions({ width: newWidth, height: newHeight });
      setBreakpoint(getBreakpoint(newWidth, options));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [options.mobileBreakpoint, options.tabletBreakpoint]);

  return {
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    breakpoint,
    width: dimensions.width,
    height: dimensions.height,
  };
}

/**
 * Hook for checking if a specific media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
}

export default useResponsive;
