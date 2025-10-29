---
title: Property Visualization Caching Strategy
type: decision
status: decided
phase_id: PHASE-1
tags:
  - decision
  - performance
  - decided
  - caching
  - optimization
  - phase/phase-1
  - type/implementation
  - status/in-progress
priority: high
visual:
  icon: ⚖️
  color: '#A855F7'
  cssclasses:
    - type-decision
    - status-decided
    - priority-high
updated: '2025-10-29T04:55:04.895Z'
version: '3.0'
keywords:
  - question
  - context
  - options evaluated
  - a. no caching (baseline)
  - b. single-layer in-memory lru cache
  - 'c. multi-layer: lru → redis → sqlite shadow cache ✅ chosen'
  - d. cdn-based caching with pre-generated graphs
  - e. incremental graph updates with differential caching
  - research summary
  - decision rationale
---

# TS-010: Property Visualization Caching Strategy

**Status**: ✅ DECIDED
**Decision**: **Option C - Multi-Layer Caching (LRU → Redis → SQLite)** selected for PropertyVisualizer performance optimization.

---

## Question

How should we cache property visualization data to meet the < 5 second rendering target for large vaults (1000+ notes) while maintaining data consistency and minimizing memory usage?

---

## Context

The PropertyVisualizer component renders interactive graph visualizations of property relationships across all vault notes. Initial implementation without caching faces severe performance challenges:

- **Cold Start Problem**: Loading 1000+ notes via REST API takes 15-30 seconds (unacceptable UX)
- **Memory Constraints**: In-memory graph with full note content exceeds 500MB RAM (not scalable)
- **API Rate Limiting**: Obsidian Local REST API can handle ~20 requests/second (50+ seconds for 1000 notes)
- **Cache Invalidation**: Property changes must propagate to visualizations within seconds

**Why This Matters**:
- **User Experience**: Visualizations are core feature; 15-30s load time causes user abandonment
- **Scalability**: Large vaults (academic research, long-term journaling) are primary use case
- **Resource Efficiency**: Excessive memory/API usage degrades overall system performance
- **Real-Time Updates**: Property changes should reflect in visualizations without full refresh

**Current Situation**: Initial implementation loads all notes on every render (15-30s for 1000 notes).

**Constraints**:
- Performance target: < 5 seconds total rendering time (including data fetch)
- Must handle vaults with 1000-10,000 notes
- Memory limit: < 200MB for visualization data structures
- Cache must invalidate within 2 seconds of property changes
- Must integrate with ObsidianAPIClient singleton (connection pooling)

---

## Options Evaluated

### A. No Caching (Baseline)

Load all note data from Obsidian REST API on every visualization render.

**Implementation Approach**:
```python
class PropertyVisualizer:
    def render(self):
        notes = self.client.get_all_notes()  # 15-30s for 1000 notes
        graph = self.build_graph(notes)
        return self.serialize_graph(graph)
```

**Pros**:
- **Always Fresh**: No cache invalidation complexity (data always current)
- **Zero Memory Overhead**: No cache storage (only transient graph data)
- **Simple Implementation**: Straightforward load-process-render pipeline

**Cons**:
- **Terrible Performance**: 15-30s load time destroys user experience
- **API Overload**: 1000+ requests overwhelm REST API (rate limiting kicks in)
- **Wasted Bandwidth**: Re-fetching unchanged notes on every render
- **Not Viable**: Fundamentally fails to meet < 5s performance target

**Complexity**: Low (no caching logic)
**Cost**: High (user abandonment from poor performance)
**Risk**: Critical (cannot ship product with this performance)

---

### B. Single-Layer In-Memory LRU Cache

Cache recently accessed notes in memory using Python's `functools.lru_cache`.

**Implementation Approach**:
```python
from functools import lru_cache

class PropertyVisualizer:
    @lru_cache(maxsize=256)
    def get_note_cached(self, note_path: str):
        return self.client.get_note(note_path)

    def render(self):
        notes = [self.get_note_cached(path) for path in self.get_all_paths()]
        graph = self.build_graph(notes)
        return self.serialize_graph(graph)
```

**Pros**:
- **Fast Hits**: O(1) lookup for cached notes (< 1ms)
- **Simple Implementation**: Single decorator, minimal code
- **Automatic Eviction**: LRU policy manages memory automatically

**Cons**:
- **Cold Start Problem**: First render still takes 15-30s (empty cache)
- **Memory Pressure**: 256 notes × 50KB average = 12.8MB (manageable but limited)
- **Volatile**: Cache lost on process restart (poor experience after updates/crashes)
- **No Invalidation**: Stale data until cache expires (TTL workaround is complex)
- **Limited Scope**: Cannot cache entire vault (10,000 notes × 50KB = 500MB exceeds memory limit)

**Complexity**: Low (built-in decorator)
**Cost**: Medium (partial improvement, doesn't solve cold start)
**Risk**: Medium (insufficient for large vaults, no persistence)

---

### C. Multi-Layer: LRU → Redis → SQLite Shadow Cache ✅ CHOSEN

Hierarchical caching with three layers optimized for different access patterns.

**Implementation Approach**:
```python
from functools import lru_cache
import redis
import sqlite3

class MultiLayerCache:
    def __init__(self):
        # Layer 1: LRU (hot data, 256 notes)
        self.lru_cache = lru_cache(maxsize=256)

        # Layer 2: Redis (warm data, 2000 notes, shared across processes)
        self.redis = redis.Redis(host='localhost', port=6379, db=0)

        # Layer 3: SQLite shadow cache (cold data, entire vault, persistent)
        self.db = sqlite3.connect('cache.db')
        self.init_shadow_cache()

    def get_note(self, note_path: str):
        # Layer 1: Check LRU
        if note_path in self.lru_cache:
            return self.lru_cache[note_path]

        # Layer 2: Check Redis
        cached = self.redis.get(f'note:{note_path}')
        if cached:
            data = json.loads(cached)
            self.lru_cache[note_path] = data  # Promote to LRU
            return data

        # Layer 3: Check SQLite
        cursor = self.db.execute(
            'SELECT content FROM notes WHERE path = ?',
            (note_path,)
        )
        row = cursor.fetchone()
        if row:
            data = json.loads(row[0])
            self.redis.setex(f'note:{note_path}', 3600, json.dumps(data))  # Promote to Redis
            self.lru_cache[note_path] = data  # Promote to LRU
            return data

        # Cache miss: Fetch from API
        data = self.client.get_note(note_path)
        self.set_note(note_path, data)
        return data

    def invalidate(self, note_path: str):
        # Invalidate all layers
        if note_path in self.lru_cache:
            del self.lru_cache[note_path]
        self.redis.delete(f'note:{note_path}')
        self.db.execute('DELETE FROM notes WHERE path = ?', (note_path,))
```

**Pros**:
- **Sub-Second Performance**: LRU layer delivers < 1ms for hot data (80%+ hit rate)
- **Cold Start Acceleration**: SQLite shadow cache pre-populates on startup (5s vs 30s)
- **Persistent**: SQLite survives process restarts (great UX after updates)
- **Scalable**: Can cache entire vault (10,000 notes) without memory pressure
- **Shared State**: Redis enables cache sharing across processes (future multi-worker)
- **Tiered Eviction**: LRU → Redis → SQLite manages memory/speed trade-off automatically

**Cons**:
- **Complexity**: Three cache layers to coordinate, debug, and monitor
- **External Dependencies**: Requires Redis server (Docker deployment)
- **Cache Invalidation**: Must invalidate all three layers on property changes (coordination overhead)
- **Disk I/O**: SQLite adds 5-10ms latency vs pure in-memory (acceptable for cold data)
- **Synchronization**: Redis/SQLite must stay consistent (race conditions possible)

**Complexity**: High (three-layer coordination, invalidation logic)
**Cost**: Medium (Redis Docker container: ~50MB RAM, SQLite: ~100MB disk)
**Risk**: Low (well-tested pattern, each layer has fallback)

---

### D. CDN-Based Caching with Pre-Generated Graphs

Pre-generate visualization graphs offline and serve from CDN as static JSON.

**Implementation Approach**:
```python
# Offline pre-generation (runs on file change hook)
class GraphPreGenerator:
    def generate_all_graphs(self):
        graphs = {}
        for view_type in ['property-network', 'tag-hierarchy', 'link-graph']:
            graph = self.build_graph(view_type)
            graphs[view_type] = graph

        # Upload to CDN
        for view_type, graph in graphs.items():
            self.cdn.upload(f'graphs/{view_type}.json', json.dumps(graph))

# Client-side (instant load)
class PropertyVisualizer:
    def render(self, view_type):
        graph = self.cdn.fetch(f'graphs/{view_type}.json')  # < 100ms via CDN
        return self.render_graph(graph)
```

**Pros**:
- **Blazing Fast**: CDN serves static JSON in < 100ms globally
- **Zero Server Load**: No API calls, no caching logic on server
- **Infinite Scale**: CDN handles millions of requests without server involvement

**Cons**:
- **Stale Data**: Graphs only update on file change hook (eventual consistency)
- **Pre-Generation Overhead**: Must regenerate all graph types on every change (expensive)
- **No Interactivity**: Cannot support dynamic filters/queries (requires server-side logic)
- **Storage Costs**: CDN storage for large graphs (10MB+ for complex vaults)
- **Limited Flexibility**: Adding new visualization types requires full regeneration pipeline

**Complexity**: High (CDN integration, pre-generation pipeline, cache invalidation)
**Cost**: High (CDN storage/bandwidth costs, pre-generation compute)
**Risk**: Medium (eventual consistency may confuse users, expensive for frequent changes)

---

### E. Incremental Graph Updates with Differential Caching

Cache full graph and apply differential updates when properties change (avoid full rebuild).

**Implementation Approach**:
```python
class IncrementalGraphCache:
    def __init__(self):
        self.graph = None  # Full cached graph
        self.changelog = []  # Property change events

    def update(self, change_event):
        if self.graph is None:
            self.graph = self.build_full_graph()  # Initial build
        else:
            # Apply incremental update
            self.apply_change(self.graph, change_event)
        self.changelog.append(change_event)

    def apply_change(self, graph, change):
        # Update only affected nodes/edges
        if change['type'] == 'property_update':
            node = graph.nodes[change['note_path']]
            node.properties[change['property']] = change['new_value']
            self.recalculate_edges(node)
```

**Pros**:
- **Fast Updates**: Only processes changed notes (< 100ms for single property change)
- **Always Current**: Graph stays in sync with vault (no stale data)
- **Memory Efficient**: Single graph instance, no redundant caching

**Cons**:
- **Complex Logic**: Differential updates are error-prone (graph corruption risk)
- **Initial Build**: Still requires full graph build on cold start (15-30s)
- **State Management**: Changelog must be persisted and replayed reliably
- **Testing Difficulty**: Incremental updates hard to validate (integration tests complex)

**Complexity**: Very High (differential algorithms, state management, testing)
**Cost**: Medium (similar memory to single-layer cache)
**Risk**: High (bugs in incremental logic cause silent graph corruption)

---

## Research Summary

Research focused on caching patterns for large-scale data visualization, graph database performance, and multi-layer cache architectures (inspired by CPU L1/L2/L3 caches).

**Sources Consulted**:
- `/home/aepod/dev/weave-nn/docs/architecture-analysis.md` (Section: Caching & Performance Optimization)
- `/home/aepod/dev/weave-nn/docs/research-findings.md` (Performance benchmarks for LRU, Redis, SQLite)
- Redis documentation (persistence, eviction policies, performance characteristics)
- SQLite performance tuning (indexes, write-ahead logging, PRAGMA optimizations)
- CPU cache hierarchy design (L1/L2/L3 patterns applied to application caching)

**Key Insights**:
- **80/20 Rule**: 80% of graph queries access 20% of notes (LRU layer captures this perfectly)
- **Cold Start Dominance**: First render dominates user experience; SQLite shadow cache essential
- **Redis Sweet Spot**: 2000-note Redis cache balances memory (100MB) and hit rate (95%+)
- **SQLite Performance**: Modern SQLite with proper indexes matches Redis for read-heavy workloads
- **Layered Invalidation**: Coordinated invalidation across layers is manageable with event-driven architecture

---

## Decision Rationale

**Chosen**: **Option C - Multi-Layer Caching (LRU → Redis → SQLite)**

### Key Reasoning:

1. **Meets Performance Target**: Multi-layer cache reduces cold start from 30s → 5s (SQLite pre-population) and hot renders to < 1s (LRU hits). This meets < 5s total rendering target while delivering sub-second experience for repeat views.

2. **Scalability Across Vault Sizes**: SQLite shadow cache handles 10,000+ notes without memory pressure. LRU layer (256 notes) captures hot data. Redis layer (2000 notes) bridges the gap. This architecture scales from small personal vaults to massive academic collections.

3. **Persistent Performance**: SQLite persistence eliminates cold start penalty after process restarts (common during development, updates). This dramatically improves developer experience and user satisfaction after updates.

4. **Future-Proof Architecture**: Redis layer enables future multi-worker scaling (shared cache). SQLite provides foundation for offline mode. Event-driven invalidation (from TS-009) integrates seamlessly.

### Quote from Decision Maker:
> "The multi-layer cache is essential to hit our < 5s performance target. The cold start problem is existential—users will abandon the product if their first visualization takes 30 seconds. SQLite shadow cache solves this by pre-populating on startup. Yes, it's complex, but each layer serves a distinct purpose: LRU for speed, Redis for scale, SQLite for persistence. This architecture future-proofs us for offline mode, multi-worker deployment, and million-note vaults."

### Trade-offs Accepted:
- We accept **implementation complexity** (three cache layers) in exchange for **< 5s cold start** and **< 1s hot renders**
- We accept **Redis dependency** (Docker deployment) because **95%+ cache hit rate** with **100MB memory** is worth operational overhead
- We accept **cache invalidation coordination** because **event-driven architecture** (from TS-009) provides reliable invalidation mechanism

---

## Impact on Other Decisions

### Directly Impacts:
- [[../implementation/property-visualizer.md]] - Defines data loading strategy for all visualizations
- [[../performance/cold-start-optimization.md]] - SQLite shadow cache eliminates 30s cold start penalty
- [[../infrastructure/redis-deployment.md]] - Requires Redis server setup and configuration
- [[../api-design/cache-invalidation.md]] - Event-driven invalidation (from TS-009) triggers cache updates

### Indirectly Impacts:
- [[../features/offline-mode.md]] - SQLite cache provides foundation for offline visualization
- [[../scalability/multi-worker-deployment.md]] - Redis shared cache enables horizontal scaling
- [[../monitoring/cache-metrics.md]] - Must track hit rates, latency across all three layers

### Blocks:
- None (caching is self-contained performance optimization)

### Unblocks:
- [[../features/large-vault-support.md]] - Can now support 10,000+ note vaults
- [[../features/real-time-updates.md]] - Fast cache invalidation enables near-real-time visualization updates
- [[../performance/benchmarking.md]] - Can now measure performance at scale

### Architecture Implications:
Multi-layer caching establishes a **hierarchical storage pattern** inspired by CPU cache design:

```
Query
  ↓
L1 Cache (LRU, 256 notes, < 1ms) ──┐ Hit: Return
  ↓ Miss                             │
L2 Cache (Redis, 2000 notes, ~5ms) ─┤ Hit: Promote to L1, Return
  ↓ Miss                             │
L3 Cache (SQLite, 10k notes, ~10ms)─┤ Hit: Promote to L2→L1, Return
  ↓ Miss                             │
API Call (REST, 50-100ms) ──────────┘ Store in L3→L2→L1, Return
```

**Cache Promotion**: Cache hits promote data to faster layers (SQLite → Redis → LRU). This automatically optimizes for access patterns.

**Invalidation Flow**:
```
Property Change Event (RabbitMQ)
  ↓
Invalidate L1 (LRU) ───┐
Invalidate L2 (Redis) ─┤ Coordinated via event handler
Invalidate L3 (SQLite)─┘
  ↓
Next query rebuilds from API
```

---

## Implementation Plan

1. **Phase 1 - SQLite Shadow Cache (Day 1)**:
   - Create SQLite database schema (notes table with path, content, properties, timestamp)
   - Implement background pre-population (load all notes on startup)
   - Add indexes for fast lookups (path, property queries)
   - PRAGMA optimizations (WAL mode, temp_store=MEMORY, synchronous=NORMAL)

2. **Phase 2 - Redis Layer (Day 2)**:
   - Docker Compose configuration for Redis server
   - Implement Redis cache wrapper (get/set/delete with TTL)
   - Cache promotion logic (SQLite → Redis on cache hit)
   - Redis eviction policy configuration (LRU, maxmemory 100MB)

3. **Phase 3 - LRU Integration (Day 3)**:
   - Wrap existing LRU cache with multi-layer lookup
   - Implement cache promotion (Redis → LRU, SQLite → Redis → LRU)
   - Add metrics tracking (hit rate per layer, latency, memory usage)

4. **Phase 4 - Invalidation Logic (Day 4)**:
   - Subscribe to property change events (RabbitMQ from TS-009)
   - Implement coordinated invalidation across all three layers
   - Add partial invalidation (single note vs full graph)
   - Testing with rapid-fire property changes (stress test)

5. **Phase 5 - Monitoring & Optimization (Day 5)**:
   - Grafana dashboards for cache metrics (hit rate, latency, memory)
   - Performance benchmarks (cold start, hot renders, invalidation latency)
   - Tune cache sizes (LRU maxsize, Redis maxmemory, SQLite PRAGMA)

**Timeline**: 5 days (aligned with Day 3 implementation plan)
**Resources Needed**:
- Backend developer (cache implementation, invalidation logic)
- Performance engineer (benchmarking, tuning)
- DevOps engineer (Redis/SQLite deployment, monitoring)
- Redis server (Docker: ~50MB RAM)
- SQLite database (~100MB disk for 1000 notes)

---

## Success Criteria

- [ ] Cold start < 5 seconds (SQLite pre-population validated)
- [ ] Hot render < 1 second (LRU layer hit rate > 80%)
- [ ] Cache hit rate > 95% overall (measured across all layers)
- [ ] Memory usage < 200MB for visualization data structures
- [ ] Cache invalidation latency < 2 seconds (property change → visualization update)
- [ ] Scales to 10,000+ notes without performance degradation
- [ ] Grafana dashboards tracking all cache metrics (hit rate, latency, memory)
- [ ] Zero cache corruption incidents (validated via integration tests)

---

## Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Cache inconsistency across layers | Medium | High | Event-driven invalidation guarantees ordering; integration tests validate consistency |
| SQLite lock contention under writes | Low | Medium | Use WAL mode (concurrent reads); batch writes; monitor lock timeouts |
| Redis memory exhaustion | Low | Medium | Configure LRU eviction policy; monitor memory usage; alert at 80% threshold |
| Cache corruption from bugs | Medium | High | Comprehensive unit/integration tests; cache validation on load; emergency flush mechanism |
| Performance regression from overhead | Low | Medium | Benchmark each layer independently; profile critical path; optimize hot paths |

---





## Related

[[event-driven-architecture]]
## Related

[[singleton-pattern-choice]]
## Related Concepts

- [[../../concepts/performance/multi-layer-caching.md]]
- [[../../concepts/databases/sqlite-performance-tuning.md]]
- [[../../concepts/caching/cache-invalidation-patterns.md]]
- [[../../concepts/architecture/hierarchical-storage.md]]

---

## Open Questions from This Decision

- [[../performance/cache-prewarming.md]] - Should we pre-warm cache on app startup vs lazy loading?
- [[../monitoring/cache-eviction-strategy.md]] - How to detect and handle cache thrashing scenarios?
- [[../features/cache-export-import.md]] - Can users export/import cache for faster vault migration?

---

## Next Steps

1. [ ] Implement SQLite shadow cache with pre-population
2. [ ] Deploy Redis via Docker Compose
3. [ ] Integrate LRU → Redis → SQLite lookup chain
4. [ ] Implement event-driven cache invalidation
5. [ ] Write integration tests (cache consistency, invalidation)
6. [ ] Benchmark cold start and hot render performance
7. [ ] Set up Grafana dashboards for cache metrics
8. [ ] Document cache architecture and tuning guide

---

## Revisit Criteria

- Revisit if **cache hit rate falls below 90%** (indicates poor layer sizing)
- Revisit if **cold start exceeds 5 seconds** consistently (SQLite optimization needed)
- Revisit if **Redis operational overhead** becomes significant (> 4 hours/month)
- Revisit if **cache corruption incidents** exceed 1/month (architecture flaw)
- Scheduled review: 2026-01-22 (3 months post-implementation)

---

**Back to**: [[../INDEX|Decision Hub]] | [[../../README|Main Index]]

---

**Decision History**:
- 2025-10-22: Decision opened during performance optimization analysis
- 2025-10-22: Research completed (cache benchmarks, architecture patterns)
- 2025-10-22: Decision made - Option C (Multi-Layer Caching) selected
- Implementation pending (Day 3-5 of development plan)
