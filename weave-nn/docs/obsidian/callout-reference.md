---
type: documentation
title: Callout Reference - All Custom Callouts
status: active
created_date: '2025-10-29'
cssclasses:
  - type-documentation
  - status-active
tags:
  - documentation
  - callouts
  - reference
  - examples
scope: system
priority: medium
visual:
  icon: 📦
  graph_group: documentation
version: '1.0'
---

# Callout Reference - All Custom Callouts

**Complete reference with examples for all 30+ custom callout types in the Weave-NN visual styling system.**

---

## 📋 Quick Index

- [Phase & Planning](#phase-planning) (Blue) - 3 callouts
- [Implementation](#implementation) (Green) - 3 callouts
- [Gap Identification](#gap-identification) (Red) - 3 callouts
- [Success Criteria](#success-criteria) (Green Check) - 3 callouts
- [Architecture](#architecture) (Orange) - 3 callouts
- [Research](#research) (Purple) - 3 callouts
- [Testing](#testing) (Pink) - 3 callouts
- [Code Examples](#code-examples) (Teal) - 3 callouts
- [Workflow](#workflow) (Indigo) - 3 callouts
- [Documentation](#documentation) (Cyan) - 3 callouts
- [Status](#status) (Mixed) - 4 callouts
- [Special](#special) (Mixed) - 5 callouts

**Total**: 38 unique callout types

---

## 🎯 Phase & Planning

Blue-themed callouts for phase documentation and planning activities.

### [!phase]

**Color**: Blue (#3B82F6)
**Icon**: lucide-target
**Use**: General phase markers and milestones

**Example:**
```markdown
> [!phase] Phase 12: Four Pillar Autonomous Agents
> This phase implements the four foundational pillars of autonomous agent capabilities:
> - Perception (context awareness)
> - Learning Loop (continuous improvement)
> - Cultivation (knowledge synthesis)
> - Service Management (deployment & orchestration)
```

**Rendered:**
> [!phase] Phase 12: Four Pillar Autonomous Agents
> This phase implements the four foundational pillars of autonomous agent capabilities

---

### [!phase-planning]

**Color**: Light Blue (#60A5FA)
**Icon**: lucide-clipboard
**Use**: Planning activities within a phase

**Example:**
```markdown
> [!phase-planning] Sprint Planning - Week 1
> **Goals:**
> - Define user stories for perception module
> - Estimate effort for learning loop integration
> - Identify dependencies on existing systems
>
> **Timeline**: Nov 1-5, 2025
```

---

### [!phase-complete]

**Color**: Dark Blue (#2563EB)
**Icon**: lucide-check-circle
**Use**: Mark completed phases

**Example:**
```markdown
> [!phase-complete] Phase 11: CLI Service Management - COMPLETE
> **Completion Date**: October 28, 2025
> **Achievements**:
> - ✅ CLI scaffolding implemented
> - ✅ Service orchestration working
> - ✅ All tests passing (97% coverage)
>
> **Next**: Proceed to Phase 12
```

---

## ⚙️ Implementation

Green-themed callouts for implementation details.

### [!implementation]

**Color**: Green (#10B981)
**Icon**: lucide-settings
**Use**: Implementation notes and technical details

**Example:**
```markdown
> [!implementation] Perception Module Implementation
> The perception module uses a hybrid approach:
>
> ```typescript
> class PerceptionEngine {
>   async analyzeContext(files: FileList): Promise<ContextMap> {
>     const ast = await this.parseFiles(files);
>     const dependencies = this.buildDependencyGraph(ast);
>     return this.synthesizeContext(dependencies);
>   }
> }
> ```
>
> **Key Design Decisions**:
> - AST parsing for deep code understanding
> - Incremental updates for performance
> - Cached dependency graphs
```

---

### [!code]

**Color**: Green (#10B981)
**Icon**: lucide-code
**Use**: Code snippets and examples

**Example:**
```markdown
> [!code] Learning Loop API Usage
> ```typescript
> import { LearningLoop } from '@weave-nn/learning-loop';
>
> const loop = new LearningLoop({
>   feedbackStore: './feedback',
>   updateInterval: 3600 // 1 hour
> });
>
> await loop.learnFromFeedback();
> ```
```

---

### [!feature]

**Color**: Bright Green (#22C55E)
**Icon**: lucide-sparkles
**Use**: New feature announcements

**Example:**
```markdown
> [!feature] Auto-Context Detection
> **New in v1.2.0**: Weaver now automatically detects when you're working on related files and suggests relevant context from the knowledge graph.
>
> **Benefits**:
> - 🚀 40% faster context loading
> - 🎯 More accurate suggestions
> - 💾 Reduced token usage
```

---

## 🚨 Gap Identification

Red-themed callouts for identifying gaps, blockers, and missing components.

### [!gap]

**Color**: Red (#EF4444)
**Icon**: lucide-alert-triangle (pulsing animation)
**Use**: Identify gaps in functionality or documentation

**Example:**
```markdown
> [!gap] Missing Test Coverage
> **Gap Identified**: Integration tests for the perception module are incomplete.
>
> **Current Coverage**: 45% (below 80% threshold)
> **Missing Areas**:
> - Multi-file context analysis
> - Large project handling (>1000 files)
> - Edge cases in AST parsing
>
> **Impact**: High - blocks Phase 12 completion
> **Priority**: Critical
```

---

### [!blocker]

**Color**: Dark Red (#DC2626)
**Icon**: lucide-octagon (pulsing animation)
**Use**: Critical blockers preventing progress

**Example:**
```markdown
> [!blocker] API Rate Limit Exceeded
> **BLOCKER**: OpenAI API rate limit reached during learning loop training.
>
> **Impact**: Cannot complete Phase 12 training without resolution
> **Timeline**: Blocking since Oct 28, 2025
>
> **Proposed Solutions**:
> 1. Implement exponential backoff
> 2. Request rate limit increase from OpenAI
> 3. Add local model fallback
>
> **Action Required**: Immediate
```

---

### [!missing]

**Color**: Light Red (#F87171)
**Icon**: lucide-help-circle
**Use**: Missing components or information

**Example:**
```markdown
> [!missing] Documentation Needed
> **Missing Documentation**:
> - API reference for `CultivationEngine`
> - User guide for service management CLI
> - Migration guide from Phase 11 to Phase 12
>
> **Assigned To**: Documentation Team
> **Due Date**: Nov 15, 2025
```

---

## ✅ Success Criteria

Green check-themed callouts for success metrics and acceptance criteria.

### [!success]

**Color**: Green (#10B981)
**Icon**: lucide-check-circle-2
**Use**: Mark successful completion

**Example:**
```markdown
> [!success] Perception Module Tests Passing
> **Success**: All perception module tests are now passing!
>
> **Metrics**:
> - ✅ 247/247 unit tests passing
> - ✅ 89/89 integration tests passing
> - ✅ 97.3% code coverage
> - ✅ 0 critical bugs
> - ✅ Performance within SLA (<200ms avg)
>
> **Achievement Unlocked**: Ready for production deployment
```

---

### [!criteria]

**Color**: Bright Green (#22C55E)
**Icon**: lucide-list-checks
**Use**: Define acceptance criteria

**Example:**
```markdown
> [!criteria] Phase 12 Acceptance Criteria
> **Required for Phase Completion**:
>
> - [ ] Perception module fully implemented
> - [x] Learning loop integrated with AgentDB
> - [x] Cultivation engine synthesizing knowledge
> - [ ] Service management CLI functional
> - [ ] All tests passing (>90% coverage)
> - [ ] Documentation complete
> - [ ] Performance benchmarks met
>
> **Current Progress**: 43% (3/7 completed)
```

---

### [!acceptance]

**Color**: Dark Green (#16A34A)
**Icon**: lucide-badge-check
**Use**: Acceptance test results

**Example:**
```markdown
> [!acceptance] User Acceptance Testing - Learning Loop
> **Test Date**: October 29, 2025
> **Tester**: Product Team
>
> **Results**:
> - ✅ Feedback collection working correctly
> - ✅ Pattern recognition accurate (95.2%)
> - ✅ Auto-improvement observed after 10 iterations
> - ⚠️ UI could be more intuitive (minor issue)
>
> **Verdict**: **ACCEPTED** with minor UX improvements
```

---

## 🏗️ Architecture

Orange-themed callouts for architectural decisions and design patterns.

### [!architecture]

**Color**: Orange (#F59E0B)
**Icon**: lucide-building
**Use**: Architectural decisions and patterns

**Example:**
```markdown
> [!architecture] Microservices vs Monolith for Phase 12
> **Decision**: Use modular monolith architecture
>
> **Rationale**:
> - Simpler deployment (single process)
> - Easier debugging and testing
> - Can extract to microservices later if needed
> - Meets current scale requirements (<1000 users)
>
> **Trade-offs**:
> - ❌ Less scalable than microservices
> - ✅ Faster development time
> - ✅ Lower operational complexity
>
> **Decision Date**: October 15, 2025
> **Status**: Approved
```

---

### [!decision]

**Color**: Light Orange (#FB923C)
**Icon**: lucide-git-branch
**Use**: Design decisions and trade-offs

**Example:**
```markdown
> [!decision] Vector Database Selection
> **Decision**: Use AgentDB instead of Pinecone
>
> **Options Considered**:
> 1. **Pinecone** - Cloud, managed, expensive
> 2. **Weaviate** - Open source, complex setup
> 3. **AgentDB** - Purpose-built, local-first ✅
>
> **Chosen**: AgentDB
> **Reason**: Local-first philosophy, built for agents, 150x faster for our use case
```

---

### [!design]

**Color**: Dark Orange (#F97316)
**Icon**: lucide-pen-tool
**Use**: Design patterns and implementation approaches

**Example:**
```markdown
> [!design] Observer Pattern for Learning Loop
> **Pattern**: Observer Pattern for feedback collection
>
> **Structure**:
> ```
> FeedbackSubject (Observable)
>     ↓
> ├─ PatternRecognizer (Observer)
> ├─ MemoryUpdater (Observer)
> └─ ModelRetrainer (Observer)
> ```
>
> **Benefits**:
> - Decoupled components
> - Easy to add new observers
> - Flexible feedback processing
```

---

## 🔬 Research

Purple-themed callouts for research findings and analysis.

### [!research]

**Color**: Purple (#8B5CF6)
**Icon**: lucide-microscope
**Use**: Research findings and insights

**Example:**
```markdown
> [!research] Memory Networks for Agent Context
> **Research Summary**: Key-Value Memory Networks (Miller et al., 2016)
>
> **Key Findings**:
> - Separated addressing (keys) from content (values)
> - Enables sub-linear search time for thousands of nodes
> - Multiple "read hops" for complex reasoning
>
> **Application to Weave-NN**:
> - Use for agent context retrieval
> - Implement multi-hop reasoning for complex queries
> - Scale to 10,000+ knowledge nodes
>
> **Paper**: [EMNLP 2016](https://arxiv.org/...)
```

---

### [!analysis]

**Color**: Light Purple (#A78BFA)
**Icon**: lucide-bar-chart
**Use**: Data analysis and metrics

**Example:**
```markdown
> [!analysis] Learning Loop Performance Analysis
> **Analysis Period**: Oct 1-28, 2025
>
> **Metrics**:
> - Average improvement per iteration: 12.3%
> - Convergence time: 45 minutes (target: <60 min) ✅
> - Memory usage: 2.1 GB (stable)
> - Token consumption: -32% vs baseline
>
> **Conclusion**: Learning loop is performing above expectations
```

---

### [!hypothesis]

**Color**: Dark Purple (#7C3AED)
**Icon**: lucide-lightbulb
**Use**: Working hypotheses and theories

**Example:**
```markdown
> [!hypothesis] Sparse Memory Updates Reduce Interference
> **Hypothesis**: Updating only 10k-50k memory slots per learning iteration reduces catastrophic forgetting.
>
> **Theoretical Basis**:
> - Sparse Memory Finetuning (2024, arXiv:2510.15103v1)
> - Selective parameter updates preserve established patterns
>
> **Test Plan**:
> 1. Implement TF-IDF-based slot selection
> 2. Compare full vs sparse updates
> 3. Measure retention of prior knowledge
>
> **Status**: Testing in progress
```

---

## 🧪 Testing

Pink-themed callouts for test scenarios and validation.

### [!test]

**Color**: Pink (#EC4899)
**Icon**: lucide-flask
**Use**: Test cases and scenarios

**Example:**
```markdown
> [!test] Integration Test: Perception → Learning Loop
> **Test**: Verify perception module feeds context to learning loop
>
> **Setup**:
> ```typescript
> const perception = new PerceptionEngine();
> const learningLoop = new LearningLoop();
> const context = await perception.analyzeContext(testFiles);
> ```
>
> **Expected**: Learning loop receives structured context
> **Actual**: ✅ Context received correctly
> **Status**: PASS
```

---

### [!scenario]

**Color**: Light Pink (#F472B6)
**Icon**: lucide-play-circle
**Use**: End-to-end test scenarios

**Example:**
```markdown
> [!scenario] E2E: Developer Workflow with Four Pillars
> **Scenario**: Developer uses all four pillars in a coding session
>
> **Steps**:
> 1. 👁️ **Perception**: Developer opens project → Weaver analyzes context
> 2. 📚 **Cultivation**: Weaver suggests relevant docs from knowledge graph
> 3. 🎓 **Learning**: Developer provides feedback → System improves suggestions
> 4. 🚀 **Service**: Background services maintain vault consistency
>
> **Expected Outcome**: Seamless workflow with intelligent assistance
> **Test Status**: ✅ PASS
```

---

### [!validation]

**Color**: Dark Pink (#DB2777)
**Icon**: lucide-shield-check
**Use**: Validation results and compliance

**Example:**
```markdown
> [!validation] Security Validation Results
> **Validation Type**: Security Audit
> **Audit Date**: October 28, 2025
>
> **Findings**:
> - ✅ No SQL injection vulnerabilities
> - ✅ Proper input sanitization
> - ✅ Secrets not in code
> - ⚠️ Rate limiting could be stronger (medium severity)
>
> **Compliance**: OWASP Top 10 - PASS
> **Action Items**: Implement enhanced rate limiting
```

---

## 💻 Code Examples

Teal-themed callouts for code snippets and demonstrations.

### [!example]

**Color**: Teal (#14B8A6)
**Icon**: lucide-code-2
**Use**: Usage examples

**Example:**
```markdown
> [!example] Using the Perception API
> **Example**: Analyze project context
>
> ```typescript
> import { Perception } from '@weave-nn/perception';
>
> const perception = new Perception({
>   rootPath: './my-project',
>   includeTests: true
> });
>
> const context = await perception.analyze();
> console.log(context.summary); // "Express.js REST API with PostgreSQL"
> console.log(context.dependencies); // ["express", "pg", "jest"]
> ```
>
> **Output**: Structured context object ready for AI consumption
```

---

### [!snippet]

**Color**: Light Teal (#2DD4BF)
**Icon**: lucide-file-code
**Use**: Reusable code fragments

**Example:**
```markdown
> [!snippet] Feedback Collection Helper
> **Snippet**: Collect user feedback for learning loop
>
> ```typescript
> async function collectFeedback(
>   taskId: string,
>   rating: 1 | 2 | 3 | 4 | 5,
>   comment?: string
> ) {
>   await learningLoop.recordFeedback({
>     task: taskId,
>     rating,
>     comment,
>     timestamp: Date.now()
>   });
> }
> ```
>
> **Usage**: Call after each AI-assisted task completes
```

---

### [!demo]

**Color**: Dark Teal (#0D9488)
**Icon**: lucide-presentation
**Use**: Live demonstrations and walkthroughs

**Example:**
```markdown
> [!demo] Live Demo: Knowledge Graph Visualization
> **Demo**: Real-time graph updates as you code
>
> **Steps**:
> 1. Open Obsidian with Weave-NN vault
> 2. Run `weaver perceive` in your project
> 3. Watch graph auto-update with new connections
> 4. Click nodes to see context
>
> **Video**: [demo-video-link]
> **Try it**: `npm run demo`
```

---

## 🔄 Workflow

Indigo-themed callouts for workflows and processes.

### [!workflow]

**Color**: Indigo (#6366F1)
**Icon**: lucide-workflow
**Use**: Workflow definitions

**Example:**
```markdown
> [!workflow] Git Integration Workflow
> **Workflow**: Automatic knowledge graph updates on git commits
>
> ```mermaid
> graph LR
>   A[Git Commit] --> B[Weaver Hook]
>   B --> C[Parse Changed Files]
>   C --> D[Update Knowledge Graph]
>   D --> E[Sync Obsidian]
> ```
>
> **Trigger**: Post-commit hook
> **Duration**: ~2 seconds for typical commit
```

---

### [!process]

**Color**: Light Indigo (#818CF8)
**Icon**: lucide-list-ordered
**Use**: Step-by-step processes

**Example:**
```markdown
> [!process] Phase 12 Implementation Process
> **Process**: Four Pillar Implementation
>
> 1. **Week 1-2**: Perception Module
>    - AST parsing
>    - Dependency analysis
>    - Context synthesis
>
> 2. **Week 3-4**: Learning Loop
>    - Feedback collection
>    - Pattern recognition
>    - Model updates
>
> 3. **Week 5-6**: Cultivation Engine
>    - Knowledge synthesis
>    - Document generation
>    - Graph updates
>
> 4. **Week 7-8**: Service Management
>    - CLI development
>    - Process orchestration
>    - Deployment automation
```

---

### [!step]

**Color**: Dark Indigo (#4F46E5)
**Icon**: lucide-footprints
**Use**: Individual action steps

**Example:**
```markdown
> [!step] Next Step: Integrate AgentDB
> **Next Action**: Connect learning loop to AgentDB vector store
>
> **Prerequisites**:
> - ✅ AgentDB installed
> - ✅ Learning loop implemented
> - ⏳ Schema designed (in progress)
>
> **Tasks**:
> 1. Create vector embeddings from feedback
> 2. Store in AgentDB collections
> 3. Implement similarity search
> 4. Test retrieval performance
>
> **Estimated Time**: 6 hours
> **Assigned**: Engineering Team
```

---

## 📚 Documentation

Cyan-themed callouts for documentation and references.

### [!docs]

**Color**: Cyan (#06B6D4)
**Icon**: lucide-book-open
**Use**: Documentation references

**Example:**
```markdown
> [!docs] Perception Module Documentation
> **Documentation**: Complete API reference
>
> **Sections**:
> - [Installation](./install.md)
> - [Configuration](./config.md)
> - [API Reference](./api.md)
> - [Examples](./examples.md)
> - [Troubleshooting](./troubleshooting.md)
>
> **Status**: Complete and reviewed
> **Last Updated**: October 29, 2025
```

---

### [!guide]

**Color**: Light Cyan (#22D3EE)
**Icon**: lucide-map
**Use**: User guides and tutorials

**Example:**
```markdown
> [!guide] Getting Started with Four Pillars
> **Guide**: Quick start guide for new users
>
> **Prerequisites**:
> - Node.js 18+
> - Obsidian installed
> - Basic TypeScript knowledge
>
> **Steps**:
> 1. Install Weaver: `npm install -g @weave-nn/weaver`
> 2. Initialize vault: `weaver init`
> 3. Configure pillars: `weaver configure`
> 4. Start services: `weaver start`
>
> **Estimated Time**: 15 minutes
> **Difficulty**: Beginner
```

---

### [!reference]

**Color**: Dark Cyan (#0891B2)
**Icon**: lucide-bookmark
**Use**: Technical references

**Example:**
```markdown
> [!reference] CLI Command Reference
> **Reference**: Complete CLI command documentation
>
> **Commands**:
> - `weaver perceive` - Analyze project context
> - `weaver learn` - Trigger learning loop
> - `weaver cultivate` - Generate knowledge synthesis
> - `weaver service` - Manage background services
>
> **Global Options**:
> - `--config <path>` - Custom config file
> - `--verbose` - Detailed logging
> - `--dry-run` - Preview without executing
>
> [Full Documentation →](./cli-reference.md)
```

---

## 📊 Status Tracking

Mixed-color callouts for tracking progress and status.

### [!todo]

**Color**: Yellow (#FBBF24)
**Icon**: lucide-circle
**Use**: Todo lists and pending tasks

**Example:**
```markdown
> [!todo] Phase 12 Remaining Tasks
> **Outstanding Tasks**:
>
> - [ ] Complete perception module tests
> - [ ] Optimize learning loop performance
> - [ ] Document cultivation engine API
> - [x] Implement service management CLI
> - [ ] Write user migration guide
> - [ ] Deploy to staging environment
>
> **Progress**: 17% (1/6 completed)
> **Due Date**: November 15, 2025
```

---

### [!in-progress]

**Color**: Blue (#3B82F6)
**Icon**: lucide-loader
**Use**: Currently active work

**Example:**
```markdown
> [!in-progress] Implementing Learning Loop Optimization
> **Status**: In Progress (65% complete)
>
> **Current Work**:
> - ✅ Implemented sparse memory updates
> - ✅ Added TF-IDF slot selection
> - 🚧 Testing retention metrics (in progress)
> - ⏳ Performance benchmarking (pending)
>
> **Blocked By**: None
> **ETA**: November 2, 2025
```

---

### [!complete]

**Color**: Green (#10B981)
**Icon**: lucide-check-circle
**Use**: Completed items

**Example:**
```markdown
> [!complete] Service Management CLI - COMPLETE
> **Status**: ✅ COMPLETED
> **Completion Date**: October 28, 2025
>
> **Deliverables**:
> - ✅ CLI scaffolding with Commander.js
> - ✅ Service start/stop/restart commands
> - ✅ Health check monitoring
> - ✅ Log management
> - ✅ 97% test coverage
>
> **Next Phase**: Integration with perception module
```

---

### [!deprecated]

**Color**: Gray (#6B7280)
**Icon**: lucide-archive
**Use**: Deprecated features or approaches

**Example:**
```markdown
> [!deprecated] Python-Based Chunking - DEPRECATED
> **Status**: ⚠️ DEPRECATED as of v1.0.0
> **Reason**: Replaced by TypeScript-native chunking
>
> **Migration Path**:
> - Old: `python chunker.py`
> - New: `weaver chunk`
>
> **Removal Date**: December 1, 2025
> **Migration Guide**: [link-to-guide]
```

---

## ⚡ Special Callouts

Specialized callouts for specific contexts.

### [!sparc]

**Color**: Purple (#8B5CF6)
**Icon**: lucide-zap
**Use**: SPARC methodology steps

**Example:**
```markdown
> [!sparc] SPARC - Specification Phase
> **Phase**: Specification
> **Methodology**: SPARC (Spec, Pseudocode, Architecture, Refinement, Completion)
>
> **Deliverable**: Complete requirements specification for Phase 12
>
> **Specification Elements**:
> 1. User stories for each pillar
> 2. Technical requirements
> 3. Success criteria
> 4. Non-functional requirements
> 5. Dependencies and constraints
>
> **Status**: Complete and approved
```

---

### [!mcp]

**Color**: Indigo (#6366F1)
**Icon**: lucide-network
**Use**: Model Context Protocol details

**Example:**
```markdown
> [!mcp] MCP Server Configuration
> **Component**: Model Context Protocol Server
>
> **Configuration**:
> ```json
> {
>   "mcpServers": {
>     "weaver": {
>       "command": "node",
>       "args": ["./dist/mcp-server.js"],
>       "env": {
>         "VAULT_PATH": "/path/to/vault"
>       }
>     }
>   }
> }
> ```
>
> **Capabilities**:
> - Knowledge graph queries
> - Document CRUD operations
> - Context analysis
> - Feedback collection
```

---

### [!agent]

**Color**: Pink (#EC4899)
**Icon**: lucide-bot
**Use**: Agent-specific behavior and configuration

**Example:**
```markdown
> [!agent] Coder Agent Configuration
> **Agent Type**: Coder
> **Specialization**: Implementation and refactoring
>
> **Capabilities**:
> - Code generation (TypeScript, Python, Rust)
> - Refactoring and optimization
> - Test creation (Jest, Vitest)
> - Documentation generation
>
> **Memory Access**:
> - Read: `swarm/shared/*`
> - Write: `swarm/coder/*`
>
> **Coordination**:
> - Reports to: Planner Agent
> - Coordinates with: Tester Agent, Reviewer Agent
```

---

### [!swarm]

**Color**: Light Purple (#A78BFA)
**Icon**: lucide-git-merge
**Use**: Swarm coordination and multi-agent workflows

**Example:**
```markdown
> [!swarm] Mesh Topology Swarm for Phase 12
> **Topology**: Mesh (peer-to-peer coordination)
> **Agents**: 6 specialized agents
>
> **Agent Composition**:
> 1. **Researcher** - Analyze requirements
> 2. **Architect** - Design system architecture
> 3. **Coder** - Implement features
> 4. **Tester** - Create test suites
> 5. **Reviewer** - Code review
> 6. **Documenter** - Write documentation
>
> **Coordination Protocol**:
> - Memory namespace: `swarm/phase12`
> - Update frequency: Real-time
> - Conflict resolution: Consensus-based
```

---

### [!neural]

**Color**: Dark Purple (#7C3AED)
**Icon**: lucide-brain
**Use**: Neural network and ML implementation details

**Example:**
```markdown
> [!neural] Pattern Recognition Neural Network
> **Model**: Transformer-based pattern recognizer
> **Framework**: AgentDB + Claude-Flow
>
> **Architecture**:
> ```
> Input Layer (768 dims)
>     ↓
> Transformer Encoder (6 layers)
>     ↓
> Pattern Classification Head
>     ↓
> Confidence Scores
> ```
>
> **Training Data**: 10,000 feedback samples
> **Accuracy**: 95.2% on validation set
> **Latency**: <50ms per inference
```

---

## 🎨 Callout Combinations

### Nested Callouts

Callouts can be nested for hierarchical information:

```markdown
> [!phase] Phase 12: Four Pillar Implementation
> High-level phase overview
>
> > [!implementation] Perception Module
> > Nested implementation details
> >
> > > [!code] Example Code
> > > Deeply nested code example
```

---

### Multiple Callouts in Sequence

Use different callouts to structure complex information:

```markdown
> [!architecture] System Design
> High-level architecture overview

> [!implementation] Implementation Approach
> Technical implementation details

> [!test] Test Strategy
> Testing approach and scenarios

> [!success] Success Metrics
> How we'll measure success
```

---

## 🔧 Customization

### Create Your Own Callout

In `.obsidian/snippets/callouts.css`:

```css
.callout[data-callout="my-callout"] {
  --callout-color: 100, 200, 150; /* RGB */
  --callout-icon: lucide-star;
}
```

Usage:
```markdown
> [!my-callout] Custom Callout Title
> Custom callout content
```

---

## 📊 Callout Statistics

**Total Callouts**: 38
**Color Themes**: 9 distinct color palettes
**Categories**: 11 functional categories
**Icons**: 38 unique Lucide icons
**Special Features**: Nested support, animations, responsive design

---

## 📚 Related Documentation

- [[styling-guide.md|Styling Guide]] - Complete visual guide
- [[css-reference.md|CSS Reference]] - Technical CSS documentation
- [[icon-reference.md|Icon Reference]] - Icon usage guide
- [[theme-customization.md|Theme Customization]] - Advanced customization

---

**Last Updated**: 2025-10-29
**Version**: 1.0
**Callout Count**: 38 types
**Categories**: 11
