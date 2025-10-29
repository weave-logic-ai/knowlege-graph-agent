# Agent Orchestration Rules Guide

## Overview

The Agent Orchestration Rules Engine provides intelligent, rule-based task routing and management for multi-agent workflows. Rules are defined in JSON format and evaluated dynamically to make decisions about task assignment, splitting, and prioritization.

## Quick Start

### 1. Initialize Rules

```bash
weaver agents init
```

This creates `~/.weaver/agent-rules.json` with example rules.

### 2. List Active Rules

```bash
weaver agents rules --list
```

### 3. Validate Rules

```bash
weaver agents rules --validate
```

## Rule Schema

### Basic Structure

```json
{
  "rules": [
    {
      "id": "unique-rule-id",
      "name": "Human-readable name",
      "description": "What this rule does",
      "condition": "JavaScript expression",
      "action": "action_type",
      "priority": 100,
      "enabled": true
    }
  ]
}
```

### Rule Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier for the rule |
| `name` | string | No | Human-readable name |
| `description` | string | No | Detailed description |
| `condition` | string | Yes | JavaScript expression (evaluated with task context) |
| `action` | string | Yes | Action to take (see below) |
| `priority` | number | Yes | Evaluation priority (higher = first) |
| `enabled` | boolean | No | Whether rule is active (default: true) |

## Actions

### 1. `route_to_agent`

Routes task to a specific agent.

```json
{
  "action": "route_to_agent",
  "agent": "researcher"
}
```

**Agent Types:**
- `researcher` - Research and analysis
- `coder` - Code implementation
- `architect` - System design
- `tester` - Testing and QA
- `analyst` - Code review and metrics
- `planner` - Planning and estimation
- `error-detector` - Debugging and error detection

### 2. `split_parallel`

Splits complex task into parallel subtasks.

```json
{
  "action": "split_parallel",
  "max_subtasks": 4
}
```

### 3. `adjust_priority`

Adjusts task priority dynamically.

```json
{
  "action": "adjust_priority",
  "priority_adjustment": 25
}
```

Priority values:
- `critical`: 100
- `high`: 75
- `medium`: 50
- `low`: 25

### 4. `set_timeout`

Sets execution timeout for task.

```json
{
  "action": "set_timeout",
  "timeout_ms": 300000
}
```

### 5. `skip_task`

Skips task execution.

```json
{
  "action": "skip_task"
}
```

## Condition Expressions

Conditions are JavaScript expressions evaluated with task context.

### Available Context

```typescript
{
  task: {
    id: string;
    description: string;
    type: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    dependencies?: string[];
    requiredCapabilities?: string[];
    estimatedComplexity?: number;
    files?: string[];
    metadata?: Record<string, unknown>;
  };
  agentWorkload: Map<AgentType, number>;
  availableAgents: AgentType[];
  currentTime: Date;
  projectDeadline?: Date;
}
```

### Example Conditions

**File Pattern Matching:**
```javascript
"task.files && task.files.some(f => f.endsWith('.tsx'))"
```

**Keyword Detection:**
```javascript
"task.description.toLowerCase().includes('urgent')"
```

**Complexity Check:**
```javascript
"task.estimatedComplexity > 7"
```

**Dependency Count:**
```javascript
"task.dependencies && task.dependencies.length > 2"
```

**Multiple Conditions:**
```javascript
"task.priority === 'high' && task.type === 'testing'"
```

**Agent Workload:**
```javascript
"agentWorkload.get('coder') < 3"
```

## Best Practices

### 1. Rule Priority

- **100+**: Critical routing decisions
- **90-99**: Important specialization routing
- **80-89**: Priority adjustments
- **70-79**: Task splitting
- **<70**: General rules

### 2. Condition Performance

- Keep conditions simple and fast
- Avoid complex computations
- Use early returns
- Leverage built-in string methods

**Good:**
```javascript
"task.type === 'testing'"
```

**Avoid:**
```javascript
"task.description.split(' ').filter(w => w.length > 5).length > 10"
```

### 3. Rule Organization

Group rules by category:
- **Routing**: Agent assignment
- **Splitting**: Task decomposition
- **Priority**: Dynamic prioritization
- **Timeout**: Execution limits

### 4. Testing Rules

Always validate after changes:

```bash
weaver agents rules --validate
```

### 5. Rule Conflicts

Higher priority rules win conflicts. The engine automatically resolves:
- Multiple agent assignments → Use highest priority
- Multiple priority adjustments → Sum all adjustments

## Common Patterns

### Pattern 1: File-Based Routing

```json
{
  "id": "ui-specialist",
  "condition": "task.files && task.files.some(f => f.match(/\\.(tsx|jsx|css)$/))",
  "action": "route_to_agent",
  "agent": "coder",
  "priority": 100
}
```

### Pattern 2: Complexity-Based Splitting

```json
{
  "id": "split-complex",
  "condition": "task.estimatedComplexity > 7 && task.description.includes(',')",
  "action": "split_parallel",
  "max_subtasks": 3,
  "priority": 85
}
```

### Pattern 3: Deadline Urgency

```json
{
  "id": "urgent-boost",
  "condition": "task.description.toLowerCase().match(/urgent|asap|critical/)",
  "action": "adjust_priority",
  "priority_adjustment": 30,
  "priority": 95
}
```

### Pattern 4: Capability Matching

```json
{
  "id": "security-specialist",
  "condition": "task.requiredCapabilities && task.requiredCapabilities.includes('security')",
  "action": "route_to_agent",
  "agent": "analyst",
  "priority": 98
}
```

## CLI Commands

### List Rules
```bash
weaver agents rules --list
```

### Validate Rules
```bash
weaver agents rules --validate
```

### Show Statistics
```bash
weaver agents rules --stats
```

### Reload Rules
```bash
weaver agents rules --reload
```

### Custom Rules File
```bash
weaver agents rules --path /custom/path/rules.json --list
```

### Show Metrics
```bash
weaver agents metrics
weaver agents metrics --detailed
weaver agents metrics --reset
```

### Show Workload
```bash
weaver agents workload
weaver agents workload --agent coder
```

## Performance

The rule engine is optimized for speed:

- **Evaluation**: <10ms per rule (configurable timeout)
- **Caching**: Optional result caching with TTL
- **Conflict Detection**: Automatic with minimal overhead
- **Memory**: Minimal footprint

### Performance Tips

1. **Order by Priority**: Most specific rules first
2. **Simple Conditions**: Avoid expensive operations
3. **Enable Caching**: For repeated evaluations
4. **Limit Rules**: Keep under 20 active rules

## Troubleshooting

### Rule Not Matching

1. Check condition syntax
2. Verify task properties are available
3. Test condition in isolation
4. Check rule priority vs other rules

### Performance Issues

1. Profile slow conditions
2. Reduce complexity
3. Enable caching
4. Increase timeout if needed

### Conflicts

1. Review rule priorities
2. Check overlapping conditions
3. Make conditions more specific
4. Use `--stats` to see conflict counts

## Examples

See `examples/agent-rules.json` for comprehensive examples of all rule types and patterns.

## Integration

### Programmatic Usage

```typescript
import { createOrchestrator } from '@weave-nn/weaver/agents/orchestration';

const orchestrator = createOrchestrator({
  ruleEngine: {
    rulesFile: '~/.weaver/agent-rules.json',
    enableCaching: true,
  },
});

await orchestrator.initialize();
const result = await orchestrator.orchestrate(tasks, context);
```

### Workflow Integration

Rules are automatically applied during workflow orchestration when using the Weaver workflow engine.

## Schema Validation

Rules are validated against JSON Schema. Invalid rules will be rejected during loading with detailed error messages.

## Version History

- **1.0.0**: Initial release with core rule types
  - route_to_agent
  - split_parallel
  - adjust_priority
  - set_timeout
  - skip_task
