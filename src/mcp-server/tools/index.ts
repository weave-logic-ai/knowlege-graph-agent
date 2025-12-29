/**
 * MCP Tools Module
 *
 * Central export for all MCP tool modules.
 *
 * @module mcp-server/tools
 */

// Re-export registry functions
export {
  initializeTools,
  registerTool,
  getToolHandler,
  getToolDefinition,
  getToolDefinitions,
  getToolCategories,
  hasToolRegistered,
  getToolCount,
  clearRegistry,
  getToolRegistry,
  getDatabase,
  getCache,
  getProjectRoot,
} from './registry.js';

// Re-export graph tools
export {
  graphQueryTool,
  createGraphQueryHandler,
  graphStatsTool,
  createGraphStatsHandler,
  graphGenerateTool,
  createGraphGenerateHandler,
} from './graph/index.js';

// Re-export search tools
export {
  searchNodesTool,
  createSearchNodesHandler,
  searchTagsTool,
  createSearchTagsHandler,
} from './search/index.js';

// Re-export agent tools
export {
  agentSpawnTool,
  createAgentSpawnHandler,
  agentListTool,
  createAgentListHandler,
} from './agents/index.js';

// Re-export health tool
export {
  healthCheckTool,
  createHealthCheckHandler,
} from './health.js';

// Re-export audit tools
export {
  auditQueryTool,
  createAuditQueryHandler,
  auditCheckpointTool,
  createAuditCheckpointHandler,
  getLatestCheckpoint,
  syncStatusTool,
  createSyncStatusHandler,
  triggerManualSync,
  auditToolDefinitions,
} from './audit/index.js';

// Re-export vector tools
export {
  vectorSearchTool,
  createVectorSearchHandler,
  vectorUpsertTool,
  createVectorUpsertHandler,
  trajectoryListTool,
  createTrajectoryListHandler,
} from './vector/index.js';

// Re-export workflow tools
export {
  workflowStartTool,
  createWorkflowStartHandler,
  workflowStatusTool,
  createWorkflowStatusHandler,
  workflowListTool,
  createWorkflowListHandler,
} from './workflow/index.js';
