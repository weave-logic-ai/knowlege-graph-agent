/**
 * Learning Loop Module
 *
 * Implements the 4-Pillar Framework learning loop with memory extraction,
 * agent priming, task completion tracking, daily logging, and A/B testing.
 *
 * This module provides the foundation for continuous learning and improvement
 * of agent performance through experience.
 *
 * ## Architecture
 *
 * The learning loop consists of 5 key components:
 *
 * 1. **Memory Extraction Service**: Extracts episodic, procedural, semantic,
 *    technical, and context memories from completed tasks.
 *
 * 2. **Agent Priming Service**: Provides agents with relevant context and
 *    recommendations before task execution based on historical data.
 *
 * 3. **Task Completion Consumer**: Processes task completion events, extracts
 *    memories, updates statistics, and triggers learning cycles.
 *
 * 4. **Daily Log Generator**: Creates comprehensive daily activity logs and
 *    weekly reports for monitoring and analysis.
 *
 * 5. **A/B Testing Framework**: Enables experimentation with agent configurations
 *    and prompts through controlled testing.
 *
 * ## Expected Impact
 *
 * - +10-15% task success rate through better priming
 * - +0.15-0.20 quality score improvement
 * - -15% time reduction through learned patterns
 *
 * @module learning
 *
 * @example
 * ```typescript
 * import {
 *   LearningLoop,
 *   createLearningLoop,
 *   MemoryType,
 * } from './learning';
 *
 * // Create and initialize the learning loop
 * const loop = createLearningLoop({
 *   autoExtract: true,
 *   enablePriming: true,
 *   learningThreshold: 10,
 * });
 *
 * await loop.initialize();
 *
 * // Process task completions
 * await loop.onTaskCompleted(taskResult);
 *
 * // Prime an agent before execution
 * const context = await loop.primeAgent('agent-123', {
 *   id: 'task-456',
 *   description: 'Implement user authentication',
 *   agentType: 'coder',
 * });
 *
 * // Generate daily report
 * const log = await loop.generateDailyLog();
 * console.log(`Tasks completed: ${log.tasksCompleted}`);
 *
 * // Create and run A/B tests
 * const testId = await loop.createABTest({
 *   name: 'Prompt Optimization',
 *   description: 'Test different prompt styles',
 *   variants: [
 *     { id: 'control', name: 'Current', config: {}, weight: 0.5 },
 *     { id: 'treatment', name: 'New', config: {}, weight: 0.5 },
 *   ],
 *   metrics: ['success_rate', 'quality_score'],
 *   startDate: new Date(),
 * });
 *
 * // Shutdown gracefully
 * await loop.shutdown();
 * ```
 */

// Types
export {
  // Memory types
  MemoryType,
  MemoryConfidence,
  type ExtractedMemory,

  // Task types
  type TaskStep,
  type CodeChange,
  type TaskContext,
  type TaskResult,
  type TaskSummary,
  type TaskCompletionEvent,

  // Priming types
  type PrimingContext,

  // Daily log types
  type AgentPerformanceEntry,
  type DailyLogEntry,
  type WeeklyReport,

  // A/B testing types
  type ABTestVariant,
  type ABTest,
  type MetricStatistics,
  type VariantResult,
  type ABTestResult,

  // Store interfaces
  type MemoryStore,
  type ActivityStore,
  type VectorStore,

  // Configuration
  type LearningLoopConfig,
  DEFAULT_LEARNING_CONFIG,

  // Utilities
  createMemoryId,
  createTestId,
} from './types.js';

// Services
export {
  MemoryExtractionService,
  createMemoryExtractionService,
  type MemoryExtractionConfig,
} from './services/memory-extraction-service.js';

export {
  AgentPrimingService,
  createAgentPrimingService,
  type AgentPrimingConfig,
  type TaskForPriming,
} from './services/agent-priming-service.js';

export {
  TaskCompletionConsumer,
  createTaskCompletionConsumer,
  type TaskConsumerConfig,
  type TaskConsumerEvents,
} from './services/task-completion-consumer.js';

export {
  DailyLogGenerator,
  createDailyLogGenerator,
  type DailyLogConfig,
} from './services/daily-log-generator.js';

export {
  ABTestingFramework,
  createABTestingFramework,
  type ABTestingConfig,
} from './services/ab-testing-framework.js';

// Main orchestrator
export {
  LearningLoop,
  createLearningLoop,
  type LearningLoopEvents,
  type LearningCycleResult,
  type LearningLoopStatus,
} from './learning-loop.js';
