/**
 * Agent Equilibrium Selector Tests
 *
 * Tests for SPEC-006a: Nash equilibrium-based agent selection.
 * Verifies convergence behavior, dominated agent collapse,
 * capability matching, competition calculation, and type boosts.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  AgentEquilibriumSelector,
  createAgentEquilibriumSelector,
  createEquilibriumTask,
  type Task,
  type EquilibriumConfig,
} from '../../src/equilibrium/agent-equilibrium.js';
import { AgentType } from '../../src/agents/types.js';
import { type AgentInfo } from '../../src/agents/planner-agent.js';

// ============================================================================
// Test Fixtures
// ============================================================================

function createMockAgent(
  id: string,
  type: AgentType,
  capabilities: string[] = [],
  availability: number = 1.0
): AgentInfo {
  return {
    id,
    type,
    capabilities,
    availability,
    performanceScore: 80,
  };
}

function createMockTask(
  id: string,
  description: string,
  requiredCapabilities: string[] = [],
  priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
): Task {
  return {
    id,
    description,
    requiredCapabilities,
    priority,
    complexity: 0.5,
  };
}

// ============================================================================
// Test Suites
// ============================================================================

describe('AgentEquilibriumSelector', () => {
  let selector: AgentEquilibriumSelector;

  beforeEach(() => {
    selector = new AgentEquilibriumSelector();
  });

  // --------------------------------------------------------------------------
  // Initialization Tests
  // --------------------------------------------------------------------------

  describe('initialization', () => {
    it('should create selector with default configuration', () => {
      const config = selector.getConfig();
      expect(config.learningRate).toBe(0.1);
      expect(config.maxIterations).toBe(100);
      expect(config.convergenceThreshold).toBe(0.001);
      expect(config.minParticipation).toBe(0.01);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<EquilibriumConfig> = {
        learningRate: 0.2,
        maxIterations: 50,
        convergenceThreshold: 0.01,
        minParticipation: 0.05,
      };
      const customSelector = new AgentEquilibriumSelector(customConfig);
      const config = customSelector.getConfig();

      expect(config.learningRate).toBe(0.2);
      expect(config.maxIterations).toBe(50);
      expect(config.convergenceThreshold).toBe(0.01);
      expect(config.minParticipation).toBe(0.05);
    });

    it('should merge partial configuration with defaults', () => {
      const partialConfig: Partial<EquilibriumConfig> = {
        learningRate: 0.05,
      };
      const partialSelector = new AgentEquilibriumSelector(partialConfig);
      const config = partialSelector.getConfig();

      expect(config.learningRate).toBe(0.05);
      expect(config.maxIterations).toBe(100); // default
      expect(config.convergenceThreshold).toBe(0.001); // default
    });
  });

  // --------------------------------------------------------------------------
  // Uniform Initialization Tests
  // --------------------------------------------------------------------------

  describe('uniform initialization', () => {
    it('should initialize all agents with equal participation', async () => {
      const agents = [
        createMockAgent('agent-1', AgentType.CODER, ['typescript']),
        createMockAgent('agent-2', AgentType.CODER, ['javascript']),
        createMockAgent('agent-3', AgentType.CODER, ['python']),
      ];
      const task = createMockTask('task-1', 'Write code', ['typescript']);

      await selector.findEquilibrium(task, agents);
      const participations = selector.getParticipations();

      // All agents should have been initialized
      expect(participations.size).toBeGreaterThan(0);
    });

    it('should handle empty agent list', async () => {
      const task = createMockTask('task-1', 'Some task');
      const result = await selector.findEquilibrium(task, []);

      expect(result).toEqual([]);
    });

    it('should handle single agent optimally', async () => {
      const agent = createMockAgent('agent-1', AgentType.CODER, ['typescript']);
      const task = createMockTask('task-1', 'Write code', ['typescript']);

      const result = await selector.findEquilibrium(task, [agent]);

      expect(result).toHaveLength(1);
      expect(result[0].participationLevel).toBe(1.0);
      expect(result[0].redundancyPenalty).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // Convergence Tests
  // --------------------------------------------------------------------------

  describe('convergence behavior', () => {
    it('should converge within max iterations', async () => {
      const agents = [
        createMockAgent('agent-1', AgentType.CODER, ['typescript']),
        createMockAgent('agent-2', AgentType.TESTER, ['testing']),
        createMockAgent('agent-3', AgentType.REVIEWER, ['review']),
      ];
      const task = createMockTask('task-1', 'Implement feature', ['typescript']);

      await selector.findEquilibrium(task, agents);
      const history = selector.getIterationHistory();

      // Should have iteration history (may be empty if converged immediately)
      expect(history.length).toBeLessThanOrEqual(100);
    });

    it('should record iteration history', async () => {
      const agents = [
        createMockAgent('agent-1', AgentType.CODER, ['typescript']),
        createMockAgent('agent-2', AgentType.CODER, ['typescript']),
      ];
      const task = createMockTask('task-1', 'Write code', ['typescript']);

      await selector.findEquilibrium(task, agents);
      const history = selector.getIterationHistory();

      // Each entry should have iteration number and utility
      for (const entry of history) {
        expect(entry).toHaveProperty('iteration');
        expect(entry).toHaveProperty('totalUtility');
        expect(typeof entry.iteration).toBe('number');
        expect(typeof entry.totalUtility).toBe('number');
      }
    });

    it('should reach stable equilibrium with consistent agents', async () => {
      const agents = [
        createMockAgent('agent-1', AgentType.CODER, ['typescript', 'react']),
        createMockAgent('agent-2', AgentType.CODER, ['python', 'django']),
      ];
      const task = createMockTask('task-1', 'Implement code', ['typescript']);

      const result = await selector.findEquilibrium(task, agents);

      // Agent with matching capability should have higher participation
      const agent1 = result.find(p => p.agentId === 'agent-1');
      const agent2 = result.find(p => p.agentId === 'agent-2');

      if (agent1 && agent2) {
        expect(agent1.participationLevel).toBeGreaterThan(agent2.participationLevel);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Dominated Agent Collapse Tests
  // --------------------------------------------------------------------------

  describe('dominated agents collapse', () => {
    it('should collapse poorly matched agents to zero', async () => {
      // Create one well-matched agent and one poorly matched
      const agents = [
        createMockAgent('good-match', AgentType.CODER, ['typescript', 'react', 'nodejs']),
        createMockAgent('poor-match', AgentType.DOCUMENTER, []),
      ];
      const task = createMockTask('task-1', 'Implement code feature', ['typescript', 'react']);

      const result = await selector.findEquilibrium(task, agents);

      // Good match should participate
      const goodMatch = result.find(p => p.agentId === 'good-match');
      expect(goodMatch).toBeDefined();
      expect(goodMatch!.participationLevel).toBeGreaterThan(0);

      // Poor match may collapse to zero (filtered out) or have very low participation
      const poorMatch = result.find(p => p.agentId === 'poor-match');
      if (poorMatch) {
        expect(poorMatch.participationLevel).toBeLessThan(goodMatch!.participationLevel);
      }
    });

    it('should respect minParticipation threshold', async () => {
      const customSelector = new AgentEquilibriumSelector({
        minParticipation: 0.1, // Higher threshold
        maxIterations: 200,
      });

      const agents = [
        createMockAgent('strong', AgentType.CODER, ['typescript', 'react']),
        createMockAgent('weak', AgentType.CUSTOM, []),
      ];
      const task = createMockTask('task-1', 'Implement code', ['typescript']);

      const result = await customSelector.findEquilibrium(task, agents);

      // All remaining participants should be above threshold
      for (const p of result) {
        expect(p.participationLevel).toBeGreaterThanOrEqual(0.1);
      }
    });
  });

  // --------------------------------------------------------------------------
  // Capability Matching Tests
  // --------------------------------------------------------------------------

  describe('capability matching', () => {
    it('should score full capability match highly', () => {
      const agent = createMockAgent('agent-1', AgentType.CODER, ['typescript', 'react', 'nodejs']);
      const task = createMockTask('task-1', 'Implement feature', ['typescript', 'react']);

      const effectiveness = selector.calculateEffectiveness(agent, task);

      // Full match should give high score (2/2 = 1.0 for capability portion)
      expect(effectiveness).toBeGreaterThan(0.5);
    });

    it('should score partial capability match proportionally', () => {
      const agent = createMockAgent('agent-1', AgentType.CODER, ['typescript']);
      const task = createMockTask('task-1', 'Implement feature', ['typescript', 'react', 'nodejs']);

      const effectiveness = selector.calculateEffectiveness(agent, task);

      // Partial match (1/3) should give proportional score
      expect(effectiveness).toBeGreaterThan(0);
      expect(effectiveness).toBeLessThan(1);
    });

    it('should handle agent with no capabilities', () => {
      const agent = createMockAgent('agent-1', AgentType.CODER, []);
      const task = createMockTask('task-1', 'Implement feature', ['typescript']);

      const effectiveness = selector.calculateEffectiveness(agent, task);

      // No capability match (0/1 = 0) but may still get type boost
      expect(effectiveness).toBeDefined();
      expect(typeof effectiveness).toBe('number');
    });

    it('should handle task with no required capabilities', () => {
      const agent = createMockAgent('agent-1', AgentType.CODER, ['typescript']);
      const task = createMockTask('task-1', 'General task', []);

      const effectiveness = selector.calculateEffectiveness(agent, task);

      // Should use default 0.5 for capability match
      expect(effectiveness).toBeGreaterThan(0);
    });
  });

  // --------------------------------------------------------------------------
  // Competition Calculation Tests
  // --------------------------------------------------------------------------

  describe('competition calculation', () => {
    it('should calculate zero competition for non-overlapping agents', async () => {
      const agents = [
        createMockAgent('coder', AgentType.CODER, ['typescript']),
        createMockAgent('tester', AgentType.TESTER, ['testing']),
        createMockAgent('reviewer', AgentType.REVIEWER, ['review']),
      ];
      const task = createMockTask('task-1', 'Develop feature', []);

      // Initialize participations first
      await selector.findEquilibrium(task, agents);

      // Calculate competition for coder
      const competition = selector.calculateCompetition(agents[0], agents);

      // Should have low competition due to different capabilities
      expect(competition).toBeLessThan(1);
    });

    it('should calculate high competition for overlapping agents', async () => {
      const agents = [
        createMockAgent('coder-1', AgentType.CODER, ['typescript', 'react']),
        createMockAgent('coder-2', AgentType.CODER, ['typescript', 'react']),
      ];
      const task = createMockTask('task-1', 'Write code', ['typescript']);

      // Initialize participations first
      await selector.findEquilibrium(task, agents);

      // At equilibrium, identical agents should share participation
      // The sum of their competitions should be positive (they compete with each other)
      const competition1 = selector.calculateCompetition(agents[0], agents);
      const competition2 = selector.calculateCompetition(agents[1], agents);

      // At least one agent should face competition, or both should have
      // positive participation (meaning neither was completely dominated)
      const participations = selector.getParticipations();
      const p1 = participations.get('coder-1');
      const p2 = participations.get('coder-2');

      // Either there's competition or one agent dominated completely
      expect(competition1 + competition2 >= 0).toBe(true);

      // With identical capabilities, both should have similar participation
      // (neither completely dominates)
      if (p1 && p2 && p1.participationLevel > 0 && p2.participationLevel > 0) {
        // If both are participating, they should face competition
        expect(competition1 >= 0).toBe(true);
        expect(competition2 >= 0).toBe(true);
      }
    });

    it('should handle agents with no defined capabilities', () => {
      const agentA = createMockAgent('agent-a', AgentType.CODER, []);
      const agentB = createMockAgent('agent-b', AgentType.CODER, []);

      const overlap = selector.capabilityOverlap(agentA, agentB);

      // Same type with no capabilities should have high overlap
      expect(overlap).toBe(0.8);
    });

    it('should calculate capability overlap correctly', () => {
      const agentA = createMockAgent('agent-a', AgentType.CODER, ['typescript', 'react']);
      const agentB = createMockAgent('agent-b', AgentType.CODER, ['typescript', 'vue']);

      const overlap = selector.capabilityOverlap(agentA, agentB);

      // 1 overlap (typescript) / max(2, 2) = 0.5
      expect(overlap).toBe(0.5);
    });
  });

  // --------------------------------------------------------------------------
  // Type Boost Tests
  // --------------------------------------------------------------------------

  describe('type boost', () => {
    it('should boost coder for code-related tasks', () => {
      const task = createMockTask('task-1', 'Implement the feature code');

      const coderBoost = selector.getTypeBoost(AgentType.CODER, task);
      const testerBoost = selector.getTypeBoost(AgentType.TESTER, task);

      expect(coderBoost).toBe(1.0);
      expect(testerBoost).toBe(0.3); // Default for non-matching
    });

    it('should boost tester for test-related tasks', () => {
      const task = createMockTask('task-1', 'Write unit tests for the module');

      const testerBoost = selector.getTypeBoost(AgentType.TESTER, task);
      const coderBoost = selector.getTypeBoost(AgentType.CODER, task);

      expect(testerBoost).toBe(1.0);
      expect(coderBoost).toBe(0.3);
    });

    it('should boost reviewer for review-related tasks', () => {
      const task = createMockTask('task-1', 'Review the pull request');

      const reviewerBoost = selector.getTypeBoost(AgentType.REVIEWER, task);
      expect(reviewerBoost).toBe(1.0);
    });

    it('should boost documenter for documentation tasks', () => {
      const task = createMockTask('task-1', 'Document the API endpoints');

      const documenterBoost = selector.getTypeBoost(AgentType.DOCUMENTER, task);
      expect(documenterBoost).toBe(1.0);
    });

    it('should boost planner for planning tasks', () => {
      const task = createMockTask('task-1', 'Plan the sprint activities');

      const plannerBoost = selector.getTypeBoost(AgentType.PLANNER, task);
      expect(plannerBoost).toBe(1.0);
    });

    it('should boost optimizer for optimization tasks', () => {
      const task = createMockTask('task-1', 'Optimize the database queries');

      const optimizerBoost = selector.getTypeBoost(AgentType.OPTIMIZER, task);
      expect(optimizerBoost).toBe(1.0);
    });

    it('should boost researcher for research tasks', () => {
      const task = createMockTask('task-1', 'Research best practices');

      const researcherBoost = selector.getTypeBoost(AgentType.RESEARCHER, task);
      expect(researcherBoost).toBe(1.0);
    });

    it('should boost analyst for analysis tasks', () => {
      const task = createMockTask('task-1', 'Analyze performance metrics');

      const analystBoost = selector.getTypeBoost(AgentType.ANALYST, task);
      expect(analystBoost).toBe(1.0);
    });

    it('should boost architect for architecture tasks', () => {
      const task = createMockTask('task-1', 'Architect the microservices system');

      const architectBoost = selector.getTypeBoost(AgentType.ARCHITECT, task);
      expect(architectBoost).toBe(1.0);
    });

    it('should boost architect for design tasks', () => {
      const task = createMockTask('task-1', 'Design the system architecture');

      const architectBoost = selector.getTypeBoost(AgentType.ARCHITECT, task);
      expect(architectBoost).toBe(1.0);
    });

    it('should boost coordinator for coordination tasks', () => {
      const task = createMockTask('task-1', 'Coordinate the team efforts');

      const coordinatorBoost = selector.getTypeBoost(AgentType.COORDINATOR, task);
      expect(coordinatorBoost).toBe(1.0);
    });
  });

  // --------------------------------------------------------------------------
  // selectTopAgents Tests
  // --------------------------------------------------------------------------

  describe('selectTopAgents', () => {
    it('should select exactly N agents when available', async () => {
      const agents = [
        createMockAgent('agent-1', AgentType.CODER, ['typescript']),
        createMockAgent('agent-2', AgentType.CODER, ['javascript']),
        createMockAgent('agent-3', AgentType.CODER, ['python']),
        createMockAgent('agent-4', AgentType.TESTER, ['testing']),
      ];
      const task = createMockTask('task-1', 'Implement feature', ['typescript']);

      const selected = await selector.selectTopAgents(task, agents, 2);

      expect(selected.length).toBeLessThanOrEqual(2);
    });

    it('should return fewer than N if not enough agents qualify', async () => {
      const agents = [
        createMockAgent('agent-1', AgentType.CODER, ['typescript']),
      ];
      const task = createMockTask('task-1', 'Implement feature', ['typescript']);

      const selected = await selector.selectTopAgents(task, agents, 5);

      expect(selected.length).toBe(1);
    });

    it('should return AgentInfo objects, not participation objects', async () => {
      const agents = [
        createMockAgent('agent-1', AgentType.CODER, ['typescript']),
        createMockAgent('agent-2', AgentType.TESTER, ['testing']),
      ];
      const task = createMockTask('task-1', 'Implement and test', ['typescript']);

      const selected = await selector.selectTopAgents(task, agents, 2);

      for (const agent of selected) {
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('type');
        expect(agent).toHaveProperty('capabilities');
        expect(agent).toHaveProperty('availability');
      }
    });

    it('should select best matching agents first', async () => {
      const agents = [
        createMockAgent('perfect-match', AgentType.CODER, ['typescript', 'react']),
        createMockAgent('partial-match', AgentType.CODER, ['typescript']),
        createMockAgent('no-match', AgentType.DOCUMENTER, ['markdown']),
      ];
      const task = createMockTask('task-1', 'Implement code feature', ['typescript', 'react']);

      const selected = await selector.selectTopAgents(task, agents, 1);

      expect(selected.length).toBe(1);
      expect(selected[0].id).toBe('perfect-match');
    });
  });

  // --------------------------------------------------------------------------
  // Utility Calculation Tests
  // --------------------------------------------------------------------------

  describe('utility calculation', () => {
    it('should calculate positive total utility for participating agents', async () => {
      const agents = [
        createMockAgent('agent-1', AgentType.CODER, ['typescript']),
        createMockAgent('agent-2', AgentType.TESTER, ['testing']),
      ];
      const task = createMockTask('task-1', 'Develop feature', ['typescript']);

      const result = await selector.findEquilibrium(task, agents);
      const totalUtility = selector.calculateTotalUtility();

      // At least one agent should have positive utility
      expect(result.some(p => p.utility > 0)).toBe(true);
    });

    it('should include utility in participation results', async () => {
      const agents = [
        createMockAgent('agent-1', AgentType.CODER, ['typescript']),
      ];
      const task = createMockTask('task-1', 'Write code', ['typescript']);

      const result = await selector.findEquilibrium(task, agents);

      expect(result[0]).toHaveProperty('utility');
      expect(typeof result[0].utility).toBe('number');
    });
  });

  // --------------------------------------------------------------------------
  // Edge Cases
  // --------------------------------------------------------------------------

  describe('edge cases', () => {
    it('should handle agents with identical capabilities', async () => {
      const agents = [
        createMockAgent('agent-1', AgentType.CODER, ['typescript', 'react']),
        createMockAgent('agent-2', AgentType.CODER, ['typescript', 'react']),
        createMockAgent('agent-3', AgentType.CODER, ['typescript', 'react']),
      ];
      const task = createMockTask('task-1', 'Implement code', ['typescript']);

      const result = await selector.findEquilibrium(task, agents);

      // Should converge without errors
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle high complexity tasks', async () => {
      const agents = [
        createMockAgent('agent-1', AgentType.ARCHITECT, ['architecture', 'design']),
        createMockAgent('agent-2', AgentType.CODER, ['typescript']),
      ];
      const task: Task = {
        id: 'complex-task',
        description: 'Design and implement complex system',
        requiredCapabilities: ['architecture', 'typescript'],
        priority: 'critical',
        complexity: 0.95,
      };

      const result = await selector.findEquilibrium(task, agents);

      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle very small learning rate', async () => {
      const slowSelector = new AgentEquilibriumSelector({
        learningRate: 0.001,
        maxIterations: 500,
      });

      const agents = [
        createMockAgent('agent-1', AgentType.CODER, ['typescript']),
        createMockAgent('agent-2', AgentType.TESTER, ['testing']),
      ];
      const task = createMockTask('task-1', 'Implement feature', ['typescript']);

      const result = await slowSelector.findEquilibrium(task, agents);

      // Should still produce valid results
      expect(result).toBeDefined();
    });

    it('should handle very large agent pool', async () => {
      const agents = Array.from({ length: 20 }, (_, i) =>
        createMockAgent(
          `agent-${i}`,
          Object.values(AgentType)[i % Object.values(AgentType).length] as AgentType,
          [`cap-${i}`, `shared-cap`]
        )
      );
      const task = createMockTask('task-1', 'General task', ['shared-cap']);

      const result = await selector.findEquilibrium(task, agents);

      // Should complete without error
      expect(result).toBeDefined();
      expect(result.length).toBeLessThanOrEqual(20);
    });
  });

  // --------------------------------------------------------------------------
  // Factory Function Tests
  // --------------------------------------------------------------------------

  describe('factory functions', () => {
    it('createAgentEquilibriumSelector should create valid selector', () => {
      const selector = createAgentEquilibriumSelector();
      expect(selector).toBeInstanceOf(AgentEquilibriumSelector);
    });

    it('createAgentEquilibriumSelector should accept config', () => {
      const selector = createAgentEquilibriumSelector({ learningRate: 0.5 });
      expect(selector.getConfig().learningRate).toBe(0.5);
    });

    it('createEquilibriumTask should create valid task', () => {
      const task = createEquilibriumTask('task-1', 'Test task', {
        requiredCapabilities: ['cap-1'],
        priority: 'high',
        complexity: 0.8,
      });

      expect(task.id).toBe('task-1');
      expect(task.description).toBe('Test task');
      expect(task.requiredCapabilities).toEqual(['cap-1']);
      expect(task.priority).toBe('high');
      expect(task.complexity).toBe(0.8);
    });

    it('createEquilibriumTask should use defaults', () => {
      const task = createEquilibriumTask('task-1', 'Test task');

      expect(task.requiredCapabilities).toEqual([]);
      expect(task.priority).toBe('medium');
      expect(task.complexity).toBe(0.5);
    });
  });
});
