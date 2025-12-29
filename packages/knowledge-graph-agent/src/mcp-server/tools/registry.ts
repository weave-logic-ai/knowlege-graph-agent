/**
 * Tool Registry
 *
 * Central registry for all MCP tools. Manages tool definitions and handlers.
 *
 * @module mcp-server/tools/registry
 */

import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { ToolHandler, ToolHandlerEntry, ToolCategory } from '../types/index.js';
import { createLogger } from '../../utils/index.js';
import type { KnowledgeGraphDatabase } from '../../core/database.js';
import type { ShadowCache } from '../../core/cache.js';

const logger = createLogger('tool-registry');

/**
 * Registry of all registered tools
 */
const toolRegistry: Map<string, ToolHandlerEntry> = new Map();

/**
 * Tool categories for organization
 */
const toolCategories: Map<string, ToolCategory> = new Map();

/**
 * Shared context for tool handlers
 */
let sharedDatabase: KnowledgeGraphDatabase | undefined;
let sharedCache: ShadowCache | undefined;
let sharedProjectRoot: string | undefined;

/**
 * Initialize tools with dependencies
 *
 * @param database - Knowledge graph database instance
 * @param cache - Shadow cache instance
 * @param projectRoot - Project root path
 */
export async function initializeTools(
  database?: KnowledgeGraphDatabase,
  cache?: ShadowCache,
  projectRoot?: string
): Promise<void> {
  sharedDatabase = database;
  sharedCache = cache;
  sharedProjectRoot = projectRoot;

  logger.info('Initializing tool registry', {
    hasDatabase: !!database,
    hasCache: !!cache,
    projectRoot,
  });

  // Register core tools
  await registerCoreTools();

  logger.info(`Tool registry initialized with ${toolRegistry.size} tools`);
}

/**
 * Get shared database instance
 */
export function getDatabase(): KnowledgeGraphDatabase | undefined {
  return sharedDatabase;
}

/**
 * Get shared cache instance
 */
export function getCache(): ShadowCache | undefined {
  return sharedCache;
}

/**
 * Get shared project root
 */
export function getProjectRoot(): string | undefined {
  return sharedProjectRoot;
}

/**
 * Register a tool with its handler
 *
 * @param name - Tool name
 * @param definition - Tool definition
 * @param handler - Tool handler function
 * @param category - Optional category name
 */
export function registerTool(
  name: string,
  definition: Tool,
  handler: ToolHandler,
  category?: string
): void {
  if (toolRegistry.has(name)) {
    logger.warn(`Tool ${name} already registered, overwriting`);
  }

  toolRegistry.set(name, { definition, handler });

  // Add to category if specified
  if (category) {
    let cat = toolCategories.get(category);
    if (!cat) {
      cat = { name: category, description: '', tools: [] };
      toolCategories.set(category, cat);
    }
    cat.tools.push(definition);
  }

  logger.debug(`Registered tool: ${name}`, { category });
}

/**
 * Get tool handler by name
 *
 * @param name - Tool name
 * @returns Tool handler or undefined
 */
export function getToolHandler(name: string): ToolHandler | undefined {
  const entry = toolRegistry.get(name);
  return entry?.handler;
}

/**
 * Get tool definition by name
 *
 * @param name - Tool name
 * @returns Tool definition or undefined
 */
export function getToolDefinition(name: string): Tool | undefined {
  const entry = toolRegistry.get(name);
  return entry?.definition;
}

/**
 * Get all tool definitions
 *
 * @returns Array of all tool definitions
 */
export function getToolDefinitions(): Tool[] {
  return Array.from(toolRegistry.values()).map(entry => entry.definition);
}

/**
 * Get all tool categories
 *
 * @returns Array of tool categories
 */
export function getToolCategories(): ToolCategory[] {
  return Array.from(toolCategories.values());
}

/**
 * Check if a tool is registered
 *
 * @param name - Tool name
 * @returns true if tool is registered
 */
export function hasToolRegistered(name: string): boolean {
  return toolRegistry.has(name);
}

/**
 * Get count of registered tools
 *
 * @returns Number of registered tools
 */
export function getToolCount(): number {
  return toolRegistry.size;
}

/**
 * Clear all registered tools (for testing)
 */
export function clearRegistry(): void {
  toolRegistry.clear();
  toolCategories.clear();
  logger.debug('Tool registry cleared');
}

/**
 * Get the tool registry Map
 *
 * @returns The tool registry Map
 */
export function getToolRegistry(): Map<string, ToolHandlerEntry> {
  return toolRegistry;
}

/**
 * Register core knowledge graph tools
 */
async function registerCoreTools(): Promise<void> {
  // Graph Query Tool
  registerTool(
    'kg_query',
    {
      name: 'kg_query',
      description: 'Query the knowledge graph for nodes matching criteria',
      inputSchema: {
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Search query string',
          },
          type: {
            type: 'string',
            description: 'Filter by node type',
            enum: ['concept', 'technical', 'feature', 'primitive', 'service', 'guide', 'standard', 'integration'],
          },
          status: {
            type: 'string',
            description: 'Filter by node status',
            enum: ['draft', 'active', 'deprecated', 'archived'],
          },
          tag: {
            type: 'string',
            description: 'Filter by tag',
          },
          limit: {
            type: 'number',
            description: 'Maximum results to return',
            default: 50,
          },
          includeContent: {
            type: 'boolean',
            description: 'Include full content in results',
            default: false,
          },
        },
      },
    },
    async (params) => {
      const db = getDatabase();
      if (!db) {
        return { success: false, error: 'Database not initialized' };
      }

      try {
        let nodes;
        const limit = (params.limit as number) || 50;
        const includeContent = params.includeContent as boolean;

        if (params.query) {
          nodes = db.searchNodes(params.query as string, limit);
        } else if (params.type) {
          nodes = db.getNodesByType(params.type as any).slice(0, limit);
        } else if (params.status) {
          nodes = db.getNodesByStatus(params.status as any).slice(0, limit);
        } else if (params.tag) {
          nodes = db.getNodesByTag(params.tag as string).slice(0, limit);
        } else {
          nodes = db.getAllNodes().slice(0, limit);
        }

        const results = nodes.map(node => ({
          id: node.id,
          path: node.path,
          title: node.title,
          type: node.type,
          status: node.status,
          tags: node.tags,
          wordCount: node.wordCount,
          outgoingLinkCount: node.outgoingLinks.length,
          incomingLinkCount: node.incomingLinks.length,
          ...(includeContent ? { content: node.content } : {}),
        }));

        return {
          success: true,
          data: results,
          metadata: { itemCount: results.length },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    'graph'
  );

  // Graph Stats Tool
  registerTool(
    'kg_stats',
    {
      name: 'kg_stats',
      description: 'Get statistics about the knowledge graph',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    async () => {
      const db = getDatabase();
      if (!db) {
        return { success: false, error: 'Database not initialized' };
      }

      try {
        const stats = db.getStats();
        return { success: true, data: stats };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    'graph'
  );

  // Get Node Tool
  registerTool(
    'kg_get_node',
    {
      name: 'kg_get_node',
      description: 'Get a specific node by ID or path',
      inputSchema: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'Node ID',
          },
          path: {
            type: 'string',
            description: 'Node path (alternative to ID)',
          },
        },
      },
    },
    async (params) => {
      const db = getDatabase();
      if (!db) {
        return { success: false, error: 'Database not initialized' };
      }

      try {
        let node;
        if (params.id) {
          node = db.getNode(params.id as string);
        } else if (params.path) {
          node = db.getNodeByPath(params.path as string);
        } else {
          return { success: false, error: 'Either id or path required' };
        }

        if (!node) {
          return { success: false, error: 'Node not found' };
        }

        return { success: true, data: node };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    'graph'
  );

  // Cache Stats Tool
  registerTool(
    'kg_cache_stats',
    {
      name: 'kg_cache_stats',
      description: 'Get cache statistics',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    async () => {
      const cache = getCache();
      if (!cache) {
        return { success: false, error: 'Cache not initialized' };
      }

      try {
        const stats = cache.getStats();
        return { success: true, data: stats };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    'cache'
  );

  // Health Check Tool
  registerTool(
    'kg_health',
    {
      name: 'kg_health',
      description: 'Check health status of knowledge graph components',
      inputSchema: {
        type: 'object',
        properties: {},
      },
    },
    async () => {
      const db = getDatabase();
      const cache = getCache();

      return {
        success: true,
        data: {
          database: !!db,
          cache: !!cache,
          projectRoot: getProjectRoot() || null,
          toolCount: getToolCount(),
        },
      };
    },
    'system'
  );

  // List Tags Tool
  registerTool(
    'kg_list_tags',
    {
      name: 'kg_list_tags',
      description: 'List all tags with their usage counts',
      inputSchema: {
        type: 'object',
        properties: {
          limit: {
            type: 'number',
            description: 'Maximum tags to return',
            default: 100,
          },
        },
      },
    },
    async (params) => {
      const db = getDatabase();
      if (!db) {
        return { success: false, error: 'Database not initialized' };
      }

      try {
        const limit = (params.limit as number) || 100;
        const tags = db.getAllTags().slice(0, limit);
        return {
          success: true,
          data: tags,
          metadata: { itemCount: tags.length },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    },
    'graph'
  );

  // Register agent tools
  await registerAgentTools();

  // Register workflow tools
  await registerWorkflowTools();

  // Register vector tools
  await registerVectorTools();

  // Register audit tools
  await registerAuditTools();

  logger.debug('Core tools registered');
}

/**
 * Register agent management tools
 */
async function registerAgentTools(): Promise<void> {
  const { getRegistry: getAgentRegistry, AgentType, TaskPriority, createTaskId } = await import('../../agents/index.js');

  // Agent Spawn Tool
  registerTool(
    'kg_agent_spawn',
    {
      name: 'kg_agent_spawn',
      description: 'Spawn a specialized agent to perform a task',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Agent type (researcher, coder, tester, analyst, architect)',
            enum: ['researcher', 'coder', 'tester', 'analyst', 'architect'],
          },
          name: { type: 'string', description: 'Custom agent name (optional)' },
          task: { type: 'string', description: 'Task for the agent to perform' },
          options: {
            type: 'object',
            description: 'Agent-specific options',
            properties: {
              timeout: { type: 'number', description: 'Task timeout in ms' },
              maxRetries: { type: 'number', description: 'Maximum retries' },
              priority: {
                type: 'string',
                description: 'Task priority (low, medium, high, critical)',
                enum: ['low', 'medium', 'high', 'critical'],
              },
            },
          },
        },
        required: ['type', 'task'],
      },
    },
    async (params) => {
      const startTime = Date.now();
      const { type, name, task, options = {} } = params || {};

      if (!type || typeof type !== 'string') {
        return {
          success: false,
          error: 'Agent type is required',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      if (!task || typeof task !== 'string') {
        return {
          success: false,
          error: 'Task description is required',
          metadata: { executionTime: Date.now() - startTime },
        };
      }

      try {
        const registry = getAgentRegistry();

        // Map string type to AgentType enum
        const typeMap: Record<string, typeof AgentType[keyof typeof AgentType]> = {
          researcher: AgentType.RESEARCHER,
          coder: AgentType.CODER,
          tester: AgentType.TESTER,
          analyst: AgentType.ANALYST,
          architect: AgentType.ARCHITECT,
        };
        const agentType = typeMap[type.toLowerCase()] || AgentType.CUSTOM;

        // Check if agent type is registered
        if (!registry.isRegistered(agentType)) {
          return {
            success: false,
            error: `Agent type '${type}' is not registered`,
            metadata: { executionTime: Date.now() - startTime },
          };
        }

        const typedOptions = options as { timeout?: number; maxRetries?: number; priority?: string };

        // Spawn agent
        const agent = await registry.spawn(agentType, {
          name: typeof name === 'string' ? name : `${type}-agent`,
          taskTimeout: typedOptions.timeout,
          retry: typedOptions.maxRetries
            ? { maxRetries: typedOptions.maxRetries, backoffMs: 1000 }
            : undefined,
        });

        // Create and execute task
        const priorityMap: Record<string, typeof TaskPriority[keyof typeof TaskPriority]> = {
          low: TaskPriority.LOW,
          medium: TaskPriority.MEDIUM,
          high: TaskPriority.HIGH,
          critical: TaskPriority.CRITICAL,
        };

        const agentTask = {
          id: createTaskId(),
          description: task,
          priority: priorityMap[typedOptions.priority?.toLowerCase() || 'medium'] || TaskPriority.MEDIUM,
          input: { data: { task }, context: {} },
          createdAt: new Date(),
        };

        const result = await agent.execute(agentTask);

        return {
          success: result.success,
          data: {
            agentId: agent.config.id,
            agentType: type,
            agentName: agent.config.name,
            taskId: agentTask.id,
            taskResult: result.data,
            metrics: result.metrics,
          },
          error: result.error?.message,
          metadata: {
            executionTime: Date.now() - startTime,
            status: agent.getStatus(),
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          metadata: { executionTime: Date.now() - startTime },
        };
      }
    },
    'agents'
  );

  // Agent List Tool
  registerTool(
    'kg_agent_list',
    {
      name: 'kg_agent_list',
      description: 'List all active agents and their status',
      inputSchema: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description: 'Filter by agent type',
            enum: ['researcher', 'coder', 'tester', 'analyst', 'architect', 'reviewer', 'coordinator', 'optimizer', 'documenter'],
          },
          status: {
            type: 'string',
            description: 'Filter by status',
            enum: ['idle', 'running', 'completed', 'failed', 'paused', 'terminated'],
          },
        },
      },
    },
    async (params) => {
      const startTime = Date.now();
      const { type, status } = params || {};

      try {
        const { getRegistry: getAgentRegistry, AgentType, AgentStatus } = await import('../../agents/index.js');
        const registry = getAgentRegistry();

        let agents = registry.listInstances();

        // Filter by type
        if (type && typeof type === 'string') {
          const typeMap: Record<string, typeof AgentType[keyof typeof AgentType]> = {
            researcher: AgentType.RESEARCHER,
            coder: AgentType.CODER,
            tester: AgentType.TESTER,
            analyst: AgentType.ANALYST,
            architect: AgentType.ARCHITECT,
            reviewer: AgentType.REVIEWER,
            coordinator: AgentType.COORDINATOR,
            optimizer: AgentType.OPTIMIZER,
            documenter: AgentType.DOCUMENTER,
          };
          const agentType = typeMap[type.toLowerCase()];
          if (agentType) {
            agents = agents.filter(a => a.type === agentType);
          }
        }

        // Filter by status
        if (status && typeof status === 'string') {
          const statusMap: Record<string, typeof AgentStatus[keyof typeof AgentStatus]> = {
            idle: AgentStatus.IDLE,
            running: AgentStatus.RUNNING,
            completed: AgentStatus.COMPLETED,
            failed: AgentStatus.FAILED,
            paused: AgentStatus.PAUSED,
            terminated: AgentStatus.TERMINATED,
          };
          const agentStatus = statusMap[status.toLowerCase()];
          if (agentStatus) {
            agents = agents.filter(a => a.status === agentStatus);
          }
        }

        const agentDetails = agents.map(agent => {
          const instance = registry.get(agent.id);
          return {
            id: agent.id,
            type: agent.type,
            name: agent.name,
            status: agent.status,
            currentTask: instance?.state.currentTask?.id,
            queuedTasks: instance?.state.taskQueue.length || 0,
            completedTasks: instance?.state.completedTasks.length || 0,
          };
        });

        const stats = registry.getStats();

        return {
          success: true,
          data: {
            agents: agentDetails,
            count: agents.length,
            stats: {
              totalInstances: stats.totalInstances,
              registeredTypes: stats.registeredTypes,
            },
          },
          metadata: {
            executionTime: Date.now() - startTime,
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          metadata: { executionTime: Date.now() - startTime },
        };
      }
    },
    'agents'
  );

  // Health Check Tool (enhanced)
  registerTool(
    'kg_health_check',
    {
      name: 'kg_health_check',
      description: 'Check the health status of the knowledge graph server',
      inputSchema: {
        type: 'object',
        properties: {
          detailed: {
            type: 'boolean',
            description: 'Include detailed diagnostics',
            default: false,
          },
          components: {
            type: 'array',
            description: 'Specific components to check (database, cache, agents, memory)',
            items: {
              type: 'string',
              enum: ['database', 'cache', 'agents', 'memory'],
            },
          },
        },
      },
    },
    async (params) => {
      const startTime = Date.now();
      const { detailed = false, components: requestedComponents } = params || {};

      try {
        const db = getDatabase();
        const cache = getCache();
        const { getRegistry: getAgentRegistry } = await import('../../agents/index.js');

        const checkComponents = (requestedComponents as string[]) || ['database', 'cache', 'agents', 'memory'];
        const componentResults: Record<string, { status: string; message?: string; details?: Record<string, unknown> }> = {};

        // Check database
        if (checkComponents.includes('database')) {
          if (!db) {
            componentResults.database = { status: 'unhealthy', message: 'Database not configured' };
          } else {
            try {
              const stats = db.getStats();
              componentResults.database = {
                status: 'healthy',
                message: 'Database operational',
                details: detailed ? { totalNodes: stats.totalNodes, totalEdges: stats.totalEdges } : undefined,
              };
            } catch (error) {
              componentResults.database = { status: 'unhealthy', message: error instanceof Error ? error.message : 'Check failed' };
            }
          }
        }

        // Check cache
        if (checkComponents.includes('cache')) {
          if (!cache) {
            componentResults.cache = { status: 'degraded', message: 'Cache not configured' };
          } else {
            try {
              const stats = cache.getStats();
              componentResults.cache = {
                status: 'healthy',
                message: 'Cache operational',
                details: detailed ? { entries: stats.totalEntries, hitRate: stats.hitRate } : undefined,
              };
            } catch (error) {
              componentResults.cache = { status: 'unhealthy', message: error instanceof Error ? error.message : 'Check failed' };
            }
          }
        }

        // Check agents
        if (checkComponents.includes('agents')) {
          try {
            const agentRegistry = getAgentRegistry();
            const stats = agentRegistry.getStats();
            const failedCount = stats.instancesByStatus['failed'] || 0;

            componentResults.agents = {
              status: failedCount > 0 ? 'degraded' : 'healthy',
              message: failedCount > 0 ? `${failedCount} agent(s) failed` : 'Agent system operational',
              details: detailed ? { instances: stats.totalInstances, types: stats.registeredTypes } : undefined,
            };
          } catch (error) {
            componentResults.agents = { status: 'unhealthy', message: error instanceof Error ? error.message : 'Check failed' };
          }
        }

        // Check memory
        if (checkComponents.includes('memory')) {
          const memUsage = process.memoryUsage();
          const heapUsageRatio = memUsage.heapUsed / memUsage.heapTotal;

          componentResults.memory = {
            status: heapUsageRatio > 0.9 ? 'unhealthy' : heapUsageRatio > 0.75 ? 'degraded' : 'healthy',
            message: `Heap usage: ${Math.round(heapUsageRatio * 100)}%`,
            details: detailed ? {
              heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
              heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100,
            } : undefined,
          };
        }

        // Determine overall status
        const statuses = Object.values(componentResults).map(c => c.status);
        const overallStatus = statuses.some(s => s === 'unhealthy') ? 'unhealthy'
          : statuses.some(s => s === 'degraded') ? 'degraded' : 'healthy';

        const health: Record<string, unknown> = {
          status: overallStatus,
          components: Object.fromEntries(
            Object.entries(componentResults).map(([name, result]) => [
              name,
              detailed ? result : result.status,
            ])
          ),
          timestamp: new Date().toISOString(),
        };

        if (detailed) {
          Object.assign(health, {
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform,
          });
        }

        return {
          success: true,
          data: health,
          metadata: { executionTime: Date.now() - startTime },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          data: { status: 'unhealthy' },
          metadata: { executionTime: Date.now() - startTime },
        };
      }
    },
    'system'
  );

  logger.debug('Agent tools registered');
}

/**
 * Register workflow management tools
 */
async function registerWorkflowTools(): Promise<void> {
  const {
    workflowStartTool,
    createWorkflowStartHandler,
    workflowStatusTool,
    createWorkflowStatusHandler,
    workflowListTool,
    createWorkflowListHandler,
  } = await import('./workflow/index.js');

  registerTool(
    workflowStartTool.name,
    workflowStartTool,
    createWorkflowStartHandler(),
    'workflow'
  );

  registerTool(
    workflowStatusTool.name,
    workflowStatusTool,
    createWorkflowStatusHandler(),
    'workflow'
  );

  registerTool(
    workflowListTool.name,
    workflowListTool,
    createWorkflowListHandler(),
    'workflow'
  );

  logger.debug('Workflow tools registered');
}

/**
 * Register vector search and trajectory tools
 */
async function registerVectorTools(): Promise<void> {
  const {
    vectorSearchTool,
    createVectorSearchHandler,
    vectorUpsertTool,
    createVectorUpsertHandler,
    trajectoryListTool,
    createTrajectoryListHandler,
  } = await import('./vector/index.js');

  registerTool(
    vectorSearchTool.name,
    vectorSearchTool,
    createVectorSearchHandler(),
    'vector'
  );

  registerTool(
    vectorUpsertTool.name,
    vectorUpsertTool,
    createVectorUpsertHandler(),
    'vector'
  );

  registerTool(
    trajectoryListTool.name,
    trajectoryListTool,
    createTrajectoryListHandler(),
    'vector'
  );

  logger.debug('Vector tools registered');
}

/**
 * Register audit and syndication tools
 */
async function registerAuditTools(): Promise<void> {
  const {
    auditQueryTool,
    createAuditQueryHandler,
    auditCheckpointTool,
    createAuditCheckpointHandler,
    syncStatusTool,
    createSyncStatusHandler,
  } = await import('./audit/index.js');

  registerTool(
    auditQueryTool.name,
    auditQueryTool,
    createAuditQueryHandler(),
    'audit'
  );

  registerTool(
    auditCheckpointTool.name,
    auditCheckpointTool,
    createAuditCheckpointHandler(),
    'audit'
  );

  registerTool(
    syncStatusTool.name,
    syncStatusTool,
    createSyncStatusHandler(),
    'audit'
  );

  logger.debug('Audit tools registered');
}
