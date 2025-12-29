/**
 * GraphQL Query Resolvers
 *
 * Implements all query resolvers for the knowledge-graph-agent GraphQL API.
 * Provides cursor-based pagination, filtering, and proper error handling.
 *
 * @module graphql/resolvers/queries
 */

import { GraphQLError } from 'graphql';
import type { KnowledgeGraphDatabase } from '../../core/database.js';
import type { KnowledgeGraphManager } from '../../core/graph.js';
import type {
  KnowledgeNode,
  GraphEdge,
  GraphStats,
  NodeType,
  NodeStatus,
} from '../../core/types.js';
import type { AgentRegistry } from '../../agents/registry.js';
import type { WorkflowRegistry } from '../../workflows/registry.js';
import type { DecisionTracker } from '../../reasoning/tracker.js';
import type { HealthMonitor } from '../../health/monitor.js';
import type { AdvancedCache } from '../../caching/lru-cache.js';
import type { CacheStats } from '../../caching/types.js';
import type { HealthStatus, SystemHealth } from '../../health/types.js';
import type { HybridSearch, EmbeddingService, EnhancedVectorStore } from '../../vector/index.js';

// ============================================================================
// Types
// ============================================================================

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

// ============================================================================
// Error Handling Utilities
// ============================================================================

/**
 * GraphQL error codes for the knowledge graph API
 */
export const ErrorCodes = {
  NOT_FOUND: 'NOT_FOUND',
  INVALID_INPUT: 'INVALID_INPUT',
  DATABASE_ERROR: 'DATABASE_ERROR',
  PAGINATION_ERROR: 'PAGINATION_ERROR',
  SEARCH_ERROR: 'SEARCH_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

/**
 * Create a GraphQL error with proper extensions
 */
function createGraphQLError(
  message: string,
  code: keyof typeof ErrorCodes,
  details?: Record<string, unknown>
): GraphQLError {
  return new GraphQLError(message, {
    extensions: {
      code: ErrorCodes[code],
      ...details,
    },
  });
}

/**
 * Wrap resolver with error handling
 */
function withErrorHandling<TArgs, TResult>(
  resolverName: string,
  resolver: (parent: unknown, args: TArgs, context: ResolverContext) => TResult | Promise<TResult>
): (parent: unknown, args: TArgs, context: ResolverContext) => Promise<TResult> {
  return async (parent, args, context) => {
    try {
      return await resolver(parent, args, context);
    } catch (error) {
      if (error instanceof GraphQLError) {
        throw error;
      }
      const message = error instanceof Error ? error.message : String(error);
      throw createGraphQLError(
        `Error in ${resolverName}: ${message}`,
        'INTERNAL_ERROR',
        { originalError: message }
      );
    }
  };
}

// ============================================================================
// Pagination Utilities
// ============================================================================

/**
 * Encode cursor for pagination
 */
function encodeCursor(id: string, index: number): string {
  return Buffer.from(JSON.stringify({ id, index })).toString('base64');
}

/**
 * Decode cursor for pagination
 */
function decodeCursor(cursor: string): { id: string; index: number } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Apply cursor-based pagination to a list
 */
function applyCursorPagination<T extends { id: string }>(
  items: T[],
  pagination?: PaginationInput
): {
  edges: Array<{ cursor: string; node: T }>;
  pageInfo: {
    startCursor: string | null;
    endCursor: string | null;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    totalCount: number;
  };
  totalCount: number;
} {
  const totalCount = items.length;
  let startIndex = 0;
  let endIndex = items.length;

  if (pagination) {
    // Handle cursor-based pagination
    if (pagination.after) {
      const afterCursor = decodeCursor(pagination.after);
      if (afterCursor) {
        startIndex = afterCursor.index + 1;
      }
    }

    if (pagination.before) {
      const beforeCursor = decodeCursor(pagination.before);
      if (beforeCursor) {
        endIndex = beforeCursor.index;
      }
    }

    // Handle first/last limits
    if (pagination.first !== undefined && pagination.first >= 0) {
      endIndex = Math.min(startIndex + pagination.first, endIndex);
    }

    if (pagination.last !== undefined && pagination.last >= 0) {
      startIndex = Math.max(endIndex - pagination.last, startIndex);
    }

    // Handle offset/limit pagination
    if (pagination.offset !== undefined && pagination.offset >= 0) {
      startIndex = Math.min(pagination.offset, items.length);
    }

    if (pagination.limit !== undefined && pagination.limit >= 0) {
      endIndex = Math.min(startIndex + pagination.limit, items.length);
    }
  }

  // Ensure valid bounds
  startIndex = Math.max(0, startIndex);
  endIndex = Math.min(items.length, endIndex);

  const slicedItems = items.slice(startIndex, endIndex);
  const edges = slicedItems.map((item, i) => ({
    cursor: encodeCursor(item.id, startIndex + i),
    node: item,
  }));

  return {
    edges,
    pageInfo: {
      startCursor: edges.length > 0 ? edges[0].cursor : null,
      endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
      hasNextPage: endIndex < items.length,
      hasPreviousPage: startIndex > 0,
      totalCount,
    },
    totalCount,
  };
}

// ============================================================================
// Data Transformation Utilities
// ============================================================================

/**
 * Transform internal KnowledgeNode to GraphQL KnowledgeNode
 */
function transformNode(node: KnowledgeNode): Record<string, unknown> {
  return {
    id: node.id,
    path: node.path,
    filename: node.filename,
    title: node.title,
    type: node.type.toUpperCase(),
    status: node.status.toUpperCase(),
    content: node.content,
    frontmatter: {
      title: node.frontmatter.title,
      type: node.frontmatter.type?.toUpperCase(),
      status: node.frontmatter.status?.toUpperCase(),
      tags: node.frontmatter.tags,
      category: node.frontmatter.category,
      description: node.frontmatter.description,
      created: node.frontmatter.created,
      updated: node.frontmatter.updated,
      aliases: node.frontmatter.aliases,
      related: node.frontmatter.related,
      custom: node.frontmatter,
    },
    tags: node.tags,
    outgoingLinks: node.outgoingLinks.map(link => ({
      target: link.target,
      type: link.type.toUpperCase(),
      text: link.text,
      context: link.context,
    })),
    incomingLinks: node.incomingLinks.map(link => ({
      target: link.target,
      type: link.type.toUpperCase(),
      text: link.text,
      context: link.context,
    })),
    outgoingLinkCount: node.outgoingLinks.length,
    incomingLinkCount: node.incomingLinks.length,
    wordCount: node.wordCount,
    lastModified: node.lastModified.toISOString(),
    createdAt: node.frontmatter.created,
  };
}

/**
 * Transform internal GraphEdge to GraphQL GraphEdge
 */
function transformEdge(edge: GraphEdge, id?: string): Record<string, unknown> {
  return {
    id: id ?? `${edge.source}-${edge.target}-${edge.type}`,
    source: edge.source,
    target: edge.target,
    type: edge.type.toUpperCase(),
    weight: edge.weight,
    context: edge.context,
  };
}

// ============================================================================
// Query Resolvers
// ============================================================================

/**
 * Node query resolver - Get a single node by ID
 */
export const nodeResolver = withErrorHandling<{ id: string }, Record<string, unknown> | null>(
  'node',
  (_, { id }, { db }) => {
    const node = db.getNode(id);
    if (!node) {
      return null;
    }
    return transformNode(node);
  }
);

/**
 * Nodes query resolver - Get multiple nodes with filtering and pagination
 */
export const nodesResolver = withErrorHandling<
  { filter?: NodeFilter; pagination?: PaginationInput },
  ReturnType<typeof applyCursorPagination>
>(
  'nodes',
  (_, { filter, pagination }, { db }) => {
    let nodes = db.getAllNodes();

    // Apply filters
    if (filter) {
      nodes = applyNodeFilter(nodes, filter, db);
    }

    // Transform nodes
    const transformedNodes = nodes.map(node => ({
      ...transformNode(node),
      id: node.id,
    }));

    return applyCursorPagination(transformedNodes as Array<{ id: string }>, pagination);
  }
);

/**
 * Apply filters to node list
 */
function applyNodeFilter(
  nodes: KnowledgeNode[],
  filter: NodeFilter,
  db: KnowledgeGraphDatabase
): KnowledgeNode[] {
  let filtered = nodes;

  if (filter.type) {
    filtered = filtered.filter(n => n.type === filter.type?.toLowerCase());
  }

  if (filter.types && filter.types.length > 0) {
    const typesLower = filter.types.map(t => t.toLowerCase());
    filtered = filtered.filter(n => typesLower.includes(n.type));
  }

  if (filter.status) {
    filtered = filtered.filter(n => n.status === filter.status?.toLowerCase());
  }

  if (filter.statuses && filter.statuses.length > 0) {
    const statusesLower = filter.statuses.map(s => s.toLowerCase());
    filtered = filtered.filter(n => statusesLower.includes(n.status));
  }

  if (filter.tag) {
    filtered = filtered.filter(n => n.tags.includes(filter.tag!));
  }

  if (filter.tags && filter.tags.length > 0) {
    filtered = filtered.filter(n => filter.tags!.every(tag => n.tags.includes(tag)));
  }

  if (filter.anyTags && filter.anyTags.length > 0) {
    filtered = filtered.filter(n => filter.anyTags!.some(tag => n.tags.includes(tag)));
  }

  if (filter.category) {
    filtered = filtered.filter(n => n.frontmatter.category === filter.category);
  }

  if (filter.minWordCount !== undefined) {
    filtered = filtered.filter(n => n.wordCount >= filter.minWordCount!);
  }

  if (filter.maxWordCount !== undefined) {
    filtered = filtered.filter(n => n.wordCount <= filter.maxWordCount!);
  }

  if (filter.minConnections !== undefined) {
    filtered = filtered.filter(n => {
      const connections = n.outgoingLinks.length + n.incomingLinks.length;
      return connections >= filter.minConnections!;
    });
  }

  if (filter.updatedAfter) {
    filtered = filtered.filter(n => n.lastModified >= filter.updatedAfter!);
  }

  if (filter.updatedBefore) {
    filtered = filtered.filter(n => n.lastModified <= filter.updatedBefore!);
  }

  if (filter.orphansOnly) {
    filtered = filtered.filter(n =>
      n.outgoingLinks.length === 0 && n.incomingLinks.length === 0
    );
  }

  if (filter.excludeOrphans) {
    filtered = filtered.filter(n =>
      n.outgoingLinks.length > 0 || n.incomingLinks.length > 0
    );
  }

  if (filter.titleContains) {
    const searchLower = filter.titleContains.toLowerCase();
    filtered = filtered.filter(n => n.title.toLowerCase().includes(searchLower));
  }

  if (filter.contentContains) {
    const searchLower = filter.contentContains.toLowerCase();
    filtered = filtered.filter(n => n.content.toLowerCase().includes(searchLower));
  }

  return filtered;
}

/**
 * Search nodes resolver - Full-text search across nodes
 */
export const searchNodesResolver = withErrorHandling<
  { query: string; options?: SearchOptions },
  Record<string, unknown>
>(
  'searchNodes',
  (_, { query, options }, { db }) => {
    const startTime = Date.now();
    const limit = options?.limit ?? 20;

    if (!query || query.trim().length === 0) {
      throw createGraphQLError('Search query cannot be empty', 'INVALID_INPUT');
    }

    let nodes = db.searchNodes(query, limit * 2); // Get extra for filtering

    // Apply additional filters
    if (options?.type) {
      nodes = nodes.filter(n => n.type === options.type!.toLowerCase());
    }

    if (options?.types && options.types.length > 0) {
      const typesLower = options.types.map(t => t.toLowerCase());
      nodes = nodes.filter(n => typesLower.includes(n.type));
    }

    if (options?.status) {
      nodes = nodes.filter(n => n.status === options.status!.toLowerCase());
    }

    if (options?.tags && options.tags.length > 0) {
      nodes = nodes.filter(n => options.tags!.some(tag => n.tags.includes(tag)));
    }

    // Limit results
    const limitedNodes = nodes.slice(0, limit);

    // Calculate facets if requested
    let facets = null;
    if (options?.facets) {
      const typeCounts: Record<string, number> = {};
      const statusCounts: Record<string, number> = {};
      const tagCounts: Record<string, number> = {};

      for (const node of nodes) {
        typeCounts[node.type] = (typeCounts[node.type] || 0) + 1;
        statusCounts[node.status] = (statusCounts[node.status] || 0) + 1;
        for (const tag of node.tags) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      }

      facets = {
        types: Object.entries(typeCounts).map(([type, count]) => ({
          type: type.toUpperCase(),
          count,
        })),
        statuses: Object.entries(statusCounts).map(([status, count]) => ({
          status: status.toUpperCase(),
          count,
        })),
        tags: Object.entries(tagCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 20)
          .map(([tag, count]) => ({ tag, count })),
      };
    }

    const took = Date.now() - startTime;

    return {
      nodes: limitedNodes.map(node => ({
        ...transformNode(node),
        score: 1.0, // SQLite FTS5 doesn't expose scores directly
      })),
      totalMatches: nodes.length,
      query,
      took,
      truncated: nodes.length > limit,
      suggestions: [],
      facets,
    };
  }
);

/**
 * Graph stats resolver - Get graph statistics
 */
export const graphResolver = withErrorHandling<Record<string, never>, Record<string, unknown>>(
  'graph',
  (_, __, { db }) => {
    const stats = db.getStats();

    return {
      totalNodes: stats.totalNodes,
      totalEdges: stats.totalEdges,
      nodesByType: Object.entries(stats.nodesByType).map(([type, count]) => ({
        type: type.toUpperCase(),
        count,
      })),
      nodesByStatus: Object.entries(stats.nodesByStatus).map(([status, count]) => ({
        status: status.toUpperCase(),
        count,
      })),
      orphanNodes: stats.orphanNodes,
      avgLinksPerNode: stats.avgLinksPerNode,
      mostConnected: stats.mostConnected.map(({ id, connections }) => {
        const node = db.getNode(id);
        const incoming = db.getIncomingEdges(id).length;
        const outgoing = db.getOutgoingEdges(id).length;
        return {
          id,
          title: node?.title ?? id,
          connections,
          incomingCount: incoming,
          outgoingCount: outgoing,
        };
      }),
      tagDistribution: db.getAllTags().slice(0, 20).map(({ name, count }) => ({
        tag: name,
        count,
      })),
      density: stats.totalNodes > 1
        ? stats.totalEdges / (stats.totalNodes * (stats.totalNodes - 1))
        : 0,
      diameter: null, // Would require full graph traversal
      componentCount: 1, // Simplified - would require connected component analysis
      lastGenerated: new Date().toISOString(),
      databaseSize: null, // Would require file system access
    };
  }
);

/**
 * Tags resolver - Get all tags with optional filtering
 */
export const tagsResolver = withErrorHandling<
  { contains?: string; limit?: number },
  Array<{ tag: string; count: number }>
>(
  'tags',
  (_, { contains, limit = 100 }, { db }) => {
    let tags = db.getAllTags();

    if (contains) {
      const searchLower = contains.toLowerCase();
      tags = tags.filter(t => t.name.toLowerCase().includes(searchLower));
    }

    return tags.slice(0, limit).map(({ name, count }) => ({
      tag: name,
      count,
    }));
  }
);

/**
 * Nodes by tag resolver - Get nodes with a specific tag
 */
export const nodesByTagResolver = withErrorHandling<
  { tag: string; pagination?: PaginationInput },
  ReturnType<typeof applyCursorPagination>
>(
  'nodesByTag',
  (_, { tag, pagination }, { db }) => {
    const nodes = db.getNodesByTag(tag);
    const transformedNodes = nodes.map(node => ({
      ...transformNode(node),
      id: node.id,
    }));

    return applyCursorPagination(transformedNodes as Array<{ id: string }>, pagination);
  }
);

/**
 * Relations resolver - Get edges/relations with filtering
 */
export const relationsResolver = withErrorHandling<
  { filter?: RelationFilter },
  Array<Record<string, unknown>>
>(
  'relations',
  (_, { filter }, { db }) => {
    const allNodes = db.getAllNodes();
    const edges: Array<{ edge: GraphEdge; id: string }> = [];

    for (const node of allNodes) {
      const outgoing = db.getOutgoingEdges(node.id);
      for (let i = 0; i < outgoing.length; i++) {
        edges.push({
          edge: outgoing[i],
          id: `${node.id}-${outgoing[i].target}-${i}`,
        });
      }
    }

    let filteredEdges = edges;

    if (filter) {
      if (filter.source) {
        filteredEdges = filteredEdges.filter(e => e.edge.source === filter.source);
      }
      if (filter.target) {
        filteredEdges = filteredEdges.filter(e => e.edge.target === filter.target);
      }
      if (filter.type) {
        const typeLower = filter.type.toLowerCase();
        filteredEdges = filteredEdges.filter(e => e.edge.type === typeLower);
      }
    }

    return filteredEdges.map(({ edge, id }) => transformEdge(edge, id));
  }
);

/**
 * Health resolver - Get system health status
 */
export const healthResolver = withErrorHandling<Record<string, never>, Record<string, unknown>>(
  'health',
  async (_, __, { healthMonitor, db, cache, startTime, requestCount }) => {
    let status: HealthStatus = 'healthy';
    const components: Record<string, boolean> = {
      database: true,
      cache: true,
      agents: true,
      vectorStore: false, // Not yet implemented
    };

    // Check database
    try {
      db.getStats();
    } catch {
      components.database = false;
      status = 'degraded';
    }

    // Check cache
    try {
      if (cache) {
        cache.getStats();
      }
    } catch {
      components.cache = false;
    }

    // If health monitor is available, use its status
    if (healthMonitor) {
      try {
        const systemHealth = await healthMonitor.runAllChecks();
        status = systemHealth.status;
      } catch {
        status = 'degraded';
      }
    }

    const uptime = Date.now() - startTime.getTime();

    return {
      status: status.toUpperCase(),
      components,
      uptime,
      requestCount,
      toolCount: 0, // Would come from MCP server
    };
  }
);

/**
 * Cache stats resolver - Get cache statistics
 */
export const cacheStatsResolver = withErrorHandling<Record<string, never>, CacheStats | null>(
  'cacheStats',
  (_, __, { cache }) => {
    if (!cache) {
      return null;
    }
    return cache.getStats();
  }
);

/**
 * Agents resolver - Get all registered agents
 */
export const agentsResolver = withErrorHandling<
  { type?: string; status?: string },
  Array<Record<string, unknown>>
>(
  'agents',
  (_, { type, status }, { agentRegistry }) => {
    if (!agentRegistry) {
      return [];
    }

    let agents = agentRegistry.listInstances();

    if (type) {
      agents = agents.filter(a => a.type === type.toLowerCase());
    }

    if (status) {
      agents = agents.filter(a => a.status === status.toLowerCase());
    }

    return agents.map(agent => {
      const instance = agentRegistry.get(agent.id);
      return {
        id: agent.id,
        name: agent.name,
        type: agent.type.toUpperCase(),
        description: instance?.config.description,
        status: agent.status.toUpperCase(),
        capabilities: instance?.config.capabilities ?? [],
        currentTask: instance?.state.currentTask ? {
          id: instance.state.currentTask.id,
          description: instance.state.currentTask.description,
          priority: instance.state.currentTask.priority.toUpperCase(),
          input: instance.state.currentTask.input,
          createdAt: instance.state.currentTask.createdAt.toISOString(),
        } : null,
        queuedTaskCount: instance?.state.taskQueue.length ?? 0,
        completedTaskCount: instance?.state.completedTasks.length ?? 0,
        errorCount: instance?.state.errorCount ?? 0,
        lastActivity: instance?.state.lastActivity.toISOString(),
        health: {
          healthy: (instance?.state.errorCount ?? 0) < 5,
          status: agent.status.toUpperCase(),
          lastHeartbeat: instance?.state.lastActivity.toISOString(),
          error: (instance?.state.errorCount ?? 0) >= 5
            ? `High error count: ${instance?.state.errorCount}`
            : null,
        },
        config: {
          maxConcurrentTasks: instance?.config.maxConcurrentTasks ?? 1,
          taskTimeout: instance?.config.taskTimeout ?? 60000,
          retry: instance?.config.retry,
          claudeFlowEnabled: instance?.config.claudeFlow?.enabled ?? false,
          metadata: instance?.config.metadata,
        },
      };
    });
  }
);

/**
 * Workflows resolver - Get all registered workflows
 */
export const workflowsResolver = withErrorHandling<
  { tags?: string[]; namePattern?: string; limit?: number; offset?: number },
  Array<Record<string, unknown>>
>(
  'workflows',
  (_, { tags, namePattern, limit = 20, offset = 0 }, { workflowRegistry }) => {
    if (!workflowRegistry) {
      return [];
    }

    const workflows = workflowRegistry.list({
      tags,
      namePattern,
      limit,
      offset,
    });

    return workflows.map(workflow => ({
      id: workflow.id,
      name: workflow.name,
      description: workflow.description,
      version: workflow.version,
      steps: workflow.steps.map(step => ({
        id: step.id,
        name: step.name,
        description: step.description,
        dependencies: step.dependencies,
        timeout: step.timeout,
        retries: step.retries,
        parallel: step.parallel ?? true,
        optional: step.optional ?? false,
        metadata: step.metadata,
      })),
      timeout: workflow.timeout,
      enableRollback: workflow.enableRollback ?? false,
      tags: workflow.tags ?? [],
      metadata: workflow.metadata,
    }));
  }
);

/**
 * Audit log resolver - Get audit log entries
 */
export const auditLogResolver = withErrorHandling<
  { filter?: AuditFilter },
  Array<Record<string, unknown>>
>(
  'auditLog',
  (_, { filter }) => {
    // Audit log not yet implemented - return empty array
    // This would integrate with an audit tracking system
    return [];
  }
);

/**
 * Vector search resolver - Semantic similarity search
 *
 * Uses HybridSearch when available to combine vector similarity with
 * full-text search for better results. Falls back to text search only
 * if embedding services are not configured.
 */
export const vectorSearchResolver = withErrorHandling<
  { query: VectorSearchInput },
  Record<string, unknown>
>(
  'vectorSearch',
  async (_, { query }, { db, hybridSearch, embeddingService, vectorStore }) => {
    const startTime = Date.now();
    const limit = query.limit ?? 10;
    const minSimilarity = query.minSimilarity ?? 0.3;

    // Use hybrid search if available
    if (hybridSearch && embeddingService) {
      try {
        const response = await hybridSearch.search({
          query: query.query,
          limit,
          minScore: minSimilarity,
          nodeTypes: query.nodeTypes?.map(t => t.toLowerCase()),
          includeSnippets: true,
        });

        const results = response.results.map((result) => {
          // Get full node data from database
          const node = db.getNode(result.nodeId);
          return {
            id: result.nodeId,
            node: node ? transformNode(node) : null,
            similarity: result.combinedScore,
            vectorScore: result.vectorScore,
            ftsScore: result.ftsScore,
            source: result.source,
            rank: result.rank,
            snippets: result.snippets,
          };
        });

        const modelInfo = embeddingService.getModelInfo();

        return {
          results,
          totalResults: results.length,
          query: query.query,
          took: response.stats.totalDurationMs,
          metadata: {
            model: modelInfo.model,
            dimensions: modelInfo.dimensions,
            searchType: 'hybrid',
            vectorSearchMs: response.stats.vectorSearchMs,
            ftsSearchMs: response.stats.ftsSearchMs,
          },
        };
      } catch (error) {
        // Log error and fall back to text search
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Hybrid search failed, falling back to text search: ${message}`);
      }
    }

    // Use vector-only search if vector store is available
    if (vectorStore && embeddingService) {
      try {
        const embeddingResult = await embeddingService.embed(query.query);
        const vectorResults = await vectorStore.search({
          vector: Array.from(embeddingResult.embedding),
          k: limit,
          minScore: minSimilarity,
        });

        const results = vectorResults.map((result, index) => {
          const node = db.getNode(result.id);
          return {
            id: result.id,
            node: node ? transformNode(node) : null,
            similarity: result.score,
            vectorScore: result.score,
            ftsScore: 0,
            source: 'vector' as const,
            rank: index + 1,
          };
        });

        const modelInfo = embeddingService.getModelInfo();

        return {
          results,
          totalResults: results.length,
          query: query.query,
          took: Date.now() - startTime,
          metadata: {
            model: modelInfo.model,
            dimensions: modelInfo.dimensions,
            searchType: 'vector',
          },
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Vector search failed, falling back to text search: ${message}`);
      }
    }

    // Fall back to text search
    const nodes = db.searchNodes(query.query, limit);

    const results = nodes.map((node, index) => ({
      id: node.id,
      node: transformNode(node),
      similarity: 1.0 - (index * 0.1), // Simulated similarity scores
      vectorScore: 0,
      ftsScore: 1.0 - (index * 0.1),
      source: 'fts' as const,
      rank: index + 1,
    }));

    return {
      results,
      totalResults: results.length,
      query: query.query,
      took: Date.now() - startTime,
      metadata: {
        model: 'text-search-fallback',
        dimensions: 0,
        searchType: 'fts',
        note: 'Embedding services not configured. Configure EmbeddingService and VectorStore for semantic search.',
      },
    };
  }
);

/**
 * Trajectories resolver - Get agent trajectories
 */
export const trajectoriesResolver = withErrorHandling<
  { filter?: TrajectoryFilter },
  Array<Record<string, unknown>>
>(
  'trajectories',
  (_, { filter }) => {
    // Trajectory tracking not yet fully implemented
    // This would integrate with the RuVector schema
    return [];
  }
);

// ============================================================================
// Resolver Map Export
// ============================================================================

/**
 * Query resolvers map for GraphQL server
 */
export const queryResolvers = {
  Query: {
    // Node queries
    node: nodeResolver,
    nodes: async (parent: unknown, args: { ids: string[] }, context: ResolverContext) => {
      const results = [];
      for (const id of args.ids) {
        const node = context.db.getNode(id);
        results.push(node ? transformNode(node) : null);
      }
      return results;
    },
    nodeByPath: async (parent: unknown, args: { path: string }, context: ResolverContext) => {
      const node = context.db.getNodeByPath(args.path);
      return node ? transformNode(node) : null;
    },
    queryNodes: nodesResolver,
    search: searchNodesResolver,

    // Graph queries
    graphStats: graphResolver,
    graphMetadata: async (parent: unknown, args: unknown, context: ResolverContext) => {
      const stats = context.db.getStats();
      const version = context.db.getMetadata('version');
      const created = context.db.getMetadata('created');
      return {
        name: 'Knowledge Graph',
        version: version ?? '1.0.0',
        created: created ?? new Date().toISOString(),
        updated: new Date().toISOString(),
        nodeCount: stats.totalNodes,
        edgeCount: stats.totalEdges,
        rootPath: '.',
      };
    },
    edge: async (parent: unknown, args: { id: string }, context: ResolverContext) => {
      // Edge lookup by ID would require parsing the composite ID
      return null;
    },
    edges: async (
      parent: unknown,
      args: { source?: string; target?: string; type?: string; pagination?: PaginationInput },
      context: ResolverContext
    ) => {
      const allNodes = context.db.getAllNodes();
      const edges: Array<{ edge: GraphEdge; id: string }> = [];

      for (const node of allNodes) {
        const outgoing = context.db.getOutgoingEdges(node.id);
        for (let i = 0; i < outgoing.length; i++) {
          edges.push({
            edge: outgoing[i],
            id: `${node.id}-${outgoing[i].target}-${i}`,
          });
        }
      }

      let filtered = edges;
      if (args.source) {
        filtered = filtered.filter(e => e.edge.source === args.source);
      }
      if (args.target) {
        filtered = filtered.filter(e => e.edge.target === args.target);
      }
      if (args.type) {
        filtered = filtered.filter(e => e.edge.type === args.type?.toLowerCase());
      }

      const transformedEdges = filtered.map(({ edge, id }) => ({
        ...transformEdge(edge, id),
        id,
      }));

      return applyCursorPagination(transformedEdges as Array<{ id: string }>, args.pagination);
    },

    // Tag queries
    tags: tagsResolver,
    nodesByTag: nodesByTagResolver,

    // Agent queries
    agent: async (parent: unknown, args: { id: string }, context: ResolverContext) => {
      if (!context.agentRegistry) return null;
      const agent = context.agentRegistry.get(args.id);
      if (!agent) return null;
      return {
        id: agent.config.id,
        name: agent.config.name,
        type: agent.config.type.toUpperCase(),
        status: agent.getStatus().toUpperCase(),
        capabilities: agent.config.capabilities ?? [],
      };
    },
    agents: agentsResolver,

    // Workflow queries
    workflow: async (parent: unknown, args: { id: string }, context: ResolverContext) => {
      if (!context.workflowRegistry) return null;
      return context.workflowRegistry.get(args.id);
    },
    workflows: workflowsResolver,

    // System queries
    health: healthResolver,
    version: async () => ({
      version: '1.0.0',
      buildTime: null,
      gitCommit: null,
      nodeVersion: process.version,
      schemaVersion: '1.0.0',
    }),

    // Reasoning queries
    decision: async (parent: unknown, args: { id: string }, context: ResolverContext) => {
      if (!context.reasoningTracker) return null;
      // Would look up decision by ID
      return null;
    },
    reasoningChain: async (parent: unknown, args: { id: string }, context: ResolverContext) => {
      if (!context.reasoningTracker) return null;
      // Would look up chain by ID
      return null;
    },
    reasoningStats: async (parent: unknown, args: unknown, context: ResolverContext) => {
      if (!context.reasoningTracker) {
        return {
          totalDecisions: 0,
          byType: [],
          byConfidence: [],
          successRate: 0,
          averageDuration: 0,
          totalChains: 0,
          chainsByStatus: [],
        };
      }
      return context.reasoningTracker.getStats();
    },

    // Vector/Learning queries
    patterns: async () => [],
    trajectories: trajectoriesResolver,
    similarNodes: async (
      parent: unknown,
      args: { input: { nodeId?: string; text?: string; limit?: number; minSimilarity?: number; type?: string } },
      context: ResolverContext
    ) => {
      // Similarity search not yet implemented - return empty
      return [];
    },

    // Path finding
    path: async (
      parent: unknown,
      args: { from: string; to: string; maxDepth?: number },
      context: ResolverContext
    ) => {
      if (!context.graphManager) return null;
      const pathIds = context.graphManager.findPath(args.from, args.to);
      if (!pathIds) return null;
      return pathIds.map(id => {
        const node = context.db.getNode(id);
        return node ? transformNode(node) : null;
      }).filter(Boolean);
    },

    allPaths: async () => [],

    subgraph: async (
      parent: unknown,
      args: { nodeId: string; depth?: number; includeIncoming?: boolean; includeOutgoing?: boolean },
      context: ResolverContext
    ) => {
      const centerNode = context.db.getNode(args.nodeId);
      if (!centerNode) {
        throw createGraphQLError(`Node not found: ${args.nodeId}`, 'NOT_FOUND');
      }

      const nodes: KnowledgeNode[] = [centerNode];
      const edges: Array<{ edge: GraphEdge; id: string }> = [];
      const visited = new Set<string>([args.nodeId]);
      const depth = args.depth ?? 2;

      const explore = (nodeId: string, currentDepth: number) => {
        if (currentDepth >= depth) return;

        if (args.includeOutgoing !== false) {
          const outgoing = context.db.getOutgoingEdges(nodeId);
          for (const edge of outgoing) {
            edges.push({ edge, id: `${nodeId}-${edge.target}` });
            if (!visited.has(edge.target)) {
              visited.add(edge.target);
              const targetNode = context.db.getNode(edge.target);
              if (targetNode) {
                nodes.push(targetNode);
                explore(edge.target, currentDepth + 1);
              }
            }
          }
        }

        if (args.includeIncoming !== false) {
          const incoming = context.db.getIncomingEdges(nodeId);
          for (const edge of incoming) {
            edges.push({ edge, id: `${edge.source}-${nodeId}` });
            if (!visited.has(edge.source)) {
              visited.add(edge.source);
              const sourceNode = context.db.getNode(edge.source);
              if (sourceNode) {
                nodes.push(sourceNode);
                explore(edge.source, currentDepth + 1);
              }
            }
          }
        }
      };

      explore(args.nodeId, 0);

      return {
        center: transformNode(centerNode),
        nodes: nodes.map(n => transformNode(n)),
        edges: edges.map(({ edge, id }) => transformEdge(edge, id)),
        depth,
      };
    },
  },

  // Field resolvers for complex types
  KnowledgeNode: {
    relatedByTags: async (
      parent: Record<string, unknown>,
      args: { limit?: number },
      context: ResolverContext
    ) => {
      const node = context.db.getNode(parent.id as string);
      if (!node || node.tags.length === 0) return [];

      const related = new Map<string, number>();
      for (const tag of node.tags) {
        const taggedNodes = context.db.getNodesByTag(tag);
        for (const relatedNode of taggedNodes) {
          if (relatedNode.id !== node.id) {
            related.set(relatedNode.id, (related.get(relatedNode.id) ?? 0) + 1);
          }
        }
      }

      const sorted = Array.from(related.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, args.limit ?? 5);

      return sorted.map(([id]) => {
        const relatedNode = context.db.getNode(id);
        return relatedNode ? transformNode(relatedNode) : null;
      }).filter(Boolean);
    },

    relatedByLinks: async (
      parent: Record<string, unknown>,
      args: { limit?: number },
      context: ResolverContext
    ) => {
      const nodeId = parent.id as string;
      const outgoing = context.db.getOutgoingEdges(nodeId);
      const incoming = context.db.getIncomingEdges(nodeId);

      const relatedIds = new Set<string>();
      for (const edge of outgoing) {
        relatedIds.add(edge.target);
      }
      for (const edge of incoming) {
        relatedIds.add(edge.source);
      }

      const limit = args.limit ?? 5;
      const results = [];
      const relatedIdArray = Array.from(relatedIds);
      for (let i = 0; i < relatedIdArray.length && results.length < limit; i++) {
        const id = relatedIdArray[i];
        const relatedNode = context.db.getNode(id);
        if (relatedNode) {
          results.push(transformNode(relatedNode));
        }
      }

      return results;
    },

    pathTo: async (
      parent: Record<string, unknown>,
      args: { targetId: string; maxDepth?: number },
      context: ResolverContext
    ) => {
      if (!context.graphManager) return null;
      const pathIds = context.graphManager.findPath(parent.id as string, args.targetId);
      if (!pathIds) return null;
      return pathIds.map(id => {
        const node = context.db.getNode(id);
        return node ? transformNode(node) : null;
      }).filter(Boolean);
    },

    targetNode: async (
      parent: Record<string, unknown>,
      args: unknown,
      context: ResolverContext
    ) => {
      const target = parent.target as string;
      const node = context.db.getNode(target) ?? context.db.getNodeByPath(target);
      return node ? transformNode(node) : null;
    },
  },

  NodeLink: {
    targetNode: async (
      parent: Record<string, unknown>,
      args: unknown,
      context: ResolverContext
    ) => {
      const target = parent.target as string;
      const node = context.db.getNode(target) ?? context.db.getNodeByPath(target);
      return node ? transformNode(node) : null;
    },
  },

  GraphEdge: {
    sourceNode: async (
      parent: Record<string, unknown>,
      args: unknown,
      context: ResolverContext
    ) => {
      const source = parent.source as string;
      const node = context.db.getNode(source);
      return node ? transformNode(node) : null;
    },

    targetNode: async (
      parent: Record<string, unknown>,
      args: unknown,
      context: ResolverContext
    ) => {
      const target = parent.target as string;
      const node = context.db.getNode(target);
      return node ? transformNode(node) : null;
    },
  },
};

export default queryResolvers;
