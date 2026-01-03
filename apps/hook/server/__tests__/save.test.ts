/**
 * Integration tests for the /api/save endpoint
 *
 * Tests path traversal attack prevention (CWE-22) and general save functionality.
 *
 * Note: Integration tests (marked with test.skip) require a running server.
 * To run them, start the server and remove .skip:
 *   bun run apps/hook/server/index.ts
 *
 * Unit tests run without a server by testing the validation logic directly.
 */

import { describe, test, expect } from 'bun:test';
import { validatePath, validatePathWithAllowedDirs } from '../pathValidation';

// Server URL for integration tests
const SERVER_URL = 'http://localhost:5173';

/**
 * Helper function for making save requests in integration tests
 */
async function makeSaveRequest(content: string, path: string) {
  return fetch(`${SERVER_URL}/api/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, path })
  });
}

describe('POST /api/save', () => {
  describe('UTF-8 Encoding', () => {
    test('validates UTF-8 encoding preservation', () => {
      const testString = 'Título com Acentuação: ção, ã, é';
      const encoded = new TextEncoder().encode(testString);
      const decoded = new TextDecoder().decode(encoded);

      expect(decoded).toBe(testString);
      expect(decoded).toContain('ção');
      expect(decoded).toContain('Acentuação');
    });
  });

  // ============================================================================
  // Security Tests: Path Traversal Attack Prevention (CWE-22)
  // ============================================================================
  // These tests verify the endpoint properly rejects malicious paths.
  // Unit tests validate the pathValidation module is correctly integrated.
  // Integration tests (marked with .skip) verify actual HTTP responses.
  // ============================================================================

  describe('Security: Path Traversal Prevention', () => {
    describe('simple traversal attacks', () => {
      const simpleTraversalPaths = [
        { path: '../etc/passwd', description: 'single level traversal' },
        { path: '../../etc/passwd', description: 'double level traversal' },
        { path: '../../../etc/passwd', description: 'triple level traversal' },
        { path: 'vault/../../../etc/passwd', description: 'nested traversal' },
        { path: 'a/b/c/../../../../etc/passwd', description: 'deeply nested traversal' },
      ];

      simpleTraversalPaths.forEach(({ path, description }) => {
        test(`blocks ${description}: ${path}`, () => {
          const result = validatePath(path);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Path traversal detected');
        });
      });

      test.skip('integration: blocks simple traversal via HTTP', async () => {
        const response = await makeSaveRequest('test', '../../../etc/passwd');
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.ok).toBe(false);
        expect(body.error).toContain('traversal');
      });
    });

    describe('Windows path traversal attacks', () => {
      const windowsTraversalPaths = [
        { path: '..\\etc\\passwd', description: 'backslash single level' },
        { path: '..\\..\\Windows\\System32\\config\\SAM', description: 'Windows system file access' },
        { path: '..\\..\\..\\Windows\\System32', description: 'Windows System32 access' },
        { path: '..\\..\\Windows\\win.ini', description: 'Windows ini file access' },
      ];

      windowsTraversalPaths.forEach(({ path, description }) => {
        test(`blocks ${description}: ${path}`, () => {
          const result = validatePath(path);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Path traversal detected');
        });
      });

      test.skip('integration: blocks Windows traversal via HTTP', async () => {
        const response = await makeSaveRequest('test', '..\\..\\Windows\\System32\\config\\SAM');
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.ok).toBe(false);
      });
    });

    describe('mixed separator traversal attacks', () => {
      const mixedTraversalPaths = [
        { path: '../..\\etc/passwd', description: 'mixed forward and back' },
        { path: '..\\../etc\\passwd', description: 'alternating separators' },
        { path: 'folder/../..\\sensitive', description: 'mixed in middle' },
      ];

      mixedTraversalPaths.forEach(({ path, description }) => {
        test(`blocks ${description}: ${path}`, () => {
          const result = validatePath(path);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Path traversal detected');
        });
      });
    });

    describe('URL encoded traversal attacks', () => {
      const encodedTraversalPaths = [
        { path: '%2e%2e%2fetc/passwd', description: 'URL encoded ../' },
        { path: '..%2fetc/passwd', description: 'encoded slash' },
        { path: '%2e%2e/etc/passwd', description: 'encoded dots' },
        { path: '%2e%2e%5cetc\\passwd', description: 'encoded Windows style' },
      ];

      encodedTraversalPaths.forEach(({ path, description }) => {
        test(`blocks ${description}: ${path}`, () => {
          const result = validatePath(path);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Path traversal detected');
        });
      });

      test.skip('integration: blocks URL encoded traversal via HTTP', async () => {
        const response = await makeSaveRequest('test', '%2e%2e%2f%2e%2e%2fetc/passwd');
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.ok).toBe(false);
      });
    });

    describe('double-encoded traversal attacks', () => {
      const doubleEncodedPaths = [
        { path: '%252e%252e%252fetc/passwd', description: 'double encoded ../' },
        { path: '%252e%252e/etc/passwd', description: 'double encoded dots' },
        { path: '..%252fetc/passwd', description: 'double encoded slash' },
      ];

      doubleEncodedPaths.forEach(({ path, description }) => {
        test(`blocks ${description}: ${path}`, () => {
          const result = validatePath(path);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Path traversal detected');
        });
      });
    });

    describe('Unicode/overlong encoding attacks', () => {
      const unicodeAttackPaths = [
        { path: '%c0%ae%c0%ae/etc/passwd', description: 'C0 overlong encoding' },
        { path: '.%c0%ae/etc/passwd', description: 'mixed C0 encoding' },
        { path: '%e0%80%ae%e0%80%ae/etc/passwd', description: 'E0 overlong encoding' },
      ];

      unicodeAttackPaths.forEach(({ path, description }) => {
        test(`blocks ${description}: ${path}`, () => {
          const result = validatePath(path);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Path traversal detected');
        });
      });
    });

    describe('null byte injection attacks', () => {
      const nullByteAttackPaths = [
        { path: 'file.txt\0.jpg', description: 'null byte extension bypass' },
        { path: '../etc/passwd\0.md', description: 'null byte with traversal' },
        { path: 'file.txt%00.jpg', description: 'URL encoded null byte' },
      ];

      nullByteAttackPaths.forEach(({ path, description }) => {
        test(`blocks ${description}: ${path}`, () => {
          const result = validatePath(path);
          expect(result.valid).toBe(false);
          expect(result.error).toBe('Invalid characters in path');
        });
      });

      test.skip('integration: blocks null byte injection via HTTP', async () => {
        const response = await makeSaveRequest('test', 'file.txt%00.md');
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.ok).toBe(false);
      });
    });

    describe('empty and invalid paths', () => {
      test('rejects empty path', () => {
        const result = validatePath('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Path is required');
      });

      test.skip('integration: rejects empty path via HTTP', async () => {
        const response = await makeSaveRequest('test', '');
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.ok).toBe(false);
      });
    });
  });

  // ============================================================================
  // Security Tests: ALLOWED_SAVE_PATHS Restriction
  // ============================================================================
  // Tests for the optional vault-based directory restriction feature.
  // ============================================================================

  describe('Security: ALLOWED_SAVE_PATHS Restriction', () => {
    const allowedDirs = ['/home/user/vault', '/data/notes'];

    test('accepts path within allowed directory', () => {
      const result = validatePathWithAllowedDirs('/home/user/vault/note.md', allowedDirs);
      expect(result.valid).toBe(true);
      expect(result.normalizedPath).toBeDefined();
    });

    test('accepts path in second allowed directory', () => {
      const result = validatePathWithAllowedDirs('/data/notes/subfolder/note.md', allowedDirs);
      expect(result.valid).toBe(true);
    });

    test('rejects path outside all allowed directories', () => {
      const result = validatePathWithAllowedDirs('/etc/passwd', allowedDirs);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Path is not within any allowed directory');
    });

    test('rejects path that partially matches allowed directory', () => {
      // /home/user/vaultbackup should NOT be allowed when only /home/user/vault is configured
      const result = validatePathWithAllowedDirs('/home/user/vaultbackup/note.md', allowedDirs);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Path is not within any allowed directory');
    });

    test('still blocks traversal even if destination would be in allowed dir', () => {
      // Even if the final resolved path might end up in an allowed directory,
      // the traversal attempt should still be blocked
      const result = validatePathWithAllowedDirs('../../../home/user/vault/note.md', allowedDirs);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Path traversal detected');
    });

    describe('Windows paths with allowed directories', () => {
      const windowsAllowedDirs = ['C:\\Users\\name\\Documents\\Vault', 'D:\\Notes'];

      test('accepts Windows path within allowed directory', () => {
        const result = validatePathWithAllowedDirs(
          'C:\\Users\\name\\Documents\\Vault\\subfolder\\note.md',
          windowsAllowedDirs
        );
        expect(result.valid).toBe(true);
      });

      test('rejects Windows path outside allowed directories', () => {
        const result = validatePathWithAllowedDirs(
          'E:\\Other\\file.md',
          windowsAllowedDirs
        );
        expect(result.valid).toBe(false);
      });
    });
  });

  // ============================================================================
  // Positive Tests: Valid Paths Should Work
  // ============================================================================
  // Ensure the security measures don't break legitimate functionality.
  // ============================================================================

  describe('Valid Paths (should be accepted)', () => {
    const validPaths = [
      { path: '/home/user/vault/note.md', description: 'absolute Unix path' },
      { path: 'C:\\Users\\name\\Documents\\note.md', description: 'absolute Windows path' },
      { path: 'folder/subfolder/note.md', description: 'relative path with subdirectories' },
      { path: './note.md', description: 'current directory relative path' },
      { path: 'note.md', description: 'simple filename' },
      { path: '/vault/2024.01.01 Daily Note.md', description: 'path with spaces and dots' },
      { path: '/vault/Note_with-special_chars.md', description: 'path with underscores and dashes' },
      { path: '/vault/Notas/Título com Acentuação.md', description: 'path with Unicode characters' },
      { path: '/vault/.hidden-folder/note.md', description: 'path with hidden folder' },
      { path: '/vault/folder/.hidden-note.md', description: 'hidden file' },
    ];

    validPaths.forEach(({ path, description }) => {
      test(`accepts ${description}: ${path}`, () => {
        const result = validatePath(path);
        expect(result.valid).toBe(true);
        expect(result.normalizedPath).toBeDefined();
        expect(result.error).toBeUndefined();
      });
    });

    test('accepts paths with multiple consecutive slashes (normalized)', () => {
      const result = validatePath('/vault//subfolder///note.md');
      expect(result.valid).toBe(true);
    });

    test('accepts very long valid paths', () => {
      const longPath = '/vault/' + 'subfolder/'.repeat(20) + 'note.md';
      const result = validatePath(longPath);
      expect(result.valid).toBe(true);
    });

    test.skip('integration: successfully saves valid file', async () => {
      const testPath = '/tmp/obsidian-test-' + Date.now() + '.md';
      const response = await makeSaveRequest('# Test Note\n\nContent here.', testPath);

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.ok).toBe(true);
      expect(body.message).toContain('sucesso');
    });
  });

  // ============================================================================
  // Error Message Security Tests
  // ============================================================================
  // Ensure error messages don't leak sensitive information.
  // ============================================================================

  describe('Error Message Security', () => {
    test('error message for traversal does not reveal normalized path', () => {
      const result = validatePath('../../../etc/passwd');
      expect(result.error).toBe('Path traversal detected');
      // Error should not contain the actual resolved path
      expect(result.error).not.toContain('/etc/passwd');
      expect(result.error).not.toContain('etc');
    });

    test('error message for null byte is generic', () => {
      const result = validatePath('file\0.txt');
      expect(result.error).toBe('Invalid characters in path');
      // Error should not reveal details about null byte handling
    });

    test('error message for outside allowed directory is informative but safe', () => {
      const result = validatePathWithAllowedDirs('/secret/file.txt', ['/vault']);
      expect(result.error).toBe('Path is not within any allowed directory');
      // Should not reveal what directories ARE allowed
      expect(result.error).not.toContain('/vault');
    });
  });

  // ============================================================================
  // Integration Tests (require running server)
  // ============================================================================

  describe('Integration Tests', () => {
    test.skip('endpoint exists and responds', async () => {
      const response = await fetch(`${SERVER_URL}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: '# Test',
          path: '/tmp/test.md'
        })
      });

      expect(response.status).toBeLessThan(500);
    });

    test.skip('returns proper JSON error for path traversal', async () => {
      const response = await makeSaveRequest('malicious', '../../../etc/passwd');

      expect(response.status).toBe(400);
      expect(response.headers.get('content-type')).toContain('application/json');

      const body = await response.json();
      expect(body).toHaveProperty('ok', false);
      expect(body).toHaveProperty('error');
      expect(typeof body.error).toBe('string');
    });

    test.skip('handles missing content field', async () => {
      const response = await fetch(`${SERVER_URL}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: '/tmp/test.md' })
      });

      // Should either succeed with empty content or return appropriate error
      expect(response.status).toBeLessThan(500);
    });

    test.skip('handles missing path field', async () => {
      const response = await fetch(`${SERVER_URL}/api/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '# Test' })
      });

      expect(response.status).toBe(400);
    });
  });
});
