# Rules Engine - Usage Guide

## Overview

The Rules Engine provides event-driven automation for agent workflows. It executes rules in response to file system events, memory sync operations, and other triggers.

## Key Features

- ✅ Event-driven rule execution (file:add, file:change, file:unlink, etc.)
- ✅ Async action processing with concurrent execution
- ✅ Condition evaluation before action execution
- ✅ Rule isolation (failures don't block other rules)
- ✅ Execution logging with circular buffer (max 1000 entries)
- ✅ Performance metrics tracking
- ✅ Priority-based rule ordering
- ✅ Admin dashboard for monitoring

## Quick Start

### 1. Create Rules Engine

```typescript
import { RulesEngine } from './agents/rules-engine.js';
import { ClaudeClient } from './agents/claude-client.js';
import { VaultMemorySync } from './memory/vault-sync.js';

// Initialize dependencies
const claudeClient = new ClaudeClient({
  apiKey: process.env.ANTHROPIC_API_KEY!
});

const vaultSync = new VaultMemorySync({
  memoryClient,
  shadowCache,
  vaultPath: '/path/to/vault'
});

// Create rules engine
const rulesEngine = new RulesEngine({
  claudeClient,
  vaultSync,
  maxLogEntries: 1000,
  logRetentionMs: 24 * 60 * 60 * 1000 // 24 hours
});
```

### 2. Register Rules

```typescript
// Simple rule: Auto-summarize new notes
rulesEngine.registerRule({
  id: 'auto-summarize',
  name: 'Auto-summarize new notes',
  trigger: 'file:add',
  condition: async (ctx) => {
    // Only summarize markdown files in notes/ folder
    return ctx.note?.path.startsWith('notes/') &&
           ctx.note?.path.endsWith('.md');
  },
  action: async (ctx) => {
    const content = ctx.note?.content || '';
    const summary = await ctx.claudeClient.sendMessage(
      `Summarize this note in 2-3 sentences:\n\n${content}`
    );

    // Store summary in memory
    await ctx.vaultSync.syncNoteToMemory({
      ...ctx.note!,
      frontmatter: JSON.stringify({
        ...JSON.parse(ctx.note!.frontmatter || '{}'),
        summary: summary.data
      })
    });
  },
  priority: 10 // Higher priority = executes first
});

// Complex rule: Extract tasks from meeting notes
rulesEngine.registerRule({
  id: 'extract-tasks',
  name: 'Extract tasks from meeting notes',
  trigger: 'file:add',
  condition: async (ctx) => {
    return ctx.note?.path.includes('/meetings/') ?? false;
  },
  action: async (ctx) => {
    const content = ctx.note?.content || '';
    const tasks = await ctx.claudeClient.sendMessage(
      'Extract all action items and tasks from this meeting note. ' +
      'Return as JSON array with fields: task, assignee, dueDate',
      {
        responseFormat: { type: 'json' }
      }
    );

    if (tasks.success && Array.isArray(tasks.data)) {
      // Store tasks in memory for task management
      await ctx.vaultSync.memoryClient.store(
        `tasks/${ctx.note!.path}`,
        tasks.data,
        { namespace: 'vault/tasks' }
      );
    }
  },
  priority: 5
});
```

### 3. Execute Rules

```typescript
// Trigger rules for a file event
await rulesEngine.executeRules({
  type: 'file:add',
  note: cachedFile,
  metadata: { source: 'file-watcher' }
});
```

## Rule Definition

```typescript
interface AgentRule {
  id: string;              // Unique identifier
  name: string;            // Human-readable name
  trigger: RuleTrigger;    // Event type
  condition?: (ctx) => Promise<boolean> | boolean;
  action: (ctx) => Promise<void> | void;
  priority?: number;       // Default: 0
  enabled?: boolean;       // Default: true
  metadata?: {
    description?: string;
    category?: string;
    tags?: string[];
  };
}
```

## Trigger Types

- `file:add` - New file created
- `file:change` - File modified
- `file:unlink` - File deleted
- `memory:sync` - Memory sync completed
- `agent:complete` - Agent action completed
- `manual` - Manually triggered

## Rule Context

Every rule receives a context object with:

```typescript
interface RuleContext {
  event: {
    type: RuleTrigger;
    timestamp: Date;
    data?: Record<string, unknown>;
  };
  note?: CachedFile;
  fileEvent?: FileEvent;
  metadata?: Record<string, unknown>;
  claudeClient: ClaudeClient;
  vaultSync: VaultMemorySync;
}
```

## Admin Dashboard

### Get Overview

```typescript
import { RulesAdminDashboard } from './agents/admin-dashboard.js';

const dashboard = new RulesAdminDashboard(rulesEngine);

const overview = dashboard.getOverview();
console.log(`Total rules: ${overview.totalRules}`);
console.log(`Success rate: ${overview.successRate}%`);
console.log(`Avg execution: ${overview.averageExecutionTime}ms`);
```

### Get Detailed Status

```typescript
const status = dashboard.getDetailedStatus();
status.forEach(rule => {
  console.log(`${rule.name}: ${rule.statistics.totalExecutions} executions`);
  console.log(`  Success: ${rule.statistics.successCount}`);
  console.log(`  Failed: ${rule.statistics.failureCount}`);
  console.log(`  Avg duration: ${rule.statistics.avgDurationMs}ms`);
});
```

### Get Performance Metrics

```typescript
const metrics = dashboard.getPerformanceMetrics();
console.log(`P95 execution time: ${metrics.p95ExecutionTimeMs}ms`);
console.log(`P99 execution time: ${metrics.p99ExecutionTimeMs}ms`);

console.log('\nSlowest rules:');
metrics.slowestRules.forEach(rule => {
  console.log(`  ${rule.ruleName}: ${rule.avgDurationMs}ms`);
});

console.log('\nMost active rules:');
metrics.mostActiveRules.forEach(rule => {
  console.log(`  ${rule.ruleName}: ${rule.executionCount} executions`);
});
```

### Get Health Status

```typescript
const health = dashboard.getHealthStatus();
console.log(`Status: ${health.status}`);

if (health.issues.length > 0) {
  console.log('\nIssues:');
  health.issues.forEach(issue => {
    console.log(`  [${issue.severity}] ${issue.message}`);
  });
}

if (health.recommendations.length > 0) {
  console.log('\nRecommendations:');
  health.recommendations.forEach(rec => {
    console.log(`  - ${rec}`);
  });
}
```

### Generate Text Report (CLI)

```typescript
const report = dashboard.getTextReport();
console.log(report);
```

Output:
```
======================================================================
  RULES ENGINE DASHBOARD
======================================================================

📊 OVERVIEW
----------------------------------------------------------------------
Total Rules:         5 (4 enabled, 1 disabled)
Total Executions:    127
Success Rate:        95.3%
Failure Rate:        4.7%
Avg Execution Time:  45.23ms

📈 RECENT ACTIVITY
----------------------------------------------------------------------
Last 1 Hour:    12 executions
Last 24 Hours:  127 executions
Last 7 Days:    450 executions

⚡ PERFORMANCE
----------------------------------------------------------------------
Min:  5.12ms
P50:  32.45ms
P95:  98.76ms
P99:  145.23ms
Max:  234.56ms

✅ HEALTH: HEALTHY
----------------------------------------------------------------------
✅ No issues detected

======================================================================
```

## Execution Logs

### Get Recent Logs

```typescript
// Get all recent logs
const logs = rulesEngine.getExecutionLogs({ limit: 10 });

// Get logs for specific rule
const ruleLogs = rulesEngine.getExecutionLogs({
  ruleId: 'auto-summarize',
  limit: 20
});

// Get only failed executions
const failures = rulesEngine.getExecutionLogs({
  status: 'failed',
  limit: 50
});

// Get logs since timestamp
const recentLogs = rulesEngine.getExecutionLogs({
  since: new Date(Date.now() - 60 * 60 * 1000), // Last hour
  limit: 100
});
```

### Log Entry Structure

```typescript
interface RuleExecutionLog {
  id: string;
  ruleId: string;
  ruleName: string;
  eventType: RuleTrigger;
  status: 'started' | 'success' | 'failed' | 'skipped';
  startedAt: Date;
  completedAt?: Date;
  durationMs?: number;
  error?: string;
  eventData?: Record<string, unknown>;
}
```

## Rule Management

### Unregister Rule

```typescript
rulesEngine.unregisterRule('auto-summarize');
```

### Get Rule

```typescript
const rule = rulesEngine.getRule('auto-summarize');
if (rule) {
  console.log(`Rule: ${rule.name}`);
  console.log(`Trigger: ${rule.trigger}`);
  console.log(`Priority: ${rule.priority}`);
}
```

### Get Rules by Trigger

```typescript
const fileAddRules = rulesEngine.getRulesByTrigger('file:add');
console.log(`Found ${fileAddRules.length} rules for file:add`);
```

### Clear Logs

```typescript
rulesEngine.clearLogs();
```

### Reset Statistics

```typescript
rulesEngine.resetStatistics();
```

## Integration with File Watcher

```typescript
import { FileWatcher } from './file-watcher/index.js';

const fileWatcher = new FileWatcher({
  watchPath: vaultPath,
  debounceDelay: 500
});

// Register event handler
fileWatcher.on('file:add', async (event) => {
  // Get file from shadow cache
  const file = shadowCache.getFile(event.relativePath);

  if (file) {
    // Execute rules
    await rulesEngine.executeRules({
      type: 'file:add',
      note: file,
      fileEvent: event
    });
  }
});

fileWatcher.on('file:change', async (event) => {
  const file = shadowCache.getFile(event.relativePath);

  if (file) {
    await rulesEngine.executeRules({
      type: 'file:change',
      note: file,
      fileEvent: event
    });
  }
});
```

## Best Practices

### 1. Use Conditions Effectively

```typescript
// ❌ Bad: Heavy processing in action
rulesEngine.registerRule({
  id: 'bad-rule',
  trigger: 'file:add',
  action: async (ctx) => {
    if (!ctx.note?.path.endsWith('.md')) return; // Wasteful
    // ... expensive processing
  }
});

// ✅ Good: Filter with condition
rulesEngine.registerRule({
  id: 'good-rule',
  trigger: 'file:add',
  condition: async (ctx) => ctx.note?.path.endsWith('.md') ?? false,
  action: async (ctx) => {
    // ... expensive processing
  }
});
```

### 2. Handle Errors Gracefully

```typescript
rulesEngine.registerRule({
  id: 'error-handling',
  trigger: 'file:add',
  action: async (ctx) => {
    try {
      const result = await ctx.claudeClient.sendMessage('...');

      if (!result.success) {
        console.error(`Claude API failed: ${result.error}`);
        return; // Don't throw, just log
      }

      // Process result
    } catch (error) {
      console.error('Unexpected error:', error);
      // Error is logged by engine, other rules continue
    }
  }
});
```

### 3. Use Priority for Dependencies

```typescript
// Higher priority = runs first
rulesEngine.registerRule({
  id: 'validate-frontmatter',
  trigger: 'file:add',
  priority: 100, // Run first
  action: async (ctx) => {
    // Validate and fix frontmatter
  }
});

rulesEngine.registerRule({
  id: 'process-note',
  trigger: 'file:add',
  priority: 50, // Run after validation
  action: async (ctx) => {
    // Process note (frontmatter is valid)
  }
});
```

### 4. Monitor Performance

```typescript
// Check for slow rules periodically
setInterval(() => {
  const metrics = dashboard.getPerformanceMetrics();

  if (metrics.p95ExecutionTimeMs > 2000) {
    console.warn('⚠️ Rules are running slow!');
    console.warn('Slowest rules:', metrics.slowestRules);
  }
}, 60000); // Every minute
```

### 5. Use Metadata for Context

```typescript
rulesEngine.registerRule({
  id: 'context-aware',
  trigger: 'file:add',
  action: async (ctx) => {
    const source = ctx.metadata?.source;

    if (source === 'user-edit') {
      // User manually created file
    } else if (source === 'sync') {
      // File synced from remote
    }
  }
});
```

## Performance Considerations

- **Concurrent Execution**: Rules execute in parallel (Promise.all)
- **Error Isolation**: One rule failure doesn't block others
- **Circular Buffer**: Logs auto-trim at max entries (default: 1000)
- **Memory Efficient**: Statistics use exponential moving average
- **Fast Filtering**: Rules indexed by trigger type

## Troubleshooting

### Rules not executing?

1. Check if rule is enabled: `rulesEngine.getRule('rule-id')?.enabled`
2. Check trigger type matches event: `rulesEngine.getRulesByTrigger('file:add')`
3. Check condition logic: Add logging to condition function
4. Check execution logs: `rulesEngine.getExecutionLogs({ ruleId: 'rule-id' })`

### High failure rate?

```typescript
const health = dashboard.getHealthStatus();
if (health.status !== 'healthy') {
  console.log('Issues:', health.issues);
  console.log('Recommendations:', health.recommendations);
}

const failures = rulesEngine.getExecutionLogs({ status: 'failed' });
failures.forEach(log => {
  console.log(`${log.ruleName}: ${log.error}`);
});
```

### Rules running slow?

```typescript
const metrics = dashboard.getPerformanceMetrics();
console.log('Slowest rules:', metrics.slowestRules);

// Optimize slow rules or disable them
if (metrics.p95ExecutionTimeMs > 2000) {
  rulesEngine.unregisterRule('slow-rule-id');
}
```

## Example: Complete Integration

```typescript
import { RulesEngine } from './agents/rules-engine.js';
import { RulesAdminDashboard } from './agents/admin-dashboard.js';

// Initialize
const rulesEngine = new RulesEngine({ claudeClient, vaultSync });
const dashboard = new RulesAdminDashboard(rulesEngine);

// Register rules
rulesEngine.registerRule({
  id: 'auto-tag',
  name: 'Auto-tag notes with AI',
  trigger: 'file:add',
  condition: async (ctx) => ctx.note?.path.endsWith('.md') ?? false,
  action: async (ctx) => {
    const content = ctx.note?.content || '';
    const tags = await ctx.claudeClient.sendMessage(
      `Suggest 3-5 relevant tags for this note:\n\n${content}`,
      { responseFormat: { type: 'list' } }
    );

    if (tags.success && Array.isArray(tags.data)) {
      await ctx.vaultSync.updateNoteFrontmatter(ctx.note!.path, {
        tags: tags.data
      });
    }
  }
});

// Handle file events
fileWatcher.on('file:add', async (event) => {
  const file = shadowCache.getFile(event.relativePath);
  if (file) {
    await rulesEngine.executeRules({
      type: 'file:add',
      note: file,
      fileEvent: event
    });
  }
});

// Monitor health
setInterval(() => {
  const health = dashboard.getHealthStatus();
  if (health.status !== 'healthy') {
    console.warn('Rules engine health check:', health);
  }
}, 300000); // Every 5 minutes

// Generate daily report
setInterval(() => {
  console.log(dashboard.getTextReport());
}, 86400000); // Every 24 hours
```

## Next Steps

- Explore [example rules](./examples/rules/) for common use cases
- Integrate with [file watcher](./file-watcher-usage.md)
- Set up [admin monitoring](./admin-dashboard-setup.md)
- Configure [Claude AI](./claude-client-usage.md)
