/**
 * TypedEventBus - Cross-Service Communication
 *
 * Provides strongly-typed event pub/sub for communication between
 * MCP, GraphQL, Dashboard, and other services. Features include:
 * - TypeScript generics for type-safe events
 * - Event history with configurable retention
 * - Event filtering by type and source
 * - Async event handlers with error isolation
 * - Integration with GraphQL subscriptions
 * - Metrics tracking (event counts, latency)
 *
 * @module server/event-bus
 */
import { EventEmitter } from 'events';
/**
 * All supported event types in the system
 */
export type EventType = 'NodeCreated' | 'NodeUpdated' | 'NodeDeleted' | 'RelationCreated' | 'RelationDeleted' | 'AgentSpawned' | 'AgentCompleted' | 'AgentFailed' | 'WorkflowStarted' | 'WorkflowProgress' | 'WorkflowCompleted' | 'PluginLoaded' | 'PluginError' | 'HealthCheckFailed' | 'HealthCheckRecovered' | 'CacheEviction';
/**
 * Node-related event data
 */
export interface NodeEventData {
    nodeId: string;
    path: string;
    type: string;
    title?: string;
    previousState?: Record<string, unknown>;
    newState?: Record<string, unknown>;
}
/**
 * Relation-related event data
 */
export interface RelationEventData {
    sourceId: string;
    targetId: string;
    relationType: string;
    context?: string;
}
/**
 * Agent-related event data
 */
export interface AgentEventData {
    agentId: string;
    agentType: string;
    taskId?: string;
    result?: unknown;
    error?: string;
    duration?: number;
}
/**
 * Workflow-related event data
 */
export interface WorkflowEventData {
    workflowId: string;
    executionId: string;
    stepId?: string;
    progress?: number;
    result?: unknown;
    error?: string;
}
/**
 * Plugin-related event data
 */
export interface PluginEventData {
    pluginId: string;
    pluginName: string;
    version?: string;
    error?: string;
}
/**
 * Health check event data
 */
export interface HealthEventData {
    component: string;
    reason?: string;
    metrics?: Record<string, number | string>;
}
/**
 * Cache eviction event data
 */
export interface CacheEvictionData {
    key: string;
    reason: 'ttl' | 'capacity' | 'manual';
    age?: number;
}
/**
 * Mapping of event types to their data types
 */
export interface EventDataMap {
    NodeCreated: NodeEventData;
    NodeUpdated: NodeEventData;
    NodeDeleted: NodeEventData;
    RelationCreated: RelationEventData;
    RelationDeleted: RelationEventData;
    AgentSpawned: AgentEventData;
    AgentCompleted: AgentEventData;
    AgentFailed: AgentEventData;
    WorkflowStarted: WorkflowEventData;
    WorkflowProgress: WorkflowEventData;
    WorkflowCompleted: WorkflowEventData;
    PluginLoaded: PluginEventData;
    PluginError: PluginEventData;
    HealthCheckFailed: HealthEventData;
    HealthCheckRecovered: HealthEventData;
    CacheEviction: CacheEvictionData;
}
/**
 * Immutable event entry stored in history
 */
export interface EventEntry<T extends EventType = EventType> {
    /** Unique event ID */
    readonly id: string;
    /** Event type */
    readonly type: T;
    /** Event data */
    readonly data: EventDataMap[T];
    /** Source of the event (e.g., 'mcp-server', 'graphql-resolver') */
    readonly source: string;
    /** When the event occurred */
    readonly timestamp: Date;
    /** Processing latency in milliseconds (set after handlers complete) */
    readonly latency?: number;
}
/**
 * Filter for querying event history
 */
export interface EventFilter {
    /** Filter by event types */
    types?: EventType[];
    /** Filter by source */
    source?: string;
    /** Filter by source pattern (regex) */
    sourcePattern?: RegExp;
    /** Start time (inclusive) */
    since?: Date;
    /** End time (exclusive) */
    until?: Date;
    /** Maximum number of events to return */
    limit?: number;
    /** Skip first N events */
    offset?: number;
}
/**
 * Event handler function type
 */
export type EventHandler<T extends EventType> = (data: EventDataMap[T], entry: EventEntry<T>) => void | Promise<void>;
/**
 * Unsubscribe function type
 */
export type Unsubscribe = () => void;
/**
 * Metrics for a specific event type
 */
export interface EventTypeMetrics {
    /** Total events emitted */
    count: number;
    /** Number of handler errors */
    errorCount: number;
    /** Average processing latency in ms */
    avgLatency: number;
    /** Maximum processing latency in ms */
    maxLatency: number;
    /** Last event timestamp */
    lastEvent?: Date;
}
/**
 * Overall event bus metrics
 */
export interface EventBusMetrics {
    /** Total events emitted across all types */
    totalEvents: number;
    /** Total handler errors across all types */
    totalErrors: number;
    /** Events per type */
    byType: Partial<Record<EventType, EventTypeMetrics>>;
    /** Current history size */
    historySize: number;
    /** Active subscriber count */
    subscriberCount: number;
}
/**
 * TypedEventBus interface for cross-service communication
 */
export interface ITypedEventBus {
    /**
     * Emit an event with typed data
     */
    emit<T extends EventType>(event: T, data: EventDataMap[T], source?: string): void;
    /**
     * Subscribe to an event type
     */
    on<T extends EventType>(event: T, handler: EventHandler<T>): Unsubscribe;
    /**
     * Subscribe to an event type for a single occurrence
     */
    once<T extends EventType>(event: T, handler: EventHandler<T>): Unsubscribe;
    /**
     * Unsubscribe a specific handler
     */
    off<T extends EventType>(event: T, handler: EventHandler<T>): void;
    /**
     * Get event history with optional filtering
     */
    getHistory(filter?: EventFilter): EventEntry[];
    /**
     * Get event bus metrics
     */
    getMetrics(): EventBusMetrics;
    /**
     * Clear event history
     */
    clearHistory(): void;
    /**
     * Subscribe to all events (wildcard)
     */
    onAny(handler: (entry: EventEntry) => void | Promise<void>): Unsubscribe;
    /**
     * Get the underlying EventEmitter for GraphQL subscriptions
     */
    getEmitter(): EventEmitter;
}
/**
 * TypedEventBus configuration options
 */
export interface TypedEventBusOptions {
    /** Maximum history entries to retain (default: 1000) */
    maxHistorySize?: number;
    /** History retention time in milliseconds (default: 1 hour) */
    historyRetention?: number;
    /** Maximum listeners per event (default: 100) */
    maxListeners?: number;
    /** Log events at debug level (default: false) */
    debugEvents?: boolean;
}
/**
 * TypedEventBus
 *
 * Strongly-typed event emitter with history, filtering, and metrics.
 * Provides error isolation so one failing handler doesn't affect others.
 *
 * @example
 * ```typescript
 * const eventBus = createTypedEventBus({ maxHistorySize: 500 });
 *
 * // Subscribe with type safety
 * const unsubscribe = eventBus.on('NodeCreated', (data, entry) => {
 *   console.log(`Node ${data.nodeId} created at ${data.path}`);
 * });
 *
 * // Emit with type safety
 * eventBus.emit('NodeCreated', {
 *   nodeId: '123',
 *   path: '/docs/readme.md',
 *   type: 'document',
 * }, 'mcp-server');
 *
 * // Query history
 * const recentNodeEvents = eventBus.getHistory({
 *   types: ['NodeCreated', 'NodeUpdated'],
 *   limit: 10,
 * });
 *
 * // Cleanup
 * unsubscribe();
 * ```
 */
export declare class TypedEventBus implements ITypedEventBus {
    private readonly emitter;
    private readonly history;
    private readonly options;
    private readonly metrics;
    private readonly handlers;
    private readonly wildcardHandlers;
    private eventCounter;
    private cleanupInterval?;
    constructor(options?: TypedEventBusOptions);
    /**
     * Emit an event with typed data
     */
    emit<T extends EventType>(event: T, data: EventDataMap[T], source?: string): void;
    /**
     * Emit an event using (type, source, data) signature
     * This method supports both typed events and arbitrary string events
     * for backwards compatibility with container and other components.
     *
     * @param type - Event type (can be EventType or any string)
     * @param source - Source of the event
     * @param data - Event data payload
     */
    emitEvent(type: EventType | string, source: string, data: Record<string, unknown>): void;
    /**
     * Check if an event type is a known typed event
     */
    private isKnownEventType;
    /**
     * Subscribe to an event type
     */
    on<T extends EventType>(event: T, handler: EventHandler<T>): Unsubscribe;
    /**
     * Subscribe to an event type for a single occurrence
     */
    once<T extends EventType>(event: T, handler: EventHandler<T>): Unsubscribe;
    /**
     * Unsubscribe a specific handler
     */
    off<T extends EventType>(event: T, handler: EventHandler<T>): void;
    /**
     * Subscribe to all events (wildcard)
     */
    onAny(handler: (entry: EventEntry) => void | Promise<void>): Unsubscribe;
    /**
     * Get event history with optional filtering
     */
    getHistory(filter?: EventFilter): EventEntry[];
    /**
     * Get event bus metrics
     */
    getMetrics(): EventBusMetrics;
    /**
     * Clear event history
     */
    clearHistory(): void;
    /**
     * Get the underlying EventEmitter for GraphQL subscriptions
     */
    getEmitter(): EventEmitter;
    /**
     * Stop the event bus and cleanup resources
     */
    dispose(): void;
    /**
     * Generate a unique event ID
     */
    private generateEventId;
    /**
     * Get or create handler set for an event type
     */
    private getOrCreateHandlerSet;
    /**
     * Execute all handlers for an event with error isolation
     */
    private executeHandlers;
    /**
     * Safely execute a handler with error isolation
     */
    private safeExecute;
    /**
     * Handle a handler error without affecting other handlers
     */
    private handleHandlerError;
    /**
     * Add an event to history
     */
    private addToHistory;
    /**
     * Prune old entries from history based on retention time
     */
    private pruneHistory;
    /**
     * Update metrics for an event type
     */
    private updateMetrics;
}
/**
 * Create a new TypedEventBus instance
 *
 * @param options - Configuration options
 * @returns New TypedEventBus instance
 *
 * @example
 * ```typescript
 * const eventBus = createTypedEventBus({
 *   maxHistorySize: 500,
 *   historyRetention: 30 * 60 * 1000, // 30 minutes
 *   debugEvents: true,
 * });
 * ```
 */
export declare function createTypedEventBus(options?: TypedEventBusOptions): TypedEventBus;
/**
 * Create an async iterator for GraphQL subscriptions
 *
 * This wraps the EventEmitter to provide an AsyncIterator interface
 * compatible with GraphQL subscription resolvers.
 *
 * @param eventBus - The TypedEventBus instance
 * @param eventTypes - Event types to subscribe to
 * @returns AsyncIterator for GraphQL subscriptions
 *
 * @example
 * ```typescript
 * // In GraphQL resolver
 * const resolvers = {
 *   Subscription: {
 *     nodeChanged: {
 *       subscribe: () => createSubscriptionIterator(eventBus, ['NodeCreated', 'NodeUpdated', 'NodeDeleted']),
 *     },
 *   },
 * };
 * ```
 */
export declare function createSubscriptionIterator<T extends EventType>(eventBus: TypedEventBus, eventTypes: T[]): AsyncIterableIterator<EventEntry<T>>;
/**
 * Filter events by node types for GraphQL subscriptions
 *
 * @param nodeTypes - Node types to filter by
 * @returns Filter function for subscription
 */
export declare function createNodeTypeFilter(nodeTypes: string[]): (entry: EventEntry<'NodeCreated' | 'NodeUpdated' | 'NodeDeleted'>) => boolean;
/**
 * Filter events by source for GraphQL subscriptions
 *
 * @param sources - Sources to filter by
 * @returns Filter function for subscription
 */
export declare function createSourceFilter(sources: string[]): (entry: EventEntry) => boolean;
//# sourceMappingURL=event-bus.d.ts.map