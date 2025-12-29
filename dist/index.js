import { createDatabase } from "./core/database.js";
import { KnowledgeGraphDatabase } from "./core/database.js";
import { docsExist, initDocs } from "./generators/docs-init.js";
import { getDocsPath } from "./generators/docs-init.js";
import { generateAndSave } from "./generators/graph-generator.js";
import { generateGraph, updateGraph } from "./generators/graph-generator.js";
import { updateClaudeMd } from "./generators/claude-md.js";
import { addSection, generateClaudeMd, getSectionTemplate, listSectionTemplates } from "./generators/claude-md.js";
import { KnowledgeGraphManager, createKnowledgeGraph } from "./core/graph.js";
import { ShadowCache, createShadowCache, loadShadowCache } from "./core/cache.js";
import { addFrontmatter, convertDocs, validateFrontmatter } from "./generators/docs-convert.js";
import { analyzeDocs } from "./generators/docs-analyzer.js";
import { ClaudeFlowIntegration, createClaudeFlowIntegration, generateMcpConfig } from "./integrations/claude-flow.js";
import { createCLI } from "./cli/index.js";
import { AgentStatus, AgentType, MessageType, TaskPriority, createAgentId, createMessageId, createTaskId } from "./agents/types.js";
import { AgentRegistry, createRegistry, getRegistry, registerDefaultAgents, setDefaultRegistry } from "./agents/registry.js";
import { BaseAgent, createTask, isAgentError, isAgentResult } from "./agents/base-agent.js";
import { RulesEngine, createAgentCompletionRule, createConditionalRule, createFileChangeLogRule, createGraphUpdateNotificationRule, createRule, createRulesEngine } from "./agents/rules-engine.js";
import { ResearcherAgent } from "./agents/researcher-agent.js";
import { CoderAgent } from "./agents/coder-agent.js";
import { TesterAgent } from "./agents/tester-agent.js";
import { AnalystAgent } from "./agents/analyst-agent.js";
import { ArchitectAgent } from "./agents/architect-agent.js";
import "fs/promises";
import "path";
import { ErrorCategory, ErrorSeverity, KnowledgeGraphError, classifyError, createConfigurationError, createResourceError, createValidationError, isPermanentError, isRateLimitError, isRetryableError, isTransientError } from "./utils/error-taxonomy.js";
import { CircuitBreaker, CircuitOpenError, CircuitState, RetriesExhaustedError, calculateBackoff, retry, retryable, sleep, withCircuitBreaker, withFallback, withRetry } from "./utils/error-recovery.js";
import { LogLevel, Logger, createLogger, createProgressLogger, getLogger, parseLogLevel, setDefaultLogger } from "./utils/logger.js";
import { AgentEquilibriumSelector, createAgentEquilibriumSelector, createEquilibriumTask } from "./equilibrium/agent-equilibrium.js";
import "events";
import { SeedGenerator, analyzeSeed, initPrimitives } from "./cultivation/seed-generator.js";
import { DeepAnalyzer, analyzeDeep, createDeepAnalyzer } from "./cultivation/deep-analyzer.js";
import { ComplianceStatus, GraphLayer, IRBStatus, SOPCategory, SOPPriority } from "./sops/types.js";
import { getAllSOPs, getCategories, getSOPById, getSOPsByCategory, getSOPsRequiringIRB, getSopCount, searchSOPs } from "./sops/registry.js";
import { checkCompliance, checkSOPCompliance, meetsMinimumCompliance } from "./sops/compliance-checker.js";
import { analyzeGaps, calculateProgress, getGapsForSOP, getQuickWins } from "./sops/gap-analyzer.js";
import { addComplianceOverlay, addProjectLayer, createMultiLayerGraph, createSOPFocusedSubgraph, exportToVisualizationFormat, filterByComplianceStatus, filterByLayer, getComplianceSummary, getGapNodes, toggleLayerVisibility } from "./sops/overlay-manager.js";
import { WorkflowStatus } from "./workflows/types.js";
import { WorkflowRegistry, createWorkflowRegistry } from "./workflows/registry.js";
import { VaultMemorySync, createVaultMemorySync } from "./memory/vault-sync.js";
import { KnowledgeGraphMCPServer, createMCPServer, runServer } from "./mcp-server/server.js";
import { getToolCategories, getToolDefinition, getToolDefinitions, getToolHandler, initializeTools, registerTool } from "./mcp-server/tools/registry.js";
import { createLocalConfig, createPostgresConfig, createVercelConfig, createWorkflowConfig, defaultConfig, validateWorkflowConfig } from "./workflow/config.js";
import "./workflow/adapters/goap-adapter.js";
import "./workflow/services/workflow-service.js";
import { createErrorResult, createSuccessResult, handleError, handleToolCall } from "./mcp-server/handlers/index.js";
import { DEFAULT_DASHBOARD_PORT, DEFAULT_DATABASE_PATH, DEFAULT_GRAPHQL_PORT, HEALTH_CHECK_INTERVAL, SHUTDOWN_TIMEOUT } from "./server/types.js";
import { SharedServices, createDefaultConfig, createSharedServices, getSharedServices } from "./server/shared-services.js";
import { ServerManager, createServerManager } from "./server/manager.js";
import { ServiceContainer, createServiceContainer, getServiceContainer, hasServiceContainer, shutdownServiceContainer } from "./server/container.js";
import { TypedEventBus, createNodeTypeFilter, createSourceFilter, createSubscriptionIterator, createTypedEventBus } from "./server/event-bus.js";
import { createGraphQLServer } from "./graphql/server.js";
import { createContextFactory, hasScope, isGraphQLContext, requireAuth, requireScope } from "./graphql/context.js";
import { DateTimeScalar, FilePathScalar, JSONScalar, UUIDScalar, customScalars, scalarTypeDefs } from "./graphql/scalars.js";
import { FileWatcherService, ServiceManager, createServiceManager } from "./services/index.js";
import { ConfigManager, createConfigManager, getDefaultConfig } from "./config/index.js";
import { HealthMonitor, createCacheCheck, createDatabaseCheck, createDiskCheck, createHealthMonitor, createMemoryCheck } from "./health/index.js";
import { Chunker, chunkDocument, createChunker } from "./chunking/index.js";
import { BackupManager, IntegrityChecker, checkDatabaseIntegrity, createBackupManager, createIntegrityChecker } from "./recovery/index.js";
import { AdvancedCache, createAdvancedCache } from "./caching/index.js";
import { DecisionTracker, createDecisionTracker, getDecisionTracker } from "./reasoning/index.js";
import { createDefaultPluginMetadata, createPluginId, isAnalysisResult, isAnalyzerPlugin, isPluginManifest, isValidSemver } from "./plugins/types.js";
import { PluginLoaderImpl, PluginManagerImpl, PluginRegistryImpl, createDefaultPluginManager, createPluginLoader, createPluginManager, createPluginRegistry } from "./plugins/manager.js";
import { AdvancedPluginRegistry, createAdvancedPluginRegistry } from "./plugins/registry.js";
import { AdvancedPluginLoader, createAdvancedPluginLoader } from "./plugins/loader.js";
import { DependencyHealthAnalyzerPlugin, DependencyHealthPlugin, analyzeDependencyHealth, createDependencyHealthAnalyzerPlugin, createDependencyHealthPlugin, enhanceDependenciesWithHealth } from "./plugins/analyzers/dependency-health/index.js";
import { CodeComplexityPlugin, analyzeComplexity, pluginMetadata, createComplexityPlugin, registerWithSeedGenerator } from "./plugins/analyzers/code-complexity/index.js";
import { DependencyHealthAnalyzer, createDependencyHealthAnalyzer } from "./plugins/analyzers/dependency-health/analyzer.js";
import { DependencyGraphGenerator, createDependencyGraphGenerator } from "./plugins/analyzers/dependency-health/graph-generator.js";
import { NpmClient, createNpmClient } from "./plugins/analyzers/dependency-health/npm-client.js";
import { VulnerabilityChecker, createVulnerabilityChecker } from "./plugins/analyzers/dependency-health/vulnerability.js";
import { CodeComplexityAnalyzerPlugin, createCodeComplexityAnalyzerPlugin } from "./plugins/analyzers/code-complexity/plugin.js";
import { CodeComplexityAnalyzer, analyzeFileComplexity, analyzeProjectComplexity } from "./plugins/analyzers/code-complexity/analyzer.js";
import { ComplexityGraphGenerator, generateComplexityNodes } from "./plugins/analyzers/code-complexity/graph-generator.js";
import { calculateCognitiveComplexity, calculateCyclomaticComplexity, calculateHalsteadMetrics, calculateMaintainabilityIndex, calculateMaxNestingDepth } from "./plugins/analyzers/code-complexity/metrics.js";
import { DEFAULT_THRESHOLDS, EMPTY_HALSTEAD_METRICS } from "./plugins/analyzers/code-complexity/types.js";
async function quickInit(options) {
  const {
    projectRoot,
    docsPath = "docs",
    generateGraph: genGraph = true,
    updateClaudeMd: updateClaude = true
  } = options;
  const result = {
    success: true,
    docsCreated: false,
    graphGenerated: false,
    claudeMdUpdated: false,
    errors: []
  };
  try {
    const { existsSync, mkdirSync, writeFileSync } = await import("fs");
    const { join } = await import("path");
    const kgDir = join(projectRoot, ".kg");
    if (!existsSync(kgDir)) {
      mkdirSync(kgDir, { recursive: true });
    }
    const dbPath = join(kgDir, "knowledge.db");
    const db = createDatabase(dbPath);
    db.setMetadata("initialized", (/* @__PURE__ */ new Date()).toISOString());
    if (!docsExist(projectRoot, docsPath)) {
      const docsResult = await initDocs({
        projectRoot,
        docsPath,
        includeExamples: true,
        detectFramework: true
      });
      result.docsCreated = docsResult.success;
      if (!docsResult.success) {
        result.errors.push(...docsResult.errors);
      }
    }
    if (genGraph && docsExist(projectRoot, docsPath)) {
      const graphResult = await generateAndSave(
        {
          projectRoot,
          outputPath: join(projectRoot, docsPath)
        },
        dbPath
      );
      result.graphGenerated = graphResult.success;
      if (!graphResult.success) {
        result.errors.push(...graphResult.stats.errors);
      }
    }
    if (updateClaude) {
      const claudeResult = await updateClaudeMd({
        projectRoot,
        includeKnowledgeGraph: true,
        includeClaudeFlow: true
      });
      result.claudeMdUpdated = claudeResult.created || claudeResult.updated;
    }
    db.close();
    result.success = result.errors.length === 0;
  } catch (error) {
    result.success = false;
    result.errors.push(String(error));
  }
  return result;
}
export {
  AdvancedCache,
  AdvancedPluginLoader,
  AdvancedPluginRegistry,
  AgentEquilibriumSelector,
  AgentRegistry,
  AgentStatus,
  AgentType,
  AnalystAgent,
  ArchitectAgent,
  BackupManager,
  BaseAgent,
  Chunker,
  CircuitBreaker,
  CircuitOpenError,
  CircuitState,
  ClaudeFlowIntegration,
  CodeComplexityAnalyzer,
  CodeComplexityAnalyzerPlugin,
  CodeComplexityPlugin,
  CoderAgent,
  ComplexityGraphGenerator,
  ComplianceStatus,
  ConfigManager,
  DEFAULT_DASHBOARD_PORT,
  DEFAULT_DATABASE_PATH,
  DEFAULT_GRAPHQL_PORT,
  DEFAULT_THRESHOLDS,
  DateTimeScalar,
  DecisionTracker,
  DeepAnalyzer,
  DependencyGraphGenerator,
  DependencyHealthAnalyzer,
  DependencyHealthAnalyzerPlugin,
  DependencyHealthPlugin,
  EMPTY_HALSTEAD_METRICS,
  ErrorCategory,
  ErrorSeverity,
  FilePathScalar,
  FileWatcherService,
  GraphLayer,
  HEALTH_CHECK_INTERVAL,
  HealthMonitor,
  IRBStatus,
  IntegrityChecker,
  JSONScalar,
  KnowledgeGraphDatabase,
  KnowledgeGraphError,
  KnowledgeGraphMCPServer,
  KnowledgeGraphManager,
  LogLevel,
  Logger,
  MessageType,
  NpmClient,
  PluginLoaderImpl,
  PluginManagerImpl,
  PluginRegistryImpl,
  ResearcherAgent,
  RetriesExhaustedError,
  RulesEngine,
  SHUTDOWN_TIMEOUT,
  SOPCategory,
  SOPPriority,
  SeedGenerator,
  ServerManager,
  ServiceContainer,
  ServiceManager,
  ShadowCache,
  SharedServices,
  TaskPriority,
  TesterAgent,
  TypedEventBus,
  UUIDScalar,
  VaultMemorySync,
  VulnerabilityChecker,
  WorkflowRegistry,
  WorkflowStatus,
  addComplianceOverlay,
  addFrontmatter,
  addProjectLayer,
  addSection,
  analyzeComplexity,
  analyzeDeep,
  analyzeDependencyHealth,
  analyzeDocs,
  analyzeFileComplexity,
  analyzeGaps,
  analyzeProjectComplexity,
  analyzeSeed,
  calculateBackoff,
  calculateCognitiveComplexity,
  calculateCyclomaticComplexity,
  calculateHalsteadMetrics,
  calculateMaintainabilityIndex,
  calculateMaxNestingDepth,
  calculateProgress,
  checkCompliance,
  checkDatabaseIntegrity,
  checkSOPCompliance,
  chunkDocument,
  classifyError,
  pluginMetadata as codeComplexityMetadata,
  convertDocs,
  createAdvancedCache,
  createAdvancedPluginLoader,
  createAdvancedPluginRegistry,
  createAgentCompletionRule,
  createAgentEquilibriumSelector,
  createAgentId,
  createBackupManager,
  createCLI,
  createCacheCheck,
  createChunker,
  createClaudeFlowIntegration,
  createCodeComplexityAnalyzerPlugin,
  createComplexityPlugin,
  createConditionalRule,
  createConfigManager,
  createConfigurationError,
  createContextFactory,
  createDatabase,
  createDatabaseCheck,
  createDecisionTracker,
  createDeepAnalyzer,
  createDefaultConfig,
  createDefaultPluginManager,
  createDefaultPluginMetadata,
  createDependencyGraphGenerator,
  createDependencyHealthAnalyzer,
  createDependencyHealthAnalyzerPlugin,
  createDependencyHealthPlugin,
  createDiskCheck,
  createEquilibriumTask,
  createErrorResult,
  createFileChangeLogRule,
  createGraphQLServer,
  createGraphUpdateNotificationRule,
  createHealthMonitor,
  createIntegrityChecker,
  createKnowledgeGraph,
  createLocalConfig,
  createLogger,
  createMCPServer,
  createMemoryCheck,
  createMessageId,
  createMultiLayerGraph,
  createNodeTypeFilter,
  createNpmClient,
  createPluginId,
  createPluginLoader,
  createPluginManager,
  createPluginRegistry,
  createPostgresConfig,
  createProgressLogger,
  createRegistry,
  createResourceError,
  createRule,
  createRulesEngine,
  createSOPFocusedSubgraph,
  createServerManager,
  createServiceContainer,
  createServiceManager,
  createShadowCache,
  createSharedServices,
  createSourceFilter,
  createSubscriptionIterator,
  createSuccessResult,
  createTask,
  createTaskId,
  createTypedEventBus,
  createValidationError,
  createVaultMemorySync,
  createVercelConfig,
  createVulnerabilityChecker,
  createWorkflowConfig,
  createWorkflowRegistry,
  customScalars,
  defaultConfig as defaultWorkflowConfig,
  docsExist,
  enhanceDependenciesWithHealth,
  exportToVisualizationFormat,
  filterByComplianceStatus,
  filterByLayer,
  generateAndSave,
  generateClaudeMd,
  generateComplexityNodes,
  generateGraph,
  generateMcpConfig,
  getAllSOPs,
  getCategories,
  getComplianceSummary,
  getDecisionTracker,
  getDefaultConfig,
  getDocsPath,
  getGapNodes,
  getGapsForSOP,
  getLogger,
  getQuickWins,
  getRegistry,
  getSOPById,
  getSOPsByCategory,
  getSOPsRequiringIRB,
  getSectionTemplate,
  getServiceContainer,
  getSharedServices,
  getSopCount,
  getToolCategories,
  getToolDefinition,
  getToolDefinitions,
  getToolHandler,
  handleError,
  handleToolCall,
  hasScope,
  hasServiceContainer,
  initDocs,
  initPrimitives,
  initializeTools,
  isAgentError,
  isAgentResult,
  isAnalysisResult,
  isAnalyzerPlugin,
  isGraphQLContext,
  isPermanentError,
  isPluginManifest,
  isRateLimitError,
  isRetryableError,
  isTransientError,
  isValidSemver,
  listSectionTemplates,
  loadShadowCache,
  meetsMinimumCompliance,
  parseLogLevel,
  quickInit,
  registerDefaultAgents,
  registerTool,
  registerWithSeedGenerator,
  requireAuth,
  requireScope,
  retry,
  retryable,
  runServer,
  scalarTypeDefs,
  searchSOPs,
  setDefaultLogger,
  setDefaultRegistry,
  shutdownServiceContainer,
  sleep,
  toggleLayerVisibility,
  updateClaudeMd,
  updateGraph,
  validateFrontmatter,
  validateWorkflowConfig,
  withCircuitBreaker,
  withFallback,
  withRetry
};
//# sourceMappingURL=index.js.map
