/**
 * Task Completion Consumer
 *
 * Processes task completion events, extracts memories, updates statistics,
 * and triggers learning cycles when thresholds are met.
 *
 * @module learning/services/task-completion-consumer
 */

import { EventEmitter } from 'events';
import { createLogger } from '../../utils/index.js';
import {
  type TaskCompletionEvent,
  type TaskResult,
  type ExtractedMemory,
  type MemoryStore,
  type ActivityStore,
  MemoryType,
} from '../types.js';
import { MemoryExtractionService } from './memory-extraction-service.js';

const logger = createLogger('task-consumer');

/**
 * Task statistics tracking
 */
export interface TaskStatistics {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  totalDurationMs: number;
  totalTokensUsed: number;
  avgQualityScore: number;
  qualityScoreCount: number;
  byAgentType: Record<string, {
    total: number;
    successful: number;
    avgDurationMs: number;
  }>;
  memoriesExtracted: number;
  lastTaskTime: Date | null;
}

/**
 * Configuration for task completion consumer
 */
export interface TaskConsumerConfig {
  /** Number of tasks before triggering learning cycle */
  learningThreshold: number;
  /** Enable automatic learning triggers */
  autoTriggerLearning: boolean;
  /** Store all activities for daily logs */
  storeActivities: boolean;
  /** Maximum activities to keep in memory */
  maxActivitiesInMemory: number;
}

const DEFAULT_CONFIG: TaskConsumerConfig = {
  learningThreshold: 10,
  autoTriggerLearning: true,
  storeActivities: true,
  maxActivitiesInMemory: 1000,
};

/**
 * Events emitted by the consumer
 */
export interface TaskConsumerEvents {
  'memory-extracted': (memories: ExtractedMemory[]) => void;
  'learning-trigger': (data: { reason: string; taskCount: number }) => void;
  'task-processed': (event: TaskCompletionEvent) => void;
  'statistics-updated': (stats: TaskStatistics) => void;
  'error': (error: Error) => void;
}

/**
 * Task Completion Consumer
 *
 * Listens for task completion events and processes them to extract
 * memories and update statistics.
 *
 * @example
 * ```typescript
 * const consumer = new TaskCompletionConsumer(memoryExtraction, memoryStore);
 *
 * consumer.on('learning-trigger', (data) => {
 *   console.log('Learning cycle triggered:', data.reason);
 * });
 *
 * await consumer.processCompletion(event);
 * ```
 */
export class TaskCompletionConsumer extends EventEmitter {
  private memoryExtraction: MemoryExtractionService;
  private memoryStore: MemoryStore | null;
  private activityStore: ActivityStore | null;
  private config: TaskConsumerConfig;
  private statistics: TaskStatistics;
  private recentActivities: TaskCompletionEvent[];
  private tasksSinceLastLearning: number;
  private isProcessing: boolean;
  private processingQueue: TaskCompletionEvent[];

  constructor(
    memoryExtraction: MemoryExtractionService,
    memoryStore?: MemoryStore,
    activityStore?: ActivityStore,
    config?: Partial<TaskConsumerConfig>
  ) {
    super();
    this.memoryExtraction = memoryExtraction;
    this.memoryStore = memoryStore ?? null;
    this.activityStore = activityStore ?? null;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.statistics = this.createEmptyStatistics();
    this.recentActivities = [];
    this.tasksSinceLastLearning = 0;
    this.isProcessing = false;
    this.processingQueue = [];
  }

  /**
   * Process a task completion event
   */
  async processCompletion(event: TaskCompletionEvent): Promise<void> {
    // Add to queue if already processing
    if (this.isProcessing) {
      this.processingQueue.push(event);
      return;
    }

    this.isProcessing = true;

    try {
      await this.processEvent(event);

      // Process any queued events
      while (this.processingQueue.length > 0) {
        const queuedEvent = this.processingQueue.shift()!;
        await this.processEvent(queuedEvent);
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process a single event
   */
  private async processEvent(event: TaskCompletionEvent): Promise<void> {
    logger.debug('Processing task completion', {
      taskId: event.result.taskId,
      success: event.result.success,
    });

    try {
      // 1. Extract memories from completed task
      const memories = await this.memoryExtraction.extractFromTask(event.result);

      // 2. Store memories
      if (this.memoryStore) {
        for (const memory of memories) {
          await this.memoryStore.store(memory);
        }
        this.statistics.memoriesExtracted += memories.length;
      }

      this.emit('memory-extracted', memories);

      // 3. Update task statistics
      this.updateStatistics(event);
      this.emit('statistics-updated', this.getStatistics());

      // 4. Store activity for daily logs
      if (this.config.storeActivities) {
        await this.storeActivity(event);
      }

      // 5. Trigger learning if threshold met
      this.tasksSinceLastLearning++;
      if (this.config.autoTriggerLearning && await this.shouldTriggerLearning()) {
        this.emit('learning-trigger', {
          reason: 'threshold-met',
          taskCount: this.tasksSinceLastLearning,
        });
        this.tasksSinceLastLearning = 0;
      }

      // 6. Emit processed event
      this.emit('task-processed', event);

      logger.info('Task completion processed', {
        taskId: event.result.taskId,
        memoriesExtracted: memories.length,
        totalProcessed: this.statistics.totalTasks,
      });
    } catch (error) {
      logger.error('Error processing task completion', error as Error, {
        taskId: event.result.taskId,
      });
      this.emit('error', error as Error);
    }
  }

  /**
   * Update statistics with a new task result
   */
  private updateStatistics(event: TaskCompletionEvent): void {
    const result = event.result;

    this.statistics.totalTasks++;
    if (result.success) {
      this.statistics.successfulTasks++;
    } else {
      this.statistics.failedTasks++;
    }

    this.statistics.totalDurationMs += result.durationMs;

    if (result.tokenUsage) {
      this.statistics.totalTokensUsed += result.tokenUsage.total;
    }

    if (result.qualityScore !== undefined) {
      const currentTotal = this.statistics.avgQualityScore * this.statistics.qualityScoreCount;
      this.statistics.qualityScoreCount++;
      this.statistics.avgQualityScore = (currentTotal + result.qualityScore) / this.statistics.qualityScoreCount;
    }

    // Update per-agent stats
    const agentType = result.agentType;
    if (!this.statistics.byAgentType[agentType]) {
      this.statistics.byAgentType[agentType] = {
        total: 0,
        successful: 0,
        avgDurationMs: 0,
      };
    }

    const agentStats = this.statistics.byAgentType[agentType];
    const currentAvgDuration = agentStats.avgDurationMs * agentStats.total;
    agentStats.total++;
    if (result.success) {
      agentStats.successful++;
    }
    agentStats.avgDurationMs = (currentAvgDuration + result.durationMs) / agentStats.total;

    this.statistics.lastTaskTime = new Date();
  }

  /**
   * Store activity for daily logs
   */
  private async storeActivity(event: TaskCompletionEvent): Promise<void> {
    // Store in activity store if available
    if (this.activityStore) {
      await this.activityStore.record(event);
    }

    // Keep in memory for quick access
    this.recentActivities.push(event);

    // Trim if over limit
    if (this.recentActivities.length > this.config.maxActivitiesInMemory) {
      this.recentActivities = this.recentActivities.slice(-this.config.maxActivitiesInMemory);
    }
  }

  /**
   * Check if learning cycle should be triggered
   */
  private async shouldTriggerLearning(): Promise<boolean> {
    // Trigger when enough new tasks have been processed
    if (this.tasksSinceLastLearning >= this.config.learningThreshold) {
      return true;
    }

    // Trigger on significant error rate
    if (this.statistics.totalTasks > 10) {
      const errorRate = this.statistics.failedTasks / this.statistics.totalTasks;
      if (errorRate > 0.3) {
        logger.warn('High error rate detected, triggering learning', { errorRate });
        return true;
      }
    }

    return false;
  }

  /**
   * Get current statistics
   */
  getStatistics(): TaskStatistics {
    return { ...this.statistics };
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    if (this.statistics.totalTasks === 0) {
      return 0;
    }
    return this.statistics.successfulTasks / this.statistics.totalTasks;
  }

  /**
   * Get average task duration
   */
  getAverageDuration(): number {
    if (this.statistics.totalTasks === 0) {
      return 0;
    }
    return this.statistics.totalDurationMs / this.statistics.totalTasks;
  }

  /**
   * Get recent activities for a date range
   */
  getActivities(startDate?: Date, endDate?: Date): TaskCompletionEvent[] {
    let activities = [...this.recentActivities];

    if (startDate) {
      activities = activities.filter(a => a.timestamp >= startDate);
    }

    if (endDate) {
      activities = activities.filter(a => a.timestamp <= endDate);
    }

    return activities;
  }

  /**
   * Get activities for today
   */
  getTodayActivities(): TaskCompletionEvent[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.getActivities(today);
  }

  /**
   * Get activities by agent type
   */
  getActivitiesByAgent(agentType: string): TaskCompletionEvent[] {
    return this.recentActivities.filter(a => a.result.agentType === agentType);
  }

  /**
   * Get failed activities
   */
  getFailedActivities(): TaskCompletionEvent[] {
    return this.recentActivities.filter(a => !a.result.success);
  }

  /**
   * Reset statistics
   */
  resetStatistics(): void {
    this.statistics = this.createEmptyStatistics();
    this.tasksSinceLastLearning = 0;
    logger.info('Statistics reset');
  }

  /**
   * Clear all data
   */
  clear(): void {
    this.resetStatistics();
    this.recentActivities = [];
    this.processingQueue = [];
  }

  /**
   * Create empty statistics object
   */
  private createEmptyStatistics(): TaskStatistics {
    return {
      totalTasks: 0,
      successfulTasks: 0,
      failedTasks: 0,
      totalDurationMs: 0,
      totalTokensUsed: 0,
      avgQualityScore: 0,
      qualityScoreCount: 0,
      byAgentType: {},
      memoriesExtracted: 0,
      lastTaskTime: null,
    };
  }

  /**
   * Force trigger learning cycle
   */
  forceLearningTrigger(): void {
    this.emit('learning-trigger', {
      reason: 'manual-trigger',
      taskCount: this.tasksSinceLastLearning,
    });
    this.tasksSinceLastLearning = 0;
  }

  /**
   * Get pending queue size
   */
  getPendingQueueSize(): number {
    return this.processingQueue.length;
  }

  /**
   * Check if consumer is currently processing
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }
}

/**
 * Create a task completion consumer instance
 */
export function createTaskCompletionConsumer(
  memoryExtraction: MemoryExtractionService,
  memoryStore?: MemoryStore,
  activityStore?: ActivityStore,
  config?: Partial<TaskConsumerConfig>
): TaskCompletionConsumer {
  return new TaskCompletionConsumer(memoryExtraction, memoryStore, activityStore, config);
}
