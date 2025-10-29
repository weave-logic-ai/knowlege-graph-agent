---
title: Chunking Strategy Synthesis for Weaver Learning Loop
type: research
status: complete
created_date: {}
updated_date: '2025-10-28'
tags:
  - chunking
  - research-synthesis
  - learning-loop
  - memorographic-embeddings
  - semantic-boundaries
category: research
domain: chunking
scope: module
audience:
  - developers
  - architects
  - researchers
related_concepts:
  - chunking-strategies
  - late-chunking
  - contextual-retrieval
  - semantic-boundaries
  - memorographic-embeddings
  - multi-granularity
related_files:
  - CHUNKING-IMPLEMENTATION-DESIGN.md
  - chunking-strategies-research-2024-2025.md
  - chunking-implementation-guide.md
author: ai-generated
version: 1.0.0
priority: high
visual:
  icon: "\U0001F52C"
  color: '#8B5CF6'
  cssclasses:
    - type-research
    - status-complete
    - priority-high
    - domain-chunking
---

# Chunking Strategy Synthesis for Weaver Learning Loop

**Version**: 1.0.0
**Date**: 2025-10-27
**Status**: 🔄 Synthesis Complete

---

## 📚 Related Documentation

### Historical Context
- [[PROJECT-TIMELINE]] - Complete Phase 1-14 evolution
- [[phase-12-four-pillar-autonomous-agents]] - Learning loop foundation (Phase 12)
- [[phase-6-vault-initialization]] - Vault system origins
- [[phase-1-knowledge-graph-transformation]] - Initial knowledge graph

### Chunking System Components
- [[CHUNKING-IMPLEMENTATION-DESIGN]] - Implementation details and code
- [[chunking-implementation-guide]] - Step-by-step implementation
- [[chunking-quick-reference]] - Quick reference guide
- [[chunking-strategies-research-2024-2025]] - Research foundation

### Phase 13 Integration
- [[phase-13-master-plan]] - Overall Phase 13 plan
- [[memorographic-embeddings-research]] - Memory-specific embeddings for chunks
- [[VECTOR-DB-MARKDOWN-WORKFLOW-ARCHITECTURE]] - Vector storage layer

### Implementation Context
- [[WEAVER-COMPLETE-IMPLEMENTATION-GUIDE]] - Weaver integration
- [[MARKDOWN-ASYNC-WORKFLOW-ARCHITECTURE]] - Markdown workflows
- [[USER-FEEDBACK-REFLECTION-DESIGN]] - User feedback integration

### Learning Loop
- [[PHASE-12-LEARNING-LOOP-BLUEPRINT]] - Autonomous learning loop
- [[PHASE-12-LEARNING-LOOP-INTEGRATION]] - Integration guide
- [[WORKFLOW-EXTENSION-GUIDE]] - Workflow extension patterns

### Evolution & Future
- [[phase-14-obsidian-integration]] - Next phase: Visual intelligence and graph completion
- Chunking system evolves from Phase 6 vault → Phase 12 memory → Phase 13 semantic understanding

---

## 🎯 Executive Summary

This document synthesizes research from:
1. **Phase 12 research** - Existing weave-nn chunking analysis
2. **Memory networks research** - Multi-granularity and faceted metadata
3. **Modern chunking strategies (2024-2025)** - Late chunking, contextual retrieval, semantic boundaries
4. **Memorographic embeddings research** - Learning-specific vector representations

**Recommendation**: Implement a **multi-strategy adaptive chunking system** where chunking method is selected based on content type and learning context.

---

## 📊 Research Findings Summary

### Phase 12 Research (Existing Weave-NN Documentation)

**Key Findings**:
- **PPL-based chunking** identified as optimal (70-262 tokens)
- **Recommended size**: 512 tokens for general content
- **Overlap**: 20% recommended for context preservation
- **Technology**: @xenova/transformers for local embeddings
- **Gap identified**: Context-aware chunking (12 hours implementation estimate)
- **Vector embeddings**: 16 hours implementation estimate

**Relevance**: Provides baseline token sizes and overlap percentages that have been validated for Weaver's use case.

### Memory Networks Research (Existing Documentation)

**Key Findings**:
- **Multi-granularity approach**: ½×, 1×, 2×, 4×, 8× base chunk size
- **Base size**: 512 tokens
- **Small-world network topology**: Clustering coefficient >0.3
- **Faceted metadata**: 4-7 primary dimensions recommended
- **Key-value separation**: Efficient retrieval pattern

**Relevance**: Supports hierarchical memory architecture with multiple granularity levels.

### Modern Chunking Strategies (2024-2025 Research)

**Late Chunking (2024 Innovation)**:
- Embed entire document first, then chunk the embeddings
- Preserves full context during embedding
- Best for long-context models (Claude 3.5 Sonnet, GPT-4 Turbo)
- **Trade-off**: Higher computational cost, better accuracy

**Contextual Retrieval (Anthropic 2024)**:
- Enrich chunks with surrounding context before embedding
- 35-49% accuracy improvement over standard chunking
- Add 50-100 tokens of context to each chunk
- **Trade-off**: Storage overhead, significant accuracy gain

**Semantic Boundary Detection**:
- Use embedding similarity to detect topic shifts
- 30-50% better than fixed-size chunking
- Sliding window with perplexity scoring
- **Trade-off**: Computational overhead, natural boundaries

**Token Size Recommendations**:
- **General content**: 512 tokens with 20% overlap
- **Learning content**: 384 tokens with contextual enrichment
- **Code**: 256 tokens with AST-aware boundaries
- **Conversations**: 512 tokens with turn-based boundaries

### Memorographic Embeddings (Learning-Specific Research)

**Fundamental Differences from Document Embeddings**:
- **Temporal dimension**: Memory decay, recency weighting
- **Episodic structure**: Event sequences with context
- **Semantic relationships**: Explicit graph connections
- **Preference encoding**: User preference signals (PCA decomposition)
- **Multi-level hierarchy**: Atomic → Episodic → Semantic → Strategic

**Memory Types for Learning Loop**:

1. **Episodic Memory** (Task Experiences)
   - Chunking: Event-based boundaries (task start → completion)
   - Size: Variable (entire task execution as single episode)
   - Metadata: Timestamp, duration, participants, outcome
   - Structure: Sequential with temporal links

2. **Semantic Memory** (Learned Patterns)
   - Chunking: Concept-based boundaries
   - Size: 256-512 tokens per concept
   - Metadata: Abstraction level, confidence, source episodes
   - Structure: Hierarchical knowledge graph

3. **Preference Memory** (User Feedback)
   - Chunking: Decision-point boundaries
   - Size: Small (64-128 tokens per preference signal)
   - Metadata: Context, alternative options, satisfaction rating
   - Structure: PCA-decomposed preference space

4. **Procedural Memory** (SOPs/Workflows)
   - Chunking: Step-based boundaries
   - Size: 256-384 tokens per step
   - Metadata: Prerequisites, success criteria, variability
   - Structure: DAG with dependency links

5. **Working Memory** (Active Context)
   - Chunking: No chunking (maintain full context)
   - Size: Limited by context window
   - Metadata: Relevance scores, temporal decay
   - Structure: Priority queue with recency bias

**Preprocessing Recommendations**:
- **Normalization**: Standardize timestamps, user IDs, task IDs
- **Enrichment**: Add context windows (±2 steps for procedural, ±1 episode for semantic)
- **Relationship extraction**: Explicit links between memories
- **Metadata faceting**: 4-7 dimensions (temporal, spatial, relational, contextual, outcome-based)

---

## 🏗️ Proposed Chunking Strategy for Weaver

### Multi-Strategy Adaptive System

**Core Principle**: Select chunking strategy based on content type and learning context.

### Strategy Matrix

| Content Type | Chunking Method | Size | Overlap | Enrichment | Priority |
|-------------|----------------|------|---------|-----------|----------|
| **Task Experiences** | Event-based | Variable | None | ±1 episode context | High |
| **User Reflections** | Semantic boundary | 384 tokens | 15% | ±50 tokens context | High |
| **Learned Patterns** | Concept-based | 256-512 | 20% | Hierarchical path | Medium |
| **SOPs/Workflows** | Step-based | 256-384 | 10% | Prerequisites + outcomes | High |
| **Decision Trails** | Decision-point | 64-128 | None | Alternatives + rationale | Medium |
| **Code Artifacts** | AST-aware | 256 | 15% | Function signatures | Low |
| **Documentation** | PPL-based | 512 | 20% | Section headers | Low |

### Implementation Phases

#### Phase 1: Core Chunking Plugins (8 hours)

**1. Event-Based Chunker** (Episodic Memory)
```typescript
interface EventBasedChunkerConfig {
  eventBoundaries: 'task-start' | 'task-end' | 'phase-transition';
  includeContext: boolean; // ±1 episode
  temporalLinks: boolean;  // Link to previous/next events
}
```

**Use Case**: Task execution experiences in learning loop
- Chunk at natural event boundaries (perception → reasoning → execution → reflection)
- Maintain full context within each event
- Add temporal links to related events

**2. Semantic Boundary Chunker** (Semantic Memory)
```typescript
interface SemanticBoundaryConfig {
  embeddingModel: string;
  similarityThreshold: number;  // 0.7-0.85 typical
  minChunkSize: number;         // 128 tokens
  maxChunkSize: number;         // 512 tokens
  contextWindow: number;        // ±50 tokens
}
```

**Use Case**: User reflections, learned insights
- Detect topic shifts using embedding similarity
- Preserve semantic coherence within chunks
- Add surrounding context for better retrieval

**3. Preference Signal Chunker** (Preference Memory)
```typescript
interface PreferenceSignalConfig {
  decisionPoints: string[];     // Keywords indicating decisions
  includeAlternatives: boolean;
  maxTokens: 128;
}
```

**Use Case**: A/B testing choices, user feedback
- Chunk at decision points (plan selection, satisfaction ratings)
- Include alternatives considered
- Small chunks with high metadata density

**4. Step-Based Chunker** (Procedural Memory)
```typescript
interface StepBasedConfig {
  stepDelimiters: string[];     // Markdown headers, numbered lists
  includePrerequisites: boolean;
  includeOutcomes: boolean;
  maxTokens: 384;
}
```

**Use Case**: SOPs, workflow steps, tutorials
- Chunk at step boundaries
- Include prerequisites and success criteria
- Moderate chunk size with procedural context

#### Phase 2: Advanced Features (12 hours)

**1. Late Chunking Support**
- For long documents where full context is beneficial
- Embed first, then chunk embeddings
- Use with Claude 3.5 Sonnet (200k context window)

**2. Contextual Retrieval**
- Add 50-100 tokens of surrounding context
- Generate context summary for each chunk
- 35-49% accuracy improvement (Anthropic research)

**3. Multi-Granularity Indexing**
- Build indexes at multiple granularity levels
- ½×, 1×, 2×, 4×, 8× base chunk size
- Support coarse-to-fine retrieval

**4. Hierarchical Memory Links**
- Atomic memories → Episodes → Patterns → Strategy
- Explicit parent/child relationships
- Graph-based traversal

---

## 🔧 Integration with Workflow System

### Chunking Workflow Enhancement

**Current**: `vector-db:chunking` workflow triggers on `chunking-strategy.md` completion

**Enhancement**: Add strategy selection in markdown template

```markdown
---
status: completed
doc_id: "doc-abc123"
source_path: "/path/to/document.md"
content_type: "task-experience" | "reflection" | "pattern" | "sop" | "decision"
---

# Chunking Strategy Selection

## Content Type
- [x] Task Experience (Episodic Memory)
- [ ] User Reflection (Semantic Memory)
- [ ] Learned Pattern (Semantic Memory)
- [ ] SOP/Workflow (Procedural Memory)
- [ ] Decision Trail (Preference Memory)

## Selected Strategy
**Strategy**: Event-based chunking

## Configuration
- Event boundaries: phase-transition
- Include context: yes (±1 episode)
- Temporal links: yes
```

### Workflow Handler Logic

```typescript
export const chunkingWorkflow: WorkflowDefinition = {
  id: 'vector-db:chunking',
  handler: async (context: WorkflowContext) => {
    const parsed = await markdownParser.parse(fileEvent.absolutePath);

    // Determine chunking strategy from content type
    const contentType = parsed.frontmatter.content_type;
    const strategy = selectChunkingStrategy(contentType);

    // Load appropriate chunking plugin
    const chunker = await loadChunkingPlugin(strategy);

    // Configure based on user selections
    const config = parseChunkingConfig(parsed.userInput, strategy);

    // Apply chunking
    const chunks = await chunker.chunk(document, config);

    // Generate chunk markdown with metadata
    for (const chunk of chunks) {
      const metadata = enrichChunkMetadata(chunk, contentType, strategy);
      await saveChunkWithMetadata(chunk, metadata);
    }

    // Trigger embedding workflow
    await generateEmbeddingWorkflowTemplate(chunks, contentType);
  },
};
```

---

## 📊 Metadata Schema

### Chunk Metadata

```typescript
interface ChunkMetadata {
  // Core identifiers
  chunk_id: string;
  doc_id: string;
  source_path: string;

  // Content classification
  content_type: 'episodic' | 'semantic' | 'preference' | 'procedural' | 'working';
  memory_level: 'atomic' | 'episodic' | 'semantic' | 'strategic';

  // Chunking metadata
  strategy: string;
  size_tokens: number;
  overlap_tokens: number;

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
```

---

## 🎯 Implementation Roadmap

### Week 1: Core Plugins (8 hours)

**Day 1-2: Event-Based Chunker** (3 hours)
- [ ] Implement event boundary detection
- [ ] Add temporal linking
- [ ] Test with learning loop markdown files

**Day 3-4: Semantic Boundary Chunker** (3 hours)
- [ ] Implement embedding-based boundary detection
- [ ] Add sliding window perplexity scoring
- [ ] Test with user reflections

**Day 5: Preference & Step-Based Chunkers** (2 hours)
- [ ] Implement decision-point detection
- [ ] Implement step boundary detection
- [ ] Test with SOPs and feedback

### Week 2: Advanced Features (12 hours)

**Day 1-2: Contextual Retrieval** (4 hours)
- [ ] Implement context window extraction
- [ ] Add context summarization
- [ ] Benchmark accuracy improvements

**Day 3-4: Multi-Granularity Indexing** (4 hours)
- [ ] Implement multi-level chunking
- [ ] Build hierarchical indexes
- [ ] Test coarse-to-fine retrieval

**Day 5: Integration & Testing** (4 hours)
- [ ] Update workflow handlers
- [ ] Create markdown templates
- [ ] End-to-end testing
- [ ] Documentation

---

## 📈 Success Metrics

### Accuracy Metrics
- **Retrieval precision**: >0.85 for relevant chunks
- **Retrieval recall**: >0.90 for known patterns
- **Semantic coherence**: >0.80 within-chunk similarity
- **Boundary accuracy**: >0.75 vs human-annotated boundaries

### Performance Metrics
- **Chunking speed**: <100ms per document
- **Index build time**: <5 seconds for 1000 chunks
- **Query latency**: <50ms for similarity search
- **Storage efficiency**: <2x overhead for metadata

### User Experience Metrics
- **Strategy selection time**: <2 minutes
- **Markdown template completion**: <5 minutes
- **Workflow trigger delay**: <1 second
- **End-to-end chunking time**: <30 seconds

---

## 🔍 Edge Cases & Considerations

### 1. Very Long Documents
- **Problem**: Documents >10k tokens exceed chunk size limits
- **Solution**: Use late chunking with hierarchical indexing
- **Implementation**: Break into sections first, then chunk sections

### 2. Very Short Documents
- **Problem**: Documents <100 tokens too small to chunk meaningfully
- **Solution**: Keep as single chunk with full context
- **Implementation**: Skip chunking for docs below minimum threshold

### 3. Mixed Content Types
- **Problem**: Single document contains multiple content types
- **Solution**: Detect content type per section, apply different strategies
- **Implementation**: Hybrid chunker that segments by type first

### 4. Temporal Memory Decay
- **Problem**: Old memories should be less prominent but not lost
- **Solution**: Apply decay function during retrieval ranking
- **Implementation**: Exponential decay with configurable half-life

### 5. Relationship Preservation
- **Problem**: Chunking breaks explicit relationships (e.g., "as discussed in step 3")
- **Solution**: Extract and preserve cross-chunk references
- **Implementation**: Reference resolution during chunk generation

---

## 📚 Related Documentation

- **Phase 12 Research**: `/docs/phase-12-pillar-mapping.md`
- **Memory Networks**: `/research/memory-networks-research.md`
- **Workflow Extension Guide**: `/docs/WORKFLOW-EXTENSION-GUIDE.md`
- **Vector DB Architecture**: `/docs/VERCEL-WORKFLOW-VECTOR-DB-ARCHITECTURE.md`

---

## 🎓 Research Citations

### Modern Chunking (2024-2025)
- **Late Chunking**: Jina AI (2024) - "Long-Context Embedding via Chunked Embeddings"
- **Contextual Retrieval**: Anthropic (2024) - "Contextual Retrieval"
- **Semantic Boundaries**: Li et al. (2024) - "Adaptive Text Segmentation via Embeddings"

### Memorographic Embeddings
- **Episodic Memory**: Tulving (1972), modernized with neural embeddings
- **Hierarchical Memory**: Anderson (1983) ACT-R, adapted for vector spaces
- **Preference Learning**: McFee & Lanckriet (2010) - Metric Learning to Rank

---

**Status**: ✅ Synthesis Complete
**Next Steps**: Design implementation architecture → Implement core plugins → Integration testing
