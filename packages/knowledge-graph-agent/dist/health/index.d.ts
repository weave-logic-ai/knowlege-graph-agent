/**
 * Health Monitoring Module
 *
 * Provides system health monitoring, diagnostics, and alerting.
 */
/**
 * Health status values
 */
export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy' | 'unknown';
/**
 * Component health information
 */
export interface ComponentHealth {
    /** Component name */
    name: string;
    /** Health status */
    status: HealthStatus;
    /** Optional message */
    message?: string;
    /** Last check time */
    lastCheck: Date;
    /** Response time in milliseconds */
    responseTime?: number;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}
/**
 * System-wide health information
 */
export interface SystemHealth {
    /** Overall status */
    status: HealthStatus;
    /** Component health details */
    components: ComponentHealth[];
    /** Check timestamp */
    timestamp: Date;
    /** System uptime in milliseconds */
    uptime: number;
}
/**
 * Memory metrics
 */
export interface MemoryMetrics {
    /** Heap used in bytes */
    heapUsed: number;
    /** Heap total in bytes */
    heapTotal: number;
    /** RSS in bytes */
    rss: number;
    /** External memory in bytes */
    external: number;
    /** Array buffers in bytes */
    arrayBuffers: number;
}
/**
 * Performance metrics
 */
export interface PerformanceMetrics {
    /** CPU usage percentage */
    cpuUsage?: number;
    /** Memory metrics */
    memory: MemoryMetrics;
    /** Event loop lag in milliseconds */
    eventLoopLag?: number;
    /** Active handles count */
    activeHandles?: number;
    /** Active requests count */
    activeRequests?: number;
}
/**
 * Health check function
 */
export interface HealthCheck {
    /** Check name */
    name: string;
    /** Check function */
    check: () => Promise<ComponentHealth>;
    /** Check interval in milliseconds */
    interval?: number;
    /** Critical component flag */
    critical?: boolean;
}
/**
 * Health monitor configuration
 */
export interface HealthMonitorConfig {
    /** Check interval in milliseconds */
    interval?: number;
    /** Timeout for individual checks */
    timeout?: number;
    /** Enable automatic checks */
    autoStart?: boolean;
}
/**
 * Health Monitor for tracking system health
 */
export declare class HealthMonitor {
    private checks;
    private results;
    private startTime;
    private intervalId?;
    private config;
    constructor(config?: HealthMonitorConfig);
    register(check: HealthCheck): void;
    unregister(name: string): void;
    check(): Promise<SystemHealth>;
    getLastStatus(): SystemHealth;
    getPerformanceMetrics(): PerformanceMetrics;
    start(): void;
    stop(): void;
    private timeout;
    private calculateOverallStatus;
}
export declare function createHealthMonitor(config?: HealthMonitorConfig): HealthMonitor;
export declare function createDatabaseCheck(dbPath: string): HealthCheck;
export declare function createCacheCheck(): HealthCheck;
export declare function createMemoryCheck(thresholdMB?: number): HealthCheck;
export declare function createDiskCheck(path: string): HealthCheck;
//# sourceMappingURL=index.d.ts.map