# Feature Specification: Vector Search with Embedding Provider

**Spec ID**: SPEC-004
**Priority**: HIGH
**Estimated Effort**: 12-16 hours
**Dependencies**: None

## Overview

Integrate an embedding provider (`all-MiniLM-L6-v2` via `@xenova/transformers`) to enable semantic vector search, replacing the current text-search fallback in GraphQL resolvers.

## Current State

### Problem
The `vectorSearchResolver` in `src/graphql/resolvers/queries.ts` falls back to text search because no embedding provider is configured:

```typescript
// Current fallback behavior
async vectorSearch(args) {
  // Vector search not configured, falling back to text search
  return this.textSearch(args.query);
}
```

### Impact
- Semantic search (a core Phase 13 feature) is non-functional
- Users cannot find conceptually related documents
- RAG (Retrieval Augmented Generation) quality is degraded

## Requirements

### Functional Requirements

1. **FR-001**: Generate 384-dimensional embeddings using `all-MiniLM-L6-v2`
2. **FR-002**: Store embeddings in SQLite using binary format
3. **FR-003**: Implement cosine similarity search
4. **FR-004**: Support hybrid search (40% FTS5 + 60% vector)
5. **FR-005**: Batch embedding generation for vault sync
6. **FR-006**: Incremental embedding updates on file changes

### Non-Functional Requirements

1. **NFR-001**: Embedding generation < 100ms per chunk
2. **NFR-002**: Search latency < 200ms for 10,000 documents
3. **NFR-003**: Memory usage < 500MB for embedding model
4. **NFR-004**: Embedding storage ~1.5KB per document (384 * 4 bytes)

## Technical Specification

### Architecture

```
┌───────────────────┐     ┌──────────────────────┐
│ Document Content  │────▶│ EmbeddingService     │
└───────────────────┘     │                      │
                          │ ┌──────────────────┐ │
                          │ │ Xenova/          │ │
                          │ │ transformers     │ │
                          │ │ all-MiniLM-L6-v2 │ │
                          │ └────────┬─────────┘ │
                          └──────────┼───────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │ VectorStore          │
                          │ (SQLite + Binary)    │
                          └──────────────────────┘
                                     │
                                     ▼
                          ┌──────────────────────┐
                          │ HybridSearch         │
                          │ (FTS5 + Cosine)      │
                          └──────────────────────┘
```

### Implementation

#### Step 1: Install Dependencies

```bash
npm install @xenova/transformers
```

#### Step 2: Create EmbeddingService

**File**: `src/vector/services/embedding-service.ts`

```typescript
import { pipeline, Pipeline } from '@xenova/transformers';

export interface EmbeddingConfig {
  model: string;
  dimensions: number;
  maxLength: number;
  batchSize: number;
}

const DEFAULT_CONFIG: EmbeddingConfig = {
  model: 'Xenova/all-MiniLM-L6-v2',
  dimensions: 384,
  maxLength: 512,
  batchSize: 32,
};

export class EmbeddingService {
  private pipeline: Pipeline | null = null;
  private config: EmbeddingConfig;
  private initPromise: Promise<void> | null = null;

  constructor(config: Partial<EmbeddingConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the embedding model (lazy loading)
   */
  async initialize(): Promise<void> {
    if (this.pipeline) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      console.log(`Loading embedding model: ${this.config.model}`);
      this.pipeline = await pipeline('feature-extraction', this.config.model);
      console.log('Embedding model loaded');
    })();

    return this.initPromise;
  }

  /**
   * Generate embedding for a single text
   */
  async embed(text: string): Promise<Float32Array> {
    await this.initialize();
    if (!this.pipeline) throw new Error('Pipeline not initialized');

    // Truncate to max length
    const truncated = text.slice(0, this.config.maxLength * 4); // Approximate char limit

    const output = await this.pipeline(truncated, {
      pooling: 'mean',
      normalize: true,
    });

    return new Float32Array(output.data);
  }

  /**
   * Generate embeddings for multiple texts (batched)
   */
  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    await this.initialize();
    if (!this.pipeline) throw new Error('Pipeline not initialized');

    const results: Float32Array[] = [];

    // Process in batches
    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      const batch = texts.slice(i, i + this.config.batchSize);
      const truncated = batch.map((t) => t.slice(0, this.config.maxLength * 4));

      const outputs = await this.pipeline(truncated, {
        pooling: 'mean',
        normalize: true,
      });

      // Handle batch output
      for (let j = 0; j < batch.length; j++) {
        const start = j * this.config.dimensions;
        const embedding = outputs.data.slice(start, start + this.config.dimensions);
        results.push(new Float32Array(embedding));
      }
    }

    return results;
  }

  /**
   * Get embedding dimensions
   */
  getDimensions(): number {
    return this.config.dimensions;
  }
}
```

#### Step 3: Create VectorStore with SQLite

**File**: `src/vector/services/vector-store.ts`

```typescript
import Database from 'better-sqlite3';

export interface VectorEntry {
  id: string;
  nodeId: string;
  content: string;
  embedding: Float32Array;
  metadata: Record<string, unknown>;
}

export class VectorStore {
  private db: Database.Database;
  private embeddingService: EmbeddingService;

  constructor(dbPath: string, embeddingService: EmbeddingService) {
    this.db = new Database(dbPath);
    this.embeddingService = embeddingService;
    this.initializeSchema();
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS embeddings (
        id TEXT PRIMARY KEY,
        node_id TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding BLOB NOT NULL,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (node_id) REFERENCES nodes(id)
      );

      CREATE INDEX IF NOT EXISTS idx_embeddings_node_id ON embeddings(node_id);
    `);
  }

  /**
   * Upsert embedding for a node
   */
  async upsert(nodeId: string, content: string, metadata?: Record<string, unknown>): Promise<void> {
    const embedding = await this.embeddingService.embed(content);
    const embeddingBlob = Buffer.from(embedding.buffer);
    const id = `${nodeId}-${Date.now()}`;

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO embeddings (id, node_id, content, embedding, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(id, nodeId, content, embeddingBlob, JSON.stringify(metadata ?? {}));
  }

  /**
   * Batch upsert embeddings
   */
  async upsertBatch(entries: Array<{ nodeId: string; content: string; metadata?: Record<string, unknown> }>): Promise<void> {
    const contents = entries.map((e) => e.content);
    const embeddings = await this.embeddingService.embedBatch(contents);

    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO embeddings (id, node_id, content, embedding, metadata)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insert = this.db.transaction((entries: typeof entries) => {
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const embedding = embeddings[i];
        const embeddingBlob = Buffer.from(embedding.buffer);
        const id = `${entry.nodeId}-${Date.now()}-${i}`;

        stmt.run(id, entry.nodeId, entry.content, embeddingBlob, JSON.stringify(entry.metadata ?? {}));
      }
    });

    insert(entries);
  }

  /**
   * Search by vector similarity
   */
  async search(query: string, limit: number = 10, threshold: number = 0.5): Promise<VectorSearchResult[]> {
    const queryEmbedding = await this.embeddingService.embed(query);

    // Get all embeddings (for small datasets; use approximate nearest neighbor for large)
    const rows = this.db.prepare('SELECT * FROM embeddings').all() as EmbeddingRow[];

    const results: VectorSearchResult[] = [];

    for (const row of rows) {
      const embedding = new Float32Array(row.embedding.buffer);
      const similarity = this.cosineSimilarity(queryEmbedding, embedding);

      if (similarity >= threshold) {
        results.push({
          nodeId: row.node_id,
          content: row.content,
          similarity,
          metadata: JSON.parse(row.metadata),
        });
      }
    }

    return results
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);
  }

  /**
   * Compute cosine similarity between two vectors
   */
  private cosineSimilarity(a: Float32Array, b: Float32Array): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

interface EmbeddingRow {
  id: string;
  node_id: string;
  content: string;
  embedding: Buffer;
  metadata: string;
}

interface VectorSearchResult {
  nodeId: string;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}
```

#### Step 4: Implement HybridSearch

**File**: `src/vector/services/hybrid-search.ts`

```typescript
import { VectorStore } from './vector-store.js';
import { KnowledgeGraphDatabase } from '../../core/database.js';

export interface HybridSearchConfig {
  vectorWeight: number; // Default: 0.6
  ftsWeight: number;    // Default: 0.4
  limit: number;
  minScore: number;
}

const DEFAULT_CONFIG: HybridSearchConfig = {
  vectorWeight: 0.6,
  ftsWeight: 0.4,
  limit: 20,
  minScore: 0.3,
};

export class HybridSearch {
  private vectorStore: VectorStore;
  private db: KnowledgeGraphDatabase;
  private config: HybridSearchConfig;

  constructor(
    vectorStore: VectorStore,
    db: KnowledgeGraphDatabase,
    config: Partial<HybridSearchConfig> = {}
  ) {
    this.vectorStore = vectorStore;
    this.db = db;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Perform hybrid search combining FTS5 and vector similarity
   */
  async search(query: string): Promise<HybridSearchResult[]> {
    // Get vector search results
    const vectorResults = await this.vectorStore.search(
      query,
      this.config.limit * 2,
      this.config.minScore
    );

    // Get FTS5 results
    const ftsResults = this.db.searchNodes(query, this.config.limit * 2);

    // Combine and re-rank
    const combined = new Map<string, HybridSearchResult>();

    // Add vector results
    for (const result of vectorResults) {
      combined.set(result.nodeId, {
        nodeId: result.nodeId,
        content: result.content,
        vectorScore: result.similarity,
        ftsScore: 0,
        combinedScore: result.similarity * this.config.vectorWeight,
        source: 'vector',
      });
    }

    // Add/merge FTS results
    for (const result of ftsResults) {
      const existing = combined.get(result.id);
      const ftsScore = result.score ?? 0.5; // Normalize FTS score

      if (existing) {
        existing.ftsScore = ftsScore;
        existing.combinedScore =
          existing.vectorScore * this.config.vectorWeight +
          ftsScore * this.config.ftsWeight;
        existing.source = 'hybrid';
      } else {
        combined.set(result.id, {
          nodeId: result.id,
          content: result.content,
          vectorScore: 0,
          ftsScore: ftsScore,
          combinedScore: ftsScore * this.config.ftsWeight,
          source: 'fts',
        });
      }
    }

    // Sort by combined score and return top results
    return [...combined.values()]
      .filter((r) => r.combinedScore >= this.config.minScore)
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, this.config.limit);
  }
}

interface HybridSearchResult {
  nodeId: string;
  content: string;
  vectorScore: number;
  ftsScore: number;
  combinedScore: number;
  source: 'vector' | 'fts' | 'hybrid';
}
```

#### Step 5: Update GraphQL Resolver

**File**: `src/graphql/resolvers/queries.ts` (modify existing)

```typescript
import { HybridSearch } from '../../vector/services/hybrid-search.js';
import { VectorStore } from '../../vector/services/vector-store.js';
import { EmbeddingService } from '../../vector/services/embedding-service.js';

// Initialize services
const embeddingService = new EmbeddingService();
const vectorStore = new VectorStore('./data/embeddings.db', embeddingService);
let hybridSearch: HybridSearch | null = null;

export const vectorSearchResolver = async (
  _: unknown,
  args: { query: string; limit?: number; threshold?: number },
  context: GraphQLContext
) => {
  // Lazy initialize hybrid search
  if (!hybridSearch) {
    hybridSearch = new HybridSearch(vectorStore, context.db);
  }

  const results = await hybridSearch.search(args.query);

  return results.map((r) => ({
    nodeId: r.nodeId,
    content: r.content,
    score: r.combinedScore,
    source: r.source,
  }));
};
```

---

## Testing Requirements

1. **Unit Tests**
   - Test embedding generation dimensions (384)
   - Test batch embedding performance
   - Test cosine similarity calculation
   - Test hybrid score weighting

2. **Integration Tests**
   - Test full search flow with real documents
   - Test embedding persistence in SQLite
   - Test incremental updates

3. **Performance Tests**
   - Benchmark embedding generation (< 100ms target)
   - Benchmark search latency (< 200ms target)
   - Memory usage profiling

---

## Acceptance Criteria

- [ ] `EmbeddingService` generates 384-dimensional vectors
- [ ] `VectorStore` persists embeddings in SQLite
- [ ] `HybridSearch` combines FTS5 and vector results
- [ ] GraphQL `vectorSearch` query returns semantic matches
- [ ] Embedding generation < 100ms per chunk
- [ ] Search latency < 200ms for 10,000 documents
- [ ] Model loads in < 10 seconds on first use
- [ ] All existing tests continue to pass

## Success Metrics

- Semantic search accuracy > 85%
- Query latency p95 < 200ms
- User satisfaction with search results (qualitative)
- Zero regression in existing FTS functionality
