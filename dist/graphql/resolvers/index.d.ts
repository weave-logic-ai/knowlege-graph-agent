/**
 * GraphQL Resolvers Index
 *
 * Exports all GraphQL resolvers for the knowledge-graph-agent API.
 *
 * @module graphql/resolvers
 */
export { queryResolvers, nodeResolver, nodesResolver, searchNodesResolver, graphResolver, tagsResolver, nodesByTagResolver, relationsResolver, healthResolver, cacheStatsResolver, agentsResolver, workflowsResolver, auditLogResolver, vectorSearchResolver, trajectoriesResolver, type ResolverContext, type NodeFilter, type PaginationInput, type SearchOptions, type TrajectoryFilter, ErrorCodes, } from './queries.js';
export { mutationResolvers, type MutationContext, } from './mutations.js';
export { subscriptionResolvers, extendedSubscriptionResolvers, mergedSubscriptionResolvers, createSubscriptionCleanup, type SubscriptionContext, } from './subscriptions.js';
export { PubSub, getPubSub, resetPubSub, Topics, type TopicName, type TopicPayloadMap, type DeletedNode, type AgentStatusPayload, type WorkflowProgressPayload, type AnalysisProgressPayload, type HealthStatusPayload, type SubscriptionIterator, publishNodeCreated, publishNodeUpdated, publishNodeDeleted, publishRelationCreated, publishAgentStatusChanged, publishWorkflowProgress, publishHealthUpdated, publishAnalysisProgress, wireEventEmitter, } from '../pubsub.js';
import { mutationResolvers } from './mutations.js';
import { mergedSubscriptionResolvers } from './subscriptions.js';
/**
 * All GraphQL resolvers combined.
 *
 * Import this object and merge with your schema to enable all resolvers.
 *
 * @example
 * ```typescript
 * import { makeExecutableSchema } from '@graphql-tools/schema';
 * import { resolvers } from './resolvers/index.js';
 * import { typeDefs } from './schema.js';
 *
 * const schema = makeExecutableSchema({
 *   typeDefs,
 *   resolvers,
 * });
 * ```
 */
export declare const resolvers: {
    Subscription: {
        relationCreated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("../../index.js").GraphEdge>;
            resolve: (payload: import("../../index.js").GraphEdge) => import("../../index.js").GraphEdge;
        };
        workflowProgress: {
            subscribe: (_parent: unknown, args: {
                id: string;
            }, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("./index.js").WorkflowProgressPayload>;
            resolve: (payload: import("./index.js").WorkflowProgressPayload) => unknown;
        };
        agentStatusChanged: {
            subscribe: (_parent: unknown, _args: unknown, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("./index.js").AgentStatusPayload>;
            resolve: (payload: import("./index.js").AgentStatusPayload) => unknown;
        };
        healthUpdated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("./index.js").HealthStatusPayload>;
            resolve: (payload: import("./index.js").HealthStatusPayload) => unknown;
        };
        analysisProgress: {
            subscribe: (_parent: unknown, args: {
                taskId: string;
            }, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("./index.js").AnalysisProgressPayload>;
            resolve: (payload: import("./index.js").AnalysisProgressPayload) => unknown;
        };
        nodeCreated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("../../index.js").KnowledgeNode>;
            resolve: (payload: import("../../index.js").KnowledgeNode) => import("../../index.js").KnowledgeNode;
        };
        nodeUpdated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("../../index.js").KnowledgeNode>;
            resolve: (payload: import("../../index.js").KnowledgeNode) => import("../../index.js").KnowledgeNode;
        };
        nodeDeleted: {
            subscribe: (_parent: unknown, _args: unknown, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("./index.js").DeletedNode>;
            resolve: (payload: import("./index.js").DeletedNode) => string;
        };
        edgeCreated: {
            subscribe: (_parent: unknown, _args: unknown, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("../../index.js").GraphEdge>;
            resolve: (payload: import("../../index.js").GraphEdge) => import("../../index.js").GraphEdge;
        };
        edgeDeleted: {
            subscribe: (_parent: unknown, _args: unknown, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<string>;
            resolve: (payload: string) => string;
        };
        workflowStatus: {
            subscribe: (_parent: unknown, args: {
                id: string;
            }, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("../../index.js").WorkflowExecution>;
            resolve: (payload: import("../../index.js").WorkflowExecution) => import("../../index.js").WorkflowExecution;
        };
        workflowEvents: {
            subscribe: (_parent: unknown, args: {
                workflowId?: string;
            }, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("../../index.js").WorkflowEvent>;
            resolve: (payload: import("../../index.js").WorkflowEvent) => import("../../index.js").WorkflowEvent;
        };
        agentStatus: {
            subscribe: (_parent: unknown, args: {
                id: string;
            }, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("./index.js").AgentStatusPayload>;
            resolve: (payload: import("./index.js").AgentStatusPayload) => unknown;
        };
        taskCompleted: {
            subscribe: (_parent: unknown, args: {
                agentId?: string;
            }, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<unknown>;
            resolve: (payload: unknown) => import("../../index.js").AgentSystemResult;
        };
        reasoningChainUpdated: {
            subscribe: (_parent: unknown, args: {
                id: string;
            }, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<unknown>;
            resolve: (payload: unknown) => unknown;
        };
        decisionMade: {
            subscribe: (_parent: unknown, _args: unknown, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<unknown>;
            resolve: (payload: unknown) => unknown;
        };
        graphSynced: {
            subscribe: (_parent: unknown, _args: unknown, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<unknown>;
            resolve: (payload: unknown) => unknown;
        };
        healthChanged: {
            subscribe: (_parent: unknown, _args: unknown, ctx: import("./subscriptions.js").SubscriptionContext) => AsyncIterableIterator<import("../../health/types.js").SystemHealth>;
            resolve: (payload: import("../../health/types.js").SystemHealth) => unknown;
        };
    };
    Mutation: {
        createNode: (_parent: unknown, args: {
            input: unknown;
        }, context: import("./mutations.js").MutationContext) => Promise<unknown>;
        updateNode: (_parent: unknown, args: {
            id: string;
            input: unknown;
        }, context: import("./mutations.js").MutationContext) => Promise<unknown>;
        deleteNode: (_parent: unknown, args: {
            id: string;
        }, context: import("./mutations.js").MutationContext) => Promise<{
            success: boolean;
            id: string;
            error: string | null;
        }>;
        createRelation: (_parent: unknown, args: {
            input: unknown;
        }, context: import("./mutations.js").MutationContext) => Promise<{
            id: string;
            source: string;
            target: string;
            type: "LINK" | "REFERENCE" | "PARENT" | "RELATED";
            weight: number;
            context: string | undefined;
            sourceNode: unknown;
            targetNode: unknown;
        }>;
        deleteRelation: (_parent: unknown, args: {
            id: string;
        }, context: import("./mutations.js").MutationContext) => Promise<{
            success: boolean;
            id: string;
            error: string | null;
        }>;
        addTag: (_parent: unknown, args: {
            nodeId: string;
            tag: string;
        }, context: import("./mutations.js").MutationContext) => Promise<unknown>;
        removeTag: (_parent: unknown, args: {
            nodeId: string;
            tag: string;
        }, context: import("./mutations.js").MutationContext) => Promise<unknown>;
        spawnAgent: (_parent: unknown, args: {
            input: unknown;
        }, context: import("./mutations.js").MutationContext) => Promise<{
            id: string;
            name: string;
            type: "RESEARCHER" | "CODER" | "TESTER" | "ANALYST" | "ARCHITECT" | "REVIEWER" | "COORDINATOR" | "OPTIMIZER" | "DOCUMENTER" | "CUSTOM";
            description: string | undefined;
            status: string;
            capabilities: string[];
            currentTask: null;
            queuedTaskCount: number;
            completedTaskCount: number;
            errorCount: number;
            lastActivity: string;
            health: {
                healthy: boolean;
                status: string;
                lastHeartbeat: string;
                error: null;
                memoryUsage: number;
            };
            config: {
                maxConcurrentTasks: number;
                taskTimeout: number;
                retry: {
                    maxRetries: number;
                    backoffMs: number;
                    backoffMultiplier?: number | undefined;
                } | null;
                claudeFlowEnabled: boolean;
                metadata: Record<string, unknown> | null;
            };
            metrics: null;
        }>;
        startWorkflow: (_parent: unknown, args: {
            input: unknown;
        }, context: import("./mutations.js").MutationContext) => Promise<{
            id: `${string}-${string}-${string}-${string}-${string}`;
            workflowId: string;
            workflow: {
                id: string;
                name: string;
                description: string | undefined;
                version: string;
                steps: {
                    id: string;
                    name: string;
                    description: string | undefined;
                    dependencies: string[] | undefined;
                    timeout: number | undefined;
                    retries: number | undefined;
                    parallel: boolean;
                    optional: boolean;
                    metadata: Record<string, unknown> | undefined;
                }[];
                timeout: number | undefined;
                enableRollback: boolean;
                tags: string[];
                metadata: Record<string, unknown> | undefined;
            };
            status: string;
            input: Record<string, unknown> | undefined;
            output: null;
            state: {};
            steps: never[];
            error: null;
            errorStack: null;
            createdAt: string;
            startedAt: string;
            completedAt: null;
            durationMs: number;
            progress: number;
            currentStep: string;
            rolledBack: boolean;
        }>;
        cancelWorkflow: (_parent: unknown, args: {
            id: string;
        }, context: import("./mutations.js").MutationContext) => Promise<{
            id: string;
            workflowId: string;
            workflow: null;
            status: string;
            input: unknown;
            output: null;
            state: Record<string, unknown>;
            steps: {
                stepId: string;
                status: string;
                result: unknown;
                error: string | undefined;
                startedAt: string | undefined;
                completedAt: string | undefined;
                durationMs: number | undefined;
                attempts: number;
                skipped: boolean;
                skipReason: string | undefined;
            }[];
            error: string;
            errorStack: null;
            createdAt: string;
            startedAt: string | null;
            completedAt: string;
            durationMs: number;
            progress: number;
            currentStep: null;
            rolledBack: boolean;
        }>;
        clearCache: (_parent: unknown, _args: unknown, context: import("./mutations.js").MutationContext) => Promise<{
            success: boolean;
            entriesCleared: number;
            message: string;
        }>;
        createCheckpoint: (_parent: unknown, args: {
            input: unknown;
        }, context: import("./mutations.js").MutationContext) => Promise<{
            id: `${string}-${string}-${string}-${string}-${string}`;
            name: string;
            description: string | undefined;
            createdAt: string;
            nodeCount: number;
            edgeCount: number;
            size: number;
            metadata: Record<string, unknown> | undefined;
        }>;
        vectorUpsert: (_parent: unknown, args: {
            input: unknown;
        }, context: import("./mutations.js").MutationContext) => Promise<{
            success: boolean;
            id: string;
            dimensions: number;
            isUpdate: boolean;
            namespace: string | null;
        }>;
        recordTrajectory: (_parent: unknown, args: {
            input: unknown;
        }, context: import("./mutations.js").MutationContext) => Promise<{
            id: `${string}-${string}-${string}-${string}-${string}`;
            agentId: string;
            workflowId: string | null;
            steps: {
                action: string;
                state: Record<string, unknown>;
                outcome: string;
                duration: number;
                timestamp: string;
                metadata: Record<string, unknown> | undefined;
            }[];
            startedAt: string;
            completedAt: string;
            success: boolean;
            totalDuration: number;
            metadata: Record<string, unknown> | null;
        }>;
    };
    Query: {
        node: (parent: unknown, args: {
            id: string;
        }, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown> | null>;
        nodes: (parent: unknown, args: {
            ids: string[];
        }, context: import("./queries.js").ResolverContext) => Promise<(Record<string, unknown> | null)[]>;
        nodeByPath: (parent: unknown, args: {
            path: string;
        }, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown> | null>;
        queryNodes: (parent: unknown, args: {
            filter?: import("./queries.js").NodeFilter;
            pagination?: import("./queries.js").PaginationInput;
        }, context: import("./queries.js").ResolverContext) => Promise<{
            edges: {
                cursor: string;
                node: {
                    id: string;
                };
            }[];
            pageInfo: {
                startCursor: string | null;
                endCursor: string | null;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
                totalCount: number;
            };
            totalCount: number;
        }>;
        search: (parent: unknown, args: {
            query: string;
            options?: import("./queries.js").SearchOptions;
        }, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown>>;
        graphStats: (parent: unknown, args: Record<string, never>, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown>>;
        graphMetadata: (parent: unknown, args: unknown, context: import("./queries.js").ResolverContext) => Promise<{
            name: string;
            version: string;
            created: string;
            updated: string;
            nodeCount: number;
            edgeCount: number;
            rootPath: string;
        }>;
        edge: (parent: unknown, args: {
            id: string;
        }, context: import("./queries.js").ResolverContext) => Promise<null>;
        edges: (parent: unknown, args: {
            source?: string;
            target?: string;
            type?: string;
            pagination?: import("./queries.js").PaginationInput;
        }, context: import("./queries.js").ResolverContext) => Promise<{
            edges: {
                cursor: string;
                node: {
                    id: string;
                };
            }[];
            pageInfo: {
                startCursor: string | null;
                endCursor: string | null;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
                totalCount: number;
            };
            totalCount: number;
        }>;
        tags: (parent: unknown, args: {
            contains?: string;
            limit?: number;
        }, context: import("./queries.js").ResolverContext) => Promise<{
            tag: string;
            count: number;
        }[]>;
        nodesByTag: (parent: unknown, args: {
            tag: string;
            pagination?: import("./queries.js").PaginationInput;
        }, context: import("./queries.js").ResolverContext) => Promise<{
            edges: {
                cursor: string;
                node: {
                    id: string;
                };
            }[];
            pageInfo: {
                startCursor: string | null;
                endCursor: string | null;
                hasNextPage: boolean;
                hasPreviousPage: boolean;
                totalCount: number;
            };
            totalCount: number;
        }>;
        agent: (parent: unknown, args: {
            id: string;
        }, context: import("./queries.js").ResolverContext) => Promise<{
            id: string | undefined;
            name: string;
            type: string;
            status: string;
            capabilities: string[];
        } | null>;
        agents: (parent: unknown, args: {
            type?: string;
            status?: string;
        }, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown>[]>;
        workflow: (parent: unknown, args: {
            id: string;
        }, context: import("./queries.js").ResolverContext) => Promise<import("../../index.js").WorkflowDefinition<unknown, unknown> | null | undefined>;
        workflows: (parent: unknown, args: {
            tags?: string[];
            namePattern?: string;
            limit?: number;
            offset?: number;
        }, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown>[]>;
        health: (parent: unknown, args: Record<string, never>, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown>>;
        version: () => Promise<{
            version: string;
            buildTime: null;
            gitCommit: null;
            nodeVersion: string;
            schemaVersion: string;
        }>;
        decision: (parent: unknown, args: {
            id: string;
        }, context: import("./queries.js").ResolverContext) => Promise<null>;
        reasoningChain: (parent: unknown, args: {
            id: string;
        }, context: import("./queries.js").ResolverContext) => Promise<null>;
        reasoningStats: (parent: unknown, args: unknown, context: import("./queries.js").ResolverContext) => Promise<import("../../reasoning/types.js").ReasoningStats | {
            totalDecisions: number;
            byType: never[];
            byConfidence: never[];
            successRate: number;
            averageDuration: number;
            totalChains: number;
            chainsByStatus: never[];
        }>;
        patterns: () => Promise<never[]>;
        trajectories: (parent: unknown, args: {
            filter?: import("./queries.js").TrajectoryFilter;
        }, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown>[]>;
        similarNodes: (parent: unknown, args: {
            input: {
                nodeId?: string;
                text?: string;
                limit?: number;
                minSimilarity?: number;
                type?: string;
            };
        }, context: import("./queries.js").ResolverContext) => Promise<never[]>;
        path: (parent: unknown, args: {
            from: string;
            to: string;
            maxDepth?: number;
        }, context: import("./queries.js").ResolverContext) => Promise<(Record<string, unknown> | null)[] | null>;
        allPaths: () => Promise<never[]>;
        subgraph: (parent: unknown, args: {
            nodeId: string;
            depth?: number;
            includeIncoming?: boolean;
            includeOutgoing?: boolean;
        }, context: import("./queries.js").ResolverContext) => Promise<{
            center: Record<string, unknown>;
            nodes: Record<string, unknown>[];
            edges: Record<string, unknown>[];
            depth: number;
        }>;
    };
    KnowledgeNode: {
        relatedByTags: (parent: Record<string, unknown>, args: {
            limit?: number;
        }, context: import("./queries.js").ResolverContext) => Promise<(Record<string, unknown> | null)[]>;
        relatedByLinks: (parent: Record<string, unknown>, args: {
            limit?: number;
        }, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown>[]>;
        pathTo: (parent: Record<string, unknown>, args: {
            targetId: string;
            maxDepth?: number;
        }, context: import("./queries.js").ResolverContext) => Promise<(Record<string, unknown> | null)[] | null>;
        targetNode: (parent: Record<string, unknown>, args: unknown, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown> | null>;
    };
    NodeLink: {
        targetNode: (parent: Record<string, unknown>, args: unknown, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown> | null>;
    };
    GraphEdge: {
        sourceNode: (parent: Record<string, unknown>, args: unknown, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown> | null>;
        targetNode: (parent: Record<string, unknown>, args: unknown, context: import("./queries.js").ResolverContext) => Promise<Record<string, unknown> | null>;
    };
};
/**
 * Subscription-only resolvers export.
 *
 * Use this if you only need subscription functionality.
 */
export { mergedSubscriptionResolvers as subscriptions };
/**
 * Mutation-only resolvers export.
 *
 * Use this if you only need mutation functionality.
 */
export { mutationResolvers as mutations };
export default resolvers;
//# sourceMappingURL=index.d.ts.map