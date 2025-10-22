# Weave-NN Knowledge Base

**AI-Powered Knowledge Graph for Managing AI-Generated Documentation**

---

## 🎯 What is Weave-NN?

[[concepts/weave-nn|Weave-NN]] is a SaaS platform that transforms AI-generated markdown chaos into an intelligent, searchable, collaborative [[concepts/knowledge-graph|knowledge graph]].

**Core Differentiators**:
- 🤖 **AI-First**: Built for [[concepts/ai-generated-documentation|AI-generated content]], not retrofitted
- ⏱️ **Temporal**: [[concepts/temporal-queries|Track knowledge evolution]] over time
- 📝 **Markdown Native**: Plain text, Git-friendly, future-proof
- 🕸️ **Graph-Centric**: [[concepts/wikilinks|Knowledge graph]] is the core, not an afterthought

---

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

**Phase**: 🚀 **MVP Development** (Updated 2025-10-22)
**Decisions Made**: 1.5 / 23 (6%)
**Implementation**: Core infrastructure complete

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

**Last Updated**: 2025-10-20
**Status**: Active Development
