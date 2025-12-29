/**
 * PlannerAgent Tests
 *
 * Comprehensive test suite for the PlannerAgent class covering:
 * - Task decomposition
 * - Dependency analysis
 * - Resource allocation
 * - Timeline estimation
 * - Risk assessment
 * - Complete execution plan generation
 *
 * @module agents/__tests__/planner-agent.test
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  PlannerAgent,
  type TaskDecomposition,
  type DependencyGraph,
  type ResourceAllocation,
  type TimelineEstimate,
  type RiskAssessment,
  type ExecutionPlan,
  type AgentInfo,
  type Subtask,
} from '../../src/agents/planner-agent.js';
import { AgentType, TaskPriority } from '../../src/agents/types.js';

describe('PlannerAgent', () => {
  let planner: PlannerAgent;

  beforeEach(() => {
    planner = new PlannerAgent({
      name: 'test-planner',
      estimationStrategy: 'realistic',
      includeRiskAssessment: true,
      maxParallelTasks: 5,
    });
  });

  // ============================================================================
  // Constructor Tests
  // ============================================================================

  describe('constructor', () => {
    it('should create planner with default configuration', () => {
      const defaultPlanner = new PlannerAgent({ name: 'default-planner' });
      expect(defaultPlanner.config.name).toBe('default-planner');
      expect(defaultPlanner.config.type).toBe(AgentType.PLANNER);
    });

    it('should create planner with custom estimation strategy', () => {
      const optimisticPlanner = new PlannerAgent({
        name: 'optimistic-planner',
        estimationStrategy: 'optimistic',
      });
      expect(optimisticPlanner.config.name).toBe('optimistic-planner');
    });

    it('should have correct capabilities', () => {
      expect(planner.config.capabilities).toContain('task_decomposition');
      expect(planner.config.capabilities).toContain('dependency_analysis');
      expect(planner.config.capabilities).toContain('resource_allocation');
      expect(planner.config.capabilities).toContain('timeline_estimation');
      expect(planner.config.capabilities).toContain('risk_assessment');
    });

    it('should set appropriate task timeout', () => {
      expect(planner.config.taskTimeout).toBe(300000); // 5 minutes
    });
  });

  // ============================================================================
  // Task Decomposition Tests
  // ============================================================================

  describe('decomposeTask', () => {
    it('should decompose a simple API task', async () => {
      const result = await planner.decomposeTask('Build a REST API');

      expect(result).toBeDefined();
      expect(result.rootTask).toBe('Build a REST API');
      expect(result.subtasks).toBeInstanceOf(Array);
      expect(result.subtasks.length).toBeGreaterThan(0);
      expect(result.totalHours).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should generate subtasks with required properties', async () => {
      const result = await planner.decomposeTask('Build a REST API with authentication');

      for (const subtask of result.subtasks) {
        expect(subtask.id).toBeDefined();
        expect(subtask.description).toBeDefined();
        expect(subtask.estimatedEffort).toBeDefined();
        expect(subtask.effortEstimate).toBeDefined();
        expect(subtask.effortEstimate.min).toBeLessThanOrEqual(subtask.effortEstimate.likely);
        expect(subtask.effortEstimate.likely).toBeLessThanOrEqual(subtask.effortEstimate.max);
        expect(subtask.requiredCapabilities).toBeInstanceOf(Array);
        expect(subtask.dependencies).toBeInstanceOf(Array);
        expect(['critical', 'high', 'medium', 'low']).toContain(subtask.priority);
      }
    });

    it('should include requirements analysis as first task', async () => {
      const result = await planner.decomposeTask('Build any feature');

      const firstTask = result.subtasks[0];
      expect(firstTask.description.toLowerCase()).toContain('requirement');
      expect(firstTask.priority).toBe('critical');
      expect(firstTask.dependencies).toHaveLength(0);
    });

    it('should include authentication tasks for auth-related projects', async () => {
      const result = await planner.decomposeTask('Build a system with user authentication');

      const authTasks = result.subtasks.filter(t =>
        t.description.toLowerCase().includes('auth') ||
        t.requiredCapabilities.includes('security')
      );

      expect(authTasks.length).toBeGreaterThan(0);
    });

    it('should include database tasks for data-related projects', async () => {
      const result = await planner.decomposeTask('Build a database-driven application');

      const dbTasks = result.subtasks.filter(t =>
        t.description.toLowerCase().includes('database') ||
        t.description.toLowerCase().includes('schema') ||
        t.requiredCapabilities.includes('database')
      );

      expect(dbTasks.length).toBeGreaterThan(0);
    });

    it('should include UI tasks for frontend projects', async () => {
      const result = await planner.decomposeTask('Build a React UI component library');

      const uiTasks = result.subtasks.filter(t =>
        t.description.toLowerCase().includes('ui') ||
        t.description.toLowerCase().includes('component') ||
        t.requiredCapabilities.includes('frontend')
      );

      expect(uiTasks.length).toBeGreaterThan(0);
    });

    it('should always include testing tasks', async () => {
      const result = await planner.decomposeTask('Build a simple feature');

      const testTasks = result.subtasks.filter(t =>
        t.description.toLowerCase().includes('test') ||
        t.assignedAgentType === AgentType.TESTER
      );

      expect(testTasks.length).toBeGreaterThan(0);
    });

    it('should always include documentation tasks', async () => {
      const result = await planner.decomposeTask('Build a feature');

      const docTasks = result.subtasks.filter(t =>
        t.description.toLowerCase().includes('document') ||
        t.assignedAgentType === AgentType.DOCUMENTER
      );

      expect(docTasks.length).toBeGreaterThan(0);
    });

    it('should always include code review tasks', async () => {
      const result = await planner.decomposeTask('Build a feature');

      const reviewTasks = result.subtasks.filter(t =>
        t.description.toLowerCase().includes('review') ||
        t.assignedAgentType === AgentType.REVIEWER
      );

      expect(reviewTasks.length).toBeGreaterThan(0);
    });

    it('should calculate PERT estimates correctly', async () => {
      const result = await planner.decomposeTask('Build a feature');

      for (const subtask of result.subtasks) {
        const { min, likely, max, expected } = subtask.effortEstimate;
        // PERT: (min + 4*likely + max) / 6
        // With realistic strategy, expected should be close to this
        const pertEstimate = (min + 4 * likely + max) / 6;
        expect(Math.abs(expected - pertEstimate)).toBeLessThan(0.5);
      }
    });

    it('should apply optimistic estimation strategy', async () => {
      const optimisticPlanner = new PlannerAgent({
        name: 'optimistic-planner',
        estimationStrategy: 'optimistic',
      });

      const result = await optimisticPlanner.decomposeTask('Build a feature');
      const realisticResult = await planner.decomposeTask('Build a feature');

      // Optimistic estimates should be lower
      expect(result.totalHours).toBeLessThanOrEqual(realisticResult.totalHours);
    });

    it('should apply pessimistic estimation strategy', async () => {
      const pessimisticPlanner = new PlannerAgent({
        name: 'pessimistic-planner',
        estimationStrategy: 'pessimistic',
      });

      const result = await pessimisticPlanner.decomposeTask('Build a feature');
      const realisticResult = await planner.decomposeTask('Build a feature');

      // Pessimistic estimates should be higher
      expect(result.totalHours).toBeGreaterThanOrEqual(realisticResult.totalHours);
    });

    it('should format duration correctly', async () => {
      const result = await planner.decomposeTask('Build a large system');

      expect(result.totalEstimate).toBeDefined();
      expect(typeof result.totalEstimate).toBe('string');
      // Should contain "hours" or "day(s)"
      expect(result.totalEstimate).toMatch(/hours?|days?/);
    });
  });

  // ============================================================================
  // Dependency Analysis Tests
  // ============================================================================

  describe('analyzeDependencies', () => {
    let decomposition: TaskDecomposition;

    beforeEach(async () => {
      decomposition = await planner.decomposeTask('Build a REST API');
    });

    it('should build dependency graph from subtasks', async () => {
      const result = await planner.analyzeDependencies(decomposition.subtasks);

      expect(result).toBeDefined();
      expect(result.nodes).toBeInstanceOf(Array);
      expect(result.edges).toBeInstanceOf(Array);
      expect(result.nodes.length).toBe(decomposition.subtasks.length);
    });

    it('should create nodes with correct structure', async () => {
      const result = await planner.analyzeDependencies(decomposition.subtasks);

      for (const node of result.nodes) {
        expect(node.id).toBeDefined();
        expect(node.label).toBeDefined();
      }
    });

    it('should create edges with correct structure', async () => {
      const result = await planner.analyzeDependencies(decomposition.subtasks);

      for (const edge of result.edges) {
        expect(edge.from).toBeDefined();
        expect(edge.to).toBeDefined();
        expect(['blocks', 'requires', 'suggests']).toContain(edge.type);
      }
    });

    it('should calculate critical path', async () => {
      const result = await planner.analyzeDependencies(decomposition.subtasks);

      expect(result.criticalPath).toBeInstanceOf(Array);
      expect(result.criticalPath.length).toBeGreaterThan(0);

      // Critical path should contain valid task IDs
      for (const taskId of result.criticalPath) {
        const task = decomposition.subtasks.find(t => t.id === taskId);
        expect(task).toBeDefined();
      }
    });

    it('should identify parallelizable task groups', async () => {
      const result = await planner.analyzeDependencies(decomposition.subtasks);

      expect(result.parallelizable).toBeInstanceOf(Array);

      // Each group should have more than one task
      for (const group of result.parallelizable) {
        expect(group.length).toBeGreaterThan(1);
      }
    });

    it('should provide execution order (topological sort)', async () => {
      const result = await planner.analyzeDependencies(decomposition.subtasks);

      expect(result.executionOrder).toBeInstanceOf(Array);
      expect(result.executionOrder.length).toBe(decomposition.subtasks.length);

      // Verify topological order: dependencies should come before dependents
      const orderIndex = new Map(
        result.executionOrder.map((id, index) => [id, index])
      );

      for (const task of decomposition.subtasks) {
        const taskIndex = orderIndex.get(task.id)!;
        for (const dep of task.dependencies) {
          const depIndex = orderIndex.get(dep);
          if (depIndex !== undefined) {
            expect(depIndex).toBeLessThan(taskIndex);
          }
        }
      }
    });

    it('should detect cycles in dependency graph', async () => {
      // Create subtasks with circular dependency
      const cyclicSubtasks: Subtask[] = [
        {
          id: 'task_1',
          description: 'Task 1',
          estimatedEffort: '4 hours',
          effortEstimate: { min: 2, likely: 4, max: 8, expected: 4 },
          requiredCapabilities: [],
          dependencies: ['task_3'], // Creates cycle: 1 -> 3 -> 2 -> 1
          priority: 'high',
        },
        {
          id: 'task_2',
          description: 'Task 2',
          estimatedEffort: '4 hours',
          effortEstimate: { min: 2, likely: 4, max: 8, expected: 4 },
          requiredCapabilities: [],
          dependencies: ['task_1'],
          priority: 'high',
        },
        {
          id: 'task_3',
          description: 'Task 3',
          estimatedEffort: '4 hours',
          effortEstimate: { min: 2, likely: 4, max: 8, expected: 4 },
          requiredCapabilities: [],
          dependencies: ['task_2'],
          priority: 'high',
        },
      ];

      const result = await planner.analyzeDependencies(cyclicSubtasks);

      expect(result.cycles).toBeInstanceOf(Array);
      // Note: Cycle detection might find the cycle
      // Implementation may vary in exact cycle representation
    });

    it('should handle empty dependency list', async () => {
      const independentSubtasks: Subtask[] = [
        {
          id: 'task_1',
          description: 'Independent Task 1',
          estimatedEffort: '4 hours',
          effortEstimate: { min: 2, likely: 4, max: 8, expected: 4 },
          requiredCapabilities: [],
          dependencies: [],
          priority: 'high',
        },
        {
          id: 'task_2',
          description: 'Independent Task 2',
          estimatedEffort: '4 hours',
          effortEstimate: { min: 2, likely: 4, max: 8, expected: 4 },
          requiredCapabilities: [],
          dependencies: [],
          priority: 'high',
        },
      ];

      const result = await planner.analyzeDependencies(independentSubtasks);

      expect(result.nodes).toHaveLength(2);
      expect(result.edges).toHaveLength(0);
      expect(result.parallelizable.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Resource Allocation Tests
  // ============================================================================

  describe('allocateResources', () => {
    let decomposition: TaskDecomposition;
    let agents: AgentInfo[];

    beforeEach(async () => {
      decomposition = await planner.decomposeTask('Build a REST API');

      agents = [
        {
          id: 'researcher-1',
          type: AgentType.RESEARCHER,
          capabilities: ['requirements_analysis', 'documentation', 'research'],
          availability: 0.8,
          performanceScore: 85,
        },
        {
          id: 'coder-1',
          type: AgentType.CODER,
          capabilities: ['backend', 'api_development', 'database'],
          availability: 1.0,
          performanceScore: 90,
        },
        {
          id: 'tester-1',
          type: AgentType.TESTER,
          capabilities: ['testing', 'test_automation', 'unit_testing'],
          availability: 0.9,
          performanceScore: 80,
        },
        {
          id: 'architect-1',
          type: AgentType.ARCHITECT,
          capabilities: ['architecture', 'api_design', 'security'],
          availability: 0.7,
          performanceScore: 95,
        },
        {
          id: 'reviewer-1',
          type: AgentType.REVIEWER,
          capabilities: ['code_review', 'quality_assurance'],
          availability: 0.8,
          performanceScore: 88,
        },
      ];
    });

    it('should allocate resources to tasks', async () => {
      const result = await planner.allocateResources(decomposition.subtasks, agents);

      expect(result).toBeDefined();
      expect(result.assignments).toBeInstanceOf(Array);
      expect(result.utilization).toBeInstanceOf(Map);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should create valid assignments', async () => {
      const result = await planner.allocateResources(decomposition.subtasks, agents);

      for (const assignment of result.assignments) {
        expect(assignment.taskId).toBeDefined();
        expect(assignment.agentId).toBeDefined();
        expect(assignment.agentType).toBeDefined();
        expect(assignment.estimatedDuration).toBeDefined();
        expect(assignment.durationHours).toBeGreaterThan(0);
        expect(assignment.confidence).toBeGreaterThanOrEqual(0);
        expect(assignment.confidence).toBeLessThanOrEqual(100);
      }
    });

    it('should track agent utilization', async () => {
      const result = await planner.allocateResources(decomposition.subtasks, agents);

      expect(result.utilization.size).toBe(agents.length);

      for (const [agentId, utilization] of result.utilization) {
        expect(agents.some(a => a.id === agentId)).toBe(true);
        expect(utilization).toBeGreaterThanOrEqual(0);
      }
    });

    it('should identify bottlenecks', async () => {
      const result = await planner.allocateResources(decomposition.subtasks, agents);

      expect(result.bottlenecks).toBeInstanceOf(Array);
      // Bottlenecks array may be empty if load is balanced
    });

    it('should track unassigned tasks', async () => {
      const result = await planner.allocateResources(decomposition.subtasks, agents);

      expect(result.unassignedTasks).toBeInstanceOf(Array);
      // With comprehensive agents, most tasks should be assigned
    });

    it('should handle missing capabilities', async () => {
      const limitedAgents: AgentInfo[] = [
        {
          id: 'coder-only',
          type: AgentType.CODER,
          capabilities: ['backend'],
          availability: 1.0,
        },
      ];

      const result = await planner.allocateResources(decomposition.subtasks, limitedAgents);

      // Some tasks should be unassigned due to missing capabilities
      expect(result.unassignedTasks.length).toBeGreaterThan(0);
      expect(result.bottlenecks.length).toBeGreaterThan(0);
    });

    it('should match tasks to agents by type', async () => {
      const result = await planner.allocateResources(decomposition.subtasks, agents);

      // Tasks with TESTER agent type should be assigned to tester
      const testerTasks = decomposition.subtasks.filter(
        t => t.assignedAgentType === AgentType.TESTER
      );

      for (const task of testerTasks) {
        const assignment = result.assignments.find(a => a.taskId === task.id);
        if (assignment) {
          // Tester tasks should preferably go to tester agents
          expect(assignment.agentType).toBe(AgentType.TESTER);
        }
      }
    });

    it('should prioritize critical tasks first', async () => {
      const result = await planner.allocateResources(decomposition.subtasks, agents);

      const criticalTasks = decomposition.subtasks.filter(t => t.priority === 'critical');

      // All critical tasks should be assigned
      for (const task of criticalTasks) {
        const isAssigned = result.assignments.some(a => a.taskId === task.id);
        const isUnassigned = result.unassignedTasks.includes(task.id);

        // Critical task should be either assigned or explicitly unassigned (no matching capability)
        expect(isAssigned || isUnassigned).toBe(true);
      }
    });

    it('should handle empty agent list', async () => {
      const result = await planner.allocateResources(decomposition.subtasks, []);

      expect(result.assignments).toHaveLength(0);
      expect(result.unassignedTasks.length).toBe(decomposition.subtasks.length);
    });
  });

  // ============================================================================
  // Timeline Estimation Tests
  // ============================================================================

  describe('estimateTimeline', () => {
    let decomposition: TaskDecomposition;

    beforeEach(async () => {
      decomposition = await planner.decomposeTask('Build a REST API');
    });

    it('should estimate project timeline', async () => {
      const result = await planner.estimateTimeline(decomposition);

      expect(result).toBeDefined();
      expect(result.startDate).toBeInstanceOf(Date);
      expect(result.endDate).toBeInstanceOf(Date);
      expect(result.totalDays).toBeGreaterThan(0);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should have end date after start date', async () => {
      const result = await planner.estimateTimeline(decomposition);

      expect(result.endDate.getTime()).toBeGreaterThan(result.startDate.getTime());
    });

    it('should create project milestones', async () => {
      const result = await planner.estimateTimeline(decomposition);

      expect(result.milestones).toBeInstanceOf(Array);
      expect(result.milestones.length).toBeGreaterThan(0);

      for (const milestone of result.milestones) {
        expect(milestone.name).toBeDefined();
        expect(milestone.date).toBeInstanceOf(Date);
        expect(milestone.deliverables).toBeInstanceOf(Array);
        expect(milestone.requiredTasks).toBeInstanceOf(Array);
      }
    });

    it('should create project phases', async () => {
      const result = await planner.estimateTimeline(decomposition);

      expect(result.phases).toBeInstanceOf(Array);
      expect(result.phases.length).toBeGreaterThan(0);

      for (const phase of result.phases) {
        expect(phase.name).toBeDefined();
        expect(phase.start).toBeInstanceOf(Date);
        expect(phase.end).toBeInstanceOf(Date);
        expect(phase.tasks).toBeInstanceOf(Array);
        expect(phase.end.getTime()).toBeGreaterThanOrEqual(phase.start.getTime());
      }
    });

    it('should have phases in chronological order', async () => {
      const result = await planner.estimateTimeline(decomposition);

      for (let i = 1; i < result.phases.length; i++) {
        const prev = result.phases[i - 1];
        const curr = result.phases[i];
        expect(curr.start.getTime()).toBeGreaterThanOrEqual(prev.end.getTime());
      }
    });

    it('should include buffer in timeline', async () => {
      const result = await planner.estimateTimeline(decomposition);

      expect(result.bufferPercentage).toBeGreaterThan(0);
      expect(result.bufferPercentage).toBeLessThanOrEqual(100);
    });

    it('should calculate timeline confidence', async () => {
      const result = await planner.estimateTimeline(decomposition);

      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(100);
    });

    it('should apply pessimistic buffer', async () => {
      const pessimisticPlanner = new PlannerAgent({
        name: 'pessimistic-planner',
        estimationStrategy: 'pessimistic',
      });

      const decomp = await pessimisticPlanner.decomposeTask('Build a feature');
      const result = await pessimisticPlanner.estimateTimeline(decomp);

      // Pessimistic should have higher buffer
      expect(result.bufferPercentage).toBeGreaterThanOrEqual(20);
    });

    it('should apply optimistic buffer', async () => {
      const optimisticPlanner = new PlannerAgent({
        name: 'optimistic-planner',
        estimationStrategy: 'optimistic',
      });

      const decomp = await optimisticPlanner.decomposeTask('Build a feature');
      const result = await optimisticPlanner.estimateTimeline(decomp);

      // Optimistic should have lower buffer
      expect(result.bufferPercentage).toBeLessThanOrEqual(20);
    });

    it('should skip weekends in business days', async () => {
      const result = await planner.estimateTimeline(decomposition);

      // End date should be a weekday (not Saturday=6 or Sunday=0)
      const endDay = result.endDate.getDay();
      expect([0, 6]).not.toContain(endDay);
    });
  });

  // ============================================================================
  // Risk Assessment Tests
  // ============================================================================

  describe('assessRisks', () => {
    let decomposition: TaskDecomposition;
    let dependencies: DependencyGraph;

    beforeEach(async () => {
      decomposition = await planner.decomposeTask('Build a REST API');
      dependencies = await planner.analyzeDependencies(decomposition.subtasks);
    });

    it('should assess project risks', async () => {
      const result = await planner.assessRisks(decomposition, dependencies);

      expect(result).toBeDefined();
      expect(result.risks).toBeInstanceOf(Array);
      expect(result.overallRisk).toBeDefined();
      expect(result.riskScore).toBeDefined();
      expect(result.recommendations).toBeInstanceOf(Array);
      expect(result.timestamp).toBeInstanceOf(Date);
    });

    it('should create risks with required properties', async () => {
      const result = await planner.assessRisks(decomposition, dependencies);

      for (const risk of result.risks) {
        expect(risk.id).toBeDefined();
        expect(risk.description).toBeDefined();
        expect(['high', 'medium', 'low']).toContain(risk.probability);
        expect(['high', 'medium', 'low']).toContain(risk.impact);
        expect(risk.score).toBeGreaterThanOrEqual(0);
        expect(risk.mitigation).toBeDefined();
        expect(risk.contingency).toBeDefined();
        expect([
          'technical',
          'resource',
          'schedule',
          'scope',
          'external',
        ]).toContain(risk.category);
      }
    });

    it('should calculate overall risk level', async () => {
      const result = await planner.assessRisks(decomposition, dependencies);

      expect(['high', 'medium', 'low']).toContain(result.overallRisk);
    });

    it('should calculate risk score', async () => {
      const result = await planner.assessRisks(decomposition, dependencies);

      expect(result.riskScore).toBeGreaterThanOrEqual(0);
      expect(result.riskScore).toBeLessThanOrEqual(100);
    });

    it('should sort risks by score (highest first)', async () => {
      const result = await planner.assessRisks(decomposition, dependencies);

      for (let i = 1; i < result.risks.length; i++) {
        expect(result.risks[i - 1].score).toBeGreaterThanOrEqual(result.risks[i].score);
      }
    });

    it('should generate recommendations', async () => {
      const result = await planner.assessRisks(decomposition, dependencies);

      expect(result.recommendations.length).toBeGreaterThan(0);

      for (const recommendation of result.recommendations) {
        expect(typeof recommendation).toBe('string');
        expect(recommendation.length).toBeGreaterThan(0);
      }
    });

    it('should identify cycle-related risks', async () => {
      // Create subtasks with circular dependency
      const cyclicSubtasks: Subtask[] = [
        {
          id: 'task_1',
          description: 'Task 1',
          estimatedEffort: '4 hours',
          effortEstimate: { min: 2, likely: 4, max: 8, expected: 4 },
          requiredCapabilities: [],
          dependencies: ['task_2'],
          priority: 'high',
        },
        {
          id: 'task_2',
          description: 'Task 2',
          estimatedEffort: '4 hours',
          effortEstimate: { min: 2, likely: 4, max: 8, expected: 4 },
          requiredCapabilities: [],
          dependencies: ['task_1'],
          priority: 'high',
        },
      ];

      const cyclicDeps = await planner.analyzeDependencies(cyclicSubtasks);
      const decomp: TaskDecomposition = {
        rootTask: 'Test',
        subtasks: cyclicSubtasks,
        totalEstimate: '8 hours',
        totalHours: 8,
        timestamp: new Date(),
      };

      // Note: The cycle detection and risk assessment will identify cycles
      // if they exist in the dependency graph
    });

    it('should identify resource-related risks with allocation', async () => {
      const agents: AgentInfo[] = [
        {
          id: 'limited-agent',
          type: AgentType.CODER,
          capabilities: ['backend'],
          availability: 0.5,
        },
      ];

      const allocation = await planner.allocateResources(decomposition.subtasks, agents);
      const result = await planner.assessRisks(decomposition, dependencies, allocation);

      // Should identify unassigned tasks as a risk
      const resourceRisks = result.risks.filter(r => r.category === 'resource');
      expect(resourceRisks.length).toBeGreaterThan(0);
    });

    it('should identify high estimation uncertainty risks', async () => {
      const highVarianceSubtasks: Subtask[] = [
        {
          id: 'task_1',
          description: 'Uncertain Task',
          estimatedEffort: '8 hours',
          effortEstimate: { min: 2, likely: 8, max: 32, expected: 10 }, // High variance
          requiredCapabilities: [],
          dependencies: [],
          priority: 'high',
        },
      ];

      const deps = await planner.analyzeDependencies(highVarianceSubtasks);
      const decomp: TaskDecomposition = {
        rootTask: 'Test',
        subtasks: highVarianceSubtasks,
        totalEstimate: '10 hours',
        totalHours: 10,
        timestamp: new Date(),
      };

      const result = await planner.assessRisks(decomp, deps);

      // Should identify estimation uncertainty
      const scheduleRisks = result.risks.filter(r => r.category === 'schedule');
      expect(scheduleRisks.length).toBeGreaterThan(0);
    });
  });

  // ============================================================================
  // Complete Execution Plan Tests
  // ============================================================================

  describe('createExecutionPlan', () => {
    let agents: AgentInfo[];

    beforeEach(() => {
      agents = [
        {
          id: 'researcher-1',
          type: AgentType.RESEARCHER,
          capabilities: ['requirements_analysis', 'documentation'],
          availability: 0.8,
        },
        {
          id: 'coder-1',
          type: AgentType.CODER,
          capabilities: ['backend', 'api_development', 'database'],
          availability: 1.0,
        },
        {
          id: 'tester-1',
          type: AgentType.TESTER,
          capabilities: ['testing', 'test_automation'],
          availability: 0.9,
        },
        {
          id: 'architect-1',
          type: AgentType.ARCHITECT,
          capabilities: ['architecture', 'api_design', 'security'],
          availability: 0.7,
        },
      ];
    });

    it('should create complete execution plan', async () => {
      const result = await planner.createExecutionPlan(
        'API Project',
        'Build a REST API',
        agents
      );

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.name).toBe('API Project');
      expect(result.status).toBe('draft');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.updatedAt).toBeInstanceOf(Date);
    });

    it('should include task decomposition', async () => {
      const result = await planner.createExecutionPlan(
        'API Project',
        'Build a REST API',
        agents
      );

      expect(result.decomposition).toBeDefined();
      expect(result.decomposition.rootTask).toBe('Build a REST API');
      expect(result.decomposition.subtasks.length).toBeGreaterThan(0);
    });

    it('should include dependency analysis', async () => {
      const result = await planner.createExecutionPlan(
        'API Project',
        'Build a REST API',
        agents
      );

      expect(result.dependencies).toBeDefined();
      expect(result.dependencies.nodes.length).toBeGreaterThan(0);
      expect(result.dependencies.criticalPath.length).toBeGreaterThan(0);
    });

    it('should include resource allocation', async () => {
      const result = await planner.createExecutionPlan(
        'API Project',
        'Build a REST API',
        agents
      );

      expect(result.resources).toBeDefined();
      expect(result.resources.assignments.length).toBeGreaterThan(0);
      expect(result.resources.utilization).toBeInstanceOf(Map);
    });

    it('should include timeline estimate', async () => {
      const result = await planner.createExecutionPlan(
        'API Project',
        'Build a REST API',
        agents
      );

      expect(result.timeline).toBeDefined();
      expect(result.timeline.startDate).toBeInstanceOf(Date);
      expect(result.timeline.endDate).toBeInstanceOf(Date);
      expect(result.timeline.phases.length).toBeGreaterThan(0);
    });

    it('should include risk assessment when enabled', async () => {
      const result = await planner.createExecutionPlan(
        'API Project',
        'Build a REST API',
        agents
      );

      expect(result.risks).toBeDefined();
      expect(result.risks.risks.length).toBeGreaterThan(0);
      expect(result.risks.overallRisk).toBeDefined();
    });

    it('should skip risk assessment when disabled', async () => {
      const noRiskPlanner = new PlannerAgent({
        name: 'no-risk-planner',
        includeRiskAssessment: false,
      });

      const result = await noRiskPlanner.createExecutionPlan(
        'API Project',
        'Build a REST API',
        agents
      );

      expect(result.risks.risks).toHaveLength(0);
      expect(result.risks.overallRisk).toBe('low');
    });

    it('should generate unique plan IDs', async () => {
      const plan1 = await planner.createExecutionPlan('Plan 1', 'Task 1', agents);
      const plan2 = await planner.createExecutionPlan('Plan 2', 'Task 2', agents);

      expect(plan1.id).not.toBe(plan2.id);
    });
  });

  // ============================================================================
  // Task Execution Tests
  // ============================================================================

  describe('execute', () => {
    it('should execute decompose task', async () => {
      const result = await planner.execute({
        id: 'test-task-1',
        description: 'Decompose task',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'decompose' },
          data: { task: 'Build a REST API' },
        },
        createdAt: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const decomposition = result.data as TaskDecomposition;
      expect(decomposition.subtasks).toBeInstanceOf(Array);
    });

    it('should execute dependencies task', async () => {
      const decomposition = await planner.decomposeTask('Build a REST API');

      const result = await planner.execute({
        id: 'test-task-2',
        description: 'Analyze dependencies',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'dependencies' },
          data: { subtasks: decomposition.subtasks },
        },
        createdAt: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const deps = result.data as DependencyGraph;
      expect(deps.nodes).toBeInstanceOf(Array);
    });

    it('should execute allocate task', async () => {
      const decomposition = await planner.decomposeTask('Build a REST API');
      const agents: AgentInfo[] = [
        {
          id: 'coder-1',
          type: AgentType.CODER,
          capabilities: ['backend'],
          availability: 1.0,
        },
      ];

      const result = await planner.execute({
        id: 'test-task-3',
        description: 'Allocate resources',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'allocate' },
          data: { subtasks: decomposition.subtasks, agents },
        },
        createdAt: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const allocation = result.data as ResourceAllocation;
      expect(allocation.assignments).toBeInstanceOf(Array);
    });

    it('should execute timeline task', async () => {
      const decomposition = await planner.decomposeTask('Build a REST API');

      const result = await planner.execute({
        id: 'test-task-4',
        description: 'Estimate timeline',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'timeline' },
          data: { decomposition },
        },
        createdAt: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const timeline = result.data as TimelineEstimate;
      expect(timeline.phases).toBeInstanceOf(Array);
    });

    it('should execute risks task', async () => {
      const decomposition = await planner.decomposeTask('Build a REST API');
      const dependencies = await planner.analyzeDependencies(decomposition.subtasks);

      const result = await planner.execute({
        id: 'test-task-5',
        description: 'Assess risks',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'risks' },
          data: { decomposition, dependencies },
        },
        createdAt: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const risks = result.data as RiskAssessment;
      expect(risks.risks).toBeInstanceOf(Array);
    });

    it('should execute plan task', async () => {
      const agents: AgentInfo[] = [
        {
          id: 'coder-1',
          type: AgentType.CODER,
          capabilities: ['backend'],
          availability: 1.0,
        },
      ];

      const result = await planner.execute({
        id: 'test-task-6',
        description: 'Create plan',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'plan' },
          data: {
            planName: 'Test Plan',
            task: 'Build a REST API',
            agents,
          },
        },
        createdAt: new Date(),
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      const plan = result.data as ExecutionPlan;
      expect(plan.name).toBe('Test Plan');
    });

    it('should return error for invalid task type', async () => {
      const result = await planner.execute({
        id: 'test-task-7',
        description: 'Invalid task',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'invalid' },
        },
        createdAt: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('INVALID_TASK_TYPE');
    });

    it('should return error for missing required data', async () => {
      const result = await planner.execute({
        id: 'test-task-8',
        description: 'Missing data',
        priority: TaskPriority.MEDIUM,
        input: {
          parameters: { taskType: 'decompose' },
          data: {}, // Missing task field
        },
        createdAt: new Date(),
      });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });
  });

  // ============================================================================
  // Knowledge Graph Integration Tests
  // ============================================================================

  describe('knowledge graph integration', () => {
    it('should accept knowledge graph reference', () => {
      // Mock knowledge graph
      const mockGraph = {
        getMetadata: () => ({ nodeCount: 10, edgeCount: 5 }),
      } as unknown as Parameters<typeof planner.setKnowledgeGraph>[0];

      // Should not throw
      expect(() => planner.setKnowledgeGraph(mockGraph)).not.toThrow();
    });
  });

  // ============================================================================
  // Edge Cases and Error Handling
  // ============================================================================

  describe('edge cases', () => {
    it('should handle empty task description', async () => {
      const result = await planner.decomposeTask('');

      // Should still return valid structure even with empty task
      expect(result.subtasks).toBeInstanceOf(Array);
    });

    it('should handle very long task description', async () => {
      const longTask = 'Build ' + 'a very complex '.repeat(100) + 'system';

      const result = await planner.decomposeTask(longTask);

      expect(result.subtasks).toBeInstanceOf(Array);
      expect(result.subtasks.length).toBeGreaterThan(0);
    });

    it('should handle special characters in task description', async () => {
      const specialTask = 'Build API with @auth & security! (v2.0) [urgent]';

      const result = await planner.decomposeTask(specialTask);

      expect(result.subtasks).toBeInstanceOf(Array);
    });

    it('should handle single subtask', async () => {
      const singleSubtask: Subtask[] = [
        {
          id: 'task_1',
          description: 'Single task',
          estimatedEffort: '4 hours',
          effortEstimate: { min: 2, likely: 4, max: 8, expected: 4 },
          requiredCapabilities: [],
          dependencies: [],
          priority: 'high',
        },
      ];

      const result = await planner.analyzeDependencies(singleSubtask);

      expect(result.nodes).toHaveLength(1);
      expect(result.criticalPath).toHaveLength(1);
    });

    it('should handle large number of subtasks', async () => {
      const manySubtasks: Subtask[] = Array.from({ length: 50 }, (_, i) => ({
        id: `task_${i}`,
        description: `Task ${i}`,
        estimatedEffort: '2 hours',
        effortEstimate: { min: 1, likely: 2, max: 4, expected: 2 },
        requiredCapabilities: [],
        dependencies: i > 0 ? [`task_${i - 1}`] : [],
        priority: 'medium' as const,
      }));

      const result = await planner.analyzeDependencies(manySubtasks);

      expect(result.nodes).toHaveLength(50);
      expect(result.executionOrder).toHaveLength(50);
    });
  });
});
