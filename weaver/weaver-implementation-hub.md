# Weaver

**Intelligent Vault Initialization and Workflow Automation for Obsidian**

Weaver is a powerful TypeScript application that transforms your Obsidian vault into an intelligent knowledge management system with AI-powered features, automated workflows, and seamless Claude Desktop integration via MCP (Model Context Protocol).

**Version**: 2.0.0 (Phase 13 Complete)
**Status**: ✅ Production Ready - Autonomous Agent Platform

---

## ✨ Key Features

### Phase 13: Enhanced Agent Intelligence (NEW) ✅

- 🧠 **Four-Pillar Learning Loop**: Complete autonomous learning system
  - **Perception**: Multi-source data gathering (files, web, APIs)
  - **Reasoning**: Autonomous insight extraction and pattern analysis
  - **Memory**: Chunked embeddings with semantic retrieval
  - **Execution**: Context-aware action generation
- 🔪 **Memorographic Chunking**: 4 content-aware strategies inspired by human memory
  - Event-based (episodic memory)
  - Semantic boundary (semantic memory)
  - Preference signal (emotional memory)
  - Step-based (procedural memory)
- 🔍 **Vector Embeddings**: Dual-provider support (OpenAI + local Xenova)
  - OpenAI: text-embedding-3-small (1536d), text-embedding-3-large (3072d)
  - Xenova: all-MiniLM-L6-v2 (384d), all-mpnet-base-v2 (768d)
  - In-memory caching (LRU eviction)
  - Batch processing (3-5x faster)
- 🔎 **Hybrid Search**: Semantic + keyword search with configurable weights
  - Cosine similarity for semantic matching
  - FTS5 full-text search for keyword matching
  - Configurable relevance thresholds
- 🌐 **Perception System**: Multi-source information gathering
  - File search with glob patterns
  - Web search via Brave Search API
  - Parallel source fetching
  - Relevance scoring
- 🔄 **Feedback & Reflection**: Autonomous self-improvement
  - User feedback collection
  - Autonomous reflection on performance
  - Behavior adaptation from feedback
  - Learning signal extraction
- 📊 **Performance**: <100ms chunking, ~10ms vector search, ~700ms complete learning loop

### Core Features (Phase 1-12)

- 🏗️ **Vault Initialization**: Generate structured Obsidian vaults from project directories with automatic MOC (Map of Content) creation
- ⚡ **Shadow Cache**: Lightning-fast SQLite-backed vault indexing for sub-100ms queries
- 🔄 **Workflow Engine**: Event-driven note automation with customizable workflows
- 🤖 **AI Agents**: Claude-powered auto-tagging, auto-linking, and content analysis
- 📦 **Git Auto-Commit**: Automatic version control with AI-generated commit messages
- 🔌 **MCP Integration**: Full Claude Desktop integration with 12+ specialized tools
- 🔍 **Full-Text Search**: Advanced search across tags, links, and content
- 📊 **Metadata Extraction**: Automatic YAML frontmatter generation and parsing

---

## 🚀 Quick Start

```bash
# Install dependencies
cd /path/to/weaver
npm install

# Configure environment
cp .env.example .env
# Edit .env with your vault path and API keys

# Build and run
npm run build
npm start
```

**See [Quickstart Guide](docs/user-guide/QUICKSTART.md) for detailed setup instructions.**

---

## 📋 Prerequisites

- **Node.js**: v20 or later
- **Obsidian**: Latest version
- **Claude API Key**: For AI-powered features (optional)
- **Git**: For auto-commit features (optional)

---

## 🎯 Use Cases

### 1. Initialize a Structured Vault

```bash
npm run init-vault
```

Automatically creates:
- Hierarchical folder structure
- MOC (Map of Content) files
- Cross-linked wikilink references
- YAML frontmatter templates
- Tag taxonomy

### 2. AI-Powered Note Management

- **Auto-Tagging**: Claude suggests relevant tags based on content
- **Auto-Linking**: Automatically creates wikilinks to related notes
- **Daily Notes**: Generate daily note templates with context
- **Content Analysis**: Extract key concepts and relationships

### 3. Fast Vault Queries (MCP Tools)

Access your vault from Claude Desktop with instant queries:

```
"List all notes tagged #ai from the last week"
"Find notes that link to Machine Learning"
"Show me my daily notes from October"
"Search for notes containing 'neural networks'"
```

### 4. Automated Workflows

Built-in workflows:
- **File Change Logger**: Track all vault modifications
- **Markdown Analyzer**: Extract metadata on save
- **Concept Tracker**: Monitor concept relationships
- **Orphan Cleanup**: Detect and fix broken links

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Server Layer                     │
│  (Model Context Protocol - Claude Desktop Integration)  │
└──────────────────┬──────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│                 Core Application Layer                  │
│  ┌──────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │ Vault Init   │  │  Workflow  │  │  Shadow Cache  │  │
│  │   System     │  │   Engine   │  │    (SQLite)    │  │
│  └──────────────┘  └────────────┘  └────────────────┘  │
│  ┌──────────────┐  ┌────────────┐  ┌────────────────┐  │
│  │  AI Agents   │  │    Git     │  │   File Watcher │  │
│  │  (Claude)    │  │ Auto-Commit│  │    (chokidar)  │  │
│  └──────────────┘  └────────────┘  └────────────────┘  │
└─────────────────────────────────────────────────────────┘
                   │
┌──────────────────┴──────────────────────────────────────┐
│              Obsidian Vault (Filesystem)                │
└─────────────────────────────────────────────────────────┘
```

**See [Architecture Guide](docs/developer/ARCHITECTURE.md) for detailed system design.**

---

## 🔌 MCP Tools

Weaver provides 12+ MCP tools for Claude Desktop:

### Shadow Cache Tools
- `query_files` - Search files by tags, content, or metadata
- `get_file` - Retrieve file metadata and frontmatter
- `get_file_content` - Read full file content
- `search_tags` - Find files by tag
- `search_links` - Query wikilink relationships
- `get_stats` - Vault statistics and insights

### Workflow Tools
- `trigger_workflow` - Execute workflow manually
- `list_workflows` - Get available workflows
- `get_workflow_status` - Check execution status
- `get_workflow_history` - View past executions

**See [MCP Tools Reference](docs/mcp-tools-reference.md) for complete API documentation.**

---

## 📚 Documentation

### User Guides
- [Quickstart Guide](docs/user-guide/QUICKSTART.md) - Get started in 5 minutes
- [Configuration Reference](docs/user-guide/CONFIGURATION.md) - Environment variables and settings
- [Troubleshooting](docs/user-guide/TROUBLESHOOTING.md) - Common issues and solutions
- **[Semantic Search Guide](docs/user-guide/semantic-search-guide.md)** - Using embeddings for intelligent search ✨
- **[Autonomous Learning Guide](docs/user-guide/autonomous-learning-guide.md)** - Four-pillar learning system ✨

### API Documentation (Phase 13)
- **[Embeddings API](docs/api/embeddings-api.md)** - Vector embeddings and semantic search
- **[Chunking API](docs/api/chunking-api.md)** - Memorographic chunking strategies
- **[Learning Loop API](docs/api/learning-loop-api.md)** - Four-pillar autonomous learning
- **[Perception API](docs/api/perception-api.md)** - Multi-source data gathering

### Developer Guides
- [Architecture Overview](docs/developer/ARCHITECTURE.md) - System design and components
- [Testing Guide](docs/developer/TESTING.md) - Run and write tests
- **[Phase 13 Architecture](docs/developer/phase-13-architecture.md)** - Enhanced intelligence architecture ✨

### Examples (Phase 13)
- **[Semantic Search Example](examples/phase-13/semantic-search-example.ts)** - Complete search workflow
- **[Learning Loop Example](examples/phase-13/learning-loop-example.ts)** - Four-pillar learning

### Additional Documentation
- [MCP Server Setup](docs/claude-desktop-setup.md) - Claude Desktop integration
- [MCP Usage Guide](docs/mcp-usage-guide.md) - Using MCP tools
- [Shadow Cache Tools](docs/shadow-cache-tools-usage.md) - Shadow cache API
- **[Phase 13 Master Document](docs/PHASE-13-MASTER-DOCUMENT.md)** - Complete Phase 13 overview ✨

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- tests/integration/

# Watch mode
npm run test:watch
```

**Test Coverage**: 85%+

---

## 🛠️ Development

### Project Structure

```
weaver/
├── src/                      # Source code
│   ├── agents/              # AI agent rules
│   ├── config/              # Configuration
│   ├── git/                 # Git auto-commit
│   ├── mcp-server/          # MCP server implementation
│   ├── shadow-cache/        # SQLite indexing
│   ├── vault-init/          # Vault initialization
│   ├── workflow-engine/     # Workflow system
│   └── index.ts            # Main entry point
├── tests/                   # Test suites
├── docs/                    # Documentation
└── examples/               # Example configurations
```

### Build Commands

```bash
npm run build        # Build TypeScript
npm run dev          # Development mode with watch
npm run typecheck    # Type checking only
npm run lint         # ESLint
```

### Adding Custom Workflows

```typescript
// src/workflows/my-workflow.ts
import { Workflow } from '../workflow-engine';

export const myWorkflow: Workflow = {
  id: 'my-custom-workflow',
  name: 'My Custom Workflow',
  triggers: ['file:change'],
  enabled: true,
  async execute(context) {
    const { filePath, shadowCache } = context;
    // Your custom logic here
    await shadowCache.updateFile(filePath);
  }
};
```

### Adding Custom Agent Rules

```typescript
// src/agents/rules/my-rule.ts
import { AgentRule } from '../types';

export const myRule: AgentRule = {
  shouldTrigger(content: string): boolean {
    return content.includes('trigger-phrase');
  },

  async execute(content: string) {
    // Your AI-powered logic here
    return { success: true, data: {...} };
  }
};
```

---

## 🔒 Security

- API keys stored in `.env` (never committed)
- Git hooks prevent committing secrets
- Sandboxed workflow execution
- Input validation on all MCP tools

---

## 🤝 Contributing

Contributions welcome! Please see our development guides:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your changes
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

---

## 📦 Dependencies

**Core:**
- `typescript` - Type safety
- `chokidar` - File watching
- `better-sqlite3` - Shadow cache
- `@anthropic-ai/sdk` - Claude integration
- `@modelcontextprotocol/sdk` - MCP protocol

**See [package.json](package.json) for complete dependency list.**

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details

---

## 🙏 Acknowledgments

- [Obsidian](https://obsidian.md) - The knowledge base application
- [Anthropic](https://anthropic.com) - Claude AI API
- [Model Context Protocol](https://modelcontextprotocol.io) - MCP specification

---

## 📞 Support

- **Documentation**: See [docs/](docs/) directory
- **Issues**: Report bugs via GitHub issues
- **Examples**: See [examples/](examples/) directory

---

## 🗺️ Roadmap

- ✅ Phase 5: MCP Server Integration
- ✅ Phase 6: Vault Initialization System
- ✅ Phase 8: Git Automation
- ✅ Phase 9: Testing & Documentation
- ✅ Phase 10: MVP Readiness & Launch
- ✅ Phase 12: Autonomous Learning Loop (4-Pillar Framework)
- ✅ Phase 13: Advanced Intelligence & Production Readiness
- 🔮 Phase 14: Advanced Features (TBD)

---

## 📊 Status

**Current Version**: 2.0.0 (Phase 13 Complete)
**Test Coverage**: 85.3% across 315+ tests
**Lines of Code**: 19,104 (production TypeScript)
**MCP Tools**: 12+ tools
**Chunking Strategies**: 4 content-aware algorithms
**Embedding Model**: all-MiniLM-L6-v2 (384 dimensions)
**Search Accuracy**: 87.3% relevance
**Error Recovery**: >80% automatic success rate
**Workflows**: 4 built-in workflows
**Agent Rules**: 3 AI-powered rules

---

## 🆕 What's New in Phase 13

### Four-Pillar Autonomous Learning System ✅

**Complete autonomous learning loop with feedback and adaptation:**

1. **Perception (Pillar 1)**: Multi-source data gathering
   - File search with glob patterns (codebase scanning)
   - Web search via Brave Search API (online research)
   - Parallel source fetching (configurable concurrency)
   - Relevance scoring and ranking

2. **Reasoning (Pillar 2)**: Autonomous analysis
   - Insight extraction from gathered data
   - Pattern identification across sources
   - Recommendation generation based on context
   - Confidence scoring for decisions

3. **Memory (Pillar 3)**: Semantic storage
   - Chunked embeddings for long-term retention
   - Vector similarity search (cosine similarity)
   - Relationship tracking between chunks
   - Full-text search with FTS5

4. **Execution (Pillar 4)**: Action generation
   - Context-aware action planning
   - Priority-based task ordering
   - Duration estimation
   - Response formatting

### Memorographic Chunking Strategies ✅

**4 human memory-inspired chunking algorithms:**

- **Event-Based** (Episodic Memory): Chunks by meaningful events/boundaries
  - Best for: Narratives, tutorials, documentation
  - Features: Heading/paragraph/code detection, context preservation

- **Semantic Boundary** (Semantic Memory): Chunks by topic shifts
  - Best for: Academic papers, technical docs, conceptual content
  - Features: Jaccard/cosine similarity, conceptual coherence

- **Preference Signal** (Emotional Memory): Chunks by importance/relevance
  - Best for: User feedback, reviews, preference-rich content
  - Features: Sentiment detection, memory decay simulation

- **Step-Based** (Procedural Memory): Chunks by sequential steps
  - Best for: Workflows, recipes, instructions, SOPs
  - Features: Step detection, dependency tracking, flow preservation

### Vector Embeddings & Semantic Search ✅

**Dual-provider embedding system:**

- **OpenAI Provider**:
  - text-embedding-3-small (1536 dimensions, fast, cost-effective)
  - text-embedding-3-large (3072 dimensions, higher quality)
  - ~200ms per embedding, 20/sec batch throughput

- **Xenova Provider** (Local, No API Key):
  - all-MiniLM-L6-v2 (384 dimensions, fast)
  - all-mpnet-base-v2 (768 dimensions, balanced)
  - ~50ms per embedding, 50/sec batch throughput
  - Runs locally via Transformers.js

**Hybrid search capabilities:**
- Semantic search (vector similarity)
- Keyword search (SQLite FTS5)
- Configurable weighting (semantic:keyword ratio)
- ~10ms search across 1000 vectors

### Feedback & Reflection System ✅

**Continuous self-improvement:**

- **Feedback Collection**: User ratings, comments, tags
- **Autonomous Reflection**: Self-analysis of performance
- **Adaptation Engine**: Behavior modification from feedback
- **Learning Signals**: Pattern extraction for optimization

### Performance Metrics

- **Chunking**: <100ms for 10KB documents
- **Embedding**: ~200ms (OpenAI), ~50ms (Xenova)
- **Search**: ~10ms across 1000 vectors
- **Learning Loop**: ~700ms complete cycle (all 4 pillars)
- **Cache Hit**: ~1ms (200x faster than API)

### Documentation & Examples

**15+ new documentation files:**
- 4 comprehensive API references
- 2 user guides with examples
- 2 working TypeScript examples
- 1 master document with metrics
- Developer architecture guide

**See [Phase 13 Master Document](docs/PHASE-13-MASTER-DOCUMENT.md) for complete details.**

---

**Built with ❤️ by the Weaver Team**
