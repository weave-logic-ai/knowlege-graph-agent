# ADR-002: Agent System Design - Missing Agent Implementations

**Status**: Proposed
**Date**: 2025-12-29
**Category**: architecture

## Context

The Knowledge Graph Agent defines 10 agent types in `src/agents/types.ts`, but only 5 have implementation classes (Researcher, Coder, Tester, Analyst, Architect). The remaining 5 types are critical for achieving the multi-agent coordination envisioned in the Hive Mind architecture:

| Agent Type | Purpose | Status |
|------------|---------|--------|
| `REVIEWER` | Code review, security audit, performance analysis | NOT IMPLEMENTED |
| `COORDINATOR` | Multi-agent orchestration, task delegation | NOT IMPLEMENTED |
| `OPTIMIZER` | Performance tuning, memory optimization | NOT IMPLEMENTED |
| `DOCUMENTER` | API docs, user guides, changelog generation | NOT IMPLEMENTED |
| `PLANNER` | Task decomposition, timeline estimation, risk assessment | NOT IMPLEMENTED |

Without these agents, the system cannot:
- Perform autonomous code reviews or security audits
- Orchestrate complex multi-agent workflows
- Optimize code or system performance
- Generate comprehensive documentation
- Plan and schedule complex tasks

## Decision

Implement all 5 missing agent types following the established `BaseAgent` pattern with full claude-flow hooks integration. Each agent will:

1. Extend `BaseAgent` class
2. Implement type-specific methods and capabilities
3. Support pause/resume/terminate lifecycle
4. Emit events via the event bus
5. Execute pre/post task hooks for coordination
6. Register with the `AgentRegistry`

### Agent Capability Matrix

| Agent | Core Capabilities | Integration Points |
|-------|------------------|-------------------|
| ReviewerAgent | code_review, security_audit, performance_analysis, best_practices, documentation_review | Static analysis tools, OWASP rules, coding standards |
| CoordinatorAgent | orchestrate, delegate, agent_spawn, task_distribution, progress_tracking | AgentRegistry, TaskQueue, claude-flow swarm |
| OptimizerAgent | performance_tuning, memory_optimization, query_optimization, caching_strategy, benchmark | Profiling tools, benchmark suite |
| DocumenterAgent | api_docs, user_guides, architecture_docs, changelog_generation, format | TypeDoc, OpenAPI, git log |
| PlannerAgent | task_decomposition, dependency_analysis, resource_allocation, timeline_estimation, risk_assessment | DAG algorithms, estimation models |

## Rationale

### Why implement all 5 agents?

1. **Complete Coverage**: Each agent fills a specific gap in the development lifecycle
2. **Specialization**: Specialized agents outperform general-purpose ones for specific tasks
3. **Coordination**: CoordinatorAgent enables true multi-agent orchestration
4. **Quality**: ReviewerAgent ensures code quality without human intervention
5. **Efficiency**: OptimizerAgent identifies and fixes performance issues automatically

### Why follow the BaseAgent pattern?

1. **Consistency**: All agents share common lifecycle and communication patterns
2. **Testability**: Uniform interface simplifies testing
3. **Extensibility**: New agents can be added following the same pattern
4. **Integration**: Hooks integration works automatically for all agents

### Alternatives Considered

1. **Single General-Purpose Agent**: Would lack specialization, lower quality results
2. **External Services**: Adds latency and dependency, loses offline capability
3. **LLM-Only Approach**: No persistent state or learning, inconsistent results
4. **Minimal Agent Set**: Would leave gaps in workflow automation

## Consequences

### Positive

- Complete multi-agent coordination capability
- Automated code review and security auditing
- Self-documenting system with changelog generation
- Performance optimization without manual intervention
- Complex task planning with dependency resolution
- Reduced manual workload for development teams
- Consistent quality through standardized processes

### Negative

- 24-32 hours estimated implementation effort
- Increased codebase complexity (5 new agent classes)
- More test coverage required (5 agents x unit/integration tests)
- Additional maintenance burden
- Potential for agent conflicts without proper coordination

### Neutral

- Agents can be enabled/disabled independently
- Performance overhead scales with usage
- Memory footprint increases with agent count

## Implementation

### Agent Interface Compliance

All agents MUST implement:

```typescript
abstract class BaseAgent {
  abstract readonly type: AgentType;
  abstract readonly capabilities: string[];

  // Lifecycle methods
  async execute(input: AgentInput): Promise<AgentOutput>;
  async pause(): Promise<void>;
  async resume(): Promise<void>;
  async terminate(): Promise<void>;

  // Hooks integration
  protected async executePreTaskHook(description: string): Promise<void>;
  protected async executePostTaskHook(taskId: string): Promise<void>;

  // Communication
  sendMessage(agentId: string, message: AgentMessage): void;
  receiveMessage(message: AgentMessage): void;
}
```

### ReviewerAgent

**File**: `src/agents/reviewer-agent.ts`

```typescript
export class ReviewerAgent extends BaseAgent {
  readonly type = AgentType.REVIEWER;
  readonly capabilities = [
    'code_review',
    'security_audit',
    'performance_analysis',
    'best_practices',
    'documentation_review',
  ];

  async reviewCode(code: string, context: ReviewContext): Promise<CodeReviewResult> {
    await this.executePreTaskHook(`Reviewing code in ${context.filePath}`);

    const issues: ReviewIssue[] = [];

    // Static analysis
    issues.push(...await this.runStaticAnalysis(code, context.language));

    // Security scan (OWASP Top 10)
    issues.push(...await this.runSecurityScan(code));

    // Best practices check
    issues.push(...await this.checkBestPractices(code, context.standards));

    const result: CodeReviewResult = {
      summary: this.generateSummary(issues),
      issues,
      suggestions: this.generateSuggestions(issues),
      metrics: {
        complexity: await this.calculateComplexity(code),
        maintainability: await this.calculateMaintainability(code),
        testability: await this.calculateTestability(code),
      },
    };

    await this.executePostTaskHook(`review-${Date.now()}`);
    return result;
  }

  async securityAudit(files: string[]): Promise<SecurityAuditResult> {
    // OWASP Top 10 vulnerability scanning
  }
}
```

### CoordinatorAgent

**File**: `src/agents/coordinator-agent.ts`

```typescript
export class CoordinatorAgent extends BaseAgent {
  readonly type = AgentType.COORDINATOR;
  readonly capabilities = [
    'orchestrate',
    'delegate',
    'agent_spawn',
    'task_distribution',
    'progress_tracking',
  ];

  private agentRegistry: AgentRegistry;
  private taskQueue: TaskQueue;

  async orchestrateWorkflow(workflow: WorkflowDefinition): Promise<WorkflowResult> {
    await this.executePreTaskHook(`Orchestrating workflow: ${workflow.name}`);

    // Topological sort of steps based on dependencies
    const sortedSteps = this.topologicalSort(workflow.steps, workflow.dependencies);

    // Execute steps (parallel or sequential based on workflow.parallel)
    const results: StepResult[] = [];

    if (workflow.parallel) {
      results.push(...await this.executeParallel(sortedSteps));
    } else {
      results.push(...await this.executeSequential(sortedSteps));
    }

    await this.executePostTaskHook(`workflow-${workflow.id}`);
    return { workflowId: workflow.id, steps: results, success: results.every(r => r.success) };
  }

  async delegateTask(task: Task): Promise<string> {
    // Find most suitable agent based on capabilities
    const candidates = this.agentRegistry.findByCapabilities(task.requiredCapabilities);
    const selectedAgent = this.selectBestAgent(candidates, task);

    await this.taskQueue.enqueue(task, selectedAgent.id);
    return selectedAgent.id;
  }
}
```

### OptimizerAgent

**File**: `src/agents/optimizer-agent.ts`

```typescript
export class OptimizerAgent extends BaseAgent {
  readonly type = AgentType.OPTIMIZER;
  readonly capabilities = [
    'performance_tuning',
    'memory_optimization',
    'query_optimization',
    'caching_strategy',
    'benchmark',
  ];

  async optimizePerformance(code: string): Promise<OptimizationResult> {
    // Analyze code for performance patterns
    // Suggest loop optimizations, caching, memoization
  }

  async optimizeQueries(queries: string[]): Promise<QueryOptimizationResult[]> {
    // Analyze SQL/GraphQL queries for N+1, missing indexes, etc.
  }

  async runBenchmark(suite: string, iterations: number): Promise<BenchmarkResult> {
    // Execute performance benchmarks and report metrics
  }
}
```

### DocumenterAgent

**File**: `src/agents/documenter-agent.ts`

```typescript
export class DocumenterAgent extends BaseAgent {
  readonly type = AgentType.DOCUMENTER;
  readonly capabilities = [
    'api_docs',
    'user_guides',
    'architecture_docs',
    'changelog_generation',
    'format',
  ];

  async generateApiDocs(files: string[], format: 'markdown' | 'openapi' | 'typedoc'): Promise<DocumentationResult> {
    // Parse source files and generate API documentation
  }

  async generateChangelog(fromTag: string, toTag: string): Promise<ChangelogResult> {
    // Parse git commits and generate structured changelog
  }
}
```

### PlannerAgent

**File**: `src/agents/planner-agent.ts`

```typescript
export class PlannerAgent extends BaseAgent {
  readonly type = AgentType.PLANNER;
  readonly capabilities = [
    'task_decomposition',
    'dependency_analysis',
    'resource_allocation',
    'timeline_estimation',
    'risk_assessment',
  ];

  async decomposeTask(task: string): Promise<TaskDecomposition> {
    // Break complex task into hierarchical subtasks
  }

  async analyzeDependencies(tasks: Task[]): Promise<DependencyGraph> {
    // Build DAG of task dependencies
  }

  async estimateTimeline(tasks: TaskDecomposition): Promise<TimelineEstimate> {
    // PERT-style estimation with optimistic/pessimistic ranges
  }

  async assessRisks(plan: ExecutionPlan): Promise<RiskAssessment> {
    // Identify blockers, dependencies on unavailable resources, etc.
  }
}
```

### Registry Registration

Update `src/agents/index.ts`:

```typescript
import { ReviewerAgent } from './reviewer-agent.js';
import { CoordinatorAgent } from './coordinator-agent.js';
import { OptimizerAgent } from './optimizer-agent.js';
import { DocumenterAgent } from './documenter-agent.js';
import { PlannerAgent } from './planner-agent.js';

registry.register(AgentType.REVIEWER, (config) => new ReviewerAgent(config));
registry.register(AgentType.COORDINATOR, (config) => new CoordinatorAgent(config));
registry.register(AgentType.OPTIMIZER, (config) => new OptimizerAgent(config));
registry.register(AgentType.DOCUMENTER, (config) => new DocumenterAgent(config));
registry.register(AgentType.PLANNER, (config) => new PlannerAgent(config));
```

## Testing Requirements

1. **Unit Tests**: Each agent method tested in isolation
2. **Integration Tests**: Agent interaction with knowledge graph
3. **Coordination Tests**: Multi-agent workflow execution
4. **Coverage Target**: 90%+ for all agent classes

## Success Metrics

| Metric | Target |
|--------|--------|
| Agent spawn time | < 100ms |
| Task execution error rate | < 5% |
| Multi-agent workflow completion | > 95% |
| Documentation generation accuracy | > 90% |

## References

- SPEC-002-MISSING-AGENTS.md (Original specification)
- GAP-002 in FEATURE-GAP-ANALYSIS.md
- BaseAgent implementation in `src/agents/base-agent.ts`
- AgentRegistry implementation in `src/agents/registry.ts`
