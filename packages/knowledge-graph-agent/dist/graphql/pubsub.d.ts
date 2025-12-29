/**
 * GraphQL PubSub Implementation
 *
 * In-memory publish/subscribe system for GraphQL subscriptions.
 * Integrates with EventEmitter for event propagation from services.
 *
 * @module graphql/pubsub
 */
import { EventEmitter } from 'events';
import type { KnowledgeNode, GraphEdge } from '../core/types.js';
import type { AgentStatus, AgentConfig } from '../agents/types.js';
import type { WorkflowExecution, WorkflowEvent } from '../workflows/types.js';
import type { SystemHealth, HealthStatus } from '../health/types.js';
/**
 * Subscription topic constants for type-safe event publishing/subscribing.
 */
export declare const Topics: {
    readonly NODE_CREATED: "NODE_CREATED";
    readonly NODE_UPDATED: "NODE_UPDATED";
    readonly NODE_DELETED: "NODE_DELETED";
    readonly RELATION_CREATED: "RELATION_CREATED";
    readonly EDGE_CREATED: "EDGE_CREATED";
    readonly EDGE_DELETED: "EDGE_DELETED";
    readonly AGENT_STATUS_CHANGED: "AGENT_STATUS_CHANGED";
    readonly TASK_COMPLETED: "TASK_COMPLETED";
    readonly WORKFLOW_PROGRESS: "WORKFLOW_PROGRESS";
    readonly WORKFLOW_STATUS: "WORKFLOW_STATUS";
    readonly WORKFLOW_EVENTS: "WORKFLOW_EVENTS";
    readonly HEALTH_UPDATED: "HEALTH_UPDATED";
    readonly HEALTH_CHANGED: "HEALTH_CHANGED";
    readonly ANALYSIS_PROGRESS: "ANALYSIS_PROGRESS";
    readonly REASONING_CHAIN_UPDATED: "REASONING_CHAIN_UPDATED";
    readonly DECISION_MADE: "DECISION_MADE";
    readonly GRAPH_SYNCED: "GRAPH_SYNCED";
};
export type TopicName = (typeof Topics)[keyof typeof Topics];
/**
 * Deleted node information for subscription events.
 */
export interface DeletedNode {
    id: string;
    path?: string;
    title?: string;
    deletedAt: Date;
}
/**
 * Agent status change event payload.
 */
export interface AgentStatusPayload {
    id: string;
    name: string;
    type: string;
    status: AgentStatus;
    previousStatus?: AgentStatus;
    currentTask?: string;
    progress?: number;
    lastActivity: Date;
    health: {
        healthy: boolean;
        status: AgentStatus;
        lastHeartbeat: Date;
        error?: string;
        memoryUsage?: number;
    };
    config: AgentConfig;
    completedTaskCount: number;
    queuedTaskCount: number;
    errorCount: number;
}
/**
 * Workflow progress event payload.
 */
export interface WorkflowProgressPayload {
    id: string;
    workflowId: string;
    status: string;
    progress: number;
    currentStep?: string;
    completedSteps: number;
    totalSteps: number;
    startedAt?: Date;
    estimatedCompletion?: Date;
    error?: string;
}
/**
 * Analysis progress event payload.
 */
export interface AnalysisProgressPayload {
    taskId: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    currentPhase?: string;
    message?: string;
    result?: unknown;
    error?: string;
    startedAt: Date;
    completedAt?: Date;
}
/**
 * Health status update payload.
 */
export interface HealthStatusPayload {
    status: HealthStatus;
    components: {
        database: boolean;
        cache: boolean;
        agents: boolean;
        vectorStore: boolean;
    };
    uptime: number;
    requestCount: number;
    toolCount: number;
    previousStatus?: HealthStatus;
    changedAt: Date;
}
/**
 * Type-safe mapping of topics to their payload types.
 */
export interface TopicPayloadMap {
    [Topics.NODE_CREATED]: KnowledgeNode;
    [Topics.NODE_UPDATED]: KnowledgeNode;
    [Topics.NODE_DELETED]: DeletedNode;
    [Topics.RELATION_CREATED]: GraphEdge;
    [Topics.EDGE_CREATED]: GraphEdge;
    [Topics.EDGE_DELETED]: string;
    [Topics.AGENT_STATUS_CHANGED]: AgentStatusPayload;
    [Topics.TASK_COMPLETED]: unknown;
    [Topics.WORKFLOW_PROGRESS]: WorkflowProgressPayload;
    [Topics.WORKFLOW_STATUS]: WorkflowExecution;
    [Topics.WORKFLOW_EVENTS]: WorkflowEvent;
    [Topics.HEALTH_UPDATED]: HealthStatusPayload;
    [Topics.HEALTH_CHANGED]: SystemHealth;
    [Topics.ANALYSIS_PROGRESS]: AnalysisProgressPayload;
    [Topics.REASONING_CHAIN_UPDATED]: unknown;
    [Topics.DECISION_MADE]: unknown;
    [Topics.GRAPH_SYNCED]: unknown;
}
/**
 * Async iterator for subscriptions with cleanup support.
 */
export interface SubscriptionIterator<T> extends AsyncIterableIterator<T> {
    /**
     * Unique subscription ID for tracking.
     */
    subscriptionId: string;
    /**
     * Clean up subscription resources.
     */
    cleanup: () => void;
}
/**
 * In-memory PubSub implementation for GraphQL subscriptions.
 *
 * Uses EventEmitter for event propagation and provides type-safe
 * publish/subscribe helpers. Supports subscription cleanup on disconnect.
 *
 * @example
 * ```typescript
 * const pubsub = new PubSub();
 *
 * // Subscribe to node creation events
 * const iterator = pubsub.asyncIterator(Topics.NODE_CREATED);
 *
 * // Publish a node creation event
 * pubsub.publish(Topics.NODE_CREATED, newNode);
 *
 * // With filter
 * const filteredIterator = pubsub.asyncIterator(Topics.WORKFLOW_PROGRESS, {
 *   filter: (payload) => payload.id === 'workflow-123'
 * });
 * ```
 */
export declare class PubSub {
    private emitter;
    private subscriptions;
    private subscriptionCounter;
    constructor();
    /**
     * Generate a unique subscription ID.
     */
    private generateSubscriptionId;
    /**
     * Publish an event to a topic.
     *
     * @param topic - The topic to publish to
     * @param payload - The event payload
     */
    publish<T extends TopicName>(topic: T, payload: TopicPayloadMap[T]): void;
    /**
     * Subscribe to a topic and receive an async iterator.
     *
     * @param topic - The topic to subscribe to
     * @param options - Optional subscription options including filter
     * @returns AsyncIterator that yields events
     */
    asyncIterator<T extends TopicName>(topic: T, options?: {
        filter?: (payload: TopicPayloadMap[T]) => boolean;
    }): SubscriptionIterator<TopicPayloadMap[T]>;
    /**
     * Subscribe to multiple topics with a unified iterator.
     *
     * @param topics - Array of topics to subscribe to
     * @returns AsyncIterator that yields events from all topics
     */
    asyncIteratorMulti<T extends TopicName>(topics: T[]): SubscriptionIterator<TopicPayloadMap[T]>;
    /**
     * Unsubscribe by subscription ID.
     *
     * @param subscriptionId - The subscription ID to unsubscribe
     */
    unsubscribe(subscriptionId: string): void;
    /**
     * Get the number of active subscriptions.
     */
    get subscriptionCount(): number;
    /**
     * Get active subscription IDs.
     */
    getActiveSubscriptions(): string[];
    /**
     * Clean up all subscriptions.
     */
    cleanup(): void;
    /**
     * Get the underlying EventEmitter for direct integration.
     */
    getEmitter(): EventEmitter;
}
/**
 * Get or create the global PubSub instance.
 *
 * @returns The global PubSub instance
 */
export declare function getPubSub(): PubSub;
/**
 * Reset the global PubSub instance (mainly for testing).
 */
export declare function resetPubSub(): void;
/**
 * Type-safe helper to publish a node created event.
 */
export declare function publishNodeCreated(node: KnowledgeNode): void;
/**
 * Type-safe helper to publish a node updated event.
 */
export declare function publishNodeUpdated(node: KnowledgeNode): void;
/**
 * Type-safe helper to publish a node deleted event.
 */
export declare function publishNodeDeleted(deletedNode: DeletedNode): void;
/**
 * Type-safe helper to publish a relation/edge created event.
 */
export declare function publishRelationCreated(edge: GraphEdge): void;
/**
 * Type-safe helper to publish an agent status change event.
 */
export declare function publishAgentStatusChanged(status: AgentStatusPayload): void;
/**
 * Type-safe helper to publish a workflow progress event.
 */
export declare function publishWorkflowProgress(progress: WorkflowProgressPayload): void;
/**
 * Type-safe helper to publish a health updated event.
 */
export declare function publishHealthUpdated(health: HealthStatusPayload): void;
/**
 * Type-safe helper to publish an analysis progress event.
 */
export declare function publishAnalysisProgress(progress: AnalysisProgressPayload): void;
/**
 * Wire an EventEmitter to the PubSub system.
 *
 * This allows existing EventEmitter-based services to automatically
 * publish events to GraphQL subscriptions.
 *
 * @param emitter - The EventEmitter to wire
 * @param mappings - Mapping of EventEmitter events to PubSub topics
 */
export declare function wireEventEmitter<T extends Record<string, TopicName>>(emitter: EventEmitter, mappings: T): () => void;
export default PubSub;
//# sourceMappingURL=pubsub.d.ts.map