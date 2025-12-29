/**
 * Daily Log Generator
 *
 * Generates daily activity logs and weekly reports summarizing
 * task execution, agent performance, and system insights.
 *
 * @module learning/services/daily-log-generator
 */
import { type DailyLogEntry, type WeeklyReport, type TaskCompletionEvent, type ActivityStore, type MemoryStore } from '../types.js';
/**
 * Configuration for daily log generator
 */
export interface DailyLogConfig {
    /** Maximum top agents to include */
    maxTopAgents: number;
    /** Maximum insights to generate */
    maxInsights: number;
    /** Include error details in logs */
    includeErrors: boolean;
    /** Maximum errors to include */
    maxErrors: number;
    /** Minimum tasks for meaningful insights */
    minTasksForInsights: number;
}
/**
 * Daily Log Generator
 *
 * Creates comprehensive daily logs and weekly reports from
 * task completion data.
 *
 * @example
 * ```typescript
 * const generator = new DailyLogGenerator(activityStore, memoryStore);
 * const log = await generator.generateDailyLog(new Date());
 * console.log(`Tasks completed: ${log.tasksCompleted}`);
 * ```
 */
export declare class DailyLogGenerator {
    private activityStore;
    private memoryStore;
    private config;
    private localTracker;
    constructor(activityStore?: ActivityStore, memoryStore?: MemoryStore, config?: Partial<DailyLogConfig>);
    /**
     * Record an activity for local tracking
     */
    recordActivity(event: TaskCompletionEvent): void;
    /**
     * Generate daily log for a specific date
     */
    generateDailyLog(date?: Date): Promise<DailyLogEntry>;
    /**
     * Generate weekly report
     */
    generateWeeklyReport(weekEndDate?: Date): Promise<WeeklyReport>;
    /**
     * Get activities for a date range
     */
    private getActivitiesForRange;
    /**
     * Calculate task statistics
     */
    private calculateTaskStats;
    /**
     * Calculate agent performance statistics
     */
    private calculateAgentStats;
    /**
     * Get memory statistics for a day
     */
    private getMemoryStats;
    /**
     * Generate insights from the day's data
     */
    private generateInsights;
    /**
     * Collect errors from activities
     */
    private collectErrors;
    /**
     * Generate summary text
     */
    private generateSummary;
    /**
     * Generate week summary
     */
    private generateWeekSummary;
    /**
     * Identify top patterns from daily logs
     */
    private identifyTopPatterns;
    /**
     * Generate recommendations based on weekly data
     */
    private generateRecommendations;
    /**
     * Calculate week-over-week comparison
     */
    private calculateWeekComparison;
    /**
     * Calculate variance of an array
     */
    private calculateVariance;
    /**
     * Clear local tracking data
     */
    clear(): void;
}
/**
 * Create a daily log generator instance
 */
export declare function createDailyLogGenerator(activityStore?: ActivityStore, memoryStore?: MemoryStore, config?: Partial<DailyLogConfig>): DailyLogGenerator;
//# sourceMappingURL=daily-log-generator.d.ts.map