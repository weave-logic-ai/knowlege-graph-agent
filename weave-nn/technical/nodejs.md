---
title: Node.js Runtime
type: documentation
status: in-progress
tags:
  - type/documentation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4C4"
  color: '#8E8E93'
  cssclasses:
    - document
updated: '2025-10-29T04:55:06.354Z'
keywords:
  - overview
  - why node.js 20+
  - installation
  - ubuntu/debian
  - macos (homebrew)
  - windows (nvm-windows)
  - mvp usage
  - key features used
  - native apis
  - package management
---
# Node.js Runtime

**Category**: Technical / Runtime
**Status**: MVP Core Dependency
**Version**: 20.x LTS

---

## Overview

Node.js is the JavaScript runtime for Weaver's unified TypeScript service.

## Why Node.js 20+

- **LTS Support**: Long-term support until 2026
- **Performance**: V8 improvements, faster startup
- **ESM Support**: Native ES modules (required by MCP SDK)
- **Built-in Test Runner**: `node:test` for testing
- **Fetch API**: Native `fetch()` (no need for axios/node-fetch)

## Installation

### Ubuntu/Debian
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should be v20+
```

### macOS (Homebrew)
```bash
brew install node@20
node --version
```

### Windows (nvm-windows)
```bash
nvm install 20
nvm use 20
node --version
```

## MVP Usage

Node.js runs the unified Weaver service containing:
- MCP server (`@modelcontextprotocol/sdk`)
- File watcher (`chokidar`)
- Workflow orchestration (`workflow-dev`)
- Webhook server (`hono`)

**Single process, single runtime.**

## Key Features Used

### Native APIs
- `fs/promises` - File system operations
- `path` - Path manipulation
- `crypto` - Hashing, UUIDs
- `node:test` - Testing

### Package Management
```bash
npm install  # Install dependencies
npm start    # Start Weaver
npm test     # Run tests
```

## Performance Considerations

- **Memory**: Weaver expected to use 50-100MB at idle
- **Startup Time**: <1 second for service start
- **Event Loop**: File watcher uses non-blocking I/O
- **Concurrency**: Handles 100+ concurrent workflows

## Related

- [[technical/typescript|TypeScript Language]]
- [[technical/weaver|Weaver Unified Service]]
- [[docs/local-first-architecture-overview|Local-First Architecture]]
