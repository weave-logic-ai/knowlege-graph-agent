/**
 * Agent Orchestration Types
 *
 * Type definitions for the advanced agent orchestration system.
 */

import type { AgentType, Task } from '../coordinator.js';

/**
 * Rule action types
 */
export type RuleAction =
  | 'route_to_agent'
  | 'split_parallel'
  | 'adjust_priority'
  | 'require_approval'
  | 'add_dependency'
  | 'set_timeout'
  | 'skip_task';

/**
 * Rule definition from JSON schema
 */
export interface OrchestrationRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable name */
  name?: string;
  /** Rule description */
  description?: string;
  /** JavaScript expression condition (evaluated with task context) */
  condition: string;
  /** Action to take when condition matches */
  action: RuleAction;
  /** Priority for rule evaluation (higher = evaluated first) */
  priority: number;
  /** Target agent for route_to_agent action */
  agent?: AgentType;
  /** Max subtasks for split_parallel action */
  max_subtasks?: number;
  /** Priority adjustment value for adjust_priority action */
  priority_adjustment?: number;
  /** Timeout in milliseconds for set_timeout action */
  timeout_ms?: number;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Whether rule is enabled */
  enabled?: boolean;
}

/**
 * Rule evaluation context
 */
export interface RuleContext {
  task: Task;
  agentWorkload: Map<AgentType, number>;
  availableAgents: AgentType[];
  currentTime: Date;
  projectDeadline?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Rule evaluation result
 */
export interface RuleEvaluationResult {
  ruleId: string;
  matched: boolean;
  action?: RuleAction;
  agent?: AgentType;
  splitTasks?: Task[];
  priorityAdjustment?: number;
  timeout?: number;
  skip?: boolean;
  error?: string;
  evaluationTime: number;
}

/**
 * Rule conflict detection result
 */
export interface RuleConflict {
  ruleIds: string[];
  conflictType: 'priority' | 'agent' | 'action' | 'dependency';
  description: string;
  resolution: string;
}

/**
 * Task complexity estimate
 */
export interface ComplexityEstimate {
  taskId: string;
  score: number;
  factors: {
    descriptionLength: number;
    keywordComplexity: number;
    requiredCapabilities: number;
    estimatedLines?: number;
  };
  canSplit: boolean;
  recommendedSubtasks?: number;
}

/**
 * Agent capability definition
 */
export interface AgentCapabilitySpec {
  agentType: AgentType;
  capabilities: string[];
  filePatterns: string[];
  keywords: string[];
  performanceScore: number;
  concurrentTaskLimit: number;
}

/**
 * Task routing decision
 */
export interface RoutingDecision {
  taskId: string;
  selectedAgent: AgentType;
  confidence: number;
  reasoning: string;
  alternativeAgents?: Array<{
    agent: AgentType;
    score: number;
  }>;
  routingTime: number;
}

/**
 * Subtask definition
 */
export interface Subtask extends Task {
  parentTaskId: string;
  splitIndex: number;
  totalSplits: number;
}

/**
 * Dependency graph node
 */
export interface DependencyNode {
  taskId: string;
  dependencies: string[];
  dependents: string[];
  level: number;
  criticalPath: boolean;
}

/**
 * Priority adjustment decision
 */
export interface PriorityAdjustment {
  taskId: string;
  originalPriority: Task['priority'];
  newPriority: Task['priority'];
  reason: string;
  timestamp: Date;
}

/**
 * Workload distribution
 */
export interface WorkloadDistribution {
  agentType: AgentType;
  activeTasks: number;
  queuedTasks: number;
  utilizationPercent: number;
  estimatedCompletionTime: number;
}

/**
 * Performance metrics
 */
export interface OrchestrationMetrics {
  totalTasks: number;
  tasksRouted: number;
  tasksSplit: number;
  priorityAdjustments: number;
  averageRoutingTime: number;
  averageEvaluationTime: number;
  agentUtilization: Map<AgentType, number>;
  conflictsDetected: number;
  conflictsResolved: number;
}

/**
 * Rule engine configuration
 */
export interface RuleEngineConfig {
  /** Path to rules JSON file */
  rulesFile?: string;
  /** Enable rule evaluation timing */
  enableTiming?: boolean;
  /** Maximum evaluation time per rule (ms) */
  maxEvaluationTime?: number;
  /** Enable conflict detection */
  enableConflictDetection?: boolean;
  /** Cache evaluation results */
  enableCaching?: boolean;
  /** Cache TTL in milliseconds */
  cacheTTL?: number;
}

/**
 * Task analyzer configuration
 */
export interface TaskAnalyzerConfig {
  /** Minimum complexity score to consider splitting */
  splitThreshold?: number;
  /** Maximum number of subtasks per split */
  maxSubtasks?: number;
  /** Enable dependency analysis */
  enableDependencyAnalysis?: boolean;
  /** Enable critical path detection */
  enableCriticalPath?: boolean;
}

/**
 * Router configuration
 */
export interface RouterConfig {
  /** Enable performance tracking */
  enablePerformanceTracking?: boolean;
  /** Enable fallback assignment */
  enableFallback?: boolean;
  /** Default fallback agent */
  defaultFallbackAgent?: AgentType;
}

/**
 * Priority system configuration
 */
export interface PrioritySystemConfig {
  /** Enable deadline-based adjustment */
  enableDeadlineAdjustment?: boolean;
  /** Enable dependency-based adjustment */
  enableDependencyAdjustment?: boolean;
  /** Enable SLA prioritization */
  enableSLAPrioritization?: boolean;
  /** Deadline urgency threshold (hours) */
  urgencyThreshold?: number;
}

/**
 * Balancer configuration
 */
export interface BalancerConfig {
  /** Load balancing strategy */
  strategy?: 'round-robin' | 'least-loaded' | 'capability-based' | 'adaptive';
  /** Maximum concurrent tasks per agent */
  maxConcurrentTasksPerAgent?: number;
  /** Enable queue management */
  enableQueueing?: boolean;
  /** Enable resource reservation */
  enableReservation?: boolean;
}
