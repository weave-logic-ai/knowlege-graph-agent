/**
 * Learning Loop Types
 *
 * Type definitions for the 4-Pillar Framework learning loop system.
 * Includes memory extraction, agent priming, task completion,
 * daily logging, and A/B testing types.
 *
 * @module learning/types
 */
/**
 * Types of extractable memory from task execution
 */
export declare enum MemoryType {
    /** Task execution history - what happened */
    EPISODIC = "episodic",
    /** How-to knowledge - procedures and workflows */
    PROCEDURAL = "procedural",
    /** Facts and concepts - semantic knowledge */
    SEMANTIC = "semantic",
    /** Code patterns and solutions */
    TECHNICAL = "technical",
    /** Environmental and contextual information */
    CONTEXT = "context"
}
/**
 * Memory confidence levels
 */
export declare enum MemoryConfidence {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    VERIFIED = "verified"
}
/**
 * Extracted memory from task execution
 */
export interface ExtractedMemory {
    /** Unique memory identifier */
    id: string;
    /** Type of memory */
    type: MemoryType;
    /** Memory content */
    content: string;
    /** Confidence score (0-1) */
    confidence: number;
    /** Source of the memory (task ID, file, etc.) */
    source: string;
    /** When the memory was extracted */
    timestamp: Date;
    /** Additional metadata */
    metadata: Record<string, unknown>;
    /** Tags for categorization */
    tags?: string[];
    /** Related memory IDs */
    relatedMemories?: string[];
    /** Embedding vector for similarity search */
    embedding?: number[];
}
/**
 * Step in a task execution
 */
export interface TaskStep {
    /** Step identifier */
    id: string;
    /** Step description */
    description: string;
    /** Step action type */
    action: string;
    /** Input parameters */
    input?: Record<string, unknown>;
    /** Step output */
    output?: unknown;
    /** Step duration in ms */
    durationMs?: number;
    /** Whether step succeeded */
    success: boolean;
    /** Error message if failed */
    error?: string;
    /** Timestamp */
    timestamp: Date;
}
/**
 * Code change record
 */
export interface CodeChange {
    /** File path */
    filePath: string;
    /** Type of change */
    changeType: 'create' | 'modify' | 'delete' | 'rename';
    /** Lines added */
    linesAdded: number;
    /** Lines removed */
    linesRemoved: number;
    /** Programming language */
    language?: string;
    /** Code pattern identified */
    pattern?: string;
    /** Description of change */
    description?: string;
}
/**
 * Task execution context
 */
export interface TaskContext {
    /** Working directory */
    workingDirectory: string;
    /** Project type */
    projectType?: string;
    /** Active files */
    activeFiles?: string[];
    /** Environment variables */
    environment?: Record<string, string>;
    /** Agent configuration */
    agentConfig?: Record<string, unknown>;
    /** Session ID */
    sessionId?: string;
    /** Parent task ID */
    parentTaskId?: string;
}
/**
 * Complete task result for memory extraction
 */
export interface TaskResult {
    /** Task identifier */
    taskId: string;
    /** Task description */
    description: string;
    /** Agent that executed the task */
    agentId: string;
    /** Agent type */
    agentType: string;
    /** Whether task succeeded */
    success: boolean;
    /** Task output */
    output: string;
    /** Execution steps */
    steps?: TaskStep[];
    /** Code changes made */
    codeChanges?: CodeChange[];
    /** Task context */
    context: TaskContext;
    /** Start timestamp */
    startTime: Date;
    /** End timestamp */
    endTime: Date;
    /** Duration in milliseconds */
    durationMs: number;
    /** Error information if failed */
    error?: {
        code: string;
        message: string;
        stack?: string;
    };
    /** Quality score (0-1) */
    qualityScore?: number;
    /** Token usage */
    tokenUsage?: {
        input: number;
        output: number;
        total: number;
    };
    /** Metadata */
    metadata?: Record<string, unknown>;
}
/**
 * Summary of a past task for priming
 */
export interface TaskSummary {
    /** Task identifier */
    taskId: string;
    /** Task description */
    description: string;
    /** Agent type */
    agentType: string;
    /** Success status */
    success: boolean;
    /** Quality score */
    qualityScore?: number;
    /** Duration in ms */
    durationMs: number;
    /** Key learnings */
    learnings?: string[];
    /** Patterns used */
    patterns?: string[];
    /** Warnings or issues encountered */
    warnings?: string[];
    /** Similarity score to current task (0-1) */
    similarity?: number;
    /** Timestamp */
    timestamp: Date;
}
/**
 * Priming context for an agent before task execution
 */
export interface PrimingContext {
    /** Relevant memories for the task */
    relevantMemories: ExtractedMemory[];
    /** Similar past tasks */
    similarTasks: TaskSummary[];
    /** Recommended approach based on history */
    recommendedApproach: string;
    /** Warnings from past failures */
    warnings: string[];
    /** Suggested tools for the task */
    suggestedTools: string[];
    /** Recommended patterns */
    recommendedPatterns?: string[];
    /** Estimated duration based on history */
    estimatedDurationMs?: number;
    /** Confidence in recommendations (0-1) */
    confidence: number;
}
/**
 * Event emitted when a task completes
 */
export interface TaskCompletionEvent {
    /** Event type */
    eventType: 'task_completed';
    /** Task result */
    result: TaskResult;
    /** Timestamp */
    timestamp: Date;
    /** Session ID */
    sessionId?: string;
    /** Workflow ID if part of workflow */
    workflowId?: string;
}
/**
 * Agent performance entry in daily log
 */
export interface AgentPerformanceEntry {
    /** Agent ID */
    agentId: string;
    /** Agent type */
    agentType: string;
    /** Tasks completed */
    taskCount: number;
    /** Success rate (0-1) */
    successRate: number;
    /** Average duration */
    avgDurationMs: number;
    /** Average quality score */
    avgQualityScore?: number;
    /** Total tokens used */
    totalTokens?: number;
}
/**
 * Daily log entry
 */
export interface DailyLogEntry {
    /** Log date (YYYY-MM-DD) */
    date: string;
    /** Summary of the day */
    summary: string;
    /** Total tasks completed */
    tasksCompleted: number;
    /** Tasks that succeeded */
    tasksSuccessful: number;
    /** Tasks that failed */
    tasksFailed: number;
    /** Top performing agents */
    topAgents: AgentPerformanceEntry[];
    /** Memories extracted during the day */
    memoriesExtracted: number;
    /** Learnings applied from memory */
    learningsApplied: number;
    /** Key insights from the day */
    insights: string[];
    /** Errors encountered */
    errors?: Array<{
        taskId: string;
        error: string;
        timestamp: Date;
    }>;
    /** Average quality score */
    avgQualityScore?: number;
    /** Total tokens used */
    totalTokensUsed?: number;
}
/**
 * Weekly report aggregating daily logs
 */
export interface WeeklyReport {
    /** Week start date */
    weekStart: string;
    /** Week end date */
    weekEnd: string;
    /** Daily logs for the week */
    dailyLogs: DailyLogEntry[];
    /** Week summary */
    summary: string;
    /** Total tasks for the week */
    totalTasks: number;
    /** Overall success rate */
    overallSuccessRate: number;
    /** Top patterns identified */
    topPatterns: string[];
    /** Improvement recommendations */
    recommendations: string[];
    /** Week-over-week comparison */
    comparison?: {
        tasksChange: number;
        successRateChange: number;
        qualityChange: number;
    };
}
/**
 * A/B test variant configuration
 */
export interface ABTestVariant {
    /** Variant identifier */
    id: string;
    /** Variant name */
    name: string;
    /** Variant configuration */
    config: Record<string, unknown>;
    /** Traffic weight (0-1, all variants should sum to 1) */
    weight: number;
}
/**
 * A/B test definition
 */
export interface ABTest {
    /** Test identifier */
    id: string;
    /** Test name */
    name: string;
    /** Test description */
    description: string;
    /** Test variants */
    variants: ABTestVariant[];
    /** Metrics to track */
    metrics: string[];
    /** Test start date */
    startDate: Date;
    /** Test end date (optional) */
    endDate?: Date;
    /** Test status */
    status: 'draft' | 'running' | 'completed' | 'stopped';
    /** Minimum sample size per variant */
    minSampleSize?: number;
    /** Creator */
    createdBy?: string;
    /** Creation timestamp */
    createdAt: Date;
    /** Last update timestamp */
    updatedAt?: Date;
}
/**
 * Metric statistics for A/B test results
 */
export interface MetricStatistics {
    /** Mean value */
    mean: number;
    /** Standard deviation */
    stdDev: number;
    /** Confidence interval (95%) */
    confidence: number;
    /** Minimum value */
    min?: number;
    /** Maximum value */
    max?: number;
    /** Median value */
    median?: number;
}
/**
 * Results for a single variant
 */
export interface VariantResult {
    /** Variant identifier */
    variantId: string;
    /** Sample size */
    sampleSize: number;
    /** Metrics with statistics */
    metrics: Record<string, MetricStatistics>;
    /** Raw data points */
    rawData?: Array<{
        timestamp: Date;
        values: Record<string, number>;
    }>;
}
/**
 * Complete A/B test results
 */
export interface ABTestResult {
    /** Test identifier */
    testId: string;
    /** Results for each variant */
    variantResults: VariantResult[];
    /** Winning variant (if determined) */
    winner?: string;
    /** Statistical significance (p-value) */
    statisticalSignificance: number;
    /** Analysis timestamp */
    analyzedAt: Date;
    /** Additional analysis notes */
    notes?: string;
}
/**
 * Memory store interface for persistence
 */
export interface MemoryStore {
    /** Store a memory */
    store(memory: ExtractedMemory): Promise<void>;
    /** Retrieve a memory by ID */
    retrieve(id: string): Promise<ExtractedMemory | null>;
    /** Search memories by type */
    findByType(type: MemoryType, limit?: number): Promise<ExtractedMemory[]>;
    /** Search memories by tags */
    findByTags(tags: string[], limit?: number): Promise<ExtractedMemory[]>;
    /** Search memories by similarity */
    findSimilar(embedding: number[], limit?: number): Promise<ExtractedMemory[]>;
    /** Get statistics for a date */
    getStatsForDay(date: Date): Promise<{
        extracted: number;
        applied: number;
        byType: Record<MemoryType, number>;
    }>;
    /** Delete a memory */
    delete(id: string): Promise<boolean>;
    /** Clear all memories */
    clear(): Promise<void>;
}
/**
 * Activity store interface for tracking
 */
export interface ActivityStore {
    /** Record an activity */
    record(activity: TaskCompletionEvent): Promise<void>;
    /** Get activities in date range */
    getRange(start: Date, end: Date): Promise<TaskCompletionEvent[]>;
    /** Get activities by agent */
    getByAgent(agentId: string, limit?: number): Promise<TaskCompletionEvent[]>;
    /** Get activity count */
    getCount(start?: Date, end?: Date): Promise<number>;
}
/**
 * Vector store interface for similarity search
 */
export interface VectorStore {
    /** Add vectors */
    add(items: Array<{
        id: string;
        vector: number[];
        metadata?: Record<string, unknown>;
    }>): Promise<void>;
    /** Search similar vectors */
    search(vector: number[], limit?: number, threshold?: number): Promise<Array<{
        id: string;
        score: number;
        metadata?: Record<string, unknown>;
    }>>;
    /** Remove vector */
    remove(id: string): Promise<boolean>;
    /** Clear all vectors */
    clear(): Promise<void>;
}
/**
 * Learning loop configuration
 */
export interface LearningLoopConfig {
    /** Enable automatic memory extraction */
    autoExtract: boolean;
    /** Enable agent priming */
    enablePriming: boolean;
    /** Minimum memories before learning cycle */
    learningThreshold: number;
    /** A/B testing enabled */
    abTestingEnabled: boolean;
    /** Daily log generation enabled */
    dailyLogsEnabled: boolean;
    /** Memory extraction settings */
    memoryExtraction: {
        /** Extract episodic memories */
        extractEpisodic: boolean;
        /** Extract procedural memories */
        extractProcedural: boolean;
        /** Extract semantic memories */
        extractSemantic: boolean;
        /** Extract technical memories */
        extractTechnical: boolean;
        /** Minimum confidence threshold */
        minConfidence: number;
    };
    /** Priming settings */
    priming: {
        /** Maximum memories to include */
        maxMemories: number;
        /** Maximum similar tasks to include */
        maxSimilarTasks: number;
        /** Similarity threshold (0-1) */
        similarityThreshold: number;
    };
    /** Storage configuration */
    storage: {
        /** Memory store type */
        memoryStoreType: 'sqlite' | 'memory' | 'custom';
        /** Vector store type */
        vectorStoreType: 'sqlite' | 'memory' | 'custom';
        /** Database path */
        databasePath?: string;
    };
}
/**
 * Create a unique memory ID
 */
export declare function createMemoryId(): string;
/**
 * Create a unique test ID
 */
export declare function createTestId(): string;
/**
 * Default learning loop configuration
 */
export declare const DEFAULT_LEARNING_CONFIG: LearningLoopConfig;
//# sourceMappingURL=types.d.ts.map