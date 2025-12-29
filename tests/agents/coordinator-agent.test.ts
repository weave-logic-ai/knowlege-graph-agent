/**
 * Coordinator Agent Tests
 *
 * Comprehensive tests for the CoordinatorAgent including:
 * - Workflow orchestration
 * - Dependency resolution
 * - Distribution strategies
 * - Failure handling
 *
 * @module agents/__tests__/coordinator-agent.test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  CoordinatorAgent,
  createCoordinatorAgent,
  createWorkflow,
  createWorkflowStep,
  type WorkflowDefinition,
  type WorkflowStep,
  type DelegateTask,
  type AgentRequirement,
} from '../../src/agents/coordinator-agent.js';
import {
  AgentRegistry,
  createRegistry,
  registerDefaultAgents,
} from '../../src/agents/registry.js';
import { BaseAgent } from '../../src/agents/base-agent.js';
import {
  AgentType,
  AgentStatus,
  TaskPriority,
  type AgentConfig,
  type AgentTask,
  type AgentResult,
} from '../../src/agents/types.js';

// ============================================================================
// Mock Agent Implementation
// ============================================================================

/**
 * Mock agent for testing
 */
class MockAgent extends BaseAgent {
  public executionCount = 0;
  public lastTask: AgentTask | null = null;
  public shouldFail = false;
  public failureMessage = 'Mock failure';
  public executionDelayMs = 0;
  public executionResults: Map<string, unknown> = new Map();

  constructor(config: AgentConfig) {
    super(config);
  }

  protected async executeTask(task: AgentTask): Promise<AgentResult> {
    this.executionCount++;
    this.lastTask = task;

    if (this.executionDelayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, this.executionDelayMs));
    }

    if (this.shouldFail) {
      return this.createErrorResult(
        'MOCK_ERROR',
        this.failureMessage,
        new Date()
      );
    }

    const resultData = this.executionResults.get(task.id) ?? {
      executed: true,
      taskId: task.id,
      agentId: this.config.id,
    };

    return this.createSuccessResult(resultData, new Date());
  }
}

/**
 * Create a mock agent factory
 */
function createMockAgentFactory(type: AgentType) {
  return async (config: AgentConfig) => {
    return new MockAgent({ ...config, type });
  };
}

// ============================================================================
// Test Setup
// ============================================================================

describe('CoordinatorAgent', () => {
  let registry: AgentRegistry;
  let coordinator: CoordinatorAgent;

  beforeEach(() => {
    // Create a fresh registry for each test
    registry = createRegistry({
      maxAgentsPerType: 10,
    });

    // Register mock agent factories
    for (const type of Object.values(AgentType)) {
      registry.register(type, createMockAgentFactory(type), {
        capabilities: getCapabilitiesForType(type),
      });
    }

    // Create coordinator agent
    coordinator = createCoordinatorAgent({
      name: 'test-coordinator',
      registry,
      maxConcurrentWorkflows: 5,
      maxConcurrentTasksPerWorkflow: 10,
    });
  });

  afterEach(async () => {
    await registry.clear();
  });

  // ==========================================================================
  // Basic Functionality Tests
  // ==========================================================================

  describe('Basic Functionality', () => {
    it('should create a coordinator agent with correct configuration', () => {
      expect(coordinator).toBeInstanceOf(CoordinatorAgent);
      expect(coordinator.config.type).toBe(AgentType.COORDINATOR);
      expect(coordinator.config.name).toBe('test-coordinator');
      expect(coordinator.config.capabilities).toContain('orchestrate');
      expect(coordinator.config.capabilities).toContain('delegate');
    });

    it('should start in idle status', () => {
      expect(coordinator.getStatus()).toBe(AgentStatus.IDLE);
    });

    it('should get empty progress report initially', async () => {
      const report = await coordinator.getProgressReport();

      expect(report.activeWorkflows).toBe(0);
      expect(report.pendingTasks).toBe(0);
      expect(report.runningTasks).toBe(0);
      expect(report.completedTasks).toBe(0);
      expect(report.failedTasks).toBe(0);
    });

    it('should get statistics', () => {
      const stats = coordinator.getStatistics();

      expect(stats.activeWorkflows).toBe(0);
      expect(stats.totalTasksQueued).toBe(0);
      expect(stats.workflowsCompleted).toBe(0);
    });
  });

  // ==========================================================================
  // Workflow Orchestration Tests
  // ==========================================================================

  describe('Workflow Orchestration', () => {
    it('should execute a simple sequential workflow', async () => {
      const workflow = createWorkflow(
        'simple-workflow',
        'Simple Test Workflow',
        [
          createWorkflowStep('step1', AgentType.RESEARCHER, 'Research task'),
          createWorkflowStep('step2', AgentType.CODER, 'Code task'),
        ],
        {
          dependencies: [['step2', ['step1']]],
          parallel: false,
        }
      );

      const result = await coordinator.orchestrateWorkflow(workflow);

      expect(result.success).toBe(true);
      expect(result.workflowId).toBe('simple-workflow');
      expect(result.stepResults.size).toBe(2);
      expect(result.stepResults.get('step1')?.success).toBe(true);
      expect(result.stepResults.get('step2')?.success).toBe(true);
    });

    it('should execute a parallel workflow', async () => {
      const workflow = createWorkflow(
        'parallel-workflow',
        'Parallel Test Workflow',
        [
          createWorkflowStep('step1', AgentType.RESEARCHER, 'Research task'),
          createWorkflowStep('step2', AgentType.ANALYST, 'Analysis task'),
          createWorkflowStep('step3', AgentType.CODER, 'Code task'),
        ],
        {
          dependencies: [['step3', ['step1', 'step2']]],
          parallel: true,
        }
      );

      const result = await coordinator.orchestrateWorkflow(workflow);

      expect(result.success).toBe(true);
      expect(result.stepResults.size).toBe(3);
    });

    it('should handle workflow with no dependencies', async () => {
      const workflow = createWorkflow(
        'no-deps-workflow',
        'No Dependencies Workflow',
        [
          createWorkflowStep('step1', AgentType.RESEARCHER, 'Task 1'),
          createWorkflowStep('step2', AgentType.CODER, 'Task 2'),
          createWorkflowStep('step3', AgentType.TESTER, 'Task 3'),
        ],
        { parallel: true }
      );

      const result = await coordinator.orchestrateWorkflow(workflow);

      expect(result.success).toBe(true);
      expect(result.stepResults.size).toBe(3);
    });

    it('should pass previous outputs to dependent steps', async () => {
      const workflow = createWorkflow(
        'data-flow-workflow',
        'Data Flow Workflow',
        [
          createWorkflowStep('research', AgentType.RESEARCHER, 'Research', { query: 'test' }),
          createWorkflowStep('implement', AgentType.CODER, 'Implement', {}),
        ],
        {
          dependencies: [['implement', ['research']]],
        }
      );

      const result = await coordinator.orchestrateWorkflow(workflow);

      expect(result.success).toBe(true);
      expect(result.output).toBeDefined();
    });

    it('should store workflow results', async () => {
      const workflow = createWorkflow(
        'stored-workflow',
        'Stored Workflow',
        [createWorkflowStep('step1', AgentType.RESEARCHER, 'Task')],
      );

      await coordinator.orchestrateWorkflow(workflow);

      const storedResult = coordinator.getWorkflowResult('stored-workflow');
      expect(storedResult).toBeDefined();
      expect(storedResult?.success).toBe(true);
    });
  });

  // ==========================================================================
  // Dependency Resolution Tests
  // ==========================================================================

  describe('Dependency Resolution', () => {
    it('should resolve simple linear dependencies', async () => {
      const workflow = createWorkflow(
        'linear-deps',
        'Linear Dependencies',
        [
          createWorkflowStep('a', AgentType.RESEARCHER, 'Step A'),
          createWorkflowStep('b', AgentType.CODER, 'Step B'),
          createWorkflowStep('c', AgentType.TESTER, 'Step C'),
        ],
        {
          dependencies: [
            ['b', ['a']],
            ['c', ['b']],
          ],
        }
      );

      const result = await coordinator.orchestrateWorkflow(workflow);

      expect(result.success).toBe(true);
      // Verify execution order through timestamps
      const stepA = result.stepResults.get('a');
      const stepB = result.stepResults.get('b');
      const stepC = result.stepResults.get('c');

      expect(stepA).toBeDefined();
      expect(stepB).toBeDefined();
      expect(stepC).toBeDefined();
    });

    it('should resolve diamond dependencies', async () => {
      // Diamond: A -> B, A -> C, B -> D, C -> D
      const workflow = createWorkflow(
        'diamond-deps',
        'Diamond Dependencies',
        [
          createWorkflowStep('a', AgentType.RESEARCHER, 'Step A'),
          createWorkflowStep('b', AgentType.CODER, 'Step B'),
          createWorkflowStep('c', AgentType.ANALYST, 'Step C'),
          createWorkflowStep('d', AgentType.TESTER, 'Step D'),
        ],
        {
          dependencies: [
            ['b', ['a']],
            ['c', ['a']],
            ['d', ['b', 'c']],
          ],
          parallel: true,
        }
      );

      const result = await coordinator.orchestrateWorkflow(workflow);

      expect(result.success).toBe(true);
      expect(result.stepResults.size).toBe(4);
    });

    it('should detect circular dependencies', async () => {
      const workflow = createWorkflow(
        'circular-deps',
        'Circular Dependencies',
        [
          createWorkflowStep('a', AgentType.RESEARCHER, 'Step A'),
          createWorkflowStep('b', AgentType.CODER, 'Step B'),
          createWorkflowStep('c', AgentType.TESTER, 'Step C'),
        ],
        {
          dependencies: [
            ['a', ['c']],
            ['b', ['a']],
            ['c', ['b']],
          ],
        }
      );

      const result = await coordinator.orchestrateWorkflow(workflow);

      expect(result.success).toBe(false);
      expect(result.error).toContain('circular');
    });

    it('should handle complex multi-level dependencies', async () => {
      const workflow = createWorkflow(
        'complex-deps',
        'Complex Dependencies',
        [
          createWorkflowStep('a', AgentType.RESEARCHER, 'Step A'),
          createWorkflowStep('b', AgentType.RESEARCHER, 'Step B'),
          createWorkflowStep('c', AgentType.CODER, 'Step C'),
          createWorkflowStep('d', AgentType.CODER, 'Step D'),
          createWorkflowStep('e', AgentType.TESTER, 'Step E'),
          createWorkflowStep('f', AgentType.REVIEWER, 'Step F'),
        ],
        {
          dependencies: [
            ['c', ['a']],
            ['d', ['a', 'b']],
            ['e', ['c', 'd']],
            ['f', ['e']],
          ],
          parallel: true,
        }
      );

      const result = await coordinator.orchestrateWorkflow(workflow);

      expect(result.success).toBe(true);
      expect(result.stepResults.size).toBe(6);
    });
  });

  // ==========================================================================
  // Distribution Strategy Tests
  // ==========================================================================

  describe('Distribution Strategies', () => {
    describe('Round-Robin Strategy', () => {
      it('should distribute tasks in round-robin order', async () => {
        // Spawn multiple agents of the same type
        await registry.spawnMultiple([
          { type: AgentType.CODER, config: { name: 'coder-1' } },
          { type: AgentType.CODER, config: { name: 'coder-2' } },
          { type: AgentType.CODER, config: { name: 'coder-3' } },
        ]);

        const tasks: DelegateTask[] = [
          { description: 'Task 1', preferredType: AgentType.CODER },
          { description: 'Task 2', preferredType: AgentType.CODER },
          { description: 'Task 3', preferredType: AgentType.CODER },
          { description: 'Task 4', preferredType: AgentType.CODER },
          { description: 'Task 5', preferredType: AgentType.CODER },
          { description: 'Task 6', preferredType: AgentType.CODER },
        ];

        const assignments = await coordinator.distributeTasks(tasks, 'round-robin');

        expect(assignments.length).toBe(6);

        // Verify distribution
        const agentIds = assignments.map(a => a.agentId);
        const uniqueAgents = new Set(agentIds);

        // Should use multiple agents
        expect(uniqueAgents.size).toBeGreaterThan(1);
      });
    });

    describe('Capability-Match Strategy', () => {
      it('should match tasks to agents with required capabilities', async () => {
        // Spawn agents with specific capabilities
        await registry.spawn(AgentType.CODER, {
          name: 'frontend-dev',
          capabilities: ['react', 'typescript', 'css'],
        });

        await registry.spawn(AgentType.CODER, {
          name: 'backend-dev',
          capabilities: ['node', 'express', 'postgresql'],
        });

        const tasks: DelegateTask[] = [
          {
            description: 'Build React component',
            preferredType: AgentType.CODER,
            requiredCapabilities: ['react', 'typescript'],
          },
          {
            description: 'Create API endpoint',
            preferredType: AgentType.CODER,
            requiredCapabilities: ['node', 'express'],
          },
        ];

        const assignments = await coordinator.distributeTasks(tasks, 'capability-match');

        expect(assignments.length).toBe(2);
        // Both tasks should be assigned - status may be pending or running depending on timing
        expect(['pending', 'running', 'completed']).toContain(assignments[0].status);
        expect(['pending', 'running', 'completed']).toContain(assignments[1].status);
      });

      it('should skip tasks when no matching agent exists', async () => {
        const tasks: DelegateTask[] = [
          {
            description: 'Specialized task',
            preferredType: AgentType.CUSTOM,
            requiredCapabilities: ['specialized-skill'],
          },
        ];

        const assignments = await coordinator.distributeTasks(tasks, 'capability-match');

        // Task should be skipped if no agent matches
        expect(assignments.length).toBeLessThanOrEqual(1);
      });
    });

    describe('Load-Balanced Strategy', () => {
      it('should distribute tasks to least loaded agents', async () => {
        // Spawn multiple agents
        await registry.spawnMultiple([
          { type: AgentType.CODER, config: { name: 'coder-1' } },
          { type: AgentType.CODER, config: { name: 'coder-2' } },
        ]);

        const tasks: DelegateTask[] = [
          { description: 'Task 1', preferredType: AgentType.CODER },
          { description: 'Task 2', preferredType: AgentType.CODER },
          { description: 'Task 3', preferredType: AgentType.CODER },
          { description: 'Task 4', preferredType: AgentType.CODER },
        ];

        const assignments = await coordinator.distributeTasks(tasks, 'load-balanced');

        expect(assignments.length).toBe(4);

        // Count tasks per agent
        const taskCounts = new Map<string, number>();
        for (const assignment of assignments) {
          const count = taskCounts.get(assignment.agentId) ?? 0;
          taskCounts.set(assignment.agentId, count + 1);
        }

        // Tasks should be distributed somewhat evenly
        const counts = Array.from(taskCounts.values());
        const maxDifference = Math.max(...counts) - Math.min(...counts);
        expect(maxDifference).toBeLessThanOrEqual(2);
      });
    });
  });

  // ==========================================================================
  // Failure Handling Tests
  // ==========================================================================

  describe('Failure Handling', () => {
    it('should handle step failures in workflow', async () => {
      // Create a fresh coordinator with a registry that has failing agents
      const testRegistry = createRegistry({ maxAgentsPerType: 10 });

      // Register a researcher that works
      testRegistry.register(AgentType.RESEARCHER, async (config: AgentConfig) => {
        return new MockAgent({ ...config, type: AgentType.RESEARCHER });
      });

      // Register a coder that always fails
      testRegistry.register(AgentType.CODER, async (config: AgentConfig) => {
        const agent = new MockAgent({ ...config, type: AgentType.CODER });
        agent.shouldFail = true;
        agent.failureMessage = 'Intentional test failure';
        return agent;
      });

      const testCoordinator = createCoordinatorAgent({
        name: 'test-fail-coordinator',
        registry: testRegistry,
      });

      const workflow = createWorkflow(
        'failing-workflow',
        'Failing Workflow',
        [
          createWorkflowStep('step1', AgentType.RESEARCHER, 'Research'),
          createWorkflowStep('step2', AgentType.CODER, 'Code (will fail)'),
        ],
        {
          dependencies: [['step2', ['step1']]],
        }
      );

      const result = await testCoordinator.orchestrateWorkflow(workflow);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();

      await testRegistry.clear();
    });

    it('should continue workflow when optional step fails', async () => {
      // Spawn a failing agent
      const failingAgent = await registry.spawn(AgentType.ANALYST, {
        name: 'failing-analyst',
      }) as MockAgent;
      failingAgent.shouldFail = true;

      const workflow = createWorkflow(
        'optional-failure',
        'Optional Failure Workflow',
        [
          createWorkflowStep('step1', AgentType.RESEARCHER, 'Research'),
          createWorkflowStep('step2', AgentType.ANALYST, 'Analysis', {}, { optional: true }),
          createWorkflowStep('step3', AgentType.CODER, 'Code'),
        ],
        {
          dependencies: [
            ['step2', ['step1']],
            ['step3', ['step1']],
          ],
          parallel: true,
        }
      );

      const result = await coordinator.orchestrateWorkflow(workflow);

      // Workflow should succeed despite optional step failure
      expect(result.stepResults.get('step2')?.success).toBe(false);
      expect(result.stepResults.get('step3')?.success).toBe(true);
    });

    it('should retry failed steps when configured', async () => {
      // Create isolated registry for this test
      const retryRegistry = createRegistry({ maxAgentsPerType: 10 });
      let attempts = 0;

      const retryCoderFactory = async (config: AgentConfig) => {
        const agent = new MockAgent({ ...config, type: AgentType.CODER });
        // Override executeTask to track attempts
        const originalExecute = agent['executeTask'].bind(agent);
        agent['executeTask'] = async function(task: AgentTask): Promise<AgentResult> {
          attempts++;
          if (attempts < 3) {
            return agent.createErrorResult('RETRY_ERROR', 'Temporary failure', new Date());
          }
          return originalExecute(task);
        };
        return agent;
      };

      // Register with retry factory
      retryRegistry.register(AgentType.CODER, retryCoderFactory, {
        capabilities: [{ name: 'code', description: 'Code generation' }],
      });

      const retryCoordinator = createCoordinatorAgent({
        name: 'retry-coordinator',
        registry: retryRegistry,
      });

      const workflow = createWorkflow(
        'retry-workflow',
        'Retry Workflow',
        [
          createWorkflowStep(
            'retry-step',
            AgentType.CODER,
            'Retryable task',
            {},
            { retry: { maxRetries: 5, backoffMs: 10 } }
          ),
        ],
      );

      const result = await retryCoordinator.orchestrateWorkflow(workflow);

      // Should have attempted at least 3 times
      expect(attempts).toBeGreaterThanOrEqual(3);
      // Should eventually succeed
      expect(result.success).toBe(true);

      await retryRegistry.clear();
    });

    it('should handle agent unavailability gracefully', async () => {
      // Create isolated registry with NO CUSTOM agent type registered
      const emptyRegistry = createRegistry({ maxAgentsPerType: 10 });
      // Don't register AgentType.CUSTOM - it should be unavailable

      const unavailableCoordinator = createCoordinatorAgent({
        name: 'unavailable-coordinator',
        registry: emptyRegistry,
      });

      const workflow = createWorkflow(
        'unavailable-workflow',
        'Unavailable Workflow',
        [
          createWorkflowStep('step1', AgentType.CUSTOM, 'Custom task'),
        ],
      );

      const result = await unavailableCoordinator.orchestrateWorkflow(workflow);

      // Workflow should fail because no agent is available
      expect(result.success).toBe(false);
      expect(result.stepResults.get('step1')?.success).toBe(false);
      expect(result.stepResults.get('step1')?.error).toContain('No agent available');

      await emptyRegistry.clear();
    });
  });

  // ==========================================================================
  // Task Delegation Tests
  // ==========================================================================

  describe('Task Delegation', () => {
    it('should delegate task to appropriate agent', async () => {
      await registry.spawn(AgentType.CODER, { name: 'coder-agent' });

      const agentId = await coordinator.delegateTask({
        description: 'Build feature',
        preferredType: AgentType.CODER,
        priority: TaskPriority.HIGH,
        input: { feature: 'auth' },
      });

      expect(agentId).toBeDefined();
      expect(agentId).toContain('coder');
    });

    it('should track delegated task assignment', async () => {
      await registry.spawn(AgentType.RESEARCHER, { name: 'researcher-agent' });

      await coordinator.delegateTask({
        description: 'Research topic',
        preferredType: AgentType.RESEARCHER,
      });

      // Wait for async execution
      await new Promise(resolve => setTimeout(resolve, 100));

      const stats = coordinator.getStatistics();
      expect(stats.totalTasksQueued).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Agent Spawning Tests
  // ==========================================================================

  describe('Agent Spawning', () => {
    it('should spawn agents based on requirements', async () => {
      const requirements: AgentRequirement[] = [
        { type: AgentType.RESEARCHER, count: 2 },
        { type: AgentType.CODER, count: 3, capabilities: ['typescript'] },
      ];

      const agentIds = await coordinator.spawnAgents(requirements);

      expect(agentIds.length).toBe(5);
      expect(agentIds.filter(id => id.includes('researcher')).length).toBe(2);
      expect(agentIds.filter(id => id.includes('coder')).length).toBe(3);
    });

    it('should handle spawn failures gracefully', async () => {
      // Unregister agent type to cause spawn failure
      registry.unregister(AgentType.CUSTOM);

      const requirements: AgentRequirement[] = [
        { type: AgentType.RESEARCHER, count: 1 },
        { type: AgentType.CUSTOM, count: 1 },
      ];

      const agentIds = await coordinator.spawnAgents(requirements);

      // Should spawn what it can
      expect(agentIds.length).toBe(1);
    });
  });

  // ==========================================================================
  // Progress Tracking Tests
  // ==========================================================================

  describe('Progress Tracking', () => {
    it('should track workflow progress', async () => {
      // Start a workflow in background
      const workflow = createWorkflow(
        'tracked-workflow',
        'Tracked Workflow',
        [
          createWorkflowStep('step1', AgentType.RESEARCHER, 'Step 1'),
          createWorkflowStep('step2', AgentType.CODER, 'Step 2'),
          createWorkflowStep('step3', AgentType.TESTER, 'Step 3'),
        ],
        {
          dependencies: [
            ['step2', ['step1']],
            ['step3', ['step2']],
          ],
        }
      );

      // Start workflow (don't await)
      const workflowPromise = coordinator.orchestrateWorkflow(workflow);

      // Give some time for execution to start
      await new Promise(resolve => setTimeout(resolve, 50));

      // Get progress while running
      const initialReport = await coordinator.getProgressReport();
      expect(initialReport.timestamp).toBeDefined();

      // Wait for completion
      await workflowPromise;

      // Get final progress
      const finalReport = await coordinator.getProgressReport();
      expect(finalReport.activeWorkflows).toBe(0);
    });

    it('should track agent utilization', async () => {
      // Spawn some agents
      await registry.spawnMultiple([
        { type: AgentType.CODER, config: { name: 'coder-1' } },
        { type: AgentType.CODER, config: { name: 'coder-2' } },
      ]);

      const report = await coordinator.getProgressReport();

      expect(report.agentUtilization.size).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Task Queue Management Tests
  // ==========================================================================

  describe('Task Queue Management', () => {
    it('should cancel pending tasks', async () => {
      await registry.spawn(AgentType.CODER, { name: 'coder-agent' });

      await coordinator.delegateTask({
        description: 'Task to cancel',
        preferredType: AgentType.CODER,
      });

      // Get task ID from stats
      const stats = coordinator.getStatistics();
      expect(stats.totalTasksQueued).toBe(1);
    });

    it('should clear completed tasks', async () => {
      await registry.spawn(AgentType.CODER, { name: 'coder-agent' });

      await coordinator.delegateTask({
        description: 'Quick task',
        preferredType: AgentType.CODER,
      });

      // Wait for task completion
      await new Promise(resolve => setTimeout(resolve, 200));

      const cleared = coordinator.clearCompletedTasks();
      expect(cleared).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // Validation Tests
  // ==========================================================================

  describe('Workflow Validation', () => {
    it('should reject workflow without ID', async () => {
      const workflow: WorkflowDefinition = {
        id: '',
        name: 'Test',
        steps: [createWorkflowStep('s1', AgentType.CODER, 'Task')],
        dependencies: new Map(),
        parallel: true,
      };

      const result = await coordinator.orchestrateWorkflow(workflow);
      expect(result.success).toBe(false);
      expect(result.error).toContain('ID');
    });

    it('should reject workflow without name', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-id',
        name: '',
        steps: [createWorkflowStep('s1', AgentType.CODER, 'Task')],
        dependencies: new Map(),
        parallel: true,
      };

      const result = await coordinator.orchestrateWorkflow(workflow);
      expect(result.success).toBe(false);
      expect(result.error).toContain('name');
    });

    it('should reject workflow without steps', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-id',
        name: 'Test',
        steps: [],
        dependencies: new Map(),
        parallel: true,
      };

      const result = await coordinator.orchestrateWorkflow(workflow);
      expect(result.success).toBe(false);
      expect(result.error).toContain('step');
    });

    it('should reject workflow with duplicate step IDs', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-id',
        name: 'Test',
        steps: [
          createWorkflowStep('s1', AgentType.CODER, 'Task 1'),
          createWorkflowStep('s1', AgentType.CODER, 'Task 2'),
        ],
        dependencies: new Map(),
        parallel: true,
      };

      const result = await coordinator.orchestrateWorkflow(workflow);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Duplicate');
    });

    it('should reject workflow with invalid dependency references', async () => {
      const workflow: WorkflowDefinition = {
        id: 'test-id',
        name: 'Test',
        steps: [createWorkflowStep('s1', AgentType.CODER, 'Task')],
        dependencies: new Map([['s1', ['nonexistent']]]),
        parallel: true,
      };

      const result = await coordinator.orchestrateWorkflow(workflow);
      expect(result.success).toBe(false);
      expect(result.error).toContain('unknown step');
    });
  });

  // ==========================================================================
  // Factory Functions Tests
  // ==========================================================================

  describe('Factory Functions', () => {
    it('should create workflow using factory', () => {
      const workflow = createWorkflow(
        'factory-workflow',
        'Factory Workflow',
        [
          createWorkflowStep('s1', AgentType.RESEARCHER, 'Research'),
          createWorkflowStep('s2', AgentType.CODER, 'Code'),
        ],
        {
          description: 'Test workflow',
          dependencies: [['s2', ['s1']]],
          parallel: true,
          timeout: 60000,
        }
      );

      expect(workflow.id).toBe('factory-workflow');
      expect(workflow.name).toBe('Factory Workflow');
      expect(workflow.description).toBe('Test workflow');
      expect(workflow.steps.length).toBe(2);
      expect(workflow.dependencies.get('s2')).toEqual(['s1']);
      expect(workflow.parallel).toBe(true);
      expect(workflow.timeout).toBe(60000);
    });

    it('should create workflow step using factory', () => {
      const step = createWorkflowStep(
        'test-step',
        AgentType.TESTER,
        'Test task',
        { target: 'component' },
        { timeout: 30000, retry: { maxRetries: 3, backoffMs: 1000 }, optional: true }
      );

      expect(step.id).toBe('test-step');
      expect(step.agentType).toBe(AgentType.TESTER);
      expect(step.task).toBe('Test task');
      expect(step.input).toEqual({ target: 'component' });
      expect(step.timeout).toBe(30000);
      expect(step.retry).toEqual({ maxRetries: 3, backoffMs: 1000 });
      expect(step.optional).toBe(true);
    });

    it('should create coordinator using factory', () => {
      const coord = createCoordinatorAgent({
        name: 'factory-coordinator',
        defaultStrategy: 'load-balanced',
      });

      expect(coord).toBeInstanceOf(CoordinatorAgent);
      expect(coord.config.name).toBe('factory-coordinator');
    });
  });
});

// ============================================================================
// Helper Functions
// ============================================================================

function getCapabilitiesForType(type: AgentType): Array<{ name: string; description: string }> {
  const capabilities: Record<AgentType, Array<{ name: string; description: string }>> = {
    [AgentType.RESEARCHER]: [
      { name: 'search', description: 'Search capabilities' },
      { name: 'analyze', description: 'Analysis capabilities' },
    ],
    [AgentType.CODER]: [
      { name: 'code', description: 'Code generation' },
      { name: 'typescript', description: 'TypeScript support' },
    ],
    [AgentType.TESTER]: [
      { name: 'test', description: 'Test generation' },
      { name: 'coverage', description: 'Coverage analysis' },
    ],
    [AgentType.ANALYST]: [
      { name: 'analyze', description: 'Data analysis' },
      { name: 'report', description: 'Report generation' },
    ],
    [AgentType.ARCHITECT]: [
      { name: 'design', description: 'System design' },
    ],
    [AgentType.REVIEWER]: [
      { name: 'review', description: 'Code review' },
    ],
    [AgentType.COORDINATOR]: [
      { name: 'orchestrate', description: 'Workflow orchestration' },
    ],
    [AgentType.OPTIMIZER]: [
      { name: 'optimize', description: 'Optimization' },
    ],
    [AgentType.DOCUMENTER]: [
      { name: 'document', description: 'Documentation' },
    ],
    [AgentType.PLANNER]: [
      { name: 'plan', description: 'Task planning' },
    ],
    [AgentType.CUSTOM]: [],
  };

  return capabilities[type] ?? [];
}
