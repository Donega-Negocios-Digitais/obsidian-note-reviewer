/**
 * Breakpoint Preview Hook
 *
 * Manages breakpoint preview state for comparison tool.
 */

import { useState, useCallback, useMemo } from 'react';

export type PreviewMode = 'single' | 'split' | 'all';
export type ActiveBreakpoint = 'mobile' | 'tablet' | 'desktop' | 'all';

export interface BreakpointSize {
  name: 'mobile' | 'tablet' | 'desktop';
  label: string;
  width: number;
  height: number;
  icon: string;
}

export interface BreakpointPreviewOptions {
  defaultMode?: PreviewMode;
  defaultBreakpoint?: ActiveBreakpoint;
}

export interface UseBreakpointPreviewReturn {
  mode: PreviewMode;
  setMode: (mode: PreviewMode) => void;
  activeBreakpoint: ActiveBreakpoint;
  setActiveBreakpoint: (breakpoint: ActiveBreakpoint) => void;
  visibleBreakpoints: BreakpointSize[];
  toggleMode: () => void;
  cycleBreakpoint: () => void;
  isPreviewActive: boolean;
  activatePreview: () => void;
  deactivatePreview: () => void;
}

const BREAKPOINTS: Record<'mobile' | 'tablet' | 'desktop', Omit<BreakpointSize, 'name'>> = {
  mobile: {
    label: 'Mobile',
    width: 375,
    height: 667,
    icon: '📱',
  },
  tablet: {
    label: 'Tablet',
    width: 768,
    height: 1024,
    icon: '📱',
  },
  desktop: {
    label: 'Desktop',
    width: 1440,
    height: 900,
    icon: '🖥️',
  },
};

const BREAKPOINT_LIST: BreakpointSize[] = [
  { name: 'mobile', ...BREAKPOINTS.mobile },
  { name: 'tablet', ...BREAKPOINTS.tablet },
  { name: 'desktop', ...BREAKPOINTS.desktop },
];

/**
 * Hook for managing breakpoint preview state
 */
export function useBreakpointPreview(
  options: BreakpointPreviewOptions = {}
): UseBreakpointPreviewReturn {
  const {
    defaultMode = 'single',
    defaultBreakpoint = 'desktop',
  } = options;

  const [mode, setMode] = useState<PreviewMode>(defaultMode);
  const [activeBreakpoint, setActiveBreakpoint] = useState<ActiveBreakpoint>(defaultBreakpoint);
  const [isPreviewActive, setIsPreviewActive] = useState(false);

  /**
   * Get list of visible breakpoints based on mode
   */
  const visibleBreakpoints = useMemo((): BreakpointSize[] => {
    switch (mode) {
      case 'single':
        return BREAKPOINT_LIST.filter((bp) => bp.name === activeBreakpoint);
      case 'split':
        return BREAKPOINT_LIST.filter((bp) =>
          activeBreakpoint === 'all'
            ? bp.name === 'mobile' || bp.name === 'desktop'
            : bp.name === activeBreakpoint || bp.name === 'desktop'
        );
      case 'all':
        return BREAKPOINT_LIST;
      default:
        return BREAKPOINT_LIST;
    }
  }, [mode, activeBreakpoint]);

  /**
   * Toggle between preview modes
   */
  const toggleMode = useCallback(() => {
    setMode((prev) => {
      switch (prev) {
        case 'single':
          return 'split';
        case 'split':
          return 'all';
        case 'all':
          return 'single';
        default:
          return 'single';
      }
    });
  }, []);

  /**
   * Cycle through breakpoints
   */
  const cycleBreakpoint = useCallback(() => {
    setActiveBreakpoint((prev) => {
      switch (prev) {
        case 'mobile':
          return 'tablet';
        case 'tablet':
          return 'desktop';
        case 'desktop':
          return 'mobile';
        case 'all':
          return 'mobile';
        default:
          return 'desktop';
      }
    });
  }, []);

  const activatePreview = useCallback(() => setIsPreviewActive(true), []);
  const deactivatePreview = useCallback(() => setIsPreviewActive(false), []);

  return {
    mode,
    setMode,
    activeBreakpoint,
    setActiveBreakpoint,
    visibleBreakpoints,
    toggleMode,
    cycleBreakpoint,
    isPreviewActive,
    activatePreview,
    deactivatePreview,
  };
}

export { BREAKPOINTS, BREAKPOINT_LIST };
export default useBreakpointPreview;
