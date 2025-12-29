/**
 * Knowledge Graph Agent
 *
 * NPM library for creating and managing knowledge graphs for Claude Code.
 *
 * @packageDocumentation
 */
export { KnowledgeGraphManager, createKnowledgeGraph, } from './core/graph.js';
export { KnowledgeGraphDatabase, createDatabase, } from './core/database.js';
export { ShadowCache, createShadowCache, loadShadowCache, } from './core/cache.js';
export type { FileMetadata, FileType, ChangeType, FileChange, CacheStats, ShadowCacheOptions, } from './core/cache.js';
export type { NodeType, NodeStatus, NodeLink, NodeFrontmatter, KnowledgeNode, GraphEdge, GraphMetadata, GraphStats, KnowledgeGraph, KGConfig, ConfigSchema, GeneratorOptions, GeneratedDocument, DocsInitOptions, DocsInitResult, MemoryEntry, SyncResult, ClaudeMdSection, ClaudeMdTemplate, ClaudeMdGeneratorOptions, } from './core/types.js';
export { generateGraph, generateAndSave, updateGraph, } from './generators/graph-generator.js';
export { initDocs, docsExist, getDocsPath, } from './generators/docs-init.js';
export { generateClaudeMd, updateClaudeMd, addSection, getSectionTemplate, listSectionTemplates, } from './generators/claude-md.js';
export { convertDocs, addFrontmatter, validateFrontmatter, } from './generators/docs-convert.js';
export type { ConvertOptions, ConvertResult, FrontmatterOptions, FrontmatterResult, } from './generators/docs-convert.js';
export { analyzeDocs, } from './generators/docs-analyzer.js';
export type { AnalyzerOptions, AnalyzedDoc, AnalyzerResult, } from './generators/docs-analyzer.js';
export { ClaudeFlowIntegration, createClaudeFlowIntegration, generateMcpConfig, } from './integrations/claude-flow.js';
export { createCLI } from './cli/index.js';
export { AgentType, AgentStatus, TaskPriority, MessageType, createMessageId, createTaskId, createAgentId, AgentRegistry, getRegistry, createRegistry, setDefaultRegistry, registerDefaultAgents, BaseAgent, createTask, isAgentResult, isAgentError, ResearcherAgent, CoderAgent, TesterAgent, AnalystAgent, ArchitectAgent, RulesEngine, createRulesEngine, createRule, createConditionalRule, createFileChangeLogRule, createGraphUpdateNotificationRule, createAgentCompletionRule, } from './agents/index.js';
export type { AgentConfig, ResearcherAgentConfig, CoderAgentConfig, TesterAgentConfig, AnalystAgentConfig, ArchitectAgentConfig, SpecializedAgentConfig, TaskInput, AgentTask, AgentResult as AgentSystemResult, AgentError, ExecutionMetrics, ResultArtifact, AgentMessage, TaskRequestMessage, TaskResponseMessage, StatusMessage, ErrorMessage, CoordinationMessage, AgentMessageUnion, AgentState, AgentFactory, AgentInstance, AgentCapability, AgentHealthCheck, RegistryOptions, SpawnOptions, RuleTrigger, RulePriority, RuleExecutionStatus, RuleContext, RuleCondition, RuleAction, AgentRule, RuleExecutionLog, RuleStatistics, EngineStatistics, RulesEngineConfig, } from './agents/index.js';
export { SeedGenerator, analyzeSeed, initPrimitives, DeepAnalyzer, createDeepAnalyzer, analyzeDeep, } from './cultivation/index.js';
export type { VaultContext, Ecosystem, DependencyType, ServiceType, DependencyInfo, ServiceInfo, SeedAnalysis, DocumentMetadata as CultivationDocumentMetadata, GeneratedDocument as CultivationGeneratedDocument, CultivationReport, CultivationOptions, GapAnalysis as CultivationGapAnalysis, InitPrimitivesResult, DeepAnalyzerOptions, AgentResult, DeepAnalysisResult, } from './cultivation/index.js';
export { SOPCategory, ComplianceStatus, SOPPriority, IRBStatus, GraphLayer, getSOPById, getSOPsByCategory, getSOPsRequiringIRB, searchSOPs, getAllSOPs, getSopCount, getCategories, checkCompliance, checkSOPCompliance, meetsMinimumCompliance, analyzeGaps, getGapsForSOP, getQuickWins, calculateProgress, createMultiLayerGraph, addProjectLayer, addComplianceOverlay, filterByLayer, filterByComplianceStatus, getComplianceSummary, getGapNodes, toggleLayerVisibility, exportToVisualizationFormat, createSOPFocusedSubgraph, } from './sops/index.js';
export type { SOPRequirement, SOPCheckpoint, SOPDefinition, SOPAssessment, ComplianceGap, LayerDefinition, LayerNode, LayerEdge, MultiLayerGraph, ComplianceReport, SOPFrontmatter, SOPConfig, ComplianceCheckOptions, ComplianceCheckResult, EvidenceItem, GapAnalysisOptions, GapAnalysisResult, GapSummary, RemediationRoadmap, RemediationPhase, GapDependency, OverlayManagerOptions, NodeStyleConfig, } from './sops/index.js';
export { WorkflowStatus, WorkflowRegistry, createWorkflowRegistry, } from './workflows/index.js';
export type { StepContext, StepHandler, RollbackHandler, WorkflowStep, WorkflowDefinition, StepExecution, WorkflowExecution, WorkflowResult, WorkflowExecutionStats, WorkflowRegistryOptions, WorkflowListOptions, ExecutionHistoryOptions, WorkflowEventType, WorkflowEvent, WorkflowEventListener, } from './workflows/index.js';
export { VaultMemorySync, createVaultMemorySync, } from './memory/index.js';
export type { SyncDirection, ConflictStrategy, SyncStatus, MemoryNode, SyncConflict, VaultSyncOptions, SyncOperationResult, FullSyncResult, } from './memory/index.js';
export { ErrorCategory, ErrorSeverity, classifyError, isRetryableError, isTransientError, isRateLimitError, isPermanentError, KnowledgeGraphError, createValidationError, createConfigurationError, createResourceError, withRetry, retry, withFallback, withCircuitBreaker, retryable, calculateBackoff, sleep, CircuitBreaker, CircuitState, RetriesExhaustedError, CircuitOpenError, Logger, LogLevel, getLogger, createLogger, setDefaultLogger, parseLogLevel, createProgressLogger, } from './utils/index.js';
export type { ClassifiedError, RetryOptions, RetryResult, FallbackOptions, CircuitBreakerOptions, LoggerOptions, LogEntry, ProgressLogger, } from './utils/index.js';
export { KnowledgeGraphMCPServer, createMCPServer, runServer, initializeTools, registerTool, getToolHandler, getToolDefinition, getToolDefinitions, getToolCategories, handleToolCall, handleError, createErrorResult, createSuccessResult, } from './mcp-server/index.js';
export type { MCPServerConfig, ServerHealth, ToolCategory, ToolHandler, ToolHandlerEntry, ToolResult, ToolContext, ToolInputSchema, ToolDefinition, GraphQueryParams, GraphNodeResult, AgentInvokeParams, AgentResult as MCPAgentResult, WorkflowParams, WorkflowResult as MCPWorkflowResult, MemoryParams, MemoryResult, } from './mcp-server/index.js';
export { ServerManager, createServerManager, SharedServices, createSharedServices, getSharedServices, createDefaultConfig, ServiceContainer, createServiceContainer, getServiceContainer, hasServiceContainer, shutdownServiceContainer, TypedEventBus, createTypedEventBus, createSubscriptionIterator, createNodeTypeFilter, createSourceFilter, DEFAULT_GRAPHQL_PORT, DEFAULT_DASHBOARD_PORT, DEFAULT_DATABASE_PATH, SHUTDOWN_TIMEOUT, HEALTH_CHECK_INTERVAL, } from './server/index.js';
export type { ServerConfig, MCPServerConfig as ServerMCPConfig, GraphQLServerConfig, DashboardServerConfig, DatabaseServerConfig, CacheServerConfig, ServerStatus, ServerState, ServerManagerState, ComponentHealth as ServerComponentHealth, HealthStatus as ServerHealthStatus, ServerEventType, ServerEvent, ServerEventListener, HTTPServerInstance, MCPServerInstance, ServeCommandOptions, ParsedServeOptions, ISharedServices, IServerManager, ServiceInitState, ServiceDependency, ContainerConfig, ContainerEventType, EventType as ServerEventTypeEnum, EventDataMap, EventEntry, EventFilter, EventHandler as ServerEventHandler, Unsubscribe, NodeEventData, RelationEventData, AgentEventData, WorkflowEventData, PluginEventData, HealthEventData, CacheEvictionData, EventTypeMetrics, EventBusMetrics, ITypedEventBus, TypedEventBusOptions, } from './server/index.js';
export { createGraphQLServer, createContextFactory, hasScope, requireAuth, requireScope, isGraphQLContext, DateTimeScalar, JSONScalar, UUIDScalar, FilePathScalar, customScalars, scalarTypeDefs, } from './graphql/index.js';
export type { GraphQLServerConfig as GraphQLServerOptions, GraphQLServerInstance, CorsConfig, HealthCheckResponse as GraphQLHealthCheckResponse, GraphQLContext, AuthResult, RequestMeta, RequestUtils, Services as GraphQLServices, ContextFactoryConfig, } from './graphql/index.js';
export { ServiceManager, createServiceManager, FileWatcherService, } from './services/index.js';
export type { ServiceStatus, ServiceType as ManagerServiceType, ServiceConfig, ServiceState, ServiceMetrics, ServiceHandler, } from './services/index.js';
export { ConfigManager, createConfigManager, getDefaultConfig, } from './config/index.js';
export type { KGConfiguration, DatabaseConfig, CacheConfig, AgentConfig as ConfigAgentConfig, ServicesConfig, LoggingConfig, ConfigMigration, } from './config/index.js';
export { HealthMonitor, createHealthMonitor, createDatabaseCheck, createCacheCheck, createMemoryCheck, createDiskCheck, } from './health/index.js';
export type { HealthStatus, ComponentHealth, SystemHealth, MemoryMetrics, PerformanceMetrics, HealthCheck, HealthMonitorConfig, } from './health/index.js';
export { Chunker, createChunker, chunkDocument, } from './chunking/index.js';
export type { ChunkStrategy, ChunkOptions, Chunk, ChunkMetadata, ChunkResult, } from './chunking/index.js';
export { BackupManager, createBackupManager, IntegrityChecker, createIntegrityChecker, checkDatabaseIntegrity, } from './recovery/index.js';
export type { BackupConfig, BackupInfo, RestoreResult, RecoveryOptions, IntegrityCheckResult, TableIntegrity, } from './recovery/index.js';
export { AdvancedCache, createAdvancedCache, } from './caching/index.js';
export type { EvictionPolicy, CacheEntry, CacheConfig as AdvancedCacheConfig, CacheStats as AdvancedCacheStats, } from './caching/index.js';
export { DecisionTracker, createDecisionTracker, getDecisionTracker, } from './reasoning/index.js';
export type { DecisionType, ConfidenceLevel, Decision, DecisionContext, Alternative, DecisionOutcome, ReasoningChain, } from './reasoning/index.js';
export { createWorkflowConfig, validateWorkflowConfig, createPostgresConfig, createVercelConfig, createLocalConfig, defaultConfig as defaultWorkflowConfig, } from './workflow/index.js';
export type { WorkflowConfig as WorkflowDevKitConfig, PostgresPoolConfig, PostgresWorldConfig, VercelWorldConfig, LocalWorldConfig, WorldState, NodeUpdateEvent, GapDetectedEvent, WorkflowCompleteEvent, WorkflowRunMetadata as DevKitRunMetadata, TaskSpec, DocumentGap, GapAnalysis as DevKitGapAnalysis, GOAPAction, GOAPGoal, GOAPPlanStep, GOAPPlan, GOAPPlanExtended, PlanExecutionResult, ReadinessEvaluation, WorkflowExecutionOptions as DevKitExecutionOptions, WorkflowExecutionResult as DevKitExecutionResult, HookHandler, HookRegistration, } from './workflow/index.js';
export * from './plugins/index.js';
export { AgentEquilibriumSelector, createAgentEquilibriumSelector, createEquilibriumTask, } from './equilibrium/index.js';
export type { AgentParticipation, EquilibriumConfig, EquilibriumResult, Task as EquilibriumTask, } from './equilibrium/index.js';
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
export declare function quickInit(options: {
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
}>;
//# sourceMappingURL=index.d.ts.map