#!/usr/bin/env tsx
/**
 * Start Monitoring System
 *
 * Starts the WebSocket server for real-time dashboard updates
 */

import { dashboardWS } from '../src/monitoring/websocket-server.js';
import { alerting } from '../src/monitoring/alerting.js';
import { logger } from '../src/utils/logger.js';

// Handle graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down monitoring system...');
  dashboardWS.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down monitoring system...');
  dashboardWS.stop();
  process.exit(0);
});

// Start monitoring
async function start() {
  try {
    logger.info('Starting monitoring system...');

    // Configure alerting
    alerting.addThreshold({
      metric: 'cpu_usage',
      operator: '>',
      value: 80,
      severity: 'warning',
      message: 'CPU usage exceeded 80%: {{value}}%',
    });

    alerting.addThreshold({
      metric: 'memory_mb',
      operator: '>',
      value: 500,
      severity: 'critical',
      message: 'Memory usage exceeded 500MB: {{value}}MB',
    });

    // Start WebSocket server
    dashboardWS.start(3001);

    logger.info('✅ Monitoring system started successfully');
    logger.info('   WebSocket server: ws://localhost:3001');
    logger.info('   Dashboard: http://localhost:3000/dashboard');
    logger.info('');
    logger.info('Press Ctrl+C to stop');
  } catch (error) {
    logger.error('Failed to start monitoring system', error as Error);
    process.exit(1);
  }
}

start();
