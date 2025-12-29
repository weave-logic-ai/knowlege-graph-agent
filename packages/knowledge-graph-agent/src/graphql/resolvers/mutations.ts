/**
 * GraphQL Mutation Resolvers
 *
 * Implements all mutation operations for the knowledge-graph-agent GraphQL API.
 * Validates inputs with zod schemas, emits events for subscriptions, and
 * integrates with database and services.
 *
 * @module graphql/resolvers/mutations
 */

import { randomUUID } from 'crypto';
import { z } from 'zod';
import { GraphQLError } from 'graphql';
import type { KnowledgeNode, GraphEdge, NodeType, NodeStatus } from '../../core/types.js';
import type { AgentType, AgentConfig } from '../../agents/types.js';
import { AgentStatus } from '../../agents/types.js';
import type { ResolverContext } from './queries.js';
import {
  getPubSub,
  publishNodeCreated,
  publishNodeUpdated,
  publishNodeDeleted,
  publishRelationCreated,
  publishAgentStatusChanged,
  publishWorkflowProgress,
} from '../pubsub.js';

// ============================================================================
// Mutation Context Type
// ============================================================================

/**
 * Extended context for mutations with all required services.
 * Uses ResolverContext as base but adds mutation-specific services.
 */
export type MutationContext = ResolverContext;

// ============================================================================
// Zod Validation Schemas
// ============================================================================

const NodeTypeSchema = z.enum([
  'CONCEPT', 'TECHNICAL', 'FEATURE', 'PRIMITIVE',
  'SERVICE', 'GUIDE', 'STANDARD', 'INTEGRATION',
]);

const NodeStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'DEPRECATED', 'ARCHIVED']);

const EdgeTypeSchema = z.enum(['LINK', 'REFERENCE', 'PARENT', 'RELATED']);

const AgentTypeSchema = z.enum([
  'RESEARCHER', 'CODER', 'TESTER', 'ANALYST', 'ARCHITECT',
  'REVIEWER', 'COORDINATOR', 'OPTIMIZER', 'DOCUMENTER', 'CUSTOM',
]);

const TaskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

const CreateNodeInputSchema = z.object({
  title: z.string().min(1).max(500),
  type: NodeTypeSchema,
  status: NodeStatusSchema.optional().default('DRAFT'),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const UpdateNodeInputSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  type: NodeTypeSchema.optional(),
  status: NodeStatusSchema.optional(),
  content: z.string().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  description: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  related: z.array(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

const CreateRelationInputSchema = z.object({
  source: z.string().min(1),
  target: z.string().min(1),
  type: EdgeTypeSchema,
  weight: z.number().min(0).max(1).optional().default(0.5),
  context: z.string().optional(),
});

const SpawnAgentInputSchema = z.object({
  name: z.string().min(1).max(100),
  type: AgentTypeSchema,
  description: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  maxConcurrentTasks: z.number().min(1).max(100).optional().default(1),
  taskTimeout: z.number().min(1000).optional().default(60000),
  retry: z.object({
    maxRetries: z.number().min(0).max(10),
    backoffMs: z.number().min(100),
    backoffMultiplier: z.number().optional(),
  }).optional(),
  enableClaudeFlow: z.boolean().optional().default(true),
  metadata: z.record(z.unknown()).optional(),
});

const StartWorkflowInputSchema = z.object({
  workflowId: z.string().min(1),
  input: z.record(z.unknown()).optional(),
  parallel: z.boolean().optional().default(true),
  continueOnError: z.boolean().optional().default(false),
  timeout: z.number().min(1000).optional(),
});

const CheckpointInputSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  nodeIds: z.array(z.string()).optional(),
  includeEdges: z.boolean().optional().default(true),
  metadata: z.record(z.unknown()).optional(),
});

const VectorUpsertInputSchema = z.object({
  id: z.string().min(1),
  vector: z.array(z.number()),
  metadata: z.record(z.unknown()).optional(),
  namespace: z.string().optional(),
});

const TrajectoryInputSchema = z.object({
  agentId: z.string().min(1),
  workflowId: z.string().optional(),
  steps: z.array(z.object({
    action: z.string(),
    state: z.record(z.unknown()),
    outcome: z.enum(['success', 'failure', 'pending']),
    duration: z.number(),
    timestamp: z.string().datetime().optional(),
    metadata: z.record(z.unknown()).optional(),
  })),
  success: z.boolean(),
  metadata: z.record(z.unknown()).optional(),
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convert GraphQL enum to lowercase database value
 */
function toLowerCaseType(type: string): NodeType {
  return type.toLowerCase() as NodeType;
}

/**
 * Convert GraphQL enum to lowercase status
 */
function toLowerCaseStatus(status: string): NodeStatus {
  return status.toLowerCase() as NodeStatus;
}

/**
 * Convert GraphQL enum to lowercase edge type
 */
function toLowerCaseEdgeType(type: string): GraphEdge['type'] {
  return type.toLowerCase() as GraphEdge['type'];
}

/**
 * Convert database node to GraphQL format
 */
function toGraphQLNode(node: KnowledgeNode): unknown {
  return {
    ...node,
    type: node.type.toUpperCase(),
    status: node.status.toUpperCase(),
    frontmatter: {
      ...node.frontmatter,
      type: node.frontmatter.type?.toUpperCase(),
      status: node.frontmatter.status?.toUpperCase(),
    },
    outgoingLinkCount: node.outgoingLinks.length,
    incomingLinkCount: node.incomingLinks.length,
    createdAt: node.frontmatter.created ?? node.lastModified.toISOString(),
    lastModified: node.lastModified.toISOString(),
  };
}

/**
 * Generate a URL-friendly filename from title
 */
function generateFilename(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100) + '.md';
}

/**
 * Count words in content
 */
function countWords(content: string): number {
  if (!content) return 0;
  return content.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Validate input and throw GraphQL error on failure
 */
function validateInput<T>(schema: z.ZodSchema<T>, input: unknown, inputName: string): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    throw new GraphQLError(`Invalid ${inputName}: ${errors}`, {
      extensions: { code: 'BAD_USER_INPUT', validationErrors: result.error.errors },
    });
  }
  return result.data;
}

// ============================================================================
// Mutation Resolvers
// ============================================================================

export const mutationResolvers = {
  // --------------------------------------------------------------------------
  // Node Mutations
  // --------------------------------------------------------------------------

  /**
   * Create a new knowledge node
   */
  createNode: async (
    _parent: unknown,
    args: { input: unknown },
    context: MutationContext
  ) => {
    const input = validateInput(CreateNodeInputSchema, args.input, 'CreateNodeInput');
    const { db } = context;

    const id = randomUUID();
    const filename = generateFilename(input.title);
    const path = `docs/${filename}`;
    const content = input.content || '';
    const now = new Date();

    const node: KnowledgeNode = {
      id,
      path,
      filename,
      title: input.title,
      type: toLowerCaseType(input.type),
      status: toLowerCaseStatus(input.status || 'DRAFT'),
      content,
      frontmatter: {
        title: input.title,
        type: toLowerCaseType(input.type),
        status: toLowerCaseStatus(input.status || 'DRAFT'),
        tags: input.tags,
        category: input.category,
        description: input.description,
        aliases: input.aliases,
        related: input.related,
        created: now.toISOString(),
        updated: now.toISOString(),
        ...input.metadata,
      },
      tags: input.tags || [],
      outgoingLinks: [],
      incomingLinks: [],
      wordCount: countWords(content),
      lastModified: now,
    };

    db.upsertNode(node);

    // Create edges for related nodes
    if (input.related && input.related.length > 0) {
      for (const relatedId of input.related) {
        const relatedNode = db.getNode(relatedId);
        if (relatedNode) {
          db.addEdge({
            source: id,
            target: relatedId,
            type: 'related',
            weight: 0.5,
          });
        }
      }
    }

    const result = toGraphQLNode(db.getNode(id)!);

    // Publish event for subscriptions
    publishNodeCreated(result as KnowledgeNode);

    return result;
  },

  /**
   * Update an existing node
   */
  updateNode: async (
    _parent: unknown,
    args: { id: string; input: unknown },
    context: MutationContext
  ) => {
    const input = validateInput(UpdateNodeInputSchema, args.input, 'UpdateNodeInput');
    const { db } = context;

    const existingNode = db.getNode(args.id);
    if (!existingNode) {
      throw new GraphQLError(`Node not found: ${args.id}`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const now = new Date();
    const updatedNode: KnowledgeNode = {
      ...existingNode,
      title: input.title ?? existingNode.title,
      type: input.type ? toLowerCaseType(input.type) : existingNode.type,
      status: input.status ? toLowerCaseStatus(input.status) : existingNode.status,
      content: input.content ?? existingNode.content,
      tags: input.tags ?? existingNode.tags,
      frontmatter: {
        ...existingNode.frontmatter,
        title: input.title ?? existingNode.frontmatter.title,
        type: input.type ? toLowerCaseType(input.type) : existingNode.frontmatter.type,
        status: input.status ? toLowerCaseStatus(input.status) : existingNode.frontmatter.status,
        tags: input.tags ?? existingNode.frontmatter.tags,
        category: input.category ?? existingNode.frontmatter.category,
        description: input.description ?? existingNode.frontmatter.description,
        aliases: input.aliases ?? existingNode.frontmatter.aliases,
        related: input.related ?? existingNode.frontmatter.related,
        updated: now.toISOString(),
        ...(input.metadata ?? {}),
      },
      wordCount: input.content ? countWords(input.content) : existingNode.wordCount,
      lastModified: now,
    };

    db.upsertNode(updatedNode);

    const result = toGraphQLNode(db.getNode(args.id)!);

    // Publish event for subscriptions
    publishNodeUpdated(result as KnowledgeNode);

    return result;
  },

  /**
   * Delete a node
   */
  deleteNode: async (
    _parent: unknown,
    args: { id: string },
    context: MutationContext
  ) => {
    const { db } = context;

    const existingNode = db.getNode(args.id);
    if (!existingNode) {
      return { success: false, id: args.id, error: 'Node not found' };
    }

    // Delete associated edges
    db.deleteNodeEdges(args.id);

    // Delete node
    const deleted = db.deleteNode(args.id);

    if (deleted) {
      // Publish event for subscriptions
      publishNodeDeleted({ id: args.id, deletedAt: new Date() });
    }

    return { success: deleted, id: args.id, error: deleted ? null : 'Failed to delete node' };
  },

  // --------------------------------------------------------------------------
  // Relation (Edge) Mutations
  // --------------------------------------------------------------------------

  /**
   * Create a new relation (edge) between nodes
   */
  createRelation: async (
    _parent: unknown,
    args: { input: unknown },
    context: MutationContext
  ) => {
    const input = validateInput(CreateRelationInputSchema, args.input, 'CreateRelationInput');
    const { db } = context;

    // Validate source and target nodes exist
    const sourceNode = db.getNode(input.source);
    const targetNode = db.getNode(input.target);

    if (!sourceNode) {
      throw new GraphQLError(`Source node not found: ${input.source}`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    if (!targetNode) {
      throw new GraphQLError(`Target node not found: ${input.target}`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    const edge: GraphEdge = {
      source: input.source,
      target: input.target,
      type: toLowerCaseEdgeType(input.type),
      weight: input.weight ?? 0.5,
      context: input.context,
    };

    db.addEdge(edge);

    // Retrieve the edge with ID (edges have auto-increment ID in SQLite)
    const outgoingEdges = db.getOutgoingEdges(input.source);
    const createdEdge = outgoingEdges.find(
      e => e.target === input.target && e.type === edge.type
    );

    const result = {
      id: `${input.source}-${input.target}-${edge.type}`,
      source: input.source,
      target: input.target,
      type: input.type,
      weight: edge.weight,
      context: edge.context,
      sourceNode: toGraphQLNode(sourceNode),
      targetNode: toGraphQLNode(targetNode),
    };

    // Publish event for subscriptions
    publishRelationCreated(edge);

    return result;
  },

  /**
   * Delete a relation
   */
  deleteRelation: async (
    _parent: unknown,
    args: { id: string },
    context: MutationContext
  ) => {
    const { db } = context;

    // Edge ID format: source-target-type
    const parts = args.id.split('-');
    if (parts.length < 3) {
      return { success: false, id: args.id, error: 'Invalid relation ID format' };
    }

    const type = parts.pop()!;
    const target = parts.pop()!;
    const source = parts.join('-');

    // Get database instance to run raw query
    const rawDb = db.getDatabase();
    const result = rawDb.prepare(
      'DELETE FROM edges WHERE source_id = ? AND target_id = ? AND type = ?'
    ).run(source, target, type);

    const deleted = result.changes > 0;

    if (deleted) {
      // Publish event for subscriptions via pubsub
      const pubsub = getPubSub();
      pubsub.publish('EDGE_DELETED', args.id);
    }

    return { success: deleted, id: args.id, error: deleted ? null : 'Relation not found' };
  },

  // --------------------------------------------------------------------------
  // Tag Mutations
  // --------------------------------------------------------------------------

  /**
   * Add a tag to a node
   */
  addTag: async (
    _parent: unknown,
    args: { nodeId: string; tag: string },
    context: MutationContext
  ) => {
    const { db } = context;

    const node = db.getNode(args.nodeId);
    if (!node) {
      throw new GraphQLError(`Node not found: ${args.nodeId}`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Add tag if not already present
    const tags = new Set(node.tags);
    tags.add(args.tag.toLowerCase().trim());

    const updatedNode: KnowledgeNode = {
      ...node,
      tags: Array.from(tags),
      frontmatter: {
        ...node.frontmatter,
        tags: Array.from(tags),
        updated: new Date().toISOString(),
      },
      lastModified: new Date(),
    };

    db.upsertNode(updatedNode);

    const result = toGraphQLNode(db.getNode(args.nodeId)!);

    publishNodeUpdated(result as KnowledgeNode);

    return result;
  },

  /**
   * Remove a tag from a node
   */
  removeTag: async (
    _parent: unknown,
    args: { nodeId: string; tag: string },
    context: MutationContext
  ) => {
    const { db } = context;

    const node = db.getNode(args.nodeId);
    if (!node) {
      throw new GraphQLError(`Node not found: ${args.nodeId}`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Remove tag
    const tagToRemove = args.tag.toLowerCase().trim();
    const tags = node.tags.filter(t => t.toLowerCase() !== tagToRemove);

    const updatedNode: KnowledgeNode = {
      ...node,
      tags,
      frontmatter: {
        ...node.frontmatter,
        tags,
        updated: new Date().toISOString(),
      },
      lastModified: new Date(),
    };

    db.upsertNode(updatedNode);

    const result = toGraphQLNode(db.getNode(args.nodeId)!);

    publishNodeUpdated(result as KnowledgeNode);

    return result;
  },

  // --------------------------------------------------------------------------
  // Agent Mutations
  // --------------------------------------------------------------------------

  /**
   * Spawn a new agent
   */
  spawnAgent: async (
    _parent: unknown,
    args: { input: unknown },
    context: MutationContext
  ) => {
    const input = validateInput(SpawnAgentInputSchema, args.input, 'SpawnAgentInput');
    const { agentRegistry } = context;

    if (!agentRegistry) {
      throw new GraphQLError('Agent registry not available', {
        extensions: { code: 'SERVICE_UNAVAILABLE' },
      });
    }

    const agentType = input.type.toLowerCase() as AgentType;
    const agentId = `${agentType}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const config: AgentConfig = {
      id: agentId,
      name: input.name,
      type: agentType as unknown as AgentType,
      description: input.description,
      capabilities: input.capabilities,
      maxConcurrentTasks: input.maxConcurrentTasks,
      taskTimeout: input.taskTimeout,
      retry: input.retry ? {
        maxRetries: input.retry.maxRetries,
        backoffMs: input.retry.backoffMs,
        backoffMultiplier: input.retry.backoffMultiplier,
      } : undefined,
      claudeFlow: {
        enabled: input.enableClaudeFlow ?? true,
      },
      metadata: input.metadata,
    };

    // Check if agent type is registered
    const isRegistered = agentRegistry.isRegistered(agentType as unknown as import('../../agents/types.js').AgentType);

    // Spawn agent if registered, otherwise just return config
    let agent;
    if (isRegistered) {
      agent = await agentRegistry.spawn(
        agentType as unknown as import('../../agents/types.js').AgentType,
        config
      );
    }

    const result = {
      id: agentId,
      name: input.name,
      type: input.type,
      description: input.description,
      status: 'IDLE',
      capabilities: input.capabilities || [],
      currentTask: null,
      queuedTaskCount: 0,
      completedTaskCount: 0,
      errorCount: 0,
      lastActivity: new Date().toISOString(),
      health: {
        healthy: true,
        status: 'IDLE',
        lastHeartbeat: new Date().toISOString(),
        error: null,
        memoryUsage: process.memoryUsage().heapUsed,
      },
      config: {
        maxConcurrentTasks: input.maxConcurrentTasks ?? 1,
        taskTimeout: input.taskTimeout ?? 60000,
        retry: input.retry ?? null,
        claudeFlowEnabled: input.enableClaudeFlow ?? true,
        metadata: input.metadata ?? null,
      },
      metrics: null,
    };

    // Publish agent status change
    publishAgentStatusChanged({
      id: agentId,
      name: input.name,
      type: agentType,
      status: AgentStatus.IDLE,
      config: config,
      currentTask: undefined,
      queuedTaskCount: 0,
      completedTaskCount: 0,
      errorCount: 0,
      lastActivity: new Date(),
      health: {
        healthy: true,
        status: AgentStatus.IDLE,
        lastHeartbeat: new Date(),
      },
    });

    return result;
  },

  // --------------------------------------------------------------------------
  // Workflow Mutations
  // --------------------------------------------------------------------------

  /**
   * Start a workflow execution
   */
  startWorkflow: async (
    _parent: unknown,
    args: { input: unknown },
    context: MutationContext
  ) => {
    const input = validateInput(StartWorkflowInputSchema, args.input, 'StartWorkflowInput');
    const { workflowRegistry } = context;

    if (!workflowRegistry) {
      throw new GraphQLError('Workflow registry not available', {
        extensions: { code: 'SERVICE_UNAVAILABLE' },
      });
    }

    // Get workflow definition
    const workflow = workflowRegistry.get(input.workflowId);
    if (!workflow) {
      throw new GraphQLError(`Workflow not found: ${input.workflowId}`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Generate execution ID before starting
    const executionId = randomUUID();

    // Execute workflow (fire and forget - result will be published via subscription)
    workflowRegistry.execute(input.workflowId, {
      input: input.input,
      parallel: input.parallel,
      continueOnError: input.continueOnError,
      timeout: input.timeout,
    });

    const result = {
      id: executionId,
      workflowId: input.workflowId,
      workflow: {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        version: workflow.version,
        steps: workflow.steps.map(s => ({
          id: s.id,
          name: s.name,
          description: s.description,
          dependencies: s.dependencies,
          timeout: s.timeout,
          retries: s.retries,
          parallel: s.parallel ?? false,
          optional: s.optional ?? false,
          metadata: s.metadata,
        })),
        timeout: workflow.timeout,
        enableRollback: workflow.enableRollback ?? false,
        tags: workflow.tags ?? [],
        metadata: workflow.metadata,
      },
      status: 'RUNNING',
      input: input.input,
      output: null,
      state: {},
      steps: [],
      error: null,
      errorStack: null,
      createdAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      completedAt: null,
      durationMs: 0,
      progress: 0,
      currentStep: workflow.steps[0]?.name ?? null,
      rolledBack: false,
    };

    // Publish workflow progress
    publishWorkflowProgress({
      id: executionId,
      workflowId: input.workflowId,
      status: 'running',
      progress: 0,
      currentStep: workflow.steps[0]?.name ?? null,
      completedSteps: 0,
      totalSteps: workflow.steps.length,
      startedAt: new Date(),
    });

    return result;
  },

  /**
   * Cancel a running workflow
   */
  cancelWorkflow: async (
    _parent: unknown,
    args: { id: string },
    context: MutationContext
  ) => {
    const { workflowRegistry } = context;

    if (!workflowRegistry) {
      throw new GraphQLError('Workflow registry not available', {
        extensions: { code: 'SERVICE_UNAVAILABLE' },
      });
    }

    // Find execution
    const history = workflowRegistry.getHistory({ limit: 100 });
    const execution = history.find(e => e.id === args.id);

    if (!execution) {
      throw new GraphQLError(`Workflow execution not found: ${args.id}`, {
        extensions: { code: 'NOT_FOUND' },
      });
    }

    // Cancel the execution
    workflowRegistry.cancel(args.id);

    const result = {
      id: args.id,
      workflowId: execution.workflowId,
      workflow: null,
      status: 'CANCELLED',
      input: execution.input,
      output: null,
      state: execution.state,
      steps: Array.from(execution.steps.entries()).map(([stepId, step]) => ({
        stepId,
        status: step.status === 'running' ? 'CANCELLED' : step.status?.toUpperCase() ?? 'PENDING',
        result: step.result,
        error: step.error,
        startedAt: step.startedAt?.toISOString(),
        completedAt: step.completedAt?.toISOString(),
        durationMs: step.durationMs,
        attempts: step.attempts,
        skipped: step.skipped ?? false,
        skipReason: step.skipReason,
      })),
      error: 'Workflow cancelled by user',
      errorStack: null,
      createdAt: execution.createdAt.toISOString(),
      startedAt: execution.startedAt?.toISOString() ?? null,
      completedAt: new Date().toISOString(),
      durationMs: execution.durationMs ?? 0,
      progress: execution.progress,
      currentStep: null,
      rolledBack: false,
    };

    // Publish workflow progress (cancelled)
    publishWorkflowProgress({
      id: args.id,
      workflowId: execution.workflowId,
      status: 'cancelled',
      progress: execution.progress,
      currentStep: undefined,
      completedSteps: 0,
      totalSteps: 0,
      startedAt: execution.startedAt,
      error: 'Workflow cancelled by user',
    });

    return result;
  },

  // --------------------------------------------------------------------------
  // Cache Mutations
  // --------------------------------------------------------------------------

  /**
   * Clear the cache
   */
  clearCache: async (
    _parent: unknown,
    _args: unknown,
    context: MutationContext
  ) => {
    const { cache } = context;

    if (!cache) {
      return {
        success: false,
        entriesCleared: 0,
        message: 'Cache not available',
      };
    }

    const statsBefore = cache.getStats();
    const entriesCleared = statsBefore.entries ?? 0;

    cache.clear();

    const result = {
      success: true,
      entriesCleared,
      message: `Cleared ${entriesCleared} cache entries`,
    };

    return result;
  },

  // --------------------------------------------------------------------------
  // Checkpoint Mutations
  // --------------------------------------------------------------------------

  /**
   * Create a checkpoint of the current graph state
   */
  createCheckpoint: async (
    _parent: unknown,
    args: { input: unknown },
    context: MutationContext
  ) => {
    const input = validateInput(CheckpointInputSchema, args.input, 'CheckpointInput');
    const { db, cache } = context;

    const checkpointId = randomUUID();
    const now = new Date();

    // Get nodes to include in checkpoint
    let nodes: KnowledgeNode[];
    if (input.nodeIds && input.nodeIds.length > 0) {
      nodes = input.nodeIds
        .map(id => db.getNode(id))
        .filter((n): n is KnowledgeNode => n !== null);
    } else {
      nodes = db.getAllNodes();
    }

    // Collect edges if requested
    let edges: GraphEdge[] = [];
    if (input.includeEdges) {
      for (const node of nodes) {
        const outgoing = db.getOutgoingEdges(node.id);
        edges = edges.concat(outgoing);
      }
    }

    // Create checkpoint data
    const checkpointData = {
      id: checkpointId,
      name: input.name,
      description: input.description,
      createdAt: now.toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      nodes: nodes.map(n => ({ id: n.id, title: n.title, type: n.type })),
      edges: edges.map(e => ({ source: e.source, target: e.target, type: e.type })),
      metadata: input.metadata,
    };

    // Store checkpoint in cache with long TTL (24 hours) if cache is available
    if (cache) {
      cache.set(`checkpoint:${checkpointId}`, checkpointData, { ttl: 86400000 });
    }

    const result = {
      id: checkpointId,
      name: input.name,
      description: input.description,
      createdAt: now.toISOString(),
      nodeCount: nodes.length,
      edgeCount: edges.length,
      size: JSON.stringify(checkpointData).length,
      metadata: input.metadata,
    };

    return result;
  },

  // --------------------------------------------------------------------------
  // Vector Mutations
  // --------------------------------------------------------------------------

  /**
   * Upsert a vector embedding
   */
  vectorUpsert: async (
    _parent: unknown,
    args: { input: unknown },
    context: MutationContext
  ) => {
    const input = validateInput(VectorUpsertInputSchema, args.input, 'VectorUpsertInput');
    const { cache } = context;

    if (!cache) {
      return {
        success: false,
        id: input.id,
        dimensions: input.vector.length,
        isUpdate: false,
        namespace: input.namespace ?? null,
      };
    }

    const now = new Date();

    // Store vector in cache (in a real implementation, this would go to a vector store)
    const vectorKey = input.namespace
      ? `vector:${input.namespace}:${input.id}`
      : `vector:${input.id}`;

    const vectorEntry = {
      id: input.id,
      vector: input.vector,
      metadata: input.metadata ?? {},
      namespace: input.namespace,
      dimensions: input.vector.length,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };

    // Check if exists for upsert logic
    const existing = cache.get(vectorKey);
    const isUpdate = existing !== undefined;

    cache.set(vectorKey, vectorEntry, { ttl: 3600000 }); // 1 hour TTL

    const result = {
      success: true,
      id: input.id,
      dimensions: input.vector.length,
      isUpdate,
      namespace: input.namespace ?? null,
    };

    return result;
  },

  // --------------------------------------------------------------------------
  // Trajectory Mutations
  // --------------------------------------------------------------------------

  /**
   * Record an agent trajectory for learning
   */
  recordTrajectory: async (
    _parent: unknown,
    args: { input: unknown },
    context: MutationContext
  ) => {
    const input = validateInput(TrajectoryInputSchema, args.input, 'TrajectoryInput');
    const { cache } = context;

    const trajectoryId = randomUUID();
    const now = new Date();

    // Calculate total duration
    const totalDuration = input.steps.reduce((sum, step) => sum + step.duration, 0);

    // Format steps with timestamps
    const steps = input.steps.map((step, index) => ({
      action: step.action,
      state: step.state,
      outcome: step.outcome.toUpperCase(),
      duration: step.duration,
      timestamp: step.timestamp ?? now.toISOString(),
      metadata: step.metadata,
    }));

    const trajectory = {
      id: trajectoryId,
      agentId: input.agentId,
      workflowId: input.workflowId ?? null,
      steps,
      startedAt: now.toISOString(),
      completedAt: now.toISOString(),
      success: input.success,
      totalDuration,
      metadata: input.metadata ?? null,
    };

    // Store trajectory in cache if available
    if (cache) {
      cache.set(`trajectory:${trajectoryId}`, trajectory, { ttl: 86400000 }); // 24 hour TTL

      // Also store in agent's trajectory list
      const agentTrajectoriesKey = `agent:${input.agentId}:trajectories`;
      const existingTrajectories = cache.get(agentTrajectoriesKey) as string[] ?? [];
      existingTrajectories.push(trajectoryId);
      cache.set(agentTrajectoriesKey, existingTrajectories, { ttl: 86400000 });
    }

    return trajectory;
  },
};

export default mutationResolvers;
