/**
 * GraphQL Subscription Resolvers
 *
 * Implements subscription resolvers for real-time updates in the
 * knowledge graph agent system. Uses AsyncIterator pattern for
 * streaming events to clients.
 *
 * @module graphql/resolvers/subscriptions
 */

import {
  getPubSub,
  Topics,
  type SubscriptionIterator,
  type TopicPayloadMap,
  type DeletedNode,
  type AgentStatusPayload,
  type WorkflowProgressPayload,
  type AnalysisProgressPayload,
  type HealthStatusPayload,
} from '../pubsub.js';
import type { KnowledgeNode, GraphEdge } from '../../core/types.js';
import type { WorkflowExecution, WorkflowEvent } from '../../workflows/types.js';
import type { SystemHealth } from '../../health/types.js';
import type { AgentResult } from '../../agents/types.js';

// ============================================================================
// GraphQL Context Type
// ============================================================================

/**
 * GraphQL resolver context with connection tracking.
 */
export interface SubscriptionContext {
  /** Unique connection ID for cleanup tracking */
  connectionId?: string;
  /** Active subscriptions for this connection */
  activeSubscriptions?: Set<string>;
  /** Cleanup function called on disconnect */
  onDisconnect?: (cleanup: () => void) => void;
}

// ============================================================================
// Subscription Result Types
// ============================================================================

/**
 * Result type for nodeDeleted subscription matching schema.
 */
export interface NodeDeletedResult {
  id: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Track subscription for cleanup on disconnect.
 *
 * @param ctx - Subscription context
 * @param iterator - The subscription iterator to track
 */
function trackSubscription<T>(
  ctx: SubscriptionContext,
  iterator: SubscriptionIterator<T>
): void {
  if (ctx.activeSubscriptions) {
    ctx.activeSubscriptions.add(iterator.subscriptionId);
  }

  if (ctx.onDisconnect) {
    ctx.onDisconnect(() => {
      iterator.cleanup();
      if (ctx.activeSubscriptions) {
        ctx.activeSubscriptions.delete(iterator.subscriptionId);
      }
    });
  }
}

/**
 * Create a subscription iterator with automatic cleanup tracking.
 *
 * @param topic - The topic to subscribe to
 * @param ctx - Subscription context
 * @param options - Optional filter and transform options
 */
function createSubscription<T extends keyof TopicPayloadMap>(
  topic: T,
  ctx: SubscriptionContext,
  options?: {
    filter?: (payload: TopicPayloadMap[T]) => boolean;
  }
): AsyncIterableIterator<TopicPayloadMap[T]> {
  const pubsub = getPubSub();
  const iterator = pubsub.asyncIterator(topic, options);
  trackSubscription(ctx, iterator);
  return iterator;
}

// ============================================================================
// Subscription Resolvers
// ============================================================================

/**
 * GraphQL Subscription resolvers.
 *
 * Each resolver returns an AsyncIterator that yields events from the
 * PubSub system. Subscriptions are automatically cleaned up when
 * the client disconnects.
 */
export const subscriptionResolvers = {
  Subscription: {
    // ========================================================================
    // Node Subscriptions
    // ========================================================================

    /**
     * Subscribe to node creation events.
     *
     * Emits KnowledgeNode objects when new nodes are created.
     */
    nodeCreated: {
      subscribe: (
        _parent: unknown,
        _args: unknown,
        ctx: SubscriptionContext
      ): AsyncIterableIterator<KnowledgeNode> => {
        return createSubscription(Topics.NODE_CREATED, ctx);
      },
      resolve: (payload: KnowledgeNode): KnowledgeNode => {
        return transformNodeForGraphQL(payload);
      },
    },

    /**
     * Subscribe to node update events.
     *
     * Emits KnowledgeNode objects when existing nodes are modified.
     */
    nodeUpdated: {
      subscribe: (
        _parent: unknown,
        _args: unknown,
        ctx: SubscriptionContext
      ): AsyncIterableIterator<KnowledgeNode> => {
        return createSubscription(Topics.NODE_UPDATED, ctx);
      },
      resolve: (payload: KnowledgeNode): KnowledgeNode => {
        return transformNodeForGraphQL(payload);
      },
    },

    /**
     * Subscribe to node deletion events.
     *
     * Emits the ID of deleted nodes.
     */
    nodeDeleted: {
      subscribe: (
        _parent: unknown,
        _args: unknown,
        ctx: SubscriptionContext
      ): AsyncIterableIterator<DeletedNode> => {
        return createSubscription(Topics.NODE_DELETED, ctx);
      },
      resolve: (payload: DeletedNode): string => {
        // Schema expects just the ID
        return payload.id;
      },
    },

    // ========================================================================
    // Edge/Relation Subscriptions
    // ========================================================================

    /**
     * Subscribe to edge creation events.
     *
     * Emits GraphEdge objects when new edges are created.
     */
    edgeCreated: {
      subscribe: (
        _parent: unknown,
        _args: unknown,
        ctx: SubscriptionContext
      ): AsyncIterableIterator<GraphEdge> => {
        return createSubscription(Topics.EDGE_CREATED, ctx);
      },
      resolve: (payload: GraphEdge): GraphEdge => {
        return transformEdgeForGraphQL(payload);
      },
    },

    /**
     * Subscribe to edge deletion events.
     *
     * Emits the ID of deleted edges.
     */
    edgeDeleted: {
      subscribe: (
        _parent: unknown,
        _args: unknown,
        ctx: SubscriptionContext
      ): AsyncIterableIterator<string> => {
        return createSubscription(Topics.EDGE_DELETED, ctx);
      },
      resolve: (payload: string): string => {
        return payload;
      },
    },

    // ========================================================================
    // Workflow Subscriptions
    // ========================================================================

    /**
     * Subscribe to workflow status changes for a specific execution.
     *
     * @param args.id - Workflow execution ID to monitor
     */
    workflowStatus: {
      subscribe: (
        _parent: unknown,
        args: { id: string },
        ctx: SubscriptionContext
      ): AsyncIterableIterator<WorkflowExecution> => {
        const pubsub = getPubSub();
        const iterator = pubsub.asyncIterator(Topics.WORKFLOW_STATUS, {
          filter: (payload) => payload.id === args.id,
        });
        trackSubscription(ctx, iterator);
        return iterator;
      },
      resolve: (payload: WorkflowExecution): WorkflowExecution => {
        return transformWorkflowExecutionForGraphQL(payload);
      },
    },

    /**
     * Subscribe to all workflow events, optionally filtered by workflow ID.
     *
     * @param args.workflowId - Optional workflow ID to filter events
     */
    workflowEvents: {
      subscribe: (
        _parent: unknown,
        args: { workflowId?: string },
        ctx: SubscriptionContext
      ): AsyncIterableIterator<WorkflowEvent> => {
        const pubsub = getPubSub();
        const iterator = pubsub.asyncIterator(Topics.WORKFLOW_EVENTS, {
          filter: args.workflowId
            ? (payload) => payload.workflowId === args.workflowId
            : undefined,
        });
        trackSubscription(ctx, iterator);
        return iterator;
      },
      resolve: (payload: WorkflowEvent): WorkflowEvent => {
        return transformWorkflowEventForGraphQL(payload);
      },
    },

    // ========================================================================
    // Agent Subscriptions
    // ========================================================================

    /**
     * Subscribe to agent status changes for a specific agent.
     *
     * @param args.id - Agent ID to monitor
     */
    agentStatus: {
      subscribe: (
        _parent: unknown,
        args: { id: string },
        ctx: SubscriptionContext
      ): AsyncIterableIterator<AgentStatusPayload> => {
        const pubsub = getPubSub();
        const iterator = pubsub.asyncIterator(Topics.AGENT_STATUS_CHANGED, {
          filter: (payload) => payload.id === args.id,
        });
        trackSubscription(ctx, iterator);
        return iterator;
      },
      resolve: (payload: AgentStatusPayload): unknown => {
        return transformAgentForGraphQL(payload);
      },
    },

    /**
     * Subscribe to task completion events.
     *
     * @param args.agentId - Optional agent ID to filter events
     */
    taskCompleted: {
      subscribe: (
        _parent: unknown,
        args: { agentId?: string },
        ctx: SubscriptionContext
      ): AsyncIterableIterator<unknown> => {
        const pubsub = getPubSub();
        const iterator = pubsub.asyncIterator(Topics.TASK_COMPLETED, {
          filter: args.agentId
            ? (payload: unknown) => {
                const result = payload as { agentId?: string };
                return result.agentId === args.agentId;
              }
            : undefined,
        });
        trackSubscription(ctx, iterator);
        return iterator;
      },
      resolve: (payload: unknown): AgentResult => {
        return transformAgentResultForGraphQL(payload as AgentResult);
      },
    },

    // ========================================================================
    // Reasoning Subscriptions
    // ========================================================================

    /**
     * Subscribe to reasoning chain updates for a specific chain.
     *
     * @param args.id - Reasoning chain ID to monitor
     */
    reasoningChainUpdated: {
      subscribe: (
        _parent: unknown,
        args: { id: string },
        ctx: SubscriptionContext
      ): AsyncIterableIterator<unknown> => {
        const pubsub = getPubSub();
        const iterator = pubsub.asyncIterator(Topics.REASONING_CHAIN_UPDATED, {
          filter: (payload: unknown) => {
            const chain = payload as { id?: string };
            return chain.id === args.id;
          },
        });
        trackSubscription(ctx, iterator);
        return iterator;
      },
      resolve: (payload: unknown): unknown => {
        return payload;
      },
    },

    /**
     * Subscribe to new decision events.
     */
    decisionMade: {
      subscribe: (
        _parent: unknown,
        _args: unknown,
        ctx: SubscriptionContext
      ): AsyncIterableIterator<unknown> => {
        return createSubscription(Topics.DECISION_MADE, ctx);
      },
      resolve: (payload: unknown): unknown => {
        return payload;
      },
    },

    // ========================================================================
    // Graph Sync Subscriptions
    // ========================================================================

    /**
     * Subscribe to graph sync completion events.
     */
    graphSynced: {
      subscribe: (
        _parent: unknown,
        _args: unknown,
        ctx: SubscriptionContext
      ): AsyncIterableIterator<unknown> => {
        return createSubscription(Topics.GRAPH_SYNCED, ctx);
      },
      resolve: (payload: unknown): unknown => {
        return payload;
      },
    },

    // ========================================================================
    // Health Subscriptions
    // ========================================================================

    /**
     * Subscribe to system health status changes.
     */
    healthChanged: {
      subscribe: (
        _parent: unknown,
        _args: unknown,
        ctx: SubscriptionContext
      ): AsyncIterableIterator<SystemHealth> => {
        return createSubscription(Topics.HEALTH_CHANGED, ctx);
      },
      resolve: (payload: SystemHealth): unknown => {
        return transformSystemHealthForGraphQL(payload);
      },
    },
  },
};

// ============================================================================
// Extended Subscription Resolvers (Custom for this implementation)
// ============================================================================

/**
 * Additional subscription resolvers beyond the base schema.
 * These can be used for extended functionality.
 */
export const extendedSubscriptionResolvers = {
  Subscription: {
    /**
     * Subscribe to relation/edge creation events.
     * Maps to the 'relationCreated' subscription type in the schema.
     */
    relationCreated: {
      subscribe: (
        _parent: unknown,
        _args: unknown,
        ctx: SubscriptionContext
      ): AsyncIterableIterator<GraphEdge> => {
        return createSubscription(Topics.RELATION_CREATED, ctx);
      },
      resolve: (payload: GraphEdge): GraphEdge => {
        return transformEdgeForGraphQL(payload);
      },
    },

    /**
     * Subscribe to workflow progress updates for a specific workflow.
     *
     * @param args.id - Workflow execution ID to monitor
     */
    workflowProgress: {
      subscribe: (
        _parent: unknown,
        args: { id: string },
        ctx: SubscriptionContext
      ): AsyncIterableIterator<WorkflowProgressPayload> => {
        const pubsub = getPubSub();
        const iterator = pubsub.asyncIterator(Topics.WORKFLOW_PROGRESS, {
          filter: (payload) => payload.id === args.id,
        });
        trackSubscription(ctx, iterator);
        return iterator;
      },
      resolve: (payload: WorkflowProgressPayload): unknown => {
        return {
          id: payload.id,
          workflowId: payload.workflowId,
          status: payload.status.toUpperCase(),
          progress: payload.progress,
          currentStep: payload.currentStep,
          completedSteps: payload.completedSteps,
          totalSteps: payload.totalSteps,
          startedAt: payload.startedAt?.toISOString(),
          estimatedCompletion: payload.estimatedCompletion?.toISOString(),
          error: payload.error,
        };
      },
    },

    /**
     * Subscribe to agent status change events (all agents).
     */
    agentStatusChanged: {
      subscribe: (
        _parent: unknown,
        _args: unknown,
        ctx: SubscriptionContext
      ): AsyncIterableIterator<AgentStatusPayload> => {
        return createSubscription(Topics.AGENT_STATUS_CHANGED, ctx);
      },
      resolve: (payload: AgentStatusPayload): unknown => {
        return transformAgentForGraphQL(payload);
      },
    },

    /**
     * Subscribe to health status updates.
     */
    healthUpdated: {
      subscribe: (
        _parent: unknown,
        _args: unknown,
        ctx: SubscriptionContext
      ): AsyncIterableIterator<HealthStatusPayload> => {
        return createSubscription(Topics.HEALTH_UPDATED, ctx);
      },
      resolve: (payload: HealthStatusPayload): unknown => {
        return {
          status: payload.status.toUpperCase(),
          components: payload.components,
          uptime: payload.uptime,
          requestCount: payload.requestCount,
          toolCount: payload.toolCount,
        };
      },
    },

    /**
     * Subscribe to analysis progress updates for a specific task.
     *
     * @param args.taskId - Analysis task ID to monitor
     */
    analysisProgress: {
      subscribe: (
        _parent: unknown,
        args: { taskId: string },
        ctx: SubscriptionContext
      ): AsyncIterableIterator<AnalysisProgressPayload> => {
        const pubsub = getPubSub();
        const iterator = pubsub.asyncIterator(Topics.ANALYSIS_PROGRESS, {
          filter: (payload) => payload.taskId === args.taskId,
        });
        trackSubscription(ctx, iterator);
        return iterator;
      },
      resolve: (payload: AnalysisProgressPayload): unknown => {
        return {
          taskId: payload.taskId,
          status: payload.status.toUpperCase(),
          progress: payload.progress,
          currentPhase: payload.currentPhase,
          message: payload.message,
          result: payload.result,
          error: payload.error,
          startedAt: payload.startedAt.toISOString(),
          completedAt: payload.completedAt?.toISOString(),
        };
      },
    },
  },
};

// ============================================================================
// Transform Functions
// ============================================================================

/**
 * Transform a KnowledgeNode for GraphQL response.
 */
function transformNodeForGraphQL(node: KnowledgeNode): KnowledgeNode {
  return {
    ...node,
    // Ensure dates are serializable
    lastModified: node.lastModified instanceof Date
      ? node.lastModified
      : new Date(node.lastModified),
    // Transform frontmatter if needed
    frontmatter: {
      ...node.frontmatter,
      created: node.frontmatter.created
        ? new Date(node.frontmatter.created).toISOString() as unknown as string
        : undefined,
      updated: node.frontmatter.updated
        ? new Date(node.frontmatter.updated).toISOString() as unknown as string
        : undefined,
    },
  };
}

/**
 * Transform a GraphEdge for GraphQL response.
 */
function transformEdgeForGraphQL(edge: GraphEdge): GraphEdge {
  return {
    ...edge,
    // Ensure type is uppercase for GraphQL enum
    type: edge.type as GraphEdge['type'],
  };
}

/**
 * Transform WorkflowExecution for GraphQL response.
 */
function transformWorkflowExecutionForGraphQL(
  execution: WorkflowExecution
): WorkflowExecution {
  return {
    ...execution,
    // Ensure status is uppercase for GraphQL enum
    status: execution.status,
    // Transform step map to array for GraphQL
    steps: execution.steps instanceof Map
      ? execution.steps
      : new Map(Object.entries(execution.steps || {})),
  };
}

/**
 * Transform WorkflowEvent for GraphQL response.
 */
function transformWorkflowEventForGraphQL(event: WorkflowEvent): WorkflowEvent {
  return {
    ...event,
    // Ensure type matches GraphQL enum format
    type: event.type.toUpperCase().replace(/:/g, '_') as WorkflowEvent['type'],
    timestamp: event.timestamp instanceof Date
      ? event.timestamp
      : new Date(event.timestamp),
  };
}

/**
 * Transform AgentStatusPayload for GraphQL response.
 */
function transformAgentForGraphQL(agent: AgentStatusPayload): unknown {
  return {
    id: agent.id,
    name: agent.name,
    type: agent.type.toUpperCase(),
    description: agent.config.description,
    status: agent.status.toUpperCase(),
    capabilities: agent.config.capabilities || [],
    currentTask: agent.currentTask ? { id: agent.currentTask } : null,
    queuedTaskCount: agent.queuedTaskCount,
    completedTaskCount: agent.completedTaskCount,
    errorCount: agent.errorCount,
    lastActivity: agent.lastActivity.toISOString(),
    health: {
      healthy: agent.health.healthy,
      status: agent.health.status.toUpperCase(),
      lastHeartbeat: agent.health.lastHeartbeat.toISOString(),
      error: agent.health.error,
      memoryUsage: agent.health.memoryUsage,
    },
    config: {
      maxConcurrentTasks: agent.config.maxConcurrentTasks || 1,
      taskTimeout: agent.config.taskTimeout || 60000,
      retry: agent.config.retry,
      claudeFlowEnabled: agent.config.claudeFlow?.enabled ?? true,
      metadata: agent.config.metadata,
    },
  };
}

/**
 * Transform AgentResult for GraphQL response.
 */
function transformAgentResultForGraphQL(result: AgentResult): AgentResult {
  return {
    ...result,
    metrics: result.metrics ? {
      ...result.metrics,
      startTime: result.metrics.startTime instanceof Date
        ? result.metrics.startTime
        : new Date(result.metrics.startTime),
      endTime: result.metrics.endTime instanceof Date
        ? result.metrics.endTime
        : new Date(result.metrics.endTime),
    } : undefined,
  };
}

/**
 * Transform SystemHealth for GraphQL response.
 */
function transformSystemHealthForGraphQL(health: SystemHealth): unknown {
  return {
    status: health.status.toUpperCase(),
    components: {
      database: health.components.some(c => c.name === 'database' && c.status === 'healthy'),
      cache: health.components.some(c => c.name === 'cache' && c.status === 'healthy'),
      agents: health.components.some(c => c.name === 'agents' && c.status === 'healthy'),
      vectorStore: health.components.some(c => c.name === 'vectorStore' && c.status === 'healthy'),
    },
    uptime: health.uptime,
    requestCount: health.performance?.requestsPerMinute || 0,
    toolCount: 0, // This would need to be tracked separately
  };
}

// ============================================================================
// Merged Resolvers Export
// ============================================================================

/**
 * Merged subscription resolvers combining base and extended resolvers.
 */
export const mergedSubscriptionResolvers = {
  Subscription: {
    ...subscriptionResolvers.Subscription,
    ...extendedSubscriptionResolvers.Subscription,
  },
};

// ============================================================================
// Subscription Cleanup Utility
// ============================================================================

/**
 * Create a subscription cleanup handler for WebSocket connections.
 *
 * @param connectionId - Unique connection identifier
 * @returns Object with cleanup tracking methods
 */
export function createSubscriptionCleanup(connectionId: string): {
  context: SubscriptionContext;
  cleanup: () => void;
} {
  const activeSubscriptions = new Set<string>();
  const cleanupCallbacks: Array<() => void> = [];

  const context: SubscriptionContext = {
    connectionId,
    activeSubscriptions,
    onDisconnect: (callback: () => void) => {
      cleanupCallbacks.push(callback);
    },
  };

  const cleanup = () => {
    for (const callback of cleanupCallbacks) {
      try {
        callback();
      } catch (error) {
        console.error('Error during subscription cleanup:', error);
      }
    }
    cleanupCallbacks.length = 0;
    activeSubscriptions.clear();
  };

  return { context, cleanup };
}

// ============================================================================
// Default Export
// ============================================================================

export default mergedSubscriptionResolvers;
