/**
 * Service Manager Module
 * Centralized service management system
 */

export * from './types.js';
export * from './process-manager.js';
export * from './health-check.js';
export * from './metrics-collector.js';
export * from './logger.js';
export * from './recovery.js';
export * from './port-allocator.js';
export * from './database-recovery.js';
export * from './config-validator.js';
export * from './state-manager.js';
export * from './connection-pool.js';
export * from './metrics-cache.js';
export * from './command-lock.js';

// Re-export singleton instances for convenience
export { processManager } from './process-manager.js';
export { healthCheckService } from './health-check.js';
export { metricsCollector } from './metrics-collector.js';
export { logger } from './logger.js';
export { recoveryManager } from './recovery.js';
export { portAllocator } from './port-allocator.js';
export { databaseRecovery } from './database-recovery.js';
export { configValidator } from './config-validator.js';
export { stateManager } from './state-manager.js';
export { connectionPool } from './connection-pool.js';
export { metricsCache } from './metrics-cache.js';
export { commandLock } from './command-lock.js';
