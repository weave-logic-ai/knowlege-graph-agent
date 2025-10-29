/**
 * PM2 Process Manager
 * Manages service lifecycle using PM2
 */

import pm2 from 'pm2';
import type {
  ProcessManager,
  ServiceConfig,
  ProcessInfo,
  ServiceStatus,
  LogEntry,
  LogOptions,
  ServiceMetrics,
  ServiceInstance,
  ServiceState,
} from './types.js';
import { connectionPool } from './connection-pool.js';
import { metricsCache } from './metrics-cache.js';
import { commandLock } from './command-lock.js';
import { recoveryManager } from './recovery.js';
import { stateManager } from './state-manager.js';
import { logger } from '../utils/logger.js';

/**
 * PM2-based process manager implementation
 */
export class PM2ProcessManager implements ProcessManager {
  private eventBusInitialized = false;
  private eventBus: any = null;
  /**
   * Connect to PM2 daemon using connection pool
   */
  private async connect(): Promise<void> {
    await connectionPool.connect();

    // Initialize event bus on first connection
    if (!this.eventBusInitialized) {
      await this.initializeEventBus();
      this.eventBusInitialized = true;
    }
  }

  /**
   * Initialize PM2 event bus to listen for process lifecycle events
   */
  private async initializeEventBus(): Promise<void> {
    return new Promise((resolve, reject) => {
      pm2.launchBus((err, bus) => {
        if (err) {
          logger.error('Failed to initialize PM2 event bus', err);
          reject(err);
          return;
        }

        this.eventBus = bus;

        // Listen for process restart events
        bus.on('process:event', async (data: any) => {
          try {
            if (data.event === 'restart') {
              await this.handleRestart(data.process.name);
            } else if (data.event === 'start') {
              await this.handleStart(data.process.name);
            } else if (data.event === 'stop') {
              await this.handleStop(data.process.name);
            }
          } catch (error) {
            logger.error(`Error handling process:event ${data.event}`, error as Error, {
              service: data.process.name,
            });
          }
        });

        // Listen for process exceptions
        bus.on('process:exception', async (data: any) => {
          try {
            await this.handleException(data.process.name, data.data);
          } catch (error) {
            logger.error('Error handling process:exception', error as Error, {
              service: data.process.name,
            });
          }
        });

        // Listen for process exit events
        bus.on('process:exit', async (data: any) => {
          try {
            await this.handleExit(data.process.name, data.code);
          } catch (error) {
            logger.error('Error handling process:exit', error as Error, {
              service: data.process.name,
            });
          }
        });

        logger.info('PM2 event bus initialized successfully');
        resolve();
      });
    });
  }

  /**
   * Handle service restart event
   */
  private async handleRestart(serviceName: string): Promise<void> {
    logger.info(`Service ${serviceName} restarted`);

    // Record restart in recovery manager
    recoveryManager.recordRestart(serviceName);

    // Save state after restart
    try {
      const status = await this.getStatus(serviceName);
      await stateManager.saveState(serviceName, status, {
        lastRestart: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Failed to save state after restart for ${serviceName}`, error as Error);
    }

    // Invalidate cache
    metricsCache.invalidate(serviceName);
  }

  /**
   * Handle service start event
   */
  private async handleStart(serviceName: string): Promise<void> {
    logger.info(`Service ${serviceName} started`);

    // Reset circuit breaker on successful start
    recoveryManager.reset(serviceName);

    // Invalidate cache
    metricsCache.invalidate(serviceName);
  }

  /**
   * Handle service stop event
   */
  private async handleStop(serviceName: string): Promise<void> {
    logger.info(`Service ${serviceName} stopped`);

    // Save final state
    try {
      const status = await this.getStatus(serviceName);
      await stateManager.saveState(serviceName, status, {
        stoppedAt: new Date().toISOString(),
      });
    } catch (error) {
      logger.error(`Failed to save state on stop for ${serviceName}`, error as Error);
    }

    // Invalidate cache
    metricsCache.invalidate(serviceName);
  }

  /**
   * Handle service exception event
   */
  private async handleException(serviceName: string, errorData: any): Promise<void> {
    logger.error(`Service ${serviceName} threw exception`, new Error(errorData?.message || 'Unknown error'), {
      service: serviceName,
      error: errorData,
    });

    // Record failure in recovery manager
    recoveryManager.recordFailure(serviceName);

    // Check if service should be restarted
    const shouldRestart = await recoveryManager.shouldRestart(serviceName);

    if (shouldRestart) {
      logger.info(`Attempting automatic restart for ${serviceName}`);
      try {
        await this.restart(serviceName);
      } catch (error) {
        logger.error(`Failed to auto-restart ${serviceName}`, error as Error);

        // Open circuit breaker if restart fails
        recoveryManager.openCircuitBreaker(serviceName);
      }
    } else {
      logger.warn(`Circuit breaker open for ${serviceName}, skipping restart`);
      recoveryManager.openCircuitBreaker(serviceName);
    }
  }

  /**
   * Handle service exit event
   */
  private async handleExit(serviceName: string, exitCode: number): Promise<void> {
    logger.warn(`Service ${serviceName} exited with code ${exitCode}`);

    if (exitCode !== 0) {
      // Non-zero exit code indicates failure
      recoveryManager.recordFailure(serviceName);

      // Save state with exit code
      try {
        const status = await this.getStatus(serviceName);
        await stateManager.saveState(serviceName, status, {
          exitCode,
          exitedAt: new Date().toISOString(),
        });
      } catch (error) {
        logger.error(`Failed to save state on exit for ${serviceName}`, error as Error);
      }
    }

    // Invalidate cache
    metricsCache.invalidate(serviceName);
  }

  /**
   * Disconnect from PM2 daemon
   */
  async disconnect(): Promise<void> {
    await connectionPool.disconnect();
  }

  /**
   * Start a service
   */
  async start(config: ServiceConfig): Promise<ProcessInfo> {
    return commandLock.withLock(config.name, async () => {
      await this.connect();

      const pm2Config: any = {
        name: config.name,
        script: config.script,
        args: config.args?.join(' '),
        cwd: config.cwd || process.cwd(),
        interpreter: config.interpreter || 'node',
        env: config.env || {},

        // PM2-specific options
        instances: config.instances || 1,
        exec_mode: config.exec_mode || 'fork',
        max_memory_restart: config.max_memory_restart,
        max_restarts: config.max_restarts || 10,
        min_uptime: config.min_uptime || 5000,
        autorestart: true,

        // Logging
        out_file: config.logs?.stdout_file || `./logs/${config.name}-out.log`,
        error_file: config.logs?.stderr_file || `./logs/${config.name}-error.log`,
        log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
        merge_logs: true,

        // Advanced
        kill_timeout: 5000,
        listen_timeout: 3000,
        shutdown_with_message: true,
      };

      const processInfo = await new Promise<ProcessInfo>((resolve, reject) => {
        pm2.start(pm2Config, (err, proc) => {
          if (err) {
            reject(new Error(`Failed to start service ${config.name}: ${err.message}`));
            return;
          }

          if (!proc || (Array.isArray(proc) && proc.length === 0)) {
            reject(new Error(`Failed to start service ${config.name}: No process returned`));
            return;
          }

          const processData = Array.isArray(proc) ? proc[0] : proc;
          if (!processData) {
            reject(new Error(`Failed to start service ${config.name}: Invalid process data`));
            return;
          }

          resolve(this.toProcessInfo(processData));
        });
      });

      // Invalidate cache after start
      metricsCache.invalidate(config.name);

      return processInfo;
    });
  }

  /**
   * Stop a service
   */
  async stop(name: string, force = false): Promise<void> {
    return commandLock.withLock(name, async () => {
      await this.connect();

      await new Promise<void>((resolve, reject) => {
        const method = force ? 'delete' : 'stop';

        pm2[method](name, (err) => {
          if (err) {
            reject(new Error(`Failed to stop service ${name}: ${err.message}`));
            return;
          }
          resolve();
        });
      });

      // Invalidate cache after stop
      metricsCache.invalidate(name);
    });
  }

  /**
   * Restart a service
   */
  async restart(name: string): Promise<void> {
    return commandLock.withLock(name, async () => {
      await this.connect();

      await new Promise<void>((resolve, reject) => {
        pm2.restart(name, (err) => {
          if (err) {
            reject(new Error(`Failed to restart service ${name}: ${err.message}`));
            return;
          }
          resolve();
        });
      });

      // Invalidate cache after restart
      metricsCache.invalidate(name);
    });
  }

  /**
   * Get service status (with caching)
   */
  async getStatus(name: string): Promise<ServiceStatus> {
    // Check cache first
    const cached = metricsCache.getStatus(name);
    if (cached) {
      return cached;
    }

    await this.connect();

    const status = await new Promise<ServiceStatus>((resolve, reject) => {
      pm2.describe(name, (err, list) => {
        if (err) {
          reject(new Error(`Failed to get status for ${name}: ${err.message}`));
          return;
        }

        if (!list || list.length === 0) {
          resolve({
            state: 'stopped',
            restarts: 0,
          });
          return;
        }

        const proc = list[0];
        if (!proc) {
          resolve({
            state: 'stopped',
            restarts: 0,
          });
          return;
        }

        const env = proc.pm2_env as any;

        resolve({
          state: this.mapPM2Status(env.status),
          uptime: env.pm_uptime ? Date.now() - env.pm_uptime : undefined,
          restarts: env.restart_time || 0,
          last_restart: env.pm_uptime ? new Date(env.pm_uptime) : undefined,
          last_error: env.err_log_path,
          process: this.toProcessInfo(proc),
        });
      });
    });

    // Cache the result
    metricsCache.setStatus(name, status);

    return status;
  }

  /**
   * Get service logs
   */
  async getLogs(name: string, options: LogOptions): Promise<LogEntry[]> {
    await this.connect();

    // PM2 doesn't provide a built-in log API, so we need to read from files
    const status = await this.getStatus(name);
    const logFile = options.stderr ? status.last_error : undefined;

    if (!logFile) {
      return [];
    }

    // This is a simplified implementation
    // In production, you'd use fs to read and parse log files
    return [];
  }

  /**
   * Get service metrics (with caching)
   */
  async getMetrics(name: string): Promise<ServiceMetrics> {
    // Check cache first
    const cached = metricsCache.getMetrics(name);
    if (cached) {
      return cached;
    }

    const status = await this.getStatus(name);

    if (!status.process) {
      throw new Error(`Service ${name} is not running`);
    }

    const metrics: ServiceMetrics = {
      timestamp: new Date(),
      cpu: {
        percent: status.process.cpu_percent,
        user_time: 0,
        system_time: 0,
      },
      memory: {
        rss_mb: status.process.memory_mb,
        heap_used_mb: 0,
        heap_total_mb: 0,
        external_mb: 0,
      },
      process: {
        uptime_seconds: status.uptime ? status.uptime / 1000 : 0,
        restarts: status.restarts,
        status: status.state,
      },
    };

    // Cache the result
    metricsCache.setMetrics(name, metrics);

    return metrics;
  }

  /**
   * List all services (optimized with caching)
   */
  async list(): Promise<ServiceInstance[]> {
    await this.connect();

    const instances = await new Promise<ServiceInstance[]>((resolve, reject) => {
      pm2.list((err, list) => {
        if (err) {
          reject(new Error(`Failed to list services: ${err.message}`));
          return;
        }

        const instances: ServiceInstance[] = list.map((proc) => {
          const env = proc.pm2_env as any;

          const instance: ServiceInstance = {
            config: {
              name: proc.name || 'unknown',
              type: 'custom',
              enabled: true,
              script: env.pm_exec_path || '',
            },
            status: {
              state: this.mapPM2Status(env.status),
              uptime: env.pm_uptime ? Date.now() - env.pm_uptime : undefined,
              restarts: env.restart_time || 0,
              last_restart: env.pm_uptime ? new Date(env.pm_uptime) : undefined,
              process: this.toProcessInfo(proc),
            },
            events: [],
          };

          // Cache individual service status for faster subsequent queries
          metricsCache.setStatus(instance.config.name, instance.status);

          return instance;
        });

        resolve(instances);
      });
    });

    return instances;
  }

  /**
   * Convert PM2 process to ProcessInfo
   */
  private toProcessInfo(proc: any): ProcessInfo {
    const monit = proc.monit || {};
    const pm2Env = proc.pm2_env || {};

    return {
      pid: proc.pid || 0,
      ppid: pm2Env.ppid,
      cpu_percent: monit.cpu || 0,
      memory_mb: monit.memory ? monit.memory / (1024 * 1024) : 0,
      threads: 1,
      uptime: pm2Env.pm_uptime ? Date.now() - pm2Env.pm_uptime : undefined,
    };
  }

  /**
   * Map PM2 status to ServiceState
   */
  private mapPM2Status(status: string): ServiceState {
    const map: Record<string, ServiceState> = {
      online: 'running',
      stopping: 'stopping',
      stopped: 'stopped',
      launching: 'starting',
      errored: 'errored',
      'one-launch-status': 'running',
    };

    return map[status] || 'unknown';
  }
}

/**
 * Create and export singleton instance
 */
export const processManager = new PM2ProcessManager();
