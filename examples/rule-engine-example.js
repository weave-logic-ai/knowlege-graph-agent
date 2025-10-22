/**
 * Example usage of RuleEngine
 *
 * Demonstrates rule creation, priority management, and conflict resolution.
 */

const { RuleEngine, RulePriority, ConflictStrategy } = require('../src/agents/RuleEngine');

async function example() {
  // Initialize rule engine
  const engine = new RuleEngine({
    conflictStrategy: ConflictStrategy.PRIORITY,
    enableMetrics: true,

    // Optional: Add custom callbacks
    onRuleExecuted: (execution) => {
      console.log(`✓ Executed rule: ${execution.ruleName} in ${execution.duration}ms`);
    },
    onRuleConflict: (conflicts) => {
      console.log(`⚠ Detected ${conflicts.length} rule conflicts`);
    }
  });

  // Define rules
  const rules = [
    {
      id: 'high-token-alert',
      name: 'High Token Usage Alert',
      priority: RulePriority.HIGH,
      tags: ['monitoring', 'tokens'],
      condition: (context) => context.tokenUsage > 0.8,
      action: (context) => {
        console.log(`⚠ WARNING: Token usage at ${(context.tokenUsage * 100).toFixed(1)}%`);
        return { alert: true, level: 'warning' };
      }
    },
    {
      id: 'critical-token-alert',
      name: 'Critical Token Usage Alert',
      priority: RulePriority.CRITICAL,
      tags: ['monitoring', 'tokens'],
      condition: (context) => context.tokenUsage > 0.95,
      action: (context) => {
        console.log(`🚨 CRITICAL: Token usage at ${(context.tokenUsage * 100).toFixed(1)}%`);
        return { alert: true, level: 'critical' };
      }
    },
    {
      id: 'auto-save-progress',
      name: 'Auto-save Progress',
      priority: RulePriority.MEDIUM,
      tags: ['automation', 'save'],
      condition: (context) => context.changesSinceLastSave > 10,
      action: (context) => {
        console.log(`💾 Auto-saving ${context.changesSinceLastSave} changes...`);
        return { saved: true, timestamp: Date.now() };
      }
    },
    {
      id: 'performance-optimization',
      name: 'Performance Optimization Trigger',
      priority: RulePriority.LOW,
      tags: ['performance'],
      condition: (context) => context.executionTime > 5000,
      action: (context) => {
        console.log(`⚡ Slow execution detected: ${context.executionTime}ms`);
        return { optimize: true };
      }
    },
    {
      id: 'error-recovery',
      name: 'Automatic Error Recovery',
      priority: RulePriority.CRITICAL,
      tags: ['error-handling'],
      condition: (context) => context.errorCount > 0,
      action: (context) => {
        console.log(`🔧 Initiating error recovery (${context.errorCount} errors)`);
        return { recovered: true };
      }
    }
  ];

  // Add all rules
  console.log('Adding rules to engine...\n');
  rules.forEach(rule => {
    engine.addRule(rule);
    console.log(`✓ Added rule: ${rule.name} (Priority: ${rule.priority})`);
  });

  console.log('\n--- Scenario 1: Normal Operation ---');
  const context1 = {
    tokenUsage: 0.5,
    changesSinceLastSave: 5,
    executionTime: 2000,
    errorCount: 0
  };
  const result1 = await engine.evaluate(context1);
  console.log(`Executed: ${result1.executed.length} rules`);
  console.log(`Skipped: ${result1.skipped.length} rules`);
  console.log(`Duration: ${result1.duration}ms\n`);

  console.log('--- Scenario 2: High Token Usage ---');
  const context2 = {
    tokenUsage: 0.85,
    changesSinceLastSave: 15,
    executionTime: 3000,
    errorCount: 0
  };
  const result2 = await engine.evaluate(context2);
  console.log(`Executed: ${result2.executed.length} rules`);
  console.log(`Duration: ${result2.duration}ms\n`);

  console.log('--- Scenario 3: Critical State (Multiple Rules) ---');
  const context3 = {
    tokenUsage: 0.98,
    changesSinceLastSave: 20,
    executionTime: 6000,
    errorCount: 3
  };
  const result3 = await engine.evaluate(context3);
  console.log(`Executed: ${result3.executed.length} rules`);
  console.log(`Conflicts: ${result3.conflicts.length}`);
  console.log(`Duration: ${result3.duration}ms\n`);

  console.log('--- Scenario 4: Tagged Rule Evaluation ---');
  const context4 = {
    tokenUsage: 0.9,
    changesSinceLastSave: 12,
    executionTime: 4000,
    errorCount: 0
  };
  const result4 = await engine.evaluate(context4, {
    tags: ['monitoring'] // Only evaluate monitoring rules
  });
  console.log(`Executed: ${result4.executed.length} rules (monitoring only)`);
  console.log(`Duration: ${result4.duration}ms\n`);

  // Display metrics
  console.log('--- Engine Metrics ---');
  const metrics = engine.getMetrics();
  console.log(`Total Evaluations: ${metrics.totalEvaluations}`);
  console.log(`Total Executions: ${metrics.totalExecutions}`);
  console.log(`Total Conflicts: ${metrics.totalConflicts}`);
  console.log(`Average Evaluation Time: ${metrics.averageEvaluationTime.toFixed(2)}ms`);
  console.log('\nRule Execution Counts:');
  Object.entries(metrics.ruleExecutionCounts).forEach(([ruleId, count]) => {
    const rule = engine.getRule(ruleId);
    console.log(`  ${rule.name}: ${count} times`);
  });

  // Display execution history
  console.log('\n--- Execution History (Last 5) ---');
  const history = engine.getHistory({ limit: 5 });
  history.forEach(exec => {
    console.log(`[${new Date(exec.timestamp).toLocaleTimeString()}] ${exec.ruleName} - ${exec.status}`);
  });
}

// Run example
if (require.main === module) {
  example().catch(console.error);
}

module.exports = example;
