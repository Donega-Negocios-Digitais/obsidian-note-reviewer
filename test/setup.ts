/**
 * Test Setup
 *
 * Global test configuration and utilities.
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { vi } from 'vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock requestAnimationFrame
global.requestAnimationFrame = (callback: FrameRequestCallback) => {
  return setTimeout(callback, 0) as unknown as number;
};

global.cancelAnimationFrame = (id: number) => {
  clearTimeout(id);
};

// Mock crypto.randomUUID for tests
if (!global.crypto) {
  // @ts-ignore
  global.crypto = {};
}

// @ts-ignore
crypto.randomUUID = () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9);

// Suppress console errors in tests unless debugging
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  if (!process.env.DEBUG_TESTS) {
    console.error = vi.fn();
    console.warn = vi.fn();
  }
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});
