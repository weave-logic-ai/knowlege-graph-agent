/**
 * Decision Tracker Tests
 *
 * Comprehensive tests for the DecisionTracker class which provides
 * tracking, explanation, and auditing of AI reasoning and decisions.
 *
 * @module tests/reasoning/tracker
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  DecisionTracker,
  createDecisionTracker,
  getDecisionTracker,
  setDefaultDecisionTracker,
} from '../../src/reasoning/tracker.js';
import type {
  Decision,
  DecisionContext,
  DecisionOutcome,
  CreateDecisionParams,
  ConfidenceLevel,
  DecisionType,
  ReasoningChainStatus,
  Alternative,
} from '../../src/reasoning/types.js';

/**
 * Helper to create a valid decision context
 */
function createTestContext(overrides: Partial<DecisionContext> = {}): DecisionContext {
  return {
    trigger: 'test_trigger',
    inputs: { key: 'value' },
    constraints: ['constraint1', 'constraint2'],
    alternatives: [],
    ...overrides,
  };
}

/**
 * Helper to create valid decision params
 */
function createTestDecisionParams(overrides: Partial<CreateDecisionParams> = {}): CreateDecisionParams {
  return {
    action: 'Test action',
    reasoning: ['Reason 1', 'Reason 2'],
    confidence: 'high',
    context: createTestContext(),
    ...overrides,
  };
}

/**
 * Helper to create an alternative for testing
 */
function createTestAlternative(overrides: Partial<Alternative> = {}): Alternative {
  return {
    action: 'Alternative action',
    pros: ['Pro 1', 'Pro 2'],
    cons: ['Con 1'],
    confidence: 'medium',
    rejected: true,
    rejectionReason: 'Not optimal',
    ...overrides,
  };
}

describe('DecisionTracker', () => {
  let tracker: DecisionTracker;

  beforeEach(() => {
    tracker = createDecisionTracker();
  });

  afterEach(() => {
    tracker.clear();
  });

  describe('constructor', () => {
    it('should create a DecisionTracker instance', () => {
      expect(tracker).toBeInstanceOf(DecisionTracker);
    });

    it('should accept custom maxDecisions option', () => {
      const customTracker = createDecisionTracker({ maxDecisions: 100 });
      expect(customTracker).toBeInstanceOf(DecisionTracker);
    });

    it('should accept custom maxChains option', () => {
      const customTracker = createDecisionTracker({ maxChains: 50 });
      expect(customTracker).toBeInstanceOf(DecisionTracker);
    });

    it('should accept both options together', () => {
      const customTracker = createDecisionTracker({
        maxDecisions: 500,
        maxChains: 100,
      });
      expect(customTracker).toBeInstanceOf(DecisionTracker);
    });

    it('should use default values when no options provided', () => {
      const defaultTracker = new DecisionTracker();
      const stats = defaultTracker.getStats();
      expect(stats.totalDecisions).toBe(0);
      expect(stats.totalChains).toBe(0);
    });

    it('should extend EventEmitter', () => {
      expect(typeof tracker.on).toBe('function');
      expect(typeof tracker.emit).toBe('function');
      expect(typeof tracker.removeListener).toBe('function');
    });
  });

  describe('startChain', () => {
    it('should start a new reasoning chain', () => {
      const chainId = tracker.startChain('Test goal');

      expect(chainId).toBeDefined();
      expect(typeof chainId).toBe('string');
      expect(chainId.length).toBeGreaterThan(0);
    });

    it('should create a chain with the correct goal', () => {
      const goal = 'Process user query';
      const chainId = tracker.startChain(goal);
      const chain = tracker.getChain(chainId);

      expect(chain).toBeDefined();
      expect(chain?.goal).toBe(goal);
    });

    it('should set chain status to in_progress', () => {
      const chainId = tracker.startChain('Test goal');
      const chain = tracker.getChain(chainId);

      expect(chain?.status).toBe('in_progress');
    });

    it('should set startTime on the chain', () => {
      const before = new Date();
      const chainId = tracker.startChain('Test goal');
      const after = new Date();
      const chain = tracker.getChain(chainId);

      expect(chain?.startTime).toBeInstanceOf(Date);
      expect(chain!.startTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(chain!.startTime.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should initialize chain with empty decisions array', () => {
      const chainId = tracker.startChain('Test goal');
      const chain = tracker.getChain(chainId);

      expect(chain?.decisions).toEqual([]);
    });

    it('should set the chain as current chain', () => {
      const chainId = tracker.startChain('Test goal');
      const currentChain = tracker.getCurrentChain();

      expect(currentChain?.id).toBe(chainId);
    });

    it('should emit chainStarted event', () => {
      const handler = vi.fn();
      tracker.on('chainStarted', handler);

      tracker.startChain('Test goal');

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0]).toHaveProperty('id');
      expect(handler.mock.calls[0][0]).toHaveProperty('goal', 'Test goal');
    });

    it('should generate unique IDs for multiple chains', () => {
      const chainId1 = tracker.startChain('Goal 1');
      const chainId2 = tracker.startChain('Goal 2');
      const chainId3 = tracker.startChain('Goal 3');

      expect(chainId1).not.toBe(chainId2);
      expect(chainId2).not.toBe(chainId3);
      expect(chainId1).not.toBe(chainId3);
    });

    it('should prune old chains when max is reached', () => {
      const smallTracker = createDecisionTracker({ maxChains: 5 });

      // Create 5 chains and end them (so they can be pruned)
      for (let i = 0; i < 5; i++) {
        const id = smallTracker.startChain(`Goal ${i}`);
        smallTracker.endChain(id);
      }

      // Create one more chain - should trigger pruning
      smallTracker.startChain('New goal');

      const stats = smallTracker.getStats();
      expect(stats.totalChains).toBeLessThanOrEqual(5);
    });
  });

  describe('recordDecision', () => {
    it('should record a decision with all parameters', () => {
      const params = createTestDecisionParams();
      const decision = tracker.recordDecision(params);

      expect(decision).toBeDefined();
      expect(decision.id).toBeDefined();
      expect(decision.action).toBe(params.action);
      expect(decision.reasoning).toEqual(params.reasoning);
      expect(decision.confidence).toBe(params.confidence);
    });

    it('should generate unique decision IDs', () => {
      const decision1 = tracker.recordDecision(createTestDecisionParams());
      const decision2 = tracker.recordDecision(createTestDecisionParams());
      const decision3 = tracker.recordDecision(createTestDecisionParams());

      expect(decision1.id).not.toBe(decision2.id);
      expect(decision2.id).not.toBe(decision3.id);
    });

    it('should set default type to automatic when not specified', () => {
      const params = createTestDecisionParams();
      delete params.type;
      const decision = tracker.recordDecision(params);

      expect(decision.type).toBe('automatic');
    });

    it('should use provided type when specified', () => {
      const types: DecisionType[] = ['automatic', 'suggested', 'manual', 'override'];

      for (const type of types) {
        const decision = tracker.recordDecision(createTestDecisionParams({ type }));
        expect(decision.type).toBe(type);
      }
    });

    it('should set timestamp on the decision', () => {
      const before = new Date();
      const decision = tracker.recordDecision(createTestDecisionParams());
      const after = new Date();

      expect(decision.timestamp).toBeInstanceOf(Date);
      expect(decision.timestamp.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(decision.timestamp.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include context in the decision', () => {
      const context = createTestContext({
        trigger: 'custom_trigger',
        inputs: { custom: 'input' },
        constraints: ['custom constraint'],
      });
      const decision = tracker.recordDecision(createTestDecisionParams({ context }));

      expect(decision.context).toEqual(context);
    });

    it('should add decision to current chain when chain is active', () => {
      const chainId = tracker.startChain('Test goal');
      const decision = tracker.recordDecision(createTestDecisionParams());
      const chain = tracker.getChain(chainId);

      expect(chain?.decisions).toContain(decision);
    });

    it('should not fail when no chain is active', () => {
      const decision = tracker.recordDecision(createTestDecisionParams());

      expect(decision).toBeDefined();
      expect(tracker.getCurrentChain()).toBeUndefined();
    });

    it('should emit decisionRecorded event', () => {
      const handler = vi.fn();
      tracker.on('decisionRecorded', handler);

      const decision = tracker.recordDecision(createTestDecisionParams());

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0]).toBe(decision);
    });

    it('should handle all confidence levels', () => {
      const levels: ConfidenceLevel[] = ['low', 'medium', 'high', 'certain'];

      for (const confidence of levels) {
        const decision = tracker.recordDecision(createTestDecisionParams({ confidence }));
        expect(decision.confidence).toBe(confidence);
      }
    });

    it('should record decisions with alternatives in context', () => {
      const alternatives = [
        createTestAlternative({ action: 'Alt 1' }),
        createTestAlternative({ action: 'Alt 2', rejected: false }),
      ];
      const context = createTestContext({ alternatives });
      const decision = tracker.recordDecision(createTestDecisionParams({ context }));

      expect(decision.context.alternatives).toHaveLength(2);
      expect(decision.context.alternatives[0].action).toBe('Alt 1');
      expect(decision.context.alternatives[1].rejected).toBe(false);
    });

    it('should prune old decisions when max is reached', () => {
      const smallTracker = createDecisionTracker({ maxDecisions: 10 });

      // Record 10 decisions
      for (let i = 0; i < 10; i++) {
        smallTracker.recordDecision(createTestDecisionParams({ action: `Action ${i}` }));
      }

      // Record one more - should trigger pruning
      smallTracker.recordDecision(createTestDecisionParams({ action: 'New action' }));

      const stats = smallTracker.getStats();
      expect(stats.totalDecisions).toBeLessThanOrEqual(10);
    });
  });

  describe('recordOutcome', () => {
    it('should record outcome for a decision', () => {
      const decision = tracker.recordDecision(createTestDecisionParams());
      const outcome: DecisionOutcome = {
        success: true,
        result: { data: 'result' },
        duration: 150,
        sideEffects: [],
      };

      tracker.recordOutcome(decision.id, outcome);

      const updated = tracker.getDecision(decision.id);
      expect(updated?.outcome).toEqual(outcome);
    });

    it('should record successful outcome', () => {
      const decision = tracker.recordDecision(createTestDecisionParams());
      const outcome: DecisionOutcome = {
        success: true,
        result: 'completed',
        duration: 100,
        sideEffects: [],
      };

      tracker.recordOutcome(decision.id, outcome);

      expect(tracker.getDecision(decision.id)?.outcome?.success).toBe(true);
    });

    it('should record failed outcome with error', () => {
      const decision = tracker.recordDecision(createTestDecisionParams());
      const outcome: DecisionOutcome = {
        success: false,
        error: 'Operation failed',
        duration: 50,
        sideEffects: [],
      };

      tracker.recordOutcome(decision.id, outcome);

      const updated = tracker.getDecision(decision.id);
      expect(updated?.outcome?.success).toBe(false);
      expect(updated?.outcome?.error).toBe('Operation failed');
    });

    it('should record outcome with side effects', () => {
      const decision = tracker.recordDecision(createTestDecisionParams());
      const outcome: DecisionOutcome = {
        success: true,
        duration: 200,
        sideEffects: ['Created file', 'Updated cache'],
      };

      tracker.recordOutcome(decision.id, outcome);

      const updated = tracker.getDecision(decision.id);
      expect(updated?.outcome?.sideEffects).toEqual(['Created file', 'Updated cache']);
    });

    it('should not fail for non-existent decision', () => {
      const outcome: DecisionOutcome = {
        success: true,
        duration: 100,
        sideEffects: [],
      };

      // Should not throw
      tracker.recordOutcome('non-existent-id', outcome);
    });

    it('should emit outcomeRecorded event', () => {
      const handler = vi.fn();
      tracker.on('outcomeRecorded', handler);

      const decision = tracker.recordDecision(createTestDecisionParams());
      const outcome: DecisionOutcome = {
        success: true,
        duration: 100,
        sideEffects: [],
      };

      tracker.recordOutcome(decision.id, outcome);

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].id).toBe(decision.id);
      expect(handler.mock.calls[0][0].outcome).toEqual(outcome);
    });
  });

  describe('endChain', () => {
    it('should end a chain with completed status by default', () => {
      const chainId = tracker.startChain('Test goal');
      tracker.endChain(chainId);

      const chain = tracker.getChain(chainId);
      expect(chain?.status).toBe('completed');
    });

    it('should set endTime on the chain', () => {
      const chainId = tracker.startChain('Test goal');
      const before = new Date();
      tracker.endChain(chainId);
      const after = new Date();

      const chain = tracker.getChain(chainId);
      expect(chain?.endTime).toBeInstanceOf(Date);
      expect(chain!.endTime!.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(chain!.endTime!.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should accept different status values', () => {
      const statuses: ReasoningChainStatus[] = ['completed', 'failed', 'aborted'];

      for (const status of statuses) {
        const chainId = tracker.startChain(`Test ${status}`);
        tracker.endChain(chainId, status);

        const chain = tracker.getChain(chainId);
        expect(chain?.status).toBe(status);
      }
    });

    it('should clear current chain when ending active chain', () => {
      const chainId = tracker.startChain('Test goal');
      expect(tracker.getCurrentChain()?.id).toBe(chainId);

      tracker.endChain(chainId);
      expect(tracker.getCurrentChain()).toBeUndefined();
    });

    it('should not clear current chain when ending non-active chain', () => {
      const chainId1 = tracker.startChain('Goal 1');
      const chainId2 = tracker.startChain('Goal 2');

      // chainId2 is current
      tracker.endChain(chainId1);

      // chainId2 should still be current
      expect(tracker.getCurrentChain()?.id).toBe(chainId2);
    });

    it('should emit chainEnded event', () => {
      const handler = vi.fn();
      tracker.on('chainEnded', handler);

      const chainId = tracker.startChain('Test goal');
      tracker.endChain(chainId);

      expect(handler).toHaveBeenCalled();
      expect(handler.mock.calls[0][0].id).toBe(chainId);
    });

    it('should not fail for non-existent chain', () => {
      // Should not throw
      tracker.endChain('non-existent-id');
    });
  });

  describe('getChain', () => {
    it('should return chain by ID', () => {
      const chainId = tracker.startChain('Test goal');
      const chain = tracker.getChain(chainId);

      expect(chain).toBeDefined();
      expect(chain?.id).toBe(chainId);
      expect(chain?.goal).toBe('Test goal');
    });

    it('should return undefined for non-existent chain', () => {
      const chain = tracker.getChain('non-existent');
      expect(chain).toBeUndefined();
    });

    it('should return chain with all decisions', () => {
      const chainId = tracker.startChain('Test goal');
      tracker.recordDecision(createTestDecisionParams({ action: 'Action 1' }));
      tracker.recordDecision(createTestDecisionParams({ action: 'Action 2' }));

      const chain = tracker.getChain(chainId);
      expect(chain?.decisions).toHaveLength(2);
    });
  });

  describe('getDecision', () => {
    it('should return decision by ID', () => {
      const recorded = tracker.recordDecision(createTestDecisionParams());
      const retrieved = tracker.getDecision(recorded.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(recorded.id);
      expect(retrieved?.action).toBe(recorded.action);
    });

    it('should return undefined for non-existent decision', () => {
      const decision = tracker.getDecision('non-existent');
      expect(decision).toBeUndefined();
    });

    it('should return decision with outcome after outcome is recorded', () => {
      const decision = tracker.recordDecision(createTestDecisionParams());
      const outcome: DecisionOutcome = {
        success: true,
        duration: 100,
        sideEffects: [],
      };
      tracker.recordOutcome(decision.id, outcome);

      const retrieved = tracker.getDecision(decision.id);
      expect(retrieved?.outcome).toEqual(outcome);
    });
  });

  describe('getCurrentChain', () => {
    it('should return undefined when no chain is active', () => {
      expect(tracker.getCurrentChain()).toBeUndefined();
    });

    it('should return the current active chain', () => {
      const chainId = tracker.startChain('Current goal');
      const current = tracker.getCurrentChain();

      expect(current).toBeDefined();
      expect(current?.id).toBe(chainId);
    });

    it('should return most recently started chain', () => {
      tracker.startChain('Goal 1');
      tracker.startChain('Goal 2');
      const chainId3 = tracker.startChain('Goal 3');

      expect(tracker.getCurrentChain()?.id).toBe(chainId3);
    });
  });

  describe('getRecentDecisions', () => {
    it('should return recent decisions', () => {
      tracker.recordDecision(createTestDecisionParams({ action: 'Action 1' }));
      tracker.recordDecision(createTestDecisionParams({ action: 'Action 2' }));
      tracker.recordDecision(createTestDecisionParams({ action: 'Action 3' }));

      const recent = tracker.getRecentDecisions();
      expect(recent).toHaveLength(3);
    });

    it('should return decisions in reverse chronological order', async () => {
      tracker.recordDecision(createTestDecisionParams({ action: 'First' }));
      await new Promise(resolve => setTimeout(resolve, 10));
      tracker.recordDecision(createTestDecisionParams({ action: 'Second' }));
      await new Promise(resolve => setTimeout(resolve, 10));
      tracker.recordDecision(createTestDecisionParams({ action: 'Third' }));

      const recent = tracker.getRecentDecisions();
      expect(recent[0].action).toBe('Third');
      expect(recent[2].action).toBe('First');
    });

    it('should respect limit parameter', () => {
      for (let i = 0; i < 20; i++) {
        tracker.recordDecision(createTestDecisionParams({ action: `Action ${i}` }));
      }

      const recent = tracker.getRecentDecisions(5);
      expect(recent).toHaveLength(5);
    });

    it('should use default limit of 10', () => {
      for (let i = 0; i < 20; i++) {
        tracker.recordDecision(createTestDecisionParams({ action: `Action ${i}` }));
      }

      const recent = tracker.getRecentDecisions();
      expect(recent).toHaveLength(10);
    });

    it('should return empty array when no decisions exist', () => {
      const recent = tracker.getRecentDecisions();
      expect(recent).toEqual([]);
    });
  });

  describe('getChainDecisions', () => {
    it('should return all decisions in a chain', () => {
      const chainId = tracker.startChain('Test goal');
      tracker.recordDecision(createTestDecisionParams({ action: 'Action 1' }));
      tracker.recordDecision(createTestDecisionParams({ action: 'Action 2' }));

      const decisions = tracker.getChainDecisions(chainId);
      expect(decisions).toHaveLength(2);
    });

    it('should return empty array for non-existent chain', () => {
      const decisions = tracker.getChainDecisions('non-existent');
      expect(decisions).toEqual([]);
    });

    it('should return only decisions from the specified chain', () => {
      const chainId1 = tracker.startChain('Goal 1');
      tracker.recordDecision(createTestDecisionParams({ action: 'Chain 1 Action' }));
      tracker.endChain(chainId1);

      const chainId2 = tracker.startChain('Goal 2');
      tracker.recordDecision(createTestDecisionParams({ action: 'Chain 2 Action 1' }));
      tracker.recordDecision(createTestDecisionParams({ action: 'Chain 2 Action 2' }));

      const chain1Decisions = tracker.getChainDecisions(chainId1);
      const chain2Decisions = tracker.getChainDecisions(chainId2);

      expect(chain1Decisions).toHaveLength(1);
      expect(chain2Decisions).toHaveLength(2);
    });
  });

  describe('explainDecision', () => {
    it('should return "Decision not found" for non-existent decision', () => {
      const explanation = tracker.explainDecision('non-existent');
      expect(explanation).toBe('Decision not found');
    });

    it('should include decision action in explanation', () => {
      const decision = tracker.recordDecision(createTestDecisionParams({
        action: 'Extract entities',
      }));

      const explanation = tracker.explainDecision(decision.id);
      expect(explanation).toContain('Decision: Extract entities');
    });

    it('should include decision type in explanation', () => {
      const decision = tracker.recordDecision(createTestDecisionParams({
        type: 'suggested',
      }));

      const explanation = tracker.explainDecision(decision.id);
      expect(explanation).toContain('Type: suggested');
    });

    it('should include confidence level in explanation', () => {
      const decision = tracker.recordDecision(createTestDecisionParams({
        confidence: 'high',
      }));

      const explanation = tracker.explainDecision(decision.id);
      expect(explanation).toContain('Confidence: high');
    });

    it('should include all reasoning steps', () => {
      const decision = tracker.recordDecision(createTestDecisionParams({
        reasoning: ['Step 1: Analyze', 'Step 2: Process', 'Step 3: Validate'],
      }));

      const explanation = tracker.explainDecision(decision.id);
      expect(explanation).toContain('Reasoning:');
      expect(explanation).toContain('1. Step 1: Analyze');
      expect(explanation).toContain('2. Step 2: Process');
      expect(explanation).toContain('3. Step 3: Validate');
    });

    it('should include constraints when present', () => {
      const context = createTestContext({
        constraints: ['Max 10 entities', 'Confidence > 0.7'],
      });
      const decision = tracker.recordDecision(createTestDecisionParams({ context }));

      const explanation = tracker.explainDecision(decision.id);
      expect(explanation).toContain('Constraints:');
      expect(explanation).toContain('- Max 10 entities');
      expect(explanation).toContain('- Confidence > 0.7');
    });

    it('should include alternatives when present', () => {
      const alternatives = [
        createTestAlternative({
          action: 'Use NLP',
          pros: ['Fast', 'Accurate'],
          cons: ['Expensive'],
          confidence: 'high',
          rejected: true,
          rejectionReason: 'Cost too high',
        }),
      ];
      const context = createTestContext({ alternatives });
      const decision = tracker.recordDecision(createTestDecisionParams({ context }));

      const explanation = tracker.explainDecision(decision.id);
      expect(explanation).toContain('Alternatives considered:');
      expect(explanation).toContain('* Use NLP (high confidence)');
      expect(explanation).toContain('Pros: Fast, Accurate');
      expect(explanation).toContain('Cons: Expensive');
      expect(explanation).toContain('Rejected: Cost too high');
    });

    it('should include outcome when present', () => {
      const decision = tracker.recordDecision(createTestDecisionParams());
      const outcome: DecisionOutcome = {
        success: true,
        duration: 150,
        sideEffects: ['Updated graph'],
      };
      tracker.recordOutcome(decision.id, outcome);

      const explanation = tracker.explainDecision(decision.id);
      expect(explanation).toContain('Outcome: Success');
      expect(explanation).toContain('Duration: 150ms');
      expect(explanation).toContain('Side effects:');
      expect(explanation).toContain('- Updated graph');
    });

    it('should include error in failed outcome', () => {
      const decision = tracker.recordDecision(createTestDecisionParams());
      const outcome: DecisionOutcome = {
        success: false,
        error: 'Network timeout',
        duration: 5000,
        sideEffects: [],
      };
      tracker.recordOutcome(decision.id, outcome);

      const explanation = tracker.explainDecision(decision.id);
      expect(explanation).toContain('Outcome: Failed');
      expect(explanation).toContain('Error: Network timeout');
    });

    it('should include timestamp in explanation', () => {
      const decision = tracker.recordDecision(createTestDecisionParams());
      const explanation = tracker.explainDecision(decision.id);

      expect(explanation).toContain('Time:');
    });
  });

  describe('summarizeChain', () => {
    it('should return "Chain not found" for non-existent chain', () => {
      const summary = tracker.summarizeChain('non-existent');
      expect(summary).toBe('Chain not found');
    });

    it('should include chain ID and goal', () => {
      const chainId = tracker.startChain('Process user request');
      const summary = tracker.summarizeChain(chainId);

      expect(summary).toContain(`Reasoning Chain: ${chainId}`);
      expect(summary).toContain('Goal: Process user request');
    });

    it('should include chain status', () => {
      const chainId = tracker.startChain('Test goal');
      tracker.endChain(chainId, 'completed');

      const summary = tracker.summarizeChain(chainId);
      expect(summary).toContain('Status: completed');
    });

    it('should include decision counts', () => {
      const chainId = tracker.startChain('Test goal');
      const d1 = tracker.recordDecision(createTestDecisionParams());
      const d2 = tracker.recordDecision(createTestDecisionParams());
      const d3 = tracker.recordDecision(createTestDecisionParams());

      tracker.recordOutcome(d1.id, { success: true, duration: 100, sideEffects: [] });
      tracker.recordOutcome(d2.id, { success: true, duration: 100, sideEffects: [] });
      tracker.recordOutcome(d3.id, { success: false, duration: 50, sideEffects: [] });

      const summary = tracker.summarizeChain(chainId);
      expect(summary).toContain('Decisions: 3');
      expect(summary).toContain('- Successful: 2');
      expect(summary).toContain('- Failed: 1');
    });

    it('should include decision sequence', () => {
      const chainId = tracker.startChain('Test goal');
      const d1 = tracker.recordDecision(createTestDecisionParams({
        action: 'First action',
        confidence: 'high',
      }));
      tracker.recordOutcome(d1.id, { success: true, duration: 100, sideEffects: [] });

      const summary = tracker.summarizeChain(chainId);
      expect(summary).toContain('Decision sequence:');
      expect(summary).toContain('[OK] First action (high)');
    });
  });

  describe('getStats', () => {
    it('should return statistics object', () => {
      const stats = tracker.getStats();

      expect(stats).toHaveProperty('totalDecisions');
      expect(stats).toHaveProperty('byType');
      expect(stats).toHaveProperty('byConfidence');
      expect(stats).toHaveProperty('successRate');
      expect(stats).toHaveProperty('averageDuration');
      expect(stats).toHaveProperty('totalChains');
      expect(stats).toHaveProperty('chainsByStatus');
    });

    it('should return zero counts for empty tracker', () => {
      const stats = tracker.getStats();

      expect(stats.totalDecisions).toBe(0);
      expect(stats.totalChains).toBe(0);
      expect(stats.successRate).toBe(0);
      expect(stats.averageDuration).toBe(0);
    });

    it('should count decisions correctly', () => {
      tracker.recordDecision(createTestDecisionParams());
      tracker.recordDecision(createTestDecisionParams());
      tracker.recordDecision(createTestDecisionParams());

      const stats = tracker.getStats();
      expect(stats.totalDecisions).toBe(3);
    });

    it('should count decisions by type', () => {
      tracker.recordDecision(createTestDecisionParams({ type: 'automatic' }));
      tracker.recordDecision(createTestDecisionParams({ type: 'automatic' }));
      tracker.recordDecision(createTestDecisionParams({ type: 'suggested' }));
      tracker.recordDecision(createTestDecisionParams({ type: 'manual' }));
      tracker.recordDecision(createTestDecisionParams({ type: 'override' }));

      const stats = tracker.getStats();
      expect(stats.byType.automatic).toBe(2);
      expect(stats.byType.suggested).toBe(1);
      expect(stats.byType.manual).toBe(1);
      expect(stats.byType.override).toBe(1);
    });

    it('should count decisions by confidence level', () => {
      tracker.recordDecision(createTestDecisionParams({ confidence: 'low' }));
      tracker.recordDecision(createTestDecisionParams({ confidence: 'medium' }));
      tracker.recordDecision(createTestDecisionParams({ confidence: 'medium' }));
      tracker.recordDecision(createTestDecisionParams({ confidence: 'high' }));
      tracker.recordDecision(createTestDecisionParams({ confidence: 'high' }));
      tracker.recordDecision(createTestDecisionParams({ confidence: 'high' }));
      tracker.recordDecision(createTestDecisionParams({ confidence: 'certain' }));

      const stats = tracker.getStats();
      expect(stats.byConfidence.low).toBe(1);
      expect(stats.byConfidence.medium).toBe(2);
      expect(stats.byConfidence.high).toBe(3);
      expect(stats.byConfidence.certain).toBe(1);
    });

    it('should calculate success rate correctly', () => {
      const d1 = tracker.recordDecision(createTestDecisionParams());
      const d2 = tracker.recordDecision(createTestDecisionParams());
      const d3 = tracker.recordDecision(createTestDecisionParams());
      const d4 = tracker.recordDecision(createTestDecisionParams());

      tracker.recordOutcome(d1.id, { success: true, duration: 100, sideEffects: [] });
      tracker.recordOutcome(d2.id, { success: true, duration: 100, sideEffects: [] });
      tracker.recordOutcome(d3.id, { success: true, duration: 100, sideEffects: [] });
      tracker.recordOutcome(d4.id, { success: false, duration: 50, sideEffects: [] });

      const stats = tracker.getStats();
      expect(stats.successRate).toBe(0.75);
    });

    it('should calculate average duration correctly', () => {
      const d1 = tracker.recordDecision(createTestDecisionParams());
      const d2 = tracker.recordDecision(createTestDecisionParams());

      tracker.recordOutcome(d1.id, { success: true, duration: 100, sideEffects: [] });
      tracker.recordOutcome(d2.id, { success: true, duration: 200, sideEffects: [] });

      const stats = tracker.getStats();
      expect(stats.averageDuration).toBe(150);
    });

    it('should count chains correctly', () => {
      tracker.startChain('Goal 1');
      tracker.startChain('Goal 2');
      tracker.startChain('Goal 3');

      const stats = tracker.getStats();
      expect(stats.totalChains).toBe(3);
    });

    it('should count chains by status', () => {
      const chain1 = tracker.startChain('Goal 1');
      const chain2 = tracker.startChain('Goal 2');
      const chain3 = tracker.startChain('Goal 3');
      tracker.startChain('Goal 4'); // in_progress

      tracker.endChain(chain1, 'completed');
      tracker.endChain(chain2, 'failed');
      tracker.endChain(chain3, 'aborted');

      const stats = tracker.getStats();
      expect(stats.chainsByStatus.completed).toBe(1);
      expect(stats.chainsByStatus.failed).toBe(1);
      expect(stats.chainsByStatus.aborted).toBe(1);
      expect(stats.chainsByStatus.in_progress).toBe(1);
    });
  });

  describe('findDecisions (similar to findSimilarDecisions)', () => {
    beforeEach(() => {
      // Create a variety of decisions for testing
      const types: DecisionType[] = ['automatic', 'suggested', 'manual', 'override'];
      const confidences: ConfidenceLevel[] = ['low', 'medium', 'high', 'certain'];

      for (const type of types) {
        for (const confidence of confidences) {
          const decision = tracker.recordDecision(createTestDecisionParams({
            type,
            confidence,
            action: `${type} ${confidence} action`,
          }));
          tracker.recordOutcome(decision.id, {
            success: confidence !== 'low',
            duration: 100,
            sideEffects: [],
          });
        }
      }
    });

    it('should find decisions by type', () => {
      const found = tracker.findDecisions({ type: 'automatic' });
      expect(found).toHaveLength(4);
      for (const decision of found) {
        expect(decision.type).toBe('automatic');
      }
    });

    it('should find decisions by confidence', () => {
      const found = tracker.findDecisions({ confidence: 'high' });
      expect(found).toHaveLength(4);
      for (const decision of found) {
        expect(decision.confidence).toBe('high');
      }
    });

    it('should find decisions by success status', () => {
      const successful = tracker.findDecisions({ success: true });
      const failed = tracker.findDecisions({ success: false });

      expect(successful.length).toBeGreaterThan(0);
      expect(failed.length).toBeGreaterThan(0);

      for (const d of successful) {
        expect(d.outcome?.success).toBe(true);
      }
      for (const d of failed) {
        expect(d.outcome?.success).toBe(false);
      }
    });

    it('should find decisions by action content', () => {
      const found = tracker.findDecisions({ actionContains: 'automatic' });
      expect(found).toHaveLength(4);
      for (const decision of found) {
        expect(decision.action.toLowerCase()).toContain('automatic');
      }
    });

    it('should find decisions by date range', () => {
      const before = new Date();
      const newDecision = tracker.recordDecision(createTestDecisionParams({
        action: 'New decision',
      }));

      const found = tracker.findDecisions({ afterDate: before });
      expect(found.length).toBeGreaterThanOrEqual(1);
      expect(found.some(d => d.id === newDecision.id)).toBe(true);
    });

    it('should combine multiple criteria', () => {
      const found = tracker.findDecisions({
        type: 'automatic',
        confidence: 'high',
      });

      expect(found).toHaveLength(1);
      expect(found[0].type).toBe('automatic');
      expect(found[0].confidence).toBe('high');
    });

    it('should return empty array when no matches', () => {
      const found = tracker.findDecisions({
        actionContains: 'nonexistent123456',
      });

      expect(found).toEqual([]);
    });

    it('should be case insensitive for action search', () => {
      const found = tracker.findDecisions({ actionContains: 'AUTOMATIC' });
      expect(found).toHaveLength(4);
    });
  });

  describe('exportChain', () => {
    it('should throw for non-existent chain', () => {
      expect(() => tracker.exportChain('non-existent')).toThrow('Chain not found');
    });

    it('should export chain data as object', () => {
      const chainId = tracker.startChain('Test goal');
      const decision = tracker.recordDecision(createTestDecisionParams());
      tracker.recordOutcome(decision.id, { success: true, duration: 100, sideEffects: [] });
      tracker.endChain(chainId);

      const exported = tracker.exportChain(chainId) as {
        id: string;
        goal: string;
        status: string;
        decisions: Array<{ id: string; explanation: string }>;
        summary: string;
      };

      expect(exported.id).toBe(chainId);
      expect(exported.goal).toBe('Test goal');
      expect(exported.status).toBe('completed');
    });

    it('should include explanations for all decisions', () => {
      const chainId = tracker.startChain('Test goal');
      tracker.recordDecision(createTestDecisionParams({ action: 'Action 1' }));
      tracker.recordDecision(createTestDecisionParams({ action: 'Action 2' }));

      const exported = tracker.exportChain(chainId) as {
        decisions: Array<{ explanation: string }>;
      };

      expect(exported.decisions).toHaveLength(2);
      for (const decision of exported.decisions) {
        expect(decision.explanation).toBeDefined();
        expect(typeof decision.explanation).toBe('string');
      }
    });

    it('should include chain summary', () => {
      const chainId = tracker.startChain('Test goal');
      tracker.recordDecision(createTestDecisionParams());

      const exported = tracker.exportChain(chainId) as { summary: string };

      expect(exported.summary).toBeDefined();
      expect(exported.summary).toContain('Reasoning Chain:');
      expect(exported.summary).toContain('Goal: Test goal');
    });

    it('should preserve all decision properties', () => {
      const chainId = tracker.startChain('Test goal');
      const decision = tracker.recordDecision(createTestDecisionParams({
        action: 'Test action',
        confidence: 'high',
        reasoning: ['Reason 1', 'Reason 2'],
      }));

      const exported = tracker.exportChain(chainId) as {
        decisions: Array<Decision & { explanation: string }>;
      };

      expect(exported.decisions[0].id).toBe(decision.id);
      expect(exported.decisions[0].action).toBe('Test action');
      expect(exported.decisions[0].confidence).toBe('high');
      expect(exported.decisions[0].reasoning).toEqual(['Reason 1', 'Reason 2']);
    });
  });

  describe('clear', () => {
    it('should clear all decisions', () => {
      tracker.recordDecision(createTestDecisionParams());
      tracker.recordDecision(createTestDecisionParams());
      tracker.recordDecision(createTestDecisionParams());

      tracker.clear();

      const stats = tracker.getStats();
      expect(stats.totalDecisions).toBe(0);
    });

    it('should clear all chains', () => {
      tracker.startChain('Goal 1');
      tracker.startChain('Goal 2');

      tracker.clear();

      const stats = tracker.getStats();
      expect(stats.totalChains).toBe(0);
    });

    it('should clear current chain', () => {
      tracker.startChain('Test goal');
      expect(tracker.getCurrentChain()).toBeDefined();

      tracker.clear();

      expect(tracker.getCurrentChain()).toBeUndefined();
    });
  });
});

describe('createDecisionTracker', () => {
  it('should create a new DecisionTracker instance', () => {
    const tracker = createDecisionTracker();
    expect(tracker).toBeInstanceOf(DecisionTracker);
  });

  it('should accept options', () => {
    const tracker = createDecisionTracker({
      maxDecisions: 500,
      maxChains: 50,
    });
    expect(tracker).toBeInstanceOf(DecisionTracker);
  });

  it('should create independent instances', () => {
    const tracker1 = createDecisionTracker();
    const tracker2 = createDecisionTracker();

    tracker1.recordDecision({
      action: 'Tracker 1 action',
      reasoning: ['test'],
      confidence: 'high',
      context: {
        trigger: 'test',
        inputs: {},
        constraints: [],
        alternatives: [],
      },
    });

    expect(tracker1.getStats().totalDecisions).toBe(1);
    expect(tracker2.getStats().totalDecisions).toBe(0);
  });
});

describe('getDecisionTracker', () => {
  afterEach(() => {
    // Reset singleton by setting a new one
    setDefaultDecisionTracker(new DecisionTracker());
  });

  it('should return a DecisionTracker instance', () => {
    const tracker = getDecisionTracker();
    expect(tracker).toBeInstanceOf(DecisionTracker);
  });

  it('should return the same instance on multiple calls', () => {
    const tracker1 = getDecisionTracker();
    const tracker2 = getDecisionTracker();

    expect(tracker1).toBe(tracker2);
  });

  it('should preserve state across calls', () => {
    const tracker1 = getDecisionTracker();
    tracker1.recordDecision({
      action: 'Test action',
      reasoning: ['test'],
      confidence: 'high',
      context: {
        trigger: 'test',
        inputs: {},
        constraints: [],
        alternatives: [],
      },
    });

    const tracker2 = getDecisionTracker();
    expect(tracker2.getStats().totalDecisions).toBe(1);
  });
});

describe('setDefaultDecisionTracker', () => {
  afterEach(() => {
    // Reset singleton
    setDefaultDecisionTracker(new DecisionTracker());
  });

  it('should set the default tracker', () => {
    const customTracker = createDecisionTracker({ maxDecisions: 100 });
    customTracker.recordDecision({
      action: 'Custom tracker action',
      reasoning: ['test'],
      confidence: 'high',
      context: {
        trigger: 'test',
        inputs: {},
        constraints: [],
        alternatives: [],
      },
    });

    setDefaultDecisionTracker(customTracker);

    const retrieved = getDecisionTracker();
    expect(retrieved).toBe(customTracker);
    expect(retrieved.getStats().totalDecisions).toBe(1);
  });

  it('should replace existing singleton', () => {
    const tracker1 = getDecisionTracker();
    tracker1.recordDecision({
      action: 'Original action',
      reasoning: ['test'],
      confidence: 'high',
      context: {
        trigger: 'test',
        inputs: {},
        constraints: [],
        alternatives: [],
      },
    });

    const newTracker = createDecisionTracker();
    setDefaultDecisionTracker(newTracker);

    const retrieved = getDecisionTracker();
    expect(retrieved).toBe(newTracker);
    expect(retrieved.getStats().totalDecisions).toBe(0);
  });
});

describe('Event Handling', () => {
  let tracker: DecisionTracker;

  beforeEach(() => {
    tracker = createDecisionTracker();
  });

  afterEach(() => {
    tracker.removeAllListeners();
    tracker.clear();
  });

  it('should support multiple listeners for same event', () => {
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    tracker.on('decisionRecorded', handler1);
    tracker.on('decisionRecorded', handler2);

    tracker.recordDecision({
      action: 'Test',
      reasoning: ['test'],
      confidence: 'high',
      context: {
        trigger: 'test',
        inputs: {},
        constraints: [],
        alternatives: [],
      },
    });

    expect(handler1).toHaveBeenCalled();
    expect(handler2).toHaveBeenCalled();
  });

  it('should allow removing listeners', () => {
    const handler = vi.fn();
    tracker.on('decisionRecorded', handler);
    tracker.removeListener('decisionRecorded', handler);

    tracker.recordDecision({
      action: 'Test',
      reasoning: ['test'],
      confidence: 'high',
      context: {
        trigger: 'test',
        inputs: {},
        constraints: [],
        alternatives: [],
      },
    });

    expect(handler).not.toHaveBeenCalled();
  });

  it('should support once listeners', () => {
    const handler = vi.fn();
    tracker.once('decisionRecorded', handler);

    tracker.recordDecision({
      action: 'Test 1',
      reasoning: ['test'],
      confidence: 'high',
      context: {
        trigger: 'test',
        inputs: {},
        constraints: [],
        alternatives: [],
      },
    });

    tracker.recordDecision({
      action: 'Test 2',
      reasoning: ['test'],
      confidence: 'high',
      context: {
        trigger: 'test',
        inputs: {},
        constraints: [],
        alternatives: [],
      },
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
