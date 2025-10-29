---
title: Vercel Workflow + Vector DB Architecture
type: architecture
status: complete
phase_id: PHASE-12
tags:
  - vercel-workflow
  - vector-db
  - architecture
  - markdown-templates
  - workflow-orchestration
  - phase/phase-12
  - type/documentation
  - status/in-progress
domain: weaver
priority: medium
visual:
  icon: "\U0001F3D7️"
  color: '#F59E0B'
  cssclasses:
    - type-architecture
    - status-complete
    - priority-medium
    - domain-weaver
updated: '2025-10-29T04:55:05.333Z'
author: ai-generated
version: 2.0.0
keywords:
  - "\U0001F3AF overview"
  - related
  - "\U0001F3D7️ architecture principles"
  - 1. vercel workflow for orchestration
  - 2. markdown for data & user interaction
  - 3. combined flow
  - "\U0001F4E6 technology stack"
  - core technologies
  - workflow execution
  - "\U0001F504 workflow definitions"
---

# Vercel Workflow + Vector DB Architecture

**Version**: 2.0.0
**Date**: 2025-10-27
**Status**: ✅ Architecture Complete

---

## 🎯 Overview

This architecture combines:
1. **Markdown templates** for user interaction and data representation
2. **Vercel Workflow** for durable, observable workflow orchestration
3. **Vector DB operations** (chunking, embedding, indexing) as workflows
4. **Complete traceability** through markdown linkage

---





## Related

[[phase-12-architecture]]
## Related

[[CHUNKING-IMPLEMENTATION-DESIGN]]
## 🏗️ Architecture Principles

### 1. Vercel Workflow for Orchestration

**Why Vercel Workflow?**
- ✅ **Durable Execution**: Workflows survive crashes and restarts
- ✅ **Type-Safe**: Full TypeScript support
- ✅ **Observable**: Built-in monitoring and debugging
- ✅ **Scalable**: Production-ready orchestration
- ✅ **Reliable**: Automatic retries and error handling
- ✅ **Long-Running**: Handle hours/days-long operations

**Replace**:
```typescript
// OLD: Custom EventEmitter-based workflow engine
class WorkflowEngine extends EventEmitter {
  async execute(stage, context) { ... }
}
```

**With**:
```typescript
// NEW: Vercel Workflow durable orchestration
import { workflow } from '@vercel/workflow';

export const chunkingWorkflow = workflow('chunking', async ({ document }) => {
  // Durable, type-safe, observable
});
```

### 2. Markdown for Data & User Interaction

Keep markdown templates for:
- **User input**: Strategy selection, configuration
- **Data representation**: Chunks, embeddings, indexes
- **Linkage**: Relationships between documents/chunks/embeddings
- **Auditability**: Version-controlled decision trail

### 3. Combined Flow

```
User edits markdown → Vercel Workflow triggered → Workflow executes steps
→ Updates markdown with results → Next workflow triggered → Repeat
```

---

## 📦 Technology Stack

### Core Technologies
- **Vercel Workflow**: Workflow orchestration (@vercel/workflow)
- **Markdown**: Data representation and user interaction
- **gray-matter**: YAML frontmatter parsing
- **chokidar**: File watcher for markdown changes
- **@xenova/transformers**: Local embeddings
- **TypeScript**: Full type safety

### Workflow Execution
```typescript
import { workflow, step } from '@vercel/workflow';

export const vectorDBWorkflow = workflow('vector-db', async (context) => {
  // Step 1: Parse markdown input
  const config = await step('parse-config', async () => {
    return parseMarkdownConfig(context.markdownPath);
  });

  // Step 2: Chunk document (durable)
  const chunks = await step('chunk-document', async () => {
    return chunkDocument(config.document, config.strategy);
  });

  // Step 3: Generate embeddings (durable, retryable)
  const embeddings = await step('generate-embeddings', async () => {
    return generateEmbeddings(chunks, config.model);
  });

  // Step 4: Index vectors (durable)
  const index = await step('index-vectors', async () => {
    return indexVectors(embeddings, config.indexType);
  });

  // Step 5: Update markdown with results
  await step('update-markdown', async () => {
    return updateMarkdownResults(context.markdownPath, {
      chunks,
      embeddings,
      index
    });
  });

  return { success: true, index };
});
```

---

## 🔄 Workflow Definitions

### 1. Chunking Workflow

**File**: `weaver/src/workflows/vector-db/chunking.workflow.ts`

```typescript
import { workflow, step } from '@vercel/workflow';
import { parseMarkdownConfig, updateMarkdownResults } from '../utils/markdown.js';
import { chunkDocument } from '../chunking/index.js';

export interface ChunkingWorkflowInput {
  documentPath: string;
  strategyMarkdownPath: string;
}

export const chunkingWorkflow = workflow<ChunkingWorkflowInput>(
  'chunking',
  async ({ documentPath, strategyMarkdownPath }) => {
    // Step 1: Parse user's chunking strategy from markdown
    const config = await step('parse-strategy', async () => {
      return parseMarkdownConfig(strategyMarkdownPath);
    });

    // Step 2: Read source document
    const document = await step('read-document', async () => {
      return fs.readFile(documentPath, 'utf-8');
    });

    // Step 3: Analyze document structure
    const analysis = await step('analyze-document', async () => {
      return analyzeDocumentStructure(document);
    });

    // Step 4: Apply chunking strategy (durable - can take minutes)
    const chunks = await step('chunk-document', async () => {
      return chunkDocument(document, {
        strategy: config.selectedStrategy,
        maxTokens: config.maxTokens || 512,
        overlap: config.overlap || 50,
        semanticBoundaries: config.semanticBoundaries || true,
      });
    });

    // Step 5: Generate chunk markdown files
    const chunkFiles = await step('generate-chunk-markdown', async () => {
      const files = [];
      for (const chunk of chunks) {
        const filePath = await generateChunkMarkdown(chunk, documentPath);
        files.push(filePath);
      }
      return files;
    });

    // Step 6: Update document metadata
    await step('update-document-metadata', async () => {
      return updateDocumentMetadata(documentPath, {
        status: 'chunked',
        chunkCount: chunks.length,
        chunkFiles,
      });
    });

    // Step 7: Trigger embedding workflow
    await step('trigger-embedding-workflow', async () => {
      return embeddingWorkflow.trigger({
        chunkIds: chunks.map(c => c.id),
        documentPath,
      });
    });

    return {
      success: true,
      chunkCount: chunks.length,
      chunkFiles,
    };
  }
);
```

**Benefits of Vercel Workflow**:
- Each step is durable - if server crashes, workflow resumes
- Automatic retries on transient failures
- Built-in observability - see exactly where workflow is
- Type-safe input/output
- Can run for hours without issues

---

### 2. Embedding Workflow

**File**: `weaver/src/workflows/vector-db/embedding.workflow.ts`

```typescript
import { workflow, step } from '@vercel/workflow';

export interface EmbeddingWorkflowInput {
  chunkIds: string[];
  documentPath: string;
  batchSize?: number;
}

export const embeddingWorkflow = workflow<EmbeddingWorkflowInput>(
  'embedding',
  async ({ chunkIds, documentPath, batchSize = 32 }) => {
    // Step 1: Load embedding config from markdown
    const config = await step('load-config', async () => {
      return loadEmbeddingConfig(documentPath);
    });

    // Step 2: Load embedding model (cache for subsequent runs)
    const model = await step('load-model', async () => {
      return loadEmbeddingModel(config.model);
    });

    // Step 3: Process chunks in batches (durable)
    const allEmbeddings = [];
    const batches = chunk(chunkIds, batchSize);

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];

      const embeddings = await step(`embed-batch-${i}`, async () => {
        // Load chunk content
        const chunks = await Promise.all(
          batch.map(id => loadChunkContent(id))
        );

        // Generate embeddings (can take time for large batches)
        return await model.embed(chunks);
      });

      allEmbeddings.push(...embeddings);
    }

    // Step 4: Store embeddings and generate markdown
    const embeddingFiles = await step('store-embeddings', async () => {
      const files = [];
      for (const embedding of allEmbeddings) {
        const filePath = await storeEmbedding(embedding);
        files.push(filePath);
      }
      return files;
    });

    // Step 5: Update chunk markdown with embedding links
    await step('update-chunk-metadata', async () => {
      for (let i = 0; i < chunkIds.length; i++) {
        await updateChunkEmbeddingLink(chunkIds[i], allEmbeddings[i].id);
      }
    });

    // Step 6: Trigger indexing workflow
    await step('trigger-indexing', async () => {
      return indexingWorkflow.trigger({
        embeddingIds: allEmbeddings.map(e => e.id),
        documentPath,
      });
    });

    return {
      success: true,
      embeddingCount: allEmbeddings.length,
      embeddingFiles,
    };
  }
);
```

**Reliability Features**:
- **Batching**: Process 32 chunks at a time
- **Durability**: Each batch is a separate step (survives crashes)
- **Progress**: Can see "batch 15 of 100" in Vercel dashboard
- **Retries**: Automatic retry on API failures
- **Caching**: Model loaded once, reused across batches

---

### 3. Indexing Workflow

**File**: `weaver/src/workflows/vector-db/indexing.workflow.ts`

```typescript
import { workflow, step } from '@vercel/workflow';

export interface IndexingWorkflowInput {
  embeddingIds: string[];
  documentPath: string;
  indexType?: 'flat' | 'hnsw' | 'ivf';
}

export const indexingWorkflow = workflow<IndexingWorkflowInput>(
  'indexing',
  async ({ embeddingIds, documentPath, indexType = 'hnsw' }) => {
    // Step 1: Load all embedding vectors
    const vectors = await step('load-vectors', async () => {
      return Promise.all(
        embeddingIds.map(id => loadEmbeddingVector(id))
      );
    });

    // Step 2: Build vector index (can be expensive)
    const index = await step('build-index', async () => {
      return buildVectorIndex(vectors, {
        type: indexType,
        dimension: vectors[0].dimensions,
        metric: 'cosine',
      });
    });

    // Step 3: Compute similarity neighbors for each vector
    const neighbors = await step('compute-neighbors', async () => {
      const result = [];
      for (const vector of vectors) {
        const similar = await index.search(vector.vector, 5);
        result.push({ vectorId: vector.id, neighbors: similar });
      }
      return result;
    });

    // Step 4: Generate index markdown
    const indexFile = await step('generate-index-markdown', async () => {
      return generateIndexMarkdown(index, neighbors);
    });

    // Step 5: Update embedding markdown with neighbor links
    await step('update-embedding-neighbors', async () => {
      for (const { vectorId, neighbors } of neighbors) {
        await updateEmbeddingNeighbors(vectorId, neighbors);
      }
    });

    // Step 6: Store index for search
    await step('store-index', async () => {
      return storeVectorIndex(index, indexFile);
    });

    return {
      success: true,
      indexFile,
      vectorCount: vectors.length,
    };
  }
);
```

**Performance Benefits**:
- **Durable indexing**: Index building can take hours for millions of vectors
- **Checkpointing**: Each step checkpointed, can resume
- **Monitoring**: Real-time progress in Vercel dashboard
- **Error handling**: If index build fails, can retry just that step

---

## 🔔 Workflow Triggers

### 1. Markdown File Watcher → Vercel Workflow

```typescript
import { chokidar } from 'chokidar';
import { chunkingWorkflow, embeddingWorkflow } from './workflows/vector-db/index.js';

// Watch for completed chunking strategy markdown
const watcher = chokidar.watch('.weaver/vectors/sources/**/chunking-strategy.md');

watcher.on('change', async (filePath) => {
  const parsed = await parseMarkdown(filePath);

  if (parsed.frontmatter.status === 'completed') {
    // Trigger Vercel Workflow
    await chunkingWorkflow.trigger({
      documentPath: parsed.frontmatter.doc_path,
      strategyMarkdownPath: filePath,
    });

    console.log(`✓ Triggered chunking workflow for ${filePath}`);
  }
});
```

### 2. Programmatic Triggers

```typescript
// From SOP or CLI
const result = await chunkingWorkflow.trigger({
  documentPath: 'vault/auth/oauth.md',
  strategyMarkdownPath: '.weaver/vectors/sources/doc-123/chunking-strategy.md',
});

console.log('Workflow ID:', result.id);
console.log('Status:', result.status);
```

### 3. Workflow-to-Workflow Triggers

```typescript
// Inside chunking workflow
await step('trigger-next-workflow', async () => {
  // Automatically trigger embedding workflow
  return embeddingWorkflow.trigger({
    chunkIds: chunks.map(c => c.id),
    documentPath,
  });
});
```

---

## 📊 Vercel Workflow Benefits

### 1. Durable Execution
```typescript
// If server crashes at Step 3, workflow automatically resumes
export const longRunningWorkflow = workflow('long-running', async () => {
  await step('step-1', async () => { /* completed */ });
  await step('step-2', async () => { /* completed */ });
  await step('step-3', async () => { /* IN PROGRESS - crashes here */ });
  // After restart, resumes from step-3 automatically
  await step('step-4', async () => { /* not started yet */ });
});
```

### 2. Built-in Observability

**Vercel Dashboard Shows**:
- Workflow status (running, completed, failed)
- Current step
- Step duration
- Input/output of each step
- Error details
- Retry attempts

**No custom monitoring needed!**

### 3. Type Safety

```typescript
// Input validation at compile time
interface ChunkingInput {
  documentPath: string;
  strategyMarkdownPath: string;
}

export const chunkingWorkflow = workflow<ChunkingInput>('chunking', async (input) => {
  // TypeScript knows input.documentPath exists
  // TypeScript knows input.invalidField doesn't exist (compile error)
});
```

### 4. Automatic Retries

```typescript
export const embeddingWorkflow = workflow('embedding', async ({ chunkIds }) => {
  const embeddings = await step('embed', async () => {
    // If OpenAI API fails with 429 (rate limit), automatically retries
    // If transformers model crashes, automatically retries
    // Exponential backoff built-in
    return await generateEmbeddings(chunkIds);
  });
});
```

### 5. Long-Running Operations

```typescript
// Can run for hours/days without issues
export const massiveIndexingWorkflow = workflow('massive-indexing', async () => {
  // Process 10 million vectors
  for (let i = 0; i < 100; i++) {
    await step(`batch-${i}`, async () => {
      // Process 100k vectors per batch
      // Each batch is checkpointed
      // Can run for hours
    });
  }
});
```

---

## 🔗 Markdown + Vercel Workflow Integration

### Workflow Lifecycle

```
1. User edits markdown template
   ↓
2. File watcher detects completion
   ↓
3. Triggers Vercel Workflow
   ↓
4. Workflow executes durable steps
   ↓
5. Workflow updates markdown with results
   ↓
6. Next workflow triggered (if needed)
```

### Example: Full Flow

```markdown
# 1. User fills chunking-strategy.md
---
status: pending → completed
selected_strategy: "semantic"
---

# 2. File watcher triggers Vercel Workflow
```

```typescript
// 3. Vercel Workflow executes
await chunkingWorkflow.trigger({ ... });
```

```markdown
# 4. Workflow updates document metadata
---
status: chunked
chunk_count: 42
chunk_files: [...]
---
```

```typescript
// 5. Workflow triggers embedding workflow
await embeddingWorkflow.trigger({ ... });
```

```markdown
# 6. Embedding workflow updates chunk markdown
---
embedding_id: "emb-abc123"
status: embedded
---
```

---

## 📁 Updated Directory Structure

```
weaver/
├── src/
│   ├── workflows/
│   │   ├── vector-db/
│   │   │   ├── chunking.workflow.ts      # Vercel Workflow definition
│   │   │   ├── embedding.workflow.ts     # Vercel Workflow definition
│   │   │   ├── indexing.workflow.ts      # Vercel Workflow definition
│   │   │   └── search.workflow.ts        # Vercel Workflow definition
│   │   │
│   │   └── learning-loop/
│   │       ├── perception.workflow.ts    # Migrate to Vercel Workflow
│   │       ├── reasoning.workflow.ts
│   │       ├── execution.workflow.ts
│   │       └── reflection.workflow.ts
│   │
│   ├── chunking/
│   │   ├── semantic.ts
│   │   ├── fixed-size.ts
│   │   └── recursive.ts
│   │
│   ├── embedding/
│   │   ├── transformers.ts
│   │   ├── openai.ts
│   │   └── cohere.ts
│   │
│   └── indexing/
│       ├── hnsw.ts
│       ├── flat.ts
│       └── ivf.ts
│
├── templates/
│   └── vector-db/
│       ├── chunking-strategy.md
│       ├── embedding-workflow.md
│       └── indexing-config.md
│
└── .weaver/
    └── vectors/
        ├── sources/
        ├── embeddings/
        └── indexes/
```

---

## 🚀 Migration Path

### Phase 1: Add Vercel Workflow (Week 1)
```bash
# Install Vercel Workflow
bun add @vercel/workflow

# Convert one workflow to Vercel Workflow
# Start with chunking workflow (simpler)
```

### Phase 2: Migrate Vector DB Workflows (Week 2)
```typescript
// Convert all vector DB workflows to Vercel Workflow
- chunking.workflow.ts
- embedding.workflow.ts
- indexing.workflow.ts
```

### Phase 3: Migrate Learning Loop (Week 3)
```typescript
// Convert learning loop workflows to Vercel Workflow
- perception.workflow.ts
- reasoning.workflow.ts
- execution.workflow.ts
- reflection.workflow.ts
```

### Phase 4: Production Deployment (Week 4)
```bash
# Deploy to Vercel
# Configure monitoring
# Setup alerts
# Performance tuning
```

---

## 📈 Success Metrics

### Performance
- [ ] Chunking workflow: Durable for 10k+ page documents
- [ ] Embedding workflow: Handles 100k+ chunks
- [ ] Indexing workflow: Builds indexes for 1M+ vectors
- [ ] Workflow survives crashes/restarts
- [ ] End-to-end observability working

### Developer Experience
- [ ] Type-safe workflow definitions
- [ ] Clear error messages
- [ ] Easy debugging in Vercel dashboard
- [ ] Simple workflow triggers
- [ ] Markdown integration seamless

---

## 🎯 Next Steps

1. **Install Vercel Workflow**: `bun add @vercel/workflow`
2. **Create chunking workflow**: First Vercel Workflow implementation
3. **Test durability**: Verify workflow survives crashes
4. **Add observability**: Monitor in Vercel dashboard
5. **Migrate remaining workflows**: Convert all to Vercel Workflow

---

**Status**: ✅ Architecture Complete
**Technology**: Vercel Workflow + Markdown
**Timeline**: 4 weeks for full migration
**Confidence**: 95% (Vercel Workflow is production-ready)
