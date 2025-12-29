/**
 * FederationHub Adapter
 *
 * Bridges knowledge-graph-agent with FederationHub for multi-agent
 * coordination and distributed workflow execution.
 *
 * Provides 3-5x parallel speedup for distributed agent coordination
 * through ephemeral agent spawning and intelligent load balancing.
 *
 * @module integrations/agentic-flow/adapters/federation-hub-adapter
 */
import { BaseAdapter, type HealthCheckable, type MetricsTrackable } from './base-adapter.js';
/**
 * Configuration for FederationHub adapter
 */
export interface FederationHubConfig {
    /**
     * Hub ID for this instance
     */
    hubId?: string;
    /**
     * Enable automatic agent discovery
     */
    enableAutoDiscovery: boolean;
    /**
     * Enable distributed consensus for decisions
     */
    enableConsensus: boolean;
    /**
     * Enable federated learning across agents
     */
    enableFederatedLearning: boolean;
    /**
     * Maximum agents in federation
     */
    maxAgents: number;
    /**
     * Heartbeat interval in milliseconds
     */
    heartbeatInterval: number;
    /**
     * Timeout for agent responses in milliseconds
     */
    agentTimeout: number;
    /**
     * Hub address for remote connection
     */
    hubAddress?: string;
    /**
     * Default TTL for ephemeral agents in milliseconds
     */
    defaultAgentTtl: number;
    /**
     * Load balancing strategy
     */
    loadBalancingStrategy: 'round-robin' | 'least-loaded' | 'capability-match' | 'random';
}
/**
 * Default FederationHub configuration
 */
export declare const defaultFederationHubConfig: FederationHubConfig;
/**
 * Federation node representation (spec-compliant)
 */
export interface FederationNode {
    id: string;
    name: string;
    endpoint: string;
    capabilities: string[];
    status: 'online' | 'offline' | 'degraded';
    load: number;
}
/**
 * Ephemeral agent representation (spec-compliant)
 */
export interface EphemeralAgent {
    id: string;
    type: string;
    nodeId: string;
    ttl: number;
    createdAt: number;
    status: 'spawning' | 'active' | 'terminating' | 'terminated';
}
/**
 * Federated task representation (spec-compliant)
 */
export interface FederatedTask {
    id: string;
    type: string;
    payload: unknown;
    assignedNode?: string;
    assignedAgent?: string;
    status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
    result?: unknown;
}
/**
 * Agent in the federation (legacy)
 */
export interface FederatedAgent {
    id: string;
    name: string;
    type: string;
    capabilities: string[];
    status: 'online' | 'offline' | 'busy' | 'error';
    lastSeen: Date;
    metadata?: Record<string, unknown>;
}
/**
 * Distributed task (legacy)
 */
export interface DistributedTask {
    id: string;
    type: string;
    payload: unknown;
    requiredCapabilities: string[];
    priority: 'low' | 'normal' | 'high' | 'critical';
    deadline?: Date;
    assignedAgents: string[];
    status: 'pending' | 'assigned' | 'running' | 'completed' | 'failed';
    results?: Map<string, unknown>;
}
/**
 * Consensus proposal
 */
export interface ConsensusProposal {
    id: string;
    type: string;
    data: unknown;
    proposer: string;
    votes: Map<string, boolean>;
    quorum: number;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    expiresAt: Date;
}
/**
 * Federation statistics
 */
export interface FederationStats {
    totalAgents: number;
    onlineAgents: number;
    activeTasks: number;
    completedTasks: number;
    failedTasks: number;
    consensusProposals: number;
    uptime: number;
}
/**
 * Federation metrics
 */
export interface FederationMetrics {
    totalNodes: number;
    activeNodes: number;
    totalAgents: number;
    activeAgents: number;
    totalTasks: number;
    pendingTasks: number;
    runningTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDurationMs: number;
    tasksPerSecond: number;
    errors: number;
}
/**
 * FederationHub Adapter
 *
 * Provides multi-agent coordination for knowledge graph agents.
 * Features:
 * - 3-5x parallel speedup for distributed tasks
 * - Ephemeral agent spawning with TTL
 * - Intelligent load balancing
 * - Node registration and discovery
 * - Task distribution and tracking
 */
export declare class FederationHubAdapter extends BaseAdapter<unknown> implements HealthCheckable, MetricsTrackable {
    private config;
    private nodes;
    private agents;
    private tasks;
    private localAgents;
    private proposals;
    private eventHandlers;
    private emitter;
    private metrics;
    private startTime;
    private roundRobinIndex;
    private agentCleanupInterval?;
    constructor(config?: Partial<FederationHubConfig>);
    /**
     * Get the feature name for feature flag lookup
     */
    getFeatureName(): string;
    /**
     * Check if FederationHub module is available
     */
    isAvailable(): boolean;
    /**
     * Initialize the FederationHub adapter
     */
    initialize(): Promise<void>;
    /**
     * Register a node with the federation
     *
     * @param node - Node to register
     * @returns Registered node
     */
    registerNode(node: Omit<FederationNode, 'status' | 'load'>): Promise<FederationNode>;
    /**
     * Unregister a node from the federation
     *
     * @param nodeId - Node ID to unregister
     */
    unregisterNode(nodeId: string): Promise<void>;
    /**
     * List nodes in the federation
     *
     * @param filter - Optional filter criteria
     * @returns Matching nodes
     */
    listNodes(filter?: {
        capabilities?: string[];
        minLoad?: number;
    }): Promise<FederationNode[]>;
    /**
     * Get a specific node
     *
     * @param nodeId - Node ID
     * @returns Node or null
     */
    getNode(nodeId: string): Promise<FederationNode | null>;
    /**
     * Spawn an ephemeral agent
     *
     * @param type - Agent type
     * @param nodeId - Optional node ID (auto-selects if not provided)
     * @param ttl - Optional TTL in milliseconds
     * @returns Spawned agent
     */
    spawnEphemeralAgent(type: string, nodeId?: string, ttl?: number): Promise<EphemeralAgent>;
    /**
     * Terminate an ephemeral agent
     *
     * @param agentId - Agent ID to terminate
     */
    terminateAgent(agentId: string): Promise<void>;
    /**
     * List agents in the federation
     *
     * @param nodeId - Optional node ID to filter by
     * @returns List of agents
     */
    listAgents(nodeId?: string): Promise<EphemeralAgent[]>;
    /**
     * Submit a task for distributed execution
     *
     * @param task - Task to submit
     * @returns Submitted task
     */
    submitTask(task: Omit<FederatedTask, 'id' | 'status'>): Promise<FederatedTask>;
    /**
     * Get task status
     *
     * @param taskId - Task ID
     * @returns Task or null
     */
    getTaskStatus(taskId: string): Promise<FederatedTask | null>;
    /**
     * Cancel a task
     *
     * @param taskId - Task ID to cancel
     */
    cancelTask(taskId: string): Promise<void>;
    /**
     * Select the optimal node for a task
     *
     * @param capabilities - Required capabilities
     * @returns Best matching node or null
     */
    selectOptimalNode(capabilities: string[]): Promise<FederationNode | null>;
    /**
     * Rebalance load across nodes
     */
    rebalanceLoad(): Promise<void>;
    /**
     * Broadcast a message to all nodes
     *
     * @param message - Message to broadcast
     */
    broadcastToNodes(message: unknown): Promise<void>;
    /**
     * Synchronize state across the federation
     */
    syncState(): Promise<void>;
    /**
     * Register an agent with the federation (legacy API)
     *
     * @param agent - Agent to register
     */
    registerAgent(agent: Omit<FederatedAgent, 'status' | 'lastSeen'>): Promise<void>;
    /**
     * Unregister an agent from the federation (legacy API)
     *
     * @param agentId - Agent ID to unregister
     */
    unregisterAgent(agentId: string): Promise<void>;
    /**
     * Get agents in the federation (legacy API)
     *
     * @param filter - Optional filter criteria
     * @returns Matching agents
     */
    getAgents(filter?: {
        status?: string;
        capability?: string;
    }): FederatedAgent[];
    /**
     * Get a specific agent (legacy API)
     *
     * @param agentId - Agent ID
     * @returns Agent or null
     */
    getAgent(agentId: string): FederatedAgent | null;
    /**
     * Submit a task for distributed execution (legacy API)
     *
     * @param task - Task to submit
     * @returns Task ID
     */
    submitDistributedTask(task: Omit<DistributedTask, 'id' | 'status' | 'assignedAgents' | 'results'>): Promise<string>;
    /**
     * Get a specific task (legacy API)
     *
     * @param taskId - Task ID
     * @returns Task or null
     */
    getTask(taskId: string): DistributedTask | null;
    /**
     * Get tasks in the federation (legacy API)
     *
     * @param filter - Optional filter criteria
     * @returns Matching tasks
     */
    getTasks(filter?: {
        status?: string;
    }): DistributedTask[];
    /**
     * Propose a consensus decision (legacy API)
     *
     * @param proposal - Proposal to submit
     * @returns Proposal ID
     */
    proposeConsensus(proposal: Omit<ConsensusProposal, 'id' | 'votes' | 'status'>): Promise<string>;
    /**
     * Vote on a consensus proposal (legacy API)
     *
     * @param proposalId - Proposal ID
     * @param agentId - Voting agent ID
     * @param approve - Whether to approve
     */
    vote(proposalId: string, agentId: string, approve: boolean): Promise<void>;
    /**
     * Get a consensus proposal (legacy API)
     *
     * @param proposalId - Proposal ID
     * @returns Proposal or null
     */
    getProposal(proposalId: string): ConsensusProposal | null;
    /**
     * Subscribe to agent join events
     */
    onAgentJoin(handler: (agent: FederatedAgent) => void): () => void;
    /**
     * Subscribe to agent leave events
     */
    onAgentLeave(handler: (agentId: string) => void): () => void;
    /**
     * Subscribe to task assigned events
     */
    onTaskAssigned(handler: (task: DistributedTask, agentId: string) => void): () => void;
    /**
     * Subscribe to task completed events
     */
    onTaskCompleted(handler: (task: DistributedTask) => void): () => void;
    /**
     * Get federation statistics
     *
     * @returns Federation stats
     */
    getStats(): FederationStats;
    /**
     * Get locally registered agents
     *
     * @returns Local agents
     */
    getLocalAgents(): FederatedAgent[];
    /**
     * Check health of the adapter
     */
    checkHealth(): Promise<{
        healthy: boolean;
        message?: string;
        details?: Record<string, unknown>;
    }>;
    /**
     * Get adapter metrics
     */
    getMetrics(): Record<string, number | string>;
    /**
     * Reset adapter metrics
     */
    resetMetrics(): void;
    /**
     * Subscribe to adapter events
     */
    on(event: string, listener: (...args: unknown[]) => void): this;
    /**
     * Unsubscribe from adapter events
     */
    off(event: string, listener: (...args: unknown[]) => void): this;
    /**
     * Dispose and close
     */
    dispose(): Promise<void>;
    /**
     * Get the current configuration
     */
    getConfig(): FederationHubConfig;
    private ensureInitializedAsync;
    private createId;
    private createInitialMetrics;
    private simulateDelay;
    private selectOptimalNodeInternal;
    private assignTask;
    private executeTaskAsync;
    private cleanupExpiredAgents;
}
/**
 * Create a new FederationHub adapter instance
 *
 * @param config - Adapter configuration
 * @returns Configured adapter
 */
export declare function createFederationHubAdapter(config?: Partial<FederationHubConfig>): FederationHubAdapter;
//# sourceMappingURL=federation-hub-adapter.d.ts.map