/**
 * Daily Log Generator
 *
 * Generates daily activity logs and weekly reports summarizing
 * task execution, agent performance, and system insights.
 *
 * @module learning/services/daily-log-generator
 */

import { createLogger } from '../../utils/index.js';
import {
  type DailyLogEntry,
  type WeeklyReport,
  type AgentPerformanceEntry,
  type TaskCompletionEvent,
  type ActivityStore,
  type MemoryStore,
  MemoryType,
} from '../types.js';

const logger = createLogger('daily-log');

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

const DEFAULT_CONFIG: DailyLogConfig = {
  maxTopAgents: 5,
  maxInsights: 10,
  includeErrors: true,
  maxErrors: 20,
  minTasksForInsights: 5,
};

/**
 * In-memory activity tracking
 */
class ActivityTracker {
  private activities: TaskCompletionEvent[] = [];
  private byDate: Map<string, TaskCompletionEvent[]> = new Map();

  add(activity: TaskCompletionEvent): void {
    this.activities.push(activity);

    const dateKey = this.getDateKey(activity.timestamp);
    if (!this.byDate.has(dateKey)) {
      this.byDate.set(dateKey, []);
    }
    this.byDate.get(dateKey)!.push(activity);
  }

  getForDate(date: Date): TaskCompletionEvent[] {
    return this.byDate.get(this.getDateKey(date)) ?? [];
  }

  getRange(start: Date, end: Date): TaskCompletionEvent[] {
    const result: TaskCompletionEvent[] = [];
    const current = new Date(start);

    while (current <= end) {
      result.push(...this.getForDate(current));
      current.setDate(current.getDate() + 1);
    }

    return result;
  }

  private getDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  clear(): void {
    this.activities = [];
    this.byDate.clear();
  }
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
export class DailyLogGenerator {
  private activityStore: ActivityStore | null;
  private memoryStore: MemoryStore | null;
  private config: DailyLogConfig;
  private localTracker: ActivityTracker;

  constructor(
    activityStore?: ActivityStore,
    memoryStore?: MemoryStore,
    config?: Partial<DailyLogConfig>
  ) {
    this.activityStore = activityStore ?? null;
    this.memoryStore = memoryStore ?? null;
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.localTracker = new ActivityTracker();
  }

  /**
   * Record an activity for local tracking
   */
  recordActivity(event: TaskCompletionEvent): void {
    this.localTracker.add(event);
  }

  /**
   * Generate daily log for a specific date
   */
  async generateDailyLog(date: Date = new Date()): Promise<DailyLogEntry> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    logger.debug('Generating daily log', { date: startOfDay.toISOString().split('T')[0] });

    // Get activities for the day
    const activities = await this.getActivitiesForRange(startOfDay, endOfDay);

    // Calculate statistics
    const taskStats = this.calculateTaskStats(activities);
    const agentStats = this.calculateAgentStats(activities);
    const memoryStats = await this.getMemoryStats(date);

    // Generate insights
    const insights = this.generateInsights(taskStats, agentStats, activities);

    // Collect errors if enabled
    const errors = this.config.includeErrors
      ? this.collectErrors(activities)
      : undefined;

    const log: DailyLogEntry = {
      date: startOfDay.toISOString().split('T')[0],
      summary: this.generateSummary(taskStats, agentStats),
      tasksCompleted: taskStats.total,
      tasksSuccessful: taskStats.successful,
      tasksFailed: taskStats.failed,
      topAgents: agentStats.topPerformers,
      memoriesExtracted: memoryStats.extracted,
      learningsApplied: memoryStats.applied,
      insights,
      errors,
      avgQualityScore: taskStats.avgQualityScore,
      totalTokensUsed: taskStats.totalTokens,
    };

    logger.info('Daily log generated', {
      date: log.date,
      tasksCompleted: log.tasksCompleted,
      insights: log.insights.length,
    });

    return log;
  }

  /**
   * Generate weekly report
   */
  async generateWeeklyReport(weekEndDate: Date = new Date()): Promise<WeeklyReport> {
    const weekEnd = new Date(weekEndDate);
    weekEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);

    logger.debug('Generating weekly report', {
      start: weekStart.toISOString().split('T')[0],
      end: weekEnd.toISOString().split('T')[0],
    });

    // Generate daily logs for each day
    const dailyLogs: DailyLogEntry[] = [];
    const current = new Date(weekStart);

    while (current <= weekEnd) {
      const log = await this.generateDailyLog(new Date(current));
      dailyLogs.push(log);
      current.setDate(current.getDate() + 1);
    }

    // Aggregate statistics
    const totalTasks = dailyLogs.reduce((sum, log) => sum + log.tasksCompleted, 0);
    const totalSuccessful = dailyLogs.reduce((sum, log) => sum + log.tasksSuccessful, 0);
    const overallSuccessRate = totalTasks > 0 ? totalSuccessful / totalTasks : 0;

    // Identify top patterns
    const topPatterns = this.identifyTopPatterns(dailyLogs);

    // Generate recommendations
    const recommendations = this.generateRecommendations(dailyLogs, overallSuccessRate);

    // Calculate week-over-week comparison (if previous week data available)
    const comparison = await this.calculateWeekComparison(weekStart, totalTasks, overallSuccessRate, dailyLogs);

    const report: WeeklyReport = {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      dailyLogs,
      summary: this.generateWeekSummary(totalTasks, overallSuccessRate, dailyLogs),
      totalTasks,
      overallSuccessRate,
      topPatterns,
      recommendations,
      comparison,
    };

    logger.info('Weekly report generated', {
      weekStart: report.weekStart,
      weekEnd: report.weekEnd,
      totalTasks: report.totalTasks,
      successRate: (report.overallSuccessRate * 100).toFixed(1) + '%',
    });

    return report;
  }

  /**
   * Get activities for a date range
   */
  private async getActivitiesForRange(start: Date, end: Date): Promise<TaskCompletionEvent[]> {
    // Try activity store first
    if (this.activityStore) {
      return this.activityStore.getRange(start, end);
    }

    // Fall back to local tracker
    return this.localTracker.getRange(start, end);
  }

  /**
   * Calculate task statistics
   */
  private calculateTaskStats(activities: TaskCompletionEvent[]): {
    total: number;
    successful: number;
    failed: number;
    avgDurationMs: number;
    avgQualityScore: number;
    totalTokens: number;
  } {
    const total = activities.length;
    const successful = activities.filter(a => a.result.success).length;
    const failed = total - successful;

    const totalDuration = activities.reduce((sum, a) => sum + a.result.durationMs, 0);
    const avgDurationMs = total > 0 ? totalDuration / total : 0;

    const withQuality = activities.filter(a => a.result.qualityScore !== undefined);
    const avgQualityScore = withQuality.length > 0
      ? withQuality.reduce((sum, a) => sum + (a.result.qualityScore ?? 0), 0) / withQuality.length
      : 0;

    const totalTokens = activities.reduce((sum, a) => sum + (a.result.tokenUsage?.total ?? 0), 0);

    return { total, successful, failed, avgDurationMs, avgQualityScore, totalTokens };
  }

  /**
   * Calculate agent performance statistics
   */
  private calculateAgentStats(activities: TaskCompletionEvent[]): {
    topPerformers: AgentPerformanceEntry[];
    byType: Map<string, {
      taskCount: number;
      successCount: number;
      totalDurationMs: number;
      totalQualityScore: number;
      qualityCount: number;
      totalTokens: number;
    }>;
  } {
    const byType = new Map<string, {
      taskCount: number;
      successCount: number;
      totalDurationMs: number;
      totalQualityScore: number;
      qualityCount: number;
      totalTokens: number;
    }>();

    for (const activity of activities) {
      const agentType = activity.result.agentType;

      if (!byType.has(agentType)) {
        byType.set(agentType, {
          taskCount: 0,
          successCount: 0,
          totalDurationMs: 0,
          totalQualityScore: 0,
          qualityCount: 0,
          totalTokens: 0,
        });
      }

      const stats = byType.get(agentType)!;
      stats.taskCount++;
      if (activity.result.success) {
        stats.successCount++;
      }
      stats.totalDurationMs += activity.result.durationMs;

      if (activity.result.qualityScore !== undefined) {
        stats.totalQualityScore += activity.result.qualityScore;
        stats.qualityCount++;
      }

      if (activity.result.tokenUsage) {
        stats.totalTokens += activity.result.tokenUsage.total;
      }
    }

    // Convert to performance entries and sort
    const topPerformers: AgentPerformanceEntry[] = Array.from(byType.entries())
      .map(([agentType, stats]) => ({
        agentId: agentType, // Using type as ID for aggregation
        agentType,
        taskCount: stats.taskCount,
        successRate: stats.taskCount > 0 ? stats.successCount / stats.taskCount : 0,
        avgDurationMs: stats.taskCount > 0 ? stats.totalDurationMs / stats.taskCount : 0,
        avgQualityScore: stats.qualityCount > 0 ? stats.totalQualityScore / stats.qualityCount : undefined,
        totalTokens: stats.totalTokens > 0 ? stats.totalTokens : undefined,
      }))
      .sort((a, b) => {
        // Sort by success rate first, then by task count
        if (b.successRate !== a.successRate) {
          return b.successRate - a.successRate;
        }
        return b.taskCount - a.taskCount;
      })
      .slice(0, this.config.maxTopAgents);

    return { topPerformers, byType };
  }

  /**
   * Get memory statistics for a day
   */
  private async getMemoryStats(date: Date): Promise<{
    extracted: number;
    applied: number;
    byType: Record<MemoryType, number>;
  }> {
    if (this.memoryStore) {
      return this.memoryStore.getStatsForDay(date);
    }

    return {
      extracted: 0,
      applied: 0,
      byType: {} as Record<MemoryType, number>,
    };
  }

  /**
   * Generate insights from the day's data
   */
  private generateInsights(
    taskStats: { total: number; successful: number; failed: number; avgQualityScore: number },
    agentStats: { topPerformers: AgentPerformanceEntry[] },
    activities: TaskCompletionEvent[]
  ): string[] {
    const insights: string[] = [];

    if (taskStats.total < this.config.minTasksForInsights) {
      insights.push(`Low activity day with only ${taskStats.total} tasks.`);
      return insights;
    }

    // Success rate insight
    const successRate = taskStats.total > 0 ? taskStats.successful / taskStats.total : 0;
    if (successRate >= 0.95) {
      insights.push('Excellent success rate: 95%+ of tasks completed successfully.');
    } else if (successRate >= 0.8) {
      insights.push(`Good success rate: ${(successRate * 100).toFixed(1)}% of tasks succeeded.`);
    } else if (successRate < 0.6) {
      insights.push(`Low success rate: Only ${(successRate * 100).toFixed(1)}% of tasks succeeded. Review failures.`);
    }

    // Quality insight
    if (taskStats.avgQualityScore > 0) {
      if (taskStats.avgQualityScore >= 0.9) {
        insights.push('High quality outputs with average score above 90%.');
      } else if (taskStats.avgQualityScore < 0.7) {
        insights.push('Quality improvement needed: Average score below 70%.');
      }
    }

    // Top performer insight
    if (agentStats.topPerformers.length > 0) {
      const top = agentStats.topPerformers[0];
      if (top.successRate >= 0.9 && top.taskCount >= 3) {
        insights.push(`${top.agentType} agents performing exceptionally well (${(top.successRate * 100).toFixed(0)}% success).`);
      }
    }

    // Pattern insights from activities
    const codeChanges = activities.filter(a => a.result.codeChanges && a.result.codeChanges.length > 0);
    if (codeChanges.length > 0) {
      const totalFiles = codeChanges.reduce(
        (sum, a) => sum + (a.result.codeChanges?.length ?? 0),
        0
      );
      insights.push(`Code changes made across ${totalFiles} files in ${codeChanges.length} tasks.`);
    }

    // Error pattern insight
    if (taskStats.failed > 0) {
      const failedActivities = activities.filter(a => !a.result.success);
      const errorTypes = new Map<string, number>();

      for (const activity of failedActivities) {
        const errorCode = activity.result.error?.code ?? 'unknown';
        errorTypes.set(errorCode, (errorTypes.get(errorCode) ?? 0) + 1);
      }

      const topError = [...errorTypes.entries()].sort((a, b) => b[1] - a[1])[0];
      if (topError && topError[1] >= 2) {
        insights.push(`Recurring error pattern: "${topError[0]}" occurred ${topError[1]} times.`);
      }
    }

    // Duration insight
    const avgDuration = activities.reduce((sum, a) => sum + a.result.durationMs, 0) / activities.length;
    if (avgDuration > 60000) {
      insights.push(`Long average task duration: ${(avgDuration / 1000).toFixed(1)}s. Consider optimization.`);
    }

    return insights.slice(0, this.config.maxInsights);
  }

  /**
   * Collect errors from activities
   */
  private collectErrors(activities: TaskCompletionEvent[]): DailyLogEntry['errors'] {
    return activities
      .filter(a => !a.result.success && a.result.error)
      .slice(0, this.config.maxErrors)
      .map(a => ({
        taskId: a.result.taskId,
        error: a.result.error?.message ?? 'Unknown error',
        timestamp: a.timestamp,
      }));
  }

  /**
   * Generate summary text
   */
  private generateSummary(
    taskStats: { total: number; successful: number; failed: number },
    agentStats: { topPerformers: AgentPerformanceEntry[] }
  ): string {
    const successRate = taskStats.total > 0
      ? ((taskStats.successful / taskStats.total) * 100).toFixed(1)
      : '0';

    let summary = `Completed ${taskStats.total} tasks with ${successRate}% success rate.`;

    if (agentStats.topPerformers.length > 0) {
      const topTypes = agentStats.topPerformers
        .slice(0, 3)
        .map(a => a.agentType)
        .join(', ');
      summary += ` Most active agents: ${topTypes}.`;
    }

    if (taskStats.failed > 0) {
      summary += ` ${taskStats.failed} tasks failed.`;
    }

    return summary;
  }

  /**
   * Generate week summary
   */
  private generateWeekSummary(
    totalTasks: number,
    successRate: number,
    dailyLogs: DailyLogEntry[]
  ): string {
    const avgTasksPerDay = (totalTasks / dailyLogs.length).toFixed(1);
    const peakDay = dailyLogs.reduce((max, log) =>
      log.tasksCompleted > max.tasksCompleted ? log : max
    );

    return `Weekly total: ${totalTasks} tasks (avg ${avgTasksPerDay}/day) with ${(successRate * 100).toFixed(1)}% success rate. Peak day: ${peakDay.date} with ${peakDay.tasksCompleted} tasks.`;
  }

  /**
   * Identify top patterns from daily logs
   */
  private identifyTopPatterns(dailyLogs: DailyLogEntry[]): string[] {
    const patterns = new Map<string, number>();

    for (const log of dailyLogs) {
      for (const insight of log.insights) {
        // Extract pattern keywords
        const words = insight.toLowerCase().split(/\s+/);
        for (const word of words) {
          if (word.length > 4 && !['tasks', 'with', 'rate'].includes(word)) {
            patterns.set(word, (patterns.get(word) ?? 0) + 1);
          }
        }
      }
    }

    return Array.from(patterns.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern]) => pattern);
  }

  /**
   * Generate recommendations based on weekly data
   */
  private generateRecommendations(
    dailyLogs: DailyLogEntry[],
    overallSuccessRate: number
  ): string[] {
    const recommendations: string[] = [];

    // Success rate recommendations
    if (overallSuccessRate < 0.8) {
      recommendations.push('Review failing tasks and improve error handling.');
    }

    // Consistency recommendations
    const taskCounts = dailyLogs.map(l => l.tasksCompleted);
    const variance = this.calculateVariance(taskCounts);
    if (variance > 100) {
      recommendations.push('Consider load balancing for more consistent daily task distribution.');
    }

    // Quality recommendations
    const avgQuality = dailyLogs
      .filter(l => l.avgQualityScore !== undefined)
      .reduce((sum, l) => sum + (l.avgQualityScore ?? 0), 0) / dailyLogs.length;

    if (avgQuality < 0.7 && avgQuality > 0) {
      recommendations.push('Focus on improving output quality through better prompts or validation.');
    }

    // Memory utilization
    const totalMemories = dailyLogs.reduce((sum, l) => sum + l.memoriesExtracted, 0);
    const totalLearnings = dailyLogs.reduce((sum, l) => sum + l.learningsApplied, 0);

    if (totalMemories > 0 && totalLearnings / totalMemories < 0.5) {
      recommendations.push('Increase memory utilization by priming agents with relevant past experiences.');
    }

    return recommendations;
  }

  /**
   * Calculate week-over-week comparison
   */
  private async calculateWeekComparison(
    currentWeekStart: Date,
    currentTasks: number,
    currentSuccessRate: number,
    currentLogs: DailyLogEntry[]
  ): Promise<WeeklyReport['comparison'] | undefined> {
    // For a real implementation, this would load previous week data
    // For now, we return undefined as we don't have historical data stored
    return undefined;
  }

  /**
   * Calculate variance of an array
   */
  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Clear local tracking data
   */
  clear(): void {
    this.localTracker.clear();
  }
}

/**
 * Create a daily log generator instance
 */
export function createDailyLogGenerator(
  activityStore?: ActivityStore,
  memoryStore?: MemoryStore,
  config?: Partial<DailyLogConfig>
): DailyLogGenerator {
  return new DailyLogGenerator(activityStore, memoryStore, config);
}
