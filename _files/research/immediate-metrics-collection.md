# Immediate Metrics Collection Framework for Weave-NN

**Status**: Ready to implement TODAY
**Philosophy**: "Start collecting now, even if some metrics are 0"
**Storage**: SQLite (same as experience storage, blockchain ledger)
**Integration**: Hook into existing task execution paths

---

## Executive Summary

This framework defines **metrics we can start collecting immediately** with minimal instrumentation. The strategy is:

1. **Week 1**: Instrument core execution metrics (40% coverage)
2. **Week 2-4**: Gradually add domain-specific metrics (60% → 90%)
3. **Week 8**: Advanced analytics and ML-powered insights (100%)

**Key Insight**: Many metrics start at 0, but having the collection infrastructure in place means we capture growth from day 1.

---

## 1. Metrics We Can Collect Starting Today

### 1.1 Agent Execution Metrics (Immediate - 0% instrumentation)

**Already measurable in `seed-generator.ts`, `cultivate.ts`, `agents.ts`**:

```typescript
interface AgentExecutionMetrics {
  // Task-level metrics
  task_id: string;                    // UUID for task
  task_type: string;                  // 'seed', 'cultivate', 'analyze', etc.
  agent_type: string;                 // 'researcher', 'coder', 'analyst', etc.

  // Timing (wall-clock)
  start_time: Date;                   // When task started
  end_time: Date;                     // When task completed
  duration_ms: number;                // end_time - start_time

  // Success/failure
  success: boolean;                   // true/false
  error_type?: string;                // 'timeout', 'api_error', 'validation_failed'
  error_message?: string;             // Full error details
  retry_count: number;                // How many retries occurred (starts at 0)

  // Token usage (from Claude API responses)
  tokens_input: number;               // Prompt tokens (0 if not using API)
  tokens_output: number;              // Completion tokens
  tokens_total: number;               // Total tokens
  api_cost_usd: number;               // Estimated cost (0 if using local)

  // Output quality (initially 0, add scoring later)
  output_length: number;              // Character count
  quality_score?: number;             // 0-100, added in Week 3
  user_rating?: number;               // 1-5 stars from feedback system

  // Context
  files_modified: number;             // How many files changed
  files_created: number;              // How many files created
  lines_added: number;                // Git diff stats (0 if no git)
  lines_removed: number;              // Git diff stats
}
```

**Instrumentation points in existing code**:

```typescript
// weaver/src/cultivation/seed-generator.ts
export class SeedGenerator {
  async analyze(): Promise<SeedAnalysis> {
    const startTime = Date.now();
    const taskId = uuidv4();

    try {
      // Existing analysis logic...
      const result = await this.actualAnalysisWork();

      // ✅ NEW: Record success metrics
      await metricsCollector.record({
        task_id: taskId,
        task_type: 'seed_analysis',
        agent_type: 'seed-generator',
        start_time: new Date(startTime),
        end_time: new Date(),
        duration_ms: Date.now() - startTime,
        success: true,
        tokens_input: 0,  // No API call in analysis
        tokens_output: 0,
        tokens_total: 0,
        files_modified: 0,
        files_created: result.documents.length,
        lines_added: 0,  // Calculate from generated docs
        lines_removed: 0,
        retry_count: 0
      });

      return result;
    } catch (error) {
      // ✅ NEW: Record failure metrics
      await metricsCollector.record({
        task_id: taskId,
        task_type: 'seed_analysis',
        agent_type: 'seed-generator',
        start_time: new Date(startTime),
        end_time: new Date(),
        duration_ms: Date.now() - startTime,
        success: false,
        error_type: error.name,
        error_message: error.message,
        retry_count: 0
      });

      throw error;
    }
  }
}
```

### 1.2 Memory Metrics (Immediate - SQLite already exists)

**Already available in `experience-storage.ts`**:

```typescript
interface MemoryMetrics {
  // Storage operations (from experience-storage.ts)
  operation_type: 'store' | 'retrieve' | 'query' | 'batch_store';
  operation_count: number;            // How many items
  duration_ms: number;                // Query/write time
  success: boolean;

  // Cache hits/misses (add in Week 2)
  cache_hit: boolean;                 // Did we find in cache?
  cache_size_kb: number;              // Current cache size

  // Experience database stats (from getStats())
  total_experiences: number;
  total_lessons: number;
  by_domain: Record<string, number>;  // Counts per domain
  by_outcome: Record<string, number>; // Success/failure/partial
  success_rate: number;               // 0.0-1.0
  avg_duration_ms: number;

  // Growth metrics
  experiences_added_today: number;    // Daily delta
  lessons_added_today: number;
}
```

**Zero-instrumentation metrics** (already collected by `experience-storage.ts`):

- `totalExperiences` - Count of experiences in DB
- `totalLessons` - Count of lessons learned
- `successRate` - Percentage of successful tasks
- `avgDuration` - Average task completion time

**Add in Week 2** (requires new code):

```typescript
// Track cache performance
class MemoryCache {
  private hits = 0;
  private misses = 0;

  async get(key: string): Promise<any> {
    const cached = this.cache.get(key);
    if (cached) {
      this.hits++;
      await metricsCollector.record({ cache_hit: true });
      return cached;
    }

    this.misses++;
    await metricsCollector.record({ cache_hit: false });
    return null;
  }

  getHitRate(): number {
    return this.hits / (this.hits + this.misses);
  }
}
```

### 1.3 Tool/Capability Metrics (Week 2-3, start at 0)

**Currently 0, add instrumentation gradually**:

```typescript
interface ToolMetrics {
  // Tool usage (starts at 0 until we instrument)
  tool_name: string;                  // 'file_search', 'code_analysis', etc.
  tool_calls: number;                 // How many times invoked
  tool_success_rate: number;          // 0.0-1.0
  tool_latency_ms: number;            // Average execution time

  // Discovery (Week 3, starts at 0)
  tool_search_queries: number;        // How many searches for tools
  tool_discovery_rate: number;        // New tools found / searches

  // Recommendations (Week 4, starts at 0)
  tool_recommendations_given: number;
  tool_recommendations_accepted: number;
  acceptance_rate: number;
}
```

**Where to instrument**:

```typescript
// weaver/src/cultivation/seed-generator.ts
private async analyzeDependencies(analysis: SeedAnalysis): Promise<void> {
  const toolName = 'dependency_analyzer';
  const startTime = Date.now();

  try {
    // Existing analysis logic...
    await this.analyzePackageJson(analysis);
    await this.analyzePython(analysis);
    // ...

    // ✅ NEW: Record tool usage
    await metricsCollector.recordToolUsage({
      tool_name: toolName,
      duration_ms: Date.now() - startTime,
      success: true,
      items_processed: analysis.dependencies.length
    });
  } catch (error) {
    await metricsCollector.recordToolUsage({
      tool_name: toolName,
      duration_ms: Date.now() - startTime,
      success: false,
      error_type: error.name
    });
    throw error;
  }
}
```

### 1.4 Quality Metrics (Mixed - some immediate, some Week 3)

**Immediate (no code changes needed)**:

```typescript
interface QualityMetrics {
  // Git-based (if repository exists)
  test_pass_rate: number;             // % passing tests (from `npm test`)
  build_success: boolean;             // Did `npm run build` succeed?
  lint_errors: number;                // From ESLint output
  type_errors: number;                // From TypeScript compiler

  // User feedback (from existing feedback system)
  user_satisfaction: number;          // 1-5 stars
  feedback_count: number;             // How many ratings collected

  // Rework metrics (immediate)
  task_retry_count: number;           // How many retries per task
  rework_rate: number;                // % tasks requiring retry
}
```

**Week 3 additions** (requires code analysis):

```typescript
interface AdvancedQualityMetrics {
  // Code quality (from linters/analyzers)
  cyclomatic_complexity: number;      // Average complexity score
  code_duplication_pct: number;       // % duplicate code
  test_coverage_pct: number;          // % code covered by tests
  documentation_coverage_pct: number; // % functions with docs

  // Security (from security scanners)
  security_vulnerabilities: number;   // Count of vulns
  critical_vulnerabilities: number;   // High-severity only
  dependency_outdated: number;        // Outdated packages
}
```

### 1.5 Prompt Quality Metrics (NEW - Week 3-4)

**Easy to measure NOW**:

```typescript
interface PromptQualityMetrics {
  // Immediate metrics (character/word counts)
  prompt_length_chars: number;        // Character count
  prompt_length_words: number;        // Word count
  prompt_length_tokens: number;       // Estimated tokens (chars / 4)

  // Interaction metrics (immediate)
  clarification_questions: number;    // How many times agent asked for clarification
  first_try_success: boolean;         // Did task succeed on first attempt?
  revision_count: number;             // How many revisions requested

  // Advanced (Week 4, starts at 0)
  prompt_clarity_score: number;       // 0-100 (from analyzer)
  prompt_specificity_score: number;   // 0-100 (how specific vs vague)
  context_completeness: number;       // 0-100 (enough context provided?)
}
```

**Instrumentation**:

```typescript
// weaver/src/cli/commands/cultivate.ts (already captures user input)
.action(async (targetPath: string, options: CultivateOptions) => {
  const prompt = JSON.stringify(options);  // User's command

  // ✅ NEW: Record prompt metrics
  await metricsCollector.recordPrompt({
    prompt_text: prompt,
    prompt_length_chars: prompt.length,
    prompt_length_words: prompt.split(/\s+/).length,
    prompt_length_tokens: Math.ceil(prompt.length / 4),
    timestamp: new Date()
  });

  // Existing execution logic...
  try {
    await executeCultivation(...);

    // ✅ Record success (no clarifications needed)
    await metricsCollector.updatePrompt({
      first_try_success: true,
      clarification_questions: 0,
      revision_count: 0
    });
  } catch (error) {
    // ✅ Record failure
    await metricsCollector.updatePrompt({
      first_try_success: false,
      revision_count: 1
    });
  }
});
```

---

## 2. Instrumentation Points in Weave-NN

### 2.1 Core Execution Paths

| File | Function | Metric to Capture | Week |
|------|----------|-------------------|------|
| `seed-generator.ts` | `analyze()` | Agent execution (seed analysis) | 1 |
| `seed-generator.ts` | `generatePrimitives()` | Files created, lines added | 1 |
| `cultivate.ts` | `executeCultivation()` | Task success/failure rate | 1 |
| `cultivate.ts` | `identifyOrphans()` | Tool usage (orphan detection) | 2 |
| `agents.ts` | `showMetrics()` | Agent workload distribution | 1 |
| `experience-storage.ts` | `store()` | Memory operations | 1 |
| `experience-storage.ts` | `query()` | Memory retrieval, cache hits | 2 |

### 2.2 Decorator Pattern for Easy Instrumentation

**Create a metrics decorator to wrap existing functions**:

```typescript
// weaver/src/metrics/decorators.ts

export function trackMetrics(metricType: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const startTime = Date.now();
      const taskId = uuidv4();

      try {
        const result = await originalMethod.apply(this, args);

        // Record success
        await metricsCollector.record({
          task_id: taskId,
          task_type: metricType,
          agent_type: this.constructor.name,
          start_time: new Date(startTime),
          end_time: new Date(),
          duration_ms: Date.now() - startTime,
          success: true
        });

        return result;
      } catch (error) {
        // Record failure
        await metricsCollector.record({
          task_id: taskId,
          task_type: metricType,
          agent_type: this.constructor.name,
          start_time: new Date(startTime),
          end_time: new Date(),
          duration_ms: Date.now() - startTime,
          success: false,
          error_type: error.name,
          error_message: error.message
        });

        throw error;
      }
    };

    return descriptor;
  };
}
```

**Usage**:

```typescript
// weaver/src/cultivation/seed-generator.ts

export class SeedGenerator {
  @trackMetrics('seed_analysis')  // ✅ One-line instrumentation!
  async analyze(): Promise<SeedAnalysis> {
    // Existing code, no changes needed
    const analysis: SeedAnalysis = { /* ... */ };
    await this.analyzeDependencies(analysis);
    return analysis;
  }

  @trackMetrics('primitive_generation')
  async generatePrimitives(analysis: SeedAnalysis): Promise<GeneratedDocument[]> {
    // Existing code, no changes needed
    const documents: GeneratedDocument[] = [];
    // ...
    return documents;
  }
}
```

---

## 3. Storage Strategy

### 3.1 SQLite Database Schema

**Extend existing `experience-storage.ts` with metrics tables**:

```sql
-- Core metrics table (time-series data)
CREATE TABLE IF NOT EXISTS metrics (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  metric_type TEXT NOT NULL,      -- 'agent_execution', 'memory', 'tool', etc.
  metric_name TEXT NOT NULL,      -- Specific metric name
  metric_value REAL NOT NULL,     -- Numeric value
  metric_unit TEXT,               -- 'ms', 'count', 'percent', etc.

  -- Context (JSON)
  context TEXT,                   -- JSON blob with additional data

  -- Indexes for fast queries
  INDEX idx_metrics_timestamp (timestamp),
  INDEX idx_metrics_type (metric_type),
  INDEX idx_metrics_name (metric_name)
);

-- Agent execution metrics (detailed)
CREATE TABLE IF NOT EXISTS agent_executions (
  task_id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  start_time INTEGER NOT NULL,
  end_time INTEGER NOT NULL,
  duration_ms INTEGER NOT NULL,
  success INTEGER NOT NULL,       -- 0 or 1
  error_type TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Token usage
  tokens_input INTEGER DEFAULT 0,
  tokens_output INTEGER DEFAULT 0,
  tokens_total INTEGER DEFAULT 0,
  api_cost_usd REAL DEFAULT 0,

  -- Output metrics
  files_modified INTEGER DEFAULT 0,
  files_created INTEGER DEFAULT 0,
  lines_added INTEGER DEFAULT 0,
  lines_removed INTEGER DEFAULT 0,
  output_length INTEGER DEFAULT 0,
  quality_score REAL,
  user_rating INTEGER,

  -- Context
  metadata TEXT,                  -- JSON blob

  INDEX idx_executions_timestamp (start_time),
  INDEX idx_executions_agent (agent_type),
  INDEX idx_executions_success (success)
);

-- Memory operations metrics
CREATE TABLE IF NOT EXISTS memory_operations (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  operation_type TEXT NOT NULL,  -- 'store', 'retrieve', 'query'
  operation_count INTEGER DEFAULT 1,
  duration_ms INTEGER NOT NULL,
  success INTEGER NOT NULL,
  cache_hit INTEGER DEFAULT 0,
  cache_size_kb REAL DEFAULT 0,

  INDEX idx_memory_timestamp (timestamp),
  INDEX idx_memory_operation (operation_type)
);

-- Tool usage metrics
CREATE TABLE IF NOT EXISTS tool_usage (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  tool_name TEXT NOT NULL,
  duration_ms INTEGER NOT NULL,
  success INTEGER NOT NULL,
  items_processed INTEGER DEFAULT 0,
  error_type TEXT,

  INDEX idx_tools_timestamp (timestamp),
  INDEX idx_tools_name (tool_name)
);

-- Prompt quality metrics
CREATE TABLE IF NOT EXISTS prompt_metrics (
  id TEXT PRIMARY KEY,
  timestamp INTEGER NOT NULL,
  prompt_text TEXT NOT NULL,
  prompt_length_chars INTEGER NOT NULL,
  prompt_length_words INTEGER NOT NULL,
  prompt_length_tokens INTEGER NOT NULL,
  clarification_questions INTEGER DEFAULT 0,
  first_try_success INTEGER DEFAULT 0,
  revision_count INTEGER DEFAULT 0,
  clarity_score REAL,
  specificity_score REAL,

  INDEX idx_prompts_timestamp (timestamp)
);

-- Aggregated metrics (hourly, daily, weekly)
CREATE TABLE IF NOT EXISTS metrics_aggregates (
  id TEXT PRIMARY KEY,
  period_start INTEGER NOT NULL,  -- Unix timestamp of period start
  period_end INTEGER NOT NULL,    -- Unix timestamp of period end
  period_type TEXT NOT NULL,      -- 'hourly', 'daily', 'weekly'
  metric_type TEXT NOT NULL,      -- What metric aggregated

  -- Aggregates
  count INTEGER NOT NULL,
  sum REAL NOT NULL,
  avg REAL NOT NULL,
  min REAL NOT NULL,
  max REAL NOT NULL,
  stddev REAL,

  INDEX idx_aggregates_period (period_start, period_type),
  INDEX idx_aggregates_type (metric_type)
);
```

### 3.2 Storage Adapter

```typescript
// weaver/src/metrics/storage.ts

import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';

export class MetricsStorage {
  private db: Database.Database;

  constructor(dbPath: string = '.weaver/memory/metrics.db') {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private initialize(): void {
    // Create tables (SQL from section 3.1)
    this.db.exec(/* SQL from above */);
  }

  // Record generic metric
  async recordMetric(
    type: string,
    name: string,
    value: number,
    unit: string = 'count',
    context?: any
  ): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO metrics (id, timestamp, metric_type, metric_name, metric_value, metric_unit, context)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      uuidv4(),
      Date.now(),
      type,
      name,
      value,
      unit,
      context ? JSON.stringify(context) : null
    );
  }

  // Record agent execution
  async recordAgentExecution(metrics: AgentExecutionMetrics): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO agent_executions (
        task_id, task_type, agent_type, start_time, end_time, duration_ms,
        success, error_type, error_message, retry_count,
        tokens_input, tokens_output, tokens_total, api_cost_usd,
        files_modified, files_created, lines_added, lines_removed,
        output_length, quality_score, user_rating, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      metrics.task_id,
      metrics.task_type,
      metrics.agent_type,
      metrics.start_time.getTime(),
      metrics.end_time.getTime(),
      metrics.duration_ms,
      metrics.success ? 1 : 0,
      metrics.error_type || null,
      metrics.error_message || null,
      metrics.retry_count,
      metrics.tokens_input,
      metrics.tokens_output,
      metrics.tokens_total,
      metrics.api_cost_usd,
      metrics.files_modified,
      metrics.files_created,
      metrics.lines_added,
      metrics.lines_removed,
      metrics.output_length || 0,
      metrics.quality_score || null,
      metrics.user_rating || null,
      null  // metadata
    );
  }

  // Get metrics for time range
  async getMetrics(
    type: string,
    startTime: Date,
    endTime: Date
  ): Promise<any[]> {
    const stmt = this.db.prepare(`
      SELECT * FROM metrics
      WHERE metric_type = ?
        AND timestamp >= ?
        AND timestamp <= ?
      ORDER BY timestamp ASC
    `);

    return stmt.all(
      type,
      startTime.getTime(),
      endTime.getTime()
    );
  }

  // Aggregate metrics (run hourly via cron)
  async aggregateMetrics(periodType: 'hourly' | 'daily' | 'weekly'): Promise<void> {
    // Implementation for aggregation
    // Called by background job
  }
}
```

---

## 4. Zero-Configuration Metrics (Collect Immediately)

**Add to every agent task with ONE LINE**:

```typescript
// Before (no metrics)
const result = await agent.execute(task);

// After (with metrics)
const result = await trackExecution('task_type', 'agent_type', () =>
  agent.execute(task)
);
```

**Helper function**:

```typescript
// weaver/src/metrics/helpers.ts

export async function trackExecution<T>(
  taskType: string,
  agentType: string,
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  const taskId = uuidv4();

  try {
    const result = await fn();

    await metricsStorage.recordAgentExecution({
      task_id: taskId,
      task_type: taskType,
      agent_type: agentType,
      start_time: new Date(startTime),
      end_time: new Date(),
      duration_ms: Date.now() - startTime,
      success: true,
      retry_count: 0,
      tokens_input: 0,
      tokens_output: 0,
      tokens_total: 0,
      api_cost_usd: 0,
      files_modified: 0,
      files_created: 0,
      lines_added: 0,
      lines_removed: 0
    });

    return result;
  } catch (error) {
    await metricsStorage.recordAgentExecution({
      task_id: taskId,
      task_type: taskType,
      agent_type: agentType,
      start_time: new Date(startTime),
      end_time: new Date(),
      duration_ms: Date.now() - startTime,
      success: false,
      error_type: error.name,
      error_message: error.message,
      retry_count: 0,
      tokens_input: 0,
      tokens_output: 0,
      tokens_total: 0,
      api_cost_usd: 0,
      files_modified: 0,
      files_created: 0,
      lines_added: 0,
      lines_removed: 0
    });

    throw error;
  }
}
```

---

## 5. Gradual Enhancement Path

### Week 1: Basic Metrics (0% → 40% coverage)

**Goals**:
- ✅ Capture task execution time, success/failure
- ✅ Track token usage from Claude API
- ✅ Store in SQLite (same DB as experiences)
- ✅ Create `weaver metrics show` CLI command

**Implementation**:

1. Create `weaver/src/metrics/` directory
2. Add `storage.ts` (MetricsStorage class)
3. Add `helpers.ts` (trackExecution, decorators)
4. Add `cli.ts` (CLI commands)
5. Instrument 3 core files:
   - `seed-generator.ts`
   - `cultivate.ts`
   - `agents.ts`

**Deliverables**:
- Basic metrics collection working
- CLI: `weaver metrics show` displays summary
- 40% of critical paths instrumented

### Week 2: Memory & Cache Metrics (40% → 60%)

**Goals**:
- ✅ Track memory operations (store, retrieve, query)
- ✅ Add cache hit/miss tracking
- ✅ Monitor memory growth (experiences/lessons per day)
- ✅ Track claude-flow memory sync operations

**Implementation**:

1. Extend `experience-storage.ts` with metrics calls
2. Add cache wrapper with hit/miss tracking
3. Create memory dashboard
4. Monitor daily growth trends

**Deliverables**:
- Memory metrics integrated
- Cache performance visible
- Growth trends calculated

### Week 3: Quality & Tool Metrics (60% → 75%)

**Goals**:
- ✅ Capture test pass rates (from `npm test`)
- ✅ Track lint errors (from ESLint)
- ✅ Monitor user feedback scores
- ✅ Instrument tool usage in key functions

**Implementation**:

1. Add test result parser
2. Hook into ESLint/TypeScript compilers
3. Track tool invocations
4. Add quality scoring

**Deliverables**:
- Quality metrics dashboard
- Tool usage statistics
- Feedback correlation analysis

### Week 4: Prompt Quality Metrics (75% → 90%)

**Goals**:
- ✅ Capture prompt length, clarity
- ✅ Track clarification questions
- ✅ Monitor first-try success rates
- ✅ Build prompt quality analyzer

**Implementation**:

1. Add prompt capture to CLI commands
2. Track interaction patterns
3. Build clarity scoring model
4. Generate prompt improvement suggestions

**Deliverables**:
- Prompt quality scoring
- User guidance for better prompts
- Correlation with task success

### Week 8: Advanced Analytics (90% → 100%)

**Goals**:
- ✅ ML-powered anomaly detection
- ✅ Predictive task success models
- ✅ Automated optimization recommendations
- ✅ Cost optimization insights

**Implementation**:

1. Build time-series analysis
2. Train success prediction models
3. Create anomaly detection
4. Generate optimization reports

**Deliverables**:
- Full metrics coverage
- Automated insights
- Predictive analytics
- Cost optimization

---

## 6. Dashboard & Reporting

### 6.1 CLI Command: `weaver metrics show`

```bash
$ weaver metrics show

📊 Weave-NN Metrics Dashboard
════════════════════════════════════════

Agent Execution (Last 24h):
  Tasks executed: 127
  Success rate: 94.5% (120/127)
  Avg duration: 2.3s
  Total tokens: 45,238 (input: 32,156, output: 13,082)
  Estimated cost: $0.89

Memory Performance:
  Experiences stored: 120
  Lessons learned: 342
  Success rate: 87.3%
  Cache hit rate: 76.2%
  Database size: 12.4 MB

Top Agents (by usage):
  1. seed-generator: 45 tasks (35.4%)
  2. cultivate: 32 tasks (25.2%)
  3. researcher: 28 tasks (22.0%)
  4. coder: 22 tasks (17.3%)

Recent Failures (7):
  ⚠️  seed_analysis: timeout (3 occurrences)
  ⚠️  cultivate: api_error (2 occurrences)
  ⚠️  researcher: validation_failed (2 occurrences)

Prompt Quality:
  Avg prompt length: 342 chars
  First-try success: 68.4%
  Clarifications needed: 12
  Avg revisions: 0.3

Trends (vs 7 days ago):
  Success rate: +2.3% ↑
  Avg duration: -0.4s ↓
  Token usage: +12.5% ↑
  Cache hit rate: +8.1% ↑
```

### 6.2 Detailed Report: `weaver metrics report`

```bash
$ weaver metrics report --timeframe 7d --format html > report.html
```

**Generates HTML report with**:
- Line charts (success rate, duration, costs over time)
- Bar charts (agent utilization, error types)
- Heatmaps (hourly activity patterns)
- Tables (detailed breakdowns)

### 6.3 Daily Summary Email

**Automated email sent at midnight** (via cron):

```
Subject: Weave-NN Daily Metrics Summary - Nov 1, 2025

🎯 Highlights:
✅ 127 tasks executed (+12 vs yesterday)
✅ 94.5% success rate (+2.1% vs yesterday)
⚠️  3 timeouts in seed_analysis (investigate)

📈 Growth:
• Experiences: +120 (total: 1,234)
• Lessons: +342 (total: 3,456)
• Cache size: 12.4 MB (+0.8 MB)

💰 Costs:
• Today: $0.89
• This week: $5.67
• This month: $24.31
• Projected: $45.00 (on track)

🚨 Anomalies Detected:
• Seed analysis timeouts up 200% (3 vs 1 yesterday)
• Token usage spike at 14:23 (investigate)

🔗 Full report: http://localhost:3000/metrics/2025-11-01
```

### 6.4 Weekly Trend Report

**Sent every Monday**:

```
Subject: Weave-NN Weekly Metrics - Week of Oct 25-Nov 1

📊 Week Summary:
• Total tasks: 892 (+8.2% vs last week)
• Success rate: 93.1% (+1.5%)
• Avg duration: 2.4s (-0.2s)
• Total cost: $5.67 (-12% vs last week)

🏆 Top Performers:
1. seed-generator: 94.8% success
2. cultivate: 93.2% success
3. researcher: 91.5% success

📉 Needs Attention:
• coder: 85.3% success (-4.2% vs last week)
• analyzer: timeout rate up 150%

💡 Insights:
• Prompt quality improving: +5.3% first-try success
• Cache performance excellent: 76.2% hit rate
• Token usage optimized: -8% per task

🎯 Recommendations:
1. Investigate coder agent regressions
2. Add retry logic to analyzer
3. Continue prompt quality improvements
```

### 6.5 Anomaly Detection Alerts

**Real-time alerts via Slack/email**:

```
🚨 ANOMALY DETECTED

Metric: seed_analysis duration
Current: 45.2s
Expected: 2.3s (±1.2s)
Severity: HIGH
Timestamp: 2025-11-01 14:23:15

Possible causes:
• Network latency (check API status)
• Large dataset (12,345 dependencies vs avg 1,234)
• Memory pressure (DB size: 125 MB vs avg 50 MB)

Actions:
• Retry with smaller batch
• Check system resources
• Review logs: /logs/seed-analysis-2025-11-01-14-23-15.log
```

---

## 7. Integration with Blockchain Ledger

**Metrics stored as transactions for immutable audit trail**:

```typescript
// weaver/src/metrics/blockchain-integration.ts

import { BlockchainLedger } from '../blockchain/ledger.js';
import { TransactionType } from '../blockchain/types.js';

export class MetricsLedgerSync {
  constructor(
    private metricsStorage: MetricsStorage,
    private blockchain: BlockchainLedger
  ) {}

  // Sync metrics to blockchain for immutability
  async syncToLedger(taskId: string): Promise<void> {
    // Get metrics for task
    const metrics = await this.metricsStorage.getAgentExecution(taskId);

    // Create blockchain transaction
    await this.blockchain.addTransaction({
      type: metrics.success
        ? TransactionType.SUCCESS_BONUS
        : TransactionType.FAILURE_PENALTY,
      actor: {
        id: metrics.agent_type,
        type: 'agent',
        name: metrics.agent_type
      },
      delta: metrics.success ? 10 : -5,  // Reward/penalty
      metadata: {
        taskId: metrics.task_id,
        taskType: metrics.task_type,
        duration: metrics.duration_ms,
        tokens: metrics.tokens_total,
        cost: metrics.api_cost_usd,
        files_created: metrics.files_created,
        quality_score: metrics.quality_score
      }
    });
  }

  // Retrieve training data from blockchain
  async getTrainingData(
    startDate: Date,
    endDate: Date
  ): Promise<TrainingExample[]> {
    // Query blockchain for transactions in date range
    const transactions = await this.blockchain.queryTransactions({
      startTime: startDate,
      endTime: endDate,
      types: [
        TransactionType.SUCCESS_BONUS,
        TransactionType.FAILURE_PENALTY,
        TransactionType.PROMPT_QUALITY
      ]
    });

    // Convert to training examples
    return transactions.map(tx => ({
      input: {
        task_type: tx.metadata.taskType,
        prompt: tx.metadata.prompt,
        context: tx.metadata.context
      },
      output: {
        success: tx.type === TransactionType.SUCCESS_BONUS,
        duration: tx.metadata.duration,
        quality: tx.metadata.quality_score
      },
      reward: tx.delta
    }));
  }
}
```

**Benefits**:
1. **Immutable audit trail** - Can't tamper with metrics history
2. **Hash-based retrieval** - Fast lookups by transaction hash
3. **Training data** - Blockchain is ground truth for RL training
4. **Cost tracking** - Token economics tied to real execution costs

---

## 8. TypeScript Implementation

### 8.1 Metrics Collector Interface

```typescript
// weaver/src/metrics/collector.ts

export interface IMetricsCollector {
  // Generic metric recording
  record(metric: MetricRecord): Promise<void>;

  // Specialized recorders
  recordAgentExecution(metrics: AgentExecutionMetrics): Promise<void>;
  recordMemoryOperation(metrics: MemoryMetrics): Promise<void>;
  recordToolUsage(metrics: ToolMetrics): Promise<void>;
  recordPromptQuality(metrics: PromptQualityMetrics): Promise<void>;

  // Querying
  getMetrics(query: MetricsQuery): Promise<MetricRecord[]>;
  getAggregate(type: string, period: 'hourly' | 'daily' | 'weekly'): Promise<Aggregate>;

  // Reporting
  generateReport(options: ReportOptions): Promise<MetricsReport>;
  getAnomalies(threshold: number): Promise<Anomaly[]>;
}

export class MetricsCollector implements IMetricsCollector {
  constructor(
    private storage: MetricsStorage,
    private blockchain?: BlockchainLedger
  ) {}

  async record(metric: MetricRecord): Promise<void> {
    // Store in SQLite
    await this.storage.recordMetric(
      metric.type,
      metric.name,
      metric.value,
      metric.unit,
      metric.context
    );

    // Optional: Sync to blockchain
    if (this.blockchain && metric.important) {
      await this.syncToBlockchain(metric);
    }
  }

  async recordAgentExecution(metrics: AgentExecutionMetrics): Promise<void> {
    // Store detailed execution metrics
    await this.storage.recordAgentExecution(metrics);

    // Also record summary metrics
    await this.record({
      type: 'agent_execution',
      name: `${metrics.agent_type}.${metrics.task_type}`,
      value: metrics.duration_ms,
      unit: 'ms',
      context: {
        success: metrics.success,
        tokens: metrics.tokens_total,
        cost: metrics.api_cost_usd
      }
    });

    // Sync to blockchain for immutability
    if (this.blockchain) {
      await this.syncExecutionToBlockchain(metrics);
    }
  }

  private async syncToBlockchain(metric: MetricRecord): Promise<void> {
    // Implementation from section 7
  }
}
```

### 8.2 CLI Integration

```typescript
// weaver/src/cli/commands/metrics.ts

import { Command } from 'commander';
import { MetricsCollector } from '../../metrics/collector.js';
import { MetricsStorage } from '../../metrics/storage.js';

export function createMetricsCommand(): Command {
  const command = new Command('metrics')
    .description('Metrics collection and reporting');

  // Show dashboard
  command
    .command('show')
    .description('Show metrics dashboard')
    .option('--timeframe <period>', 'Time period (24h, 7d, 30d)', '24h')
    .option('--agent <type>', 'Filter by agent type')
    .option('--detailed', 'Show detailed breakdown')
    .action(async (options) => {
      const storage = new MetricsStorage();
      const collector = new MetricsCollector(storage);

      const report = await collector.generateReport({
        timeframe: options.timeframe,
        agentType: options.agent,
        detailed: options.detailed
      });

      console.log(report.format());
    });

  // Generate report
  command
    .command('report')
    .description('Generate detailed report')
    .option('--timeframe <period>', 'Time period', '7d')
    .option('--format <format>', 'Output format (html, json, csv)', 'html')
    .option('--output <file>', 'Output file')
    .action(async (options) => {
      const storage = new MetricsStorage();
      const collector = new MetricsCollector(storage);

      const report = await collector.generateReport({
        timeframe: options.timeframe,
        format: options.format
      });

      if (options.output) {
        await fs.writeFile(options.output, report.content);
        console.log(`Report saved to ${options.output}`);
      } else {
        console.log(report.content);
      }
    });

  // Export data
  command
    .command('export')
    .description('Export metrics data')
    .option('--format <format>', 'Format (json, csv, parquet)', 'json')
    .option('--output <file>', 'Output file (required)')
    .requiredOption('--start <date>', 'Start date (YYYY-MM-DD)')
    .requiredOption('--end <date>', 'End date (YYYY-MM-DD)')
    .action(async (options) => {
      const storage = new MetricsStorage();

      const data = await storage.exportData({
        startDate: new Date(options.start),
        endDate: new Date(options.end),
        format: options.format
      });

      await fs.writeFile(options.output, data);
      console.log(`Data exported to ${options.output}`);
    });

  return command;
}
```

---

## 9. Example Metrics Collection Flows

### 9.1 Seed Generation Workflow

```typescript
// weaver/src/cultivation/seed-generator.ts

export class SeedGenerator {
  constructor(
    private vaultContext: VaultContext,
    private projectRoot: string,
    private metricsCollector?: MetricsCollector  // ✅ Inject metrics
  ) {}

  async analyze(): Promise<SeedAnalysis> {
    const taskId = uuidv4();
    const startTime = Date.now();

    try {
      // Existing analysis logic
      const analysis: SeedAnalysis = {
        dependencies: [],
        services: [],
        frameworks: [],
        languages: [],
        deployments: [],
        existingConcepts: [],
        existingFeatures: []
      };

      await this.analyzeDependencies(analysis);
      await this.analyzeVaultDocuments(analysis);
      await this.analyzeServices(analysis);
      await this.analyzeDeployments(analysis);
      this.classifyDependencies(analysis);

      // ✅ Record success metrics
      if (this.metricsCollector) {
        await this.metricsCollector.recordAgentExecution({
          task_id: taskId,
          task_type: 'seed_analysis',
          agent_type: 'seed-generator',
          start_time: new Date(startTime),
          end_time: new Date(),
          duration_ms: Date.now() - startTime,
          success: true,
          retry_count: 0,
          tokens_input: 0,
          tokens_output: 0,
          tokens_total: 0,
          api_cost_usd: 0,
          files_modified: 0,
          files_created: 0,
          lines_added: 0,
          lines_removed: 0,
          output_length: JSON.stringify(analysis).length
        });
      }

      return analysis;
    } catch (error) {
      // ✅ Record failure metrics
      if (this.metricsCollector) {
        await this.metricsCollector.recordAgentExecution({
          task_id: taskId,
          task_type: 'seed_analysis',
          agent_type: 'seed-generator',
          start_time: new Date(startTime),
          end_time: new Date(),
          duration_ms: Date.now() - startTime,
          success: false,
          error_type: error.name,
          error_message: error.message,
          retry_count: 0,
          tokens_input: 0,
          tokens_output: 0,
          tokens_total: 0,
          api_cost_usd: 0,
          files_modified: 0,
          files_created: 0,
          lines_added: 0,
          lines_removed: 0
        });
      }

      throw error;
    }
  }
}
```

### 9.2 Memory Operation Tracking

```typescript
// weaver/src/memory/experience-storage.ts

export class ExperienceStorage implements IExperienceStorage {
  constructor(
    options: ExperienceStorageOptions = {},
    private metricsCollector?: MetricsCollector  // ✅ Inject metrics
  ) {
    // Existing initialization
  }

  async store(experience: Experience): Promise<void> {
    const startTime = Date.now();

    try {
      // Existing storage logic
      if (!this.db) {
        this.initialize();
      }

      const stmt = this.db!.prepare(/* SQL */);
      stmt.run(/* params */);

      // ✅ Record metrics
      if (this.metricsCollector) {
        await this.metricsCollector.recordMemoryOperation({
          operation_type: 'store',
          operation_count: 1,
          duration_ms: Date.now() - startTime,
          success: true,
          cache_hit: false,
          cache_size_kb: 0
        });
      }
    } catch (error) {
      // ✅ Record failure
      if (this.metricsCollector) {
        await this.metricsCollector.recordMemoryOperation({
          operation_type: 'store',
          operation_count: 1,
          duration_ms: Date.now() - startTime,
          success: false,
          cache_hit: false,
          cache_size_kb: 0
        });
      }

      throw error;
    }
  }

  async query(query: ExperienceQuery): Promise<ExperienceQueryResult[]> {
    const startTime = Date.now();

    try {
      // Existing query logic
      const stmt = this.db!.prepare(/* SQL */);
      const rows = stmt.all(...params);

      // ✅ Record metrics
      if (this.metricsCollector) {
        await this.metricsCollector.recordMemoryOperation({
          operation_type: 'query',
          operation_count: rows.length,
          duration_ms: Date.now() - startTime,
          success: true,
          cache_hit: false,  // TODO: Add cache layer
          cache_size_kb: 0
        });
      }

      return rows.map(/* mapping */);
    } catch (error) {
      // ✅ Record failure
      if (this.metricsCollector) {
        await this.metricsCollector.recordMemoryOperation({
          operation_type: 'query',
          operation_count: 0,
          duration_ms: Date.now() - startTime,
          success: false,
          cache_hit: false,
          cache_size_kb: 0
        });
      }

      throw error;
    }
  }
}
```

---

## 10. Next Steps & Deliverables

### Week 1 Deliverables (Immediate)

**Files to create**:
1. `weaver/src/metrics/storage.ts` - SQLite storage adapter
2. `weaver/src/metrics/collector.ts` - Metrics collector class
3. `weaver/src/metrics/helpers.ts` - Helper functions, decorators
4. `weaver/src/metrics/types.ts` - TypeScript interfaces
5. `weaver/src/cli/commands/metrics.ts` - CLI commands
6. `weaver/src/metrics/index.ts` - Public API exports

**Files to modify**:
1. `weaver/src/cultivation/seed-generator.ts` - Add metrics calls
2. `weaver/src/cli/commands/cultivate.ts` - Add metrics calls
3. `weaver/src/cli/commands/agents.ts` - Add metrics calls
4. `weaver/src/cli/index.ts` - Register metrics command

**Verification**:
```bash
# Create test task
weaver cultivate --seed --project-root .

# View metrics
weaver metrics show

# Should display:
# - Tasks executed: 1
# - Success rate: 100%
# - Avg duration: X.Xs
# - Files created: Y
```

### Week 2-4 Deliverables (Incremental)

**Week 2**: Memory metrics, cache tracking
**Week 3**: Quality metrics, tool usage
**Week 4**: Prompt quality, feedback correlation

### Week 8 Deliverables (Advanced)

**ML-powered features**:
- Anomaly detection (Z-score, IQR methods)
- Predictive success models (XGBoost, Random Forest)
- Cost optimization recommendations
- Automated quality scoring

---

## Conclusion

This framework provides a **pragmatic, incremental approach** to metrics collection:

✅ **Start TODAY** with basic metrics (time, success, tokens)
✅ **SQLite storage** (same infrastructure as experiences, blockchain)
✅ **Minimal instrumentation** (decorators, helper functions)
✅ **Clear roadmap** (Week 1 → Week 8)
✅ **Blockchain integration** (immutable audit trail, training data)
✅ **CLI tools** (`weaver metrics show`, `weaver metrics report`)

**Key Philosophy**: "Collect now, even if starting at 0. Having the infrastructure means we capture growth from day 1."

By Week 8, we'll have:
- 100% metrics coverage
- Automated insights and anomaly detection
- Predictive analytics for task success
- Cost optimization recommendations
- Full blockchain ledger for training data

**Start with Week 1, iterate from there.** 🚀
