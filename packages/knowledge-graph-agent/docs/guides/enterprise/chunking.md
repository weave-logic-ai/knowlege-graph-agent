---
title: Document Chunking Strategies
description: Guide to document chunking for large-scale knowledge graphs
category: guides/enterprise
---

# Document Chunking Strategies

## Overview

Document chunking splits large documents into smaller, semantically meaningful pieces for efficient storage, search, and AI processing. The knowledge-graph-agent supports 5 chunking strategies optimized for different content types.

## Prerequisites

- Node.js >= 20.0.0
- @weavelogic/knowledge-graph-agent installed
- Documents in markdown format

## Chunking Strategies

### 1. Fixed-Size Chunking

Splits documents into fixed-size chunks with configurable overlap.

**Best for**: Uniform content, bulk processing, predictable memory usage

```typescript
import { Chunker, ChunkingStrategy } from '@weavelogic/knowledge-graph-agent';

const chunker = new Chunker({
  strategy: ChunkingStrategy.FIXED,
  chunkSize: 1000,      // Characters per chunk
  chunkOverlap: 200,    // Overlap between chunks
});

const chunks = await chunker.chunk(documentContent);
```

**Configuration Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| chunkSize | number | 1000 | Target size in characters |
| chunkOverlap | number | 200 | Overlap between consecutive chunks |
| minChunkSize | number | 100 | Minimum chunk size |

### 2. Semantic Chunking

Splits on natural semantic boundaries like paragraphs and sentence endings.

**Best for**: Natural language documents, preserving context

```typescript
const chunker = new Chunker({
  strategy: ChunkingStrategy.SEMANTIC,
  maxChunkSize: 1500,
  preserveParagraphs: true,
});

const chunks = await chunker.chunk(documentContent);
```

**Configuration Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| maxChunkSize | number | 1500 | Maximum chunk size |
| preserveParagraphs | boolean | true | Keep paragraphs intact |
| sentenceBoundary | boolean | true | Split on sentence endings |

### 3. Markdown Chunking

Splits on markdown structure (headers, sections, code blocks).

**Best for**: Technical documentation, README files, wiki pages

```typescript
const chunker = new Chunker({
  strategy: ChunkingStrategy.MARKDOWN,
  splitOnHeaders: ['h1', 'h2', 'h3'],
  preserveCodeBlocks: true,
});

const chunks = await chunker.chunk(documentContent);
```

**Configuration Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| splitOnHeaders | string[] | ['h1', 'h2'] | Header levels to split on |
| preserveCodeBlocks | boolean | true | Keep code blocks intact |
| includeMetadata | boolean | true | Add header hierarchy to metadata |

### 4. Code Chunking

Specialized chunking for source code files.

**Best for**: Source code analysis, API documentation generation

```typescript
const chunker = new Chunker({
  strategy: ChunkingStrategy.CODE,
  language: 'typescript',
  splitOnFunctions: true,
  splitOnClasses: true,
});

const chunks = await chunker.chunk(sourceCode);
```

**Configuration Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| language | string | 'auto' | Programming language |
| splitOnFunctions | boolean | true | Split on function boundaries |
| splitOnClasses | boolean | true | Split on class definitions |
| includeImports | boolean | true | Include imports in each chunk |

### 5. Adaptive Chunking

Dynamically selects strategy based on content analysis.

**Best for**: Mixed content, automated processing pipelines

```typescript
const chunker = new Chunker({
  strategy: ChunkingStrategy.ADAPTIVE,
  targetChunkSize: 1000,
  minQualityScore: 0.7,
});

const chunks = await chunker.chunk(documentContent);
```

**Configuration Options**:
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| targetChunkSize | number | 1000 | Preferred chunk size |
| minQualityScore | number | 0.7 | Minimum semantic coherence score |
| fallbackStrategy | ChunkingStrategy | SEMANTIC | Strategy if adaptive fails |

## CLI Usage

```bash
# Chunk a single document
kg chunk --file doc.md --strategy markdown

# Chunk all documents in a directory
kg chunk --dir docs/ --strategy adaptive --output chunks/

# Preview chunks without saving
kg chunk --file doc.md --strategy semantic --dry-run
```

## Chunk Metadata

Each chunk includes metadata for context:

```typescript
interface Chunk {
  id: string;           // Unique chunk ID
  content: string;      // Chunk content
  metadata: {
    sourceFile: string; // Original file path
    position: number;   // Position in document
    totalChunks: number;// Total chunks from document
    strategy: string;   // Strategy used
    headers?: string[]; // Header hierarchy (markdown)
    startLine?: number; // Start line in source
    endLine?: number;   // End line in source
  };
}
```

## Best Practices

### 1. Choose Strategy by Content Type

| Content Type | Recommended Strategy | Reason |
|--------------|---------------------|--------|
| API docs | Markdown | Preserves structure |
| User guides | Semantic | Natural reading flow |
| Source code | Code | Function-level isolation |
| Mixed content | Adaptive | Auto-detection |
| Data files | Fixed | Predictable sizing |

### 2. Optimize Chunk Size

- **For search**: 500-1000 characters (better precision)
- **For AI context**: 1000-2000 characters (more context)
- **For embedding**: Match your embedding model's optimal input size

### 3. Handle Overlap

```typescript
// High overlap for semantic search
const searchChunker = new Chunker({
  strategy: ChunkingStrategy.FIXED,
  chunkSize: 800,
  chunkOverlap: 400,  // 50% overlap
});

// Low overlap for storage efficiency
const storageChunker = new Chunker({
  strategy: ChunkingStrategy.FIXED,
  chunkSize: 1000,
  chunkOverlap: 100,  // 10% overlap
});
```

## Integration with Vector Search

Chunks integrate with the vector search system:

```typescript
import { Chunker, VectorStore } from '@weavelogic/knowledge-graph-agent';

// Chunk documents
const chunker = new Chunker({ strategy: ChunkingStrategy.SEMANTIC });
const chunks = await chunker.chunk(document);

// Index chunks
const vectorStore = new VectorStore();
for (const chunk of chunks) {
  await vectorStore.upsert({
    id: chunk.id,
    content: chunk.content,
    metadata: chunk.metadata,
  });
}

// Search
const results = await vectorStore.search('query', { limit: 5 });
```

## Performance Considerations

| Strategy | Speed | Memory | Quality |
|----------|-------|--------|---------|
| Fixed | Fastest | Lowest | Good |
| Semantic | Fast | Low | Better |
| Markdown | Fast | Low | Best for docs |
| Code | Medium | Medium | Best for code |
| Adaptive | Slowest | Higher | Optimal |

## Troubleshooting

### Chunks Too Small
Increase `minChunkSize` or use semantic strategy.

### Lost Context
Increase `chunkOverlap` or use markdown strategy with header inclusion.

### Code Syntax Errors
Ensure `preserveCodeBlocks: true` for markdown or use code strategy.

## Next Steps

- [Vector Search Guide](../enterprise/ruvector-search.md)
- [Backup and Recovery](./backup-recovery.md)
- [Caching Guide](./caching.md)
