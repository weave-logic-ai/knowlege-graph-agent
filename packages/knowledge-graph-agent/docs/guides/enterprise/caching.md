---
title: Cache Configuration
description: Guide to configuring caching for optimal performance
category: guides/enterprise
---

# Cache Configuration

## Overview

The knowledge-graph-agent includes an advanced caching system supporting multiple eviction policies and tag-based invalidation. Proper cache configuration significantly improves query performance and reduces database load.

## Prerequisites

- Node.js >= 20.0.0
- @weavelogic/knowledge-graph-agent installed

## Quick Start

```typescript
import { createCache } from '@weavelogic/knowledge-graph-agent';

const cache = createCache({
  strategy: 'lru',
  maxSize: 1000,
  ttl: 3600000, // 1 hour
});

// Use with knowledge graph
const graph = createKnowledgeGraph('myproject', '/path', {
  cache: cache,
});
```

## Eviction Policies

### LRU (Least Recently Used)

Evicts items that haven't been accessed recently.

**Best for**: General-purpose caching, read-heavy workloads

```typescript
const cache = createCache({
  strategy: 'lru',
  maxSize: 1000,
});
```

### LFU (Least Frequently Used)

Evicts items accessed least often.

**Best for**: Skewed access patterns, hot data caching

```typescript
const cache = createCache({
  strategy: 'lfu',
  maxSize: 1000,
  decayFactor: 0.5, // Frequency decay over time
});
```

### FIFO (First In, First Out)

Evicts oldest items regardless of access pattern.

**Best for**: Time-sensitive data, simple predictable behavior

```typescript
const cache = createCache({
  strategy: 'fifo',
  maxSize: 1000,
});
```

### TTL (Time To Live)

Evicts items after a specified duration.

**Best for**: Data freshness requirements, external data sync

```typescript
const cache = createCache({
  strategy: 'ttl',
  defaultTTL: 3600000, // 1 hour
  maxSize: 5000,
});
```

## Configuration Options

```typescript
interface CacheConfig {
  // Strategy
  strategy: 'lru' | 'lfu' | 'fifo' | 'ttl';

  // Capacity
  maxSize: number;           // Maximum entries
  maxMemory?: number;        // Maximum memory in bytes

  // TTL
  defaultTTL?: number;       // Default TTL in ms
  checkPeriod?: number;      // TTL check interval

  // LFU-specific
  decayFactor?: number;      // Frequency decay (0-1)
  decayInterval?: number;    // Decay check interval

  // Tags
  enableTags?: boolean;      // Enable tag-based invalidation

  // Persistence
  persist?: boolean;         // Persist cache to disk
  persistPath?: string;      // Persistence file path

  // Statistics
  enableStats?: boolean;     // Enable hit/miss tracking

  // Events
  onEvict?: (key: string, value: any) => void;
  onExpire?: (key: string, value: any) => void;
}
```

## Cache Operations

### Basic Operations

```typescript
// Set value
cache.set('key', value);
cache.set('key', value, { ttl: 60000 }); // Custom TTL

// Get value
const value = cache.get('key');

// Check existence
const exists = cache.has('key');

// Delete
cache.delete('key');

// Clear all
cache.clear();
```

### Tag-Based Operations

```typescript
// Set with tags
cache.set('node:123', nodeData, { tags: ['nodes', 'project:abc'] });
cache.set('node:456', nodeData, { tags: ['nodes', 'project:abc'] });
cache.set('edge:789', edgeData, { tags: ['edges', 'project:abc'] });

// Invalidate by tag
cache.invalidateByTag('project:abc');  // Removes all 3 items
cache.invalidateByTag('nodes');        // Removes only nodes
```

### Batch Operations

```typescript
// Set multiple
cache.setMany([
  { key: 'a', value: 1 },
  { key: 'b', value: 2 },
  { key: 'c', value: 3 },
]);

// Get multiple
const values = cache.getMany(['a', 'b', 'c']);
// Returns: { a: 1, b: 2, c: 3 }

// Delete multiple
cache.deleteMany(['a', 'b']);
```

## Cache Integration

### With Knowledge Graph

```typescript
import {
  createKnowledgeGraph,
  createCache
} from '@weavelogic/knowledge-graph-agent';

const cache = createCache({
  strategy: 'lru',
  maxSize: 5000,
  enableTags: true,
});

const graph = createKnowledgeGraph('project', '/path', {
  cache,
  cacheOptions: {
    cacheNodes: true,
    cacheSearchResults: true,
    cacheStats: true,
    nodeTTL: 3600000,      // 1 hour for nodes
    searchTTL: 300000,     // 5 min for search results
  },
});

// Cache is automatically used for:
// - Node lookups (getNode)
// - Search results
// - Statistics queries
```

### With GraphQL API

```typescript
import { createGraphQLServer } from '@weavelogic/knowledge-graph-agent';

const server = createGraphQLServer({
  db,
  cache: createCache({
    strategy: 'lru',
    maxSize: 10000,
  }),
  cacheOptions: {
    queryCache: true,
    queryCacheTTL: 60000,
  },
});
```

## Cache Warming

Pre-populate cache on startup:

```typescript
async function warmCache(cache: Cache, db: KnowledgeGraphDatabase) {
  // Warm frequently accessed nodes
  const frequentNodes = await db.getMostAccessedNodes(100);
  for (const node of frequentNodes) {
    cache.set(`node:${node.id}`, node, { tags: ['nodes', 'warm'] });
  }

  // Warm tag index
  const tags = await db.getAllTags();
  cache.set('tags:all', tags, { tags: ['tags'], ttl: 3600000 });

  console.log(`Warmed cache with ${frequentNodes.length} nodes`);
}
```

## Cache Statistics

```typescript
// Enable statistics
const cache = createCache({
  strategy: 'lru',
  maxSize: 1000,
  enableStats: true,
});

// Get statistics
const stats = cache.getStats();
console.log({
  hits: stats.hits,
  misses: stats.misses,
  hitRate: stats.hitRate,        // hits / (hits + misses)
  size: stats.size,              // Current entries
  memoryUsage: stats.memoryUsage,// Estimated memory
  evictions: stats.evictions,    // Total evictions
});

// Reset statistics
cache.resetStats();
```

## CLI Configuration

```bash
# Set cache strategy
kg config set cache.strategy lru

# Set cache size
kg config set cache.maxSize 5000

# Set default TTL (1 hour)
kg config set cache.ttl 3600000

# Enable cache statistics
kg config set cache.enableStats true

# View cache stats
kg diag cache --stats
```

## Performance Tuning

### Size Guidelines

| Use Case | Recommended Size | Strategy |
|----------|------------------|----------|
| Small project (<1K nodes) | 500 | LRU |
| Medium project (1K-10K nodes) | 2000 | LRU |
| Large project (10K+ nodes) | 5000+ | LFU |
| Real-time dashboard | 1000 | TTL (short) |
| API server | 10000 | LRU + TTL |

### Memory Calculation

```typescript
// Estimate memory usage
const estimatedMemory = cache.getStats().memoryUsage;

// Or calculate manually:
// Average node: ~2KB
// 5000 nodes = ~10MB cache memory
```

### Monitoring

```typescript
// Add cache health check
healthMonitor.addCheck({
  name: 'cache-health',
  interval: '5m',
  check: async () => {
    const stats = cache.getStats();
    return {
      healthy: stats.hitRate > 0.8,  // 80%+ hit rate
      metrics: {
        hitRate: stats.hitRate,
        size: stats.size,
        maxSize: cache.maxSize,
      },
    };
  },
});
```

## Distributed Caching

For multi-instance deployments:

```typescript
import { createDistributedCache } from '@weavelogic/knowledge-graph-agent';

const cache = createDistributedCache({
  strategy: 'lru',
  maxSize: 5000,
  redis: {
    host: 'redis.example.com',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
  },
});
```

## Cache Persistence

Persist cache across restarts:

```typescript
const cache = createCache({
  strategy: 'lru',
  maxSize: 1000,
  persist: true,
  persistPath: '.kg/cache.json',
});

// Save cache manually
await cache.persist();

// Load cache on startup (automatic if persist: true)
await cache.load();
```

## Troubleshooting

### Low Hit Rate

1. Increase cache size
2. Analyze access patterns
3. Consider different eviction strategy

```typescript
// Enable access logging
cache.on('miss', (key) => {
  console.log(`Cache miss: ${key}`);
});
```

### High Memory Usage

1. Reduce maxSize
2. Enable memory limit
3. Reduce TTL for large objects

```typescript
const cache = createCache({
  strategy: 'lru',
  maxSize: 1000,
  maxMemory: 50 * 1024 * 1024, // 50MB limit
});
```

### Stale Data

1. Implement proper invalidation
2. Use TTL strategy
3. Add cache warming after updates

```typescript
// Invalidate on update
graph.on('node:update', (node) => {
  cache.delete(`node:${node.id}`);
  cache.invalidateByTag(`search`);
});
```

## Next Steps

- [Health Monitoring](./health-monitoring.md)
- [Backup and Recovery](./backup-recovery.md)
- [Performance Optimization](../../architecture/decisions/ADR-010-performance-optimizations.md)
