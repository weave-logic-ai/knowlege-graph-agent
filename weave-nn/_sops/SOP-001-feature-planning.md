---
sop_id: SOP-001
sop_name: Feature Planning Workflow
category: development
version: 1.0.0
status: active
triggers:
  - weaver sop feature-plan <description>
  - weaver plan feature <description>
learning_enabled: true
estimated_duration: 30-45 minutes
complexity: medium
type: sop
scope: feature
visual:
  icon: "\U0001F4DD"
  color: '#84CC16'
  cssclasses:
    - type-sop
    - status-active
updated_date: '2025-10-28'
---

# SOP-001: Feature Planning Workflow

## Overview

The Feature Planning Workflow is a systematic approach to transforming feature ideas into actionable development tasks with clear architecture, resource estimates, and success criteria. This SOP orchestrates multiple specialized agents working in parallel to analyze requirements, design architecture, and create comprehensive implementation plans.

This workflow ensures that every feature begins with thorough analysis and planning, reducing implementation risks and enabling accurate time/resource estimation. The process captures learning from past features and continuously improves planning accuracy through neural pattern recognition.

By following this SOP, teams can expect consistent feature specifications, realistic timelines, and clear communication of technical decisions across all stakeholders.

## Prerequisites

- Weaver CLI installed and configured
- Access to project vault (shadow cache initialized)
- Feature description prepared (minimum 2-3 sentences)
- Priority level determined (P0-P3)
- Stakeholder identified for approval

## Inputs

### Required
- **Feature Description**: Clear explanation of what needs to be built (2-3 paragraphs minimum)
- **Priority Level**: P0 (critical), P1 (high), P2 (medium), P3 (low)
- **Target Milestone**: Sprint/phase number or release version

### Optional
- **User Stories**: Specific user journeys or use cases
- **Technical Constraints**: Performance requirements, technology limitations
- **Dependencies**: Related features or external systems
- **Design Assets**: Mockups, wireframes, or design specifications
- **Success Metrics**: KPIs or acceptance criteria

## Agent Coordination

This SOP spawns **3 specialized agents** in parallel for optimal efficiency:

### 1. Researcher Agent
**Role**: Analyze requirements and gather context from similar features
- Search vault for related implementations
- Identify patterns from past feature specifications
- Research best practices and technical approaches
- Compile dependency analysis

### 2. Architect Agent
**Role**: Design system architecture and technical approach
- Create high-level architecture design
- Identify integration points and data flows
- Design API contracts and interfaces
- Assess scalability and performance implications

### 3. Planner Agent
**Role**: Break down work into tasks with estimates
- Decompose feature into atomic tasks
- Estimate effort and timeline
- Identify resource requirements
- Create dependency graph and critical path

## MCP Tools Used

### Memory Search (Research Phase)
```typescript
mcp__claude-flow__memory_search({
  pattern: "feature.*similar_domain",
  namespace: "features",
  limit: 10
})
```
**Purpose**: Find similar past features to learn from patterns and avoid known pitfalls.

### Swarm Init (Coordination Setup)
```typescript
mcp__claude-flow__swarm_init({
  topology: "mesh",
  maxAgents: 3,
  strategy: "balanced"
})
```
**Purpose**: Initialize mesh topology for parallel agent collaboration with shared memory.

### Task Orchestrate (Execution Management)
```typescript
mcp__claude-flow__task_orchestrate({
  task: "Complete feature planning for: " + featureDescription,
  strategy: "parallel",
  priority: "high",
  maxAgents: 3
})
```
**Purpose**: Coordinate parallel execution of research, architecture, and planning tasks.

### Memory Storage (Learning Capture)
```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "features/planning/" + featureId,
  namespace: "learning",
  value: JSON.stringify({
    feature: featureDescription,
    estimatedHours: totalEstimate,
    actualHours: null, // Updated post-completion
    accuracy: null,
    patterns: identifiedPatterns,
    risks: identifiedRisks
  }),
  ttl: 7776000 // 90 days
})
```
**Purpose**: Store planning data for continuous improvement of estimation accuracy.

## Weaver Integration

### Shadow Cache Usage
Weaver's shadow cache provides instant access to project context:

```typescript
// Weaver automatically searches shadow cache for:
- Similar feature specifications in /docs/features/
- Related architecture diagrams in /docs/architecture/
- Past implementation patterns in /src/
- Test coverage examples in /tests/
```

### Vault Organization
Feature spec is created in standardized location:

```
/vault/
  features/
    [feature-id]/
      spec.md           # Main specification
      architecture.md   # Technical design
      tasks.md          # Task breakdown
      estimates.md      # Time/resource estimates
```

### Git Integration
```bash
# Weaver creates feature branch and commits spec
weaver git feature-branch "feat/[feature-id]"
weaver git commit "docs: Add feature planning for [feature-name]"
```

## Execution Steps

### Step 1: Initialize Planning Session
```bash
# User executes
weaver sop feature-plan "Add real-time collaboration to document editor"

# Weaver internally:
npx claude-flow hooks pre-task --description "Feature planning: real-time collaboration"
npx claude-flow hooks session-restore --session-id "swarm-feature-planning"
```

### Step 2: Spawn Parallel Agents
```typescript
// Single message with all agent spawning
Task("Researcher", `
  Analyze requirements for: "Add real-time collaboration to document editor"

  Tasks:
  1. Search vault for similar real-time features
  2. Research WebSocket vs WebRTC approaches
  3. Identify CRDT libraries and patterns
  4. Find conflict resolution strategies
  5. Check for existing collaboration infrastructure

  Use hooks:
  npx claude-flow hooks pre-task --description "Research real-time collaboration"
  npx claude-flow hooks post-task --task-id "research-collab"

  Store findings in memory:
  mcp__claude-flow__memory_usage --action store --key "features/collab/research"
`, "researcher")

Task("Architect", `
  Design architecture for: "Add real-time collaboration to document editor"

  Tasks:
  1. Design WebSocket server architecture
  2. Create CRDT data structure design
  3. Design presence tracking system
  4. Plan conflict resolution strategy
  5. Design API contracts for collaboration events

  Use hooks and coordination:
  npx claude-flow hooks pre-task --description "Architecture design"
  npx claude-flow hooks post-edit --file "architecture.md"

  Check researcher findings in memory before designing.
`, "architect")

Task("Planner", `
  Create task breakdown for: "Add real-time collaboration to document editor"

  Tasks:
  1. Break down implementation into atomic tasks
  2. Estimate effort for each task (hours)
  3. Identify dependencies between tasks
  4. Create critical path analysis
  5. Assess resource requirements (developers, infra)

  Coordinate with other agents:
  - Wait for researcher to identify libraries
  - Wait for architect to define components

  Store planning data for learning loop.
`, "planner")
```

### Step 3: Agent Coordination & Synthesis
Agents communicate through shared memory:

```typescript
// Researcher stores findings
mcp__claude-flow__memory_usage({
  action: "store",
  key: "swarm/researcher/findings",
  namespace: "coordination",
  value: JSON.stringify({
    recommendedLibrary: "Yjs",
    approach: "CRDT with WebSocket transport",
    risks: ["Network latency", "Conflict complexity"],
    examples: ["Google Docs", "Figma"]
  })
})

// Architect retrieves and builds upon
mcp__claude-flow__memory_usage({
  action: "retrieve",
  key: "swarm/researcher/findings",
  namespace: "coordination"
})

// Planner synthesizes both inputs
const research = await retrieveMemory("swarm/researcher/findings")
const architecture = await retrieveMemory("swarm/architect/design")
```

### Step 4: Generate Feature Specification
Weaver synthesizes all agent outputs into cohesive spec:

```markdown
# Feature: Real-Time Collaboration

## Overview
[Generated from researcher analysis]

## Architecture
[Generated from architect design]

## Implementation Tasks
[Generated from planner breakdown]

## Estimates
- Development: 120 hours
- Testing: 40 hours
- Documentation: 16 hours
- **Total**: 176 hours (4.4 weeks)

## Risks & Mitigation
[Compiled from all agents]

## Success Criteria
[Defined based on inputs]
```

### Step 5: Store Learning Data
```typescript
npx claude-flow hooks post-task --task-id "feature-planning-collab"

// Stored metadata for learning:
{
  featureId: "feat-collab-001",
  complexity: "high",
  estimatedHours: 176,
  agentsUsed: ["researcher", "architect", "planner"],
  executionTime: "28 minutes",
  patternsSimilarTo: ["feat-chat-005", "feat-sync-012"]
}
```

### Step 6: Session Closure
```bash
npx claude-flow hooks session-end --export-metrics true

# Generates summary:
# - Tokens used
# - Time spent
# - Agents spawned
# - Memory operations
# - Files created
```

## Output Artifacts

### 1. Feature Specification (`/vault/features/[feature-id]/spec.md`)
Complete specification including:
- Feature overview and business value
- User stories and acceptance criteria
- Technical requirements
- Success metrics
- Timeline and milestones

### 2. Architecture Document (`/vault/features/[feature-id]/architecture.md`)
Technical design including:
- System architecture diagram
- Component breakdown
- API contracts and interfaces
- Data flow diagrams
- Technology stack decisions
- Scalability considerations

### 3. Task Breakdown (`/vault/features/[feature-id]/tasks.md`)
Detailed work items:
- Atomic tasks with descriptions
- Effort estimates (hours)
- Dependencies and sequencing
- Resource assignments
- Critical path identification

### 4. Risk Assessment (`/vault/features/[feature-id]/risks.md`)
Risk analysis including:
- Identified risks with severity
- Mitigation strategies
- Contingency plans
- Technical debt considerations

### 5. Learning Record (Memory Store)
Captured in MCP memory for future improvement:
- Planning patterns that worked
- Estimation accuracy baseline
- Architecture decisions rationale
- Similar feature references

## Success Criteria

✅ **Complete Specification**: All sections populated with actionable detail
✅ **Realistic Estimates**: Time estimates within 20% of similar past features
✅ **Clear Architecture**: Technical design reviewable by senior engineers
✅ **Actionable Tasks**: Each task independently implementable and testable
✅ **Risk Awareness**: All major risks identified with mitigation plans
✅ **Stakeholder Approval**: Specification reviewed and approved
✅ **Learning Captured**: Metadata stored for future planning improvement

## Learning Capture

### What to Memorize for Improvement

1. **Estimation Accuracy**
   ```typescript
   // After feature completion
   mcp__claude-flow__memory_usage({
     action: "store",
     key: "features/planning/" + featureId + "/postmortem",
     value: JSON.stringify({
       estimatedHours: 176,
       actualHours: 192,
       variance: 9.1,
       accuracyScore: 90.9,
       lessonsLearned: ["Underestimated testing complexity"]
     })
   })
   ```

2. **Architecture Patterns**
   - Which design patterns were successful
   - What technology choices worked well
   - Integration challenges encountered

3. **Planning Insights**
   - Task breakdown granularity that worked
   - Dependencies that were missed
   - Resource allocation effectiveness

4. **Research Findings**
   - Which similar features provided best guidance
   - What external research was most valuable
   - Library/framework recommendations

## Related SOPs

- **SOP-002**: Phase/Milestone Planning (for multi-feature planning)
- **SOP-004**: Debugging Workflow (for handling feature bugs)
- **SOP-007**: Code Review (for reviewing feature implementation)
- **SOP-008**: Performance Analysis (for optimizing feature performance)

## Examples

### Example 1: Simple CRUD Feature

```bash
weaver sop feature-plan "Add user profile management with avatar upload"

# Input:
- Priority: P2 (medium)
- Target: Sprint 12
- Description: Users need to update their profile information and upload avatars

# Output:
- Estimate: 24 hours (3 days)
- Tasks: 8 tasks identified
- Architecture: REST API + S3 storage
- Risks: Low (standard pattern)
```

### Example 2: Complex Integration Feature

```bash
weaver sop feature-plan "Integrate third-party payment gateway with subscription management"

# Input:
- Priority: P0 (critical)
- Target: Release 2.0
- Description: Support Stripe payments for monthly/annual subscriptions with webhook handling

# Output:
- Estimate: 120 hours (3 weeks)
- Tasks: 32 tasks across 4 components
- Architecture: Event-driven with webhook queue
- Risks: High (PCI compliance, webhook reliability)
```

### Example 3: Performance Optimization Feature

```bash
weaver sop feature-plan "Add Redis caching layer to reduce database load"

# Input:
- Priority: P1 (high)
- Target: Hotfix 1.5.1
- Description: Current DB queries causing 5s page loads, need sub-500ms response times

# Output:
- Estimate: 64 hours (1.5 weeks)
- Tasks: 18 tasks including cache invalidation strategy
- Architecture: Redis cluster with read-through pattern
- Risks: Medium (cache consistency, memory management)
```

---

**Version History**
- 1.0.0 (2025-10-27): Initial SOP creation with full agent coordination
