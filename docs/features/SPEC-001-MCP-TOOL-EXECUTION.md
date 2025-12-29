# Feature Specification: MCP Tool Execution Integration

**Spec ID**: SPEC-001
**Priority**: CRITICAL
**Estimated Effort**: 16-24 hours
**Dependencies**: None (foundational)

## Overview

Replace mock MCP tool implementations with actual MCP client calls to enable real memory synchronization, agent coordination, and vault management.

## Current State

### Problem
The `ClaudeFlowMemoryClient` in `weaver/src/memory/claude-flow-client.ts` uses an internal `Map` for storage simulation:

```typescript
// Current mock implementation
private storage = new Map<string, { value: string; ttl?: number }>();

async store(key: string, value: string, namespace: string, ttl?: number): Promise<void> {
  const fullKey = this.buildKey(key, namespace);
  this.storage.set(fullKey, { value, ttl });
  // TODO: Replace with actual MCP call
}
```

### Impact
- All memory operations are ephemeral (lost on restart)
- No cross-session persistence
- Agent coordination doesn't actually coordinate
- Vault sync doesn't actually sync to claude-flow memory

## Requirements

### Functional Requirements

1. **FR-001**: Replace `ClaudeFlowMemoryClient` mock storage with actual MCP calls
2. **FR-002**: Use existing `ClaudeFlowCLI` wrapper from `weaver/src/claude-flow/cli-wrapper.ts`
3. **FR-003**: Handle MCP connection failures gracefully with fallback
4. **FR-004**: Implement retry logic for transient failures
5. **FR-005**: Support batch operations via `mcp__claude-flow__batch_process`

### Non-Functional Requirements

1. **NFR-001**: Response time < 100ms for single operations
2. **NFR-002**: Batch operations should be parallelized (max 5 concurrent)
3. **NFR-003**: Connection timeout: 10 seconds
4. **NFR-004**: Retry attempts: 3 with exponential backoff

## Technical Specification

### Architecture

```
┌─────────────────────┐      ┌──────────────────────┐
│ Knowledge Graph     │      │ Claude-Flow MCP      │
│ Agent               │      │ Server               │
│                     │      │                      │
│ ┌─────────────────┐ │      │ ┌──────────────────┐ │
│ │ VaultMemorySync │ │──────│▶│ memory_usage     │ │
│ └────────┬────────┘ │      │ │ memory_search    │ │
│          │          │      │ │ memory_persist   │ │
│          ▼          │      │ └──────────────────┘ │
│ ┌─────────────────┐ │      │                      │
│ │ ClaudeFlowClient│ │      │ ┌──────────────────┐ │
│ │ (MCP Client)    │─│──────│▶│ swarm_init       │ │
│ └─────────────────┘ │      │ │ agent_spawn      │ │
│                     │      │ │ task_orchestrate │ │
└─────────────────────┘      └──────────────────────┘
```

### Implementation Steps

#### Step 1: Create MCP Client Adapter

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

  async memorySearch(
    pattern: string,
    namespace: string,
    limit: number = 100
  ): Promise<string[]> {
    const result = await this.executeWithRetry(() =>
      this.executeCommand('npx', [
        'claude-flow@alpha',
        'memory',
        'search',
        '--pattern', pattern,
        '--namespace', namespace,
        '--limit', String(limit),
      ])
    );
    return result ? JSON.parse(result) : [];
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

#### Step 2: Update ClaudeFlowMemoryClient

**File**: `weaver/src/memory/claude-flow-client.ts` (modify existing)

```typescript
import { McpClient } from '../integrations/mcp-client.js';

export class ClaudeFlowMemoryClient implements MemoryClient {
  private mcpClient: McpClient;
  private fallbackStorage: Map<string, { value: string; ttl?: number }>;
  private useFallback: boolean = false;

  constructor(config?: McpClientConfig) {
    this.mcpClient = new McpClient(config);
    this.fallbackStorage = new Map();
  }

  async store(
    key: string,
    value: string,
    namespace: string = 'default',
    ttl?: number
  ): Promise<void> {
    try {
      await this.mcpClient.memoryStore(key, value, namespace, ttl);
      this.useFallback = false;
    } catch (error) {
      console.warn(`MCP store failed, using fallback: ${error}`);
      this.useFallback = true;
      this.fallbackStorage.set(`${namespace}/${key}`, { value, ttl });
    }
  }

  async retrieve(key: string, namespace: string = 'default'): Promise<string | null> {
    if (this.useFallback) {
      const data = this.fallbackStorage.get(`${namespace}/${key}`);
      return data?.value ?? null;
    }

    try {
      return await this.mcpClient.memoryRetrieve(key, namespace);
    } catch (error) {
      console.warn(`MCP retrieve failed: ${error}`);
      return null;
    }
  }

  async search(
    pattern: string,
    namespace: string = 'default',
    limit: number = 100
  ): Promise<MemorySearchResult[]> {
    try {
      const results = await this.mcpClient.memorySearch(pattern, namespace, limit);
      return results.map((r) => JSON.parse(r));
    } catch (error) {
      console.warn(`MCP search failed: ${error}`);
      return [];
    }
  }
}
```

#### Step 3: Update ClaudeFlowIntegration

**File**: `packages/knowledge-graph-agent/src/integrations/claude-flow.ts` (modify existing)

```typescript
import { McpClient } from './mcp-client.js';

export class ClaudeFlowIntegration {
  private mcpClient: McpClient;
  private config: ClaudeFlowConfig;

  constructor(config: ClaudeFlowConfig) {
    this.config = config;
    this.mcpClient = new McpClient();
  }

  async syncToMemory(db: KnowledgeGraphDatabase): Promise<SyncResult> {
    const stats = db.getStats();
    const results: SyncResult = { synced: 0, failed: 0, errors: [] };

    // Build tag index
    const tagIndex = new Map<string, string[]>();
    // ... existing tag index logic ...

    // Sync nodes using actual MCP calls
    for (const row of stats.nodes) {
      try {
        const node = db.getNode(row.id);
        if (node) {
          await this.syncNode(node);
          results.synced++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push(`Failed to sync node ${row.id}: ${error}`);
      }
    }

    // Sync tag index
    await this.mcpClient.memoryStore(
      'index/tags',
      JSON.stringify(Object.fromEntries(tagIndex)),
      this.config.namespace,
      this.config.defaultTTL
    );

    return results;
  }

  async syncNode(node: KnowledgeNode): Promise<boolean> {
    const key = `node/${node.id}`;
    const value = JSON.stringify({
      id: node.id,
      title: node.title,
      type: node.type,
      status: node.status,
      tags: node.tags,
      links: node.links,
      summary: this.extractSummary(node.content),
      updatedAt: node.updatedAt,
    });

    return this.mcpClient.memoryStore(
      key,
      value,
      this.config.namespace,
      this.config.defaultTTL
    );
  }
}
```

### Testing Requirements

1. **Unit Tests**
   - Test MCP client with mocked subprocess
   - Test retry logic with simulated failures
   - Test fallback behavior when MCP unavailable

2. **Integration Tests**
   - Test actual MCP communication with running claude-flow server
   - Test batch operations performance
   - Test cross-session persistence

3. **E2E Tests**
   - Test full vault sync workflow
   - Test agent coordination with shared memory

### Acceptance Criteria

- [ ] `ClaudeFlowMemoryClient.store()` calls actual MCP tool
- [ ] `ClaudeFlowMemoryClient.retrieve()` returns data from MCP server
- [ ] `ClaudeFlowIntegration.syncToMemory()` persists to claude-flow memory
- [ ] Retry logic handles transient failures
- [ ] Graceful fallback when MCP server unavailable
- [ ] Batch operations complete within 2 seconds for 100 nodes
- [ ] All existing tests continue to pass

## Rollback Plan

If MCP integration causes issues:
1. Set `USE_MCP_FALLBACK=true` environment variable
2. System reverts to in-memory Map storage
3. Log warning about degraded functionality

## Success Metrics

- Memory operations succeed 99%+ of the time when MCP server available
- Latency < 100ms for single operations
- Batch sync of 1000 nodes completes in < 30 seconds
- Zero data loss during graceful shutdown
