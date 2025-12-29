import { createLogger } from "../utils/logger.js";
class CircularBuffer {
  constructor(capacity) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }
  buffer;
  head = 0;
  tail = 0;
  count = 0;
  push(item) {
    this.buffer[this.tail] = item;
    this.tail = (this.tail + 1) % this.capacity;
    if (this.count < this.capacity) {
      this.count++;
    } else {
      this.head = (this.head + 1) % this.capacity;
    }
  }
  toArray() {
    const result = [];
    for (let i = 0; i < this.count; i++) {
      const idx = (this.head + i) % this.capacity;
      const item = this.buffer[idx];
      if (item !== void 0) {
        result.push(item);
      }
    }
    return result;
  }
  getLatest(n) {
    const all = this.toArray();
    return all.slice(-n);
  }
  clear() {
    this.buffer = new Array(this.capacity);
    this.head = 0;
    this.tail = 0;
    this.count = 0;
  }
  get size() {
    return this.count;
  }
}
const PRIORITY_ORDER = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3
};
class RulesEngine {
  rules = /* @__PURE__ */ new Map();
  executionLogs;
  ruleStats = /* @__PURE__ */ new Map();
  triggerStats = /* @__PURE__ */ new Map();
  activeExecutions = 0;
  logger;
  config;
  constructor(config = {}) {
    this.config = {
      maxConcurrency: config.maxConcurrency ?? 10,
      defaultTimeout: config.defaultTimeout ?? 3e4,
      logBufferSize: config.logBufferSize ?? 1e3,
      verbose: config.verbose ?? false,
      logger: config.logger ?? createLogger("RulesEngine")
    };
    this.logger = this.config.logger;
    this.executionLogs = new CircularBuffer(this.config.logBufferSize);
    const allTriggers = ["file:add", "file:change", "file:unlink", "graph:update", "agent:complete", "manual"];
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
  registerRule(rule) {
    if (this.rules.has(rule.id)) {
      this.logger.warn(`Rule with id '${rule.id}' already exists, replacing`, { ruleId: rule.id });
    }
    const normalizedRule = {
      ...rule,
      priority: rule.priority ?? "normal",
      enabled: rule.enabled ?? true,
      timeout: rule.timeout ?? this.config.defaultTimeout,
      continueOnFailure: rule.continueOnFailure ?? true
    };
    this.rules.set(rule.id, normalizedRule);
    this.ruleStats.set(rule.id, {
      ruleId: rule.id,
      ruleName: rule.name,
      totalExecutions: 0,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      averageExecutionTime: 0,
      minExecutionTime: Infinity,
      maxExecutionTime: 0
    });
    if (this.config.verbose) {
      this.logger.debug(`Registered rule: ${rule.name}`, {
        ruleId: rule.id,
        triggers: rule.triggers,
        priority: normalizedRule.priority
      });
    }
  }
  /**
   * Register multiple rules at once
   */
  registerRules(rules) {
    for (const rule of rules) {
      this.registerRule(rule);
    }
  }
  /**
   * Unregister a rule by ID
   */
  unregisterRule(ruleId) {
    const existed = this.rules.delete(ruleId);
    if (existed) {
      this.logger.debug(`Unregistered rule: ${ruleId}`);
    }
    return existed;
  }
  /**
   * Get a rule by ID
   */
  getRule(ruleId) {
    return this.rules.get(ruleId);
  }
  /**
   * Get all registered rules
   */
  getAllRules() {
    return Array.from(this.rules.values());
  }
  /**
   * Get rules by trigger type
   */
  getRulesByTrigger(trigger) {
    return Array.from(this.rules.values()).filter(
      (rule) => rule.enabled && rule.triggers.includes(trigger)
    );
  }
  /**
   * Enable a rule
   */
  enableRule(ruleId) {
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
  disableRule(ruleId) {
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
  async trigger(trigger, context = {}) {
    const fullContext = {
      trigger,
      timestamp: /* @__PURE__ */ new Date(),
      ...context,
      engine: this
    };
    const applicableRules = this.getRulesByTrigger(trigger).sort(
      (a, b) => PRIORITY_ORDER[a.priority ?? "normal"] - PRIORITY_ORDER[b.priority ?? "normal"]
    );
    if (applicableRules.length === 0) {
      if (this.config.verbose) {
        this.logger.debug(`No rules to execute for trigger: ${trigger}`);
      }
      return [];
    }
    this.logger.info(`Executing ${applicableRules.length} rules for trigger: ${trigger}`, {
      trigger,
      ruleCount: applicableRules.length
    });
    const logs = [];
    const executing = [];
    for (const rule of applicableRules) {
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
    await Promise.all(executing);
    return logs;
  }
  /**
   * Execute a single rule
   */
  async executeRule(rule, context) {
    const startTime = Date.now();
    this.activeExecutions++;
    const log = {
      ruleId: rule.id,
      ruleName: rule.name,
      status: "running",
      trigger: context.trigger,
      startedAt: /* @__PURE__ */ new Date(),
      contextSnapshot: {
        filePath: context.filePath,
        trigger: context.trigger,
        timestamp: context.timestamp
      }
    };
    try {
      if (rule.condition) {
        log.conditionEvaluated = true;
        const conditionResult = await this.withTimeout(
          Promise.resolve(rule.condition(context)),
          rule.timeout ?? this.config.defaultTimeout,
          `Condition evaluation for rule '${rule.name}'`
        );
        log.conditionResult = conditionResult;
        if (!conditionResult) {
          log.status = "skipped";
          log.completedAt = /* @__PURE__ */ new Date();
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
      await this.withTimeout(
        Promise.resolve(rule.action(context)),
        rule.timeout ?? this.config.defaultTimeout,
        `Action execution for rule '${rule.name}'`
      );
      log.status = "success";
      log.completedAt = /* @__PURE__ */ new Date();
      log.duration = Date.now() - startTime;
      if (this.config.verbose) {
        this.logger.debug(`Rule executed successfully: ${rule.name}`, {
          ruleId: rule.id,
          duration: log.duration
        });
      }
    } catch (error) {
      log.status = "failure";
      log.completedAt = /* @__PURE__ */ new Date();
      log.duration = Date.now() - startTime;
      log.error = error instanceof Error ? error.message : String(error);
      this.logger.error(`Rule execution failed: ${rule.name}`, error instanceof Error ? error : void 0, {
        ruleId: rule.id,
        trigger: context.trigger
      });
      if (!rule.continueOnFailure) {
        throw error;
      }
    } finally {
      this.activeExecutions--;
      this.updateStats(rule, log, log.status === "success");
      this.executionLogs.push(log);
    }
    return log;
  }
  /**
   * Execute a rule by ID with custom context
   */
  async executeRuleById(ruleId, context = {}) {
    const rule = this.rules.get(ruleId);
    if (!rule) {
      this.logger.warn(`Rule not found: ${ruleId}`);
      return null;
    }
    const fullContext = {
      trigger: "manual",
      timestamp: /* @__PURE__ */ new Date(),
      ...context,
      engine: this
    };
    return this.executeRule(rule, fullContext);
  }
  /**
   * Wrap a promise with a timeout
   */
  async withTimeout(promise, timeoutMs, operation) {
    let timeoutId;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`Timeout after ${timeoutMs}ms: ${operation}`));
      }, timeoutMs);
    });
    try {
      const result = await Promise.race([promise, timeoutPromise]);
      clearTimeout(timeoutId);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  // --------------------------------------------------------------------------
  // Statistics and Metrics
  // --------------------------------------------------------------------------
  /**
   * Update statistics after rule execution
   */
  updateStats(rule, log, success) {
    const stats = this.ruleStats.get(rule.id);
    if (!stats) return;
    stats.totalExecutions++;
    stats.lastExecutedAt = log.completedAt;
    if (log.status === "skipped") {
      stats.skippedCount++;
    } else if (success) {
      stats.successCount++;
      stats.lastSuccessAt = log.completedAt;
    } else {
      stats.failureCount++;
      stats.lastFailureAt = log.completedAt;
    }
    if (log.duration !== void 0 && log.status !== "skipped") {
      const totalTime = stats.averageExecutionTime * (stats.totalExecutions - stats.skippedCount - 1);
      const execCount = stats.totalExecutions - stats.skippedCount;
      stats.averageExecutionTime = execCount > 0 ? (totalTime + log.duration) / execCount : 0;
      stats.minExecutionTime = Math.min(stats.minExecutionTime, log.duration);
      stats.maxExecutionTime = Math.max(stats.maxExecutionTime, log.duration);
    }
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
  getRuleStatistics(ruleId) {
    return this.ruleStats.get(ruleId);
  }
  /**
   * Get engine-wide statistics
   */
  getStatistics() {
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
    const triggerStatsMap = /* @__PURE__ */ new Map();
    for (const [trigger, stat] of this.triggerStats) {
      triggerStatsMap.set(trigger, {
        totalExecutions: stat.totalExecutions,
        successCount: stat.successCount,
        averageTime: stat.totalExecutions > 0 ? stat.totalTime / stat.totalExecutions : 0
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
      triggerStats: triggerStatsMap
    };
  }
  // --------------------------------------------------------------------------
  // Execution Logs
  // --------------------------------------------------------------------------
  /**
   * Get execution logs (most recent first)
   */
  getExecutionLogs(limit) {
    const logs = this.executionLogs.toArray().reverse();
    return limit ? logs.slice(0, limit) : logs;
  }
  /**
   * Get logs for a specific rule
   */
  getLogsForRule(ruleId, limit) {
    const logs = this.executionLogs.toArray().filter((log) => log.ruleId === ruleId).reverse();
    return limit ? logs.slice(0, limit) : logs;
  }
  /**
   * Get logs for a specific trigger
   */
  getLogsForTrigger(trigger, limit) {
    const logs = this.executionLogs.toArray().filter((log) => log.trigger === trigger).reverse();
    return limit ? logs.slice(0, limit) : logs;
  }
  /**
   * Get failed execution logs
   */
  getFailedLogs(limit) {
    const logs = this.executionLogs.toArray().filter((log) => log.status === "failure").reverse();
    return limit ? logs.slice(0, limit) : logs;
  }
  /**
   * Clear execution logs
   */
  clearLogs() {
    this.executionLogs.clear();
    this.logger.debug("Execution logs cleared");
  }
  // --------------------------------------------------------------------------
  // Utility Methods
  // --------------------------------------------------------------------------
  /**
   * Reset all statistics
   */
  resetStatistics() {
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
        maxExecutionTime: 0
      });
    }
    for (const trigger of this.triggerStats.keys()) {
      this.triggerStats.set(trigger, { totalExecutions: 0, successCount: 0, totalTime: 0 });
    }
    this.logger.debug("Statistics reset");
  }
  /**
   * Get a summary of the engine state
   */
  getSummary() {
    const allRules = Array.from(this.rules.values());
    const triggersConfigured = /* @__PURE__ */ new Set();
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
      logsCount: this.executionLogs.size
    };
  }
}
function createRulesEngine(config) {
  return new RulesEngine(config);
}
function createRule(id, name, triggers, action, options = {}) {
  return {
    id,
    name,
    triggers,
    action,
    ...options
  };
}
function createConditionalRule(id, name, triggers, condition, action, options = {}) {
  return {
    id,
    name,
    triggers,
    condition,
    action,
    ...options
  };
}
function createFileChangeLogRule(logger = createLogger("FileChangeRule")) {
  return {
    id: "builtin:file-change-log",
    name: "File Change Logger",
    description: "Logs all file changes to the console",
    triggers: ["file:add", "file:change", "file:unlink"],
    priority: "low",
    action: (context) => {
      logger.info(`File ${context.trigger.replace("file:", "")}: ${context.filePath ?? "unknown"}`);
    }
  };
}
function createGraphUpdateNotificationRule(callback) {
  return {
    id: "builtin:graph-update-notify",
    name: "Graph Update Notification",
    description: "Notifies when the knowledge graph is updated",
    triggers: ["graph:update"],
    priority: "normal",
    action: callback
  };
}
function createAgentCompletionRule(handler) {
  return {
    id: "builtin:agent-completion-handler",
    name: "Agent Completion Handler",
    description: "Handles agent task completion events",
    triggers: ["agent:complete"],
    priority: "high",
    condition: (context) => context.agentData !== void 0,
    action: async (context) => {
      if (context.agentData) {
        await handler(context.agentData);
      }
    }
  };
}
export {
  RulesEngine,
  createAgentCompletionRule,
  createConditionalRule,
  createFileChangeLogRule,
  createGraphUpdateNotificationRule,
  createRule,
  createRulesEngine
};
//# sourceMappingURL=rules-engine.js.map
