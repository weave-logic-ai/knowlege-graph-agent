/**
 * Service Manager Module
 * Centralized service management system
 */

export * from './types.js';
export * from './process-manager.js';
export * from './health-check.js';
export * from './metrics-collector.js';
export * from './logger.js';

// Re-export singleton instances for convenience
export { processManager } from './process-manager.js';
export { healthCheckService } from './health-check.js';
export { metricsCollector } from './metrics-collector.js';
export { logger } from './logger.js';
