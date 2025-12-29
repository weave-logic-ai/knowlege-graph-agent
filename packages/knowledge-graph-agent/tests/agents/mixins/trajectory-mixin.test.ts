/**
 * Tests for TrajectoryMixin
 *
 * Tests for the trajectory tracking mixin that can be applied to agents.
 *
 * @module tests/agents/mixins/trajectory-mixin
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  applyTrajectoryMixin,
  TrajectoryWrapper,
  createTrajectoryWrapper,
  hasTrajectoryCapability,
  type TrajectoryCapable,
} from '../../../src/agents/mixins/trajectory-mixin.js';
import {
  TrajectoryTracker,
  createTrajectoryTracker,
} from '../../../src/learning/services/trajectory-tracker.js';
import {
  ReasoningBankAdapter,
} from '../../../src/integrations/agentic-flow/adapters/reasoning-bank-adapter.js';

// ============================================================================
// Test Fixtures
// ============================================================================

/**
 * Simple base class for testing mixins
 */
class SimpleAgent {
  name: string;
  config: { id: string; type: string };

  constructor(name: string) {
    this.name = name;
    this.config = { id: `agent-${name}`, type: 'test-agent' };
  }

  greet(): string {
    return `Hello from ${this.name}`;
  }
}

/**
 * Create a trajectory-enabled agent class
 */
const TrajectoryEnabledAgent = applyTrajectoryMixin(SimpleAgent);

// ============================================================================
// Tests
// ============================================================================

describe('TrajectoryMixin', () => {
  let tracker: TrajectoryTracker;
  let reasoningBank: ReasoningBankAdapter;

  beforeEach(async () => {
    reasoningBank = new ReasoningBankAdapter();
    await reasoningBank.initialize();
    tracker = createTrajectoryTracker(reasoningBank);
  });

  afterEach(async () => {
    tracker.clearActive();
    await reasoningBank.clear();
  });

  // ============================================================================
  // applyTrajectoryMixin Tests
  // ============================================================================

  describe('applyTrajectoryMixin', () => {
    it('should create a class with trajectory capabilities', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');

      expect(agent).toHaveProperty('trajectoryTracker');
      expect(agent).toHaveProperty('currentTrajectoryId');
      expect(typeof agent.setTrajectoryTracker).toBe('function');
      expect(typeof agent.startTaskTrajectory).toBe('function');
      expect(typeof agent.recordTrajectoryStep).toBe('function');
      expect(typeof agent.completeTaskTrajectory).toBe('function');
    });

    it('should preserve base class functionality', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');

      expect(agent.name).toBe('TestAgent');
      expect(agent.greet()).toBe('Hello from TestAgent');
      expect(agent.config).toEqual({ id: 'agent-TestAgent', type: 'test-agent' });
    });

    it('should initialize trajectory properties as null', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');

      expect(agent.trajectoryTracker).toBeNull();
      expect(agent.currentTrajectoryId).toBeNull();
    });

    it('should accept custom mixin config', () => {
      const CustomAgent = applyTrajectoryMixin(SimpleAgent, {
        autoStartOnTask: false,
        autoCompleteOnTask: false,
        defaultMetadata: { source: 'custom' },
      });

      const agent = new CustomAgent('Custom');
      agent.setTrajectoryTracker(tracker);

      expect(agent.getTrajectoryMixinConfig().autoStartOnTask).toBe(false);
      expect(agent.getTrajectoryMixinConfig().defaultMetadata).toEqual({ source: 'custom' });
    });
  });

  // ============================================================================
  // setTrajectoryTracker Tests
  // ============================================================================

  describe('setTrajectoryTracker', () => {
    it('should set the trajectory tracker', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');

      agent.setTrajectoryTracker(tracker);

      expect(agent.trajectoryTracker).toBe(tracker);
    });

    it('should allow replacing tracker', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      const tracker2 = createTrajectoryTracker(null);

      agent.setTrajectoryTracker(tracker);
      agent.setTrajectoryTracker(tracker2);

      expect(agent.trajectoryTracker).toBe(tracker2);
    });
  });

  // ============================================================================
  // startTaskTrajectory Tests
  // ============================================================================

  describe('startTaskTrajectory', () => {
    it('should start a trajectory', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);

      agent.startTaskTrajectory('task-123');

      expect(agent.currentTrajectoryId).toBeDefined();
      expect(agent.currentTrajectoryId).toMatch(/^traj-task-123-/);
    });

    it('should do nothing without tracker', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');

      agent.startTaskTrajectory('task-123');

      expect(agent.currentTrajectoryId).toBeNull();
    });

    it('should include default metadata from config', () => {
      const CustomAgent = applyTrajectoryMixin(SimpleAgent, {
        defaultMetadata: { environment: 'test' },
      });
      const agent = new CustomAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);

      agent.startTaskTrajectory('task-123', { priority: 'high' });

      const activeTrajectory = tracker.getActiveTrajectory(agent.currentTrajectoryId!);
      expect(activeTrajectory?.metadata).toMatchObject({
        environment: 'test',
        priority: 'high',
      });
    });

    it('should include agent info from config', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);

      agent.startTaskTrajectory('task-123');

      const activeTrajectory = tracker.getActiveTrajectory(agent.currentTrajectoryId!);
      expect(activeTrajectory?.metadata).toMatchObject({
        agentId: 'agent-TestAgent',
        agentType: 'test-agent',
      });
    });
  });

  // ============================================================================
  // recordTrajectoryStep Tests
  // ============================================================================

  describe('recordTrajectoryStep', () => {
    it('should record a step in the trajectory', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);
      agent.startTaskTrajectory('task-123');

      agent.recordTrajectoryStep('analyze', 'Found 5 issues');

      const progress = agent.getTrajectoryProgress();
      expect(progress?.stepCount).toBe(1);
      expect(progress?.lastStep?.action).toBe('analyze');
      expect(progress?.lastStep?.observation).toBe('Found 5 issues');
    });

    it('should include confidence score', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);
      agent.startTaskTrajectory('task-123');

      agent.recordTrajectoryStep('validate', 'Validation passed', 0.95);

      const progress = agent.getTrajectoryProgress();
      expect(progress?.lastStep?.confidence).toBe(0.95);
    });

    it('should include metadata', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);
      agent.startTaskTrajectory('task-123');

      agent.recordTrajectoryStep('fix', 'Applied fix', 0.9, { filesChanged: 2 });

      const progress = agent.getTrajectoryProgress();
      expect(progress?.lastStep?.metadata).toEqual({ filesChanged: 2 });
    });

    it('should do nothing without active trajectory', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);

      // No trajectory started
      agent.recordTrajectoryStep('test', 'Testing');

      // Should not throw, just do nothing
      expect(agent.currentTrajectoryId).toBeNull();
    });

    it('should do nothing without tracker', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');

      // No tracker set
      agent.recordTrajectoryStep('test', 'Testing');

      // Should not throw
      expect(agent.trajectoryTracker).toBeNull();
    });
  });

  // ============================================================================
  // completeTaskTrajectory Tests
  // ============================================================================

  describe('completeTaskTrajectory', () => {
    it('should complete and store trajectory', async () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);
      agent.startTaskTrajectory('task-123');
      agent.recordTrajectoryStep('step1', 'First step');
      agent.recordTrajectoryStep('step2', 'Second step');

      const storedId = await agent.completeTaskTrajectory('success');

      expect(storedId).toBeDefined();
      expect(agent.currentTrajectoryId).toBeNull();
    });

    it('should include final metadata', async () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);
      agent.startTaskTrajectory('task-123');
      agent.recordTrajectoryStep('step1', 'Done');
      agent.recordTrajectoryStep('step2', 'Done');

      await agent.completeTaskTrajectory('success', { quality: 0.95 });

      // Verify trajectory was stored (via ReasoningBank)
      const stats = await reasoningBank.getStats();
      expect(stats.trajectories).toBeGreaterThan(0);
    });

    it('should handle failure outcome', async () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);
      agent.startTaskTrajectory('task-123');
      agent.recordTrajectoryStep('attempt', 'Failed attempt');
      agent.recordTrajectoryStep('error', 'Error occurred');

      const storedId = await agent.completeTaskTrajectory('failure', {
        errorCode: 'ERR_123',
      });

      expect(storedId).toBeDefined();
    });

    it('should return null without active trajectory', async () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);

      const storedId = await agent.completeTaskTrajectory('success');

      expect(storedId).toBeNull();
    });
  });

  // ============================================================================
  // abortTaskTrajectory Tests
  // ============================================================================

  describe('abortTaskTrajectory', () => {
    it('should abort trajectory without storing', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);
      agent.startTaskTrajectory('task-123');
      agent.recordTrajectoryStep('attempt', 'Started');

      agent.abortTaskTrajectory('User cancelled');

      expect(agent.currentTrajectoryId).toBeNull();
    });

    it('should do nothing without active trajectory', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);

      // Should not throw
      agent.abortTaskTrajectory('reason');

      expect(agent.currentTrajectoryId).toBeNull();
    });
  });

  // ============================================================================
  // isTrackingTrajectory Tests
  // ============================================================================

  describe('isTrackingTrajectory', () => {
    it('should return true when trajectory is active', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);
      agent.startTaskTrajectory('task-123');

      expect(agent.isTrackingTrajectory()).toBe(true);
    });

    it('should return false when no trajectory', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);

      expect(agent.isTrackingTrajectory()).toBe(false);
    });

    it('should return false after completion', async () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);
      agent.startTaskTrajectory('task-123');
      agent.recordTrajectoryStep('step1', 'Done');
      agent.recordTrajectoryStep('step2', 'Done');

      await agent.completeTaskTrajectory('success');

      expect(agent.isTrackingTrajectory()).toBe(false);
    });
  });

  // ============================================================================
  // getTrajectoryProgress Tests
  // ============================================================================

  describe('getTrajectoryProgress', () => {
    it('should return progress info', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);
      agent.startTaskTrajectory('task-123');
      agent.recordTrajectoryStep('step1', 'First');
      agent.recordTrajectoryStep('step2', 'Second');

      const progress = agent.getTrajectoryProgress();

      expect(progress?.stepCount).toBe(2);
      expect(progress?.duration).toBeGreaterThanOrEqual(0);
      expect(progress?.lastStep?.action).toBe('step2');
    });

    it('should return null without active trajectory', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');
      agent.setTrajectoryTracker(tracker);

      const progress = agent.getTrajectoryProgress();

      expect(progress).toBeNull();
    });
  });

  // ============================================================================
  // TrajectoryWrapper Tests
  // ============================================================================

  describe('TrajectoryWrapper', () => {
    it('should create wrapper without tracker', () => {
      const wrapper = new TrajectoryWrapper();

      expect(wrapper.trajectoryTracker).toBeNull();
      expect(wrapper.currentTrajectoryId).toBeNull();
    });

    it('should create wrapper with tracker', () => {
      const wrapper = new TrajectoryWrapper(tracker);

      expect(wrapper.trajectoryTracker).toBe(tracker);
    });

    it('should implement TrajectoryCapable interface', () => {
      const wrapper = new TrajectoryWrapper(tracker);

      expect(hasTrajectoryCapability(wrapper)).toBe(true);
    });

    it('should track trajectories', async () => {
      const wrapper = new TrajectoryWrapper(tracker);

      wrapper.startTaskTrajectory('task-456');
      wrapper.recordTrajectoryStep('analyze', 'Analyzing');
      wrapper.recordTrajectoryStep('complete', 'Done');

      expect(wrapper.isTrackingTrajectory()).toBe(true);
      expect(wrapper.getTrajectoryProgress()?.stepCount).toBe(2);

      await wrapper.completeTaskTrajectory('success');
      expect(wrapper.isTrackingTrajectory()).toBe(false);
    });

    it('should use factory function', () => {
      const wrapper = createTrajectoryWrapper(tracker);

      expect(wrapper).toBeInstanceOf(TrajectoryWrapper);
      expect(wrapper.trajectoryTracker).toBe(tracker);
    });

    it('should handle abort', () => {
      const wrapper = new TrajectoryWrapper(tracker);
      wrapper.startTaskTrajectory('task-789');
      wrapper.recordTrajectoryStep('start', 'Started');

      wrapper.abortTaskTrajectory('cancelled');

      expect(wrapper.isTrackingTrajectory()).toBe(false);
    });
  });

  // ============================================================================
  // hasTrajectoryCapability Tests
  // ============================================================================

  describe('hasTrajectoryCapability', () => {
    it('should return true for trajectory-enabled agent', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');

      expect(hasTrajectoryCapability(agent)).toBe(true);
    });

    it('should return true for TrajectoryWrapper', () => {
      const wrapper = new TrajectoryWrapper();

      expect(hasTrajectoryCapability(wrapper)).toBe(true);
    });

    it('should return false for plain objects', () => {
      expect(hasTrajectoryCapability({})).toBe(false);
      expect(hasTrajectoryCapability({ trajectoryTracker: null })).toBe(false);
    });

    it('should return false for null/undefined', () => {
      expect(hasTrajectoryCapability(null)).toBe(false);
      expect(hasTrajectoryCapability(undefined)).toBe(false);
    });

    it('should return false for base class without mixin', () => {
      const agent = new SimpleAgent('Plain');

      expect(hasTrajectoryCapability(agent)).toBe(false);
    });
  });

  // ============================================================================
  // Config Management Tests
  // ============================================================================

  describe('config management', () => {
    it('should get mixin config copy', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');

      const config = agent.getTrajectoryMixinConfig();
      config.autoStartOnTask = false;

      expect(agent.getTrajectoryMixinConfig().autoStartOnTask).toBe(true);
    });

    it('should update mixin config', () => {
      const agent = new TrajectoryEnabledAgent('TestAgent');

      agent.updateTrajectoryMixinConfig({ autoCompleteOnTask: false });

      expect(agent.getTrajectoryMixinConfig().autoCompleteOnTask).toBe(false);
      expect(agent.getTrajectoryMixinConfig().autoStartOnTask).toBe(true);
    });
  });
});
