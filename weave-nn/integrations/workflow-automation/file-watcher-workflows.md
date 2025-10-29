---
title: File Watcher → Weaver Workflows Integration
integration_type: event-driven
systems:
  - name: File System Watcher (chokidar)
    role: producer
  - name: Weaver Workflows
    role: orchestrator
direction: unidirectional
protocol: In-process (function calls)
authentication: none (same process)
status: active
created: {}
updated: {}
type: workflow
visual:
  icon: 🔄
  cssclasses:
    - type-workflow
    - status-active
version: '3.0'
updated_date: '2025-10-28'
icon: 🔄
---

# File Watcher → Weaver Workflows Integration

## Overview

This integration uses `chokidar` to watch Obsidian vault file system changes and trigger durable workflows in Weaver. When a `.md` file is created, modified, or deleted, workflows automatically update the knowledge graph, extract memory, and trigger downstream actions.

**Key Benefit**: Stateful, resumable event processing. If Weaver crashes mid-workflow, it automatically resumes from the last completed step.

## Systems Involved

### File System Watcher (chokidar)
- **Role**: Producer (event detection)
- **Technology**: chokidar v3.5+ (30M+ downloads/month)
- **Watch Target**: Obsidian vault directory (recursive)
- **Events**: `add`, `change`, `unlink` (create, modify, delete)

### Weaver Workflows
- **Role**: Orchestrator (durable, stateful execution)
- **Technology**: workflow.dev SDK
- **Execution**: In-process (same Node.js runtime as file watcher)
- **State**: Persisted to local disk (SQLite)

## Integration Architecture

### Data Flow

```
[File System Event] → [chokidar] → [Event Handler]
                                          ↓
                                [Parse & Validate]
                                          ↓
                              [Trigger Durable Workflow]
                                          ↓
                    ┌─────────────────────┴─────────────────────┐
                    │                                             │
          [Step 1: Extract Memory]              [Step 2: Update Shadow Cache]
                    │                                             │
                    ↓                                             ↓
          [Step 3: Generate Embeddings]        [Step 4: Update Graph Links]
                    │                                             │
                    └─────────────────────┬─────────────────────┘
                                          ↓
                              [Step 5: Trigger Git Commit]
                                          ↓
                                   [Workflow Complete]
```

### Components

#### 1. File Watcher Setup
**File**: `weaver/src/watchers/vault-watcher.ts`

```typescript
import chokidar from 'chokidar';
import path from 'path';
import { triggerWorkflow } from '../workflows/index.js';
import { logger } from '../utils/logger.js';

export interface VaultWatcherConfig {
  vaultPath: string;
  ignorePatterns: string[];
  awaitWriteFinish: {
    stabilityThreshold: number;
    pollInterval: number;
  };
}

export class VaultWatcher {
  private watcher: chokidar.FSWatcher | null = null;

  constructor(private config: VaultWatcherConfig) {}

  start(): void {
    this.watcher = chokidar.watch(this.config.vaultPath, {
      ignored: [
        /(^|[\/\\])\../, // Hidden files
        ...this.config.ignorePatterns,
        '**/node_modules/**',
        '**/.git/**',
        '**/.obsidian/workspace*.json', // Ignore workspace (too frequent)
      ],
      persistent: true,
      ignoreInitial: true, // Don't trigger on startup
      awaitWriteFinish: this.config.awaitWriteFinish,
    });

    // File created
    this.watcher.on('add', async (filePath) => {
      if (this.isMarkdownFile(filePath)) {
        await this.handleFileCreate(filePath);
      }
    });

    // File modified
    this.watcher.on('change', async (filePath) => {
      if (this.isMarkdownFile(filePath)) {
        await this.handleFileUpdate(filePath);
      }
    });

    // File deleted
    this.watcher.on('unlink', async (filePath) => {
      if (this.isMarkdownFile(filePath)) {
        await this.handleFileDelete(filePath);
      }
    });

    // Error handling
    this.watcher.on('error', (error) => {
      logger.error('File watcher error', { error });
    });

    logger.info('Vault watcher started', {
      path: this.config.vaultPath,
      ignorePatterns: this.config.ignorePatterns,
    });
  }

  stop(): void {
    if (this.watcher) {
      this.watcher.close();
      logger.info('Vault watcher stopped');
    }
  }

  private isMarkdownFile(filePath: string): boolean {
    return path.extname(filePath) === '.md';
  }

  private async handleFileCreate(filePath: string): Promise<void> {
    const relativePath = path.relative(this.config.vaultPath, filePath);

    logger.info('File created', { path: relativePath });

    await triggerWorkflow('vault-file-created', {
      filePath: relativePath,
      absolutePath: filePath,
      timestamp: Date.now(),
    });
  }

  private async handleFileUpdate(filePath: string): Promise<void> {
    const relativePath = path.relative(this.config.vaultPath, filePath);

    logger.info('File updated', { path: relativePath });

    await triggerWorkflow('vault-file-updated', {
      filePath: relativePath,
      absolutePath: filePath,
      timestamp: Date.now(),
    });
  }

  private async handleFileDelete(filePath: string): Promise<void> {
    const relativePath = path.relative(this.config.vaultPath, filePath);

    logger.info('File deleted', { path: relativePath });

    await triggerWorkflow('vault-file-deleted', {
      filePath: relativePath,
      timestamp: Date.now(),
    });
  }
}
```

#### 2. Durable Workflow Definition
**File**: `weaver/src/workflows/vault-file-created.ts`

```typescript
import { workflow } from '@workflowdev/sdk';
import { readFile } from 'fs/promises';
import { parseFrontmatter } from '../utils/frontmatter.js';
import { shadowCache } from '../database/shadow-cache.js';
import { extractLinks, extractHeadings } from '../utils/markdown-parser.js';

export const vaultFileCreatedWorkflow = workflow(
  'vault-file-created',
  async (ctx, input: { filePath: string; absolutePath: string; timestamp: number }) => {
    // Step 1: Read file content
    const content = await ctx.step('read-file', async () => {
      return await readFile(input.absolutePath, 'utf-8');
    });

    // Step 2: Parse frontmatter
    const { frontmatter, body } = await ctx.step('parse-frontmatter', async () => {
      return parseFrontmatter(content);
    });

    // Step 3: Extract links and structure
    const structure = await ctx.step('extract-structure', async () => {
      return {
        links: extractLinks(body),
        headings: extractHeadings(body),
        tags: frontmatter.tags || [],
      };
    });

    // Step 4: Update shadow cache
    await ctx.step('update-shadow-cache', async () => {
      await shadowCache.upsertNode({
        filePath: input.filePath,
        nodeType: frontmatter.type || 'note',
        frontmatter,
        tags: structure.tags,
        links: structure.links,
        headings: structure.headings,
        updatedAt: new Date(input.timestamp),
      });
    });

    // Step 5: Extract memory (if configured)
    if (frontmatter.type && ['concept', 'decision', 'feature'].includes(frontmatter.type)) {
      await ctx.step('extract-memory', async () => {
        // Call MCP tool to extract and store memory
        // This will be implemented in Phase 7 (Hive Mind integration)
        return { extracted: true };
      });
    }

    // Step 6: Trigger git commit (debounced)
    await ctx.step('trigger-git-commit', async () => {
      // Enqueue for git auto-commit (5 second debounce)
      await ctx.sendEvent('git-commit-queue', {
        filePath: input.filePath,
        timestamp: input.timestamp,
      });
    });

    return {
      success: true,
      filePath: input.filePath,
      nodeType: frontmatter.type,
      linksCount: structure.links.length,
    };
  }
);
```

#### 3. Workflow Trigger System
**File**: `weaver/src/workflows/index.ts`

```typescript
import { WorkflowClient } from '@workflowdev/sdk';
import { vaultFileCreatedWorkflow } from './vault-file-created.js';
import { vaultFileUpdatedWorkflow } from './vault-file-updated.js';
import { vaultFileDeletedWorkflow } from './vault-file-deleted.js';

// Initialize workflow client
const workflowClient = new WorkflowClient({
  baseUrl: process.env.WORKFLOW_API_URL || 'http://localhost:3000',
  apiKey: process.env.WORKFLOW_API_KEY,
});

// Register workflows
workflowClient.register(vaultFileCreatedWorkflow);
workflowClient.register(vaultFileUpdatedWorkflow);
workflowClient.register(vaultFileDeletedWorkflow);

export async function triggerWorkflow(
  workflowName: string,
  input: any
): Promise<string> {
  const execution = await workflowClient.trigger(workflowName, input);

  return execution.id;
}

export async function getWorkflowStatus(executionId: string) {
  return await workflowClient.getExecution(executionId);
}
```

## Configuration

### Environment Variables

```bash
# Vault Configuration
VAULT_PATH=/path/to/obsidian/vault

# File Watcher Configuration
WATCHER_IGNORE_PATTERNS=".obsidian/workspace*,.trash/**"
WATCHER_STABILITY_THRESHOLD=300  # ms (wait for file writes to finish)
WATCHER_POLL_INTERVAL=100        # ms

# Workflow Configuration
WORKFLOW_API_URL=http://localhost:3000
WORKFLOW_API_KEY=<your-workflow-dev-api-key>
```

### Workflow Configuration File

**File**: `weaver/config/workflows.yml`

```yaml
workflows:
  vault-file-created:
    enabled: true
    timeout: 30s
    retries: 3
    steps:
      - name: read-file
        timeout: 5s
      - name: parse-frontmatter
        timeout: 5s
      - name: extract-structure
        timeout: 10s
      - name: update-shadow-cache
        timeout: 5s
        retries: 3
      - name: extract-memory
        timeout: 15s
        optional: true
      - name: trigger-git-commit
        timeout: 1s

  vault-file-updated:
    enabled: true
    timeout: 30s
    retries: 3

  vault-file-deleted:
    enabled: true
    timeout: 15s
    retries: 2
```

## Event Formats

### File Created Event

```typescript
{
  filePath: "concepts/durable-workflows.md",
  absolutePath: "/home/user/vault/concepts/durable-workflows.md",
  timestamp: 1698765432000
}
```

### File Updated Event

```typescript
{
  filePath: "concepts/durable-workflows.md",
  absolutePath: "/home/user/vault/concepts/durable-workflows.md",
  timestamp: 1698765532000,
  previousHash: "abc123...", // Optional: for change detection
  currentHash: "def456..."
}
```

### File Deleted Event

```typescript
{
  filePath: "concepts/old-concept.md",
  timestamp: 1698765632000
}
```

## Error Handling

### Workflow Failures

**Automatic Retry with Exponential Backoff**:

```typescript
await ctx.step('update-shadow-cache',
  async () => {
    await shadowCache.upsertNode(node);
  },
  {
    retries: 3,
    backoff: 'exponential', // 1s, 2s, 4s
  }
);
```

**Fallback Behavior**:

```typescript
try {
  await ctx.step('extract-memory', async () => {
    return await extractMemory(content);
  });
} catch (error) {
  // Memory extraction failed, log and continue
  logger.error('Memory extraction failed', { error, filePath });
  return { extracted: false, error: error.message };
}
```

### File System Errors

**Scenario**: File deleted before workflow completes

```typescript
await ctx.step('read-file', async () => {
  try {
    return await readFile(input.absolutePath, 'utf-8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.warn('File deleted during workflow', { path: input.filePath });
      throw new WorkflowCancellationError('File no longer exists');
    }
    throw error;
  }
});
```

### Debouncing Rapid Changes

**Scenario**: User types rapidly, triggering multiple `change` events

```typescript
private debounceTimers = new Map<string, NodeJS.Timeout>();

private async handleFileUpdate(filePath: string): Promise<void> {
  // Cancel existing timer
  const existingTimer = this.debounceTimers.get(filePath);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }

  // Set new timer (5 second debounce)
  const timer = setTimeout(async () => {
    await triggerWorkflow('vault-file-updated', {
      filePath,
      absolutePath: path.join(this.config.vaultPath, filePath),
      timestamp: Date.now(),
    });
    this.debounceTimers.delete(filePath);
  }, 5000);

  this.debounceTimers.set(filePath, timer);
}
```

## Monitoring and Observability

### Metrics

Track via Weaver:

- **Event rate**: File events/minute
- **Workflow duration**: p50, p95, p99 for each workflow
- **Failure rate**: Failed workflows/total workflows
- **Step duration**: Time spent in each workflow step
- **Backlog size**: Pending workflows waiting for execution

### Workflow Traces

**View workflow execution history**:

```typescript
const trace = await workflowClient.getTrace(executionId);

console.log(trace.steps);
// [
//   { name: 'read-file', duration: '120ms', status: 'completed', at: '10:16:00' },
//   { name: 'parse-frontmatter', duration: '45ms', status: 'completed', at: '10:16:01' },
//   { name: 'extract-structure', duration: '230ms', status: 'completed', at: '10:16:02' },
//   { name: 'update-shadow-cache', duration: '180ms', status: 'failed', at: '10:16:03' },
//   { name: 'update-shadow-cache', duration: '150ms', status: 'completed', at: '10:16:05' } // Retry
// ]
```

### Logging

```typescript
logger.info('Workflow completed', {
  workflowName: 'vault-file-created',
  executionId,
  duration: trace.duration,
  steps: trace.steps.length,
  retries: trace.steps.filter(s => s.attempt > 1).length,
});
```

## Testing

### Integration Tests

**File**: `weaver/tests/integration/file-watcher-workflows.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { VaultWatcher } from '../../src/watchers/vault-watcher.js';
import { writeFile, unlink } from 'fs/promises';
import path from 'path';

describe('File Watcher → Workflows Integration', () => {
  let watcher: VaultWatcher;
  const testVaultPath = path.join(__dirname, 'test-vault');

  beforeAll(async () => {
    watcher = new VaultWatcher({
      vaultPath: testVaultPath,
      ignorePatterns: [],
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    });

    watcher.start();
  });

  afterAll(async () => {
    watcher.stop();
  });

  it('should trigger workflow on file creation', async () => {
    const testFile = path.join(testVaultPath, 'test-note.md');

    // Create file
    await writeFile(testFile, '---\ntags: [test]\n---\n# Test');

    // Wait for workflow completion
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify workflow executed (check shadow cache)
    const node = await shadowCache.getNode('test-note.md');
    expect(node).toBeDefined();
    expect(node.tags).toContain('test');

    // Cleanup
    await unlink(testFile);
  });

  it('should handle file update with debouncing', async () => {
    const testFile = path.join(testVaultPath, 'test-update.md');

    // Initial write
    await writeFile(testFile, '---\ntags: [test]\n---\n# Original');

    // Rapid updates (should be debounced)
    await writeFile(testFile, '---\ntags: [test]\n---\n# Update 1');
    await writeFile(testFile, '---\ntags: [test]\n---\n# Update 2');
    await writeFile(testFile, '---\ntags: [test]\n---\n# Update 3');

    // Wait for debounce + workflow
    await new Promise(resolve => setTimeout(resolve, 7000));

    // Verify only one workflow executed
    const traces = await getWorkflowTraces('vault-file-updated');
    const thisFileTraces = traces.filter(t => t.input.filePath === 'test-update.md');

    expect(thisFileTraces.length).toBe(1); // Only one execution

    // Cleanup
    await unlink(testFile);
  });
});
```

### Manual Testing

```bash
# 1. Start Weaver
npm run dev

# 2. Watch logs
tail -f logs/weaver.log

# 3. Create note in Obsidian
# Create new note with frontmatter:
---
type: concept
tags: [test, integration]
---

# Test Concept

This is a test note.

# 4. Verify workflow execution in logs
# Should see:
# [INFO] File created: test-concept.md
# [INFO] Workflow started: vault-file-created
# [INFO] Step completed: read-file (120ms)
# [INFO] Step completed: parse-frontmatter (45ms)
# [INFO] Step completed: extract-structure (230ms)
# [INFO] Step completed: update-shadow-cache (180ms)
# [INFO] Workflow completed: vault-file-created (575ms total)

# 5. Verify shadow cache updated
sqlite3 weaver/data/shadow-cache.db "SELECT * FROM nodes WHERE file_path='test-concept.md';"
```

## Deployment

### Prerequisites

1. **Node.js 20+** - Runtime
2. **Obsidian Vault** - Initialized and accessible
3. **Workflow.dev Account** - API key obtained
4. **SQLite** - For shadow cache (included with Node.js)

### Deployment Steps

```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with VAULT_PATH, WORKFLOW_API_KEY

# 2. Build Weaver
npm run build

# 3. Start Weaver (includes file watcher)
npm start

# 4. Verify watcher started
# Check logs for: "Vault watcher started"

# 5. Test with Obsidian
# Create/edit note and verify workflow execution
```

## Troubleshooting

### Issue: "File watcher not triggering"

**Cause**: Invalid vault path or permissions

**Solution**:
```bash
# Check path exists
ls -la "$VAULT_PATH"

# Check read permissions
test -r "$VAULT_PATH" && echo "Readable" || echo "Not readable"

# Fix permissions
chmod -R u+r "$VAULT_PATH"
```

### Issue: "Workflow fails at 'update-shadow-cache'"

**Cause**: Database locked or corrupted

**Solution**:
```bash
# Check database integrity
sqlite3 weaver/data/shadow-cache.db "PRAGMA integrity_check;"

# If corrupted, rebuild from vault
npm run rebuild-cache
```

### Issue: "Multiple workflows for same file"

**Cause**: Debouncing not working

**Solution**: Check `WATCHER_STABILITY_THRESHOLD` is set correctly (300ms recommended).

## Related Documentation

- [[technical/chokidar|Chokidar File Watcher]]
- [[technical/workflow-dev|Workflow.dev]]
- [[concepts/durable-workflows|Durable Workflows Concept]]
- [[integrations/obsidian/obsidian-weaver-mcp|Obsidian ↔ Weaver MCP]]
- [[docs/local-first-architecture-overview|Local-First Architecture]]

## Maintenance

### Version Compatibility

- **chokidar**: v3.5.0+
- **@workflowdev/sdk**: v1.0.0+
- **Node.js**: 20.0.0+

### Update Schedule

- **Dependency updates**: Monthly
- **Performance review**: Quarterly
- **Workflow optimization**: Bi-annual

---

**Status**: ✅ **Active** - Core MVP integration
**Last Updated**: 2025-10-23
**Maintainer**: Weave-NN Team
