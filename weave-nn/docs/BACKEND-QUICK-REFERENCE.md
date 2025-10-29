---
title: Backend Systems Quick Reference - Phase 13
type: documentation
status: in-progress
phase_id: PHASE-13
tags:
  - phase/phase-13
  - type/documentation
  - status/in-progress
priority: high
visual:
  icon: "\U0001F4DA"
  color: '#8E8E93'
  cssclasses:
    - document
updated: '2025-10-29T04:55:04.985Z'
keywords:
  - "\U0001F4E6 import paths"
  - 'chunking system:'
  - 'embeddings system:'
  - "\U0001F680 quick start examples"
  - '1. process a document (full pipeline):'
  - '2. search for content:'
  - '3. find similar chunks:'
  - "\U0001F39B️ configuration options"
  - 'chunking strategies:'
  - "\U0001F4CA content type mapping"
---
# Backend Systems Quick Reference - Phase 13

**Quick access guide for the hybrid chunking and embedding systems.**

---

## 📦 Import Paths

### Chunking System:
```typescript
import {
  // Main API
  createChunkManager,
  ChunkManager,

  // Types
  ContentType,
  Chunk,
  ChunkingConfig,
  ChunkingResult,

  // Components
  ChunkStorage,
  StrategySelector,

  // Strategies
  EventBasedChunker,
  SemanticBoundaryChunker,
  PreferenceSignalChunker,
  StepBasedChunker,

  // Utilities
  parseDocument,
  countTokens,
} from './chunking';
```

### Embeddings System:
```typescript
import {
  // Main API
  createEmbeddingManager,
  EmbeddingManager,

  // Types
  Embedding,
  EmbeddingRequest,
  SearchConfig,
  HybridSearchResult,

  // Components
  createSimilaritySearch,
  SimilaritySearch,
  VectorStorage,
  EmbeddingGenerator,
} from './embeddings';
```

---

## 🚀 Quick Start Examples

### 1. Process a Document (Full Pipeline):
```typescript
import { createChunkManager } from './chunking';
import { createEmbeddingManager } from './embeddings';

// Initialize systems
const chunkManager = createChunkManager('./data/chunks.db');
const embeddingManager = createEmbeddingManager(
  './data/embeddings.db',
  'openai',
  'text-embedding-3-small',
  process.env.OPENAI_API_KEY
);

// Read markdown file
const content = await fs.readFile('./path/to/doc.md', 'utf-8');

// Step 1: Chunk the document
const chunkingResponse = await chunkManager.processDocument({
  content,
  sourcePath: './path/to/doc.md',
  contentType: 'episodic', // or 'semantic', 'preference', 'procedural'
});

console.log(`Created ${chunkingResponse.result.chunks.length} chunks`);

// Step 2: Generate embeddings for chunks
const embeddingRequests = chunkingResponse.result.chunks.map(chunk => ({
  text: chunk.content,
  chunkId: chunk.id,
}));

const embeddings = await embeddingManager.generateAndStoreBatch(embeddingRequests);

console.log(`Generated ${embeddings.length} embeddings`);
```

### 2. Search for Content:
```typescript
import { createSimilaritySearch } from './embeddings';

const search = createSimilaritySearch(
  chunkStorage,
  vectorStorage,
  embeddingGenerator
);

// Hybrid search (FTS + vector)
const results = await search.search({
  query: 'How to implement authentication?',
  limit: 10,
  useHybrid: true,
  ftsWeight: 0.3,
  vectorWeight: 0.7,
  similarityThreshold: 0.7,
});

results.forEach(result => {
  console.log(`Score: ${result.combinedScore.toFixed(3)}`);
  console.log(`Content: ${result.content.substring(0, 100)}...`);
  console.log('---');
});
```

### 3. Find Similar Chunks:
```typescript
// Find chunks similar to a specific chunk
const similarChunks = await search.findSimilarChunks(
  'chunk-id-here',
  5,  // limit
  0.8 // similarity threshold
);
```

---

## 🎛️ Configuration Options

### Chunking Strategies:

#### Event-Based (Episodic Memory):
```typescript
{
  eventBoundaries: 'phase-transition' | 'task-start' | 'task-end',
  temporalLinks: true,
  includeContext: true,
  contextWindowSize: 50,
}
```

#### Semantic Boundary (Semantic Memory):
```typescript
{
  maxTokens: 384,
  similarityThreshold: 0.75,
  minChunkSize: 128,
  includeContext: true,
  contextWindowSize: 50,
}
```

#### Preference Signal (Preference Memory):
```typescript
{
  maxTokens: 128,
  decisionKeywords: ['selected plan', 'satisfaction rating', 'preference'],
  includeAlternatives: true,
}
```

#### Step-Based (Procedural Memory):
```typescript
{
  maxTokens: 384,
  stepDelimiters: ['##', '###', '1.', '2.', '3.'],
  includePrerequisites: true,
  includeOutcomes: true,
}
```

---

## 📊 Content Type Mapping

| Content Type | Use Case | Chunking Strategy | Example |
|--------------|----------|-------------------|---------|
| `episodic` | Task execution logs | Event-based | Learning session transcripts |
| `semantic` | Reflections, insights | Semantic boundary | User reflections, patterns |
| `preference` | User decisions | Preference signal | A/B test results, feedback |
| `procedural` | Step-by-step guides | Step-based | SOPs, tutorials, workflows |
| `working` | Active context | No chunking | Temporary working memory |
| `document` | General docs | PPL-based (Phase 2) | Articles, documentation |

---

## 🔍 Search Strategies

### Full-Text Search (FTS5):
```typescript
const chunks = chunkManager.searchChunks('authentication', 10);
```

### Vector Similarity Search:
```typescript
const similar = vectorStorage.findSimilar(queryVector, 10, 0.7);
```

### Hybrid Search (Recommended):
```typescript
const results = await search.search({
  query: 'authentication',
  useHybrid: true,
  ftsWeight: 0.3,    // 30% FTS
  vectorWeight: 0.7,  // 70% vector similarity
});
```

---

## 📈 Performance Tips

### 1. Batch Processing:
```typescript
// ❌ Slow: Process one at a time
for (const chunk of chunks) {
  await embeddingManager.generateAndStore({ text: chunk.content });
}

// ✅ Fast: Batch processing
const requests = chunks.map(chunk => ({ text: chunk.content, chunkId: chunk.id }));
await embeddingManager.generateAndStoreBatch(requests);
```

### 2. Use Caching:
```typescript
// Cache is enabled by default
const manager = createEmbeddingManager(
  dbPath,
  'openai',
  'text-embedding-3-small',
  apiKey,
  1000 // Max cache size
);

// Check cache stats
const stats = manager.getStats();
console.log(`Cache hit rate: ${stats.cacheHits / (stats.cacheHits + stats.cacheMisses)}`);
```

### 3. Optimize Search:
```typescript
// Use smaller result sets
const results = await search.search({
  query: 'authentication',
  limit: 5,  // Only get top 5 results
  similarityThreshold: 0.8,  // Higher threshold = fewer results
});
```

---

## 🛠️ Utilities

### Token Counting:
```typescript
import { countTokens, truncateToTokens } from './chunking';

const tokens = countTokens(text);
const truncated = truncateToTokens(text, 512);
```

### Document Parsing:
```typescript
import { parseDocument, extractMetadata } from './chunking';

const parsed = parseDocument(markdownContent);
const metadata = extractMetadata(parsed);

console.log(metadata.title);
console.log(metadata.tags);
console.log(metadata.contentType);
```

### Statistics:
```typescript
// Chunking stats
const chunkStats = chunkManager.getStats();
console.log(`Total chunks: ${chunkStats.totalChunks}`);
console.log(`Total docs: ${chunkStats.totalDocs}`);

// Embedding stats
const embeddingStats = embeddingManager.getStats();
console.log(`Total embeddings: ${embeddingStats.totalEmbeddings}`);
console.log(`Cache hit rate: ${embeddingStats.cacheHits / (embeddingStats.cacheHits + embeddingStats.cacheMisses)}`);
```

---

## 🔧 Troubleshooting

### Common Issues:

**1. "OpenAI API key not configured"**
```typescript
// Solution: Set environment variable or pass directly
const manager = createEmbeddingManager(
  dbPath,
  'openai',
  'text-embedding-3-small',
  process.env.OPENAI_API_KEY || 'your-api-key'
);
```

**2. "No chunks found"**
```typescript
// Check if document was processed
const chunks = chunkManager.getChunks(docId);
if (chunks.length === 0) {
  console.log('No chunks found. Did you call processDocument()?');
}
```

**3. "No embedding found for chunk"**
```typescript
// Check if embeddings were generated
const embedding = embeddingManager.getEmbedding(chunkId);
if (!embedding) {
  await embeddingManager.generateAndStore({
    text: chunk.content,
    chunkId: chunk.id,
  });
}
```

---

## 🧪 Testing Helpers

```typescript
// Clean up test data
chunkManager.deleteChunks(docId);
embeddingManager.clearCache();
chunkManager.close();
embeddingManager.close();
```

---

## 📁 File Locations

- **Chunking**: `/weaver/src/chunking/`
- **Embeddings**: `/weaver/src/embeddings/`
- **Databases**: `./data/chunks.db`, `./data/embeddings.db`
- **Tests**: `/weaver/tests/chunking/`, `/weaver/tests/embeddings/`
- **Docs**: `/weave-nn/docs/BACKEND-*.md`

---

## 🔗 Related Documentation

- [BACKEND-IMPLEMENTATION-COMPLETE.md](./BACKEND-IMPLEMENTATION-COMPLETE.md) - Full implementation details
- [CHUNKING-IMPLEMENTATION-DESIGN.md](./CHUNKING-IMPLEMENTATION-DESIGN.md) - Design specifications
- [CHUNKING-STRATEGY-SYNTHESIS.md](./CHUNKING-STRATEGY-SYNTHESIS.md) - Research synthesis

---

**Last Updated**: 2025-10-28
**Status**: ✅ Production Ready
