/**
 * Markdown Sanitizer Utilities
 *
 * Provides sanitization functions for markdown content to prevent XSS attacks
 * and ensure safe rendering of user-provided markdown.
 */

import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitization result interface
 */
export interface SanitizationResult {
  isClean: boolean;
  sanitized: string;
  removed?: string[];
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Malicious patterns that should be detected in markdown content
 */
const MALICIOUS_PATTERNS = [
  // Script tags in various forms
  /<script[^>]*>.*?<\/script>/gis,
  /<iframe[^>]*>.*?<\/iframe>/gis,
  /<object[^>]*>.*?<\/object>/gis,
  /<embed[^>]*>/gi,

  // JavaScript in event handlers
  /on\w+\s*=/gi, // onclick, onload, onerror, etc.

  // JavaScript protocols
  /javascript:/gi,
  /data:\s*text\/html/gi,

  // Style tags with potential CSS expressions
  /<style[^>]*>.*?expression\s*\(/gis,

  // Form tags that could capture user input
  /<form[^>]*>/gi,
  /<input[^>]*>/gi,
  /<button[^>]*>/gi,
];

/**
 * Safe HTML tags that are allowed in markdown rendering
 */
const SAFE_HTML_TAGS = [
  'a', 'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'hr',
  'img', 'figure', 'figcaption',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'div', 'span', 'del', 'ins',
  'sup', 'sub', 'kbd', 'samp', 'var',
];

/**
 * Safe HTML attributes that are allowed
 */
const SAFE_ATTRIBUTES = [
  'href', 'src', 'alt', 'title', 'class', 'id',
  'width', 'height', 'align', 'valign',
  'rowspan', 'colspan',
  'start', 'type', // for lists
  'data-*', // Allow data attributes
];

/**
 * Configure DOMPurify with safe defaults
 */
DOMPurify.addHook('uponSanitizeAttribute', (node, data) => {
  // Allow data attributes
  if (data.attrName.startsWith('data-')) {
    data.forceKeepAttr = true;
  }

  // Remove all event handler attributes
  if (data.attrName.startsWith('on')) {
    data.keepAttr = false;
  }

  // For href attributes, ensure they don't contain javascript:
  if (data.attrName === 'href' && data.attrValue) {
    const value = data.attrValue.toLowerCase();
    if (value.startsWith('javascript:') || value.startsWith('data:text/html')) {
      data.keepAttr = false;
    }
  }
});

/**
 * Sanitize HTML content using DOMPurify
 *
 * @param html - The HTML content to sanitize
 * @param options - Optional configuration options
 * @returns Sanitized HTML
 */
export function sanitizeHTML(
  html: string,
  options: {
    allowedTags?: string[];
    allowedAttributes?: Record<string, string[]>;
  } = {}
): string {
  const {
    allowedTags = SAFE_HTML_TAGS,
    allowedAttributes,
  } = options;

  const config: DOMPurify.Config = {
    ALLOWED_TAGS: allowedTags,
    ALLOWED_ATTR: SAFE_ATTRIBUTES,
    ALLOW_DATA_ATTR: true,
    ALLOW_UNKNOWN_PROTOCOLS: false,
    SAFE_FOR_TEMPLATES: true,
    WHOLE_DOCUMENT: false,
    RETURN_DOM: false,
    RETURN_DOM_FRAGMENT: false,
    RETURN_DOM_IMPORT: false,
    SANITIZE_DOM: true,
    FORCE_BODY: false,
  };

  // Add custom allowed attributes if provided
  if (allowedAttributes) {
    config.ALLOWED_ATTR = [
      ...SAFE_ATTRIBUTES,
      ...Object.values(allowedAttributes).flat(),
    ];
  }

  return DOMPurify.sanitize(html, config);
}

/**
 * Validate markdown content for malicious patterns
 *
 * @param content - The markdown content to validate
 * @returns Validation result with errors and warnings
 */
export function validateMarkdownContent(content: string): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for malicious patterns
  for (const pattern of MALICIOUS_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      errors.push(
        `Potentially malicious pattern detected: ${matches[0].substring(0, 50)}...`
      );
    }
  }

  // Check for suspicious base64 encoded content
  const base64Pattern = /data:([^;]+);base64,[a-zA-Z0-9+/=]{100,}/g;
  const base64Matches = content.match(base64Pattern);
  if (base64Matches) {
    warnings.push(
      `Found ${base64Matches.length} base64 encoded data URI(s) - verify they are safe`
    );
  }

  // Check for excessive length (potential DoS)
  if (content.length > 1000000) {
    warnings.push('Content is very long (>1MB) - consider limiting input size');
  }

  // Check for excessive nesting depth
  const maxNesting = (content.match(/^\s{50}/gm) || []).length;
  if (maxNesting > 0) {
    warnings.push('Content has deeply nested indentation - may cause rendering issues');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a URL is safe for rendering
 *
 * @param url - The URL to check
 * @returns True if the URL is safe
 */
export function isSafeURL(url: string): boolean {
  if (!url) return false;

  try {
    const parsed = new URL(url);

    // Block dangerous protocols
    const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
    if (dangerousProtocols.some(protocol => parsed.protocol === protocol)) {
      return false;
    }

    // Only allow http, https, and relative URLs
    return ['http:', 'https:', ''].includes(parsed.protocol);
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Sanitize and validate markdown content
 *
 * @param content - The markdown content to sanitize
 * @returns Sanitization result
 */
export function sanitizeMarkdown(content: string): SanitizationResult {
  const validation = validateMarkdownContent(content);

  if (!validation.isClean) {
    // Remove detected malicious patterns
    let sanitized = content;
    const removed: string[] = [];

    for (const pattern of MALICIOUS_PATTERNS) {
      const matches = sanitized.match(pattern);
      if (matches) {
        removed.push(...matches);
        sanitized = sanitized.replace(pattern, '');
      }
    }

    return {
      isClean: true,
      sanitized: sanitized.trim(),
      removed,
    };
  }

  return {
    isClean: validation.isValid,
    sanitized: content,
  };
}

/**
 * Get whitelist of safe HTML tags
 */
export function getSafeHTMLTags(): string[] {
  return [...SAFE_HTML_TAGS];
}

/**
 * Get whitelist of safe HTML attributes
 */
export function getSafeAttributes(): string[] {
  return [...SAFE_ATTRIBUTES];
}
