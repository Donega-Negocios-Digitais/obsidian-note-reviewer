import { describe, it, expect } from 'bun:test';
import {
  safeJsonParse,
  safeJsonParseOrNull,
  safeJsonParseOrDefault,
  type JsonParseResult,
  type JsonValidator,
} from '../safeJson';

describe('safeJsonParse', () => {
  describe('valid JSON parsing', () => {
    it('should parse a simple object', () => {
      const json = '{"name": "test", "value": 123}';
      const result = safeJsonParse<{ name: string; value: number }>(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test');
        expect(result.data.value).toBe(123);
      }
    });

    it('should parse an array', () => {
      const json = '[1, 2, 3, "four"]';
      const result = safeJsonParse<(number | string)[]>(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([1, 2, 3, 'four']);
      }
    });

    it('should parse a string', () => {
      const json = '"hello world"';
      const result = safeJsonParse<string>(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('hello world');
      }
    });

    it('should parse a number', () => {
      const json = '42.5';
      const result = safeJsonParse<number>(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42.5);
      }
    });

    it('should parse a boolean', () => {
      const json = 'true';
      const result = safeJsonParse<boolean>(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(true);
      }
    });

    it('should parse null', () => {
      const json = 'null';
      const result = safeJsonParse<null>(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(null);
      }
    });

    it('should parse nested objects', () => {
      const json = '{"outer": {"inner": {"value": "deep"}}}';
      const result = safeJsonParse<{
        outer: { inner: { value: string } };
      }>(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.outer.inner.value).toBe('deep');
      }
    });

    it('should parse complex structures with arrays and objects', () => {
      const json = '{"items": [{"id": 1}, {"id": 2}], "count": 2}';
      const result = safeJsonParse<{
        items: { id: number }[];
        count: number;
      }>(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.items.length).toBe(2);
        expect(result.data.items[0].id).toBe(1);
        expect(result.data.count).toBe(2);
      }
    });

    it('should parse JSON with whitespace', () => {
      const json = `
        {
          "name": "test",
          "value": 123
        }
      `;
      const result = safeJsonParse<{ name: string; value: number }>(json);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.name).toBe('test');
      }
    });
  });

  describe('invalid JSON handling', () => {
    it('should handle missing closing brace', () => {
      const json = '{"name": "test"';
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON format');
      }
    });

    it('should handle missing quotes', () => {
      const json = '{name: "test"}';
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON format');
      }
    });

    it('should handle trailing comma', () => {
      const json = '{"name": "test",}';
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON format');
      }
    });

    it('should handle single quotes (invalid in JSON)', () => {
      const json = "{'name': 'test'}";
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON format');
      }
    });

    it('should handle unquoted strings', () => {
      const json = '{name: test}';
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON format');
      }
    });

    it('should handle invalid escape sequences', () => {
      const json = '{"name": "test\\q"}';
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON format');
      }
    });

    it('should handle random garbage', () => {
      const json = 'asdf{]}garbage';
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON format');
      }
    });

    it('should handle incomplete array', () => {
      const json = '[1, 2, 3';
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON format');
      }
    });

    it('should handle JavaScript code (not JSON)', () => {
      const json = 'function() { return {}; }';
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON format');
      }
    });

    it('should handle HTML content', () => {
      const json = '<html><body>Not JSON</body></html>';
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON format');
      }
    });
  });

  describe('empty/null/undefined inputs', () => {
    it('should handle empty string', () => {
      const result = safeJsonParse('');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid input: empty or null value');
      }
    });

    it('should handle null input', () => {
      const result = safeJsonParse(null as unknown as string);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid input: empty or null value');
      }
    });

    it('should handle undefined input', () => {
      const result = safeJsonParse(undefined as unknown as string);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid input: empty or null value');
      }
    });

    it('should handle non-string input (number)', () => {
      const result = safeJsonParse(123 as unknown as string);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid input: expected string');
      }
    });

    it('should handle non-string input (object)', () => {
      const result = safeJsonParse({ foo: 'bar' } as unknown as string);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid input: expected string');
      }
    });

    it('should handle non-string input (array)', () => {
      const result = safeJsonParse([1, 2, 3] as unknown as string);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid input: expected string');
      }
    });

    it('should parse whitespace-only as valid (JSON whitespace)', () => {
      // Note: This actually passes through to JSON.parse which will fail
      // since whitespace alone is not valid JSON
      const result = safeJsonParse('   ');

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Invalid JSON format');
      }
    });
  });

  describe('error message sanitization', () => {
    it('should not expose parsing position in error', () => {
      const json = '{"name": "test", bad}';
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Should not contain position information like "at position 17"
        expect(result.error).not.toMatch(/position/i);
        expect(result.error).not.toMatch(/\d+/);
        expect(result.error).toBe('Invalid JSON format');
      }
    });

    it('should not expose token information in error', () => {
      const json = '{"name": undefined}';
      const result = safeJsonParse(json);

      expect(result.success).toBe(false);
      if (!result.success) {
        // Should not contain token information like "unexpected token"
        expect(result.error).not.toMatch(/token/i);
        expect(result.error).not.toMatch(/undefined/i);
        expect(result.error).toBe('Invalid JSON format');
      }
    });

    it('should not expose the original JSON content in error', () => {
      const sensitiveJson = '{"password": "secret123", syntax error}';
      const result = safeJsonParse(sensitiveJson);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).not.toContain('password');
        expect(result.error).not.toContain('secret123');
        expect(result.error).toBe('Invalid JSON format');
      }
    });

    it('should use generic error for all syntax errors', () => {
      const malformedInputs = [
        '{"unclosed": ',
        '[[[',
        '{"a": 1, "a": 2}', // This is actually valid JSON, duplicate keys
        'NaN',
        'Infinity',
        '{"key": }',
      ];

      for (const input of malformedInputs) {
        const result = safeJsonParse(input);
        if (!result.success) {
          expect(result.error).toMatch(/Invalid JSON format|Failed to parse data/);
        }
      }
    });
  });

  describe('validation callback', () => {
    interface User {
      id: number;
      name: string;
      email: string;
    }

    const isUser: JsonValidator<User> = (data): data is User => {
      return (
        typeof data === 'object' &&
        data !== null &&
        'id' in data &&
        typeof (data as User).id === 'number' &&
        'name' in data &&
        typeof (data as User).name === 'string' &&
        'email' in data &&
        typeof (data as User).email === 'string'
      );
    };

    it('should pass validation for correct structure', () => {
      const json = '{"id": 1, "name": "John", "email": "john@example.com"}';
      const result = safeJsonParse<User>(json, isUser);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
        expect(result.data.name).toBe('John');
        expect(result.data.email).toBe('john@example.com');
      }
    });

    it('should fail validation for missing required field', () => {
      const json = '{"id": 1, "name": "John"}'; // missing email
      const result = safeJsonParse<User>(json, isUser);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Validation failed: data structure mismatch');
      }
    });

    it('should fail validation for wrong type', () => {
      const json = '{"id": "not-a-number", "name": "John", "email": "john@example.com"}';
      const result = safeJsonParse<User>(json, isUser);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Validation failed: data structure mismatch');
      }
    });

    it('should fail validation for array when expecting object', () => {
      const json = '[{"id": 1, "name": "John", "email": "john@example.com"}]';
      const result = safeJsonParse<User>(json, isUser);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Validation failed: data structure mismatch');
      }
    });

    it('should fail validation for primitive when expecting object', () => {
      const json = '"just a string"';
      const result = safeJsonParse<User>(json, isUser);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Validation failed: data structure mismatch');
      }
    });

    it('should work with custom validator for arrays', () => {
      const isNumberArray: JsonValidator<number[]> = (data): data is number[] => {
        return (
          Array.isArray(data) && data.every((item) => typeof item === 'number')
        );
      };

      const validJson = '[1, 2, 3, 4, 5]';
      const invalidJson = '[1, 2, "three", 4]';

      const validResult = safeJsonParse<number[]>(validJson, isNumberArray);
      const invalidResult = safeJsonParse<number[]>(invalidJson, isNumberArray);

      expect(validResult.success).toBe(true);
      expect(invalidResult.success).toBe(false);
    });

    it('should pass extra fields through validation', () => {
      // A validator that only checks for required fields
      const hasId: JsonValidator<{ id: number }> = (data): data is { id: number } => {
        return (
          typeof data === 'object' &&
          data !== null &&
          'id' in data &&
          typeof (data as { id: number }).id === 'number'
        );
      };

      const json = '{"id": 1, "extra": "field", "another": 123}';
      const result = safeJsonParse<{ id: number }>(json, hasId);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe(1);
      }
    });
  });
});

describe('safeJsonParseOrNull', () => {
  it('should return parsed data for valid JSON', () => {
    const json = '{"name": "test"}';
    const result = safeJsonParseOrNull<{ name: string }>(json);

    expect(result).not.toBeNull();
    expect(result?.name).toBe('test');
  });

  it('should return null for invalid JSON', () => {
    const json = '{invalid json}';
    const result = safeJsonParseOrNull(json);

    expect(result).toBeNull();
  });

  it('should return null for empty string', () => {
    const result = safeJsonParseOrNull('');

    expect(result).toBeNull();
  });

  it('should return null for null input', () => {
    const result = safeJsonParseOrNull(null as unknown as string);

    expect(result).toBeNull();
  });

  it('should return null for undefined input', () => {
    const result = safeJsonParseOrNull(undefined as unknown as string);

    expect(result).toBeNull();
  });

  it('should return null when validation fails', () => {
    const isNumber: JsonValidator<number> = (data): data is number => {
      return typeof data === 'number';
    };

    const json = '"not a number"';
    const result = safeJsonParseOrNull<number>(json, isNumber);

    expect(result).toBeNull();
  });

  it('should return data when validation passes', () => {
    const isNumber: JsonValidator<number> = (data): data is number => {
      return typeof data === 'number';
    };

    const json = '42';
    const result = safeJsonParseOrNull<number>(json, isNumber);

    expect(result).toBe(42);
  });
});

describe('safeJsonParseOrDefault', () => {
  const defaultConfig = { theme: 'light', fontSize: 14 };

  it('should return parsed data for valid JSON', () => {
    const json = '{"theme": "dark", "fontSize": 16}';
    const result = safeJsonParseOrDefault(json, defaultConfig);

    expect(result.theme).toBe('dark');
    expect(result.fontSize).toBe(16);
  });

  it('should return default for invalid JSON', () => {
    const json = '{invalid}';
    const result = safeJsonParseOrDefault(json, defaultConfig);

    expect(result).toEqual(defaultConfig);
  });

  it('should return default for empty string', () => {
    const result = safeJsonParseOrDefault('', defaultConfig);

    expect(result).toEqual(defaultConfig);
  });

  it('should return default for null input', () => {
    const result = safeJsonParseOrDefault(null as unknown as string, defaultConfig);

    expect(result).toEqual(defaultConfig);
  });

  it('should return default for undefined input', () => {
    const result = safeJsonParseOrDefault(undefined as unknown as string, defaultConfig);

    expect(result).toEqual(defaultConfig);
  });

  it('should return default when validation fails', () => {
    interface Config {
      theme: string;
      fontSize: number;
    }

    const isConfig: JsonValidator<Config> = (data): data is Config => {
      return (
        typeof data === 'object' &&
        data !== null &&
        'theme' in data &&
        typeof (data as Config).theme === 'string' &&
        'fontSize' in data &&
        typeof (data as Config).fontSize === 'number'
      );
    };

    // Missing fontSize
    const json = '{"theme": "dark"}';
    const result = safeJsonParseOrDefault<Config>(json, defaultConfig, isConfig);

    expect(result).toEqual(defaultConfig);
  });

  it('should return parsed data when validation passes', () => {
    interface Config {
      theme: string;
      fontSize: number;
    }

    const isConfig: JsonValidator<Config> = (data): data is Config => {
      return (
        typeof data === 'object' &&
        data !== null &&
        'theme' in data &&
        typeof (data as Config).theme === 'string' &&
        'fontSize' in data &&
        typeof (data as Config).fontSize === 'number'
      );
    };

    const json = '{"theme": "dark", "fontSize": 18}';
    const result = safeJsonParseOrDefault<Config>(json, defaultConfig, isConfig);

    expect(result.theme).toBe('dark');
    expect(result.fontSize).toBe(18);
  });

  it('should use default of different shape', () => {
    // Test with an array default
    const defaultItems: string[] = ['default'];
    const validJson = '["item1", "item2"]';
    const invalidJson = '{not an array}';

    expect(safeJsonParseOrDefault(validJson, defaultItems)).toEqual([
      'item1',
      'item2',
    ]);
    expect(safeJsonParseOrDefault(invalidJson, defaultItems)).toEqual(defaultItems);
  });
});

describe('edge cases', () => {
  it('should handle very large JSON', () => {
    const largeArray = Array(10000).fill({ id: 1, name: 'test' });
    const json = JSON.stringify(largeArray);
    const result = safeJsonParse<{ id: number; name: string }[]>(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.length).toBe(10000);
    }
  });

  it('should handle Unicode characters', () => {
    const json = '{"message": "Hello \u4e16\u754c \ud83d\ude00"}';
    const result = safeJsonParse<{ message: string }>(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.message).toContain('\u4e16\u754c');
    }
  });

  it('should handle special JSON characters in strings', () => {
    const json = '{"text": "line1\\nline2\\ttabbed\\r\\nwindows"}';
    const result = safeJsonParse<{ text: string }>(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.text).toContain('\n');
      expect(result.data.text).toContain('\t');
    }
  });

  it('should handle empty object', () => {
    const json = '{}';
    const result = safeJsonParse<Record<string, never>>(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({});
    }
  });

  it('should handle empty array', () => {
    const json = '[]';
    const result = safeJsonParse<never[]>(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual([]);
    }
  });

  it('should handle deeply nested structures', () => {
    const deepObject = {
      level1: {
        level2: {
          level3: {
            level4: {
              level5: {
                value: 'deep',
              },
            },
          },
        },
      },
    };
    const json = JSON.stringify(deepObject);
    const result = safeJsonParse<typeof deepObject>(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.level1.level2.level3.level4.level5.value).toBe('deep');
    }
  });

  it('should handle numbers at limits', () => {
    const json = `{"big": ${Number.MAX_SAFE_INTEGER}, "small": ${Number.MIN_SAFE_INTEGER}}`;
    const result = safeJsonParse<{ big: number; small: number }>(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.big).toBe(Number.MAX_SAFE_INTEGER);
      expect(result.data.small).toBe(Number.MIN_SAFE_INTEGER);
    }
  });

  it('should handle scientific notation', () => {
    const json = '{"value": 1.23e10}';
    const result = safeJsonParse<{ value: number }>(json);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.value).toBe(1.23e10);
    }
  });
});
