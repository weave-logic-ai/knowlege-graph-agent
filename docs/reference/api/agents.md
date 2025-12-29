# Agents API

Specialized agents for research, analysis, architecture, and testing with the Knowledge Graph Agent.

**Module:** `@weave-nn/knowledge-graph-agent/agents`

---

## Table of Contents

- [BaseAgent](#baseagent)
- [ResearcherAgent](#researcheragent)
- [AnalystAgent](#analystagent)
- [ArchitectAgent](#architectagent)
- [TesterAgent](#testeragent)
- [RulesEngine](#rulesengine)
- [Types](#types)
- [Helper Functions](#helper-functions)

---

## BaseAgent

Abstract base class for all agents providing common functionality including task execution, input validation, output formatting, error handling, and optional claude-flow integration.

### Constructor

```typescript
constructor(config: AgentConfig)
```

**Parameters:**

```typescript
interface AgentConfig {
  id?: string;
  name: string;
  type: AgentType;
  capabilities?: string[];
  taskTimeout?: number;

  retry?: {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier?: number;
  };

  claudeFlow?: {
    enabled: boolean;
    namespace?: string;
    hooks?: {
      preTask?: boolean;
      postTask?: boolean;
      postEdit?: boolean;
    };
  };
}
```

### Properties

#### config

Agent configuration (readonly).

```typescript
readonly config: AgentConfig
```

#### state

Current agent state.

```typescript
get state(): AgentState
```

```typescript
interface AgentState {
  id: string;
  status: AgentStatus;
  taskQueue: string[];
  completedTasks: string[];
  currentTask?: AgentTask;
  lastActivity: Date;
  errorCount: number;
}
```

### Task Execution

#### execute

Execute a task with full lifecycle management.

```typescript
async execute(task: AgentTask): Promise<AgentResult>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `task` | `AgentTask` | Task to execute |

**Returns:** `Promise<AgentResult>`

**Example:**

```typescript
import { createTask } from '@weave-nn/knowledge-graph-agent/agents';

const task = createTask('Analyze codebase patterns', {
  priority: TaskPriority.HIGH,
  timeout: 30000,
});

const result = await agent.execute(task);

if (result.success) {
  console.log('Task completed:', result.data);
} else {
  console.error('Task failed:', result.error?.message);
}
```

#### executeTask (abstract)

Abstract method implemented by subclasses for task-specific logic.

```typescript
protected abstract executeTask(task: AgentTask): Promise<AgentResult>
```

### Input Validation

#### validateInput

Validate task input before execution.

```typescript
async validateInput(task: AgentTask): Promise<{ valid: boolean; error?: string }>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `task` | `AgentTask` | Task to validate |

**Returns:** `Promise<{ valid: boolean; error?: string }>`

### Output Formatting

#### formatOutput

Format successful output into an AgentResult.

```typescript
formatOutput<T>(data: T, artifacts?: ResultArtifact[]): AgentResult<T>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `data` | `T` | Result data |
| `artifacts` | `ResultArtifact[]` | Optional artifacts |

**Returns:** `AgentResult<T>`

### Lifecycle Methods

#### getStatus

Get current agent status.

```typescript
getStatus(): AgentStatus
```

**Returns:** `AgentStatus`

#### pause

Pause the agent.

```typescript
async pause(): Promise<void>
```

#### resume

Resume a paused agent.

```typescript
async resume(): Promise<void>
```

#### terminate

Terminate the agent.

```typescript
async terminate(): Promise<void>
```

### Messaging

#### sendMessage

Send a message to another agent.

```typescript
async sendMessage(message: AgentMessage): Promise<void>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | `AgentMessage` | Message to send |

#### receiveMessage

Receive and process a message.

```typescript
async receiveMessage(message: AgentMessage): Promise<void>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `message` | `AgentMessage` | Message to process |

### Trajectory Tracking

#### setTrajectoryTracker

Set the trajectory tracker for learning.

```typescript
setTrajectoryTracker(tracker: TrajectoryTracker): void
```

#### setAutoTrackTrajectories

Enable or disable auto-tracking.

```typescript
setAutoTrackTrajectories(enabled: boolean): void
```

#### isTrackingTrajectory

Check if trajectory tracking is active.

```typescript
isTrackingTrajectory(): boolean
```

**Returns:** `boolean`

#### getTrajectoryProgress

Get current trajectory progress.

```typescript
getTrajectoryProgress(): { stepCount: number; duration: number; lastStep?: TrajectoryStep } | null
```

---

## ResearcherAgent

Specialized agent for code research, pattern detection, and reference finding.

### Constructor

```typescript
constructor(config: AgentConfig)
```

**Example:**

```typescript
import { ResearcherAgent, AgentType } from '@weave-nn/knowledge-graph-agent/agents';

const researcher = new ResearcherAgent({
  name: 'code-researcher',
  type: AgentType.RESEARCHER,
  capabilities: ['research', 'pattern-detection', 'code-analysis'],
});
```

### Methods

#### setKnowledgeGraph

Set the knowledge graph for context.

```typescript
setKnowledgeGraph(graph: KnowledgeGraphManager): void
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `graph` | `KnowledgeGraphManager` | Knowledge graph instance |

#### research

Perform research based on a query.

```typescript
async research(query: ResearchQuery): Promise<ResearchResultData>
```

**Parameters:**

```typescript
interface ResearchQuery {
  type: ResearchQueryType;
  query: string;
  scope?: string[];
  maxResults?: number;
  includeContext?: boolean;
}

type ResearchQueryType =
  | 'pattern'
  | 'reference'
  | 'implementation'
  | 'usage'
  | 'similar'
  | 'related';
```

**Returns:** `Promise<ResearchResultData>`

```typescript
interface ResearchResultData {
  findings: ResearchFinding[];
  patterns: DetectedPattern[];
  references: CodeReference[];
  summary: string;
  confidence: number;
}
```

**Example:**

```typescript
const results = await researcher.research({
  type: 'pattern',
  query: 'authentication middleware',
  scope: ['src/'],
  maxResults: 20,
  includeContext: true,
});

for (const finding of results.findings) {
  console.log(`${finding.title}: ${finding.description}`);
}
```

#### analyzePatterns

Analyze patterns in code or documentation.

```typescript
async analyzePatterns(content: string, options?: PatternOptions): Promise<DetectedPattern[]>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `content` | `string` | Content to analyze |
| `options` | `PatternOptions` | Analysis options |

**Returns:** `Promise<DetectedPattern[]>`

```typescript
interface DetectedPattern {
  name: string;
  type: string;
  occurrences: number;
  locations: string[];
  confidence: number;
  description: string;
}
```

#### findReferences

Find code references for a target.

```typescript
async findReferences(target: string, options?: ReferenceOptions): Promise<CodeReference[]>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `target` | `string` | Reference target |
| `options` | `ReferenceOptions` | Search options |

**Returns:** `Promise<CodeReference[]>`

```typescript
interface CodeReference {
  file: string;
  line: number;
  column: number;
  context: string;
  type: 'import' | 'usage' | 'definition' | 'export';
}
```

#### summarizeFindings

Generate a summary of research findings.

```typescript
async summarizeFindings(findings: ResearchFinding[]): Promise<string>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `findings` | `ResearchFinding[]` | Findings to summarize |

**Returns:** `Promise<string>`

---

## AnalystAgent

Specialized agent for code quality analysis, metrics calculation, and issue detection.

### Constructor

```typescript
constructor(config: AgentConfig)
```

**Example:**

```typescript
import { AnalystAgent, AgentType } from '@weave-nn/knowledge-graph-agent/agents';

const analyst = new AnalystAgent({
  name: 'code-analyst',
  type: AgentType.ANALYST,
  capabilities: ['code-analysis', 'quality-assessment', 'metrics'],
});
```

### Methods

#### setKnowledgeGraph

Set the knowledge graph for context.

```typescript
setKnowledgeGraph(graph: KnowledgeGraphManager): void
```

#### analyzeCode

Analyze code for quality and issues.

```typescript
async analyzeCode(filePath: string, content: string): Promise<FileAnalysis>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `filePath` | `string` | File path |
| `content` | `string` | File content |

**Returns:** `Promise<FileAnalysis>`

```typescript
interface FileAnalysis {
  path: string;
  metrics: CodeMetrics;
  quality: QualityAssessment;
  issues: QualityIssue[];
  suggestions: string[];
}
```

#### calculateCodeMetrics

Calculate code metrics for a file.

```typescript
async calculateCodeMetrics(content: string, language?: string): Promise<CodeMetrics>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `content` | `string` | File content |
| `language` | `string` | Programming language |

**Returns:** `Promise<CodeMetrics>`

```typescript
interface CodeMetrics {
  lines: number;
  linesOfCode: number;
  blankLines: number;
  commentLines: number;
  functions: number;
  classes: number;
  complexity: number;
  maintainabilityIndex: number;
}
```

**Example:**

```typescript
const content = await fs.readFile('src/auth.ts', 'utf-8');
const metrics = await analyst.calculateCodeMetrics(content, 'typescript');

console.log(`Lines of code: ${metrics.linesOfCode}`);
console.log(`Complexity: ${metrics.complexity}`);
console.log(`Maintainability: ${metrics.maintainabilityIndex}`);
```

#### assessQuality

Assess overall code quality.

```typescript
async assessQuality(analysis: FileAnalysis): Promise<QualityAssessment>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `analysis` | `FileAnalysis` | File analysis |

**Returns:** `Promise<QualityAssessment>`

```typescript
interface QualityAssessment {
  score: number;          // 0-100
  grade: string;          // A, B, C, D, F
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}
```

#### findIssues

Find quality issues in code.

```typescript
async findIssues(content: string, options?: IssueOptions): Promise<QualityIssue[]>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `content` | `string` | Code content |
| `options` | `IssueOptions` | Issue detection options |

**Returns:** `Promise<QualityIssue[]>`

```typescript
interface QualityIssue {
  type: 'error' | 'warning' | 'info' | 'style';
  severity: 'critical' | 'major' | 'minor' | 'trivial';
  message: string;
  line?: number;
  column?: number;
  rule?: string;
  suggestion?: string;
}
```

#### analyzeProject

Analyze an entire project.

```typescript
async analyzeProject(projectPath: string, options?: ProjectOptions): Promise<ProjectAnalysis>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectPath` | `string` | Project root path |
| `options` | `ProjectOptions` | Analysis options |

**Returns:** `Promise<ProjectAnalysis>`

```typescript
interface ProjectAnalysis {
  files: FileAnalysis[];
  summary: {
    totalFiles: number;
    totalLines: number;
    averageComplexity: number;
    averageQuality: number;
    issueCount: number;
  };
  hotspots: string[];
  recommendations: string[];
}
```

---

## ArchitectAgent

Specialized agent for architecture analysis, design suggestions, and dependency mapping.

### Constructor

```typescript
constructor(config: AgentConfig)
```

**Example:**

```typescript
import { ArchitectAgent, AgentType } from '@weave-nn/knowledge-graph-agent/agents';

const architect = new ArchitectAgent({
  name: 'system-architect',
  type: AgentType.ARCHITECT,
  capabilities: ['architecture-analysis', 'design', 'dependency-mapping'],
});
```

### Methods

#### setKnowledgeGraph

Set the knowledge graph for context.

```typescript
setKnowledgeGraph(graph: KnowledgeGraphManager): void
```

#### analyzeArchitecture

Analyze system architecture.

```typescript
async analyzeArchitecture(projectPath: string, options?: ArchitectureOptions): Promise<ArchitectureAnalysis>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectPath` | `string` | Project root path |
| `options` | `ArchitectureOptions` | Analysis options |

**Returns:** `Promise<ArchitectureAnalysis>`

```typescript
interface ArchitectureAnalysis {
  components: ArchitectureComponent[];
  layers: ArchitectureLayer[];
  patterns: ArchitecturePattern[];
  dependencies: DependencyAnalysis;
  decisions: DesignDecision[];
  suggestions: DesignSuggestion[];
}
```

**Example:**

```typescript
const analysis = await architect.analyzeArchitecture('/path/to/project', {
  includeTests: false,
  maxDepth: 5,
});

console.log('Detected patterns:');
for (const pattern of analysis.patterns) {
  console.log(`  ${pattern.name}: ${pattern.description}`);
}
```

#### suggestDesign

Get design suggestions for requirements.

```typescript
async suggestDesign(requirements: string[], context?: DesignContext): Promise<DesignSuggestion[]>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `requirements` | `string[]` | Design requirements |
| `context` | `DesignContext` | Design context |

**Returns:** `Promise<DesignSuggestion[]>`

```typescript
interface DesignSuggestion {
  title: string;
  description: string;
  pattern: ArchitecturePattern;
  rationale: string;
  tradeoffs: {
    pros: string[];
    cons: string[];
  };
  implementation: string;
  priority: 'high' | 'medium' | 'low';
}
```

#### mapDependencies

Map project dependencies.

```typescript
async mapDependencies(projectPath: string, options?: DependencyOptions): Promise<DependencyAnalysis>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectPath` | `string` | Project root path |
| `options` | `DependencyOptions` | Mapping options |

**Returns:** `Promise<DependencyAnalysis>`

```typescript
interface DependencyAnalysis {
  nodes: DependencyNode[];
  edges: Array<{ from: string; to: string; type: string }>;
  cycles: string[][];
  orphans: string[];
  metrics: {
    totalDependencies: number;
    directDependencies: number;
    transitiveDependencies: number;
    maxDepth: number;
  };
}

interface DependencyNode {
  id: string;
  name: string;
  type: ComponentType;
  inDegree: number;
  outDegree: number;
  layer?: string;
}
```

### Types

```typescript
type ArchitecturePattern =
  | 'layered'
  | 'microservices'
  | 'event-driven'
  | 'hexagonal'
  | 'clean'
  | 'mvc'
  | 'mvvm'
  | 'repository'
  | 'factory'
  | 'singleton'
  | 'observer';

type ComponentType =
  | 'module'
  | 'class'
  | 'function'
  | 'service'
  | 'controller'
  | 'repository'
  | 'utility'
  | 'config'
  | 'test';

interface ArchitectureComponent {
  id: string;
  name: string;
  type: ComponentType;
  path: string;
  responsibilities: string[];
  dependencies: string[];
  dependents: string[];
}

interface ArchitectureLayer {
  name: string;
  components: string[];
  allowedDependencies: string[];
  violations: string[];
}

interface DesignDecision {
  id: string;
  title: string;
  description: string;
  rationale: string;
  alternatives: string[];
  consequences: string[];
  status: 'proposed' | 'accepted' | 'deprecated' | 'superseded';
}
```

---

## TesterAgent

Specialized agent for test generation, coverage analysis, and test suggestions.

### Constructor

```typescript
constructor(config: AgentConfig)
```

**Example:**

```typescript
import { TesterAgent, AgentType } from '@weave-nn/knowledge-graph-agent/agents';

const tester = new TesterAgent({
  name: 'test-generator',
  type: AgentType.TESTER,
  capabilities: ['test-generation', 'coverage-analysis', 'test-suggestions'],
});
```

### Methods

#### generateTests

Generate tests for code.

```typescript
async generateTests(request: TestGenerationRequest): Promise<GeneratedTestSuite>
```

**Parameters:**

```typescript
interface TestGenerationRequest {
  targetPath: string;
  targetContent?: string;
  framework?: TestFramework;
  testTypes?: TestType[];
  coverage?: {
    minimum: number;
    targetLines?: number[];
  };
  options?: {
    includeEdgeCases?: boolean;
    includeMocks?: boolean;
    style?: 'bdd' | 'tdd' | 'classic';
  };
}

type TestFramework = 'jest' | 'mocha' | 'vitest' | 'pytest' | 'unittest' | 'rspec';

type TestType = 'unit' | 'integration' | 'e2e' | 'snapshot' | 'performance';
```

**Returns:** `Promise<GeneratedTestSuite>`

```typescript
interface GeneratedTestSuite {
  targetPath: string;
  testPath: string;
  framework: TestFramework;
  tests: TestCase[];
  imports: string[];
  setup?: string;
  teardown?: string;
  coverage: {
    estimated: number;
    lines: number[];
  };
}

interface TestCase {
  name: string;
  description: string;
  type: TestType;
  code: string;
  assertions: string[];
  mocks?: string[];
  tags?: string[];
}
```

**Example:**

```typescript
const suite = await tester.generateTests({
  targetPath: 'src/auth/login.ts',
  framework: 'jest',
  testTypes: ['unit', 'integration'],
  options: {
    includeEdgeCases: true,
    includeMocks: true,
    style: 'bdd',
  },
});

console.log(`Generated ${suite.tests.length} test cases`);
console.log(`Estimated coverage: ${suite.coverage.estimated}%`);
```

#### analyzeTestCoverage

Analyze test coverage.

```typescript
async analyzeTestCoverage(projectPath: string, options?: CoverageOptions): Promise<CoverageAnalysis>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `projectPath` | `string` | Project root path |
| `options` | `CoverageOptions` | Analysis options |

**Returns:** `Promise<CoverageAnalysis>`

```typescript
interface CoverageAnalysis {
  summary: CoverageMetrics;
  files: Array<{
    path: string;
    metrics: CoverageMetrics;
    uncoveredLines: number[];
    gaps: CoverageGap[];
  }>;
  gaps: CoverageGap[];
  recommendations: string[];
}

interface CoverageMetrics {
  lines: number;
  statements: number;
  branches: number;
  functions: number;
}

interface CoverageGap {
  file: string;
  startLine: number;
  endLine: number;
  type: 'function' | 'branch' | 'statement';
  description: string;
  priority: 'high' | 'medium' | 'low';
}
```

#### suggestTestCases

Suggest additional test cases.

```typescript
async suggestTestCases(analysis: CoverageAnalysis): Promise<TestSuggestion[]>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `analysis` | `CoverageAnalysis` | Coverage analysis |

**Returns:** `Promise<TestSuggestion[]>`

```typescript
interface TestSuggestion {
  target: string;
  type: TestType;
  description: string;
  rationale: string;
  priority: 'high' | 'medium' | 'low';
  estimatedImpact: number;
  example?: string;
}
```

---

## RulesEngine

Event-driven rule execution engine with async processing, condition evaluation, and performance tracking.

### Constructor

```typescript
constructor(config?: RulesEngineConfig)
```

**Parameters:**

```typescript
interface RulesEngineConfig {
  maxConcurrency?: number;    // Default: 10
  defaultTimeout?: number;    // Default: 30000
  logBufferSize?: number;     // Default: 1000
  verbose?: boolean;          // Default: false
  logger?: Logger;
}
```

**Example:**

```typescript
import { RulesEngine } from '@weave-nn/knowledge-graph-agent/agents';

const engine = new RulesEngine({
  maxConcurrency: 5,
  defaultTimeout: 60000,
  verbose: true,
});
```

### Rule Management

#### registerRule

Register a new rule.

```typescript
registerRule(rule: AgentRule): void
```

**Parameters:**

```typescript
interface AgentRule {
  id: string;
  name: string;
  description?: string;
  triggers: RuleTrigger[];
  condition?: RuleCondition;
  action: RuleAction;
  priority?: RulePriority;
  enabled?: boolean;
  tags?: string[];
  timeout?: number;
  continueOnFailure?: boolean;
}

type RuleTrigger =
  | 'file:add'
  | 'file:change'
  | 'file:unlink'
  | 'graph:update'
  | 'agent:complete'
  | 'manual';

type RulePriority = 'low' | 'normal' | 'high' | 'critical';

type RuleCondition = (context: RuleContext) => boolean | Promise<boolean>;
type RuleAction = (context: RuleContext) => void | Promise<void>;
```

**Example:**

```typescript
engine.registerRule({
  id: 'auto-update-graph',
  name: 'Auto Update Graph',
  triggers: ['file:change'],
  condition: (ctx) => ctx.filePath?.endsWith('.md') ?? false,
  action: async (ctx) => {
    console.log(`Updating graph for: ${ctx.filePath}`);
    // Update graph logic
  },
  priority: 'high',
});
```

#### registerRules

Register multiple rules.

```typescript
registerRules(rules: AgentRule[]): void
```

#### unregisterRule

Unregister a rule.

```typescript
unregisterRule(ruleId: string): boolean
```

**Returns:** `boolean` - `true` if rule was found and removed

#### getRule

Get a rule by ID.

```typescript
getRule(ruleId: string): AgentRule | undefined
```

#### getAllRules

Get all registered rules.

```typescript
getAllRules(): AgentRule[]
```

#### getRulesByTrigger

Get rules for a specific trigger.

```typescript
getRulesByTrigger(trigger: RuleTrigger): AgentRule[]
```

#### enableRule / disableRule

Enable or disable a rule.

```typescript
enableRule(ruleId: string): boolean
disableRule(ruleId: string): boolean
```

### Rule Execution

#### trigger

Trigger rule execution for an event.

```typescript
async trigger(trigger: RuleTrigger, context?: Partial<RuleContext>): Promise<RuleExecutionLog[]>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `trigger` | `RuleTrigger` | Trigger type |
| `context` | `Partial<RuleContext>` | Execution context |

**Returns:** `Promise<RuleExecutionLog[]>`

**Example:**

```typescript
const logs = await engine.trigger('file:change', {
  filePath: 'docs/api.md',
  currentContent: '# API Documentation...',
});

for (const log of logs) {
  console.log(`${log.ruleName}: ${log.status} (${log.duration}ms)`);
}
```

#### executeRuleById

Execute a specific rule.

```typescript
async executeRuleById(ruleId: string, context?: Partial<RuleContext>): Promise<RuleExecutionLog | null>
```

### Statistics

#### getRuleStatistics

Get statistics for a specific rule.

```typescript
getRuleStatistics(ruleId: string): RuleStatistics | undefined
```

**Returns:** `RuleStatistics | undefined`

```typescript
interface RuleStatistics {
  ruleId: string;
  ruleName: string;
  totalExecutions: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  averageExecutionTime: number;
  minExecutionTime: number;
  maxExecutionTime: number;
  lastExecutedAt?: Date;
  lastSuccessAt?: Date;
  lastFailureAt?: Date;
}
```

#### getStatistics

Get engine-wide statistics.

```typescript
getStatistics(): EngineStatistics
```

**Returns:** `EngineStatistics`

```typescript
interface EngineStatistics {
  totalRules: number;
  enabledRules: number;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  activeExecutions: number;
  ruleStats: Map<string, RuleStatistics>;
  triggerStats: Map<RuleTrigger, {
    totalExecutions: number;
    successCount: number;
    averageTime: number;
  }>;
}
```

### Execution Logs

#### getExecutionLogs

Get execution logs.

```typescript
getExecutionLogs(limit?: number): RuleExecutionLog[]
```

#### getLogsForRule

Get logs for a specific rule.

```typescript
getLogsForRule(ruleId: string, limit?: number): RuleExecutionLog[]
```

#### getLogsForTrigger

Get logs for a specific trigger.

```typescript
getLogsForTrigger(trigger: RuleTrigger, limit?: number): RuleExecutionLog[]
```

#### getFailedLogs

Get failed execution logs.

```typescript
getFailedLogs(limit?: number): RuleExecutionLog[]
```

#### clearLogs

Clear execution logs.

```typescript
clearLogs(): void
```

### Utilities

#### resetStatistics

Reset all statistics.

```typescript
resetStatistics(): void
```

#### getSummary

Get engine summary.

```typescript
getSummary(): {
  rulesCount: number;
  enabledCount: number;
  triggersConfigured: RuleTrigger[];
  activeExecutions: number;
  logsCount: number;
}
```

---

## Types

### AgentTask

```typescript
interface AgentTask {
  id: string;
  description: string;
  priority: TaskPriority;
  input: Record<string, unknown>;
  expectedOutput?: Record<string, unknown>;
  dependencies?: string[];
  timeout?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  deadline?: Date;
}
```

### AgentResult

```typescript
interface AgentResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: AgentError;
  artifacts?: ResultArtifact[];
  metrics?: ExecutionMetrics;
  metadata?: Record<string, unknown>;
}
```

### AgentError

```typescript
interface AgentError {
  code: string;
  message: string;
  stack?: string;
  retryable?: boolean;
}
```

### ExecutionMetrics

```typescript
interface ExecutionMetrics {
  startTime: Date;
  endTime: Date;
  durationMs: number;
  memoryUsage?: number;
  retries: number;
}
```

### ResultArtifact

```typescript
interface ResultArtifact {
  type: string;
  name: string;
  content: unknown;
  path?: string;
}
```

### AgentStatus

```typescript
enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  TERMINATED = 'terminated',
}
```

### AgentType

```typescript
enum AgentType {
  RESEARCHER = 'researcher',
  ANALYST = 'analyst',
  ARCHITECT = 'architect',
  TESTER = 'tester',
  CODER = 'coder',
  REVIEWER = 'reviewer',
  COORDINATOR = 'coordinator',
  OPTIMIZER = 'optimizer',
  DOCUMENTER = 'documenter',
}
```

### TaskPriority

```typescript
enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}
```

### RuleContext

```typescript
interface RuleContext {
  trigger: RuleTrigger;
  timestamp: Date;
  filePath?: string;
  previousContent?: string;
  currentContent?: string;
  graphData?: {
    nodesAdded?: number;
    nodesRemoved?: number;
    edgesModified?: number;
  };
  agentData?: {
    agentId: string;
    taskId: string;
    result: 'success' | 'failure';
    duration: number;
  };
  metadata?: Record<string, unknown>;
  engine?: RulesEngine;
}
```

---

## Helper Functions

### createTask

Create a task with defaults.

```typescript
function createTask(
  description: string,
  options?: Partial<Omit<AgentTask, 'id' | 'description' | 'createdAt'>>
): AgentTask
```

**Example:**

```typescript
const task = createTask('Analyze authentication module', {
  priority: TaskPriority.HIGH,
  timeout: 30000,
  input: { targetPath: 'src/auth/' },
});
```

### isAgentResult

Type guard for AgentResult.

```typescript
function isAgentResult(obj: unknown): obj is AgentResult
```

### isAgentError

Type guard for AgentError.

```typescript
function isAgentError(obj: unknown): obj is AgentError
```

### createRulesEngine

Create a new rules engine.

```typescript
function createRulesEngine(config?: RulesEngineConfig): RulesEngine
```

### createRule

Create a simple rule definition.

```typescript
function createRule(
  id: string,
  name: string,
  triggers: RuleTrigger[],
  action: RuleAction,
  options?: Partial<Omit<AgentRule, 'id' | 'name' | 'triggers' | 'action'>>
): AgentRule
```

### createConditionalRule

Create a conditional rule.

```typescript
function createConditionalRule(
  id: string,
  name: string,
  triggers: RuleTrigger[],
  condition: RuleCondition,
  action: RuleAction,
  options?: Partial<Omit<AgentRule, 'id' | 'name' | 'triggers' | 'condition' | 'action'>>
): AgentRule
```

---

## See Also

- [API Overview](./index.md)
- [Core Module API](./core.md)
- [Graph Operations](./graph.md)
