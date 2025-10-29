/**
 * Service Manager Types
 * Type definitions for service management system
 */

/**
 * Service status states
 */
export type ServiceState = 'stopped' | 'starting' | 'running' | 'stopping' | 'errored' | 'unknown';

/**
 * Service health check status
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';

/**
 * Log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Service type classification
 */
export type ServiceType = 'mcp-server' | 'weaver-agent' | 'custom';

/**
 * PM2 execution mode
 */
export type ExecMode = 'fork' | 'cluster';

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  name: string;
  type: ServiceType;
  enabled: boolean;

  // Execution configuration
  script: string;
  interpreter?: string;
  args?: string[];
  cwd?: string;
  env?: Record<string, string>;

  // Process management
  instances?: number;
  exec_mode?: ExecMode;
  max_memory_restart?: string;
  max_restarts?: number;
  min_uptime?: number;
  restart_delay?: number;

  // Health checks
  health?: HealthCheckConfig;

  // Logging
  logs?: LogConfig;

  // Metrics
  metrics?: MetricsConfig;

  // Dependencies
  dependencies?: string[];
  wait_for?: WaitForConfig[];

  // Metadata
  version?: string;
  description?: string;
  tags?: string[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Health check configuration
 */
export interface HealthCheckConfig {
  enabled: boolean;
  endpoint?: string;
  tcp_port?: number;
  interval: number;
  timeout: number;
  retries: number;
  startup_delay?: number;
}

/**
 * Logging configuration
 */
export interface LogConfig {
  directory: string;
  stdout_file?: string;
  stderr_file?: string;
  max_size?: string;
  max_files?: number;
  compress?: boolean;
}

/**
 * Metrics configuration
 */
export interface MetricsConfig {
  enabled: boolean;
  port?: number;
  endpoint?: string;
  collect_interval?: number;
}

/**
 * Wait for dependency configuration
 */
export interface WaitForConfig {
  service: string;
  timeout: number;
}

/**
 * Process information
 */
export interface ProcessInfo {
  pid: number;
  ppid?: number;
  cpu_percent: number;
  memory_mb: number;
  threads: number;
  fd_count?: number;
  uptime?: number;
}

/**
 * Service status information
 */
export interface ServiceStatus {
  state: ServiceState;
  uptime?: number;
  restarts: number;
  last_restart?: Date;
  last_error?: string;
  process?: ProcessInfo;
}

/**
 * Health check result
 */
export interface HealthCheckResult {
  status: HealthStatus;
  timestamp: Date;
  checks: {
    name: string;
    status: HealthStatus;
    message?: string;
    duration_ms?: number;
  }[];
  overall_health: HealthStatus;
}

/**
 * Service metrics
 */
export interface ServiceMetrics {
  timestamp: Date;
  cpu: {
    percent: number;
    user_time: number;
    system_time: number;
  };
  memory: {
    rss_mb: number;
    heap_used_mb: number;
    heap_total_mb: number;
    external_mb: number;
  };
  process: {
    uptime_seconds: number;
    restarts: number;
    status: ServiceState;
  };
  custom?: Record<string, number | string>;
}

/**
 * Log entry
 */
export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  service: string;
  process_id?: number;
  metadata?: Record<string, any>;
}

/**
 * Log query options
 */
export interface LogOptions {
  lines?: number;
  follow?: boolean;
  level?: LogLevel;
  since?: Date;
  grep?: string;
  json?: boolean;
  stderr?: boolean;
}

/**
 * Service event
 */
export interface ServiceEvent {
  type: 'start' | 'stop' | 'restart' | 'error' | 'health_change';
  timestamp: Date;
  message: string;
  metadata?: Record<string, any>;
}

/**
 * Service instance
 */
export interface ServiceInstance {
  config: ServiceConfig;
  status: ServiceStatus;
  health?: HealthCheckResult;
  metrics?: ServiceMetrics;
  events: ServiceEvent[];
}

/**
 * Service filter criteria
 */
export interface ServiceFilter {
  type?: ServiceType;
  state?: ServiceState;
  tags?: string[];
  enabled?: boolean;
}

/**
 * Service group
 */
export interface ServiceGroup {
  name: string;
  services: string[];
  start_order: string[];
  stop_order: string[];
}

/**
 * Process manager interface
 */
export interface ProcessManager {
  start(config: ServiceConfig): Promise<ProcessInfo>;
  stop(name: string, force?: boolean): Promise<void>;
  restart(name: string): Promise<void>;
  getStatus(name: string): Promise<ServiceStatus>;
  getLogs(name: string, options: LogOptions): Promise<LogEntry[]>;
  getMetrics(name: string): Promise<ServiceMetrics>;
  list(): Promise<ServiceInstance[]>;
}

/**
 * Service registry interface
 */
export interface ServiceRegistry {
  services: Map<string, ServiceInstance>;
  groups: Map<string, ServiceGroup>;

  register(config: ServiceConfig): Promise<void>;
  unregister(name: string): Promise<void>;
  get(name: string): ServiceInstance | undefined;
  list(filter?: ServiceFilter): ServiceInstance[];

  createGroup(name: string, services: string[]): Promise<void>;
  getGroup(name: string): ServiceGroup | undefined;
  addToGroup(group: string, service: string): Promise<void>;
  removeFromGroup(group: string, service: string): Promise<void>;
}

/**
 * Start command options
 */
export interface StartOptions {
  watch?: boolean;
  env?: string;
  port?: number;
  maxMemory?: string;
  maxRestarts?: number;
  logLevel?: LogLevel;
}

/**
 * Stop command options
 */
export interface StopOptions {
  force?: boolean;
  timeout?: number;
}

/**
 * Restart command options
 */
export interface RestartOptions {
  zeroDowntime?: boolean;
  wait?: number;
}

/**
 * Status command options
 */
export interface StatusOptions {
  json?: boolean;
  verbose?: boolean;
  refresh?: number;
}

/**
 * Metrics command options
 */
export interface MetricsOptions {
  duration?: string;
  format?: 'table' | 'json' | 'prometheus';
  export?: string;
}

/**
 * Stats command options
 */
export interface StatsOptions {
  format?: 'table' | 'json';
  sortBy?: 'cpu' | 'memory' | 'uptime' | 'restarts';
}

/**
 * Sync command options
 */
export interface SyncOptions {
  dryRun?: boolean;
  force?: boolean;
}

/**
 * Commit command options
 */
export interface CommitOptions {
  auto?: boolean;
  scope?: string;
}

/**
 * Monitor command options
 */
export interface MonitorOptions {
  refresh?: number;
  alerts?: boolean;
}
