# Workflow DevKit Usage Guide

**Version:** 1.0.0
**Date:** 2025-12-29
**Status:** Active
**Package:** @knowledge-graph-agent/workflow

---

## Table of Contents

1. [Overview](#1-overview)
2. [Key Concepts](#2-key-concepts)
3. [CLI Commands](#3-cli-commands)
4. [MCP Tools](#4-mcp-tools)
5. [Use Cases](#5-use-cases)
6. [Configuration Options](#6-configuration-options)
7. [Error Handling and Recovery](#7-error-handling-and-recovery)
8. [Best Practices](#8-best-practices)

---

## 1. Overview

The Workflow DevKit integration provides durable, event-sourced workflow execution for the Knowledge Graph Agent. Based on [useworkflow.dev](https://useworkflow.dev), this integration enables reliable multi-step AI agent workflows with automatic state persistence and recovery.

### What is Workflow DevKit?

Workflow DevKit is Anthropic's durable workflow framework that provides:

- **Durable Execution**: Workflows survive process restarts and failures
- **Event Sourcing**: Every state change is recorded and replayable
- **Postgres World**: Production-ready persistence with PostgreSQL
- **DurableAgent**: Long-running AI agents with persistent memory
- **GOAP Integration**: Goal-Oriented Action Planning for intelligent decision making

### Integration Benefits

| Feature | Description |
|---------|-------------|
| **Reliability** | Workflows automatically resume after crashes or restarts |
| **Auditability** | Complete event log for debugging and compliance |
| **Scalability** | PostgreSQL backend supports production workloads |
| **AI-Native** | Built-in support for Claude and other LLMs |
| **Vercel-Ready** | Optimized for serverless deployment |

---

## 2. Key Concepts

### 2.1 Postgres World - Durable Workflow State Storage

Postgres World is the production persistence layer that stores all workflow state in PostgreSQL. This enables:

- **Crash Recovery**: Workflows automatically resume from their last checkpoint
- **Horizontal Scaling**: Multiple workflow runners can process tasks concurrently
- **Event Replay**: Debug issues by replaying event sequences
- **Cross-Session State**: Workflows persist across application restarts

```typescript
import { createPostgresConfig } from '@knowledge-graph-agent/workflow';

const config = createPostgresConfig('postgres://localhost:5432/kg_agent', {
  schema: 'workflow',
  poolConfig: {
    max: 20,
    idleTimeoutMillis: 30000,
  },
});
```

**Supported Worlds:**

| World | Use Case | Configuration |
|-------|----------|---------------|
| `postgres` | Production deployments | Requires `DATABASE_URL` |
| `vercel` | Serverless on Vercel | Auto-configured with `VERCEL_PROJECT_ID` |
| `local` | Development/testing | Stores in `.workflow` directory |

### 2.2 "use workflow" / "use step" Directives

These TypeScript directives mark functions for special handling by the Workflow DevKit runtime:

```typescript
// Mark function as a workflow entry point
async function documentProcessingWorkflow(docPath: string) {
  "use workflow";

  // Workflow logic here
  const analysis = await analyzeDocument(docPath);
  const tasks = await generateTasks(analysis);

  return { success: true, tasks };
}

// Mark function as a durable step (automatically checkpointed)
async function analyzeDocument(docPath: string) {
  "use step";

  // This step's result is persisted - reruns skip to the saved result
  const content = await readFile(docPath);
  const gaps = await detectGaps(content);

  return { gaps, completeness: calculateCompleteness(gaps) };
}
```

**Directive Behaviors:**

| Directive | Behavior |
|-----------|----------|
| `"use workflow"` | Marks function as workflow entry point; enables event sourcing |
| `"use step"` | Creates a checkpoint; result is persisted and reused on replay |

### 2.3 DurableAgent Pattern for AI Agent Workflows

DurableAgent is a pattern for creating AI agents that maintain state across workflow executions:

```typescript
import { createWorkflowService } from '@knowledge-graph-agent/workflow';

const service = createWorkflowService();

// Start a collaboration workflow with durable agent capabilities
const result = await service.startCollaborationWorkflow(
  'graph-123',      // Knowledge graph ID
  './docs/spec.md'  // Document path
);

// The workflow uses GOAP planning internally
// Actions are executed in sequence with automatic checkpointing
console.log(`Workflow ${result.workflowId} completed`);
console.log(`Artifacts: ${result.artifacts.join(', ')}`);
```

**DurableAgent Features:**

- Persistent conversation history across workflow steps
- Automatic retry on transient failures
- Tool integration with GOAP planning
- State checkpointing after each interaction

### 2.4 GOAP (Goal-Oriented Action Planning) for Decision Making

GOAP enables intelligent workflow orchestration by planning action sequences to achieve goals:

```typescript
import { createGOAPAdapter, type WorldState, type GOAPGoal } from '@knowledge-graph-agent/workflow';

// Initialize the GOAP adapter
const goap = createGOAPAdapter();

// Define current world state
const worldState: WorldState = {
  hasSpecification: true,
  specCompleteness: 0.6,
  hasAcceptanceCriteria: false,
  taskDefined: false,
  blockersFree: true,
  developmentStarted: false,
  timeSinceLastChange: 300000,
  lastChangeTimestamp: Date.now() - 300000,
  activeCollaborators: [],
  pendingGaps: ['missing-auth-spec'],
};

// Create a plan to achieve the goal
const plan = goap.createPlan(worldState, 'start-development');

if (plan.achievable) {
  console.log(`Plan found with ${plan.actionIds.length} steps:`);
  plan.actionIds.forEach((id, i) => console.log(`  ${i + 1}. ${id}`));
  console.log(`Total cost: ${plan.totalCost}`);

  // Execute the plan
  const result = await goap.executePlan(plan, worldState);
  console.log(`Execution ${result.success ? 'succeeded' : 'failed'}`);
} else {
  console.log(`Goal not achievable: ${plan.reason}`);
}
```

**Default GOAP Actions:**

| Action ID | Purpose | Preconditions |
|-----------|---------|---------------|
| `analyze-spec` | Analyze specification completeness | `hasSpecification: true` |
| `generate-acceptance-criteria` | Create acceptance criteria | `specCompleteness >= 0.5` |
| `create-task` | Define development task | `hasAcceptanceCriteria: true` |
| `start-development` | Begin development | `taskDefined: true, blockersFree: true` |
| `fill-gaps` | Generate missing documentation | `hasSpecification: true` |
| `resolve-blockers` | Address blocking issues | `blockersFree: false` |

---

## 3. CLI Commands

The Knowledge Graph Agent CLI provides commands for managing workflows:

### 3.1 Start a Workflow

```bash
# Start an analysis workflow
kg workflow start analysis

# Start a sync workflow with input parameters
kg workflow start sync --input '{"namespace": "myproject"}'

# Start a generation workflow asynchronously
kg workflow start generation --async

# Preview workflow without executing (dry run)
kg workflow start validation --dry-run
```

**Workflow Types:**

| Type | Description |
|------|-------------|
| `analysis` | Analyze codebase and extract knowledge |
| `sync` | Synchronize with external systems |
| `generation` | Generate knowledge graph artifacts |
| `validation` | Validate graph integrity and structure |
| `migration` | Migrate data between formats |

**Options:**

| Option | Short | Description |
|--------|-------|-------------|
| `--input <json>` | `-i` | Input data as JSON string |
| `--async` | `-a` | Run workflow asynchronously |
| `--dry-run` | | Preview workflow without executing |

### 3.2 Check Workflow Status

```bash
# Check status of a specific workflow
kg workflow status abc12345

# Check status with JSON output
kg workflow status abc12345 --json

# Watch for status changes in real-time
kg workflow status abc12345 --watch

# Check status of all active workflows
kg workflow status
```

**Options:**

| Option | Short | Description |
|--------|-------|-------------|
| `--json` | | Output as JSON |
| `--watch` | `-w` | Watch for status changes |

### 3.3 List Workflows

```bash
# List all workflows
kg workflow list

# Filter by status
kg workflow list --status running
kg workflow list --status completed
kg workflow list --status failed

# Filter by type
kg workflow list --type analysis

# Limit results
kg workflow list --limit 5

# Output as JSON
kg workflow list --json
```

**Options:**

| Option | Short | Description |
|--------|-------|-------------|
| `--status <status>` | `-s` | Filter by status (running, completed, failed, stopped) |
| `--type <type>` | `-t` | Filter by workflow type |
| `--limit <number>` | `-n` | Limit number of results (default: 10) |
| `--json` | | Output as JSON |

### 3.4 Stop a Workflow

```bash
# Stop a running workflow
kg workflow stop abc12345

# Force stop without confirmation
kg workflow stop abc12345 --force
```

**Options:**

| Option | Short | Description |
|--------|-------|-------------|
| `--force` | `-f` | Force stop without confirmation |

### 3.5 View Workflow History

```bash
# Show workflow history
kg workflow history

# Limit history entries
kg workflow history --limit 5

# Filter by workflow type
kg workflow history --type analysis

# Show workflows since a specific date
kg workflow history --since 2024-01-01

# Output as JSON
kg workflow history --json
```

**Options:**

| Option | Short | Description |
|--------|-------|-------------|
| `--limit <number>` | `-n` | Limit number of results (default: 20) |
| `--type <type>` | `-t` | Filter by workflow type |
| `--since <date>` | | Show workflows since date (ISO format) |
| `--json` | | Output as JSON |

### 3.6 Resume a Stopped Workflow

```bash
# Resume a stopped workflow
kg workflow resume abc12345
```

---

## 4. MCP Tools

The Knowledge Graph Agent exposes workflow functionality through MCP (Model Context Protocol) tools:

### 4.1 kg_workflow_start - Start Workflow via MCP

Start a new workflow for knowledge graph operations.

**Schema:**

```json
{
  "name": "kg_workflow_start",
  "description": "Start a new workflow for knowledge graph operations",
  "inputSchema": {
    "type": "object",
    "properties": {
      "workflowId": {
        "type": "string",
        "description": "Workflow type to start",
        "enum": ["collaboration", "analysis", "sync", "custom"]
      },
      "input": {
        "type": "object",
        "description": "Workflow input data",
        "properties": {
          "graphId": {
            "type": "string",
            "description": "Knowledge graph identifier"
          },
          "docPath": {
            "type": "string",
            "description": "Path to the source document"
          },
          "options": {
            "type": "object",
            "properties": {
              "autoStart": {
                "type": "boolean",
                "description": "Auto-start development when ready"
              },
              "watchPaths": {
                "type": "array",
                "description": "Paths to watch for changes",
                "items": { "type": "string" }
              },
              "threshold": {
                "type": "number",
                "description": "Completeness threshold (0-1)"
              }
            }
          }
        }
      }
    },
    "required": ["workflowId"]
  }
}
```

**Example Usage (via Claude):**

```
Use the kg_workflow_start tool to start a collaboration workflow for analyzing the API documentation:

{
  "workflowId": "collaboration",
  "input": {
    "graphId": "api-docs-graph",
    "docPath": "./docs/api/endpoints.md",
    "options": {
      "autoStart": true,
      "threshold": 0.8
    }
  }
}
```

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "workflowId": "collab-1703847600000-abc123",
    "type": "collaboration",
    "startedAt": "2024-12-29T12:00:00.000Z",
    "completedAt": "2024-12-29T12:00:05.000Z",
    "outcome": "completed",
    "artifacts": ["analyze-spec", "generate-acceptance-criteria", "create-task"]
  },
  "metadata": {
    "executionTime": 5234,
    "serviceStatus": "running"
  }
}
```

### 4.2 kg_workflow_status - Check Status via MCP

Check the status of a workflow or the workflow service.

**Schema:**

```json
{
  "name": "kg_workflow_status",
  "description": "Check the status of a workflow or the workflow service",
  "inputSchema": {
    "type": "object",
    "properties": {
      "workflowId": {
        "type": "string",
        "description": "Specific workflow ID to check (optional)"
      },
      "includeMetrics": {
        "type": "boolean",
        "description": "Include execution metrics and statistics",
        "default": false
      },
      "includeConfig": {
        "type": "boolean",
        "description": "Include service configuration details",
        "default": false
      }
    }
  }
}
```

**Example Usage (via Claude):**

```
Use the kg_workflow_status tool to check the status of workflow collab-1703847600000-abc123 with metrics:

{
  "workflowId": "collab-1703847600000-abc123",
  "includeMetrics": true
}
```

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "found": true,
    "workflow": {
      "id": "collab-1703847600000-abc123",
      "type": "realtime-collab",
      "startedAt": "2024-12-29T12:00:00.000Z",
      "status": "completed",
      "currentStep": "start-development",
      "lastEventAt": "2024-12-29T12:00:05.000Z"
    },
    "service": {
      "isRunning": true,
      "activeWorkflowCount": 2,
      "watchedPaths": ["./docs", "./src"],
      "lastActivity": "2024-12-29T12:00:05.000Z"
    },
    "stats": {
      "totalExecutions": 15,
      "successfulExecutions": 14,
      "failedExecutions": 1,
      "averageDuration": 4500,
      "successRate": 93.33
    }
  },
  "metadata": {
    "executionTime": 12,
    "requestedWorkflowId": "collab-1703847600000-abc123"
  }
}
```

### 4.3 kg_workflow_list - List Workflows via MCP

List all active workflows with optional filtering.

**Schema:**

```json
{
  "name": "kg_workflow_list",
  "description": "List all active workflows with optional filtering",
  "inputSchema": {
    "type": "object",
    "properties": {
      "status": {
        "type": "string",
        "description": "Filter by workflow status",
        "enum": ["running", "completed", "failed", "suspended", "all"]
      },
      "type": {
        "type": "string",
        "description": "Filter by workflow type",
        "enum": ["realtime-collab", "analysis", "sync", "custom", "all"]
      },
      "limit": {
        "type": "number",
        "description": "Maximum number of workflows to return",
        "default": 50
      },
      "offset": {
        "type": "number",
        "description": "Number of workflows to skip (for pagination)",
        "default": 0
      },
      "sortBy": {
        "type": "string",
        "description": "Field to sort by",
        "enum": ["startedAt", "lastEventAt", "status", "type"],
        "default": "startedAt"
      },
      "sortOrder": {
        "type": "string",
        "description": "Sort order",
        "enum": ["asc", "desc"],
        "default": "desc"
      }
    }
  }
}
```

**Example Usage (via Claude):**

```
Use the kg_workflow_list tool to list the 10 most recent running workflows:

{
  "status": "running",
  "limit": 10,
  "sortBy": "startedAt",
  "sortOrder": "desc"
}
```

**Response Structure:**

```json
{
  "success": true,
  "data": {
    "workflows": [
      {
        "id": "collab-1703847600000-abc123",
        "type": "realtime-collab",
        "status": "running",
        "currentStep": "analyze-spec",
        "startedAt": "2024-12-29T12:00:00.000Z",
        "lastEventAt": "2024-12-29T12:00:02.000Z",
        "duration": 2000,
        "isActive": true
      }
    ],
    "summary": {
      "total": 5,
      "filtered": 3,
      "returned": 3,
      "byStatus": {
        "running": 3,
        "completed": 2,
        "failed": 0,
        "suspended": 0
      },
      "byType": {
        "realtime-collab": 3,
        "analysis": 2
      }
    },
    "pagination": {
      "limit": 10,
      "offset": 0,
      "hasMore": false,
      "nextOffset": null
    },
    "serviceStatus": {
      "isRunning": true,
      "watchedPaths": 2,
      "lastActivity": "2024-12-29T12:00:02.000Z"
    }
  },
  "metadata": {
    "executionTime": 8,
    "filters": {
      "status": "running",
      "type": "all",
      "sortBy": "startedAt",
      "sortOrder": "desc"
    },
    "itemCount": 3
  }
}
```

---

## 5. Use Cases

### 5.1 Document Processing Pipelines

Automated processing of documentation with gap detection and content generation:

```typescript
import { createWorkflowService } from '@knowledge-graph-agent/workflow';

const service = createWorkflowService({
  watchPaths: ['./docs'],
  autoStartThreshold: 0.7,
  inactivityTimeout: 5 * 60 * 1000, // 5 minutes
});

await service.start();

// Workflow automatically triggers when files change
// Or manually trigger processing:
const analysis = await service.analyzeGaps('./docs/api/endpoints.md');

if (analysis.completeness < 0.7) {
  console.log('Gaps detected:');
  analysis.gaps.forEach(gap => {
    console.log(`  - ${gap.type}: ${gap.description}`);
  });

  // Generate missing documentation
  const generated = await service.generateMissingDocs('./docs/api/endpoints.md', analysis);
  console.log(`Generated ${generated.length} documentation sections`);
}
```

**Workflow Steps:**
1. File change detected or manual trigger
2. Gap analysis performed on document
3. Completeness score calculated
4. If threshold met: generate task specification
5. If gaps remain: generate missing documentation

### 5.2 Knowledge Graph Construction Workflows

Build knowledge graphs from documentation with GOAP-driven planning:

```typescript
import { createWorkflowService } from '@knowledge-graph-agent/workflow';

const service = createWorkflowService();
await service.start();

// Start a collaboration workflow for graph construction
const result = await service.startCollaborationWorkflow(
  'project-alpha-kg',
  './docs/architecture.md'
);

// The workflow uses GOAP planning to:
// 1. Analyze the specification
// 2. Generate acceptance criteria
// 3. Create tasks from documentation
// 4. Start development when ready

console.log(`Workflow completed: ${result.outcome}`);
console.log(`Steps executed: ${result.artifacts.join(' -> ')}`);
```

### 5.3 Multi-Step Analysis Workflows

Complex analysis requiring multiple agent interactions:

```typescript
import { createWorkflowService, createGOAPAdapter } from '@knowledge-graph-agent/workflow';

const service = createWorkflowService();
const goap = createGOAPAdapter();

// Evaluate readiness before starting development
const readiness = await service.evaluateReadiness('./docs/spec.md');

console.log(`Readiness Score: ${(readiness.score * 100).toFixed(1)}%`);
console.log(`Ready for Development: ${readiness.ready ? 'Yes' : 'No'}`);

if (!readiness.ready) {
  console.log('Blockers:');
  readiness.blockers.forEach(b => console.log(`  - ${b}`));

  console.log('Recommendations:');
  readiness.recommendations.forEach(r => console.log(`  - ${r}`));

  // Create a plan to resolve blockers
  const plan = await service.createPlan('complete-spec');

  if (plan.achievable) {
    console.log(`Plan to achieve readiness (${plan.totalCost} cost):`);
    plan.actionIds.forEach((id, i) => console.log(`  ${i + 1}. ${id}`));
  }
}
```

### 5.4 Automated Documentation Generation

Generate documentation when user activity stops:

```typescript
import { createWorkflowService } from '@knowledge-graph-agent/workflow';

const service = createWorkflowService({
  watchPaths: ['./docs/api', './docs/architecture'],
  inactivityTimeout: 5 * 60 * 1000, // 5 minutes of inactivity
  autoStartThreshold: 0.7,
});

// Set up event handling
const webhookRegistry = service.getWebhookRegistry();

webhookRegistry.on('timeout:inactivity', async (event) => {
  console.log('Inactivity detected, generating missing documentation...');

  // The service automatically handles this, but you can add custom logic
  const watchedPaths = service.getStatus().watchedPaths;

  for (const path of watchedPaths) {
    const analysis = await service.analyzeGaps(path);
    if (analysis.gaps.length > 0) {
      await service.generateMissingDocs(path, analysis);
    }
  }
});

await service.start();
```

---

## 6. Configuration Options

### 6.1 Workflow Service Configuration

```typescript
interface WorkflowServiceConfig {
  /** Workflow DevKit configuration */
  workflow?: WorkflowConfig;

  /** Inactivity timeout in ms (default: 5 minutes) */
  inactivityTimeout?: number;

  /** Auto-start development threshold (default: 0.7) */
  autoStartThreshold?: number;

  /** Paths to watch for changes */
  watchPaths?: string[];

  /** Enable debug logging */
  debug?: boolean;

  /** Webhook secret for validation */
  webhookSecret?: string;

  /** Maximum payload size for webhooks */
  maxPayloadSize?: number;
}
```

### 6.2 World Configuration

**Environment Variables:**

```bash
# Select world type
WORKFLOW_WORLD=postgres  # or "vercel" or "local"

# PostgreSQL configuration
DATABASE_URL=postgres://user:pass@localhost:5432/kg_agent

# Vercel configuration
VERCEL_PROJECT_ID=prj_xxxxx
```

**Programmatic Configuration:**

```typescript
import {
  createPostgresConfig,
  createVercelConfig,
  createLocalConfig,
} from '@knowledge-graph-agent/workflow';

// PostgreSQL World
const pgConfig = createPostgresConfig('postgres://localhost:5432/kg_agent', {
  schema: 'workflow',
  poolConfig: {
    max: 20,
    idleTimeoutMillis: 30000,
  },
});

// Vercel World
const vercelConfig = createVercelConfig('prj_xxxxx');

// Local World (development)
const localConfig = createLocalConfig('.workflow');
```

### 6.3 GOAP Adapter Configuration

```typescript
interface GOAPAdapterConfig {
  /** Maximum planning iterations */
  maxIterations?: number;        // default: 1000

  /** Planning timeout in ms */
  timeoutMs?: number;            // default: 30000

  /** Default action cost */
  defaultCost?: number;          // default: 1

  /** Enable plan caching */
  enableCaching?: boolean;       // default: true

  /** Maximum plan length */
  maxPlanLength?: number;        // default: 20

  /** Custom actions to register */
  actions?: GOAPAction[];

  /** Custom heuristic function */
  heuristic?: (state: WorldState, goal: Partial<WorldState>) => number;
}
```

---

## 7. Error Handling and Recovery

### 7.1 Workflow Failures

Workflows can fail for various reasons. Here's how to handle them:

```typescript
import { createWorkflowService } from '@knowledge-graph-agent/workflow';

const service = createWorkflowService();

try {
  const result = await service.startCollaborationWorkflow('graph-123', './docs/spec.md');

  if (!result.success) {
    console.error(`Workflow failed: ${result.error}`);

    // Check what steps completed
    if (result.artifacts && result.artifacts.length > 0) {
      console.log('Completed steps:', result.artifacts.join(', '));
    }

    // Outcome provides more context
    switch (result.outcome) {
      case 'failed':
        console.log('Workflow failed during execution');
        break;
      case 'timeout':
        console.log('Workflow timed out');
        break;
      case 'cancelled':
        console.log('Workflow was cancelled');
        break;
    }
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### 7.2 GOAP Planning Failures

When GOAP cannot find a valid plan:

```typescript
const plan = goap.createPlan(worldState, 'start-development');

if (!plan.achievable) {
  console.log(`Cannot achieve goal: ${plan.reason}`);

  // Evaluate readiness to understand blockers
  const readiness = goap.evaluateReadiness(worldState);

  console.log('Current blockers:');
  readiness.blockers.forEach(b => console.log(`  - ${b}`));

  console.log('Recommendations:');
  readiness.recommendations.forEach(r => console.log(`  - ${r}`));

  // Try a simpler intermediate goal
  const intermediateplan = goap.createPlan(worldState, 'complete-spec');
  if (intermediateplan.achievable) {
    console.log('Intermediate plan available:', intermediateplan.actionIds);
  }
}
```

### 7.3 Recovery Strategies

**Automatic Recovery (Postgres World):**

With Postgres World, workflows automatically resume from their last checkpoint after a crash:

```typescript
// Workflow state is persisted to PostgreSQL
// On restart, incomplete workflows resume automatically
const service = createWorkflowService({
  workflow: createPostgresConfig(process.env.DATABASE_URL!),
});

await service.start();

// Check for any interrupted workflows
const status = service.getStatus();
console.log(`Active workflows: ${status.activeWorkflows.length}`);
```

**Manual Recovery:**

```bash
# Resume a stopped workflow
kg workflow resume abc12345

# Check workflow status
kg workflow status abc12345 --json
```

### 7.4 Error Types

| Error | Cause | Resolution |
|-------|-------|------------|
| `Unknown goal` | Invalid goal ID passed to createPlan | Use registered goal IDs |
| `Plan not achievable` | No action sequence leads to goal | Address blockers first |
| `Preconditions not met` | Action cannot be applied | Ensure state is valid |
| `Planning timeout` | Planning took too long | Increase timeout or simplify |
| `Workflow not found` | Invalid workflow ID | Check workflow list |

---

## 8. Best Practices

### 8.1 Workflow Design

1. **Keep Steps Small**: Each step should do one thing well
2. **Use Checkpoints**: Mark expensive operations as steps
3. **Handle Failures**: Always check result success flags
4. **Log Progress**: Use debug logging for troubleshooting

```typescript
// Good: Small, focused steps
async function validateDocument(path: string) {
  "use step";
  const content = await readFile(path);
  return validateSchema(content);
}

async function analyzeGaps(content: string) {
  "use step";
  return gapAnalyzer.analyze(content);
}

// Good: Check results
const result = await service.startCollaborationWorkflow(graphId, docPath);
if (!result.success) {
  logger.error('Workflow failed', { error: result.error, artifacts: result.artifacts });
  throw new Error(result.error);
}
```

### 8.2 GOAP Planning

1. **Define Clear Goals**: Goals should have measurable conditions
2. **Keep Actions Atomic**: Each action should change minimal state
3. **Set Appropriate Costs**: Use costs to guide optimal paths
4. **Enable Caching**: Cache plans for repeated patterns

```typescript
// Good: Clear goal conditions
const goal: GOAPGoal = {
  id: 'ready-for-development',
  name: 'Ready for Development',
  conditions: {
    hasSpecification: true,
    specCompleteness: 0.8,
    hasAcceptanceCriteria: true,
    taskDefined: true,
    blockersFree: true,
  },
  priority: 10,
};

// Good: Atomic action with clear preconditions and effects
const action: GOAPAction = {
  id: 'analyze-spec',
  name: 'Analyze Specification',
  cost: 1,
  preconditions: { hasSpecification: true },
  effects: { specCompleteness: 0.5 },
};
```

### 8.3 Production Deployment

1. **Use Postgres World**: Always use PostgreSQL in production
2. **Set Connection Limits**: Configure appropriate pool sizes
3. **Monitor Metrics**: Track execution stats
4. **Handle Secrets Securely**: Use environment variables

```typescript
// Production configuration
const service = createWorkflowService({
  workflow: createPostgresConfig(process.env.DATABASE_URL!, {
    schema: 'workflow',
    poolConfig: {
      max: parseInt(process.env.PG_POOL_MAX || '20'),
      idleTimeoutMillis: 30000,
    },
  }),
  debug: process.env.NODE_ENV !== 'production',
  webhookSecret: process.env.WEBHOOK_SECRET,
});

// Monitor metrics
const status = service.getStatus();
if (status.stats.failedExecutions > 0) {
  const failureRate = (status.stats.failedExecutions / status.stats.totalExecutions) * 100;
  if (failureRate > 10) {
    alerting.send('High workflow failure rate', { rate: failureRate });
  }
}
```

### 8.4 Testing

1. **Use Local World for Tests**: Avoid database dependencies in unit tests
2. **Mock External Services**: Isolate workflow logic
3. **Test Edge Cases**: Plan failures, timeouts, cancellations

```typescript
import { createLocalConfig, createWorkflowService } from '@knowledge-graph-agent/workflow';

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(() => {
    service = createWorkflowService({
      workflow: createLocalConfig('.test-workflow'),
      debug: true,
    });
  });

  afterEach(async () => {
    await service.stop();
  });

  it('should start and complete a collaboration workflow', async () => {
    await service.start();

    const result = await service.startCollaborationWorkflow(
      'test-graph',
      './fixtures/spec.md'
    );

    expect(result.success).toBe(true);
    expect(result.outcome).toBe('completed');
    expect(result.artifacts).toContain('analyze-spec');
  });
});
```

---

## Related Documentation

- [WORKFLOW-VECTOR-INTEGRATION.md](./WORKFLOW-VECTOR-INTEGRATION.md) - Integration with vector storage
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture overview
- [API.md](./API.md) - Complete API reference

---

*Documentation generated for Knowledge Graph Agent v1.0.0*
*Last updated: December 29, 2025*
