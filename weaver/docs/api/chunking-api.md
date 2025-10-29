# Chunking API Documentation

## Overview

The Chunking API provides intelligent document segmentation using four memorographic chunking strategies inspired by human memory formation.

## Architecture

```
┌─────────────────────────┐
│   ChunkManager          │
│   - Orchestration       │
│   - Strategy Selection  │
└───────────┬─────────────┘
            │
    ┌───────┴────────┐
    │                │
┌───▼────────┐  ┌───▼────────┐
│  Chunkers  │  │  Storage   │
│  - Event   │  │  - SQLite  │
│  - Semantic│  │  - FTS5    │
│  - Prefer  │  │  - Rels    │
│  - Step    │  │            │
└────────────┘  └────────────┘
```

## Chunking Strategies

### 1. Event-Based Chunking (Default)

Mimics **episodic memory** - chunks based on meaningful events and boundaries.

**Best for:** Narratives, tutorials, documentation with clear sections

```typescript
import { EventBasedChunker } from '@weave-nn/weaver/chunking';

const chunker = new EventBasedChunker();
const result = await chunker.chunk(content, {
  docId: 'doc-123',
  sourcePath: './docs/tutorial.md',
  minChunkSize: 100,
  maxChunkSize: 1000,
  boundaryTypes: ['heading', 'paragraph', 'code']
});

console.log(result.chunks.length);     // 15
console.log(result.stats.avgSize);     // 450
```

**Features:**
- Detects headings, paragraphs, code blocks, lists
- Preserves structural boundaries
- Maintains context with overlap
- Handles nested sections

### 2. Semantic Boundary Chunking

Mimics **semantic memory** - chunks based on meaning shifts.

**Best for:** Academic papers, technical documents, conceptual content

```typescript
import { SemanticBoundaryChunker } from '@weave-nn/weaver/chunking';

const chunker = new SemanticBoundaryChunker();
const result = await chunker.chunk(content, {
  docId: 'doc-456',
  sourcePath: './papers/ml-research.md',
  similarityThreshold: 0.3,  // Lower = more boundaries
  minChunkSize: 200,
  maxChunkSize: 800
});

// Chunks split where meaning shifts significantly
```

**Features:**
- Jaccard & cosine similarity analysis
- Detects topic shifts
- Preserves conceptual coherence
- Context-aware boundaries

### 3. Preference Signal Chunking

Mimics **emotional memory** - prioritizes important/relevant content.

**Best for:** User feedback, reviews, preference-rich content

```typescript
import { PreferenceSignalChunker } from '@weave-nn/weaver/chunking';

const chunker = new PreferenceSignalChunker();
const result = await chunker.chunk(content, {
  docId: 'doc-789',
  sourcePath: './reviews/user-feedback.md',
  minChunkSize: 50,
  maxChunkSize: 500,
  preferenceThreshold: 0.6  // Importance threshold
});

// Chunks with high emotional/preference signals prioritized
```

**Features:**
- Detects sentiment markers
- Prioritizes important content
- Applies memory decay simulation
- Tags chunks with preference scores

### 4. Step-Based Chunking

Mimics **procedural memory** - chunks by sequential steps.

**Best for:** Workflows, recipes, instructions, SOPs

```typescript
import { StepBasedChunker } from '@weave-nn/weaver/chunking';

const chunker = new StepBasedChunker();
const result = await chunker.chunk(content, {
  docId: 'doc-101',
  sourcePath: './workflows/deployment.md',
  minChunkSize: 100,
  maxChunkSize: 600
});

// Each step becomes a chunk with sequential ordering
```

**Features:**
- Detects numbered steps, bullets, ordered lists
- Maintains step dependencies
- Preserves procedural flow
- Links previous/next chunks

## Core API

### ChunkManager

High-level orchestration with automatic strategy selection.

#### Constructor

```typescript
import { createChunkManager } from '@weave-nn/weaver/chunking';

const manager = createChunkManager('./data/chunks.db');
```

#### Methods

##### `processDocument(request)`

Process a document and create chunks.

```typescript
const response = await manager.processDocument({
  content: documentContent,
  sourcePath: './docs/guide.md',
  contentType: 'documentation',  // Auto-detected if omitted
  config: {
    minChunkSize: 100,
    maxChunkSize: 1000,
    overlap: 50
  }
});

console.log(response.result.chunks.length);
console.log(response.result.stats);
console.log(response.metadata.contentType);
```

**Parameters:**
- `request: ChunkingRequest`
  - `content: string` - Document content (required)
  - `sourcePath: string` - Source file path (required)
  - `contentType?: ContentType` - Content type (auto-detected)
  - `config?: ChunkingConfig` - Chunking configuration

**Returns:** `Promise<ChunkingResponse>`

##### `getChunks(docId)`

Retrieve chunks for a document.

```typescript
const chunks = manager.getChunks('doc-123');

chunks.forEach(chunk => {
  console.log(`Chunk ${chunk.id}: ${chunk.content.length} chars`);
  console.log(`Position: ${chunk.metadata.position}`);
});
```

##### `searchChunks(query, limit?)`

Full-text search across chunks (SQLite FTS5).

```typescript
const results = manager.searchChunks('machine learning', 10);

results.forEach(chunk => {
  console.log(chunk.content);
  console.log(`Relevance: ${chunk.metadata.relevance}`);
});
```

##### `deleteChunks(docId)`

Delete all chunks for a document.

```typescript
manager.deleteChunks('doc-123');
```

##### `getStats()`

Get chunking statistics.

```typescript
const stats = manager.getStats();

console.log(stats);
// {
//   totalChunks: 1500,
//   totalDocs: 45,
//   totalRelationships: 3200,
//   dbSize: 15728640  // bytes
// }
```

##### `getAvailableStrategies()`

Get available chunking strategies.

```typescript
const strategies = manager.getAvailableStrategies();
// ['event', 'semantic', 'preference', 'step', 'document']
```

##### `close()`

Close manager and release resources.

```typescript
manager.close();
```

## Types

### Chunk

```typescript
interface Chunk {
  id: string;                    // Unique identifier
  docId: string;                 // Document ID
  content: string;               // Chunk content
  metadata: ChunkMetadata;       // Rich metadata
}
```

### ChunkMetadata

```typescript
interface ChunkMetadata {
  // Core
  source_path: string;
  content_type: ContentType;
  position: number;              // Chunk index
  total_chunks: number;

  // Size
  char_count: number;
  word_count: number;
  token_count: number;

  // Boundaries
  boundary_type: BoundaryType;
  boundary_strength: number;     // 0-1

  // Relationships
  parent_chunk?: string;
  child_chunks?: string[];
  previous_chunk?: string;
  next_chunk?: string;
  related_chunks?: string[];

  // Context
  context_before?: string;
  context_after?: string;
  summary?: string;

  // Memory levels (for memorographic strategies)
  memory_level?: MemoryLevel;    // 'sensory' | 'working' | 'longterm'
  decay_function?: DecayFunction;
  learning_stage?: LearningStage;

  // Preferences (for preference-based chunking)
  preference_score?: number;
  importance?: number;
  emotional_valence?: number;

  // Tags
  tags?: string[];

  // Timestamps
  created_at: number;
  updated_at?: number;
}
```

### ContentType

```typescript
type ContentType =
  | 'documentation'
  | 'code'
  | 'narrative'
  | 'academic'
  | 'conversation'
  | 'workflow'
  | 'document';
```

### ChunkingConfig

```typescript
interface ChunkingConfig {
  docId: string;
  sourcePath: string;

  // Size constraints
  minChunkSize?: number;         // Default: 100
  maxChunkSize?: number;         // Default: 1000
  targetChunkSize?: number;      // Preferred size
  overlap?: number;              // Overlap in chars

  // Boundaries
  boundaryTypes?: BoundaryType[];

  // Strategy-specific
  similarityThreshold?: number;  // Semantic: 0-1
  preferenceThreshold?: number;  // Preference: 0-1

  // Memory levels
  memoryLevel?: MemoryLevel;
  decayFunction?: DecayFunction;
  learningStage?: LearningStage;
}
```

### ChunkingResult

```typescript
interface ChunkingResult {
  chunks: Chunk[];
  stats: ChunkingStats;
  validation: ValidationResult;
}
```

### ChunkingStats

```typescript
interface ChunkingStats {
  totalChunks: number;
  avgSize: number;
  minSize: number;
  maxSize: number;
  totalTokens: number;
  boundaryTypes: Record<BoundaryType, number>;
  memoryLevels?: Record<MemoryLevel, number>;
}
```

## Strategy Selection

The `ChunkManager` automatically selects the best strategy based on content type:

| Content Type | Strategy | Reasoning |
|--------------|----------|-----------|
| `documentation` | Event-based | Structured sections |
| `code` | Event-based | Function/class boundaries |
| `narrative` | Event-based | Story flow |
| `academic` | Semantic | Conceptual coherence |
| `conversation` | Preference | Emotional signals |
| `workflow` | Step-based | Sequential procedures |
| `document` | Event-based | General structure |

**Override strategy:**

```typescript
import { SemanticBoundaryChunker } from '@weave-nn/weaver/chunking';

const chunker = new SemanticBoundaryChunker();
const result = await chunker.chunk(content, config);
```

## Configuration

### Environment Variables

```bash
CHUNKS_DB_PATH=./data/chunks.db
MIN_CHUNK_SIZE=100
MAX_CHUNK_SIZE=1000
CHUNK_OVERLAP=50
```

### Per-Request Configuration

```typescript
const response = await manager.processDocument({
  content,
  sourcePath: './doc.md',
  config: {
    minChunkSize: 200,      // Override default
    maxChunkSize: 800,
    overlap: 100,
    boundaryTypes: ['heading', 'paragraph']
  }
});
```

## Performance

### Benchmarks

| Operation | Time | Throughput |
|-----------|------|------------|
| Event chunking (10KB) | ~50ms | 200KB/sec |
| Semantic chunking (10KB) | ~150ms | 67KB/sec |
| Preference chunking (10KB) | ~100ms | 100KB/sec |
| Step chunking (10KB) | ~40ms | 250KB/sec |
| FTS5 search (1000 chunks) | ~20ms | 50 queries/sec |
| Storage (SQLite) | ~5ms/chunk | 200 chunks/sec |

## Examples

### Basic Document Processing

```typescript
import { createChunkManager } from '@weave-nn/weaver/chunking';

const manager = createChunkManager('./data/chunks.db');

const response = await manager.processDocument({
  content: await fs.readFile('./guide.md', 'utf-8'),
  sourcePath: './guide.md'
});

console.log(`Created ${response.result.chunks.length} chunks`);
console.log(`Average size: ${response.result.stats.avgSize} chars`);
```

### Custom Strategy

```typescript
import { SemanticBoundaryChunker } from '@weave-nn/weaver/chunking';

const chunker = new SemanticBoundaryChunker();

const result = await chunker.chunk(content, {
  docId: 'research-paper-1',
  sourcePath: './papers/ml-survey.md',
  minChunkSize: 300,
  maxChunkSize: 1200,
  similarityThreshold: 0.25  // More sensitive to topic shifts
});

// Analyze chunk relationships
result.chunks.forEach((chunk, i) => {
  const next = chunk.metadata.next_chunk;
  if (next) {
    console.log(`Chunk ${i} -> ${next}`);
  }
});
```

### Workflow Processing

```typescript
import { StepBasedChunker } from '@weave-nn/weaver/chunking';

const chunker = new StepBasedChunker();

const workflow = `
# Deployment Workflow

1. Build the application
2. Run tests
3. Create Docker image
4. Push to registry
5. Deploy to production
`;

const result = await chunker.chunk(workflow, {
  docId: 'deploy-workflow',
  sourcePath: './workflows/deploy.md'
});

// Each step is a chunk with sequential links
result.chunks.forEach(chunk => {
  console.log(`Step ${chunk.metadata.position}: ${chunk.content}`);
});
```

### Full-Text Search

```typescript
const results = manager.searchChunks('kubernetes deployment', 5);

results.forEach(chunk => {
  console.log(`\n--- Chunk ${chunk.id} ---`);
  console.log(`Source: ${chunk.metadata.source_path}`);
  console.log(`Content: ${chunk.content.substring(0, 200)}...`);
});
```

### Relationship Traversal

```typescript
const chunks = manager.getChunks('doc-123');

// Find chunk with specific content
const targetChunk = chunks.find(c => c.content.includes('authentication'));

if (targetChunk) {
  // Get previous context
  if (targetChunk.metadata.previous_chunk) {
    const prev = chunks.find(c => c.id === targetChunk.metadata.previous_chunk);
    console.log('Previous:', prev?.content);
  }

  // Get child chunks (nested sections)
  if (targetChunk.metadata.child_chunks) {
    targetChunk.metadata.child_chunks.forEach(childId => {
      const child = chunks.find(c => c.id === childId);
      console.log('Child:', child?.content);
    });
  }
}
```

## Error Handling

```typescript
import { ChunkingError } from '@weave-nn/weaver/chunking';

try {
  await manager.processDocument(request);
} catch (error) {
  if (error instanceof ChunkingError) {
    console.error('Chunking failed:', error.message);
    console.error('Cause:', error.cause);
  }
}
```

## Best Practices

1. **Choose appropriate strategy** based on content type
2. **Set reasonable size limits** (100-1000 chars is typical)
3. **Use overlap** for context preservation (10-20% of chunk size)
4. **Leverage relationships** for context-aware retrieval
5. **Index chunks** with embeddings for semantic search
6. **Clean up** deleted documents to avoid orphaned chunks
7. **Monitor storage** as FTS5 indexes grow with data

## Integration

### With Embeddings

```typescript
import { createChunkManager } from '@weave-nn/weaver/chunking';
import { createEmbeddingManager } from '@weave-nn/weaver/embeddings';

const chunkManager = createChunkManager('./data/chunks.db');
const embeddingManager = createEmbeddingManager('./data/embeddings.db');

// Process document
const response = await chunkManager.processDocument({
  content: documentContent,
  sourcePath: './doc.md'
});

// Generate embeddings for chunks
const requests = response.result.chunks.map(chunk => ({
  text: chunk.content,
  chunkId: chunk.id,
  metadata: { docId: chunk.docId }
}));

await embeddingManager.generateAndStoreBatch(requests);
```

## See Also

- [Embeddings API](./embeddings-api.md) - Semantic embeddings
- [Knowledge Graph API](./knowledge-graph-api.md) - Document connections
- [Semantic Search Guide](../user-guide/semantic-search-guide.md) - User guide
