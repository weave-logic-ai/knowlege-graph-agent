# Multi-Agent Coordination Framework

## Overview

The Multi-Agent Coordination Framework provides expert registry, task routing, inter-agent communication, and consensus mechanisms for coordinated multi-agent execution.

## Architecture

### Components

1. **Expert Registry** - Manages expert agents with capability matching and performance tracking
2. **Message Bus** - Event-driven communication with pub/sub and direct messaging
3. **Task Router** - Intelligent task routing with load balancing and decomposition
4. **Consensus Engine** - Voting and consensus building for decision making
5. **Multi-Agent Coordinator** - Orchestrates all coordination components

### Design Principles

- **Low Latency**: <50ms coordination overhead
- **High Throughput**: Handles 1000s of messages/sec
- **Fault Tolerance**: Retry mechanisms and dead letter queues
- **Scalability**: Supports 100+ concurrent experts
- **Performance Tracking**: Real-time metrics and analytics

## Quick Start

### Basic Usage

```typescript
import { MultiAgentCoordinator } from './agents/coordination';

// Initialize coordinator
const coordinator = new MultiAgentCoordinator();

// Register expert
coordinator.registerExpert({
  id: 'coder-1',
  type: 'coder',
  capabilities: [
    { name: 'typescript', level: 0.9 },
    { name: 'testing', level: 0.8 },
  ],
  status: 'idle',
  load: 0,
  maxConcurrentTasks: 5,
  currentTasks: [],
  metadata: {},
});

// Route a task
const result = await coordinator.routeTask({
  taskId: 'task-001',
  requirements: [
    { capability: 'typescript', minLevel: 0.8, required: true },
  ],
  priority: 'high',
});

console.log('Assigned to:', result.assignedExperts);
```

### CLI Commands

```bash
# List all experts
weaver agents list

# Register an expert
weaver agents register -i expert-1 -t coder -c "typescript,testing"

# Route a task
weaver agents route -i task-1 -r "typescript,testing" -p high

# Start a vote
weaver agents vote -i vote-1 -q "Approve?" -o "yes,no" -v "expert-1,expert-2"

# View metrics
weaver agents metrics

# Run demo
weaver agents demo
```

## Expert Registry

### Registering Experts

```typescript
const expert: ExpertProfile = {
  id: 'planner-1',
  type: 'planner',
  capabilities: [
    { name: 'task-breakdown', level: 0.9 },
    { name: 'dependency-analysis', level: 0.85 },
  ],
  status: 'idle',
  load: 0,
  maxConcurrentTasks: 5,
  currentTasks: [],
  metadata: {
    specialization: 'agile planning',
  },
};

coordinator.registerExpert(expert);
```

### Finding Experts

```typescript
// Find experts by capability
const experts = coordinator.registry.findExperts([
  { capability: 'task-breakdown', minLevel: 0.8 },
  { capability: 'dependency-analysis', minLevel: 0.7 },
]);

// Get best expert
const best = coordinator.registry.getBestExpert([
  { capability: 'task-breakdown', required: true },
]);
```

### Performance Tracking

```typescript
// Record task completion
coordinator.registry.recordTaskCompletion(
  'expert-1',
  true,  // success
  1500   // response time in ms
);

// Get statistics
const stats = coordinator.registry.getStatistics();
console.log('Success rate:', stats.performance[0].successRate);
console.log('Avg response time:', stats.performance[0].avgResponseTime);
```

## Task Routing

### Single Expert Routing

```typescript
const result = await coordinator.routeTask({
  taskId: 'task-001',
  requirements: [
    { capability: 'implementation', minLevel: 0.8, required: true },
  ],
  priority: 'high',
  preferredExperts: ['coder-1'], // Optional
  excludeExperts: ['coder-2'],   // Optional
});
```

### Multi-Expert Decomposition

```typescript
const result = await coordinator.routeTask({
  taskId: 'task-002',
  requirements: [
    { capability: 'implementation', required: true },
    { capability: 'testing', required: true },
    { capability: 'review', required: true },
  ],
  priority: 'high',
  maxExperts: 3, // Enable decomposition
});

console.log('Decomposed:', result.decomposed);
console.log('Subtasks:', result.subtasks);
```

### Task Completion

```typescript
await coordinator.completeTask(
  'task-001',
  'expert-1',
  true,  // success
  1500,  // response time
  { /* result data */ }
);
```

## Message Bus

### Publish/Subscribe

```typescript
// Subscribe to topic
const subId = coordinator.subscribe('status.update', (message) => {
  console.log('Status:', message.payload);
});

// Publish message
await coordinator.publishMessage('status.update', {
  status: 'processing',
  progress: 0.5,
});

// Unsubscribe
coordinator.unsubscribe(subId);
```

### Direct Messaging

```typescript
// Send to specific expert
await coordinator.sendDirectMessage(
  'expert-1',
  'code.request',
  { feature: 'authentication' }
);

// Send to multiple experts
await coordinator.sendDirectMessage(
  ['expert-1', 'expert-2'],
  'review.request',
  { code: '...' }
);
```

### Message Priority

```typescript
await coordinator.publishMessage(
  'critical.alert',
  { error: 'System failure' },
  { priority: 'critical' }
);
```

### Message History & Replay

```typescript
// Get message history
const history = coordinator.messageBus.getHistory({
  topic: 'status.update',
  limit: 100,
  since: Date.now() - 3600000, // Last hour
});

// Replay messages
await coordinator.messageBus.replay({
  topic: 'status.update',
  since: Date.now() - 3600000,
});
```

## Consensus Mechanisms

### Starting a Vote

```typescript
const voteId = await coordinator.startVote({
  id: 'vote-001',
  question: 'Should we proceed with approach A?',
  options: ['yes', 'no', 'need-more-info'],
  voters: ['expert-1', 'expert-2', 'expert-3'],
  mode: 'majority',
  quorum: 0.67, // 67% participation required
  timeout: 60000, // 1 minute
});
```

### Casting Votes

```typescript
await coordinator.vote(
  voteId,
  'expert-1',
  'yes',
  0.9, // confidence (0-1)
  'Approach A is more scalable'
);
```

### Consensus Modes

#### Majority (>50%)

```typescript
mode: 'majority'
```

#### Supermajority (≥67%)

```typescript
mode: 'supermajority'
```

#### Unanimous (100%)

```typescript
mode: 'unanimous'
```

#### Weighted Voting

```typescript
{
  mode: 'weighted',
  weights: {
    'security-expert': 2.0,
    'performance-expert': 1.5,
    'architecture-expert': 1.5,
  }
}
```

### Waiting for Results

```typescript
// Wait for vote to complete
const result = await coordinator.waitForVote(voteId, 60000);

console.log('Winner:', result.winner);
console.log('Consensus reached:', result.consensusReached);
console.log('Confidence:', result.confidence);
console.log('Breakdown:', result.breakdown);
```

## Coordination Workflows

### Planning → Execution → Reflection

```typescript
const results = await coordinator.executeWorkflow(
  'feature-implementation',
  [
    {
      expertType: 'planner',
      task: 'Break down feature requirements',
      requirements: [{ capability: 'task-breakdown' }],
    },
    {
      expertType: 'coder',
      task: 'Implement feature',
      requirements: [{ capability: 'implementation' }],
    },
    {
      expertType: 'reflection',
      task: 'Analyze implementation quality',
      requirements: [{ capability: 'quality-analysis' }],
    },
  ]
);
```

### Multi-Expert Code Review

```typescript
const reviewResult = await coordinator.codeReviewWorkflow(
  sourceCode,
  ['security-expert', 'performance-expert', 'architecture-expert']
);

console.log('Review decision:', reviewResult.winner);
```

### Error Recovery

```typescript
await coordinator.errorRecoveryWorkflow(
  new Error('Database connection failed'),
  'task-001'
);
```

## Performance Metrics

### Real-time Metrics

```typescript
const metrics = coordinator.getMetrics();

console.log('Total experts:', metrics.totalExperts);
console.log('Active experts:', metrics.activeExperts);
console.log('Message rate:', metrics.messageRate);
console.log('Consensus success rate:', metrics.consensusSuccessRate);
console.log('Expert utilization:', metrics.expertUtilization);
```

### Event Monitoring

```typescript
coordinator.on('event', (event: CoordinationEvent) => {
  console.log('Event:', event.type);
  console.log('Timestamp:', event.timestamp);
  console.log('Metadata:', event.metadata);
});
```

### Performance Benchmarks

- **Expert Registration**: <5ms
- **Task Routing**: <50ms
- **Message Publishing**: <5ms
- **Vote Casting**: <5ms
- **Overall Coordination**: <50ms

## Best Practices

### 1. Expert Design

- Define specific, focused capabilities
- Set realistic performance levels (0-1)
- Monitor and adjust maxConcurrentTasks based on load
- Track performance metrics for continuous improvement

### 2. Task Routing

- Use specific capability requirements
- Set appropriate priority levels
- Enable decomposition for complex tasks
- Prefer experts with lower load for better distribution

### 3. Messaging

- Use meaningful topic names
- Set appropriate message priorities
- Handle message failures gracefully
- Monitor dead letter queue

### 4. Consensus

- Choose appropriate consensus mode
- Set realistic quorum requirements
- Provide timeout for votes
- Include reasoning in votes for traceability

### 5. Performance

- Monitor coordination overhead
- Balance load across experts
- Use message batching when possible
- Clean up completed tasks promptly

## Integration

### With Learning Orchestrator

```typescript
import { LearningOrchestrator } from '../learning-loop';
import { MultiAgentCoordinator } from '../coordination';

const learningOrch = new LearningOrchestrator();
const coordinator = new MultiAgentCoordinator();

// Route learning tasks
const result = await coordinator.routeTask({
  taskId: 'learn-001',
  requirements: [{ capability: 'pattern-recognition' }],
  priority: 'medium',
});

// Use consensus for learning decisions
const voteId = await coordinator.startVote({
  id: 'learning-vote',
  question: 'Should we update the model?',
  options: ['yes', 'no', 'need-more-data'],
  voters: ['learning-agent', 'validation-agent'],
  mode: 'majority',
});
```

### With Workflow Engine

```typescript
import { WorkflowEngine } from '../workflows';

const workflow = new WorkflowEngine({
  coordinator, // Pass coordinator for multi-agent tasks
});

workflow.registerStep('multi-agent-step', async (context) => {
  const result = await coordinator.routeTask({
    taskId: context.taskId,
    requirements: context.requirements,
    priority: 'high',
  });

  return result;
});
```

## Troubleshooting

### No Expert Found

```typescript
// Check if experts are registered
const experts = coordinator.getAllExperts();
console.log('Available experts:', experts.length);

// Check capability index
const stats = coordinator.registry.getStatistics();
console.log('Capabilities:', stats.capabilities);

// Use fallback routing
const result = await coordinator.routeTask({
  taskId: 'task-001',
  requirements: [{ capability: 'non-existent', required: false }],
  priority: 'high',
});

if (result.fallback) {
  console.log('Using fallback expert');
}
```

### High Coordination Overhead

```typescript
// Check metrics
const metrics = coordinator.getMetrics();
console.log('Message queue size:', metrics.totalMessages);
console.log('Expert utilization:', metrics.expertUtilization);

// Optimize expert count
if (metrics.avgLoad < 0.3) {
  console.log('Consider reducing number of experts');
}

// Enable batching
await Promise.all([
  coordinator.routeTask(/* ... */),
  coordinator.routeTask(/* ... */),
  coordinator.routeTask(/* ... */),
]);
```

### Message Delivery Failures

```typescript
// Check dead letter queue
const deadLetters = coordinator.messageBus.getDeadLetterQueue();
console.log('Failed messages:', deadLetters.length);

// Retry failed messages
await coordinator.messageBus.retryDeadLetters();

// Monitor message statistics
const stats = coordinator.messageBus.getStatistics();
console.log('Queue size:', stats.queueSize);
console.log('Dead letter size:', stats.deadLetterSize);
```

## API Reference

See `src/agents/coordination/types.ts` for complete type definitions.

### Core Types

- `ExpertProfile` - Expert agent configuration
- `TaskRoutingRequest` - Task routing parameters
- `RoutingResult` - Task routing outcome
- `Message` - Inter-agent message
- `VoteRequest` - Consensus vote configuration
- `VoteResult` - Consensus vote outcome
- `CoordinationMetrics` - Performance metrics

### Main Classes

- `ExpertRegistry` - Expert management
- `MessageBus` - Inter-agent messaging
- `TaskRouter` - Task routing logic
- `ConsensusEngine` - Voting and consensus
- `MultiAgentCoordinator` - Main orchestrator

## Examples

See `examples/coordination/` for complete examples:

- `basic-coordination.ts` - Basic usage patterns
- `planning-execution-reflection.ts` - Workflow example
- `multi-expert-review.ts` - Code review workflow

## Testing

```bash
# Run all coordination tests
bun test tests/unit/agents/coordination/

# Run performance tests
bun test tests/integration/coordination-performance.test.ts

# Run specific component tests
bun test tests/unit/agents/coordination/registry.test.ts
```

## Performance Targets

✅ Expert registration: <5ms
✅ Task routing: <50ms
✅ Message publishing: <5ms
✅ Vote casting: <5ms
✅ Overall coordination overhead: <50ms
✅ Memory efficiency: <50MB for 1000 operations
✅ Throughput: >1000 operations/sec

## Roadmap

- [ ] Distributed coordination across multiple processes
- [ ] Persistent expert registry with database backing
- [ ] Advanced load prediction and proactive scaling
- [ ] ML-based task routing optimization
- [ ] Real-time coordination dashboard
- [ ] Integration with external coordination systems
