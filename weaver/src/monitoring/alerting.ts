/**
 * Alerting System
 *
 * Configurable alerting with multiple channels:
 * - Console output
 * - File logging
 * - Webhook notifications
 * - Severity levels
 * - Rate limiting
 * - Alert history
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { logger } from '../utils/logger.js';

/**
 * Alert severity levels
 */
export type AlertSeverity = 'info' | 'warning' | 'critical';

/**
 * Alert channel types
 */
export type AlertChannel = 'console' | 'file' | 'webhook';

/**
 * Alert definition
 */
export interface Alert {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  timestamp: Date;
  source: string;
  metadata?: Record<string, unknown>;
}

/**
 * Alert threshold configuration
 */
export interface AlertThreshold {
  metric: string;
  operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
  value: number;
  severity: AlertSeverity;
  message: string;
}

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  url: string;
  method?: 'POST' | 'PUT';
  headers?: Record<string, string>;
  timeout?: number;
}

/**
 * Alert channel configuration
 */
export interface AlertChannelConfig {
  console?: {
    enabled: boolean;
    minSeverity?: AlertSeverity;
  };
  file?: {
    enabled: boolean;
    path: string;
    minSeverity?: AlertSeverity;
  };
  webhook?: {
    enabled: boolean;
    config: WebhookConfig;
    minSeverity?: AlertSeverity;
  };
}

/**
 * Rate limiter for alerts
 */
class AlertRateLimiter {
  private alertCounts = new Map<string, { count: number; firstSeen: number }>();
  private readonly windowMs = 60000; // 1 minute
  private readonly maxPerWindow = 10;

  shouldAllow(alertKey: string): boolean {
    const now = Date.now();
    const existing = this.alertCounts.get(alertKey);

    if (!existing || now - existing.firstSeen > this.windowMs) {
      // New window
      this.alertCounts.set(alertKey, { count: 1, firstSeen: now });
      return true;
    }

    if (existing.count >= this.maxPerWindow) {
      return false; // Rate limit exceeded
    }

    existing.count++;
    return true;
  }

  reset(): void {
    this.alertCounts.clear();
  }
}

/**
 * Alerting System
 */
export class AlertingSystem {
  private thresholds: AlertThreshold[] = [];
  private channels: AlertChannelConfig;
  private history: Alert[] = [];
  private readonly maxHistory = 1000;
  private rateLimiter = new AlertRateLimiter();
  private readonly alertDir: string;

  constructor(channels: AlertChannelConfig, alertDir?: string) {
    this.channels = channels;
    this.alertDir = alertDir || path.join(process.cwd(), '.weaver', 'alerts');
    this.ensureAlertDir();
  }

  /**
   * Configure alert threshold
   */
  addThreshold(threshold: AlertThreshold): void {
    this.thresholds.push(threshold);
    logger.debug('Alert threshold configured', {
      metric: threshold.metric,
      severity: threshold.severity,
    });
  }

  /**
   * Remove threshold
   */
  removeThreshold(metric: string): void {
    this.thresholds = this.thresholds.filter((t) => t.metric !== metric);
    logger.debug('Alert threshold removed', { metric });
  }

  /**
   * Check metrics against thresholds
   */
  checkThresholds(metrics: Record<string, number>, source: string): void {
    for (const threshold of this.thresholds) {
      const value = metrics[threshold.metric];

      if (value === undefined) continue;

      const triggered = this.evaluateThreshold(threshold, value);

      if (triggered) {
        this.trigger({
          severity: threshold.severity,
          title: `Threshold Exceeded: ${threshold.metric}`,
          message: threshold.message.replace('{{value}}', value.toString()),
          source,
          metadata: { metric: threshold.metric, value, threshold: threshold.value },
        });
      }
    }
  }

  /**
   * Manually trigger an alert
   */
  async trigger(alert: Omit<Alert, 'id' | 'timestamp'>): Promise<void> {
    const fullAlert: Alert = {
      ...alert,
      id: this.generateAlertId(),
      timestamp: new Date(),
    };

    // Check rate limit
    const alertKey = `${alert.source}:${alert.title}`;
    if (!this.rateLimiter.shouldAllow(alertKey)) {
      logger.debug('Alert rate limited', { source: alert.source, title: alert.title });
      return;
    }

    // Add to history
    this.history.push(fullAlert);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }

    // Send to channels
    await this.sendToChannels(fullAlert);

    logger.info('Alert triggered', {
      id: fullAlert.id,
      severity: fullAlert.severity,
      title: fullAlert.title,
      source: fullAlert.source,
    });
  }

  /**
   * Send alert to configured channels
   */
  private async sendToChannels(alert: Alert): Promise<void> {
    const promises: Promise<void>[] = [];

    // Console channel
    if (this.shouldSendToChannel('console', alert.severity)) {
      promises.push(this.sendToConsole(alert));
    }

    // File channel
    if (this.shouldSendToChannel('file', alert.severity)) {
      promises.push(this.sendToFile(alert));
    }

    // Webhook channel
    if (this.shouldSendToChannel('webhook', alert.severity)) {
      promises.push(this.sendToWebhook(alert));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Check if alert should be sent to channel based on severity
   */
  private shouldSendToChannel(channel: AlertChannel, severity: AlertSeverity): boolean {
    const config = this.channels[channel];
    if (!config || !config.enabled) return false;

    const minSeverity = (config as any).minSeverity || 'info';
    const severityLevels: AlertSeverity[] = ['info', 'warning', 'critical'];

    return severityLevels.indexOf(severity) >= severityLevels.indexOf(minSeverity);
  }

  /**
   * Send alert to console
   */
  private async sendToConsole(alert: Alert): Promise<void> {
    const icon = this.getSeverityIcon(alert.severity);
    const color = this.getSeverityColor(alert.severity);

    console.log(
      `\n${color}${icon} ${alert.severity.toUpperCase()}: ${alert.title}\x1b[0m`
    );
    console.log(`   ${alert.message}`);
    console.log(`   Source: ${alert.source} | Time: ${alert.timestamp.toISOString()}`);

    if (alert.metadata && Object.keys(alert.metadata).length > 0) {
      console.log(`   Metadata: ${JSON.stringify(alert.metadata)}`);
    }
  }

  /**
   * Send alert to file
   */
  private async sendToFile(alert: Alert): Promise<void> {
    if (!this.channels.file?.path) return;

    const logFile = this.channels.file.path;
    const logEntry = `${alert.timestamp.toISOString()} [${alert.severity.toUpperCase()}] ${alert.title}: ${alert.message} (source: ${alert.source})\n`;

    try {
      await fs.appendFile(logFile, logEntry, 'utf-8');
    } catch (error) {
      logger.error('Failed to write alert to file', error as Error, { file: logFile });
    }
  }

  /**
   * Send alert to webhook
   */
  private async sendToWebhook(alert: Alert): Promise<void> {
    if (!this.channels.webhook?.config) return;

    const { url, method = 'POST', headers = {}, timeout = 5000 } = this.channels.webhook.config;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(alert),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Webhook returned status ${response.status}`);
      }
    } catch (error) {
      logger.error('Failed to send alert to webhook', error as Error, { url });
    }
  }

  /**
   * Evaluate threshold condition
   */
  private evaluateThreshold(threshold: AlertThreshold, value: number): boolean {
    switch (threshold.operator) {
      case '>':
        return value > threshold.value;
      case '<':
        return value < threshold.value;
      case '>=':
        return value >= threshold.value;
      case '<=':
        return value <= threshold.value;
      case '==':
        return value === threshold.value;
      case '!=':
        return value !== threshold.value;
      default:
        return false;
    }
  }

  /**
   * Get alert history
   */
  getHistory(limit?: number, severity?: AlertSeverity): Alert[] {
    let filtered = this.history;

    if (severity) {
      filtered = filtered.filter((a) => a.severity === severity);
    }

    return limit ? filtered.slice(-limit) : filtered;
  }

  /**
   * Clear alert history
   */
  clearHistory(): void {
    this.history = [];
    this.rateLimiter.reset();
    logger.info('Alert history cleared');
  }

  /**
   * Export alerts to file
   */
  async exportAlerts(format: 'json' | 'csv'): Promise<string> {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const filename = `alerts_${timestamp}.${format}`;
    const filepath = path.join(this.alertDir, filename);

    if (format === 'json') {
      await fs.writeFile(filepath, JSON.stringify(this.history, null, 2), 'utf-8');
    } else {
      // CSV format
      const csvLines = [
        'ID,Timestamp,Severity,Title,Message,Source',
        ...this.history.map(
          (a) =>
            `${a.id},${a.timestamp.toISOString()},${a.severity},"${a.title}","${a.message}",${a.source}`
        ),
      ];
      await fs.writeFile(filepath, csvLines.join('\n'), 'utf-8');
    }

    return filepath;
  }

  /**
   * Get severity icon
   */
  private getSeverityIcon(severity: AlertSeverity): string {
    switch (severity) {
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'critical':
        return '🔥';
      default:
        return '•';
    }
  }

  /**
   * Get severity color (ANSI)
   */
  private getSeverityColor(severity: AlertSeverity): string {
    switch (severity) {
      case 'info':
        return '\x1b[36m'; // Cyan
      case 'warning':
        return '\x1b[33m'; // Yellow
      case 'critical':
        return '\x1b[31m'; // Red
      default:
        return '\x1b[0m'; // Reset
    }
  }

  /**
   * Ensure alert directory exists
   */
  private ensureAlertDir(): void {
    if (!existsSync(this.alertDir)) {
      fs.mkdir(this.alertDir, { recursive: true }).catch((error) => {
        logger.error('Failed to create alert directory', error as Error, {
          dir: this.alertDir,
        });
      });
    }
  }

  /**
   * Generate unique alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

/**
 * Global alerting system instance
 */
export const alerting = new AlertingSystem({
  console: {
    enabled: true,
    minSeverity: 'warning',
  },
  file: {
    enabled: true,
    path: path.join(process.cwd(), '.weaver', 'alerts', 'alerts.log'),
    minSeverity: 'info',
  },
});
