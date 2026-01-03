/**
 * Unit tests for the filterAllowedFields utility function.
 *
 * This function is critical for preventing mass assignment vulnerabilities
 * by filtering user-provided data to only include explicitly allowed fields.
 */

import { describe, it, expect } from 'bun:test';
import { filterAllowedFields } from '../validation';

// Define test allowed fields
const ALLOWED_FIELDS = ['title', 'content', 'slug'] as const;

describe('filterAllowedFields', () => {
  describe('field filtering', () => {
    it('filters out non-allowed fields', () => {
      const input = {
        title: 'My Note',
        content: 'Some content',
        org_id: 'malicious-org-id',
        created_by: 'attacker-id',
        id: 'injected-id',
      };

      const result = filterAllowedFields(input, ALLOWED_FIELDS);

      expect(result).toEqual({
        title: 'My Note',
        content: 'Some content',
      });
      expect(Object.keys(result).length).toBe(2);
      expect('org_id' in result).toBe(false);
      expect('created_by' in result).toBe(false);
      expect('id' in result).toBe(false);
    });

    it('preserves allowed fields with their values', () => {
      const input = {
        title: 'Test Title',
        content: 'Test Content',
        slug: 'test-slug',
      };

      const result = filterAllowedFields(input, ALLOWED_FIELDS);

      expect(result.title).toBe('Test Title');
      expect(result.content).toBe('Test Content');
      expect(result.slug).toBe('test-slug');
    });

    it('returns empty object when no allowed fields present', () => {
      const input = {
        org_id: 'malicious-org',
        created_by: 'attacker',
        share_hash: 'injected-hash',
        random_field: 'value',
      };

      const result = filterAllowedFields(input, ALLOWED_FIELDS);

      expect(result).toEqual({});
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('handles empty input object', () => {
      const input = {};

      const result = filterAllowedFields(input, ALLOWED_FIELDS);

      expect(result).toEqual({});
      expect(Object.keys(result).length).toBe(0);
    });

    it('handles undefined values for allowed fields', () => {
      const input = {
        title: undefined,
        content: 'Some content',
        slug: undefined,
      };

      const result = filterAllowedFields(input, ALLOWED_FIELDS);

      // Should include allowed fields even if their value is undefined
      expect(result.title).toBe(undefined);
      expect(result.content).toBe('Some content');
      expect(result.slug).toBe(undefined);
      expect(Object.keys(result).length).toBe(3);
    });

    it('handles null values for allowed fields', () => {
      const input = {
        title: null,
        content: 'Valid content',
        slug: null,
      };

      const result = filterAllowedFields(input, ALLOWED_FIELDS);

      // Should include allowed fields even if their value is null
      expect(result.title).toBe(null);
      expect(result.content).toBe('Valid content');
      expect(result.slug).toBe(null);
      expect(Object.keys(result).length).toBe(3);
    });

    it('handles empty allowed fields array', () => {
      const input = {
        title: 'Test',
        content: 'Content',
      };

      const result = filterAllowedFields(input, [] as const);

      expect(result).toEqual({});
      expect(Object.keys(result).length).toBe(0);
    });
  });

  describe('immutability', () => {
    it('does not mutate original object', () => {
      const input = {
        title: 'Original Title',
        content: 'Original Content',
        org_id: 'should-stay',
        extra: 'data',
      };

      // Store original values
      const originalKeys = Object.keys(input);
      const originalTitle = input.title;
      const originalOrgId = input.org_id;

      const result = filterAllowedFields(input, ALLOWED_FIELDS);

      // Original object should be unchanged
      expect(Object.keys(input).length).toBe(originalKeys.length);
      expect(input.title).toBe(originalTitle);
      expect(input.org_id).toBe(originalOrgId);
      expect(input.extra).toBe('data');

      // Result should be a new object, not the same reference
      expect(result).not.toBe(input);
    });
  });

  describe('value types', () => {
    it('handles various value types correctly', () => {
      const allowedFields = ['string', 'number', 'boolean', 'array', 'object'] as const;
      const input = {
        string: 'text value',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        object: { nested: 'value' },
        disallowed: 'should be filtered',
      };

      const result = filterAllowedFields(input, allowedFields);

      expect(result.string).toBe('text value');
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
      expect(result.array).toEqual([1, 2, 3]);
      expect(result.object).toEqual({ nested: 'value' });
      expect('disallowed' in result).toBe(false);
    });

    it('handles fields with special characters in values', () => {
      const input = {
        title: '<script>alert("XSS")</script>',
        content: '{"json": "value"}',
        slug: 'slug-with-special-chars!@#$%',
        org_id: 'malicious',
      };

      const result = filterAllowedFields(input, ALLOWED_FIELDS);

      // Should preserve the special characters in allowed field values
      expect(result.title).toBe('<script>alert("XSS")</script>');
      expect(result.content).toBe('{"json": "value"}');
      expect(result.slug).toBe('slug-with-special-chars!@#$%');
      expect('org_id' in result).toBe(false);
    });

    it('preserves falsy values (0, empty string, false)', () => {
      const allowedFields = ['zero', 'empty', 'falseVal'] as const;
      const input = {
        zero: 0,
        empty: '',
        falseVal: false,
        disallowed: 'filtered',
      };

      const result = filterAllowedFields(input, allowedFields);

      expect(result.zero).toBe(0);
      expect(result.empty).toBe('');
      expect(result.falseVal).toBe(false);
      expect(Object.keys(result).length).toBe(3);
    });
  });

  describe('security', () => {
    it('handles prototype pollution attempt', () => {
      // This tests that the function uses hasOwnProperty correctly
      const input = Object.create({ inheritedField: 'should not appear' });
      input.title = 'Own property';
      input.content = 'Also own';

      const allowedFields = ['title', 'content', 'inheritedField'] as const;
      const result = filterAllowedFields(input, allowedFields);

      expect(result.title).toBe('Own property');
      expect(result.content).toBe('Also own');
      // inheritedField is not an own property, so should not be included
      expect('inheritedField' in result).toBe(false);
    });

    it('handles case sensitivity correctly', () => {
      const input = {
        title: 'Lowercase title',
        Title: 'Uppercase Title',
        TITLE: 'All caps TITLE',
      };

      const allowedFields = ['title'] as const;
      const result = filterAllowedFields(input, allowedFields);

      // Should only include exact case match
      expect(result.title).toBe('Lowercase title');
      expect('Title' in result).toBe(false);
      expect('TITLE' in result).toBe(false);
    });
  });
});
