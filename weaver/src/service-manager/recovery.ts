/**
 * Service Recovery Manager
 * Handles crash recovery, restart logic, and failure management
 */

import { CircuitBreaker, calculateBackoff, sleep } from '../utils/error-recovery.js';
import { logger } from './logger.js';
import type { ServiceConfig, ServiceState } from './types.js';

/**
 * Recovery configuration
 */
export interface RecoveryConfig {
  maxRestarts: number;
  minUptime: number;
  restartDelay: number;
  restartBackoff: 'linear' | 'exponential';
  circuitBreaker?: boolean;
  failureThreshold?: number;
  saveState?: boolean;
  stateFile?: string;
}

/**
 * Service recovery state
 */
export interface RecoveryState {
  restartCount: number;
  lastRestartTime: number;
  lastSuccessfulStart: number;
  consecutiveFailures: number;
  circuitBreakerOpen: boolean;
  totalUptime: number;
}

/**
 * Recovery manager for service lifecycle
 */
export class RecoveryManager {
  private recoveryStates = new Map<string, RecoveryState>();
  private circuitBreakers = new Map<string, CircuitBreaker>();

  /**
   * Initialize recovery state for a service
   */
  initializeRecovery(serviceName: string, config: RecoveryConfig): void {
    this.recoveryStates.set(serviceName, {
      restartCount: 0,
      lastRestartTime: 0,
      lastSuccessfulStart: Date.now(),
      consecutiveFailures: 0,
      circuitBreakerOpen: false,
      totalUptime: 0,
    });

    if (config.circuitBreaker) {
      this.circuitBreakers.set(
        serviceName,
        new CircuitBreaker({
          failureThreshold: config.failureThreshold || 3,
          resetTimeout: 60000,
          halfOpenAttempts: 1,
        })
      );
    }
  }

  /**
   * Check if service should be restarted (simple version for PM2 event handlers)
   */
  async shouldRestart(serviceName: string): Promise<boolean>;
  /**
   * Check if service should be restarted (full version with config)
   */
  async shouldRestart(
    serviceName: string,
    config: RecoveryConfig
  ): Promise<{ restart: boolean; reason?: string; delay: number }>;
  /**
   * Implementation
   */
  async shouldRestart(
    serviceName: string,
    config?: RecoveryConfig
  ): Promise<boolean | { restart: boolean; reason?: string; delay: number }> {
    const state = this.recoveryStates.get(serviceName);
    if (!state) {
      return config ? { restart: false, reason: 'No recovery state', delay: 0 } : false;
    }

    // If no config provided, return simple boolean (for PM2 event handlers)
    if (!config) {
      const defaultMaxRestarts = 10;
      const maxExceeded = state.restartCount >= defaultMaxRestarts;
      const circuitOpen = state.circuitBreakerOpen;

      return !maxExceeded && !circuitOpen;
    }

    // Full implementation with config
    // Check max restarts
    if (state.restartCount >= config.maxRestarts) {
      logger.warn(`Service ${serviceName} exceeded max restarts`, {
        restarts: state.restartCount,
        max: config.maxRestarts,
      });
      return {
        restart: false,
        reason: `Max restarts (${config.maxRestarts}) exceeded`,
        delay: 0,
      };
    }

    // Check circuit breaker
    if (config.circuitBreaker) {
      const breaker = this.circuitBreakers.get(serviceName);
      if (breaker && breaker.getState() === 'open') {
        logger.warn(`Circuit breaker open for ${serviceName}`);
        return {
          restart: false,
          reason: 'Circuit breaker is open',
          delay: 0,
        };
      }
    }

    // Check minimum uptime (was service running long enough?)
    const uptime = Date.now() - state.lastSuccessfulStart;
    if (uptime < config.minUptime) {
      state.consecutiveFailures++;
      logger.warn(`Service ${serviceName} crashed before min uptime`, {
        uptime,
        minUptime: config.minUptime,
        consecutiveFailures: state.consecutiveFailures,
      });

      // If too many consecutive failures, stop restarting
      if (state.consecutiveFailures >= 3) {
        return {
          restart: false,
          reason: 'Too many consecutive rapid failures',
          delay: 0,
        };
      }
    } else {
      // Reset consecutive failures if service ran long enough
      state.consecutiveFailures = 0;
    }

    // Calculate restart delay
    const delay = this.calculateRestartDelay(serviceName, config);

    return { restart: true, delay };
  }

  /**
   * Calculate restart delay based on backoff strategy
   */
  private calculateRestartDelay(
    serviceName: string,
    config: RecoveryConfig
  ): number {
    const state = this.recoveryStates.get(serviceName);
    if (!state) return config.restartDelay;

    if (config.restartBackoff === 'exponential') {
      return calculateBackoff(
        state.restartCount,
        config.restartDelay,
        60000, // Max 60 seconds
        2,
        true
      );
    }

    // Linear backoff
    return config.restartDelay * (state.restartCount + 1);
  }

  /**
   * Record restart attempt
   */
  recordRestart(serviceName: string, success: boolean = true): void {
    const state = this.recoveryStates.get(serviceName);
    if (!state) return;

    state.restartCount++;
    state.lastRestartTime = Date.now();

    if (success) {
      state.lastSuccessfulStart = Date.now();
      state.consecutiveFailures = 0;

      logger.info(`Service ${serviceName} restarted successfully`, {
        restarts: state.restartCount,
      });
    } else {
      state.consecutiveFailures++;

      // Record failure in circuit breaker
      if (this.circuitBreakers.has(serviceName)) {
        const breaker = this.circuitBreakers.get(serviceName)!;
        // Circuit breaker will track failures internally
      }

      logger.error(`Service ${serviceName} restart failed`, {
        restarts: state.restartCount,
        consecutiveFailures: state.consecutiveFailures,
      });
    }
  }

  /**
   * Record a service failure
   */
  recordFailure(serviceName: string): void {
    const state = this.recoveryStates.get(serviceName);
    if (!state) return;

    state.consecutiveFailures++;

    // Record failure in circuit breaker
    if (this.circuitBreakers.has(serviceName)) {
      const breaker = this.circuitBreakers.get(serviceName)!;
      // Circuit breaker execute() will track failures internally
      breaker.execute(() => Promise.reject(new Error('Service failure'))).catch(() => {
        // Intentionally swallow error - we just want to record the failure
      });
    }

    logger.warn(`Recorded failure for service ${serviceName}`, {
      consecutiveFailures: state.consecutiveFailures,
    });
  }

  /**
   * Manually open circuit breaker for a service
   */
  openCircuitBreaker(serviceName: string): void {
    const state = this.recoveryStates.get(serviceName);
    if (state) {
      state.circuitBreakerOpen = true;
    }

    if (this.circuitBreakers.has(serviceName)) {
      // Circuit breaker doesn't have a direct "open" method,
      // but we can force it open by recording multiple failures
      const breaker = this.circuitBreakers.get(serviceName)!;
      for (let i = 0; i < 5; i++) {
        breaker.execute(() => Promise.reject(new Error('Force open'))).catch(() => {});
      }
    }

    logger.warn(`Circuit breaker opened for service ${serviceName}`);
  }

  /**
   * Reset recovery state
   */
  reset(serviceName: string): void {
    const state = this.recoveryStates.get(serviceName);
    if (state) {
      state.restartCount = 0;
      state.consecutiveFailures = 0;
      state.lastSuccessfulStart = Date.now();
    }
  }

  /**
   * Get recovery state
   */
  getState(serviceName: string): RecoveryState | undefined {
    return this.recoveryStates.get(serviceName);
  }

  /**
   * Save recovery state to file
   */
  async saveState(serviceName: string, stateFile: string): Promise<void> {
    const state = this.recoveryStates.get(serviceName);
    if (!state) return;

    const fs = await import('fs/promises');
    await fs.writeFile(stateFile, JSON.stringify(state, null, 2));
    logger.debug(`Saved recovery state for ${serviceName} to ${stateFile}`);
  }

  /**
   * Restore recovery state from file
   */
  async restoreState(serviceName: string, stateFile: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const content = await fs.readFile(stateFile, 'utf-8');
      const state = JSON.parse(content) as RecoveryState;
      this.recoveryStates.set(serviceName, state);
      logger.debug(`Restored recovery state for ${serviceName} from ${stateFile}`);
    } catch (error) {
      logger.warn(`Failed to restore state for ${serviceName}`, error);
    }
  }

  /**
   * Execute recovery with circuit breaker
   */
  async executeWithCircuitBreaker<T>(
    serviceName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const breaker = this.circuitBreakers.get(serviceName);
    if (!breaker) {
      return operation();
    }

    return breaker.execute(operation);
  }
}

/**
 * Singleton instance
 */
export const recoveryManager = new RecoveryManager();
