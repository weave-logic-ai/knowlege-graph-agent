# Activity Logging Integration Guide

How to integrate activity logging into Weaver components for 100% AI transparency.

## Overview

Every component in Weaver should log its activity to provide complete transparency of AI operations. This guide shows how to integrate activity logging into different parts of the system.

## Core Principles

1. **Log Everything**: Every tool call, workflow step, and AI interaction
2. **Contextual**: Set phase and task before logging
3. **Structured**: Use consistent data structures
4. **Non-Blocking**: Logging failures should not break functionality
5. **Timestamped**: All entries have ISO timestamps

---

## MCP Server Integration

### Basic Tool Logging

```typescript
// src/mcp-server/tools/my-tool.ts
import { withActivityLogging } from '../middleware/activity-logging-middleware';

export const myTool = {
  name: 'my_tool',
  description: 'My custom tool',

  async execute(params: MyParams) {
    // Tool implementation
    return result;
  }
};

// Wrap with activity logging
export const myToolWithLogging = withActivityLogging('my_tool', myTool.execute);
```

### Server-Wide Integration

```typescript
// src/mcp-server/index.ts
import { logServerEvent, logMCPRequest, logMCPResponse } from './middleware/activity-logging-middleware';
import { getActivityLogger } from '../vault-logger/activity-logger';

class MCPServer {
  async start() {
    const logger = getActivityLogger();
    logger.setPhase('mcp-server');
    logger.setTask('Start MCP server');

    await logServerEvent('start', {
      tools: this.tools.map(t => t.name),
      timestamp: new Date().toISOString(),
    });

    // Start server...
  }

  async handleRequest(method: string, params: unknown) {
    await logMCPRequest(method, params);

    try {
      const response = await this.execute(method, params);
      await logMCPResponse(method, response);
      return response;
    } catch (error) {
      const logger = getActivityLogger();
      await logger.logError(error as Error, { method, params });
      throw error;
    }
  }
}
```

---

## Workflow Engine Integration

### Individual Workflow Logging

```typescript
// src/workflows/my-workflow.ts
import { getActivityLogger } from '../vault-logger/activity-logger';
import type { Workflow, WorkflowContext } from '../workflow-engine/types';

export const myWorkflow: Workflow = {
  id: 'my-workflow',
  name: 'My Custom Workflow',
  triggers: ['file:change'],
  enabled: true,

  async execute(context: WorkflowContext) {
    const logger = getActivityLogger();
    logger.setPhase('workflows');
    logger.setTask(`Execute: ${this.name}`);

    // Log workflow start
    await logger.logPrompt(`Starting workflow: ${this.name}`, {
      workflowId: this.id,
      trigger: context.eventType,
      filePath: context.filePath,
    });

    try {
      // Step 1: Query files
      const files = await context.shadowCache.queryFiles({ tags: ['ai'] });
      await logger.logToolCall(
        'shadow_cache.query_files',
        { tags: ['ai'] },
        { files: files.length },
        10
      );

      // Step 2: Process files
      for (const file of files) {
        await this.processFile(file);
      }

      // Log results
      await logger.logResults({
        workflowId: this.id,
        success: true,
        filesProcessed: files.length,
      });

    } catch (error) {
      await logger.logError(error as Error, {
        workflowId: this.id,
        step: 'execute',
      });
      throw error;
    }
  }
};
```

### Engine-Wide Integration

```typescript
// src/workflow-engine/index.ts
import { withWorkflowLogging, logFileWatcherEvent } from './middleware/activity-logging-middleware';
import { getActivityLogger } from '../vault-logger/activity-logger';

class WorkflowEngine {
  private workflows: Workflow[] = [];

  register(workflow: Workflow) {
    // Wrap workflow with logging middleware
    const wrappedWorkflow = withWorkflowLogging(workflow);
    this.workflows.push(wrappedWorkflow);
  }

  async onFileChange(eventType: string, filePath: string) {
    // Log file watcher event
    await logFileWatcherEvent(eventType, filePath, {
      matchingWorkflows: this.workflows.filter(w =>
        w.triggers.includes(`file:${eventType}`)
      ).length,
    });

    // Execute matching workflows
    for (const workflow of this.workflows) {
      if (workflow.triggers.includes(`file:${eventType}`)) {
        await workflow.execute({ eventType, filePath, shadowCache: this.shadowCache });
      }
    }
  }
}
```

---

## AI Agent Integration

### Agent Rule Logging

```typescript
// src/agents/rules/auto-tag-rule.ts
import { getActivityLogger } from '../../vault-logger/activity-logger';

export class AutoTagRule {
  async execute(content: string): Promise<string[]> {
    const logger = getActivityLogger();
    logger.setPhase('ai-agents');
    logger.setTask('Auto-tag: Generate tag suggestions');

    // Log analysis request
    await logger.logPrompt('Analyzing content for tag suggestions', {
      contentLength: content.length,
      rule: 'auto-tag',
    });

    try {
      // Call Claude API
      const startTime = Date.now();
      const response = await this.claudeClient.completions({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: this.buildPrompt(content) }],
        max_tokens: 500,
      });
      const duration = Date.now() - startTime;

      // Log API call
      await logger.logToolCall(
        'claude.completions',
        {
          model: 'claude-3-5-sonnet-20241022',
          prompt_length: this.buildPrompt(content).length,
        },
        {
          tags: response.tags,
          confidence: response.confidence,
        },
        duration
      );

      // Log results
      await logger.logResults({
        suggestedTags: response.tags,
        confidence: response.confidence,
        applied: false, // Tags suggested but not yet applied
      });

      return response.tags;

    } catch (error) {
      await logger.logError(error as Error, {
        rule: 'auto-tag',
        contentLength: content.length,
      });
      return []; // Return empty array on error
    }
  }
}
```

---

## Git Integration

### Git Operations Logging

```typescript
// src/git/auto-commit-service.ts
import { getActivityLogger } from '../vault-logger/activity-logger';

export class AutoCommitService {
  async commit(files: string[], message: string) {
    const logger = getActivityLogger();
    logger.setPhase('git-automation');
    logger.setTask('Auto-commit changes');

    await logger.logPrompt('Creating git commit', {
      files: files.length,
      message,
    });

    try {
      const startTime = Date.now();
      const result = await this.gitClient.commit(files, message);
      const duration = Date.now() - startTime;

      await logger.logToolCall(
        'git.commit',
        {
          files,
          message,
        },
        {
          commitHash: result.commit,
          branch: result.branch,
        },
        duration
      );

      await logger.logResults({
        committed: true,
        hash: result.commit,
        filesCommitted: files.length,
      });

      return result;

    } catch (error) {
      await logger.logError(error as Error, {
        files,
        operation: 'commit',
      });
      throw error;
    }
  }
}
```

---

## Testing Integration

### Test Logging

```typescript
// tests/integration/my-feature.test.ts
import { initializeActivityLogger, getActivityLogger } from '../../src/vault-logger/activity-logger';

describe('My Feature', () => {
  let logger: ActivityLogger;

  beforeEach(async () => {
    logger = await initializeActivityLogger('/test/vault');
    logger.setPhase('testing');
  });

  afterEach(async () => {
    await logger.shutdown();
  });

  it('should log test execution', async () => {
    logger.setTask('Test: My feature works');

    await logger.logPrompt('Testing feature X');

    const result = await myFeature.execute();

    await logger.logResults({
      testPassed: true,
      result,
    });

    expect(result).toBeDefined();
  });
});
```

---

## Best Practices

### 1. Always Set Context

```typescript
const logger = getActivityLogger();
logger.setPhase('current-phase');
logger.setTask('Current task description');
```

### 2. Log at Key Points

```typescript
// Before operation
await logger.logPrompt('Starting operation', metadata);

// During operation
await logger.logToolCall(tool, params, result, duration);

// After operation
await logger.logResults(finalResults);

// On error
await logger.logError(error, context);
```

### 3. Include Timing Data

```typescript
const startTime = Date.now();
const result = await operation();
const duration = Date.now() - startTime;

await logger.logToolCall(tool, params, result, duration);
```

### 4. Handle Errors Gracefully

```typescript
try {
  await logger.logPrompt('...');
} catch (logError) {
  // Log failure should not break functionality
  console.warn('Failed to log activity', logError);
}
```

### 5. Provide Rich Metadata

```typescript
await logger.logResults({
  operation: 'file-processing',
  success: true,
  filesProcessed: 42,
  totalTime_ms: 1234,
  peakMemory_mb: 128,
  errors: [],
  warnings: ['File X skipped due to size'],
});
```

---

## Verification

### Check Logs are Being Created

```bash
# Check log directory
ls -la vault/.activity-logs/

# View latest log file
tail -f vault/.activity-logs/$(ls -t vault/.activity-logs/*.md | head -1)
```

### Verify Log Content

```bash
# Search for specific tool calls
grep -r "shadow_cache.query_files" vault/.activity-logs/

# Count entries in session
grep -c "^## 20" vault/.activity-logs/2025-10-26-*.md
```

### Test Coverage

```typescript
it('should log all operations', async () => {
  const logger = getActivityLogger();
  await logger.logPrompt('Test');
  await logger.flush();

  const files = await fs.readdir(testLogDir);
  const logFiles = files.filter(f => f.endsWith('.md'));
  expect(logFiles.length).toBeGreaterThan(0);

  const content = await fs.readFile(
    path.join(testLogDir, logFiles[0]),
    'utf-8'
  );
  expect(content).toContain('Test');
});
```

---

## Troubleshooting

### Logs not appearing

**Check:**
1. Activity logger initialized: `await initializeActivityLogger(vaultPath)`
2. Phase and task set: `logger.setPhase()` and `logger.setTask()`
3. Flush called: `await logger.flush()`
4. Directory exists: `.activity-logs/` in vault

### Performance impact

**Solutions:**
1. Buffering is enabled by default (30s flush interval)
2. Logging is asynchronous
3. Reduce log verbosity for high-frequency operations
4. Archive old logs regularly

### Log file size

**Management:**
```bash
# Compress old logs
gzip vault/.activity-logs/*-$(date -d '30 days ago' +%Y-%m-%d)*.md

# Archive to tar
tar -czf activity-logs-archive-$(date +%Y%m).tar.gz vault/.activity-logs/*.md.gz
```

---

**Version**: 1.0.0
**Last Updated**: 2025-10-26
