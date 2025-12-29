/**
 * Base Adapter for Agentic-Flow Integrations
 *
 * Provides a common interface for optional agentic-flow module integrations.
 * Adapters gracefully degrade when dependencies are not available.
 *
 * @module integrations/agentic-flow/adapters/base-adapter
 */
/**
 * Adapter status tracking
 */
export interface AdapterStatus {
    /** Whether the underlying module is available */
    available: boolean;
    /** Whether the adapter has been initialized */
    initialized: boolean;
    /** Error message if initialization failed */
    error?: string;
    /** Timestamp of last status check */
    lastChecked: Date;
}
/**
 * Base class for agentic-flow adapters
 *
 * Provides common functionality for loading optional modules
 * and tracking availability status.
 *
 * @template T - The type of the underlying module
 */
export declare abstract class BaseAdapter<T> {
    protected module: T | null;
    protected instance: T | null;
    protected status: AdapterStatus;
    /**
     * Get the feature name for this adapter
     */
    abstract getFeatureName(): string;
    /**
     * Check if the adapter is available and initialized
     */
    abstract isAvailable(): boolean;
    /**
     * Initialize the adapter
     */
    abstract initialize(): Promise<void>;
    /**
     * Check if a module can be resolved (synchronous check)
     *
     * @param moduleName - Name of the module to check
     * @returns True if module can potentially be resolved
     */
    protected canResolve(moduleName: string): boolean;
    /**
     * Ensure the adapter has been initialized
     *
     * @throws Error if not initialized
     */
    protected ensureInitialized(): void;
    /**
     * Mark the adapter as successfully initialized
     */
    protected markInitialized(): void;
    /**
     * Mark the adapter as failed
     *
     * @param error - The error that caused failure
     */
    protected markFailed(error: Error): void;
    /**
     * Attempt to dynamically import a module
     *
     * @param moduleName - Name of the module to load
     * @returns The loaded module or null if not available
     */
    protected tryLoad<M = T>(moduleName: string): Promise<M | null>;
    /**
     * Dispose of adapter resources
     */
    dispose(): Promise<void>;
    /**
     * Get the current adapter status
     */
    getStatus(): AdapterStatus;
    /**
     * Check if a specific capability is supported
     *
     * @param capability - The capability to check
     */
    supportsCapability(capability: string): boolean;
    /**
     * Reset the adapter state
     */
    reset(): void;
    /**
     * Log a message with the adapter's feature name as prefix
     *
     * @param level - Log level (debug, info, warn, error)
     * @param message - Message to log
     * @param data - Optional additional data to include
     */
    protected log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void;
}
/**
 * Interface for adapters that support health checks
 */
export interface HealthCheckable {
    checkHealth(): Promise<{
        healthy: boolean;
        message?: string;
        details?: Record<string, unknown>;
    }>;
}
/**
 * Interface for adapters that track metrics
 */
export interface MetricsTrackable {
    getMetrics(): Record<string, number | string>;
    resetMetrics(): void;
}
//# sourceMappingURL=base-adapter.d.ts.map