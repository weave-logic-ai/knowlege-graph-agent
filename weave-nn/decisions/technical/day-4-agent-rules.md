---
type: decision
decision_id: D-018
decision_type: technical
title: Agent Rule Engine Architecture
status: implemented
created_date: 2025-10-22
updated_date: 2025-10-22
tags:
  - architecture
  - rules-engine
  - event-driven
  - day-4
  - mvp
  - automation
related_concepts:
  - "[[C-002-obsidian-vault]]"
  - "[[C-008-agent-coordination]]"
related_features:
  - "[[F-006-automation]]"
related_decisions:
  - "[[day-2-rest-api-client]]"
  - "[[day-11-properties-visualization]]"
  - "[[event-driven-architecture]]"
phase: phase-5
priority: high
cssclasses:
  - decision
  - implemented
---

# Day 4: Agent Rule Engine Architecture

## Decision Summary

**Architecture Chosen**: Event-Driven with Strategy Pattern

**Date**: 2025-10-22
**Status**: ✅ Implemented
**Impact**: High (Enables intelligent automation)

## Context

Need flexible, extensible rule engine to automate agent behaviors based on vault events (file creation, modification, memory updates). Must support priority-based execution, conflict resolution, and configuration via YAML.

## Decision

### Architectural Pattern

**Event-Driven Architecture** with **Strategy Pattern** for rule execution:
- Event-based triggers (RabbitMQ events)
- Independent rule strategies (each rule is self-contained)
- Priority-based execution ordering
- Configurable via YAML with JSON Schema validation
- Performance target: < 100ms per rule execution

### Rule Engine Design

```python
# Priority-based execution
rule_engine = RuleEngine()
rule_engine.register_rule(SchemaValidationRule(priority=CRITICAL))
rule_engine.register_rule(MemorySyncRule(priority=HIGH))
rule_engine.register_rule(AutoLinkingRule(priority=LOW))

# Process event through applicable rules
results = rule_engine.process_event('file_created', file_path=path)
```

## Six Core Rules

### 1. Memory Sync Rule (Priority: CRITICAL)
**Purpose**: Bidirectional synchronization between Obsidian vault and Claude-Flow memory

**Triggers**:
- `claude_flow.memory.created`
- `claude_flow.memory.updated`
- `weave_nn.file.created`
- `weave_nn.file.modified`

**Behavior**:
```javascript
// When Claude-Flow memory updated → Update Obsidian note
// When Obsidian note modified → Update Claude-Flow memory
// Conflict resolution: Last-write-wins with timestamp comparison
```

### 2. Node Creation Rule (Priority: HIGH)
**Purpose**: Auto-create Obsidian nodes from agent intents

**Triggers**:
- `agent.intent.create_concept`
- `agent.intent.create_feature`
- `agent.intent.create_decision`

**Behavior**: Creates properly formatted markdown files with frontmatter validation

### 3. Update Propagation Rule (Priority: HIGH)
**Purpose**: Propagate changes to related nodes via wikilinks

**Triggers**:
- `weave_nn.file.modified`

**Behavior**: Updates all nodes that reference the modified node

### 4. Schema Validation Rule (Priority: MEDIUM)
**Purpose**: Validate YAML frontmatter against schemas

**Triggers**:
- `weave_nn.file.created`
- `weave_nn.file.modified`

**Behavior**: Checks required properties, validates types, enforces constraints

### 5. Auto-Linking Rule (Priority: LOW)
**Purpose**: Suggest wikilinks based on content analysis

**Triggers**:
- `weave_nn.file.created`
- `weave_nn.file.modified`

**Configuration**:
```yaml
# config/rules/auto_linking.yaml
parameters:
  min_confidence: 0.7
  max_suggestions: 10
  auto_apply_threshold: 0.9
```

### 6. Auto-Tagging Rule (Priority: LOW)
**Purpose**: Suggest tags based on content and existing taxonomy

**Triggers**:
- `weave_nn.file.created`
- `weave_nn.file.modified`

**Behavior**: NLP-based tag suggestions with confidence scores

## Implementation Details

**File**: `/home/aepod/dev/weave-nn/src/agents/RuleEngine.js`
**Lines of Code**: 633
**Language**: JavaScript (Node.js)

### Priority System

```javascript
const RulePriority = {
  CRITICAL: 100,  // Execute first (schema validation, memory sync)
  HIGH: 75,       // Important automations (node creation, propagation)
  MEDIUM: 50,     // Standard operations
  LOW: 25,        // Optional enhancements (auto-linking, tagging)
  MINIMAL: 0      // Background tasks
};
```

### Conflict Resolution Strategies

```javascript
const ConflictStrategy = {
  PRIORITY: 'priority',      // Highest priority wins
  FIRST_MATCH: 'first_match', // First matching rule executes
  MERGE: 'merge',            // Combine compatible rules
  SEQUENTIAL: 'sequential',  // Execute all in priority order
  MANUAL: 'manual'           // Require manual resolution
};
```

### Rule Validation

```javascript
engine.addRule({
  id: 'memory-sync',
  name: 'Memory Sync Rule',
  priority: RulePriority.CRITICAL,
  tags: ['sync', 'memory'],
  condition: (context) => {
    return context.eventType === 'file_modified' && context.hasMemoryKey;
  },
  action: async (context) => {
    await claudeFlowMemory.update(context.memoryKey, context.content);
    return { success: true, synced: true };
  }
});
```

### Metrics & Monitoring

```javascript
const metrics = engine.getMetrics();
// {
//   totalEvaluations: 1523,
//   totalExecutions: 487,
//   conflictsDetected: 12,
//   avgEvaluationTime: 23.5,
//   executionHistory: [...]
// }
```

## YAML Configuration Format

```yaml
# config/rules/auto_linking.yaml
rule_id: auto_linking
enabled: true
priority: low
version: "1.0.0"

triggers:
  - event: file_created
  - event: file_modified

parameters:
  min_confidence: 0.7
  max_suggestions: 10
  auto_apply_threshold: 0.9

filters:
  - type: path_pattern
    pattern: "^(?!_planning/).*\\.md$"  # Exclude planning docs
```

## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Rule execution time | < 100ms | Testing |
| Agent suggestion acceptance | > 60% | Measuring |
| Conflict rate | < 1% | Testing |
| Rules triggered per change | 2-4 | Measuring |

## Success Criteria

- [x] Architecture designed (event-driven + strategy pattern)
- [x] Rule engine framework implemented
- [x] 6 core rules operational
- [x] YAML configuration validated
- [x] Conflict resolution tested
- [ ] Performance profiling complete
- [ ] Agent acceptance rate > 60%

## Alternatives Considered

1. **Imperative Rules**: Rejected - less flexible, harder to maintain
2. **Hardcoded Logic**: Rejected - not configurable, no extensibility
3. **Rete Algorithm**: Rejected - overkill for our rule complexity
4. **Drools-like Engine**: Rejected - JavaScript ecosystem limitations

## Integration Points

### With REST API Client (Day 2)
```javascript
// Rules triggered on API operations
client.addResponseInterceptor((response) => {
  ruleEngine.process('file_modified', {
    path: response.path,
    content: response.content
  });
  return response;
});
```

### With Shadow Cache (Day 3)
```javascript
// Rules use shadow cache for context
ruleEngine.addRule({
  condition: async (context) => {
    const cached = await shadowCache.get(context.path);
    return cached !== context.content;
  }
});
```

### With Property Visualizer (Day 11)
```javascript
// Rules can trigger visualizations
ruleEngine.addRule({
  action: async (context) => {
    if (context.propertyChanged) {
      await visualizer.regenerateDashboard();
    }
  }
});
```

## Rule Configuration Management

### Version Control
- All YAML configs stored in `config/rules/`
- Semantic versioning (major.minor.patch)
- Migration system for breaking changes

### Hot Reloading
```javascript
// Watch for config changes
engine.enableHotReload('config/rules/', {
  interval: 5000,
  validateOnReload: true
});
```

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Rule conflicts | Medium | Priority-based execution + conflict detection |
| Performance degradation | Medium | Profiling + optimization + async execution |
| Configuration errors | High | JSON Schema validation + YAML linting |
| Infinite loops | Critical | Max execution depth + cycle detection |

## Dependencies

**NPM Packages**:
- `js-yaml` - YAML parsing
- `ajv` - JSON Schema validation
- `async` - Async flow control
- `lodash` - Utility functions

**Configuration Files**:
- `config/rules/*.yaml` - Individual rule configurations
- `config/schemas/rule-schema.json` - Rule validation schema

## References

- Architecture Analysis: [[architecture-analysis]]
- Implementation Summary: [[IMPLEMENTATION_SUMMARY]]
- Research Findings: [[day-2-4-11-research-findings]]
- Event-Driven Architecture: [[event-driven-architecture]]
- Example Usage: `/examples/rule-engine-example.js`

## Next Steps

1. [ ] Performance profiling with production load
2. [ ] Measure agent suggestion acceptance rate
3. [ ] Add rule analytics dashboard
4. [ ] Create rule testing framework
5. [ ] Document custom rule creation guide

---

**Decision Owner**: Development Team
**Stakeholders**: Architecture Team, Agent Team
**Last Review**: 2025-10-22
**Next Review**: After performance profiling
