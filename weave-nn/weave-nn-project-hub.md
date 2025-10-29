---
title: Weave-NN Knowledge Base
type: index
status: active
tags:
  - index
  - navigation
  - knowledge-graph
  - vault-home
  - type/hub
  - status/draft
priority: high
visual:
  icon: "\U0001F4C4"
  color: '#4A90E2'
  cssclasses:
    - type-index
    - status-active
    - priority-high
  graph_group: navigation
updated: '2025-10-29T04:55:03.802Z'
version: '3.0'
keywords:
  - "\U0001F3AF what is weave-nn?"
  - "\U0001F9E0 core philosophy: local loop with neural network junction"
  - related
  - "\U0001F5FA️ navigation"
  - core concepts
  - platforms considered
  - tech stack
  - current decisions
  - "\U0001F4CA project status"
  - implemented features
---

# Weave-NN Knowledge Base

**AI-Powered Knowledge Graph for Managing AI-Generated Documentation**

---

## 🎯 What is Weave-NN?

[[concepts/weave-nn|Weave-NN]] is a **local-first knowledge graph system** that transforms AI-generated markdown chaos into an intelligent, searchable, collaborative knowledge network.

### 🧠 Core Philosophy: Local Loop with Neural Network Junction

**MVP Focus**: We are **initially implementing ONLY the local loop**—a closed feedback system where:
1. AI agents generate knowledge (markdown documents)
2. Local knowledge graph captures and interconnects this knowledge
3. Agents retrieve from the graph to improve future work
4. **Weaver acts as the neural network junction point**—the proxy layer where multiple AI "neural networks" (Claude, local models, specialized agents) connect and share knowledge

This architecture follows research on **federated learning** and **knowledge graph enhanced neural networks**<sup>[1](#references)</sup>, where distributed intelligence systems benefit from a shared knowledge substrate without requiring centralized model training.

**Core Differentiators**:
- 🏠 **Local-First**: All data on your machine, Obsidian-native, Git-friendly
- 🤖 **AI-First**: Built for [[concepts/ai-generated-documentation|AI-generated content]], not retrofitted
- 🔗 **Neural Junction**: Weaver (unified MCP + workflow server) connects multiple AI systems through shared knowledge graph
- ⏱️ **Temporal**: [[concepts/temporal-queries|Track knowledge evolution]] over time
- 📝 **Markdown Native**: Plain text, future-proof, human-readable
- 🕸️ **Graph-Centric**: [[concepts/wikilinks|Knowledge graph]] is the core, not an afterthought

**Architecture**: **SINGLE SERVICE** (Weaver only) - Weaver combines MCP server, workflow orchestrator, AND file watcher into one unified TypeScript service

---









## Related

[[DIRECTORY-HUB-CREATION-SUMMARY]]
## Related

[[standards-overview-hub]]
## Related

[[services-architecture-hub]]
## Related

[[concepts-overview-hub]]
## 🗺️ Navigation

### Core Concepts
Start here to understand the fundamentals:
- [[concepts/weave-nn|Weave-NN Project]] - Vision and identity
- [[concepts/knowledge-graph|Knowledge Graphs]] - Core data structure
- [[concepts/wikilinks|Wikilinks]] - How connections work
- [[concepts/ai-generated-documentation|AI-Generated Docs]] - The problem we solve
- [[concepts/temporal-queries|Temporal Queries]] - Time-aware knowledge

### Platforms Considered
- [[platforms/obsidian|Obsidian]] - Local-first option (analyzed)
- [[platforms/notion|Notion]] - Cloud collaboration option (analyzed)
- [[platforms/custom-solution|Custom Solution]] - Our chosen path ✅

### Tech Stack

**Implemented**:
- [[technical/obsidian-api-client|ObsidianAPIClient]] - REST API integration ✅
- [[technical/property-visualizer|PropertyVisualizer]] - Metadata analytics ✅
- [[technical/rule-engine|RuleEngine]] - Agent automation framework ✅

**Under Decision**:
- [[technical/react-stack|React Stack]] vs [[technical/svelte-stack|Svelte Stack]]
- [[technical/react-flow|React Flow]] vs [[technical/svelte-flow|Svelte Flow]]
- [[technical/graphiti|Graphiti]] - Temporal knowledge graph engine
- [[technical/tiptap-editor|Tiptap]] - Markdown editor
- [[technical/supabase|Supabase]] - Backend infrastructure

### Current Decisions
See: [[meta/DECISIONS-INDEX|Decision Status Dashboard]]

**Key Decisions**:
- ✅ [[decisions/executive/project-scope|ED-1: Project Scope]] - Building as SaaS
- ❌ Frontend framework choice - **CRITICAL BLOCKER**
- ❌ Graph visualization library - **BLOCKS MVP**
- ❌ MVP feature set - **DEFINES TIMELINE**

---

## 📊 Project Status

**Phase**: 🚀 **MVP Development - Local Loop Only** (Updated 2025-10-23)
**Architecture**: Local-first with Weaver as THE ONLY SERVICE (neural network junction)
**Services**: 1 - Weaver (MCP + workflows + file watcher) - that's it!
**Stack**: Pure TypeScript/Node.js - zero Python dependencies
**Scope**: Obsidian vault + Weaver (no cloud, no web UI, no microservices)
**Implementation**: Architecture finalized, ready to build

> **One Service to Rule Them All**: Just `npm start` and everything works - MCP server, workflows, file watching, all in one unified TypeScript process.

### Implemented Features

✅ **REST API Integration** (Complete)
- ObsidianAPIClient with full CRUD operations
- Authentication (API key + session-based)
- Batch operations and caching
- Error handling and rate limiting

✅ **Property Visualization** (Complete)
- PropertyVisualizer for metadata extraction
- Dashboard creation (table, chart, timeline)
- Filtering, search, and analytics
- Export to JSON/CSV

✅ **Rule Engine Framework** (Complete)
- Priority-based rule execution
- Async/await support
- Metrics and history tracking
- Tag-based filtering

🔄 **MCP Agent Rules** (In Development)
- Framework complete, implementing rule logic
- 6 core rules defined (memory_sync, node_creation, etc.)
- Integration with Claude-Flow pending

📋 **Frontend Development** (Planned)
- Framework choice pending (React vs Svelte)
- Graph visualization library evaluation
- UI/UX design phase

### Next Milestone

**Q4 2025**: Complete MCP rule logic implementation and choose frontend framework

---

## 📚 Documentation

- [[meta/INDEX|Full Navigation Map]] - Complete site map
- [[meta/DECISIONS-INDEX|Decision Dashboard]] - Track all decisions
- [[meta/KNOWLEDGE-GRAPH-MAP|Knowledge Graph Map]] - Visual structure
- [[meta/TRANSFORMATION-SUMMARY|Transformation Summary]] - How this was built

---

## 🔍 Quick Links

**For Developers**:
- [[workflows/version-control-integration|Git Integration Workflow]]
- [[mcp/model-context-protocol|Model Context Protocol]]
- [[architecture/frontend-layer|Frontend Architecture]]

### Quick Start for Developers

**Prerequisites**:
- Node.js 18+
- Obsidian desktop app with Local REST API plugin
- API key from Local REST API plugin settings

**Installation**:
```bash
git clone <repository-url>
cd weave-nn
npm install
```

**Configuration**:
```bash
# Create .env file
echo "OBSIDIAN_API_URL=http://localhost:27123" >> .env
echo "OBSIDIAN_API_KEY=your-api-key-here" >> .env
```

**Run Examples**:
```bash
# Property visualization example
node examples/property-visualizer-example.js

# Rule engine example
node examples/rule-engine-example.js

# Run tests
npm test
```

**Key Files**:
- `/src/clients/ObsidianAPIClient.js` - REST API client
- `/src/visualization/PropertyVisualizer.js` - Property analytics
- `/src/agents/RuleEngine.js` - Agent automation
- `/examples/` - Working code examples
- `/tests/` - Comprehensive test suite

See implementation documentation:
- [[technical/obsidian-api-client|ObsidianAPIClient Guide]]
- [[technical/property-visualizer|PropertyVisualizer Guide]]
- [[technical/rule-engine|RuleEngine Guide]]

**For Product**:
- [[business/value-proposition|Value Proposition]]
- [[business/target-users|Target Users]]
- [[business/saas-pricing-model|Pricing Model]]

**For Research**:
- [[decisions/open-questions/Q-TECH-001|React Flow vs Svelte Flow Performance]]
- [[decisions/open-questions/Q-TECH-002|Graphiti Integration Strategy]]
- [[decisions/open-questions/Q-TECH-003|Markdown Editor Selection]]

---

## 🔬 Research Foundation

### Neural Network Junction Architecture

Weaver's role as a "neural network junction" is based on research in:

1. **Key-Value Memory Networks** (Miller et al., 2016, EMNLP)<sup>[1](#references)</sup>
   - Separated addressing (keys) from content (values) for efficient retrieval
   - Enables multiple "neural systems" to query shared knowledge substrate
   - Scales to thousands of nodes with sub-linear search time

2. **Federated Learning** & **Knowledge Graph Enhanced Neural Networks**<sup>[2](#references)</sup>
   - Distributed intelligence systems benefit from shared knowledge without centralized training
   - Local models + shared knowledge graph = compound learning
   - Each agent contributes to and benefits from collective knowledge

3. **Sparse Memory Finetuning** (2024, arXiv:2510.15103v1)<sup>[3](#references)</sup>
   - Selective memory updates (10k-50k slots) reduce interference
   - TF-IDF-based parameter selection identifies relevant knowledge to update
   - Local knowledge graph modifications preserve established patterns

4. **Memory-Augmented Neural Networks** (Weston et al., 2015)<sup>[4](#references)</sup>
   - Multi-hop retrieval through chained memory locations
   - Semantic similarity search via hash-based indexing
   - External memory augments AI capabilities without model retraining

### Local Loop Benefits

- **Privacy**: All data stays on your machine
- **Speed**: No network latency for knowledge retrieval
- **Ownership**: Git-trackable, future-proof markdown
- **Composability**: Weaver connects any AI system to your knowledge graph
- **Compound Learning**: Each task benefits from all previous tasks

---

## 📖 References

<a name="references"></a>

1. Miller, A., Fisch, A., Dodge, J., Karimi, A. H., Bordes, A., & Weston, J. (2016). Key-Value Memory Networks for Directly Reading Documents. *EMNLP*.

2. Memory Networks and Knowledge Graph Design: A Research Synthesis for LLM-Augmented Systems. [[research/memory-networks-research|Full Analysis]].

3. Continual Learning via Sparse Memory Finetuning (2024). *arXiv:2510.15103v1*. [[research/papers/sparse-memory-finetuning-analysis|Analysis]].

4. Weston, J., Chopra, S., & Bordes, A. (2015). Memory Networks. *ICLR*.

---

**Last Updated**: 2025-10-23 (Added local-first philosophy and neural junction architecture)
**Status**: Active MVP Development - Local Loop Only
