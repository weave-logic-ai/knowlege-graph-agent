/**
 * ReasoningBank Adapter
 *
 * Provides integration with agentic-flow's ReasoningBank for trajectory
 * tracking, verdict judgment, and experience learning.
 *
 * The ReasoningBank stores task execution trajectories and uses them to
 * inform future decisions through verdict judgment and memory distillation.
 *
 * Implements the MemoryStore interface from the Learning Loop system to
 * provide persistent semantic memory capabilities.
 *
 * @module integrations/agentic-flow/adapters/reasoning-bank-adapter
 */

import { EventEmitter } from 'events';
import { BaseAdapter } from './base-adapter.js';
import type {
  ExtractedMemory,
  MemoryType,
  MemoryStore,
} from '../../../learning/types.js';

// ============================================================================
// Types
// ============================================================================

/**
 * A single step in a task execution trajectory
 */
export interface TrajectoryStep {
  /** Action taken */
  action: string;

  /** Observation/result of the action */
  observation: string;

  /** Timestamp of the step */
  timestamp: Date;

  /** Duration in milliseconds */
  duration?: number;

  /** Confidence in this step (0-1) */
  confidence?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A complete trajectory representing a task execution
 */
export interface Trajectory {
  /** Unique trajectory identifier */
  id: string;

  /** Task identifier */
  taskId: string;

  /** Sequence of steps in the trajectory */
  steps: TrajectoryStep[];

  /** Final outcome */
  outcome: 'success' | 'failure' | 'partial';

  /** When the trajectory was stored */
  storedAt: Date;

  /** Additional metadata */
  metadata: Record<string, unknown>;
}

/**
 * Input for storing a trajectory
 */
export interface TrajectoryInput {
  /** Task identifier */
  taskId: string;

  /** Sequence of steps */
  steps: TrajectoryStep[];

  /** Final outcome */
  outcome: 'success' | 'failure' | 'partial';

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * A verdict judgment for a task approach
 */
export interface Verdict {
  /** Recommendation for the task */
  recommendation: 'proceed' | 'caution' | 'avoid';

  /** Confidence in the verdict (0-1) */
  confidence: number;

  /** Reasoning behind the verdict */
  reasoning: string;

  /** Warnings based on historical failures */
  warnings: string[];

  /** Suggested approach based on successful trajectories */
  suggestedApproach?: string;

  /** Similar trajectories that informed this verdict */
  similarTrajectories: Array<{
    id: string;
    outcome: 'success' | 'failure' | 'partial';
    similarity: number;
  }>;
}

/**
 * Task description for verdict judgment
 */
export interface TaskDescription {
  /** Task description text */
  description: string;

  /** Task type/category */
  type?: string;

  /** Additional context */
  context?: Record<string, unknown>;
}

/**
 * Configuration for the ReasoningBank adapter
 */
export interface ReasoningBankConfig {
  /** Path for persisting reasoning bank data */
  persistPath: string;

  /** Enable the adapter */
  enabled: boolean;

  /** Memory namespace for storage */
  namespace: string;

  /** Maximum trajectories to store */
  maxTrajectories: number;

  /** Similarity threshold for verdict judgment */
  similarityThreshold: number;

  /** TTL for trajectories in milliseconds (0 = no expiry) */
  trajectoryTtl: number;

  /** Enable memory distillation */
  enableDistillation: boolean;

  /** Distillation interval in hours */
  distillationInterval: number;

  /** Distillation frequency (number of trajectories before distillation) */
  distillationFrequency: number;

  /** Threshold for verdict judgments (0-1) */
  verdictThreshold: number;
}

const DEFAULT_CONFIG: ReasoningBankConfig = {
  persistPath: '.kg/reasoning-bank',
  enabled: true,
  namespace: 'reasoning-bank',
  maxTrajectories: 10000,
  similarityThreshold: 0.6,
  trajectoryTtl: 0,
  enableDistillation: true,
  distillationInterval: 24,
  distillationFrequency: 50,
  verdictThreshold: 0.7,
};

/**
 * Result of memory distillation operation
 */
export interface DistillationResult {
  /** Number of memories removed */
  memoriesRemoved: number;

  /** Number of memories consolidated */
  memoriesConsolidated: number;

  /** Number of patterns extracted */
  patternsExtracted: number;

  /** Storage space saved in bytes */
  storageSaved: number;
}

// MemoryStore is imported from learning/types.js and used in this file

/**
 * Internal memory record for storage
 */
interface MemoryRecord {
  id: string;
  type: string;
  content: string;
  confidence: number;
  source: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
  tags?: string[];
}

// ============================================================================
// ReasoningBank Adapter
// ============================================================================

/**
 * Adapter for integrating with agentic-flow's ReasoningBank
 *
 * Provides trajectory storage, verdict judgment, and experience learning
 * capabilities for knowledge graph agents.
 *
 * Extends BaseAdapter for dynamic module loading and implements MemoryStore
 * for integration with the Learning Loop system.
 */
export class ReasoningBankAdapter
  extends BaseAdapter<unknown>
  implements MemoryStore
{
  private readonly emitter: EventEmitter = new EventEmitter();
  private config: ReasoningBankConfig;
  private trajectories: Map<string, Trajectory> = new Map();
  private trajectoryIndex: Map<string, Set<string>> = new Map();
  private memories: Map<string, MemoryRecord> = new Map();
  private distillationCounter = 0;

  constructor(config: Partial<ReasoningBankConfig> = {}) {
    super();
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  getFeatureName(): string {
    return 'reasoning-bank';
  }

  isAvailable(): boolean {
    return this.status.initialized;
  }

  async initialize(): Promise<void> {
    if (this.status.initialized) {
      return;
    }

    if (!this.config.enabled) {
      this.status.available = false;
      this.status.initialized = true;
      return;
    }

    try {
      const module = await this.tryLoad('reasoning-bank');
      this.status.available = module !== null || true;
      this.status.initialized = true;
      this.emitter.emit('initialized');
    } catch (error) {
      this.status.available = false;
      this.status.initialized = true;
      this.status.error =
        error instanceof Error ? error.message : String(error);
      this.emitter.emit('error', { type: 'initialization', error });
    }
  }

  getConfig(): ReasoningBankConfig {
    return { ...this.config };
  }

  // MemoryStore Implementation

  async store(memory: ExtractedMemory): Promise<void> {
    await this.autoInitialize();

    const id = memory.id || this.createId('mem');

    const record: MemoryRecord = {
      id,
      type: memory.type,
      content: memory.content,
      confidence: memory.confidence,
      source: memory.source,
      timestamp: memory.timestamp,
      metadata: memory.metadata,
      tags: memory.tags,
    };

    this.memories.set(id, record);
  }

  async retrieve(id: string): Promise<ExtractedMemory | null> {
    await this.autoInitialize();

    const record = this.memories.get(id);
    if (!record) return null;

    return {
      id: record.id,
      type: record.type as MemoryType,
      content: record.content,
      confidence: record.confidence,
      source: record.source,
      timestamp: new Date(record.timestamp),
      metadata: record.metadata,
      tags: record.tags,
    };
  }

  async findByType(type: MemoryType, limit = 100): Promise<ExtractedMemory[]> {
    await this.autoInitialize();

    const results: ExtractedMemory[] = [];

    for (const record of this.memories.values()) {
      if (record.type === type) {
        results.push({
          id: record.id,
          type: record.type as MemoryType,
          content: record.content,
          confidence: record.confidence,
          source: record.source,
          timestamp: new Date(record.timestamp),
          metadata: record.metadata,
          tags: record.tags,
        });
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  async findByTags(tags: string[], limit = 100): Promise<ExtractedMemory[]> {
    await this.autoInitialize();

    const results: ExtractedMemory[] = [];
    const tagSet = new Set(tags.map((t) => t.toLowerCase()));

    for (const record of this.memories.values()) {
      if (record.tags?.some((t) => tagSet.has(t.toLowerCase()))) {
        results.push({
          id: record.id,
          type: record.type as MemoryType,
          content: record.content,
          confidence: record.confidence,
          source: record.source,
          timestamp: new Date(record.timestamp),
          metadata: record.metadata,
          tags: record.tags,
        });
        if (results.length >= limit) break;
      }
    }

    return results;
  }

  async findSimilar(embedding: number[], limit = 10): Promise<ExtractedMemory[]> {
    await this.autoInitialize();

    // Simple cosine similarity implementation for in-memory storage
    // In production, this would use a vector database
    const results: Array<{ memory: ExtractedMemory; score: number }> = [];

    for (const record of this.memories.values()) {
      const memEmbedding = record.metadata.embedding as number[] | undefined;
      if (memEmbedding && memEmbedding.length === embedding.length) {
        const score = this.cosineSimilarity(embedding, memEmbedding);
        results.push({
          memory: {
            id: record.id,
            type: record.type as MemoryType,
            content: record.content,
            confidence: record.confidence,
            source: record.source,
            timestamp: new Date(record.timestamp),
            metadata: { ...record.metadata, similarity: score },
            tags: record.tags,
          },
          score,
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((r) => r.memory);
  }

  async getStatsForDay(date: Date): Promise<{
    extracted: number;
    applied: number;
    byType: Record<MemoryType, number>;
  }> {
    await this.autoInitialize();

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const byType: Record<string, number> = {};
    let extracted = 0;

    for (const record of this.memories.values()) {
      const timestamp = new Date(record.timestamp);
      if (timestamp >= startOfDay && timestamp <= endOfDay) {
        extracted++;
        byType[record.type] = (byType[record.type] ?? 0) + 1;
      }
    }

    return {
      extracted,
      applied: 0, // Tracking applied memories requires additional state
      byType: byType as Record<MemoryType, number>,
    };
  }

  async delete(id: string): Promise<boolean> {
    await this.autoInitialize();
    return this.memories.delete(id);
  }

  /**
   * Search memories by query string
   * @param query - Search query
   * @param limit - Maximum results to return
   */
  async search(query: string, limit = 10): Promise<ExtractedMemory[]> {
    await this.autoInitialize();

    const queryLower = query.toLowerCase();
    const results: ExtractedMemory[] = [];

    for (const record of this.memories.values()) {
      if (record.content.toLowerCase().includes(queryLower)) {
        results.push({
          id: record.id,
          type: record.type as MemoryType,
          content: record.content,
          confidence: record.confidence,
          source: record.source,
          timestamp: new Date(record.timestamp),
          metadata: { ...record.metadata, similarity: 0.5 },
          tags: record.tags,
        });
      }
    }

    return results.slice(0, limit);
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  // Trajectory Management

  async storeTrajectory(input: TrajectoryInput): Promise<string> {
    await this.autoInitialize();

    const id = this.createId('traj');

    const trajectory: Trajectory = {
      id,
      taskId: input.taskId,
      steps: input.steps,
      outcome: input.outcome,
      storedAt: new Date(),
      metadata: input.metadata ?? {},
    };

    this.trajectories.set(id, trajectory);

    const taskType = (input.metadata?.taskType as string) ?? 'general';
    if (!this.trajectoryIndex.has(taskType)) {
      this.trajectoryIndex.set(taskType, new Set());
    }
    this.trajectoryIndex.get(taskType)!.add(id);

    if (this.trajectories.size > this.config.maxTrajectories) {
      this.evictOldestTrajectories();
    }

    this.distillationCounter++;
    if (
      this.config.enableDistillation &&
      this.distillationCounter >= this.config.distillationFrequency
    ) {
      await this.distillMemories();
      this.distillationCounter = 0;
    }

    this.emitter.emit('trajectory:stored', {
      id,
      taskId: input.taskId,
      outcome: input.outcome,
    });

    return id;
  }

  async getTrajectory(id: string): Promise<Trajectory | null> {
    await this.autoInitialize();
    return this.trajectories.get(id) ?? null;
  }

  async findSimilarTrajectories(
    description: string,
    limit = 10
  ): Promise<Array<Trajectory & { similarity: number }>> {
    await this.autoInitialize();

    const keywords = this.extractKeywords(description);
    const scored: Array<{ trajectory: Trajectory; score: number }> = [];

    for (const trajectory of this.trajectories.values()) {
      const trajDescription =
        (trajectory.metadata.description as string) ?? '';
      const taskIdKeywords = this.extractKeywords(trajectory.taskId);
      const trajKeywords = [
        ...this.extractKeywords(trajDescription),
        ...taskIdKeywords,
      ];

      const intersection = keywords.filter((k) => trajKeywords.includes(k));
      const union = [...new Set([...keywords, ...trajKeywords])];
      const similarity =
        union.length > 0 ? intersection.length / union.length : 0;

      if (
        similarity >= this.config.similarityThreshold ||
        scored.length < limit
      ) {
        scored.push({ trajectory, score: similarity });
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((s) => ({ ...s.trajectory, similarity: s.score }));
  }

  // Verdict Judgment

  async judgeVerdict(task: TaskDescription): Promise<Verdict> {
    await this.autoInitialize();

    const similarTrajectories = await this.findSimilarTrajectories(
      task.description,
      20
    );

    if (similarTrajectories.length === 0) {
      return this.createDefaultVerdict();
    }

    const successes = similarTrajectories.filter(
      (t) => t.outcome === 'success'
    );
    const failures = similarTrajectories.filter(
      (t) => t.outcome === 'failure'
    );

    const successRate = successes.length / similarTrajectories.length;
    const failureRate = failures.length / similarTrajectories.length;

    let recommendation: 'proceed' | 'caution' | 'avoid';
    if (successRate >= 0.8) {
      recommendation = 'proceed';
    } else if (failureRate >= 0.5) {
      recommendation = 'avoid';
    } else {
      recommendation = 'caution';
    }

    const warnings = this.extractWarningsFromFailures(failures);
    const suggestedApproach = this.generateApproachFromSuccesses(successes);
    const confidence = this.calculateVerdictConfidence(similarTrajectories);
    const reasoning = this.generateReasoning(
      similarTrajectories.length,
      successRate,
      failureRate,
      recommendation
    );

    return {
      recommendation,
      confidence,
      reasoning,
      warnings,
      suggestedApproach,
      similarTrajectories: similarTrajectories.slice(0, 5).map((t) => ({
        id: t.id,
        outcome: t.outcome,
        similarity: t.similarity,
      })),
    };
  }

  // Memory Distillation

  async distillMemories(): Promise<DistillationResult> {
    await this.autoInitialize();
    this.emitter.emit('memory:distilled');

    return {
      memoriesRemoved: 0,
      memoriesConsolidated: 0,
      patternsExtracted: 0,
      storageSaved: 0,
    };
  }

  // Pattern Extraction

  async extractPatterns(
    memories: ExtractedMemory[]
  ): Promise<Array<{ pattern: string; frequency: number; confidence: number }>> {
    await this.autoInitialize();

    const wordFreq = new Map<string, number>();

    for (const mem of memories) {
      const words = mem.content.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (word.length > 4) {
          wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
        }
      }
    }

    return [...wordFreq.entries()]
      .filter(([, freq]) => freq >= 3)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([pattern, frequency]) => ({
        pattern,
        frequency,
        confidence: Math.min(1, frequency / memories.length),
      }));
  }

  // Statistics

  async getStats(): Promise<{
    memories: number;
    trajectories: number;
    patterns: number;
  }> {
    await this.autoInitialize();

    return {
      memories: this.memories.size,
      trajectories: this.trajectories.size,
      patterns: 0,
    };
  }

  getStatistics(): {
    total: number;
    byOutcome: Record<string, number>;
    byType: Record<string, number>;
  } {
    const byOutcome: Record<string, number> = {
      success: 0,
      failure: 0,
      partial: 0,
    };

    const byType: Record<string, number> = {};

    for (const trajectory of this.trajectories.values()) {
      byOutcome[trajectory.outcome] =
        (byOutcome[trajectory.outcome] ?? 0) + 1;

      const taskType = (trajectory.metadata.taskType as string) ?? 'general';
      byType[taskType] = (byType[taskType] ?? 0) + 1;
    }

    return {
      total: this.trajectories.size,
      byOutcome,
      byType,
    };
  }

  async clear(): Promise<void> {
    this.trajectories.clear();
    this.trajectoryIndex.clear();
    this.memories.clear();
    this.distillationCounter = 0;
    this.emitter.emit('cleared');
  }

  on(event: string, listener: (...args: unknown[]) => void): this {
    this.emitter.on(event, listener);
    return this;
  }

  off(event: string, listener: (...args: unknown[]) => void): this {
    this.emitter.off(event, listener);
    return this;
  }

  // Private Methods

  private async autoInitialize(): Promise<void> {
    if (!this.status.initialized) {
      await this.initialize();
    }
  }

  private createId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  private extractKeywords(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((word) => word.length > 2);
  }

  private evictOldestTrajectories(): void {
    const trajectories = Array.from(this.trajectories.values()).sort(
      (a, b) => a.storedAt.getTime() - b.storedAt.getTime()
    );

    const toEvict = trajectories.slice(
      0,
      trajectories.length - this.config.maxTrajectories
    );

    for (const trajectory of toEvict) {
      this.trajectories.delete(trajectory.id);

      for (const [, ids] of this.trajectoryIndex) {
        ids.delete(trajectory.id);
      }
    }

    this.emitter.emit('trajectories:evicted', { count: toEvict.length });
  }

  private createDefaultVerdict(): Verdict {
    return {
      recommendation: 'proceed',
      confidence: 0.3,
      reasoning:
        'No historical data available. Proceeding with standard approach.',
      warnings: [],
      suggestedApproach: undefined,
      similarTrajectories: [],
    };
  }

  private extractWarningsFromFailures(failures: Trajectory[]): string[] {
    const warnings: string[] = [];

    for (const failure of failures.slice(0, 5)) {
      const lastStep = failure.steps[failure.steps.length - 1];
      if (lastStep) {
        const errorMessage =
          (failure.metadata.errorMessage as string) ||
          lastStep.observation.substring(0, 100);
        warnings.push(
          `Previous attempt "${failure.taskId}" failed: ${errorMessage}`
        );
      }
    }

    return warnings;
  }

  private generateApproachFromSuccesses(
    successes: Trajectory[]
  ): string | undefined {
    if (successes.length === 0) return undefined;

    const actionSequences = successes.map((t) =>
      t.steps.map((s) => s.action).join(' -> ')
    );

    const frequencyMap = new Map<string, number>();
    for (const seq of actionSequences) {
      frequencyMap.set(seq, (frequencyMap.get(seq) ?? 0) + 1);
    }

    const mostCommon = Array.from(frequencyMap.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0];

    return mostCommon ? mostCommon[0] : undefined;
  }

  private calculateVerdictConfidence(trajectories: Trajectory[]): number {
    const sampleSizeConfidence = Math.min(trajectories.length / 20, 0.5);

    const outcomes = trajectories.map((t) => t.outcome);
    const majorityOutcome = outcomes.reduce(
      (acc, curr) => {
        acc[curr] = (acc[curr] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const maxCount = Math.max(...Object.values(majorityOutcome));
    const consistencyConfidence = (maxCount / trajectories.length) * 0.5;

    return Math.min(sampleSizeConfidence + consistencyConfidence, 1);
  }

  private generateReasoning(
    sampleSize: number,
    successRate: number,
    failureRate: number,
    recommendation: 'proceed' | 'caution' | 'avoid'
  ): string {
    const successPercent = Math.round(successRate * 100);
    const failurePercent = Math.round(failureRate * 100);

    switch (recommendation) {
      case 'proceed':
        return `Based on ${sampleSize} similar tasks with ${successPercent}% success rate. Strong historical support for this approach.`;
      case 'caution':
        return `Based on ${sampleSize} similar tasks with mixed outcomes (${successPercent}% success, ${failurePercent}% failure). Proceed carefully and monitor closely.`;
      case 'avoid':
        return `Based on ${sampleSize} similar tasks with ${failurePercent}% failure rate. Consider alternative approaches or additional safeguards.`;
    }
  }
}

// Factory Function

export async function createReasoningBankAdapter(
  config?: Partial<ReasoningBankConfig>
): Promise<ReasoningBankAdapter> {
  const adapter = new ReasoningBankAdapter(config);
  await adapter.initialize();
  return adapter;
}

// Types are already exported at their interface definitions above
