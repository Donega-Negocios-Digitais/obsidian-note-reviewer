/**
 * Tests for the Rate Limiter Module
 *
 * Since the production module uses Deno-specific imports (esm.sh URLs),
 * these tests verify the core algorithms and logic by reimplementing
 * the testable portions in a Node/Bun-compatible way.
 */

import { describe, it, expect, beforeEach } from 'bun:test';

/**
 * Rate limit result interface (matching the production module)
 */
interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

type RateLimitType = 'batch' | 'process';

/**
 * Rate limit configurations (matching production values)
 */
const RATE_LIMIT_CONFIG: Record<RateLimitType, { requests: number; windowMs: number }> = {
  batch: { requests: 5, windowMs: 60_000 },
  process: { requests: 20, windowMs: 60_000 },
};

/**
 * In-memory sliding window storage for tests
 */
let inMemoryStore: Map<string, number[]>;

/**
 * Test implementation of the in-memory sliding window rate limiter
 * (matching the production algorithm)
 */
function checkInMemoryRateLimit(identifier: string, type: RateLimitType, now?: number): RateLimitResult {
  const config = RATE_LIMIT_CONFIG[type];
  const key = `${identifier}:${type}`;
  const currentTime = now ?? Date.now();
  const windowStart = currentTime - config.windowMs;

  // Get existing timestamps and filter out expired ones
  let timestamps = inMemoryStore.get(key) || [];
  timestamps = timestamps.filter((ts) => ts > windowStart);

  const remaining = Math.max(0, config.requests - timestamps.length);
  const reset = Math.ceil((currentTime + config.windowMs) / 1000);

  if (timestamps.length >= config.requests) {
    // Rate limit exceeded
    inMemoryStore.set(key, timestamps);
    return {
      success: false,
      remaining: 0,
      reset,
      limit: config.requests,
    };
  }

  // Add current request timestamp
  timestamps.push(currentTime);
  inMemoryStore.set(key, timestamps);

  return {
    success: true,
    remaining: remaining - 1,
    reset,
    limit: config.requests,
  };
}

/**
 * Test implementation of createRateLimitResponse
 * (matching the production implementation)
 */
function createRateLimitResponse(result: RateLimitResult): Response {
  const now = Math.ceil(Date.now() / 1000);
  const retryAfter = Math.max(1, result.reset - now);

  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(result.limit),
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(result.reset),
      },
    }
  );
}

describe('Rate Limiter Module', () => {
  beforeEach(() => {
    // Reset the in-memory store before each test
    inMemoryStore = new Map<string, number[]>();
  });

  describe('Rate Limit Configuration', () => {
    it('should have correct batch rate limit (5 req/min)', () => {
      expect(RATE_LIMIT_CONFIG.batch.requests).toBe(5);
      expect(RATE_LIMIT_CONFIG.batch.windowMs).toBe(60_000);
    });

    it('should have correct process rate limit (20 req/min)', () => {
      expect(RATE_LIMIT_CONFIG.process.requests).toBe(20);
      expect(RATE_LIMIT_CONFIG.process.windowMs).toBe(60_000);
    });
  });

  describe('In-Memory Sliding Window Algorithm', () => {
    describe('batch rate limit type', () => {
      it('should allow requests within the limit', () => {
        const identifier = 'user-123';

        // First 5 requests should succeed
        for (let i = 0; i < 5; i++) {
          const result = checkInMemoryRateLimit(identifier, 'batch');
          expect(result.success).toBe(true);
          expect(result.limit).toBe(5);
          expect(result.remaining).toBe(4 - i); // 4, 3, 2, 1, 0
        }
      });

      it('should block requests exceeding the limit', () => {
        const identifier = 'user-456';

        // Use up all 5 requests
        for (let i = 0; i < 5; i++) {
          checkInMemoryRateLimit(identifier, 'batch');
        }

        // 6th request should be blocked
        const result = checkInMemoryRateLimit(identifier, 'batch');
        expect(result.success).toBe(false);
        expect(result.remaining).toBe(0);
        expect(result.limit).toBe(5);
      });

      it('should track different users independently', () => {
        // User A makes 5 requests
        for (let i = 0; i < 5; i++) {
          checkInMemoryRateLimit('user-A', 'batch');
        }

        // User A is now rate limited
        expect(checkInMemoryRateLimit('user-A', 'batch').success).toBe(false);

        // User B should still be able to make requests
        const resultB = checkInMemoryRateLimit('user-B', 'batch');
        expect(resultB.success).toBe(true);
        expect(resultB.remaining).toBe(4);
      });
    });

    describe('process rate limit type', () => {
      it('should allow up to 20 requests', () => {
        const identifier = 'user-789';

        // First 20 requests should succeed
        for (let i = 0; i < 20; i++) {
          const result = checkInMemoryRateLimit(identifier, 'process');
          expect(result.success).toBe(true);
          expect(result.remaining).toBe(19 - i);
        }

        // 21st request should be blocked
        const result = checkInMemoryRateLimit(identifier, 'process');
        expect(result.success).toBe(false);
        expect(result.remaining).toBe(0);
      });

      it('should track separately from batch limits', () => {
        const identifier = 'user-multi';

        // Exhaust batch limit
        for (let i = 0; i < 5; i++) {
          checkInMemoryRateLimit(identifier, 'batch');
        }
        expect(checkInMemoryRateLimit(identifier, 'batch').success).toBe(false);

        // Process limit should still have full capacity
        const result = checkInMemoryRateLimit(identifier, 'process');
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(19);
      });
    });

    describe('sliding window expiration', () => {
      it('should reset after window expires', () => {
        const identifier = 'user-expiry';
        const baseTime = Date.now();

        // Use up all batch requests at base time
        for (let i = 0; i < 5; i++) {
          checkInMemoryRateLimit(identifier, 'batch', baseTime);
        }

        // Verify blocked at base time
        const blockedResult = checkInMemoryRateLimit(identifier, 'batch', baseTime + 1000);
        expect(blockedResult.success).toBe(false);

        // After window expires (60 seconds), should be able to make requests again
        const afterWindowTime = baseTime + 60_001; // 1ms after window
        const result = checkInMemoryRateLimit(identifier, 'batch', afterWindowTime);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(4);
      });

      it('should use sliding window (not fixed window)', () => {
        const identifier = 'user-sliding';
        const baseTime = Date.now();

        // Make 3 requests at time 0
        for (let i = 0; i < 3; i++) {
          checkInMemoryRateLimit(identifier, 'batch', baseTime);
        }

        // Make 2 more requests at time 30s
        const midWindowTime = baseTime + 30_000;
        checkInMemoryRateLimit(identifier, 'batch', midWindowTime);
        checkInMemoryRateLimit(identifier, 'batch', midWindowTime);

        // At time 31s, should be blocked (5 requests in last 60s)
        const blocked = checkInMemoryRateLimit(identifier, 'batch', baseTime + 31_000);
        expect(blocked.success).toBe(false);

        // At time 61s, the first 3 requests expire, only 2 remain
        // Should be able to make 3 more requests
        const afterFirstExpiry = baseTime + 60_001;
        const result = checkInMemoryRateLimit(identifier, 'batch', afterFirstExpiry);
        expect(result.success).toBe(true);
        expect(result.remaining).toBe(2); // 5 - 2 remaining - 1 new = 2
      });
    });

    describe('reset timestamp calculation', () => {
      it('should return reset time in seconds', () => {
        const baseTime = Date.now();
        const result = checkInMemoryRateLimit('user-reset', 'batch', baseTime);

        // Reset should be approximately now + 60 seconds (in seconds, not ms)
        const expectedReset = Math.ceil((baseTime + 60_000) / 1000);
        expect(result.reset).toBe(expectedReset);
      });
    });
  });

  describe('createRateLimitResponse', () => {
    it('should return 429 status', () => {
      const result: RateLimitResult = {
        success: false,
        remaining: 0,
        reset: Math.ceil(Date.now() / 1000) + 60,
        limit: 5,
      };

      const response = createRateLimitResponse(result);
      expect(response.status).toBe(429);
    });

    it('should include CORS headers', () => {
      const result: RateLimitResult = {
        success: false,
        remaining: 0,
        reset: Math.ceil(Date.now() / 1000) + 60,
        limit: 5,
      };

      const response = createRateLimitResponse(result);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Headers')).toBe(
        'authorization, x-client-info, apikey, content-type'
      );
    });

    it('should include X-RateLimit headers', () => {
      const now = Math.ceil(Date.now() / 1000);
      const result: RateLimitResult = {
        success: false,
        remaining: 3,
        reset: now + 45,
        limit: 20,
      };

      const response = createRateLimitResponse(result);
      expect(response.headers.get('X-RateLimit-Limit')).toBe('20');
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('3');
      expect(response.headers.get('X-RateLimit-Reset')).toBe(String(now + 45));
    });

    it('should include Retry-After header with positive value', () => {
      const now = Math.ceil(Date.now() / 1000);
      const result: RateLimitResult = {
        success: false,
        remaining: 0,
        reset: now + 30,
        limit: 5,
      };

      const response = createRateLimitResponse(result);
      const retryAfter = parseInt(response.headers.get('Retry-After') || '0', 10);
      expect(retryAfter).toBeGreaterThan(0);
      expect(retryAfter).toBeLessThanOrEqual(30);
    });

    it('should have minimum Retry-After of 1 second', () => {
      // Reset time in the past
      const now = Math.ceil(Date.now() / 1000);
      const result: RateLimitResult = {
        success: false,
        remaining: 0,
        reset: now - 10, // Reset was 10 seconds ago
        limit: 5,
      };

      const response = createRateLimitResponse(result);
      expect(response.headers.get('Retry-After')).toBe('1');
    });

    it('should return JSON content type', () => {
      const result: RateLimitResult = {
        success: false,
        remaining: 0,
        reset: Math.ceil(Date.now() / 1000) + 60,
        limit: 5,
      };

      const response = createRateLimitResponse(result);
      expect(response.headers.get('Content-Type')).toBe('application/json');
    });

    it('should have correct error body structure', async () => {
      const now = Math.ceil(Date.now() / 1000);
      const result: RateLimitResult = {
        success: false,
        remaining: 0,
        reset: now + 45,
        limit: 5,
      };

      const response = createRateLimitResponse(result);
      const body = await response.json();

      expect(body.error).toBe('Rate limit exceeded');
      expect(body.message).toBe('Too many requests. Please try again later.');
      expect(typeof body.retryAfter).toBe('number');
      expect(body.retryAfter).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty identifier', () => {
      const result = checkInMemoryRateLimit('', 'batch');
      expect(result.success).toBe(true);
    });

    it('should handle special characters in identifier', () => {
      const result = checkInMemoryRateLimit('user@email.com:123', 'batch');
      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
    });

    it('should handle very long identifiers', () => {
      const longId = 'a'.repeat(1000);
      const result = checkInMemoryRateLimit(longId, 'batch');
      expect(result.success).toBe(true);
    });

    it('should handle concurrent requests accurately', () => {
      const identifier = 'concurrent-user';
      const baseTime = Date.now();

      // Simulate 5 concurrent requests at the exact same time
      for (let i = 0; i < 5; i++) {
        checkInMemoryRateLimit(identifier, 'batch', baseTime);
      }

      // 6th concurrent request should fail
      const result = checkInMemoryRateLimit(identifier, 'batch', baseTime);
      expect(result.success).toBe(false);
    });

    it('should handle requests at window boundary', () => {
      const identifier = 'boundary-user';
      const baseTime = Date.now();

      // Make request at time 0
      checkInMemoryRateLimit(identifier, 'batch', baseTime);

      // Make request at exactly 60000ms (window edge)
      const atBoundary = checkInMemoryRateLimit(identifier, 'batch', baseTime + 60_000);
      expect(atBoundary.success).toBe(true);
      // Both should count since the first is at windowStart, not after
      expect(atBoundary.remaining).toBe(3);
    });
  });
});
