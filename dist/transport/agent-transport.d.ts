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
import { QUICTransportAdapter, type LatencyStats } from '../integrations/agentic-flow/adapters/quic-transport-adapter.js';
import { FederationHubAdapter } from '../integrations/agentic-flow/adapters/federation-hub-adapter.js';
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
export declare const defaultTransportConfig: TransportConfig;
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
/**
 * Agent Transport Service
 *
 * Unified transport layer for agent communication combining QUIC
 * for low-latency messaging and Federation Hub for distributed
 * task execution.
 */
export declare class AgentTransport {
    private config;
    private quic;
    private federation;
    private emitter;
    private metrics;
    private initialized;
    private connections;
    private agentEndpoints;
    private latencies;
    constructor(quic: QUICTransportAdapter, federation: FederationHubAdapter, config?: Partial<TransportConfig>);
    /**
     * Initialize the transport service
     */
    initialize(): Promise<void>;
    /**
     * Send a message to a specific agent
     *
     * @param agentId - Target agent ID
     * @param message - Message to send
     * @returns Response if requiresResponse is true
     */
    sendToAgent(agentId: string, message: unknown): Promise<unknown>;
    /**
     * Broadcast a message to all agents of a specific type
     *
     * @param agentType - Type of agents to broadcast to
     * @param message - Message to broadcast
     */
    broadcastToAgents(agentType: string, message: unknown): Promise<void>;
    /**
     * Register an agent endpoint for direct messaging
     *
     * @param agentId - Agent ID
     * @param endpoint - Agent endpoint address
     */
    registerAgentEndpoint(agentId: string, endpoint: string): Promise<void>;
    /**
     * Unregister an agent endpoint
     *
     * @param agentId - Agent ID to unregister
     */
    unregisterAgentEndpoint(agentId: string): Promise<void>;
    /**
     * Execute a task on the optimal node in the federation
     *
     * @param task - Task payload to execute
     * @param options - Execution options
     * @returns Execution result
     */
    executeDistributed(task: unknown, options?: DistributedExecutionOptions): Promise<unknown>;
    /**
     * Execute multiple tasks in parallel across the federation
     *
     * @param tasks - Array of task payloads
     * @param options - Execution options applied to all tasks
     * @returns Aggregated results
     */
    executeParallel<T = unknown>(tasks: unknown[], options?: DistributedExecutionOptions): Promise<ParallelExecutionResult<T>>;
    /**
     * Check transport health status
     *
     * @returns Health status for QUIC and Federation
     */
    healthCheck(): Promise<TransportHealth>;
    /**
     * Get transport metrics
     *
     * @returns Combined metrics from all transport layers
     */
    getMetrics(): Promise<TransportMetrics>;
    /**
     * Get latency statistics
     */
    getLatencyStats(): Promise<LatencyStats>;
    /**
     * Reset transport metrics
     */
    resetMetrics(): void;
    /**
     * Subscribe to transport events
     */
    on(event: string, listener: (...args: unknown[]) => void): this;
    /**
     * Unsubscribe from transport events
     */
    off(event: string, listener: (...args: unknown[]) => void): this;
    /**
     * Dispose of transport resources
     */
    dispose(): Promise<void>;
    /**
     * Get current configuration
     */
    getConfig(): TransportConfig;
    /**
     * Check if transport is initialized
     */
    isInitialized(): boolean;
    private ensureInitialized;
    private shouldUseQuic;
    private sendViaQuic;
    private sendViaFederation;
    private waitForTaskCompletion;
    private createId;
    private createInitialMetrics;
    private recordLatency;
    private calculateAverageLatency;
    private calculateP95Latency;
}
/**
 * Create a new AgentTransport instance with default adapters
 *
 * @param config - Transport configuration
 * @returns Configured AgentTransport instance
 */
export declare function createAgentTransport(config?: Partial<TransportConfig>): AgentTransport;
//# sourceMappingURL=agent-transport.d.ts.map