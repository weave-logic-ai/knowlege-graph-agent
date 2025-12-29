# ADR-004: Vector Search Strategy with Embedding Provider

**Status**: Proposed
**Date**: 2025-12-29
**Category**: feature

## Context

Semantic search is a core Phase 13 feature that enables users to find conceptually related documents even when they don't share exact keywords. Currently:

- The `vectorSearchResolver` in GraphQL falls back to text search
- No embedding provider is configured
- The `VectorStore` interface exists but requires embeddings
- Users cannot find conceptually related documents
- RAG (Retrieval Augmented Generation) quality is degraded

The system needs to:
1. Generate semantic embeddings for documents
2. Store embeddings efficiently
3. Perform fast similarity search
4. Combine semantic and keyword search (hybrid search)

## Decision

Integrate `all-MiniLM-L6-v2` via `@xenova/transformers` for local embedding generation, store embeddings in SQLite with binary format, and implement hybrid search combining 40% FTS5 + 60% vector similarity.

### Architecture

```
+-------------------+     +----------------------+
| Document Content  |---->| EmbeddingService     |
+-------------------+     |                      |
                          | +------------------+ |
                          | | Xenova/          | |
                          | | transformers     | |
                          | | all-MiniLM-L6-v2 | |
                          | +--------+---------+ |
                          +----------+-----------+
                                     |
                                     v
                          +----------------------+
                          | VectorStore          |
                          | (SQLite + Binary)    |
                          +----------------------+
                                     |
                                     v
                          +----------------------+
                          | HybridSearch         |
                          | (FTS5 + Cosine)      |
                          +----------------------+
```

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| EmbeddingService | Generate 384-dimensional embeddings using all-MiniLM-L6-v2 |
| VectorStore | Store embeddings in SQLite, perform cosine similarity search |
| HybridSearch | Combine FTS5 text search with vector similarity |

## Rationale

### Why all-MiniLM-L6-v2?

1. **Small Size**: 23MB model, loads in < 10 seconds
2. **Good Quality**: 384 dimensions, competitive with larger models
3. **Local Execution**: No API calls, works offline
4. **Proven**: Widely used for document similarity tasks
5. **Fast**: ~100ms per chunk on modern hardware

### Why @xenova/transformers?

1. **Pure JavaScript**: Runs in Node.js without Python
2. **ONNX Runtime**: Optimized inference
3. **Easy Integration**: npm install, no separate model server
4. **Active Maintenance**: Regular updates and bug fixes

### Why SQLite for vector storage?

1. **No Additional Infrastructure**: Single file database
2. **Transactional**: ACID guarantees for data integrity
3. **Fast Enough**: Sub-200ms search for 10,000 documents
4. **Binary Format**: Efficient storage (~1.5KB per embedding)
5. **Portable**: Works on all platforms

### Why 60/40 hybrid weighting?

1. **Semantic Priority**: Vector search captures meaning better
2. **Keyword Fallback**: FTS5 handles exact matches, technical terms
3. **Tunable**: Weights can be adjusted per use case
4. **Research-Backed**: Hybrid approaches consistently outperform single-mode

### Alternatives Considered

1. **OpenAI Embeddings**: Requires API key, costs money, adds latency
2. **FAISS/HNSW**: Better for millions of vectors, overkill for our scale
3. **ChromaDB/Pinecone**: Adds infrastructure dependency
4. **FTS5 Only**: Misses semantic relationships

## Consequences

### Positive

- Semantic search becomes functional
- Users can find conceptually related documents
- RAG quality improves significantly
- Works offline without API dependencies
- Low latency (< 200ms for search)
- Minimal storage overhead (~1.5KB per document)

### Negative

- Model loading time on first use (~10 seconds)
- Memory usage (~500MB for model in memory)
- Embedding generation adds processing time during sync
- SQLite cosine similarity is O(n), not ideal for huge datasets

### Neutral

- Embeddings need regeneration if model changes
- Hybrid weights may need tuning for different vaults
- Incremental updates are efficient (only changed documents)

## Implementation

### Step 1: Install Dependencies

```bash
npm install @xenova/transformers
```

### Step 2: Create EmbeddingService

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

  async embed(text: string): Promise<Float32Array> {
    await this.initialize();
    if (!this.pipeline) throw new Error('Pipeline not initialized');

    const truncated = text.slice(0, this.config.maxLength * 4);

    const output = await this.pipeline(truncated, {
      pooling: 'mean',
      normalize: true,
    });

    return new Float32Array(output.data);
  }

  async embedBatch(texts: string[]): Promise<Float32Array[]> {
    await this.initialize();
    if (!this.pipeline) throw new Error('Pipeline not initialized');

    const results: Float32Array[] = [];

    for (let i = 0; i < texts.length; i += this.config.batchSize) {
      const batch = texts.slice(i, i + this.config.batchSize);
      const truncated = batch.map((t) => t.slice(0, this.config.maxLength * 4));

      const outputs = await this.pipeline(truncated, {
        pooling: 'mean',
        normalize: true,
      });

      for (let j = 0; j < batch.length; j++) {
        const start = j * this.config.dimensions;
        const embedding = outputs.data.slice(start, start + this.config.dimensions);
        results.push(new Float32Array(embedding));
      }
    }

    return results;
  }

  getDimensions(): number {
    return this.config.dimensions;
  }
}
```

### Step 3: Create VectorStore with SQLite

**File**: `src/vector/services/vector-store.ts`

```typescript
import Database from 'better-sqlite3';

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

  async search(query: string, limit: number = 10, threshold: number = 0.5): Promise<VectorSearchResult[]> {
    const queryEmbedding = await this.embeddingService.embed(query);
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
```

### Step 4: Implement HybridSearch

**File**: `src/vector/services/hybrid-search.ts`

```typescript
export interface HybridSearchConfig {
  vectorWeight: number;  // Default: 0.6
  ftsWeight: number;     // Default: 0.4
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
      const ftsScore = result.score ?? 0.5;

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

    return [...combined.values()]
      .filter((r) => r.combinedScore >= this.config.minScore)
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, this.config.limit);
  }
}
```

### Step 5: Update GraphQL Resolver

**File**: `src/graphql/resolvers/queries.ts`

```typescript
import { HybridSearch } from '../../vector/services/hybrid-search.js';

export const vectorSearchResolver = async (
  _: unknown,
  args: { query: string; limit?: number; threshold?: number },
  context: GraphQLContext
) => {
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

## Performance Requirements

| Metric | Target |
|--------|--------|
| Embedding generation | < 100ms per chunk |
| Search latency | < 200ms for 10,000 documents |
| Memory usage | < 500MB for embedding model |
| Embedding storage | ~1.5KB per document |
| Model load time | < 10 seconds |

## Testing Requirements

1. **Unit Tests**: Embedding dimensions, similarity calculation
2. **Integration Tests**: Full search flow with real documents
3. **Performance Tests**: Benchmark against targets
4. **Quality Tests**: Semantic search accuracy evaluation

## Acceptance Criteria

- [ ] `EmbeddingService` generates 384-dimensional vectors
- [ ] `VectorStore` persists embeddings in SQLite
- [ ] `HybridSearch` combines FTS5 and vector results
- [ ] GraphQL `vectorSearch` query returns semantic matches
- [ ] Embedding generation < 100ms per chunk
- [ ] Search latency < 200ms for 10,000 documents
- [ ] Model loads in < 10 seconds on first use
- [ ] All existing tests continue to pass

## Future Enhancements

1. **AgentDB Integration**: Replace SQLite with AgentDB for 150x faster search (see RESEARCH-AGENTIC-FLOW-INTEGRATION.md)
2. **HNSW Index**: Add approximate nearest neighbor for scale
3. **Multiple Models**: Support different embedding models for different use cases
4. **Incremental Indexing**: Only re-embed changed documents

## References

- SPEC-004-VECTOR-SEARCH-EMBEDDINGS.md (Original specification)
- GAP-004 in FEATURE-GAP-ANALYSIS.md
- RESEARCH-AGENTIC-FLOW-INTEGRATION.md (AgentDB comparison)
- [Xenova/transformers.js](https://github.com/xenova/transformers.js)
- [all-MiniLM-L6-v2 Model](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
