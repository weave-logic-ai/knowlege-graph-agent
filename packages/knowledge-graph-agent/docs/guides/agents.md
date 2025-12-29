# Agents Guide

The Knowledge Graph Agent system provides a multi-agent architecture for intelligent knowledge graph operations. Agents specialize in different tasks and can coordinate through the rules engine and claude-flow integration.

## Overview

The agent system consists of:

1. **Agent Types** - Specialized agents for different tasks
2. **Rules Engine** - Declarative agent behavior coordination
3. **Agent Coordinator** - Multi-agent orchestration
4. **Claude-Flow Integration** - External swarm coordination

## Agent Types

### Built-in Agent Types

| Agent Type | Purpose | Capabilities |
|------------|---------|--------------|
| `researcher` | Knowledge discovery | Pattern detection, code analysis, reference finding |
| `coordinator` | Task orchestration | Agent spawning, task distribution, result aggregation |
| `analyst` | Data analysis | Metrics calculation, trend detection, reporting |
| `optimizer` | Performance tuning | Index optimization, query optimization |
| `documenter` | Documentation | Content generation, formatting, linking |
| `monitor` | Health monitoring | Status tracking, alerting, diagnostics |
| `specialist` | Domain expertise | Context-specific knowledge operations |
| `architect` | System design | Structure analysis, pattern recommendation |

### Agent Capabilities

Each agent type has specific capabilities:

```typescript
// Researcher capabilities
const researcherCapabilities = [
  'pattern-detection',
  'code-analysis',
  'reference-finding',
  'concept-extraction',
  'relationship-inference'
];

// Coordinator capabilities
const coordinatorCapabilities = [
  'agent-spawning',
  'task-distribution',
  'result-aggregation',
  'conflict-resolution',
  'priority-management'
];
```

## Working with Agents

### Spawning Agents

```typescript
import { AgentManager } from '@knowledge-graph-agent/agents';

const manager = new AgentManager();

// Spawn a single agent
const researcher = await manager.spawn({
  type: 'researcher',
  name: 'pattern-researcher',
  capabilities: ['pattern-detection', 'code-analysis']
});

// Spawn multiple agents
const agents = await manager.spawnMultiple([
  { type: 'researcher', name: 'researcher-1' },
  { type: 'analyst', name: 'analyst-1' },
  { type: 'documenter', name: 'documenter-1' }
]);
```

### Agent Lifecycle

```typescript
// Check agent status
const status = await researcher.getStatus();
console.log(`Status: ${status.state}`); // 'idle' | 'busy' | 'error'

// Assign task to agent
await researcher.assignTask({
  id: 'task-001',
  description: 'Analyze codebase for patterns',
  priority: 'high',
  context: { projectRoot: '/path/to/project' }
});

// Get task result
const result = await researcher.getTaskResult('task-001');

// Terminate agent
await researcher.terminate();
```

## Researcher Agent

The Researcher Agent specializes in knowledge discovery and pattern detection.

### Creating a Researcher

```typescript
import { ResearcherAgent } from '@knowledge-graph-agent/agents';

const researcher = new ResearcherAgent({
  name: 'codebase-researcher',
  config: {
    maxDepth: 5,
    patternThreshold: 0.7,
    includeComments: true
  }
});
```

### Research Methods

```typescript
// Analyze patterns in codebase
const patterns = await researcher.analyzePatterns({
  projectRoot: '/path/to/project',
  filePatterns: ['**/*.ts', '**/*.js'],
  patternTypes: ['architectural', 'design', 'anti-pattern']
});

// Find code references
const references = await researcher.findReferences({
  query: 'EventEmitter',
  scope: 'project',
  includeTests: false
});

// Extract concepts from content
const concepts = await researcher.extractConcepts({
  content: 'markdown or code content...',
  minConfidence: 0.6
});

// Infer relationships
const relationships = await researcher.inferRelationships({
  nodes: ['event-sourcing', 'cqrs', 'domain-events'],
  method: 'semantic' // 'semantic' | 'structural' | 'both'
});
```

### Research Results

```typescript
interface PatternAnalysisResult {
  patterns: {
    name: string;
    type: 'architectural' | 'design' | 'anti-pattern';
    confidence: number;
    locations: string[];
    evidence: string[];
  }[];
  summary: string;
  recommendations: string[];
}

interface ConceptExtractionResult {
  concepts: {
    name: string;
    type: NodeType;
    confidence: number;
    context: string;
    suggestedTags: string[];
  }[];
}
```

## Rules Engine

The Rules Engine provides declarative behavior coordination for agents.

### Rule Structure

```typescript
interface Rule {
  id: string;
  name: string;
  description: string;
  trigger: RuleTrigger;
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  enabled: boolean;
}
```

### Creating Rules

```typescript
import { RulesEngine } from '@knowledge-graph-agent/agents';

const engine = new RulesEngine();

// Add a rule
await engine.addRule({
  id: 'auto-link-concepts',
  name: 'Auto-link Related Concepts',
  description: 'Automatically create links between related concepts',
  trigger: {
    type: 'event',
    event: 'node:created'
  },
  conditions: [
    { field: 'node.type', operator: 'equals', value: 'concept' },
    { field: 'node.status', operator: 'equals', value: 'active' }
  ],
  actions: [
    {
      type: 'spawn-agent',
      agent: 'researcher',
      task: 'find-related-concepts',
      params: { nodeId: '{{node.id}}' }
    },
    {
      type: 'create-edges',
      source: '{{node.id}}',
      targets: '{{research.results}}',
      edgeType: 'related'
    }
  ],
  priority: 10,
  enabled: true
});
```

### Rule Triggers

| Trigger Type | Description | Example |
|--------------|-------------|---------|
| `event` | Graph events | `node:created`, `edge:deleted` |
| `schedule` | Time-based | `cron: '0 0 * * *'` |
| `condition` | State change | `when node.status changes` |
| `manual` | User initiated | `on-demand` |

### Rule Conditions

```typescript
// Field comparison
{ field: 'node.type', operator: 'equals', value: 'concept' }
{ field: 'node.wordCount', operator: 'greaterThan', value: 100 }

// Pattern matching
{ field: 'node.title', operator: 'matches', value: '^API.*' }

// Array operations
{ field: 'node.tags', operator: 'contains', value: 'important' }
{ field: 'node.tags', operator: 'hasAny', value: ['critical', 'urgent'] }

// Logical operators
{
  operator: 'and',
  conditions: [
    { field: 'node.type', operator: 'equals', value: 'technical' },
    { field: 'node.status', operator: 'notEquals', value: 'archived' }
  ]
}
```

### Rule Actions

| Action Type | Description | Parameters |
|-------------|-------------|------------|
| `spawn-agent` | Start agent | `agent`, `task`, `params` |
| `create-node` | Create node | `type`, `title`, `content` |
| `update-node` | Update node | `nodeId`, `changes` |
| `create-edges` | Create links | `source`, `targets`, `type` |
| `notify` | Send notification | `channel`, `message` |
| `execute-workflow` | Run workflow | `workflowId`, `params` |

### Managing Rules

```typescript
// List all rules
const rules = await engine.listRules();

// Enable/disable rule
await engine.enableRule('auto-link-concepts');
await engine.disableRule('auto-link-concepts');

// Update rule
await engine.updateRule('auto-link-concepts', {
  priority: 20,
  conditions: [...]
});

// Remove rule
await engine.removeRule('auto-link-concepts');

// Execute rule manually
await engine.executeRule('auto-link-concepts', {
  node: { id: 'new-concept', type: 'concept' }
});
```

## Agent Coordination

### Coordinator Agent

The Coordinator manages multi-agent workflows.

```typescript
import { CoordinatorAgent } from '@knowledge-graph-agent/agents';

const coordinator = new CoordinatorAgent({
  name: 'main-coordinator',
  config: {
    maxConcurrentAgents: 5,
    taskTimeout: 60000,
    retryPolicy: { maxRetries: 3, backoff: 'exponential' }
  }
});
```

### Coordinated Workflows

```typescript
// Define a coordinated workflow
const workflow = await coordinator.createWorkflow({
  id: 'full-analysis',
  name: 'Complete Codebase Analysis',
  steps: [
    {
      id: 'research',
      agent: 'researcher',
      task: 'analyze-patterns',
      outputs: ['patterns', 'concepts']
    },
    {
      id: 'analyze',
      agent: 'analyst',
      task: 'calculate-metrics',
      inputs: ['research.patterns'],
      outputs: ['metrics']
    },
    {
      id: 'document',
      agent: 'documenter',
      task: 'generate-report',
      inputs: ['research.concepts', 'analyze.metrics'],
      outputs: ['report']
    }
  ]
});

// Execute workflow
const result = await coordinator.executeWorkflow('full-analysis', {
  projectRoot: '/path/to/project'
});
```

### Agent Communication

```typescript
// Direct message between agents
await coordinator.sendMessage({
  from: 'researcher-1',
  to: 'analyst-1',
  type: 'data',
  payload: { patterns: [...] }
});

// Broadcast to all agents
await coordinator.broadcast({
  from: 'coordinator',
  type: 'notification',
  payload: { message: 'Analysis complete' }
});

// Subscribe to agent messages
coordinator.onMessage('analyst-1', (message) => {
  console.log(`Received from analyst: ${message.type}`);
});
```

## Claude-Flow Integration

### Connecting to Claude-Flow

```typescript
import { ClaudeFlowBridge } from '@knowledge-graph-agent/agents';

const bridge = new ClaudeFlowBridge({
  namespace: 'knowledge-graph',
  syncOnChange: true
});

// Connect to claude-flow swarm
await bridge.connect();

// Sync agents with swarm
await bridge.syncAgents();
```

### Swarm Coordination

```typescript
// Initialize swarm with knowledge graph agents
await bridge.initSwarm({
  topology: 'mesh',
  agents: [
    { type: 'researcher', count: 2 },
    { type: 'analyst', count: 1 },
    { type: 'documenter', count: 1 }
  ]
});

// Orchestrate task across swarm
const result = await bridge.orchestrate({
  task: 'Analyze repository and generate documentation',
  strategy: 'parallel',
  maxAgents: 4
});
```

### Memory Synchronization

```typescript
// Store in claude-flow memory
await bridge.storeMemory({
  key: 'analysis-results',
  value: { patterns: [...], metrics: {...} },
  namespace: 'knowledge-graph',
  ttl: 3600
});

// Retrieve from memory
const data = await bridge.retrieveMemory('analysis-results');

// Search memory
const results = await bridge.searchMemory('pattern:*');
```

## Custom Agent Development

### Creating a Custom Agent

```typescript
import { BaseAgent, AgentConfig } from '@knowledge-graph-agent/agents';

interface MyAgentConfig extends AgentConfig {
  customOption: string;
}

class MyCustomAgent extends BaseAgent<MyAgentConfig> {
  readonly type = 'custom';
  readonly capabilities = ['custom-analysis', 'special-processing'];

  async initialize(): Promise<void> {
    // Setup agent resources
    this.logger.info('Custom agent initialized');
  }

  async processTask(task: AgentTask): Promise<AgentResult> {
    // Implement task processing
    switch (task.type) {
      case 'custom-analysis':
        return this.performCustomAnalysis(task.params);
      case 'special-processing':
        return this.performSpecialProcessing(task.params);
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }
  }

  private async performCustomAnalysis(params: any): Promise<AgentResult> {
    // Custom analysis logic
    return {
      success: true,
      data: { /* results */ }
    };
  }

  async cleanup(): Promise<void> {
    // Cleanup resources
    this.logger.info('Custom agent cleanup');
  }
}
```

### Registering Custom Agents

```typescript
import { AgentRegistry } from '@knowledge-graph-agent/agents';

// Register custom agent type
AgentRegistry.register('custom', MyCustomAgent);

// Spawn custom agent through manager
const customAgent = await manager.spawn({
  type: 'custom',
  name: 'my-custom-agent',
  config: { customOption: 'value' }
});
```

### Agent Hooks

```typescript
class MyCustomAgent extends BaseAgent {
  // Called before each task
  async beforeTask(task: AgentTask): Promise<void> {
    await this.bridge.executeHook('pre-task', {
      agentId: this.id,
      taskId: task.id
    });
  }

  // Called after each task
  async afterTask(task: AgentTask, result: AgentResult): Promise<void> {
    await this.bridge.executeHook('post-task', {
      agentId: this.id,
      taskId: task.id,
      success: result.success
    });
  }

  // Called on errors
  async onError(error: Error, task?: AgentTask): Promise<void> {
    await this.bridge.executeHook('error', {
      agentId: this.id,
      error: error.message,
      taskId: task?.id
    });
  }
}
```

## Configuration

### Agent Manager Configuration

```typescript
const manager = new AgentManager({
  // Maximum concurrent agents
  maxAgents: 10,

  // Default task timeout (ms)
  defaultTimeout: 60000,

  // Retry policy
  retryPolicy: {
    maxRetries: 3,
    backoff: 'exponential',
    initialDelay: 1000
  },

  // Claude-flow integration
  claudeFlow: {
    enabled: true,
    namespace: 'knowledge-graph'
  },

  // Logging
  logging: {
    level: 'info',
    format: 'json'
  }
});
```

### Rules Engine Configuration

```typescript
const engine = new RulesEngine({
  // Maximum rules to execute per event
  maxRulesPerEvent: 10,

  // Rule execution timeout (ms)
  ruleTimeout: 30000,

  // Enable rule chaining
  enableChaining: true,

  // Maximum chain depth
  maxChainDepth: 5
});
```

## Best Practices

1. **Use appropriate agent types** - Match agent capabilities to task requirements
2. **Implement timeouts** - Always set reasonable task timeouts
3. **Handle failures gracefully** - Implement retry logic and fallbacks
4. **Monitor agent health** - Track agent status and resource usage
5. **Coordinate effectively** - Use the rules engine for complex workflows
6. **Clean up resources** - Properly terminate agents when done

## Troubleshooting

### Common Issues

**Agent not responding**
- Check agent status with `agent.getStatus()`
- Verify task timeout hasn't been exceeded
- Check for error in agent logs

**Rules not triggering**
- Verify rule is enabled
- Check trigger conditions match event
- Review condition evaluation logic

**Coordination failures**
- Verify claude-flow connection
- Check memory synchronization
- Review message routing

### Debug Mode

```typescript
// Enable debug logging
const manager = new AgentManager({
  logging: { level: 'debug' }
});

// Trace rule execution
const engine = new RulesEngine({
  tracing: true
});
```

## Related Guides

- [Cultivation Guide](./cultivation.md) - Automated codebase analysis
- [Knowledge Graph Guide](./knowledge-graph.md) - Graph operations
- [MCP Server Guide](./mcp-server.md) - MCP tool integration
