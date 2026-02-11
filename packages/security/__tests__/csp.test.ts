import { describe, test, expect } from 'bun:test';
import {
  getCSPDirectives,
  directivesToString,
  getCSPHeader,
  getCSPMetaContent,
  getHookCSP,
  getPortalCSP,
  getMarketingCSP,
  getProductionCSP,
  CSP_DIRECTIVES,
  type CSPDirectives,
} from '../csp';

describe('getCSPDirectives', () => {
  test('returns base directives with default options', () => {
    const directives = getCSPDirectives();

    expect(directives['default-src']).toContain("'self'");
    expect(directives['script-src']).toContain("'self'");
    expect(directives['script-src']).toContain("'unsafe-inline'");
    expect(directives['style-src']).toContain("'self'");
    expect(directives['style-src']).toContain("'unsafe-inline'");
    expect(directives['font-src']).toContain("'self'");
    expect(directives['img-src']).toContain("'self'");
    expect(directives['img-src']).toContain('data:');
    expect(directives['img-src']).toContain('blob:');
    expect(directives['img-src']).toContain('https:');
    expect(directives['connect-src']).toContain("'self'");
    expect(directives['frame-src']).toContain("'self'");
    expect(directives['frame-ancestors']).toContain("'none'");
    expect(directives['object-src']).toContain("'none'");
    expect(directives['base-uri']).toContain("'self'");
  });

  test('does not include unsafe-eval in production mode', () => {
    const directives = getCSPDirectives({ isDev: false });

    expect(directives['script-src']).not.toContain("'unsafe-eval'");
  });

  test('does not include WebSocket in production mode', () => {
    const directives = getCSPDirectives({ isDev: false });

    expect(directives['connect-src']).not.toContain('ws:');
    expect(directives['connect-src']).not.toContain('wss:');
  });

  test('includes unsafe-eval in development mode for Vite HMR', () => {
    const directives = getCSPDirectives({ isDev: true });

    expect(directives['script-src']).toContain("'unsafe-eval'");
  });

  test('includes WebSocket sources in development mode for Vite HMR', () => {
    const directives = getCSPDirectives({ isDev: true });

    expect(directives['connect-src']).toContain('ws:');
    expect(directives['connect-src']).toContain('wss:');
  });

  test('includes CDN sources when allowCDN is true', () => {
    const directives = getCSPDirectives({ allowCDN: true });

    expect(directives['script-src']).toContain('https://cdnjs.cloudflare.com');
    expect(directives['style-src']).toContain('https://cdnjs.cloudflare.com');
  });

  test('does not include CDN sources when allowCDN is false', () => {
    const directives = getCSPDirectives({ allowCDN: false });

    expect(directives['script-src']).not.toContain('https://cdnjs.cloudflare.com');
    expect(directives['style-src']).not.toContain('https://cdnjs.cloudflare.com');
  });

  test('includes Google Fonts sources when allowGoogleFonts is true', () => {
    const directives = getCSPDirectives({ allowGoogleFonts: true });

    expect(directives['style-src']).toContain('https://fonts.googleapis.com');
    expect(directives['font-src']).toContain('https://fonts.gstatic.com');
  });

  test('does not include Google Fonts sources when allowGoogleFonts is false', () => {
    const directives = getCSPDirectives({ allowGoogleFonts: false });

    expect(directives['style-src']).not.toContain('https://fonts.googleapis.com');
    expect(directives['font-src']).not.toContain('https://fonts.gstatic.com');
  });

  test('includes additional script sources when provided', () => {
    const directives = getCSPDirectives({
      additionalScriptSources: ['https://custom.example.com'],
    });

    expect(directives['script-src']).toContain('https://custom.example.com');
  });

  test('includes additional style sources when provided', () => {
    const directives = getCSPDirectives({
      additionalStyleSources: ['https://styles.example.com'],
    });

    expect(directives['style-src']).toContain('https://styles.example.com');
  });

  test('includes additional connect sources when provided', () => {
    const directives = getCSPDirectives({
      additionalConnectSources: ['https://api.example.com'],
    });

    expect(directives['connect-src']).toContain('https://api.example.com');
  });

  test('includes additional frame sources when provided', () => {
    const directives = getCSPDirectives({
      additionalFrameSources: ['https://www.youtube.com'],
    });

    expect(directives['frame-src']).toContain('https://www.youtube.com');
  });

  test('combines multiple options correctly', () => {
    const directives = getCSPDirectives({
      isDev: true,
      allowCDN: true,
      allowGoogleFonts: true,
      additionalScriptSources: ['https://custom.example.com'],
    });

    // Development mode
    expect(directives['script-src']).toContain("'unsafe-eval'");
    expect(directives['connect-src']).toContain('ws:');

    // CDN
    expect(directives['script-src']).toContain('https://cdnjs.cloudflare.com');

    // Google Fonts
    expect(directives['style-src']).toContain('https://fonts.googleapis.com');
    expect(directives['font-src']).toContain('https://fonts.gstatic.com');

    // Custom source
    expect(directives['script-src']).toContain('https://custom.example.com');
  });
});

describe('directivesToString', () => {
  test('converts directives to properly formatted CSP string', () => {
    const directives: CSPDirectives = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'font-src': ["'self'"],
      'img-src': ["'self'", 'data:', 'blob:'],
      'connect-src': ["'self'"],
      'frame-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
    };

    const result = directivesToString(directives);

    expect(result).toContain("default-src 'self'");
    expect(result).toContain("script-src 'self' 'unsafe-inline'");
    expect(result).toContain("style-src 'self' 'unsafe-inline'");
    expect(result).toContain("font-src 'self'");
    expect(result).toContain("img-src 'self' data: blob:");
    expect(result).toContain("connect-src 'self'");
    expect(result).toContain("frame-src 'self'");
    expect(result).toContain("frame-ancestors 'none'");
    expect(result).toContain("object-src 'none'");
    expect(result).toContain("base-uri 'self'");
  });

  test('separates directives with semicolons', () => {
    const directives: CSPDirectives = {
      'default-src': ["'self'"],
      'script-src': ["'self'"],
      'style-src': ["'self'"],
      'font-src': ["'self'"],
      'img-src': ["'self'"],
      'connect-src': ["'self'"],
      'frame-src': ["'self'"],
      'frame-ancestors': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
    };

    const result = directivesToString(directives);

    // Count semicolons (should be number of directives - 1)
    const semicolonCount = (result.match(/; /g) || []).length;
    expect(semicolonCount).toBe(9);
  });
});

describe('getCSPHeader', () => {
  test('returns valid CSP header string', () => {
    const header = getCSPHeader();

    expect(typeof header).toBe('string');
    expect(header.length).toBeGreaterThan(0);
    expect(header).toContain("default-src 'self'");
  });

  test('includes development-specific directives when isDev is true', () => {
    const header = getCSPHeader({ isDev: true });

    expect(header).toContain("'unsafe-eval'");
    expect(header).toContain('ws:');
    expect(header).toContain('wss:');
  });

  test('excludes development-specific directives in production', () => {
    const header = getCSPHeader({ isDev: false });

    expect(header).not.toContain("'unsafe-eval'");
    expect(header).not.toContain('ws:');
    expect(header).not.toContain('wss:');
  });
});

describe('getCSPMetaContent', () => {
  test('returns valid CSP meta content string', () => {
    const content = getCSPMetaContent();

    expect(typeof content).toBe('string');
    expect(content.length).toBeGreaterThan(0);
    expect(content).toContain("default-src 'self'");
  });

  test('excludes frame-ancestors (not supported in meta tags)', () => {
    const content = getCSPMetaContent();

    expect(content).not.toContain('frame-ancestors');
  });

  test('includes all other directives', () => {
    const content = getCSPMetaContent();

    expect(content).toContain('default-src');
    expect(content).toContain('script-src');
    expect(content).toContain('style-src');
    expect(content).toContain('font-src');
    expect(content).toContain('img-src');
    expect(content).toContain('connect-src');
    expect(content).toContain('frame-src');
    expect(content).toContain('object-src');
    expect(content).toContain('base-uri');
  });
});

describe('getHookCSP', () => {
  test('returns restrictive CSP for hook app', () => {
    const csp = getHookCSP();

    expect(csp).toContain("default-src 'self'");
    expect(csp).not.toContain('https://cdnjs.cloudflare.com');
    expect(csp).not.toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://www.youtube.com');
  });

  test('includes development directives when isDev is true', () => {
    const csp = getHookCSP(true);

    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain('ws:');
  });

  test('excludes development directives in production', () => {
    const csp = getHookCSP(false);

    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain('ws:');
  });
});

describe('getPortalCSP', () => {
  test('returns CSP with Google Fonts for portal app', () => {
    const csp = getPortalCSP();

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://fonts.gstatic.com');
    expect(csp).toContain('https://www.youtube.com');
    expect(csp).toContain('https://js.stripe.com');
  });

  test('includes CDN sources', () => {
    const csp = getPortalCSP();

    expect(csp).toContain('https://cdnjs.cloudflare.com');
  });

  test('includes Stripe sources', () => {
    const csp = getPortalCSP();

    expect(csp).toContain('https://js.stripe.com');
    expect(csp).toContain('https://api.stripe.com');
    expect(csp).toContain('https://r.stripe.com');
    expect(csp).toContain('https://m.stripe.network');
  });

  test('includes development directives when isDev is true', () => {
    const csp = getPortalCSP(true);

    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain('ws:');
  });
});

describe('getMarketingCSP', () => {
  test('returns CSP with CDN and Google Fonts for marketing app', () => {
    const csp = getMarketingCSP();

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain('https://cdnjs.cloudflare.com');
    expect(csp).toContain('https://fonts.googleapis.com');
    expect(csp).toContain('https://fonts.gstatic.com');
  });

  test('includes development directives when isDev is true', () => {
    const csp = getMarketingCSP(true);

    expect(csp).toContain("'unsafe-eval'");
    expect(csp).toContain('ws:');
  });
});

describe('getProductionCSP', () => {
  test('returns production CSP without development directives', () => {
    const csp = getProductionCSP();

    expect(csp).not.toContain("'unsafe-eval'");
    expect(csp).not.toContain('ws:');
    expect(csp).not.toContain('wss:');
  });

  test('includes CDN and Google Fonts', () => {
    const csp = getProductionCSP();

    expect(csp).toContain('https://cdnjs.cloudflare.com');
    expect(csp).toContain('https://fonts.googleapis.com');
  });
});

describe('CSP_DIRECTIVES constant', () => {
  test('exports development and production configurations', () => {
    expect(CSP_DIRECTIVES.development).toBeDefined();
    expect(CSP_DIRECTIVES.production).toBeDefined();
  });

  test('exports hook app configurations', () => {
    expect(CSP_DIRECTIVES.hook.development).toBeDefined();
    expect(CSP_DIRECTIVES.hook.production).toBeDefined();
  });

  test('exports portal app configurations', () => {
    expect(CSP_DIRECTIVES.portal.development).toBeDefined();
    expect(CSP_DIRECTIVES.portal.production).toBeDefined();
  });

  test('exports marketing app configurations', () => {
    expect(CSP_DIRECTIVES.marketing.development).toBeDefined();
    expect(CSP_DIRECTIVES.marketing.production).toBeDefined();
  });

  test('development config includes unsafe-eval', () => {
    expect(CSP_DIRECTIVES.development['script-src']).toContain("'unsafe-eval'");
    expect(CSP_DIRECTIVES.development['connect-src']).toContain('ws:');
  });

  test('production config excludes unsafe-eval', () => {
    expect(CSP_DIRECTIVES.production['script-src']).not.toContain("'unsafe-eval'");
    expect(CSP_DIRECTIVES.production['connect-src']).not.toContain('ws:');
  });

  test('portal config includes Google Fonts', () => {
    expect(CSP_DIRECTIVES.portal.production['style-src']).toContain(
      'https://fonts.googleapis.com'
    );
    expect(CSP_DIRECTIVES.portal.production['font-src']).toContain(
      'https://fonts.gstatic.com'
    );
  });

  test('marketing config includes CDN and Google Fonts', () => {
    expect(CSP_DIRECTIVES.marketing.production['script-src']).toContain(
      'https://cdnjs.cloudflare.com'
    );
    expect(CSP_DIRECTIVES.marketing.production['style-src']).toContain(
      'https://fonts.googleapis.com'
    );
  });
});

describe('CSP security requirements', () => {
  test('always includes frame-ancestors to prevent clickjacking', () => {
    const directives = getCSPDirectives();
    expect(directives['frame-ancestors']).toContain("'none'");
  });

  test('always blocks object/embed plugins', () => {
    const directives = getCSPDirectives();
    expect(directives['object-src']).toContain("'none'");
  });

  test('always restricts base-uri to prevent base tag injection', () => {
    const directives = getCSPDirectives();
    expect(directives['base-uri']).toContain("'self'");
  });

  test('default-src is always self for same-origin policy', () => {
    const directives = getCSPDirectives();
    expect(directives['default-src']).toContain("'self'");
  });

  test('all required CSP directives are present', () => {
    const directives = getCSPDirectives();

    const requiredDirectives = [
      'default-src',
      'script-src',
      'style-src',
      'font-src',
      'img-src',
      'connect-src',
      'frame-src',
      'frame-ancestors',
      'object-src',
      'base-uri',
    ];

    for (const directive of requiredDirectives) {
      expect(directives[directive as keyof CSPDirectives]).toBeDefined();
      expect(Array.isArray(directives[directive as keyof CSPDirectives])).toBe(true);
      expect(directives[directive as keyof CSPDirectives].length).toBeGreaterThan(0);
    }
  });
});
