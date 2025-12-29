/**
 * Learning Loop Orchestrator
 *
 * Coordinates all learning loop components: memory extraction,
 * agent priming, task completion, daily logs, and A/B testing.
 *
 * @module learning/learning-loop
 */
import { EventEmitter } from 'events';
import { type LearningLoopConfig, type TaskResult, type TaskCompletionEvent, type PrimingContext, type DailyLogEntry, type WeeklyReport, type ABTest, type ABTestResult, type MemoryStore, type ActivityStore, type VectorStore } from './types.js';
import { type TaskForPriming } from './services/agent-priming-service.js';
/**
 * Learning loop events
 */
export interface LearningLoopEvents {
    'initialized': () => void;
    'task-completed': (event: TaskCompletionEvent) => void;
    'learning-cycle-started': () => void;
    'learning-cycle-completed': (results: LearningCycleResult) => void;
    'agent-primed': (agentId: string, context: PrimingContext) => void;
    'daily-log-generated': (log: DailyLogEntry) => void;
    'error': (error: Error) => void;
    'shutdown': () => void;
}
/**
 * Results from a learning cycle
 */
export interface LearningCycleResult {
    memoriesConsolidated: number;
    primingDataUpdated: boolean;
    insightsGenerated: number;
    learningsApplied: number;
    duration: number;
    timestamp: Date;
}
/**
 * Learning loop status
 */
export interface LearningLoopStatus {
    initialized: boolean;
    running: boolean;
    totalTasksProcessed: number;
    totalMemoriesExtracted: number;
    learningCyclesCompleted: number;
    lastLearningCycle: Date | null;
    activeABTests: number;
    health: 'healthy' | 'degraded' | 'error';
}
/**
 * Learning Loop Orchestrator
 *
 * Central coordinator for the 4-Pillar Framework learning system.
 * Manages the flow of information between all learning components.
 *
 * @example
 * ```typescript
 * const loop = new LearningLoop({
 *   autoExtract: true,
 *   enablePriming: true,
 *   learningThreshold: 10,
 * });
 *
 * await loop.initialize();
 *
 * // Process task completions
 * loop.onTaskCompleted(taskResult);
 *
 * // Prime an agent
 * const context = await loop.primeAgent('agent-123', task);
 *
 * // Generate daily report
 * const log = await loop.generateDailyLog();
 * ```
 */
export declare class LearningLoop extends EventEmitter {
    private config;
    private memoryExtraction;
    private agentPriming;
    private taskConsumer;
    private dailyLog;
    private abTesting;
    private memoryStore;
    private activityStore;
    private vectorStore;
    private initialized;
    private running;
    private learningCyclesCompleted;
    private lastLearningCycle;
    private learningCycleTimer;
    constructor(config?: Partial<LearningLoopConfig>);
    /**
     * Initialize the learning loop with optional stores
     */
    initialize(memoryStore?: MemoryStore, activityStore?: ActivityStore, vectorStore?: VectorStore): Promise<void>;
    /**
     * Process a completed task
     */
    onTaskCompleted(result: TaskResult): Promise<void>;
    /**
     * Prime an agent before task execution
     */
    primeAgent(agentId: string, task: TaskForPriming): Promise<PrimingContext>;
    /**
     * Run a learning cycle manually
     */
    runLearningCycle(): Promise<LearningCycleResult>;
    /**
     * Generate daily log
     */
    generateDailyLog(date?: Date): Promise<DailyLogEntry>;
    /**
     * Generate weekly report
     */
    generateWeeklyReport(weekEndDate?: Date): Promise<WeeklyReport>;
    /**
     * Create an A/B test
     */
    createABTest(test: Omit<ABTest, 'id' | 'status' | 'createdAt'>): Promise<string>;
    /**
     * Get A/B test results
     */
    getABTestResults(testId: string): Promise<ABTestResult>;
    /**
     * Get current status
     */
    getStatus(): LearningLoopStatus;
    /**
     * Get task statistics
     */
    getTaskStatistics(): import("./services/task-completion-consumer.js").TaskStatistics;
    /**
     * Pause the learning loop
     */
    pause(): void;
    /**
     * Resume the learning loop
     */
    resume(): void;
    /**
     * Shutdown the learning loop
     */
    shutdown(): Promise<void>;
    /**
     * Set up internal event handlers
     */
    private setupEventHandlers;
    /**
     * Set up task consumer event handlers
     */
    private setupTaskConsumerHandlers;
    /**
     * Consolidate memories from recent tasks
     */
    private consolidateMemories;
    /**
     * Update agent priming data
     */
    private updatePrimingData;
    /**
     * Generate insights from recent data
     */
    private generateInsights;
    /**
     * Apply learnings to improve future performance
     */
    private applyLearnings;
    /**
     * Get active test configuration for an agent/task
     */
    private getActiveTestConfig;
}
/**
 * Create a learning loop instance
 */
export declare function createLearningLoop(config?: Partial<LearningLoopConfig>): LearningLoop;
//# sourceMappingURL=learning-loop.d.ts.map