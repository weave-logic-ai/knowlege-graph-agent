# Weaver: Unified MCP + Workflows + File Watcher

**Date**: 2025-10-23
**Decision**: Weaver serves triple roles as MCP server, workflow orchestrator, AND file watcher
**Impact**: Reduces from 4 services → 1 service (75% simpler)

---

## Executive Summary

By integrating MCP server capabilities using `@modelcontextprotocol/sdk` AND file watching using `chokidar` directly into Weaver, we eliminate the need for both a separate Python FastAPI MCP service and a separate Python file watcher. This creates a **single unified service** that handles everything.

### Before vs After

**Before (4 services)**:
```
┌─────────────────┐
│  Claude Code    │
└────┬────────────┘
     │
     ├─→ MCP Server (Python FastAPI)  ← Separate service
     │   └─→ Obsidian API
     │
     └─→ Weaver (Node.js)             ← Workflow orchestrator
         └─→ Webhooks

File Watcher (Python)                  ← Monitors vault
RabbitMQ (Docker)                      ← Message queue
```

**After (1 service)**:
```
┌─────────────────┐
│  Claude Code    │
└────┬────────────┘
     │
     └─→ Weaver (Node.js)             ← THE ONLY SERVICE
         ├─→ MCP Server (@mcp/sdk)
         │   └─→ Obsidian API tools
         ├─→ File Watcher (chokidar)
         │   └─→ Monitors vault changes
         └─→ Workflow orchestration
             └─→ Webhooks

        Just run `npm start` and everything works!
```

**Benefit**: 75% reduction in services (4 → 1), pure TypeScript, zero Python dependencies.

---

## Technical Implementation

### File Watcher Integration with Chokidar

**Package**: `chokidar` - Battle-tested file watcher used by 30M+ repositories

```bash
npm install chokidar
```

**Features**:
- Cross-platform (Windows, macOS, Linux)
- Reliable change detection (add, change, delete, rename)
- Efficient file system polling with optimizations
- Glob pattern support for filtering
- Ignored patterns (.git, node_modules, etc.)
- Ready events to know when initial scan completes

**Example Implementation**:
```typescript
import chokidar from 'chokidar';
import { triggerWorkflow } from './workflows';

export function createVaultWatcher(vaultPath: string) {
  const watcher = chokidar.watch(vaultPath, {
    ignored: /(^|[\/\\])\../, // Ignore dotfiles
    persistent: true,
    ignoreInitial: true, // Don't fire events for existing files
    awaitWriteFinish: {
      stabilityThreshold: 300, // Wait 300ms after last change
      pollInterval: 100
    }
  });

  watcher
    .on('add', async (path) => {
      console.log(`File added: ${path}`);
      await triggerWorkflow('file-created', { path });
    })
    .on('change', async (path) => {
      console.log(`File changed: ${path}`);
      await triggerWorkflow('file-updated', { path });
    })
    .on('unlink', async (path) => {
      console.log(`File deleted: ${path}`);
      await triggerWorkflow('file-deleted', { path });
    })
    .on('error', (error) => {
      console.error(`Watcher error: ${error}`);
    })
    .on('ready', () => {
      console.log('Vault watcher ready');
    });

  return watcher;
}
```

**Benefits over Python watchdog**:
- No separate Python process
- No cross-language communication overhead
- Unified logging and error handling
- Shared TypeScript types
- In-process event handling (faster)

---

### MCP Integration Options

**Option 1: Official SDK** (Recommended)
```bash
npm install @modelcontextprotocol/sdk
```

**Features**:
- Official TypeScript SDK from Anthropic
- Full MCP specification support
- Built-in transports (stdio, HTTP, SSE)
- Well-documented and actively maintained

**Example**:
```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  { name: 'weaver', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

// Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_knowledge',
      description: 'Retrieve knowledge from graph',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' }
        }
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  // Handle tool calls
});
```

**Option 2: Express Handler**
```bash
npm install express-mcp-handler
```

**Features**:
- Integrates with Express/Hono via middleware
- SSE transport for real-time updates
- Simpler API for basic use cases

**Example**:
```typescript
import { createMCPHandler } from 'express-mcp-handler';
import { Hono } from 'hono';

const app = new Hono();

const mcpHandler = createMCPHandler({
  tools: [
    {
      name: 'get_knowledge',
      description: 'Retrieve knowledge',
      handler: async (params) => {
        // Implementation
      }
    }
  ]
});

app.get('/mcp/sse', mcpHandler.sse);
app.post('/mcp/message', mcpHandler.message);
```

**Option 3: Framework** (If complexity grows)
```bash
npm install mcp-framework
```

**Features**:
- Opinionated structure with auto-discovery
- Directory-based tool/resource/prompt organization
- Built-in conventions for scaling

**Recommendation**: Start with **Option 1 (@modelcontextprotocol/sdk)** as it's official and most flexible.

---

## Architecture Benefits

### 1. Simplified Deployment

**Before (4 services)**:
```bash
# Terminal 1: Start RabbitMQ
docker run -d -p 5672:5672 rabbitmq:3-management

# Terminal 2: Start Python MCP server
cd weave-nn-mcp
source .venv/bin/activate
uvicorn server:app --port 8000

# Terminal 3: Start Weaver
cd weave-nn-weaver
npm start

# Terminal 4: Start File Watcher
cd weave-nn-mcp
python file_watcher.py
```

**After (1 service)**:
```bash
# Single terminal: Start Weaver (includes MCP + file watcher)
cd weave-nn-weaver
npm start
```

**Benefit**: 75% fewer terminals, 75% fewer services, zero Python dependencies.

### 2. Unified Codebase

**Before**:
- Python codebase for MCP tools
- Python file watcher script
- TypeScript codebase for Weaver workflows
- Cross-language integration complexity

**After**:
- Single TypeScript codebase
- Shared utilities and types across MCP, workflows, and watcher
- Easier testing and maintenance
- Zero Python dependencies

### 3. Shared Context

**Before**:
- MCP server has no visibility into workflow state
- File watcher can't directly call workflows
- Workflows can't directly call MCP tools
- Communication via HTTP/messaging overhead

**After**:
- MCP tools can access workflow state
- File watcher can directly trigger workflows
- Workflows can call MCP functions directly
- In-process communication (zero latency)

### 4. Simpler Configuration

**Before (multiple config files)**:
```
weave-nn-mcp/
  .env              ← Python MCP config
  config.py         ← Python settings
  watcher.yaml      ← File watcher config

weave-nn-weaver/
  .env              ← Weaver config
  weaver.config.ts  ← Workflow config

docker-compose.yml  ← RabbitMQ config
```

**After (single config)**:
```
weave-nn-weaver/
  .env              ← All config
  weaver.config.ts  ← MCP + workflow + watcher config
```

---

## Implementation Checklist

### Phase 0: Setup Unified Weaver

- [ ] **Install dependencies**
  ```bash
  npm install @modelcontextprotocol/sdk chokidar workflow-dev hono @hono/node-server
  ```

- [ ] **Create MCP server module** (`src/mcp/server.ts`)
  ```typescript
  import { Server } from '@modelcontextprotocol/sdk/server/index.js';

  export function createMCPServer() {
    const server = new Server(
      { name: 'weaver', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    // Register tools
    registerKnowledgeGraphTools(server);
    registerWorkflowTools(server);

    return server;
  }
  ```

- [ ] **Register MCP tools** (4 core tools)
  - `get_knowledge` - Query knowledge graph
  - `store_knowledge` - Add to knowledge graph
  - `trigger_workflow` - Start durable workflow
  - `get_workflow_status` - Check workflow progress

- [ ] **Create file watcher module** (`src/watcher/vault-watcher.ts`)
  ```typescript
  import chokidar from 'chokidar';

  export function createVaultWatcher(vaultPath: string) {
    const watcher = chokidar.watch(vaultPath, {
      ignored: /(^|[\/\\])\../,
      persistent: true,
      ignoreInitial: true
    });

    watcher
      .on('add', async (path) => { /* trigger workflow */ })
      .on('change', async (path) => { /* trigger workflow */ })
      .on('unlink', async (path) => { /* trigger workflow */ });

    return watcher;
  }
  ```

- [ ] **Integrate with Weaver** (`src/index.ts`)
  ```typescript
  import { createMCPServer } from './mcp/server';
  import { createWebhookServer } from './webhooks/server';
  import { createVaultWatcher } from './watcher/vault-watcher';

  const mcpServer = createMCPServer();
  const webhookServer = createWebhookServer();
  const vaultWatcher = createVaultWatcher(process.env.VAULT_PATH);

  // All three run in same process
  ```

- [ ] **Update Claude Code MCP configuration**
  ```json
  {
    "mcpServers": {
      "weaver": {
        "command": "node",
        "args": ["/path/to/weave-nn-weaver/dist/index.js"],
        "env": {
          "OBSIDIAN_API_URL": "http://localhost:27124",
          "OBSIDIAN_API_KEY": "your-key"
        }
      }
    }
  }
  ```

- [ ] **Test unified Weaver**
  - Start Weaver with `npm start`
  - Verify Claude Code connects to MCP
  - Test `get_knowledge` tool
  - Create/modify a file in vault and verify watcher detects changes

### Phase 1: Migrate MCP Tools

- [ ] **Port Python MCP tools to TypeScript**
  - ObsidianAPIClient wrapper
  - Knowledge graph query functions
  - Metadata extraction utilities

- [ ] **Add workflow-specific tools**
  - `trigger_task_completion_workflow`
  - `get_workflow_trace`
  - `query_workflow_history`

- [ ] **Test all tools**
  - Unit tests for each MCP tool
  - Integration tests with Claude Code
  - Verify knowledge retrieval accuracy

### Phase 2: Deprecate Python Components

- [ ] **Update all documentation**
  - Remove references to Python MCP server
  - Remove references to Python file watcher
  - Remove references to RabbitMQ
  - Update setup instructions
  - Update architecture diagrams

- [ ] **Archive Python code**
  - Move Python MCP server to `.archive/python-mcp-server/`
  - Move Python file watcher to `.archive/python-file-watcher/`
  - Document migration rationale
  - Keep for reference

- [ ] **Simplify Phase 0 prerequisites**
  - Remove Python MCP server setup
  - Remove Python file watcher setup
  - Remove FastAPI/Pika/watchdog dependencies
  - Remove RabbitMQ/Docker setup
  - Update .env template (add VAULT_PATH)

---

## Code Structure

### Unified Weaver Project Structure

```
weave-nn-weaver/
├── src/
│   ├── index.ts              ← Main entry (MCP + webhooks + watcher)
│   ├── mcp/
│   │   ├── server.ts         ← MCP server setup
│   │   ├── tools/
│   │   │   ├── knowledge.ts  ← Knowledge graph tools
│   │   │   ├── workflow.ts   ← Workflow tools
│   │   │   └── obsidian.ts   ← Obsidian API tools
│   │   └── types.ts          ← MCP type definitions
│   ├── watcher/
│   │   └── vault-watcher.ts  ← Chokidar file watcher
│   ├── webhooks/
│   │   ├── server.ts         ← Hono webhook server
│   │   ├── routes/
│   │   │   ├── task.ts       ← Task completion endpoint
│   │   │   └── health.ts     ← Health check
│   │   └── middleware.ts     ← Auth, logging
│   ├── workflows/
│   │   ├── task-completion.ts
│   │   ├── phase-update.ts
│   │   └── git-commit.ts
│   ├── clients/
│   │   ├── obsidian.ts       ← Obsidian API client
│   │   └── git.ts            ← Git operations
│   └── utils/
│       ├── logger.ts
│       └── config.ts
├── tests/
│   ├── mcp/                  ← MCP tool tests
│   ├── watcher/              ← File watcher tests
│   └── workflows/            ← Workflow tests
├── package.json
├── tsconfig.json
└── weaver.config.ts          ← Unified config
```

**Key Files**:

**`src/index.ts`** - Unified entry point:
```typescript
import { createMCPServer } from './mcp/server';
import { createWebhookServer } from './webhooks/server';
import { createVaultWatcher } from './watcher/vault-watcher';
import { loadConfig } from './utils/config';

async function main() {
  const config = loadConfig();

  // Start MCP server (stdio transport for Claude Code)
  const mcpServer = createMCPServer(config);
  await mcpServer.connect(new StdioServerTransport());

  // Start webhook server (HTTP for Claude Code hooks)
  const webhookServer = createWebhookServer(config);
  await webhookServer.listen({ port: 3000 });

  // Start file watcher (monitors vault changes)
  const vaultWatcher = createVaultWatcher(config.vaultPath);

  console.log('Weaver running: MCP + Webhooks + File Watcher');
}

main();
```

**`weaver.config.ts`** - Unified configuration:
```typescript
export default {
  mcp: {
    name: 'weaver',
    version: '1.0.0',
    tools: ['knowledge', 'workflow', 'obsidian']
  },
  webhooks: {
    port: 3000,
    endpoints: ['/webhook/task', '/webhook/phase']
  },
  watcher: {
    vaultPath: process.env.VAULT_PATH,
    ignored: ['**/.git/**', '**/node_modules/**', '**/.obsidian/**'],
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100
    }
  },
  obsidian: {
    apiUrl: process.env.OBSIDIAN_API_URL,
    apiKey: process.env.OBSIDIAN_API_KEY
  },
  workflows: {
    taskCompletion: './workflows/task-completion',
    phaseUpdate: './workflows/phase-update'
  }
};
```

---

## Benefits Summary

| Metric | Before (4 services) | After (1 service) | Improvement |
|--------|---------------------|-------------------|-------------|
| **Services** | MCP (Python), Weaver (Node), Watcher (Python), RabbitMQ (Docker) | Weaver (unified Node.js) | 75% reduction |
| **Languages** | Python + TypeScript | TypeScript only | Pure TypeScript |
| **Terminals** | 4 terminals | 1 terminal | 75% fewer |
| **Codebases** | 3 projects (Python MCP + Python watcher + TS Weaver) | 1 codebase (TypeScript) | Unified |
| **Config Files** | 4+ files (.env x2, config.py, watcher.yaml, docker-compose) | 2 files (.env + weaver.config.ts) | Much simpler |
| **Dependencies** | Python, FastAPI, Pika, watchdog, Docker, RabbitMQ | Node.js only | Minimal |
| **Setup Time** | ~5 hours | ~1 hour | 80% faster |
| **Maintenance** | 4 services to monitor/update | 1 service to monitor/update | 75% less |
| **Startup** | 4 commands across 4 terminals | 1 command (`npm start`) | 75% simpler |

---

## Migration Path

### Option 1: Clean Start (Recommended)

1. Create new unified Weaver project from scratch
2. Implement MCP server using `@modelcontextprotocol/sdk`
3. Implement file watcher using `chokidar`
4. Port existing bash script logic to TypeScript workflows
5. Never build separate Python services

**Pros**: Clean architecture, no migration complexity, single codebase from day 1
**Cons**: All new code (but much simpler overall)

### Option 2: Gradual Migration

1. Build Weaver with webhooks first (without MCP or watcher)
2. Keep using Python MCP server and file watcher temporarily
3. Add MCP to Weaver incrementally
4. Add chokidar file watcher
5. Deprecate Python components when ready

**Pros**: Incremental, can test each step
**Cons**: Temporary complexity of both systems running in parallel

**Recommendation**: **Option 1 (Clean Start)** since we haven't built any services yet. Start with the unified single-service architecture from day 1.

---

## Related Documentation

**Architecture**:
- [[local-first-architecture-overview|Local-First Architecture]] - Overall system design
- [[weaver-proxy-architecture|Weaver Architecture]] - Detailed Weaver spec

**Decisions**:
- [[decisions/technical/adopt-weaver-workflow-proxy|D-020: Adopt Weaver]] - Original Weaver decision

**Planning**:
- [[_planning/phases/phase-0-pre-development-work|Phase 0 Tasks]] - Setup checklist (updated for unified Weaver)
- [[_planning/phases/phase-6-tasks|Phase 6 Tasks]] - MVP implementation

---

## FAQ

### Q: Why not keep Python for MCP?

**A**: TypeScript benefits:
- Single codebase (easier maintenance)
- Shared types between MCP and workflows
- Better async/await support
- Native integration with workflow.dev
- Unified logging and error handling

### Q: Does this eliminate all Python?

**A**: Yes, for the MVP! All Python components replaced:
- MCP server → `@modelcontextprotocol/sdk` (TypeScript)
- File watcher → `chokidar` (TypeScript)
- Result: Pure TypeScript/Node.js stack with zero Python dependencies

### Q: What about all the Python dependencies (FastAPI/Pika/watchdog)?

**A**: All eliminated:
- FastAPI → Not needed (Hono in Weaver for webhooks)
- Pika (RabbitMQ) → Not needed (Weaver handles async with workflows)
- watchdog → Not needed (chokidar handles file watching)
- Docker/RabbitMQ → Not needed (Weaver handles message queuing)
- Result: **Zero Python dependencies for MVP**

### Q: Is @modelcontextprotocol/sdk stable?

**A**: Yes. It's the official Anthropic SDK with:
- Active development and maintenance
- Full MCP 1.0 specification support
- Used by Anthropic's own tools
- TypeScript-native with excellent types

### Q: Is chokidar reliable for production use?

**A**: Absolutely. Chokidar is:
- Used by 30M+ repositories (webpack, vite, parcel, gulp, etc.)
- Battle-tested across all platforms (Windows, macOS, Linux)
- Actively maintained with 8+ years of production use
- Handles edge cases (rapid changes, renames, atomic writes)
- Much more reliable than Python's watchdog for cross-platform use

---

**Document Version**: 2.0
**Last Updated**: 2025-10-23
**Status**: Architecture Decision - Approved
**Impact**: Simplifies from 4 services → 1 service (75% reduction)
