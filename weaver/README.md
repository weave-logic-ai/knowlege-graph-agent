# Weaver

**Intelligent Vault Initialization and Workflow Automation for Obsidian**

Weaver is a powerful TypeScript application that transforms your Obsidian vault into an intelligent knowledge management system with AI-powered features, automated workflows, and seamless Claude Desktop integration via MCP (Model Context Protocol).

**Version**: 1.0.0 (MVP)
**Status**: ✅ Production Ready

---

## ✨ Key Features

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

### Developer Guides
- [Architecture Overview](docs/developer/ARCHITECTURE.md) - System design and components
- [Testing Guide](docs/developer/TESTING.md) - Run and write tests

### Additional Documentation
- [MCP Server Setup](docs/claude-desktop-setup.md) - Claude Desktop integration
- [MCP Usage Guide](docs/mcp-usage-guide.md) - Using MCP tools
- [Shadow Cache Tools](docs/shadow-cache-tools-usage.md) - Shadow cache API

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
- 🔄 Phase 10: MVP Readiness & Launch

---

## 📊 Status

**Current Version**: 1.0.0 (MVP)
**Test Coverage**: 85%+
**MCP Tools**: 12 tools
**Workflows**: 4 built-in workflows
**Agent Rules**: 3 AI-powered rules

---

**Built with ❤️ by the Weaver Team**
