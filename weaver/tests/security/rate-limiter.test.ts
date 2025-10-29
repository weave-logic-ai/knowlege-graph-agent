/**
 * Tests for Rate Limiter
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { RateLimiter } from '../../src/security/rate-limiter.js';

describe('RateLimiter', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
    limiter.registerEndpoint({
      endpoint: 'test',
      maxRequests: 5,
      windowMs: 1000,
    });
  });

  it('should allow requests within limit', async () => {
    for (let i = 0; i < 5; i++) {
      const result = await limiter.checkLimit('user1', 'test');
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    }
  });

  it('should block requests exceeding limit', async () => {
    // Use up all tokens
    for (let i = 0; i < 5; i++) {
      await limiter.checkLimit('user1', 'test');
    }

    // Next request should be blocked
    const result = await limiter.checkLimit('user1', 'test');
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('should track different users separately', async () => {
    // Use up tokens for user1
    for (let i = 0; i < 5; i++) {
      await limiter.checkLimit('user1', 'test');
    }

    // user2 should still have tokens
    const result = await limiter.checkLimit('user2', 'test');
    expect(result.allowed).toBe(true);
  });

  it('should track different endpoints separately', async () => {
    limiter.registerEndpoint({
      endpoint: 'other',
      maxRequests: 10,
      windowMs: 1000,
    });

    // Use up tokens for 'test' endpoint
    for (let i = 0; i < 5; i++) {
      await limiter.checkLimit('user1', 'test');
    }

    // 'other' endpoint should still have tokens
    const result = await limiter.checkLimit('user1', 'other');
    expect(result.allowed).toBe(true);
  });

  it('should refill tokens over time', async () => {
    // Use up all tokens
    for (let i = 0; i < 5; i++) {
      await limiter.checkLimit('user1', 'test');
    }

    // Wait for refill (simulate with delay)
    await new Promise(resolve => setTimeout(resolve, 300));

    // Should have some tokens back
    const result = await limiter.checkLimit('user1', 'test');
    expect(result.allowed).toBe(true);
  });

  it('should provide accurate stats', async () => {
    await limiter.checkLimit('user1', 'test');
    await limiter.checkLimit('user1', 'test');

    const stats = limiter.getStats('user1', 'test');
    expect(stats).toBeTruthy();
    expect(stats!.remaining).toBeLessThan(5);
    expect(stats!.queueLength).toBe(0);
  });

  it('should reset rate limits', async () => {
    // Use up all tokens
    for (let i = 0; i < 5; i++) {
      await limiter.checkLimit('user1', 'test');
    }

    // Reset
    limiter.reset('user1', 'test');

    // Should have full tokens again
    const result = await limiter.checkLimit('user1', 'test');
    expect(result.allowed).toBe(true);
  });
});

describe('RateLimiter with Queue', () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    limiter = new RateLimiter();
    limiter.registerEndpoint({
      endpoint: 'queued',
      maxRequests: 2,
      windowMs: 1000,
      queueEnabled: true,
      maxQueueSize: 5,
    });
  });

  it('should queue requests when limit is reached', async () => {
    // Use up tokens
    await limiter.checkLimit('user1', 'queued');
    await limiter.checkLimit('user1', 'queued');

    // This should queue
    const waitPromise = limiter.waitForSlot('user1', 'queued', 2000);

    // Check queue length
    const stats = limiter.getStats('user1', 'queued');
    expect(stats!.queueLength).toBe(1);

    // Wait should eventually resolve
    await expect(waitPromise).resolves.toBeUndefined();
  });

  it('should reject when queue is full', async () => {
    // Use up tokens
    await limiter.checkLimit('user1', 'queued');
    await limiter.checkLimit('user1', 'queued');

    // Fill up queue
    const queuePromises = [];
    for (let i = 0; i < 5; i++) {
      queuePromises.push(limiter.waitForSlot('user1', 'queued', 5000));
    }

    // Next request should fail
    await expect(
      limiter.waitForSlot('user1', 'queued', 100)
    ).rejects.toThrow('queue is full');
  });

  it('should timeout queued requests', async () => {
    // Use up tokens
    await limiter.checkLimit('user1', 'queued');
    await limiter.checkLimit('user1', 'queued');

    // This should timeout
    await expect(
      limiter.waitForSlot('user1', 'queued', 100)
    ).rejects.toThrow('timeout');
  });
});

describe('RateLimiter Edge Cases', () => {
  it('should handle unregistered endpoints', async () => {
    const limiter = new RateLimiter();

    // Unregistered endpoint should allow unlimited requests
    const result = await limiter.checkLimit('user1', 'unregistered');
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(Infinity);
  });

  it('should handle concurrent requests', async () => {
    const limiter = new RateLimiter();
    limiter.registerEndpoint({
      endpoint: 'concurrent',
      maxRequests: 10,
      windowMs: 1000,
    });

    // Make 20 concurrent requests
    const promises = Array(20).fill(null).map(() =>
      limiter.checkLimit('user1', 'concurrent')
    );

    const results = await Promise.all(promises);

    // Exactly 10 should be allowed
    const allowedCount = results.filter(r => r.allowed).length;
    expect(allowedCount).toBe(10);

    // Exactly 10 should be blocked
    const blockedCount = results.filter(r => !r.allowed).length;
    expect(blockedCount).toBe(10);
  });

  it('should cleanup resources', () => {
    const limiter = new RateLimiter();
    expect(() => limiter.destroy()).not.toThrow();
  });
});
