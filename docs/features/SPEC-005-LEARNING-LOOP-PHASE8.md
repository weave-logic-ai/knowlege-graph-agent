# Feature Specification: Phase 8 Learning Loop Features

**Spec ID**: SPEC-005
**Priority**: HIGH
**Estimated Effort**: 24-32 hours
**Dependencies**: SPEC-001 (MCP Tool Execution)

## Overview

Implement the task completion feedback loop for continuous learning as specified in Phase 8 plans. This enables the 4-Pillar Framework (Perception, Reasoning, Memory, Execution) to autonomously improve from experience.

## Current State

### Problem
The learning loop components are specified in Phase 8 documentation but NOT implemented:
- Memory Extraction Service - NOT BUILT
- Agent Priming Service - NOT BUILT
- Task Completion Consumer - NOT BUILT
- Daily Log Generator - NOT BUILT
- A/B Testing Framework - NOT BUILT

### Impact
- No autonomous learning from task experience
- Agents cannot improve performance over time
- No memory extraction from successful tasks
- 4-Pillar Framework is incomplete

---

## Component Specifications

### COMPONENT-001: Memory Extraction Service

**Purpose**: Extract structured memories from completed task executions.

**File**: `src/learning-loop/memory-extraction.ts`

#### Memory Types

```typescript
enum MemoryType {
  EPISODIC = 'episodic',     // What happened (task execution history)
  PROCEDURAL = 'procedural', // How to do it (successful patterns)
  SEMANTIC = 'semantic',     // What it means (learned concepts)
  TECHNICAL = 'technical',   // Technical details (code patterns)
  CONTEXT = 'context',       // Environmental context
}

interface ExtractedMemory {
  id: string;
  type: MemoryType;
  content: string;
  source: {
    taskId: string;
    agentId: string;
    timestamp: Date;
  };
  metadata: {
    confidence: number;
    relevance: string[];
    expiresAt?: Date;
  };
  embedding?: Float32Array;
}
```

#### Implementation

```typescript
export class MemoryExtractionService {
  private embeddingService: EmbeddingService;
  private memoryStore: VectorStore;

  /**
   * Extract memories from a completed task
   */
  async extractFromTask(task: CompletedTask): Promise<ExtractedMemory[]> {
    const memories: ExtractedMemory[] = [];

    // Extract episodic memory (what happened)
    memories.push(await this.extractEpisodicMemory(task));

    // Extract procedural memory (if task was successful)
    if (task.status === 'success') {
      memories.push(await this.extractProceduralMemory(task));
    }

    // Extract semantic memory (learned concepts)
    const semanticMemories = await this.extractSemanticMemories(task);
    memories.push(...semanticMemories);

    // Extract technical memory (code patterns)
    if (task.type === 'code') {
      memories.push(await this.extractTechnicalMemory(task));
    }

    // Store all memories with embeddings
    await this.storeMemories(memories);

    return memories;
  }

  private async extractEpisodicMemory(task: CompletedTask): Promise<ExtractedMemory> {
    return {
      id: `episodic-${task.id}`,
      type: MemoryType.EPISODIC,
      content: this.formatEpisodicContent(task),
      source: {
        taskId: task.id,
        agentId: task.agentId,
        timestamp: new Date(),
      },
      metadata: {
        confidence: 1.0,
        relevance: task.tags ?? [],
      },
    };
  }

  private formatEpisodicContent(task: CompletedTask): string {
    return `
## Task: ${task.title}

### Input
${task.input}

### Actions Taken
${task.steps.map((s, i) => `${i + 1}. ${s.action}: ${s.result}`).join('\n')}

### Outcome
Status: ${task.status}
${task.output}

### Duration
${task.duration}ms
    `.trim();
  }

  private async extractProceduralMemory(task: CompletedTask): Promise<ExtractedMemory> {
    // Extract the successful procedure as reusable pattern
    const procedure = this.extractProcedure(task);

    return {
      id: `procedural-${task.id}`,
      type: MemoryType.PROCEDURAL,
      content: procedure,
      source: {
        taskId: task.id,
        agentId: task.agentId,
        timestamp: new Date(),
      },
      metadata: {
        confidence: task.qualityScore ?? 0.8,
        relevance: task.tags ?? [],
      },
    };
  }

  private extractProcedure(task: CompletedTask): string {
    return `
## Procedure: ${task.title}

### Prerequisites
${task.prerequisites?.join('\n- ') ?? 'None'}

### Steps
${task.steps.map((s, i) => `${i + 1}. ${s.action}`).join('\n')}

### Success Criteria
${task.successCriteria ?? 'Task completed without errors'}

### Notes
${task.notes ?? ''}
    `.trim();
  }

  private async storeMemories(memories: ExtractedMemory[]): Promise<void> {
    for (const memory of memories) {
      // Generate embedding for semantic search
      memory.embedding = await this.embeddingService.embed(memory.content);

      // Store in vector store
      await this.memoryStore.upsert(memory.id, memory.content, {
        type: memory.type,
        source: memory.source,
        metadata: memory.metadata,
      });

      // Sync to claude-flow memory
      await this.syncToClaudeFlow(memory);
    }
  }

  private async syncToClaudeFlow(memory: ExtractedMemory): Promise<void> {
    const namespace = `learning/${memory.type}`;
    const key = memory.id;
    const value = JSON.stringify({
      content: memory.content,
      source: memory.source,
      metadata: memory.metadata,
    });

    // Use MCP client to store
    await mcpClient.memoryStore(key, value, namespace);
  }
}
```

---

### COMPONENT-002: Agent Priming Service

**Purpose**: Pre-load relevant memories and context before task execution.

**File**: `src/learning-loop/agent-priming.ts`

```typescript
export interface PrimingContext {
  relevantMemories: ExtractedMemory[];
  similarTasks: CompletedTask[];
  domainKnowledge: string[];
  previousAttempts: TaskAttempt[];
}

export class AgentPrimingService {
  private memoryStore: VectorStore;
  private hybridSearch: HybridSearch;

  /**
   * Generate priming context for an agent before task execution
   */
  async generatePrimingContext(task: Task, agent: Agent): Promise<PrimingContext> {
    // Find relevant memories
    const relevantMemories = await this.findRelevantMemories(task);

    // Find similar completed tasks
    const similarTasks = await this.findSimilarTasks(task);

    // Get domain knowledge
    const domainKnowledge = await this.getDomainKnowledge(task.domain);

    // Get previous attempts at this task (if any)
    const previousAttempts = await this.getPreviousAttempts(task.id);

    return {
      relevantMemories,
      similarTasks,
      domainKnowledge,
      previousAttempts,
    };
  }

  /**
   * Format priming context as system prompt
   */
  formatAsSystemPrompt(context: PrimingContext): string {
    let prompt = '## Relevant Experience\n\n';

    // Add relevant memories
    if (context.relevantMemories.length > 0) {
      prompt += '### Previous Learnings\n';
      for (const memory of context.relevantMemories.slice(0, 5)) {
        prompt += `- ${memory.content.slice(0, 200)}...\n`;
      }
      prompt += '\n';
    }

    // Add similar successful tasks
    if (context.similarTasks.length > 0) {
      prompt += '### Similar Successful Tasks\n';
      for (const task of context.similarTasks.slice(0, 3)) {
        prompt += `- **${task.title}**: ${task.output?.slice(0, 100)}...\n`;
      }
      prompt += '\n';
    }

    // Add domain knowledge
    if (context.domainKnowledge.length > 0) {
      prompt += '### Domain Knowledge\n';
      prompt += context.domainKnowledge.join('\n');
      prompt += '\n';
    }

    // Add warnings from previous attempts
    if (context.previousAttempts.length > 0) {
      prompt += '### Previous Attempt Insights\n';
      for (const attempt of context.previousAttempts) {
        if (attempt.status === 'failed') {
          prompt += `- ⚠️ Previous failure: ${attempt.error}\n`;
        }
      }
    }

    return prompt;
  }

  private async findRelevantMemories(task: Task): Promise<ExtractedMemory[]> {
    const query = `${task.title} ${task.description}`;
    const results = await this.hybridSearch.search(query);

    return results.map((r) => ({
      id: r.nodeId,
      type: r.metadata?.type as MemoryType ?? MemoryType.SEMANTIC,
      content: r.content,
      source: r.metadata?.source as ExtractedMemory['source'],
      metadata: {
        confidence: r.combinedScore,
        relevance: [],
      },
    }));
  }

  private async findSimilarTasks(task: Task): Promise<CompletedTask[]> {
    // Query completed tasks with similar content
    const query = `${task.type} ${task.title}`;
    const results = await this.memoryStore.search(query, 10, 0.6);

    return results
      .filter((r) => r.metadata?.status === 'success')
      .map((r) => r.metadata as unknown as CompletedTask);
  }
}
```

---

### COMPONENT-003: Task Completion Consumer

**Purpose**: Process task completion events and trigger memory extraction.

**File**: `src/learning-loop/task-completion-consumer.ts`

```typescript
import { EventEmitter } from 'events';

export class TaskCompletionConsumer extends EventEmitter {
  private memoryExtraction: MemoryExtractionService;
  private dailyLogGenerator: DailyLogGenerator;

  /**
   * Start consuming task completion events
   */
  async start(): Promise<void> {
    // Subscribe to task completion events
    agentRegistry.on('taskComplete', this.handleTaskComplete.bind(this));

    console.log('Task completion consumer started');
  }

  /**
   * Handle a completed task
   */
  private async handleTaskComplete(task: CompletedTask): Promise<void> {
    try {
      // Extract memories
      const memories = await this.memoryExtraction.extractFromTask(task);

      // Emit event for monitoring
      this.emit('memoriesExtracted', { taskId: task.id, count: memories.length });

      // Update daily log
      await this.dailyLogGenerator.addTaskEntry(task);

      // If task was successful, update success patterns
      if (task.status === 'success') {
        await this.updateSuccessPatterns(task);
      }

      // If task failed, record failure for learning
      if (task.status === 'failed') {
        await this.recordFailure(task);
      }

      console.log(`Processed task ${task.id}: extracted ${memories.length} memories`);
    } catch (error) {
      console.error(`Error processing task ${task.id}:`, error);
      this.emit('error', { taskId: task.id, error });
    }
  }

  private async updateSuccessPatterns(task: CompletedTask): Promise<void> {
    // Store successful patterns for future priming
    const patternKey = `pattern/${task.type}/${task.id}`;
    const patternValue = JSON.stringify({
      type: task.type,
      steps: task.steps,
      duration: task.duration,
      qualityScore: task.qualityScore,
    });

    await mcpClient.memoryStore(patternKey, patternValue, 'patterns');
  }

  private async recordFailure(task: CompletedTask): Promise<void> {
    // Store failure for avoiding similar mistakes
    const failureKey = `failure/${task.type}/${task.id}`;
    const failureValue = JSON.stringify({
      type: task.type,
      error: task.error,
      steps: task.steps,
      context: task.context,
    });

    await mcpClient.memoryStore(failureKey, failureValue, 'failures');
  }
}
```

---

### COMPONENT-004: Daily Log Generator

**Purpose**: Automatically generate daily activity summaries.

**File**: `src/learning-loop/daily-log-generator.ts`

```typescript
export class DailyLogGenerator {
  private todaysTasks: CompletedTask[] = [];
  private memoryStore: VectorStore;

  /**
   * Add a task entry to today's log
   */
  async addTaskEntry(task: CompletedTask): Promise<void> {
    this.todaysTasks.push(task);

    // If it's a new day, flush previous day's log
    const today = new Date().toISOString().split('T')[0];
    const lastTask = this.todaysTasks[this.todaysTasks.length - 2];
    if (lastTask) {
      const lastDay = new Date(lastTask.completedAt).toISOString().split('T')[0];
      if (lastDay !== today) {
        await this.generateDailyLog(lastDay);
        this.todaysTasks = [task];
      }
    }
  }

  /**
   * Generate daily log for a specific date
   */
  async generateDailyLog(date: string): Promise<DailyLog> {
    const tasks = this.todaysTasks.filter(
      (t) => new Date(t.completedAt).toISOString().split('T')[0] === date
    );

    const log: DailyLog = {
      date,
      summary: this.generateSummary(tasks),
      tasks: tasks.map((t) => ({
        id: t.id,
        title: t.title,
        status: t.status,
        duration: t.duration,
        agent: t.agentId,
      })),
      metrics: this.calculateMetrics(tasks),
      insights: await this.generateInsights(tasks),
    };

    // Store daily log
    await this.storeDailyLog(log);

    // Create markdown file
    await this.createDailyLogFile(log);

    return log;
  }

  private generateSummary(tasks: CompletedTask[]): string {
    const successful = tasks.filter((t) => t.status === 'success').length;
    const failed = tasks.filter((t) => t.status === 'failed').length;
    const totalTime = tasks.reduce((sum, t) => sum + (t.duration ?? 0), 0);

    return `Completed ${tasks.length} tasks (${successful} successful, ${failed} failed) in ${Math.round(totalTime / 1000 / 60)} minutes.`;
  }

  private calculateMetrics(tasks: CompletedTask[]): DailyMetrics {
    return {
      totalTasks: tasks.length,
      successRate: tasks.filter((t) => t.status === 'success').length / tasks.length,
      avgDuration: tasks.reduce((sum, t) => sum + (t.duration ?? 0), 0) / tasks.length,
      tasksByType: this.groupBy(tasks, 'type'),
      tasksByAgent: this.groupBy(tasks, 'agentId'),
    };
  }

  private async generateInsights(tasks: CompletedTask[]): Promise<string[]> {
    const insights: string[] = [];

    // Success patterns
    const successfulTypes = tasks
      .filter((t) => t.status === 'success')
      .map((t) => t.type);
    const typeCounts = this.countOccurrences(successfulTypes);
    const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0];
    if (topType) {
      insights.push(`Most successful task type: ${topType[0]} (${topType[1]} completed)`);
    }

    // Failure patterns
    const failures = tasks.filter((t) => t.status === 'failed');
    if (failures.length > 0) {
      const commonErrors = this.findCommonPatterns(failures.map((f) => f.error ?? ''));
      if (commonErrors.length > 0) {
        insights.push(`Common failure patterns: ${commonErrors.join(', ')}`);
      }
    }

    return insights;
  }

  private async createDailyLogFile(log: DailyLog): Promise<void> {
    const content = `---
date: ${log.date}
type: daily-log
status: auto-generated
---

# Daily Log - ${log.date}

## Summary
${log.summary}

## Metrics
- Total Tasks: ${log.metrics.totalTasks}
- Success Rate: ${(log.metrics.successRate * 100).toFixed(1)}%
- Avg Duration: ${Math.round(log.metrics.avgDuration / 1000)}s

## Tasks
${log.tasks.map((t) => `- [${t.status === 'success' ? 'x' : ' '}] ${t.title} (${t.agent})`).join('\n')}

## Insights
${log.insights.map((i) => `- ${i}`).join('\n')}
`;

    const filePath = `daily-logs/${log.date}.md`;
    await fs.writeFile(filePath, content, 'utf-8');
  }
}

interface DailyLog {
  date: string;
  summary: string;
  tasks: Array<{
    id: string;
    title: string;
    status: string;
    duration: number;
    agent: string;
  }>;
  metrics: DailyMetrics;
  insights: string[];
}

interface DailyMetrics {
  totalTasks: number;
  successRate: number;
  avgDuration: number;
  tasksByType: Record<string, number>;
  tasksByAgent: Record<string, number>;
}
```

---

### COMPONENT-005: A/B Testing Framework

**Purpose**: Compare different AI approaches and strategies.

**File**: `src/learning-loop/ab-testing.ts`

```typescript
export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABVariant[];
  status: 'running' | 'completed' | 'paused';
  startedAt: Date;
  endedAt?: Date;
  results?: ABTestResults;
}

interface ABVariant {
  id: string;
  name: string;
  config: Record<string, unknown>;
  weight: number; // Percentage of traffic
}

export class ABTestingFramework {
  private activeTests: Map<string, ABTest> = new Map();
  private results: Map<string, ABVariantResult[]> = new Map();

  /**
   * Create a new A/B test
   */
  async createTest(test: Omit<ABTest, 'id' | 'status' | 'startedAt'>): Promise<ABTest> {
    const fullTest: ABTest = {
      ...test,
      id: `ab-${Date.now()}`,
      status: 'running',
      startedAt: new Date(),
    };

    this.activeTests.set(fullTest.id, fullTest);
    this.results.set(fullTest.id, []);

    return fullTest;
  }

  /**
   * Select a variant for a task
   */
  selectVariant(testId: string): ABVariant | null {
    const test = this.activeTests.get(testId);
    if (!test || test.status !== 'running') return null;

    // Weighted random selection
    const random = Math.random() * 100;
    let cumulative = 0;

    for (const variant of test.variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant;
      }
    }

    return test.variants[0];
  }

  /**
   * Record result for a variant
   */
  async recordResult(
    testId: string,
    variantId: string,
    result: { success: boolean; duration: number; quality?: number }
  ): Promise<void> {
    const results = this.results.get(testId) ?? [];
    results.push({
      variantId,
      timestamp: new Date(),
      ...result,
    });
    this.results.set(testId, results);
  }

  /**
   * Analyze test results
   */
  analyzeResults(testId: string): ABTestResults {
    const test = this.activeTests.get(testId);
    const results = this.results.get(testId) ?? [];

    if (!test) throw new Error(`Test ${testId} not found`);

    const analysis: ABTestResults = {
      testId,
      sampleSize: results.length,
      variants: {},
    };

    for (const variant of test.variants) {
      const variantResults = results.filter((r) => r.variantId === variant.id);
      const successes = variantResults.filter((r) => r.success);

      analysis.variants[variant.id] = {
        name: variant.name,
        sampleSize: variantResults.length,
        successRate: successes.length / variantResults.length,
        avgDuration: variantResults.reduce((sum, r) => sum + r.duration, 0) / variantResults.length,
        avgQuality: successes.reduce((sum, r) => sum + (r.quality ?? 0), 0) / successes.length,
      };
    }

    // Determine winner
    const variantScores = Object.entries(analysis.variants)
      .map(([id, stats]) => ({
        id,
        score: stats.successRate * 0.4 + (1 / stats.avgDuration) * 0.3 + stats.avgQuality * 0.3,
      }))
      .sort((a, b) => b.score - a.score);

    analysis.winner = variantScores[0]?.id;
    analysis.confidence = this.calculateConfidence(analysis.variants);

    return analysis;
  }

  private calculateConfidence(variants: Record<string, ABVariantStats>): number {
    // Simple confidence calculation based on sample size and success rate difference
    const stats = Object.values(variants);
    if (stats.length < 2) return 0;

    const [best, second] = stats.sort((a, b) => b.successRate - a.successRate);
    const diff = best.successRate - second.successRate;
    const minSample = Math.min(best.sampleSize, second.sampleSize);

    // Higher confidence with larger sample and bigger difference
    return Math.min(1, (diff * minSample) / 100);
  }
}

interface ABVariantResult {
  variantId: string;
  timestamp: Date;
  success: boolean;
  duration: number;
  quality?: number;
}

interface ABVariantStats {
  name: string;
  sampleSize: number;
  successRate: number;
  avgDuration: number;
  avgQuality: number;
}

interface ABTestResults {
  testId: string;
  sampleSize: number;
  variants: Record<string, ABVariantStats>;
  winner?: string;
  confidence?: number;
}
```

---

## Integration

### Event Flow

```
Task Completes
     │
     ▼
TaskCompletionConsumer
     │
     ├──▶ MemoryExtractionService
     │         │
     │         ▼
     │    Extract 5 Memory Types
     │         │
     │         ▼
     │    Store in VectorStore + Claude-Flow
     │
     ├──▶ DailyLogGenerator
     │         │
     │         ▼
     │    Update Daily Summary
     │
     └──▶ ABTestingFramework (if test active)
               │
               ▼
          Record Variant Result
```

### Usage in Agent Execution

```typescript
// Before task execution
const primingContext = await agentPrimingService.generatePrimingContext(task, agent);
const systemPrompt = agentPrimingService.formatAsSystemPrompt(primingContext);

// Execute task with priming
const result = await agent.execute(task, { systemPrompt });

// After task completion
await taskCompletionConsumer.handleTaskComplete(result);
```

---

## Acceptance Criteria

- [ ] Memory extraction produces 5 memory types
- [ ] Agent priming retrieves relevant context before tasks
- [ ] Task completion consumer processes all completed tasks
- [ ] Daily logs are auto-generated at end of day
- [ ] A/B tests can be created and analyzed
- [ ] All memories are stored in both VectorStore and Claude-Flow
- [ ] System improves task success rate by 10%+ after 100 tasks

## Success Metrics

- Memory extraction latency < 500ms per task
- Agent priming improves task success by 10-15%
- Daily logs generated 100% of the time
- A/B test confidence reaches 95% with 200+ samples
