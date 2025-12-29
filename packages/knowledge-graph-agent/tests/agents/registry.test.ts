/**
 * Tests for AgentRegistry
 *
 * Comprehensive tests for agent type registration, instantiation, lifecycle
 * management, and health monitoring.
 *
 * @module tests/agents/registry
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AgentRegistry,
  createRegistry,
  getRegistry,
  setDefaultRegistry,
  registerDefaultAgents,
  AgentType,
  AgentStatus,
  type AgentConfig,
  type AgentFactory,
  type AgentInstance,
  type AgentState,
  type AgentTask,
  type AgentResult,
  TaskPriority,
} from '../../src/agents/index.js';

/**
 * Create a mock agent instance for testing
 */
function createMockAgent(config: AgentConfig): AgentInstance {
  const state: AgentState = {
    id: config.id || `${config.type}-${Date.now()}`,
    status: AgentStatus.IDLE,
    taskQueue: [],
    completedTasks: [],
    lastActivity: new Date(),
    errorCount: 0,
  };

  return {
    config,
    state,
    execute: vi.fn().mockResolvedValue({ success: true, data: {} }),
    pause: vi.fn().mockResolvedValue(undefined),
    resume: vi.fn().mockResolvedValue(undefined),
    terminate: vi.fn().mockResolvedValue(undefined),
    getStatus: () => state.status,
  };
}

/**
 * Create a mock agent factory
 */
function createMockFactory(type: AgentType): AgentFactory {
  return async (config: AgentConfig) => createMockAgent({ ...config, type });
}

describe('AgentRegistry', () => {
  let registry: AgentRegistry;

  beforeEach(() => {
    registry = createRegistry();
  });

  afterEach(async () => {
    await registry.dispose();
  });

  describe('constructor', () => {
    it('should create a registry instance', () => {
      expect(registry).toBeInstanceOf(AgentRegistry);
    });

    it('should accept configuration options', () => {
      const configured = createRegistry({
        maxAgentsPerType: 5,
        defaultTimeout: 60000,
        enableHealthMonitoring: false,
      });
      expect(configured).toBeInstanceOf(AgentRegistry);
    });

    it('should initialize with empty state', () => {
      const stats = registry.getStats();
      expect(stats.registeredTypes).toBe(0);
      expect(stats.totalInstances).toBe(0);
    });
  });

  describe('register', () => {
    it('should register an agent factory', () => {
      registry.register(AgentType.RESEARCHER, createMockFactory(AgentType.RESEARCHER));

      const types = registry.listTypes();
      expect(types.map(t => t.type)).toContain(AgentType.RESEARCHER);
    });

    it('should register with capabilities', () => {
      registry.register(AgentType.CODER, createMockFactory(AgentType.CODER), {
        capabilities: [
          { name: 'code', description: 'Code generation' },
          { name: 'refactor', description: 'Code refactoring' },
        ],
      });

      const types = registry.listTypes();
      const coderType = types.find(t => t.type === AgentType.CODER);
      expect(coderType?.capabilities).toHaveLength(2);
      expect(coderType?.capabilities.map(c => c.name)).toContain('code');
    });

    it('should register with default configuration', () => {
      registry.register(AgentType.TESTER, createMockFactory(AgentType.TESTER), {
        defaultConfig: {
          name: 'Default Tester',
          taskTimeout: 30000,
        },
      });

      expect(registry.isRegistered(AgentType.TESTER)).toBe(true);
    });

    it('should allow re-registering (overwriting) a type', () => {
      const factory1 = vi.fn(createMockFactory(AgentType.ANALYST));
      const factory2 = vi.fn(createMockFactory(AgentType.ANALYST));

      registry.register(AgentType.ANALYST, factory1);
      registry.register(AgentType.ANALYST, factory2);

      const types = registry.listTypes();
      expect(types.filter(t => t.type === AgentType.ANALYST)).toHaveLength(1);
    });

    it('should register with metadata', () => {
      registry.register(AgentType.ARCHITECT, createMockFactory(AgentType.ARCHITECT), {
        metadata: {
          version: '1.0.0',
          author: 'test',
        },
      });

      const registration = registry.getRegistration(AgentType.ARCHITECT);
      expect(registration?.metadata?.version).toBe('1.0.0');
    });
  });

  describe('unregister', () => {
    it('should unregister an agent type', async () => {
      registry.register(AgentType.RESEARCHER, createMockFactory(AgentType.RESEARCHER));

      const result = registry.unregister(AgentType.RESEARCHER);

      expect(result).toBe(true);
      expect(registry.isRegistered(AgentType.RESEARCHER)).toBe(false);
    });

    it('should terminate instances when unregistering', async () => {
      registry.register(AgentType.CODER, createMockFactory(AgentType.CODER));
      const agent = await registry.spawn(AgentType.CODER, { name: 'Test Coder' });

      registry.unregister(AgentType.CODER);

      // Give time for termination
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(registry.getAll()).toHaveLength(0);
    });

    it('should return false for non-registered type', () => {
      const result = registry.unregister(AgentType.CUSTOM);
      expect(result).toBe(false);
    });
  });

  describe('isRegistered', () => {
    it('should return true for registered types', () => {
      registry.register(AgentType.TESTER, createMockFactory(AgentType.TESTER));
      expect(registry.isRegistered(AgentType.TESTER)).toBe(true);
    });

    it('should return false for non-registered types', () => {
      expect(registry.isRegistered(AgentType.CUSTOM)).toBe(false);
    });
  });

  describe('getRegistration', () => {
    it('should return registration info', () => {
      registry.register(AgentType.ANALYST, createMockFactory(AgentType.ANALYST), {
        capabilities: [{ name: 'analyze', description: 'Analysis' }],
      });

      const registration = registry.getRegistration(AgentType.ANALYST);

      expect(registration).toBeDefined();
      expect(registration?.type).toBe(AgentType.ANALYST);
      expect(registration?.capabilities).toHaveLength(1);
      expect(registration?.registeredAt).toBeInstanceOf(Date);
    });

    it('should return undefined for non-registered type', () => {
      const registration = registry.getRegistration(AgentType.CUSTOM);
      expect(registration).toBeUndefined();
    });
  });

  describe('spawn', () => {
    it('should spawn an agent of registered type', async () => {
      registry.register(AgentType.CODER, createMockFactory(AgentType.CODER));

      const agent = await registry.spawn(AgentType.CODER, { name: 'test-coder' });

      expect(agent).toBeDefined();
      expect(agent.config.type).toBe(AgentType.CODER);
      expect(agent.config.name).toBe('test-coder');
    });

    it('should throw for unregistered agent type', async () => {
      await expect(
        registry.spawn(AgentType.CUSTOM, { name: 'unknown' })
      ).rejects.toThrow('Agent type not registered');
    });

    it('should assign unique ID to spawned agents', async () => {
      registry.register(AgentType.TESTER, createMockFactory(AgentType.TESTER));

      const agent1 = await registry.spawn(AgentType.TESTER, { name: 'Tester 1' });
      const agent2 = await registry.spawn(AgentType.TESTER, { name: 'Tester 2' });

      expect(agent1.config.id).not.toBe(agent2.config.id);
    });

    it('should respect custom ID in spawn options', async () => {
      registry.register(AgentType.RESEARCHER, createMockFactory(AgentType.RESEARCHER));

      const agent = await registry.spawn(
        AgentType.RESEARCHER,
        { name: 'Custom ID Agent' },
        { id: 'my-custom-id' }
      );

      expect(agent.config.id).toBe('my-custom-id');
    });

    it('should merge default config with provided config', async () => {
      registry.register(AgentType.ARCHITECT, createMockFactory(AgentType.ARCHITECT), {
        defaultConfig: {
          name: 'Default Architect',
          taskTimeout: 60000,
        },
      });

      const agent = await registry.spawn(AgentType.ARCHITECT, { name: 'Custom Architect' });

      expect(agent.config.name).toBe('Custom Architect');
    });

    it('should apply config overrides from spawn options', async () => {
      registry.register(AgentType.CODER, createMockFactory(AgentType.CODER));

      const agent = await registry.spawn(
        AgentType.CODER,
        { name: 'Base Config' },
        { configOverrides: { description: 'Override description' } }
      );

      expect(agent.config.description).toBe('Override description');
    });

    it('should track spawned instances', async () => {
      registry.register(AgentType.TESTER, createMockFactory(AgentType.TESTER));

      await registry.spawn(AgentType.TESTER, { name: 'Tester 1' });
      await registry.spawn(AgentType.TESTER, { name: 'Tester 2' });

      const agents = registry.getAll();
      expect(agents).toHaveLength(2);
    });

    it('should enforce max agents per type limit', async () => {
      const limitedRegistry = createRegistry({ maxAgentsPerType: 2 });
      limitedRegistry.register(AgentType.CODER, createMockFactory(AgentType.CODER));

      await limitedRegistry.spawn(AgentType.CODER, { name: 'Coder 1' });
      await limitedRegistry.spawn(AgentType.CODER, { name: 'Coder 2' });

      await expect(
        limitedRegistry.spawn(AgentType.CODER, { name: 'Coder 3' })
      ).rejects.toThrow('Maximum agents of type');

      await limitedRegistry.dispose();
    });
  });

  describe('spawnMultiple', () => {
    it('should spawn multiple agents in parallel', async () => {
      registry.register(AgentType.RESEARCHER, createMockFactory(AgentType.RESEARCHER));
      registry.register(AgentType.CODER, createMockFactory(AgentType.CODER));

      const agents = await registry.spawnMultiple([
        { type: AgentType.RESEARCHER, config: { name: 'Researcher' } },
        { type: AgentType.CODER, config: { name: 'Coder' } },
      ]);

      expect(agents).toHaveLength(2);
      expect(agents.map(a => a.config.type)).toContain(AgentType.RESEARCHER);
      expect(agents.map(a => a.config.type)).toContain(AgentType.CODER);
    });

    it('should continue spawning even if some fail', async () => {
      registry.register(AgentType.RESEARCHER, createMockFactory(AgentType.RESEARCHER));
      // AgentType.CODER is not registered

      const agents = await registry.spawnMultiple([
        { type: AgentType.RESEARCHER, config: { name: 'Researcher' } },
        { type: AgentType.CODER, config: { name: 'Coder' } }, // Will fail
      ]);

      expect(agents).toHaveLength(1);
      expect(agents[0].config.type).toBe(AgentType.RESEARCHER);
    });
  });

  describe('get', () => {
    it('should get agent instance by ID', async () => {
      registry.register(AgentType.ANALYST, createMockFactory(AgentType.ANALYST));
      const spawned = await registry.spawn(AgentType.ANALYST, { name: 'Test Analyst' });

      const retrieved = registry.get(spawned.config.id!);

      expect(retrieved).toBe(spawned);
    });

    it('should return undefined for non-existent ID', () => {
      const agent = registry.get('non-existent-id');
      expect(agent).toBeUndefined();
    });
  });

  describe('getAll', () => {
    it('should return all agent instances', async () => {
      registry.register(AgentType.TESTER, createMockFactory(AgentType.TESTER));

      await registry.spawn(AgentType.TESTER, { name: 'Tester 1' });
      await registry.spawn(AgentType.TESTER, { name: 'Tester 2' });

      const agents = registry.getAll();
      expect(agents).toHaveLength(2);
    });

    it('should return empty array when no agents spawned', () => {
      const agents = registry.getAll();
      expect(agents).toHaveLength(0);
    });
  });

  describe('getByType', () => {
    it('should return agents of specific type', async () => {
      registry.register(AgentType.CODER, createMockFactory(AgentType.CODER));
      registry.register(AgentType.TESTER, createMockFactory(AgentType.TESTER));

      await registry.spawn(AgentType.CODER, { name: 'Coder 1' });
      await registry.spawn(AgentType.CODER, { name: 'Coder 2' });
      await registry.spawn(AgentType.TESTER, { name: 'Tester 1' });

      const coders = registry.getByType(AgentType.CODER);
      const testers = registry.getByType(AgentType.TESTER);

      expect(coders).toHaveLength(2);
      expect(testers).toHaveLength(1);
    });

    it('should return empty array for type with no instances', async () => {
      registry.register(AgentType.RESEARCHER, createMockFactory(AgentType.RESEARCHER));

      const researchers = registry.getByType(AgentType.RESEARCHER);
      expect(researchers).toHaveLength(0);
    });
  });

  describe('listTypes', () => {
    it('should list all registered agent types', () => {
      registry.register(AgentType.RESEARCHER, createMockFactory(AgentType.RESEARCHER), {
        capabilities: [{ name: 'search', description: 'Search' }],
      });
      registry.register(AgentType.CODER, createMockFactory(AgentType.CODER));

      const types = registry.listTypes();

      expect(types).toHaveLength(2);
      expect(types.map(t => t.type)).toContain(AgentType.RESEARCHER);
      expect(types.map(t => t.type)).toContain(AgentType.CODER);
    });

    it('should include instance count', async () => {
      registry.register(AgentType.TESTER, createMockFactory(AgentType.TESTER));
      await registry.spawn(AgentType.TESTER, { name: 'Tester 1' });
      await registry.spawn(AgentType.TESTER, { name: 'Tester 2' });

      const types = registry.listTypes();
      const testerType = types.find(t => t.type === AgentType.TESTER);

      expect(testerType?.instanceCount).toBe(2);
    });
  });

  describe('listInstances', () => {
    it('should list all active agent instances', async () => {
      registry.register(AgentType.ANALYST, createMockFactory(AgentType.ANALYST));
      await registry.spawn(AgentType.ANALYST, { name: 'Analyst 1' });
      await registry.spawn(AgentType.ANALYST, { name: 'Analyst 2' });

      const instances = registry.listInstances();

      expect(instances).toHaveLength(2);
      expect(instances[0]).toHaveProperty('id');
      expect(instances[0]).toHaveProperty('type');
      expect(instances[0]).toHaveProperty('name');
      expect(instances[0]).toHaveProperty('status');
    });
  });

  describe('terminateAgent', () => {
    it('should terminate an agent instance', async () => {
      registry.register(AgentType.CODER, createMockFactory(AgentType.CODER));
      const agent = await registry.spawn(AgentType.CODER, { name: 'Test Coder' });

      const result = await registry.terminateAgent(agent.config.id!);

      expect(result).toBe(true);
      expect(registry.get(agent.config.id!)).toBeUndefined();
      expect(agent.terminate).toHaveBeenCalled();
    });

    it('should return false for non-existent agent', async () => {
      const result = await registry.terminateAgent('non-existent');
      expect(result).toBe(false);
    });

    it('should remove agent from tracking even if terminate fails', async () => {
      registry.register(AgentType.TESTER, async (config) => {
        const agent = createMockAgent(config);
        agent.terminate = vi.fn().mockRejectedValue(new Error('Terminate failed'));
        return agent;
      });

      const agent = await registry.spawn(AgentType.TESTER, { name: 'Failing Tester' });

      await registry.terminateAgent(agent.config.id!);

      expect(registry.get(agent.config.id!)).toBeUndefined();
    });
  });

  describe('terminateByType', () => {
    it('should terminate all agents of a type', async () => {
      registry.register(AgentType.CODER, createMockFactory(AgentType.CODER));

      await registry.spawn(AgentType.CODER, { name: 'Coder 1' });
      await registry.spawn(AgentType.CODER, { name: 'Coder 2' });
      await registry.spawn(AgentType.CODER, { name: 'Coder 3' });

      const count = await registry.terminateByType(AgentType.CODER);

      expect(count).toBe(3);
      expect(registry.getByType(AgentType.CODER)).toHaveLength(0);
    });

    it('should return 0 when no agents of type exist', async () => {
      const count = await registry.terminateByType(AgentType.RESEARCHER);
      expect(count).toBe(0);
    });
  });

  describe('terminateAll', () => {
    it('should terminate all agents', async () => {
      registry.register(AgentType.CODER, createMockFactory(AgentType.CODER));
      registry.register(AgentType.TESTER, createMockFactory(AgentType.TESTER));

      await registry.spawn(AgentType.CODER, { name: 'Coder' });
      await registry.spawn(AgentType.TESTER, { name: 'Tester 1' });
      await registry.spawn(AgentType.TESTER, { name: 'Tester 2' });

      const count = await registry.terminateAll();

      expect(count).toBe(3);
      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('health monitoring', () => {
    it('should perform health checks', async () => {
      registry.register(AgentType.ANALYST, createMockFactory(AgentType.ANALYST));
      await registry.spawn(AgentType.ANALYST, { name: 'Health Test' });

      const checks = await registry.performHealthChecks();

      expect(checks).toHaveLength(1);
      expect(checks[0]).toHaveProperty('agentId');
      expect(checks[0]).toHaveProperty('healthy');
      expect(checks[0]).toHaveProperty('status');
      expect(checks[0]).toHaveProperty('lastHeartbeat');
    });

    it('should get health for specific agent', async () => {
      registry.register(AgentType.RESEARCHER, createMockFactory(AgentType.RESEARCHER));
      const agent = await registry.spawn(AgentType.RESEARCHER, { name: 'Health Agent' });

      const health = await registry.getAgentHealth(agent.config.id!);

      expect(health).not.toBeNull();
      expect(health?.agentId).toBe(agent.config.id);
      expect(health?.healthy).toBe(true);
    });

    it('should return null for non-existent agent health', async () => {
      const health = await registry.getAgentHealth('non-existent');
      expect(health).toBeNull();
    });

    it('should detect unhealthy agents with high error count', async () => {
      registry.register(AgentType.CODER, async (config) => {
        const agent = createMockAgent(config);
        agent.state.errorCount = 10; // High error count
        return agent;
      });

      const agent = await registry.spawn(AgentType.CODER, { name: 'Error Prone' });
      const health = await registry.getAgentHealth(agent.config.id!);

      expect(health?.healthy).toBe(false);
      expect(health?.error).toContain('High error count');
    });
  });

  describe('getStats', () => {
    it('should return registry statistics', async () => {
      registry.register(AgentType.CODER, createMockFactory(AgentType.CODER));
      registry.register(AgentType.TESTER, createMockFactory(AgentType.TESTER));

      await registry.spawn(AgentType.CODER, { name: 'Coder' });
      await registry.spawn(AgentType.TESTER, { name: 'Tester' });

      const stats = registry.getStats();

      expect(stats.registeredTypes).toBe(2);
      expect(stats.totalInstances).toBe(2);
      expect(stats.instancesByType[AgentType.CODER]).toBe(1);
      expect(stats.instancesByType[AgentType.TESTER]).toBe(1);
    });

    it('should track instances by status', async () => {
      registry.register(AgentType.ANALYST, createMockFactory(AgentType.ANALYST));
      await registry.spawn(AgentType.ANALYST, { name: 'Analyst' });

      const stats = registry.getStats();

      expect(stats.instancesByStatus).toHaveProperty(AgentStatus.IDLE);
    });
  });

  describe('clear', () => {
    it('should clear all registrations and instances', async () => {
      registry.register(AgentType.CODER, createMockFactory(AgentType.CODER));
      await registry.spawn(AgentType.CODER, { name: 'Coder' });

      await registry.clear();

      expect(registry.getAll()).toHaveLength(0);
      expect(registry.listTypes()).toHaveLength(0);
    });
  });

  describe('dispose', () => {
    it('should dispose of the registry', async () => {
      registry.register(AgentType.TESTER, createMockFactory(AgentType.TESTER));
      await registry.spawn(AgentType.TESTER, { name: 'Tester' });

      await registry.dispose();

      expect(registry.getAll()).toHaveLength(0);
    });
  });

  describe('default registry', () => {
    it('should get or create default registry', () => {
      const defaultReg = getRegistry();
      expect(defaultReg).toBeInstanceOf(AgentRegistry);
    });

    it('should return same default registry on multiple calls', () => {
      const reg1 = getRegistry();
      const reg2 = getRegistry();
      expect(reg1).toBe(reg2);
    });

    it('should allow setting custom default registry', () => {
      const customRegistry = createRegistry();
      setDefaultRegistry(customRegistry);

      expect(getRegistry()).toBe(customRegistry);
    });
  });

  describe('registerDefaultAgents', () => {
    it('should register agent types with provided factories', () => {
      const factories: Partial<Record<AgentType, AgentFactory>> = {
        [AgentType.RESEARCHER]: createMockFactory(AgentType.RESEARCHER),
        [AgentType.CODER]: createMockFactory(AgentType.CODER),
      };

      registerDefaultAgents(registry, factories);

      expect(registry.isRegistered(AgentType.RESEARCHER)).toBe(true);
      expect(registry.isRegistered(AgentType.CODER)).toBe(true);
      expect(registry.isRegistered(AgentType.TESTER)).toBe(false);
    });

    it('should register with default capabilities', () => {
      registerDefaultAgents(registry, {
        [AgentType.RESEARCHER]: createMockFactory(AgentType.RESEARCHER),
      });

      const types = registry.listTypes();
      const researcher = types.find(t => t.type === AgentType.RESEARCHER);

      expect(researcher?.capabilities.map(c => c.name)).toContain('search');
      expect(researcher?.capabilities.map(c => c.name)).toContain('analyze');
    });
  });
});
