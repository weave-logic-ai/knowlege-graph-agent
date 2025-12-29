/**
 * Rules Engine
 *
 * Event-driven rule execution engine with async processing, condition evaluation,
 * error isolation, and performance tracking.
 *
 * @module agents/rules-engine
 */
import { type Logger } from '../utils/index.js';
/**
 * Trigger types for rule execution
 */
export type RuleTrigger = 'file:add' | 'file:change' | 'file:unlink' | 'graph:update' | 'agent:complete' | 'manual';
/**
 * Rule priority levels
 */
export type RulePriority = 'low' | 'normal' | 'high' | 'critical';
/**
 * Rule execution status
 */
export type RuleExecutionStatus = 'pending' | 'running' | 'success' | 'failure' | 'skipped';
/**
 * Context provided to rules during execution
 */
export interface RuleContext {
    /** The trigger event that caused this execution */
    trigger: RuleTrigger;
    /** Timestamp when the event occurred */
    timestamp: Date;
    /** Path to the file (for file-related triggers) */
    filePath?: string;
    /** Previous file content (for file:change) */
    previousContent?: string;
    /** Current file content */
    currentContent?: string;
    /** Graph-related data (for graph:update) */
    graphData?: {
        nodesAdded?: number;
        nodesRemoved?: number;
        edgesModified?: number;
    };
    /** Agent completion data (for agent:complete) */
    agentData?: {
        agentId: string;
        taskId: string;
        result: 'success' | 'failure';
        duration: number;
    };
    /** Custom metadata that can be attached to context */
    metadata?: Record<string, unknown>;
    /** Reference to the rules engine for chaining */
    engine?: RulesEngine;
}
/**
 * Condition function that determines if a rule should execute
 */
export type RuleCondition = (context: RuleContext) => boolean | Promise<boolean>;
/**
 * Action function that performs the rule's work
 */
export type RuleAction = (context: RuleContext) => void | Promise<void>;
/**
 * Rule definition
 */
export interface AgentRule {
    /** Unique identifier for the rule */
    id: string;
    /** Human-readable name */
    name: string;
    /** Optional description */
    description?: string;
    /** Triggers that activate this rule */
    triggers: RuleTrigger[];
    /** Condition to evaluate before executing (optional) */
    condition?: RuleCondition;
    /** Action to execute */
    action: RuleAction;
    /** Rule priority (default: 'normal') */
    priority?: RulePriority;
    /** Whether the rule is enabled (default: true) */
    enabled?: boolean;
    /** Tags for categorization */
    tags?: string[];
    /** Maximum execution time in milliseconds (default: 30000) */
    timeout?: number;
    /** Whether to continue execution on failure (default: true) */
    continueOnFailure?: boolean;
}
/**
 * Execution log entry
 */
export interface RuleExecutionLog {
    /** Rule ID */
    ruleId: string;
    /** Rule name */
    ruleName: string;
    /** Execution status */
    status: RuleExecutionStatus;
    /** Trigger that caused execution */
    trigger: RuleTrigger;
    /** Start timestamp */
    startedAt: Date;
    /** End timestamp */
    completedAt?: Date;
    /** Execution duration in milliseconds */
    duration?: number;
    /** Error message if failed */
    error?: string;
    /** Whether condition was evaluated */
    conditionEvaluated?: boolean;
    /** Result of condition evaluation */
    conditionResult?: boolean;
    /** Context snapshot (partial) */
    contextSnapshot?: {
        filePath?: string;
        trigger: RuleTrigger;
        timestamp: Date;
    };
}
/**
 * Rule execution statistics
 */
export interface RuleStatistics {
    /** Rule ID */
    ruleId: string;
    /** Rule name */
    ruleName: string;
    /** Total executions */
    totalExecutions: number;
    /** Successful executions */
    successCount: number;
    /** Failed executions */
    failureCount: number;
    /** Skipped executions (condition false) */
    skippedCount: number;
    /** Average execution time in milliseconds */
    averageExecutionTime: number;
    /** Min execution time */
    minExecutionTime: number;
    /** Max execution time */
    maxExecutionTime: number;
    /** Last execution timestamp */
    lastExecutedAt?: Date;
    /** Last successful execution */
    lastSuccessAt?: Date;
    /** Last failure timestamp */
    lastFailureAt?: Date;
}
/**
 * Engine-wide statistics
 */
export interface EngineStatistics {
    /** Total rules registered */
    totalRules: number;
    /** Enabled rules count */
    enabledRules: number;
    /** Total executions across all rules */
    totalExecutions: number;
    /** Success rate (0-1) */
    successRate: number;
    /** Average execution time across all rules */
    averageExecutionTime: number;
    /** Rules currently executing */
    activeExecutions: number;
    /** Per-rule statistics */
    ruleStats: Map<string, RuleStatistics>;
    /** Per-trigger statistics */
    triggerStats: Map<RuleTrigger, {
        totalExecutions: number;
        successCount: number;
        averageTime: number;
    }>;
}
/**
 * Rules engine configuration
 */
export interface RulesEngineConfig {
    /** Maximum concurrent rule executions (default: 10) */
    maxConcurrency?: number;
    /** Default timeout for rules in milliseconds (default: 30000) */
    defaultTimeout?: number;
    /** Size of the execution log circular buffer (default: 1000) */
    logBufferSize?: number;
    /** Whether to enable detailed logging (default: false) */
    verbose?: boolean;
    /** Custom logger instance */
    logger?: Logger;
}
/**
 * Event-driven rules engine with async processing and error isolation
 */
export declare class RulesEngine {
    private rules;
    private executionLogs;
    private ruleStats;
    private triggerStats;
    private activeExecutions;
    private readonly logger;
    private readonly config;
    constructor(config?: RulesEngineConfig);
    /**
     * Register a new rule
     */
    registerRule(rule: AgentRule): void;
    /**
     * Register multiple rules at once
     */
    registerRules(rules: AgentRule[]): void;
    /**
     * Unregister a rule by ID
     */
    unregisterRule(ruleId: string): boolean;
    /**
     * Get a rule by ID
     */
    getRule(ruleId: string): AgentRule | undefined;
    /**
     * Get all registered rules
     */
    getAllRules(): AgentRule[];
    /**
     * Get rules by trigger type
     */
    getRulesByTrigger(trigger: RuleTrigger): AgentRule[];
    /**
     * Enable a rule
     */
    enableRule(ruleId: string): boolean;
    /**
     * Disable a rule
     */
    disableRule(ruleId: string): boolean;
    /**
     * Trigger rule execution for an event
     */
    trigger(trigger: RuleTrigger, context?: Partial<RuleContext>): Promise<RuleExecutionLog[]>;
    /**
     * Execute a single rule
     */
    private executeRule;
    /**
     * Execute a rule by ID with custom context
     */
    executeRuleById(ruleId: string, context?: Partial<RuleContext>): Promise<RuleExecutionLog | null>;
    /**
     * Wrap a promise with a timeout
     */
    private withTimeout;
    /**
     * Update statistics after rule execution
     */
    private updateStats;
    /**
     * Get statistics for a specific rule
     */
    getRuleStatistics(ruleId: string): RuleStatistics | undefined;
    /**
     * Get engine-wide statistics
     */
    getStatistics(): EngineStatistics;
    /**
     * Get execution logs (most recent first)
     */
    getExecutionLogs(limit?: number): RuleExecutionLog[];
    /**
     * Get logs for a specific rule
     */
    getLogsForRule(ruleId: string, limit?: number): RuleExecutionLog[];
    /**
     * Get logs for a specific trigger
     */
    getLogsForTrigger(trigger: RuleTrigger, limit?: number): RuleExecutionLog[];
    /**
     * Get failed execution logs
     */
    getFailedLogs(limit?: number): RuleExecutionLog[];
    /**
     * Clear execution logs
     */
    clearLogs(): void;
    /**
     * Reset all statistics
     */
    resetStatistics(): void;
    /**
     * Get a summary of the engine state
     */
    getSummary(): {
        rulesCount: number;
        enabledCount: number;
        triggersConfigured: RuleTrigger[];
        activeExecutions: number;
        logsCount: number;
    };
}
/**
 * Create a new rules engine instance
 */
export declare function createRulesEngine(config?: RulesEngineConfig): RulesEngine;
/**
 * Create a simple rule definition
 */
export declare function createRule(id: string, name: string, triggers: RuleTrigger[], action: RuleAction, options?: Partial<Omit<AgentRule, 'id' | 'name' | 'triggers' | 'action'>>): AgentRule;
/**
 * Create a conditional rule
 */
export declare function createConditionalRule(id: string, name: string, triggers: RuleTrigger[], condition: RuleCondition, action: RuleAction, options?: Partial<Omit<AgentRule, 'id' | 'name' | 'triggers' | 'condition' | 'action'>>): AgentRule;
/**
 * Create a file change logging rule
 */
export declare function createFileChangeLogRule(logger?: Logger): AgentRule;
/**
 * Create a graph update notification rule
 */
export declare function createGraphUpdateNotificationRule(callback: (context: RuleContext) => void | Promise<void>): AgentRule;
/**
 * Create an agent completion handler rule
 */
export declare function createAgentCompletionRule(handler: (agentData: NonNullable<RuleContext['agentData']>) => void | Promise<void>): AgentRule;
//# sourceMappingURL=rules-engine.d.ts.map