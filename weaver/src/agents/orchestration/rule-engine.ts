/**
 * Rule Engine Core - Intelligent rule-based orchestration
 *
 * Evaluates JSON-based rules for conditional execution, agent routing,
 * task splitting, and priority adjustment.
 *
 * Features:
 * - JSON DSL for rule definition
 * - Fast evaluation with caching
 * - Conflict detection and resolution
 * - Priority-based rule ordering
 * - Performance monitoring
 *
 * @example
 * ```typescript
 * const engine = new RuleEngine({ rulesFile: '~/.weaver/agent-rules.json' });
 * await engine.loadRules();
 * const results = await engine.evaluateTask(task, context);
 * ```
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { logger } from '../../utils/logger.js';
import type {
  OrchestrationRule,
  RuleContext,
  RuleEvaluationResult,
  RuleConflict,
  RuleEngineConfig,
  OrchestrationMetrics,
} from './types.js';
import type { Task } from '../coordinator.js';

/**
 * Rule Engine for intelligent orchestration
 */
export class RuleEngine {
  private rules: OrchestrationRule[] = [];
  private config: Required<RuleEngineConfig>;
  private evaluationCache = new Map<string, RuleEvaluationResult>();
  private metrics: OrchestrationMetrics;

  constructor(config: RuleEngineConfig = {}) {
    this.config = {
      rulesFile: config.rulesFile ?? join(homedir(), '.weaver', 'agent-rules.json'),
      enableTiming: config.enableTiming ?? true,
      maxEvaluationTime: config.maxEvaluationTime ?? 10,
      enableConflictDetection: config.enableConflictDetection ?? true,
      enableCaching: config.enableCaching ?? true,
      cacheTTL: config.cacheTTL ?? 60000,
    };

    this.metrics = {
      totalTasks: 0,
      tasksRouted: 0,
      tasksSplit: 0,
      priorityAdjustments: 0,
      averageRoutingTime: 0,
      averageEvaluationTime: 0,
      agentUtilization: new Map(),
      conflictsDetected: 0,
      conflictsResolved: 0,
    };
  }

  // ========================================================================
  // Rule Loading
  // ========================================================================

  /**
   * Load rules from JSON file
   */
  async loadRules(): Promise<void> {
    try {
      const content = await readFile(this.config.rulesFile, 'utf-8');
      const data = JSON.parse(content);

      if (!data.rules || !Array.isArray(data.rules)) {
        throw new Error('Invalid rules file: missing "rules" array');
      }

      // Validate and sort rules by priority
      this.rules = data.rules
        .filter((rule: OrchestrationRule) => rule.enabled !== false)
        .map((rule: OrchestrationRule) => this.validateRule(rule))
        .sort((a, b) => b.priority - a.priority);

      logger.info('✅ Rules loaded successfully', {
        count: this.rules.length,
        file: this.config.rulesFile,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        logger.warn('No rules file found, using empty ruleset', {
          file: this.config.rulesFile,
        });
        this.rules = [];
      } else {
        logger.error('Failed to load rules', error as Error);
        throw error;
      }
    }
  }

  /**
   * Add rule programmatically
   */
  addRule(rule: OrchestrationRule): void {
    const validatedRule = this.validateRule(rule);
    this.rules.push(validatedRule);
    this.rules.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Remove rule by ID
   */
  removeRule(ruleId: string): boolean {
    const initialLength = this.rules.length;
    this.rules = this.rules.filter(r => r.id !== ruleId);
    return this.rules.length < initialLength;
  }

  /**
   * Get all loaded rules
   */
  getRules(): OrchestrationRule[] {
    return [...this.rules];
  }

  // ========================================================================
  // Rule Evaluation
  // ========================================================================

  /**
   * Evaluate all rules for a task
   */
  async evaluateTask(task: Task, context: RuleContext): Promise<RuleEvaluationResult[]> {
    const startTime = Date.now();
    const results: RuleEvaluationResult[] = [];

    this.metrics.totalTasks++;

    for (const rule of this.rules) {
      const cacheKey = this.getCacheKey(rule.id, task.id);

      // Check cache
      if (this.config.enableCaching && this.evaluationCache.has(cacheKey)) {
        const cached = this.evaluationCache.get(cacheKey)!;
        if (Date.now() - cached.evaluationTime < this.config.cacheTTL) {
          results.push(cached);
          continue;
        }
      }

      // Evaluate rule
      const result = await this.evaluateRule(rule, task, context);
      results.push(result);

      // Cache result
      if (this.config.enableCaching) {
        this.evaluationCache.set(cacheKey, result);
      }

      // Track metrics
      if (result.matched) {
        switch (result.action) {
          case 'route_to_agent':
            this.metrics.tasksRouted++;
            break;
          case 'split_parallel':
            this.metrics.tasksSplit++;
            break;
          case 'adjust_priority':
            this.metrics.priorityAdjustments++;
            break;
        }
      }
    }

    // Update timing metrics
    const evaluationTime = Date.now() - startTime;
    this.updateAverageEvaluationTime(evaluationTime);

    // Detect conflicts
    if (this.config.enableConflictDetection) {
      const conflicts = this.detectConflicts(results);
      if (conflicts.length > 0) {
        this.metrics.conflictsDetected += conflicts.length;
        const resolved = this.resolveConflicts(results, conflicts);
        this.metrics.conflictsResolved += resolved.length;
      }
    }

    return results;
  }

  /**
   * Evaluate single rule
   */
  private async evaluateRule(
    rule: OrchestrationRule,
    task: Task,
    context: RuleContext
  ): Promise<RuleEvaluationResult> {
    const startTime = Date.now();

    try {
      // Create evaluation context
      const evalContext = {
        task,
        ...context,
      };

      // Evaluate condition with timeout
      const matched = await this.evaluateConditionWithTimeout(
        rule.condition,
        evalContext,
        this.config.maxEvaluationTime
      );

      const evaluationTime = Date.now() - startTime;

      if (!matched) {
        return {
          ruleId: rule.id,
          matched: false,
          evaluationTime,
        };
      }

      // Build result based on action
      const result: RuleEvaluationResult = {
        ruleId: rule.id,
        matched: true,
        action: rule.action,
        evaluationTime,
      };

      switch (rule.action) {
        case 'route_to_agent':
          result.agent = rule.agent;
          break;
        case 'adjust_priority':
          result.priorityAdjustment = rule.priority_adjustment;
          break;
        case 'set_timeout':
          result.timeout = rule.timeout_ms;
          break;
        case 'skip_task':
          result.skip = true;
          break;
      }

      return result;
    } catch (error) {
      logger.error('Rule evaluation error', error as Error, { ruleId: rule.id });
      return {
        ruleId: rule.id,
        matched: false,
        error: error instanceof Error ? error.message : String(error),
        evaluationTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Evaluate condition with timeout protection
   */
  private async evaluateConditionWithTimeout(
    condition: string,
    context: unknown,
    timeoutMs: number
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Rule evaluation timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      try {
        // Create safe evaluation function
        // eslint-disable-next-line @typescript-eslint/no-implied-eval
        const evalFn = new Function('context', `
          with (context) {
            return ${condition};
          }
        `);

        const result = evalFn(context);
        clearTimeout(timeout);
        resolve(Boolean(result));
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  // ========================================================================
  // Conflict Detection & Resolution
  // ========================================================================

  /**
   * Detect conflicts between rule results
   */
  private detectConflicts(results: RuleEvaluationResult[]): RuleConflict[] {
    const conflicts: RuleConflict[] = [];
    const matchedResults = results.filter(r => r.matched);

    // Check for conflicting agent assignments
    const agentAssignments = matchedResults.filter(r => r.action === 'route_to_agent');
    if (agentAssignments.length > 1) {
      const agents = agentAssignments.map(r => r.agent);
      const uniqueAgents = new Set(agents);
      if (uniqueAgents.size > 1) {
        conflicts.push({
          ruleIds: agentAssignments.map(r => r.ruleId),
          conflictType: 'agent',
          description: `Multiple rules assign different agents: ${Array.from(uniqueAgents).join(', ')}`,
          resolution: 'Use highest priority rule',
        });
      }
    }

    // Check for conflicting priority adjustments
    const priorityAdjustments = matchedResults.filter(r => r.action === 'adjust_priority');
    if (priorityAdjustments.length > 1) {
      conflicts.push({
        ruleIds: priorityAdjustments.map(r => r.ruleId),
        conflictType: 'priority',
        description: 'Multiple rules adjust priority',
        resolution: 'Sum all adjustments',
      });
    }

    return conflicts;
  }

  /**
   * Resolve conflicts using priority-based strategy
   */
  private resolveConflicts(
    results: RuleEvaluationResult[],
    conflicts: RuleConflict[]
  ): RuleConflict[] {
    const resolved: RuleConflict[] = [];

    for (const conflict of conflicts) {
      // Resolution strategy: highest priority rule wins
      const conflictingResults = results.filter(r => conflict.ruleIds.includes(r.ruleId));

      if (conflict.conflictType === 'agent') {
        // Keep only highest priority result
        const sorted = conflictingResults.sort((a, b) => {
          const ruleA = this.rules.find(r => r.id === a.ruleId);
          const ruleB = this.rules.find(r => r.id === b.ruleId);
          return (ruleB?.priority ?? 0) - (ruleA?.priority ?? 0);
        });

        // Mark others as unmatched
        for (let i = 1; i < sorted.length; i++) {
          sorted[i]!.matched = false;
        }

        resolved.push(conflict);
      } else if (conflict.conflictType === 'priority') {
        // Sum all priority adjustments
        // This is already handled by the caller collecting all adjustments
        resolved.push(conflict);
      }
    }

    return resolved;
  }

  // ========================================================================
  // Validation & Helpers
  // ========================================================================

  /**
   * Validate rule structure
   */
  private validateRule(rule: OrchestrationRule): OrchestrationRule {
    if (!rule.id) {
      throw new Error('Rule missing required field: id');
    }
    if (!rule.condition) {
      throw new Error(`Rule ${rule.id} missing required field: condition`);
    }
    if (!rule.action) {
      throw new Error(`Rule ${rule.id} missing required field: action`);
    }
    if (typeof rule.priority !== 'number') {
      throw new Error(`Rule ${rule.id} missing or invalid priority`);
    }

    // Action-specific validation
    switch (rule.action) {
      case 'route_to_agent':
        if (!rule.agent) {
          throw new Error(`Rule ${rule.id} with route_to_agent action must specify agent`);
        }
        break;
      case 'split_parallel':
        if (!rule.max_subtasks || rule.max_subtasks < 2) {
          throw new Error(`Rule ${rule.id} with split_parallel must specify max_subtasks >= 2`);
        }
        break;
      case 'adjust_priority':
        if (typeof rule.priority_adjustment !== 'number') {
          throw new Error(`Rule ${rule.id} with adjust_priority must specify priority_adjustment`);
        }
        break;
      case 'set_timeout':
        if (!rule.timeout_ms || rule.timeout_ms <= 0) {
          throw new Error(`Rule ${rule.id} with set_timeout must specify timeout_ms > 0`);
        }
        break;
    }

    return rule;
  }

  /**
   * Generate cache key
   */
  private getCacheKey(ruleId: string, taskId: string): string {
    return `${ruleId}:${taskId}`;
  }

  /**
   * Update average evaluation time
   */
  private updateAverageEvaluationTime(newTime: number): void {
    const total = this.metrics.totalTasks;
    const current = this.metrics.averageEvaluationTime;
    this.metrics.averageEvaluationTime = (current * (total - 1) + newTime) / total;
  }

  /**
   * Clear evaluation cache
   */
  clearCache(): void {
    this.evaluationCache.clear();
  }

  /**
   * Get performance metrics
   */
  getMetrics(): OrchestrationMetrics {
    return { ...this.metrics };
  }

  /**
   * Reset metrics
   */
  resetMetrics(): void {
    this.metrics = {
      totalTasks: 0,
      tasksRouted: 0,
      tasksSplit: 0,
      priorityAdjustments: 0,
      averageRoutingTime: 0,
      averageEvaluationTime: 0,
      agentUtilization: new Map(),
      conflictsDetected: 0,
      conflictsResolved: 0,
    };
  }
}

/**
 * Create a rule engine instance
 */
export function createRuleEngine(config?: RuleEngineConfig): RuleEngine {
  return new RuleEngine(config);
}
