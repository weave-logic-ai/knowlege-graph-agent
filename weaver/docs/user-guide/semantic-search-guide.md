# Semantic Search Guide

## Overview

Learn how to use Weaver's semantic search capabilities to find relevant information using meaning rather than just keywords.

## What is Semantic Search?

Traditional keyword search looks for exact word matches. Semantic search understands **meaning** and finds conceptually similar content even if the words are different.

**Example:**
- Query: "authentication methods"
- Keyword search finds: Documents with "authentication" AND "methods"
- Semantic search finds: Documents about "login", "OAuth", "JWT", "credentials", "user verification"

## Quick Start

### 1. Setup

```bash
cd weaver
npm install
```

### 2. Configure API Key (Optional)

For OpenAI embeddings (recommended for production):

```bash
export OPENAI_API_KEY=sk-...
```

For local embeddings (no API key needed):
```bash
# Uses Xenova/Transformers.js automatically
```

### 3. Index Your Documents

```typescript
import { createChunkManager } from '@weave-nn/weaver/chunking';
import { createEmbeddingManager } from '@weave-nn/weaver/embeddings';

const chunkManager = createChunkManager('./data/chunks.db');
const embeddingManager = createEmbeddingManager(
  './data/embeddings.db',
  'openai'  // or 'xenova' for local
);

// Read and chunk document
const content = await fs.readFile('./docs/guide.md', 'utf-8');
const response = await chunkManager.processDocument({
  content,
  sourcePath: './docs/guide.md'
});

// Generate embeddings
const requests = response.result.chunks.map(chunk => ({
  text: chunk.content,
  chunkId: chunk.id,
  metadata: { docId: chunk.docId }
}));

await embeddingManager.generateAndStoreBatch(requests);

console.log(`Indexed ${response.result.chunks.length} chunks`);
```

### 4. Search

```typescript
import { createSimilaritySearch } from '@weave-nn/weaver/embeddings';

const search = createSimilaritySearch('./data/embeddings.db', generator);

const results = await search.searchSemantic('How do I authenticate users?', {
  limit: 5,
  minScore: 0.7
});

results.forEach(result => {
  console.log(`\nChunk: ${result.chunkId}`);
  console.log(`Similarity: ${(result.similarity * 100).toFixed(1)}%`);
  console.log(`Content: ${result.metadata.content?.substring(0, 200)}...`);
});
```

## How It Works

```
┌──────────────┐
│ Your Query   │
│ "auth users" │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Embedding   │  Convert to vector
│  Generator   │  [0.12, -0.45, 0.78, ...]
└──────┬───────┘
       │
       ▼
┌──────────────┐
│   Vector     │  Compare with stored
│   Storage    │  document vectors
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Similar      │  Return most similar
│ Documents    │  chunks (by cosine similarity)
└──────────────┘
```

## Use Cases

### 1. Documentation Search

Find relevant documentation using natural language:

```typescript
// User asks: "How do I connect to database?"
const results = await search.searchSemantic('database connection', {
  limit: 3,
  filters: { docType: 'documentation' }
});
```

### 2. Code Search

Find similar code patterns:

```typescript
// Find authentication examples
const results = await search.searchSemantic('user login authentication', {
  limit: 5,
  filters: { contentType: 'code' }
});
```

### 3. Knowledge Retrieval

Retrieve relevant context for AI assistants:

```typescript
// Get context for answering question
const context = await search.searchSemantic(
  userQuestion,
  { limit: 10, minScore: 0.6 }
);

const prompt = `
Context:
${context.map(r => r.metadata.content).join('\n\n')}

Question: ${userQuestion}
`;
```

### 4. Duplicate Detection

Find similar or duplicate content:

```typescript
const newContent = "Guide to JWT authentication";

const similar = await search.searchSemantic(newContent, {
  limit: 5,
  minScore: 0.9  // Very high threshold for duplicates
});

if (similar.length > 0) {
  console.log('Possible duplicates found!');
}
```

## Advanced Features

### Hybrid Search

Combine semantic search with keyword search:

```typescript
const results = await search.searchHybrid('machine learning', {
  limit: 10,
  semanticWeight: 0.7,    // 70% semantic
  keywordWeight: 0.3,     // 30% keyword
  minScore: 0.6
});
```

**When to use:**
- **Semantic only**: Natural language queries, concept search
- **Hybrid**: When you want both meaning AND specific keywords
- **Keyword only**: Exact term matching (names, IDs, technical terms)

### Filtering

Filter results by metadata:

```typescript
const results = await search.searchSemantic('authentication', {
  limit: 5,
  filters: {
    docType: 'tutorial',
    language: 'typescript',
    createdAfter: '2024-01-01'
  }
});
```

### Batch Search

Search multiple queries efficiently:

```typescript
const queries = [
  'authentication',
  'database queries',
  'error handling'
];

const allResults = await Promise.all(
  queries.map(q => search.searchSemantic(q, { limit: 3 }))
);

queries.forEach((query, i) => {
  console.log(`\nResults for: ${query}`);
  allResults[i]?.forEach(r => {
    console.log(`- ${r.chunkId}: ${r.similarity.toFixed(3)}`);
  });
});
```

## Configuration

### Similarity Threshold

Control result quality:

```typescript
// Strict (high precision, fewer results)
const strict = await search.searchSemantic(query, { minScore: 0.8 });

// Balanced
const balanced = await search.searchSemantic(query, { minScore: 0.7 });

// Lenient (high recall, more results)
const lenient = await search.searchSemantic(query, { minScore: 0.5 });
```

**Guidelines:**
- **0.9+**: Nearly identical content
- **0.8-0.9**: Very similar
- **0.7-0.8**: Similar topic
- **0.6-0.7**: Related content
- **<0.6**: Potentially irrelevant

### Result Limit

Balance between comprehensiveness and performance:

```typescript
// Quick overview
const quick = await search.searchSemantic(query, { limit: 3 });

// Comprehensive
const comprehensive = await search.searchSemantic(query, { limit: 20 });
```

### Model Selection

Choose embedding model based on needs:

```typescript
// Fast and cost-effective (1536 dimensions)
const fastManager = createEmbeddingManager(
  './data/embeddings.db',
  'openai',
  'text-embedding-3-small'
);

// Higher quality (3072 dimensions)
const qualityManager = createEmbeddingManager(
  './data/embeddings.db',
  'openai',
  'text-embedding-3-large'
);

// Local, no API key (384 dimensions)
const localManager = createEmbeddingManager(
  './data/embeddings.db',
  'xenova',
  'Xenova/all-MiniLM-L6-v2'
);
```

## Best Practices

### 1. Index Strategically

```typescript
// Good: Chunk before embedding
const chunks = await chunkManager.processDocument({
  content: longDocument,
  sourcePath: './long-doc.md',
  config: {
    maxChunkSize: 500  // Manageable chunk size
  }
});

// Bad: Embed entire document (too large)
await embeddingManager.generateAndStore({
  text: entireBook,  // ❌ Too large!
  chunkId: 'book-1'
});
```

### 2. Use Batch Processing

```typescript
// Good: Batch processing
const requests = chunks.map(chunk => ({
  text: chunk.content,
  chunkId: chunk.id
}));
await embeddingManager.generateAndStoreBatch(requests);

// Bad: Sequential processing
for (const chunk of chunks) {
  await embeddingManager.generateAndStore({  // ❌ Slow!
    text: chunk.content,
    chunkId: chunk.id
  });
}
```

### 3. Monitor Performance

```typescript
const stats = embeddingManager.getStats();

console.log('Performance:');
console.log(`- Cache hit rate: ${
  (stats.cacheHits / (stats.cacheHits + stats.cacheMisses) * 100).toFixed(1)
}%`);
console.log(`- Total embeddings: ${stats.totalEmbeddings}`);
console.log(`- Providers: ${JSON.stringify(stats.providers)}`);
```

### 4. Handle Errors Gracefully

```typescript
try {
  const results = await search.searchSemantic(query);
} catch (error) {
  if (error.message.includes('API key')) {
    console.log('Falling back to local embeddings...');
    // Switch to Xenova
  } else {
    console.error('Search failed:', error);
  }
}
```

## Troubleshooting

### No Results Found

**Problem:** Semantic search returns empty results.

**Solutions:**
1. Lower similarity threshold: `minScore: 0.5`
2. Check if documents are indexed
3. Try different query phrasing
4. Use hybrid search instead

### Low Similarity Scores

**Problem:** All results have low similarity (<0.5).

**Solutions:**
1. Ensure embeddings use same model
2. Re-index documents with better chunking
3. Add more diverse content to index
4. Use keyword search as fallback

### Slow Search

**Problem:** Search takes too long.

**Solutions:**
1. Reduce result limit
2. Add filters to narrow search space
3. Use smaller embedding model
4. Optimize database (VACUUM, ANALYZE)

### API Rate Limits

**Problem:** OpenAI API rate limits exceeded.

**Solutions:**
1. Use caching: `useCache: true`
2. Batch requests properly
3. Switch to local embeddings (Xenova)
4. Upgrade OpenAI tier

## Examples

### Complete Workflow

```typescript
import { createChunkManager } from '@weave-nn/weaver/chunking';
import { createEmbeddingManager, createSimilaritySearch } from '@weave-nn/weaver/embeddings';
import fs from 'fs/promises';

// 1. Initialize
const chunkManager = createChunkManager('./data/chunks.db');
const embeddingManager = createEmbeddingManager('./data/embeddings.db', 'openai');

// 2. Index documents
const files = await fs.readdir('./docs');

for (const file of files) {
  const content = await fs.readFile(`./docs/${file}`, 'utf-8');

  // Chunk
  const response = await chunkManager.processDocument({
    content,
    sourcePath: `./docs/${file}`
  });

  // Embed
  const requests = response.result.chunks.map(chunk => ({
    text: chunk.content,
    chunkId: chunk.id
  }));

  await embeddingManager.generateAndStoreBatch(requests);

  console.log(`Indexed: ${file}`);
}

// 3. Search
const search = createSimilaritySearch('./data/embeddings.db', embeddingManager.getGenerator());

const results = await search.searchSemantic('How to deploy to production?', {
  limit: 5,
  minScore: 0.7
});

// 4. Display results
results.forEach((result, i) => {
  console.log(`\n${i + 1}. Similarity: ${(result.similarity * 100).toFixed(1)}%`);
  console.log(`Chunk: ${result.chunkId}`);
  console.log(`Content: ${result.metadata.content?.substring(0, 300)}...`);
});

// 5. Cleanup
embeddingManager.close();
chunkManager.close();
```

## See Also

- [Embeddings API](../api/embeddings-api.md) - Technical reference
- [Chunking API](../api/chunking-api.md) - Document chunking
- [Knowledge Graph Guide](./knowledge-graph-guide.md) - Document connections
