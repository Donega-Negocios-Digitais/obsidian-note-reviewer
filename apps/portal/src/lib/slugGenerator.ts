/**
 * Slug Generator
 *
 * URL-friendly unique ID generation using adjective-noun-NNNN format.
 * Per COLL-03: "Plan owner can generate unique, friendly URL for sharing"
 *
 * Format: adjetivo-substantivo-NNNN (~22.5M unique combinations)
 * ~50 adj × ~50 subst × 9000 num = ~22.5M
 */

const ADJECTIVES = [
  'azul', 'verde', 'dourado', 'rapido', 'calmo', 'claro', 'bravo', 'nobre',
  'leve', 'forte', 'suave', 'vivo', 'frio', 'quente', 'seco', 'cheio',
  'novo', 'velho', 'bom', 'belo', 'rico', 'puro', 'raro', 'real',
  'livre', 'firme', 'fiel', 'grato', 'justo', 'lindo', 'macio', 'meigo',
  'mudo', 'negro', 'ousado', 'palido', 'pleno', 'primo', 'pronto', 'roxo',
  'sagaz', 'salvo', 'santo', 'sutil', 'tenro', 'unico', 'unido', 'urgente',
  'vasto', 'viril',
];

const NOUNS = [
  'rio', 'monte', 'vento', 'sol', 'lago', 'pico', 'vale', 'brisa',
  'rocha', 'praia', 'campo', 'bosque', 'canto', 'ceu', 'nuvem', 'chuva',
  'raio', 'folha', 'flor', 'fruto', 'gelo', 'onda', 'pedra', 'trilha',
  'areia', 'aurora', 'bosque', 'cantil', 'coruja', 'dunas', 'espuma',
  'farol', 'garoa', 'grota', 'haste', 'ilheu', 'jacara', 'kaiak', 'lajedo',
  'manto', 'neblina', 'oceano', 'palha', 'queda', 'rampa', 'selva',
  'tundra', 'umbral', 'veio',
];

/**
 * Generate unique shareable slug in adjective-noun-NNNN format.
 */
export function generateSlug(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 9000) + 1000; // 1000-9999
  return `${adj}-${noun}-${num}`;
}

/**
 * Validate slug format (for security).
 * Accepts both legacy 10-char NanoID and new adjective-noun-NNNN format.
 */
export function isSlugValid(slug: string): boolean {
  return /^[a-zA-Z0-9]{10}$/.test(slug)        // formato legado
    || /^[a-z]+-[a-z]+-\d{4}$/.test(slug);     // novo formato amigável
}

/**
 * Generate full share URL
 */
export function getShareUrl(slug: string): string {
  const baseUrl = window.location.origin;
  return `${baseUrl}/shared/${slug}`;
}
