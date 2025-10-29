---
title: Practical Chunking Implementation Guide for Weave-NN
type: guide
status: complete
tags:
  - chunking
  - implementation-guide
  - practical-guide
  - configuration
  - weave-nn
  - type/implementation
  - status/in-progress
  - domain/chunking
domain: chunking
priority: high
visual:
  icon: "\U0001F4C4"
  color: '#7ED321'
  cssclasses:
    - type-guide
    - status-complete
    - priority-high
    - domain-chunking
updated: '2025-10-29T04:55:05.376Z'
author: ai-generated
version: '1.0'
keywords:
  - 'quick start: recommended configuration'
  - related
  - implementation architecture
  - core chunker class
  - type definitions
  - usage examples
  - 'example 1: learning journal entry'
  - 'example 2: knowledge article'
  - how embeddings work
  - applications
---

# Practical Chunking Implementation Guide for Weave-NN

## Quick Start: Recommended Configuration

For the Weave-NN learning vault, based on 2024-2025 research:

```typescript
// src/config/chunking-config.ts

export const CHUNKING_CONFIG = {
  // For learning experiences and reflections
  learning: {
    method: 'contextual_boundary',
    chunkSize: 384,
    overlap: 77,  // 20%
    enrichContext: true,
    preserveMetadata: true
  },

  // For knowledge articles and documentation
  knowledge: {
    method: 'semantic_boundary',
    chunkSize: 512,
    overlap: 102,  // 20%
    minChunkSize: 128,
    maxChunkSize: 768
  },

  // For code snippets and examples
  code: {
    method: 'structural',
    chunkSize: 256,
    overlap: 51,  // 20%
    preserveStructure: true
  },

  // For quick facts and definitions
  facts: {
    method: 'fixed',
    chunkSize: 128,
    overlap: 26  // 20%
  }
};
```

---





## Related

[[VECTOR-DB-MARKDOWN-WORKFLOW-ARCHITECTURE]] • [[WEAVER-COMPLETE-IMPLEMENTATION-GUIDE]]
## Related

[[chunking-quick-reference]]
## Implementation Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Content Ingestion                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Content Type Detection                      │
│  (Learning | Knowledge | Code | Facts | Memory)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│               Strategy Selection & Chunking                  │
│  • Contextual Boundary (Learning/Memory)                     │
│  • Semantic Boundary (Knowledge)                             │
│  • Structural (Code)                                         │
│  • Fixed Size (Facts)                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                    Context Enrichment                        │
│  • Temporal context                                          │
│  • Source metadata                                           │
│  • Relationship links                                        │
│  • Emotional/learning state                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Embedding with @xenova/transformers             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Vector Storage (IndexedDB)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Chunker Class

```typescript
// src/services/chunking/chunker.ts

import { pipeline } from '@xenova/transformers';
import type { ChunkingStrategy, ChunkResult, ChunkMetadata } from './types';

export class WeaveChunker {
  private embedModel: any = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    // Initialize embedding model
    this.embedModel = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'  // Fast, local model
    );

    this.initialized = true;
  }

  async chunk(
    content: string,
    strategy: ChunkingStrategy,
    metadata: Partial<ChunkMetadata> = {}
  ): Promise<ChunkResult[]> {
    if (!this.initialized) await this.initialize();

    // Detect content type if not provided
    const contentType = metadata.contentType || this.detectContentType(content);

    // Select and apply chunking strategy
    const chunks = await this.applyStrategy(content, strategy, contentType);

    // Enrich chunks with context
    const enrichedChunks = await this.enrichChunks(chunks, content, metadata);

    // Generate embeddings
    const results = await this.generateEmbeddings(enrichedChunks, metadata);

    return results;
  }

  private detectContentType(content: string): string {
    // Learning experience indicators
    if (this.hasLearningIndicators(content)) return 'learning';

    // Code indicators
    if (this.hasCodeIndicators(content)) return 'code';

    // Memory/reflection indicators
    if (this.hasMemoryIndicators(content)) return 'memory';

    // Default to knowledge
    return 'knowledge';
  }

  private hasLearningIndicators(content: string): boolean {
    const indicators = [
      /I learned/i,
      /Today I/i,
      /discovered that/i,
      /realized that/i,
      /understood/i,
      /struggled with/i,
      /practiced/i,
      /the key insight/i
    ];

    return indicators.some(pattern => pattern.test(content));
  }

  private hasCodeIndicators(content: string): boolean {
    const indicators = [
      /```/,                    // Code blocks
      /function\s+\w+\s*\(/,    // Function definitions
      /class\s+\w+/,            // Class definitions
      /const\s+\w+\s*=/,        // Variable declarations
      /import\s+.*from/,        // Imports
      /export\s+(default|const|function|class)/
    ];

    return indicators.some(pattern => pattern.test(content));
  }

  private hasMemoryIndicators(content: string): boolean {
    const indicators = [
      /I felt/i,
      /I remember/i,
      /experience/i,
      /reflection/i,
      /looking back/i,
      /in retrospect/i
    ];

    return indicators.some(pattern => pattern.test(content));
  }

  private async applyStrategy(
    content: string,
    strategy: ChunkingStrategy,
    contentType: string
  ): Promise<string[]> {
    switch (strategy) {
      case 'contextual_boundary':
        return this.contextualBoundaryChunking(content, contentType);

      case 'semantic_boundary':
        return this.semanticBoundaryChunking(content);

      case 'structural':
        return this.structuralChunking(content);

      case 'fixed':
        return this.fixedSizeChunking(content);

      default:
        return this.semanticBoundaryChunking(content);
    }
  }

  // Strategy implementations...

  private async contextualBoundaryChunking(
    content: string,
    contentType: string
  ): Promise<string[]> {
    const chunks: string[] = [];

    if (contentType === 'learning') {
      // Split by learning experiences
      const experiences = this.splitByExperiences(content);
      chunks.push(...experiences);
    } else if (contentType === 'memory') {
      // Split by memory episodes
      const episodes = this.splitByEpisodes(content);
      chunks.push(...episodes);
    } else {
      // Fall back to semantic chunking
      return this.semanticBoundaryChunking(content);
    }

    return chunks;
  }

  private splitByExperiences(content: string): string[] {
    // Split by paragraphs that indicate new experiences
    const paragraphs = content.split(/\n\s*\n/);
    const experiences: string[] = [];
    let currentExperience: string[] = [];

    for (const para of paragraphs) {
      const trimmed = para.trim();
      if (!trimmed) continue;

      // Check if this starts a new experience
      const startsNewExperience = this.hasLearningIndicators(trimmed);

      if (startsNewExperience && currentExperience.length > 0) {
        experiences.push(currentExperience.join('\n\n'));
        currentExperience = [trimmed];
      } else {
        currentExperience.push(trimmed);
      }
    }

    if (currentExperience.length > 0) {
      experiences.push(currentExperience.join('\n\n'));
    }

    return experiences;
  }

  private splitByEpisodes(content: string): string[] {
    // Similar to experiences but for memories
    return this.splitByExperiences(content);
  }

  private async semanticBoundaryChunking(content: string): Promise<string[]> {
    const sentences = this.splitIntoSentences(content);

    // If too few sentences, return as single chunk
    if (sentences.length < 3) return [content];

    // Create sentence windows
    const windowSize = 3;
    const windows: string[] = [];

    for (let i = 0; i <= sentences.length - windowSize; i++) {
      windows.push(sentences.slice(i, i + windowSize).join(' '));
    }

    // Generate embeddings for windows
    const embeddings: number[][] = [];
    for (const window of windows) {
      const result = await this.embedModel(window, {
        pooling: 'mean',
        normalize: true
      });
      embeddings.push(Array.from(result.data));
    }

    // Calculate similarities
    const similarities: number[] = [];
    for (let i = 0; i < embeddings.length - 1; i++) {
      similarities.push(this.cosineSimilarity(embeddings[i], embeddings[i + 1]));
    }

    // Find threshold (5th percentile of similarities)
    const sorted = [...similarities].sort((a, b) => a - b);
    const threshold = sorted[Math.floor(sorted.length * 0.05)] || 0.5;

    // Create chunks at semantic boundaries
    const chunks: string[] = [];
    let currentChunk: string[] = [sentences[0]];

    for (let i = 0; i < similarities.length; i++) {
      if (similarities[i] < threshold) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [sentences[i + 1]];
      } else {
        currentChunk.push(sentences[i + 1]);
      }
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  private structuralChunking(content: string): string[] {
    const chunks: string[] = [];

    // Split by code blocks
    const codeBlockRegex = /```[\s\S]*?```/g;
    const codeBlocks = content.match(codeBlockRegex) || [];

    if (codeBlocks.length > 0) {
      // Each code block is a chunk
      chunks.push(...codeBlocks);

      // Also chunk the text between code blocks
      const textParts = content.split(codeBlockRegex);
      for (const text of textParts) {
        const trimmed = text.trim();
        if (trimmed) {
          chunks.push(trimmed);
        }
      }
    } else {
      // No code blocks, split by structural markers
      const lines = content.split('\n');
      let currentChunk: string[] = [];

      for (const line of lines) {
        // Check for structural markers
        const isHeader = /^#{1,6}\s/.test(line);
        const isList = /^[-*]\s/.test(line);
        const isNumbered = /^\d+\.\s/.test(line);

        if ((isHeader || isList || isNumbered) && currentChunk.length > 0) {
          chunks.push(currentChunk.join('\n'));
          currentChunk = [line];
        } else {
          currentChunk.push(line);
        }
      }

      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join('\n'));
      }
    }

    return chunks;
  }

  private fixedSizeChunking(content: string): string[] {
    const chunkSize = 128;  // tokens
    const overlap = 26;     // 20%

    const sentences = this.splitIntoSentences(content);
    const chunks: string[] = [];
    let currentChunk: string[] = [];
    let currentSize = 0;

    for (const sentence of sentences) {
      const sentenceSize = this.estimateTokens(sentence);

      if (currentSize + sentenceSize > chunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));

        // Create overlap
        const overlapSentences = Math.ceil(currentChunk.length * 0.2);
        currentChunk = currentChunk.slice(-overlapSentences);
        currentSize = currentChunk.reduce(
          (sum, s) => sum + this.estimateTokens(s),
          0
        );
      }

      currentChunk.push(sentence);
      currentSize += sentenceSize;
    }

    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '));
    }

    return chunks;
  }

  private async enrichChunks(
    chunks: string[],
    originalContent: string,
    metadata: Partial<ChunkMetadata>
  ): Promise<Array<{ text: string; enrichedText: string }>> {
    const enriched = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const context = this.generateContext(chunk, originalContent, metadata, i);

      enriched.push({
        text: chunk,
        enrichedText: context ? `${context}\n\n${chunk}` : chunk
      });
    }

    return enriched;
  }

  private generateContext(
    chunk: string,
    fullContent: string,
    metadata: Partial<ChunkMetadata>,
    index: number
  ): string {
    const contextParts: string[] = [];

    // Source context
    if (metadata.source) {
      contextParts.push(`Source: ${metadata.source}`);
    }

    // Temporal context
    if (metadata.timestamp) {
      const date = new Date(metadata.timestamp);
      contextParts.push(`Date: ${date.toLocaleDateString()}`);
    }

    // Topic context
    if (metadata.topic) {
      contextParts.push(`Topic: ${metadata.topic}`);
    }

    // Learning context
    if (metadata.learningContext) {
      contextParts.push(`Context: ${metadata.learningContext}`);
    }

    // Emotional context
    if (metadata.emotionalState) {
      contextParts.push(`Emotional state: ${metadata.emotionalState}`);
    }

    // Position context
    const totalChunks = fullContent.split(/\n\s*\n/).length;
    if (totalChunks > 1) {
      contextParts.push(`Part ${index + 1} of ${totalChunks}`);
    }

    return contextParts.join('. ') + (contextParts.length > 0 ? '.' : '');
  }

  private async generateEmbeddings(
    chunks: Array<{ text: string; enrichedText: string }>,
    metadata: Partial<ChunkMetadata>
  ): Promise<ChunkResult[]> {
    const results: ChunkResult[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const { text, enrichedText } = chunks[i];

      // Generate embedding from enriched text
      const result = await this.embedModel(enrichedText, {
        pooling: 'mean',
        normalize: true
      });

      results.push({
        id: `${metadata.source || 'chunk'}-${i}`,
        text,
        enrichedText,
        embedding: Array.from(result.data),
        metadata: {
          ...metadata,
          chunkIndex: i,
          tokenCount: this.estimateTokens(text),
          createdAt: Date.now()
        } as ChunkMetadata
      });
    }

    return results;
  }

  // Utility methods

  private splitIntoSentences(text: string): string[] {
    // Simple sentence splitter
    return text
      .split(/(?<=[.!?])\s+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  private estimateTokens(text: string): number {
    // Rough approximation: words * 1.3
    return Math.ceil(text.split(/\s+/).length * 1.3);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
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

---

## Type Definitions

```typescript
// src/services/chunking/types.ts

export type ChunkingStrategy =
  | 'contextual_boundary'  // For learning experiences
  | 'semantic_boundary'    // For knowledge articles
  | 'structural'           // For code and structured content
  | 'fixed';               // For simple facts

export type ContentType =
  | 'learning'     // Learning experiences, lessons learned
  | 'knowledge'    // Articles, documentation
  | 'memory'       // Reflections, memories
  | 'code'         // Code snippets, examples
  | 'fact';        // Definitions, quick facts

export interface ChunkMetadata {
  source: string;
  contentType: ContentType;
  timestamp: number;
  topic?: string;
  tags?: string[];
  learningContext?: string;
  emotionalState?: string;
  chunkIndex: number;
  tokenCount: number;
  createdAt: number;
  [key: string]: any;
}

export interface ChunkResult {
  id: string;
  text: string;
  enrichedText: string;
  embedding: number[];
  metadata: ChunkMetadata;
}
```

---

## Usage Examples

### Example 1: Learning Journal Entry

```typescript
// src/examples/chunk-learning-journal.ts

import { WeaveChunker } from '../services/chunking/chunker';
import { CHUNKING_CONFIG } from '../config/chunking-config';

async function processLearningJournal() {
  const chunker = new WeaveChunker();
  await chunker.initialize();

  const journalEntry = `
Today I learned about async/await in JavaScript. It makes asynchronous code
much more readable than promise chains. At first, I struggled with error
handling, but then I realized you can use try/catch blocks just like with
synchronous code.

The key insight was understanding that async functions always return promises,
and await pauses execution until the promise resolves. This mental model helped
everything click into place.

I practiced by refactoring some old callback-based code to use async/await.
The difference in readability was striking - the code now reads almost like
synchronous code, making it much easier to understand the flow.
  `.trim();

  const chunks = await chunker.chunk(
    journalEntry,
    'contextual_boundary',
    {
      source: 'learning-journal',
      contentType: 'learning',
      timestamp: Date.now(),
      topic: 'JavaScript',
      tags: ['async', 'await', 'promises'],
      learningContext: 'self-study',
      emotionalState: 'initially frustrated, then satisfied'
    }
  );

  console.log(`Generated ${chunks.length} chunks:`);

  for (const chunk of chunks) {
    console.log('\n--- Chunk ---');
    console.log('Original:', chunk.text);
    console.log('Enriched:', chunk.enrichedText);
    console.log('Tokens:', chunk.metadata.tokenCount);
    console.log('Embedding dimensions:', chunk.embedding.length);
  }

  return chunks;
}
```

### Example 2: Knowledge Article

```typescript
async function processKnowledgeArticle() {
  const chunker = new WeaveChunker();
  await chunker.initialize();

  const article = `
# Understanding Vector Embeddings

Vector embeddings are numerical representations of text that capture semantic
meaning. They transform words, sentences, or documents into dense vectors in
a high-dimensional space.

## How Embeddings Work

Embedding models are trained to place semantically similar text close together
in vector space. For example, "cat" and "kitten" would have similar embeddings,
while "cat" and "airplane" would be far apart.

## Applications

Embeddings enable semantic search, where you can find relevant documents based
on meaning rather than keyword matching. This is particularly useful for
question answering and recommendation systems.
  `.trim();

  const chunks = await chunker.chunk(
    article,
    'semantic_boundary',
    {
      source: 'knowledge-base',
      contentType: 'knowledge',
      timestamp: Date.now(),
      topic: 'Machine Learning',
      tags: ['embeddings', 'NLP', 'vector-space']
    }
  );

  return chunks;
}
```

### Example 3: Code Documentation

```typescript
async function processCodeDocumentation() {
  const chunker = new WeaveChunker();
  await chunker.initialize();

  const codeDoc = `
Here's how to implement a simple embedding search:

\`\`\`typescript
async function searchEmbeddings(query: string, embeddings: Embedding[]) {
  const queryEmbedding = await generateEmbedding(query);

  const results = embeddings.map(emb => ({
    id: emb.id,
    similarity: cosineSimilarity(queryEmbedding, emb.vector)
  }));

  return results.sort((a, b) => b.similarity - a.similarity);
}
\`\`\`

This function first generates an embedding for the query, then calculates
the cosine similarity with each stored embedding, and finally sorts by
similarity to return the most relevant results.
  `.trim();

  const chunks = await chunker.chunk(
    codeDoc,
    'structural',
    {
      source: 'code-examples',
      contentType: 'code',
      timestamp: Date.now(),
      topic: 'Embedding Search',
      tags: ['typescript', 'search', 'similarity']
    }
  );

  return chunks;
}
```

---

## Integration with Weave-NN Architecture

### Vault Scanner Integration

```typescript
// src/services/vault/scanner.ts

import { WeaveChunker } from '../chunking/chunker';
import type { VaultEntry } from './types';

export class VaultScanner {
  private chunker: WeaveChunker;

  constructor() {
    this.chunker = new WeaveChunker();
  }

  async initialize() {
    await this.chunker.initialize();
  }

  async scanAndChunk(entry: VaultEntry): Promise<ChunkResult[]> {
    // Detect content type
    const contentType = this.detectContentType(entry);

    // Select appropriate strategy
    const strategy = this.selectStrategy(contentType);

    // Extract metadata
    const metadata = this.extractMetadata(entry);

    // Chunk and embed
    const chunks = await this.chunker.chunk(
      entry.content,
      strategy,
      {
        ...metadata,
        contentType,
        source: entry.path
      }
    );

    return chunks;
  }

  private detectContentType(entry: VaultEntry): ContentType {
    // Check file path patterns
    if (entry.path.includes('journal')) return 'learning';
    if (entry.path.includes('code')) return 'code';
    if (entry.path.includes('reflection')) return 'memory';

    // Check frontmatter
    if (entry.frontmatter?.type) return entry.frontmatter.type;

    // Use content-based detection
    return 'knowledge';
  }

  private selectStrategy(contentType: ContentType): ChunkingStrategy {
    const strategyMap: Record<ContentType, ChunkingStrategy> = {
      learning: 'contextual_boundary',
      memory: 'contextual_boundary',
      knowledge: 'semantic_boundary',
      code: 'structural',
      fact: 'fixed'
    };

    return strategyMap[contentType];
  }

  private extractMetadata(entry: VaultEntry): Partial<ChunkMetadata> {
    return {
      timestamp: entry.mtime || Date.now(),
      topic: entry.frontmatter?.topic,
      tags: entry.frontmatter?.tags,
      learningContext: entry.frontmatter?.context,
      emotionalState: entry.frontmatter?.mood
    };
  }
}
```

---

## Performance Optimization

### Batch Processing

```typescript
// src/services/chunking/batch-processor.ts

export class BatchChunkProcessor {
  private chunker: WeaveChunker;
  private maxConcurrent = 5;

  constructor() {
    this.chunker = new WeaveChunker();
  }

  async initialize() {
    await this.chunker.initialize();
  }

  async processBatch(entries: VaultEntry[]): Promise<ChunkResult[]> {
    const results: ChunkResult[] = [];

    // Process in batches to avoid overwhelming the system
    for (let i = 0; i < entries.length; i += this.maxConcurrent) {
      const batch = entries.slice(i, i + this.maxConcurrent);

      const batchResults = await Promise.all(
        batch.map(entry => this.processEntry(entry))
      );

      results.push(...batchResults.flat());

      // Progress reporting
      const progress = Math.min(100, ((i + batch.length) / entries.length) * 100);
      console.log(`Progress: ${progress.toFixed(1)}%`);
    }

    return results;
  }

  private async processEntry(entry: VaultEntry): Promise<ChunkResult[]> {
    const contentType = this.detectContentType(entry);
    const strategy = this.selectStrategy(contentType);

    return this.chunker.chunk(entry.content, strategy, {
      source: entry.path,
      contentType,
      timestamp: entry.mtime
    });
  }
}
```

### Caching

```typescript
// src/services/chunking/cache.ts

export class ChunkCache {
  private cache = new Map<string, ChunkResult[]>();

  getCacheKey(content: string, strategy: ChunkingStrategy): string {
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `${hash}-${strategy}`;
  }

  get(content: string, strategy: ChunkingStrategy): ChunkResult[] | null {
    const key = this.getCacheKey(content, strategy);
    return this.cache.get(key) || null;
  }

  set(content: string, strategy: ChunkingStrategy, chunks: ChunkResult[]) {
    const key = this.getCacheKey(content, strategy);
    this.cache.set(key, chunks);

    // Limit cache size
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  clear() {
    this.cache.clear();
  }
}
```

---

## Testing Strategy

```typescript
// src/services/chunking/__tests__/chunker.test.ts

import { describe, it, expect, beforeAll } from 'vitest';
import { WeaveChunker } from '../chunker';

describe('WeaveChunker', () => {
  let chunker: WeaveChunker;

  beforeAll(async () => {
    chunker = new WeaveChunker();
    await chunker.initialize();
  });

  describe('Content Type Detection', () => {
    it('should detect learning content', async () => {
      const content = 'Today I learned about async/await...';
      const chunks = await chunker.chunk(content, 'contextual_boundary', {
        source: 'test'
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.contentType).toBe('learning');
    });

    it('should detect code content', async () => {
      const content = '```typescript\nfunction test() {}\n```';
      const chunks = await chunker.chunk(content, 'structural', {
        source: 'test',
        contentType: 'code'
      });

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks[0].metadata.contentType).toBe('code');
    });
  });

  describe('Chunking Strategies', () => {
    it('should create semantic boundaries', async () => {
      const content = `
First paragraph about embeddings.

Second paragraph about chunking strategies.

Third paragraph about retrieval.
      `.trim();

      const chunks = await chunker.chunk(content, 'semantic_boundary', {
        source: 'test'
      });

      expect(chunks.length).toBeGreaterThanOrEqual(3);
    });

    it('should preserve context in enrichment', async () => {
      const content = 'Test content';
      const chunks = await chunker.chunk(content, 'fixed', {
        source: 'test-source',
        topic: 'test-topic',
        timestamp: Date.now()
      });

      expect(chunks[0].enrichedText).toContain('test-source');
      expect(chunks[0].enrichedText).toContain('test-topic');
    });
  });

  describe('Embeddings', () => {
    it('should generate embeddings', async () => {
      const content = 'Test content for embeddings';
      const chunks = await chunker.chunk(content, 'fixed', {
        source: 'test'
      });

      expect(chunks[0].embedding).toBeDefined();
      expect(chunks[0].embedding.length).toBeGreaterThan(0);
      expect(typeof chunks[0].embedding[0]).toBe('number');
    });

    it('should normalize embeddings', async () => {
      const content = 'Test content';
      const chunks = await chunker.chunk(content, 'fixed', {
        source: 'test'
      });

      // Check if normalized (magnitude ≈ 1)
      const magnitude = Math.sqrt(
        chunks[0].embedding.reduce((sum, val) => sum + val * val, 0)
      );

      expect(magnitude).toBeCloseTo(1, 1);
    });
  });
});
```

---

## Configuration Best Practices

### 1. Learning Journal
```typescript
{
  method: 'contextual_boundary',
  chunkSize: 384,        // Medium chunks for experiences
  overlap: 77,           // 20% overlap
  enrichContext: true,   // Add temporal/emotional context
  contentType: 'learning'
}
```

### 2. Knowledge Base
```typescript
{
  method: 'semantic_boundary',
  chunkSize: 512,        // Larger chunks for concepts
  overlap: 102,          // 20% overlap
  enrichContext: true,
  contentType: 'knowledge'
}
```

### 3. Code Examples
```typescript
{
  method: 'structural',
  chunkSize: 256,        // Smaller chunks for code
  overlap: 51,           // 20% overlap
  preserveStructure: true,
  contentType: 'code'
}
```

### 4. Quick Facts
```typescript
{
  method: 'fixed',
  chunkSize: 128,        // Small chunks
  overlap: 26,           // 20% overlap
  contentType: 'fact'
}
```

---

## Troubleshooting

### Issue: Chunks too large
**Solution**: Reduce `chunkSize` or switch to more granular strategy

### Issue: Context loss between chunks
**Solution**: Increase `overlap` to 25-30%

### Issue: Slow processing
**Solution**: Use batch processing with caching

### Issue: Poor retrieval accuracy
**Solution**: Switch to `contextual_boundary` or `semantic_boundary`

### Issue: Memory usage too high
**Solution**: Process in smaller batches, implement chunk cache eviction

---

*Implementation Guide - Last Updated: October 27, 2024*
