/**
 * Agents Module
 *
 * Provides the agent system for multi-agent orchestration including
 * type definitions, registry management, and base agent implementation.
 *
 * @module agents
 */

// Types
export {
  // Enums
  AgentType,
  AgentStatus,
  TaskPriority,
  MessageType,

  // Configuration types
  type AgentConfig,
  type ResearcherAgentConfig,
  type CoderAgentConfig,
  type TesterAgentConfig,
  type AnalystAgentConfig,
  type ArchitectAgentConfig,
  type PlannerAgentConfig,
  type SpecializedAgentConfig,

  // Task types
  type TaskInput,
  type AgentTask,

  // Result types
  type AgentResult,
  type AgentError,
  type ExecutionMetrics,
  type ResultArtifact,

  // Message types
  type AgentMessage,
  type TaskRequestMessage,
  type TaskResponseMessage,
  type StatusMessage,
  type ErrorMessage,
  type CoordinationMessage,
  type AgentMessageUnion,

  // State types
  type AgentState,

  // Factory types
  type AgentFactory,
  type AgentInstance,

  // Utility types
  type AgentCapability,
  type AgentHealthCheck,

  // Helper functions
  createMessageId,
  createTaskId,
  createAgentId,
} from './types.js';

// Registry
export {
  AgentRegistry,
  getRegistry,
  createRegistry,
  setDefaultRegistry,
  registerDefaultAgents,
  type RegistryOptions,
  type SpawnOptions,
} from './registry.js';

// Base Agent
export {
  BaseAgent,
  createTask,
  isAgentResult,
  isAgentError,
} from './base-agent.js';

// Rules Engine
export {
  RulesEngine,
  createRulesEngine,
  createRule,
  createConditionalRule,
  createFileChangeLogRule,
  createGraphUpdateNotificationRule,
  createAgentCompletionRule,
  type RuleTrigger,
  type RulePriority,
  type RuleExecutionStatus,
  type RuleContext,
  type RuleCondition,
  type RuleAction,
  type AgentRule,
  type RuleExecutionLog,
  type RuleStatistics,
  type EngineStatistics,
  type RulesEngineConfig,
} from './rules-engine.js';

// Specialized Agents
export { ResearcherAgent } from './researcher-agent.js';
export { CoderAgent } from './coder-agent.js';
export { TesterAgent } from './tester-agent.js';
export { AnalystAgent } from './analyst-agent.js';
export { ArchitectAgent } from './architect-agent.js';
export { OptimizerAgent } from './optimizer-agent.js';
export { ReviewerAgent } from './reviewer-agent.js';

// Optimizer Agent Types
export type {
  OptimizerAgentConfig,
  ImpactLevel,
  OptimizationImprovement,
  OptimizationResult,
  MemoryAllocation,
  MemoryProfile,
  MemoryOptimizationSuggestion,
  MemoryOptimizationResult,
  QueryOptimizationResult,
  CachingLayer,
  CachingStrategy,
  BenchmarkMeasurement,
  BenchmarkResult,
  SystemArchitecture,
  OptimizerTaskType,
} from './optimizer-agent.js';

// Coordinator Agent
export {
  CoordinatorAgent,
  createCoordinatorAgent,
  createWorkflow,
  createWorkflowStep,
  type TaskAssignmentStatus,
  type DistributionStrategy,
  type WorkflowStep,
  type WorkflowDefinition,
  type TaskAssignment,
  type StepResult,
  type WorkflowResult,
  type ProgressReport,
  type AgentRequirement,
  type DelegateTask,
  type CoordinatorAgentConfig,
  type CoordinatorTaskType,
} from './coordinator-agent.js';

// Reviewer Agent Types
export type {
  ReviewerAgentConfig,
  ReviewContext,
  ReviewSeverity,
  ReviewCategory,
  ReviewIssue,
  CodeReviewResult,
  SecurityVulnerability,
  SecurityAuditResult,
  PerformanceIssue,
  PerformanceAnalysisResult,
  BestPracticesResult,
  ReviewAction,
} from './reviewer-agent.js';

// Documenter Agent
export { DocumenterAgent } from './documenter-agent.js';

// Documenter Agent Types
export type {
  DocumenterAgentConfig,
  DocumentationFormat,
  DocumentationResult,
  UserGuideResult,
  SystemInfo,
  ArchitectureDocResult,
  ChangelogResult,
  ParsedDocComment,
  DocumentedItem,
  GitCommit,
  DocumenterTaskType,
} from './documenter-agent.js';

// Planner Agent
export { PlannerAgent } from './planner-agent.js';

// Planner Agent Types
export type {
  PlannerPriority,
  DependencyType,
  RiskProbability,
  RiskImpact,
  EffortEstimate,
  Subtask,
  TaskDecomposition,
  DependencyNode,
  DependencyEdge,
  DependencyGraph,
  AgentInfo,
  ResourceAssignment,
  ResourceAllocation,
  Milestone,
  Phase,
  TimelineEstimate,
  Risk,
  RiskAssessment,
  ExecutionPlan,
  PlannerTaskType,
} from './planner-agent.js';

// Mixins
export {
  applyTrajectoryMixin,
  TrajectoryWrapper,
  createTrajectoryWrapper,
  hasTrajectoryCapability,
  type TrajectoryCapable,
  type TrajectoryMixinConfig,
} from './mixins/index.js';
