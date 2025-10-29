/**
 * Rate Limiter - Token Bucket Algorithm
 *
 * Implements rate limiting to prevent abuse and DoS attacks:
 * - Token bucket algorithm for smooth rate limiting
 * - Per-endpoint and per-IP tracking
 * - Configurable thresholds
 * - Optional request queuing
 * - Graceful degradation
 */

import { z } from 'zod';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface RateLimitConfig {
  endpoint: string;
  maxRequests: number;      // Maximum requests allowed
  windowMs: number;          // Time window in milliseconds
  queueEnabled?: boolean;    // Enable request queuing when limit reached
  maxQueueSize?: number;     // Maximum queue size
  keyGenerator?: (identifier: string) => string; // Custom key generator
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfter?: number;
}

export interface TokenBucket {
  tokens: number;
  lastRefill: number;
  maxTokens: number;
  refillRate: number;  // Tokens per millisecond
  queue: Array<{
    resolve: () => void;
    reject: (error: Error) => void;
    timestamp: number;
  }>;
}

// ============================================================================
// Rate Limit Store
// ============================================================================

/**
 * In-memory store for rate limit tracking
 * In production, use Redis for distributed rate limiting
 */
class RateLimitStore {
  private buckets = new Map<string, TokenBucket>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired buckets every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  get(key: string, config: RateLimitConfig): TokenBucket {
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = this.createBucket(config);
      this.buckets.set(key, bucket);
    }

    return bucket;
  }

  private createBucket(config: RateLimitConfig): TokenBucket {
    return {
      tokens: config.maxRequests,
      lastRefill: Date.now(),
      maxTokens: config.maxRequests,
      refillRate: config.maxRequests / config.windowMs,
      queue: [],
    };
  }

  private cleanup(): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour

    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > maxAge && bucket.queue.length === 0) {
        this.buckets.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.buckets.clear();
  }
}

// ============================================================================
// Rate Limiter Implementation
// ============================================================================

export class RateLimiter {
  private store = new RateLimitStore();
  private configs = new Map<string, RateLimitConfig>();

  /**
   * Register a rate limit configuration for an endpoint
   */
  registerEndpoint(config: RateLimitConfig): void {
    this.configs.set(config.endpoint, {
      queueEnabled: false,
      maxQueueSize: 100,
      ...config,
    });
  }

  /**
   * Check if a request is allowed
   */
  async checkLimit(
    identifier: string,
    endpoint: string
  ): Promise<RateLimitResult> {
    const config = this.configs.get(endpoint);

    if (!config) {
      // No rate limit configured for this endpoint
      return {
        allowed: true,
        remaining: Infinity,
        resetAt: 0,
      };
    }

    const key = this.generateKey(identifier, endpoint, config);
    const bucket = this.store.get(key, config);

    // Refill tokens based on time elapsed
    this.refillTokens(bucket, config);

    if (bucket.tokens >= 1) {
      // Request allowed
      bucket.tokens -= 1;

      return {
        allowed: true,
        remaining: Math.floor(bucket.tokens),
        resetAt: this.calculateResetTime(bucket, config),
      };
    }

    // Request denied
    return {
      allowed: false,
      remaining: 0,
      resetAt: this.calculateResetTime(bucket, config),
      retryAfter: Math.ceil((1 - bucket.tokens) / bucket.refillRate),
    };
  }

  /**
   * Wait for a slot to become available (with queuing)
   */
  async waitForSlot(
    identifier: string,
    endpoint: string,
    timeoutMs = 30000
  ): Promise<void> {
    const config = this.configs.get(endpoint);

    if (!config || !config.queueEnabled) {
      const result = await this.checkLimit(identifier, endpoint);
      if (!result.allowed) {
        throw new Error('Rate limit exceeded and queuing is disabled');
      }
      return;
    }

    const key = this.generateKey(identifier, endpoint, config);
    const bucket = this.store.get(key, config);

    // Check if queue is full
    if (bucket.queue.length >= (config.maxQueueSize || 100)) {
      throw new Error('Rate limit queue is full');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        // Remove from queue
        const index = bucket.queue.findIndex(item => item.resolve === resolve);
        if (index !== -1) {
          bucket.queue.splice(index, 1);
        }
        reject(new Error('Rate limit queue timeout'));
      }, timeoutMs);

      bucket.queue.push({
        resolve: () => {
          clearTimeout(timeout);
          resolve();
        },
        reject: (error: Error) => {
          clearTimeout(timeout);
          reject(error);
        },
        timestamp: Date.now(),
      });

      // Try to process queue
      this.processQueue(bucket, config);
    });
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refillTokens(bucket: TokenBucket, config: RateLimitConfig): void {
    const now = Date.now();
    const elapsed = now - bucket.lastRefill;
    const tokensToAdd = elapsed * bucket.refillRate;

    bucket.tokens = Math.min(
      bucket.maxTokens,
      bucket.tokens + tokensToAdd
    );
    bucket.lastRefill = now;
  }

  /**
   * Process queued requests
   */
  private processQueue(bucket: TokenBucket, config: RateLimitConfig): void {
    this.refillTokens(bucket, config);

    while (bucket.queue.length > 0 && bucket.tokens >= 1) {
      const item = bucket.queue.shift();
      if (item) {
        bucket.tokens -= 1;
        item.resolve();
      }
    }

    // Schedule next processing if queue not empty
    if (bucket.queue.length > 0) {
      const nextRefillTime = Math.ceil((1 - bucket.tokens) / bucket.refillRate);
      setTimeout(() => {
        this.processQueue(bucket, config);
      }, nextRefillTime);
    }
  }

  /**
   * Calculate when the rate limit will reset
   */
  private calculateResetTime(bucket: TokenBucket, config: RateLimitConfig): number {
    const tokensNeeded = bucket.maxTokens - bucket.tokens;
    const timeNeeded = tokensNeeded / bucket.refillRate;
    return bucket.lastRefill + timeNeeded;
  }

  /**
   * Generate a unique key for rate limiting
   */
  private generateKey(
    identifier: string,
    endpoint: string,
    config: RateLimitConfig
  ): string {
    if (config.keyGenerator) {
      return config.keyGenerator(identifier);
    }
    return `${endpoint}:${identifier}`;
  }

  /**
   * Reset rate limit for a specific identifier and endpoint
   */
  reset(identifier: string, endpoint: string): void {
    const config = this.configs.get(endpoint);
    if (!config) return;

    const key = this.generateKey(identifier, endpoint, config);
    const bucket = this.store.get(key, config);

    bucket.tokens = bucket.maxTokens;
    bucket.lastRefill = Date.now();

    // Reject all queued requests
    while (bucket.queue.length > 0) {
      const item = bucket.queue.shift();
      if (item) {
        item.reject(new Error('Rate limit reset'));
      }
    }
  }

  /**
   * Get current stats for an identifier and endpoint
   */
  getStats(identifier: string, endpoint: string): {
    remaining: number;
    queueLength: number;
    resetAt: number;
  } | null {
    const config = this.configs.get(endpoint);
    if (!config) return null;

    const key = this.generateKey(identifier, endpoint, config);
    const bucket = this.store.get(key, config);

    this.refillTokens(bucket, config);

    return {
      remaining: Math.floor(bucket.tokens),
      queueLength: bucket.queue.length,
      resetAt: this.calculateResetTime(bucket, config),
    };
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.store.destroy();
    this.configs.clear();
  }
}

// ============================================================================
// Default Rate Limit Configurations
// ============================================================================

export const DEFAULT_RATE_LIMITS: Record<string, RateLimitConfig> = {
  // API routes
  'api': {
    endpoint: 'api',
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    queueEnabled: true,
  },

  // Workflow execution
  'workflow': {
    endpoint: 'workflow',
    maxRequests: 10,
    windowMs: 60 * 1000, // 1 minute
    queueEnabled: true,
    maxQueueSize: 50,
  },

  // MCP tools
  'mcp': {
    endpoint: 'mcp',
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    queueEnabled: false,
  },

  // Authentication
  'auth': {
    endpoint: 'auth',
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    queueEnabled: false,
  },

  // File operations
  'file': {
    endpoint: 'file',
    maxRequests: 50,
    windowMs: 60 * 1000, // 1 minute
    queueEnabled: true,
  },

  // Heavy operations (embeddings, AI)
  'heavy': {
    endpoint: 'heavy',
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
    queueEnabled: true,
    maxQueueSize: 10,
  },
};

// ============================================================================
// Singleton Instance
// ============================================================================

let globalRateLimiter: RateLimiter | null = null;

/**
 * Get or create the global rate limiter instance
 */
export function getRateLimiter(): RateLimiter {
  if (!globalRateLimiter) {
    globalRateLimiter = new RateLimiter();

    // Register default rate limits
    Object.values(DEFAULT_RATE_LIMITS).forEach(config => {
      globalRateLimiter!.registerEndpoint(config);
    });
  }

  return globalRateLimiter;
}

/**
 * Destroy the global rate limiter instance
 */
export function destroyRateLimiter(): void {
  if (globalRateLimiter) {
    globalRateLimiter.destroy();
    globalRateLimiter = null;
  }
}
