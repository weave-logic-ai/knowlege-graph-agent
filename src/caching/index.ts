/**
 * Advanced Caching Module
 *
 * Provides configurable caching with multiple eviction policies.
 */

// ============================================================================
// Types
// ============================================================================

export type EvictionPolicy = 'lru' | 'lfu' | 'fifo' | 'ttl';

export interface CacheEntry<T> {
  key: string;
  value: T;
  createdAt: number;
  accessedAt: number;
  accessCount: number;
  ttl?: number;
  size: number;
}

export interface CacheConfig {
  maxSize?: number;
  maxEntries?: number;
  defaultTtl?: number;
  evictionPolicy?: EvictionPolicy;
  enableStats?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  hitRate: number;
  entryCount: number;
  currentSize: number;
  evictions: number;
}

// ============================================================================
// Advanced Cache Implementation
// ============================================================================

export class AdvancedCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private config: Required<CacheConfig>;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    entryCount: 0,
    currentSize: 0,
    evictions: 0,
  };

  constructor(config: CacheConfig = {}) {
    this.config = {
      maxSize: config.maxSize || 100 * 1024 * 1024,
      maxEntries: config.maxEntries || 10000,
      defaultTtl: config.defaultTtl || 3600000,
      evictionPolicy: config.evictionPolicy || 'lru',
      enableStats: config.enableStats ?? true,
    };
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      if (this.config.enableStats) {
        this.stats.misses++;
        this.updateHitRate();
      }
      return undefined;
    }

    if (entry.ttl && Date.now() - entry.createdAt > entry.ttl) {
      this.delete(key);
      if (this.config.enableStats) {
        this.stats.misses++;
        this.updateHitRate();
      }
      return undefined;
    }

    entry.accessedAt = Date.now();
    entry.accessCount++;

    if (this.config.enableStats) {
      this.stats.hits++;
      this.updateHitRate();
    }

    return entry.value;
  }

  set(key: string, value: T, ttl?: number): void {
    const size = this.estimateSize(value);

    while (this.shouldEvict(size)) {
      this.evictOne();
    }

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 1,
      ttl: ttl || this.config.defaultTtl,
      size,
    };

    const existing = this.cache.get(key);
    if (existing) {
      this.stats.currentSize -= existing.size;
    }
    this.stats.currentSize += size;

    this.cache.set(key, entry);
    this.stats.entryCount = this.cache.size;
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.currentSize -= entry.size;
      this.cache.delete(key);
      this.stats.entryCount = this.cache.size;
      return true;
    }
    return false;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.ttl && Date.now() - entry.createdAt > entry.ttl) {
      this.delete(key);
      return false;
    }
    return true;
  }

  clear(): void {
    this.cache.clear();
    this.stats.currentSize = 0;
    this.stats.entryCount = 0;
  }

  getStats(): CacheStats {
    return { ...this.stats };
  }

  keys(): string[] {
    return Array.from(this.cache.keys());
  }

  size(): number {
    return this.cache.size;
  }

  prune(): number {
    let pruned = 0;
    const now = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.ttl && now - entry.createdAt > entry.ttl) {
        this.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  private shouldEvict(newSize: number): boolean {
    if (this.cache.size >= this.config.maxEntries) return true;
    if (this.stats.currentSize + newSize > this.config.maxSize) return true;
    return false;
  }

  private evictOne(): void {
    if (this.cache.size === 0) return;

    let keyToEvict: string | null = null;

    switch (this.config.evictionPolicy) {
      case 'lru':
        keyToEvict = this.findLRU();
        break;
      case 'lfu':
        keyToEvict = this.findLFU();
        break;
      case 'fifo':
        keyToEvict = this.findFIFO();
        break;
      case 'ttl':
        keyToEvict = this.findOldestTTL();
        break;
    }

    if (keyToEvict) {
      this.delete(keyToEvict);
      this.stats.evictions++;
    }
  }

  private findLRU(): string | null {
    let oldest: CacheEntry<T> | null = null;
    let oldestKey: string | null = null;

    for (const [key, entry] of this.cache) {
      if (!oldest || entry.accessedAt < oldest.accessedAt) {
        oldest = entry;
        oldestKey = key;
      }
    }
    return oldestKey;
  }

  private findLFU(): string | null {
    let least: CacheEntry<T> | null = null;
    let leastKey: string | null = null;

    for (const [key, entry] of this.cache) {
      if (!least || entry.accessCount < least.accessCount) {
        least = entry;
        leastKey = key;
      }
    }
    return leastKey;
  }

  private findFIFO(): string | null {
    let oldest: CacheEntry<T> | null = null;
    let oldestKey: string | null = null;

    for (const [key, entry] of this.cache) {
      if (!oldest || entry.createdAt < oldest.createdAt) {
        oldest = entry;
        oldestKey = key;
      }
    }
    return oldestKey;
  }

  private findOldestTTL(): string | null {
    let closest: CacheEntry<T> | null = null;
    let closestKey: string | null = null;
    let closestExpiry = Infinity;
    const now = Date.now();

    for (const [key, entry] of this.cache) {
      if (entry.ttl) {
        const expiry = entry.createdAt + entry.ttl - now;
        if (expiry < closestExpiry) {
          closest = entry;
          closestKey = key;
          closestExpiry = expiry;
        }
      }
    }
    return closestKey || this.findLRU();
  }

  private estimateSize(value: T): number {
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 1024;
    }
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}

export function createAdvancedCache<T = unknown>(config?: CacheConfig): AdvancedCache<T> {
  return new AdvancedCache<T>(config);
}
