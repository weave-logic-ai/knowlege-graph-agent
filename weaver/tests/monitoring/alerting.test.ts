/**
 * Alerting System Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { AlertingSystem } from '../../src/monitoring/alerting.js';
import path from 'node:path';

describe('AlertingSystem', () => {
  let alerting: AlertingSystem;
  const testAlertDir = path.join(process.cwd(), '.weaver', 'test-alerts');

  beforeEach(() => {
    alerting = new AlertingSystem(
      {
        console: { enabled: false }, // Disable console for tests
        file: {
          enabled: true,
          path: path.join(testAlertDir, 'alerts.log'),
        },
      },
      testAlertDir
    );
  });

  describe('Alert Triggering', () => {
    it('should trigger alert', async () => {
      await alerting.trigger({
        severity: 'info',
        title: 'Test Alert',
        message: 'This is a test alert',
        source: 'test',
      });

      const history = alerting.getHistory();
      expect(history.length).toBe(1);
      expect(history[0]?.title).toBe('Test Alert');
    });

    it('should trigger multiple alerts', async () => {
      await alerting.trigger({
        severity: 'info',
        title: 'Alert 1',
        message: 'Message 1',
        source: 'test',
      });

      await alerting.trigger({
        severity: 'warning',
        title: 'Alert 2',
        message: 'Message 2',
        source: 'test',
      });

      const history = alerting.getHistory();
      expect(history.length).toBe(2);
    });
  });

  describe('Threshold Configuration', () => {
    it('should add threshold', () => {
      alerting.addThreshold({
        metric: 'cpu_usage',
        operator: '>',
        value: 80,
        severity: 'warning',
        message: 'CPU usage exceeded 80%',
      });

      // Thresholds are added successfully (no error thrown)
      expect(true).toBe(true);
    });

    it('should trigger alert when threshold exceeded', async () => {
      alerting.addThreshold({
        metric: 'memory_mb',
        operator: '>',
        value: 100,
        severity: 'critical',
        message: 'Memory usage is {{value}}MB',
      });

      alerting.checkThresholds({ memory_mb: 150 }, 'test');

      const history = alerting.getHistory();
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]?.severity).toBe('critical');
    });

    it('should not trigger when threshold not exceeded', () => {
      alerting.addThreshold({
        metric: 'cpu_usage',
        operator: '>',
        value: 80,
        severity: 'warning',
        message: 'CPU high',
      });

      alerting.checkThresholds({ cpu_usage: 50 }, 'test');

      const history = alerting.getHistory();
      expect(history.length).toBe(0);
    });

    it('should remove threshold', () => {
      alerting.addThreshold({
        metric: 'test_metric',
        operator: '>',
        value: 100,
        severity: 'info',
        message: 'Test',
      });

      alerting.removeThreshold('test_metric');

      alerting.checkThresholds({ test_metric: 150 }, 'test');
      const history = alerting.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('Alert History', () => {
    it('should get alert history', async () => {
      await alerting.trigger({
        severity: 'info',
        title: 'Alert 1',
        message: 'Message 1',
        source: 'test',
      });

      await alerting.trigger({
        severity: 'warning',
        title: 'Alert 2',
        message: 'Message 2',
        source: 'test',
      });

      const history = alerting.getHistory();
      expect(history.length).toBe(2);
    });

    it('should filter history by severity', async () => {
      await alerting.trigger({
        severity: 'info',
        title: 'Info Alert',
        message: 'Info message',
        source: 'test',
      });

      await alerting.trigger({
        severity: 'critical',
        title: 'Critical Alert',
        message: 'Critical message',
        source: 'test',
      });

      const critical = alerting.getHistory(undefined, 'critical');
      expect(critical.length).toBe(1);
      expect(critical[0]?.severity).toBe('critical');
    });

    it('should limit history size', async () => {
      await alerting.trigger({
        severity: 'info',
        title: 'Alert 1',
        message: 'Message 1',
        source: 'test',
      });

      await alerting.trigger({
        severity: 'info',
        title: 'Alert 2',
        message: 'Message 2',
        source: 'test',
      });

      await alerting.trigger({
        severity: 'info',
        title: 'Alert 3',
        message: 'Message 3',
        source: 'test',
      });

      const history = alerting.getHistory(2);
      expect(history.length).toBe(2);
    });

    it('should clear history', async () => {
      await alerting.trigger({
        severity: 'info',
        title: 'Test',
        message: 'Test',
        source: 'test',
      });

      alerting.clearHistory();

      const history = alerting.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('Alert Export', () => {
    it('should export alerts as JSON', async () => {
      await alerting.trigger({
        severity: 'info',
        title: 'Export Test',
        message: 'Test message',
        source: 'test',
      });

      const filepath = await alerting.exportAlerts('json');

      expect(filepath).toBeTruthy();
      expect(filepath).toContain('.json');
    });

    it('should export alerts as CSV', async () => {
      await alerting.trigger({
        severity: 'warning',
        title: 'CSV Test',
        message: 'Test message',
        source: 'test',
      });

      const filepath = await alerting.exportAlerts('csv');

      expect(filepath).toBeTruthy();
      expect(filepath).toContain('.csv');
    });
  });
});
