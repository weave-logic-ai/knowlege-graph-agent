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

/**
 * PM2-based process manager implementation
 */
export class PM2ProcessManager implements ProcessManager {
  private connected = false;

  /**
   * Connect to PM2 daemon
   */
  private async connect(): Promise<void> {
    if (this.connected) return;

    return new Promise((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          reject(new Error(`Failed to connect to PM2: ${err.message}`));
          return;
        }
        this.connected = true;
        resolve();
      });
    });
  }

  /**
   * Disconnect from PM2 daemon
   */
  async disconnect(): Promise<void> {
    if (!this.connected) return;

    return new Promise((resolve) => {
      pm2.disconnect();
      this.connected = false;
      resolve();
    });
  }

  /**
   * Start a service
   */
  async start(config: ServiceConfig): Promise<ProcessInfo> {
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

    return new Promise((resolve, reject) => {
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
  }

  /**
   * Stop a service
   */
  async stop(name: string, force = false): Promise<void> {
    await this.connect();

    return new Promise((resolve, reject) => {
      const method = force ? 'delete' : 'stop';

      pm2[method](name, (err) => {
        if (err) {
          reject(new Error(`Failed to stop service ${name}: ${err.message}`));
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Restart a service
   */
  async restart(name: string): Promise<void> {
    await this.connect();

    return new Promise((resolve, reject) => {
      pm2.restart(name, (err) => {
        if (err) {
          reject(new Error(`Failed to restart service ${name}: ${err.message}`));
          return;
        }
        resolve();
      });
    });
  }

  /**
   * Get service status
   */
  async getStatus(name: string): Promise<ServiceStatus> {
    await this.connect();

    return new Promise((resolve, reject) => {
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
   * Get service metrics
   */
  async getMetrics(name: string): Promise<ServiceMetrics> {
    const status = await this.getStatus(name);

    if (!status.process) {
      throw new Error(`Service ${name} is not running`);
    }

    return {
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
  }

  /**
   * List all services
   */
  async list(): Promise<ServiceInstance[]> {
    await this.connect();

    return new Promise((resolve, reject) => {
      pm2.list((err, list) => {
        if (err) {
          reject(new Error(`Failed to list services: ${err.message}`));
          return;
        }

        const instances: ServiceInstance[] = list.map((proc) => {
          const env = proc.pm2_env as any;

          return {
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
        });

        resolve(instances);
      });
    });
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
