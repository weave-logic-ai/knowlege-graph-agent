# Hybrid Chunking System Specification
**Phase 13 - Task 1.1 - SPARC Specification Phase**

**Agent**: AGENT-1 (Chunking Architect)
**Created**: 2025-10-27
**Status**: 📋 **SPECIFICATION COMPLETE**
**Quality Gate**: QG1 - Specification Review

---

## 🎯 Executive Summary

The Hybrid Chunking System provides multi-strategy content chunking for memorographic embeddings, optimized for different types of agent learning experiences. Based on 2024-2025 chunking research and designed to support the Four-Pillar Agent Framework.

### Core Capabilities
1. **4 Chunking Strategies** - Event, Semantic, Preference, Step-based
2. **Automatic Strategy Selection** - Content-type driven routing
3. **Metadata Enrichment** - Contextual information for each chunk
4. **Performance Optimized** - <100ms per chunk, O(n) complexity

---

## 📊 System Overview

### Architecture Principles
- **Plugin-based** - Easy to extend with new chunking strategies
- **Type-safe** - Full TypeScript with strict mode
- **Performance-first** - Sub-100ms target per chunk
- **Memory-efficient** - Streaming processing for large files

### Integration Points
- **Shadow Cache** - Stores chunks with metadata
- **Vector Embeddings** - Chunks feed into embedding generation
- **Learning Loop** - Different strategies for different memory types
- **MCP Memory** - Coordination across agent instances

---

## 🧩 Chunking Strategies

### 1. Event-Based Chunker (Episodic Memory)
**Purpose**: Chunk task experiences by temporal phases

**Input**: Task execution logs, action histories, timestamps
**Output**: Chunks representing discrete task phases

**Chunking Logic**:
- Detect phase transitions (planning → execution → verification)
- Split on temporal boundaries (task start/end, major milestones)
- Include ±50 token context window around boundaries

**Metadata**:
```typescript
{
  type: 'episodic',
  phase: 'planning' | 'execution' | 'verification' | 'reflection',
  taskId: string,
  timestamp: number,
  duration: number,
  outcome: 'success' | 'failure' | 'partial',
  relatedChunks: string[]  // Temporal links to previous/next phases
}
```

**Performance Target**: <100ms per 5,000 token document
**Use Case**: Learning from task execution patterns

---

### 2. Semantic Boundary Chunker (Semantic Memory)
**Purpose**: Chunk reflections and insights by topic boundaries

**Input**: Reflection documents, meeting notes, design docs
**Output**: Chunks representing coherent semantic topics

**Chunking Logic**:
- Detect topic shifts using:
  - Heading changes (H1, H2, H3 transitions)
  - Paragraph similarity drop (cosine similarity <0.6)
  - Semantic markers ("in contrast", "moving on to", "next topic")
- Maintain semantic coherence within chunks
- Target chunk size: 200-500 tokens

**Metadata**:
```typescript
{
  type: 'semantic',
  topic: string,           // Extracted main topic
  summary: string,         // 1-2 sentence summary
  keywords: string[],      // 5-10 key terms
  relatedTopics: string[], // Links to similar semantic chunks
  coherenceScore: number   // Internal semantic similarity (0-1)
}
```

**Performance Target**: <100ms per 5,000 token document
**Use Case**: Conceptual learning and knowledge retrieval

---

### 3. Preference Signal Chunker (Preference Memory)
**Purpose**: Extract and chunk user decision points

**Input**: User feedback, decision logs, approval/rejection events
**Output**: Chunks representing preference signals

**Chunking Logic**:
- Detect decision points:
  - Explicit feedback ("I prefer X over Y")
  - Approval/rejection actions
  - Configuration changes
  - Alternative selections
- Extract surrounding context (±100 tokens)
- Group related preferences

**Metadata**:
```typescript
{
  type: 'preference',
  decisionType: 'approval' | 'rejection' | 'configuration' | 'selection',
  preferredOption: string,
  rejectedOptions: string[],
  rationale: string,        // Extracted reason if available
  confidence: number,       // Signal strength (0-1)
  userId: string,
  timestamp: number
}
```

**Performance Target**: <100ms per 5,000 token document
**Use Case**: Personalization and user preference learning

---

### 4. Step-Based Chunker (Procedural Memory)
**Purpose**: Chunk SOPs and workflows by execution steps

**Input**: Standard Operating Procedures, workflow definitions, tutorials
**Output**: Chunks representing individual procedure steps

**Chunking Logic**:
- Detect step boundaries:
  - Numbered lists (1. 2. 3.)
  - Ordered headings (Step 1, Step 2)
  - Sequential markers (First, Then, Next, Finally)
- Maintain step hierarchy (main steps vs substeps)
- Include dependencies and prerequisites

**Metadata**:
```typescript
{
  type: 'procedural',
  stepNumber: number,
  stepTitle: string,
  stepType: 'main' | 'substep' | 'prerequisite' | 'optional',
  dependencies: string[],   // Required prior steps
  followups: string[],      // Subsequent steps
  estimatedTime: number,    // Expected duration in seconds
  difficulty: number        // 1-5 scale
}
```

**Performance Target**: <100ms per 5,000 token document
**Use Case**: Learning and executing standardized procedures

---

## 🎛️ Strategy Selector

### Selection Algorithm

```typescript
function selectStrategy(content: ParsedContent): ChunkingStrategy {
  // Priority order:
  // 1. Explicit type hint in frontmatter
  if (content.frontmatter?.chunkingStrategy) {
    return getStrategy(content.frontmatter.chunkingStrategy);
  }

  // 2. Content type classification
  const contentType = classifyContent(content);
  switch (contentType) {
    case 'task-log':
      return 'event-based';
    case 'reflection':
    case 'note':
    case 'meeting':
      return 'semantic-boundary';
    case 'feedback':
    case 'decision':
      return 'preference-signal';
    case 'sop':
    case 'tutorial':
    case 'workflow':
      return 'step-based';
    default:
      return 'semantic-boundary';  // Safe default
  }
}

function classifyContent(content: ParsedContent): ContentType {
  // Multi-signal classification:
  // - Frontmatter type field
  // - File path patterns
  // - Content structure markers
  // - Keyword presence

  const signals = {
    taskLog: hasTimestamps && hasPhaseMarkers,
    reflection: hasSummary && hasInsights,
    feedback: hasDecisionPoints && hasPreferences,
    sop: hasNumberedSteps && hasSequentialMarkers
  };

  return highestConfidenceType(signals);
}
```

**Selection Criteria**:
- **Explicit wins**: Frontmatter `chunkingStrategy` field
- **Structure patterns**: Numbered lists → step-based, timestamps → event-based
- **Keyword density**: "I prefer", "decision" → preference-signal
- **Default fallback**: Semantic boundary (safest, most general)

---

## 🏷️ Metadata Enricher

### Common Metadata (All Chunks)

```typescript
interface ChunkMetadata {
  // Identity
  id: string;                    // UUID
  sourceFile: string;            // Path to original file
  chunkIndex: number;            // Position in document (0-indexed)

  // Content
  content: string;               // Chunk text content
  tokenCount: number;            // Accurate token count

  // Context
  contextBefore: string;         // 50 tokens before
  contextAfter: string;          // 50 tokens after

  // Strategy-specific
  strategyType: ChunkingStrategy;
  strategyMetadata: EventMetadata | SemanticMetadata | PreferenceMetadata | ProceduralMetadata;

  // Temporal
  createdAt: number;             // Timestamp
  sourceModifiedAt: number;      // Original file modification time

  // Relationships
  relatedChunks: string[];       // IDs of related chunks
  hierarchyLevel: number;        // Depth in document hierarchy

  // Quality
  coherenceScore: number;        // Internal similarity (0-1)
  completeness: number;          // Standalone understandability (0-1)
}
```

### Enrichment Pipeline

1. **Token Counting** - Accurate count using tiktoken or similar
2. **Context Extraction** - ±50 tokens around chunk boundaries
3. **Relationship Linking**:
   - Temporal: Previous/next chunks in time sequence
   - Hierarchical: Parent/child chunks in document structure
   - Semantic: Similar chunks by topic
4. **Quality Scoring**:
   - Coherence: Internal semantic similarity
   - Completeness: Standalone understandability without context

---

## 📏 Configuration Schema

### ChunkingConfig

```typescript
interface ChunkingConfig {
  // Global settings
  defaultStrategy: ChunkingStrategy;
  enableAutoDetection: boolean;

  // Performance tuning
  maxChunkSize: number;          // Default: 500 tokens
  minChunkSize: number;          // Default: 50 tokens
  contextWindowSize: number;     // Default: 50 tokens

  // Strategy-specific overrides
  eventBased: {
    phaseDetectionSensitivity: number;  // 0-1, default 0.7
    minPhaseDuration: number;           // Seconds, default 30
  };

  semanticBoundary: {
    similarityThreshold: number;        // 0-1, default 0.6
    minTopicCoherence: number;          // 0-1, default 0.5
  };

  preferenceSignal: {
    minConfidence: number;              // 0-1, default 0.5
    contextSize: number;                // Tokens, default 100
  };

  stepBased: {
    detectSubsteps: boolean;            // Default true
    includeOptionalSteps: boolean;      // Default true
  };

  // Metadata enrichment
  enableContextExtraction: boolean;     // Default true
  enableRelationshipLinking: boolean;   // Default true
  enableQualityScoring: boolean;        // Default true
}
```

### Validation Rules

```typescript
const configSchema = z.object({
  defaultStrategy: z.enum(['event-based', 'semantic-boundary', 'preference-signal', 'step-based']),
  enableAutoDetection: z.boolean(),
  maxChunkSize: z.number().min(100).max(2000),
  minChunkSize: z.number().min(10).max(500),
  contextWindowSize: z.number().min(0).max(200),
  // ... (full schema validation)
});
```

---

## 🎯 API Specification

### Public API

```typescript
/**
 * Main chunking interface
 */
export class ChunkingSystem {
  constructor(config: ChunkingConfig);

  /**
   * Chunk a document using appropriate strategy
   */
  chunk(content: ParsedContent): Promise<Chunk[]>;

  /**
   * Chunk with explicit strategy override
   */
  chunkWithStrategy(
    content: ParsedContent,
    strategy: ChunkingStrategy
  ): Promise<Chunk[]>;

  /**
   * Get available strategies
   */
  getStrategies(): ChunkingStrategy[];

  /**
   * Register custom chunking plugin
   */
  registerPlugin(plugin: ChunkingPlugin): void;

  /**
   * Get chunking statistics
   */
  getStats(): ChunkingStats;
}

/**
 * Individual chunk result
 */
export interface Chunk {
  metadata: ChunkMetadata;
  content: string;
  embedding?: Float32Array;  // Optional, populated by embeddings module
}

/**
 * Chunking statistics
 */
export interface ChunkingStats {
  totalChunks: number;
  byStrategy: Record<ChunkingStrategy, number>;
  avgChunkSize: number;
  avgProcessingTime: number;
  p95ProcessingTime: number;
}
```

### Usage Examples

```typescript
// Example 1: Automatic strategy selection
const chunker = new ChunkingSystem(config);
const chunks = await chunker.chunk(parsedDocument);
// → Selects strategy based on content type

// Example 2: Explicit strategy
const chunks = await chunker.chunkWithStrategy(
  parsedDocument,
  'event-based'
);
// → Forces event-based chunking

// Example 3: Custom plugin
chunker.registerPlugin({
  name: 'custom-chunker',
  detect: (content) => content.type === 'custom',
  chunk: async (content) => [...customChunks]
});
```

---

## ⚡ Performance Requirements

### Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Avg Time per Chunk** | <100ms | 5,000 token document |
| **P95 Time per Chunk** | <150ms | 5,000 token document |
| **Max Time per Chunk** | <200ms | Any document |
| **Memory per Chunk** | <5 KB | Metadata + content |
| **Throughput** | >1000 chunks/min | Batch processing |

### Complexity Analysis

- **Event-Based**: O(n) - Single pass for phase detection
- **Semantic-Boundary**: O(n²) in worst case (paragraph similarity), O(n log n) with optimization
- **Preference-Signal**: O(n) - Single pass for decision point detection
- **Step-Based**: O(n) - Single pass for step boundary detection

### Optimization Strategies

1. **Lazy Loading** - Don't compute metadata until needed
2. **Caching** - Cache similarity computations for semantic chunker
3. **Batch Processing** - Process multiple documents in parallel
4. **Streaming** - Process large files in chunks, not all at once

---

## 🔍 Edge Cases

### Input Edge Cases

| Edge Case | Expected Behavior | Implementation |
|-----------|-------------------|----------------|
| **Empty document** | Return empty array | Early return, log warning |
| **Single sentence** | Return 1 chunk with full metadata | No splitting, enrich with context |
| **No clear boundaries** | Fallback to fixed-size chunks | 500-token windows with overlap |
| **Mixed content types** | Split by type, apply multiple strategies | Detect sections, route separately |
| **Malformed frontmatter** | Use content-based detection | Graceful YAML parse error handling |

### Processing Edge Cases

| Edge Case | Expected Behavior | Implementation |
|-----------|-------------------|----------------|
| **Chunk too small (<50 tokens)** | Merge with adjacent chunk | Post-processing merge step |
| **Chunk too large (>2000 tokens)** | Split with context preservation | Recursive splitting at sentence boundaries |
| **Circular references** | Break cycles, log warning | Maintain visited set during linking |
| **Missing context** | Use placeholder or skip | Graceful degradation |

### Quality Edge Cases

| Edge Case | Expected Behavior | Implementation |
|-----------|-------------------|----------------|
| **Low coherence score** | Flag for manual review | Add warning to metadata |
| **Duplicate chunks** | Deduplicate, keep first | Hash-based deduplication |
| **Incomplete chunk** | Mark as incomplete in metadata | Add `complete: false` flag |

---

## ✅ Success Criteria

### Functional Requirements
- [ ] All 4 chunking strategies implemented and operational
- [ ] Strategy selector routes correctly based on content type
- [ ] Metadata enrichment working for all strategies
- [ ] Configuration validation comprehensive

### Performance Requirements
- [ ] Average processing time <100ms per 5,000 token document
- [ ] P95 latency <150ms
- [ ] No timeout >200ms
- [ ] Memory usage <50MB peak for 1000 chunks

### Quality Requirements
- [ ] TypeScript strict mode passes (no errors)
- [ ] Test coverage >85%
- [ ] No linting errors
- [ ] API documentation complete

### Integration Requirements
- [ ] Integrates cleanly with shadow cache
- [ ] Compatible with embeddings module
- [ ] Supports batch processing
- [ ] Plugin architecture extensible

---

## 🧪 Testing Strategy

### Unit Tests (27 tests per strategy = 108 tests minimum)

**Event-Based Chunker**:
- [ ] Detects phase transitions correctly
- [ ] Handles missing timestamps gracefully
- [ ] Links temporal chunks correctly
- [ ] Extracts metadata accurately
- [ ] Performance <100ms per 5,000 tokens

**Semantic-Boundary Chunker**:
- [ ] Detects topic shifts correctly
- [ ] Maintains semantic coherence
- [ ] Handles single-topic documents
- [ ] Extracts topics and keywords
- [ ] Performance <100ms per 5,000 tokens

**Preference-Signal Chunker**:
- [ ] Detects decision points correctly
- [ ] Extracts preferences accurately
- [ ] Handles implicit preferences
- [ ] Confidence scoring accurate
- [ ] Performance <100ms per 5,000 tokens

**Step-Based Chunker**:
- [ ] Detects step boundaries correctly
- [ ] Handles nested substeps
- [ ] Links dependencies correctly
- [ ] Estimates time accurately
- [ ] Performance <100ms per 5,000 tokens

### Integration Tests (10 tests)
- [ ] Strategy selector chooses correctly for all content types
- [ ] Chunking → Embedding pipeline works end-to-end
- [ ] Batch processing maintains performance
- [ ] Error handling robust across all strategies

---

## 📚 Dependencies

### Internal
- `shadow-cache/database.ts` - Chunk storage
- `shadow-cache/parser.ts` - Content parsing
- `utils/logger.ts` - Logging infrastructure

### External
- `zod` - Configuration validation
- `tiktoken` (or equivalent) - Accurate token counting
- `natural` (optional) - NLP utilities for semantic chunking

---

## 🚀 Implementation Phases

### Phase 1: Core Infrastructure (Day 1-2)
- [ ] Type definitions (`types.ts`)
- [ ] Base chunker abstract class
- [ ] Strategy selector skeleton
- [ ] Configuration validation

### Phase 2: Chunking Plugins (Day 3-W2D3)
- [ ] Event-based chunker (Day 3-4)
- [ ] Semantic boundary chunker (Day 5-W2D1)
- [ ] Preference signal chunker (W2D2)
- [ ] Step-based chunker (W2D3)

### Phase 3: Metadata & Integration (W2D4-5)
- [ ] Metadata enricher
- [ ] Relationship linker
- [ ] Quality scorer
- [ ] Shadow cache integration
- [ ] Comprehensive testing

---

## 📖 Research Foundation

Based on:
- **Memorographic Embeddings** - Memory-type specific chunking
- **Multi-Granularity Retrieval** - 2024 paper on ½×, 1×, 2×, 4×, 8× granularities
- **Contextual Enrichment** - ±50 token windows improve accuracy by 35-49%
- **Semantic Boundary Detection** - Topic modeling for coherent chunks

---

**Specification Status**: ✅ **COMPLETE**
**Quality Gate 1**: Ready for review
**Next Phase**: Pseudocode (AGENT-1)
**Estimated Implementation**: 40 hours over 2 weeks

