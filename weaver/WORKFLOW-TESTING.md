# Workflow Engine Testing Guide

Quick guide to test the workflow trigger system.

---

## Prerequisites

1. Weaver must be running: `bun run dev`
2. Workflows must be enabled in `.env`: `WORKFLOWS_ENABLED=true` (default)

---

## Test 1: Automated Workflow Test

Run the automated test script:

```bash
npx tsx scripts/test-workflow.ts
```

**What it does:**
1. Creates `concepts/workflow-test.md` → Triggers 3 workflows
2. Modifies the file → Triggers 2 workflows
3. Deletes the file → Triggers 2 workflows

**Expected output in Weaver logs:**

```
⚙️  Workflow execution started (file-change-logger)
📄 File change detected by workflow
✅ Workflow execution completed

⚙️  Workflow execution started (markdown-analyzer)
📊 Markdown file analyzed
✅ Workflow execution completed

⚙️  Workflow execution started (concept-tracker)
💡 New concept created
✅ Workflow execution completed
```

---

## Test 2: Manual File Creation

Create a file manually:

```bash
echo "# Test Workflow

This tests workflows manually.
" > /home/aepod/dev/weave-nn/weave-nn/concepts/manual-test.md
```

Watch Weaver logs for:
- `📝 File event detected`
- `⚙️  Workflow execution started`
- `✅ Workflow execution completed`

---

## Test 3: Workflow Statistics

View workflow information:

```bash
npx tsx scripts/workflow-stats.ts
```

Shows:
- Registered workflows
- Trigger mappings
- How workflows execute

---

## Registered Workflows

### 1. **file-change-logger**
- **Triggers**: `file:add`, `file:change`, `file:unlink`
- **Purpose**: Logs all file changes
- **Output**: `📄 File change detected by workflow`

### 2. **markdown-analyzer**
- **Triggers**: `file:add`, `file:change`
- **Purpose**: Analyzes markdown files
- **Output**: `📊 Markdown file analyzed`
- **Filter**: `**/*.md` files only

### 3. **concept-tracker**
- **Triggers**: `file:add`
- **Purpose**: Tracks new concept files
- **Output**: `💡 New concept created`
- **Filter**: `concepts/**/*.md` files only

### 4. **file-deletion-monitor**
- **Triggers**: `file:unlink`
- **Purpose**: Monitors file deletions
- **Output**: `🗑️  File deleted`

---

## How It Works

```
File Change
    ↓
File Watcher (chokidar)
    ↓
File Event (add/change/unlink)
    ↓
Workflow Engine
    ↓
Find Matching Workflows (by trigger + file filter)
    ↓
Execute Workflows (parallel)
    ↓
Log Results
```

---

## Workflow Execution Logs

Each workflow execution logs:
- ⚙️  **Started**: Workflow ID, name, trigger, file
- ✅ **Completed**: Duration in milliseconds
- ❌ **Failed**: Error message (if any)

---

## Creating Custom Workflows

Add to `/weaver/src/workflows/example-workflows.ts`:

```typescript
export const myWorkflow: WorkflowDefinition = {
  id: 'my-workflow',
  name: 'My Custom Workflow',
  description: 'Does something cool',
  triggers: ['file:add'],
  enabled: true,
  fileFilter: 'features/**/*.md', // Optional
  handler: async (context: WorkflowContext) => {
    const { fileEvent } = context;
    if (!fileEvent) return;

    logger.info('My workflow executed!', {
      path: fileEvent.relativePath,
    });

    // Your custom logic here
  },
};
```

Register in `getExampleWorkflows()`:

```typescript
export function getExampleWorkflows(): WorkflowDefinition[] {
  return [
    fileChangeLogger,
    markdownAnalyzer,
    conceptTracker,
    fileDeletionMonitor,
    myWorkflow, // Add here
  ];
}
```

Restart Weaver to load new workflow.

---

## Troubleshooting

### Workflows not executing?

1. Check `WORKFLOWS_ENABLED=true` in `.env`
2. Check Weaver logs for "Workflows registered"
3. Verify file watcher is running: "✅ File watcher ready"
4. Test file event detection: `echo "test" >> test.md`

### No workflow logs?

1. Workflows might be disabled: Check `.env`
2. File might not match filter: Check `fileFilter` pattern
3. Check for errors: Look for "❌ Workflow execution failed"

---

**Last Updated**: 2025-10-24
