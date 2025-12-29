# Knowledge Graph Agent - Implementation Notes

Technical documentation for developers working on the knowledge-graph-agent package.

## Architecture Overview

### Module Organization

```
src/
  core/           # Data structures and persistence
    database.ts   # SQLite database operations
    graph.ts      # In-memory graph manager
    types.ts      # Core type definitions
    cache.ts      # Shadow cache implementation

  agents/         # Agent system
    base-agent.ts # Abstract agent base class
    types.ts      # Agent type definitions
    registry.ts   # Agent factory and lifecycle

  workflows/      # Workflow orchestration
    registry.ts   # Workflow definitions
    executor.ts   # Workflow execution

  services/       # Background processes
    manager.ts    # Service lifecycle management
    watcher.ts    # File system watchers
    types.ts      # Service type definitions

  cultivation/    # Knowledge seeding
    seed-generator.ts  # Dependency analysis
    seed-enhancer.ts   # Node enhancement
    deep-analyzer.ts   # Codebase deep analysis

  integrations/   # External integrations
    claude-flow.ts  # claude-flow memory sync
    git.ts          # Git operations

  mcp-server/     # MCP protocol server
    server.ts     # Main server implementation
    handlers/     # Request handlers
    tools/        # Tool definitions

  recovery/       # Data recovery
    backup.ts     # Backup management

  caching/        # Cache implementations
    lru-cache.ts  # Advanced LRU cache

  utils/          # Shared utilities
    logger.ts     # Logging infrastructure
    retry.ts      # Retry utilities
```

### Dependency Flow

```
index.ts (exports)
    |
    +-- core/ (foundation layer)
    |     |
    |     +-- types.ts (all type definitions)
    |     +-- database.ts (persistence)
    |     +-- graph.ts (in-memory operations)
    |
    +-- agents/ (execution layer)
    |     |
    |     +-- base-agent.ts (uses core/types)
    |     +-- registry.ts (agent lifecycle)
    |
    +-- services/ (background layer)
    |     |
    |     +-- manager.ts (uses utils/logger)
    |
    +-- mcp-server/ (API layer)
          |
          +-- server.ts (uses agents/, core/)
```

### Key Abstractions

1. **KnowledgeNode**: Represents a document node with metadata, links, and content
2. **GraphEdge**: Represents relationships between nodes
3. **AgentInstance**: Executable unit with task handling and lifecycle
4. **ServiceHandler**: Background process interface

---

## Phase Implementation Details

### Phase 1: Cultivation System Architecture

The cultivation system bootstraps knowledge graphs from codebase analysis.

**Core Components:**

- `SeedGenerator`: Analyzes package manifests across ecosystems (npm, pip, cargo, etc.)
- `SeedAnalysis`: Result structure containing dependencies, services, frameworks
- `GeneratedDocument`: Output format for primitive nodes

**Supported Ecosystems:**
- Node.js: `package.json`
- Python: `requirements.txt`, `pyproject.toml`
- PHP: `composer.json`
- Rust: `Cargo.toml`
- Go: `go.mod`
- Java: `pom.xml`, `build.gradle`

**Category Classification:**

Dependencies are auto-classified into categories:
- `components/ui` - Frontend frameworks
- `services/api` - Backend frameworks
- `integrations/databases` - ORM/database
- `guides/testing` - Testing libraries
- `standards/build-tools` - Build tools

### Phase 2: Agent System and Workflows

The agent system provides typed, lifecycle-managed execution units.

**BaseAgent Features:**
- Task execution with timeout handling
- Retry logic with configurable backoff
- Input validation hooks
- Output formatting helpers
- claude-flow hook integration

**Agent Types (via `AgentType` enum):**
- RESEARCHER, CODER, TESTER, ANALYST
- ARCHITECT, REVIEWER, COORDINATOR
- CUSTOM (extensible)

**Agent Lifecycle States:**
- IDLE, RUNNING, PAUSED, COMPLETED, FAILED, TERMINATED

**Registry Pattern:**
```typescript
const registry = createRegistry();
registry.register(AgentType.CODER, coderFactory);
const agent = await registry.spawn(AgentType.CODER, { name: 'my-coder' });
```

### Phase 3: Services and Configuration

The service manager handles background processes.

**ServiceManager Features:**
- Service registration with auto-start
- Health check scheduling
- Automatic restart on failure
- Graceful shutdown coordination
- Event emission (registered, started, stopped, failed)

**Service States:**
- stopped, starting, running, stopping, failed

**Configuration via Zod schema (`ConfigSchema`):**
```typescript
{
  projectRoot: string,
  docsRoot: string,
  graph: { includePatterns, excludePatterns, maxDepth },
  database: { path, enableWAL },
  claudeFlow: { enabled, namespace, syncOnChange }
}
```

### Phase 4: Recovery and Caching

**BackupManager:**
- Automatic scheduled backups
- Gzip compression support
- SHA-256 checksum verification
- Configurable retention (maxBackups)
- Restore with integrity validation

**AdvancedCache:**
- Multiple eviction policies: LRU, LFU, FIFO, TTL
- Tag-based grouping and batch operations
- Automatic TTL expiration cleanup
- Size and entry count limits
- Hit/miss statistics

---

## Key Design Decisions

### Why SQLite for Database

1. **Single-file portability**: Database travels with the project
2. **ACID compliance**: Reliable for knowledge graph integrity
3. **FTS5 support**: Built-in full-text search with ranking
4. **WAL mode**: Better concurrency for read-heavy workloads
5. **Foreign keys**: Referential integrity for node-edge relationships
6. **No external dependencies**: Works offline, no server needed

**Schema highlights:**
- FTS5 virtual table for content search
- Triggers for automatic FTS sync
- Indexes on type, status, path for common queries
- Tags via junction table for many-to-many

### EventEmitter Patterns

Used in `ServiceManager` and `AdvancedCache` for:
- Decoupled event handling
- Plugin/extension points
- Monitoring hooks
- Lifecycle notifications

Example events: `registered`, `started`, `stopped`, `healthCheck`, `evict`

### Factory Function Patterns

All major classes provide factory functions:
```typescript
createDatabase(path)        // KnowledgeGraphDatabase
createRegistry()            // AgentRegistry
createServiceManager()      // ServiceManager
createBackupManager(path)   // BackupManager
createAdvancedCache()       // AdvancedCache
```

Benefits:
- Encapsulates construction complexity
- Enables dependency injection
- Simplifies testing with mock factories

### Error Handling Approach

1. **Typed errors**: `AgentError` with code, message, stack, retryable
2. **Safe JSON parsing**: `safeJsonParse()` prevents crashes from malformed data
3. **FTS5 query sanitization**: Prevents injection in search queries
4. **Graceful degradation**: Files that don't exist are skipped, not crashed

---

## Integration Points

### claude-flow Integration

`ClaudeFlowIntegration` class syncs graph data to claude-flow memory.

**Memory namespace structure:**
- `node/<id>` - Individual node data
- `stats` - Graph statistics
- `metadata` - Sync metadata
- `index/nodes` - Node lookup index
- `index/tags` - Tag-to-nodes mapping

**Hook commands generated:**
```bash
npx claude-flow@alpha hooks pre-task --description "..."
npx claude-flow@alpha hooks post-edit --memory-key "..."
npx claude-flow@alpha hooks session-end --export-metrics true
```

### MCP Server Integration

`KnowledgeGraphMCPServer` implements the MCP protocol.

**Transport:** stdio (StdioServerTransport)

**Request handlers:**
- `ListToolsRequestSchema` - Returns tool definitions
- `CallToolRequestSchema` - Executes tool calls

**Server lifecycle:**
- Graceful SIGINT/SIGTERM handling
- Uncaught exception recovery
- Health status reporting

### Git Integration

`GitIntegration` class provides:
- Repository detection
- Branch information
- Commit history parsing
- File change tracking

Used for linking documents to commits and tracking vault changes.

### File System Watchers

Watch for changes in vault directories:
- Debounced change handling
- Automatic graph updates
- Event emission for sync triggers

---

## Testing Strategy

### Test Organization

```
tests/
  agents/
    registry.test.ts   # Agent registry tests
    base-agent.test.ts # Base agent tests
  core/
    database.test.ts   # Database operations
    graph.test.ts      # Graph operations
  services/
    manager.test.ts    # Service manager tests
```

### Mocking Patterns

**Mock agent factory:**
```typescript
function createMockAgent(config: AgentConfig): AgentInstance {
  return {
    config,
    state: { status: AgentStatus.IDLE, ... },
    execute: vi.fn().mockResolvedValue({ success: true }),
    pause: vi.fn(),
    resume: vi.fn(),
    terminate: vi.fn(),
    getStatus: () => state.status,
  };
}
```

**Mock factory function:**
```typescript
function createMockFactory(type: AgentType): AgentFactory {
  return async (config) => createMockAgent({ ...config, type });
}
```

### Coverage Approach

- Unit tests for core modules (database, graph, cache)
- Integration tests for agent registry lifecycle
- Health check tests for service manager
- End-to-end tests for MCP server (manual)

---

## Future Considerations

### Areas for Improvement

1. **Vector embeddings**: Add semantic search via vector similarity
2. **Incremental sync**: Only sync changed nodes to claude-flow
3. **Streaming backup**: Handle very large databases efficiently
4. **Plugin system**: Allow custom agent types and tools
5. **Metrics export**: Prometheus/OpenTelemetry integration

### Scalability Considerations

1. **Database size**: Current SQLite works for ~100K nodes; consider partitioning for larger graphs
2. **Cache memory**: Default 100MB limit; adjust based on available RAM
3. **Agent concurrency**: Registry supports max-per-type limits
4. **Backup storage**: Auto-cleanup keeps only N backups

### Known Limitations

1. **Single-process**: No distributed agent execution
2. **SQLite concurrency**: Write locks during heavy updates
3. **FTS5 ranking**: Basic TF-IDF; no semantic relevance
4. **File watching**: May miss rapid successive changes
5. **claude-flow dependency**: Assumes MCP server availability

---

## Quick Reference

### Common Operations

```typescript
// Create and populate graph
const db = createDatabase('/path/to/knowledge.db');
db.upsertNode(node);
const results = db.searchNodes('query');

// Spawn agents
const registry = createRegistry();
registry.register(AgentType.CODER, createCoderAgent);
const agent = await registry.spawn(AgentType.CODER, { name: 'test' });
await agent.execute(task);

// Manage services
const manager = createServiceManager();
await manager.register(config, handler);
await manager.shutdown();

// Create backups
const backup = createBackupManager('/path/to/db');
const info = await backup.createBackup();
await backup.restore(info.id);
```

### Environment Variables

None currently required. All configuration via programmatic options.

### Debug Logging

Uses custom logger with levels: trace, debug, info, warn, error

Enable verbose logging:
```typescript
import { setLogLevel } from './utils/logger';
setLogLevel('debug');
```
