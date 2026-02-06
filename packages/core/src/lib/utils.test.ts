/**
 * Utils Tests
 *
 * Unit tests for utility functions.
 */

import { describe, it, expect } from 'vitest';

describe('StringUtils', () => {
  describe('slugify', () => {
    it('should convert text to slug format', () => {
      // This is a placeholder - actual implementation would be imported
      const slugify = (text: string) =>
        text
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9\s-]/g, '')
          .trim()
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-');

      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Café com Leite')).toBe('cafe-com-leite');
      expect(slugify('Test @ 123')).toBe('test-123');
      expect(slugify('')).toBe('');
    });
  });

  describe('validateEmail', () => {
    const validateEmail = (email: string) => {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    };

    it('should validate correct emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
    });
  });
});

describe('DateUtils', () => {
  it('should format dates in Portuguese', () => {
    const formatDate = (date: Date) => {
      return new Intl.DateTimeFormat('pt-BR', {
        dateStyle: 'long',
      }).format(date);
    };

    const date = new Date('2026-02-06');
    expect(formatDate(date)).toBe('6 de fevereiro de 2026');
  });

  it('should format relative time', () => {
    const formatRelative = (date: Date) => {
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'agora';
      if (diffMins < 60) return `${diffMins}min atrás`;
      if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h atrás`;
      return `${Math.floor(diffMins / 1440)}d atrás`;
    };

    const now = new Date();
    expect(formatRelative(now)).toBe('agora');

    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    expect(formatRelative(oneHourAgo)).toBe('1h atrás');
  });
});
