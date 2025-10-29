# Embeddings API Documentation

## Overview

The Embeddings API provides semantic vector representation for text chunks, enabling similarity search and intelligent document retrieval.

## Architecture

```
┌─────────────────────────┐
│  EmbeddingManager       │
│  - Orchestration        │
│  - Caching              │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    │                │
┌───▼────────┐  ┌───▼────────┐
│ Generator  │  │  Storage   │
│ - OpenAI   │  │  - SQLite  │
│ - Xenova   │  │  - Vectors │
└────────────┘  └────────────┘
```

## Core Components

### EmbeddingManager

High-level orchestration of embedding operations with caching and batch processing.

#### Constructor

```typescript
import { createEmbeddingManager } from '@weave-nn/weaver/embeddings';

const manager = createEmbeddingManager(
  './data/embeddings.db',   // Storage path
  'openai',                  // Provider: 'openai' | 'xenova'
  'text-embedding-3-small', // Model name
  process.env.OPENAI_API_KEY, // API key (optional for Xenova)
  1000                       // Max cache size
);
```

#### Methods

##### `generateAndStore(request, useCache?)`

Generate and store a single embedding.

```typescript
const response = await manager.generateAndStore({
  text: 'Sample text to embed',
  chunkId: 'chunk-123',
  metadata: {
    docId: 'doc-456',
    source: 'user-input'
  }
}, true); // Use cache

console.log(response.embedding.id);        // 'emb-xyz'
console.log(response.embedding.vector);    // [0.123, -0.456, ...]
console.log(response.usage.tokens);        // 15
```

**Parameters:**
- `request: EmbeddingRequest` - Embedding request object
  - `text: string` - Text to embed (required)
  - `chunkId: string` - Chunk identifier (required)
  - `metadata?: Record<string, any>` - Additional metadata
- `useCache?: boolean` - Enable caching (default: true)

**Returns:** `Promise<EmbeddingResponse>`

**Throws:** `EmbeddingManagerError`

##### `generateAndStoreBatch(requests, useCache?)`

Generate and store multiple embeddings efficiently.

```typescript
const requests = chunks.map(chunk => ({
  text: chunk.content,
  chunkId: chunk.id,
  metadata: { docId: chunk.docId }
}));

const responses = await manager.generateAndStoreBatch(requests);

console.log(`Generated ${responses.length} embeddings`);
console.log(`Cache hits: ${manager.getStats().cacheHits}`);
```

**Performance:** 3-5x faster than sequential processing for batches >5 items.

##### `getEmbedding(chunkId)`

Retrieve stored embedding by chunk ID.

```typescript
const embedding = manager.getEmbedding('chunk-123');

if (embedding) {
  console.log(embedding.vector.length); // 1536 for text-embedding-3-small
  console.log(embedding.model);         // 'text-embedding-3-small'
}
```

##### `deleteEmbedding(chunkId)`

Delete embedding for a chunk.

```typescript
manager.deleteEmbedding('chunk-123');
```

##### `getStats()`

Get embedding statistics.

```typescript
const stats = manager.getStats();

console.log(stats);
// {
//   totalEmbeddings: 1234,
//   totalDimensions: 1896384,
//   providers: { openai: 1200, xenova: 34 },
//   models: { 'text-embedding-3-small': 1234 },
//   cacheHits: 456,
//   cacheMisses: 778,
//   cacheSize: 456
// }
```

##### `clearCache()`

Clear the in-memory cache.

```typescript
manager.clearCache();
```

##### `close()`

Close the embedding manager and release resources.

```typescript
manager.close();
```

### EmbeddingGenerator

Low-level embedding generation using different providers.

```typescript
import { createEmbeddingGenerator } from '@weave-nn/weaver/embeddings';

const generator = createEmbeddingGenerator('openai', 'text-embedding-3-small');

const response = await generator.generate({
  text: 'Sample text',
  chunkId: 'chunk-123'
});
```

**Supported Providers:**
- `openai` - OpenAI API (requires API key)
- `xenova` - Local Transformers.js (no API key needed)

### VectorStorage

SQLite-based vector storage with similarity search.

```typescript
import { createVectorStorage } from '@weave-nn/weaver/embeddings';

const storage = createVectorStorage('./data/vectors.db');

// Store embedding
storage.storeEmbedding({
  id: 'emb-123',
  chunkId: 'chunk-123',
  vector: [0.1, 0.2, 0.3],
  model: 'text-embedding-3-small',
  provider: 'openai',
  dimensions: 1536,
  metadata: { docId: 'doc-456' }
});

// Search similar vectors
const similar = storage.searchSimilar([0.1, 0.2, 0.3], 10, 0.7);
```

### SimilaritySearch

Advanced semantic search with hybrid capabilities.

```typescript
import { createSimilaritySearch } from '@weave-nn/weaver/embeddings';

const search = createSimilaritySearch('./data/embeddings.db', generator);

// Semantic search
const results = await search.searchSemantic('What is machine learning?', {
  limit: 5,
  minScore: 0.7,
  filters: { docType: 'tutorial' }
});

// Hybrid search (semantic + keyword)
const hybrid = await search.searchHybrid(
  'machine learning',
  {
    limit: 10,
    semanticWeight: 0.7,
    keywordWeight: 0.3
  }
);
```

## Types

### EmbeddingRequest

```typescript
interface EmbeddingRequest {
  text: string;                    // Text to embed
  chunkId: string;                 // Chunk identifier
  metadata?: Record<string, any>;  // Optional metadata
}
```

### EmbeddingResponse

```typescript
interface EmbeddingResponse {
  embedding: Embedding;
  usage: {
    tokens: number;
  };
}
```

### Embedding

```typescript
interface Embedding {
  id: string;                      // Unique identifier
  chunkId: string;                 // Associated chunk
  vector: number[];                // Embedding vector
  model: string;                   // Model used
  provider: EmbeddingProvider;     // Provider used
  dimensions: number;              // Vector dimensions
  metadata: Record<string, any>;   // Additional data
  createdAt: number;               // Timestamp
}
```

### EmbeddingProvider

```typescript
type EmbeddingProvider = 'openai' | 'xenova';
```

### SimilarityResult

```typescript
interface SimilarityResult {
  chunkId: string;
  similarity: number;    // 0-1 score
  embedding: Embedding;
  metadata: Record<string, any>;
}
```

## Configuration

### Environment Variables

```bash
# OpenAI provider
OPENAI_API_KEY=sk-...

# Storage paths
EMBEDDINGS_DB_PATH=./data/embeddings.db
CACHE_SIZE=1000
```

### Model Selection

**OpenAI Models:**
- `text-embedding-3-small` - 1536 dimensions, fast, cost-effective
- `text-embedding-3-large` - 3072 dimensions, higher quality
- `text-embedding-ada-002` - 1536 dimensions, legacy

**Xenova Models (Local):**
- `Xenova/all-MiniLM-L6-v2` - 384 dimensions, fast
- `Xenova/all-mpnet-base-v2` - 768 dimensions, balanced

## Performance

### Benchmarks

| Operation | Time | Throughput |
|-----------|------|------------|
| Single embedding (OpenAI) | ~200ms | 5/sec |
| Batch 10 (OpenAI) | ~500ms | 20/sec |
| Single embedding (Xenova) | ~50ms | 20/sec |
| Batch 10 (Xenova) | ~200ms | 50/sec |
| Vector search (1000 vectors) | ~10ms | 100/sec |

### Cache Performance

- Cache hit: ~1ms (200x faster)
- Cache size: Configurable (default: 1000 entries)
- Eviction: LRU (Least Recently Used)

## Examples

### Basic Usage

```typescript
import { createEmbeddingManager } from '@weave-nn/weaver/embeddings';

const manager = createEmbeddingManager('./data/embeddings.db', 'openai');

// Generate single embedding
const response = await manager.generateAndStore({
  text: 'Hello, world!',
  chunkId: 'chunk-1'
});

console.log(`Embedding ID: ${response.embedding.id}`);
console.log(`Dimensions: ${response.embedding.dimensions}`);
```

### Batch Processing

```typescript
const chunks = [
  { id: 'chunk-1', content: 'First chunk' },
  { id: 'chunk-2', content: 'Second chunk' },
  { id: 'chunk-3', content: 'Third chunk' }
];

const requests = chunks.map(chunk => ({
  text: chunk.content,
  chunkId: chunk.id
}));

const responses = await manager.generateAndStoreBatch(requests);
console.log(`Generated ${responses.length} embeddings`);
```

### Semantic Search

```typescript
import { createSimilaritySearch } from '@weave-nn/weaver/embeddings';

const search = createSimilaritySearch('./data/embeddings.db', generator);

const results = await search.searchSemantic('machine learning basics', {
  limit: 5,
  minScore: 0.7
});

results.forEach(result => {
  console.log(`Chunk: ${result.chunkId}`);
  console.log(`Similarity: ${result.similarity.toFixed(3)}`);
});
```

### Local Embeddings (No API Key)

```typescript
const manager = createEmbeddingManager(
  './data/embeddings.db',
  'xenova',
  'Xenova/all-MiniLM-L6-v2'
);

// Works offline!
const response = await manager.generateAndStore({
  text: 'No internet needed',
  chunkId: 'offline-1'
});
```

## Error Handling

```typescript
import { EmbeddingManagerError } from '@weave-nn/weaver/embeddings';

try {
  await manager.generateAndStore(request);
} catch (error) {
  if (error instanceof EmbeddingManagerError) {
    console.error('Embedding error:', error.message);
    console.error('Cause:', error.cause);
  }
}
```

## Best Practices

1. **Use caching** for repeated queries
2. **Batch processing** for >5 embeddings
3. **Choose appropriate model** based on use case:
   - Small projects: Xenova (local, free)
   - Production: OpenAI (higher quality)
4. **Monitor costs** with OpenAI (track usage stats)
5. **Close resources** when done
6. **Handle errors** gracefully

## See Also

- [Chunking API](./chunking-api.md) - Document chunking
- [Semantic Search Guide](../user-guide/semantic-search-guide.md) - User guide
- [Knowledge Graph API](./knowledge-graph-api.md) - Graph integration
