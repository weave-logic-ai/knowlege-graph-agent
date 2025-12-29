/**
 * GraphQL Subscription Resolvers
 *
 * Implements subscription resolvers for real-time updates in the
 * knowledge graph agent system. Uses AsyncIterator pattern for
 * streaming events to clients.
 *
 * @module graphql/resolvers/subscriptions
 */
import { type DeletedNode, type AgentStatusPayload, type WorkflowProgressPayload, type AnalysisProgressPayload, type HealthStatusPayload } from '../pubsub.js';
import type { KnowledgeNode, GraphEdge } from '../../core/types.js';
import type { WorkflowExecution, WorkflowEvent } from '../../workflows/types.js';
import type { SystemHealth } from '../../health/types.js';
import type { AgentResult } from '../../agents/types.js';
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
/**
 * Result type for nodeDeleted subscription matching schema.
 */
export interface NodeDeletedResult {
    id: string;
}
/**
 * GraphQL Subscription resolvers.
 *
 * Each resolver returns an AsyncIterator that yields events from the
 * PubSub system. Subscriptions are automatically cleaned up when
 * the client disconnects.
 */
export declare const subscriptionResolvers: {
    Subscription: {
        /**
         * Subscribe to node creation events.
         *
         * Emits KnowledgeNode objects when new nodes are created.
         */
        nodeCreated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<KnowledgeNode>;
            resolve: (payload: KnowledgeNode) => KnowledgeNode;
        };
        /**
         * Subscribe to node update events.
         *
         * Emits KnowledgeNode objects when existing nodes are modified.
         */
        nodeUpdated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<KnowledgeNode>;
            resolve: (payload: KnowledgeNode) => KnowledgeNode;
        };
        /**
         * Subscribe to node deletion events.
         *
         * Emits the ID of deleted nodes.
         */
        nodeDeleted: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<DeletedNode>;
            resolve: (payload: DeletedNode) => string;
        };
        /**
         * Subscribe to edge creation events.
         *
         * Emits GraphEdge objects when new edges are created.
         */
        edgeCreated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<GraphEdge>;
            resolve: (payload: GraphEdge) => GraphEdge;
        };
        /**
         * Subscribe to edge deletion events.
         *
         * Emits the ID of deleted edges.
         */
        edgeDeleted: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<string>;
            resolve: (payload: string) => string;
        };
        /**
         * Subscribe to workflow status changes for a specific execution.
         *
         * @param args.id - Workflow execution ID to monitor
         */
        workflowStatus: {
            subscribe: (_parent: unknown, args: {
                id: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<WorkflowExecution>;
            resolve: (payload: WorkflowExecution) => WorkflowExecution;
        };
        /**
         * Subscribe to all workflow events, optionally filtered by workflow ID.
         *
         * @param args.workflowId - Optional workflow ID to filter events
         */
        workflowEvents: {
            subscribe: (_parent: unknown, args: {
                workflowId?: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<WorkflowEvent>;
            resolve: (payload: WorkflowEvent) => WorkflowEvent;
        };
        /**
         * Subscribe to agent status changes for a specific agent.
         *
         * @param args.id - Agent ID to monitor
         */
        agentStatus: {
            subscribe: (_parent: unknown, args: {
                id: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<AgentStatusPayload>;
            resolve: (payload: AgentStatusPayload) => unknown;
        };
        /**
         * Subscribe to task completion events.
         *
         * @param args.agentId - Optional agent ID to filter events
         */
        taskCompleted: {
            subscribe: (_parent: unknown, args: {
                agentId?: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<unknown>;
            resolve: (payload: unknown) => AgentResult;
        };
        /**
         * Subscribe to reasoning chain updates for a specific chain.
         *
         * @param args.id - Reasoning chain ID to monitor
         */
        reasoningChainUpdated: {
            subscribe: (_parent: unknown, args: {
                id: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<unknown>;
            resolve: (payload: unknown) => unknown;
        };
        /**
         * Subscribe to new decision events.
         */
        decisionMade: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<unknown>;
            resolve: (payload: unknown) => unknown;
        };
        /**
         * Subscribe to graph sync completion events.
         */
        graphSynced: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<unknown>;
            resolve: (payload: unknown) => unknown;
        };
        /**
         * Subscribe to system health status changes.
         */
        healthChanged: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<SystemHealth>;
            resolve: (payload: SystemHealth) => unknown;
        };
    };
};
/**
 * Additional subscription resolvers beyond the base schema.
 * These can be used for extended functionality.
 */
export declare const extendedSubscriptionResolvers: {
    Subscription: {
        /**
         * Subscribe to relation/edge creation events.
         * Maps to the 'relationCreated' subscription type in the schema.
         */
        relationCreated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<GraphEdge>;
            resolve: (payload: GraphEdge) => GraphEdge;
        };
        /**
         * Subscribe to workflow progress updates for a specific workflow.
         *
         * @param args.id - Workflow execution ID to monitor
         */
        workflowProgress: {
            subscribe: (_parent: unknown, args: {
                id: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<WorkflowProgressPayload>;
            resolve: (payload: WorkflowProgressPayload) => unknown;
        };
        /**
         * Subscribe to agent status change events (all agents).
         */
        agentStatusChanged: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<AgentStatusPayload>;
            resolve: (payload: AgentStatusPayload) => unknown;
        };
        /**
         * Subscribe to health status updates.
         */
        healthUpdated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<HealthStatusPayload>;
            resolve: (payload: HealthStatusPayload) => unknown;
        };
        /**
         * Subscribe to analysis progress updates for a specific task.
         *
         * @param args.taskId - Analysis task ID to monitor
         */
        analysisProgress: {
            subscribe: (_parent: unknown, args: {
                taskId: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<AnalysisProgressPayload>;
            resolve: (payload: AnalysisProgressPayload) => unknown;
        };
    };
};
/**
 * Merged subscription resolvers combining base and extended resolvers.
 */
export declare const mergedSubscriptionResolvers: {
    Subscription: {
        /**
         * Subscribe to relation/edge creation events.
         * Maps to the 'relationCreated' subscription type in the schema.
         */
        relationCreated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<GraphEdge>;
            resolve: (payload: GraphEdge) => GraphEdge;
        };
        /**
         * Subscribe to workflow progress updates for a specific workflow.
         *
         * @param args.id - Workflow execution ID to monitor
         */
        workflowProgress: {
            subscribe: (_parent: unknown, args: {
                id: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<WorkflowProgressPayload>;
            resolve: (payload: WorkflowProgressPayload) => unknown;
        };
        /**
         * Subscribe to agent status change events (all agents).
         */
        agentStatusChanged: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<AgentStatusPayload>;
            resolve: (payload: AgentStatusPayload) => unknown;
        };
        /**
         * Subscribe to health status updates.
         */
        healthUpdated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<HealthStatusPayload>;
            resolve: (payload: HealthStatusPayload) => unknown;
        };
        /**
         * Subscribe to analysis progress updates for a specific task.
         *
         * @param args.taskId - Analysis task ID to monitor
         */
        analysisProgress: {
            subscribe: (_parent: unknown, args: {
                taskId: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<AnalysisProgressPayload>;
            resolve: (payload: AnalysisProgressPayload) => unknown;
        };
        /**
         * Subscribe to node creation events.
         *
         * Emits KnowledgeNode objects when new nodes are created.
         */
        nodeCreated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<KnowledgeNode>;
            resolve: (payload: KnowledgeNode) => KnowledgeNode;
        };
        /**
         * Subscribe to node update events.
         *
         * Emits KnowledgeNode objects when existing nodes are modified.
         */
        nodeUpdated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<KnowledgeNode>;
            resolve: (payload: KnowledgeNode) => KnowledgeNode;
        };
        /**
         * Subscribe to node deletion events.
         *
         * Emits the ID of deleted nodes.
         */
        nodeDeleted: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<DeletedNode>;
            resolve: (payload: DeletedNode) => string;
        };
        /**
         * Subscribe to edge creation events.
         *
         * Emits GraphEdge objects when new edges are created.
         */
        edgeCreated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<GraphEdge>;
            resolve: (payload: GraphEdge) => GraphEdge;
        };
        /**
         * Subscribe to edge deletion events.
         *
         * Emits the ID of deleted edges.
         */
        edgeDeleted: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<string>;
            resolve: (payload: string) => string;
        };
        /**
         * Subscribe to workflow status changes for a specific execution.
         *
         * @param args.id - Workflow execution ID to monitor
         */
        workflowStatus: {
            subscribe: (_parent: unknown, args: {
                id: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<WorkflowExecution>;
            resolve: (payload: WorkflowExecution) => WorkflowExecution;
        };
        /**
         * Subscribe to all workflow events, optionally filtered by workflow ID.
         *
         * @param args.workflowId - Optional workflow ID to filter events
         */
        workflowEvents: {
            subscribe: (_parent: unknown, args: {
                workflowId?: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<WorkflowEvent>;
            resolve: (payload: WorkflowEvent) => WorkflowEvent;
        };
        /**
         * Subscribe to agent status changes for a specific agent.
         *
         * @param args.id - Agent ID to monitor
         */
        agentStatus: {
            subscribe: (_parent: unknown, args: {
                id: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<AgentStatusPayload>;
            resolve: (payload: AgentStatusPayload) => unknown;
        };
        /**
         * Subscribe to task completion events.
         *
         * @param args.agentId - Optional agent ID to filter events
         */
        taskCompleted: {
            subscribe: (_parent: unknown, args: {
                agentId?: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<unknown>;
            resolve: (payload: unknown) => AgentResult;
        };
        /**
         * Subscribe to reasoning chain updates for a specific chain.
         *
         * @param args.id - Reasoning chain ID to monitor
         */
        reasoningChainUpdated: {
            subscribe: (_parent: unknown, args: {
                id: string;
            }, ctx: SubscriptionContext) => AsyncIterableIterator<unknown>;
            resolve: (payload: unknown) => unknown;
        };
        /**
         * Subscribe to new decision events.
         */
        decisionMade: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<unknown>;
            resolve: (payload: unknown) => unknown;
        };
        /**
         * Subscribe to graph sync completion events.
         */
        graphSynced: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<unknown>;
            resolve: (payload: unknown) => unknown;
        };
        /**
         * Subscribe to system health status changes.
         */
        healthChanged: {
            subscribe: (_parent: unknown, _args: unknown, ctx: SubscriptionContext) => AsyncIterableIterator<SystemHealth>;
            resolve: (payload: SystemHealth) => unknown;
        };
    };
};
/**
 * Create a subscription cleanup handler for WebSocket connections.
 *
 * @param connectionId - Unique connection identifier
 * @returns Object with cleanup tracking methods
 */
export declare function createSubscriptionCleanup(connectionId: string): {
    context: SubscriptionContext;
    cleanup: () => void;
};
export default mergedSubscriptionResolvers;
//# sourceMappingURL=subscriptions.d.ts.map