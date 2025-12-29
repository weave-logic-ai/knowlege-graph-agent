/**
 * Agent Transport Service
 *
 * High-level API combining QUIC Transport and Federation Hub for
 * seamless agent communication and distributed execution.
 *
 * Provides:
 * - Agent-to-agent messaging with automatic protocol selection
 * - Distributed task execution across federation nodes
 * - Parallel task execution with aggregation
 * - Health monitoring and metrics
 *
 * @module transport/agent-transport
 */

import { EventEmitter } from 'events';
import {
  QUICTransportAdapter,
  type QUICMessage,
  type QUICConnection,
  type LatencyStats,
} from '../integrations/agentic-flow/adapters/quic-transport-adapter.js';
import {
  FederationHubAdapter,
  type FederationNode,
  type EphemeralAgent,
  type FederatedTask,
} from '../integrations/agentic-flow/adapters/federation-hub-adapter.js';
import { FeatureFlags } from '../integrations/agentic-flow/feature-flags.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Transport configuration
 */
export interface TransportConfig {
  /**
   * Prefer QUIC protocol over HTTP when available
   */
  preferQuic: boolean;

  /**
   * Fall back to HTTP if QUIC is unavailable
   */
  fallbackToHttp: boolean;

  /**
   * Enable federation for distributed execution
   */
  federationEnabled: boolean;

  /**
   * Maximum retry attempts for failed operations
   */
  maxRetries: number;

  /**
   * Timeout for send operations in milliseconds
   */
  sendTimeout: number;

  /**
   * Timeout for distributed execution in milliseconds
   */
  executionTimeout: number;

  /**
   * Enable automatic reconnection
   */
  autoReconnect: boolean;

  /**
   * Interval between reconnection attempts in milliseconds
   */
  reconnectInterval: number;
}

/**
 * Default transport configuration
 */
export const defaultTransportConfig: TransportConfig = {
  preferQuic: true,
  fallbackToHttp: true,
  federationEnabled: true,
  maxRetries: 3,
  sendTimeout: 5000,
  executionTimeout: 30000,
  autoReconnect: true,
  reconnectInterval: 5000,
};

/**
 * Transport health status
 */
export interface TransportHealth {
  quic: boolean;
  federation: boolean;
  overallHealthy: boolean;
  details: {
    quicConnections?: number;
    quicLatency?: number;
    federationNodes?: number;
    federationAgents?: number;
  };
}

/**
 * Transport metrics
 */
export interface TransportMetrics {
  messagesSent: number;
  messagesReceived: number;
  bytesSent: number;
  bytesReceived: number;
  tasksExecuted: number;
  tasksFailed: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  errors: number;
  reconnections: number;
}

/**
 * Distributed execution options
 */
export interface DistributedExecutionOptions {
  /**
   * Preferred nodes for execution
   */
  preferredNodes?: string[];

  /**
   * Required capabilities for the task
   */
  requiredCapabilities?: string[];

  /**
   * Task priority
   */
  priority?: 'low' | 'normal' | 'high' | 'critical';

  /**
   * Timeout override in milliseconds
   */
  timeout?: number;

  /**
   * Whether to spawn ephemeral agents
   */
  spawnEphemeral?: boolean;
}

/**
 * Parallel execution result
 */
export interface ParallelExecutionResult<T = unknown> {
  results: Array<{
    taskId: string;
    success: boolean;
    result?: T;
    error?: string;
    nodeId?: string;
    agentId?: string;
    durationMs: number;
  }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
    averageDurationMs: number;
  };
}

/**
 * Agent message for transport
 */
export interface AgentMessage {
  id: string;
  fromAgent: string;
  toAgent?: string;
  agentType?: string;
  payload: unknown;
  timestamp: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  requiresResponse?: boolean;
}

// ============================================================================
// Agent Transport Service
// ============================================================================

/**
 * Agent Transport Service
 *
 * Unified transport layer for agent communication combining QUIC
 * for low-latency messaging and Federation Hub for distributed
 * task execution.
 */
export class AgentTransport {
  private config: TransportConfig;
  private quic: QUICTransportAdapter;
  private federation: FederationHubAdapter;
  private emitter: EventEmitter = new EventEmitter();
  private metrics: TransportMetrics;
  private initialized: boolean = false;
  private connections: Map<string, QUICConnection> = new Map();
  private agentEndpoints: Map<string, string> = new Map();
  private latencies: number[] = [];

  constructor(
    quic: QUICTransportAdapter,
    federation: FederationHubAdapter,
    config: Partial<TransportConfig> = {}
  ) {
    this.quic = quic;
    this.federation = federation;
    this.config = { ...defaultTransportConfig, ...config };
    this.metrics = this.createInitialMetrics();
  }

  /**
   * Initialize the transport service
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize underlying adapters
    await Promise.all([
      this.quic.initialize(),
      this.federation.initialize(),
    ]);

    this.initialized = true;
    this.emitter.emit('initialized');
  }

  // ============================================================================
  // Agent Communication
  // ============================================================================

  /**
   * Send a message to a specific agent
   *
   * @param agentId - Target agent ID
   * @param message - Message to send
   * @returns Response if requiresResponse is true
   */
  async sendToAgent(agentId: string, message: unknown): Promise<unknown> {
    await this.ensureInitialized();

    const startTime = Date.now();
    let result: unknown;

    try {
      // Create agent message
      const agentMessage: AgentMessage = {
        id: this.createId('msg'),
        fromAgent: 'transport',
        toAgent: agentId,
        payload: message,
        timestamp: Date.now(),
        priority: 'normal',
        requiresResponse: true,
      };

      // Determine transport method
      if (this.shouldUseQuic()) {
        result = await this.sendViaQuic(agentId, agentMessage);
      } else {
        result = await this.sendViaFederation(agentId, agentMessage);
      }

      const latency = Date.now() - startTime;
      this.recordLatency(latency);
      this.metrics.messagesSent++;

      return result;
    } catch (error) {
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Broadcast a message to all agents of a specific type
   *
   * @param agentType - Type of agents to broadcast to
   * @param message - Message to broadcast
   */
  async broadcastToAgents(agentType: string, message: unknown): Promise<void> {
    await this.ensureInitialized();

    const agentMessage: AgentMessage = {
      id: this.createId('broadcast'),
      fromAgent: 'transport',
      agentType,
      payload: message,
      timestamp: Date.now(),
      priority: 'normal',
    };

    // Broadcast via both channels if available
    const promises: Promise<void>[] = [];

    if (this.shouldUseQuic()) {
      const quicMessage: QUICMessage = {
        id: agentMessage.id,
        type: 'broadcast',
        payload: agentMessage,
        timestamp: agentMessage.timestamp,
        priority: 'normal',
      };
      promises.push(this.quic.broadcast(quicMessage));
    }

    if (this.config.federationEnabled && FeatureFlags.getInstance().isEnabled('federation-hub')) {
      promises.push(this.federation.broadcastToNodes(agentMessage));
    }

    await Promise.all(promises);
    this.metrics.messagesSent++;
    this.emitter.emit('message:broadcast', { agentType, message });
  }

  /**
   * Register an agent endpoint for direct messaging
   *
   * @param agentId - Agent ID
   * @param endpoint - Agent endpoint address
   */
  async registerAgentEndpoint(agentId: string, endpoint: string): Promise<void> {
    await this.ensureInitialized();

    this.agentEndpoints.set(agentId, endpoint);

    // Establish QUIC connection if preferred
    if (this.shouldUseQuic()) {
      try {
        const connection = await this.quic.connect(endpoint);
        this.connections.set(agentId, connection);
      } catch (error) {
        // Fall back to federation registration
        if (this.config.fallbackToHttp) {
          await this.federation.registerNode({
            id: agentId,
            name: agentId,
            endpoint,
            capabilities: [],
          });
        } else {
          throw error;
        }
      }
    }

    this.emitter.emit('agent:registered', { agentId, endpoint });
  }

  /**
   * Unregister an agent endpoint
   *
   * @param agentId - Agent ID to unregister
   */
  async unregisterAgentEndpoint(agentId: string): Promise<void> {
    await this.ensureInitialized();

    // Disconnect QUIC if connected
    const connection = this.connections.get(agentId);
    if (connection) {
      await this.quic.disconnect(connection.id);
      this.connections.delete(agentId);
    }

    this.agentEndpoints.delete(agentId);
    this.emitter.emit('agent:unregistered', { agentId });
  }

  // ============================================================================
  // Distributed Execution
  // ============================================================================

  /**
   * Execute a task on the optimal node in the federation
   *
   * @param task - Task payload to execute
   * @param options - Execution options
   * @returns Execution result
   */
  async executeDistributed(
    task: unknown,
    options: DistributedExecutionOptions = {}
  ): Promise<unknown> {
    await this.ensureInitialized();

    if (!this.config.federationEnabled || !FeatureFlags.getInstance().isEnabled('federation-hub')) {
      throw new Error('Federation is not enabled');
    }

    const startTime = Date.now();

    try {
      // Select optimal node
      let targetNode: FederationNode | null = null;

      if (options.preferredNodes && options.preferredNodes.length > 0) {
        // Try preferred nodes first
        for (const nodeId of options.preferredNodes) {
          targetNode = await this.federation.getNode(nodeId);
          if (targetNode && targetNode.status === 'online') {
            break;
          }
        }
      }

      // Fall back to automatic selection
      if (!targetNode) {
        targetNode = await this.federation.selectOptimalNode(
          options.requiredCapabilities || []
        );
      }

      if (!targetNode) {
        throw new Error('No available nodes for task execution');
      }

      // Spawn ephemeral agent if requested
      let agent: EphemeralAgent | undefined;
      if (options.spawnEphemeral) {
        agent = await this.federation.spawnEphemeralAgent(
          'executor',
          targetNode.id
        );
      }

      // Submit task
      const federatedTask = await this.federation.submitTask({
        type: 'distributed-execution',
        payload: task,
        assignedNode: targetNode.id,
        assignedAgent: agent?.id,
      });

      // Wait for completion with timeout
      const timeout = options.timeout || this.config.executionTimeout;
      const result = await this.waitForTaskCompletion(federatedTask.id, timeout);

      const duration = Date.now() - startTime;
      this.recordLatency(duration);
      this.metrics.tasksExecuted++;

      return result;
    } catch (error) {
      this.metrics.tasksFailed++;
      this.metrics.errors++;
      throw error;
    }
  }

  /**
   * Execute multiple tasks in parallel across the federation
   *
   * @param tasks - Array of task payloads
   * @param options - Execution options applied to all tasks
   * @returns Aggregated results
   */
  async executeParallel<T = unknown>(
    tasks: unknown[],
    options: DistributedExecutionOptions = {}
  ): Promise<ParallelExecutionResult<T>> {
    await this.ensureInitialized();

    if (!this.config.federationEnabled || !FeatureFlags.getInstance().isEnabled('federation-hub')) {
      throw new Error('Federation is not enabled');
    }

    const startTime = Date.now();
    const results: ParallelExecutionResult<T>['results'] = [];

    // Submit all tasks
    const submittedTasks: Array<{
      task: FederatedTask;
      payload: unknown;
      startTime: number;
    }> = [];

    for (const taskPayload of tasks) {
      const taskStartTime = Date.now();

      try {
        // Select node for this task
        const node = await this.federation.selectOptimalNode(
          options.requiredCapabilities || []
        );

        let agent: EphemeralAgent | undefined;
        if (options.spawnEphemeral && node) {
          agent = await this.federation.spawnEphemeralAgent('executor', node.id);
        }

        const federatedTask = await this.federation.submitTask({
          type: 'parallel-execution',
          payload: taskPayload,
          assignedNode: node?.id,
          assignedAgent: agent?.id,
        });

        submittedTasks.push({
          task: federatedTask,
          payload: taskPayload,
          startTime: taskStartTime,
        });
      } catch (error) {
        results.push({
          taskId: this.createId('failed'),
          success: false,
          error: error instanceof Error ? error.message : String(error),
          durationMs: Date.now() - taskStartTime,
        });
      }
    }

    // Wait for all tasks to complete
    const timeout = options.timeout || this.config.executionTimeout;
    const completionPromises = submittedTasks.map(async ({ task, startTime: taskStart }) => {
      try {
        const result = await this.waitForTaskCompletion(task.id, timeout);
        return {
          taskId: task.id,
          success: true,
          result: result as T,
          nodeId: task.assignedNode,
          agentId: task.assignedAgent,
          durationMs: Date.now() - taskStart,
        };
      } catch (error) {
        return {
          taskId: task.id,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          nodeId: task.assignedNode,
          agentId: task.assignedAgent,
          durationMs: Date.now() - taskStart,
        };
      }
    });

    const completedResults = await Promise.all(completionPromises);
    results.push(...completedResults);

    // Calculate summary
    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;
    const totalDuration = results.reduce((sum, r) => sum + r.durationMs, 0);
    const averageDuration = results.length > 0 ? totalDuration / results.length : 0;

    this.metrics.tasksExecuted += successful;
    this.metrics.tasksFailed += failed;

    return {
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        averageDurationMs: Math.round(averageDuration),
      },
    };
  }

  // ============================================================================
  // Health & Monitoring
  // ============================================================================

  /**
   * Check transport health status
   *
   * @returns Health status for QUIC and Federation
   */
  async healthCheck(): Promise<TransportHealth> {
    await this.ensureInitialized();

    const [quicHealth, federationHealth] = await Promise.all([
      this.quic.checkHealth(),
      this.federation.checkHealth(),
    ]);

    const quicLatency = await this.quic.getLatencyStats();
    const federationStats = this.federation.getStats();

    return {
      quic: quicHealth.healthy,
      federation: federationHealth.healthy,
      overallHealthy: quicHealth.healthy || federationHealth.healthy,
      details: {
        quicConnections: this.connections.size,
        quicLatency: quicLatency.avg,
        federationNodes: federationStats.totalAgents,
        federationAgents: federationStats.onlineAgents,
      },
    };
  }

  /**
   * Get transport metrics
   *
   * @returns Combined metrics from all transport layers
   */
  async getMetrics(): Promise<TransportMetrics> {
    await this.ensureInitialized();

    const latencyStats = await this.quic.getLatencyStats();

    return {
      ...this.metrics,
      averageLatencyMs: latencyStats.avg || this.calculateAverageLatency(),
      p95LatencyMs: latencyStats.p95 || this.calculateP95Latency(),
    };
  }

  /**
   * Get latency statistics
   */
  async getLatencyStats(): Promise<LatencyStats> {
    await this.ensureInitialized();
    return this.quic.getLatencyStats();
  }

  /**
   * Reset transport metrics
   */
  resetMetrics(): void {
    this.metrics = this.createInitialMetrics();
    this.latencies = [];
    this.quic.resetMetrics();
    this.federation.resetMetrics();
  }

  // ============================================================================
  // Event Handling
  // ============================================================================

  /**
   * Subscribe to transport events
   */
  on(event: string, listener: (...args: unknown[]) => void): this {
    this.emitter.on(event, listener);
    return this;
  }

  /**
   * Unsubscribe from transport events
   */
  off(event: string, listener: (...args: unknown[]) => void): this {
    this.emitter.off(event, listener);
    return this;
  }

  // ============================================================================
  // Lifecycle
  // ============================================================================

  /**
   * Dispose of transport resources
   */
  async dispose(): Promise<void> {
    // Close all connections
    for (const [agentId] of this.connections) {
      try {
        await this.unregisterAgentEndpoint(agentId);
      } catch {
        // Ignore cleanup errors
      }
    }

    // Dispose adapters
    await Promise.all([
      this.quic.dispose(),
      this.federation.dispose(),
    ]);

    this.connections.clear();
    this.agentEndpoints.clear();
    this.emitter.removeAllListeners();
    this.initialized = false;
  }

  /**
   * Get current configuration
   */
  getConfig(): TransportConfig {
    return { ...this.config };
  }

  /**
   * Check if transport is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  private shouldUseQuic(): boolean {
    return (
      this.config.preferQuic &&
      FeatureFlags.getInstance().isEnabled('quic-transport') &&
      this.quic.isAvailable()
    );
  }

  private async sendViaQuic(agentId: string, message: AgentMessage): Promise<unknown> {
    // Get or create connection
    let connection = this.connections.get(agentId);
    if (!connection) {
      const endpoint = this.agentEndpoints.get(agentId);
      if (!endpoint) {
        throw new Error(`No endpoint registered for agent: ${agentId}`);
      }
      connection = await this.quic.connect(endpoint);
      this.connections.set(agentId, connection);
    }

    // Convert to QUIC message
    const quicMessage: QUICMessage = {
      id: message.id,
      type: message.requiresResponse ? 'request' : 'stream',
      payload: message,
      timestamp: message.timestamp,
      priority: message.priority || 'normal',
    };

    if (message.requiresResponse) {
      const response = await this.quic.sendWithResponse(
        connection.id,
        quicMessage,
        this.config.sendTimeout
      );
      this.metrics.messagesReceived++;
      return response.payload;
    } else {
      await this.quic.send(connection.id, quicMessage);
      return undefined;
    }
  }

  private async sendViaFederation(agentId: string, message: AgentMessage): Promise<unknown> {
    // Submit as task to federation
    const task = await this.federation.submitTask({
      type: 'agent-message',
      payload: message,
      assignedAgent: agentId,
    });

    if (message.requiresResponse) {
      return this.waitForTaskCompletion(task.id, this.config.sendTimeout);
    }

    return undefined;
  }

  private async waitForTaskCompletion(taskId: string, timeout: number): Promise<unknown> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const status = await this.federation.getTaskStatus(taskId);

      if (!status) {
        throw new Error(`Task not found: ${taskId}`);
      }

      if (status.status === 'completed') {
        return status.result;
      }

      if (status.status === 'failed') {
        throw new Error(`Task failed: ${taskId}`);
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    throw new Error(`Task timeout: ${taskId}`);
  }

  private createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private createInitialMetrics(): TransportMetrics {
    return {
      messagesSent: 0,
      messagesReceived: 0,
      bytesSent: 0,
      bytesReceived: 0,
      tasksExecuted: 0,
      tasksFailed: 0,
      averageLatencyMs: 0,
      p95LatencyMs: 0,
      errors: 0,
      reconnections: 0,
    };
  }

  private recordLatency(latencyMs: number): void {
    this.latencies.push(latencyMs);
    // Keep only last 1000 latencies
    if (this.latencies.length > 1000) {
      this.latencies.shift();
    }
  }

  private calculateAverageLatency(): number {
    if (this.latencies.length === 0) return 0;
    return this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
  }

  private calculateP95Latency(): number {
    if (this.latencies.length === 0) return 0;
    const sorted = [...this.latencies].sort((a, b) => a - b);
    const index = Math.floor(sorted.length * 0.95);
    return sorted[index] ?? sorted[sorted.length - 1];
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a new AgentTransport instance with default adapters
 *
 * @param config - Transport configuration
 * @returns Configured AgentTransport instance
 */
export function createAgentTransport(
  config?: Partial<TransportConfig>
): AgentTransport {
  const quic = new QUICTransportAdapter();
  const federation = new FederationHubAdapter();
  return new AgentTransport(quic, federation, config);
}
