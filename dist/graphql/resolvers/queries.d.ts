/**
 * GraphQL Query Resolvers
 *
 * Implements all query resolvers for the knowledge-graph-agent GraphQL API.
 * Provides cursor-based pagination, filtering, and proper error handling.
 *
 * @module graphql/resolvers/queries
 */
import type { KnowledgeGraphDatabase } from '../../core/database.js';
import type { KnowledgeGraphManager } from '../../core/graph.js';
import type { NodeType, NodeStatus } from '../../core/types.js';
import type { AgentRegistry } from '../../agents/registry.js';
import type { WorkflowRegistry } from '../../workflows/registry.js';
import type { DecisionTracker } from '../../reasoning/tracker.js';
import type { HealthMonitor } from '../../health/monitor.js';
import type { AdvancedCache } from '../../caching/lru-cache.js';
import type { CacheStats } from '../../caching/types.js';
import type { HybridSearch, EmbeddingService, EnhancedVectorStore } from '../../vector/index.js';
/**
 * Resolver context containing service dependencies
 */
export interface ResolverContext {
    db: KnowledgeGraphDatabase;
    graphManager?: KnowledgeGraphManager;
    agentRegistry?: AgentRegistry;
    workflowRegistry?: WorkflowRegistry;
    reasoningTracker?: DecisionTracker;
    healthMonitor?: HealthMonitor;
    cache?: AdvancedCache<unknown>;
    startTime: Date;
    requestCount: number;
    /** Hybrid search service for semantic + FTS search */
    hybridSearch?: HybridSearch;
    /** Embedding service for generating vectors */
    embeddingService?: EmbeddingService;
    /** Vector store for similarity search */
    vectorStore?: EnhancedVectorStore;
}
/**
 * Node filter input from GraphQL
 */
export interface NodeFilter {
    type?: NodeType;
    types?: NodeType[];
    status?: NodeStatus;
    statuses?: NodeStatus[];
    tag?: string;
    tags?: string[];
    anyTags?: string[];
    category?: string;
    minWordCount?: number;
    maxWordCount?: number;
    minConnections?: number;
    createdAfter?: Date;
    createdBefore?: Date;
    updatedAfter?: Date;
    updatedBefore?: Date;
    orphansOnly?: boolean;
    excludeOrphans?: boolean;
    titleContains?: string;
    contentContains?: string;
}
/**
 * Pagination input from GraphQL
 */
export interface PaginationInput {
    first?: number;
    after?: string;
    last?: number;
    before?: string;
    offset?: number;
    limit?: number;
}
/**
 * Search options from GraphQL
 */
export interface SearchOptions {
    mode?: 'ALL' | 'ANY' | 'FUZZY' | 'PHRASE';
    type?: NodeType;
    types?: NodeType[];
    status?: NodeStatus;
    tags?: string[];
    limit?: number;
    includeSnippets?: boolean;
    snippetLength?: number;
    highlight?: boolean;
    facets?: boolean;
    minScore?: number;
}
/**
 * Relation filter for edge queries
 */
interface RelationFilter {
    source?: string;
    target?: string;
    type?: 'LINK' | 'REFERENCE' | 'PARENT' | 'RELATED';
}
/**
 * Audit filter for audit log queries
 */
interface AuditFilter {
    userId?: string;
    action?: string;
    entityType?: string;
    entityId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
}
/**
 * Vector search input
 */
interface VectorSearchInput {
    query: string;
    limit?: number;
    minSimilarity?: number;
    nodeTypes?: NodeType[];
    includeMetadata?: boolean;
}
/**
 * Trajectory filter
 */
export interface TrajectoryFilter {
    agentId?: string;
    workflowId?: string;
    success?: boolean;
    startAfter?: Date;
    startBefore?: Date;
    limit?: number;
}
/**
 * GraphQL error codes for the knowledge graph API
 */
export declare const ErrorCodes: {
    readonly NOT_FOUND: "NOT_FOUND";
    readonly INVALID_INPUT: "INVALID_INPUT";
    readonly DATABASE_ERROR: "DATABASE_ERROR";
    readonly PAGINATION_ERROR: "PAGINATION_ERROR";
    readonly SEARCH_ERROR: "SEARCH_ERROR";
    readonly SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE";
    readonly INTERNAL_ERROR: "INTERNAL_ERROR";
};
/**
 * Node query resolver - Get a single node by ID
 */
export declare const nodeResolver: (parent: unknown, args: {
    id: string;
}, context: ResolverContext) => Promise<Record<string, unknown> | null>;
/**
 * Nodes query resolver - Get multiple nodes with filtering and pagination
 */
export declare const nodesResolver: (parent: unknown, args: {
    filter?: NodeFilter;
    pagination?: PaginationInput;
}, context: ResolverContext) => Promise<{
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
/**
 * Search nodes resolver - Full-text search across nodes
 */
export declare const searchNodesResolver: (parent: unknown, args: {
    query: string;
    options?: SearchOptions;
}, context: ResolverContext) => Promise<Record<string, unknown>>;
/**
 * Graph stats resolver - Get graph statistics
 */
export declare const graphResolver: (parent: unknown, args: Record<string, never>, context: ResolverContext) => Promise<Record<string, unknown>>;
/**
 * Tags resolver - Get all tags with optional filtering
 */
export declare const tagsResolver: (parent: unknown, args: {
    contains?: string;
    limit?: number;
}, context: ResolverContext) => Promise<{
    tag: string;
    count: number;
}[]>;
/**
 * Nodes by tag resolver - Get nodes with a specific tag
 */
export declare const nodesByTagResolver: (parent: unknown, args: {
    tag: string;
    pagination?: PaginationInput;
}, context: ResolverContext) => Promise<{
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
/**
 * Relations resolver - Get edges/relations with filtering
 */
export declare const relationsResolver: (parent: unknown, args: {
    filter?: RelationFilter;
}, context: ResolverContext) => Promise<Record<string, unknown>[]>;
/**
 * Health resolver - Get system health status
 */
export declare const healthResolver: (parent: unknown, args: Record<string, never>, context: ResolverContext) => Promise<Record<string, unknown>>;
/**
 * Cache stats resolver - Get cache statistics
 */
export declare const cacheStatsResolver: (parent: unknown, args: Record<string, never>, context: ResolverContext) => Promise<CacheStats | null>;
/**
 * Agents resolver - Get all registered agents
 */
export declare const agentsResolver: (parent: unknown, args: {
    type?: string;
    status?: string;
}, context: ResolverContext) => Promise<Record<string, unknown>[]>;
/**
 * Workflows resolver - Get all registered workflows
 */
export declare const workflowsResolver: (parent: unknown, args: {
    tags?: string[];
    namePattern?: string;
    limit?: number;
    offset?: number;
}, context: ResolverContext) => Promise<Record<string, unknown>[]>;
/**
 * Audit log resolver - Get audit log entries
 */
export declare const auditLogResolver: (parent: unknown, args: {
    filter?: AuditFilter;
}, context: ResolverContext) => Promise<Record<string, unknown>[]>;
/**
 * Vector search resolver - Semantic similarity search
 *
 * Uses HybridSearch when available to combine vector similarity with
 * full-text search for better results. Falls back to text search only
 * if embedding services are not configured.
 */
export declare const vectorSearchResolver: (parent: unknown, args: {
    query: VectorSearchInput;
}, context: ResolverContext) => Promise<Record<string, unknown>>;
/**
 * Trajectories resolver - Get agent trajectories
 */
export declare const trajectoriesResolver: (parent: unknown, args: {
    filter?: TrajectoryFilter;
}, context: ResolverContext) => Promise<Record<string, unknown>[]>;
/**
 * Query resolvers map for GraphQL server
 */
export declare const queryResolvers: {
    Query: {
        node: (parent: unknown, args: {
            id: string;
        }, context: ResolverContext) => Promise<Record<string, unknown> | null>;
        nodes: (parent: unknown, args: {
            ids: string[];
        }, context: ResolverContext) => Promise<(Record<string, unknown> | null)[]>;
        nodeByPath: (parent: unknown, args: {
            path: string;
        }, context: ResolverContext) => Promise<Record<string, unknown> | null>;
        queryNodes: (parent: unknown, args: {
            filter?: NodeFilter;
            pagination?: PaginationInput;
        }, context: ResolverContext) => Promise<{
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
            options?: SearchOptions;
        }, context: ResolverContext) => Promise<Record<string, unknown>>;
        graphStats: (parent: unknown, args: Record<string, never>, context: ResolverContext) => Promise<Record<string, unknown>>;
        graphMetadata: (parent: unknown, args: unknown, context: ResolverContext) => Promise<{
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
        }, context: ResolverContext) => Promise<null>;
        edges: (parent: unknown, args: {
            source?: string;
            target?: string;
            type?: string;
            pagination?: PaginationInput;
        }, context: ResolverContext) => Promise<{
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
        }, context: ResolverContext) => Promise<{
            tag: string;
            count: number;
        }[]>;
        nodesByTag: (parent: unknown, args: {
            tag: string;
            pagination?: PaginationInput;
        }, context: ResolverContext) => Promise<{
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
        }, context: ResolverContext) => Promise<{
            id: string | undefined;
            name: string;
            type: string;
            status: string;
            capabilities: string[];
        } | null>;
        agents: (parent: unknown, args: {
            type?: string;
            status?: string;
        }, context: ResolverContext) => Promise<Record<string, unknown>[]>;
        workflow: (parent: unknown, args: {
            id: string;
        }, context: ResolverContext) => Promise<import("../../index.js").WorkflowDefinition<unknown, unknown> | null | undefined>;
        workflows: (parent: unknown, args: {
            tags?: string[];
            namePattern?: string;
            limit?: number;
            offset?: number;
        }, context: ResolverContext) => Promise<Record<string, unknown>[]>;
        health: (parent: unknown, args: Record<string, never>, context: ResolverContext) => Promise<Record<string, unknown>>;
        version: () => Promise<{
            version: string;
            buildTime: null;
            gitCommit: null;
            nodeVersion: string;
            schemaVersion: string;
        }>;
        decision: (parent: unknown, args: {
            id: string;
        }, context: ResolverContext) => Promise<null>;
        reasoningChain: (parent: unknown, args: {
            id: string;
        }, context: ResolverContext) => Promise<null>;
        reasoningStats: (parent: unknown, args: unknown, context: ResolverContext) => Promise<import("../../reasoning/types.js").ReasoningStats | {
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
            filter?: TrajectoryFilter;
        }, context: ResolverContext) => Promise<Record<string, unknown>[]>;
        similarNodes: (parent: unknown, args: {
            input: {
                nodeId?: string;
                text?: string;
                limit?: number;
                minSimilarity?: number;
                type?: string;
            };
        }, context: ResolverContext) => Promise<never[]>;
        path: (parent: unknown, args: {
            from: string;
            to: string;
            maxDepth?: number;
        }, context: ResolverContext) => Promise<(Record<string, unknown> | null)[] | null>;
        allPaths: () => Promise<never[]>;
        subgraph: (parent: unknown, args: {
            nodeId: string;
            depth?: number;
            includeIncoming?: boolean;
            includeOutgoing?: boolean;
        }, context: ResolverContext) => Promise<{
            center: Record<string, unknown>;
            nodes: Record<string, unknown>[];
            edges: Record<string, unknown>[];
            depth: number;
        }>;
    };
    KnowledgeNode: {
        relatedByTags: (parent: Record<string, unknown>, args: {
            limit?: number;
        }, context: ResolverContext) => Promise<(Record<string, unknown> | null)[]>;
        relatedByLinks: (parent: Record<string, unknown>, args: {
            limit?: number;
        }, context: ResolverContext) => Promise<Record<string, unknown>[]>;
        pathTo: (parent: Record<string, unknown>, args: {
            targetId: string;
            maxDepth?: number;
        }, context: ResolverContext) => Promise<(Record<string, unknown> | null)[] | null>;
        targetNode: (parent: Record<string, unknown>, args: unknown, context: ResolverContext) => Promise<Record<string, unknown> | null>;
    };
    NodeLink: {
        targetNode: (parent: Record<string, unknown>, args: unknown, context: ResolverContext) => Promise<Record<string, unknown> | null>;
    };
    GraphEdge: {
        sourceNode: (parent: Record<string, unknown>, args: unknown, context: ResolverContext) => Promise<Record<string, unknown> | null>;
        targetNode: (parent: Record<string, unknown>, args: unknown, context: ResolverContext) => Promise<Record<string, unknown> | null>;
    };
};
export default queryResolvers;
//# sourceMappingURL=queries.d.ts.map