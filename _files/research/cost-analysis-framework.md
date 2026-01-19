# Cost Analysis Framework for weave-nn

## Executive Summary

This framework provides comprehensive cost tracking, estimation, and variance analysis for weave-nn operations. It enables budget enforcement, learning from variance, and continuous improvement of estimates through measurable, actionable metrics.

---

## 1. Cost Dimensions

### 1.1 Token Cost
- **API Calls**: Claude API (input/output), embeddings, completions
- **Compute Time**: CPU/GPU time for processing
- **Storage**: Vector DB, file storage, cache
- **Network**: API bandwidth, data transfer

### 1.2 Time Cost
- **Wall-clock Time**: Total elapsed time for task completion
- **Processing Time**: Active computation time
- **Wait Time**: Queue time, rate limiting delays
- **Human Time**: Review, feedback, clarification

### 1.3 Quality Cost
- **Rework**: Failed attempts, retry costs
- **Bugs**: Testing failures, error handling
- **Technical Debt**: Quick fixes requiring future refactoring
- **Validation**: Review cycles, quality gates

### 1.4 Human Cost
- **Clarification Rounds**: Questions requiring human input
- **Feedback Time**: Human review and approval
- **Context Switching**: Interruptions and resumptions
- **Training**: Learning curve for new features

### 1.5 Opportunity Cost
- **Alternative Tasks**: What else could have been done?
- **Priority Displacement**: Higher-value work delayed
- **Resource Contention**: Blocking other operations
- **Learning Investment**: Time spent learning vs executing

---

## 2. Core TypeScript Interfaces

### 2.1 Estimation & Actuals

```typescript
/**
 * T-shirt size enumeration
 */
enum TaskSize {
  XS = 'xs',  // 10-50 tokens, <5 min
  S = 's',    // 50-200 tokens, 5-15 min
  M = 'm',    // 200-1000 tokens, 15-60 min
  L = 'l',    // 1000-5000 tokens, 1-4 hours
  XL = 'xl',  // 5000+ tokens, 4+ hours
  XXL = 'xxl' // 10000+ tokens, multi-day
}

/**
 * Cost breakdown by category
 */
interface CostBreakdown {
  // Token costs (internal currency)
  claude_input_tokens: number;
  claude_output_tokens: number;
  embedding_tokens: number;
  total_tokens: number;

  // Time costs (seconds)
  wall_clock_time: number;
  processing_time: number;
  wait_time: number;
  human_time: number;

  // Quality costs (token equivalents)
  rework_cost: number;
  bug_fix_cost: number;
  validation_cost: number;

  // Resource costs (USD)
  api_cost_usd: number;
  compute_cost_usd: number;
  storage_cost_usd: number;
  total_cost_usd: number;
}

/**
 * Task estimation with confidence intervals
 */
interface TaskEstimate {
  task_id: string;
  task_type: string;
  size: TaskSize;

  // Estimated costs
  estimated_tokens: number;
  estimated_tokens_min: number;  // P10 (pessimistic)
  estimated_tokens_max: number;  // P90 (optimistic)

  estimated_time_seconds: number;
  estimated_time_min: number;
  estimated_time_max: number;

  estimated_quality: number;  // 0-1 (expected success rate)

  // Budget allocation
  reserved_tokens: number;  // Upfront reservation
  reserved_cost_usd: number;

  // Metadata
  estimated_by: string;  // 'human' | 'model' | 'historical'
  confidence: number;    // 0-1 (how confident in estimate)
  similar_tasks: string[];  // References to similar historical tasks

  created_at: Date;
}

/**
 * Actual task execution metrics
 */
interface TaskActual {
  task_id: string;

  // Actual costs (measured)
  actual_breakdown: CostBreakdown;

  // Quality metrics
  actual_quality: number;  // 0-1 (actual success rate)
  retry_count: number;
  error_count: number;

  // Time tracking
  started_at: Date;
  completed_at: Date;
  paused_duration_seconds: number;

  // Resources used
  agent_type: string;
  model_used: string;
  context_length: number;
}

/**
 * Variance analysis between estimate and actual
 */
interface CostVariance {
  task_id: string;

  // Token variance
  token_variance: number;           // (actual - estimated) / estimated
  token_variance_absolute: number;  // actual - estimated
  token_within_range: boolean;      // Within min/max range?

  // Time variance
  time_variance: number;
  time_variance_absolute: number;
  time_within_range: boolean;

  // Quality variance
  quality_variance: number;
  quality_met_expectation: boolean;

  // Overall variance score (-1 to 1, 0 = perfect estimate)
  overall_variance: number;

  // Learning signals
  underestimation_factor: number;  // How much we underestimated
  overestimation_factor: number;   // How much we overestimated
  variance_category: 'accurate' | 'underestimated' | 'overestimated';

  // Root cause analysis
  variance_reasons: VarianceReason[];

  // Refund/penalty
  refund_tokens: number;   // If overestimated
  penalty_tokens: number;  // If exceeded budget

  calculated_at: Date;
}

/**
 * Variance reason for root cause analysis
 */
interface VarianceReason {
  category: 'complexity' | 'context' | 'quality' | 'dependencies' | 'unknowns';
  description: string;
  impact_tokens: number;
  impact_percentage: number;
}
```

### 2.2 T-Shirt Sizing Model

```typescript
/**
 * T-shirt size configuration with token ranges
 */
interface SizeConfiguration {
  size: TaskSize;

  // Token ranges
  min_tokens: number;
  max_tokens: number;
  typical_tokens: number;

  // Time ranges (seconds)
  min_time_seconds: number;
  max_time_seconds: number;
  typical_time_seconds: number;

  // Expected quality
  typical_quality: number;

  // Cost ranges (USD)
  min_cost_usd: number;
  max_cost_usd: number;
  typical_cost_usd: number;

  // Descriptions
  description: string;
  examples: string[];
}

/**
 * Default size configurations
 */
const DEFAULT_SIZE_CONFIG: Record<TaskSize, SizeConfiguration> = {
  [TaskSize.XS]: {
    size: TaskSize.XS,
    min_tokens: 10,
    max_tokens: 50,
    typical_tokens: 30,
    min_time_seconds: 0,
    max_time_seconds: 300,      // 5 min
    typical_time_seconds: 120,   // 2 min
    typical_quality: 0.95,
    min_cost_usd: 0.0001,
    max_cost_usd: 0.001,
    typical_cost_usd: 0.0003,
    description: 'Simple query or lookup',
    examples: [
      'Retrieve file metadata',
      'Simple search query',
      'Lookup cached result'
    ]
  },
  [TaskSize.S]: {
    size: TaskSize.S,
    min_tokens: 50,
    max_tokens: 200,
    typical_tokens: 100,
    min_time_seconds: 300,       // 5 min
    max_time_seconds: 900,       // 15 min
    typical_time_seconds: 600,   // 10 min
    typical_quality: 0.90,
    min_cost_usd: 0.001,
    max_cost_usd: 0.01,
    typical_cost_usd: 0.003,
    description: 'Basic task with single operation',
    examples: [
      'Generate single function',
      'Write basic test',
      'Simple code review'
    ]
  },
  [TaskSize.M]: {
    size: TaskSize.M,
    min_tokens: 200,
    max_tokens: 1000,
    typical_tokens: 500,
    min_time_seconds: 900,       // 15 min
    max_time_seconds: 3600,      // 60 min
    typical_time_seconds: 1800,  // 30 min
    typical_quality: 0.85,
    min_cost_usd: 0.01,
    max_cost_usd: 0.05,
    typical_cost_usd: 0.02,
    description: 'Standard task with multiple operations',
    examples: [
      'Implement feature with tests',
      'Refactor module',
      'Comprehensive code review'
    ]
  },
  [TaskSize.L]: {
    size: TaskSize.L,
    min_tokens: 1000,
    max_tokens: 5000,
    typical_tokens: 2500,
    min_time_seconds: 3600,      // 1 hour
    max_time_seconds: 14400,     // 4 hours
    typical_time_seconds: 7200,  // 2 hours
    typical_quality: 0.80,
    min_cost_usd: 0.05,
    max_cost_usd: 0.25,
    typical_cost_usd: 0.10,
    description: 'Complex task requiring multiple components',
    examples: [
      'Build new module with integration',
      'Complex refactoring',
      'Design system architecture'
    ]
  },
  [TaskSize.XL]: {
    size: TaskSize.XL,
    min_tokens: 5000,
    max_tokens: 15000,
    typical_tokens: 8000,
    min_time_seconds: 14400,     // 4 hours
    max_time_seconds: 28800,     // 8 hours
    typical_time_seconds: 21600, // 6 hours
    typical_quality: 0.75,
    min_cost_usd: 0.25,
    max_cost_usd: 0.75,
    typical_cost_usd: 0.40,
    description: 'Major project with multiple features',
    examples: [
      'Build complete feature set',
      'Major system redesign',
      'Full application module'
    ]
  },
  [TaskSize.XXL]: {
    size: TaskSize.XXL,
    min_tokens: 15000,
    max_tokens: 50000,
    typical_tokens: 25000,
    min_time_seconds: 28800,     // 8 hours
    max_time_seconds: 172800,    // 48 hours
    typical_time_seconds: 86400, // 24 hours
    typical_quality: 0.70,
    min_cost_usd: 0.75,
    max_cost_usd: 2.50,
    typical_cost_usd: 1.25,
    description: 'Multi-day project or complex system',
    examples: [
      'Full application development',
      'Complete system migration',
      'Large-scale refactoring'
    ]
  }
};

/**
 * Historical calibration data for improving estimates
 */
interface SizeCalibration {
  size: TaskSize;
  task_type: string;

  // Historical accuracy
  sample_count: number;
  avg_token_variance: number;
  avg_time_variance: number;
  avg_quality_variance: number;

  // Adjusted predictions
  calibrated_tokens: number;
  calibrated_time_seconds: number;
  calibrated_quality: number;

  // Confidence metrics
  prediction_accuracy: number;  // 0-1
  confidence_interval_95: [number, number];

  last_updated: Date;
}
```

### 2.3 Token Cost Pricing

```typescript
/**
 * Pricing configuration for token costs
 */
interface PricingConfig {
  // Claude API pricing (per million tokens)
  claude_sonnet_input_per_mtok: number;   // $3.00
  claude_sonnet_output_per_mtok: number;  // $15.00
  claude_haiku_input_per_mtok: number;    // $0.80
  claude_haiku_output_per_mtok: number;   // $4.00

  // Embeddings pricing
  embedding_per_mtok: number;  // $0.10

  // Compute pricing
  cpu_hour_usd: number;        // $0.01
  gpu_hour_usd: number;        // $0.50

  // Storage pricing
  storage_gb_month_usd: number;  // $0.001

  // Internal token conversion rates
  usd_to_internal_tokens: number;  // e.g., $1 = 10000 tokens

  // Markup/margins
  markup_percentage: number;  // e.g., 20% markup
}

const DEFAULT_PRICING: PricingConfig = {
  claude_sonnet_input_per_mtok: 3.00,
  claude_sonnet_output_per_mtok: 15.00,
  claude_haiku_input_per_mtok: 0.80,
  claude_haiku_output_per_mtok: 4.00,
  embedding_per_mtok: 0.10,
  cpu_hour_usd: 0.01,
  gpu_hour_usd: 0.50,
  storage_gb_month_usd: 0.001,
  usd_to_internal_tokens: 10000,
  markup_percentage: 0.20
};

/**
 * Cost calculator utility
 */
class CostCalculator {
  constructor(private pricing: PricingConfig) {}

  /**
   * Calculate API cost in USD
   */
  calculateApiCost(
    inputTokens: number,
    outputTokens: number,
    model: 'sonnet' | 'haiku' = 'sonnet'
  ): number {
    const inputRate = model === 'sonnet'
      ? this.pricing.claude_sonnet_input_per_mtok
      : this.pricing.claude_haiku_input_per_mtok;

    const outputRate = model === 'sonnet'
      ? this.pricing.claude_sonnet_output_per_mtok
      : this.pricing.claude_haiku_output_per_mtok;

    const inputCost = (inputTokens / 1_000_000) * inputRate;
    const outputCost = (outputTokens / 1_000_000) * outputRate;

    return (inputCost + outputCost) * (1 + this.pricing.markup_percentage);
  }

  /**
   * Calculate embedding cost in USD
   */
  calculateEmbeddingCost(tokens: number): number {
    return (tokens / 1_000_000) * this.pricing.embedding_per_mtok;
  }

  /**
   * Calculate compute cost in USD
   */
  calculateComputeCost(
    cpuHours: number = 0,
    gpuHours: number = 0
  ): number {
    return (
      cpuHours * this.pricing.cpu_hour_usd +
      gpuHours * this.pricing.gpu_hour_usd
    );
  }

  /**
   * Convert USD to internal tokens
   */
  usdToTokens(usd: number): number {
    return Math.ceil(usd * this.pricing.usd_to_internal_tokens);
  }

  /**
   * Convert internal tokens to USD
   */
  tokensToUsd(tokens: number): number {
    return tokens / this.pricing.usd_to_internal_tokens;
  }

  /**
   * Calculate total cost breakdown
   */
  calculateTotalCost(breakdown: Partial<CostBreakdown>): CostBreakdown {
    const apiCost = this.calculateApiCost(
      breakdown.claude_input_tokens || 0,
      breakdown.claude_output_tokens || 0
    );

    const embeddingCost = this.calculateEmbeddingCost(
      breakdown.embedding_tokens || 0
    );

    const totalUsd = apiCost + embeddingCost + (breakdown.compute_cost_usd || 0);
    const totalTokens = this.usdToTokens(totalUsd);

    return {
      claude_input_tokens: breakdown.claude_input_tokens || 0,
      claude_output_tokens: breakdown.claude_output_tokens || 0,
      embedding_tokens: breakdown.embedding_tokens || 0,
      total_tokens: totalTokens,
      wall_clock_time: breakdown.wall_clock_time || 0,
      processing_time: breakdown.processing_time || 0,
      wait_time: breakdown.wait_time || 0,
      human_time: breakdown.human_time || 0,
      rework_cost: breakdown.rework_cost || 0,
      bug_fix_cost: breakdown.bug_fix_cost || 0,
      validation_cost: breakdown.validation_cost || 0,
      api_cost_usd: apiCost,
      compute_cost_usd: breakdown.compute_cost_usd || 0,
      storage_cost_usd: breakdown.storage_cost_usd || 0,
      total_cost_usd: totalUsd
    };
  }
}
```

---

## 3. Budget Enforcement

### 3.1 Budget Models

```typescript
/**
 * Budget allocation for users/agents/projects
 */
interface Budget {
  budget_id: string;
  name: string;
  owner_id: string;
  owner_type: 'user' | 'agent' | 'project' | 'team';

  // Allocation
  total_tokens: number;
  total_usd: number;

  // Usage tracking
  reserved_tokens: number;   // Pre-allocated for running tasks
  spent_tokens: number;      // Actually consumed
  available_tokens: number;  // total - reserved - spent

  // Time-based limits
  period: 'daily' | 'weekly' | 'monthly' | 'total';
  period_start: Date;
  period_end: Date;

  // Thresholds
  warning_threshold: number;  // 0-1 (e.g., 0.8 = 80%)
  critical_threshold: number; // 0-1 (e.g., 0.95 = 95%)

  // Enforcement
  auto_top_up: boolean;
  max_top_up_amount: number;
  enforce_hard_limit: boolean;

  created_at: Date;
  updated_at: Date;
}

/**
 * Budget check result before task execution
 */
interface BudgetCheckResult {
  approved: boolean;
  reason?: string;

  // Current state
  budget_available: number;
  budget_reserved: number;
  budget_spent: number;

  // Request
  requested_tokens: number;
  requested_usd: number;

  // Projection
  projected_available: number;
  projected_utilization: number;  // 0-1

  // Warnings
  warnings: string[];

  // Alternative recommendations
  suggested_size?: TaskSize;
  suggested_model?: string;
}

/**
 * Budget enforcement service
 */
class BudgetEnforcer {
  /**
   * Pre-flight check before task execution
   */
  async checkBudget(
    budgetId: string,
    estimate: TaskEstimate
  ): Promise<BudgetCheckResult> {
    const budget = await this.getBudget(budgetId);

    // Check if enough budget available
    const available = budget.total_tokens - budget.reserved_tokens - budget.spent_tokens;
    const approved = available >= estimate.reserved_tokens;

    // Calculate projections
    const projectedAvailable = available - estimate.reserved_tokens;
    const projectedUtilization =
      (budget.reserved_tokens + budget.spent_tokens + estimate.reserved_tokens)
      / budget.total_tokens;

    const warnings: string[] = [];

    // Check thresholds
    if (projectedUtilization >= budget.critical_threshold) {
      warnings.push(`Critical: ${(projectedUtilization * 100).toFixed(1)}% budget used`);
    } else if (projectedUtilization >= budget.warning_threshold) {
      warnings.push(`Warning: ${(projectedUtilization * 100).toFixed(1)}% budget used`);
    }

    // Suggest alternatives if not approved
    let suggestedSize: TaskSize | undefined;
    let suggestedModel: string | undefined;

    if (!approved) {
      // Suggest smaller size
      const sizes = [TaskSize.XS, TaskSize.S, TaskSize.M, TaskSize.L, TaskSize.XL];
      const currentIndex = sizes.indexOf(estimate.size);
      if (currentIndex > 0) {
        suggestedSize = sizes[currentIndex - 1];
      }

      // Suggest cheaper model
      suggestedModel = 'haiku';
    }

    return {
      approved: approved || !budget.enforce_hard_limit,
      reason: approved ? undefined : 'Insufficient budget',
      budget_available: available,
      budget_reserved: budget.reserved_tokens,
      budget_spent: budget.spent_tokens,
      requested_tokens: estimate.reserved_tokens,
      requested_usd: estimate.reserved_cost_usd,
      projected_available: projectedAvailable,
      projected_utilization: projectedUtilization,
      warnings,
      suggested_size: suggestedSize,
      suggested_model: suggestedModel
    };
  }

  /**
   * Reserve tokens for task (deduct from available)
   */
  async reserveTokens(
    budgetId: string,
    taskId: string,
    tokens: number
  ): Promise<void> {
    await this.updateBudget(budgetId, {
      reserved_tokens: tokens,
      reservation_id: taskId
    });
  }

  /**
   * Deduct actual tokens spent (move from reserved to spent)
   */
  async deductTokens(
    budgetId: string,
    taskId: string,
    actualTokens: number,
    reservedTokens: number
  ): Promise<void> {
    await this.updateBudget(budgetId, {
      reserved_tokens: -reservedTokens,  // Release reservation
      spent_tokens: actualTokens,         // Add actual spend
      task_id: taskId
    });
  }

  /**
   * Refund unused tokens
   */
  async refundTokens(
    budgetId: string,
    taskId: string,
    refundAmount: number
  ): Promise<void> {
    await this.updateBudget(budgetId, {
      spent_tokens: -refundAmount,
      refund_task_id: taskId
    });
  }

  /**
   * Real-time burn rate monitoring
   */
  async monitorBurnRate(budgetId: string): Promise<BurnRateMetrics> {
    const budget = await this.getBudget(budgetId);
    const recentTasks = await this.getRecentTasks(budgetId, 24 * 60 * 60 * 1000); // 24 hours

    const totalSpent = recentTasks.reduce((sum, task) => sum + task.actual_breakdown.total_tokens, 0);
    const avgPerTask = totalSpent / recentTasks.length;
    const tokensPerHour = totalSpent / 24;

    const remainingHours = budget.available_tokens / tokensPerHour;

    return {
      tokens_per_hour: tokensPerHour,
      tokens_per_task: avgPerTask,
      estimated_runway_hours: remainingHours,
      projected_depletion: new Date(Date.now() + remainingHours * 60 * 60 * 1000)
    };
  }

  private async getBudget(budgetId: string): Promise<Budget> {
    // Implementation: fetch from database
    throw new Error('Not implemented');
  }

  private async updateBudget(budgetId: string, update: any): Promise<void> {
    // Implementation: update database
    throw new Error('Not implemented');
  }

  private async getRecentTasks(budgetId: string, milliseconds: number): Promise<TaskActual[]> {
    // Implementation: fetch recent tasks
    throw new Error('Not implemented');
  }
}

interface BurnRateMetrics {
  tokens_per_hour: number;
  tokens_per_task: number;
  estimated_runway_hours: number;
  projected_depletion: Date;
}
```

### 3.2 Circuit Breaker

```typescript
/**
 * Circuit breaker to stop runaway tasks
 */
interface CircuitBreakerConfig {
  max_tokens_per_task: number;
  max_time_seconds: number;
  max_retries: number;
  cooldown_seconds: number;
}

class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private lastFailure?: Date;

  constructor(private config: CircuitBreakerConfig) {}

  /**
   * Check if task should be allowed to execute
   */
  async beforeExecute(taskId: string, estimate: TaskEstimate): Promise<boolean> {
    // If circuit is open, reject
    if (this.state === 'open') {
      // Check if cooldown has passed
      if (this.lastFailure &&
          Date.now() - this.lastFailure.getTime() > this.config.cooldown_seconds * 1000) {
        this.state = 'half-open';
        this.failureCount = 0;
      } else {
        return false;
      }
    }

    // Check if estimate exceeds limits
    if (estimate.estimated_tokens > this.config.max_tokens_per_task) {
      this.recordFailure();
      return false;
    }

    return true;
  }

  /**
   * Monitor during execution
   */
  async duringExecute(
    taskId: string,
    currentTokens: number,
    elapsedSeconds: number
  ): Promise<boolean> {
    // Check if exceeded limits
    if (currentTokens > this.config.max_tokens_per_task) {
      this.recordFailure();
      return false;  // Signal to stop
    }

    if (elapsedSeconds > this.config.max_time_seconds) {
      this.recordFailure();
      return false;
    }

    return true;  // Continue
  }

  /**
   * After execution completes
   */
  async afterExecute(taskId: string, actual: TaskActual): Promise<void> {
    if (actual.error_count > this.config.max_retries) {
      this.recordFailure();
    } else {
      this.recordSuccess();
    }
  }

  private recordFailure(): void {
    this.failureCount++;
    this.lastFailure = new Date();

    if (this.failureCount >= 3) {
      this.state = 'open';
    }
  }

  private recordSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }
}
```

---

## 4. Learning from Variance

### 4.1 Variance Analysis Engine

```typescript
/**
 * Variance analysis service
 */
class VarianceAnalyzer {
  /**
   * Calculate variance between estimate and actual
   */
  calculateVariance(
    estimate: TaskEstimate,
    actual: TaskActual
  ): CostVariance {
    // Token variance
    const tokenVariance =
      (actual.actual_breakdown.total_tokens - estimate.estimated_tokens)
      / estimate.estimated_tokens;

    const tokenWithinRange =
      actual.actual_breakdown.total_tokens >= estimate.estimated_tokens_min &&
      actual.actual_breakdown.total_tokens <= estimate.estimated_tokens_max;

    // Time variance
    const actualTime =
      (actual.completed_at.getTime() - actual.started_at.getTime()) / 1000;
    const timeVariance =
      (actualTime - estimate.estimated_time_seconds)
      / estimate.estimated_time_seconds;

    const timeWithinRange =
      actualTime >= estimate.estimated_time_min &&
      actualTime <= estimate.estimated_time_max;

    // Quality variance
    const qualityVariance =
      (actual.actual_quality - estimate.estimated_quality)
      / estimate.estimated_quality;

    // Overall variance (weighted average)
    const overallVariance =
      0.5 * tokenVariance +
      0.3 * timeVariance +
      0.2 * qualityVariance;

    // Categorize variance
    let category: 'accurate' | 'underestimated' | 'overestimated';
    if (Math.abs(overallVariance) < 0.1) {
      category = 'accurate';
    } else if (overallVariance > 0) {
      category = 'underestimated';
    } else {
      category = 'overestimated';
    }

    // Calculate refund/penalty
    const refundTokens = Math.max(0,
      estimate.reserved_tokens - actual.actual_breakdown.total_tokens
    );
    const penaltyTokens = Math.max(0,
      actual.actual_breakdown.total_tokens - estimate.estimated_tokens_max
    );

    // Root cause analysis
    const reasons = this.analyzeVarianceReasons(estimate, actual, tokenVariance);

    return {
      task_id: estimate.task_id,
      token_variance: tokenVariance,
      token_variance_absolute: actual.actual_breakdown.total_tokens - estimate.estimated_tokens,
      token_within_range: tokenWithinRange,
      time_variance: timeVariance,
      time_variance_absolute: actualTime - estimate.estimated_time_seconds,
      time_within_range: timeWithinRange,
      quality_variance: qualityVariance,
      quality_met_expectation: actual.actual_quality >= estimate.estimated_quality,
      overall_variance: overallVariance,
      underestimation_factor: Math.max(0, overallVariance),
      overestimation_factor: Math.max(0, -overallVariance),
      variance_category: category,
      variance_reasons: reasons,
      refund_tokens: refundTokens,
      penalty_tokens: penaltyTokens,
      calculated_at: new Date()
    };
  }

  /**
   * Analyze root causes of variance
   */
  private analyzeVarianceReasons(
    estimate: TaskEstimate,
    actual: TaskActual,
    tokenVariance: number
  ): VarianceReason[] {
    const reasons: VarianceReason[] = [];
    const totalVariance = Math.abs(tokenVariance);

    // Complexity variance (retry count indicates complexity)
    if (actual.retry_count > 2) {
      reasons.push({
        category: 'complexity',
        description: `Task required ${actual.retry_count} retries, indicating higher complexity`,
        impact_tokens: actual.retry_count * 500,
        impact_percentage: (actual.retry_count * 500) / estimate.estimated_tokens
      });
    }

    // Context variance (context length grew)
    if (actual.context_length > 100000) {
      reasons.push({
        category: 'context',
        description: `Large context length (${actual.context_length} tokens)`,
        impact_tokens: actual.context_length * 0.1,
        impact_percentage: (actual.context_length * 0.1) / estimate.estimated_tokens
      });
    }

    // Quality variance (errors indicate rework)
    if (actual.error_count > 0) {
      reasons.push({
        category: 'quality',
        description: `${actual.error_count} errors required debugging`,
        impact_tokens: actual.error_count * 300,
        impact_percentage: (actual.error_count * 300) / estimate.estimated_tokens
      });
    }

    // Unknown variance (catch-all for unexplained)
    const explainedVariance = reasons.reduce((sum, r) => sum + r.impact_percentage, 0);
    if (explainedVariance < totalVariance * 0.8) {
      reasons.push({
        category: 'unknowns',
        description: 'Unexplained variance factors',
        impact_tokens: estimate.estimated_tokens * (totalVariance - explainedVariance),
        impact_percentage: totalVariance - explainedVariance
      });
    }

    return reasons;
  }

  /**
   * Identify patterns in variance across tasks
   */
  async analyzeVariancePatterns(
    taskType: string,
    timeRangeHours: number = 24 * 7  // Default: 1 week
  ): Promise<VariancePattern> {
    const tasks = await this.getTasksWithVariance(taskType, timeRangeHours);

    // Group by variance category
    const underestimated = tasks.filter(t => t.variance.variance_category === 'underestimated');
    const overestimated = tasks.filter(t => t.variance.variance_category === 'overestimated');
    const accurate = tasks.filter(t => t.variance.variance_category === 'accurate');

    // Calculate statistics
    const avgVariance = tasks.reduce((sum, t) => sum + t.variance.overall_variance, 0) / tasks.length;
    const stdDevVariance = Math.sqrt(
      tasks.reduce((sum, t) => sum + Math.pow(t.variance.overall_variance - avgVariance, 2), 0)
      / tasks.length
    );

    // Find common variance reasons
    const reasonCounts = new Map<string, number>();
    tasks.forEach(t => {
      t.variance.variance_reasons.forEach(r => {
        reasonCounts.set(r.category, (reasonCounts.get(r.category) || 0) + 1);
      });
    });

    const topReasons = Array.from(reasonCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      task_type: taskType,
      total_tasks: tasks.length,
      underestimated_count: underestimated.length,
      overestimated_count: overestimated.length,
      accurate_count: accurate.length,
      avg_variance: avgVariance,
      std_dev_variance: stdDevVariance,
      top_variance_reasons: topReasons.map(([category, count]) => ({
        category,
        count,
        percentage: count / tasks.length
      })),
      recommendation: this.generateRecommendation(avgVariance, topReasons)
    };
  }

  private generateRecommendation(
    avgVariance: number,
    topReasons: [string, number][]
  ): string {
    if (Math.abs(avgVariance) < 0.1) {
      return 'Estimates are accurate. Continue current sizing approach.';
    }

    if (avgVariance > 0.3) {
      const topReason = topReasons[0]?.[0] || 'unknown';
      return `Consistently underestimating by 30%+. Focus on ${topReason} factors when estimating.`;
    }

    if (avgVariance < -0.3) {
      return 'Consistently overestimating by 30%+. Consider reducing size estimates or padding less.';
    }

    return 'Some variance detected. Review specific variance reasons for improvement.';
  }

  private async getTasksWithVariance(
    taskType: string,
    timeRangeHours: number
  ): Promise<Array<{ estimate: TaskEstimate; actual: TaskActual; variance: CostVariance }>> {
    // Implementation: fetch from database
    throw new Error('Not implemented');
  }
}

interface VariancePattern {
  task_type: string;
  total_tasks: number;
  underestimated_count: number;
  overestimated_count: number;
  accurate_count: number;
  avg_variance: number;
  std_dev_variance: number;
  top_variance_reasons: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
  recommendation: string;
}
```

### 4.2 ML-Based Estimator Training

```typescript
/**
 * Machine learning model for improving estimates
 */
interface EstimatorModel {
  model_id: string;
  task_type: string;

  // Training data
  training_samples: number;
  last_trained: Date;

  // Model performance
  mae: number;  // Mean absolute error
  rmse: number; // Root mean squared error
  r2_score: number;

  // Feature importance
  feature_importance: Record<string, number>;
}

class MLEstimator {
  /**
   * Train estimator on historical data
   */
  async train(
    taskType: string,
    historicalData: Array<{ estimate: TaskEstimate; actual: TaskActual }>
  ): Promise<EstimatorModel> {
    // Feature extraction
    const features = historicalData.map(d => this.extractFeatures(d.estimate));
    const targets = historicalData.map(d => d.actual.actual_breakdown.total_tokens);

    // Simple linear regression (in production, use TensorFlow.js or similar)
    const model = await this.trainLinearRegression(features, targets);

    // Evaluate model
    const predictions = features.map(f => this.predict(model, f));
    const mae = this.calculateMAE(predictions, targets);
    const rmse = this.calculateRMSE(predictions, targets);
    const r2 = this.calculateR2(predictions, targets);

    return {
      model_id: `estimator-${taskType}-${Date.now()}`,
      task_type: taskType,
      training_samples: historicalData.length,
      last_trained: new Date(),
      mae,
      rmse,
      r2_score: r2,
      feature_importance: this.calculateFeatureImportance(model)
    };
  }

  /**
   * Extract features for ML model
   */
  private extractFeatures(estimate: TaskEstimate): number[] {
    return [
      this.sizeToNumeric(estimate.size),
      estimate.estimated_tokens,
      estimate.estimated_time_seconds,
      estimate.estimated_quality,
      estimate.confidence,
      estimate.similar_tasks.length
    ];
  }

  private sizeToNumeric(size: TaskSize): number {
    const mapping = {
      [TaskSize.XS]: 1,
      [TaskSize.S]: 2,
      [TaskSize.M]: 3,
      [TaskSize.L]: 4,
      [TaskSize.XL]: 5,
      [TaskSize.XXL]: 6
    };
    return mapping[size] || 3;
  }

  /**
   * Predict tokens for new task
   */
  async predictTokens(
    taskType: string,
    estimate: TaskEstimate
  ): Promise<{
    predicted_tokens: number;
    confidence_interval: [number, number];
    model_confidence: number;
  }> {
    const model = await this.loadModel(taskType);
    const features = this.extractFeatures(estimate);
    const prediction = this.predict(model, features);

    // Calculate confidence interval (95%)
    const stdError = model.rmse;
    const ci: [number, number] = [
      prediction - 1.96 * stdError,
      prediction + 1.96 * stdError
    ];

    return {
      predicted_tokens: Math.round(prediction),
      confidence_interval: [Math.round(ci[0]), Math.round(ci[1])],
      model_confidence: model.r2_score
    };
  }

  private async trainLinearRegression(
    features: number[][],
    targets: number[]
  ): Promise<any> {
    // Simplified implementation - use TensorFlow.js in production
    return { weights: [], bias: 0 };
  }

  private predict(model: any, features: number[]): number {
    // Simplified implementation
    return 0;
  }

  private calculateMAE(predictions: number[], targets: number[]): number {
    return predictions.reduce((sum, pred, i) =>
      sum + Math.abs(pred - targets[i]), 0
    ) / predictions.length;
  }

  private calculateRMSE(predictions: number[], targets: number[]): number {
    return Math.sqrt(
      predictions.reduce((sum, pred, i) =>
        sum + Math.pow(pred - targets[i], 2), 0
      ) / predictions.length
    );
  }

  private calculateR2(predictions: number[], targets: number[]): number {
    const mean = targets.reduce((sum, t) => sum + t, 0) / targets.length;
    const ssRes = predictions.reduce((sum, pred, i) =>
      sum + Math.pow(targets[i] - pred, 2), 0
    );
    const ssTot = targets.reduce((sum, t) =>
      sum + Math.pow(t - mean, 2), 0
    );
    return 1 - (ssRes / ssTot);
  }

  private calculateFeatureImportance(model: any): Record<string, number> {
    return {
      size: 0.35,
      estimated_tokens: 0.25,
      estimated_time: 0.20,
      quality: 0.10,
      confidence: 0.05,
      similar_tasks_count: 0.05
    };
  }

  private async loadModel(taskType: string): Promise<EstimatorModel> {
    // Implementation: load from storage
    throw new Error('Not implemented');
  }
}
```

---

## 5. Ledger Integration

### 5.1 Ledger Schema

```typescript
/**
 * Ledger entry for all cost transactions
 */
interface LedgerEntry {
  entry_id: string;
  timestamp: Date;

  // Transaction type
  type: 'reservation' | 'spend' | 'refund' | 'penalty' | 'top-up';

  // Budget tracking
  budget_id: string;
  task_id?: string;

  // Amounts
  tokens: number;
  usd: number;

  // Balance after transaction
  balance_tokens: number;
  balance_usd: number;

  // Metadata
  description: string;
  metadata: Record<string, any>;
}

/**
 * Ledger service for tracking all transactions
 */
class LedgerService {
  /**
   * Record token reservation (pre-flight)
   */
  async recordReservation(
    budgetId: string,
    taskId: string,
    tokens: number,
    estimate: TaskEstimate
  ): Promise<LedgerEntry> {
    const entry: LedgerEntry = {
      entry_id: `reserve-${taskId}-${Date.now()}`,
      timestamp: new Date(),
      type: 'reservation',
      budget_id: budgetId,
      task_id: taskId,
      tokens: tokens,
      usd: new CostCalculator(DEFAULT_PRICING).tokensToUsd(tokens),
      balance_tokens: await this.getBalance(budgetId) - tokens,
      balance_usd: 0,  // Calculated
      description: `Reserved ${tokens} tokens for task ${taskId}`,
      metadata: {
        size: estimate.size,
        estimated_tokens: estimate.estimated_tokens,
        confidence: estimate.confidence
      }
    };

    await this.writeEntry(entry);
    return entry;
  }

  /**
   * Record actual spend (post-execution)
   */
  async recordSpend(
    budgetId: string,
    taskId: string,
    actual: TaskActual,
    reservedTokens: number
  ): Promise<LedgerEntry> {
    const actualTokens = actual.actual_breakdown.total_tokens;
    const netSpend = actualTokens - reservedTokens;  // Already reserved

    const entry: LedgerEntry = {
      entry_id: `spend-${taskId}-${Date.now()}`,
      timestamp: new Date(),
      type: 'spend',
      budget_id: budgetId,
      task_id: taskId,
      tokens: actualTokens,
      usd: actual.actual_breakdown.total_cost_usd,
      balance_tokens: await this.getBalance(budgetId) - netSpend,
      balance_usd: 0,
      description: `Spent ${actualTokens} tokens on task ${taskId}`,
      metadata: {
        reserved_tokens: reservedTokens,
        net_spend: netSpend,
        quality: actual.actual_quality,
        retry_count: actual.retry_count
      }
    };

    await this.writeEntry(entry);
    return entry;
  }

  /**
   * Record refund for overestimation
   */
  async recordRefund(
    budgetId: string,
    taskId: string,
    variance: CostVariance
  ): Promise<LedgerEntry> {
    const entry: LedgerEntry = {
      entry_id: `refund-${taskId}-${Date.now()}`,
      timestamp: new Date(),
      type: 'refund',
      budget_id: budgetId,
      task_id: taskId,
      tokens: variance.refund_tokens,
      usd: new CostCalculator(DEFAULT_PRICING).tokensToUsd(variance.refund_tokens),
      balance_tokens: await this.getBalance(budgetId) + variance.refund_tokens,
      balance_usd: 0,
      description: `Refund of ${variance.refund_tokens} tokens for overestimation`,
      metadata: {
        token_variance: variance.token_variance,
        variance_category: variance.variance_category
      }
    };

    await this.writeEntry(entry);
    return entry;
  }

  /**
   * Record penalty for budget overrun
   */
  async recordPenalty(
    budgetId: string,
    taskId: string,
    variance: CostVariance
  ): Promise<LedgerEntry> {
    const entry: LedgerEntry = {
      entry_id: `penalty-${taskId}-${Date.now()}`,
      timestamp: new Date(),
      type: 'penalty',
      budget_id: budgetId,
      task_id: taskId,
      tokens: -variance.penalty_tokens,  // Negative
      usd: -new CostCalculator(DEFAULT_PRICING).tokensToUsd(variance.penalty_tokens),
      balance_tokens: await this.getBalance(budgetId) - variance.penalty_tokens,
      balance_usd: 0,
      description: `Penalty of ${variance.penalty_tokens} tokens for budget overrun`,
      metadata: {
        token_variance: variance.token_variance,
        variance_reasons: variance.variance_reasons
      }
    };

    await this.writeEntry(entry);
    return entry;
  }

  /**
   * Get ledger history for budget
   */
  async getLedgerHistory(
    budgetId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<LedgerEntry[]> {
    // Implementation: query database
    throw new Error('Not implemented');
  }

  /**
   * Generate ledger report
   */
  async generateReport(
    budgetId: string,
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<LedgerReport> {
    const entries = await this.getLedgerHistory(budgetId);

    const totalReserved = entries
      .filter(e => e.type === 'reservation')
      .reduce((sum, e) => sum + e.tokens, 0);

    const totalSpent = entries
      .filter(e => e.type === 'spend')
      .reduce((sum, e) => sum + e.tokens, 0);

    const totalRefunded = entries
      .filter(e => e.type === 'refund')
      .reduce((sum, e) => sum + e.tokens, 0);

    const totalPenalties = entries
      .filter(e => e.type === 'penalty')
      .reduce((sum, e) => sum - e.tokens, 0);  // Penalties are negative

    const netSpend = totalSpent - totalRefunded + totalPenalties;

    return {
      budget_id: budgetId,
      period,
      start_date: entries[0]?.timestamp,
      end_date: entries[entries.length - 1]?.timestamp,
      total_reserved: totalReserved,
      total_spent: totalSpent,
      total_refunded: totalRefunded,
      total_penalties: totalPenalties,
      net_spend: netSpend,
      transaction_count: entries.length,
      entries: entries
    };
  }

  private async getBalance(budgetId: string): Promise<number> {
    // Implementation: get current balance
    return 0;
  }

  private async writeEntry(entry: LedgerEntry): Promise<void> {
    // Implementation: write to database
  }
}

interface LedgerReport {
  budget_id: string;
  period: string;
  start_date: Date;
  end_date: Date;
  total_reserved: number;
  total_spent: number;
  total_refunded: number;
  total_penalties: number;
  net_spend: number;
  transaction_count: number;
  entries: LedgerEntry[];
}
```

---

## 6. Reporting & Analytics

### 6.1 Analytics Dashboard

```typescript
/**
 * Analytics service for cost insights
 */
class CostAnalytics {
  /**
   * Get cost breakdown by dimension
   */
  async getCostBreakdown(
    budgetId: string,
    dimension: 'task_type' | 'agent' | 'user' | 'time',
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<CostBreakdownReport> {
    const entries = await new LedgerService().getLedgerHistory(budgetId);

    // Group by dimension
    const grouped = new Map<string, number>();

    entries.forEach(entry => {
      let key: string;

      switch (dimension) {
        case 'task_type':
          key = entry.metadata?.task_type || 'unknown';
          break;
        case 'agent':
          key = entry.metadata?.agent_type || 'unknown';
          break;
        case 'user':
          key = entry.metadata?.user_id || 'unknown';
          break;
        case 'time':
          key = entry.timestamp.toISOString().split('T')[0];
          break;
      }

      grouped.set(key, (grouped.get(key) || 0) + entry.tokens);
    });

    const items = Array.from(grouped.entries())
      .map(([key, tokens]) => ({
        key,
        tokens,
        usd: new CostCalculator(DEFAULT_PRICING).tokensToUsd(tokens),
        percentage: tokens / entries.reduce((sum, e) => sum + e.tokens, 0)
      }))
      .sort((a, b) => b.tokens - a.tokens);

    return {
      dimension,
      period,
      total_tokens: items.reduce((sum, item) => sum + item.tokens, 0),
      total_usd: items.reduce((sum, item) => sum + item.usd, 0),
      items
    };
  }

  /**
   * Analyze variance trends over time
   */
  async getVarianceTrends(
    taskType: string,
    periodDays: number = 30
  ): Promise<VarianceTrend[]> {
    // Group variance by week
    const variances = await this.getHistoricalVariances(taskType, periodDays);

    const weeklyGroups = new Map<string, CostVariance[]>();

    variances.forEach(v => {
      const week = this.getWeekKey(v.calculated_at);
      if (!weeklyGroups.has(week)) {
        weeklyGroups.set(week, []);
      }
      weeklyGroups.get(week)!.push(v);
    });

    return Array.from(weeklyGroups.entries()).map(([week, variances]) => {
      const avgVariance = variances.reduce((sum, v) => sum + v.overall_variance, 0) / variances.length;
      const accuracyRate = variances.filter(v => v.variance_category === 'accurate').length / variances.length;

      return {
        week,
        avg_variance: avgVariance,
        accuracy_rate: accuracyRate,
        sample_count: variances.length,
        improving: avgVariance < 0.1  // Getting better if < 10% variance
      };
    });
  }

  /**
   * Calculate budget utilization metrics
   */
  async getBudgetUtilization(
    budgetId: string
  ): Promise<BudgetUtilization> {
    const budget = await this.getBudget(budgetId);
    const burnRate = await new BudgetEnforcer().monitorBurnRate(budgetId);

    const utilizationRate =
      (budget.reserved_tokens + budget.spent_tokens) / budget.total_tokens;

    const efficiency =
      budget.spent_tokens / (budget.reserved_tokens + budget.spent_tokens);

    return {
      budget_id: budgetId,
      total_tokens: budget.total_tokens,
      reserved_tokens: budget.reserved_tokens,
      spent_tokens: budget.spent_tokens,
      available_tokens: budget.available_tokens,
      utilization_rate: utilizationRate,
      efficiency_rate: efficiency,
      burn_rate: burnRate.tokens_per_hour,
      estimated_runway_hours: burnRate.estimated_runway_hours,
      projected_depletion: burnRate.projected_depletion
    };
  }

  /**
   * Calculate ROI analysis
   */
  async calculateROI(
    budgetId: string,
    valueMetrics: ValueMetrics
  ): Promise<ROIAnalysis> {
    const utilization = await this.getBudgetUtilization(budgetId);

    // Value delivered (custom metrics from user)
    const totalValue =
      valueMetrics.features_delivered * valueMetrics.value_per_feature +
      valueMetrics.bugs_fixed * valueMetrics.value_per_bug +
      valueMetrics.time_saved_hours * valueMetrics.value_per_hour;

    const totalCost = new CostCalculator(DEFAULT_PRICING).tokensToUsd(
      utilization.spent_tokens
    );

    const roi = (totalValue - totalCost) / totalCost;

    return {
      budget_id: budgetId,
      total_value_usd: totalValue,
      total_cost_usd: totalCost,
      roi_percentage: roi * 100,
      roi_ratio: totalValue / totalCost,
      value_metrics: valueMetrics,
      recommendation: roi > 2
        ? 'High ROI - continue investment'
        : roi > 1
        ? 'Positive ROI - monitor efficiency'
        : 'Low ROI - optimize or reduce spend'
    };
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = Math.ceil(
      (date.getTime() - new Date(year, 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
    );
    return `${year}-W${week}`;
  }

  private async getHistoricalVariances(
    taskType: string,
    periodDays: number
  ): Promise<CostVariance[]> {
    // Implementation: fetch from database
    return [];
  }

  private async getBudget(budgetId: string): Promise<Budget> {
    // Implementation: fetch from database
    throw new Error('Not implemented');
  }
}

interface CostBreakdownReport {
  dimension: string;
  period: string;
  total_tokens: number;
  total_usd: number;
  items: Array<{
    key: string;
    tokens: number;
    usd: number;
    percentage: number;
  }>;
}

interface VarianceTrend {
  week: string;
  avg_variance: number;
  accuracy_rate: number;
  sample_count: number;
  improving: boolean;
}

interface BudgetUtilization {
  budget_id: string;
  total_tokens: number;
  reserved_tokens: number;
  spent_tokens: number;
  available_tokens: number;
  utilization_rate: number;
  efficiency_rate: number;
  burn_rate: number;
  estimated_runway_hours: number;
  projected_depletion: Date;
}

interface ValueMetrics {
  features_delivered: number;
  value_per_feature: number;
  bugs_fixed: number;
  value_per_bug: number;
  time_saved_hours: number;
  value_per_hour: number;
}

interface ROIAnalysis {
  budget_id: string;
  total_value_usd: number;
  total_cost_usd: number;
  roi_percentage: number;
  roi_ratio: number;
  value_metrics: ValueMetrics;
  recommendation: string;
}
```

---

## 7. Practical Implementation for weave-nn

### 7.1 Integration Points

```typescript
/**
 * Integration with weave-nn cultivation system
 */
class WeaveNNCostIntegration {
  private ledger = new LedgerService();
  private enforcer = new BudgetEnforcer();
  private analyzer = new VarianceAnalyzer();
  private estimator = new MLEstimator();

  /**
   * Before cultivation task
   */
  async beforeCultivation(
    userId: string,
    taskDescription: string,
    size: TaskSize
  ): Promise<{ approved: boolean; estimate: TaskEstimate }> {
    // 1. Generate estimate
    const estimate = await this.generateEstimate(taskDescription, size);

    // 2. Check budget
    const budgetCheck = await this.enforcer.checkBudget(
      `user-${userId}`,
      estimate
    );

    if (!budgetCheck.approved) {
      throw new Error(
        `Budget exceeded. ${budgetCheck.reason}. ` +
        `Suggested: ${budgetCheck.suggested_size} or ${budgetCheck.suggested_model}`
      );
    }

    // 3. Reserve tokens
    await this.enforcer.reserveTokens(
      `user-${userId}`,
      estimate.task_id,
      estimate.reserved_tokens
    );

    // 4. Record in ledger
    await this.ledger.recordReservation(
      `user-${userId}`,
      estimate.task_id,
      estimate.reserved_tokens,
      estimate
    );

    return { approved: true, estimate };
  }

  /**
   * After cultivation task
   */
  async afterCultivation(
    userId: string,
    taskId: string,
    actual: TaskActual,
    estimate: TaskEstimate
  ): Promise<void> {
    // 1. Calculate variance
    const variance = this.analyzer.calculateVariance(estimate, actual);

    // 2. Deduct actual tokens
    await this.enforcer.deductTokens(
      `user-${userId}`,
      taskId,
      actual.actual_breakdown.total_tokens,
      estimate.reserved_tokens
    );

    // 3. Record spend in ledger
    await this.ledger.recordSpend(
      `user-${userId}`,
      taskId,
      actual,
      estimate.reserved_tokens
    );

    // 4. Handle refund/penalty
    if (variance.refund_tokens > 0) {
      await this.enforcer.refundTokens(`user-${userId}`, taskId, variance.refund_tokens);
      await this.ledger.recordRefund(`user-${userId}`, taskId, variance);
    } else if (variance.penalty_tokens > 0) {
      await this.ledger.recordPenalty(`user-${userId}`, taskId, variance);
    }

    // 5. Train estimator with new data
    await this.estimator.train(estimate.task_type, [{ estimate, actual }]);
  }

  /**
   * Generate estimate using ML + heuristics
   */
  private async generateEstimate(
    description: string,
    size: TaskSize
  ): Promise<TaskEstimate> {
    const config = DEFAULT_SIZE_CONFIG[size];
    const taskType = await this.classifyTaskType(description);

    // Use ML model if available
    const mlPrediction = await this.estimator.predictTokens(taskType, {
      task_id: '',
      task_type: taskType,
      size,
      estimated_tokens: config.typical_tokens,
      estimated_tokens_min: config.min_tokens,
      estimated_tokens_max: config.max_tokens,
      estimated_time_seconds: config.typical_time_seconds,
      estimated_time_min: config.min_time_seconds,
      estimated_time_max: config.max_time_seconds,
      estimated_quality: config.typical_quality,
      reserved_tokens: config.typical_tokens * 1.2,  // 20% buffer
      reserved_cost_usd: config.typical_cost_usd,
      estimated_by: 'model',
      confidence: 0.8,
      similar_tasks: [],
      created_at: new Date()
    }).catch(() => null);

    // Use ML prediction if confident, otherwise use config
    const estimatedTokens = mlPrediction && mlPrediction.model_confidence > 0.7
      ? mlPrediction.predicted_tokens
      : config.typical_tokens;

    return {
      task_id: `task-${Date.now()}`,
      task_type: taskType,
      size,
      estimated_tokens: estimatedTokens,
      estimated_tokens_min: config.min_tokens,
      estimated_tokens_max: config.max_tokens,
      estimated_time_seconds: config.typical_time_seconds,
      estimated_time_min: config.min_time_seconds,
      estimated_time_max: config.max_time_seconds,
      estimated_quality: config.typical_quality,
      reserved_tokens: Math.ceil(estimatedTokens * 1.2),  // 20% buffer
      reserved_cost_usd: new CostCalculator(DEFAULT_PRICING).tokensToUsd(
        estimatedTokens * 1.2
      ),
      estimated_by: mlPrediction ? 'model' : 'config',
      confidence: mlPrediction?.model_confidence || 0.6,
      similar_tasks: [],
      created_at: new Date()
    };
  }

  private async classifyTaskType(description: string): Promise<string> {
    // Simple keyword-based classification (use NLP in production)
    const keywords = description.toLowerCase();

    if (keywords.includes('test')) return 'testing';
    if (keywords.includes('refactor')) return 'refactoring';
    if (keywords.includes('bug') || keywords.includes('fix')) return 'bug-fix';
    if (keywords.includes('feature')) return 'feature-development';
    if (keywords.includes('document')) return 'documentation';
    if (keywords.includes('review')) return 'code-review';

    return 'general';
  }
}
```

### 7.2 CLI Commands

```typescript
/**
 * CLI commands for cost management
 */
export const costCommands = {
  /**
   * Estimate cost for a task
   */
  estimate: async (description: string, size: TaskSize) => {
    const integration = new WeaveNNCostIntegration();
    const estimate = await integration['generateEstimate'](description, size);

    console.log(`\n📊 Cost Estimate:`);
    console.log(`   Size: ${estimate.size.toUpperCase()}`);
    console.log(`   Tokens: ${estimate.estimated_tokens} (${estimate.estimated_tokens_min}-${estimate.estimated_tokens_max})`);
    console.log(`   Time: ${Math.round(estimate.estimated_time_seconds / 60)} minutes`);
    console.log(`   Cost: $${estimate.reserved_cost_usd.toFixed(4)}`);
    console.log(`   Quality: ${(estimate.estimated_quality * 100).toFixed(1)}%`);
    console.log(`   Confidence: ${(estimate.confidence * 100).toFixed(1)}%\n`);
  },

  /**
   * View budget status
   */
  budget: async (userId: string) => {
    const analytics = new CostAnalytics();
    const utilization = await analytics.getBudgetUtilization(`user-${userId}`);

    console.log(`\n💰 Budget Status:`);
    console.log(`   Total: ${utilization.total_tokens} tokens`);
    console.log(`   Available: ${utilization.available_tokens} tokens`);
    console.log(`   Reserved: ${utilization.reserved_tokens} tokens`);
    console.log(`   Spent: ${utilization.spent_tokens} tokens`);
    console.log(`   Utilization: ${(utilization.utilization_rate * 100).toFixed(1)}%`);
    console.log(`   Burn Rate: ${utilization.burn_rate.toFixed(0)} tokens/hour`);
    console.log(`   Runway: ${utilization.estimated_runway_hours.toFixed(1)} hours\n`);
  },

  /**
   * View variance analysis
   */
  variance: async (taskType: string, days: number = 7) => {
    const analyzer = new VarianceAnalyzer();
    const pattern = await analyzer.analyzeVariancePatterns(taskType, days * 24);

    console.log(`\n📈 Variance Analysis (${taskType}):`);
    console.log(`   Total Tasks: ${pattern.total_tasks}`);
    console.log(`   Accurate: ${pattern.accurate_count} (${(pattern.accurate_count / pattern.total_tasks * 100).toFixed(1)}%)`);
    console.log(`   Underestimated: ${pattern.underestimated_count}`);
    console.log(`   Overestimated: ${pattern.overestimated_count}`);
    console.log(`   Avg Variance: ${(pattern.avg_variance * 100).toFixed(1)}%`);
    console.log(`\n   Top Reasons:`);
    pattern.top_variance_reasons.forEach(r => {
      console.log(`   - ${r.category}: ${r.count} times (${(r.percentage * 100).toFixed(1)}%)`);
    });
    console.log(`\n   💡 ${pattern.recommendation}\n`);
  },

  /**
   * View ledger history
   */
  ledger: async (userId: string, days: number = 7) => {
    const ledger = new LedgerService();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const entries = await ledger.getLedgerHistory(`user-${userId}`, startDate);

    console.log(`\n📖 Ledger History (last ${days} days):\n`);
    entries.forEach(entry => {
      const sign = entry.type === 'refund' ? '+' : '-';
      console.log(
        `   ${entry.timestamp.toISOString().split('T')[0]} ` +
        `${entry.type.padEnd(12)} ${sign}${entry.tokens.toString().padStart(6)} tokens ` +
        `Balance: ${entry.balance_tokens}`
      );
    });
    console.log();
  }
};
```

### 7.3 T-Shirt Sizing UI

```typescript
/**
 * Interactive T-shirt sizing prompt
 */
export async function promptForSize(): Promise<TaskSize> {
  console.log('\n👕 Select Task Size:\n');

  Object.values(TaskSize).forEach(size => {
    const config = DEFAULT_SIZE_CONFIG[size];
    console.log(
      `   ${size.toUpperCase().padEnd(4)} - ${config.description}\n` +
      `          ${config.typical_tokens} tokens (~${Math.round(config.typical_time_seconds / 60)} min) - ` +
      `$${config.typical_cost_usd.toFixed(4)}\n` +
      `          Examples: ${config.examples[0]}\n`
    );
  });

  // Get user input (implementation depends on CLI framework)
  const size = await getUserInput('Size (xs/s/m/l/xl/xxl): ');

  return size.toLowerCase() as TaskSize;
}
```

### 7.4 Budget Dashboard

```typescript
/**
 * Display budget dashboard
 */
export async function displayDashboard(userId: string): Promise<void> {
  const analytics = new CostAnalytics();

  // Budget utilization
  const utilization = await analytics.getBudgetUtilization(`user-${userId}`);

  // Cost breakdown
  const breakdown = await analytics.getCostBreakdown(
    `user-${userId}`,
    'task_type',
    'weekly'
  );

  // Variance trends
  const ledger = new LedgerService();
  const report = await ledger.generateReport(`user-${userId}`, 'weekly');

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('                    COST DASHBOARD                        ');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Budget section
  console.log('💰 BUDGET STATUS');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`   Total Budget:     ${utilization.total_tokens.toLocaleString()} tokens`);
  console.log(`   Available:        ${utilization.available_tokens.toLocaleString()} tokens`);
  console.log(`   Reserved:         ${utilization.reserved_tokens.toLocaleString()} tokens`);
  console.log(`   Spent:            ${utilization.spent_tokens.toLocaleString()} tokens`);
  console.log(`   Utilization:      ${(utilization.utilization_rate * 100).toFixed(1)}%`);
  console.log(`   Efficiency:       ${(utilization.efficiency_rate * 100).toFixed(1)}%`);
  console.log(`   Burn Rate:        ${utilization.burn_rate.toFixed(0)} tokens/hour`);
  console.log(`   Est. Runway:      ${utilization.estimated_runway_hours.toFixed(1)} hours\n`);

  // Progress bar
  const barLength = 40;
  const filledLength = Math.round(barLength * utilization.utilization_rate);
  const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
  console.log(`   [${bar}] ${(utilization.utilization_rate * 100).toFixed(1)}%\n`);

  // Cost breakdown section
  console.log('📊 COST BREAKDOWN (This Week)');
  console.log('───────────────────────────────────────────────────────────');
  breakdown.items.forEach(item => {
    console.log(
      `   ${item.key.padEnd(20)} ${item.tokens.toLocaleString().padStart(8)} tokens ` +
      `($${item.usd.toFixed(4)}) ${(item.percentage * 100).toFixed(1)}%`
    );
  });
  console.log();

  // Ledger summary section
  console.log('📖 LEDGER SUMMARY');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`   Transactions:     ${report.transaction_count}`);
  console.log(`   Total Reserved:   ${report.total_reserved.toLocaleString()} tokens`);
  console.log(`   Total Spent:      ${report.total_spent.toLocaleString()} tokens`);
  console.log(`   Total Refunded:   ${report.total_refunded.toLocaleString()} tokens`);
  console.log(`   Penalties:        ${report.total_penalties.toLocaleString()} tokens`);
  console.log(`   Net Spend:        ${report.net_spend.toLocaleString()} tokens\n`);

  console.log('═══════════════════════════════════════════════════════════\n');
}

function getUserInput(prompt: string): Promise<string> {
  // Implementation depends on CLI framework (inquirer, prompts, etc.)
  return Promise.resolve('m');
}
```

---

## 8. Formulas Summary

### 8.1 Core Calculations

```
// Token Variance
token_variance = (actual_tokens - estimated_tokens) / estimated_tokens

// Time Variance
time_variance = (actual_time - estimated_time) / estimated_time

// Quality Variance
quality_variance = (actual_quality - estimated_quality) / estimated_quality

// Overall Variance (weighted)
overall_variance = 0.5 * token_variance + 0.3 * time_variance + 0.2 * quality_variance

// Budget Utilization
utilization_rate = (reserved_tokens + spent_tokens) / total_tokens

// Budget Efficiency
efficiency_rate = spent_tokens / (reserved_tokens + spent_tokens)

// Burn Rate
burn_rate = total_spent_in_period / hours_in_period

// Runway
runway_hours = available_tokens / burn_rate

// API Cost (USD)
api_cost = (input_tokens / 1M * input_rate) + (output_tokens / 1M * output_rate)

// Internal Tokens
internal_tokens = usd_cost * usd_to_tokens_rate

// ROI
roi = (total_value - total_cost) / total_cost
```

---

## 9. Next Steps

### 9.1 Immediate Implementation (Phase 1)
1. Implement basic `TaskEstimate`, `TaskActual`, `CostVariance` interfaces
2. Create `CostCalculator` with pricing config
3. Add t-shirt sizing to cultivation CLI
4. Implement simple budget tracking (no enforcement yet)
5. Basic ledger recording (reservation, spend, refund)

### 9.2 Core Features (Phase 2)
1. Budget enforcement with pre-flight checks
2. Circuit breaker for runaway tasks
3. Variance analysis after each task
4. Ledger report generation
5. Cost breakdown dashboard

### 9.3 Advanced Features (Phase 3)
1. ML-based estimator training
2. Real-time burn rate monitoring
3. Variance pattern recognition
4. ROI analysis
5. Historical calibration

### 9.4 Integration (Phase 4)
1. Integrate with weave-nn cultivation CLI
2. Add cost tracking to all agent operations
3. Build cost dashboard UI
4. Set up automated reports
5. Enable budget quotas per user

---

## Conclusion

This framework provides:
- ✅ **Measurable**: All costs tracked in tokens and USD
- ✅ **Actionable**: Budget enforcement, variance analysis, ML learning
- ✅ **T-shirt sizing**: Simple XS→XXL with token ranges
- ✅ **Variance learning**: Improve estimates from actual data
- ✅ **Ledger integration**: Full transaction history
- ✅ **Implementation ready**: Concrete TypeScript interfaces

Start with Phase 1, iterate based on real usage data, and let the ML estimator learn from variance to continuously improve cost predictions.
