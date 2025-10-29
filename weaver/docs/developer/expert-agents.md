# Expert Agent System

Complete guide to the 7-agent specialized system in Weaver.

## Overview

The Expert Agent System provides specialized AI agents for different software development tasks. Each agent has unique capabilities and can be coordinated for complex multi-agent workflows.

## Available Agents

### 1. Researcher Agent (`researcher-agent.ts`)

**Capabilities:**
- arXiv paper search and retrieval
- Academic paper analysis
- Research trend identification
- Cross-paper synthesis
- RDR (Reflect-Decide-Respond) framework integration

**Example Usage:**

```typescript
import { ResearcherAgent } from './agents/researcher-agent.js';

const researcher = new ResearcherAgent({ claudeClient });

// Search for papers
const papers = await researcher.searchArxiv('neural networks', {
  maxResults: 10,
  categories: ['cs.AI', 'cs.LG'],
  startDate: new Date('2024-01-01'),
});

// Analyze a specific paper
const analysis = await researcher.analyzePaper('2510.20809');
console.log(analysis.keyInsights);
console.log(analysis.methodology);

// Find trends in a domain
const trends = await researcher.findTrends('machine learning', {
  timeWindow: 'year',
});

// Synthesize findings across papers
const synthesis = await researcher.synthesizeFindings([
  '2510.20809',
  '2403.12345',
]);
console.log(synthesis.commonThemes);
console.log(synthesis.researchGaps);
```

### 2. Coder Agent (`coder-agent.ts`)

**Capabilities:**
- TDD-based code generation
- Intelligent refactoring
- Performance optimization
- Automated test generation
- Multi-language support

**Example Usage:**

```typescript
import { CoderAgent } from './agents/coder-agent.js';

const coder = new CoderAgent({ claudeClient });

// Generate code from specification
const spec = {
  description: 'Calculate fibonacci numbers',
  inputs: [
    { name: 'n', type: 'number', description: 'Position in sequence' },
  ],
  outputs: [
    { name: 'result', type: 'number', description: 'Fibonacci number' },
  ],
  requirements: [
    'Must be efficient for large n',
    'Handle edge cases (n <= 0)',
  ],
};

const generated = await coder.generateCode(spec, 'typescript');
console.log(generated.code);
console.log(generated.tests);

// Refactor existing code
const refactored = await coder.refactorCode(
  '/path/to/file.ts',
  'extract-method'
);

// Optimize performance
const optimized = await coder.optimizePerformance('/path/to/slow.ts');
console.log(optimized.improvements);

// Add tests to existing code
const tests = await coder.addTests('/path/to/file.ts', {
  coverage: 'comprehensive',
  includeEdgeCases: true,
  includeMocks: true,
});
```

### 3. Architect Agent (`architect-agent.ts`)

**Capabilities:**
- High-level system architecture design
- Design pattern selection
- API design (REST, GraphQL, gRPC)
- Architecture review and assessment
- Technology stack recommendations

**Example Usage:**

```typescript
import { ArchitectAgent } from './agents/architect-agent.js';

const architect = new ArchitectAgent({ claudeClient });

// Design system architecture
const requirements = {
  description: 'E-commerce platform',
  functionalRequirements: [
    'User authentication',
    'Product catalog',
    'Shopping cart',
    'Payment processing',
  ],
  nonFunctionalRequirements: {
    scalability: 'Handle 10k concurrent users',
    performance: 'Response time < 200ms',
    security: 'PCI DSS compliant',
  },
  constraints: ['Budget: $50k', 'Timeline: 6 months'],
  stakeholders: ['Business', 'Engineering', 'Security'],
};

const design = await architect.designSystem(requirements);
console.log(design.components);
console.log(design.technologies);
console.log(design.patterns);

// Select design patterns
const patterns = await architect.selectPatterns(
  'Need to decouple UI from business logic'
);

// Design API
const api = await architect.designAPI(
  ['User management', 'Product search', 'Order processing'],
  'REST'
);

// Review existing architecture
const review = await architect.reviewArchitecture('/path/to/project');
console.log(`Score: ${review.score}/100`);
console.log(review.recommendations);
```

### 4. Tester Agent (`tester-agent.ts`)

**Capabilities:**
- Automated test generation (unit, integration, e2e)
- Test coverage analysis
- Edge case identification
- Test data generation
- Property-based testing

**Example Usage:**

```typescript
import { TesterAgent } from './agents/tester-agent.js';

const tester = new TesterAgent({ claudeClient });

// Generate tests
const tests = await tester.generateTests(
  '/path/to/code.ts',
  'unit',
  'vitest'
);
console.log(tests.tests);
console.log(tests.coverage);

// Validate test coverage
const coverage = await tester.validateTestCoverage('/project');
console.log(`Overall: ${coverage.overallCoverage.statements}%`);
console.log(coverage.gaps);

// Find edge cases
const edgeCases = await tester.findEdgeCases({
  function: 'processPayment',
  inputTypes: ['PaymentInfo', 'number'],
  constraints: ['amount > 0', 'valid card'],
  expectedBehavior: 'Process or reject payment',
});

// Generate test data
const testData = await tester.generateTestData(
  {
    fields: [
      { name: 'id', type: 'string' },
      { name: 'email', type: 'string', constraints: ['valid email'] },
      { name: 'age', type: 'number', constraints: ['18-120'] },
    ],
  },
  100
);
```

### 5. Analyst Agent (`analyst-agent.ts`)

**Capabilities:**
- Comprehensive code review
- Quality metrics calculation
- Security vulnerability scanning
- Best practice compliance
- Technical debt assessment

**Example Usage:**

```typescript
import { AnalystAgent } from './agents/analyst-agent.js';

const analyst = new AnalystAgent({ claudeClient });

// Review code
const review = await analyst.reviewCode(
  '/path/to/file.ts',
  ['security', 'performance', 'maintainability']
);
console.log(`Score: ${review.overallScore}/100`);
console.log(review.findings);
console.log(review.complexity);

// Calculate quality metrics
const metrics = await analyst.calculateMetrics('/project');
console.log(`Maintainability: ${metrics.codeQuality.maintainabilityIndex}`);
console.log(`Tech Debt: ${metrics.codeQuality.technicalDebt.hours}h`);
console.log(metrics.codeSmells);

// Scan for security issues
const security = await analyst.scanSecurity('/path/to/file.ts');
console.log(`Risk Score: ${security.riskScore}/100`);
console.log(security.vulnerabilities);

// Get improvement suggestions
const suggestions = await analyst.suggestImprovements({
  codeReview: review,
  metrics: metrics,
  security: security,
});
console.log(suggestions);
```

### 6. Planning Expert (`planning-expert.ts`)

**Capabilities:**
- Goal decomposition
- Strategic planning
- Experience-based learning
- Chain-of-Thought reasoning
- Risk identification

**Example Usage:**

```typescript
import { PlanningExpert } from './agents/planning-expert.js';

const planner = new PlanningExpert();

const plan = await planner.createPlan(
  'Build a production-ready API',
  ['Must complete in 2 weeks', 'Team of 2 developers'],
  'backend'
);

console.log(plan.steps);
console.log(plan.totalEstimate);
console.log(plan.risks);
```

### 7. Error Detector (`error-detector.ts`)

**Capabilities:**
- Error pattern detection
- Anomaly identification
- Failure analysis
- Frequency analysis
- Remediation recommendations

**Example Usage:**

```typescript
import { ErrorDetector } from './agents/error-detector.js';

const detector = new ErrorDetector();

const patterns = await detector.detectErrorPatterns();

console.log(patterns); // Top 10 error patterns with frequency
```

## Agent Coordinator

The `AgentCoordinator` intelligently routes tasks to appropriate agents and orchestrates multi-agent workflows.

### Basic Coordination

```typescript
import { AgentCoordinator } from './agents/coordinator.js';

const coordinator = new AgentCoordinator({ claudeClient });

// Automatic agent selection
const agentType = coordinator.selectAgent({
  taskDescription: 'Analyze research trends in AI',
  requiredCapabilities: ['arxiv-search'],
});
console.log(agentType); // 'researcher'

// Get specific agent
const researcher = coordinator.getAgent('researcher');
```

### Task Execution

```typescript
const task = {
  id: 'task-1',
  description: 'Search arXiv for neural network papers',
  type: 'research',
  priority: 'high',
};

const result = await coordinator.executeTask(task);
console.log(result.success);
console.log(result.result);
console.log(result.duration);
```

### Multi-Agent Workflows

```typescript
const workflow = {
  id: 'workflow-1',
  tasks: [
    {
      id: 'research',
      description: 'Research best practices',
      type: 'research',
      priority: 'high',
    },
    {
      id: 'design',
      description: 'Design system architecture',
      type: 'architecture',
      priority: 'high',
      dependencies: ['research'],
    },
    {
      id: 'implement',
      description: 'Generate code',
      type: 'coding',
      priority: 'high',
      dependencies: ['design'],
    },
    {
      id: 'test',
      description: 'Generate tests',
      type: 'testing',
      priority: 'high',
      dependencies: ['implement'],
    },
    {
      id: 'review',
      description: 'Review code quality',
      type: 'analysis',
      priority: 'medium',
      dependencies: ['test'],
    },
  ],
  dependencies: new Map([
    ['design', ['research']],
    ['implement', ['design']],
    ['test', ['implement']],
    ['review', ['test']],
  ]),
  executionStrategy: 'adaptive', // 'sequential' | 'parallel' | 'adaptive'
};

const result = await coordinator.orchestrateWorkflow(workflow);
console.log(`Success Rate: ${result.successRate * 100}%`);
console.log(`Total Duration: ${result.totalDuration}ms`);
console.log(result.tasks);

if (result.conflicts) {
  console.log('Conflicts detected:', result.conflicts);
}
```

## Capability Matrix

Each agent has a defined capability matrix:

```typescript
const matrix = coordinator.getCapabilityMatrix();

for (const [agentType, capability] of matrix) {
  console.log(`\n${agentType}:`);
  console.log('Capabilities:', capability.capabilities);
  console.log('Strengths:', capability.strengths);
  console.log('Limitations:', capability.limitations);
  console.log('Typical Tasks:', capability.typicalTasks);
}
```

## Best Practices

### 1. Agent Selection

- Use `coordinator.selectAgent()` for automatic routing
- Specify `requiredCapabilities` for precise selection
- Consider task complexity when selecting agents

### 2. Error Handling

```typescript
try {
  const result = await coordinator.executeTask(task);
  if (!result.success) {
    console.error('Task failed:', result.error);
  }
} catch (error) {
  console.error('Execution error:', error);
}
```

### 3. Workflow Design

- **Sequential**: Tasks must run in order (design → implement → test)
- **Parallel**: Independent tasks can run simultaneously
- **Adaptive**: Auto-detects dependencies and optimizes execution

### 4. Dependency Management

```typescript
// Correct: Define clear dependencies
const dependencies = new Map([
  ['task-2', ['task-1']], // task-2 depends on task-1
  ['task-3', ['task-1']], // task-3 depends on task-1
  ['task-4', ['task-2', 'task-3']], // task-4 depends on both
]);

// Avoid: Circular dependencies (will throw error)
const bad = new Map([
  ['task-1', ['task-2']],
  ['task-2', ['task-1']], // Circular!
]);
```

### 5. Performance Optimization

- Use parallel execution for independent tasks
- Batch similar tasks to the same agent
- Monitor execution times and adjust strategies

## Integration with Claude Flow

All agents integrate seamlessly with Claude Flow MCP tools:

```typescript
// Before agent work
await hooks.preTask({ description: 'Research phase' });

// Execute agent task
const result = await coordinator.executeTask(task);

// After agent work
await hooks.postTask({ taskId: task.id });
await hooks.notify({ message: `${task.type} completed` });
```

## Testing

All agents have comprehensive test coverage:

- Unit tests: `/weaver/tests/agents/*.test.ts`
- Integration tests: Test agent coordination
- Mock Claude API calls for deterministic testing

Run tests:

```bash
npm test -- tests/agents
```

## Future Enhancements

1. **Agent Learning**: Agents learn from past executions
2. **Custom Agents**: User-defined specialized agents
3. **Agent Metrics**: Performance tracking and optimization
4. **Conflict Resolution**: Advanced multi-agent negotiation
5. **Streaming Responses**: Real-time agent progress updates

## API Reference

See individual agent files for detailed API documentation:

- `/weaver/src/agents/researcher-agent.ts`
- `/weaver/src/agents/coder-agent.ts`
- `/weaver/src/agents/architect-agent.ts`
- `/weaver/src/agents/tester-agent.ts`
- `/weaver/src/agents/analyst-agent.ts`
- `/weaver/src/agents/coordinator.ts`

## Support

For issues or questions:
- Check test files for usage examples
- Review agent source code for detailed documentation
- See `/weaver/docs/developer/` for more guides
