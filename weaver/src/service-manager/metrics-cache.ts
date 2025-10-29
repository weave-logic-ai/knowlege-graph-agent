/**
 * Metrics Cache
 * High-performance caching layer for service metrics
 */

import type { ServiceMetrics, ServiceStatus } from './types.js';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
}

/**
 * In-memory cache for metrics and status
 */
export class MetricsCache {
  private metricsCache = new Map<string, CacheEntry<ServiceMetrics>>();
  private statusCache = new Map<string, CacheEntry<ServiceStatus>>();
  private defaultTTL = 1000; // 1 second default TTL
  private statusTTL = 500; // 500ms for status (very fast)

  /**
   * Get cached metrics
   */
  getMetrics(serviceName: string): ServiceMetrics | null {
    const entry = this.metricsCache.get(serviceName);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;

    if (age > entry.ttl) {
      this.metricsCache.delete(serviceName);
      return null;
    }

    return entry.value;
  }

  /**
   * Set cached metrics
   */
  setMetrics(serviceName: string, metrics: ServiceMetrics, ttl?: number): void {
    this.metricsCache.set(serviceName, {
      value: metrics,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  /**
   * Get cached status
   */
  getStatus(serviceName: string): ServiceStatus | null {
    const entry = this.statusCache.get(serviceName);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;

    if (age > entry.ttl) {
      this.statusCache.delete(serviceName);
      return null;
    }

    return entry.value;
  }

  /**
   * Set cached status
   */
  setStatus(serviceName: string, status: ServiceStatus, ttl?: number): void {
    this.statusCache.set(serviceName, {
      value: status,
      timestamp: Date.now(),
      ttl: ttl || this.statusTTL,
    });
  }

  /**
   * Invalidate metrics cache for a service
   */
  invalidateMetrics(serviceName: string): void {
    this.metricsCache.delete(serviceName);
  }

  /**
   * Invalidate status cache for a service
   */
  invalidateStatus(serviceName: string): void {
    this.statusCache.delete(serviceName);
  }

  /**
   * Invalidate all caches for a service
   */
  invalidate(serviceName: string): void {
    this.invalidateMetrics(serviceName);
    this.invalidateStatus(serviceName);
  }

  /**
   * Clear all caches
   */
  clear(): void {
    this.metricsCache.clear();
    this.statusCache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    metricsEntries: number;
    statusEntries: number;
    totalSize: number;
  } {
    return {
      metricsEntries: this.metricsCache.size,
      statusEntries: this.statusCache.size,
      totalSize: this.metricsCache.size + this.statusCache.size,
    };
  }

  /**
   * Cleanup expired entries
   */
  cleanup(): void {
    const now = Date.now();

    // Clean metrics cache
    for (const [key, entry] of this.metricsCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.metricsCache.delete(key);
      }
    }

    // Clean status cache
    for (const [key, entry] of this.statusCache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.statusCache.delete(key);
      }
    }
  }

  /**
   * Start automatic cleanup
   */
  startAutoCleanup(interval = 5000): () => void {
    const timer = setInterval(() => this.cleanup(), interval);
    return () => clearInterval(timer);
  }
}

/**
 * Export singleton instance
 */
export const metricsCache = new MetricsCache();
