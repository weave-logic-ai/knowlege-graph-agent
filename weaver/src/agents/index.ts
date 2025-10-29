/**
 * Expert Agent System - Unified exports
 *
 * Complete AI agent system for specialized software development tasks:
 * - 5 specialized agents (Researcher, Coder, Architect, Tester, Analyst)
 * - 2 supporting agents (Planning Expert, Error Detector)
 * - Agent Coordinator for intelligent routing and multi-agent workflows
 * - Claude Client with retry logic and circuit breaker
 * - Fluent prompt builder with templates
 * - Rules engine for event-driven automation
 *
 * @example
 * ```typescript
 * import { AgentCoordinator, createCoordinator } from './agents';
 *
 * const coordinator = new AgentCoordinator({ claudeClient });
 *
 * // Automatic agent selection
 * const agentType = coordinator.selectAgent({
 *   taskDescription: 'Analyze research trends in AI'
 * });
 *
 * // Execute task
 * const result = await coordinator.executeTask({
 *   id: 'task-1',
 *   description: 'Search arXiv for neural network papers',
 *   type: 'research',
 *   priority: 'high'
 * });
 * ```
 */

// Core agents
export { ResearcherAgent, createResearcherAgent } from './researcher-agent.js';
export { CoderAgent, createCoderAgent } from './coder-agent.js';
export { ArchitectAgent, createArchitectAgent } from './architect-agent.js';
export { TesterAgent, createTesterAgent } from './tester-agent.js';
export { AnalystAgent, createAnalystAgent } from './analyst-agent.js';

// Supporting agents
export { PlanningExpert } from './planning-expert.js';
export { ErrorDetector } from './error-detector.js';

// Coordination
export { AgentCoordinator, createCoordinator } from './coordinator.js';

// Infrastructure
export { ClaudeClient, createClaudeClient } from './claude-client.js';
export { PromptBuilder, createPrompt, TEMPLATES } from './prompt-builder.js';
export { RulesEngine, createRulesEngine } from './rules-engine.js';

// Types - Researcher
export type {
  ArxivPaper,
  PaperAnalysis,
  ResearchTrend,
  ResearchSynthesis,
  ArxivSearchOptions,
  ResearcherAgentConfig,
} from './researcher-agent.js';

// Types - Coder
export type {
  CodeSpec,
  GeneratedCode,
  RefactoringStrategy,
  RefactoringResult,
  OptimizationResult,
  TestGenerationOptions,
  GeneratedTests,
  CoderAgentConfig,
} from './coder-agent.js';

// Types - Architect
export type {
  SystemRequirements,
  SystemArchitecture,
  PatternRecommendation,
  APIDesign,
  ArchitectureReview,
  ArchitectAgentConfig,
} from './architect-agent.js';

// Types - Tester
export type {
  TestStrategy,
  TestSuite,
  CoverageAnalysis,
  EdgeCaseSpec,
  EdgeCaseAnalysis,
  TestDataSchema,
  GeneratedTestData,
  TesterAgentConfig,
} from './tester-agent.js';

// Types - Analyst
export type {
  ReviewCriteria,
  CodeReview,
  QualityMetrics,
  SecurityVulnerability,
  SecurityScanResult,
  ImprovementSuggestion,
  AnalystAgentConfig,
} from './analyst-agent.js';

// Types - Planning
export type {
  PlanStep,
  Plan,
} from './planning-expert.js';

// Types - Error Detection
export type {
  ErrorPattern,
} from './error-detector.js';

// Types - Coordinator
export type {
  AgentCapability,
  AgentType,
  Task,
  TaskResult,
  Workflow,
  WorkflowResult,
  SelectionCriteria,
  CoordinatorConfig,
} from './coordinator.js';

// Types - Claude Client & Infrastructure
export type {
  ClaudeClientConfig,
  ClaudeRequestOptions,
  ParsedResponse,
  ResponseFormat,
  TokenUsage,
  PromptVariables,
  MessageRole,
  PromptMessage,
  MessageParam,
  CircuitBreakerState,
  RuleTrigger,
  RuleContext,
  AgentRule,
  RuleExecutionLog,
  RuleStatistics,
  RulesEngineConfig,
} from './types.js';
