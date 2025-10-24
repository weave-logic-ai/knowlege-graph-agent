# Weaver - Neural Network Junction for Weave-NN

**Version**: 0.1.0 (MVP)
**Status**: 🚧 Under Development

---

## Overview

Weaver is the **unified MCP server + workflow orchestrator** for Weave-NN's local-first knowledge graph. It acts as the neural network junction point where multiple AI systems (Claude, local models, specialized agents) connect through a shared knowledge substrate.

**Core Philosophy**: Single service that combines:
- MCP Server (@modelcontextprotocol/sdk)
- Workflow Orchestrator (workflow.dev)
- File Watcher (chokidar)
- Shadow Cache (SQLite)
- Obsidian Client (REST API)
- AI Gateway Integration (Vercel AI Gateway)
- Git Client (simple-git)

---

## Architecture

```
┌─────────────────────────────────────────┐
│            Weaver Service               │
├─────────────────────────────────────────┤
│   - File Watcher (chokidar)            │
│   - Workflow Engine (workflow.dev SDK) │
│   - Shadow Cache (SQLite)               │
│   - ObsidianAPIClient (Local REST API)  │
│   - AI Gateway (Vercel AI Gateway)      │
│   - Git operations (simple-git)         │
└─────────────────────────────────────────┘
              ↕
┌─────────────────────────────────────────┐
│         Obsidian Vault (Markdown)       │
└─────────────────────────────────────────┘
```

---

## Features (MVP)

- ✅ **File Watcher**: Monitors vault for .md file changes
- ✅ **Shadow Cache**: SQLite cache for fast metadata queries
- ✅ **MCP Server**: Exposes tools to AI agents (Claude Code, claude-flow)
- ✅ **Workflow Orchestration**: Durable, stateful workflows with workflow.dev
- ✅ **Obsidian Integration**: REST API client for reading/writing vault
- ✅ **AI Operations**: Extract memories, suggest tags, generate summaries
- ✅ **Auto-commit**: Git integration for automatic versioning

---

## Quick Start

### Prerequisites

- Node.js 20+
- **Bun** (package manager - preferred over npm/yarn)
- Obsidian with Local REST API plugin installed
- Git repository initialized in vault

### Installation

```bash
# Install dependencies with Bun (preferred package manager)
bun install

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
nano .env
```

### Configuration

Edit `.env` file:

```bash
# Required
VAULT_PATH=/path/to/your/weave-nn/vault
OBSIDIAN_API_URL=https://localhost:27124
OBSIDIAN_API_KEY=your-api-key-here
VERCEL_AI_GATEWAY_API_KEY=your-vercel-key-here

# Optional (defaults provided)
NODE_ENV=development
WEAVER_PORT=3000
LOG_LEVEL=info
```

### Development

```bash
# Run in development mode (with hot reload)
bun run dev

# Build for production
bun run build

# Run production build
bun start

# Run tests
bun test

# Type check
bun run typecheck

# Lint
bun run lint
```

**Note**: This project uses **Bun** as the package manager and runtime. All `npm` commands should be replaced with `bun` equivalents.

---

## Project Structure

```
weaver/
├── src/
│   ├── config/              # Configuration management
│   ├── file-watcher/        # File change monitoring
│   ├── workflow-engine/     # Workflow orchestration
│   ├── shadow-cache/        # SQLite metadata cache
│   ├── mcp-server/          # MCP tool implementations
│   │   └── tools/           # Individual MCP tools
│   ├── obsidian-client/     # Obsidian REST API wrapper
│   ├── ai/                  # AI operations (Vercel AI Gateway)
│   ├── git/                 # Git operations
│   ├── utils/               # Shared utilities
│   └── index.ts             # Main entry point
├── workflows/               # Workflow definitions
├── tests/                   # Test files
│   ├── unit/
│   ├── integration/
│   └── mocks/
├── config/                  # Configuration files
├── scripts/                 # Utility scripts
├── data/                    # Runtime data (shadow-cache.db, workflows.db)
├── logs/                    # Log files
├── package.json
├── tsconfig.json
└── README.md (this file)
```

---

## MCP Tools (Planned)

Weaver exposes these tools to AI agents:

### Node Operations
- `create_node` - Create new markdown file with frontmatter
- `update_node` - Update existing node content or metadata
- `delete_node` - Delete a node (moves to .archive/)
- `get_node` - Read node content and metadata

### Query Operations
- `query_graph` - Query knowledge graph with filters
- `find_neighbors` - Find linked nodes (incoming/outgoing)
- `search_content` - Full-text search across vault

### AI Operations
- `extract_memories` - Extract structured memories using AI
- `suggest_tags` - AI-powered tag suggestions
- `generate_summary` - Generate node summary

### Workflow Operations
- `trigger_workflow` - Trigger a workflow manually
- `get_workflow_status` - Check workflow execution status

---

## Workflows (Planned)

Durable workflows orchestrated by workflow.dev:

1. **task-completion** - Triggered by Claude Code hook after task completion
2. **phase-completion** - Triggered by Claude Code hook after phase completion
3. **file-change** - Triggered by file watcher on vault changes
4. **auto-linking** - Automatically create wikilinks based on content
5. **auto-tagging** - Automatically suggest and apply tags
6. **memory-extraction** - Extract memories from new content

---

## Development Status

**Phase 4B Progress**:

- [x] Project structure created
- [x] Configuration module (config.ts) with environment validation
- [x] Logger utility (logger.ts) with structured logging
- [x] Main entry point (index.ts) with startup/shutdown hooks
- [ ] File watcher module
- [ ] Shadow cache module
- [ ] MCP server implementation
- [ ] Workflow engine integration
- [ ] Obsidian client
- [ ] AI operations
- [ ] Git client

---

## Contributing

This is an MVP implementation. Focus on:
- **Keep it simple**: Avoid premature optimization
- **Test-driven**: Write tests for all modules
- **Type-safe**: Use TypeScript strictly
- **Document**: Add JSDoc comments to all exports

---

## Related Documentation

- `/weave-nn/docs/weaver-implementation-summary.md` - Detailed implementation plan
- `/weave-nn/docs/weaver-proxy-architecture.md` - Workflow.dev integration
- `/weave-nn/docs/local-first-architecture-overview.md` - System architecture
- `/weave-nn/mcp/weaver-mcp-tools.md` - MCP tools specification

---

**Last Updated**: 2025-10-23
**Status**: 🚧 Under Active Development (Phase 4B)
**Next**: Implement file watcher and shadow cache modules
