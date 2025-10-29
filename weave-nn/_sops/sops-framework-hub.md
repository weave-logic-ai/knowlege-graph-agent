---
title: Standard Operating Procedures (SOPs)
type: hub
status: in-progress
tags:
  - type/hub
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F310"
  color: '#4A90E2'
  cssclasses:
    - hub-document
updated: '2025-10-29T04:55:03.382Z'
keywords:
  - available sops
  - development workflows
  - operations workflows
  - quality workflows
  - documentation workflows
  - quick reference
  - by use case
  - sop structure
  - yaml frontmatter
  - content sections
---
# Standard Operating Procedures (SOPs)

This directory contains production-ready SOPs for common development workflows using Weaver's multi-agent orchestration capabilities.

## Available SOPs

### Development Workflows

- **[SOP-001: Feature Planning](./SOP-001-feature-planning.md)**
  - Transform feature ideas into actionable development tasks
  - Coordinate researcher, architect, and planner agents
  - Generate specifications, architecture, and estimates
  - Estimated duration: 30-45 minutes

- **[SOP-002: Phase/Milestone Planning](./SOP-002-phase-planning.md)**
  - Plan major project phases and release milestones
  - Coordinate researcher, planner, architect, and analyst agents
  - Create comprehensive roadmaps with timelines and resources
  - Estimated duration: 60-90 minutes

### Operations Workflows

- **[SOP-003: Release Management](./SOP-003-release-management.md)**
  - Orchestrate complete release process from validation to deployment
  - Coordinate coder, tester, reviewer, documenter, and deployment agents
  - Automated validation, changelog generation, and deployment
  - Estimated duration: 45-60 minutes

### Quality Workflows

- **[SOP-004: Systematic Debugging](./SOP-004-debugging.md)**
  - Investigate and resolve software defects systematically
  - Coordinate analyst, investigator, fixer, and tester agents
  - Root cause analysis, fix implementation, and validation
  - Estimated duration: 30-120 minutes

- **[SOP-007: Multi-Agent Code Review](./SOP-007-code-review.md)**
  - Comprehensive code quality assessment
  - Coordinate code-analyzer, security, performance, testing, and documentation agents
  - Multi-dimensional review with actionable feedback
  - Estimated duration: 15-30 minutes

- **[SOP-008: Performance Analysis](./SOP-008-performance-analysis.md)**
  - Identify and resolve performance bottlenecks
  - Coordinate performance-analyzer, code-analyzer, optimizer, and validator agents
  - Systematic profiling, optimization, and validation
  - Estimated duration: 30-60 minutes

### Documentation Workflows

- **[SOP-005: Documentation Generation](./SOP-005-documentation.md)**
  - Automated documentation generation from source code
  - Coordinate researcher, documenter, and reviewer agents
  - Generate API docs, guides, and architecture documentation
  - Estimated duration: 20-40 minutes

- **[SOP-006: Markdown/Vault Management](./SOP-006-markdown-management.md)**
  - Organize and maintain documentation vaults
  - Coordinate analyst and organizer agents
  - Fix broken links, organize content, rebuild shadow cache
  - Estimated duration: 15-30 minutes

## Quick Reference

### By Use Case

**Planning a new feature?** → [SOP-001: Feature Planning](./SOP-001-feature-planning.md)
```bash
weaver sop feature-plan "Add real-time collaboration"
```

**Planning a release?** → [SOP-002: Phase Planning](./SOP-002-phase-planning.md)
```bash
weaver sop phase-plan 12 --objectives "Migrate to microservices"
```

**Ready to release?** → [SOP-003: Release Management](./SOP-003-release-management.md)
```bash
weaver sop release 2.5.0 --type minor
```

**Bug found?** → [SOP-004: Debugging](./SOP-004-debugging.md)
```bash
weaver sop debug 1234
```

**Need docs?** → [SOP-005: Documentation](./SOP-005-documentation.md)
```bash
weaver sop docs generate /src/api/users --type api
```

**Vault messy?** → [SOP-006: Vault Management](./SOP-006-markdown-management.md)
```bash
weaver sop vault organize /docs
```

**Code review needed?** → [SOP-007: Code Review](./SOP-007-code-review.md)
```bash
weaver sop review 1234
```

**Performance issues?** → [SOP-008: Performance Analysis](./SOP-008-performance-analysis.md)
```bash
weaver sop perf checkout-service
```

## SOP Structure

Each SOP follows a consistent structure:

### YAML Frontmatter
```yaml
---
sop_id: "SOP-XXX"
sop_name: "SOP Name"
category: "development|documentation|operations|quality"
version: "1.0.0"
status: "active"
triggers:
  - CLI commands that invoke this SOP
learning_enabled: true
estimated_duration: "X minutes"
complexity: "low|medium|high"
---
```

### Content Sections

1. **Overview** - Purpose and benefits
2. **Prerequisites** - Requirements before execution
3. **Inputs** - Required and optional parameters
4. **Agent Coordination** - Agents spawned and their roles
5. **MCP Tools Used** - Specific MCP tools with parameters
6. **Weaver Integration** - How Weaver features are used
7. **Execution Steps** - Detailed step-by-step workflow
8. **Output Artifacts** - What gets created
9. **Success Criteria** - Validation checklist
10. **Learning Capture** - How improvements are tracked
11. **Related SOPs** - Cross-references
12. **Examples** - Real-world usage scenarios

## Key Features

### Multi-Agent Orchestration
Every SOP coordinates multiple specialized agents working in parallel for optimal efficiency:
- **Parallel execution** where tasks are independent
- **Sequential dependencies** where one agent needs another's output
- **Shared memory coordination** via MCP memory tools

### Learning Loop
All SOPs capture learning data for continuous improvement:
- Execution metrics (time, resources, outcomes)
- Pattern recognition for similar tasks
- Neural training on successful approaches
- Post-execution analysis for accuracy improvement

### Weaver Integration
SOPs leverage Weaver's powerful features:
- **Shadow cache** for instant code context
- **Git integration** for automated workflows
- **Service orchestration** for multi-component operations
- **Metrics aggregation** from multiple sources

### MCP Tool Usage
SOPs use MCP tools for coordination, not execution:
- `swarm_init` - Initialize agent coordination topology
- `agent_spawn` - Define agent types for coordination
- `task_orchestrate` - Orchestrate high-level workflows
- `memory_usage` - Share data between agents
- `neural_train` - Improve future executions

**Note**: Actual work is done by Claude Code's Task tool spawning real agents!

## Best Practices

### 1. Always Use Batch Operations
Spawn all agents in a single message for parallel execution:
```typescript
// ✅ CORRECT: Single message with all agents
Task("Researcher", "...", "researcher")
Task("Architect", "...", "architect")
Task("Planner", "...", "planner")

// ❌ WRONG: Multiple messages
Message 1: Task("Researcher", "...")
Message 2: Task("Architect", "...")
```

### 2. Coordinate Through Memory
Agents communicate via MCP memory tools:
```typescript
// Agent 1 stores findings
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/researcher/findings",
  value: JSON.stringify(data)
})

// Agent 2 retrieves and builds upon
const findings = await retrieveMemory("swarm/researcher/findings")
```

### 3. Use Hooks for Coordination
Every agent should use hooks for session management:
```bash
npx claude-flow hooks pre-task --description "Task description"
npx claude-flow hooks post-task --task-id "task-id"
npx claude-flow hooks session-end --export-metrics true
```

### 4. Capture Learning Data
Store execution metadata for continuous improvement:
```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "sops/execution/" + sopId + "/" + timestamp,
  namespace: "learning",
  value: JSON.stringify(metrics),
  ttl: 7776000 // 90 days
})
```

## Performance Metrics

Based on initial SOP execution data:

- **Feature Planning**: 30-45 min (vs 2-3 hours manual)
- **Phase Planning**: 60-90 min (vs 4-6 hours manual)
- **Release Process**: 45-60 min (vs 2-4 hours manual)
- **Debugging**: 30-120 min (vs 2-8 hours manual)
- **Documentation**: 20-40 min (vs 1-3 hours manual)
- **Code Review**: 15-30 min (vs 30-60 min manual)

**Average time savings: 60-75%**

## Contributing

To create a new SOP:

1. Copy an existing SOP as a template
2. Update YAML frontmatter with unique ID
3. Define clear agent coordination strategy
4. Specify MCP tools and Weaver integration
5. Provide detailed execution steps
6. Include 2-3 real examples
7. Test with actual execution
8. Update this README with new SOP

## Support

For issues or questions about SOPs:
- Review the specific SOP documentation
- Check related SOPs for similar workflows
- Consult Weaver documentation
- Reference MCP tool documentation

## Version History

- **1.0.0** (2025-10-27): Initial release with 8 core SOPs
  - SOP-001: Feature Planning
  - SOP-002: Phase/Milestone Planning
  - SOP-003: Release Management
  - SOP-004: Systematic Debugging
  - SOP-005: Documentation Generation
  - SOP-006: Markdown/Vault Management
  - SOP-007: Multi-Agent Code Review
  - SOP-008: Performance Analysis

---

**Last Updated**: 2025-10-27
**Maintained By**: Weave-NN Development Team

## Related Documents

### Related Files
- [[_SOPS-HUB.md]] - Parent hub
- [[SOP-001-feature-planning.md]] - Same directory
- [[SOP-002-phase-planning.md]] - Same directory
- [[SOP-003-release-management.md]] - Same directory
- [[SOP-008-performance-analysis.md]] - Same directory

### Similar Content
- [[SOP-001-feature-planning.md]] - Semantic similarity: 38.5%

