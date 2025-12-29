---
title: Dependencies and Resources
description: Overview of package dependencies and external resources
category: reference
---

# Dependencies and Resources

## Overview

This document provides detailed information about the dependencies used in `@weavelogic/knowledge-graph-agent`, their purposes, and licensing information.

## Core Dependencies

### Database & Storage

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | ^11.7.0 | SQLite database with FTS5 full-text search | MIT |

**Why better-sqlite3?**
- Synchronous API for simpler code
- Best-in-class performance for SQLite
- Native FTS5 support for full-text search
- Well-maintained with excellent documentation

### CLI & User Interface

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [commander](https://github.com/tj/commander.js) | ^14.0.1 | CLI argument parsing | MIT |
| [inquirer](https://github.com/SBoudrias/Inquirer.js) | ^12.3.0 | Interactive CLI prompts | MIT |
| [chalk](https://github.com/chalk/chalk) | ^5.3.0 | Terminal string styling | MIT |
| [ora](https://github.com/sindresorhus/ora) | ^8.1.1 | Terminal spinners | MIT |

### GraphQL & API

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [graphql](https://github.com/graphql/graphql-js) | ^16.8.0 | GraphQL language implementation | MIT |
| [graphql-yoga](https://github.com/dotansimha/graphql-yoga) | ^5.1.0 | GraphQL server framework | MIT |
| [graphql-ws](https://github.com/enisdenjo/graphql-ws) | ^5.14.0 | WebSocket subscriptions | MIT |
| [@graphql-tools/schema](https://github.com/ardatan/graphql-tools) | ^10.0.0 | Schema utilities | MIT |

**Why graphql-yoga?**
- Built-in subscriptions support
- Excellent TypeScript support
- Plugin system for extensibility
- Production-ready with good defaults

### React Dashboard

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [react](https://github.com/facebook/react) | ^18.3.1 | UI component library | MIT |
| [react-dom](https://github.com/facebook/react) | ^18.3.1 | React DOM bindings | MIT |
| [@tanstack/react-query](https://github.com/TanStack/query) | ^5.62.0 | Data fetching & caching | MIT |
| [@tanstack/react-table](https://github.com/TanStack/table) | ^8.20.0 | Table component | MIT |
| [lucide-react](https://github.com/lucide-icons/lucide) | ^0.468.0 | Icon library | ISC |
| [clsx](https://github.com/lukeed/clsx) | ^2.1.0 | Class name utility | MIT |
| [tailwind-merge](https://github.com/dcastil/tailwind-merge) | ^2.6.0 | Tailwind class merging | MIT |

### Graph Visualization

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [cytoscape](https://github.com/cytoscape/cytoscape.js) | ^3.30.0 | Graph visualization | MIT |
| [cytoscape-dagre](https://github.com/cytoscape/cytoscape.js-dagre) | ^2.5.0 | Directed graph layout | MIT |
| [react-cytoscapejs](https://github.com/plotly/react-cytoscapejs) | ^2.0.0 | React bindings | MIT |

**Why Cytoscape.js?**
- Industry-standard graph visualization
- Excellent performance with large graphs
- Rich plugin ecosystem
- Well-documented API

### File Processing

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [gray-matter](https://github.com/jonschlinkert/gray-matter) | ^4.0.3 | YAML frontmatter parsing | MIT |
| [fast-glob](https://github.com/mrmlnc/fast-glob) | ^3.3.3 | Fast file globbing | MIT |
| [ignore](https://github.com/kaelzhang/node-ignore) | ^7.0.5 | .gitignore parsing | MIT |
| [js-yaml](https://github.com/nodeca/js-yaml) | ^4.1.0 | YAML parsing | MIT |
| [handlebars](https://github.com/handlebars-lang/handlebars.js) | ^4.7.8 | Template engine | MIT |

### AI & ML

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [@anthropic-ai/sdk](https://github.com/anthropics/anthropic-sdk-typescript) | ^0.32.0 | Claude API client | MIT |
| [@xenova/transformers](https://github.com/xenova/transformers.js) | ^2.17.2 | ML embeddings | Apache-2.0 |

**@xenova/transformers**:
- Runs ML models in Node.js/browser
- Used for local embedding generation
- Supports `all-MiniLM-L6-v2` for semantic search
- No external API calls required

### Utilities

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [uuid](https://github.com/uuidjs/uuid) | ^9.0.0 | UUID generation | MIT |
| [zod](https://github.com/colinhacks/zod) | ^3.23.8 | Schema validation | MIT |
| [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig) | ^9.0.0 | Configuration loading | MIT |
| [ws](https://github.com/websockets/ws) | ^8.16.0 | WebSocket client/server | MIT |
| [simple-git](https://github.com/steveukx/git-js) | ^3.28.0 | Git operations | MIT |

### Code Analysis

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [@typescript-eslint/typescript-estree](https://github.com/typescript-eslint/typescript-eslint) | ^8.51.0 | TypeScript AST parsing | MIT |

## Development Dependencies

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [typescript](https://github.com/microsoft/TypeScript) | ^5.7.2 | TypeScript compiler | Apache-2.0 |
| [vite](https://github.com/vitejs/vite) | ^6.3.0 | Build tool | MIT |
| [vitest](https://github.com/vitest-dev/vitest) | ^3.0.0 | Test framework | MIT |
| [tsx](https://github.com/privatenumber/tsx) | ^4.19.2 | TypeScript execution | MIT |
| [vite-plugin-dts](https://github.com/qmhc/vite-plugin-dts) | ^4.5.4 | Declaration generation | MIT |

## Optional Peer Dependencies

### agentic-flow

| Package | Version | Purpose | License |
|---------|---------|---------|---------|
| [agentic-flow](https://github.com/ruvnet/agentic-flow) | ^1.10.0 | Advanced agent features | MIT |

**Features enabled by agentic-flow**:
- AgentDB vector database (150x faster than alternatives)
- ReasoningBank adaptive learning
- QUIC transport for low-latency communication
- Federation Hub for swarm coordination

## External Services & Integrations

### claude-flow

Integration with [claude-flow](https://github.com/ruvnet/claude-flow) MCP server for:
- Memory synchronization
- Agent coordination
- Cross-session persistence

```bash
# Install claude-flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

### Obsidian

Compatible with [Obsidian](https://obsidian.md/) vaults for:
- Wiki-link syntax (`[[link]]`)
- Frontmatter metadata
- Graph visualization

## License Summary

All dependencies use permissive open-source licenses:

| License | Count | Notes |
|---------|-------|-------|
| MIT | 28 | Most common, very permissive |
| Apache-2.0 | 2 | TypeScript, @xenova/transformers |
| ISC | 1 | lucide-react |

**Total**: All dependencies are compatible with MIT licensing and commercial use.

## Security

### Vulnerability Scanning

```bash
# Check for vulnerabilities
npm audit

# Update dependencies
npm update
```

### Dependency Updates

We recommend:
1. Review changelogs before updating major versions
2. Run full test suite after updates
3. Test in staging before production deployment

## Native Dependencies

### better-sqlite3

Requires native compilation. Pre-built binaries available for:
- Linux (x64, arm64)
- macOS (x64, arm64)
- Windows (x64)

If prebuilds fail:
```bash
# Install build tools
# Linux
sudo apt-get install build-essential python3

# macOS
xcode-select --install

# Windows
npm install --global windows-build-tools
```

## Bundle Size

Approximate sizes (production build):

| Component | Size |
|-----------|------|
| Core library | ~150KB |
| CLI | ~200KB |
| GraphQL server | ~100KB |
| Dashboard | ~500KB |
| **Total** | ~950KB |

Note: Native modules (better-sqlite3) add ~5MB.

## Resources

### Documentation

- [better-sqlite3 API](https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md)
- [Cytoscape.js docs](https://js.cytoscape.org/)
- [GraphQL Yoga docs](https://the-guild.dev/graphql/yoga-server)
- [TanStack Query docs](https://tanstack.com/query/latest)

### Tutorials

- [Getting Started](./getting-started/installation.md)
- [GraphQL API Guide](./guides/graphql-api.md)
- [Dashboard Guide](./guides/dashboard.md)

### Community

- [GitHub Issues](https://github.com/weavelogic/knowledge-graph-agent/issues)
- [Discussions](https://github.com/weavelogic/knowledge-graph-agent/discussions)

## Changelog

See [CHANGELOG.md](./changelog/CHANGELOG.md) for dependency update history.
