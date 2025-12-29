/**
 * Tests for TrajectoryTracker Service
 *
 * Tests for tracking task execution trajectories for learning
 * and verdict judgment purposes.
 *
 * @module tests/learning/services/trajectory-tracker
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  TrajectoryTracker,
  createTrajectoryTracker,
  type TrajectoryTrackerConfig,
} from '../../../src/learning/services/trajectory-tracker.js';
import {
  ReasoningBankAdapter,
  type TrajectoryStep,
} from '../../../src/integrations/agentic-flow/adapters/reasoning-bank-adapter.js';

describe('TrajectoryTracker', () => {
  let tracker: TrajectoryTracker;
  let reasoningBank: ReasoningBankAdapter;

  beforeEach(async () => {
    reasoningBank = new ReasoningBankAdapter();
    await reasoningBank.initialize();
    tracker = new TrajectoryTracker(reasoningBank);
  });

  afterEach(async () => {
    tracker.clearActive();
    await reasoningBank.clear();
  });

  // ============================================================================
  // Initialization Tests
  // ============================================================================

  describe('initialization', () => {
    it('should create tracker with default config', () => {
      const defaultTracker = new TrajectoryTracker(null);
      expect(defaultTracker).toBeInstanceOf(TrajectoryTracker);
      expect(defaultTracker.isEnabled()).toBe(true);
    });

    it('should create tracker with custom config', () => {
      const config: Partial<TrajectoryTrackerConfig> = {
        enabled: false,
        autoStore: false,
        minStepsToStore: 5,
      };

      const customTracker = new TrajectoryTracker(null, config);
      expect(customTracker.isEnabled()).toBe(false);
      expect(customTracker.getConfig().minStepsToStore).toBe(5);
    });

    it('should accept null ReasoningBank', () => {
      const nullTracker = new TrajectoryTracker(null);
      expect(nullTracker).toBeInstanceOf(TrajectoryTracker);
    });

    it('should use factory function', () => {
      const factoryTracker = createTrajectoryTracker(reasoningBank);
      expect(factoryTracker).toBeInstanceOf(TrajectoryTracker);
    });
  });

  // ============================================================================
  // Start Trajectory Tests
  // ============================================================================

  describe('startTrajectory', () => {
    it('should start a new trajectory and return ID', () => {
      const trajectoryId = tracker.startTrajectory('task-123');

      expect(trajectoryId).toBeDefined();
      expect(trajectoryId).toMatch(/^traj-task-123-/);
    });

    it('should return empty string when disabled', () => {
      const disabledTracker = new TrajectoryTracker(null, { enabled: false });

      const trajectoryId = disabledTracker.startTrajectory('task-123');

      expect(trajectoryId).toBe('');
    });

    it('should include metadata in trajectory', () => {
      const trajectoryId = tracker.startTrajectory('task-123', {
        agentType: 'coder',
        priority: 'high',
      });

      const trajectory = tracker.getActiveTrajectory(trajectoryId);
      expect(trajectory?.metadata).toEqual({
        agentType: 'coder',
        priority: 'high',
      });
    });

    it('should track multiple active trajectories', () => {
      const id1 = tracker.startTrajectory('task-1');
      const id2 = tracker.startTrajectory('task-2');
      const id3 = tracker.startTrajectory('task-3');

      expect(tracker.getActiveCount()).toBe(3);
      expect(tracker.getActiveIds()).toContain(id1);
      expect(tracker.getActiveIds()).toContain(id2);
      expect(tracker.getActiveIds()).toContain(id3);
    });

    it('should emit trajectory:started event', () => {
      const listener = vi.fn();
      tracker.on('trajectory:started', listener);

      const trajectoryId = tracker.startTrajectory('task-123');

      expect(listener).toHaveBeenCalledWith({
        trajectoryId,
        taskId: 'task-123',
      });
    });
  });

  // ============================================================================
  // Record Step Tests
  // ============================================================================

  describe('recordStep', () => {
    let trajectoryId: string;

    beforeEach(() => {
      trajectoryId = tracker.startTrajectory('task-123');
    });

    it('should record a step in the trajectory', () => {
      tracker.recordStep(trajectoryId, {
        action: 'analyze',
        observation: 'Found 5 issues',
      });

      const progress = tracker.getProgress(trajectoryId);
      expect(progress?.stepCount).toBe(1);
      expect(progress?.lastStep?.action).toBe('analyze');
    });

    it('should auto-generate timestamp', () => {
      tracker.recordStep(trajectoryId, {
        action: 'test',
        observation: 'Testing',
      });

      const progress = tracker.getProgress(trajectoryId);
      expect(progress?.lastStep?.timestamp).toBeInstanceOf(Date);
    });

    it('should include confidence in step', () => {
      tracker.recordStep(trajectoryId, {
        action: 'analyze',
        observation: 'Found issues',
        confidence: 0.95,
      });

      const progress = tracker.getProgress(trajectoryId);
      expect(progress?.lastStep?.confidence).toBe(0.95);
    });

    it('should use default confidence when not provided', () => {
      tracker.recordStep(trajectoryId, {
        action: 'test',
        observation: 'Result',
      });

      const progress = tracker.getProgress(trajectoryId);
      expect(progress?.lastStep?.confidence).toBe(0.8);
    });

    it('should calculate duration between steps', async () => {
      tracker.recordStep(trajectoryId, {
        action: 'step1',
        observation: 'First',
      });

      // Small delay to ensure duration
      await new Promise((resolve) => setTimeout(resolve, 50));

      tracker.recordStep(trajectoryId, {
        action: 'step2',
        observation: 'Second',
      });

      const progress = tracker.getProgress(trajectoryId);
      expect(progress?.lastStep?.duration).toBeGreaterThan(0);
    });

    it('should truncate long observations', () => {
      const longObservation = 'A'.repeat(1000);

      tracker.recordStep(trajectoryId, {
        action: 'analyze',
        observation: longObservation,
      });

      const progress = tracker.getProgress(trajectoryId);
      expect(progress?.lastStep?.observation.length).toBeLessThanOrEqual(503); // 500 + '...'
    });

    it('should include step metadata', () => {
      tracker.recordStep(trajectoryId, {
        action: 'fix',
        observation: 'Applied fix',
        metadata: { filesChanged: 3 },
      });

      const progress = tracker.getProgress(trajectoryId);
      expect(progress?.lastStep?.metadata).toEqual({ filesChanged: 3 });
    });

    it('should emit trajectory:step event', () => {
      const listener = vi.fn();
      tracker.on('trajectory:step', listener);

      tracker.recordStep(trajectoryId, {
        action: 'test',
        observation: 'Testing',
      });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          trajectoryId,
          stepIndex: 0,
        })
      );
    });

    it('should do nothing when disabled', () => {
      const disabledTracker = new TrajectoryTracker(null, { enabled: false });

      // This should not throw
      disabledTracker.recordStep('any-id', {
        action: 'test',
        observation: 'Test',
      });
    });

    it('should warn for unknown trajectory', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      tracker.recordStep('non-existent', {
        action: 'test',
        observation: 'Test',
      });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('non-existent not found')
      );

      warnSpy.mockRestore();
    });
  });

  // ============================================================================
  // Complete Trajectory Tests
  // ============================================================================

  describe('completeTrajectory', () => {
    let trajectoryId: string;

    beforeEach(() => {
      trajectoryId = tracker.startTrajectory('task-123');
      tracker.recordStep(trajectoryId, {
        action: 'analyze',
        observation: 'Analysis complete',
      });
      tracker.recordStep(trajectoryId, {
        action: 'implement',
        observation: 'Implementation done',
      });
    });

    it('should complete and store trajectory', async () => {
      const storedId = await tracker.completeTrajectory(trajectoryId, 'success');

      expect(storedId).toBeDefined();
      expect(tracker.getActiveCount()).toBe(0);
    });

    it('should remove from active trajectories', async () => {
      expect(tracker.getActiveCount()).toBe(1);

      await tracker.completeTrajectory(trajectoryId, 'success');

      expect(tracker.getActiveCount()).toBe(0);
    });

    it('should include final metadata', async () => {
      const storedId = await tracker.completeTrajectory(trajectoryId, 'success', {
        quality: 0.95,
        artifactsCreated: 3,
      });

      expect(storedId).toBeDefined();
    });

    it('should skip storage for too few steps', async () => {
      const shortTrajectory = tracker.startTrajectory('short-task');

      const storedId = await tracker.completeTrajectory(shortTrajectory, 'success');

      expect(storedId).toBeNull();
    });

    it('should emit trajectory:completed event', async () => {
      const listener = vi.fn();
      tracker.on('trajectory:completed', listener);

      await tracker.completeTrajectory(trajectoryId, 'success');

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          trajectoryId,
          outcome: 'success',
          stepCount: 2,
        })
      );
    });

    it('should emit trajectory:skipped for too few steps', async () => {
      const listener = vi.fn();
      tracker.on('trajectory:skipped', listener);

      const shortTrajectory = tracker.startTrajectory('short');
      await tracker.completeTrajectory(shortTrajectory, 'success');

      expect(listener).toHaveBeenCalledWith({
        trajectoryId: shortTrajectory,
        reason: 'too-few-steps',
      });
    });

    it('should handle null when disabled', async () => {
      const disabledTracker = new TrajectoryTracker(null, { enabled: false });

      const result = await disabledTracker.completeTrajectory('any', 'success');

      expect(result).toBeNull();
    });

    it('should store failure outcome', async () => {
      const storedId = await tracker.completeTrajectory(trajectoryId, 'failure', {
        errorCode: 'ERR_123',
      });

      expect(storedId).toBeDefined();
    });

    it('should store partial outcome', async () => {
      const storedId = await tracker.completeTrajectory(trajectoryId, 'partial', {
        completionRate: 0.6,
      });

      expect(storedId).toBeDefined();
    });
  });

  // ============================================================================
  // Abort Trajectory Tests
  // ============================================================================

  describe('abortTrajectory', () => {
    it('should abort and remove trajectory', () => {
      const trajectoryId = tracker.startTrajectory('task-123');
      tracker.recordStep(trajectoryId, { action: 'test', observation: 'Testing' });

      tracker.abortTrajectory(trajectoryId, 'User cancelled');

      expect(tracker.getActiveCount()).toBe(0);
    });

    it('should emit trajectory:aborted event', () => {
      const listener = vi.fn();
      tracker.on('trajectory:aborted', listener);

      const trajectoryId = tracker.startTrajectory('task-123');
      tracker.abortTrajectory(trajectoryId, 'timeout');

      expect(listener).toHaveBeenCalledWith({
        trajectoryId,
        reason: 'timeout',
      });
    });

    it('should do nothing for non-existent trajectory', () => {
      // Should not throw
      tracker.abortTrajectory('non-existent', 'reason');
    });

    it('should do nothing for empty ID', () => {
      // Should not throw
      tracker.abortTrajectory('', 'reason');
    });
  });

  // ============================================================================
  // Progress and Query Tests
  // ============================================================================

  describe('getProgress', () => {
    it('should return progress for active trajectory', () => {
      const trajectoryId = tracker.startTrajectory('task-123');
      tracker.recordStep(trajectoryId, { action: 'step1', observation: 'First' });
      tracker.recordStep(trajectoryId, { action: 'step2', observation: 'Second' });

      const progress = tracker.getProgress(trajectoryId);

      expect(progress?.stepCount).toBe(2);
      expect(progress?.duration).toBeGreaterThanOrEqual(0);
      expect(progress?.lastStep?.action).toBe('step2');
    });

    it('should return null for non-existent trajectory', () => {
      const progress = tracker.getProgress('non-existent');

      expect(progress).toBeNull();
    });
  });

  describe('getActiveTrajectory', () => {
    it('should return snapshot of active trajectory', () => {
      const trajectoryId = tracker.startTrajectory('task-456', { priority: 'high' });
      tracker.recordStep(trajectoryId, { action: 'test', observation: 'Testing' });

      const snapshot = tracker.getActiveTrajectory(trajectoryId);

      expect(snapshot?.taskId).toBe('task-456');
      expect(snapshot?.stepCount).toBe(1);
      expect(snapshot?.metadata).toEqual({ priority: 'high' });
      expect(snapshot?.startTime).toBeInstanceOf(Date);
    });

    it('should return null for non-existent trajectory', () => {
      const snapshot = tracker.getActiveTrajectory('non-existent');

      expect(snapshot).toBeNull();
    });
  });

  describe('getActiveCount', () => {
    it('should return count of active trajectories', () => {
      expect(tracker.getActiveCount()).toBe(0);

      tracker.startTrajectory('task-1');
      expect(tracker.getActiveCount()).toBe(1);

      tracker.startTrajectory('task-2');
      expect(tracker.getActiveCount()).toBe(2);
    });
  });

  describe('getActiveIds', () => {
    it('should return all active trajectory IDs', () => {
      const id1 = tracker.startTrajectory('task-1');
      const id2 = tracker.startTrajectory('task-2');

      const ids = tracker.getActiveIds();

      expect(ids).toHaveLength(2);
      expect(ids).toContain(id1);
      expect(ids).toContain(id2);
    });

    it('should return empty array when no active trajectories', () => {
      const ids = tracker.getActiveIds();

      expect(ids).toEqual([]);
    });
  });

  // ============================================================================
  // Clear and Config Tests
  // ============================================================================

  describe('clearActive', () => {
    it('should clear all active trajectories', () => {
      tracker.startTrajectory('task-1');
      tracker.startTrajectory('task-2');
      tracker.startTrajectory('task-3');

      tracker.clearActive();

      expect(tracker.getActiveCount()).toBe(0);
    });

    it('should emit trajectory:aborted for each cleared', () => {
      const listener = vi.fn();
      tracker.on('trajectory:aborted', listener);

      tracker.startTrajectory('task-1');
      tracker.startTrajectory('task-2');

      tracker.clearActive();

      expect(listener).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      tracker.updateConfig({ minStepsToStore: 5 });

      expect(tracker.getConfig().minStepsToStore).toBe(5);
    });

    it('should preserve unmodified config values', () => {
      const originalEnabled = tracker.getConfig().enabled;

      tracker.updateConfig({ minStepsToStore: 10 });

      expect(tracker.getConfig().enabled).toBe(originalEnabled);
    });
  });

  describe('getConfig', () => {
    it('should return copy of configuration', () => {
      const config = tracker.getConfig();
      config.minStepsToStore = 999;

      expect(tracker.getConfig().minStepsToStore).not.toBe(999);
    });
  });

  // ============================================================================
  // Integration with ReasoningBank Tests
  // ============================================================================

  describe('ReasoningBank integration', () => {
    it('should store trajectory in ReasoningBank', async () => {
      const trajectoryId = tracker.startTrajectory('integration-task');
      tracker.recordStep(trajectoryId, { action: 'step1', observation: 'First' });
      tracker.recordStep(trajectoryId, { action: 'step2', observation: 'Second' });

      const storedId = await tracker.completeTrajectory(trajectoryId, 'success');

      expect(storedId).toBeDefined();

      // Verify in ReasoningBank
      const stored = await reasoningBank.getTrajectory(storedId!);
      expect(stored?.taskId).toBe('integration-task');
      expect(stored?.steps).toHaveLength(2);
      expect(stored?.outcome).toBe('success');
    });

    it('should work without ReasoningBank', async () => {
      const standaloneTracker = new TrajectoryTracker(null);
      const trajectoryId = standaloneTracker.startTrajectory('standalone-task');
      standaloneTracker.recordStep(trajectoryId, { action: 'step1', observation: 'A' });
      standaloneTracker.recordStep(trajectoryId, { action: 'step2', observation: 'B' });

      const storedId = await standaloneTracker.completeTrajectory(
        trajectoryId,
        'success'
      );

      expect(storedId).toBeNull(); // No ReasoningBank to store
    });
  });
});
