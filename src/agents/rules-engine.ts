/**
 * Rules Engine
 *
 * Event-driven rule execution engine with async processing, condition evaluation,
 * error isolation, and performance tracking.
 *
 * @module agents/rules-engine
 */

import { createLogger, type Logger } from '../utils/index.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Trigger types for rule execution
 */
export type RuleTrigger =
  | 'file:add'
  | 'file:change'
  | 'file:unlink'
  | 'graph:update'
  | 'agent:complete'
  | 'manual';

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

// ============================================================================
// Circular Buffer for Execution Logs
// ============================================================================

/**
 * Circular buffer implementation for execution logs
 */
class CircularBuffer<T> {
  private buffer: (T | undefined)[];
  private head: number = 0;
  private tail: number = 0;
  private count: number = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;

    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this.count; i++) {
      const idx = (this.head + i) % this.capacity;
      const item = this.buffer[idx];
      if (item !== undefined) {
        result.push(item);
      }
    }
    return result;
  }

  getLatest(n: number): T[] {
    const all = this.toArray();
    return all.slice(-n);
  }

  clear(): void {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }

  get size(): number {
    return this.count;
  }
}

// ============================================================================
// Priority Queue for Rule Execution
// ============================================================================

const PRIORITY_ORDER: Record<RulePriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

// ============================================================================
// Rules Engine Implementation
// ============================================================================

/**
 * Event-driven rules engine with async processing and error isolation
 */
export class RulesEngine {
  private rules: Map<string, AgentRule> = new Map();
  private executionLogs: CircularBuffer<RuleExecutionLog>;
  private ruleStats: Map<string, RuleStatistics> = new Map();
  private triggerStats: Map<RuleTrigger, { totalExecutions: number; successCount: number; totalTime: number }> = new Map();
  private activeExecutions: number = 0;
  private readonly logger: Logger;
  private readonly config: Required<RulesEngineConfig>;

  constructor(config: RulesEngineConfig = {}) {
    this.config = {
      maxConcurrency: config.maxConcurrency ?? 10,
      defaultTimeout: config.defaultTimeout ?? 30000,
      logBufferSize: config.logBufferSize ?? 1000,
      verbose: config.verbose ?? false,
      logger: config.logger ?? createLogger('RulesEngine'),
    };

    this.logger = this.config.logger;
    this.executionLogs = new CircularBuffer(this.config.logBufferSize);

    // Initialize trigger stats for all trigger types
    const allTriggers: RuleTrigger[] = ['file:add', 'file:change', 'file:unlink', 'graph:update', 'agent:complete', 'manual'];
    for (const trigger of allTriggers) {
      this.triggerStats.set(trigger, { totalExecutions: 0, successCount: 0, totalTime: 0 });
    }
  }

  // --------------------------------------------------------------------------
  // Rule Management
  // --------------------------------------------------------------------------

  /**
   * Register a new rule
   */
  registerRule(rule: AgentRule): void {
    if (this.rules.has(rule.id)) {
      this.logger.warn(`Rule with id '${rule.id}' already exists, replacing`, { ruleId: rule.id });
    }

    // Apply defaults
    const normalizedRule: AgentRule = {
      ...rule,
      priority: rule.priority ?? 'normal',
      enabled: rule.enabled ?? true,
      timeout: rule.timeout ?? this.config.defaultTimeout,
      continueOnFailure: rule.continueOnFailure ?? true,
    };

    this.rules.set(rule.id, normalizedRule);

    // Initialize stats for this rule
    this.ruleStats.set(rule.id, {
      ruleId: rule.id,
      ruleName: rule.name,
      totalExecutions: 0,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      averageExecutionTime: 0,
      minExecutionTime: Infinity,
      maxExecutionTime: 0,
    });

    if (this.config.verbose) {
      this.logger.debug(`Registered rule: ${rule.name}`, {
        ruleId: rule.id,
        triggers: rule.triggers,
        priority: normalizedRule.priority,
      });
    }
  }

  /**
   * Register multiple rules at once
   */
  registerRules(rules: AgentRule[]): void {
    for (const rule of rules) {
      this.registerRule(rule);
    }
  }

  /**
   * Unregister a rule by ID
   */
  unregisterRule(ruleId: string): boolean {
    const existed = this.rules.delete(ruleId);
    if (existed) {
      this.logger.debug(`Unregistered rule: ${ruleId}`);
    }
    return existed;
  }

  /**
   * Get a rule by ID
   */
  getRule(ruleId: string): AgentRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Get all registered rules
   */
  getAllRules(): AgentRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by trigger type
   */
  getRulesByTrigger(trigger: RuleTrigger): AgentRule[] {
    return Array.from(this.rules.values()).filter(
      (rule) => rule.enabled && rule.triggers.includes(trigger)
    );
  }

  /**
   * Enable a rule
   */
  enableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = true;
      return true;
    }
    return false;
  }

  /**
   * Disable a rule
   */
  disableRule(ruleId: string): boolean {
    const rule = this.rules.get(ruleId);
    if (rule) {
      rule.enabled = false;
      return true;
    }
    return false;
  }

  // --------------------------------------------------------------------------
  // Rule Execution
  // --------------------------------------------------------------------------

  /**
   * Trigger rule execution for an event
   */
  async trigger(trigger: RuleTrigger, context: Partial<RuleContext> = {}): Promise<RuleExecutionLog[]> {
    const fullContext: RuleContext = {
      trigger,
      timestamp: new Date(),
      ...context,
      engine: this,
    };

    // Get applicable rules sorted by priority
    const applicableRules = this.getRulesByTrigger(trigger).sort(
      (a, b) => PRIORITY_ORDER[a.priority ?? 'normal'] - PRIORITY_ORDER[b.priority ?? 'normal']
    );

    if (applicableRules.length === 0) {
      if (this.config.verbose) {
        this.logger.debug(`No rules to execute for trigger: ${trigger}`);
      }
      return [];
    }

    this.logger.info(`Executing ${applicableRules.length} rules for trigger: ${trigger}`, {
      trigger,
      ruleCount: applicableRules.length,
    });

    // Execute rules concurrently with concurrency limit
    const logs: RuleExecutionLog[] = [];
    const executing: Promise<void>[] = [];

    for (const rule of applicableRules) {
      // Wait if at concurrency limit
      while (this.activeExecutions >= this.config.maxConcurrency) {
        await Promise.race(executing);
      }

      const execution = this.executeRule(rule, fullContext).then((log) => {
        logs.push(log);
        const idx = executing.indexOf(execution);
        if (idx > -1) executing.splice(idx, 1);
      });

      executing.push(execution);
    }

    // Wait for all remaining executions
    await Promise.all(executing);

    return logs;
  }

  /**
   * Execute a single rule
   */
  private async executeRule(rule: AgentRule, context: RuleContext): Promise<RuleExecutionLog> {
    const startTime = Date.now();
    this.activeExecutions++;

    const log: RuleExecutionLog = {
      ruleId: rule.id,
      ruleName: rule.name,
      status: 'running',
      trigger: context.trigger,
      startedAt: new Date(),
      contextSnapshot: {
        filePath: context.filePath,
        trigger: context.trigger,
        timestamp: context.timestamp,
      },
    };

    try {
      // Evaluate condition if present
      if (rule.condition) {
        log.conditionEvaluated = true;
        const conditionResult = await this.withTimeout(
          Promise.resolve(rule.condition(context)),
          rule.timeout ?? this.config.defaultTimeout,
          `Condition evaluation for rule '${rule.name}'`
        );
        log.conditionResult = conditionResult;

        if (!conditionResult) {
          log.status = 'skipped';
          log.completedAt = new Date();
          log.duration = Date.now() - startTime;
          this.updateStats(rule, log, false);
          this.executionLogs.push(log);
          this.activeExecutions--;

          if (this.config.verbose) {
            this.logger.debug(`Rule skipped (condition false): ${rule.name}`, { ruleId: rule.id });
          }
          return log;
        }
      }

      // Execute action
      await this.withTimeout(
        Promise.resolve(rule.action(context)),
        rule.timeout ?? this.config.defaultTimeout,
        `Action execution for rule '${rule.name}'`
      );

      log.status = 'success';
      log.completedAt = new Date();
      log.duration = Date.now() - startTime;

      if (this.config.verbose) {
        this.logger.debug(`Rule executed successfully: ${rule.name}`, {
          ruleId: rule.id,
          duration: log.duration,
        });
      }

    } catch (error) {
      log.status = 'failure';
      log.completedAt = new Date();
      log.duration = Date.now() - startTime;
      log.error = error instanceof Error ? error.message : String(error);

      this.logger.error(`Rule execution failed: ${rule.name}`, error instanceof Error ? error : undefined, {
        ruleId: rule.id,
        trigger: context.trigger,
      });

      if (!rule.continueOnFailure) {
        throw error;
      }
    } finally {
      this.activeExecutions--;
      this.updateStats(rule, log, log.status === 'success');
      this.executionLogs.push(log);
    }

    return log;
  }

  /**
   * Execute a rule by ID with custom context
   */
  async executeRuleById(ruleId: string, context: Partial<RuleContext> = {}): Promise<RuleExecutionLog | null> {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      this.logger.warn(`Rule not found: ${ruleId}`);
      return null;
    }

    const fullContext: RuleContext = {
      trigger: 'manual',
      timestamp: new Date(),
      ...context,
      engine: this,
    };

    return this.executeRule(rule, fullContext);
  }

  /**
   * Wrap a promise with a timeout
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    operation: string
  ): Promise<T> {
    let timeoutId: NodeJS.Timeout;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms: ${operation}`));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId!);
      return result;
    } catch (error) {
      clearTimeout(timeoutId!);
      throw error;
    }
  }

  // --------------------------------------------------------------------------
  // Statistics and Metrics
  // --------------------------------------------------------------------------

  /**
   * Update statistics after rule execution
   */
  private updateStats(rule: AgentRule, log: RuleExecutionLog, success: boolean): void {
    const stats = this.ruleStats.get(rule.id);
    if (!stats) return;

    stats.totalExecutions++;
    stats.lastExecutedAt = log.completedAt;

    if (log.status === 'skipped') {
      stats.skippedCount++;
    } else if (success) {
      stats.successCount++;
      stats.lastSuccessAt = log.completedAt;
    } else {
      stats.failureCount++;
      stats.lastFailureAt = log.completedAt;
    }

    if (log.duration !== undefined && log.status !== 'skipped') {
      const totalTime = stats.averageExecutionTime * (stats.totalExecutions - stats.skippedCount - 1);
      const execCount = stats.totalExecutions - stats.skippedCount;
      stats.averageExecutionTime = execCount > 0 ? (totalTime + log.duration) / execCount : 0;

      stats.minExecutionTime = Math.min(stats.minExecutionTime, log.duration);
      stats.maxExecutionTime = Math.max(stats.maxExecutionTime, log.duration);
    }

    // Update trigger stats
    const triggerStat = this.triggerStats.get(log.trigger);
    if (triggerStat) {
      triggerStat.totalExecutions++;
      if (success) triggerStat.successCount++;
      if (log.duration) triggerStat.totalTime += log.duration;
    }
  }

  /**
   * Get statistics for a specific rule
   */
  getRuleStatistics(ruleId: string): RuleStatistics | undefined {
    return this.ruleStats.get(ruleId);
  }

  /**
   * Get engine-wide statistics
   */
  getStatistics(): EngineStatistics {
    const allRules = Array.from(this.rules.values());
    const enabledRules = allRules.filter((r) => r.enabled);

    let totalExecutions = 0;
    let totalSuccesses = 0;
    let totalTime = 0;
    let timeCount = 0;

    for (const stats of this.ruleStats.values()) {
      totalExecutions += stats.totalExecutions;
      totalSuccesses += stats.successCount;
      if (stats.averageExecutionTime > 0 && stats.totalExecutions > stats.skippedCount) {
        totalTime += stats.averageExecutionTime * (stats.totalExecutions - stats.skippedCount);
        timeCount += stats.totalExecutions - stats.skippedCount;
      }
    }

    const triggerStatsMap = new Map<RuleTrigger, { totalExecutions: number; successCount: number; averageTime: number }>();
    for (const [trigger, stat] of this.triggerStats) {
      triggerStatsMap.set(trigger, {
        totalExecutions: stat.totalExecutions,
        successCount: stat.successCount,
        averageTime: stat.totalExecutions > 0 ? stat.totalTime / stat.totalExecutions : 0,
      });
    }

    return {
      totalRules: allRules.length,
      enabledRules: enabledRules.length,
      totalExecutions,
      successRate: totalExecutions > 0 ? totalSuccesses / totalExecutions : 0,
      averageExecutionTime: timeCount > 0 ? totalTime / timeCount : 0,
      activeExecutions: this.activeExecutions,
      ruleStats: new Map(this.ruleStats),
      triggerStats: triggerStatsMap,
    };
  }

  // --------------------------------------------------------------------------
  // Execution Logs
  // --------------------------------------------------------------------------

  /**
   * Get execution logs (most recent first)
   */
  getExecutionLogs(limit?: number): RuleExecutionLog[] {
    const logs = this.executionLogs.toArray().reverse();
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Get logs for a specific rule
   */
  getLogsForRule(ruleId: string, limit?: number): RuleExecutionLog[] {
    const logs = this.executionLogs.toArray()
      .filter((log) => log.ruleId === ruleId)
      .reverse();
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Get logs for a specific trigger
   */
  getLogsForTrigger(trigger: RuleTrigger, limit?: number): RuleExecutionLog[] {
    const logs = this.executionLogs.toArray()
      .filter((log) => log.trigger === trigger)
      .reverse();
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Get failed execution logs
   */
  getFailedLogs(limit?: number): RuleExecutionLog[] {
    const logs = this.executionLogs.toArray()
      .filter((log) => log.status === 'failure')
      .reverse();
    return limit ? logs.slice(0, limit) : logs;
  }

  /**
   * Clear execution logs
   */
  clearLogs(): void {
    this.executionLogs.clear();
    this.logger.debug('Execution logs cleared');
  }

  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------

  /**
   * Reset all statistics
   */
  resetStatistics(): void {
    for (const [ruleId, rule] of this.rules) {
      this.ruleStats.set(ruleId, {
        ruleId,
        ruleName: rule.name,
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
        skippedCount: 0,
        averageExecutionTime: 0,
        minExecutionTime: Infinity,
        maxExecutionTime: 0,
      });
    }

    for (const trigger of this.triggerStats.keys()) {
      this.triggerStats.set(trigger, { totalExecutions: 0, successCount: 0, totalTime: 0 });
    }

    this.logger.debug('Statistics reset');
  }

  /**
   * Get a summary of the engine state
   */
  getSummary(): {
    rulesCount: number;
    enabledCount: number;
    triggersConfigured: RuleTrigger[];
    activeExecutions: number;
    logsCount: number;
  } {
    const allRules = Array.from(this.rules.values());
    const triggersConfigured = new Set<RuleTrigger>();

    for (const rule of allRules) {
      if (rule.enabled) {
        for (const trigger of rule.triggers) {
          triggersConfigured.add(trigger);
        }
      }
    }

    return {
      rulesCount: allRules.length,
      enabledCount: allRules.filter((r) => r.enabled).length,
      triggersConfigured: Array.from(triggersConfigured),
      activeExecutions: this.activeExecutions,
      logsCount: this.executionLogs.size,
    };
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new rules engine instance
 */
export function createRulesEngine(config?: RulesEngineConfig): RulesEngine {
  return new RulesEngine(config);
}

/**
 * Create a simple rule definition
 */
export function createRule(
  id: string,
  name: string,
  triggers: RuleTrigger[],
  action: RuleAction,
  options: Partial<Omit<AgentRule, 'id' | 'name' | 'triggers' | 'action'>> = {}
): AgentRule {
  return {
    id,
    name,
    triggers,
    action,
    ...options,
  };
}

/**
 * Create a conditional rule
 */
export function createConditionalRule(
  id: string,
  name: string,
  triggers: RuleTrigger[],
  condition: RuleCondition,
  action: RuleAction,
  options: Partial<Omit<AgentRule, 'id' | 'name' | 'triggers' | 'condition' | 'action'>> = {}
): AgentRule {
  return {
    id,
    name,
    triggers,
    condition,
    action,
    ...options,
  };
}

// ============================================================================
// Built-in Rule Templates
// ============================================================================

/**
 * Create a file change logging rule
 */
export function createFileChangeLogRule(
  logger: Logger = createLogger('FileChangeRule')
): AgentRule {
  return {
    id: 'builtin:file-change-log',
    name: 'File Change Logger',
    description: 'Logs all file changes to the console',
    triggers: ['file:add', 'file:change', 'file:unlink'],
    priority: 'low',
    action: (context) => {
      logger.info(`File ${context.trigger.replace('file:', '')}: ${context.filePath ?? 'unknown'}`);
    },
  };
}

/**
 * Create a graph update notification rule
 */
export function createGraphUpdateNotificationRule(
  callback: (context: RuleContext) => void | Promise<void>
): AgentRule {
  return {
    id: 'builtin:graph-update-notify',
    name: 'Graph Update Notification',
    description: 'Notifies when the knowledge graph is updated',
    triggers: ['graph:update'],
    priority: 'normal',
    action: callback,
  };
}

/**
 * Create an agent completion handler rule
 */
export function createAgentCompletionRule(
  handler: (agentData: NonNullable<RuleContext['agentData']>) => void | Promise<void>
): AgentRule {
  return {
    id: 'builtin:agent-completion-handler',
    name: 'Agent Completion Handler',
    description: 'Handles agent task completion events',
    triggers: ['agent:complete'],
    priority: 'high',
    condition: (context) => context.agentData !== undefined,
    action: async (context) => {
      if (context.agentData) {
        await handler(context.agentData);
      }
    },
  };
}
