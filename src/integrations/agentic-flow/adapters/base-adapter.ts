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
export abstract class BaseAdapter<T> {
  protected module: T | null = null;
  protected instance: T | null = null;
  protected status: AdapterStatus = {
    available: false,
    initialized: false,
    lastChecked: new Date(),
  };

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
  protected canResolve(moduleName: string): boolean {
    try {
      // Use require.resolve if available (Node.js)
      if (typeof require !== 'undefined' && require.resolve) {
        require.resolve(moduleName);
        return true;
      }
      // In browser/ESM context, we can't synchronously check
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Ensure the adapter has been initialized
   *
   * @throws Error if not initialized
   */
  protected ensureInitialized(): void {
    if (!this.status.initialized) {
      throw new Error(`${this.getFeatureName()} adapter is not initialized`);
    }
  }

  /**
   * Mark the adapter as successfully initialized
   */
  protected markInitialized(): void {
    this.status.initialized = true;
    this.status.available = true;
    this.status.error = undefined;
    this.status.lastChecked = new Date();
  }

  /**
   * Mark the adapter as failed
   *
   * @param error - The error that caused failure
   */
  protected markFailed(error: Error): void {
    this.status.initialized = false;
    this.status.available = false;
    this.status.error = error.message;
    this.status.lastChecked = new Date();
  }

  /**
   * Attempt to dynamically import a module
   *
   * @param moduleName - Name of the module to load
   * @returns The loaded module or null if not available
   */
  protected async tryLoad<M = T>(moduleName: string): Promise<M | null> {
    try {
      const mod = await import(moduleName);
      this.status.available = true;
      this.status.lastChecked = new Date();
      return mod as M;
    } catch (error) {
      this.status.available = false;
      this.status.error =
        error instanceof Error ? error.message : String(error);
      this.status.lastChecked = new Date();
      return null;
    }
  }

  /**
   * Dispose of adapter resources
   */
  async dispose(): Promise<void> {
    this.module = null;
    this.instance = null;
    this.status.initialized = false;
  }

  /**
   * Get the current adapter status
   */
  getStatus(): AdapterStatus {
    return { ...this.status };
  }

  /**
   * Check if a specific capability is supported
   *
   * @param capability - The capability to check
   */
  supportsCapability(capability: string): boolean {
    return this.isAvailable();
  }

  /**
   * Reset the adapter state
   */
  reset(): void {
    this.module = null;
    this.status = {
      available: false,
      initialized: false,
      lastChecked: new Date(),
    };
  }

  /**
   * Log a message with the adapter's feature name as prefix
   *
   * @param level - Log level (debug, info, warn, error)
   * @param message - Message to log
   * @param data - Optional additional data to include
   */
  protected log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>
  ): void {
    const prefix = `[${this.getFeatureName()}]`;
    const formattedMessage = `${prefix} ${message}`;
    const logData = data ? ` ${JSON.stringify(data)}` : '';

    switch (level) {
      case 'debug':
        // Only log in development or if DEBUG is set
        if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
          console.debug(formattedMessage + logData);
        }
        break;
      case 'info':
        console.info(formattedMessage + logData);
        break;
      case 'warn':
        console.warn(formattedMessage + logData);
        break;
      case 'error':
        console.error(formattedMessage + logData);
        break;
    }
  }
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
