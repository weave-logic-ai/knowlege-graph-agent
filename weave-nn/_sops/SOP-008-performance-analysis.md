---
sop_id: SOP-008
sop_name: Performance Analysis & Optimization Workflow
category: quality
version: 1.0.0
status: active
triggers:
  - weaver sop perf <component>
  - weaver analyze performance <service>
learning_enabled: true
estimated_duration: 30-60 minutes
complexity: high
type: sop
visual:
  icon: 📝
  color: '#84CC16'
  cssclasses:
    - type-sop
    - status-active
updated_date: '2025-10-28'
icon: 📝
---

# SOP-008: Performance Analysis & Optimization Workflow

## Overview

The Performance Analysis & Optimization Workflow provides systematic identification and resolution of performance bottlenecks through multi-agent analysis of application behavior, resource usage, and system metrics. This SOP coordinates specialized agents to profile code execution, analyze database queries, identify memory leaks, and implement targeted optimizations with measurable performance improvements.

This workflow eliminates ad-hoc performance tuning by applying data-driven analysis across all system layers: application code, database queries, network communication, and infrastructure resources. The learning loop captures optimization patterns and their effectiveness to guide future performance improvements.

By following this SOP, teams achieve predictable application performance, optimal resource utilization, and systematic elimination of bottlenecks that impact user experience and operational costs.

## Prerequisites

- Weaver CLI with profiling capabilities
- Access to production/staging metrics
- Performance monitoring tools configured
- Profiling tools installed (clinic, autocannon, etc.)
- Database query logging enabled

## Inputs

### Required
- **Component/Service**: What to analyze (e.g., "checkout-service", "api")
- **Performance Issue**: Description of problem (slow response, high CPU, etc.)

### Optional
- **Target Metrics**: Desired performance targets (e.g., "P95 < 200ms")
- **Load Profile**: Expected traffic patterns
- **Time Window**: When performance issues occur
- **Baseline Metrics**: Previous performance measurements
- **Budget Constraint**: Maximum acceptable resource usage

## Agent Coordination

This SOP spawns **4 specialized agents** with data dependencies:

### 1. Performance Analyzer Agent
**Role**: Profile and identify bottlenecks
- Profile application execution
- Measure response times and throughput
- Identify CPU-intensive operations
- Detect memory leaks
- Analyze event loop delays

### 2. Code Analyzer Agent
**Role**: Analyze code for inefficiencies
- Review algorithmic complexity
- Identify N+1 query patterns
- Detect synchronous blocking operations
- Find unnecessary computations
- Analyze caching opportunities

### 3. Coder Agent (Optimizer)
**Role**: Implement performance optimizations
- Apply identified optimizations
- Add caching layers
- Optimize database queries
- Implement async patterns
- Refactor inefficient algorithms

### 4. Tester Agent (Validator)
**Role**: Validate performance improvements
- Run performance benchmarks
- Compare before/after metrics
- Verify no regressions
- Load test optimized code
- Validate under production load

## MCP Tools Used

### Performance Report
```typescript
mcp__claude-flow__performance_report({
  format: "detailed",
  timeframe: "24h"
})
```
**Purpose**: Retrieve comprehensive performance metrics for analysis.

### Bottleneck Analysis
```typescript
mcp__claude-flow__bottleneck_analyze({
  component: "checkout-service",
  metrics: ["response_time", "cpu_usage", "memory", "db_queries"]
})
```
**Purpose**: Automated identification of performance bottlenecks across system layers.

### Benchmark Execution
```typescript
mcp__claude-flow__benchmark_run({
  suite: "performance-validation",
  iterations: 100
})
```
**Purpose**: Execute performance benchmarks to measure improvements.

### Token Usage Analysis
```typescript
mcp__claude-flow__token_usage({
  operation: "optimization",
  timeframe: "7d"
})
```
**Purpose**: Analyze resource consumption patterns for optimization opportunities.

## Weaver Integration

### Performance Profiling
```bash
# Weaver profiles application
weaver profile api --duration 60s

# Generates:
# - CPU flame graph
# - Memory heap snapshots
# - Event loop metrics
# - Function call tree
```

### Metrics Collection
Weaver aggregates metrics from:
- Application Performance Monitoring (APM)
- Database slow query logs
- Infrastructure monitoring
- Custom application metrics
- Load balancer logs

### Service Mapping
```bash
# Weaver traces request flow
weaver trace /api/checkout

# Maps:
# - API endpoint -> Service -> Database
# - Response time breakdown by layer
# - Dependency chain
```

## Execution Steps

### Step 1: Initialize Performance Analysis
```bash
# User initiates analysis
weaver sop perf checkout-service

# Weaver setup
npx claude-flow hooks pre-task --description "Performance analysis: checkout-service"
npx claude-flow hooks session-restore --session-id "swarm-perf-checkout"
```

### Step 2: Gather Baseline Metrics
```bash
# Collect current performance data
weaver metrics collect checkout-service --timeframe 24h

# Retrieved:
# - P50 response time: 450ms
# - P95 response time: 1,850ms (target: <500ms)
# - P99 response time: 3,200ms
# - Throughput: 145 req/s
# - Error rate: 0.8%
# - CPU usage: 68%
# - Memory usage: 1.2GB
# - DB query time: 65% of total response time
```

### Step 3: Profile and Identify Bottlenecks (Performance Analyzer)
```typescript
Task("Performance Analyzer", `
  Profile checkout-service to identify performance bottlenecks.

  Current Performance:
  - P95: 1,850ms (target: <500ms) - 3.7x slower than target
  - Throughput: 145 req/s
  - CPU: 68%

  Tasks:
  1. Profile application with production-like load
  2. Analyze CPU flame graph
  3. Check memory allocation patterns
  4. Measure database query times
  5. Identify event loop delays
  6. Analyze dependency call chains

  Commands:
  weaver profile checkout-service --duration 120s --load production
  npx clinic doctor -- node services/checkout/index.js
  npx autocannon -c 100 -d 60 http://localhost:3000/api/checkout

  MCP Tools:
  mcp__claude-flow__bottleneck_analyze({
    component: "checkout-service",
    metrics: ["response_time", "cpu_usage", "db_queries"]
  })

  mcp__claude-flow__performance_report({
    format: "detailed",
    timeframe: "24h"
  })

  Profiling Results:

  CPU Flame Graph Analysis:
  1. calculateTax() - 32% of CPU time
     - Called on every item in cart
     - Complex tax jurisdiction lookup
     - Synchronous calculation

  2. validateInventory() - 28% of CPU time
     - Database query for each cart item (N+1 pattern)
     - No caching of inventory data
     - Sequential queries (not batched)

  3. applyDiscounts() - 18% of CPU time
     - Nested loops for coupon validation
     - O(n²) algorithm complexity

  Memory Analysis:
  - No memory leaks detected
  - High allocation rate: 2.4GB/hour
  - Frequent GC pauses: 15ms avg

  Database Analysis:
  - Total queries per request: 47 queries
  - Slowest query: getProductDetails (340ms avg)
  - N+1 pattern: inventory checks (12-25 queries per request)
  - Missing indexes: product_variants.sku

  Event Loop:
  - Average delay: 23ms
  - Max delay: 185ms
  - Cause: Synchronous tax calculation blocking

  Bottlenecks Identified (Prioritized):

  1. **Critical**: N+1 Query Pattern in validateInventory()
     Impact: 340ms per request (65% of total time)
     Fix: Batch database queries

  2. **High**: Synchronous Tax Calculation
     Impact: 180ms per request (32% CPU)
     Fix: Cache tax rules, move to async

  3. **High**: Missing Database Index
     Impact: 120ms per request
     Fix: Add index on product_variants.sku

  4. **Medium**: O(n²) Discount Algorithm
     Impact: 85ms per request
     Fix: Use hash map for O(n) lookup

  5. **Low**: Excessive Logging
     Impact: 15ms per request
     Fix: Reduce log verbosity in production

  Estimated Total Improvement:
  Current P95: 1,850ms
  Optimized P95: ~340ms (81% improvement)

  Output to memory:
  key: "swarm/perf-analyzer/checkout-bottlenecks"
  value: {
    criticalBottlenecks: [
      {
        name: "N+1 inventory queries",
        impact: 340,
        priority: "critical",
        fix: "Batch queries"
      },
      {
        name: "Synchronous tax calculation",
        impact: 180,
        priority: "high",
        fix: "Cache + async"
      }
    ],
    estimatedImprovement: 0.81,
    targetAchievable: true
  }

  Hooks:
  npx claude-flow hooks post-task --task-id "perf-analysis-checkout"
`, "perf-analyzer")
```

### Step 4: Code Analysis (Code Analyzer)
```typescript
Task("Code Analyzer", `
  Analyze checkout-service code for optimization opportunities.

  Input from memory:
  key: "swarm/perf-analyzer/checkout-bottlenecks"
  Critical bottlenecks: N+1 queries, sync tax calc

  Tasks:
  1. Review validateInventory() implementation
  2. Analyze calculateTax() algorithm
  3. Check applyDiscounts() complexity
  4. Identify caching opportunities
  5. Review database query patterns

  Code Review:

  1. validateInventory() - src/services/checkout.ts:145

  Current (N+1 pattern):
  \`\`\`typescript
  async validateInventory(items: CartItem[]) {
    for (const item of items) {
      // Database query in loop - N+1 problem!
      const stock = await db.query(
        'SELECT quantity FROM inventory WHERE sku = $1',
        [item.sku]
      )
      if (stock.quantity < item.quantity) {
        throw new Error('Insufficient inventory')
      }
    }
  }
  \`\`\`

  Optimized (Single batch query):
  \`\`\`typescript
  async validateInventory(items: CartItem[]) {
    const skus = items.map(item => item.sku)
    // Single query for all SKUs
    const inventory = await db.query(
      'SELECT sku, quantity FROM inventory WHERE sku = ANY($1)',
      [skus]
    )
    const inventoryMap = new Map(
      inventory.rows.map(row => [row.sku, row.quantity])
    )

    for (const item of items) {
      const available = inventoryMap.get(item.sku) || 0
      if (available < item.quantity) {
        throw new Error(\`Insufficient inventory for \${item.sku}\`)
      }
    }
  }
  \`\`\`

  Impact: 340ms -> 12ms (96% improvement)

  2. calculateTax() - src/services/tax.ts:67

  Current (Synchronous, uncached):
  \`\`\`typescript
  function calculateTax(items: CartItem[], address: Address): number {
    // Blocks event loop!
    const jurisdiction = lookupTaxJurisdiction(address)
    let totalTax = 0
    for (const item of items) {
      const rate = getTaxRate(jurisdiction, item.category)
      totalTax += item.price * rate
    }
    return totalTax
  }
  \`\`\`

  Optimized (Cached, async):
  \`\`\`typescript
  // Cache tax rules (updated hourly)
  const taxRulesCache = new Map()

  async function calculateTax(items: CartItem[], address: Address): Promise<number> {
    const cacheKey = \`\${address.zipCode}\`
    let jurisdiction = taxRulesCache.get(cacheKey)

    if (!jurisdiction) {
      jurisdiction = await lookupTaxJurisdiction(address)
      taxRulesCache.set(cacheKey, jurisdiction)
    }

    return items.reduce((tax, item) => {
      const rate = jurisdiction.rates[item.category] || 0
      return tax + (item.price * rate)
    }, 0)
  }
  \`\`\`

  Impact: 180ms -> 5ms (97% improvement)

  3. applyDiscounts() - src/services/discounts.ts:89

  Current (O(n²)):
  \`\`\`typescript
  function applyDiscounts(items: CartItem[], coupons: Coupon[]): number {
    let discount = 0
    for (const item of items) {
      for (const coupon of coupons) {  // Nested loop!
        if (coupon.appliesTo.includes(item.category)) {
          discount += item.price * coupon.discountRate
        }
      }
    }
    return discount
  }
  \`\`\`

  Optimized (O(n) with hash map):
  \`\`\`typescript
  function applyDiscounts(items: CartItem[], coupons: Coupon[]): number {
    // Build category -> discounts map (O(m))
    const discountMap = new Map<string, number>()
    for (const coupon of coupons) {
      for (const category of coupon.appliesTo) {
        const current = discountMap.get(category) || 0
        discountMap.set(category, Math.max(current, coupon.discountRate))
      }
    }

    // Single pass through items (O(n))
    return items.reduce((discount, item) => {
      const rate = discountMap.get(item.category) || 0
      return discount + (item.price * rate)
    }, 0)
  }
  \`\`\`

  Impact: 85ms -> 8ms (91% improvement)

  4. Missing Database Index

  Current:
  No index on product_variants.sku

  Optimized:
  \`\`\`sql
  CREATE INDEX idx_product_variants_sku ON product_variants(sku);
  \`\`\`

  Impact: 120ms -> 8ms (93% improvement)

  Total Estimated Impact:
  Before: 1,850ms (P95)
  After: ~340ms (P95)
  Improvement: 81%

  Output to memory:
  key: "swarm/code-analyzer/optimizations"
  value: {
    optimizations: [
      {
        name: "Batch inventory queries",
        file: "services/checkout.ts",
        line: 145,
        impact: 328,
        implementation: "ready"
      },
      {
        name: "Cache tax calculation",
        file: "services/tax.ts",
        line: 67,
        impact: 175,
        implementation: "ready"
      },
      {
        name: "Optimize discount algorithm",
        file: "services/discounts.ts",
        line: 89,
        impact: 77,
        implementation: "ready"
      },
      {
        name: "Add database index",
        file: "migrations/",
        impact: 112,
        implementation: "ready"
      }
    ]
  }
`, "code-analyzer")
```

### Step 5: Implement Optimizations (Coder)
```typescript
Task("Coder Optimizer", `
  Implement performance optimizations for checkout-service.

  Input from memory:
  key: "swarm/code-analyzer/optimizations"
  Optimizations: 4 identified, estimated 81% improvement

  Tasks:
  1. Batch inventory queries (328ms savings)
  2. Cache tax calculation (175ms savings)
  3. Optimize discount algorithm (77ms savings)
  4. Add database index (112ms savings)

  Implementation:

  File 1: src/services/checkout.ts
  [Implement batched inventory query as shown in analysis]

  File 2: src/services/tax.ts
  [Implement cached tax calculation as shown in analysis]

  File 3: src/services/discounts.ts
  [Implement O(n) discount algorithm as shown in analysis]

  File 4: migrations/015_add_sku_index.sql
  \`\`\`sql
  -- Migration: Add index for SKU lookups
  CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_variants_sku
  ON product_variants(sku);

  -- Analyze table after index creation
  ANALYZE product_variants;
  \`\`\`

  File 5: tests/performance/checkout.perf.test.ts
  \`\`\`typescript
  describe('Checkout Performance', () => {
    it('should complete checkout in < 500ms (P95)', async () => {
      const cart = generateTestCart(15) // 15 items
      const start = Date.now()

      await checkoutService.processCheckout(cart)

      const duration = Date.now() - start
      expect(duration).toBeLessThan(500)
    })

    it('should handle 200 req/s throughput', async () => {
      const results = await loadTest({
        url: '/api/checkout',
        connections: 100,
        duration: 60
      })

      expect(results.requestsPerSecond).toBeGreaterThan(200)
      expect(results.p95).toBeLessThan(500)
    })
  })
  \`\`\`

  Commands:
  weaver edit src/services/checkout.ts
  weaver edit src/services/tax.ts
  weaver edit src/services/discounts.ts
  weaver write migrations/015_add_sku_index.sql
  weaver write tests/performance/checkout.perf.test.ts

  Git workflow:
  git checkout -b perf/optimize-checkout
  git add src/services/ migrations/ tests/
  git commit -m "perf(checkout): Optimize checkout service performance

  Optimizations:
  - Batch inventory queries (N+1 -> single query)
  - Cache tax jurisdiction lookups
  - Optimize discount algorithm (O(n²) -> O(n))
  - Add database index on product_variants.sku

  Expected improvement: 81% (1,850ms -> 340ms P95)

  Related: Performance analysis by SOP-008"

  Output to memory:
  key: "swarm/coder/optimizations-implemented"
  value: {
    filesModified: 3,
    migrationsCreated: 1,
    testsAdded: 2,
    branch: "perf/optimize-checkout",
    commitSha: "def789"
  }

  Hooks:
  npx claude-flow hooks post-edit --file "checkout.ts"
  npx claude-flow hooks post-task --task-id "implement-optimizations"
`, "coder")
```

### Step 6: Validate Performance (Tester)
```typescript
Task("Tester Validator", `
  Validate performance improvements for checkout-service optimizations.

  Input from memory:
  key: "swarm/coder/optimizations-implemented"
  Expected improvement: 81% (1,850ms -> 340ms)

  Tasks:
  1. Run performance test suite
  2. Execute load tests
  3. Compare before/after metrics
  4. Verify no regressions
  5. Validate under production load

  Validation:

  Step 1: Run Performance Tests

  npm run test:perf

  Results:
  ✓ Checkout completes in < 500ms (P95): 312ms
  ✓ Handles 200 req/s throughput: 267 req/s
  ✓ No memory leaks detected
  ✓ CPU usage reduced: 68% -> 42%

  Step 2: Load Testing

  npx autocannon -c 100 -d 120 http://localhost:3000/api/checkout

  Before Optimization:
  - Requests/sec: 145
  - P50: 450ms
  - P95: 1,850ms
  - P99: 3,200ms
  - Errors: 0.8%

  After Optimization:
  - Requests/sec: 267 (84% increase)
  - P50: 125ms (72% improvement)
  - P95: 312ms (83% improvement)
  - P99: 580ms (82% improvement)
  - Errors: 0.1% (87% reduction)

  Step 3: Database Performance

  Before:
  - Queries per request: 47
  - Total query time: 680ms (65% of response time)

  After:
  - Queries per request: 8 (83% reduction)
  - Total query time: 45ms (86% improvement)

  Step 4: Regression Testing

  npm test -- --coverage

  Results:
  ✓ All 1,247 tests passing
  ✓ Coverage: 86% (no change)
  ✓ No functional regressions detected

  Step 5: Production Load Simulation

  Simulate 500 req/s (3x current production load)

  Results:
  - P95: 425ms (within target under 3x load)
  - Error rate: 0.2%
  - CPU: 78% (headroom available)
  - Memory: Stable at 1.1GB

  MCP Tools:
  mcp__claude-flow__benchmark_run({
    suite: "checkout-performance",
    iterations: 100
  })

  Performance Validation: PASS ✓

  Actual vs Expected:
  - Expected P95: 340ms
  - Actual P95: 312ms (8% better than estimate)

  Improvement Summary:
  - Response time: 83% improvement
  - Throughput: 84% increase
  - Database queries: 83% reduction
  - CPU usage: 38% reduction
  - Error rate: 87% reduction

  Output to memory:
  key: "swarm/tester/validation-results"
  value: {
    validated: true,
    p95Before: 1850,
    p95After: 312,
    improvement: 0.83,
    throughputIncrease: 0.84,
    regressions: 0,
    readyForProduction: true
  }

  Hooks:
  npx claude-flow hooks post-task --task-id "perf-validation"
`, "tester")
```

### Step 7: Create Performance Report
```bash
# Weaver generates comprehensive report
weaver report performance checkout-service

# Report includes:
# - Before/after metrics comparison
# - Optimization details
# - Cost savings estimation
# - Deployment recommendation
```

### Step 8: Store Learning Data
```typescript
mcp__claude-flow__memory_usage({
  action: "store",
  key: "performance/optimizations/checkout-2025-10-27",
  namespace: "learning",
  value: JSON.stringify({
    service: "checkout-service",
    dateAnalyzed: "2025-10-27",
    bottlenecksFound: 4,
    optimizationsImplemented: 4,
    beforeMetrics: {
      p95: 1850,
      throughput: 145,
      cpuUsage: 0.68,
      dbQueries: 47
    },
    afterMetrics: {
      p95: 312,
      throughput: 267,
      cpuUsage: 0.42,
      dbQueries: 8
    },
    improvements: {
      responseTime: 0.83,
      throughput: 0.84,
      cpuEfficiency: 0.38,
      dbEfficiency: 0.83
    },
    techniques: [
      "Batch database queries",
      "Cache frequently accessed data",
      "Optimize algorithm complexity",
      "Add database indexes"
    ],
    timeToOptimize: "52 minutes",
    costSavings: "$1,200/month in infrastructure"
  }),
  ttl: 15552000 // 180 days
})
```

## Output Artifacts

### 1. Performance Analysis Report
Detailed bottleneck analysis with profiling data, flame graphs, and metrics.

### 2. Optimized Code
Improved implementation addressing identified bottlenecks.

### 3. Database Migration
Index additions and query optimizations.

### 4. Performance Tests
Automated tests validating performance targets.

### 5. Before/After Metrics
Quantified performance improvement data.

## Success Criteria

✅ **Bottlenecks Identified**: Clear understanding of performance issues
✅ **Optimizations Implemented**: Code changes address root causes
✅ **Performance Target Met**: P95 response time meets target
✅ **No Regressions**: All functional tests pass
✅ **Validated Under Load**: Performance sustained under production load
✅ **Cost Effective**: Optimization provides measurable ROI
✅ **Learning Captured**: Optimization patterns stored for reuse

## Learning Capture

### Optimization Pattern Recognition

```typescript
mcp__claude-flow__neural_train({
  pattern_type: "optimization",
  training_data: JSON.stringify({
    input: {
      bottleneck: "N+1 database queries",
      impact: 340,
      component: "inventory-validation"
    },
    output: {
      technique: "batch-queries",
      improvement: 0.96,
      complexity: "low"
    }
  }),
  epochs: 50
})
```

## Related SOPs

- **SOP-003**: Release Management (performance validation before release)
- **SOP-007**: Code Review (review performance optimizations)
- **SOP-004**: Debugging (debug performance regressions)

## Examples

### Example 1: API Response Time Optimization

```bash
weaver sop perf checkout-service

# Bottleneck: N+1 queries
# Before: P95 1,850ms
# After: P95 312ms
# Improvement: 83%
# Time: 52 minutes
```

### Example 2: Database Query Optimization

```bash
weaver analyze performance user-service

# Bottleneck: Missing indexes
# Before: 450ms query time
# After: 12ms query time
# Improvement: 97%
# Technique: Add composite index
```

### Example 3: Memory Leak Investigation

```bash
weaver sop perf notification-service

# Issue: Memory growing 2GB/hour
# Root cause: Event listener leak
# Fix: Proper cleanup in closeConnection()
# Result: Stable memory usage
```

---

**Version History**
- 1.0.0 (2025-10-27): Initial SOP with systematic performance optimization workflow
