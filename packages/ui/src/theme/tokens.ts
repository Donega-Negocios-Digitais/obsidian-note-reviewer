/**
 * Theme Tokens
 *
 * Color tokens for light and dark themes.
 * Colors are stored as HSL values for easier manipulation.
 */

/**
 * Light theme colors
 */
export const lightTheme = {
  // Base colors
  background: '0 0% 100%',           // #ffffff
  foreground: '0 0% 3.9%',           // #0a0a0a

  // Card
  card: '0 0% 100%',                 // #ffffff
  'card-foreground': '0 0% 3.9%',    // #0a0a0a

  // Primary (brand color)
  primary: '217 91% 60%',            // #3b82f6
  'primary-foreground': '0 0% 98%',  // #fafafa

  // Secondary
  secondary: '210 40% 96.1%',        // #f1f5f9
  'secondary-foreground': '222.2 47.4% 11.2%', // #1e293b

  // Muted
  muted: '210 40% 96.1%',            // #f1f5f9
  'muted-foreground': '215.4 16.3% 46.9%', // #64748b

  // Accent
  accent: '210 40% 96.1%',           // #f1f5f9
  'accent-foreground': '222.2 47.4% 11.2%', // #1e293b

  // Destructive (error/danger)
  destructive: '0 84.2% 60.2%',      // #ef4444
  'destructive-foreground': '0 0% 98%', // #fafafa

  // Borders
  border: '214.3 31.8% 91.4%',       // #e2e8f0
  input: '214.3 31.8% 91.4%',        // #e2e8f0
  ring: '217 91% 60%',               // #3b82f6

  // Status colors
  success: '142 76% 36%',            // #22c55e
  warning: '38 92% 50%',             // #f59e0b
  info: '199 89% 48%',               // #0ea5e9
} as const;

/**
 * Dark theme colors
 */
export const darkTheme = {
  // Base colors
  background: '0 0% 3.9%',           // #0a0a0a
  foreground: '0 0% 98%',            // #fafafa

  // Card
  card: '0 0% 3.9%',                 // #0a0a0a
  'card-foreground': '0 0% 98%',     // #fafafa

  // Primary
  primary: '217 91% 60%',            // #3b82f6
  'primary-foreground': '0 0% 98%',  // #fafafa

  // Secondary
  secondary: '217.2 32.6% 17.5%',    // #1e293b
  'secondary-foreground': '210 40% 98%', // #eff6ff

  // Muted
  muted: '217.2 32.6% 17.5%',        // #1e293b
  'muted-foreground': '215 20.2% 65.1%', // #94a3b8

  // Accent
  accent: '217.2 32.6% 17.5%',       // #1e293b
  'accent-foreground': '210 40% 98%', // #eff6ff

  // Destructive
  destructive: '0 62.8% 30.6%',      // #dc2626
  'destructive-foreground': '0 0% 98%', // #fafafa

  // Borders
  border: '217.2 32.6% 17.5%',       // #1e293b
  input: '217.2 32.6% 17.5%',        // #1e293b
  ring: '217 91% 60%',               // #3b82f6

  // Status colors (same in both themes)
  success: '142 76% 36%',            // #22c55e
  warning: '38 92% 50%',             // #f59e0b
  info: '199 89% 48%',               // #0ea5e9
} as const;

/**
 * Accent color presets
 */
export const accentColors = [
  { name: 'Azul', value: '#3b82f6', hsl: '217 91% 60%' },
  { name: 'Roxo', value: '#8b5cf6', hsl: '262 83% 58%' },
  { name: 'Rosa', value: '#ec4899', hsl: '330 81% 60%' },
  { name: 'Vermelho', value: '#ef4444', hsl: '0 84% 60%' },
  { name: 'Laranja', value: '#f97316', hsl: '25 95% 53%' },
  { name: 'Amarelo', value: '#eab308', hsl: '48 96% 53%' },
  { name: 'Verde', value: '#22c55e', hsl: '142 76% 36%' },
  { name: 'Turquesa', value: '#14b8a6', hsl: '174 72% 56%' },
  { name: 'Ciano', value: '#06b6d4', hsl: '188 94% 43%' },
  { name: 'Índigo', value: '#6366f1', hsl: '239 84% 67%' },
] as const;

/**
 * Theme type
 */
export type Theme = 'light' | 'dark';
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Get theme CSS variables
 */
export function getThemeCSSVariables(theme: Theme): Record<string, string> {
  const colors = theme === 'light' ? lightTheme : darkTheme;

  return {
    '--background': colors.background,
    '--foreground': colors.foreground,
    '--card': colors.card,
    '--card-foreground': colors['card-foreground'],
    '--primary': colors.primary,
    '--primary-foreground': colors['primary-foreground'],
    '--secondary': colors.secondary,
    '--secondary-foreground': colors['secondary-foreground'],
    '--muted': colors.muted,
    '--muted-foreground': colors['muted-foreground'],
    '--accent': colors.accent,
    '--accent-foreground': colors['accent-foreground'],
    '--destructive': colors.destructive,
    '--destructive-foreground': colors['destructive-foreground'],
    '--border': colors.border,
    '--input': colors.input,
    '--ring': colors.ring,
    '--success': colors.success,
    '--warning': colors.warning,
    '--info': colors.info,
  };
}

/**
 * Convert HSL to Hex
 */
export function hslToHex(h: number, s: number, l: number): string {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Parse HSL string to components
 */
export function parseHSL(hslString: string): { h: number; s: number; l: number } {
  const match = hslString.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
  if (!match) return { h: 0, s: 0, l: 0 };
  return {
    h: parseInt(match[1]),
    s: parseInt(match[2]),
    l: parseInt(match[3]),
  };
}

/**
 * Adjust HSL color lightness
 */
export function adjustHSL(
  hsl: { h: number; s: number; l: number },
  lDelta: number
): string {
  const newL = Math.max(0, Math.min(100, hsl.l + lDelta));
  return `${hsl.h} ${hsl.s}% ${newL}%`;
}

export default {
  lightTheme,
  darkTheme,
  accentColors,
  getThemeCSSVariables,
};
