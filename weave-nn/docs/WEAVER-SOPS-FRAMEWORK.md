---
title: Weaver Standard Operating Procedures (SOPs) Framework
type: reference
status: complete
created_date: {}
updated_date: '2025-10-28'
tags:
  - sops
  - framework
  - standard-operating-procedures
  - workflow-automation
  - orchestration
category: process
domain: weaver
scope: system
audience:
  - developers
  - architects
  - users
related_concepts:
  - workflow-orchestration
  - autonomous-agents
  - repeatable-workflows
  - sop-templates
  - governance
related_files:
  - WEAVER-COMPLETE-IMPLEMENTATION-GUIDE.md
  - WORKFLOW-EXTENSION-GUIDE.md
  - phase-12-workflow-inventory.md
author: ai-generated
version: 1.0.0
priority: high
visual:
  icon: 📄
  cssclasses:
    - type-reference
    - status-complete
    - priority-high
    - domain-weaver
  graph_group: navigation
icon: 📄
---

# Weaver Standard Operating Procedures (SOPs) Framework

**Version**: 1.0.0
**Status**: Active
**Last Updated**: 2025-10-27

## Table of Contents

1. [SOP Framework Architecture](#1-sop-framework-architecture)
2. [SOP Catalog](#2-sop-catalog)
3. [SOP Template Format](#3-sop-template-format)
4. [Common SOP Patterns](#4-common-sop-patterns)
5. [SOP Discovery and Execution](#5-sop-discovery-and-execution)
6. [SOP Development Guide](#6-sop-development-guide)
7. [Integration Points](#7-integration-points)
8. [SOP Governance](#8-sop-governance)
9. [Appendix: Reference SOPs](#9-appendix-reference-sops)

---

## 📚 Related Documentation

### Core Implementation
- [[WEAVER-COMPLETE-IMPLEMENTATION-GUIDE]] - Complete Weaver implementation
- [[PHASE-12-EXECUTIVE-SUMMARY]] - Phase 12 overview
- [[phase-12-workflow-inventory]] - Workflow catalog

### Learning Loop & Workflows
- [[PHASE-12-LEARNING-LOOP-BLUEPRINT]] - Learning loop architecture
- [[PHASE-12-LEARNING-LOOP-INTEGRATION]] - Integration guide
- [[WORKFLOW-EXTENSION-GUIDE]] - Workflow extension patterns

### Workflow Architecture
- [[MARKDOWN-ASYNC-WORKFLOW-ARCHITECTURE]] - Markdown workflows
- [[VECTOR-DB-MARKDOWN-WORKFLOW-ARCHITECTURE]] - Vector database workflows
- [[USER-FEEDBACK-REFLECTION-DESIGN]] - User feedback integration

### MCP Tools
- [[phase-12-mcp-tools-audit]] - 223 MCP tools catalog
- [[PHASE-12-MCP-QUICK-WINS]] - Quick wins catalog

### See Also
- [[phase-13-master-plan]] - Phase 13 integration
- Directory: [[_sops]] - 8 production-ready SOPs

---

## 1. SOP Framework Architecture

### 1.1 What is an SOP in Weaver?

A **Standard Operating Procedure (SOP)** in Weaver is a repeatable, orchestrated workflow template that coordinates multiple autonomous capabilities to accomplish complex development tasks. Think of SOPs as the "muscle memory" of your development environment.

An SOP orchestrates:
- **Multiple subagents** working in parallel (researcher, coder, tester, reviewer, planner, architect, etc.)
- **MCP tools** for coordination (Claude-Flow, ruv-swarm, Flow-Nexus)
- **Weaver's built-in capabilities** (shadow cache, workflows, git automation, vault indexing)
- **The autonomous learning loop** (perception, reasoning, execution, reflection, memory)
- **Claude Skills** (when available)

### 1.2 Core SOP Components

Every SOP is structured with the following components:

#### 1. Trigger
What initiates the SOP:
- **CLI Command**: `weaver sop run feature-plan`
- **Event**: Workflow event triggers (git hooks, file changes, schedules)
- **API Call**: Programmatic invocation
- **Schedule**: Cron-like scheduling for recurring tasks

#### 2. Inputs
Required and optional parameters:
```typescript
interface SOPInputs {
  // Required inputs
  required: {
    [key: string]: {
      type: string;
      description: string;
      validation?: (value: any) => boolean;
    };
  };
  // Optional inputs with defaults
  optional: {
    [key: string]: {
      type: string;
      default: any;
      description: string;
    };
  };
}
```

#### 3. Agent Coordination
Defines which agents to spawn and their interaction patterns:
```typescript
interface AgentCoordination {
  topology: 'parallel' | 'sequential' | 'hybrid' | 'mesh';
  agents: Array<{
    type: AgentType;
    name: string;
    capabilities: string[];
    dependencies?: string[]; // For sequential/hybrid
    priority?: 'low' | 'medium' | 'high' | 'critical';
  }>;
  coordination: {
    mcpTool?: string; // Optional MCP coordination
    memoryNamespace: string;
    syncPoints?: string[]; // Coordination checkpoints
  };
}
```

#### 4. MCP Tool Usage
Which MCP tools to use at each workflow stage:
```typescript
interface MCPToolUsage {
  initialization?: MCPToolCall[];
  coordination?: MCPToolCall[];
  execution?: MCPToolCall[];
  validation?: MCPToolCall[];
  cleanup?: MCPToolCall[];
}
```

#### 5. Weaver Integration
How to leverage Weaver's capabilities:
```typescript
interface WeaverIntegration {
  shadowCache: {
    index: string[];
    query?: string[];
  };
  vault: {
    outputPath: string;
    templatePath?: string;
  };
  git: {
    branchPattern?: string;
    autoCommit?: boolean;
    commitMessageTemplate?: string;
  };
  workflows: {
    triggerEvents?: string[];
    chainedWorkflows?: string[];
  };
}
```

#### 6. Learning Integration
How to capture and learn from execution:
```typescript
interface LearningIntegration {
  enabled: boolean;
  namespace: string;
  capturePoints: Array<{
    phase: string;
    metrics: string[];
    artifacts: string[];
  }>;
  improvementCriteria: string[];
}
```

#### 7. Outputs
Artifacts produced by the SOP:
```typescript
interface SOPOutputs {
  artifacts: Array<{
    type: 'file' | 'directory' | 'data' | 'metric';
    path: string;
    description: string;
  }>;
  reports: Array<{
    format: 'markdown' | 'json' | 'html';
    path: string;
  }>;
  metrics: {
    [key: string]: any;
  };
}
```

#### 8. Success Criteria
Validation rules for completion:
```typescript
interface SuccessCriteria {
  required: Array<{
    criterion: string;
    validation: (result: any) => boolean;
    errorMessage: string;
  }>;
  optional: Array<{
    criterion: string;
    validation: (result: any) => boolean;
    warningMessage: string;
  }>;
}
```

### 1.3 SOP Execution Pattern

The standard execution pattern for all SOPs:

```typescript
/**
 * Standard SOP Execution Pattern
 * This pattern ensures consistent orchestration across all SOPs
 */
async function executeSOP(sopName: string, inputs: SOPInputs): Promise<SOPResult> {
  const startTime = Date.now();
  let context: any;
  let plan: any;
  let agents: any[];
  let result: any;

  try {
    // ============================================================
    // PHASE 1: PERCEPTION - Understand the task and context
    // ============================================================
    console.log(`[SOP] ${sopName}: Initiating perception phase...`);

    context = await learningLoop.perceive({
      sop: sopName,
      inputs: inputs,
      // Retrieve similar past executions
      similarExecutions: await memory.search({
        namespace: `sop:${sopName}`,
        query: JSON.stringify(inputs),
        limit: 5
      }),
      // Get relevant patterns from vault
      relevantPatterns: await shadowCache.query({
        patterns: [`sops/${sopName}/**`, 'patterns/**'],
        tags: ['architecture', 'best-practices']
      })
    });

    console.log(`[SOP] Context gathered: ${Object.keys(context).length} elements`);

    // ============================================================
    // PHASE 2: REASONING - Generate optimal execution plan
    // ============================================================
    console.log(`[SOP] ${sopName}: Generating execution plan...`);

    plan = await learningLoop.reason({
      context: context,
      constraints: {
        maxAgents: 10,
        maxDuration: 3600000, // 1 hour
        parallelization: 'auto'
      },
      optimizationGoals: [
        'minimize-duration',
        'maximize-quality',
        'optimize-token-usage'
      ]
    });

    console.log(`[SOP] Plan created: ${plan.steps.length} steps, ${plan.requiredAgents.length} agents`);

    // ============================================================
    // PHASE 3: COORDINATION - Initialize MCP coordination (if needed)
    // ============================================================
    if (plan.requiresMCPCoordination) {
      console.log(`[SOP] ${sopName}: Initializing MCP coordination...`);

      await claudeFlow.swarm_init({
        topology: plan.topology || 'mesh',
        maxAgents: plan.requiredAgents.length,
        strategy: 'adaptive'
      });

      // Spawn coordination agents (not execution agents)
      for (const agentDef of plan.coordinationAgents || []) {
        await claudeFlow.agent_spawn({
          type: agentDef.type,
          name: agentDef.name,
          capabilities: agentDef.capabilities
        });
      }
    }

    // ============================================================
    // PHASE 4: EXECUTION - Spawn real agents via Claude Code Task tool
    // ============================================================
    console.log(`[SOP] ${sopName}: Spawning execution agents...`);

    // This is where the ACTUAL work happens
    // Claude Code's Task tool spawns real agents that execute tasks
    agents = await Promise.all(
      plan.requiredAgents.map(async (agentDef: any) => {
        // Each agent gets:
        // 1. Clear task description
        // 2. Coordination hooks
        // 3. Memory namespace for sharing
        // 4. Success criteria

        const agentTask = `
# Agent: ${agentDef.name} (${agentDef.type})

## Task
${agentDef.task}

## Context
${JSON.stringify(context, null, 2)}

## Coordination Protocol
Before starting: Run hooks pre-task and session-restore
During work: Use hooks post-edit and notify for coordination
After completion: Run hooks post-task and session-end

## Memory Namespace
${plan.memoryNamespace}/${agentDef.name}

## Success Criteria
${agentDef.successCriteria.map((c: string) => `- ${c}`).join('\n')}

## Tools Available
${agentDef.allowedTools.join(', ')}
        `;

        return {
          name: agentDef.name,
          type: agentDef.type,
          taskDescription: agentTask
        };
      })
    );

    console.log(`[SOP] ${agents.length} agents spawned and executing...`);

    // Execute the plan with orchestrated agents
    result = await learningLoop.execute({
      plan: plan,
      agents: agents,
      hooks: {
        beforeStep: async (step: any) => {
          await claudeFlow.hooks.pre_task({
            description: step.description
          });
        },
        afterStep: async (step: any, stepResult: any) => {
          await claudeFlow.hooks.post_task({
            taskId: step.id,
            result: stepResult
          });

          // Store intermediate results
          await memory.store({
            namespace: `${plan.memoryNamespace}/steps`,
            key: step.id,
            value: stepResult
          });
        }
      }
    });

    console.log(`[SOP] Execution completed in ${Date.now() - startTime}ms`);

    // ============================================================
    // PHASE 5: REFLECTION - Analyze what worked and what didn't
    // ============================================================
    console.log(`[SOP] ${sopName}: Reflecting on execution...`);

    const lessons = await learningLoop.reflect({
      sop: sopName,
      plan: plan,
      result: result,
      metrics: {
        duration: Date.now() - startTime,
        agentsUsed: agents.length,
        stepsCompleted: result.completedSteps.length,
        successRate: result.successfulSteps / result.totalSteps
      },
      reflectionQuestions: [
        'What went well and why?',
        'What could be improved?',
        'Were the right agents chosen?',
        'Was the execution order optimal?',
        'What patterns emerged?',
        'What should we remember for next time?'
      ]
    });

    console.log(`[SOP] Reflection complete: ${lessons.insights.length} insights captured`);

    // ============================================================
    // PHASE 6: MEMORY - Store experience for future improvement
    // ============================================================
    console.log(`[SOP] ${sopName}: Storing experience...`);

    await learningLoop.memorize({
      namespace: `sop:${sopName}`,
      execution: {
        timestamp: new Date().toISOString(),
        inputs: inputs,
        context: context,
        plan: plan,
        result: result,
        lessons: lessons,
        metrics: {
          duration: Date.now() - startTime,
          agentsUsed: agents.length,
          tokensUsed: result.tokensUsed,
          successRate: result.successRate
        }
      },
      tags: [
        'sop-execution',
        sopName,
        `status:${result.success ? 'success' : 'failure'}`,
        `duration:${Math.floor((Date.now() - startTime) / 1000)}s`
      ]
    });

    // ============================================================
    // PHASE 7: ARTIFACTS - Store outputs in Weaver vault
    // ============================================================
    console.log(`[SOP] ${sopName}: Storing artifacts...`);

    for (const artifact of result.artifacts || []) {
      await vault.store({
        path: artifact.path,
        content: artifact.content,
        metadata: {
          sop: sopName,
          timestamp: new Date().toISOString(),
          agentCreated: artifact.createdBy
        }
      });

      // Index in shadow cache for fast retrieval
      await shadowCache.index({
        file: artifact.path,
        tags: [sopName, artifact.type, 'sop-output']
      });
    }

    console.log(`[SOP] ${sopName}: Complete! ✓`);

    return {
      success: true,
      sop: sopName,
      duration: Date.now() - startTime,
      artifacts: result.artifacts,
      metrics: result.metrics,
      lessons: lessons
    };

  } catch (error) {
    console.error(`[SOP] ${sopName}: Execution failed:`, error);

    // Store failure for learning
    await learningLoop.memorize({
      namespace: `sop:${sopName}:failures`,
      execution: {
        timestamp: new Date().toISOString(),
        inputs: inputs,
        context: context,
        plan: plan,
        error: error.message,
        stack: error.stack
      },
      tags: ['sop-execution', sopName, 'status:failure']
    });

    throw error;
  }
}
```

### 1.4 SOP Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         SOP EXECUTION                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. PERCEPTION                                                  │
│     ├─ Retrieve similar past executions (Learning Loop)        │
│     ├─ Query shadow cache for patterns                         │
│     └─ Gather context from vault                               │
│                           ↓                                     │
│  2. REASONING                                                   │
│     ├─ Generate optimal execution plan                         │
│     ├─ Select agent topology (parallel/sequential/mesh)        │
│     └─ Determine coordination strategy                         │
│                           ↓                                     │
│  3. COORDINATION (Optional MCP Setup)                           │
│     ├─ Initialize swarm topology                               │
│     └─ Spawn coordination agents                               │
│                           ↓                                     │
│  4. EXECUTION (Claude Code Task Tool)                           │
│     ├─ Spawn real execution agents                             │
│     ├─ Run coordination hooks (pre/during/post)                │
│     ├─ Share via memory namespace                              │
│     └─ Validate success criteria                               │
│                           ↓                                     │
│  5. REFLECTION                                                  │
│     ├─ Analyze what worked/didn't work                         │
│     ├─ Extract patterns and insights                           │
│     └─ Generate improvement recommendations                    │
│                           ↓                                     │
│  6. MEMORY                                                      │
│     ├─ Store execution experience                              │
│     ├─ Tag with metadata                                       │
│     └─ Update neural patterns                                  │
│                           ↓                                     │
│  7. ARTIFACTS                                                   │
│     ├─ Store outputs in vault                                  │
│     ├─ Index in shadow cache                                   │
│     └─ Commit to git (if enabled)                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. SOP Catalog

### 2.1 Development SOPs

#### SOP-001: Feature Planning
**Purpose**: Plan new features with comprehensive specifications and estimates
**Agents**: Researcher, Architect, Planner, Analyst
**Outputs**: Feature spec, architecture design, task breakdown, risk assessment
**Triggers**: `weaver sop run feature-plan`, workflow event `feature_request`

#### SOP-002: Phase Planning
**Purpose**: Create phase documents with detailed task breakdowns
**Agents**: Planner, Architect, Analyst, Coder
**Outputs**: Phase document, task list, dependency graph, timeline
**Triggers**: `weaver sop run phase-plan`, workflow event `phase_start`

#### SOP-003: Release Planning
**Purpose**: Coordinate releases with changelog generation and validation
**Agents**: Planner, Tester, Reviewer, Coder
**Outputs**: Release notes, changelog, migration guide, validation report
**Triggers**: `weaver sop run release-plan`, workflow event `release_start`

#### SOP-004: Code Review
**Purpose**: Multi-agent code review with comprehensive quality checks
**Agents**: Reviewer, Security Analyst, Performance Analyst, Tester
**Outputs**: Review report, issue list, recommendations, test coverage
**Triggers**: `weaver sop run code-review`, git hook `pre-push`

#### SOP-005: Debugging
**Purpose**: Systematic bug investigation and fixing
**Agents**: Analyst, Coder, Tester, Reviewer
**Outputs**: Root cause analysis, fix implementation, regression tests
**Triggers**: `weaver sop run debug`, workflow event `bug_reported`

#### SOP-006: Refactoring
**Purpose**: Safe code refactoring with comprehensive test coverage
**Agents**: Architect, Coder, Tester, Reviewer
**Outputs**: Refactored code, updated tests, migration guide
**Triggers**: `weaver sop run refactor`, manual invocation

### 2.2 Documentation SOPs

#### SOP-007: API Documentation
**Purpose**: Generate comprehensive API documentation from code
**Agents**: Documenter, Coder, Reviewer
**Outputs**: API reference, examples, integration guides
**Triggers**: `weaver sop run api-docs`, git hook `pre-commit`

#### SOP-008: User Guide
**Purpose**: Create user-facing documentation
**Agents**: Documenter, UX Analyst, Reviewer
**Outputs**: User guide, tutorials, FAQ
**Triggers**: `weaver sop run user-guide`, manual invocation

#### SOP-009: Architecture Documentation
**Purpose**: Document system architecture with diagrams
**Agents**: Architect, Documenter, Reviewer
**Outputs**: Architecture diagrams, ADRs, component docs
**Triggers**: `weaver sop run arch-docs`, workflow event `architecture_change`

#### SOP-010: Markdown Vault Management
**Purpose**: Organize and maintain markdown vault
**Agents**: Documenter, Organizer, Indexer
**Outputs**: Organized vault, updated index, broken link report
**Triggers**: `weaver sop run vault-manage`, scheduled daily

### 2.3 Operations SOPs

#### SOP-011: Service Deployment
**Purpose**: Deploy services with PM2 and validation
**Agents**: DevOps Engineer, Tester, Monitor
**Outputs**: Deployed services, health report, rollback plan
**Triggers**: `weaver sop run deploy`, workflow event `deploy_ready`

#### SOP-012: Health Monitoring
**Purpose**: Monitor and alert on service health
**Agents**: Monitor, Analyst, DevOps Engineer
**Outputs**: Health dashboard, alerts, incident reports
**Triggers**: Scheduled every 5 minutes

#### SOP-013: Performance Analysis
**Purpose**: Analyze and optimize system performance
**Agents**: Performance Analyst, Profiler, Optimizer
**Outputs**: Performance report, optimization recommendations, benchmarks
**Triggers**: `weaver sop run perf-analysis`, scheduled weekly

#### SOP-014: Incident Response
**Purpose**: Handle production incidents systematically
**Agents**: Incident Commander, Analyst, DevOps Engineer, Communicator
**Outputs**: Incident report, root cause analysis, preventive measures
**Triggers**: `weaver sop run incident-response`, workflow event `incident_detected`

### 2.4 Quality SOPs

#### SOP-015: Testing Strategy
**Purpose**: Create comprehensive test plans and suites
**Agents**: Test Strategist, Tester, Coder, Reviewer
**Outputs**: Test plan, test suites, coverage report
**Triggers**: `weaver sop run test-strategy`, workflow event `feature_complete`

#### SOP-016: Security Audit
**Purpose**: Comprehensive security vulnerability scanning
**Agents**: Security Analyst, Penetration Tester, Reviewer
**Outputs**: Security report, vulnerability list, remediation plan
**Triggers**: `weaver sop run security-audit`, scheduled monthly

#### SOP-017: Dependency Updates
**Purpose**: Safe dependency upgrades with testing
**Agents**: Dependency Manager, Tester, Reviewer
**Outputs**: Updated dependencies, compatibility report, test results
**Triggers**: `weaver sop run dep-update`, scheduled weekly

#### SOP-018: Code Quality Check
**Purpose**: Linting, formatting, and comprehensive quality checks
**Agents**: Linter, Formatter, Quality Analyst
**Outputs**: Quality report, auto-fixes, recommendations
**Triggers**: `weaver sop run quality-check`, git hook `pre-commit`

### 2.5 Specialized SOPs

#### SOP-019: Migration Planning
**Purpose**: Plan and execute code/data migrations
**Agents**: Migration Planner, Coder, Tester, Reviewer
**Outputs**: Migration plan, migration scripts, rollback plan
**Triggers**: `weaver sop run migration-plan`, manual invocation

#### SOP-020: Technical Debt Analysis
**Purpose**: Identify and prioritize technical debt
**Agents**: Code Analyzer, Architect, Planner
**Outputs**: Tech debt inventory, prioritization matrix, remediation roadmap
**Triggers**: `weaver sop run tech-debt`, scheduled monthly

---

## 3. SOP Template Format

### 3.1 YAML Frontmatter Structure

Every SOP document must include this YAML frontmatter:

```yaml
---
sop_id: "SOP-XXX"
sop_name: "Descriptive SOP Name"
category: "development|documentation|operations|quality|specialized"
version: "X.Y.Z"  # Semantic versioning
status: "draft|active|deprecated|archived"

# Metadata
author: "Agent or human creator"
created: "YYYY-MM-DD"
updated: "YYYY-MM-DD"
reviewers: ["Reviewer 1", "Reviewer 2"]

# Triggers
triggers:
  cli:
    - "weaver sop run <command>"
  events:
    - "workflow_event_name"
  schedule: "cron expression (optional)"
  api: true|false

# Configuration
inputs:
  required:
    - name: "input_name"
      type: "string|number|boolean|object|array"
      description: "What this input is for"
      validation: "validation rule (optional)"
  optional:
    - name: "optional_input"
      type: "string"
      default: "default_value"
      description: "Optional parameter description"

# Agent Coordination
agents:
  topology: "parallel|sequential|hybrid|mesh"
  coordination:
    mcp_enabled: true|false
    memory_namespace: "sop/<sop-name>"
    sync_points: ["step1", "step2"]
  agents_required:
    - type: "researcher|coder|tester|reviewer|planner|architect|analyst|..."
      name: "Agent Name"
      capabilities: ["capability1", "capability2"]
      priority: "low|medium|high|critical"
      dependencies: ["agent1", "agent2"]  # For sequential/hybrid

# MCP Tools
mcp_tools:
  initialization:
    - "mcp__claude-flow__swarm_init"
  coordination:
    - "mcp__claude-flow__agent_spawn"
    - "mcp__claude-flow__memory_usage"
  execution:
    - "mcp__claude-flow__task_orchestrate"
  validation:
    - "mcp__claude-flow__task_status"

# Weaver Integration
weaver:
  shadow_cache:
    index: ["pattern1/**", "pattern2/**"]
    query: ["pattern3/**"]
  vault:
    output_path: "category/subcategory"
    template_path: "templates/sop-template.md (optional)"
  git:
    branch_pattern: "sop/<sop-name>-{timestamp}"
    auto_commit: true|false
    commit_message_template: "docs(sop): {sop_name} - {description}"
  workflows:
    trigger_events: ["event1", "event2"]
    chained_workflows: ["workflow1", "workflow2"]

# Learning
learning:
  enabled: true|false
  namespace: "sop:<sop-name>"
  capture_points:
    - phase: "perception"
      metrics: ["metric1", "metric2"]
      artifacts: ["artifact1"]
    - phase: "execution"
      metrics: ["metric3"]
      artifacts: ["artifact2", "artifact3"]
  improvement_criteria:
    - "Criterion 1"
    - "Criterion 2"

# Outputs
outputs:
  artifacts:
    - type: "file|directory|data|metric"
      path: "relative/path"
      description: "Artifact description"
  reports:
    - format: "markdown|json|html"
      path: "reports/report-name"
  metrics:
    - "metric_name_1"
    - "metric_name_2"

# Success Criteria
success_criteria:
  required:
    - criterion: "Description of required criterion"
      validation: "validation_function_name"
      error_message: "Error if not met"
  optional:
    - criterion: "Description of optional criterion"
      validation: "validation_function_name"
      warning_message: "Warning if not met"

# Dependencies
dependencies:
  sops: ["SOP-001", "SOP-002"]  # Other SOPs this depends on
  tools: ["tool1", "tool2"]  # External tools required
  services: ["service1"]  # Services that must be running

# Estimated Resources
estimates:
  duration: "5-10 minutes"
  agents: 3-5
  tokens: "10000-20000"
  cost: "$0.50-$1.00"
---
```

### 3.2 Markdown Content Structure

After the YAML frontmatter, the markdown content should follow this structure:

```markdown
# {SOP_ID}: {SOP_NAME}

## Overview

A clear, concise description of what this SOP accomplishes and when to use it.

**When to use this SOP**:
- Scenario 1
- Scenario 2
- Scenario 3

**What this SOP does NOT handle**:
- Out of scope item 1
- Out of scope item 2

## Prerequisites

List any requirements before running this SOP:
- Required tools installed
- Services that must be running
- Configuration that must exist
- Permissions needed

## Inputs

### Required Inputs

| Input | Type | Description | Example |
|-------|------|-------------|---------|
| input_name | string | What this input is for | `"example value"` |

### Optional Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| optional_input | string | `"default"` | Optional parameter |

## Agent Coordination

### Topology
{Parallel|Sequential|Hybrid|Mesh} execution with {N} agents

### Agent Roles

#### 1. {Agent Type} - {Agent Name}
**Responsibilities**:
- Responsibility 1
- Responsibility 2

**Capabilities Used**:
- Capability 1
- Capability 2

**Success Criteria**:
- Criterion 1
- Criterion 2

**Dependencies**: {None|Agent1, Agent2}

#### 2. {Next Agent}
... (repeat for each agent)

### Coordination Protocol

**Memory Namespace**: `sop/<sop-name>`

**Sync Points**:
1. After {phase} - All agents must complete {task}
2. After {phase} - Validation checkpoint

**Communication**:
- Agents share via memory keys: `sop/<sop-name>/{agent-name}/{key}`
- Coordination hooks: {pre-task, post-edit, post-task, notify}

## MCP Tools Used

### Initialization Phase
```bash
# Tool 1
mcp__claude-flow__swarm_init --topology mesh --maxAgents 5

# Tool 2
mcp__claude-flow__memory_usage --action store --namespace sop/<sop-name>
```

### Coordination Phase
... (tools used during coordination)

### Execution Phase
... (tools used during execution)

### Validation Phase
... (tools used for validation)

## Weaver Integration

### Shadow Cache
**Index**: `{patterns to index}`
**Query**: `{patterns to query for context}`

### Vault Storage
**Output Path**: `{category/subcategory}`
**Template**: `{template path if used}`

### Git Integration
**Branch Pattern**: `{pattern}`
**Auto-commit**: {Yes|No}
**Commit Message**: `{template}`

### Workflows
**Triggered By**: {events that trigger this SOP}
**Triggers**: {workflows this SOP triggers}

## Execution Steps

### Step 1: {Phase Name}
**Objective**: {What this step accomplishes}

**Actions**:
1. {Action 1}
2. {Action 2}
3. {Action 3}

**Agents Involved**: {Agent1, Agent2}

**Expected Outputs**:
- {Output 1}
- {Output 2}

**Validation**:
- {Check 1}
- {Check 2}

### Step 2: {Next Phase}
... (repeat for each step)

## Success Criteria

### Required Criteria
- [ ] {Criterion 1} - {How to validate}
- [ ] {Criterion 2} - {How to validate}

### Optional Criteria
- [ ] {Optional criterion 1} - {How to validate}

## Outputs

### Artifacts
| Artifact | Type | Path | Description |
|----------|------|------|-------------|
| {name} | file | {path} | {description} |

### Reports
| Report | Format | Path | Contents |
|--------|--------|------|----------|
| {name} | markdown | {path} | {what it contains} |

### Metrics
| Metric | Type | Description |
|--------|------|-------------|
| {metric_name} | {number|string|boolean} | {what it measures} |

## Learning Capture

### Captured Data
- **Context**: {What context is stored}
- **Plan**: {What planning data is stored}
- **Outcome**: {What outcome data is stored}
- **Lessons**: {What insights are extracted}

### Improvement Criteria
- {Criterion 1}: {How we measure improvement}
- {Criterion 2}: {How we measure improvement}

### Reflection Questions
1. {Question about what went well}
2. {Question about what could improve}
3. {Question about patterns observed}

## Troubleshooting

### Common Issues

#### Issue: {Problem description}
**Symptoms**: {How to recognize this issue}
**Cause**: {Why this happens}
**Solution**: {How to fix it}

#### Issue: {Next problem}
... (repeat for common issues)

## Examples

### Example 1: {Scenario Name}

**Context**: {When you'd use this example}

**Command**:
```bash
weaver sop run {sop-name} \
  --input1 "value1" \
  --input2 "value2"
```

**Expected Output**:
```
{Show what the output looks like}
```

### Example 2: {Another Scenario}
... (additional examples)

## Related SOPs

- **{SOP-XXX}**: {SOP Name} - {When to use instead}
- **{SOP-YYY}**: {SOP Name} - {When to use together}

## Version History

### v1.0.0 (YYYY-MM-DD)
- Initial release
- {Feature 1}
- {Feature 2}

### v0.9.0 (YYYY-MM-DD)
- {Change 1}
- {Change 2}

## References

- {Link to related documentation}
- {Link to external resources}
- {Link to examples}
```

---

## 4. Common SOP Patterns

### 4.1 Parallel Agent Research Pattern

Use when multiple independent research tasks can run concurrently.

```typescript
/**
 * Pattern: Parallel Agent Research
 * Use Case: Multiple independent research tasks
 * Topology: Parallel (all agents start simultaneously)
 */
async function parallelAgentResearch(topic: string) {
  // Step 1: Initialize coordination (optional for complex tasks)
  await claudeFlow.swarm_init({
    topology: 'mesh',
    maxAgents: 5,
    strategy: 'balanced'
  });

  // Step 2: Spawn research agents via Claude Code Task tool
  const researchAgents = [
    {
      type: 'researcher',
      name: 'Technical Research',
      task: `Research technical approaches for ${topic}. Focus on:
        - Current best practices
        - Popular libraries/frameworks
        - Performance considerations
        Store findings in memory: sop/research/technical`,
      capabilities: ['web-search', 'code-analysis']
    },
    {
      type: 'researcher',
      name: 'Architecture Research',
      task: `Research architecture patterns for ${topic}. Focus on:
        - Scalability patterns
        - Common pitfalls
        - Design principles
        Store findings in memory: sop/research/architecture`,
      capabilities: ['pattern-analysis', 'system-design']
    },
    {
      type: 'analyst',
      name: 'Competitive Analysis',
      task: `Analyze existing implementations of ${topic}. Focus on:
        - Popular solutions
        - Pros/cons of each
        - Differentiation opportunities
        Store findings in memory: sop/research/competitive`,
      capabilities: ['market-analysis', 'feature-comparison']
    },
    {
      type: 'researcher',
      name: 'Risk Assessment',
      task: `Identify risks and challenges for ${topic}. Focus on:
        - Technical risks
        - Security concerns
        - Operational challenges
        Store findings in memory: sop/research/risks`,
      capabilities: ['risk-analysis', 'security-analysis']
    },
    {
      type: 'analyst',
      name: 'Cost Estimation',
      task: `Estimate costs and resources for ${topic}. Focus on:
        - Development time
        - Infrastructure costs
        - Maintenance overhead
        Store findings in memory: sop/research/costs`,
      capabilities: ['estimation', 'resource-planning']
    }
  ];

  // All agents execute in parallel
  // (In actual implementation, use Claude Code's Task tool)
  const results = await Promise.all(
    researchAgents.map(agent => executeAgent(agent))
  );

  // Step 3: Synthesize results
  const synthesis = await synthesizeResearch(results);

  // Step 4: Store in vault
  await vault.store({
    path: `research/${topic}/synthesis.md`,
    content: synthesis
  });

  return synthesis;
}
```

**When to use**:
- Multiple independent research areas
- No dependencies between tasks
- Time-sensitive (parallel saves time)
- Each agent has distinct expertise

### 4.2 Sequential Planning → Execution Pattern

Use when execution depends on planning output.

```typescript
/**
 * Pattern: Sequential Planning → Execution
 * Use Case: Execution depends on plan
 * Topology: Sequential (plan first, then execute)
 */
async function sequentialPlanExecution(feature: string) {
  // Phase 1: PLANNING (sequential)
  console.log('Phase 1: Planning...');

  // Step 1.1: Requirements analysis
  const requirements = await executeAgent({
    type: 'analyst',
    name: 'Requirements Analyst',
    task: `Analyze requirements for ${feature}. Output:
      - User stories
      - Acceptance criteria
      - Non-functional requirements
      Store in memory: sop/plan/requirements`
  });

  // Step 1.2: Architecture design (depends on requirements)
  const architecture = await executeAgent({
    type: 'architect',
    name: 'System Architect',
    task: `Design architecture for ${feature} based on requirements:
      ${JSON.stringify(requirements)}
      Output:
      - Component diagram
      - Data flow
      - API contracts
      Store in memory: sop/plan/architecture`
  });

  // Step 1.3: Task breakdown (depends on architecture)
  const tasks = await executeAgent({
    type: 'planner',
    name: 'Project Planner',
    task: `Create task breakdown for ${feature} based on:
      Requirements: ${JSON.stringify(requirements)}
      Architecture: ${JSON.stringify(architecture)}
      Output:
      - Task list with dependencies
      - Time estimates
      - Resource allocation
      Store in memory: sop/plan/tasks`
  });

  // Phase 2: EXECUTION (parallel based on plan)
  console.log('Phase 2: Execution...');

  // Group tasks by dependency level
  const tasksByLevel = groupTasksByDependencyLevel(tasks);

  // Execute each level in sequence, tasks within level in parallel
  for (const level of tasksByLevel) {
    console.log(`Executing level ${level.level}...`);

    const levelResults = await Promise.all(
      level.tasks.map(task => executeAgent({
        type: 'coder',
        name: `Coder ${task.id}`,
        task: `Implement task: ${task.description}
          Dependencies: ${task.dependencies.map(d => `Check memory: sop/execution/${d}`)}
          Store result in memory: sop/execution/${task.id}`
      }))
    );

    console.log(`Level ${level.level} complete`);
  }

  // Phase 3: VALIDATION
  console.log('Phase 3: Validation...');

  const validation = await executeAgent({
    type: 'tester',
    name: 'Integration Tester',
    task: `Validate complete ${feature} implementation:
      - Run integration tests
      - Verify acceptance criteria
      - Check performance
      Store results in memory: sop/validation/results`
  });

  return {
    requirements,
    architecture,
    tasks,
    validation
  };
}
```

**When to use**:
- Tasks have clear dependencies
- Plan must be complete before execution
- Quality gate between phases
- Complex task breakdown needed

### 4.3 Learning Loop Integration Pattern

Use to capture and improve from every SOP execution.

```typescript
/**
 * Pattern: Learning Loop Integration
 * Use Case: Continuous improvement of SOP execution
 * Captures: Context, Plan, Outcome, Lessons
 */
async function learningLoopIntegration(sopName: string, inputs: any) {
  const executionId = `${sopName}-${Date.now()}`;

  // =============================================
  // BEFORE EXECUTION: LEARN FROM PAST
  // =============================================

  // Retrieve similar past executions
  const similarExecutions = await memory.search({
    namespace: `sop:${sopName}`,
    query: JSON.stringify(inputs),
    limit: 5,
    minSimilarity: 0.7
  });

  // Extract lessons learned
  const pastLessons = similarExecutions
    .map(e => e.lessons)
    .flat()
    .filter(l => l.applicability === 'high');

  console.log(`Retrieved ${pastLessons.length} applicable lessons from past executions`);

  // Apply past lessons to current plan
  const improvedPlan = applyLessons(basePlan, pastLessons);

  // =============================================
  // DURING EXECUTION: CAPTURE OBSERVATIONS
  // =============================================

  const observations: any[] = [];

  const executionHooks = {
    beforeStep: async (step: any) => {
      observations.push({
        type: 'step-start',
        step: step.id,
        timestamp: Date.now(),
        context: await getStepContext(step)
      });
    },

    afterStep: async (step: any, result: any) => {
      observations.push({
        type: 'step-complete',
        step: step.id,
        timestamp: Date.now(),
        result: result,
        metrics: {
          duration: result.duration,
          tokensUsed: result.tokensUsed,
          quality: result.qualityScore
        }
      });
    },

    onError: async (step: any, error: any) => {
      observations.push({
        type: 'step-error',
        step: step.id,
        timestamp: Date.now(),
        error: error.message,
        context: await getStepContext(step)
      });
    }
  };

  // Execute with observation hooks
  const result = await executePlan(improvedPlan, executionHooks);

  // =============================================
  // AFTER EXECUTION: REFLECT AND LEARN
  // =============================================

  // Analyze observations
  const analysis = await analyzeObservations(observations);

  // Generate insights
  const insights = await generateInsights({
    sopName: sopName,
    inputs: inputs,
    plan: improvedPlan,
    result: result,
    observations: observations,
    analysis: analysis,

    // Reflection questions
    questions: [
      'What worked better than expected and why?',
      'What took longer than planned and why?',
      'Were the right agents chosen for each task?',
      'Could any sequential steps have been parallel?',
      'What patterns emerged during execution?',
      'What would we do differently next time?',
      'What assumptions were validated or invalidated?',
      'What new knowledge was gained?'
    ]
  });

  // Extract actionable lessons
  const lessons = insights.map(insight => ({
    insight: insight.description,
    applicability: insight.applicability, // 'high' | 'medium' | 'low'
    category: insight.category, // 'planning' | 'execution' | 'coordination' | 'tooling'
    recommendation: insight.recommendation,
    confidence: insight.confidence // 0.0-1.0
  }));

  // =============================================
  // STORE EXPERIENCE FOR FUTURE IMPROVEMENT
  // =============================================

  await memory.store({
    namespace: `sop:${sopName}`,
    key: executionId,
    value: {
      timestamp: new Date().toISOString(),
      inputs: inputs,
      plan: improvedPlan,
      result: result,
      observations: observations,
      analysis: analysis,
      insights: insights,
      lessons: lessons,
      metrics: {
        duration: result.duration,
        tokensUsed: result.tokensUsed,
        agentsUsed: result.agentsUsed,
        successRate: result.successRate,
        qualityScore: result.qualityScore
      }
    },
    tags: [
      'sop-execution',
      sopName,
      `status:${result.success ? 'success' : 'failure'}`,
      `quality:${result.qualityScore > 0.8 ? 'high' : result.qualityScore > 0.6 ? 'medium' : 'low'}`,
      ...lessons.map(l => `lesson:${l.category}`)
    ],
    ttl: 90 * 24 * 60 * 60 // Keep for 90 days
  });

  // Update neural patterns for future optimization
  await claudeFlow.neural_train({
    pattern_type: 'optimization',
    training_data: JSON.stringify({
      input: { sop: sopName, inputs: inputs },
      output: { plan: improvedPlan, result: result },
      feedback: { lessons: lessons, quality: result.qualityScore }
    }),
    epochs: 10
  });

  console.log(`Stored execution ${executionId} with ${lessons.length} lessons learned`);

  return {
    result: result,
    lessons: lessons,
    improvements: lessons.filter(l => l.applicability === 'high')
  };
}
```

**When to use**:
- All SOPs should use this pattern
- Especially important for frequently-used SOPs
- Critical for SOPs with high variance in outcomes
- Essential for autonomous improvement

### 4.4 Hybrid Topology Pattern

Use when some tasks are parallel, some sequential.

```typescript
/**
 * Pattern: Hybrid Topology
 * Use Case: Mix of parallel and sequential tasks
 * Topology: Hybrid (groups of parallel tasks in sequence)
 */
async function hybridTopology(project: string) {
  // =============================================
  // STAGE 1: PARALLEL RESEARCH
  // =============================================
  console.log('Stage 1: Parallel Research...');

  const researchResults = await Promise.all([
    executeAgent({
      type: 'researcher',
      name: 'Technology Research',
      task: 'Research tech stack options'
    }),
    executeAgent({
      type: 'researcher',
      name: 'Market Research',
      task: 'Research market and competitors'
    }),
    executeAgent({
      type: 'analyst',
      name: 'Risk Analysis',
      task: 'Identify project risks'
    })
  ]);

  // =============================================
  // STAGE 2: SEQUENTIAL SYNTHESIS
  // =============================================
  console.log('Stage 2: Synthesis (depends on research)...');

  const synthesis = await executeAgent({
    type: 'analyst',
    name: 'Synthesis Analyst',
    task: `Synthesize research: ${JSON.stringify(researchResults)}`
  });

  // =============================================
  // STAGE 3: PARALLEL DESIGN
  // =============================================
  console.log('Stage 3: Parallel Design (depends on synthesis)...');

  const designResults = await Promise.all([
    executeAgent({
      type: 'architect',
      name: 'System Architect',
      task: `Design system architecture based on: ${synthesis}`
    }),
    executeAgent({
      type: 'designer',
      name: 'UX Designer',
      task: `Design user experience based on: ${synthesis}`
    }),
    executeAgent({
      type: 'architect',
      name: 'Data Architect',
      task: `Design data model based on: ${synthesis}`
    })
  ]);

  // =============================================
  // STAGE 4: PARALLEL IMPLEMENTATION
  // =============================================
  console.log('Stage 4: Parallel Implementation (depends on designs)...');

  const implementationResults = await Promise.all([
    executeAgent({
      type: 'coder',
      name: 'Backend Developer',
      task: `Implement backend: ${designResults[0]}`
    }),
    executeAgent({
      type: 'coder',
      name: 'Frontend Developer',
      task: `Implement frontend: ${designResults[1]}`
    }),
    executeAgent({
      type: 'coder',
      name: 'Database Developer',
      task: `Implement database: ${designResults[2]}`
    })
  ]);

  // =============================================
  // STAGE 5: SEQUENTIAL INTEGRATION
  // =============================================
  console.log('Stage 5: Integration (depends on implementations)...');

  const integration = await executeAgent({
    type: 'coder',
    name: 'Integration Engineer',
    task: `Integrate components: ${JSON.stringify(implementationResults)}`
  });

  // =============================================
  // STAGE 6: PARALLEL TESTING
  // =============================================
  console.log('Stage 6: Parallel Testing (depends on integration)...');

  const testResults = await Promise.all([
    executeAgent({
      type: 'tester',
      name: 'Unit Tester',
      task: `Run unit tests on: ${integration}`
    }),
    executeAgent({
      type: 'tester',
      name: 'Integration Tester',
      task: `Run integration tests on: ${integration}`
    }),
    executeAgent({
      type: 'tester',
      name: 'E2E Tester',
      task: `Run E2E tests on: ${integration}`
    })
  ]);

  return {
    research: researchResults,
    synthesis: synthesis,
    design: designResults,
    implementation: implementationResults,
    integration: integration,
    tests: testResults
  };
}
```

**When to use**:
- Complex workflows with dependencies
- Some tasks can be parallel, others must be sequential
- Clear stage gates between phases
- Optimization of both speed (parallel) and correctness (sequential)

### 4.5 Mesh Coordination Pattern

Use when agents need to dynamically communicate and coordinate.

```typescript
/**
 * Pattern: Mesh Coordination
 * Use Case: Agents need dynamic peer-to-peer communication
 * Topology: Mesh (every agent can communicate with every other)
 */
async function meshCoordination(complexTask: string) {
  // Initialize mesh topology
  await claudeFlow.swarm_init({
    topology: 'mesh',
    maxAgents: 6,
    strategy: 'adaptive'
  });

  // Shared memory namespace for coordination
  const namespace = `sop/mesh/${Date.now()}`;

  // Spawn agents that will coordinate via mesh
  const agents = await Promise.all([
    executeAgent({
      type: 'architect',
      name: 'System Architect',
      task: `Design system for ${complexTask}.
        - Publish architecture decisions to: ${namespace}/architecture
        - Subscribe to updates from: ${namespace}/implementation
        - Coordinate with other agents via ${namespace}/coordination`
    }),

    executeAgent({
      type: 'coder',
      name: 'Backend Developer',
      task: `Implement backend for ${complexTask}.
        - Subscribe to architecture from: ${namespace}/architecture
        - Publish implementation updates to: ${namespace}/implementation/backend
        - Request clarifications via: ${namespace}/coordination/backend-questions`
    }),

    executeAgent({
      type: 'coder',
      name: 'Frontend Developer',
      task: `Implement frontend for ${complexTask}.
        - Subscribe to architecture from: ${namespace}/architecture
        - Subscribe to backend API from: ${namespace}/implementation/backend
        - Publish implementation updates to: ${namespace}/implementation/frontend
        - Coordinate with backend via: ${namespace}/coordination`
    }),

    executeAgent({
      type: 'tester',
      name: 'Test Engineer',
      task: `Test ${complexTask}.
        - Subscribe to all implementation updates: ${namespace}/implementation/*
        - Publish test results to: ${namespace}/tests
        - Report issues via: ${namespace}/coordination/test-issues`
    }),

    executeAgent({
      type: 'reviewer',
      name: 'Code Reviewer',
      task: `Review code for ${complexTask}.
        - Subscribe to all implementation: ${namespace}/implementation/*
        - Publish review feedback to: ${namespace}/reviews
        - Coordinate fixes via: ${namespace}/coordination/review-feedback`
    }),

    executeAgent({
      type: 'coordinator',
      name: 'Project Coordinator',
      task: `Coordinate ${complexTask} project.
        - Monitor all namespaces: ${namespace}/*
        - Resolve conflicts via: ${namespace}/coordination/resolutions
        - Track progress and blockers
        - Ensure agents stay synchronized`
    })
  ]);

  // Monitor mesh coordination
  const coordinationLog = await claudeFlow.swarm_monitor({
    swarmId: 'current',
    duration: 60,
    interval: 5
  });

  return {
    agents: agents,
    coordination: coordinationLog
  };
}
```

**When to use**:
- Complex tasks requiring dynamic coordination
- Agents need to communicate bidirectionally
- Requirements evolve during execution
- High degree of interdependency between agents

---

## 5. SOP Discovery and Execution

### 5.1 CLI Commands

#### List all SOPs
```bash
# List all available SOPs
weaver sop list

# List by category
weaver sop list --category development
weaver sop list --category documentation
weaver sop list --category operations
weaver sop list --category quality

# List by status
weaver sop list --status active
weaver sop list --status draft

# Search SOPs
weaver sop search "testing"
weaver sop search "deployment"
```

#### Get SOP information
```bash
# Show detailed information about an SOP
weaver sop info feature-plan

# Show SOP with examples
weaver sop info feature-plan --examples

# Show SOP execution history
weaver sop info feature-plan --history

# Show SOP performance metrics
weaver sop info feature-plan --metrics
```

#### Execute an SOP
```bash
# Execute with required inputs
weaver sop run feature-plan \
  --description "Add user authentication system"

# Execute with optional parameters
weaver sop run feature-plan \
  --description "Add user authentication" \
  --priority high \
  --milestone "v2.0"

# Execute in dry-run mode
weaver sop run feature-plan \
  --description "Add authentication" \
  --dry-run

# Execute with verbose output
weaver sop run feature-plan \
  --description "Add authentication" \
  --verbose

# Execute with custom learning namespace
weaver sop run feature-plan \
  --description "Add authentication" \
  --learning-namespace "project:auth-feature"
```

#### View execution history
```bash
# View all SOP executions
weaver sop history

# View history for specific SOP
weaver sop history feature-plan

# View recent executions
weaver sop history --limit 10

# View failed executions
weaver sop history --status failed

# View executions with metrics
weaver sop history --metrics
```

#### Analyze SOP performance
```bash
# View performance metrics for an SOP
weaver sop metrics feature-plan

# View trends over time
weaver sop metrics feature-plan --timeframe 30d

# Compare SOP versions
weaver sop metrics feature-plan --compare-versions

# Export metrics to file
weaver sop metrics feature-plan --export metrics.json
```

### 5.2 Programmatic API

#### Basic SOP Execution
```typescript
import { sopRegistry } from '@weaver/sop-registry';

// Execute SOP programmatically
const result = await sopRegistry.execute('feature-plan', {
  description: 'Add user authentication system',
  priority: 'high',
  milestone: 'v2.0'
});

console.log(`SOP completed in ${result.duration}ms`);
console.log(`Artifacts created: ${result.artifacts.length}`);
console.log(`Lessons learned: ${result.lessons.length}`);
```

#### Get SOP by category
```typescript
// Get all development SOPs
const devSOPs = sopRegistry.getByCategory('development');

console.log(`Found ${devSOPs.length} development SOPs`);
devSOPs.forEach(sop => {
  console.log(`- ${sop.id}: ${sop.name}`);
});
```

#### Search SOPs
```typescript
// Search by keywords
const testingSOPs = sopRegistry.search('testing');

// Search with filters
const activeQualitySOPs = sopRegistry.search({
  keywords: 'quality',
  category: 'quality',
  status: 'active'
});
```

#### Advanced execution with hooks
```typescript
// Execute with lifecycle hooks
const result = await sopRegistry.execute('feature-plan', {
  description: 'Add authentication',
}, {
  // Hook before SOP starts
  onStart: async (sop, inputs) => {
    console.log(`Starting SOP: ${sop.name}`);
    // Custom initialization
  },

  // Hook before each phase
  onPhaseStart: async (phase) => {
    console.log(`Starting phase: ${phase.name}`);
  },

  // Hook after each phase
  onPhaseComplete: async (phase, result) => {
    console.log(`Phase ${phase.name} complete`);
    // Custom validation or logging
  },

  // Hook on agent spawn
  onAgentSpawn: async (agent) => {
    console.log(`Spawned agent: ${agent.name}`);
  },

  // Hook on agent complete
  onAgentComplete: async (agent, result) => {
    console.log(`Agent ${agent.name} complete`);
  },

  // Hook on error
  onError: async (error, context) => {
    console.error(`Error in ${context.phase}:`, error);
    // Custom error handling
  },

  // Hook on completion
  onComplete: async (result) => {
    console.log(`SOP complete: ${result.success ? 'SUCCESS' : 'FAILURE'}`);
    // Custom reporting
  }
});
```

#### Batch SOP execution
```typescript
// Execute multiple SOPs in sequence
const results = await sopRegistry.executeBatch([
  { sop: 'feature-plan', inputs: { description: 'Feature 1' } },
  { sop: 'feature-plan', inputs: { description: 'Feature 2' } },
  { sop: 'feature-plan', inputs: { description: 'Feature 3' } }
], {
  parallel: false, // Run sequentially
  continueOnError: true // Continue even if one fails
});

// Execute multiple SOPs in parallel
const parallelResults = await sopRegistry.executeBatch([
  { sop: 'api-docs', inputs: { module: 'auth' } },
  { sop: 'api-docs', inputs: { module: 'users' } },
  { sop: 'api-docs', inputs: { module: 'posts' } }
], {
  parallel: true, // Run in parallel
  maxConcurrent: 3 // Max 3 at a time
});
```

#### SOP validation
```typescript
// Validate SOP before execution
const validation = await sopRegistry.validate('feature-plan', {
  description: 'Add authentication'
});

if (!validation.valid) {
  console.error('Invalid inputs:');
  validation.errors.forEach(error => {
    console.error(`- ${error.field}: ${error.message}`);
  });
} else {
  // Execute SOP
  const result = await sopRegistry.execute('feature-plan', {
    description: 'Add authentication'
  });
}
```

---

## 6. SOP Development Guide

### 6.1 Creating a New SOP

#### Step 1: Define the Workflow

Before writing any code, clearly define:

**Problem Statement**:
- What problem does this SOP solve?
- What pain point does it address?
- Who will use it and when?

**Scope**:
- What is included in this SOP?
- What is explicitly out of scope?
- What related SOPs exist?

**Inputs and Outputs**:
- What information is needed to start?
- What artifacts will be produced?
- What metrics will be captured?

**Agents and Tools**:
- Which agents are needed and why?
- What capabilities must they have?
- Which MCP tools will be used?
- How will agents coordinate?

**Success Criteria**:
- How do we know the SOP succeeded?
- What quality gates must be passed?
- What metrics indicate success?

#### Step 2: Create SOP Document

Create a new SOP document following the template:

```bash
# Create new SOP from template
weaver sop create \
  --name "Feature Planning" \
  --category development \
  --template base

# This creates: docs/sops/development/SOP-001-feature-planning.md
```

Fill in all sections of the template:
1. YAML frontmatter with complete metadata
2. Overview and prerequisites
3. Inputs (required and optional)
4. Agent coordination details
5. MCP tool usage
6. Weaver integration points
7. Learning integration
8. Step-by-step execution
9. Success criteria
10. Outputs and artifacts
11. Troubleshooting guide
12. Examples

#### Step 3: Implement Coordination

Create TypeScript implementation in `src/sops/`:

```typescript
// src/sops/feature-planning.sop.ts

import { SOP, SOPInputs, SOPResult } from '@weaver/sop-framework';
import { learningLoop } from '@weaver/learning-loop';
import { claudeFlow } from '@weaver/claude-flow';
import { vault } from '@weaver/vault';
import { shadowCache } from '@weaver/shadow-cache';

/**
 * SOP-001: Feature Planning
 * Orchestrates feature planning with research, architecture, and breakdown
 */
export class FeaturePlanningSOP implements SOP {
  id = 'SOP-001';
  name = 'Feature Planning';
  category = 'development';
  version = '1.0.0';

  // Define inputs
  inputs: SOPInputs = {
    required: {
      description: {
        type: 'string',
        description: 'Feature description',
        validation: (val: string) => val.length > 10
      }
    },
    optional: {
      priority: {
        type: 'string',
        default: 'medium',
        description: 'Feature priority'
      },
      milestone: {
        type: 'string',
        default: null,
        description: 'Target milestone'
      }
    }
  };

  // Define success criteria
  successCriteria = {
    required: [
      {
        criterion: 'Feature spec created',
        validation: (result: any) => result.artifacts.some(a => a.type === 'spec'),
        errorMessage: 'Feature spec was not created'
      },
      {
        criterion: 'Architecture designed',
        validation: (result: any) => result.artifacts.some(a => a.type === 'architecture'),
        errorMessage: 'Architecture design missing'
      },
      {
        criterion: 'Tasks defined',
        validation: (result: any) => result.tasks && result.tasks.length > 0,
        errorMessage: 'No tasks were created'
      }
    ],
    optional: [
      {
        criterion: 'Risk assessment complete',
        validation: (result: any) => result.artifacts.some(a => a.type === 'risk-assessment'),
        warningMessage: 'Risk assessment recommended but not found'
      }
    ]
  };

  /**
   * Execute the SOP
   */
  async execute(inputs: any): Promise<SOPResult> {
    const startTime = Date.now();

    try {
      // ===== PERCEPTION =====
      const context = await learningLoop.perceive({
        sop: this.name,
        inputs: inputs,
        similarExecutions: await this.retrieveSimilarExecutions(inputs),
        relevantPatterns: await shadowCache.query({
          patterns: ['sops/feature-planning/**', 'patterns/features/**']
        })
      });

      // ===== REASONING =====
      const plan = await learningLoop.reason({
        context: context,
        constraints: {
          maxAgents: 5,
          maxDuration: 600000 // 10 minutes
        }
      });

      // ===== COORDINATION =====
      await claudeFlow.swarm_init({
        topology: 'parallel',
        maxAgents: 4,
        strategy: 'balanced'
      });

      // ===== EXECUTION =====
      const agentResults = await this.executeAgents(inputs, plan);

      // ===== SYNTHESIS =====
      const synthesis = await this.synthesizeResults(agentResults);

      // ===== ARTIFACTS =====
      const artifacts = await this.createArtifacts(synthesis, inputs);

      // ===== REFLECTION =====
      const lessons = await learningLoop.reflect({
        sop: this.name,
        plan: plan,
        result: synthesis,
        metrics: {
          duration: Date.now() - startTime,
          agentsUsed: agentResults.length
        }
      });

      // ===== MEMORY =====
      await learningLoop.memorize({
        namespace: `sop:${this.id}`,
        execution: {
          timestamp: new Date().toISOString(),
          inputs: inputs,
          result: synthesis,
          lessons: lessons
        }
      });

      return {
        success: true,
        sop: this.name,
        duration: Date.now() - startTime,
        artifacts: artifacts,
        lessons: lessons
      };

    } catch (error) {
      // Handle and learn from failures
      await this.handleFailure(error, inputs);
      throw error;
    }
  }

  /**
   * Execute agents in parallel
   */
  private async executeAgents(inputs: any, plan: any) {
    // In real implementation, use Claude Code's Task tool
    // This is a simplified example

    return await Promise.all([
      this.researchAgent(inputs),
      this.architectAgent(inputs),
      this.plannerAgent(inputs),
      this.analystAgent(inputs)
    ]);
  }

  /**
   * Research agent
   */
  private async researchAgent(inputs: any) {
    // Execute research agent via Task tool
    // Returns research findings
  }

  /**
   * Architect agent
   */
  private async architectAgent(inputs: any) {
    // Execute architect agent via Task tool
    // Returns architecture design
  }

  /**
   * Planner agent
   */
  private async plannerAgent(inputs: any) {
    // Execute planner agent via Task tool
    // Returns task breakdown
  }

  /**
   * Analyst agent
   */
  private async analystAgent(inputs: any) {
    // Execute analyst agent via Task tool
    // Returns risk assessment
  }

  /**
   * Synthesize agent results
   */
  private async synthesizeResults(results: any[]) {
    // Combine and synthesize all agent outputs
  }

  /**
   * Create final artifacts
   */
  private async createArtifacts(synthesis: any, inputs: any) {
    const artifacts = [];

    // Create feature spec
    const spec = await this.createFeatureSpec(synthesis, inputs);
    await vault.store({
      path: `features/${inputs.description}/spec.md`,
      content: spec
    });
    artifacts.push({ type: 'spec', path: `features/${inputs.description}/spec.md` });

    // Create architecture doc
    const arch = await this.createArchitectureDoc(synthesis);
    await vault.store({
      path: `features/${inputs.description}/architecture.md`,
      content: arch
    });
    artifacts.push({ type: 'architecture', path: `features/${inputs.description}/architecture.md` });

    // Create task list
    const tasks = await this.createTaskList(synthesis);
    await vault.store({
      path: `features/${inputs.description}/tasks.md`,
      content: tasks
    });
    artifacts.push({ type: 'tasks', path: `features/${inputs.description}/tasks.md` });

    return artifacts;
  }

  /**
   * Retrieve similar past executions
   */
  private async retrieveSimilarExecutions(inputs: any) {
    return await memory.search({
      namespace: `sop:${this.id}`,
      query: JSON.stringify(inputs),
      limit: 5
    });
  }

  /**
   * Handle execution failure
   */
  private async handleFailure(error: any, inputs: any) {
    await learningLoop.memorize({
      namespace: `sop:${this.id}:failures`,
      execution: {
        timestamp: new Date().toISOString(),
        inputs: inputs,
        error: error.message
      }
    });
  }
}

// Register SOP
sopRegistry.register(new FeaturePlanningSOP());
```

#### Step 4: Test and Validate

Create comprehensive tests:

```typescript
// tests/sops/feature-planning.sop.test.ts

import { FeaturePlanningSOP } from '../../src/sops/feature-planning.sop';
import { sopTestUtils } from '@weaver/sop-testing';

describe('SOP-001: Feature Planning', () => {
  let sop: FeaturePlanningSOP;

  beforeEach(() => {
    sop = new FeaturePlanningSOP();
  });

  describe('Input Validation', () => {
    test('should require description', async () => {
      await expect(sop.execute({})).rejects.toThrow('description is required');
    });

    test('should validate description length', async () => {
      await expect(sop.execute({ description: 'short' })).rejects.toThrow();
    });

    test('should accept valid inputs', async () => {
      const result = await sop.execute({
        description: 'Add user authentication system'
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Agent Coordination', () => {
    test('should spawn all required agents', async () => {
      const spySpawn = jest.spyOn(claudeFlow, 'agent_spawn');

      await sop.execute({
        description: 'Add user authentication system'
      });

      expect(spySpawn).toHaveBeenCalledTimes(4);
    });

    test('should use parallel topology', async () => {
      const spyInit = jest.spyOn(claudeFlow, 'swarm_init');

      await sop.execute({
        description: 'Add user authentication system'
      });

      expect(spyInit).toHaveBeenCalledWith(
        expect.objectContaining({ topology: 'parallel' })
      );
    });
  });

  describe('Artifact Generation', () => {
    test('should create feature spec', async () => {
      const result = await sop.execute({
        description: 'Add user authentication system'
      });

      expect(result.artifacts).toContainEqual(
        expect.objectContaining({ type: 'spec' })
      );
    });

    test('should create architecture doc', async () => {
      const result = await sop.execute({
        description: 'Add user authentication system'
      });

      expect(result.artifacts).toContainEqual(
        expect.objectContaining({ type: 'architecture' })
      );
    });

    test('should create task list', async () => {
      const result = await sop.execute({
        description: 'Add user authentication system'
      });

      expect(result.artifacts).toContainEqual(
        expect.objectContaining({ type: 'tasks' })
      );
    });
  });

  describe('Success Criteria', () => {
    test('should validate all required criteria', async () => {
      const result = await sop.execute({
        description: 'Add user authentication system'
      });

      for (const criterion of sop.successCriteria.required) {
        expect(criterion.validation(result)).toBe(true);
      }
    });
  });

  describe('Learning Integration', () => {
    test('should store execution in memory', async () => {
      const spyMemorize = jest.spyOn(learningLoop, 'memorize');

      await sop.execute({
        description: 'Add user authentication system'
      });

      expect(spyMemorize).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'sop:SOP-001'
        })
      );
    });

    test('should retrieve similar executions', async () => {
      const spySearch = jest.spyOn(memory, 'search');

      await sop.execute({
        description: 'Add user authentication system'
      });

      expect(spySearch).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'sop:SOP-001'
        })
      );
    });
  });

  describe('Performance', () => {
    test('should complete within 10 minutes', async () => {
      const startTime = Date.now();

      await sop.execute({
        description: 'Add user authentication system'
      });

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(600000); // 10 minutes
    });
  });
});
```

Run tests:
```bash
# Run SOP tests
npm test -- feature-planning.sop.test.ts

# Run with coverage
npm test -- --coverage feature-planning.sop.test.ts

# Run integration tests
npm test -- --integration feature-planning.sop.test.ts
```

#### Step 5: Document and Deploy

1. **Update SOP Catalog**: Add to `docs/WEAVER-SOPS-FRAMEWORK.md`
2. **Create User Guide**: Add examples to `docs/sops/guides/`
3. **Register SOP**: Ensure it's registered in `src/sops/index.ts`
4. **Update CLI**: Add to CLI help and autocomplete
5. **Create Changelog**: Document changes in `CHANGELOG.md`

Deploy:
```bash
# Build SOP
npm run build:sops

# Deploy to registry
weaver sop deploy feature-planning

# Verify deployment
weaver sop list | grep feature-planning
```

### 6.2 SOP Best Practices

#### ✅ DO:

1. **Always integrate with learning loop**
   - Retrieve past executions for context
   - Capture observations during execution
   - Reflect and extract lessons after completion
   - Store experience for future improvement

2. **Use parallel agent execution when possible**
   - Identify independent tasks
   - Spawn agents concurrently via Task tool
   - Use MCP coordination for complex scenarios
   - Minimize sequential dependencies

3. **Leverage MCP tools before building custom solutions**
   - Check if existing MCP tools solve the problem
   - Use claude-flow for swarm coordination
   - Use ruv-swarm for enhanced coordination
   - Use flow-nexus for advanced features

4. **Store all artifacts in vault**
   - Organize by category and project
   - Use consistent naming conventions
   - Add metadata for searchability
   - Index in shadow cache

5. **Define clear success criteria**
   - Specify required criteria (must pass)
   - Specify optional criteria (nice to have)
   - Make criteria measurable
   - Provide validation functions

6. **Enable autonomous improvement**
   - Capture metrics at every step
   - Analyze what worked and what didn't
   - Generate actionable recommendations
   - Update neural patterns

7. **Handle errors gracefully**
   - Catch and log all errors
   - Store failures for learning
   - Provide helpful error messages
   - Include recovery suggestions

8. **Provide comprehensive documentation**
   - Document all inputs and outputs
   - Provide multiple examples
   - Include troubleshooting guide
   - Explain when to use vs not use

#### ❌ DON'T:

1. **Create sequential processes that could be parallel**
   - Analyze task dependencies carefully
   - Only sequence when truly necessary
   - Prefer parallel execution for speed
   - Use hybrid topology when mixed

2. **Duplicate existing MCP tool functionality**
   - Check MCP tool catalog first
   - Reuse before rebuilding
   - Contribute improvements to MCP tools
   - Focus SOPs on orchestration, not implementation

3. **Skip reflection/learning steps**
   - Always capture execution data
   - Always reflect on outcomes
   - Always store lessons learned
   - Learning is not optional

4. **Hardcode values (use inputs/config)**
   - Make SOPs configurable
   - Use sensible defaults
   - Document all options
   - Support environment-specific config

5. **Ignore error handling**
   - Expect failures
   - Handle gracefully
   - Learn from errors
   - Provide recovery paths

6. **Create overly complex SOPs**
   - Break down into smaller SOPs
   - Keep each SOP focused
   - Chain SOPs for complex workflows
   - Prefer composition over complexity

7. **Forget to version SOPs**
   - Use semantic versioning
   - Document breaking changes
   - Provide migration guides
   - Maintain backwards compatibility when possible

8. **Neglect testing**
   - Test all happy paths
   - Test error scenarios
   - Test edge cases
   - Test performance

---

## 7. Integration Points

### 7.1 Integration with Weaver

#### Shadow Cache Integration

The shadow cache provides fast, indexed access to vault content:

```typescript
// Index SOP outputs
await shadowCache.index({
  file: 'features/authentication/spec.md',
  tags: ['sop-output', 'feature-planning', 'authentication'],
  metadata: {
    sop: 'SOP-001',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  }
});

// Query for similar features
const similarFeatures = await shadowCache.query({
  patterns: ['features/*/spec.md'],
  tags: ['feature-planning'],
  fuzzyMatch: 'authentication'
});

// Use in SOP perception phase
const context = await learningLoop.perceive({
  sop: 'feature-planning',
  inputs: inputs,
  similarFeatures: similarFeatures
});
```

#### Vault Integration

Store all SOP outputs in organized vault structure:

```
vault/
├── features/
│   ├── authentication/
│   │   ├── spec.md (from SOP-001)
│   │   ├── architecture.md (from SOP-001)
│   │   └── tasks.md (from SOP-001)
│   └── notifications/
│       ├── spec.md
│       └── ...
├── releases/
│   └── v2.0/
│       ├── changelog.md (from SOP-003)
│       └── migration-guide.md (from SOP-003)
├── docs/
│   └── api/
│       └── auth-api.md (from SOP-007)
└── sops/
    └── executions/
        └── SOP-001/
            └── 2025-10-27-1234567.json
```

```typescript
// Store with metadata
await vault.store({
  path: 'features/authentication/spec.md',
  content: featureSpec,
  metadata: {
    sop: 'SOP-001',
    sopVersion: '1.0.0',
    createdBy: 'feature-planning-sop',
    timestamp: new Date().toISOString(),
    tags: ['feature', 'authentication', 'spec']
  }
});

// Retrieve with metadata
const spec = await vault.retrieve('features/authentication/spec.md');
console.log('Created by:', spec.metadata.createdBy);
console.log('SOP:', spec.metadata.sop);
```

#### Git Automation Integration

Automatically commit SOP outputs:

```typescript
// Configure git integration in SOP
const sopConfig = {
  git: {
    branchPattern: 'sop/feature-planning-{timestamp}',
    autoCommit: true,
    commitMessageTemplate: 'docs(feature): Add {feature-name} specification\n\nGenerated by SOP-001 (Feature Planning)\n\nCo-Authored-By: Claude <noreply@anthropic.com>'
  }
};

// Auto-commit SOP outputs
await git.autoCommit({
  files: [
    'features/authentication/spec.md',
    'features/authentication/architecture.md',
    'features/authentication/tasks.md'
  ],
  message: 'docs(feature): Add authentication specification\n\nGenerated by SOP-001 (Feature Planning)',
  branch: 'sop/feature-planning-1698765432'
});
```

#### Workflows Integration

Trigger SOPs from workflow events:

```typescript
// workflow.config.ts
export const workflows = [
  {
    name: 'feature-request-workflow',
    trigger: {
      event: 'issue.labeled',
      condition: 'label == "feature-request"'
    },
    actions: [
      {
        type: 'sop',
        sop: 'feature-plan',
        inputs: {
          description: '${issue.title}',
          priority: '${issue.labels.priority}',
          milestone: '${issue.milestone}'
        }
      }
    ]
  },
  {
    name: 'release-workflow',
    trigger: {
      event: 'git.tag',
      condition: 'tag matches "v*"'
    },
    actions: [
      {
        type: 'sop',
        sop: 'release-plan',
        inputs: {
          version: '${tag.name}',
          previousVersion: '${previousTag.name}'
        }
      }
    ]
  }
];
```

### 7.2 Integration with Claude-Flow

#### Swarm Coordination

Use Claude-Flow for multi-agent coordination:

```typescript
// Initialize swarm for complex SOP
await claudeFlow.swarm_init({
  topology: 'mesh',
  maxAgents: 8,
  strategy: 'adaptive'
});

// Spawn coordination agents
await claudeFlow.agents_spawn_parallel({
  agents: [
    { type: 'coordinator', name: 'Project Coordinator', capabilities: ['orchestration'] },
    { type: 'researcher', name: 'Tech Research', capabilities: ['web-search'] },
    { type: 'architect', name: 'System Architect', capabilities: ['design'] },
    { type: 'coder', name: 'Backend Dev', capabilities: ['coding'] },
    { type: 'coder', name: 'Frontend Dev', capabilities: ['coding'] },
    { type: 'tester', name: 'QA Engineer', capabilities: ['testing'] },
    { type: 'reviewer', name: 'Code Reviewer', capabilities: ['review'] }
  ],
  maxConcurrency: 5
});

// Monitor swarm health
const status = await claudeFlow.swarm_status();
console.log(`Swarm health: ${status.health}`);
console.log(`Active agents: ${status.activeAgents}`);
```

#### Memory Management

Share context across agents via Claude-Flow memory:

```typescript
// Store shared context
await claudeFlow.memory_usage({
  action: 'store',
  namespace: 'sop/feature-planning/shared',
  key: 'architecture-decisions',
  value: JSON.stringify({
    database: 'PostgreSQL',
    api: 'GraphQL',
    auth: 'JWT',
    deployment: 'Kubernetes'
  }),
  ttl: 3600 // 1 hour
});

// Retrieve in other agent
const decisions = await claudeFlow.memory_usage({
  action: 'retrieve',
  namespace: 'sop/feature-planning/shared',
  key: 'architecture-decisions'
});

// Search memory
const relatedDecisions = await claudeFlow.memory_search({
  namespace: 'sop/feature-planning',
  pattern: 'architecture',
  limit: 10
});
```

#### Workflows and Task Orchestration

Orchestrate complex workflows:

```typescript
// Create workflow
await claudeFlow.workflow_create({
  name: 'feature-development-workflow',
  steps: [
    {
      id: 'research',
      type: 'agent-task',
      agent: 'researcher',
      task: 'Research feature requirements',
      outputs: ['research-report']
    },
    {
      id: 'architecture',
      type: 'agent-task',
      agent: 'architect',
      task: 'Design system architecture',
      dependencies: ['research'],
      inputs: ['research-report'],
      outputs: ['architecture-design']
    },
    {
      id: 'implementation',
      type: 'parallel-tasks',
      tasks: [
        {
          id: 'backend',
          agent: 'backend-dev',
          task: 'Implement backend',
          dependencies: ['architecture']
        },
        {
          id: 'frontend',
          agent: 'frontend-dev',
          task: 'Implement frontend',
          dependencies: ['architecture']
        }
      ]
    },
    {
      id: 'testing',
      type: 'agent-task',
      agent: 'tester',
      task: 'Test implementation',
      dependencies: ['implementation']
    }
  ],
  triggers: ['manual', 'webhook']
});

// Execute workflow
const result = await claudeFlow.workflow_execute({
  workflow_id: 'feature-development-workflow',
  inputs: {
    feature: 'user-authentication'
  }
});
```

#### Neural Patterns

Use neural learning for SOP optimization:

```typescript
// Train on successful SOP executions
await claudeFlow.neural_train({
  pattern_type: 'optimization',
  training_data: JSON.stringify({
    sop: 'feature-planning',
    executions: successfulExecutions.map(e => ({
      input: e.inputs,
      plan: e.plan,
      outcome: e.result,
      quality: e.qualityScore
    }))
  }),
  epochs: 50
});

// Get neural predictions for new execution
const prediction = await claudeFlow.neural_predict({
  modelId: 'sop-optimization-model',
  input: JSON.stringify({
    sop: 'feature-planning',
    inputs: currentInputs
  })
});

// Use prediction to optimize plan
const optimizedPlan = applyNeuralOptimizations(basePlan, prediction);
```

### 7.3 Integration with Learning Loop

The learning loop is the core autonomous improvement mechanism:

```typescript
/**
 * Complete Learning Loop Integration
 */
class LearningLoopIntegration {
  /**
   * PHASE 1: PERCEPTION
   * Understand the task and gather context
   */
  async perceive(inputs: any) {
    return {
      // Current task
      task: inputs,

      // Similar past executions
      history: await memory.search({
        namespace: 'sop:executions',
        query: JSON.stringify(inputs),
        limit: 10,
        minSimilarity: 0.6
      }),

      // Relevant patterns from vault
      patterns: await shadowCache.query({
        patterns: ['patterns/**', 'best-practices/**'],
        tags: ['relevant-to-task']
      }),

      // Lessons learned
      lessons: await memory.retrieve({
        namespace: 'sop:lessons',
        tags: ['applicable-to-task']
      }),

      // Current context
      environment: {
        availableAgents: await getAvailableAgents(),
        systemMetrics: await getSystemMetrics(),
        constraints: await getConstraints()
      }
    };
  }

  /**
   * PHASE 2: REASONING
   * Generate optimal execution plan
   */
  async reason(context: any) {
    // Analyze past successes/failures
    const analysis = this.analyzeHistory(context.history);

    // Apply lessons learned
    const lessonOptimizations = this.applyLessons(context.lessons);

    // Generate base plan
    const basePlan = this.generateBasePlan(context.task);

    // Optimize with neural predictions
    const neuralOptimizations = await this.getNeuralOptimizations(context);

    // Combine all optimizations
    return this.optimizePlan(
      basePlan,
      analysis,
      lessonOptimizations,
      neuralOptimizations,
      context.environment
    );
  }

  /**
   * PHASE 3: EXECUTION
   * Execute the plan with monitoring
   */
  async execute(plan: any, hooks?: any) {
    const observations: any[] = [];

    // Execute each step with observation
    for (const step of plan.steps) {
      const startTime = Date.now();

      // Pre-step hook
      if (hooks?.beforeStep) {
        await hooks.beforeStep(step);
      }

      // Execute step
      let stepResult;
      try {
        stepResult = await this.executeStep(step);

        // Capture observation
        observations.push({
          step: step.id,
          status: 'success',
          duration: Date.now() - startTime,
          metrics: stepResult.metrics,
          output: stepResult.output
        });

      } catch (error) {
        // Capture error observation
        observations.push({
          step: step.id,
          status: 'error',
          duration: Date.now() - startTime,
          error: error.message,
          context: step
        });

        // Error hook
        if (hooks?.onError) {
          await hooks.onError(step, error);
        }

        throw error;
      }

      // Post-step hook
      if (hooks?.afterStep) {
        await hooks.afterStep(step, stepResult);
      }
    }

    return {
      success: true,
      observations: observations,
      metrics: this.aggregateMetrics(observations)
    };
  }

  /**
   * PHASE 4: REFLECTION
   * Analyze what happened and extract insights
   */
  async reflect(execution: any) {
    // Analyze observations
    const analysis = {
      performance: this.analyzePerformance(execution.observations),
      quality: this.analyzeQuality(execution.result),
      efficiency: this.analyzeEfficiency(execution.observations),
      bottlenecks: this.identifyBottlenecks(execution.observations)
    };

    // Generate insights
    const insights = [];

    // What worked well?
    if (analysis.performance.aboveExpectation.length > 0) {
      insights.push({
        type: 'success-pattern',
        description: `These steps performed well: ${analysis.performance.aboveExpectation.join(', ')}`,
        applicability: 'high',
        recommendation: 'Reinforce this pattern in future executions'
      });
    }

    // What took longer than expected?
    if (analysis.performance.belowExpectation.length > 0) {
      insights.push({
        type: 'performance-issue',
        description: `These steps were slower: ${analysis.performance.belowExpectation.join(', ')}`,
        applicability: 'high',
        recommendation: 'Investigate and optimize these steps'
      });
    }

    // Were the right agents chosen?
    const agentEffectiveness = this.analyzeAgentEffectiveness(execution);
    if (agentEffectiveness.improvements.length > 0) {
      insights.push({
        type: 'agent-selection',
        description: 'Better agent selection possible',
        applicability: 'medium',
        recommendation: agentEffectiveness.improvements.join('; ')
      });
    }

    // Could sequential steps be parallel?
    const parallelizationOpportunities = this.findParallelizationOpportunities(execution);
    if (parallelizationOpportunities.length > 0) {
      insights.push({
        type: 'parallelization',
        description: 'Found parallelization opportunities',
        applicability: 'high',
        recommendation: `Consider running these in parallel: ${parallelizationOpportunities.join(', ')}`
      });
    }

    return {
      analysis: analysis,
      insights: insights,
      lessons: this.extractLessons(insights),
      recommendations: this.generateRecommendations(insights)
    };
  }

  /**
   * PHASE 5: MEMORY
   * Store experience for future use
   */
  async memorize(experience: any) {
    // Store complete execution record
    await memory.store({
      namespace: experience.namespace,
      key: experience.execution.timestamp,
      value: experience.execution,
      tags: [
        'sop-execution',
        `sop:${experience.sop}`,
        `status:${experience.execution.result.success ? 'success' : 'failure'}`,
        `quality:${this.qualityTag(experience.execution.result.qualityScore)}`,
        ...experience.execution.lessons.map((l: any) => `lesson:${l.category}`)
      ],
      ttl: 90 * 24 * 60 * 60 // 90 days
    });

    // Store lessons separately for easy retrieval
    for (const lesson of experience.execution.lessons) {
      await memory.store({
        namespace: 'sop:lessons',
        key: `${experience.sop}-${lesson.category}-${Date.now()}`,
        value: lesson,
        tags: [
          'lesson',
          `sop:${experience.sop}`,
          `category:${lesson.category}`,
          `applicability:${lesson.applicability}`
        ],
        ttl: 180 * 24 * 60 * 60 // 180 days
      });
    }

    // Update neural patterns
    await claudeFlow.neural_train({
      pattern_type: 'optimization',
      training_data: JSON.stringify({
        input: {
          sop: experience.sop,
          inputs: experience.execution.inputs
        },
        output: {
          plan: experience.execution.plan,
          result: experience.execution.result
        },
        feedback: {
          lessons: experience.execution.lessons,
          quality: experience.execution.result.qualityScore
        }
      }),
      epochs: 10
    });
  }

  // Helper methods...
  private analyzeHistory(history: any[]) { /* ... */ }
  private applyLessons(lessons: any[]) { /* ... */ }
  private generateBasePlan(task: any) { /* ... */ }
  private async getNeuralOptimizations(context: any) { /* ... */ }
  private optimizePlan(...args: any[]) { /* ... */ }
  private async executeStep(step: any) { /* ... */ }
  private aggregateMetrics(observations: any[]) { /* ... */ }
  private analyzePerformance(observations: any[]) { /* ... */ }
  private analyzeQuality(result: any) { /* ... */ }
  private analyzeEfficiency(observations: any[]) { /* ... */ }
  private identifyBottlenecks(observations: any[]) { /* ... */ }
  private analyzeAgentEffectiveness(execution: any) { /* ... */ }
  private findParallelizationOpportunities(execution: any) { /* ... */ }
  private extractLessons(insights: any[]) { /* ... */ }
  private generateRecommendations(insights: any[]) { /* ... */ }
  private qualityTag(score: number) { /* ... */ }
}
```

---

## 8. SOP Governance

### 8.1 Versioning

SOPs follow semantic versioning (semver):

**Version Format**: `MAJOR.MINOR.PATCH`

**MAJOR** version increment when:
- Breaking changes to SOP inputs/outputs
- Fundamental changes to SOP behavior
- Incompatible changes to success criteria
- Major agent topology changes

Example: `1.0.0` → `2.0.0`

**MINOR** version increment when:
- New optional inputs added
- New optional outputs added
- New agents added (without removing existing)
- Backward-compatible enhancements

Example: `1.0.0` → `1.1.0`

**PATCH** version increment when:
- Bug fixes
- Documentation improvements
- Performance optimizations
- Minor refinements

Example: `1.0.0` → `1.0.1`

**Version Documentation**:
```yaml
---
sop_id: "SOP-001"
version: "2.1.3"
version_history:
  - version: "2.1.3"
    date: "2025-10-27"
    changes:
      - "Fixed memory leak in agent coordination"
      - "Improved error messages"
    breaking: false

  - version: "2.1.0"
    date: "2025-10-20"
    changes:
      - "Added risk assessment agent"
      - "New optional input: riskThreshold"
    breaking: false

  - version: "2.0.0"
    date: "2025-10-01"
    changes:
      - "Changed input format from string to object"
      - "Removed deprecated 'mode' parameter"
      - "New required input: 'category'"
    breaking: true
    migration_guide: "docs/sops/migrations/SOP-001-v1-to-v2.md"
---
```

### 8.2 Deprecation Process

When deprecating an SOP or SOP feature:

**Step 1: Mark as Deprecated** (Version N)
```yaml
---
sop_id: "SOP-001"
version: "1.5.0"
status: "active"  # Still active
deprecation:
  deprecated: true
  since: "1.5.0"
  reason: "Replaced by SOP-025 which provides better performance"
  alternative: "SOP-025"
  removal_version: "2.0.0"
  removal_date: "2025-12-31"
---
```

**Step 2: Update Documentation**
- Add deprecation notice to README
- Update examples to use alternative
- Add migration guide
- Notify users via changelog

**Step 3: Grace Period** (6 months minimum)
- Continue supporting deprecated SOP
- Show warnings when executed
- Track usage metrics
- Help users migrate

**Step 4: Archive** (Version N+1)
```yaml
---
sop_id: "SOP-001"
version: "2.0.0"
status: "archived"
archived:
  date: "2025-12-31"
  reason: "Replaced by SOP-025"
  alternative: "SOP-025"
  archive_location: "docs/sops/archived/SOP-001/"
---
```

**Step 5: Remove from Active Registry**
- Move to archived directory
- Update SOP catalog
- Keep documentation for reference
- Redirect executions to alternative

### 8.3 Quality Standards

All SOPs must meet these quality standards:

#### Required Standards

**1. Documentation**
- ✅ Complete YAML frontmatter
- ✅ Clear overview and prerequisites
- ✅ Documented inputs and outputs
- ✅ Step-by-step execution guide
- ✅ Success criteria defined
- ✅ At least 2 usage examples
- ✅ Troubleshooting section

**2. Testing**
- ✅ Unit tests for all validation logic
- ✅ Integration tests for agent coordination
- ✅ End-to-end tests for complete execution
- ✅ Minimum 80% code coverage
- ✅ Performance benchmarks
- ✅ Error scenario tests

**3. Agent Coordination**
- ✅ Agent topology documented
- ✅ Agent responsibilities clearly defined
- ✅ Coordination protocol specified
- ✅ Memory namespaces defined
- ✅ Sync points identified

**4. Learning Integration**
- ✅ Perception phase implemented
- ✅ Reasoning phase implemented
- ✅ Reflection phase implemented
- ✅ Memory storage configured
- ✅ Improvement criteria defined

**5. Error Handling**
- ✅ All errors caught and logged
- ✅ Failures stored for learning
- ✅ Helpful error messages
- ✅ Recovery suggestions provided
- ✅ Graceful degradation

**6. Artifacts**
- ✅ All outputs stored in vault
- ✅ Indexed in shadow cache
- ✅ Metadata included
- ✅ Consistent naming convention
- ✅ Version controlled (if applicable)

#### Optional Standards (Recommended)

**7. Advanced Features**
- ⭐ Neural optimization enabled
- ⭐ Workflow integration configured
- ⭐ Git automation enabled
- ⭐ Custom hooks provided
- ⭐ Performance monitoring

**8. User Experience**
- ⭐ Interactive mode available
- ⭐ Progress indicators
- ⭐ Dry-run mode
- ⭐ Verbose logging option
- ⭐ Rich terminal output

**9. Observability**
- ⭐ Metrics exported
- ⭐ Traces captured
- ⭐ Alerts configured
- ⭐ Dashboards available

### 8.4 Review Process

All new or updated SOPs must go through review:

**1. Self-Review Checklist**
```markdown
## SOP Self-Review Checklist

### Documentation
- [ ] YAML frontmatter complete
- [ ] Overview clearly written
- [ ] Prerequisites documented
- [ ] All inputs documented with types and descriptions
- [ ] All outputs documented
- [ ] Success criteria defined
- [ ] At least 2 examples provided
- [ ] Troubleshooting section included
- [ ] Related SOPs referenced

### Implementation
- [ ] TypeScript implementation follows patterns
- [ ] Error handling comprehensive
- [ ] Learning loop integrated
- [ ] Memory namespaces unique
- [ ] Artifacts stored in vault
- [ ] Shadow cache indexing configured

### Testing
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing
- [ ] Code coverage > 80%
- [ ] Performance benchmarks run
- [ ] Error scenarios tested

### Quality
- [ ] Code linted and formatted
- [ ] No TypeScript errors
- [ ] No console.log statements (use logger)
- [ ] No hardcoded values
- [ ] Environment variables used for config
- [ ] Secrets not committed

### User Experience
- [ ] CLI help text added
- [ ] Autocomplete configured
- [ ] Error messages helpful
- [ ] Progress indicators included
- [ ] Dry-run mode works
```

**2. Peer Review**
- Submit PR with SOP changes
- Request review from 2+ team members
- Address all review comments
- Get approval from at least 2 reviewers

**3. Testing Review**
- Run full test suite
- Run on multiple scenarios
- Verify performance benchmarks
- Test error handling

**4. Documentation Review**
- Technical writer review
- Check for clarity and completeness
- Verify examples work
- Test troubleshooting steps

**5. Final Approval**
- SOP maintainer approval
- Merge to main branch
- Deploy to registry
- Update changelog

### 8.5 Metrics and Monitoring

Track these metrics for each SOP:

**Usage Metrics**:
- Execution count (total, by time period)
- Unique users
- Success rate
- Failure rate
- Average duration
- Token usage

**Quality Metrics**:
- Success criteria pass rate
- Artifact quality scores
- User satisfaction (if collected)
- Lessons learned count
- Improvement suggestions

**Performance Metrics**:
- P50, P95, P99 duration
- Agent utilization
- Memory usage
- Token efficiency
- Parallelization effectiveness

**Learning Metrics**:
- Similar executions retrieved
- Lessons applied
- Neural optimizations used
- Improvement over time
- Adaptation rate

**Dashboard Example**:
```bash
# View SOP metrics dashboard
weaver sop dashboard feature-planning

# Output:
┌─────────────────────────────────────────────────────┐
│ SOP-001: Feature Planning - Last 30 Days           │
├─────────────────────────────────────────────────────┤
│ Usage                                               │
│   Executions: 127                                   │
│   Unique Users: 23                                  │
│   Success Rate: 94.5%                               │
│   Avg Duration: 4m 32s                              │
│                                                     │
│ Performance                                         │
│   P50: 3m 45s                                       │
│   P95: 7m 12s                                       │
│   P99: 9m 48s                                       │
│                                                     │
│ Quality                                             │
│   Success Criteria Pass: 98.2%                      │
│   Avg Artifact Quality: 8.7/10                      │
│   Lessons Learned: 47                               │
│                                                     │
│ Learning                                            │
│   Similar Executions Used: 89%                      │
│   Lessons Applied: 73%                              │
│   Improvement Over Time: +12.3%                     │
└─────────────────────────────────────────────────────┘
```

---

## 9. Appendix: Reference SOPs

### 9.1 SOP-001: Feature Planning (Complete Example)

See: `docs/sops/development/SOP-001-feature-planning.md`

This is the canonical reference implementation showing all SOP framework features.

### 9.2 SOP-004: Code Review (Advanced Example)

See: `docs/sops/development/SOP-004-code-review.md`

Demonstrates mesh coordination with multiple specialized agents.

### 9.3 SOP-011: Service Deployment (Operations Example)

See: `docs/sops/operations/SOP-011-service-deployment.md`

Shows integration with PM2, health monitoring, and rollback procedures.

### 9.4 SOP-015: Testing Strategy (Quality Example)

See: `docs/sops/quality/SOP-015-testing-strategy.md`

Demonstrates comprehensive test planning with multiple testing agents.

---

## Conclusion

The Weaver SOP Framework provides a comprehensive, repeatable approach to orchestrating complex development workflows. By combining:

- **Multiple specialized agents** working in parallel
- **MCP tools** for coordination and advanced features
- **Weaver's capabilities** (shadow cache, vault, git automation, workflows)
- **The learning loop** for continuous improvement
- **Clear governance** and quality standards

We create a system that not only executes tasks efficiently but also learns and improves over time.

**Key Principles**:
1. **Repeatability**: SOPs provide consistent, reliable workflows
2. **Orchestration**: Coordinate multiple agents and tools seamlessly
3. **Learning**: Every execution improves future executions
4. **Quality**: Enforce high standards through governance
5. **Flexibility**: Support simple to complex scenarios
6. **Observability**: Track and optimize everything

**Next Steps**:
1. Review reference SOPs in `docs/sops/`
2. Create your first custom SOP using the template
3. Test thoroughly and iterate
4. Share with the team and gather feedback
5. Monitor metrics and continuously improve

The SOP framework is the foundation for building a truly autonomous development environment that gets better with every use.

---

**Document Version**: 1.0.0
**Last Updated**: 2025-10-27
**Maintained By**: Weaver Architecture Team
**Feedback**: Create an issue or PR in the weave-nn repository
