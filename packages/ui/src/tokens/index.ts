/**
 * Design Tokens
 *
 * Centralized design tokens for consistent styling across the application.
 * Based on Apple's Human Interface Guidelines.
 */

/**
 * Spacing - 8px grid system
 */
export const spacing = {
  xs: '4px',    // 0.25rem - 0.5x base
  sm: '8px',    // 0.5rem  - 1x base
  md: '16px',   // 1rem    - 2x base
  lg: '24px',   // 1.5rem  - 3x base
  xl: '32px',   // 2rem    - 4x base
  '2xl': '48px', // 3rem   - 6x base
  '3xl': '64px', // 4rem   - 8x base
  '4xl': '96px', // 6rem   - 12x base
} as const;

/**
 * Border Radius
 */
export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  '2xl': '24px',
  full: '9999px',
} as const;

/**
 * Shadows
 */
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: '0 0 #0000',
} as const;

/**
 * Typography
 */
export const fonts = {
  sans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"SF Mono", Monaco, "Cascadia Code", "Courier New", monospace',
} as const;

export const fontSizes = {
  xs: ['0.75rem', { lineHeight: '1rem' }],     // 12px
  sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
  base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
  lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
  xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
  '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
  '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
  '5xl': ['3rem', { lineHeight: '1' }],          // 48px
} as const;

export const fontWeights = {
  light: '300',
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

/**
 * Z-Index Scale
 */
export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  overlay: 40,
  modal: 50,
  popover: 60,
  tooltip: 70,
} as const;

/**
 * Transitions
 */
export const transitions = {
  DEFAULT: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
  fast: 'all 100ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
} as const;

/**
 * Breakpoints (for reference, used in Tailwind config)
 */
export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/**
 * Animation durations
 */
export const durations = {
  fast: 150,
  normal: 200,
  slow: 300,
} as const;

/**
 * Border widths
 */
export const borderWidths = {
  DEFAULT: '1px',
  0: '0',
  2: '2px',
  4: '4px',
  8: '8px',
} as const;

/**
 * Design system object
 */
export const tokens = {
  spacing,
  radius,
  shadows,
  fonts,
  fontSizes,
  fontWeights,
  zIndex,
  transitions,
  breakpoints,
  durations,
  borderWidths,
} as const;

export default tokens;
