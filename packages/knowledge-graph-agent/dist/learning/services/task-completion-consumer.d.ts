/**
 * Task Completion Consumer
 *
 * Processes task completion events, extracts memories, updates statistics,
 * and triggers learning cycles when thresholds are met.
 *
 * @module learning/services/task-completion-consumer
 */
import { EventEmitter } from 'events';
import { type TaskCompletionEvent, type ExtractedMemory, type MemoryStore, type ActivityStore } from '../types.js';
import { MemoryExtractionService } from './memory-extraction-service.js';
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
/**
 * Events emitted by the consumer
 */
export interface TaskConsumerEvents {
    'memory-extracted': (memories: ExtractedMemory[]) => void;
    'learning-trigger': (data: {
        reason: string;
        taskCount: number;
    }) => void;
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
export declare class TaskCompletionConsumer extends EventEmitter {
    private memoryExtraction;
    private memoryStore;
    private activityStore;
    private config;
    private statistics;
    private recentActivities;
    private tasksSinceLastLearning;
    private isProcessing;
    private processingQueue;
    constructor(memoryExtraction: MemoryExtractionService, memoryStore?: MemoryStore, activityStore?: ActivityStore, config?: Partial<TaskConsumerConfig>);
    /**
     * Process a task completion event
     */
    processCompletion(event: TaskCompletionEvent): Promise<void>;
    /**
     * Process a single event
     */
    private processEvent;
    /**
     * Update statistics with a new task result
     */
    private updateStatistics;
    /**
     * Store activity for daily logs
     */
    private storeActivity;
    /**
     * Check if learning cycle should be triggered
     */
    private shouldTriggerLearning;
    /**
     * Get current statistics
     */
    getStatistics(): TaskStatistics;
    /**
     * Get success rate
     */
    getSuccessRate(): number;
    /**
     * Get average task duration
     */
    getAverageDuration(): number;
    /**
     * Get recent activities for a date range
     */
    getActivities(startDate?: Date, endDate?: Date): TaskCompletionEvent[];
    /**
     * Get activities for today
     */
    getTodayActivities(): TaskCompletionEvent[];
    /**
     * Get activities by agent type
     */
    getActivitiesByAgent(agentType: string): TaskCompletionEvent[];
    /**
     * Get failed activities
     */
    getFailedActivities(): TaskCompletionEvent[];
    /**
     * Reset statistics
     */
    resetStatistics(): void;
    /**
     * Clear all data
     */
    clear(): void;
    /**
     * Create empty statistics object
     */
    private createEmptyStatistics;
    /**
     * Force trigger learning cycle
     */
    forceLearningTrigger(): void;
    /**
     * Get pending queue size
     */
    getPendingQueueSize(): number;
    /**
     * Check if consumer is currently processing
     */
    isCurrentlyProcessing(): boolean;
}
/**
 * Create a task completion consumer instance
 */
export declare function createTaskCompletionConsumer(memoryExtraction: MemoryExtractionService, memoryStore?: MemoryStore, activityStore?: ActivityStore, config?: Partial<TaskConsumerConfig>): TaskCompletionConsumer;
//# sourceMappingURL=task-completion-consumer.d.ts.map