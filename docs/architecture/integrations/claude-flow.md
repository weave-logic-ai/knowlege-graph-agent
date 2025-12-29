---
title: Claude-Flow Integration Architecture
version: 1.0.0
status: active
category: integration
created: 2025-12-29
updated: 2025-12-29
author: Architecture Agent
dependencies:
  - claude-flow
  - "@workflow/ai"
  - "@workflow/postgres"
related:
  - ../concurrent-execution.md
  - ../../WORKFLOW-VECTOR-INTEGRATION.md
---

# Claude-Flow Integration Architecture

This document describes the integration architecture between the Knowledge Graph Agent and Claude-Flow, providing multi-agent orchestration, persistent memory, and neural pattern learning capabilities.

---

## 1. Architecture Overview

### 1.1 System Context Diagram

```
+-------------------------------------------------------------------------+
|                         CLAUDE CODE ENVIRONMENT                          |
+-------------------------------------------------------------------------+
|                                                                          |
|  +------------------+     +----------------------+     +---------------+ |
|  |   Claude Code    |     |  Knowledge Graph     |     |  Claude-Flow  | |
|  |   (MCP Client)   |<--->|  Agent MCP Server    |<--->|  MCP Server   | |
|  +------------------+     +----------------------+     +---------------+ |
|                                   |                           |          |
|                                   |      +--------------------+          |
|                                   |      |                               |
|                                   v      v                               |
|                           +------------------+                           |
|                           |  ServiceContainer |                          |
|                           |  (Shared State)   |                          |
|                           +------------------+                           |
|                                   |                                      |
|         +----------------+--------+--------+----------------+            |
|         |                |                 |                |            |
|         v                v                 v                v            |
|  +------------+  +---------------+  +------------+  +---------------+    |
|  | Knowledge  |  |   Workflow    |  |   Audit    |  |    Vector     |    |
|  | Graph DB   |  |   Service     |  |   Chain    |  |    Store      |    |
|  +------------+  +---------------+  +------------+  +---------------+    |
|                                                                          |
+-------------------------------------------------------------------------+
```

### 1.2 Integration Layers

```
+-------------------------------------------------------------------------+
|                          INTEGRATION STACK                               |
+-------------------------------------------------------------------------+
|                                                                          |
|  +-------------------------------------------------------------------+  |
|  |                     MCP TOOL LAYER                                 |  |
|  |  kg_workflow_start | kg_workflow_status | kg_vector_search        |  |
|  |  swarm_init | agent_spawn | task_orchestrate | neural_train       |  |
|  +-------------------------------------------------------------------+  |
|                                    |                                     |
|  +-------------------------------------------------------------------+  |
|  |                     HOOKS SYSTEM                                   |  |
|  |  pre-task | post-task | pre-edit | post-edit | session-*          |  |
|  +-------------------------------------------------------------------+  |
|                                    |                                     |
|  +-------------------------------------------------------------------+  |
|  |                     MEMORY LAYER                                   |  |
|  |  Cross-session persistence | Namespace management | Memory sync   |  |
|  +-------------------------------------------------------------------+  |
|                                    |                                     |
|  +-------------------------------------------------------------------+  |
|  |                     NEURAL LAYER                                   |  |
|  |  Pattern training | Cognitive analysis | Adaptive learning        |  |
|  +-------------------------------------------------------------------+  |
|                                                                          |
+-------------------------------------------------------------------------+
```

---

## 2. Memory Synchronization Mechanism

### 2.1 Memory Architecture

The Knowledge Graph Agent integrates with Claude-Flow's persistent memory system to maintain state across sessions and coordinate between agents.

```
+------------------------------------------------------------------+
|                    MEMORY SYNCHRONIZATION                         |
+------------------------------------------------------------------+
|                                                                   |
|  +-----------------------+     +-----------------------+          |
|  |   KG Agent Memory     |     |  Claude-Flow Memory   |          |
|  |                       |     |                       |          |
|  | +-------------------+ |     | +-------------------+ |          |
|  | | Session State     | |<--->| | Persistent Store  | |          |
|  | +-------------------+ |     | +-------------------+ |          |
|  | +-------------------+ |     | +-------------------+ |          |
|  | | Agent Priming     | |<--->| | Namespace Memory  | |          |
|  | +-------------------+ |     | +-------------------+ |          |
|  | +-------------------+ |     | +-------------------+ |          |
|  | | Trajectory Data   | |<--->| | Neural Patterns   | |          |
|  | +-------------------+ |     | +-------------------+ |          |
|  |                       |     |                       |          |
|  +-----------------------+     +-----------------------+          |
|                                                                   |
|                    SYNC PROTOCOL                                  |
|  1. Session start: Restore from Claude-Flow memory                |
|  2. Operation: Write-through to both stores                       |
|  3. Session end: Export metrics, persist patterns                 |
|                                                                   |
+------------------------------------------------------------------+
```

### 2.2 Memory Operations

```typescript
// Memory synchronization service
interface MemorySyncService {
  // Restore session state from Claude-Flow
  async restoreSession(sessionId: string): Promise<SessionState>;

  // Store key-value with namespace
  async store(namespace: string, key: string, value: unknown, ttl?: number): Promise<void>;

  // Retrieve with fallback to local cache
  async retrieve(namespace: string, key: string): Promise<unknown | null>;

  // Search across namespaces
  async search(pattern: string, limit?: number): Promise<SearchResult[]>;

  // Export session for persistence
  async exportSession(sessionId: string): Promise<ExportResult>;
}

// Namespace conventions
const NAMESPACES = {
  AGENT_PRIMING: 'kg-agent/priming',
  TRAJECTORIES: 'kg-agent/trajectories',
  PATTERNS: 'kg-agent/patterns',
  WORKFLOW_STATE: 'kg-agent/workflows',
  AUDIT_SYNC: 'kg-agent/audit',
};
```

---

## 3. MCP Tool Integration

### 3.1 Claude-Flow MCP Tools Used

The Knowledge Graph Agent leverages the following Claude-Flow MCP tools:

#### Swarm Coordination

| Tool | Purpose | Usage in KG Agent |
|------|---------|-------------------|
| `swarm_init` | Initialize agent swarm | Multi-agent workflow orchestration |
| `agent_spawn` | Create specialized agent | Spawn researcher, coder, analyst agents |
| `task_orchestrate` | Distribute tasks | Parallel knowledge graph operations |
| `swarm_status` | Monitor health | Track agent coordination status |
| `swarm_monitor` | Real-time metrics | Dashboard integration |

#### Memory Operations

| Tool | Purpose | Usage in KG Agent |
|------|---------|-------------------|
| `memory_usage` | Store/retrieve state | Cross-session persistence |
| `memory_search` | Pattern matching | Find related patterns |
| `memory_persist` | Session backup | Export workflow state |
| `memory_namespace` | Namespace management | Isolate agent contexts |

#### Neural Features

| Tool | Purpose | Usage in KG Agent |
|------|---------|-------------------|
| `neural_train` | Pattern training | Learn from trajectories |
| `neural_patterns` | Analyze patterns | Optimize agent behavior |
| `neural_status` | Model health | Monitor learning progress |

#### Performance Analysis

| Tool | Purpose | Usage in KG Agent |
|------|---------|-------------------|
| `performance_report` | Generate reports | Workflow efficiency analysis |
| `bottleneck_analyze` | Find issues | Identify slow operations |
| `token_usage` | Cost tracking | Monitor API costs |

### 3.2 Tool Integration Pattern

```typescript
// MCP tool integration wrapper
class ClaudeFlowIntegration {
  private mcpClient: MCPClient;

  constructor(mcpClient: MCPClient) {
    this.mcpClient = mcpClient;
  }

  // Initialize swarm for knowledge graph operations
  async initializeSwarm(config: SwarmConfig): Promise<SwarmResult> {
    const result = await this.mcpClient.callTool('swarm_init', {
      topology: config.topology || 'mesh',
      maxAgents: config.maxAgents || 5,
      strategy: config.strategy || 'adaptive',
    });

    return result;
  }

  // Spawn specialized agent for KG task
  async spawnAgent(type: AgentType, task: string): Promise<AgentResult> {
    return this.mcpClient.callTool('agent_spawn', {
      type,
      name: `kg-${type}-${Date.now()}`,
      capabilities: this.getAgentCapabilities(type),
    });
  }

  // Orchestrate multi-step workflow
  async orchestrateWorkflow(
    task: string,
    strategy: 'parallel' | 'sequential' | 'adaptive' = 'adaptive'
  ): Promise<OrchestrationResult> {
    return this.mcpClient.callTool('task_orchestrate', {
      task,
      strategy,
      priority: 'high',
      maxAgents: 3,
    });
  }

  // Store workflow state in Claude-Flow memory
  async persistWorkflowState(
    workflowId: string,
    state: WorkflowState
  ): Promise<void> {
    await this.mcpClient.callTool('memory_usage', {
      action: 'store',
      namespace: NAMESPACES.WORKFLOW_STATE,
      key: workflowId,
      value: JSON.stringify(state),
      ttl: 86400, // 24 hours
    });
  }

  // Train neural patterns from successful workflows
  async trainPatterns(trajectories: Trajectory[]): Promise<TrainingResult> {
    return this.mcpClient.callTool('neural_train', {
      pattern_type: 'coordination',
      training_data: JSON.stringify(trajectories),
      epochs: 50,
    });
  }

  private getAgentCapabilities(type: AgentType): string[] {
    const capabilities: Record<AgentType, string[]> = {
      researcher: ['search', 'analyze', 'synthesize'],
      coder: ['implement', 'refactor', 'test'],
      analyst: ['evaluate', 'report', 'recommend'],
      reviewer: ['audit', 'validate', 'approve'],
      documenter: ['document', 'explain', 'format'],
    };
    return capabilities[type] || [];
  }
}
```

---

## 4. Hooks System Integration

### 4.1 Hook Lifecycle

```
+------------------------------------------------------------------+
|                         HOOK LIFECYCLE                            |
+------------------------------------------------------------------+
|                                                                   |
|  SESSION START                                                    |
|  +----------------+     +------------------+     +-------------+  |
|  | session-restore| --> | Load KG context  | --> | Prime agents|  |
|  +----------------+     +------------------+     +-------------+  |
|                                                                   |
|  TASK EXECUTION                                                   |
|  +----------+  +------------+  +------------+  +----------+       |
|  | pre-task |->| Execute KG |->| post-edit  |->| post-task|       |
|  |  hooks   |  | operation  |  |   hooks    |  |  hooks   |       |
|  +----------+  +------------+  +------------+  +----------+       |
|                                                                   |
|  SESSION END                                                      |
|  +-------------+     +------------------+     +----------------+  |
|  | session-end | --> | Export metrics   | --> | Persist state  |  |
|  +-------------+     +------------------+     +----------------+  |
|                                                                   |
+------------------------------------------------------------------+
```

### 4.2 Hook Commands

```bash
# Pre-task: Prepare context and resources
npx claude-flow@alpha hooks pre-task \
  --description "Knowledge graph analysis" \
  --agent-type researcher

# Session restore: Load previous state
npx claude-flow@alpha hooks session-restore \
  --session-id "kg-session-$(date +%s)"

# Post-edit: Sync changes and train patterns
npx claude-flow@alpha hooks post-edit \
  --file "knowledge-graph.db" \
  --memory-key "kg-agent/changes/$(date +%s)"

# Notify: Broadcast operation status
npx claude-flow@alpha hooks notify \
  --message "Knowledge graph updated: 15 nodes, 23 edges"

# Post-task: Finalize and record trajectory
npx claude-flow@alpha hooks post-task \
  --task-id "kg-analyze-001" \
  --success true

# Session end: Export and persist
npx claude-flow@alpha hooks session-end \
  --export-metrics true
```

### 4.3 Hook Integration Service

```typescript
// Hooks integration for KG Agent
class HooksIntegration {
  // Called before any KG operation
  async preTask(description: string, agentType: AgentType): Promise<void> {
    await execAsync(`npx claude-flow@alpha hooks pre-task \
      --description "${description}" \
      --agent-type ${agentType}`);
  }

  // Called after file modifications
  async postEdit(filePath: string, memoryKey: string): Promise<void> {
    await execAsync(`npx claude-flow@alpha hooks post-edit \
      --file "${filePath}" \
      --memory-key "${memoryKey}"`);
  }

  // Called after task completion
  async postTask(taskId: string, success: boolean): Promise<void> {
    await execAsync(`npx claude-flow@alpha hooks post-task \
      --task-id "${taskId}" \
      --success ${success}`);
  }

  // Restore session state
  async restoreSession(sessionId: string): Promise<SessionState> {
    const result = await execAsync(`npx claude-flow@alpha hooks session-restore \
      --session-id "${sessionId}"`);
    return JSON.parse(result);
  }

  // End session and persist
  async endSession(exportMetrics: boolean = true): Promise<void> {
    await execAsync(`npx claude-flow@alpha hooks session-end \
      --export-metrics ${exportMetrics}`);
  }
}
```

---

## 5. Configuration Options

### 5.1 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CLAUDE_FLOW_ENABLED` | Enable Claude-Flow integration | `false` |
| `CLAUDE_FLOW_MCP_URL` | Claude-Flow MCP server URL | `stdio` |
| `CLAUDE_FLOW_TOPOLOGY` | Default swarm topology | `mesh` |
| `CLAUDE_FLOW_MAX_AGENTS` | Maximum concurrent agents | `8` |
| `CLAUDE_FLOW_MEMORY_NAMESPACE` | Base namespace for memory | `kg-agent` |
| `CLAUDE_FLOW_NEURAL_ENABLED` | Enable neural pattern training | `true` |
| `CLAUDE_FLOW_HOOKS_ENABLED` | Enable hooks automation | `true` |

### 5.2 Configuration File

```typescript
// config/claude-flow.ts
export interface ClaudeFlowConfig {
  enabled: boolean;

  swarm: {
    topology: 'mesh' | 'hierarchical' | 'ring' | 'star';
    maxAgents: number;
    strategy: 'balanced' | 'specialized' | 'adaptive';
  };

  memory: {
    namespace: string;
    persistSession: boolean;
    syncInterval: number; // milliseconds
  };

  neural: {
    enabled: boolean;
    patternTypes: ('coordination' | 'optimization' | 'prediction')[];
    trainingEpochs: number;
  };

  hooks: {
    enabled: boolean;
    preTask: boolean;
    postTask: boolean;
    postEdit: boolean;
    sessionManagement: boolean;
  };

  performance: {
    reportInterval: '24h' | '7d' | '30d';
    bottleneckThreshold: number;
    tokenTracking: boolean;
  };
}

// Default configuration
export const defaultClaudeFlowConfig: ClaudeFlowConfig = {
  enabled: true,

  swarm: {
    topology: 'mesh',
    maxAgents: 8,
    strategy: 'adaptive',
  },

  memory: {
    namespace: 'kg-agent',
    persistSession: true,
    syncInterval: 30000, // 30 seconds
  },

  neural: {
    enabled: true,
    patternTypes: ['coordination', 'optimization'],
    trainingEpochs: 50,
  },

  hooks: {
    enabled: true,
    preTask: true,
    postTask: true,
    postEdit: true,
    sessionManagement: true,
  },

  performance: {
    reportInterval: '24h',
    bottleneckThreshold: 0.8,
    tokenTracking: true,
  },
};
```

---

## 6. Code Examples

### 6.1 Initialize Claude-Flow for KG Operations

```typescript
import { ClaudeFlowIntegration } from './integrations/claude-flow';
import { MCPClient } from '@modelcontextprotocol/sdk';

async function initializeClaudeFlow() {
  // Create MCP client connection
  const mcpClient = await MCPClient.connect({
    transport: 'stdio',
    command: 'npx',
    args: ['claude-flow@alpha', 'mcp', 'start'],
  });

  // Create integration wrapper
  const claudeFlow = new ClaudeFlowIntegration(mcpClient);

  // Initialize swarm for knowledge graph operations
  const swarm = await claudeFlow.initializeSwarm({
    topology: 'mesh',
    maxAgents: 5,
    strategy: 'adaptive',
  });

  console.log(`Swarm initialized: ${swarm.swarmId}`);
  console.log(`Topology: ${swarm.topology}`);
  console.log(`Agents available: ${swarm.maxAgents}`);

  return { mcpClient, claudeFlow, swarm };
}
```

### 6.2 Multi-Agent Knowledge Graph Workflow

```typescript
async function executeKnowledgeGraphWorkflow(
  claudeFlow: ClaudeFlowIntegration,
  task: string
) {
  // Start hooks tracking
  const hooks = new HooksIntegration();
  await hooks.preTask(task, 'coordinator');

  try {
    // Spawn specialized agents
    const agents = await Promise.all([
      claudeFlow.spawnAgent('researcher', 'Analyze existing documentation'),
      claudeFlow.spawnAgent('coder', 'Generate node structures'),
      claudeFlow.spawnAgent('reviewer', 'Validate relationships'),
    ]);

    console.log(`Spawned ${agents.length} agents`);

    // Orchestrate the workflow
    const result = await claudeFlow.orchestrateWorkflow(task, 'parallel');

    // Persist workflow state
    await claudeFlow.persistWorkflowState(result.workflowId, {
      status: 'completed',
      agents: agents.map(a => a.agentId),
      results: result.data,
    });

    // Complete hooks tracking
    await hooks.postTask(result.workflowId, true);

    return result;

  } catch (error) {
    await hooks.postTask('workflow-error', false);
    throw error;
  }
}
```

### 6.3 Neural Pattern Training

```typescript
async function trainFromSuccessfulWorkflows(
  claudeFlow: ClaudeFlowIntegration,
  trajectories: Trajectory[]
) {
  // Filter successful trajectories
  const successfulTrajectories = trajectories.filter(t => t.success);

  if (successfulTrajectories.length < 5) {
    console.log('Not enough successful trajectories for training');
    return null;
  }

  // Train neural patterns
  const trainingResult = await claudeFlow.trainPatterns(successfulTrajectories);

  console.log(`Training completed:`);
  console.log(`  - Patterns learned: ${trainingResult.patternsLearned}`);
  console.log(`  - Training epochs: ${trainingResult.epochs}`);
  console.log(`  - Accuracy: ${(trainingResult.accuracy * 100).toFixed(2)}%`);

  // Store pattern insights in memory
  await claudeFlow.mcpClient.callTool('memory_usage', {
    action: 'store',
    namespace: NAMESPACES.PATTERNS,
    key: `training-${Date.now()}`,
    value: JSON.stringify(trainingResult),
  });

  return trainingResult;
}
```

### 6.4 Session Management

```typescript
class KGSessionManager {
  private claudeFlow: ClaudeFlowIntegration;
  private hooks: HooksIntegration;
  private sessionId: string;

  constructor(claudeFlow: ClaudeFlowIntegration) {
    this.claudeFlow = claudeFlow;
    this.hooks = new HooksIntegration();
    this.sessionId = `kg-session-${Date.now()}`;
  }

  async startSession(): Promise<SessionState> {
    // Restore previous session state if exists
    const previousState = await this.hooks.restoreSession(this.sessionId);

    if (previousState) {
      console.log(`Restored session: ${this.sessionId}`);
      console.log(`  - Previous operations: ${previousState.operationCount}`);
      console.log(`  - Cached patterns: ${previousState.patterns?.length || 0}`);
    }

    return previousState || { sessionId: this.sessionId, started: new Date() };
  }

  async endSession(): Promise<void> {
    // Export metrics and persist state
    await this.hooks.endSession(true);

    // Generate final performance report
    const report = await this.claudeFlow.mcpClient.callTool('performance_report', {
      timeframe: '24h',
      format: 'summary',
    });

    console.log(`Session ended: ${this.sessionId}`);
    console.log(`Performance summary:\n${report.summary}`);
  }
}
```

---

## 7. Best Practices

### 7.1 Agent Coordination

1. **Use appropriate topologies**:
   - `mesh` for peer-to-peer collaboration
   - `hierarchical` for complex workflows with dependencies
   - `star` for centralized control patterns

2. **Limit concurrent agents**: Keep `maxAgents` reasonable (5-8) to avoid resource contention

3. **Enable adaptive strategy**: Let Claude-Flow optimize agent allocation dynamically

### 7.2 Memory Management

1. **Use namespaces consistently**: Isolate agent contexts to prevent conflicts

2. **Set appropriate TTLs**: Clean up stale data automatically

3. **Persist important state**: Always persist workflow completion states

### 7.3 Hooks Usage

1. **Always pair pre/post hooks**: Ensure proper tracking and cleanup

2. **Use session management**: Leverage cross-session persistence for long-running workflows

3. **Export metrics**: Track performance trends over time

### 7.4 Neural Training

1. **Accumulate trajectories**: Wait for sufficient data before training

2. **Focus on success patterns**: Train primarily on successful workflows

3. **Monitor accuracy**: Track pattern accuracy and retrain as needed

---

## 8. Troubleshooting

### Common Issues

**Claude-Flow MCP not responding**
- Verify `npx claude-flow@alpha mcp start` runs successfully
- Check MCP server logs for connection issues

**Memory sync failures**
- Ensure namespace exists before storing
- Verify TTL values are positive integers

**Hook execution timeouts**
- Increase timeout in hook configuration
- Check for blocking operations in hook handlers

**Neural training not improving**
- Increase training epochs
- Provide more diverse trajectory data
- Verify pattern type matches task type

---

## 9. References

- [Claude-Flow Documentation](https://github.com/ruvnet/claude-flow)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Knowledge Graph Agent MCP Tools](../../../API.md#mcp-tools)
- [Workflow Integration Guide](../../WORKFLOW-VECTOR-INTEGRATION.md)
