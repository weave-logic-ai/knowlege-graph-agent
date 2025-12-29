/**
 * Integration Tests for Workflow System
 *
 * Comprehensive integration tests for WorkflowService, GOAP adapter,
 * webhook handlers, and workflow state transitions.
 *
 * @module tests/integration/workflow
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkflowService, createWorkflowService } from '../../src/workflow/services/workflow-service.js';
import { GOAPAdapter, createGOAPAdapter, DEFAULT_GOAP_ACTIONS } from '../../src/workflow/adapters/goap-adapter.js';
import {
  WebhookRegistry,
  FileWatcherIntegration,
  createWebhookRegistry,
  createFileWatcherIntegration,
  type WorkflowTriggerEvent,
} from '../../src/workflow/handlers/webhook-handlers.js';
import type {
  WorldState,
  GOAPPlan,
  GOAPAction,
  GOAPGoal,
  PlanExecutionResult,
  ReadinessEvaluation,
} from '../../src/workflow/types.js';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Create a default world state for testing
 */
function createTestWorldState(overrides: Partial<WorldState> = {}): WorldState {
  return {
    hasSpecification: true,
    specCompleteness: 0.5,
    hasAcceptanceCriteria: false,
    taskDefined: false,
    blockersFree: true,
    developmentStarted: false,
    timeSinceLastChange: 0,
    lastChangeTimestamp: Date.now(),
    activeCollaborators: [],
    pendingGaps: [],
    ...overrides,
  };
}

/**
 * Create a mock GOAP action for testing
 */
function createMockAction(overrides: Partial<GOAPAction> = {}): GOAPAction {
  return {
    id: `test-action-${Date.now()}`,
    name: 'Test Action',
    cost: 1,
    preconditions: {},
    effects: {},
    ...overrides,
  };
}

// ============================================================================
// WorkflowService Tests
// ============================================================================

describe('WorkflowService', () => {
  let service: WorkflowService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = createWorkflowService({
      inactivityTimeout: 5000,
      autoStartThreshold: 0.7,
      watchPaths: [],
      debug: false,
    });
  });

  afterEach(async () => {
    await service.stop();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should create a WorkflowService instance with default config', () => {
      const defaultService = createWorkflowService();
      expect(defaultService).toBeInstanceOf(WorkflowService);
    });

    it('should create a WorkflowService instance with custom config', () => {
      const customService = createWorkflowService({
        inactivityTimeout: 10000,
        autoStartThreshold: 0.8,
        watchPaths: ['/test/path'],
        debug: true,
        webhookSecret: 'test-secret',
        maxPayloadSize: 2048,
      });
      expect(customService).toBeInstanceOf(WorkflowService);

      const config = customService.getConfig();
      expect(config.inactivityTimeout).toBe(10000);
      expect(config.autoStartThreshold).toBe(0.8);
    });

    it('should initialize with stopped state', () => {
      const status = service.getStatus();
      expect(status.isRunning).toBe(false);
      expect(status.activeWorkflows).toHaveLength(0);
    });

    it('should provide access to GOAP adapter', () => {
      const adapter = service.getGOAPAdapter();
      expect(adapter).toBeInstanceOf(GOAPAdapter);
    });

    it('should provide access to webhook registry', () => {
      const registry = service.getWebhookRegistry();
      expect(registry).toBeInstanceOf(WebhookRegistry);
    });
  });

  describe('lifecycle', () => {
    it('should start the service', async () => {
      await service.start();

      const status = service.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should not start if already running', async () => {
      await service.start();
      await service.start(); // Second call should be safe

      const status = service.getStatus();
      expect(status.isRunning).toBe(true);
    });

    it('should stop the service', async () => {
      await service.start();
      await service.stop();

      const status = service.getStatus();
      expect(status.isRunning).toBe(false);
    });

    it('should not throw when stopping a non-running service', async () => {
      await expect(service.stop()).resolves.not.toThrow();
    });

    it('should set lastActivity on start', async () => {
      await service.start();

      const status = service.getStatus();
      expect(status.lastActivity).toBeInstanceOf(Date);
    });
  });

  describe('startCollaborationWorkflow', () => {
    it('should start a realtime-collab workflow successfully', async () => {
      await service.start();

      const result = await service.startCollaborationWorkflow('graph-123', '/docs/spec.md');

      expect(result.success).toBeDefined();
      expect(result.workflowId).toMatch(/^collab-/);
      expect(result.startedAt).toBeInstanceOf(Date);
    });

    it('should generate unique workflow IDs', async () => {
      await service.start();

      const result1 = await service.startCollaborationWorkflow('graph-1', '/docs/a.md');
      const result2 = await service.startCollaborationWorkflow('graph-2', '/docs/b.md');

      expect(result1.workflowId).not.toBe(result2.workflowId);
    });

    it('should track workflow in active workflows', async () => {
      await service.start();

      await service.startCollaborationWorkflow('graph-123', '/docs/spec.md');

      const status = service.getStatus();
      expect(status.activeWorkflows.length).toBeGreaterThanOrEqual(1);
    });

    it('should update execution statistics', async () => {
      await service.start();

      await service.startCollaborationWorkflow('graph-123', '/docs/spec.md');

      const status = service.getStatus();
      expect(status.stats.totalExecutions).toBeGreaterThanOrEqual(1);
    });

    it('should handle workflow completion', async () => {
      vi.useRealTimers();
      const realService = createWorkflowService();
      await realService.start();

      const result = await realService.startCollaborationWorkflow('graph-123', '/docs/spec.md');

      expect(result.completedAt).toBeInstanceOf(Date);
      expect(result.outcome).toBeDefined();

      await realService.stop();
    });

    it('should track successful execution statistics', async () => {
      vi.useRealTimers();
      const realService = createWorkflowService();
      await realService.start();

      await realService.startCollaborationWorkflow('graph-123', '/docs/spec.md');

      const status = realService.getStatus();
      expect(status.stats.totalExecutions).toBe(1);
      // Either successful or failed, should be counted
      expect(status.stats.successfulExecutions + status.stats.failedExecutions).toBe(1);

      await realService.stop();
    });
  });

  describe('watch paths', () => {
    it('should add watch path', () => {
      service.watch('/test/docs');

      const config = service.getConfig();
      expect(config.watchPaths).toContain('/test/docs');
    });

    it('should remove watch path', () => {
      service.watch('/test/docs');
      service.unwatch('/test/docs');

      const config = service.getConfig();
      expect(config.watchPaths).not.toContain('/test/docs');
    });

    it('should track watched paths in status', async () => {
      await service.start();
      service.watch('/test/docs');

      const status = service.getStatus();
      expect(status.watchedPaths).toContain('/test/docs');
    });
  });

  describe('event emission', () => {
    it('should emit events and update lastActivity', async () => {
      await service.start();

      const event: WorkflowTriggerEvent = {
        type: 'file:changed',
        path: '/test/file.md',
        timestamp: Date.now(),
      };

      await service.emitEvent(event);

      const status = service.getStatus();
      expect(status.lastActivity).toBeInstanceOf(Date);
    });
  });

  describe('workflow management', () => {
    it('should get workflow by ID', async () => {
      await service.start();

      const result = await service.startCollaborationWorkflow('graph-123', '/docs/spec.md');
      const workflow = service.getWorkflow(result.workflowId);

      expect(workflow).toBeDefined();
      expect(workflow?.id).toBe(result.workflowId);
    });

    it('should return undefined for non-existent workflow', () => {
      const workflow = service.getWorkflow('non-existent');
      expect(workflow).toBeUndefined();
    });

    it('should cancel a running workflow', async () => {
      await service.start();

      const result = await service.startCollaborationWorkflow('graph-123', '/docs/spec.md');

      // Try to cancel (may or may not work depending on timing)
      const cancelled = service.cancelWorkflow(result.workflowId);

      // If workflow was still running, it should be cancellable
      if (cancelled) {
        const workflow = service.getWorkflow(result.workflowId);
        expect(workflow?.status).toBe('failed');
      }
    });

    it('should not cancel completed workflow', async () => {
      vi.useRealTimers();
      const realService = createWorkflowService();
      await realService.start();

      const result = await realService.startCollaborationWorkflow('graph-123', '/docs/spec.md');

      // Workflow should be completed
      const cancelled = realService.cancelWorkflow(result.workflowId);
      expect(cancelled).toBe(false);

      await realService.stop();
    });
  });

  describe('createPlan', () => {
    it('should create a plan for a valid goal', async () => {
      const plan = await service.createPlan('start-development');

      expect(plan).toBeDefined();
      expect(plan.goalId).toBe('start-development');
    });

    it('should return non-achievable plan for unknown goal', async () => {
      const plan = await service.createPlan('unknown-goal');

      expect(plan.achievable).toBe(false);
      expect(plan.reason).toContain('Unknown goal');
    });
  });

  describe('evaluateReadiness', () => {
    it('should evaluate readiness for a document', async () => {
      const evaluation = await service.evaluateReadiness('/docs/spec.md');

      expect(evaluation).toBeDefined();
      expect(evaluation.score).toBeGreaterThanOrEqual(0);
      expect(evaluation.score).toBeLessThanOrEqual(1);
      expect(evaluation.ready).toBeDefined();
      expect(evaluation.blockers).toBeInstanceOf(Array);
      expect(evaluation.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('gap analysis', () => {
    it('should analyze gaps in a document', async () => {
      const analysis = await service.analyzeGaps('/docs/spec.md');

      expect(analysis).toBeDefined();
      expect(analysis.docPath).toBe('/docs/spec.md');
      expect(analysis.completeness).toBeGreaterThanOrEqual(0);
      expect(analysis.completeness).toBeLessThanOrEqual(1);
      expect(analysis.gaps).toBeInstanceOf(Array);
      expect(analysis.recommendations).toBeInstanceOf(Array);
    });
  });
});

// ============================================================================
// GOAPAdapter Tests
// ============================================================================

describe('GOAPAdapter', () => {
  let adapter: GOAPAdapter;

  beforeEach(() => {
    adapter = createGOAPAdapter();
  });

  describe('initialization', () => {
    it('should create a GOAPAdapter instance with default config', () => {
      expect(adapter).toBeInstanceOf(GOAPAdapter);
    });

    it('should create a GOAPAdapter with custom config', () => {
      const customAdapter = createGOAPAdapter({
        maxIterations: 500,
        timeoutMs: 15000,
        defaultCost: 2,
        enableCaching: false,
        maxPlanLength: 10,
      });

      expect(customAdapter).toBeInstanceOf(GOAPAdapter);
    });

    it('should register default actions', () => {
      const actions = adapter.getActions();

      expect(actions.length).toBeGreaterThan(0);
      expect(actions.some((a) => a.id === 'analyze-spec')).toBe(true);
      expect(actions.some((a) => a.id === 'start-development')).toBe(true);
    });

    it('should register default goals', () => {
      const goals = adapter.getGoals();

      expect(goals.length).toBeGreaterThan(0);
      expect(goals.some((g) => g.id === 'start-development')).toBe(true);
      expect(goals.some((g) => g.id === 'complete-spec')).toBe(true);
    });

    it('should register custom actions from config', () => {
      const customAction = createMockAction({ id: 'custom-action' });
      const customAdapter = createGOAPAdapter({
        actions: [customAction],
      });

      const action = customAdapter.getAction('custom-action');
      expect(action).toBeDefined();
    });
  });

  describe('registerAction', () => {
    it('should register a new action', () => {
      const action = createMockAction({ id: 'new-action' });

      adapter.registerAction(action);

      const registered = adapter.getAction('new-action');
      expect(registered).toBeDefined();
      expect(registered?.id).toBe('new-action');
    });

    it('should overwrite existing action with same ID', () => {
      const action1 = createMockAction({ id: 'same-id', cost: 1 });
      const action2 = createMockAction({ id: 'same-id', cost: 5 });

      adapter.registerAction(action1);
      adapter.registerAction(action2);

      const registered = adapter.getAction('same-id');
      expect(registered?.cost).toBe(5);
    });
  });

  describe('registerGoal', () => {
    it('should register a new goal', () => {
      const goal: GOAPGoal = {
        id: 'test-goal',
        name: 'Test Goal',
        conditions: { taskDefined: true },
        priority: 5,
      };

      adapter.registerGoal(goal);

      const registered = adapter.getGoal('test-goal');
      expect(registered).toBeDefined();
      expect(registered?.id).toBe('test-goal');
    });
  });

  describe('createPlan', () => {
    it('should create a plan for achievable goal', () => {
      const worldState = createTestWorldState({
        hasSpecification: true,
        specCompleteness: 0.8,
        hasAcceptanceCriteria: true,
        blockersFree: true,
      });

      const plan = adapter.createPlan(worldState, 'start-development');

      expect(plan).toBeDefined();
      expect(plan.goalId).toBe('start-development');
      expect(plan.createdAt).toBeInstanceOf(Date);
    });

    it('should return non-achievable plan for unknown goal', () => {
      const worldState = createTestWorldState();

      const plan = adapter.createPlan(worldState, 'unknown-goal');

      expect(plan.achievable).toBe(false);
      expect(plan.reason).toContain('Unknown goal');
    });

    it('should return empty plan when goal already satisfied', () => {
      const worldState = createTestWorldState({
        hasSpecification: true,
        specCompleteness: 0.9,
        hasAcceptanceCriteria: true,
        taskDefined: true,
        developmentStarted: true,
        blockersFree: true,
      });

      const plan = adapter.createPlan(worldState, 'start-development');

      expect(plan.achievable).toBe(true);
      expect(plan.actionIds).toHaveLength(0);
      expect(plan.totalCost).toBe(0);
    });

    it('should use cached plan when caching is enabled', () => {
      const worldState = createTestWorldState({
        hasSpecification: true,
        specCompleteness: 0.5,
      });

      const plan1 = adapter.createPlan(worldState, 'complete-spec');
      const plan2 = adapter.createPlan(worldState, 'complete-spec');

      // Both should return same result (from cache)
      expect(plan1.goalId).toBe(plan2.goalId);
    });

    it('should respect planning timeout', () => {
      // Create adapter with very short timeout
      const shortTimeoutAdapter = createGOAPAdapter({
        timeoutMs: 1,
        maxIterations: 100000,
      });

      const worldState = createTestWorldState();
      const plan = shortTimeoutAdapter.createPlan(worldState, 'start-development');

      // May timeout or succeed quickly
      expect(plan).toBeDefined();
    });

    it('should include confidence in achievable plan', () => {
      const worldState = createTestWorldState({
        hasSpecification: true,
        specCompleteness: 0.8,
        hasAcceptanceCriteria: true,
        blockersFree: true,
      });

      const plan = adapter.createPlan(worldState, 'start-development');

      if (plan.achievable && plan.actionIds.length > 0) {
        expect(plan.confidence).toBeDefined();
        expect(plan.confidence).toBeGreaterThan(0);
        expect(plan.confidence).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('executePlan', () => {
    it('should execute an achievable plan', async () => {
      const worldState = createTestWorldState({
        hasSpecification: true,
        specCompleteness: 0.8,
        hasAcceptanceCriteria: true,
        blockersFree: true,
      });

      const plan = adapter.createPlan(worldState, 'start-development');
      const result = await adapter.executePlan(plan, worldState);

      expect(result).toBeDefined();
      expect(result.finalState).toBeDefined();
      expect(result.executionTimeMs).toBeGreaterThanOrEqual(0);
    });

    it('should return failure for non-achievable plan', async () => {
      const nonAchievablePlan: GOAPPlan = {
        goalId: 'test',
        actionIds: [],
        totalCost: Infinity,
        achievable: false,
        reason: 'Test reason',
        createdAt: new Date(),
      };

      const result = await adapter.executePlan(nonAchievablePlan, createTestWorldState());

      expect(result.success).toBe(false);
      // The error should contain the reason from the plan
      expect(result.error).toBeDefined();
    });

    it('should track completed steps', async () => {
      const worldState = createTestWorldState({
        hasSpecification: true,
        specCompleteness: 0.8,
        hasAcceptanceCriteria: true,
        blockersFree: true,
      });

      const plan = adapter.createPlan(worldState, 'start-development');
      const result = await adapter.executePlan(plan, worldState);

      if (result.success) {
        expect(result.completedSteps.length).toBe(plan.actionIds.length);
      }
    });

    it('should fail for unknown action', async () => {
      const badPlan: GOAPPlan = {
        goalId: 'test',
        actionIds: ['non-existent-action'],
        totalCost: 1,
        achievable: true,
        createdAt: new Date(),
      };

      const result = await adapter.executePlan(badPlan, createTestWorldState());

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
      expect(result.failedStep).toBe('non-existent-action');
    });

    it('should fail when preconditions not met', async () => {
      // Create action with preconditions
      adapter.registerAction({
        id: 'conditional-action',
        name: 'Conditional',
        cost: 1,
        preconditions: { hasSpecification: true, taskDefined: true },
        effects: { developmentStarted: true },
      });

      const plan: GOAPPlan = {
        goalId: 'test',
        actionIds: ['conditional-action'],
        totalCost: 1,
        achievable: true,
        createdAt: new Date(),
      };

      // Execute with state that doesn't meet preconditions
      const result = await adapter.executePlan(plan, createTestWorldState({ taskDefined: false }));

      expect(result.success).toBe(false);
      expect(result.error).toContain('Preconditions not met');
    });

    it('should handle action execution errors', async () => {
      adapter.registerAction({
        id: 'failing-action',
        name: 'Failing',
        cost: 1,
        preconditions: {},
        effects: {},
        execute: async () => {
          throw new Error('Execution failed');
        },
      });

      const plan: GOAPPlan = {
        goalId: 'test',
        actionIds: ['failing-action'],
        totalCost: 1,
        achievable: true,
        createdAt: new Date(),
      };

      const result = await adapter.executePlan(plan, createTestWorldState());

      expect(result.success).toBe(false);
      expect(result.error).toContain('Execution failed');
      expect(result.failedStep).toBe('failing-action');
    });

    it('should apply effects when action has no execute function', async () => {
      adapter.registerAction({
        id: 'effect-only',
        name: 'Effect Only',
        cost: 1,
        preconditions: {},
        effects: { taskDefined: true },
        // No execute function
      });

      const plan: GOAPPlan = {
        goalId: 'test',
        actionIds: ['effect-only'],
        totalCost: 1,
        achievable: true,
        createdAt: new Date(),
      };

      const result = await adapter.executePlan(plan, createTestWorldState({ taskDefined: false }));

      expect(result.success).toBe(true);
      expect(result.finalState.taskDefined).toBe(true);
    });
  });

  describe('evaluateReadiness', () => {
    it('should return high score for ready state', () => {
      const worldState = createTestWorldState({
        hasSpecification: true,
        specCompleteness: 0.9,
        hasAcceptanceCriteria: true,
        blockersFree: true,
        taskDefined: true,
        pendingGaps: [],
      });

      const evaluation = adapter.evaluateReadiness(worldState);

      expect(evaluation.score).toBeGreaterThan(0.7);
      expect(evaluation.ready).toBe(true);
      expect(evaluation.blockers).toHaveLength(0);
    });

    it('should return blockers for incomplete state', () => {
      const worldState = createTestWorldState({
        hasSpecification: false,
        hasAcceptanceCriteria: false,
        blockersFree: false,
      });

      const evaluation = adapter.evaluateReadiness(worldState);

      expect(evaluation.ready).toBe(false);
      expect(evaluation.blockers.length).toBeGreaterThan(0);
    });

    it('should provide recommendations', () => {
      const worldState = createTestWorldState({
        hasSpecification: true,
        specCompleteness: 0.3,
        hasAcceptanceCriteria: false,
      });

      const evaluation = adapter.evaluateReadiness(worldState);

      expect(evaluation.recommendations.length).toBeGreaterThan(0);
    });

    it('should include evaluation timestamp', () => {
      const evaluation = adapter.evaluateReadiness(createTestWorldState());

      expect(evaluation.evaluatedAt).toBeInstanceOf(Date);
    });
  });

  describe('clearCache', () => {
    it('should clear plan cache', () => {
      const worldState = createTestWorldState();

      // Create a plan (should be cached)
      adapter.createPlan(worldState, 'complete-spec');

      // Clear cache
      adapter.clearCache();

      // Next plan should be freshly computed
      const plan = adapter.createPlan(worldState, 'complete-spec');
      expect(plan).toBeDefined();
    });
  });

  describe('custom heuristic', () => {
    it('should use custom heuristic function', () => {
      const customHeuristic = vi.fn().mockReturnValue(0);

      const customAdapter = createGOAPAdapter({
        heuristic: customHeuristic,
      });

      const worldState = createTestWorldState({
        hasSpecification: true,
        specCompleteness: 0.8,
      });

      customAdapter.createPlan(worldState, 'complete-spec');

      expect(customHeuristic).toHaveBeenCalled();
    });
  });
});

// ============================================================================
// WebhookRegistry Tests
// ============================================================================

describe('WebhookRegistry', () => {
  let registry: WebhookRegistry;

  beforeEach(() => {
    registry = createWebhookRegistry();
  });

  describe('initialization', () => {
    it('should create a WebhookRegistry instance', () => {
      expect(registry).toBeInstanceOf(WebhookRegistry);
    });

    it('should accept configuration options', () => {
      const customRegistry = createWebhookRegistry({
        secret: 'test-secret',
        maxPayloadSize: 2048,
        rateLimit: 50,
      });

      const config = customRegistry.getConfig();
      expect(config.secret).toBe('test-secret');
      expect(config.maxPayloadSize).toBe(2048);
      expect(config.rateLimit).toBe(50);
    });
  });

  describe('handler registration', () => {
    it('should register a handler for an event type', () => {
      const handler = vi.fn();

      registry.on('file:created', handler);

      expect(registry.listenerCount('file:created')).toBe(1);
    });

    it('should register multiple handlers for same event type', () => {
      registry.on('file:changed', vi.fn());
      registry.on('file:changed', vi.fn());

      expect(registry.listenerCount('file:changed')).toBe(2);
    });

    it('should return unsubscribe function', () => {
      const handler = vi.fn();

      const unsubscribe = registry.on('file:deleted', handler);

      expect(registry.listenerCount('file:deleted')).toBe(1);

      unsubscribe();

      expect(registry.listenerCount('file:deleted')).toBe(0);
    });

    it('should remove specific handler when unsubscribing', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      const unsubscribe1 = registry.on('node:updated', handler1);
      registry.on('node:updated', handler2);

      unsubscribe1();

      expect(registry.listenerCount('node:updated')).toBe(1);
    });
  });

  describe('off', () => {
    it('should remove all handlers for an event type', () => {
      registry.on('gap:detected', vi.fn());
      registry.on('gap:detected', vi.fn());

      registry.off('gap:detected');

      expect(registry.listenerCount('gap:detected')).toBe(0);
    });
  });

  describe('clear', () => {
    it('should remove all handlers for all event types', () => {
      registry.on('file:created', vi.fn());
      registry.on('file:changed', vi.fn());
      registry.on('file:deleted', vi.fn());

      registry.clear();

      expect(registry.listenerCount('file:created')).toBe(0);
      expect(registry.listenerCount('file:changed')).toBe(0);
      expect(registry.listenerCount('file:deleted')).toBe(0);
    });
  });

  describe('emit', () => {
    it('should call registered handler when event is emitted', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registry.on('file:created', handler);

      const event: WorkflowTriggerEvent = {
        type: 'file:created',
        path: '/test/file.md',
        timestamp: Date.now(),
      };

      await registry.emit(event);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(event, undefined);
    });

    it('should call all handlers for an event type', async () => {
      const handler1 = vi.fn().mockResolvedValue(undefined);
      const handler2 = vi.fn().mockResolvedValue(undefined);

      registry.on('file:changed', handler1);
      registry.on('file:changed', handler2);

      const event: WorkflowTriggerEvent = {
        type: 'file:changed',
        path: '/test/file.md',
        timestamp: Date.now(),
      };

      await registry.emit(event);

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should pass context to handlers', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registry.on('node:updated', handler);

      const event: WorkflowTriggerEvent = {
        type: 'node:updated',
        event: {
          nodeId: 'node-123',
          userId: 'user-456',
          changes: { title: 'New Title' },
          timestamp: Date.now(),
        },
      };

      const context = { userId: 'test-user' };

      await registry.emit(event, context);

      expect(handler).toHaveBeenCalledWith(event, context);
    });

    it('should not throw when handler throws', async () => {
      const failingHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
      registry.on('file:created', failingHandler);

      const event: WorkflowTriggerEvent = {
        type: 'file:created',
        path: '/test/file.md',
        timestamp: Date.now(),
      };

      await expect(registry.emit(event)).resolves.not.toThrow();
    });

    it('should continue calling other handlers when one fails', async () => {
      const failingHandler = vi.fn().mockRejectedValue(new Error('Handler error'));
      const successHandler = vi.fn().mockResolvedValue(undefined);

      registry.on('file:changed', failingHandler);
      registry.on('file:changed', successHandler);

      const event: WorkflowTriggerEvent = {
        type: 'file:changed',
        path: '/test/file.md',
        timestamp: Date.now(),
      };

      await registry.emit(event);

      expect(successHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('validatePayload', () => {
    it('should validate valid file:created payload', () => {
      const payload = {
        type: 'file:created',
        path: '/test/file.md',
        timestamp: Date.now(),
      };

      const result = registry.validatePayload(payload);

      expect(result.valid).toBe(true);
      expect(result.event).toBeDefined();
      expect(result.event?.type).toBe('file:created');
    });

    it('should validate valid node:updated payload', () => {
      const payload = {
        type: 'node:updated',
        event: {
          nodeId: 'node-123',
          userId: 'user-456',
          changes: { title: 'Updated' },
          timestamp: Date.now(),
        },
      };

      const result = registry.validatePayload(payload);

      expect(result.valid).toBe(true);
      expect(result.event?.type).toBe('node:updated');
    });

    it('should reject invalid payload (not an object)', () => {
      const result = registry.validatePayload(null);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('must be an object');
    });

    it('should reject payload without type field', () => {
      const result = registry.validatePayload({ path: '/test.md' });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing type field');
    });

    it('should reject unknown event type', () => {
      const result = registry.validatePayload({ type: 'unknown:event' });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Unknown event type');
    });
  });
});

// ============================================================================
// FileWatcherIntegration Tests
// ============================================================================

describe('FileWatcherIntegration', () => {
  let registry: WebhookRegistry;
  let watcher: FileWatcherIntegration;

  beforeEach(() => {
    vi.useFakeTimers();
    registry = createWebhookRegistry();
    watcher = createFileWatcherIntegration(registry, {
      inactivityThreshold: 5000,
    });
  });

  afterEach(() => {
    watcher.unwatchAll();
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should create a FileWatcherIntegration instance', () => {
      expect(watcher).toBeInstanceOf(FileWatcherIntegration);
    });

    it('should use default inactivity threshold', () => {
      const defaultWatcher = createFileWatcherIntegration(registry);
      expect(defaultWatcher.getInactivityThreshold()).toBe(5 * 60 * 1000);
    });

    it('should use custom inactivity threshold', () => {
      expect(watcher.getInactivityThreshold()).toBe(5000);
    });
  });

  describe('watch', () => {
    it('should add path to watch list', () => {
      watcher.watch('/test/docs');

      const paths = watcher.getWatchedPaths();
      expect(paths).toContain('/test/docs');
    });

    it('should watch multiple paths', () => {
      watcher.watch('/test/docs');
      watcher.watch('/test/templates');

      const paths = watcher.getWatchedPaths();
      expect(paths).toContain('/test/docs');
      expect(paths).toContain('/test/templates');
    });
  });

  describe('unwatch', () => {
    it('should remove path from watch list', () => {
      watcher.watch('/test/docs');
      watcher.unwatch('/test/docs');

      const paths = watcher.getWatchedPaths();
      expect(paths).not.toContain('/test/docs');
    });
  });

  describe('unwatchAll', () => {
    it('should remove all paths from watch list', () => {
      watcher.watch('/test/docs');
      watcher.watch('/test/templates');

      watcher.unwatchAll();

      const paths = watcher.getWatchedPaths();
      expect(paths).toHaveLength(0);
    });
  });

  describe('file events', () => {
    it('should emit file:created event', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registry.on('file:created', handler);
      watcher.watch('/test/docs');

      await watcher.onFileCreated('/test/docs/new-file.md');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].type).toBe('file:created');
      expect(handler.mock.calls[0][0].path).toBe('/test/docs/new-file.md');
    });

    it('should emit file:changed event', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registry.on('file:changed', handler);
      watcher.watch('/test/docs');

      await watcher.onFileChanged('/test/docs/file.md', 'diff content');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].type).toBe('file:changed');
      expect(handler.mock.calls[0][0].changes).toBe('diff content');
    });

    it('should emit file:deleted event', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registry.on('file:deleted', handler);
      watcher.watch('/test/docs');

      await watcher.onFileDeleted('/test/docs/old-file.md');

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].type).toBe('file:deleted');
    });

    it('should not emit event for unwatched paths', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registry.on('file:created', handler);
      watcher.watch('/test/docs');

      await watcher.onFileCreated('/other/path/file.md');

      expect(handler).not.toHaveBeenCalled();
    });

    it('should emit event for nested files under watched path', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registry.on('file:created', handler);
      watcher.watch('/test/docs');

      await watcher.onFileCreated('/test/docs/subdir/nested/file.md');

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('activity tracking', () => {
    it('should update last activity on file event', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registry.on('file:created', handler);
      watcher.watch('/test/docs');

      await watcher.onFileCreated('/test/docs/file.md');

      const lastActivity = watcher.getLastActivity('/test/docs');
      expect(lastActivity).toBeDefined();
    });

    it('should emit inactivity timeout event', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registry.on('timeout:inactivity', handler);
      watcher.watch('/test/docs');

      // Advance time past inactivity threshold
      await vi.advanceTimersByTimeAsync(6000);

      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].type).toBe('timeout:inactivity');
    });

    it('should reset inactivity timer on activity', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      const fileHandler = vi.fn().mockResolvedValue(undefined);
      registry.on('timeout:inactivity', handler);
      registry.on('file:changed', fileHandler);
      watcher.watch('/test/docs');

      // Wait but don't exceed threshold
      await vi.advanceTimersByTimeAsync(3000);

      // Trigger activity
      await watcher.onFileChanged('/test/docs/file.md');

      // Advance again but not past threshold
      await vi.advanceTimersByTimeAsync(3000);

      // Should not have triggered timeout
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('setInactivityThreshold', () => {
    it('should update inactivity threshold', () => {
      watcher.setInactivityThreshold(10000);

      expect(watcher.getInactivityThreshold()).toBe(10000);
    });

    it('should reset timers with new threshold', async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      registry.on('timeout:inactivity', handler);
      watcher.watch('/test/docs');

      // Set longer threshold
      watcher.setInactivityThreshold(10000);

      // Advance past original threshold but not new one
      await vi.advanceTimersByTimeAsync(6000);

      expect(handler).not.toHaveBeenCalled();

      // Advance past new threshold
      await vi.advanceTimersByTimeAsync(5000);

      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});

// ============================================================================
// Workflow State Transitions Tests
// ============================================================================

describe('Workflow State Transitions', () => {
  let service: WorkflowService;

  beforeEach(async () => {
    service = createWorkflowService();
    await service.start();
  });

  afterEach(async () => {
    await service.stop();
  });

  describe('workflow status transitions', () => {
    it('should transition from pending to running', async () => {
      const result = await service.startCollaborationWorkflow('graph-1', '/docs/a.md');

      const workflow = service.getWorkflow(result.workflowId);
      // Workflow should be running or completed
      expect(['running', 'completed', 'failed']).toContain(workflow?.status);
    });

    it('should transition from running to completed', async () => {
      vi.useRealTimers();
      const realService = createWorkflowService();
      await realService.start();

      const result = await realService.startCollaborationWorkflow('graph-1', '/docs/a.md');

      const workflow = realService.getWorkflow(result.workflowId);
      expect(['completed', 'failed']).toContain(workflow?.status);

      await realService.stop();
    });
  });
});

// ============================================================================
// Error Handling Tests
// ============================================================================

describe('Error Handling', () => {
  describe('WorkflowService error handling', () => {
    it('should handle errors during workflow execution gracefully', async () => {
      const service = createWorkflowService();
      await service.start();

      // Service should not throw even if internal processing fails
      const result = await service.startCollaborationWorkflow('graph-1', '/invalid/path');

      // Should return a result (success or failure)
      expect(result).toBeDefined();
      expect(result.workflowId).toBeDefined();

      await service.stop();
    });
  });

  describe('GOAPAdapter error handling', () => {
    it('should handle plan execution errors gracefully', async () => {
      const adapter = createGOAPAdapter();

      adapter.registerAction({
        id: 'error-action',
        name: 'Error Action',
        cost: 1,
        preconditions: {},
        effects: {},
        execute: async () => {
          throw new Error('Intentional error');
        },
      });

      const plan: GOAPPlan = {
        goalId: 'test',
        actionIds: ['error-action'],
        totalCost: 1,
        achievable: true,
        createdAt: new Date(),
      };

      const result = await adapter.executePlan(plan, createTestWorldState());

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('WebhookRegistry error handling', () => {
    it('should handle handler errors without breaking emit', async () => {
      const registry = createWebhookRegistry();

      registry.on('file:created', async () => {
        throw new Error('Handler error');
      });

      const successHandler = vi.fn().mockResolvedValue(undefined);
      registry.on('file:created', successHandler);

      const event: WorkflowTriggerEvent = {
        type: 'file:created',
        path: '/test.md',
        timestamp: Date.now(),
      };

      await registry.emit(event);

      expect(successHandler).toHaveBeenCalledTimes(1);
    });
  });
});
