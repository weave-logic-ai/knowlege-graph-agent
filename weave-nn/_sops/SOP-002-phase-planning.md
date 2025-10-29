---
title: 'SOP-002: Phase/Milestone Planning Workflow'
type: sop
status: active
phase_id: PHASE-12
tags:
  - phase/phase-12
  - type/implementation
  - status/in-progress
priority: medium
visual:
  icon: "\U0001F4DD"
  color: '#84CC16'
  cssclasses:
    - type-sop
    - status-active
updated: '2025-10-29T04:55:04.566Z'
version: 1.0.0
keywords:
  - overview
  - prerequisites
  - inputs
  - required
  - optional
  - agent coordination
  - 1. researcher agent
  - 2. planner agent
  - 3. architect agent
  - 4. analyst agent
---

# SOP-002: Phase/Milestone Planning Workflow

## Overview

The Phase/Milestone Planning Workflow provides a comprehensive approach to planning major project phases or release milestones. Unlike feature-level planning, this SOP coordinates multiple features, dependencies, and cross-functional requirements into a cohesive execution plan with realistic timelines and resource allocation.

This workflow is essential for quarterly planning, major releases, or significant architectural changes that span multiple sprints. It analyzes historical phase execution data, identifies dependencies across teams, and creates actionable roadmaps that balance technical debt, new features, and operational requirements.

By following this SOP, teams achieve predictable delivery timelines, balanced workloads, and clear communication of phase objectives to all stakeholders. The learning loop continuously improves estimation accuracy for future phases based on actual execution data.

## Prerequisites

- Weaver CLI installed with git integration
- Access to project vault and planning documents
- Previous phase data available for analysis
- Stakeholder objectives defined
- Team capacity and availability known

## Inputs

### Required
- **Phase Number/Name**: Identifier (e.g., "Phase 12", "Q4 Milestone")
- **Phase Objectives**: 3-5 key goals for the phase
- **Target Timeline**: Start date, end date, sprint count
- **Team Capacity**: Available developer hours per sprint

### Optional
- **Dependencies**: Required completion of other phases
- **Technical Debt Items**: Debt to address in this phase
- **Performance Targets**: Specific metrics to achieve
- **Infrastructure Changes**: Required platform/tooling updates
- **Budget Constraints**: Cost limitations or resource caps

## Agent Coordination

This SOP spawns **4 specialized agents** working in parallel with data dependencies:

### 1. Researcher Agent
**Role**: Analyze historical phase data and identify patterns
- Review previous phases for similar scope
- Extract estimation accuracy and velocity trends
- Identify common bottlenecks and delays
- Compile lessons learned from past phases
- Search for dependency patterns

### 2. Planner Agent
**Role**: Create comprehensive task breakdown and timeline
- Decompose objectives into features and tasks
- Build dependency graph across features
- Calculate critical path and slack time
- Distribute work across sprints
- Identify resource constraints and bottlenecks

### 3. Architect Agent
**Role**: Design technical approach and system changes
- Assess architectural impact of phase objectives
- Design major system components or refactors
- Plan infrastructure and tooling changes
- Identify integration points and contracts
- Evaluate technical risks and complexity

### 4. Analyst Agent
**Role**: Risk assessment and capacity planning
- Analyze team capacity vs workload
- Identify scheduling risks and conflicts
- Assess technical complexity and unknowns
- Create risk mitigation strategies
- Project resource needs over time

## MCP Tools Used

### Memory Search (Historical Analysis)
```typescript
mcp__claude-flow__memory_search({
  pattern: "phase.*planning|milestone.*execution",
  namespace: "planning",
  limit: 20
})
```
**Purpose**: Retrieve historical phase data to improve estimation accuracy and avoid past pitfalls.

### Swarm Init (Multi-Agent Coordination)
```typescript
mcp__claude-flow__swarm_init({
  topology: "hierarchical",
  maxAgents: 4,
  strategy: "specialized"
})
```
**Purpose**: Hierarchical topology with planner as coordinator receiving inputs from researcher, architect, and analyst.

### Task Orchestrate (Phased Execution)
```typescript
mcp__claude-flow__task_orchestrate({
  task: "Plan Phase " + phaseNumber,
  strategy: "sequential",
  priority: "critical",
  dependencies: [
    { task: "research", before: "planning" },
    { task: "architecture", before: "planning" },
    { task: "analysis", before: "planning" }
  ]
})
```
**Purpose**: Ensure research, architecture, and analysis complete before final planning synthesis.

### Performance Report (Velocity Analysis)
```typescript
mcp__claude-flow__performance_report({
  format: "detailed",
  timeframe: "90d"
})
```
**Purpose**: Analyze team velocity over last quarter to inform capacity planning.

## Weaver Integration

### Shadow Cache for Context
Weaver provides instant access to:
- Previous phase documents in `/_planning/phases/`
- Completed features and their actual timelines
- Technical debt inventory
- Team velocity metrics
- Architecture documentation

### Phase Document Generation
Creates standardized phase document:

```
/_planning/phases/
  phase-[number]-[name]/
    index.md              # Main phase document
    features.md           # Feature breakdown
    timeline.md           # Gantt-style timeline
    resources.md          # Team allocation
    risks.md              # Risk register
    dependencies.md       # Dependency graph
```

### Git Workflow Integration
```bash
# Weaver creates planning branch
weaver git branch "planning/phase-12"

# Commits phase documents
weaver git commit "docs: Phase 12 planning - Service Architecture"

# Creates tracking issue
weaver github issue create --title "Phase 12: Service Architecture" \
  --body "Planning document available at /_planning/phases/phase-12/"
```

## Execution Steps

### Step 1: Initialize Phase Planning
```bash
# User initiates planning
weaver sop phase-plan 12 --objectives "Migrate to microservices, Add GraphQL API, Improve performance"

# Weaver sets up coordination
npx claude-flow hooks pre-task --description "Phase 12 planning"
npx claude-flow hooks session-restore --session-id "swarm-phase-12-planning"
```

### Step 2: Research Historical Data (Researcher Agent)
```typescript
Task("Researcher", `
  Analyze historical phase data to inform Phase 12 planning.

  Objectives:
  1. Find similar phases (microservices migrations, API additions)
  2. Extract velocity and estimation accuracy from last 4 phases
  3. Identify common delays and bottlenecks
  4. Compile lessons learned
  5. Search for dependency patterns in multi-feature phases

  Actions:
  - Search memory for: mcp__claude-flow__memory_search pattern="phase.*migration|phase.*api"
  - Read documents in /_planning/phases/phase-{8,9,10,11}/
  - Analyze completion times vs estimates
  - Extract risk factors that materialized

  Output:
  Store findings in memory:
  key: "swarm/researcher/phase-12/historical-analysis"
  Include: {
    similarPhases: [],
    averageVariance: 0.15,
    commonBottlenecks: [],
    velocityTrend: "stable|increasing|decreasing",
    lessonsLearned: []
  }

  Hooks:
  npx claude-flow hooks pre-task --description "Research historical phases"
  npx claude-flow hooks post-task --task-id "research-phase-12"
`, "researcher")
```

### Step 3: Architecture Design (Architect Agent)
```typescript
Task("Architect", `
  Design technical approach for Phase 12 objectives.

  Objectives:
  1. Microservices architecture design
  2. GraphQL API schema and gateway design
  3. Performance optimization strategy
  4. Infrastructure requirements
  5. Migration path from monolith

  Actions:
  - Review current architecture in /docs/architecture/
  - Design service boundaries and contracts
  - Plan data migration strategy
  - Assess infrastructure needs (K8s, service mesh)
  - Design GraphQL federation approach

  Coordination:
  - Wait for researcher findings on migration patterns
  - Check memory: key="swarm/researcher/phase-12/historical-analysis"

  Output:
  Store architecture in memory:
  key: "swarm/architect/phase-12/design"
  Files: /_planning/phases/phase-12/architecture.md

  Hooks:
  npx claude-flow hooks post-edit --file "architecture.md" \
    --memory-key "swarm/architect/phase-12/design"
`, "architect")
```

### Step 4: Risk and Capacity Analysis (Analyst Agent)
```typescript
Task("Analyst", `
  Perform risk assessment and capacity planning for Phase 12.

  Objectives:
  1. Analyze team capacity (available hours per sprint)
  2. Assess technical complexity and unknowns
  3. Identify scheduling risks (holidays, dependencies)
  4. Create risk register with mitigation
  5. Project resource needs over 6 sprints

  Actions:
  - Review team calendar and availability
  - Assess complexity of microservices migration
  - Identify external dependencies (DevOps, DBA)
  - Calculate critical path timeline
  - Model resource allocation scenarios

  Coordination:
  - Use researcher's historical variance data
  - Use architect's complexity assessment

  Output:
  key: "swarm/analyst/phase-12/risk-assessment"
  Include: {
    teamCapacity: { sprint1: 240, sprint2: 240, ... },
    topRisks: [{risk, severity, mitigation}],
    resourceNeeds: {developers: 6, devops: 2, dba: 1},
    criticalPath: ["design", "infrastructure", "migrate-service-1"]
  }
`, "analyst")
```

### Step 5: Synthesize Planning (Planner Agent - Coordinator)
```typescript
Task("Planner", `
  Synthesize all inputs into comprehensive Phase 12 plan.

  Inputs from Memory:
  1. Researcher: Historical analysis and lessons learned
  2. Architect: Technical design and migration approach
  3. Analyst: Risk assessment and capacity planning

  Objectives:
  1. Break down phase into features and tasks
  2. Create sprint-by-sprint timeline
  3. Assign tasks to sprints based on capacity
  4. Build dependency graph
  5. Calculate estimates with confidence intervals
  6. Create milestone checkpoints

  Actions:
  - Retrieve all agent outputs from memory
  - Create feature list for each objective
  - Break features into 2-5 day tasks
  - Distribute tasks across 6 sprints
  - Ensure critical path fits timeline
  - Add buffer for unknowns (15-20%)

  Output:
  Complete phase document with:
  - Executive summary
  - Feature breakdown (12-15 features)
  - Sprint timeline with task assignments
  - Resource allocation chart
  - Dependency graph
  - Risk register
  - Success criteria and milestones

  Files created:
  /_planning/phases/phase-12/index.md
  /_planning/phases/phase-12/features.md
  /_planning/phases/phase-12/timeline.md
  /_planning/phases/phase-12/risks.md
`, "planner")
```

### Step 6: Generate Phase Document
Weaver synthesizes all outputs into standardized format:

```markdown
---
phase_id: "phase-12"
phase_name: "Microservices Migration & GraphQL API"
status: "planned"
start_date: "2025-11-01"
end_date: "2025-12-15"
sprints: 6
team_size: 6
estimated_hours: 1440
---

# Phase 12: Microservices Migration & GraphQL API

## Executive Summary
[Generated from planner synthesis]

## Objectives
1. Migrate monolith to 5 microservices
2. Implement GraphQL API gateway
3. Achieve 50% performance improvement

## Features (14 Total)
[Generated from planner breakdown]

## Timeline
Sprint 1-2: Infrastructure & Service 1
Sprint 3-4: Services 2-3 & GraphQL
Sprint 5-6: Services 4-5 & Performance

## Resource Allocation
[Generated from analyst capacity planning]

## Architecture
[From architect agent]

## Risks & Mitigation
[From analyst risk assessment]

## Dependencies
[From planner dependency graph]

## Success Criteria
- All 5 services deployed to production
- GraphQL API handling 10k req/s
- P95 latency < 200ms
- Zero downtime migration
```

### Step 7: Store Learning Baseline
```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "planning/phase-12/baseline",
  namespace: "learning",
  value: JSON.stringify({
    phaseId: "phase-12",
    estimatedHours: 1440,
    estimatedSprints: 6,
    features: 14,
    complexity: "high",
    teamSize: 6,
    risks: ["migration complexity", "service boundaries"],
    planningDate: "2025-10-27",
    startDate: "2025-11-01"
  }),
  ttl: 15552000 // 180 days
})
```

### Step 8: Session Metrics Export
```bash
npx claude-flow hooks session-end --export-metrics true

# Generates:
# - Planning duration: 78 minutes
# - Agents used: 4
# - Memory operations: 12
# - Files created: 5
# - Token usage: ~45k
```

## Output Artifacts

### 1. Phase Index Document (`/_planning/phases/phase-12/index.md`)
Complete phase specification with YAML frontmatter, objectives, timeline, and success criteria.

### 2. Feature Breakdown (`/_planning/phases/phase-12/features.md`)
Detailed list of 10-20 features with descriptions, estimates, dependencies, and assignments.

### 3. Sprint Timeline (`/_planning/phases/phase-12/timeline.md`)
Gantt-style timeline showing:
- Sprint-by-sprint task distribution
- Critical path visualization
- Milestone checkpoints
- Team capacity vs workload

### 4. Resource Allocation (`/_planning/phases/phase-12/resources.md`)
Team allocation including:
- Developer assignments per sprint
- Skill requirements
- Cross-functional dependencies (DevOps, QA)
- Capacity vs demand charts

### 5. Risk Register (`/_planning/phases/phase-12/risks.md`)
Comprehensive risk assessment:
- Top 10 risks with severity ratings
- Mitigation strategies
- Contingency plans
- Risk ownership assignments

### 6. Dependency Graph (`/_planning/phases/phase-12/dependencies.md`)
Visual and textual representation of:
- Inter-feature dependencies
- External system dependencies
- Team/resource dependencies
- Critical path identification

## Success Criteria

✅ **Comprehensive Scope**: All objectives decomposed into features and tasks
✅ **Realistic Timeline**: Estimate based on historical velocity and capacity
✅ **Clear Dependencies**: All blockers and prerequisites identified
✅ **Risk Awareness**: Top risks identified with mitigation plans
✅ **Resource Planning**: Team allocation matches capacity constraints
✅ **Stakeholder Alignment**: Plan reviewed and approved by leadership
✅ **Learning Captured**: Baseline data stored for post-phase analysis

## Learning Capture

### Post-Phase Retrospective

After phase completion, update learning data:

```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "planning/phase-12/retrospective",
  namespace: "learning",
  value: JSON.stringify({
    phaseId: "phase-12",
    estimatedHours: 1440,
    actualHours: 1680,
    variance: 16.7,
    accuracyScore: 83.3,
    estimatedSprints: 6,
    actualSprints: 7,
    featuresPlanned: 14,
    featuresCompleted: 12,
    risksRealized: ["Service boundaries unclear"],
    lessonsLearned: [
      "Underestimated API contract complexity",
      "DevOps capacity was bottleneck",
      "Service 4 dependencies not clear at planning"
    ],
    whatWorkedWell: [
      "Early infrastructure setup saved time",
      "GraphQL schema design was accurate"
    ]
  })
})
```

### Pattern Recognition

Neural training on phase patterns:

```typescript
mcp__claude-flow__neural_train({
  pattern_type: "coordination",
  training_data: JSON.stringify({
    input: {
      phaseType: "migration",
      features: 14,
      teamSize: 6,
      complexity: "high"
    },
    output: {
      actualDuration: 7,
      variance: 16.7,
      bottlenecks: ["devops", "service-contracts"]
    }
  }),
  epochs: 50
})
```

## Related SOPs

- **SOP-001**: Feature Planning (for individual features within phase)
- **SOP-003**: Release Management (for releasing completed phase)
- **SOP-007**: Code Review (for reviewing phase deliverables)
- **SOP-008**: Performance Analysis (for validating performance objectives)

## Examples

### Example 1: Infrastructure Modernization Phase

```bash
weaver sop phase-plan 10 \
  --objectives "Migrate to Kubernetes, Add service mesh, Implement observability"

# Output:
- Duration: 8 sprints (16 weeks)
- Features: 18
- Team: 8 developers + 3 DevOps
- Estimate: 2,240 hours
- Top Risk: Kubernetes learning curve
```

### Example 2: Feature-Heavy Release Phase

```bash
weaver sop phase-plan Q4-2025 \
  --objectives "Launch mobile app, Add payment processing, Social features"

# Output:
- Duration: 12 sprints (24 weeks)
- Features: 32
- Team: 12 developers (3 teams)
- Estimate: 4,800 hours
- Top Risk: Mobile app store approval timing
```

### Example 3: Technical Debt Phase

```bash
weaver sop phase-plan debt-cleanup \
  --objectives "Upgrade dependencies, Refactor auth, Add test coverage"

# Output:
- Duration: 4 sprints (8 weeks)
- Features: 10 (mostly refactoring)
- Team: 5 developers
- Estimate: 800 hours
- Top Risk: Breaking changes in dependencies
```

---

**Version History**
- 1.0.0 (2025-10-27): Initial SOP with hierarchical agent coordination

## Related Documents

### Related Files
- [[_SOPS-HUB.md]] - Parent hub
- [[SOP-001-feature-planning.md]] - Same directory
- [[SOP-003-release-management.md]] - Same directory
- [[SOP-008-performance-analysis.md]] - Same directory
- [[sops-framework-hub.md]] - Same directory

### Similar Content
- [[SOP-001-feature-planning.md]] - Semantic similarity: 43.5%

