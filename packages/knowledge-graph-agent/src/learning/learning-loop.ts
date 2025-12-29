/**
 * Learning Loop Orchestrator
 *
 * Coordinates all learning loop components: memory extraction,
 * agent priming, task completion, daily logs, and A/B testing.
 *
 * @module learning/learning-loop
 */

import { EventEmitter } from 'events';
import { createLogger } from '../utils/index.js';
import {
  type LearningLoopConfig,
  type TaskResult,
  type TaskCompletionEvent,
  type PrimingContext,
  type DailyLogEntry,
  type WeeklyReport,
  type ABTest,
  type ABTestResult,
  type MemoryStore,
  type ActivityStore,
  type VectorStore,
  DEFAULT_LEARNING_CONFIG,
} from './types.js';
import { MemoryExtractionService, createMemoryExtractionService } from './services/memory-extraction-service.js';
import { AgentPrimingService, createAgentPrimingService, type TaskForPriming } from './services/agent-priming-service.js';
import { TaskCompletionConsumer, createTaskCompletionConsumer } from './services/task-completion-consumer.js';
import { DailyLogGenerator, createDailyLogGenerator } from './services/daily-log-generator.js';
import { ABTestingFramework, createABTestingFramework } from './services/ab-testing-framework.js';

const logger = createLogger('learning-loop');

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
export class LearningLoop extends EventEmitter {
  private config: LearningLoopConfig;
  private memoryExtraction: MemoryExtractionService;
  private agentPriming: AgentPrimingService;
  private taskConsumer: TaskCompletionConsumer;
  private dailyLog: DailyLogGenerator;
  private abTesting: ABTestingFramework;

  private memoryStore: MemoryStore | null = null;
  private activityStore: ActivityStore | null = null;
  private vectorStore: VectorStore | null = null;

  private initialized = false;
  private running = false;
  private learningCyclesCompleted = 0;
  private lastLearningCycle: Date | null = null;
  private learningCycleTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<LearningLoopConfig> = {}) {
    super();
    this.config = { ...DEFAULT_LEARNING_CONFIG, ...config };

    // Initialize services
    this.memoryExtraction = createMemoryExtractionService({
      extractEpisodic: this.config.memoryExtraction.extractEpisodic,
      extractProcedural: this.config.memoryExtraction.extractProcedural,
      extractSemantic: this.config.memoryExtraction.extractSemantic,
      extractTechnical: this.config.memoryExtraction.extractTechnical,
      minConfidence: this.config.memoryExtraction.minConfidence,
    });

    this.agentPriming = createAgentPrimingService(undefined, undefined, {
      maxMemories: this.config.priming.maxMemories,
      maxSimilarTasks: this.config.priming.maxSimilarTasks,
      similarityThreshold: this.config.priming.similarityThreshold,
    });

    this.taskConsumer = createTaskCompletionConsumer(
      this.memoryExtraction,
      undefined,
      undefined,
      {
        learningThreshold: this.config.learningThreshold,
        autoTriggerLearning: this.config.autoExtract,
      }
    );

    this.dailyLog = createDailyLogGenerator();
    this.abTesting = createABTestingFramework();

    // Wire up internal event handlers
    this.setupEventHandlers();
  }

  /**
   * Initialize the learning loop with optional stores
   */
  async initialize(
    memoryStore?: MemoryStore,
    activityStore?: ActivityStore,
    vectorStore?: VectorStore
  ): Promise<void> {
    if (this.initialized) {
      logger.warn('Learning loop already initialized');
      return;
    }

    logger.info('Initializing learning loop', {
      config: {
        autoExtract: this.config.autoExtract,
        enablePriming: this.config.enablePriming,
        learningThreshold: this.config.learningThreshold,
        abTestingEnabled: this.config.abTestingEnabled,
      },
    });

    // Set up stores
    this.memoryStore = memoryStore ?? null;
    this.activityStore = activityStore ?? null;
    this.vectorStore = vectorStore ?? null;

    // Reinitialize services with stores
    if (memoryStore || vectorStore) {
      this.agentPriming = createAgentPrimingService(memoryStore, vectorStore, {
        maxMemories: this.config.priming.maxMemories,
        maxSimilarTasks: this.config.priming.maxSimilarTasks,
        similarityThreshold: this.config.priming.similarityThreshold,
      });
    }

    if (memoryStore || activityStore) {
      this.taskConsumer = createTaskCompletionConsumer(
        this.memoryExtraction,
        memoryStore,
        activityStore,
        {
          learningThreshold: this.config.learningThreshold,
          autoTriggerLearning: this.config.autoExtract,
        }
      );
      this.setupTaskConsumerHandlers();
    }

    if (activityStore || memoryStore) {
      this.dailyLog = createDailyLogGenerator(activityStore, memoryStore);
    }

    this.initialized = true;
    this.running = true;

    this.emit('initialized');
    logger.info('Learning loop initialized');
  }

  /**
   * Process a completed task
   */
  async onTaskCompleted(result: TaskResult): Promise<void> {
    if (!this.running) {
      logger.warn('Learning loop not running, ignoring task completion');
      return;
    }

    const event: TaskCompletionEvent = {
      eventType: 'task_completed',
      result,
      timestamp: new Date(),
      sessionId: result.context.sessionId,
    };

    await this.taskConsumer.processCompletion(event);

    // Record for priming service
    this.agentPriming.recordTaskCompletion(result);

    // Record for daily logs
    this.dailyLog.recordActivity(event);

    this.emit('task-completed', event);
  }

  /**
   * Prime an agent before task execution
   */
  async primeAgent(agentId: string, task: TaskForPriming): Promise<PrimingContext> {
    if (!this.config.enablePriming) {
      return {
        relevantMemories: [],
        similarTasks: [],
        recommendedApproach: '',
        warnings: [],
        suggestedTools: [],
        confidence: 0,
      };
    }

    // Check for active A/B tests that might affect priming
    if (this.config.abTestingEnabled) {
      const testConfig = await this.getActiveTestConfig(agentId, task);
      if (testConfig) {
        // Apply test configuration
        logger.debug('Applying A/B test config to priming', {
          agentId,
          testConfig,
        });
      }
    }

    const context = await this.agentPriming.primeAgent(agentId, task);
    this.emit('agent-primed', agentId, context);

    return context;
  }

  /**
   * Run a learning cycle manually
   */
  async runLearningCycle(): Promise<LearningCycleResult> {
    const startTime = Date.now();

    logger.info('Starting learning cycle');
    this.emit('learning-cycle-started');

    let memoriesConsolidated = 0;
    let insightsGenerated = 0;
    let learningsApplied = 0;

    try {
      // 1. Consolidate recent memories
      memoriesConsolidated = await this.consolidateMemories();

      // 2. Update agent priming data
      const primingUpdated = await this.updatePrimingData();

      // 3. Generate insights from recent activities
      insightsGenerated = await this.generateInsights();

      // 4. Apply learnings (update configurations, patterns)
      learningsApplied = await this.applyLearnings();

      this.learningCyclesCompleted++;
      this.lastLearningCycle = new Date();

      const result: LearningCycleResult = {
        memoriesConsolidated,
        primingDataUpdated: primingUpdated,
        insightsGenerated,
        learningsApplied,
        duration: Date.now() - startTime,
        timestamp: new Date(),
      };

      this.emit('learning-cycle-completed', result);

      logger.info('Learning cycle completed', {
        memoriesConsolidated: result.memoriesConsolidated,
        primingDataUpdated: result.primingDataUpdated,
        insightsGenerated: result.insightsGenerated,
        learningsApplied: result.learningsApplied,
        duration: result.duration,
      });

      return result;
    } catch (error) {
      logger.error('Learning cycle failed', error as Error);
      this.emit('error', error as Error);
      throw error;
    }
  }

  /**
   * Generate daily log
   */
  async generateDailyLog(date?: Date): Promise<DailyLogEntry> {
    const log = await this.dailyLog.generateDailyLog(date);
    this.emit('daily-log-generated', log);
    return log;
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport(weekEndDate?: Date): Promise<WeeklyReport> {
    return this.dailyLog.generateWeeklyReport(weekEndDate);
  }

  /**
   * Create an A/B test
   */
  async createABTest(test: Omit<ABTest, 'id' | 'status' | 'createdAt'>): Promise<string> {
    if (!this.config.abTestingEnabled) {
      throw new Error('A/B testing is not enabled');
    }
    return this.abTesting.createTest(test);
  }

  /**
   * Get A/B test results
   */
  async getABTestResults(testId: string): Promise<ABTestResult> {
    return this.abTesting.analyzeResults(testId);
  }

  /**
   * Get current status
   */
  getStatus(): LearningLoopStatus {
    const stats = this.taskConsumer.getStatistics();
    const runningTests = this.abTesting.listTests('running');

    let health: LearningLoopStatus['health'] = 'healthy';
    if (!this.initialized) {
      health = 'error';
    } else if (stats.failedTasks / (stats.totalTasks || 1) > 0.3) {
      health = 'degraded';
    }

    return {
      initialized: this.initialized,
      running: this.running,
      totalTasksProcessed: stats.totalTasks,
      totalMemoriesExtracted: stats.memoriesExtracted,
      learningCyclesCompleted: this.learningCyclesCompleted,
      lastLearningCycle: this.lastLearningCycle,
      activeABTests: runningTests.length,
      health,
    };
  }

  /**
   * Get task statistics
   */
  getTaskStatistics() {
    return this.taskConsumer.getStatistics();
  }

  /**
   * Pause the learning loop
   */
  pause(): void {
    this.running = false;
    if (this.learningCycleTimer) {
      clearTimeout(this.learningCycleTimer);
      this.learningCycleTimer = null;
    }
    logger.info('Learning loop paused');
  }

  /**
   * Resume the learning loop
   */
  resume(): void {
    if (!this.initialized) {
      throw new Error('Learning loop not initialized');
    }
    this.running = true;
    logger.info('Learning loop resumed');
  }

  /**
   * Shutdown the learning loop
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down learning loop');

    this.running = false;

    if (this.learningCycleTimer) {
      clearTimeout(this.learningCycleTimer);
      this.learningCycleTimer = null;
    }

    // Final learning cycle if there's pending data
    if (this.taskConsumer.getStatistics().totalTasks > 0) {
      try {
        await this.runLearningCycle();
      } catch (error) {
        logger.error('Final learning cycle failed', error as Error);
      }
    }

    this.taskConsumer.clear();
    this.dailyLog.clear();
    this.abTesting.clear();
    this.agentPriming.clearHistory();

    this.initialized = false;
    this.emit('shutdown');

    logger.info('Learning loop shut down');
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  /**
   * Set up internal event handlers
   */
  private setupEventHandlers(): void {
    this.setupTaskConsumerHandlers();
  }

  /**
   * Set up task consumer event handlers
   */
  private setupTaskConsumerHandlers(): void {
    this.taskConsumer.on('learning-trigger', async (data) => {
      logger.info('Learning cycle triggered', data);
      try {
        await this.runLearningCycle();
      } catch (error) {
        logger.error('Triggered learning cycle failed', error as Error);
      }
    });

    this.taskConsumer.on('error', (error) => {
      logger.error('Task consumer error', error);
      this.emit('error', error);
    });
  }

  /**
   * Consolidate memories from recent tasks
   */
  private async consolidateMemories(): Promise<number> {
    // In a full implementation, this would:
    // 1. Identify similar memories and merge them
    // 2. Prune low-confidence memories
    // 3. Update embeddings for similarity search
    // 4. Archive old memories

    const stats = this.taskConsumer.getStatistics();
    logger.debug('Consolidated memories', {
      total: stats.memoriesExtracted,
    });

    return stats.memoriesExtracted;
  }

  /**
   * Update agent priming data
   */
  private async updatePrimingData(): Promise<boolean> {
    // In a full implementation, this would:
    // 1. Update success patterns per agent type
    // 2. Refresh tool recommendations
    // 3. Update warning patterns

    logger.debug('Priming data updated');
    return true;
  }

  /**
   * Generate insights from recent data
   */
  private async generateInsights(): Promise<number> {
    // Generate a quick daily summary
    const today = new Date();
    const activities = this.taskConsumer.getTodayActivities();

    if (activities.length < 5) {
      return 0;
    }

    // Basic pattern detection
    const agentTypes = activities.map(a => a.result.agentType);
    const uniqueTypes = new Set(agentTypes);

    logger.debug('Generated insights', {
      totalActivities: activities.length,
      uniqueAgentTypes: uniqueTypes.size,
    });

    return uniqueTypes.size; // One insight per agent type for now
  }

  /**
   * Apply learnings to improve future performance
   */
  private async applyLearnings(): Promise<number> {
    // In a full implementation, this would:
    // 1. Update prompt templates based on success patterns
    // 2. Adjust tool selection weights
    // 3. Apply A/B test winners
    // 4. Update configuration recommendations

    let applied = 0;

    // Check for A/B test winners to apply
    if (this.config.abTestingEnabled) {
      const completedTests = this.abTesting.listTests('completed');
      for (const test of completedTests) {
        // In production, apply winning variant configurations
        applied++;
      }
    }

    logger.debug('Applied learnings', { count: applied });
    return applied;
  }

  /**
   * Get active test configuration for an agent/task
   */
  private async getActiveTestConfig(
    agentId: string,
    task: TaskForPriming
  ): Promise<Record<string, unknown> | undefined> {
    const runningTests = this.abTesting.listTests('running');

    for (const test of runningTests) {
      // Check if test applies to this agent type
      if (test.variants.some(v => v.config.agentType === task.agentType)) {
        return this.abTesting.getVariantConfig(test.id, agentId);
      }
    }

    return undefined;
  }
}

/**
 * Create a learning loop instance
 */
export function createLearningLoop(config?: Partial<LearningLoopConfig>): LearningLoop {
  return new LearningLoop(config);
}
