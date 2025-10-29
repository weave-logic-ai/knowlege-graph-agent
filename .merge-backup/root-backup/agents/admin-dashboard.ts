/**
 * Admin Dashboard for Rules Engine
 *
 * Provides programmatic access to rules engine status and management.
 * Can be integrated with REST API, CLI, or used directly.
 *
 * @example
 * ```typescript
 * const dashboard = new RulesAdminDashboard(rulesEngine);
 *
 * // Get overview
 * const overview = dashboard.getOverview();
 * console.log(`Total rules: ${overview.totalRules}`);
 *
 * // Get detailed status
 * const status = dashboard.getDetailedStatus();
 * console.log(JSON.stringify(status, null, 2));
 *
 * // Get performance metrics
 * const metrics = dashboard.getPerformanceMetrics();
 * console.log(`Avg execution time: ${metrics.avgExecutionTimeMs}ms`);
 * ```
 */

import type { RulesEngine } from './rules-engine.js';
import type { RuleExecutionLog, RuleStatistics } from './rules-engine.js';

/**
 * Dashboard overview data
 */
export interface DashboardOverview {
  totalRules: number;
  enabledRules: number;
  disabledRules: number;
  totalExecutions: number;
  successRate: number;
  failureRate: number;
  averageExecutionTime: number;
  recentActivity: {
    last1Hour: number;
    last24Hours: number;
    last7Days: number;
  };
}

/**
 * Detailed rule status
 */
export interface DetailedRuleStatus {
  id: string;
  name: string;
  trigger: string;
  enabled: boolean;
  priority: number;
  statistics: RuleStatistics;
  lastExecution?: {
    timestamp: Date;
    status: string;
    durationMs?: number;
    error?: string;
  };
  recentLogs: RuleExecutionLog[];
}

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  avgExecutionTimeMs: number;
  minExecutionTimeMs: number;
  maxExecutionTimeMs: number;
  p50ExecutionTimeMs: number;
  p95ExecutionTimeMs: number;
  p99ExecutionTimeMs: number;
  executionsPerHour: number;
  slowestRules: Array<{
    ruleId: string;
    ruleName: string;
    avgDurationMs: number;
  }>;
  mostActiveRules: Array<{
    ruleId: string;
    ruleName: string;
    executionCount: number;
  }>;
}

/**
 * Health status
 */
export interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  issues: Array<{
    severity: 'info' | 'warning' | 'error';
    message: string;
    ruleId?: string;
  }>;
  recommendations: string[];
}

/**
 * Admin dashboard for rules engine
 */
export class RulesAdminDashboard {
  private rulesEngine: RulesEngine;

  constructor(rulesEngine: RulesEngine) {
    this.rulesEngine = rulesEngine;
  }

  /**
   * Get dashboard overview
   */
  getOverview(): DashboardOverview {
    const status = this.rulesEngine.getRulesStatus();
    const allStats = this.rulesEngine.getStatistics() as Map<string, RuleStatistics>;

    const totalExecutions = Array.from(allStats.values()).reduce(
      (sum, stats) => sum + stats.totalExecutions,
      0
    );

    const totalSuccess = Array.from(allStats.values()).reduce(
      (sum, stats) => sum + stats.successCount,
      0
    );

    const totalFailures = Array.from(allStats.values()).reduce(
      (sum, stats) => sum + stats.failureCount,
      0
    );

    const successRate = totalExecutions > 0 ? (totalSuccess / totalExecutions) * 100 : 0;
    const failureRate = totalExecutions > 0 ? (totalFailures / totalExecutions) * 100 : 0;

    const avgExecutionTimes = Array.from(allStats.values())
      .filter((stats) => stats.avgDurationMs > 0)
      .map((stats) => stats.avgDurationMs);

    const averageExecutionTime = avgExecutionTimes.length > 0
      ? avgExecutionTimes.reduce((sum, time) => sum + time, 0) / avgExecutionTimes.length
      : 0;

    // Calculate recent activity
    const now = Date.now();
    const allLogs = this.rulesEngine.getExecutionLogs();

    const last1Hour = allLogs.filter(
      (log) => now - log.startedAt.getTime() < 60 * 60 * 1000
    ).length;

    const last24Hours = allLogs.filter(
      (log) => now - log.startedAt.getTime() < 24 * 60 * 60 * 1000
    ).length;

    const last7Days = allLogs.filter(
      (log) => now - log.startedAt.getTime() < 7 * 24 * 60 * 60 * 1000
    ).length;

    return {
      totalRules: status.summary.totalRules,
      enabledRules: status.summary.enabledRules,
      disabledRules: status.summary.totalRules - status.summary.enabledRules,
      totalExecutions,
      successRate,
      failureRate,
      averageExecutionTime,
      recentActivity: {
        last1Hour,
        last24Hours,
        last7Days,
      },
    };
  }

  /**
   * Get detailed status for all rules
   */
  getDetailedStatus(): DetailedRuleStatus[] {
    const status = this.rulesEngine.getRulesStatus();

    return status.rules.map((rule) => {
      const recentLogs = this.rulesEngine.getExecutionLogs({
        ruleId: rule.id,
        limit: 10,
      });

      const lastLog = recentLogs[0];

      return {
        id: rule.id,
        name: rule.name,
        trigger: rule.trigger,
        enabled: rule.enabled,
        priority: rule.priority,
        statistics: rule.statistics,
        lastExecution: lastLog ? {
          timestamp: lastLog.startedAt,
          status: lastLog.status,
          durationMs: lastLog.durationMs,
          error: lastLog.error,
        } : undefined,
        recentLogs,
      };
    });
  }

  /**
   * Get detailed status for a specific rule
   */
  getRuleStatus(ruleId: string): DetailedRuleStatus | undefined {
    const rule = this.rulesEngine.getRule(ruleId);
    if (!rule) return undefined;

    const stats = this.rulesEngine.getStatistics(ruleId);
    const recentLogs = this.rulesEngine.getExecutionLogs({
      ruleId,
      limit: 10,
    });

    const lastLog = recentLogs[0];

    return {
      id: rule.id,
      name: rule.name,
      trigger: rule.trigger,
      enabled: rule.enabled ?? true,
      priority: rule.priority ?? 0,
      statistics: (stats && typeof stats === 'object' && 'totalExecutions' in stats)
        ? stats
        : {
            totalExecutions: 0,
            successCount: 0,
            failureCount: 0,
            skippedCount: 0,
            avgDurationMs: 0,
          },
      lastExecution: lastLog ? {
        timestamp: lastLog.startedAt,
        status: lastLog.status,
        durationMs: lastLog.durationMs,
        error: lastLog.error,
      } : undefined,
      recentLogs,
    };
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): PerformanceMetrics {
    const allLogs = this.rulesEngine.getExecutionLogs();
    const completedLogs = allLogs.filter(
      (log) => log.status === 'success' || log.status === 'failed'
    );

    const durations = completedLogs
      .map((log) => log.durationMs ?? 0)
      .filter((d) => d > 0)
      .sort((a, b) => a - b);

    const avgDuration = durations.length > 0
      ? durations.reduce((sum, d) => sum + d, 0) / durations.length
      : 0;

    const minDuration = durations.length > 0 ? durations[0] ?? 0 : 0;
    const maxDuration = durations.length > 0 ? durations[durations.length - 1] ?? 0 : 0;

    const p50Index = Math.floor(durations.length * 0.5);
    const p95Index = Math.floor(durations.length * 0.95);
    const p99Index = Math.floor(durations.length * 0.99);

    const p50Duration = durations[p50Index] ?? 0;
    const p95Duration = durations[p95Index] ?? 0;
    const p99Duration = durations[p99Index] ?? 0;

    // Calculate executions per hour
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const recentLogs = allLogs.filter((log) => log.startedAt.getTime() > oneHourAgo);
    const executionsPerHour = recentLogs.length;

    // Get slowest rules
    const allStats = this.rulesEngine.getStatistics() as Map<string, RuleStatistics>;
    const slowestRules = Array.from(allStats.entries())
      .map(([ruleId, stats]) => {
        const rule = this.rulesEngine.getRule(ruleId);
        return {
          ruleId,
          ruleName: rule?.name ?? 'Unknown',
          avgDurationMs: stats.avgDurationMs,
        };
      })
      .filter((r) => r.avgDurationMs > 0)
      .sort((a, b) => b.avgDurationMs - a.avgDurationMs)
      .slice(0, 5);

    // Get most active rules
    const mostActiveRules = Array.from(allStats.entries())
      .map(([ruleId, stats]) => {
        const rule = this.rulesEngine.getRule(ruleId);
        return {
          ruleId,
          ruleName: rule?.name ?? 'Unknown',
          executionCount: stats.totalExecutions,
        };
      })
      .filter((r) => r.executionCount > 0)
      .sort((a, b) => b.executionCount - a.executionCount)
      .slice(0, 5);

    return {
      avgExecutionTimeMs: avgDuration,
      minExecutionTimeMs: minDuration,
      maxExecutionTimeMs: maxDuration,
      p50ExecutionTimeMs: p50Duration,
      p95ExecutionTimeMs: p95Duration,
      p99ExecutionTimeMs: p99Duration,
      executionsPerHour,
      slowestRules,
      mostActiveRules,
    };
  }

  /**
   * Get health status
   */
  getHealthStatus(): HealthStatus {
    const overview = this.getOverview();
    const issues: HealthStatus['issues'] = [];
    const recommendations: string[] = [];

    // Check for high failure rate
    if (overview.failureRate > 20) {
      issues.push({
        severity: 'error',
        message: `High failure rate: ${overview.failureRate.toFixed(1)}%`,
      });
      recommendations.push('Review failed rule executions and fix underlying issues');
    } else if (overview.failureRate > 10) {
      issues.push({
        severity: 'warning',
        message: `Elevated failure rate: ${overview.failureRate.toFixed(1)}%`,
      });
    }

    // Check for slow rules
    const metrics = this.getPerformanceMetrics();
    if (metrics.p95ExecutionTimeMs > 2000) {
      issues.push({
        severity: 'warning',
        message: `95th percentile execution time is high: ${metrics.p95ExecutionTimeMs.toFixed(0)}ms`,
      });
      recommendations.push('Optimize slow rules or increase timeout values');
    }

    // Check for disabled rules
    if (overview.disabledRules > 0) {
      issues.push({
        severity: 'info',
        message: `${overview.disabledRules} rules are disabled`,
      });
    }

    // Check for rules with no recent executions
    const allStats = this.rulesEngine.getStatistics() as Map<string, RuleStatistics>;
    const inactiveRules = Array.from(allStats.entries()).filter(([_, stats]) => {
      return stats.lastExecution === undefined ||
        (stats.lastExecution && Date.now() - stats.lastExecution.getTime() > 7 * 24 * 60 * 60 * 1000);
    });

    if (inactiveRules.length > 0) {
      issues.push({
        severity: 'info',
        message: `${inactiveRules.length} rules have not executed in the last 7 days`,
      });
      recommendations.push('Review inactive rules and remove if no longer needed');
    }

    // Determine overall health
    let healthStatus: HealthStatus['status'] = 'healthy';
    if (issues.some((i) => i.severity === 'error')) {
      healthStatus = 'unhealthy';
    } else if (issues.some((i) => i.severity === 'warning')) {
      healthStatus = 'degraded';
    }

    return {
      status: healthStatus,
      issues,
      recommendations,
    };
  }

  /**
   * Export dashboard data as JSON
   */
  exportData(): {
    overview: DashboardOverview;
    rules: DetailedRuleStatus[];
    performance: PerformanceMetrics;
    health: HealthStatus;
    timestamp: string;
  } {
    return {
      overview: this.getOverview(),
      rules: this.getDetailedStatus(),
      performance: this.getPerformanceMetrics(),
      health: this.getHealthStatus(),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get formatted text report (for CLI)
   */
  getTextReport(): string {
    const overview = this.getOverview();
    const health = this.getHealthStatus();
    const performance = this.getPerformanceMetrics();

    let report = '='.repeat(70) + '\n';
    report += '  RULES ENGINE DASHBOARD\n';
    report += '='.repeat(70) + '\n\n';

    // Overview
    report += '📊 OVERVIEW\n';
    report += '-'.repeat(70) + '\n';
    report += `Total Rules:         ${overview.totalRules} (${overview.enabledRules} enabled, ${overview.disabledRules} disabled)\n`;
    report += `Total Executions:    ${overview.totalExecutions}\n`;
    report += `Success Rate:        ${overview.successRate.toFixed(1)}%\n`;
    report += `Failure Rate:        ${overview.failureRate.toFixed(1)}%\n`;
    report += `Avg Execution Time:  ${overview.averageExecutionTime.toFixed(2)}ms\n`;
    report += '\n';

    // Recent Activity
    report += '📈 RECENT ACTIVITY\n';
    report += '-'.repeat(70) + '\n';
    report += `Last 1 Hour:    ${overview.recentActivity.last1Hour} executions\n`;
    report += `Last 24 Hours:  ${overview.recentActivity.last24Hours} executions\n`;
    report += `Last 7 Days:    ${overview.recentActivity.last7Days} executions\n`;
    report += '\n';

    // Performance
    report += '⚡ PERFORMANCE\n';
    report += '-'.repeat(70) + '\n';
    report += `Min:  ${performance.minExecutionTimeMs.toFixed(2)}ms\n`;
    report += `P50:  ${performance.p50ExecutionTimeMs.toFixed(2)}ms\n`;
    report += `P95:  ${performance.p95ExecutionTimeMs.toFixed(2)}ms\n`;
    report += `P99:  ${performance.p99ExecutionTimeMs.toFixed(2)}ms\n`;
    report += `Max:  ${performance.maxExecutionTimeMs.toFixed(2)}ms\n`;
    report += '\n';

    // Health
    const healthEmoji = health.status === 'healthy' ? '✅' : health.status === 'degraded' ? '⚠️' : '❌';
    report += `${healthEmoji} HEALTH: ${health.status.toUpperCase()}\n`;
    report += '-'.repeat(70) + '\n';

    if (health.issues.length > 0) {
      for (const issue of health.issues) {
        const emoji = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : 'ℹ️';
        report += `${emoji} ${issue.message}\n`;
      }
    } else {
      report += '✅ No issues detected\n';
    }

    if (health.recommendations.length > 0) {
      report += '\n💡 RECOMMENDATIONS\n';
      report += '-'.repeat(70) + '\n';
      for (const rec of health.recommendations) {
        report += `• ${rec}\n`;
      }
    }

    report += '\n' + '='.repeat(70) + '\n';

    return report;
  }
}

/**
 * Create admin dashboard instance
 */
export function createRulesAdminDashboard(rulesEngine: RulesEngine): RulesAdminDashboard {
  return new RulesAdminDashboard(rulesEngine);
}
