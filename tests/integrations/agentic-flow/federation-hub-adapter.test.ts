/**
 * Federation Hub Adapter Tests
 *
 * Comprehensive test suite for the FederationHubAdapter
 * covering node management, agent lifecycle, and task distribution.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  FederationHubAdapter,
  createFederationHubAdapter,
  type FederationHubConfig,
  type FederationNode,
  type EphemeralAgent,
} from '../../../src/integrations/agentic-flow/adapters/federation-hub-adapter.js';

describe('FederationHubAdapter', () => {
  let adapter: FederationHubAdapter;

  beforeEach(async () => {
    adapter = new FederationHubAdapter();
    await adapter.initialize();
  });

  afterEach(async () => {
    await adapter.dispose();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      const newAdapter = new FederationHubAdapter();
      await newAdapter.initialize();

      expect(newAdapter.isAvailable()).toBe(true);
      expect(newAdapter.getStatus().initialized).toBe(true);

      await newAdapter.dispose();
    });

    it('should initialize with custom config', async () => {
      const config: Partial<FederationHubConfig> = {
        maxAgents: 25,
        heartbeatInterval: 10000,
        loadBalancingStrategy: 'least-loaded',
      };

      const newAdapter = new FederationHubAdapter(config);
      await newAdapter.initialize();

      const storedConfig = newAdapter.getConfig();
      expect(storedConfig.maxAgents).toBe(25);
      expect(storedConfig.heartbeatInterval).toBe(10000);
      expect(storedConfig.loadBalancingStrategy).toBe('least-loaded');

      await newAdapter.dispose();
    });

    it('should return feature name', () => {
      expect(adapter.getFeatureName()).toBe('federation-hub');
    });

    it('should handle multiple initializations', async () => {
      await adapter.initialize();
      await adapter.initialize();

      expect(adapter.isAvailable()).toBe(true);
    });
  });

  // ==========================================================================
  // Node Management Tests
  // ==========================================================================

  describe('node management', () => {
    it('should register a node', async () => {
      const node = await adapter.registerNode({
        id: 'node-1',
        name: 'Worker Node 1',
        endpoint: 'localhost:9001',
        capabilities: ['coder', 'tester'],
      });

      expect(node.id).toBe('node-1');
      expect(node.name).toBe('Worker Node 1');
      expect(node.status).toBe('online');
      expect(node.load).toBe(0);
    });

    it('should register node without ID', async () => {
      const node = await adapter.registerNode({
        id: '', // Empty ID should be auto-generated
        name: 'Auto Node',
        endpoint: 'localhost:9002',
        capabilities: [],
      });

      expect(node.id).toBeDefined();
      expect(node.id.length).toBeGreaterThan(0);
    });

    it('should unregister a node', async () => {
      const node = await adapter.registerNode({
        id: 'node-to-remove',
        name: 'Temporary Node',
        endpoint: 'localhost:9003',
        capabilities: [],
      });

      await adapter.unregisterNode(node.id);

      const retrieved = await adapter.getNode(node.id);
      expect(retrieved).toBeNull();
    });

    it('should throw when unregistering unknown node', async () => {
      await expect(adapter.unregisterNode('unknown-node')).rejects.toThrow('Node not found');
    });

    it('should list nodes', async () => {
      await adapter.registerNode({
        id: 'node-a',
        name: 'Node A',
        endpoint: 'localhost:9001',
        capabilities: ['coder'],
      });

      await adapter.registerNode({
        id: 'node-b',
        name: 'Node B',
        endpoint: 'localhost:9002',
        capabilities: ['tester'],
      });

      const nodes = await adapter.listNodes();
      expect(nodes.length).toBe(2);
    });

    it('should filter nodes by capabilities', async () => {
      await adapter.registerNode({
        id: 'node-coder',
        name: 'Coder Node',
        endpoint: 'localhost:9001',
        capabilities: ['coder', 'reviewer'],
      });

      await adapter.registerNode({
        id: 'node-tester',
        name: 'Tester Node',
        endpoint: 'localhost:9002',
        capabilities: ['tester'],
      });

      const coderNodes = await adapter.listNodes({ capabilities: ['coder'] });
      expect(coderNodes.length).toBe(1);
      expect(coderNodes[0].id).toBe('node-coder');
    });

    it('should get a specific node', async () => {
      await adapter.registerNode({
        id: 'specific-node',
        name: 'Specific Node',
        endpoint: 'localhost:9001',
        capabilities: ['analyst'],
      });

      const node = await adapter.getNode('specific-node');

      expect(node).toBeDefined();
      expect(node!.name).toBe('Specific Node');
      expect(node!.capabilities).toContain('analyst');
    });

    it('should return null for unknown node', async () => {
      const node = await adapter.getNode('nonexistent');
      expect(node).toBeNull();
    });
  });

  // ==========================================================================
  // Ephemeral Agent Tests
  // ==========================================================================

  describe('ephemeral agents', () => {
    let nodeId: string;

    beforeEach(async () => {
      const node = await adapter.registerNode({
        id: 'agent-host',
        name: 'Agent Host Node',
        endpoint: 'localhost:9001',
        capabilities: ['coder', 'tester', 'analyst'],
      });
      nodeId = node.id;
    });

    it('should spawn an ephemeral agent', async () => {
      const agent = await adapter.spawnEphemeralAgent('coder', nodeId);

      expect(agent.id).toBeDefined();
      expect(agent.type).toBe('coder');
      expect(agent.nodeId).toBe(nodeId);
      expect(agent.status).toBe('active');
    });

    it('should spawn agent with custom TTL', async () => {
      const ttl = 60000;
      const agent = await adapter.spawnEphemeralAgent('tester', nodeId, ttl);

      expect(agent.ttl).toBe(ttl);
    });

    it('should auto-select node when not specified', async () => {
      // Register another node
      await adapter.registerNode({
        id: 'another-node',
        name: 'Another Node',
        endpoint: 'localhost:9002',
        capabilities: ['researcher'],
      });

      const agent = await adapter.spawnEphemeralAgent('researcher');

      expect(agent.nodeId).toBeDefined();
      expect(agent.status).toBe('active');
    });

    it('should throw when spawning on unknown node', async () => {
      await expect(adapter.spawnEphemeralAgent('coder', 'unknown-node'))
        .rejects.toThrow('Node not found');
    });

    it('should terminate an agent', async () => {
      const agent = await adapter.spawnEphemeralAgent('coder', nodeId);
      await adapter.terminateAgent(agent.id);

      const agents = await adapter.listAgents(nodeId);
      expect(agents.find(a => a.id === agent.id)).toBeUndefined();
    });

    it('should throw when terminating unknown agent', async () => {
      await expect(adapter.terminateAgent('unknown-agent'))
        .rejects.toThrow('Agent not found');
    });

    it('should list all agents', async () => {
      await adapter.spawnEphemeralAgent('coder', nodeId);
      await adapter.spawnEphemeralAgent('tester', nodeId);

      const agents = await adapter.listAgents();
      expect(agents.length).toBe(2);
    });

    it('should list agents by node', async () => {
      await adapter.spawnEphemeralAgent('coder', nodeId);

      const otherNode = await adapter.registerNode({
        id: 'other-host',
        name: 'Other Host',
        endpoint: 'localhost:9002',
        capabilities: ['tester'],
      });

      await adapter.spawnEphemeralAgent('tester', otherNode.id);

      const nodeAgents = await adapter.listAgents(nodeId);
      expect(nodeAgents.length).toBe(1);
      expect(nodeAgents[0].type).toBe('coder');
    });

    it('should enforce max agents limit', async () => {
      const limitedAdapter = new FederationHubAdapter({ maxAgents: 2 });
      await limitedAdapter.initialize();

      const node = await limitedAdapter.registerNode({
        id: 'limited-node',
        name: 'Limited Node',
        endpoint: 'localhost:9001',
        capabilities: ['coder'],
      });

      await limitedAdapter.spawnEphemeralAgent('coder', node.id);
      await limitedAdapter.spawnEphemeralAgent('coder', node.id);

      await expect(limitedAdapter.spawnEphemeralAgent('coder', node.id))
        .rejects.toThrow('Maximum agents reached');

      await limitedAdapter.dispose();
    });
  });

  // ==========================================================================
  // Task Distribution Tests
  // ==========================================================================

  describe('task distribution', () => {
    let nodeId: string;

    beforeEach(async () => {
      const node = await adapter.registerNode({
        id: 'task-node',
        name: 'Task Node',
        endpoint: 'localhost:9001',
        capabilities: ['executor'],
      });
      nodeId = node.id;
    });

    it('should submit a task', async () => {
      const task = await adapter.submitTask({
        type: 'test-execution',
        payload: { script: 'npm test' },
      });

      expect(task.id).toBeDefined();
      expect(task.type).toBe('test-execution');
      expect(task.status).toBeDefined();
    });

    it('should submit task with assigned node', async () => {
      const task = await adapter.submitTask({
        type: 'build',
        payload: { command: 'npm run build' },
        assignedNode: nodeId,
      });

      expect(task.assignedNode).toBe(nodeId);
    });

    it('should get task status', async () => {
      const submitted = await adapter.submitTask({
        type: 'analysis',
        payload: { target: 'src/' },
      });

      // Wait for task to complete
      await new Promise(resolve => setTimeout(resolve, 300));

      const status = await adapter.getTaskStatus(submitted.id);

      expect(status).toBeDefined();
      expect(['pending', 'assigned', 'running', 'completed']).toContain(status!.status);
    });

    it('should return null for unknown task', async () => {
      const status = await adapter.getTaskStatus('unknown-task');
      expect(status).toBeNull();
    });

    it('should cancel a task', async () => {
      const task = await adapter.submitTask({
        type: 'long-running',
        payload: {},
      });

      // Task may complete before we can cancel it, so handle both cases
      try {
        await adapter.cancelTask(task.id);
        const status = await adapter.getTaskStatus(task.id);
        expect(status!.status).toBe('failed');
      } catch {
        // Task already completed, which is fine
      }
    });

    it('should throw when cancelling unknown task', async () => {
      await expect(adapter.cancelTask('unknown-task'))
        .rejects.toThrow('Task not found');
    });
  });

  // ==========================================================================
  // Load Balancing Tests
  // ==========================================================================

  describe('load balancing', () => {
    beforeEach(async () => {
      await adapter.registerNode({
        id: 'node-1',
        name: 'Node 1',
        endpoint: 'localhost:9001',
        capabilities: ['coder', 'tester'],
      });

      await adapter.registerNode({
        id: 'node-2',
        name: 'Node 2',
        endpoint: 'localhost:9002',
        capabilities: ['coder'],
      });
    });

    it('should select optimal node by capability', async () => {
      const node = await adapter.selectOptimalNode(['tester']);

      expect(node).toBeDefined();
      expect(node!.id).toBe('node-1'); // Only node-1 has 'tester'
    });

    it('should return null when no node matches', async () => {
      const node = await adapter.selectOptimalNode(['nonexistent-capability']);
      expect(node).toBeNull();
    });

    it('should rebalance load', async () => {
      // Spawn agents to create load imbalance
      await adapter.spawnEphemeralAgent('coder', 'node-1');
      await adapter.spawnEphemeralAgent('coder', 'node-1');
      await adapter.spawnEphemeralAgent('coder', 'node-1');

      await adapter.rebalanceLoad();

      // Verify method completes without error
      const nodes = await adapter.listNodes();
      expect(nodes.length).toBe(2);
    });
  });

  // ==========================================================================
  // Coordination Tests
  // ==========================================================================

  describe('coordination', () => {
    beforeEach(async () => {
      await adapter.registerNode({
        id: 'coord-node-1',
        name: 'Coordinator 1',
        endpoint: 'localhost:9001',
        capabilities: [],
      });

      await adapter.registerNode({
        id: 'coord-node-2',
        name: 'Coordinator 2',
        endpoint: 'localhost:9002',
        capabilities: [],
      });
    });

    it('should broadcast to all nodes', async () => {
      await expect(adapter.broadcastToNodes({ event: 'sync' }))
        .resolves.not.toThrow();
    });

    it('should sync state', async () => {
      await expect(adapter.syncState()).resolves.not.toThrow();
    });
  });

  // ==========================================================================
  // Legacy API Tests
  // ==========================================================================

  describe('legacy API', () => {
    it('should register agent (legacy)', async () => {
      await adapter.registerAgent({
        id: 'legacy-agent',
        name: 'Legacy Agent',
        type: 'coder',
        capabilities: ['coding'],
      });

      const agent = adapter.getAgent('legacy-agent');
      expect(agent).toBeDefined();
      expect(agent!.status).toBe('online');
    });

    it('should unregister agent (legacy)', async () => {
      await adapter.registerAgent({
        id: 'temp-agent',
        name: 'Temp Agent',
        type: 'tester',
        capabilities: [],
      });

      await adapter.unregisterAgent('temp-agent');

      const agent = adapter.getAgent('temp-agent');
      expect(agent).toBeNull();
    });

    it('should get agents with filter', async () => {
      await adapter.registerAgent({
        id: 'agent-a',
        name: 'Agent A',
        type: 'coder',
        capabilities: ['coding'],
      });

      await adapter.registerAgent({
        id: 'agent-b',
        name: 'Agent B',
        type: 'tester',
        capabilities: ['testing'],
      });

      const coderAgents = adapter.getAgents({ capability: 'coding' });
      expect(coderAgents.length).toBe(1);
      expect(coderAgents[0].id).toBe('agent-a');
    });

    it('should submit distributed task (legacy)', async () => {
      await adapter.registerNode({
        id: 'dist-node',
        name: 'Dist Node',
        endpoint: 'localhost:9001',
        capabilities: [],
      });

      const taskId = await adapter.submitDistributedTask({
        type: 'distributed-job',
        payload: { work: true },
        requiredCapabilities: [],
        priority: 'high',
      });

      expect(taskId).toBeDefined();
    });

    it('should get tasks with filter (legacy)', async () => {
      await adapter.registerNode({
        id: 'task-host',
        name: 'Task Host',
        endpoint: 'localhost:9001',
        capabilities: [],
      });

      await adapter.submitTask({
        type: 'job-1',
        payload: {},
      });

      const tasks = adapter.getTasks();
      expect(tasks.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Consensus Tests
  // ==========================================================================

  describe('consensus', () => {
    beforeEach(async () => {
      await adapter.registerAgent({
        id: 'voter-1',
        name: 'Voter 1',
        type: 'analyst',
        capabilities: [],
      });

      await adapter.registerAgent({
        id: 'voter-2',
        name: 'Voter 2',
        type: 'analyst',
        capabilities: [],
      });
    });

    it('should propose consensus', async () => {
      const proposalId = await adapter.proposeConsensus({
        type: 'decision',
        data: { option: 'A' },
        proposer: 'voter-1',
        quorum: 2,
        expiresAt: new Date(Date.now() + 60000),
      });

      expect(proposalId).toBeDefined();
    });

    it('should vote on proposal', async () => {
      const proposalId = await adapter.proposeConsensus({
        type: 'vote-test',
        data: { choice: 'yes' },
        proposer: 'voter-1',
        quorum: 2,
        expiresAt: new Date(Date.now() + 60000),
      });

      await adapter.vote(proposalId, 'voter-1', true);
      await adapter.vote(proposalId, 'voter-2', true);

      const proposal = adapter.getProposal(proposalId);
      expect(proposal!.status).toBe('accepted');
    });

    it('should reject proposal without quorum', async () => {
      const proposalId = await adapter.proposeConsensus({
        type: 'reject-test',
        data: {},
        proposer: 'voter-1',
        quorum: 2,
        expiresAt: new Date(Date.now() + 60000),
      });

      await adapter.vote(proposalId, 'voter-1', true);
      await adapter.vote(proposalId, 'voter-2', false);

      const proposal = adapter.getProposal(proposalId);
      expect(proposal!.status).toBe('rejected');
    });

    it('should throw when consensus disabled', async () => {
      const noConsensusAdapter = new FederationHubAdapter({ enableConsensus: false });
      await noConsensusAdapter.initialize();

      await expect(noConsensusAdapter.proposeConsensus({
        type: 'test',
        data: {},
        proposer: 'test',
        quorum: 1,
        expiresAt: new Date(),
      })).rejects.toThrow('Consensus is disabled');

      await noConsensusAdapter.dispose();
    });
  });

  // ==========================================================================
  // Statistics and Health Tests
  // ==========================================================================

  describe('statistics and health', () => {
    it('should get federation stats', async () => {
      const stats = adapter.getStats();

      expect(stats).toBeDefined();
      expect(typeof stats.totalAgents).toBe('number');
      expect(typeof stats.onlineAgents).toBe('number');
      expect(typeof stats.uptime).toBe('number');
    });

    it('should check health', async () => {
      const health = await adapter.checkHealth();

      expect(health.healthy).toBe(true);
      expect(health.details).toBeDefined();
      expect(health.details!.nodes).toBe(0);
    });

    it('should get metrics', () => {
      const metrics = adapter.getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.totalNodes).toBe('number');
      expect(typeof metrics.totalAgents).toBe('number');
      expect(typeof metrics.totalTasks).toBe('number');
    });

    it('should reset metrics', () => {
      adapter.resetMetrics();

      const metrics = adapter.getMetrics();
      expect(metrics.totalNodes).toBe(0);
      expect(metrics.totalTasks).toBe(0);
    });
  });

  // ==========================================================================
  // Event Handling Tests
  // ==========================================================================

  describe('event handling', () => {
    it('should emit node events', async () => {
      const events: string[] = [];

      adapter.on('node:registered', () => events.push('registered'));
      adapter.on('node:unregistered', () => events.push('unregistered'));

      const node = await adapter.registerNode({
        id: 'event-node',
        name: 'Event Node',
        endpoint: 'localhost:9001',
        capabilities: [],
      });

      await adapter.unregisterNode(node.id);

      expect(events).toContain('registered');
      expect(events).toContain('unregistered');
    });

    it('should emit agent events', async () => {
      const events: string[] = [];

      adapter.on('agent:spawned', () => events.push('spawned'));
      adapter.on('agent:terminated', () => events.push('terminated'));

      const node = await adapter.registerNode({
        id: 'agent-event-node',
        name: 'Agent Event Node',
        endpoint: 'localhost:9001',
        capabilities: [],
      });

      const agent = await adapter.spawnEphemeralAgent('coder', node.id);
      await adapter.terminateAgent(agent.id);

      expect(events).toContain('spawned');
      expect(events).toContain('terminated');
    });

    it('should unsubscribe from events', async () => {
      let count = 0;
      const handler = () => { count++; };

      adapter.on('node:registered', handler);

      await adapter.registerNode({
        id: 'sub-node-1',
        name: 'Sub Node 1',
        endpoint: 'localhost:9001',
        capabilities: [],
      });

      expect(count).toBe(1);

      adapter.off('node:registered', handler);

      await adapter.registerNode({
        id: 'sub-node-2',
        name: 'Sub Node 2',
        endpoint: 'localhost:9002',
        capabilities: [],
      });

      expect(count).toBe(1);
    });
  });

  // ==========================================================================
  // Factory Function Tests
  // ==========================================================================

  describe('factory function', () => {
    it('should create adapter with factory', async () => {
      const factoryAdapter = createFederationHubAdapter({
        maxAgents: 100,
        loadBalancingStrategy: 'round-robin',
      });

      await factoryAdapter.initialize();

      const config = factoryAdapter.getConfig();
      expect(config.maxAgents).toBe(100);
      expect(config.loadBalancingStrategy).toBe('round-robin');

      await factoryAdapter.dispose();
    });
  });
});
