/**
 * Request Batching System
 *
 * Batches multiple MCP tool calls into a single round-trip for improved performance.
 * Collects requests within a configurable time window and executes them in parallel.
 */

import { logger } from '../../utils/logger.js';
import type { ToolHandler, ToolResult } from '../types/index.js';

/**
 * Batching configuration
 */
export interface BatchingConfig {
  /**
   * Time window in milliseconds to collect requests (default: 50ms)
   */
  windowMs: number;

  /**
   * Maximum batch size (default: 10)
   */
  maxBatchSize: number;

  /**
   * Enable/disable batching
   */
  enabled: boolean;
}

/**
 * Batched request
 */
interface BatchedRequest {
  id: string;
  toolName: string;
  params: any;
  timestamp: number;
  resolve: (result: ToolResult) => void;
  reject: (error: Error) => void;
}

/**
 * Batch execution result
 */
export interface BatchExecutionResult {
  batchId: string;
  requestCount: number;
  successCount: number;
  failureCount: number;
  totalTime: number;
  avgRequestTime: number;
}

/**
 * Request Batching Manager
 *
 * Automatically batches requests within a time window and executes them in parallel.
 */
export class RequestBatcher {
  private config: BatchingConfig;
  private pendingRequests: Map<string, BatchedRequest[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private batchCounter = 0;

  /**
   * Create a new request batcher
   *
   * @param config - Batching configuration
   */
  constructor(config: Partial<BatchingConfig> = {}) {
    this.config = {
      windowMs: config.windowMs || 50,
      maxBatchSize: config.maxBatchSize || 10,
      enabled: config.enabled !== false,
    };

    logger.debug('RequestBatcher initialized', { ...this.config } as Record<string, unknown>);
  }

  /**
   * Add a request to the batch queue
   *
   * @param toolName - Name of the tool to execute
   * @param params - Tool parameters
   * @param handler - Tool handler function
   * @returns Promise that resolves with the tool result
   */
  async batchRequest(
    toolName: string,
    params: any,
    handler: ToolHandler
  ): Promise<ToolResult> {
    if (!this.config.enabled) {
      // Batching disabled, execute immediately
      return handler(params);
    }

    return new Promise<ToolResult>((resolve, reject) => {
      const requestId = `${toolName}-${Date.now()}-${Math.random()}`;
      const request: BatchedRequest = {
        id: requestId,
        toolName,
        params,
        timestamp: Date.now(),
        resolve,
        reject,
      };

      // Add to pending requests for this tool
      if (!this.pendingRequests.has(toolName)) {
        this.pendingRequests.set(toolName, []);
      }

      const requests = this.pendingRequests.get(toolName)!;
      requests.push(request);

      logger.debug('Request queued for batching', {
        toolName,
        requestId,
        queueSize: requests.length,
      });

      // Check if we've hit max batch size - execute immediately
      if (requests.length >= this.config.maxBatchSize) {
        logger.debug('Max batch size reached, executing immediately', {
          toolName,
          batchSize: requests.length,
        });
        this.executeBatch(toolName, handler);
        return;
      }

      // Set or reset timer for this tool
      if (this.batchTimers.has(toolName)) {
        clearTimeout(this.batchTimers.get(toolName)!);
      }

      const timer = setTimeout(() => {
        this.executeBatch(toolName, handler);
      }, this.config.windowMs);

      this.batchTimers.set(toolName, timer);
    });
  }

  /**
   * Execute a batch of requests
   *
   * @param toolName - Name of the tool
   * @param handler - Tool handler function
   */
  private async executeBatch(
    toolName: string,
    handler: ToolHandler
  ): Promise<void> {
    const requests = this.pendingRequests.get(toolName) || [];
    if (requests.length === 0) {
      return;
    }

    const batchId = `batch-${++this.batchCounter}`;
    const startTime = Date.now();

    logger.info('Executing batch', {
      batchId,
      toolName,
      requestCount: requests.length,
    });

    // Clear pending requests and timer
    this.pendingRequests.delete(toolName);
    const timer = this.batchTimers.get(toolName);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(toolName);
    }

    // Execute all requests in parallel with error isolation
    const results = await Promise.allSettled(
      requests.map(async (request) => {
        try {
          const result = await handler(request.params);
          request.resolve(result);
          return { success: true, requestId: request.id };
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          request.reject(err);
          return { success: false, requestId: request.id, error: err };
        }
      })
    );

    // Calculate stats
    const successCount = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;
    const failureCount = results.length - successCount;
    const totalTime = Date.now() - startTime;
    const avgRequestTime = totalTime / requests.length;

    const executionResult: BatchExecutionResult = {
      batchId,
      requestCount: requests.length,
      successCount,
      failureCount,
      totalTime,
      avgRequestTime,
    };

    logger.info('Batch execution completed', { ...executionResult } as Record<string, unknown>);

    // Log individual failures
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && !result.value.success) {
        logger.error('Batch request failed', result.value.error as Error, {
          batchId,
          requestId: requests[index].id,
        });
      }
    });
  }

  /**
   * Flush all pending batches immediately
   *
   * @param handler - Tool handler function
   */
  async flushAll(handler: ToolHandler): Promise<void> {
    const toolNames = Array.from(this.pendingRequests.keys());

    logger.info('Flushing all pending batches', {
      toolCount: toolNames.length,
    });

    await Promise.all(
      toolNames.map((toolName) => this.executeBatch(toolName, handler))
    );
  }

  /**
   * Get batching statistics
   *
   * @returns Batching statistics
   */
  getStats(): {
    enabled: boolean;
    pendingToolTypes: number;
    totalPendingRequests: number;
    config: BatchingConfig;
  } {
    let totalPending = 0;
    for (const requests of this.pendingRequests.values()) {
      totalPending += requests.length;
    }

    return {
      enabled: this.config.enabled,
      pendingToolTypes: this.pendingRequests.size,
      totalPendingRequests: totalPending,
      config: this.config,
    };
  }

  /**
   * Update batching configuration
   *
   * @param config - Partial configuration to update
   */
  updateConfig(config: Partial<BatchingConfig>): void {
    this.config = { ...this.config, ...config };
    logger.info('Batching configuration updated', { ...this.config } as Record<string, unknown>);
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    logger.info('Shutting down request batcher');

    // Clear all timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();

    // Reject all pending requests
    for (const requests of this.pendingRequests.values()) {
      for (const request of requests) {
        request.reject(new Error('Request batcher shutting down'));
      }
    }
    this.pendingRequests.clear();
  }
}
