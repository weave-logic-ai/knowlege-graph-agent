# ADR-005: Learning Loop Design - Phase 8 Features

**Status**: Proposed
**Date**: 2025-12-29
**Category**: architecture

## Context

The Knowledge Graph Agent aims to implement the 4-Pillar Framework (Perception, Reasoning, Memory, Execution) with autonomous learning from experience. Currently:

- No autonomous learning from task experience
- Agents cannot improve performance over time
- No memory extraction from successful tasks
- The 4-Pillar Framework is incomplete

Phase 8 specifies 5 key components for the learning loop, none of which are implemented:

| Component | Purpose | Status |
|-----------|---------|--------|
| Memory Extraction Service | Extract structured memories from completed tasks | NOT BUILT |
| Agent Priming Service | Pre-load relevant context before task execution | NOT BUILT |
| Task Completion Consumer | Process task completion events | NOT BUILT |
| Daily Log Generator | Automated daily activity summaries | NOT BUILT |
| A/B Testing Framework | Compare different AI approaches | NOT BUILT |

## Decision

Implement a complete task completion feedback loop with 5 integrated components that enable continuous learning. The system will:

1. Extract 5 memory types from each completed task
2. Prime agents with relevant context before execution
3. Automatically process task completion events
4. Generate daily activity summaries
5. Support A/B testing for approach comparison

### Memory Type Taxonomy

| Memory Type | Purpose | Example |
|-------------|---------|---------|
| EPISODIC | What happened (task execution history) | "Task X completed in 5 steps, took 30s" |
| PROCEDURAL | How to do it (successful patterns) | "For API generation: 1. analyze schema, 2. generate types..." |
| SEMANTIC | What it means (learned concepts) | "REST APIs prefer resource-based URLs" |
| TECHNICAL | Technical details (code patterns) | "Use async/await for database operations" |
| CONTEXT | Environmental context | "Project uses TypeScript 5.0, Node 20" |

### Event Flow

```
Task Completes
     |
     v
TaskCompletionConsumer
     |
     +----> MemoryExtractionService
     |           |
     |           v
     |      Extract 5 Memory Types
     |           |
     |           v
     |      Store in VectorStore + Claude-Flow
     |
     +----> DailyLogGenerator
     |           |
     |           v
     |      Update Daily Summary
     |
     +----> ABTestingFramework (if test active)
               |
               v
          Record Variant Result
```

## Rationale

### Why 5 memory types?

1. **Comprehensive Coverage**: Each type captures different aspects of learning
2. **Retrieval Specificity**: Different contexts need different memory types
3. **Research-Based**: Aligns with cognitive science models
4. **Practical**: Each type serves distinct use cases in agent priming

### Why event-driven architecture?

1. **Decoupling**: Components evolve independently
2. **Scalability**: Events can be processed asynchronously
3. **Observability**: Easy to monitor and debug
4. **Extensibility**: New consumers can be added without changes

### Why agent priming?

1. **Context Matters**: Tasks succeed more with relevant context
2. **Learning Application**: Makes extracted memories useful
3. **Error Prevention**: Warnings from past failures prevent repeats
4. **Performance**: 10-15% improvement in task success rate

### Alternatives Considered

1. **No Learning**: Static agents, no improvement over time
2. **External RAG Service**: Adds latency and complexity
3. **Single Memory Store**: Loses the benefit of typed memories
4. **Manual Curation**: Doesn't scale, inconsistent quality

## Consequences

### Positive

- Autonomous improvement from task experience
- Agents learn from both successes and failures
- Context-aware task execution through priming
- Automated daily summaries for tracking
- Data-driven approach selection via A/B testing
- 10-15% improvement in task success rate
- Reduced repetition of past mistakes

### Negative

- Additional processing time per task (~500ms for memory extraction)
- Storage growth for memories (mitigated by distillation)
- Complexity in debugging learning-influenced behavior
- Cold start problem for new task types

### Neutral

- Memory distillation needed periodically
- A/B tests require sufficient sample size for confidence
- Daily logs create markdown files in vault

## Implementation

### Component 1: Memory Extraction Service

**File**: `src/learning-loop/memory-extraction.ts`

```typescript
enum MemoryType {
  EPISODIC = 'episodic',
  PROCEDURAL = 'procedural',
  SEMANTIC = 'semantic',
  TECHNICAL = 'technical',
  CONTEXT = 'context',
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

export class MemoryExtractionService {
  private embeddingService: EmbeddingService;
  private memoryStore: VectorStore;

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
}
```

### Component 2: Agent Priming Service

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

    // Add warnings from previous attempts
    if (context.previousAttempts.length > 0) {
      prompt += '### Previous Attempt Insights\n';
      for (const attempt of context.previousAttempts) {
        if (attempt.status === 'failed') {
          prompt += `- Warning: Previous failure: ${attempt.error}\n`;
        }
      }
    }

    return prompt;
  }
}
```

### Component 3: Task Completion Consumer

**File**: `src/learning-loop/task-completion-consumer.ts`

```typescript
import { EventEmitter } from 'events';

export class TaskCompletionConsumer extends EventEmitter {
  private memoryExtraction: MemoryExtractionService;
  private dailyLogGenerator: DailyLogGenerator;

  async start(): Promise<void> {
    agentRegistry.on('taskComplete', this.handleTaskComplete.bind(this));
    console.log('Task completion consumer started');
  }

  private async handleTaskComplete(task: CompletedTask): Promise<void> {
    try {
      // Extract memories
      const memories = await this.memoryExtraction.extractFromTask(task);
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
}
```

### Component 4: Daily Log Generator

**File**: `src/learning-loop/daily-log-generator.ts`

```typescript
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

export class DailyLogGenerator {
  async generateDailyLog(date: string): Promise<DailyLog> {
    const tasks = this.getTasksForDate(date);

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

    await this.storeDailyLog(log);
    await this.createDailyLogFile(log);

    return log;
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
```

### Component 5: A/B Testing Framework

**File**: `src/learning-loop/ab-testing.ts`

```typescript
export interface ABTest {
  id: string;
  name: string;
  description: string;
  variants: ABVariant[];
  status: 'running' | 'completed' | 'paused';
  startedAt: Date;
  results?: ABTestResults;
}

interface ABVariant {
  id: string;
  name: string;
  config: Record<string, unknown>;
  weight: number;
}

export class ABTestingFramework {
  private activeTests: Map<string, ABTest> = new Map();
  private results: Map<string, ABVariantResult[]> = new Map();

  async createTest(test: Omit<ABTest, 'id' | 'status' | 'startedAt'>): Promise<ABTest> {
    const fullTest: ABTest = {
      ...test,
      id: `ab-${Date.now()}`,
      status: 'running',
      startedAt: new Date(),
    };

    this.activeTests.set(fullTest.id, fullTest);
    return fullTest;
  }

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

  analyzeResults(testId: string): ABTestResults {
    const test = this.activeTests.get(testId);
    const results = this.results.get(testId) ?? [];

    // Calculate statistics per variant
    // Determine winner based on composite score
    // Calculate statistical confidence

    return analysis;
  }
}
```

### Integration with Agent Execution

```typescript
// Before task execution
const primingContext = await agentPrimingService.generatePrimingContext(task, agent);
const systemPrompt = agentPrimingService.formatAsSystemPrompt(primingContext);

// Execute task with priming
const result = await agent.execute(task, { systemPrompt });

// After task completion
await taskCompletionConsumer.handleTaskComplete(result);
```

## Success Metrics

| Metric | Target |
|--------|--------|
| Memory extraction latency | < 500ms per task |
| Agent priming improvement | 10-15% success rate increase |
| Daily log generation | 100% coverage |
| A/B test confidence | 95% with 200+ samples |
| System learning (after 100 tasks) | 10%+ success rate improvement |

## Acceptance Criteria

- [ ] Memory extraction produces 5 memory types
- [ ] Agent priming retrieves relevant context before tasks
- [ ] Task completion consumer processes all completed tasks
- [ ] Daily logs are auto-generated at end of day
- [ ] A/B tests can be created and analyzed
- [ ] All memories are stored in both VectorStore and Claude-Flow
- [ ] System improves task success rate by 10%+ after 100 tasks

## Future Enhancements

1. **ReasoningBank Integration**: Replace custom memory store with ReasoningBank for 90%+ success rates (see RESEARCH-AGENTIC-FLOW-INTEGRATION.md)
2. **Memory Distillation**: Periodic consolidation of redundant memories
3. **Equilibrium Pruning**: Game-theoretic memory optimization (see RESEARCH-EQUILIBRIUM-PRUNING.md)
4. **Cross-Session Memory**: Persistent learning across restarts

## References

- SPEC-005-LEARNING-LOOP-PHASE8.md (Original specification)
- GAP-005 in FEATURE-GAP-ANALYSIS.md
- RESEARCH-AGENTIC-FLOW-INTEGRATION.md (ReasoningBank comparison)
- RESEARCH-EQUILIBRIUM-PRUNING.md (Memory optimization research)
- Phase 8 documentation
