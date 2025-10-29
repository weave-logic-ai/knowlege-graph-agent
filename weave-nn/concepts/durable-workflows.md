---
type: concept
category: architecture
status: active
tags:
  - workflows
  - statefulness
  - weaver
  - resilience
related:
  - '[[weaver]]'
  - '[[local-first-architecture]]'
visual:
  icon: 💡
  cssclasses:
    - type-concept
    - status-active
version: '3.0'
updated_date: '2025-10-28'
icon: 💡
---

# Durable Workflows

**Stateful, resumable task execution that survives process restarts, crashes, and long delays.**

## Core Concept

Traditional code execution is **ephemeral**:
- Process crashes → lose all state
- Developer stops work → lose progress
- System restarts → start from scratch

Durable workflows are **persistent**:
- Process crashes → resume from last checkpoint
- Developer stops work → resume hours/days later
- System restarts → continue exactly where left off

## Why This Matters

For solo developers and small teams, **statefulness is game-changing**:

### Without Durable Workflows

```javascript
// Traditional approach
async function processTask(taskId) {
  // Step 1
  const memory = await extractMemory(taskId);

  // ❌ Process crashes here

  // Step 2 - NEVER RUNS
  await storeMemory(memory);

  // Step 3 - NEVER RUNS
  await updateVault(taskId);
}

// Result: Manual cleanup, partial state, confusion
```

**Problems**:
- Partial execution leaves system in inconsistent state
- Need to manually track what completed
- Risk of duplicate work or lost data
- Can't stop/resume work naturally

### With Durable Workflows

```typescript
// Durable workflow approach
export const processTaskWorkflow = workflow('process-task', async (ctx, input) => {
  // Step 1
  const memory = await ctx.step('extract-memory', async () => {
    return await extractMemory(input.taskId);
  }); // ✅ Persisted

  // ❌ Process crashes here

  // [Process restarts]

  // Step 2 - AUTOMATICALLY RESUMES HERE
  await ctx.step('store-memory', async () => {
    await storeMemory(memory);
  }); // ✅ Persisted

  // Step 3
  await ctx.step('update-vault', async () => {
    await updateVault(input.taskId);
  }); // ✅ Persisted

  return { success: true };
});
```

**Benefits**:
- System always in consistent state
- Automatic tracking of progress
- No duplicate work (step-level deduplication)
- Natural stop/resume workflow

## Real-World Scenario

Imagine you're working on implementing a feature:

```
10:00 AM - Start task
10:15 AM - Claude Code generates code
10:16 AM - Weaver workflow starts:
           ✅ Step 1: Extract memory (completes)
           ✅ Step 2: Store in knowledge graph (completes)
           ⏳ Step 3: Update Obsidian vault (in progress)

10:17 AM - Emergency meeting, close laptop

---

2:00 PM - Return to work, open laptop
          Weaver automatically resumes:
           ⏭️  Step 1: Skip (already done)
           ⏭️  Step 2: Skip (already done)
           ▶️  Step 3: Continue from here
           ✅ Step 4: Git commit (completes)

2:05 PM - Task complete, no manual intervention needed
```

**This is the magic**: You didn't need to remember where you left off. You didn't need to check what completed. You didn't need to manually resume. Weaver just **knew** and continued.

## Technical Implementation

### Step-Level Persistence

Each workflow step is a transaction:

```typescript
await ctx.step('update-cache', async () => {
  // This entire block either:
  // - Completes fully and persists result
  // - Fails and will retry
  // - Never runs twice (idempotent)

  await shadowCache.update(nodeId, data);
  return { updated: true };
});
```

**Guarantees**:
- **At-most-once execution**: Step never runs twice
- **Atomic**: Either completes fully or not at all
- **Persisted**: Result saved before next step
- **Resumable**: Can restart from any step

### Retry with Exponential Backoff

```typescript
await ctx.step('git-push',
  async () => {
    return await git.push('origin', 'master');
  },
  {
    retries: 3,           // Try up to 3 times
    backoff: 'exponential' // 1s, 2s, 4s
  }
);
```

If git push fails (network issue), automatically retries with increasing delays.

### Time-Travel Debugging

```typescript
const trace = await workflow.getTrace(workflowId);

console.log(trace.steps);
// [
//   { name: 'extract-memory', duration: '120ms', status: 'completed', at: '10:16:00' },
//   { name: 'store-memory', duration: '45ms', status: 'completed', at: '10:16:01' },
//   { name: 'update-vault', duration: '2.3s', status: 'failed', at: '10:16:02' },
//   { name: 'update-vault', duration: '1.8s', status: 'completed', at: '14:00:05' } // Resumed
// ]
```

See exactly when each step ran, how long it took, and when it resumed.

## Comparison with RabbitMQ

| Feature | RabbitMQ | Durable Workflows |
|---------|----------|-------------------|
| **State** | ❌ Stateless messages | ✅ Full workflow state |
| **Resume** | ❌ Messages redelivered | ✅ Resume from checkpoint |
| **Observability** | ⚠️ Basic metrics | ✅ Full trace + time-travel |
| **Debugging** | ❌ Distributed tracing hard | ✅ Replay any workflow |
| **Retries** | ⚠️ Manual dead-letter queue | ✅ Automatic exponential backoff |
| **Complexity** | ❌ Separate infrastructure | ✅ Embedded in Weaver |

**Winner**: Durable Workflows (simpler, more powerful)

See: [[docs/rabbitmq-deferral-summary|Why RabbitMQ is Deferred]]

## Common Patterns

### Fan-Out/Fan-In

Process multiple items in parallel, then aggregate:

```typescript
export const processMultipleFiles = workflow('process-multiple', async (ctx, input) => {
  const { files } = input;

  // Fan-out: Process all files in parallel
  const results = await Promise.all(
    files.map((file, i) =>
      ctx.step(`process-file-${i}`, async () => {
        return await processFile(file);
      })
    )
  );

  // Fan-in: Aggregate results
  return await ctx.step('aggregate', async () => {
    return aggregateResults(results);
  });
});
```

If process crashes during parallel execution, completed files are skipped on resume.

### Human-in-the-Loop

Wait for human input:

```typescript
export const reviewWorkflow = workflow('review', async (ctx, input) => {
  // Generate content
  const content = await ctx.step('generate', async () => {
    return await generateContent(input);
  });

  // Wait for approval (up to 24 hours)
  const approved = await ctx.waitForEvent('approval', { timeout: '24h' });

  if (approved) {
    await ctx.step('publish', async () => {
      return await publishContent(content);
    });
  }

  return { published: approved };
});
```

Workflow pauses, developer reviews, approves/rejects, workflow continues. Can take hours or days—no problem.

### Scheduled Execution

Run workflows on schedule:

```typescript
export const dailyBackup = workflow('daily-backup', async (ctx) => {
  await ctx.schedule('0 2 * * *', async () => {
    // Runs every day at 2 AM
    const vaultState = await obsidianClient.exportVault();
    await saveBackup(vaultState);
  });
});
```

## Performance

- **Workflow Start**: <5ms
- **Step Execution**: <1ms overhead
- **State Persistence**: Async (doesn't block)
- **Memory**: ~1KB per active workflow
- **Throughput**: 1000+ workflows/sec

## Benefits for Weave-NN

### 1. Developer Experience

**Before** (no workflows):
- Stop work → lose progress → frustration
- Crash → manual recovery → wasted time
- Long tasks → can't leave → must babysit

**After** (with workflows):
- Stop work → automatic resume → peace of mind
- Crash → automatic recovery → zero intervention
- Long tasks → leave and forget → runs autonomously

### 2. System Reliability

- **Resilient**: Survives crashes, restarts, interruptions
- **Consistent**: No partial state, no corruption
- **Observable**: Full trace of every execution
- **Debuggable**: Time-travel to any point in history

### 3. Cognitive Load

**Developers don't need to**:
- Remember where they left off
- Track what completed
- Implement retry logic
- Handle edge cases manually
- Write state management code

**Workflows handle all of this automatically.**

## When NOT to Use Workflows

Workflows add overhead (~1ms per step). Don't use for:

- Simple, fast operations (<10ms total)
- Pure computations (no I/O)
- Operations that don't need resumability

Use regular async/await for these cases.

**DO use workflows for**:
- Multi-step processes
- Operations with I/O (API calls, file writes, database queries)
- Long-running tasks
- Anything that might fail and needs retry
- Anything you want to observe/debug



## Related

[[agent-rules-workflows]]
## Related Concepts

- [[concepts/weaver|Weaver]]
- [[concepts/local-first-architecture|Local-First Architecture]]

## Related Technical

- [[technical/workflow-dev|Workflow.dev Implementation]]
- [[technical/weaver|Weaver (uses durable workflows)]]

## Related Documentation

- [[docs/rabbitmq-deferral-summary|RabbitMQ Deferral (Workflows vs Messages)]]
- [[docs/local-first-architecture-overview|Local-First Architecture]]

---

**Key Insight**: Durable workflows transform Weaver from a "must monitor" service to a "set and forget" service. Start a task, close your laptop, come back tomorrow, and it just continues. This is **revolutionary** for solo developers and small teams who can't afford 24/7 monitoring.
