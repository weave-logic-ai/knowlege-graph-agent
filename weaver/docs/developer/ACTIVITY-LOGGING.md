# Activity Logging System

Comprehensive logging of all Claude/AI activities to the vault for complete auditability and debugging.

## Overview

The Activity Logger creates sequential markdown files in the vault that capture every interaction, tool call, result, and decision made by Claude and other AI systems. This provides a comprehensive timeline for debugging, auditing, and understanding the development process.

## Architecture

```
┌─────────────────────────────────────────┐
│     Activity Logger Service              │
├─────────────────────────────────────────┤
│  - Session Management                   │
│  - Entry Buffering                      │
│  - Markdown Formatting                  │
│  - Auto-Flush (30s interval)            │
└─────────────────┬───────────────────────┘
                  │
                  ↓
┌─────────────────────────────────────────┐
│   Vault: .activity-logs/                │
├─────────────────────────────────────────┤
│  - README.md (index)                    │
│  - 2025-10-26-SESSION-ID.md             │
│  - 2025-10-27-SESSION-ID.md             │
│  - ...                                   │
└─────────────────────────────────────────┘
```

## Log Structure

### Directory Structure

```
vault/
└── .activity-logs/
    ├── README.md                          # Index file
    ├── 2025-10-26-20251026T143022-abc123.md
    ├── 2025-10-26-20251026T153045-def456.md
    └── 2025-10-27-20251027T090015-ghi789.md
```

### File Naming

Format: `YYYY-MM-DD-TIMESTAMP-RANDOM.md`

- **Date**: Session start date
- **Timestamp**: ISO timestamp without separators
- **Random**: 6-character random string for uniqueness

### Log Entry Format

Each entry is formatted as markdown with structured sections:

```markdown
## 2025-10-26T14:30:22.123Z

**Phase**: phase-9-testing-documentation
**Task**: Create comprehensive documentation

### Prompt

```
User requested: "Create user documentation for quickstart"
```

### Tool Calls

#### Write

**Parameters:**
```json
{
  "file_path": "/home/user/vault/docs/QUICKSTART.md",
  "content": "..."
}
```

**Result:**
```json
{
  "success": true,
  "bytesWritten": 1234
}
```

**Duration:** 45ms

### Results

```json
{
  "filesCreated": 1,
  "status": "completed"
}
```

### Metadata

```json
{
  "user": "claude-code",
  "model": "claude-3-5-sonnet-20241022"
}
```

---
```

## Usage

### Initialization

```typescript
import { initializeActivityLogger } from './vault-logger/activity-logger';

const logger = await initializeActivityLogger('/path/to/vault');
```

### Setting Context

```typescript
// Set current phase
logger.setPhase('phase-9-testing-documentation');

// Set current task
logger.setTask('Create user documentation');
```

### Logging Prompts

```typescript
await logger.logPrompt(
  'Create comprehensive user documentation',
  {
    source: 'user',
    priority: 'high',
  }
);
```

### Logging Tool Calls

```typescript
const startTime = Date.now();

// Execute tool
const result = await writeTool.execute({
  file_path: '/path/to/file.md',
  content: 'Content here',
});

const duration = Date.now() - startTime;

// Log the call
await logger.logToolCall(
  'Write',
  {
    file_path: '/path/to/file.md',
    content: 'Content here',
  },
  result,
  duration
);
```

### Logging Results

```typescript
await logger.logResults({
  filesCreated: 5,
  testsRun: 42,
  testsPassed: 40,
  coverage: '95%',
});
```

### Logging Errors

```typescript
try {
  // Some operation
} catch (error) {
  await logger.logError(error, {
    operation: 'file-write',
    filePath: '/path/to/file.md',
  });
}
```

### Session Management

```typescript
// Get session summary
const summary = await logger.getSessionSummary();
console.log(summary);
// {
//   sessionId: '20251026T143022-abc123',
//   startTime: Date,
//   duration_ms: 123456,
//   totalEntries: 42,
//   phase: 'phase-9',
//   task: 'Documentation'
// }

// Graceful shutdown
await logger.shutdown();
```

## Integration Points

### Workflow Engine

```typescript
// src/workflow-engine/index.ts
import { getActivityLogger } from '../vault-logger/activity-logger';

class WorkflowEngine {
  async executeWorkflow(workflow: Workflow, context: WorkflowContext) {
    const logger = getActivityLogger();

    logger.setTask(`Execute workflow: ${workflow.name}`);

    await logger.logPrompt(`Executing workflow: ${workflow.name}`, {
      workflowId: workflow.id,
      triggers: workflow.triggers,
    });

    try {
      const result = await workflow.execute(context);

      await logger.logResults({
        workflowId: workflow.id,
        success: true,
        duration_ms: result.duration,
      });

      return result;
    } catch (error) {
      await logger.logError(error, {
        workflowId: workflow.id,
        workflowName: workflow.name,
      });
      throw error;
    }
  }
}
```

### MCP Server

```typescript
// src/mcp-server/index.ts
import { getActivityLogger } from '../vault-logger/activity-logger';

class MCPServer {
  async callTool(name: string, params: unknown) {
    const logger = getActivityLogger();

    logger.setTask(`MCP Tool: ${name}`);

    const startTime = Date.now();

    try {
      const result = await this.tools[name].execute(params);
      const duration = Date.now() - startTime;

      await logger.logToolCall(name, params as Record<string, unknown>, result, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      await logger.logToolCall(
        name,
        params as Record<string, unknown>,
        undefined,
        duration,
        error instanceof Error ? error.message : String(error)
      );

      throw error;
    }
  }
}
```

### AI Agents

```typescript
// src/agents/rules/auto-tag-rule.ts
import { getActivityLogger } from '../../vault-logger/activity-logger';

class AutoTagRule {
  async execute(content: string) {
    const logger = getActivityLogger();

    logger.setTask('Auto-tag note');

    await logger.logPrompt('Analyzing content for tag suggestions', {
      contentLength: content.length,
      rule: 'auto-tag',
    });

    const tags = await this.analyzeContent(content);

    await logger.logResults({
      suggestedTags: tags,
      confidence: 0.95,
    });

    return tags;
  }
}
```

## Configuration

### Environment Variables

```env
# Enable activity logging
FEATURE_ACTIVITY_LOGGING=true

# Log directory (relative to vault)
ACTIVITY_LOG_DIR=.activity-logs

# Auto-flush interval (milliseconds)
ACTIVITY_LOG_FLUSH_INTERVAL=30000

# Maximum log file size (bytes)
ACTIVITY_LOG_MAX_FILE_SIZE=10485760  # 10MB
```

### Programmatic Configuration

```typescript
const logger = new ActivityLogger(
  '/path/to/vault',
  '.custom-logs'  // Custom directory
);

await logger.initialize();
```

## Performance Considerations

### Buffering

- Entries are buffered in memory before writing to disk
- Auto-flush every 30 seconds (configurable)
- Manual flush on demand: `await logger.flush()`

### File Rotation

- One file per session by default
- Files rotate on date change
- Old files remain for historical reference

### Disk Usage

- Typical log entry: 1-5KB
- Daily log file (100 entries): ~200KB
- Monthly storage: ~6MB

### Optimization Tips

1. **Reduce Logging Verbosity**: Only log critical operations in production
2. **Compress Old Logs**: Archive logs older than 30 days
3. **Filter Tool Calls**: Skip logging for read-only operations
4. **Limit Result Size**: Truncate large results in logs

## Maintenance

### Cleanup Old Logs

```bash
# Remove logs older than 30 days
find vault/.activity-logs -name "*.md" -mtime +30 -delete

# Archive logs to compressed file
tar -czf activity-logs-archive-$(date +%Y%m).tar.gz vault/.activity-logs/*.md
```

### Index Regeneration

```typescript
// Regenerate index file
await logger.createIndexFile();
```

## Troubleshooting

### Issue: Logs not being created

**Check:**
1. Vault path is correct
2. Write permissions on vault directory
3. Activity logging is enabled: `FEATURE_ACTIVITY_LOGGING=true`

### Issue: Logs are incomplete

**Solution:**
```typescript
// Force flush before shutdown
await logger.flush();
await logger.shutdown();
```

### Issue: Large log files

**Solution:**
```typescript
// Reduce logging verbosity
await logger.logToolCall(
  'Read',
  { file_path: '/path' },
  { truncated: true },  // Don't log full content
  duration
);
```

## Best Practices

1. **Always set context**: Call `setPhase()` and `setTask()` before logging
2. **Log errors comprehensively**: Include stack traces and metadata
3. **Flush before shutdown**: Ensure all entries are written
4. **Archive old logs**: Keep vault size manageable
5. **Monitor disk usage**: Set up alerts for log directory size

## Examples

### Complete Workflow Example

```typescript
async function executePhase9Task() {
  const logger = getActivityLogger();

  // Set context
  logger.setPhase('phase-9-testing-documentation');
  logger.setTask('Create comprehensive documentation');

  // Log prompt
  await logger.logPrompt('User requested documentation creation', {
    priority: 'high',
    deadline: '2025-10-26',
  });

  // Execute tools
  const files = ['QUICKSTART.md', 'ARCHITECTURE.md', 'CONFIGURATION.md'];

  for (const file of files) {
    const startTime = Date.now();

    try {
      const result = await createFile(file);
      const duration = Date.now() - startTime;

      await logger.logToolCall(
        'Write',
        { file_path: file },
        result,
        duration
      );
    } catch (error) {
      await logger.logError(error, { file });
    }
  }

  // Log final results
  await logger.logResults({
    filesCreated: files.length,
    status: 'completed',
    totalTime_ms: Date.now() - startTime,
  });

  // Get summary
  const summary = await logger.getSessionSummary();
  console.log('Session summary:', summary);
}
```

---

**Version**: 1.0.0
**Last Updated**: 2025-10-26
**Status**: ✅ Production Ready
