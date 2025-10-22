/**
 * Agent Rule Engine
 *
 * Provides rule validation, execution, priority management, and conflict resolution
 * for autonomous agent workflows.
 *
 * @module RuleEngine
 * @author Weave-NN Development Team
 * @version 1.0.0
 */

/**
 * Rule priority levels
 * @enum {number}
 */
const RulePriority = {
  CRITICAL: 1000,
  HIGH: 750,
  MEDIUM: 500,
  LOW: 250,
  MINIMAL: 100
};

/**
 * Rule execution statuses
 * @enum {string}
 */
const RuleStatus = {
  PENDING: 'pending',
  EVALUATING: 'evaluating',
  EXECUTED: 'executed',
  FAILED: 'failed',
  SKIPPED: 'skipped',
  CONFLICT: 'conflict'
};

/**
 * Conflict resolution strategies
 * @enum {string}
 */
const ConflictStrategy = {
  PRIORITY: 'priority',        // Use highest priority rule
  FIRST_MATCH: 'first_match',  // Use first matching rule
  MERGE: 'merge',              // Merge compatible rules
  SEQUENTIAL: 'sequential',    // Execute all in sequence
  MANUAL: 'manual'             // Require manual resolution
};

/**
 * RuleEngine - Main class for managing agent rules
 *
 * @class
 * @example
 * const engine = new RuleEngine({
 *   conflictStrategy: ConflictStrategy.PRIORITY,
 *   allowDynamicRules: true
 * });
 *
 * const rule = {
 *   id: 'rule-1',
 *   name: 'High Token Alert',
 *   condition: (context) => context.tokenUsage > 0.8,
 *   action: (context) => console.log('Warning: High token usage'),
 *   priority: RulePriority.HIGH
 * };
 *
 * engine.addRule(rule);
 * await engine.evaluate(context);
 */
class RuleEngine {
  /**
   * Create a Rule Engine
   *
   * @param {Object} [config] - Configuration object
   * @param {string} [config.conflictStrategy=PRIORITY] - Default conflict resolution strategy
   * @param {boolean} [config.allowDynamicRules=true] - Allow runtime rule addition
   * @param {boolean} [config.enableMetrics=true] - Track execution metrics
   * @param {Function} [config.onRuleExecuted] - Callback after rule execution
   * @param {Function} [config.onRuleConflict] - Callback on rule conflict
   */
  constructor(config = {}) {
    this.rules = new Map();
    this.ruleGroups = new Map();
    this.executionHistory = [];
    this.config = {
      conflictStrategy: ConflictStrategy.PRIORITY,
      allowDynamicRules: true,
      enableMetrics: true,
      maxHistorySize: 1000,
      ...config
    };

    this.metrics = {
      totalEvaluations: 0,
      totalExecutions: 0,
      totalConflicts: 0,
      ruleExecutionCounts: new Map(),
      averageEvaluationTime: 0
    };
  }

  /**
   * Add a rule to the engine
   *
   * @param {Object} rule - Rule definition
   * @param {string} rule.id - Unique rule identifier
   * @param {string} rule.name - Human-readable rule name
   * @param {Function} rule.condition - Condition function (context) => boolean
   * @param {Function} rule.action - Action function (context) => any
   * @param {number} [rule.priority=MEDIUM] - Rule priority
   * @param {string[]} [rule.tags] - Rule tags for grouping
   * @param {boolean} [rule.enabled=true] - Rule enabled state
   * @param {Object} [rule.metadata] - Additional metadata
   * @returns {boolean} True if rule added successfully
   * @throws {Error} If rule is invalid or already exists
   */
  addRule(rule) {
    this.validateRule(rule);

    if (this.rules.has(rule.id)) {
      throw new Error(`Rule with ID '${rule.id}' already exists`);
    }

    // Normalize rule object
    const normalizedRule = {
      id: rule.id,
      name: rule.name,
      condition: rule.condition,
      action: rule.action,
      priority: rule.priority || RulePriority.MEDIUM,
      tags: rule.tags || [],
      enabled: rule.enabled !== false,
      metadata: rule.metadata || {},
      createdAt: Date.now(),
      executionCount: 0
    };

    this.rules.set(rule.id, normalizedRule);

    // Add to groups based on tags
    if (normalizedRule.tags.length > 0) {
      normalizedRule.tags.forEach(tag => {
        if (!this.ruleGroups.has(tag)) {
          this.ruleGroups.set(tag, new Set());
        }
        this.ruleGroups.get(tag).add(rule.id);
      });
    }

    return true;
  }

  /**
   * Validate rule structure
   *
   * @private
   * @param {Object} rule - Rule to validate
   * @throws {Error} If rule is invalid
   */
  validateRule(rule) {
    if (!rule) {
      throw new Error('Rule object is required');
    }

    if (!rule.id || typeof rule.id !== 'string') {
      throw new Error('Rule ID must be a non-empty string');
    }

    if (!rule.name || typeof rule.name !== 'string') {
      throw new Error('Rule name must be a non-empty string');
    }

    if (typeof rule.condition !== 'function') {
      throw new Error('Rule condition must be a function');
    }

    if (typeof rule.action !== 'function') {
      throw new Error('Rule action must be a function');
    }

    if (rule.priority !== undefined && typeof rule.priority !== 'number') {
      throw new Error('Rule priority must be a number');
    }
  }

  /**
   * Remove a rule from the engine
   *
   * @param {string} ruleId - Rule ID to remove
   * @returns {boolean} True if removed successfully
   */
  removeRule(ruleId) {
    const rule = this.rules.get(ruleId);

    if (!rule) {
      return false;
    }

    // Remove from groups
    rule.tags.forEach(tag => {
      const group = this.ruleGroups.get(tag);
      if (group) {
        group.delete(ruleId);
        if (group.size === 0) {
          this.ruleGroups.delete(tag);
        }
      }
    });

    // Remove from rules
    this.rules.delete(ruleId);

    return true;
  }

  /**
   * Update an existing rule
   *
   * @param {string} ruleId - Rule ID to update
   * @param {Object} updates - Properties to update
   * @returns {boolean} True if updated successfully
   */
  updateRule(ruleId, updates) {
    const rule = this.rules.get(ruleId);

    if (!rule) {
      throw new Error(`Rule not found: ${ruleId}`);
    }

    // Validate updates
    if (updates.condition && typeof updates.condition !== 'function') {
      throw new Error('Rule condition must be a function');
    }

    if (updates.action && typeof updates.action !== 'function') {
      throw new Error('Rule action must be a function');
    }

    // Apply updates
    Object.assign(rule, updates, { updatedAt: Date.now() });

    return true;
  }

  /**
   * Evaluate rules against context and execute matching rules
   *
   * @param {Object} context - Execution context
   * @param {Object} [options] - Evaluation options
   * @param {string[]} [options.tags] - Only evaluate rules with these tags
   * @param {string} [options.conflictStrategy] - Override conflict strategy
   * @returns {Promise<Object>} Evaluation results
   */
  async evaluate(context, options = {}) {
    const startTime = Date.now();
    this.metrics.totalEvaluations++;

    try {
      // Find matching rules
      const matchingRules = await this.findMatchingRules(context, options);

      if (matchingRules.length === 0) {
        return {
          executed: [],
          skipped: [],
          conflicts: [],
          duration: Date.now() - startTime
        };
      }

      // Check for conflicts
      const conflicts = this.detectConflicts(matchingRules);

      if (conflicts.length > 0) {
        this.metrics.totalConflicts++;

        if (this.config.onRuleConflict) {
          this.config.onRuleConflict(conflicts);
        }

        // Resolve conflicts
        const resolvedRules = this.resolveConflicts(
          matchingRules,
          options.conflictStrategy || this.config.conflictStrategy
        );

        return await this.executeRules(resolvedRules, context, startTime);
      }

      // Execute rules (no conflicts)
      return await this.executeRules(matchingRules, context, startTime);

    } catch (error) {
      return {
        error: error.message,
        executed: [],
        skipped: [],
        conflicts: [],
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Find all rules matching the context
   *
   * @private
   * @param {Object} context - Execution context
   * @param {Object} options - Evaluation options
   * @returns {Promise<Array>} Array of matching rules
   */
  async findMatchingRules(context, options) {
    const rulesToEvaluate = options.tags
      ? this.getRulesByTags(options.tags)
      : Array.from(this.rules.values());

    const matchingRules = [];

    for (const rule of rulesToEvaluate) {
      if (!rule.enabled) {
        continue;
      }

      try {
        const matches = await this.evaluateCondition(rule, context);
        if (matches) {
          matchingRules.push(rule);
        }
      } catch (error) {
        console.error(`Error evaluating rule ${rule.id}:`, error);
      }
    }

    return matchingRules;
  }

  /**
   * Evaluate a single rule condition
   *
   * @private
   * @param {Object} rule - Rule to evaluate
   * @param {Object} context - Execution context
   * @returns {Promise<boolean>} True if condition matches
   */
  async evaluateCondition(rule, context) {
    try {
      const result = rule.condition(context);
      return result instanceof Promise ? await result : result;
    } catch (error) {
      console.error(`Error in rule condition ${rule.id}:`, error);
      return false;
    }
  }

  /**
   * Get rules by tags
   *
   * @private
   * @param {string[]} tags - Tags to filter by
   * @returns {Array} Array of rules
   */
  getRulesByTags(tags) {
    const ruleIds = new Set();

    tags.forEach(tag => {
      const group = this.ruleGroups.get(tag);
      if (group) {
        group.forEach(id => ruleIds.add(id));
      }
    });

    return Array.from(ruleIds)
      .map(id => this.rules.get(id))
      .filter(Boolean);
  }

  /**
   * Detect conflicts between rules
   *
   * @private
   * @param {Array} rules - Rules to check
   * @returns {Array} Array of conflict groups
   */
  detectConflicts(rules) {
    // Group rules by priority level
    const priorityGroups = new Map();

    rules.forEach(rule => {
      const priority = rule.priority;
      if (!priorityGroups.has(priority)) {
        priorityGroups.set(priority, []);
      }
      priorityGroups.get(priority).push(rule);
    });

    // Conflicts occur when multiple rules at same priority level match
    const conflicts = [];

    priorityGroups.forEach((group, priority) => {
      if (group.length > 1) {
        conflicts.push({
          priority,
          rules: group.map(r => r.id)
        });
      }
    });

    return conflicts;
  }

  /**
   * Resolve conflicts between rules
   *
   * @private
   * @param {Array} rules - Conflicting rules
   * @param {string} strategy - Resolution strategy
   * @returns {Array} Resolved rules to execute
   */
  resolveConflicts(rules, strategy) {
    switch (strategy) {
      case ConflictStrategy.PRIORITY:
        // Sort by priority (highest first) and take the first
        return [rules.sort((a, b) => b.priority - a.priority)[0]];

      case ConflictStrategy.FIRST_MATCH:
        // Return first rule in the list
        return [rules[0]];

      case ConflictStrategy.MERGE:
        // Return all rules for merged execution
        return rules;

      case ConflictStrategy.SEQUENTIAL:
        // Return all rules sorted by priority
        return rules.sort((a, b) => b.priority - a.priority);

      case ConflictStrategy.MANUAL:
        // Throw error for manual resolution
        throw new Error('Manual conflict resolution required');

      default:
        return [rules.sort((a, b) => b.priority - a.priority)[0]];
    }
  }

  /**
   * Execute resolved rules
   *
   * @private
   * @param {Array} rules - Rules to execute
   * @param {Object} context - Execution context
   * @param {number} startTime - Evaluation start time
   * @returns {Promise<Object>} Execution results
   */
  async executeRules(rules, context, startTime) {
    const executed = [];
    const skipped = [];

    for (const rule of rules) {
      try {
        const actionStartTime = Date.now();
        const result = await rule.action(context);
        const actionDuration = Date.now() - actionStartTime;

        rule.executionCount++;
        this.metrics.totalExecutions++;

        const executionCount = this.metrics.ruleExecutionCounts.get(rule.id) || 0;
        this.metrics.ruleExecutionCounts.set(rule.id, executionCount + 1);

        const execution = {
          ruleId: rule.id,
          ruleName: rule.name,
          status: RuleStatus.EXECUTED,
          result,
          duration: actionDuration,
          timestamp: Date.now()
        };

        executed.push(execution);

        if (this.config.onRuleExecuted) {
          this.config.onRuleExecuted(execution);
        }

        // Add to history
        if (this.config.enableMetrics) {
          this.addToHistory(execution);
        }

      } catch (error) {
        const execution = {
          ruleId: rule.id,
          ruleName: rule.name,
          status: RuleStatus.FAILED,
          error: error.message,
          timestamp: Date.now()
        };

        skipped.push(execution);

        if (this.config.enableMetrics) {
          this.addToHistory(execution);
        }
      }
    }

    const duration = Date.now() - startTime;
    this.updateAverageEvaluationTime(duration);

    return {
      executed,
      skipped,
      conflicts: [],
      duration
    };
  }

  /**
   * Add execution to history
   *
   * @private
   * @param {Object} execution - Execution record
   */
  addToHistory(execution) {
    this.executionHistory.push(execution);

    // Trim history if needed
    if (this.executionHistory.length > this.config.maxHistorySize) {
      this.executionHistory.shift();
    }
  }

  /**
   * Update average evaluation time metric
   *
   * @private
   * @param {number} duration - Latest evaluation duration
   */
  updateAverageEvaluationTime(duration) {
    const currentAvg = this.metrics.averageEvaluationTime;
    const count = this.metrics.totalEvaluations;

    this.metrics.averageEvaluationTime =
      ((currentAvg * (count - 1)) + duration) / count;
  }

  /**
   * Get all rules
   *
   * @returns {Array} Array of all rules
   */
  getAllRules() {
    return Array.from(this.rules.values());
  }

  /**
   * Get rule by ID
   *
   * @param {string} ruleId - Rule ID
   * @returns {Object|null} Rule object or null if not found
   */
  getRule(ruleId) {
    return this.rules.get(ruleId) || null;
  }

  /**
   * Get execution metrics
   *
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return {
      ...this.metrics,
      ruleExecutionCounts: Object.fromEntries(this.metrics.ruleExecutionCounts)
    };
  }

  /**
   * Get execution history
   *
   * @param {Object} [options] - Filter options
   * @param {number} [options.limit] - Limit results
   * @param {string} [options.ruleId] - Filter by rule ID
   * @param {string} [options.status] - Filter by status
   * @returns {Array} Execution history
   */
  getHistory(options = {}) {
    let history = [...this.executionHistory];

    if (options.ruleId) {
      history = history.filter(h => h.ruleId === options.ruleId);
    }

    if (options.status) {
      history = history.filter(h => h.status === options.status);
    }

    if (options.limit) {
      history = history.slice(-options.limit);
    }

    return history;
  }

  /**
   * Clear execution history
   */
  clearHistory() {
    this.executionHistory = [];
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      totalEvaluations: 0,
      totalExecutions: 0,
      totalConflicts: 0,
      ruleExecutionCounts: new Map(),
      averageEvaluationTime: 0
    };
  }
}

// Export classes and enums
module.exports = {
  RuleEngine,
  RulePriority,
  RuleStatus,
  ConflictStrategy
};
