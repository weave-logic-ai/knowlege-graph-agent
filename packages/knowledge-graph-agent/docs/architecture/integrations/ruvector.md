---
title: RuVector Semantic Search Integration Architecture
version: 1.0.0
status: active
category: integration
created: 2025-12-29
updated: 2025-12-29
author: Architecture Agent
dependencies:
  - ruvector
  - "@ruvector/core"
  - "@ruvector/sona"
related:
  - ../../RUVECTOR-USAGE.md
  - ../../WORKFLOW-VECTOR-INTEGRATION.md
---

# RuVector Semantic Search Integration Architecture

This document describes the architecture for integrating RuVector's high-performance vector database with the Knowledge Graph Agent, enabling semantic search, trajectory tracking, and self-learning capabilities.

---

## 1. Purpose and Benefits

### 1.1 Why RuVector

RuVector is a high-performance vector database that provides significant advantages over traditional SQLite-based similarity search:

| Capability | SQLite Baseline | RuVector | Improvement |
|------------|-----------------|----------|-------------|
| Vector search latency | ~50ms | ~0.06ms (61us p50) | **833x faster** |
| Index type | Linear scan | HNSW | Logarithmic scaling |
| Hybrid search | Manual join | Native support | Built-in |
| Self-learning | None | SONA engine | Automatic optimization |
| Trajectory tracking | None | Built-in | Pattern learning |

### 1.2 Core Benefits

1. **Semantic Search**: Find documents and nodes by meaning rather than exact keyword matches
2. **HNSW Indexing**: Fast approximate nearest neighbor search with configurable accuracy/speed tradeoffs
3. **Hybrid Search**: Combine vector similarity with keyword matching and graph queries
4. **Trajectory Tracking**: Record agent operation sequences for pattern learning
5. **Self-Learning (SONA)**: Automatically learn from successful agent workflows

---

## 2. Vector Store Architecture

### 2.1 High-Level Architecture

```
+-------------------------------------------------------------------------+
|                        RUVECTOR INTEGRATION                              |
+-------------------------------------------------------------------------+
|                                                                          |
|  +-------------------+     +----------------------+     +-------------+  |
|  |   Embedding       |     |     Vector Index     |     |   Graph     |  |
|  |   Generator       |---->|     (HNSW)          |<--->|   Database  |  |
|  +-------------------+     +----------------------+     +-------------+  |
|                                     |                         |          |
|                                     v                         v          |
|                            +------------------+      +--------------+    |
|                            |  Hybrid Search   |      |   Cypher     |    |
|                            |  Engine          |      |   Queries    |    |
|                            +------------------+      +--------------+    |
|                                     |                                    |
|                                     v                                    |
|                            +------------------+                          |
|                            |  Result Ranking  |                          |
|                            |  & Fusion        |                          |
|                            +------------------+                          |
|                                                                          |
|  +-------------------------------------------------------------------+  |
|  |                     SONA SELF-LEARNING ENGINE                      |  |
|  |                                                                     |  |
|  |  +----------------+  +------------------+  +-------------------+    |  |
|  |  | Trajectory     |  |  Pattern         |  |  Recommendation   |    |  |
|  |  | Tracker        |  |  Detector        |  |  Engine           |    |  |
|  |  +----------------+  +------------------+  +-------------------+    |  |
|  +-------------------------------------------------------------------+  |
|                                                                          |
+-------------------------------------------------------------------------+
```

### 2.2 Component Details

```
+------------------------------------------------------------------+
|                      VECTOR INDEX (HNSW)                          |
+------------------------------------------------------------------+
|                                                                   |
|  Configuration:                                                   |
|  +------------------------------------------------------------+  |
|  | dimensions: 384-3072 (model dependent)                      |  |
|  | distanceMetric: 'cosine' | 'euclidean' | 'dot'             |  |
|  | indexType: 'hnsw'                                           |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  HNSW Parameters:                                                 |
|  +------------------------------------------------------------+  |
|  | m: 16          | Max connections per node                   |  |
|  | efConstruction: 200  | Build-time candidate list size      |  |
|  | efSearch: 100  | Search-time candidate list size           |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  Structure:                                                       |
|  +------------------------------------------------------------+  |
|  |                                                              |  |
|  |  Layer 3 (sparse)    *---*                                  |  |
|  |                      |   |                                  |  |
|  |  Layer 2 (medium)  *-*---*-*                                |  |
|  |                    | |   | |                                |  |
|  |  Layer 1 (dense)  *-*-*-*-*-*                               |  |
|  |                   |||||||||                                  |  |
|  |  Layer 0 (all)   **********                                 |  |
|  |                                                              |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### 2.3 Storage Backends

```
+------------------------------------------------------------------+
|                       BACKEND OPTIONS                             |
+------------------------------------------------------------------+
|                                                                   |
|  +------------------+  +------------------+  +------------------+ |
|  |     MEMORY       |  |    POSTGRES      |  |   STANDALONE     | |
|  +------------------+  +------------------+  +------------------+ |
|  |                  |  |                  |  |                  | |
|  | Best for:        |  | Best for:        |  | Best for:        | |
|  | - Development    |  | - Production     |  | - Edge deploy    | |
|  | - Testing        |  | - Scaling        |  | - Embedded use   | |
|  | - Small datasets |  | - Integration    |  | - Offline        | |
|  |                  |  |                  |  |                  | |
|  | Pros:            |  | Pros:            |  | Pros:            | |
|  | - Fastest        |  | - Persistent     |  | - Portable       | |
|  | - No setup       |  | - SQL queries    |  | - No deps        | |
|  |                  |  | - Transactions   |  |                  | |
|  | Cons:            |  | Cons:            |  | Cons:            | |
|  | - Volatile       |  | - Needs server   |  | - File I/O       | |
|  | - Memory limit   |  | - Latency        |  | - Single process | |
|  |                  |  |                  |  |                  | |
|  +------------------+  +------------------+  +------------------+ |
|                                                                   |
|  Environment Variable: RUVECTOR_BACKEND=memory|postgres|standalone|
|                                                                   |
+------------------------------------------------------------------+
```

---

## 3. Trajectory Tracking

### 3.1 Trajectory Architecture

```
+------------------------------------------------------------------+
|                    TRAJECTORY TRACKING                            |
+------------------------------------------------------------------+
|                                                                   |
|  Trajectory Structure:                                            |
|  +------------------------------------------------------------+  |
|  | {                                                            |  |
|  |   "id": "traj-1735484856-abc123",                           |  |
|  |   "agentId": "researcher-1",                                 |  |
|  |   "workflowId": "research-wf-456",                          |  |
|  |   "startedAt": "2025-12-29T12:34:56.000Z",                  |  |
|  |   "completedAt": "2025-12-29T12:35:02.000Z",                |  |
|  |   "success": true,                                           |  |
|  |   "steps": [                                                 |  |
|  |     {                                                        |  |
|  |       "action": "initialize_context",                        |  |
|  |       "state": { "nodeCount": 0 },                          |  |
|  |       "outcome": "success",                                  |  |
|  |       "duration": 124,                                       |  |
|  |       "timestamp": "..."                                     |  |
|  |     },                                                       |  |
|  |     ...                                                      |  |
|  |   ],                                                         |  |
|  |   "metadata": { "priority": "high" }                        |  |
|  | }                                                            |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  Trajectory Flow:                                                 |
|  +--------+  +--------+  +--------+  +--------+  +--------+      |
|  | START  |->| Step 1 |->| Step 2 |->| Step N |->|  END   |      |
|  +--------+  +--------+  +--------+  +--------+  +--------+      |
|       |          |           |           |           |            |
|       v          v           v           v           v            |
|  +------------------------------------------------------------+  |
|  |              State Snapshots & Observations                  |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### 3.2 Step Types

| Step Type | Description | Recorded Data |
|-----------|-------------|---------------|
| `initialize_context` | Session setup | Initial state, configuration |
| `load_knowledge_graph` | Load graph data | Node count, edge count |
| `analyze_document` | Document analysis | Tokens, sections, gaps |
| `extract_entities` | Entity extraction | Entity count, types |
| `build_relationships` | Relationship creation | Edge count, types |
| `search_similar` | Vector search | Query, results, latency |
| `validate_output` | Quality check | Pass/fail, issues |
| `store_results` | Persist changes | Nodes added/updated |

---

## 4. Search Operations

### 4.1 Search Modes

```
+------------------------------------------------------------------+
|                       SEARCH MODES                                |
+------------------------------------------------------------------+
|                                                                   |
|  PURE VECTOR SEARCH                                               |
|  +------------------------------------------------------------+  |
|  |  Query: "machine learning optimization"                      |  |
|  |  Process:                                                    |  |
|  |  1. Generate embedding from query                            |  |
|  |  2. HNSW approximate nearest neighbor search                 |  |
|  |  3. Return top-k by cosine similarity                        |  |
|  |  Latency: ~61us (p50)                                        |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  HYBRID SEARCH                                                    |
|  +------------------------------------------------------------+  |
|  |  Query: "neural network training"                            |  |
|  |  Process:                                                    |  |
|  |  1. Vector similarity search (70% weight)                    |  |
|  |  2. Keyword matching (30% weight)                            |  |
|  |  3. Score fusion and ranking                                 |  |
|  |  Score: combined = (vector * 0.7) + (keyword * 0.3)         |  |
|  +------------------------------------------------------------+  |
|                                                                   |
|  GRAPH-ENHANCED SEARCH                                            |
|  +------------------------------------------------------------+  |
|  |  Query: vector + Cypher filter                               |  |
|  |  Process:                                                    |  |
|  |  1. Vector similarity search (candidates)                    |  |
|  |  2. Cypher query for relationship filtering                  |  |
|  |  3. Merge and re-rank results                                |  |
|  |                                                              |  |
|  |  Example Cypher:                                             |  |
|  |  MATCH (goal:Goal)-[:REQUIRES]->(skill:Skill)               |  |
|  |  WHERE goal.id IN $candidateIds                              |  |
|  |  RETURN goal, skill                                          |  |
|  +------------------------------------------------------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### 4.2 Search API

```typescript
// Vector search interface
interface VectorSearchOptions {
  query: string | Float32Array;
  k: number;
  type?: NodeType;
  hybrid?: boolean;
  minScore?: number;
  namespace?: string;
  includeVectors?: boolean;
}

interface VectorSearchResult {
  id: string;
  score: number;
  distance: number;
  metadata: {
    title?: string;
    type?: string;
    path?: string;
    tags?: string[];
  };
  vector?: Float32Array;
}

// Hybrid search interface
interface HybridSearchOptions extends VectorSearchOptions {
  cypher?: string;
  weights?: {
    vector: number;  // default 0.7
    keyword: number; // default 0.3
  };
}

interface HybridSearchResult extends VectorSearchResult {
  keywordScore?: number;
  graphScore?: number;
  combinedScore: number;
}
```

---

## 5. Configuration

### 5.1 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RUVECTOR_BACKEND` | Storage backend | `memory` |
| `RUVECTOR_DIMENSIONS` | Vector dimensions | `384` |
| `RUVECTOR_ENABLE_SONA` | Enable self-learning | `false` |
| `RUVECTOR_ENABLE_TRAJECTORY` | Enable trajectory tracking | `false` |
| `DATABASE_URL` | PostgreSQL connection (for postgres backend) | - |
| `RUVECTOR_SCHEMA` | PostgreSQL schema | `ruvector` |
| `RUVECTOR_DATA_DIR` | Data directory (for standalone backend) | `.ruvector` |
| `RUVECTOR_CLOUD_URL` | Cloud endpoint URL | - |
| `RUVECTOR_API_KEY` | Cloud API key | - |

### 5.2 Configuration File

```typescript
// config/ruvector.ts
export interface RuVectorConfig {
  backend: 'memory' | 'postgres' | 'standalone' | 'sqlite';

  index: {
    dimensions: number;
    distanceMetric: 'cosine' | 'euclidean' | 'dot';
    indexType: 'hnsw' | 'flat';
    hnswConfig?: {
      m: number;
      efConstruction: number;
      efSearch: number;
    };
  };

  sona: {
    enabled: boolean;
    microLoraEnabled: boolean;
    trajectoryTracking: boolean;
    patternThreshold: number;
    minSuccessRateForLearning: number;
  };

  cache: {
    enabled: boolean;
    maxSize: number;
    ttlSeconds: number;
  };

  performance: {
    batchSize: number;
    parallelProcessing: boolean;
    maxConcurrency: number;
  };

  hybrid: {
    enabled: boolean;
    defaultVectorWeight: number;
  };
}

// Default configuration
export const defaultRuVectorConfig: RuVectorConfig = {
  backend: 'memory',

  index: {
    dimensions: 384,
    distanceMetric: 'cosine',
    indexType: 'hnsw',
    hnswConfig: {
      m: 16,
      efConstruction: 200,
      efSearch: 100,
    },
  },

  sona: {
    enabled: false,
    microLoraEnabled: true,
    trajectoryTracking: true,
    patternThreshold: 5,
    minSuccessRateForLearning: 0.7,
  },

  cache: {
    enabled: true,
    maxSize: 10000,
    ttlSeconds: 600,
  },

  performance: {
    batchSize: 100,
    parallelProcessing: true,
    maxConcurrency: 8,
  },

  hybrid: {
    enabled: true,
    defaultVectorWeight: 0.7,
  },
};
```

---

## 6. Code Examples

### 6.1 Initialize Vector Store

```typescript
import { createVectorStore, createRuVectorConfig } from '@kg-agent/vector';

// Default configuration
const store = createVectorStore();

// Custom configuration
const customStore = createVectorStore({
  backend: 'postgres',
  index: {
    dimensions: 1536, // For OpenAI embeddings
    distanceMetric: 'cosine',
    indexType: 'hnsw',
    hnswConfig: {
      m: 32,
      efConstruction: 400,
      efSearch: 200,
    },
  },
  sona: {
    enabled: true,
    trajectoryTracking: true,
    patternThreshold: 5,
  },
});

// Initialize connection
await customStore.initialize();

console.log('Vector store initialized');
console.log(`Backend: ${customStore.backend}`);
console.log(`Dimensions: ${customStore.dimensions}`);
```

### 6.2 Insert and Search Vectors

```typescript
// Generate embedding (example with OpenAI)
async function generateEmbedding(text: string): Promise<Float32Array> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return new Float32Array(response.data[0].embedding);
}

// Insert document
const content = 'Introduction to neural network architectures';
const embedding = await generateEmbedding(content);

await store.insert({
  id: 'doc-neural-intro',
  vector: embedding,
  metadata: {
    title: 'Neural Network Introduction',
    type: 'concept',
    tags: ['AI', 'ML', 'neural-networks'],
    path: '/docs/neural-networks.md',
  },
});

// Search for similar documents
const queryEmbedding = await generateEmbedding('deep learning architectures');
const results = await store.search({
  query: queryEmbedding,
  k: 10,
  minScore: 0.5,
});

console.log(`Found ${results.length} similar documents:`);
for (const result of results) {
  console.log(`  ${result.metadata.title}: ${result.score.toFixed(4)}`);
}
```

### 6.3 Hybrid Search with Graph Expansion

```typescript
// Hybrid search combining vector + graph
const hybridResults = await store.hybridSearch({
  embedding: queryEmbedding,
  cypher: `
    MATCH (doc:Document)-[:REFERENCES]->(concept:Concept)
    WHERE doc.id IN $candidateIds
    AND concept.type = 'neural-network'
    RETURN doc, collect(concept) as concepts
  `,
  filters: { type: 'technical' },
  limit: 20,
});

console.log('Hybrid search results:');
for (const result of hybridResults) {
  console.log(`  ${result.metadata.title}`);
  console.log(`    Vector score: ${result.score.toFixed(4)}`);
  console.log(`    Combined score: ${result.combinedScore.toFixed(4)}`);
  console.log(`    Related concepts: ${result.concepts?.length || 0}`);
}
```

### 6.4 Trajectory Tracking

```typescript
import { createTrajectoryTracker } from '@kg-agent/vector';

// Create tracker with auto-learning
const tracker = createTrajectoryTracker({
  maxTrajectories: 1000,
  enableAutoLearning: true,
  minSuccessRateForLearning: 0.7,
  patternThreshold: 5,
});

// Start a trajectory
const trajectoryId = tracker.startTrajectory('researcher-1', {
  workflowId: 'research-wf-456',
  priority: 'high',
});

// Record steps
await tracker.addStep(trajectoryId, {
  action: 'initialize_context',
  state: { nodeCount: 0 },
  outcome: 'success',
  duration: 124,
});

await tracker.addStep(trajectoryId, {
  action: 'load_knowledge_graph',
  state: { nodeCount: 1500, edgeCount: 3200 },
  outcome: 'success',
  duration: 1230,
});

await tracker.addStep(trajectoryId, {
  action: 'analyze_document',
  state: { tokens: 5000, sections: 12 },
  outcome: 'success',
  duration: 890,
});

// Finalize trajectory
await tracker.finalizeTrajectory(trajectoryId, {
  success: true,
  totalDuration: 6240,
});

// Get recommendations for future actions
const recommendations = await tracker.getRecommendedActions('analyze_document');
console.log('Recommended next actions:', recommendations);
```

### 6.5 Pattern Detection and Learning

```typescript
// Get detected patterns from trajectories
const patterns = await tracker.getPatterns({
  minConfidence: 0.7,
  type: 'success',
});

console.log('Detected success patterns:');
for (const pattern of patterns) {
  console.log(`  Pattern: ${pattern.id}`);
  console.log(`    Actions: ${pattern.actions.join(' -> ')}`);
  console.log(`    Frequency: ${pattern.frequency}`);
  console.log(`    Success rate: ${(pattern.successRate * 100).toFixed(1)}%`);
  console.log(`    Confidence: ${(pattern.confidence * 100).toFixed(1)}%`);
  console.log(`    Avg duration: ${pattern.avgDuration}ms`);
}

// Apply pattern to prime agent
const primingContext = await tracker.getPrimingContext('new-task-description');
console.log('Agent priming context:');
console.log(`  Recommended approach: ${primingContext.recommendedApproach}`);
console.log(`  Warnings: ${primingContext.warnings.join(', ')}`);
console.log(`  Confidence: ${(primingContext.confidence * 100).toFixed(1)}%`);
```

### 6.6 Batch Operations

```typescript
// Batch insert for bulk operations
const documents = [
  { id: 'doc-1', content: 'Content 1', type: 'concept' },
  { id: 'doc-2', content: 'Content 2', type: 'technical' },
  // ... more documents
];

// Generate embeddings in parallel
const embeddings = await Promise.all(
  documents.map(doc => generateEmbedding(doc.content))
);

// Batch insert
const result = await store.batchInsert({
  entries: documents.map((doc, i) => ({
    id: doc.id,
    vector: embeddings[i],
    metadata: { type: doc.type, content: doc.content },
  })),
  skipDuplicates: true,
  onProgress: (inserted, total) => {
    console.log(`Progress: ${inserted}/${total}`);
  },
});

console.log(`Inserted: ${result.inserted}, Skipped: ${result.skipped}`);
```

---

## 7. Performance Tuning

### 7.1 Index Size Recommendations

| Vector Count | Recommended Config | HNSW m | efSearch | Memory |
|--------------|-------------------|--------|----------|--------|
| < 1,000 | Low memory | 8 | 50 | ~10MB |
| 1,000 - 100,000 | Standard | 16 | 100 | ~100MB |
| 100,000 - 1M | High performance | 32 | 200 | ~1GB |
| > 1M | Consider sharding | 48+ | 200+ | Varies |

### 7.2 Performance Configurations

```typescript
// Low memory configuration
const lowMemoryConfig = {
  index: {
    hnswConfig: {
      m: 8,
      efConstruction: 100,
      efSearch: 50,
    },
  },
  cache: { enabled: false },
  performance: {
    parallelProcessing: false,
    maxConcurrency: 1,
  },
};

// High performance configuration
const highPerfConfig = {
  index: {
    hnswConfig: {
      m: 32,
      efConstruction: 400,
      efSearch: 200,
    },
  },
  cache: {
    enabled: true,
    maxSize: 10000,
    ttlSeconds: 600,
  },
  performance: {
    batchSize: 500,
    parallelProcessing: true,
    maxConcurrency: 8,
  },
};
```

---

## 8. Best Practices

1. **Match dimensions to your embedding model**: OpenAI uses 1536/3072, local models often use 384-768

2. **Use meaningful IDs**: Hierarchical IDs like `doc/concepts/neural-networks` are easier to manage

3. **Include rich metadata**: Store searchable fields for filtering and hybrid search

4. **Use namespaces**: Organize vectors by category or tenant for isolation

5. **Monitor index health**: Regularly check statistics with `kg vector stats`

6. **Enable trajectory tracking**: Learn from agent behavior to improve over time

7. **Set appropriate score thresholds**: High precision (0.8+) for exact matches, low (0.3+) for discovery

8. **Use hybrid search**: Combine vector and keyword matching for best results

9. **Rebuild index periodically**: After significant data changes, rebuild for optimal performance

---

## 9. References

- [RuVector Usage Guide](../../RUVECTOR-USAGE.md)
- [Workflow Integration Guide](../../WORKFLOW-VECTOR-INTEGRATION.md)
- [Vector Store API Reference](../../API.md#vector-store)
- [MCP Tools Reference](../../API.md#mcp-tools)
