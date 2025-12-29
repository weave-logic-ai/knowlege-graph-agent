/**
 * Agent Priming Service
 *
 * Primes agents with relevant context before task execution by
 * retrieving similar past tasks and relevant memories.
 *
 * Enhanced with verdict judgment capability that leverages the
 * ReasoningBank to provide historical insights and recommendations.
 *
 * @module learning/services/agent-priming-service
 */

import { createLogger } from '../../utils/index.js';
import {
  type ExtractedMemory,
  type TaskSummary,
  type PrimingContext,
  type MemoryStore,
  type VectorStore,
  type TaskResult,
  MemoryType,
} from '../types.js';
import {
  type ReasoningBankAdapter,
  type Verdict,
} from '../../integrations/agentic-flow/adapters/reasoning-bank-adapter.js';

const logger = createLogger('agent-priming');

/**
 * Task interface for priming (minimal required fields)
 */
export interface TaskForPriming {
  /** Task identifier */
  id: string;
  /** Task description */
  description: string;
  /** Expected agent type */
  agentType?: string;
  /** Task tags */
  tags?: string[];
  /** Task priority */
  priority?: 'low' | 'medium' | 'high' | 'critical';
  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Configuration for agent priming
 */
export interface AgentPrimingConfig {
  /** Maximum memories to include */
  maxMemories: number;
  /** Maximum similar tasks to include */
  maxSimilarTasks: number;
  /** Similarity threshold (0-1) */
  similarityThreshold: number;
  /** Include warnings from failed tasks */
  includeWarnings: boolean;
  /** Maximum warnings to include */
  maxWarnings: number;
  /** Default tools by agent type */
  defaultToolsByType: Record<string, string[]>;
}

const DEFAULT_CONFIG: AgentPrimingConfig = {
  maxMemories: 10,
  maxSimilarTasks: 5,
  similarityThreshold: 0.7,
  includeWarnings: true,
  maxWarnings: 5,
  defaultToolsByType: {
    researcher: ['search', 'analyze', 'summarize'],
    coder: ['edit', 'read', 'bash', 'test'],
    tester: ['test', 'read', 'bash'],
    analyst: ['analyze', 'query', 'visualize'],
    architect: ['design', 'diagram', 'document'],
    reviewer: ['read', 'comment', 'suggest'],
    coordinator: ['orchestrate', 'delegate', 'monitor'],
    optimizer: ['profile', 'benchmark', 'optimize'],
    documenter: ['write', 'format', 'link'],
  },
};

/**
 * In-memory task history store
 */
class TaskHistoryStore {
  private tasks: Map<string, TaskSummary> = new Map();
  private byAgent: Map<string, string[]> = new Map();
  private byTags: Map<string, Set<string>> = new Map();

  add(summary: TaskSummary): void {
    this.tasks.set(summary.taskId, summary);

    // Index by agent type
    if (!this.byAgent.has(summary.agentType)) {
      this.byAgent.set(summary.agentType, []);
    }
    this.byAgent.get(summary.agentType)!.push(summary.taskId);

    // Index by tags
    if (summary.learnings) {
      for (const learning of summary.learnings) {
        const tag = learning.toLowerCase().split(' ')[0];
        if (!this.byTags.has(tag)) {
          this.byTags.set(tag, new Set());
        }
        this.byTags.get(tag)!.add(summary.taskId);
      }
    }
  }

  get(taskId: string): TaskSummary | undefined {
    return this.tasks.get(taskId);
  }

  getByAgentType(agentType: string, limit: number): TaskSummary[] {
    const taskIds = this.byAgent.get(agentType) ?? [];
    return taskIds
      .slice(-limit)
      .map(id => this.tasks.get(id)!)
      .filter(Boolean);
  }

  getAll(): TaskSummary[] {
    return Array.from(this.tasks.values());
  }

  clear(): void {
    this.tasks.clear();
    this.byAgent.clear();
    this.byTags.clear();
  }
}

/**
 * Agent Priming Service
 *
 * Provides context and recommendations to agents before task execution
 * based on historical data and relevant memories.
 *
 * @example
 * ```typescript
 * const priming = new AgentPrimingService(memoryStore, vectorStore);
 * const context = await priming.primeAgent('agent-123', task);
 * console.log(context.recommendedApproach);
 * ```
 */
/**
 * Extended priming context with verdict judgment
 */
export interface PrimingContextWithVerdict extends PrimingContext {
  /** Verdict judgment from ReasoningBank */
  verdict: Verdict | null;
}

/**
 * Task insights from historical data
 */
export interface TaskInsights {
  /** Number of similar tasks found */
  similarTasks: number;
  /** Success rate of similar tasks (0-1) */
  successRate: number;
  /** Average duration in milliseconds */
  avgDuration: number;
  /** Common approaches used in successful tasks */
  commonApproaches: string[];
}

export class AgentPrimingService {
  private config: AgentPrimingConfig;
  private memoryStore: MemoryStore | null;
  private vectorStore: VectorStore | null;
  private reasoningBank: ReasoningBankAdapter | null;
  private taskHistory: TaskHistoryStore;

  constructor(
    memoryStore?: MemoryStore,
    vectorStore?: VectorStore,
    config?: Partial<AgentPrimingConfig>,
    reasoningBank?: ReasoningBankAdapter
  ) {
    this.memoryStore = memoryStore ?? null;
    this.vectorStore = vectorStore ?? null;
    this.reasoningBank = reasoningBank ?? null;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.taskHistory = new TaskHistoryStore();
  }

  /**
   * Set the ReasoningBank adapter for verdict judgment
   */
  setReasoningBank(reasoningBank: ReasoningBankAdapter): void {
    this.reasoningBank = reasoningBank;
  }

  /**
   * Prime an agent with context for a task
   */
  async primeAgent(agentId: string, task: TaskForPriming): Promise<PrimingContext> {
    logger.debug('Priming agent', { agentId, taskId: task.id, description: task.description });

    const startTime = Date.now();

    // 1. Find relevant memories
    const relevantMemories = await this.findRelevantMemories(task);

    // 2. Find similar past tasks
    const similarTasks = await this.findSimilarTasks(task);

    // 3. Generate recommended approach
    const recommendedApproach = this.generateApproach(task, relevantMemories, similarTasks);

    // 4. Extract warnings from past failures
    const warnings = this.extractWarnings(similarTasks);

    // 5. Suggest tools based on task and agent type
    const suggestedTools = this.suggestTools(task);

    // 6. Get recommended patterns
    const recommendedPatterns = this.getRecommendedPatterns(relevantMemories, similarTasks);

    // 7. Estimate duration
    const estimatedDurationMs = this.estimateDuration(similarTasks);

    // 8. Calculate confidence
    const confidence = this.calculateConfidence(relevantMemories, similarTasks);

    const context: PrimingContext = {
      relevantMemories,
      similarTasks,
      recommendedApproach,
      warnings,
      suggestedTools,
      recommendedPatterns,
      estimatedDurationMs,
      confidence,
    };

    logger.info('Agent primed', {
      agentId,
      taskId: task.id,
      memoriesFound: relevantMemories.length,
      similarTasksFound: similarTasks.length,
      warningsCount: warnings.length,
      durationMs: Date.now() - startTime,
    });

    return context;
  }

  /**
   * Record a completed task for future priming
   */
  recordTaskCompletion(result: TaskResult): void {
    const summary: TaskSummary = {
      taskId: result.taskId,
      description: result.description,
      agentType: result.agentType,
      success: result.success,
      qualityScore: result.qualityScore,
      durationMs: result.durationMs,
      learnings: this.extractLearnings(result),
      patterns: this.extractPatterns(result),
      warnings: result.error ? [result.error.message] : undefined,
      timestamp: result.endTime,
    };

    this.taskHistory.add(summary);

    logger.debug('Task recorded for priming', {
      taskId: result.taskId,
      success: result.success,
    });
  }

  /**
   * Find memories relevant to the task
   */
  private async findRelevantMemories(task: TaskForPriming): Promise<ExtractedMemory[]> {
    const memories: ExtractedMemory[] = [];

    if (!this.memoryStore) {
      return memories;
    }

    try {
      // Get procedural memories for similar task types
      if (task.agentType) {
        const procedural = await this.memoryStore.findByTags(
          [task.agentType, 'procedure'],
          Math.floor(this.config.maxMemories / 3)
        );
        memories.push(...procedural);
      }

      // Get technical memories for code-related tasks
      if (task.tags?.some(t => ['code', 'implement', 'fix', 'refactor'].includes(t.toLowerCase()))) {
        const technical = await this.memoryStore.findByType(
          MemoryType.TECHNICAL,
          Math.floor(this.config.maxMemories / 3)
        );
        memories.push(...technical);
      }

      // Get semantic memories for research/analysis tasks
      if (task.tags?.some(t => ['research', 'analyze', 'investigate'].includes(t.toLowerCase()))) {
        const semantic = await this.memoryStore.findByType(
          MemoryType.SEMANTIC,
          Math.floor(this.config.maxMemories / 3)
        );
        memories.push(...semantic);
      }

      // Vector similarity search if available
      if (this.vectorStore && task.context?.embedding) {
        const embedding = task.context.embedding as number[];
        const similar = await this.vectorStore.search(
          embedding,
          this.config.maxMemories,
          this.config.similarityThreshold
        );

        for (const result of similar) {
          const memory = await this.memoryStore.retrieve(result.id);
          if (memory && !memories.find(m => m.id === memory.id)) {
            memories.push(memory);
          }
        }
      }
    } catch (error) {
      logger.warn('Error finding relevant memories', { error });
    }

    // Sort by confidence and limit
    return memories
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, this.config.maxMemories);
  }

  /**
   * Find similar past tasks
   */
  private async findSimilarTasks(task: TaskForPriming): Promise<TaskSummary[]> {
    const similar: TaskSummary[] = [];

    // Get tasks by same agent type
    if (task.agentType) {
      const byType = this.taskHistory.getByAgentType(
        task.agentType,
        this.config.maxSimilarTasks * 2
      );
      similar.push(...byType);
    }

    // Calculate similarity scores
    const scored = similar.map(summary => ({
      summary,
      similarity: this.calculateTaskSimilarity(task, summary),
    }));

    // Filter by threshold and sort
    return scored
      .filter(s => s.similarity >= this.config.similarityThreshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, this.config.maxSimilarTasks)
      .map(s => ({ ...s.summary, similarity: s.similarity }));
  }

  /**
   * Generate recommended approach based on history
   */
  private generateApproach(
    task: TaskForPriming,
    memories: ExtractedMemory[],
    similarTasks: TaskSummary[]
  ): string {
    const parts: string[] = [];

    // Add successful patterns from similar tasks
    const successfulTasks = similarTasks.filter(t => t.success);
    if (successfulTasks.length > 0) {
      const patterns = new Set<string>();
      for (const t of successfulTasks) {
        t.patterns?.forEach(p => patterns.add(p));
      }
      if (patterns.size > 0) {
        parts.push(`Recommended patterns: ${Array.from(patterns).slice(0, 3).join(', ')}`);
      }
    }

    // Add procedural knowledge
    const proceduralMemories = memories.filter(m => m.type === MemoryType.PROCEDURAL);
    if (proceduralMemories.length > 0) {
      const topProcedure = proceduralMemories[0];
      parts.push(`Similar procedure: ${topProcedure.content.substring(0, 200)}`);
    }

    // Add agent-specific recommendations
    if (task.agentType) {
      parts.push(this.getAgentTypeRecommendation(task.agentType));
    }

    // Add priority-based recommendations
    if (task.priority === 'critical' || task.priority === 'high') {
      parts.push('High priority: Focus on correctness over speed. Verify all changes.');
    }

    if (parts.length === 0) {
      return 'No specific recommendations. Follow standard procedures.';
    }

    return parts.join('\n\n');
  }

  /**
   * Extract warnings from failed similar tasks
   */
  private extractWarnings(similarTasks: TaskSummary[]): string[] {
    if (!this.config.includeWarnings) {
      return [];
    }

    const warnings: string[] = [];
    const failedTasks = similarTasks.filter(t => !t.success);

    for (const task of failedTasks.slice(0, this.config.maxWarnings)) {
      if (task.warnings && task.warnings.length > 0) {
        warnings.push(...task.warnings.map(w => `Previous failure: ${w}`));
      }
    }

    return warnings.slice(0, this.config.maxWarnings);
  }

  /**
   * Suggest tools based on task type
   */
  private suggestTools(task: TaskForPriming): string[] {
    const tools = new Set<string>();

    // Add default tools for agent type
    if (task.agentType && this.config.defaultToolsByType[task.agentType]) {
      for (const tool of this.config.defaultToolsByType[task.agentType]) {
        tools.add(tool);
      }
    }

    // Add tools based on task tags
    if (task.tags) {
      for (const tag of task.tags) {
        const tagLower = tag.toLowerCase();
        if (tagLower.includes('test')) {
          tools.add('test');
          tools.add('bash');
        }
        if (tagLower.includes('code') || tagLower.includes('implement')) {
          tools.add('edit');
          tools.add('read');
        }
        if (tagLower.includes('analyze') || tagLower.includes('research')) {
          tools.add('search');
          tools.add('analyze');
        }
        if (tagLower.includes('document')) {
          tools.add('write');
          tools.add('format');
        }
      }
    }

    return Array.from(tools);
  }

  /**
   * Get recommended patterns from memories and tasks
   */
  private getRecommendedPatterns(
    memories: ExtractedMemory[],
    similarTasks: TaskSummary[]
  ): string[] {
    const patterns = new Map<string, number>();

    // Count patterns from successful tasks
    for (const task of similarTasks.filter(t => t.success)) {
      for (const pattern of task.patterns ?? []) {
        patterns.set(pattern, (patterns.get(pattern) ?? 0) + 1);
      }
    }

    // Count patterns from technical memories
    for (const memory of memories.filter(m => m.type === MemoryType.TECHNICAL)) {
      const patternType = memory.metadata.patternType as string | undefined;
      if (patternType) {
        patterns.set(patternType, (patterns.get(patternType) ?? 0) + 1);
      }
    }

    // Sort by frequency and return top patterns
    return Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern]) => pattern);
  }

  /**
   * Estimate task duration based on similar tasks
   */
  private estimateDuration(similarTasks: TaskSummary[]): number | undefined {
    const successfulTasks = similarTasks.filter(t => t.success);
    if (successfulTasks.length === 0) {
      return undefined;
    }

    const durations = successfulTasks.map(t => t.durationMs);
    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;

    return Math.round(avg);
  }

  /**
   * Calculate confidence in priming recommendations
   */
  private calculateConfidence(
    memories: ExtractedMemory[],
    similarTasks: TaskSummary[]
  ): number {
    let confidence = 0.3; // Base confidence

    // More memories = higher confidence
    if (memories.length > 0) {
      confidence += Math.min(memories.length / this.config.maxMemories, 1) * 0.2;
    }

    // More similar tasks = higher confidence
    if (similarTasks.length > 0) {
      confidence += Math.min(similarTasks.length / this.config.maxSimilarTasks, 1) * 0.2;
    }

    // Higher success rate in similar tasks = higher confidence
    if (similarTasks.length > 0) {
      const successRate = similarTasks.filter(t => t.success).length / similarTasks.length;
      confidence += successRate * 0.2;
    }

    // High quality memories boost confidence
    const avgMemoryConfidence = memories.length > 0
      ? memories.reduce((sum, m) => sum + m.confidence, 0) / memories.length
      : 0;
    confidence += avgMemoryConfidence * 0.1;

    return Math.min(confidence, 1);
  }

  /**
   * Calculate similarity between two tasks
   */
  private calculateTaskSimilarity(task: TaskForPriming, summary: TaskSummary): number {
    let similarity = 0;

    // Same agent type is a strong signal
    if (task.agentType === summary.agentType) {
      similarity += 0.4;
    }

    // Description similarity (simple word overlap)
    const taskWords = new Set(task.description.toLowerCase().split(/\s+/));
    const summaryWords = new Set(summary.description.toLowerCase().split(/\s+/));
    const overlap = [...taskWords].filter(w => summaryWords.has(w)).length;
    const maxWords = Math.max(taskWords.size, summaryWords.size);
    if (maxWords > 0) {
      similarity += (overlap / maxWords) * 0.4;
    }

    // Tag overlap
    if (task.tags && summary.learnings) {
      const taskTags = new Set(task.tags.map(t => t.toLowerCase()));
      const summaryTags = new Set(summary.learnings.map(l => l.toLowerCase().split(' ')[0]));
      const tagOverlap = [...taskTags].filter(t => summaryTags.has(t)).length;
      if (taskTags.size > 0) {
        similarity += (tagOverlap / taskTags.size) * 0.2;
      }
    }

    return similarity;
  }

  /**
   * Get agent type specific recommendations
   */
  private getAgentTypeRecommendation(agentType: string): string {
    const recommendations: Record<string, string> = {
      researcher: 'Gather comprehensive information before drawing conclusions. Cite sources.',
      coder: 'Write tests first (TDD). Keep changes focused and atomic.',
      tester: 'Cover edge cases. Test both happy path and error conditions.',
      analyst: 'Use data to support findings. Visualize complex relationships.',
      architect: 'Consider scalability and maintainability. Document decisions.',
      reviewer: 'Focus on correctness, security, and maintainability.',
      coordinator: 'Break down complex tasks. Monitor progress of delegated work.',
      optimizer: 'Measure before and after. Document performance gains.',
      documenter: 'Write for the target audience. Include examples.',
    };

    return recommendations[agentType] ?? 'Follow best practices for your domain.';
  }

  /**
   * Extract learnings from a task result
   */
  private extractLearnings(result: TaskResult): string[] {
    const learnings: string[] = [];

    if (result.success) {
      learnings.push(`Completed ${result.description} successfully`);
    } else {
      learnings.push(`Failed: ${result.error?.message ?? 'Unknown error'}`);
    }

    if (result.steps) {
      const failedSteps = result.steps.filter(s => !s.success);
      for (const step of failedSteps.slice(0, 2)) {
        learnings.push(`Step failed: ${step.action} - ${step.error}`);
      }
    }

    return learnings;
  }

  /**
   * Extract patterns from a task result
   */
  private extractPatterns(result: TaskResult): string[] {
    const patterns: string[] = [];

    if (result.codeChanges) {
      const changeTypes = new Set(result.codeChanges.map(c => c.changeType));
      if (changeTypes.has('create') && result.codeChanges.length > 3) {
        patterns.push('feature-scaffolding');
      }
      if (changeTypes.has('modify') && !changeTypes.has('create')) {
        patterns.push('refactoring');
      }
    }

    if (result.steps) {
      const actions = result.steps.map(s => s.action.toLowerCase());
      if (actions.includes('test') && actions.indexOf('test') === 0) {
        patterns.push('tdd');
      }
    }

    return patterns;
  }

  /**
   * Clear all recorded history
   */
  clearHistory(): void {
    this.taskHistory.clear();
  }

  // ============================================================================
  // Verdict Judgment Methods
  // ============================================================================

  /**
   * Prime agent with verdict judgment from ReasoningBank
   *
   * Extends standard priming with historical verdict judgment
   * that provides insights based on similar past trajectories.
   *
   * @param agentId - ID of the agent to prime
   * @param task - Task to prime for
   * @returns PrimingContext with verdict
   *
   * @example
   * ```typescript
   * const contextWithVerdict = await priming.primeAgentWithVerdict('agent-123', task);
   *
   * if (contextWithVerdict.verdict?.recommendation === 'avoid') {
   *   console.warn('Similar tasks have failed:', contextWithVerdict.verdict.warnings);
   * }
   * ```
   */
  async primeAgentWithVerdict(
    agentId: string,
    task: TaskForPriming
  ): Promise<PrimingContextWithVerdict> {
    // Get standard priming context
    const context = await this.primeAgent(agentId, task);

    // Add verdict if ReasoningBank available
    let verdict: Verdict | null = null;

    if (this.reasoningBank?.isAvailable()) {
      try {
        verdict = await this.reasoningBank.judgeVerdict({
          description: task.description,
          type: task.agentType ?? 'general',
        });

        // Enhance context with verdict insights
        if (verdict.warnings.length > 0) {
          context.warnings.push(...verdict.warnings);
        }

        if (verdict.suggestedApproach) {
          context.recommendedApproach = `${context.recommendedApproach}\n\nBased on historical analysis:\n${verdict.suggestedApproach}`;
        }

        // Log verdict-based warnings for high-risk tasks
        if (verdict.recommendation === 'avoid') {
          logger.warn('Verdict recommends avoiding task', {
            agentId,
            taskId: task.id,
            confidence: verdict.confidence,
            warnings: verdict.warnings,
          });
        } else if (verdict.recommendation === 'caution') {
          logger.info('Verdict recommends caution', {
            agentId,
            taskId: task.id,
            confidence: verdict.confidence,
          });
        }
      } catch (error) {
        logger.warn('Verdict judgment failed', { error });
      }
    }

    return { ...context, verdict };
  }

  /**
   * Get historical insights for a task description
   *
   * Provides aggregated insights from similar past tasks
   * to help inform task planning and estimation.
   *
   * @param taskDescription - Description of the task
   * @returns Task insights including success rate and common approaches
   *
   * @example
   * ```typescript
   * const insights = await priming.getTaskInsights('Implement user authentication');
   *
   * console.log(`Similar tasks: ${insights.similarTasks}`);
   * console.log(`Success rate: ${(insights.successRate * 100).toFixed(1)}%`);
   * console.log(`Avg duration: ${insights.avgDuration}ms`);
   * ```
   */
  async getTaskInsights(taskDescription: string): Promise<TaskInsights> {
    if (!this.reasoningBank?.isAvailable()) {
      return {
        similarTasks: 0,
        successRate: 0,
        avgDuration: 0,
        commonApproaches: [],
      };
    }

    try {
      const similar = await this.reasoningBank.findSimilarTrajectories(taskDescription, 20);

      if (similar.length === 0) {
        return {
          similarTasks: 0,
          successRate: 0,
          avgDuration: 0,
          commonApproaches: [],
        };
      }

      const successes = similar.filter(t => t.outcome === 'success');
      const durations = similar
        .map(t => t.metadata.duration as number)
        .filter(d => typeof d === 'number' && !isNaN(d));

      // Extract common action sequences from successful trajectories
      const approaches = successes
        .map(t => t.steps.map(s => s.action).join(' -> '))
        .slice(0, 3);

      return {
        similarTasks: similar.length,
        successRate: similar.length > 0 ? successes.length / similar.length : 0,
        avgDuration: durations.length > 0
          ? durations.reduce((a, b) => a + b, 0) / durations.length
          : 0,
        commonApproaches: approaches,
      };
    } catch (error) {
      logger.warn('Failed to get task insights', { error });
      return {
        similarTasks: 0,
        successRate: 0,
        avgDuration: 0,
        commonApproaches: [],
      };
    }
  }

  /**
   * Check if verdict judgment is available
   *
   * @returns True if ReasoningBank is configured and available
   */
  hasVerdictCapability(): boolean {
    return this.reasoningBank?.isAvailable() ?? false;
  }
}

/**
 * Create an agent priming service instance
 *
 * @param memoryStore - Optional memory store for retrieving memories
 * @param vectorStore - Optional vector store for similarity search
 * @param config - Optional configuration overrides
 * @param reasoningBank - Optional ReasoningBank for verdict judgment
 */
export function createAgentPrimingService(
  memoryStore?: MemoryStore,
  vectorStore?: VectorStore,
  config?: Partial<AgentPrimingConfig>,
  reasoningBank?: ReasoningBankAdapter
): AgentPrimingService {
  return new AgentPrimingService(memoryStore, vectorStore, config, reasoningBank);
}
