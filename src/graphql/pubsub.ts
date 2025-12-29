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

// ============================================================================
// Topic Constants
// ============================================================================

/**
 * Subscription topic constants for type-safe event publishing/subscribing.
 */
export const Topics = {
  // Node events
  NODE_CREATED: 'NODE_CREATED',
  NODE_UPDATED: 'NODE_UPDATED',
  NODE_DELETED: 'NODE_DELETED',

  // Edge/Relation events
  RELATION_CREATED: 'RELATION_CREATED',
  EDGE_CREATED: 'EDGE_CREATED',
  EDGE_DELETED: 'EDGE_DELETED',

  // Agent events
  AGENT_STATUS_CHANGED: 'AGENT_STATUS_CHANGED',
  TASK_COMPLETED: 'TASK_COMPLETED',

  // Workflow events
  WORKFLOW_PROGRESS: 'WORKFLOW_PROGRESS',
  WORKFLOW_STATUS: 'WORKFLOW_STATUS',
  WORKFLOW_EVENTS: 'WORKFLOW_EVENTS',

  // Health events
  HEALTH_UPDATED: 'HEALTH_UPDATED',
  HEALTH_CHANGED: 'HEALTH_CHANGED',

  // Analysis events
  ANALYSIS_PROGRESS: 'ANALYSIS_PROGRESS',

  // Reasoning events
  REASONING_CHAIN_UPDATED: 'REASONING_CHAIN_UPDATED',
  DECISION_MADE: 'DECISION_MADE',

  // Graph events
  GRAPH_SYNCED: 'GRAPH_SYNCED',
} as const;

export type TopicName = (typeof Topics)[keyof typeof Topics];

// ============================================================================
// Event Payload Types
// ============================================================================

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

// ============================================================================
// Subscription Payload Map
// ============================================================================

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

// ============================================================================
// Subscription Iterator Type
// ============================================================================

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

// ============================================================================
// PubSub Class
// ============================================================================

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
export class PubSub {
  private emitter: EventEmitter;
  private subscriptions: Map<string, { topic: string; listener: (...args: unknown[]) => void }>;
  private subscriptionCounter: number;

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(100); // Allow many concurrent subscriptions
    this.subscriptions = new Map();
    this.subscriptionCounter = 0;
  }

  /**
   * Generate a unique subscription ID.
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${++this.subscriptionCounter}`;
  }

  /**
   * Publish an event to a topic.
   *
   * @param topic - The topic to publish to
   * @param payload - The event payload
   */
  publish<T extends TopicName>(topic: T, payload: TopicPayloadMap[T]): void {
    this.emitter.emit(topic, payload);
  }

  /**
   * Subscribe to a topic and receive an async iterator.
   *
   * @param topic - The topic to subscribe to
   * @param options - Optional subscription options including filter
   * @returns AsyncIterator that yields events
   */
  asyncIterator<T extends TopicName>(
    topic: T,
    options?: {
      filter?: (payload: TopicPayloadMap[T]) => boolean;
    }
  ): SubscriptionIterator<TopicPayloadMap[T]> {
    const subscriptionId = this.generateSubscriptionId();
    const pullQueue: Array<(value: IteratorResult<TopicPayloadMap[T]>) => void> = [];
    const pushQueue: TopicPayloadMap[T][] = [];
    let listening = true;

    const pushValue = (payload: TopicPayloadMap[T]) => {
      // Apply filter if provided
      if (options?.filter && !options.filter(payload)) {
        return;
      }

      if (pullQueue.length > 0) {
        const resolve = pullQueue.shift()!;
        resolve({ value: payload, done: false });
      } else {
        pushQueue.push(payload);
      }
    };

    const pullValue = (): Promise<IteratorResult<TopicPayloadMap[T]>> => {
      return new Promise((resolve) => {
        if (pushQueue.length > 0) {
          const value = pushQueue.shift()!;
          resolve({ value, done: false });
        } else if (!listening) {
          resolve({ value: undefined as unknown as TopicPayloadMap[T], done: true });
        } else {
          pullQueue.push(resolve);
        }
      });
    };

    const listener = (payload: TopicPayloadMap[T]) => {
      pushValue(payload);
    };

    this.emitter.on(topic, listener);
    this.subscriptions.set(subscriptionId, { topic, listener: listener as (...args: unknown[]) => void });

    const cleanup = () => {
      if (listening) {
        listening = false;
        this.emitter.off(topic, listener);
        this.subscriptions.delete(subscriptionId);

        // Resolve any remaining pull requests
        while (pullQueue.length > 0) {
          const resolve = pullQueue.shift()!;
          resolve({ value: undefined as unknown as TopicPayloadMap[T], done: true });
        }
      }
    };

    const iterator: SubscriptionIterator<TopicPayloadMap[T]> = {
      subscriptionId,
      cleanup,

      next(): Promise<IteratorResult<TopicPayloadMap[T]>> {
        return pullValue();
      },

      return(): Promise<IteratorResult<TopicPayloadMap[T]>> {
        cleanup();
        return Promise.resolve({ value: undefined as unknown as TopicPayloadMap[T], done: true });
      },

      throw(error?: Error): Promise<IteratorResult<TopicPayloadMap[T]>> {
        cleanup();
        return Promise.reject(error);
      },

      [Symbol.asyncIterator](): SubscriptionIterator<TopicPayloadMap[T]> {
        return this;
      },
    };

    return iterator;
  }

  /**
   * Subscribe to multiple topics with a unified iterator.
   *
   * @param topics - Array of topics to subscribe to
   * @returns AsyncIterator that yields events from all topics
   */
  asyncIteratorMulti<T extends TopicName>(
    topics: T[]
  ): SubscriptionIterator<TopicPayloadMap[T]> {
    const subscriptionId = this.generateSubscriptionId();
    const pullQueue: Array<(value: IteratorResult<TopicPayloadMap[T]>) => void> = [];
    const pushQueue: TopicPayloadMap[T][] = [];
    let listening = true;

    const pushValue = (payload: TopicPayloadMap[T]) => {
      if (pullQueue.length > 0) {
        const resolve = pullQueue.shift()!;
        resolve({ value: payload, done: false });
      } else {
        pushQueue.push(payload);
      }
    };

    const pullValue = (): Promise<IteratorResult<TopicPayloadMap[T]>> => {
      return new Promise((resolve) => {
        if (pushQueue.length > 0) {
          const value = pushQueue.shift()!;
          resolve({ value, done: false });
        } else if (!listening) {
          resolve({ value: undefined as unknown as TopicPayloadMap[T], done: true });
        } else {
          pullQueue.push(resolve);
        }
      });
    };

    const listeners: Array<{ topic: string; listener: (...args: unknown[]) => void }> = [];

    for (const topic of topics) {
      const listener = (payload: TopicPayloadMap[T]) => {
        pushValue(payload);
      };
      this.emitter.on(topic, listener);
      listeners.push({ topic, listener: listener as (...args: unknown[]) => void });
    }

    this.subscriptions.set(subscriptionId, listeners[0]); // Store first for tracking

    const cleanup = () => {
      if (listening) {
        listening = false;
        for (const { topic, listener } of listeners) {
          this.emitter.off(topic, listener);
        }
        this.subscriptions.delete(subscriptionId);

        while (pullQueue.length > 0) {
          const resolve = pullQueue.shift()!;
          resolve({ value: undefined as unknown as TopicPayloadMap[T], done: true });
        }
      }
    };

    const iterator: SubscriptionIterator<TopicPayloadMap[T]> = {
      subscriptionId,
      cleanup,

      next(): Promise<IteratorResult<TopicPayloadMap[T]>> {
        return pullValue();
      },

      return(): Promise<IteratorResult<TopicPayloadMap[T]>> {
        cleanup();
        return Promise.resolve({ value: undefined as unknown as TopicPayloadMap[T], done: true });
      },

      throw(error?: Error): Promise<IteratorResult<TopicPayloadMap[T]>> {
        cleanup();
        return Promise.reject(error);
      },

      [Symbol.asyncIterator](): SubscriptionIterator<TopicPayloadMap[T]> {
        return this;
      },
    };

    return iterator;
  }

  /**
   * Unsubscribe by subscription ID.
   *
   * @param subscriptionId - The subscription ID to unsubscribe
   */
  unsubscribe(subscriptionId: string): void {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      this.emitter.off(subscription.topic, subscription.listener);
      this.subscriptions.delete(subscriptionId);
    }
  }

  /**
   * Get the number of active subscriptions.
   */
  get subscriptionCount(): number {
    return this.subscriptions.size;
  }

  /**
   * Get active subscription IDs.
   */
  getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Clean up all subscriptions.
   */
  cleanup(): void {
    for (const [subscriptionId, { topic, listener }] of this.subscriptions) {
      this.emitter.off(topic, listener);
    }
    this.subscriptions.clear();
    this.emitter.removeAllListeners();
  }

  /**
   * Get the underlying EventEmitter for direct integration.
   */
  getEmitter(): EventEmitter {
    return this.emitter;
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

/**
 * Global PubSub instance for the application.
 */
let globalPubSub: PubSub | null = null;

/**
 * Get or create the global PubSub instance.
 *
 * @returns The global PubSub instance
 */
export function getPubSub(): PubSub {
  if (!globalPubSub) {
    globalPubSub = new PubSub();
  }
  return globalPubSub;
}

/**
 * Reset the global PubSub instance (mainly for testing).
 */
export function resetPubSub(): void {
  if (globalPubSub) {
    globalPubSub.cleanup();
    globalPubSub = null;
  }
}

// ============================================================================
// Type-Safe Publish/Subscribe Helpers
// ============================================================================

/**
 * Type-safe helper to publish a node created event.
 */
export function publishNodeCreated(node: KnowledgeNode): void {
  getPubSub().publish(Topics.NODE_CREATED, node);
}

/**
 * Type-safe helper to publish a node updated event.
 */
export function publishNodeUpdated(node: KnowledgeNode): void {
  getPubSub().publish(Topics.NODE_UPDATED, node);
}

/**
 * Type-safe helper to publish a node deleted event.
 */
export function publishNodeDeleted(deletedNode: DeletedNode): void {
  getPubSub().publish(Topics.NODE_DELETED, deletedNode);
}

/**
 * Type-safe helper to publish a relation/edge created event.
 */
export function publishRelationCreated(edge: GraphEdge): void {
  getPubSub().publish(Topics.RELATION_CREATED, edge);
}

/**
 * Type-safe helper to publish an agent status change event.
 */
export function publishAgentStatusChanged(status: AgentStatusPayload): void {
  getPubSub().publish(Topics.AGENT_STATUS_CHANGED, status);
}

/**
 * Type-safe helper to publish a workflow progress event.
 */
export function publishWorkflowProgress(progress: WorkflowProgressPayload): void {
  getPubSub().publish(Topics.WORKFLOW_PROGRESS, progress);
}

/**
 * Type-safe helper to publish a health updated event.
 */
export function publishHealthUpdated(health: HealthStatusPayload): void {
  getPubSub().publish(Topics.HEALTH_UPDATED, health);
}

/**
 * Type-safe helper to publish an analysis progress event.
 */
export function publishAnalysisProgress(progress: AnalysisProgressPayload): void {
  getPubSub().publish(Topics.ANALYSIS_PROGRESS, progress);
}

// ============================================================================
// EventEmitter Integration
// ============================================================================

/**
 * Wire an EventEmitter to the PubSub system.
 *
 * This allows existing EventEmitter-based services to automatically
 * publish events to GraphQL subscriptions.
 *
 * @param emitter - The EventEmitter to wire
 * @param mappings - Mapping of EventEmitter events to PubSub topics
 */
export function wireEventEmitter<T extends Record<string, TopicName>>(
  emitter: EventEmitter,
  mappings: T
): () => void {
  const pubsub = getPubSub();
  const handlers: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];

  for (const [event, topic] of Object.entries(mappings)) {
    const handler = (...args: unknown[]) => {
      // Assume first argument is the payload
      const payload = args[0];
      if (payload !== undefined) {
        pubsub.publish(topic as TopicName, payload as TopicPayloadMap[typeof topic]);
      }
    };
    emitter.on(event, handler);
    handlers.push({ event, handler });
  }

  // Return cleanup function
  return () => {
    for (const { event, handler } of handlers) {
      emitter.off(event, handler);
    }
  };
}

// Default export for convenience
export default PubSub;
