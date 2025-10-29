---
title: Chunking System Implementation Design
type: architecture
status: in-progress
created_date: {}
updated_date: '2025-10-28'
tags:
  - chunking
  - implementation-design
  - architecture
  - embeddings
  - semantic-search
category: technical
domain: chunking
scope: module
audience:
  - developers
  - architects
related_concepts:
  - chunking-strategies
  - vector-embeddings
  - semantic-search
  - memorographic-embeddings
  - learning-loop
related_files:
  - CHUNKING-STRATEGY-SYNTHESIS.md
  - chunking-implementation-guide.md
  - chunking-quick-reference.md
author: ai-generated
version: 1.0.0
priority: high
visual:
  icon: 🏗️
  color: '#F59E0B'
  cssclasses:
    - type-architecture
    - status-in-progress
    - priority-high
    - domain-chunking
icon: 🏗️
---

# Chunking System Implementation Design

**Version**: 1.0.0
**Date**: 2025-10-27
**Status**: 🏗️ Design Phase

---

## 📚 Related Documentation

### Chunking System
- [[CHUNKING-STRATEGY-SYNTHESIS]] - High-level chunking strategy
- [[chunking-implementation-guide]] - Implementation walkthrough
- [[chunking-quick-reference]] - Quick reference
- [[chunking-strategies-research-2024-2025]] - Academic research

### Memory & Embeddings
- [[memorographic-embeddings-research]] - Memory-specific embeddings
- [[VECTOR-DB-MARKDOWN-WORKFLOW-ARCHITECTURE]] - Vector database integration
- [[PHASE-12-LEARNING-LOOP-BLUEPRINT]] - Learning loop memory system

### Phase 13 Components
- [[phase-13-master-plan]] - Overall integration plan
- [[WEAVER-COMPLETE-IMPLEMENTATION-GUIDE]] - Weaver architecture
- [[MARKDOWN-ASYNC-WORKFLOW-ARCHITECTURE]] - Markdown workflow architecture

---

## 🎯 Design Goals

1. **Extensible**: Easy to add new chunking strategies
2. **Type-safe**: Full TypeScript support with strict types
3. **Efficient**: Minimize computational overhead
4. **Observable**: Comprehensive logging and metrics
5. **Testable**: Clear interfaces for unit and integration testing
6. **Integrated**: Seamless workflow engine integration

---

## 🏗️ System Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Workflow Engine                          │
│  (Existing: src/workflow-engine/index.ts)                   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ triggers
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Vector DB Chunking Workflow                     │
│       (src/workflows/vector-db-workflows.ts)                │
│                                                              │
│  - Parses chunking-strategy.md                              │
│  - Selects chunking strategy                                │
│  - Configures chunker                                       │
│  - Orchestrates chunking process                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ delegates to
                        ↓
┌─────────────────────────────────────────────────────────────┐
│              Chunking Strategy Selector                      │
│     (src/chunking/strategy-selector.ts) [NEW]               │
│                                                              │
│  selectStrategy(contentType, config)                        │
│  → Returns appropriate chunker instance                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ returns
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                  Chunking Plugins                            │
│          (src/chunking/plugins/) [NEW]                      │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Event-Based     │  │  Semantic        │                │
│  │  Chunker         │  │  Boundary        │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Preference      │  │  Step-Based      │                │
│  │  Signal Chunker  │  │  Chunker         │                │
│  └──────────────────┘  └──────────────────┘                │
│                                                              │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  PPL-Based       │  │  Late Chunking   │                │
│  │  Chunker         │  │  (Advanced)      │                │
│  └──────────────────┘  └──────────────────┘                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ implements
                        ↓
┌─────────────────────────────────────────────────────────────┐
│                   Chunker Interface                          │
│       (src/chunking/types.ts) [NEW]                         │
│                                                              │
│  interface Chunker {                                        │
│    chunk(document, config): Promise<Chunk[]>                │
│    validate(config): ValidationResult                       │
│  }                                                           │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. User completes chunking-strategy.md
   ↓
2. Workflow engine detects file change
   ↓
3. vector-db:chunking workflow triggers
   ↓
4. Parse markdown → extract content type + config
   ↓
5. Strategy selector → select chunking plugin
   ↓
6. Chunking plugin → chunk document
   ↓
7. Generate chunk markdown files + metadata
   ↓
8. Update document metadata
   ↓
9. Trigger embedding workflow
```

---

## 📁 File Structure

```
weaver/
├── src/
│   ├── chunking/                          [NEW]
│   │   ├── index.ts                       # Public API
│   │   ├── types.ts                       # Interfaces & types
│   │   ├── strategy-selector.ts           # Strategy selection logic
│   │   ├── metadata-enricher.ts           # Chunk metadata generation
│   │   ├── validation.ts                  # Config validation
│   │   │
│   │   ├── plugins/                       # Chunking strategy plugins
│   │   │   ├── index.ts                   # Plugin registry
│   │   │   ├── base-chunker.ts            # Abstract base class
│   │   │   ├── event-based-chunker.ts     # Episodic memory
│   │   │   ├── semantic-boundary-chunker.ts # Semantic memory
│   │   │   ├── preference-signal-chunker.ts # Preference memory
│   │   │   ├── step-based-chunker.ts      # Procedural memory
│   │   │   ├── ppl-chunker.ts             # PPL-based (baseline)
│   │   │   └── late-chunker.ts            # Advanced (Phase 2)
│   │   │
│   │   └── utils/                         # Helper utilities
│   │       ├── tokenizer.ts               # Token counting
│   │       ├── boundary-detector.ts       # Boundary detection
│   │       ├── context-extractor.ts       # Context window extraction
│   │       └── similarity.ts              # Embedding similarity
│   │
│   ├── workflows/
│   │   └── vector-db-workflows.ts         [MODIFIED]
│   │       # Enhanced chunking workflow
│   │
│   └── templates/
│       └── vector-db/                     [NEW]
│           └── chunking-strategy.md       # User template
│
├── tests/
│   └── chunking/                          [NEW]
│       ├── plugins/
│       │   ├── event-based-chunker.test.ts
│       │   ├── semantic-boundary-chunker.test.ts
│       │   ├── preference-signal-chunker.test.ts
│       │   └── step-based-chunker.test.ts
│       ├── strategy-selector.test.ts
│       └── integration.test.ts
│
└── docs/
    ├── CHUNKING-STRATEGY-SYNTHESIS.md     [CREATED]
    └── CHUNKING-IMPLEMENTATION-DESIGN.md  [THIS FILE]
```

---

## 🔧 Core Type Definitions

### `src/chunking/types.ts`

```typescript
/**
 * Content type determines which chunking strategy to use
 */
export type ContentType =
  | 'episodic'      // Task experiences, events
  | 'semantic'      // Reflections, learned patterns
  | 'preference'    // User feedback, decisions
  | 'procedural'    // SOPs, workflows, steps
  | 'working'       // Active context (no chunking)
  | 'document';     // General documents (PPL-based)

/**
 * Memory level in hierarchical architecture
 */
export type MemoryLevel =
  | 'atomic'        // Individual memories
  | 'episodic'      // Event sequences
  | 'semantic'      // Abstract patterns
  | 'strategic';    // High-level strategies

/**
 * A single chunk with content and metadata
 */
export interface Chunk {
  id: string;
  content: string;
  metadata: ChunkMetadata;
  embedding?: number[];
}

/**
 * Chunk metadata (comprehensive)
 */
export interface ChunkMetadata {
  // Core identifiers
  chunk_id: string;
  doc_id: string;
  source_path: string;
  index: number;

  // Content classification
  content_type: ContentType;
  memory_level: MemoryLevel;

  // Chunking metadata
  strategy: string;
  size_tokens: number;
  overlap_tokens?: number;
  boundary_type?: 'event' | 'semantic' | 'step' | 'decision' | 'fixed';

  // Temporal metadata
  created_at: Date;
  source_timestamp?: Date;
  decay_function?: 'exponential' | 'linear' | 'none';

  // Relational metadata
  parent_chunk?: string;
  child_chunks?: string[];
  previous_chunk?: string;
  next_chunk?: string;
  related_chunks?: string[];

  // Learning metadata
  learning_session_id?: string;
  sop_id?: string;
  stage?: 'perception' | 'reasoning' | 'execution' | 'reflection';

  // Semantic metadata
  concepts?: string[];
  entities?: string[];
  confidence?: number;

  // Contextual enrichment
  context_before?: string;
  context_after?: string;
  summary?: string;
}

/**
 * Chunking configuration (strategy-specific)
 */
export interface ChunkingConfig {
  // Common settings
  maxTokens?: number;
  overlap?: number;
  includeContext?: boolean;
  contextWindowSize?: number;

  // Event-based settings
  eventBoundaries?: 'task-start' | 'task-end' | 'phase-transition';
  temporalLinks?: boolean;

  // Semantic boundary settings
  embeddingModel?: string;
  similarityThreshold?: number;
  minChunkSize?: number;

  // Preference signal settings
  decisionKeywords?: string[];
  includeAlternatives?: boolean;

  // Step-based settings
  stepDelimiters?: string[];
  includePrerequisites?: boolean;
  includeOutcomes?: boolean;

  // PPL-based settings
  pplThreshold?: number;
  slidingWindowSize?: number;
}

/**
 * Chunking result
 */
export interface ChunkingResult {
  chunks: Chunk[];
  stats: ChunkingStats;
  warnings?: string[];
}

/**
 * Chunking statistics
 */
export interface ChunkingStats {
  totalChunks: number;
  avgChunkSize: number;
  minChunkSize: number;
  maxChunkSize: number;
  totalTokens: number;
  strategy: string;
  durationMs: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Base chunker interface
 */
export interface Chunker {
  /**
   * Name of the chunking strategy
   */
  readonly name: string;

  /**
   * Chunk a document into segments
   */
  chunk(
    document: string,
    config: ChunkingConfig
  ): Promise<ChunkingResult>;

  /**
   * Validate configuration
   */
  validate(config: ChunkingConfig): ValidationResult;

  /**
   * Get default configuration
   */
  getDefaultConfig(): ChunkingConfig;
}
```

---

## 🔌 Plugin Implementations

### Base Chunker (Abstract Class)

**File**: `src/chunking/plugins/base-chunker.ts`

```typescript
import type { Chunker, ChunkingConfig, ChunkingResult, ValidationResult, Chunk } from '../types.js';
import { logger } from '../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

export abstract class BaseChunker implements Chunker {
  abstract readonly name: string;

  abstract chunk(
    document: string,
    config: ChunkingConfig
  ): Promise<ChunkingResult>;

  abstract validate(config: ChunkingConfig): ValidationResult;

  abstract getDefaultConfig(): ChunkingConfig;

  /**
   * Helper: Create chunk with metadata
   */
  protected createChunk(
    content: string,
    index: number,
    docId: string,
    sourcePath: string,
    config: ChunkingConfig
  ): Chunk {
    const chunkId = `chunk-${uuidv4()}`;

    return {
      id: chunkId,
      content,
      metadata: {
        chunk_id: chunkId,
        doc_id: docId,
        source_path: sourcePath,
        index,
        strategy: this.name,
        size_tokens: this.countTokens(content),
        overlap_tokens: config.overlap || 0,
        created_at: new Date(),
        content_type: 'document', // Override in subclasses
        memory_level: 'atomic',   // Override in subclasses
      },
    };
  }

  /**
   * Helper: Count tokens (approximation)
   */
  protected countTokens(text: string): number {
    // Simple approximation: 1 token ≈ 4 characters
    // TODO: Replace with actual tokenizer when available
    return Math.ceil(text.length / 4);
  }

  /**
   * Helper: Compute statistics
   */
  protected computeStats(
    chunks: Chunk[],
    durationMs: number
  ): ChunkingStats {
    const sizes = chunks.map(c => c.metadata.size_tokens);

    return {
      totalChunks: chunks.length,
      avgChunkSize: sizes.reduce((a, b) => a + b, 0) / sizes.length,
      minChunkSize: Math.min(...sizes),
      maxChunkSize: Math.max(...sizes),
      totalTokens: sizes.reduce((a, b) => a + b, 0),
      strategy: this.name,
      durationMs,
    };
  }

  /**
   * Helper: Log chunking process
   */
  protected logChunking(
    phase: 'start' | 'complete',
    config: ChunkingConfig,
    result?: ChunkingResult
  ): void {
    if (phase === 'start') {
      logger.debug(`Starting ${this.name} chunking`, { config });
    } else if (result) {
      logger.info(`✅ ${this.name} chunking complete`, {
        strategy: this.name,
        chunks: result.stats.totalChunks,
        avgSize: result.stats.avgChunkSize,
        duration: result.stats.durationMs,
      });
    }
  }
}
```

### Event-Based Chunker

**File**: `src/chunking/plugins/event-based-chunker.ts`

```typescript
import { BaseChunker } from './base-chunker.js';
import type { ChunkingConfig, ChunkingResult, ValidationResult, Chunk } from '../types.js';

/**
 * Event-Based Chunker
 *
 * Chunks documents at event boundaries (task start/end, phase transitions).
 * Use case: Task execution experiences in learning loop.
 */
export class EventBasedChunker extends BaseChunker {
  readonly name = 'event-based';

  async chunk(
    document: string,
    config: ChunkingConfig
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    this.logChunking('start', config);

    const chunks: Chunk[] = [];
    const eventBoundaries = this.detectEventBoundaries(document, config);

    // Split document at event boundaries
    let previousEnd = 0;
    for (let i = 0; i < eventBoundaries.length; i++) {
      const boundary = eventBoundaries[i];
      const chunkContent = document.slice(previousEnd, boundary.position);

      if (chunkContent.trim().length > 0) {
        const chunk = this.createChunk(
          chunkContent.trim(),
          i,
          config.docId || 'unknown',
          config.sourcePath || 'unknown',
          config
        );

        // Override metadata for event-based chunks
        chunk.metadata.content_type = 'episodic';
        chunk.metadata.memory_level = 'episodic';
        chunk.metadata.boundary_type = 'event';

        // Add temporal links
        if (config.temporalLinks && i > 0) {
          chunk.metadata.previous_chunk = chunks[i - 1].id;
          chunks[i - 1].metadata.next_chunk = chunk.id;
        }

        chunks.push(chunk);
      }

      previousEnd = boundary.position;
    }

    // Add final chunk
    const finalContent = document.slice(previousEnd).trim();
    if (finalContent.length > 0) {
      const finalChunk = this.createChunk(
        finalContent,
        chunks.length,
        config.docId || 'unknown',
        config.sourcePath || 'unknown',
        config
      );
      finalChunk.metadata.content_type = 'episodic';
      finalChunk.metadata.memory_level = 'episodic';
      finalChunk.metadata.boundary_type = 'event';

      if (config.temporalLinks && chunks.length > 0) {
        finalChunk.metadata.previous_chunk = chunks[chunks.length - 1].id;
        chunks[chunks.length - 1].metadata.next_chunk = finalChunk.id;
      }

      chunks.push(finalChunk);
    }

    const durationMs = Date.now() - startTime;
    const result = {
      chunks,
      stats: this.computeStats(chunks, durationMs),
      warnings: [],
    };

    this.logChunking('complete', config, result);
    return result;
  }

  validate(config: ChunkingConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.eventBoundaries) {
      errors.push('eventBoundaries is required for event-based chunking');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getDefaultConfig(): ChunkingConfig {
    return {
      eventBoundaries: 'phase-transition',
      temporalLinks: true,
      includeContext: true,
      contextWindowSize: 50,
    };
  }

  /**
   * Detect event boundaries in document
   */
  private detectEventBoundaries(
    document: string,
    config: ChunkingConfig
  ): Array<{ position: number; type: string }> {
    const boundaries: Array<{ position: number; type: string }> = [];

    // Define event boundary patterns based on config
    const patterns: Record<string, RegExp[]> = {
      'task-start': [
        /^## Task Start/gm,
        /^# Starting Task/gm,
      ],
      'task-end': [
        /^## Task Complete/gm,
        /^# Task Completed/gm,
      ],
      'phase-transition': [
        /^## Stage: Perception/gm,
        /^## Stage: Reasoning/gm,
        /^## Stage: Execution/gm,
        /^## Stage: Reflection/gm,
        /^---\nstage:/gm,
      ],
    };

    const boundaryType = config.eventBoundaries || 'phase-transition';
    const boundaryPatterns = patterns[boundaryType] || patterns['phase-transition'];

    for (const pattern of boundaryPatterns) {
      let match;
      while ((match = pattern.exec(document)) !== null) {
        boundaries.push({
          position: match.index,
          type: boundaryType,
        });
      }
    }

    // Sort by position
    boundaries.sort((a, b) => a.position - b.position);

    return boundaries;
  }
}
```

### Semantic Boundary Chunker

**File**: `src/chunking/plugins/semantic-boundary-chunker.ts`

```typescript
import { BaseChunker } from './base-chunker.js';
import type { ChunkingConfig, ChunkingResult, ValidationResult, Chunk } from '../types.js';

/**
 * Semantic Boundary Chunker
 *
 * Detects topic shifts using embedding similarity.
 * Use case: User reflections, learned insights.
 */
export class SemanticBoundaryChunker extends BaseChunker {
  readonly name = 'semantic-boundary';

  async chunk(
    document: string,
    config: ChunkingConfig
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    this.logChunking('start', config);

    // Split into sentences
    const sentences = this.splitIntoSentences(document);

    // Detect semantic boundaries
    const boundaries = await this.detectSemanticBoundaries(sentences, config);

    // Create chunks at boundaries
    const chunks: Chunk[] = [];
    let currentChunk: string[] = [];
    let chunkIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      currentChunk.push(sentences[i]);

      // Check if we hit a boundary or size limit
      const isBoundary = boundaries.includes(i);
      const chunkText = currentChunk.join(' ');
      const tokens = this.countTokens(chunkText);
      const maxTokens = config.maxTokens || 512;

      if (isBoundary || tokens >= maxTokens || i === sentences.length - 1) {
        if (currentChunk.length > 0) {
          const chunk = this.createChunk(
            chunkText.trim(),
            chunkIndex++,
            config.docId || 'unknown',
            config.sourcePath || 'unknown',
            config
          );

          chunk.metadata.content_type = 'semantic';
          chunk.metadata.memory_level = 'semantic';
          chunk.metadata.boundary_type = 'semantic';

          // Add context enrichment
          if (config.includeContext) {
            const contextWindowSize = config.contextWindowSize || 50;
            chunk.metadata.context_before = this.extractContext(
              sentences,
              i - currentChunk.length,
              -contextWindowSize
            );
            chunk.metadata.context_after = this.extractContext(
              sentences,
              i,
              contextWindowSize
            );
          }

          chunks.push(chunk);
          currentChunk = [];
        }
      }
    }

    const durationMs = Date.now() - startTime;
    const result = {
      chunks,
      stats: this.computeStats(chunks, durationMs),
      warnings: [],
    };

    this.logChunking('complete', config, result);
    return result;
  }

  validate(config: ChunkingConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.maxTokens && config.maxTokens < 128) {
      errors.push('maxTokens must be at least 128 for semantic chunking');
    }

    if (config.similarityThreshold && (config.similarityThreshold < 0 || config.similarityThreshold > 1)) {
      errors.push('similarityThreshold must be between 0 and 1');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getDefaultConfig(): ChunkingConfig {
    return {
      maxTokens: 384,
      similarityThreshold: 0.75,
      minChunkSize: 128,
      includeContext: true,
      contextWindowSize: 50,
    };
  }

  /**
   * Split document into sentences
   */
  private splitIntoSentences(document: string): string[] {
    // Simple sentence splitting (can be enhanced)
    return document
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }

  /**
   * Detect semantic boundaries using sliding window
   */
  private async detectSemanticBoundaries(
    sentences: string[],
    config: ChunkingConfig
  ): Promise<number[]> {
    const boundaries: number[] = [];
    const threshold = config.similarityThreshold || 0.75;

    // For MVP, use simple heuristic: detect topic changes via keyword shift
    // TODO: Replace with embedding-based similarity in Phase 2

    for (let i = 1; i < sentences.length; i++) {
      const prevSentence = sentences[i - 1].toLowerCase();
      const currSentence = sentences[i].toLowerCase();

      // Simple keyword-based boundary detection
      const prevWords = new Set(prevSentence.split(/\s+/));
      const currWords = new Set(currSentence.split(/\s+/));

      const intersection = new Set([...prevWords].filter(x => currWords.has(x)));
      const union = new Set([...prevWords, ...currWords]);

      const similarity = intersection.size / union.size;

      if (similarity < threshold) {
        boundaries.push(i);
      }
    }

    return boundaries;
  }

  /**
   * Extract context window around position
   */
  private extractContext(
    sentences: string[],
    position: number,
    windowSize: number
  ): string {
    if (windowSize < 0) {
      // Context before
      const start = Math.max(0, position + windowSize);
      return sentences.slice(start, position).join(' ');
    } else {
      // Context after
      const end = Math.min(sentences.length, position + windowSize);
      return sentences.slice(position + 1, end).join(' ');
    }
  }
}
```

### Preference Signal Chunker

**File**: `src/chunking/plugins/preference-signal-chunker.ts`

```typescript
import { BaseChunker } from './base-chunker.js';
import type { ChunkingConfig, ChunkingResult, ValidationResult, Chunk } from '../types.js';

/**
 * Preference Signal Chunker
 *
 * Chunks at decision points (plan selection, satisfaction ratings).
 * Use case: A/B testing choices, user feedback.
 */
export class PreferenceSignalChunker extends BaseChunker {
  readonly name = 'preference-signal';

  async chunk(
    document: string,
    config: ChunkingConfig
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    this.logChunking('start', config);

    const chunks: Chunk[] = [];
    const decisionPoints = this.detectDecisionPoints(document, config);

    // Create chunk for each decision point
    for (let i = 0; i < decisionPoints.length; i++) {
      const dp = decisionPoints[i];

      const chunk = this.createChunk(
        dp.content.trim(),
        i,
        config.docId || 'unknown',
        config.sourcePath || 'unknown',
        config
      );

      chunk.metadata.content_type = 'preference';
      chunk.metadata.memory_level = 'atomic';
      chunk.metadata.boundary_type = 'decision';

      // Extract alternatives if configured
      if (config.includeAlternatives) {
        const alternatives = this.extractAlternatives(dp.content);
        if (alternatives.length > 0) {
          chunk.metadata.concepts = alternatives;
        }
      }

      chunks.push(chunk);
    }

    const durationMs = Date.now() - startTime;
    const result = {
      chunks,
      stats: this.computeStats(chunks, durationMs),
      warnings: chunks.length === 0 ? ['No decision points detected'] : [],
    };

    this.logChunking('complete', config, result);
    return result;
  }

  validate(config: ChunkingConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.decisionKeywords || config.decisionKeywords.length === 0) {
      warnings.push('No decision keywords specified, using defaults');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getDefaultConfig(): ChunkingConfig {
    return {
      maxTokens: 128,
      decisionKeywords: [
        'selected plan',
        'satisfaction rating',
        'preference',
        'chosen approach',
        'decision',
      ],
      includeAlternatives: true,
    };
  }

  /**
   * Detect decision points in document
   */
  private detectDecisionPoints(
    document: string,
    config: ChunkingConfig
  ): Array<{ content: string; position: number }> {
    const decisionPoints: Array<{ content: string; position: number }> = [];
    const keywords = config.decisionKeywords || this.getDefaultConfig().decisionKeywords!;

    const lines = document.split('\n');
    let currentDecision: string[] = [];
    let decisionStart = -1;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lowerLine = line.toLowerCase();

      // Check if line contains decision keyword
      const isDecisionLine = keywords.some(kw => lowerLine.includes(kw.toLowerCase()));

      if (isDecisionLine) {
        if (decisionStart === -1) {
          decisionStart = i;
        }
        currentDecision.push(line);

        // Look ahead for context (next 2-3 lines)
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          currentDecision.push(lines[j]);
        }

        decisionPoints.push({
          content: currentDecision.join('\n'),
          position: decisionStart,
        });

        currentDecision = [];
        decisionStart = -1;
      }
    }

    return decisionPoints;
  }

  /**
   * Extract alternatives from decision point content
   */
  private extractAlternatives(content: string): string[] {
    const alternatives: string[] = [];

    // Look for bullet points or numbered lists
    const listPattern = /^[\s-]*[\*\-\d]+[\.\)]\s*(.+)$/gm;
    let match;

    while ((match = listPattern.exec(content)) !== null) {
      alternatives.push(match[1].trim());
    }

    return alternatives;
  }
}
```

### Step-Based Chunker

**File**: `src/chunking/plugins/step-based-chunker.ts`

```typescript
import { BaseChunker } from './base-chunker.js';
import type { ChunkingConfig, ChunkingResult, ValidationResult, Chunk } from '../types.js';

/**
 * Step-Based Chunker
 *
 * Chunks at step boundaries (markdown headers, numbered lists).
 * Use case: SOPs, workflow steps, tutorials.
 */
export class StepBasedChunker extends BaseChunker {
  readonly name = 'step-based';

  async chunk(
    document: string,
    config: ChunkingConfig
  ): Promise<ChunkingResult> {
    const startTime = Date.now();
    this.logChunking('start', config);

    const chunks: Chunk[] = [];
    const steps = this.detectSteps(document, config);

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      const chunk = this.createChunk(
        step.content.trim(),
        i,
        config.docId || 'unknown',
        config.sourcePath || 'unknown',
        config
      );

      chunk.metadata.content_type = 'procedural';
      chunk.metadata.memory_level = 'atomic';
      chunk.metadata.boundary_type = 'step';

      // Extract step metadata
      if (config.includePrerequisites) {
        const prereqs = this.extractPrerequisites(step.content);
        if (prereqs.length > 0) {
          chunk.metadata.concepts = prereqs;
        }
      }

      // Link to previous step
      if (i > 0) {
        chunk.metadata.previous_chunk = chunks[i - 1].id;
        chunks[i - 1].metadata.next_chunk = chunk.id;
      }

      chunks.push(chunk);
    }

    const durationMs = Date.now() - startTime;
    const result = {
      chunks,
      stats: this.computeStats(chunks, durationMs),
      warnings: chunks.length === 0 ? ['No steps detected'] : [],
    };

    this.logChunking('complete', config, result);
    return result;
  }

  validate(config: ChunkingConfig): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (config.maxTokens && config.maxTokens < 128) {
      warnings.push('maxTokens < 128 may result in incomplete steps');
    }

    return { valid: errors.length === 0, errors, warnings };
  }

  getDefaultConfig(): ChunkingConfig {
    return {
      maxTokens: 384,
      stepDelimiters: ['##', '###', '1.', '2.', '3.'],
      includePrerequisites: true,
      includeOutcomes: true,
    };
  }

  /**
   * Detect steps in document
   */
  private detectSteps(
    document: string,
    config: ChunkingConfig
  ): Array<{ content: string; title: string }> {
    const steps: Array<{ content: string; title: string }> = [];
    const delimiters = config.stepDelimiters || this.getDefaultConfig().stepDelimiters!;

    const lines = document.split('\n');
    let currentStep: string[] = [];
    let currentTitle = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if line is a step delimiter
      const isStepStart = delimiters.some(delim => line.trim().startsWith(delim));

      if (isStepStart) {
        // Save previous step
        if (currentStep.length > 0) {
          steps.push({
            content: currentStep.join('\n'),
            title: currentTitle,
          });
        }

        // Start new step
        currentTitle = line.trim();
        currentStep = [line];
      } else {
        currentStep.push(line);
      }
    }

    // Save final step
    if (currentStep.length > 0) {
      steps.push({
        content: currentStep.join('\n'),
        title: currentTitle,
      });
    }

    return steps;
  }

  /**
   * Extract prerequisites from step content
   */
  private extractPrerequisites(content: string): string[] {
    const prereqs: string[] = [];

    // Look for "Prerequisites:", "Requires:", etc.
    const prereqPattern = /(?:prerequisites?|requires?|needs?):\s*(.+)/gi;
    let match;

    while ((match = prereqPattern.exec(content)) !== null) {
      const items = match[1].split(/[,;]/).map(s => s.trim());
      prereqs.push(...items);
    }

    return prereqs;
  }
}
```

---

## 🔍 Strategy Selector

**File**: `src/chunking/strategy-selector.ts`

```typescript
import type { ContentType, Chunker, ChunkingConfig } from './types.js';
import { EventBasedChunker } from './plugins/event-based-chunker.js';
import { SemanticBoundaryChunker } from './plugins/semantic-boundary-chunker.js';
import { PreferenceSignalChunker } from './plugins/preference-signal-chunker.js';
import { StepBasedChunker } from './plugins/step-based-chunker.js';
import { logger } from '../utils/logger.js';

/**
 * Strategy Selector
 *
 * Selects the appropriate chunking strategy based on content type.
 */
export class StrategySelector {
  private chunkers: Map<ContentType, Chunker> = new Map();

  constructor() {
    this.registerChunkers();
  }

  /**
   * Register all available chunking strategies
   */
  private registerChunkers(): void {
    this.chunkers.set('episodic', new EventBasedChunker());
    this.chunkers.set('semantic', new SemanticBoundaryChunker());
    this.chunkers.set('preference', new PreferenceSignalChunker());
    this.chunkers.set('procedural', new StepBasedChunker());

    // Working memory: no chunking (return document as-is)
    // Document: PPL-based chunker (Phase 2)

    logger.debug('Registered chunking strategies', {
      strategies: Array.from(this.chunkers.keys()),
    });
  }

  /**
   * Select chunking strategy based on content type
   */
  selectStrategy(contentType: ContentType, config?: ChunkingConfig): Chunker {
    const chunker = this.chunkers.get(contentType);

    if (!chunker) {
      logger.warn(`No chunker registered for content type: ${contentType}, using semantic boundary`);
      return this.chunkers.get('semantic')!;
    }

    logger.debug('Selected chunking strategy', {
      contentType,
      strategy: chunker.name,
    });

    return chunker;
  }

  /**
   * Get all available strategies
   */
  getAvailableStrategies(): ContentType[] {
    return Array.from(this.chunkers.keys());
  }
}
```

---

## 🧪 Testing Strategy

### Unit Tests

**File**: `tests/chunking/plugins/event-based-chunker.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { EventBasedChunker } from '../../../src/chunking/plugins/event-based-chunker.js';

describe('EventBasedChunker', () => {
  const chunker = new EventBasedChunker();

  describe('chunk()', () => {
    it('should chunk at phase transitions', async () => {
      const document = `
## Stage: Perception
Gathered context about the task.

## Stage: Reasoning
Analyzed the options and selected plan A.

## Stage: Execution
Implemented the solution step by step.

## Stage: Reflection
Reflected on what went well.
      `.trim();

      const config = {
        eventBoundaries: 'phase-transition' as const,
        temporalLinks: true,
        docId: 'test-doc',
        sourcePath: '/test/doc.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBe(4);
      expect(result.chunks[0].metadata.content_type).toBe('episodic');
      expect(result.chunks[0].metadata.next_chunk).toBe(result.chunks[1].id);
      expect(result.chunks[1].metadata.previous_chunk).toBe(result.chunks[0].id);
    });

    it('should handle documents with no boundaries', async () => {
      const document = 'Simple document with no event markers.';

      const config = {
        eventBoundaries: 'phase-transition' as const,
        docId: 'test-doc',
        sourcePath: '/test/doc.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBe(1);
      expect(result.chunks[0].content).toBe(document);
    });
  });

  describe('validate()', () => {
    it('should require eventBoundaries config', () => {
      const result = chunker.validate({});

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('eventBoundaries is required for event-based chunking');
    });

    it('should validate correct config', () => {
      const result = chunker.validate({
        eventBoundaries: 'phase-transition',
      });

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });
});
```

### Integration Tests

**File**: `tests/chunking/integration.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { StrategySelector } from '../../src/chunking/strategy-selector.js';
import type { ContentType } from '../../src/chunking/types.js';

describe('Chunking Integration', () => {
  let selector: StrategySelector;

  beforeEach(() => {
    selector = new StrategySelector();
  });

  describe('End-to-end chunking', () => {
    it('should chunk episodic content with event boundaries', async () => {
      const document = `
---
stage: perception
---

# Stage: Perception

Gathered context about implementing user authentication.

---
stage: reasoning
---

# Stage: Reasoning

Evaluated OAuth vs JWT. Selected JWT for simplicity.

---
stage: execution
---

# Stage: Execution

Implemented JWT authentication with bcrypt password hashing.
Progress: 100%

---
stage: reflection
---

# Stage: Reflection

Authentication works well. Consider adding 2FA in future.
Satisfaction: 4/5
      `.trim();

      const chunker = selector.selectStrategy('episodic');
      const config = {
        eventBoundaries: 'phase-transition' as const,
        temporalLinks: true,
        docId: 'session-123',
        sourcePath: '/sessions/session-123/full.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThan(0);
      expect(result.stats.strategy).toBe('event-based');

      // Verify temporal links
      for (let i = 1; i < result.chunks.length; i++) {
        expect(result.chunks[i].metadata.previous_chunk).toBe(result.chunks[i - 1].id);
      }
    });

    it('should chunk semantic content with boundaries', async () => {
      const document = `
Authentication is a critical security concern. Users need secure access to their accounts.
We should implement industry-standard practices like password hashing and token-based auth.

Performance optimization is equally important. The application must respond quickly to user actions.
We can use caching strategies and database indexing to improve response times.

Error handling requires careful consideration. Users should see helpful error messages.
Logging errors to a monitoring service helps with debugging and maintenance.
      `.trim();

      const chunker = selector.selectStrategy('semantic');
      const config = {
        maxTokens: 384,
        similarityThreshold: 0.75,
        includeContext: true,
        contextWindowSize: 50,
        docId: 'reflection-456',
        sourcePath: '/reflections/reflection-456.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBeGreaterThan(1);
      expect(result.stats.strategy).toBe('semantic-boundary');

      // Verify context enrichment
      const hasContext = result.chunks.some(
        c => c.metadata.context_before || c.metadata.context_after
      );
      expect(hasContext).toBe(true);
    });

    it('should chunk procedural content at steps', async () => {
      const document = `
## Step 1: Gather Requirements

Prerequisites: User stories, stakeholder interviews

Collect all functional and non-functional requirements.
Document acceptance criteria for each feature.

## Step 2: Design Architecture

Prerequisites: Requirements document

Create high-level system architecture diagram.
Define component interactions and data flows.

## Step 3: Implement Features

Prerequisites: Architecture design

Build features according to specifications.
Follow TDD practices with comprehensive tests.
      `.trim();

      const chunker = selector.selectStrategy('procedural');
      const config = {
        maxTokens: 384,
        stepDelimiters: ['##'],
        includePrerequisites: true,
        docId: 'sop-789',
        sourcePath: '/sops/sop-789.md',
      };

      const result = await chunker.chunk(document, config);

      expect(result.chunks.length).toBe(3);
      expect(result.stats.strategy).toBe('step-based');

      // Verify prerequisites extraction
      const hasPrereqs = result.chunks.some(c =>
        c.metadata.concepts && c.metadata.concepts.length > 0
      );
      expect(hasPrereqs).toBe(true);
    });
  });
});
```

---

## 📝 Markdown Template

**File**: `src/templates/vector-db/chunking-strategy.md`

```markdown
---
status: pending
doc_id: "{{doc_id}}"
source_path: "{{source_path}}"
content_type: ""
created_at: {{created_at}}
---

# Chunking Strategy Selection

**Document**: {{doc_name}}
**Path**: {{source_path}}

---

## 📋 Content Type Selection

Please select the content type that best describes this document:

- [ ] **Task Experience** (Episodic Memory)
  - Task execution logs, learning session transcripts
  - Chunks at event boundaries (phase transitions)
  - Maintains temporal sequence

- [ ] **User Reflection** (Semantic Memory)
  - Reflections, insights, learned patterns
  - Chunks at semantic boundaries (topic shifts)
  - Enriched with surrounding context

- [ ] **User Preference** (Preference Memory)
  - Decisions, plan selections, feedback
  - Chunks at decision points
  - Includes alternatives considered

- [ ] **SOP/Workflow** (Procedural Memory)
  - Step-by-step instructions, procedures
  - Chunks at step boundaries
  - Includes prerequisites and outcomes

---

## ⚙️ Configuration (Optional)

### General Settings

- **Max tokens per chunk**: {{max_tokens}} (default: varies by strategy)
- **Overlap percentage**: {{overlap}}% (default: 15-20%)
- **Include context**: {{include_context}} (default: yes)

### Strategy-Specific Settings

#### Event-Based (Task Experiences)
- **Event boundaries**: phase-transition | task-start | task-end
- **Temporal links**: yes | no (link to previous/next events)

#### Semantic Boundary (Reflections)
- **Similarity threshold**: 0.75 (0-1, lower = more chunks)
- **Min chunk size**: 128 tokens
- **Context window**: ±50 tokens

#### Preference Signal (Decisions)
- **Decision keywords**: selected plan, satisfaction rating, preference
- **Include alternatives**: yes | no

#### Step-Based (SOPs)
- **Step delimiters**: ##, ###, 1., 2., 3.
- **Include prerequisites**: yes | no
- **Include outcomes**: yes | no

---

## ✅ Completion

Once you've made your selections above, change the status to "completed":

```yaml
status: completed
content_type: "episodic" # or "semantic", "preference", "procedural"
```

The chunking workflow will automatically process this document and generate chunks.

---

**Next Steps**:
1. Select content type
2. Review/adjust configuration (optional)
3. Set status to "completed"
4. Save this file
5. Chunking workflow triggers automatically
6. Chunks generated in `/chunks/` directory
7. Embedding workflow template created
```

---

## 📊 Implementation Timeline

### Phase 1: Core Implementation (Week 1)

**Day 1-2: Infrastructure** (6 hours)
- [ ] Create type definitions (`types.ts`)
- [ ] Implement `BaseChunker` abstract class
- [ ] Create `StrategySelector`
- [ ] Setup file structure

**Day 3-4: Core Plugins** (8 hours)
- [ ] Implement `EventBasedChunker`
- [ ] Implement `SemanticBoundaryChunker`
- [ ] Implement `PreferenceSignalChunker`
- [ ] Implement `StepBasedChunker`

**Day 5: Integration** (6 hours)
- [ ] Update `vector-db-workflows.ts`
- [ ] Create chunking markdown template
- [ ] Update workflow registration
- [ ] End-to-end testing

### Phase 2: Testing & Documentation (Week 2)

**Day 1-2: Unit Tests** (8 hours)
- [ ] Test each chunking plugin
- [ ] Test strategy selector
- [ ] Test validation logic

**Day 3: Integration Tests** (4 hours)
- [ ] End-to-end workflow tests
- [ ] Edge case testing
- [ ] Performance benchmarks

**Day 4-5: Documentation** (8 hours)
- [ ] API documentation
- [ ] Usage examples
- [ ] Migration guide
- [ ] Update WORKFLOW-EXTENSION-GUIDE.md

---

**Status**: 🏗️ Design Complete
**Next Steps**: Begin Phase 1 implementation → Core infrastructure → Core plugins → Integration
