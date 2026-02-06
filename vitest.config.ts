/**
 * Vitest Configuration
 *
 * Test configuration for unit and integration tests.
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules/',
      'dist/',
      '.next/',
      '.vercel/',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/dist/**',
      ],
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
  },
  resolve: {
    alias: {
      '@': '/src',
      '@obsidian-note-reviewer/ui': '/packages/ui/src',
      '@obsidian-note-reviewer/core': '/packages/core/src',
      '@obsidian-note-reviewer/collaboration': '/packages/collaboration/src',
      '@obsidian-note-reviewer/annotation': '/packages/annotation/src',
    },
  },
});
