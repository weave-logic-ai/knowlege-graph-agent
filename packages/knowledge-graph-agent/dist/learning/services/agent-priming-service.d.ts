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
import { type PrimingContext, type MemoryStore, type VectorStore, type TaskResult } from '../types.js';
import { type ReasoningBankAdapter, type Verdict } from '../../integrations/agentic-flow/adapters/reasoning-bank-adapter.js';
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
export declare class AgentPrimingService {
    private config;
    private memoryStore;
    private vectorStore;
    private reasoningBank;
    private taskHistory;
    constructor(memoryStore?: MemoryStore, vectorStore?: VectorStore, config?: Partial<AgentPrimingConfig>, reasoningBank?: ReasoningBankAdapter);
    /**
     * Set the ReasoningBank adapter for verdict judgment
     */
    setReasoningBank(reasoningBank: ReasoningBankAdapter): void;
    /**
     * Prime an agent with context for a task
     */
    primeAgent(agentId: string, task: TaskForPriming): Promise<PrimingContext>;
    /**
     * Record a completed task for future priming
     */
    recordTaskCompletion(result: TaskResult): void;
    /**
     * Find memories relevant to the task
     */
    private findRelevantMemories;
    /**
     * Find similar past tasks
     */
    private findSimilarTasks;
    /**
     * Generate recommended approach based on history
     */
    private generateApproach;
    /**
     * Extract warnings from failed similar tasks
     */
    private extractWarnings;
    /**
     * Suggest tools based on task type
     */
    private suggestTools;
    /**
     * Get recommended patterns from memories and tasks
     */
    private getRecommendedPatterns;
    /**
     * Estimate task duration based on similar tasks
     */
    private estimateDuration;
    /**
     * Calculate confidence in priming recommendations
     */
    private calculateConfidence;
    /**
     * Calculate similarity between two tasks
     */
    private calculateTaskSimilarity;
    /**
     * Get agent type specific recommendations
     */
    private getAgentTypeRecommendation;
    /**
     * Extract learnings from a task result
     */
    private extractLearnings;
    /**
     * Extract patterns from a task result
     */
    private extractPatterns;
    /**
     * Clear all recorded history
     */
    clearHistory(): void;
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
    primeAgentWithVerdict(agentId: string, task: TaskForPriming): Promise<PrimingContextWithVerdict>;
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
    getTaskInsights(taskDescription: string): Promise<TaskInsights>;
    /**
     * Check if verdict judgment is available
     *
     * @returns True if ReasoningBank is configured and available
     */
    hasVerdictCapability(): boolean;
}
/**
 * Create an agent priming service instance
 *
 * @param memoryStore - Optional memory store for retrieving memories
 * @param vectorStore - Optional vector store for similarity search
 * @param config - Optional configuration overrides
 * @param reasoningBank - Optional ReasoningBank for verdict judgment
 */
export declare function createAgentPrimingService(memoryStore?: MemoryStore, vectorStore?: VectorStore, config?: Partial<AgentPrimingConfig>, reasoningBank?: ReasoningBankAdapter): AgentPrimingService;
//# sourceMappingURL=agent-priming-service.d.ts.map