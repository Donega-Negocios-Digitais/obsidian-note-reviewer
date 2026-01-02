/**
 * Hook to detect if user prefers reduced motion.
 *
 * This hook listens to the prefers-reduced-motion media query and updates
 * reactively when the user changes their system preference.
 *
 * CSS animations are already handled automatically by @media (prefers-reduced-motion: reduce)
 * in index.css. This hook is for cases where you need to conditionally skip
 * JavaScript-based animations or provide alternative UI behavior.
 *
 * @example
 * ```tsx
 * const prefersReducedMotion = usePrefersReducedMotion();
 *
 * // Skip JS animations when reduced motion is preferred
 * if (!prefersReducedMotion) {
 *   element.animate([...], { duration: 200 });
 * }
 *
 * // Or conditionally render different UI
 * return prefersReducedMotion
 *   ? <StaticComponent />
 *   : <AnimatedComponent />;
 * ```
 */

import { useState, useEffect } from 'react';

/**
 * Custom hook that detects if the user prefers reduced motion.
 *
 * @returns {boolean} `true` if the user has enabled "Reduce motion" in their OS settings
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    // Default to false during SSR, check on client
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value on client
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes (user toggling system preference)
    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    // Use addEventListener for modern browsers
    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

/**
 * Utility function to check reduced motion preference without React hooks.
 * Useful for one-off checks outside of React components.
 *
 * Note: This is a point-in-time check and won't update if the preference changes.
 * For reactive updates, use the usePrefersReducedMotion hook instead.
 *
 * @returns {boolean} `true` if the user has enabled "Reduce motion"
 */
export function checkPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export default usePrefersReducedMotion;
