---
related_to:
  - '[[PROJECT-TIMELINE]]'
  - '[[PHASE-13-FINAL-VALIDATION]]'
  - '[[phase-14-obsidian-integration]]'
phase: phase-13
type: planning
superseded_by:
  - - PHASE-13-FINAL-VALIDATION
visual:
  icon: "\U0001F4CB"
  color: '#3B82F6'
  cssclasses:
    - type-planning
version: '3.0'
updated_date: '2025-10-28'
---

# Phase 13 Implementation - Next Steps
**Immediate Action Plan for Systematic Completion**

## Navigation
- 📋 **Timeline**: [[PROJECT-TIMELINE]] - Project chronology
- ✅ **Current Status**: [[PHASE-13-FINAL-VALIDATION]] - Phase 13 complete ✅
- 🔜 **Next Phase**: [[phase-14-obsidian-integration]] - Phase 14 plan
- 📂 **Planning**: [[PLANNING-DIRECTORY-HUB]] - All planning documents

**Created**: 2025-10-27
**Status**: 🚀 **READY FOR EXECUTION**
**Current Progress**: 8% (Specification phase complete for chunking)

---

## 🎯 Quick Summary

Phase 13 SPARC coordination is initialized. The chunking system is **60% complete** (existing plugins found). This document provides the **exact next steps** to complete Phase 13 systematically.

### What's Done ✅
1. Complete SPARC execution plan created
2. Chunking specification complete (SPEC.md)
3. TypeScript types defined (types.ts)
4. Validation schemas ready (validation.ts)
5. 4 chunking plugins exist (event, semantic, preference, step)
6. Status report and validation framework ready

### What's Next 📋
**Week 1-2**: Complete chunking system (6 files + tests)
**Week 3-4**: Implement vector embeddings
**Week 5**: Web tools + learning loop integration
**Week 6**: Production hardening
**Week 7**: Testing + documentation

---

## 🚀 Immediate Action Items (This Week)

### Step 1: Verify Existing Chunking Plugins (2 hours)

**Objective**: Ensure existing plugins match Phase 13 requirements

**Actions**:
```bash
cd /home/aepod/dev/weave-nn/weaver

# Read and verify each plugin
cat src/chunking/plugins/event-based-chunker.ts
cat src/chunking/plugins/semantic-boundary-chunker.ts
cat src/chunking/plugins/preference-signal-chunker.ts
cat src/chunking/plugins/step-based-chunker.ts

# Compare with SPEC.md requirements
cat src/chunking/SPEC.md
```

**Validation Checklist**:
- [ ] Event-based chunker detects phase transitions correctly
- [ ] Semantic chunker uses similarity thresholds (0.6 default)
- [ ] Preference chunker extracts decision points
- [ ] Step-based chunker handles numbered lists and substeps
- [ ] All plugins extend BaseChunker abstract class
- [ ] All plugins implement `chunk()` and `detect()` methods

**If plugins don't match**: Modify them to align with SPEC requirements

---

### Step 2: Implement Strategy Selector (3 hours)

**Objective**: Auto-detect which chunking strategy to use

**Create**: `weaver/src/chunking/strategy-selector.ts` (~150 LOC)

**Implementation Guide**:
```typescript
import type { ParsedContent, ChunkingStrategy, ContentType, ContentSignals } from './types.js';

export class StrategySelector {
  /**
   * Select appropriate chunking strategy
   */
  selectStrategy(content: ParsedContent): ChunkingStrategy {
    // 1. Check explicit frontmatter hint
    if (content.frontmatter?.chunkingStrategy) {
      return content.frontmatter.chunkingStrategy as ChunkingStrategy;
    }

    // 2. Classify content type
    const contentType = this.classifyContent(content);

    // 3. Map to strategy
    return this.mapTypeToStrategy(contentType);
  }

  /**
   * Classify content based on signals
   */
  private classifyContent(content: ParsedContent): ContentType {
    const signals = this.detectSignals(content.content);

    // Decision tree based on signal strength
    if (signals.hasTimestamps && signals.hasPhaseMarkers) {
      return 'task-log';
    }
    if (signals.hasDecisionPoints && signals.hasPreferences) {
      return 'feedback';
    }
    if (signals.hasNumberedSteps && signals.hasSequentialMarkers) {
      return 'sop';
    }
    if (signals.hasSummary || signals.hasInsights) {
      return 'reflection';
    }

    return 'unknown';
  }

  /**
   * Detect content signals
   */
  private detectSignals(content: string): ContentSignals {
    return {
      hasTimestamps: /\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2}/.test(content),
      hasPhaseMarkers: /planning|execution|verification|reflection/i.test(content),
      hasSummary: /summary:|overview:|tldr:/i.test(content),
      hasInsights: /insight|learning|takeaway/i.test(content),
      hasDecisionPoints: /prefer|choose|select|decide/i.test(content),
      hasPreferences: /I prefer|better than|instead of/i.test(content),
      hasNumberedSteps: /^\d+\.|^step \d+/im.test(content),
      hasSequentialMarkers: /first|then|next|finally/i.test(content),
    };
  }

  /**
   * Map content type to chunking strategy
   */
  private mapTypeToStrategy(type: ContentType): ChunkingStrategy {
    const mapping: Record<ContentType, ChunkingStrategy> = {
      'task-log': 'event-based',
      'reflection': 'semantic-boundary',
      'note': 'semantic-boundary',
      'meeting': 'semantic-boundary',
      'feedback': 'preference-signal',
      'decision': 'preference-signal',
      'sop': 'step-based',
      'tutorial': 'step-based',
      'workflow': 'step-based',
      'unknown': 'semantic-boundary', // Safe default
    };

    return mapping[type];
  }
}
```

**Testing**:
```typescript
// weaver/tests/chunking/strategy-selector.test.ts
describe('StrategySelector', () => {
  it('selects event-based for task logs', () => {
    const content = {
      path: 'test.md',
      content: '2025-10-27 12:00 - Planning phase started...',
      modifiedAt: Date.now(),
    };
    expect(selector.selectStrategy(content)).toBe('event-based');
  });

  it('selects step-based for numbered lists', () => {
    const content = {
      path: 'sop.md',
      content: '1. First step\n2. Second step\n3. Third step',
      modifiedAt: Date.now(),
    };
    expect(selector.selectStrategy(content)).toBe('step-based');
  });

  // Add 13 more tests for full coverage
});
```

---

### Step 3: Implement Metadata Enricher (3 hours)

**Objective**: Add context windows and quality scoring

**Create**: `weaver/src/chunking/metadata-enricher.ts` (~100 LOC)

**Implementation Guide**:
```typescript
import type { Chunk, ContextWindow, QualityAssessment } from './types.js';

export class MetadataEnricher {
  /**
   * Enrich chunk with context and quality metadata
   */
  async enrich(
    chunk: Chunk,
    fullContent: string,
    chunkStartPos: number,
    chunkEndPos: number
  ): Promise<Chunk> {
    // 1. Extract context window
    const context = this.extractContext(fullContent, chunkStartPos, chunkEndPos);
    chunk.metadata.contextBefore = context.before;
    chunk.metadata.contextAfter = context.after;

    // 2. Assess quality
    const quality = this.assessQuality(chunk);
    chunk.metadata.coherenceScore = quality.coherenceScore;
    chunk.metadata.completeness = quality.completeness;

    return chunk;
  }

  /**
   * Extract ±50 token context window
   */
  private extractContext(
    content: string,
    startPos: number,
    endPos: number
  ): ContextWindow {
    const windowSize = 50 * 4; // Approximate 50 tokens = 200 chars

    const before = content.slice(
      Math.max(0, startPos - windowSize),
      startPos
    );

    const after = content.slice(
      endPos,
      Math.min(content.length, endPos + windowSize)
    );

    return {
      before,
      after,
      beforeTokens: Math.ceil(before.length / 4),
      afterTokens: Math.ceil(after.length / 4),
    };
  }

  /**
   * Assess chunk quality
   */
  private assessQuality(chunk: Chunk): QualityAssessment {
    const content = chunk.content;

    // Coherence: Multiple sentences suggest cohesive thought
    const sentences = (content.match(/[.!?]+/g) || []).length;
    const coherenceScore = Math.min(sentences / 3, 1.0);

    // Completeness: Ends with punctuation
    const endsWithPunctuation = /[.!?]$/.test(content.trim());
    const completeness = endsWithPunctuation ? 0.9 : 0.6;

    return {
      coherenceScore,
      completeness,
      warnings: [],
      suggestions: [],
    };
  }
}
```

---

### Step 4: Implement Utility Modules (4 hours)

**Create 4 utility files** in `weaver/src/chunking/utils/`:

**4a. tokenizer.ts** (~80 LOC):
```typescript
/**
 * Accurate token counting
 * In production, integrate tiktoken or GPT tokenizer
 */
export class Tokenizer {
  countTokens(text: string): number {
    // Simple approximation: ~4 chars per token
    return Math.ceil(text.length / 4);
  }

  splitByTokens(text: string, maxTokens: number): string[] {
    // Split text into chunks of maxTokens
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[.!?])\s+/);
    let currentChunk = '';

    for (const sentence of sentences) {
      if (this.countTokens(currentChunk + sentence) <= maxTokens) {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk);
        currentChunk = sentence;
      }
    }

    if (currentChunk) chunks.push(currentChunk);
    return chunks;
  }
}
```

**4b. boundary-detector.ts** (~120 LOC):
```typescript
import type { Boundary } from '../types.js';

export class BoundaryDetector {
  /**
   * Detect semantic boundaries in text
   */
  detectSemanticBoundaries(text: string): Boundary[] {
    const boundaries: Boundary[] = [];

    // 1. Heading boundaries (H1, H2, H3)
    const headingPattern = /^#{1,3}\s+.+$/gm;
    let match;
    while ((match = headingPattern.exec(text)) !== null) {
      boundaries.push({
        position: match.index,
        type: 'hard',
        confidence: 0.9,
        marker: 'heading',
      });
    }

    // 2. Paragraph breaks (double newline)
    const paragraphPattern = /\n\n+/g;
    while ((match = paragraphPattern.exec(text)) !== null) {
      boundaries.push({
        position: match.index,
        type: 'soft',
        confidence: 0.5,
        marker: 'paragraph-break',
      });
    }

    return boundaries.sort((a, b) => a.position - b.position);
  }

  /**
   * Detect step boundaries for procedural content
   */
  detectStepBoundaries(text: string): Boundary[] {
    const boundaries: Boundary[] = [];

    // Numbered lists (1., 2., 3.)
    const numberedPattern = /^\d+\.\s+/gm;
    let match;
    while ((match = numberedPattern.exec(text)) !== null) {
      boundaries.push({
        position: match.index,
        type: 'hard',
        confidence: 0.95,
        marker: 'numbered-step',
      });
    }

    // Step markers (Step 1, Step 2)
    const stepPattern = /^step\s+\d+/gim;
    while ((match = stepPattern.exec(text)) !== null) {
      boundaries.push({
        position: match.index,
        type: 'hard',
        confidence: 0.9,
        marker: 'step-header',
      });
    }

    return boundaries.sort((a, b) => a.position - b.position);
  }
}
```

**4c. context-extractor.ts** (~100 LOC):
- Extract surrounding context for chunks
- Handle edge cases (start/end of document)

**4d. similarity.ts** (~100 LOC):
```typescript
/**
 * Compute cosine similarity between text chunks
 */
export class SimilarityCalculator {
  /**
   * Simple cosine similarity (word overlap)
   * In production, use embeddings for true semantic similarity
   */
  cosineSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set(
      [...words1].filter(word => words2.has(word))
    );

    const similarity = intersection.size /
      Math.sqrt(words1.size * words2.size);

    return similarity;
  }

  /**
   * Check if similarity crosses threshold
   */
  isTopicShift(text1: string, text2: string, threshold: number): boolean {
    return this.cosineSimilarity(text1, text2) < threshold;
  }
}
```

---

### Step 5: Create Public API (2 hours)

**Create**: `weaver/src/chunking/index.ts` (~100 LOC)

**Implementation**:
```typescript
import { StrategySelector } from './strategy-selector.js';
import { MetadataEnricher } from './metadata-enricher.js';
import { EventBasedChunker } from './plugins/event-based-chunker.js';
import { SemanticBoundaryChunker } from './plugins/semantic-boundary-chunker.js';
import { PreferenceSignalChunker } from './plugins/preference-signal-chunker.js';
import { StepBasedChunker } from './plugins/step-based-chunker.js';
import type {
  ChunkingConfig,
  ParsedContent,
  Chunk,
  ChunkingStrategy,
  ChunkingStats,
} from './types.js';
import { DEFAULT_CHUNKING_CONFIG } from './types.js';

export class ChunkingSystem {
  private config: ChunkingConfig;
  private selector: StrategySelector;
  private enricher: MetadataEnricher;
  private chunkers: Map<ChunkingStrategy, BaseChunker>;

  constructor(config: Partial<ChunkingConfig> = {}) {
    this.config = { ...DEFAULT_CHUNKING_CONFIG, ...config };
    this.selector = new StrategySelector();
    this.enricher = new MetadataEnricher();

    // Initialize chunkers
    this.chunkers = new Map([
      ['event-based', new EventBasedChunker(this.config)],
      ['semantic-boundary', new SemanticBoundaryChunker(this.config)],
      ['preference-signal', new PreferenceSignalChunker(this.config)],
      ['step-based', new StepBasedChunker(this.config)],
    ]);
  }

  /**
   * Chunk content using automatic strategy selection
   */
  async chunk(content: ParsedContent): Promise<Chunk[]> {
    const strategy = this.selector.selectStrategy(content);
    return this.chunkWithStrategy(content, strategy);
  }

  /**
   * Chunk with explicit strategy
   */
  async chunkWithStrategy(
    content: ParsedContent,
    strategy: ChunkingStrategy
  ): Promise<Chunk[]> {
    const chunker = this.chunkers.get(strategy);
    if (!chunker) {
      throw new Error(`Unknown chunking strategy: ${strategy}`);
    }

    const chunks = await chunker.chunk(content);

    // Enrich if enabled
    if (this.config.enableContextExtraction || this.config.enableQualityScoring) {
      return Promise.all(
        chunks.map((chunk, idx) =>
          this.enricher.enrich(chunk, content.content, 0, 0)
        )
      );
    }

    return chunks;
  }

  /**
   * Get available strategies
   */
  getStrategies(): ChunkingStrategy[] {
    return Array.from(this.chunkers.keys());
  }

  /**
   * Get statistics
   */
  getStats(): ChunkingStats {
    // Implementation
    return {
      totalChunks: 0,
      byStrategy: {},
      avgChunkSize: 0,
      avgProcessingTime: 0,
      p95ProcessingTime: 0,
    };
  }
}

// Re-export types
export * from './types.js';
export { validateConfig } from './validation.js';
```

---

### Step 6: Comprehensive Testing (8 hours)

**Create test files** in `weaver/tests/chunking/`:

**Test Structure**:
```
weaver/tests/chunking/
├── plugins/
│   ├── event-based-chunker.test.ts          (150 LOC, 27 tests)
│   ├── semantic-boundary-chunker.test.ts    (150 LOC, 27 tests)
│   ├── preference-signal-chunker.test.ts    (120 LOC, 20 tests)
│   └── step-based-chunker.test.ts           (150 LOC, 27 tests)
├── strategy-selector.test.ts                (120 LOC, 15 tests)
├── metadata-enricher.test.ts                (100 LOC, 12 tests)
└── integration.test.ts                      (250 LOC, 20 tests)
```

**Sample Test**:
```typescript
// weaver/tests/chunking/integration.test.ts
import { describe, it, expect } from 'vitest';
import { ChunkingSystem } from '../src/chunking/index.js';

describe('ChunkingSystem Integration', () => {
  const system = new ChunkingSystem();

  it('chunks task log with event-based strategy', async () => {
    const content = {
      path: 'task-log.md',
      content: `
        2025-10-27 10:00 - Planning phase
        Analyzed requirements...

        2025-10-27 11:00 - Execution phase
        Implemented feature X...

        2025-10-27 12:00 - Verification phase
        Tests passed...
      `,
      modifiedAt: Date.now(),
    };

    const chunks = await system.chunk(content);

    expect(chunks.length).toBeGreaterThan(0);
    expect(chunks[0].metadata.strategyType).toBe('event-based');
    expect(chunks[0].metadata.tokenCount).toBeGreaterThan(0);
  });

  it('chunks SOP with step-based strategy', async () => {
    const content = {
      path: 'sop.md',
      content: `
        # Deployment SOP

        1. Run tests
           - Unit tests
           - Integration tests

        2. Build production bundle
           - Optimize assets
           - Minify code

        3. Deploy to staging
           - Verify deployment
           - Run smoke tests
      `,
      modifiedAt: Date.now(),
    };

    const chunks = await system.chunk(content);

    expect(chunks.length).toBe(3); // 3 main steps
    expect(chunks[0].metadata.strategyType).toBe('step-based');
  });

  // Add 18 more integration tests
});
```

---

### Step 7: Performance Validation (2 hours)

**Create**: `weaver/tests/chunking/performance.test.ts`

**Benchmarks**:
```typescript
describe('Chunking Performance', () => {
  it('processes 5000-token document in <100ms', async () => {
    const largeContent = generateContent(5000); // ~5000 tokens

    const startTime = performance.now();
    await system.chunk(largeContent);
    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(100);
  });

  it('processes 100 documents in parallel efficiently', async () => {
    const documents = Array(100).fill(null).map(() => generateContent(500));

    const startTime = performance.now();
    await Promise.all(documents.map(doc => system.chunk(doc)));
    const duration = performance.now() - startTime;

    expect(duration).toBeLessThan(5000); // <50ms per document average
  });
});
```

---

### Step 8: Shadow Cache Integration (3 hours)

**Modify**: `weaver/src/shadow-cache/database.ts`

**Add chunks table**:
```sql
CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  file_id INTEGER NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  strategy_type TEXT NOT NULL,
  strategy_metadata TEXT NOT NULL,  -- JSON
  context_before TEXT,
  context_after TEXT,
  created_at INTEGER NOT NULL,
  FOREIGN KEY (file_id) REFERENCES files(id)
);

CREATE INDEX idx_chunks_file ON chunks(file_id);
CREATE INDEX idx_chunks_strategy ON chunks(strategy_type);
```

**Add methods**:
```typescript
// In ShadowCacheDatabase class
storeChunks(fileId: number, chunks: Chunk[]): void {
  const stmt = this.db.prepare(`
    INSERT INTO chunks (
      id, file_id, chunk_index, content, token_count,
      strategy_type, strategy_metadata, context_before, context_after, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const chunk of chunks) {
    stmt.run(
      chunk.metadata.id,
      fileId,
      chunk.metadata.chunkIndex,
      chunk.content,
      chunk.metadata.tokenCount,
      chunk.metadata.strategyType,
      JSON.stringify(chunk.metadata.strategyMetadata),
      chunk.metadata.contextBefore,
      chunk.metadata.contextAfter,
      chunk.metadata.createdAt
    );
  }
}

getChunks(fileId: number): Chunk[] {
  const stmt = this.db.prepare('SELECT * FROM chunks WHERE file_id = ?');
  return stmt.all(fileId) as Chunk[];
}
```

---

## 📊 Progress Tracking

Update todos after each step:

```typescript
TodoWrite({
  todos: [
    { content: "Step 1: Verify chunking plugins", status: "completed" },
    { content: "Step 2: Implement strategy-selector.ts", status: "completed" },
    { content: "Step 3: Implement metadata-enricher.ts", status: "in_progress" },
    // ... etc
  ]
});
```

---

## 🎯 Completion Criteria for Week 1-2

**All checkboxes must be ✅ before proceeding to Week 3-4**:

### Functional
- [ ] All 4 chunking strategies operational
- [ ] Strategy selector auto-detects correctly
- [ ] Metadata enrichment working
- [ ] Shadow cache integration complete

### Performance
- [ ] <100ms average per 5,000-token document
- [ ] <150ms P95 latency
- [ ] No timeout >200ms

### Quality
- [ ] Test coverage >85%
- [ ] All tests passing
- [ ] No TypeScript errors (strict mode)
- [ ] No linting errors

### Documentation
- [ ] API documentation complete
- [ ] Usage examples provided
- [ ] Integration guide written

---

## 📅 Timeline

**Week 1-2** (40 hours):
- Steps 1-8 above = Chunking system complete ✅

**Week 3-4** (24 hours):
- Vector embeddings implementation

**Week 5** (48 hours):
- Web tools + learning loop integration

**Week 6** (28 hours):
- Production hardening

**Week 7** (56 hours):
- Testing + documentation + validation

**Total**: ~196 hours over 7 weeks

---

## 🚨 If You Get Stuck

1. **Review SPARC execution plan**: `/weave-nn/docs/phase-13-sparc-execution-plan.md`
2. **Check validation checklist**: `/weave-nn/docs/hive-mind/validation-checklist.md`
3. **Review risk analysis**: `/weave-nn/docs/hive-mind/risk-analysis.md`
4. **Read specification**: `/weaver/src/chunking/SPEC.md`
5. **Check existing code**: `/weaver/src/chunking/plugins/`

---

**Document Status**: ✅ **READY FOR EXECUTION**
**Next Action**: Start Step 1 (Verify existing chunking plugins)
**Time Required**: ~27 hours this week (Week 1-2)
**Success Metric**: Chunking system production-ready by end of Week 2

