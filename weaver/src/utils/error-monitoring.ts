/**
 * Error Monitoring - Track and alert on error patterns
 *
 * Monitors error frequency, identifies spikes, generates reports,
 * and provides alerting capabilities for production monitoring.
 */

import { ErrorCategory } from './error-taxonomy.js';
import { logger } from './logger.js';

/**
 * Error category type for monitoring (lowercase string literals)
 */
export type ErrorCategoryType =
  | 'network'
  | 'rate_limit'
  | 'authentication'
  | 'validation'
  | 'resource'
  | 'service'
  | 'transient'
  | 'configuration'
  | 'permanent'
  | 'unknown';

/**
 * Error event for monitoring
 */
export interface ErrorEvent {
  /** Error category */
  category: ErrorCategoryType;

  /** Error message */
  message: string;

  /** Context where error occurred */
  context: string;

  /** Whether error was recovered */
  recovered: boolean;

  /** Number of retry attempts */
  retryAttempts: number;

  /** Timestamp */
  timestamp: Date;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Error metrics aggregation
 */
export interface ErrorMetrics {
  /** Total error count */
  totalErrors: number;

  /** Errors by category */
  byCategory: Record<ErrorCategoryType, number>;

  /** Recovery rate (0-1) */
  recoveryRate: number;

  /** Average retry attempts */
  avgRetryAttempts: number;

  /** Error rate (errors per minute) */
  errorRate: number;

  /** Time window for metrics */
  timeWindow: string;
}

/**
 * Alert configuration
 */
export interface AlertConfig {
  /** Error rate threshold (errors per minute) */
  errorRateThreshold?: number;

  /** Specific categories to alert on */
  categories?: ErrorCategoryType[];

  /** Minimum recovery rate before alerting */
  minRecoveryRate?: number;

  /** Callback when alert triggered */
  onAlert?: (alert: Alert) => void | Promise<void>;
}

/**
 * Alert event
 */
export interface Alert {
  /** Alert severity */
  severity: 'warning' | 'error' | 'critical';

  /** Alert message */
  message: string;

  /** Metrics that triggered alert */
  metrics: ErrorMetrics;

  /** Timestamp */
  timestamp: Date;
}

/**
 * Error Monitor
 */
export class ErrorMonitor {
  private events: ErrorEvent[] = [];
  private maxEvents = 10000;
  private alertConfig: AlertConfig;
  private metricsInterval?: NodeJS.Timeout;

  constructor(config: AlertConfig = {}) {
    this.alertConfig = {
      errorRateThreshold: 10, // 10 errors per minute
      minRecoveryRate: 0.5, // 50% recovery rate
      ...config,
    };

    // Start periodic metrics collection
    this.startMetricsCollection();
  }

  /**
   * Record an error event
   */
  recordError(event: Omit<ErrorEvent, 'timestamp'>): void {
    const fullEvent: ErrorEvent = {
      ...event,
      timestamp: new Date(),
    };

    this.events.push(fullEvent);

    // Trim old events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Check if alert should be triggered
    this.checkAlerts();

    logger.debug('Error event recorded', {
      category: event.category,
      context: event.context,
      recovered: event.recovered,
    });
  }

  /**
   * Get error metrics for a time window
   */
  getMetrics(windowMs: number = 60000): ErrorMetrics {
    const now = Date.now();
    const cutoff = now - windowMs;

    const recentEvents = this.events.filter(
      (e) => e.timestamp.getTime() >= cutoff
    );

    const byCategory: Record<ErrorCategoryType, number> = {} as any;
    let totalRetryAttempts = 0;
    let recoveredCount = 0;

    for (const event of recentEvents) {
      byCategory[event.category] = (byCategory[event.category] ?? 0) + 1;
      totalRetryAttempts += event.retryAttempts;
      if (event.recovered) {
        recoveredCount++;
      }
    }

    const totalErrors = recentEvents.length;
    const recoveryRate = totalErrors > 0 ? recoveredCount / totalErrors : 1;
    const avgRetryAttempts = totalErrors > 0 ? totalRetryAttempts / totalErrors : 0;
    const errorRate = totalErrors / (windowMs / 60000); // errors per minute

    return {
      totalErrors,
      byCategory,
      recoveryRate,
      avgRetryAttempts,
      errorRate,
      timeWindow: `${windowMs / 1000}s`,
    };
  }

  /**
   * Get metrics by category
   */
  getCategoryMetrics(
    category: ErrorCategoryType,
    windowMs: number = 60000
  ): {
    count: number;
    recoveryRate: number;
    avgRetryAttempts: number;
  } {
    const now = Date.now();
    const cutoff = now - windowMs;

    const categoryEvents = this.events.filter(
      (e) => e.category === category && e.timestamp.getTime() >= cutoff
    );

    const count = categoryEvents.length;
    const recovered = categoryEvents.filter((e) => e.recovered).length;
    const totalRetries = categoryEvents.reduce(
      (sum, e) => sum + e.retryAttempts,
      0
    );

    return {
      count,
      recoveryRate: count > 0 ? recovered / count : 1,
      avgRetryAttempts: count > 0 ? totalRetries / count : 0,
    };
  }

  /**
   * Check if alerts should be triggered
   */
  private checkAlerts(): void {
    const metrics = this.getMetrics();

    // Check error rate threshold
    if (
      this.alertConfig.errorRateThreshold &&
      metrics.errorRate > this.alertConfig.errorRateThreshold
    ) {
      this.triggerAlert({
        severity: 'error',
        message: `Error rate exceeded threshold: ${metrics.errorRate.toFixed(2)} errors/min`,
        metrics,
        timestamp: new Date(),
      });
    }

    // Check recovery rate
    if (
      this.alertConfig.minRecoveryRate &&
      metrics.recoveryRate < this.alertConfig.minRecoveryRate &&
      metrics.totalErrors > 5 // Only alert if meaningful sample size
    ) {
      this.triggerAlert({
        severity: 'warning',
        message: `Recovery rate below threshold: ${(metrics.recoveryRate * 100).toFixed(1)}%`,
        metrics,
        timestamp: new Date(),
      });
    }

    // Check specific categories
    if (this.alertConfig.categories) {
      for (const category of this.alertConfig.categories) {
        const categoryMetrics = this.getCategoryMetrics(category);

        if (categoryMetrics.count > 5 && categoryMetrics.recoveryRate < 0.3) {
          this.triggerAlert({
            severity: 'critical',
            message: `High failure rate for ${category}: ${(categoryMetrics.recoveryRate * 100).toFixed(1)}% recovery`,
            metrics,
            timestamp: new Date(),
          });
        }
      }
    }
  }

  /**
   * Trigger an alert
   */
  private triggerAlert(alert: Alert): void {
    logger.warn('Error monitoring alert triggered', {
      severity: alert.severity,
      message: alert.message,
      errorRate: alert.metrics.errorRate,
      recoveryRate: alert.metrics.recoveryRate,
    });

    if (this.alertConfig.onAlert) {
      const result = this.alertConfig.onAlert(alert);
      if (result instanceof Promise) {
        result.catch((err) => {
          logger.error('Alert callback failed', err);
        });
      }
    }
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    // Collect metrics every minute
    this.metricsInterval = setInterval(() => {
      const metrics = this.getMetrics();

      if (metrics.totalErrors > 0) {
        logger.info('Error monitoring metrics', {
          totalErrors: metrics.totalErrors,
          errorRate: metrics.errorRate.toFixed(2),
          recoveryRate: (metrics.recoveryRate * 100).toFixed(1) + '%',
          avgRetryAttempts: metrics.avgRetryAttempts.toFixed(1),
        });
      }
    }, 60000);
  }

  /**
   * Stop metrics collection
   */
  stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = undefined;
    }
  }

  /**
   * Generate error report
   */
  generateReport(windowMs: number = 3600000): string {
    const metrics = this.getMetrics(windowMs);
    const now = new Date();

    const lines = [
      '='.repeat(60),
      'ERROR MONITORING REPORT',
      '='.repeat(60),
      `Generated: ${now.toISOString()}`,
      `Time Window: ${metrics.timeWindow}`,
      '',
      'SUMMARY',
      '-'.repeat(60),
      `Total Errors: ${metrics.totalErrors}`,
      `Error Rate: ${metrics.errorRate.toFixed(2)} errors/min`,
      `Recovery Rate: ${(metrics.recoveryRate * 100).toFixed(1)}%`,
      `Avg Retry Attempts: ${metrics.avgRetryAttempts.toFixed(1)}`,
      '',
      'ERRORS BY CATEGORY',
      '-'.repeat(60),
    ];

    const categories = Object.entries(metrics.byCategory)
      .sort(([, a], [, b]) => b - a);

    for (const [category, count] of categories) {
      const catMetrics = this.getCategoryMetrics(category as ErrorCategoryType, windowMs);
      lines.push(
        `${category.padEnd(20)} ${count.toString().padStart(5)} errors  ` +
        `(${(catMetrics.recoveryRate * 100).toFixed(1)}% recovered)`
      );
    }

    lines.push('', '='.repeat(60));

    return lines.join('\n');
  }

  /**
   * Get recent errors for debugging
   */
  getRecentErrors(limit: number = 20): ErrorEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Clear all error events
   */
  clear(): void {
    this.events = [];
    logger.info('Error monitoring data cleared');
  }

  /**
   * Export monitoring data
   */
  export(): string {
    return JSON.stringify(
      {
        events: this.events.slice(-1000), // Last 1000 events
        metrics: this.getMetrics(),
        exportDate: new Date().toISOString(),
      },
      null,
      2
    );
  }
}

/**
 * Global error monitor instance
 */
export const errorMonitor = new ErrorMonitor({
  errorRateThreshold: 10,
  minRecoveryRate: 0.5,
  onAlert: async (alert) => {
    // Default alert handler - just log
    logger.warn('Error alert triggered', {
      severity: alert.severity,
      message: alert.message,
    });
  },
});
