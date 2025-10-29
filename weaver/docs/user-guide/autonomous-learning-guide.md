---
title: Autonomous Learning Loop User Guide
type: documentation
status: complete
created_date: {}
tags:
  - phase-12
  - user-guide
  - learning-loop
  - tutorial
category: guide
domain: weaver
scope: usage
audience:
  - users
  - developers
related_concepts:
  - autonomous-agents
  - machine-learning
  - knowledge-management
version: 1.0.0
visual:
  icon: "\U0001F4DA"
  color: '#06B6D4'
  cssclasses:
    - type-documentation
    - status-complete
    - domain-weaver
updated_date: '2025-10-28'
---

# Autonomous Learning Loop User Guide

Learn how to use Weaver's autonomous learning loop to build self-improving AI agents.

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Core Concepts](#core-concepts)
4. [Basic Usage](#basic-usage)
5. [Advanced Features](#advanced-features)
6. [Configuration](#configuration)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Autonomous Learning Loop transforms Weaver from a smart assistant into a self-improving autonomous agent. It learns from every task execution and continuously improves its performance.

### What is the Learning Loop?

The learning loop implements a complete autonomous agent framework based on academic research:

```
┌─────────────────────────────────────────────────────┐
│              AUTONOMOUS LEARNING LOOP                │
├─────────────────────────────────────────────────────┤
│                                                      │
│  1. PERCEPTION   → Gather context from multiple     │
│                     sources (past experiences,      │
│                     notes, web search)              │
│                                                      │
│  2. REASONING    → Generate multiple plans using    │
│                     Chain-of-Thought, select best   │
│                                                      │
│  3. EXECUTION    → Execute plan with monitoring     │
│                     and fault tolerance             │
│                                                      │
│  4. REFLECTION   → Analyze outcome, extract         │
│                     lessons learned                 │
│                                                      │
│  5. MEMORY       → Store experience for future      │
│                     reference and learning          │
│                                                      │
└─────────────────────────────────────────────────────┘
```

### Key Features

✅ **Autonomous Learning** - Learns from every task automatically
✅ **Multi-Path Reasoning** - Generates multiple plans, selects best
✅ **Semantic Search** - Finds relevant past experiences
✅ **Active Reflection** - Extracts lessons and recommendations
✅ **Continuous Improvement** - Performance improves over time
✅ **Transparent Reasoning** - Chain-of-Thought for all decisions

---

## Quick Start

### Installation

The learning loop is included in Weaver v2.0.0:

```bash
# Install Weaver
npm install @weaver/core

# Or clone and build
git clone https://github.com/your-org/weaver.git
cd weaver
npm install
npm run build
```

### Prerequisites

You'll need:

1. **Anthropic API Key** - For Claude LLM
2. **Claude-Flow MCP Server** - For memory and coordination

```bash
# Set API key
export ANTHROPIC_API_KEY=sk-ant-...

# Add Claude-Flow MCP server
claude mcp add claude-flow npx claude-flow@alpha mcp start
```

### 5-Minute Example

```typescript
import { AutonomousLearningLoop } from '@weaver/learning-loop';
import { ClaudeFlowClient } from '@weaver/memory/claude-flow-client';
import { ClaudeClient } from '@weaver/agents/claude-client';

// Initialize clients
const claudeFlow = new ClaudeFlowClient();
const claudeClient = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY });

// Create learning loop
const loop = new AutonomousLearningLoop(claudeFlow, claudeClient);

// Execute a task
const task = {
  id: 'task_001',
  description: 'Analyze Q4 sales data and identify top 3 growth opportunities',
  domain: 'analytics'
};

const outcome = await loop.execute(task);

if (outcome.success) {
  console.log('✅ Task completed!');
  console.log('Data:', outcome.data);
  console.log('Duration:', outcome.duration + 'ms');
} else {
  console.error('❌ Task failed:', outcome.error);
}
```

---

## Core Concepts

### Task

A task is any work you want the autonomous agent to complete:

```typescript
interface Task {
  id: string;           // Unique identifier
  description: string;  // What to do
  domain: string;       // Category (analytics, research, etc.)
  priority?: string;    // low, medium, high, critical
  metadata?: object;    // Additional context
}
```

**Examples:**

```typescript
// Research task
const researchTask = {
  id: 'research_001',
  description: 'Research best practices for API rate limiting',
  domain: 'research'
};

// Data analysis task
const analysisTask = {
  id: 'analysis_001',
  description: 'Analyze customer churn patterns in Q4 2024',
  domain: 'analytics',
  priority: 'high'
};

// Content creation task
const contentTask = {
  id: 'content_001',
  description: 'Write blog post about TypeScript best practices',
  domain: 'content'
};
```

### Context

Context is gathered from multiple sources:

1. **Past Experiences** - Previous similar tasks
2. **Vault Notes** - Relevant knowledge base articles
3. **External Knowledge** - Web search results (optional)

The system automatically:
- Searches past experiences using semantic similarity
- Queries vault notes using full-text search
- Fetches web results for current information (if enabled)

### Plan

A plan is a sequence of steps to complete a task:

```typescript
interface Plan {
  id: string;
  steps: Step[];
  estimatedEffort: number;
  confidence: number;
  rationale: string;
}
```

The system generates **multiple alternative plans** and selects the best based on:
- Past experience success rates
- Estimated complexity
- Confidence scores
- Risk assessment

### Outcome

The result of executing a task:

```typescript
interface Outcome {
  success: boolean;
  data?: any;
  error?: Error;
  duration: number;
  metrics: ExecutionMetrics;
  logs: string[];
}
```

### Experience

An experience captures everything learned from a task execution:

```typescript
interface Experience {
  task: Task;
  context: Context;
  plan: Plan;
  outcome: Outcome;
  lessons: Lesson[];  // What was learned
  timestamp: number;
}
```

Experiences are stored automatically and used for future tasks.

---

## Basic Usage

### 1. Simple Task Execution

```typescript
const loop = new AutonomousLearningLoop(claudeFlow, claudeClient);

const task = {
  id: 'simple_001',
  description: 'Create a summary of the latest product features',
  domain: 'documentation'
};

const outcome = await loop.execute(task);
console.log('Success:', outcome.success);
```

### 2. With Shadow Cache (Vault Integration)

```typescript
import { ShadowCache } from '@weaver/shadow-cache';

const shadowCache = new ShadowCache({ vaultPath: '/path/to/vault' });
await shadowCache.initialize();

const loop = new AutonomousLearningLoop(
  claudeFlow,
  claudeClient,
  shadowCache  // Now can search vault notes
);

const outcome = await loop.execute(task);
```

### 3. With Workflow Engine

```typescript
import { WorkflowEngine } from '@weaver/workflow-engine';

const workflowEngine = new WorkflowEngine();

const loop = new AutonomousLearningLoop(
  claudeFlow,
  claudeClient,
  shadowCache,
  workflowEngine  // Now can execute complex workflows
);

const outcome = await loop.execute(task);
```

### 4. With Web Search

```typescript
import { WebFetchTool } from '@weaver/tools/web-fetch';

const webFetch = new WebFetchTool({ apiKey: process.env.TAVILY_API_KEY });

const loop = new AutonomousLearningLoop(
  claudeFlow,
  claudeClient,
  shadowCache,
  workflowEngine,
  webFetch  // Now can search web for current info
);

const outcome = await loop.execute(task);
```

### 5. Batch Processing

Process multiple tasks:

```typescript
const tasks = [
  { id: 'task_1', description: 'Analyze sales data', domain: 'analytics' },
  { id: 'task_2', description: 'Research competitors', domain: 'research' },
  { id: 'task_3', description: 'Write summary', domain: 'content' }
];

for (const task of tasks) {
  const outcome = await loop.execute(task);
  console.log(`${task.id}: ${outcome.success ? '✓' : '✗'}`);
}
```

### 6. Parallel Execution

Execute tasks in parallel:

```typescript
const outcomes = await Promise.all(
  tasks.map(task => loop.execute(task))
);

const successCount = outcomes.filter(o => o.success).length;
console.log(`${successCount}/${outcomes.length} tasks succeeded`);
```

---

## Advanced Features

### Multi-Path Reasoning

The system generates multiple alternative plans:

```typescript
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    generateAlternativePlans: true,
    maxAlternativePlans: 5  // Generate 5 alternatives
  }
);

const outcome = await loop.execute(task);
```

Each plan is evaluated and scored based on:
- **Past experience** - Similar tasks that succeeded
- **Complexity** - Number of steps, dependencies
- **Confidence** - How sure the system is
- **Risk** - Potential failure points

The best plan is selected automatically.

### Learning Demonstration

See the system improve over time:

```typescript
const task = {
  id: 'demo_001',
  description: 'Optimize database query performance',
  domain: 'engineering'
};

const report = await loop.demonstrateLearning(task, 5);

console.log('Learning Report:');
console.log('- Iterations:', report.iterations);
console.log('- Overall Improvement:', report.overallImprovement + '%');
console.log('- Success Rate:', report.metrics.successRate);
console.log('- Average Duration:', report.metrics.averageDuration + 'ms');
console.log('- Total Lessons:', report.metrics.totalLessons);

console.log('\nKey Learnings:');
report.keyLearnings.forEach(learning => {
  console.log('  •', learning);
});

console.log('\nRecommendations:');
report.recommendations.forEach(rec => {
  console.log('  •', rec);
});
```

**Expected Results:**

- **Improvement**: +20% typical after 5 iterations
- **Confidence**: Increases with each iteration
- **Duration**: Often decreases as system learns shortcuts

### External Knowledge Gathering

Enable web search for current information:

```typescript
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    enableExternalKnowledge: true,
    maxNotesPerQuery: 30
  }
);

// Task that benefits from current info
const task = {
  id: 'research_001',
  description: 'Research current TypeScript 5.3 features',
  domain: 'research'
};

const outcome = await loop.execute(task);
```

The system will:
1. Search past experiences
2. Query vault notes
3. **Search the web** for current information
4. Fuse all sources into unified context

### Pattern Analysis

Enable deep pattern analysis during reflection:

```typescript
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    enablePatternAnalysis: true,
    minLessonImpact: 'medium'  // Only store medium+ impact lessons
  }
);

const outcome = await loop.execute(task);
```

Pattern analysis identifies:
- Recurring success patterns
- Common failure modes
- Optimization opportunities
- Cross-domain correlations

---

## Configuration

### Default Configuration

```typescript
{
  // Perception settings
  maxExperiencesPerQuery: 10,
  maxNotesPerQuery: 20,
  enableExternalKnowledge: false,
  semanticSearchThreshold: 0.7,

  // Reasoning settings
  generateAlternativePlans: true,
  maxAlternativePlans: 3,
  minPlanConfidence: 0.5,

  // Memory settings
  experienceRetentionDays: 30,
  memoryNamespace: 'weaver_experiences',
  enableCompression: true,

  // Execution settings
  enableMonitoring: true,
  maxRetries: 3,
  timeoutMs: 300000,  // 5 minutes

  // Reflection settings
  enablePatternAnalysis: true,
  minLessonImpact: 'medium'
}
```

### Configuration Profiles

#### Research Profile

Optimized for research tasks:

```typescript
const researchConfig = {
  enableExternalKnowledge: true,
  maxNotesPerQuery: 30,
  maxAlternativePlans: 5,
  enablePatternAnalysis: true
};

const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  researchConfig
);
```

#### Production Profile

Optimized for speed:

```typescript
const productionConfig = {
  enableExternalKnowledge: false,
  maxNotesPerQuery: 10,
  maxAlternativePlans: 2,
  enablePatternAnalysis: false,
  maxRetries: 2
};

const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine,
  productionConfig
);
```

#### Learning Profile

Optimized for learning improvement:

```typescript
const learningConfig = {
  enableExternalKnowledge: false,
  maxExperiencesPerQuery: 20,
  maxAlternativePlans: 5,
  enablePatternAnalysis: true,
  minLessonImpact: 'low'  // Capture all lessons
};

const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  learningConfig
);
```

---

## Best Practices

### 1. Use Descriptive Task Descriptions

❌ **Bad:**

```typescript
{ id: 'task_1', description: 'Do analysis', domain: 'analytics' }
```

✅ **Good:**

```typescript
{
  id: 'task_1',
  description: 'Analyze Q4 2024 sales data to identify top 3 growth opportunities by product category',
  domain: 'analytics',
  priority: 'high',
  metadata: {
    quarter: 'Q4',
    year: 2024,
    expectedOutputs: ['growth_opportunities', 'product_analysis']
  }
}
```

### 2. Use Meaningful Domains

Organize tasks by domain for better learning:

```typescript
// Good domain organization
const domains = [
  'analytics',
  'research',
  'content',
  'engineering',
  'documentation',
  'testing',
  'deployment'
];
```

Tasks in the same domain learn from each other.

### 3. Enable External Knowledge Selectively

Web search is powerful but slower:

```typescript
// Enable for research tasks
const researchTask = {
  description: 'Research latest React 19 features',
  domain: 'research'
};

const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  { enableExternalKnowledge: true }
);

// Disable for routine tasks
const routineTask = {
  description: 'Generate weekly status report',
  domain: 'documentation'
};

const fastLoop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine,
  { enableExternalKnowledge: false }
);
```

### 4. Monitor and Analyze

Track performance over time:

```typescript
const outcomes: Outcome[] = [];

for (const task of tasks) {
  const outcome = await loop.execute(task);
  outcomes.push(outcome);
}

// Analyze results
const successRate = outcomes.filter(o => o.success).length / outcomes.length;
const avgDuration = outcomes.reduce((sum, o) => sum + o.duration, 0) / outcomes.length;

console.log('Success Rate:', (successRate * 100).toFixed(1) + '%');
console.log('Average Duration:', avgDuration.toFixed(0) + 'ms');
```

### 5. Implement Error Recovery

```typescript
async function executeWithRetry(
  loop: AutonomousLearningLoop,
  task: Task,
  maxRetries = 3
): Promise<Outcome> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const outcome = await loop.execute(task);
      if (outcome.success) return outcome;

      console.log(`Attempt ${i + 1} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.error(`Error on attempt ${i + 1}:`, error.message);
    }
  }

  throw new Error('Max retries exceeded');
}
```

### 6. Use Task Priorities

Prioritize critical tasks:

```typescript
const tasks = [
  { id: '1', description: 'Fix production bug', domain: 'engineering', priority: 'critical' },
  { id: '2', description: 'Write docs', domain: 'documentation', priority: 'low' },
  { id: '3', description: 'Analyze metrics', domain: 'analytics', priority: 'high' }
];

// Sort by priority
const sorted = tasks.sort((a, b) => {
  const priorities = { critical: 4, high: 3, medium: 2, low: 1 };
  return priorities[b.priority] - priorities[a.priority];
});

// Execute in priority order
for (const task of sorted) {
  await loop.execute(task);
}
```

---

## Troubleshooting

### Common Issues

#### 1. "Failed to gather context"

**Error:** `PerceptionError: Failed to gather context`

**Causes:**
- MCP server not running
- Shadow cache not initialized
- No past experiences found

**Solutions:**

```bash
# Check MCP server status
npx claude-flow@alpha mcp status

# Restart MCP server
npx claude-flow@alpha mcp start

# Verify shadow cache
ls ~/.weaver/shadow-cache/
```

```typescript
// Ensure shadow cache is initialized
const shadowCache = new ShadowCache({ vaultPath: '/path/to/vault' });
await shadowCache.initialize();
await shadowCache.index();  // Re-index if needed
```

#### 2. "Failed to generate plan"

**Error:** `ReasoningError: Failed to generate plan`

**Causes:**
- Claude API key missing/invalid
- API rate limit exceeded
- Poor task description

**Solutions:**

```bash
# Verify API key
echo $ANTHROPIC_API_KEY

# Check API quota
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
```

```typescript
// Improve task description
const task = {
  id: 'task_001',
  description: 'Analyze sales data',  // Too vague
  domain: 'analytics'
};

// Better:
const task = {
  id: 'task_001',
  description: 'Analyze Q4 2024 sales data by product category and identify top 3 growth opportunities',
  domain: 'analytics',
  metadata: {
    dataSource: 'sales_db',
    outputFormat: 'markdown_report'
  }
};
```

#### 3. "Execution timeout"

**Error:** `ExecutionError: Execution timeout`

**Causes:**
- Task too complex
- Network issues
- Infinite loop in workflow

**Solutions:**

```typescript
// Increase timeout
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    timeoutMs: 600000  // 10 minutes instead of 5
  }
);

// Or break task into smaller subtasks
const subtasks = [
  { id: 's1', description: 'Load and clean data', domain: 'analytics' },
  { id: 's2', description: 'Perform analysis', domain: 'analytics' },
  { id: 's3', description: 'Generate report', domain: 'analytics' }
];

for (const subtask of subtasks) {
  await loop.execute(subtask);
}
```

#### 4. "Memory storage failed"

**Error:** `MemoryError: Failed to store experience`

**Causes:**
- Disk space full
- Memory namespace misconfigured
- Experience too large

**Solutions:**

```bash
# Check disk space
df -h ~/.weaver/

# Clear old experiences
npx claude-flow@alpha memory clear --namespace weaver_experiences
```

```typescript
// Enable compression
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    enableCompression: true,
    experienceRetentionDays: 14  // Keep less history
  }
);
```

### Performance Issues

#### Slow Perception (> 1s)

```typescript
// Reduce search scope
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    maxExperiencesPerQuery: 5,   // Instead of 10
    maxNotesPerQuery: 10,         // Instead of 20
    enableExternalKnowledge: false  // Disable if not needed
  }
);
```

#### Slow Reasoning (> 10s)

```typescript
// Generate fewer alternatives
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    generateAlternativePlans: true,
    maxAlternativePlans: 2  // Instead of 3-5
  }
);
```

#### Memory Leaks

```typescript
// Enable auto-cleanup
const loop = new AutonomousLearningLoop(
  claudeFlow, claudeClient, shadowCache, workflowEngine, webFetch,
  {
    experienceRetentionDays: 7,  // Clean up after 1 week
    enableCompression: true
  }
);

// Manual cleanup
await claudeFlow.memory_usage({
  action: 'delete',
  namespace: 'weaver_experiences',
  key: 'old_experience_*'
});
```

---

## Next Steps

### Learn More

- [API Reference](../api/learning-loop-api.md) - Complete API documentation
- [Developer Guide](../developer/phase-12-architecture.md) - System architecture
- [Integration Guide](../developer/integration-guide.md) - Extend the learning loop
- [Examples](../../examples/phase-12/) - Real-world code examples

### Advanced Topics

- **Custom Workflows** - Build complex multi-step workflows
- **Pattern Libraries** - Create reusable solution patterns
- **Domain-Specific Agents** - Specialize agents per domain
- **Multi-Agent Coordination** - Coordinate multiple learning loops

---

**Version**: 1.0.0
**Last Updated**: 2025-10-27
**Status**: Production Ready
