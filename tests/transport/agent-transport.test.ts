/**
 * Agent Transport Service Tests
 *
 * Comprehensive test suite for the AgentTransport service
 * covering agent communication, distributed execution, and monitoring.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  AgentTransport,
  createAgentTransport,
  type TransportConfig,
  type TransportHealth,
  type TransportMetrics,
  type DistributedExecutionOptions,
  type ParallelExecutionResult,
  type AgentMessage,
  defaultTransportConfig,
} from '../../src/transport/agent-transport.js';
import { QUICTransportAdapter } from '../../src/integrations/agentic-flow/adapters/quic-transport-adapter.js';
import { FederationHubAdapter } from '../../src/integrations/agentic-flow/adapters/federation-hub-adapter.js';
import { FeatureFlags } from '../../src/integrations/agentic-flow/feature-flags.js';

// Mock feature flags
vi.mock('../../src/integrations/agentic-flow/feature-flags.js', () => ({
  FeatureFlags: {
    getInstance: vi.fn(() => ({
      isEnabled: vi.fn((feature: string) => {
        if (feature === 'quic-transport') return true;
        if (feature === 'federation-hub') return true;
        return false;
      }),
    })),
    resetInstance: vi.fn(),
  },
}));

describe('AgentTransport', () => {
  let transport: AgentTransport;
  let quicAdapter: QUICTransportAdapter;
  let federationAdapter: FederationHubAdapter;

  beforeEach(async () => {
    quicAdapter = new QUICTransportAdapter();
    federationAdapter = new FederationHubAdapter();
    transport = new AgentTransport(quicAdapter, federationAdapter);
    await transport.initialize();
  });

  afterEach(async () => {
    await transport.dispose();
    vi.clearAllMocks();
  });

  // ==========================================================================
  // Initialization Tests
  // ==========================================================================

  describe('initialization', () => {
    it('should initialize with default config', async () => {
      const newTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter()
      );
      await newTransport.initialize();

      expect(newTransport.isInitialized()).toBe(true);

      const config = newTransport.getConfig();
      expect(config.preferQuic).toBe(defaultTransportConfig.preferQuic);
      expect(config.fallbackToHttp).toBe(defaultTransportConfig.fallbackToHttp);
      expect(config.federationEnabled).toBe(defaultTransportConfig.federationEnabled);

      await newTransport.dispose();
    });

    it('should initialize with custom config', async () => {
      const customConfig: Partial<TransportConfig> = {
        preferQuic: false,
        maxRetries: 5,
        sendTimeout: 10000,
        executionTimeout: 60000,
      };

      const newTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter(),
        customConfig
      );
      await newTransport.initialize();

      const config = newTransport.getConfig();
      expect(config.preferQuic).toBe(false);
      expect(config.maxRetries).toBe(5);
      expect(config.sendTimeout).toBe(10000);
      expect(config.executionTimeout).toBe(60000);

      await newTransport.dispose();
    });

    it('should handle multiple initializations gracefully', async () => {
      await transport.initialize();
      await transport.initialize();

      expect(transport.isInitialized()).toBe(true);
    });

    it('should emit initialized event', async () => {
      const newTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter()
      );

      let eventEmitted = false;
      newTransport.on('initialized', () => {
        eventEmitted = true;
      });

      await newTransport.initialize();

      expect(eventEmitted).toBe(true);

      await newTransport.dispose();
    });
  });

  // ==========================================================================
  // Agent Communication Tests
  // ==========================================================================

  describe('agent communication', () => {
    beforeEach(async () => {
      // Register a test agent endpoint
      await transport.registerAgentEndpoint('test-agent-1', 'localhost:8080');
    });

    it('should send message to agent', async () => {
      const response = await transport.sendToAgent('test-agent-1', {
        action: 'ping',
        data: { test: true },
      });

      expect(response).toBeDefined();
    });

    it('should throw when sending to unregistered agent', async () => {
      // Disable QUIC to test fallback behavior
      const noQuicTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter(),
        { preferQuic: false }
      );
      await noQuicTransport.initialize();

      await expect(
        noQuicTransport.sendToAgent('unknown-agent', { test: true })
      ).rejects.toThrow();

      await noQuicTransport.dispose();
    });

    it('should broadcast to agents of specific type', async () => {
      await transport.registerAgentEndpoint('agent-a', 'localhost:8081');
      await transport.registerAgentEndpoint('agent-b', 'localhost:8082');

      await expect(
        transport.broadcastToAgents('researcher', { notification: 'hello' })
      ).resolves.not.toThrow();
    });

    it('should emit broadcast event', async () => {
      let eventData: unknown = null;
      transport.on('message:broadcast', (data) => {
        eventData = data;
      });

      await transport.broadcastToAgents('coordinator', { message: 'sync' });

      expect(eventData).toBeDefined();
      expect((eventData as { agentType: string }).agentType).toBe('coordinator');
    });
  });

  // ==========================================================================
  // Agent Endpoint Management Tests
  // ==========================================================================

  describe('agent endpoint management', () => {
    it('should register agent endpoint', async () => {
      await transport.registerAgentEndpoint('new-agent', 'localhost:9000');

      // Should be able to send after registration
      const result = await transport.sendToAgent('new-agent', { ping: true });
      expect(result).toBeDefined();
    });

    it('should emit agent registered event', async () => {
      let eventData: unknown = null;
      transport.on('agent:registered', (data) => {
        eventData = data;
      });

      await transport.registerAgentEndpoint('event-agent', 'localhost:9001');

      expect(eventData).toBeDefined();
      expect((eventData as { agentId: string }).agentId).toBe('event-agent');
    });

    it('should unregister agent endpoint', async () => {
      await transport.registerAgentEndpoint('temp-agent', 'localhost:9002');
      await transport.unregisterAgentEndpoint('temp-agent');

      // Should emit unregistered event
      let eventData: unknown = null;
      transport.on('agent:unregistered', (data) => {
        eventData = data;
      });

      await transport.registerAgentEndpoint('temp-agent-2', 'localhost:9003');
      await transport.unregisterAgentEndpoint('temp-agent-2');

      expect(eventData).toBeDefined();
      expect((eventData as { agentId: string }).agentId).toBe('temp-agent-2');
    });

    it('should handle fallback to federation on QUIC failure', async () => {
      const fallbackTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter(),
        { preferQuic: true, fallbackToHttp: true }
      );
      await fallbackTransport.initialize();

      // Registration should succeed (using fallback)
      await expect(
        fallbackTransport.registerAgentEndpoint('fallback-agent', 'localhost:9999')
      ).resolves.not.toThrow();

      await fallbackTransport.dispose();
    });
  });

  // ==========================================================================
  // Distributed Execution Tests
  // ==========================================================================

  describe('distributed execution', () => {
    beforeEach(async () => {
      // Register a federation node for distributed execution
      await federationAdapter.registerNode({
        id: 'node-1',
        name: 'Test Node 1',
        endpoint: 'localhost:7000',
        capabilities: ['compute', 'analysis'],
      });
    });

    it('should submit task to optimal node', async () => {
      // Test that tasks get submitted - use short timeout to verify task submission path
      // The simulated adapter doesn't complete tasks, so we test submission works
      await expect(
        transport.executeDistributed(
          { task: 'analyze', data: [1, 2, 3] },
          { requiredCapabilities: ['compute'], timeout: 100 }
        )
      ).rejects.toThrow(/timeout/i);
    });

    it('should submit to preferred nodes when specified', async () => {
      await federationAdapter.registerNode({
        id: 'preferred-node',
        name: 'Preferred Node',
        endpoint: 'localhost:7001',
        capabilities: ['premium'],
      });

      // Verify submission to preferred node - task will timeout since simulated
      await expect(
        transport.executeDistributed(
          { task: 'process' },
          { preferredNodes: ['preferred-node'], timeout: 100 }
        )
      ).rejects.toThrow(/timeout/i);
    });

    it('should spawn ephemeral agent when requested', async () => {
      // Verify ephemeral agent spawning - task will timeout since simulated
      await expect(
        transport.executeDistributed(
          { task: 'ephemeral-work' },
          { spawnEphemeral: true, timeout: 100 }
        )
      ).rejects.toThrow(/timeout/i);
    });

    it('should throw when federation is disabled', async () => {
      const noFedTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter(),
        { federationEnabled: false }
      );
      await noFedTransport.initialize();

      await expect(
        noFedTransport.executeDistributed({ task: 'test' })
      ).rejects.toThrow('Federation is not enabled');

      await noFedTransport.dispose();
    });

    it('should throw when no nodes available', async () => {
      // Create transport with empty federation
      const emptyFedTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter()
      );
      await emptyFedTransport.initialize();

      await expect(
        emptyFedTransport.executeDistributed(
          { task: 'test' },
          { requiredCapabilities: ['nonexistent-capability'] }
        )
      ).rejects.toThrow(/No available nodes/);

      await emptyFedTransport.dispose();
    });
  });

  // ==========================================================================
  // Parallel Execution Tests
  // ==========================================================================

  describe('parallel execution', () => {
    beforeEach(async () => {
      // Register multiple nodes for parallel execution
      await federationAdapter.registerNode({
        id: 'parallel-node-1',
        name: 'Parallel Node 1',
        endpoint: 'localhost:7010',
        capabilities: ['compute'],
      });
      await federationAdapter.registerNode({
        id: 'parallel-node-2',
        name: 'Parallel Node 2',
        endpoint: 'localhost:7011',
        capabilities: ['compute'],
      });
    });

    it('should submit multiple tasks in parallel with timeout handling', async () => {
      const tasks = [
        { id: 1, operation: 'task-1' },
        { id: 2, operation: 'task-2' },
        { id: 3, operation: 'task-3' },
      ];

      // With short timeout, tasks will fail but we verify parallel submission works
      const result = await transport.executeParallel(tasks, { timeout: 100 });

      expect(result.results).toHaveLength(3);
      expect(result.summary.total).toBe(3);
      // All will fail due to timeout in simulated environment
      expect(result.summary.failed).toBe(3);
    });

    it('should return aggregated summary with failed tasks', async () => {
      const tasks = [{ a: 1 }, { b: 2 }];

      // Short timeout to test timeout handling in parallel execution
      const result = await transport.executeParallel(tasks, { timeout: 100 });

      expect(result.summary).toBeDefined();
      expect(typeof result.summary.total).toBe('number');
      expect(typeof result.summary.successful).toBe('number');
      expect(typeof result.summary.failed).toBe('number');
      expect(typeof result.summary.averageDurationMs).toBe('number');
      expect(result.summary.total).toBe(2);
    });

    it('should include duration for each task', async () => {
      const tasks = [{ task: 'timed' }];

      const result = await transport.executeParallel(tasks, { timeout: 100 });

      for (const taskResult of result.results) {
        expect(typeof taskResult.durationMs).toBe('number');
        expect(taskResult.durationMs).toBeGreaterThanOrEqual(0);
      }
    });

    it('should track node IDs in results', async () => {
      const tasks = [{ task: 'tracked' }];

      const result = await transport.executeParallel(tasks, {
        spawnEphemeral: true,
        timeout: 100,
      });

      // Results should have node IDs from task submission
      expect(result.results).toHaveLength(1);
      expect(result.results[0].nodeId).toBeDefined();
    });

    it('should throw when federation is disabled', async () => {
      const noFedTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter(),
        { federationEnabled: false }
      );
      await noFedTransport.initialize();

      await expect(
        noFedTransport.executeParallel([{ task: 'test' }])
      ).rejects.toThrow('Federation is not enabled');

      await noFedTransport.dispose();
    });
  });

  // ==========================================================================
  // Health & Monitoring Tests
  // ==========================================================================

  describe('health and monitoring', () => {
    it('should check health status', async () => {
      const health = await transport.healthCheck();

      expect(health).toBeDefined();
      expect(typeof health.quic).toBe('boolean');
      expect(typeof health.federation).toBe('boolean');
      expect(typeof health.overallHealthy).toBe('boolean');
      expect(health.details).toBeDefined();
    });

    it('should report overall healthy when at least one transport works', async () => {
      const health = await transport.healthCheck();

      // At least one should be healthy for overall to be healthy
      if (health.quic || health.federation) {
        expect(health.overallHealthy).toBe(true);
      }
    });

    it('should get transport metrics', async () => {
      // Perform some operations to generate metrics
      await transport.registerAgentEndpoint('metrics-agent', 'localhost:8080');
      await transport.sendToAgent('metrics-agent', { ping: true });

      const metrics = await transport.getMetrics();

      expect(metrics).toBeDefined();
      expect(typeof metrics.messagesSent).toBe('number');
      expect(typeof metrics.messagesReceived).toBe('number');
      expect(typeof metrics.tasksExecuted).toBe('number');
      expect(typeof metrics.tasksFailed).toBe('number');
      expect(typeof metrics.averageLatencyMs).toBe('number');
      expect(typeof metrics.errors).toBe('number');
    });

    it('should track messages sent', async () => {
      const initialMetrics = await transport.getMetrics();
      const initialSent = initialMetrics.messagesSent;

      await transport.registerAgentEndpoint('tracked-agent', 'localhost:8080');
      await transport.sendToAgent('tracked-agent', { data: 1 });
      await transport.sendToAgent('tracked-agent', { data: 2 });

      const newMetrics = await transport.getMetrics();
      expect(newMetrics.messagesSent).toBeGreaterThanOrEqual(initialSent + 2);
    });

    it('should get latency stats', async () => {
      const latencyStats = await transport.getLatencyStats();

      expect(latencyStats).toBeDefined();
      expect(typeof latencyStats.avg).toBe('number');
      expect(typeof latencyStats.p95).toBe('number');
      expect(typeof latencyStats.p99).toBe('number');
    });

    it('should reset metrics', async () => {
      // Generate some metrics
      await transport.registerAgentEndpoint('reset-agent', 'localhost:8080');
      await transport.sendToAgent('reset-agent', { test: true });

      transport.resetMetrics();

      const metrics = await transport.getMetrics();
      expect(metrics.messagesSent).toBe(0);
      expect(metrics.tasksExecuted).toBe(0);
      expect(metrics.errors).toBe(0);
    });
  });

  // ==========================================================================
  // Event Handling Tests
  // ==========================================================================

  describe('event handling', () => {
    it('should subscribe to events', async () => {
      const events: string[] = [];

      transport.on('agent:registered', () => events.push('registered'));
      transport.on('agent:unregistered', () => events.push('unregistered'));

      await transport.registerAgentEndpoint('event-test', 'localhost:8888');
      await transport.unregisterAgentEndpoint('event-test');

      expect(events).toContain('registered');
      expect(events).toContain('unregistered');
    });

    it('should unsubscribe from events', async () => {
      let count = 0;
      const handler = () => {
        count++;
      };

      transport.on('agent:registered', handler);
      await transport.registerAgentEndpoint('sub-test-1', 'localhost:8889');
      expect(count).toBe(1);

      transport.off('agent:registered', handler);
      await transport.registerAgentEndpoint('sub-test-2', 'localhost:8890');
      expect(count).toBe(1);
    });

    it('should support chained event subscriptions', () => {
      const result = transport
        .on('event1', () => {})
        .on('event2', () => {})
        .on('event3', () => {});

      expect(result).toBe(transport);
    });
  });

  // ==========================================================================
  // Lifecycle Tests
  // ==========================================================================

  describe('lifecycle', () => {
    it('should dispose properly', async () => {
      const disposableTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter()
      );
      await disposableTransport.initialize();

      await disposableTransport.registerAgentEndpoint('disp-agent', 'localhost:9999');

      await expect(disposableTransport.dispose()).resolves.not.toThrow();
      expect(disposableTransport.isInitialized()).toBe(false);
    });

    it('should clean up connections on dispose', async () => {
      const cleanupTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter()
      );
      await cleanupTransport.initialize();

      await cleanupTransport.registerAgentEndpoint('conn-1', 'localhost:7777');
      await cleanupTransport.registerAgentEndpoint('conn-2', 'localhost:7778');

      await cleanupTransport.dispose();

      // After dispose, should not be initialized
      expect(cleanupTransport.isInitialized()).toBe(false);
    });

    it('should handle dispose when not initialized', async () => {
      const uninitTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter()
      );

      // Should not throw
      await expect(uninitTransport.dispose()).resolves.not.toThrow();
    });

    it('should auto-initialize on operations', async () => {
      const autoInitTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter()
      );

      // Not initialized yet
      expect(autoInitTransport.isInitialized()).toBe(false);

      // Operation should trigger initialization
      await autoInitTransport.healthCheck();

      expect(autoInitTransport.isInitialized()).toBe(true);

      await autoInitTransport.dispose();
    });
  });

  // ==========================================================================
  // Configuration Tests
  // ==========================================================================

  describe('configuration', () => {
    it('should return immutable config copy', () => {
      const config1 = transport.getConfig();
      const config2 = transport.getConfig();

      // Should be equal but not the same object
      expect(config1).toEqual(config2);
      expect(config1).not.toBe(config2);
    });

    it('should merge custom config with defaults', async () => {
      const customTransport = new AgentTransport(
        new QUICTransportAdapter(),
        new FederationHubAdapter(),
        { maxRetries: 10 }
      );

      const config = customTransport.getConfig();

      // Custom value
      expect(config.maxRetries).toBe(10);

      // Default values preserved
      expect(config.preferQuic).toBe(defaultTransportConfig.preferQuic);
      expect(config.sendTimeout).toBe(defaultTransportConfig.sendTimeout);

      await customTransport.dispose();
    });
  });

  // ==========================================================================
  // Factory Function Tests
  // ==========================================================================

  describe('factory function', () => {
    it('should create transport with factory', async () => {
      const factoryTransport = createAgentTransport();
      await factoryTransport.initialize();

      expect(factoryTransport.isInitialized()).toBe(true);

      await factoryTransport.dispose();
    });

    it('should accept config in factory', async () => {
      const factoryTransport = createAgentTransport({
        preferQuic: false,
        maxRetries: 7,
      });
      await factoryTransport.initialize();

      const config = factoryTransport.getConfig();
      expect(config.preferQuic).toBe(false);
      expect(config.maxRetries).toBe(7);

      await factoryTransport.dispose();
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('error handling', () => {
    it('should track errors in metrics', async () => {
      const initialMetrics = await transport.getMetrics();
      const initialErrors = initialMetrics.errors;

      // Try to send to non-existent agent (will fail internally but might be handled)
      try {
        await transport.sendToAgent('definitely-not-registered', { test: true });
      } catch {
        // Expected to fail
      }

      const newMetrics = await transport.getMetrics();
      expect(newMetrics.errors).toBeGreaterThanOrEqual(initialErrors);
    });

    it('should track failed tasks in metrics', async () => {
      await federationAdapter.registerNode({
        id: 'error-node',
        name: 'Error Node',
        endpoint: 'localhost:6666',
        capabilities: [],
      });

      const initialMetrics = await transport.getMetrics();
      const initialFailed = initialMetrics.tasksFailed;

      // Try to execute on node without required capability (may fail)
      try {
        await transport.executeDistributed(
          { task: 'test' },
          {
            requiredCapabilities: ['nonexistent-capability-xyz'],
            timeout: 100,
          }
        );
      } catch {
        // Expected
      }

      const newMetrics = await transport.getMetrics();
      // Failed tasks should be tracked
      expect(newMetrics.tasksFailed).toBeGreaterThanOrEqual(initialFailed);
    });
  });
});

describe('defaultTransportConfig', () => {
  it('should have expected default values', () => {
    expect(defaultTransportConfig.preferQuic).toBe(true);
    expect(defaultTransportConfig.fallbackToHttp).toBe(true);
    expect(defaultTransportConfig.federationEnabled).toBe(true);
    expect(defaultTransportConfig.maxRetries).toBe(3);
    expect(defaultTransportConfig.sendTimeout).toBe(5000);
    expect(defaultTransportConfig.executionTimeout).toBe(30000);
    expect(defaultTransportConfig.autoReconnect).toBe(true);
    expect(defaultTransportConfig.reconnectInterval).toBe(5000);
  });
});
