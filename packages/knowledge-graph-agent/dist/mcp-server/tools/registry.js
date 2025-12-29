import { createLogger } from "../../utils/logger.js";
const logger = createLogger("tool-registry");
const toolRegistry = /* @__PURE__ */ new Map();
const toolCategories = /* @__PURE__ */ new Map();
let sharedDatabase;
let sharedCache;
let sharedProjectRoot;
async function initializeTools(database, cache, projectRoot) {
  sharedDatabase = database;
  sharedCache = cache;
  sharedProjectRoot = projectRoot;
  logger.info("Initializing tool registry", {
    hasDatabase: !!database,
    hasCache: !!cache,
    projectRoot
  });
  await registerCoreTools();
  logger.info(`Tool registry initialized with ${toolRegistry.size} tools`);
}
function getDatabase() {
  return sharedDatabase;
}
function getCache() {
  return sharedCache;
}
function getProjectRoot() {
  return sharedProjectRoot;
}
function registerTool(name, definition, handler, category) {
  if (toolRegistry.has(name)) {
    logger.warn(`Tool ${name} already registered, overwriting`);
  }
  toolRegistry.set(name, { definition, handler });
  if (category) {
    let cat = toolCategories.get(category);
    if (!cat) {
      cat = { name: category, description: "", tools: [] };
      toolCategories.set(category, cat);
    }
    cat.tools.push(definition);
  }
  logger.debug(`Registered tool: ${name}`, { category });
}
function getToolHandler(name) {
  const entry = toolRegistry.get(name);
  return entry?.handler;
}
function getToolDefinition(name) {
  const entry = toolRegistry.get(name);
  return entry?.definition;
}
function getToolDefinitions() {
  return Array.from(toolRegistry.values()).map((entry) => entry.definition);
}
function getToolCategories() {
  return Array.from(toolCategories.values());
}
function getToolCount() {
  return toolRegistry.size;
}
async function registerCoreTools() {
  registerTool(
    "kg_query",
    {
      name: "kg_query",
      description: "Query the knowledge graph for nodes matching criteria",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query string"
          },
          type: {
            type: "string",
            description: "Filter by node type",
            enum: ["concept", "technical", "feature", "primitive", "service", "guide", "standard", "integration"]
          },
          status: {
            type: "string",
            description: "Filter by node status",
            enum: ["draft", "active", "deprecated", "archived"]
          },
          tag: {
            type: "string",
            description: "Filter by tag"
          },
          limit: {
            type: "number",
            description: "Maximum results to return",
            default: 50
          },
          includeContent: {
            type: "boolean",
            description: "Include full content in results",
            default: false
          }
        }
      }
    },
    async (params) => {
      const db = getDatabase();
      if (!db) {
        return { success: false, error: "Database not initialized" };
      }
      try {
        let nodes;
        const limit = params.limit || 50;
        const includeContent = params.includeContent;
        if (params.query) {
          nodes = db.searchNodes(params.query, limit);
        } else if (params.type) {
          nodes = db.getNodesByType(params.type).slice(0, limit);
        } else if (params.status) {
          nodes = db.getNodesByStatus(params.status).slice(0, limit);
        } else if (params.tag) {
          nodes = db.getNodesByTag(params.tag).slice(0, limit);
        } else {
          nodes = db.getAllNodes().slice(0, limit);
        }
        const results = nodes.map((node) => ({
          id: node.id,
          path: node.path,
          title: node.title,
          type: node.type,
          status: node.status,
          tags: node.tags,
          wordCount: node.wordCount,
          outgoingLinkCount: node.outgoingLinks.length,
          incomingLinkCount: node.incomingLinks.length,
          ...includeContent ? { content: node.content } : {}
        }));
        return {
          success: true,
          data: results,
          metadata: { itemCount: results.length }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    },
    "graph"
  );
  registerTool(
    "kg_stats",
    {
      name: "kg_stats",
      description: "Get statistics about the knowledge graph",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    async () => {
      const db = getDatabase();
      if (!db) {
        return { success: false, error: "Database not initialized" };
      }
      try {
        const stats = db.getStats();
        return { success: true, data: stats };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    },
    "graph"
  );
  registerTool(
    "kg_get_node",
    {
      name: "kg_get_node",
      description: "Get a specific node by ID or path",
      inputSchema: {
        type: "object",
        properties: {
          id: {
            type: "string",
            description: "Node ID"
          },
          path: {
            type: "string",
            description: "Node path (alternative to ID)"
          }
        }
      }
    },
    async (params) => {
      const db = getDatabase();
      if (!db) {
        return { success: false, error: "Database not initialized" };
      }
      try {
        let node;
        if (params.id) {
          node = db.getNode(params.id);
        } else if (params.path) {
          node = db.getNodeByPath(params.path);
        } else {
          return { success: false, error: "Either id or path required" };
        }
        if (!node) {
          return { success: false, error: "Node not found" };
        }
        return { success: true, data: node };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    },
    "graph"
  );
  registerTool(
    "kg_cache_stats",
    {
      name: "kg_cache_stats",
      description: "Get cache statistics",
      inputSchema: {
        type: "object",
        properties: {}
      }
    },
    async () => {
      const cache = getCache();
      if (!cache) {
        return { success: false, error: "Cache not initialized" };
      }
      try {
        const stats = cache.getStats();
        return { success: true, data: stats };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    },
    "cache"
  );
  registerTool(
    "kg_health",
    {
      name: "kg_health",
      description: "Check health status of knowledge graph components",
      inputSchema: {
        type: "object",
        properties: {}
      }
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
          toolCount: getToolCount()
        }
      };
    },
    "system"
  );
  registerTool(
    "kg_list_tags",
    {
      name: "kg_list_tags",
      description: "List all tags with their usage counts",
      inputSchema: {
        type: "object",
        properties: {
          limit: {
            type: "number",
            description: "Maximum tags to return",
            default: 100
          }
        }
      }
    },
    async (params) => {
      const db = getDatabase();
      if (!db) {
        return { success: false, error: "Database not initialized" };
      }
      try {
        const limit = params.limit || 100;
        const tags = db.getAllTags().slice(0, limit);
        return {
          success: true,
          data: tags,
          metadata: { itemCount: tags.length }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    },
    "graph"
  );
  await registerAgentTools();
  await registerWorkflowTools();
  await registerVectorTools();
  await registerAuditTools();
  logger.debug("Core tools registered");
}
async function registerAgentTools() {
  const { getRegistry: getAgentRegistry, AgentType, TaskPriority, createTaskId } = await import("../../agents/index.js");
  registerTool(
    "kg_agent_spawn",
    {
      name: "kg_agent_spawn",
      description: "Spawn a specialized agent to perform a task",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Agent type (researcher, coder, tester, analyst, architect)",
            enum: ["researcher", "coder", "tester", "analyst", "architect"]
          },
          name: { type: "string", description: "Custom agent name (optional)" },
          task: { type: "string", description: "Task for the agent to perform" },
          options: {
            type: "object",
            description: "Agent-specific options",
            properties: {
              timeout: { type: "number", description: "Task timeout in ms" },
              maxRetries: { type: "number", description: "Maximum retries" },
              priority: {
                type: "string",
                description: "Task priority (low, medium, high, critical)",
                enum: ["low", "medium", "high", "critical"]
              }
            }
          }
        },
        required: ["type", "task"]
      }
    },
    async (params) => {
      const startTime = Date.now();
      const { type, name, task, options = {} } = params || {};
      if (!type || typeof type !== "string") {
        return {
          success: false,
          error: "Agent type is required",
          metadata: { executionTime: Date.now() - startTime }
        };
      }
      if (!task || typeof task !== "string") {
        return {
          success: false,
          error: "Task description is required",
          metadata: { executionTime: Date.now() - startTime }
        };
      }
      try {
        const registry = getAgentRegistry();
        const typeMap = {
          researcher: AgentType.RESEARCHER,
          coder: AgentType.CODER,
          tester: AgentType.TESTER,
          analyst: AgentType.ANALYST,
          architect: AgentType.ARCHITECT
        };
        const agentType = typeMap[type.toLowerCase()] || AgentType.CUSTOM;
        if (!registry.isRegistered(agentType)) {
          return {
            success: false,
            error: `Agent type '${type}' is not registered`,
            metadata: { executionTime: Date.now() - startTime }
          };
        }
        const typedOptions = options;
        const agent = await registry.spawn(agentType, {
          name: typeof name === "string" ? name : `${type}-agent`,
          taskTimeout: typedOptions.timeout,
          retry: typedOptions.maxRetries ? { maxRetries: typedOptions.maxRetries, backoffMs: 1e3 } : void 0
        });
        const priorityMap = {
          low: TaskPriority.LOW,
          medium: TaskPriority.MEDIUM,
          high: TaskPriority.HIGH,
          critical: TaskPriority.CRITICAL
        };
        const agentTask = {
          id: createTaskId(),
          description: task,
          priority: priorityMap[typedOptions.priority?.toLowerCase() || "medium"] || TaskPriority.MEDIUM,
          input: { data: { task }, context: {} },
          createdAt: /* @__PURE__ */ new Date()
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
            metrics: result.metrics
          },
          error: result.error?.message,
          metadata: {
            executionTime: Date.now() - startTime,
            status: agent.getStatus()
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          metadata: { executionTime: Date.now() - startTime }
        };
      }
    },
    "agents"
  );
  registerTool(
    "kg_agent_list",
    {
      name: "kg_agent_list",
      description: "List all active agents and their status",
      inputSchema: {
        type: "object",
        properties: {
          type: {
            type: "string",
            description: "Filter by agent type",
            enum: ["researcher", "coder", "tester", "analyst", "architect", "reviewer", "coordinator", "optimizer", "documenter"]
          },
          status: {
            type: "string",
            description: "Filter by status",
            enum: ["idle", "running", "completed", "failed", "paused", "terminated"]
          }
        }
      }
    },
    async (params) => {
      const startTime = Date.now();
      const { type, status } = params || {};
      try {
        const { getRegistry: getAgentRegistry2, AgentType: AgentType2, AgentStatus } = await import("../../agents/index.js");
        const registry = getAgentRegistry2();
        let agents = registry.listInstances();
        if (type && typeof type === "string") {
          const typeMap = {
            researcher: AgentType2.RESEARCHER,
            coder: AgentType2.CODER,
            tester: AgentType2.TESTER,
            analyst: AgentType2.ANALYST,
            architect: AgentType2.ARCHITECT,
            reviewer: AgentType2.REVIEWER,
            coordinator: AgentType2.COORDINATOR,
            optimizer: AgentType2.OPTIMIZER,
            documenter: AgentType2.DOCUMENTER
          };
          const agentType = typeMap[type.toLowerCase()];
          if (agentType) {
            agents = agents.filter((a) => a.type === agentType);
          }
        }
        if (status && typeof status === "string") {
          const statusMap = {
            idle: AgentStatus.IDLE,
            running: AgentStatus.RUNNING,
            completed: AgentStatus.COMPLETED,
            failed: AgentStatus.FAILED,
            paused: AgentStatus.PAUSED,
            terminated: AgentStatus.TERMINATED
          };
          const agentStatus = statusMap[status.toLowerCase()];
          if (agentStatus) {
            agents = agents.filter((a) => a.status === agentStatus);
          }
        }
        const agentDetails = agents.map((agent) => {
          const instance = registry.get(agent.id);
          return {
            id: agent.id,
            type: agent.type,
            name: agent.name,
            status: agent.status,
            currentTask: instance?.state.currentTask?.id,
            queuedTasks: instance?.state.taskQueue.length || 0,
            completedTasks: instance?.state.completedTasks.length || 0
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
              registeredTypes: stats.registeredTypes
            }
          },
          metadata: {
            executionTime: Date.now() - startTime
          }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          metadata: { executionTime: Date.now() - startTime }
        };
      }
    },
    "agents"
  );
  registerTool(
    "kg_health_check",
    {
      name: "kg_health_check",
      description: "Check the health status of the knowledge graph server",
      inputSchema: {
        type: "object",
        properties: {
          detailed: {
            type: "boolean",
            description: "Include detailed diagnostics",
            default: false
          },
          components: {
            type: "array",
            description: "Specific components to check (database, cache, agents, memory)",
            items: {
              type: "string",
              enum: ["database", "cache", "agents", "memory"]
            }
          }
        }
      }
    },
    async (params) => {
      const startTime = Date.now();
      const { detailed = false, components: requestedComponents } = params || {};
      try {
        const db = getDatabase();
        const cache = getCache();
        const { getRegistry: getAgentRegistry2 } = await import("../../agents/index.js");
        const checkComponents = requestedComponents || ["database", "cache", "agents", "memory"];
        const componentResults = {};
        if (checkComponents.includes("database")) {
          if (!db) {
            componentResults.database = { status: "unhealthy", message: "Database not configured" };
          } else {
            try {
              const stats = db.getStats();
              componentResults.database = {
                status: "healthy",
                message: "Database operational",
                details: detailed ? { totalNodes: stats.totalNodes, totalEdges: stats.totalEdges } : void 0
              };
            } catch (error) {
              componentResults.database = { status: "unhealthy", message: error instanceof Error ? error.message : "Check failed" };
            }
          }
        }
        if (checkComponents.includes("cache")) {
          if (!cache) {
            componentResults.cache = { status: "degraded", message: "Cache not configured" };
          } else {
            try {
              const stats = cache.getStats();
              componentResults.cache = {
                status: "healthy",
                message: "Cache operational",
                details: detailed ? { entries: stats.totalEntries, hitRate: stats.hitRate } : void 0
              };
            } catch (error) {
              componentResults.cache = { status: "unhealthy", message: error instanceof Error ? error.message : "Check failed" };
            }
          }
        }
        if (checkComponents.includes("agents")) {
          try {
            const agentRegistry = getAgentRegistry2();
            const stats = agentRegistry.getStats();
            const failedCount = stats.instancesByStatus["failed"] || 0;
            componentResults.agents = {
              status: failedCount > 0 ? "degraded" : "healthy",
              message: failedCount > 0 ? `${failedCount} agent(s) failed` : "Agent system operational",
              details: detailed ? { instances: stats.totalInstances, types: stats.registeredTypes } : void 0
            };
          } catch (error) {
            componentResults.agents = { status: "unhealthy", message: error instanceof Error ? error.message : "Check failed" };
          }
        }
        if (checkComponents.includes("memory")) {
          const memUsage = process.memoryUsage();
          const heapUsageRatio = memUsage.heapUsed / memUsage.heapTotal;
          componentResults.memory = {
            status: heapUsageRatio > 0.9 ? "unhealthy" : heapUsageRatio > 0.75 ? "degraded" : "healthy",
            message: `Heap usage: ${Math.round(heapUsageRatio * 100)}%`,
            details: detailed ? {
              heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100,
              heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100
            } : void 0
          };
        }
        const statuses = Object.values(componentResults).map((c) => c.status);
        const overallStatus = statuses.some((s) => s === "unhealthy") ? "unhealthy" : statuses.some((s) => s === "degraded") ? "degraded" : "healthy";
        const health = {
          status: overallStatus,
          components: Object.fromEntries(
            Object.entries(componentResults).map(([name, result]) => [
              name,
              detailed ? result : result.status
            ])
          ),
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        if (detailed) {
          Object.assign(health, {
            uptime: process.uptime(),
            nodeVersion: process.version,
            platform: process.platform
          });
        }
        return {
          success: true,
          data: health,
          metadata: { executionTime: Date.now() - startTime }
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
          data: { status: "unhealthy" },
          metadata: { executionTime: Date.now() - startTime }
        };
      }
    },
    "system"
  );
  logger.debug("Agent tools registered");
}
async function registerWorkflowTools() {
  const {
    workflowStartTool,
    createWorkflowStartHandler,
    workflowStatusTool,
    createWorkflowStatusHandler,
    workflowListTool,
    createWorkflowListHandler
  } = await import("./workflow/index.js");
  registerTool(
    workflowStartTool.name,
    workflowStartTool,
    createWorkflowStartHandler(),
    "workflow"
  );
  registerTool(
    workflowStatusTool.name,
    workflowStatusTool,
    createWorkflowStatusHandler(),
    "workflow"
  );
  registerTool(
    workflowListTool.name,
    workflowListTool,
    createWorkflowListHandler(),
    "workflow"
  );
  logger.debug("Workflow tools registered");
}
async function registerVectorTools() {
  const {
    vectorSearchTool,
    createVectorSearchHandler,
    vectorUpsertTool,
    createVectorUpsertHandler,
    trajectoryListTool,
    createTrajectoryListHandler
  } = await import("./vector/index.js");
  registerTool(
    vectorSearchTool.name,
    vectorSearchTool,
    createVectorSearchHandler(),
    "vector"
  );
  registerTool(
    vectorUpsertTool.name,
    vectorUpsertTool,
    createVectorUpsertHandler(),
    "vector"
  );
  registerTool(
    trajectoryListTool.name,
    trajectoryListTool,
    createTrajectoryListHandler(),
    "vector"
  );
  logger.debug("Vector tools registered");
}
async function registerAuditTools() {
  const {
    auditQueryTool,
    createAuditQueryHandler,
    auditCheckpointTool,
    createAuditCheckpointHandler,
    syncStatusTool,
    createSyncStatusHandler
  } = await import("./audit/index.js");
  registerTool(
    auditQueryTool.name,
    auditQueryTool,
    createAuditQueryHandler(),
    "audit"
  );
  registerTool(
    auditCheckpointTool.name,
    auditCheckpointTool,
    createAuditCheckpointHandler(),
    "audit"
  );
  registerTool(
    syncStatusTool.name,
    syncStatusTool,
    createSyncStatusHandler(),
    "audit"
  );
  logger.debug("Audit tools registered");
}
export {
  getCache,
  getDatabase,
  getProjectRoot,
  getToolCategories,
  getToolCount,
  getToolDefinition,
  getToolDefinitions,
  getToolHandler,
  initializeTools,
  registerTool
};
//# sourceMappingURL=registry.js.map
