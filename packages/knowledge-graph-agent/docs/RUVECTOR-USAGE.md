# RuVector Integration Usage Guide

This document provides comprehensive usage documentation for the RuVector semantic search integration in the Knowledge Graph Agent.

## Table of Contents

- [Overview](#overview)
- [Key Concepts](#key-concepts)
  - [HNSW Approximate Nearest Neighbor Search](#hnsw-approximate-nearest-neighbor-search)
  - [Hybrid Search](#hybrid-search)
  - [Trajectory Tracking](#trajectory-tracking)
  - [Self-Learning Capabilities](#self-learning-capabilities)
- [CLI Commands](#cli-commands)
  - [Vector Search](#vector-search)
  - [Vector Statistics](#vector-statistics)
  - [Rebuild Vector Index](#rebuild-vector-index)
  - [Trajectory Commands](#trajectory-commands)
- [MCP Tools](#mcp-tools)
  - [kg_vector_search](#kg_vector_search)
  - [kg_vector_upsert](#kg_vector_upsert)
  - [kg_trajectory_list](#kg_trajectory_list)
- [Use Cases](#use-cases)
- [Configuration Options](#configuration-options)
- [Performance Tuning](#performance-tuning)
- [Best Practices](#best-practices)

---

## Overview

RuVector is a high-performance vector database integration that enables semantic search capabilities within the Knowledge Graph Agent. It provides:

- **Semantic Search**: Find documents and nodes by meaning rather than exact keyword matches
- **HNSW Indexing**: Fast approximate nearest neighbor search with configurable accuracy/speed tradeoffs
- **Hybrid Search**: Combine vector similarity with graph pattern matching for precise results
- **Trajectory Tracking**: Record agent operations for pattern learning and optimization
- **Self-Learning**: Automatically learn from successful agent workflows via SONA (Self-Optimizing Neural Architecture)

The integration supports multiple backends (memory, PostgreSQL, standalone file storage) and is designed for scalability from small projects to large-scale deployments.

---

## Key Concepts

### HNSW Approximate Nearest Neighbor Search

HNSW (Hierarchical Navigable Small World) is a graph-based algorithm for approximate nearest neighbor search that provides excellent performance for high-dimensional vector spaces.

#### How HNSW Works

1. **Hierarchical Structure**: Vectors are organized in multiple layers, with fewer nodes at higher levels
2. **Greedy Search**: Starting from the top layer, the algorithm traverses to find the closest node
3. **Layer Descent**: The search moves down through layers, refining the result at each level
4. **Beam Search**: At the bottom layer, a broader search finds the best candidates

#### HNSW Parameters

| Parameter | Description | Default | Impact |
|-----------|-------------|---------|--------|
| `m` | Maximum connections per node | 16 | Higher = better recall, more memory |
| `efConstruction` | Construction-time candidate list size | 200 | Higher = better index quality, slower build |
| `efSearch` | Search-time candidate list size | 100 | Higher = better recall, slower search |

```typescript
// Example HNSW configuration
const config = {
  index: {
    dimensions: 1536,
    distanceMetric: 'cosine',
    indexType: 'hnsw',
    hnswConfig: {
      m: 16,              // Balanced for most use cases
      efConstruction: 200, // Good index quality
      efSearch: 100,       // Good search accuracy
    },
  },
};
```

### Hybrid Search

Hybrid search combines vector similarity with keyword matching and graph pattern queries for more precise results.

#### Search Modes

1. **Pure Vector Search**: Finds semantically similar documents based on embedding distance
2. **Hybrid Search**: Combines vector similarity (70% weight) with keyword matching (30% weight)
3. **Graph-Enhanced Search**: Adds Cypher query filtering for relationship-aware results

#### Hybrid Search Scoring

```
combinedScore = (vectorScore * 0.7) + (keywordScore * 0.3)
```

The keyword score is calculated by matching query terms against metadata fields:
- `title`
- `content`
- `description`
- `tags`

### Trajectory Tracking

Trajectory tracking records agent operation sequences for analysis and learning. Each trajectory contains:

- **Agent ID**: Identifier of the agent performing operations
- **Workflow ID**: Optional workflow context
- **Steps**: Ordered list of actions with outcomes and timing
- **Metadata**: Additional context about the trajectory

#### Trajectory Step Structure

```typescript
interface TrajectoryStep {
  action: string;      // e.g., 'search', 'create_node', 'analyze'
  state: object;       // Context snapshot at this step
  outcome: 'success' | 'failure' | 'pending';
  duration: number;    // Milliseconds
  timestamp: Date;
  metadata?: object;
}
```

### Self-Learning Capabilities

SONA (Self-Optimizing Neural Architecture) enables automatic learning from agent behavior:

1. **Pattern Detection**: Identifies recurring action sequences across trajectories
2. **Success Analysis**: Learns which patterns lead to successful outcomes
3. **Recommendations**: Suggests next actions based on learned patterns
4. **Confidence Scoring**: Tracks pattern reliability over time

#### Pattern Types

| Type | Description |
|------|-------------|
| `success` | Patterns that consistently lead to successful outcomes |
| `failure` | Patterns that lead to failures (used for avoidance) |
| `optimization` | Patterns that improve performance metrics |

---

## CLI Commands

### Vector Search

Perform semantic search on the vector store.

```bash
# Basic search
kg vector search "neural network architecture"

# With options
kg vector search "database optimization" \
  --top-k 20 \
  --type concept \
  --hybrid \
  --min-score 0.5

# JSON output
kg vector search "machine learning" --json
```

#### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--path <path>` | `-p` | Project root path | `.` |
| `--top-k <n>` | `-k` | Number of results | `10` |
| `--type <type>` | `-t` | Filter by node type | - |
| `--hybrid` | - | Enable hybrid search | `false` |
| `--min-score <score>` | - | Minimum similarity (0-1) | `0` |
| `--json` | - | JSON output format | `false` |

#### Example Output

```
  Search Results for "neural network"

  Found 5 results

  #   ID                        Score   Type       Metadata
  ---------------------------------------------------------------
  1   doc-neural-nets-intro     0.9423  concept    title, content, tags
  2   doc-deep-learning-guide   0.8912  guide      title, description
  3   feat-nn-integration       0.8534  feature    type, path
  4   tech-backpropagation      0.8201  technical  title, content
  5   prim-activation-fn        0.7856  primitive  type, description

  Top Result Details:

    ID: doc-neural-nets-intro
    Score: 0.942300
    Distance: 0.057700
    Metadata:
      title: Introduction to Neural Networks
      type: concept
      tags: AI, ML, neural-networks
```

### Vector Statistics

Display vector store statistics.

```bash
# Basic stats
kg vector stats

# With project path
kg vector stats --path /path/to/project

# JSON output
kg vector stats --json
```

#### Example Output

```
  Vector Store Statistics

  Overview
    Total Vectors:   15,432
    Dimensions:      1536
    Index Type:      HNSW
    Memory Usage:    124.56 MB
    Last Updated:    2025-12-29T12:34:56.000Z

  Index Configuration
    HNSW Levels:     4
    Entry Point:     doc-main-overview...
    Avg Connections: 14.32

  Namespaces
    default         12,500 ||||||||||||||||||||||||||||||
    concepts         1,832 ||||||
    technical          800 ||
    features           300 |

  Performance
    [OK] Medium index - HNSW optimal
```

### Rebuild Vector Index

Rebuild the vector index from knowledge graph data.

```bash
# Basic rebuild
kg vector rebuild

# Force rebuild with custom batch size
kg vector rebuild --force --batch-size 500

# Verbose output
kg vector rebuild --verbose
```

#### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--path <path>` | Project root path | `.` |
| `--force` | Force rebuild if index exists | `false` |
| `--batch-size <size>` | Vectors per batch | `100` |
| `--verbose` | Verbose output | `false` |

### Trajectory Commands

Manage agent trajectories for learning and analysis.

#### List Trajectories

```bash
# List recent trajectories
kg vector trajectory list

# Alias: kg vector traj list
kg vec traj list

# Filter options
kg vector traj list \
  --agent researcher-1 \
  --workflow wf-123 \
  --limit 50 \
  --success

# JSON output
kg vector traj list --json
```

##### Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--path <path>` | `-p` | Project root path | `.` |
| `--agent <id>` | `-a` | Filter by agent ID | - |
| `--workflow <id>` | `-w` | Filter by workflow ID | - |
| `--limit <n>` | `-l` | Maximum results | `20` |
| `--success` | - | Only successful | `false` |
| `--failed` | - | Only failed | `false` |
| `--json` | - | JSON output | `false` |

##### Example Output

```
  Agent Trajectories

  Overview
    Active:     3
    Completed:  247
    Success:    89.5%
    Avg Duration: 4.32s
    Patterns:   15

  Recent Trajectories (20)
  ID                  Agent         Steps  Duration  Status
  ----------------------------------------------------------------
  traj-1735484856...  researcher-1  8      3.24s     OK
  traj-1735484712...  coder-2       12     5.67s     OK
  traj-1735484623...  analyst-1     5      2.11s     FAIL
  traj-1735484521...  researcher-1  6      2.89s     OK
```

#### Show Trajectory Details

```bash
# Show specific trajectory
kg vector trajectory show traj-1735484856-abc123

# JSON output
kg vector traj show traj-1735484856-abc123 --json
```

##### Example Output

```
  Trajectory Details

  Information
    ID:         traj-1735484856-abc123
    Agent:      researcher-1
    Workflow:   research-wf-456
    Started:    2025-12-29T12:34:56.000Z
    Completed:  2025-12-29T12:35:02.000Z
    Duration:   6.24s
    Status:     SUCCESS

  Steps (8)
  #   Action                           Outcome  Duration
  -----------------------------------------------------------
  1   initialize_context               success  124ms
  2   load_knowledge_graph             success  1.23s
  3   analyze_document                 success  890ms
  4   extract_entities                 success  456ms
  5   build_relationships              success  678ms
  6   validate_output                  success  234ms
  7   store_results                    success  1.12s
  8   finalize                         success  89ms

  Metadata
    priority: high
    source: user-request
    model: claude-3-opus
```

#### Show Detected Patterns

```bash
# List all patterns
kg vector trajectory patterns

# Filter by confidence and type
kg vector traj patterns \
  --min-confidence 0.7 \
  --type success

# JSON output
kg vector traj patterns --json
```

##### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--min-confidence <n>` | Minimum confidence (0-1) | `0.5` |
| `--type <type>` | Pattern type filter | - |
| `--json` | JSON output | `false` |

##### Example Output

```
  Detected Patterns

  ID                              Type         Freq  Success  Confidence
  -------------------------------------------------------------------------
  analyze->extract->validate      success      45    98%      92%
  load->search->aggregate         success      32    95%      88%
  init->load->process->store      optimization 28    100%     85%
  search->filter->rank            success      21    90%      78%

  Top Pattern Details
    ID: analyze->extract->validate
    Actions: analyze_document -> extract_entities -> validate_output
    Avg Duration: 2.34s
```

#### Clear Trajectory Data

```bash
# Clear with confirmation
kg vector trajectory clear --confirm
```

---

## MCP Tools

### kg_vector_search

Perform semantic vector search via MCP protocol.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "query": {
      "type": "string",
      "description": "Search query string"
    },
    "k": {
      "type": "number",
      "description": "Number of results (1-100)",
      "default": 10
    },
    "type": {
      "type": "string",
      "enum": ["concept", "technical", "feature", "primitive", "service", "guide", "standard", "integration"],
      "description": "Filter by node type"
    },
    "hybrid": {
      "type": "boolean",
      "description": "Enable hybrid search",
      "default": false
    },
    "minScore": {
      "type": "number",
      "description": "Minimum similarity score (0-1)",
      "default": 0
    },
    "includeVectors": {
      "type": "boolean",
      "description": "Include raw vectors in results",
      "default": false
    },
    "namespace": {
      "type": "string",
      "description": "Filter by namespace"
    }
  },
  "required": ["query"]
}
```

#### Example Usage

```typescript
// Basic search
const result = await mcpClient.callTool('kg_vector_search', {
  query: 'machine learning optimization',
  k: 10,
});

// Hybrid search with filters
const hybridResult = await mcpClient.callTool('kg_vector_search', {
  query: 'neural network training',
  k: 20,
  type: 'technical',
  hybrid: true,
  minScore: 0.5,
});
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": "doc-123",
        "score": 0.9234,
        "metadata": {
          "title": "Document Title",
          "type": "concept",
          "path": "/docs/example.md"
        }
      }
    ],
    "count": 10,
    "query": "machine learning optimization",
    "searchMode": "vector",
    "filters": {
      "type": null,
      "minScore": null,
      "namespace": null
    }
  },
  "metadata": {
    "executionTime": 45,
    "totalVectors": 15432,
    "indexType": "hnsw",
    "cached": false
  }
}
```

### kg_vector_upsert

Insert or update vectors in the knowledge graph.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "description": "Unique vector identifier"
    },
    "vector": {
      "type": "array",
      "items": { "type": "number" },
      "description": "Embedding vector (must match configured dimensions)"
    },
    "metadata": {
      "type": "object",
      "description": "Metadata to associate with the vector",
      "properties": {
        "title": { "type": "string" },
        "content": { "type": "string" },
        "type": { "type": "string" },
        "path": { "type": "string" },
        "tags": { "type": "array", "items": { "type": "string" } },
        "sourceId": { "type": "string" }
      }
    },
    "namespace": {
      "type": "string",
      "description": "Optional namespace",
      "default": "default"
    }
  },
  "required": ["id", "vector"]
}
```

#### Example Usage

```typescript
// Insert new vector
const result = await mcpClient.callTool('kg_vector_upsert', {
  id: 'doc-new-article',
  vector: embedding, // 1536-dimensional array
  metadata: {
    title: 'New Article on AI',
    type: 'concept',
    tags: ['AI', 'machine-learning'],
    path: '/docs/ai-article.md',
  },
  namespace: 'concepts',
});

// Update existing vector
const updateResult = await mcpClient.callTool('kg_vector_upsert', {
  id: 'doc-existing',
  vector: newEmbedding,
  metadata: {
    updatedBy: 'system',
    version: 2,
  },
});
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "id": "doc-new-article",
    "operation": "inserted",
    "dimensions": 1536,
    "hasMetadata": true,
    "namespace": "concepts"
  },
  "metadata": {
    "executionTime": 12,
    "totalVectors": 15433,
    "wasUpdate": false
  }
}
```

### kg_trajectory_list

List agent trajectories via MCP protocol.

#### Input Schema

```json
{
  "type": "object",
  "properties": {
    "agentId": {
      "type": "string",
      "description": "Filter by agent ID"
    },
    "limit": {
      "type": "number",
      "description": "Maximum trajectories (1-100)",
      "default": 20
    },
    "includeSteps": {
      "type": "boolean",
      "description": "Include detailed steps",
      "default": false
    },
    "workflowId": {
      "type": "string",
      "description": "Filter by workflow ID"
    },
    "successOnly": {
      "type": "boolean",
      "description": "Only successful trajectories",
      "default": false
    },
    "includeStats": {
      "type": "boolean",
      "description": "Include aggregate statistics",
      "default": true
    }
  }
}
```

#### Example Usage

```typescript
// List all trajectories with stats
const result = await mcpClient.callTool('kg_trajectory_list', {
  limit: 50,
  includeStats: true,
});

// Filter by agent with detailed steps
const agentTraj = await mcpClient.callTool('kg_trajectory_list', {
  agentId: 'researcher-1',
  includeSteps: true,
  successOnly: true,
});
```

#### Response Format

```json
{
  "success": true,
  "data": {
    "trajectories": [
      {
        "id": "traj-123",
        "agentId": "researcher-1",
        "success": true,
        "stepCount": 8,
        "totalDuration": 6240,
        "totalDurationFormatted": "6.24s",
        "startedAt": "2025-12-29T12:34:56.000Z",
        "actionSummary": ["init", "load", "analyze", "store"]
      }
    ],
    "count": 20,
    "filters": {
      "agentId": null,
      "workflowId": null,
      "successOnly": false
    },
    "stats": {
      "totalTrajectories": 247,
      "activeTrajectories": 3,
      "successRate": 89.5,
      "avgDuration": 4320,
      "avgDurationFormatted": "4.32s",
      "detectedPatterns": 15,
      "learningRecords": 42
    }
  },
  "metadata": {
    "executionTime": 8,
    "includeSteps": false
  }
}
```

---

## Use Cases

### Semantic Code Search

Find code snippets and documentation by describing what you're looking for:

```bash
# Find authentication implementations
kg vector search "user authentication with JWT tokens"

# Find error handling patterns
kg vector search "error handling middleware express" --type technical

# Find API documentation
kg vector search "REST API pagination" --type guide
```

### Similar Document Discovery

Find documents related to an existing one:

```typescript
// Get embedding for existing document
const docEmbedding = await getDocumentEmbedding('doc-123');

// Search for similar documents
const similar = await vectorStore.search({
  vector: docEmbedding,
  k: 10,
  filter: { type: 'concept' },
  minScore: 0.7,
});
```

### Pattern Recognition in Agent Workflows

Analyze agent behavior to identify optimal workflows:

```bash
# View successful patterns
kg vector traj patterns --type success --min-confidence 0.8

# Analyze specific agent's trajectories
kg vector traj list --agent coder-1 --success

# Export patterns for analysis
kg vector traj patterns --json > patterns.json
```

### Learning from Successful Task Completions

Configure auto-learning to improve agent performance:

```typescript
const tracker = createTrajectoryTracker({
  maxTrajectories: 1000,
  enableAutoLearning: true,
  minSuccessRateForLearning: 0.7,
  patternThreshold: 5, // Learn after 5 occurrences
});

// Trajectories are automatically analyzed
const trajectoryId = tracker.startTrajectory('agent-1');
// ... agent operations ...
tracker.finalizeTrajectory(trajectoryId, { success: true });

// Get recommendations for future actions
const recommendations = tracker.getRecommendedActions('analyze_document');
```

---

## Configuration Options

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RUVECTOR_BACKEND` | Storage backend (`memory`, `postgres`, `standalone`, `sqlite`) | `memory` |
| `RUVECTOR_DIMENSIONS` | Vector dimensions | `384` |
| `RUVECTOR_ENABLE_SONA` | Enable SONA learning | `false` |
| `RUVECTOR_ENABLE_TRAJECTORY` | Enable trajectory tracking | `false` |
| `DATABASE_URL` | PostgreSQL connection (for postgres backend) | - |
| `RUVECTOR_SCHEMA` | PostgreSQL schema | `ruvector` |
| `RUVECTOR_DATA_DIR` | Data directory (for standalone backend) | `.ruvector` |
| `RUVECTOR_CLOUD_URL` | Cloud endpoint URL | - |
| `RUVECTOR_API_KEY` | Cloud API key | - |

### Programmatic Configuration

```typescript
import { createRuVectorConfig, createVectorStore } from '@kg-agent/vector';

// Default configuration
const defaultStore = createVectorStore();

// Custom configuration
const customStore = createVectorStore({
  backend: 'memory',
  index: {
    dimensions: 1536,
    distanceMetric: 'cosine',
    indexType: 'hnsw',
    hnswConfig: {
      m: 32,
      efConstruction: 400,
      efSearch: 200,
    },
  },
  enableSona: true,
  enableTrajectoryTracking: true,
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
  hybrid: {
    enabled: true,
    defaultVectorWeight: 0.7,
  },
});
```

### Embedding Model Configuration

The vector store expects embeddings in a specific dimension. Common configurations:

| Model | Dimensions | Notes |
|-------|------------|-------|
| OpenAI text-embedding-3-small | 1536 | Default, good balance |
| OpenAI text-embedding-3-large | 3072 | Higher quality |
| Claude embeddings | 1536 | Anthropic embeddings |
| Sentence Transformers | 384-768 | Local models |
| Cohere embed-v3 | 1024 | Multilingual support |

Configure via `RUVECTOR_DIMENSIONS` or programmatically:

```typescript
const store = createVectorStore({
  index: {
    dimensions: 3072, // For OpenAI large model
    distanceMetric: 'cosine',
    indexType: 'hnsw',
  },
});
```

### Similarity Thresholds

Recommended thresholds by use case:

| Use Case | Min Score | Notes |
|----------|-----------|-------|
| Exact match | 0.95+ | Very similar content |
| Related content | 0.7-0.95 | Semantically related |
| Broad search | 0.5-0.7 | Loosely related |
| Discovery | 0-0.5 | Exploratory search |

---

## Performance Tuning

### Index Size Recommendations

| Vector Count | Recommended Config | HNSW m | efSearch |
|--------------|-------------------|--------|----------|
| < 1,000 | Low memory | 8 | 50 |
| 1,000 - 100,000 | Standard | 16 | 100 |
| 100,000 - 1M | High performance | 32 | 200 |
| > 1M | Consider sharding | 48+ | 200+ |

### Memory Optimization

```typescript
import { createLowMemoryConfig } from '@kg-agent/vector';

// For memory-constrained environments
const store = createVectorStore(createLowMemoryConfig(1536));
```

Key settings for low memory:
- `m: 8` - Fewer connections per node
- `efConstruction: 100` - Faster index building
- `cache.enabled: false` - Disable result cache
- `performance.parallelProcessing: false` - Sequential operations

### High Performance Configuration

```typescript
import { createHighPerformanceConfig } from '@kg-agent/vector';

// For large-scale deployments
const store = createVectorStore(createHighPerformanceConfig(1536));
```

Key settings for performance:
- `m: 32` - More connections for better recall
- `efConstruction: 400` - Higher quality index
- `efSearch: 200` - Better search accuracy
- `cache.maxSize: 10000` - Large result cache
- `performance.maxConcurrency: 8` - Parallel operations

### Batch Operations

For bulk insertions, use batch operations:

```typescript
const result = await store.batchInsert({
  entries: vectors.map((v, i) => ({
    id: `doc-${i}`,
    vector: v.embedding,
    metadata: v.metadata,
  })),
  skipDuplicates: true,
  onProgress: (inserted, total) => {
    console.log(`Progress: ${inserted}/${total}`);
  },
});

console.log(`Inserted: ${result.inserted}, Skipped: ${result.skipped}`);
```

---

## Best Practices

### 1. Choose Appropriate Dimensions

Match your embedding model's output dimensions exactly. Mismatched dimensions will cause errors:

```typescript
// Correct: dimensions match embedding model
const store = createVectorStore({
  index: { dimensions: 1536 }, // OpenAI text-embedding-3-small
});

// Error: dimension mismatch
await store.insert({
  id: 'doc-1',
  vector: embedding768, // 768 dimensions - ERROR!
});
```

### 2. Use Meaningful IDs

Use descriptive, hierarchical IDs for easy management:

```typescript
// Good: descriptive and organized
const goodIds = [
  'doc/concepts/neural-networks',
  'doc/technical/backpropagation',
  'code/src/models/transformer',
];

// Bad: opaque and hard to manage
const badIds = [
  'abc123',
  '12345',
  'temp',
];
```

### 3. Include Rich Metadata

Store searchable metadata for filtering and hybrid search:

```typescript
await store.insert({
  id: 'doc-neural-nets',
  vector: embedding,
  metadata: {
    title: 'Introduction to Neural Networks',
    type: 'concept',
    tags: ['AI', 'ML', 'deep-learning'],
    path: '/docs/neural-networks.md',
    createdAt: new Date().toISOString(),
    author: 'system',
    wordCount: 1500,
  },
});
```

### 4. Use Namespaces for Organization

Organize vectors by namespace for multi-tenant or categorical separation:

```typescript
// Insert into specific namespace
await store.insert({
  id: 'doc-1',
  vector: embedding,
  metadata: { namespace: 'production' },
});

// Search within namespace
const results = await mcpClient.callTool('kg_vector_search', {
  query: 'authentication',
  namespace: 'production',
});
```

### 5. Monitor Index Health

Regularly check vector store statistics:

```bash
# Daily health check
kg vector stats --json | jq '.totalVectors, .memoryUsage'
```

### 6. Leverage Trajectory Learning

Enable auto-learning for continuous improvement:

```typescript
const tracker = createTrajectoryTracker({
  enableAutoLearning: true,
  patternThreshold: 5,
  minSuccessRateForLearning: 0.8,
});
```

### 7. Set Appropriate Score Thresholds

Adjust `minScore` based on your use case:

```bash
# High precision search
kg vector search "exact topic" --min-score 0.8

# Broad discovery search
kg vector search "general topic" --min-score 0.3
```

### 8. Use Hybrid Search for Precision

Combine semantic and keyword matching for best results:

```bash
kg vector search "kubernetes pod networking" --hybrid
```

### 9. Regularly Rebuild Index

Rebuild after significant data changes:

```bash
# Weekly maintenance
kg vector rebuild --force --batch-size 500
```

### 10. Handle Errors Gracefully

Always check operation results:

```typescript
const result = await mcpClient.callTool('kg_vector_search', { query });

if (!result.success) {
  console.error('Search failed:', result.error);
  // Handle error appropriately
}
```

---

## Troubleshooting

### Common Issues

**Empty search results**
- Check that vectors are indexed: `kg vector stats`
- Verify dimensions match embedding model
- Lower `minScore` threshold
- Rebuild index: `kg vector rebuild --force`

**Slow search performance**
- Reduce `efSearch` for faster (less accurate) results
- Enable caching in configuration
- Check memory usage with `kg vector stats`

**Dimension mismatch errors**
- Verify `RUVECTOR_DIMENSIONS` matches your embedding model
- Check vector lengths before insertion
- Rebuild index with correct dimensions

**Trajectory tracking not working**
- Enable with `RUVECTOR_ENABLE_TRAJECTORY=true`
- Ensure `finalizeTrajectory` is called for each trajectory
- Check `maxTrajectories` limit

---

## API Reference

For complete API documentation, see:
- [Vector Store API](/docs/API.md#vector-store)
- [Trajectory Tracker API](/docs/API.md#trajectory-tracker)
- [MCP Tools Reference](/docs/API.md#mcp-tools)
