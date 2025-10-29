---
visual:
  icon: 📚
icon: 📚
---
# Weaver: Neural Network Junction & Workflow Proxy for Weave-NN

**Status**: Proposed Architecture
**Date**: 2025-10-23
**Version**: 1.1 (Added neural junction concept)

---

## Executive Summary

**Weaver** is a TypeScript/Node.js-based workflow proxy that serves as the **neural network junction point** for Weave-NN's local-first knowledge graph system. It connects multiple AI "neural networks" (Claude, local models, specialized agents) through a shared knowledge substrate, enabling compound learning where each agent benefits from collective intelligence.

### Core Concept: Neural Network Junction

Weaver acts as the **connection layer** where:
1. **Multiple AI Systems** (Claude Code, Claude Flow agents, future local models) interface with the knowledge graph
2. **Shared Knowledge Substrate** (Obsidian vault) serves as external memory for all AI systems
3. **Workflow Orchestration** (workflow.dev) coordinates async operations without centralized training
4. **Local Loop** ensures privacy, speed, and ownership while enabling collaborative intelligence

This architecture follows research on **Key-Value Memory Networks**<sup>[1]</sup>, **Federated Learning**<sup>[2]</sup>, and **Sparse Memory Finetuning**<sup>[3]</sup>, where distributed AI systems benefit from shared external memory without requiring model retraining or centralized coordination.

### Problem Statement

Current implementation requires:
- 6+ bash scripts with complex interdependencies
- Manual deferred task execution
- No centralized logging/observability
- Difficult to test and debug
- Hard to extend with new automation

Example complexity from hooks migration:
1. `.bin/hooks/post-tool-task-tracker.sh` - Parse TodoWrite JSON
2. `.bin/hooks/update-phase-incrementally.sh` - Update phase docs
3. `.bin/hooks/phase-summary-wrapper.sh` - Create deferred tasks
4. `.bin/run-deferred-tasks.sh` - Run deferred tasks
5. `.bin/create-task-log.sh` - Generate task logs
6. `.bin/documenter-agent.sh` - Generate phase summaries

### Proposed Solution

Replace with **Weaver** - a single Node.js service that:
- Receives webhook triggers from Claude Code hooks
- Executes durable workflows with automatic retries
- Provides centralized logging and observability
- Acts as proxy for all tool calls (MCP, Obsidian API, etc.)
- Writes results back to knowledge graph
- Enables easy extension with new workflows

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Code Session                      │
│                                                              │
│  ┌──────────────┐         ┌──────────────┐                  │
│  │ PostToolUse  │────────▶│ SessionEnd   │                  │
│  │ Hook         │         │ Hook         │                  │
│  └──────┬───────┘         └──────┬───────┘                  │
│         │                        │                           │
│         │ HTTP POST             │ HTTP POST                 │
│         │ (webhook)             │ (webhook)                 │
└─────────┼────────────────────────┼───────────────────────────┘
          │                        │
          ▼                        ▼
    ┌─────────────────────────────────────────────┐
    │            Weaver Workflow Proxy            │
    │         (useworkflow.dev + Node.js)         │
    │                                             │
    │  ┌────────────────────────────────────┐    │
    │  │     Webhook Endpoint Router        │    │
    │  │  • /webhook/todo-complete          │    │
    │  │  • /webhook/phase-complete         │    │
    │  │  • /webhook/file-edit              │    │
    │  │  • /webhook/task-start             │    │
    │  └────────────┬───────────────────────┘    │
    │               │                             │
    │               ▼                             │
    │  ┌────────────────────────────────────┐    │
    │  │     Workflow Orchestration         │    │
    │  │  (use workflow - durable async)    │    │
    │  │                                    │    │
    │  │  • Task Log Workflow               │    │
    │  │  • Phase Update Workflow           │    │
    │  │  • Summary Generation Workflow     │    │
    │  │  • Git Commit Workflow             │    │
    │  │  • Test Execution Workflow         │    │
    │  └────────────┬───────────────────────┘    │
    │               │                             │
    │               ▼                             │
    │  ┌────────────────────────────────────┐    │
    │  │        Service Proxies             │    │
    │  │                                    │    │
    │  │  • MCP Client (Claude Flow, etc.)  │    │
    │  │  • Obsidian API Client             │    │
    │  │  • File System Operations          │    │
    │  │  • Git Operations                  │    │
    │  │  • Claude Code CLI                 │    │
    │  │  • [RabbitMQ - deferred post-MVP]  │    │
    │  └────────────┬───────────────────────┘    │
    │               │                             │
    │               ▼                             │
    │  ┌────────────────────────────────────┐    │
    │  │    Observability & Logging         │    │
    │  │                                    │    │
    │  │  • Automatic trace capture         │    │
    │  │  • Workflow state persistence      │    │
    │  │  • Metrics & dashboards            │    │
    │  │  • Time-travel debugging           │    │
    │  └────────────────────────────────────┘    │
    └─────────────────────────────────────────────┘
                    │
                    ▼
         ┌──────────────────────┐
         │  Knowledge Graph     │
         │  (Obsidian Vault)    │
         │                      │
         │  • Task logs         │
         │  • Phase documents   │
         │  • Workflow metadata │
         └──────────────────────┘
```

---

## Key Features

### 1. Durable Workflows ("use workflow")

```typescript
"use workflow";

async function handleTaskCompletion(taskData: TodoCompleteEvent) {
  // Automatic retry, state management, and observability

  // Step 1: Create task log
  const taskLog = await createTaskLog(taskData);

  // Step 2: Update phase document
  const phaseDoc = await updatePhaseProgress(taskData.phase, taskLog);

  // Step 3: Write to knowledge graph
  await writeToVault(taskLog, phaseDoc);

  // Step 4: Trigger follow-up workflows if needed
  if (phaseDoc.completion === 100) {
    await triggerPhaseCompletionWorkflow(taskData.phase);
  }

  return { success: true, taskLog, phaseDoc };
}
```

**Benefits**:
- Automatic retries on failure
- State persists across restarts
- Can pause/resume workflows
- Full observability out of the box

### 2. Webhook-Driven Architecture

**Claude Code Hook Configuration** (`.claude/settings.json`):
```json
{
  "hooks": {
    "enabled": true,
    "PostToolUse": {
      "enabled": true,
      "command": "curl",
      "args": [
        "-X", "POST",
        "http://localhost:3000/webhook/tool-use",
        "-H", "Content-Type: application/json",
        "-d", "{\"tool\":\"$TOOL_NAME\",\"input\":$TOOL_INPUT,\"output\":$TOOL_OUTPUT}"
      ],
      "runInBackground": true
    },
    "SessionEnd": {
      "enabled": true,
      "command": "curl",
      "args": [
        "-X", "POST",
        "http://localhost:3000/webhook/session-end",
        "-H", "Content-Type: application/json",
        "-d", "{\"phase_complete\":\"$PHASE_COMPLETE\",\"phase_num\":\"$PHASE_NUM\"}"
      ]
    }
  }
}
```

**Weaver Webhook Handler**:
```typescript
// weaver/src/webhooks/todo-complete.ts
"use workflow";

export async function handleTodoComplete(req: Request) {
  const { tool, input, output } = await req.json();

  if (tool !== "TodoWrite") {
    return Response.json({ skipped: true });
  }

  const completedTodos = input.todos.filter(t => t.status === "completed");

  for (const todo of completedTodos) {
    // This entire workflow is durable and retryable
    await processCompletedTask(todo);
  }

  return Response.json({
    success: true,
    processed: completedTodos.length
  });
}
```

### 3. Unified Proxy for All Tool Calls

**MCP Proxy**:
```typescript
// weaver/src/proxies/mcp-client.ts
export class MCPProxy {
  async call(server: string, method: string, params: any) {
    // Centralized logging
    logger.info({ server, method, params }, "MCP call");

    // Execute MCP call
    const result = await executeM CPCall(server, method, params);

    // Store in knowledge graph for transparency
    await storeInteraction({
      type: "mcp",
      server,
      method,
      params,
      result,
      timestamp: new Date()
    });

    return result;
  }
}
```

**Benefits**:
- Single point of logging/observability
- Easy to add authentication/rate limiting
- Can record all interactions for audit
- Simplifies testing with mocks

### 4. Knowledge Graph Integration

```typescript
"use workflow";

async function writeToKnowledgeGraph(data: any) {
  // Step 1: Format for Obsidian
  const markdown = formatAsMarkdown(data);

  // Step 2: Write to vault
  const filePath = await obsidianAPI.createNote(markdown);

  // Step 3: Create wikilinks
  await obsidianAPI.updateLinks(filePath, data.relatedNotes);

  // Step 4: Add to graph
  await obsidianAPI.addToGraph(filePath, data.metadata);

  return filePath;
}
```

---

## Comparison: workflow.dev vs n8n

| Feature | workflow.dev (Weaver) | n8n | Winner |
|---------|----------------------|-----|--------|
| **Local Deployment** | ✅ Simple Node.js process | ⚠️ Requires Docker + DB | Weaver |
| **Developer Experience** | ✅ TypeScript-native | ⚠️ Visual UI + code nodes | Weaver |
| **State Management** | ✅ Built-in durable state | ❌ Manual state handling | Weaver |
| **Observability** | ✅ Automatic traces/logs | ⚠️ Manual monitoring setup | Weaver |
| **Code-First** | ✅ Pure TypeScript | ⚠️ JSON-based workflows | Weaver |
| **Webhook Handling** | ✅ Native HTTP endpoints | ✅ Built-in webhook nodes | Tie |
| **Extensibility** | ✅ npm packages | ⚠️ Community nodes | Weaver |
| **Learning Curve** | ✅ Standard Node.js | ⚠️ n8n-specific concepts | Weaver |
| **Resource Usage** | ✅ Lightweight (1 process) | ⚠️ Heavy (Docker + DB) | Weaver |
| **Testing** | ✅ Standard Jest/Vitest | ⚠️ Manual workflow testing | Weaver |
| **Visual Interface** | ❌ No GUI | ✅ Drag-and-drop UI | n8n |
| **Non-Technical Users** | ❌ Code-only | ✅ User-friendly | n8n |

### Verdict for Weave-NN

**Use Weaver (workflow.dev)** because:
1. **Already requires Node.js** for MCP and Obsidian API
2. **Developer-focused** project (not end-user tool)
3. **Simpler deployment** (no Docker/database needed)
4. **Better observability** out of the box
5. **Easier to version control** (all TypeScript, no JSON)
6. **Native TypeScript** fits project tech stack

---

## Implementation Plan

### Phase 1: Core Infrastructure (Week 1)

**Tasks**:
1. Initialize Weaver Node.js project
   ```bash
   mkdir weaver
   cd weaver
   npm init -y
   npm install @workflow/sdk @hono/node-server zod
   ```

2. Setup basic webhook server
   ```typescript
   // weaver/src/index.ts
   import { serve } from "@hono/node-server";
   import { Hono } from "hono";

   const app = new Hono();

   app.post("/webhook/tool-use", handleToolUse);
   app.post("/webhook/session-end", handleSessionEnd);

   serve({ fetch: app.fetch, port: 3000 });
   ```

3. Migrate first workflow (task completion)
4. Update Claude Code hooks to use webhooks
5. Test end-to-end

**Deliverables**:
- `weaver/` directory with working webhook server
- Updated `.claude/settings.json` with webhook hooks
- Task completion workflow working

### Phase 2: Workflow Migration (Week 2)

**Tasks**:
1. Migrate phase update workflow
2. Migrate phase summary workflow (with Claude Code integration)
3. Add comprehensive logging
4. Create workflow observability dashboard

**Deliverables**:
- All 6 bash scripts replaced with TypeScript workflows
- Dashboard for monitoring workflow execution
- Deferred tasks no longer needed (durable by default)

### Phase 3: Proxy Layer (Week 3)

**Tasks**:
1. Build MCP proxy client
2. Build Obsidian API proxy
3. Build Git operations proxy
4. Add centralized interaction logging

**Deliverables**:
- All tool calls go through Weaver
- Complete audit trail in knowledge graph
- Transparency dashboard

### Phase 4: Extensions (Week 4+)

**New workflows enabled by Weaver**:
1. **Automated Testing Workflow**
   - Run tests after file edits
   - Report results to knowledge graph
   - Create test failure tasks automatically

2. **Git Automation Workflow**
   - Auto-commit on task completion
   - Generate commit messages from context
   - Push to remote on phase completion

3. **CI/CD Integration Workflow**
   - Trigger builds on git push
   - Run linting/type checking
   - Deploy documentation

4. **Knowledge Graph Sync Workflow**
   - Sync Obsidian vault to git
   - Generate graph visualizations
   - Update concept maps automatically

---

## Deployment Requirements

### Local Development

```bash
# 1. Install dependencies
cd weaver
npm install

# 2. Start Weaver
npm run dev
# → Listening on http://localhost:3000

# 3. Claude Code hooks automatically trigger Weaver
# No manual intervention needed!
```

### Production Deployment

**Option 1: Local Process (Recommended)**
```bash
# Run as systemd service
sudo systemctl enable weaver
sudo systemctl start weaver
```

**Option 2: Docker (Optional)**
```bash
docker build -t weaver .
docker run -p 3000:3000 -v ./vault:/vault weaver
```

**Option 3: Cloud (Future)**
- Deploy to Vercel/Railway/Fly.io
- Webhook URL becomes `https://weaver.yourdomain.com/webhook/*`

---

## Benefits Summary

### Compared to Current Bash Scripts

| Metric | Bash Scripts | Weaver | Improvement |
|--------|--------------|--------|-------------|
| **Files** | 6 scripts | 1 service | 83% reduction |
| **Lines of Code** | ~800 LOC | ~300 LOC | 62% reduction |
| **Observability** | debug.log only | Full traces | 🔥 |
| **State Management** | Manual deferred tasks | Automatic | 🔥 |
| **Error Handling** | Manual retry logic | Automatic | 🔥 |
| **Testing** | Manual bash testing | Jest/Vitest | 🔥 |
| **Extensibility** | Add new bash scripts | Add new workflow function | ✅ |
| **Debugging** | Read logs, guess state | Time-travel through execution | 🔥 |

### New Capabilities Enabled

1. **Automatic Retries**: Network/API failures handled automatically
2. **Workflow Composition**: Chain workflows together easily
3. **Time-Travel Debugging**: Inspect any step of any workflow run
4. **Multi-Day Workflows**: Can pause for days (email sequences, reminders)
5. **Real-Time Dashboards**: See all active workflows
6. **Audit Trail**: Every tool call logged to knowledge graph
7. **Easy Testing**: Standard TypeScript testing tools
8. **Version Control**: All workflows in git (no UI state)

---

## Example: Task Completion Workflow

### Before (Bash Scripts)

**6 files, complex execution flow**:
1. Hook triggers `.bin/hooks/post-tool-task-tracker.sh`
2. Parses JSON with `jq`
3. Calls `.bin/create-task-log.sh`
4. Calls `.bin/hooks/update-phase-incrementally.sh`
5. If phase complete, creates deferred task
6. User must manually run deferred task later

**Problems**:
- No retry on failure
- No observability (just debug.log)
- Complex state management
- Error handling scattered
- Hard to test

### After (Weaver)

**1 file, simple workflow**:

```typescript
// weaver/src/workflows/task-completion.ts
"use workflow";

export async function handleTaskCompletion(event: TodoCompleteEvent) {
  // Automatic observability, retries, state management

  try {
    // Step 1: Create task log
    const taskLog = await createTaskLog({
      phase: extractPhase(event.content),
      taskName: event.content,
      status: "completed",
      timestamp: new Date()
    });

    // Step 2: Update phase document incrementally
    const phaseDoc = await updatePhaseProgress({
      phase: taskLog.phase,
      taskId: taskLog.id,
      taskLog: taskLog
    });

    // Step 3: Check if phase is complete
    if (phaseDoc.completion === 100) {
      // No deferred task needed - just schedule it!
      await workflow.sleep("1 minute"); // Wait for session to end
      await generatePhaseSummary(phaseDoc.phase);
    }

    // Step 4: Write all changes to knowledge graph
    await syncToVault([taskLog, phaseDoc]);

    return { success: true, taskLog, phaseDoc };

  } catch (error) {
    // Automatic retry with exponential backoff
    throw new RetryableError("Task completion failed", { cause: error });
  }
}
```

**Benefits**:
- Automatic retries on error
- Full trace of execution
- Can pause/resume anywhere
- No manual deferred tasks
- Easy to test
- Clear control flow

---

## Next Steps

1. **Create Proof of Concept** (2-3 hours)
   - Setup basic Weaver webhook server
   - Implement task completion workflow
   - Test with Claude Code hooks

2. **Evaluate Results** (1 hour)
   - Compare complexity vs bash scripts
   - Test observability features
   - Measure performance

3. **Decision Point**
   - If POC successful → Proceed with Phase 1 migration
   - If issues found → Document concerns, iterate on design

4. **Full Migration** (4 weeks)
   - Follow 4-phase implementation plan
   - Deprecate bash scripts gradually
   - Document new workflows

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| **workflow.dev is new/unproven** | POC first, evaluate stability |
| **Learning curve for team** | Document workflows, provide examples |
| **Another service to maintain** | Simple Node.js, already needed for MCP |
| **Vendor lock-in to workflow.dev** | Core TypeScript, easy to migrate if needed |
| **Breaking existing hooks** | Migrate incrementally, keep bash scripts during transition |

---

## Conclusion

**Weaver** solves the complexity problem demonstrated by the hooks migration:
- ✅ **Simpler**: 1 service instead of 6 bash scripts
- ✅ **More reliable**: Automatic retries and state management
- ✅ **Observable**: Full traces and time-travel debugging
- ✅ **Extensible**: Easy to add new workflows
- ✅ **Testable**: Standard TypeScript testing tools
- ✅ **Maintainable**: Type-safe, version-controlled code

**Recommendation**: Proceed with Weaver POC to validate approach, then migrate incrementally.

---

---

## References

1. Miller, A., Fisch, A., Dodge, J., Karimi, A. H., Bordes, A., & Weston, J. (2016). **Key-Value Memory Networks for Directly Reading Documents**. *EMNLP*. Demonstrates separated addressing (keys) from content (values) enabling multiple neural systems to query shared knowledge.

2. **Memory Networks and Knowledge Graph Design: A Research Synthesis for LLM-Augmented Systems**. See [[../research/memory-networks-research|Full Analysis]]. Comprehensive synthesis showing distributed intelligence systems benefit from shared knowledge substrate without centralized training.

3. **Continual Learning via Sparse Memory Finetuning** (2024). *arXiv:2510.15103v1*. See [[../research/papers/sparse-memory-finetuning-analysis|Analysis]]. Selective memory updates (10k-50k slots) prevent interference when adding new knowledge.

4. Weston, J., Chopra, S., & Bordes, A. (2015). **Memory Networks**. *ICLR*. Foundational work on multi-hop retrieval through chained memory locations with semantic similarity search.

---

**Author**: Hive Mind
**Version**: 1.1 (Added neural junction architecture, 2025-10-23)
**Review Status**: Awaiting feedback
**Implementation**: Pending approval
