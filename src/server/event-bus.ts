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
import { createLogger } from '../utils/index.js';

const logger = createLogger('event-bus');

// ============================================================================
// Event Type Definitions
// ============================================================================

/**
 * All supported event types in the system
 */
export type EventType =
  // Node events
  | 'NodeCreated'
  | 'NodeUpdated'
  | 'NodeDeleted'
  // Relation events
  | 'RelationCreated'
  | 'RelationDeleted'
  // Agent events
  | 'AgentSpawned'
  | 'AgentCompleted'
  | 'AgentFailed'
  // Workflow events
  | 'WorkflowStarted'
  | 'WorkflowProgress'
  | 'WorkflowCompleted'
  // Plugin events
  | 'PluginLoaded'
  | 'PluginError'
  // Health events
  | 'HealthCheckFailed'
  | 'HealthCheckRecovered'
  // Cache events
  | 'CacheEviction';

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

// ============================================================================
// Event Entry and Filter Types
// ============================================================================

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
export type EventHandler<T extends EventType> = (
  data: EventDataMap[T],
  entry: EventEntry<T>
) => void | Promise<void>;

/**
 * Unsubscribe function type
 */
export type Unsubscribe = () => void;

// ============================================================================
// Metrics Types
// ============================================================================

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

// ============================================================================
// TypedEventBus Interface
// ============================================================================

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

// ============================================================================
// Configuration
// ============================================================================

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

// ============================================================================
// TypedEventBus Implementation
// ============================================================================

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
export class TypedEventBus implements ITypedEventBus {
  private readonly emitter: EventEmitter;
  private readonly history: EventEntry[] = [];
  private readonly options: Required<TypedEventBusOptions>;
  private readonly metrics: Map<EventType, EventTypeMetrics> = new Map();
  private readonly handlers: Map<EventType, Set<EventHandler<EventType>>> = new Map();
  private readonly wildcardHandlers: Set<(entry: EventEntry) => void | Promise<void>> = new Set();
  private eventCounter = 0;
  private cleanupInterval?: NodeJS.Timeout;

  constructor(options: TypedEventBusOptions = {}) {
    this.options = {
      maxHistorySize: options.maxHistorySize ?? 1000,
      historyRetention: options.historyRetention ?? 60 * 60 * 1000, // 1 hour
      maxListeners: options.maxListeners ?? 100,
      debugEvents: options.debugEvents ?? false,
    };

    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(this.options.maxListeners);

    // Setup periodic history cleanup
    this.cleanupInterval = setInterval(
      () => this.pruneHistory(),
      Math.min(this.options.historyRetention / 10, 60000) // At most every minute
    );

    // Ensure cleanup interval doesn't prevent process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }

    logger.debug('TypedEventBus initialized', {
      maxHistorySize: this.options.maxHistorySize,
      historyRetention: this.options.historyRetention,
    });
  }

  /**
   * Emit an event with typed data
   */
  emit<T extends EventType>(event: T, data: EventDataMap[T], source = 'unknown'): void {
    this.emitEvent(event, source, data as unknown as Record<string, unknown>);
  }

  /**
   * Emit an event using (type, source, data) signature
   * This method supports both typed events and arbitrary string events
   * for backwards compatibility with container and other components.
   *
   * @param type - Event type (can be EventType or any string)
   * @param source - Source of the event
   * @param data - Event data payload
   */
  emitEvent(type: EventType | string, source: string, data: Record<string, unknown>): void {
    const startTime = Date.now();
    const id = this.generateEventId();

    // Create entry with type cast to handle both typed and untyped events
    const entry: EventEntry = {
      id,
      type: type as EventType,
      data: data as unknown as EventDataMap[EventType],
      source,
      timestamp: new Date(),
    };

    if (this.options.debugEvents) {
      logger.debug(`Event emitted: ${type}`, { source, id, data });
    }

    // Add to history (before handlers for consistency)
    this.addToHistory(entry);

    // Execute handlers with error isolation (only for known event types)
    let handlersExecuted = { executed: 0, errors: 0 };
    if (this.isKnownEventType(type)) {
      handlersExecuted = this.executeHandlers(
        type as EventType,
        data as unknown as EventDataMap[EventType],
        entry
      );
    }

    // Execute wildcard handlers for all events
    for (const handler of this.wildcardHandlers) {
      this.safeExecute(handler, entry, type as EventType);
    }

    // Calculate latency and update metrics
    const latency = Date.now() - startTime;
    (entry as { latency: number }).latency = latency;

    if (this.isKnownEventType(type)) {
      this.updateMetrics(type as EventType, latency, handlersExecuted.errors);
    }

    // Emit on the underlying EventEmitter for GraphQL subscriptions
    this.emitter.emit(type, entry);
    this.emitter.emit('*', entry);
  }

  /**
   * Check if an event type is a known typed event
   */
  private isKnownEventType(type: string): type is EventType {
    const knownTypes: Set<string> = new Set([
      'NodeCreated', 'NodeUpdated', 'NodeDeleted',
      'RelationCreated', 'RelationDeleted',
      'AgentSpawned', 'AgentCompleted', 'AgentFailed',
      'WorkflowStarted', 'WorkflowProgress', 'WorkflowCompleted',
      'PluginLoaded', 'PluginError',
      'HealthCheckFailed', 'HealthCheckRecovered',
      'CacheEviction',
    ]);
    return knownTypes.has(type);
  }

  /**
   * Subscribe to an event type
   */
  on<T extends EventType>(event: T, handler: EventHandler<T>): Unsubscribe {
    const handlers = this.getOrCreateHandlerSet(event);
    handlers.add(handler as EventHandler<EventType>);

    logger.debug(`Handler subscribed to ${event}`, {
      totalHandlers: handlers.size,
    });

    return () => this.off(event, handler);
  }

  /**
   * Subscribe to an event type for a single occurrence
   */
  once<T extends EventType>(event: T, handler: EventHandler<T>): Unsubscribe {
    const wrappedHandler: EventHandler<T> = (data, entry) => {
      this.off(event, wrappedHandler);
      return handler(data, entry);
    };

    return this.on(event, wrappedHandler);
  }

  /**
   * Unsubscribe a specific handler
   */
  off<T extends EventType>(event: T, handler: EventHandler<T>): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler<EventType>);

      logger.debug(`Handler unsubscribed from ${event}`, {
        remainingHandlers: handlers.size,
      });
    }
  }

  /**
   * Subscribe to all events (wildcard)
   */
  onAny(handler: (entry: EventEntry) => void | Promise<void>): Unsubscribe {
    this.wildcardHandlers.add(handler);

    logger.debug('Wildcard handler subscribed', {
      totalWildcardHandlers: this.wildcardHandlers.size,
    });

    return () => {
      this.wildcardHandlers.delete(handler);
      logger.debug('Wildcard handler unsubscribed', {
        remainingWildcardHandlers: this.wildcardHandlers.size,
      });
    };
  }

  /**
   * Get event history with optional filtering
   */
  getHistory(filter?: EventFilter): EventEntry[] {
    let result = [...this.history];

    if (!filter) {
      return result;
    }

    // Filter by types
    if (filter.types && filter.types.length > 0) {
      const typeSet = new Set(filter.types);
      result = result.filter((e) => typeSet.has(e.type));
    }

    // Filter by source
    if (filter.source) {
      result = result.filter((e) => e.source === filter.source);
    }

    // Filter by source pattern
    if (filter.sourcePattern) {
      result = result.filter((e) => filter.sourcePattern!.test(e.source));
    }

    // Filter by time range
    if (filter.since) {
      result = result.filter((e) => e.timestamp >= filter.since!);
    }
    if (filter.until) {
      result = result.filter((e) => e.timestamp < filter.until!);
    }

    // Apply offset
    if (filter.offset && filter.offset > 0) {
      result = result.slice(filter.offset);
    }

    // Apply limit
    if (filter.limit && filter.limit > 0) {
      result = result.slice(0, filter.limit);
    }

    return result;
  }

  /**
   * Get event bus metrics
   */
  getMetrics(): EventBusMetrics {
    let totalEvents = 0;
    let totalErrors = 0;
    const byType: Partial<Record<EventType, EventTypeMetrics>> = {};

    for (const [type, metrics] of this.metrics) {
      totalEvents += metrics.count;
      totalErrors += metrics.errorCount;
      byType[type] = { ...metrics };
    }

    let subscriberCount = this.wildcardHandlers.size;
    for (const handlers of this.handlers.values()) {
      subscriberCount += handlers.size;
    }

    return {
      totalEvents,
      totalErrors,
      byType,
      historySize: this.history.length,
      subscriberCount,
    };
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.history.length = 0;
    logger.debug('Event history cleared');
  }

  /**
   * Get the underlying EventEmitter for GraphQL subscriptions
   */
  getEmitter(): EventEmitter {
    return this.emitter;
  }

  /**
   * Stop the event bus and cleanup resources
   */
  dispose(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }

    this.handlers.clear();
    this.wildcardHandlers.clear();
    this.history.length = 0;
    this.metrics.clear();
    this.emitter.removeAllListeners();

    logger.debug('TypedEventBus disposed');
  }

  // ============================================================================
  // Private Methods
  // ============================================================================

  /**
   * Generate a unique event ID
   */
  private generateEventId(): string {
    this.eventCounter += 1;
    const timestamp = Date.now().toString(36);
    const counter = this.eventCounter.toString(36).padStart(4, '0');
    const random = Math.random().toString(36).substring(2, 6);
    return `evt_${timestamp}_${counter}_${random}`;
  }

  /**
   * Get or create handler set for an event type
   */
  private getOrCreateHandlerSet(event: EventType): Set<EventHandler<EventType>> {
    let handlers = this.handlers.get(event);
    if (!handlers) {
      handlers = new Set();
      this.handlers.set(event, handlers);
    }
    return handlers;
  }

  /**
   * Execute all handlers for an event with error isolation
   */
  private executeHandlers<T extends EventType>(
    event: T,
    data: EventDataMap[T],
    entry: EventEntry<T>
  ): { executed: number; errors: number } {
    const handlers = this.handlers.get(event);
    let executed = 0;
    let errors = 0;

    if (!handlers || handlers.size === 0) {
      return { executed, errors };
    }

    for (const handler of handlers) {
      executed += 1;
      const success = this.safeExecute(
        () => (handler as EventHandler<T>)(data, entry),
        entry,
        event
      );
      if (!success) {
        errors += 1;
      }
    }

    return { executed, errors };
  }

  /**
   * Safely execute a handler with error isolation
   */
  private safeExecute(
    handler: (() => void | Promise<void>) | ((entry: EventEntry) => void | Promise<void>),
    entry: EventEntry,
    eventType: EventType
  ): boolean {
    try {
      const result = typeof handler === 'function'
        ? (handler as (e: EventEntry) => void | Promise<void>)(entry)
        : undefined;

      // Handle async handlers
      if (result && typeof (result as Promise<void>).catch === 'function') {
        (result as Promise<void>).catch((error) => {
          this.handleHandlerError(error, eventType, entry.id);
        });
      }

      return true;
    } catch (error) {
      this.handleHandlerError(error, eventType, entry.id);
      return false;
    }
  }

  /**
   * Handle a handler error without affecting other handlers
   */
  private handleHandlerError(error: unknown, eventType: EventType, eventId: string): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Handler error for ${eventType}`, error instanceof Error ? error : undefined, {
      eventId,
      eventType,
      errorMessage,
    });

    // Emit error event on underlying emitter for external handling
    this.emitter.emit('handler:error', {
      eventType,
      eventId,
      error,
      timestamp: new Date(),
    });
  }

  /**
   * Add an event to history
   */
  private addToHistory(entry: EventEntry): void {
    this.history.push(entry);

    // Enforce size limit
    if (this.history.length > this.options.maxHistorySize) {
      const removeCount = this.history.length - this.options.maxHistorySize;
      this.history.splice(0, removeCount);
    }
  }

  /**
   * Prune old entries from history based on retention time
   */
  private pruneHistory(): void {
    const cutoff = new Date(Date.now() - this.options.historyRetention);
    const initialSize = this.history.length;

    // Find first entry that's not expired
    let firstValidIndex = 0;
    for (let i = 0; i < this.history.length; i++) {
      if (this.history[i].timestamp >= cutoff) {
        firstValidIndex = i;
        break;
      }
      firstValidIndex = this.history.length; // All expired
    }

    if (firstValidIndex > 0) {
      this.history.splice(0, firstValidIndex);
      logger.debug('Pruned old events from history', {
        removed: firstValidIndex,
        remaining: this.history.length,
      });
    }
  }

  /**
   * Update metrics for an event type
   */
  private updateMetrics(event: EventType, latency: number, errors: number): void {
    let metrics = this.metrics.get(event);

    if (!metrics) {
      metrics = {
        count: 0,
        errorCount: 0,
        avgLatency: 0,
        maxLatency: 0,
      };
      this.metrics.set(event, metrics);
    }

    // Update counts
    metrics.count += 1;
    metrics.errorCount += errors;
    metrics.lastEvent = new Date();

    // Update latency (rolling average)
    metrics.avgLatency = (metrics.avgLatency * (metrics.count - 1) + latency) / metrics.count;
    metrics.maxLatency = Math.max(metrics.maxLatency, latency);
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

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
export function createTypedEventBus(options?: TypedEventBusOptions): TypedEventBus {
  return new TypedEventBus(options);
}

// ============================================================================
// GraphQL Subscription Helpers
// ============================================================================

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
export function createSubscriptionIterator<T extends EventType>(
  eventBus: TypedEventBus,
  eventTypes: T[]
): AsyncIterableIterator<EventEntry<T>> {
  const emitter = eventBus.getEmitter();
  const queue: EventEntry<T>[] = [];
  let resolveNext: ((value: IteratorResult<EventEntry<T>>) => void) | null = null;
  let done = false;

  // Handler for events
  const handler = (entry: EventEntry) => {
    if (eventTypes.includes(entry.type as T)) {
      if (resolveNext) {
        resolveNext({ value: entry as EventEntry<T>, done: false });
        resolveNext = null;
      } else {
        queue.push(entry as EventEntry<T>);
      }
    }
  };

  // Subscribe to all specified event types
  for (const eventType of eventTypes) {
    emitter.on(eventType, handler);
  }

  const iterator: AsyncIterableIterator<EventEntry<T>> = {
    next(): Promise<IteratorResult<EventEntry<T>>> {
      if (done) {
        return Promise.resolve({ value: undefined as unknown as EventEntry<T>, done: true });
      }

      if (queue.length > 0) {
        return Promise.resolve({ value: queue.shift()!, done: false });
      }

      return new Promise((resolve) => {
        resolveNext = resolve;
      });
    },

    return(): Promise<IteratorResult<EventEntry<T>>> {
      done = true;
      // Cleanup listeners
      for (const eventType of eventTypes) {
        emitter.off(eventType, handler);
      }
      return Promise.resolve({ value: undefined as unknown as EventEntry<T>, done: true });
    },

    throw(error?: unknown): Promise<IteratorResult<EventEntry<T>>> {
      done = true;
      // Cleanup listeners
      for (const eventType of eventTypes) {
        emitter.off(eventType, handler);
      }
      return Promise.reject(error);
    },

    [Symbol.asyncIterator](): AsyncIterableIterator<EventEntry<T>> {
      return this;
    },
  };

  return iterator;
}

/**
 * Filter events by node types for GraphQL subscriptions
 *
 * @param nodeTypes - Node types to filter by
 * @returns Filter function for subscription
 */
export function createNodeTypeFilter(
  nodeTypes: string[]
): (entry: EventEntry<'NodeCreated' | 'NodeUpdated' | 'NodeDeleted'>) => boolean {
  const typeSet = new Set(nodeTypes);
  return (entry) => typeSet.has(entry.data.type);
}

/**
 * Filter events by source for GraphQL subscriptions
 *
 * @param sources - Sources to filter by
 * @returns Filter function for subscription
 */
export function createSourceFilter(sources: string[]): (entry: EventEntry) => boolean {
  const sourceSet = new Set(sources);
  return (entry) => sourceSet.has(entry.source);
}
