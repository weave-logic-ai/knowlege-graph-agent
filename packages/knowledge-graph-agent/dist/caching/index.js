class AdvancedCache {
  cache = /* @__PURE__ */ new Map();
  config;
  stats = {
    hits: 0,
    misses: 0,
    hitRate: 0,
    entryCount: 0,
    currentSize: 0,
    evictions: 0
  };
  constructor(config = {}) {
    this.config = {
      maxSize: config.maxSize || 100 * 1024 * 1024,
      maxEntries: config.maxEntries || 1e4,
      defaultTtl: config.defaultTtl || 36e5,
      evictionPolicy: config.evictionPolicy || "lru",
      enableStats: config.enableStats ?? true
    };
  }
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) {
      if (this.config.enableStats) {
        this.stats.misses++;
        this.updateHitRate();
      }
      return void 0;
    }
    if (entry.ttl && Date.now() - entry.createdAt > entry.ttl) {
      this.delete(key);
      if (this.config.enableStats) {
        this.stats.misses++;
        this.updateHitRate();
      }
      return void 0;
    }
    entry.accessedAt = Date.now();
    entry.accessCount++;
    if (this.config.enableStats) {
      this.stats.hits++;
      this.updateHitRate();
    }
    return entry.value;
  }
  set(key, value, ttl) {
    const size = this.estimateSize(value);
    while (this.shouldEvict(size)) {
      this.evictOne();
    }
    const entry = {
      key,
      value,
      createdAt: Date.now(),
      accessedAt: Date.now(),
      accessCount: 1,
      ttl: ttl || this.config.defaultTtl,
      size
    };
    const existing = this.cache.get(key);
    if (existing) {
      this.stats.currentSize -= existing.size;
    }
    this.stats.currentSize += size;
    this.cache.set(key, entry);
    this.stats.entryCount = this.cache.size;
  }
  delete(key) {
    const entry = this.cache.get(key);
    if (entry) {
      this.stats.currentSize -= entry.size;
      this.cache.delete(key);
      this.stats.entryCount = this.cache.size;
      return true;
    }
    return false;
  }
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (entry.ttl && Date.now() - entry.createdAt > entry.ttl) {
      this.delete(key);
      return false;
    }
    return true;
  }
  clear() {
    this.cache.clear();
    this.stats.currentSize = 0;
    this.stats.entryCount = 0;
  }
  getStats() {
    return { ...this.stats };
  }
  keys() {
    return Array.from(this.cache.keys());
  }
  size() {
    return this.cache.size;
  }
  prune() {
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
  shouldEvict(newSize) {
    if (this.cache.size >= this.config.maxEntries) return true;
    if (this.stats.currentSize + newSize > this.config.maxSize) return true;
    return false;
  }
  evictOne() {
    if (this.cache.size === 0) return;
    let keyToEvict = null;
    switch (this.config.evictionPolicy) {
      case "lru":
        keyToEvict = this.findLRU();
        break;
      case "lfu":
        keyToEvict = this.findLFU();
        break;
      case "fifo":
        keyToEvict = this.findFIFO();
        break;
      case "ttl":
        keyToEvict = this.findOldestTTL();
        break;
    }
    if (keyToEvict) {
      this.delete(keyToEvict);
      this.stats.evictions++;
    }
  }
  findLRU() {
    let oldest = null;
    let oldestKey = null;
    for (const [key, entry] of this.cache) {
      if (!oldest || entry.accessedAt < oldest.accessedAt) {
        oldest = entry;
        oldestKey = key;
      }
    }
    return oldestKey;
  }
  findLFU() {
    let least = null;
    let leastKey = null;
    for (const [key, entry] of this.cache) {
      if (!least || entry.accessCount < least.accessCount) {
        least = entry;
        leastKey = key;
      }
    }
    return leastKey;
  }
  findFIFO() {
    let oldest = null;
    let oldestKey = null;
    for (const [key, entry] of this.cache) {
      if (!oldest || entry.createdAt < oldest.createdAt) {
        oldest = entry;
        oldestKey = key;
      }
    }
    return oldestKey;
  }
  findOldestTTL() {
    let closestKey = null;
    let closestExpiry = Infinity;
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.ttl) {
        const expiry = entry.createdAt + entry.ttl - now;
        if (expiry < closestExpiry) {
          closestKey = key;
          closestExpiry = expiry;
        }
      }
    }
    return closestKey || this.findLRU();
  }
  estimateSize(value) {
    try {
      return JSON.stringify(value).length * 2;
    } catch {
      return 1024;
    }
  }
  updateHitRate() {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }
}
function createAdvancedCache(config) {
  return new AdvancedCache(config);
}
export {
  AdvancedCache,
  createAdvancedCache
};
//# sourceMappingURL=index.js.map
