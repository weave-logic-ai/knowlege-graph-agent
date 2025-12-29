# ADR-001: MCP Tool Execution Integration

**Status**: Proposed
**Date**: 2025-12-29
**Category**: integration

## Context

The Knowledge Graph Agent requires persistent memory synchronization, agent coordination, and vault management capabilities. Currently, the `ClaudeFlowMemoryClient` in `weaver/src/memory/claude-flow-client.ts` uses an internal `Map` for storage simulation, making all memory operations ephemeral and losing data on restart. This prevents:

- Cross-session persistence
- Real agent coordination through shared memory
- Actual vault sync to claude-flow memory
- Production deployment readiness

The MCP (Model Context Protocol) tools provided by claude-flow offer the necessary infrastructure but are not being called - only mock implementations exist.

## Decision

Replace mock MCP tool implementations with actual MCP client calls using the existing `ClaudeFlowCLI` wrapper. The implementation will:

1. Create a new `McpClient` adapter class that wraps subprocess calls to claude-flow
2. Update `ClaudeFlowMemoryClient` to use the MCP client for real operations
3. Implement retry logic with exponential backoff for transient failures
4. Provide graceful fallback to in-memory storage when MCP server is unavailable
5. Support batch operations via `mcp__claude-flow__batch_process` for performance

### Architecture

```
+---------------------+      +----------------------+
| Knowledge Graph     |      | Claude-Flow MCP      |
| Agent               |      | Server               |
|                     |      |                      |
| +-----------------+ |      | +------------------+ |
| | VaultMemorySync | |------+>| memory_usage     | |
| +--------+--------+ |      | | memory_search    | |
|          |          |      | | memory_persist   | |
|          v          |      | +------------------+ |
| +-----------------+ |      |                      |
| | ClaudeFlowClient| |      | +------------------+ |
| | (MCP Client)    |-|------+>| swarm_init       | |
| +-----------------+ |      | | agent_spawn      | |
|                     |      | | task_orchestrate | |
+---------------------+      +----------------------+
```

## Rationale

### Why MCP over direct HTTP/REST?

1. **Standardized Protocol**: MCP is the established protocol for Claude integrations
2. **Existing Infrastructure**: Claude-flow already provides MCP servers
3. **Tool Ecosystem**: Access to 100+ MCP tools for memory, agents, and workflows
4. **Consistency**: Aligns with how other Claude Code extensions communicate

### Why subprocess execution over in-process?

1. **Isolation**: MCP server runs in its own process, preventing memory leaks from affecting the main agent
2. **Existing CLI**: The `claude-flow@alpha` CLI already handles MCP communication
3. **Simplicity**: No need to implement MCP protocol from scratch
4. **Upgradability**: Can upgrade claude-flow independently

### Alternatives Considered

1. **Direct MCP Protocol Implementation**: Too complex, requires WebSocket handling
2. **HTTP REST API**: Would require running additional server, non-standard
3. **SQLite-only Storage**: Loses cross-session memory synchronization benefits
4. **Redis/External Cache**: Adds infrastructure dependency

## Consequences

### Positive

- All memory operations become persistent across sessions
- Real multi-agent coordination through shared memory
- Vault synchronization actually persists to claude-flow
- Integration with the broader claude-flow ecosystem (neural training, swarm coordination)
- Graceful degradation when MCP unavailable
- Batch operations provide 2-5x performance improvement for sync operations

### Negative

- Adds subprocess overhead (~10-50ms per operation)
- Requires claude-flow MCP server to be running for full functionality
- Additional failure modes to handle (network, process, timeout)
- Testing becomes more complex (need to mock subprocess or run actual MCP server)

### Neutral

- Memory operations are now asynchronous (already were in interface)
- Logging verbosity increases for debugging MCP communication

## Implementation

### Step 1: Create MCP Client Adapter

**File**: `src/integrations/mcp-client.ts`

```typescript
import { spawn } from 'child_process';

export interface McpClientConfig {
  timeout: number;
  retries: number;
  retryDelay: number;
}

export class McpClient {
  private config: McpClientConfig;

  constructor(config: Partial<McpClientConfig> = {}) {
    this.config = {
      timeout: config.timeout ?? 10000,
      retries: config.retries ?? 3,
      retryDelay: config.retryDelay ?? 1000,
    };
  }

  async memoryStore(
    key: string,
    value: string,
    namespace: string,
    ttl?: number
  ): Promise<boolean> {
    return this.executeWithRetry(() =>
      this.executeCommand('npx', [
        'claude-flow@alpha',
        'memory',
        'store',
        '--key', key,
        '--value', value,
        '--namespace', namespace,
        ...(ttl ? ['--ttl', String(ttl)] : []),
      ])
    );
  }

  async memoryRetrieve(key: string, namespace: string): Promise<string | null> {
    const result = await this.executeWithRetry(() =>
      this.executeCommand('npx', [
        'claude-flow@alpha',
        'memory',
        'retrieve',
        '--key', key,
        '--namespace', namespace,
      ])
    );
    return result ?? null;
  }

  private async executeWithRetry<T>(
    fn: () => Promise<T>,
    attempt: number = 1
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (attempt < this.config.retries) {
        await this.delay(this.config.retryDelay * attempt);
        return this.executeWithRetry(fn, attempt + 1);
      }
      throw error;
    }
  }

  private executeCommand(cmd: string, args: string[]): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(cmd, args, { timeout: this.config.timeout });
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => { stdout += data; });
      proc.stderr.on('data', (data) => { stderr += data; });

      proc.on('close', (code) => {
        if (code === 0) {
          resolve(stdout.trim());
        } else {
          reject(new Error(`Command failed: ${stderr}`));
        }
      });

      proc.on('error', reject);
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
```

### Step 2: Update ClaudeFlowMemoryClient

Modify `weaver/src/memory/claude-flow-client.ts` to use the new MCP client with fallback:

```typescript
import { McpClient } from '../integrations/mcp-client.js';

export class ClaudeFlowMemoryClient implements MemoryClient {
  private mcpClient: McpClient;
  private fallbackStorage: Map<string, { value: string; ttl?: number }>;
  private useFallback: boolean = false;

  async store(key: string, value: string, namespace: string, ttl?: number): Promise<void> {
    try {
      await this.mcpClient.memoryStore(key, value, namespace, ttl);
      this.useFallback = false;
    } catch (error) {
      console.warn(`MCP store failed, using fallback: ${error}`);
      this.useFallback = true;
      this.fallbackStorage.set(`${namespace}/${key}`, { value, ttl });
    }
  }
}
```

### Non-Functional Requirements

| Requirement | Target | Measurement |
|-------------|--------|-------------|
| Response time (single op) | < 100ms | P95 latency |
| Batch operations | Max 5 concurrent | Semaphore limit |
| Connection timeout | 10 seconds | Config parameter |
| Retry attempts | 3 with backoff | Config parameter |

### Rollback Plan

If MCP integration causes issues:
1. Set `USE_MCP_FALLBACK=true` environment variable
2. System reverts to in-memory Map storage
3. Log warning about degraded functionality

## Testing Requirements

1. **Unit Tests**: Test MCP client with mocked subprocess
2. **Integration Tests**: Test with running claude-flow server
3. **E2E Tests**: Full vault sync workflow verification

## References

- SPEC-001-MCP-TOOL-EXECUTION.md (Original specification)
- [Claude-Flow Documentation](https://github.com/ruvnet/claude-flow)
- [MCP Protocol Specification](https://modelcontextprotocol.io/)
- GAP-001 in FEATURE-GAP-ANALYSIS.md
