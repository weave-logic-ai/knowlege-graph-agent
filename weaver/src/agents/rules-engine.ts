/**
 * Rules Engine - Core architecture for agent automation
 *
 * Features:
 * - Event-driven rule execution
 * - Async rule processing with concurrent execution
 * - Condition evaluation before action execution
 * - Rule isolation (failures don't block other rules)
 * - Execution logging with circular buffer
 * - Performance metrics tracking
 *
 * @example
 * ```typescript
 * const engine = new RulesEngine({ claudeClient, vaultSync });
 *
 * // Register a rule
 * engine.registerRule({
 *   id: 'auto-summarize',
 *   name: 'Auto-summarize new notes',
 *   trigger: 'file:add',
 *   condition: async (ctx) => ctx.note.path.endsWith('.md'),
 *   action: async (ctx) => {
 *     const summary = await ctx.claudeClient.sendMessage('Summarize...');
 *     await ctx.vaultSync.syncNoteToMemory(summary);
 *   }
 * });
 *
 * // Execute rules for an event
 * await engine.executeRules({
 *   type: 'file:add',
 *   path: 'notes/meeting.md',
 *   note: { ... }
 * });
 * ```
 */

import type { ClaudeClient } from './claude-client.js';
import type { VaultMemorySync } from '../memory/vault-sync.js';
import type { CachedFile } from '../shadow-cache/types.js';
import type { FileEvent } from '../file-watcher/types.js';
import { logger } from '../utils/logger.js';

/**
 * Rule trigger types (event types that can trigger rules)
 */
export type RuleTrigger =
  | 'file:add'       // New file created
  | 'file:change'    // File modified
  | 'file:unlink'    // File deleted
  | 'memory:sync'    // Memory sync completed
  | 'agent:complete' // Agent action completed
  | 'manual';        // Manually triggered

/**
 * Rule execution context (available to conditions and actions)
 */
export interface RuleContext {
  /** Event that triggered the rule */
  event: {
    type: RuleTrigger;
    timestamp: Date;
    data?: Record<string, unknown>;
  };
  /** Note data (if applicable) */
  note?: CachedFile;
  /** File event (if applicable) */
  fileEvent?: FileEvent;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
  /** Claude client for AI operations */
  claudeClient: ClaudeClient;
  /** Vault sync for memory operations */
  vaultSync: VaultMemorySync;
}

/**
 * Agent rule definition
 */
export interface AgentRule {
  /** Unique rule identifier */
  id: string;
  /** Human-readable rule name */
  name: string;
  /** Event type that triggers this rule */
  trigger: RuleTrigger;
  /** Optional condition to evaluate before executing action */
  condition?: (context: RuleContext) => Promise<boolean> | boolean;
  /** Action to execute when rule is triggered and condition passes */
  action: (context: RuleContext) => Promise<void> | void;
  /** Rule priority (higher = executed first, default: 0) */
  priority?: number;
  /** Whether rule is enabled (default: true) */
  enabled?: boolean;
  /** Rule metadata */
  metadata?: {
    description?: string;
    category?: string;
    author?: string;
    created?: Date;
    tags?: string[];
  };
}

/**
 * Rule execution log entry
 */
export interface RuleExecutionLog {
  /** Execution ID */
  id: string;
  /** Rule ID */
  ruleId: string;
  /** Rule name */
  ruleName: string;
  /** Event type */
  eventType: RuleTrigger;
  /** Execution status */
  status: 'started' | 'success' | 'failed' | 'skipped';
  /** Start timestamp */
  startedAt: Date;
  /** Completion timestamp */
  completedAt?: Date;
  /** Duration in milliseconds */
  durationMs?: number;
  /** Error message (if failed) */
  error?: string;
  /** Event details */
  eventData?: Record<string, unknown>;
  /** Execution metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Rule execution statistics
 */
export interface RuleStatistics {
  /** Total executions */
  totalExecutions: number;
  /** Successful executions */
  successCount: number;
  /** Failed executions */
  failureCount: number;
  /** Skipped executions (condition not met) */
  skippedCount: number;
  /** Average duration in milliseconds */
  avgDurationMs: number;
  /** Last execution timestamp */
  lastExecution?: Date;
  /** Last execution status */
  lastStatus?: 'success' | 'failed' | 'skipped';
}

/**
 * Rules engine configuration
 */
export interface RulesEngineConfig {
  claudeClient: ClaudeClient;
  vaultSync: VaultMemorySync;
  maxLogEntries?: number;
  logRetentionMs?: number;
}

/**
 * Rules Engine - Event-driven automation for agents
 */
export class RulesEngine {
  private claudeClient: ClaudeClient;
  private vaultSync: VaultMemorySync;
  private rules: Map<string, AgentRule> = new Map();
  private executionLogs: RuleExecutionLog[] = [];
  private statistics: Map<string, RuleStatistics> = new Map();
  private maxLogEntries: number;
  private logRetentionMs: number;

  constructor(config: RulesEngineConfig) {
    this.claudeClient = config.claudeClient;
    this.vaultSync = config.vaultSync;
    this.maxLogEntries = config.maxLogEntries ?? 1000;
    this.logRetentionMs = config.logRetentionMs ?? 24 * 60 * 60 * 1000; // 24 hours

    logger.info('Rules engine initialized', {
      maxLogEntries: this.maxLogEntries,
      logRetentionMs: this.logRetentionMs,
    });
  }

  // ========================================================================
  // Rule Registry
  // ========================================================================

  /**
   * Register a new rule
   */
  registerRule(rule: AgentRule): void {
    // Validate rule
    if (!rule.id || !rule.name || !rule.trigger || !rule.action) {
      throw new Error('Invalid rule: missing required fields (id, name, trigger, action)');
    }

    if (this.rules.has(rule.id)) {
      logger.warn('Rule already registered, overwriting', { ruleId: rule.id });
    }

    // Set defaults
    const completeRule: AgentRule = {
      ...rule,
      priority: rule.priority ?? 0,
      enabled: rule.enabled ?? true,
    };

    this.rules.set(rule.id, completeRule);

    // Initialize statistics
    if (!this.statistics.has(rule.id)) {
      this.statistics.set(rule.id, {
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
        skippedCount: 0,
        avgDurationMs: 0,
      });
    }

    logger.info('Rule registered', {
      id: rule.id,
      name: rule.name,
      trigger: rule.trigger,
      priority: completeRule.priority,
    });
  }

  /**
   * Unregister a rule
   */
  unregisterRule(ruleId: string): boolean {
    const deleted = this.rules.delete(ruleId);

    if (deleted) {
      logger.info('Rule unregistered', { ruleId });
    } else {
      logger.warn('Rule not found for unregistration', { ruleId });
    }

    return deleted;
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
  getRules(): AgentRule[] {
    return Array.from(this.rules.values());
  }

  /**
   * Get rules by trigger type
   */
  getRulesByTrigger(trigger: RuleTrigger): AgentRule[] {
    return Array.from(this.rules.values()).filter(
      (rule) => rule.trigger === trigger && rule.enabled
    );
  }

  // ========================================================================
  // Rule Execution
  // ========================================================================

  /**
   * Execute rules matching an event
   */
  async executeRules(eventData: {
    type: RuleTrigger;
    note?: CachedFile;
    fileEvent?: FileEvent;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    const startTime = Date.now();

    try {
      // Get rules matching this trigger
      const matchingRules = this.getRulesByTrigger(eventData.type);

      if (matchingRules.length === 0) {
        logger.debug('No rules match event type', { type: eventData.type });
        return;
      }

      // Sort by priority (higher first)
      const sortedRules = matchingRules.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

      // Create execution context
      const context: RuleContext = {
        event: {
          type: eventData.type,
          timestamp: new Date(),
          data: eventData.metadata,
        },
        note: eventData.note,
        fileEvent: eventData.fileEvent,
        metadata: eventData.metadata,
        claudeClient: this.claudeClient,
        vaultSync: this.vaultSync,
      };

      // Execute all rules concurrently (with error isolation)
      const executions = sortedRules.map((rule) =>
        this.executeRule(rule, context).catch((error) => {
          // Log error but don't throw (error isolation)
          logger.error('Rule execution failed (isolated)', error instanceof Error ? error : new Error(String(error)), {
            ruleId: rule.id,
            ruleName: rule.name,
          });
        })
      );

      await Promise.all(executions);

      const duration = Date.now() - startTime;
      logger.debug('Rules executed for event', {
        type: eventData.type,
        rulesCount: sortedRules.length,
        durationMs: duration,
      });
    } catch (error) {
      logger.error('Rule execution batch failed', error instanceof Error ? error : new Error(String(error)), {
        eventType: eventData.type,
      });
      throw error;
    }
  }

  /**
   * Execute a single rule
   */
  private async executeRule(rule: AgentRule, context: RuleContext): Promise<void> {
    const executionId = `${rule.id}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const startTime = Date.now();

    // Create log entry
    const logEntry: RuleExecutionLog = {
      id: executionId,
      ruleId: rule.id,
      ruleName: rule.name,
      eventType: context.event.type,
      status: 'started',
      startedAt: new Date(),
      eventData: context.event.data,
    };

    this.addLogEntry(logEntry);

    try {
      // Evaluate condition if present
      if (rule.condition) {
        const conditionMet = await Promise.resolve(rule.condition(context));

        if (!conditionMet) {
          logEntry.status = 'skipped';
          logEntry.completedAt = new Date();
          logEntry.durationMs = Date.now() - startTime;
          this.updateStatistics(rule.id, 'skipped', logEntry.durationMs);

          logger.debug('Rule condition not met, skipping', {
            ruleId: rule.id,
            ruleName: rule.name,
          });

          return;
        }
      }

      // Execute action
      await Promise.resolve(rule.action(context));

      // Update log entry
      logEntry.status = 'success';
      logEntry.completedAt = new Date();
      logEntry.durationMs = Date.now() - startTime;
      this.updateStatistics(rule.id, 'success', logEntry.durationMs);

      logger.debug('Rule executed successfully', {
        ruleId: rule.id,
        ruleName: rule.name,
        durationMs: logEntry.durationMs,
      });
    } catch (error) {
      // Update log entry
      logEntry.status = 'failed';
      logEntry.completedAt = new Date();
      logEntry.durationMs = Date.now() - startTime;
      logEntry.error = error instanceof Error ? error.message : String(error);
      this.updateStatistics(rule.id, 'failed', logEntry.durationMs);

      logger.error('Rule action failed', error instanceof Error ? error : new Error(String(error)), {
        ruleId: rule.id,
        ruleName: rule.name,
        durationMs: logEntry.durationMs,
      });

      throw error; // Re-throw for isolation handling
    }
  }

  // ========================================================================
  // Logging & Statistics
  // ========================================================================

  /**
   * Add execution log entry (with circular buffer)
   */
  private addLogEntry(entry: RuleExecutionLog): void {
    this.executionLogs.push(entry);

    // Implement circular buffer
    if (this.executionLogs.length > this.maxLogEntries) {
      this.executionLogs.shift();
    }

    // Clean old entries
    this.cleanOldLogs();
  }

  /**
   * Clean old log entries
   */
  private cleanOldLogs(): void {
    const cutoffTime = Date.now() - this.logRetentionMs;
    this.executionLogs = this.executionLogs.filter(
      (log) => log.startedAt.getTime() > cutoffTime
    );
  }

  /**
   * Update rule statistics
   */
  private updateStatistics(
    ruleId: string,
    status: 'success' | 'failed' | 'skipped',
    durationMs: number
  ): void {
    const stats = this.statistics.get(ruleId);
    if (!stats) return;

    stats.totalExecutions++;
    stats.lastExecution = new Date();
    stats.lastStatus = status;

    if (status === 'success') {
      stats.successCount++;
    } else if (status === 'failed') {
      stats.failureCount++;
    } else if (status === 'skipped') {
      stats.skippedCount++;
    }

    // Update average duration (exponential moving average)
    if (stats.totalExecutions === 1) {
      stats.avgDurationMs = durationMs;
    } else {
      stats.avgDurationMs = (stats.avgDurationMs * 0.8) + (durationMs * 0.2);
    }
  }

  /**
   * Get execution logs
   */
  getExecutionLogs(options?: {
    ruleId?: string;
    status?: RuleExecutionLog['status'];
    limit?: number;
    since?: Date;
  }): RuleExecutionLog[] {
    let logs = [...this.executionLogs];

    // Filter by rule ID
    if (options?.ruleId) {
      logs = logs.filter((log) => log.ruleId === options.ruleId);
    }

    // Filter by status
    if (options?.status) {
      logs = logs.filter((log) => log.status === options.status);
    }

    // Filter by time
    if (options?.since !== undefined) {
      const sinceDate = options.since;
      logs = logs.filter((log) => log.startedAt >= sinceDate);
    }

    // Sort by most recent first
    logs.sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());

    // Limit results
    if (options?.limit) {
      logs = logs.slice(0, options.limit);
    }

    return logs;
  }

  /**
   * Get rule statistics
   */
  getStatistics(ruleId?: string): Map<string, RuleStatistics> | RuleStatistics | undefined {
    if (ruleId) {
      return this.statistics.get(ruleId);
    }
    return new Map(this.statistics);
  }

  /**
   * Get rules status (for admin dashboard)
   */
  getRulesStatus(): {
    rules: Array<{
      id: string;
      name: string;
      trigger: RuleTrigger;
      enabled: boolean;
      priority: number;
      statistics: RuleStatistics;
      lastExecution?: {
        timestamp: Date;
        status: string;
        durationMs?: number;
      };
    }>;
    summary: {
      totalRules: number;
      enabledRules: number;
      totalExecutions: number;
      recentLogs: RuleExecutionLog[];
    };
  } {
    const rules = Array.from(this.rules.values()).map((rule) => {
      const stats = this.statistics.get(rule.id);
      const recentLog = this.executionLogs
        .filter((log) => log.ruleId === rule.id)
        .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime())[0];

      return {
        id: rule.id,
        name: rule.name,
        trigger: rule.trigger,
        enabled: rule.enabled ?? true,
        priority: rule.priority ?? 0,
        statistics: stats ?? {
          totalExecutions: 0,
          successCount: 0,
          failureCount: 0,
          skippedCount: 0,
          avgDurationMs: 0,
        },
        lastExecution: recentLog ? {
          timestamp: recentLog.startedAt,
          status: recentLog.status,
          durationMs: recentLog.durationMs,
        } : undefined,
      };
    });

    const totalExecutions = Array.from(this.statistics.values())
      .reduce((sum, stats) => sum + stats.totalExecutions, 0);

    return {
      rules,
      summary: {
        totalRules: this.rules.size,
        enabledRules: rules.filter((r) => r.enabled).length,
        totalExecutions,
        recentLogs: this.getExecutionLogs({ limit: 10 }),
      },
    };
  }

  /**
   * Clear all execution logs
   */
  clearLogs(): void {
    this.executionLogs = [];
    logger.info('Execution logs cleared');
  }

  /**
   * Reset all statistics
   */
  resetStatistics(): void {
    this.statistics.clear();
    this.rules.forEach((rule) => {
      this.statistics.set(rule.id, {
        totalExecutions: 0,
        successCount: 0,
        failureCount: 0,
        skippedCount: 0,
        avgDurationMs: 0,
      });
    });
    logger.info('Statistics reset');
  }
}

/**
 * Create a rules engine instance
 */
export function createRulesEngine(config: RulesEngineConfig): RulesEngine {
  return new RulesEngine(config);
}
