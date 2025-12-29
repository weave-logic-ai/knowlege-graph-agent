/**
 * Knowledge Graph Agent
 *
 * NPM library for creating and managing knowledge graphs for Claude Code.
 *
 * @packageDocumentation
 */

// Internal imports for quickInit
import { createDatabase as _createDatabase } from './core/database.js';
import { initDocs as _initDocs, docsExist as _docsExist } from './generators/docs-init.js';
import { generateAndSave as _generateAndSave } from './generators/graph-generator.js';
import { updateClaudeMd as _updateClaudeMd } from './generators/claude-md.js';

// ============================================================================
// Core
// ============================================================================

export {
  KnowledgeGraphManager,
  createKnowledgeGraph,
} from './core/graph.js';

export {
  KnowledgeGraphDatabase,
  createDatabase,
} from './core/database.js';

// Cache exports
export {
  ShadowCache,
  createShadowCache,
  loadShadowCache,
} from './core/cache.js';

export type {
  FileMetadata,
  FileType,
  ChangeType,
  FileChange,
  CacheStats,
  ShadowCacheOptions,
} from './core/cache.js';

export type {
  // Node types
  NodeType,
  NodeStatus,
  NodeLink,
  NodeFrontmatter,
  KnowledgeNode,

  // Graph types
  GraphEdge,
  GraphMetadata,
  GraphStats,
  KnowledgeGraph,

  // Configuration
  KGConfig,
  ConfigSchema,

  // Generator types
  GeneratorOptions,
  GeneratedDocument,
  DocsInitOptions,
  DocsInitResult,

  // Integration types
  MemoryEntry,
  SyncResult,

  // CLAUDE.md types
  ClaudeMdSection,
  ClaudeMdTemplate,
  ClaudeMdGeneratorOptions,
} from './core/types.js';

// ============================================================================
// Generators
// ============================================================================

export {
  generateGraph,
  generateAndSave,
  updateGraph,
} from './generators/graph-generator.js';

export {
  initDocs,
  docsExist,
  getDocsPath,
} from './generators/docs-init.js';

export {
  generateClaudeMd,
  updateClaudeMd,
  addSection,
  getSectionTemplate,
  listSectionTemplates,
} from './generators/claude-md.js';

// Conversion exports
export {
  convertDocs,
  addFrontmatter,
  validateFrontmatter,
} from './generators/docs-convert.js';

export type {
  ConvertOptions,
  ConvertResult,
  FrontmatterOptions,
  FrontmatterResult,
} from './generators/docs-convert.js';

// Analyzer exports
export {
  analyzeDocs,
} from './generators/docs-analyzer.js';

export type {
  AnalyzerOptions,
  AnalyzedDoc,
  AnalyzerResult,
} from './generators/docs-analyzer.js';

// ============================================================================
// Integrations
// ============================================================================

export {
  ClaudeFlowIntegration,
  createClaudeFlowIntegration,
  generateMcpConfig,
} from './integrations/claude-flow.js';

// ============================================================================
// CLI
// ============================================================================

export { createCLI } from './cli/index.js';

// ============================================================================
// Agents
// ============================================================================

export {
  // Agent system core
  AgentType,
  AgentStatus,
  TaskPriority,
  MessageType,
  createMessageId,
  createTaskId,
  createAgentId,

  // Registry
  AgentRegistry,
  getRegistry,
  createRegistry,
  setDefaultRegistry,
  registerDefaultAgents,

  // Base Agent
  BaseAgent,
  createTask,
  isAgentResult,
  isAgentError,

  // Specialized Agents
  ResearcherAgent,
  CoderAgent,
  TesterAgent,
  AnalystAgent,
  ArchitectAgent,

  // Rules Engine
  RulesEngine,
  createRulesEngine,
  createRule,
  createConditionalRule,
  createFileChangeLogRule,
  createGraphUpdateNotificationRule,
  createAgentCompletionRule,
} from './agents/index.js';

export type {
  // Agent types
  AgentConfig,
  ResearcherAgentConfig,
  CoderAgentConfig,
  TesterAgentConfig,
  AnalystAgentConfig,
  ArchitectAgentConfig,
  SpecializedAgentConfig,
  TaskInput,
  AgentTask,
  AgentResult as AgentSystemResult,
  AgentError,
  ExecutionMetrics,
  ResultArtifact,
  AgentMessage,
  TaskRequestMessage,
  TaskResponseMessage,
  StatusMessage,
  ErrorMessage,
  CoordinationMessage,
  AgentMessageUnion,
  AgentState,
  AgentFactory,
  AgentInstance,
  AgentCapability,
  AgentHealthCheck,
  RegistryOptions,
  SpawnOptions,

  // Rules Engine types
  RuleTrigger,
  RulePriority,
  RuleExecutionStatus,
  RuleContext,
  RuleCondition,
  RuleAction,
  AgentRule,
  RuleExecutionLog,
  RuleStatistics,
  EngineStatistics,
  RulesEngineConfig,
} from './agents/index.js';

// ============================================================================
// Cultivation
// ============================================================================

export {
  SeedGenerator,
  analyzeSeed,
  initPrimitives,
  DeepAnalyzer,
  createDeepAnalyzer,
  analyzeDeep,
} from './cultivation/index.js';

export type {
  VaultContext,
  Ecosystem,
  DependencyType,
  ServiceType,
  DependencyInfo,
  ServiceInfo,
  SeedAnalysis,
  DocumentMetadata as CultivationDocumentMetadata,
  GeneratedDocument as CultivationGeneratedDocument,
  CultivationReport,
  CultivationOptions,
  GapAnalysis as CultivationGapAnalysis,
  InitPrimitivesResult,
  DeepAnalyzerOptions,
  AgentResult,
  DeepAnalysisResult,
} from './cultivation/index.js';

// ============================================================================
// SOPs
// ============================================================================

export {
  // Enums
  SOPCategory,
  ComplianceStatus,
  SOPPriority,
  IRBStatus,
  GraphLayer,
  // Registry
  getSOPById,
  getSOPsByCategory,
  getSOPsRequiringIRB,
  searchSOPs,
  getAllSOPs,
  getSopCount,
  getCategories,
  // Compliance
  checkCompliance,
  checkSOPCompliance,
  meetsMinimumCompliance,
  // Gap Analysis
  analyzeGaps,
  getGapsForSOP,
  getQuickWins,
  calculateProgress,
  // Overlay Management
  createMultiLayerGraph,
  addProjectLayer,
  addComplianceOverlay,
  filterByLayer,
  filterByComplianceStatus,
  getComplianceSummary,
  getGapNodes,
  toggleLayerVisibility,
  exportToVisualizationFormat,
  createSOPFocusedSubgraph,
} from './sops/index.js';

export type {
  // SOP types
  SOPRequirement,
  SOPCheckpoint,
  SOPDefinition,
  SOPAssessment,
  ComplianceGap,
  LayerDefinition,
  LayerNode,
  LayerEdge,
  MultiLayerGraph,
  ComplianceReport,
  SOPFrontmatter,
  SOPConfig,
  // Compliance types
  ComplianceCheckOptions,
  ComplianceCheckResult,
  EvidenceItem,
  // Gap types
  GapAnalysisOptions,
  GapAnalysisResult,
  GapSummary,
  RemediationRoadmap,
  RemediationPhase,
  GapDependency,
  // Overlay types
  OverlayManagerOptions,
  NodeStyleConfig,
} from './sops/index.js';

// ============================================================================
// Workflows
// ============================================================================

export {
  WorkflowStatus,
  WorkflowRegistry,
  createWorkflowRegistry,
} from './workflows/index.js';

export type {
  StepContext,
  StepHandler,
  RollbackHandler,
  WorkflowStep,
  WorkflowDefinition,
  StepExecution,
  WorkflowExecution,
  WorkflowResult,
  WorkflowExecutionStats,
  WorkflowRegistryOptions,
  WorkflowListOptions,
  ExecutionHistoryOptions,
  WorkflowEventType,
  WorkflowEvent,
  WorkflowEventListener,
} from './workflows/index.js';

// ============================================================================
// Memory
// ============================================================================

export {
  VaultMemorySync,
  createVaultMemorySync,
} from './memory/index.js';

export type {
  SyncDirection,
  ConflictStrategy,
  SyncStatus,
  MemoryNode,
  SyncConflict,
  VaultSyncOptions,
  SyncOperationResult,
  FullSyncResult,
} from './memory/index.js';

// ============================================================================
// Utils
// ============================================================================

export {
  // Error Taxonomy
  ErrorCategory,
  ErrorSeverity,
  classifyError,
  isRetryableError,
  isTransientError,
  isRateLimitError,
  isPermanentError,
  KnowledgeGraphError,
  createValidationError,
  createConfigurationError,
  createResourceError,
  // Error Recovery
  withRetry,
  retry,
  withFallback,
  withCircuitBreaker,
  retryable,
  calculateBackoff,
  sleep,
  CircuitBreaker,
  CircuitState,
  RetriesExhaustedError,
  CircuitOpenError,
  // Logger
  Logger,
  LogLevel,
  getLogger,
  createLogger,
  setDefaultLogger,
  parseLogLevel,
  createProgressLogger,
} from './utils/index.js';

export type {
  ClassifiedError,
  RetryOptions,
  RetryResult,
  FallbackOptions,
  CircuitBreakerOptions,
  LoggerOptions,
  LogEntry,
  ProgressLogger,
} from './utils/index.js';

// ============================================================================
// MCP Server
// ============================================================================

export {
  KnowledgeGraphMCPServer,
  createMCPServer,
  runServer,
  initializeTools,
  registerTool,
  getToolHandler,
  getToolDefinition,
  getToolDefinitions,
  getToolCategories,
  handleToolCall,
  handleError,
  createErrorResult,
  createSuccessResult,
} from './mcp-server/index.js';

export type {
  MCPServerConfig,
  ServerHealth,
  ToolCategory,
  ToolHandler,
  ToolHandlerEntry,
  ToolResult,
  ToolContext,
  ToolInputSchema,
  ToolDefinition,
  GraphQueryParams,
  GraphNodeResult,
  AgentInvokeParams,
  AgentResult as MCPAgentResult,
  WorkflowParams,
  WorkflowResult as MCPWorkflowResult,
  MemoryParams,
  MemoryResult,
} from './mcp-server/index.js';

// ============================================================================
// Server Infrastructure
// ============================================================================

export {
  // Server Manager
  ServerManager,
  createServerManager,

  // Shared Services
  SharedServices,
  createSharedServices,
  getSharedServices,
  createDefaultConfig,

  // Service Container
  ServiceContainer,
  createServiceContainer,
  getServiceContainer,
  hasServiceContainer,
  shutdownServiceContainer,

  // TypedEventBus
  TypedEventBus,
  createTypedEventBus,
  createSubscriptionIterator,
  createNodeTypeFilter,
  createSourceFilter,

  // Constants
  DEFAULT_GRAPHQL_PORT,
  DEFAULT_DASHBOARD_PORT,
  DEFAULT_DATABASE_PATH,
  SHUTDOWN_TIMEOUT,
  HEALTH_CHECK_INTERVAL,
} from './server/index.js';

export type {
  // Configuration types
  ServerConfig,
  MCPServerConfig as ServerMCPConfig,
  GraphQLServerConfig,
  DashboardServerConfig,
  DatabaseServerConfig,
  CacheServerConfig,

  // State types
  ServerStatus,
  ServerState,
  ServerManagerState,

  // Health types
  ComponentHealth as ServerComponentHealth,
  HealthStatus as ServerHealthStatus,

  // Event types
  ServerEventType,
  ServerEvent,
  ServerEventListener,

  // Instance types
  HTTPServerInstance,
  MCPServerInstance,

  // CLI types
  ServeCommandOptions,
  ParsedServeOptions,

  // Interface types
  ISharedServices,
  IServerManager,

  // Service Container types
  ServiceInitState,
  ServiceDependency,
  ContainerConfig,
  ContainerEventType,

  // TypedEventBus types
  EventType as ServerEventTypeEnum,
  EventDataMap,
  EventEntry,
  EventFilter,
  EventHandler as ServerEventHandler,
  Unsubscribe,
  NodeEventData,
  RelationEventData,
  AgentEventData,
  WorkflowEventData,
  PluginEventData,
  HealthEventData,
  CacheEvictionData,
  EventTypeMetrics,
  EventBusMetrics,
  ITypedEventBus,
  TypedEventBusOptions,
} from './server/index.js';

// ============================================================================
// GraphQL
// ============================================================================

export {
  // Server
  createGraphQLServer,

  // Context
  createContextFactory,
  hasScope,
  requireAuth,
  requireScope,
  isGraphQLContext,

  // Scalars
  DateTimeScalar,
  JSONScalar,
  UUIDScalar,
  FilePathScalar,
  customScalars,
  scalarTypeDefs,
} from './graphql/index.js';

export type {
  // Server types
  GraphQLServerConfig as GraphQLServerOptions,
  GraphQLServerInstance,
  CorsConfig,
  HealthCheckResponse as GraphQLHealthCheckResponse,

  // Context types
  GraphQLContext,
  AuthResult,
  RequestMeta,
  RequestUtils,
  Services as GraphQLServices,
  ContextFactoryConfig,
} from './graphql/index.js';

// ============================================================================
// Services
// ============================================================================

export {
  ServiceManager,
  createServiceManager,
  FileWatcherService,
} from './services/index.js';

export type {
  ServiceStatus,
  ServiceType as ManagerServiceType,
  ServiceConfig,
  ServiceState,
  ServiceMetrics,
  ServiceHandler,
} from './services/index.js';

// ============================================================================
// Config
// ============================================================================

export {
  ConfigManager,
  createConfigManager,
  getDefaultConfig,
} from './config/index.js';

export type {
  KGConfiguration,
  DatabaseConfig,
  CacheConfig,
  AgentConfig as ConfigAgentConfig,
  ServicesConfig,
  LoggingConfig,
  ConfigMigration,
} from './config/index.js';

// ============================================================================
// Health
// ============================================================================

export {
  HealthMonitor,
  createHealthMonitor,
  createDatabaseCheck,
  createCacheCheck,
  createMemoryCheck,
  createDiskCheck,
} from './health/index.js';

export type {
  HealthStatus,
  ComponentHealth,
  SystemHealth,
  MemoryMetrics,
  PerformanceMetrics,
  HealthCheck,
  HealthMonitorConfig,
} from './health/index.js';

// ============================================================================
// Chunking
// ============================================================================

export {
  Chunker,
  createChunker,
  chunkDocument,
} from './chunking/index.js';

export type {
  ChunkStrategy,
  ChunkOptions,
  Chunk,
  ChunkMetadata,
  ChunkResult,
} from './chunking/index.js';

// ============================================================================
// Recovery
// ============================================================================

export {
  BackupManager,
  createBackupManager,
  IntegrityChecker,
  createIntegrityChecker,
  checkDatabaseIntegrity,
} from './recovery/index.js';

export type {
  BackupConfig,
  BackupInfo,
  RestoreResult,
  RecoveryOptions,
  IntegrityCheckResult,
  TableIntegrity,
} from './recovery/index.js';

// ============================================================================
// Advanced Caching
// ============================================================================

export {
  AdvancedCache,
  createAdvancedCache,
} from './caching/index.js';

export type {
  EvictionPolicy,
  CacheEntry,
  CacheConfig as AdvancedCacheConfig,
  CacheStats as AdvancedCacheStats,
} from './caching/index.js';

// ============================================================================
// Reasoning
// ============================================================================

export {
  DecisionTracker,
  createDecisionTracker,
  getDecisionTracker,
} from './reasoning/index.js';

export type {
  DecisionType,
  ConfidenceLevel,
  Decision,
  DecisionContext,
  Alternative,
  DecisionOutcome,
  ReasoningChain,
} from './reasoning/index.js';

// ============================================================================
// Workflow DevKit
// ============================================================================

export {
  createWorkflowConfig,
  validateWorkflowConfig,
  createPostgresConfig,
  createVercelConfig,
  createLocalConfig,
  defaultConfig as defaultWorkflowConfig,
} from './workflow/index.js';

export type {
  // Configuration types
  WorkflowConfig as WorkflowDevKitConfig,
  PostgresPoolConfig,
  PostgresWorldConfig,
  VercelWorldConfig,
  LocalWorldConfig,
  // World state types
  WorldState,
  // Event types
  NodeUpdateEvent,
  GapDetectedEvent,
  WorkflowCompleteEvent,
  WorkflowRunMetadata as DevKitRunMetadata,
  // Task types
  TaskSpec,
  DocumentGap,
  GapAnalysis as DevKitGapAnalysis,
  // GOAP types
  GOAPAction,
  GOAPGoal,
  GOAPPlanStep,
  GOAPPlan,
  GOAPPlanExtended,
  PlanExecutionResult,
  ReadinessEvaluation,
  // Execution types
  WorkflowExecutionOptions as DevKitExecutionOptions,
  WorkflowExecutionResult as DevKitExecutionResult,
  // Hook types
  HookHandler,
  HookRegistration,
} from './workflow/index.js';

// ============================================================================
// Plugins
// ============================================================================

// Plugin System - Core exports (includes types, manager, analyzers)
// This re-exports everything from plugins/index.js including:
// - Types: PluginType, PluginHook, PluginStatus, PluginCapability, PluginDependency,
//          PluginConfigSchema, KGPluginManifest, PluginMetadata, KGPlugin, AnalyzerPlugin,
//          PluginContext, PluginAPI, PluginCommand, PluginEventEmitter, PluginLoader,
//          PluginRegistry, PluginManager, PluginManagerConfig, DiscoveredPlugin,
//          PluginLoadOptions, PluginLoadResult, PluginRegistryEvents, AnalysisInput,
//          AnalysisResult, AnalysisStreamChunk, PluginFactory, PluginConstructor,
//          PluginModuleExport, PluginConfigType
// - Manager: PluginManagerImpl, PluginRegistryImpl, PluginLoaderImpl,
//            createPluginManager, createPluginRegistry, createPluginLoader,
//            createDefaultPluginManager
// - Analyzers: CodeComplexityPlugin, DependencyHealthPlugin, and related exports
export * from './plugins/index.js';

// ============================================================================
// Equilibrium (SPEC-006a)
// ============================================================================

export {
  AgentEquilibriumSelector,
  createAgentEquilibriumSelector,
  createEquilibriumTask,
} from './equilibrium/index.js';

export type {
  AgentParticipation,
  EquilibriumConfig,
  EquilibriumResult,
  Task as EquilibriumTask,
} from './equilibrium/index.js';

// ============================================================================
// Quick Start
// ============================================================================

/**
 * Quick start function for programmatic usage
 *
 * @example
 * ```typescript
 * import { quickInit } from '@weave-nn/knowledge-graph-agent';
 *
 * await quickInit({
 *   projectRoot: '/path/to/project',
 *   docsPath: 'docs',
 * });
 * ```
 */
export async function quickInit(options: {
  projectRoot: string;
  docsPath?: string;
  generateGraph?: boolean;
  updateClaudeMd?: boolean;
}): Promise<{
  success: boolean;
  docsCreated: boolean;
  graphGenerated: boolean;
  claudeMdUpdated: boolean;
  errors: string[];
}> {
  const {
    projectRoot,
    docsPath = 'docs',
    generateGraph: genGraph = true,
    updateClaudeMd: updateClaude = true,
  } = options;

  const result = {
    success: true,
    docsCreated: false,
    graphGenerated: false,
    claudeMdUpdated: false,
    errors: [] as string[],
  };

  try {
    // Initialize docs if needed
    const { existsSync, mkdirSync, writeFileSync } = await import('fs');
    const { join } = await import('path');

    // Create .kg directory
    const kgDir = join(projectRoot, '.kg');
    if (!existsSync(kgDir)) {
      mkdirSync(kgDir, { recursive: true });
    }

    // Initialize database
    const dbPath = join(kgDir, 'knowledge.db');
    const db = _createDatabase(dbPath);
    db.setMetadata('initialized', new Date().toISOString());

    // Initialize docs
    if (!_docsExist(projectRoot, docsPath)) {
      const docsResult = await _initDocs({
        projectRoot,
        docsPath,
        includeExamples: true,
        detectFramework: true,
      });
      result.docsCreated = docsResult.success;
      if (!docsResult.success) {
        result.errors.push(...docsResult.errors);
      }
    }

    // Generate graph
    if (genGraph && _docsExist(projectRoot, docsPath)) {
      const graphResult = await _generateAndSave(
        {
          projectRoot,
          outputPath: join(projectRoot, docsPath),
        },
        dbPath
      );
      result.graphGenerated = graphResult.success;
      if (!graphResult.success) {
        result.errors.push(...graphResult.stats.errors);
      }
    }

    // Update CLAUDE.md
    if (updateClaude) {
      const claudeResult = await _updateClaudeMd({
        projectRoot,
        includeKnowledgeGraph: true,
        includeClaudeFlow: true,
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
