# Memory Foldable Output Analysis for Weave-NN

**Analysis Date**: 2025-11-01
**Agent**: Memory Systems Specialist (Hive Mind swarm-1762040437289-69qchqiug)
**Context**: DeepAgent Chapter 3 - "How well is it implement memory foldable output"

---

## Executive Summary

This analysis evaluates weave-nn's current memory system against DeepAgent's "foldable output" architecture. **Key Finding**: Weave-NN has robust experience storage and semantic indexing but **lacks hierarchical compression, summarization layers, and adaptive retrieval mechanisms** that define "foldable memory."

**Gap Severity**: **MODERATE-HIGH**

Current system stores full-fidelity experiences without compression, leading to context window bloat in long-running sessions.

---

## 1. Current Weave-NN Memory Analysis

### 1.1 Architecture Overview

Weave-NN implements a **three-tier memory system**:

1. **Claude-Flow Memory Client** (`claude-flow-client.ts`)
   - Key-value store with namespace support
   - TTL-based expiration
   - Batch operations (10-item batches)
   - Pattern search via regex
   - **Storage**: In-memory Map (test) → MCP memory_usage (production)

2. **Experience-Based Learning** (`experience-storage.ts`, `experience-indexer.ts`)
   - SQLite-backed persistent storage
   - Semantic similarity via embeddings (all-MiniLM-L6-v2)
   - Lesson extraction and categorization
   - Domain-specific indexing (chunking, embedding, indexing, reasoning, workflow)

3. **Vault Synchronization** (`vault-sync.ts`)
   - Bidirectional sync with Obsidian vault
   - Conflict resolution (vault-authoritative)
   - Metadata tracking (frontmatter, links, tags)

### 1.2 Capabilities Matrix

| Capability | Status | Implementation |
|-----------|--------|----------------|
| **Persistent Storage** | ✅ Complete | SQLite (experiences) + MCP (sync state) |
| **Semantic Search** | ✅ Complete | Cosine similarity on embeddings |
| **Namespace Isolation** | ✅ Complete | `vault/notes/`, `vault/links/`, etc. |
| **TTL Expiration** | ✅ Complete | Configurable per-entry |
| **Batch Operations** | ✅ Complete | 10-item parallel batches |
| **Conflict Resolution** | ✅ Complete | Vault-wins strategy |
| **Lesson Extraction** | ✅ Complete | Pattern-based categorization |
| **Domain Filtering** | ✅ Complete | Six domains tracked |
| **Hierarchical Compression** | ❌ Missing | **No folding mechanism** |
| **Adaptive Retrieval** | ❌ Partial | Similarity-based, not tiered |
| **Memory Summarization** | ❌ Missing | **No LLM-based summaries** |
| **Hot/Cold Tiering** | ❌ Missing | All data treated equally |
| **Context Window Management** | ❌ Missing | No automatic pruning |

### 1.3 What's Missing vs. DeepAgent

**CRITICAL GAPS**:

1. **No Folding Mechanism**
   - All experiences stored at full fidelity
   - No summarization layer
   - No hierarchical compression (episode → summary → archive)

2. **No Adaptive Retrieval**
   - Retrieves full experiences, not summaries
   - No "unfold on demand" pattern
   - No tiered access (check summary first, fetch details if needed)

3. **No Context Window Optimization**
   - Doesn't track token counts
   - No automatic pruning for long sessions
   - No LRU (Least Recently Used) eviction

4. **No Working Memory Compression**
   - All episodic data treated equally
   - No differentiation between hot (current) and cold (historical) data

---

## 2. What is "Foldable Output"?

### 2.1 Core Concept

**Foldable memory** is a **hierarchical compression system** where detailed memories can be:

1. **Folded** (compressed) into compact summaries when not actively needed
2. **Unfolded** (expanded) to full detail when context requires it
3. **Indexed** via summaries for fast retrieval without loading full data

**Analogy**: Like a file system with thumbnail previews:
- Browse thumbnails (summaries) quickly
- Click to load full image (unfold details) only when needed

### 2.2 Key Properties

| Property | Description | Benefit |
|----------|-------------|---------|
| **Lossy Compression** | Summaries omit fine details | Reduces memory footprint 10-100x |
| **Lossless Archival** | Full data stored in archive tier | Can always recover original |
| **Hierarchical Indexing** | Summaries indexed, not raw data | Faster search (90%+ speedup) |
| **Lazy Loading** | Fetch details only when needed | Minimizes context window usage |
| **Access Pattern Adaptation** | Hot data stays unfolded | Optimizes for common queries |

### 2.3 Compression Ratio Examples

```typescript
// Full Experience (Unfolded)
{
  id: "exp-123",
  task: "Analyze codebase patterns for SOLID violations",
  context: {
    workflowId: "wf-456",
    inputs: { /* 2KB of data */ },
    outputs: { /* 5KB of results */ },
    environment: { /* 1KB of metadata */ }
  },
  plan: "1. Scan for God objects\n2. Check SRP compliance...", // 3KB
  lessons: ["Avoid tight coupling...", "Use dependency injection..."], // 1KB
  metadata: { /* 2KB */ }
}
// Total: ~15KB

// Folded Summary
{
  id: "exp-123",
  summary: "Analyzed codebase for SOLID violations. Found 12 issues. Key lesson: Use DI.",
  domain: "reasoning",
  outcome: "success",
  timestamp: "2025-11-01T10:30:00Z",
  archiveRef: "s3://archive/exp-123.json" // or SQLite blob
}
// Total: ~200 bytes (75x compression)
```

---

## 3. DeepAgent's Three-Tier Memory Architecture

### 3.1 Memory Tiers

DeepAgent uses a **hierarchical three-tier system** inspired by human cognition:

#### **Tier 1: Episodic Memory** (Long-term Archive)
- **What**: High-level task milestones and outcomes
- **Format**: **Folded summaries only**
- **Retention**: Indefinite (years)
- **Access**: Via semantic search on summaries
- **Storage**: Compressed JSONL or database
- **Example**: "2025-10-15: Successfully implemented OAuth2 flow (95% test coverage)"

#### **Tier 2: Working Memory** (Active Session Context)
- **What**: Current sub-goals, obstacles, recent decisions
- **Format**: **Unfolded (full detail)** for active tasks, **folded** for completed sub-tasks
- **Retention**: Session-scoped (minutes to hours)
- **Access**: Direct retrieval, no search needed
- **Storage**: In-memory cache or fast key-value store
- **Example**:
  ```json
  {
    "currentGoal": "Implement rate limiting middleware",
    "obstacles": ["Redis connection timeout on AWS"],
    "recentDecisions": ["Switched from Redis to in-memory LRU"],
    "relatedExperiences": ["exp-oauth2-redis-fail"] // Reference to Tier 1
  }
  ```

#### **Tier 3: Tool Memory** (Invocation History)
- **What**: Tool call patterns, success rates, parameter optimizations
- **Format**: **Highly compressed statistics** + recent calls unfolded
- **Retention**: Per-tool (last 100 calls) + aggregated stats (forever)
- **Access**: Tool-specific lookup
- **Storage**: Time-series database or structured logs
- **Example**:
  ```json
  {
    "tool": "github_create_pr",
    "successRate": 0.94,
    "avgDuration": 2300, // ms
    "lastFailure": {
      "timestamp": "2025-10-30T14:22:00Z",
      "error": "Branch protection requires review",
      "lesson": "Always check branch protection before PR"
    },
    "recentCalls": [ /* Last 10 calls unfolded */ ]
  }
  ```

### 3.2 Folding Strategy Per Tier

| Tier | Folding Trigger | Compression Method | Unfold Trigger |
|------|----------------|-------------------|----------------|
| **Episodic** | Task completion | LLM summarization | Semantic similarity match |
| **Working** | Sub-task completion | JSON diff (keep deltas) | Parent task reactivation |
| **Tool** | After 100 calls | Statistical aggregation | Tool invocation error |

---

## 4. Folding Mechanisms in Detail

### 4.1 Summarization (LLM-Generated Summaries)

**Process**:
1. When experience is "cold" (not accessed in 24h), trigger fold
2. Send full experience to LLM with prompt:
   ```
   Summarize this experience in 1-2 sentences:
   - Task: {task}
   - Outcome: {outcome}
   - Key lessons: {lessons}
   Focus on actionable insights, omit implementation details.
   ```
3. Store summary + archive reference
4. Delete full data from hot tier (keep in archive)

**Example Prompt**:
```typescript
const summary = await llm.complete(`
Summarize this software development experience:

Task: ${experience.task}
Outcome: ${experience.outcome}
Duration: ${experience.duration}ms
Lessons learned:
${experience.lessons.join('\n- ')}

Provide a 1-sentence summary focusing on the key insight.
`);

// Result: "Implemented Redis caching, reducing API latency by 60%. Lesson: Always use connection pooling."
```

### 4.2 Chunking (Group Related Items)

**Strategy**: Group temporally or semantically related experiences into "episodes"

```typescript
interface Episode {
  id: string;
  title: string; // "OAuth2 Implementation Sprint"
  dateRange: { start: Date; end: Date };
  experiences: string[]; // IDs, not full data
  summary: string; // Folded representation
  metadata: {
    tasksCompleted: number;
    successRate: number;
    primaryDomain: ExperienceDomain;
  };
}

// Folding: Replace 50 individual experiences with 1 episode summary
const episode: Episode = {
  id: "ep-oauth2",
  title: "OAuth2 Implementation Sprint",
  dateRange: { start: new Date("2025-10-01"), end: new Date("2025-10-15") },
  experiences: ["exp-1", "exp-2", ..., "exp-50"],
  summary: "Implemented OAuth2 flow with Google/GitHub providers. 47/50 tasks succeeded. Key challenge: Token refresh race conditions solved via mutex.",
  metadata: { tasksCompleted: 50, successRate: 0.94, primaryDomain: "workflow" }
};
```

### 4.3 Hierarchical Storage (Detailed → Summary → Archive)

**Three-Level Hierarchy**:

```
Level 1: Hot Cache (In-Memory)
├── Last 10 experiences (full detail)
└── Current working memory (unfolded)

Level 2: Warm Storage (SQLite/Fast DB)
├── Last 100 experiences (summaries only)
├── Full data for summaries in Level 1
└── Indices for semantic search

Level 3: Cold Archive (Compressed Blobs)
├── All historical experiences (full detail)
├── Compressed with gzip/zstd
└── Retrieved only on explicit "unfold" request
```

**Storage Optimization**:
- **Level 1**: 10 experiences × 15KB = **150KB**
- **Level 2**: 100 summaries × 200 bytes = **20KB**
- **Level 3**: 10,000 experiences × 15KB × 0.3 (compression) = **45MB**

Total active memory: **170KB** (instead of 150MB uncompressed)

### 4.4 Retrieval Optimization

**Two-Phase Retrieval**:

```typescript
// Phase 1: Search summaries (fast, 10-100ms)
const candidates = await searchSummaries(query, { limit: 20 });

// Phase 2: Unfold top matches (slow, 500-1000ms)
const detailed = await Promise.all(
  candidates.slice(0, 3).map(c => unfold(c.id))
);

// Return hybrid result: 3 detailed + 17 summaries
return {
  detailed: detailed,
  summaries: candidates.slice(3)
};
```

**Benefit**: 90%+ reduction in retrieval time for exploratory queries

---

## 5. Practical Implementation for Weave-NN

### 5.1 Type Definitions

```typescript
/**
 * Foldable memory with hierarchical compression
 */
interface FoldableMemory<T = unknown> {
  id: string;
  state: 'folded' | 'unfolded' | 'archived';

  // Summary layer (always present)
  summary: MemorySummary;

  // Full data (null when folded)
  full: T | null;

  // Metadata for management
  metadata: MemoryMetadata;

  // Operations
  fold(): Promise<void>;
  unfold(): Promise<T>;
  retrieve(detail: 'full' | 'summary'): Promise<T | MemorySummary>;
}

interface MemorySummary {
  text: string; // LLM-generated 1-2 sentence summary
  keywords: string[]; // Extracted for search
  domain: ExperienceDomain;
  outcome: ExperienceOutcome;
  timestamp: Date;
  significance: number; // 0-1, how important is this memory?
}

interface MemoryMetadata {
  size: {
    full: number; // bytes
    summary: number; // bytes
    compressionRatio: number; // full / summary
  };
  access: {
    count: number; // How many times retrieved
    lastAccess: Date;
    avgAccessInterval: number; // seconds
  };
  archival: {
    archiveLocation?: string; // S3 URI, file path, or SQLite blob ID
    archivedAt?: Date;
    compressionAlgorithm?: 'gzip' | 'zstd' | 'brotli';
  };
}
```

### 5.2 Core Implementation

```typescript
/**
 * Foldable Experience Storage
 * Extends existing ExperienceStorage with folding capabilities
 */
export class FoldableExperienceStorage extends ExperienceStorage {
  private summaryCache: Map<string, MemorySummary> = new Map();
  private archiveStore: IArchiveStore; // Could be S3, filesystem, or SQLite blobs
  private llmClient: LLMClient; // For summarization

  /**
   * Fold an experience into summary form
   */
  async fold(experienceId: string): Promise<void> {
    // 1. Retrieve full experience
    const experience = await this.retrieve(experienceId);
    if (!experience) throw new Error(`Experience ${experienceId} not found`);

    // 2. Generate summary via LLM
    const summary = await this.generateSummary(experience);

    // 3. Archive full data
    const archiveLocation = await this.archiveStore.store(experienceId, experience);

    // 4. Update database: keep summary, remove full data
    await this.db.run(`
      UPDATE experiences
      SET
        state = 'folded',
        summary_text = ?,
        summary_keywords = ?,
        archive_location = ?,
        archived_at = ?
      WHERE id = ?
    `, [
      summary.text,
      JSON.stringify(summary.keywords),
      archiveLocation,
      new Date().toISOString(),
      experienceId
    ]);

    // 5. Cache summary
    this.summaryCache.set(experienceId, summary);

    logger.info('Experience folded', {
      id: experienceId,
      originalSize: JSON.stringify(experience).length,
      summarySize: summary.text.length,
      compressionRatio: JSON.stringify(experience).length / summary.text.length
    });
  }

  /**
   * Unfold an experience from archive
   */
  async unfold(experienceId: string): Promise<Experience> {
    // 1. Check if already unfolded in hot cache
    const cached = await this.retrieve(experienceId);
    if (cached && cached.state === 'unfolded') {
      return cached;
    }

    // 2. Retrieve archive location
    const row = await this.db.get(
      'SELECT archive_location FROM experiences WHERE id = ?',
      [experienceId]
    );

    if (!row?.archive_location) {
      throw new Error(`No archive found for ${experienceId}`);
    }

    // 3. Fetch from archive
    const experience = await this.archiveStore.retrieve(row.archive_location);

    // 4. Update state to unfolded (cache in hot tier)
    await this.db.run(`
      UPDATE experiences
      SET state = 'unfolded', last_access = ?
      WHERE id = ?
    `, [new Date().toISOString(), experienceId]);

    // 5. Update access metadata
    await this.updateAccessMetrics(experienceId);

    logger.debug('Experience unfolded', { id: experienceId });

    return experience;
  }

  /**
   * Retrieve with adaptive detail level
   */
  async retrieve(
    experienceId: string,
    detail: 'full' | 'summary' = 'summary'
  ): Promise<Experience | MemorySummary> {
    if (detail === 'summary') {
      // Fast path: return summary from cache or DB
      const cached = this.summaryCache.get(experienceId);
      if (cached) return cached;

      const row = await this.db.get(`
        SELECT summary_text, summary_keywords, domain, outcome, timestamp
        FROM experiences WHERE id = ?
      `, [experienceId]);

      return {
        text: row.summary_text,
        keywords: JSON.parse(row.summary_keywords),
        domain: row.domain,
        outcome: row.outcome,
        timestamp: new Date(row.timestamp)
      };
    } else {
      // Slow path: unfold if needed
      return await this.unfold(experienceId);
    }
  }

  /**
   * Generate LLM summary for an experience
   */
  private async generateSummary(experience: Experience): Promise<MemorySummary> {
    const prompt = `Summarize this software development experience in 1-2 sentences:

Task: ${experience.task}
Outcome: ${experience.outcome}
Success: ${experience.success}
Duration: ${experience.duration}ms
Domain: ${experience.domain}
Lessons learned:
${experience.lessons.map(l => `- ${l}`).join('\n')}

Focus on the key insight and outcome. Omit implementation details.`;

    const summaryText = await this.llmClient.complete(prompt, { maxTokens: 100 });

    // Extract keywords from summary + lessons
    const keywords = this.extractKeywords(summaryText, experience.lessons);

    return {
      text: summaryText.trim(),
      keywords,
      domain: experience.domain,
      outcome: experience.outcome,
      timestamp: experience.timestamp,
      significance: this.calculateSignificance(experience)
    };
  }

  /**
   * Calculate memory significance (0-1)
   * Higher = more important to keep unfolded
   */
  private calculateSignificance(experience: Experience): number {
    let score = 0.5; // baseline

    // Boost for success
    if (experience.success) score += 0.2;

    // Boost for lessons learned
    score += Math.min(experience.lessons.length * 0.05, 0.2);

    // Boost for recent experiences
    const ageHours = (Date.now() - experience.timestamp.getTime()) / (1000 * 60 * 60);
    if (ageHours < 24) score += 0.2;
    else if (ageHours < 168) score += 0.1; // 1 week

    return Math.min(score, 1.0);
  }

  /**
   * Auto-fold old, low-significance memories
   */
  async autoFold(options: {
    olderThan?: Date;
    minSignificance?: number;
    maxUnfolded?: number;
  } = {}): Promise<number> {
    const olderThan = options.olderThan || new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h
    const minSignificance = options.minSignificance || 0.6;
    const maxUnfolded = options.maxUnfolded || 100;

    // Get candidates for folding
    const candidates = await this.db.all(`
      SELECT id, significance, last_access
      FROM experiences
      WHERE state = 'unfolded'
        AND last_access < ?
        AND significance < ?
      ORDER BY significance ASC, last_access ASC
    `, [olderThan.toISOString(), minSignificance]);

    // Fold until we're under maxUnfolded limit
    const currentUnfolded = await this.db.get(
      'SELECT COUNT(*) as count FROM experiences WHERE state = "unfolded"'
    );

    const toFold = Math.max(
      candidates.length,
      currentUnfolded.count - maxUnfolded
    );

    let folded = 0;
    for (const candidate of candidates.slice(0, toFold)) {
      try {
        await this.fold(candidate.id);
        folded++;
      } catch (error) {
        logger.warn('Auto-fold failed', { id: candidate.id, error });
      }
    }

    return folded;
  }
}
```

### 5.3 Archive Store Implementations

```typescript
/**
 * Archive store interface
 */
interface IArchiveStore {
  store(id: string, data: Experience): Promise<string>; // Returns location
  retrieve(location: string): Promise<Experience>;
  delete(location: string): Promise<void>;
}

/**
 * SQLite blob archive (for local storage)
 */
class SQLiteArchiveStore implements IArchiveStore {
  constructor(private db: Database.Database) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS archive (
        id TEXT PRIMARY KEY,
        data BLOB NOT NULL,
        compressed INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER NOT NULL
      )
    `);
  }

  async store(id: string, data: Experience): Promise<string> {
    const json = JSON.stringify(data);
    const compressed = zlib.gzipSync(json);

    this.db.run(
      'INSERT OR REPLACE INTO archive (id, data, compressed, created_at) VALUES (?, ?, 1, ?)',
      [id, compressed, Date.now()]
    );

    return `sqlite://archive/${id}`;
  }

  async retrieve(location: string): Promise<Experience> {
    const id = location.split('/').pop();
    const row = this.db.get('SELECT data FROM archive WHERE id = ?', [id]);

    if (!row) throw new Error(`Archive ${id} not found`);

    const json = zlib.gunzipSync(row.data).toString();
    return JSON.parse(json);
  }

  async delete(location: string): Promise<void> {
    const id = location.split('/').pop();
    this.db.run('DELETE FROM archive WHERE id = ?', [id]);
  }
}

/**
 * Filesystem archive (for simple file-based storage)
 */
class FilesystemArchiveStore implements IArchiveStore {
  constructor(private basePath: string) {
    fs.mkdirSync(basePath, { recursive: true });
  }

  async store(id: string, data: Experience): Promise<string> {
    const filePath = path.join(this.basePath, `${id}.json.gz`);
    const json = JSON.stringify(data);
    const compressed = zlib.gzipSync(json);

    await fs.writeFile(filePath, compressed);

    return `file://${filePath}`;
  }

  async retrieve(location: string): Promise<Experience> {
    const filePath = location.replace('file://', '');
    const compressed = await fs.readFile(filePath);
    const json = zlib.gunzipSync(compressed).toString();

    return JSON.parse(json);
  }

  async delete(location: string): Promise<void> {
    const filePath = location.replace('file://', '');
    await fs.unlink(filePath);
  }
}
```

---

## 6. Integration with Existing Memory System

### 6.1 Migration Path (Backward Compatible)

**Phase 1: Add Folding Schema** (No Breaking Changes)

```sql
-- Add columns to existing experiences table
ALTER TABLE experiences ADD COLUMN state TEXT DEFAULT 'unfolded';
ALTER TABLE experiences ADD COLUMN summary_text TEXT;
ALTER TABLE experiences ADD COLUMN summary_keywords TEXT;
ALTER TABLE experiences ADD COLUMN archive_location TEXT;
ALTER TABLE experiences ADD COLUMN archived_at INTEGER;
ALTER TABLE experiences ADD COLUMN last_access INTEGER DEFAULT 0;
ALTER TABLE experiences ADD COLUMN significance REAL DEFAULT 0.5;

-- Create archive table
CREATE TABLE IF NOT EXISTS archive (
  id TEXT PRIMARY KEY,
  data BLOB NOT NULL,
  compressed INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL
);

-- Create index for auto-fold queries
CREATE INDEX IF NOT EXISTS idx_experiences_state_access
  ON experiences(state, last_access, significance);
```

**Phase 2: Extend ExperienceStorage**

```typescript
// Existing code still works
const storage = new ExperienceStorage();
await storage.store(experience); // Works as before

// New folding capabilities (opt-in)
const foldableStorage = new FoldableExperienceStorage();
await foldableStorage.fold(experience.id); // New feature
```

**Phase 3: Add Background Folding Job**

```typescript
// Auto-fold old experiences every hour
setInterval(async () => {
  const folded = await foldableStorage.autoFold({
    olderThan: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h
    minSignificance: 0.6,
    maxUnfolded: 100
  });

  logger.info('Auto-fold completed', { folded });
}, 60 * 60 * 1000); // 1 hour
```

### 6.2 API Compatibility

```typescript
// Old API (unchanged)
await experienceStorage.store(experience);
const results = await experienceStorage.query({ domain: 'chunking' });

// New API (additive)
await experienceStorage.fold(experience.id);
const summary = await experienceStorage.retrieve(experience.id, 'summary');
const full = await experienceStorage.retrieve(experience.id, 'full');

// Adaptive search (returns summaries by default, unfolds top 3)
const adaptiveResults = await experienceStorage.searchAdaptive(query, {
  limit: 20,
  unfoldTop: 3
});
// Returns: { detailed: Experience[], summaries: MemorySummary[] }
```

---

## 7. Metrics for Memory Effectiveness

### 7.1 Compression Metrics

```typescript
interface CompressionMetrics {
  totalExperiences: number;
  folded: number;
  unfolded: number;
  archived: number;

  // Size metrics
  totalSize: {
    uncompressed: number; // bytes
    compressed: number; // bytes
    ratio: number; // uncompressed / compressed
  };

  // Per-tier breakdown
  byTier: {
    hot: { count: number; size: number }; // In-memory
    warm: { count: number; size: number }; // SQLite summaries
    cold: { count: number; size: number }; // Archive
  };
}

// Example usage
const metrics = await storage.getCompressionMetrics();
console.log(`Compression ratio: ${metrics.totalSize.ratio.toFixed(1)}x`);
console.log(`Memory saved: ${(metrics.totalSize.uncompressed - metrics.totalSize.compressed) / 1024 / 1024}MB`);
```

### 7.2 Retrieval Metrics

```typescript
interface RetrievalMetrics {
  summaryRetrievals: number;
  fullRetrievals: number;
  unfoldOperations: number;

  // Performance
  avgRetrievalTime: {
    summary: number; // ms
    full: number; // ms
    unfold: number; // ms
  };

  // Precision/Recall (for search)
  precision: number; // relevant retrieved / total retrieved
  recall: number; // relevant retrieved / total relevant

  // Cache hit rate
  cacheHitRate: number; // summary cache hits / total retrievals
}

// Track retrieval patterns
const metrics = await storage.getRetrievalMetrics({ since: Date.now() - 24 * 60 * 60 * 1000 });
console.log(`Summary retrievals: ${metrics.summaryRetrievals} (${metrics.avgRetrievalTime.summary}ms avg)`);
console.log(`Cache hit rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`);
```

### 7.3 Access Pattern Analysis

```typescript
interface AccessPatternMetrics {
  hotExperiences: Array<{ id: string; accessCount: number; lastAccess: Date }>;
  coldExperiences: Array<{ id: string; daysSinceAccess: number }>;

  accessDistribution: {
    daily: number; // Accessed in last 24h
    weekly: number; // Accessed in last 7 days
    monthly: number; // Accessed in last 30 days
    never: number; // Never accessed since creation
  };

  foldingCandidates: number; // Experiences eligible for folding
}

// Auto-fold based on access patterns
const patterns = await storage.getAccessPatternMetrics();
if (patterns.foldingCandidates > 100) {
  await storage.autoFold({ maxUnfolded: 100 });
}
```

### 7.4 Storage Efficiency

```typescript
interface StorageEfficiencyMetrics {
  diskUsage: {
    experiences: number; // bytes
    archive: number; // bytes
    indices: number; // bytes
    total: number; // bytes
  };

  bytesSaved: number; // Total compression savings
  compressionRatio: number; // Average across all folded experiences

  // Cost metrics (if using cloud storage)
  estimatedMonthlyCost?: {
    hot: number; // USD
    warm: number; // USD
    cold: number; // USD
    total: number; // USD
  };
}
```

---

## 8. Use Cases in Weave-NN

### 8.1 Long Cultivation Sessions

**Problem**: A 2-hour cultivation session generates 500+ experiences, bloating context window

**Solution with Folding**:

```typescript
// During cultivation
const cultivator = new SeedCultivator({ storage: foldableStorage });

// After each seed generation
await cultivator.cultivate(vault, {
  onSeedCreated: async (seed) => {
    // Store full experience initially
    await storage.store(seed.experience);

    // Fold old seeds after 10 new ones
    if (cultivator.seedCount % 10 === 0) {
      const folded = await storage.autoFold({
        olderThan: new Date(Date.now() - 10 * 60 * 1000), // 10 min
        maxUnfolded: 50
      });
      logger.info(`Auto-folded ${folded} old seeds`);
    }
  }
});

// At session end: Summary view
const sessionSummary = await storage.query({
  dateRange: { start: sessionStart, end: new Date() }
}, { detail: 'summary' });

// Returns 500 summaries (~100KB) instead of 500 full experiences (~7.5MB)
```

**Benefit**: 75x reduction in memory usage for session context

### 8.2 Multi-Agent Coordination

**Problem**: Hive Mind swarm needs shared context but can't afford to send full experiences to every agent

**Solution**:

```typescript
// Queen agent shares summaries
const relevantMemories = await storage.searchAdaptive("authentication implementation", {
  limit: 20,
  unfoldTop: 0 // Only summaries
});

await queenAgent.broadcast({
  type: 'context_update',
  memories: relevantMemories.summaries // 20 × 200 bytes = 4KB
});

// Worker agent unfolds on demand
const workerAgent = swarm.getAgent('auth-specialist');
const detailedMemory = await storage.unfold(relevantMemories.summaries[0].id);
await workerAgent.process(detailedMemory);
```

**Benefit**: 95% reduction in broadcast message size

### 8.3 Training Data Preparation

**Problem**: Need to convert cultivation experiences into compact training examples

**Solution**:

```typescript
// Fold episode: 100 cultivation runs → 1 episode summary
const cultivationRuns = await storage.query({
  domain: 'workflow',
  task: 'seed cultivation'
});

const episode = await storage.createEpisode({
  title: 'Q4 2025 Seed Cultivation',
  experiences: cultivationRuns.map(r => r.experience.id),
  summarize: true
});

// Export as training data
const trainingExample = {
  input: episode.summary.text,
  output: episode.metadata.successRate > 0.9 ? 'success' : 'failure',
  context: episode.summary.keywords
};

await exportToJSONL(trainingExample);
```

**Benefit**: 100x compression for training datasets

### 8.4 User History Summarization

**Problem**: User has 10,000 vault notes synced to memory

**Solution**:

```typescript
// Vault sync with auto-folding
await vaultSync.syncVaultToMemory();

// Auto-fold notes older than 30 days
const folded = await storage.autoFold({
  olderThan: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
  minSignificance: 0.5,
  maxUnfolded: 500
});

// User queries history
const recentNotes = await storage.search('project planning', {
  namespace: 'vault/notes/',
  detail: 'summary'
});

// Returns summaries instantly (10ms) instead of loading 10,000 full notes (5s)
```

**Benefit**: 500x faster search, 95% memory reduction

---

## 9. Recommendations for Weave-NN

### 9.1 Immediate Actions (Priority 1)

1. **Add Folding Schema** (1-2 hours)
   - Extend `experiences` table with `state`, `summary_text`, `archive_location`
   - Create `archive` table for compressed storage
   - Add indices for auto-fold queries

2. **Implement Basic Folding** (4-6 hours)
   - Extend `ExperienceStorage` → `FoldableExperienceStorage`
   - Implement `fold()`, `unfold()`, `retrieve(detail)`
   - Add SQLite archive store

3. **Enable Auto-Fold** (2-3 hours)
   - Background job to fold experiences older than 24h
   - Start with conservative thresholds (fold after 24h, keep 100 unfolded)
   - Add metrics logging

### 9.2 Medium-Term Enhancements (Priority 2)

4. **LLM Summarization** (6-8 hours)
   - Integrate Claude/GPT for summary generation
   - Prompt engineering for domain-specific summaries
   - Batch summarization to reduce API calls

5. **Adaptive Retrieval** (4-6 hours)
   - Implement `searchAdaptive()` with configurable unfold count
   - Add summary cache for frequently accessed memories
   - Optimize query planner (check summaries first)

6. **Episodic Memory** (8-10 hours)
   - Group related experiences into episodes
   - Episode-level summaries
   - Hierarchical search (episode → experience)

### 9.3 Advanced Features (Priority 3)

7. **Compression Optimization** (4-6 hours)
   - Benchmark gzip vs. zstd vs. brotli
   - Implement streaming decompression for large archives
   - Add compression level tuning

8. **Access Pattern Learning** (6-8 hours)
   - Track access frequencies and recency
   - Predict which memories to keep unfolded
   - Adaptive significance scoring

9. **Distributed Archive** (8-12 hours)
   - S3/Cloud storage archive backend
   - Multi-region replication
   - Cost optimization (lifecycle policies)

---

## 10. Success Metrics

Track these KPIs after implementing foldable memory:

| Metric | Current (Estimated) | Target | Measurement |
|--------|-------------------|--------|-------------|
| **Memory Footprint** | 150MB (10K experiences) | <10MB | Total DB + archive size |
| **Compression Ratio** | 1x (no compression) | 30-50x | Uncompressed / compressed |
| **Search Latency** | 500-1000ms (scan all) | <50ms (summary search) | Avg query time |
| **Context Window Usage** | 100% (all experiences) | <10% (summaries only) | Token count in prompts |
| **Retrieval Precision** | N/A (returns all) | >90% | Relevant / retrieved |
| **Cache Hit Rate** | 0% (no cache) | >80% | Summary cache hits |
| **Auto-Fold Coverage** | 0% (manual only) | >90% | Experiences folded / total old |

---

## 11. Conclusion

### Current State Assessment

**Weave-NN Memory System Grade: B+ (Strong foundation, missing compression)**

**Strengths**:
- ✅ Robust SQLite-backed persistence
- ✅ Semantic similarity search with embeddings
- ✅ Domain-specific indexing and lesson extraction
- ✅ Namespace isolation and TTL support
- ✅ Batch operations and conflict resolution

**Critical Gaps**:
- ❌ **No hierarchical compression** (foldable output)
- ❌ **No LLM-based summarization**
- ❌ **No adaptive retrieval** (summary vs. full)
- ❌ **No context window optimization**
- ❌ **No access pattern tracking**

### Implementation Feasibility

**Estimated Effort**: 20-30 hours for full foldable memory system

**ROI**: **VERY HIGH**
- 30-50x memory reduction
- 90%+ faster search
- 95% reduction in context window usage
- Enables long-running sessions without memory exhaustion

### Next Steps

1. **Week 1**: Implement folding schema + basic fold/unfold (Priority 1)
2. **Week 2**: Add auto-fold background job + metrics (Priority 1)
3. **Week 3**: Integrate LLM summarization (Priority 2)
4. **Week 4**: Optimize adaptive retrieval + caching (Priority 2)

**Quick Win**: Start with **manual folding** for old experiences:

```typescript
// Fold all experiences older than 7 days (one-time cleanup)
const oldExperiences = await storage.query({
  dateRange: {
    start: new Date(0),
    end: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  }
});

for (const exp of oldExperiences) {
  await storage.fold(exp.experience.id);
}

console.log(`Folded ${oldExperiences.length} old experiences`);
// Result: Immediate 90% memory reduction for historical data
```

---

**Document Metadata**:
- **Version**: 1.0.0
- **Last Updated**: 2025-11-01
- **Author**: Memory Systems Specialist (Hive Mind Swarm)
- **Review Status**: Ready for Engineering Review
- **Implementation Priority**: HIGH (P1)
