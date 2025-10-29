/**
 * Metrics Collector
 * Collects and aggregates service performance metrics
 */

import type { ServiceMetrics } from './types.js';
import { processManager } from './process-manager.js';

/**
 * Metrics collector service
 */
export class MetricsCollector {
  private metricsHistory: Map<string, ServiceMetrics[]> = new Map();
  private readonly maxHistorySize = 1000;

  /**
   * Collect metrics for a service
   */
  async collectMetrics(serviceName: string): Promise<ServiceMetrics> {
    try {
      const metrics = await processManager.getMetrics(serviceName);

      // Store in history
      this.addToHistory(serviceName, metrics);

      return metrics;
    } catch (error) {
      throw new Error(
        `Failed to collect metrics for ${serviceName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get metrics history for a service
   */
  getHistory(serviceName: string, limit?: number): ServiceMetrics[] {
    const history = this.metricsHistory.get(serviceName) || [];

    if (limit && limit > 0) {
      return history.slice(-limit);
    }

    return history;
  }

  /**
   * Get aggregated metrics for a time period
   */
  getAggregatedMetrics(
    serviceName: string,
    duration: string
  ): {
    avg_cpu: number;
    avg_memory_mb: number;
    max_cpu: number;
    max_memory_mb: number;
    min_cpu: number;
    min_memory_mb: number;
    uptime_seconds: number;
    total_restarts: number;
  } {
    const durationMs = this.parseDuration(duration);
    const cutoffTime = Date.now() - durationMs;

    const history = this.metricsHistory.get(serviceName) || [];
    const recentMetrics = history.filter(
      (m) => m.timestamp.getTime() >= cutoffTime
    );

    if (recentMetrics.length === 0) {
      return {
        avg_cpu: 0,
        avg_memory_mb: 0,
        max_cpu: 0,
        max_memory_mb: 0,
        min_cpu: 0,
        min_memory_mb: 0,
        uptime_seconds: 0,
        total_restarts: 0,
      };
    }

    const cpuValues = recentMetrics.map((m) => m.cpu.percent);
    const memoryValues = recentMetrics.map((m) => m.memory.rss_mb);

    const latestMetric = recentMetrics[recentMetrics.length - 1];

    if (!latestMetric) {
      return {
        avg_cpu: 0,
        avg_memory_mb: 0,
        max_cpu: 0,
        max_memory_mb: 0,
        min_cpu: 0,
        min_memory_mb: 0,
        uptime_seconds: 0,
        total_restarts: 0,
      };
    }

    return {
      avg_cpu: this.average(cpuValues),
      avg_memory_mb: this.average(memoryValues),
      max_cpu: Math.max(...cpuValues),
      max_memory_mb: Math.max(...memoryValues),
      min_cpu: Math.min(...cpuValues),
      min_memory_mb: Math.min(...memoryValues),
      uptime_seconds: latestMetric.process.uptime_seconds,
      total_restarts: latestMetric.process.restarts,
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(serviceName: string): string {
    const history = this.metricsHistory.get(serviceName);

    if (!history || history.length === 0) {
      return '';
    }

    const latest = history[history.length - 1];
    if (!latest) {
      return '';
    }

    const lines: string[] = [];

    // CPU metrics
    lines.push(`# HELP weaver_service_cpu_percent Service CPU usage percentage`);
    lines.push(`# TYPE weaver_service_cpu_percent gauge`);
    lines.push(
      `weaver_service_cpu_percent{service="${serviceName}"} ${latest.cpu.percent}`
    );

    // Memory metrics
    lines.push(`# HELP weaver_service_memory_mb Service memory usage in MB`);
    lines.push(`# TYPE weaver_service_memory_mb gauge`);
    lines.push(
      `weaver_service_memory_mb{service="${serviceName}"} ${latest.memory.rss_mb}`
    );

    // Uptime
    lines.push(`# HELP weaver_service_uptime_seconds Service uptime in seconds`);
    lines.push(`# TYPE weaver_service_uptime_seconds counter`);
    lines.push(
      `weaver_service_uptime_seconds{service="${serviceName}"} ${latest.process.uptime_seconds}`
    );

    // Restarts
    lines.push(`# HELP weaver_service_restarts_total Total service restarts`);
    lines.push(`# TYPE weaver_service_restarts_total counter`);
    lines.push(
      `weaver_service_restarts_total{service="${serviceName}"} ${latest.process.restarts}`
    );

    return lines.join('\n') + '\n';
  }

  /**
   * Start continuous metrics collection
   */
  startCollection(
    serviceName: string,
    interval: number = 10000
  ): () => void {
    const intervalId = setInterval(async () => {
      try {
        await this.collectMetrics(serviceName);
      } catch (error) {
        console.error(`Metrics collection failed for ${serviceName}:`, error);
      }
    }, interval);

    return () => clearInterval(intervalId);
  }

  /**
   * Clear metrics history for a service
   */
  clearHistory(serviceName: string): void {
    this.metricsHistory.delete(serviceName);
  }

  /**
   * Clear all metrics history
   */
  clearAllHistory(): void {
    this.metricsHistory.clear();
  }

  /**
   * Add metrics to history with size limit
   */
  private addToHistory(serviceName: string, metrics: ServiceMetrics): void {
    let history = this.metricsHistory.get(serviceName);

    if (!history) {
      history = [];
      this.metricsHistory.set(serviceName, history);
    }

    history.push(metrics);

    // Trim history if too large
    if (history.length > this.maxHistorySize) {
      history.shift();
    }
  }

  /**
   * Parse duration string (e.g., "1h", "24h", "7d")
   */
  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);

    if (!match || !match[1] || !match[2]) {
      throw new Error(
        `Invalid duration format: ${duration}. Use format like "1h", "24h", "7d"`
      );
    }

    const value = parseInt(match[1], 10);
    const unit = match[2] as 's' | 'm' | 'h' | 'd';

    const multipliers: Record<'s' | 'm' | 'h' | 'd', number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * multipliers[unit];
  }

  /**
   * Calculate average of numbers
   */
  private average(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
  }
}

/**
 * Create and export singleton instance
 */
export const metricsCollector = new MetricsCollector();
