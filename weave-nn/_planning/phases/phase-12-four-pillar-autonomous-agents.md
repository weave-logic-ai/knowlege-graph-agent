---
phase_id: PHASE-12
phase_name: Four-Pillar Autonomous Agent System
status: planned
priority: critical
created_date: '2025-10-27'
start_date: TBD
end_date: TBD
duration: 8-10 weeks
dependencies:
  requires:
    - PHASE-11
  enables:
    - PHASE-13
tags:
  - phase
  - autonomous-agents
  - four-pillars
  - perception
  - reasoning
  - memory
  - execution
  - ai-enhancement
  - critical-priority
visual:
  icon: brain
  cssclasses:
    - type-implementation
    - status-planned
    - priority-critical
type: planning
version: '3.0'
updated_date: '2025-10-28'
icon: brain
---

# Phase 12: Four-Pillar Autonomous Agent System

**Status**: 📋 **PLANNED**
**Priority**: 🔴 **CRITICAL**
**Duration**: 8-10 weeks
**Depends On**: [[phase-11-cli-service-management|Phase 11]] ✅

---

## 🎯 Objectives

Transform Weaver from an intelligent workflow assistant (68.5% maturity) into a true autonomous agent platform (target: 85%+ maturity) by implementing the **4-Pillar Framework** from academic research: Perception, Reasoning, Memory, and Execution.

### Primary Goals

1. **Bridge the Autonomy Gap (27.46%)**
   - Current: 42.9% task completion vs. human baseline
   - Target: 72.36% human-level autonomous task completion
   - Close performance gap through architectural enhancement

2. **Implement Learning Loop**
   - Transform passive logging into active reflection
   - Enable experience-based plan adaptation
   - Autonomous improvement without human intervention

3. **Enhance Semantic Understanding**
   - Move from keyword-based to semantic perception
   - Implement vector embeddings for RAG
   - Multi-source perception fusion

4. **Advanced Reasoning Capabilities**
   - Multi-path planning (Tree-of-Thought, CoT-SC)
   - Expert coordination framework
   - Anticipatory reflection and error prevention

### Current State Analysis

**Overall Maturity**: **68.5%** (Weighted Average)

**Pillar Breakdown**:
- **Perception**: 55% (WEAK) - Strong text parsing, missing multimodal & semantic
- **Reasoning**: 60% (MODERATE) - Good decomposition, lacks multi-path planning
- **Memory**: 80% (STRONG) ⭐ - Excellent SQL/RAG, needs semantic search
- **Execution**: 79% (STRONG) ⭐ - Comprehensive tools, missing GUI automation

**Critical Gaps Blocking Autonomy**:
1. ❌ No active reflection loop (logging ≠ learning)
2. ❌ No experience-based planning (memory not integrated with reasoning)
3. ❌ No semantic search (keyword-only RAG)
4. ❌ No multi-path reasoning (single-plan execution)
5. ❌ Limited multi-agent coordination

---

## 📋 Implementation Tasks

### Phase 1: Foundation (2-3 Weeks) - CRITICAL PATH

**Goal**: Enable basic autonomous learning loop

#### Perception Enhancements

- [ ] **1.1 Vector Embeddings for Semantic Search**
  **Effort**: 16 hours | **Priority**: Critical | **Dependencies**: None

  Implement semantic similarity search beyond keyword matching.

  **Acceptance Criteria**:
  - Install and configure `@xenova/transformers` for local embeddings
  - Generate embeddings for all vault notes on indexing
  - Store embeddings in shadow cache database (new table)
  - Implement semantic similarity search function
  - Hybrid search combining FTS5 + vector similarity
  - Re-ranking algorithm for optimal results
  - Performance: <200ms query response
  - Integration tests with various query types

  **Implementation Notes**:
  - **File**: New `src/shadow-cache/embeddings.ts`
  - **File**: Extend `src/shadow-cache/database.ts` (add embeddings table)
  - **File**: New `src/shadow-cache/hybrid-search.ts`
  - Use Sentence Transformers model: `all-MiniLM-L6-v2`
  - Store as binary vectors in SQLite
  - Cosine similarity for distance metric
  - Normalize scores 0-1 for ranking

- [ ] **1.2 Experience Indexing System**
  **Effort**: 10 hours | **Priority**: Critical | **Dependencies**: None

  Index activity logs for experience-based retrieval.

  **Acceptance Criteria**:
  - Extend shadow cache database with experiences table
  - Schema: task, context, plan, outcome, success, lessons, timestamp
  - Parse existing activity logs into structured experiences
  - Real-time experience logging during workflow execution
  - Query interface for experience retrieval
  - Similarity matching for task context
  - Integration tests

  **Implementation Notes**:
  - **File**: Extend `src/shadow-cache/database.ts`
  - **File**: New `src/memory/experience-indexer.ts`
  - Parse JSONL activity logs retrospectively
  - Hook into workflow engine for real-time capture
  - Store success/failure trajectories

- [ ] **1.3 Advanced Chunking System**
  **Effort**: 20 hours | **Priority**: Critical | **Dependencies**: None

  Multi-strategy chunking system for learning-specific embeddings.

  **Acceptance Criteria**:
  - Event-based chunker (episodic memory - task experiences)
  - Semantic boundary chunker (reflections, learned patterns)
  - Preference signal chunker (user decisions, feedback)
  - Step-based chunker (SOPs, workflows)
  - Content-type driven strategy selection
  - Comprehensive metadata enrichment
  - Temporal and hierarchical linking
  - Integration with workflow system
  - Markdown templates for user configuration
  - Full test coverage (unit + integration)

  **Implementation Notes**:
  - **Directory**: New `src/chunking/` module
  - **Files**:
    - `src/chunking/types.ts` - Type definitions
    - `src/chunking/strategy-selector.ts` - Strategy selection
    - `src/chunking/plugins/event-based-chunker.ts` - Episodic memory
    - `src/chunking/plugins/semantic-boundary-chunker.ts` - Semantic memory
    - `src/chunking/plugins/preference-signal-chunker.ts` - Preference memory
    - `src/chunking/plugins/step-based-chunker.ts` - Procedural memory
    - `src/chunking/plugins/base-chunker.ts` - Abstract base class
  - **Integration**: Extend `src/workflows/vector-db-workflows.ts`
  - **Templates**: `src/templates/vector-db/chunking-strategy.md`
  - **Tests**: `tests/chunking/` directory with plugin tests
  - **Docs**: Already created in `/docs/CHUNKING-*.md`

  **Chunking Strategies by Content Type**:
  - **Task experiences**: Event-based at phase transitions
  - **User reflections**: Semantic boundary detection (384 tokens)
  - **User decisions**: Decision-point extraction (64-128 tokens)
  - **SOPs/workflows**: Step-based boundaries (256-384 tokens)
  - **General docs**: PPL-based chunking (512 tokens, Phase 2)

  **Research Foundation**:
  - Based on Phase 12 research + 2024-2025 chunking strategies
  - Implements memorographic embeddings for learning systems
  - Multi-granularity support (½×, 1×, 2×, 4×, 8×)
  - Contextual enrichment (±50 tokens) for 35-49% accuracy improvement

#### Reasoning Enhancements

- [ ] **1.4 Chain-of-Thought Prompt Templates**
  **Effort**: 10 hours | **Priority**: Critical | **Dependencies**: None

  Implement CoT prompting for better reasoning transparency.

  **Acceptance Criteria**:
  - CoT prompt templates for common tasks
  - Step-by-step reasoning in AI responses
  - Intermediate thought logging
  - Integration with Claude API client
  - Template library: task decomposition, planning, reflection
  - Configurable reasoning depth
  - Unit tests with mocked AI responses

  **Implementation Notes**:
  - **File**: New `src/agents/templates/cot-prompt.ts`
  - **File**: Extend `src/agents/claude-client.ts`
  - Templates include:
    - Task breakdown CoT
    - Plan evaluation CoT
    - Error analysis CoT
    - Reflection CoT

- [ ] **1.5 Reflection Engine**
  **Effort**: 18 hours | **Priority**: Critical | **Dependencies**: 1.2, 1.4

  Active reflection system analyzing outcomes and learning.

  **Acceptance Criteria**:
  - Post-execution outcome analysis
  - Success/failure classification
  - Root cause analysis for failures
  - Lesson extraction and storage
  - Actionable improvement recommendations
  - Reflection logging with structured output
  - Integration with workflow engine
  - Unit and integration tests

  **Implementation Notes**:
  - **File**: New `src/reasoning/reflection-engine.ts`
  - Use CoT prompts for analysis
  - Compare expected vs. actual outcomes
  - Store lessons in experience index
  - Three reflection types:
    1. Action-level (immediate feedback)
    2. Plan-level (workflow adjustment)
    3. Task-level (strategic learning)

- [ ] **1.6 Memory → Reasoning Integration**
  **Effort**: 20 hours | **Priority**: Critical | **Dependencies**: 1.2, 1.5

  Enable experience-based plan generation and adaptation.

  **Acceptance Criteria**:
  - Retrieve relevant past experiences for current task
  - Semantic similarity matching for experience retrieval
  - Top-K relevant experiences (K=3-5)
  - Integrate experiences into plan generation prompts
  - Adapt plans based on past successes/failures
  - Track improvement over time (success rate metrics)
  - Integration tests showing plan adaptation

  **Implementation Notes**:
  - **File**: New `src/reasoning/experience-retrieval.ts`
  - **File**: Extend `src/workflow-engine/index.ts`
  - Query pattern:
    1. Embed current task description
    2. Semantic search in experiences
    3. Retrieve top-K similar experiences
    4. Include in planning context
  - Before/after metrics collection

---

### Phase 2: Advanced Reasoning (3-4 Weeks)

**Goal**: Multi-path planning and expert coordination

#### Multi-Path Reasoning

- [ ] **2.1 Self-Consistent Chain-of-Thought (CoT-SC)**
  **Effort**: 24 hours | **Priority**: High | **Dependencies**: 1.4

  Generate multiple reasoning paths and select best via voting.

  **Acceptance Criteria**:
  - Generate N independent reasoning paths (N=3-5)
  - Parallel generation for efficiency
  - Voting mechanism for plan selection
  - Confidence scoring per path
  - Fallback to single path if paths too divergent
  - Performance tracking: improvement vs. single-path
  - Integration tests

  **Implementation Notes**:
  - **File**: New `src/reasoning/multi-path-cot.ts`
  - Use Promise.all() for parallel generation
  - Voting strategies:
    - Majority consensus
    - Confidence-weighted
    - Similarity clustering
  - Track: diversity of paths, vote agreement %

- [ ] **2.2 Tree-of-Thought (ToT) Implementation**
  **Effort**: 32 hours | **Priority**: High | **Dependencies**: 2.1

  Branching exploration of reasoning space with search algorithms.

  **Acceptance Criteria**:
  - Tree-structured thought representation
  - Breadth-First Search (BFS) strategy
  - Depth-First Search (DFS) strategy
  - Node evaluation and pruning
  - Backtracking on failure
  - Configurable max depth and branching factor
  - Visualization of thought tree (Mermaid)
  - Integration tests with complex planning tasks

  **Implementation Notes**:
  - **File**: New `src/reasoning/tree-of-thought.ts`
  - **File**: New `src/reasoning/tree-visualizer.ts`
  - Node structure: thought, score, parent, children
  - Evaluation: LLM scores intermediate thoughts
  - Pruning: discard low-scoring branches
  - Max depth: 5 levels, branching factor: 3

- [ ] **2.3 Planning Expert Agent**
  **Effort**: 16 hours | **Priority**: High | **Dependencies**: None

  Dedicated agent for strategic task planning.

  **Acceptance Criteria**:
  - Specialized planning agent rule
  - Focus: high-level strategy, not execution
  - Plan validation and critique
  - Dependency identification
  - Risk assessment
  - Integration with rules engine
  - Unit tests

  **Implementation Notes**:
  - **File**: New `src/agents/experts/planning-expert.ts`
  - Responsibilities:
    - Analyze task requirements
    - Generate multiple plan candidates
    - Evaluate feasibility
    - Identify dependencies
    - Estimate effort
  - Use CoT-SC internally

- [ ] **2.4 Error Detection and Analysis Expert**
  **Effort**: 16 hours | **Priority**: High | **Dependencies**: 1.5

  Specialized agent for error analysis and recovery.

  **Acceptance Criteria**:
  - Automatic error detection from logs
  - Error classification (syntax, logic, environment, dependency)
  - Root cause analysis
  - Recovery strategy generation
  - Error pattern learning
  - Integration with reflection engine
  - Unit tests

  **Implementation Notes**:
  - **File**: New `src/agents/experts/error-detection-expert.ts`
  - Monitor workflow execution failures
  - Analyze error logs with AI
  - Build error pattern database
  - Suggest fixes based on past resolutions

- [ ] **2.5 Multi-Agent Coordination Framework**
  **Effort**: 28 hours | **Priority**: High | **Dependencies**: 2.3, 2.4

  Expert registry and communication system.

  **Acceptance Criteria**:
  - Expert registry with capabilities
  - Task routing to appropriate experts
  - Inter-expert message passing
  - Consensus mechanisms for decisions
  - Expert coordination workflows
  - Performance monitoring per expert
  - Integration tests with 3+ experts

  **Implementation Notes**:
  - **File**: New `src/agents/coordination/registry.ts`
  - **File**: New `src/agents/coordination/message-passing.ts`
  - **File**: New `src/agents/coordination/consensus.ts`
  - Experts: Planner, Reflection, Error Detection, Memory Manager
  - Communication: event bus pattern
  - Consensus: voting, weighted by expertise

- [ ] **2.6 Anticipatory Reflection (Devil's Advocate)**
  **Effort**: 20 hours | **Priority**: Medium | **Dependencies**: 1.5, 2.1

  Pre-execution plan validation and risk assessment.

  **Acceptance Criteria**:
  - Challenge proposed plans before execution
  - Generate alternative approaches
  - Risk vs. reward evaluation
  - Failure mode identification
  - Preemptive plan adjustments
  - Integration with planning workflow
  - Unit tests

  **Implementation Notes**:
  - **File**: New `src/reasoning/anticipatory-reflection.ts`
  - For each plan step:
    1. LLM considers potential issues
    2. Proposes alternatives
    3. Evaluates risks
    4. Recommends adjustments
  - Runs after planning, before execution

---

### Phase 3: Perception Enhancement (2-3 Weeks)

**Goal**: Expanded data gathering and multi-source fusion

#### Tool-Based Perception

- [ ] **3.1 Web Scraping and Search Tools**
  **Effort**: 14 hours | **Priority**: High | **Dependencies**: None

  Direct web access for real-time knowledge.

  **Acceptance Criteria**:
  - Web scraping tool (cheerio + node-fetch)
  - Search API integration (Tavily or SerpAPI)
  - HTML parsing and extraction
  - Rate limiting and error handling
  - Caching with TTL
  - MCP tool exposure
  - Integration tests

  **Implementation Notes**:
  - **File**: New `src/mcp-server/tools/web-scraper.ts`
  - **File**: New `src/mcp-server/tools/web-search.ts`
  - Search tool requires API key
  - Cache results 1 hour
  - Respect robots.txt

- [ ] **3.2 Enhanced Structured Data Parsing**
  **Effort**: 12 hours | **Priority**: Medium | **Dependencies**: None

  Expand parsing beyond markdown to HTML/XML/JSON.

  **Acceptance Criteria**:
  - HTML parsing (cheerio)
  - XML parsing (fast-xml-parser)
  - Deep JSON structure traversal
  - CSS selector queries
  - XPath support for XML
  - Integration with shadow cache
  - Unit tests

  **Implementation Notes**:
  - **File**: Extend `src/shadow-cache/parser.ts`
  - Support formats:
    - HTML (documentation exports)
    - XML (config files)
    - JSON (API responses, config)
  - Extract: text content, structure, metadata

#### Multi-Modal Perception (Future/Optional)

- [ ] **3.3 Vision-Language Model Integration (OPTIONAL)**
  **Effort**: 40 hours | **Priority**: Low | **Dependencies**: None

  GUI automation and diagram understanding via screenshots.

  **Acceptance Criteria**:
  - VLM integration (Llava or GPT-4V)
  - Screenshot capture and processing
  - GUI element detection (Set-of-Mark)
  - Image description generation
  - Diagram understanding
  - MCP tool for image analysis
  - Integration tests

  **Implementation Notes**:
  - **File**: New `src/perception/vision-model.ts`
  - **File**: New `src/mcp-server/tools/image-analysis.ts`
  - VLM options:
    - Local: Llava (requires GPU)
    - Cloud: GPT-4V API
  - Use cases:
    - Obsidian GUI screenshots
    - Architecture diagrams
    - Concept maps

- [ ] **3.4 Multi-Source Perception Fusion**
  **Effort**: 18 hours | **Priority**: Medium | **Dependencies**: 3.1, 3.2

  Cross-validate information from multiple sources.

  **Acceptance Criteria**:
  - Combine text, structured data, web search
  - Conflict resolution algorithms
  - Confidence scoring per source
  - Majority voting for facts
  - Source reliability tracking
  - Integration tests

  **Implementation Notes**:
  - **File**: New `src/perception/fusion-engine.ts`
  - Example: Validate fact across:
    - Vault notes
    - Web search results
    - Structured knowledge bases
  - Resolution strategies:
    - Trust vault (authoritative)
    - Trust recent (web for current events)
    - Trust majority (voting)

---

### Phase 4: Execution Expansion (OPTIONAL - 2-3 Weeks)

**Goal**: GUI automation and advanced execution

#### GUI Automation (Deferred/Optional)

- [ ] **4.1 Playwright-Based GUI Automation**
  **Effort**: 32 hours | **Priority**: Low | **Dependencies**: 3.3 (VLM)

  Automate Obsidian and desktop applications.

  **Acceptance Criteria**:
  - Playwright integration for browser automation
  - Screenshot capture
  - Element detection via accessibility tree
  - Mouse/keyboard automation
  - Coordinate-based clicking (VLM integration)
  - Error recovery (retry, fallback)
  - Integration tests

  **Implementation Notes**:
  - **File**: New `src/execution/gui-automation/playwright-driver.ts`
  - Use cases:
    - Automate Obsidian GUI
    - Web application testing
    - Data entry automation
  - Combine with VLM for element identification

- [ ] **4.2 Code Execution Sandbox**
  **Effort**: 24 hours | **Priority**: Low | **Dependencies**: None

  Safe execution of dynamically generated code.

  **Acceptance Criteria**:
  - Sandboxed Python execution environment
  - Sandboxed JavaScript/Node.js execution
  - Resource limits (CPU, memory, time)
  - Input/output capture
  - Security isolation (Docker or VM2)
  - Error handling
  - Integration tests

  **Implementation Notes**:
  - **File**: New `src/execution/sandbox/python-executor.ts`
  - **File**: New `src/execution/sandbox/js-executor.ts`
  - Sandbox options:
    - Docker containers
    - VM2 (Node.js sandbox)
    - E2B (cloud sandbox)
  - Use cases:
    - Dynamic data processing
    - Custom calculations
    - Script execution

#### Advanced Execution

- [ ] **4.3 Structured Error Recovery System**
  **Effort**: 16 hours | **Priority**: High | **Dependencies**: 2.4

  Define recovery strategies per error type.

  **Acceptance Criteria**:
  - Error type classification
  - Recovery strategy mapping
  - Retry with exponential backoff
  - Alternative approach generation
  - Re-planning on persistent failure
  - Human escalation for critical errors
  - Metrics: recovery success rate
  - Integration tests

  **Implementation Notes**:
  - **File**: New `src/execution/error-recovery.ts`
  - Error types:
    - Transient (network) → Retry
    - Validation (bad input) → Re-plan
    - Environment (missing dep) → Install/fallback
    - Logic (bug) → Alternative approach
  - Max retries: 3
  - Escalation threshold: 3 failures

- [ ] **4.4 State Verification Middleware**
  **Effort**: 12 hours | **Priority**: Medium | **Dependencies**: None

  Pre-action state validation to prevent errors.

  **Acceptance Criteria**:
  - State model tracking
  - Pre-action precondition checks
  - Post-action verification
  - State consistency validation
  - Rollback on verification failure
  - Integration with workflow engine
  - Unit tests

  **Implementation Notes**:
  - **File**: New `src/execution/state-verifier.ts`
  - Verify before each action:
    - Required files exist
    - Services are running
    - Permissions granted
    - Dependencies satisfied
  - Verify after each action:
    - Expected state reached
    - No unintended side effects

---

### Phase 5: Integration & Testing (1-2 Weeks)

**Goal**: End-to-end autonomous agent validation

- [ ] **5.1 Autonomous Learning Loop Integration**
  **Effort**: 16 hours | **Priority**: Critical | **Dependencies**: 1.5, 1.6

  Complete feedback loop: perceive → reason → execute → reflect → learn.

  **Acceptance Criteria**:
  - Full cycle integration
  - Experience retrieval in planning
  - Active reflection after execution
  - Lesson storage in memory
  - Demonstrable improvement over iterations
  - Metrics: success rate improvement, time to completion
  - E2E tests

  **Implementation Notes**:
  - **File**: New `src/agents/autonomous-loop.ts`
  - Test scenarios:
    - Repeat same task 5 times
    - Measure: time, success rate, plan quality
    - Expect: improvement curve

- [ ] **5.2 Multi-Pillar Performance Benchmarking**
  **Effort**: 12 hours | **Priority**: High | **Dependencies**: All

  Benchmark all 4 pillars and integration.

  **Acceptance Criteria**:
  - Perception benchmarks (query speed, accuracy)
  - Reasoning benchmarks (plan quality, diversity)
  - Memory benchmarks (retrieval speed, relevance)
  - Execution benchmarks (success rate, error recovery)
  - Integration benchmarks (end-to-end task completion)
  - Comparison to baseline (pre-Phase 12)
  - Detailed performance report

  **Implementation Notes**:
  - **File**: New `tests/benchmarks/four-pillar-benchmark.ts`
  - Datasets:
    - 100 vault notes for perception
    - 20 complex tasks for reasoning
    - 50 task variations for learning
  - Metrics vs. targets from pillar mapping doc

- [ ] **5.3 Autonomous Agent E2E Tests**
  **Effort**: 20 hours | **Priority**: Critical | **Dependencies**: 5.1

  Real-world autonomous task scenarios.

  **Acceptance Criteria**:
  - Test scenarios:
    - Multi-step research task (web search + summarization + note creation)
    - Error recovery scenario (simulated failures)
    - Learning scenario (task repeated with variations)
    - Multi-expert coordination (complex task requiring 3+ experts)
  - All tests pass
  - Demonstrate autonomous behavior
  - No human intervention required
  - Code coverage 85%+

  **Implementation Notes**:
  - **File**: New `tests/integration/autonomous-agent.test.ts`
  - Scenarios:
    1. **Research Task**: "Research autonomous agents and create summary note"
    2. **Error Recovery**: Simulate network failures, file locks
    3. **Learning**: Repeat file organization task with variations
    4. **Coordination**: Complex workflow requiring planning, execution, validation

- [ ] **5.4 Documentation: Four-Pillar Architecture**
  **Effort**: 12 hours | **Priority**: High | **Dependencies**: All

  Comprehensive documentation of new capabilities.

  **Acceptance Criteria**:
  - Architecture overview with diagrams
  - Per-pillar documentation
  - Integration patterns guide
  - Configuration reference
  - Performance tuning guide
  - Troubleshooting guide
  - API reference

  **Implementation Notes**:
  - **File**: `docs/FOUR-PILLAR-ARCHITECTURE.md`
  - **File**: `docs/AUTONOMOUS-AGENTS-GUIDE.md`
  - **File**: `docs/PERFORMANCE-TUNING.md`
  - Include Mermaid diagrams
  - Code examples for each pillar
  - Configuration options

---

## ✅ Success Criteria

### Functional Requirements

- [ ] **Perception System**
  - Vector embeddings operational (semantic search working)
  - Hybrid search (keyword + semantic) functional
  - Web scraping and search tools integrated
  - Multi-source fusion working (optional)

- [ ] **Reasoning System**
  - Chain-of-Thought prompting active
  - Multi-path reasoning (CoT-SC or ToT) working
  - Reflection engine analyzing outcomes
  - Planning expert operational
  - Error detection expert functional
  - Multi-agent coordination working

- [ ] **Memory System**
  - Experience indexing operational
  - Experience retrieval integrated with planning
  - Lesson storage and retrieval working
  - Memory → Reasoning integration validated

- [ ] **Execution System**
  - Error recovery strategies implemented
  - State verification working
  - GUI automation (optional) functional
  - Code sandbox (optional) operational

- [ ] **Integration**
  - Complete autonomous learning loop functional
  - Demonstrable improvement over iterations
  - Multi-pillar coordination seamless

### Performance Requirements

- [ ] **Perception**
  - Semantic search: <200ms query response
  - Hybrid search accuracy: >85% relevant results
  - Embedding generation: <100ms per note

- [ ] **Reasoning**
  - Multi-path generation: <30s for 3-5 paths
  - Reflection analysis: <10s per outcome
  - Plan adaptation: <15s including retrieval

- [ ] **Memory**
  - Experience retrieval: <500ms
  - Relevance score: >85% for top-3 results
  - Lesson extraction: <5s per experience

- [ ] **Execution**
  - Error recovery success: >80%
  - State verification: <100ms per check

- [ ] **Integration**
  - Full learning cycle: <2 minutes
  - Success rate improvement: +20% after 5 iterations
  - Overall maturity: >85% (target vs. 68.5% current)

### Quality Requirements

- [ ] Test coverage > 85%
- [ ] TypeScript strict mode enabled
- [ ] No linting errors
- [ ] Complete documentation (user + developer)
- [ ] All integration tests passing
- [ ] Benchmark results documented
- [ ] Performance regression: <5% vs. Phase 11

---

## 🔗 Architecture

### Current vs. Proposed Architecture

**Current Weaver (Phase 11)**:
```
File Watcher → Shadow Cache → Rules Engine → Workflow Engine → Git Auto-Commit
                    ↓              ↓               ↓
              Activity Logger  Memory Sync   MCP Tools
```

**Proposed Weaver (Phase 12) - Four-Pillar System**:
```
┌─────────────────────────────────────────────────────────────┐
│                  ENHANCED WEAVER ARCHITECTURE                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ PERCEPTION LAYER                                             │
├─────────────────────────────────────────────────────────────┤
│ • File Watcher (existing) ✅                                 │
│ • Shadow Cache Parser (existing) ✅                          │
│ • Vector Embeddings (NEW) 🆕                                 │
│ • Web Scraper + Search (NEW) 🆕                              │
│ • Structured Data Parser (ENHANCED) 🔧                       │
│ • VLM Integration (OPTIONAL) 🔮                              │
│                                                              │
│ OUTPUT: Multimodal perception data                          │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌──────────────────────┴──────────────────────────────────────┐
│ SEMANTIC UNDERSTANDING LAYER (NEW) 🆕                        │
├─────────────────────────────────────────────────────────────┤
│ • Embedding-based similarity search                          │
│ • Hybrid search (keyword + semantic)                         │
│ • Context fusion (file + structure + memory)                │
│ • Re-ranking and relevance scoring                           │
│                                                              │
│ OUTPUT: Meaningful representation for reasoning             │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌──────────────────────┴──────────────────────────────────────┐
│ REASONING LAYER                                              │
├─────────────────────────────────────────────────────────────┤
│ EXISTING:                                                    │
│ • Rules Engine ✅                                            │
│ • Workflow Engine ✅                                         │
│                                                              │
│ NEW:                                                         │
│ • Chain-of-Thought Prompting 🆕                              │
│ • Multi-Path CoT (CoT-SC) 🆕                                 │
│ • Tree-of-Thought 🆕                                         │
│ • Reflection Engine 🆕                                       │
│ • Planning Expert 🆕                                         │
│ • Error Analysis Expert 🆕                                   │
│ • Anticipatory Reflection 🆕                                 │
│ • Expert Coordination Framework 🆕                           │
│                                                              │
│ INPUT: Perception + Retrieved Experiences                   │
│ OUTPUT: Adaptive multi-path plan                            │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌──────────────────────┴──────────────────────────────────────┐
│ MEMORY LAYER                                                 │
├─────────────────────────────────────────────────────────────┤
│ EXISTING:                                                    │
│ • Shadow Cache SQL ✅                                        │
│ • Activity Logger ✅                                         │
│ • Memory Sync (Claude-Flow) ✅                               │
│                                                              │
│ NEW:                                                         │
│ • Experience Index 🆕                                        │
│ • Semantic RAG (embeddings) 🆕                               │
│ • Hybrid Search 🆕                                           │
│ • Lesson Storage 🆕                                          │
│ • Experience Retrieval 🆕                                    │
│                                                              │
│ PROVIDES: Past experiences, procedures, knowledge           │
│ STORES: New experiences, learned patterns, lessons          │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌──────────────────────┴──────────────────────────────────────┐
│ EXECUTION LAYER                                              │
├─────────────────────────────────────────────────────────────┤
│ EXISTING:                                                    │
│ • MCP Tools ✅                                               │
│ • Git Client ✅                                              │
│ • File Operations ✅                                         │
│                                                              │
│ NEW:                                                         │
│ • Web Scraping Tool 🆕                                       │
│ • Error Recovery System 🆕                                   │
│ • State Verifier 🆕                                          │
│ • GUI Automation (OPTIONAL) 🔮                               │
│ • Code Sandbox (OPTIONAL) 🔮                                 │
│                                                              │
│ INPUT: Adaptive plan                                        │
│ OUTPUT: Environmental actions + results                     │
└──────────────────────┬──────────────────────────────────────┘
                       ↓
┌──────────────────────┴──────────────────────────────────────┐
│ FEEDBACK & LEARNING LOOP (NEW) 🆕                            │
├─────────────────────────────────────────────────────────────┤
│ 1. Execution results → New perception                       │
│ 2. Compare expected vs actual (Reflection Engine)           │
│ 3. Extract lessons learned                                  │
│ 4. Update memory (experiences + lessons)                    │
│ 5. Improve future plans (Memory → Reasoning)                │
│ 6. Continuous improvement cycle                             │
└──────────────────────────────────────────────────────────────┘

LEGEND:
✅ = Existing (Production)
🆕 = New (Phase 12)
🔧 = Enhanced (Existing + New)
🔮 = Optional/Future
```

### Inter-Pillar Communication Patterns

**1. Perception → Reasoning**:
```typescript
// Semantic understanding layer bridges perception and reasoning
const perception = await perceive(environment);
const embeddings = await generateEmbeddings(perception);
const context = await fusionEngine.combine(perception, embeddings);
const plan = await reasoning.generatePlan(context, retrievedExperiences);
```

**2. Reasoning ↔ Memory**:
```typescript
// Memory supports reasoning
const relevantExperiences = await memory.retrieveExperiences(task);
const plan = await reasoning.generatePlan(task, relevantExperiences);

// Reasoning updates memory
const outcome = await execution.execute(plan);
const reflection = await reasoning.reflect(plan, outcome);
await memory.storeExperience({ task, plan, outcome, lessons: reflection });
```

**3. Memory ↔ Execution**:
```typescript
// Memory guides execution
const procedures = await memory.retrieveProcedures(task);
const result = await execution.executeWithProcedures(plan, procedures);

// Execution creates memory
await memory.storeExecution({ action, result, success, duration });
```

**4. Execution → Perception (Feedback Loop)**:
```typescript
// Actions create new perceptions
const result = await execution.execute(action);
const newPerception = await perception.observe(environment);
const progress = reasoning.assess(expected, newPerception);
if (!progress.onTrack) {
  const adjustedPlan = await reasoning.replan(plan, newPerception);
}
```

---

## 📊 Technology Stack

### New Dependencies

```bash
# Vector Embeddings
bun add @xenova/transformers  # Local embedding generation
bun add -D @types/transformers

# Web Scraping & Search
bun add cheerio               # HTML parsing
bun add node-fetch            # HTTP requests
bun add fast-xml-parser       # XML parsing
# Search API: Tavily or SerpAPI (requires API key)

# Optional: Vision-Language Models
# bun add ollama              # Local VLM (Llava)
# or use GPT-4V API

# Optional: GUI Automation
# bun add playwright          # Browser/desktop automation

# Optional: Code Sandbox
# bun add vm2                 # JS sandbox
# or Docker for isolated execution
```

### Existing Dependencies (Leveraged)

- `better-sqlite3` - Extended for embeddings and experiences tables
- `@anthropic-ai/sdk` - Used for CoT prompting and reflection
- `zod` - Type validation for new data structures
- `vitest` - Testing framework for all new components
- Existing Weaver infrastructure (shadow cache, workflow engine, etc.)

---

## 📝 Deliverables

### Code

- [ ] **Perception Layer**
  - `/weaver/src/shadow-cache/embeddings.ts`
  - `/weaver/src/shadow-cache/hybrid-search.ts`
  - `/weaver/src/chunking/` - **Advanced chunking system**
    - `/weaver/src/chunking/index.ts`
    - `/weaver/src/chunking/types.ts`
    - `/weaver/src/chunking/strategy-selector.ts`
    - `/weaver/src/chunking/metadata-enricher.ts`
    - `/weaver/src/chunking/validation.ts`
    - `/weaver/src/chunking/plugins/index.ts`
    - `/weaver/src/chunking/plugins/base-chunker.ts`
    - `/weaver/src/chunking/plugins/event-based-chunker.ts`
    - `/weaver/src/chunking/plugins/semantic-boundary-chunker.ts`
    - `/weaver/src/chunking/plugins/preference-signal-chunker.ts`
    - `/weaver/src/chunking/plugins/step-based-chunker.ts`
    - `/weaver/src/chunking/plugins/ppl-chunker.ts` (Phase 2)
    - `/weaver/src/chunking/plugins/late-chunker.ts` (Phase 2)
    - `/weaver/src/chunking/utils/tokenizer.ts`
    - `/weaver/src/chunking/utils/boundary-detector.ts`
    - `/weaver/src/chunking/utils/context-extractor.ts`
    - `/weaver/src/chunking/utils/similarity.ts`
  - `/weaver/src/mcp-server/tools/web-scraper.ts`
  - `/weaver/src/mcp-server/tools/web-search.ts`
  - `/weaver/src/perception/fusion-engine.ts` (optional)
  - `/weaver/src/perception/vision-model.ts` (optional)

- [ ] **Reasoning Layer**
  - `/weaver/src/agents/templates/cot-prompt.ts`
  - `/weaver/src/reasoning/reflection-engine.ts`
  - `/weaver/src/reasoning/experience-retrieval.ts`
  - `/weaver/src/reasoning/multi-path-cot.ts`
  - `/weaver/src/reasoning/tree-of-thought.ts`
  - `/weaver/src/reasoning/anticipatory-reflection.ts`
  - `/weaver/src/agents/experts/planning-expert.ts`
  - `/weaver/src/agents/experts/error-detection-expert.ts`
  - `/weaver/src/agents/coordination/registry.ts`
  - `/weaver/src/agents/coordination/message-passing.ts`
  - `/weaver/src/agents/coordination/consensus.ts`

- [ ] **Memory Layer**
  - `/weaver/src/memory/experience-indexer.ts`
  - Extend: `/weaver/src/shadow-cache/database.ts` (experiences table)

- [ ] **Execution Layer**
  - `/weaver/src/execution/error-recovery.ts`
  - `/weaver/src/execution/state-verifier.ts`
  - `/weaver/src/execution/gui-automation/` (optional)
  - `/weaver/src/execution/sandbox/` (optional)

- [ ] **Integration**
  - `/weaver/src/agents/autonomous-loop.ts`

### Tests

- [ ] `/weaver/tests/chunking/` - **Chunking system tests**
  - [ ] `/weaver/tests/chunking/plugins/event-based-chunker.test.ts`
  - [ ] `/weaver/tests/chunking/plugins/semantic-boundary-chunker.test.ts`
  - [ ] `/weaver/tests/chunking/plugins/preference-signal-chunker.test.ts`
  - [ ] `/weaver/tests/chunking/plugins/step-based-chunker.test.ts`
  - [ ] `/weaver/tests/chunking/strategy-selector.test.ts`
  - [ ] `/weaver/tests/chunking/integration.test.ts`
- [ ] `/weaver/tests/shadow-cache/embeddings.test.ts`
- [ ] `/weaver/tests/shadow-cache/hybrid-search.test.ts`
- [ ] `/weaver/tests/reasoning/reflection-engine.test.ts`
- [ ] `/weaver/tests/reasoning/multi-path-cot.test.ts`
- [ ] `/weaver/tests/reasoning/tree-of-thought.test.ts`
- [ ] `/weaver/tests/memory/experience-indexer.test.ts`
- [ ] `/weaver/tests/execution/error-recovery.test.ts`
- [ ] `/weaver/tests/integration/autonomous-agent.test.ts`
- [ ] `/weaver/tests/benchmarks/four-pillar-benchmark.ts`

### Documentation

- [ ] `/weaver/docs/CHUNKING-STRATEGY-SYNTHESIS.md` ✅ **COMPLETE**
- [ ] `/weaver/docs/CHUNKING-IMPLEMENTATION-DESIGN.md` ✅ **COMPLETE**
- [ ] `/weaver/docs/WORKFLOW-EXTENSION-GUIDE.md` ✅ **COMPLETE**
- [ ] `/weaver/docs/FOUR-PILLAR-ARCHITECTURE.md`
- [ ] `/weaver/docs/AUTONOMOUS-AGENTS-GUIDE.md`
- [ ] `/weaver/docs/PERCEPTION-SYSTEM.md`
- [ ] `/weaver/docs/REASONING-SYSTEM.md`
- [ ] `/weaver/docs/MEMORY-SYSTEM.md`
- [ ] `/weaver/docs/EXECUTION-SYSTEM.md`
- [ ] `/weaver/docs/PERFORMANCE-TUNING.md`
- [ ] `/weaver/docs/API-REFERENCE-PHASE12.md`
- [ ] Updated: `/weaver/README.md`
- [ ] Updated: `/weaver/docs/ARCHITECTURE.md`

### Configuration

- [ ] `.env.example` - New configuration options
- [ ] `src/config/phase-12-config.ts` - Phase 12 settings schema

### Templates

- [ ] `/weaver/src/templates/vector-db/chunking-strategy.md` - User-facing chunking configuration

---

## 🚫 Out of Scope (Future Phases)

### Deferred to Phase 13+

- ❌ **Full Multimodal Perception** (VLM integration is optional in this phase)
- ❌ **Knowledge Graph Visualization** (Neo4j integration)
- ❌ **GUI Automation** (Playwright - optional, not required)
- ❌ **Robotic/IoT Control** (out of scope for knowledge management)
- ❌ **User Personality Modeling** (advanced personalization)
- ❌ **Distributed Agent Coordination** (multi-instance swarms)
- ❌ **Visual Workflow Designer** (UI for workflow creation)
- ❌ **Fine-tuned LLM** (embodied memory - architecture decision: use RAG instead)

### Explicitly Not Included

- ❌ Computer vision for diagram generation
- ❌ Audio processing capabilities
- ❌ Real-time collaboration features
- ❌ Mobile device support
- ❌ Cloud deployment automation
- ❌ Multi-user authentication

---

## 📈 Phase Timeline

**Total Duration**: 8-10 weeks

### Week 1-2: Foundation (CRITICAL PATH)
**Focus**: Enable autonomous learning loop

- **Week 1**:
  - Days 1-2: Advanced chunking system (core plugins)
  - Days 3-4: Vector embeddings implementation
  - Day 5: Experience indexing system

- **Week 2**:
  - Days 1: Chunking integration & testing
  - Days 2-3: Chain-of-Thought prompt templates
  - Days 4-5: Reflection engine (start)

### Week 3-4: Advanced Reasoning
**Focus**: Multi-path planning and expert coordination

- **Week 3**:
  - Days 1-2: Memory → Reasoning integration (complete)
  - Days 3-5: Self-Consistent CoT implementation

- **Week 4**:
  - Days 1-2: Planning expert agent
  - Days 3-4: Error detection expert
  - Day 5: Tree-of-Thought (start)

### Week 5-6: Reasoning & Perception
**Focus**: ToT, coordination, web access

- **Week 5**:
  - Days 1-3: Tree-of-Thought (complete)
  - Days 4-5: Multi-agent coordination framework (start)

- **Week 6**:
  - Days 1-2: Multi-agent coordination (complete)
  - Days 3-4: Web scraping and search tools
  - Day 5: Enhanced structured parsing

### Week 7: Execution & Integration
**Focus**: Error recovery and state management

- Days 1-2: Structured error recovery system
- Days 3: State verification middleware
- Days 4-5: Anticipatory reflection

### Week 8: Testing & Validation
**Focus**: Integration and benchmarking

- Days 1-2: Autonomous learning loop integration
- Days 3-4: Multi-pillar performance benchmarking
- Day 5: E2E autonomous agent tests (start)

### Week 9: Testing & Documentation
**Focus**: Comprehensive validation

- Days 1-3: E2E autonomous agent tests (complete)
- Days 4-5: Four-pillar architecture documentation

### Week 10: Buffer & Polish
**Focus**: Final refinements

- Days 1-2: Bug fixes from testing
- Days 3-4: Performance optimization
- Day 5: Release preparation and documentation review

### Optional Extensions (if time permits)
- Multi-source perception fusion
- VLM integration (basic)
- GUI automation (proof of concept)
- Code sandbox (basic implementation)

---

## 🎯 Success Metrics

### Quantitative Metrics

**Maturity Improvement** (Target: +16.5% overall):
| Pillar | Current | Target | Improvement |
|--------|---------|--------|-------------|
| Perception | 55% | 75% | +20% |
| Reasoning | 60% | 80% | +20% |
| Memory | 80% | 90% | +10% |
| Execution | 79% | 85% | +6% |
| **Overall** | **68.5%** | **85%** | **+16.5%** |

**Task Completion Rate**:
- Current: ~42.9% (Weaver as intelligent assistant)
- Target: ~60% (Phase 12 autonomous agent)
- Stretch Goal: 72.36% (human baseline)

**Learning Loop Metrics**:
- Success rate improvement: +20% after 5 task iterations
- Plan quality: 30% fewer execution errors
- Reflection quality: 85% actionable lessons extracted

**Performance Metrics**:
- Semantic search accuracy: >85% relevance
- Multi-path reasoning: 40% better decisions vs. single-path
- Experience retrieval: <500ms latency
- Error recovery: >80% automatic success

### Qualitative Metrics

**Autonomy Indicators**:
- [ ] Agent learns from mistakes without human intervention
- [ ] Agent adapts plans based on past experiences
- [ ] Agent explores multiple solutions before deciding
- [ ] Agent recovers from errors autonomously
- [ ] Agent improves performance over time

**Architectural Integrity**:
- [ ] Clean separation of 4 pillars
- [ ] Clear inter-pillar communication patterns
- [ ] Extensible design for future enhancements
- [ ] Production-ready code quality
- [ ] Comprehensive test coverage

---

## 🔄 Dependencies and Risks

### Critical Path Items (Blockers)

1. **Vector Embeddings (Task 1.1)** → Blocks semantic search, hybrid search
2. **Experience Indexing (Task 1.2)** → Blocks reflection engine, memory integration
3. **Reflection Engine (Task 1.5)** → Blocks autonomous learning loop
4. **Memory → Reasoning Integration (Task 1.6)** → Core autonomy requirement

**Risk**: Delays in these tasks cascade to entire phase
**Mitigation**: Prioritize critical path, parallel development where possible

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Embedding performance too slow** | Medium | High | Use smaller models, batch processing, caching |
| **Multi-path reasoning too expensive (API costs)** | Medium | Medium | Implement rate limiting, local LLM fallback |
| **Experience retrieval not relevant** | Low | High | Tune similarity thresholds, add metadata filters |
| **Reflection quality poor** | Medium | High | Iterative prompt engineering, use CoT |
| **Integration complexity** | Medium | Medium | Incremental integration, extensive testing |
| **Performance regression** | Low | High | Continuous benchmarking, optimization passes |

### External Dependencies

- **Anthropic Claude API**: Required for CoT prompting, reflection
  - **Risk**: API rate limits, costs
  - **Mitigation**: Caching, request batching, local embeddings

- **Search API (Tavily/SerpAPI)**: Required for web search tool
  - **Risk**: API costs, availability
  - **Mitigation**: Optional feature, caching, free tier

- **GPU (for VLM, optional)**: Required for local vision models
  - **Risk**: Hardware requirements
  - **Mitigation**: Cloud API fallback (GPT-4V), defer to future phase

---

## 📚 References

### Academic Research
- **Primary**: "Fundamentals of Building Autonomous LLM Agents" (arXiv:2510.09244v1)
  - Link: https://arxiv.org/html/2510.09244v1

### Weaver Internal Documentation
- Phase 12 Paper Analysis: `/weave-nn/docs/phase-12-paper-analysis.md`
- Phase 12 Weaver Inventory: `/weave-nn/docs/phase-12-weaver-inventory.md`
- Phase 12 Pillar Mapping: `/weave-nn/docs/phase-12-pillar-mapping.md`

### Key Techniques Referenced
- **Chain-of-Thought (CoT)**: Step-by-step reasoning
- **Self-Consistent CoT (CoT-SC)**: Multiple paths + voting
- **Tree-of-Thought (ToT)**: Branching exploration
- **ReAct**: Reasoning + Acting interleaved
- **Verbal Reinforcement Learning**: Actor-Evaluator-Reflection
- **RAG (Retrieval-Augmented Generation)**: Memory-enhanced generation
- **Set-of-Mark (SoM)**: Visual element annotation

---

**Phase Owner**: Development Team
**Review Frequency**: Bi-weekly
**Estimated Effort**: 8-10 weeks (320-400 hours)
**Confidence**: 75% (research-backed, but novel implementation)
**Risk Level**: Medium-High (significant architectural changes)

---

## 🎓 Learning Objectives

By completing Phase 12, the Weaver codebase will demonstrate:

1. **Academic Research → Production**: Translating research paper into working system
2. **4-Pillar Architecture**: Reference implementation of autonomous agent framework
3. **Autonomous Learning**: Self-improving system without human intervention
4. **Multi-Agent Coordination**: Expert specialization and collaboration
5. **Semantic AI**: Beyond keyword matching to true understanding

This positions Weaver as a **production-ready autonomous agent platform** for knowledge management, setting the stage for advanced features in future phases.
